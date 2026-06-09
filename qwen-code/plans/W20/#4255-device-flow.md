# PR 17 Implementation Plan — `feat(serve): approval tools init and MCP restart controls`

## Context

QwenLM/qwen-code 的 Mode B daemon 路线图（issue #4175）当前已完成到 Wave 4 PR 18（#4250，2026-05-18 05:14Z 合入）。Wave 4 还有 PR 16（#4249 review 中）与 PR 21（#4255 review 中），PR 17 是 issue 中标注「unblocked, 未认领」的下一站，因为它的 3 个依赖（PR 12 ✅ + PR 14 v1 ✅ + PR 15 ✅）都已经在 main 上。

**这个 PR 为什么需要：** 远程 TUI / channels / web / IDE 客户端目前能 `POST /session/:id/prompt`、能查 `/workspace/mcp` 等只读状态，但不能远程改"运行时姿态"——切 approval mode、临时禁用一个 tool、初始化新 workspace、显式重启卡住的 MCP server。这 4 个操作在本地 CLI 都有对应（slash command 或 `qwen init` 子命令），但都没有 HTTP 入口。PR 17 把它们抬到 daemon 协议层，并接上 PR 15 的 mutation gate、PR 7 的 `originatorClientId` 审计链、PR 14 v1 的 MCP 预算守卫。

**约束（来自 #4175）：**
- 复用 PR 15 的 `createMutationGate({strict: true})` —— 这是 Wave 4 第一批"全部 strict"的 mutation surface（继承 PR 16 #4249 的选择）
- MCP restart **必须先查 PR 14 v1 的 `getMcpClientAccounting()`** 判断"重启之后还在预算内吗"，避免一次 restart 触发 budget refusal cascade（disconnect→slot 释放→另一个 server 抢走→reconnect 被 `BudgetExhaustedError` 拒）
- 所有 4 个路由的事件 fan-out 都要带 `originatorClientId`（PR 7 stamp 链）
- **没有 `publishWorkspaceEvent`** —— PR 16 还在 review，本 PR 复用 PR 21 #4255 的"inline `bridge.broadcastWorkspaceEvent` deliberately distinct from PR 16's `publishWorkspaceEvent` to avoid merge conflict"做法，post-#4249 再做 fold-in

**预期结果：** 4 个新路由 + 4 个 capability tag + 4 个 SDK helper + 5 个新典型 SSE 事件类型，全部通过 mutation gate（strict），全部带 `originatorClientId` 审计。

---

## Prerequisite — Sync worktree to origin/main

worktree HEAD 在 `11ba3856d`（PR 13 之前+几个 spike），**比 origin/main 落后 2 个关键 PR**：

- `96219924a` — PR 14 v1（MCP guardrails + `getMcpClientAccounting`）
- `495d11f01` — PR 18（FileSystemService boundary，PR 17 不直接用但 main 在它之上）

开工前必做：

```bash
git fetch origin main
git pull --ff-only origin main
# 校验：
grep -n "getMcpClientAccounting" packages/core/src/tools/mcp-client-manager.ts  # 应有 hit
ls packages/cli/src/serve/fs/                                                    # 应该是 PR 18 的目录
```

否则计划里"调用 `getMcpClientAccounting()`"的语义都对不上。

---

## 设计决定（8 个关键问题的结论）

### 1. 4 个路由 strict 还是 non-strict？

**全部 `mutate({ strict: true })`。** 沿用 PR 16 #4249 / PR 21 #4255 的 Wave 4 选择。理由：
- approval-mode：直接改 session 的 auth posture，比 `POST /session/:id/prompt` 更敏感
- tools/enable：可以打开 `Bash` 这种重 tool
- init：写盘
- mcp/restart：杀子进程

只要 daemon 有 `--token`，4 个路由都强制要带 token；否则启动时已被 `--require-auth` 拒。

### 2. `POST /workspace/init` 到底做什么？

`initCommand`（`cli/src/ui/commands/initCommand.ts`）当前是 slash command，返回值是 `submit_prompt` —— 它**先 mechanical 创建空 `QWEN.md` 再让 LLM 分析填充**。HTTP daemon 路由不应该走"先 prompt LLM"那条路径，因为：
- 客户端没要一个 session
- 模型调用要钱要时间，不是 init 操作的本质
- 真要分析的话客户端可以 `POST /session/:id/prompt` 自己写 prompt

所以 PR 17 的 `POST /workspace/init` 路由 **= scaffold only**：
- 在 daemon `boundWorkspace/` 下创建空 `QWEN.md`（用 `getCurrentGeminiMdFilename()` 拿正确的文件名）
- 不写入 `.qwen/` 目录（保留给 settings PR）
- 不调 LLM
- Body: `{ force?: boolean, ifMissing?: boolean }` —— 默认 `ifMissing=true`，已存在 → 409 + body 报现状
- `force=true` 强制覆盖（与本地 slash command 的"User confirmed overwrite"等价）

文档明确说明"如需 AI 自动填充内容，客户端应 `POST /session/:id/prompt` 用自己想要的 prompt"——这是关注点分离。

### 3. 把 `initCommand` 的核心逻辑提到 core 还是只在 daemon 路由里重写？

**只在 daemon 路由里重写（≤30 行）。** `initCommand.action` 70% 是 UI 逻辑（`context.ui.addItem`、`React.createElement` 渲染、`confirm_action` 流程），只有 ≤10 行是 mechanical（`existsSync` → `writeFileSync('', 'utf8')`）。提核心反而要先重构 i18n 调用，PR 体积膨胀且收益小。

### 4. `tools/:name/enable` 的 enable 模型

