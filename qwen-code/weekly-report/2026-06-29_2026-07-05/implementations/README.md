# PR 最终实现文档

本目录按本周 README 中登记的 PR 明细整理每个 PR 的中文最终实现文档。
最终口径以 merged diff、changed files、patch、测试/配置路径和关闭状态为准；PR body 只作为目标线索。

| PR | 状态 | 标题 | 文档 |
|---|---|---|---|
| [#4943](https://github.com/QwenLM/qwen-code/pull/4943) | ✅ merged | feat(cli): add --safe-mode flag to disable all customizations for troubleshooting | [pr-4943.md](pr-4943.md) |
| [#5777](https://github.com/QwenLM/qwen-code/pull/5777) | ✅ merged | feat(browser-ext): revive Chrome extension via daemon-direct architecture | [pr-5777.md](pr-5777.md) |
| [#5791](https://github.com/QwenLM/qwen-code/pull/5791) | ✅ merged | fix(cli): auto-select custom input on Enter in multi-select questions | [pr-5791.md](pr-5791.md) |
| [#5860](https://github.com/QwenLM/qwen-code/pull/5860) | ✅ merged | ci(autofix): loosen issue candidate filters so the agent finds work | [pr-5860.md](pr-5860.md) |
| [#5888](https://github.com/QwenLM/qwen-code/pull/5888) | ✅ merged | feat(channels): qwen tag — RFC + Phase 0 (multiplayer channel-resident agent) | [pr-5888.md](pr-5888.md) |
| [#5890](https://github.com/QwenLM/qwen-code/pull/5890) | ✅ merged | feat(loop): inject a .qwen/loop.md task file at fire time via sentinels | [pr-5890.md](pr-5890.md) |
| [#5960](https://github.com/QwenLM/qwen-code/pull/5960) | ✅ merged | docs(telemetry): comprehensive documentation update to match current implementation | [pr-5960.md](pr-5960.md) |
| [#5962](https://github.com/QwenLM/qwen-code/pull/5962) | ✅ merged | feat(core): add --insecure flag to skip TLS verification for self-signed endpoints (#3535) | [pr-5962.md](pr-5962.md) |
| [#5963](https://github.com/QwenLM/qwen-code/pull/5963) | ✅ merged | fix(core): only spawn memory recall when auto-memory is enabled | [pr-5963.md](pr-5963.md) |
| [#5972](https://github.com/QwenLM/qwen-code/pull/5972) | ✅ merged | fix(ui): display output tokens instead of cumulative API throughput for subagents | [pr-5972.md](pr-5972.md) |
| [#5973](https://github.com/QwenLM/qwen-code/pull/5973) | ✅ merged | fix(release): use relative postinstall patch dir | [pr-5973.md](pr-5973.md) |
| [#5974](https://github.com/QwenLM/qwen-code/pull/5974) | 🟡 open | fix(cli): replace ambiguous-width ✦ (U+2726) with ◆ (U+25C6) and add thinking icons | [pr-5974.md](pr-5974.md) |
| [#5977](https://github.com/QwenLM/qwen-code/pull/5977) | ✅ merged | fix(standalone): Route serve shim through cli-entry | [pr-5977.md](pr-5977.md) |
| [#5978](https://github.com/QwenLM/qwen-code/pull/5978) | ✅ merged | feat(channels): Add channel agent bridge abstraction | [pr-5978.md](pr-5978.md) |
| [#5980](https://github.com/QwenLM/qwen-code/pull/5980) | 🟡 open | fix(cli): prioritize auth-modified env vars over system env vars | [pr-5980.md](pr-5980.md) |
| [#5981](https://github.com/QwenLM/qwen-code/pull/5981) | ✅ merged | docs(qc-helper): add daemon mode docs and fix system settings path | [pr-5981.md](pr-5981.md) |
| [#5982](https://github.com/QwenLM/qwen-code/pull/5982) | ⬜ closed | fix(channels): memory leaks, race conditions, and stability fixes | [pr-5982.md](pr-5982.md) |
| [#5983](https://github.com/QwenLM/qwen-code/pull/5983) | ⬜ closed | fix(sdk-typescript): type safety and backpressure handling | [pr-5983.md](pr-5983.md) |
| [#5984](https://github.com/QwenLM/qwen-code/pull/5984) | ⬜ closed | fix(cli): performance fixes and correctness improvements | [pr-5984.md](pr-5984.md) |
| [#5985](https://github.com/QwenLM/qwen-code/pull/5985) | ⬜ closed | fix(acp-bridge): use stable session API and cleanup | [pr-5985.md](pr-5985.md) |
| [#5986](https://github.com/QwenLM/qwen-code/pull/5986) | ⬜ closed | refactor(core): type safety and performance improvements | [pr-5986.md](pr-5986.md) |
| [#5987](https://github.com/QwenLM/qwen-code/pull/5987) | ⬜ closed | fix(desktop): remove build-time secrets and add download verification | [pr-5987.md](pr-5987.md) |
| [#5988](https://github.com/QwenLM/qwen-code/pull/5988) | ⬜ closed | refactor(cli): split sandbox.ts into per-backend modules | [pr-5988.md](pr-5988.md) |
| [#5989](https://github.com/QwenLM/qwen-code/pull/5989) | ✅ merged | fix(cli): Avoid ACP runtime preload on serve fast path | [pr-5989.md](pr-5989.md) |
| [#5991](https://github.com/QwenLM/qwen-code/pull/5991) | 🟡 open | feat(loop): add autonomous mode for a bare /loop | [pr-5991.md](pr-5991.md) |
| [#5992](https://github.com/QwenLM/qwen-code/pull/5992) | ✅ merged | fix(web-shell): prefer raw file diffs in tool output | [pr-5992.md](pr-5992.md) |
| [#5993](https://github.com/QwenLM/qwen-code/pull/5993) | ✅ merged | [codex] fix daemon specialized model filtering | [pr-5993.md](pr-5993.md) |
| [#5994](https://github.com/QwenLM/qwen-code/pull/5994) | ✅ merged | fix(ci): cover release integration regressions | [pr-5994.md](pr-5994.md) |
| [#5995](https://github.com/QwenLM/qwen-code/pull/5995) | ✅ merged | fix(cli): Guard serve fast-path bundle closure | [pr-5995.md](pr-5995.md) |
| [#5996](https://github.com/QwenLM/qwen-code/pull/5996) | ✅ merged | fix(web-shell): improve follow-up suggestion handling | [pr-5996.md](pr-5996.md) |
| [#5998](https://github.com/QwenLM/qwen-code/pull/5998) | 🟡 open | fix(channels): structure DingTalk stream logs | [pr-5998.md](pr-5998.md) |
| [#5999](https://github.com/QwenLM/qwen-code/pull/5999) | 🟡 open | fix(cli): replace all emoji with Unicode text symbols in TUI rendering | [pr-5999.md](pr-5999.md) |
| [#6002](https://github.com/QwenLM/qwen-code/pull/6002) | ✅ merged | fix(cli): fix thought viewer truncation, layout gaps, and choppy scrolling in VP mode | [pr-6002.md](pr-6002.md) |
| [#6003](https://github.com/QwenLM/qwen-code/pull/6003) | 🟡 open | feat(web-shell): add mobile sidebar drawer with session list | [pr-6003.md](pr-6003.md) |
| [#6005](https://github.com/QwenLM/qwen-code/pull/6005) | 🟡 open | feat(web-shell): queue prompts while turns are running | [pr-6005.md](pr-6005.md) |
| [#6006](https://github.com/QwenLM/qwen-code/pull/6006) | 🟡 open | fix(cli): load browser MCP tools by default | [pr-6006.md](pr-6006.md) |
| [#6008](https://github.com/QwenLM/qwen-code/pull/6008) | ✅ merged | feat(daemon): support @extension mentions | [pr-6008.md](pr-6008.md) |
| [#6009](https://github.com/QwenLM/qwen-code/pull/6009) | ✅ merged | fix(core): filter thought parts from Stop hook last_assistant_message | [pr-6009.md](pr-6009.md) |
| [#6011](https://github.com/QwenLM/qwen-code/pull/6011) | 🟡 open | feat(ui): add mouse click & hover in alternate-screen mode | [pr-6011.md](pr-6011.md) |
| [#6012](https://github.com/QwenLM/qwen-code/pull/6012) | 🟡 open | feat(core): support glob patterns in mcp.allowed and mcp.excluded | [pr-6012.md](pr-6012.md) |
| [#6013](https://github.com/QwenLM/qwen-code/pull/6013) | 🟡 open | fix(cli): Keep serve health responsive before runtime load | [pr-6013.md](pr-6013.md) |
| [#6015](https://github.com/QwenLM/qwen-code/pull/6015) | ✅ merged | fix(cli): make the non-VP transcript scrollable during multi-agent runs | [pr-6015.md](pr-6015.md) |
| [#6016](https://github.com/QwenLM/qwen-code/pull/6016) | ✅ merged | test(ci): stabilize cron interactive release check | [pr-6016.md](pr-6016.md) |
| [#6017](https://github.com/QwenLM/qwen-code/pull/6017) | ⬜ closed | [codex] Avoid full-history clones in OOM-prone paths | [pr-6017.md](pr-6017.md) |
| [#6018](https://github.com/QwenLM/qwen-code/pull/6018) | 🟡 open | Avoid full-history clones in OOM-prone paths | [pr-6018.md](pr-6018.md) |
| [#6019](https://github.com/QwenLM/qwen-code/pull/6019) | 🟡 open | feat(cli): add /model --compaction for configurable chat compression model | [pr-6019.md](pr-6019.md) |
| [#6021](https://github.com/QwenLM/qwen-code/pull/6021) | 🟡 open | fix(cli): Handle ACP read_file for managed local paths | [pr-6021.md](pr-6021.md) |
| [#6022](https://github.com/QwenLM/qwen-code/pull/6022) | 🟡 open | feat(cli): support inline one-shot model override in /model (#5967) | [pr-6022.md](pr-6022.md) |
| [#6025](https://github.com/QwenLM/qwen-code/pull/6025) | ✅ merged | feat(web-shell): friendlier Esc interruption + queued-prompt UX | [pr-6025.md](pr-6025.md) |
