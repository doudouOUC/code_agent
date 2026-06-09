# feat(daemon): add POST /session/:id/btw endpoint for side questions

PR: #4610 | Merged: 2026-05-30 | +388/-128 | 11 files

## What it does
Adds `POST /session/:id/btw` REST endpoint to support `/btw` (side question) in daemon HTTP mode. Extracts shared `buildBtwPrompt` + `buildBtwCacheSafeParams` utils to core, wires through ACP bridge with 60s timeout backstop and client-disconnect abort. Returns `{ answer: null }` when no conversation context exists.

## Key files changed
- `packages/cli/src/serve/server.ts`: New `/btw` route
- `packages/cli/src/ui/commands/btwCommand.ts`: Expand `supportedModes` to include `'acp'`
- `packages/acp-bridge/src/bridge.ts`: Bridge extMethod handler with timeout
- `packages/core/src/index.ts`: Export shared btw prompt builders

## Final Implementation Status
- **Status**: MERGED (2026-05-30)
- **Outcome**: Implemented as designed
