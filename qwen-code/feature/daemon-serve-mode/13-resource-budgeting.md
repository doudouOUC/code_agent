# daemon 资源预算、容量模型与公平调度

> 口径：本文记录 #8093 closed draft 的 resource foundation 观察、#8245 已合入的 daemon memory budget reporting、#8423 已合入的 memory pressure observe mode、#8462 已合入的 active ACP child RSS aggregate、#8508 已合入的 child heap partition status model、#8911 已合入的 daemon ACP NDJSON buffers、#8947/#9007 已合入的 ACP transport resource guard 与 HTTP pre-attach buffer byte budget、#9380 已合入的 ACP child peak old-generation measurement、#11428 已合入的容量策略常量解耦、#11515 已合入的默认256注册容量、#11653 已合入的无限 cgroup 哨兵修复、#11911 已合入的 opt-in ACP child 数量准入、#11940 已合入的空闲 child 回收，以及 #12008 当前 open 的用户确认 runtime stop。closed/open draft PR 只能作为当前方案记录，不能描述为 `main` 已落地能力。

## 背景

multi-workspace daemon 已经把 workspace runtime、session ownership、EventBus replay、file/transcript paging 等边界拆开，但资源保护仍主要停留在 workspace/session 数量、MCP client budget 和各 route 的局部 byte cap。#11515已把注册上限提升到256，并用独立800 total-session与25 Channel owner边界避免按注册数线性放大其它策略；#11911进一步提供显式开启的managed ACP child数量准入，#11940在首次拒绝后可自动回收一个零session/零activity warm child，但两者仍不应用child heap ceiling或读取实时RAM。loaded session占满名额时，#12008当前open方案再提供用户确认的runtime stop；它不是自动eviction，也尚未进入`main`。

#8093 的目标是把可复用的资源预算 primitive 单独拆出来，先让 reviewer 审完 accounting、fairness 和 failure taxonomy，再由后续 PR 接入具体 production routes。#8245 补 daemon status 的 memory denominator：把 configured/effective/modeled memory budget 先在 boot/status/protocol/SDK 上报告清楚，为后续 admission/enforcement 提供容量基线。#8423 在 denominator 之上新增 observe-only pressure ratio，#8462 把 ACP child RSS 从 primary-only 扩展为所有 live managed children 的 aggregate 观测，#8508 则在 modeled child pool 上发布每个 ACP child 的恒定 heap 分区模型；#11911只把该模型的最大child数量作为opt-in spawn gate，仍不应用per-child ceiling。#9380 已合入 enforcement 前需要的真实 old-generation peak measurement。#8911 是第一段已接入生产 daemon-owned ACP child 的 buffer bound：它限制 NDJSON frame 与 decoded inbound queue；#8947 已合入覆盖 ACP SDK dispatch 后的 handler/outbound/request 队列；#9007 已合入继续覆盖 ACP HTTP pre-attach buffered replies 和 delivery-owned leases。#11428 先把workspace注册上限、observe-only child建模上限与Channel控制事务预算从一个旧公开常量拆成三个owner；#11515随后只扩注册policy并给session、store与Channel增加各自边界。

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

## Daemon Memory Budget Reporting（#8245 已合入）

#8245 最终实现是在 daemon boot 时解析 memory budget figures，并通过 `/daemon/status`、wire protocol、SDK types 和 docs 报告。核心字段分三层：

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

#8508 在 #8245 的 modeled memory budget 上继续建模“如果后续要约束 ACP child old-space，应该怎样把 child pool 切给每个 child”。它最初新增 `--child-heap-mode off|observe`，默认 `observe`；#11911 后合法值还包括 opt-in `admit`，但仍没有把 modeled ceiling 传给 V8 的 `enforce` 模式。status 的 `limits.memory.childHeap` 包含：

