# Managed Agent Harness 调度：从推模型到拉模型

[English](managed-agent-harness-pull-scheduling.md) | [简体中文](managed-agent-harness-pull-scheduling.zh-CN.md)

状态：提案，2026-11-25。个人设计草稿，未提交上游。现状结论对照 QwenLM/qwen-code `main` 的 [`67f85d324e`](https://github.com/QwenLM/qwen-code/commit/67f85d324e5f83cabca9229e1e9fc6161b794947) 核实。Claude Managed Agents 的内容来自 §10 列出的公开页面，阅读日期 2026-11-25。本文建立在 stateless Hosted Harness 设计（[#17527](https://github.com/QwenLM/qwen-code/pull/17527)）和 [#18149 上的差距分析](https://github.com/QwenLM/qwen-code/issues/18149#issuecomment-7156978186)之上。

## 1. 问题与结论

问题是：Hosted Harness 能否以多个实例的形式挂在一个负载均衡后面，并且任意实例都能接任意请求。目前不能。Java 对每个 Session 只访问一个特定的 Harness 进程，并且每个客户端只认一个进程 boot ID。负载均衡把请求转到另一个进程时，会被当作 generation 变化而拒绝。

有两条路：

- **方案 A：负载均衡后面的推模型。** Java 继续调用 Harness，在 Harness 前面放负载均衡，并补上三处协议缺口：运行中 Turn 的 owner 路由、Session 级 fencing、不绑定实例的写权限凭证。
- **方案 B：拉模型调度。** 反转方向。Harness 实例主动连接 Java 并认领 Session 工作，Java 永远不调用 Harness，负载均衡放在 Java 前面。

**结论（提议）：** 以方案 B 为目标。保留现在的推协议和静态池，按操作类别逐个迁移到拉模型，每一步都用能力位控制。方案 B 不是解决 owner 路由，而是让它不再存在。它不需要 Harness 实例列表，也不需要 Harness 监听入站请求。它和 stateless 路线的终态一致，也和 Claude Managed Agents 的做法一致（§3）。

有一条捷径不需要改协议：如果 Java 能直连每个实例，目标只是不改配置就能增减实例，那么只做 P0 阶段就够了（§7）。

## 2. 现状

### 2.1 Java 如何访问 Harness

| 事实 | 出处 |
| --- | --- |
| 池是 `instance-id` 和 `base-url` 组成的静态列表；Kubernetes 发现已归档 | [`HarnessConfiguration.java:47-62`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/server/src/main/java/com/alibaba/qwen/code/managedagent/config/HarnessConfiguration.java#L47-L62) |
| Java 轮询挑选成员，在 MySQL 记录 placement，之后该 Session 的所有调用都发给它 | [`HarnessPoolConnector.java:248-299`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/adapters/src/main/java/com/alibaba/qwen/code/managedagent/harness/HarnessPoolConnector.java#L248-L299) |
| 每个 Harness 客户端固定一个 boot ID；另一个进程会返回 409 `hosted_harness_generation_mismatch` | [`hosted-harness-contract.ts:156`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/cli/src/serve/hosted-harness-contract.ts#L156) |
| 单地址模式下，boot ID 变化被当作进程已被替换 | [`QwenHostedHarnessConnector.java:2763`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/adapters/src/main/java/com/alibaba/qwen/code/managedagent/harness/QwenHostedHarnessConnector.java#L2763) |
| load 或 create 必须把接收进程写成 writer 和 placement owner，否则被拒绝 | [`session-open.ts:709-722`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/cli/src/serve/hosted-harness-session/session-open.ts#L709-L722) |
| Java 在派发前签发写权限凭证，绑定 tenant、Workspace、Session、实例、boot ID 和 placement epoch | [`WriterCredentialPolicy.java:65`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/contracts/src/main/java/com/alibaba/qwen/code/managedagent/contracts/security/WriterCredentialPolicy.java#L65) |
| Store 在每个 writer 操作上都校验凭证和当前 placement | [`JdbcHarnessPlacementStore.java:176-199`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/persistence/src/main/java/com/alibaba/qwen/code/managedagent/persistence/JdbcHarnessPlacementStore.java#L176-L199) |
| Harness 只能监听 loopback；远端池地址必须用 TLS | [`hosted-harness-profile.ts:36`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/cli/src/serve/hosted-harness-profile.ts#L36) |

### 2.2 已经持久化的部分

Java 发给 Harness 的大部分内容，在发送之前就已经是持久记录：

- **Turn** 是 `ma_turn` 行。每秒一次的扫描找出可派发的行，然后推给 Harness（[`HarnessCoordinator.java:249-261`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/control-plane/src/main/java/com/alibaba/qwen/code/managedagent/session/HarnessCoordinator.java#L249-L261)）。
- **审批决定**是 outbox 操作，每秒投递和重试（[`ActionResponseCoordinator.java:53-106`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/control-plane/src/main/java/com/alibaba/qwen/code/managedagent/session/ActionResponseCoordinator.java#L53-L106)）。session message、child result、automation 触发和 channel 操作通过各自的 relay 走同样的模式。
- **wake 输入**是带 seal 时 wake stamp 的 journal 输入，由 `WakeRecovery` 和 transport wake activator 发现。
- **事件：** Harness 把每个事件（包括文本增量）都提交到 Java 托管的 Session Store 的 journal 里。Harness 的事件流就是这份 journal 的投影（[`observation-routes.ts:273-340`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/cli/src/serve/hosted-harness-session/observation-routes.ts#L273-L340)）。coordinator 读取这个流并写出公开事件（[`HarnessCoordinator.java:934`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/control-plane/src/main/java/com/alibaba/qwen/code/managedagent/session/HarnessCoordinator.java#L934)）。公开客户端从 Java 存储读这些事件，从不直接读 Harness。

### 2.3 仍然依赖 owner 进程的部分

- 大约 40 个私有 `/session/:id/*` 路由假设 Session 常驻在被调用的进程里。
- 运行中 Turn 的事件流由 owner 内存里的 journal 副本提供，event epoch 就是 owner 的 boot ID（[`hosted-harness-session.ts:113`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/cli/src/serve/hosted-harness-session.ts#L113)）。
- cancel 中止的是 owner 内存里的 Turn。常驻的审批等待也由 owner 内存应答。
- side query 的执行状态保存在进程内的 Map 里，所以它的 read 和 cancel 必须回到同一个进程（[`hosted-side-query.ts:387`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/cli/src/serve/hosted-side-query.ts#L387)）。

### 2.4 stateless 路线进度

Phase 1 到 4 已合并，但都默认关闭，等待各自的测量门槛。挂起的 Session 仍把 placement 留在原实例上，已离开的实例名下的 placement 也不会被回收。[#18149 上的评论](https://github.com/QwenLM/qwen-code/issues/18149#issuecomment-7156978186)列出了这两处差距。拉模型调度依赖先补上它们（§7 的 P2）。

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

### 3.3 本设计借鉴的部分

1. 客户端和控制面从不直接访问 harness，只写入持久的工作，由 harness 消费。
2. 调度单位是 session：worker 认领它，在可续期的租约下持有它，用完再交还。
3. worker 主动出站连接并拉取工作，所以不需要入站地址、服务发现或负载均衡。
4. 等待是 session 日志里的一个状态，而不是一个常驻的进程。

## 4. 方案 A：负载均衡后面的推模型

方案 A 保留 Java 作为调用方，补上三处缺口。

1. **owner 路由。** 有活 writer 的 Session，它的每个请求都必须到达那个 writer。有四种做法：
   - Java 在 Store 里查到 owner 自注册的地址，然后直连；
   - Harness 实例之间转发给 owner，最多转发一跳，并防止成环；
   - 负载均衡按 Session 请求头做哈希，成员变化导致重新映射的 Session 走转发；
   - 所有交互都改成持久命令，这就是方案 B 的模型，只是不包含它的调度部分。
2. **Session 级 fencing。** 期望的 boot ID 从客户端级改为 Session 引用级。接收方根据 Store 的状态判断请求属于哪种情况：
   - 是自己：处理；
   - 是另一个活 writer：路由错了，转发或者返回 `hosted_session_not_owner`；
   - 已经没有活 writer：保持返回 `hosted_harness_generation_mismatch`，走恢复。
3. **不绑定实例的写权限凭证。** Java 签一张不含实例信息的短期 Session 认领票据。接收请求的 Harness 在 `writers:acquire` 时出示它，Store 为这个 Harness 执行现有的 assign 或 takeover CAS，并返回现有格式的 placement-bound token。

方案 A 的局限：

- 转发层必须不缓冲地透传 SSE，并且不能重试 mutation。
- 实例之间仍然要能互通。
- 大约 40 个 owner 路由保持同步调用的形态。
- 负载均衡做的事，Java 自己的选择逻辑本来就能做。

第 3 项无论选哪个方案都值得做，下文把它作为 P0，因为方案 B 同样需要它。

## 5. 方案 B：拉模型调度（提议）

### 5.1 模型

**Session 工作项**表示"Session S 有工作"。它由 §2.2 中的持久记录推导出来，不是这些记录的新副本。每个 Harness 实例运行一个 worker 循环：

1. **轮询**：带上自己的身份、协议版本、能力摘要和剩余容量，向 Java 发起长轮询。
2. **认领**：对未被认领的 Session，Java 按现有规则为轮询方执行 placement assign 或 takeover CAS，然后返回 Session 描述和现有格式的写权限凭证。
3. **执行**：加载 Session，从 journal 和操作记录里取出待处理工作，然后执行。
4. **回报**：把操作完成结果和投影后的事件发给 Java。
5. **释放**：空闲时挂起，带收据释放 placement，这样下一次任何实例都能认领。

Session 被持有期间，Java 通过同一个长轮询把新工作交给持有者（§5.4）。被另一个活 writer 持有的 Session，它的工作永远不会交给别的实例。

### 5.2 工作来源

| 工作类型 | 现有的持久来源 | 改动 |
| --- | --- | --- |
| Turn | `ma_turn` 中可派发的行 | 扫描改为标记"该 Session 有工作"，而不是推送 |
| 审批或问题的决定 | Action response 操作 | 持有者读取决定；已停靠的 Turn 和现在一样在认领时恢复 |
| session message、child result、automation 触发、channel 操作 | relay 操作 | 同决定 |
| wake 输入 | journal 输入加 seal 时 wake stamp | wake 扫描改为标记工作，而不是调用 `activateForWake` |
| cancel 和模式切换 | Turn 状态 `CANCELLING`、Session 选择的 revision | 作为信号发给持有者（§5.4） |
| close、delete、archive | 带 claim 的生命周期操作 | 生命周期操作连同它的 claim 作为一个工作项 |
| 同步读取和管理（status、transcript、MCP 或扩展管理、client files、side query） | 现在是请求和响应 | 作为带应答位置的请求工作项；Java 在调用方超时之前等待应答 |

### 5.3 认领、租约和凭证

- **认领**就是现有的 placement CAS，只是改为在 Harness 轮询时执行，而不是在 Java 挑选成员时执行。takeover 规则不变：要么是带收据的已释放 placement，要么是 activation 已知且 writer lease 已过期。被拒绝说明 Session 仍被持有，工作项留给原持有者。
- **凭证**：轮询响应里带上现有的 placement-bound 写权限 token。Store 继续在每个 writer 操作上校验它，所以 `JournalFencing` 和 `requireCurrent` 都不用改。
- **租约**：writer lease（`writers:renew`，默认 60 秒）就是认领租约，不引入第二种租约。Claude 的 `expected_last_heartbeat` 前置条件，对应的就是我们现有的 writer generation 校验。
- **writer 身份**仍然是 boot ID。Turn 的 `bindHarness(bootId)` 仍然记录由哪个进程运行这个 Turn，进程变化仍然走恢复路径。

### 5.4 发给持有者的信号

持有者通过自己的长轮询得知所持 Session 的新工作：

- **唤醒**：轮询请求里列出该实例持有的 Session，其中任何一个有新工作时，Java 提前返回。只有一个 Java 实例时，这是进程内唤醒；多个 Java 实例时需要广播，可以用现有的每 Session LiteTopic（TypeScript 侧目前没有消费者），或者一张数据库通知表。
- **有上限的兜底**：漏掉的信号由定期重查所持 Session 来补，所以丢信号只增加延迟，不影响正确性。
- **cancel** 是对延迟最敏感的情况：它是一个持久的 `CANCELLING` 状态加一个信号。持有者收到信号就中止，最坏情况由兜底重查保证上限。Claude 的文档也写明了同样的效果：工具运行期间，interrupt 可能要更久才能生效。

### 5.5 结果和事件

- **完成结果**：持有者把现在作为响应返回的内容，发到 `operations/{id}:complete`，由它的写权限 token 做 fencing。现有的 operation ID 保证幂等。
- **事件（过渡）**：持有者把现在流式发送的 envelope 按 journal 序号分批发到一个摄取路由。coordinator 现有的流消费逻辑变成这个路由的处理函数，按序号丢弃重复。
- **事件（目标）**：由 Java 直接从 journal 提交中投影公开事件。这样省掉摄取这一跳，但要在 Java 里重复实现 TypeScript 的投影逻辑，因此作为后续选择（§8）。

### 5.6 fencing 和兼容性

- 正确性依靠 writer lease generation 和 placement epoch，两者 Store 都已经在校验。不再有任何请求靠"哪个进程应答了"来做 fencing。
- Java 在轮询时检查轮询方的协议版本和能力摘要，不兼容的轮询方拿不到工作。这样就能做滚动升级：每种工作只交给能执行它的版本。但跨版本契约本身仍需另行定义。

### 5.7 容量和公平

- 实例只为自己能接的工作发起轮询。冷启动上限和活跃 Turn 数变成轮询准入条件。
- Java 按租户轮询分配新 Session，这是共享 Harness 设计的要求。
- 队列深度、最早的待处理工作、正在轮询的实例数作为扩缩容信号，类似 Claude 的 `work/stats`。

### 5.8 drain

停止认领新 Session，继续服务已持有的 Session，每个 Session 空闲后就释放。drain 超时则退回崩溃恢复路径。不再需要入站的 drain 路由。

### 5.9 安全

- Harness 不再为私有路由监听端口，所以不再需要只绑定 loopback，也不再需要每实例一个 TLS 代理。
- Harness 用实例身份向 Java 认证，最好用证书里写有实例 ID 的 mTLS。
- 凭证按每次认领签发，所以凭证只存在于该实例当前持有的 Session 上。

### 5.10 故障语义

| 故障 | 行为 |
| --- | --- |
| 持有者死掉 | 它的租约过期，Session 变为可认领，通过现有的 takeover 和 G3 continuation 路径恢复 |
| Java 重启 | 工作是持久的，实例重新轮询并续租；已持有的 Session 在租约过期前保持其 writer |
| 完成结果的应答丢失 | 持有者用同一个 operation ID 重试 |
| 信号丢失 | 定期重查稍后送达工作 |
| 认领竞争 | placement CAS 只让一个认领者成功，其他的拿不到工作项 |

## 6. 对比

| 关注点 | 方案 A：负载均衡后面的推模型 | 方案 B：拉模型 |
| --- | --- | --- |
| 实例列表或服务发现 | 需要自注册 | 不需要 |
| Harness 入站监听 | 需要，而且要在 TLS 后面 | 不需要 |
| owner 路由 | 转发或重定向 | 不需要：工作直接交给持有者 |
| fencing 改动 | 每个请求做三种情况的判断 | 只用 Store 现有的校验 |
| 写权限凭证 | acquire 时出示认领票据 | 在轮询响应里签发 |
| cancel 和流式事件的延迟 | 直接一跳 | 取决于信号延迟，需要测量 |
| 同步读取 | 不变 | 带应答位置的请求工作项 |
| 滚动升级 | 同一个地址后面混跑多个版本 | 按轮询方版本分配工作 |
| 改动规模 | 中等，分散在每个路由上 | 大，但每个阶段可以独立交付 |
| 与 stateless 终态的契合度 | 部分 | 直接 |

## 7. 迁移计划

每个阶段都用能力位控制，最后一个阶段之前推和拉两种模式并存。

| 阶段 | 改动 | 完成标准 |
| --- | --- | --- |
| P0 | 实例自注册，以及在 acquire 时认领 | 实例加入和离开不需要改 Java 配置；静态池仍然可用 |
| P1 | 本来就可以交给任意实例的工作改为拉取：wake 输入、已停靠的决定、发给已挂起 Session 的 relay 投递 | 这些路径不再调用 Harness；真实进程 MySQL 测试中结果不变 |
| P2 | 干净挂起和停靠时释放 placement，并为已离开的实例加回收器 | 已释放的 Session 不必等租约过期，任意实例都能认领 |
| P3 | 为常驻工作加上信号并改为拉取：Turn、决定、cancel、消息 | cancel 和决定的延迟在约定预算内 |
| P4 | 由 Harness 摄取事件，取代 Java 读取 Harness 事件流 | 同一份 journal 产生的公开事件与现在一致 |
| P5 | 同步读取、管理路由和 side query 改为请求工作项 | 每个 `/session/:id/*` 路由都有拉模型的等价实现 |
| P6 | 移除推模型路由和静态池 | 不监听私有路由的 Harness 通过完整测试 |

## 8. 风险与开放问题

1. **延迟**：要测量 cancel、决定和首个事件经过信号之后的延迟，并和现在的直接调用对比。
2. **多个 Java 实例**：信号需要广播。LiteTopic 已经存在，但 TypeScript 侧没有消费者。而且多 Java 实例本身目前也没有验证过。
3. **事件投影**：由 Harness 摄取可以只保留一份投影实现；在 Java 里投影能省一跳，但会造成跨语言重复。
4. **经队列的同步读取**：请求工作项会增加读取路由的延迟。部分读取（例如 transcript）可以改为由 Java 直接从 journal 提供。
5. **协议规模**：大约 40 个路由要迁移，每个阶段必须足够小，便于评审。
6. **路线门槛**：空闲期能压到多短，仍由 stateless 路线的测量门槛决定。拉模型调度不会让冷启动变便宜。
7. **公平**：一个租户大量提交工作时，不能在认领阶段饿死其他租户。

## 9. 验收标准

1. 不监听私有路由的 Harness 能端到端服务一个 Session：create、Turn、审批、cancel、close。
2. N 个实例、Java 在负载均衡后面时，杀掉任意一个实例，它的 Session 在租约过期后迁到另一个实例，且没有重放任何工具调用。
3. 增减实例不需要修改 Java 配置。
4. 不兼容的轮询方拿不到工作。
5. cancel 和决定的延迟保持在 P3 设定的预算之内。
6. 每个阶段都通过真实进程 MySQL 8.4 测试套件，不能只靠单元测试或 H2 测试。

## 10. 参考资料

- [Scaling Managed Agents: Decoupling the brain from the hands](https://www.anthropic.com/engineering/managed-agents)
- [Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview)
- [Session event stream](https://platform.claude.com/docs/en/managed-agents/events-and-streaming)
- [Session operations](https://platform.claude.com/docs/en/managed-agents/session-operations)
- [Permission policies](https://platform.claude.com/docs/en/managed-agents/permission-policies)
- [Sessions](https://platform.claude.com/docs/en/managed-agents/sessions)
- [Self-hosted sandboxes](https://platform.claude.com/docs/en/managed-agents/self-hosted-sandboxes)
- [Self-hosted workers](https://platform.claude.com/docs/en/managed-agents/self-hosted-sandboxes-workers)
- [Environments work API](https://platform.claude.com/docs/en/api/beta/environments/work)
- [Stateless Hosted Harness 设计](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/docs/design/2026-11-16-managed-stateless-harness.md)
- [共享 Harness 设计](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/docs/design/2026-10-21-managed-shared-harness.md)
