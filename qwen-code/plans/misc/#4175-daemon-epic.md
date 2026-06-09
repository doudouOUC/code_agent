# PR Plan: `POST /session/:id/recap` — daemon-side session recap

## Context

`/recap` is a TUI slash command (`packages/cli/src/ui/commands/recapCommand.ts`)
that produces a one-sentence "where did I leave off" summary by calling
`generateSessionRecap(config, abortSignal)` from
`packages/core/src/services/sessionRecap.ts`. The core function is
already daemon-clean: it runs a side-query against the fast model with
tools disabled, returns `string | null`, and never throws.

Daemon clients (SDK / web UI / IDE plugins) currently can't reach it.
There is no daemon route, no SDK method, no SSE event. This is the #1
"core feature missing from daemon" gap by ROI in the #4175 inventory:
trivial port, immediate value (status-bar recap, IDE "you've been away"
banner, SDK session summarisation).

This PR adds `POST /session/:id/recap` to `qwen serve`, the matching
SDK surface, tests, and docs. Manual trigger only — no auto-firing or
SSE fan-out in v1. The PR targets the long-lived `daemon_mode_b_main`
integration branch per the #4175 branching strategy.

## Architectural choice: ext-method roundtrip

`generateSessionRecap` needs the per-session `Config` instance, which
lives inside the ACP child process — the daemon (`httpAcpBridge`) does
not hold it directly. Existing routes that need per-session state
(`setSessionApprovalMode`, `setSessionModel`) follow this pattern:

```
HTTP route (server.ts)
  → bridge.method(sessionId, ...)               (httpAcpBridge.ts)
    → entry.connection.extMethod(...)           (ACP control channel)
      → acpAgent handles ext-method             (acpAgent.ts)
        → session.getConfig() + core call
```

The new route reuses this pipe verbatim. Adds one new ext-method id
(`qwen/control/session/recap`).

## Decisions (already confirmed with user)

- **Non-strict mutation gate** (`mutate()` not `mutate({strict: true})`).
  Recap costs tokens but writes nothing; same posture as `/prompt`,
  which is also non-strict. Any operator that wants to lock down recap
  can do so by configuring a token, which gates everything.
- **Capability tag `session_recap`.** Matches the simple-noun pattern
  (`workspace_init`, `workspace_memory`).
- **PR scope: route + SDK + tests + docs only.** No `chat.mjs` change
  in this PR (follow-up). No auto-trigger / away-detection (out of
  scope for v1).

## Files to change (17)

### 1. Capability advertisement
- `packages/cli/src/serve/capabilities.ts:~153` — add
  `session_recap: { since: 'v1' }` to `SERVE_CAPABILITY_REGISTRY`.

### 2. ACP control-channel ext-method
- `packages/acp-bridge/src/status.ts:107` — add
  `sessionRecap: 'qwen/control/session/recap'` to
  `SERVE_CONTROL_EXT_METHODS`.
- `packages/acp-bridge/src/bridgeTypes.ts:~314` — add
  `generateSessionRecap(sessionId: string, opts?: { signal?: AbortSignal; clientId?: string }): Promise<DaemonSessionRecapResult>`
  to the `HttpAcpBridge` interface.

### 3. ACP child handler
- `packages/cli/src/acp-integration/acpAgent.ts:~1625` — handle the new
  ext-method:
  ```ts
  case SERVE_CONTROL_EXT_METHODS.sessionRecap: {
    const config = this.sessionOrThrow(params.sessionId).getConfig();
    const recap = await generateSessionRecap(config, params.abortSignal);
    return { sessionId: params.sessionId, recap };
  }
  ```

### 4. Bridge implementation
- `packages/cli/src/serve/httpAcpBridge.ts:~3470` — add the
  `generateSessionRecap` method that mirrors `setSessionApprovalMode`'s
  pattern: lookup session entry, call `extMethod` with the new id,
  forward the abort signal, surface ACP errors as `DaemonHttpError`-
  shaped throws.

