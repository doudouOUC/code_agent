# qwen-code PRs · 2026-10-19 ~ 2026-10-25 (W43 日更至 10-19)

> 本文件仅收录北京时间 2026-10-19 创建的 @doudouOUC 个人 PR，UTC 半开窗口 `[2026-10-18T16:00:00Z, 2026-10-19T16:00:00Z)`，后续日更在本创建周累积。快照取北京时间 2026-10-20，主干 `725bf4c6b8aa`。只按 author/createdAt，不因更新、关闭或合入时间补收；W42 后续合入的 #14487/#14523/#14599 仍归 W42，不计本周新增。merged 记录最终实现、open 仅当前 diff；PR 规模逐项累加且包含 rename，不是去重后的主干增量。本次仅文档核验，未运行源码或环境门禁。

**主题**: 固定 Skills、失租 wake/后台续接、工具详情、8 MiB 附件与图片格式、LOCAL/SSH 文件引用、CSI 冷恢复及 Java 包边界；应用退役 open

**PR 统计**: 10 PRs - 9 merged / 1 open / 0 closed
**当前已合并 PR 代码量**: +18,409 / -5,044，903 个文件变更
**全量代码量**: +32,633 / -5,609，993 个文件变更
**类型分布**: feat ×5, fix ×4, refactor ×1
**范围 (scope)**: managed-agent ×7, hosted ×1, runtime ×2

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
| [#14698](https://github.com/QwenLM/qwen-code/pull/14698) | 🟡 open | @doudouOUC | feat(runtime): add original CSI application retirement | +14224/-565 | 90 | 10-19 10:33 | - |
| [#14704](https://github.com/QwenLM/qwen-code/pull/14704) | ✅ merged | @doudouOUC | fix(managed-agent): Align image attachment formats with Qwen Code | +239/-27 | 10 | 10-19 11:05 | 10-19 12:48 |
| [#14710](https://github.com/QwenLM/qwen-code/pull/14710) | ✅ merged | @doudouOUC | refactor(managed-agent): organize server packages by responsibility | +5306/-4296 | 676 | 10-19 11:20 | 10-19 14:16 |

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
| [#14698](https://github.com/QwenLM/qwen-code/pull/14698) | 现有物理退役 seal 不能证明 SQL 应用、原 worker 文件历史和所有资源已闭合；提前清理会失去恢复证据或误释放原挂载。 | 当前 open diff 以 V12 和 boot6 增加 SETTLING→FROZEN→CUT→DRAINED，原库存/worker 观察及保存的 CUT 共同约束 finalize。 | 更新恢复与运维、存储与事件、JDBC 中文、JDBC English及总览；完整观察见 [implementations/pr-14698.md](implementations/pr-14698.md)。 |
| [#14704](https://github.com/QwenLM/qwen-code/pull/14704) | 普通 Qwen Code 接受的 GIF 和 image/jpg 在 Managed 输入中被拒绝，或重载后 MIME 不一致，破坏同一附件的规范化请求。 | 已合入：三端新增 GIF87a/GIF89a 校验并将 image/jpg 规范为 image/jpeg，保留整体预算、签名和 canonical base64 检查。 | 更新客户端与事件、SDK及总览；完整实现见 [implementations/pr-14704.md](implementations/pr-14704.md)。 |
| [#14710](https://github.com/QwenLM/qwen-code/pull/14710) | 单一应用中的 service/store 混入多种职责，业务与持久化反向依赖 HTTP api，Broker 供应器和传输协议也难区分。 | 已合入：在同一个 Maven/部署内拆分职责包，共享 SQL 聚合留 persistence，模型/异常离开 api，更新跨包访问和启动入口。 | 更新存储与事件、JDBC 中文、JDBC English、SDK及总览；完整实现见 [implementations/pr-14710.md](implementations/pr-14710.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [Feature 总览](../../feature/README.md) | #14710(merged), #14704(merged), #14698(open), #14695(merged), #14679(merged), #14639(merged), #14628(merged), #14604(merged), #14603(merged), #14602(merged) | 同步 W43 个人 PR 范围及历史快照边界。 |
| [完整工具结果 English](../../feature/managed-agents/managed-agent-tool-result-artifacts.md) | #14604(merged) | 同步已存详情的有界读取与原验证边界。 |
| [Managed Agents](../../feature/managed-agents/README.md) | #14602(merged), #14603(merged), #14604(merged), #14628(merged), #14639(merged), #14679(merged), #14695(merged), #14698(open), #14704(merged), #14710(merged) | 增量更新已合入行为、open 观察与原验证边界；不变更创建周。 |
| [客户端与事件](../../feature/managed-agents/managed-agent-client-surfaces.md) | #14602(merged), #14604(merged), #14628(merged), #14639(merged), #14704(merged), #14695(merged) | 增量更新已合入行为、open 观察与原验证边界；不变更创建周。 |
| [恢复与运维](../../feature/managed-agents/managed-agent-recovery-operations.md) | #14603(merged), #14679(merged), #14695(merged), #14698(open) | 增量更新已合入行为、open 观察与原验证边界；不变更创建周。 |
| [存储与事件](../../feature/managed-agents/managed-agent-storage-event-architecture.md) | #14603(merged), #14628(merged), #14698(open), #14710(merged) | 增量更新已合入行为、open 观察与原验证边界；不变更创建周。 |
| [完整工具结果](../../feature/managed-agents/managed-agent-tool-result-artifacts.zh-CN.md) | #14604(merged) | 增量更新已合入行为、open 观察与原验证边界；不变更创建周。 |
| [JDBC 中文](../../feature/managed-agents/managed-runtime-broker-jdbc.zh-CN.md) | #14695(merged), #14698(open), #14710(merged) | 增量更新已合入行为、open 观察与原验证边界；不变更创建周。 |
| [JDBC English](../../feature/managed-agents/managed-runtime-broker-jdbc.md) | #14695(merged), #14698(open), #14710(merged) | 增量更新已合入行为、open 观察与原验证边界；不变更创建周。 |
| [SDK](../../feature/sdk.md) | #14628(merged), #14704(merged), #14710(merged) | 增量更新已合入行为、open 观察与原验证边界；不变更创建周。 |

_按个人 PR 口径更新于 2026-10-20；文档审计不替代源码、浏览器、真实 MySQL/OSS/CSI/SSH/模型及部署验收。_
