# qwen-code PRs · 2026-05-04 ~ 2026-05-10  (W19)

**主题**: sdk-python 发布工具链、telemetry trace 关联、reactive compression

**统计**: 14 PRs — 13 merged / 0 open / 1 closed  
**代码量**: +10,277 / -1,242，120 个文件变更  
**类型**: feat ×7, fix ×5, refactor ×1, docs ×1  
**范围 (scope)**: sdk-python ×4, telemetry ×3, core ×3, cli ×2

**本周最大改动**:
- [#3847](https://github.com/QwenLM/qwen-code/pull/3847) (+3504/-573, 21 files) feat(telemetry): inject traceId/spanId into debug log files for OTel correlation
- [#3933](https://github.com/QwenLM/qwen-code/pull/3933) (+1772/-82, 19 files) [codex] fix monitor notifications for subagents
- [#4001](https://github.com/QwenLM/qwen-code/pull/4001) (+1543/-283, 25 files) feat(cli): add structured JSON schema output

| PR | 状态 | 类型 | 标题 | 变更 | 文件 | 创建 | 合并/关闭 | 链接 |
|---|---|---|---|---|---|---|---|---|
| #3832 | ✅ merged | fix(sdk-python) | fix(sdk-python): standardize TAG_PREFIX to include v suffix | +6/-6 | 1 | 05-04 | 05-06 | https://github.com/QwenLM/qwen-code/pull/3832 |
| #3833 | ✅ merged | feat(sdk-python) | feat(sdk-python): add network timeouts to release version helper | +105/-3 | 2 | 05-04 | 05-05 | https://github.com/QwenLM/qwen-code/pull/3833 |
| #3834 | ✅ merged | refactor | refactor: extract shared release helper utilities | +211/-108 | 5 | 05-04 | 05-05 | https://github.com/QwenLM/qwen-code/pull/3834 |
| #3835 | ✅ merged | feat(sdk-python) | feat(sdk-python): replace verbatim release notes inheritance with --generate-notes | +20/-20 | 1 | 05-04 | 05-08 | https://github.com/QwenLM/qwen-code/pull/3835 |
| #3847 | ✅ merged | feat(telemetry) | feat(telemetry): inject traceId/spanId into debug log files for OTel correlation _[type/feature-request]_ | +3504/-573 | 21 | 05-05 | 05-10 | https://github.com/QwenLM/qwen-code/pull/3847 |
| #3872 | ✅ merged | fix(core) | fix(core): shrink file diff session records | +616/-20 | 12 | 05-06 | 05-06 | https://github.com/QwenLM/qwen-code/pull/3872 |
| #3879 | ✅ merged | feat(core) | feat(core): add reactive compression on context overflow _[type/feature-request]_ | +797/-12 | 5 | 05-06 | 05-09 | https://github.com/QwenLM/qwen-code/pull/3879 |
| #3883 | ✅ merged | fix(cli) | fix(cli): warn on ignored provider generation config _[type/bug]_ | +296/-5 | 6 | 05-06 | 05-07 | https://github.com/QwenLM/qwen-code/pull/3883 |
| #3893 | ✅ merged | feat(telemetry) | feat(telemetry): add sensitive span attribute opt-in | +414/-52 | 15 | 05-07 | 05-07 | https://github.com/QwenLM/qwen-code/pull/3893 |
| #3933 | ✅ merged | fix | [codex] fix monitor notifications for subagents _[type/bug]_ | +1772/-82 | 19 | 05-07 | 05-09 | https://github.com/QwenLM/qwen-code/pull/3933 |
| #3985 | ✅ merged | fix(core) | fix(core): harden reactive compression follow-ups _[type/enhancement]_ | +189/-18 | 4 | 05-09 | 05-09 | https://github.com/QwenLM/qwen-code/pull/3985 |
| #3986 | ✅ merged | feat(telemetry) | feat(telemetry) suppress OpenTelemetry diagnostics from UI | +93/-3 | 2 | 05-09 | 05-09 | https://github.com/QwenLM/qwen-code/pull/3986 |
| #3995 | ✅ merged | docs(sdk-python) | doc[sdk-python] Expand Python SDK usage documentation | +711/-57 | 2 | 05-09 | 05-12 | https://github.com/QwenLM/qwen-code/pull/3995 |
| #4001 | ⬜ closed | feat(cli) | feat(cli): add structured JSON schema output | +1543/-283 | 25 | 05-09 | 05-11 | https://github.com/QwenLM/qwen-code/pull/4001 |
