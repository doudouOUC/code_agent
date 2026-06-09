# refactor(acp-bridge): F1 test split — lift bridge.test.ts (6861 LOC) to acp-bridge

PR: #4445 | Merged: 2026-05-23 | +597/-449 | 5 files

## What it does
Moves 177 of 181 tests from the monolithic httpAcpBridge.test.ts in packages/cli to packages/acp-bridge/src/bridge.test.ts so tests live alongside the lifted bridge core code. Remaining 4 daemon-host-coupled tests stay in a new daemonStatusProvider.test.ts. Pure mechanical reorganization with zero production code changes.

## Key files changed
- `packages/acp-bridge/src/bridge.test.ts`: 177 tests moved here (bulk of bridge logic)
- `packages/cli/src/serve/daemonStatusProvider.test.ts`: 4 tests with real daemon-host coupling
- `packages/acp-bridge/src/internal/testUtils.ts`: Extracted shared fixtures (FakeAgent, makeChannel, makeBridge)
- `packages/acp-bridge/package.json`: Test dependency additions
- `packages/cli/vitest.config.ts`: Updated test paths

## Final Implementation Status
- **Status**: MERGED (2026-05-23)
- **Outcome**: Implemented as designed — 181 tests preserved (177 + 4 = parity)
