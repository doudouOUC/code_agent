# Audit Round 4: Deployment, Operational, and Security Angles

## Summary

This audit examines the rate limiting design from deployment, operational, and security perspectives. Findings are categorized by severity.

---

## Critical (90-100)

### C1. Configuration Validation: Zero and Negative Values (Confidence: 95)

**Issue:** The plan defines `--rate-limit-prompt`, `--rate-limit-mutation`, `--rate-limit-read` as `type: 'number'` in yargs. Yargs will happily accept `0`, `-5`, `2.5`, `NaN` (from `--rate-limit-prompt=abc`), and `Infinity`. The plan does NOT specify any boot-time validation for these values.

**Precedent in codebase:** `maxSessions` has explicit validation in `httpAcpBridge.ts:1224-1241`:
- NaN throws TypeError
- Negative throws TypeError
- 0 / Infinity = disable (unlimited)

`maxConnections` has similar validation in `runQwenServe.ts:468-481`:
- NaN throws TypeError
- Negative throws TypeError

The rate limit plan omits this entirely. Without validation:
- `--rate-limit-prompt 0` would create a token bucket with 0 capacity, blocking ALL requests permanently (the bucket starts empty, refill of 0 tokens/window means it never replenishes). Or if the bucket starts "full" at 0, the first request drains it to -1 and it never recovers.
- `--rate-limit-prompt -5` would create undefined behavior in the bucket arithmetic.
- `--rate-limit-prompt 2.5` would work but produce confusing behavior (is it 2 or 3 tokens?).
- `--rate-limit-prompt abc` passes through yargs as NaN.

**Recommendation:** Add to the plan: boot-time validation in both `serve.ts` (fast-fail UX) and `rateLimit.ts` (defense-in-depth). Each limit must be a positive finite integer. NaN / negative / zero / non-integer / Infinity should throw at boot with a message matching the `maxSessions` pattern.

---

### C2. Logging Volume Under Attack (Confidence: 92)

**Issue:** The plan mentions an `onLimitReached` callback for logging rejected requests. Under a flood attack (10,000+ req/s from a misbehaving client or intentional DoS), this produces 10,000 log lines/second. This becomes a secondary resource exhaustion vector:
- Disk I/O from `writeStderrLine` (synchronous in the current codebase)
- Log rotation / journald pressure
- If piped to a log aggregator, network I/O

**Precedent in codebase:** The `createDefaultFsAuditEmit()` function (server.ts:86-107) already implements rate-limited logging: "warn once + every 100th event". The device flow audit (`server.ts:354-397`) logs per-event but is naturally low-volume (human-initiated OAuth flows).

**Recommendation:** The `onLimitReached` callback MUST implement rate-limited logging. Pattern: log the first rejection per key, then sample at 1-in-N (e.g., every 100th) with a counter. Include `droppedCount` in the sampled log so operators know how many were suppressed. This matches the `createDefaultFsAuditEmit` pattern already in the codebase.

---

## Important (80-89)

### I1. IPv6 / IPv4 Key Split on Dual-Stack Localhost (Confidence: 88)

**Issue:** The plan's key extraction strategy says: "Loopback (IP is 127.0.0.1): use X-Qwen-Client-Id". But on dual-stack systems, a client connecting via `::1` (IPv6 loopback) has a different source IP than one connecting via `127.0.0.1`.

The loopback detection in `loopbackBinds.ts` recognizes BOTH `127.0.0.1` and `::1` as loopback binds. But the plan's key extractor says "Loopback: use X-Qwen-Client-Id, fall back to 'anonymous' shared bucket" vs. "Non-loopback: use IP".

The decision of whether the deployment IS loopback is made at boot time based on `opts.hostname` (line 495 in server.ts: `const loopback = isLoopbackBind(opts.hostname)`). So if the daemon binds to `127.0.0.1`, it IS loopback mode regardless of what IP the client's TCP connection shows. This means the plan's key extraction is actually based on the BIND address, not the request's source IP. This is correct but the plan's wording ("IP is 127.0.0.1") is misleading.

However, there's a subtlety: if the daemon binds to `localhost` (which resolves to both `::1` and `127.0.0.1` on some systems), clients connecting via IPv4 and IPv6 would both be in "loopback mode" and use the client-id key. This is fine.

