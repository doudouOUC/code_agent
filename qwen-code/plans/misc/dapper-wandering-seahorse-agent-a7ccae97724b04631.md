# Round 8 Final Audit: Rate Limiting Design for `qwen serve`

## Findings

### Important (80-89)

#### 1. Trailing slash mismatch between tier resolver and Express routing

**Confidence: 85**

Express 5 with `strict routing` disabled (the default in this codebase — confirmed at `router/index.js:400` where `strict: false`) uses `trailing: !opts.strict` (i.e., `true`) in path-to-regexp matching. This means `/session/:id/prompt/` matches the route handler just as `/session/:id/prompt` does.

However, the plan's tier resolver uses `path.endsWith('/prompt')`. A request to `/session/abc/prompt/` would:
- **NOT** match the `prompt` tier (fails `endsWith('/prompt')`)
- **WOULD** match Express's route handler and execute the prompt

Result: the request falls through to the `mutation` tier (since it's a POST) and gets the more permissive 30/60s budget instead of the intended 10/60s.

**Fix**: The tier resolver should normalize trailing slashes before matching, or use a regex like `/\/prompt\/?$/`. Alternatively, the plan should document that the implementation must strip a single trailing slash from `req.path` before tier classification.

Similarly, `path.endsWith('/heartbeat')` and `path.endsWith('/events')` for exempt classification would miss the trailing-slash variants.

---

#### 2. Timer cleanup: `dispose()` method needed for test harness

**Confidence: 83**

The vitest config (`packages/cli/vitest.config.ts:42-47`) uses the `threads` pool with `minThreads: 8, maxThreads: 16`. Each test file gets its own worker thread. The `setInterval(...).unref()` GC timer in the rate limiter module will keep running for the lifetime of the worker thread.

The established pattern in this codebase is clear: `DeviceFlowRegistry` (at `packages/cli/src/serve/auth/deviceFlow.ts:547-553`) accepts injectable `scheduleInterval` / `clearScheduledInterval` deps AND exposes a `dispose()` method (called at `server.test.ts:5085` and `runQwenServe.ts:657`).

The plan's `reset()` method clears bucket state but does NOT clear the GC timer. Without a `dispose()` or `stop()` method, the timer leaks per test file. While `.unref()` prevents it from blocking worker thread exit, it's an inconsistency with the codebase pattern and could cause flaky behavior if the GC callback fires after test teardown modifies module state.

**Fix**: Add `dispose()` to the public API of `createRateLimiter()` that calls `clearInterval(gcTimerHandle)`. The implementation notes in the plan already list `reset()` — add `dispose()` alongside it. Also consider injectable timer deps (matching DeviceFlowRegistry's pattern) for deterministic testing without fake timers.

---

#### 3. `req.path` is NOT percent-decoded — tier resolver is safe but plan should document this

**Confidence: 80**

Express 5's `req.path` comes from `parseurl` which returns the raw pathname WITHOUT percent-decoding (confirmed in `node_modules/parseurl/index.js:100-134`). The router's `path-to-regexp` does decode params for route matching (via `decodeParam` at `router/lib/layer.js:72,90`), but `req.path` in middleware stays encoded.

A request to `/session/abc%2Fprompt` would have `req.path === '/session/abc%2Fprompt'`. The tier resolver's `path.endsWith('/prompt')` returns FALSE (it ends with `%2Fprompt`). This is actually SAFE because Express's route `/session/:id/prompt` also won't match this path (the `%2F` is not a path separator in route matching). The request 404s.

However, a percent-encoded `/session/abc/prompt` where `prompt` is encoded as `%70rompt` would give `req.path === '/session/abc/%70rompt'`. The `endsWith('/prompt')` check returns false, but Express route matching WITH the `decode` option WILL decode `%70rompt` to `prompt` and match. This is an edge case so obscure it's not practically exploitable (the client already has loopback auth), but the plan should note that tier resolution operates on raw paths while Express routing decodes them.

**Impact**: Minimal in practice. Not a security boundary since clients are already authenticated. But worth a one-line comment in the implementation.

---

### Informational (not blocking)

#### 4. Sub-router path stripping: NOT a concern

Express 5 sub-routers modify `req.url` (and thus `req.path`) when entering a prefix-mounted sub-router. However, this codebase uses NO sub-routers — all routes are registered directly on `app` (confirmed: `mountWorkspaceMemoryRoutes`, `mountWorkspaceAgentsRoutes`, `registerWorkspaceFileReadRoutes` all call `app.get(...)` / `app.post(...)` directly). The rate limiter runs as app-level middleware (`bearerAuth -> rateLimiter -> express.json()`) where `req.path` always reflects the full URL path.

**Verdict**: No issue.

---

#### 5. `req.method` casing: Confirmed safe

Node.js `http.IncomingMessage.method` is always uppercase (per HTTP spec, normalized by Node's HTTP parser). Express inherits this without modification (confirmed by Express's own `'GET' !== method` check at `request.js:462`). The plan's tier resolver using uppercase comparison (`method === 'POST'`) is correct.

**Verdict**: No issue.

---

#### 6. Anonymous bucket bypass via rotating `X-Qwen-Client-Id`: Acceptable

The plan already documents the 10,000 bucket cap. Once exceeded, the limiter goes fail-open. A loopback client can indeed rotate client IDs to get fresh buckets. However:
- The client already has authenticated access on loopback (no trust boundary)
- The 10,000 cap limits memory damage
- This is a self-DoS scenario (the client is harming its own daemon)
- The plan explicitly documents this in "Known Limitations"

**Verdict**: Acceptable. Not a security issue given the threat model.

---

#### 7. `--rate-limit-prompt` without `--rate-limit`: Warning is the right pattern

The plan says this should be a "warning (non-fatal)". Looking at existing precedent:
- `--mcp-budget-mode=enforce` without `--mcp-client-budget` is **fatal** (exit(1)) — because enforce mode would be meaningless without a budget
- `--mcp-budget-mode=warn` without `--mcp-client-budget` silently resolves to `'off'` — the mode flag alone has no effect without a budget value

The rate limit case is analogous to `--mcp-budget-mode=warn` without `--mcp-client-budget`: specifying a limit value without the enable flag is harmless (the limits are just stored but never enforced). A stderr warning is appropriate — it tells the operator they probably forgot `--rate-limit` without breaking their deployment.

**Verdict**: Warning is correct. Consistent with codebase patterns.

---

#### 8. Error shape consistency: `tier` field is fine, `retryAfterMs` is new but useful

Existing error shapes:
- `SubscriberLimitExceededError` (429): `{ error, code: 'subscriber_limit_exceeded', limit }` + `Retry-After: 5`
- `SessionNotFoundError` (404): `{ error, sessionId }` (no `code` field — an existing inconsistency)
- `SessionLimitExceededError` (503): `{ error, code: 'session_limit_exceeded', limit }` + `Retry-After: 5`
- `RestoreInProgressError` (409): `{ error, code: 'restore_in_progress', sessionId, activeAction, requestedAction }` + `Retry-After: 5`

The plan's shape: `{ error, code: 'rate_limit_exceeded', tier, retryAfterMs }` + `Retry-After: <seconds>`

- `code` field: consistent with existing pattern
- `tier` field: domain-specific context (like `limit` in subscriber_limit_exceeded, or `sessionId` in restore_in_progress) — follows established convention of including diagnostic info relevant to the specific error type
- `retryAfterMs` field: new (existing errors use only the header). However, the SDK's `DaemonHttpError` exposes `body: unknown`, and the existing retry utilities in `packages/core/src/utils/retry.ts` already parse `Retry-After` headers. Adding `retryAfterMs` in the body is redundant but not harmful — it gives clients a more precise millisecond value vs the ceil'd seconds header.

**Verdict**: Consistent enough. No change needed.

---

#### 9. Documentation paths exist

Both `docs/users/qwen-serve.md` (44,563 bytes) and `docs/developers/qwen-serve-protocol.md` (79,659 bytes) exist at the expected paths.

**Verdict**: No issue.

---

#### 10. vitest `setInterval` and worker thread isolation

vitest `threads` pool (confirmed as the active pool) gives each test FILE its own worker thread. Module state (including bucket Maps) is isolated per file. The `reset()` method handles inter-test state within a file. But the `setInterval` GC timer, once started (on first `createRateLimiter()` call in a test), runs until the worker exits. Since `.unref()` is set, it won't block exit. But if the interval fires during test teardown or after the test assertions complete, it could cause "operation after test finished" warnings (vitest `--reporter verbose` would show these).

This is addressed by finding #2 above (expose `dispose()`).

---

## Summary Table

| # | Topic | Severity | Action Needed |
|---|-------|----------|---------------|
| 1 | Trailing slash mismatch | Important (85) | Normalize trailing slash in tier resolver |
| 2 | Timer cleanup / dispose() | Important (83) | Add dispose() method; consider injectable timer deps |
| 3 | Percent-encoding documentation | Important (80) | Add comment noting raw-path behavior |
| 4 | Sub-router path stripping | Informational | None |
| 5 | req.method casing | Informational | None |
| 6 | Anonymous bucket bypass | Informational | None (documented) |
| 7 | --rate-limit-prompt without --rate-limit | Informational | Warning is correct |
| 8 | Error shape consistency | Informational | None |
| 9 | Documentation paths | Informational | None |
| 10 | vitest timer isolation | Informational | Covered by #2 |

## Final Verdict

The plan is ready for implementation with two minor amendments: (1) the tier resolver must normalize trailing slashes before string matching, and (2) the rate limiter factory must expose a `dispose()` method (with optionally injectable timer deps) following the established `DeviceFlowRegistry` pattern. Neither issue is architecturally disruptive — both are single-function additions during implementation.
