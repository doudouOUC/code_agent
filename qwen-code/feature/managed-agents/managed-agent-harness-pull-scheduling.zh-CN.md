# Managed Agent Harness 调度：从 Java 路由的推模型到拉模型

[English](managed-agent-harness-pull-scheduling.md) | [简体中文](managed-agent-harness-pull-scheduling.zh-CN.md)

状态：提案，2026-11-25，2026-11-26 修订。个人设计草稿，未提交上游。现状结论对照 QwenLM/qwen-code `main` 的 [`afcc98595a`](https://github.com/QwenLM/qwen-code/commit/afcc98595ac61e330021ad325d0ef914eb46ce80) 核实；初稿对照的是 `67f85d324e`，改动列在 §13。Claude Managed Agents 的内容来自 §14 列出的公开页面，阅读日期 2026-11-25。本文建立在 stateless Hosted Harness 设计（[#17527](https://github.com/QwenLM/qwen-code/pull/17527)）和 [#18149 上的差距分析](https://github.com/QwenLM/qwen-code/issues/18149#issuecomment-7156978186)之上，并与 [Java 控制面多实例部署](managed-agent-java-multi-instance.zh-CN.md)互为补充。

## 1. 问题与结论

目标是一个同时能弹性扩缩的无状态 Hosted Harness：实例只在 Session 有工作时持有它，任意实例都能打开任意 Session，崩溃不会丢失 journal 之外的任何东西，并且由自动扩缩器以独立调度的 Pod 增减实例。问题是：哪种调用方向能做到这一点。

考虑过三个方案：

- **方案 A：负载均衡后面的推模型。** 在 Harness 前面放负载均衡，由它挑实例。放弃（§4）：它要补的每个缺口，都只是因为挑实例的是负载均衡而不是 Java。
- **方案 A0：Java 路由的推模型。** 即 `main` 现在的做法。Java 挑选池成员，在 MySQL 记录 placement，之后的调用发给记录的 owner；自 [#18404](https://github.com/QwenLM/qwen-code/pull/18404) 起，已释放或 owner 已离开的 Session 会迁到其他成员（§5）。
- **方案 B：拉模型调度。** Harness 实例主动向 Java 建立出站连接，在有空余容量时认领 Session 工作，Java 永远不调用 Harness（§6）。

**结论（提议）：**

1. **B 是终态。** 无状态本身不依赖调用方向，它来自 journal、`wake` 和 placement 释放，这些 A0 已经具备。弹性扩缩则依赖调用方向。成员变成动态之后，A0 也能增减实例，但它在不知道容量的情况下分配 Session，要求每个 Java 实例都能访问每个 Harness，也没有可以用来扩缩的队列（§9）。
2. **A0 + P4 是中间形态，也是回退形态。** P4（由 Harness 上报事件）是 B 的一部分；在两个方案下，它都能去掉运行中 Turn 必须挂着的那个 Java 实例（§2.4、§7）。
3. **不做只服务于 A0 的投入。** 不做按负载选成员，也不做收到 `hosted_session_open_busy` 后改投其他成员。SQL 实例注册表和可网络访问的 Harness 监听只作为可选过渡，在 P5 之前就需要独立的 Harness Pod 时才做（§5.2）。B 两者都不需要（§6.8）。
4. **顺序：** 按 P4、P1、P3、P5、P6 迁移，每一步都用能力位控制（§10）。P5 去掉最后一个 Java 到 Harness 的调用之后，Harness 才能作为独立的 Pod 自动扩缩。
5. **不依赖消息队列。** B 只用 SQL 和 HTTP。已经部署了 broker 的环境可以用它传递唤醒提示，但不能用它传请求或结果（§6.9）。

## 2. 现状

### 2.1 Java 如何访问 Harness

| 事实 | 出处 |
| --- | --- |
| 池是 `instance-id` 和 `base-url` 组成的静态列表。发现机制已经是一个接口，返回端点快照以及该快照是否为最新；配置层只接受 `static` | [`HarnessConfiguration.java:52-69`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/server/src/main/java/com/alibaba/qwen/code/managedagent/config/HarnessConfiguration.java#L52-L69)、[`HarnessDiscovery.java`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/adapters/src/main/java/com/alibaba/qwen/code/managedagent/harness/HarnessDiscovery.java) |
| 每次调用，Java 先读该 Session 的 placement，发给记录的 owner。没有 placement，或 owner 已释放、正在 quiesce 或不可达时，按轮询挑一个接受新工作的成员，执行 assign 或 takeover CAS | [`HarnessPoolConnector.java:286-337`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/adapters/src/main/java/com/alibaba/qwen/code/managedagent/harness/HarnessPoolConnector.java#L286-L337) |
| 每次调用都带 placement 描述和写权限凭证，凭证绑定 tenant、Workspace、Session、实例、boot ID 和 placement epoch | [`HarnessPoolConnector.java:333-336`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/adapters/src/main/java/com/alibaba/qwen/code/managedagent/harness/HarnessPoolConnector.java#L333-L336)、[`WriterCredentialPolicy.java:65`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/contracts/src/main/java/com/alibaba/qwen/code/managedagent/contracts/security/WriterCredentialPolicy.java#L65) |
| Store 在每个 writer 操作上都校验该凭证和当前 placement | [`JdbcHarnessPlacementStore.java:225-248`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/persistence/src/main/java/com/alibaba/qwen/code/managedagent/persistence/JdbcHarnessPlacementStore.java#L225-L248) |
| 每个池成员有自己的客户端，每个客户端固定一个 boot ID；另一个进程会返回 409 `hosted_harness_generation_mismatch`。只有单地址 connector 把新 boot ID 当作自己的进程被替换；池模式下新 boot 就是另一个 owner | [`hosted-harness-contract.ts:156-159`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/cli/src/serve/hosted-harness-contract.ts#L156-L159)、[`QwenHostedHarnessConnector.java:2808-2811`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/adapters/src/main/java/com/alibaba/qwen/code/managedagent/harness/QwenHostedHarnessConnector.java#L2808-L2811) |
| load 或 create 必须把接收进程写成 writer 和 placement owner，否则被拒绝 | [`session-open.ts:709-729`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/cli/src/serve/hosted-harness-session/session-open.ts#L709-L729) |
| 池拒绝协商能力不一致的成员，所以所有成员运行同一份契约 | [`HarnessPoolConnector.java:192-195`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/adapters/src/main/java/com/alibaba/qwen/code/managedagent/harness/HarnessPoolConnector.java#L192-L195) |
| Harness 只能监听 loopback；Java 只有配置了 mTLS 才接受远端池地址 | [`hosted-harness-profile.ts:36-38`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/cli/src/serve/hosted-harness-profile.ts#L36-L38)、[`HarnessPoolConnector.java:155`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/adapters/src/main/java/com/alibaba/qwen/code/managedagent/harness/HarnessPoolConnector.java#L155) |
| Helm chart 在同一个应用 Pod 里、Java 旁边跑两个池成员，走 loopback，单副本，Recreate 策略（[#18444](https://github.com/QwenLM/qwen-code/pull/18444)） | [`deployment.yaml:6-16`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/deploy/kubernetes/chart/templates/deployment.yaml#L6-L16)、[`README.md:289-291`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/deploy/kubernetes/README.md?plain=1#L289-L291) |

### 2.2 已经持久化的部分

Java 发给 Harness 的大部分内容，在发送之前就已经是持久记录：

- **Turn** 是 `ma_turn` 行。每秒一次的扫描找出可派发的行，然后推给 Harness（[`HarnessCoordinator.java:249-261`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/control-plane/src/main/java/com/alibaba/qwen/code/managedagent/session/HarnessCoordinator.java#L249-L261)）。
- **审批决定**是 outbox 操作，每秒投递和重试（[`ActionResponseCoordinator.java:63-73`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/control-plane/src/main/java/com/alibaba/qwen/code/managedagent/session/ActionResponseCoordinator.java#L63-L73)）。session message、child result、automation 触发和 channel 操作通过各自的 relay 走同样的模式。
- **wake 输入**是带 seal 时 wake stamp 的 journal 输入，由 `WakeRecovery` 和 transport wake activator 发现。
- **事件：** Harness 把每个事件（包括文本增量）都提交到 Java 托管的 Session Store 的 journal 里。Harness 的事件流就是这份 journal 的投影（[`observation-routes.ts:273`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/cli/src/serve/hosted-harness-session/observation-routes.ts#L273)）。公开客户端从 Java 存储读事件，从不直接读 Harness。

### 2.3 仍然依赖 owner 进程的部分

- 43 个私有 `/session/:id/*` 路由假设 Session 常驻在被调用的进程里。
- 运行中 Turn 的事件流由 owner 内存里的 journal 副本提供，event epoch 就是 owner 的 boot ID（[`hosted-harness-session.ts:113`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/cli/src/serve/hosted-harness-session.ts#L113)）。
- cancel 中止的是 owner 内存里的 Turn。常驻的审批等待也由 owner 内存应答。
- side query 的执行状态保存在进程内的 Map 里，所以它的 read 和 cancel 必须回到同一个进程（[`hosted-side-query.ts:387`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/cli/src/serve/hosted-side-query.ts#L387)）。

### 2.4 运行中的 Turn 有两个 owner

一个运行中的 Turn，状态由两个进程持有：

- **Harness owner** 持有 Session 的 writer lease 并运行循环（§2.3）。
- 认领该 Turn 的 **Java 派发者**持有它的 `dispatch_owner` 租约（[`AgentTurnExecution.java:81-86`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/persistence/src/main/java/com/alibaba/qwen/code/managedagent/persistence/AgentTurnExecution.java#L81-L86)）并持续续租（[`HarnessCoordinator.java:121-122`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/control-plane/src/main/java/com/alibaba/qwen/code/managedagent/session/HarnessCoordinator.java#L121-L122)）。它在整个 Turn 期间保持 Harness 事件流打开，把它转成公开事件（[`HarnessCoordinator.java:934-968`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/control-plane/src/main/java/com/alibaba/qwen/code/managedagent/session/HarnessCoordinator.java#L934-L968)）。这个 Java 实例死掉后，要等派发租约过期，另一个实例的扫描才会接手该 Turn，并重新接上事件流。

最近的多实例工作有很大一部分在处理这第二个 owner：从另一个控制面重新 attach Harness Session（[#18433](https://github.com/QwenLM/qwen-code/pull/18433)）、不带 attachment 读取恢复状态（[#18440](https://github.com/QwenLM/qwen-code/pull/18440)）、Broker 故障转移后恢复 Turn（[#18455](https://github.com/QwenLM/qwen-code/pull/18455)）。事件上报（P4）在两个方案下都能去掉它，单靠 A0 去不掉。

### 2.5 stateless 路线与池的进度

- stateless 设计的 Phase 1 到 4 已合并，Action parking（Phase 4）的 Stage 0 到 5 已实现，放量所需的测量还没做。服务端默认关闭 SQL wake dispatch（[`application.yml:47-48`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/server/src/main/resources/application.yml#L47-L48)），Helm chart 把它打开。
- **初稿的 P2 已完成。** [#18404](https://github.com/QwenLM/qwen-code/pull/18404) 在干净挂起或 Action 停靠后释放 placement，由写权限凭证里的 `suspensionPlacementRelease` 能力位控制，该能力只随 wake dispatch 一起下发。这样旧 owner 仍然健康时，健康的其他成员也能接手。[#18443](https://github.com/QwenLM/qwen-code/pull/18443) 让 takeover 消费释放收据时结束已 seal 的 writer 的租约。#18404 还在每次池刷新的末尾加了已离开 placement 的回收器（[`HarnessPoolConnector.java:245-275`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/adapters/src/main/java/com/alibaba/qwen/code/managedagent/harness/HarnessPoolConnector.java#L245-L275)）：租约已过期、带 wake stamp 的挂起 placement，如果 owner 不在快照里或已知不可达，就通过现有的 takeover CAS 迁到健康成员，不打开 attachment。
- 多 Java 实例正在逐块落地：跨实例的事件流唤醒，每 200 毫秒查一次 SQL 事件尾（[#18431](https://github.com/QwenLM/qwen-code/pull/18431)，[`EventTailPoller.java`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/control-plane/src/main/java/com/alibaba/qwen/code/managedagent/session/EventTailPoller.java)）；terminal ticket 存进 SQL（[#18426](https://github.com/QwenLM/qwen-code/pull/18426)）；以及 §2.4 里的三块。

### 2.6 剩余缺口

1. **成员是静态的。** 每个 Java 实例必须持有同一份成员列表，而静态配置只能靠约定保证这一点。
2. **按 boot 回收。** 回收器会排除仍有可达实例的已配置成员。仍在配置里的实例重启后，它上一个 boot 留下的 placement 只能等租约过期后由请求触发 takeover（[已离开 placement 回收器 §9](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/docs/design/2026-11-26-managed-departed-placement-reaper.md#9-cost-and-follow-up)）。
3. **只能 loopback。** Harness 必须和每个调用它的 Java 实例共享网络命名空间，所以 Harness 成员只能放在 Java 所在的 Pod 里，而 chart 只跑一个副本。
4. **运行中 Turn 在 Java 侧的 owner**（§2.4）。
5. **分配 placement 时不看容量。** Java 在接受新工作的成员之间按轮询挑选（[`HarnessPoolConnector.java:296-307`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/adapters/src/main/java/com/alibaba/qwen/code/managedagent/harness/HarnessPoolConnector.java#L296-L307)），并在调用之前就记录 placement。Java 每 5 秒刷新时读回的实例计数器（[`HarnessPoolConnector.java:125-131`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/adapters/src/main/java/com/alibaba/qwen/code/managedagent/harness/HarnessPoolConnector.java#L125-L131)、[`hosted-harness-instance.ts:96`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/cli/src/serve/hosted-harness-instance.ts#L96)）没有用于选择。达到冷启动上限的成员返回 409 `hosted_session_open_busy`（[`session-open.ts:1723-1726`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/cli/src/serve/hosted-harness-session/session-open.ts#L1723-L1726)）。Java 把它当作暂时错误并重试（[`HarnessConflictCodes.java:23-26`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/contracts/src/main/java/com/alibaba/qwen/code/managedagent/contracts/session/HarnessConflictCodes.java#L23-L26)），只有 attachment 丢失或传输失败才会重新选择（[`HarnessPoolConnector.java:348-370`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/adapters/src/main/java/com/alibaba/qwen/code/managedagent/harness/HarnessPoolConnector.java#L348-L370)）。所以 Session 会一直等这个忙的成员，空闲的新实例接不到这份工作。

## 3. 参考：Claude Managed Agents

### 3.1 已公开的内容

| 主题 | 公开的行为 |
| --- | --- |
| 拆分 | session 是 "the append-only log of everything that happened"，harness 是调用 Claude 并转发工具调用的循环，sandbox 负责执行代码 |
| 无状态 harness | "nothing in the harness needs to survive a crash"；新 harness 通过 `wake(sessionId)`、`getSession(id)` 恢复，用 `emitEvent(id, event)` 写入，用 `getEvents()` 按位置读取片段 |
| 调度 | "Inference could start as soon as the orchestration layer pulled pending events from the session log"；不再预先准备容器后，p50 TTFT 降低约 60%，p95 降低 90% 以上 |
| 客户端 API | 客户端追加事件（`user.message`、`user.interrupt`、`user.tool_confirmation`、`user.custom_tool_result`），并读取流或列表。运行中发来的事件会排队；重连的做法是先列出历史、再接实时流、按事件 ID 去重 |
| 等待 | 策略为 `always_ask` 时，session 进入 `idle`，`stop_reason` 为 `requires_action` 并附上阻塞的 `event_ids`；"The session waits indefinitely for a response" |
| Session 状态 | `idle`、`running`、`rescheduling`（"Transient error occurred, retrying automatically"）、`terminated` |
| 工具和凭证 | 每个 sandbox 就是一个工具，`execute(name, input) → string`；容器死掉会作为工具错误返回给 Claude。MCP 走代理，由代理从 vault 取凭证；"The harness is never made aware of any credentials" |
| 自托管 worker | 只发出站 HTTPS。worker 长轮询 `GET /v1/environments/{id}/work/poll`，ack 一个工作项把它移出队列，用带 `expected_last_heartbeat` 前置条件的心跳续租（"another worker may hold the lease" 时返回 412），并以事件形式写回结果。默认 5 秒内没有 ack 的工作项会被回收。"Work items are queued when sessions are created or when long-dormant sessions receive new messages" |

### 3.2 没有公开的内容

没有公开的有：harness 层如何保证单写者、谁调用 `wake`、如何选择 harness、请求亲和性、harness 在 Turn 中途死掉时进行中的工具调用如何处理，以及等待中的 session 是否占用计算资源。另外，博客说容器在首次使用时才按需创建，而 sessions 页面说 session 创建时就开始准备 sandbox，两者可能描述的是不同时期的实现。

### 3.3 本设计从中借鉴的内容

1. 客户端和控制面从不按进程寻址 harness。它们写入持久的工作，由持有 session 的 harness 消费。A0 通过 placement 路由做到这一点，B 通过认领做到。
2. 调度单位是 session，在可续租的租约下持有，用完归还。两个方案都用现有的 writer lease 和 placement。
3. 等待是 session 日志里的一个状态，而不是一个常驻进程。这就是 Phase 4 的 Action parking。
4. 公开的拉模型 API 是给自托管 worker 用的，这些 worker 运行在 Anthropic 无法主动连接的地方。内部 harness 层如何调度，除了上表那一句之外没有公开（§3.2）。无状态来自 session 日志和 `wake`，而不是调用方向。本设计选择拉模型是为了弹性扩缩（§9）。

## 4. 方案 A：负载均衡后面的推模型（放弃）

Harness 前面放负载均衡后，任意实例都可能收到任意 Session 的调用。这带来三个缺口：owner 路由（通过转发、重定向或一致性哈希找到活的 writer）、Session 级 fencing（把期望的 boot ID 从客户端挪到 Session 引用上）、不绑定实例的写权限凭证（在 `writers:acquire` 时用认领票据交换）。

A0 没有这些缺口，因为挑实例的是 Java 而不是负载均衡（§5.1）。负载均衡做的事 Java 的选择逻辑本来就在做，反而多出一层转发：它必须不缓冲地转发 SSE，也不能重试变更请求。B 也不需要认领票据，因为认领 CAS 之后轮询响应直接带上凭证。所以初稿 P0 里的认领票据一项删除。

## 5. 方案 A0：Java 路由的推模型（中间形态）

### 5.1 已经具备的能力

- **owner 路由：** Java 在每次调用时读 placement，只把调用发给记录的 owner，不需要转发，也不需要 Session 级 fencing。
- **迁移：** 已释放的 placement 在下一次调用时交给任意接受新工作的成员。已离开 owner 的过期挂起 placement 在下一次刷新时迁走。
- **fencing：** 依靠 Store 里的 placement epoch 和 writer generation，不变。

### 5.2 中间形态还需要的部分

1. **Phase 1–4 放量。** 空闲期能压到多短由测量门槛决定，而空闲期足够短，placement 粘性才会降级为缓存亲和。这和调用方向无关。
2. **P4：事件上报**（§7）。
3. **可选：按 boot 回收。** Java 的成员表按实例加 boot 建立，所以它知道每个可达成员协商时的 boot ID。回收器因此可以只排除已配置实例的当前 boot，而不是整个实例，过期证明不变，也不需要注册表。现在租约过期后由请求触发的 takeover 已经能保证这些 Session 的正确性，所以这个改动只是让清理提前。
4. **可选过渡：Java Pod 之外的动态成员。** 只有在 P5 之前就需要独立的 Harness Pod 时才需要。在 Java 的 Pod 内部，成员由 Pod 定义固定，所以下面两部分只有一起做才有意义：
   - **以 SQL 实例注册表实现 `HarnessDiscovery`。** 每个 Harness 通过 Java 的一个私有路由注册自己的实例 ID、base URL、boot ID 和是否接受新工作，并按数据库时间续心跳。快照列出心跳仍有效的行。查询失败时快照不是最新的；现有逻辑对这种快照的处理是：刷新暂停新的 placement 分配并跳过回收器，发往已有 owner 的调用照常进行。所有 Java 实例读同一张表，因此看到的成员一致；离开的实例从快照里消失，交给现有回收器处理。Java 会把 Session 凭证发往注册的 URL，所以注册必须按实例认证并绑定实例 ID，最好用 mTLS。
   - **可网络访问的 Harness。** 要么允许 Harness 在 mTLS 下监听非 loopback 地址，要么在每个实例前面放一个 TLS 代理。Java 侧已经要求远端地址使用 mTLS。
   - P6 会把两者都移除。B 两者都不需要（§6.8）。
5. **不做的部分：** 按负载选成员、收到 `hosted_session_open_busy` 后改投其他成员，等于在 Java 里重做 B 靠按容量认领就能得到的东西（§9），所以 A0 保持轮询。

### 5.3 局限

- 分配 Session 时不知道成员的容量（§2.6）。
- 不做可选过渡，成员就保持静态。
- 每个 Java 实例都必须能访问每个 Harness 实例。
- Harness 仍然要为 43 个私有路由监听入站请求。
- 在 P4 之前，运行中 Turn 在 Java 侧的 owner 仍然存在。
- 好处是 cancel、决定和读取仍然是一次直接调用。

## 6. 方案 B：拉模型调度（终态）

### 6.1 模型

**Session 工作项**表示"Session S 有工作"。它由 §2.2 中的持久记录推导出来，不是这些记录的新副本。每个 Harness 实例运行一个 worker 循环：

1. **轮询**：带上自己的身份、协议版本、能力摘要和剩余容量，向 Java 发起长轮询。
2. **认领**：对未被认领的 Session，Java 按现有规则为轮询方执行 placement assign 或 takeover CAS，然后返回 Session 描述和现有格式的写权限凭证。
3. **执行**：加载 Session，从 journal 和操作记录里取出待处理工作，然后执行。
4. **回报**：把操作完成结果和事件发给 Java（§7）。
5. **释放**：空闲时挂起，带收据释放 placement（#18404），这样下一次任何实例都能认领。

Session 被持有期间，Java 通过同一个长轮询把新工作交给持有者（§6.4）。被另一个活 writer 持有的 Session，它的工作永远不会交给别的实例。

### 6.2 工作来源

| 工作类型 | 现有的持久来源 | 改动 |
| --- | --- | --- |
| Turn | `ma_turn` 中可派发的行 | 扫描改为标记"该 Session 有工作"，而不是推送 |
| 审批或问题的决定 | Action response 操作 | 持有者读取决定；已停靠的 Turn 和现在一样在认领时恢复 |
| session message、child result、automation 触发、channel 操作 | relay 操作 | 同决定 |
| wake 输入 | journal 输入加 seal 时 wake stamp | wake 扫描改为标记工作，而不是调用 `activateForWake` |
| cancel 和模式切换 | Turn 状态 `CANCELLING`、Session 选择的 revision | 作为信号发给持有者（§6.4） |
| close、delete、archive | 带 claim 的生命周期操作 | 生命周期操作连同它的 claim 作为一个工作项 |
| 同步读取和管理（status、transcript、MCP 或扩展管理、client files、side query） | 现在是请求和响应 | 能由 Java 从 SQL 和 journal 直接提供的就直接提供，恢复视图已经这样做了（#18440）；其余作为带应答位置的请求工作项 |

### 6.3 认领、租约和凭证

- **认领**就是现有的 placement CAS，只是改为在 Harness 轮询时执行，而不是在 Java 挑选成员时执行。takeover 规则不变：要么是带收据的已释放 placement，要么是 activation 已知且 writer lease 已过期。被拒绝说明 Session 仍被持有，工作项留给原持有者。
- **凭证**：轮询响应里带上现有的 placement-bound 写权限 token。Store 继续在每个 writer 操作上校验它，所以 `JournalFencing` 和 `requireCurrent` 都不用改。
- **租约**：writer lease（`writers:renew`，默认 60 秒）就是认领租约，不引入第二种租约。Claude 的 `expected_last_heartbeat` 前置条件，对应的就是我们现有的 writer generation 校验。
- **writer 身份**仍然是 boot ID。Turn 的 `bindHarness(bootId)` 仍然记录由哪个进程运行这个 Turn，进程变化仍然走恢复路径。

### 6.4 发给持有者的信号

- **唤醒**：轮询请求里列出该实例持有的 Session，其中任何一个有新工作时，Java 提前返回。只有一个 Java 实例时，这是进程内唤醒。多个 Java 实例时，持有这次轮询的 Java 实例用 #18431 里事件流得知新事件的同一种办法，得知别的实例写入的工作：每隔几百毫秒用一条批量 SQL 查询它的轮询方所持 Session 的工作水位。不需要消息队列；已部署 broker 的环境里，可以用每个 Session 一个 LiteTopic 承载同样的提示（§6.9）。
- **有上限的兜底**：漏掉的信号由定期重查所持 Session 来补，所以丢信号只增加延迟，不影响正确性。
- **cancel** 是对延迟最敏感的情况：它是一个持久的 `CANCELLING` 状态加一个信号。持有者收到信号就中止，最坏情况由兜底重查保证上限。Claude 的文档也写明了同样的效果：工具运行期间，interrupt 可能要更久才能生效。

### 6.5 完成结果、fencing 和兼容性

- **完成结果**：持有者把现在作为响应返回的内容，发到 `operations/{id}:complete`，由它的写权限 token 做 fencing。现有的 operation ID 保证幂等。
- **fencing**：正确性依靠 writer lease generation 和 placement epoch，两者 Store 都已经在校验。不再有任何请求靠"哪个进程应答了"来做 fencing。
- **兼容性**：Java 在轮询时检查轮询方的协议版本和能力摘要，不兼容的轮询方拿不到工作。和现在要求能力一致的池（§2.1）不同，这允许滚动升级期间混跑多个版本，每种工作只交给能执行它的版本。但跨版本契约本身仍需另行定义。

### 6.6 容量、drain 和安全

- 实例只为自己能接的工作发起轮询，冷启动上限和活跃 Turn 数变成轮询准入条件。Java 按租户轮询分配新 Session，这是共享 Harness 设计的要求。队列深度、最早的待处理工作、正在轮询的实例数作为扩缩容信号，类似 Claude 的 `work/stats`。
- **drain**：停止认领新 Session，继续服务已持有的 Session，每个 Session 空闲后就释放。drain 超时则退回崩溃恢复路径。不再需要入站的 drain 路由。
- **安全**：Harness 不再监听端口，所以不再需要只绑定 loopback，也不再需要每实例一个 TLS 代理。Harness 用实例身份向 Java 认证，最好用证书里写有实例 ID 的 mTLS。凭证按每次认领签发，所以凭证只存在于该实例持有的 Session 上。

### 6.7 故障语义

| 故障 | 行为 |
| --- | --- |
| 持有者死掉 | 它的租约过期，Session 变为可认领，通过现有的 takeover 和 G3 continuation 路径恢复 |
| Java 重启 | 工作是持久的，实例重新轮询并续租；已持有的 Session 在租约过期前保持其 writer |
| 完成结果的应答丢失 | 持有者用同一个 operation ID 重试 |
| 信号丢失 | 定期重查稍后送达工作 |
| 认领竞争 | placement CAS 只让一个认领者成功，其他的拿不到工作项 |

### 6.8 B 不需要的东西

- **不需要实例注册表。** 每次轮询都带上实例身份（通过 mTLS 认证）、协议版本、能力摘要、空余容量和所持的 Session。存活看的是 Store 里本来就有的按 Session 的 writer lease；“被持有的 Session 的工作不交给其他实例”这条规则，检查的也是 lease，而不是实例有没有注册。
- **不需要回收器。** Session 有新工作时，任何轮询方都可以按现有的 takeover 证明认领它。没有工作的 Session，它的 placement 即使已经过时，在工作到来之前也无害。按 boot 回收同样不需要任何额外机制。
- 可以保留一张记录每个实例最近一次轮询时间的表，给监控面板用，但正确性不依赖它。

### 6.9 备选：用消息队列做传输

有一种变体是用消息队列替代长轮询：Java 把请求发到一个队列，Harness 实例消费它，结果再通过第二个队列回来，由 Java 消费。它保留了 B 的好处（Harness 只出站、按容量消费、积压量就是扩缩指标），但不能充当调度器：

1. **必须交给持有者的工作。** 运行中 Turn 的 cancel、决定和消息，以及对常驻状态的读取，都必须交给持有 writer lease 的实例（§2.3）。竞争消费会把它们交给任意实例。按 Session 分区可以让一个 Session 固定在一个消费者上，但消费者重平衡和 writer lease 是两套独立的归属，在扩缩和崩溃时会不一致。顺序消费还会让一个队列串行处理，一个跑几分钟的 Turn 会堵住同一队列上的其他 Session。每个 Session 一个 LiteTopic 能避免堵塞，但认领之后再订阅它，就是 B 的“先认领、再交给持有者”，而认领仍然是 MySQL 里的 CAS。
2. **ack 的时机。** MQ3 实测：消费者崩溃后，它没有 ack 的消息要等 broker 判定这个客户端过期才会交给其他成员，本地测得 121 到 129 秒，同一主题后面的消息排在它后面（[MQ3 finding 1](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/docs/design/2026-10-14-managed-agent-event-transport-mq3.md#findings)）。处理完 Turn 才 ack，崩溃后这个 Session 就要停这么久；收到就 ack，崩溃时消息就丢了，只能从 SQL 恢复。
3. **不管是否顺序，投递都是至少一次。** 崩溃或 ack 超时后的重投、重平衡时队列锁过期、发送超时后生产者重试、broker 主备切换，都会产生重复消息。[EventTransport 设计](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/docs/design/2026-10-04-managed-agent-event-transport.md)已经要求消费者幂等（不变量 5），也不靠有序投递保证正确性。即使投递真能做到只投一次，也覆盖不了 broker 之外的副作用：调模型、执行工具、改文件、写 Store。只执行一次靠的是 Store 和 journal：writer generation 和 placement epoch 挡住过期的处理者，operation ID 让完成结果幂等，工具执行账本保留 execution ID 和 dispatch generation，恢复时只向 Worker 查询而不重新执行；恢复从 journal 继续，而不是从请求重放。
4. **双写。** Turn、决定和操作必须先写进 SQL：公开 API 要读它们，单写者和幂等校验也依赖它们。再发一份到队列就是第二次写入，需要 outbox。MQ3 还发现生产者没有重试缓冲，broker 长时间不可用期间发出的 envelope 会被丢弃（[MQ3 finding 2](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/docs/design/2026-10-14-managed-agent-event-transport-mq3.md#findings)）。发到队列的结果，仍然要由消费它的那个 Java 实例带 fencing 写进 SQL，所以结果队列只是多了一跳。
5. **基础设施。** EventTransport 默认关闭（[`EventTransportConfiguration.java:56-57`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/server/src/main/java/com/alibaba/qwen/code/managedagent/config/EventTransportConfiguration.java#L56-L57)），Helm 部署里没有 broker，broker 不可用时节点无法启动（[MQ3 finding 3](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/docs/design/2026-10-14-managed-agent-event-transport-mq3.md#findings)），TypeScript 侧也没有消费者。

在已经部署了 broker 的环境里，它可以传递提示：一个共享的“Session 有工作”主题，只带 tenant 和 Session；有空余容量的实例消费到提示后经 Java 认领，不管认领成功与否都 ack。每个 Session 一个 LiteTopic，传递给持有者的唤醒。请求、结果和事件仍然走 SQL 和 HTTP，提示丢了或晚了只影响延迟。因此 B 把唤醒定义成一个接口，默认实现是 SQL 水位轮询，LiteTopic 是可选实现。

## 7. 事件上报（P4）

P4 只改变 Java 接收运行中 Turn 事件的方式，和谁发起 Turn 无关，所以对 A0 和 B 同样适用。

- **现在**：Java 派发者在整个 Turn 期间读取 Harness 事件流（§2.4）。
- **改动**：Harness 把现在流式发送的 envelope 按 journal 序号分批，发到任意 Java 实例上的一个摄取路由，由它的写权限 token 做 fencing。coordinator 现有的流消费逻辑变成这个路由的处理函数。按序号丢弃重复；event epoch 与 Turn 绑定的 Harness 不一致的 envelope 被拒绝，和现在流消费者的做法一样（[`HarnessCoordinator.java:948`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/control-plane/src/main/java/com/alibaba/qwen/code/managedagent/session/HarnessCoordinator.java#L948)）。终态事件结算 Turn，和现在流结束时一样。
- **效果**：不再需要某个 Java 实例在整个 Turn 期间挂着。派发租约可以缩小到只覆盖准入。Java 实例在 Turn 中途死掉也不用重新 attach，负载均衡后面的任意实例都能接收事件。Harness 崩溃仍然由 writer lease 和恢复路径处理。
- **后续备选**：由 Java 直接从它在 Store 路由上已经收到的 journal 提交中投影公开事件。这样省掉摄取这一跳，但要在 Java 里重复实现 TypeScript 的投影逻辑（§11）。

## 8. 对比

| 关注点 | A0：Java 路由的推模型 | B：拉模型 |
| --- | --- | --- |
| 能否达到 stateless 终态 | 能，需要 Phase 1–4 放量 | 能，放量之外再加协议迁移 |
| 成员管理 | 静态列表；只有做可选过渡时才有 SQL 注册表 | 不需要：轮询自带身份、版本、容量和所持 Session，存活看 writer lease |
| 按容量分配 | 否：轮询挑选，调用前就记录 placement | 是：实例只在有容量时认领 |
| 新实例何时开始承接工作 | 只承接轮到它的新 Session 或已释放的 Session；已分配到忙成员上的 Session 只能等它 | 立即：认领最早的待处理工作 |
| 扩缩容指标 | 需要从 placement 和实例计数器推导 | 队列深度和最早待处理工作的等待时间 |
| Harness 入站监听 | 需要；离开 Pod 后要走 mTLS | 不需要 |
| Java 到 Harness 的可达性 | 每个 Java 实例都必须能访问每个 Harness | Harness 经负载均衡访问 Java |
| owner 路由 | Java 根据 placement 完成 | 不需要：工作直接交给持有者 |
| fencing 改动 | 无 | 无 |
| 运行中 Turn 在 Java 侧的 owner | 由 P4 去掉 | 由 P4 去掉，B 包含 P4 |
| cancel 和决定的延迟 | 一次直接调用 | 信号加兜底，控制在 P3 的预算内 |
| 同步读取 | 不变 | Java 侧读取或请求工作项 |
| 滚动升级 | 池内能力必须一致 | 按轮询方版本分配工作；契约尚未定义 |
| 基础设施 | MySQL | MySQL；broker 可选，只传提示 |
| 改动规模 | 小：P4；可选过渡另加一张注册表和一个监听 | 大：43 个路由，分布在 P1、P3、P5 和 P6 |

## 9. 为什么拉模型是终态

A0 能扩缩。有了实例注册表（可选过渡，§5.2），新实例不改配置就能加入，一个刷新周期内开始承接新 Session；drain、挂起时释放和回收器负责缩容。但它扩缩得不好，原因有三条，都来自同一件事：Java 在不知道实例能不能接这份工作时就替它选好了实例。

1. **容量。** A0 先记录 placement、再发调用，按轮询挑选（§2.6）。忙的成员返回 `hosted_session_open_busy`，Session 就一直等它；新加入的空闲成员要等轮询轮到它、并且来了新 Session 才有活干。要在 A0 里解决，就得在注册表里上报负载、按负载选成员、被拒后重新分配，相当于在 Java 里再做一个调度器。B 里实例只在有容量时认领，新实例一上线就从最早的待处理工作开始干，满了的实例只是停止认领。
2. **连通性。** A0 要求每个 Java 实例都能通过 mTLS 访问每个 Harness 实例，所以自动扩缩出来的 Harness Pod 需要地址、证书和注册信息，并且被每个 Java 实例信任。B 里每个 Harness 只需经过一个负载均衡向 Java 发起出站连接。客户自托管的 Harness 也需要这一点，Claude 的自托管 worker 面对的就是这个约束，它的答案是只出站的轮询。
3. **扩缩容指标。** B 里待处理工作的队列本身就是自动扩缩的指标：看队列深度和最早一项的等待时间，类似 Claude 的 `work/stats`。A0 里这个指标只能从 placement 和实例计数器推导。

缩容两者差不多：A0 做 drain，B 停止认领，两者都在 Session 空闲时释放 placement。正在运行的 Session 在两者里都留在原持有者上，所以存量负载的重新均衡靠的是 stateless 路线的短空闲释放，而不是调用方向。

P3 对 cancel 和决定的延迟预算是 P3 自己的完成标准，不是选择 B 的前提。

## 10. 迁移计划

每个阶段都用能力位控制，P6 之前推和拉两种模式并存。在此之前，回退某个阶段就是关掉它的能力位，让这类工作回到推模型。从 P1 起，每次认领都受轮询方空余容量的约束。

| 阶段 | 改动 | 在终态中的去留 | 完成标准 | 状态 |
| --- | --- | --- | --- | --- |
| P2 | 干净挂起和停靠时释放 placement；为已离开的实例加回收器 | 释放保留；回收器在 P6 时移除 | 已释放的 Session 不必等租约过期，任意成员都能认领 | 已完成（#18404、#18443） |
| P4 | 由 Harness 上报事件（§7） | 保留 | 同一份 journal 产生的公开事件与现在一致；在 Turn 中途杀掉派发它的 Java 实例，不需要重新接流 | 提议 |
| P1 | 本来就可以交给任意实例的工作改为拉取：wake 输入、已停靠的决定、发给已挂起 Session 的 relay 投递 | 保留 | 这些路径不再调用 Harness；真实进程 MySQL 测试中结果不变 | |
| P3 | 为常驻工作加上信号并改为拉取：Turn、决定、cancel、消息 | 保留 | cancel 和决定的延迟在与现有直接调用对比测出的预算内；某个实例满了时，只要还有别的实例有容量，它就不会再拿到新 Session | |
| P5 | 读取由 Java 从 SQL 和 journal 提供；其余管理路由和 side query 改为请求工作项 | 保留 | 每个 `/session/:id/*` 路由都有拉模型或 Java 侧的等价实现；Harness Pod 可以独立于 Java 调度 | |
| P6 | 移除推模型路由、静态池、回收器和可选过渡 | — | 不监听私有路由的 Harness 通过完整测试；按队列深度扩缩能增减实例 | |
| 过渡 | 可选，仅 A0：以 SQL 实例注册表实现 `HarnessDiscovery`，带认证的自注册，再加可网络访问的 Harness（§5.2） | P6 时移除 | 实例加入和离开不需要改 Java 配置；所有 Java 实例看到同一份成员列表 | 仅当 P5 之前就需要独立的 Harness Pod |
| 按 boot 回收 | 可选，仅 A0：只排除已配置实例的当前 boot，而不是整个实例（§5.2） | P6 时移除 | 上一个 boot 留下的 placement 不必等请求就能被回收 | 可选 |

## 11. 风险与开放问题

1. **上报的顺序和 fencing（P4）**：每个 Session 的顺序、event epoch 校验、应答丢失后的重试、retraction 处理，都必须和现在的流消费者完全一致。
2. **事件投影**：由 Harness 上报可以只保留一份投影实现；在 Java 里投影能省一跳，但会造成跨语言重复。
3. **延迟（P3）**：cancel、决定和首个事件要经过信号，作为 P3 的完成标准，与现在的直接调用对比测量。
4. **多 Java 实例下的信号开销**：SQL 水位轮询每个实例每个周期一条查询。#18431 说明其事件尾查询在生产规模下的索引使用情况尚未测量，这里同样如此。已部署 broker 的环境里，可以用它作为提示来替代轮询（§6.9）。
5. **协议规模**：43 个路由要迁移，每个阶段必须足够小，便于评审。
6. **过渡期的扩缩**：P5 之前，除非做了可选过渡，否则 Harness Pod 无法独立于 Java 调度，而 P6 会丢弃这个过渡。
7. **注册表的可信度（仅可选过渡）**：注册的 base URL 会收到 Session 凭证。注册必须按实例认证，并绑定实例 ID。
8. **容量计算**：轮询方上报的空余容量必须覆盖冷启动、活跃 Turn 和占用的 Runtime，否则认领会像轮询分配一样把实例压垮。
9. **路线门槛**：空闲期能压到多短，仍由 stateless 路线的测量门槛决定。两个方案都不会让冷启动变便宜。
10. **公平**：一个租户大量提交工作时，不能在认领阶段饿死其他租户。

## 12. 验收标准

中间形态（Phase 1–4 放量、P4）：

1. 杀掉一个 Harness 实例，它的 Session 在租约过期后迁到其他成员，且没有重放任何工具调用。空闲释放的 Session 在下一次请求时迁移。
2. 杀掉派发某个运行中 Turn 的 Java 实例，该 Turn 仍然完成，公开事件不变，且不需要重新接流。

可选过渡和回收器改动（如果做）：

3. 增减 Harness 实例不需要修改 Java 配置，且每个 Java 实例看到的成员一致。
4. 重启实例上一个 boot 留下的 placement，在同样的过期证明下由回收器回收。

终态（B）：

5. 不监听私有路由的 Harness 能端到端服务一个 Session：create、Turn、审批、cancel、close。
6. 新启动的实例不需要修改 Java 配置、也不需要注册，就能认领待处理工作；某个实例满了时，只要还有别的实例有容量，它就不会再拿到新 Session。
7. 在负载下按队列深度扩缩，能增减实例，且没有工作丢失或重放。
8. 不兼容的轮询方拿不到工作。
9. cancel 和决定的延迟保持在 P3 设定的预算之内。
10. 不部署 broker 时，上面每一条都成立。

每个阶段都通过真实进程 MySQL 8.4 测试套件，不能只靠单元测试或 H2 测试。

## 13. 相对初稿的改动

- B 仍然是终态，但理由改为弹性扩缩（容量、连通性、扩缩容指标），而不是无状态，因为 A0 同样能做到无状态。
- 放弃方案 A。`main` 上的代码 A0 作为中间形态和回退形态。
- P2 标为已完成。
- 初稿的 P0 不再在主线上。B 不需要实例注册表，也不需要回收器（§6.8）。注册表只作为可选过渡保留，并且要和可网络访问的 Harness 一起做；按 boot 回收降为回收器的一个可选改动。acquire 时的认领票据删除，因为 A0 和 B 都不让第三方挑实例。
- P4 移到最前，§7 解释它为何与调用方向无关。
- P5 优先由 Java 侧读取，而不是请求工作项。
- A0 里不做容量相关的改动。
- 新增 §6.9，说明为什么消息队列可以传唤醒提示，但不能传请求或结果：必须交给持有者的工作、ack 时机、至少一次投递、双写，以及额外的基础设施。
- 重写多 Java 实例的风险：相关工作正在合入，信号默认用 SQL 水位轮询。
- 现状引用改为 `afcc98595a`，路由数更正为 43。

## 14. 参考资料

- [Scaling Managed Agents: Decoupling the brain from the hands](https://www.anthropic.com/engineering/managed-agents)
- [Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview)
- [Session event stream](https://platform.claude.com/docs/en/managed-agents/events-and-streaming)
- [Session operations](https://platform.claude.com/docs/en/managed-agents/session-operations)
- [Permission policies](https://platform.claude.com/docs/en/managed-agents/permission-policies)
- [Sessions](https://platform.claude.com/docs/en/managed-agents/sessions)
- [Self-hosted sandboxes](https://platform.claude.com/docs/en/managed-agents/self-hosted-sandboxes)
- [Self-hosted workers](https://platform.claude.com/docs/en/managed-agents/self-hosted-sandboxes-workers)
- [Environments work API](https://platform.claude.com/docs/en/api/beta/environments/work)
- [Stateless Hosted Harness 设计](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/docs/design/2026-11-16-managed-stateless-harness.md)
- [共享 Harness 设计](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/docs/design/2026-10-21-managed-shared-harness.md)
- [挂起时释放 placement](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/docs/design/2026-11-26-managed-suspension-placement-release.md)
- [已离开 placement 回收器](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/docs/design/2026-11-26-managed-departed-placement-reaper.md)
- [跨实例事件流唤醒](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/docs/design/2026-11-26-managed-cross-instance-sse.md)
- [控制面 attachment 恢复](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/docs/design/2026-11-26-managed-control-plane-attachments.md)
- [Helm Harness 池](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/docs/design/2026-11-26-managed-agent-helm-harness-pool.md)
