# Managed Agent 准入、分发与交互契约收敛

[English](managed-agent-contract-closure.en.md)

状态：HTML v1.10 目标设计；2026-09-21。本文修订 v1.9 审查发现的七处接缝，不表示 Java/Harness/Runtime 已实现新能力。主链路仍是 Java SQL 提交后本机 SSE 直推，MQ 负责通知及异步处理；qwen 保持私有执行历史的唯一写者。

## 1. 受理分两种 Profile

| Profile | 返回 accepted 的持久边界 | 故障恢复 |
| --- | --- | --- |
| `qwen_confirmed`：现有产品 `/sessions` 兼容入口 | qwen 的 input + WakeIntent CommitReceipt 已保存；Java 保存路由/幂等身份不等于受理 | 响应不明查原 commandId，不制造新 Prompt；原 owner 不可确认则 blocked |
| `java_durable`：阶段 D 公共 `/v1/agents` 与对应 BFF 目标 | Java 同事务保存幂等身份、不可变输入、Turn、控制事件及 command delivery；HTTP 202 表示平台承担投递责任 | worker 按稳定 commandId 投递，查询原提交；获得 qwen receipt 后变为 `harness_confirmed`，不代表 Turn 完成 |

Profile 由入口版本/部署能力固定，不能因 qwen 慢而动态提前 ACK。旧客户端按旧契约运行；公共入口增量字段 `operation_id/admission_stage/delivery_state` 标记 planned，`durable_operations` 能力通过故障测试后才启用。缺少字段不能被 UI 推断为已被 Harness 接收。创建 Session 的 202 也只证明该入口声明的边界；不能与“模型已开始”混用。

新公共创建也持久保存 `create_session` operation，Session 返回 `creation_operation_id`。创建尚无客户端已知 Session ID，因此先按 tenant/actor/create/idempotency key 查询独立 creation receipt，再原子保存新 Session、operation 与 receipt；不能每次重试先生成新 Session。qwen 创建与 input 使用同一固定身份，创建回执确认后才投递 input。AgentDefinition 写入继续按其资源域保存等价 actor 范围幂等，不能复用旧的租户共享回执绕过授权。

Java durable command 的状态为 `pending → leased → confirmed`；临时失败可回 pending，查询不明进入 `blocked`。租约用数据库时间和单调 claim generation，确认更新必须匹配原 claim。投递成功/查询成功才保存原 CommitReceipt；超时、404 或租约过期均不能单独证明原执行没发生。旧主可能已提交时，先对账，禁止换 commandId 或换 Runtime 重跑。

operation 的 `completed` 对 input/cancel/action response 表示原命令已得到相应持久回执；Turn 结束、工具停止、最终审批决定分别查询 Turn、Execution、Action。取消 pending input 要与投递认领串行化；已 leased 或结果未知时保留取消意图，核对原 input 再向同一 qwen 命令域提交 cancel，不能仅删队列行。关闭/删除也要先持久封准入。

## 2. 批次分发不使用全局最大游标

AUTO_INCREMENT/sequence 分配顺序不是事务提交顺序。A 分配 1 未提交、B 分配 2 已提交时，把扫描水位推进到 2 会永久漏掉随后提交的 1。`batch_offset` 只作内部定位/公平排序，禁止以 `> last_batch_offset` 排除未完成工作。

采用同事务的 `managed_agent_batch_delivery` 元数据任务，每个 `(tenant, session, batch, consumer)` 唯一；正文仍只在 batch 保存一次。`acceptBatch` 同时创建当前版本要求的任务：SQL 模式为 `materializer:v1`，MQ 模式为 `relay:v1` 和 `materializer:v1`。SSE 节点的临时订阅不产生永久必要消费者。零公开事件的源游标检查点不创建任务。

1. 短事务按状态/到期时间选 pending 或已过期 leased 行，`FOR UPDATE SKIP LOCKED` 后写 lease owner、数据库时间期限并递增 claim generation。每次扫描从全部未完成集合选择，不持久化全局下界；LIMIT 只限制工作量。
2. MQ I/O 在事务外。Relay 可重复发送同一 batchId，只有持久发送确认后，才以原 owner + claim generation + 未过期 lease CAS 标记 done；失效 claim 的 ACK 不得完成新 claim。
3. 物化在 Session → Turn（如需）→ Owner（如需）→ consumer progress → delivery → Item/Snapshot 的固定锁序内重验 claim。按既有 V2 每 Session `covered_sequence` 检查连续前缀；副作用、进度及 delivery done 在同一事务提交。重复已覆盖批次只确认，不追加正文；缺口先处理早期 pending 批次，不能直接跳水位。
4. MQ consumer 收到 descriptor 后仍认领同一 materializer task，重复或晚到通知读取已完成事实后 ACK。SQL 对账扫描可抢回漏通知的 pending task；MQ 是唤醒通道，SQL 任务是工作是否完成的依据。lease 不明或处理中只能延迟重投，不能提前确认必要处理。
5. Relay 每 Session 按公开序号发布，使用独立 per-Session relay lease（复用 V2 consumer progress 的增量字段）。先锁 Session 再锁其 relay progress；最早未完成 relay 任务阻塞后续。认领时先取得该 Session lease，再按固定锁序认领 delivery，两者短事务提交；外部发送后在同一确认事务重验两个 generation 与 lease 并完成任务。旧 claim 可能迟到发送，消费者仍按 sequence 去重/补洞；队列 FIFO 不能替代这个检查。