qwen-code 目前**没有 per-tool toggle**：只有 MCP server 级别的 `setExcludedMcpServers` 和 legacy `coreTools` 白名单。PR 17 需要建立"per-tool 启用/禁用"的最小可行机制：

- **数据模型**：在 Workspace `Config` 里加 `disabledTools: Set<string>`，持久化到 `.qwen/settings.json`（key: `tools.disabled`），通过现有 `loadedSettings.setValue` 写入
- **入口**：`McpClientManager` 与 `ToolRegistry` 在 register tool 时 lookup `disabledTools`，命中则跳过注册
- **粒度**：tool 名（与 `ToolRegistry.tools` Map 的 key 一致）—— 既覆盖 built-in（`Bash`、`Read`、`Write`），也覆盖 MCP discovered tool（如 `mcp__github__create_issue`）
- **请求体**：`POST /workspace/tools/:name/enable` body: `{ enabled: boolean }` —— enable=true → 从 disabled set 移除；enable=false → 加入
- **副作用**：toggling 后**不重启 ToolRegistry**（避免拖延响应），但 emit `tool_toggled` 事件，下次 `ToolRegistry.refresh()` 或新 session 创建时生效。文档要写明"running session 不实时移除已注册的 tool；要立即清除该 tool 的可用性需先 `POST /workspace/tools/:name/enable {enabled:false}` 再 `POST /workspace/mcp/:server/restart`（如该 tool 来自 MCP）或 spawn 新 session"
- **未知 tool 名**：`POST /workspace/tools/never-existed/enable` → 200 + `{ accepted: true, registered: false }`（不报错，因为是 forward-looking — 用户可能预先禁用一个还没安装的 MCP tool）

### 5. `mcp/:server/restart` 的预算守卫

调 `getMcpClientAccounting()`，按以下规则决策：

```
accounting = getMcpClientAccounting()
if budgetMode === 'off' or clientBudget === undefined:
  proceed
elif targetServer in reservedSlots:
  # restart 等于 release + re-acquire 同一个 slot, 净 delta = 0
  proceed
elif accounting.total < accounting.clientBudget:
  # 还有空 slot
  proceed
else:
  refuse with HTTP 409 + errorKind: 'budget_exhausted' + event 'mcp_server_restart_refused'
```

边缘情形：
- 目标 server 名不存在于 `McpServers` 配置 → 404 + `errorKind: 'missing_file'`（不是 `not_found`，沿用 PR 13 的 `errorKind` 命名空间）
- 目标 server 已 `disabled: true`（手动或被 budget refused） → 400 + `errorKind: 'config_disabled'`（**新 errorKind**，需扩 `SERVE_ERROR_KINDS`）
  - 或者：复用现有的 `protocol_error`？不行，语义不符。建议加 `'config_disabled'` 这一个新值，文档同步
  - 备选：不加新值，return 200 + `{ skipped: true, reason: 'disabled' }`。**优先这个**，零协议变更
- 目标 server 正在 `discoverMcpToolsForServerInternal` 进行中（`serverDiscoveryPromises.has(name)`） → 409 + `errorKind: 'in_flight'`（已是 SERVE_ERROR_KINDS 没有这值——同样优先 return 200 + `{ skipped: true, reason: 'in_flight' }`，复用现有 inflight Promise）

**结论：不扩 `SERVE_ERROR_KINDS`**，所有"软"拒绝走 200 + `{ skipped: true, reason: 'in_flight'|'disabled'|'budget_would_exceed' }`，**仅硬错误**（auth / 404 / 500）走 HTTP 非 2xx。这跟 PR 14 v1 `BudgetExhaustedError` 在 discovery 路径上"refusal 不抛"的设计保持一致。

### 6. 4 个事件 + workspace fan-out 还是 session-scoped

| 事件 | 触发 | scope |
|---|---|---|
| `approval_mode_changed` | `POST /session/:id/approval-mode` 成功 | **session-scoped**（事件只对该 session 的订阅者有意义）|
| `tool_toggled` | `POST /workspace/tools/:name/enable` 成功 | **workspace-scoped**（影响所有 session 的下次 tool registry refresh）|
| `workspace_initialized` | `POST /workspace/init` 成功 | **workspace-scoped** |
| `mcp_server_restarted` | `POST /workspace/mcp/:server/restart` 成功 | **workspace-scoped** |
| `mcp_server_restart_refused` | 同上路由被 skipped | **workspace-scoped** |

workspace-scoped 事件复用 PR 21 #4255 引入的 `bridge.broadcastWorkspaceEvent(envelope)` —— 它对 `byId` Map 里所有 entry 调 `entry.events.publish`。PR 17 跟 PR 21 都加这个 helper 会冲突，**约定**：

- **如果 PR 21 先合入 main**：PR 17 直接复用 `broadcastWorkspaceEvent`
- **如果 PR 17 先合入 main**：在 PR 21 的 fold-in 里把两份 inline helper 合一
- **如果 PR 16 先合入**：把 `broadcastWorkspaceEvent` rename 到 `publishWorkspaceEvent` 跟 PR 16 对齐

在 PR 17 的实现里把 helper 命名为 `broadcastWorkspaceEvent`（不是 `publishWorkspaceEvent`），跟 PR 21 命名一致 —— 后续合并代价小。

### 7. ApprovalMode 路由的 trust 错误处理

`Config.setApprovalMode` 在 untrusted folder + privileged mode 下抛 `Error('Cannot enable privileged approval modes in an untrusted folder.')`。路由 catch 这个 Error，**根据消息回 403 + `errorKind: 'auth_env_error'`**（已有 errorKind，语义"环境/auth 不允许"贴近）。

