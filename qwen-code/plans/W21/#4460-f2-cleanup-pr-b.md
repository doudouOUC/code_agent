# fix(core): F2 cleanup PR B — self-heal observability (W133-a + W134)

PR: #4460 | Merged: 2026-05-23 | +405/-5 | 3 files

## What it does
Adds observability for F2 MCP pool self-healing: threads upstream transport errors (EPIPE, OAuth 401, server crash) through to the 'failed' event's lastError string so operators see actual causes without grepping debug logs. Also surfaces orphan-process pressure when pid-sweep partially fails during silent-drop cleanup.

## Key files changed
- `packages/core/src/tools/mcp-client.ts`: lastTransportError field + getter, populated in onerror before status cascade
- `packages/core/src/tools/mcp-pool-entry.ts`: SweepResult interface, sweepAndDisconnect returns structured result, silent-drop chain logs partial-signal warnings
- `packages/core/src/tools/mcp-transport-pool.test.ts`: 4 new tests + module mocks for pid-descendants and debugLogger

## Final Implementation Status
- **Status**: MERGED (2026-05-23)
- **Outcome**: Implemented as designed — W133-a and W134 delivered, W93 declined (non-repro)
