# Audit Round 6: Final Completeness & Production Readiness Review

## Findings

### 1. `Retry-After` header format consistency

**Status: Minor inconsistency to note in implementation**

The existing SSE subscriber cap 429 (server.ts:2508) uses:
```js
res.setHeader('Retry-After', '5');  // string literal of seconds
```

Other places (503 SessionLimitExceeded, 409 RestoreInProgress, 409 SessionBusy) all use:
```js
res.set('Retry-After', '5');  // same pattern, seconds as string
```

The plan specifies: `Headers: Retry-After: <seconds>` - this is consistent with existing code. However, the plan's JSON body uses `retryAfterMs` (milliseconds), while the header is in seconds (per HTTP spec RFC 7231 section 7.1.3). Implementation must ensure the conversion: `Math.ceil(retryAfterMs / 1000)` for the header value. This is correct design but needs explicit mention in the implementation to avoid a bug where someone passes the raw ms value to the header.

**Verdict**: Plan is consistent. Implementation note needed for ms-to-seconds conversion.

---

### 2. Internal daemon self-requests

**Status: No issue**

Examined `runQwenServe.ts` thoroughly. The daemon does NOT make HTTP requests to itself. The "channel liveness check" (line 844) is `bridge.isChannelLive()` which is an in-process method call on the bridge object, not an HTTP request. The URL constructed at line 963 is only used for logging/display ("listening on http://...").

**Verdict**: No self-request risk. Rate limiter will not accidentally throttle internal operations.

---

### 3. Error message i18n

**Status: No issue - matches existing pattern**

Searched the entire `serve/` directory for `t(`, `i18n`, `intl`, `translate` patterns. The daemon's HTTP layer uses **plain English strings** for all error responses (401 "Unauthorized", 403 "Request denied by CORS policy", various structured error objects). No internationalization is applied to HTTP error bodies anywhere in the serve package.

**Verdict**: The plan's `"error": "Rate limit exceeded"` in plain English is fully consistent with the existing codebase convention. No i18n needed.

---

### 4. Content-Type on 429 for SSE clients

**Status: Potential issue - plan should address**

When a client sends `Accept: text/event-stream` to `GET /session/:id/events` and gets the existing subscriber-limit 429, the response is:
```js
res.status(429).json({...})  // Content-Type: application/json
```

Express's `.json()` sets `Content-Type: application/json`. The comment at line 2499-2503 explicitly documents this design choice: "429 is the standard 'back off' signal - browsers' EventSource treats 4xx as terminal and does NOT auto-reconnect". This is intentional - `EventSource` sees the non-200 status code BEFORE parsing the body, so the JSON body doesn't confuse it.

However, the rate limiter sits BEFORE route matching. A client requesting `GET /session/:id/events` that hits the rate limit will get a 429 with `Content-Type: application/json` before the SSE handler runs. The plan marks SSE (`GET .../events`) as **exempt** from rate limiting, so this case should never occur.

**Verdict**: The exempt tier for SSE routes correctly avoids this problem. But if the exempt list is ever narrowed (e.g., someone removes the SSE exemption), the JSON 429 body is still fine because `EventSource` treats 4xx as terminal regardless of body Content-Type. No change needed.

---

### 5. `GET /capabilities` exposure of rate limit configuration

**Status: Design recommendation**

The plan says `capabilities.ts` gets a `rate_limit` **conditional feature tag**. Looking at the existing pattern in capabilities.ts, conditional features only advertise a boolean presence ("this feature exists") via the features array - they do NOT expose configuration values (e.g., `allow_origin` doesn't expose the origin list, `mcp_guardrails` doesn't expose the budget number).

Following this established pattern, the `rate_limit` tag should ONLY indicate "rate limiting is active" - it should NOT expose the per-tier limits, window size, or remaining tokens. This is both:
- **Consistent** with the codebase's explicit security stance (see capabilities.ts lines 195-199: "surfacing the list would let an unauthenticated /capabilities reader enumerate...")
- **Not a security leak** since knowing limits exist is benign; knowing exact thresholds enables precise evasion

The plan's approach (conditional feature tag only) is correct. However, the 429 response body DOES expose the `tier` name and `retryAfterMs`. This is fine and standard practice (Cloudflare, GitHub API all do this).

**Verdict**: Correct as designed. Tag presence only, no config leakage.

---

### 6. `--require-auth` interaction with anonymous bucket

**Status: Correct, but add a test case**

The middleware order in the plan is: `bearerAuth -> rateLimiter -> express.json() -> routes`

When `--require-auth` is set:
- `bearerAuth(opts.token)` at line 871 is always installed with a real token (boot refuses to start without one when `--require-auth` is set)
- Any request without a valid bearer token gets 401 from `bearerAuth` BEFORE reaching the rate limiter
- Therefore, the rate limiter only sees authenticated requests
- The "anonymous" fallback key (`X-Qwen-Client-Id` absent -> 'anonymous' shared bucket) only activates when:
  - `bearerAuth` passes through (token is undefined, i.e., loopback without `--require-auth`)
  - No `X-Qwen-Client-Id` header present

This means the anonymous bucket is correctly unreachable when `--require-auth` is on. However, the plan's test scenarios (line 69, "rateLimit.test.ts") should explicitly include a test verifying that the key extractor is never called with anonymous when requireAuth is implied (or documenting that it's guaranteed by middleware ordering).

**Verdict**: Flow is correct. Recommend adding integration test: "rate limiter anonymous bucket is unreachable when --require-auth is set".

