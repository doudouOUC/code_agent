# PR #4237 round-2 — fix Codex P2 findings

## Context

Codex's `/codex:review` pass on PR #4237 (Wave 2.5 PR 10: SSE replay + slow_client_warning) surfaced two real **P2** bugs that the bot-review pass missed:

1. **`BoundedAsyncQueue.forcedInBuf` position-invariant break** — `eventBus.ts:297`. My new `slow_client_warning` force-pushes a frame to the BACK of `buf` (mid-stream, queue NOT closed). The existing `next()` decrements `forcedInBuf` on every shift assuming forced frames live at the FRONT (subscribe-time replay). Trace:
   - `maxQueued=8`, queue holds 6 live items; publish 7th → push succeeds, queue=7 ≥ 6 (75 % threshold) → force-push warning → `buf=[a..g, warning]`, `forcedInBuf=1`, `warned=true`.
   - Consumer shifts `a` → `forcedInBuf-- = 0` (incorrect — `a` was live, not forced).
   - Consumer drains b..g → buf=`[warning]`, `forcedInBuf=0`, live count = 0 (correct value) vs `size getter` reports `max(0, 1 − 0) = 1` (wrong — that 1 is the forced warning).
   - Next publish: cap check `buf.length(1) − forcedInBuf(0) ≥ maxSize(8)` short-circuits live count to `1`, so live count drifts past truth. Over several refill cycles the off-by-one accumulates and the bus warns / evicts the client **before** there are actually `maxQueued` live items in queue. Premature eviction is the user-visible bug.
   - The existing code's doc comment EXPLICITLY notes case 2 (eviction-at-back) gets away with this only because the queue is closed immediately after; my new case 3 (warning-at-back, queue NOT closed) violates that escape hatch.

2. **SDK doesn't expose `?maxQueued`** — `DaemonClient.subscribeEvents` always fetches `/events` without a query string, and `SubscribeOptions` (sdk-typescript/src/daemon/DaemonClient.ts:137) only declares `lastEventId` + `signal`. The protocol doc + user doc both advertise `?maxQueued=N` as something SDK clients can request, so any typed-SDK consumer reads the docs, tries to use the knob, finds it isn't there, and is stuck on the default 256 cap unless they bypass the SDK and hand-craft the URL.

Both findings are valid. This round closes them cleanly.

## Approach

### 1️⃣ `BoundedAsyncQueue`: per-entry `{value, forced}` tagging (kills the position invariant)

File: `packages/cli/src/serve/eventBus.ts`

- Change internal `buf: T[]` → `buf: Array<{ value: T; forced: boolean }>`. Self-contained class refactor; the type is private to the file.
- Replace `forcedInBuf` counter with a `liveCount: number` field maintained directly:
  - `push(value)`: cap check uses `liveCount >= maxSize`; on accept, append `{value, forced: false}` and `liveCount++`.
  - `forcePush(value)`: append `{value, forced: true}`; `liveCount` unchanged.
  - `next()`: shift entry, return `entry.value`; if `!entry.forced` then `liveCount--`. Symmetric to push.
  - `size` getter: returns `liveCount` directly (no `max(0, ...)` guard needed because the count is always accurate now).
- Delete the long "Position invariant: case 1 / case 2" doc comment that's been load-bearing — the new shape removes the invariant entirely. Replace with a one-paragraph note explaining the tag and why it matters (cap correctness in the presence of mid-stream `forcePush` from the warning path).
- All call sites of `forcePush` (replay path at subscribe time + `client_evicted` + `slow_client_warning`) stay unchanged. Behavior is observable-equivalent for the two legacy callers and CORRECT for the new caller.

Existing tests that pass after this refactor:
- `force-pushes replay events past maxQueued so Last-Event-ID is honored`
- `a live publish AFTER a large replay does NOT evict the resumed subscriber`
- `drops live publishes only after the LIVE backlog (excluding replay) hits maxQueued`
- All `slow_client_warning` tests

New test to add:
- `slow_client_warning push at queue back doesn't skew live count for subsequent publishes` — exercises the exact bug Codex described: warn, drain past warning, refill, assert the live cap is still correct (no premature warn / eviction).

### 2️⃣ SDK: `?maxQueued` on `SubscribeOptions` + URL query plumbing

Files:
- `packages/sdk-typescript/src/daemon/DaemonClient.ts` (`SubscribeOptions`, `subscribeEvents`)
- `packages/sdk-typescript/src/daemon/DaemonSessionClient.ts` (auto-inherits via `extends SubscribeOptions`, but doc-comment update is appropriate)

Steps:
- `SubscribeOptions` gains optional `maxQueued?: number`. JSDoc references the daemon-side range `[16, 2048]` and notes "old daemons silently ignore; pre-flight `caps.features.slow_client_warning`".
- `DaemonClient.subscribeEvents`: when `opts.maxQueued !== undefined`, append `?maxQueued=<n>` to the fetch URL. Use `URL` or simple string concat — there are no other query params today so concatenation is fine. Don't validate range client-side: server is the source of truth (returns `400 invalid_max_queued` with structured body) and any client validation here would duplicate-without-trust the server logic. Forward whatever the caller passes.
- `DaemonSessionClient`: no code change required — `DaemonSessionSubscribeOptions extends SubscribeOptions` so the new field flows through automatically. Spot-check the subscribe call at `DaemonSessionClient.ts:275` to confirm it spreads `subscribeOpts`.
- Re-export check: `SubscribeOptions` is already exported from `packages/sdk-typescript/src/daemon/index.ts` and `packages/sdk-typescript/src/index.ts`; no new exports needed.

