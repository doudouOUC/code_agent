# PR 最终实现文档

本目录按本周 README 中登记的 PR 明细整理每个 PR 的中文最终实现文档。
最终口径以 merged diff、changed files、patch、测试/配置路径和关闭状态为准；PR body 只作为目标线索。

| PR | 状态 | 标题 | 文档 |
|---|---|---|---|
| [#4861](https://github.com/QwenLM/qwen-code/pull/4861) | ✅ merged | feat(serve): add per-tier HTTP rate limiting for daemon (issue #4514 T3.4) | [pr-4861.md](pr-4861.md) |
| [#4862](https://github.com/QwenLM/qwen-code/pull/4862) | ✅ merged | feat(test): add daemon connection stress test + refactor perf harness | [pr-4862.md](pr-4862.md) |
| [#4871](https://github.com/QwenLM/qwen-code/pull/4871) | ✅ merged | refactor(core): remove GitService, migrate /restore to FileHistoryService | [pr-4871.md](pr-4871.md) |
| [#4886](https://github.com/QwenLM/qwen-code/pull/4886) | ⬜ closed | merge: resolve conflicts with origin/main | [pr-4886.md](pr-4886.md) |
| [#4897](https://github.com/QwenLM/qwen-code/pull/4897) | ✅ merged | feat(core): persist file history snapshots for cross-session /rewind (T2.1) | [pr-4897.md](pr-4897.md) |
| [#4906](https://github.com/QwenLM/qwen-code/pull/4906) | ✅ merged | feat(telemetry): inject TRACEPARENT env var into shell child processes | [pr-4906.md](pr-4906.md) |
| [#4924](https://github.com/QwenLM/qwen-code/pull/4924) | ✅ merged | feat(daemon): add POST /workspace/reload-env for hot-reloading env vars and session auth | [pr-4924.md](pr-4924.md) |
| [#4954](https://github.com/QwenLM/qwen-code/pull/4954) | ✅ merged | fix(serve): isolate per-session stats in daemon mode | [pr-4954.md](pr-4954.md) |
| [#4965](https://github.com/QwenLM/qwen-code/pull/4965) | ✅ merged | feat(daemon): add POST /workspace/reload for unified settings hot-reload | [pr-4965.md](pr-4965.md) |
| [#4986](https://github.com/QwenLM/qwen-code/pull/4986) | ⬜ closed | chore: Merge main into daemon_mode_b_main | [pr-4986.md](pr-4986.md) |
| [#5006](https://github.com/QwenLM/qwen-code/pull/5006) | ✅ merged | fix(daemon): Sanitize logs and type MCP restarts | [pr-5006.md](pr-5006.md) |
| [#5031](https://github.com/QwenLM/qwen-code/pull/5031) | ✅ merged | feat(daemon): gate direct session shell behind explicit opt-in | [pr-5031.md](pr-5031.md) |
| [#5033](https://github.com/QwenLM/qwen-code/pull/5033) | ✅ merged | fix(serve): Add prompt queue backpressure | [pr-5033.md](pr-5033.md) |
| [#5042](https://github.com/QwenLM/qwen-code/pull/5042) | ✅ merged | feat(core): persist oversized tool results to disk (#4095 Phase 4) | [pr-5042.md](pr-5042.md) |
| [#5044](https://github.com/QwenLM/qwen-code/pull/5044) | ✅ merged | test(cli): Cover rewind selection and confirm flow | [pr-5044.md](pr-5044.md) |
| [#5047](https://github.com/QwenLM/qwen-code/pull/5047) | ✅ merged | fix(telemetry): Propagate daemon ACP trace context | [pr-5047.md](pr-5047.md) |
| [#5056](https://github.com/QwenLM/qwen-code/pull/5056) | ⬜ closed | docs: Refresh daemon developer docs | [pr-5056.md](pr-5056.md) |
| [#5057](https://github.com/QwenLM/qwen-code/pull/5057) | ✅ merged | fix(core): Persist file history snapshot updates | [pr-5057.md](pr-5057.md) |
| [#5085](https://github.com/QwenLM/qwen-code/pull/5085) | ✅ merged | fix(acp): add internal Kind.Agent, keep ACP wire on 'other' (no-regression) | [pr-5085.md](pr-5085.md) |
| [#5105](https://github.com/QwenLM/qwen-code/pull/5105) | ✅ merged | feat(acp): dedicated agent permission dialog via _meta.toolName (follow-up to #5085) | [pr-5105.md](pr-5105.md) |
| [#5107](https://github.com/QwenLM/qwen-code/pull/5107) | ✅ merged | fix(core): Repair duplicate tool call IDs | [pr-5107.md](pr-5107.md) |
| [#5108](https://github.com/QwenLM/qwen-code/pull/5108) | ✅ merged | fix(daemon): Avoid replaying truncated session diffs | [pr-5108.md](pr-5108.md) |
| [#5111](https://github.com/QwenLM/qwen-code/pull/5111) | ✅ merged | fix(core): Bound active tool result history | [pr-5111.md](pr-5111.md) |
