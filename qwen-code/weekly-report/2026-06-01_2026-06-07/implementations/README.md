# PR 最终实现文档

本目录按 PR 合入后的最终代码变更整理中文实现文档。每个文件以 PR changed files、已提取的 patch 线索、测试和配置路径为依据，记录实现范围、关键代码路径和验证线索。

| PR | 状态 | 标题 |
|---|---|---|
| [#4431](pr-4431.md) | 已合入 | fix(core): preserve uid in atomicWriteFile to avoid breaking shared-write files |
| [#4661](pr-4661.md) | 已合入 | feat(telemetry): per-prompt traceId for bounded, renderable traces |
| [#4414](pr-4414.md) | 已合入 | feat(cli): background housekeeping for stale file-history dirs |
| [#4649](pr-4649.md) | 已合入 | feat(core): inject context env vars (session/agent/prompt ID) into shell subprocesses |
| [#4333](pr-4333.md) | 已合入 | feat(core): atomic write rollout for credentials, memory, config, JSONL (closes #3681, #4095 Phase 2) |
| [#4694](pr-4694.md) | 已合入 | fix(daemon): compacted session replay for long-session recovery |
| [#4693](pr-4693.md) | 已合入 | feat(telemetry): enrich llm_request span with response metadata and error details |
| [#4689](pr-4689.md) | 已合入 | fix(daemon): isolate parallel subAgent text streams in transcript reducer |
| [#4765](pr-4765.md) | 已合入 | fix(daemon): preserve parentToolCallId in compaction engine for parallel subagent streams |
| [#4432](pr-4432.md) | 已合入 | feat(telemetry): Phase 4b — retry visibility for qwen-code.llm_request (#3731) |
| [#4774](pr-4774.md) | 已合入 | refactor(daemon): simplify code and strip PR/commit references from comments |
| [#4410](pr-4410.md) | 已合入 | feat(telemetry): Phase 3 — qwen-code.subagent span with concurrent isolation (#3731) |
| [#4811](pr-4811.md) | 已合入 | feat(cli): enable /remember, /forget, /dream in ACP mode |
| [#4819](pr-4819.md) | 已合入 | feat(cli): enable /remember, /forget, /dream in ACP mode |
| [#4820](pr-4820.md) | 已合入 | feat(serve): add HTTP rewind endpoints for daemon/web-shell (issue #4514 T3.2) |
| [#4826](pr-4826.md) | 已合入 | feat(cli): enable /directory command in ACP mode |
| [#4822](pr-4822.md) | 已合入 | feat(serve): add hooks diagnostic HTTP/ACP surface (issue #4514 T3.9) |
