# Round 5 Audit Findings: Rate Limiting Design for `qwen serve`

## Summary of Investigation

Explored 10 distinct angles not covered by prior rounds (1-4). Findings below organized by severity.

---

## Critical (90-100)

### Finding 5.1: `/acp` Streamable HTTP transport WILL be rate-limited but SHOULD NOT be (Confidence: 95)

**File**: `packages/cli/src/serve/server.ts` (line 871, 873, 2860)
**File**: `packages/cli/src/serve/acpHttp/index.ts`

**Problem**: The plan places the rate limiter as `app.use()` middleware between `bearerAuth` (line 871) and `express.json()` (line 873). Since `mountAcpHttp(app, bridge, ...)` registers routes on the SAME Express `app` at `/acp` (line 2860), all `POST /acp`, `GET /acp`, and `DELETE /acp` requests will pass through the rate limiter middleware.

The tier classification from the plan:
- `POST /acp` maps to **mutation tier** (30/min) because it's a non-prompt POST
- `GET /acp` maps to **read tier** (120/min) — but it's a long-lived SSE stream!
- `DELETE /acp` maps to **mutation tier**

This is wrong for multiple reasons:
1. **ACP is machine-to-machine protocol**: A single ACP connection may issue hundreds of JSON-RPC requests per minute (`session/new`, `session/prompt`, `tools/list`, etc.) all tunneled through `POST /acp`. Hitting the 30/min mutation cap would break the protocol.
2. **ACP already has its own capacity control**: `ConnectionRegistry` enforces `maxConnections=64`, idle TTL sweeps, and per-connection session caps. Double-limiting is pointless.
3. **GET /acp is a persistent SSE stream**: It should be exempt like `GET .../events`.

**Fix**: Add `/acp` to the exempt tier alongside `/health`, `/demo`, heartbeat, and SSE events. The exempt check in the rate limiter should match `req.path === '/acp'` or `req.path.startsWith('/acp')`.

---

## Important (80-89)

### Finding 5.2: `POST /sessions/delete` batch amplification (Confidence: 85)

**File**: `packages/cli/src/serve/server.ts` (lines 1688-1737)

**Problem**: `POST /sessions/delete` accepts up to 100 session IDs in a single request. The rate limiter counts it as **1 mutation request** (toward the 30/min cap), but it triggers:
- Up to 100 `bridge.closeSession()` calls (each aborts an active prompt, closes SSE streams, tears down child processes)
- A batch `SessionService.removeSessions()` that deletes transcript files from disk

A client can destroy 100 sessions every request x 30 requests/minute = **3000 session teardowns per minute** while staying within the rate limit. This far exceeds the daemon's actual session cap (maxSessions=20), so the real blast radius is bounded by the session cap rather than the rate limit. However, the repeated creation+deletion cycle (create 20, batch-delete, repeat 30x/min) can churn 600 session lifecycles/minute.

**Assessment**: Low real-world risk because `maxSessions=20` bounds the actual damage. The rate limiter's job is request-rate, not operation-cost accounting. Document the asymmetry but no code change needed immediately. If operation-cost weighting is added later, `POST /sessions/delete` should cost `min(sessionIds.length, 10)` toward the mutation budget.

**Fix (design note)**: Add a comment in the tier classification documenting this as a known asymmetry, acceptable because session-cap provides the real bound.

---

### Finding 5.3: `Date.now()` vs `performance.now()` inconsistency (Confidence: 82)

**Problem**: The plan specifies `window=60000ms` for the token bucket. The codebase uses BOTH timing approaches:
- `Date.now()` in server.ts (access log, SSE idle tracking, telemetry) — 12+ call sites
- `performance.now()` in filesystem operations (workspaceFileSystem.ts, workspaceFileRead.ts glob handler)

For a rate limiter, `Date.now()` is the correct choice because:
1. The token bucket window (60s) is far too large for `performance.now()`'s monotonic-vs-wallclock distinction to matter
2. The bucket's purpose is wallclock rate control, not high-resolution duration measurement
3. Consistency with the server.ts middleware patterns (telemetry, access-log all use `Date.now()`)
4. `performance.now()` is more appropriate for sub-second latency measurement (as the FS layer uses it)

BUT: `Date.now()` is vulnerable to system clock adjustments (NTP jumps, VM suspend/resume). A backward jump could make `Date.now() - bucket.lastRefill` negative, which if used in `tokens += elapsed / windowMs * maxTokens` would SUBTRACT tokens. A forward jump of >60s would instantly refill the bucket.

