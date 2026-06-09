# feat(telemetry): Phase 4a -- TTFT capture + GenAI semconv dual-emit (#3731)

PR: #4417 | Merged: 2026-05-22 | +1190/-2 | 7 files

## What it does

Implements Phase 4a of the telemetry hardening roadmap: captures Time-To-First-Token (TTFT) on LLM request spans and adds GenAI semantic convention dual-emit. The `qwen-code.llm_request` span now records `ttft_ms` (time from request start to first content chunk), `sampling_ms` (time spent generating after first token), and placeholder fields for Phase 4b retry context (`attempt`, `requestSetupMs`, `retryTotalDelayMs`). Also adds stream content detection utilities for accurately identifying the first meaningful response chunk across different provider SDKs.

## Key files changed
- `packages/core/src/telemetry/session-tracing.ts`: Added TTFT and sampling_ms computation in `endLLMRequestSpan`
- `packages/core/src/telemetry/session-tracing.test.ts`: Tests for TTFT capture and sampling_ms derivation
- `packages/core/src/core/loggingContentGenerator/loggingContentGenerator.ts`: Wired TTFT measurement into generate/stream paths
- `packages/core/src/core/loggingContentGenerator/loggingContentGenerator.test.ts`: Tests for TTFT forwarding
- `packages/core/src/core/loggingContentGenerator/streamContentDetection.ts`: New utility for detecting first content chunk
- `packages/core/src/core/loggingContentGenerator/streamContentDetection.test.ts`: Stream detection tests
- `docs/design/telemetry-llm-request-timing-design.md`: Design document for Phase 4 timing plan

## Final Implementation Status
- **Status**: MERGED (2026-05-22)
- **Outcome**: Implemented as designed
