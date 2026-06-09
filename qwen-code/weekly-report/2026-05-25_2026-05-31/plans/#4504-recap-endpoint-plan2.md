# T2.4 `--allow-origin <pattern>` CORS allowlist — Implementation Plan

## Context

Issue [#4514](https://github.com/QwenLM/qwen-code/issues/4514) Tier 2 row T2.4 — an S-sized untouched item described as "one S-sized PR that unblocks the entire browser-webui surface." Today the daemon hard-walls any request carrying an `Origin` header with `denyBrowserOriginCors` (`packages/cli/src/serve/auth.ts:18-28`) returning 403, with a single carve-out for self-origin demo-page hits (`server.ts:368-396` strips `Origin` when it matches `127.0.0.1:port`/`localhost:port`/`[::1]:port`/`host.docker.internal:port`). Every browser webui calling the daemon cross-origin currently dies on that wall. T2.4 fixes it by adding `--allow-origin <pattern>` so operators can explicitly opt specific origins through, replacing the wall with a configurable allowlist while keeping the secure-by-default posture (no `--allow-origin` = same hard wall as today).

This task was switched from T2.5+T2.6, which a parallel Claude session was already implementing (see `valiant-booping-trinket` worktree on `feat/daemon-session-stats-export`); claim posted on the issue at https://github.com/QwenLM/qwen-code/issues/4514#issuecomment-4536023604.

## Approach

Add one CLI flag, one middleware, one capability tag. Six files touched plus tests. When `--allow-origin` is configured, the new middleware **replaces** `denyBrowserOriginCors` and owns both halves of CORS policy (allow matched origins with proper response headers, 403 unmatched). When `--allow-origin` is absent, the install path is unchanged and `denyBrowserOriginCors` keeps its current job — so today's behavior is preserved bit-for-bit. Layering the new middleware in addition to `denyBrowserOriginCors` does NOT work: a matched request `next()`s into the existing wall which sees `req.headers.origin` is still set and 403s anyway. Single-middleware ownership is the only correct shape.

### Flag shape

- `--allow-origin <pattern>` — repeatable yargs flag (`type: 'string', array: true`), mirroring how operators expect multi-value flags from `gunicorn --bind` / `kubectl --label`. Comma-separated alternative would force a parser for embedded commas (unlikely in origins, but the repeatable form is unambiguous and standard).
- Empty / undefined → no allowlist → today's behavior unchanged.

### Pattern format

Exact origin strings only (`https://app.example.com`, `http://localhost:3000`), plus the literal `*` meaning "any origin" (with an explicit boot-time stderr warning, per how `--no-require-auth` is treated as risky). No glob/regex/subdomain wildcards — adding them invites parser bugs and footguns (e.g. `https://*.evil.example.com` matching `https://attacker.evil.example.com.attacker.com`). Operators with N subdomains list N origins.

The match is case-insensitive on scheme/host (RFC 6454 §4) but exact on port (origins by definition have no path component). Pattern strings are validated at boot — must be either `*` literal or a value where `new URL(pattern).origin === pattern` holds, otherwise the daemon refuses to start with a structured error message identifying the malformed entry. This rejection is **strict by intent**: trailing slashes (`http://localhost:3000/`), paths (`https://app.example.com/foo`), userinfo (`http://user@host`), and query strings all fail the equality check; the error message points the operator at the canonical form (`<scheme>://<host>[:<port>]`). Auto-normalizing would silently accept ambiguous input — operators are better served by an explicit "fix your config" than a silent accept-and-rewrite.

### Middleware behavior

Single `allowOriginCors(origins)` middleware handles three cases:

1. **No `Origin` header** → `next()` immediately. CLI/SDK clients never set Origin (per the comment on `denyBrowserOriginCors`), so this path stays free-of-charge.

2. **`Origin` matches the allowlist** → set CORS response headers and either short-circuit (for OPTIONS preflight) or `next()` (for the actual request):
   - `Access-Control-Allow-Origin: <echoed origin>` (not literal `*`, even when the configured pattern is `*` — echoing preserves the option to add `Allow-Credentials` later without a schema change, and is what every browser-side cache expects paired with `Vary: Origin`)
   - `Vary: Origin` (so any HTTP cache between client and daemon keys correctly)
   - `Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS` (the verbs the daemon actually uses)
   - `Access-Control-Allow-Headers: Authorization, Content-Type, X-Qwen-Client-Id, Last-Event-ID` (the headers SDK clients send today — bearer, JSON content-type, daemon client-id from #4231, and the SSE resume header from `/session/:id/events`)
   - `Access-Control-Max-Age: 86400` (24h preflight cache, browser-typical upper bound)
   - For `OPTIONS` preflight: `res.status(204).end()` — short-circuits the rest of the middleware chain (no body parsing, no host allowlist, no bearer auth). This is the conventional CORS pattern and is **safe**: the preflight only confirms which methods/headers the daemon will accept; the actual subsequent request still runs the full chain (host allowlist → bearer auth → routes), so any anti-DNS-rebinding or auth check still fires before any state is read or mutated.
   - For non-OPTIONS: `next()` runs `hostAllowlist` → `bearerAuth` → body parser → routes as today.

3. **`Origin` present but unmatched** → 403 with the same `{ error: 'Request denied by CORS policy' }` body `denyBrowserOriginCors` returns today. The error envelope intentionally matches so existing clients that parsed the wall's response don't have to special-case the allowlist daemon.

Deliberately NOT setting `Access-Control-Allow-Credentials: true`. The daemon's auth model is bearer-token-in-header, which `Authorization` allows cross-origin without `credentials: 'include'`. If a future deployment needs cookies, that's a separate flag (`--allow-credentials` paired with the requirement that no `*` origin is in the allowlist).

### Demo self-origin shim relationship

The existing demo shim (`server.ts:368-396`) runs BEFORE any CORS middleware and **strips** `Origin` when the request is a loopback self-hit. So by the time `allowOriginCors` (or `denyBrowserOriginCors`) sees the request, `req.headers.origin` is undefined and case 1 above triggers `next()`. The shim is untouched — `--allow-origin` is purely for third-party origins, the self-loopback hop already works regardless.

### Capability tag

`allow_origin: { since: 'v1' }` registered in `SERVE_CAPABILITY_REGISTRY` and advertised CONDITIONALLY through `CONDITIONAL_SERVE_FEATURES` (mirroring `require_auth`'s pattern at `capabilities.ts:271`). Toggle predicate reads a new `allowOriginActive: boolean` field on `AdvertiseFeatureToggles`, true iff the daemon was booted with at least one `--allow-origin`. SDK consumers can pre-flight `caps.features.allow_origin` to know "this daemon honors cross-origin browser hits" without trying and parsing a 403.

The configured origin list is NOT echoed in `/capabilities`. Browser webui already knows its own origin (it called the daemon, after all), and emitting the list would let an unauthenticated reader of `/capabilities` enumerate every trusted origin — useful recon for a misconfigured deployment.

## Critical files to modify

### Middleware + flag plumbing
- `packages/cli/src/serve/auth.ts` — new `allowOriginCors(origins: string[]): RequestHandler` factory plus a small `parseAllowOriginPatterns(raw: string[]): { allowAny: boolean; origins: Set<string> }` helper. Place above the existing `denyBrowserOriginCors` (which keeps its current shape).
- `packages/cli/src/serve/auth.test.ts` — tests for the new middleware: matched origin sets headers + next(); unmatched falls through; OPTIONS preflight 204 with headers; `*` allows any; case-insensitive scheme/host; malformed pattern handling.
- `packages/cli/src/serve/types.ts` — add `allowOrigins?: string[]` to `ServeOptions`.
- `packages/cli/src/serve/runQwenServe.ts` — boot-time validation (each pattern is `*` or a clean URL origin), pass into `createServeApp`, emit a stderr breadcrumb à la `--require-auth` (`qwen serve: --allow-origin: http://localhost:3000, http://localhost:5173` so operators see the configured set in logs). Refuse to start when any pattern is malformed.
- `packages/cli/src/serve/server.ts` — branch at install: `if (opts.allowOrigins?.length) app.use(allowOriginCors(opts.allowOrigins)); else app.use(denyBrowserOriginCors);`. Mirrors the loopback/non-loopback branch already used by `hostAllowlist`. Demo self-origin shim is untouched (already runs first).
- `packages/cli/src/serve/server.test.ts` — route-level tests: GET /capabilities with `Origin` matching → 200 + CORS headers; POST /session/:id/prompt OPTIONS preflight → 204 + headers; mismatched Origin → 403 from existing wall; capability advertisement on/off; SSE EventSource cross-origin smoke (Last-Event-ID).
- `packages/cli/src/commands/serve.ts` — new `.option('allow-origin', { type: 'string', array: true, description: ... })` and thread `argv['allow-origin']` into `runQwenServe({ allowOrigins })`.

### Capability registry
- `packages/cli/src/serve/capabilities.ts` — register `allow_origin: { since: 'v1' }`, add `allowOriginActive?: boolean` to `AdvertiseFeatureToggles`, add `['allow_origin', (toggles) => toggles.allowOriginActive === true]` to `CONDITIONAL_SERVE_FEATURES`. Update `server.ts`'s `/capabilities` envelope assembly to thread `allowOriginActive: (opts.allowOrigins?.length ?? 0) > 0`.

### SDK (light touch)
- `packages/sdk-typescript/src/daemon/index.ts` and `types.ts` — no new helper needed; SDK consumers read `caps.features.allow_origin` like any other tag, and browser webui issues fetch calls directly. The DaemonClient itself runs in Node/SDK contexts where `Origin` is not auto-attached by `fetch`, so it doesn't interact with the new middleware.
- `packages/sdk-typescript/test/unit/daemon-public-surface.test.ts` — type-lock the new capability literal (covered if the registry test already enumerates `ServeFeature`; no SDK-side type changes needed otherwise).

### Docs
- `docs/developers/qwen-serve-protocol.md` — new "CORS allowlist" section describing the flag, advertised capability, header semantics, and the loopback-self-origin shim's relationship to the allowlist.
- `docs/users/qwen-serve.md` — operator-facing flag bullet with example.

## Reused helpers (no duplication)

- `denyBrowserOriginCors` — kept as fall-through wall (`auth.ts:18-28`).
- Self-origin loopback strip — kept as-is (`server.ts:368-396`).
- `CONDITIONAL_SERVE_FEATURES` Map pattern — same shape as `require_auth` / `mcp_workspace_pool` (`capabilities.ts:267-279`).
- `writeStderrLine` for boot breadcrumb — same helper `--require-auth` uses (`runQwenServe.ts:355-360`).
- Yargs repeatable `type: 'string', array: true` — used by `--ignore-patterns` and similar elsewhere in the CLI.

## Out of scope (follow-ups)

- `Access-Control-Allow-Credentials: true` and the cookie-auth deployment model. Bearer-token-via-`Authorization` doesn't need it; adding credentials needs a separate flag plus a "no `*` allowed" boot check (CORS spec forbids `*` with credentials).
- Wildcard subdomain patterns (`https://*.example.com`). Operators with N subdomains list N origins for now. If a real deployment needs 20+ subdomains, revisit with a tightly-scoped parser.
- Per-route CORS policy. Today's daemon has one allowlist for the whole surface — fine because every route shares one auth model.
- Browser cookie / `SameSite` / CSRF tokens. Daemon doesn't issue cookies.
- Caching the `Set` lookup behind a fixed-size LRU. The Set is small (operator-listed origins) and lookup is O(1); no perf concern.

## Verification

End-to-end smoke against a freshly built daemon:

```bash
# Start daemon with two allowed origins
node $WT/dist/cli.js serve --allow-origin http://localhost:3000 --allow-origin http://localhost:5173 &

# T2.4 — capability advertised conditionally
curl -s http://127.0.0.1:4170/capabilities | jq '.features | map(select(. == "allow_origin"))'
# → ["allow_origin"]

# Matched origin → 200 + CORS headers
curl -isD- -H 'Origin: http://localhost:3000' http://127.0.0.1:4170/capabilities | head -10
# → 200, Access-Control-Allow-Origin: http://localhost:3000, Vary: Origin

# OPTIONS preflight → 204
curl -isD- -X OPTIONS -H 'Origin: http://localhost:3000' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: Authorization,Content-Type' \
  http://127.0.0.1:4170/session/foo/prompt | head -10
# → 204, full CORS headers, no body

# Unmatched origin → 403 from existing wall
curl -isD- -H 'Origin: https://evil.example.com' http://127.0.0.1:4170/capabilities | head -5
# → 403 {"error":"Request denied by CORS policy"}

# Daemon without --allow-origin → today's behavior preserved
kill %1; node $WT/dist/cli.js serve &
curl -isD- -H 'Origin: http://localhost:3000' http://127.0.0.1:4170/capabilities | head -5
# → 403, capability tag absent

# Malformed pattern refused at boot
node $WT/dist/cli.js serve --allow-origin 'not-a-valid-origin'
# → exit 1, "Invalid --allow-origin pattern: must be * or a URL origin"

# Wildcard '*'
node $WT/dist/cli.js serve --allow-origin '*' &
curl -is -H 'Origin: https://anywhere.example.com' http://127.0.0.1:4170/capabilities | head -3
# → 200, Access-Control-Allow-Origin: https://anywhere.example.com
```

Unit suites:
```bash
npm run -w @qwen-code/qwen-code-cli test -- src/serve/auth.test.ts src/serve/server.test.ts
npm run build  # 0 TS errors
```

## PR + issue link-back

After the suite is green:
1. `git push -u fork worktree-quiet-whistling-hare:feat/daemon-cors-allow-origin` (avoids the branch-name collision with the in-flight T2.5+T2.6 worktree).
2. `gh pr create --base daemon_mode_b_main` with title `feat(serve): --allow-origin <pattern> CORS allowlist` and a body following #4504's "Summary / What's added / Architecture / Test plan / Out of scope / Docs" structure, attributed `🤖 Generated with [Qwen Code]`.
3. Reply to the T2.4 claim comment on issue #4514 with the PR URL, and replace the T2.4 row in the issue body with "✅ tracked in #NNNN".
4. Set up 20-minute babysit-pr polling on the new PR via the `babysit-pr` skill (`/loop 20m /babysit-pr`).
5. Run code-reviewer agent ×2 and `/codex:review` ×2 on the diff before / after merge prep, per the user's review requirement.

## Final Implementation Status

- **PR status**: Implemented as PR #4527, MERGED on 2026-05-26. Tracking issue #4514 remains OPEN (broader backlog). Reference PR #4504 (session recap) merged same day.
- **What was implemented**: `--allow-origin <pattern>` CORS allowlist exactly as planned — CLI flag (repeatable, yargs `type: 'string', array: true`), `allowOriginCors` middleware replacing `denyBrowserOriginCors` when configured, boot-time pattern validation, conditional `allow_origin` capability tag, OPTIONS preflight 204, origin echoing with `Vary: Origin`, and documentation.
- **Key divergences**: Implementation closely matched the plan. All 10 planned files were touched: `auth.ts/.test.ts`, `commands/serve.ts`, `capabilities.ts`, `runQwenServe.ts`, `server.ts/.test.ts`, `types.ts`, and both docs files. No SDK-side changes were needed (as planned).
- **Files actually changed**: 10 files in `packages/cli/src/serve/`, `packages/cli/src/commands/`, and `docs/`.
