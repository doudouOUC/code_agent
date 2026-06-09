# feat(serve): auth device-flow route (#4175 Wave 4 PR 21)

PR: #4255 | Merged: 2026-05-18 | +6172/-51 | 22 files

## What it does

Adds OAuth2 device-flow authentication support to the daemon, enabling headless or remote clients to authenticate without a browser redirect on the daemon host. Implements `POST /auth/device-flow/start` and `POST /auth/device-flow/poll` routes, a `QwenDeviceFlowProvider` that manages the device code lifecycle, and corresponding SDK types (`DaemonAuthFlow`). Also adds device-flow SSE events and capability tags.

## Key files changed
- `packages/cli/src/serve/auth/deviceFlow.ts`: Core device-flow state machine and route handlers
- `packages/cli/src/serve/auth/deviceFlow.test.ts`: Comprehensive tests
- `packages/cli/src/serve/auth/qwenDeviceFlowProvider.ts`: Provider for Qwen OAuth2 device code flow
- `packages/cli/src/serve/capabilities.ts`: Added device-flow capability tags
- `packages/cli/src/serve/server.ts`: Registered device-flow routes
- `packages/cli/src/serve/httpAcpBridge.ts`: Bridge wiring for auth state
- `packages/sdk-typescript/src/daemon/DaemonAuthFlow.ts`: SDK auth flow client
- `packages/sdk-typescript/src/daemon/DaemonClient.ts`: SDK helpers for device-flow endpoints
- `packages/sdk-typescript/src/daemon/events.ts`: Device-flow SSE event types
- `packages/sdk-typescript/src/daemon/types.ts`: SDK mirror types
- `docs/developers/qwen-serve-protocol.md`: Protocol documentation for device flow

## Final Implementation Status
- **Status**: MERGED (2026-05-18)
- **Outcome**: Implemented as designed
