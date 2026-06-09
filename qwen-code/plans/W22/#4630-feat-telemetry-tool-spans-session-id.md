# feat(telemetry): add tool spans and session.id to daemon/ACP path

PR: #4630 | Merged: 2026-05-30 | +1169/-744 | 4 files

## What it does
Adds `session.id` attribute to `llm_request`, `tool`, and `tool.execution` spans in session-tracing, making all daemon spans queryable by session in ARMS. Wraps `Session.runTool()` with `startToolSpan`/`endToolSpan` and `invocation.execute()` with execution spans. Also wraps `#executeCronPrompt` in `withInteractionSpan` for proper trace hierarchy.

## Key files changed
- `packages/core/src/telemetry/session-tracing.ts`: Tool span lifecycle helpers + session.id enrichment
- `packages/cli/src/acp-integration/session/Session.ts`: Wrap runTool + cron with trace spans
- `packages/core/src/telemetry/session-tracing.test.ts`: Comprehensive span hierarchy tests

## Final Implementation Status
- **Status**: MERGED (2026-05-30)
- **Outcome**: Implemented as designed