- `mode`: 当前 child heap 建模模式。
- `maxConcurrentChildren`: 按模型可容纳的最大 ACP child 数。
- `perChildCeilingMb`: 每个 child 的恒定建模 old-space ceiling；当 child pool 连一个 512MB floor child 都容不下时为 `null`。
- `refusals`: policy 观察到超出建模 child 上限的 admission 次数；在 `admit` 下也会统计随后被拒绝的尝试。
- `admissionEnforced`: 数量准入是否真实接到 managed child factory，不能从 `mode` 字符串或 `limits.memory.enforced` 反推。

关键修正是“恒定分区 + admission cap”，而不是按派生时刻重新分摊。早期按 live child 数动态计算 share 会授权 `P + P/2 + P/3 + ...`，因为 V8 无法降低已经运行 child 的 ceiling；#8508 改为所有 child 使用同一个建模 ceiling，并把 `maxConcurrentChildren * perChildCeilingMb <= modeled.childPoolMb` 固定为不变量。零池场景也不再报告 `perChildCeilingMb:0`，因为 `--max-old-space-size=0` 在 V8 中代表默认 heap，而不是零上限；正确结果是 `maxConcurrentChildren:0`、`perChildCeilingMb:null`。

#8508 本身只报告、不改变 child argv；#11911 后显式 `admit` 会按 `maxConcurrentChildren` 拒绝新物理 child，但 ACP child 仍使用 host-derived `--max-old-space-size`，不会用 `perChildCeilingMb`。所以 `limits.memory.enforced` 继续是 required literal `false`，只表示 heap ceiling 未应用；数量 enforcement 必须读 `childHeap.admissionEnforced`。早期 heap enforcement machinery（`getAcpMemoryArgs(explicitMb?)`、`ChildHeapPoolExhaustedError`）没有恢复。

`refusals` 只代表 admission pressure，不代表 partition 可以安全 enforce。是否能 enforce 还需要每个 child 的 peak old-space measurement，而不是现有 RSS 或 `heapUsed`；这条测量链不在 #8508 范围内。

## ACP Child Peak Old-Generation Measurement（#9380 已合入）

#9380 已在 #8508 的 observe-only child heap partition model 之后补测量链。测量放在 daemon-spawned ACP child 内，而不是 daemon sampler；child 进程安装 `ChildHeapProbe`，通过既有 resource poll 每 5 秒上报 lifetime high-water。没有活跃 resource poll/streaming observer 时不采样，daemon status 返回 `runtime.memory.children.heap: null`，避免把未观测误读为零需求。

测量对象是整个 V8 old generation，而不是 `old_space` 单独一项。probe 汇总 old-generation heap spaces，记录 `peakOldGenerationBytes`、major GC 后仍存活的 `peakLiveSetBytes`、`peakTotalHeapBytes`、`majorGcCount`、`majorGcMs` 与 `unclassifiedSpaceNames`。未归类 heap space 非空时，其它 byte figures 可能低估，调用方必须把它当成 measurement completeness warning。

daemon status 对多个 child 的处理与 RSS 不同：RSS 是 aggregate sum，heap peak 是 per-child ceiling 语义下的 independent max，`reported` 表示贡献样本的 child 数。#9380 不改变 child spawn argv、不拒绝 spawn、不新增 enforce mode，`limits.memory.enforced:false` 保持不变；interactive CLI、IDE companion、direct embed 和 standalone ACP 不安装 probe。

## Daemon ACP NDJSON Buffer Bounds（#8911 已合入）

#8911 将 resource budgeting 从 observe-only 状态推进到一条具体生产通路：`qwen serve` 创建的 daemon-owned ACP child 会启用 bounded `ndJsonStream`。入站/出站 NDJSON frame limit 固定为 64 MiB；decoded inbound queue 同时限制 256 条消息和 64 MiB retained wire bytes，并使用 conservative charge 防止大量小消息绕过 byte cap。

