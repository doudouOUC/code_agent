# fix(telemetry): Phase 1.5 polish -- fallback order, abort-as-result, log/span consistency

PR: #4302 | Merged: 2026-05-19 | +454/-65 | 7 files

## What it does

Polishes the Phase 1 telemetry tracing infrastructure with three targeted fixes: corrects the parent-span fallback resolution order so tool spans always nest under the correct interaction span, treats user-abort as a normal result (not an error) on tool execution spans, and aligns log record attributes with span attributes for consistent querying in trace backends. This is an incremental hardening pass on top of Phase 1 (#4126).

## Key files changed
- `packages/core/src/telemetry/session-tracing.ts`: Fixed fallback order in `resolveParentContext`, abort-as-result status handling
- `packages/core/src/telemetry/session-tracing.test.ts`: Tests for corrected fallback order and abort semantics
- `packages/core/src/core/coreToolScheduler.ts`: Updated tool span lifecycle to pass abort metadata
- `packages/core/src/core/coreToolScheduler.test.ts`: Tests for abort-as-result in tool scheduler
- `packages/core/src/core/loggingContentGenerator/loggingContentGenerator.ts`: Log/span attribute alignment
- `packages/core/src/core/loggingContentGenerator/loggingContentGenerator.test.ts`: Tests for attribute consistency
- `packages/core/src/telemetry/tracer.ts`: Minor tracer configuration fix

## Final Implementation Status
- **Status**: MERGED (2026-05-19)
- **Outcome**: Implemented as designed
