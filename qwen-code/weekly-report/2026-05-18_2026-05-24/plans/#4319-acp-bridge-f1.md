# feat(acp-bridge): F1 -- acp-bridge package self-sufficiency (#4175 mechanical lift + BridgeFileSystem seam)

PR: #4319 | Merged: 2026-05-19 | +5620/-4710 | 19 files

## What it does

Completes the extraction of the ACP bridge into a self-sufficient `packages/acp-bridge` package. Moves the full bridge implementation (`bridge.ts`, `bridgeClient.ts`), spawn channel, and all supporting types from `packages/cli/src/serve/` into `packages/acp-bridge/src/`. Introduces a `BridgeFileSystem` seam so the bridge package does not depend on Node.js `fs` directly, enabling future portability. The CLI package becomes a thin consumer that wires the bridge with concrete implementations. This is the F1 (Foundation 1) step in the daemon architecture roadmap.

## Key files changed
- `packages/acp-bridge/src/bridge.ts`: Full bridge implementation (moved from cli/serve/httpAcpBridge.ts)
- `packages/acp-bridge/src/bridgeClient.ts`: Bridge client with extNotification handling
- `packages/acp-bridge/src/bridgeClient.test.ts`: Tests for bridge client
- `packages/acp-bridge/src/bridgeFileSystem.ts`: FileSystem abstraction seam
- `packages/acp-bridge/src/bridgeOptions.ts`: Bridge configuration options type
- `packages/acp-bridge/src/spawnChannel.ts`: Spawn channel implementation (moved)
- `packages/acp-bridge/src/spawnChannel.test.ts`: Spawn channel tests
- `packages/acp-bridge/src/channel.ts`: Channel interface refinements
- `packages/acp-bridge/src/index.ts`: Updated barrel exports
- `packages/cli/src/serve/httpAcpBridge.ts`: Reduced to thin shim delegating to acp-bridge

## Final Implementation Status
- **Status**: MERGED (2026-05-19)
- **Outcome**: Implemented as designed
