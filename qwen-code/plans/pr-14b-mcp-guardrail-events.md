# PR 14b — `feat(serve): MCP guardrail push events + hysteresis`

Roadmap: issue #4175 Wave 3 follow-up to PR 14 (#4247 merged at 96219924a).
Depends on PR 14 (merged) + PR 10 #4237 (slow_client_warning hysteresis precedent).

## What this PR adds (vs. PR 14 v1)

PR 14 v1 surfaces budget state via the **snapshot** at `GET /workspace/mcp`
(`clientCount`, `budgets[].status`, per-server `disabledReason: 'budget'`).
Operators dashboarding the snapshot already see warning/error states.

PR 14b adds a **push channel** so SDK clients can react in real-time without
polling:

1. `mcp_budget_warning` — synthetic SSE frame, fired ONCE per crossing of
   `liveCount/budget >= 0.75` and re-armed when ratio drops below `0.375`.
   Mirrors PR 10's `slow_client_warning` hysteresis exactly.
2. `mcp_child_refused_batch` — synthetic SSE frame, coalesced once per
   discovery pass, listing all servers refused under `mode: 'enforce'`.
   Snapshot already exposes `disabledReason: 'budget'` per-server; this event
   is the change-notification.
3. SDK reducer state: `mcpBudgetWarningCount`, `lastMcpBudgetWarning`,
   `mcpRefusedBatchCount`, `lastMcpRefusedBatch` on `DaemonSessionViewState`.
4. New conditional capability tag `mcp_guardrail_events` (`mcp_guardrails`
   from PR 14 stays the always-on one).
5. Integration cross-check: `pgrep -P` × `subprocessCount` ± slack against
   `getMcpClientAccounting().subprocessCount` (validates PR 14's in-process
   counter as the event source).

## Out of scope (deferred / explicitly NOT in this PR)

- Real shared MCP transport pool (Wave 5 PR 23).
- RSS / fd / memory-pressure cells (Wave 6).
- PermissionMediator integration on budget refusal (Wave 5 PR 24).
- CLI `/mcp` slash command UI (tracking-only; non-blocking).
- A `publishWorkspaceEvent` shared helper (PR 16-area; not yet merged).
  PR 14b does its own per-session emit (5 LOC inline).

## Key design decisions

### D1. Hysteresis state machine in `McpClientManager` (per-session)

State machine fields added to existing budget block:

```ts
private warnArmed = true;             // true ⇒ next 75% crossing fires
```

Constants (already defined in PR 14, PR 14b adds `_REARM_FRACTION`):

```ts
export const MCP_BUDGET_WARN_FRACTION = 0.75 as const;       // PR 14
export const MCP_BUDGET_REARM_FRACTION = 0.375 as const;     // PR 14b
```

New private method `evaluateBudgetState()` invoked at end of every
discovery pass + every successful slot reservation:

```ts
private evaluateBudgetState(): void {
  if (this.budgetMode === 'off' || this.clientBudget === undefined) return;
  const ratio = this.reservedSlots.size / this.clientBudget;
  if (this.warnArmed && ratio >= MCP_BUDGET_WARN_FRACTION) {
    this.warnArmed = false;
    this.onBudgetEvent?.({
      kind: 'budget_warning',
      liveCount: this.getMcpClientAccounting().total,
      reservedCount: this.reservedSlots.size,
      budget: this.clientBudget,
      thresholdRatio: MCP_BUDGET_WARN_FRACTION,
      mode: this.budgetMode,
    });
  } else if (!this.warnArmed && ratio < MCP_BUDGET_REARM_FRACTION) {
    this.warnArmed = true;
  }
}
```

Use `reservedSlots.size` (not `liveCount`) for the trigger ratio: reservations
include in-flight connects and survive transient `disconnectServer`, so the
trigger is stable against connect/disconnect chatter. Payload exposes BOTH so
operators can sanity-check.

### D2. Refusal coalescing on `lastRefusedServerNames`

