# Plan: Align Daemon/ACP Session Tracing (Issue #4602)

## Context

PR #4556 (`feat/daemon-otel-e2e-design`) established trace propagation infrastructure: daemon route spans, bridge spans, cross-process context injection via `qwen.telemetry.*` metadata, and an interaction span in Session.ts via `withInteractionSpan`. However, **tool spans**, **`session.id` attribute parity**, and **`conversation_finished` event** are still missing — daemon traces show the interaction span with flat `llm_request` children but no tool-level visibility.

This plan implements both milestones from Issue #4602 on top of PR #4556's branch.

## Prerequisites

Reset `feat/daemon-workspace-service` to `origin/feat/daemon-otel-e2e-design` (current branch diverges).

---

## Part 1: `session.id` on all span types (Milestone 1)

**File:** `packages/core/src/telemetry/session-tracing.ts`

**What:** Add `'session.id'` attribute to `llm_request`, `tool`, and `tool.execution` spans. Currently only interaction spans carry it.

**How:** Import `getCurrentSessionId` from `./session-context.js` (already imported `getSessionContext` from the same module), then add one line to each function's `attributes` object:

```typescript
'session.id': getCurrentSessionId() ?? '',
```

Add to:
1. `startLLMRequestSpan()` (line ~425) — attributes object
2. `startToolSpan()` (line ~571) — attributes object
3. `startToolExecutionSpan()` (line ~682) — attributes object

**Why this works even without an interaction span:** `getCurrentSessionId()` reads from module-level state set during SDK initialization (`setSessionContext`). It's always available in any ACP child process.

---

## Part 2: Tool spans in Session.ts `runTool()` (Milestone 2)

**File:** `packages/cli/src/acp-integration/session/Session.ts`

### New imports

Add to the `@qwen-code/qwen-code-core` import block:
```typescript
startToolSpan,
endToolSpan,
runInToolSpanContext,
startToolExecutionSpan,
endToolExecutionSpan,
```

### Implementation pattern

The `runTool()` method (line 1814) has this structure:
```
setup → early validation → tool lookup → [L1 check → permissions → execution → hooks] → return
```

Instrumentation wraps everything AFTER tool lookup succeeds:

```typescript
private async runTool(abortSignal, promptId, fc): Promise<Part[]> {
  // ... setup, errorResponse helper, earlyErrorResponse helper ...
  // ... fc.name check, tool registry lookup (these return before span) ...

  const toolSpan = startToolSpan(fc.name, {
    'tool.call_id': callId,
    tool_name: fc.name,
  });
  let spanSuccess = false;
  let spanError: string | undefined;

  try {
    return await runInToolSpanContext(toolSpan, async () => {
      // --- existing try block ---
      try {
        // L1 enablement check (earlyErrorResponse → sets spanError)
        // permission flow
        // hooks

        // === Tool execution (with execution span) ===
        const execSpan = startToolExecutionSpan();
        let toolResult: ToolResult;
        try {
          toolResult = await invocation.execute(abortSignal);
          endToolExecutionSpan(execSpan, {
            success: !toolResult.error,
            error: toolResult.error ? 'tool_error' : undefined,
          });
        } catch (execError) {
          endToolExecutionSpan(execSpan, {
            success: false,
            error: abortSignal.aborted ? 'tool_cancelled' : 'tool_exception',
            cancelled: abortSignal.aborted,
          });
          throw execError;
        }

        // ... post hooks, emitters, logging ...
        spanSuccess = true;
        return responseParts;
      } catch (e) {
        // ... existing error handling ...
        spanError = error.message;
        return errorResponse(error);
      }
    });
  } finally {
    endToolSpan(toolSpan, { success: spanSuccess, error: spanError });
  }
}
```

### Early return handling

`earlyErrorResponse` calls inside the span context (L1 deny, permission deny, PreToolUse hook block) return normally without setting `spanSuccess = true`. The `finally` block catches these — `spanSuccess` remains `false`.

To capture the error message for early returns, modify `earlyErrorResponse` to also set `spanError`:
```typescript
const earlyErrorResponse = async (error: Error, toolName?) => {
  spanError = error.message;  // ADD THIS
  // ... existing logic ...
};
```

### Async compatibility note

`runInToolSpanContext<T>(span, fn: () => T): T` — when `fn` returns `Promise<Part[]>`, the return type is `Promise<Part[]>`. Node's AsyncLocalStorage (used internally by OTel context + `toolContext` ALS) propagates correctly across `await` boundaries. This is the same pattern used in `coreToolScheduler.ts`.

---

