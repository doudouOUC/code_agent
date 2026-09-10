# Managed Session：记录格式、提交与协议限额

更新日期：2026-09-10；源码基线 `a836081466`，前版设计 `4cacfbd0ed`。本文是全量目标的规范性设计，补齐[私有协议](managed-agent-control-protocol.md)原有的格式和限额冻结项；新增格式、适配器和限额尚未实现或验收。现有公开签名仍按[268 项兼容映射](managed-agent-session-method-map.md)保留。

## 1. 唯一载体与版本决策

普通 Managed 继续使用所属 workspace/runtimeBaseDir 的原 Session JSONL 路径，不新建一份竞争历史。增加三种 ChatRecord system subtype：`managed_session_header_v1`、`managed_session_event_v1`、`managed_session_commit_v1`。`uuid/parentUuid/sessionId/timestamp` 保留原字段；event 内的领域内容是唯一事实，普通 user/assistant/tool/Goal/artifact 内容由 reader 投影产生，不再同时追加等价旧记录。legacy 和实验日志保持原格式。

header 记录 `formatVersion=1, minimumReader=managed-session/1, sessionKey, engine=managed, definitionRef, rootSnapshotRef, createdBy, baseTranscriptProof?`。历史导入保留已封存的旧记录前缀，header 引用其长度、hash 和活动尾；新事件从 sequence=1 起，所有新读者同时重建前缀与已提交增量。创建空会话只提交 header，不触发 prompt 或工具。

兼容保护不依赖旧 reader 理解新 subtype。Managed authority 的物理 writer 使用新增 lock schema 3，active/封存状态都保持该 schema；Managed 关闭保留经过核验的 sealed 3 锁，只有支持它的 authority 可以认证接管，不能按旧 release 删除为无锁。当前 schema 1/2 reader 对未知 schema 报 malformed 并拒绝，作为基线旧二进制的防写屏障。迁移在独占 writer/claim 保护下先安装 schema 3 再提交 header；中断由新 owner 核验恢复，不让旧二进制接管半转换文件。旧二进制的纯展示可能忽略新 subtype，须明确“不支持此版本”，不能把它的部分视图作为完整恢复依据。

锁 schema 3 增加 `formatVersion`，封存分型另有 `lastCommitSequence, committedPrefixHash`；原 owner、进程开始身份与 sealed transcript proof 保留。active 锁不逐次重写这些提交摘要，日志 commit marker 才是当前位置；封存先 flush 日志、核验完整前缀，再原子替换并同步锁及父目录。崩溃在二者之间由新 authority 认证原 active owner 和日志，不把陈旧锁摘要当最新提交。未知版本不能回收为 stale。更老、绕过 writer 协议的程序不在兼容保证内。格式转换生成独立新 Session 的方案见[工具与历史](managed-agent-tools-history.md)，不原地切换 executionEngine。

## 2. 字段与编码规则

以下为所有新 validator 共用的规则；不改变旧 DTO 的宽松展示读取。

| 类型                        | 规范                                                                                                                                                                                                                                                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| StableId                    | 非空 UTF-8 字符串，最多 512 字节，拒绝 NUL/控制字符；tenant/workspace/session 另取既有解析器和此上限的交集，不能借新协议扩大旧 ID                                                                                                                                                                                                          |
| Sequence / revision / epoch | 非负 safe integer；正式事件从 1 起；加一溢出前停止准入，不回绕。expectedSequence 可为 0                                                                                                                                                                                                                                                    |
| Digest                      | lowercase SHA-256 hex，64 字符；业务 JSON 复用现有 managed canonical JSON 排序/编码，资源用实际 bytes；新 validator 另拒绝非有限数字、原始 JSON 重复键、循环和 prototype 特殊键，不声称旧解析器已有全部检查                                                                                                                                |
| Time / deadline             | UTC Unix 毫秒 safe integer；期限只约束相应操作，不推断物理工作已结束；恢复不延长原 deadline                                                                                                                                                                                                                                                |
| SessionKey                  | tenantId/workspaceId/sessionId 全部必需；路由从可信连接解析，payload 只做一致性校验                                                                                                                                                                                                                                                        |
| CommandMeta                 | v=1、operation、commandId、SessionKey；写命令有 contentDigest；执行命令带 expectedSequence，actor 分为 Harness activation fence、原 Runtime receipt binding、OperationGrant 三种明确资格，用户提交/取消不伪造 Harness fence                                                                                                                |
| DurableRef                  | resourceId/kind/schemaVersion/byteLength/digest；所有权和访问方式由 authority registry 解析，不接受绝对路径或模型提供的 URL                                                                                                                                                                                                                |
| Event                       | v=1、sequence/eventId、SessionKey、kind、occurredAt；Harness 推进记录必需 ActivationSubject/scopeId/activationId/epoch；turn subject 保留 turnId，hook_operation subject 保留 operationId/occurrenceId；原回执引用原 InvocationBinding；模型外领域维护使用 OperationGrant 审计绑定，不虚构活 activation，payload 按 kind 的封闭 union 校验 |
| Transaction                 | transactionId、commandId/operation/contentDigest、first/lastSequence、eventCount、eventsDigest、previousCommitDigest；commit marker 自含上述摘要与 actor 的非敏感审计来源                                                                                                                                                                  |
| RestoreBundle               | formatVersion、SessionKey、engine、throughSequence、baseProjectionRef、checkpointRef（无检查点时明确 null）、tailPage、pendingCommandsRef、config/definition refs、recoveryStatus                                                                                                                                                          |