PR 14 already records `lastRefusedServerNames: string[]` and clears it at the
top of each discovery pass. PR 14b adds:

- New private field `lastRefusedTransports: Map<string, McpTransportKind>` so
  the per-server payload includes transport (operators eyeball "which kind of
  servers got refused").
- New private method `emitRefusedBatchIfAny()` invoked at end of both
  discovery paths (`discoverAllMcpTools`, `discoverAllMcpToolsIncremental`)
  AND at end of `readResource`'s lazy-spawn refusal path (length-1 batch for
  shape consistency).
- The batch is emitted only when `lastRefusedServerNames.length > 0`. On
  emit, `lastRefusedServerNames` and `lastRefusedTransports` are cleared.

```ts
private emitRefusedBatchIfAny(): void {
  if (this.lastRefusedServerNames.length === 0) return;
  this.onBudgetEvent?.({
    kind: 'refused_batch',
    refusedServers: this.lastRefusedServerNames.map((name) => ({
      name,
      transport: this.lastRefusedTransports.get(name) ?? 'unknown',
      reason: 'budget_exhausted',
    })),
    budget: this.clientBudget!,
    liveCount: this.getMcpClientAccounting().total,
    reservedCount: this.reservedSlots.size,
    mode: 'enforce',  // literal: warn mode never refuses
  });
  this.lastRefusedServerNames = [];
  this.lastRefusedTransports.clear();
}
```

### D3. Manager → ACP wiring via constructor callback

`McpBudgetConfig` gains:

```ts
export interface McpBudgetConfig {
  budget?: number;
  mode?: McpBudgetMode;
  onBudgetEvent?: (event: McpBudgetEvent) => void;  // NEW
}

export type McpBudgetEvent =
  | { kind: 'budget_warning'; liveCount: number; reservedCount: number;
      budget: number; thresholdRatio: 0.75; mode: 'warn' | 'enforce' }
  | { kind: 'refused_batch'; refusedServers: McpRefusedServer[];
      budget: number; liveCount: number; reservedCount: number;
      mode: 'enforce' };  // literal — warn never refuses

export interface McpRefusedServer {
  name: string;
  transport: McpTransportKind;
  reason: 'budget_exhausted';
}
```

`acpAgent.ts` provides the callback at manager construction. The callback
captures the current ACP `sessionId` (each session creates its own manager,
so closure capture is exact) and translates each `McpBudgetEvent` into:

```ts
this.connection.extNotification('qwen/notify/session/mcp-budget-event', {
  v: 1,
  sessionId,            // captured via closure at manager construction
  ...event,             // discriminated by `kind`
});
```

