# Plan: Adopt unresolved PR #3847 review comments

## Context

PR #3847 (feat(telemetry): inject traceId/spanId into debug log files for OTel correlation) has been through multiple review rounds. Most critical issues have been fixed. After analyzing all remaining unresolved comments, only two actionable items remain — several others turned out to already be fixed in the code, already have test coverage, or are not applicable. See the analysis summary below.

### Already resolved (no action needed)
- `traceFlags: 1` in `log-to-span-processor.ts` → code already uses `TraceFlags.SAMPLED`
- Whitespace-only diffs in `monitorRegistry.ts`, `skill-manager.ts`, etc. → no longer present in branch diff
- Tool span status tests → `coreToolScheduler.test.ts` lines 2934-3343 already cover all 5 failure paths
- Streaming span lifecycle tests → `loggingContentGenerator.test.ts` already covers success, error, early break, setStatus failure
- Proxy replacement → code already uses Proxy at `tracer.ts:95-108`
- `getTraceContext` try-catch → already split into safe functions with try-catch
- `safeSetStatus` in catch blocks → already uses `safeSetStatus` everywhere
- `ROOT_CONTEXT` usage → `tracer.ts:211` already uses `ROOT_CONTEXT`
- `promptId` resolution → `client.ts:1367-1368` already resolves before span creation

## Changes

### 1. Fix misleading test name in `tracer.test.ts`

**File:** `packages/core/src/telemetry/tracer.test.ts`

- **Line 326:** Rename test from `'derives a deterministic traceId from session ID'` to `'derives a deterministic traceId from session ID (spanId is random)'`
  - Rationale: The test only asserts traceId determinism but the name implies the entire context is deterministic. The spanId is random (via `randomSpanId()`), and a reader might assume the whole result is stable.

- **Line 70:** Change `traceFlags: 1` to `traceFlags: TraceFlags.SAMPLED` in `createMockSpan` for consistency with the rest of the test file (line 340 already uses the constant). `TraceFlags` is already imported at line 8.

### 2. Add regression test for `Config.startNewSession()` → `refreshSessionContext()` wiring

**File:** `packages/core/src/config/config.test.ts`

Add a test inside the existing `describe('startNewSession', ...)` block (line 372) that verifies `startNewSession()` calls `refreshSessionContext` with the new session ID.

The mock setup already spreads `...actual` from `../telemetry/index.js` (line 175-186), so `refreshSessionContext` is available but not explicitly mocked. We need to:
1. Import `refreshSessionContext` from `'../telemetry/index.js'`
2. Add it to the mock overrides as `refreshSessionContext: vi.fn()`
3. Add a test that calls `config.startNewSession()` and asserts `refreshSessionContext` was called with the new session ID

## Verification

```bash
# Run the specific test files
npx vitest run packages/core/src/telemetry/tracer.test.ts
npx vitest run packages/core/src/config/config.test.ts
```

## Final Implementation Status

- **PR #3847** — MERGED 2026-05-10. Title: "feat(telemetry): inject traceId/spanId into debug log files for OTel correlation".
- **Outcome**: The PR merged successfully. The two planned fixes (misleading test name rename + `refreshSessionContext` wiring test) were part of the final review-adoption round that got the PR merged.
- **Files changed**: `config.ts`, `config.test.ts`, `client.ts`, `client.test.ts`, `coreToolScheduler.ts/.test.ts`, `loggingContentGenerator.ts/.test.ts`, telemetry files (`index.ts`, `log-to-span-processor.ts/.test.ts`, `sdk.ts/.test.ts`, `session-context.ts/.test.ts`).
- **Key divergence**: The final PR was much broader than this plan's 2-item scope — it included the full telemetry injection feature, not just the review comment fixes. This plan captured only the tail-end review-adoption work that unblocked the merge.
