# feat(telemetry): add client_id attribute and permission route spans

PR: #4628 | Merged: 2026-05-30 | +167/-10 | 6 files

## What it does
Adds `qwen-code.client_id` span attribute to daemon HTTP request spans (from `X-Qwen-Client-Id` header) and bridge `prompt.dispatch` spans. Adds telemetry coverage for permission vote routes with `permission.request_id` attribute. Introduces `addDaemonRequestAttribute()` helper for post-rebase enrichment.

## Key files changed
- `packages/core/src/telemetry/daemon-tracing.ts`: New `addDaemonRequestAttribute` helper and clientId extraction
- `packages/cli/src/serve/server.ts`: Permission route span instrumentation
- `packages/acp-bridge/src/bridge.ts`: `client_id` flow through `prompt.dispatch` span

## Final Implementation Status
- **Status**: MERGED (2026-05-30)
- **Outcome**: Implemented as designed
