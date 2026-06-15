# fix(serve): isolate per-session stats in daemon mode

PR: #4954 | MERGED: 2026-06-11 | +275/-55 | 10 files

## What it does

Fixes `GET /session/:id/stats` so daemon mode returns metrics for the requested session instead of process-wide cumulative metrics shared by every session in the daemon. `UiTelemetryService` now dual-writes global metrics and per-session metrics keyed by `sessionId`, while existing CLI callers continue to use the global `getMetrics()` path. The final PR also threads session ids through telemetry replay, API/follow-up usage logging, and non-interactive slash-command stats so resumed sessions and suggestion calls do not leak counts across daemon sessions.

## Key files changed

- `packages/core/src/telemetry/uiTelemetry.ts`: Adds per-session metrics map, `getMetricsForSession`, `resetSession`, and `removeSession`
- `packages/core/src/telemetry/uiTelemetry.test.ts`: Session isolation coverage
- `packages/cli/src/acp-integration/acpAgent.ts`: Builds session stats from `getMetricsForSession(sessionId)`
- `packages/core/src/services/sessionService.ts`: Removes closed-session metrics on session cleanup
- `packages/core/src/core/client.ts`: Reports usage events with session identity
- `packages/core/src/telemetry/loggers.ts`: Records API/tool/user-feedback events into session-scoped metrics
- `packages/core/src/followup/suggestionGenerator.ts`: Attributes follow-up suggestion token usage to the active session

## Final Implementation Status

- **Status**: MERGED (2026-06-11)
- **Outcome**: Multi-session daemon stats are isolated across REST stats, ACP stats, resumed-session telemetry replay, non-interactive stats, and follow-up suggestion usage
