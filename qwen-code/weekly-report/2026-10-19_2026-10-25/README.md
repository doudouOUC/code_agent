# qwen-code PRs · 2026-10-19 ~ 2026-10-25 (W43 日更至 10-20)

> 本文件收录北京时间 2026-10-19 至 10-20 创建的 @doudouOUC 个人 PR，UTC 半开窗口 `[2026-10-18T16:00:00Z, 2026-10-20T16:00:00Z)`，后续日更在本创建周累积。快照取北京时间 2026-10-21，主干 `6e6598e35c3c`。只按 author/createdAt，不因更新、关闭或合入时间补收；W42 后续合入条目仍归 W42，不计本周新增。merged 记录最终实现、closed 未合入只保留历史观察；PR 规模逐项累加且包含 rename/stacked 依赖，不是去重后的主干增量。本次仅文档核验，未运行源码或环境门禁。

**主题**: Skills/MCP、wake 与取消/cleanup 恢复、工具详情与媒体保留、8 MiB 附件/文件引用、CSI 应用与空闲常驻退役、日志压缩/查询和 Java/CI 边界；节点安装方案关闭未合入

**PR 统计**: 23 PRs - 22 merged / 0 open / 1 closed
**当前已合并 PR 代码量**: +42,265 / -6,483，1171 个文件变更
**全量代码量**: +47,995 / -6,576，1207 个文件变更
**类型分布**: feat ×9, fix ×8, refactor ×2, docs ×1, test ×2, perf ×1
**范围 (scope)**: managed-agent ×14, hosted ×1, runtime ×5, core ×2, ci ×1

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 代码量 | 文件数 | 创建时间(UTC) | 合并/关闭时间(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#14602](https://github.com/QwenLM/qwen-code/pull/14602) | ✅ merged | @doudouOUC | feat(managed-agent): connect the composer to pinned Skills | +945/-50 | 27 | 10-18 17:19 | 10-19 02:29 |
| [#14603](https://github.com/QwenLM/qwen-code/pull/14603) | ✅ merged | @doudouOUC | fix(managed-agent): recover committed wakes after writer loss | +2312/-244 | 41 | 10-18 17:26 | 10-19 05:33 |
| [#14604](https://github.com/QwenLM/qwen-code/pull/14604) | ✅ merged | @doudouOUC | fix(managed-agent): load saved tool details on expansion | +2361/-111 | 36 | 10-18 17:36 | 10-19 09:26 |
| [#14628](https://github.com/QwenLM/qwen-code/pull/14628) | ✅ merged | @doudouOUC | feat(managed-agent): raise attachment input budget to 8 MiB | +805/-110 | 39 | 10-19 00:29 | 10-19 06:43 |
| [#14639](https://github.com/QwenLM/qwen-code/pull/14639) | ✅ merged | @doudouOUC | feat(managed-agent): support local and SSH workspace file references | +3045/-68 | 39 | 10-19 02:34 | 10-19 05:11 |
| [#14679](https://github.com/QwenLM/qwen-code/pull/14679) | ✅ merged | @doudouOUC | fix(hosted): continue recovered background wake turns | +695/-10 | 11 | 10-19 07:40 | 10-19 08:31 |
| [#14695](https://github.com/QwenLM/qwen-code/pull/14695) | ✅ merged | @doudouOUC | feat(runtime): complete private CSI cold recovery | +2701/-128 | 24 | 10-19 10:10 | 10-19 12:11 |
| [#14698](https://github.com/QwenLM/qwen-code/pull/14698) | ✅ merged | @doudouOUC | feat(runtime): add original CSI application retirement | +14224/-565 | 90 | 10-19 10:33 | 10-19 16:37 |
| [#14704](https://github.com/QwenLM/qwen-code/pull/14704) | ✅ merged | @doudouOUC | fix(managed-agent): Align image attachment formats with Qwen Code | +239/-27 | 10 | 10-19 11:05 | 10-19 12:48 |
| [#14710](https://github.com/QwenLM/qwen-code/pull/14710) | ✅ merged | @doudouOUC | refactor(managed-agent): organize server packages by responsibility | +5306/-4296 | 676 | 10-19 11:20 | 10-19 14:16 |
| [#14758](https://github.com/QwenLM/qwen-code/pull/14758) | ✅ merged | @doudouOUC | docs(runtime): simplify CSI delivery around resident Workspaces | +235/-47 | 4 | 10-19 17:49 | 10-20 03:47 |
| [#14760](https://github.com/QwenLM/qwen-code/pull/14760) | ✅ merged | @doudouOUC | fix(core): Compact managed activation and inbox journals | +1174/-298 | 8 | 10-19 17:55 | 10-20 01:09 |
| [#14761](https://github.com/QwenLM/qwen-code/pull/14761) | 🔴 closed | @doudouOUC | feat(runtime): add K2 offline installation and cold bootstrap | +5730/-93 | 36 | 10-19 17:58 | 10-20 03:47 |
| [#14762](https://github.com/QwenLM/qwen-code/pull/14762) | ✅ merged | @doudouOUC | test(managed-agent): Verify MCP retention through Session retirement | +301/-0 | 5 | 10-19 18:01 | 10-20 03:36 |
| [#14763](https://github.com/QwenLM/qwen-code/pull/14763) | ✅ merged | @doudouOUC | fix(managed-agent): Reconcile parked Turn cancels from durable results | +445/-9 | 7 | 10-19 18:08 | 10-20 01:10 |
| [#14764](https://github.com/QwenLM/qwen-code/pull/14764) | ✅ merged | @doudouOUC | fix(managed-agent): Preserve original owners for owed Hosted cleanup | +756/-44 | 24 | 10-19 18:21 | 10-20 04:25 |
| [#14765](https://github.com/QwenLM/qwen-code/pull/14765) | ✅ merged | @doudouOUC | feat(runtime): add explicit idle resident Workspace retirement | +2282/-116 | 26 | 10-19 18:26 | 10-20 17:17 |
| [#14766](https://github.com/QwenLM/qwen-code/pull/14766) | ✅ merged | @doudouOUC | test(managed-agent): Verify private media retention boundaries | +613/-2 | 6 | 10-19 18:32 | 10-20 01:24 |
| [#14767](https://github.com/QwenLM/qwen-code/pull/14767) | ✅ merged | @doudouOUC | perf(core): Index managed Session history reads | +478/-12 | 4 | 10-19 18:37 | 10-20 01:23 |
| [#14816](https://github.com/QwenLM/qwen-code/pull/14816) | ✅ merged | @doudouOUC | refactor(managed-agent): simplify the event transport package | +160/-182 | 8 | 10-20 01:05 | 10-20 02:18 |
| [#14875](https://github.com/QwenLM/qwen-code/pull/14875) | ✅ merged | @doudouOUC | fix(ci): isolate hosted MySQL integration test classes | +476/-16 | 11 | 10-20 08:47 | 10-20 23:33 |
| [#14916](https://github.com/QwenLM/qwen-code/pull/14916) | ✅ merged | @doudouOUC | feat(managed-agent): expose session MCP catalog in WebShell | +924/-21 | 24 | 10-20 14:33 | 10-20 17:09 |
| [#14920](https://github.com/QwenLM/qwen-code/pull/14920) | ✅ merged | @doudouOUC | feat(managed-agent): Support approval changes during a turn | +1788/-127 | 51 | 10-20 14:56 | 10-20 23:28 |

---

## PR 解决问题、实现方式与 feature 处理

| PR | 解决了什么问题 | 最终怎么实现（open/closed 只登记当前观察） | 对应 feature 文档 |
|---|---|---|---|
| [#14602](https://github.com/QwenLM/qwen-code/pull/14602) | Managed 输入框没有已发布 Skill 列表，用户输入 /skill 也不能保证先加载原定义中的指令。 | 已合入：可读会话按 pinned definition 返回目录；首轮解析前导 /skill，经原工具 Turn 加载后再调用模型，恢复不重新加载。 | 更新客户端与事件及总览；完整实现见 [implementations/pr-14602.md](implementations/pr-14602.md)。 |
| [#14603](https://github.com/QwenLM/qwen-code/pull/14603) | wake 已提交或 MQ notice 已认领后 writer 退出，源 relay 不再重复通知，导致持久输入长期无人消费。 | 已合入：V11 为 head 增加提示/退避索引，独立扫描失租的公共 Session，验证完整 journal 前缀后被动重接；保留原工具恢复。 | 更新恢复与运维、存储与事件及总览；完整实现见 [implementations/pr-14603.md](implementations/pr-14603.md)。 |
| [#14604](https://github.com/QwenLM/qwen-code/pull/14604) | 公开投影只保留工具摘要，刷新后展开 Read/Shell 缺参数或输出，空展示被误解为执行没有输出。 | 已合入：按 item/Session 授权，从原 journal/resource 有界回读 Read/Shell 详情，展开才请求，按版本隔离迟到结果。 | 更新客户端与事件、完整工具结果及总览；完整实现见 [implementations/pr-14604.md](implementations/pr-14604.md)。 |
| [#14628](https://github.com/QwenLM/qwen-code/pull/14628) | 48 KiB 的附件输入预算容不下常见截图；只改上传校验会在持久化、模型请求、恢复或浏览器 pending 存储处再次失败。 | 已合入：分 kind 同步输入/模型请求/快照预算，并仅为 commit DTO 放宽 JSON；大 pending 写 IndexedDB 后保留原重试键。 | 更新客户端与事件、存储与事件、SDK及总览；完整实现见 [implementations/pr-14628.md](implementations/pr-14628.md)。 |
| [#14639](https://github.com/QwenLM/qwen-code/pull/14639) | Managed 输入框不能安全选择工作区文件，直接读取宿主路径或仅保存路径会跨 Workspace，并在切换/重试时读到不同内容。 | 已合入：按原 actor/context revision 查询与读取 LOCAL/SSH_LOCAL 文本快照，提交前重验 scope 和摘要，将所选原字节转为附件。 | 更新客户端与事件及总览；完整实现见 [implementations/pr-14639.md](implementations/pr-14639.md)。 |
| [#14679](https://github.com/QwenLM/qwen-code/pull/14679) | monitor/child/workflow wake 崩溃后只结算旧 attempt，会把通知消费掉而没有后续模型处理；简单重放原输入又可能重复副作用。 | 已合入：先持久提交确定键的后继 continuation，再结算旧 Turn；重读原通知与恢复结果，保留 child 消费归属。 | 更新恢复与运维及总览；完整实现见 [implementations/pr-14679.md](implementations/pr-14679.md)。 |
| [#14695](https://github.com/QwenLM/qwen-code/pull/14695) | 旧冷恢复只接收已完整落入 Session 的 receipt，Broker 已有终态却丢 receipt，或最终 assistant 已提交但未消费时仍无法继续。 | 已合入：在原已安装恢复 owner 下读完整 SETTLED 批次，补原 receipt；严格证明已提交最终输出后直接消费，不重跑模型或工具。 | 更新恢复与运维、JDBC 中文、JDBC English及总览；完整实现见 [implementations/pr-14695.md](implementations/pr-14695.md)。 |
| [#14698](https://github.com/QwenLM/qwen-code/pull/14698) | 现有物理退役 seal 不能证明 SQL 应用、原 worker 文件历史和所有资源已闭合；提前清理会失去恢复证据或误释放原挂载。 | 已合入：V12 和 boot6 增加 SETTLING→FROZEN→CUT→DRAINED，原库存/worker 观察及保存的 CUT 共同约束 finalize。 | 更新恢复与运维、存储与事件、JDBC 中文、JDBC English及总览；完整实现见 [implementations/pr-14698.md](implementations/pr-14698.md)。 |
| [#14704](https://github.com/QwenLM/qwen-code/pull/14704) | 普通 Qwen Code 接受的 GIF 和 image/jpg 在 Managed 输入中被拒绝，或重载后 MIME 不一致，破坏同一附件的规范化请求。 | 已合入：三端新增 GIF87a/GIF89a 校验并将 image/jpg 规范为 image/jpeg，保留整体预算、签名和 canonical base64 检查。 | 更新客户端与事件、SDK及总览；完整实现见 [implementations/pr-14704.md](implementations/pr-14704.md)。 |
| [#14710](https://github.com/QwenLM/qwen-code/pull/14710) | 单一应用中的 service/store 混入多种职责，业务与持久化反向依赖 HTTP api，Broker 供应器和传输协议也难区分。 | 已合入：在同一个 Maven/部署内拆分职责包，共享 SQL 聚合留 persistence，模型/异常离开 api，更新跨包访问和启动入口。 | 更新存储与事件、JDBC 中文、JDBC English、SDK及总览；完整实现见 [implementations/pr-14710.md](implementations/pr-14710.md)。 |
| [#14758](https://github.com/QwenLM/qwen-code/pull/14758) | 旧节点证据候选把首版常驻文件路径与自定义节点安装、冷启动和物理释放混在一起，容易把已有运行能力、文档决策与未完成平台验收等同。 | 已合入：最终 diff 只有两组中英设计/部署说明，撤出节点证据代码；公开 Read/Write/Edit 与逻辑 Session 交接来自已有 #14340，不由本 PR 新增。固定管理员/Kubernetes/宿主/合资格 CSI 驱动的信任边界，限定 ACK Disk CSI、RWOP、Filesystem/ext4 及原磁盘 serial/Pod/container/mount/registration/reservation 身份。 | 增量更新 恢复与运维、JDBC 中文、JDBC English及总览；完整实现见 [implementations/pr-14758.md](implementations/pr-14758.md)。 |
| [#14760](https://github.com/QwenLM/qwen-code/pull/14760) | activation/inbox 每次状态转换都追加日志，长会话即使有效状态没有相应增长，磁盘和重开解析成本仍不断累积。 | 已合入：在下一次持久写入前，当 snapshot 之后的增量达到 max(64 KiB, snapshot 大小) 时，把完整有效状态编码为 v2 snapshot，保留 nextSequence、原排序、activation epoch/lease、消息 payload/fence/取消/终态和幂等身份，再继续原 v1 追加。重开仅允许第一条为快照，校验版本、SHA-256、顺序、状态与引用；旧 v1 完整日志仍可读。 | 增量更新 存储与事件、恢复与运维及总览；完整实现见 [implementations/pr-14760.md](implementations/pr-14760.md)。 |
| [#14761](https://github.com/QwenLM/qwen-code/pull/14761) | 原节点证据分支只有严格的安装字节读取契约，没有闭合的离线制品生产和 PID1 交接工具；该方案依赖的节点证据候选后来撤回。 | 关闭未合入：关闭前 diff stacked 于 codex/csi-node-evidence-creation，而非 main：Python 校验固定 Node22 OCI base/层摘要与预构建 bundle，输出未发布候选；profile/compile/安装图与 initrd 工具绑定明确输入并拒绝额外、缺失或变化的字节。 | 增量更新 恢复与运维、JDBC 中文、JDBC English及总览；完整关闭方案见 [implementations/pr-14761.md](implementations/pr-14761.md)。 |
| [#14762](https://github.com/QwenLM/qwen-code/pull/14762) | 释放 MCP 连接与删除 Session 数据是不同生命周期；缺少贯穿 catalog/参数/结果资源的验证时，容易误以为断开连接可以回收仍被历史或恢复引用的字节。 | 已合入：最终 diff 只增加测试和双语说明。测试经真实 ExtensionRecordJournal/ManagedSessionStore 提交配置与 resource_read/prompt_get 的 intent、dispatch、settled 记录；缺 catalog/response 原子拒绝，重开后核对完整记录及 blob/text 结果。连接 releasing→drained→released 不删除记录资源。 | 增量更新 存储与事件、完整工具结果、完整工具结果 English及总览；完整实现见 [implementations/pr-14762.md](implementations/pr-14762.md)。 |
| [#14763](https://github.com/QwenLM/qwen-code/pull/14763) | 取消已停放为 recovery_blocked/cancel_unconfirmed 后不能重发，但原 Turn 可能后来写入确定终态；没有只读证据对账会永久显示未知，或误把已请求停止当成已取消。 | 已合入：将 CANCEL 纳入 acceptance-unknown 只读对账集合。CancelEvidence 只接受原 operation/target_key/Turn/prompt 和 tenant/Workspace/Session，按保存 head revision 逆序逐条有界读取 settleTurn transaction，验证 encoding/长度/SHA-256 后匹配原 eventId 和 turn.settled payload。 | 增量更新 恢复与运维、客户端与事件及总览；完整实现见 [implementations/pr-14763.md](implementations/pr-14763.md)。 |
| [#14764](https://github.com/QwenLM/qwen-code/pull/14764) | Session 已关闭或活动 holder 消失后，Hosted cleanup 仍可能 owed/blocked；只看活执行会过早回收原 Runtime 或清掉完成 cleanup 必需的描述符。 | 已合入：V13 给 ma_session_head 加 cleanup_head_revision，ma_resource_ref 增 runtime_binding_key 和 HOSTED_CLEANUP owner/索引。提交已验证 hosted.cleanup 时，在同事务为原 descriptorRef、binding/generation 保存引用；只有相同 cleanupId 与原身份的 confirmed 才删除，身份变化拒绝。 | 增量更新 存储与事件、恢复与运维、JDBC 中文、JDBC English、完整工具结果、完整工具结果 English及总览；完整实现见 [implementations/pr-14764.md](implementations/pr-14764.md)。 |
| [#14765](https://github.com/QwenLM/qwen-code/pull/14765) | Session 逻辑关闭要保留共享常驻 worker，平台却缺少显式禁止新准入并审计原 Pod 删除请求的维护入口；沿用私有 Session-isolated DRAINED 或节点证据提案会误用权限。 | 已合入：最终重设计不依赖撤回的节点证据。V14 复用 ma_operation/work 加 WORKSPACE_RETIREMENT/POD_DELETE_ATTEMPT；仅 trusted administrator CLI inspect/begin/delete-pod，不开公共路由或后台自动 GC。begin 需当前配置/registration/protection、OWNER、原 READY shared binding/slot/CSI RESERVED owner，且无未完成公共 Session、活 writer、未释放 Runtime Session 或未 SETTLED 工具；在既有租户级互斥与 Workspace/绑定行锁内原子保存计划、Workspace DRAINING 和 binding seal。 | 增量更新 恢复与运维、存储与事件、JDBC 中文、JDBC English及总览；完整实现见 [implementations/pr-14765.md](implementations/pr-14765.md)。 |
| [#14766](https://github.com/QwenLM/qwen-code/pull/14766) | 原生工具返回媒体时，完整 functionResponse/history/checkpoint 可能引用相同摘要的资源；需要证明退役 GC 不会误删另一 Session 的同字节结果，或破坏 reader/recovery 引用。 | 已合入：最终 diff 无生产逻辑变更。Node generator 使用实际 Core authority/sink 与 HostedWorkspaceToolTurn 产生 inlineData outcome、工具历史、checkpoint/ref 闭包，仅替换外部 Broker 返回；Java 通过真实 ManagedSessionStore 提交并比对原字节，损坏资源必须拒绝。 | 增量更新 存储与事件、完整工具结果、完整工具结果 English及总览；完整实现见 [implementations/pr-14766.md](implementations/pr-14766.md)。 |
| [#14767](https://github.com/QwenLM/qwen-code/pull/14767) | 每次查最后某类事件、分页或区间都从完整 events 扫描，长会话的重复读取产生额外线性成本。 | 已合入：在重开和持久 commit 后统一 indexCommittedEvent，维护 latestByKind，同时保留原 first tool.receipt 索引。latest 查询变 Map；区间按经过验证的从 1 连续 sequence 做 ceil/floor 到 slice 下标，分页从 after 对应下标读取，保持原边界与结果顺序。 | 增量更新 存储与事件及总览；完整实现见 [implementations/pr-14767.md](implementations/pr-14767.md)。 |
| [#14816](https://github.com/QwenLM/qwen-code/pull/14816) | 事件消费者、公有分发与 wake 各自重复维护线程池和关闭行为，canonical JSON 递归构建中间字符串；维护时容易让协议校验和资源边界漂移。 | 已合入：复用 TransportExecutors 的固定线程/有界队列/AbortPolicy 和两秒关闭等待，保留各角色容量及拒绝后 SQL 恢复。WakeFence.open 与 wake kind 归一，不改变 ACTIVE Session/ACTIVE-or-SEALED head 与持久水位门槛。 | 增量更新 存储与事件及总览；完整实现见 [implementations/pr-14816.md](implementations/pr-14816.md)。 |
| [#14875](https://github.com/QwenLM/qwen-code/pull/14875) | Hosted IT 在同一 fork 中共享 MySQL，前一个类留下 ma_* 行会让后续用例读到外来身份/状态并产生不稳定故障。 | 已合入：仅 hosted-harness-mysql 的 Failsafe 配置启用 JUnit extension 自动发现和 qwen.hosted.mysql.isolation，单 fork、禁并行。BeforeAll 只处理顶层类，强制 disposable mysql.url/user、校验 application catalog，再在同一连接暂关 FK、TRUNCATE 全部 ma_* 基表并 finally 恢复；不删除 Flyway history/表结构或其它表。 | 增量更新 恢复与运维、存储与事件及总览；完整实现见 [implementations/pr-14875.md](implementations/pr-14875.md)。 |
| [#14916](https://github.com/QwenLM/qwen-code/pull/14916) | Managed 输入框无 Session MCP 菜单，用户看不到持久 catalog 的服务与发现状态；直接复用 daemon 目录又可能跨服务端或 Session 读到别的配置。 | 已合入：新增 WebShell POST session-mcp/query，强制当前 actor，复用可读 Session 的 ManagedMcpCatalogService 与持久 mcp_configuration/catalogRef，而非现场发现。结果展示 tools/resources/prompts 数量及 complete/partial/failed/stale，已释放连接仍按 stale，空状态不冒充连接成功。 | 增量更新 客户端与事件、SDK及总览；完整实现见 [implementations/pr-14916.md](implementations/pr-14916.md)。 |
| [#14920](https://github.com/QwenLM/qwen-code/pull/14920) | 运行中或等待审批时只能先结束 Turn 才能改 default/auto-edit/yolo，且简单读取 mutable Session 模式会改变原 Hook/恢复的审计证据。 | 已合入：只有同时支持 approval-selection/1 与 live-approval-selection/1 的公开 bound files/1、shell/1、shell/2 可运行中改模式；原 owner/OPERATOR、expected revision、幂等 receipt 和 SQL 锁保留。Plan 切换及模型切换仍要求空闲；关闭、取消、恢复阻塞和冲突 operation 拒绝。用户 Turn 的原审批/Plan 快照不重写。 | 增量更新 客户端与事件、恢复与运维、存储与事件、SDK及总览；完整实现见 [implementations/pr-14920.md](implementations/pr-14920.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [Feature 总览](../../feature/README.md) | #14602(merged), #14603(merged), #14604(merged), #14628(merged), #14639(merged), #14679(merged), #14695(merged), #14698(merged), #14704(merged), #14710(merged), #14758(merged), #14760(merged), #14761(closed), #14762(merged), #14763(merged), #14764(merged), #14765(merged), #14766(merged), #14767(merged), #14816(merged), #14875(merged), #14916(merged), #14920(merged) | 同步最终实现/关闭观察及原验证边界；保留创建周与有效历史方案。 |
| [客户端与事件](../../feature/managed-agents/managed-agent-client-surfaces.md) | #14602(merged), #14604(merged), #14628(merged), #14639(merged), #14695(merged), #14704(merged), #14763(merged), #14916(merged), #14920(merged) | 同步最终实现/关闭观察及原验证边界；保留创建周与有效历史方案。 |
| [Managed Agents](../../feature/managed-agents/README.md) | #14602(merged), #14603(merged), #14604(merged), #14628(merged), #14639(merged), #14679(merged), #14695(merged), #14698(merged), #14704(merged), #14710(merged), #14758(merged), #14760(merged), #14761(closed), #14762(merged), #14763(merged), #14764(merged), #14765(merged), #14766(merged), #14767(merged), #14816(merged), #14875(merged), #14916(merged), #14920(merged) | 同步最终实现/关闭观察及原验证边界；保留创建周与有效历史方案。 |
| [恢复与运维](../../feature/managed-agents/managed-agent-recovery-operations.md) | #14603(merged), #14679(merged), #14695(merged), #14698(merged), #14758(merged), #14760(merged), #14761(closed), #14763(merged), #14764(merged), #14765(merged), #14875(merged), #14920(merged) | 同步最终实现/关闭观察及原验证边界；保留创建周与有效历史方案。 |
| [存储与事件](../../feature/managed-agents/managed-agent-storage-event-architecture.md) | #14603(merged), #14628(merged), #14698(merged), #14710(merged), #14760(merged), #14762(merged), #14764(merged), #14765(merged), #14766(merged), #14767(merged), #14816(merged), #14875(merged), #14920(merged) | 同步最终实现/关闭观察及原验证边界；保留创建周与有效历史方案。 |
| [完整工具结果 English](../../feature/managed-agents/managed-agent-tool-result-artifacts.md) | #14604(merged), #14762(merged), #14764(merged), #14766(merged) | 同步最终实现/关闭观察及原验证边界；保留创建周与有效历史方案。 |
| [完整工具结果](../../feature/managed-agents/managed-agent-tool-result-artifacts.zh-CN.md) | #14604(merged), #14762(merged), #14764(merged), #14766(merged) | 同步最终实现/关闭观察及原验证边界；保留创建周与有效历史方案。 |
| [SDK](../../feature/sdk.md) | #14628(merged), #14704(merged), #14710(merged), #14916(merged), #14920(merged) | 同步最终实现/关闭观察及原验证边界；保留创建周与有效历史方案。 |
| [JDBC 中文](../../feature/managed-agents/managed-runtime-broker-jdbc.zh-CN.md) | #14695(merged), #14698(merged), #14710(merged), #14758(merged), #14761(closed), #14764(merged), #14765(merged) | 同步最终实现/关闭观察及原验证边界；保留创建周与有效历史方案。 |
| [JDBC English](../../feature/managed-agents/managed-runtime-broker-jdbc.md) | #14695(merged), #14698(merged), #14710(merged), #14758(merged), #14761(closed), #14764(merged), #14765(merged) | 同步最终实现/关闭观察及原验证边界；保留创建周与有效历史方案。 |

_按个人 PR 口径更新于 2026-10-21；文档审计不替代源码、浏览器、真实 MySQL/OSS/CSI/SSH/模型及部署验收。_
