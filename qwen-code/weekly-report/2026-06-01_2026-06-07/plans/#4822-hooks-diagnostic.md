# `/extensions` HTTP/ACP Diagnostic Surface 设计方案

## Context

Issue #4514 T3.9 跟踪 `/extensions`、`/settings`、`/hooks` 的 HTTP surface。`/hooks` 已 ship (#4822)，`/settings` 在 #4816 跟进。`/extensions` 是剩余项。

当前 `/extensions` 斜杠命令仅支持 interactive 模式（dialog-based TUI）。需要：
1. 只读 HTTP 诊断端点 `GET /workspace/extensions`
2. ACP extMethod 支持
3. SDK 客户端方法
4. `/extensions list` 在 ACP/non_interactive 模式下的文本输出

**不需要 session scope**：扩展是 workspace 级别的，没有 per-session 状态。

## 设计决策

### 1. 只暴露摘要，不重复详细配置

每种能力（MCP servers、skills、agents、hooks）已在各自的 `/workspace/mcp`、`/workspace/skills`、`/workspace/agents`、`/workspace/hooks` 端点上暴露，且带 `extensionName` 归属标签。`/workspace/extensions` 只返回能力计数摘要，不重复完整配置。

### 2. 敏感数据处理

- `resolvedSettings` 绝不序列化（可能含 keychain 中的 API key）
- `installMetadata.source` 通过 `redactUrlCredentials()` 脱敏（git URL 可能含 token）
- `path` 保留（同 hooks 的 `skillRoot`，认证客户端可见）
- `mcpServers`/`hooks` 原始配置不序列化（只计数）

### 3. 展示所有扩展（含禁用的）

`config.getExtensions()` 返回所有已安装扩展。`isActive` 字段标识有效状态，客户端可据此渲染"已禁用"标识。

## 响应类型设计

### ServeExtensionEntry

```typescript
interface ServeExtensionEntry {
  kind: 'extension';
  id: string;                               // SHA-256 hash, stable identifier for future mutations
  name: string;
  version: string;
  isActive: boolean;
  path: string;
  source?: string;                          // redacted install source URL
  installType?: ServeExtensionInstallType;  // 'git' | 'local' | 'link' | 'github-release' | 'npm'
  originSource?: ServeExtensionOriginSource; // 'QwenCode' | 'Claude' | 'Gemini'
  ref?: string;                             // git ref / release tag
  autoUpdate?: boolean;
  capabilities: ServeExtensionCapabilities;
}

interface ServeExtensionCapabilities {
  mcpServerCount: number;
  skillCount: number;
  agentCount: number;
  hookCount: number;
  commandCount: number;
  contextFileCount: number;
  channelCount: number;
  hasSettings: boolean;
}
```

### ServeWorkspaceExtensionsStatus

```typescript
interface ServeWorkspaceExtensionsStatus {
  v: 1;
  workspaceCwd: string;
  initialized: boolean;
  extensions: ServeExtensionEntry[];
  errors?: ServeStatusCell[];
}
```

### SDK 类型

`Daemon*` 前缀镜像：`DaemonExtensionEntry`、`DaemonExtensionCapabilities`、`DaemonWorkspaceExtensionsStatus` 等。

## 文件变更清单

### 1. `packages/acp-bridge/src/status.ts` — 类型 + 常量 + idle factory

- `SERVE_STATUS_EXT_METHODS` 添加 `workspaceExtensions: 'qwen/status/workspace/extensions'`
- 新增类型：`ServeExtensionInstallType`、`ServeExtensionOriginSource`、`ServeExtensionCapabilities`、`ServeExtensionEntry`、`ServeWorkspaceExtensionsStatus`
- 新增 `createIdleWorkspaceExtensionsStatus(workspaceCwd)` factory

### 2. `packages/acp-bridge/src/bridgeTypes.ts` — bridge 接口

- `AcpSessionBridge` 添加 `getWorkspaceExtensionsStatus(): Promise<ServeWorkspaceExtensionsStatus>`

### 3. `packages/acp-bridge/src/bridge.ts` — bridge 实现

