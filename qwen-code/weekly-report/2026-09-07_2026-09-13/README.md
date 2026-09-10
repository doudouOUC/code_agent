# qwen-code PRs · 2026-09-07 ~ 2026-09-13 (W37 周内累计)

> 本文件已整理 2026-09-07 至 2026-09-13（Asia/Shanghai）创建的 @doudouOUC 个人 PR。口径为 `QwenLM/qwen-code` 中 author 为 @doudouOUC 且 createdAt 落在对应北京时间日/周窗口内的 PR；只在窗口内更新、关闭或合入，但创建时间不在窗口内的 PR 不计入新增统计。open PR 只记录当前 diff 方案，不能视为 `main` 已落地能力。

**主题**: relaxed Conversations ownership runtime 切换、WebShell 历史浏览/轮询/浏览器通知与点击导航、CI/housekeeping 稳定性、Mem0 Auto Recall/写入/删除、ACP submitted prompt provenance、Channel worktree 路由恢复与删除回收、workspace 容量策略解耦与256注册扩容

**PR 统计**: 18 PRs - 17 merged / 1 open / 0 closed
**当前已合并 PR 代码量**: +23,655 / -1,000，276 个文件变更
**全量代码量**: +25,920 / -1,175，299 个文件变更
**类型分布**: feat ×9, fix ×7, refactor ×1, perf ×1
**范围 (scope)**: serve/daemon ×8, web-shell ×9, channels ×3, external-context ×5, core/writer-lease ×1, ci ×1, docs/design ×12

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 代码量 | 文件数 | 创建时间(UTC) | 合并/关闭时间(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#11207](https://github.com/QwenLM/qwen-code/pull/11207) | ✅ merged | @doudouOUC | feat(serve): allow concurrent standalone daemons with session fencing | +2476/-265 | 43 | 09-06 16:05 | 09-07 15:52 |
| [#11208](https://github.com/QwenLM/qwen-code/pull/11208) | ✅ merged | @doudouOUC | feat(web-shell): add continuous history and compact turn navigation | +4591/-97 | 31 | 09-06 16:19 | 09-07 15:52 |
| [#11212](https://github.com/QwenLM/qwen-code/pull/11212) | ✅ merged | @doudouOUC | fix(ci): give web-shell E2E Smoke the ECS timeout allowance its siblings have | +26/-1 | 2 | 09-06 16:53 | 09-06 23:25 |
| [#11246](https://github.com/QwenLM/qwen-code/pull/11246) | ✅ merged | @doudouOUC | feat(external-context): Add opt-in auto recall for administrator-owned Mem0 dialects | +2018/-113 | 16 | 09-07 03:48 | 09-07 10:36 |
| [#11285](https://github.com/QwenLM/qwen-code/pull/11285) | ✅ merged | @doudouOUC | fix(cli): stop housekeeping hanging on a deleted bind mount | +78/-3 | 2 | 09-07 07:59 | 09-07 12:40 |
| [#11308](https://github.com/QwenLM/qwen-code/pull/11308) | ✅ merged | @doudouOUC | fix(channels): restore worktree-task routes through the managed load path | +533/-4 | 4 | 09-07 15:00 | 09-07 23:31 |
| [#11309](https://github.com/QwenLM/qwen-code/pull/11309) | ✅ merged | @doudouOUC | feat(cli): reap owned worktrees when daemon sessions are deleted | +1547/-49 | 7 | 09-07 15:01 | 09-08 04:02 |
| [#11311](https://github.com/QwenLM/qwen-code/pull/11311) | ✅ merged | @doudouOUC | feat(external-context): Add daemon memory writes | +2489/-37 | 27 | 09-07 15:09 | 09-07 16:34 |
| [#11322](https://github.com/QwenLM/qwen-code/pull/11322) | ✅ merged | @doudouOUC | fix(web-shell): cancel pending locate scroll timers on unmount | +93/-1 | 2 | 09-08 02:16 | 09-08 05:50 |
| [#11323](https://github.com/QwenLM/qwen-code/pull/11323) | ✅ merged | @doudouOUC | perf(web-shell): avoid an unnecessary initial turn-index page request | +107/-13 | 2 | 09-08 02:38 | 09-08 04:08 |
| [#11337](https://github.com/QwenLM/qwen-code/pull/11337) | ✅ merged | @doudouOUC | feat(external-context): Add daemon memory deletion | +2835/-11 | 22 | 09-08 07:23 | 09-08 09:30 |
| [#11339](https://github.com/QwenLM/qwen-code/pull/11339) | ✅ merged | @doudouOUC | fix(serve): configure live-state polling with a five-second default | +346/-17 | 17 | 09-08 07:24 | 09-08 09:08 |
| [#11397](https://github.com/QwenLM/qwen-code/pull/11397) | ✅ merged | @doudouOUC | fix(external-context): Align deletion responses with Mem0 SDK | +92/-77 | 6 | 09-08 15:51 | 09-09 07:09 |
| [#11398](https://github.com/QwenLM/qwen-code/pull/11398) | ✅ merged | @doudouOUC | feat(web-shell): add opt-in browser task notifications | +1530/-54 | 12 | 09-08 15:53 | 09-09 05:46 |
| [#11428](https://github.com/QwenLM/qwen-code/pull/11428) | ✅ merged | @doudouOUC | refactor(serve): decouple workspace capacity policies | +2293/-12 | 12 | 09-09 03:13 | 09-09 06:25 |
| [#11447](https://github.com/QwenLM/qwen-code/pull/11447) | 🟡 open | @doudouOUC | feat(web-shell): enrich browser notifications and open target sessions | +2265/-175 | 23 | 09-09 06:51 | — |
| [#11455](https://github.com/QwenLM/qwen-code/pull/11455) | ✅ merged | @doudouOUC | fix(acp): Preserve submitted prompt provenance for auto recall | +744/-71 | 38 | 09-09 07:57 | 09-10 15:18 |
| [#11515](https://github.com/QwenLM/qwen-code/pull/11515) | ✅ merged | @doudouOUC | feat(serve): support 256 workspaces by default | +1857/-175 | 33 | 09-10 02:23 | 09-10 11:57 |

---

## PR 解决问题、实现方式与 feature 处理

| PR | 解决了什么问题 | 最终怎么实现（open/closed 只登记当前观察） | 对应 feature 文档 |
|---|---|---|---|
| [#11207](https://github.com/QwenLM/qwen-code/pull/11207) | process-global Conversations owner 会让第二个 daemon 连无关 standalone session 也不能服务，Live publisher、删除 journal、scheduled controller 与同 session 写入又必须继续受控。 | 最终把长期全局 owner 改为 runtime 首次发布前的 legacy-owner 兼容检查，以 mandatory per-session writer lease 保护每个真实 writer；删除 journal 移到独立受检状态目录，Live 启动校验精确稳定 publisher，scheduled task保留唯一controller binding，WebShell 对 writer conflict 提供 session-local 显式重试。 | 已更新 daemon lifecycle、ACP writer fence、Scheduled Tasks 与 WebUI transport。完整实现见 [implementations/pr-11207.md](implementations/pr-11207.md)。 |
| [#11208](https://github.com/QwenLM/qwen-code/pull/11208) | #11054 只提供隔离历史数据层，浏览器仍不能连续滚动远端历史或从全量 turn 索引直接定位。 | 最终用 `TranscriptViewport`/hook 把历史 range 转成冻结 render window，在分页/淘汰时按可见记录保持阅读锚点；64px compact rail 虚拟化全量 turn ticks，按需 locate/fetch 远端 turn，返回最新后再恢复 live mutation surface。 | 已更新 WebUI transport 与 daemon 总览。完整实现见 [implementations/pr-11208.md](implementations/pr-11208.md)。 |
| [#11212](https://github.com/QwenLM/qwen-code/pull/11212) | self-hosted ECS 争用可让 WebShell E2E smoke 在安装/浏览器阶段整体变慢，固定 20 分钟上限误杀；hosted runner 又不应放宽真实 hang。 | 最终让 timeout 表达式按 runner 路由求值：self-hosted 40 分钟、hosted 仍 20 分钟，并扩展 workflow 属性测试覆盖显式 hosted、缺失输出 fallback 与 self-hosted 三种情况。 | CI-only 变更，不新增长期 feature 能力。完整实现见 [implementations/pr-11212.md](implementations/pr-11212.md)。 |
| [#11246](https://github.com/QwenLM/qwen-code/pull/11246) | configurable Mem0 package 只有模型主动调用的 `context_search`，管理员无法在合格用户轮次前确定性召回。 | 最终新增独立安装的 schemaVersion 3 `UserPromptSubmit` Hook profile：绑定 canonical repository root，查询只取 `submitted_prompt` 并做有界脱敏，复用 closed Dialect V1 请求引擎，最多五条结果以 `untrusted_external_context` 注入；默认 manifest 与 v2 MCP 保持只读。 | 已更新 [external-context-provider.md](../../feature/external-context-provider.md)。完整实现见 [implementations/pr-11246.md](implementations/pr-11246.md)。 |
| [#11285](https://github.com/QwenLM/qwen-code/pull/11285) | deleted bind mount 内的 recursive `mkdir` 会把 `ENOENT` 当父目录缺失而无界重试，使孤儿 sandbox 的 housekeeping 永不 settle，甚至持续占满 CPU。 | 最终只创建 `lockPath` 的单层父目录；现有三个调用点的父级均已存在，异常 mount 会快速 `ENOENT` 并沿既有 catch 降级为跳过，本来不存在的 qwen 目录仍以 0700 创建。 | 窄范围 CLI housekeeping 修复，不新增 feature 入口。完整实现见 [implementations/pr-11285.md](implementations/pr-11285.md)。 |
| [#11308](https://github.com/QwenLM/qwen-code/pull/11308) | Channel worker 冷启动用 worktree cwd 走 generic load，daemon 无法将其匹配为注册 workspace，导致 worktree task route 以 `workspace_mismatch` 被丢弃。 | 最终在 route 中持久化 `isolation:'worktree'` 与 workspace root；eager restore 改走 managed load并重新验证 daemon attestation、处理 superseded redirect，lazy restore再水合metadata；失效中的异步load会无token释放binding并回滚映射，旧route在下次managed activation补齐metadata。 | 已更新 [channel-adapters.md](../../feature/channel-adapters.md)。完整实现见 [implementations/pr-11308.md](implementations/pr-11308.md)。 |
| [#11309](https://github.com/QwenLM/qwen-code/pull/11309) | 删除 worktree-owning daemon session 只删 record/sidecar，checkout、marker、git registration 与 branch 会永久残留，既有 stale sweep 又刻意跳过 named worktree。 | 最终在删record前于共享worktree lock下核验sidecar、marker、runtime归属、路径/slug与跨session sharing，确认删除且generation仍可写后只清理没有用户工作的checkout，并永不强删branch；异常、脏树或可能部分删除都保守报告。 | 已更新 Channel 与 daemon lifecycle。完整实现见 [implementations/pr-11309.md](implementations/pr-11309.md)。 |
| [#11311](https://github.com/QwenLM/qwen-code/pull/11311) | configurable Mem0 extension 缺少可信 daemon workspace 的显式保存入口，通用 MCP 审批还可能因参数文本等于 title 而隐藏待写正文。 | 最终新增独立 V4 writer profile 与 bounded create dialect，每次批准后原样发送一条 user message 并固定 `infer:false`，将 stored/accepted/unknown 分开且不自动重试；WebShell 对无专用 preview 的 MCP 审批展示完整转义参数。 | 已更新 External Context 与 WebUI transport。完整实现见 [implementations/pr-11311.md](implementations/pr-11311.md)。 |
| [#11322](https://github.com/QwenLM/qwen-code/pull/11322) | MessageList 的150ms定位滚动timer可在组件卸载后继续调度RAF，使测试环境销毁browser globals后偶发 `requestAnimationFrame is not defined`。 | 最终用ref持有唯一timer，新定位先取消旧timer，组件卸载也同步清理；保留原scroll cooldown代次校验、定位滚动与目标高亮。 | 已更新 WebUI transport。完整实现见 [implementations/pr-11322.md](implementations/pr-11322.md)。 |
| [#11323](https://github.com/QwenLM/qwen-code/pull/11323) | compact turn rail首帧尚在顶部时会请求最旧index page，即使tail page已缓存，随后layout effect才跳到尾部，产生无效请求。 | 最终用session初始化状态把missing metadata加载推迟到tail scroll已在layout phase提交之后；切换session时重新执行同一规则，真实缺失tail及用户滚动/Home/键盘仍按需加载。 | 已更新 WebUI transport。完整实现见 [implementations/pr-11323.md](implementations/pr-11323.md)。 |
| [#11337](https://github.com/QwenLM/qwen-code/pull/11337) | configurable Mem0只有检索、Auto Recall与显式写入，缺少可核验目标、显式审批且避免不确定重试的单条删除路径。 | 最终新增独立V5 delete profile与`context_get/context_forget`；绑定repository/scope/dialect，删除前精确核验ID、scope与全文，只发一次DELETE，严格识别合并时支持的回执后再GET确认缺失，结果区分deleted/not_deleted/unknown。 | 已更新 [external-context-provider.md](../../feature/external-context-provider.md)。完整实现见 [implementations/pr-11337.md](implementations/pr-11337.md)。 |
| [#11339](https://github.com/QwenLM/qwen-code/pull/11339) | WebShell三个live-state轮询入口固定2秒，无法按部署负载调节，也没有daemon-client协商的统一默认值。 | 最终daemon从process env读取1秒以上的有界整数，默认5秒并通过optional capability下发；新旧WebShell均回退5秒，interval变化与active polling effect分离，保留可见性刷新、in-flight去重和30秒错误退避。 | 已更新 capability、WebUI transport与daemon总览。完整实现见 [implementations/pr-11339.md](implementations/pr-11339.md)。 |
| [#11397](https://github.com/QwenLM/qwen-code/pull/11397) | #11337 对DELETE英文message与额外字段做固定匹配，真实Holo已删除目标却因回执 `Memory <id> deleted successfully.` 被报为unknown。 | 最终接受任意成功HTTP状态并要求1MiB内严格UTF-8 JSON可解析，不再解释provider字段；仍只有精确post-delete GET确认absence才报deleted，空/204、坏JSON、非成功状态与目标仍存在均unknown且不重试。 | 已更新 External Context 的最终兼容口径。完整实现见 [implementations/pr-11397.md](implementations/pr-11397.md)。 |
| [#11398](https://github.com/QwenLM/qwen-code/pull/11398) | 已离开WebShell窗口的用户只能靠侧栏未读状态发现任务完成，浏览器没有本地、显式opt-in的终态提醒。 | 最终在standalone WebShell设置中加入默认关闭、origin-local且跨tab同步的开关；只对后台已观察的完成/失败turn发通用通知，以pane/page和可用时Web Locks+storage去重，取消、历史和前台已消费终态静默。 | 已更新 WebUI transport 的浏览器通知最终实现。完整实现见 [implementations/pr-11398.md](implementations/pr-11398.md)。 |
| [#11428](https://github.com/QwenLM/qwen-code/pull/11428) | 单个 `MAX_DAEMON_WORKSPACES` 同时控制注册准入、ACP child建模和Channel控制超时，单纯扩容会意外改变三个独立契约。 | 最终保留三个现有值但拆分所有权：CLI注册仍限25，child模型仍最多25且只观测，Channel默认事务预算仍为2,130,000ms；旧公开常量保留为deprecated兼容导出，256注册与LRU只留在后续设计。 | 已更新 daemon资源预算与总览。完整实现见 [implementations/pr-11428.md](implementations/pr-11428.md)。 |
| [#11447](https://github.com/QwenLM/qwen-code/pull/11447) | #11398通用通知不能辨认具体任务，点击也只聚焦原窗口，用户仍需手工找到原会话。 | 当前open diff加入会话标题、本轮提问/回复有界纯文本摘要和图标，并携带workspace/standalone/Live目标；点击通过实例内事件验证上下文后打开原会话。最新修正让storage不可读时保持关闭，保留泛型/比较符/围栏HTML并清理split状态；尚未进入`main`。 | 已在 WebUI transport 登记open增强方案。完整观察见 [implementations/pr-11447.md](implementations/pr-11447.md)。 |
| [#11455](https://github.com/QwenLM/qwen-code/pull/11455) | daemon/ACP fresh turn原来只有model-bound `prompt`，缺少Auto Recall要求的 `submitted_prompt`；直接从所有fresh请求推断又会误召回scheduled/sub-session/Live机器输入。 | 最终由WebShell及显式opt-in客户端逐请求声明扩展前原文；REST/ACP/bridge剥离可伪造public/private metadata，只沿trusted context转成private声明，Session仅对fresh、非channel、非空白声明发布字段，不从request/display回退。 | 已更新 Hooks 与 External Context 的最终producer/trust边界。完整实现见 [implementations/pr-11455.md](implementations/pr-11455.md)。 |
| [#11515](https://github.com/QwenLM/qwen-code/pull/11515) | 25个注册工作区上限阻塞多仓库用户，直接改常量又会联动放大session、Channel事务和持久化边界。 | 最终默认注册容量提升为256并支持operator环境覆盖；启动/恢复/dynamic/scratch/store共享同一上限，扩容模式默认总session限800，store支持255条secondary/8 MiB，Channel owner仍独立限25并公布capacity。 | 已更新 daemon资源预算、总览与feature索引。完整实现见 [implementations/pr-11515.md](implementations/pr-11515.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [daemon session lifecycle](../../feature/daemon-serve-mode/03-session-lifecycle.md) | #11207(merged), #11285(merged), #11309(merged) | 登记 relaxed Conversations ownership 最终切换、housekeeping fail-fast 修复与 ownership-verified worktree 删除回收。 |
| [daemon ACP bridge and permission](../../feature/daemon-serve-mode/07-acp-bridge-and-permission.md) | #11207(merged) | 将 global owner cutover 与 mandatory session writer fence 的关系更新为已落地。 |
| [Scheduled Tasks](../../feature/scheduled-tasks.md) | #11207(merged) | 更新relaxed ownership cutover后mandatory lease、唯一controller binding与at-least-once边界。 |
| [capabilities and protocol](../../feature/daemon-serve-mode/04-capabilities-and-protocol.md) | #11339(merged) | 登记optional live-state interval capability与旧daemon五秒fallback。 |
| [WebUI and transport](../../feature/daemon-serve-mode/11-webui-and-transport.md) | #11207/#11208/#11311/#11322/#11323/#11339/#11398/#11455(merged), #11447(open) | 登记writer-blocked恢复、连续历史/rail、generic MCP参数预览、导航timer/首帧请求修复、live-state协商、浏览器通知最终实现/open增强，以及WebShell显式submitted prompt producer。 |
| [Channel adapters](../../feature/channel-adapters.md) | #11308(merged), #11309(merged) | 更新worktree route managed restore与ownership-verified delete cleanup最终实现。 |
| [daemon resource budgeting](../../feature/daemon-serve-mode/13-resource-budgeting.md) | #11428/#11515(merged) | 区分行为保持型容量owner解耦与P1默认256注册扩容，记录800 total-session、255条secondary/8 MiB store和25个Channel owner边界。 |
| [Direct External Context](../../feature/external-context-provider.md) | #11246/#11311/#11337/#11397/#11455(merged) | 增补configurable Mem0 Auto Recall、writer、显式删除、DELETE兼容及显式ACP/daemon submitted prompt producer最终实现。 |
| [Hooks / submitted prompt provenance](../../feature/hooks.md) | #11455(merged) | 登记逐请求public声明、bridge private转发、fresh非channel hook发布及缺失时不推断的最终边界。 |

_按个人 PR 口径更新于 2026-09-11_
