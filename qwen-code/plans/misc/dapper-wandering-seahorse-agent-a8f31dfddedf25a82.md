# Rate Limiting Design Audit - Round 3 Findings

## Audit Scope

Third-round undirected audit covering 10 specific areas not addressed by prior rounds (IP extraction, timer GC, anonymous starvation, capabilities sites, health/demo ordering, OPTIONS exempt, window burst).

---

## Finding 1: Graceful Shutdown — Rate Limiter Continues Accepting During Drain

**Severity: Important (85)**

**Analysis:** The shutdown flow in `runQwenServe.ts` sets `shuttingDown = true` (line 1055) only inside the `close()` promise body. The two-phase shutdown then calls `bridge.shutdown()` followed by `server.close()`. During the bridge shutdown phase (up to 10s for SIGTERM grace on children), the HTTP listener is still open and accepting connections. The bridge rejects new session creation when `shuttingDown` is true (lines 1305, 1764 in `bridge.ts`), but the rate limiter has no awareness of this state.

**Issue:** The plan's rate limiter is a pure Express middleware with its own module-level state. It has no shutdown hook. During the drain window:
- New requests arrive and consume tokens from the bucket (wasting budget)
- A client that was rate-limited just before SIGTERM gets a 429 instead of a more informative "shutting down" error
- The rate limiter's GC timer (mentioned in plan) could fire during teardown

**Recommendation:** The rate limiter should expose a `shutdown()` or `setDraining(true)` method. When draining, it should either:
1. Pass-through all requests (let the bridge/route handlers emit proper 503 "shutting down" errors), OR
2. Respond with 503 + `Retry-After: 0` to signal "try another instance" (better for load-balanced deployments)

Option 1 is simpler and matches the existing pattern where the bridge already throws "shutting down" errors.

---

## Finding 2: Prompt Queue Queues Past Rate Limit

**Severity: Important (82)**

**Analysis:** The bridge's `sendPrompt` (line 2251 in `bridge.ts`) chains onto `entry.promptQueue` — a per-session promise chain that serializes prompts FIFO. A client can POST 5 prompts in rapid succession. The rate limiter sees 5 HTTP requests and allows/denies based on the `prompt` tier bucket (10/min default).

**Issue:** If 5 prompts arrive within the rate limit window and are allowed through, they ALL enter the prompt queue. The first executes immediately; the other 4 sit queued inside the bridge. The rate limiter's `retryAfterMs` is meaningless here — it tells the client "wait N ms before your NEXT request", but the bridge already has 4 pending prompts that will execute sequentially (each taking potentially minutes). The client has no visibility into the queue depth.

This isn't a bug in the rate limiter per se, but a UX design gap: the rate limit gives clients a false sense that "10 prompts/min are fine" when in reality queueing 10 prompts/min into a serial queue is counterproductive. The prompt tier limit should arguably be much lower (2-3) or the plan should document that prompt-tier limiting is about protecting the HTTP layer, not the queue.

**Recommendation:** Document that prompt-tier rate limiting protects against HTTP-layer flooding but does NOT bound bridge queue depth. Consider whether the plan should expose queue depth in the 429 response (e.g., `queueDepth: 4`) so clients can make informed retry decisions.

---

## Finding 3: Multi-Session Rate Limiting — Shared Bucket is Correct but Under-documented

**Severity: Informational**

**Analysis:** The plan limits by `client-id` globally across all sessions. A web-shell with 5 tabs (same client-id, different sessions) shares a single 10/min prompt bucket. This means tab 3 can starve tabs 1, 2, 4, 5.

**Assessment:** This is actually the correct design for the threat model (preventing a single client from overwhelming daemon resources), but the plan should explicitly document this decision. Per-session limiting would be wrong: a malicious client could evade limits by creating new sessions. The client-id is the right throttle point because `maxSessions=20` is the resource cap per session, and rate limiting is the velocity cap per client.

**Recommendation:** Add a "Design Rationale" note to the plan explaining why per-client-id (not per-session) was chosen, and note that multi-tab UIs should coordinate prompt submission or display the shared budget.

---

## Finding 4: `POST /sessions/delete` Batch — Counted as 1 Mutation Request

**Severity: Important (80)**

**Analysis:** `POST /sessions/delete` accepts up to 100 session IDs (line 1688-1700 in server.ts). The rate limiter would classify this as a single `mutation` tier request. Internally, the route calls `bridge.closeSession()` 100 times via `Promise.allSettled`. Each closure involves:
- Cancelling any active prompt (ACP cancel notification)
- Tearing down the session entry
- Potentially triggering channel kill if last session

**Issue:** A client at `mutation` tier limit (30/min) could delete 30 * 100 = 3000 sessions per minute through this endpoint. While `maxSessions=20` means most of these would be `SessionNotFoundError`, the batch still forces 3000 `bridge.closeSession()` calls and 3000 `SessionService.deleteSession()` fs operations per minute.

