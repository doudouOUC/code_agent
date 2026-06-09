# feat(serve): advertise typed_event_schema + pin SDK public surface (#4175 PR 4 follow-up)

PR: #4226 | Merged: 2026-05-17 | +112/-1 | 5 files

## What it does
Two follow-ups to PR #4217. First, advertises the `typed_event_schema` capability tag on `/capabilities.features` so non-SDK clients can detect the daemon promises KnownDaemonEvent-shaped frames. Second, pins the typed event surface at the public SDK entry with a regression test, ensuring `import { asKnownDaemonEvent } from '@qwen-code/sdk'` keeps working through the two-hop re-export chain.

## Key files changed
- `packages/cli/src/serve/capabilities.ts`: Add typed_event_schema capability tag
- `packages/cli/src/serve/server.test.ts`: Test capability advertisement
- `integration-tests/cli/qwen-serve-routes.test.ts`: Integration test for capability
- `packages/sdk-typescript/src/daemon/DaemonSessionClient.ts`: Docstring update pointing to typed reducer
- `packages/sdk-typescript/test/unit/daemon-public-surface.test.ts`: Regression fence for re-export chain

## Final Implementation Status
- **Status**: MERGED (2026-05-17)
- **Outcome**: Implemented as designed