SQL claim 事务只持有 delivery 行时，不得继续反向申请 Session 锁；先释放认领事务，再进入物化事务。Relay 的按 Session 认领使用上述完整锁序。blocked 任务持续保留、告警和人工/自动原任务恢复，不能因进死信而当成完成。新增必要 consumer 必须建立初始化屏障：从固定 Snapshot 及受保护尾部构建进度，补齐尾部任务，随后与 acceptBatch 在 Session 锁下切换 consumer set version；不能改配置后假定旧批次已有任务。

清理需要窗口到期、Snapshot 内容覆盖、全部必要任务 done、无有效 reader/recovery pin。正文删除前，同事务把原 batch 身份、摘要、源游标及序号写入 compact receipt；只在承诺的重试期限过后才删除 receipt。batch 的 R 从首次接受起计算；命令及删除 tombstone 至少保留至终态后的 R，未决状态不得到期删除。重试超窗明确拒绝/对账，不用“查不到”判断未执行。receipt 仅作去重，不能恢复正文。

## 3. 审批与用户问答

[OpenAPI](managed-agent-public-api.openapi.yaml)新增 planned 路由：公共 Session 下 `GET actions`、`GET actions/{actionId}`、`POST actions/{actionId}/responses`；BFF 对应 `actions/query`、`actions/get`、`actions/respond`。重连先读 pending Action，再接事件；事件是唤醒信号，不能作为唯一待办来源。Action 与原 Turn/Invocation 或非工具 operation 绑定，不以浏览器回调作为身份。

公开 Action 为 permission/question 两种封闭 DTO，提供有界选项或问题；响应只允许提交原 option ID 或原 question ID 对应的答案，禁止任意 tool payload、配置覆写或 policy。permission 不固定客户端自创的 allow/deny 枚举，服务端选项由原权限仲裁产生；question 在服务端核验必答项、问题 ID 不重复、选项归属、单选/多选和自由文本资格。公共字段是脱敏投影，不暴露原始执行参数、绝对路径、凭据或内部 optionsRef。

响应携带 `input_revision/policy_revision` 及幂等键，经 Java 持久 command operation 后发往原 qwen `resolveAction`。先核验当前 actor 的响应资格，再查原幂等回执；新响应须匹配原版本、期限和 requested 状态。相同键不同内容 409；不同键竞争由原仲裁 CAS 决定。记录一票是 `vote_recorded`，最终决定是 `decided`，operation 完成不自动代表 Action 最终决定。只有最终决定 receipt 才能形成 WakeIntent/放行工具。

取消、到期和最后一票在同一 Action authority 串行化；晚到响应返回 `action_expired/action_cancelled/action_already_resolved`，重放已成功的原请求则返回原结果和当前 Action 视图。转发超时保持 pending/blocked，用 commandId 查原 receipt，不能自动批准、换 policy 或重建 Action。local-only/多票仲裁继续执行既有权限规则；管理员角色本身不越过这些规则。

## 4. Workspace 与私有协议接线

通过新能力 `managed-context/1` 协商上下文包裹字段，不原地改严格 Tool v2 / InvocationContextV1。适用于新 control envelope 的 `ContextBinding`：`workspaceId/workspaceGeneration/storageId/contextRevision/contextConfigRef/contextDigest`；运行期再绑定 `runtimeBindingId/runtimeGeneration` 和 Harness owner generation。真实身份从可信连接及账本解析，传入字段只用于相等校验。

| 位置 | 必须绑定的证据 |
| --- | --- |
| ActivationGrant / RunnableGrant | 已提交 ContextBinding、config install receipt、原 epoch 和 enable ACK；全部匹配才开 gate |
| InvocationBinding 外层 | 固定 ContextBinding 摘要、Runtime incarnation、原 invocation ID；内部工具 payload 不得改 cwd |
| config_install stage/enable | cwd operationId、expected/target context revision、目标 config ref/digest、两端安装回执；沿用 `config.bound/domain.committed`，不创建第二份 config authority |
| Runtime/Harness receipt | commandId、operationId、ContextBinding 摘要、接收方 incarnation/generation、installed revision、结果与持久提交标识；仅同 command + 同摘要可幂等复用 |
| journal/checkpoint/RestoreBundle | config_install 域记录和精确 ContextBinding/已提交 operation 回执引用；恢复先核验 storage、generation、config 与安装证明，再申请 activation |