admission 在 decode/parse 前完成。frame 超限、decoded queue 饱和或 EOF 时仍有 unterminated frame，都会报告 typed transport cause、cancel input、正常关闭 decoded stream 并终止精确 tracked child。这样既阻断 daemon root memory growth，也避免 ACP SDK receive loop 因 rejected stream 出现 unhandled rejection。parse failure 日志只记录 error kind、byte length 与 SHA-256 digest，不记录 child-controlled payload。

这条能力和 #8093 的 `ResourceBudget` 不是同一个 enforcement plane：#8911 使用固定 transport-local bounds，不广告 daemon-wide resource capability，也不把 EventBus/export/process 等其它 route 纳入预算。

## ACP Transport Resource Guard Follow-up（#8947 已合入）

#8947 已合入，继续补 #8911 覆盖不到的 ACP SDK 内部队列。它在 daemon-owned channel 上做 bounded JSON-RPC envelope admission，并为 active handlers、prepared responses、pre-SDK outbound operations、outstanding request IDs 维护 count/byte 账本；release 点分别绑定 handler response delivery、outbound notification local delivery 和 request settlement。

fatal protocol、serialization、EOF 或 admission failure 会立即把精确 workspace channel generation 标记 unavailable，终止 tracked child，并阻止 initialize/create/restore/attach/prompt/status 复用该 channel。已经在 fatal 前 complete admitted 的 frame 仍按顺序交付。该 PR 已合入 `main`，但 guard 只自动面向 daemon-owned ACP channel；public/standalone ACP 默认 legacy。

## ACP HTTP Pre-attach Buffer Byte Budget（#9007 已合入）

#9007 把 ACP HTTP pre-attach buffered JSON-RPC reply 从只按 frame 数限制推进到 serialized-byte accounting。prepared reply 只 stringify 一次并保存 UTF-8 buffer，admission 同时检查 per-stream、per-connection 与 process-global frame/byte budget；primary 和 dynamic workspace mounts 共享 global budget，stalled SSE/WS writer 持有 lease 直到 local delivery callback、close 或 failure 释放。

所有 ownership-granting `session/new`、`session/load`、`session/resume` 与 `session/fork` 改为 provisional receipt：只有 reply 本地 delivery 成功才 commit ownership；overflow、serialization failure、delivery failure 或 teardown 会 rollback fresh session、persisted fork 与新增 attachment。daemon status 与 TS SDK 暴露 limit/current/high-water、pending delivery ownership、guard failure 与 per-connection/mount attribution counters。

## Workspace Capacity Policy Decoupling（#11428 已合入）

#11428 是#11386的行为保持型P0。此前公开`MAX_DAEMON_WORKSPACES = 25`同时被三个不同owner读取：CLI用它限制用户workspace注册，ACP bridge用它限制child heap分区模型中的最大并发数，Channel控制默认deadline又用它乘启动/停止/回滚预算。将注册目标直接提高到256会同时改动后两项契约。

最终实现让CLI拥有`MAX_REGISTERED_WORKSPACES = 25`，child policy拥有私有`MAX_MODELED_ACP_CHILDREN = 25`，Channel timeout拥有私有`MAX_CHANNEL_CONTROL_WORKSPACES = 25`。旧公开常量仍以25保留并标记deprecated，只作导入兼容，内部策略不再读取；默认Channel事务预算保持2,130,000ms，child partition仍observe-only且不改变spawn argv，第26个用户workspace仍以409 `workspace_limit_reached`拒绝。

随PR合入的1/25/256空workspace测量和LRU设计用于后续容量决策；#11428本身不代表256注册、dormant runtime或eviction已实现。三个相同字面值属于独立策略，后续不能为了去重重新抽成共享默认值。注册扩容随后由#11515独立交付。

## Configurable 256-workspace Registration（#11515 已合入）

