# Plan: Consolidate AbortController/AbortSignal handling

## Context

A user observed in a long interactive session:

```
MaxListenersExceededWarning: 1509 abort listeners added to [AbortSignal].
MaxListeners is 1500.
```

### Root cause

qwen-code has nested AbortController propagation across the agent runtime:

```
masterAbortController (session, agent-interactive.ts:60)
  └─ roundAbortController (per user message, agent-interactive.ts:153)
       └─ inner roundAbortController (per model API call, agent-core.ts:591)
            └─ tool execution signals (per call)
```

Each layer registers `signal.addEventListener('abort', ...)` on its **parent** signal. In several spots:
- listeners are added without `{ once: true }` (e.g. `agent-core.ts:593`, `agent-interactive.ts:157`)
- short-lived children never `removeEventListener` themselves from long-lived parents when they get GC'd
- there is no central factory enforcing a per-signal listener cap

Over hundreds of model rounds, the parent `AbortSignal` accumulates dead listeners and trips Node's leak warning.

A local band-aid already exists at `packages/core/src/core/openaiContentGenerator/pipeline.ts:35-37`, where `raiseAbortListenerCap()` calls `setMaxListeners(0, signal)` on per-request OpenAI signals only. It does not cover the agent layer where the real accumulation happens.

### Reference design — claude-code

`/Users/jinye.djy/Projects/claude-code/src/utils/abortController.ts` solves this with:

1. `createAbortController(maxListeners = 50)` — a factory that calls `setMaxListeners(50, controller.signal)` immediately.
2. `createChildAbortController(parent)` — parent→child propagation with:
   - `WeakRef` on both parent and child so the parent does not strongly retain abandoned children
   - `{ once: true }` on the parent's abort listener
   - **Reverse cleanup**: when the child aborts (from any cause), it actively `removeEventListener` on the parent. This is the key insight — short-lived children stop accumulating dead listeners on long-lived parents.

Plus `/Users/jinye.djy/Projects/claude-code/src/utils/warningHandler.ts` installs a `process.on('warning')` filter that suppresses `MaxListenersExceededWarning.*(AbortSignal|EventTarget)` for end users while keeping it visible in debug builds.

### Intended outcome

- A single new helper module that becomes the **only** way to create AbortControllers in production code.
- All 24 existing `new AbortController()` call sites migrated, so listener accumulation is structurally prevented.
- A warning handler that hides this specific warning from end users (debug mode keeps it visible as a canary).
- The `pipeline.ts` band-aid is removed; the existing `combinedAbortSignal.ts` stays as a `@deprecated` shim so we don't churn external imports in this PR.

---

## Implementation

### New files

#### `packages/core/src/utils/abortController.ts`

API:

```ts
export function createAbortController(maxListeners?: number): AbortController;

export function createChildAbortController(
  parent: AbortController | AbortSignal | undefined,
  maxListeners?: number,
): AbortController;

export function combineAbortSignals(
  signals: ReadonlyArray<AbortSignal | undefined>,
  options?: { timeoutMs?: number; maxListeners?: number },
): { signal: AbortSignal; cleanup: () => void };
```

Design notes:

- Default `maxListeners = 50` (matches claude-code).
- `createChildAbortController` accepts `AbortController | AbortSignal | undefined`. Many call sites only have an optional `signal: AbortSignal | undefined` (e.g. tool execution boundaries) — accepting all three shapes lets one helper cover every existing pattern. Undefined parent returns a plain controller.
- Internally mirrors claude-code: `WeakRef` on both sides, `{ once: true }` on parent listener, reverse cleanup via a second `{ once: true }` listener on the child that calls `parent.signal.removeEventListener`. Use module-scope `propagateAbort` and `removeAbortHandler` functions bound with `WeakRef.bind` to avoid per-call closure allocation.
- Fast path: already-aborted parent → child aborts synchronously with `parent.signal.reason`, no listener setup.
- `combineAbortSignals` generalizes `createCombinedAbortSignal` to N inputs + optional timeout, returning a child controller that auto-cleans listeners when any source fires.

#### `packages/core/src/utils/abortController.test.ts`

Unit tests (Vitest, co-located per repo convention):