drift 防御：在 `acpAgent.ts` 加一个 typed class `TrustGateError extends Error`，让 `Config.setApprovalMode` 改抛它（小改动 in scope）。`mapDomainErrorToErrorKind` 加规则 `if err instanceof TrustGateError return 'auth_env_error'`。这样后续不靠 message regex。

### 8. `tool_toggled` 与 `mcp_server_restarted` 是否 `originatorClientId` 必填？

跟 PR 8 / PR 11 一致：**当请求带了合法 `X-Qwen-Client-Id` 就 stamp，没带就 omit**（不强制）。SDK helper 都接 `clientId?: string` 参数，转发到 header。

---

## 文件级修改清单

### A) `packages/cli/src/serve/capabilities.ts`

加 4 个无条件 tag（紧邻 `workspace_preflight`）：
```ts
session_approval_mode_control: { since: 'v1' },
workspace_tool_toggle: { since: 'v1' },
workspace_init: { since: 'v1' },
workspace_mcp_restart: { since: 'v1' },
```

### B) `packages/cli/src/serve/server.ts`

新增 4 个路由，全部 `mutate({ strict: true })`，全部 `parseClientIdHeader`，错误走 `sendBridgeError`：

```ts
app.post('/session/:id/approval-mode', mutate({ strict: true }), async (req, res) => {
  const sessionId = req.params.id;
  const { mode, persist } = req.body ?? {};
  if (typeof mode !== 'string' || !APPROVAL_MODES.includes(mode as ApprovalMode)) {
    return res.status(400).json({ code: 'invalid_approval_mode', allowed: APPROVAL_MODES });
  }
  if (persist !== undefined && typeof persist !== 'boolean') {
    return res.status(400).json({ code: 'invalid_persist_flag' });
  }
  const clientId = parseClientIdHeader(req, res);
  if (clientId === null) return;
  try {
    const result = await bridge.setSessionApprovalMode(
      sessionId, mode as ApprovalMode, { persist: persist === true }, clientId,
    );
    res.status(200).json(result);
  } catch (err) {
    sendBridgeError(res, err, { route: 'POST /session/:id/approval-mode', sessionId });
  }
});

app.post('/workspace/tools/:name/enable', mutate({ strict: true }), async (req, res) => { /* ... */ });
app.post('/workspace/init', mutate({ strict: true }), async (req, res) => { /* ... */ });
app.post('/workspace/mcp/:server/restart', mutate({ strict: true }), async (req, res) => { /* ... */ });
```

更新文件顶部 route-list JSDoc。

### C) `packages/cli/src/serve/httpAcpBridge.ts`

在 `HttpAcpBridge` interface 加：
```ts
setSessionApprovalMode(
  sessionId: string,
  mode: ApprovalMode,
  opts: { persist: boolean },
  originatorClientId: string | undefined,
): Promise<{ sessionId: string; mode: ApprovalMode; previous: ApprovalMode; persisted: boolean }>;

setWorkspaceToolEnabled(
  toolName: string,
  enabled: boolean,
  originatorClientId: string | undefined,
): Promise<{ toolName: string; enabled: boolean; registered: boolean }>;

initWorkspace(
  opts: { force?: boolean },
  originatorClientId: string | undefined,
): Promise<{ path: string; action: 'created' | 'overwrote' | 'skipped' }>;

restartMcpServer(
  serverName: string,
  originatorClientId: string | undefined,
): Promise<
  | { serverName: string; restarted: true; durationMs: number }
  | { serverName: string; restarted: false; skipped: true; reason: 'in_flight' | 'disabled' | 'budget_would_exceed' }
>;
```

实现要点：

1. **`setSessionApprovalMode`**：route 经 ACP extMethod `qwen/control/session/approval_mode` → `acpAgent.ts` 调 `this.config.setApprovalMode(mode)`，catch `TrustGateError` 回 `mapDomainErrorToErrorKind`-friendly error
2. **`setWorkspaceToolEnabled`**：直接在 bridge 里操作 `loadedSettings.setValue(SettingScope.Workspace, 'tools.disabled', [...newSet])`，不经 ACP（settings 跟 ACP 子进程同 workspace 但是文件 IO，daemon 直写最快）。然后 emit `tool_toggled` workspace event
3. **`initWorkspace`**：直接在 bridge 里操作 `fs.promises.writeFile`，path = `boundWorkspace/<getCurrentGeminiMdFilename()>`。逻辑镜像 `initCommand` 的 mechanical 部分但 promisified
4. **`restartMcpServer`**：经 ACP extMethod `qwen/control/workspace/mcp/restart`，子进程内查 `mcpClientManager.getMcpClientAccounting()` 做预算守卫，proceed 时调 `discoverMcpToolsForServer(name, this.config)`（已 coalescing），把开始/结束打到 `durationMs`

新增 typed class（in `status.ts`）：
```ts
export class TrustGateError extends Error {
  constructor(message: string) { super(message); this.name = 'TrustGateError'; }
}
```
`mapDomainErrorToErrorKind`：`if (err instanceof TrustGateError) return 'auth_env_error';`

新增 helper（in `httpAcpBridge.ts`，与 PR 21 命名一致）：
```ts
private broadcastWorkspaceEvent(envelope: BridgeEventInput): void {
  for (const entry of this.byId.values()) {
    try { entry.events.publish(envelope); } catch (err) { /* debug log */ }
  }
}
```

### D) `packages/cli/src/acp-integration/acpAgent.ts`

`extMethod` switch 加 2 个新 case：
```ts
case 'qwen/control/session/approval_mode':
  return this.applyApprovalMode(params as { mode: ApprovalMode }) as unknown as Record<string, unknown>;
case 'qwen/control/workspace/mcp/restart':
  return this.restartMcpServerWithBudgetGuard(params as { serverName: string }) as unknown as Record<string, unknown>;
```

