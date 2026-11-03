# qwen-code PRs · 2026-11-02 ~ 2026-11-08 (W45 日更至 11-03)

> 本文件收录本周截至北京时间 2026-11-03 创建的 @doudouOUC 个人 PR。本次日更窗口为 `[2026-11-02T16:00:00Z, 2026-11-03T16:00:00Z)`，新增 #16153/#16205/#16212 三个；本周原有 9 个同步刷新，不按合入/关闭时间跨周收录。快照取北京时间 2026-11-04，主干 `da42e5714ad0`。merged 描述最终合入及 main 演进，open 只登记当前 diff，不能作为 main 能力承诺。代码量是逐 PR 累加，包含叠加分支/重叠 diff，不是去重 main 增量；合入/关闭时间不改变创建周。W44 周报保留周更归档快照。本次未运行源码、CI、规模或真实环境验收。

**主题**: Store/锁契约、可选 Runtime 模块、严格 MySQL 基线和 Session 完整模型配置已合入；Workspace 成员 CAS 与共享并发上传已落地

**PR 统计**: 12 PRs - 12 merged / 0 open / 0 closed
**当前已合并 PR 代码量**: +27,553 / -17,026，542 个文件变更
**全量代码量**: +27,553 / -17,026，542 个文件变更
**类型分布**: refactor ×5, fix ×4, test ×1, feat ×2
**范围 (scope)**: managed-agent ×11, ci ×1

main 已有十三生产 Maven 模块和 verification、唯一 V1/38 业务表。#16090/#16142 保事务 facade 并拆/精简普通协作者；#16139 以原连接执行轨迹和精确清单替代静态控制流解析，仅同源真实事务复用 root/head。#16141 将五种后端变为可选 provider JAR，ServiceLoader 缺选中后端拒绝；#16143 同步 id/is_ 列、业务 UNIQUE、无 FK 与严格 SQL 模式检查，无旧库升级。#16101 修探针观察拥有者，不改生产取消算法。#16099/#16114/#16134 的 Javadoc、固定原 0.26.5 双补丁和 specialist profile 围栏保留，未由本次重跑或发布。

