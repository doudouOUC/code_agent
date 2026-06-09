# feat(telemetry): client-side HTTP span + opt-in W3C traceparent propagation (#4384)

PR: #4390 | Merged: 2026-05-25 | +1822/-5 | 14 files

## What it does
Adds client-side HTTP span instrumentation via @opentelemetry/instrumentation-undici for all outbound fetch calls (LLM SDKs, MCP, WebFetch). Separates network latency (TTFB/transfer) from upstream model processing time. Includes OTLP feedback-loop guard that skips configured OTLP endpoints to prevent parasitic infinite-loop spans.

## Key files changed
- `packages/core/package.json`: Added @opentelemetry/instrumentation-undici dependency
- `packages/core/src/core/contentGenerator.test.ts`: Tests for HTTP span creation
- `packages/cli/src/config/settingsSchema.ts`: telemetry.traceparentPropagation setting
- `packages/cli/src/config/config.ts`: Config wiring for new telemetry settings
- `docs/design/telemetry-outbound-propagation-design.md`: Design doc for the feature

## Final Implementation Status
- **Status**: MERGED (2026-05-25)
- **Outcome**: Implemented as designed — scope-reduced in R4 (traceparent injection split to follow-up)
