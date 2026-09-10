# Session / Harness / Runtime 私有协议

更新日期：2026-09-11；源码基线 `a8360814668b3dfdff72ad3d99cbcaf26dd009a9`。这是待实现的首版契约，普通 HTTP/ACP/SDK 的旧接口与错误时机继续按[兼容方案](managed-agent-session-compatibility.md)适配。本文补齐[Harness](managed-agent-harness.md)与[coordinator](managed-agent-coordinator.md)之间的消息、提交和原调用接管；不表示当前 Tool v2 已具有 activation 隔离或跨 worker 重启恢复。

## 1. 传输、版本与可信调用方

首版 Session authority 由 daemon 承载，Harness 使用受控的 Session client。当前 in-memory ACP host 可以使用同进程适配器；需要跨进程时经已有私有 ACP 连接安装同一 typed dispatcher，不增加公网 Session RPC。两种适配必须执行同一验证与条件提交逻辑，不能让同进程实现直接访问文件绕过契约。

新增能力命名为设计中的 `managed-session/1` 与 `managed-runtime-control/1`，通过私有握手显式协商；名称和版本属于新协议，不冒充当前已有 capability。普通调用者无权调用 grant、工具结算、writer 或 gate 操作。真实身份由已认证连接、所属 workspace generation 和服务端绑定解析；请求里的 tenant/session/epoch 只用于一致性比较，不自己产生授权。

现有 owned Tool v2 和 InvocationContextV1 的严格字段不原地加字段。新 Runtime control envelope 可以包含原 v2 的 operation/payload，内部复用原校验器及 native 方法；已开启 activation 门禁的 binding 只能经受控 dispatcher 进入。旧 v2 直连或本地原始 client 也必须在 Runtime 核心入口拒绝绕过门禁；未开启此增强的 legacy/实验绑定仍保留旧协议。协商失败准确拒绝新能力，不降级执行。

## 2. 公共数据结构

精确编码、ChatRecord subtype/lock schema、事件字段分型和数值限额以[存储规范](managed-agent-session-storage.md)为准；全量配置、领域与平台契约从[全量覆盖表](managed-agent-full-design.md)索引。这里的首版恢复范围不限制后续专项的设计覆盖。

以下是字段契约；实现时生成明确的 TypeScript discriminated union 与对应 validator，禁止以任意 JSON 代替已知记录类型。既有内容 union、模型历史、权限 DTO 和工具结果继续复用。

