# feat(serve): runtime MCP server add/remove (T2.8 #4514)

PR: #4552 | Merged: 2026-05-30 | +2969/-31 | 23 files

## What it does
Adds HTTP routes for runtime MCP server registry mutation without daemon restart: `POST /workspace/mcp/servers` (add/replace) and `DELETE /workspace/mcp/servers/:name` (drop). Runtime entries overlay settings.json via an ephemeral map; daemon restart re-reads the cascade. Events `mcp_server_added`/`mcp_server_removed` fan out to attached clients.

## Key files changed
- `packages/cli/src/serve/server.ts`: New POST/DELETE routes with mutate-gate
- `packages/acp-bridge/src/bridge.ts`: Bridge-side MCP server runtime overlay logic
- `packages/cli/src/acp-integration/acpAgent.ts`: ACP agent MCP registry integration
- `packages/cli/src/serve/capabilities.ts`: `mcp_server_runtime_mutation` capability tag

## Final Implementation Status
- **Status**: MERGED (2026-05-30)
- **Outcome**: Implemented as designed
