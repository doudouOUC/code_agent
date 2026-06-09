# feat(serve): per-request sessionScope override on POST /session (#4175 Wave 2 PR 5)

PR: #4209 | Merged: 2026-05-16 | +512/-20 | 8 files

## What it does

Enables daemon clients to override the `sessionScope` on a per-request basis when creating sessions via `POST /session`. Previously the daemon-wide default was the only setting; now callers can pass a `sessionScope` field in the request body to control scope (e.g. workspace vs global) for individual sessions. Adds the `session_scope_override` capability tag to the registry.

## Key files changed
- `packages/cli/src/serve/capabilities.ts`: Added `session_scope_override` capability tag
- `packages/cli/src/serve/httpAcpBridge.ts`: Implemented sessionScope override in session creation logic
- `packages/cli/src/serve/httpAcpBridge.test.ts`: Tests for sessionScope override behavior
- `packages/cli/src/serve/server.ts`: Updated POST /session route to accept sessionScope
- `packages/cli/src/serve/server.test.ts`: Route-level tests
- `packages/sdk-typescript/src/daemon/DaemonClient.ts`: SDK helper for sessionScope parameter
- `docs/developers/qwen-serve-protocol.md`: Protocol docs for the override

## Final Implementation Status
- **Status**: MERGED (2026-05-16)
- **Outcome**: Implemented as designed
