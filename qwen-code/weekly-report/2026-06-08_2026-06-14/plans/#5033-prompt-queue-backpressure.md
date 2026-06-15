# fix(serve): Add prompt queue backpressure

PR: #5033 | MERGED | +1677/-89 | 24 files

Source Codex artifacts:
- `.qwen/design/prompt-queue-backpressure.md`
- `.qwen/e2e-tests/prompt-queue-backpressure.md`

## Design Plan

### Summary

`qwen serve` now applies per-session prompt admission backpressure. The default limit is `5` pending prompts per session. A pending prompt is one that the daemon has accepted through `sendPrompt` and that has not settled yet, including prompts waiting in the per-session FIFO and the prompt currently executing.

`branchSession` remains serialized behind the same per-session FIFO, but it is not a prompt and does not consume this prompt limit.

### Semantics

- Default: `maxPendingPromptsPerSession = 5`.
- Disabled: `0` or `Infinity` means unlimited.
- Invalid: negative numbers, fractions, and `NaN` are rejected by bridge construction and `runQwenServe`. The CLI flag accepts non-negative integers; `0` disables the cap.
- Authority: the bridge is the admission gate. SDK-side accounting is an early-fail guard, not a replacement for server enforcement.
- Prompt deadline: `--prompt-deadline-ms` still applies only to prompts that were already accepted. It is not a queue admission cap.

### Bridge Behavior

`SessionEntry` tracks `pendingPromptCount`. `sendPrompt` is intentionally not `async`, so the admission check can throw synchronously before HTTP routes return `202 Accepted`.

Admission flow:

1. Look up the session.
2. Reject pre-aborted signals before incrementing the counter.
3. If `pendingPromptCount >= maxPendingPromptsPerSession`, throw `PromptQueueFullError`.
4. Increment the counter and enqueue the prompt on the FIFO.
5. Release the slot exactly once when the caller-visible prompt promise settles.

Failures do not poison the FIFO because the queue tail still swallows each prompt result. The original caller still receives the prompt rejection.

### HTTP Behavior

`POST /session/:id/prompt` catches synchronous `PromptQueueFullError` before emitting an accepted response. The route returns:

- Status: `503`
- Header: `Retry-After: 5`
- Body: `{ code: 'prompt_queue_full', error, sessionId, limit, pendingCount }`

No `promptId` is returned when admission fails.

`/capabilities` advertises:

```json
{
  "limits": {
    "maxPendingPromptsPerSession": 5
  }
}
```

When the cap is disabled, the advertised value is `null`.

### ACP HTTP Behavior

The ACP JSON-RPC transport maps `PromptQueueFullError` to a stable error shape instead of falling through to an unstructured internal error:

```json
{
  "data": {
    "errorKind": "prompt_queue_full",
    "sessionId": "...",
    "limit": 5,
    "pendingCount": 5
  }
}
```

### SDK Behavior

`DaemonClient` has a local per-session reservation for `prompt()` calls. It reserves before sending the HTTP request and releases on:

- legacy blocking `200` completion,
- non-blocking `202` turn completion,
- `turn_error`,
- caller abort,
- SSE end,
- fetch or response parsing failure.

`DaemonPendingPromptLimitError` means the SDK rejected locally and did not send the prompt request.

The SDK option accepts the numeric capability value directly; `null` disables the local cap to match `/capabilities.limits.maxPendingPromptsPerSession`.

`DaemonSessionClient` applies the same local limit for the long-lived subscription path. Static `createOrAttach`, `load`, and `resume` keep their existing parameter positions; direct construction may override the local cap.

### Implementation Delta

The PR also updates `docs/users/qwen-serve.md` so operators can discover `limits.maxPendingPromptsPerSession` and the `--max-pending-prompts-per-session` flag from the serve guide. The TypeScript SDK exports the new capability-limit type and `DaemonPendingPromptLimitError` from its public entrypoints, and the SDK build script was adjusted so the new exports are included in the generated package surface.

## E2E Test Plan

### Scope

Validate per-session prompt admission backpressure for `qwen serve`, REST clients, ACP HTTP clients, and the TypeScript SDK.

### Baseline

1. Start `qwen serve` with defaults.
2. Create a session.
3. Send one prompt.
4. Expected: prompt is accepted and the session emits normal turn events.

### Full Queue

1. Start `qwen serve` with defaults.
2. Create a session.
3. Hold one prompt active and enqueue four more prompts for the same session.
4. Send the sixth prompt.
5. Expected: the sixth request returns HTTP `503`, `Retry-After: 5`, and `code: "prompt_queue_full"`. The body includes `sessionId`, `limit: 5`, and `pendingCount: 5`. The response does not include `promptId`.

### Release Then Recover

1. Fill the default five pending prompt slots.
2. Let the active prompt complete or fail.
3. Send another prompt.
4. Expected: the new prompt is accepted after the previous slot is released.

### ACP HTTP

1. Send `session/prompt` through `/acp` while the same session has five pending prompts.
2. Expected: JSON-RPC returns stable error data with `errorKind: "prompt_queue_full"`, `limit`, `pendingCount`, and `sessionId`.

### SDK Local Guard

1. Construct `DaemonClient` with `maxPendingPromptsPerSession: 1`.
2. Use a daemon or fetch mock that accepts the first prompt with `202` and keeps its SSE stream pending.
3. Call `prompt()` again for the same session.
4. Expected: the SDK throws `DaemonPendingPromptLimitError` and does not issue the second fetch.

### Disabled Cap

1. Start `qwen serve --max-pending-prompts-per-session 0`.
2. Create a session.
3. Enqueue more than five prompts for the same session.
4. Expected: admission is not rejected by the prompt queue cap. `/capabilities.limits.maxPendingPromptsPerSession` is `null`.

### Verification Commands

```bash
cd packages/acp-bridge && npx vitest run src/bridge.test.ts
cd packages/cli && npx vitest run src/serve/server.test.ts src/serve/acpHttp/transport.test.ts
cd packages/sdk-typescript && npx vitest run test/unit/DaemonClient.test.ts test/unit/DaemonSessionClient.test.ts
npm run build && npm run typecheck
```

## Final Implementation Status

- **PR status**: MERGED — PR #5033 merged 2026-06-13.
- **Summary**: The implementation follows the design: bridge-side per-session admission is authoritative, REST returns stable `503 prompt_queue_full`, ACP maps the same condition to structured JSON-RPC error data, `/capabilities.limits.maxPendingPromptsPerSession` advertises the effective limit, and the TypeScript SDK adds local reservation as an early-fail guard.
- **Key divergences**: No material divergence. The final diff grew to 24 files because the public SDK/package surface and serve user docs were updated alongside the bridge, REST, ACP, and SDK behavior.
