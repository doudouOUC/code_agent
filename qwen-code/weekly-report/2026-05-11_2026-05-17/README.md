# qwen-code PRs · 2026-05-11 ~ 2026-05-17  (W20)

**主题**: telemetry 层级 span、atomicWrite、rewind 文件恢复、/stuck，daemon/serve Wave 1–4 大爆发

**统计**: 29 PRs — 29 merged / 0 open / 0 closed
**代码量**: +39,561 / -2,486，332 个文件变更
**类型**: feat ×19, fix ×4, refactor ×3, docs ×1, test ×1, other ×1
**范围 (scope)**: serve ×16, telemetry ×6, rewind ×2, cli ×2, core ×1, skills ×1, perf ×1

**本周最大改动**:
- [#4255](https://github.com/QwenLM/qwen-code/pull/4255) (+6172/-51, 22 files) feat(serve): auth device-flow route (#4175 Wave 4 PR 21)
- [#4249](https://github.com/QwenLM/qwen-code/pull/4249) (+5318/-8, 23 files) feat(serve): workspace memory and agents CRUD (#4175 Wave 4 PR 16)
- [#4250](https://github.com/QwenLM/qwen-code/pull/4250) (+4753/-68, 16 files) refactor(serve): add FileSystemService boundary (#4175 Wave 4 PR 18)

| PR | 状态 | 类型 | 标题 | 变更 | 文件 | 创建 | 合并/关闭 | 链接 |
|---|---|---|---|---|---|---|---|---|
| #4058 | ✅ merged | fix(telemetry) | fix(telemetry): address PR #3847 review follow-ups for trace correlation _[type/bug]_ | +407/-38 | 12 | 05-11 | 05-13 | https://github.com/QwenLM/qwen-code/pull/4058 |
| #4061 | ✅ merged | refactor(telemetry) | refactor(telemetry): remove dead useCollector setting and unreachable TelemetryTarget.QWEN | +1/-82 | 9 | 05-11 | 05-11 | https://github.com/QwenLM/qwen-code/pull/4061 |
| #4064 | ✅ merged | feat(rewind) | feat(rewind): add file restoration support to /rewind command _[type/feature-request]_ | +2225/-81 | 26 | 05-11 | 05-16 | https://github.com/QwenLM/qwen-code/pull/4064 |
| #4066 | ✅ merged | docs(telemetry) | docs(telemetry): align config and docs semantics for target, outfile, and CLI flags | +22/-22 | 2 | 05-11 | 05-13 | https://github.com/QwenLM/qwen-code/pull/4066 |
| #4071 | ✅ merged | feat(telemetry) | feat(telemetry): add hierarchical session tracing spans _[type/feature-request]_ | +1318/-409 | 6 | 05-12 | 05-12 | https://github.com/QwenLM/qwen-code/pull/4071 |
| #4096 | ✅ merged | feat(core,cli) | feat(core,cli): add generic atomicWriteFile, wire into Write/Edit tools, upgrade @types/node _[type/feature-request]_ | +526/-126 | 14 | 05-12 | 05-15 | https://github.com/QwenLM/qwen-code/pull/4096 |
| #4097 | ✅ merged | feat(telemetry) | feat(telemetry): add interaction span and detailed sensitive attributes _[type/feature-request]_ | +893/-175 | 13 | 05-12 | 05-16 | https://github.com/QwenLM/qwen-code/pull/4097 |
| #4122 | ✅ merged | feat(cli) | feat(cli): warn users that rewind is disabled in IDE mode _[type/enhancement]_ | +94/-3 | 2 | 05-13 | 05-15 | https://github.com/QwenLM/qwen-code/pull/4122 |
| #4126 | ✅ merged | feat(telemetry) | feat(telemetry): unify span creation paths for hierarchical trace tree _[type/feature-request]_ | +1739/-877 | 10 | 05-13 | 05-16 | https://github.com/QwenLM/qwen-code/pull/4126 |
| #4133 | ✅ merged | feat(skills) | feat(skills): add /stuck diagnostic skill for frozen sessions _[type/feature-request]_ | +172/-0 | 2 | 05-14 | 05-16 | https://github.com/QwenLM/qwen-code/pull/4133 |
| #4160 | ✅ merged | refactor(serve) | refactor(serve): extract createInMemoryChannel helper (#4156 A1) _[skip-changelog]_ | +315/-40 | 4 | 05-14 | 05-15 | https://github.com/QwenLM/qwen-code/pull/4160 |
| #4191 | ✅ merged | feat(serve) | [codex] feat(serve): add capability registry protocol versions _[skip-changelog]_ | +212/-39 | 10 | 05-16 | 05-16 | https://github.com/QwenLM/qwen-code/pull/4191 |
| #4205 | ✅ merged | test(perf) | test(perf): add daemon baseline harness (#4175 Wave 1 PR 1) _[skip-changelog]_ | +1343/-0 | 5 | 05-16 | 05-16 | https://github.com/QwenLM/qwen-code/pull/4205 |
| #4209 | ✅ merged | feat(serve) | feat(serve): per-request sessionScope override on POST /session (#4175 Wave 2 PR 5) _[skip-changelog]_ | +512/-20 | 8 | 05-16 | 05-16 | https://github.com/QwenLM/qwen-code/pull/4209 |
| #4214 | ✅ merged | fix(serve) | fix(serve): align integration test + user doc with merged sessionScope override (#4175 follow-up) _[skip-changelog]_ | +14/-11 | 2 | 05-16 | 05-16 | https://github.com/QwenLM/qwen-code/pull/4214 |
| #4216 | ✅ merged | fix(rewind) | fix(rewind): restore upstream TOCTOU ordering + heal sticky failed marker | +245/-16 | 6 | 05-16 | 05-16 | https://github.com/QwenLM/qwen-code/pull/4216 |
| #4222 | ✅ merged | other | [codex] Add daemon session load/resume _[skip-changelog]_ | +2078/-51 | 16 | 05-17 | 05-17 | https://github.com/QwenLM/qwen-code/pull/4222 |
| #4226 | ✅ merged | feat(serve) | feat(serve): advertise typed_event_schema + pin SDK public surface (#4175 PR 4 follow-up) _[skip-changelog]_ | +112/-1 | 5 | 05-17 | 05-17 | https://github.com/QwenLM/qwen-code/pull/4226 |
| #4235 | ✅ merged | feat(serve) | feat(serve): add client heartbeat (#4175 Wave 2.5 PR 9) _[skip-changelog]_ | +581/-2 | 15 | 05-17 | 05-17 | https://github.com/QwenLM/qwen-code/pull/4235 |
| #4236 | ✅ merged | feat(serve) | feat(serve): mutation gating helper and --require-auth _[skip-changelog]_ | +620/-24 | 11 | 05-17 | 05-17 | https://github.com/QwenLM/qwen-code/pull/4236 |
| #4237 | ✅ merged | feat(serve) | feat(serve): SSE replay sizing + slow_client_warning backpressure (#4175 Wave 2.5 PR 10) _[skip-changelog]_ | +893/-81 | 18 | 05-17 | 05-17 | https://github.com/QwenLM/qwen-code/pull/4237 |
| #4240 | ✅ merged | feat(serve) | feat(serve): session metadata and close/delete lifecycle (#4175 Wave 2.5 PR 11) _[skip-changelog]_ | +1175/-35 | 16 | 05-17 | 05-17 | https://github.com/QwenLM/qwen-code/pull/4240 |
| #4241 | ✅ merged | feat(serve) | feat(serve): add read-only status routes _[skip-changelog]_ | +2363/-64 | 19 | 05-17 | 05-17 | https://github.com/QwenLM/qwen-code/pull/4241 |
| #4245 | ✅ merged | fix(serve) | fix(serve): align integration test mirrors with merged capability + EventBus changes _[skip-changelog]_ | +14/-4 | 2 | 05-17 | 05-17 | https://github.com/QwenLM/qwen-code/pull/4245 |
| #4247 | ✅ merged | feat(serve) | feat(serve): MCP client guardrails (#4175 Wave 3 PR 14) _[skip-changelog]_ | +2867/-31 | 15 | 05-17 | 05-18 | https://github.com/QwenLM/qwen-code/pull/4247 |
| #4249 | ✅ merged | feat(serve) | feat(serve): workspace memory and agents CRUD (#4175 Wave 4 PR 16) _[skip-changelog]_ | +5318/-8 | 23 | 05-17 | 05-18 | https://github.com/QwenLM/qwen-code/pull/4249 |
| #4250 | ✅ merged | refactor(serve) | refactor(serve): add FileSystemService boundary (#4175 Wave 4 PR 18) _[skip-changelog]_ | +4753/-68 | 16 | 05-17 | 05-18 | https://github.com/QwenLM/qwen-code/pull/4250 |
| #4251 | ✅ merged | feat(serve) | feat(serve): preflight and env diagnostics routes (#4175 Wave 3 PR 13) _[skip-changelog]_ | +2577/-127 | 23 | 05-17 | 05-17 | https://github.com/QwenLM/qwen-code/pull/4251 |
| #4255 | ✅ merged | feat(serve) | feat(serve): auth device-flow route (#4175 Wave 4 PR 21) _[skip-changelog]_ | +6172/-51 | 22 | 05-17 | 05-18 | https://github.com/QwenLM/qwen-code/pull/4255 |
