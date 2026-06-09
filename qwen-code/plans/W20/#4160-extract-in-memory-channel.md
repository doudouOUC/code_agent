# refactor(serve): extract createInMemoryChannel helper (#4156 A1)

PR: #4160 | Merged: 2026-05-15 | +315/-40 | 4 files

## What it does
Pure refactor extracting the inline paired NDJSON channel construction (TransformStream x2 + ndJsonStream x2) that was duplicated across `httpAcpBridge.test.ts` into a production helper `createInMemoryChannel()`. Placed in `packages/cli/src/serve/inMemoryChannel.ts` as a primitive for the future Stage 2 `InProcessAcpChannel` and the A2 PR's `inProcessAcpBridge.ts`.

## Key files changed
- `packages/cli/src/serve/inMemoryChannel.ts`: New production helper for paired NDJSON stream channels
- `packages/cli/src/serve/inMemoryChannel.test.ts`: Unit tests for the helper
- `packages/cli/src/serve/httpAcpBridge.test.ts`: Migrated inline duplicates to use the new helper
- `packages/cli/src/serve/index.ts`: Barrel export of new module

## Final Implementation Status
- **Status**: MERGED (2026-05-15)
- **Outcome**: Implemented as designed