### 5. HTTP route
- `packages/cli/src/serve/server.ts:~1409` — register
  `app.post('/session/:id/recap', mutate(), ...)`. Returns 200 with
  `{ sessionId, recap }` on success (recap may be `null`); 404 on
  unknown session; 400 on malformed sessionId; passes `req.signal` (or
  an AbortController triggered on `req.on('close')`) into the bridge
  call so client disconnect aborts the underlying side-query.

### 6. SDK types
- `packages/sdk-typescript/src/daemon/types.ts:~762` — add:
  ```ts
  export interface DaemonSessionRecapResult {
    sessionId: string;
    /** One-sentence recap; null when history is too short or the
     *  side-query failed (best-effort, never throws). */
    recap: string | null;
  }
  ```

### 7. SDK client method
- `packages/sdk-typescript/src/daemon/DaemonClient.ts:~886` — add
  `recapSession(sessionId, opts?: { signal?, clientId? }): Promise<DaemonSessionRecapResult>`.
  Pre-flight `caps.features.session_recap` documented in JSDoc, same
  shape as `setSessionApprovalMode`'s "old daemons return 404" note.
  Bypasses `fetchTimeoutMs` because the side-query can take seconds;
  cancellation is via the optional `signal` (same posture as `prompt`).

### 8. SDK session-client convenience wrapper
- `packages/sdk-typescript/src/daemon/DaemonSessionClient.ts:~219` —
  add `recap(opts?): Promise<DaemonSessionRecapResult>` that delegates
  to `client.recapSession(this.sessionId, ...)` with bound `clientId`.

### 9. SDK barrels
- `packages/sdk-typescript/src/daemon/index.ts:~127` — re-export
  `DaemonSessionRecapResult` next to `DaemonInitWorkspaceResult`.
- `packages/sdk-typescript/src/index.ts:~30` — re-export
  `type DaemonSessionRecapResult` from `./daemon/index.js` next to the
  other small result types.

### 10. Tests
- `packages/cli/src/serve/server.test.ts:~2448` — new
  `describe('POST /session/:id/recap')` with cases:
  - 200 success returning `{ sessionId, recap: 'pong' }`
  - 200 success returning `{ sessionId, recap: null }` (short history)
  - 404 unknown sessionId
  - 400 malformed sessionId
  - clientId header propagation through `extMethod` context
  - client-disconnect aborts the bridge call (use a `req.destroy()`
    pattern; assert `bridge.recapSessionCalls` saw an aborted signal)
  - capability `session_recap` advertised by `/capabilities`
  - Add `recapSessionImpl` + `recapSessionCalls` to `FakeBridge`
    (around lines 230 / 314 / 672).
- `packages/cli/src/serve/httpAcpBridge.test.ts:~4398` — new
  `describe('generateSessionRecap')` mirroring the
  `setSessionApprovalMode` test: ext-method forwarding, session
  resolution, abort propagation.
- `packages/cli/src/acp-integration/acpAgent.test.ts` (find suitable
  describe for the ext-method dispatcher) — verify the new case
  resolves to the core function with the right config.
- `packages/sdk-typescript/test/unit/DaemonClient.test.ts:~1271` —
  `recapSession` HTTP call: URL, method, body shape, clientId header,
  signal propagation, 404 → throws DaemonHttpError.
- `packages/sdk-typescript/test/unit/DaemonSessionClient.test.ts` —
  add `session.recap()` convenience wrapper coverage (mirror existing
  `session.heartbeat()` test).
- `packages/sdk-typescript/test/unit/daemon-public-surface.test.ts` —
  add type-only import of `DaemonSessionRecapResult` and an
  `expectTypeOf<DaemonSessionRecapResult>().not.toBeNever()` assertion
  so a missing barrel re-export is a compile error.

### 11. Docs
- `docs/developers/qwen-serve-protocol.md:~1243` — new
  `#### POST /session/:id/recap` section: request shape (empty body),
  response shape, capability gate, abort semantics, error envelope.
- `docs/users/qwen-serve.md:~15` — mention `/recap` in the runtime
  control feature list.
- `docs/design/session-recap/session-recap-design.md` — append a
  short "Daemon access path" subsection pointing at the route.