新增私有方法（约 100 行总）：
- `applyApprovalMode({mode})` → catch trust gate error 并 rethrow `TrustGateError`，return `{previous, current}`
- `restartMcpServerWithBudgetGuard({serverName})` → 
  - check `mcpClientManager.getMcpClientAccounting()` → 决策
  - case proceed：调 `mcpClientManager.discoverMcpToolsForServer(serverName, this.config)`
  - case skipped：return `{skipped: true, reason}`

### E) `packages/cli/src/serve/status.ts`

只加 `TrustGateError` typed class（见 C 节）。`SERVE_ERROR_KINDS` 不扩 —— 所有"软拒绝"走 200 而不是 errorKind。

### F) `packages/core/src/config/config.ts`

`setApprovalMode` 改抛 `TrustGateError`（小内联，跟 status.ts 解耦——不要让 core 依赖 cli/serve/status；把 `TrustGateError` 也定义到 core 的 `config.ts` 里，cli/serve/status.ts 用 `import type` + `instanceof` 检测靠 `err.name === 'TrustGateError'`）。

**最终方案**：`TrustGateError` 定义在 `packages/core/src/config/config.ts`，`cli/serve/status.ts` 的 `mapDomainErrorToErrorKind` 用 `err.name === 'TrustGateError'` 而不是 `instanceof`，避免跨包 instanceof 在重复打包下失效。

### G) `packages/core/src/tools/tool-registry.ts` & `mcp-client-manager.ts`

在 tool register 路径加 `disabledTools` lookup：
```ts
// tool-registry.ts registerTool(tool):
if (this.config.getDisabledTools().has(tool.name)) return;
```
新增 `Config.getDisabledTools(): Set<string>` 和 `Config.setDisabledTools(set: Set<string>)`，从 `settings['tools.disabled']` 反序列化。**接受 disable 后已 registered 的 tool 仍然可见**——文档明说"toggling does not unregister live tools; effective on next refresh"。

### H) `packages/sdk-typescript/src/daemon/DaemonClient.ts`

```ts
async setSessionApprovalMode(
  sessionId: string, mode: DaemonApprovalMode,
  opts?: { persist?: boolean }, clientId?: string,
): Promise<DaemonApprovalModeResult> { /* ... */ }

async setWorkspaceToolEnabled(
  toolName: string, enabled: boolean, clientId?: string,
): Promise<DaemonToolToggleResult> { /* ... */ }

async initWorkspace(
  opts?: { force?: boolean }, clientId?: string,
): Promise<DaemonInitWorkspaceResult> { /* ... */ }

async restartMcpServer(
  serverName: string, clientId?: string,
): Promise<DaemonMcpRestartResult> { /* ... */ }
```
镜像 `setSessionModel` (DaemonClient.ts:520-538) 的 `fetchWithTimeout` + `headers({...}, clientId)` + `failOnError` 模式。

### I) `packages/sdk-typescript/src/daemon/types.ts`

```ts
export const DAEMON_APPROVAL_MODES = ['plan', 'default', 'auto-edit', 'yolo'] as const;
export type DaemonApprovalMode = (typeof DAEMON_APPROVAL_MODES)[number];

export interface DaemonApprovalModeResult { sessionId: string; mode: DaemonApprovalMode; previous: DaemonApprovalMode; persisted: boolean; }
export interface DaemonToolToggleResult { toolName: string; enabled: boolean; registered: boolean; }
export interface DaemonInitWorkspaceResult { path: string; action: 'created' | 'overwrote' | 'skipped'; }
export type DaemonMcpRestartResult =
  | { serverName: string; restarted: true; durationMs: number }
  | { serverName: string; restarted: false; skipped: true; reason: 'in_flight' | 'disabled' | 'budget_would_exceed' };
```

加 drift detector test（`approvalMode.test.ts`）：walk core 的 `ApprovalMode` enum，断言每一个值都在 `DAEMON_APPROVAL_MODES`。

### J) `packages/sdk-typescript/src/daemon/events.ts`

扩 typed event union：
```ts
export type DaemonControlEvent =
  | ... // existing
  | DaemonEventEnvelope<'approval_mode_changed', { sessionId: string; previous: DaemonApprovalMode; next: DaemonApprovalMode; originatorClientId?: string }>
  | DaemonEventEnvelope<'tool_toggled', { toolName: string; enabled: boolean; originatorClientId?: string }>
  | DaemonEventEnvelope<'workspace_initialized', { path: string; action: 'created' | 'overwrote'; originatorClientId?: string }>
  | DaemonEventEnvelope<'mcp_server_restarted', { serverName: string; durationMs: number; originatorClientId?: string }>
  | DaemonEventEnvelope<'mcp_server_restart_refused', { serverName: string; reason: 'in_flight' | 'disabled' | 'budget_would_exceed'; originatorClientId?: string }>;
```
并扩 `DAEMON_KNOWN_EVENT_TYPE_VALUES`。

### K) Re-exports

`packages/cli/src/serve/index.ts`：export `TrustGateError`（only typed re-export）。
`packages/sdk-typescript/src/daemon/index.ts` + `packages/sdk-typescript/src/index.ts`：export `DAEMON_APPROVAL_MODES`、`DaemonApprovalMode`、4 个 `Daemon*Result` 类型。

---

## Idle 行为契约（与已有 GET 路由对齐）

