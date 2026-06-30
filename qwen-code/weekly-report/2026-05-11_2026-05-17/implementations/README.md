# 2026-05-11_2026-05-17 PR 最终实现文档索引

仅保留 @doudouOUC 个人 PR 的最终实现文档。

| PR | 状态 | 标题 | 文档 |
|---|---|---|---|
| [#4058](https://github.com/QwenLM/qwen-code/pull/4058) | 已合入 | fix(telemetry): address PR #3847 review follow-ups for trace correlation | [pr-4058.md](pr-4058.md) |
| [#4061](https://github.com/QwenLM/qwen-code/pull/4061) | ✅ merged | refactor(telemetry): remove dead useCollector setting and unreachable TelemetryTarget.QWEN | [pr-4061.md](pr-4061.md) |
| [#4064](https://github.com/QwenLM/qwen-code/pull/4064) | 已合入 | feat(rewind): add file restoration support to /rewind command | [pr-4064.md](pr-4064.md) |
| [#4066](https://github.com/QwenLM/qwen-code/pull/4066) | ✅ merged | docs(telemetry): align config and docs semantics for target, outfile, and CLI flags | [pr-4066.md](pr-4066.md) |
| [#4071](https://github.com/QwenLM/qwen-code/pull/4071) | 已合入 | feat(telemetry): add hierarchical session tracing spans | [pr-4071.md](pr-4071.md) |
| [#4096](https://github.com/QwenLM/qwen-code/pull/4096) | 已合入 | feat(core,cli): add generic atomicWriteFile, wire into Write/Edit tools, upgrade @types/node | [pr-4096.md](pr-4096.md) |
| [#4097](https://github.com/QwenLM/qwen-code/pull/4097) | 已合入 | feat(telemetry): add interaction span and detailed sensitive attributes | [pr-4097.md](pr-4097.md) |
| [#4122](https://github.com/QwenLM/qwen-code/pull/4122) | ✅ merged | feat(cli): warn users that rewind is disabled in IDE mode | [pr-4122.md](pr-4122.md) |
| [#4126](https://github.com/QwenLM/qwen-code/pull/4126) | 已合入 | feat(telemetry): unify span creation paths for hierarchical trace tree | [pr-4126.md](pr-4126.md) |
| [#4133](https://github.com/QwenLM/qwen-code/pull/4133) | 已合入 | feat(skills): add /stuck diagnostic skill for frozen sessions | [pr-4133.md](pr-4133.md) |
| [#4160](https://github.com/QwenLM/qwen-code/pull/4160) | 已合入 | refactor(serve): extract createInMemoryChannel helper (#4156 A1) | [pr-4160.md](pr-4160.md) |
| [#4191](https://github.com/QwenLM/qwen-code/pull/4191) | 已合入 | [codex] feat(serve): add capability registry protocol versions | [pr-4191.md](pr-4191.md) |
| [#4205](https://github.com/QwenLM/qwen-code/pull/4205) | ✅ merged | test(perf): add daemon baseline harness (#4175 Wave 1 PR 1) | [pr-4205.md](pr-4205.md) |
| [#4209](https://github.com/QwenLM/qwen-code/pull/4209) | 已合入 | feat(serve): per-request sessionScope override on POST /session (#4175 Wave 2 PR 5) | [pr-4209.md](pr-4209.md) |
| [#4214](https://github.com/QwenLM/qwen-code/pull/4214) | ✅ merged | fix(serve): align integration test + user doc with merged sessionScope override (#4175 follow-up) | [pr-4214.md](pr-4214.md) |
| [#4216](https://github.com/QwenLM/qwen-code/pull/4216) | 已合入 | fix(rewind): restore upstream TOCTOU ordering + heal sticky failed marker | [pr-4216.md](pr-4216.md) |
| [#4222](https://github.com/QwenLM/qwen-code/pull/4222) | 已合入 | [codex] Add daemon session load/resume | [pr-4222.md](pr-4222.md) |
| [#4226](https://github.com/QwenLM/qwen-code/pull/4226) | 已合入 | feat(serve): advertise typed_event_schema + pin SDK public surface (#4175 PR 4 follow-up) | [pr-4226.md](pr-4226.md) |
| [#4235](https://github.com/QwenLM/qwen-code/pull/4235) | 已合入 | feat(serve): add client heartbeat (#4175 Wave 2.5 PR 9) | [pr-4235.md](pr-4235.md) |
| [#4236](https://github.com/QwenLM/qwen-code/pull/4236) | ✅ merged | feat(serve): mutation gating helper and --require-auth | [pr-4236.md](pr-4236.md) |
| [#4237](https://github.com/QwenLM/qwen-code/pull/4237) | 已合入 | feat(serve): SSE replay sizing + slow_client_warning backpressure (#4175 Wave 2.5 PR 10) | [pr-4237.md](pr-4237.md) |
| [#4240](https://github.com/QwenLM/qwen-code/pull/4240) | ✅ merged | feat(serve): session metadata and close/delete lifecycle (#4175 Wave 2.5 PR 11) | [pr-4240.md](pr-4240.md) |
| [#4241](https://github.com/QwenLM/qwen-code/pull/4241) | 已合入 | feat(serve): add read-only status routes | [pr-4241.md](pr-4241.md) |
| [#4245](https://github.com/QwenLM/qwen-code/pull/4245) | ✅ merged | fix(serve): align integration test mirrors with merged capability + EventBus changes | [pr-4245.md](pr-4245.md) |
| [#4247](https://github.com/QwenLM/qwen-code/pull/4247) | 已合入 | feat(serve): MCP client guardrails (#4175 Wave 3 PR 14) | [pr-4247.md](pr-4247.md) |
| [#4249](https://github.com/QwenLM/qwen-code/pull/4249) | 已合入 | feat(serve): workspace memory and agents CRUD (#4175 Wave 4 PR 16) | [pr-4249.md](pr-4249.md) |
| [#4250](https://github.com/QwenLM/qwen-code/pull/4250) | 已合入 | refactor(serve): add FileSystemService boundary (#4175 Wave 4 PR 18) | [pr-4250.md](pr-4250.md) |
| [#4251](https://github.com/QwenLM/qwen-code/pull/4251) | 已合入 | feat(serve): preflight and env diagnostics routes (#4175 Wave 3 PR 13) | [pr-4251.md](pr-4251.md) |
| [#4255](https://github.com/QwenLM/qwen-code/pull/4255) | 已合入 | feat(serve): auth device-flow route (#4175 Wave 4 PR 21) | [pr-4255.md](pr-4255.md) |

_按个人 PR 口径更新于 2026-06-30_
