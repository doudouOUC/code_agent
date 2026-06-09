# `/settings` Slash Command for Web-Shell — Implementation Plan

## Context

Web-shell 缺少 `/settings` 命令（#4514 T3.9）。CLI 有完整的 SettingsDialog（958 行 Ink 组件），支持 ~38 个 `showInDialog: true` 的配置项，User/Workspace 两个 scope。但 daemon 层没有通用的 settings CRUD API，web-shell 也没有 SettingsDialog 组件。

目标：让 web-shell 用户可以通过 `/settings` 查看和修改配置，体验与 CLI 的 `/settings` 对齐。

## 审计发现（六轮，影响设计的关键约束）

### 第一轮：Settings 基础设施

1. **无值校验层**：schema 定义了 type/options 但没有 `validateSettingValue()` 函数。TUI 依赖 UI 控件约束。HTTP API 必须新增服务端校验。
2. **Language options 动态注入**：`general.language` 的 options 在静态 schema 中是空数组，必须调用 `getSettingsSchema()` 才能拿到真实选项。
3. **`setValue` 深合并 + 重新读盘**：每次 `persistSetting` 在 lock 内 fresh `loadSettings()`。批量写入应共享单次 `loadSettings()`。
4. **`SETTINGS_DIALOG_ORDER` 有过期条目**：`general.disableAutoUpdate` vs schema 的 `general.enableAutoUpdate`。route 侧用 schema key。
5. **只有 User 和 Workspace scope 可写**：System/SystemDefaults 只读。POST 拒绝非 user/workspace。

### 第二轮：Web-shell Dialog 模式

6. **Sub-dialog 无内置栈**：McpDialog 用多视图嵌入实现 drill-down。SettingsDialog 用 close-and-open 跳转。
7. **`data-keyboard-scope` 截获 input 按键**：inline edit 必须加 `editMode` 状态守卫。
8. **`dialog-form` 和 `dialog-split` 原语可用但未被使用**：可直接用于 settings。
9. **Fire-and-reload 模式**：ToolsDialog 不做乐观更新。settings 同。

### 第三轮：Daemon HTTP 层 + 安全

10. **安全边界 = `showInDialog: true`**：所有危险 settings（hooks、permissions、mcpServers、env、tools.sandbox、tools.discoveryCommand）全部 `showInDialog: false`。限制写入到 `showInDialog: true` 是安全的。
11. **`mutate({ strict: true })` 必须用**：防止无 token loopback 环境的未授权写入。`POST /workspace/tools/:name/enable` 用了 strict，settings 路由同。
12. **工具 toggle 无 ACP roundtrip**：纯文件 IO + event 广播。settings 路由遵循相同模式。
13. **VS Code 扩展绕过 daemon 直接写文件**：存在竞态风险但不阻塞 web-shell 方案。后续统一迁移到 daemon API。
14. **无 rate limiting**：1000 个快速写入 = 2000 次文件操作串行排队。记录为后续优化项。
15. **两个 `broadcastWorkspaceEvent` 实现**：local closure（简单，tool_toggled 用）vs member method（有 accounting）。settings 用 local closure 即可。

### 第四轮：SDK Hook + Event + i18n

16. **Workspace event signals 在 `DaemonSessionProvider` 而非 `DaemonWorkspaceProvider`**：信号来自 SSE 流（session 级）。`settingsVersion` 加到 session provider 的 `bumpWorkspaceEventSignals`。
17. **事件两层命名**：wire 层 `settings_changed` → UI 层 `workspace.settings.changed`。两处都要注册。
18. **新 event type 需要 7+ 文件改动**：SDK events.ts（类型 + guard + reducer）+ session provider（signal bump）+ daemon 端 emit。
19. **`useWorkspaceEventReload` 跳过首次 version**：mount 时不触发 reload，只有后续变化才触发。这是设计意图。
20. **`useDaemonResource` 有 stale-response 防护**：monotonic sequence counter，老响应自动丢弃。直接复用。
21. **i18n 是 flat record + `namespace.key`**：添加 `settings.*` 命名空间到 EN 和 ZH 字典即可。
22. **Tool toggle 对运行中 session 无即时效果**：多数 settings 同。只有 approval mode 即时生效。
23. **Integration test 模式**：`qwen-serve-routes.test.ts` 启动真实 serve 进程 + DaemonClient 调用。settings 路由测试遵循此模式。

### 第五轮：Bridge + 副作用 + Workspace Service