## Part 3: `conversation_finished` event

**File:** `packages/cli/src/acp-integration/session/Session.ts`

**What:** Emit `logConversationFinishedEvent` at the end of the interaction, matching CLI behavior (currently emitted in `useGeminiStream.ts`).

**Where:** Inside the `withInteractionSpan` callback, just before the return from `#handleStopHookLoop`. Add a turn counter in the while loop, then:

```typescript
// After the while loop and rewrite wait, before #handleStopHookLoop:
const result = await this.#handleStopHookLoop(pendingSend, promptId, hooksEnabled, messageBus);
logConversationFinishedEvent(
  this.config,
  new ConversationFinishedEvent(this.config.getApprovalMode(), turnCount),
);
return result;
```

**New import:** `logConversationFinishedEvent`, `ConversationFinishedEvent` from `@qwen-code/qwen-code-core`.

**Turn counter:** Add `let turnCount = 0;` before the while loop, increment at each iteration.

---

## Part 4: `user_prompt` log-bridge alignment (already handled)

PR #4556 moves `logUserPrompt()` inside `withInteractionSpan`, which sets up `otelContext.with(activeContext, ...)`. The LogToSpanProcessor creates log-bridge spans from the active OTel context, so `user_prompt` spans now share the correct traceId (the daemon's propagated trace). No additional changes needed.

---

## Part 5 (bonus): Cron path interaction span

**File:** `packages/cli/src/acp-integration/session/Session.ts`

`#executeCronPrompt` (line 1412) has the same while loop + `runToolCalls` pattern as `#executePrompt` but NO `withInteractionSpan`. Tool spans from my Part 2 changes will still be created (parented to session root), but without an interaction span they lack turn-level grouping.

**Fix:** Wrap the cron logic body in `withInteractionSpan`:
```typescript
return await withInteractionSpan(this.config, {
  promptId,
  model: this.config.getModel(),
  messageType: 'cron',
}, async () => {
  // existing try { while loop } catch/finally
});
```

No `parentContext` needed (cron has no daemon HTTP request origin). No `getResultStatus` needed (cron returns void, interaction ends as 'ok' unless it throws).

---

## Out of scope

