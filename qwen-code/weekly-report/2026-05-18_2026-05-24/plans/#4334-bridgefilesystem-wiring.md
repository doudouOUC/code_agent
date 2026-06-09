# feat(serve): F1 follow-up — BridgeFileSystem wiring + #4325 channelInfo fix

PR: #4334 | Merged: 2026-05-20 | +1365/-59 | 9 files

## What it does
Wires the BridgeFileSystem adapter into production serve paths so ACP file operations route through WorkspaceFileSystem (trust gate, symlink resolution, atomic writes) instead of raw BridgeClient fs proxy. Also fixes a channelInfo bookkeeping mismatch in closeSession/killSession and adds mode-preserving atomic writes for ACP.

## Key files changed
- `packages/cli/src/serve/bridgeFileSystemAdapter.ts`: New adapter translating ACP read/write requests to WorkspaceFileSystem calls
- `packages/cli/src/serve/bridgeFileSystemAdapter.test.ts`: 12 tests covering trust-gate, boundary rejection, mode preservation
- `packages/cli/src/serve/fs/workspaceFileSystem.ts`: Added `writeTextOverwrite` primitive with mode preservation + 0o600 default
- `packages/cli/src/serve/runQwenServe.ts`: Injects the adapter into createServeApp/runQwenServe paths
- `packages/acp-bridge/src/bridge.ts`: channelInfo fix using channelInfoForEntry()

## Final Implementation Status
- **Status**: MERGED (2026-05-20)
- **Outcome**: Implemented as designed — three F1 follow-ups batched into one PR