#11515把`MAX_REGISTERED_WORKSPACES`默认值提升到256，并新增operator-only `QWEN_SERVE_MAX_WORKSPACES`和embedded `ServeOptions.maxRegisteredWorkspaces`，有效范围1到256。显式option优先于启动环境，项目`.env`和项目settings被硬排除。`runQwenServe`在boot时只解析一次，并把同一值传给显式startup、完整持久化恢复、dynamic/scratch admission、transient promotion与store locked add；merged valid registrations超限时在listener发布前失败且不修改store。

注册容量大于25而未显式设置`maxTotalSessions`时，标准daemon固定默认总session上限800；单workspace或`--max-sessions 0/Infinity`都不会取消这个global cap，只有显式`--max-total-sessions 0`可关闭。低级embed不会仅凭注册值广告无法强制的800。`/capabilities`、`/daemon/status`和TS SDK新增optional `maxRegisteredWorkspaces`与`maxChannelControlWorkspaces`。

持久化仍用schema version 1，结构上限调整为255条secondary记录和8 MiB，并在atomic write前检查序列化UTF-8字节。Channel控制独立限制25个owner，准入覆盖current、pending、candidate及recovery保留owner并集，超限返回`channel_control_workspace_limit_reached`；原2,130,000ms SDK事务预算、observe-only ACP child模型和spawn argv都不变。默认256仍是policy，不是256个active runtime或800个模型session的资源安全证明。

## ACP child heap 无限 cgroup 哨兵（#11653 已合入）

#11653修复spawn argv与daemon状态模型使用不同“可用内存”来源的问题。Node/libuv在无cgroup限额时可能返回接近2^63或2^64的无限哨兵；旧spawn路径只判断正数，按其一半计算后总会撞到16 GiB封顶。最终`getAcpMemoryArgs()`复用`detectAvailableMemoryMb()`：只有正数且严格低于host total的constraint才有效，无限、等于或高于host的值都回退宿主内存。

50%比例、16,384 MiB上限、进程内一次性cache、只在目标高于当前V8 heap limit时下发的raise-only guard，以及`--expose-gc`均未改变。测试覆盖v1/v2哨兵、超宿主/等宿主、真实6/4/2 GiB限制、相等heap limit和64 GiB封顶，并锁定spawn/model常量一致性。该修复只收敛输入值；#11911后来补了opt-in进程数量准入，但#8182的低内存raise-only缺口、按child切分和RSS/heap enforcement仍未解决。

## Budget-based ACP Child Admission（#11911 已合入）

#11911把`--child-heap-mode admit`接到标准daemon的managed child spawn，默认仍是`observe`。daemon从唯一resolved memory budget构造一个policy，并让所有primary、secondary、dynamic及standalone managed runtime共享同一`ProcessRegistry`。factory在OS spawn前先reserve；policy看到的`committedProcessCount`因此同时包含attached、并发reservation和未完成tracked teardown的terminating child，避免两个cold start同时判断自己拥有最后一个名额。workspace注册和已有channel复用不新增名额。

超过`maxConcurrentChildren`时，factory取消本次reservation并抛`AcpChildCapacityExceededError`。REST返回503与`acp_child_capacity_exhausted`，ACP JSON-RPC把同一事实放在error data，standalone create先完成verified rollback再携带nested capacity；容量响应不带`Retry-After`。WebShell识别顶层/RPC/standalone三种shape，显示本地化提示、停止自动create/load重试，并保留普通prompt、shell和首次`/goal`草稿。零名额budget、`admit`配injected bridge、缺失共享registry/policy等假接线在启动时fail loud。

status新增`childHeap.admissionEnforced`与`runtime.memory.committedAcpChildren`。前者区分真实count gate和仅有mode字段的低级embed，后者包含reservation/terminating，不能与只计live channel的`activeAcpChildren`混用。`limits.memory.enforced`仍固定`false`，因为per-child heap ceiling和child argv未改变；`admit`不是实时内存压力保护，也不会自动回收idle child。

## Idle ACP Child Reclamation（#11940 已合入）

