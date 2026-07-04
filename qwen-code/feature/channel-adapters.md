# Channel adapters 技术方案

> 适用范围：`QwenLM/qwen-code` channels 包与 CLI channel registry。本文只按 `@doudouOUC` 个人 PR 口径整理。

---

## 1. 背景与动机

Channel adapter 让 qwen-code 可以从本地 TUI 之外的消息通道接收用户输入。adapter 不应该依赖某个具体 bridge 实现，否则后续要切到 daemon-backed bridge、测试 fake bridge 或多 channel bridge 时，所有 adapter 都会被迫跟着底层类名和生命周期细节变化。

#5978 的目标是把 adapter-facing 依赖从具体 `AcpBridge` 收窄为 `ChannelAgentBridge` contract：adapter 只需要知道“创建/恢复 session、发送 prompt、订阅事件、清理 session”等 agent-session 行为，不再把 `AcpBridge` 当成唯一实现。#6031 在此基础上让 `qwen serve --channel` 托管 out-of-process channel worker；#6098 再补 worker restart、heartbeat、status issue 和日志脱敏；#6165 把 daemon prompt completion 从 one-tick guess 改为 `turn_complete` SSE barrier；#6182 给 bridge 增加 session listing；#6309 进一步让 daemon-owned load replay 可以由 bridge snapshot 批量承接，避免历史帧走 live fanout。

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

#5978 本身没有实现 `qwen serve --channel` 或 daemon-managed worker；它先把 adapter 合约提前收窄，降低后续 bridge 替换的耦合成本。#6031 已把 daemon-managed worker 合入 main：serve 进程 fork internal `channel daemon-worker`，worker 使用 TS SDK + `DaemonChannelBridge` 回连 daemon，并强制 thread-scoped daemon session，避免污染默认 single session。#6098 则把该 worker 从“能启动”加固到“能运行”：ready 后有界重启、IPC heartbeat/stale kill、partial-connect issue、pidfile workerPid 清理和日志脱敏。#6165 用 `turn_complete` / `turn_error` 释放 per-session barrier，主路径不再靠 `setTimeout(0)` 猜测 SSE chunk drain；#6182 让 `DaemonChannelBridge` 从内部 `sessions` map 和 `activePrompts` set 构造 session snapshot，并由 daemon-worker facade optional 透传。#6309 对 load replay 的影响是 bridge 可以从 ACP response seed 当前 snapshot，随后 channel/ACP stream attach 再从 snapshot 发 replayed `session/update`，而不是在 restore 期间把历史帧逐条推进 live EventBus。

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

---

## 5. 已知限制 / 后续

1. 多账号隔离、平台风控和长期 worker 调度仍需要后续 PR 单独落地。
2. daemon-managed worker 已支持 restart/heartbeat、prompt turn barrier 和 session listing，但多进程 rolling upgrade、跨 daemon worker 迁移仍未在本页覆盖。
3. 新插件应优先面向 `ChannelAgentBridge` 编程，只有 standalone ACP-backed 路径才需要知道 `AcpBridge`。
