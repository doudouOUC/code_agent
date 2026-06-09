# PR 13 — `feat(serve): preflight and env diagnostics routes` (#4175 Wave 3)

## Context

#4175 把 `qwen serve` 的 Wave 3 拆成三块：read-only status (PR 12 ✅ #4241)、MCP guardrails (PR 14 v1 ⏳ #4247)、preflight/env diagnostics (PR 13, 本 PR)。

PR 12 已经把 cell shape `ServeStatusCell { kind, status, error?, errorKind?, hint? }` 落进 `packages/cli/src/serve/status.ts:27` 并在 `/workspace/mcp` `/workspace/skills` `/workspace/providers` `/session/:id/context` `/session/:id/supported-commands` 五条路由打磨过；`docs/developers/qwen-serve-protocol.md:287` 现有文字明确把 preflight/env 推给后续 wave。PR 13 的任务是把这两条预留路由实际落地，配合 7 个 actionable `errorKind` 值（`missing_binary` / `blocked_egress` / `auth_env_error` / `init_timeout` / `protocol_error` / `missing_file` / `parse_error`），让远端客户端在还不能写入 daemon 的阶段，就能诊断出"daemon 起来了但跑不动"是什么原因。

四个被用户在 plan 阶段锁定的设计决策：

1. **零外发**：preflight 是纯快照，绝不主动 dial LLM endpoint（避免 read-only 路由产生流量 / 费用）。`blocked_egress` 仅在 daemon 已经吃过一次连接错误时回灌。
2. **env presence-only**：API key 类 cell 只回 `present: boolean`，不回长度、不回前缀、不回 hash。
3. **`errorKind` 在本 PR 收紧成 union**：`type ServeStatusErrorKind = 'missing_binary' | 'missing_file' | 'blocked_egress' | 'auth_env_error' | 'init_timeout' | 'protocol_error' | 'parse_error' | 'unknown_error'`。PR 12 的现存代码从未真正写过 `errorKind`，PR 14 v1 用的是另一字段 `disabledReason`，所以这是无破坏的窄化。
4. **daemon-direct 数据流**：cell 全部在 `httpAcpBridge.ts` 直接构造，不走 `extMethod` → `acpAgent.extMethod` switch；这样 daemon 刚启动还没 spawn ACP child 时也能答，零 ACP roundtrip。

