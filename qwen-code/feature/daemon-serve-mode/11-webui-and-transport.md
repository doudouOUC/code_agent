# WebUI 库与 ACP 传输层（深入）

> daemon/serve 技术方案子文档；总览见 [README.md](README.md)。

---

## 概述

本文覆盖两个并行演进的子系统：

1. **@qwen-code/webui** -- 作为独立发布的 npm 库（非 daemon-hosted），向浏览器端消费者提供 daemon 会话管理、transcript 归约、权限处理和 React 绑定。该库输出两个 subpath：根 `@qwen-code/webui` 提供通用 UI 组件，`@qwen-code/webui/daemon-react-sdk` 提供 daemon-backed React Provider/Hooks 层。
2. **ACP 传输层演进** -- 在 `qwen serve` 现有 bespoke REST + SSE 之上，增设官方 ACP Streamable HTTP 传输（`/acp` 端点），并规划 Phase 2 WebSocket 全双工升级。两套传输共享同一 `HttpAcpBridge` + `EventBus` 实例，零状态复制。

设计目标是让多客户端（web-shell、IDE companion、TS/Java/Python SDK、ACP-native editor 如 Zed/Goose）均可按自身偏好的协议接入同一 daemon，且所有客户端通过共享 render contract（`daemonBlockToMarkdown` / `daemonBlockToHtml` / `daemonBlockToPlainText`）保证一致的 transcript 投影。

---

## 涉及 PR