- `getWorkspaceExtensionsStatus()` 委托 `requestWorkspaceStatus(SERVE_STATUS_EXT_METHODS.workspaceExtensions, () => createIdleWorkspaceExtensionsStatus(boundWorkspace))`

### 4. `packages/cli/src/acp-integration/acpAgent.ts` — builder + extMethod 分发

- `buildWorkspaceExtensionsStatus(config)` 私有方法
  - `config.getExtensions()` → map 为 `ServeExtensionEntry[]`
  - 每个扩展：计数 mcpServers/skills/agents/hooks/commands/contextFiles/channels
  - `installMetadata.source` 通过 `redactUrlCredentials()` 脱敏
  - catch block 返回 `initialized: false` + error cell
- `extMethod()` switch 添加 `SERVE_STATUS_EXT_METHODS.workspaceExtensions` case

### 5. `packages/cli/src/serve/workspace-service/types.ts` + `index.ts` — facade

- `DaemonWorkspaceService` 接口 + 实现
- 委托 `queryWorkspaceStatus(SERVE_STATUS_EXT_METHODS.workspaceExtensions, idle)`

### 6. `packages/cli/src/serve/server.ts` — REST 路由

```typescript
app.get('/workspace/extensions', async (req, res) => {
  try {
    const ctx = buildWorkspaceCtx(req, 'GET /workspace/extensions');
    res.status(200).json(await workspace.getWorkspaceExtensionsStatus(ctx));
  } catch (err) {
    sendBridgeError(res, err, { route: 'GET /workspace/extensions' });
  }
});
```

### 7. `packages/cli/src/serve/capabilities.ts` — 能力标签

- `SERVE_CAPABILITY_REGISTRY` 添加 `workspace_extensions: { since: 'v1' }`（always-on）

### 8. `packages/sdk-typescript/src/daemon/types.ts` — SDK 类型

- 镜像所有 `Daemon*Extension*` 类型

### 9. `packages/sdk-typescript/src/daemon/DaemonClient.ts` — SDK 客户端

- `workspaceExtensions(): Promise<DaemonWorkspaceExtensionsStatus>` — `GET /workspace/extensions`

### 10. `packages/sdk-typescript/src/daemon/index.ts` — barrel 导出

### 11. `packages/cli/src/serve/index.ts` — barrel 导出

- 导出 `createIdleWorkspaceExtensionsStatus` 和所有 `ServeExtension*` 类型

### 12. `packages/cli/src/ui/commands/extensionsCommand.ts` — 启用 ACP 模式

- `extensionsCommand.supportedModes`: `['interactive']` → `['interactive', 'non_interactive', 'acp']`
- 新增 `listExtensionsCommand` 子命令：文本输出已安装扩展列表（名称、版本、状态、source、能力摘要）
- 非 interactive 模式默认走 list 输出

## 实施顺序

1. types + constants + idle factory（`acp-bridge/status.ts`）
2. bridge interface + impl（`bridgeTypes.ts` + `bridge.ts`）
3. ACP agent builder + extMethod（`acpAgent.ts`）
4. workspace-service facade（`workspace-service/`）
5. REST route（`server.ts`）
6. capability tag（`capabilities.ts`）
7. SDK types + client + barrel（`sdk-typescript/`）
8. serve barrel exports（`serve/index.ts`）
9. slash command ACP mode（`extensionsCommand.ts`）
10. tests

步骤 1-2 可并行；步骤 7-8 可与 3-6 并行。

## 测试策略

1. **idle factory** — `createIdleWorkspaceExtensionsStatus` 返回预期 shape
2. **builder 测试** — 零扩展 / 多扩展（active+inactive）/ 能力计数 / source 脱敏 / 不泄露 resolvedSettings / 异常 fallback
3. **server.test.ts** — `GET /workspace/extensions` 200 + shape + call count
   - `EXPECTED_STAGE1_FEATURES` 添加 `workspace_extensions`
   - `EXPECTED_REGISTERED_FEATURES` 处理排序（从 spread 过滤 + 末尾按 registry 顺序追加）
   - `fakeBridge` 添加 `workspaceExtensionsImpl` + call counter
   - `queryWorkspaceStatus` switch 添加 `qwen/status/workspace/extensions` dispatch case
