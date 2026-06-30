# PR 最终实现文档

本目录按 PR 合入后的最终代码变更整理中文实现文档。每个文件以 PR changed files、已提取的 patch 线索、测试和配置路径为依据，记录实现范围、关键代码路径和验证线索。

| PR | 状态 | 标题 |
|---|---|---|
| [#3995](pr-3995.md) | 已合入 | doc[sdk-python] Expand Python SDK usage documentation |
| [#4071](pr-4071.md) | 已合入 | feat(telemetry): add hierarchical session tracing spans |
| [#4058](pr-4058.md) | 已合入 | fix(telemetry): address PR #3847 review follow-ups for trace correlation |
| [#4160](pr-4160.md) | 已合入 | refactor(serve): extract createInMemoryChannel helper (#4156 A1) |
| [#4096](pr-4096.md) | 已合入 | feat(core,cli): add generic atomicWriteFile, wire into Write/Edit tools, upgrade @types/node |
| [#4191](pr-4191.md) | 已合入 | [codex] feat(serve): add capability registry protocol versions |
| [#4064](pr-4064.md) | 已合入 | feat(rewind): add file restoration support to /rewind command |
| [#4133](pr-4133.md) | 已合入 | feat(skills): add /stuck diagnostic skill for frozen sessions |
| [#4126](pr-4126.md) | 已合入 | feat(telemetry): unify span creation paths for hierarchical trace tree |
| [#4209](pr-4209.md) | 已合入 | feat(serve): per-request sessionScope override on POST /session (#4175 Wave 2 PR 5) |
| [#4097](pr-4097.md) | 已合入 | feat(telemetry): add interaction span and detailed sensitive attributes |
| [#4216](pr-4216.md) | 已合入 | fix(rewind): restore upstream TOCTOU ordering + heal sticky failed marker |
| [#4222](pr-4222.md) | 已合入 | [codex] Add daemon session load/resume |
| [#4226](pr-4226.md) | 已合入 | feat(serve): advertise typed_event_schema + pin SDK public surface (#4175 PR 4 follow-up) |
| [#4235](pr-4235.md) | 已合入 | feat(serve): add client heartbeat (#4175 Wave 2.5 PR 9) |
| [#4237](pr-4237.md) | 已合入 | feat(serve): SSE replay sizing + slow_client_warning backpressure (#4175 Wave 2.5 PR 10) |
| [#4241](pr-4241.md) | 已合入 | feat(serve): add read-only status routes |
| [#4251](pr-4251.md) | 已合入 | feat(serve): preflight and env diagnostics routes (#4175 Wave 3 PR 13) |
| [#4247](pr-4247.md) | 已合入 | feat(serve): MCP client guardrails (#4175 Wave 3 PR 14) |
| [#4250](pr-4250.md) | 已合入 | refactor(serve): add FileSystemService boundary (#4175 Wave 4 PR 18) |
| [#4249](pr-4249.md) | 已合入 | feat(serve): workspace memory and agents CRUD (#4175 Wave 4 PR 16) |
| [#4255](pr-4255.md) | 已合入 | feat(serve): auth device-flow route (#4175 Wave 4 PR 21) |
| [#4271](pr-4271.md) | 已合入 | feat(serve): MCP guardrail push events + hysteresis (#4175 Wave 3 PR 14b) |
