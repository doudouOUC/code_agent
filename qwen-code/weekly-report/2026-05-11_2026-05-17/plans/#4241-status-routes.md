# feat(serve): add read-only status routes

PR: #4241 | Merged: 2026-05-17 | +2363/-64 | 19 files

## What it does

Adds five read-only status routes to the daemon HTTP API: `/workspace/mcp`, `/workspace/skills`, `/workspace/providers`, `/session/:id/context`, and `/session/:id/supported-commands`. These routes expose live workspace and session state to remote clients without side effects. Introduces the `ServeStatusCell` shape for structured status payloads, along with corresponding SDK mirror types, capability tags, and the `SERVE_STATUS_EXT_METHODS` mechanism for ACP-child-to-bridge status plumbing.

## Key files changed
- `packages/cli/src/serve/capabilities.ts`: Added 5 new capability tags (workspace_mcp, workspace_skills, workspace_providers, session_context, session_supported_commands)
- `packages/cli/src/serve/server.ts`: Added 5 GET routes
- `packages/cli/src/serve/status.ts`: New `ServeStatusCell` shape, response types, idle factories
- `packages/cli/src/serve/httpAcpBridge.ts`: Bridge methods for status data retrieval
- `packages/cli/src/acp-integration/acpAgent.ts`: ACP-side status builders (buildWorkspaceMcpStatus, etc.)
- `packages/sdk-typescript/src/daemon/DaemonClient.ts`: SDK helpers for status routes
- `packages/sdk-typescript/src/daemon/DaemonSessionClient.ts`: Session-scoped status helpers
- `packages/sdk-typescript/src/daemon/types.ts`: Mirror types for status payloads
- `docs/developers/qwen-serve-protocol.md`: Protocol documentation for status routes

## Final Implementation Status
- **Status**: MERGED (2026-05-17)
- **Outcome**: Implemented as designed