订阅 cursor 编码为 `session-events/1` 加 Session 身份、sequence 和 projection revision；由服务端校验，不跨 Session 复用。原 Bridge eventEpoch、整数 eventId、transcript UUID 仍由传输适配映射。所有 optional 字段在类型表中明确允许缺省；其他未知字段拒绝。新命令包含媒体/大历史时引用完整资源，不把模型 `Content` 转纯文本。

## 3. 事件 union 与生产消费链

| kind / payload 必需字段                                                                                                           | 合法生产者                             | 主要消费者与原子要求                                                                                                                                                                                                        |
| --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| input.accepted：inputId/turnId/source/contentRef/deadline/admissionRef                                                            | 普通入口或可信内部适配                 | 队列、Harness、UI；与 wake.requested 同事务；UI 以同 inputId 合并受理与模型消费                                                                                                                                             |
| activation.changed：activationId/epoch/workerId/subject/phase/leaseDurationMs/expiresAt/installRef/boundaryRef                    | coordinator                            | 调度、Runtime gate、恢复；phase=installing/active/released/revoked：installing/active 必需 leaseDurationMs/expiresAt/installRef，前者 boundaryRef=null；released/revoked 必需 boundaryRef，expiresAt 为关闭时值，不准新执行 |
| model.attempt：attemptId/routeRef/inputCheckpointRef/state/usageRef                                                               | 当前 Harness                           | 上下文与用量；state=started/output_committed/abandoned；started 的 usageRef=null，其余无 provider 用量也明确 null；正式输出与调用 ID 映射一起提交                                                                           |
| message.committed：messageId/role/contentRef/modelAttemptId?/parentMessageId                                                      | 当前 Harness或输入投影适配             | 原 user/assistant/tool 内容与 stopReason；保留完整内容 union 和工具批次 ordinal                                                                                                                                             |
| tool.intent：executionCallId/batchId/ordinal/toolDefinitionRef/argsRef/outcomeSource                                              | 当前 Harness                           | 权限和派发；生成无 provider callId 的稳定映射必须先提交，不能等 execute 后补                                                                                                                                                |
| action.changed：requestId/kind/source/inputRevision/optionsRef/state/decisionRef                                                  | Harness 请求；可信仲裁最终决定         | 问答/权限；source 采用客户端专项的 tool_call/automation_run/team_plan/user_operation 分型；state=requested/decided/cancelled/expired；仅 decided 的 decisionRef 必须非空，其余明确 null，不把中间投票记成最终批准           |
| tool.receipt：executionCallId/ToolOutcomeRef/resultRef/resources/historyRevision                                                  | 原 Runtime 结算入口或注册领域/编排适配 | 模型和恢复；来源匹配工具定义，不能用 orchestration 冒充工作区物理成功                                                                                                                                                       |
| checkpoint.committed：checkpointId/coveredSequence/previousCheckpointId/stateRef/boundary                                         | 当前 Harness                           | 恢复；九组字段见 Harness；引用闭包已持久，且覆盖前提仍成立才 ACK                                                                                                                                                            |
| cancel.requested：requestId/target/reason/requestedBy                                                                             | 用户或原生命周期 owner                 | coordinator；原 invocation 取消与最终成功回执仍可分别记录                                                                                                                                                                   |
| turn.settled：turnId/outcome/stopReason/resultRef/usageRef/pendingOwnersRef                                                       | authority 核验 Harness 或恢复结算      | 普通 turn_complete/turn_error、父任务和通知；同 turn 仅一个正式终态；工作完成与取消请求不混同                                                                                                                               |
| config.bound：revision/previousRevision/bundleRef/rootSnapshotRef；lifecycle.changed：operationId/from/to/reason/pendingOwnersRef | 配置/维护 owner                        | 配置单调 revision；lifecycle to=idle/active/closing/closed/archived/deleting/deleted/recovery_blocked，原状态按操作矩阵验证；未决 binding 保留受限结算，封闭后不能接新输入                                                  |
| wake.requested：wakeId/reason/subject/sourceEventId/requiredSequence                                                              | authority 事务内部                     | 可重建调度索引；重复投递不重复创建领域输入                                                                                                                                                                                  |
| domain.committed：domain/version/operationId/recordRef                                                                            | 注册领域适配                           | Goal/Todo、自动任务、子任务接受、Channels交付、历史操作等；domain 限定为本轮专项列出的类型（见各专项注册表），recordRef 有独立 schemaVersion；领域原始 payload 不展开成顶层任意事件，禁止任意 append                        |

