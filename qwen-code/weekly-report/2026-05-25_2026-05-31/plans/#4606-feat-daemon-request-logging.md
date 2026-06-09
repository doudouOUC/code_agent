# feat(daemon): add request-level logging for serve routes

PR: #4606 | Merged: 2026-05-29 | +178/-6 | 4 files

## What it does
Adds access-log middleware and inline business-context logs for all daemon HTTP routes. Logs method, path, sessionId, clientId, status, and duration for every completed request (excluding health/SSE noise). Business events like session spawn, prompt enqueue, recap, and shell completion are also logged. All gated on `daemonLog` existence.

## Key files changed
- `packages/cli/src/serve/server.ts`: Access-log middleware and inline business logs
- `packages/acp-bridge/src/bridge.ts`: Bridge-side logging additions
- `packages/cli/src/acp-integration/acpAgent.ts`: Agent-side business context logs
- `packages/core/src/services/sessionRecap.ts`: Recap result logging

## Final Implementation Status
- **Status**: MERGED (2026-05-29)
- **Outcome**: Implemented as designed
