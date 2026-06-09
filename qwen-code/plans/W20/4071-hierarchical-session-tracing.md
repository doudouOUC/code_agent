# feat(telemetry): add hierarchical session tracing spans

PR: #4071 | Merged: 2026-05-12 | +1318/-409 | 6 files

## What it does
Adds OpenTelemetry hierarchical session tracing with interaction-level spans wrapping the full `sendMessageStream` lifecycle. Introduces a new `session-tracing.ts` module with concurrent-safe span management using explicit span references, WeakRef + strongRefs + 30-min TTL cleanup, and NOOP_SPAN sentinel when SDK is uninitialized. Interaction spans are started for UserQuery/Cron/Notification message types and properly ended at all exit points.

## Key files changed
- `packages/core/src/telemetry/session-tracing.ts`: New module for concurrent-safe span lifecycle management
- `packages/core/src/telemetry/session-tracing.test.ts`: Tests for span management and TTL cleanup
- `packages/core/src/core/client.ts`: Start/end interaction spans in sendMessageStream
- `packages/core/src/telemetry/sdk.ts`: Shutdown safety net to end active spans before SDK exit
- `packages/core/src/telemetry/constants.ts`: Span hierarchy name constants
- `packages/core/src/telemetry/index.ts`: Re-exports from barrel file

## Final Implementation Status
- **Status**: MERGED (2026-05-12)
- **Outcome**: Implemented as designed
