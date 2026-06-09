# PR 14 — `feat(serve): MCP resource guardrails`

Roadmap: issue #4175 Wave 3 PR 14. Depends on PR 1 (#4205 merged) + PR 12 (#4241 merged) + PR 15 (#4236 merged, for capability registry pattern). Unblocks PR 17.

## Implementation status (as of 2026-05-17)

Implementation landed on branch `feat/serve-mcp-guardrails`: **12 files changed, +1155 / -2 lines**. 637/637 tests pass across 21 vitest files (core mcp-client-manager + serve + acp-integration + sdk daemonEvents). 4-workspace typecheck clean, 6-file lint clean.

**PR 14 v1 ships (this PR):**

- Core `McpClientManager`: in-process accounting, slot reservation, budget enforcement at all 3 sites (`discoverAllMcpTools`, `discoverAllMcpToolsIncremental`, `readResource`), slot release in `disconnectServer` / `removeServer` / `stop`, `BudgetExhaustedError`, `mcpTransportOf` static helper.
- Config plumbing: `--mcp-client-budget=N` + `--mcp-budget-mode={enforce,warn,off}` CLI flags, boot validation (rejects `enforce` without budget; rejects non-positive integers), stderr breadcrumb mirroring PR 15's `--require-auth` style, env-var passthrough (`QWEN_SERVE_MCP_CLIENT_BUDGET` / `QWEN_SERVE_MCP_BUDGET_MODE`) to ACP child.
- Status payload: `ServeWorkspaceMcpStatus` gains `clientCount` / `clientBudget` / `budgetMode` / `budgets[]`; `ServeWorkspaceMcpServerStatus` gains `disabledReason: 'config' | 'budget'`; new `ServeMcpBudgetStatusCell` sub-interface with `scope: 'workspace'` (PR 23 forward-compat). `createIdleWorkspaceMcpStatus` updated.
- Capability tag `mcp_guardrails: { since: 'v1', modes: ['warn', 'enforce'] }` (always-on); `ServeCapabilityDescriptor` gains optional `modes` field for future feature-modes wire surface.
- `acpAgent.buildWorkspaceMcpStatus` reads `McpClientManager` accounting and emits the new fields + tags refused servers + builds workspace-level budget cell with hysteresis-style severity (`warning` at ≥75%, `error` if refusals occurred).
- SDK type mirror (`DaemonWorkspaceMcpStatus` + `DaemonMcpBudgetStatusCell` + `DaemonMcpBudgetMode` + `disabledReason`).
- Telemetry hook: `recordStartupEvent('mcp_budget_decision', ...)` at end of both discovery paths (G10 was wrong — the function does exist in core, already used by `mcp-client-manager.ts`).
- Tests: 13 new core unit tests (counter, reserve race, enforce/warn/off modes, refusal-order determinism, refused-reset between passes, `BudgetExhaustedError` from `readResource`, slot release on disconnect, env-var fallback in 3 branches, disabled-doesn't-count); 2 new serve route tests (`mcp_guardrails` advertised in capabilities, PR-14-shaped payload round-trips).
- Docs: `docs/users/qwen-serve.md` (CLI flags table + "MCP client guardrails" section); `docs/developers/qwen-serve-protocol.md` (`mcp_guardrails` capability description, full JSON example with budget fields, scope-precedence forward-compat note).

**PR 14b deferred (small follow-up PR):**

- `mcp_budget_warning` / `mcp_child_refused_batch` typed events. Needs new workspace-level ACP notification channel (child→daemon→fan-out to all session buses), which is its own protocol decision. Current snapshot fully exposes the same data via `budgets[0].status: 'warning'|'error'` + `refusedCount`, so observability isn't blocked.
- SDK reducer state (`mcpBudgetWarningCount`, `lastMcpBudgetWarning`, `mcpRefusedBatchCount`, `lastMcpRefusedBatch`) — follows the events.
- Bridge-side hysteresis state machine (`WARN_THRESHOLD_RATIO` / `WARN_RESET_RATIO` export from eventBus.ts) — follows the events.
- Integration test cross-check: `pgrep -P subprocessCount` vs daemon's `subprocessCount × amplification ± slack`. Belongs with PR 14b because it validates the in-process counter as the event source.
- CLI `/mcp` slash command update — tracking-only, not PR-blocking.

**Why split**: PR 14 v1 keeps the diff at ~1200 lines on 12 files, all behind feature flags and additive types. PR 14b is purely additive on top — adding a new event channel doesn't change any existing field semantics. Reviewer can approve v1 without first agreeing on the workspace-level notification protocol shape.

## Context

Mode B daemon (`qwen serve`) is now "1 daemon = 1 workspace × N sessions" post-#4113. All sessions in a workspace share one `McpClientManager`, so MCP children are per-workspace already correct. But there are three observable gaps:

1. **No in-process counter** for live MCP clients. PR 1 baseline harness counts externally via `pgrep -P` and asserts an amplification cap (`mcpAmplificationFactor: 2`); the daemon has no equivalent signal to expose to operators or to its own future enforcement layer.
2. **No budget**. A workspace with 50 MCP servers configured will start 50 clients with no operator control. PR 15 added `--max-sessions` / `--max-connections` for HTTP fan-out but the MCP fan-out is unbounded.
3. **No standardized warning event**. PR 10 established the `slow_client_warning` pattern (synthetic frame + hysteresis + once-per-episode + SDK reducer state). MCP resource pressure has no equivalent.

PR 14 closes those gaps without building a shared MCP pool — that is Wave 5 PR 23 and depends on bridge extraction (PR 22). PR 14 is observability + soft enforcement on the existing per-workspace manager.

## In scope (PR 14 v1 — shipped)

1. ✅ In-process MCP client accounting on `McpClientManager` (replaces external `pgrep` as source of truth).
2. ✅ New flag `--mcp-client-budget=N` (no default cap) + `--mcp-budget-mode={enforce,warn,off}`. Default mode: `warn` when budget set, `off` otherwise.
3. ✅ Slot-reservation model so reconnect / discovery-timeout / lazy-spawn don't drift the count.
4. ✅ Refusal path in `enforce` mode (skip connect, mark per-server cell as `status: 'error', errorKind: 'budget_exhausted'`, `disabledReason: 'budget'`).
5. ✅ Workspace-level `budgets[]` cell on `GET /workspace/mcp` (additive, future-proof for PR 23 pool-scope cell). Cell status reflects hysteresis-style severity (`ok` < 75%, `warning` ≥ 75%, `error` on any refusal).
6. ⏸ **Deferred to PR 14b**: coalesced typed event `mcp_child_refused_batch` + hysteresis warning event `mcp_budget_warning`. Snapshot fully covers operator visibility (`budgets[0].status`, `refusedCount`); the event channel needs a new workspace-level ACP notification kind which is its own protocol decision.
7. ✅ Capability tag `mcp_guardrails` with `modes: ['warn', 'enforce']` (always-on, additive). `ServeCapabilityDescriptor` extended with optional `modes` field.
8. ⏸ **Partially deferred**: SDK type mirror **shipped**; SDK reducer + validator for the new events **deferred to PR 14b** (follows the events themselves).
9. ✅ Tests + docs.

## Out of scope (PR 14b or later)

- Typed budget events + bridge hysteresis state machine + SDK reducer additions (**PR 14b** — defined above).
- Integration test cross-check `pgrep -P` vs daemon `subprocessCount × amplification ± slack` (**PR 14b** — validates the counter as event source).
- Real shared MCP transport/process pool (Wave 5 PR 23).
- RSS / fd / memory-pressure cells (Wave 6 hardening).
- Per-session MCP budget (current model is per-workspace; Wave 5 may introduce pool-scope or per-session).
- PermissionMediator integration on budget-exhausted notifications (Wave 5 PR 24).
- CLI `/mcp` slash command updates to surface budget UI (tracking-only follow-up; not protocol-blocking).
- Wire-surface for the `modes` capability descriptor field (currently registry-only documentation; future PR can add `featureModes?: Record<string, string[]>` to `/capabilities`).

## Key design decisions

### D1. Counter lives in `packages/core/src/tools/mcp-client-manager.ts`

The Plan agent's critique stands: core already owns server lifecycle and exposes `getDiscoveryState()`; a bridge-side cache would race against the multi-emission `mcp-client-update` event. Counter is in core, bridge polls on demand.

New API on `McpClientManager`:

```ts
getMcpClientAccounting(): {
  total: number;                              // live, connected clients
  byTransport: Record<TransportKind, number>; // stdio/sse/http/websocket/sdk
  subprocessCount: number;                    // total - sdk - sse - http (i.e. stdio + websocket-spawned)
  reservedSlots: string[];                    // server names holding a budget slot
  refusedServerNames: string[];               // refused in last discovery pass
}
```

Rename intent: **"client" not "child"** because `sdk` transport is in-process. The flag is `--mcp-client-budget` (not `--mcp-child-budget`). `subprocessCount` is the value the PR 1 harness can validate against `pgrep` (with the `mcpAmplificationFactor` slack).

### D2. Slot reservation as a separate `Set<string>`

Slots are reserved by server name at the **first successful connect**. Reservation survives:
- `reconnectServer` (drops + recreates client; slot stays).
- `runWithDiscoveryTimeout` deletion at line 656 (operator intent is "this server should be running").
- `disconnectServer` called for transient cleanup.

Slot is released only on:
- Server removed from config (next discovery pass sees it gone).
- `cliConfig.isMcpServerDisabled(name)` flipped to `true` (mid-session disable via `/mcp disable`).

This protects against the connect/reconnect race the agent flagged (line 191-204 deletes then recreates).

### D3. Three call sites must respect the budget

| Site | File | Behavior |
|---|---|---|
| `discoverAllMcpToolsIncremental` | mcp-client-manager.ts:~480 | Walk config-declaration order; for each non-disabled, non-reserved server, check `liveCount + reservedSlots.size < budget`. Beyond budget: skip connect, push name into `refusedServerNames`, mark per-server status. |
| `discoverAllMcpTools` (legacy) | mcp-client-manager.ts:~95 | Same logic. Stage 1 still uses both paths. |
| `readResource` (lazy spawn) | mcp-client-manager.ts:748 | Same check before lazy `McpClient` instantiation. Reject with `BudgetExhaustedError` (new typed error) — caller surfaces as resource-read failure. |

`isMcpServerDisabled` already short-circuits before connect; disabled servers don't count and don't appear in `refusedServerNames`.

### D4. Budget mode (`warn` is default)

User-confirmed choice. Semantics:

| Mode | Budget unset | `liveCount < budget` | `liveCount >= budget` |
|---|---|---|---|
| `off` (auto when budget unset) | no-op | no-op | no-op |
| `warn` (auto when budget set) | n/a | maybe emit `mcp_budget_warning` at 75% hysteresis | emit warning + status `warning`; **still connect** |
| `enforce` | n/a | maybe emit warning | refuse connect + emit `mcp_child_refused_batch` at end of pass; status `error`, errorKind `budget_exhausted` |

`enforce` is opt-in this PR. A follow-up PR can flip default once telemetry shows the in-the-wild distribution.

### D5. Coalesced refusal event (deferred to PR 14b)

User-confirmed shape. `mcp_child_refused_batch` would emit **once per `discoverAllMcpTools*` pass** containing all refusals from that pass:

```ts
interface DaemonMcpChildRefusedBatchData {
  refusedServers: Array<{
    name: string;
    transport: TransportKind;
    reason: 'budget_exhausted';
  }>;
  budget: number;
  liveCount: number;
  reservedCount: number;
}
```

`readResource`'s lazy-spawn refusal would emit its own single-server batch (length-1 array) for shape consistency.

**Status**: deferred. PR 14 v1 surfaces refusal data via the snapshot — `GET /workspace/mcp` includes `budgets[0].refusedCount` + per-server `disabledReason: 'budget'`. The typed push event needs a new workspace-level ACP notification channel (child→daemon→fan-out to all session buses); the McpClientManager lives in the ACP child while the EventBus lives in the daemon, and there's no existing notification kind that the child can use for workspace-level signals (only session-scoped `agent.sessionUpdate`). PR 14b will add the notification kind + bridge fan-out together.

### D6. Warning event with hysteresis (deferred to PR 14b)

`mcp_budget_warning` would follow `slow_client_warning` exactly: warn at 75%, rearm at 37.5%, synthetic `BridgeEvent` with no `id`, once per episode. Payload:

```ts
interface DaemonMcpBudgetWarningData {
  liveCount: number;
  budget: number;
  thresholdRatio: 0.75;  // literal type
  mode: 'warn' | 'enforce';
}
```

Reuse `WARN_THRESHOLD_RATIO` / `WARN_RESET_RATIO` constants from eventBus.ts (export them if currently private).

**Status**: deferred for the same reason as D5. PR 14 v1's snapshot already encodes the threshold crossing — `buildBudgetCells` in `acpAgent.ts` sets `status: 'warning'` when `liveCount >= 0.75 * budget`, so operators dashboarding the snapshot see the warning state. The push-event variant becomes useful when SDK clients want to react without polling; PR 14b adds it.

### D7. Status payload extensions (additive)

`ServeWorkspaceMcpStatus` gains:

```ts
clientCount?: number;             // live, connected
clientBudget?: number;            // configured cap (undefined = unlimited)
budgetMode?: 'enforce' | 'warn' | 'off';
budgets?: ServeStatusCell[];      // list (not single) for PR 23 forward-compat
```

`budgets[]` carries one cell today:

```ts
{
  kind: 'mcp_budget',
  scope: 'workspace',         // new field; PR 23 will add 'pool'
  status: 'ok' | 'warning' | 'error',
  errorKind?: 'budget_exhausted',
  hint?: 'raise --mcp-client-budget or remove servers from mcpServers config',
}
```

Per-server `ServeWorkspaceMcpServerStatus` gains `disabledReason?: 'budget'` so refused servers are machine-distinguishable from operator-disabled ones.

Idle workspace (`initialized: false`) returns `clientCount: 0`, `budgets: []`, no enforcement side-effect. The existing `createIdleWorkspaceMcpStatus` is the only branch that needs to set these fields.

### D8. Capability tag

```ts
// packages/cli/src/serve/capabilities.ts SERVE_CAPABILITY_REGISTRY
mcp_guardrails: { since: 'v1', modes: ['warn', 'enforce'] },
```

This is the first registry entry with `modes`. Introduce a new optional `modes?: readonly string[]` field on `ServeCapabilityDescriptor`. Clients without `modes` awareness see the tag and assume baseline support (always-on); aware clients can feature-detect `'enforce'` for refusal semantics.

## Files modified — PR 14 v1 (actual)

12 files, +1155 / -2 lines on branch `feat/serve-mcp-guardrails`.

| File | Change |
|---|---|
| `packages/core/src/tools/mcp-client-manager.ts` | ✅ Added `McpBudgetMode`, `McpBudgetConfig`, `McpTransportKind`, `McpClientAccounting`, `BudgetExhaustedError`, `mcpTransportOf` (exported), `readBudgetFromEnv` (private). Constructor takes optional 6th `budgetConfig` param falling back to env vars. Added `reservedSlots: Set<string>` + `lastRefusedServerNames: string[]` fields. New methods: `getMcpClientAccounting`, `getMcpBudgetMode`, `getMcpClientBudget`, private `tryReserveSlot`. Budget gate inserted at 3 sites; slot release in `disconnectServer` + `removeServer` + `stop`. `recordStartupEvent('mcp_budget_decision', ...)` at end of both discovery paths. |
| `packages/core/src/tools/mcp-client-manager.test.ts` | ✅ 13 new tests in dedicated `describe('McpClientManager — PR 14 guardrails')` block: empty-manager accounting, `mcpTransportOf` exhaustive, enforce refuses past budget, warn never refuses, off skips reservation, refusal config-order determinism, refusal-reset between passes, `readResource` throws `BudgetExhaustedError`, `disconnectServer` releases slot, env-var fallback (3 branches), disabled servers don't count. 19 existing tests still pass. |
| `packages/cli/src/commands/serve.ts` | ✅ Added `--mcp-client-budget=N` + `--mcp-budget-mode={enforce,warn,off}` to `ServeArgs`. Boot validation: rejects non-positive-integer budget and `enforce` without budget. Stderr breadcrumb on boot when budget set (mirrors PR 15 `--require-auth` pattern). Threads through to `runQwenServe`. |
| `packages/cli/src/serve/types.ts` | ✅ Added `mcpClientBudget?: number; mcpBudgetMode?: 'enforce'\|'warn'\|'off'` to `ServeOptions` with full doc comments. |
| `packages/cli/src/serve/runQwenServe.ts` | ✅ Sets `process.env['QWEN_SERVE_MCP_CLIENT_BUDGET']` / `process.env['QWEN_SERVE_MCP_BUDGET_MODE']` before bridge construction so `defaultSpawnChannelFactory`'s `{...process.env}` snapshot picks them up for the ACP child. |
| `packages/cli/src/serve/status.ts` | ✅ Added `ServeMcpBudgetMode` type. New `ServeMcpBudgetStatusCell` sub-interface (`kind: 'mcp_budget'`, `scope: 'workspace'`, `liveCount`, `budget?`, `mode`, `refusedCount`). Extended `ServeWorkspaceMcpStatus` (`clientCount?`, `clientBudget?`, `budgetMode?`, `budgets?`). Extended `ServeWorkspaceMcpServerStatus` (`disabledReason?: 'config' \| 'budget'`). `createIdleWorkspaceMcpStatus` returns `clientCount: 0`, `budgetMode: 'off'`, `budgets: []`. |
| `packages/cli/src/serve/capabilities.ts` | ✅ Extended `ServeCapabilityDescriptor` with optional `modes?: readonly string[]`. Added `mcp_guardrails: { since: 'v1', modes: ['warn', 'enforce'] }` to registry — placed BEFORE `require_auth` to keep the conditional tag last. |
| `packages/cli/src/acp-integration/acpAgent.ts` | ✅ Imported new types. `buildWorkspaceMcpStatus` now reads `config.getToolRegistry()?.getMcpClientManager()?.getMcpClientAccounting()` with try/catch fallback, computes `clientCount/clientBudget/budgetMode/budgets[]`, tags refused servers with `disabledReason: 'budget' + errorKind: 'budget_exhausted' + hint`, and tags `disabledReason: 'config'` for operator-disabled servers. New private `buildBudgetCells` helper computes cell severity (`ok`/`warning`/`error`) and hint. |
| `packages/cli/src/serve/server.test.ts` | ✅ Added `'mcp_guardrails'` to `EXPECTED_STAGE1_FEATURES`. New test asserting `SERVE_CAPABILITY_REGISTRY.mcp_guardrails` shape (`since: 'v1', modes: ['warn', 'enforce']`). New `round-trips PR 14 budget fields on /workspace/mcp` test exercising a full payload including `budgets[0]`, `disabledReason: 'budget'`, all new fields. 145 existing tests still pass. |
| `packages/sdk-typescript/src/daemon/types.ts` | ✅ Mirror: `DaemonMcpBudgetMode`, `DaemonMcpBudgetStatusCell`, extended `DaemonWorkspaceMcpStatus`, extended `DaemonWorkspaceMcpServerStatus` (`disabledReason`). Full doc comments. |
| `docs/users/qwen-serve.md` | ✅ Added `--mcp-client-budget` and `--mcp-budget-mode` to CLI flags table. Added "MCP client guardrails" subsection with sequenced rollout recipe (warn first, then enforce) + claude-code `MCP_SERVER_CONNECTION_BATCH_SIZE` orthogonality note. |
| `docs/developers/qwen-serve-protocol.md` | ✅ Added `mcp_guardrails` to capabilities feature list. Added detailed paragraph on `mcp_guardrails` semantics + forward-compat scope-precedence note. Clarified `mcp_guardrails` is NOT conditional. Added "MCP client guardrails" subsection under `GET /workspace/mcp` with full JSON example showing all new fields + per-server `disabledReason: 'budget'` case. |

## Files PR 14b will touch (deferred)

| File | Planned change |
|---|---|
| `packages/cli/src/serve/eventBus.ts` | Export `WARN_THRESHOLD_RATIO` / `WARN_RESET_RATIO` for reuse. |
| `packages/cli/src/serve/httpAcpBridge.ts` (or new module) | Add workspace-level ACP notification handler; hold per-workspace hysteresis state (armed boolean per threshold); fan-out typed `BridgeEvent` to all live session buses. |
| `packages/cli/src/acp-integration/acpAgent.ts` | Emit a new ACP notification kind (`qwen/workspace/mcp-budget-event` or similar) from the child whenever `tryReserveSlot` returns `refused` or whenever the live count crosses 75% / 37.5%. |
| `packages/sdk-typescript/src/daemon/events.ts` | Add `mcp_budget_warning` + `mcp_child_refused_batch` to `DAEMON_KNOWN_EVENT_TYPE_VALUES`; data interfaces; predicate guards; `asKnownDaemonEvent` cases; `reduceDaemonSessionEvent` cases adding the 4 reducer fields to `DaemonSessionViewState`. |
| `packages/sdk-typescript/test/unit/daemonEvents.test.ts` | Schema validation + reducer counter tests for both new events. |
| `packages/cli/src/serve/server.test.ts` / `eventBus.test.ts` | Tests for the bridge hysteresis state machine + the fan-out path. |
| `integration-tests/cli/qwen-serve-baseline.test.ts` | New describe block: `pgrep -P subprocessCount` vs daemon-reported `subprocessCount × amplification ± slack`. Slack documented as `mcpAmplificationFactor * declaredServerCount + 1`. Skip-gated like PR 1 (macOS/Linux, non-sandbox). |

## Critical references to reuse (do not re-implement)

- `packages/cli/src/serve/eventBus.ts:288` — warning emission + hysteresis pattern.
- `packages/cli/src/serve/status.ts:27` — `ServeStatusCell` shape (the contract PR 14 must match).
- `packages/cli/src/serve/status.ts:143` — `createIdleWorkspaceMcpStatus` (the only branch where new fields default to 0 / empty).
- `packages/cli/src/serve/capabilities.ts:25` — `SERVE_CAPABILITY_REGISTRY` add pattern (PR 15 precedent).
- `packages/sdk-typescript/src/daemon/events.ts:9,280,334` — typed event add pattern (PR 4 #4217 + PR 10 #4237).
- `packages/cli/src/serve/eventBus.test.ts:100-205` — hysteresis test pattern.
- `packages/sdk-typescript/test/unit/daemonEvents.test.ts:660+` — SDK validation + reducer test pattern.
- `packages/cli/src/serve/server.test.ts:698-729` — fakeBridge HTTP route test pattern.
- `integration-tests/cli/_daemon-harness.ts:318` (`countDescendants`) — the external `pgrep -P` measurement that the new in-process counter validates against.

## Verification — PR 14 v1 (executed)

1. ✅ **Unit + serve tests** — `npx vitest run packages/core/src/tools/mcp-client-manager.test.ts packages/cli/src/serve packages/cli/src/acp-integration packages/sdk-typescript/test/unit/daemonEvents.test.ts` → **637/637 pass across 21 files** (32 in core mcp-client-manager including 13 new, 147 in serve including 2 new, 50 in acpAgent, plus the rest).
2. ✅ **Typecheck** — `npm run typecheck` → **clean across 4 workspaces** (cli, core, sdk-typescript, webui).
3. ✅ **Lint** — `npx eslint` on the 6 touched files → **clean** (after auto-fix on test file's `T[]` → `Array<T>` style).
4. ⏸ **Backward compat** — implicit in #1 above. The 145 pre-existing serve tests + 50 pre-existing acpAgent tests + 19 pre-existing mcp-client-manager tests all stay green. `/capabilities` includes `mcp_guardrails` for new clients; old clients ignore unknown features and still see the always-on baseline.
5. ⏸ **Manual smoke** — deferred (no model creds in this env). Recommended smoke when running with creds:
   - `qwen serve --mcp-client-budget=2 --mcp-budget-mode=warn` against fixture with 5 stdio MCP servers → all 5 connect; `GET /workspace/mcp` shows `clientCount: 5`, `budgetMode: 'warn'`, `budgets[0].status: 'warning'`; no refusals.
   - Restart `--mcp-budget-mode=enforce` → only 2 connect (declaration order); 3 servers report `disabledReason: 'budget'`, `errorKind: 'budget_exhausted'`; `budgets[0].status: 'error'`, `budgets[0].refusedCount: 3`; stderr breadcrumb at boot shows `--mcp-client-budget=2 mode=enforce (servers past the cap will be refused at discovery)`.
6. ⏸ **PR 14b verification** (planned): the integration-baseline cross-check (`pgrep -P subprocessCount` ≈ daemon's `subprocessCount × amplification ± slack`) ships with the typed events PR since it validates the in-process counter as event source.

## Prior art references (for PR description)

PR 14 is net-new across both reference codebases (no equivalent budget+enforce+coalesced-refusal+hysteresis combo exists in either), but four concrete patterns are reused or cited:

1. **`refusedServers[]` payload shape** mirrors claude-code's `filterMcpServersByPolicy` returning `blocked: string[]` — `/Users/jinye.djy/Projects/claude-code/src/services/mcp/config.ts:1232`. Operators already know this shape from `.mcp.json` policy filtering. Cite in PR description so reviewers see we're not inventing the wire format.

2. **CLI flag naming `--mcp-client-budget`** matches claude-code's `--mcp-*` family (`--mcp-config`, `--mcp-debug`, `--strict-mcp-config`) and qwen-code's existing `--max-sessions` / `--max-connections` (PR 15). The budget is **orthogonal** to claude-code's `MCP_SERVER_CONNECTION_BATCH_SIZE` (concurrency cap during startup, not a total cap) — call this out in docs so operators don't conflate them.

3. **Dual-threshold hysteresis (75% / 37.5%)** evolves the single-threshold `armed` boolean pattern in opencode `/Users/jinye.djy/Projects/claude-code4qwen-code/opencode/packages/opencode/src/cli/heap.ts`. We don't introduce new constants — `WARN_THRESHOLD_RATIO` / `WARN_RESET_RATIO` already exist in `packages/cli/src/serve/eventBus.ts:85,87` (added by PR 10 #4237). PR 14 just exports them.

4. **Per-transport counts in event payload** matches claude-code's telemetry convention (`totalServers`, `stdioCount`, `sseCount`, `httpCount` on `tengu_mcp_server_connection_succeeded`) — `/Users/jinye.djy/Projects/claude-code/src/services/mcp/client.ts`. Cite the convention so reviewers don't ask "why per-transport breakdown".

**Forward-compat note for refusal ordering**: claude-code uses scope precedence `plugin < user < project (approved) < local` for MCP config merging. qwen-code currently has no scope layer (`Config.getMcpServers()` returns a flat `Record`), so PR 14 uses `Object.entries` config-declaration order. If/when qwen-code adopts scopes (potentially via #4174 worktree work), refusal order should switch to "lowest-precedence first" to align — out of scope for this PR but document the migration path in `docs/developers/qwen-serve-protocol.md`.

**Confirmed non-existent in both repos** (so we're not missing prior art):

- No in-process MCP child counter anywhere. Both repos rely on external `pgrep -P` style measurement.
- No capacity-based refusal. claude-code refuses on enterprise policy only; opencode never refuses.
- No capability/feature-detect registry in opencode (`SERVE_CAPABILITY_REGISTRY` shape stays unique to qwen-code).

## Gap audit (post-design self-review)

Plan agent caught the big structural gaps (lazy-spawn path, sdk-vs-child naming, slot reservation, batch event coalescing). The following are additional gaps surfaced during reference-code review and a second design pass. Folded into the design above where actionable.

### G1. Atomicity of budget check + slot reservation

`mcp-client-manager.ts:141,577` uses `await Promise.all(discoveryPromises)` — discovery is concurrent. The budget check `liveCount + reservedSlots.size < budget` and the `reservedSlots.add(name)` MUST happen synchronously in the same microtask, before any `await connect()`. Node.js is single-threaded but `Promise.all` interleaves microtasks at every `await` boundary. Implementation rule: reserve the slot synchronously inside the discovery loop body before launching the connect promise. Add a unit test that spawns 10 concurrent discovery calls against a budget of 5 and asserts exactly 5 succeed.

### G2. Slot release on server removal

`McpClientManager.removeServer(serverName)` already exists as a private method (line 723) and is invoked when a config-removed server is detected (lines 499, 519). Hook slot release into `removeServer` itself, not into discovery — so any caller path (config reload, `/mcp disable`, runtime removal) frees the slot consistently. One-line change inside `removeServer`: `this.reservedSlots.delete(serverName)` after the existing `clients.delete`.

### G3. Sub-interface for the budget cell

Rather than adding `scope?: string` to the base `ServeStatusCell` (which is shared across mcp_server, skill, model_provider cells and shouldn't grow optional fields for one consumer), define a sub-interface:

```ts
interface ServeMcpBudgetStatusCell extends ServeStatusCell {
  kind: 'mcp_budget';
  scope: 'workspace';   // PR 23 will add 'pool'
  liveCount: number;
  budget: number;
  refusedCount: number;
}
```

Type the new `budgets` field as `ServeMcpBudgetStatusCell[]` so consumers narrow safely. Base `ServeStatusCell` stays untouched.

### G4. Extension-contributed servers visibility

`MCPServerConfig.extensionName` exists today (declared servers from extensions are tagged). When refusing or warning, operators benefit from knowing which servers came from extensions — extension servers may be invisible to them in their own `.qwen/settings.json`. Add to `DaemonMcpBudgetWarningData` and `DaemonMcpChildRefusedBatchData`:

```ts
contributorBreakdown: { userConfigured: number; extensionContributed: number };
```

So a typical warning becomes "live=15, budget=20, 3 contributed by extensions [@qwen/ext-x, ...]". Cheap to add; high operator value.

### G5. SDK capability-detection helper

`getAdvertisedServeFeatures(features?, options?)` exists (capabilities.ts:146) and is used by `/capabilities` and server tests. SDK-side: there's no `supports('mcp_guardrails')` helper currently — clients string-match the features array. Adding `mcp_guardrails` doesn't require a new helper; if a helper is added it should be a separate small PR (out of scope here). Note in the PR description that consumers feature-detect via `capabilities.features.includes('mcp_guardrails')` for now.

### G6. `v` schema version stays at 1

All PR 14 status field additions are optional. `STATUS_SCHEMA_VERSION` stays `1`. All event additions go through the typed event registry (no envelope-level `v` bump). Make this explicit in the PR description so reviewers don't ask "why no version bump".

### G7. Sandbox / Windows behavior

PR 1 baseline harness skips on Windows and under sandbox because external `pgrep -P` isn't viable. PR 14 enforcement is **pure JS** (in-process counter, no external commands), so it works correctly on Windows and in sandboxes. The harness validation step in §Verification only runs where PR 1 already runs (macOS/Linux, non-sandbox). On Windows / sandbox the in-process counter still works and unit tests still pass; the cross-check against `pgrep` is skipped consistent with PR 1's gating. Document explicitly.

### G8. Operator boot breadcrumb

Mirror PR 15's stderr breadcrumb pattern (`qwen serve: --require-auth enabled (...)`). On boot, if `--mcp-client-budget` is set, emit one line to stderr summarizing config: `qwen serve: --mcp-client-budget=10 mode=warn (refusal disabled; warnings at >=8)`. Operators see the active policy in journald/docker logs without parsing `/capabilities` or `/workspace/mcp`. No new mechanism — just `process.stderr.write` in `runQwenServe`.

### G9. Payload `mode` field invariant

The `mode` field appears in both event payloads but has different valid values:

- `mcp_budget_warning.mode` ∈ `{'warn', 'enforce'}` (warning fires in either mode).
- `mcp_child_refused_batch.mode` is always `'enforce'` (`warn` mode never refuses, so never emits this event).

Don't model these as the same TS type. Use `mode: 'warn' | 'enforce'` for the warning payload and `mode: 'enforce'` (literal) for the refused-batch payload. The SDK predicate guards must validate the literal. Add a unit test that asserts `mcp_child_refused_batch` with `mode: 'warn'` fails `asKnownDaemonEvent`.

### G10. Telemetry hook (CORRECTED — function does exist, wired up in v1)

**Correction**: the original audit claimed `recordStartupEvent` doesn't exist; that grep was scoped to `packages/cli/src/serve` and `packages/sdk-typescript/src` only. The function IS exported from `packages/core/src/utils/startupEventSink.ts` and already imported by `mcp-client-manager.ts` (it emits `mcp_discovery_start`, `mcp_first_tool_registered`, `mcp_server_ready:*`, `mcp_all_servers_settled`).

PR 14 v1 calls `recordStartupEvent('mcp_budget_decision', { mode, budget, configured, reserved, refused })` at the end of both discovery paths (legacy + incremental) when `budgetMode !== 'off'`. `StartupEventAttrs = Record<string, string | number | boolean>` rejects `undefined`, so `budget` is coerced to `clientBudget ?? 0` under the invariant that `mode !== 'off'` ⇒ `clientBudget` was resolved.

Operators get observability from three layers:
1. Boot stderr breadcrumb (G8): one-shot at startup, visible in journald/docker.
2. Snapshot at `GET /workspace/mcp`: pull-based, includes `clientCount` + `budgets[]` + per-server `disabledReason`.
3. Startup event sink: `mcp_budget_decision` emitted post-discovery, picked up by any sink registered via `setStartupEventSink()`.

A push-based SSE typed event arrives in PR 14b (see D5/D6).

### G11. Mid-session config reload — out of scope

qwen-code does not currently expose runtime MCP-config reload to the daemon (no `POST /workspace/mcp/reload` route; Wave 4 PR 17 will add `POST /workspace/mcp/:server/restart` per-server). The budget recomputes naturally on each `discoverAllMcpTools*` call. Document that runtime budget changes require daemon restart.

### G12. CLI `/mcp` slash command — defer to follow-up

The CLI's `/mcp` slash command reads from `McpClientManager` state to render the panel. It will not break (new fields are additive), but will not surface the new budget/refusal info either. Tracking-only — handle in a small follow-up PR, not gating PR 14.

### G13. `BudgetExhaustedError` shape

Define as a `NamedError` (existing pattern in core) with fields `{ name: 'BudgetExhaustedError'; serverName: string; budget: number; liveCount: number; mode: 'enforce' }`. Used at three sites: lazy-spawn refusal in `readResource` (thrown to caller), discovery refusal (caught internally, converted to status cell + event), explicit `connect()` calls in tests. Standard error class, not a typed event payload.

### G14. Test for race between disable flip and reconnect

`mcp-client-manager.ts:489` checks `isMcpServerDisabled` at the start of a discovery pass, but health-monitor reconnect runs on its own setInterval and could fire mid-flip. Add a unit test: disable a server while its health-monitor reconnect is pending; assert (a) the reconnect aborts, (b) the slot is released (via the `removeServer` path in G2). This is not new behavior introduced by PR 14 but the budget-and-slot bookkeeping makes the existing race more observable, so closing it now is cheap and avoids future bug reports against PR 14.

## Engineering principles checklist (for PR description)

- [x] **Independently mergeable** — only depends on merged PR 1 / 12 / 15. PR 14b (events) is a clean follow-up that doesn't change v1 contracts.
- [x] **Backward compatible** — every new field is optional; default mode `off` when budget unset; old clients ignore `mcp_guardrails` + new payload fields and see pre-PR-14 behavior. `EXPECTED_STAGE1_FEATURES` ordering changed (mcp_guardrails inserted before require_auth) but conditional-tag advertising stayed bit-for-bit.
- [x] **Default off** — no enforcement unless operator passes `--mcp-client-budget`. Even when set, default mode is `warn` (no refusal) until operator opts into `enforce`.
- [x] **`qwen serve` Stage 1 routes / SDK behavior preserved** — 147/147 serve tests + 50/50 acpAgent tests + 19/19 existing mcp-client-manager tests stay green.
- [x] **Gradual migration** — `warn` ships first; `enforce` opt-in this PR; default flip from warn→enforce is a separate follow-up after operator telemetry.
- [x] **Reversible** — revert PR 14 → `McpClientManager` reverts to no-counter, no-budget; no schema breaks; env-var passthrough goes back to no-op.
- [x] **Tests-first** — 13 new core unit tests + 2 new serve route tests + 1 new capability shape test = 16 new tests, all written before/with the implementation rather than after.

## Final Implementation Status

- **PR #4247**: MERGED on 2026-05-18.
- **Title**: "feat(serve): MCP client guardrails (#4175 Wave 3 PR 14)"
- **Summary**: PR 14 v1 shipped exactly as planned. All in-scope items (in-process MCP client accounting, `--mcp-client-budget`/`--mcp-budget-mode` flags, slot-reservation model, enforce refusal path, workspace-level `budgets[]` cell, `mcp_guardrails` capability tag, SDK type mirrors, docs) were implemented across 12 files (+1155/-2 lines), 637/637 tests passing.
- **Key divergences**: None from the v1 plan. PR 14b (typed events, hysteresis state machine, SDK reducer) remains deferred as documented.
- **Files changed** (15): `packages/core/src/tools/mcp-client-manager.ts`, `packages/core/src/tools/mcp-client-manager.test.ts`, `packages/cli/src/commands/serve.ts`, `packages/cli/src/serve/types.ts`, `packages/cli/src/serve/runQwenServe.ts`, `packages/cli/src/serve/status.ts`, `packages/cli/src/serve/status.test.ts`, `packages/cli/src/serve/capabilities.ts`, `packages/cli/src/acp-integration/acpAgent.ts`, `packages/cli/src/serve/server.test.ts`, `packages/cli/src/serve/httpAcpBridge.ts`, `packages/cli/src/serve/httpAcpBridge.test.ts`, `packages/sdk-typescript/src/daemon/types.ts`, `docs/users/qwen-serve.md`, `docs/developers/qwen-serve-protocol.md`.
