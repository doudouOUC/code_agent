# Phase 4b — Retry telemetry visibility for `qwen-code.llm_request` spans

## Context

Phase 4a (#4417, merged) added TTFT capture + GenAI semconv dual-emit. Phase 4b is the second slice — adds **per-attempt retry telemetry** so operators can see retry behavior in traces and metrics.

**Architectural discovery (not anticipated in design doc D4)**: while planning the implementation I read the 4 retry call sites carefully:

| Site                     | Pattern                                                                    |
| ------------------------ | -------------------------------------------------------------------------- |
| `client.ts:2109`          | `const apiCall = () => contentGenerator.generateContent(req, ...); retryWithBackoff(apiCall)` |
| `baseLlmClient.ts:235`    | Same pattern (generateJson)                                                |
| `baseLlmClient.ts:333`    | Same pattern (generateText)                                                |
| `geminiChat.ts:2035`      | Same pattern (streaming)                                                   |

So `retryWithBackoff` sits **above** `LoggingContentGenerator`. Each retry attempt invokes `apiCall()` fresh → `LoggingContentGenerator.generateContent(...)` runs → `startLLMRequestSpan` + `endLLMRequestSpan` create a brand-new LLM span per attempt.

The design doc's plan — "populate `attempt` / `retry_total_delay_ms` on the LLM span via an `onRetry` accumulator" — assumed one LLM span shared across all attempts (claude-code's pattern, where the retry loop is inside `query()` which owns the span). qwen-code's architecture is the opposite. The successful attempt's `endLLMRequestSpan` call has no knowledge of previous failed attempts because the retry layer is above it.

**Resolution — Option E (AsyncLocalStorage propagation)**:

Use ALS to bridge the retry layer down to LoggingContentGenerator. `retryWithBackoff` enters a fresh ALS frame per attempt with the cumulative retry context; LoggingContentGenerator's `endLLMRequestSpan` call reads from the ALS to populate the existing Phase 4a placeholder fields (`attempt`, `requestSetupMs`, `retryTotalDelayMs`).

This actually gives **richer** observability than the original plan:
- Each attempt gets its own LLM span with its own `duration_ms`, `ttft_ms`, `error`, etc.
- The successful attempt's span carries `attempt: 3` + `request_setup_ms: 1200` (cumulative time spent in prior failed attempts + backoffs)
- Failed attempts get their own `qwen-code.llm_request` spans showing what went wrong
- `ApiRetryEvent` LogRecords (Phase 4b new) provide per-attempt error / delay log entries

**Why ALS over the alternatives**:
- Option A (move retry into LoggingContentGenerator): 4-site refactor + invasive API change. Rejected.
- Option B (no aggregation, each attempt = independent span): leaves Phase 4a placeholder fields permanently unused. Operator loses the "this is attempt 3 of N" rollup.
- Option C (new parent span across retries): unnecessary new span type, spreads across 4 sites.
- Option D (pass attempt info through request config): hacky, telemetry-via-request.
- Option E (ALS): matches existing patterns (`promptIdContext`, `subagentNameContext`), minimal surface, populates Phase 4a fields correctly. **Chosen.**

This is a design-doc revision; the existing Phase 4a placeholder fields are now meaningful and will be populated by Phase 4b without re-touching the schema (as originally promised).

## Issues uncovered by comprehensive review (must fix in plan / PR)

A Plan-agent review of v1 of this plan surfaced 3 BLOCKERs and 6 IMPORTANT issues. The fixes below are integrated into the implementation section.

### B1 — `sampling_ms` formula in Phase 4a was already incorrect; Phase 4b surfaces the bug

Phase 4a's `endLLMRequestSpan` computes `sampling_ms = duration_ms - ttft_ms - (requestSetupMs ?? 0)`. This assumes `duration_ms` includes the setup time. But `duration_ms = Date.now() - spanCtx.startTime`, and `startTime` is set when `startLLMRequestSpan` is called — which is AFTER any setup happens. So `duration_ms` only covers `ttft + sampling` for the span; subtracting `setup` again is double-counting.

In Phase 4a where `requestSetupMs` was undefined → 0, the bug was invisible. Phase 4b populates `requestSetupMs` with the cumulative retry overhead (a meaningful non-zero number for retried requests), so the formula would clamp to 0 for retried requests and wipe out output-throughput data exactly for the requests operators most want to debug.

**Fix**: change `sampling_ms = duration_ms - ttft_ms` (drop the setup subtraction). For unretried Phase 4a calls, the answer is identical (setup was 0); for retried Phase 4b calls, the answer is now correct (span duration is per-attempt, so subtracting per-attempt TTFT gives per-attempt sampling). The Phase 4a tests asserting `sampling_ms = duration - ttft - setup` need updating.

### B2 — `requestSetupMs` semantics need universal definition that holds on both success + failure spans

Phase 4a JSDoc says "Time from entry to the start of the successful attempt." In Phase 4b's per-attempt-span model, this only applies to the successful span. On a failed-attempt span the same arithmetic means "time elapsed in the retry budget when THIS attempt started" — a different concept.