1. `createAbortController` sets max listeners — assert via `events.getMaxListeners(signal)`.
2. Child aborts when parent aborts (sync + async).
3. Aborting child does NOT abort parent.
4. Already-aborted parent → child aborts synchronously with parent's reason.
5. **Reverse cleanup**: after child aborts, `events.getEventListeners(parent.signal, 'abort').length === 0`.
6. **GC safety**: drop strong child ref, force `gc()` under `--expose-gc`, verify `WeakRef.deref()` is undefined and aborting parent is a no-op.
7. `combineAbortSignals`: N signals, timeout fires, undefined-tolerant, cleanup is idempotent.
8. `createChildAbortController(undefined)` returns a plain controller.

#### `packages/cli/src/utils/warningHandler.ts`

API:

```ts
export function initializeWarningHandler(): void;
```

Behavior:

- Idempotent (early return if already installed).
- In production: `process.removeAllListeners('warning')`, then install a handler that swallows warnings matching `/MaxListenersExceededWarning.*AbortSignal/` and `/MaxListenersExceededWarning.*EventTarget/`. All other warnings still print.
- In debug mode (`process.env.DEBUG` truthy, or `NODE_ENV=development`): keep all warnings visible.
- Strip the analytics/Statsig integration from claude-code's version — qwen-code has no equivalent infra.

#### `packages/cli/src/utils/warningHandler.test.ts`

- Installer is idempotent.
- Matching `MaxListenersExceededWarning` is suppressed.
- Unrelated warnings still emit.
- Debug mode keeps both visible.

### Modified files

#### `packages/cli/src/gemini.tsx:151`

Add `initializeWarningHandler()` call next to `setupUnhandledRejectionHandler()`. Call it from the same place that wires up `setupUnhandledRejectionHandler` so both interactive and non-interactive paths get it.

#### `packages/core/src/hooks/combinedAbortSignal.ts`

Rewrite as a thin `@deprecated` wrapper:

```ts
/** @deprecated Use combineAbortSignals from utils/abortController.ts */
export function createCombinedAbortSignal(
  externalSignal?: AbortSignal,
  options?: { timeoutMs?: number },
) {
  return combineAbortSignals([externalSignal], { timeoutMs: options?.timeoutMs });
}
```

`httpHookRunner.ts:202` keeps its existing import — no consumer change in this PR.

#### `packages/core/src/core/openaiContentGenerator/pipeline.ts:35-37`

Remove `raiseAbortListenerCap` and its three call sites. The new per-round child controllers created via `createChildAbortController` already carry `maxListeners = 50`, which covers the OpenAI SDK's retry + wrapper listener pattern. Keep the explanatory comment near the call site documenting why per-request signals see multiple listeners.

#### High-priority migrations (long-lived signals — most warning impact)

| File:line | Current | After |
|---|---|---|
| `agents/runtime/agent-interactive.ts:60` | `new AbortController()` | `createAbortController()` |
| `agents/runtime/agent-interactive.ts:153` + `:156-159` | `new AbortController()` + manual listener | `createChildAbortController(this.masterAbortController)` — delete the manual propagation block |
| `agents/runtime/agent-core.ts:591-596` | `new AbortController()` + manual listener | `createChildAbortController(abortController)` |
| `agents/runtime/agent-core.ts:941-946` | `new AbortController()` + manual listener | `createChildAbortController(abortController)` |
| `agents/runtime/agent-core.ts:1322` | manual listener (with explicit finally cleanup) | Keep finally cleanup; switch the controller it operates on to a child via the helper. The explicit `removeEventListener` is still correct and reads clearer. |
| `agents/runtime/agent-headless.ts:229-238` | `new AbortController()` + manual external-signal listener | `createChildAbortController(externalSignal)` |
| `agents/arena/ArenaManager.ts:305, :817` | `new AbortController()` | `createAbortController()` / `createChildAbortController()` as appropriate |
| `agents/background-agent-resume.ts:410, :482, :902` | `new AbortController()` | `createAbortController()` / `createChildAbortController()` |

#### Medium migrations (per-tool / per-hook)

| File:line | Notes |
|---|---|
| `tools/agent/agent.ts:1231 (bgAbortController), :1586 (fgAbortController)` + listeners `:132, :1591` | Use `createChildAbortController(signal)` to absorb the manual propagation |
| `tools/shell.ts:1452, :2137, :2344` + listeners `:1549, :2196` | Migrate; preserve existing finally cleanup |
| `tools/monitor.ts:303` + listener `:462` | Migrate |
| `core/coreToolScheduler.ts:1062` | Wrap with `createChildAbortController` for the queued-request path |
| `confirmation-bus/message-bus.ts:123` | Migrate; add `{ once: true }` (currently missing) |
| `hooks/hookRunner.ts:596` and `hooks/functionHookRunner.ts:237` | Migrate; add `{ once: true }` (currently missing) |
| `services/shellExecutionService.ts:778, :1376` | Migrate |
| `agents/background-tasks.ts:577` | Migrate |