PR 13 的依赖（PR 12）已 merged，依赖项目（`ServeStatusCell`、capability registry、`SERVE_STATUS_EXT_METHODS`、SDK 镜像层）都就位，本 PR 不再阻塞下游 — 它和正在 review 的 PR 14 v1 (#4247)、PR 16 (#4249)、PR 18 (#4250) 表面完全 disjoint。

## 路由形状（最终对外契约）

### `GET /workspace/preflight`

```jsonc
{
  "v": 1,
  "workspaceCwd": "/abs/path",
  "initialized": true,                  // daemon process up = always true
  "cells": [
    { "kind": "node_runtime",     "status": "ok",      "hint": "node v22.11.0 ≥ engines.node" },
    { "kind": "cli_binary",       "status": "ok",      "hint": "/usr/local/bin/qwen → /opt/qwen/dist/cli.js" },
    { "kind": "cli_entry",        "status": "ok" },
    { "kind": "workspace_dir",    "status": "ok" },
    { "kind": "qwen_home",        "status": "ok",      "hint": "/Users/x/.qwen" },
    { "kind": "acp_child_init",   "status": "ok" },    // or 'not_started' / 'error' with errorKind: 'init_timeout' | 'protocol_error'
    { "kind": "provider_egress",  "status": "unknown" }// 'error'+errorKind:'blocked_egress' only if last init/prompt threw a network errno
  ]
}
```

`cells` 顺序固定（contract — SDK reducer 可以位置寻址，但典型用法是按 `kind` 索引）。任一 cell 出错不影响其它 cell；构造期间整体 throw 才落 `errors: [ServeStatusCell]`。

### `GET /workspace/env`

```jsonc
{
  "v": 1,
  "workspaceCwd": "/abs/path",
  "cells": [
    { "kind": "platform",         "status": "ok",      "hint": "darwin 25.4.0 arm64" },
    { "kind": "cli_version",      "status": "ok",      "hint": "0.15.11" },
    { "kind": "qwen_home",        "status": "ok",      "hint": "/Users/x/.qwen (mtime: 2026-05-17T15:00Z)" },
    { "kind": "auth_file",        "status": "ok",      "hint": "oauth_creds.json (size: 1240, mtime: ...)" },
    { "kind": "env_OPENAI_API_KEY",      "status": "ok",       "hint": "set" },
    { "kind": "env_OPENAI_BASE_URL",     "status": "disabled", "hint": "unset" },
    { "kind": "env_OPENAI_MODEL",        "status": "disabled", "hint": "unset" },
    { "kind": "env_DASHSCOPE_API_KEY",   "status": "ok",       "hint": "set" },
    { "kind": "env_MOONSHOT_API_KEY",    "status": "disabled", "hint": "unset" },
    { "kind": "env_MODELSCOPE_API_KEY",  "status": "disabled", "hint": "unset" },
    { "kind": "env_ANTHROPIC_API_KEY",   "status": "disabled", "hint": "unset" }
  ]
}
```

**redaction 守则**：所有 env cell 只回 `status: 'ok'|'disabled'` 加文本 `hint: 'set'|'unset'`，绝不回值、长度、前缀、hash。`auth_file` 的 path/size/mtime 是 daemon-host 事实可以原样回（与 PR 12 `workspaceCwd` 政策一致），但**绝不**读取并回内容。

## 类型扩展（`packages/cli/src/serve/status.ts`）

```ts
// 新增（收紧 errorKind）
export type ServeStatusErrorKind =
  | 'missing_binary'
  | 'missing_file'
  | 'blocked_egress'
  | 'auth_env_error'
  | 'init_timeout'
  | 'protocol_error'
  | 'parse_error'
  | 'unknown_error';

// 现有 ServeStatusCell.errorKind 由 string 收紧为 ServeStatusErrorKind
export interface ServeStatusCell {
  kind: string;
  status: ServeStatus;
  error?: string;
  errorKind?: ServeStatusErrorKind;  // 收紧
  hint?: string;
}

// 新增路由响应类型
export interface ServeWorkspacePreflightStatus {
  v: typeof STATUS_SCHEMA_VERSION;
  workspaceCwd: string;
  initialized: boolean;
  cells: ServeStatusCell[];
  errors?: ServeStatusCell[];
}

export interface ServeWorkspaceEnvStatus {
  v: typeof STATUS_SCHEMA_VERSION;
  workspaceCwd: string;
  cells: ServeStatusCell[];
  errors?: ServeStatusCell[];
}

export function createIdleWorkspacePreflightStatus(workspaceCwd: string): ServeWorkspacePreflightStatus { ... }
export function createIdleWorkspaceEnvStatus(workspaceCwd: string): ServeWorkspaceEnvStatus { ... }

// SERVE_STATUS_EXT_METHODS 可加 workspacePreflight/workspaceEnv 兜底（即便 daemon-direct 不用，也保持枚举完整以便未来 ACP-side 扩展）
```

收紧风险评估：`grep "errorKind" packages/cli/src/serve/ packages/cli/src/acp-integration/acpAgent.ts -r` 现在唯一命中点就是 `status.ts:31` 的字段声明 — 没有 producer / consumer 受影响，PR 14 v1 (#4247) 用 `disabledReason` 不冲突，TypeScript 编译会立即抓出未来违规。

## Capability tags（`packages/cli/src/serve/capabilities.ts`）

```ts
// SERVE_CAPABILITY_REGISTRY 末尾追加
workspace_preflight: { since: 'v1' },
workspace_env: { since: 'v1' },
```

无条件 advertise（不加进 `CONDITIONAL_SERVE_FEATURES` Map）。

## 路由（`packages/cli/src/serve/server.ts`，紧贴现有 `/workspace/providers` 之后）

```ts
app.get('/workspace/preflight', async (_req, res) => {
  try {
    res.status(200).json(await bridge.getWorkspacePreflightStatus());
  } catch (err) {
    sendBridgeError(res, err, { route: 'GET /workspace/preflight' });
  }
});

app.get('/workspace/env', async (_req, res) => {
  try {
    res.status(200).json(await bridge.getWorkspaceEnvStatus());
  } catch (err) {
    sendBridgeError(res, err, { route: 'GET /workspace/env' });
  }
});
```

无 `mutate()` gate（read-only），与 PR 12 三条 workspace 路由一致。同时把这两条路径加到 `server.ts:73-87` 的路由清单 doc 注释里。

## 路由清单 doc 同步

`server.ts:73` 顶部 `*   - GET  /workspace/mcp` 注释列表追加：
```
*   - GET  /workspace/preflight
*   - GET  /workspace/env
```

## Bridge 实现（`packages/cli/src/serve/httpAcpBridge.ts`）

### 新增字段：`lastInitError`

`ChannelInfo`（或顶层 bridge state）增加 `lastInitError?: { errorKind: ServeStatusErrorKind; message: string; at: number }`。

- ACP child 初始化抛出时（`spawnOrAttach` / `withTimeout` 失败路径）由 `classifyAcpError` 分类后写入。
- 下一次成功 init 时清空。
- 让 preflight 的 `acp_child_init` cell 直接读这个字段，不需要等真的去 spawn。

```ts
function classifyAcpError(err: unknown): ServeStatusErrorKind {
  const msg = err instanceof Error ? err.message : String(err);
  if (/timed out|ETIMEDOUT/i.test(msg)) return 'init_timeout';
  if (/ECONNREFUSED|EAI_AGAIN|ENETUNREACH|ENOTFOUND/i.test(msg)) return 'blocked_egress';
  if (/ENOENT.*execPath|spawn .* ENOENT/i.test(msg)) return 'missing_binary';
  if (/JSON|parse/i.test(msg)) return 'parse_error';
  if (/protocol|ACP|method/i.test(msg)) return 'protocol_error';
  return 'unknown_error';
}
```

### 新增方法：`getWorkspacePreflightStatus` / `getWorkspaceEnvStatus`

放在现有 `getWorkspaceMcpStatus` / `getWorkspaceSkillsStatus` / `getWorkspaceProvidersStatus`（`httpAcpBridge.ts:3170`）之后，daemon-direct 不走 `requestWorkspaceStatus`：

```ts
async getWorkspacePreflightStatus(): Promise<ServeWorkspacePreflightStatus> {
  const cells: ServeStatusCell[] = [];
  cells.push(buildNodeRuntimeCell());        // process.versions.node vs engines.node
  cells.push(buildCliBinaryCell());          // process.execPath fs.access
  cells.push(buildCliEntryCell(cliEntry));   // cliEntry fs.access; missing_file 兜底
  cells.push(buildWorkspaceDirCell(boundWorkspace)); // fs.statSync isDirectory
  cells.push(buildQwenHomeCell());           // QWEN_DIR / $QWEN_HOME 解析
  cells.push(buildAcpChildInitCell(this.lastInitError, channelLiveCount > 0));
  cells.push(buildProviderEgressCell(this.lastInitError));
  return { v: 1, workspaceCwd: boundWorkspace, initialized: true, cells };
}

async getWorkspaceEnvStatus(): Promise<ServeWorkspaceEnvStatus> {
  const cells: ServeStatusCell[] = [];
  cells.push(buildPlatformCell());           // os.platform/release/arch
  cells.push(buildCliVersionCell());         // process.env.CLI_VERSION || pkg version
  cells.push(buildQwenHomeCell());           // 复用上面同名 builder
  cells.push(buildAuthFileCell());           // ~/.qwen/oauth_creds.json fs.stat
  for (const key of TRACKED_ENV_KEYS) {
    cells.push(buildEnvKeyCell(key));        // presence-only
  }
  return { v: 1, workspaceCwd: boundWorkspace, cells };
}
```

`TRACKED_ENV_KEYS` 列表（按现有 codebase grep 收敛）：`OPENAI_API_KEY` / `OPENAI_BASE_URL` / `OPENAI_MODEL` / `DASHSCOPE_API_KEY` / `MOONSHOT_API_KEY` / `MODELSCOPE_API_KEY` / `ANTHROPIC_API_KEY`。新增 provider 时这里同步加。

cell builder 函数（约 7 个 helper）放在 `httpAcpBridge.ts` 内的同一文件局部 scope，每个不超过 20 行；fs sync 调用一律包 try/catch，失败时 cell 的 `status: 'error'` + 对应 `errorKind`。

## SDK 镜像（`packages/sdk-typescript/src/daemon/`）

### `types.ts` 增加镜像类型

```ts
export type DaemonStatusErrorKind = ServeStatusErrorKind;  // 直接 re-export 或 mirror
export interface DaemonStatusCell { kind: string; status: DaemonStatus; error?: string; errorKind?: DaemonStatusErrorKind; hint?: string; }
export interface DaemonWorkspacePreflightStatus { v: 1; workspaceCwd: string; initialized: boolean; cells: DaemonStatusCell[]; errors?: DaemonStatusCell[]; }
export interface DaemonWorkspaceEnvStatus { v: 1; workspaceCwd: string; cells: DaemonStatusCell[]; errors?: DaemonStatusCell[]; }
```

### `DaemonClient.ts` 新增 helper（紧跟现有 `workspaceProviders()` 之后，`DaemonClient.ts:330`）

```ts
async workspacePreflight(): Promise<DaemonWorkspacePreflightStatus> {
  return await this.fetchWithTimeout(
    `${this.baseUrl}/workspace/preflight`,
    { headers: this.headers() },
    async (res) => {
      if (!res.ok) throw await this.failOnError(res, 'GET /workspace/preflight');
      return (await res.json()) as DaemonWorkspacePreflightStatus;
    },
  );
}

async workspaceEnv(): Promise<DaemonWorkspaceEnvStatus> { /* 同上 */ }
```

### `daemon/index.ts` + `sdk-typescript/src/index.ts` 重新导出新类型与方法名。

## 测试策略

### 1. 单测：`packages/cli/src/serve/server.test.ts`
- `describe('read-only status routes')` 块内追加 `it` 覆盖：
  - `/workspace/preflight` 200 + bridge mock cells 透传
  - `/workspace/env` 200 + presence-only assertion（响应里 grep "set"，断言**不**包含真实 API key 值）
  - 两路在 bridge throw 时落 500 经 `sendBridgeError`
  - 路由不被 `mutate()` gate（POST 拒、GET 通）
  - `--require-auth` 开启时仍可访问（read-only 不受 mutation gate 影响）— 复用 PR 15 测试 fixture

### 2. Bridge 测：`packages/cli/src/serve/httpAcpBridge.test.ts`
- `getWorkspacePreflightStatus` 在 ACP child 从未启动时仍能返回完整 cells（zero ACP roundtrip — 用 `expect(connection.extMethod).not.toHaveBeenCalled()` 断言）
- `lastInitError` 注入测试：手动 set `bridge.lastInitError = { errorKind: 'init_timeout', ... }` → 下次 preflight 的 `acp_child_init` cell `status: 'error'` + `errorKind: 'init_timeout'`
- `classifyAcpError` 单元化：表驱动 7 种 errno → 7 种 errorKind 映射
- `getWorkspaceEnvStatus` 用 `vi.stubEnv()` 控制 env 出现/缺失，断言 cell `hint` 为 `'set'|'unset'` 且响应 JSON.stringify 后**不包含**任何 fixture 值
- `auth_file` cell 在 `~/.qwen/oauth_creds.json` 不存在时落 `errorKind: 'missing_file'`，存在时落 `mtime`/`size` 但**不**回内容

### 3. Capability 测：`server.test.ts:559` 现有 `every conditional / current registers …` 测试套件
- 新加: `workspace_preflight` 和 `workspace_env` 在 v1 baseline features 里被无条件 advertise（不需要 `requireAuth` 等 toggle）
- `getRegisteredServeFeatures()` 长度 +2

### 4. SDK 测：`packages/sdk-typescript/test/unit/DaemonClient.test.ts`
- mock `fetch` 返回固定 payload → `await client.workspacePreflight()` 解析正确
- 5xx → 抛 `failOnError` 包装的错误，错误 message 含 `'GET /workspace/preflight'`
- 镜像 `DaemonStatusCell.errorKind` 是 union 类型（编译期断言：`const k: DaemonStatusErrorKind = 'unknown_error'` 通过、`= 'foo'` 不通过 — 用 `// @ts-expect-error` 断言锁住）

### 5. Schema 严格度测
- 添加一个 `errorKind exhaustiveness` 测试：cell builder 的所有错误路径必须命中 `ServeStatusErrorKind` 的某个值；用 `Record<ServeStatusErrorKind, true>` 字面量做编译期 reach 验证

## 文档

### `docs/developers/qwen-serve-protocol.md`
- 把 286-289 行那条"preflight/env checks belong to a later daemon status wave"改成正式条目
- `### \`GET /workspace/preflight\`` + `### \`GET /workspace/env\``，每段含示例 response 和 7 个 errorKind 含义表
- 强调"零外发探测，无副作用，幂等"

### `docs/users/qwen-serve.md`
- 在 operator 段加一个"How to debug a daemon that won't start"章节，举几个常见 errorKind 对应的修复动作（`missing_binary` → check `process.execPath`；`auth_env_error` → set `OPENAI_API_KEY`；`blocked_egress` → check firewall）

## 涉及文件汇总

```
packages/cli/src/serve/status.ts                           +60   (类型 + idle factories)
packages/cli/src/serve/capabilities.ts                     +2    (2 个 capability tag)
packages/cli/src/serve/index.ts                            +6    (re-export 新类型)
packages/cli/src/serve/server.ts                           +25   (2 路由 + doc 注释)
packages/cli/src/serve/server.test.ts                      +180  (路由测试)
packages/cli/src/serve/httpAcpBridge.ts                    +180  (lastInitError + classifyAcpError + 2 个 bridge 方法 + 7 个 cell builder)
packages/cli/src/serve/httpAcpBridge.test.ts               +120  (bridge 测试)
packages/sdk-typescript/src/daemon/types.ts                +30   (镜像类型)
packages/sdk-typescript/src/daemon/DaemonClient.ts         +30   (2 个 helper)
packages/sdk-typescript/src/daemon/index.ts                +6
packages/sdk-typescript/src/index.ts                       +6
packages/sdk-typescript/test/unit/DaemonClient.test.ts     +60
docs/developers/qwen-serve-protocol.md                     +120
docs/users/qwen-serve.md                                   +30
```

总计 ~850 行，1 个 PR — 与 PR 12 (#4241) 同量级。

## Engineering principles checklist (Stage 1.5)

- [x] **Independently mergeable** — main 在合并瞬间仍然可发布；只新增路由 + capability tag + SDK helper
- [x] **Backward compatible** — 全部纯加；`errorKind` 由 `string` 收紧成 union 是窄化（PR 12 现存代码 0 个 producer/consumer 写过此字段，TS 编译会即时抓未来违规）
- [x] **Default off** — N/A（read-only 路由，不调用就 0 副作用）
- [x] **`qwen serve` Stage 1 routes / SDK behavior preserved** — 既有 8 条路由 + capability registry + SDK shape 完全不变
- [x] **Gradual migration** — capability tag gated；老 daemon 没该 tag，SDK pre-flight 后才 opt-in
- [x] **Reversible** — 完全可单独 revert
- [x] **Tests-first** — 路由测 + bridge 测 + SDK 测 + capability 测 + errorKind exhaustiveness 测，五层

## 风险与边角问题

1. **`engines.node` 来源**：`packages/cli/package.json` 的 engines 字段在 bundle 后不稳定可读。最简方案：在 `status.ts` 里加 `MIN_NODE_VERSION = '22.0.0' as const`，与 package.json 手工同步；node-runtime cell 用 `semver.gte(process.versions.node, MIN_NODE_VERSION)`。一旦哪天升 23，两处一起改。

2. **`provider_egress` 的 `unknown` 状态**：daemon 还没尝试过 LLM 调用时，没有信号说明 egress 通不通。诚实落 `status: 'unknown'`，**不**编造 `'ok'`。issue body 也接受 `unknown` 作为 cell 状态（`ServeStatus` 已枚举该值）。

3. **`auth_file` 多 provider 候选**：oauth_creds.json 只是 qwen-OAuth 这一种；`OPENAI_API_KEY` 这种 env-key auth 不需要文件。auth_file cell 在 oauth-mode 用、env-key-mode 落 `status: 'disabled'` + `hint: 'oauth_creds.json absent (env-key auth path)'`，不算错误。

4. **`lastInitError` 多 channel 收敛**：post-#4113 是 1 daemon = 1 workspace = 1 ACP child（只有热替换时短暂多一个），`lastInitError` 放在 bridge 顶层（不放 ChannelInfo）就够了。多 channel 时取最近一次失败。

5. **SDK 类型 `errorKind` 收紧的下游影响**：`gh search code` 确认仓库内没有任何 SDK 消费者断言过 `errorKind` 的具体字符串，所以收紧不会破坏外部代码。post-merge 在 release notes 提一句"`errorKind` is now a union type" 即可。

6. **PR 14 v1 (#4247) 同期合并冲突**：PR 14 在 `capabilities.ts` 加 `mcp_guardrails` tag，PR 13 在同文件加 `workspace_preflight` / `workspace_env` tag — 两个 PR 都向 `SERVE_CAPABILITY_REGISTRY` 末尾追加 entry，rebase 二选一时只是简单 textual conflict，由后开 PR 一方解决（本 PR 在 PR 14 v1 之后，承担 conflict 解决）。

## 验证步骤

```bash
# 1. 类型/lint
npm run typecheck -w @qwen-code/qwen-code
npm run lint -w @qwen-code/qwen-code -- --max-warnings 0
npm run typecheck -w @qwen-code/sdk
npm run lint -w @qwen-code/sdk -- --max-warnings 0

# 2. 单测
npm test -w @qwen-code/qwen-code -- packages/cli/src/serve/server.test.ts
npm test -w @qwen-code/qwen-code -- packages/cli/src/serve/httpAcpBridge.test.ts
npm test -w @qwen-code/sdk -- DaemonClient.test.ts

# 3. 全量 serve 套件（确保 PR 12 + PR 14 v1 + PR 15 + PR 16 现有测试不回归）
npm test -w @qwen-code/qwen-code -- packages/cli/src/serve/

# 4. 端到端 smoke（手测）
node packages/cli/dist/cli.js serve --workspace /tmp/x --port 9876 &
curl http://127.0.0.1:9876/capabilities | jq '.features | index("workspace_preflight"), index("workspace_env")'  # 期望非 null
curl http://127.0.0.1:9876/workspace/preflight | jq '.cells[].kind'
curl http://127.0.0.1:9876/workspace/env | jq '.cells[].kind'
# 验证不含 API key 值：
OPENAI_API_KEY=secret123 node packages/cli/dist/cli.js serve --workspace /tmp/x --port 9877 &
curl http://127.0.0.1:9877/workspace/env | grep -F "secret123"  # 必须空 → 通过
```

## Final Implementation Status

- **PR #4175**: Could not be found (likely closed/superseded). The preflight/env diagnostics routes described in this plan were NOT shipped as a standalone PR 13.
- **Actual outcome**: The downstream PRs that this plan depended on all merged (#4241 on 2026-05-17, #4247 on 2026-05-18, #4249 on 2026-05-18, #4250 on 2026-05-18), but the `/workspace/preflight` and `/workspace/env` routes planned here do not appear in any of those PRs' diffs.
- **Key divergence**: This plan was never implemented as a separate PR. The preflight/env diagnostics scope may have been deprioritized or folded into a later wave. The `ServeStatusErrorKind` type narrowing and capability tags described here were not shipped.
- **Status**: Plan abandoned / not implemented as of 2026-06-09.
