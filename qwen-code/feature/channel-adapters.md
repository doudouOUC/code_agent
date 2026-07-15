# Channel adapters 技术方案

> 适用范围：`QwenLM/qwen-code` channels 包与 CLI channel registry。本文只按 `@doudouOUC` 个人 PR 口径整理。

---

## 1. 背景与动机

Channel adapter 让 qwen-code 可以从本地 TUI 之外的消息通道接收用户输入。adapter 不应该依赖某个具体 bridge 实现，否则后续要切到 daemon-backed bridge、测试 fake bridge 或多 channel bridge 时，所有 adapter 都会被迫跟着底层类名和生命周期细节变化。

#5978 的目标是把 adapter-facing 依赖从具体 `AcpBridge` 收窄为 `ChannelAgentBridge` contract：adapter 只需要知道“创建/恢复 session、发送 prompt、订阅事件、清理 session”等 agent-session 行为，不再把 `AcpBridge` 当成唯一实现。#6031 在此基础上让 `qwen serve --channel` 托管 out-of-process channel worker；#6098 再补 worker restart、heartbeat、status issue 和日志脱敏；#6165 把 daemon prompt completion 从 one-tick guess 改为 `turn_complete` SSE barrier；#6182 给 bridge 增加 session listing；#6309 进一步让 daemon-owned load replay 可以由 bridge snapshot 批量承接，避免历史帧走 live fanout；#6598 新增 channel worker reload，让 settings 变更不必重启整个 daemon；#6635 把 daemon-managed channel workers 按 workspace 分组，避免 multi-workspace daemon 中 secondary workspace channel 误用 primary env/settings；#6741 把 channel selection 做成 daemon runtime resource，支持运行时启用、替换、查询和停止 worker。

---

## 2. ChannelAgentBridge 合约

`ChannelAgentBridge` 是 adapter 与 agent runtime 之间的窄接口：

- `SessionRouter` 和 adapter 构造参数面向 bridge contract，而不是具体 `AcpBridge`；
- standalone `qwen channel start` 仍由现有 `AcpBridge` 实现，不改变默认运行路径；
- thread-scoped `/clear`、`/status` 与 prompt 使用同一 routing key，router 可以按 bridge session id 移除所有状态；
- restore 会拒绝非法 session id，restore/create race 中收到 session-death event 时会清理 stale mapping；
- `ChannelBase` 在 bridge swap 后重新绑定 listener，避免 prompt stream listener 泄漏。
- optional `listSessions()` 返回 `BridgeSessionInfo[]`，让 adapter/诊断工具能看到当前 bridge 内 session id、workspace 和 active prompt 状态。

```mermaid
flowchart LR
  Adapter["Channel adapter"] --> Router["SessionRouter"]
  Router --> Bridge["ChannelAgentBridge"]
  Bridge --> Session["agent session"]
  Session --> Events["event stream"]
  Events --> Adapter
```

---

## 3. 插件兼容策略

TypeScript 插件如果显式把 adapter 构造参数标成 `AcpBridge`，应迁移到 `ChannelAgentBridge`；运行时 JavaScript 插件保持结构兼容。这样现有 standalone ACP-backed 启动路径不被破坏，同时新 adapter 或测试 double 可以只实现 contract。

#5978 本身没有实现 `qwen serve --channel` 或 daemon-managed worker；它先把 adapter 合约提前收窄，降低后续 bridge 替换的耦合成本。#6031 已把 daemon-managed worker 合入 main：serve 进程 fork internal `channel daemon-worker`，worker 使用 TS SDK + `DaemonChannelBridge` 回连 daemon，并强制 thread-scoped daemon session，避免污染默认 single session。#6098 则把该 worker 从“能启动”加固到“能运行”：ready 后有界重启、IPC heartbeat/stale kill、partial-connect issue、pidfile workerPid 清理和日志脱敏。#6165 用 `turn_complete` / `turn_error` 释放 per-session barrier，主路径不再靠 `setTimeout(0)` 猜测 SSE chunk drain；#6182 让 `DaemonChannelBridge` 从内部 `sessions` map 和 `activePrompts` set 构造 session snapshot，并由 daemon-worker facade optional 透传。#6309 对 load replay 的影响是 bridge 可以从 ACP response seed 当前 snapshot，随后 channel/ACP stream attach 再从 snapshot 发 replayed `session/update`，而不是在 restore 期间把历史帧逐条推进 live EventBus。#6598 给 worker supervisor 增加 `restart()`，对外暴露 HTTP/SDK/CLI reload 面，支持不重启 daemon 的 settings reload。#6741 把 selection lifecycle 抽到 `ChannelWorkerManager`，daemon 即使启动时未带 `--channel`，也能后续通过 API 设置 selection。

