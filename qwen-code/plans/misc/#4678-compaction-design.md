# Daemon Session Replay: Compacted Snapshot + Live Journal

## Context

Long-running daemon sessions emit tens of thousands of events (streaming chunks, tool updates, permissions, etc.) onto a per-session `EventBus`. The EventBus uses a **bounded ring buffer** (default 8000 frames) for SSE reconnect replay. When sessions exceed ring capacity, a page refresh triggers `ring_evicted` and the client cannot reconstruct the full transcript.

Current PR #4678 solves this by appending every raw event to a JSONL file and returning the full file on `loadSession`. This works but has O(total_events) cost on load — a 3-hour session can produce 50K+ events, resulting in 50-100MB payloads and multi-second client processing times.

This document designs a replacement that achieves **O(turns) load cost** regardless of streaming granularity.

---

## Design Goals

1. **Correctness**: No duplicate events, no gaps, no race conditions between snapshot and SSE cursor
2. **Bounded load cost**: `loadSession` payload proportional to conversation turns, not streaming tokens
3. **Consumer-agnostic**: The replay format uses the same `BridgeEvent` schema — existing client reducers work unchanged
4. **Simplicity**: No dual-queue/dedup/compaction-index bookkeeping; clear consistency boundaries
5. **Crash-tolerant**: Lost in-memory state is recoverable via existing ACP `session/load` replay

---

## Architecture Overview

```
EventBus.publish(event)
    │
    ├──► Ring Buffer (bounded, SSE catch-up only)
    │
    └──► CompactionEngine
              │
              ├── liveJournal: BridgeEvent[]      ← current incomplete turn (raw events)
              │
              └── compactedTurns: CompactedEvent[] ← all completed turns (merged)
                       │
                       ├── in-memory (authoritative)
                       └── periodic flush to JSON file (crash recovery)

loadSession() returns:
  { compactedTurns, liveJournal, lastEventId, state }
         │                │              │
         │                │              └── SSE cursor: subscribe from lastEventId+1
         │                └── client replays raw (bounded: one turn)
         └── client replays compacted (O(turns), not O(tokens))
```

---

## Core Design

### 1. CompactionEngine

A per-session stateful processor that sits alongside the EventBus. Every event published on the bus is also fed to the engine.

```typescript
interface CompactionEngine {
  /** Called synchronously on every EventBus.publish(). */
  ingest(event: BridgeEvent): void;

  /** Returns the current compacted state + live journal. */
  snapshot(): SessionReplaySnapshot;

  /** Releases resources, flushes final state. */
  close(): void;
}

interface SessionReplaySnapshot {
  compactedTurns: BridgeEvent[];  // Merged events for all completed turns
  liveJournal: BridgeEvent[];     // Raw events since last turn boundary
  lastEventId: number;            // Max event ID across both arrays (= SSE cursor)
}
```

#### Compaction Rules (triggered on `turn_complete` / `turn_error`)

When a turn boundary event arrives, the engine compacts all events accumulated in `liveJournal` for that turn:

| Raw Event Pattern | Compacted Output |
|---|---|
| N consecutive `agent_message_chunk` | 1 synthetic `agent_message_chunk` with merged text |
| N consecutive `agent_thought_chunk` | 1 synthetic `agent_thought_chunk` with merged text |
| `tool_call` + M `tool_call_update` for same `toolCallId` | 1 synthetic `tool_call` with final status/content/output |
| `user_message_chunk` | Kept as-is (already atomic) |
| `permission_request` → `permission_resolved` | Both kept (semantically important boundaries) |
| `plan` events | Latest `plan` per session (replaces prior) |
| `turn_complete` / `turn_error` | Kept as-is (turn boundary marker) |
| `available_commands_update`, `current_mode_update` | Latest-wins: only most recent kept |
| `model_switched` | Kept (important state change) |
| `slow_client_warning`, `replay_complete`, transient signals | Dropped (not needed for replay) |

#### Compacted Event Format

Compacted events use the **same `BridgeEvent` schema** as raw events. The only difference is content:

```typescript
// Raw: 200 individual chunks
{ id: 101, type: 'session_update', data: { update: { sessionUpdate: 'agent_message_chunk', content: { type: 'text', text: 'H' } } } }
{ id: 102, type: 'session_update', data: { update: { sessionUpdate: 'agent_message_chunk', content: { type: 'text', text: 'e' } } } }
// ... 198 more ...

// Compacted: 1 merged event (uses the LAST raw event's id)
{ id: 300, type: 'session_update', data: { update: { sessionUpdate: 'agent_message_chunk', content: { type: 'text', text: 'Hello, here is the full response...' } } } }
```

Using the last raw event's `id` as the compacted event's `id` ensures:
- The `lastEventId` watermark is always the true high-water mark
- SSE cursor alignment: subscribing from `lastEventId` means "give me events after the last thing I've seen"

#### Internal State

```typescript
class TurnBoundaryCompactionEngine implements CompactionEngine {
  private compactedTurns: BridgeEvent[] = [];
  private liveJournal: BridgeEvent[] = [];
  private lastEventId = 0;

  // Per-turn accumulation state (reset on turn boundary)
  private currentTextChunks: string[] = [];
  private currentThoughtChunks: string[] = [];
  private currentToolCalls: Map<string, BridgeEvent> = new Map();
  private currentMiscEvents: BridgeEvent[] = [];
  private lastTextEventId = 0;
  private lastThoughtEventId = 0;

  ingest(event: BridgeEvent): void {
    if (event.id) this.lastEventId = event.id;
    this.liveJournal.push(event);

    if (isTurnBoundary(event)) {
      this.compactCurrentTurn(event);
    }
  }

  private compactCurrentTurn(boundaryEvent: BridgeEvent): void {
    const compacted: BridgeEvent[] = [];

    // Emit merged text (if any)
    if (this.currentTextChunks.length > 0) {
      compacted.push(makeMergedTextEvent(this.currentTextChunks, this.lastTextEventId));
      this.currentTextChunks = [];
    }

    // Emit merged thought (if any)
    if (this.currentThoughtChunks.length > 0) {
      compacted.push(makeMergedThoughtEvent(this.currentThoughtChunks, this.lastThoughtEventId));
      this.currentThoughtChunks = [];
    }

    // Emit final tool call states
    for (const toolEvent of this.currentToolCalls.values()) {
      compacted.push(toolEvent);
    }
    this.currentToolCalls.clear();

    // Emit misc events (user messages, permissions, model switches, etc.)
    compacted.push(...this.currentMiscEvents);
    this.currentMiscEvents = [];

    // Emit turn boundary
    compacted.push(boundaryEvent);

    this.compactedTurns.push(...compacted);
    this.liveJournal = [];  // Journal reset: turn is now compacted
    this.flushToDisk();
  }

  snapshot(): SessionReplaySnapshot {
    return {
      compactedTurns: this.compactedTurns.slice(),
      liveJournal: this.liveJournal.slice(),
      lastEventId: this.lastEventId,
    };
  }
}
```

### 2. Consistency Model

**The race condition from PR #4678 is eliminated by design.**

In #4678, `lastEventId` is captured separately from the async `snapshot()` read, creating a window where new events can be published between the two operations.

In this design:
- `lastEventId` is updated synchronously in `ingest()` on every publish
- `snapshot()` is **synchronous** — it returns slices of the in-memory arrays
- Both `compactedTurns` and `liveJournal` are updated synchronously
- Therefore `lastEventId` is always consistent with the content of both arrays

No async file reads. No dedup logic. No append-unique reconciliation.

### 3. Persistence Strategy

#### In-Memory (Primary)

The `CompactionEngine` is the authoritative source. `compactedTurns` grows at O(turns) — a 100-turn session produces ~500 compacted events (~5MB).

#### On-Disk (Crash Recovery)

On each `turn_complete`, the engine writes `compactedTurns` to a JSON file:

```
<tempDir>/qwen-code-daemon-state/<workspaceHash>/<sessionId>.snapshot.json
```

Contents:
```json
{
  "version": 1,
  "lastCompactedEventId": 5000,
  "turns": [ /* compacted BridgeEvent[] */ ]
}
```

This is a **single file overwrite** (atomic via write-to-temp + rename), not an append log. The file represents a complete checkpoint of all compacted turns.

