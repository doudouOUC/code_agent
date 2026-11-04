# qwen-code PRs · 2026-11-02 ~ 2026-11-08 (W45 日更至 11-04)

> 本文件收录本周截至北京时间 2026-11-04 创建的 @doudouOUC 个人 PR。本次日更窗口为 `[2026-11-03T16:00:00Z, 2026-11-04T16:00:00Z)`，新增 16 个，本周原有 12 个同步复核；只按 createdAt 归周，不按合入/关闭时间补收其他周。快照取北京时间 2026-11-05，主干 `624d10532ab8`。merged 描述最终合入及 main 演进，open 只登记当前 diff，不能作为 main 能力承诺。代码量逐 PR 累加，包含叠加/重叠 diff，不是去重 main 增量；W44 保留周更归档快照。本次未运行源码、CI、规模或真实环境验收。

**主题**: Session-first 与共享 storage 准入、Workspace 读/写分离、cleanup/审批/进程树修复和 Gemini 签名保留已合入；Runtime 容量限制仍 open

**PR 统计**: 28 PRs - 27 merged / 1 open / 0 closed
**当前已合并 PR 代码量**: +33,706 / -17,600，664 个文件变更
**全量代码量**: +34,497 / -17,695，690 个文件变更
**类型分布**: refactor ×5, fix ×10, test ×2, feat ×2, perf ×9
**范围 (scope)**: managed-agent ×25, ci ×1, core ×1, managed ×1

main 已有十三生产 Maven 模块和 verification、唯一 V1/38 业务表。#16090/#16142 保事务 facade 并拆/精简普通协作者；#16139 以原连接执行轨迹和精确清单替代静态控制流解析，仅同源真实事务复用 root/head。#16141 将五种后端变为可选 provider JAR，ServiceLoader 缺选中后端拒绝；#16143 同步 id/is_ 列、业务 UNIQUE、无 FK 与严格 SQL 模式检查，最新 #16288 改逐连接初始化/校验，无旧库升级。#16101 修探针观察拥有者，不改生产取消算法。#16099/#16114/#16134 的 Javadoc、固定原 0.26.5 双补丁和 specialist profile 围栏保留，未由本次重跑或发布。

#16153 创建时冻结并加密完整模型配置，定义/恢复只持摘要，原 writer/lifecycle 私有读取后隔离宿主同名路由；#16205 以物理 owner 成员计数/排他 rewind CAS 缩短共享执行准入，不泛化取消所有 placement 锁。#16212 已以 merge `da42e5714ad0` 允许上传与上传/Runtime 共享成员、按原 receipt 一次结算，未知结果保占用并只查原进程；不提供同路径写隔离。相同 V1/38 表不证明旧 writer 或旧 catalog 可兼容。

