# feat(daemon): add session tasks snapshot endpoint

PR: #4578 | Merged: 2026-05-28 | +934/-4 | 26 files

## What it does
Adds a read-only `GET /session/:id/tasks` endpoint backed by ACP status extMethod `qwen/status/session/tasks`, allowing web-shell to inspect background tasks while a prompt is streaming without blocking the prompt queue. Includes SDK helpers and web-shell `/tasks` local command handling.

## Key files changed
- `packages/cli/src/serve/server.ts`: New GET `/tasks` route
- `packages/acp-bridge/src/bridge.ts`: Status path bypassing prompt FIFO
- `packages/cli/src/acp-integration/acpAgent.ts`: Task serialization whitelist
- `packages/sdk-typescript/src/daemon/DaemonSessionClient.ts`: SDK `tasks()` helper

## Final Implementation Status
- **Status**: MERGED (2026-05-28)
- **Outcome**: Implemented as designed