This decouples core from ACP wire (the manager doesn't import any ACP types).

### D4. Bridge handler: per-session publish

`BridgeClient` adds an optional `extNotification?(method, params)` handler.
For `qwen/notify/session/mcp-budget-event`:

```ts
async extNotification(method: string, params: Record<string, unknown>) {
  if (method === 'qwen/notify/session/mcp-budget-event') {
    const sid = params['sessionId'];
    if (typeof sid !== 'string') return;
    const entry = this.resolveEntry(sid);
    if (!entry) return;  // session gone, drop silently
    const kind = params['kind'];
    const type = kind === 'budget_warning'
      ? 'mcp_budget_warning'
      : kind === 'refused_batch'
      ? 'mcp_child_refused_batch'
      : undefined;
    if (!type) return;  // unknown kind, drop (forward-compat)
    entry.events.publishSynthetic({
      type,
      data: stripSessionMeta(params),
    });
    return;
  }
  // unknown extNotifications: drop silently (forward-compat)
}
```

`publishSynthetic` is the existing `publish({ ..., forced: true })` path
EventBus uses for `slow_client_warning` (no `id`, doesn't count toward
maxQueued). Verify the exact public API name in eventBus.ts before
implementing — may be `publish(frame, { forced: true })`.

### D5. Synthetic frames; snapshot is the resync source

Both event types are synthetic (no `id` — see eventBus.ts line ~290). On
reconnect with `Last-Event-ID`, the client doesn't replay missed warnings;
instead it hits `GET /workspace/mcp` and reads the current
`budgets[0].status` + per-server `disabledReason` to reconstruct state.

This matches `slow_client_warning`'s contract: warnings are change-edges,
state is owned by the snapshot.

### D6. Conditional capability tag `mcp_guardrail_events`

`SERVE_CAPABILITY_REGISTRY` gains:

```ts
mcp_guardrail_events: { since: 'v1' },   // always-on, additive
```

Distinct from PR 14's `mcp_guardrails` so old clients can branch:
- See `mcp_guardrails` only → use snapshot polling
- See both `mcp_guardrails` + `mcp_guardrail_events` → subscribe to events

Single registry entry; no `modes` field needed (events are unconditional).

### D7. SDK typed-event registry

`packages/sdk-typescript/src/daemon/events.ts`:

```ts
// Add to DAEMON_KNOWN_EVENT_TYPE_VALUES
'mcp_budget_warning',
'mcp_child_refused_batch',

// Data interfaces
export interface DaemonMcpBudgetWarningData {
  v: 1;
  liveCount: number;
  reservedCount: number;
  budget: number;
  thresholdRatio: 0.75;
  mode: 'warn' | 'enforce';
}

export interface DaemonMcpChildRefusedBatchData {
  v: 1;
  refusedServers: Array<{
    name: string;
    transport: DaemonMcpTransport;  // reuse PR 14 type
    reason: 'budget_exhausted';
  }>;
  budget: number;
  liveCount: number;
  reservedCount: number;
  mode: 'enforce';  // literal
}

// Predicates + asKnownDaemonEvent cases (mirror PR 4 + PR 10 pattern)

// Reducer additions to DaemonSessionViewState:
mcpBudgetWarningCount: number;       // monotonic
lastMcpBudgetWarning?: DaemonMcpBudgetWarningData & { at: number };
mcpRefusedBatchCount: number;        // monotonic
lastMcpRefusedBatch?: DaemonMcpChildRefusedBatchData & { at: number };
```

Reducer rule: increment counters on every event; replace `last*` with the
latest. `at` is the SDK-side wallclock (`Date.now()` at reduce time) since
synthetic frames have no `id`.

### D8. Integration cross-check

New describe block in `integration-tests/cli/qwen-serve-baseline.test.ts`:

```
PR 14b — in-process counter sanity vs. external pgrep
  - spawn 5 stdio MCP fixtures
  - assert daemon's getMcpClientAccounting().subprocessCount
    matches countDescendants(childPid) × mcpAmplificationFactor (≤ 2)
    ± slack (mcpAmplificationFactor * declaredServerCount + 1)
```

Skip-gated like PR 1 (macOS/Linux only, non-sandbox). Validates the PR 14
counter as the event source — if the counter is wrong, every push event is
wrong, but unit tests can't catch the OS-level discrepancy.

### D9. Wire compat / `v: 1` envelope

ACP notification payload carries `v: 1`. SDK frame `v` stays at `1`. No
breaking changes; older clients ignore `mcp_guardrail_events` capability and
unknown event types per the existing forward-compat contract.

## Files to modify

| File | Change |
|---|---|
| `packages/core/src/tools/mcp-client-manager.ts` | Add `MCP_BUDGET_REARM_FRACTION`, `McpBudgetEvent` union, `McpRefusedServer`. Extend `McpBudgetConfig` with `onBudgetEvent`. Add `warnArmed`, `lastRefusedTransports`. Add `evaluateBudgetState()`, `emitRefusedBatchIfAny()`. Hook both into 3 sites. Track transport in `lastRefusedTransports` at refusal time. |
| `packages/core/src/tools/mcp-client-manager.test.ts` | New `describe('PR 14b — push events + hysteresis')` block. Tests: state-machine arms/fires/rearms; ratio just-below-75% no-fire; crossing 75% upward fires once; staying above does not refire; dropping to 50% (above 37.5%) does not rearm; dropping to 30% rearms; off-mode never fires; refused batch coalesces; refused batch length-1 from `readResource`; off-mode no refused batch. |
| `packages/cli/src/acp-integration/acpAgent.ts` | Pass `onBudgetEvent` to `McpClientManager` at construction. Translate event to `connection.extNotification(...)`. |
| `packages/cli/src/acp-integration/acpAgent.test.ts` | Test: manager event → connection.extNotification with right method + payload. |
| `packages/cli/src/serve/httpAcpBridge.ts` | Add `extNotification?(method, params)` to `BridgeClient`. Handle `qwen/notify/session/mcp-budget-event` (resolve session, publish synthetic frame). Drop unknown methods + unknown kinds. |
| `packages/cli/src/serve/httpAcpBridge.test.ts` | Tests: warning notification → SSE frame published; refused-batch notification → frame published; missing sessionId → drop; unknown method → drop; unknown kind → drop. |
| `packages/cli/src/serve/capabilities.ts` | Add `mcp_guardrail_events: { since: 'v1' }` to registry. |
| `packages/cli/src/serve/server.test.ts` | Capability shape assertion + advertised-features test. |
| `packages/sdk-typescript/src/daemon/events.ts` | Add to `DAEMON_KNOWN_EVENT_TYPE_VALUES`. Add `DaemonMcpBudgetWarningData`, `DaemonMcpChildRefusedBatchData`, predicates, `asKnownDaemonEvent` cases, reducer cases. Add 4 reducer fields to `DaemonSessionViewState`. |
| `packages/sdk-typescript/test/unit/daemonEvents.test.ts` | Schema validation (predicates accept good shapes, reject bad), reducer counter + lastEvent tests for both event types. |
| `integration-tests/cli/qwen-serve-baseline.test.ts` | New describe block for `pgrep -P` × `subprocessCount` cross-check. macOS/Linux non-sandbox skip-gating. |
| `docs/users/qwen-serve.md` | Brief paragraph in MCP guardrails section: "Push events are emitted on the SSE stream when budget thresholds are crossed; subscribe via GET /session/:id/events." |
| `docs/developers/qwen-serve-protocol.md` | Add `mcp_guardrail_events` capability description, payload shape for both events, hysteresis semantics, scope=session note (forward-compat to workspace in Wave 5 PR 23). |

## Verification plan

1. **Unit (manager state machine)**: vitest run targeting the new `PR 14b` describe block. Assert hysteresis trigger, rearm, off-mode no-op.
2. **Unit (acpAgent wiring)**: assert `connection.extNotification` called with expected method + payload when manager fires.
3. **Unit (bridge handler)**: assert `entry.events.publish` called with right synthetic frame; missing/unknown drops silently.
4. **Unit (SDK)**: predicate guards + reducer counter increments + `last*` field set; bad shapes rejected.
5. **Round-trip (server.test.ts)**: full path from injected fake-bridge ext-notification through HTTP SSE.
6. **Integration**: `pgrep -P` × `subprocessCount` cross-check with declared slack.
7. **Typecheck + lint** across cli, core, sdk-typescript, webui (4 workspaces).
8. **Backward compat**: assert pre-PR-14b baseline tests stay green; assert clients that don't subscribe still get the snapshot view.

## Engineering principles checklist

- [x] **Independently mergeable** — depends only on merged PR 14.
- [x] **Backward compatible** — events are synthetic (no `id`); old clients ignore unknown types per forward-compat contract; capability tag is conditional.
- [x] **Default off** — events still gated by `--mcp-client-budget` (no budget → no events). Mode `off` skips state machine entirely.
- [x] **Reversible** — revert PR 14b → manager loses `evaluateBudgetState`/`emitRefusedBatchIfAny` calls, snapshot still works (PR 14 v1 contract).
- [x] **Tests-first** — 10+ new unit tests + 4 SDK tests + 1 integration test, all written with implementation.
- [x] **No PR 14 contract changes** — no field renames, no semantic shifts; PR 14b is purely additive.

## Prior art references (for PR description)

- **`slow_client_warning` (PR 10 #4237)** — direct precedent for synthetic-frame + dual-threshold-hysteresis. `WARN_THRESHOLD_RATIO`/`WARN_RESET_RATIO` constants in `eventBus.ts:85-87`. PR 14b uses the same fractions but defines its own constants in core (manager-side state, not bridge-side queue state).
- **`session_died` fan-out (httpAcpBridge.ts:1948)** — precedent for iterating session entries and `events.publish(...)` per session. PR 14b's bridge handler is a single-session variant of this pattern.
- **`authenticate/update` extNotification (acpAgent.ts:355)** — precedent for child→bridge fire-and-forget custom notifications. PR 14b uses the same `connection.extNotification` API.
- **PR 13 closed-enum errorKind** — PR 14 already added `'budget_exhausted'`; PR 14b reuses without adding new error kinds.
- **claude-code 16ms batch flush (`useManageMCPConnections.ts:203`)** — shape reference for batch coalescing payload (an array of refused entries, not N individual events).
- **opencode `Rpc.emit`** — shape reference; opencode has no dual-threshold hysteresis (operators don't get rearmed warnings).

## Confirmed non-existent in both reference repos

- Dual-threshold hysteresis on MCP capacity events.
- Per-transport breakdown in refusal payloads (claude-code's `tengu_mcp_server_connection_succeeded` per-transport count is the closest, but it's success-side telemetry).
- A capability/feature-detect registry equivalent — `SERVE_CAPABILITY_REGISTRY` shape stays unique to qwen-code.

## Risk / open questions

1. **Per-session vs daemon-wide warning ergonomics**: With per-session managers, an operator running 3 sessions on a daemon will see warning frames on each session's SSE bus when its own ratio crosses 75% — independent state machines. Operators expecting "daemon at 75%" need to aggregate across sessions client-side. PR 23's shared pool will graduate this naturally. Documented in `qwen-serve-protocol.md`.
2. **`evaluateBudgetState` placement on every discovery pass vs every reservation**: Calling on every reservation is more responsive but creates ratio noise during multi-server discovery (intermediate ratios that are real but transient). Calling at end-of-pass is the cleaner edge. PR 14b calls at **end of pass** (matches the snapshot's "post-discovery state" semantics). Single `readResource` lazy-spawn refusal triggers `evaluateBudgetState` directly (no other reservations in that path).
3. **Test infrastructure for `extNotification` callbacks**: existing acpAgent tests mock `connection`. New tests inject a spy `extNotification` and assert call args. No new test infra needed.
4. **Rearm ratio choice (37.5%)**: Mirrors PR 10's `WARN_RESET_RATIO`. Wider gap (e.g., 50%) would produce more rearm-fires; narrower (e.g., 25%) is hysteresis-correct but matches operator expectation less. Stick with PR 10's number.

## Final Implementation Status

- **PR status**: Dependency PR #4247 (PR 14 v1, MCP client guardrails) MERGED on 2026-05-18. No standalone "PR 14b" PR was found implementing the push events and hysteresis described in this plan.
- **What was implemented**: Only PR 14 v1's snapshot-based budget state (`GET /workspace/mcp` with `budgets[].status`, per-server `disabledReason: 'budget'`) was merged. The push channel (real-time `mcp_budget_warning` and `mcp_child_refused_batch` SSE events with dual-threshold hysteresis) was not implemented.
- **Key divergences**: The entire plan (hysteresis state machine, `evaluateBudgetState()`, `emitRefusedBatchIfAny()`, `onBudgetEvent` callback, bridge handler for `extNotification`, SDK reducer fields, `mcp_guardrail_events` capability tag) remains unimplemented.
- **Current state**: Design complete but not executed. Tracking issue #4175 is still OPEN. Operators must poll the snapshot endpoint for budget state rather than subscribing to push events.
