# Channel adapters 技术方案

> 适用范围：`QwenLM/qwen-code` channels 包与 CLI channel registry。本文只按 `@doudouOUC` 个人 PR 口径整理。

---

## 1. 背景与动机

Channel adapter 让 qwen-code 可以从本地 TUI 之外的消息通道接收用户输入。adapter 不应该依赖某个具体 bridge 实现，否则后续要切到 daemon-backed bridge、测试 fake bridge 或多 channel bridge 时，所有 adapter 都会被迫跟着底层类名和生命周期细节变化。

#5978 的目标是把 adapter-facing 依赖从具体 `AcpBridge` 收窄为 `ChannelAgentBridge` contract：adapter 只需要知道“创建/恢复 session、发送 prompt、订阅事件、清理 session”等 agent-session 行为，不再把 `AcpBridge` 当成唯一实现。

---

## 2. ChannelAgentBridge 合约

`ChannelAgentBridge` 是 adapter 与 agent runtime 之间的窄接口：

- `SessionRouter` 和 adapter 构造参数面向 bridge contract，而不是具体 `AcpBridge`；
- standalone `qwen channel start` 仍由现有 `AcpBridge` 实现，不改变默认运行路径；
- thread-scoped `/clear`、`/status` 与 prompt 使用同一 routing key，router 可以按 bridge session id 移除所有状态；
- restore 会拒绝非法 session id，restore/create race 中收到 session-death event 时会清理 stale mapping；
- `ChannelBase` 在 bridge swap 后重新绑定 listener，避免 prompt stream listener 泄漏。

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

#5978 没有实现 `qwen serve --channel` 或 daemon-managed worker；它只是把 adapter 合约提前收窄，降低后续 bridge 替换的耦合成本。#6031 正在 open 状态下补 daemon-managed worker，本页只登记其目标和归属，待合入后再按最终 diff 写成已落地能力。

---

## 4. 涉及 PR

| PR | 状态 | 解决的问题 | 最终实现 |
|---|---|---|---|
| #5978 | merged | adapter 直接依赖 `AcpBridge`，后续切 daemon-backed / fake bridge 时耦合过重。 | 引入 `ChannelAgentBridge` contract，router/adapter 改依赖窄接口，修复 bridge lifecycle 与 listener 重新绑定边界，保留 `AcpBridge` 作为 standalone 实现。 |
| #6031 | open | `qwen serve --channel` 尚不能由 daemon 托管 channel worker。 | 当前分支计划新增 repeatable `--channel` / `--channel all`、serve-owned worker supervisor、`DaemonChannelBridge` 回连、thread-scoped session load/create、pidfile ownership 与 `/daemon/status` worker snapshot；未合入，不作为 main 已落地能力。 |

---

## 5. 已知限制 / 后续

1. #6031 仍 open；daemon-managed channel worker 合入前，本页不把它写成 main 能力。
2. 多账号隔离、平台风控和长期 worker 调度仍需要后续 PR 单独落地。
3. 新插件应优先面向 `ChannelAgentBridge` 编程，只有 standalone ACP-backed 路径才需要知道 `AcpBridge`。
