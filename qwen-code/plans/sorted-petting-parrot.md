# Phase 1 v2: Codex Review Fixes

## Context

Codex review on PR #4126 found 3 correctness issues with the tracing unification:

1. **[P2] Non-stream LLM span not active in OTel context** — `loggingContentGenerator.generateContent()` creates `llmSpan` but doesn't wrap the API call in `context.with(...)`. The streaming path does. Result: any nested OTel spans during the API call (HTTP instrumentation auto-spans, log-bridge spans from `logApiResponse`) parent to session root instead of `qwen-code.llm_request`, breaking the trace tree.

2. **[P2] Tool span not active in OTel context** — `runInToolSpanContext` only sets the custom `toolContext` ALS (used by `startToolExecutionSpan`), not the OTel context. Result: hooks, HTTP calls, file ops, etc. inside tool execution emit OTel spans that parent to session/interaction, not to the `qwen-code.tool` span.

3. **[P3] `span.end()` can leak on telemetry failure** — All three `end*Span` helpers put `span.end()` inside the same `try` as `setAttributes`/`setStatus`. If those throw (Span impl error, exporter issue), `span.end()` is skipped and the span is never finalized. Old `withSpan` had `span.end()` in a `finally`.

These are real correctness regressions caught after E2E (which only verified explicit spans, not nested HTTP/log-bridge spans).

## Files to modify (2)

### 1. `packages/core/src/telemetry/session-tracing.ts`

