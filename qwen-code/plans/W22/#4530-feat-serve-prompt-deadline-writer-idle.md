# feat(serve): prompt absolute deadline + SSE writer idle timeout (#4514 T2.9)

PR: #4530 | Merged: 2026-05-26 | +1458/-151 | 12 files

## What it does
Adds two opt-in daemon flags for remote deployments: `--prompt-deadline-ms` (server-side wallclock cap on prompt requests, returns 504 on expiry) and `--writer-idle-timeout-ms` (per-SSE-connection idle deadline that emits a terminal `client_evicted` frame). Both default off to preserve single-user loopback behavior. Conditional capability tags advertise when configured.

## Key files changed
- `packages/cli/src/serve/server.ts`: Implement deadline abort and idle-timeout eviction logic
- `packages/cli/src/commands/serve.ts`: Add CLI flags and env-var bindings
- `packages/cli/src/serve/capabilities.ts`: Conditional `prompt_absolute_deadline` / `writer_idle_timeout` tags
- `packages/sdk-typescript/src/daemon/DaemonClient.ts`: SDK pre-flight for new capability tags

## Final Implementation Status
- **Status**: MERGED (2026-05-26)
- **Outcome**: Implemented as designed
