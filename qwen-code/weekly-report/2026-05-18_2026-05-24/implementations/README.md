# PR 最终实现文档

本目录按本周 README 中登记的 PR 明细整理每个 PR 的中文最终实现文档。
最终口径以 merged diff、changed files、patch、测试/配置路径和关闭状态为准；PR body 只作为目标线索。

| PR | 状态 | 标题 | 文档 |
|---|---|---|---|
| [#4269](https://github.com/QwenLM/qwen-code/pull/4269) | ✅ merged | feat(serve): safe workspace file read routes (#4175 PR 19) | [pr-4269.md](pr-4269.md) |
| [#4271](https://github.com/QwenLM/qwen-code/pull/4271) | ✅ merged | feat(serve): MCP guardrail push events + hysteresis (#4175 Wave 3 PR 14b) | [pr-4271.md](pr-4271.md) |
| [#4279](https://github.com/QwenLM/qwen-code/pull/4279) | ✅ merged | fix(serve): normalize Windows path separators in workspace file read responses | [pr-4279.md](pr-4279.md) |
| [#4280](https://github.com/QwenLM/qwen-code/pull/4280) | ✅ merged | feat(serve): add workspace file write/edit routes (#4175 PR20) | [pr-4280.md](pr-4280.md) |
| [#4282](https://github.com/QwenLM/qwen-code/pull/4282) | ✅ merged | feat(serve): approval / tools / init / MCP-restart mutation routes (#4175 Wave 4 PR 17) | [pr-4282.md](pr-4282.md) |
| [#4284](https://github.com/QwenLM/qwen-code/pull/4284) | ✅ merged | fix(serve): sync E2E baseline capabilities with registry | [pr-4284.md](pr-4284.md) |
| [#4291](https://github.com/QwenLM/qwen-code/pull/4291) | ✅ merged | fix(serve): auth device-flow follow-up for #4255 review threads | [pr-4291.md](pr-4291.md) |
| [#4293](https://github.com/QwenLM/qwen-code/pull/4293) | ⬜ closed | fix(serve): sync E2E baseline with PR20/PR21 capabilities | [pr-4293.md](pr-4293.md) |
| [#4295](https://github.com/QwenLM/qwen-code/pull/4295) | ✅ merged | refactor(acp-bridge): create skeleton + lift zero-coupling primitives (#4175 PR 22a) | [pr-4295.md](pr-4295.md) |
| [#4297](https://github.com/QwenLM/qwen-code/pull/4297) | ✅ merged | fix(serve): post-merge P2 corrections from Codex review on #4282 | [pr-4297.md](pr-4297.md) |
| [#4298](https://github.com/QwenLM/qwen-code/pull/4298) | ✅ merged | refactor(acp-bridge): lift status, paths, errors, and bridge types (#4175 PR 22b/1) | [pr-4298.md](pr-4298.md) |
| [#4300](https://github.com/QwenLM/qwen-code/pull/4300) | ✅ merged | refactor(serve): typed errors for channel-closed and missing-cli-entry (#4299) | [pr-4300.md](pr-4300.md) |
| [#4302](https://github.com/QwenLM/qwen-code/pull/4302) | ✅ merged | fix(telemetry): Phase 1.5 polish — fallback order, abort-as-result, log/span consistency | [pr-4302.md](pr-4302.md) |
| [#4304](https://github.com/QwenLM/qwen-code/pull/4304) | ✅ merged | refactor(acp-bridge): lift BridgeOptions + introduce DaemonStatusProvider seam (#4175 PR 22b/2) | [pr-4304.md](pr-4304.md) |
| [#4305](https://github.com/QwenLM/qwen-code/pull/4305) | ✅ merged | fix(serve): post-merge fixes for #4291 review (7 threads) | [pr-4305.md](pr-4305.md) |
| [#4306](https://github.com/QwenLM/qwen-code/pull/4306) | ✅ merged | fix(serve): unbreak E2E after #4271 (capabilities + clientCount) | [pr-4306.md](pr-4306.md) |
| [#4312](https://github.com/QwenLM/qwen-code/pull/4312) | ⬜ closed | fix(serve): post-merge review fixes for #4291 [daemon_mode_b_main mirror] | [pr-4312.md](pr-4312.md) |
| [#4313](https://github.com/QwenLM/qwen-code/pull/4313) | ⬜ closed | fix(serve): post-PR-17 Codex P2 fold-ins (against daemon_mode_b_main) | [pr-4313.md](pr-4313.md) |
| [#4319](https://github.com/QwenLM/qwen-code/pull/4319) | ✅ merged | feat(acp-bridge): F1 — acp-bridge package self-sufficiency (#4175 mechanical lift + BridgeFileSystem seam) | [pr-4319.md](pr-4319.md) |
| [#4321](https://github.com/QwenLM/qwen-code/pull/4321) | ✅ merged | feat(telemetry): Phase 2 — tool.blocked_on_user + hook spans (#3731) | [pr-4321.md](pr-4321.md) |
| [#4333](https://github.com/QwenLM/qwen-code/pull/4333) | ✅ merged | feat(core): atomic write rollout for credentials, memory, config, JSONL (closes #3681, #4095 Phase 2) | [pr-4333.md](pr-4333.md) |
| [#4334](https://github.com/QwenLM/qwen-code/pull/4334) | ✅ merged | feat(serve): F1 follow-up — BridgeFileSystem wiring + #4325 channelInfo fix | [pr-4334.md](pr-4334.md) |
| [#4335](https://github.com/QwenLM/qwen-code/pull/4335) | ✅ merged | feat(acp-bridge): F3 — multi-client permission coordination (#4175) | [pr-4335.md](pr-4335.md) |
| [#4336](https://github.com/QwenLM/qwen-code/pull/4336) | ✅ merged | feat(serve): shared MCP transport pool [F2] | [pr-4336.md](pr-4336.md) |
| [#4360](https://github.com/QwenLM/qwen-code/pull/4360) | ✅ merged | feat(serve+sdk): F4 prereq — daemon protocol completion (serverTimestamp / provenance / errorKind / state_resync_required) | [pr-4360.md](pr-4360.md) |
| [#4366](https://github.com/QwenLM/qwen-code/pull/4366) | ✅ merged | fix(core): stop AbortSignal listener leak in long sessions (MaxListenersExceededWarning) | [pr-4366.md](pr-4366.md) |
| [#4367](https://github.com/QwenLM/qwen-code/pull/4367) | ✅ merged | feat(telemetry): support custom resource attributes and add metric cardinality controls | [pr-4367.md](pr-4367.md) |
| [#4390](https://github.com/QwenLM/qwen-code/pull/4390) | ✅ merged | feat(telemetry): client-side HTTP span + opt-in W3C traceparent propagation (#4384) | [pr-4390.md](pr-4390.md) |
| [#4393](https://github.com/QwenLM/qwen-code/pull/4393) | ⬜ closed | feat(telemetry): propagate X-Qwen-Code-Session-Id on outbound LLM requests (part 2 of #4384) | [pr-4393.md](pr-4393.md) |
| [#4410](https://github.com/QwenLM/qwen-code/pull/4410) | 🟡 open | feat(telemetry): Phase 3 — qwen-code.subagent span with concurrent isolation (#3731) | [pr-4410.md](pr-4410.md) |
| [#4411](https://github.com/QwenLM/qwen-code/pull/4411) | ✅ merged | perf(core): F2 cleanup PR A — R9/W11/W12/R10 (post-merge follow-ups) | [pr-4411.md](pr-4411.md) |
| [#4412](https://github.com/QwenLM/qwen-code/pull/4412) | 🟡 open | docs(developers): add daemon-mode developer deep-dive documentation set | [pr-4412.md](pr-4412.md) |
| [#4414](https://github.com/QwenLM/qwen-code/pull/4414) | ✅ merged | feat(cli): background housekeeping for stale file-history dirs | [pr-4414.md](pr-4414.md) |
| [#4417](https://github.com/QwenLM/qwen-code/pull/4417) | ✅ merged | feat(telemetry): Phase 4a — TTFT capture + GenAI semconv dual-emit (#3731) | [pr-4417.md](pr-4417.md) |
| [#4431](https://github.com/QwenLM/qwen-code/pull/4431) | ✅ merged | fix(core): preserve uid/gid in atomicWriteFile to avoid breaking shared-write files | [pr-4431.md](pr-4431.md) |
| [#4432](https://github.com/QwenLM/qwen-code/pull/4432) | 🟡 open | feat(telemetry): Phase 4b — retry visibility for qwen-code.llm_request (#3731) | [pr-4432.md](pr-4432.md) |
| [#4445](https://github.com/QwenLM/qwen-code/pull/4445) | ✅ merged | refactor(acp-bridge): F1 test split — lift bridge.test.ts (6861 LOC) to acp-bridge | [pr-4445.md](pr-4445.md) |
| [#4453](https://github.com/QwenLM/qwen-code/pull/4453) | ✅ merged | fix(build): clean stale outputs before tsc --build to prevent TS5055 | [pr-4453.md](pr-4453.md) |
| [#4460](https://github.com/QwenLM/qwen-code/pull/4460) | ✅ merged | fix(core): F2 cleanup PR B — self-heal observability (W133-a + W134) | [pr-4460.md](pr-4460.md) |
| [#4469](https://github.com/QwenLM/qwen-code/pull/4469) | ✅ merged | chore(integration): sync main into daemon_mode_b_main (2026-05-24) | [pr-4469.md](pr-4469.md) |
| [#4473](https://github.com/QwenLM/qwen-code/pull/4473) | ✅ merged | docs(serve): v0.16-alpha known limits + SDK QWEN_SERVER_TOKEN env fallback (PR 27) | [pr-4473.md](pr-4473.md) |
| [#4482](https://github.com/QwenLM/qwen-code/pull/4482) | ✅ merged | fix(telemetry): improve LogToSpan bridge error info and TUI handling | [pr-4482.md](pr-4482.md) |
| [#4483](https://github.com/QwenLM/qwen-code/pull/4483) | ✅ merged | docs(deploy): local launch templates for v0.16-alpha (PR 30a) | [pr-4483.md](pr-4483.md) |

## 补录文档

以下 PR 不在本周 README 的主明细表中，但已有深读最终实现文档，按合入/补录语境保留在本周目录。

| PR | 标题 | 文档 |
|---|---|---|
| [#4353](https://github.com/QwenLM/qwen-code/pull/4353) | feat(sdk/daemon-ui): unified completeness follow-up to #4328 | [pr-4353.md](pr-4353.md) |