#### Crash Recovery Flow

If the daemon crashes and restarts:
1. Client calls `loadSession` → daemon calls ACP `connection.loadSession()`
2. ACP child replays conversation from its JSONL (existing behavior)
3. Replay events flow through EventBus → CompactionEngine
4. Engine rebuilds `compactedTurns` from the replayed events
5. `loadSession` response includes the freshly-compacted state

The on-disk snapshot is an **optimization** — it avoids a full ACP replay if the daemon merely lost the in-memory state but the session file is intact. The engine can be seeded from the snapshot file on session restore:

```typescript
// In restoreSession flow:
if (snapshotFileExists(sessionId)) {
  engine.seedFromSnapshot(readSnapshot(sessionId));
  // Only need ACP to replay events AFTER the snapshot's lastCompactedEventId
}
```

### 4. File Management

```
${os.tmpdir()}/qwen-code-daemon-state/
  └── <workspaceHash>/           (one per bound workspace)
       ├── <sessionId-1>.snapshot.json
       ├── <sessionId-2>.snapshot.json
       └── ...
```

- **No per-process subdirectories**: Unlike #4678's `{pid}-{uuid}` scheme, snapshots are keyed by session ID only. A new daemon process for the same workspace can read snapshots from the previous process.
- **Cleanup on session delete**: `bridge.deleteSession()` removes the snapshot file.
- **Cleanup on startup**: Bridge startup scans the workspace directory, removes snapshots for session IDs not present in `SessionService.listSessions()`.
- **No accumulation on crash**: Since files are overwritten (not appended), a crash leaves at most one file per session. Startup cleanup handles orphans.

### 5. HTTP API Changes

#### `POST /session/:id/load` Response

```typescript
interface DaemonRestoredSession extends DaemonSession {
  state: DaemonSessionState;
  /** Compacted events for all completed turns. O(turns) size. */
  compactedReplay: DaemonEvent[];
  /** Raw events since last turn boundary (current incomplete turn). */
  liveJournal: DaemonEvent[];
  /** High-water mark. Client uses this as initial SSE cursor. */
  lastEventId: number;
}
```

#### `POST /session/:id/resume` Response

```typescript
interface DaemonRestoredSession extends DaemonSession {
  state: DaemonSessionState;
  /** Only the watermark — resume clients already have history. */
  lastEventId: number;
  // No compactedReplay, no liveJournal
}
```

#### New: `GET /session/:id/snapshot` (Optional, for large sessions)

For sessions where even the compacted payload is large (500+ turns), clients can request a streaming snapshot:

```
GET /session/:id/snapshot
Accept: application/x-ndjson

Response: NDJSON stream of compacted events + final metadata line
```

This is optional — the embedded response field works for typical sessions.

### 6. SDK Changes

#### `DaemonSessionClient`

```typescript
class DaemonSessionClient {
  /** Compacted + journal events for transcript seeding. */
  readonly replaySnapshot: SessionReplaySnapshot;

  static async load(client, sessionId, req, clientId): Promise<DaemonSessionClient> {
    const { state, compactedReplay, liveJournal, lastEventId, ...session } =
      await client.loadSession(sessionId, req, clientId);
    return new DaemonSessionClient({
      client, session, state,
      lastEventId,
      replaySnapshot: { compactedTurns: compactedReplay ?? [], liveJournal: liveJournal ?? [] },
    });
  }

  static async resume(client, sessionId, req, clientId): Promise<DaemonSessionClient> {
    const { state, lastEventId, ...session } =
      await client.resumeSession(sessionId, req, clientId);
    return new DaemonSessionClient({
      client, session, state,
      lastEventId,
      replaySnapshot: { compactedTurns: [], liveJournal: [] },
    });
  }
}
```

### 7. WebUI / Client Changes

The client's replay seeding becomes trivial:

```typescript
// In DaemonSessionProvider connection loop:
if (session.replaySnapshot.compactedTurns.length > 0 || session.replaySnapshot.liveJournal.length > 0) {
  // Replay compacted turns (O(turns), fast)
  for (const event of session.replaySnapshot.compactedTurns) {
    store.dispatch(normalize(event));
  }
  // Replay live journal (O(one_turn), small)
  for (const event of session.replaySnapshot.liveJournal) {
    store.dispatch(normalize(event));
  }
}

// Then subscribe to SSE from lastEventId — only new events arrive
for await (const event of session.events({ signal })) {
  store.dispatch(normalize(event));
}
```

