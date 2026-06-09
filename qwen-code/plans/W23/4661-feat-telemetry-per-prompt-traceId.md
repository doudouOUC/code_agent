# feat(telemetry): per-prompt traceId for bounded, renderable traces

PR: #4661 | Merged: 2026-06-01 | +107/-144 | 8 files

## What it does
Each interaction/prompt now gets its own fresh traceId (trace root) instead of sharing one session-level traceId. Adds `SessionIdSpanProcessor` to stamp `session.id` on all exported spans for cross-prompt correlation via attribute query. Fixes the problem where long sessions produced thousands of spans under a single traceId that ARMS/Jaeger cannot render.

## Key files changed
- `packages/core/src/telemetry/session-tracing.ts`: `withInteractionSpan` defaults to ROOT_CONTEXT; remove session root fallback
- `packages/core/src/telemetry/sdk.ts`: New `SessionIdSpanProcessor` stamps session.id on all spans
- `packages/core/src/telemetry/tracer.ts`: Simplify parent context resolution
- `packages/core/src/utils/debugLogger.ts`: Fallback to `deriveTraceId(sessionId)` for log correlation

## Final Implementation Status
- **Status**: MERGED (2026-06-01)
- **Outcome**: Implemented as designed
