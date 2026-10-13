# qwen-code PRs · 2026-10-12 ~ 2026-10-18 (W42 日更)

> 本文件已整理北京时间 2026-10-12 至 2026-10-13 创建的 @doudouOUC 个人 PR，UTC 半开窗口 `[2026-10-11T16:00:00Z, 2026-10-13T16:00:00Z)`。按 author/createdAt 归属，不按更新、关闭或合入日期补收。当前周尚未结束；本次快照取 2026-10-14，主干 `96cfa244917c`。open 仅当前 diff，不是 `main` 能力；前一周后续合入的 PR 仍留 W41。#14081 的规模相对其 CSI authority base branch，逐 PR 规模累加不能视为去重后的 main 增量。

**主题**: Shell/MCP L4 与原资源恢复、Managed 任务面板与标准 UI、私有 CSI SQL/文本接入、新库 32 表方案

**PR 统计**: 9 PRs - 6 merged / 3 open / 0 closed
**当前已合并 PR 代码量**: +9,910 / -638，135 个文件变更
**全量代码量**: +54,601 / -11,465，571 个文件变更
**类型分布**: feat ×6, fix ×3
**范围 (scope)**: managed-agent ×4, web-shell ×2, sdk-java ×1, serve ×2

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 代码量 | 文件数 | 创建时间(UTC) | 合并/关闭时间(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#13931](https://github.com/QwenLM/qwen-code/pull/13931) | ✅ merged | @doudouOUC | feat(managed-agent): add L4 Shell and MCP session lifecycle | +3110/-346 | 52 | 10-12 00:30 | 10-13 08:17 |
| [#13936](https://github.com/QwenLM/qwen-code/pull/13936) | ✅ merged | @doudouOUC | feat(web-shell): add Managed child Agent task panel | +3062/-7 | 28 | 10-12 03:22 | 10-12 13:02 |
| [#13973](https://github.com/QwenLM/qwen-code/pull/13973) | ✅ merged | @doudouOUC | feat(web-shell): Reuse standard UI for Managed Agents | +1992/-155 | 31 | 10-12 12:03 | 10-13 07:30 |
| [#13996](https://github.com/QwenLM/qwen-code/pull/13996) | 🟡 open | @doudouOUC | feat(sdk-java): add private CSI Session and native SQL authority | +17323/-516 | 97 | 10-12 18:04 | - |
| [#14039](https://github.com/QwenLM/qwen-code/pull/14039) | ✅ merged | @doudouOUC | fix(managed-agent): recover lost lifecycle detach replies | +1236/-1 | 10 | 10-13 09:48 | 10-13 14:06 |
| [#14045](https://github.com/QwenLM/qwen-code/pull/14045) | ✅ merged | @doudouOUC | fix(managed-agent): close shell profiles after native file calls | +114/-9 | 8 | 10-13 11:16 | 10-13 14:05 |
| [#14059](https://github.com/QwenLM/qwen-code/pull/14059) | ✅ merged | @doudouOUC | fix(serve): resume committed file results after runtime retirement | +396/-120 | 6 | 10-13 12:45 | 10-13 14:07 |
| [#14069](https://github.com/QwenLM/qwen-code/pull/14069) | 🟡 open | @doudouOUC | feat(managed-agent): consolidate persistence into a 32-table baseline | +25551/-10295 | 319 | 10-13 13:47 | - |
| [#14081](https://github.com/QwenLM/qwen-code/pull/14081) | 🟡 open | @doudouOUC | feat(serve): attach private CSI Sessions to Hosted text turns | +1817/-16 | 20 | 10-13 15:06 | - |

---

## PR 解决问题、实现方式与 feature 处理

| PR | 解决了什么问题 | 最终怎么实现（open/closed 只登记当前观察） | 对应 feature 文档 |
|---|---|---|---|
| [#13931](https://github.com/QwenLM/qwen-code/pull/13931) | files 回执不能证明 Shell/MCP 原资源及完整输出已安全关闭。 | 已合入：精确 profile v2 默认关闭；effects 后以原 claim 做资源屏障，验证输出闭包，可信原 stopped receipt 才允许 LOST→DRAINING，有效原 cleanup claim 允许 writer 租约到期后的 seal。 | 更新恢复与运维、Managed Agents 的最终口径；完整实现见 [implementations/pr-13931.md](implementations/pr-13931.md)。 |
| [#13936](https://github.com/QwenLM/qwen-code/pull/13936) | 子 Agent 状态/产物缺入口，取消丢响应或提前显示终态会误导用户。 | 已合入：复用原 task API/分页，child_agent 侧栏或 Dialog；原取消键先持久再发，operation 接受后仍查询 task 真终态，保留未知意图与权限撤销后的恢复入口。 | 更新客户端与事件、Managed Agents 的 merged 范围；完整实现见 [implementations/pr-13936.md](implementations/pr-13936.md)。 |
| [#13973](https://github.com/QwenLM/qwen-code/pull/13973) | 独立 Managed 表单与标准聊天割裂，首次输入和草稿重试易重复/丢失。 | 已合入：标准 composer/欢迎页/selector，一次创建、原 payload/key 重试；受理后精确清原草稿，放弃恢复原初始输入并刷新列表，不宣称服务端未受理。 | 更新客户端与事件、Managed Agents 的最终实现；完整实现见 [implementations/pr-13973.md](implementations/pr-13973.md)。 |
| [#13996](https://github.com/QwenLM/qwen-code/pull/13996) | 私有 worker 的 Session/writer/grant/history 缺少同源 SQL authority，legacy mutation 可破坏原归属。 | 当前 diff 离线创建原 CSI Session，阻止未资格化 mutation；同连接锁定 READY/原身份，journal 提交核验 genesis/activation/有限批次，认证原结果与 read lease。 | 增补 JDBC 双语、客户端与总览的 open 私有边界；完整观察见 [implementations/pr-13996.md](implementations/pr-13996.md)。 |
| [#14039](https://github.com/QwenLM/qwen-code/pull/14039) | detach 成功但丢响应留下旧附件，原清理重试反复 404。 | 已合入：仅 v2 非 effects 404 条件移除原 AttachmentRef，仍抛原错误；下一次从 SQL 原 authority cleanup-only load，不将 404 当完成。 | 更新恢复与运维、总览；完整实现见 [implementations/pr-14039.md](implementations/pr-14039.md)。 |
| [#14045](https://github.com/QwenLM/qwen-code/pull/14045) | Shell 内 deferred 原生文件调用没有 Shell publication，合法关闭被误阻塞。 | 已合入：核验原 scoped input/payload hash，仅已结算且无 protocol/publication 的四种 deferred 文件调用免 Shell source；owner/真实 Shell 输出证明保留。 | 更新恢复与运维、总览；完整实现见 [implementations/pr-14045.md](implementations/pr-14045.md)。 |
| [#14059](https://github.com/QwenLM/qwen-code/pull/14059) | 原 Runtime 退役后已提交文件结果无法续接，重新 acquire 可能诱发二次效果。 | 已合入：限定 files results_ready/settled/history，复核 owed 原 binding/generation 释放与全部 outcome；只消费原结果，不再 acquire/运行工具。 | 增补 G3 恢复边界与总览；完整实现见 [implementations/pr-14059.md](implementations/pr-14059.md)。 |
| [#14069](https://github.com/QwenLM/qwen-code/pull/14069) | 表族扩展和多套初始化路径增加维护复杂度，粗暴缩表会破坏事务与恢复。 | 当前 diff 固定新库 32 表 typed catalog，验证优先于 Flyway；保留独立 fence/receipt/lease，分页快照与受保护 inline 投影 GC，不原地升级旧库。 | 增补存储、JDBC 双语与总览；完整观察见 [implementations/pr-14069.md](implementations/pr-14069.md)。 |
| [#14081](https://github.com/QwenLM/qwen-code/pull/14081) | 私有 CSI 文本误走普通 owner/close 会替换写者或 seal 原 authority。 | 当前 stacked diff 以私有 attach/text/history 和 fresh 原 admission 接纯文本，续租失败阻塞；stopLocal 不 seal/release，不装工具或公共入口。 | 增补客户端、JDBC 双语与总览；完整观察见 [implementations/pr-14081.md](implementations/pr-14081.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [Managed Agents](../../feature/managed-agents/README.md) | #13931(merged), #13936(merged), #13973(merged), #13996(open), #14039(merged), #14045(merged), #14059(merged), #14069(open), #14081(open) | 同步当前能力、叠加方案与未运行门禁边界。 |
| [恢复与运维](../../feature/managed-agents/managed-agent-recovery-operations.md) | #13931(merged), #14039(merged), #14045(merged), #14059(merged) | L4 最终资源证明、丢 detach、deferred 文件关闭与退役后原结果续接。 |
| [客户端与事件](../../feature/managed-agents/managed-agent-client-surfaces.md) | #13936(merged), #13973(merged), #13996(open), #14081(open) | 公共任务/标准 UI 与私有 stacked CSI 文本入口分开说明。 |
| [存储、事件与会话恢复](../../feature/managed-agents/managed-agent-storage-event-architecture.md) | #14069(open) | fresh database canonical catalog、分页/GC/read lease 与切换边界。 |
| [Runtime Broker JDBC 中文](../../feature/managed-agents/managed-runtime-broker-jdbc.zh-CN.md) / [English](../../feature/managed-agents/managed-runtime-broker-jdbc.md) | #13996(open), #14069(open), #14081(open) | 原 SQL authority、新库基线与私有文本叠加，不宣布生产 CSI/retention 已开放。 |

_按个人 PR 口径更新于 2026-10-14_