**Fix**: redefine the JSDoc as "Time from `retryWithBackoff` entry to THIS attempt's start (ms)." For unretried direct calls (no ALS context), the field stays undefined. For attempt 1 of a retried request, this is ~0. For attempt N, this is cumulative time spent in attempts 1..N-1 plus their backoff sleeps. On the successful attempt's span, this doubles as "total retry overhead before success." Dashboard convention: filter by `success=true` to get the retry-overhead-until-success interpretation; filter by attempt to get per-attempt timeline.

### B3 — `ApiRetryEvent` vs `ContentRetryEvent` partitioning must be documented in event class JSDoc

A single user-prompt can fire BOTH events: `geminiChat`'s for-loop fires `ContentRetryEvent` for `InvalidStreamError` retries (uses `INVALID_CONTENT_RETRY_OPTIONS`, NOT `retryWithBackoff`); `retryWithBackoff`'s `onRetry` fires `ApiRetryEvent` for HTTP-status retries. They're cleanly partitioned by failure mode but operators summing "total retry count for a prompt" must sum BOTH event streams.

**Fix**: JSDoc on `ApiRetryEvent` explicitly references `ContentRetryEvent` and explains the partition. PR description includes a sample trace showing the two event types coexisting under one prompt_id.

### I1 — `requestSetupMs` should be computed in `retry.ts` and threaded through ALS, not derived by the consumer

v1 plan: `LoggingContentGenerator` computes `requestSetupMs = startTime - requestEntryTime`. Risk: small measurement gap between `retryWithBackoff` awaiting `fn()` and `startLLMRequestSpan` capturing `startTime`; fragility to layer insertion between `apiCall` and `LoggingContentGenerator`.

**Fix**: `retry.ts` writes the ALS context with `requestSetupMs: Date.now() - requestEntryTime` immediately before `await fn()`. ALS context shape is `{ attempt, retryTotalDelayMs, requestSetupMs }` (drop `requestEntryTime`). `LoggingContentGenerator` reads and forwards verbatim.

### I2 — Use `persistentAttempt` (not `attempt`) in ALS when `shouldPersist === true`

`retry.ts:269-271` clamps `attempt = maxAttempts - 1` so the while-loop never exits in persistent mode. Without the fix, attempt 50 of a persistent retry would be reported as `attempt=5` (= maxAttempts-1) forever. ALS write must use `persistentAttempt` (line 229) inside the `shouldPersist` branch.

### I3 — Capture ALS into closure at stream-wrapper entry, not inside `endLLMRequestSpan` callsites

`loggingContentGenerator.ts:497-509` schedules an idle-timeout `setTimeout` that calls `endLLMRequestSpan`. ALS propagates through `setTimeout` only because the timer is scheduled inside the ALS frame. Subtle and easy to break later. Safer: read `retryContext.getStore()` ONCE at the top of `generateContent` / `loggingStreamWrapper`, store in closure const, forward to all `endLLMRequestSpan` callsites (success, error, idle-timeout, abort) explicitly. Removes ALS-during-async-edge-case as a failure mode.

### I4 — Add 3 explicit concurrency/nesting test cases

Original test list was insufficient. Add:
1. **Parallel retries don't cross-contaminate**: two `retryWithBackoff` calls in flight via `Promise.all` produce two independent attempt counters (verifies ALS isolation).
2. **Nested retries read innermost frame**: `retryWithBackoff(outer => retryWithBackoff(inner => apiCall))` — inner attempt counter is what LoggingContentGenerator reads, outer counter is lost in scope (acceptable semantics; documented).
3. **`shouldRetryOnError` returns false mid-loop**: retry exits without calling `onRetry` for the failing attempt that gave up; the final LLM span shows `attempt=2, success=false` if attempt 1 succeeded retry but attempt 2 was non-retryable.

### I5 — Document synchronous-throw contract in JSDoc

`apiCall` must return a Promise (not throw synchronously). All current callers do `() => contentGenerator.generate...` which returns a Promise on first tick — safe. JSDoc on `RetryOptions.onRetry` notes this contract: "Invoked only after `await fn()` rejects; synchronous throws inside `fn` execute OUTSIDE the ALS frame and may produce undefined retry context."

### I6 — Default `attempt: 1` when ALS context absent (warmup / side queries / direct calls)

OTel histograms treat missing attributes as a separate series from `attempt=1`. Dashboards filtering `WHERE attempt=1` would exclude direct/warmup calls. Set `attempt: 1` always when going through `LoggingContentGenerator` regardless of ALS presence. `requestSetupMs` and `retryTotalDelayMs` stay undefined when ALS absent (no retry context = no setup overhead to report).

### B4 — Existing Phase 4a "clamps to 0 on clock skew" test inputs no longer trigger the clamp under the new formula

`session-tracing.test.ts:494-505` uses `ttftMs: 800, requestSetupMs: 500, durationMs: 1000` → old formula `1000 - 800 - 500 = -300 → max(0,...) = 0`. Under the new formula `1000 - 800 = 200`, no clamping happens; test asserts `0` and fails.

**Fix**: rewrite the test inputs to inputs that actually exercise the clamp under the new formula: `ttftMs: 1500, durationMs: 1000` (no `requestSetupMs`) → `1000 - 1500 = -500 → max(0,...) = 0`. The `Math.max(0, ...)` guard stays in the production code; the test just needs to use inputs that exercise it. The "clock skew" framing is still valid — TTFT exceeding duration only happens with clock drift or measurement bug.