More importantly, if a future endpoint adds batch-create or batch-prompt capabilities, the same pattern would compound. The design should establish a policy for batch endpoints now.

**Recommendation:** Add a "Batch Endpoint Policy" section to the plan. Options:
1. Count each item in the batch toward the bucket (100 items = 100 tokens consumed)
2. Apply a separate `batch` tier with lower limits
3. Accept the current behavior since `maxSessions=20` naturally bounds the real damage

Option 3 is pragmatically fine for today, but the plan should document the decision so future batch endpoints don't silently inherit an under-restricted posture.

---

## Finding 5: No Race Condition in Single-Threaded Token Bucket

**Severity: Informational (no issue)**

**Analysis:** Node.js is single-threaded. Express middleware is invoked synchronously within the event loop tick for each request. Even with `async` middleware, the token bucket read-decrement-write sequence would complete within a single synchronous execution frame because:
- The bucket check is purely in-memory (Map lookup + arithmetic)
- No `await` between reading and decrementing the token count
- Two concurrent requests are actually serialized by the event loop

**Assessment:** No race condition exists. The only scenario where this could matter is if the rate limiter itself contains an `await` between reading and writing the bucket — but the plan's token bucket algorithm (simple `lastRefill` + `tokens` counter with in-memory Map) is entirely synchronous. This is a non-issue.

---

## Finding 6: 429 Response Content-Type for SSE Clients

**Severity: Important (83)**

**Analysis:** When a client reconnects to `GET /session/:id/events` with `Accept: text/event-stream`, the rate limiter might fire before the SSE route handler. The plan says exempt routes include `GET .../events`, so SSE is exempt. However, the exemption logic must match the path pattern correctly.

**Issue:** The real concern is more subtle. Consider this sequence:
1. Client establishes SSE connection (exempt, passes through)
2. SSE connection drops (network hiccup)
3. Client reconnects with `Last-Event-ID` header
4. Rate limiter fires on the new `GET /session/:id/events` request

If the path-matching for exemptions uses a simple string check (e.g., `path.endsWith('/events')`), this is fine. But if there's an off-by-one in the regex or the exempt list only contains exact paths (not patterns), reconnect attempts could be rate-limited.

Additionally: if the exempt check fails due to a regex bug, the 429 response has `Content-Type: application/json`. An EventSource client expects `text/event-stream` and would NOT parse the JSON body — it would just see a connection failure with no retry hint. The `Retry-After` header is the saving grace here (EventSource polyfills can read it), but native `EventSource` ignores non-2xx status codes and simply retries after its built-in reconnect interval.

**Recommendation:**
1. Ensure the exempt path matching uses a pattern like `/\/session\/[^/]+\/events$/` (not just string equality)
2. Document that SSE exemption is critical for reconnect behavior and test it explicitly
3. Consider adding `Content-Type: text/event-stream` with an SSE-formatted error for 429s on paths matching the events pattern (defense in depth)

---

## Finding 7: Telemetry Middleware Records 429 Responses Correctly

**Severity: Informational (no issue)**

**Analysis:** The middleware registration order per the plan:
```
bearerAuth → **rateLimiter** → express.json() → telemetryMiddleware → routes
```

But examining `server.ts` (line 903), `daemonTelemetryMiddleware` is registered AFTER `express.json()` (line 873). The plan says the rate limiter goes between `bearerAuth` (line 871) and `express.json()` (line 873).

**Issue:** If the rate limiter responds with 429 at line 872 (between bearer and json parser), the request never reaches `daemonTelemetryMiddleware` (line 903). The telemetry middleware uses `res.once('finish', ...)` to record the response — but it's never invoked because the request is short-circuited by the rate limiter before reaching it.

This means:
- 429 responses are NOT recorded in OTLP spans
- `recordDaemonHttpRequest` metrics miss rate-limited requests
- Operators cannot see rate-limit hit rates through the existing telemetry pipeline

**However**, the access-log middleware (lines 824-868) IS registered before `bearerAuth` and would capture the 429 in the daemon log file. So the logging gap is only in the structured OTLP telemetry, not in the file-based access log.

**Recommendation:** Either:
1. Move the rate limiter AFTER `daemonTelemetryMiddleware` (between telemetry and routes). This means rate-limited requests still get a telemetry span but don't waste JSON parsing.
2. Add rate-limiter-internal metrics (counter + histogram) that don't depend on the telemetry middleware pipeline. The plan mentions "rate limit hits should be logged" but doesn't specify the mechanism.

Option 2 is cleaner — the rate limiter emits its own `recordDaemonRateLimitHit(tier, key)` counter, independent of the per-request span pipeline.

---

## Finding 8: SDK Client Has No Built-in 429 Retry

**Severity: Important (88)**

