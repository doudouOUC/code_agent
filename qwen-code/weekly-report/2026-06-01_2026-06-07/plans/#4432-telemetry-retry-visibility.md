# feat(telemetry): Phase 4b — retry visibility for qwen-code.llm_request (#3731)

PR: #4432 | Merged: 2026-06-05 | +1240/-40 | 18 files

## What it does
Adds per-attempt HTTP-status retry telemetry so operators can see retry behavior in traces, logs, and metrics. Previously retryWithBackoff was completely invisible to telemetry. A request going 500->429->success now produces 3 separate llm_request spans, 2 api_retry bridge spans, 2 LogRecords, and counter increments on qwen-code.api.retry.count.

## Key files changed
- `packages/core/src/core/loggingContentGenerator/loggingContentGenerator.ts`: Per-attempt span with attempt number, retry overhead tracking
- `packages/core/src/telemetry/loggers.ts`: api_retry LogRecord + counter metric emission
- `packages/core/src/telemetry/constants.ts`: New API_RETRY span/metric constants
- `packages/core/src/core/baseLlmClient.ts`: Thread retry metadata through LLM client
- `docs/design/telemetry-llm-request-timing-design.md`: Design doc documenting inverted retry architecture

## Final Implementation Status
- **Status**: MERGED (2026-06-05)
- **Outcome**: Implemented as designed — Phase 4b of #3731 P3 observability
