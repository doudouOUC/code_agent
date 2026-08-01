# daemon 资源预算、容量模型与公平调度

> 口径：本文记录 #8093 当前 draft/open diff 的 resource foundation，以及 #8245 当前 open diff 的 daemon memory budget reporting。两者都尚未合入；只能作为当前方案记录，不能描述为 `main` 已落地能力。

## 背景

multi-workspace daemon 已经把 workspace runtime、session ownership、EventBus replay、file/transcript paging 等边界拆开，但资源保护仍主要停留在 workspace/session 数量、MCP client budget 和各 route 的局部 byte cap。缺口在于：bulk 操作、spawn/process work、buffered process output、fanout/replay/export 等路径可能共享同一 Node 进程内存与队列；单个 workspace 的重活如果没有全局和 per-workspace 公平 admission，会挤占其它 workspace 的 prompt completion、错误响应、cleanup 和 shutdown 空间。

#8093 的目标是把可复用的资源预算 primitive 单独拆出来，先让 reviewer 审完 accounting、fairness 和 failure taxonomy，再由后续 PR 接入具体 production routes。#8245 则补 daemon status 的 memory denominator：把 configured/effective/modeled memory budget 先在 boot/status/protocol/SDK 上报告清楚，为后续 admission/enforcement 提供容量基线。

## ResourceBudget

`packages/cli/src/serve/resource-budget.ts` 新增同步 process-wide `ResourceBudget`。它的核心入口是 `tryReserveComposite(requests, {priority, owner})`：

- composite reservation 会先归并同 category bytes，再同时检查 parent cap、normal admission cap 与 category cap，全部通过后才原子提交。
- 默认总 cap 是 512 MiB，normal admission cap 是 384 MiB；normal work 不能吃掉 completion reserve，`priority:'completion'` 可以使用 reserve。
- category cap 覆盖 `runtime`、`session`、`connection`、`ingress`、`websocket_assembly`、`outbound`、`prompt`、`replay`、`virtual_transcript`、`background`、`voice`、`process`、`export`、`fanout`、`emergency`。
- emergency pool 默认低于 3 MiB，不能和业务 category 混合预留，给错误响应和最后一公里 cleanup 留出空间。

成功 admission 返回 `ResourceBudgetLease`。lease 支持 split、grow、shrink、transfer owner 和 idempotent release；失败返回 `ResourceAdmissionError`，带 `errorKind:'resource_admission_exhausted'`、503、limit/requested bytes 和 retryable 标记。`snapshot()` 暴露 current/high-water/category caps，供后续 status/health 接入。

## Fair Scheduler Lanes

`packages/cli/src/serve/fair-daemon-bulk-scheduler.ts` 定义三类 lane：

| lane | 用途 | 默认全局 active/wait | per-workspace |
|---|---|---:|---:|
| daemon_bulk | 批量维护、导出、扫描等重活 | 4 / 128 | active 1，wait 16 |
| daemon_spawn | child/runtime spawn 类工作 | 4 / 128 | wait 16 |
| daemon_process | 会产生 buffered output 的 process 工作 | 4 / 128 | wait 16 |

scheduler 按 workspace round-robin drain，避免单 workspace 队列占满 global slots。queued item 支持 abort、30s wait timeout、seal admission；active task 用 AsyncLocalStorage 标记当前 lane，拒绝同 lane nested operation 以及 cross-lane nested acquisition，防止一个重活在持有 active slot 时递归占更多 slot。

## Buffered Process Runner

`packages/cli/src/serve/buffered-process-budget.ts` 将预算和 scheduler 组合起来：调用方传入 `maximumBufferedBytes`，runner 先在 `process` category 预留 buffer 容量，再进入 daemon_process lane 执行任务。无论任务成功、失败、abort 或 timeout，finally 都释放 lease。这个顺序保证“排队/执行 process 工作”之前，最坏输出 buffer 已经被预算覆盖。

## Daemon Memory Budget Reporting（#8245 当前 open）

#8245 当前 open diff 在 daemon boot 时解析 memory budget figures，并通过 `/daemon/status`、wire protocol、SDK types 和 docs 报告。核心字段分三层：

- `configured`: 用户显式配置或默认预算，表达“想给 daemon 多少内存”。
- `effective`: configured 预算被 cgroup 或 host memory cap 截断后的实际可用预算。
- `modeled`: 基于 effective budget 推导出来的 daemon/child/reserve/share 等 advisory quantities。

如果 derived budget 低于 documented minimum，状态报告 `insufficientMemory`，而不是向上 clamp 后假装可用。wire 上显式 `enforced:false`，per-child shares 标为 advisory；该 PR 不改变 ACP child spawn argv，不接 admission，不改变 route 行为，也不把 #8093 的 `ResourceBudget` 接到生产路径。它的作用是先让 status 拥有可信 denominator，从而能回答“当前 RSS/heap 离预算还有多远”。

关键路径：

- `packages/acp-bridge/src/daemon-memory-budget.ts`: configured/effective/modeled budget 解析与 cgroup/host cap 处理。
- `packages/cli/src/serve/runQwenServe.ts`: boot 阶段 resolve memory budget 并注入 status provider。
- `packages/cli/src/serve/status.ts`: `/daemon/status` 输出 memory budget 与 `enforced:false`。
- `packages/cli/src/serve/types.ts` 与 `packages/sdk-typescript/src/daemon/`: wire protocol / SDK 类型。
- `docs/design/2026-07-31-daemon-capacity-model-and-memory-bounds.md`: 容量模型与非 enforcement 边界。

## 当前未接入项

#8093 明确不做以下事情：

- 不改变 `qwen serve` 生产 route 行为。
- 不新增 `/capabilities` feature tag。
- 不把 resource snapshot 暴露到 status route。
- 不接 EventBus replay、workspace transcript、session archive/export、Voice、process shell、MCP 或 route body admission。
- #8245 只报告 configured/effective/modeled budget 与 status denominator，不做 admission、enforcement、ACP child argv 调整、process-tree shutdown 或 workspace lifecycle cleanup。

这些内容应在后续 PR 按 route ownership、error taxonomy 与 client compatibility 分批接入。

## 验证

当前 draft 的测试集中在 primitive 层：

- `resource-budget.test.ts`: atomic composite reservation、normal/completion reserve、emergency pool、lease split/grow/shrink/transfer/release、invalid config 和 overflow。
- `fair-daemon-bulk-scheduler.test.ts`: global/per-workspace limit、公平轮转、queue overflow、abort、timeout、seal、nested same-lane/cross-lane rejection。
- `buffered-process-budget.test.ts`: 先预留 process bytes、完成路径释放、admission failure 不进入 lane。
- #8245 当前 diff 另覆盖 daemon memory budget unit tests、serve status wiring tests、protocol/SDK type tests 和 docs 更新；重点确认 configured/effective budget 分离、cgroup/host cap 截断、低于 minimum 时报告 `insufficientMemory`、wire 上 `enforced:false`，以及 ACP child argv/spawn 行为不变。

## PR 归因

| PR | 状态 | 贡献 |
|---|---|---|
| [#8093](https://github.com/QwenLM/qwen-code/pull/8093) | open draft | 新增 daemon resource budget foundation、fair schedulers、buffered process runner 和 Phase 1 设计文档。 |
| [#8245](https://github.com/QwenLM/qwen-code/pull/8245) | open | 解析并报告 daemon memory budget figures，给 `/daemon/status`、协议与 SDK 增加 configured/effective/modeled budget 和 non-enforcement 口径。 |
