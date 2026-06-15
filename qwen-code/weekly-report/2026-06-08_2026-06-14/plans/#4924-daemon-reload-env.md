# feat(daemon): add POST /workspace/reload-env for hot-reloading env vars and session auth

PR: #4924 | MERGED: 2026-06-10 | +446/-17 | 17 files

## What it does

Adds the first daemon workspace reload endpoint, `POST /workspace/reload-env`, so operators can reload `.env` / `settings.env` values and refresh auth for idle sessions without restarting `qwen serve`. The final code reloads daemon `process.env`, forwards the reload into the ACP child through `qwen/control/workspace/reload_env`, and reports refreshed/skipped sessions. It also adds the SDK `reloadEnv()` helper, the `workspace_reload_env` capability, and the `env_reloaded` SSE event.

## Key files changed

- `packages/cli/src/config/settings.ts`: Environment reload diffing, deletion tracking, excluded keys, and `skipLoadEnvironment`
- `packages/cli/src/acp-integration/acpAgent.ts`: ACP control method for child-side env reload and idle-session auth refresh
- `packages/cli/src/serve/workspace-service/index.ts`: Workspace-service facade for reload behavior
- `packages/cli/src/serve/server.ts`: HTTP route and SSE event publishing
- `packages/sdk-typescript/src/daemon/DaemonClient.ts`: SDK reload helper
- `packages/sdk-typescript/src/daemon/events.ts`: `env_reloaded` typed event

## Final Implementation Status

- **Status**: MERGED (2026-06-10)
- **Outcome**: Superseded by #4965, which replaces the env-only endpoint with unified `POST /workspace/reload`