#11940在第一次count admission拒绝后只回收一个安全候选。请求先取消自己的reservation，再从同一registry管理的active/trusted/registered runtime中排除requester和special provenance；session、prompt、pending start、ACP connection、memory task、Channel worker、Voice及coordinator work全部为零，并且bridge仍持有匹配channel/epoch/`lastUsedAt`时，才按最久未使用顺序终止exact child。workspace runtime、注册、文件和持久化历史保留，loaded session即使空闲也不会成为候选。

回收后仍以process registry为权威，只做一次fresh reserve/decide；竞争请求抢走名额、取消、teardown失败或候选状态变化都会返回#11911既有容量错误，不尝试第二个victim，也不重放外层create/load/prompt。最终head同步了factory fixture与运维文档并已进入`main`。

## User-directed Runtime Stop（#12008 当前 open）

#12008处理自动回收刻意排除的loaded session。daemon公开只读stop options和exact-identity stop操作，候选携带workspace/runtime identity、受影响session和阻塞原因；执行前重读session/activity并拒绝stale confirmation、独立ACP连接、scheduled work或其它不安全状态。关闭、持久化或process release不确定时返回partial/unknown结果，不自动重试。

WebShell在容量仍满时要求用户显式选择并确认，取消保留草稿；成功停止后等待registry释放，只允许原操作一次guarded continuation。被停止页面保留历史并显示stopped状态，需要显式Resume。该方案保持workspace注册/文件/保存会话，但会中断所选runtime内全部确认session，且当前仍是open diff。

## 当前未接入项

#8093 明确不做以下事情：

- 不改变 `qwen serve` 生产 route 行为。
- 不新增 `/capabilities` feature tag。
- 不把 resource snapshot 暴露到 status route。
- 不接 EventBus replay、workspace transcript、session archive/export、Voice、process shell、MCP 或 route body admission。
- #8245 只报告 configured/effective/modeled budget 与 status denominator，不做 admission、enforcement、ACP child argv 调整、process-tree shutdown 或 workspace lifecycle cleanup。
- #8423 只观察 daemon root RSS/heap pressure，不做 admission、throttle、kill 或 child aggregate pressure。
- #8462 已合入的 active child RSS aggregate，但该 aggregate 仍是 status 观测字段，不代表完整进程树，也不参与 enforcement。
- #8508 的 child heap partition 仍不应用 per-child ceiling；#11911 只在显式 `admit` 下按 modeled count 拒绝 spawn，默认 `observe` 仍不拒绝，`refusals:0` 也不证明 heap ceiling 安全。
- #9380 已合入，只观测 daemon-owned ACP child 的 old-generation peak，不观测 channel worker、MCP descendant 或完整 process tree；`peakLiveSetBytes` 是上界，不是 exact live set。
- #8911 已对 daemon-owned ACP child 的 raw NDJSON 与 decoded inbound queue 接入固定 bounds，但不覆盖 ACP SDK handler/outbound/pending-response/outstanding request 队列。
- #8947 已补 handler/outbound/request 队列 guard；#9007 已补 ACP HTTP pre-attach buffered reply byte budget 和 delivery-owned lease，但普通 live SSE/WS 新帧队列、单帧 stringify 瞬时放大、远端 exactly-once receipt 和完整 frame/session backpressure 不在本 PR 内。
- #11428 只解耦三个容量owner；#11515已把注册默认/上限提升到256，#11911只增加opt-in child数量准入。800 total-session、25 Channel owner和modeled child count是独立策略，不是实时内存安全证明。
- #11653只拒绝无限/超宿主cgroup值并复用状态模型的可用内存探测；raise-only guard仍可能让child继承高于模型ceiling的V8默认值，`admit`也不修正argv。
- #11940已提供零session warm child单候选回收，但不会关闭loaded session；#12008的用户确认stop仍是open diff。

