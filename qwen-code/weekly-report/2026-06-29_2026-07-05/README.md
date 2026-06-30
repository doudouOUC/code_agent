# qwen-code PRs · 2026-06-29 ~ 2026-07-05 (W27 日增量)

> 本文件先整理 2026-06-29（Asia/Shanghai）的 PR：北京时间 2026-06-29 00:00:00 ~ 23:59:59，对应 UTC `2026-06-28T16:00:00Z` ~ `2026-06-29T15:59:59Z`。口径为 `QwenLM/qwen-code` 中“创建或合入发生在该北京时间窗口内”的 PR，并按当前查询状态去重；open PR 只登记观察，不按已落地实现写入 feature 正文。

**主题**: safe mode、Chrome extension daemon-direct、qwen tag Phase 0、ChannelAgentBridge、serve fast-path guard、daemon/WebShell extension mention、WebShell queued prompt / Esc UX、provider TLS insecure、daemon specialized model filtering、subagent token display

**PR 统计**: 49 PRs — 26 merged / 15 open / 8 closed
**当前已合并 PR 代码量**: +27,523 / -1,841，300 个文件变更
**全量代码量**: +39,249 / -4,543，558 个文件变更
**类型分布**: fix ×27, feat ×13, docs ×2, ci ×2, test ×1, refactor ×2, other ×2
**范围 (scope)**: cli ×17, web-shell/webui ×6, channels ×5, daemon/serve ×5, core ×5, release/ci ×4, desktop/sdk/acp-bridge/loop/mcp/model/auth ×若干

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 变更 | 文件 | 创建(UTC) | 合并/关闭(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#4943](https://github.com/QwenLM/qwen-code/pull/4943) | ✅ merged | @DennisYu07 | feat(cli): add --safe-mode flag to disable all customizations for troubleshooting | +786/-91 | 25 | 06-10 07:40 | 06-29 12:40 |
| [#5777](https://github.com/QwenLM/qwen-code/pull/5777) | ✅ merged | @yiliang114 | feat(browser-ext): revive Chrome extension via daemon-direct architecture | +9011/-62 | 81 | 06-23 13:54 | 06-28 16:06 |
| [#5791](https://github.com/QwenLM/qwen-code/pull/5791) | ✅ merged | @Alex-ai-future | fix(cli): auto-select custom input on Enter in multi-select questions | +105/-3 | 2 | 06-24 02:03 | 06-29 00:38 |
| [#5860](https://github.com/QwenLM/qwen-code/pull/5860) | ✅ merged | @qqqys | ci(autofix): loosen issue candidate filters so the agent finds work | +203/-26 | 2 | 06-25 09:23 | 06-28 23:09 |
| [#5888](https://github.com/QwenLM/qwen-code/pull/5888) | ✅ merged | @qqqys | feat(channels): qwen tag — RFC + Phase 0 (multiplayer channel-resident agent) | +6152/-314 | 20 | 06-26 05:17 | 06-29 07:26 |
| [#5890](https://github.com/QwenLM/qwen-code/pull/5890) | ✅ merged | @qqqys | feat(loop): inject a .qwen/loop.md task file at fire time via sentinels | +4792/-10 | 13 | 06-26 06:19 | 06-28 23:14 |
| [#5960](https://github.com/QwenLM/qwen-code/pull/5960) | ✅ merged | @doudouOUC | docs(telemetry): comprehensive documentation update to match current implementation | +392/-165 | 9 | 06-28 12:46 | 06-28 21:10 |
| [#5962](https://github.com/QwenLM/qwen-code/pull/5962) | ✅ merged | @TianYuan1024 | feat(core): add --insecure flag to skip TLS verification for self-signed endpoints (#3535) | +359/-18 | 10 | 06-28 14:44 | 06-29 12:14 |
| [#5963](https://github.com/QwenLM/qwen-code/pull/5963) | ✅ merged | @Minerest | fix(core): only spawn memory recall when auto-memory is enabled | +4/-1 | 1 | 06-28 16:56 | 06-29 00:38 |
| [#5972](https://github.com/QwenLM/qwen-code/pull/5972) | ✅ merged | @doudouOUC | fix(ui): display output tokens instead of cumulative API throughput for subagents | +108/-81 | 21 | 06-29 02:09 | 06-29 07:38 |
| [#5973](https://github.com/QwenLM/qwen-code/pull/5973) | ✅ merged | @yiliang114 | fix(release): use relative postinstall patch dir | +3/-6 | 2 | 06-29 02:15 | 06-29 03:20 |
| [#5974](https://github.com/QwenLM/qwen-code/pull/5974) | 🟡 open | @pomelo-nwu | fix(cli): replace ambiguous-width ✦ (U+2726) with ◆ (U+25C6) and add thinking icons | +22/-21 | 14 | 06-29 02:18 | - |
| [#5977](https://github.com/QwenLM/qwen-code/pull/5977) | ✅ merged | @doudouOUC | fix(standalone): Route serve shim through cli-entry | +157/-5 | 2 | 06-29 03:52 | 06-29 07:10 |
| [#5978](https://github.com/QwenLM/qwen-code/pull/5978) | ✅ merged | @doudouOUC | feat(channels): Add channel agent bridge abstraction | +1661/-274 | 36 | 06-29 03:58 | 06-29 10:42 |
| [#5980](https://github.com/QwenLM/qwen-code/pull/5980) | 🟡 open | @hgz1024 | fix(cli): prioritize auth-modified env vars over system env vars | +57/-4 | 5 | 06-29 05:23 | - |
| [#5981](https://github.com/QwenLM/qwen-code/pull/5981) | ✅ merged | @DragonnZhang | docs(qc-helper): add daemon mode docs and fix system settings path | +8/-1 | 1 | 06-29 05:44 | 06-29 06:41 |
| [#5982](https://github.com/QwenLM/qwen-code/pull/5982) | ⬜ closed | @jdmanring | fix(channels): memory leaks, race conditions, and stability fixes | +365/-80 | 14 | 06-29 06:20 | 06-29 07:22 |
| [#5983](https://github.com/QwenLM/qwen-code/pull/5983) | ⬜ closed | @jdmanring | fix(sdk-typescript): type safety and backpressure handling | +51/-25 | 5 | 06-29 06:20 | 06-29 07:22 |
| [#5984](https://github.com/QwenLM/qwen-code/pull/5984) | ⬜ closed | @jdmanring | fix(cli): performance fixes and correctness improvements | +39/-26 | 3 | 06-29 06:21 | 06-29 07:22 |
| [#5985](https://github.com/QwenLM/qwen-code/pull/5985) | ⬜ closed | @jdmanring | fix(acp-bridge): use stable session API and cleanup | +175/-228 | 1 | 06-29 06:21 | 06-29 07:22 |
| [#5986](https://github.com/QwenLM/qwen-code/pull/5986) | ⬜ closed | @jdmanring | refactor(core): type safety and performance improvements | +65/-41 | 3 | 06-29 06:21 | 06-29 07:22 |
| [#5987](https://github.com/QwenLM/qwen-code/pull/5987) | ⬜ closed | @jdmanring | fix(desktop): remove build-time secrets and add download verification | +81/-198 | 7 | 06-29 06:21 | 06-29 07:22 |
| [#5988](https://github.com/QwenLM/qwen-code/pull/5988) | ⬜ closed | @jdmanring | refactor(cli): split sandbox.ts into per-backend modules | +993/-1025 | 4 | 06-29 06:21 | 06-29 07:22 |
| [#5989](https://github.com/QwenLM/qwen-code/pull/5989) | ✅ merged | @doudouOUC | fix(cli): Avoid ACP runtime preload on serve fast path | +234/-5 | 2 | 06-29 06:40 | 06-29 07:51 |
| [#5991](https://github.com/QwenLM/qwen-code/pull/5991) | 🟡 open | @qqqys | feat(loop): add autonomous mode for a bare /loop | +1168/-107 | 15 | 06-29 06:59 | - |
| [#5992](https://github.com/QwenLM/qwen-code/pull/5992) | ✅ merged | @ytahdn | fix(web-shell): prefer raw file diffs in tool output | +33/-2 | 2 | 06-29 07:29 | 06-29 09:12 |
| [#5993](https://github.com/QwenLM/qwen-code/pull/5993) | ✅ merged | @callmeYe | [codex] fix daemon specialized model filtering | +179/-4 | 4 | 06-29 07:38 | 06-29 10:31 |
| [#5994](https://github.com/QwenLM/qwen-code/pull/5994) | ✅ merged | @yiliang114 | fix(ci): cover release integration regressions | +38/-3 | 3 | 06-29 07:41 | 06-29 12:03 |
| [#5995](https://github.com/QwenLM/qwen-code/pull/5995) | ✅ merged | @doudouOUC | fix(cli): Guard serve fast-path bundle closure | +725/-87 | 6 | 06-29 08:23 | 06-29 15:53 |
| [#5996](https://github.com/QwenLM/qwen-code/pull/5996) | ✅ merged | @ytahdn | fix(web-shell): improve follow-up suggestion handling | +77/-9 | 3 | 06-29 08:30 | 06-29 10:42 |
| [#5998](https://github.com/QwenLM/qwen-code/pull/5998) | 🟡 open | @qqqys | fix(channels): structure DingTalk stream logs | +465/-8 | 2 | 06-29 08:49 | - |
| [#5999](https://github.com/QwenLM/qwen-code/pull/5999) | 🟡 open | @pomelo-nwu | fix(cli): replace all emoji with Unicode text symbols in TUI rendering | +245/-239 | 39 | 06-29 09:27 | - |
| [#6002](https://github.com/QwenLM/qwen-code/pull/6002) | ✅ merged | @chiga0 | fix(cli): fix thought viewer truncation, layout gaps, and choppy scrolling in VP mode | +279/-76 | 8 | 06-29 09:50 | 06-29 12:50 |
| [#6003](https://github.com/QwenLM/qwen-code/pull/6003) | 🟡 open | @pomelo-nwu | feat(web-shell): add mobile sidebar drawer with session list | +190/-10 | 5 | 06-29 10:08 | - |
| [#6005](https://github.com/QwenLM/qwen-code/pull/6005) | 🟡 open | @ytahdn | feat(web-shell): queue prompts while turns are running | +2807/-408 | 29 | 06-29 10:31 | - |
| [#6006](https://github.com/QwenLM/qwen-code/pull/6006) | 🟡 open | @yiliang114 | fix(cli): load browser MCP tools by default | +546/-83 | 19 | 06-29 10:56 | - |
| [#6008](https://github.com/QwenLM/qwen-code/pull/6008) | ✅ merged | @callmeYe | feat(daemon): support @extension mentions | +656/-201 | 13 | 06-29 11:41 | 06-29 17:04 |
| [#6009](https://github.com/QwenLM/qwen-code/pull/6009) | ✅ merged | @DennisYu07 | fix(core): filter thought parts from Stop hook last_assistant_message | +25/-2 | 3 | 06-29 11:47 | 06-29 12:26 |
| [#6011](https://github.com/QwenLM/qwen-code/pull/6011) | 🟡 open | @DragonnZhang | feat(ui): add mouse click & hover in alternate-screen mode | +1516/-51 | 27 | 06-29 12:24 | - |
| [#6012](https://github.com/QwenLM/qwen-code/pull/6012) | 🟡 open | @DennisYu07 | feat(core): support glob patterns in mcp.allowed and mcp.excluded | +214/-16 | 7 | 06-29 12:48 | - |
| [#6013](https://github.com/QwenLM/qwen-code/pull/6013) | 🟡 open | @doudouOUC | fix(cli): Keep serve health responsive before runtime load | +775/-33 | 7 | 06-29 12:48 | - |
| [#6015](https://github.com/QwenLM/qwen-code/pull/6015) | ✅ merged | @chiga0 | fix(cli): make the non-VP transcript scrollable during multi-agent runs | +539/-21 | 11 | 06-29 13:09 | 06-30 01:38 |
| [#6016](https://github.com/QwenLM/qwen-code/pull/6016) | ✅ merged | @yiliang114 | test(ci): stabilize cron interactive release check | +5/-15 | 1 | 06-29 13:18 | 06-29 17:19 |
| [#6017](https://github.com/QwenLM/qwen-code/pull/6017) | ⬜ closed | @yiliang114 | [codex] Avoid full-history clones in OOM-prone paths | +176/-26 | 5 | 06-29 13:27 | 06-29 13:30 |
| [#6018](https://github.com/QwenLM/qwen-code/pull/6018) | 🟡 open | @yiliang114 | Avoid full-history clones in OOM-prone paths | +296/-14 | 4 | 06-29 13:30 | - |
| [#6019](https://github.com/QwenLM/qwen-code/pull/6019) | 🟡 open | @Rajeshwaran-R | feat(cli): add /model --compaction for configurable chat compression model | +246/-21 | 16 | 06-29 13:31 | - |
| [#6021](https://github.com/QwenLM/qwen-code/pull/6021) | 🟡 open | @doudouOUC | fix(cli): Handle ACP read_file for managed local paths | +1007/-33 | 18 | 06-29 13:57 | - |
| [#6022](https://github.com/QwenLM/qwen-code/pull/6022) | 🟡 open | @TianYuan1024 | feat(cli): support inline one-shot model override in /model (#5967) | +227/-5 | 9 | 06-29 14:28 | - |
| [#6025](https://github.com/QwenLM/qwen-code/pull/6025) | ✅ merged | @carffuca | feat(web-shell): friendlier Esc interruption + queued-prompt UX | +992/-359 | 19 | 06-29 14:58 | 06-30 01:38 |

---

## PR 说明与 feature 处理

| PR | 做什么 | 怎么做 | 对应 feature 文档 |
|---|---|---|---|
| [#4943](https://github.com/QwenLM/qwen-code/pull/4943) | 增加 `--safe-mode` / `QWEN_CODE_SAFE_MODE`，一键禁用用户自定义以排障。 | 在 config/gemini/UI/skills/subagents/agent tool 等入口加 safe-mode gate，跳过 QWEN/AGENTS、hooks、extensions、custom skills、MCP、subagents 和 conditional rules，并显示 SAFE MODE 提示。 | 已补 [diagnostic-skills.md](../../feature/diagnostic-skills.md)。 |
| [#5777](https://github.com/QwenLM/qwen-code/pull/5777) | Chrome extension 复活为 daemon-direct 架构。 | side panel 直连本地 `qwen serve`，浏览器工具以 client-hosted MCP 经 daemon WebSocket 反向暴露，替代 Native Messaging host。 | 已在上周补 [daemon-serve-mode/](../../feature/daemon-serve-mode/) 与客户端/SDK文档，本轮只登记。 |
| [#5791](https://github.com/QwenLM/qwen-code/pull/5791) | 修 `ask_user_question` 多选自定义输入按 Enter 无响应。 | 自定义输入非空时自动选中并提交/进入下一题；空输入保持不提交，补 TUI 单测。 | 已登记到 [permission-system.md](../../feature/permission-system.md) 的 ask_user_question UX 边界。 |
| [#5860](https://github.com/QwenLM/qwen-code/pull/5860) | 放宽 autofix issue candidate 过滤，让自动修复 agent 更容易找到任务。 | 调整 GitHub workflow 候选条件并补 workflow 脚本测试。 | CI 自动化，不新增 feature 正文。 |
| [#5888](https://github.com/QwenLM/qwen-code/pull/5888) | 引入 qwen tag RFC + Phase 0：群聊共享 agent 的多人身份基础。 | 在线程级共享 session 的群消息前注入 `[sender]`，新增 `/who`、群 `/clear confirm`、collect 双前缀保护、DingTalk conversationId guard、昵称/引用文本净化。 | 已补 [channel-adapters.md](../../feature/channel-adapters.md)。 |
| [#5890](https://github.com/QwenLM/qwen-code/pull/5890) | `/loop` fire 时展开 `.qwen/loop.md` 动态任务文件。 | 增加 loop task file 读取、sentinel 展开、workspace realpath/cap/cache 边界和测试。 | 已在上周补 [loop-wakeup.md](../../feature/loop-wakeup.md)，本轮只登记。 |
| [#5960](https://github.com/QwenLM/qwen-code/pull/5960) | telemetry 文档/schema 与当前实现重新对齐。 | 刷新 developer docs、telemetry constants/loggers 与相关测试，修正 `qwen-code.tool_output_truncated` 事件命名。 | 已在上周补 [telemetry-observability/](../../feature/telemetry-observability/)，本轮只登记。 |
| [#5962](https://github.com/QwenLM/qwen-code/pull/5962) | 增加跳过 TLS 校验的 `--insecure` / env 开关，用于自签 endpoint。 | 将 `QWEN_TLS_INSECURE` / config 透传到 runtime fetch options，集中创建 fetch 行为，并在 troubleshooting 文档提示风险。 | 已补 [auth-providers.md](../../feature/auth-providers.md)。 |
| [#5963](https://github.com/QwenLM/qwen-code/pull/5963) | auto-memory 关闭时不再启动 memory recall side-query。 | 在 core client 发起 recall 前检查 auto-memory enablement。 | 已在上周补 [managed-memory.md](../../feature/managed-memory.md)，本轮只登记。 |
| [#5972](https://github.com/QwenLM/qwen-code/pull/5972) | subagent/background agent token 展示改为 output tokens，避免把 API 吞吐量显示成百万 token。 | CLI/web-shell/webui 多个 agent card/status 面统一读 `outputTokens`，旧 payload fallback 到 `totalTokens`。 | 已补 [background-agent-resume.md](../../feature/background-agent-resume.md) 与 WebUI 文档。 |
| [#5973](https://github.com/QwenLM/qwen-code/pull/5973) | release postinstall patch dir 改相对路径。 | 调整 package prepare 脚本和资产测试。 | release 修复，不新增 feature 正文。 |
| [#5974](https://github.com/QwenLM/qwen-code/pull/5974) | open：替换 ambiguous-width thinking icon 并补 thinking icons。 | 修改 TUI icon/快照/场景。 | open，暂不写入 feature；若合入归 CLI/TUI UX。 |
| [#5977](https://github.com/QwenLM/qwen-code/pull/5977) | standalone 包中的 `qwen serve` 走 `cli-entry.js` fast path。 | 打包脚本让 serve shim 调 `lib/cli-entry.js`，非 serve 保持 `node --expose-gc lib/cli.js`，并跳过 npm-only artifacts。 | 已补 [daemon-serve-mode/README.md](../../feature/daemon-serve-mode/README.md)。 |
| [#5978](https://github.com/QwenLM/qwen-code/pull/5978) | 引入 adapter-facing `ChannelAgentBridge` 抽象。 | adapters/router/channel start 依赖窄 bridge contract；`AcpBridge` 继续作为 standalone 实现，并修 session cleanup、restore/create race 和 bridge swap listener。 | 已补 [channel-adapters.md](../../feature/channel-adapters.md)。 |
| [#5980](https://github.com/QwenLM/qwen-code/pull/5980) | open：auth-modified env vars 优先级高于系统 env。 | 调整 environment/settings/provider install 解析。 | open，若合入归 [auth-providers.md](../../feature/auth-providers.md)。 |
| [#5981](https://github.com/QwenLM/qwen-code/pull/5981) | qc-helper 技能补 daemon mode 文档并修 system settings path。 | 更新 bundled `qc-helper/SKILL.md`。 | 技能文档小修，只在矩阵登记。 |
| #5982-#5988 | closed：channels/sdk/cli/acp/core/desktop/sandbox 一批修复或重构草稿。 | 分支均关闭未合入；多为候选修复或拆分尝试。 | closed，不作为 feature 实现统计。 |
| [#5989](https://github.com/QwenLM/qwen-code/pull/5989) | 防止 serve fast path 静态拉入 ACP runtime。 | request helper 改用轻量子路径，新增 source import graph 与 bundle metafile 静态闭包回归测试。 | 已补 [daemon-serve-mode/README.md](../../feature/daemon-serve-mode/README.md)。 |
| [#5991](https://github.com/QwenLM/qwen-code/pull/5991) | open：裸 `/loop` autonomous mode。 | 增加 autonomous loop resolver、skill 文案和 session/non-interactive 接线。 | open，若合入归 [loop-wakeup.md](../../feature/loop-wakeup.md)。 |
| [#5992](https://github.com/QwenLM/qwen-code/pull/5992) | WebShell 工具输出优先展示后端 raw file diff。 | 当 payload 同时有 structured old/new diff 与 `rawOutput.fileDiff` 时优先 raw hunk，避免大文件重算 diff 噪音。 | 已补 [daemon-serve-mode/11-webui-and-transport.md](../../feature/daemon-serve-mode/11-webui-and-transport.md)。 |
| [#5993](https://github.com/QwenLM/qwen-code/pull/5993) | daemon-backed model surface 过滤 fastOnly/voiceOnly 专用模型。 | workspace provider status、ACP workspace provider status、session model state 和 model config options 统一过滤普通会话不可选模型。 | 已补 [auth-providers.md](../../feature/auth-providers.md) 与 daemon 总览。 |
| [#5994](https://github.com/QwenLM/qwen-code/pull/5994) | 补 release integration regression 覆盖。 | 增加 qwen-serve client MCP / chrome-extension package 脚本测试。 | CI/test，不新增 feature 正文。 |
| [#5995](https://github.com/QwenLM/qwen-code/pull/5995) | serve fast path 增加 bundle-level guard。 | 将真实 esbuild metafile 静态 reachability 检查移到显式 CI script，禁止 ACP/core/vendor 静态闭包进入 pre-listen path。 | 已补 [daemon-serve-mode/README.md](../../feature/daemon-serve-mode/README.md)。 |
| [#5996](https://github.com/QwenLM/qwen-code/pull/5996) | WebShell follow-up suggestion 可直接点发送，且跨 session 不串。 | send button 复用 Enter 的 suggestion accept 行为；session 切换清本地/global 泄漏状态，不清新 session 自有 suggestion。 | 已补 [daemon-serve-mode/11-webui-and-transport.md](../../feature/daemon-serve-mode/11-webui-and-transport.md)。 |
| [#5998](https://github.com/QwenLM/qwen-code/pull/5998) | open：DingTalk stream logs 结构化。 | 调整 DingTalk adapter 日志与测试。 | open，若合入归 [channel-adapters.md](../../feature/channel-adapters.md)。 |
| [#5999](https://github.com/QwenLM/qwen-code/pull/5999) | open：TUI 渲染中去 emoji，改 Unicode text symbols。 | 更新 i18n、status-line/IDE docs 和 TUI icon 使用。 | open，暂归 CLI/TUI UX 观察。 |
| [#6002](https://github.com/QwenLM/qwen-code/pull/6002) | 修 VP thought viewer 截断、布局空隙和滚动卡顿。 | 调整 AppContainer/ThinkingViewer/ScrollableList/VirtualizedList 和 frame coalescing。 | TUI 局部 UX 修复，只在矩阵登记。 |
| [#6003](https://github.com/QwenLM/qwen-code/pull/6003) | open：WebShell mobile sidebar drawer。 | 移动端 sidebar/session list drawer。 | open，若合入归 WebShell/transport。 |
| [#6005](https://github.com/QwenLM/qwen-code/pull/6005) | open：WebShell running turn 期间排队 prompt。 | 扩展 bridge/session route/SDK/web-shell queue prompt 能力。 | open，若合入归 daemon/WebShell。 |
| [#6006](https://github.com/QwenLM/qwen-code/pull/6006) | open：默认加载 browser MCP tools。 | 改 chrome extension、ACP agent、serve capability 和 MCP client manager。 | open，若合入归 daemon/Chrome extension/MCP。 |
| [#6008](https://github.com/QwenLM/qwen-code/pull/6008) | daemon WebShell 支持 `@ext:name` extension mention。 | WebShell `@` completion 展示 active extensions；daemon ACP prompt path 解析 canonical mention 并注入 extension capabilities/context files，同时保持可见 prompt 不变。 | 已补 [diagnostic-skills.md](../../feature/diagnostic-skills.md) 与 [daemon-serve-mode/11-webui-and-transport.md](../../feature/daemon-serve-mode/11-webui-and-transport.md)。 |
| [#6009](https://github.com/QwenLM/qwen-code/pull/6009) | Stop hook 的 `last_assistant_message` 过滤 thought parts。 | `GeminiChat` 与 `GeminiClient` fallback 统一只拼接可见文本，避免 thinking 模型内部推理泄漏给 Stop hook。 | 已补 [permission-system.md](../../feature/permission-system.md)。 |
| [#6011](https://github.com/QwenLM/qwen-code/pull/6011) | open：alternate-screen 模式支持鼠标 click/hover。 | 增加 row/text input mouse controller 与 settings schema。 | open，暂归 CLI/TUI UX 观察。 |
| [#6012](https://github.com/QwenLM/qwen-code/pull/6012) | open：`mcp.allowed` / `mcp.excluded` 支持 glob patterns。 | tool registry 按 glob 匹配 MCP tool allow/exclude。 | open，若合入归 [mcp-resources-prompts.md](../../feature/mcp-resources-prompts.md) 或权限系统。 |
| [#6013](https://github.com/QwenLM/qwen-code/pull/6013) | open：runtime load 前保持 serve health responsive。 | fast-path open/runtime startup error 路径调整，避免健康检查被 runtime load 阻塞。 | open，若合入归 [daemon-serve-mode/README.md](../../feature/daemon-serve-mode/README.md)。 |
| [#6015](https://github.com/QwenLM/qwen-code/pull/6015) | 非 VP transcript 在 multi-agent 运行中可滚动。 | running subagents 交给 LiveAgentPanel 独占，inline panel 加高度窗口；`useMouseEvents` 默认只在 VP 模式启用，非 VP 保留原生 scrollback。 | 已补 [background-agent-resume.md](../../feature/background-agent-resume.md)。 |
| [#6016](https://github.com/QwenLM/qwen-code/pull/6016) | 稳定 cron interactive release check。 | 调整 integration test，降低 release check 波动。 | test/CI，不新增 feature 正文。 |
| [#6017](https://github.com/QwenLM/qwen-code/pull/6017) | closed：避免 OOM-prone paths 做 full-history clone 的初稿。 | 被 #6018 取代。 | closed，不作为 feature 实现统计。 |
| [#6018](https://github.com/QwenLM/qwen-code/pull/6018) | open：避免 OOM-prone paths full-history clone。 | 预计调整 forkedAgent/turn cache 读取。 | open，若合入归 OOM/agent 性能或 background agent 文档。 |
| [#6019](https://github.com/QwenLM/qwen-code/pull/6019) | open：`/model --compaction` 配置聊天压缩模型。 | 增加 model command/config/dialog/hook 接线。 | open，若合入归 [context-compression.md](../../feature/context-compression.md) 与 auth/model。 |
| [#6021](https://github.com/QwenLM/qwen-code/pull/6021) | open：ACP `read_file` 支持 managed local paths。 | 调整 ACP filesystem service 与 read/edit/write 工具路径边界。 | open，若合入归 daemon/file boundary 或 atomic file write。 |
| [#6022](https://github.com/QwenLM/qwen-code/pull/6022) | open：`/model` 支持 inline one-shot model override。 | 改非交互命令、slash command 和 stream state。 | open，若合入归 [auth-providers.md](../../feature/auth-providers.md)。 |
| [#6025](https://github.com/QwenLM/qwen-code/pull/6025) | WebShell Esc 中断改为两次确认，并修取消后的 queued prompt 自动流转。 | Esc 第一次 arm stop/clear affordance，第二次确认；取消 turn 写入 transcript 行；queue drain 一次只推进一条并避免跨 session 误发。 | 已补 [daemon-serve-mode/11-webui-and-transport.md](../../feature/daemon-serve-mode/11-webui-and-transport.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本日新增/复核 PR | 文档动作 |
|---|---|---|
| [channel-adapters.md](../../feature/channel-adapters.md) | #5888 #5978 | 补 qwen tag Phase 0 的群共享身份、`/who`、`/clear confirm`、nickname/reply sanitization，以及 `ChannelAgentBridge` 抽象和 router/bridge 生命周期修复。 |
| [daemon-serve-mode/README.md](../../feature/daemon-serve-mode/README.md) | #5977 #5989 #5993 #5995 | 补 standalone serve shim 走 `cli-entry.js`、serve fast-path 静态 import / bundle guard，以及 daemon provider surface 过滤专用模型。 |
| [daemon-serve-mode/11-webui-and-transport.md](../../feature/daemon-serve-mode/11-webui-and-transport.md) | #5992 #5996 #6008 #6025 | 补 raw file diff 优先、follow-up suggestion send/session scoping、WebShell `@ext:name` extension mention、Esc 两次确认与取消后 queue drain。 |
| [auth-providers.md](../../feature/auth-providers.md) | #5962 #5993 | 补 TLS insecure escape hatch 及其安全边界；补 daemon model surface 对 `fastOnly` / `voiceOnly` 的过滤。 |
| [diagnostic-skills.md](../../feature/diagnostic-skills.md) | #4943 #6008 | 补 safe mode troubleshooting baseline；补 daemon/WebShell extension mention 与 CLI `@ext:name` 的共用 resolver 边界。 |
| [background-agent-resume.md](../../feature/background-agent-resume.md) | #5972 #6015 | 补 subagent output-token 展示口径，以及非 VP multi-agent transcript scrollback 修复。 |
| [permission-system.md](../../feature/permission-system.md) | #5791 #6009 | 补 `ask_user_question` 多选自定义输入 Enter 行为，以及 Stop hook 过滤 thought parts 的 hook 输入边界。 |
| 已有覆盖不重复展开 | #5777 #5890 #5960 #5963 | 已在 2026-06-28 / 上周覆盖矩阵中写入对应 feature，本轮按北京时间昨日口径复核登记。 |
| 只登记、不新增专题 | #5860 #5973 #5981 #5994 #6002 #6016 | CI/release/docs-only/TUI 局部 UX 修复，不改变长期 feature 合约。 |
| open / closed 观察 | #5974 #5980 #5982-#5988 #5991 #5998 #5999 #6003 #6005 #6006 #6011 #6012 #6013 #6017 #6018 #6019 #6021 #6022 | open 只登记后续归属；closed/superseded 不作为已落地实现统计。 |

_日增量整理于 2026-06-30_
