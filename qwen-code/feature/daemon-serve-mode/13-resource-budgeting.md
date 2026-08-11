# daemon 资源预算、容量模型与公平调度

> 口径：本文记录 #8093 当前 draft/open diff 的 resource foundation、#8245 当前 open diff 的 daemon memory budget reporting、#8423 已合入的 memory pressure observe mode、#8462 已合入的 active ACP child RSS aggregate、#8508 已合入的 child heap partition status model、#8911 已合入的 daemon ACP NDJSON buffers，以及 #8947 当前 open diff 的 ACP transport resource guard。open/draft PR 只能作为当前方案记录，不能描述为 `main` 已落地能力。

## 背景

multi-workspace daemon 已经把 workspace runtime、session ownership、EventBus replay、file/transcript paging 等边界拆开，但资源保护仍主要停留在 workspace/session 数量、MCP client budget 和各 route 的局部 byte cap。缺口在于：bulk 操作、spawn/process work、buffered process output、fanout/replay/export 等路径可能共享同一 Node 进程内存与队列；单个 workspace 的重活如果没有全局和 per-workspace 公平 admission，会挤占其它 workspace 的 prompt completion、错误响应、cleanup 和 shutdown 空间。

#8093 的目标是把可复用的资源预算 primitive 单独拆出来，先让 reviewer 审完 accounting、fairness 和 failure taxonomy，再由后续 PR 接入具体 production routes。#8245 补 daemon status 的 memory denominator：把 configured/effective/modeled memory budget 先在 boot/status/protocol/SDK 上报告清楚，为后续 admission/enforcement 提供容量基线。#8423 在 denominator 之上新增 observe-only pressure ratio，#8462 把 ACP child RSS 从 primary-only 扩展为所有 live managed children 的 aggregate 观测，#8508 则在 modeled child pool 上发布每个 ACP child 的恒定 heap 分区模型，但仍不应用、不拒绝 spawn。#8911 是第一段已接入生产 daemon-owned ACP child 的 buffer bound：它限制 NDJSON frame 与 decoded inbound queue；#8947 当前 open diff 继续覆盖 ACP SDK dispatch 后的 handler/outbound/request 队列。

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

## Memory Pressure Observe Mode（#8423 已合入）

#8423 不接 admission 或 kill 逻辑，只在 status 中报告 daemon root 的真实内存压力。`--memory-pressure-mode off|observe` 默认 `observe`；`runtime.memory.pressure` 同时计算 daemon root RSS / available memory 与 V8 heap used / heap size limit，取较大者作为 `ratio`，并标注 `source` 为 `rss`、`heap` 或 `unknown`。

pressure response 包含 `mode`、`level`、`ratio`、`rssBytes`、`rssRatio`、`availableBytes`、`heapUsedBytes`、`heapRatio`、`heapLimitBytes`。observe 模式只产生 `daemon_memory_pressure` warning，即使 critical 也不把 status rollup 升为 error；off 模式仍可返回 pressure 字段但不产生 issue。available memory 使用 cgroup/host 真实可用容量，而不是 #8245 的 modeled/effective advisory budget。

## Active ACP Child RSS Aggregate（#8462 已合入）

#8462 将 status 中的 `runtime.memory.childRssCoverage` 从 primary-only 扩展为 `active_children`，并新增 `runtime.memory.children`。daemon 构建 status 时用与 `activeAcpChildren` 相同的 live-channel predicate 同步遍历 managed runtimes，把有缓存读数的 ACP child RSS 求和，返回 `rssBytes`、`sampled` 和 `oldestReadingAgeMs`。

没有 RSS snapshot 的 active child 不贡献字节也不计入 sampled，因此调用方可以用 `sampled / activeAcpChildren` 判断观测覆盖率。aggregate 仍不折入 #8423 的 pressure ratio，因为它不是完整 process tree RSS，可能 double-count shared pages，也缺少 MCP descendant / channel worker 的子进程树数据。

## Child Heap Partition Status Model（#8508 已合入）

#8508 在 #8245 的 modeled memory budget 上继续建模“如果后续要约束 ACP child old-space，应该怎样把 child pool 切给每个 child”。它新增 `--child-heap-mode off|observe`，默认 `observe`；`enforce` 不是合法取值。status 新增 `limits.memory.childHeap`：