这些内容应在后续 PR 按 route ownership、error taxonomy 与 client compatibility 分批接入。

## 验证

当前 draft 的测试集中在 primitive 层：

- `resource-budget.test.ts`: atomic composite reservation、normal/completion reserve、emergency pool、lease split/grow/shrink/transfer/release、invalid config 和 overflow。
- `fair-daemon-bulk-scheduler.test.ts`: global/per-workspace limit、公平轮转、queue overflow、abort、timeout、seal、nested same-lane/cross-lane rejection。
- `buffered-process-budget.test.ts`: 先预留 process bytes、完成路径释放、admission failure 不进入 lane。
- #8245 merged diff 另覆盖 daemon memory budget unit tests、serve status wiring tests、protocol/SDK type tests 和 docs 更新；重点确认 configured/effective budget 分离、cgroup/host cap 截断、低于 minimum 时报告 `insufficientMemory`、wire 上 `enforced:false`，以及 ACP child argv/spawn 行为不变。
- #8423 当前 diff 覆盖 memory pressure unit/status/SDK tests，验证 rss/heap winner、unknown denominator、off/observe issue behavior 与 status shape。
- #8462 已合入的 focused status tests，覆盖 sampled gaps、pre-age bridge、dormant exclusion 与 active child aggregate response。
- #8508 已合入的 child heap policy / daemon status / serve flag tests，覆盖 2/8/32/256GB host 下的 partition invariant、零池 `null` ceiling、observe/off child argv 不变、`enforce` 被 yargs 与 fast path 拒绝，以及 `limits.memory.enforced:false` 的协议兼容。
- #9380 覆盖 child-heap-probe 11 条、daemon-status 54 条、ACP bridge/spawn/child-heap-policy 771 条和 SDK public surface 15 条，并在 Node 22.19.0、22.22.3、24.12.0 上检查 V8 heap space classifier。
- #8911 已合入的 ACP bridge / daemon runtime focused tests，覆盖 frame limit、decoded queue count/bytes、unterminated EOF、metadata-only parse failure 和 exact child termination。
- #8947 已合入并声明覆盖 ACP bridge guard、daemon runtime、build/typecheck/lint、Prettier 与 SDK backpressure probes；#9007 已合入并声明覆盖 ACP bridge/CLI/SDK focused tests、build/typecheck/lint 与 diff check。
- #11428 声明613项定向测试、build/typecheck/bundle、targeted lint/format/diff check与隔离daemon的25/26注册边界E2E通过；另有1项Windows-only测试在macOS跳过，本次文档复核未复跑source仓测试。
- #11515 声明12个文件共2,082项定向测试、root build/typecheck/bundle、changed-file lint/format/diff check及4组重建产物E2E通过；另有1项既有平台skip。本次只核对merged head、33个changed files和最新`main`，未复跑256个活跃runtime或真实Channel负载。
- #11653 声明ACP bridge聚焦测试、真实Node argv探针及build/typecheck/lint/format/bundle检查通过；本文核对merged head、4个changed files和最新`main`落点，未在真实cgroup v1/v2 Linux主机复跑。
- #11911 声明33项admission检查、完整build/typecheck/bundle、真实daemon create/ensure/load/ACP SSE及真实Chromium 10项验证通过；GitHub Linux lint/static、Ubuntu tests、Serve A/B、WebShell E2E与real-daemon/Java等主要lane通过。本文核对merged head、43个changed files及最新`main`的shared registry/policy、503/status/WebShell落点，未复跑低内存E2E。
- #11940 声明780项定向单测和5组真实daemon的52项断言通过；本文核对merged head、22个changed files及最新`main`接线，未复跑真实daemon。
- #12008 PR body记录2,863项定向单测和176项HTTP/ACP/browser断言通过；本文核对open head、59个changed files和#11911/#11940 baseline，后续review commits补submit/queue/plan fences、timeout taxonomy与process-release平台边界，GitHub当前classify、lint/static、Ubuntu tests、Serve A/B、WebShell E2E与real-daemon/Java等产品lane通过，未复跑浏览器E2E。

