# fix(daemon): compacted session replay for long-session recovery

PR: #4694 | Merged: 2026-06-03 | +1084/-35 | 11 files

## What it does

Implements a `TurnBoundaryCompactionEngine` that compacts session event history at turn boundaries, enabling long-running daemon sessions to recover from SSE disconnects without replaying the entire event ring. When a client reconnects with a `Last-Event-ID` that has been evicted from the ring buffer, the daemon now compacts the session's event history into a minimal replay sequence (one summary event per completed turn) rather than forcing a full session reload. This reduces reconnect bandwidth and latency for sessions with hundreds of turns.

The engine identifies turn boundaries in the event stream, compresses completed turns into compact summary events, and preserves in-progress turn events verbatim. The compacted replay is transparent to SDK clients -- the `DaemonSessionClient` detects the `state_resync_required(ring_evicted)` signal and handles the compacted replay automatically. The `EventBus` is extended with a compaction-aware replay path that delegates to the engine when the standard ring replay cannot satisfy the client's `Last-Event-ID`.

## Key files changed
- `packages/acp-bridge/src/compactionEngine.ts`: New `TurnBoundaryCompactionEngine` -- identifies turn boundaries, compresses completed turns into summary events, preserves in-progress events
- `packages/acp-bridge/src/compactionEngine.test.ts`: Comprehensive tests for compaction logic (multi-turn, partial turn, edge cases)
- `packages/acp-bridge/src/bridge.ts`: Wired compaction engine into bridge session lifecycle, compaction-aware replay on reconnect
- `packages/acp-bridge/src/bridge.test.ts`: Bridge integration tests for compacted replay paths
- `packages/acp-bridge/src/bridgeTypes.ts`: Type definitions for compacted event shapes
- `packages/acp-bridge/src/eventBus.ts`: Extended ring buffer with compaction-aware replay delegation
- `packages/acp-bridge/package.json`: Dependencies for compaction module
- `packages/sdk-typescript/src/daemon/DaemonSessionClient.ts`: Client-side handling of compacted replay sequences
- `packages/sdk-typescript/src/daemon/types.ts`: SDK types for compacted replay metadata
- `packages/sdk-typescript/src/daemon/index.ts`: Re-exports for compaction types
- `packages/sdk-typescript/test/unit/DaemonSessionClient.test.ts`: SDK client compacted replay tests

## Compaction strategy

The engine operates at turn boundaries (after a complete assistant response + tool results cycle). For each completed turn, it produces a single compact event containing:
- The final assistant message content (last text block)
- Tool call summaries (name + result status, not full output)
- Turn metadata (turn number, token counts if available)

In-progress turns (the current active turn) are preserved verbatim -- no compaction is applied to events the client has not yet seen in their complete form. This ensures the client's transcript for the active turn is pixel-perfect while historical turns are space-efficient.

## Ring eviction recovery flow

```
Client reconnects with Last-Event-ID: 500
Ring buffer oldest event: 2000 (events 1-1999 evicted)

Without compaction:
  state_resync_required(ring_evicted) -> client must reload session

With compaction (this PR):
  state_resync_required(ring_evicted) -> engine compacts turns 1-N
  -> compact replay: ~20 summary events for 50 completed turns
  -> live replay: events 2000+ from ring buffer
  -> replay_complete
  -> client transcript reconstructed with minimal bandwidth
```

## Final Implementation Status
- **Status**: MERGED (2026-06-03)
- **Outcome**: Implemented as designed