- **Hook spans** (PreToolUse/PostToolUse): Hooks fire correctly but don't get dedicated `qwen-code.hook` spans. Lower priority — the tool span already covers the full lifecycle including hook time.
- **Full GeminiClient refactor**: Keeps Session.ts's own dispatch loop. The "heavy" Milestone 2 approach is deferred.
- **`tool.blocked_on_user` spans**: Permission dialog timing spans. Not critical for initial parity.
- **Sub-agent `interactionContext` corruption**: Pre-existing issue in both CLI and daemon modes — sub-agent's `startInteractionSpan` calls `enterWith()` which corrupts parent's `interactionContext.getStore()`. Not introduced by this work. The OTel active context fallback (from `withInteractionSpan`'s `otelContext.with()`) ensures correct span parenting regardless.

---

## Resulting trace hierarchy

```
[Daemon] qwen-code.daemon.request (route span)
  └── qwen-code.daemon.bridge (prompt.dispatch)
        │
        ▼ (cross-process, W3C traceparent in _meta)
[ACP Child] qwen-code.interaction (session.id=xxx, turn_status=ok)
  ├── qwen-code.llm_request (session.id=xxx, context=interaction)
  ├── qwen-code.tool (session.id=xxx, tool.name=Read, tool.call_id=...)
  │     └── qwen-code.tool.execution (session.id=xxx)
  ├── qwen-code.tool (session.id=xxx, tool.name=Bash, tool.call_id=...)
  │     └── qwen-code.tool.execution (session.id=xxx)
  ├── qwen-code.llm_request (second LLM call in same turn)
  └── conversation_finished (log event)
```

---

## Verification

```bash
# 1. Reset branch to PR #4556 base
git reset --hard origin/feat/daemon-otel-e2e-design

# 2. After implementation — unit tests
cd packages/core && npx vitest run src/telemetry/session-tracing.test.ts
cd packages/cli && npx vitest run src/acp-integration/session/Session.test.ts

# 3. Build + typecheck
npm run build && npm run typecheck
```

---

## Risk Analysis / Potential Bad Effects

### Checked and safe:

| Concern | Analysis | Verdict |
|---------|----------|---------|
| **CLI mode affected by Part 1** | `session.id` on all spans affects CLI too (shared `session-tracing.ts`). CLI spans gain `session.id` attribute on LLM/tool spans. | **Beneficial** — makes CLI spans also filterable by session. No regression. |
| **Telemetry disabled** | `startToolSpan` returns `NOOP_SPAN` → `runInToolSpanContext(NOOP_SPAN, fn)` detects no registration in `activeSpans` → calls `fn()` directly. `endToolSpan(NOOP_SPAN)` early-returns. | **Zero overhead** when telemetry off. |
| **Orphaned spans on kill** | If ACP child killed mid-tool, span never ended. TTL sweep (30min, runs every 60s) cleans them. | **Same as CLI mode** — handled by existing infrastructure. |
| **Double-end protection** | `endToolSpan` checks `spanCtx.ended` flag. `finally` block can safely call it even if already ended by an early path. | **Safe** — idempotent. |
| **Async propagation in `runInToolSpanContext`** | Uses `toolContext.run()` + `otelContext.with()` which leverage Node's AsyncLocalStorage. Propagates correctly across `await`. | **Same pattern as `coreToolScheduler`** — battle-tested. |
| **Parallel Agent tool calls** | Each `runTool()` invocation creates its own tool span. Multiple concurrent spans under one interaction span is valid OTel behavior. | **Correct** — matches CLI behavior. |
| **TraceId when no daemon context** | If `extractDaemonTraceContext` returns `undefined`, `withInteractionSpan` falls back to session root context (session-derived traceId). Still functional. | **Graceful fallback** — no cross-process link but session traces still work. |
| **Multi-prompt sessions** | Each daemon HTTP request creates a new trace. Sequential prompts get separate traces, linked by `session.id`. | **Correct by design** — each request is independent. |
| **Abort signal propagation** | AbortSignal passed explicitly to `invocation.execute()`, not via OTel context. Adding `runInToolSpanContext` wrapper doesn't change abort behavior. | **No effect** on cancellation. |

### Mitigations needed in implementation:

1. **`session.id` when undefined**: Use conditional attribute to avoid empty string in ARMS:
   ```typescript
   const sessionId = getCurrentSessionId();
   const attributes = {
     ...(sessionId ? { 'session.id': sessionId } : {}),
     // other attrs
   };
   ```

2. **`earlyErrorResponse` closure ordering**: `spanError` must be declared BEFORE `earlyErrorResponse` definition (which references it via closure). In JS, `let` declarations are block-scoped but the closure captures the binding not the value — so declaring `spanError` at function top (before `earlyErrorResponse`) works. Calls to `earlyErrorResponse` that happen BEFORE the `try/finally` block (before tool lookup) harmlessly set `spanError` since `endToolSpan` is never reached.

3. **`conversation_finished` on error path**: If `#handleStopHookLoop` throws, the event won't emit. Wrap in try/finally:
   ```typescript
   let result: { stopReason: ... };
   try {
     result = await this.#handleStopHookLoop(...);
   } finally {
     logConversationFinishedEvent(this.config, new ConversationFinishedEvent(...));
   }
   return result;
   ```

---

## Key files to modify

| File | Change |
|------|--------|
| `packages/core/src/telemetry/session-tracing.ts` | Add `session.id` to `startLLMRequestSpan`, `startToolSpan`, `startToolExecutionSpan` |
| `packages/core/src/telemetry/session-tracing.test.ts` | Assert `session.id` present on new span types |
| `packages/cli/src/acp-integration/session/Session.ts` | Add tool spans in `runTool()`, add `conversation_finished` event |

## Final Implementation Status

- **PR #4556**: MERGED on 2026-05-29. **PR #4602**: Not found (likely not yet created or was folded into #4556).
- **Title**: "feat(telemetry): trace daemon prompt lifecycle"
- **Summary**: PR #4556 implemented the daemon telemetry tracing infrastructure. The `session.id` attribute on all span types (Part 1) and tool spans in Session.ts `runTool()` (Part 2) were implemented as part of the merged PR.
- **Key divergences**: The plan was written for a follow-up PR #4602 on top of #4556, but #4602 was never created as a separate PR. The core changes (session.id attributes, tool spans, conversation_finished event) appear to have been incorporated into #4556 directly.
- **Files changed in #4556** (14): `packages/core/src/telemetry/session-tracing.ts`, `packages/core/src/telemetry/session-tracing.test.ts`, `packages/core/src/telemetry/daemon-tracing.ts`, `packages/core/src/telemetry/daemon-tracing.test.ts`, `packages/cli/src/acp-integration/session/Session.ts`, `packages/cli/src/serve/server.ts`, `packages/cli/src/serve/runQwenServe.ts`, `packages/acp-bridge/src/bridge.ts`, plus SDK/metrics/runtime-config files.
