# feat(serve): add client heartbeat (#4175 Wave 2.5 PR 9)

PR: #4235 | Merged: 2026-05-17 | +581/-2 | 15 files

## What it does
Adds `POST /session/:id/heartbeat` route plus SDK helpers (`DaemonClient.heartbeat()` / `DaemonSessionClient.heartbeat()`) so long-lived adapters (TUI/IDE/web) can refresh the daemon's last-seen bookkeeping. Bridge stores per-session and per-client timestamps behind a `getHeartbeatState()` snapshot accessor. Advertises `client_heartbeat` capability tag.

## Key files changed
- `packages/cli/src/serve/server.ts`: New heartbeat route handler
- `packages/cli/src/serve/httpAcpBridge.ts`: recordHeartbeat() and getHeartbeatState() on bridge
- `packages/cli/src/serve/capabilities.ts`: client_heartbeat capability tag
- `packages/sdk-typescript/src/daemon/DaemonClient.ts`: heartbeat() SDK helper
- `packages/sdk-typescript/src/daemon/DaemonSessionClient.ts`: Session-scoped heartbeat helper
- `docs/developers/qwen-serve-protocol.md`: Protocol documentation for heartbeat route
- `integration-tests/cli/qwen-serve-routes.test.ts`: Integration tests

## Final Implementation Status
- **Status**: MERGED (2026-05-17)
- **Outcome**: Implemented as designed
