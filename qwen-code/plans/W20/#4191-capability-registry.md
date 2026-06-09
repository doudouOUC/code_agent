# [codex] feat(serve): add capability registry protocol versions

PR: #4191 | Merged: 2026-05-16 | +212/-39 | 10 files

## What it does

Adds protocol version tracking to the daemon capability registry. The `/capabilities` endpoint now exposes `protocolVersions` (current + supported range) alongside the existing feature list, enabling SDK clients to negotiate protocol compatibility with the daemon. Also adds `ServeCapabilityDescriptor` with a `since` field so each feature declares which protocol version introduced it.

## Key files changed
- `packages/cli/src/serve/capabilities.ts`: Added `protocolVersions` to registry, `ServeCapabilityDescriptor` type with `since` field
- `packages/cli/src/serve/server.ts`: Updated `/capabilities` route to include protocol versions in response
- `packages/cli/src/serve/server.test.ts`: Tests for protocol version advertisement
- `packages/cli/src/serve/types.ts`: Type definitions for capability descriptors
- `packages/cli/src/serve/index.ts`: Re-exports for new types
- `packages/sdk-typescript/src/daemon/types.ts`: SDK mirror types for capabilities
- `packages/sdk-typescript/src/daemon/index.ts`: SDK re-exports
- `docs/developers/qwen-serve-protocol.md`: Protocol documentation for versioning

## Final Implementation Status
- **Status**: MERGED (2026-05-16)
- **Outcome**: Implemented as designed