| 结构                | 必需字段与约束                                                                                                                                                                                                                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SessionKey`        | `tenantId, workspaceId, sessionId`；沿用服务端规范化身份，存储位置不依赖端口或 host 启动 ID                                                                                                                                                                                                        |
| `CommandMeta`       | `v:1, commandId, sessionKey`；写命令另有稳定操作内容摘要，执行提交有 `expectedSequence`。连接 actor 不放入可由模型填写的 payload                                                                                                                                                                   |
| `ActivationGrant`   | `activationId, epoch, workerId, subject, definitionRevision, leaseDurationMs, expiresAt, installationState`；绑定完整 SessionKey 与 workspace generation；epoch 由 authority 按 Session 单调颁发；安装结果为 installing/active，给 Harness 的 RunnableGrant 还必须含全部必要 enable ACK 的核对引用 |
| `CommitReceipt`     | `commandId, firstSequence, lastSequence, eventIds, duplicate`；ACK 仅在逻辑提交完成后返回；重复请求返回原位置，不制造新事件                                                                                                                                                                        |
| `EventEnvelope`     | `v:1, sequence, eventId, sessionKey, kind, occurredAt, payload`；执行事实另含 turn/scope/activation；sequence 由 authority 分配，客户端不能覆盖                                                                                                                                                    |
| `DurableRef`        | `resourceId, kind, schemaVersion, byteLength, digest`；由所属 Session 解析、授权和验证；不接收任意绝对路径、URL 或将回收的临时文件作为恢复引用                                                                                                                                                     |
| `InvocationBinding` | 完整 `ManagedToolInvocationReference`、逻辑 session/turn/scope、稳定 `runtimeBindingId`、原 Runtime Session ID、lease/generation、媒体/权限快照摘要；工具参数不能改写这些字段                                                                                                                      |
| `ToolOutcomeRef`    | 按来源分型：runtime 含已接收 InvocationBinding/receipt；domain 含 action/Goal/Todo 等领域提交回执；orchestration 含注册的编排结果或 child 结算引用。三者共享稳定 executionCallId、输入摘要和批次位置，不能伪造另一来源的回执                                                                       |
| `WakeIntent`        | `wakeId, reason, subject, sourceEventId, requiredSequence`；reason 为 input/action_resolved/tool_settled/recovery，定时及子任务扩展按相应用途验收后启用；不等同允许重放副作用                                                                                                                      |

**v1 的 `tenantId` 语义要写死，避免被当成多租户能力。** 它是由已解析 workspace 派生的**本地键**，用于身份规范化与路径/索引分区，不代表已认证的租户主体，不承担隔离、配额、计费或跨租户授权语义；真实多租户平台在[全量覆盖表](managed-agent-full-design.md)§1 的目标边界外。因此本轮所有“per-tenant 公平轮转/上限”在实现上退化为 workspace 级别的公平与上限，字段保留是为了将来不改记录格式，不是已具备租户隔离的声明。禁止基于该字段设计跨租户的信任、配额或数据可见性；需要真实租户身份时必须先有认证控制面，并在对应专项重新定义该字段的来源与校验。

`ActivationSubject` 是封闭 union：`{kind:'turn',turnId}` 或 `{kind:'hook_operation',operationId,occurrenceId,event,phase,originTurnId?}`；普通旧 turn DTO 仍从前者投影原 turnId，不添加假用户轮次。WakeIntent 与执行事件携带相同 subject。无活 turn 的 prompt Hook 使用后者，仍共享同 Session 单调 epoch、唯一模型推进者、Harness 槽位和模型预算；OperationGrant 本身不授予模型调用权。

hook-purpose claim 只接受已持久 Hook occurrence 与固定 plan/input/model policy。关闭和删除封普通新 activation 后，仅可在原维护操作受理范围内领取其生命周期 Hook activation，不能借此受理新用户输入或启动主 Agent、工具/Goal/cron。复用原 PromptHookRunner，提交 model.attempt 和 hook_execution 结果；以 hook_complete 释放 activation，不生成 turn.settled 或任务完成通知。模型请求不明仍保留独立 attempt/费用不确定事实，不自动重放。writer、模型凭据及必要 Runtime 资源保留到该 Hook phase 实际结算；无合法恢复能力明确 blocked，不能默默跳过 Hook。

commandId 的幂等范围是 SessionKey + operation + commandId；同一范围内相同 ID 不同操作内容冲突。expectedSequence 是并发前置条件，不因重试换值形成新的业务内容。可信相同 actor 的重复查询先返回原提交；无历史命中才校验当前 fence/sequence 并执行。对于旧 epoch 的已提交重复请求，最多返原 receipt，不能据此获取新推进权。

读取不要求 activation grant。Harness 不能伪造用户输入、最终审批票或 Runtime 原生结果；用户也不能提交模型执行事实。跨 workspace、错 generation、错误 scope、未知字段或不支持的 schema 在副作用前拒绝。密钥、完整环境和认证 token 不进入日志、checkpoint 或错误详情。

## 3. Session 命令与读取

| 方法                                              | 允许 actor                             | 请求/响应与原子边界                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `readRestore`                                     | 所属入口或已绑定 Harness               | 读取指定已提交 sequence 的 RestoreBundle，包含 projection、checkpointRef、restoreBasis/restoreProofRef、tail 与待处理命令；合法 null 组合以存储 §2.2 为准，不把 checkpoint 读取失败降级为新建。旧 live replay 不等于模型恢复包                                                                                                                        |
| `readEvents` / `subscribe`                        | 已授权客户端适配器/Harness/coordinator | 使用 `session-events/1` 命名空间的有界 cursor；仅正式提交事件。snapshot→增量之间按序补齐，重复按 eventId 去重；过旧 cursor 明确要求重读                                                                                                                                                                                                               |
| `submitInput`                                     | 已认证入口/可信内部来源                | 规范化内容、稳定 turn/input ID、用途和期限；输入及 WakeIntent 一次逻辑提交。返回 CommitReceipt + turnId，不等待模型完成                                                                                                                                                                                                                               |
| `appendExecution`                                 | 当前有效 activation 的 Harness         | typed 执行事件批次与 expectedSequence，仅限 `model.attempt`/`message.committed`/`tool.intent`/`context.compacted` 与 tool_call 来源的 `action.changed(requested)`。工具结果用 ToolOutcomeRef 引用已提交回执；工作区物理 tool.receipt 只走 acceptRuntimeReceipt，不能由 Harness 改写物理结果或用户票据                                                 |
| `commitCheckpoint`                                | 当前 activation 的 Harness             | checkpoint 内容/ref、覆盖 sequence、上一 checkpoint、boundary；authority 验证引用及 fence 后提交，coordinator 不代交。合法恢复起点的首个 before_model checkpoint 使用 boundary=null，不产生释放或终态；turn_complete 则同时验证终态 payload 并在同一事务提交 turn.settled 与 checkpoint，之后才返回 boundary receipt；durable_wait 必须有完整恢复状态 |
| `requestAction`                                   | 注册的非工具确认适配器                 | CommandMeta、requestId、source、inputRevision、optionsRef、policyRevision、期限；source 限 automation_run/team_plan/user_operation，核验原操作及实际 Session 授权后创建 requested。按存储 §3 来源矩阵校验，返回原 CommitReceipt，不启动 Harness、不授予决定权                                                                                         |
| `resolveAction`                                   | 原权限/用户问答仲裁入口                | requestId、action kind、原 invocation/input/policy 版本与合法结果；同决策幂等，冲突或迟到按原协议处理；最终决策提交后才能推动调用                                                                                                                                                                                                                     |
| `requestCancel`                                   | 用户入口或受控生命周期 owner           | 精确 turn/scope/invocation、原因；先持久请求再执行取消。与队列撤销、物理工具退出、最终 turn settlement 分开                                                                                                                                                                                                                                           |
| `claimActivation` / `renewActivation`             | coordinator/scheduler                  | 按候选状态条件领取与续租；claim 初始为 installing，只有门禁回执核对后才能发布有效 grant；同一 Session 只有一个有效推进者                                                                                                                                                                                                                              |
| `completeActivationInstall` / `releaseActivation` | coordinator                            | 前者提交所有所需门禁安装证明；后者提交 waiting/turn_settled/hook_complete/blocked 原因与边界引用。释放不自动完成 turn                                                                                                                                                                                                                                 |
| `acceptRuntimeReceipt`                            | 原 binding 的可信 coordinator 回执入口 | 原 InvocationBinding、原生结果/进度终态、输出 refs 和 history revision；验证并去重后追加，必要时同时形成 WakeIntent                                                                                                                                                                                                                                   |

首版不增加通用 `executeMethod(name, args)` 或可绕过 actor 的任意 append API。领域命令内部可以共用 transaction helper，但不能把其存在暴露为用户或 Harness 的无限写权限。

全量领域命令通过注册表按 domain/version 校验 payload，唯一正式事件为 `domain.committed {domain,version,operationId,recordRef}`；领域状态保存在 recordRef 的受控资源中。对已提交的 delivery outbox、配置安装、历史维护等，authority 可在校验原 operation revision、lifecycle、trust 和资源范围后签发 `OperationGrant {sessionKey,operationId,domain,operationRevision,ownerId,workspaceGeneration,resourceScope,leaseDurationMs,expiresAt}`。它仅允许原计划中的明确 phase，不授权模型推进或任意新业务；不是第二个 Session activation/epoch。模型侧首次提交意图仍需 ActivationGrant。

需要物理操作的 OperationGrant 在所属 Runtime 安装独立 per-operation 单调 gate，重复安装/撤销按 operation revision 幂等处理；撤销后不可重开同 revision，下一 revision 先关闭旧准入并核验原 phase。新操作均受 maintenance barrier、共享容量和生命周期约束；status/cancel/结算保留原资格，不能因模型 turn 已结束而丢失交付或维护回执。一次性阶段以 effectId/effectRevision 固定原参数身份，operationRevision 只控制条件更新/门禁；稳定 phaseOperationId 不随 grant 重领而改变，unknown 不借新资格重跑。Channels 发送由有目标凭据的领域适配执行，workspace 文件/命令仍必须进 Runtime。

没有 Session 的 workspace Git/PR/目录管理使用 `WorkspaceOperationGrant {workspaceKey:{tenantId,workspaceId},workspaceGeneration,operationId,domain,operationRevision,ownerId,resourceScope,leaseDurationMs,expiresAt}` 分型。**阶段归属：它服务的是无 Session 的 workspace 维护，随 R5 的历史/维护片（F7）交付，R2 不实现；R2 期间这类操作继续走现有 workspace 服务路径。** 版本维度仍只有两层——`workspaceGeneration` 决定该 workspace 的有效代，`operationRevision` 决定这次维护操作的条件更新与门禁；它不引入第三层版本，也不与 Session 的 activation epoch 相互换算。所属 workspace 控制 owner 保存维护操作意图和结果，Runtime 保留原物理回执；不捏造 Session、模型 activation 或 primary Session 归属。这些记录是无 Session 工作区操作的权威，不复制任何 Session 事实。它使用相同 per-operation gate、共享预算、信任和维护 barrier；与其他 Session 写入冲突时先按已声明范围拒绝或排空，不能后台跨 owner 改文件。

工具来源由可信工具定义和注册适配器决定，不接受 Harness 任意声明“本地成功”。AskUserQuestion 以 actionRequest/最终 decision 形成答案结果，无需伪造 Runtime prepare；Todo/Goal 状态变更必须有对应领域提交。Agent/子任务结算须带原 scope/result 引用，尚不能持久接管的编排保持驻留或阻塞 detach。每一类都保留原 ToolResult/错误语义与稳定调用 ID；工作区工具不能经 orchestration 分支绕过 Runtime。

输入/模型正式消息、工具关联、取消/审批、等待和终态使用版本化 ChatRecord 扩展。一次逻辑事务需要多行时，用事务 ID、记录数/摘要与最终 commit marker 确定可见性；读者只暴露完整提交。未知 subtype 或不完整事务不能容错执行为旧会话；展示与严格恢复继续各自映射。物理 writer 交接前必须验证兼容 reader，不可让旧 host 直接追加新格式。

首个本地后端的成功提交定义为：写入完整事务并完成文件同步；首次创建/必要生命周期变更同步父目录；任一步失败不回成功 ACK。具体实现须结合既有 writer/文件身份保护验证平台语义，不声称文件同步可保证所有硬件故障下绝不丢失。存储失败后先停止推进，再严格读取原 commandId 的提交记录；已完成而 ACK 丢失返回原 receipt，损坏/不确定不能补造完成。单机后端不承诺分布式事务。

## 4. Runtime 的 activation 门禁

Runtime lease 只证明原工具环境身份；现有 `ManagedToolCallIdentity` 并不包含 Harness activation。新增控制协议按以下步骤安装门禁，coordinator 保存原 binding，Harness 自报更大的 epoch 无效。

1. authority claim 创建 installing activation。coordinator 对该 Session 的全部相关 root/child bindings 发送幂等 `stageGate`：关闭旧 activation 的新派发，登记待安装的新 epoch，但不开放执行。Runtime 在实际操作准入锁内返回 closed/installed 状态及已准入 invocation 清单。
2. 所有必要 ACK 经过核对后，authority 条件提交 completeActivationInstall。coordinator 以该 grant 的提交证明调用 `enableGate`，Runtime 确认新 epoch 已生效后，才把可运行 grant 交给 Harness。部分成功/丢 ACK 按原安装 ID 查询和重试，不能提前推进。
3. 有效绑定第一次惰性创建 Runtime 时，同样先完成门禁安装再开放工具；新建 child binding 与 Session 激活/关闭串行校验，不能在全量屏障完成后偷偷挂入一个未受控 child。
4. 每次实际副作用准入重新验证 Session/scope、Runtime lease、activation、参数/能力/权限版本。覆盖 beginTurn、history bind/checkpoint、prepare/build、confirm、preflight/Hook、execute 以及其他会触发本地工作的入口；不只保护 execute。只读 manifest/status 也保持原身份授权。
5. `revokeGate` 只封住新工作，不取消已准入原 invocation；其 status/cancel/settlement/history 继续由 coordinator 限权访问。已开始的操作仍可能完成，不能把 gate ACK 当作进程退出或物理执行结果。

Runtime 在 SessionKey + binding incarnation 内保存单调 gate revision、最大 epoch 和已撤销状态。stage/enable/renew/revoke 均条件更新并幂等返回原 ACK；enable 仅能开启同安装 ID 尚未撤销的 staged gate，renew 仅延长仍 active 的同一 gate。撤销同 epoch 后不可重开，stage 下一 epoch 后不可接受旧 epoch 的迟到 enable/续租；重复查询不能恢复旧权限。Runtime 若丢失这些门禁状态，原 binding 必须判为 lost 并拒绝工作，不能重启后以空状态接受旧 grant。

Runtime 以受控有效期限制门禁：expiry 来自 authority grant，不能被 Harness 延长；coordinator 续租后才续 gate。首版本地部署使用同主机时间，Runtime 仍逐次检查期限；网络分区、超期、时钟来源无法信任时停止新派发。跨主机采用[恢复与运行专项](managed-agent-recovery-operations.md)的单调挑战期限和原 binding 屏障；实现与验证前不开放该 profile，不能把本地时间假设复制到远端。

当前由 Config 工厂随机创建的 Runtime Session ID、文件历史 owner、执行引用 Map 和未决 Promise 要移交 coordinator。新 Harness 通过已持久 binding 查原 Runtime，不能再次运行 factory 生成新 UUID 充当恢复。原 Config 的 shutdown 和 runTool 的 finally 不得在可恢复 detach 中 terminal release 已转交的调用。

## 5. 回执、资源和恢复保证

| 场景                                          | 首版保证与边界                                                                                                                                                           |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Harness 替换，coordinator 与原 Runtime 仍存活 | 按原 invocation/status 继续取回结果，结果及持久资源提交 Session 后推进模型；不重发 execute，不取消已经转交的原工作                                                       |
| 工具完成但 Session ACK 丢失                   | 使用原结果 digest 和 commandId 查询/重交付，得到相同 receipt；保留成功事实及原 toolUseId/Hook 结果，不重新执行工具或 Hook                                                |
| 原 worker 丢失，Session 已持久接受结果        | 从 Session 已提交结果恢复；不依赖 worker 内存 Map 或临时输出目录                                                                                                         |
| 原 worker/daemon 丢失，尚有未决副作用         | 缺失/404/Map 空/IPC 断开都不是未执行证明，保持 recovery_blocked。仅凭新接口不承诺重建原进程或跨 worker 重启自动续跑                                                      |
| 全量 worker 重启后结果恢复                    | 按[恢复与运行专项](managed-agent-recovery-operations.md)实现独立持久 RuntimeReceiptStore、phase 日志与旧 owner 核验；started 无终态仍未知，不承诺外部副作用 exactly-once |

交付保证的精确说法只有一句：**在原 coordinator 与原 Runtime binding 存活的范围内，一个 invocation 至多被派发一次（at-most-once），已派发的结果按原引用幂等取回。** 这不等于外部副作用 exactly-once。两者的区别是：派发次数由本协议的稳定 executionCallId、门禁和回执去重控制，可以证明；而某次已派发的操作在外部世界是否发生、发生几次（网络发送、Channels 交付、非幂等远端 API），本协议无法观测，因此 started 无终态一律保持未知。Harness 专项的 H04 说的是前者，本表说的是后者，二者不冲突；任何文档不得把 at-most-once 派发写成 exactly-once 副作用。

首版先完成可恢复 Harness 分离，未决 worker 重启继续保守拒绝；这是明确的能力范围，不把“worker 丢失不丢会话”误写成“worker 丢失可以重放所有操作”。当前 worker 会在父 IPC 断开后关闭，activator 在退出后清 outputRoot，因此 daemon 重启不能假定原 worker 仍可接管。

保留规则按引用约束：原 Runtime 结果及唯一输出副本在 Session 接受结果、接收必要媒体/备份资源、提交关联 checkpoint 前不得主动删除或 terminal release。其后仍有未结算子作用域或等待引用则继续保留。Session 侧的回执 ID/digest 与引用随可恢复历史保留，不能用 Runtime 缓存 TTL 删除幂等依据。首版不新增自动 TTL 清理未决记录；删除/归档继续受原维护协议控制。

history revision 由原父 owner 产生；coordinator 先持久提交 snapshot/ref 再推进已接收 revision，失败不得更新内存镜像为成功。清理阶段允许读取原 history，拒绝推进新 checkpoint。Runtime 原生回执可以携带候选资源，authority 必须确认持久引用可读再 ACK；不把 Runtime 绝对路径解释为 Harness 本地路径。

## 6. 错误、限额与取消时序

内部错误采用有界 `{code, message, retryable, commandId?, currentSequence?, recoveryRef?}`，不含栈、密钥或任意文件内容。首版类别为 unsupported_version/capability、invalid_payload、scope_mismatch、idempotency_conflict、sequence_conflict、stale_activation、runtime_unavailable、storage_unavailable、recovery_blocked、resource_limit；外部旧方法由适配器还原其已有错误与同步/异步时机。

sequence_conflict 重读后用同业务 ID 核对，不自动再做副作用；stale_activation 停止推进；storage_unavailable 先查提交结论；Runtime unknown 保留恢复阻塞。retryable 只指重试协议查询或同 ID 命令的资格，不授予工具重新执行权。

Session control 请求、分页和事件批次必须有字节/条数/深度上限，并在初始握手公布实际限制。首版复用现有对应内容协议的限制和预算来源；新增 envelope 开销单独计数，不悄悄放大工具/媒体/文件历史额度。大 checkpoint/模型历史和输出用 DurableRef 加有界分页，不能截断后宣称可恢复。具体数值与兼容行为以[存储规范的限额表](managed-agent-session-storage.md#5-首版固定限额与兼容路径)为准，实现须把该表变为实际执行的 validator 与预算检查；超限不会回成功 ACK，不能把 limits 字段设成无人消费的开关。

用户 cancel、lease loss、transport EOF、deadline、Harness detach、Session close 使用不同 reason。cancel ACK 只表示已提交请求；模型流的未提交 delta 不进入正式历史，原工具晚成功保留成功回执。deadline 可以结束客户端等待，但未决执行仍保留并阻挡不安全后续；完整规则见兼容方案。新模型 attempt 要记录独立 ID，不能承诺精确续流或只发生一次计费。

## 7. 协议验收与实现门槛

| 编号 | 必须验证                                                                                                                                                                                                   |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P01  | 同进程与私有 ACP client 对相同非法字段、actor、sequence、重复 ID 返回一致结果；旧公开 DTO、同步 throw 和 optional Bridge 保持                                                                              |
| P02  | 在事务每行、commit marker、文件/目录同步和 ACK 前后中断；只出现完整逻辑提交，重启不重复输入/终态，不改变旧用户文件                                                                                         |
| P03  | stage/enable/revoke ACK 丢失、部分 child 安装、撤销后迟到 enable/renew、stage 下一 epoch 后重放旧请求、旧 v2 raw client 绕过；未授权新 beginTurn/prepare/confirm/preflight/checkpoint/execute 均无新副作用 |
| P04  | Runtime 完成/Session 接受/资源转存/checkpoint 各窗口丢 ACK；使用原引用恢复，不再次执行工具/Hook，不提前清唯一资源                                                                                          |
| P05  | 杀 Harness 与杀 worker/daemon 分开；前者接管成功，后者未决时明确 blocked；原已提交结果仍可读                                                                                                               |
| P06  | cursor 过期、批次/媒体/深度超限、坏 digest、跨 Session ref；既不静默截断恢复状态，也不越权读取                                                                                                             |

本稿和存储专项已确定命令集、字段分型、限额、提交可见性、安装屏障和恢复范围。R2.S1/S2/S3 按此实现编译通过的 schema/validator 与成对生产消费接线，再取得平台同步、崩溃和进程实证；设计已定不表示这些检查通过。领域 OperationGrant、跨 worker 回执及远端 profile 按全量计划逐项实现验收。