Java 是 Workspace/cwd 产品元数据 authority，qwen 是安装事实及执行历史 authority。`contextRevision` 不是 config 版本、workspace generation 或 activation epoch 的别名。W2 先封输入/新资源准入并保存目标 operation，再关闭可排空的空闲 stdio MCP 连接，再安装；活动 MCP 调用/未决回执是硬阻塞，纯空闲连接属于可排空资源，不能在第一步就永久拒绝切换。共享池只解绑本 Session 的空闲引用，其他 Session 仍使用的连接不关闭，新绑定以新上下文键隔离。关闭失败或状态未知仍 blocked。长寿命进程、watcher、后台任务不能假冒空闲连接被自动迁移。切换失败后的重开也必须验证回滚回执；任何一步都不能先释放 Workspace 写锁再验证上下文。

## 5. 迁移、混合版本与回退

当前源码事实是 V1 核心表 + V2 Item/Part/latest Snapshot/per-Session consumer progress；旧 v1.6 目标 SQL 同名表结构与它不兼容，不能作为第二个 V2 执行。现改为在真实 V1/V2 之后应用[storage delta](managed-agent-storage-schema.mysql.sql)，保留这些已存在表，新增 immutable `snapshot_version`、batch/delivery/receipt/owner，扩展原 progress 的租约列。再应用 [Workspace delta](managed-agent-workspace-schema.mysql.sql) 与 [command delta](managed-agent-command-schema.mysql.sql)。这些是设计 SQL，未来 Flyway 版本号按实施分支的实际尾号分配，尚未注册为源码 migration。

| 阶段 | 新装与升级规则 | 回退边界 |
| --- | --- | --- |
| Expand | 新装先 V1/V2，升级先校验已应用 migration checksum，再执行上述增量；旧表与旧事件均保留 | 能力全部关闭可运行旧版本 |
| Reader first | reader 能同时识别 storage_version=1/2；新进程支持 command/context gate；旧 writer 排空并 fencing | 不能把新 Session 路由给只识别旧格式的 writer |
| Backfill | 旧 Session 默认 version=1/context unbound；逐 Session 封写，记录固定高水位 H；从原输入/事件重建稳定 Item，生成内容及摘要一致的 snapshot_version，验证 V2 progress ≤ H 且无缺口 | 验证失败保持旧路径，不猜 cwd、不改旧公共序号 |
| Cutover | 同一 Session 锁内提交基线 Snapshot/H、required consumer set、storage_version=2；新 batch 从 H+1 开始；配置需按会话路由隔离且禁止旧 writer 接管 | 已接收 batch 的会话不可直接降级到仅懂逐事件表的 binary；停止写入并保留兼容 reader |
| Contract / GC | 观察期和回滚期限结束、旧客户端/reader 全部退出，才按保留规则清理旧事件 | 删除不可逆；备份恢复必须整组校验命令、事件、Workspace manifest 与 receipts |

不能给存量 version=1 会话开启 batch 清理，也不能混用最新 V2 mutable snapshot 当作不可变分页 Snapshot。backfill 不重发历史 MQ、不重新执行工具；新物化器从基线水位开始。启用 java_durable 前须能在 Java 重启后仅凭 SQL operation + 原 qwen command query 恢复投递。W0/W1/W2 与 P2 独立开关，但 Workspace writer fencing 是任何多 Workspace 开放的前提。

## 6. 身份授权与 Session 生命周期

生产契约必须有可信 `(tenantId, actorId)`，Gateway 删除浏览器自报的同名身份头并从已验证身份注入；工作负载另用 mTLS/服务身份。OpenAPI 的两个 header 是内部信任边界描述，不是建议浏览器凭字符串登录。授权查询和幂等重放每次重新核验当前权限；幂等唯一域包含 tenant/session/operation/actor/key，不能跨 actor 取回回执。

| 角色/来源 | 允许的产品行为 |
| --- | --- |
| Session reader | 列表/历史/事件/脱敏 Action/operation 查询；同时受 Workspace 与 Artifact ACL 约束 |
| Session operator（包含 reader） | 提交输入/取消；审批另需原 Action 指定 responder 资格；不能直接改配置或释放他人资源 |
| Session owner / 获授权管理员（包含 operator） | close/archive/delete/cwd；仍须 Workspace 权限、生命周期/配置门禁，不能凭角色自动批准工具 |
| Channel / Automation 服务主体 | 固定 Session/用途/委托 actor 范围；不继承租户管理员，也不伪造用户票 |