24. **`DaemonWorkspaceService`（#4563）是正确的架构归属**：facade 已持有 `persistDisabledTools` + `publishWorkspaceEvent`。如果 #4563 先合入，settings 的 `persistSetting` 回调应加到 `DaemonWorkspaceServiceDeps`；否则暂放 `BridgeOptions`。
25. **只有 `tools.approvalMode` 有 daemon 侧副作用**：vim mode / compact mode 是 TUI-only。`outputLanguage` 标了 `requiresRestart: true` 但 CLI 实际上立即调 `updateOutputLanguageFile()` — 矛盾，daemon 路由初版不复制此行为，等 restart 语义理清。
26. **`loadSettings()` 在 corruption recovery 时会写文件**：GET 路由可能触发写操作（恢复 backup 或重置为 `{}`），无害但需知道。
27. **Corruption 状态需要 API 暴露**：`LoadedSettings` 上有 `corruptedPath` 和 `wasRecovered` 字段。GET 响应应包含 `warnings` 数组，在检测到 corruption 时报告。
28. **Pre-write JSON 验证**：`updateSettingsFilePreservingFormat` 写入前重新 parse 验证，确保不会写入损坏内容。
29. **5 秒 persist timeout**：`setSessionApprovalMode` 用 `PERSIST_TIMEOUT_MS = 5_000`。settings persist 考虑类似 timeout。

### 第六轮：Web-shell 测试 + 补全 + 断连

30. **无 dialog 组件测试**：所有 web-shell 测试都是纯函数单元测试，无 `@testing-library/react`。SettingsDialog 的逻辑（排序、过滤、值格式化）提取为纯函数做测试。
31. **`/settings` 已在 `HelpDialog.tsx` 的 `BUILT_IN_COMMANDS` 集合中**：help 系统已识别。
32. **加到 `localCommands.ts` 自动注册补全**：`mergeCommands` 处理合并，无需额外操作。
33. **Error 显示：`message` state + `resume-picker-search-hint`**：无共享组件，但 ToolsDialog/McpDialog/SkillsDialog 模式一致。SettingsDialog 遵循。
34. **`dialogOpen` 不影响 SSE**：只 gate keyboard / editor / queue draining。`showSettingsDialog` 必须加入 `dialogOpen` 表达式。
35. **无 dialog 处理 daemon 断连**：系统性缺陷。SettingsDialog 对 stale 数据加 `message` 提示已足够，不需要额外处理。
36. **`handleSubmit` 是 ~600 行 if-else**：`/settings` 遵循 `/help` 模式，一行 `setShowSettingsDialog(true); return true;`。

## 设计决策

### 1. API：通用 CRUD（`GET/POST /workspace/settings`）

不为每个 setting 加单独路由。一个 GET 返回完整 schema + 当前值，一个 POST 接受 `{ scope, key, value }` 写入。复用 CLI 内部的 `settingsUtils.ts` 做 schema 展开和过滤。

POST 路由使用 `mutate({ strict: true })` 中间件，与 `POST /workspace/tools/:name/enable` 一致。

### 2. Schema 暴露：服务端展平 + 过滤 + 校验

daemon 端调用 `getSettingsSchema()`（动态，含 language options）→ `getDialogSettingKeys()` 过滤为 `showInDialog: true` → 去掉 TUI-only 项 → 返回 type/label/category/default/options/requiresRestart。

POST 端点新增值校验逻辑：
- `boolean` 类型 → `typeof value === 'boolean'`
- `enum` 类型 → value 在 `options[].value` 中
- `number` 类型 → `typeof value === 'number' && !isNaN(value)`
- `string` 类型 → `typeof value === 'string'`
- 其他类型（array/object）→ 初版不支持修改，返回 400

TUI-only 排除列表（初版硬编码，后续可提升为 schema 字段 `showInWebShell`）：
- `general.vimMode`, `general.terminalBell`, `general.preferredEditor`
- `ide.enabled`
- `ui.showLineNumbers`, `ui.renderMode`, `ui.compactMode`, `ui.useTerminalBuffer`, `ui.hideBanner`, `ui.accessibility.enableLoadingPhrases`

### 3. Scope：支持 User + Workspace

GET 响应包含 `values.effective / values.user / values.workspace`，POST body 包含 `scope` 字段（只接受 `"user"` 或 `"workspace"`，服务端映射到 `SettingScope` 枚举）。web-shell 用 Tab 键切换 scope。

### 4. Sub-dialogs：close-and-open 模式

`ui.theme` → close SettingsDialog，open ThemeDialog；`fastModel` → close SettingsDialog，open ModelDialog；`tools.approvalMode` → close SettingsDialog，open ApprovalModeDialog。列表中显示 `▸`。不做 dialog 栈嵌套。