- `mode`: 当前 child heap 建模模式。
- `maxConcurrentChildren`: 按模型可容纳的最大 ACP child 数。
- `perChildCeilingMb`: 每个 child 的恒定建模 old-space ceiling；当 child pool 连一个 512MB floor child 都容不下时为 `null`。
- `refusals`: observe 模式下真实 spawn 会超出建模 child 上限的次数。

关键修正是“恒定分区 + admission cap”，而不是按派生时刻重新分摊。早期按 live child 数动态计算 share 会授权 `P + P/2 + P/3 + ...`，因为 V8 无法降低已经运行 child 的 ceiling；#8508 改为所有 child 使用同一个建模 ceiling，并把 `maxConcurrentChildren * perChildCeilingMb <= modeled.childPoolMb` 固定为不变量。零池场景也不再报告 `perChildCeilingMb:0`，因为 `--max-old-space-size=0` 在 V8 中代表默认 heap，而不是零上限；正确结果是 `maxConcurrentChildren:0`、`perChildCeilingMb:null`。

这个 PR 只报告，不改变 child argv。ACP child 仍使用 host-derived `--max-old-space-size`，不会用 `perChildCeilingMb`，也不会因 modeled child limit 被拒绝。`limits.memory.enforced` 继续是 required literal `false`。早期 enforcement machinery（`getAcpMemoryArgs(explicitMb?)`、`ChildHeapPoolExhaustedError`、transport error mappings）被删除，避免发布没有安全启用依据的开关。

`refusals` 只代表 admission pressure，不代表 partition 可以安全 enforce。是否能 enforce 还需要每个 child 的 peak old-space measurement，而不是现有 RSS 或 `heapUsed`；这条测量链不在 #8508 范围内。

## Daemon ACP NDJSON Buffer Bounds（#8911 已合入）

#8911 将 resource budgeting 从 observe-only 状态推进到一条具体生产通路：`qwen serve` 创建的 daemon-owned ACP child 会启用 bounded `ndJsonStream`。入站/出站 NDJSON frame limit 固定为 64 MiB；decoded inbound queue 同时限制 256 条消息和 64 MiB retained wire bytes，并使用 conservative charge 防止大量小消息绕过 byte cap。

admission 在 decode/parse 前完成。frame 超限、decoded queue 饱和或 EOF 时仍有 unterminated frame，都会报告 typed transport cause、cancel input、正常关闭 decoded stream 并终止精确 tracked child。这样既阻断 daemon root memory growth，也避免 ACP SDK receive loop 因 rejected stream 出现 unhandled rejection。parse failure 日志只记录 error kind、byte length 与 SHA-256 digest，不记录 child-controlled payload。

这条能力和 #8093 的 `ResourceBudget` 不是同一个 enforcement plane：#8911 使用固定 transport-local bounds，不广告 daemon-wide resource capability，也不把 EventBus/export/process 等其它 route 纳入预算。

## ACP Transport Resource Guard Follow-up（#8947 当前 open）

#8947 当前 open diff 继续补 #8911 覆盖不到的 ACP SDK 内部队列。它在 daemon-owned channel 上做 bounded JSON-RPC envelope admission，并为 active handlers、prepared responses、pre-SDK outbound operations、outstanding request IDs 维护 count/byte 账本；release 点分别绑定 handler response delivery、outbound notification local delivery 和 request settlement。

fatal protocol、serialization、EOF 或 admission failure 会立即把精确 workspace channel generation 标记 unavailable，终止 tracked child，并阻止 initialize/create/restore/attach/prompt/status 复用该 channel。已经在 fatal 前 complete admitted 的 frame 仍按顺序交付。该 PR 仍 open，当前文档只能作为方案观察，不能写成 `main` 已落地资源 enforcement。

## 当前未接入项

#8093 明确不做以下事情：