| Route | ACP 空闲 | ACP 在线 |
|---|---|---|
| `POST /session/:id/approval-mode` | 404 `session_not_found`（session 必须存在才能改 mode）| 200 + event |
| `POST /workspace/tools/:name/enable` | **200 + event**（bridge 直接写 settings，不需要 ACP）| 200 + event |
| `POST /workspace/init` | **200 + event**（bridge 直接写盘）| 200 + event |
| `POST /workspace/mcp/:server/restart` | 409 `acp_channel_offline`（restart 必须经 ACP 子进程内的 `mcpClientManager`）| 200 + event 或 200 + skipped |

`tool_toggled` 和 `workspace_initialized` 即使没有 session 也会 broadcast（fan-out 是 no-op 但事件落到 daemon 日志）。

---

## 测试清单

**`packages/cli/src/serve/server.test.ts`**
- 4 个路由各 1 个 happy path（mocked bridge）
- 4 个路由各 1 个 invalid body → 400
- 4 个路由各 1 个 missing token → 401（mutation gate strict）
- `approval-mode`: invalid mode 字符串 → 400 + `allowed:` 列表
- `approval-mode`: `persist:true` 时写入 settings 并回 `persisted:true`；默认 `persisted:false` 不动 settings
- `tools/enable`: `enabled: 'truthy'` 非 boolean → 400
- `init`: 默认拒绝（已有 QWEN.md） → 409，`force: true` → 200
- `mcp/restart`: 不存在的 server → 404
- 已存在的 `every conditional tag advertises` 把 4 个新 tag 加进 `EXPECTED_STAGE1_FEATURES`

**`packages/cli/src/serve/httpAcpBridge.test.ts`**
- `setWorkspaceToolEnabled` 不 spawn ACP（idle handles check）
- `initWorkspace` 不 spawn ACP
- `setSessionApprovalMode` 经 ACP extMethod，TrustGateError 路径回 errorKind: 'auth_env_error'
- `restartMcpServer` budget 守卫：在 reservedSlots → proceed；total < budget → proceed；total == budget && not in reservedSlots → skipped reason='budget_would_exceed'
- `restartMcpServer` 不存在的 server name → throws SessionNotFoundError 类似错误
- `broadcastWorkspaceEvent` fan-out：3 个 entry → publish 调用 3 次；其中一个 entry.events 抛错不阻断其余

**`packages/cli/src/acp-integration/acpAgent.test.ts`**
- `extMethod qwen/control/session/approval_mode` happy path
- `extMethod qwen/control/session/approval_mode` untrusted folder + YOLO → throws TrustGateError
- `extMethod qwen/control/workspace/mcp/restart` 4 个决策分支（in_flight / disabled / budget_would_exceed / proceed）

**`packages/cli/src/acp-integration/approvalMode.test.ts` —— 新文件（drift detector）**
- walk `ApprovalMode` enum → 断言每个值都在 `DAEMON_APPROVAL_MODES`（防 SDK / core 漂移）

**`packages/core/src/tools/tool-registry.test.ts`**
- `disabledTools` 包含 'Bash' → register Bash 跳过；register 后 toggle 不影响已注册（文档约定）

**`packages/cli/src/serve/status.test.ts`**
- `mapDomainErrorToErrorKind: TrustGateError → auth_env_error`（新规则）

**`packages/sdk-typescript/test/unit/DaemonClient.test.ts`**
- `setSessionApprovalMode()` round-trip + clientId header
- `setWorkspaceToolEnabled()` round-trip
- `initWorkspace()` round-trip with `force`
- `restartMcpServer()` round-trip + skipped branch

**`integration-tests/cli/qwen-serve-routes.test.ts`**
- 把 4 个新 capability tag 加进 `expect(caps.features).toEqual([...])`

---

## 文档增改

**`docs/users/qwen-serve.md`**：5-6 行加 4 个新 mutation 路由 bullet，附"init 只创建空 QWEN.md，要 AI 填充请 POST /session/:id/prompt"一句澄清。

**`docs/developers/qwen-serve-protocol.md`** —— 约 180 行新段「Mutation: approval, tools, init, MCP restart」：
- 4 个新 capability tag
- 4 个 request body schema + response schema
- 4 个新 event 形状 + sample envelope
- MCP restart 的 budget 决策表（4 个分支）
- approval mode 与 trust folder 的交互（`auth_env_error` errorKind 出现条件）
- `tool_toggled` 与 ToolRegistry "next refresh" 的语义说明
- workspace-scoped fan-out 与 session-scoped 的区别
- 跨 PR 16 / PR 17 / PR 21 共享 `broadcastWorkspaceEvent` 的注释

---

## 借鉴 claude-code / opencode

### claude-code（参考价值最高）

1. **`mcp_reconnect` 的 SDK control request**（`src/services/mcp/client.ts:2137`）—— `reconnectMcpServerImpl(name, config)` 返回 `{client, tools, commands, resources}`，**原子替换** appState 里的对应条目。**借鉴**：`restartMcpServer` 路由返回值带 `durationMs` 字段对账。**不借鉴**：`disconnect→connect` 之间的 atomic state swap，因为 qwen-code 的 `discoverMcpToolsForServer` 内部已经做了。
2. **`set_permission_mode` 的 `prePlanMode`**（types/permissions.ts）—— claude 进入 plan 模式前记下 mode，退出还原。**对照**：qwen-code 的 `Config.getPrePlanMode()` 在 `config.ts:2467` 已经有这套，PR 17 路由要保留：进 PLAN 时记 prePlanMode，离 PLAN 时清掉（`setApprovalMode` 内部已实现）—— 但**返回值要带 `previous`**，让客户端能知道 "之前的 mode 是什么"，对应 claude 的 `PermissionModeChangedListener` 信号。
3. **`mcp_toggle` 的 `{disabledMcpServers[], enabledMcpServers[]}`**（`src/services/mcp/config.ts:1553`）—— claude 用两个 list（opt-out + opt-in）支持"默认禁用的 builtin"。**不借鉴**：qwen-code 没有"默认禁用的 builtin tool"概念，简化成单 `disabledTools: Set<string>` 即可。
4. **退避常量**（`useManageMCPConnections.ts:88-90`）：`MAX_RECONNECT_ATTEMPTS=5`, `INITIAL_BACKOFF_MS=1000`, `MAX_BACKOFF_MS=30000`。**不借鉴**：PR 17 的 restart 是显式用户触发，不需要 backoff（health monitor 已有自己的退避在 `mcp-client-manager.ts:1053`）。