### 3.1 daemon-managed channel worker reload（#6598）

`ChannelWorkerSupervisor.restart()` 是 stop+start relaunch：当前 worker 停止后重新 fork，让新 worker 重新读取 `settings.json` 中的 channel token、proxy、per-channel model 等配置。并发 reload 会合并到同一个 Promise，避免一连串 reload 请求 fork 多个 worker；`killAllSync()` 会 latch `disposed`，reload 与 daemon teardown 竞争时不再 relaunch。

对外有三条入口：

- HTTP：`POST /workspace/channel/reload`，走 strict mutation auth；worker 未启用时返回 `409 channel_worker_not_enabled`，成功返回 `{ reloaded:true, worker:<snapshot> }`。
- SDK：`DaemonClient.reloadChannelWorker()`，建议先检查 `channel_reload` capability。
- CLI：`qwen channel reload`，支持 `--daemon-url` / `--token`，并回退 `QWEN_DAEMON_URL` / `QWEN_SERVER_TOKEN`。

能力 `channel_reload` 只有在 `getChannelWorkerSnapshot` 和 `reloadChannelWorker` 两个 deps 都被 wire 时才广告；route 也使用同一条件注册，避免客户端看到 capability 但调用 route 404。

### 3.2 multi-workspace channel worker grouping（#6635）

#6635 把 selected channels 先解析为 workspace groups：显式 cwd 或 workspace-scoped channel config 归属对应 trusted workspace；user/system scope 无 cwd 的 channel 视为 ambiguous；未注册 cwd 返回 mismatch；untrusted workspace fail fast。`--channel all` 暂保持 primary-only v1，避免自动展开所有 workspace channel 改变既有语义。

每个 trusted workspace group 启动一个 `ChannelWorkerSupervisor`，worker 绑定 runtime workspace cwd、`QWEN_DAEMON_WORKSPACE` 和 `runtime.env.effectiveEnv`，webhook config 也从 owner workspace 读取。`ChannelWorkerGroup` 管理多个 supervisors：start 顺序执行并在失败时回滚；restart 是 daemon-wide fail-closed transaction，任一 worker restart 失败会 stop 整组，避免混合 generation 继续对外服务；webhook dispatch 按 channel owner 路由，找不到 worker 时返回 `channel_worker_unavailable`。

兼容面：单 workspace 时 pidfile/status 保持旧字段；multi-workspace 时 pidfile `workers[]` 记录 `workspaceId/workspaceCwd/channels/workerPid`，`/daemon/status.runtime.channelWorkers[]` 暴露完整列表，旧 `channelWorker` 与 reload response 仍指 primary 或首个 worker。

### 3.3 runtime daemon channel control（#6741）

#6741 新增 `ChannelWorkerManager` 和 `channel_control` capability，把 channel worker selection 变成 daemon runtime resource。runtime selection 是临时控制态：`PUT` 不写 settings 或 boot options，daemon 重启后仍回到 `qwen serve --channel` 的启动选择，或在未传该参数时保持 disabled。入口包括：

- HTTP：`GET /workspace/channel` 查询 selection/worker snapshot，`PUT /workspace/channel` 设置或替换 selection，`DELETE /workspace/channel` 停止并清空 selection，`POST /workspace/channel/reload` 沿用 reload 语义。
- SDK：channel control helpers 与既有 `reloadChannelWorker()` 分层，客户端先 gate `channel_control` / `channel_reload`。
- CLI：`qwen channel set`、`qwen channel status`、`qwen channel stop` 走 daemon API。