### I7 — `onRetry` callback must be invoked inside try/catch

`retry.ts` does not currently wrap `fn()` callbacks defensively. If `logApiRetry` throws inside `onRetry` (uninitialised OTel SDK during early startup, malformed event, downstream RUM serialization error), the throw escapes into `retry.ts`'s catch block and breaks the retry loop — the user's prompt fails because of a telemetry bug.

**Fix**: wrap the `options.onRetry?.({...})` call in try/catch. Swallow errors and `debugLogger.warn`. Pattern parallel to `safelyLogApiResponse` / `safelyLogApiError` in `loggingContentGenerator.ts:176-210`. Document in `onRetry` JSDoc: "Best-effort — exceptions are caught and logged to debugLogger; they never affect retry behavior."

### I8 — `logApiRetry` must follow the 3-step pattern + add `recordApiRetry` metric counter

`logContentRetry` (`loggers.ts:715-735`) does THREE things, not one: (1) QwenLogger RUM, (2) `logger.emit(logRecord)` to OTel log signal, (3) `recordContentRetry(config)` metric counter. The v2 plan describes only step 1. Without step 2, LogToSpanProcessor never sees the event → no bridge span. Without step 3, no metric for "retry rate per model" — operators have to scan logs to compute it.

**Fix**:
- `logApiRetry` in `loggers.ts` mirrors all 3 steps. Specifically: call `QwenLogger.getInstance(config)?.logApiRetryEvent(event)`, then `if (!isTelemetrySdkInitialized()) return`, then build `LogAttributes` with `event.name = EVENT_API_RETRY`, then `logger.emit(logRecord)`, then `recordApiRetry(config)`.
- Add `recordApiRetry(config)` Counter to `metrics.ts` alongside the existing `recordContentRetry`. Metric name `qwen-code.api.retry.count` with attributes `{model}` (low cardinality) or `{model, status_code}` (medium cardinality — defer this decision; start with `{model}` only).
- Add the EVENT_API_RETRY constant emission pattern matching EVENT_CONTENT_RETRY.

### I9 — `onRetry` fires OUTSIDE the inner `retryContext.run` frame; bridge spans parent to the caller's active span, not the failed LLM span

When `onRetry` fires from inside `retry.ts`'s catch block: (a) `fn()` already rejected, (b) `LoggingContentGenerator` already called `endLLMRequestSpan` on the failed attempt's span, (c) the next `retryContext.run(...)` for the new attempt hasn't started yet. The active OTel span at this moment is whatever the caller had active BEFORE `retryWithBackoff` — typically the interaction span (or tool span), NOT the just-ended failed LLM span.

This means `LogToSpanProcessor`-bridged `qwen-code.api_retry` spans will parent to the interaction/tool span, appearing as SIBLINGS of the failed LLM span, not children. The v2 plan's verification text says "bridge spans nested under the active LLM span" — that's wrong.

**Fix** (two parts):
1. **Correct the verification text** (and PR description) to: "N `qwen-code.llm_request` spans (one per attempt) AND N-1 `qwen-code.api_retry` bridge spans as siblings under the caller's active span (typically interaction or tool)."
2. **No code change needed** — bridge-as-sibling is a coherent trace structure. The (failed LLM span)→(retry event sibling)→(next LLM span) chain reads correctly in trace viewers because the spans are ordered by start time. Document this in the new event class JSDoc.

(Alternative considered: have callers wrap `logApiRetry` in `context.with(failedAttemptSpanContext, ...)`. Rejected because the failed attempt's span context isn't exposed by `LoggingContentGenerator` — would require new API surface. Sibling parentage is good enough.)

### I10 — `reportedAttempt` formula needs an explicit monotonic counter; v1 spec is ambiguous on mixed-error sequences

The v1 formula `reportedAttempt = shouldPersist ? persistentAttempt + 1 : attempt` reads `shouldPersist` from the PREVIOUS iteration. For mixed sequences (500 fail → 429 enters persistent → 500 fails non-persistent), the value flip-flops in confusing ways. The clamping at `attempt = maxAttempts - 1` (`retry.ts:270`) further complicates this.

**Fix**: track a separate monotonic counter `iterationCount` that increments at the top of the while loop (or just before each `retryContext.run`). Use `iterationCount` exclusively for the ALS write and `onRetry`'s `attempt_number` field. Drop the `shouldPersist ? ... : ...` ternary. Spec:

```ts
let iterationCount = 0;
while (attempt < maxAttempts) {
  attempt++;
  iterationCount++;
  const requestSetupMs = Date.now() - requestEntryTime;
  try {
    return await retryContext.run(
      { attempt: iterationCount, retryTotalDelayMs, requestSetupMs },
      () => fn(),
    );
  } catch (error) {
    // ... existing error handling ...
    try {
      options.onRetry?.({
        attempt: iterationCount,
        error, errorStatus, delayMs,
      });
    } catch (cbError) {
      debugLogger.warn('onRetry callback threw:', cbError);
    }
    await sleepWithHeartbeat(delayMs, ...);
    retryTotalDelayMs += delayMs;
  }
}
```

