# refactor(acp-bridge): lift BridgeOptions + introduce DaemonStatusProvider seam (#4175 PR 22b/2)

PR: #4304 | Merged: 2026-05-19 | +852/-371 | 11 files

## What it does
Design slice of #4175 Wave 5 PR 22b. Lifts the bridge's construction contract (`BridgeOptions`) to `@qwen-code/acp-bridge` package and introduces a new `DaemonStatusProvider` interface so the bridge factory no longer hard-imports daemon-host helpers. This is a pure contract-freeze PR enabling the follow-up PR 22b/3 to mechanically move ~3000 LOC of BridgeClient + spawn factory code.

## Key files changed
- `packages/acp-bridge/src/bridgeOptions.ts`: New BridgeOptions type definition
- `packages/acp-bridge/src/status.ts`: DaemonStatusProvider interface (env + preflight)
- `packages/acp-bridge/src/index.ts`: Barrel exports
- `packages/cli/src/serve/daemonStatusProvider.ts`: Concrete implementation of DaemonStatusProvider
- `packages/cli/src/serve/httpAcpBridge.ts`: Consume new interface instead of hard imports
- `packages/cli/src/serve/runQwenServe.ts`: Wire provider into bridge construction
- `packages/cli/src/serve/server.ts`: Updated imports

## Final Implementation Status
- **Status**: MERGED (2026-05-19)
- **Outcome**: Implemented as designed