## Reused functions / helpers

Nothing new in core. All wiring reuses:
- `generateSessionRecap` (`packages/core/src/services/sessionRecap.ts:44`)
- `createMutationGate` (`packages/cli/src/serve/auth.ts`)
- `SERVE_CONTROL_EXT_METHODS` registry pattern (`packages/acp-bridge/src/status.ts`)
- `FakeBridge` factory (`packages/cli/src/serve/server.test.ts:470`)
- `recordingFetch` SDK test helper (`packages/sdk-typescript/test/unit/DaemonClient.test.ts`)

## Verification

End-to-end happy path (after `npm install && npm run build`):

```bash
# Terminal A
mkdir -p /tmp/qwen-recap && cd /tmp/qwen-recap
node $WT/dist/cli.js serve

# Terminal B (after a short conversation)
curl -s -X POST http://127.0.0.1:4170/session/$SID/recap | jq .
# expect: {"sessionId":"sess_xxx","recap":"…one sentence…"}

# Capability advertised
curl -s http://127.0.0.1:4170/capabilities | jq '.features'
# expect: includes "session_recap"

# Empty-history null path
# (call /recap immediately after creating a session, before /prompt)
# expect: {"sessionId":"sess_xxx","recap":null}

# Abort on client disconnect
curl -m 1 -s -X POST http://127.0.0.1:4170/session/$SID/recap || true
# expect: server logs show the abort propagated; no zombie LLM call

# Unit tests
npm run test -w @qwen-code/qwen-code -- serve/server.test
npm run test -w @qwen-code/qwen-code -- serve/httpAcpBridge.test
npm run test -w @qwen-code/sdk
```

## Out of scope (follow-ups)

- `chat.mjs` `/recap` slash command — separate commit, three lines.
- Auto-trigger / away-detection — needs idle timer + new SSE event +
  per-session config knob; PR doubles in size.
- Streaming the recap (it's small enough; one shot is fine).
- `prompt_suggestion` SSE event (different feature, same #4175 sub-goal,
  separate PR).

## PR description draft (commit message + GitHub body)

```
feat(serve): add POST /session/:id/recap

Wraps generateSessionRecap (core/services/sessionRecap.ts) so daemon
clients can fetch a one-sentence "where did I leave off" summary
without driving the agent through a full prompt turn. Mirrors the
ext-method roundtrip used by /session/:id/approval-mode.

- Route: non-strict mutation gate (parity with /prompt)
- Capability: `session_recap`
- SDK: client.recapSession + session.recap convenience wrapper
- No auto-trigger; manual call from clients only

Closes part of #4175 (Top 5 ROI port #1 from the daemon coverage gap
inventory). Targets daemon_mode_b_main integration branch.

🤖 Generated with [Qwen Code](https://github.com/QwenLM/qwen-code)
```

## Final Implementation Status

- **PR status**: #4175 (parent tracking issue) — OPEN. The `/recap` daemon route was implemented as part of PR #4222 (MERGED 2026-05-17, "Add daemon session load/resume").
- **What was implemented**: The `POST /session/:id/recap` route was included in the broader session load/resume PR (#4222) rather than as a standalone PR. The implementation followed the ext-method roundtrip pattern described in this plan.
- **Key divergences**: Bundled into a larger PR (#4222) instead of a standalone PR. The 17-file scope described here was likely reduced since it shipped alongside related session features.
- **Files actually changed (PR #4222)**: `docs/developers/qwen-serve-protocol.md`, `docs/users/qwen-serve.md`, `packages/cli/src/acp-integration/acpAgent.ts` (+test), `packages/cli/src/serve/capabilities.ts`, `packages/cli/src/serve/httpAcpBridge.ts` (+test), `packages/cli/src/serve/server.ts` (+test), `packages/sdk-typescript/src/daemon/DaemonClient.ts` (+test), `packages/sdk-typescript/src/daemon/DaemonSessionClient.ts`, `packages/sdk-typescript/src/daemon/types.ts`, `packages/sdk-typescript/src/daemon/index.ts`, `packages/sdk-typescript/src/index.ts`
