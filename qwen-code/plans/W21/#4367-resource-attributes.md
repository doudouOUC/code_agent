# Implementation Plan — Outbound trace + session header propagation (#4384)

## Context

Issue [#4384](https://github.com/QwenLM/qwen-code/issues/4384) (P3 sub-issue of #3731). Today qwen-code spans/logs/metrics carry `session.id` (after #4367), but the **outbound HTTP requests to LLM services carry no correlation headers**:

- No `traceparent` → trace context dies at qwen-code boundary; server-side tracing (e.g. ARMS Tracing serving DashScope) can't link its span to qwen-code's trace
- No `X-Qwen-Code-Session-Id` → server-side ingestion can't correlate observed LLM requests with qwen-code session metric/log records

This plan implements both, following design doc [`docs/design/telemetry-outbound-propagation-design.md`](../../Projects/qwen-code/.claude/worktrees/purring-marinating-sparrow/docs/design/telemetry-outbound-propagation-design.md) (already in the worktree). Critical design decision (from R1 self-review): use **fetch wrapper per-request** for OpenAI/Anthropic to avoid session-id staleness after `/clear`; Gemini falls back to static headers because `@google/genai` HttpOptions doesn't expose a `fetch` hook (documented limitation §8.6).

## PR split

Two PRs per design §6 (PR 1 first, additive low-risk; PR 2 adds product value):

- **PR A — `traceparent` via undici instrumentation** (Part A, structural, no behavior change for existing flows)
- **PR B — `X-Qwen-Code-Session-Id` via fetch wrapper + static headers** (Part B, touches 4 SDK construction sites)

PR A and PR B are technically independent; landing in this order is preferred (PR A is OTel-standard and immediately useful to any OTel-aware backend; PR B needs server-side recognition).

Could bundle into one PR if review economics favour — flag as a question for the user if they want.

## PR A — `traceparent` via UndiciInstrumentation

### Files

| File | Change |
|---|---|
| `packages/core/package.json` | Add `"@opentelemetry/instrumentation-undici": "^0.203.0"` (matches existing OTel experimental train; same version as `instrumentation-http`) |
| `packages/core/src/telemetry/sdk.ts` | Import `UndiciInstrumentation`; add to `instrumentations: [...]` at line 330; configure `ignoreRequestHook` to skip OTLP exporter endpoints |
| `packages/core/src/telemetry/sdk.test.ts` | Add tests for: instrumentation registration; `ignoreRequestHook` correctly skips configured OTLP endpoints; doesn't skip non-OTLP URLs |
| `docs/developers/development/telemetry.md` | Add short subsection "Trace context propagation" explaining that `traceparent` is now sent on outbound LLM requests + the OTLP feedback-loop skip |

### Key code shape (sdk.ts)

Build OTLP url list once (strip trailing `/` and `?query=...` per §8.2 of design):

```ts
const otlpUrls = [
  config.getTelemetryOtlpEndpoint(),
  config.getTelemetryOtlpTracesEndpoint(),
  config.getTelemetryOtlpLogsEndpoint(),
  config.getTelemetryOtlpMetricsEndpoint(),
]
  .filter((u): u is string => !!u)
  .map((u) => u.replace(/\?.*$/, '').replace(/\/$/, ''));

instrumentations: [
  new HttpInstrumentation(),
  new UndiciInstrumentation({
    ignoreRequestHook: (request) => {
      const url = `${request.origin}${request.path.replace(/\?.*$/, '')}`;
      return otlpUrls.some((e) => url.startsWith(e));
    },
  }),
],
```

Default propagator (W3C tracecontext + baggage) is what we want — verified no `textMapPropagator` is set elsewhere; we do not need to change it.

### Test strategy (sdk.test.ts)

Use existing `vi.mocked(NodeSDK).mock.calls[0]![0]!` pattern (already used for resource attribute assertions at lines 437-443 — verified). Add 3 tests:

- `instrumentations` array contains `HttpInstrumentation` AND `UndiciInstrumentation` instances
- `ignoreRequestHook` returns `true` for a configured OTLP traces endpoint URL
- `ignoreRequestHook` returns `false` for a DashScope LLM endpoint URL

## PR B — `X-Qwen-Code-Session-Id` header

### Files

| File | Change |
|---|---|
| `packages/core/src/telemetry/llm-correlation-fetch.ts` (NEW) | Export `wrapFetchWithCorrelation(baseFetch, config)` + `staticCorrelationHeaders(config)` helpers (per design §4.3 helper code, including empty-sessionId guard) |
| `packages/core/src/telemetry/llm-correlation-fetch.test.ts` (NEW) | Unit tests per design §7.2 — covers telemetry on/off; spoof override; **session reset regression test** (critical for staleness fix) |
| `packages/core/src/core/openaiContentGenerator/provider/default.ts` | In `buildClient()` (line ~76): wrap fetch — `const baseFetch = (runtimeOptions as { fetch?: typeof fetch })?.fetch ?? globalThis.fetch;` then add `fetch: wrapFetchWithCorrelation(baseFetch, this.cliConfig)` AFTER the `...runtimeOptions` spread so we override |
| `packages/core/src/core/openaiContentGenerator/provider/dashscope.ts` | Same pattern in its overriding `buildClient()` at line ~126 |
| `packages/core/src/core/anthropicContentGenerator/anthropicContentGenerator.ts` | Same pattern at the `new Anthropic({...runtimeOptions})` site (line ~205); uses `this.cliConfig` (line 169) which is already in scope |
| `packages/core/src/core/geminiContentGenerator/index.ts` (factory) | Merge `staticCorrelationHeaders(gcConfig)` into `httpOptions.headers` at line ~32 (gcConfig already in scope per line 33); does NOT modify the class file |
| `packages/core/src/core/openaiContentGenerator/provider/default.test.ts` | Add assertion: telemetry-on construction passes a function for `fetch` (the wrapper); wrapped fetch when called with a mock baseFetch attaches `X-Qwen-Code-Session-Id` |
| `packages/core/src/core/openaiContentGenerator/provider/dashscope.test.ts` | Same as default |
| `packages/core/src/core/anthropicContentGenerator/anthropicContentGenerator.test.ts` | Same — assert wrapped `fetch` via `anthropicMockState.constructorOptions?.fetch` |
| `packages/core/src/core/geminiContentGenerator/index.test.ts` | Assert `GoogleGenAI` constructor's `httpOptions.headers` contains `X-Qwen-Code-Session-Id` when telemetry-on; doesn't contain it when telemetry-off |
| `docs/developers/development/telemetry.md` | Extend "Trace context propagation" subsection with session id header section + note Gemini limitation (§8.6 of design) |

### Audited but no change needed (note in PR description)

- `packages/core/src/qwen/qwenContentGenerator.ts` — extends `OpenAIContentGenerator`, uses `DashScopeOpenAICompatibleProvider` → inherits dashscope change automatically
- `packages/core/src/core/loggingContentGenerator/loggingContentGenerator.ts` — wrapper, doesn't construct SDK clients
- 5 other OpenAI providers (deepseek, minimax, mistral, modelscope, openrouter) — inherit from `DefaultOpenAICompatibleProvider`; openrouter's `override buildHeaders()` calls `super.buildHeaders()` (verified at openrouter.ts:22), so all inherit base `buildClient()` change

### Key test additions

**`llm-correlation-fetch.test.ts`** (the staleness regression test is the critical one):

```ts
it('reads fresh session id after session reset (staleness regression)', async () => {
  const config = mockConfig({ getSessionId: () => 'sess-A', getTelemetryEnabled: () => true });
  const baseFetch = vi.fn(async () => new Response());
  const wrapped = wrapFetchWithCorrelation(baseFetch, config);
  await wrapped('https://api.example.com/v1');
  expect(baseFetch.mock.calls[0][1].headers.get('X-Qwen-Code-Session-Id')).toBe('sess-A');
  // Simulate /clear changing the session id
  config.getSessionId = () => 'sess-B';
  await wrapped('https://api.example.com/v1');
  expect(baseFetch.mock.calls[1][1].headers.get('X-Qwen-Code-Session-Id')).toBe('sess-B');
});
```

## Verification

Per design §7, in order of cost:

1. **Unit tests** — `npx vitest run src/telemetry/ src/core/openaiContentGenerator/ src/core/geminiContentGenerator/ src/core/anthropicContentGenerator/` — should add ~12-15 new tests across the 5 test files; existing tests must continue passing
2. **Cross-package test sweep** — `npx vitest run` from `packages/core/` to confirm no regressions outside telemetry
3. **E2E verify script** — write `scripts/verify-telemetry-pr-4384.mjs` (modelled on `/tmp/verify-telemetry-pr-4367.mjs`) that:
   - Starts a local `http.createServer` to capture inbound request headers
   - Points OpenAI SDK's `baseURL` at the local server
   - Triggers `client.chat.completions.create(...)` with a minimal mock response from the server
   - Asserts captured headers contain both `traceparent: 00-...` and `X-Qwen-Code-Session-Id: <sessionId>`
   - **Staleness regression**: emit one request, call `config.resetSession(...)`, emit another, assert request 2's header has the new session id
   - Also asserts the OTLP collector mock at a different port does NOT see `traceparent` injection (verifies `ignoreRequestHook`)
4. **Streaming compatibility** — manual run: `qwen -p "tell me a story"` with telemetry enabled + outfile, verify streaming chat works, no span leaks, file output contains complete client span
5. **Proxy mode** — set `https_proxy`, run with telemetry, verify request still has both headers (via local proxy access log if available)

## Out of scope (documented, follow-up sub-issues)

Per design §3.2 and §10:

- Subprocess `TRACEPARENT` env var inheritance for `BashTool` — separate sub-issue
- Inbound `TRACEPARENT` / `TRACESTATE` read on startup (for `--prompt` / Agent SDK) — separate sub-issue
- `X-Qwen-Code-Request-Id` per-request UUID — separate sub-issue
- **Gemini session-id staleness fix** (lazy-invalidate contentGenerator on session reset) — separate sub-issue; document the current limitation in `telemetry.md` + inline code comment at `geminiContentGenerator/index.ts` integration point

## Critical files to read (re-confirm before editing)

- `packages/core/src/telemetry/sdk.ts:150-340` (initializeTelemetry function)
- `packages/core/src/core/openaiContentGenerator/provider/default.ts:63-99` (buildHeaders + buildClient)
- `packages/core/src/core/openaiContentGenerator/provider/dashscope.ts:110-149` (override buildHeaders + buildClient)
- `packages/core/src/core/geminiContentGenerator/index.ts:30-58` (factory function)
- `packages/core/src/core/anthropicContentGenerator/anthropicContentGenerator.ts:167-216` (constructor + `new Anthropic({...})`)
- `packages/core/src/utils/runtimeFetchOptions.ts` (`fetch?: any` field on both OpenAI/Anthropic variants — verified)
- `packages/core/src/config/config.ts:1840-1870` (resetSession path — explains staleness scenario)

## Reused utilities

- `buildRuntimeFetchOptions(sdkType, proxyUrl)` from `packages/core/src/utils/runtimeFetchOptions.ts` — returns existing `fetch?` field we wrap (don't reinvent)
- `config.getTelemetryEnabled()` — gates header emission (consistent with #4367's gating pattern)
- `config.getSessionId()` — called per-request from fetch wrapper for freshness
- Existing test patterns: inline `as unknown as Config` casts + `vi.mock('openai'|'@anthropic-ai/sdk'|'@google/genai')` for SDK constructor interception (NOT `makeFakeConfig` — that's for higher-level integration tests)

## Final Implementation Status

- **PR status**: Dependency PR #4367 (custom resource attributes) MERGED on 2026-05-21. Issue #4384 (outbound trace + session header propagation) was CLOSED. No PR implementing this plan's outbound propagation was found.
- **What was implemented**: PR #4367 landed telemetry resource attributes and metric cardinality controls (touching `sdk.ts`, `config.ts`, `telemetry/config.ts`), but did NOT implement outbound `traceparent` injection or `X-Qwen-Code-Session-Id` header propagation to LLM services.
- **Key divergences**: The entire plan (PR A: UndiciInstrumentation for `traceparent`, PR B: fetch wrapper for `X-Qwen-Code-Session-Id` in OpenAI/Anthropic/Gemini providers, `llm-correlation-fetch.ts` helper) was not implemented. Issue #4384 was closed, possibly indicating the feature was deprioritized or deferred.
- **Current state**: Not implemented. Parent issue #3731 remains OPEN. Outbound LLM requests still carry no correlation headers.