For non-loopback deployments (key = IP), a client that connects sometimes via IPv4 and sometimes via IPv6 (same machine, dual-stack) gets two separate rate limit buckets. This is minor for single-tenant but could be confusing.

**Recommendation:** Clarify in the plan that loopback detection is BIND-time, not per-request. For non-loopback, consider normalizing `::ffff:127.0.0.1` (IPv4-mapped IPv6 address that Node reports for IPv4 connections on a dual-stack socket) to `127.0.0.1` for consistent keying.

### I2. Middleware Position vs. Actual Code Layout (Confidence: 85)

**Issue:** The plan says the rate limiter goes:
```
bearerAuth -> **rateLimiter** -> express.json() -> routes
```

But examining the actual code (server.ts:510-512):
```
app.use(bearerAuth(opts.token));
app.use(express.json({ limit: '10mb' }));
```

The plan correctly places the rate limiter BEFORE `express.json()`, which is good (rejected requests skip JSON parsing). However, the current code has NO gap between `bearerAuth` and `express.json()` -- they are consecutive `app.use()` calls. The plan needs to ensure:

1. The rate limiter ALSO runs before the pre-auth `/health` and `/demo` routes (lines 505-508). Currently those are registered BEFORE `bearerAuth`. If the rate limiter is after `bearerAuth`, health checks bypass rate limiting -- which the plan marks as "exempt", so this is intentional and correct.

2. The plan says the rate limiter goes after auth "so only authenticated requests are counted". But on loopback with no token, `bearerAuth` is a no-op passthrough. This means on the default loopback deployment, the rate limiter counts ALL requests (authenticated or not) -- which is the correct behavior for a loopback single-tenant setup.

**Recommendation:** The plan should explicitly note that on no-token loopback, ALL requests (including those without any auth header) hit the rate limiter. This is fine but should be documented to prevent confusion.

### I3. Headers on Non-429 Responses Leak Configuration (Confidence: 83)

**Issue:** The plan mentions `RateLimit-Limit/Remaining/Reset` headers. If emitted on every response (not just 429), they reveal:
- The exact rate limit configuration per tier
- How many tokens remain in the bucket
- When the bucket resets

An attacker could use `Remaining` to precisely time their requests to stay at exactly 1 token remaining, maximizing their throughput while never triggering the 429 and its associated logging.

For a loopback single-tenant daemon, this is low risk (the attacker already has full access). For non-loopback deployments, this is information disclosure.

**Recommendation:** Make informational rate-limit headers opt-in via a flag (e.g., `--rate-limit-headers`) or only emit them on 429 responses. The `Retry-After` header on 429 is standard and should always be present; the `RateLimit-*` draft-standard headers should be configurable.

### I4. Interaction with `--max-connections` (256) TCP-Level Rejection (Confidence: 82)

**Issue:** Node's `server.maxConnections` (set at line 505-509 in `runQwenServe.ts`) rejects connections at TCP accept time. The rate limiter runs at HTTP level (after TCP accept + HTTP parse). This creates a two-layer defense:

1. **TCP layer (maxConnections=256):** Rejects excess connections before any HTTP processing. Good for connection floods.
2. **HTTP layer (rate limiter):** Rejects excess requests on established connections. Good for request floods on persistent connections.

The gap: if an attacker opens 255 connections and holds them (TCP established, no HTTP traffic), they consume the connection budget. One more connection and the legitimate client is TCP-rejected. The rate limiter never sees this attack because no HTTP requests are being made.

This is NOT a rate limiter problem per se -- it's a connection-exhaustion issue already present. But the plan should acknowledge that the rate limiter does NOT protect against slow-connection attacks (Slowloris-style). The existing `maxConnections` is the only defense, and it's coarse-grained (no per-IP connection limiting).

**Recommendation:** Add a note in the plan that rate limiting addresses request-rate attacks, not connection-exhaustion attacks. The existing `maxConnections` handles the latter. A future enhancement could add per-IP connection limiting, but that's out of scope for this PR.

### I5. Startup Burst After Crash-Loop Restart (Confidence: 80)

**Issue:** The plan's in-memory token buckets reset on daemon restart. In a crash-loop scenario:
1. Client sends requests at high rate
2. Rate limiter kicks in, rejects requests
3. Daemon crashes (for unrelated reason)
4. Daemon restarts -- fresh buckets, full tokens
5. Client immediately gets a fresh budget

