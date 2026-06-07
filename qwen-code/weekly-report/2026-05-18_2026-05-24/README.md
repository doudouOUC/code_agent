# qwen-code PRs · 2026-05-18 ~ 2026-05-24  (W21)

**主题**: serve 路由密集开发、acp-bridge 大重构、telemetry Phase 1.5–4、原子写、F1/F2/F3

**统计**: 43 PRs — 36 merged / 3 open / 4 closed  
**代码量**: +120,272 / -20,559，920 个文件变更  
**类型**: feat ×18, fix ×15, refactor ×5, docs ×3, perf ×1, chore ×1  
**范围 (scope)**: serve ×18, telemetry ×9, acp-bridge ×6, core ×5, sdk ×1, developers ×1, cli ×1, build ×1, integration ×1, deploy ×1

**本周最大改动**:
- [#4469](https://github.com/QwenLM/qwen-code/pull/4469) (+50124/-9334, 423 files) chore(integration): sync main into daemon_mode_b_main (2026-05-24)
- [#4336](https://github.com/QwenLM/qwen-code/pull/4336) (+10308/-147, 38 files) feat(serve): shared MCP transport pool [F2]
- [#4319](https://github.com/QwenLM/qwen-code/pull/4319) (+5620/-4710, 19 files) feat(acp-bridge): F1 — acp-bridge package self-sufficiency (#4175 mechanical lift + BridgeFileSystem seam)

| PR | 状态 | 类型 | 标题 | 变更 | 文件 | 创建 | 合并/关闭 | 链接 |
|---|---|---|---|---|---|---|---|---|
| #4269 | ✅ merged | feat(serve) | feat(serve): safe workspace file read routes (#4175 PR 19) _[skip-changelog]_ | +1454/-8 | 10 | 05-18 | 05-18 | https://github.com/QwenLM/qwen-code/pull/4269 |
| #4271 | ✅ merged | feat(serve) | feat(serve): MCP guardrail push events + hysteresis (#4175 Wave 3 PR 14b) _[skip-changelog]_ | +3329/-266 | 19 | 05-18 | 05-18 | https://github.com/QwenLM/qwen-code/pull/4271 |
| #4279 | ✅ merged | fix(serve) | fix(serve): normalize Windows path separators in workspace file read responses _[skip-changelog]_ | +7/-1 | 1 | 05-18 | 05-18 | https://github.com/QwenLM/qwen-code/pull/4279 |
| #4280 | ✅ merged | feat(serve) | feat(serve): add workspace file write/edit routes (#4175 PR20) _[skip-changelog]_ | +2557/-266 | 25 | 05-18 | 05-18 | https://github.com/QwenLM/qwen-code/pull/4280 |
| #4282 | ✅ merged | feat(serve) | feat(serve): approval / tools / init / MCP-restart mutation routes (#4175 Wave 4 PR 17) _[skip-changelog]_ | +3685/-13 | 28 | 05-18 | 05-18 | https://github.com/QwenLM/qwen-code/pull/4282 |
| #4284 | ✅ merged | fix(serve) | fix(serve): sync E2E baseline capabilities with registry _[skip-changelog]_ | +3/-0 | 1 | 05-18 | 05-18 | https://github.com/QwenLM/qwen-code/pull/4284 |
| #4291 | ✅ merged | fix(serve) | fix(serve): auth device-flow follow-up for #4255 review threads _[skip-changelog]_ | +1406/-31 | 7 | 05-18 | 05-18 | https://github.com/QwenLM/qwen-code/pull/4291 |
| #4293 | ⬜ closed | fix(serve) | fix(serve): sync E2E baseline with PR20/PR21 capabilities | +3/-0 | 1 | 05-18 | 05-18 | https://github.com/QwenLM/qwen-code/pull/4293 |
| #4295 | ✅ merged | refactor(acp-bridge) | refactor(acp-bridge): create skeleton + lift zero-coupling primitives (#4175 PR 22a) _[skip-changelog]_ | +1106/-688 | 17 | 05-18 | 05-18 | https://github.com/QwenLM/qwen-code/pull/4295 |
| #4297 | ✅ merged | fix(serve) | fix(serve): post-merge P2 corrections from Codex review on #4282 | +1695/-61 | 15 | 05-18 | 05-19 | https://github.com/QwenLM/qwen-code/pull/4297 |
| #4298 | ✅ merged | refactor(acp-bridge) | refactor(acp-bridge): lift status, paths, errors, and bridge types (#4175 PR 22b/1) _[skip-changelog]_ | +1431/-1450 | 12 | 05-18 | 05-18 | https://github.com/QwenLM/qwen-code/pull/4298 |
| #4300 | ✅ merged | refactor(serve) | refactor(serve): typed errors for channel-closed and missing-cli-entry (#4299) _[skip-changelog]_ | +118/-29 | 3 | 05-18 | 05-18 | https://github.com/QwenLM/qwen-code/pull/4300 |
| #4302 | ✅ merged | fix(telemetry) | fix(telemetry): Phase 1.5 polish — fallback order, abort-as-result, log/span consistency | +454/-65 | 7 | 05-18 | 05-19 | https://github.com/QwenLM/qwen-code/pull/4302 |
| #4304 | ✅ merged | refactor(acp-bridge) | refactor(acp-bridge): lift BridgeOptions + introduce DaemonStatusProvider seam (#4175 PR 22b/2) _[skip-changelog]_ | +852/-371 | 11 | 05-18 | 05-19 | https://github.com/QwenLM/qwen-code/pull/4304 |
| #4305 | ✅ merged | fix(serve) | fix(serve): post-merge fixes for #4291 review (7 threads) | +768/-161 | 5 | 05-18 | 05-19 | https://github.com/QwenLM/qwen-code/pull/4305 |
| #4306 | ✅ merged | fix(serve) | fix(serve): unbreak E2E after #4271 (capabilities + clientCount) _[skip-changelog]_ | +48/-40 | 2 | 05-19 | 05-19 | https://github.com/QwenLM/qwen-code/pull/4306 |
| #4312 | ⬜ closed | fix(serve) | fix(serve): post-merge review fixes for #4291 [daemon_mode_b_main mirror] | +768/-161 | 5 | 05-19 | 05-19 | https://github.com/QwenLM/qwen-code/pull/4312 |
| #4313 | ⬜ closed | fix(serve) | fix(serve): post-PR-17 Codex P2 fold-ins (against daemon_mode_b_main) | +1497/-58 | 14 | 05-19 | 05-19 | https://github.com/QwenLM/qwen-code/pull/4313 |
| #4319 | ✅ merged | feat(acp-bridge) | feat(acp-bridge): F1 — acp-bridge package self-sufficiency (#4175 mechanical lift + BridgeFileSystem seam) | +5620/-4710 | 19 | 05-19 | 05-19 | https://github.com/QwenLM/qwen-code/pull/4319 |
| #4321 | ✅ merged | feat(telemetry) | feat(telemetry): Phase 2 — tool.blocked_on_user + hook spans (#3731) | +3287/-99 | 8 | 05-19 | 05-21 | https://github.com/QwenLM/qwen-code/pull/4321 |
| #4333 | ✅ merged | feat(core) | feat(core): atomic write rollout for credentials, memory, config, JSONL (closes #3681, #4095 Phase 2) | +2308/-155 | 31 | 05-19 | — | https://github.com/QwenLM/qwen-code/pull/4333 |
| #4334 | ✅ merged | feat(serve) | feat(serve): F1 follow-up — BridgeFileSystem wiring + #4325 channelInfo fix | +1365/-59 | 9 | 05-19 | 05-20 | https://github.com/QwenLM/qwen-code/pull/4334 |
| #4335 | ✅ merged | feat(acp-bridge) | feat(acp-bridge): F3 — multi-client permission coordination (#4175) | +5263/-417 | 27 | 05-19 | 05-20 | https://github.com/QwenLM/qwen-code/pull/4335 |
| #4336 | ✅ merged | feat(serve) | feat(serve): shared MCP transport pool [F2] | +10308/-147 | 38 | 05-19 | 05-21 | https://github.com/QwenLM/qwen-code/pull/4336 |
| #4360 | ✅ merged | feat(serve+sdk) | feat(serve+sdk): F4 prereq — daemon protocol completion (serverTimestamp / provenance / errorKind / state_resync_required) | +1500/-26 | 13 | 05-20 | 05-21 | https://github.com/QwenLM/qwen-code/pull/4360 |
| #4366 | ✅ merged | fix(core) | fix(core): stop AbortSignal listener leak in long sessions (MaxListenersExceededWarning) _[type/bug]_ | +1698/-562 | 25 | 05-20 | 05-26 | https://github.com/QwenLM/qwen-code/pull/4366 |
| #4367 | ✅ merged | feat(telemetry) | feat(telemetry): support custom resource attributes and add metric cardinality controls _[ToB]_ | +1897/-60 | 13 | 05-20 | 05-21 | https://github.com/QwenLM/qwen-code/pull/4367 |
| #4390 | ✅ merged | feat(telemetry) | feat(telemetry): client-side HTTP span + opt-in W3C traceparent propagation (#4384) _[status/on-hold, type/feature-request, scope/data-privacy, need-discussion]_ | +1822/-5 | 14 | 05-21 | 05-25 | https://github.com/QwenLM/qwen-code/pull/4390 |
| #4393 | ⬜ closed | feat(telemetry) | feat(telemetry): propagate X-Qwen-Code-Session-Id on outbound LLM requests (part 2 of #4384) | +533/-51 | 13 | 05-21 | 05-21 | https://github.com/QwenLM/qwen-code/pull/4393 |
| #4410 | 🟡 open | feat(telemetry) | feat(telemetry): Phase 3 — qwen-code.subagent span with concurrent isolation (#3731) | +2335/-91 | 11 | 05-21 | — | https://github.com/QwenLM/qwen-code/pull/4410 |
| #4411 | ✅ merged | perf(core) | perf(core): F2 cleanup PR A — R9/W11/W12/R10 (post-merge follow-ups) | +823/-594 | 8 | 05-21 | 05-23 | https://github.com/QwenLM/qwen-code/pull/4411 |
| #4412 | 🟡 open | docs(developers) | docs(developers): add daemon-mode developer deep-dive documentation set | +4513/-0 | 23 | 05-21 | — | https://github.com/QwenLM/qwen-code/pull/4412 |
| #4414 | ✅ merged | feat(cli) | feat(cli): background housekeeping for stale file-history dirs | +1059/-12 | 13 | 05-21 | — | https://github.com/QwenLM/qwen-code/pull/4414 |
| #4417 | ✅ merged | feat(telemetry) | feat(telemetry): Phase 4a — TTFT capture + GenAI semconv dual-emit (#3731) | +1190/-2 | 7 | 05-22 | 05-22 | https://github.com/QwenLM/qwen-code/pull/4417 |
| #4431 | ✅ merged | fix(core) | fix(core): preserve uid/gid in atomicWriteFile to avoid breaking shared-write files | +203/-47 | 4 | 05-22 | — | https://github.com/QwenLM/qwen-code/pull/4431 |
| #4432 | 🟡 open | feat(telemetry) | feat(telemetry): Phase 4b — retry visibility for qwen-code.llm_request (#3731) | +1240/-40 | 18 | 05-22 | — | https://github.com/QwenLM/qwen-code/pull/4432 |
| #4445 | ✅ merged | refactor(acp-bridge) | refactor(acp-bridge): F1 test split — lift bridge.test.ts (6861 LOC) to acp-bridge | +597/-449 | 5 | 05-22 | 05-23 | https://github.com/QwenLM/qwen-code/pull/4445 |
| #4453 | ✅ merged | fix(build) | fix(build): clean stale outputs before tsc --build to prevent TS5055 | +9/-1 | 1 | 05-23 | 05-23 | https://github.com/QwenLM/qwen-code/pull/4453 |
| #4460 | ✅ merged | fix(core) | fix(core): F2 cleanup PR B — self-heal observability (W133-a + W134) | +405/-5 | 3 | 05-23 | 05-23 | https://github.com/QwenLM/qwen-code/pull/4460 |
| #4469 | ✅ merged | chore(integration) | chore(integration): sync main into daemon_mode_b_main (2026-05-24) | +50124/-9334 | 423 | 05-23 | 05-24 | https://github.com/QwenLM/qwen-code/pull/4469 |
| #4473 | ✅ merged | docs(serve) | docs(serve): v0.16-alpha known limits + SDK QWEN_SERVER_TOKEN env fallback (PR 27) | +175/-6 | 4 | 05-24 | 05-24 | https://github.com/QwenLM/qwen-code/pull/4473 |
| #4482 | ✅ merged | fix(telemetry) | fix(telemetry): improve LogToSpan bridge error info and TUI handling _[type/bug]_ | +593/-17 | 4 | 05-24 | 05-27 | https://github.com/QwenLM/qwen-code/pull/4482 |
| #4483 | ✅ merged | docs(deploy) | docs(deploy): local launch templates for v0.16-alpha (PR 30a) | +224/-1 | 3 | 05-24 | 05-25 | https://github.com/QwenLM/qwen-code/pull/4483 |