manager 串行化 lifecycle mutation，并复用 #6635 的 worker group reconcile：未变化 workspace worker 保持运行，新增/删除 group 做精确启动/停止；替换失败回滚到旧 selection、PID file 和 webhook routing state。worker callbacks 带 generation，替换前 worker 的 late ready/exit 只记录日志，不覆盖当前状态；daemon drain/shutdown 返回 `daemon_draining`。worker shutdown 还保留 PID lease 直到 child exit 被确认，避免 stale exit race 下重复 worker。

---

## 4. 涉及 PR

| PR | 状态 | 解决的问题 | 最终实现 |
|---|---|---|---|
| #5978 | merged | adapter 直接依赖 `AcpBridge`，后续切 daemon-backed / fake bridge 时耦合过重。 | 引入 `ChannelAgentBridge` contract，router/adapter 改依赖窄接口，修复 bridge lifecycle 与 listener 重新绑定边界，保留 `AcpBridge` 作为 standalone 实现。 |
| #6031 | merged | `qwen serve --channel` 尚不能由 daemon 托管 channel worker。 | 新增 repeatable `--channel` / `--channel all`、serve-owned worker supervisor、`DaemonChannelBridge` 回连、thread-scoped session load/create、pidfile ownership 与 `/daemon/status` worker snapshot。 |
| #6098 | merged | daemon-managed worker 缺少 ready 后恢复、心跳、日志脱敏和 stale pid/status 诊断。 | ready 后按 5 分钟 3 次策略重启；15s heartbeat / 45s stale kill；worker stdout/stderr 脱敏与有界 buffer；status 暴露 partial connect、restart/error fields。 |
| #6165 | merged | prompt 返回前靠 `setTimeout(0)` 等 late SSE chunks，时序不确定。 | `DaemonChannelBridge` 建 per-session turn barrier；`turn_complete` 释放正常完成，`turn_error` 记录协议错误后释放；drop/cancel/stop 也释放以防悬挂，非 SSE 路径保留 one-tick fallback。 |
| #6182 | merged | adapter/诊断工具无法枚举 bridge 当前 sessions。 | `ChannelAgentBridge` 增加 optional `listSessions()`；`DaemonChannelBridge` 返回 session id、workspace 和 `hasActivePrompt` snapshot；daemon-worker facade 按 optional method 透传。 |
| #6309 | open | 大历史 session load 逐帧 child-to-daemon replay 会污染 live fanout 与 ring。 | daemon bridge 可请求 response-mode replay，并用 ACP response 中的私有 replay payload seed snapshot；direct ACP 默认 streamed replay 兼容。 |
| #6598 | merged | channel settings 变更需要重启整个 daemon 才能生效。 | `ChannelWorkerSupervisor.restart()` relaunch worker 并重读 settings；新增 strict HTTP reload route、SDK helper、CLI `qwen channel reload` 和条件能力 `channel_reload`。 |
| #6635 | merged | multi-workspace daemon 中 channel worker 仍绑定 primary workspace，secondary workspace channel 会读错 env/settings/status。 | selected channels 按 owning trusted workspace 分组，每组一个 supervisor；`ChannelWorkerGroup` 提供 fail-closed group restart、webhook owner routing、pidfile `workers[]` 与 status `channelWorkers[]`。 |
| #6741 | merged | daemon 启动后无法启用、替换、查询或停止 channel worker selection。 | 新增 runtime `ChannelWorkerManager`、`channel_control` capability、HTTP/SDK/CLI selection control，并在替换失败时回滚旧 worker group/pidfile/webhook state。 |

---

## 5. 已知限制 / 后续

1. 多账号隔离、平台风控和长期 worker 调度仍需要后续 PR 单独落地。
2. daemon-managed worker 已支持 restart/heartbeat、prompt turn barrier、session listing、settings reload、workspace grouping 和 #6741 runtime selection control；多进程 rolling upgrade、跨 daemon worker 迁移仍未在本页覆盖。
3. 新插件应优先面向 `ChannelAgentBridge` 编程，只有 standalone ACP-backed 路径才需要知道 `AcpBridge`。
