# feat(serve+sdk): F4 prereq -- daemon protocol completion (serverTimestamp / provenance / errorKind / state_resync_required)

PR: #4360 | Merged: 2026-05-21 | +1500/-26 | 13 files

## What it does

Completes several daemon protocol prerequisites for the F4 milestone. Adds `serverTimestamp` and provenance fields to SSE event envelopes for observability. Introduces the `state_resync_required` event type (with `ring_evicted` and `epoch_reset` reasons) so clients can detect when they have missed events and need to resync session state. Also strengthens `errorKind` typing on bridge error responses. These are additive wire-shape changes with no breaking impact on existing clients.

## Key files changed
- `packages/acp-bridge/src/bridgeClient.ts`: Added serverTimestamp stamping and provenance fields to event emission
- `packages/acp-bridge/src/bridgeClient.test.ts`: Tests for new envelope fields
- `packages/acp-bridge/src/eventBus.ts`: state_resync_required event emission on ring eviction
- `packages/acp-bridge/src/eventBus.test.ts`: Tests for resync event triggering
- `packages/cli/src/serve/server.ts`: Updated SSE endpoint for new event types
- `packages/cli/src/serve/server.test.ts`: Server-level tests
- `packages/cli/src/acp-integration/session/emitters/ToolCallEmitter.ts`: Provenance on tool call events
- `packages/sdk-typescript/src/daemon/events.ts`: SDK types for state_resync_required, provenance, serverTimestamp
- `packages/sdk-typescript/src/daemon/index.ts`: Re-exports
- `packages/sdk-typescript/test/unit/daemonEvents.test.ts`: SDK event tests

## Final Implementation Status
- **Status**: MERGED (2026-05-21)
- **Outcome**: Implemented as designed
