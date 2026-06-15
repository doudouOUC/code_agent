# feat(daemon): add POST /workspace/reload for unified settings hot-reload

PR: #4965 | MERGED: 2026-06-11 | +213/-129 | 14 files

## What it does

Replaces #4924's narrower `POST /workspace/reload-env` surface with unified `POST /workspace/reload`. The endpoint reloads environment variables, model providers, model selection, credentials, disabled tools, approval mode, memory, and system instruction for idle daemon sessions, using settings diffs to avoid unnecessary refresh work.

## Key files changed

- `packages/cli/src/acp-integration/acpAgent.ts`: Applies settings reload effects to idle sessions
- `packages/cli/src/serve/workspace-service/index.ts`: Unified reload service
- `packages/cli/src/serve/server.ts`: `POST /workspace/reload` route
- `packages/cli/src/serve/capabilities.ts`: Replaces `workspace_reload_env` with `workspace_reload`
- `packages/sdk-typescript/src/daemon/DaemonClient.ts`: SDK `reload()` helper
- `packages/sdk-typescript/src/daemon/events.ts`: Replaces `env_reloaded` with `settings_reloaded`

## Final Implementation Status

- **Status**: MERGED (2026-06-11)
- **Outcome**: Daemon settings can be hot-reloaded through one endpoint; permission rules, hooks, and MCP server reinit remain deferred to v2