4. **capabilities** — `workspace_extensions` 出现在 `getRegisteredServeFeatures()`
5. **SDK** — `DaemonClient.workspaceExtensions()` mock 测试
6. **slash command** — non_interactive 模式返回 message / interactive 模式返回 dialog

## 审计记录

三轮审计后纳入的修正：

### 第一轮
- 补充 `id` 字段（SHA-256 hash）到 `ServeExtensionEntry`，作为稳定标识符

### 第二轮
- 明确测试中 `EXPECTED_STAGE1_FEATURES`、`EXPECTED_REGISTERED_FEATURES` 排序、`queryWorkspaceStatus` dispatch 的处理（hooks PR 经验教训）
- ACP 模式下只开放 `list` 子命令；`install`/`manage`/`explore` 保持 interactive-only
- SDK bundle size 可能需要 bump

### 第三轮（全面 review）
- **已验证** `config.getExtensions()` 返回全部已安装扩展（含 disabled），`config.getActiveExtensions()` 才是只返回 active 的 → 方案使用 `getExtensions()` 正确
- **已验证** `redactUrlCredentials` 从 `@qwen-code/qwen-code-core` 顶层导出可用，无需 deep import
- **不包含 updateAvailable**：检查更新需要网络调用（GitHub API/npm），不适合 status 端点；可作为 follow-up 的控制面操作
- **channels 是真实功能**（telegram/weixin/dingtalk/feishu 等实现），`channelCount` 有实际意义
- **slash command `/extensions list` 文本格式**：参考 CLI `qwen extensions list` 的 `extensionToOutputString()` 格式（name, version, path, source, enabled status, capabilities 列表）
- **与现有 status 端点的一致性**：`extension.name` 必须与 MCP/skill/agent cells 上的 `extensionName` 字段一致（已由 core 保证）

### 第四轮（边界情况 review）
- **扩展加载时序安全**：`config.initialize()` 在 `QwenAgent` 构建前完成，builder 使用 `this.config`（bootstrap config）无启动竞态
- **`-e` CLI flag 已正确处理**：`config.getExtensions()` 内部 respects override，`-e none` 返回空列表，builder 需处理空列表
- **linked 扩展路径正确**：`ext.path` 已由 `loadExtension()` 解析为原始源目录，无需特殊处理
- **无 installMetadata 的扩展**：手动放置的扩展可能没有 `.qwen-extension-install.json`，builder 必须对 `installMetadata` 全部使用 optional chaining（`ext.installMetadata?.type` 等）
- **bridge 接口命名**：`daemon_mode_b_main` 上是 `AcpSessionBridge`（有 `HttpAcpBridge` 别名）；目标分支决定用哪个名字
- **barrel 导出模式**：`serve/status.ts` 是 `export * from '@qwen-code/acp-bridge/status'`，在 acp-bridge 定义的类型自动通过 cli barrel 可用；`serve/index.ts` 需显式列出每个导出

## Final Implementation Status

- **PR status**: MERGED — PR #4832 "feat(serve): add extensions diagnostic HTTP/ACP surface (issue #4514 T3.9)" merged 2026-06-08. Related PRs #4822 (hooks) and #4816 (settings) also merged.
- **Summary**: The `/extensions` HTTP diagnostic surface was implemented as planned: REST route `GET /workspace/extensions`, ACP extMethod, SDK client method, capability tag, workspace-service facade, and the `/extensions list` slash command for non-interactive mode.
- **Key divergences**: Minimal. The implementation closely followed the plan's 12-file change list. The same file paths appear in both the plan and the actual diff (acp-bridge/status.ts, bridgeTypes.ts, bridge.ts, acpAgent.ts, capabilities.ts, server.ts, workspace-service/, SDK types/client, extensionsCommand.ts).
- **Files actually changed**: `packages/acp-bridge/src/{bridge,bridgeTypes,status}.ts`, `packages/cli/src/{acp-integration/acpAgent,serve/capabilities,serve/index,serve/server,serve/server.test,serve/workspace-service/index,serve/workspace-service/types,ui/commands/extensionsCommand}.ts`, `packages/sdk-typescript/src/daemon/{DaemonClient,index,types}.ts`
