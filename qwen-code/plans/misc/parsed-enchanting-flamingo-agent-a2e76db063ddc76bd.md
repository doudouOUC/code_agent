# Third-Round Adversarial Audit: 6 New LLM Request Span Attributes

## Audit Scope
Plan to add `response_id`, `finish_reason`, `thoughts_token_count`, `subagent_name`, `error_type`, `error_status_code` to `qwen-code.llm_request` OTel spans across `session-tracing.ts` and `loggingContentGenerator.ts`.

---

## Question 1: Concurrency -- subagentNameContext capture timing

**Verdict: SAFE (no issue)**

`subagentNameContext` is an `AsyncLocalStorage<string>` (file: `packages/core/src/utils/subagentNameContext.ts`). `AgentCore` wraps its reasoning loop in `subagentNameContext.run(this.name, ...)`, propagating the correct name through the entire async call chain.

The plan captures `subagentNameContext.getStore()` into a closure variable inside `loggingStreamWrapper` (line 445 of `loggingContentGenerator.ts`). This method is an `async *` generator. Key observations:

1. **Variables are per-invocation**: `loggingStreamWrapper` is a generator method -- each call creates a new generator with its own closure scope. Two concurrent streams get two separate generators with two separate `subagentName` variables.

2. **Capture timing is correct**: The async generator body begins executing on the first `.next()` call. The first `.next()` is called from `geminiChat.ts`'s `for await (const chunk of stream)` loop (line 1531), which runs inside the `subagentNameContext.run(...)` scope from the owning AgentCore. The ALS propagates through the async chain, so `getStore()` returns the correct name.

3. **No cross-contamination**: Even if two concurrent generators have their `.next()` calls interleaved on different event-loop ticks, the ALS context is per-async-chain, not per-tick. Each generator's `.next()` runs within its originating subagent's ALS context.

No finding.

---

## Question 2: Memory leak from captured `lastError`

**Verdict: LOW RISK (no actionable issue)**

The plan captures `let lastError: unknown` inside `loggingStreamWrapper`. Lifecycle analysis:

1. `lastError` is set only in the `catch` block (line 579), which immediately re-throws.
2. The `finally` block (line 607) reads `lastError` to extract `error_type` / `error_status_code`, then the generator terminates.
3. After the generator terminates (either via `catch` re-throw or normal completion), the generator object is eligible for GC.

SDK error objects (e.g., OpenAI `APIError`) do hold references to the request body, but the error is already held on the call stack during `catch`/`finally` regardless. The closure variable extends the error's lifetime by at most the duration of `finally` block execution (microseconds). Once the generator is complete, nothing holds a strong reference to it -- `loggingStreamWrapper` is consumed by `geminiChat.ts`'s `for await` loop, and the loop variable goes out of scope on error.

The only concern would be if something held a reference to the generator object itself after it terminates, but no such pattern exists in the codebase.

No finding.

---

## Question 3: `finishReason` on aborted streams

**Verdict: LOW RISK (acceptable semantics)**

If abort fires mid-stream:

1. Before any chunk with `finishReason`: the variable stays `undefined`. The span records no `finish_reason` attribute. Correct.

2. After a chunk with `finishReason`: `finishReason` is only populated on the FINAL chunk in standard API contracts (Gemini, OpenAI, Anthropic). If a finishReason was received AND the stream was then aborted, it means the model had already signaled completion. The abort arrived after the final content chunk but before the consumer fully drained the stream. Recording the finishReason is actually correct in this case -- the model did finish.

3. Provider quirk: Some providers send `finishReason` on intermediate chunks (e.g., as a safety filter partial signal). But the plan uses the LAST-seen `finishReason`, which is the same approach used by `consolidateGeminiResponsesForLogging` (line 749-759) and `geminiChat.ts` (line 1532-1533). Consistency is maintained.

The span's `error` attribute (`API_CALL_ABORTED_SPAN_STATUS_MESSAGE`) already distinguishes aborted requests from normal completions. Dashboard queries should filter on `success` / `error` before interpreting `finish_reason`.

No finding.

---

## Question 4: Retry in geminiChat.ts -- span lifecycle

**Verdict: SAFE (each retry gets its own span)**

Traced the call chain:

1. `sendMessageStream` retry loop (line 1507-1793 of `geminiChat.ts`) calls `makeApiCallAndProcessStream` on each attempt.
2. `makeApiCallAndProcessStream` (line 2020) calls `this.config.getContentGenerator().generateContentStream(...)`.
3. `generateContentStream` (line 325 of `loggingContentGenerator.ts`) calls `startLLMRequestSpan` at line 329, creating a NEW span per invocation.
4. The `retryWithBackoff` wrapper inside `makeApiCallAndProcessStream` (line 2035) may also retry `apiCall`, each retry calling `generateContentStream` again.

Each call path is:
- Previous attempt's span: ended in `loggingStreamWrapper`'s `finally` block (line 615-631) when the stream errors or completes.
- New attempt's span: created fresh in `generateContentStream` -> `startLLMRequestSpan`.

There is no span reuse or attribute overwriting across retries. The plan's new attributes are set independently per span.

Additionally, the max-tokens escalation path (line 1804-1847) and recovery path (line 1854-1961) each call `makeApiCallAndProcessStream` again, getting their own spans.

No finding.

---

## Question 5: `thoughtsTokenCount` double-counting

**Verdict: REAL ISSUE -- pre-existing converter inconsistency surfaced by the plan**

The `@google/genai` type definition for `GenerateContentResponseUsageMetadata` says:

> `totalTokenCount`: The total number of tokens for the entire request. This is the sum of `prompt_token_count`, `candidates_token_count`, `tool_use_prompt_token_count`, and `thoughts_token_count`.

This means in the **native Gemini API**, `candidatesTokenCount` and `thoughtsTokenCount` are **non-overlapping** fields.

However, the OpenAI-to-Gemini converter in `packages/core/src/core/openaiContentGenerator/converter.ts` does this (lines 1118-1152 and 1315-1349):

```
candidatesTokenCount: finalCompletionTokens,   // = OpenAI completion_tokens
thoughtsTokenCount: thinkingTokens,             // = OpenAI reasoning_tokens
```

In OpenAI's API, `completion_tokens` **INCLUDES** `reasoning_tokens` as a subset. So the converter creates an inconsistency: `candidatesTokenCount` already contains `thoughtsTokenCount` for OpenAI providers, but they are separate for native Gemini.

**Impact on the plan**: The existing span attribute `output_tokens` comes from `candidatesTokenCount` (see `loggingContentGenerator.ts` line 620: `outputTokens: lastUsageMetadata?.candidatesTokenCount`). The plan adds a new `thoughts_token_count` attribute from `thoughtsTokenCount`. For OpenAI providers:
- `output_tokens` = 100 (includes 30 reasoning tokens)
- `thoughts_token_count` = 30

A dashboard computing `total_output = output_tokens + thoughts_token_count` would get 130 instead of the correct 100.

**Note**: This is a pre-existing inconsistency in the converter, not introduced by the plan. But the plan surfaces it into span attributes where dashboard consumers are more likely to compute derived metrics incorrectly. The same inconsistency already exists in `ApiResponseEvent` (file `packages/core/src/telemetry/types.ts`, line 378-380), where both `output_token_count` (from `candidatesTokenCount`) and `thoughts_token_count` (from `thoughtsTokenCount`) are recorded.

**Recommendation**: The plan should document this overlap in the `LLMRequestMetadata` field JSDoc for `thoughtsTokenCount`. Something like: "WARNING: For OpenAI-routed providers, this count is already included in `outputTokens` / `candidatesTokenCount`. For native Gemini, they are separate. Dashboard queries must not sum `output_tokens + thoughts_token_count`." Alternatively, fix the converter to subtract `reasoning_tokens` from `completion_tokens` when populating `candidatesTokenCount`, but that is a separate change with broader impact.

---

## Question 6: Span attribute size limits

**Verdict: NO NEW RISK (plan's additions are negligible)**

Counted all attributes on a fully-populated `llm_request` span:

**Start attributes** (startLLMRequestSpan, line 466-475): 5 keys
- `session.id`, `qwen-code.model`, `qwen-code.prompt_id`, `llm_request.context`, `gen_ai.request.model`

**Post-start** (generateContent/generateContentStream): 1 key
- `llm_request.stream`

**Detailed-span-attributes** (addSystemPromptAttributes, worst case): 5 keys
- `system_prompt_hash`, `system_prompt_preview`, `system_prompt_length`, `system_prompt`, `system_prompt_truncated`

**Detailed-span-attributes** (addToolSchemaAttributes): 2 keys + events
- `tools`, `tools_count` (tool_schema data goes into span events, not attributes)

**Detailed-span-attributes** (addModelOutputAttributes, worst case): 3 keys
- `response.model_output`, `response.model_output_truncated`, `response.model_output_original_length`

**End attributes** (endLLMRequestSpan, existing, worst case): 15 keys
- `duration_ms`, `input_tokens`, `gen_ai.usage.input_tokens`, `output_tokens`, `gen_ai.usage.output_tokens`, `cached_input_tokens`, `gen_ai.usage.cached_tokens`, `ttft_ms`, `gen_ai.server.time_to_first_token`, `request_setup_ms`, `attempt`, `retry_total_delay_ms`, `sampling_ms`, `output_tokens_per_second`, `success`, `error`

**Plan adds** (worst case): ~7 keys
- `response_id`, `finish_reason`, `gen_ai.response.finish_reasons` (semconv dual), `thoughts_token_count`, `subagent_name`, `error_type`, `error_status_code`

**Total**: ~38 attributes maximum. Well under the 128-attribute OTLP default limit.

**Byte size**: The large attributes are pre-existing: `system_prompt` (up to 60KB) and `response.model_output` (up to 60KB) from `detailed-span-attributes.ts`. The plan's new attributes are short strings and integers (negligible). The pre-existing detailed-span attributes already push per-span payload to ~120KB+ in worst case, which exceeds typical per-attribute-value limits (Jaeger ~64KB, OTLP default ~32KB per attribute value) but is handled by the existing `truncateContent` function. The plan introduces no new size concern.

No finding from the plan.

---

## Summary

| # | Question | Finding |
|---|----------|---------|
| 1 | subagentNameContext concurrency | Safe -- per-generator closure, correct ALS propagation |
| 2 | lastError memory leak | Low risk -- generator terminates immediately on error |
| 3 | finishReason on abort | Acceptable -- last-seen semantics match existing patterns |
| 4 | Retry span lifecycle | Safe -- each retry creates a new span |
| 5 | thoughtsTokenCount double-counting | **Pre-existing converter bug surfaced** -- needs JSDoc warning at minimum |
| 6 | Span attribute size limits | No new risk -- 38 attrs, well under 128 limit |

**One actionable finding**: The `thoughtsTokenCount` / `output_tokens` overlap for OpenAI providers (Question 5). Not a plan bug per se, but the plan should document it so dashboard authors do not miscompute totals.