### 5. Inline edit：editMode 守卫

number/string 类型 Enter 进入 editMode，显示 `<input>`。editMode 时 `useDelayedGlobalKeyDown` handler 跳过单字符导航键，只响应 Escape/Enter。参照 MemoryDialog textarea 编辑 + DeleteSessionDialog searchMode。

### 6. Event bus：`settings_changed` workspace 事件

写入成功后用 local closure `broadcastWorkspaceEvent` 广播 `settings_changed`（同 `tool_toggled` 模式）。SDK 端注册 `settings_changed` 类型 + type guard + reducer case。Session provider `bumpWorkspaceEventSignals` 添加 `workspace.settings.changed` → `settingsVersion` 自增。`useSettings()` hook 通过 `useWorkspaceEventReload` 监听自动 reload。

### 7. 写入模式：fire-and-reload

不做乐观更新。POST 成功后调用 `reload()` 刷新。写入期间显示 `'...'` loading（同 ToolsDialog `busyTool`）。`useDaemonResource` 的 stale-response sequence counter 自动处理竞态。

## 分 PR 实现

### PR 1 — Daemon API（后端）

| 文件 | 改动 |
|------|------|
| `packages/cli/src/serve/routes/workspaceSettings.ts` | **新建**。`registerWorkspaceSettingsRoutes(app, deps)` 注册 GET + POST。GET 用 `getSettingsSchema()` + `getDialogSettingKeys()` + `loadSettings()` 组装响应，检测 `corruptedPath`/`wasRecovered` 填充 `warnings[]`。POST 校验 scope/key/value 类型，`persistSetting` 回调写入（5s timeout），`broadcastWorkspaceEvent` 广播。 |
| `packages/cli/src/serve/server.ts` | 导入 + 注册路由（near line ~1058，workspace routes 区域）。`classifyRoute` 添加 `GET/POST /workspace/settings` case。POST 加 `mutate({ strict: true })` 中间件。 |
| `packages/cli/src/serve/capabilities.ts` | 添加 `workspace_settings: { since: 'v1' }` capability |
| `packages/cli/src/serve/runQwenServe.ts` | 注入 `persistSetting(workspace, scope, key, value)` 回调：`withSettingsLock` 内 `loadSettings(workspace).setValue(scopeEnum, key, value)`。如果 #4563 已合入，改为加到 `DaemonWorkspaceServiceDeps`；否则暂放 `BridgeOptions`。 |

GET 响应：
```typescript
{
  v: 1,
  warnings?: [{ type: "corrupted", scope: "user", path: string, recovered: boolean }],
  settings: [{
    key: "tools.approvalMode",
    type: "enum",
    label: "Tool Approval Mode",
    category: "Tools",
    description?: string,
    requiresRestart: boolean,
    default: unknown,
    options?: [{ value, label }],
    values: { effective: unknown, user?: unknown, workspace?: unknown }
  }, ...]
}
```

POST body：`{ scope: "user" | "workspace", key: string, value: unknown }`
POST 校验链：
1. scope ∈ {"user", "workspace"} → 否则 400
2. key 在 schema 且 `showInDialog: true` 且不在 TUI-only 列表 → 否则 400
3. value 类型匹配 schema type；enum value 在 options 中 → 否则 400
4. 写入 + 广播

POST 响应：`{ key, scope, value, requiresRestart }`

### PR 2 — SDK + React Hook（管道层）

| 文件 | 改动 |
|------|------|
| `packages/sdk-typescript/src/daemon/DaemonClient.ts` | 添加 `workspaceSettings(): Promise<DaemonWorkspaceSettingsStatus>` 和 `setWorkspaceSetting(scope, key, value, opts?)` 方法。遵循 `fetchWithTimeout` + `failOnError` 模式。 |
| `packages/sdk-typescript/src/daemon/types.ts` | 添加 `DaemonSettingDescriptor`, `DaemonWorkspaceSettingsStatus`, `DaemonSettingUpdateResult` 类型 |
| `packages/sdk-typescript/src/daemon/events.ts` | 添加 `settings_changed` 到 `DAEMON_KNOWN_EVENT_TYPE_VALUES`。定义 `DaemonSettingsChangedData` + `DaemonSettingsChangedEvent`。添加 `isSettingsChangedData()` type guard。添加 `asKnownDaemonEvent()` case。添加 `reduceDaemonSessionEvent()` case（`settingsChangedCount` + `lastSettingsChange`）。 |
| `packages/webui/src/daemon/workspace/actions.ts` | 添加 `loadSettingsStatus()` 和 `setWorkspaceSetting()` action |
| `packages/webui/src/daemon/workspace/hooks/useDaemonSettings.ts` | **新建**。组合 `useDaemonResource(load)` + `useWorkspaceEventReload(signals?.settingsVersion, reload, active)`。导出 `useSettings(opts?)` 返回 `{ status, settings, loading, error, reload, setValue }`。 |
| `packages/webui/src/daemon/session/types.ts` | `DaemonWorkspaceEventSignals` 添加 `settingsVersion: number` |
| `packages/webui/src/daemon/session/DaemonSessionProvider.tsx` | `INITIAL_WORKSPACE_EVENT_SIGNALS` 添加 `settingsVersion: 0`。`bumpWorkspaceEventSignals` 添加 `workspace.settings.changed` → settings counter 自增。 |
| `packages/webui/src/daemon-react-sdk.ts` | 导出 `useDaemonSettings as useSettings` + 新类型 |