**1a. `runInToolSpanContext` — also activate OTel context (Codex #2)**

```typescript
export function runInToolSpanContext<T>(span: Span, fn: () => T): T {
  const spanId = getSpanId(span);
  const spanCtx = activeSpans.get(spanId)?.deref();
  if (!spanCtx) return fn();
  // Both ALS (for startToolExecutionSpan parent lookup) AND OTel context
  // (so nested OTel spans/logs inherit tool span as parent).
  const otelCtxWithSpan = trace.setSpan(otelContext.active(), span);
  return toolContext.run(spanCtx, () => otelContext.with(otelCtxWithSpan, fn));
}
```

Note: `otelContext.with` returns the callback's return value, so the generic `<T>` plumbing works for both sync and async `fn`.

**1b. Move `span.end()` out of the status-update try/catch (Codex #3)**

In all three `end*Span` functions, restructure so `span.end()` always runs even if `setAttributes`/`setStatus` throws:

```typescript
// endLLMRequestSpan (and parallel changes for endToolSpan, endToolExecutionSpan)
spanCtx.ended = true;
try {
  // ... setAttributes ...
  // ... setStatus ...
} catch (error) {
  debugLogger.warn(`Failed to update LLM request span: ${...}`);
}
try {
  span.end();
} catch (error) {
  debugLogger.warn(`Failed to end LLM request span: ${...}`);
}
activeSpans.delete(spanId);
strongSpans.delete(spanId);
```

Apply same pattern to `endToolSpan` (uses `spanCtx.span.end()`) and `endToolExecutionSpan` (uses `spanCtx.span.end()`).

### 2. `packages/core/src/core/loggingContentGenerator/loggingContentGenerator.ts`

**Wrap non-stream `generateContent()` API call in `context.with(spanContext, ...)` (Codex #1)**

Mirror the streaming path's pattern:

```typescript
async generateContent(req, userPromptId): Promise<GenerateContentResponse> {
  const llmSpan = startLLMRequestSpan(req.model, userPromptId);
  try { llmSpan.setAttribute('llm_request.stream', false); } catch { /* */ }
  const spanContext = trace.setSpan(context.active(), llmSpan);  // NEW
  const startTime = Date.now();
  // ...
  try {
    return await context.with(spanContext, async () => {  // NEW wrapper
      if (!isInternal) { this.logApiRequest(...); }
      const response = await session.wrap(() => this.wrapped.generateContent(req, userPromptId));
      // ...
      this.safelyLogApiResponse(...);
      // ...
      endLLMRequestSpan(llmSpan, { success: true, ... });
      return response;
    });
  } catch (error) {
    // error path — also wrap logging in context.with for consistency
    await context.with(spanContext, async () => {
      this.safelyLogApiError(...);
      // ...
    });
    endLLMRequestSpan(llmSpan, { success: false, ... });
    throw error;
  }
}
```

Note: `endLLMRequestSpan` itself doesn't need to be inside `context.with` (it operates on the span object directly). But the API call and all logging during the call must be.

## Reused functions/utilities

- `trace.setSpan(ctx, span)` from `@opentelemetry/api` — already imported in both files
- `context.with(ctx, fn)` from `@opentelemetry/api` — already imported in `loggingContentGenerator.ts`; need to add `context` import in `session-tracing.ts` if not already there (it is — imported as `otelContext`)
- `toolContext.run(...)` — already used; just chain with `otelContext.with(...)`

## Critical files

- `/Users/jinye.djy/Projects/qwen-code/.claude/worktrees/sorted-petting-parrot/packages/core/src/telemetry/session-tracing.ts` (3 functions)
- `/Users/jinye.djy/Projects/qwen-code/.claude/worktrees/sorted-petting-parrot/packages/core/src/core/loggingContentGenerator/loggingContentGenerator.ts` (1 function — non-stream `generateContent`)

## Verification

1. **Unit tests**: `npx vitest run packages/core/src/telemetry/session-tracing.test.ts packages/core/src/core/coreToolScheduler.test.ts packages/core/src/core/loggingContentGenerator/loggingContentGenerator.test.ts packages/core/src/core/client.test.ts`
   - Existing tests should still pass
   - Mocks for `endLLMRequestSpan`/`endToolSpan` may need adjustment if they assert on span.end() behavior with throwing setStatus

2. **Type check**: `npx tsc --noEmit -p packages/core/tsconfig.json` — zero new errors

3. **E2E parent-child verification (extended)** — verify both our spans AND nested log-bridge spans parent correctly:
   ```bash
   QWEN_TELEMETRY_ENABLED=1 QWEN_TELEMETRY_OUTFILE=/tmp/spans.jsonl \
     node packages/cli/dist/index.js --prompt "list files" --max-session-turns 2

   # All non-interaction spans should have parentSpanId pointing to interaction or tool/llm_request
   cat /tmp/spans.jsonl | jq -s '[.[] | {name, parent: (.parentSpanContext.spanId // "ROOT")[0:8]}]'
   ```
   Expected: log-bridge spans (`log.bridge: true`) created during API/tool execution should now parent to `qwen-code.llm_request` or `qwen-code.tool` instead of session root.

4. **OTel error resilience test** (manual): can be added as a unit test — make `span.setAttributes` throw, verify `span.end()` is still called and `activeSpans` is cleaned up.

## Final Implementation Status

- **PR #4126**: MERGED on 2026-05-16.
- **Title**: "feat(telemetry): unify span creation paths for hierarchical trace tree"
- **Summary**: All three Codex review fixes were implemented: (1) non-stream LLM span activated in OTel context via `context.with(spanContext, ...)`, (2) `runInToolSpanContext` now chains `otelContext.with()` alongside `toolContext.run()`, (3) `span.end()` moved to a separate try/catch to prevent leaks on setAttributes failure.
- **Key divergences**: None significant. The plan was a fixup pass on the already-in-review PR #4126, and all three P2/P3 issues were addressed as described.
- **Files changed** (10): `packages/core/src/telemetry/session-tracing.ts`, `packages/core/src/telemetry/session-tracing.test.ts`, `packages/core/src/core/loggingContentGenerator/loggingContentGenerator.ts`, `packages/core/src/core/loggingContentGenerator/loggingContentGenerator.test.ts`, `packages/core/src/core/coreToolScheduler.ts`, `packages/core/src/core/coreToolScheduler.test.ts`, `packages/core/src/core/client.ts`, `packages/core/src/core/client.test.ts`, `packages/core/src/telemetry/index.ts`, `docs/design/workflow-tracing-gaps.md`.