No `delay(0)` yielding needed (compacted turns are small). No `WeakSet` tracking. No special handling.

#### `ring_evicted` Handling

On `ring_evicted`, the client simply does a full `loadSession()` reload:

```typescript
if (event.type === 'state_resync_required' && reason === 'ring_evicted') {
  store.reset();
  session = await DaemonSessionClient.load(client, sessionId);
  // Re-seeds from compacted snapshot + subscribes to SSE
  continue; // restart the event loop
}
```

---

## Performance Analysis

### Payload Size Comparison

| Session Profile | Raw Events | #4678 Payload | This Design Payload |
|---|---|---|---|
| 30min light (10 turns) | 500 | ~0.5MB | ~50KB |
| 1h moderate (30 turns) | 3K | ~3MB | ~150KB |
| 3h heavy (100 turns, long outputs) | 50K | ~50MB | ~2MB |
| 8h marathon (300 turns) | 150K | ~150MB | ~5MB |

The 25-30x reduction comes from:
- Merging streaming chunks (200 chunks → 1 event): 200x per message
- Dropping transient signals (warnings, command updates): ~10% of events
- Final tool state only (10 updates → 1): 10x per tool call

### Memory Overhead

- `compactedTurns`: ~50KB per turn × turns. 100-turn session ≈ 5MB
- `liveJournal`: bounded by one turn's events. Typically < 1MB
- Total per session: < 10MB for extreme cases

Vs. #4678's approach: all raw events in a file that must be fully read into memory.

### Load Latency

- `snapshot()` is synchronous (array slice): < 1ms
- JSON serialization of compacted payload: < 10ms for typical sessions
- Client processing: O(turns) dispatches, not O(tokens). Sub-100ms for most sessions.

---

## Edge Cases

### 1. Very Long Single Turn (e.g., 30-minute tool execution)

The `liveJournal` grows during an incomplete turn but is bounded by:
- Tool call events are already compact (one event per status change)
- Streaming text chunks accumulate but are typically < 100KB total

If a single turn exceeds a threshold (e.g., 10K raw events in journal), trigger a **mid-turn compaction** of text/thought chunks while keeping tool calls raw (since they may still update).

### 2. Concurrent `loadSession` During Active Turn

`snapshot()` is synchronous, so it captures a consistent point-in-time view. The `lastEventId` is always the maximum ID across both arrays. No race possible.

### 3. Session Restored After Daemon Restart

1. If snapshot file exists: seed engine from file, ACP replays from `lastCompactedEventId` forward
2. If no snapshot file: full ACP replay, engine rebuilds from scratch
3. Both paths produce the same result — the snapshot file is purely a latency optimization

### 4. Multiple Clients Loading Same Session Simultaneously

`snapshot()` returns slices (defensive copies). Multiple concurrent callers are safe. No locks needed.

### 5. `user_message_chunk` with Multi-Part Content

User messages are emitted atomically (one event per message). No merging needed. Kept as-is in compacted output.

---

## Implementation Plan

### Phase 1: CompactionEngine (packages/acp-bridge)

1. Define `CompactionEngine` interface and `SessionReplaySnapshot` type
2. Implement `TurnBoundaryCompactionEngine`:
   - Text/thought chunk merging
   - Tool call state folding
   - Turn boundary detection and compaction trigger
   - `snapshot()` returning consistent state
3. Integrate into `EventBus`:
   - Add optional `CompactionEngine` parameter (like current `ReplayStore`)
   - Call `engine.ingest(event)` in `publish()`
   - Expose `snapshotReplay(): SessionReplaySnapshot`
4. Unit tests: compaction correctness, snapshot consistency, edge cases

### Phase 2: Bridge Integration (packages/acp-bridge)

1. Wire `CompactionEngine` into `createSessionEventBus()`
2. Modify `restoreSession` to include snapshot in response:
   - `loadSession`: returns `compactedReplay + liveJournal + lastEventId`
   - `resumeSession`: returns `lastEventId` only