`iterationCount` always reflects "this is the Nth time `fn` was called", regardless of normal vs persistent mode. Simpler, monotonic, no clamping interaction.

### Third-pass review additions

#### I11 — `recordApiRetry` metric needs full DEFINITION, not just the call site

`recordContentRetry` uses `Record<string, never>` attributes (no dimensions). The plan promises `{model}` attributes for `recordApiRetry` — that's a DIFFERENT metric shape. The plan must add:
- Constant in `metrics.ts`: `API_RETRY_COUNT = `${SERVICE_NAME}.api.retry.count``
- Entry in `COUNTER_DEFINITIONS` (line 71) — the initialization loop at `initializeMetrics()` only sees metrics declared here
- `let apiRetryCounter: Counter | undefined`
- `recordApiRetry(config, { model })` function signature takes the attribute object (not just bare config)
- Caller wiring: `recordApiRetry(config, { model })` in `logApiRetry`

The "+15 LOC" estimate for metrics.ts is tight if `{model}` is included — bump to +25 LOC.

#### I12 — `ApiRetryEvent` must carry `subagent_name` (read from `subagentNameContext` at caller wiring sites)

Every event emitted on the LLM-call path (`ApiRequestEvent`, `ApiResponseEvent`, `ApiErrorEvent`) carries `subagent_name` via `subagentNameContext.getStore()`. `onRetry` fires inside `retry.ts`'s catch block — `subagentNameContext` is still active there. Without `subagent_name`, "subagent X retry rate" queries cannot join correctly.

**Fix**:
- Add `subagentName?: string` to `ApiRetryEvent` constructor opts, mirror `ApiErrorEvent` shape (`types.ts:299-321`)
- In each of the 4 caller wiring sites, read `subagentNameContext.getStore()` and pass to `new ApiRetryEvent({..., subagentName: subagentNameContext.getStore()})`

#### I13 — `logRetryAttempt` debugLogger call must be explicitly kept (not removed)

`retry.ts:285` calls `logRetryAttempt(attempt, error, errorStatus)` which writes to `debugLogger.warn` for every non-persistent failed attempt. With Phase 4b's `onRetry` callback firing too, the data exists in two sinks: debug log + ApiRetryEvent (which fans out to QwenLogger RUM + OTel log signal + counter + LogToSpanProcessor bridge span).

**Decision: keep `logRetryAttempt`** — debug log lines stay useful when OTel SDK is not initialized (local CLI debugging, integration test setup, early-startup errors before SDK init). The duplication is minimal and serves different audiences (engineer reading `qwen --debug` output vs operator querying ARMS dashboard).

Plan should explicitly say so, since the v2 plan was silent on the question.

### Deferrable findings (noted, not blocking — but document in JSDoc + PR description)

