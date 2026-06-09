# feat(telemetry): enrich llm_request span with response metadata and error details

PR: #4693 | Merged: 2026-06-03 | +213/-4 | 3 files

## What it does
Adds 6 new attributes to `qwen-code.llm_request` OTel spans that were previously only in log events: `response_id`, `finish_reason`, `thoughts_token_count`, `subagent_name`, `error_type`, and `error_status_code`. Uses GenAI semconv duals where applicable. Tracks `lastFinishReason`/`lastError` as closure variables in the streaming path.

## Key files changed
- `packages/core/src/telemetry/session-tracing.ts`: New span attribute setters in endLlmRequestSpan
- `packages/core/src/core/loggingContentGenerator/loggingContentGenerator.ts`: Track lastFinishReason/lastError closures
- `packages/core/src/telemetry/session-tracing.test.ts`: Tests for new attribute propagation

## Final Implementation Status
- **Status**: MERGED (2026-06-03)
- **Outcome**: Implemented as designed