If the daemon crashes every 30 seconds and the window is 60 seconds, a client effectively gets 2x the configured rate (10 prompts per 30s instead of 10 per 60s on average).

For a single-tenant loopback daemon, this is low risk. The operator is both the client and the daemon runner -- if the daemon is crash-looping, they have bigger problems.

For non-loopback deployments under attack, this is more concerning but still bounded: the attacker's throughput is at most `configured_rate * (window_ms / mean_time_between_crashes)`, which requires the daemon to be crash-looping (itself a severe operational issue).

**Recommendation:** Acknowledge in the plan as a known limitation. Persistent rate limiting (Redis/file-backed) is out of scope for Stage 1. If the daemon is crash-looping, the rate limiter's reset is the least of the operator's problems. Monitoring/alerting on crash loops is the correct mitigation at this layer.

---

## Informational (Below 80)

### INF1. DDoS Amplification on Loopback (Confidence: 70)

The 429 response body is ~120 bytes of JSON. A minimal HTTP request is ~60-80 bytes (headers alone). The amplification factor is approximately 1.5-2x at most -- not meaningful for a real amplification attack (which typically requires 10-100x). Additionally:
- On loopback (`127.0.0.1`), amplification is irrelevant -- traffic doesn't leave the machine.
- On non-loopback, the attacker must have a valid bearer token (the rate limiter is after `bearerAuth`), which means they're already authenticated. An authenticated attacker has much more powerful vectors (prompt injection, resource exhaustion via agent execution).
- Connection-oriented protocol (TCP) -- unlike UDP-based amplification attacks, the attacker can't spoof source IPs.

**Conclusion:** Not a concern. No action needed.

### INF2. Timing Side-Channel (Confidence: 60)

Yes, a rate-limited request (immediate 429) is faster than a passed request (full processing). The timing difference leaks "the bucket is empty" vs. "the bucket has tokens". In theory, on a multi-tenant system, Client B could observe Client A's request rate by measuring their own response times.

However:
- Single-tenant daemon (primary deployment): no other client to leak info about.
- Loopback: network timing noise is minimal, but the attacker is already on the same machine with full visibility.
- Non-loopback: the key extraction separates clients by IP or client-id, so each client has their own bucket. Client B's timing only reveals Client B's own bucket state.

**Conclusion:** Not a concern for the designed deployment model. No action needed.

### INF3. WebSocket Upgrade Bypass (Confidence: 65)

Searched the entire `serve/` directory: no WebSocket handling exists. No `app.on('upgrade')`, no `ws` library import, no WebSocket-related code. The daemon is purely HTTP + SSE. The `httpAcpBridge.ts:178` reference to "WebSocketTransport" is a comment about the ACP SDK's internal architecture, not daemon-level WebSocket handling.

**Conclusion:** Not applicable. No WebSocket upgrade path exists to bypass middleware. Stage 2 mentions WebSocket as future work (per the docs: "Stage 2... WebSocket... polish"), but it's not implemented.

### INF4. Documentation Requirements (Confidence: 75)

The project has extensive documentation that would need updating:
- `/docs/users/qwen-serve.md` -- User-facing daemon docs with a "CLI flags" table (line 169-179). New rate-limit flags need to be added here.
- `/docs/developers/qwen-serve-protocol.md` -- Protocol reference. The 429 rate_limit_exceeded response format needs documenting alongside the existing error shapes.
- The CLI flags table in the user docs currently documents every existing flag; omitting rate-limit flags would be inconsistent.

**Recommendation:** Add a documentation task to the plan's "file changes" section:
- `docs/users/qwen-serve.md`: Add rate-limit flags to CLI table + a "Rate Limiting" section.
- `docs/developers/qwen-serve-protocol.md`: Add 429 `rate_limit_exceeded` to the "Common error shape" section.

### INF5. `--rate-limit-window-ms` Validation (Confidence: 75)

The window is in milliseconds. Edge cases:
- `0` ms window: divide-by-zero in token refill calculation (tokens_per_ms = limit / window_ms).
- Very small window (e.g., 1ms): effectively no rate limiting (bucket refills instantly).
- Very large window (e.g., 86400000 = 24h): tokens refill slowly, legitimate users hit the limit and wait hours.

Same validation pattern needed: positive finite integer, with a sensible minimum (suggest >= 1000ms).
