# fix(serve): post-merge fixes for #4291 review (7 threads)

PR: #4305 | Merged: 2026-05-19 | +768/-161 | 5 files

## What it does
Addresses seven post-merge findings from the review on #4291 (device flow auth). Fixes include: eliminating memory/secret retention by destructuring observer closure fields, extracting a shared `callerIsDeviceFlowInitiator` helper to replace 3 inline copies, fixing log injection via `sanitizeForStderr`, improving audit DX with consistent `result.hint`, replacing inline debug mode checks with existing `isServeDebugMode()` helper, and fixing a secret leak in the late-rejection observer.

## Key files changed
- `packages/cli/src/serve/auth/deviceFlow.ts`: Memory leak fix, secret leak fix, audit hint, timeout error reuse
- `packages/cli/src/serve/auth/deviceFlow.test.ts`: Tests for the above fixes
- `packages/cli/src/serve/auth/qwenDeviceFlowProvider.ts`: Log injection fix via sanitizeForStderr
- `packages/cli/src/serve/auth/qwenDeviceFlowProvider.test.ts`: Tests for sanitization
- `packages/cli/src/serve/server.ts`: Extract shared helper, use isServeDebugMode(), remove dead code

## Final Implementation Status
- **Status**: MERGED (2026-05-19)
- **Outcome**: Implemented as designed
