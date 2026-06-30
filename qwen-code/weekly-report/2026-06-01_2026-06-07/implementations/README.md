# PR 最终实现文档

本目录按本周 README 中登记的 PR 明细整理每个 PR 的中文最终实现文档。
最终口径以 merged diff、changed files、patch、测试/配置路径和关闭状态为准；PR body 只作为目标线索。

| PR | 状态 | 标题 | 文档 |
|---|---|---|---|
| [#4666](https://github.com/QwenLM/qwen-code/pull/4666) | ✅ merged | fix(daemon): btw cross-session leak + timeout + input cap + permission | [pr-4666.md](pr-4666.md) |
| [#4667](https://github.com/QwenLM/qwen-code/pull/4667) | ⬜ closed | fix(core): add configurable bodyTimeout to prevent streaming timeout w | [pr-4667.md](pr-4667.md) |
| [#4682](https://github.com/QwenLM/qwen-code/pull/4682) | ✅ merged | feat(telemetry): expand daemon telemetry route coverage | [pr-4682.md](pr-4682.md) |
| [#4683](https://github.com/QwenLM/qwen-code/pull/4683) | ⬜ closed | chore(integration): mark main merged for PR 4490 | [pr-4683.md](pr-4683.md) |
| [#4689](https://github.com/QwenLM/qwen-code/pull/4689) | ✅ merged | fix(daemon): isolate parallel subAgent text streams in transcript redu | [pr-4689.md](pr-4689.md) |
| [#4693](https://github.com/QwenLM/qwen-code/pull/4693) | ✅ merged | feat(telemetry): enrich llm_request span with response metadata and er | [pr-4693.md](pr-4693.md) |
| [#4694](https://github.com/QwenLM/qwen-code/pull/4694) | ✅ merged | fix(daemon): compacted session replay for long-session recovery | [pr-4694.md](pr-4694.md) |
| [#4702](https://github.com/QwenLM/qwen-code/pull/4702) | ✅ merged | fix(daemon): auto-recover transcript on ring_evicted resync | [pr-4702.md](pr-4702.md) |
| [#4703](https://github.com/QwenLM/qwen-code/pull/4703) | ✅ merged | fix(core): explicitly set stream: false in non-streaming requests | [pr-4703.md](pr-4703.md) |
| [#4730](https://github.com/QwenLM/qwen-code/pull/4730) | ✅ merged | fix: add missing TelemetryRuntimeConfig methods and remove obsolete te | [pr-4730.md](pr-4730.md) |
| [#4731](https://github.com/QwenLM/qwen-code/pull/4731) | ✅ merged | fix: add missing isForkSubagentEnabled from main merge | [pr-4731.md](pr-4731.md) |
| [#4749](https://github.com/QwenLM/qwen-code/pull/4749) | ✅ merged | feat(telemetry): add daemon OTel metrics and structured log records | [pr-4749.md](pr-4749.md) |
| [#4751](https://github.com/QwenLM/qwen-code/pull/4751) | ✅ merged | feat(daemon): optimize ACP child lifecycle — skip relaunch, preheat, i | [pr-4751.md](pr-4751.md) |
| [#4765](https://github.com/QwenLM/qwen-code/pull/4765) | ✅ merged | fix(daemon): preserve parentToolCallId in compaction engine for parall | [pr-4765.md](pr-4765.md) |
| [#4774](https://github.com/QwenLM/qwen-code/pull/4774) | ✅ merged | refactor(daemon): simplify code and strip PR/commit references from co | [pr-4774.md](pr-4774.md) |
| [#4811](https://github.com/QwenLM/qwen-code/pull/4811) | ✅ merged | feat(cli): enable /remember, /forget, /dream in ACP mode | [pr-4811.md](pr-4811.md) |
| [#4812](https://github.com/QwenLM/qwen-code/pull/4812) | ✅ merged | feat(serve): add POST /session/:id/branch for session forking | [pr-4812.md](pr-4812.md) |
| [#4816](https://github.com/QwenLM/qwen-code/pull/4816) | ✅ merged | feat(serve): add /settings slash command for web-shell | [pr-4816.md](pr-4816.md) |
| [#4817](https://github.com/QwenLM/qwen-code/pull/4817) | ⬜ closed | feat(serve): add HTTP rewind endpoints for daemon/web-shell (issue #45 | [pr-4817.md](pr-4817.md) |
| [#4818](https://github.com/QwenLM/qwen-code/pull/4818) | ✅ merged | Revert "feat(cli): enable /remember, /forget, /dream in ACP mode" | [pr-4818.md](pr-4818.md) |
| [#4819](https://github.com/QwenLM/qwen-code/pull/4819) | ✅ merged | feat(cli): enable /remember, /forget, /dream in ACP mode | [pr-4819.md](pr-4819.md) |
| [#4820](https://github.com/QwenLM/qwen-code/pull/4820) | ✅ merged | feat(serve): add HTTP rewind endpoints for daemon/web-shell (issue #45 | [pr-4820.md](pr-4820.md) |
| [#4822](https://github.com/QwenLM/qwen-code/pull/4822) | ✅ merged | feat(serve): add hooks diagnostic HTTP/ACP surface (issue #4514 T3.9) | [pr-4822.md](pr-4822.md) |
| [#4826](https://github.com/QwenLM/qwen-code/pull/4826) | ✅ merged | feat(cli): enable /directory command in ACP mode | [pr-4826.md](pr-4826.md) |
| [#4832](https://github.com/QwenLM/qwen-code/pull/4832) | ✅ merged | feat(serve): add extensions diagnostic HTTP/ACP surface (issue #4514 T3.9) | [pr-4832.md](pr-4832.md) |

## 补录文档

以下 PR 不在本周 README 的主明细表中，但已有深读最终实现文档，按合入/补录语境保留在本周目录。

| PR | 标题 | 文档 |
|---|---|---|
| [#4649](https://github.com/QwenLM/qwen-code/pull/4649) | feat(core): inject context env vars (session/agent/prompt ID) into shell subprocesses | [pr-4649.md](pr-4649.md) |
| [#4661](https://github.com/QwenLM/qwen-code/pull/4661) | feat(telemetry): per-prompt traceId for bounded, renderable traces | [pr-4661.md](pr-4661.md) |
