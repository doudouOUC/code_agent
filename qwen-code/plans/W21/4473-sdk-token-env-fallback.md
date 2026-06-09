# docs(serve): v0.16-alpha known limits + SDK QWEN_SERVER_TOKEN env fallback (PR 27)

PR: #4473 | Merged: 2026-05-24 | +175/-6 | 4 files

## What it does
First PR in the F5 release chain for v0.16-alpha. Adds QWEN_SERVER_TOKEN environment variable fallback to DaemonClient constructor so SDK consumers do not need to thread the token through every construction. Browser-safe via globalThis.process indirection. Also adds v0.16-alpha known-limits documentation.

## Key files changed
- `packages/sdk-typescript/src/daemon/DaemonClient.ts`: Env fallback with whitespace trim, browser-safe process access
- `packages/sdk-typescript/test/unit/DaemonClient.test.ts`: 4 new tests for env fallback behavior
- `docs/users/qwen-serve.md`: v0.16-alpha banner + known-limits section
- `docs/developers/examples/daemon-client-quickstart.md`: Updated quickstart with env var usage

## Final Implementation Status
- **Status**: MERGED (2026-05-24)
- **Outcome**: Implemented as designed — ergonomic replacement for PR 29's SDK env/file fallback