## PR 归因

| PR | 状态 | 贡献 |
|---|---|---|
| [#8093](https://github.com/QwenLM/qwen-code/pull/8093) | closed draft | 关闭前新增 daemon resource budget foundation、fair schedulers、buffered process runner 和 Phase 1 设计文档；未接生产 route。 |
| [#8245](https://github.com/QwenLM/qwen-code/pull/8245) | merged | 解析并报告 daemon memory budget figures，给 `/daemon/status`、协议与 SDK 增加 configured/effective/modeled budget 和 non-enforcement 口径。 |
| [#8423](https://github.com/QwenLM/qwen-code/pull/8423) | merged | 在真实 cgroup/host/heap denominator 上观察 daemon root memory pressure，默认 observe-only 并通过 status issue 报告 warning。 |
| [#8462](https://github.com/QwenLM/qwen-code/pull/8462) | merged | 汇总所有 live managed ACP child 的 cached RSS，报告 aggregate bytes、sampled count 和 oldest reading age。 |
| [#8508](https://github.com/QwenLM/qwen-code/pull/8508) | merged | 发布 observe-only child heap partition model，报告 `limits.memory.childHeap`，保持 child argv 与 `limits.memory.enforced:false` 不变，并移除不安全的 enforce 路径。 |
| [#9380](https://github.com/QwenLM/qwen-code/pull/9380) | merged | 在 daemon-spawned ACP child 内测量 V8 old-generation lifetime high-water，通过 daemon status 暴露 per-child heap peak/max aggregation；observe-only，不改 spawn/enforcement。 |
| [#8911](https://github.com/QwenLM/qwen-code/pull/8911) | merged | 为 daemon-owned ACP child 启用 bounded NDJSON frame 与 decoded queue，超限时低敏记录并终止精确 child。 |
| [#8947](https://github.com/QwenLM/qwen-code/pull/8947) | merged | 补 ACP SDK handler/outbound/prepared response/outstanding request guard 与 fatal channel generation isolation。 |
| [#9007](https://github.com/QwenLM/qwen-code/pull/9007) | merged | 为 ACP HTTP pre-attach buffered replies 增加 stream/connection/global frame 与 byte budget、delivery lease、transactional ownership receipt 和 status/SDK counters。 |
| [#11428](https://github.com/QwenLM/qwen-code/pull/11428) | merged | 将workspace注册、ACP child建模和Channel控制预算拆成独立owner，保留25/25/2,130,000ms既有行为与deprecated公开常量兼容。 |
| [#11515](https://github.com/QwenLM/qwen-code/pull/11515) | merged | 默认注册容量提升到256，增加1–256 operator配置、800 total-session默认、255条secondary/8 MiB store及独立25 Channel owner准入。 |
| [#11653](https://github.com/QwenLM/qwen-code/pull/11653) | merged | 让ACP child spawn复用可用内存探测，拒绝v1/v2无限哨兵和超宿主constraint；50%、16 GiB、raise-only与cache策略不变。 |
| [#11911](https://github.com/QwenLM/qwen-code/pull/11911) | merged | 新增opt-in `admit`，用共享registry的committed child count在spawn前拒绝超额，并贯通REST/ACP/WebShell/status；不应用heap ceiling。 |
| [#11940](https://github.com/QwenLM/qwen-code/pull/11940) | merged | 首次拒绝后回收一个零session、零activity的LRU warm child，再做一次fresh admission；保留workspace与历史。 |
| [#12008](https://github.com/QwenLM/qwen-code/pull/12008) | open | 当前diff让用户查看并确认停止loaded workspace runtime，区分in-flight失败与close间预算耗尽，并在名额释放后只继续原操作一次；尚未进入`main`。 |

_按个人 PR 口径更新于 2026-09-19_