### opencode

1. **`POST /mcp/:name/connect` + `disconnect`** 拆分（`packages/opencode/src/server/routes/...mcp.ts`）—— opencode 没有 `restart` 路由，靠 client 自己组合。**不借鉴**：拆成两个路由会让客户端需要 round-trip，HTTP latency 翻倍；qwen-code 已有 `discoverMcpToolsForServer` 原子实现 restart。**保持 `POST /workspace/mcp/:server/restart` 单路由**。
2. **session-scoped `POST /session/:id/init`**（`session.ts:202-216`）—— opencode 的 init 是 session 上下文里发 LLM prompt。**不借鉴**：PR 17 选了"scaffold only"的 workspace-level 路由，理由见设计决定 #2。
3. **`Permission.Ruleset` per-session merge**（`PATCH /session/:id`）—— opencode 没有 approval mode 概念，每个 tool 调用走规则匹配。**不借鉴**：qwen-code 已有 `ApprovalMode` 强模型，规则化反而是倒退。
4. **`Bus` 服务的 unbounded PubSub fan-out**（`bus/index.ts`）—— opencode 所有事件 fan-out 给所有订阅者。**部分借鉴**：`broadcastWorkspaceEvent` 用同样的"每个 entry 都 publish"策略，但保留 session-scoped 事件不动（approval mode 不该 fan-out 给别的 session）。

### 没有可借鉴的部分

- **`disabledTools` 持久化机制**：qwen-code 自己的 `loadedSettings.setValue` 已经能搞定，不需要 opencode 的 Effect Schema 那套
- **`broadcastWorkspaceEvent` 与 PR 16 / PR 21 的协调命名**：纯属本 issue 的 PR 顺序问题
- **`TrustGateError` typed class**：qwen-code 特定，core 的 `Config.setApprovalMode` 当前抛 plain Error，PR 17 顺手收紧

---

## Engineering principles checklist

- [x] Independently mergeable —— 仅依赖 PR 12 ✅ + PR 14 v1 ✅ + PR 15 ✅
- [x] Backward compatible —— 加路由 + 加 capability tag + 扩 typed event union（旧 SDK 直接 `kind: 'unknown'`，PR 4 已铺路）；core 的 `Config.setApprovalMode` 改 throw class 是 message 兼容的（`new TrustGateError(...)` 仍 `instanceof Error`）
- [x] Default off —— capability tag 显式宣告
- [x] `qwen serve` Stage 1 不变 —— `/health` / `/capabilities` / `/session` 全无变化
- [x] Reversible —— 删 4 个路由 + 4 个 capability tag + revert helper 即可
- [x] Tests-first —— 7 个测试文件覆盖 route / bridge / acp / drift / SDK / integration

---

## 推荐 commit 顺序（每步独立可构建可测）

1. **`feat(core): introduce TrustGateError for setApprovalMode`** —— 仅改 `config.ts` 抛 typed class + status.ts `mapDomainErrorToErrorKind` 加规则 + status.test.ts 加 case。不动路由
2. **`feat(core): add disabledTools workspace setting`** —— `Config.getDisabledTools/setDisabledTools`，ToolRegistry / McpClientManager register 路径加 lookup，core 测试覆盖；无路由
3. **`feat(serve): add session approval-mode mutation route`** —— `POST /session/:id/approval-mode` + bridge + acpAgent extMethod + SDK + capability tag + 单元覆盖 + `approval_mode_changed` event 类型
4. **`feat(serve): add workspace tool toggle route`** —— `POST /workspace/tools/:name/enable` + bridge（不经 ACP）+ SDK + capability tag + `tool_toggled` event + 引入 `broadcastWorkspaceEvent` helper
5. **`feat(serve): add workspace init route`** —— `POST /workspace/init` + bridge（不经 ACP）+ SDK + capability tag + `workspace_initialized` event
6. **`feat(serve): add MCP server restart route with budget guard`** —— `POST /workspace/mcp/:server/restart` + bridge + acpAgent extMethod + `getMcpClientAccounting` 守卫 + SDK + capability tag + `mcp_server_restarted` / `mcp_server_restart_refused` events + drift detector
7. **`docs(serve): mutation control routes protocol section`** —— 完整 180 行协议文档段

每步过 `npm run typecheck --workspace packages/cli && npm run typecheck --workspace packages/sdk-typescript` + 涉及的 vitest 范围。

---

## 关键文件路径

新增：
- `packages/cli/src/acp-integration/approvalMode.test.ts`（drift detector）

