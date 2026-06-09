# Fix PR #4058 telemetry review issues

## Context

PR #4058 (`fix/pr3847-review-followups`) addresses five telemetry follow-ups from PR #3847. Code review identified a test failure bug, a design gap in session ID fallback, and several minor robustness issues. This plan fixes all of them.

## Changes

### 1. [Bug] Fix `sdk.test.ts` assertion — broken by new `setSessionContext` signature

**File:** `packages/core/src/telemetry/sdk.test.ts` (line 572)

`sdk.ts` now calls `setSessionContext(ctx, sessionId)` with two args, but the test still asserts one arg:
```typescript
// Before (will fail):
expect(setSessionContext).toHaveBeenCalledWith({ __sessionId: 'new-session-id' });
// After:
expect(setSessionContext).toHaveBeenCalledWith({ __sessionId: 'new-session-id' }, 'new-session-id');
```

Also check the `initializeTelemetry` tests that assert on `setSessionContext` — they may need the same fix.

### 2. [Design] Add guard boolean for double `span.end()` in timeout scenario

**File:** `packages/core/src/core/loggingContentGenerator/loggingContentGenerator.ts`

The new 5-minute timeout calls `span.end()`, and the `finally` block also calls `span?.end()`. While OTel treats double-end as a no-op, add a `spanEnded` boolean to make intent explicit:

- Declare `let spanEnded = false` alongside `terminalStatusAttempted`
- In the timeout callback: set `spanEnded = true` before calling `span.end()`
- In the `finally` block: guard `span?.end()` with `if (!spanEnded)`
- Also guard `safeSetStatus` in the finally block — no point setting status on an ended span

### 3. [Minor] `.trim()` env var in `shouldForceSampled`

**File:** `packages/core/src/telemetry/tracer.ts`

Add `.trim()` to handle whitespace-padded env vars:
```typescript
const sampler = process.env['OTEL_TRACES_SAMPLER']?.trim().toLowerCase() ?? '';
```

### 4. [Minor] Pass `sessionId` in `debugLogger.test.ts`

**File:** `packages/core/src/utils/debugLogger.test.ts` (line 210)

Update `setSessionContext(sessionRootContext)` to `setSessionContext(sessionRootContext, 'test-session')` for completeness with the new signature.

### 5. [Docs] Fix PR description about "stale" fallback

The `??` operator only covers **missing** `session.id`, not **stale**. This is by design (log record attribute takes precedence), but the code comment in `log-to-span-processor.ts` should be clarified to say "missing" instead of "missing or stale".

**File:** `packages/core/src/telemetry/log-to-span-processor.ts` — update the comment at the fallback line.

## Steps

1. `gh pr checkout 4058` to switch to the PR branch
2. Apply fixes 1-5 above
3. Run `npx tsc --noEmit -p packages/core/tsconfig.json`
4. Run tests: `npx vitest run packages/core/src/telemetry/sdk.test.ts packages/core/src/telemetry/tracer.test.ts packages/core/src/telemetry/session-context.test.ts packages/core/src/telemetry/log-to-span-processor.test.ts packages/core/src/core/loggingContentGenerator/loggingContentGenerator.test.ts packages/core/src/utils/debugLogger.test.ts packages/core/src/core/coreToolScheduler.test.ts`
5. Commit and push

## Final Implementation Status

- **PR #3847**: MERGED on 2026-05-10. **PR #4058**: MERGED on 2026-05-13.
- **Titles**: #3847 "feat(telemetry): inject traceId/spanId into debug log files for OTel correlation"; #4058 "fix(telemetry): address PR #3847 review follow-ups for trace correlation"
- **Summary**: All 5 planned fixes were implemented in PR #4058: (1) sdk.test.ts assertion updated for new `setSessionContext` 2-arg signature, (2) double `span.end()` guard boolean added in loggingContentGenerator, (3) `.trim()` on env var in `shouldForceSampled`, (4) `debugLogger.test.ts` updated with sessionId arg, (5) comment in log-to-span-processor clarified "missing" vs "stale".
- **Key divergences**: None. The plan was a direct fixup of review issues and was implemented as described.
- **Files changed in #4058** (12): `packages/core/src/telemetry/sdk.ts`, `packages/core/src/telemetry/sdk.test.ts`, `packages/core/src/telemetry/session-context.ts`, `packages/core/src/telemetry/session-context.test.ts`, `packages/core/src/telemetry/log-to-span-processor.ts`, `packages/core/src/telemetry/log-to-span-processor.test.ts`, `packages/core/src/telemetry/tracer.ts`, `packages/core/src/telemetry/tracer.test.ts`, `packages/core/src/core/loggingContentGenerator/loggingContentGenerator.ts`, `packages/core/src/core/coreToolScheduler.ts`, `packages/core/src/core/coreToolScheduler.test.ts`, `packages/core/src/utils/debugLogger.test.ts`.