---

### 7. Future per-session limiting extensibility

**Status: Good extensibility, minor recommendation**

The plan keys on `clientId` globally (or `{ip}:{clientId}` for non-loopback). The token bucket implementation stores buckets in a Map keyed by string. Supporting composite keys like `{clientId}:{sessionId}` later requires:
- Changing the key extractor function (already cleanly separated as `createKeyExtractor()`)
- The Map-based bucket storage handles any string key natively
- No data structure refactoring needed

The tier resolution is also route-based, not key-based, so adding a per-session dimension doesn't require tier redesign.

**Verdict**: The `createKeyExtractor()` factory pattern provides clean extensibility. A future composite key is a one-function change. Good design.

---

### 8. Overall plan completeness

**File coverage**:
- All needed files are listed. The file table correctly identifies NEW vs MODIFY.
- One potential gap: the plan does NOT mention updating `packages/cli/src/serve/index.ts` (the barrel file). If `rateLimit.ts` exports types or helpers that other packages need, the barrel needs updating. However, since the middleware is only consumed internally by `server.ts`, this is likely fine.

**Test scenarios**:
- Unit tests cover: bucket mechanics, tier assignment, key extraction, 429 format, stale cleanup
- Integration tests cover: enable/disable, tier independence, exempt routes, custom limits
- Missing scenarios worth adding:
  - Concurrent requests from multiple clients (bucket isolation)
  - Timer/refill behavior under `jest.useFakeTimers()`
  - Graceful handling of negative/zero/NaN custom limits passed via CLI

**Verification section**:
- Covers typecheck, unit test, integration test, manual curl test
- Missing: no mention of load testing or `autocannon`/`wrk` for validating that rate limiting doesn't add measurable latency on the hot path when disabled (the default)

**Verdict**: Plan is comprehensive. Minor gaps in test scenarios are non-blocking.

---

### 9. Comparison with industry patterns

Token bucket is the standard choice for local daemon rate limiting:
- **VS Code Live Share**: Uses connection-level throttling (not HTTP rate limiting per se, but TCP connection caps similar to `maxConnections`)
- **GitHub Copilot agent**: Backend uses sliding-window rate limiting with per-user quotas; local proxy doesn't rate limit
- **Cursor daemon**: Does not expose a documented rate limiter on its local HTTP API; relies on upstream API limits
- **Express ecosystem**: `express-rate-limit` defaults to fixed-window; token-bucket is an upgrade for burst tolerance
- **nginx/Envoy**: Both offer token bucket as a first-class rate limiting algorithm

The plan's choice of token bucket with per-tier configuration is well-aligned with industry practice. The "default off" stance is also appropriate for a local-first developer tool - most competitors don't rate limit their local daemon at all.

**Verdict**: Standard, appropriate approach.

---

### 10. Token refill calculation

**Status: Critical implementation detail - plan is ambiguous**

The plan states: `默认限制 (per key/60s)` with `max=10, window=60000ms`. This phrasing is ambiguous - it could mean:

**Option A - Fixed window**: Bucket refills all 10 tokens every 60 seconds. Simple but causes the "thundering herd at window boundary" problem where a client exhausted at t=59s gets full capacity at t=60s.

**Option B - Smooth refill (token drip)**: Bucket drips 1 token every 6000ms (60000/10). More even distribution, no window-boundary bursts.

**Option C - Sliding window with burst (true token bucket)**: Bucket has capacity 10, refills at rate 10/60s = 1 token per 6s, but allows bursting up to 10 if accumulated. This is the classic token bucket algorithm.

For the daemon's use case:
- Clients are typically IDEs sending prompts in bursts (user types, IDE sends prompt, waits for response, sends next)
- **Option C (true token bucket)** is optimal: allows natural burst patterns while preventing sustained abuse
- The plan says "Token bucket 算法：允许短暂突发" which confirms Option C is intended
- Implementation should use: `tokens = min(max, tokens + (elapsed_ms / window_ms) * max)` with `max` as bucket capacity

**Verdict**: The plan intends true token-bucket (Option C) based on the "允许短暂突发" language, but the implementation must use continuous refill (`elapsed * rate`), NOT fixed-window batch refill. This should be made explicit in the plan or implementation comments to prevent an implementer from accidentally coding fixed-window behavior.

---

## Summary of Actionable Items

| # | Severity | Item |
|---|----------|------|
| 10 | Medium | Clarify refill algorithm is continuous drip (not fixed window batch) |
| 6 | Low | Add integration test for --require-auth blocking anonymous bucket |
| 1 | Low | Document ms-to-seconds conversion for Retry-After header |
| 8 | Low | Consider adding fake-timer unit test for refill mechanics |

## Overall Assessment

The plan is production-ready. The design is well-considered: correct middleware ordering (auth-first saves CPU on rejected requests, body-parser-after saves JSON parse on throttled requests), clean separation of concerns (key extractor factory, tier resolver, bucket core), and appropriate exemptions (SSE/health/heartbeat). The only substantive gap is the ambiguity around refill behavior (finding #10) - a fixed-window implementation would produce noticeably worse behavior for IDE clients than the intended smooth token bucket, and the plan's wording could be misread by an implementer unfamiliar with the distinction. All other findings are low-severity polish items. The file-change table is complete, the test coverage plan is adequate, and the design choices align with industry norms. This plan is ready for implementation with the single clarification on refill semantics.