修改：
- `packages/core/src/config/config.ts`（TrustGateError + disabledTools API）
- `packages/core/src/tools/tool-registry.ts`（register 路径 lookup disabledTools）
- `packages/core/src/tools/mcp-client-manager.ts`（同上）
- `packages/cli/src/serve/status.ts`（mapDomainErrorToErrorKind 新规则）
- `packages/cli/src/serve/capabilities.ts`（4 个新 tag）
- `packages/cli/src/serve/server.ts`（4 个新路由 + JSDoc）
- `packages/cli/src/serve/httpAcpBridge.ts`（4 个新 interface 方法 + broadcastWorkspaceEvent）
- `packages/cli/src/serve/index.ts`（re-export）
- `packages/cli/src/acp-integration/acpAgent.ts`（2 个新 extMethod + 内部 builder）
- `packages/sdk-typescript/src/daemon/types.ts`（DaemonApprovalMode + 4 个 Result 类型）
- `packages/sdk-typescript/src/daemon/events.ts`（5 个新 event）
- `packages/sdk-typescript/src/daemon/DaemonClient.ts`（4 个 helper）
- `packages/sdk-typescript/src/daemon/index.ts`、`src/index.ts`（re-export）
- `packages/cli/src/serve/server.test.ts`、`httpAcpBridge.test.ts`、`status.test.ts`、`acpAgent.test.ts`、`tool-registry.test.ts`
- `packages/sdk-typescript/test/unit/DaemonClient.test.ts`
- `integration-tests/cli/qwen-serve-routes.test.ts`
- `docs/users/qwen-serve.md`、`docs/developers/qwen-serve-protocol.md`

## 复用的现成原语

- `createMutationGate({tokenConfigured, requireAuth})` —— `cli/src/serve/auth.ts:165-294`，PR 15
- `parseClientIdHeader(req, res)` —— `cli/src/serve/server.ts:1244`，PR 7
- `resolveTrustedClientId(entry, clientId)` —— `cli/src/serve/httpAcpBridge.ts:1657-1665`，PR 7
- `mapDomainErrorToErrorKind` —— `cli/src/serve/status.ts:358`，PR 13
- `sendBridgeError(res, err, ctx)` —— `cli/src/serve/server.ts` (existing pattern)
- `Config.setApprovalMode/getApprovalMode/getPrePlanMode` —— `core/src/config/config.ts:2459-2491`
- `APPROVAL_MODES` + `ApprovalMode` enum —— `core/src/config/config.ts:169-176`
- `McpClientManager.discoverMcpToolsForServer(name, cliConfig)` —— `core/src/tools/mcp-client-manager.ts:647`，已有 in-flight Promise coalescing
- `McpClientManager.getMcpClientAccounting()` —— `core/src/tools/mcp-client-manager.ts` PR 14 v1
- `ToolRegistry.registerTool` —— `core/src/tools/tool-registry.ts`
- `getCurrentGeminiMdFilename()` —— `core/` exported, used by `initCommand`
- `loadedSettings.setValue(scope, key, value)` —— settings 持久化
- `bridge.events.publish(envelope)` per-session SSE —— PR 4
- `fetchWithTimeout(url, init, consume)` + `this.headers({}, clientId)` + `failOnError` —— SDK pattern `DaemonClient.ts:520-538`

---

## 验证步骤

**单元 / 集成：**
```bash
git pull --ff-only origin main                                                       # 必须先同步
npm run typecheck --workspace packages/core
npm run typecheck --workspace packages/cli
npm run typecheck --workspace packages/sdk-typescript
npx vitest run packages/cli/src/serve/ packages/cli/src/acp-integration/
npx vitest run packages/core/src/tools/tool-registry.test.ts packages/core/src/config/config.test.ts
npx vitest run packages/sdk-typescript/test/unit/DaemonClient.test.ts
npx vitest run integration-tests/cli/qwen-serve-routes.test.ts
npx eslint packages/cli/src/serve packages/cli/src/acp-integration packages/sdk-typescript
```

**端到端冒烟（手工，本地起 daemon）：**
```bash
# 1. 启动 daemon
node packages/cli/dist/index.js serve --port 18080 --token testtok --workspace "$PWD" &

# 2. capability 看 4 个新 tag 已宣告
curl -s -H "Authorization: Bearer testtok" localhost:18080/capabilities | jq '.features | map(select(startswith("session_approval_mode") or startswith("workspace_tool_toggle") or startswith("workspace_init") or startswith("workspace_mcp_restart")))'
# 期望：4 个 tag

# 3. workspace init：第一次成功
curl -X POST -H "Authorization: Bearer testtok" -H "content-type: application/json" -d '{}' localhost:18080/workspace/init
# 期望：{path: ".../QWEN.md", action: "created"}

# 4. 第二次默认拒绝
curl -X POST -H "Authorization: Bearer testtok" -d '{}' localhost:18080/workspace/init
# 期望：HTTP 409

# 5. force 覆盖
curl -X POST -H "Authorization: Bearer testtok" -d '{"force":true}' localhost:18080/workspace/init
# 期望：action: "overwrote"

# 6. tool toggle + 验证持久化
curl -X POST -H "Authorization: Bearer testtok" -d '{"enabled":false}' localhost:18080/workspace/tools/Bash/enable
cat .qwen/settings.json | jq '.tools.disabled'
# 期望：["Bash"]

# 7. 起 session → 改 approval-mode
SID=$(curl -X POST -H "Authorization: Bearer testtok" -d '{}' localhost:18080/session | jq -r .sessionId)
curl -X POST -H "Authorization: Bearer testtok" -d '{"mode":"yolo"}' localhost:18080/session/$SID/approval-mode
# 期望：{sessionId, mode:"yolo", previous:"default"}

# 8. trust gate：在 untrusted folder 起 daemon 再切 yolo
mkdir /tmp/untrusted && cd /tmp/untrusted
node /path/to/cli serve --port 18081 --token testtok --workspace "$PWD" &
SID=$(curl -X POST -H "Authorization: Bearer testtok" -d '{}' localhost:18081/session | jq -r .sessionId)
curl -i -X POST -H "Authorization: Bearer testtok" -d '{"mode":"yolo"}' localhost:18081/session/$SID/approval-mode
# 期望：HTTP 403 + body 含 errorKind: "auth_env_error"

# 9. MCP restart：起 budget=1 + 2 个 server，先让一个 register，再尝试 restart 另一个
node packages/cli/dist/index.js serve --port 18082 --token testtok --mcp-client-budget 1 --mcp-budget-mode enforce --workspace "$PWD" &
# ... 让 server-A 起来填满 budget
curl -X POST -H "Authorization: Bearer testtok" localhost:18082/workspace/mcp/server-B/restart
# 期望：{restarted: false, skipped: true, reason: "budget_would_exceed"}

# 10. SSE 看事件 fan-out
curl -H "Authorization: Bearer testtok" -H "Accept: text/event-stream" -N localhost:18082/session/$SID/events &
# 在另一个终端 toggle tool / restart mcp
# 期望：tool_toggled / mcp_server_restarted / mcp_server_restart_refused 事件出现
```