追加、create、配置、维护、审批、activation 与领域命令全经过相同单 writer 条件提交。注册领域调用没有独立的第二个 Session 写入口。跨 Session 的父子事务使用持久 outbox 和接收去重，不能声称跨文件原子提交。

生命周期合法转换：create→idle；已受理输入使 idle→active；所有 turn 已终态且无运行队列使 active→idle；idle/active/recovery_blocked→closing，实际自有工作排空后 closing→closed；closed↔archived（unarchive 回 closed，不自动跑模型）；closed/archived→deleting→deleted。故障可使非 deleted 状态进入 recovery_blocked 并保存 intendedState，核验后恢复该合法阶段；有未知物理 owner 时不能 closing→closed 或 deleting→deleted。模型等待由 turn/checkpoint 表达，不改 lifecycle 为 closed。

## 4. 成功提交、损坏与重启

1. 在写入队列内验证 actor、scope、schema、幂等键、fence、sequence、容量和引用闭包。相同 operation+commandId 的原成功只返回原 receipt；业务内容不同报 conflict；未成功的 sequence 冲突可以重新读后提交同业务内容。
2. 大资源先写受控临时文件，流式算 hash，完成文件同步后原子发布并同步所属目录，再允许事务引用。失败不发 ACK；临时孤儿只由自身 owner 回收。
3. 连续追加 event records，再追加 commit marker。初版沿用现有 writer 的逐行 sync，不另实现未经证明的批处理提速；单 authority 队列保证不穿插其他事务。header/首次目录创建及必要改名同步父目录。
4. 仅 marker 与全部事件/资源核对并完成同步后提升可见 committedSequence、投影和 ACK。现有 writer 的 strict append 已有文件 sync；新保证主要是多记录事务可见性、引用闭包与全部关键生产者等待，不能将其误写成原 writer 完全没有 sync。
5. ACK 丢失按原 commandId 找 marker；写失败停止新推进。完整已落盘 marker 可在恢复核验后确认，半行/无 marker 不构成受理或终态。
6. 读取完整已提交前缀，不把损坏中段或未知已提交 kind 跳过继续执行。尾部不完整事务只在独占 writer 下、确认没有 marker 且有完整前缀证明时截断；保留坏尾诊断副本。只读 owner/兼容探测不能触发修复。
7. 不完整输入未 ACK 可由原 ID 重试；已经允许物理操作但回执未提交时，恢复查原执行账本，不能根据 Session 尾部缺失推导未执行。