**Fix**: Use `Date.now()` for consistency, but clamp the elapsed delta: `const elapsed = Math.max(0, now - bucket.lastRefill)`. This prevents negative token arithmetic from clock skew. Forward jumps are acceptable (equivalent to a fresh bucket, which is the rate limiter's leniency-side default anyway).

---

### Finding 5.4: Express 5 error propagation from synchronous middleware throws (Confidence: 83)

**File**: `packages/cli/src/serve/server.ts` (lines 2869-2884)

**Problem**: If the rate limiter middleware throws synchronously (Map corruption producing undefined, NaN comparison, prototype pollution on the bucket Map), Express 5 behavior differs from Express 4:
- Express 5 propagates synchronous throws from middleware to the error handler (4-arg middleware)
- Express 5 also propagates rejected promises from `async` route handlers

The existing final error handler (line 2869) catches unhandled errors and returns JSON 500. This means a rate limiter crash would NOT crash the process — Express 5's router catches synchronous throws from `(req, res, next)` middleware and routes them to error handlers.

**Assessment**: The design is safe here due to the existing catch-all error handler. However, if the rate limiter is implemented as `async` middleware (unnecessary for a synchronous Map lookup), an unhandled rejection could theoretically bypass the error handler in edge cases. Ensure the rate limiter is implemented as a synchronous `(req, res, next)` function, not async.

**Fix**: Implement the rate limiter as synchronous middleware. Add a defensive try-catch inside it that calls `next()` on any error (fail-open) rather than letting the throw propagate to Express's error handler (which would return a generic 500 to the client instead of passing the request through).

---

### Finding 5.5: HEAD requests counted toward read tier (Confidence: 80)

**Problem**: Express 5's `app.get()` automatically responds to HEAD requests (same as Express 4). The plan's tier classification says "all GET (except health/demo/SSE)" maps to the read tier at 120/min. HEAD requests to the same paths would also be classified as reads.

HEAD requests are lightweight (no response body) and typically used for probing/caching validation. Counting them toward the same budget as GET is correct from a security perspective (they still trigger route handlers, hit the database/FS, etc.), but it means a monitoring tool that HEAD-pings `/capabilities` every 500ms would exhaust the read budget in 4 seconds.

**Assessment**: This is fine as-is. HEAD and GET execute the same handler (minus body serialization). Counting them together is the conservative correct choice. The 120/min read budget is generous enough that legitimate HEAD polling won't hit it. No action needed.

---

### Finding 5.6: Memory accumulation under diverse IPs between GC sweeps (Confidence: 84)

**Problem**: The plan specifies a GC sweep for stale buckets (from prior round's finding). However, the plan's GC interval and the number of possible unique keys between sweeps needs analysis.

Non-loopback with IP-based keys: the daemon's `maxConnections=256` (TCP level, line 57-69 in types.ts) limits concurrent sockets, but over a GC sweep interval of (say) 60s, connection churn could create entries for many more unique IPs than are simultaneously connected. Each closed TCP connection still leaves a bucket entry until the next GC sweep.

Worst case: 256 connections cycling every second = 15,360 unique IP entries per 60s sweep. Each bucket is ~48 bytes (key string + lastRefill + tokens). That's ~1.5 MB — negligible.

BUT: with the combined key format `{ip}:{clientId}`, a malicious actor with a single IP but unique `X-Qwen-Client-Id` on every request could create unlimited entries (the header is validated for format but not uniqueness). On loopback this is the PRIMARY key.

**Fix**: The GC sweep interval must be paired with a hard cap on total bucket entries (e.g., 10,000). When the cap is reached, either:
- Reject new keys with 429 (aggressive)
- Evict the oldest-touched bucket (LRU-like, still O(n) on a Map scan but acceptable at 10K)
- Fail-open for the excess keys (accept the request without tracking)

The plan's prior round noted the anonymous bucket concern but this client-id explosion vector is distinct and more severe since each unique client-id gets its own full token budget.

---

### Finding 5.7: Byte-rate limiting / body-size amplification (Confidence: 80)

**Problem**: The rate limiter counts requests, not bytes. The plan places the rate limiter BEFORE `express.json({ limit: '10mb' })`. This means:
1. A rate-limited request (429) never hits the body parser — good, saves CPU
2. A request that PASSES the rate limiter still gets its full 10MB body parsed

A client within rate limits (30 mutations/min) sending 10MB bodies on every request = 300 MB/min of body parsing + network I/O. Across 20 sessions with different client IDs, that's 6 GB/min of JSON parsing.

**Assessment**: This is an inherent limitation of request-count rate limiting. The 10MB `express.json` limit already caps per-request size. The real mitigation is that:
- `maxConnections=256` bounds concurrent TCP sockets
- Body parsing is streaming (not buffered in full before the 10MB check)
- The daemon is single-workspace/local — network bandwidth to localhost is not a real constraint

For non-loopback deployments where bandwidth matters, a separate byte-rate limit (e.g., `express-slow-down` or a custom `content-length` check before body parsing) would be the right layer. This is out of scope for the current design but should be documented as a future enhancement.

**Fix (design note only)**: Add a comment noting that request-count limiting does not address body-size amplification; operators exposing the daemon on a non-loopback interface should front it with a reverse proxy that enforces byte-rate limits.

---

### Finding 5.8: Multiple limiters extensibility / stacking (Confidence: 81)

**Problem**: The plan uses a single `createRateLimiter()` middleware with per-tier budgets keyed by extracted client identity. Can this design support future stacking (e.g., per-client + global)?

Analysis of the plan's design:
- One Map per tier (prompt/mutation/read)
- Key = extracted client identity
- Single middleware function

To add a global rate limit (e.g., 1000 total requests/min regardless of client), the design would need either:
- A second `app.use()` middleware (trivial to add)
- Or a compound key approach within the same middleware

The current design is extensible because:
1. It's a factory (`createRateLimiter(config)`) — can be called multiple times with different configs
2. Middleware stacking is Express's native composition model
3. The key extractor is a separate function that can be swapped

**Assessment**: No design change needed. The factory pattern naturally supports composition. A future per-session limiter could mount as route-level middleware on `/session/:id/*` routes specifically.

---

### Finding 5.9: Restart retry storm / fresh bucket burst (Confidence: 82)

**Problem**: When the daemon restarts, all in-memory rate limit buckets are lost. If 20 clients had queued prompts and immediately retry on reconnect, they face fresh buckets (full token allowance). The prompt tier allows 10/min/client, so 20 clients x 10 = 200 prompts can be submitted in the first second after restart.

Is this the rate limiter's job or the bridge's?

Analysis:
- The bridge's `maxSessions=20` limits concurrent sessions
- Each session can only have ONE active prompt at a time (`SessionBusyError`)
- So the actual burst is: 20 clients x 1 prompt = 20 prompts (not 200)
- The 10/min budget is PER CLIENT — a single client can't burst 10 prompts because `SessionBusy` rejects the 2nd before the 1st completes

**Assessment**: The session-busy constraint is the real throttle on prompt storms. The rate limiter's fresh-bucket burst is bounded by `min(maxSessions, prompt_limit)` = `min(20, 10)` = 10 concurrent prompts per client, but only 1 can execute per session. 20 sessions = 20 concurrent prompts = normal steady-state load. No action needed.

**Fix**: None. The bridge's session-busy semaphore is the correct layer for prompt concurrency control. The rate limiter prevents the SUBMISSION flood (client hammering retry before getting SessionBusy back), which is its appropriate role.

---

### Finding 5.10: File write routes classified as mutation tier is correct (Confidence: 88)

**File**: `packages/cli/src/serve/routes/workspaceFileWrite.ts`
**File**: `packages/cli/src/serve/routes/workspaceFileRead.ts`

**Analysis**: 
- `POST /file/write` and `POST /file/edit` (workspaceFileWrite.ts) — registered as POST routes with `mutate({ strict: true })` gate. They write to the filesystem. Correctly classified as **mutation tier** (30/min).
- `GET /file`, `GET /file/bytes`, `GET /stat`, `GET /list`, `GET /glob` (workspaceFileRead.ts) — registered as GET routes. Correctly classified as **read tier** (120/min).

Should file ops have a separate tier? The read routes can be expensive (`GET /glob` with `maxResults=50000`), but:
1. They already have their own per-route caps (`MAX_LIST_ENTRIES=2000`, `MAX_GLOB_MAX_RESULTS=50000`)
2. 120 reads/min is generous for filesystem browsing
3. Writes at 30/min is appropriate — an agent loop issuing edits can do ~2 edits/second which is fine for legitimate workflows

**Assessment**: Current tier classification is correct. No separate "file" tier needed. The per-route size caps provide the second layer of protection.

---

## Informational (below threshold, documented for completeness)

### 5.I1: The plan's middleware position contradicts current code structure

The plan says `bearerAuth -> rateLimiter -> express.json() -> routes`. Looking at lines 871-873:
```
app.use(bearerAuth(opts.token));    // line 871
app.use(express.json({ limit: '10mb' }));  // line 873
```
There is no gap — the rate limiter must be inserted between these two lines. This is implementable but the benefit (avoiding JSON parse on 429'd requests) only matters for requests with bodies (POST/PATCH/DELETE). GET requests have no body to parse, so the ordering optimization only helps the mutation and prompt tiers. This is fine — those are exactly the tiers where 429 is most likely to fire.

### 5.I2: ACP HTTP uses the same `express.json()` middleware for body parsing

`POST /acp` uses `req.body` (line 90 of acpHttp/index.ts), which means it relies on the app-level `express.json()` middleware. This is relevant to Finding 5.1 — if `/acp` is exempted from rate limiting, it still passes through `express.json()`, which is correct and necessary.

---

## Recommended Actions (Priority Order)

1. **[Critical]** Add `/acp` (and its sub-paths) to the exempt tier — it's a machine-to-machine transport with its own capacity control
2. **[Important]** Clamp elapsed-time delta to `Math.max(0, ...)` to guard against clock skew
3. **[Important]** Add a hard cap on total bucket entries (prevent client-id explosion)
4. **[Important]** Implement rate limiter as synchronous middleware with internal try-catch (fail-open)
5. **[Design note]** Document batch endpoint amplification and byte-rate as known limitations
