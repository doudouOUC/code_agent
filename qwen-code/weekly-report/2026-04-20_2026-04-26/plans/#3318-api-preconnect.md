# feat(cli): add API preconnect to reduce first-call latency

PR: #3318 | Merged: 2026-04-26 | +731/-13 | 8 files

## What it does
Fires a fire-and-forget HEAD request early in startup to warm the TCP+TLS connection, saving 100-200ms on the first actual API call. Intelligently skips preconnect when proxy env vars, custom CA certs, sandbox mode, or non-default baseUrl are detected. Disableable via `QWEN_CODE_DISABLE_PRECONNECT=1` with 5s timeout.

## Key files changed
- `packages/cli/src/utils/apiPreconnect.ts`: Core preconnect logic with skip conditions
- `packages/cli/src/utils/apiPreconnect.test.ts`: Tests for skip logic and happy path
- `packages/core/src/utils/runtimeFetchOptions.ts`: Shared fetch options utility
- `packages/cli/src/gemini.tsx`: Wire preconnect into startup sequence
- `scripts/benchmark-api-latency.mjs`: Benchmark script for measuring improvement

## Final Implementation Status
- **Status**: MERGED (2026-04-26)
- **Outcome**: Implemented as designed
