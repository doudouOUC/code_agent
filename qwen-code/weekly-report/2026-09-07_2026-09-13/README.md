# qwen-code PRs · 2026-09-07 ~ 2026-09-13 (W37 周内累计)

> 本文件已整理 2026-09-07 至 2026-09-13（Asia/Shanghai）创建的 @doudouOUC 个人 PR。口径为 `QwenLM/qwen-code` 中 author 为 @doudouOUC 且 createdAt 落在对应北京时间日/周窗口内的 PR；只在窗口内更新、关闭或合入，但创建时间不在窗口内的 PR 不计入新增统计。open PR 只记录当前 diff 方案，不能视为 `main` 已落地能力。

**主题**: relaxed Conversations ownership runtime 切换、WebShell 历史浏览与全局 turn rail、CI/housekeeping 稳定性、Mem0 Auto Recall 与显式写入、Channel worktree 路由恢复与删除回收

**PR 统计**: 8 PRs - 6 merged / 2 open / 0 closed
**当前已合并 PR 代码量**: +11,678 / -516，121 个文件变更
**全量代码量**: +13,137 / -568，131 个文件变更
**类型分布**: feat ×5, fix ×3
**范围 (scope)**: serve/daemon ×3, web-shell ×3, channels ×2, external-context ×2, core/writer-lease ×1, ci ×1, docs/design ×5

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 代码量 | 文件数 | 创建时间(UTC) | 合并/关闭时间(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#11207](https://github.com/QwenLM/qwen-code/pull/11207) | ✅ merged | @doudouOUC | feat(serve): allow concurrent standalone daemons with session fencing | +2476/-265 | 43 | 09-06 16:05 | 09-07 15:52 |
| [#11208](https://github.com/QwenLM/qwen-code/pull/11208) | ✅ merged | @doudouOUC | feat(web-shell): add continuous history and compact turn navigation | +4591/-97 | 31 | 09-06 16:19 | 09-07 15:52 |
| [#11212](https://github.com/QwenLM/qwen-code/pull/11212) | ✅ merged | @doudouOUC | fix(ci): give web-shell E2E Smoke the ECS timeout allowance its siblings have | +26/-1 | 2 | 09-06 16:53 | 09-06 23:25 |
| [#11246](https://github.com/QwenLM/qwen-code/pull/11246) | ✅ merged | @doudouOUC | feat(external-context): Add opt-in auto recall for administrator-owned Mem0 dialects | +2018/-113 | 16 | 09-07 03:48 | 09-07 10:36 |
| [#11285](https://github.com/QwenLM/qwen-code/pull/11285) | ✅ merged | @doudouOUC | fix(cli): stop housekeeping hanging on a deleted bind mount | +78/-3 | 2 | 09-07 07:59 | 09-07 12:40 |
| [#11308](https://github.com/QwenLM/qwen-code/pull/11308) | 🟡 open | @doudouOUC | fix(channels): restore worktree-task routes through the managed load path | +404/-4 | 4 | 09-07 15:00 | — |
| [#11309](https://github.com/QwenLM/qwen-code/pull/11309) | 🟡 open | @doudouOUC | feat(cli): reap owned worktrees when daemon sessions are deleted | +1055/-48 | 6 | 09-07 15:01 | — |
| [#11311](https://github.com/QwenLM/qwen-code/pull/11311) | ✅ merged | @doudouOUC | feat(external-context): Add daemon memory writes | +2489/-37 | 27 | 09-07 15:09 | 09-07 16:34 |

---

## PR 解决问题、实现方式与 feature 处理

| PR | 解决了什么问题 | 最终怎么实现（open/closed 只登记当前观察） | 对应 feature 文档 |
|---|---|---|---|
| [#11207](https://github.com/QwenLM/qwen-code/pull/11207) | process-global Conversations owner 会让第二个 daemon 连无关 standalone session 也不能服务，Live publisher、删除 journal、scheduled controller 与同 session 写入又必须继续受控。 | 最终把长期全局 owner 改为 runtime 首次发布前的 legacy-owner 兼容检查，以 mandatory per-session writer lease 保护每个真实 writer；删除 journal 移到独立受检状态目录，Live 启动校验精确稳定 publisher，scheduled task保留唯一controller binding，WebShell 对 writer conflict 提供 session-local 显式重试。 | 已更新 daemon lifecycle、ACP writer fence、Scheduled Tasks 与 WebUI transport。完整实现见 [implementations/pr-11207.md](implementations/pr-11207.md)。 |
| [#11208](https://github.com/QwenLM/qwen-code/pull/11208) | #11054 只提供隔离历史数据层，浏览器仍不能连续滚动远端历史或从全量 turn 索引直接定位。 | 最终用 `TranscriptViewport`/hook 把历史 range 转成冻结 render window，在分页/淘汰时按可见记录保持阅读锚点；64px compact rail 虚拟化全量 turn ticks，按需 locate/fetch 远端 turn，返回最新后再恢复 live mutation surface。 | 已更新 WebUI transport 与 daemon 总览。完整实现见 [implementations/pr-11208.md](implementations/pr-11208.md)。 |
| [#11212](https://github.com/QwenLM/qwen-code/pull/11212) | self-hosted ECS 争用可让 WebShell E2E smoke 在安装/浏览器阶段整体变慢，固定 20 分钟上限误杀；hosted runner 又不应放宽真实 hang。 | 最终让 timeout 表达式按 runner 路由求值：self-hosted 40 分钟、hosted 仍 20 分钟，并扩展 workflow 属性测试覆盖显式 hosted、缺失输出 fallback 与 self-hosted 三种情况。 | CI-only 变更，不新增长期 feature 能力。完整实现见 [implementations/pr-11212.md](implementations/pr-11212.md)。 |
| [#11246](https://github.com/QwenLM/qwen-code/pull/11246) | configurable Mem0 package 只有模型主动调用的 `context_search`，管理员无法在合格用户轮次前确定性召回。 | 最终新增独立安装的 schemaVersion 3 `UserPromptSubmit` Hook profile：绑定 canonical repository root，查询只取 `submitted_prompt` 并做有界脱敏，复用 closed Dialect V1 请求引擎，最多五条结果以 `untrusted_external_context` 注入；默认 manifest 与 v2 MCP 保持只读。 | 已更新 [external-context-provider.md](../../feature/external-context-provider.md)。完整实现见 [implementations/pr-11246.md](implementations/pr-11246.md)。 |
| [#11285](https://github.com/QwenLM/qwen-code/pull/11285) | deleted bind mount 内的 recursive `mkdir` 会把 `ENOENT` 当父目录缺失而无界重试，使孤儿 sandbox 的 housekeeping 永不 settle，甚至持续占满 CPU。 | 最终只创建 `lockPath` 的单层父目录；现有三个调用点的父级均已存在，异常 mount 会快速 `ENOENT` 并沿既有 catch 降级为跳过，本来不存在的 qwen 目录仍以 0700 创建。 | 窄范围 CLI housekeeping 修复，不新增 feature 入口。完整实现见 [implementations/pr-11285.md](implementations/pr-11285.md)。 |
| [#11308](https://github.com/QwenLM/qwen-code/pull/11308) | Channel worker 冷启动用 worktree cwd 走 generic load，daemon 无法将其匹配为注册 workspace，导致 worktree task route 以 `workspace_mismatch` 被丢弃。 | 当前 open diff在 route 中持久化 `isolation:'worktree'` 与 workspace root；eager restore 改走 managed load 并重新验证 daemon attestation、处理 superseded redirect，lazy restore也再水合相同 metadata。尚未进入 `main`。 | 已在 [channel-adapters.md](../../feature/channel-adapters.md) 登记 open 方案。完整观察见 [implementations/pr-11308.md](implementations/pr-11308.md)。 |
| [#11309](https://github.com/QwenLM/qwen-code/pull/11309) | 删除 worktree-owning daemon session 只删 record/sidecar，checkout、marker、git registration 与 branch 会永久残留，既有 stale sweep 又刻意跳过 named worktree。 | 当前 open diff在删 record 前于共享 worktree lock 下核验 sidecar、marker、containment 与跨 session sharing，确认删除后只清理无未提交工作的 checkout，并永不强删 branch；任何歧义都保留并记录原因。尚未进入 `main`。 | 已在 Channel 与 daemon lifecycle 登记 open 清理方案。完整观察见 [implementations/pr-11309.md](implementations/pr-11309.md)。 |
| [#11311](https://github.com/QwenLM/qwen-code/pull/11311) | configurable Mem0 extension 缺少可信 daemon workspace 的显式保存入口，通用 MCP 审批还可能因参数文本等于 title 而隐藏待写正文。 | 最终新增独立 V4 writer profile 与 bounded create dialect，每次批准后原样发送一条 user message 并固定 `infer:false`，将 stored/accepted/unknown 分开且不自动重试；WebShell 对无专用 preview 的 MCP 审批展示完整转义参数。 | 已更新 External Context 与 WebUI transport。完整实现见 [implementations/pr-11311.md](implementations/pr-11311.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [daemon session lifecycle](../../feature/daemon-serve-mode/03-session-lifecycle.md) | #11207(merged), #11285(merged), #11309(open) | 登记 relaxed Conversations ownership 最终切换、housekeeping fail-fast 修复与 open worktree 删除回收。 |
| [daemon ACP bridge and permission](../../feature/daemon-serve-mode/07-acp-bridge-and-permission.md) | #11207(merged) | 将 global owner cutover 与 mandatory session writer fence 的关系更新为已落地。 |
| [Scheduled Tasks](../../feature/scheduled-tasks.md) | #11207(merged) | 更新relaxed ownership cutover后mandatory lease、唯一controller binding与at-least-once边界。 |
| [WebUI and transport](../../feature/daemon-serve-mode/11-webui-and-transport.md) | #11207(merged), #11208(merged), #11311(merged) | 登记 writer-blocked 恢复、连续历史 viewport/compact rail，以及 generic MCP 参数预览最终实现。 |
| [Channel adapters](../../feature/channel-adapters.md) | #11308(open), #11309(open) | 记录 worktree route managed restore 与 ownership-verified delete cleanup，均不写成 `main` 能力。 |
| [Direct External Context](../../feature/external-context-provider.md) | #11246(merged), #11311(merged) | 增补 configurable Mem0 Auto Recall 与 daemon writer 最终实现。 |

_按个人 PR 口径更新于 2026-09-08_