- 不改变 `qwen serve` 生产 route 行为。
- 不新增 `/capabilities` feature tag。
- 不把 resource snapshot 暴露到 status route。
- 不接 EventBus replay、workspace transcript、session archive/export、Voice、process shell、MCP 或 route body admission。
- #8245 只报告 configured/effective/modeled budget 与 status denominator，不做 admission、enforcement、ACP child argv 调整、process-tree shutdown 或 workspace lifecycle cleanup。
- #8423 只观察 daemon root RSS/heap pressure，不做 admission、throttle、kill 或 child aggregate pressure。
- #8462 已合入的 active child RSS aggregate，但该 aggregate 仍是 status 观测字段，不代表完整进程树，也不参与 enforcement。
- #8508 已合入的 child heap partition status model，但不应用 per-child ceiling、不拒绝 spawn、不提供 enforce 模式，也不声称 `refusals:0` 可作为强制启用信号。
- #8911 已对 daemon-owned ACP child 的 raw NDJSON 与 decoded inbound queue 接入固定 bounds，但不覆盖 ACP SDK handler/outbound/pending-response/outstanding request 队列。
- #8947 当前 open diff 才补 handler/outbound/request 队列 guard；在合入前不能作为生产行为承诺。

这些内容应在后续 PR 按 route ownership、error taxonomy 与 client compatibility 分批接入。

## 验证

当前 draft 的测试集中在 primitive 层：

- `resource-budget.test.ts`: atomic composite reservation、normal/completion reserve、emergency pool、lease split/grow/shrink/transfer/release、invalid config 和 overflow。
- `fair-daemon-bulk-scheduler.test.ts`: global/per-workspace limit、公平轮转、queue overflow、abort、timeout、seal、nested same-lane/cross-lane rejection。
- `buffered-process-budget.test.ts`: 先预留 process bytes、完成路径释放、admission failure 不进入 lane。
- #8245 当前 diff 另覆盖 daemon memory budget unit tests、serve status wiring tests、protocol/SDK type tests 和 docs 更新；重点确认 configured/effective budget 分离、cgroup/host cap 截断、低于 minimum 时报告 `insufficientMemory`、wire 上 `enforced:false`，以及 ACP child argv/spawn 行为不变。
- #8423 当前 diff 覆盖 memory pressure unit/status/SDK tests，验证 rss/heap winner、unknown denominator、off/observe issue behavior 与 status shape。
- #8462 已合入的 focused status tests，覆盖 sampled gaps、pre-age bridge、dormant exclusion 与 active child aggregate response。
- #8508 已合入的 child heap policy / daemon status / serve flag tests，覆盖 2/8/32/256GB host 下的 partition invariant、零池 `null` ceiling、observe/off child argv 不变、`enforce` 被 yargs 与 fast path 拒绝，以及 `limits.memory.enforced:false` 的协议兼容。
- #8911 已合入的 ACP bridge / daemon runtime focused tests，覆盖 frame limit、decoded queue count/bytes、unterminated EOF、metadata-only parse failure 和 exact child termination。
- #8947 当前 open diff 声明覆盖 ACP bridge guard、daemon runtime、build/typecheck/lint、Prettier 与 SDK backpressure probes；合入前仍按 open diff 观察处理。

## PR 归因

| PR | 状态 | 贡献 |
|---|---|---|
| [#8093](https://github.com/QwenLM/qwen-code/pull/8093) | open draft | 新增 daemon resource budget foundation、fair schedulers、buffered process runner 和 Phase 1 设计文档。 |
| [#8245](https://github.com/QwenLM/qwen-code/pull/8245) | open | 解析并报告 daemon memory budget figures，给 `/daemon/status`、协议与 SDK 增加 configured/effective/modeled budget 和 non-enforcement 口径。 |
| [#8423](https://github.com/QwenLM/qwen-code/pull/8423) | merged | 在真实 cgroup/host/heap denominator 上观察 daemon root memory pressure，默认 observe-only 并通过 status issue 报告 warning。 |
| [#8462](https://github.com/QwenLM/qwen-code/pull/8462) | merged | 汇总所有 live managed ACP child 的 cached RSS，报告 aggregate bytes、sampled count 和 oldest reading age。 |
| [#8508](https://github.com/QwenLM/qwen-code/pull/8508) | merged | 发布 observe-only child heap partition model，报告 `limits.memory.childHeap`，保持 child argv 与 `limits.memory.enforced:false` 不变，并移除不安全的 enforce 路径。 |
| [#8911](https://github.com/QwenLM/qwen-code/pull/8911) | merged | 为 daemon-owned ACP child 启用 bounded NDJSON frame 与 decoded queue，超限时低敏记录并终止精确 child。 |
| [#8947](https://github.com/QwenLM/qwen-code/pull/8947) | open | 当前 open diff 补 ACP SDK handler/outbound/prepared response/outstanding request guard 与 fatal channel generation isolation。 |