### PR 3 — Web-Shell UI（前端）

| 文件 | 改动 |
|------|------|
| `packages/web-shell/client/components/dialogs/SettingsDialog.tsx` | **新建**。~250-350 行。 |
| `packages/web-shell/client/components/dialogs/settingsUtils.ts` | **新建**。纯函数：`filterSettings()`、`sortSettings()`、`formatDisplayValue()`、`validateEditValue()`。可被单元测试覆盖。 |
| `packages/web-shell/client/components/dialogs/settingsUtils.test.ts` | **新建**。纯函数测试（vitest）。 |
| `packages/web-shell/client/App.tsx` | 添加 `showSettingsDialog` state，**加入 `dialogOpen` 表达式**，handleSubmit 添加 `if (cmd === 'settings') { setShowSettingsDialog(true); return true; }` （同 `/help` 模式），dialog overlay 渲染 + `handleSettingsSubDialog` 回调 |
| `packages/web-shell/client/constants/localCommands.ts` | 添加 `{ name: 'settings', description: t('local.settings') }`。（`/settings` 已在 `HelpDialog.tsx` 的 `BUILT_IN_COMMANDS` 中，无需额外添加） |
| `packages/web-shell/client/i18n.tsx` | 中英文 i18n 字符串（`settings.*` 命名空间） |

#### SettingsDialog 组件设计

**Props**：
```typescript
interface SettingsDialogProps {
  onClose: () => void;
  onSubDialog: (settingKey: string) => void;
}
```

**布局**：`dp('resume-picker')` 根容器
- Header：`dp('resume-picker-header')` — title "Settings" + `dp('resume-picker-count')` scope indicator (User / Workspace) + ESC 关闭
- Separator：`dp('resume-picker-sep')`
- List：`dp('resume-picker-list')` 滚动区域，按 category 分组
- Footer：`dp('resume-picker-footer')` 快捷键提示（动态：editMode 时显示 "Enter Save  ESC Cancel"）

**列表项**：`dp('resume-picker-item')`
- 左：`dp('resume-picker-item-title')` setting label
- 右：`dp('resume-picker-item-badge')` 当前值
  - boolean → "ON" / "OFF"
  - enum → 当前选项 label
  - number/string → 截断显示
  - sub-dialog 项 → 值 + `▸`
- scope 标记：当前 scope 有值 → `*`；非当前 scope 设置 → `dp('resume-picker-item-meta')` "(Modified in User)"
- `requiresRestart` → badge 后加 `⟳` 标记

**Category 分隔**：`dp('resume-picker-item', 'disabled')` 渲染 category header 行，导航跳过。

**Error 显示**：local `message` state + `dp('resume-picker-search-hint')`，同 ToolsDialog/McpDialog 模式。API 错误、校验失败、daemon 断连时的 reload 失败均通过此显示。

**Warnings 显示**：GET 响应含 `warnings[]` 时（如 corruption recovery），在 search-hint 区域显示黄色提示。

**交互**：
| 按键 | 行为 |
|------|------|
| ↑↓ / j/k | 移动选中项（跳过 category header） |
| Enter/Space | boolean: toggle; enum: cycle; sub-dialog: `onSubDialog(key)`; number/string: 进入 editMode |
| Tab | 切换 User/Workspace scope |
| Escape | editMode → 取消编辑；否则 → `onClose()` |
| r | reload settings |

**editMode 状态机**：
```
idle → (Enter on string/number) → editing { key, draft }
editing → (Enter) → POST + reload → idle
editing → (Escape) → discard → idle
```
editMode 时：
- 选中项展开 `<input>` 框（`dialog-form input` 样式）
- `useDelayedGlobalKeyDown` handler 前置检查 `editMode`，跳过所有单字符键，只响应 Enter/Escape
- input 获取 focus via `setTimeout(() => ref.current?.focus(), 0)`（同 MemoryDialog）

