# qwen-code PRs · 2026-10-05 ~ 2026-10-11 (W41 周内累计)

> 本文件已整理 2026-10-05 至 2026-10-11（Asia/Shanghai）创建的 @doudouOUC 个人 PR。以 author 和 createdAt 决定归属，更新/关闭/合入时间不用于新增统计；open 为当前 diff，closed 未合入为历史方案，均不能作为 `main` 能力。本次创建窗口截至 2026-10-08 23:59:59。状态与规模快照更新于 2026-10-09，相关主干 `55ee50d34e55`。

**主题**: 私有 CSI 方案、JDBC 历史保留、异步 publication、迁移诊断、Hook 退休与公开 Shell 审批

**PR 统计**: 6 PRs - 1 merged / 5 open / 0 closed
**当前已合并 PR 代码量**: +103 / -2，3 个文件变更
**全量代码量**: +53,734 / -1,544，295 个文件变更
**类型分布**: feat ×4, fix ×2
**范围 (scope)**: runtime ×1, runtime-broker ×1, managed-agent ×4

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 代码量 | 文件数 | 创建时间(UTC) | 合并/关闭时间(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#13526](https://github.com/QwenLM/qwen-code/pull/13526) | 🟡 open | @doudouOUC | feat(runtime): add private CSI tool runtime execution | +46357/-1381 | 207 | 10-06 16:54 | - |
| [#13642](https://github.com/QwenLM/qwen-code/pull/13642) | 🟡 open | @doudouOUC | feat(runtime-broker): add bounded retention for terminal JDBC history | +2736/-11 | 28 | 10-08 03:06 | - |
| [#13654](https://github.com/QwenLM/qwen-code/pull/13654) | 🟡 open | @doudouOUC | feat(managed-agent): verify tool publications asynchronously | +2281/-60 | 19 | 10-08 05:09 | - |
| [#13655](https://github.com/QwenLM/qwen-code/pull/13655) | ✅ merged | @doudouOUC | fix(managed-agent): clear successful Workspace migration diagnostics | +103/-2 | 3 | 10-08 05:14 | 10-08 08:10 |
| [#13673](https://github.com/QwenLM/qwen-code/pull/13673) | 🟡 open | @doudouOUC | fix(managed-agent): recover original Hook sessions during Workspace retirement | +989/-21 | 13 | 10-08 10:33 | - |
| [#13674](https://github.com/QwenLM/qwen-code/pull/13674) | 🟡 open | @doudouOUC | feat(managed-agent): admit public foreground Shell with mandatory approval | +1268/-69 | 25 | 10-08 11:08 | - |

---

## PR 解决问题、实现方式与 feature 处理

| PR | 解决了什么问题 | 最终怎么实现（open/closed 只登记当前观察） | 对应 feature 文档 |
|---|---|---|---|
| [#13526](https://github.com/QwenLM/qwen-code/pull/13526) | 已合入 CSI worker 基础仍缺 Hosted 私有对话、文件 history 与原 activation 的完整证明。 | 当前 diff 持久冻结原工具批次、intent 与 await_runtime 后真实执行 Read/Write/Edit；worker 核验原证据及 prepared history，完整 receipt/消息提交后才消费等待结果。冷恢复只继续已结算结果，不重放原工具。 | 已同步Managed Agents的open口径；完整观察见 [implementations/pr-13526.md](implementations/pr-13526.md)。 |
| [#13642](https://github.com/QwenLM/qwen-code/pull/13642) | 终态 binding/session/execution 历史无上限增长，直接删除会破坏 Workspace、publication 和子运行引用。 | 当前 diff 的 JdbcRuntimeRetention 以数据库时间、游标和有界 batch 分阶段扫描终态记录，在 slot/行锁内核对年龄、状态和 claim；Managed reference guard 排除仍被 holder/publication/未结算 lineage 引用的记录。 | 已同步Managed Agents的open口径；完整观察见 [implementations/pr-13642.md](implementations/pr-13642.md)。 |
| [#13654](https://github.com/QwenLM/qwen-code/pull/13654) | 大 publication 的 seal/terminal 验证占据 HTTP 请求和线程，固定请求预算可能让完整输出无法及时结算。 | 当前 diff 先持久提交 PENDING verification operation，再由有界 verifier executor claim/验证；Runtime 轮询原 operation status，claim epoch/deadline fence 防止旧验证者提交。 | 已同步完整工具结果的open口径；完整观察见 [implementations/pr-13654.md](implementations/pr-13654.md)。 |
| [#13655](https://github.com/QwenLM/qwen-code/pull/13655) | 迁移失败后重试成功，last_error_code 若残留，会让操作员把已完成阶段误读为仍失败。 | migration 成功状态更新同时将 last_error_code 置空；保持原 operation/result 和状态校验，测试覆盖失败后成功路径。 | 已同步恢复与运维的merged口径；完整实现见 [implementations/pr-13655.md](implementations/pr-13655.md)。 |
| [#13673](https://github.com/QwenLM/qwen-code/pull/13673) | Hook 的原 Runtime Session 在冷恢复/退休时缺 live handle，直接 release 会遗留 holder 或误删不确定资源。 | 当前 diff 根据原 binding/session 观察并使用已持久 drain receipt；在无活跃 execution、stop 证据和精确 holder 匹配下，同事务结算 stopped Session release。无法确认的原资源继续阻塞。 | 已同步恢复与运维的open口径；完整观察见 [implementations/pr-13673.md](implementations/pr-13673.md)。 |
| [#13674](https://github.com/QwenLM/qwen-code/pull/13674) | 公共 Workspace 创建仍使用 files profile，开放 Shell 若没有部署门禁与 asking mode 会绕过用户确认。 | 当前 diff 以独立 Shell 开关选定 shell/1，持久并复核 default/auto-edit；fresh sending 还需 foregroundShell capability。Shell 开关关闭保留原 key/取消结算，但不绕过 Workspace files 总准入开关；Shell 生命周期仍不开放。 | 已同步Managed Agents的open口径；完整观察见 [implementations/pr-13674.md](implementations/pr-13674.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [Managed Agents](../../feature/managed-agents/README.md) | #13526(open), #13642(open), #13674(open) | 按最终合入/当前方案同步状态和关键边界；详情在逐 PR 实现文档。 |
| [完整工具结果](../../feature/managed-agents/managed-agent-tool-result-artifacts.zh-CN.md) | #13654(open) | 按最终合入/当前方案同步状态和关键边界；详情在逐 PR 实现文档。 |
| [恢复与运维](../../feature/managed-agents/managed-agent-recovery-operations.md) | #13655(merged), #13673(open) | 按最终合入/当前方案同步状态和关键边界；详情在逐 PR 实现文档。 |

_按个人 PR 口径更新于 2026-10-09_
