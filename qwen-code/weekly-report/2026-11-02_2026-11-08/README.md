# qwen-code PRs · 2026-11-02 ~ 2026-11-08 (W45 日更至 11-02)

> 本文件收录本周截至北京时间 2026-11-02 创建的 @doudouOUC 个人 PR。本次日更窗口为 `[2026-11-01T16:00:00Z, 2026-11-02T16:00:00Z)`，新增 9 个；按 author/createdAt 判定，#16084 虽在该日合入仍属 W44，不重复收录。快照取北京时间 2026-11-03，主干 `0441faff2149`。merged 描述最终合入及 main 演进，open 只登记当前 diff，不能作为 main 能力承诺。代码量是逐 PR 累加，包含叠加分支/重叠 diff，不是去重 main 增量；合入/关闭时间不改变创建周。W44 周报保留周更归档快照。本次未运行源码、CI、规模或真实环境验收。

**主题**: Store 保留事务 facade 的分片与精简、Hosted 探针接线及发行门禁修复已合入；锁契约、可选 Runtime 模块与 MySQL 规范仍 open

**PR 统计**: 9 PRs - 6 merged / 3 open / 0 closed
**当前已合并 PR 代码量**: +15,360 / -11,066，115 个文件变更
**全量代码量**: +22,642 / -16,618，424 个文件变更
**类型分布**: refactor ×5, fix ×3, test ×1
**范围 (scope)**: managed-agent ×8, ci ×1

main 保留六生产 Maven 模块和 verification、唯一 V1/38 业务表。#16090 将大 Store 拆为十个 Agent、八个 Journal 包内普通对象，公开 facade/事务入口与原身份/资源围栏保留；#16142 仅删内部分片重复默认重载和 ItemRow，中转消失不代表锁审计已替换。#16101 修探针观察拥有者，不改生产取消算法。#16099/#16114/#16134 分别修 main Javadoc、原 0.26.5 固定发行输入及 specialist profile 所有权；最新发行步骤双补丁共同预检，原 tag/产品源不变，未由本次重跑或发布。

