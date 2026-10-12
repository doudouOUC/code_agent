# qwen-code PRs · 2026-10-12 ~ 2026-10-18 (W42 日更)

> 本文件已整理北京时间 2026-10-12 创建的 @doudouOUC 个人 PR，UTC 半开窗口 `[2026-10-11T16:00:00Z, 2026-10-12T16:00:00Z)`。按 author/createdAt 归属，不按更新、关闭或合入日期补收。当前周尚未结束；本次快照取 2026-10-13，主干 `18f80f56666a`。open 仅当前 diff，不是 `main` 能力；前一周后续合入的 PR 仍留 W41。

**主题**: Shell/MCP 生命周期 L4、Managed 子 Agent 任务面板、标准聊天 UI 复用

**PR 统计**: 3 PRs - 1 merged / 2 open / 0 closed
**当前已合并 PR 代码量**: +3,062 / -7，28 个文件变更
**全量代码量**: +7,516 / -479，107 个文件变更
**类型分布**: feat ×3
**范围 (scope)**: managed-agent ×1, web-shell ×2

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 代码量 | 文件数 | 创建时间(UTC) | 合并/关闭时间(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#13931](https://github.com/QwenLM/qwen-code/pull/13931) | 🟡 open | @doudouOUC | feat(managed-agent): add L4 Shell and MCP session lifecycle | +2666/-324 | 48 | 10-12 00:30 | - |
| [#13936](https://github.com/QwenLM/qwen-code/pull/13936) | ✅ merged | @doudouOUC | feat(web-shell): add Managed child Agent task panel | +3062/-7 | 28 | 10-12 03:22 | 10-12 13:02 |
| [#13973](https://github.com/QwenLM/qwen-code/pull/13973) | 🟡 open | @doudouOUC | feat(web-shell): Reuse standard UI for Managed Agents | +1788/-148 | 31 | 10-12 12:03 | - |

---

## PR 解决问题、实现方式与 feature 处理

| PR | 解决了什么问题 | 最终怎么实现（open/closed 只登记当前观察） | 对应 feature 文档 |
|---|---|---|---|
| [#13931](https://github.com/QwenLM/qwen-code/pull/13931) | files 回执不能证明 Shell/MCP 原资源及完整输出已安全关闭。 | 当前 diff 对精确 profile 默认关闭 v2；先存 effects，再以原 claim 做资源屏障，尾部保全但抑制通知，原连接/owner 和输出闭包验证后才完成。 | 增补恢复与运维、Managed Agents 的 open 口径；完整观察见 [implementations/pr-13931.md](implementations/pr-13931.md)。 |
| [#13936](https://github.com/QwenLM/qwen-code/pull/13936) | 子 Agent 状态/产物缺入口，取消丢响应或提前显示终态会误导用户。 | 已合入：复用原 task API/分页，child_agent 侧栏或 Dialog；原取消键先持久再发，operation 接受后仍查询 task 真终态，保留未知意图与权限撤销后的恢复入口。 | 更新客户端与事件、Managed Agents 的 merged 范围；完整实现见 [implementations/pr-13936.md](implementations/pr-13936.md)。 |
| [#13973](https://github.com/QwenLM/qwen-code/pull/13973) | 独立 Managed 表单与标准聊天割裂，首次输入和草稿重试易重复/丢失。 | 当前 diff 复用标准 composer/欢迎页/selector，首次输入一次创建，原 payload/key 持久重试；受理后精确清原草稿，模型创建时冻结，禁用 daemon 专属特性。 | 更新客户端与事件、Managed Agents 的 open 观察；完整观察见 [implementations/pr-13973.md](implementations/pr-13973.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [Managed Agents](../../feature/managed-agents/README.md) | #13931(open), #13936(merged), #13973(open) | 同步当前能力、方案与未运行门禁边界。 |
| [恢复与运维](../../feature/managed-agents/managed-agent-recovery-operations.md) | #13931(open) | effects 与资源屏障、精确 profile v2 默认关闭。 |
| [客户端与事件](../../feature/managed-agents/managed-agent-client-surfaces.md) | #13936(merged), #13973(open) | child_agent 原分页/取消恢复与标准 UI 原意图/草稿身份分开说明。 |

_按个人 PR 口径更新于 2026-10-13_