#### Low-priority migrations (per-request, short-lived — consistency only)

| File:line | Notes |
|---|---|
| `followup/speculation.ts:99` + listener `:119` | Migrate |
| `utils/fetch.ts:64` | `createAbortController()` |
| `core/client.ts:973` (recallAbortController) | `createAbortController()` |
| `memory/manager.ts:936` | `createAbortController()` |
| `services/chatRecordingService.ts:938` | `createAbortController()` |
| `services/chatCompressionService.ts:378` | `createAbortController()` |

### Commit structure inside the PR

For reviewability:

1. Add helpers + tests (`abortController.ts`, `warningHandler.ts`, two test files). Wire warning handler into `gemini.tsx`.
2. High-priority migrations + `pipeline.ts` band-aid removal.
3. Medium migrations.
4. Low-priority migrations + `combinedAbortSignal.ts` deprecation shim.

### Files to read before implementing

- `/Users/jinye.djy/Projects/claude-code/src/utils/abortController.ts` (reference implementation)
- `/Users/jinye.djy/Projects/claude-code/src/utils/warningHandler.ts` (reference, strip analytics)
- `packages/core/src/utils/retry.ts` (utility file convention)
- `packages/core/src/hooks/combinedAbortSignal.ts` (existing pattern + caller)
- `packages/core/src/agents/runtime/agent-core.ts:556-980` (most complex migration site — multiple controllers in one method)
- `packages/cli/src/gemini.tsx:140-220` (entrypoint where warning handler installs)

---

## Risks and tradeoffs

- **WeakRef + parent-only-via-child-ref**: if a parent controller is held ONLY through the child's WeakRef, it can be GC'd before abort fires. In practice every parent in the high-priority list is held strongly by `this.masterAbortController` or function-scoped locals that outlive the child. Document this invariant in the helper's JSDoc.
- **`maxListeners = 50` vs `pipeline.ts`'s `0`**: the band-aid used "unlimited". After removal, a per-round signal in extreme OpenAI retry scenarios (6 retries × ~10 wrappers) could approach 50. The warning handler in Phase 1 suppresses any remaining hit anyway; if telemetry shows real recurrences, bump the per-call-site cap.
- **`{ once: true }` enforcement**: `agent-core.ts:593`, `agent-interactive.ts:157`, `hookRunner.ts:596`, `functionHookRunner.ts:237`, `message-bus.ts:123` currently lack `{ once: true }`. The helper enforces it. Safe — `abort` is terminal, listeners can't legitimately fire twice.
- **Node version**: `setMaxListeners(n, EventTarget)` requires Node ≥15.4, `WeakRef` requires ≥14.6. qwen-code requires Node ≥20 — both fine.

---

## Process gates (must complete before opening PR)

1. **Self review × 3** — after implementation, do three independent passes:
   - Pass A: correctness — every migrated call site preserves the original abort semantics (especially finally cleanup blocks, `{ once: true }` adoption, parent-aborted-fast-path).
   - Pass B: API consistency — every `new AbortController()` in `packages/core/src/**` (non-test) goes through the helper. Grep verification: `grep -rn "new AbortController" packages/core/src --include="*.ts" | grep -v test | grep -v abortController.ts` must return empty.
   - Pass C: test coverage — read each new test and the migrated files side by side; assert the test exercises the actual production code path used.
2. **`codex:review` × 2** — invoke the codex review agent twice with a fresh perspective each time; address all comments before moving on.
3. **Full tmux verification** — see scenarios below. Keep all scripts and a transcript file so the PR body can reference them.
4. **Open PR** only after gates 1-3 are clean.

## Verification

### Automated

- `pnpm --filter @qwen-code/qwen-code-core test` — new `abortController.test.ts` covers helper semantics, reverse cleanup, GC safety.
- `pnpm --filter @qwen-code/qwen-code-cli test` — new `warningHandler.test.ts` covers installer idempotency and filter logic.
- Full repo test suite must remain green — existing abort semantics around tool cancellation, hook cancellation, and arena routing are exercised by existing tests.
- Type check: `pnpm run typecheck`.

### Manual (tmux session — keep transcripts)