最新 main 演进：#16217/#16221 的独立 resident/Harness 检查不拿租户锁；#16223/#16225/#16256/#16268 按 Session/共享存储准入缩小指定写入锁范围，但 rename 初次准入、cleanup、CSI/lifecycle 仍各有围栏。#16275 核原 cleanup binding；#16283/#16312 分离读取与最终 admission；#16288 只核 SESSION 并在内嵌连接初始化严格模式。#16296 修当前审批状态，#16298 先回收 Git 后代，#16270 保工具签名；#16318 仅为当前 open 容量方案。

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 代码量 | 文件数 | 创建时间(UTC) | 合并/关闭时间(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#16090](https://github.com/QwenLM/qwen-code/pull/16090) | ✅ merged | @doudouOUC | refactor(managed-agent): split Agent and Session stores | +14742/-10773 | 86 | 11-01 17:19 | 11-02 12:46 |
| [#16099](https://github.com/QwenLM/qwen-code/pull/16099) | ✅ merged | @doudouOUC | fix(managed-agent): keep javadoc valid after the module split | +2/-1 | 2 | 11-02 02:27 | 11-02 03:42 |
| [#16101](https://github.com/QwenLM/qwen-code/pull/16101) | ✅ merged | @doudouOUC | test(managed-agent): Reconnect Hosted fault probes to execution owners | +170/-15 | 3 | 11-02 03:15 | 11-02 04:43 |
| [#16114](https://github.com/QwenLM/qwen-code/pull/16114) | ✅ merged | @doudouOUC | fix(ci): repair Javadoc for the 0.26.5 managed runtime release | +173/-0 | 3 | 11-02 06:46 | 11-02 09:12 |
| [#16134](https://github.com/QwenLM/qwen-code/pull/16134) | ✅ merged | @doudouOUC | fix(managed-agent): Restore profile-owned runtime verification | +137/-51 | 4 | 11-02 12:01 | 11-02 13:50 |
| [#16139](https://github.com/QwenLM/qwen-code/pull/16139) | ✅ merged | @doudouOUC | refactor(managed-agent): simplify row locking and runtime verification | +1907/-3292 | 25 | 11-02 12:34 | 11-03 03:15 |
| [#16141](https://github.com/QwenLM/qwen-code/pull/16141) | ✅ merged | @doudouOUC | refactor(managed-agent): Make runtime backends optional Maven modules | +3416/-603 | 155 | 11-02 13:08 | 11-03 02:04 |
| [#16142](https://github.com/QwenLM/qwen-code/pull/16142) | ✅ merged | @doudouOUC | refactor(managed-agent): trim store delegation boilerplate | +136/-226 | 17 | 11-02 13:21 | 11-02 16:12 |
| [#16143](https://github.com/QwenLM/qwen-code/pull/16143) | ✅ merged | @doudouOUC | refactor(managed-agent): align shared MySQL schema conventions | +2472/-1765 | 150 | 11-02 13:28 | 11-03 12:00 |
| [#16153](https://github.com/QwenLM/qwen-code/pull/16153) | ✅ merged | @doudouOUC | feat(managed-agent): support full model configuration at session creation | +2406/-96 | 70 | 11-02 16:52 | 11-03 04:23 |
| [#16205](https://github.com/QwenLM/qwen-code/pull/16205) | ✅ merged | @doudouOUC | fix(managed-agent): keep workspace execution off the tenant lock | +1469/-123 | 17 | 11-03 12:21 | 11-03 14:17 |
| [#16212](https://github.com/QwenLM/qwen-code/pull/16212) | ✅ merged | @doudouOUC | feat(managed-agent): allow concurrent workspace uploads | +523/-81 | 10 | 11-03 15:09 | 11-03 16:12 |
| [#16217](https://github.com/QwenLM/qwen-code/pull/16217) | ✅ merged | @doudouOUC | perf(managed-agent): take resident claim off the tenant lock | +196/-8 | 6 | 11-03 16:23 | 11-03 17:06 |
| [#16221](https://github.com/QwenLM/qwen-code/pull/16221) | ✅ merged | @doudouOUC | perf(managed-agent): take harness admission checks off the tenant lock | +216/-7 | 4 | 11-03 17:05 | 11-03 19:02 |
| [#16223](https://github.com/QwenLM/qwen-code/pull/16223) | ✅ merged | @doudouOUC | perf(managed-agent): take turn admission off the tenant lock | +272/-24 | 8 | 11-03 17:13 | 11-03 18:11 |
| [#16225](https://github.com/QwenLM/qwen-code/pull/16225) | ✅ merged | @doudouOUC | perf(managed-agent): take session commands off the tenant lock | +327/-26 | 8 | 11-03 17:26 | 11-04 02:29 |
| [#16229](https://github.com/QwenLM/qwen-code/pull/16229) | ✅ merged | @doudouOUC | perf(managed-agent): reuse local workspace file capability probes | +243/-3 | 4 | 11-03 17:57 | 11-03 21:51 |
| [#16240](https://github.com/QwenLM/qwen-code/pull/16240) | ✅ merged | @doudouOUC | test(managed-agent): refresh concurrent membership snapshot | +4/-1 | 1 | 11-03 19:12 | 11-03 20:43 |
| [#16256](https://github.com/QwenLM/qwen-code/pull/16256) | ✅ merged | @doudouOUC | perf(managed-agent): queue journal commits on the Session row instead of the tenant lock | +512/-76 | 13 | 11-04 00:43 | 11-04 03:14 |
| [#16268](https://github.com/QwenLM/qwen-code/pull/16268) | ✅ merged | @doudouOUC | perf(managed-agent): narrow output, lifecycle, and storage lock scopes | +945/-110 | 21 | 11-04 04:28 | 11-04 05:10 |
| [#16270](https://github.com/QwenLM/qwen-code/pull/16270) | ✅ merged | @doudouOUC | fix(core): preserve Gemini thought signatures for tool replay | +530/-10 | 8 | 11-04 06:02 | 11-04 06:53 |
| [#16275](https://github.com/QwenLM/qwen-code/pull/16275) | ✅ merged | @doudouOUC | fix(managed-agent): reject dangling Hosted cleanup references | +559/-26 | 9 | 11-04 06:24 | 11-04 13:25 |
| [#16283](https://github.com/QwenLM/qwen-code/pull/16283) | ✅ merged | @doudouOUC | perf(managed-agent): separate workspace reads from durable admission | +1003/-89 | 11 | 11-04 07:12 | 11-04 11:32 |
| [#16288](https://github.com/QwenLM/qwen-code/pull/16288) | ✅ merged | @doudouOUC | fix(managed-agent): enforce strict SQL mode per embedded connection | +163/-39 | 8 | 11-04 08:22 | 11-04 09:27 |
| [#16296](https://github.com/QwenLM/qwen-code/pull/16296) | ✅ merged | @doudouOUC | fix(managed-agent): use current state for approval changes | +281/-20 | 5 | 11-04 09:12 | 11-04 10:24 |
| [#16298](https://github.com/QwenLM/qwen-code/pull/16298) | ✅ merged | @doudouOUC | fix(managed): Reap Git descendants before terminating parents | +193/-16 | 6 | 11-04 09:45 | 11-04 11:23 |
| [#16312](https://github.com/QwenLM/qwen-code/pull/16312) | ✅ merged | @doudouOUC | perf(managed-agent): avoid storage locks in read preflight | +709/-119 | 10 | 11-04 12:20 | 11-04 16:13 |
| [#16318](https://github.com/QwenLM/qwen-code/pull/16318) | 🟡 open | @doudouOUC | fix(managed-agent): bound runtime concurrency and improve error handling | +791/-95 | 26 | 11-04 14:27 | — |

---

## PR 解决问题、实现方式与 feature 处理

| PR | 解决了什么问题 | 最终怎么实现（open/closed 只登记当前观察） | 对应 feature 文档 |
|---|---|---|---|
| [#16090](https://github.com/QwenLM/qwen-code/pull/16090) | 大 Store 的职责/依赖与锁序难局部核验，直接迁入口会改变事务。 | 已合入：保 facade/原事务属性，十 Agent/八 Journal 包内 final 无环协作者；原资源/journal/head 同事务和 afterCommit 保留，Session 依赖完整构造、CSI 只认同源 JDBC。 | 更新总览、Managed、Session 存储/兼容、存储与事件、恢复、JDBC 双语；完整最终实现见 [implementations/pr-16090.md](implementations/pr-16090.md)。 |
| [#16099](https://github.com/QwenLM/qwen-code/pull/16099) | 拆模块后文档类型和小于号导致 Javadoc 解析失败。 | 已合入：仅补 ExternalRuntimeKinds import、转义范围符号，不改数字序列化和 Runtime 能力。 | 更新总览、Managed、恢复及 JDBC 双语的发行边界；完整最终实现见 [implementations/pr-16099.md](implementations/pr-16099.md)。 |
| [#16101](https://github.com/QwenLM/qwen-code/pull/16101) | 探针仍替换 facade 旧字段，无法观察真实执行/取消或拦结算。 | 测试已合入：代理接 dispatcher/cancellation 并同时恢复，status gate 延迟原 execute 结果；计数与原 Broker 状态分别断言，不改生产取消。 | 更新总览、Managed、恢复及 JDBC 双语的验证接线；完整最终实现见 [implementations/pr-16101.md](implementations/pr-16101.md)。 |
| [#16114](https://github.com/QwenLM/qwen-code/pull/16114) | main 文档修复未进入固定原源的 0.26.5 发行。 | 已合入：原版本/产品 SHA、补丁摘要和干净 tracked checkout 围栏，构建前 check/apply 仅 Javadoc 修复；后续 #16134 扩成双补丁。 | 更新总览、Managed、恢复和 JDBC 双语；完整最终实现见 [implementations/pr-16114.md](implementations/pr-16114.md)。 |
| [#16134](https://github.com/QwenLM/qwen-code/pull/16134) | 默认 Failsafe 声明误激活应属 specialist profile 的验证。 | 已合入：共享配置归 pluginManagement，原 profiles/选择器/打包不变；原 0.26.5 源上双补丁共同预检、记录 blob，不代表发行成功。 | 更新总览、Managed、恢复和 JDBC 双语；完整最终实现见 [implementations/pr-16134.md](implementations/pr-16134.md)。 |
| [#16139](https://github.com/QwenLM/qwen-code/pull/16139) | 静态锁解析膨胀且不能证明实际连接，简单删锁又丢围栏。 | 已合入：Session+Turn 成对 helper、同源真实事务下复用已核 root/head；SQL/事务轨迹与精确入口/所有者清单替代静态控制流推断，非全分支证明。 | 更新总览、Managed、Session 存储/兼容、存储与事件、恢复、JDBC 双语；完整最终实现见 [implementations/pr-16139.md](implementations/pr-16139.md)。 |
| [#16141](https://github.com/QwenLM/qwen-code/pull/16141) | 普通 library 强依赖所有 Runtime，配置选择与安装/注册混淆。 | 已合入：十三生产模块、五 provider 可选 runtime JAR，ServiceLoader 只登记，选中缺包/歧义拒绝；SSH 选择与注册独立，原权限/离线维护/失败清理保留。 | 更新总览、Managed、Session 兼容、恢复和 JDBC 双语；完整最终实现见 [implementations/pr-16141.md](implementations/pr-16141.md)。 |
| [#16142](https://github.com/QwenLM/qwen-code/pull/16142) | facade/分片重复默认重载及 ItemRow 中转增加漂移。 | 已合入：公开入口显式传原 null/false 等默认、内部删重复重载，直接映射 ItemRecord/List.copyOf；守卫覆盖合成 stereotype/混合大小写 SQL，不改锁协议。 | 更新总览、Managed、Session 存储/兼容、存储与事件、恢复、JDBC 双语；完整最终实现见 [implementations/pr-16142.md](implementations/pr-16142.md)。 |
| [#16143](https://github.com/QwenLM/qwen-code/pull/16143) | DDL 规范化若漏查询/校验/inventory，会读错列或错误接纳 catalog。 | 已合入：V1/38 表自增 id、原业务 UNIQUE、is_ 标志/idx_/uk_ 与无 FK；同步 SQL/Rows/CSI，校验自增/signedness/前缀/禁止 FK，合入时核全局/当前严格模式，最新 #16288 已改逐连接严格模式，无旧库升级。 | 更新总览、Managed、Session 存储/兼容、存储与事件、恢复、JDBC 双语；完整最终实现见 [implementations/pr-16143.md](implementations/pr-16143.md)。 |
| [#16153](https://github.com/QwenLM/qwen-code/pull/16153) | 只选 modelId 不能为 Session 固定秘密连接，恢复易误用宿主同名配置。 | 已合入：严格完整配置、allowlist/能力准入、同事务加密，receipt 先回读；定义只持摘要、原 writer/lifecycle 私有读取，文本/workflow/Hook/压缩隔离宿主连接，子身份重加密。 | 更新总览、Managed、Session 存储/兼容、恢复、客户端和 SDK；完整最终实现见 [implementations/pr-16153.md](implementations/pr-16153.md)。 |
| [#16205](https://github.com/QwenLM/qwen-code/pull/16205) | 共享执行争 tenant guard/成员范围锁，去锁易漏维护/rewind 围栏。 | 已合入：mount revision 预验、binding share/原 Session 点锁、owner 成员 CAS 与幂等释放；rewind 仅单成员排他，retention 保未释放记录；后续 #16212 再共享上传。 | 更新总览、Managed、Workspace 双语、恢复和 JDBC 双语；完整最终实现见 [implementations/pr-16205.md](implementations/pr-16205.md)。 |
| [#16212](https://github.com/QwenLM/qwen-code/pull/16212) | 上传独占整个目录，未知结果/同 ID 并发又不能丢占用事实。 | 已合入：上传计入共享 member_count、原 mount/alias/actor 围栏；唯一 receipt 仲裁、directory-before-operation 一次结算，未知保成员，不再拿 tenant guard；不证明同路径写隔离。 | 更新总览、Managed、客户端、Workspace 双语、恢复和 JDBC 双语；完整最终实现见 [implementations/pr-16212.md](implementations/pr-16212.md)。 |
| [#16217](https://github.com/QwenLM/qwen-code/pull/16217) | Resident Workspace 的 claim/release 分支只核验既有绑定，却先获取租户 placement guard；同租户其他资源维护因此会拖住原本只读的调用。删除整个生命周期围栏又会错误接纳已清空或不同身份的 Runtime。 | 已合入：Resident 只读 claim/release 不再获取 tenant guard；原 slot/Runtime 身份和释放状态仍核验。 | 更新总览、Managed、Workspace 中文、Workspace English、恢复、JDBC English、JDBC 中文；完整最终实现见 [implementations/pr-16217.md](implementations/pr-16217.md)。 |
| [#16221](https://github.com/QwenLM/qwen-code/pull/16221) | 每次工具派发前的独立 Harness admission、Hook、recovery 和 cleanup 检查先等待租户 placement guard，即使检查只读或该 scope 不受 Harness 管理，也被同租户写入串行化。 | 已合入：七个独立检查不拿 tenant guard；最新 main 对 lifecycle authority 的 claim mirror 保当前共享锁。 | 更新总览、Managed、恢复、JDBC English、JDBC 中文；完整最终实现见 [implementations/pr-16221.md](implementations/pr-16221.md)。 |
| [#16223](https://github.com/QwenLM/qwen-code/pull/16223) | 每个新 Turn 为串行化迁移而先等租户锁，导致不相干 Session 互相阻塞。若直接删锁，迁移事务可能在旧 REPEATABLE READ 快照中漏掉刚提交的 Turn，错误认定目录空闲。 | 已合入：Turn 受理先锁 Session；迁移锁住原 alias 后另读 committed idle，避免旧快照漏掉新工作。 | 更新总览、Managed、Session 存储、恢复、JDBC English、JDBC 中文；完整最终实现见 [implementations/pr-16223.md](implementations/pr-16223.md)。 |
| [#16225](https://github.com/QwenLM/qwen-code/pull/16225) | 模型、审批、扩展管理、压缩及重命名后续阶段等 Session 级操作争同一租户锁；缺失 receipt 上的锁定读还会把不相干 Session 放进共享索引 gap，造成插入死锁。 | 已合入：指定 Session 命令按原 Session 串行，receipt 唯一键仲裁；rename 初次准入仍保 tenant guard。 | 更新总览、Managed、Session 存储、客户端、恢复、JDBC English、JDBC 中文；完整最终实现见 [implementations/pr-16225.md](implementations/pr-16225.md)。 |
| [#16229](https://github.com/QwenLM/qwen-code/pull/16229) | 每次本地 Workspace read/upload 都启动一次 CLI --help 子进程，重复支付能力握手开销；只按路径缓存又可能在 CLI 或 Node 被替换后误认能力。 | 已合入：成功 help 按 Node/CLI 文件身份缓存；读写能力分开验证，每次实际操作仍执行。 | 更新总览、Managed、Workspace 中文、Workspace English、客户端；完整最终实现见 [implementations/pr-16229.md](implementations/pr-16229.md)。 |
| [#16240](https://github.com/QwenLM/qwen-code/pull/16240) | HostedWorkspaceConcurrencyIT 在第二 Runtime 加入后继续使用单成员旧快照，无法正确断言共享 owner 在各次释放中的 member_count。 | 已合入：测试重读第二成员加入后的 owner，断言 2→1→0；无生产逻辑变化。 | 更新总览、Managed、Workspace 中文、Workspace English、恢复、JDBC English、JDBC 中文；完整最终实现见 [implementations/pr-16240.md](implementations/pr-16240.md)。 |
| [#16256](https://github.com/QwenLM/qwen-code/pull/16256) | 普通 journal commit 长时间占租户 placement guard，导致其他 Session 的 Turn/生命周期互相等待；简单改锁也会在缺失 resource/cleanup 索引上引入跨 Session gap-lock 死锁。 | 已合入：普通 journal 按 Session root 排队，缺失资源先 probe/唯一键仲裁；cleanup/CSI/lifecycle 仍另有围栏。 | 更新总览、Managed、Session 存储、存储与事件、恢复、JDBC English、JDBC 中文；完整最终实现见 [implementations/pr-16256.md](implementations/pr-16256.md)。 |
| [#16268](https://github.com/QwenLM/qwen-code/pull/16268) | 普通 inline 工具结果仍争两类 tenant guard；生命周期续租/失败/重试与只读 storage admission 过度串行。若忽略 claim mirror 当前读，旧事务还可能用已清理的 lifecycle claim 放行。 | 已合入：普通 inline 发布按 Session，storage admission/authority mirror 用共享当前读；生命周期按原行序列化。 | 更新总览、Managed、Session 存储、存储与事件、Workspace 中文、Workspace English、恢复、JDBC English、JDBC 中文；完整最终实现见 [implementations/pr-16268.md](implementations/pr-16268.md)。 |
| [#16270](https://github.com/QwenLM/qwen-code/pull/16270) | OpenAI-compatible Gemini 工具响应的 opaque thought signature 在转换、流式聚合或持久记录时丢失，下一请求重放同工具 call 时可能被 provider 拒绝；并行或 signature-only delta 又可能串错调用。 | 已合入：转换、流聚合和持久化保留 opaque signature，重放写回双扩展；冲突不猜测。 | 更新总览、工具调用完整性；完整最终实现见 [implementations/pr-16270.md](implementations/pr-16270.md)。 |
| [#16275](https://github.com/QwenLM/qwen-code/pull/16275) | 去掉普通 journal 租户锁后，retention 可在 cleanup 引用受理前收走原 Runtime binding；只写引用而不核原 binding 会留下悬空清理债务，或错误引用其他租户、Workspace、generation 的资源。 | 已合入：cleanup commit 先有界 placement 再 Session；新/未确认引用锁定核原 binding 全身份，confirmed 仅结算。 | 更新总览、Managed、Session 存储、存储与事件、恢复、JDBC English、JDBC 中文；完整最终实现见 [implementations/pr-16275.md](implementations/pr-16275.md)。 |
| [#16283](https://github.com/QwenLM/qwen-code/pull/16283) | 目录浏览、文件 query/read、上传预检和 worktree source 复用 resolveForCreation 的锁定事务，读请求等待 Workspace/ACL/Session 元数据写锁；外部 I/O 又不该持有数据库准入锁。 | 已合入：读 scope 与持久 creation/admit 分开，I/O 前后重验；上传只是预检无锁，最终受理照旧。 | 更新总览、Managed、Workspace 中文、Workspace English、客户端；完整最终实现见 [implementations/pr-16283.md](implementations/pr-16283.md)。 |
| [#16288](https://github.com/QwenLM/qwen-code/pull/16288) | 要求 DBA 把 GLOBAL.sql_mode 改严格会扩大部署权限与影响范围；只有校验连接严格又不能保证连接池后续物理连接都拒绝静默截断。 | 已合入：Druid 每个新 MySQL/MariaDB 连接追加严格模式，catalog 只查 SESSION，不修改 GLOBAL。 | 更新总览、Managed、Session 兼容、恢复、JDBC English、JDBC 中文；完整最终实现见 [implementations/pr-16288.md](implementations/pr-16288.md)。 |
| [#16296](https://github.com/QwenLM/qwen-code/pull/16296) | 审批变更在已存在的 REPEATABLE READ 快照中普通读 approval_revision、rules 或 plan，会基于旧状态错误提交/发事件；仅先查缺失 receipt 还会给不同 Session 引入索引 gap 竞争。 | 已合入：先插 receipt/唯一键仲裁，锁定当前审批行，revision CAS 必须更新一行；回滚不留虚假 receipt/事件。 | 更新总览、Managed、Session 存储、客户端；完整最终实现见 [implementations/pr-16296.md](implementations/pr-16296.md)。 |
| [#16298](https://github.com/QwenLM/qwen-code/pull/16298) | 先杀 Git 父进程会把子进程交给不回收它们的 PID 1，形成仍被 isAlive 观察到的 zombie，停止证明失败后 Workspace 维护必须保留。中断 checkout fixture 和 CSI HTTP collector 也有终止顺序问题。 | 已合入：单次 2 秒预算先杀叶子供父回收，保存所有观察 handle；未证停止仍拒绝释放并恢复中断。 | 更新总览、Managed、Workspace 中文、Workspace English、恢复；完整最终实现见 [implementations/pr-16298.md](implementations/pr-16298.md)。 |
| [#16312](https://github.com/QwenLM/qwen-code/pull/16312) | 外层 Workspace readScope 虽已分离，内层 verifiedRoot/fileRoot、physical owner key 和 worktree storageIdentity 仍根据事务存在隐式加 FOR UPDATE，读请求继续排在其他共享读者后；单快照 source 也可能漏掉读中撤权或存储换代。 | 已合入：内层 storage root/key/identity 显式不加锁，source 双独立快照重验；持久 admit 仍锁定。 | 更新总览、Managed、Workspace 中文、Workspace English、客户端；完整最终实现见 [implementations/pr-16312.md](implementations/pr-16312.md)。 |
| [#16318](https://github.com/QwenLM/qwen-code/pull/16318) | 无界 platform 线程和 HTTP dispatch 可耗尽宿主；本地启动容量拒绝如果被当作普通 provision 失败写成 RECOVERY_BLOCKED，会让实际尚未启动的原 binding 永远不能重试。相反，已启动或 attestation 后失败又不能借容量错误重放。 | 当前 open diff：本地启动 32/HTTP dispatch 64 上限；仅启动前容量拒绝按原 binding/seed 重试。 | 更新总览、Managed、恢复、JDBC English、JDBC 中文；完整当前实现观察见 [implementations/pr-16318.md](implementations/pr-16318.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [Feature 总览](../../feature/README.md) | #16090(merged), #16099(merged), #16101(merged), #16114(merged), #16134(merged), #16139(merged), #16141(merged), #16142(merged), #16143(merged), #16153(merged), #16205(merged), #16212(merged), #16217(merged), #16221(merged), #16223(merged), #16225(merged), #16229(merged), #16240(merged), #16256(merged), #16268(merged), #16270(merged), #16275(merged), #16283(merged), #16288(merged), #16296(merged), #16298(merged), #16312(merged), #16318(open) | 同步当前状态、原身份/锁序和未执行验证边界；保留有效历史内容。 |
| [Managed Agents](../../feature/managed-agents/README.md) | #16090(merged), #16099(merged), #16101(merged), #16114(merged), #16134(merged), #16139(merged), #16141(merged), #16142(merged), #16143(merged), #16153(merged), #16205(merged), #16212(merged), #16217(merged), #16221(merged), #16223(merged), #16225(merged), #16229(merged), #16240(merged), #16256(merged), #16268(merged), #16275(merged), #16283(merged), #16288(merged), #16296(merged), #16298(merged), #16312(merged), #16318(open) | 同步当前状态、原身份/锁序和未执行验证边界；保留有效历史内容。 |
| [Session 存储](../../feature/managed-agents/managed-agent-session-storage.md) | #16090(merged), #16139(merged), #16142(merged), #16143(merged), #16153(merged), #16223(merged), #16225(merged), #16256(merged), #16268(merged), #16275(merged), #16296(merged) | 同步当前状态、原身份/锁序和未执行验证边界；保留有效历史内容。 |
| [存储与事件](../../feature/managed-agents/managed-agent-storage-event-architecture.md) | #16090(merged), #16139(merged), #16142(merged), #16143(merged), #16256(merged), #16268(merged), #16275(merged) | 同步当前状态、原身份/锁序和未执行验证边界；保留有效历史内容。 |
| [Session 兼容](../../feature/managed-agents/managed-agent-session-compatibility.md) | #16090(merged), #16139(merged), #16141(merged), #16142(merged), #16143(merged), #16153(merged), #16288(merged) | 同步当前状态、原身份/锁序和未执行验证边界；保留有效历史内容。 |
| [恢复与运维](../../feature/managed-agents/managed-agent-recovery-operations.md) | #16090(merged), #16099(merged), #16101(merged), #16114(merged), #16134(merged), #16139(merged), #16141(merged), #16142(merged), #16143(merged), #16153(merged), #16205(merged), #16212(merged), #16217(merged), #16221(merged), #16223(merged), #16225(merged), #16240(merged), #16256(merged), #16268(merged), #16275(merged), #16288(merged), #16298(merged), #16318(open) | 同步当前状态、原身份/锁序和未执行验证边界；保留有效历史内容。 |
| [JDBC English](../../feature/managed-agents/managed-runtime-broker-jdbc.md) | #16090(merged), #16099(merged), #16101(merged), #16114(merged), #16134(merged), #16139(merged), #16141(merged), #16142(merged), #16143(merged), #16205(merged), #16212(merged), #16217(merged), #16221(merged), #16223(merged), #16225(merged), #16240(merged), #16256(merged), #16268(merged), #16275(merged), #16288(merged), #16318(open) | 同步当前状态、原身份/锁序和未执行验证边界；保留有效历史内容。 |
| [JDBC 中文](../../feature/managed-agents/managed-runtime-broker-jdbc.zh-CN.md) | #16090(merged), #16099(merged), #16101(merged), #16114(merged), #16134(merged), #16139(merged), #16141(merged), #16142(merged), #16143(merged), #16205(merged), #16212(merged), #16217(merged), #16221(merged), #16223(merged), #16225(merged), #16240(merged), #16256(merged), #16268(merged), #16275(merged), #16288(merged), #16318(open) | 同步当前状态、原身份/锁序和未执行验证边界；保留有效历史内容。 |
| [客户端](../../feature/managed-agents/managed-agent-client-surfaces.md) | #16153(merged), #16212(merged), #16225(merged), #16229(merged), #16283(merged), #16296(merged), #16312(merged) | 同步当前状态、原身份/锁序和未执行验证边界；保留有效历史内容。 |
| [Workspace 中文](../../feature/managed-agents/managed-agent-workspace-context.md) | #16205(merged), #16212(merged), #16217(merged), #16229(merged), #16240(merged), #16268(merged), #16283(merged), #16298(merged), #16312(merged) | 同步当前状态、原身份/锁序和未执行验证边界；保留有效历史内容。 |
| [Workspace English](../../feature/managed-agents/managed-agent-workspace-context.en.md) | #16205(merged), #16212(merged), #16217(merged), #16229(merged), #16240(merged), #16268(merged), #16283(merged), #16298(merged), #16312(merged) | 同步当前状态、原身份/锁序和未执行验证边界；保留有效历史内容。 |
| [SDK](../../feature/sdk.md) | #16141(merged), #16153(merged) | 同步当前状态、原身份/锁序和未执行验证边界；保留有效历史内容。 |
| [工具调用完整性](../../feature/tool-call-id-integrity.md) | #16270(merged) | 新增 Gemini opaque thought signature 的转换/流式/持久记录与重放。 |

_按个人 PR 口径更新于 2026-11-05；文档核验不替代源码、CI、MySQL、Hosted/fault、发行和平台验收。_
