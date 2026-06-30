# PR 最终实现文档

本目录按 PR 合入后的最终代码变更整理中文实现文档。每个文件以 PR changed files、已提取的 patch 线索、测试和配置路径为依据，记录实现范围、关键代码路径和验证线索。

| PR | 状态 | 标题 |
|---|---|---|
| [#4269](pr-4269.md) | 已合入 | feat(serve): safe workspace file read routes (#4175 PR 19) |
| [#4280](pr-4280.md) | 已合入 | feat(serve): add workspace file write/edit routes (#4175 PR20) |
| [#4295](pr-4295.md) | 已合入 | refactor(acp-bridge): create skeleton + lift zero-coupling primitives (#4175 PR 22a) |
| [#4300](pr-4300.md) | 已合入 | refactor(serve): typed errors for channel-closed and missing-cli-entry (#4299) |
| [#4302](pr-4302.md) | 已合入 | fix(telemetry): Phase 1.5 polish — fallback order, abort-as-result, log/span consistency |
| [#4304](pr-4304.md) | 已合入 | refactor(acp-bridge): lift BridgeOptions + introduce DaemonStatusProvider seam (#4175 PR 22b/2) |
| [#4305](pr-4305.md) | 已合入 | fix(serve): post-merge fixes for #4291 review (7 threads) |
| [#4319](pr-4319.md) | 已合入 | feat(acp-bridge): F1 — acp-bridge package self-sufficiency (#4175 mechanical lift + BridgeFileSystem seam) |
| [#4334](pr-4334.md) | 已合入 | feat(serve): F1 follow-up — BridgeFileSystem wiring + #4325 channelInfo fix |
| [#4360](pr-4360.md) | 已合入 | feat(serve+sdk): F4 prereq — daemon protocol completion (serverTimestamp / provenance / errorKind / state_resync_required) |
| [#4321](pr-4321.md) | 已合入 | feat(telemetry): Phase 2 — tool.blocked_on_user + hook spans (#3731) |
| [#4367](pr-4367.md) | 已合入 | feat(telemetry): support custom resource attributes and add metric cardinality controls |
| [#4336](pr-4336.md) | 已合入 | feat(serve): shared MCP transport pool [F2] |
| [#4417](pr-4417.md) | 已合入 | feat(telemetry): Phase 4a — TTFT capture + GenAI semconv dual-emit (#3731) |
| [#4411](pr-4411.md) | 已合入 | perf(core): F2 cleanup PR A — R9/W11/W12/R10 (post-merge follow-ups) |
| [#4445](pr-4445.md) | 已合入 | refactor(acp-bridge): F1 test split — lift bridge.test.ts (6861 LOC) to acp-bridge |
| [#4460](pr-4460.md) | 已合入 | fix(core): F2 cleanup PR B — self-heal observability (W133-a + W134) |
| [#4353](pr-4353.md) | 已合入 | feat(sdk/daemon-ui): unified completeness follow-up to #4328 |
| [#4469](pr-4469.md) | 已合入 | chore(integration): sync main into daemon_mode_b_main (2026-05-24) |
| [#4473](pr-4473.md) | 已合入 | docs(serve): v0.16-alpha known limits + SDK QWEN_SERVER_TOKEN env fallback (PR 27) |
| [#4412](pr-4412.md) | 已合入 | docs: Refresh daemon developer docs |