**Sub-dialog 跳转**（App.tsx 中的 `handleSettingsSubDialog`）：
```typescript
const handleSettingsSubDialog = useCallback((settingKey: string) => {
  setShowSettingsDialog(false);
  if (settingKey === 'ui.theme') setShowThemeDialog(true);
  else if (settingKey === 'fastModel') setModelInlineMode('settings');
  else if (settingKey === 'tools.approvalMode') setShowModeDialog(true);
}, []);
```

## 已知限制 & 后续优化

1. **无 rate limiting**：快速写入会串行排队文件操作（1000 次 = ~2s 延迟）。后续考虑 token-bucket 或 key-level debouncing。
2. **VS Code 扩展直接写文件**：与 daemon 存在竞态。后续统一迁移到 daemon API。
3. **TUI-only 排除列表硬编码**：后续提升为 schema 字段 `showInWebShell`。
4. **array/object 类型 settings 初版不支持编辑**：如需支持，需要更复杂的 UI（JSON 编辑器或专用 dialog）。
5. **Event 在 resync 时被跳过**：`settings_changed` 不在 `RESYNC_PASSTHROUGH_TYPES`，断线重连后客户端需 reload 恢复。与 `tool_toggled` 行为一致。
6. **`outputLanguage` 副作用矛盾**：schema 标 `requiresRestart: true` 但 CLI 立即写 rule file。daemon 初版不复制此行为，等语义理清。
7. **Daemon 断连时 dialog 显示 stale 数据**：系统性缺陷（所有 dialog 均不处理断连），不特殊处理。reload 失败时通过 error message 提示。
8. **无 dialog 组件级测试基础设施**：web-shell 无 `@testing-library/react`。逻辑提取为纯函数做 vitest 测试。
9. **`loadSettings()` GET 时可能触发 corruption recovery 写文件**：`fs.writeFileSync` 恢复 backup 或重置为 `{}`。无害但行为上是 GET 有写副作用。

## 验证方式

1. **API 验证**：`qwen serve` 启动后
   - `curl GET /workspace/settings` → 返回完整 settings 列表，无 TUI-only 项，language 有 options
   - `curl POST /workspace/settings -d '{"scope":"workspace","key":"ui.hideTips","value":true}'` → 200，检查 `.claude/settings.json`
   - `curl POST /workspace/settings -d '{"scope":"workspace","key":"ui.hideTips","value":"bad"}'` → 400 校验失败
   - `curl POST /workspace/settings -d '{"scope":"system","key":"ui.hideTips","value":true}'` → 400 scope 拒绝
   - `curl POST /workspace/settings -d '{"scope":"workspace","key":"hooks","value":{}}'` → 400 key 不在白名单
2. **Event 验证**：两个 SSE 客户端连接同一 session，一个修改 setting，另一个收到 `settings_changed` 事件并自动 reload
3. **UI 验证**：web-shell `/settings` → 打开 dialog → toggle boolean → 值变化 → 关闭重开确认持久化
4. **Inline edit 验证**：选中 number/string → Enter → 输入 j/k 等字符不触发导航 → Enter 提交
5. **Sub-dialog 验证**：选中 theme → Enter → SettingsDialog 关闭 → ThemeDialog 打开
6. **安全验证**：尝试 POST hooks/permissions/mcpServers 等危险 key → 全部 400
7. **Integration test**：遵循 `qwen-serve-routes.test.ts` 模式，覆盖 GET、POST 成功、POST 各种校验拒绝

## Final Implementation Status

- **PR status**: Prerequisite #4563 (DaemonWorkspaceService extraction) MERGED on 2026-06-06. The `/settings` feature itself has no PR yet; tracking issue #4514 remains OPEN.
- **What was implemented**: Only the architectural prerequisite was completed — #4563 extracted `DaemonWorkspaceService` from `AcpSessionBridge` (renamed `httpAcpBridge.ts` to `acpSessionBridge.ts`), creating the service boundary this plan depends on (audit finding #24).
- **Key divergences**: The three planned PRs (PR 1: daemon API, PR 2: SDK + hooks, PR 3: web-shell UI) have not been created. The settings CRUD routes, SDK hooks (`useDaemonSettings`), `settings_changed` event type, and SettingsDialog component are all unimplemented.
- **Current state**: Blocked on implementation — prerequisite landed, feature work not started.