Run each scenario in a named tmux pane, capture the full transcript via `tmux pipe-pane -o 'cat >> ~/qwen-verify-<scenario>.log'`. Store the verification scripts under `docs/verification/abort-controller-refactor/` for the PR body to reference.

Scenario matrix — for each, document: input prompt, expected user-visible output, expected log/process state.

1. **Baseline reproduction (must do before applying the fix on a separate branch)**
   - Input: long interactive session, ~50 mixed-tool rounds.
   - Expected (pre-fix): `MaxListenersExceededWarning: ... 1500+ abort listeners` printed.
   - Save as: `00-baseline-reproduction.log`.

2. **Long-session warning gone (debug mode)**
   - Setup: `NODE_OPTIONS=--trace-warnings DEBUG=1 qwen`.
   - Input: same 50-round script as scenario 1.
   - Expected: no `MaxListenersExceededWarning` printed; other warnings (if any) still printed.
   - Save as: `01-long-session-debug.log`.

3. **Long-session warning suppressed for end user (production mode)**
   - Setup: `qwen` with no debug env.
   - Input: same 50-round script.
   - Expected: clean output; temporary `console.error` probe inside the warning handler (added then removed) confirms the filter actually fires.
   - Save as: `02-long-session-prod.log`.

4. **Ctrl-C mid-stream abort**
   - Input: start a long generation, press Ctrl-C while model is streaming.
   - Expected: stream stops within ~200ms; "Cancelled" banner; next prompt accepts input; no orphaned listeners (`process._getActiveHandles()` count returns to baseline).
   - Save as: `03-ctrlc-streaming.log`.

5. **Cancel long-running shell tool**
   - Input: run `shell` with `sleep 60`, cancel mid-execution.
   - Expected: child process killed (`ps` confirms), tool result shows cancellation, agent continues to accept next input.
   - Save as: `04-shell-cancel.log`.

6. **Subagent cancellation propagation**
   - Input: spawn an `agent` subagent doing a long task, cancel from parent.
   - Expected: subagent's in-flight tool calls abort, subagent's model stream stops, parent receives cancellation event.
   - Save as: `05-subagent-cancel.log`.

7. **Headless mode abort (`qwen --prompt` / non-interactive)**
   - Input: non-interactive invocation with `SIGINT` from outside.
   - Expected: clean shutdown, exit code 130, no warnings.
   - Save as: `06-headless-abort.log`.

8. **Background agent flow**
   - Input: spawn a background agent (`run_in_background: true`), let it complete, spawn another, cancel the second mid-flight.
   - Expected: first agent completes normally; second aborts cleanly; no listener leak across the two.
   - Save as: `07-background-agent.log`.

9. **Memory baseline**
   - Setup: run `qwen` with `--inspect`; attach Chrome devtools.
   - Input: 100-round session.
   - Expected: capture heap snapshots at round 0, 50, 100; `AbortSignal` instance count and per-signal listener count stable (no monotonic growth).
   - Save as: `08-memory-snapshots/` (snapshot files).

10. **Existing combinedAbortSignal consumer (`httpHookRunner.ts:202`)**
    - Input: trigger an HTTP hook with an external signal + a timeout; cancel external; let timeout fire on a separate run.
    - Expected: hook aborts cleanly in both cases; deprecation shim works.
    - Save as: `09-http-hook-shim.log`.

### Artifacts for PR body

After all scenarios pass, the PR description must include:
- Link/embed of the 10 transcript files
- Heap snapshot deltas (round 0 vs 100)
- Output of `grep -rn "new AbortController" packages/core/src --include="*.ts" | grep -v test | grep -v abortController.ts` proving migration completeness
- Diff summary (LOC added/removed) matching the table below

---

## Estimated diff size

| Category | Files | LOC added | LOC removed |
|---|---|---|---|
| New helpers + tests | 4 | ~400 | 0 |
| `gemini.tsx` hookup | 1 | ~3 | 0 |
| High-priority migrations | 5 | ~30 | ~60 |
| Medium migrations | 11 | ~50 | ~120 |
| Low-priority migrations | 6 | ~20 | ~50 |
| `combinedAbortSignal.ts` shim | 1 | ~10 | ~40 |
| `pipeline.ts` band-aid removal | 1 | ~2 | ~20 |
| **Total** | **~29** | **~515** | **~290** |

Net **+225 LOC**, dominated by tests and JSDoc — production code shrinks slightly.