---

## 已知风险 / 未决项

1. **`broadcastWorkspaceEvent` 与 PR 16 / PR 21 的命名协调** —— 见设计决定 #6，按 PR 合入顺序 fold-in。如果 PR 16 先合，本 PR 直接用 `publishWorkspaceEvent`；如果 PR 21 先合，本 PR 复用 `broadcastWorkspaceEvent`。**第一种情况发生的概率更高**（PR 16 更接近 merge），建议在 PR 17 opening commit 就用 `publishWorkspaceEvent` 名字并写注释说明 fallback。
2. **`Config` 包跨边界的 `TrustGateError`** —— core 抛、cli/serve 接。用 `err.name === 'TrustGateError'` 而非 `instanceof`，因为打包重复实例的 `instanceof` 不可靠。文档要标注 trade-off。
3. **`disabledTools` 持久化路径** —— `loadedSettings.setValue` 是同步写 settings.json，daemon 进程没有 file lock。两个 daemon（同一 workspace）并发 toggle 会 race。**用 PR 16 的"per-resolved-file Mutex"模式**——如果 PR 16 已合，复用其 helper；否则在 bridge 里加一个轻量 per-path `Promise` chain（10 行内）。
4. **`POST /workspace/init` 没有 `.qwen/` 目录扫描** —— 仅 mechanical 写 `QWEN.md`。如果用户期待"init 整个目录结构"会感到惊讶。文档头要明示"this route is intentionally minimal; for AI-driven scaffold use POST /session/:id/prompt"。
5. **MCP restart 的 in-flight tool call** —— claude-code 没做这个守卫，opencode 也没做。**不在 PR 17 加**——`discoverMcpToolsForServer` 已经原子（旧 client `disconnect()` 等待，新 client `connect()` 之后才 `register`）。后续如发现 race 单独处理。
6. **`originatorClientId` 不在 ACP 子进程里** —— `extMethod` 流不带 `originatorClientId`。**约定**：bridge 在收到 ACP 响应后，于 daemon 进程内 emit event 时自己 stamp（参考 PR 11 `session_close` 的 stamp pattern）。
7. **approval mode 路由的 settings 持久化** —— **已决：默认 ephemeral，body 接可选 `persist: boolean`，`persist:true` 时同时 `loadedSettings.setValue(SettingScope.Workspace, 'tools.approvalMode', mode)`**。理由：远程调用者通常只想临时切 mode，不应默认污染用户主机上的 settings；本地 CLI 行为（持久写盘）是交互式默认而非协议默认。文档要明示。

8. **CLI 对齐 `/tools enable|disable`** —— **已决：本 PR 不加 CLI slash command**。PR 17 只负责 daemon HTTP 路由 + core 的 `disabledTools` 基础设施。若要 CLI 端 toggle，开独立后续 PR（不阻塞 Wave 4）。

## 顺手要做的小工程清理（可单独 commit）

- `Config.setApprovalMode` 改抛 `TrustGateError` 替代 plain Error（步骤 1）
- `mapDomainErrorToErrorKind` 加 `TrustGateError → auth_env_error` 规则（步骤 1）
- `disabledTools` Set 持久化到 settings + register 路径 lookup（步骤 2 ——为本 PR 服务，但本身是 core 通用基础设施）

## Final Implementation Status

- **PR status**: Implemented as PR #4282, MERGED on 2026-05-18. Dependencies #4249 (PR 16), #4250 (PR 18), #4255 (PR 21) all merged same day.
- **What was implemented**: All 4 mutation routes (`POST /session/:id/approval-mode`, `POST /workspace/tools/:name/enable`, `POST /workspace/init`, `POST /workspace/mcp/:server/restart`) with strict mutation gate, `originatorClientId` audit, budget guard on MCP restart, `TrustGateError` typed class, `disabledTools` workspace setting, 4 capability tags, SDK helpers, and event types.
- **Key divergences**: Implementation closely followed the plan. Files match: `acpAgent.ts`, `config.ts`, `settingsSchema.ts`, `capabilities.ts`, `httpAcpBridge.ts/.test.ts`, `server.ts/.test.ts`, `status.ts/.test.ts`, `tool-registry.ts/.test.ts`, `mcp-client-manager.ts`, `DaemonClient.ts`, SDK types/events, plus an `approval-mode-drift.test.ts` drift detector. A follow-up fix PR #4297 was also merged (2026-05-31) for P2 corrections from Codex review.
- **Files actually changed**: 30 files across `packages/cli/`, `packages/core/`, `packages/sdk-typescript/`, `integration-tests/`, and `docs/`.
