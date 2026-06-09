# feat(telemetry): Phase 2 -- tool.blocked_on_user + hook spans (#3731)

PR: #4321 | Merged: 2026-05-21 | +3287/-99 | 8 files

## What it does
Phase 2 of hierarchical session-tracing (#3731). Adds two OTel span types: `qwen-code.tool.blocked_on_user` brackets the time a tool spends waiting for user approval (recording decision and source), and `qwen-code.hook` wraps each pre/post-hook fire site. Tool span lifecycle moved to `_schedule`'s validating-loop to cover the full validating-to-executing pipeline in one span, with centralized cleanup via `finalizeToolSpan`/`finalizeBlockedSpan`.

## Key files changed
- `packages/core/src/core/coreToolScheduler.ts`: Tool span lifecycle refactored, blocked_on_user spans, 8 terminal end sites
- `packages/core/src/core/coreToolScheduler.test.ts`: Tests for span lifecycle and blocked spans
- `packages/core/src/core/toolHookTriggers.ts`: Hook spans wrapping 6 fire sites
- `packages/core/src/core/toolHookTriggers.test.ts`: Tests for hook span creation
- `packages/core/src/telemetry/session-tracing.ts`: Span factory helpers for new span types
- `packages/core/src/telemetry/session-tracing.test.ts`: Tests for new helpers
- `packages/core/src/telemetry/constants.ts`: New span name constants
- `packages/core/src/telemetry/index.ts`: Updated exports

## Final Implementation Status
- **Status**: MERGED (2026-05-21)
- **Outcome**: Implemented as designed
