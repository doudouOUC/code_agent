# Managed Agent Java 控制面多实例部署

[English](managed-agent-java-multi-instance.md) | [简体中文](managed-agent-java-multi-instance.zh-CN.md)

状态：提案，2026-11-25。个人设计草稿，未提交上游。现状结论对照 QwenLM/qwen-code `main` 的 [`67f85d324e`](https://github.com/QwenLM/qwen-code/commit/67f85d324e5f83cabca9229e1e9fc6161b794947) 核实。本文与 [Harness 拉模型调度](managed-agent-harness-pull-scheduling.zh-CN.md)互补：那份文档处理 Harness 多实例，本文处理 Java 控制面多实例。

## 1. 问题与结论

目标部署：多个 Java 控制面实例（每个都内嵌 Runtime Broker）挂在轮询负载均衡后面，Runtime 使用 external provisioner（`external-scratch` 或 `external-workspace`）。任意请求都可以落到任意实例，不依赖会话粘性。

现状：上游只支持一个 Java 控制面（[README "Hosted recovery scope"](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/README.md?plain=1#L2155-L2175)）。耐久状态已经在 SQL 里，并有 CAS、租约和 generation 隔离，所以多个实例同时运行不会写坏数据。但有六处依赖进程内状态或本机时钟，在轮询负载均衡下会表现为功能失败或延迟（§3.2）。

**结论（提议）：** 不引入 Java 侧的 Session 属主路由，也不依赖会话粘性。原则只有一条：**进程内状态只做缓存，缺失时从 SQL 重建；跨实例的约束一律落到 SQL，并使用数据库时钟。** 共七项改动（§4）和一组部署要求（§5），不需要 MQ。

## 2. 范围

纳入：

- 两个及以上 Java 实例，前面是轮询负载均衡；
- external runner；
- Hosted Harness 为单地址（所有 Java 实例指向同一个 Harness）或静态 Harness 池。

不纳入：

- `local-process` 和 `ssh-process` runner：worker 端点固定为 `127.0.0.1`，本身就是单机方案；
- 会话粘性等过渡做法；
- Harness 多实例：见拉模型调度文档；
- MQ EventTransport 的已知问题（[MQ3](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/docs/design/2026-10-14-managed-agent-event-transport-mq3.md) 发现 1–3）：本方案不依赖 MQ；
- 新旧版本混跑的跨版本契约。

## 3. 现状

### 3.1 已经可以多实例运行的部分

- Turn、生命周期操作、审批响应、任务取消、改名和上下文压缩都是 SQL 行，靠 dispatch lease 认领。每个实例都在扫描，谁认领到谁执行。
- Session Store 私有路由只读写 JDBC（[`ManagedSessionStoreController.java:49`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/server/src/main/java/com/alibaba/qwen/code/managedagent/api/ManagedSessionStoreController.java#L49)），任意实例都可以提供服务。
- Journal writer lease、writer generation 和 Harness 池 placement 都在 SQL 中，过期持有者的写入会被拒绝。
- client-files relay 走 SQL 队列（100 ms 轮询）；side query 由每秒一次的 reconcile 收敛；Action 停靠状态在 SQL 中；终端 hold 是持久记录。
- Harness 为每个常驻 Session 生成一个 `clientId`（[`session-open.ts:2052`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/cli/src/serve/hosted-harness-session/session-open.ts#L2052)）。复用常驻 Session 的 load 返回同一个 `clientId`，因此另一个 Java 实例可以重新 attach，后续请求能通过 [`session-http.ts:203-216`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/cli/src/serve/hosted-harness-session/session-http.ts#L203-L216) 的身份检查。

### 3.2 阻碍多实例运行的部分

| # | 问题 | 轮询负载均衡下的后果 | 出处 |
| --- | --- | --- | --- |
| 1 | 终端 WebSocket 的 ticket 存在进程内 Map | 在 A 签发的 ticket，upgrade 落到 B 时失败。sessionId 在请求体里，按路径哈希也无法路由 | [`TerminalTicketStore.java:41`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/server/src/main/java/com/alibaba/qwen/code/managedagent/api/TerminalTicketStore.java#L41)、[`TerminalRelayHandshakeInterceptor.java:69`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/server/src/main/java/com/alibaba/qwen/code/managedagent/api/TerminalRelayHandshakeInterceptor.java#L69)、[`TerminalTicketController.java:36`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/server/src/main/java/com/alibaba/qwen/code/managedagent/api/TerminalTicketController.java#L36) |
| 2 | SSE 推送只经过本进程的 hub。Turn 在接收请求的实例上立即执行；其他实例上的流只能等 `events.poll-interval`（默认 5 s）后重读 SQL。MQ 公共通道只触发物化，不推送 SSE | 在非执行实例上，流式输出每 5 秒才到一批 | [`SessionEventHub.java:20`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/control-plane/src/main/java/com/alibaba/qwen/code/managedagent/session/SessionEventHub.java#L20)、[`CompositeCommittedEventPublisher.java:67`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/control-plane/src/main/java/com/alibaba/qwen/code/managedagent/event/CompositeCommittedEventPublisher.java#L67)、[`ManagedEventStreamService.java:128`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/control-plane/src/main/java/com/alibaba/qwen/code/managedagent/session/ManagedEventStreamService.java#L128)、[`ManagedAgentService.java:1830`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/control-plane/src/main/java/com/alibaba/qwen/code/managedagent/session/ManagedAgentService.java#L1830)、[`EventTransportConsumer.java:150`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/control-plane/src/main/java/com/alibaba/qwen/code/managedagent/event/EventTransportConsumer.java#L150) |
| 3 | 派发租约用 JVM 时钟写入和比较 | 时钟快出超过租约时长（默认 60 s）的实例，会接管仍在运行的 Turn，最终把它判为失败。MQ3 发现 6 已实测 | [`AgentTurnExecution.java:80-104`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/persistence/src/main/java/com/alibaba/qwen/code/managedagent/persistence/AgentTurnExecution.java#L80-L104) |
| 4 | 回调地址按实例推导：`session-store.base-url` 和 `client-files.relay-url` 默认取本实例的 loopback 地址。Harness 对常驻 Session 会比较 `storeBaseUrl`，lifecycle 路径还会深比较整个 Store 描述符 | 不同实例给同一个 Session 发出不同地址时，返回 409 `hosted_session_store_mismatch` | [`ManagedAgentProperties.java:311,351`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/server/src/main/java/com/alibaba/qwen/code/managedagent/config/ManagedAgentProperties.java#L311)、[`QwenHostedHarnessConnector.java:2665-2689`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/adapters/src/main/java/com/alibaba/qwen/code/managedagent/harness/QwenHostedHarnessConnector.java#L2665-L2689)、[`session-open.ts:837`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/cli/src/serve/hosted-harness-session/session-open.ts#L837-L838)、[`session-open.ts:1058`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/cli/src/serve/hosted-harness-session/session-open.ts#L1058) |
| 5 | Java 侧的 Harness attachment 和 recovery 证据只存在于加载它的那个实例的内存里 | [#17538](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/docs/design/2026-11-19-managed-recovery-native-terminal.md) 已让终态 Turn 改用持久证据；其余依赖 attachment 的路径，在没有 attachment 的实例上仍然拿不到证据或直接失败 | 同左设计 §1、§3 |
| 6 | Broker 的 Runtime Session 和 live binding 都在进程内。约 28 个调用点要求 Runtime Session 在本进程，否则返回 404；只有 monitor 操作和执行恢复会在缺失时接管。`ma_runtime_session` 没有 Broker 归属列。external placement 也在进程内，上限 1024 且从不淘汰 | Harness 的 Broker 地址经过负载均衡时，大量请求返回 `runtime_session_not_found`；每个实例都会积累几乎全部 Session 的 placement，最终返回 `runtime_external_capacity` | [`RuntimeBindingRegistry.java:147-167`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/runtime-broker/src/main/java/com/alibaba/qwen/code/runtimebroker/service/RuntimeBindingRegistry.java#L147-L167)、[`RuntimeBrokerService.java:797-799`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/runtime-broker/src/main/java/com/alibaba/qwen/code/runtimebroker/service/RuntimeBrokerService.java#L797-L799)、[`V1__managed_schema.sql:1034`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/persistence/src/main/resources/db/managed-schema/V1__managed_schema.sql#L1034)、[`ExternalRuntimeProvisioner.java:53,63,340`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/runtime-external/src/main/java/com/alibaba/qwen/code/runtimebroker/provisioning/external/ExternalRuntimeProvisioner.java#L53-L64) |

## 4. 方案

### 4.1 终端 ticket 存入 SQL

新增表 `ma_terminal_ticket`，字段为 `ticket_hash`（SHA-256，唯一）、`tenant_id`、`actor_id`、`session_id`、`terminal_id`、`binding_id`、`binding_generation`、`expires_at`。按模块规则，直接修改 V1 基线，不加 V2 迁移。

- **签发**：插入一行，`expires_at` 取数据库时间加 30 s。现有的每租户 256、全局 1024 上限改为 SQL 计数，变成集群级上限。
- **消费**：执行 `DELETE ... WHERE ticket_hash = ? AND expires_at > 当前数据库时间`，影响 1 行才算成功，由此保证单次使用。之后按 `binding_id` 和 `binding_generation` 重新读取 binding，发生变化则拒绝。
- **清理**：由现有定时任务删除过期行。
- 不存明文 ticket，也不序列化整个 binding 记录。

### 4.2 跨实例 SSE 通知

每个实例运行一个通知循环，周期默认 200 ms：

1. 收集本实例有订阅者的 Session，即 hub 中仍被引用的 key。
2. 用一条查询读取这些 Session 的 `ma_event_stream.last_sequence`（[`V1__managed_schema.sql:310`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/persistence/src/main/resources/db/managed-schema/V1__managed_schema.sql#L310)，`SESSION` 流，命中唯一键）。订阅很多时分批查询。
3. 对水位超过本地已知序号的 Session，从 SQL 读取一次新事件并发布到本地 hub。同一 Session 的多个本地连接共享这一次读取。

说明：

- 本实例自己写入的事件仍在提交后直接推送，延迟不变。hub 按序号存储，重复发布无害。
- 每个流现有的 5 s SQL 重读保留，作为兜底。
- 代价是每个实例每个周期一条唯一键 IN 查询，与连接数无关；只有出现新事件的 Session 才会多一次读取。
- 这就是[存储与事件架构 §7.1](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/docs/design/2026-09-20-managed-agent-storage-event-architecture.md#71-sse-and-multiple-instances)里"按节点批量检查水位"的做法，只是去掉了它前面的节点间通知，因此不需要服务发现，也不需要 MQ。

### 4.3 所有租约改用数据库时钟

- 所有派发和认领租约的写入与过期比较都改用数据库时间，不再用 `clock.millis()`。涉及 Turn、生命周期操作、Action 停靠与响应、任务取消，以及各 relay 账本。
- 现有的 `ManagedSchemaTime.SQL_NOW` 是秒精度（`UNIX_TIMESTAMP()`），租约需要毫秒精度，可以用 `UNIX_TIMESTAMP(NOW(3)) * 1000`，或者在认领前读一次数据库时间。实现时选定一种，全模块保持一致。
- Journal writer lease 和唤醒判断已经在用数据库时钟，本项只补齐其余租约。
- 候选文件包括 `AgentTurnExecution`、`AgentLifecycleOperations`、`AgentActionParking`、`AgentSessionCommands`、`JdbcChildResultRelayStore` 等。实现前要逐个确认用到的时间戳是租约还是普通时间戳。

### 4.4 回调地址与实例无关

以下回调地址在所有实例上必须相同，都指向内部负载均衡地址，由它转发到任意 Java 实例的内部监听：

- `session-store.base-url`
- `client-files.relay-url`
- `tool-publication.service-base-url`
- Harness 使用的 Broker 地址（见 §4.6）

依据：

- Store 路由只读写 JDBC，任意实例都能服务。
- writer token 是基于 binding key 的确定性 HMAC（[`WriterCredentialPolicy.java:115-116`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/contracts/src/main/java/com/alibaba/qwen/code/managedagent/contracts/security/WriterCredentialPolicy.java#L115-L116)），描述符里的 `writerId` 是 Harness 的 boot ID。
- 因此只要配置一致，任意实例为同一个 Session 构造的 Store 描述符完全相同，Harness 的地址比较和描述符比较都能通过。

本项只是配置要求，不改代码。

### 4.5 Harness attachment 只做缓存

规则：

1. **只读视图只从持久状态推导。** Session 读取、recovery 视图和发送闸门，不能因为本实例没有 attachment 就给出不同的答案。#17538 已对终态 Turn 这样做，本项把同一规则扩展到其余分支：活跃 Turn 显示 SQL 中的状态。持有 attachment 的实例在 Turn 刚结束时可能报告 `cleanup_pending`，这段短暂差异接受下来，由下一个 Turn 的派发前重试吸收。
2. **需要调用 Harness 的写操作，在本实例没有 attachment 时先 attach 再调用。** 涉及提交 Turn、投递审批、取消、MCP 和扩展管理、client-files 注册以及 side query。attach 的方式是复用常驻 Session 的 load；不能因为缺少本地 attachment 就返回失败或空证据。
3. **实现前先列出所有读取 attachment 缓存的调用点**（`QwenHostedHarnessConnector` 中的 `attachments`、`selectedAttachments` 和 recovery 缓存），逐个归入规则 1 或规则 2。

### 4.6 Broker 缺失即接管，placement 改为可淘汰缓存

- Runtime Session 的解析统一为：本进程有就直接用，没有就从 SQL 读取，再经 reconcile 和 attest 接管，也就是现有 `requireOrAdoptReadySession` 的路径。覆盖全部约 28 个调用点后，Harness 的 Broker 地址就可以经过内部负载均衡。
- 执行级隔离保持不变：每次执行都有 SQL dispatch lease 和 generation（`ma_tool_execution`）；后台观察每个 binding 只认领一个 puller；终端 hold 是持久的。
- [`RuntimeExecutionDispatcher.java:188`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/runtime-broker/src/main/java/com/alibaba/qwen/code/runtimebroker/service/RuntimeExecutionDispatcher.java#L188-L192) 现在遇到本进程不认识的 lease，会把 binding 置为 LOST，并把执行记为 UNKNOWN。改为先 reconcile，只有 provider 观察到资源确实不存在时才置为 LOST。
- external placement 改为可淘汰的缓存：没有本地 Runtime Session 的条目可以淘汰，下次使用时由 reconcile 重建。这样做是安全的，因为 provider 按 `provisionRequestId` 持久保存映射，handle 也已经在 SQL 里。每个进程的上限仍是 1024，但只统计活跃条目。
- **开放问题，实现前必须用真实进程验证：**
  - 两个 Broker 同时接管同一个 binding 时，worker 是否接受两次 attest；
  - 接管是否推进 runtime generation。如果推进，前一个 Broker 上正在进行的执行会被隔离成 UNKNOWN，那就要么要求只在原 Runtime Session 空闲时接管，要么为 `ma_runtime_session` 增加 Broker 归属租约。

### 4.7 优雅下线

- 收到 SIGTERM 后，实例把 readiness 置为 false，扫描停止认领新工作。
- 对尚未提交给 Harness 的 Turn，调用现有的 `releaseTurnLease` 立即释放，其他实例在下一次扫描（1 s）就能接手，不必等 60 s 租约过期。
- 已经提交的 Turn 不做迁移：停止续租，等租约过期后，由其他实例走现有的接管与恢复路径。
- SSE 连接直接关闭，客户端带 `Last-Event-ID` 重连到其他实例。

## 5. 部署要求

- **所有实例配置一致**：
  - `auth.signing-key`、`session-store.binding-key`；
  - runtime credential key 及 previous keys；
  - Harness token 和 capability digest，`harness.base-url` 或池成员列表；
  - `external-provider-id`、`external-provider-url`、`workspace-id`；
  - `session-store.writer-lease-duration`；
  - §4.4 中的回调地址。
- **网络**：
  - 公共负载均衡只暴露公共路由。
  - `/internal/**` 放在独立的内部监听上（`internal-server.port`），只对 Harness 和 Runtime 所在网络开放，并配置 binding key。
  - 公共负载均衡要关闭 SSE 缓冲，空闲超时大于 15 s 心跳，并支持 WebSocket upgrade。
- **时钟**：完成 §4.3 后，正确性不再依赖实例时钟；为了日志和指标准确，仍建议开启 NTP。
- **MQ**：保持 `event-transport.enabled=false`，本方案不依赖 MQ。

## 6. 实施阶段

| 阶段 | 内容 | 完成标准 |
| --- | --- | --- |
| M1 | §4.1、§4.3、§4.4 | 3 个实例轮询时，终端从任意实例都能连上；把一个实例的时钟调快 10 分钟，它不会抢走运行中的 Turn |
| M2 | §4.2 | 在非执行实例上，首个文本增量的 p95 延迟不超过通知周期加一次 SQL 读取 |
| M3 | §4.5 | 提交、审批、取消、MCP 管理和 side query 落到任意实例都能成功；同一个 Session 的读取结果在各实例间一致 |
| M4 | §4.6 | Broker 经过内部负载均衡时不再出现 `runtime_session_not_found`；placement 数量有界；§4.6 的开放问题有结论 |
| M5 | §4.7 和多实例门禁 | 杀掉任意一个实例，它名下的 Turn 在租约过期后由其他实例完成，或按现有规则阻塞，且不重放任何工具调用 |

## 7. 验收方式

新增多实例门禁，环境为：3 个 Java 实例、轮询负载均衡、真实 MySQL 8.4、external provider 替身和打包好的 Hosted Harness。按 §6 的完成标准逐项断言，不能用 H2 或单进程测试代替。

## 8. 风险与开放问题

1. **Broker 并发接管**：见 §4.6。
2. **cleanup 窗口**：§4.5 规则 1 留下了属主实例短暂的 cleanup 窗口，需要验证派发重试能否完全吸收。
3. **通知循环的数据库负载**：订阅数很大时，IN 列表的规模和周期需要压测后确定。
4. **与拉模型调度的关系**：拉模型在多个 Java 实例下需要向持有者广播工作信号，可以复用 §4.2 按 Session 水位轮询的做法；§4.3 的数据库时钟也是它的前提。
5. **进程级限额**：终端 ticket 之外，tool publication 并发和 artifact 读并发等进程级限额，在多实例下会变成 N 倍。本方案不改动它们，按单实例容量规划即可。

## 9. 参考资料

- [README：Hosted recovery scope](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/README.md?plain=1#L2155-L2175)
- [存储与事件架构 §7.1](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/docs/design/2026-09-20-managed-agent-storage-event-architecture.md#71-sse-and-multiple-instances)
- [EventTransport MQ3：部署故障矩阵](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/docs/design/2026-10-14-managed-agent-event-transport-mq3.md)
- [基于持久原生终态的 Managed 恢复（#17538）](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/docs/design/2026-11-19-managed-recovery-native-terminal.md)
- [External Runtime provider](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/docs/design/2026-10-23-external-runtime-provider.md)
- [配置参考](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/docs/users/managed-agent-configuration-reference.md)
- [Harness 拉模型调度](managed-agent-harness-pull-scheduling.zh-CN.md)
