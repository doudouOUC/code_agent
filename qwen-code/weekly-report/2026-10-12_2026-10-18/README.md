# qwen-code PRs · 2026-10-12 ~ 2026-10-18 (W42 日更)

> 本文件已整理北京时间 2026-10-12 至 2026-10-14 创建的 @doudouOUC 个人 PR，UTC 半开窗口 `[2026-10-11T16:00:00Z, 2026-10-14T16:00:00Z)`。按 author/createdAt 归属，不按更新、关闭或合入日期补收。当前周尚未结束；本次快照取 2026-10-15，主干 `9dacfdbe1a20`。open 仅当前 diff，closed 未合入仅历史观察；前一周后续合入的 PR 仍留 W41。#14081 已从 stacked base 改为 main；规模逐 PR 累加，不是去重后的 main 增量。文档审计不等于源码测试通过，#14186 当前 head 的两文件语法探针已发现错误。

**主题**: L4/任务面板/标准 UI、私有 CSI 与 32 表最终基线、OSS capture、资源闭包、SQL 时间/映射及静态门禁

**PR 统计**: 15 PRs - 9 merged / 4 open / 2 closed
**当前已合并 PR 代码量**: +60,391 / -14,267，611 个文件变更
**全量代码量**: +70,261 / -19,154，1097 个文件变更
**类型分布**: feat ×6, fix ×7, test ×1, chore ×1
**范围 (scope)**: managed-agent ×7, web-shell ×2, sdk-java ×2, serve ×2, core ×1, none ×1

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 代码量 | 文件数 | 创建时间(UTC) | 合并/关闭时间(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#13931](https://github.com/QwenLM/qwen-code/pull/13931) | ✅ merged | @doudouOUC | feat(managed-agent): add L4 Shell and MCP session lifecycle | +3110/-346 | 52 | 10-12 00:30 | 10-13 08:17 |
| [#13936](https://github.com/QwenLM/qwen-code/pull/13936) | ✅ merged | @doudouOUC | feat(web-shell): add Managed child Agent task panel | +3062/-7 | 28 | 10-12 03:22 | 10-12 13:02 |
| [#13973](https://github.com/QwenLM/qwen-code/pull/13973) | ✅ merged | @doudouOUC | feat(web-shell): Reuse standard UI for Managed Agents | +1992/-155 | 31 | 10-12 12:03 | 10-13 07:30 |
| [#13996](https://github.com/QwenLM/qwen-code/pull/13996) | ✅ merged | @doudouOUC | feat(sdk-java): add private CSI Session and native SQL authority | +23131/-2803 | 105 | 10-12 18:04 | 10-14 08:24 |
| [#14039](https://github.com/QwenLM/qwen-code/pull/14039) | ✅ merged | @doudouOUC | fix(managed-agent): recover lost lifecycle detach replies | +1236/-1 | 10 | 10-13 09:48 | 10-13 14:06 |
| [#14045](https://github.com/QwenLM/qwen-code/pull/14045) | ✅ merged | @doudouOUC | fix(managed-agent): close shell profiles after native file calls | +114/-9 | 8 | 10-13 11:16 | 10-13 14:05 |
| [#14059](https://github.com/QwenLM/qwen-code/pull/14059) | ✅ merged | @doudouOUC | fix(serve): resume committed file results after runtime retirement | +396/-120 | 6 | 10-13 12:45 | 10-13 14:07 |
| [#14069](https://github.com/QwenLM/qwen-code/pull/14069) | ✅ merged | @doudouOUC | feat(managed-agent): consolidate persistence into a 32-table baseline | +27000/-10758 | 362 | 10-13 13:47 | 10-14 00:58 |
| [#14081](https://github.com/QwenLM/qwen-code/pull/14081) | 🟡 open | @doudouOUC | feat(serve): attach private CSI Sessions to Hosted text turns | +1833/-16 | 20 | 10-13 15:06 | - |
| [#14124](https://github.com/QwenLM/qwen-code/pull/14124) | ✅ merged | @doudouOUC | fix(managed-agent): Wire OSS capture budgets into Hosted sessions | +350/-68 | 9 | 10-14 00:34 | 10-14 08:21 |
| [#14141](https://github.com/QwenLM/qwen-code/pull/14141) | 🔴 closed | @doudouOUC | fix(sdk-java): repair Hosted owner probes and mount fixtures | +109/-15 | 10 | 10-14 05:54 | 10-14 06:23 |
| [#14174](https://github.com/QwenLM/qwen-code/pull/14174) | 🔴 closed | @doudouOUC | test(managed-agent): align the baseline witness with canonical V2 | +1/-1 | 1 | 10-14 09:52 | 10-14 12:15 |
| [#14180](https://github.com/QwenLM/qwen-code/pull/14180) | 🟡 open | @doudouOUC | fix(core): retain CSI preparation resources through the HTTP store | +1465/-0 | 7 | 10-14 11:14 | - |
| [#14185](https://github.com/QwenLM/qwen-code/pull/14185) | 🟡 open | @doudouOUC | fix(managed-agent): Standardize SQL timestamps and query mappings | +2825/-2425 | 177 | 10-14 12:37 | - |
| [#14186](https://github.com/QwenLM/qwen-code/pull/14186) | 🟡 open | @doudouOUC | chore: adopt qwen-code-checks.xml and fix all checkstyle violations | +3637/-2430 | 271 | 10-14 12:42 | - |

---

## PR 解决问题、实现方式与 feature 处理

| PR | 解决了什么问题 | 最终怎么实现（open/closed 只登记当前观察） | 对应 feature 文档 |
|---|---|---|---|
| [#13931](https://github.com/QwenLM/qwen-code/pull/13931) | files 回执不能证明 Shell/MCP 原资源及完整输出已安全关闭。 | 已合入：精确 profile v2 默认关闭；effects 后以原 claim 做资源屏障，验证输出闭包，可信原 stopped receipt 才允许 LOST→DRAINING，有效原 cleanup claim 允许 writer 租约到期后的 seal。 | 更新恢复与运维、Managed Agents 的最终口径；完整实现见 [implementations/pr-13931.md](implementations/pr-13931.md)。 |
| [#13936](https://github.com/QwenLM/qwen-code/pull/13936) | 子 Agent 状态/产物缺入口，取消丢响应或提前显示终态会误导用户。 | 已合入：复用原 task API/分页，child_agent 侧栏或 Dialog；原取消键先持久再发，operation 接受后仍查询 task 真终态，保留未知意图与权限撤销后的恢复入口。 | 更新客户端与事件、Managed Agents 的 merged 范围；完整实现见 [implementations/pr-13936.md](implementations/pr-13936.md)。 |
| [#13973](https://github.com/QwenLM/qwen-code/pull/13973) | 独立 Managed 表单与标准聊天割裂，首次输入和草稿重试易重复/丢失。 | 已合入：标准 composer/欢迎页/selector，一次创建、原 payload/key 重试；受理后精确清原草稿，放弃恢复原初始输入并刷新列表，不宣称服务端未受理。 | 更新客户端与事件、Managed Agents 的最终实现；完整实现见 [implementations/pr-13973.md](implementations/pr-13973.md)。 |
| [#13996](https://github.com/QwenLM/qwen-code/pull/13996) | 私有 worker 的 Session/writer/grant/history 缺少同源 SQL authority，legacy mutation 可破坏原归属。 | 已合入：原 CSI Session/READY/journal/结果核验，最终 V2 扩展 32 表；read 意图进入 typed receipt、交付进入 read lease，不沿用旧 V69–V72。 | 更新 JDBC 双语、客户端与总览的最终私有边界；完整实现见 [implementations/pr-13996.md](implementations/pr-13996.md)。 |
| [#14039](https://github.com/QwenLM/qwen-code/pull/14039) | detach 成功但丢响应留下旧附件，原清理重试反复 404。 | 已合入：仅 v2 非 effects 404 条件移除原 AttachmentRef，仍抛原错误；下一次从 SQL 原 authority cleanup-only load，不将 404 当完成。 | 更新恢复与运维、总览；完整实现见 [implementations/pr-14039.md](implementations/pr-14039.md)。 |
| [#14045](https://github.com/QwenLM/qwen-code/pull/14045) | Shell 内 deferred 原生文件调用没有 Shell publication，合法关闭被误阻塞。 | 已合入：核验原 scoped input/payload hash，仅已结算且无 protocol/publication 的四种 deferred 文件调用免 Shell source；owner/真实 Shell 输出证明保留。 | 更新恢复与运维、总览；完整实现见 [implementations/pr-14045.md](implementations/pr-14045.md)。 |
| [#14059](https://github.com/QwenLM/qwen-code/pull/14059) | 原 Runtime 退役后已提交文件结果无法续接，重新 acquire 可能诱发二次效果。 | 已合入：限定 files results_ready/settled/history，复核 owed 原 binding/generation 释放与全部 outcome；只消费原结果，不再 acquire/运行工具。 | 增补 G3 恢复边界与总览；完整实现见 [implementations/pr-14059.md](implementations/pr-14059.md)。 |
| [#14069](https://github.com/QwenLM/qwen-code/pull/14069) | 表族扩展和多套初始化路径增加维护复杂度，粗暴缩表会破坏事务与恢复。 | 已合入新库 32 表、typed catalog 和独立 fence/lease；DDL 前拒绝 system catalog/未执行 CHECK，分页只读 view 不虚假续租，旧库不原地转换。 | 更新存储、JDBC 双语与总览的最终基线；完整实现见 [implementations/pr-14069.md](implementations/pr-14069.md)。 |
| [#14081](https://github.com/QwenLM/qwen-code/pull/14081) | 私有 CSI 文本误走普通 owner/close 会替换写者或 seal 原 authority。 | 当前面向 main 的 diff 私有 attach/text/history 接纯文本，fresh 原 admission、失租阻塞、stopLocal 不 seal/release；SQL/catalog 已继承 main，但本提取仍 open。 | 更新客户端、JDBC 双语与总览；完整观察见 [implementations/pr-14081.md](implementations/pr-14081.md)。 |
| [#14124](https://github.com/QwenLM/qwen-code/pull/14124) | Java 未传 captureBytes，启用 publication 的 Shell 仍选 inline producer。 | 已合入可选 SDK 字段及精确 Shell family create 接线；load 恢复原预算，不传新部署值，raw capture 与聚合开销/独立 GC 开关分开。 | 增补完整结果双语、SDK 与总览；完整实现见 [implementations/pr-14124.md](implementations/pr-14124.md)。 |
| [#14141](https://github.com/QwenLM/qwen-code/pull/14141) | Hosted probe 旧 hash 查错 physical owner，fixture birth/mtime 同 tick 误触身份拒绝。 | 关闭前测试方案沿 canonical alias JOIN physical owner，原字节身份/decoy 不回退；仅装置 mtime 固定，不改生产身份读取器。 | 恢复与总览保留 closed 观察；完整观察见 [implementations/pr-14141.md](implementations/pr-14141.md)。 |
| [#14174](https://github.com/QwenLM/qwen-code/pull/14174) | 已初始化 V2 catalog 的 baseline witness 仍预期版本 1。 | closed 未合入，仅一行 expected 1→2，32 业务表+history 的断言保留；不新增生产 DDL 或迁移。 | 存储与总览记录有限 witness；完整观察见 [implementations/pr-14174.md](implementations/pr-14174.md)。 |
| [#14180](https://github.com/QwenLM/qwen-code/pull/14180) | HTTP adapter 遗漏 private preparation refs，SQL 同事务 candidate 不闭合。 | 当前 diff 只收 schema2/精确 CSI profile 的 preparation，排除旧 predecessor；新增生产 SQL/native/worker 的有限 fixture，不证明原生 CSI 部署。 | 增补存储、JDBC 双语与总览；完整观察见 [implementations/pr-14180.md](implementations/pr-14180.md)。 |
| [#14185](https://github.com/QwenLM/qwen-code/pull/14185) | 混合 SQL 时间/driver 类型和 SELECT * 使 lease/分页/映射难核验。 | 当前 diff 改 V1 为 epoch-ms/UNSIGNED/gmt 字段，typed Time/Rows、显式 projection 和原 settle 时间；未提供已存在 catalog 的升级迁移。 | 增补存储、JDBC 双语与总览；完整观察见 [implementations/pr-14185.md](implementations/pr-14185.md)。 |
| [#14186](https://github.com/QwenLM/qwen-code/pull/14186) | server 静态规则不统一，测试源码未纳入同一 Checkstyle 门禁。 | 当前 diff 新规则+server pom/test 接线及批量源码修正；原 head 两份生产文件的 parser probe 有 10 个语法错误，不能记为纯格式/通过。 | SDK 与总览记录 open 语法阻塞；完整观察见 [implementations/pr-14186.md](implementations/pr-14186.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [Managed Agents](../../feature/managed-agents/README.md) | #13931(merged), #13936(merged), #13973(merged), #13996(merged), #14039(merged), #14045(merged), #14059(merged), #14069(merged), #14081(open), #14124(merged), #14141(closed), #14174(closed), #14180(open), #14185(open), #14186(open) | 同步最终/观察范围与未运行门禁；不移动创建周。 |
| [恢复与运维](../../feature/managed-agents/managed-agent-recovery-operations.md) | #13931(merged), #14039(merged), #14045(merged), #14059(merged), #14141(closed) | 原资源恢复与 closed fixture 观察分开。 |
| [客户端与事件](../../feature/managed-agents/managed-agent-client-surfaces.md) | #13936(merged), #13973(merged), #13996(merged), #14081(open) | 公共 UI 已合入；私有文本现面向 main 仍 open。 |
| [存储、事件与会话恢复](../../feature/managed-agents/managed-agent-storage-event-architecture.md) | #14069(merged), #14174(closed), #14180(open), #14185(open) | 已合入 V1/V2 基线与资源/SQL 时间观察分开。 |
| [Runtime Broker JDBC 中文](../../feature/managed-agents/managed-runtime-broker-jdbc.zh-CN.md) / [English](../../feature/managed-agents/managed-runtime-broker-jdbc.md) | #13996(merged), #14069(merged), #14081(open), #14180(open), #14185(open) | canonical V2/私有 authority 与未资格化文本、资源、时间方案。 |
| [完整工具结果中文](../../feature/managed-agents/managed-agent-tool-result-artifacts.zh-CN.md) / [English](../../feature/managed-agents/managed-agent-tool-result-artifacts.md) | #14124(merged) | captureBytes create/load、预算与真实云验收区分。 |
| [SDK](../../feature/sdk.md) | #14124(merged), #14186(open) | Java capture 字段与 server 静态规则/语法阻塞。 |

_按个人 PR 口径更新于 2026-10-15_