- **D1**: GenAI semconv has no stable retry attribute. Phase 4b ships private-only; revisit when spec lands.
- **D2**: SDK-internal retries (openai/google-genai `maxRetries=3`) remain invisible. Noted in PR description.
- **D3** (third-pass): Stream-iteration errors are NOT retried by `retryWithBackoff`. `geminiChat`'s `apiCall = () => generateContentStream(...)` resolves with a `Promise<AsyncGenerator>` BEFORE any chunks are consumed; per-chunk errors during `for await` go to the caller and bypass the retry layer. Pre-existing behavior, not a Phase 4b regression. PR description must note this so reviewers don't expect "stream-drop mid-iteration triggers retry telemetry".
- **D4** (third-pass): `shouldRetryOnContent` content-retry path (`retry.ts:184-193`) skips `onRetry`. No caller in the codebase uses `shouldRetryOnContent` today — the code path is dead. JSDoc on `RetryOptions.onRetry` should document this: "Content-retries via `shouldRetryOnContent` do NOT fire `onRetry`. If a future caller wires content retries, extend retry.ts to fire onRetry on that path too."
- **D5** (third-pass): `ApiRetryEvent.duration_ms = retry_delay_ms` makes the LogToSpanProcessor bridge span have a visible width equal to the SLEEP period (not the failed attempt's duration). Semantically defensible — the bridge span sits chronologically between the failed and next attempt's LLM spans, so visualizing the sleep window is informative. JSDoc on `ApiRetryEvent.duration_ms`: "Reports the backoff delay following this failed attempt, NOT the attempt's own duration. The attempt's duration lives on its `qwen-code.llm_request` span's `duration_ms` attribute."

## Implementation

### Files to add

**`packages/core/src/utils/retryContext.ts`** (NEW, ~30 LOC) — mirrors `promptIdContext.ts` style. Shape updated per I1 — `requestSetupMs` is pre-computed in `retry.ts` (not derived by consumer):
```ts
import { AsyncLocalStorage } from 'node:async_hooks';

export interface RetryAttemptContext {
  /**
   * 1-based attempt counter for the current `retryWithBackoff` execution.
   * In persistent retry mode (`shouldPersist === true`), this is
   * `persistentAttempt` (which is monotonically incrementing, unlike `attempt`
   * which is clamped to `maxAttempts - 1` to keep the while-loop alive).
   */
  readonly attempt: number;
  /**
   * Sum of all backoff delays BEFORE this attempt started (ms). 0 for attempt 1.
   */
  readonly retryTotalDelayMs: number;
  /**
   * Time from `retryWithBackoff` entry to THIS attempt's start (ms). 0 for
   * attempt 1 of a no-retry success. For attempt N>1, equals cumulative time
   * spent in attempts 1..N-1 plus their backoff sleeps. Computed by `retry.ts`
   * right before `await fn()` to avoid layer-insertion measurement drift.
   */
  readonly requestSetupMs: number;
}

export const retryContext = new AsyncLocalStorage<RetryAttemptContext>();
```

### Files to extend

**`packages/core/src/utils/retry.ts`**:
- **Keep the existing `logRetryAttempt` debugLogger call at line 285 unchanged** (per I13). The debug log line is still useful when OTel SDK is not initialized (local CLI debugging, early-startup errors, integration test setup). Duplication with `onRetry`'s ApiRetryEvent is intentional — different audiences.
- Add `onRetry?: (info: RetryAttemptInfo) => void` to `RetryOptions` (JSDoc per I5+D4: "Invoked after each failed attempt's delay is computed but BEFORE sleep, ONLY for catch-block errors. Synchronous throws inside `fn` execute outside the ALS frame and produce undefined retry context. Content-retries via `shouldRetryOnContent` do NOT fire `onRetry` — if a future caller wires content retries, extend retry.ts to fire onRetry on that path too. Callback errors are swallowed and logged via debugLogger per I7.").
- Add `RetryAttemptInfo` interface (`attempt: number`, `error: unknown`, `errorStatus?: number`, `delayMs: number`).
- Track `requestEntryTime = Date.now()` at function entry; track `retryTotalDelayMs` as accumulator updated AFTER each delay completes.
- Wrap the `await fn()` call in `retryContext.run({ attempt: reportedAttempt, retryTotalDelayMs, requestSetupMs }, () => fn())` where:
  - `reportedAttempt = shouldPersist ? persistentAttempt + 1 : attempt` (per I2 — `persistentAttempt` is bumped inside the catch, so the next iteration's call sees the incremented value as "this attempt's number").
  - `requestSetupMs = Date.now() - requestEntryTime` — computed inline at attempt entry (per I1).
- Invoke `options.onRetry?.({ attempt: reportedAttempt, error, errorStatus, delayMs: actualDelay })` after each failed attempt's delay is computed but BEFORE sleep — gives caller the info needed to emit `ApiRetryEvent`. (Both normal-retry and persistent-retry paths.)

**`packages/core/src/telemetry/types.ts`**:
- Add `ApiRetryEvent` class (constructor opts + `event.name`, `event.timestamp`, `model`, `prompt_id?`, `attempt_number`, `error_type`, `error_message`, `status_code?`, `retry_delay_ms`, `duration_ms`, **`subagent_name?`** per I12).
- Constructor opts mirror `ApiErrorEvent` shape (`types.ts:299-321`): accept `{ model, promptId?, attemptNumber, error, statusCode?, retryDelayMs, subagentName? }`. The caller reads `subagentNameContext.getStore()` and passes `subagentName` (parallel to how `ApiResponseEvent` is constructed in `loggingContentGenerator.ts:137`).
- JSDoc explicitly cross-references `ContentRetryEvent` per B3: "Emitted by `retryWithBackoff` for HTTP-status retries (429/5xx). Distinct from `ContentRetryEvent`, which is emitted by `geminiChat`'s for-loop for `InvalidStreamError` retries that go through a separate retry budget. A single user prompt may emit both events; sum across event types to count total retries per prompt_id."
- JSDoc on `duration_ms` field (per D5): "Reports the backoff delay following this failed attempt (NOT the attempt's own duration). The attempt's duration lives on its `qwen-code.llm_request` span's `duration_ms` attribute. Setting this to `retry_delay_ms` makes the LogToSpanProcessor bridge span visualize the sleep window between the failed and next attempt in the trace timeline."
- Add to the discriminated union of telemetry events.

**`packages/core/src/telemetry/constants.ts`**:
- Add `EVENT_API_RETRY = 'qwen-code.api_retry'`.

**`packages/core/src/telemetry/loggers.ts`** (per I8 — three-step pattern, not just QwenLogger delegation):
- Add `logApiRetry(config, event)` mirroring `logContentRetry` (`loggers.ts:715-735`):
  1. `QwenLogger.getInstance(config)?.logApiRetryEvent(event)` (RUM)
  2. `if (!isTelemetrySdkInitialized()) return;` then build `LogAttributes` (`...getCommonAttributes(config), ...event, 'event.name': EVENT_API_RETRY`) and emit via `logger.emit(logRecord)` (OTel log signal — bridged to span by `LogToSpanProcessor`)
  3. `recordApiRetry(config)` Counter increment

**`packages/core/src/telemetry/metrics.ts`** (per I8 + I11 — new metric counter, must be a FULL definition not just a recording function):
- Add constant `API_RETRY_COUNT = `${SERVICE_NAME}.api.retry.count``
- Declare `let apiRetryCounter: Counter | undefined`
- Add entry to `COUNTER_DEFINITIONS` map (line 71) — this is what `initializeMetrics()` reads to actually create the counter at startup. Without this entry the counter stays undefined and `recordApiRetry` is a no-op.
- Add `recordApiRetry(config: Config, attrs: { model: string }): void` function. Signature TAKES the attribute object (not just bare config) — diverges from `recordContentRetry`'s zero-dimension shape. Mirror the `recordApiResponse` / `recordTokenUsageMetrics` pattern instead.
- Export from `telemetry/index.ts`.

**`packages/core/src/telemetry/qwen-logger/qwen-logger.ts`**:
- Add `logApiRetryEvent(event)` for RUM downstream consistency (matches the `logContentRetryEvent` pattern that already exists).

**`packages/core/src/core/loggingContentGenerator/loggingContentGenerator.ts`**:
- In `generateContent` and `generateContentStream`, read `retryContext.getStore()` in the **synchronous prelude** (BEFORE the first `await`) into a method-local const `retryInfo`. This is the only point where the ALS frame from `retryWithBackoff` is guaranteed to be active for the streaming path — once the function returns an `AsyncGenerator`, the caller iterates AFTER `retryWithBackoff` has resolved and the ALS frame has exited.
- **Pass `retryInfo` as an explicit PARAMETER to `loggingStreamWrapper`** — do NOT rely on `context.with` propagation. The wrapper's closure carries `retryInfo` to every `endLLMRequestSpan` callsite (success path in finally, error path in catch, idle-timeout `setTimeout`, early-error path).
- Forward shape (per I6 — default `attempt: 1` when ALS absent):
  - `attempt: retryInfo?.attempt ?? 1`
  - `requestSetupMs: retryInfo?.requestSetupMs` (undefined when ALS absent — no retry context means no setup-time-before-attempt to report)
  - `retryTotalDelayMs: retryInfo?.retryTotalDelayMs` (undefined when ALS absent)
- All field-emission decisions live in `endLLMRequestSpan` (`session-tracing.ts`); LoggingContentGenerator only forwards.

**`packages/core/src/telemetry/session-tracing.ts`** (Phase 4a code correctness fix — per B1, B2):
- Change `sampling_ms` formula from `duration_ms - ttftMs - (requestSetupMs ?? 0)` to `duration_ms - ttftMs`. Drop the setup subtraction — `duration_ms` already covers only the per-attempt `ttft + sampling` window; subtracting `requestSetupMs` (which is BEFORE the span started) is double-counting. The Phase 4a "no retry → setup=0 → formula yields correct value" was coincidence; Phase 4b's non-zero setup exposes the bug.
- Update `LLMRequestMetadata.requestSetupMs` JSDoc (per B2) to "Time from `retryWithBackoff` entry to THIS attempt's start (ms). On a successful attempt this doubles as total retry overhead. On a failed attempt this is the cumulative time elapsed in the retry budget at the moment this attempt fired. Undefined when no retry context exists (direct call, warmup, side-query)."
- Update `LLMRequestMetadata.attempt` JSDoc to remove the "1 = no retries" wording — now it's always populated as ≥1 by LoggingContentGenerator regardless of retry context (per I6).
- Existing Phase 4a tests that assert `sampling_ms = duration - ttft - setup` MUST be updated to assert `sampling_ms = duration - ttft`. The "clamps to 0 on clock skew" test stays valid (`Math.max(0, ...)` is still there).

**4 caller wiring sites** — add `onRetry` callback that emits `ApiRetryEvent`:
- `packages/core/src/core/client.ts:2109` (generateContent)
- `packages/core/src/core/baseLlmClient.ts:235` (generateJson)
- `packages/core/src/core/baseLlmClient.ts:333` (generateText)
- `packages/core/src/core/geminiChat.ts:2035` (streaming)

Each call site passes:
```ts
onRetry: (info) => {
  logApiRetry(this.config, new ApiRetryEvent({
    model,
    promptId,
    attemptNumber: info.attempt,
    error: info.error,
    statusCode: info.errorStatus,
    retryDelayMs: info.delayMs,
    subagentName: subagentNameContext.getStore(),  // per I12
  }));
}
```

Note: `packages/channels/weixin/src/api.ts` has a LOCAL `retryWithBackoff` function (`api.ts:57`), NOT the import from `utils/retry.ts`. Verified by grep — no shared codepath. Non-LLM safety guaranteed without any opt-in mechanism.

### Test files to add/extend

- **`packages/core/src/utils/retry.test.ts`** — extend with:
  - `retryContext` is set per attempt with monotonically increasing `attempt`
  - `retryTotalDelayMs` accumulates correctly (verify with mock delays)
  - `requestSetupMs` increases monotonically across attempts (= attemptStart - retryEntry)
  - `onRetry` callback fires per failed attempt with correct args (normal path)
  - Absence of `onRetry` is silent (no telemetry events emitted)
  - When `fn` succeeds first try, `onRetry` is never called; `retryContext.attempt === 1` and `requestSetupMs === 0` and `retryTotalDelayMs === 0` are set during the call
  - **Monotonic `iterationCount` is what ALS sees** (I2+I10 superseded): persistent-mode 7th iteration reports `attempt: 7`; mixed-error sequences (500 → 429 → 500) report 1, 2, 3 — no flip-flopping
  - **Parallel retryWithBackoff calls maintain independent attempt counters** (I4.1) — two calls via `Promise.all` each see their own ALS values; no cross-contamination
  - **Nested retryWithBackoff reads innermost frame** (I4.2) — inner call's ALS values are what `fn` sees; outer values invisible inside
  - **`shouldRetryOnError` returns false on attempt 2** (I4.3) — onRetry NOT called for the failing attempt 2; retry loop exits without further events; LLM span (if any) shows `attempt=2, success=false`
  - **`onRetry` callback throwing does NOT break retry loop** (I7) — mock `onRetry` to throw an Error, verify retry continues normally and the user-visible result is the eventual success/exhaustion outcome; verify `debugLogger.warn` was called with the swallowed error

- **`packages/core/src/telemetry/loggers.test.ts`** — extend with:
  - `logApiRetry` calls all 3 sinks (per I8): QwenLogger `logApiRetryEvent`, `logger.emit(logRecord)` with `event.name === EVENT_API_RETRY`, and `recordApiRetry` metric counter
  - LogRecord body and attributes match expected payload (mirror `logContentRetry` test pattern)
  - When `isTelemetrySdkInitialized()` returns false, QwenLogger still called but `logger.emit` and metric counter are NOT invoked (parity with existing pattern)
  - `ApiRetryEvent` carrying `subagent_name` propagates the field through to the emitted LogRecord attributes (per I12)

- **`packages/core/src/telemetry/metrics.test.ts`** — extend with (per I11):
  - `apiRetryCounter` is initialized when SDK starts
  - `recordApiRetry(config, {model: 'qwen3'})` increments the counter with `{model}` attribute
  - Counter is no-op when SDK not initialized

- **`packages/core/src/core/loggingContentGenerator/loggingContentGenerator.test.ts`** — extend with:
  - When invoked inside a `retryContext.run({attempt:3, requestSetupMs:1200, retryTotalDelayMs:1000}, ...)` frame, `endLLMRequestSpan` receives those exact values in metadata
  - Outside any retry frame, `endLLMRequestSpan` receives `attempt: 1`, `requestSetupMs: undefined`, `retryTotalDelayMs: undefined` (per I6 default for attempt; per the "no retry context" semantic for setup/delay)
  - **Idle-timeout path** (I3): set up a stream wrapper, fire the idle timeout, verify the `endLLMRequestSpan` call inside `setTimeout` receives the same retry context as the entry-time read (proves the closure-capture works)
  - **Concurrent stream calls** (Phase 4a guarantee re-verified for Phase 4b): two parallel `generateContentStream` calls inside two different retry contexts produce two LLM spans with their respective retry context values; no cross-contamination

- **Phase 4a `session-tracing.test.ts` updates** (per B1):
  - Update the "endLLMRequestSpan derives sampling_ms accounting for requestSetupMs" test — new expectation is `sampling_ms = duration - ttftMs` (no setup subtraction). The Phase 4a behavior was a bug masked by `requestSetupMs` always being undefined.
  - Add a test: "endLLMRequestSpan does NOT subtract requestSetupMs from sampling_ms" with `ttftMs=200, requestSetupMs=300, durationMs=1000` → expect `sampling_ms=800` (was 500 under buggy formula).
  - **Rewrite the "clamps sampling_ms to 0 when ttft + setup exceed duration" test inputs** (per B4): old inputs `ttftMs: 800, requestSetupMs: 500, durationMs: 1000` no longer trigger the clamp under the new formula (`1000 - 800 = 200`, no clamping). New inputs: `ttftMs: 1500, durationMs: 1000` (drop requestSetupMs) → `1000 - 1500 = -500 → max(0, ...) = 0`. Rename test to "clamps sampling_ms to 0 when ttft exceeds duration (clock skew)".

- **`packages/core/src/telemetry/types.test.ts`** (or wherever events are tested) — verify `ApiRetryEvent` constructor populates all expected fields with correct types.

### LOC estimate

| File                                                              | Type    | LOC est |
| ----------------------------------------------------------------- | ------- | ------- |
| `packages/core/src/utils/retryContext.ts`                          | NEW     | +30     |
| `packages/core/src/utils/retry.ts`                                 | extend  | +50     |
| `packages/core/src/utils/retry.test.ts`                            | extend  | +100    |
| `packages/core/src/telemetry/constants.ts`                         | extend  | +2      |
| `packages/core/src/telemetry/types.ts`                             | extend  | +40     |
| `packages/core/src/telemetry/loggers.ts`                           | extend  | +25     |
| `packages/core/src/telemetry/metrics.ts`                           | extend  | +25     |
| `packages/core/src/telemetry/metrics.test.ts`                      | extend  | +20     |
| `packages/core/src/telemetry/index.ts`                             | extend  | +2      |
| `packages/core/src/telemetry/loggers.test.ts`                      | extend  | +40     |
| `packages/core/src/telemetry/qwen-logger/qwen-logger.ts`           | extend  | +20     |
| `packages/core/src/core/loggingContentGenerator/loggingContentGenerator.ts` | extend  | +30 |
| `packages/core/src/core/loggingContentGenerator/loggingContentGenerator.test.ts` | extend  | +60 |
| `packages/core/src/core/client.ts`                                 | extend  | +20     |
| `packages/core/src/core/baseLlmClient.ts`                          | extend  | +40     |
| `packages/core/src/core/geminiChat.ts`                             | extend  | +20     |
| `packages/core/src/telemetry/session-tracing.ts`                   | fix     | +10     |
| `packages/core/src/telemetry/session-tracing.test.ts`              | update  | +20     |

Total: ~500 LOC (production code ~280, tests ~220). Matches the design doc's 250 LOC estimate within a factor of ~2; the doc underestimated the test coverage and downstream consumer count for the event class. Phase 4a `sampling_ms` fix (B1) adds ~30 LOC across `session-tracing.ts` + its tests.

## Out of scope (deferred)

- **Persistent retry mode cap on event emission** — 50+ event flooding under `QWEN_CODE_UNATTENDED_RETRY`. Deferred per design doc; not blocking.
- **`TOKEN_PROCESSING` phase** — never used (Phase 4c may revisit).
- **`recordApiRequestBreakdown()` activation** — Phase 4c.
- **Migrating `ContentRetryEvent` consumers** — coexists with `ApiRetryEvent`; different layers fire each.
- **SDK-level retries** (openai SDK `maxRetries=3`, google-genai SDK internal retries) — invisible; not Phase 4b scope.

## Verification

1. **Unit tests pass**: `npx vitest run src/utils/retry.test.ts src/telemetry/ src/core/loggingContentGenerator/` — all green, including ~10 new test cases across retry + telemetry + loggingContentGenerator.
2. **Type-check**: `cd packages/core && npx tsc --noEmit` exits 0.
3. **Lint**: `npx eslint <changed files>` exits 0.
4. **Manual smoke test** (optional, can defer to CI): set `OTEL_EXPORTER_OTLP_ENDPOINT`, run a Qwen Code session that triggers a 429 retry (use a mocked provider or contrived `shouldRetryOnError`), inspect the emitted trace — should see N `qwen-code.llm_request` spans (1 success + N-1 failed) and N-1 `qwen-code.api_retry` bridge spans nested under the active LLM span.
5. **`channels/weixin/src/api.ts` regression check**: read the file, confirm no `ApiRetryEvent` shows up when weixin retries fire (no `onRetry` opt-in there).

## Design doc revision

The Phase 4 design doc (`docs/design/telemetry-llm-request-timing-design.md`) currently describes Phase 4b's aggregation as "the retry layer populates an accumulator". Update it to reflect the ALS-based approach:

- D4 — rewrite the "Lifecycle wiring" section to use `retryContext` ALS instead of an in-`LoggingContentGenerator` accumulator
- Add a "Discovery: retry layer is above LoggingContentGenerator" sub-section under D4
- Update the Files-to-change table to include `retryContext.ts`

Doc edit can land in the Phase 4b PR.

## PR plan

Single PR (~500 LOC). If reviewers push back on size, defensible to split:
- 4b1 (~200 LOC): `retryContext.ts` + `retry.ts` ALS wiring + `session-tracing.ts` sampling_ms fix + tests + `LoggingContentGenerator` reads + tests
- 4b2 (~300 LOC): `ApiRetryEvent` + `logApiRetry` + qwen-logger + 4 caller wiring + tests

Recommend single PR — the two halves don't make sense without each other (ALS without event = silent retry telemetry; event without ALS = no aggregated span fields). The Phase 4a `sampling_ms` formula fix MUST go with 4b1 because Phase 4b is what surfaces the bug.

**PR description must call out**:
1. Phase 4a hidden bug fix (`sampling_ms` formula) — explain that the formula was silently wrong but masked by `requestSetupMs` always being undefined; Phase 4b's populated `requestSetupMs` would have produced negative-clamped-to-0 values without this fix.
2. `ApiRetryEvent` vs `ContentRetryEvent` coexistence — sample trace screenshot showing both event types under one `prompt_id`.
3. SDK-internal retries (openai/google-genai `maxRetries=3`) remain invisible — operator awareness.

Branch: `feat/telemetry-phase-4b-retry-visibility` (off latest main, fresh worktree — currently on `worktree-phase-4b-retry-telemetry`).

Issue link: closes part of #4413 (Phase 4b checklist items in #3731).

## Final Implementation Status

- **PR #4417**: MERGED (2026-05-22) — "feat(telemetry): Phase 4a — TTFT capture + GenAI semconv dual-emit (#3731)"
- **Phase 4b (this plan)**: No PR submitted yet. Phase 4a landed successfully; Phase 4b retry telemetry remains unimplemented.
- **What was implemented**: Phase 4a delivered TTFT capture, GenAI semconv dual-emit, and the placeholder fields (`attempt`, `requestSetupMs`, `retryTotalDelayMs`) in `session-tracing.ts` and `loggingContentGenerator.ts`.
- **Key divergence**: This plan (Phase 4b — ALS-based retry context, `ApiRetryEvent`, `onRetry` callback, `sampling_ms` formula fix) has not been implemented yet. The plan remains valid as a future work item.
- **Files changed in #4417**: `loggingContentGenerator.ts`, `streamContentDetection.ts`, `session-tracing.ts`, `telemetry-llm-request-timing-design.md` + tests.