New tests in `packages/sdk-typescript/test/unit/DaemonClient.test.ts`:
- `subscribeEvents appends ?maxQueued when set`.
- `subscribeEvents omits the query string when maxQueued is undefined` (existing behavior preserved).
- `subscribeEvents propagates a server 400 invalid_max_queued unchanged` (assert error class is `DaemonHttpError` with status 400).

### 3️⃣ Documentation reconcile

- `docs/developers/qwen-serve-protocol.md` `slow_client_warning` paragraph already documents the wire shape; no change needed.
- `docs/users/qwen-serve.md` already says SDK can use `?maxQueued`; the SDK now actually exposes it, so the docs become accurate without text changes.
- Update the eventBus.ts doc comment on `BoundedAsyncQueue` to reflect the new tag shape.

## Files Touched

| File | Change |
|---|---|
| `packages/cli/src/serve/eventBus.ts` | `BoundedAsyncQueue.buf` retag; `liveCount` replaces `forcedInBuf`; `size` getter simplified; doc comments updated |
| `packages/cli/src/serve/eventBus.test.ts` | 1 new test for warn-at-back + live cap correctness; existing tests stay (and pass) |
| `packages/sdk-typescript/src/daemon/DaemonClient.ts` | `SubscribeOptions.maxQueued?`; URL composition in `subscribeEvents` |
| `packages/sdk-typescript/test/unit/DaemonClient.test.ts` | 2 new tests (with-param URL + omit when undefined) |

## Out of Scope

- The two **Rejected** items I documented in the prior PR comment (#H2 backtick-escape misread; #M2 SDK type-signature removal) — codex didn't surface them again, no need to revisit.
- `WARN_THRESHOLD_RATIO` / `WARN_RESET_RATIO` rename — bikeshed.
- Refactoring the SSE `EventBus` into a top-level package (the existing FIXME comment) — out of scope.

## Verification

1. Type-check (focused):
   ```bash
   npx tsc --noEmit -p packages/cli/tsconfig.json
   (cd packages/sdk-typescript && npm run typecheck)
   ```

2. Focused tests:
   ```bash
   npx vitest run packages/cli/src/serve/eventBus.test.ts \
                  packages/cli/src/serve/httpAcpBridge.test.ts \
                  packages/sdk-typescript/test/unit/DaemonClient.test.ts \
                  packages/sdk-typescript/test/unit/DaemonSessionClient.test.ts \
                  packages/sdk-typescript/test/unit/daemonEvents.test.ts
   (cd packages/cli && npx vitest run src/serve/server.test.ts)
   ```
   Expected: all green; the new eventBus regression case proves the position-invariant fix; the new SDK tests prove `?maxQueued` is now on the wire.

3. Bug 1 regression smoke (manual):
   ```text
   maxQueued=8 EventBus, fill 6 live, force a warning (queue=7+warning),
   drain 7 (including the warning), publish 8 more → no premature
   slow_client_warning or client_evicted before live count hits 8.
   ```
   Captured in the new automated test.

4. Bug 2 wire check (manual):
   - `DaemonClient.subscribeEvents('sid', { maxQueued: 512 })` → fetch URL ends `…/events?maxQueued=512`.
   - `DaemonSessionClient.subscribeEvents({ maxQueued: 512 })` → same URL (auto-inherits via `DaemonSessionSubscribeOptions extends SubscribeOptions`).

## Commit shape

Single commit `fix(serve): correct queue tagging + plumb maxQueued through SDK` stacked on top of the existing PR #4237 branch (`feat/sse-replay-slow-client-warnings`). Push to the same PR.

## Final Implementation Status

- **PR status**: #4237 MERGED on 2026-05-17.
- **What was implemented**: Both P2 fixes — (1) BoundedAsyncQueue position-invariant bug fixed via per-entry `{value, forced}` tagging replacing the broken `forcedInBuf` counter, and (2) SDK `?maxQueued` exposed on `SubscribeOptions` with URL query plumbing in `DaemonClient.subscribeEvents`.
- **Key divergences**: Implementation closely followed the plan. The diff shows all planned files were touched: `eventBus.ts/.test.ts`, `httpAcpBridge.test.ts`, `server.ts/.test.ts`, `DaemonClient.ts`, `events.ts`, plus docs and types. Additional changes to `commands/serve.ts`, `runQwenServe.ts`, and `capabilities.ts` suggest the SSE replay feature and slow_client_warning were landed together in this PR (the plan was a fix stacked on top).
- **Files actually changed**: 25 files across `packages/cli/src/serve/`, `packages/sdk-typescript/`, and `docs/`.