Node 的 filehandle.sync 是文件同步操作；目录、文件系统和硬件的保证仍须按部署 profile 验证，不能宣称覆盖任意断电设备。[Node.js 22 文件 API](https://nodejs.org/docs/latest-v22.x/api/fs.html#filehandlesync)

## 5. 首版固定限额与兼容路径

下表的新值是本次设计决策，不是当前已生效配置；旧值来自上述源码基线。数值按编码后 UTF-8 bytes 计，媒体资源按原始 bytes 另计。新私有能力双方在握手公布 limits version=1，双方取较小值；低于一次最小合法 envelope 时拒绝安装。

| 项目                             | v1 选择                                                                                               | 超限/兼容行为                                                                                       |
| -------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Session control 单请求/响应      | 8 MiB，JSON 深度 64；最多 256 个事件/命令项                                                           | 大内容换 DurableRef/分页；不能截断后 ACK；旧公开 API 的既有输入额度不因内部变小而减少               |
| 单 event / commit marker         | event 1 MiB，marker 64 KiB；单事务最多 256 event/8 MiB                                                | 超长正式内容先存资源；不可拆开的业务事务超过上限则拒绝，无部分可见                                  |
| readEvents                       | 默认 100、最大 256 项，单页 8 MiB                                                                     | 下一 cursor 精确覆盖已返回位置；单事件引用已符合 1 MiB；持续订阅慢消费者断连后可续读                |
| blob/chunk                       | 每片原始 1 MiB；描述清单页 256 项/1 MiB；资源流式 hash                                                | base64 膨胀计入传输；不限制合法历史总长度为单帧大小；总准入沿原附件/工具/备份限制和下面存储保留规则 |
| Runtime v2 input                 | 保持 256 KiB / 深度 64                                                                                | envelope 不扩大参数权限；大文本仍遵守原工具 API；另有原生资源输入工具才可引用                       |
| Runtime manifest/control/history | 1 MiB / 64 KiB / 8 MiB                                                                                | history 增强协议分页/增量，旧 v2 单次限额不改；新增控制证明用 refs 避免塞满 manifest                |
| Runtime result/media/progress    | 普通 8 MiB；媒体沿现有 64 MiB 减 64 KiB 包络；进度 1 MiB 环                                           | 正式结果超 native/传输上限准确报错，原物理结果保留；新持久资源路径由相应能力协商启用                |
| 普通 Bridge 配额                 | 复用有效 maxSessions；默认 32，pending prompts 默认 5，mid-turn 20，queued inline attachments 100 MiB | legacy/Managed 共用已有配额与同步准入；不把“持久输入”变成无上限排队                                 |
| Session activation               | 一个推进者，lease 60s，每 20s 续租；控制 RPC 10s 截止                                                 | 续租失败封新工作；查询重试用原 ID；10s 不是工具执行或物理取消 deadline                              |
| 错误详情                         | code 128、message 4096 UTF-8 bytes，附最多 16 个结构化引用                                            | 不含环境/密钥/任意文件；外部旧错误时机与字段经适配保留                                              |

容量拒绝发生于 input ACK 前。已提交输入不因投影队列暂满消失：authority 保留 wake，并暂停新的 admission。存储不新增用户历史自动过期；新输入/资源分配先核对该作用域的实际磁盘预算，至少保留 64 MiB 结算空间（与 workspace 共用一次，不按每 Session 重复预留）。空间不足停止新增工作，已准入回执使用保留空间；若仍耗尽，明确 storage_unavailable 并保留原副本，不能提前 release。管理员已有更严格磁盘额度优先，无法满足预留的部署不启用 Managed 写能力。

## 6. 迁移与实现接缝

新建 Managed 在 create 前协商 writer schema/Session reader/Runtime 控制能力。旧 legacy 从不原地改 engine；旧实验目录只提供显式位置适配，不按端口变化重新分配普通历史。已存在 managed 旧格式在无执行和独占 writer 下可升级记录容器，先记录 plan/proof，再安装 schema 3、header 与迁移完成事务；旧文件前缀保持字节一致。失败停在可核验阶段，不“修复”为 legacy。

需同时改造 Core ChatRecord union/reader、SessionWriterLease schema/认证交接、ChatRecordingService 的 Managed sink，CLI authority/client/coordinator，所有生产正式记录的 ACP Session/LlmChat/Goal/文件历史适配，目录/历史/SDK投影。使用目录版本升级不意味着重写整个 Session 类。Schema/validator 源码随实现进入 Core；本表和各领域表为字段规范，不把“文档存在”记作编译验证。

## 7. 存储与协议验收

| 编号 | 操作与通过条件                                                                                                    |
| ---- | ----------------------------------------------------------------------------------------------------------------- |
| S01  | 每个事件/marker/资源同步前后杀自有进程；读取只见完整事务，原 commandId 可查询，不重复正式内容                     |
| S02  | schema 2 二进制尝试打开 active/closed Managed schema 3；拒绝写入，原 transcript/lock 字节不变                     |
| S03  | 1 MiB/8 MiB/256 项/深度 64 的边界与 UTF-8/base64 膨胀；恰好边界合法，超限准确失败，旧合法大输入通过 refs 完整恢复 |
| S04  | 慢订阅、投影丢失、分页中断；从 authority sequence 补齐，不启动 Harness、不重复终态                                |
| S05  | 磁盘不足、writer 丢失、坏中段、半尾、跨 scope ref；封新推进，保留未决原调用，探测保持只读                         |
| S06  | 原用户前缀/父子链/压缩/Goal/artifact/通知/用量/文件历史恢复对照；展示容错与执行严格检查各自保持                   |
