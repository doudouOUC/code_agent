# Fix: Release Workflow Integration Test Failures

## Context

Release run [25992130532](https://github.com/QwenLM/qwen-code/actions/runs/25992130532) failed in both integration-test jobs (Docker + No-Sandbox). Root cause: two integration-test assertions drifted out of sync with merged source. Integration tests only run on `schedule` (nightly) or `workflow_dispatch` (release) per `.github/workflows/release.yml:4-9`, so PR CI didn't catch them at merge time.

Both failures are **stale test data**, not product-code bugs. The matching unit tests were updated in their merging PRs; the integration-test mirrors were missed.

Scope: **minimal red-to-green**. Pre-existing `ringSize: 4_000` snapshot staleness and missing `slow_client_warning` snapshot fields are out of scope (user-chosen).

## Failure 1 — capabilities envelope drift

**File**: `integration-tests/cli/qwen-serve-routes.test.ts:190-209`

The hardcoded `expect(caps.features).toEqual([...])` list has 18 entries. The registry in `packages/cli/src/serve/capabilities.ts:25-70` advertises 24 always-on features (excludes the conditional `require_auth`). Six missing entries, all from recent PRs:

- `slow_client_warning` — PR #4237, inserted between `session_events` and `typed_event_schema`
- `workspace_mcp`, `workspace_skills`, `workspace_providers`, `session_context`, `session_supported_commands` — PR #4241, inserted between `permission_vote` and `session_close`

**Canonical mirror**: `packages/cli/src/serve/server.test.ts:76-101` (`EXPECTED_STAGE1_FEATURES`) is already up-to-date with all 24 entries in correct order — copy from there.

**Why hardcode instead of importing `SERVE_FEATURES`**: this integration test is intentionally an **external wire-shape contract** that runs against a spawned daemon. Importing the constant would let registry typos silently propagate through the test, defeating the unit-vs-integration layered defense. The hand-maintained mirror pattern (with the existing "Order must match …" comment at line 187-189) is correct — the failure is workflow-gating, not test design.

### Edit

Replace lines 190-209 with the 24-entry list:

```ts
expect(caps.features).toEqual([
  'health',
  'capabilities',
  'session_create',
  'session_scope_override',
  'session_load',
  'unstable_session_resume',
  'session_list',
  'session_prompt',
  'session_cancel',
  'session_events',
  'slow_client_warning',
  'typed_event_schema',
  'session_set_model',
  'client_identity',
  'client_heartbeat',
  'session_permission_vote',
  'permission_vote',
  'workspace_mcp',
  'workspace_skills',
  'workspace_providers',
  'session_context',
  'session_supported_commands',
  'session_close',
  'session_metadata',
]);
```

The existing "Order must match" comment (lines 187-189) already names both canonical sources — leave it.

## Failure 2 — SSE backpressure unit-as-integration drift

**File**: `integration-tests/cli/qwen-serve-baseline.test.ts:467-501`

PR #4237 changed `EventBus` to force-push a synthetic `slow_client_warning` frame at the 75% queue-fill mark, BEFORE the `client_evicted` terminal frame on overflow. With `maxQueued: 2` and 3 published events, the actual sequence is now 4 frames (tick1, tick2, slow_client_warning, client_evicted), not 3. The unit-test mirror at `packages/cli/src/serve/eventBus.test.ts:103-122` was updated; this integration copy was missed.

`_daemon-harness.ts:502` keys on `client_evicted` as a terminal but tolerates prior frames (`received++` loop continues until eviction or `maxEvents`) — no harness fix needed.

### Edits

**Update assertions (lines 492-493)**:

```ts
// Before
expect(collected).toHaveLength(3);
expect(collected[2]!.type).toBe('client_evicted');

// After
expect(collected).toHaveLength(4);
expect(collected[2]!.type).toBe('slow_client_warning');
expect(collected[3]!.type).toBe('client_evicted');
```

**Update preceding comment (lines 480-484)** to reflect the new sequence — the current "3rd trips eviction → synthetic client_evicted terminal frame is appended" line omits `slow_client_warning`. Replace with language mirroring `eventBus.test.ts:105-109`:

```ts
// Publish 3 events into a 2-deep queue:
//   - event 2 fills the queue to 100% (above the 75% warn threshold),
//     so the bus force-pushes a `slow_client_warning` synthetic frame.
//   - event 3 trips the eviction path → terminal `client_evicted` frame.
// Resulting order: tick(1), tick(2), slow_client_warning, client_evicted.
```

## Critical Files

- `integration-tests/cli/qwen-serve-routes.test.ts` — edit lines 190-209
- `integration-tests/cli/qwen-serve-baseline.test.ts` — edit lines 480-493
- `packages/cli/src/serve/server.test.ts` (reference only — `EXPECTED_STAGE1_FEATURES` at lines 76-101 is the verified mirror to copy from)
- `packages/cli/src/serve/eventBus.test.ts` (reference only — the analogous assertion at lines 103-122 is the model for the baseline fix)
- `packages/cli/src/serve/capabilities.ts:25-70` (reference only — canonical registry order)

## Verification

From repo root, in order:

1. **Unit tests on the source-of-truth modules** (fast, catches drift before integration spin-up):
   ```
   npx vitest run packages/cli/src/serve/server.test.ts packages/cli/src/serve/eventBus.test.ts
   ```

2. **Build the bundled CLI** (`qwen-serve-routes.test.ts` spawns `node dist/index.js serve`; `globalSetup.ts` resolves `TEST_CLI_PATH` to `dist/cli.js`):
   ```
   npm run build && npm run bundle
   ```

3. **Targeted integration runs** (skip the full suite — both files have ~30s+ daemon-spawn boots):
   ```
   npx vitest run --root ./integration-tests cli/qwen-serve-routes.test.ts
   npx vitest run --root ./integration-tests cli/qwen-serve-baseline.test.ts
   ```
   `qwen-serve-baseline.test.ts` is POSIX-only and skipped under sandbox (`QWEN_SANDBOX` env). Confirm `process.platform !== 'win32'` and unset `QWEN_SANDBOX` locally.

4. **Optional — re-trigger the release dry-run** once the fix is on `main`:
   ```
   gh workflow run release.yml -f dry_run=true
   ```

## Out of Scope (Tracked, Not Fixed Here)

These were surfaced during exploration but excluded per the chosen minimal scope:

- `integration-tests/cli/qwen-serve-baseline.test.ts:495` reports `ringSize: 4_000` in the perf snapshot; `DEFAULT_RING_SIZE` in `packages/cli/src/serve/eventBus.ts:76` is `8000`. Pre-existing — PR #4237 changed the constant without updating the snapshot. The snapshot value doesn't drive any assertion, only `perf-baseline.md` rendering.
- `SnapshotShape.sseBackpressure` (lines 174-180) doesn't yet record the new `slow_client_warning` behavior bounds (`WARN_THRESHOLD_RATIO=0.75`, `WARN_RESET_RATIO=0.375` from `eventBus.ts:85-87`, once-per-episode invariant).

Worth a follow-up PR if perf-baseline accuracy matters; the release pipeline doesn't depend on it.

## Final Implementation Status

- **PR #4237**: MERGED on 2026-05-17. **PR #4241**: MERGED on 2026-05-17.
- **Summary**: This plan fixed integration test drift caused by PRs #4237 (slow_client_warning) and #4241 (read-only status routes). Both source PRs merged, and the integration test fixes described here were applied.
- **Key divergences**: None. The two edits (capabilities list update from 18 to 24 entries, and SSE backpressure assertion update from 3 to 4 frames with slow_client_warning) were straightforward corrections matching the plan exactly.
- **Files changed**: `integration-tests/cli/qwen-serve-routes.test.ts` (capabilities list), `integration-tests/cli/qwen-serve-baseline.test.ts` (backpressure assertions + comments).
