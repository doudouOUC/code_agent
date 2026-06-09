# T2.9 — Prompt absolute deadline + SSE writer idle timeout

Tracking: [#4514](https://github.com/QwenLM/qwen-code/issues/4514) · row T2.9 (⭐⭐ S, v0.16-alpha known-limit)

## Context

`qwen serve` today has two timeout-related gaps explicitly called out as `FIXME(stage-2)` / "Stage 2 may add" in code:

1. **No prompt absolute deadline.** `httpAcpBridge.ts:2689-2697` notes a buggy agent that ignores `cancel()` while keeping the channel alive can hold the prompt race open indefinitely. The 15s SSE heartbeat + AbortController only react to *client disconnect*, not server-side staleness.
2. **No SSE writer idle deadline.** `server.ts:1770-1776` notes the heartbeat detects TCP back-pressure death but cannot detect a writer that's been blocked on `drain` for minutes. The 15s heartbeat is a write-attempt; a stuck writer never completes the heartbeat write either.

Both gates are needed for remote / long-running deployments where local-loopback assumptions break down. Both are off-by-default — preserves current behavior, opt-in for ops.

## Design

### Two features, two CLI flags

**A. Prompt absolute deadline** — wallclock cap from prompt receipt to completion.
- CLI: `--prompt-deadline-ms <n>` · env: `QWEN_SERVE_PROMPT_DEADLINE_MS`
- Default: `0` = unlimited (current behavior)
- Per-prompt override: optional `deadlineMs` field on `POST /session/:id/prompt` body, **capped** to flag value (request can shorten, never extend)
- On fire: `abort.abort(new DeadlineExceededError(...))` → existing abort path runs (cancels permission, calls `bridge.cancel`); HTTP response: `504 Gateway Timeout` with `{errorKind: 'prompt_deadline_exceeded', deadlineMs}`; SSE event: existing `prompt_cancelled` frame with `{reason: 'deadline_exceeded'}`

**B. SSE writer idle timeout** — last-successful-flush-tracking per connection.
- CLI: `--writer-idle-timeout-ms <n>` · env: `QWEN_SERVE_WRITER_IDLE_TIMEOUT_MS`
- Default: `0` = unlimited (current behavior)
- Track `lastWriteAt` updated inside `doWrite` success path (server.ts:1703-1756 chain)
- Second timer alongside the 15s heartbeat checks `Date.now() - lastWriteAt > timeout`
- On fire: emit terminal `client_evicted` frame with `{reason: 'writer_idle_timeout', lastWriteAt}` (reuse the existing eviction taxonomy from `eventBus.ts:227-256`), then `cleanup()` → close stream + `abort.abort()`
- **Distinction from heartbeat:** heartbeat = "try to ping every 15s"; idle timeout = "if no flush *succeeded* within N ms (N >> 15s), force-evict"

### Naming convention

Following the precedent set by `--event-ring-size` (raw number) and the `_ms` suffix convention used in `runQwenServe.ts`'s `SHUTDOWN_FORCE_CLOSE_MS`. Skip the humanized `30m` form the FIXME suggests for now — keep raw ms for parity with existing numeric flags (can add a parser later without breaking).

### New error kinds — added to both registries (mirrored)

- `prompt_deadline_exceeded`
- `writer_idle_timeout`

### New capability tags (snake_case, stable, no `unstable_` prefix)

- `prompt_absolute_deadline` — only advertised when flag > 0 (conditional)
- `writer_idle_timeout` — only advertised when flag > 0 (conditional)

Use the `CONDITIONAL_SERVE_FEATURES` Map pattern from `capabilities.ts:230-234` (same way `require_auth` works).

## Files to modify

| # | File | Change |
|---|---|---|
| 1 | `packages/acp-bridge/src/status.ts` | Add `prompt_deadline_exceeded`, `writer_idle_timeout` to `SERVE_ERROR_KINDS` |
| 2 | `packages/sdk-typescript/src/daemon/types.ts` | Mirror error kinds in `DAEMON_ERROR_KINDS`; add optional `deadlineMs` to `PromptRequest` |
| 3 | `packages/cli/src/serve/types.ts` | Add `promptDeadlineMs?: number`, `writerIdleTimeoutMs?: number` to `ServeOptions` |
| 4 | `packages/cli/src/commands/serve.ts` | Add two yargs `.option(...)` definitions, wire into `ServeArgs` interface, thread to `runQwenServe()` |
| 5 | `packages/cli/src/runQwenServe.ts` | Read env-var fallbacks, pass to `createServeApp` |
| 6 | `packages/cli/src/serve/capabilities.ts` | Register 2 capability tags + add to `CONDITIONAL_SERVE_FEATURES` (predicate: flag > 0) |
| 7 | `packages/cli/src/serve/server.ts` | Implement deadline timer in prompt handler (~L1094-1190), implement idle-timeout timer in SSE handler (~L1625-1837) |
| 8 | `packages/cli/src/serve/server.test.ts` | Tests with `vi.useFakeTimers()` (introduce the pattern) |
| 9 | `packages/cli/src/serve/httpAcpBridge.test.ts` | Test `deadlineMs` override capping if logic lives there |
| 10 | `docs/users/qwen-serve.md` | Update L230-241 known-gap section: document both flags + remove the "Stage 2 will add..." line |

## Reuse / don't reinvent

- `writeChain` + `doWrite` + backpressure (server.ts:1703-1756) — hook `lastWriteAt` *inside* `doWrite` success path
- `cleanup()` (server.ts:1786-1790) — already aborts + clears heartbeat; just call it on idle timeout
- `client_evicted` frame format (eventBus.ts:240) — extend with new `reason` value, no new event type
- `prompt_cancelled` SSE event — reuse with new `reason` value
- `sendBridgeError` (server.ts:2353+) — emits the typed `errorKind` JSON; just pass new kind
- Conditional-capability pattern (capabilities.ts:230-234, `require_auth`)
- yargs flag pattern: copy `--event-ring-size` block in `commands/serve.ts:109-122`

## Tests

In `server.test.ts`, introduce `vi.useFakeTimers()` (no precedent, but vitest standard) for the timing-sensitive cases:

1. **Prompt deadline fires** — flag = 100ms, slow `FakeBridge.sendPrompt` resolves at 500ms → response is 504 with `errorKind: 'prompt_deadline_exceeded'`, abort signal fired
2. **Per-prompt deadline cap** — flag = 1000ms, request body `deadlineMs: 500` → 500ms wins
3. **Per-prompt cannot extend** — flag = 500ms, request body `deadlineMs: 5000` → 500ms wins
4. **Default unlimited** — no flag → no deadline timer, long prompts complete normally
5. **Writer idle timeout fires** — flag = 1000ms, simulate `res.write` returning false + never draining → after 1s, `client_evicted{reason:'writer_idle_timeout'}` frame, stream closed, `cleanup` called
6. **Heartbeat success keeps writer alive** — flag = 60s, heartbeat at 15s succeeds → idle timer doesn't fire
7. **Capability advertised conditionally** — `/capabilities` response includes `prompt_absolute_deadline` only when flag > 0
8. **SDK type compile** — `DAEMON_ERROR_KINDS` includes both new kinds (compile-time check via test that imports them)

## Verification

```sh
npm run typecheck
npm run test -- packages/cli/src/serve packages/acp-bridge packages/sdk-typescript
```

Manual smoke (from worktree):
```sh
# Build first
npm run build

# Deadline smoke
node packages/cli/dist/index.js serve --port 18280 --prompt-deadline-ms 5000 &
# Send prompt that takes >5s on a separate session — expect 504

# Idle smoke
node packages/cli/dist/index.js serve --port 18280 --writer-idle-timeout-ms 30000 &
# Open SSE, hold a slow consumer (no draining) — expect close after 30s with client_evicted
```

## Implementation order (one PR)

1. status.ts + SDK type mirror — typing scaffolding
2. ServeOptions fields
3. yargs flags + env fallback
4. Capability tags + conditional predicates
5. Prompt deadline (Feature A) — small, well-contained at server.ts:1094
6. Writer idle timeout (Feature B) — touches the SSE handler hot path, do after A
7. Tests
8. Docs

## Open questions

- **Claim comment on #4514 first?** Convention from earlier T1.3+T1.4 / T2.4 / T2.5+T2.6 claims is yes. **Plan: drop a claim comment on #4514 before pushing the PR** so other contributors don't double-pick this row.
- **Per-prompt `deadlineMs` field — ship now or defer?** Cheap to add, common ask, keeps the API future-proof. **Plan: ship in v1**, capped to flag value.
- **Humanized duration parsing (`30m`)?** Defer. Raw ms only in v1.

## Post-implementation workflow (per user directive)

1. **Deep review pass 1** — `code-reviewer` agent on full diff
2. **Deep review pass 2** — `code-reviewer` agent again on full diff (independent run)
3. **Codex review pass 1** — `/codex:review` (or `codex:codex-rescue` for a deeper analysis pass) on full diff
4. **Codex review pass 2** — `/codex:review` again, independent run
5. Address all blocking findings; re-run reviews if substantial changes
6. `git commit` — single commit, attribution per global CLAUDE.md (`🤖 Generated with [Qwen Code]...`), **no `Co-Authored-By` line** (per memory)
7. `git push -u`, `gh pr create`, paste body referencing T2.9 and #4514
8. Drop a comment on #4514 linking the new PR ("✅ tracked in #NNNN")
9. `/loop 20m /babysit-pr` — schedule 20-min recurring poll on the new PR (session-only; user can promote to durable if desired)

## Final Implementation Status

- **PR status**: #4514 (tracking issue) — OPEN. No dedicated implementation PR found for T2.9.
- **What was implemented**: This plan (T2.9: prompt absolute deadline + SSE writer idle timeout) does not appear to have been implemented yet. The tracking issue #4514 remains open as a capability gap backlog.
- **Key divergences**: Plan was written but implementation has not started or has not been submitted as a PR.
- **Files planned to change**: `packages/acp-bridge/src/status.ts`, `packages/sdk-typescript/src/daemon/types.ts`, `packages/cli/src/serve/types.ts`, `packages/cli/src/commands/serve.ts`, `packages/cli/src/runQwenServe.ts`, `packages/cli/src/serve/capabilities.ts`, `packages/cli/src/serve/server.ts` (+test), docs