| PR | 作者 | 状态 | 子主题 |
|----|------|------|--------|
| [#4328](https://github.com/QwenLM/qwen-code/pull/4328) | @chiga0 | Merged | feat(daemon): shared UI transcript layer -- normalizer + store + terminal + toolPreview |
| [#4353](https://github.com/QwenLM/qwen-code/pull/4353) | @chiga0 | Merged | feat(sdk/daemon-ui): unified completeness follow-up -- 28+ event types / render contract / conformance |
| [#4380](https://github.com/QwenLM/qwen-code/pull/4380) | @chiga0 | Merged | Feat/daemon react cli -- web-shell (packages/web-shell) + control-plane |
| [#4573](https://github.com/QwenLM/qwen-code/pull/4573) | @ytahdn | Merged | feat(web-shell,webui,sdk): context-usage API + daemon-react-sdk refactor + dialog UX |
| [#4132](https://github.com/QwenLM/qwen-code/pull/4132) | @jifeng | Merged | feat(serve): /demo debug page -- self-contained inline HTML |
| [#4555](https://github.com/QwenLM/qwen-code/pull/4555) | @jifeng | Merged | feat(sdk): serve-bridge MCP server + rename mcp -> daemon-mcp |
| [#4472](https://github.com/QwenLM/qwen-code/pull/4472) | @wenshao | Merged | feat(daemon): ACP Streamable HTTP transport at /acp [RFD #721] |
| [#4773](https://github.com/QwenLM/qwen-code/pull/4773) | @chiga0 | Open | feat(serve): ACP WebSocket transport (RFD phase 2) |

---

## @qwen-code/webui 架构

### 分层设计

WebUI 的 daemon 适配分三层，从底部到顶部：

```
┌──────────────────────────────────────────────────────────────────┐
│  Layer 3: packages/web-shell / packages/webui (React 组件)       │
│  -- App.tsx, MessageList, ToolGroup, AskUserQuestion, dialogs   │
├──────────────────────────────────────────────────────────────────┤
│  Layer 2: @qwen-code/webui/daemon-react-sdk (React Provider)    │
│  -- DaemonSessionProvider, DaemonWorkspaceProvider, hooks        │
│  -- transcriptToMessages, selectors, actions                     │
├──────────────────────────────────────────────────────────────────┤
│  Layer 1: @qwen-code/sdk/daemon (browser-safe, 无 React 依赖)    │
│  -- DaemonClient, normalizeDaemonEvent, transcript reducer       │
│  -- createDaemonTranscriptStore, render contract, conformance    │
└──────────────────────────────────────────────────────────────────┘
```

Layer 1（SDK daemon subpath）是无框架依赖的纯 TypeScript；Layer 2 是 React 绑定；Layer 3 是实际 UI 组件。这种分层允许非 React 消费者（channel adapter、CLI TUI、测试工具）直接使用 Layer 1，而 web-shell 等 React 应用通过 Layer 2 的 Provider 和 Hooks 接入。

### daemon adapter（Layer 1）

PR #4328 建立了 SDK 侧的 daemon UI 核心，PR #4353 将其从 55% 提升至 ~95% 完成度。核心模块分布在 `packages/sdk-typescript/src/daemon/ui/`：

| 模块 | 职责 |
|------|------|
| `normalizer.ts` | `normalizeDaemonEvent()` -- 将原始 `DaemonEvent`（SSE frame）归一化为强类型 `DaemonUiEvent` 联合体。v1 处理 13 种 event type；v2 覆盖 28+ 种（含 `session.metadata.changed`, `workspace.mcp.budget_warning`, `auth.device_flow.*` 等）。未知 event 降级到 `debug` 类型，前向兼容。 |
| `transcript.ts` | `reduceDaemonTranscriptEvents()` -- 纯函数状态机，将 `DaemonUiEvent[]` 归约为 `DaemonTranscriptState`。管理 `blocks[]`（最多 `maxBlocks` = 1000），维护 `currentToolCallId`、`approvalMode`、`toolProgress` 等侧信道状态。copy-on-write：侧信道变更不触发 `blocks` 引用变化，配合 `useSyncExternalStore` 避免 O(n log n) 重排。 |
| `store.ts` | `createDaemonTranscriptStore()` -- 适配 React `useSyncExternalStore` 的外部 store。`dispatch(event)` 驱动 reducer，`queueMicrotask` 批量通知 listener。支持 `reset()` / `clearAwaitingResync()` 恢复流程。 |
| `toolPreview.ts` | `createDaemonToolPreview()` -- 从 tool input shape 推断 preview 类型。13 种 preview kind：`file_diff`, `file_read`, `web_fetch`, `mcp_invocation`, `code_block`, `search`, `tabular`, `image_generation`, `subagent_delegation`, `ask_user_question`, `command`, `key_value`, `generic`。 |
| `render.ts` | 渲染契约（render contract）：`daemonBlockToMarkdown()`, `daemonBlockToHtml()`, `daemonBlockToPlainText()`, `daemonToolPreviewToMarkdown()`。默认截断 `maxFieldLength=8192`，`sanitizeUrls` 剥离 token 参数。 |
| `conformance.ts` | `runAdapterConformanceSuite(adapter)` -- 11 个固定 fixture（含 subagent 嵌套、redaction、cancellation、mcp-budget、auth-device-flow），验证任意 adapter 的投影一致性。 |
| `terminal.ts` | `sanitizeTerminalText()` + ANSI 投影，供 TUI adapter 使用。 |
| `types.ts` | 所有类型定义：`DaemonUiEvent`（28+ 子类型的 discriminated union）、`DaemonTranscriptBlock`（`user`/`assistant`/`thought`/`tool`/`shell`/`permission`/`status`/`user_shell` 8 种 block kind）、`DaemonToolPreview`（13 种 preview kind）。 |
| `utils.ts` | `redactSensitiveFields()` -- 在 normalizer 边界对 `apiKey`/`token`/`secret`/`password`/`authorization` 等字段脱敏，阻止泄漏到 transcript block。 |

关键设计决策：

- **SDK daemon subpath 是 browser-safe**：零 React 依赖、零 Node-only 依赖。构建脚本 (`scripts/build.js`) 包含 `assertBrowserSafeBundle` 检查。
- **`eventId` 为主排序键**：daemon-monotonic SSE cursor，跨客户端/跨重连一致。`serverTimestamp` 作为备用排序键（客户端时钟漂移时的保底）。
- **取消传播**：当 `assistant.done.reason === 'cancelled'` 时，reducer 自动将所有 in-flight tool 的 status 翻转为 `'cancelled'`，解决"cancel 后 tool spinner 永转"的 UX 问题。
- **Sub-agent 嵌套**：reducer 通过 `_meta.parentToolCallId` 关联子 block，`selectSubagentChildBlocks(state, parentId)` O(1) 查询。乱序到达（child 先于 parent）通过 back-fill 处理。

### daemon-react-sdk（Layer 2）

PR #4573 将 `packages/webui/src/daemon/` 重构为模块化架构，分为 `session/` 和 `workspace/` 两轴：

```
packages/webui/src/daemon/
├── session/                              # 每会话
│   ├── DaemonSessionProvider.tsx          # React Context Provider
│   ├── actions.ts                         # sendPrompt, cancel, resolvePermission
│   ├── selectors.ts                       # selectDaemonStreamingState, selectDaemonPendingPermissions
│   ├── mappers.ts                         # SSE event -> connection state 映射
│   ├── clientLifecycle.ts                 # getStableClientId, detachDaemonClient
│   ├── promptContent.ts                   # toDaemonPromptContent
│   ├── transcriptToMessages.ts            # blocks -> DaemonMessage[]（React 渲染消息列表）
│   ├── types.ts                           # DaemonSessionContextValue 等
│   └── messageTypes.ts                    # DaemonMessage 联合体
├── workspace/                             # 跨会话
│   ├── DaemonWorkspaceProvider.tsx         # workspace-level Provider
│   ├── actions.ts                         # workspace 操作
│   ├── hooks/                             # 资源 hooks
│   │   ├── useDaemonAgents.ts
│   │   ├── useDaemonAuth.ts
│   │   ├── useDaemonMcp.ts
│   │   ├── useDaemonMemory.ts
│   │   ├── useDaemonSkills.ts
│   │   ├── useDaemonTools.ts
│   │   ├── useDaemonFiles.ts
│   │   ├── useDaemonGlob.ts
│   │   ├── useDaemonSessions.ts
│   │   └── useDaemonResource.ts           # 通用资源加载 hook
│   └── types.ts
├── transcriptAdapter.ts                   # Legacy bridge
├── followupSidechannel.ts                 # followup suggestion sidechannel
├── timing.ts                              # reconnect delay / timer utils
└── index.ts                               # barrel export
```

该重构的核心产出是新的 subpath export `@qwen-code/webui/daemon-react-sdk`（见 `packages/webui/src/daemon-react-sdk.ts`），将所有 daemon React hooks 以简短别名重新导出：

```typescript
// web-shell 消费示例
import {
  DaemonSessionProvider,
  DaemonWorkspaceProvider,
  useMessages,
  useConnection,
  useStreamingState,
  useActions,
  usePendingPermissionRequest,
} from '@qwen-code/webui/daemon-react-sdk';
```

**DaemonSessionProvider** (`session/DaemonSessionProvider.tsx`) 是会话级入口。它内部：
1. 创建 `DaemonTranscriptStore`（SDK Layer 1 的 `createDaemonTranscriptStore()`）。
2. 持有 `DaemonClient` + `DaemonSessionClient` 引用。
3. 订阅 SSE 事件流，调用 `normalizeDaemonEvent()` 归一化后 `store.dispatch()`。
4. 通过 `useSyncExternalStore(store.subscribe, store.getSnapshot)` 将 transcript state 暴露给子组件。
5. 管理 SSE 重连（`getReconnectDelayMs` 指数退避）、`awaitingResync` 恢复、`clearPassiveAssistantDoneTimer` 等边界情况。

**DaemonWorkspaceProvider** (`workspace/DaemonWorkspaceProvider.tsx`) 是 workspace 级入口，管理跨会话资源：MCP server 状态、skills、agents、memory、tools、文件系统操作。内部各 hook（`useDaemonMcp`, `useDaemonAgents` 等）通过 `useDaemonResource` 通用 hook 模式实现统一的 loading/error/refetch 语义。

### transcript reducer -> 消息列表

`transcriptBlocksToDaemonMessages()` (`session/transcriptToMessages.ts`) 将扁平的 `DaemonTranscriptBlock[]` 转换为嵌套的 `DaemonMessage[]`，适配 React 渲染：

- `user` block -> `DaemonUserMessage`
- 连续 `assistant`/`thought` block -> 合并为单个 `DaemonAssistantMessage`
- `tool` block -> 聚合为 `DaemonToolGroupMessage`（按时间窗口分组）
- Sub-agent tool -> `DaemonMessageToolCall` 嵌套（通过 `parentToolCallId` 关联）
- `permission` block -> 合并到对应的 tool card 中

转换通过 subAgent stack 管理嵌套层级，支持 compacted replay 中乱序到达。

### 事件消费流程

```mermaid
sequenceDiagram
    participant Browser as Browser (web-shell)
    participant Provider as DaemonSessionProvider
    participant Store as DaemonTranscriptStore
    participant SDK as SDK normalizer
    participant Daemon as qwen serve

    Browser->>Daemon: GET /session/:id/events (SSE)
    Daemon-->>Provider: text/event-stream
    loop SSE frames
        Provider->>SDK: normalizeDaemonEvent(rawEvent)
        SDK-->>Provider: DaemonUiEvent[]
        Provider->>Store: store.dispatch(events)
        Store->>Store: reduceDaemonTranscriptEvents(state, events)
        Store-->>Browser: useSyncExternalStore notify
        Browser->>Browser: re-render messages
    end
    Note over Browser,Daemon: 断连时自动重连（指数退避 + Last-Event-ID 续传）
```

---

## context-usage API（#4573）

PR #4573 新增 `GET /session/:id/context-usage` 端点，返回会话的 token 使用分布。完整链路覆盖四层：

| 层 | 模块 | 新增内容 |
|----|------|----------|
| SDK | `packages/sdk-typescript/src/daemon/types.ts` | `DaemonSessionContextUsageStatus` 类型 |
| SDK | `packages/sdk-typescript/src/daemon/DaemonSessionClient.ts` | `sessionContextUsage()` 方法 |
| acp-bridge | `packages/acp-bridge/src/status.ts` | `getSessionContextUsageStatus()` 接口 + `SERVE_STATUS_EXT_METHODS.sessionContextUsage` |
| CLI | `packages/cli/src/serve/server.ts:1623` | 路由处理 + `acpAgent.buildSessionContextUsageStatus()` |

能力注册为 `session_context_usage: { since: 'v1' }`。Web-shell 通过新增的 `ContextUsageMessage` 组件展示 token 分布。

---

## /demo 调试页（#4132）

PR #4132 在 `qwen serve` 添加 `/demo` 路由，返回一个自包含的 inline HTML 调试页面（`packages/cli/src/serve/demo.ts:getDemoHtml()`），零外部依赖、无需构建步骤。

功能要点：

- **Session 管理**：Create/Attach session，指定 working directory
- **Chat 界面**：通过 SSE 实时流式接收 assistant 响应
- **Permission 处理**：UI 交互响应 daemon 的权限请求
- **Model 切换**：在 active session 上切换模型
- **Health & Capabilities**：快捷按钮调用 `/health`, `/health?deep=1`, `/capabilities`
- **事件/API 日志**：分 tab 展示原始 SSE 事件和 API request/response
- **Auth token 支持**：Bearer token 输入框，适配 `--token` 保护的部署

安全设计：`/demo` 路由注册在 `hostAllowlist` 和 `bearerAuth` 中间件**之后**，受相同安全防护。Same-origin CORS 处理：当 `Origin` 匹配 daemon 自身 loopback 地址（含 `host.docker.internal`）时剥离 Origin 头，允许 demo 页的 API 调用通过，同时保持对非 loopback origin 的 `denyBrowserOriginCors` 保护。

XSS 防护（CR 反馈后修复）：permission 按钮使用 DOM API（`createElement`, `textContent`, `dataset`）而非 `innerHTML`。

---

## ACP Streamable HTTP（#4472）

### 背景：双传输架构

PR #4472 在 `qwen serve` 增设第二套北向传输，实现 ACP RFD #721 定义的 Streamable HTTP 协议。**设计决策：双传输、纯增量（additive）**。

```
                                      ┌─────────────────────────────────────────────────────┐
                                      │                   qwen serve                         │
 ┌──────────┐  bespoke REST+SSE       │  ┌───────────────┐    ┌──────────────────────────┐   │
 │ webui /  │ ──/session/* routes──►  │  │  server.ts    │──► │ HttpAcpBridge + EventBus │   │
 │ SDK      │ ◄── /session/:id/events │  │  (~30 routes) │    │  (共享实例)               │   │
 └──────────┘                         │  └───────────────┘    └───────────┬──────────────┘   │
                                      │                                   │                  │
 ┌──────────┐  ACP Streamable HTTP    │  ┌───────────────┐                │                  │
 │ ACP-     │ ── POST/GET/DELETE ──►  │  │  acpHttp/     │────────────────┘                  │
 │ native   │ ◄── SSE (JSON-RPC)     │  │  mountAcpHttp │                                   │
 │ clients  │                         │  └───────────────┘                                   │
 └──────────┘                         │                                                      │
                                      │                       ┌──────────────────┐           │
                                      │                       │ qwen --acp child │           │
                                      │                       │ (ACP stdio)      │           │
                                      └───────────────────────┴──────────────────┴───────────┘
```

关键特性：

- **同一 `/acp` 端点**：`POST` 发送 JSON-RPC 请求，`GET` 开启长连接 SSE，`DELETE` 拆除连接。
- **`initialize` 特殊处理**：`POST /acp {initialize}` 返回 `200` + capabilities JSON + `Acp-Connection-Id` header。其他请求返回 `202 Accepted`，response 通过 SSE 流投递。
- **双层 SSE 流**：connection-scoped（`GET /acp` + `Acp-Connection-Id`）和 session-scoped（`GET /acp` + `Acp-Connection-Id` + `Acp-Session-Id`）。
- **开关**：`QWEN_SERVE_ACP_HTTP=0` 关闭；默认开启。

### `mountAcpHttp` 实现

模块布局在 `packages/cli/src/serve/acpHttp/`：

| 文件 | 职责 |
|------|------|
| `index.ts` | `mountAcpHttp(app, bridge, opts)` -- 在 Express app 上注册 `/acp` 路由 |
| `connectionRegistry.ts` | `AcpConnection` 管理 `Acp-Connection-Id` -> 连接状态。`SessionBinding` 跟踪 per-session stream / clientId / buffer。`MAX_BUFFERED_FRAMES=256`，`DEFAULT_MAX_CONNECTIONS=64`。grace period `CONN_GRACE_MS=10_000`。 |
| `dispatch.ts` | `AcpDispatcher` -- JSON-RPC method -> bridge call 映射。标准方法：`initialize`, `session/new`, `session/prompt`, `session/cancel`, `session/load`, `session/resume`, `session/close`, `session/list`, `session/set_mode`, `session/set_config_option`。厂商扩展：`_qwen/session/heartbeat`, `_qwen/workspace/*` 等。 |
| `jsonRpc.ts` | JSON-RPC 2.0 解析/验证/序列化；error codes（`-32600`, `-32601`, `-32602`, `-32603`, `-32700`）；`_qwen/` 命名空间守卫。 |
| `sseStream.ts` | `SseStream` -- ACP 传输的长连接 SSE 写入器。与 REST `/session/:id/events` 的 SSE 不同：payload 是原始 JSON-RPC 对象而非 qwen event envelope。15s heartbeat comment，serialize write chain 防交错。 |
| `transport.test.ts` | 端到端 vitest 测试套件（40 tests）：覆盖 200/202 约定、双 SSE 流、prompt streaming、permission round-trip、`_qwen/set_model`、method-not-found、DELETE。 |

### 扩展方法策略

ACP 规范保留 `_` 前缀给自定义扩展。本实现的命名空间为 `_qwen/<area>/<verb>`，能力在 `initialize` 的 `agentCapabilities._meta.qwen` 中广告。

经 PR 评审中的扩展方法审计（见 #4472 body），关键发现：

- **模型/审批模式** 有标准归属 `session/set_config_option`（`category:"model"` / `"mode"`），已从厂商 `_qwen/session/set_model` 迁移到标准方法。
- **仅对无标准等价的能力保留 `_qwen/...`**：workspace 内省/变更、session 内省（context/supported-commands）、heartbeat、client->agent 文件 I/O（`_qwen/fs/*`）、device-flow 登录（`_qwen/auth/*`）。

### permission round-trip

agent->client 权限请求是 `/acp` 传输的关键验证路径：

```mermaid
sequenceDiagram
    participant Client as ACP Client
    participant Dispatch as AcpDispatcher
    participant Bridge as HttpAcpBridge
    participant Agent as qwen --acp

    Agent->>Bridge: permission request (stdio)
    Bridge->>Dispatch: BridgeEvent(permission_request)
    Dispatch->>Client: session SSE: {id:N, method:"session/request_permission", params}

    Note over Client: User approves / denies

    Client->>Dispatch: POST /acp {id:N, result:{response:"allow"}}
    Dispatch->>Bridge: bridge.resolvePermission(requestId, response)
    Bridge->>Agent: permission resolved (stdio)
```

`AcpConnection` 维护 `Map<jsonRpcId, PendingClientRequest>`。当连接/会话拆除时，`AbandonPendingFn` 自动取消未决的 permission，避免 agent prompt 被永久阻塞。

---

## ACP WebSocket transport（#4773，open）

PR #4773 为 `/acp` 端点增加 WebSocket 升级支持，实现 ACP RFD 的 Phase 2。

### 设计

```
GET /acp (no Upgrade)   →  SSE stream (现有，不变)
GET /acp (Upgrade: ws)  →  WebSocket upgrade (新增)
POST /acp               →  JSON-RPC messages (现有，不变)
DELETE /acp              →  Tear down connection (现有，不变)
```

SSE 和 WS 连接共享同一 `ConnectionRegistry`、同一 `maxConnections` 上限、同一 bridge。

### 性能对比

| 维度 | SSE (现有) | WebSocket (新增) |
|------|-----------|------------------|
| 每会话连接数 | 3 HTTP (POST + 2 GET) | 1 TCP (全双工) |
| 每消息开销 | 完整 HTTP headers | 2-6 byte frame header |
| 延迟 | HTTP round-trip per message | Sub-millisecond |
| 浏览器 auth | EventSource 无法携带 Bearer | WS protocol header / query param |

### 实现

关键新增文件：

| 文件 | 职责 |
|------|------|
| `acpHttp/transportStream.ts` | `TransportStream` 接口（`send`/`close`/`isClosed`）-- 从 `SseStream` 抽取 |
| `acpHttp/wsStream.ts` | `WsStream` -- WebSocket 适配 `TransportStream`，`onClose` / `onHeartbeat` 回调 |

`AcpDispatcher` 本身是 **transport-agnostic** 的 -- 它不接触 HTTP 原语，仅接收解析后的 JSON-RPC 消息并通过 `conn.sendConn()` / `conn.sendSession()` 写响应。因此 WS 支持的核心变更只有 ~220 LOC 的升级处理器（`index.ts`）和 ~100 LOC 的 `WsStream` 适配器，`dispatch.ts` 零修改。

WebSocket 连接生命周期：
1. `httpServer.on('upgrade')` 拦截 `pathname === '/acp'` 的请求
2. `wss.handleUpgrade()` 完成 101 协议切换
3. 第一条 WS text frame **必须**是 `initialize`（否则 `1002 Protocol error` 关闭）
4. `WsStream` 同时充当 connection stream 和 session stream（单 socket 全双工）
5. 后续 session-scoped 消息通过 `dispatcher.handle()` 路由到相同的 `AcpDispatcher`
6. WS 关闭时 `ConnectionRegistry` 清理连接

### Phase 2 计划（open PR）

当前 PR 包含：WS upgrade handler、`WsStream` 适配器、`TransportStream` 接口抽取。测试计划覆盖：WS upgrade 101、initialize、session/new + session/prompt、disconnect cleanup、SSE regression。

---

## 时序图：WebUI 连接 daemon + SSE 消费 + control-plane RPC

```mermaid
sequenceDiagram
    participant WebShell as web-shell (Browser)
    participant WP as DaemonWorkspaceProvider
    participant SP as DaemonSessionProvider
    participant DC as DaemonClient (SDK)
    participant Serve as qwen serve
    participant ACP as qwen --acp (child)

    Note over WebShell: 初始化
    WebShell->>WP: mount DaemonWorkspaceProvider
    WP->>DC: new DaemonClient({baseUrl, token})
    WP->>Serve: GET /capabilities
    Serve-->>WP: {workspace, features, supportedModels}
    WP->>Serve: GET /health?deep=1
    Serve-->>WP: {status:"ok"}

    Note over WebShell: 创建会话
    WebShell->>SP: mount DaemonSessionProvider
    SP->>DC: POST /session {cwd, approvalMode}
    DC->>Serve: create session
    Serve->>ACP: spawn + initialize (ACP stdio)
    ACP-->>Serve: capabilities
    Serve-->>DC: {sessionId, model, approvalMode}

    Note over WebShell: 订阅事件
    SP->>DC: GET /session/:id/events (SSE, Last-Event-ID)
    DC->>Serve: EventSource connection
    Serve-->>SP: text/event-stream (long-lived)

    Note over WebShell: 发送 prompt
    WebShell->>SP: actions.sendPrompt("Hello")
    SP->>DC: POST /session/:id/prompt {prompt}
    DC->>Serve: prompt request
    Serve->>ACP: session/prompt (stdio)

    loop Streaming response
        ACP-->>Serve: session/update (stdio NDJSON)
        Serve-->>SP: SSE frame: {event:"session_update", data:{...}}
        SP->>SP: normalizeDaemonEvent() -> store.dispatch()
        SP-->>WebShell: useSyncExternalStore -> re-render
    end

    Note over WebShell: Permission 交互
    ACP->>Serve: session/request_permission (stdio)
    Serve-->>SP: SSE: permission_request
    SP-->>WebShell: usePendingPermissionRequest -> 显示审批 UI
    WebShell->>SP: actions.resolvePermission("allow")
    SP->>DC: POST /session/:id/permission/:requestId
    DC->>Serve: resolve permission
    Serve->>ACP: permission resolved (stdio)

    Note over WebShell: control-plane RPC
    WebShell->>WP: useDaemonMcp()
    WP->>DC: GET /workspace/mcp
    DC->>Serve: MCP status query
    Serve-->>WP: {servers: [...]}

    WebShell->>WP: useDaemonMemory()
    WP->>DC: GET /workspace/memory
    DC->>Serve: memory query
    Serve-->>WP: {files: [...]}

    WebShell->>SP: actions.setModel("qwen-max")
    SP->>DC: POST /session/:id/model
    DC->>Serve: model switch
    Serve->>ACP: unstable_setSessionModel (stdio)
    ACP-->>Serve: model switched
    Serve-->>SP: SSE: model_switched
```

---

## serve-bridge MCP Server（#4555）

PR #4555 在 `packages/sdk-typescript/src/daemon-mcp/serve-bridge/` 新增 `qwen-serve-bridge` MCP server，将 `qwen serve` HTTP API 桥接为 MCP 工具，使 Qoder、Claude Desktop、Cursor 等 MCP 兼容客户端可通过 stdio 与 daemon 交互。

核心组件：

| 文件 | 职责 |
|------|------|
| `createServeBridgeMcpServer.ts` | 工厂函数，创建 MCP server 实例 + 31 个工具 |
| `bin.ts` | CLI 入口（`qwen-serve-mcp`），通过 `QWEN_DAEMON_URL` / `QWEN_DAEMON_TOKEN` 环境变量配置 |
| `sse.ts` | 持久 SSE 连接管理，`session_create` 时建立共享连接 |
| `tools/session.ts` | session 管理工具（8 个） |
| `tools/agent.ts` | agent 交互工具（2 个） |
| `tools/workspaceRead.ts` | workspace 只读工具（10 个） |
| `tools/workspaceWrite.ts` | workspace 写入工具（9 个） |
| `tools/infrastructure.ts` | 基础设施工具（2 个） |

同时 `src/mcp/` 目录重命名为 `src/daemon-mcp/`，明确职责。`DaemonClient` 新增 `fileStat()`, `dirList()`, `glob()` 方法消除 serve-bridge 中的 raw fetch 绕行。

---

## 已知限制 / v0.16-alpha scope

### browser/webui daemon-hosted 被砍 -> 独立发布

最初设计中 daemon 会 host 一个内置 webui（`/web` route serving SPA），v0.16-alpha 阶段该方案被砍。当前架构：

- **@qwen-code/webui** 作为独立 npm 包发布，消费者自行构建和部署
- **packages/web-shell** 是独立的 Vite SPA 应用，通过 Vite dev proxy 连接 daemon API
- **`/demo`** 是轻量级 inline HTML 调试页，非生产 UI

### SDK daemon UI 剩余 ~5% 缺口

| 缺口 | 状态 | 依赖 |
|------|------|------|
| `tool.progress` 事件 | SDK state shape 已就绪，daemon 侧尚未发射 | ~50 LOC daemon |
| Multimodal echo（image/audio attachment 回显） | SDK `extractContentPart` 已实现 | ~80 LOC Core `MessageEmitter.emitUserContent` |

### ACP 传输层缺口

| 项目 | 状态 |
|------|------|
| WebSocket upgrade | PR #4773 open（Phase 2） |
| HTTP/2 多路复用 | 当前 HTTP/1.1；已记录偏差 |
| SSE 断点续传 | RFD Phase 4，deferred |
| `fs/*` + `terminal/*` agent->client 转发 | permission 路径已验证机制，其余为 mechanical follow-up |
| REST `/acp` 完全等价 | 需先补齐 acp-bridge 能力（文件 I/O / device-flow / agents / memory） |

### web-shell 局限

- 仅 macOS 测试通过，Windows/Linux 浏览器兼容性未验证
- `/session/:id` SPA 路由与 daemon API `/session/*` 共用前缀，Vite dev proxy 通过判断 HTML navigation 规避冲突
- 部分 CLI 行为尚未对齐（如 `/stats` 子命令补全已移除）

---

## 参考路径

| 内容 | 路径 |
|------|------|
| SDK daemon UI 核心 | `packages/sdk-typescript/src/daemon/ui/` |
| SDK daemon client | `packages/sdk-typescript/src/daemon/DaemonClient.ts` |
| SDK daemon session client | `packages/sdk-typescript/src/daemon/DaemonSessionClient.ts` |
| SDK daemon types | `packages/sdk-typescript/src/daemon/types.ts` |
| webui daemon providers | `packages/webui/src/daemon/` |
| webui daemon-react-sdk | `packages/webui/src/daemon-react-sdk.ts` |
| web-shell | `packages/web-shell/client/` |
| /demo 调试页 | `packages/cli/src/serve/demo.ts` |
| ACP HTTP 传输 | `packages/cli/src/serve/acpHttp/` |
| ACP HTTP 设计文档 | `docs/design/daemon-acp-http/README.md` |
| serve-bridge MCP | `packages/sdk-typescript/src/daemon-mcp/serve-bridge/` |
| serve server | `packages/cli/src/serve/server.ts` |