#16153 创建时冻结并加密完整模型配置，定义/恢复只持摘要，原 writer/lifecycle 私有读取后隔离宿主同名路由；#16205 以物理 owner 成员计数/排他 rewind CAS 缩短共享执行准入，不泛化取消所有 placement 锁。#16212 已以 merge `da42e5714ad0` 允许上传与上传/Runtime 共享成员、按原 receipt 一次结算，未知结果保占用并只查原进程；不提供同路径写隔离。相同 V1/38 表不证明旧 writer 或旧 catalog 可兼容。

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
| [#16143](https://github.com/QwenLM/qwen-code/pull/16143) | DDL 规范化若漏查询/校验/inventory，会读错列或错误接纳 catalog。 | 已合入：V1/38 表自增 id、原业务 UNIQUE、is_ 标志/idx_/uk_ 与无 FK；同步 SQL/Rows/CSI，校验自增/signedness/前缀/禁止 FK，DDL 前核全局/当前严格模式，无旧库升级。 | 更新总览、Managed、Session 存储/兼容、存储与事件、恢复、JDBC 双语；完整最终实现见 [implementations/pr-16143.md](implementations/pr-16143.md)。 |
| [#16153](https://github.com/QwenLM/qwen-code/pull/16153) | 只选 modelId 不能为 Session 固定秘密连接，恢复易误用宿主同名配置。 | 已合入：严格完整配置、allowlist/能力准入、同事务加密，receipt 先回读；定义只持摘要、原 writer/lifecycle 私有读取，文本/workflow/Hook/压缩隔离宿主连接，子身份重加密。 | 更新总览、Managed、Session 存储/兼容、恢复、客户端和 SDK；完整最终实现见 [implementations/pr-16153.md](implementations/pr-16153.md)。 |
| [#16205](https://github.com/QwenLM/qwen-code/pull/16205) | 共享执行争 tenant guard/成员范围锁，去锁易漏维护/rewind 围栏。 | 已合入：mount revision 预验、binding share/原 Session 点锁、owner 成员 CAS 与幂等释放；rewind 仅单成员排他，retention 保未释放记录；后续 #16212 再共享上传。 | 更新总览、Managed、Workspace 双语、恢复和 JDBC 双语；完整最终实现见 [implementations/pr-16205.md](implementations/pr-16205.md)。 |
| [#16212](https://github.com/QwenLM/qwen-code/pull/16212) | 上传独占整个目录，未知结果/同 ID 并发又不能丢占用事实。 | 已合入：上传计入共享 member_count、原 mount/alias/actor 围栏；唯一 receipt 仲裁、directory-before-operation 一次结算，未知保成员，不再拿 tenant guard；不证明同路径写隔离。 | 更新总览、Managed、客户端、Workspace 双语、恢复和 JDBC 双语；完整最终实现见 [implementations/pr-16212.md](implementations/pr-16212.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [Feature 总览](../../feature/README.md) | #16090(merged), #16099(merged), #16101(merged), #16114(merged), #16134(merged), #16139(merged), #16141(merged), #16142(merged), #16143(merged), #16153(merged), #16205(merged), #16212(merged) | W45 12 个本人 PR，12 项均合入。 |
| [Managed Agents](../../feature/managed-agents/README.md) | #16090(merged), #16099(merged), #16101(merged), #16114(merged), #16134(merged), #16139(merged), #16141(merged), #16142(merged), #16143(merged), #16153(merged), #16205(merged), #16212(merged) | 十三模块/38 表、模型秘密权威与成员 CAS，共享上传另列。 |
| [Session 存储](../../feature/managed-agents/managed-agent-session-storage.md) | #16090(merged), #16139(merged), #16142(merged), #16143(merged), #16153(merged) | 原事务/身份围栏、已合入锁/DDL 与加密模型读取。 |
| [存储与事件](../../feature/managed-agents/managed-agent-storage-event-architecture.md) | #16090(merged), #16139(merged), #16142(merged), #16143(merged) | afterCommit/读 lease 保留，无 FK 不再是数据库引用保证。 |
| [Session 兼容](../../feature/managed-agents/managed-agent-session-compatibility.md) | #16090(merged), #16139(merged), #16141(merged), #16142(merged), #16143(merged), #16153(merged) | 已合入新包/JAR/基线，原摘要/私有读取不等于旧 writer 兼容。 |
| [恢复与运维](../../feature/managed-agents/managed-agent-recovery-operations.md) | #16090(merged), #16099(merged), #16101(merged), #16114(merged), #16134(merged), #16139(merged), #16141(merged), #16142(merged), #16143(merged), #16153(merged), #16205(merged), #16212(merged) | 原 receipt、原成员释放和秘密恢复不替代真实验证。 |
| [JDBC English](../../feature/managed-agents/managed-runtime-broker-jdbc.md) | #16090(merged), #16099(merged), #16101(merged), #16114(merged), #16134(merged), #16139(merged), #16141(merged), #16142(merged), #16143(merged), #16205(merged), #16212(merged) | 最终锁/DDL/provider 与成员计数，共享上传和门禁分层。 |
| [JDBC 中文](../../feature/managed-agents/managed-runtime-broker-jdbc.zh-CN.md) | #16090(merged), #16099(merged), #16101(merged), #16114(merged), #16134(merged), #16139(merged), #16141(merged), #16142(merged), #16143(merged), #16205(merged), #16212(merged) | 与英文保持状态和技术边界一致。 |
| [客户端](../../feature/managed-agents/managed-agent-client-surfaces.md) | #16153(merged), #16212(merged) | 创建 API 的模型配置不等于 UI 编辑器，上传已合入。 |
| [Workspace 中文](../../feature/managed-agents/managed-agent-workspace-context.md) | #16205(merged), #16212(merged) | 原成员 CAS 与已合入共享上传、维护/rewind 排斥。 |
| [Workspace English](../../feature/managed-agents/managed-agent-workspace-context.en.md) | #16205(merged), #16212(merged) | 同步英文物理身份/成员/维护围栏。 |
| [SDK](../../feature/sdk.md) | #16153(merged), #16141(merged) | Java create/load 原摘要与可选 provider 的消费者接线。 |

_按个人 PR 口径更新于 2026-11-04；文档核验不替代源码、CI、MySQL、Hosted/fault、发行和平台验收。_