**Analysis:** `DaemonClient` (packages/sdk-typescript) throws `DaemonHttpError` on any non-2xx response. There is:
- No `Retry-After` header parsing
- No exponential backoff
- No special handling for 429 vs other 4xx codes
- No retry loop at any level

The `fetchWithTimeout` method (line 325) wraps calls in a single attempt with a timeout, but never retries.

**Issue:** When the daemon enables rate limiting, SDK clients (web-shell, VS Code extension, programmatic integrations) will fail hard on 429 with a generic `DaemonHttpError`. The caller sees `"POST /session/:id/prompt: Rate limit exceeded"` and must implement their own retry logic. Since the plan includes `Retry-After` and `retryAfterMs` in the 429 body, the SDK should surface these to callers at minimum, and ideally implement auto-retry.

This is the most impactful finding for developer experience. Without SDK-side retry:
- A burst of UI interactions (typing fast in web-shell → multiple prompt cancels + re-prompts) would surface opaque errors to users
- Integration scripts that batch operations would need custom retry wrappers
- The `Retry-After` header value is computed but never consumed

**Recommendation:**
1. SDK should expose `retryAfterMs` on `DaemonHttpError` (parsed from either the response body or the `Retry-After` header)
2. Consider adding opt-in auto-retry for 429 (configurable via `DaemonClientOptions.retryOn429: boolean | { maxRetries: number }`)
3. At minimum, document the retry contract in the SDK's JSDoc so consumers know to handle it

---

## Finding 9: Deep Health Check Is Cheap Enough to Exempt

**Severity: Informational (no issue)**

**Analysis:** `GET /health?deep=1` (lines 789-806 in server.ts) calls:
- `bridge.sessionCount` → getter backed by `byId.size` (O(1) Map property)
- `bridge.pendingPermissionCount` → getter backed by `permissionMediator.pendingCount` (also O(1))

**Assessment:** Both are trivial O(1) getters reading `.size` on a Map/Set. No iteration, no I/O, no channel IPC. Even at maximum rate (thousands per second), these are nanosecond operations. Exempting `/health` (including deep mode) from rate limiting is safe. A client spamming `?deep=1` does negligible work compared to even a single session-create.

---

## Finding 10: Test Isolation for Module-Level Token Bucket State

**Severity: Important (81)**

**Analysis:** The plan creates `rateLimit.ts` with module-level bucket state (a Map of key -> bucket). Looking at how `server.test.ts` handles similar stateful middleware:
- `activeSseCount` is module-level (line 104 in server.ts) with NO reset function
- Tests create fresh `createServeApp()` instances per suite, but the module-level state persists across them within the same vitest worker

**Issue:** The plan's `rateLimit.test.ts` tests the bucket in isolation (unit tests), which is fine — each test can construct a fresh limiter. But `server.test.ts` integration tests that enable rate limiting via `ServeOptions` would share bucket state across test cases in the same worker.

Vitest runs test files in parallel (separate workers), but `describe` blocks within a file share module state. If test A (prompt burst → 429) runs before test B (single prompt → 200), test B might fail because the bucket was drained by test A.

The plan should address this by:
1. Making `createRateLimiter()` return both the middleware AND a `reset()` method
2. Having `createServeApp()` expose the limiter on `app.locals` so tests can call `app.locals.rateLimiter.reset()` in `beforeEach`
3. Using `vi.useFakeTimers()` to advance past the window between tests

**Recommendation:** The `createRateLimiter` factory should return `{ middleware, reset, getStats }` — the `reset()` clears all buckets, and `getStats()` exposes current state for assertions. This pattern is testable and matches how the existing `DeviceFlowRegistry` exposes `.dispose()` for cleanup.

---

## Summary

| # | Area | Severity | Key Finding |
|---|------|----------|-------------|
| 1 | Graceful shutdown | Important (85) | Rate limiter has no shutdown-awareness; continues consuming tokens during drain |
| 2 | Prompt queue interaction | Important (82) | Rate limit allows queue flooding; `retryAfterMs` is misleading for queued prompts |
| 3 | Multi-session shared bucket | Informational | Correct design, needs documentation |
| 4 | Batch delete endpoint | Important (80) | 100 deletions counted as 1 mutation; policy undocumented |
| 5 | Token bucket race | Informational | No race in single-threaded Node.js |
| 6 | SSE reconnect content-type | Important (83) | Path matching must be pattern-based; native EventSource ignores 429 body |
| 7 | Telemetry gap | Important (87) | 429s bypass telemetry middleware entirely; no OTLP metrics for rate limit events |
| 8 | SDK has no 429 retry | Important (88) | SDK throws generic error; no retry, no Retry-After parsing |
| 9 | Deep health cost | Informational | O(1) getters; safe to exempt |
| 10 | Test isolation | Important (81) | Module-level state needs explicit reset mechanism for test hygiene |
