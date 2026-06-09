# Round 7 Audit Findings: Rate Limiting Design for `qwen serve`

## Summary of Investigation

Investigated 10 specific edge cases in the proposed rate limiting implementation by examining the actual codebase: Express 5 middleware patterns, Node.js event loop model, key namespace design, prompt route semantics, boolean env var conventions, capabilities registration, and the GC interaction model.

---

## Critical (90-100)

### Finding 7.1: Plan incorrectly assumes `POST /session/:id/prompt` returns 202 (non-blocking)

**Confidence: 95**
**File:** `/Users/jinye.djy/Projects/qwen-code/packages/cli/src/serve/server.ts` line 1166

The audit question #6 assumes `POST /session/:id/prompt` returns `202 Accepted` and is non-blocking. This is factually incorrect in the implementation. The route does:

```typescript
const result = await bridge.sendPrompt(sessionId, {...}, abort.signal, ...);
res.status(200).json(result);
```

The request blocks (awaits) until the LLM work completes, serialized through a per-session FIFO (`entry.promptQueue`). A client cannot "rapidly fire 10 non-blocking prompts" because each HTTP connection holds open until the prompt finishes. Additional concurrent prompts from the same client queue behind the FIFO (they don't get a response until prior prompts drain).

**Impact on design:** The plan's prompt tier at `max=10/60s` is counting correctly: each token is consumed AND held until the LLM returns 200. The concern about 10 rapid 202s queuing 10 LLM calls is not possible in the current architecture. No design change needed, but the plan should NOT document this as a "202" endpoint if it references the prompt route semantics anywhere.

---

## Important (80-89)

### Finding 7.2: `createRateLimiter()` return shape needs careful Express 5 wiring

**Confidence: 88**
**File:** `/Users/jinye.djy/Projects/qwen-code/node_modules/express/lib/application.js` line 213

Express 5's `app.use()` throws `TypeError('app.use() requires a middleware function')` if passed a non-function. The plan says `createRateLimiter()` returns `{ middleware, reset }`. This object CANNOT be passed directly to `app.use()`.

Two viable patterns exist in this codebase:
1. `server.ts` destructures the return value: `const { middleware, reset } = createRateLimiter(opts); app.use(middleware);` and passes `reset` separately to test hooks or deps.
2. Return the middleware function with `reset` as an attached property: `const mw = (req, res, next) => {...}; mw.reset = resetFn; return mw;`

Pattern (1) is cleaner and matches `createMutationGate`'s factory-returns-function style. The plan should explicitly specify that `server.ts` destructures the result:

```typescript
const limiter = createRateLimiter(opts);
app.use(limiter.middleware);
// limiter.reset() available for tests; limiter.setDraining(true) for shutdown
```

**Recommendation:** Clarify in the plan that `app.use(limiter.middleware)` is the wiring, not `app.use(createRateLimiter(...))`. Alternatively, adopt the "function-with-properties" pattern where `createRateLimiter` returns a `RequestHandler & { reset(): void; setDraining(v: boolean): void }`.

---

### Finding 7.3: Node.js event loop model prevents GC/request race

**Confidence: 87**

The audit question #1 asks whether a `setInterval` GC sweep could delete a bucket between two microtasks of a concurrent request. The answer is **no** -- this is safe in Node.js's single-threaded event loop model.

Node.js processes one task (macrotask) at a time. A `setInterval` callback and an incoming HTTP request handler both run as macrotasks. They cannot interleave mid-execution. Within a single synchronous request handler execution:

1. Read `bucketMap.get(key)` -> bucket
2. Mutate `bucket.tokens -= 1`

...these two operations are in the same synchronous turn. The GC `setInterval` callback CANNOT fire between them because JavaScript is run-to-completion within a single macrotask.

The only danger would be if the rate limiter middleware were `async` and `await`ed between the bucket read and the token decrement. The plan's algorithm is purely synchronous (no awaits between get and decrement), so no race is possible.

**Verdict:** Not a bug. The plan's design is correct. Document this as a "verified safe" assumption if desired.

---

### Finding 7.4: Key namespace collision between loopback and non-loopback is structurally impossible

**Confidence: 85**

The audit question #2 asks whether a non-loopback client sending `X-Qwen-Client-Id: cid:evil` could collide with a loopback key like `cid:someId`. 

The plan's `createKeyExtractor` is a boot-time decision based on `isLoopbackBind(opts.hostname)`:
- **Loopback bind** (`127.0.0.1`, `localhost`, etc.): Only loopback clients can connect. Keys are `cid:${clientId}` or `anonymous`.
- **Non-loopback bind** (`0.0.0.0`, `10.x.x.x`, etc.): Keys are `${remoteAddress}` or `${ip}:${clientId}`.

Because `isLoopbackBind` is evaluated ONCE at boot and the key-extraction strategy is chosen exclusively (one OR the other), a single daemon instance uses only ONE namespace. A non-loopback daemon never generates `cid:` prefixed keys; a loopback daemon never sees non-loopback clients.

**Exception -- `0.0.0.0` bind:** When hostname is `0.0.0.0`, `isLoopbackBind()` returns `false` (it's not in the `LOOPBACK_BINDS` set). The key extractor uses IP-based keying. A local client on `127.0.0.1` would get key `127.0.0.1` or `127.0.0.1:clientId`. No `cid:` prefix collision.

**Verdict:** Not a bug. Namespace collision is structurally prevented.

---

### Finding 7.5: `0.0.0.0` bind causes all local clients to share one IP bucket

**Confidence: 84**
**File:** `/Users/jinye.djy/Projects/qwen-code/packages/cli/src/serve/loopbackBinds.ts`

When binding to `0.0.0.0`:
- `isLoopbackBind('0.0.0.0')` returns `false`
- Key extraction uses `req.socket.remoteAddress` (IP-based)
- All local clients connecting to `127.0.0.1:4170` see `remoteAddress = '127.0.0.1'`
- They ALL share a single bucket keyed `'127.0.0.1'`

This means: with `--hostname 0.0.0.0 --rate-limit --rate-limit-prompt 10`, ten different local IDE plugins sharing the same machine would collectively be limited to 10 prompts/minute total, not 10 each.

The workaround exists: clients can set `X-Qwen-Client-Id` to get `127.0.0.1:myPlugin` as a composite key. But this is easy to miss.

**Recommendation:** Add to "Known limitations" in the plan: "When bound to `0.0.0.0`, local clients without `X-Qwen-Client-Id` share a single rate-limit bucket (keyed by `127.0.0.1`). Use `X-Qwen-Client-Id` for per-client isolation on `0.0.0.0` binds."

---

### Finding 7.6: Boolean env var `QWEN_SERVE_RATE_LIMIT` has no codebase-consistent parsing pattern

**Confidence: 82**

The codebase uses inconsistent boolean-from-env-var patterns:
- `server.ts:476`: `'1' || 'true' || ''` (three-way truthy)
- `workspaceFileRead.ts:134`: `'1' || 'true'` (two-way)
- `fs/audit.ts:211`: `=== '1'` only (strict)
- `serve.ts:227`: `'1' || 'true'` (two-way for suppress)

The plan doesn't specify which parsing strategy `QWEN_SERVE_RATE_LIMIT` uses. Since this is a yargs `boolean` option, the env var fallback path needs explicit handling. Yargs boolean options don't auto-read env vars -- the handler must check `process.env['QWEN_SERVE_RATE_LIMIT']` manually.

**Recommendation:** The plan should specify: "Parse as `value === '1' || value === 'true'` consistent with `parseBoolFlag` in workspaceFileRead.ts. Empty string / `'yes'` / `'0'` = disabled." And confirm that the `--rate-limit` yargs option falls back to the env var explicitly in the handler (like how `--token` falls back to `QWEN_SERVER_TOKEN`).

---

### Finding 7.7: `recordDaemonRateLimitHit` has no existing counter infrastructure to extend

**Confidence: 80**

Searching the entire `packages/cli/src/serve/` directory and broader `packages/cli/src/` tree reveals NO existing "daemon metrics" module, no OTLP counters, no `recordDaemon*` functions anywhere. The telemetry middleware referenced in the plan (that the rate limiter precedes) doesn't exist yet -- there is no `daemonTelemetry` middleware in `server.ts`.

The `createDefaultFsAuditEmit` (line 87) is a sampled log emitter, not a metrics counter. There's no existing pattern for numeric counters in the serve module.

**Recommendation:** The plan should clarify that `recordDaemonRateLimitHit` is a NEW pattern (not extending an existing one). Implementation options:
1. A simple in-memory counter map (tier -> count) exposed via `/health?deep=1` alongside `sessions` and `pendingPermissions`.
2. A standalone `daemon-metrics.ts` module (but it would be the first of its kind in this package).
3. Just the sampled logging (already planned) plus a counter field in the log message for post-hoc aggregation.

Option 1 is lowest friction and provides observability via an existing API surface.

---

### Finding 7.8: Capability tag timing is safe -- `createServeApp` is fully synchronous

**Confidence: 86**
**File:** `/Users/jinye.djy/Projects/qwen-code/packages/cli/src/serve/server.ts` line 206, 536-553

The audit question #10 asks whether `/capabilities` could advertise `rate_limit` before the limiter is active. The answer is **no, this is safe**, because:

1. `createServeApp()` (line 206) is a synchronous function returning `Application`
2. All `app.use()` / `app.get()` registrations happen synchronously in order
3. The capabilities route (line 536) calls `getAdvertisedServeFeatures()` at REQUEST time (lazy), not at registration time
4. The server only starts listening AFTER `createServeApp()` returns (in `runQwenServe` at line 484: `app.listen(...)`)

So the rate limiter middleware (registered before capabilities route) is fully wired before the first request can arrive. Even if `CONDITIONAL_SERVE_FEATURES` is extended with a `rate_limit` entry, the predicate evaluates at request time against boot-time config -- the middleware is already mounted.

**Verdict:** Not a bug. Verified safe.

---

### Finding 7.9: `Retry-After` precision is acceptable but plan should document edge

**Confidence: 80**

With `max=10, windowMs=60000`: rate = 10/60000 tokens/ms. After consuming all 10 tokens, next request has `bucket.tokens = 0` (or slightly negative due to continuous refill lag). `retryAfterMs = Math.ceil((1 - 0) / (10/60000)) = Math.ceil(6000) = 6000ms`. Header: `Retry-After: 6`.

This is correct and reasonable: with 10 tokens over 60s, each token refills in 6s. The header tells the client to wait 6s for the next token.

For `max=1, windowMs=60000`: rate = 1/60000. After consuming the single token: `retryAfterMs = Math.ceil((1 - 0) / (1/60000)) = Math.ceil(60000) = 60000ms`. Header: `Retry-After: 60`.

This is correct but harsh for a misconfigured `max=1`. The plan already validates `max >= 1` as a positive integer, so `max=1` is legal. The behavior is mathematically correct.

**Verdict:** Not a bug. The continuous-refill semantics are accurately reflected in `Retry-After`. No action needed beyond potentially documenting that `max=1` means "1 request per window, full window wait on exhaustion."

---

## Informational (for documentation, not blocking)

### Finding 7.10: Prompt tier rate limiting is naturally self-throttling

Because `POST /session/:id/prompt` is a blocking (synchronous await) endpoint serialized through a per-session FIFO queue, a single client physically cannot exhaust `max=10` tokens rapidly. Each prompt holds an HTTP connection open for the LLM duration (seconds to minutes). The rate limiter provides protection against:
- Multiple concurrent sessions from the same client (each session has its own FIFO but shares a rate-limit key)
- Rapid retry loops after prompt failures (immediate re-POST attempts)
- Scripted abuse that doesn't wait for responses

The 10/60s default is generous for normal single-session use but provides a meaningful ceiling against automated abuse vectors.
