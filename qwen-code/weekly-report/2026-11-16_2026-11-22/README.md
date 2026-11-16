# qwen-code PRs · 2026-11-16 ~ 2026-11-22 (W47 日更至 11-16)

> 本次日更收录北京时间 2026-11-16 00:00:00 至 23:59:59 创建的 @doudouOUC 个人 PR，UTC 窗口 `[2026-11-15T16:00:00Z, 2026-11-16T16:00:00Z)`；按 author 与 createdAt 独立分页核验 8 个，尚非完整周报。不按更新/关闭/合入时间补收其他周或其他作者 PR。状态、规模与 head 为北京时间 2026-11-17 凌晨快照，对照 main `1e455fd68a26`；open 只登记当前 diff，不能作为 main 能力承诺。#17450 仅 merged 到 `stack/17247-external-content-base`，不在 main；4 merged 的统计含此功能分支项，主干已合入 3 个。

**主题**: Kubernetes/CSI 冷源归档与准备等待已入 main；content child 仅功能分支 merged，其余 Public API/恢复/共享 owner 候选

**PR 统计**: 8 PRs - 4 merged / 4 open / 0 closed
**当前已合并 PR 代码量**: +6,626 / -6,669，444 个文件变更
**全量代码量**: +30,473 / -17,873，555 个文件变更
**类型分布**: fix ×5, feat ×2, refactor ×1
**范围 (scope)**: managed-agent ×7, serve ×1

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 代码量 | 文件数 | 创建时间(UTC) | 合并/关闭时间(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#17415](https://github.com/QwenLM/qwen-code/pull/17415) | merged | @doudouOUC | refactor(managed-agent): archive Kubernetes runtime and resident CSI backend | +1534/-6374 | 338 | 2026-11-16 04:44:20 | 2026-11-16 08:13:25 |
| [#17439](https://github.com/QwenLM/qwen-code/pull/17439) | merged | @doudouOUC | fix(serve): accept hook description and statusMessage during extension preparation | +507/-3 | 5 | 2026-11-16 09:01:32 | 2026-11-16 12:46:00 |
| [#17449](https://github.com/QwenLM/qwen-code/pull/17449) | open | @doudouOUC | feat(managed-agent): Public API parity (slice 4a) and Web Shell consumer migration (slice 4b) | +21613/-11070 | 71 | 2026-11-16 10:49:37 | - |
| [#17450](https://github.com/QwenLM/qwen-code/pull/17450) | merged | @doudouOUC | feat(managed-agent): Support external content child agents | +3699/-253 | 93 | 2026-11-16 11:12:56 | 2026-11-16 15:08:05 |
| [#17457](https://github.com/QwenLM/qwen-code/pull/17457) | merged | @doudouOUC | fix(managed-agent): Wait for workspace preparation before turn admission | +886/-39 | 8 | 2026-11-16 11:51:15 | 2026-11-16 12:43:52 |
| [#17459](https://github.com/QwenLM/qwen-code/pull/17459) | open | @doudouOUC | fix(managed-agent): recover timed-out hosted journal commits | +807/-40 | 14 | 2026-11-16 12:02:16 | - |
| [#17466](https://github.com/QwenLM/qwen-code/pull/17466) | open | @doudouOUC | fix(managed-agent): recover macOS workspaces after reboot | +1294/-89 | 23 | 2026-11-16 13:42:44 | - |
| [#17480](https://github.com/QwenLM/qwen-code/pull/17480) | open | @doudouOUC | fix(managed-agent): resolve shared workspace owners for extension control | +133/-5 | 3 | 2026-11-16 15:28:12 | - |

---

## PR 解决问题、实现方式与 feature 处理

| PR | 解决了什么问题 | 最终怎么实现（open/closed 只登记当前观察） | 对应 feature 文档 |
|---|---|---|---|
| [#17415](https://github.com/QwenLM/qwen-code/pull/17415) | Kubernetes Runtime、Resident Workspace/CSI 与 EndpointSlice Harness discovery 混在日常 Java reactor 内，使 local/SSH/external/static 部署也承担专属配置、schema 字段和锁/验证路径维护成本。 | 已合入：Java 后端、CSI/resident 与发现器移冷归档，活动 V1 去专属字段，通用校验留活动模块。 | 更新Feature 总览、Managed Agents、Session 存储、存储事件架构、恢复与运维、配置与扩展；完整实现/观察见 [implementations/pr-17415.md](implementations/pr-17415.md)。 |
| [#17439](https://github.com/QwenLM/qwen-code/pull/17439) | 合法扩展的 hook description/statusMessage 被 worker 的闭集 parser 当未知字段拒绝，HTTP hook 的 if 条件也被挡在准备阶段，导致包无法完成预备。 | 已合入：闭集接受字符串展示元数据与 HTTP if；公开 control view 仍裁剪私有字段。 | 更新Feature 总览、Managed Agents、配置与扩展；完整实现/观察见 [implementations/pr-17439.md](implementations/pr-17439.md)。 |
| [#17449](https://github.com/QwenLM/qwen-code/pull/17449) | Web Shell 依赖独立 camelCase 私有路由和生成类型，Public API 缺模型/审批/能力、文件和 transcript 等 UI 所需形状，双契约持续漂移。 | 当前 open diff：补 Public wire/能力与路由、迁移 Web Shell adapter/类型和代理；保留兼容入口。 | 更新Feature 总览、Managed Agents、客户端；完整实现/观察见 [implementations/pr-17449.md](implementations/pr-17449.md)。 |
| [#17450](https://github.com/QwenLM/qwen-code/pull/17450) | 外部文件 Workspace 原只支持普通文件任务，无法在保持原外部执行 actor 与受限工具面的同时提供持久、可恢复的公开子 Agent 和内容扩展包。 | 仅功能分支 merged：默认关闭的外部 content profile、精确资源闭包与原 writer/config/父子 actor 授权；未在 main。 | 更新Feature 总览、Managed Agents、配置与扩展、Session 存储、存储事件架构、客户端、恢复与运维；完整实现/观察见 [implementations/pr-17450.md](implementations/pr-17450.md)。 |
| [#17457](https://github.com/QwenLM/qwen-code/pull/17457) | Runtime warm 原是 fire-and-forget，首次 Workspace 较慢时 Harness load 先遭拒绝，消耗 Turn pre-admission retry，可能在环境尚未就绪时过早失败。 | 已合入：准入前等待准备，预算内重试并持续核取消/失租，不取消共享 warm。 | 更新Feature 总览、Managed Agents、恢复与运维、存储事件架构；完整实现/观察见 [implementations/pr-17457.md](implementations/pr-17457.md)。 |
| [#17459](https://github.com/QwenLM/qwen-code/pull/17459) | append 丢答后仅看 head 未变化并不能证明原事务没提交，直接丢批次或重新编码会与迟到提交冲突，把本可恢复的 writer 永久 fence。 | 当前 open diff：保存精确 append records，settle 后原字节复投，区分未知、确定拒绝和永久失败。 | 更新Feature 总览、Managed Agents、Session 存储、恢复与运维、存储事件架构；完整实现/观察见 [implementations/pr-17459.md](implementations/pr-17459.md)。 |
| [#17466](https://github.com/QwenLM/qwen-code/pull/17466) | macOS 的设备号可能跨重启变化，原 numeric dev 身份和被排除的 reboot 判定使未移动的 Workspace/worktree 也被当成变更或无法回收旧 Runtime。 | 当前 open diff：VolumeUUID 稳定身份与显式离线 plan/fence/retire/complete，拒自动绕校验。 | 更新Feature 总览、Managed Agents、恢复与运维、Session 存储；完整实现/观察见 [implementations/pr-17466.md](implementations/pr-17466.md)。 |
| [#17480](https://github.com/QwenLM/qwen-code/pull/17480) | findByHarnessSession 只适用于 session-isolated binding；共享 Workspace 没有 Harness isolation key，identity-free extension status 因此查不到原 READY owner。 | 当前 open diff：共享 scope 按完整 request slot 找原 READY owner，保身份/drain 围栏且不创建 Runtime。 | 更新Feature 总览、Managed Agents、配置与扩展、恢复与运维、存储事件架构；完整实现/观察见 [implementations/pr-17480.md](implementations/pr-17480.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [Feature 总览](../../feature/README.md) | #17415(merged), #17439(merged), #17449(open), #17450(merged), #17457(merged), #17459(open), #17466(open), #17480(open) | 增量同步已合入与候选边界，保留历史日期段。 |
| [Managed Agents](../../feature/managed-agents/README.md) | #17415(merged), #17439(merged), #17449(open), #17450(merged), #17457(merged), #17459(open), #17466(open), #17480(open) | 增量同步已合入与候选边界，保留历史日期段。 |
| [Session 存储](../../feature/managed-agents/managed-agent-session-storage.md) | #17415(merged), #17450(merged), #17459(open), #17466(open) | 增量同步已合入与候选边界，保留历史日期段。 |
| [存储事件架构](../../feature/managed-agents/managed-agent-storage-event-architecture.md) | #17415(merged), #17450(merged), #17457(merged), #17459(open), #17480(open) | 增量同步已合入与候选边界，保留历史日期段。 |
| [恢复与运维](../../feature/managed-agents/managed-agent-recovery-operations.md) | #17415(merged), #17450(merged), #17457(merged), #17459(open), #17466(open), #17480(open) | 增量同步已合入与候选边界，保留历史日期段。 |
| [配置与扩展](../../feature/managed-agents/managed-agent-config-extensions.md) | #17415(merged), #17439(merged), #17450(merged), #17480(open) | 增量同步已合入与候选边界，保留历史日期段。 |
| [客户端](../../feature/managed-agents/managed-agent-client-surfaces.md) | #17449(open), #17450(merged) | 增量同步已合入与候选边界，保留历史日期段。 |

_按个人 PR 口径更新于 2026-11-17；只核 diff、文件、源码与测试定义，未运行产品测试、CI、数据库、真实 provider、浏览器或平台验收。_