首版单用户 smoke 可把可信 actor 映射为唯一 Session owner；不得把“同 tenant”当成所有生产用户可互读写。无权读取的资源返回 404；已可读取但无操作权限返回 403。列表、事件订阅及订阅期间权限撤销也遵守同一 ACL；凭据撤销后断流，不能只在建连时验证。

公开 `POST .../close` 表示停止新输入并执行既有有序清理，结束状态 closed；`POST .../archive` 仅允许 closed Session，标记列表归档且可通过 include_archived 查询，保留历史；`DELETE session` 是持久删除 operation，封准入、取消/结算、生命周期 Hooks、资源转存/释放后才清理 Session 内容。未决执行保持 blocked。delete 不删除共享 Workspace、其他 Session、留置或共享引用的 Artifact；删除完成后仅保留按策略有界的授权 tombstone/operation 以供原命令查询。cwd/close/archive/delete 共用 operation 查询入口，执行 ledger 可分表；物理 Session 行在 tombstone/命令重试期限届满前不删，避免外键级联丢掉回执。

unpin 是客户端展示偏好，既不 close 也不 release Runtime；不为它新建服务端执行接口。具体清理顺序继续复用已有恢复/生命周期专项，新增路由不能跳过 Hook 或原执行对账。

## 7. 容量、保留和验收门槛

下面是开发/预发的可执行起始配置，生产必须结合并发、真实平均/峰值 bytes、索引和副本开销压测后明确配置。不是已验证的吞吐或 SLO。

| 参数 | 开发/预发起点 | 约束 |
| --- | --- | --- |
| 文本 batch | 首片立即；后续 100ms 或 64KiB | 控制/终态先 flush；超大单事件转 Artifact 或明确拒绝，不能无限突破上限 |
| 公开重放 W / command retry R | 1h / 24h | 生产显式设置，R ≥ W；receipt、幂等与 tombstone 不早于 R；未决 operation 不按 TTL 删除 |
| 范围 reader lease | 60s，可续租，单次读取总长最多 5min | 到期显式 reset/restart，不突破 GC 屏障；大历史改用稳定 Snapshot 分页 |
| claim lease | 30s，10s 续租 | 使用数据库时间；失效 ACK 不生效；单批处理超时必须续租或停止提交 |
| 物化 lag | warn 60s，stop new input 5min | 按最旧必要 pending 的 acceptedAt 计算，不按最大 offset；恢复至 30s 以下持续 60s 才自动开放 |
| 日志预算 | 该环境预分配 budgetBytes；70% 告警，85% 停新输入 | 预留至少 15% 及最大在途输出的较大值；压测预算不足则不开环境，不以 TTL 强删 pending |
| Pin | reader 有期限；调查/recovery pin 有责任人、到期复核和容量告警 | recovery 未解决不得仅因超时强删；必要时停止执行，不能无限静默积压 |

超过 stop 阈值拒绝新的 Prompt/自动任务并返回 429 + Retry-After；保留查询、取消及恢复入口，已受理工作依赖预留容量继续收尾。若预留空间也逼近耗尽，暂停源消费并依赖已验证的源回放；尚未验证源持久回放的部署必须有有界取消/blocked 策略，不能声称绝对无损。DDL 的 expires_at 仅表示最早候选清理时刻，不能绕过 Snapshot、task 与 pin 检查。

实施出口：①并发晚提交 batch 不漏、旧 claim ACK 无效、原 batch 重投不重复追加；②两个入口受理边界、重启/ACK 丢失、取消竞争；③permission/question 的票据、过期、断线和角色撤销；④context 安装每一步崩溃、MCP 空闲排空与活动调用阻塞；⑤真实 V1/V2 升级、新装/混合版本/只读回退；⑥close/archive/delete 不混义；⑦容量/lag/pin 超限能停止准入且有恢复证据。实现顺序先 ①②③，再 ④⑤，生产开放前完成 ⑥⑦。

文档验证（2026-09-21）：OpenAPI 3.1 校验、35 条路径/39 个操作/84 个 schema 的引用与唯一性、40 组 DTO 正反例通过；临时 MySQL 26.7.0 分别从新 V1/V2 与带 V2 数据的库应用三个 delta，验证保留旧数据、晚提交任务、claim fencing、幂等域和 GC receipt；1440px/390px HTML 渲染无页面横向溢出。SQL 片段验证不等于适配器或多节点 E2E；完整物化、Runtime/Hook/权限行为及 MySQL 8.0/PostgreSQL 版本矩阵尚待实现验收。