三个 open 方案独立观察：#16139 拟用执行 SQL/事务轨迹约束锁序并在同 DataSource 事务中复用原 root/head；#16141 拟以 ServiceLoader 和可选 JAR 拆 Runtime 后端；#16143 拟重整 V1 的 id 主键、is_ 标志和无 FK 约定。它们不是已整合联合版本，也不证明 main、旧库/writer 兼容或真实 MySQL/Hosted/平台资格。

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 代码量 | 文件数 | 创建时间(UTC) | 合并/关闭时间(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#16090](https://github.com/QwenLM/qwen-code/pull/16090) | ✅ merged | @doudouOUC | refactor(managed-agent): split Agent and Session stores | +14742/-10773 | 86 | 11-01 17:19 | 11-02 12:46 |
| [#16099](https://github.com/QwenLM/qwen-code/pull/16099) | ✅ merged | @doudouOUC | fix(managed-agent): keep javadoc valid after the module split | +2/-1 | 2 | 11-02 02:27 | 11-02 03:42 |
| [#16101](https://github.com/QwenLM/qwen-code/pull/16101) | ✅ merged | @doudouOUC | test(managed-agent): Reconnect Hosted fault probes to execution owners | +170/-15 | 3 | 11-02 03:15 | 11-02 04:43 |
| [#16114](https://github.com/QwenLM/qwen-code/pull/16114) | ✅ merged | @doudouOUC | fix(ci): repair Javadoc for the 0.26.5 managed runtime release | +173/-0 | 3 | 11-02 06:46 | 11-02 09:12 |
| [#16134](https://github.com/QwenLM/qwen-code/pull/16134) | ✅ merged | @doudouOUC | fix(managed-agent): Restore profile-owned runtime verification | +137/-51 | 4 | 11-02 12:01 | 11-02 13:50 |
| [#16139](https://github.com/QwenLM/qwen-code/pull/16139) | open | @doudouOUC | refactor(managed-agent): simplify row locking and runtime verification | +1907/-3296 | 25 | 11-02 12:34 | - |
| [#16141](https://github.com/QwenLM/qwen-code/pull/16141) | open | @doudouOUC | refactor(managed-agent): Make runtime backends optional Maven modules | +3416/-603 | 155 | 11-02 13:08 | - |
| [#16142](https://github.com/QwenLM/qwen-code/pull/16142) | ✅ merged | @doudouOUC | refactor(managed-agent): trim store delegation boilerplate | +136/-226 | 17 | 11-02 13:21 | 11-02 16:12 |
| [#16143](https://github.com/QwenLM/qwen-code/pull/16143) | open | @doudouOUC | refactor(managed-agent): align shared MySQL schema conventions | +1959/-1653 | 129 | 11-02 13:28 | - |

---

## PR 解决问题、实现方式与 feature 处理

| PR | 解决了什么问题 | 最终怎么实现（open/closed 只登记当前观察） | 对应 feature 文档 |
|---|---|---|---|
| [#16090](https://github.com/QwenLM/qwen-code/pull/16090) | 大 Store 的职责/依赖与锁序难局部核验，直接迁入口会改变事务。 | 已合入：保 facade/原事务属性，十 Agent/八 Journal 包内 final 无环协作者；原资源/journal/head 同事务和 afterCommit 保留，Session 依赖完整构造、CSI 只认同源 JDBC。 | 更新总览、Managed、Session 存储/兼容、存储与事件、恢复、JDBC 双语；完整最终实现见 [implementations/pr-16090.md](implementations/pr-16090.md)。 |
| [#16099](https://github.com/QwenLM/qwen-code/pull/16099) | 拆模块后文档类型和小于号导致 Javadoc 解析失败。 | 已合入：仅补 ExternalRuntimeKinds import、转义范围符号，不改数字序列化和 Runtime 能力。 | 更新总览、Managed、恢复及 JDBC 双语的发行边界；完整最终实现见 [implementations/pr-16099.md](implementations/pr-16099.md)。 |
| [#16101](https://github.com/QwenLM/qwen-code/pull/16101) | 探针仍替换 facade 旧字段，无法观察真实执行/取消或拦结算。 | 测试已合入：代理接 dispatcher/cancellation 并同时恢复，status gate 延迟原 execute 结果；计数与原 Broker 状态分别断言，不改生产取消。 | 更新总览、Managed、恢复及 JDBC 双语的验证接线；完整最终实现见 [implementations/pr-16101.md](implementations/pr-16101.md)。 |
| [#16114](https://github.com/QwenLM/qwen-code/pull/16114) | main 文档修复未进入固定原源的 0.26.5 发行。 | 已合入：原版本/产品 SHA、补丁摘要和干净 tracked checkout 围栏，构建前 check/apply 仅 Javadoc 修复；后续 #16134 扩成双补丁。 | 更新总览、Managed、恢复和 JDBC 双语；完整最终实现见 [implementations/pr-16114.md](implementations/pr-16114.md)。 |
| [#16134](https://github.com/QwenLM/qwen-code/pull/16134) | 默认 Failsafe 声明误激活应属 specialist profile 的验证。 | 已合入：共享配置归 pluginManagement，原 profiles/选择器/打包不变；原 0.26.5 源上双补丁共同预检、记录 blob，不代表发行成功。 | 更新总览、Managed、恢复和 JDBC 双语；完整最终实现见 [implementations/pr-16134.md](implementations/pr-16134.md)。 |
| [#16139](https://github.com/QwenLM/qwen-code/pull/16139) | 静态锁解析膨胀且不能证明实际连接，简单删锁又丢围栏。 | open 当前观察：Session+Turn 成对 helper、同源真实事务下复用已核 root/head；SQL/事务轨迹场景与精确入口/所有者清单替代静态控制流推断，不证明所有分支。 | 更新总览、Managed、Session 存储/兼容、存储与事件、恢复、JDBC 双语；完整当前观察见 [implementations/pr-16139.md](implementations/pr-16139.md)。 |
| [#16141](https://github.com/QwenLM/qwen-code/pull/16141) | 普通 library 强依赖所有 Runtime，配置选择与安装/注册混淆。 | open 当前观察：十三生产模块、五 provider 可选 runtime JAR，ServiceLoader 只登记，选中缺包/歧义拒绝；SSH 选择与注册独立，原权限/离线维护/失败清理保留。 | 更新总览、Managed、Session 兼容、恢复和 JDBC 双语；完整当前观察见 [implementations/pr-16141.md](implementations/pr-16141.md)。 |
| [#16142](https://github.com/QwenLM/qwen-code/pull/16142) | facade/分片重复默认重载及 ItemRow 中转增加漂移。 | 已合入：公开入口显式传原 null/false 等默认、内部删重复重载，直接映射 ItemRecord/List.copyOf；守卫覆盖合成 stereotype/混合大小写 SQL，不改锁协议。 | 更新总览、Managed、Session 存储/兼容、存储与事件、恢复、JDBC 双语；完整最终实现见 [implementations/pr-16142.md](implementations/pr-16142.md)。 |
| [#16143](https://github.com/QwenLM/qwen-code/pull/16143) | DDL 规范化若漏查询/校验/inventory，会读错列或错误接纳 catalog。 | open 当前观察：V1/38 表新增自增 id 主键、原业务 UNIQUE、is_ 标志/idx_/uk_ 与无 FK；同步 SQL/Rows/Projection/CSI，校验自增/signedness/前缀/禁止 FK，无旧库升级。 | 更新总览、Managed、Session 存储/兼容、存储与事件、恢复、JDBC 双语；完整当前观察见 [implementations/pr-16143.md](implementations/pr-16143.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [Feature 总览](../../feature/README.md) | #16090(merged), #16099(merged), #16101(merged), #16114(merged), #16134(merged), #16139(open), #16141(open), #16142(merged), #16143(open) | W45 9 个本人 PR，六项合入和三个独立候选分开。 |
| [Managed Agents](../../feature/managed-agents/README.md) | #16090(merged), #16099(merged), #16101(merged), #16114(merged), #16134(merged), #16139(open), #16141(open), #16142(merged), #16143(open) | 当前六模块/38 表与候选架构、验证证据分层。 |
| [Session 存储](../../feature/managed-agents/managed-agent-session-storage.md) | #16090(merged), #16139(open), #16142(merged), #16143(open) | 保原 writer/资源/commit/native read 事务，另列锁/DDL 候选。 |
| [存储与事件](../../feature/managed-agents/managed-agent-storage-event-architecture.md) | #16090(merged), #16139(open), #16142(merged), #16143(open) | 分片不改权威；afterCommit、读 lease、原 schema 与候选无 FK 分开。 |
| [Session 兼容](../../feature/managed-agents/managed-agent-session-compatibility.md) | #16090(merged), #16139(open), #16141(open), #16142(merged), #16143(open) | 原入口/事务与构造迁移、候选包/JAR/基线不等于混版本兼容。 |
| [恢复与运维](../../feature/managed-agents/managed-agent-recovery-operations.md) | #16090(merged), #16099(merged), #16101(merged), #16114(merged), #16134(merged), #16139(open), #16141(open), #16142(merged), #16143(open) | 探针真正到达拥有者、profile 归属及固定发行输入，均不替代实际运行。 |
| [JDBC English](../../feature/managed-agents/managed-runtime-broker-jdbc.md) | #16090(merged), #16099(merged), #16101(merged), #16114(merged), #16134(merged), #16139(open), #16141(open), #16142(merged), #16143(open) | facade/分片、锁/DDL/provider 候选及发行/验收边界同步。 |
| [JDBC 中文](../../feature/managed-agents/managed-runtime-broker-jdbc.zh-CN.md) | #16090(merged), #16099(merged), #16101(merged), #16114(merged), #16134(merged), #16139(open), #16141(open), #16142(merged), #16143(open) | 与英文保持状态和技术边界一致。 |

_按个人 PR 口径更新于 2026-11-03；文档核验不替代源码、CI、MySQL、Hosted/fault、发行和平台验收。_