3. Add snapshot file persistence (write on turn_complete, read on restore)
4. Add cleanup hooks (session delete, bridge shutdown, startup orphan scan)
5. Integration tests: load/resume/attach flows with compaction

### Phase 3: SDK + Client (packages/sdk-typescript, packages/webui)

1. Update `DaemonRestoredSession` type with new fields
2. Update `DaemonSessionClient.load()` / `.resume()` to expose snapshot
3. Update WebUI `DaemonSessionProvider`:
   - Remove raw event replay loop
   - Add compacted replay seeding (trivial loop)
   - Simplify `ring_evicted` handling to full reload
4. Update TUI adapter if needed (likely no change — it already processes events incrementally)

### Phase 4: Cleanup + Testing

1. Remove `ReplayStore` / `FileReplayStore` / `InMemoryReplayStore` (replaced by CompactionEngine)
2. Remove `appendUniqueEvents`, `replaySeededSessionsRef`, etc.
3. End-to-end tests: long session simulation, ring eviction recovery, crash recovery
4. Performance benchmarks: payload size, load latency at various session lengths

---

## Files to Create/Modify

| Path | Action | Purpose |
|---|---|---|
| `packages/acp-bridge/src/compactionEngine.ts` | **Create** | CompactionEngine interface + TurnBoundaryCompactionEngine impl |
| `packages/acp-bridge/src/compactionEngine.test.ts` | **Create** | Unit tests for compaction logic |
| `packages/acp-bridge/src/eventBus.ts` | Modify | Add CompactionEngine integration |
| `packages/acp-bridge/src/bridge.ts` | Modify | Wire compaction into session lifecycle, add snapshot to load response |
| `packages/acp-bridge/src/bridgeTypes.ts` | Modify | Update `BridgeRestoredSession` type |
| `packages/acp-bridge/src/bridgeOptions.ts` | Modify | Add snapshot dir option |
| `packages/acp-bridge/src/replayStore.ts` | **Delete** | Replaced by CompactionEngine |
| `packages/cli/src/serve/server.ts` | Modify | Cleanup hooks, snapshot file management |
| `packages/sdk-typescript/src/daemon/types.ts` | Modify | Update `DaemonRestoredSession` type |
| `packages/sdk-typescript/src/daemon/DaemonSessionClient.ts` | Modify | Expose replaySnapshot |
| `packages/webui/src/daemon/session/DaemonSessionProvider.tsx` | Modify | Simplified replay seeding |

---

## Verification

### Unit Tests
```bash
cd packages/acp-bridge && npx vitest run src/compactionEngine.test.ts src/eventBus.test.ts src/bridge.test.ts
```

### Integration Tests
```bash
cd packages/sdk-typescript && npx vitest run test/unit/DaemonSessionClient.test.ts
cd packages/webui && npx vitest run src/daemon/session/DaemonSessionProvider.test.tsx
```

### Manual Verification
1. Start daemon: `npx qwen serve`
2. Open WebUI, run a multi-turn conversation (3+ turns with tool calls)
3. Refresh the page → verify transcript restores instantly from compacted snapshot
4. Kill and restart daemon → verify session load still works (ACP replay rebuilds compaction)
5. Start a long streaming response, refresh mid-stream → verify partial turn renders from liveJournal
6. Simulate ring eviction (set `--event-ring-size=2`, send many messages) → verify `ring_evicted` triggers clean reload

### Build
```bash
npm run build  # Full monorepo build must pass
```

## Final Implementation Status

- **PR status**: #4678 CLOSED (not merged). No replacement PR found for the compaction engine design.
- **What was implemented**: The simpler raw-JSONL approach in PR #4678 ("fix(daemon): restore replay history after SSE ring eviction") was closed without merging. This plan proposed a superior CompactionEngine architecture to replace #4678's O(total_events) approach with O(turns) load cost, but no PR implementing this design was found.
- **Key divergences**: The entire design remains unimplemented. The daemon session replay problem (ring eviction losing history for long sessions) is still unresolved in production.
- **Current state**: Design document only — awaiting future implementation. The architecture (CompactionEngine + turn-boundary compaction + snapshot persistence) is still valid as a follow-up.
