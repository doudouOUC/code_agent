# Phase 2 Telemetry Spans — `tool.blocked_on_user` + `hook`

## Context

Parent issue **#3731** (telemetry hardening), Phase 2 of the hierarchical tracing plan.
Phase 1 (#4126) and Phase 1.5 (#4302) merged; trace tree currently has `interaction → tool (post-approval) → tool.execution` but is missing two important phases:

1. **Approval wait** — when a tool is in `awaiting_approval` waiting on the user, that time is invisible in traces.
2. **Hook execution** — pre/post hooks run inside tool span scope but get no dedicated span, so a slow hook can't be told from a slow tool.

Outcome: a single PR that adds both span types and (for blocked_on_user) extends tool span to cover the full lifecycle (validating + awaiting_approval + executing).

## User-confirmed decisions

| | Choice | Rationale |
|---|---|---|
| Parent strategy | **Align with claude-code** — move tool span start from `executeSingleToolCall` to `_schedule`; blocked_on_user is child of tool span | Trace tree matches claude-code; visual nesting of wait/exec under one tool |
| ModifyWithEditor | **One blocked_on_user span across the entire awaiting period** | Simplest semantics; `duration_ms` = total user think-time including editor side-trip |
| Hook span scope | **Tool-related hooks only** (5 fire sites) | Skip `fireNotificationHook` — fire-and-forget, low-value |

## Files to modify

| File | Change |
|---|---|
| `packages/core/src/telemetry/constants.ts` | Add `SPAN_TOOL_BLOCKED_ON_USER`, `SPAN_HOOK` |
| `packages/core/src/telemetry/session-tracing.ts` | Add 4 helpers (start/end × 2 spans) |
| `packages/core/src/telemetry/session-tracing.test.ts` | New tests for both span types + concurrency regression |
| `packages/core/src/core/coreToolScheduler.ts` | Move tool span lifecycle; wire blocked_on_user; wrap 5 hook fire sites |
| `packages/core/src/core/coreToolScheduler.test.ts` | Update mock + extend existing tests + new lifecycle tests |

Only one mock site to update (`grep -rn "vi\.mock.*session-tracing" packages/` returns only `coreToolScheduler.test.ts:131`).

## A. New span helpers (session-tracing.ts)

### A.1 Constants
```ts
SPAN_TOOL_BLOCKED_ON_USER = 'qwen-code.tool.blocked_on_user';
SPAN_HOOK                 = 'qwen-code.hook';
```

`SpanContext['type']` already includes both as forward-declarations — no type change needed.

### A.2 `startToolBlockedOnUserSpan` — accepts explicit parent

Rationale: awaiting_approval phase happens BEFORE `runInToolSpanContext`, so `toolContext` ALS is empty. Forcing the caller to pass the tool span both fixes that AND avoids the `findLast`-by-type concurrency bug claude-code has.

```ts
export function startToolBlockedOnUserSpan(
  toolSpan: Span,
  attrs?: { tool_name?: string; call_id?: string },
): Span;

export function endToolBlockedOnUserSpan(
  span: Span,
  metadata?: {
    decision?: 'proceed_once' | 'proceed_always' | 'cancel' | 'aborted' | 'auto_approved';
    source?: 'cli' | 'ide' | 'hook' | 'auto' | 'system';
  },
): void;
```

Implementation pattern: mirror `startToolExecutionSpan`. Look up `toolSpan` in `activeSpans` for parent context; if absent (defensive — span was already ended), fall back to `resolveParentContext(undefined)`. Status stays UNSET on end (waiting is neither OK nor ERROR).

`decision` taxonomy collapses `ProceedAlways` / `ProceedAlwaysProject` / `ProceedAlwaysUser` to a single `'proceed_always'` — backends rarely care about scope-persistence granularity here. Keep `proceed_once` distinct since it's a different user intent.

### A.3 `startHookSpan` — uses ALS-resolved parent

Hook fires inside `runInToolSpanContext`, so `toolContext.getStore()` is set. Use the existing `resolveParentContext(toolContext.getStore() ?? interactionContext.getStore())` flow.

```ts
export function startHookSpan(args: {
  hookEvent: 'PreToolUse' | 'PostToolUse' | 'PostToolUseFailure';
  toolName: string;
  toolUseId?: string;
  isInterrupt?: boolean;     // PostToolUseFailure variant indicator
}): Span;

export function endHookSpan(
  span: Span,
  metadata?: {
    success?: boolean;             // hook completed without throwing
    shouldProceed?: boolean;       // PreToolUse only
    shouldStop?: boolean;          // PostToolUse only
    blockType?: 'denied' | 'ask' | 'stop';
    hasAdditionalContext?: boolean;
    error?: string;                // hook threw
  },
): void;
```

Status: UNSET unless `error` set (then ERROR). `shouldProceed:false` / `shouldStop:true` are NOT errors — hooks intentionally blocking is normal flow.

### A.4 Concurrency safety

All four helpers store the actual `Span` ref via `getSpanId(span)` lookup in `activeSpans`/`strongSpans`. **No `findLast`-by-type lookups anywhere** — this is the explicit divergence from claude-code's known bug.

Re-export from `packages/core/src/telemetry/index.ts`.

## B. Tool span lifecycle move (coreToolScheduler.ts)

### B.1 Storage
Add to `CoreToolScheduler`:
```ts
private toolSpans = new Map<string, Span>();
private blockedSpans = new Map<string, Span>();
```

Map keyed by `callId` decouples telemetry from ToolCall identity (which is rebuilt by `setStatusInternal` on every status change).

### B.2 Tool span START
Move from `executeSingleToolCall:1876` to `_schedule:1288` for-loop body:
```ts
for (const toolCall of newToolCalls) {
  if (toolCall.status !== 'validating') continue;       // skip pre-built error states
  const { request: reqInfo, invocation } = toolCall;
  const canonicalName = canonicalToolName(reqInfo.name);

  // NEW: start tool span for the full lifecycle
  const toolSpan = startToolSpan(canonicalName, {
    tool_name: canonicalName,
    call_id: reqInfo.callId,
  });
  this.toolSpans.set(reqInfo.callId, toolSpan);

  try {
    // ... existing flow (signal.aborted check, permission flow, etc.)
  }
}
```

### B.3 Tool span END — every terminal path

Centralize in a private helper:
```ts
private finalizeToolSpan(
  callId: string,
  metadata: ToolSpanMetadata,
): void {
  const span = this.toolSpans.get(callId);
  if (!span) return;
  this.toolSpans.delete(callId);
  endToolSpan(span, metadata);
}
```

End sites (current line numbers; verify before editing):

| Line | Trigger | metadata |
|---|---|---|
| 1300 | `signal.aborted` at start of for-loop | `setToolSpanCancelled(span)` then `finalizeToolSpan(callId)` (no metadata, preserves cancelled status) |
| 1338 | `finalPermission === 'deny'` | `{ success: false, error: 'execution_denied' }` |
| 1381 | Plan-mode block | `{ success: false, error: 'plan_mode_blocked' }` |
| 1477 | Permission hook deny | `{ success: false, error: 'execution_denied' }` |
| 1498 | Background-agent deny | `{ success: false, error: 'execution_denied' }` |
| 1575 | Catch in for-loop | `{ success: false, error: 'unhandled_exception' }` (or use the structured errorType) |
| 1636 | `handleConfirmationResponse` cancel | `setToolSpanCancelled(span)` then finalize |
| 1885 | `executeSingleToolCall` finally | finalize (status pre-set inside `_executeToolCallBody`) |

For path 1885: replace the current `endToolSpan(toolSpan)` with `finalizeToolSpan(callId, /* no metadata */)` and rewire the start: `executeSingleToolCall` now reads from `this.toolSpans.get(callId)` instead of calling `startToolSpan`. Defensive fallback: if Map miss (shouldn't happen given B.2), create one inline so the success path never silently loses telemetry.

### B.4 Backward-compat — paths that bypass `_schedule`

Verified: every `executeSingleToolCall` invocation comes from `attemptExecutionOfScheduledCalls`, which is only called from `_schedule:1586` and `handleConfirmationResponse:1691`. Tool spans created in `_schedule` survive across:
- The `awaiting_approval → scheduled` transition in `handleConfirmationResponse`.
- The `awaiting_approval → scheduled` transition in `autoApproveCompatiblePendingTools:2496` (sister tool auto-approves another's pending call). The span was created during the original `_schedule` pass and is reused.

No new tool span creation in `autoApproveCompatiblePendingTools` — only blocked span finalization (see C).

## C. blocked_on_user lifecycle

### C.1 START
In `_schedule`, immediately after `setStatusInternal('awaiting_approval', ...)` at line 1536-1540:
```ts
this.setStatusInternal(reqInfo.callId, 'awaiting_approval', wrappedConfirmationDetails);
const toolSpan = this.toolSpans.get(reqInfo.callId);
if (toolSpan) {
  const blockedSpan = startToolBlockedOnUserSpan(toolSpan, {
    tool_name: canonicalName,
    call_id: reqInfo.callId,
  });
  this.blockedSpans.set(reqInfo.callId, blockedSpan);
}
```

### C.2 END

Helper:
```ts
private finalizeBlockedSpan(
  callId: string,
  decision: NonNullable<Parameters<typeof endToolBlockedOnUserSpan>[1]>['decision'],
  source: NonNullable<Parameters<typeof endToolBlockedOnUserSpan>[1]>['source'],
): void {
  const span = this.blockedSpans.get(callId);
  if (!span) return;
  this.blockedSpans.delete(callId);
  endToolBlockedOnUserSpan(span, { decision, source });
}
```

End sites:

| Line | Trigger | decision | source |
|---|---|---|---|
| 1636 | `handleConfirmationResponse` cancel/abort | `'cancel'` (or `'aborted'` if `signal.aborted`) | `'cli'` (or `'system'` if signal-driven) |
| 1689 | `handleConfirmationResponse` proceed | mapped from `outcome`: `ProceedOnce → 'proceed_once'`, all `ProceedAlways*` → `'proceed_always'` | `'cli'` |
| 2496 | `autoApproveCompatiblePendingTools` auto-approves a sibling's pending tool | `'auto_approved'` | `'auto'` |
| 1463 | Permission hook proceeds blocked tool | `'proceed_once'` | `'hook'` |
| 1477 | Permission hook denies blocked tool | `'cancel'` | `'hook'` |

**ModifyWithEditor (line 1637-1679)**: do NOT end. The blockedSpan stays open across `awaiting_approval → modifying → awaiting_approval` until the FINAL proceed/cancel arrives in a later `handleConfirmationResponse` invocation. Add an explicit comment noting this.

### C.3 Edge case — global signal.aborted while awaiting

NOT handled in v1. Rationale: the existing 30-min TTL cleanup in `session-tracing.ts:127` already calls `span.end()` defensively, so a leaked blocked span has bounded lifetime and bounded telemetry impact. Adding `signal.addEventListener('abort')` listeners would require parallel listener-cleanup state, which is non-trivial to get right. Defer to a follow-up if the leak shows up in production traces.

Document this in the commit message + an inline comment near the blocked span start.

## D. hook span wiring — 5 fire sites in `_executeToolCallBody`

All sites already have `toolContext` ALS active (called from inside `runInToolSpanContext`). Pattern:

```ts
const hookSpan = startHookSpan({
  hookEvent: 'PreToolUse',
  toolName: canonicalName,
  toolUseId,
});
let endMeta: Parameters<typeof endHookSpan>[1] = { success: false };
try {
  const preHookResult = await firePreToolUseHook(...);
  endMeta = {
    success: true,
    shouldProceed: preHookResult.shouldProceed,
    blockType: preHookResult.blockType,
    hasAdditionalContext: !!preHookResult.additionalContext,
  };
  // existing block-handling logic
} catch (e) {
  endMeta = { success: false, error: e instanceof Error ? e.message : String(e) };
  throw e;
} finally {
  endHookSpan(hookSpan, endMeta);
}
```

5 fire sites (5 wrap blocks):

| # | Line | Hook | hookEvent | Notes |
|---|---|---|---|---|
| 1 | 1930 | `firePreToolUseHook` | `PreToolUse` | record `shouldProceed`, `blockType` |
| 2 | 2056 | `safelyFirePostToolUseFailureHook` (success path, signal aborted) | `PostToolUseFailure` | `isInterrupt:true` |
| 3 | 2094 | `firePostToolUseHook` (post-success) | `PostToolUse` | record `shouldStop`, `hasAdditionalContext` |
| 4 | 2260 | `safelyFirePostToolUseFailureHook` (toolResult.error set) | `PostToolUseFailure` | `isInterrupt:false` |
| 5 | 2319 | `safelyFirePostToolUseFailureHook` (catch path, aborted) | `PostToolUseFailure` | `isInterrupt:true` |
| 6 | 2347 | `safelyFirePostToolUseFailureHook` (catch path, real exception) | `PostToolUseFailure` | `isInterrupt:false` |

Note: Plan agent counted 6 — confirmed there are 1 + 1 + 4 = 6 sites total. The "5" in the user decision was a slip; spec is 6.

`fireNotificationHook` at 1544 is NOT wrapped (per design decision).

## E. Tests

### E.1 `session-tracing.test.ts` — new test groups

**`describe('blocked_on_user spans')`**:
- `startToolBlockedOnUserSpan` parents to passed tool span (assert via mock parent context).
- `endToolBlockedOnUserSpan` records `decision` and `source`; status stays UNSET.
- Double-end is a no-op.
- NOOP span when SDK uninitialized — end is safe.
- **Concurrency regression**: start two tool spans + two blocked spans, end them in reverse order, assert each ends correctly (would fail with claude-code's findLast bug).

**`describe('hook spans')`**:
- Parent resolves to `toolContext` when called inside `runInToolSpanContext`.
- Falls back to `interactionContext` when no tool context.
- `endHookSpan` records `shouldProceed`/`shouldStop`/`hasAdditionalContext`.
- Error path: `error` metadata sets ERROR status; `shouldProceed:false` / `shouldStop:true` do NOT.

### E.2 `coreToolScheduler.test.ts` — mock + tests

**Mock update (line 131)**: add the four new exports:
```ts
startToolBlockedOnUserSpan: vi.fn(...),
endToolBlockedOnUserSpan: vi.fn(...),
startHookSpan: vi.fn(...),
endHookSpan: vi.fn(...),
```
Mirror the existing `createMockToolSpan` recorder pattern but with separate `blockedSpanRecords`/`hookSpanRecords` arrays.

**Existing tests to extend** (current line numbers):
- "marks successful tool calls with OK status via endToolSpan" (~3666): now also assert tool span starts BEFORE awaiting_approval transition, ends AFTER `executeSingleToolCall`.
- Cancellation-during-confirmation tests (line 686, 765): assert blockedSpan ends with `decision:'cancel'`.
- ModifyWithEditor tests: assert blockedSpan stays open across modify cycle, ends only on final proceed.
- Pre-hook denial test (3387): assert hookSpan recorded `shouldProceed:false`, `blockType:'denied'`.
- Post-hook stop test (3419): assert hookSpan `shouldStop:true`.

**New tests**:
- Tool span lifecycle: hard deny in `_schedule:1338` ends span without entering `runInToolSpanContext`.
- Plan-mode block ends tool span without execution.
- Auto-approve compatible pending: blockedSpan ends with `source:'auto_approved'`; tool span survives the transition into `'scheduled'`.
- Concurrent execution (`runConcurrently`) of 3 tools: each gets its own toolSpan + blockedSpan + hookSpan; no cross-contamination (regression test for findLast bug).
- Hook throw: hookSpan ends with `success:false, error:...` even when `safelyFirePostToolUseFailureHook` swallows the error.

**Leak detection**: add `afterEach` assertion `expect(scheduler['toolSpans'].size).toBe(0)` and `expect(scheduler['blockedSpans'].size).toBe(0)` to catch any path that forgets to finalize.

## F. Verification

1. `cd packages/core && npm run typecheck` — clean.
2. `npx vitest run src/telemetry/session-tracing.test.ts src/core/coreToolScheduler.test.ts` — all green.
3. `npx vitest run` (full core package) — only the preexisting `anthropicContentGenerator` User-Agent failure should remain (unrelated to this PR).
4. `npx eslint` on changed files — clean.
5. **Manual smoke**: with telemetry pointed at a local OTLP collector, run a tool that requires confirmation; verify trace tree shows `interaction → tool → tool.blocked_on_user → (after approve) hook(PreToolUse) → tool.execution → hook(PostToolUse)` with correct durations and decision attributes.

## G. Out-of-scope (deferred)

- Global signal.aborted listener for blockedSpan cleanup → 30-min TTL handles bounded leak; revisit if production traces show it.
- `fireNotificationHook` permission_prompt span → fire-and-forget, low value.
- Hook decision-taxonomy refinement (e.g. distinguishing `ProceedAlwaysProject` vs `ProceedAlwaysUser`) → collapse to `proceed_always` for now; adjust if backends ask.
- Retroactive plan-mode `'ask'` blockType handling → currently treated as deny; if behavior changes to re-prompt, blocked_on_user lifecycle needs the additional path.

## H. Commit / PR shape

Single commit, single PR titled something like:
`feat(telemetry): Phase 2 — tool.blocked_on_user + hook spans (#3731)`

PR body references #3731 and notes the four checklist items it ticks off in `### Deeper observability (P3) → Phase 2`.

## Final Implementation Status

- **PR #4126** (Phase 1) — MERGED 2026-05-16. Unified span creation paths for hierarchical trace tree.
- **PR #4302** (Phase 1.5) — MERGED 2026-05-19. Fallback order, abort-as-result, log/span consistency polish.
- **#3731** (parent issue) — OPEN. Telemetry hardening tracker still active.
- **Outcome**: Phase 2 (the subject of THIS plan: `tool.blocked_on_user` + `hook` spans) has NOT been implemented as a PR yet. Phases 1 and 1.5 are complete and merged; Phase 2 remains planned but unexecuted.
- **Files from Phase 1.5 (#4302)**: `session-tracing.ts`, `coreToolScheduler.ts`, `loggingContentGenerator.ts`, `tracer.ts` + tests — laying groundwork this plan builds on.
- **Key divergence**: No divergence yet — the plan awaits implementation.
