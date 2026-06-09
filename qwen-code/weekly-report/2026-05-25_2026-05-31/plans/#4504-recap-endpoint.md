# Plan: `POST /session/:id/compress` + `POST /session/:id/_meta` (T1.3 + T1.4)

## Context

Daemon capability backlog #4514 identified two Tier-1 S-sized routes nobody is working on:

- **T1.3** `POST /session/:id/compress` — manual compaction over HTTP, equivalent to TUI `/compress`. Mutates session history (`Chat.setHistory`).
- **T1.4** `POST /session/:id/_meta` — daemon-side per-session KV bag for IM/channel adapters (chat_id, sender_id, thread_id). Replaces the wrapper-layer improvisation today. Daemon-side only (no ACP roundtrip), echoed on `/session/:id/context`, pushed as SSE event on change.

Bundled as ONE PR because both are S-sized session-mutation routes touching the same surface (status / bridgeTypes / bridge / server / capabilities / events / SDK / barrels / tests / docs) and share mutation-gate plumbing. Closes T1.3 + T1.4 from #4514. Template: shipped `POST /session/:id/approval-mode` (Wave 4 PR 17; recap PR #4504 is also a close shape but unmerged so not on `daemon_mode_b_main`).

Out of scope for this PR (parked):
- Auto-inject `_meta` into LLM prompt context (needs pilot to validate prompt format).
- Durable `_meta` across daemon restart (revisit alongside T2.1 resume-graduation). v1 explicitly resets `meta: {}` on load/resume.
- Per-key `DELETE /_meta/:key` and `DELETE /_meta` (replace-with-fewer-keys / replace-with-`{}` covers v1 needs).
- `force=false` (threshold-gated) compress over HTTP (auto-compaction already covers this in-agent; daemon-driven compress is intentionally always `force=true`).
- AbortSignal propagation on compress (no cancel surface in v1 — operators wait or kill session). Hard serialization vs in-flight prompts is also out of scope; v1 only refuses at compress START (`PromptInFlightError 409`), not at prompt START.
- ETag / optimistic concurrency on `_meta` (last-write-wins in v1).

## Design decisions

| # | Question | Decision | Rationale |
|---|---|---|---|
| 1 | Compress SSE event? | **Yes** — emit `session_compacted` on session bus | Compress mutates `setHistory`; cross-client sync (#4484) closes precisely these gaps. Recap had no event because read-only. |
| 2a | Compress concurrency guard (vs another compress)? | **Yes** — `compressInFlight: boolean` flag on `SessionEntry`; second call → 409 `compaction_in_flight` | Chat is single-threaded; two compress calls would race `setHistory`. `promptQueue` FIFO would mask the conflict from the caller. |
| 2b | Compress concurrency guard (vs in-flight prompt)? | **Yes** — refuse with 409 `prompt_in_flight` when `entry.activePromptOriginatorClientId !== undefined` | Agent itself calls `tryCompress` inside `sendMessageStream` (geminiChat.ts:1418) before each model call; a daemon-driven compress overlapping this races on the same chat object. TUI never hits this because input is serialized; daemon has no such serialization. |
| 3 | Compress AbortSignal? | **No in v1** — pass placeholder signal | Cancel surface is its own design; document as v1 limitation in JSDoc. |
| 4 | Compress timeout? | **180s** — `SESSION_COMPRESS_TIMEOUT_MS = 180_000` | Recap uses `SESSION_RECAP_TIMEOUT_MS = 60_000`; match naming convention. Long-history compression takes 10–30s typical, worst-case more. |
| 4b | `NOOP` compression status emits event? | **No** — only emit `session_compacted` when history actually changed | NOOP means below-threshold / nothing to do; history is identical. Emitting would falsely bump `sessionCompactedCount` and trick reducers into thinking state changed. The HTTP response still returns `{compressionStatus: 'NOOP'}` synchronously so the caller knows. |
| 5 | Meta routes? | **Two only**: `POST /_meta` + `GET /_meta` | DELETE-by-replace works for v1; add per-key DELETE only when a consumer asks. |
| 6 | Meta validation | Key regex `^[a-zA-Z][a-zA-Z0-9_.-]{0,63}$`; reserved prefix `qwen.*` (400 `reserved_meta_key`); total serialized ≤ 8 KB (413 `meta_too_large`). **null values in `merge:true` mode set the key to null, do NOT delete it** (delete via replace-with-fewer-keys). | Defensive against pathological payloads; reserves namespace for future daemon-owned keys. Dropped explicit nesting-depth check — 8 KB cap naturally bounds depth and avoids walking the tree twice. |
| 7 | Echo meta on `/session/:id/context`? | **Yes** — add `state.meta: Record<string, unknown>` always present (even `{}`) when daemon supports meta | Removes need for adapters to separately poll `/_meta` on attach/reconnect. Always-present-even-if-empty avoids the "old daemon without support vs new daemon with empty bag" ambiguity; SDK consumers branch on the `session_meta` capability tag for support detection, not on field absence. |
| 8 | Meta event name? | `session_meta_changed`, **data** payload `{sessionId, meta, byteSize, changeKind: 'replace' \| 'merge'}`. **`originatorClientId` lives on the SSE envelope** (not the data payload), matching `session_metadata_updated` precedent. | Mirrors `session_metadata_updated` naming AND envelope convention; reducer adds `sessionMeta` + counters to view-state. |
| 9 | Compress body schema? | **Empty body `{}` accepted, no `force` field** — always `force=true` server-side | Matches TUI `/compress` (which hard-codes `force=true` at `compressCommand.ts:59`). Auto-compaction already runs threshold-gated before each prompt; an explicit daemon-driven compress is by definition operator intent. Adding `{force}` to v1 schema would be a no-op surface. |
| 10 | Meta persistence on session load/resume? | **Not persisted in v1** — `load`/`resume` rebuilds `SessionEntry` with `meta: {}` | Document in JSDoc + protocol ref. Revisit when T2.1 (`unstable_session_resume` → stable) lands a persistence substrate. Until then, clients re-set meta after attach. |

## File-by-file changes

### Shared protocol (`packages/acp-bridge/src/`)

- **`status.ts:107`** — extend `SERVE_CONTROL_EXT_METHODS` with `sessionCompress: 'qwen/control/session/compress'`. (Meta has no ACP method — daemon-side only.)
- **`status.ts:~315`** — extend `ServeSessionContextStatus.state` with optional `meta?: Record<string, unknown>`.
- **`bridgeTypes.ts:~136`** — extend `HttpAcpBridge` interface with:
  - `compressSession(sessionId, context?): Promise<DaemonCompressSessionResult>`
  - `setSessionMeta(sessionId, req, context?): Promise<DaemonSessionMetaResult>`
  - `getSessionMeta(sessionId): Record<string, unknown>`

### Bridge implementation (`packages/acp-bridge/src/bridge.ts`)

- **`SessionEntry` (line 183)** — add three fields: `compressInFlight: boolean`, `meta: Record<string, unknown>`, `metaSerializedByteSize: number`. Initialize in the `createSessionEntry` helper (and the restore path).
- **Constants** — add `SESSION_COMPRESS_TIMEOUT_MS = 180_000` next to `SESSION_RECAP_TIMEOUT_MS` once recap merges, or next to `initTimeoutMs` for now (renaming on merge is mechanical).
- **Error classes** — co-locate next to `InvalidSessionMetadataError` (~line 2463): `CompactionInFlightError` (HTTP 409 `compaction_in_flight`), `PromptInFlightError` (HTTP 409 `prompt_in_flight`), `MetaTooLargeError` (HTTP 413), `InvalidMetaKeyError` (HTTP 400 `invalid_meta_key`), `ReservedMetaKeyError` (HTTP 400 `reserved_meta_key`).
- **`compressSession` impl** — place after `setSessionApprovalMode` (line 2893). Shape mirrors the template:
  1. `byId.get(sessionId)` → throw `SessionNotFoundError` if missing.
  2. `channelInfoForEntry(entry)` → throw if dying.
  3. If `entry.compressInFlight` → throw `CompactionInFlightError`.
  4. If `entry.activePromptOriginatorClientId !== undefined` → throw `PromptInFlightError` (guards against racing the agent's own pre-send `tryCompress` inside `sendMessageStream`).
  5. Set `entry.compressInFlight = true`; `try { … } finally { entry.compressInFlight = false }`.
  6. `const startedAt = Date.now()`.
  7. `Promise.race([withTimeout(connection.extMethod(SERVE_CONTROL_EXT_METHODS.sessionCompress, {sessionId}), SESSION_COMPRESS_TIMEOUT_MS, name), getTransportClosedReject(entry)])`.
  8. Compute `durationMs = Date.now() - startedAt`, resolve trusted clientId.
  9. **Only if `response.compressionStatus !== 'NOOP'`**: publish `session_compacted` event on `entry.events`. NOOP returns synchronously without an event.
  10. Return result regardless.
- **`setSessionMeta` / `getSessionMeta` impl** — place near `updateSessionMetadata` (line 2445). Pure daemon-side, no ACP roundtrip:
  1. Validation helpers (key regex, reserved-prefix check, `JSON.stringify` → byteLength check against 8 KB). Reuse `hasControlCharacter` neighbor style. No explicit nesting-depth walk — size cap suffices.
  2. `merge=false` (default) replaces `entry.meta`; `merge=true` shallow-merges (null values set, do not delete; per-key delete deferred).
  3. Update `entry.meta` + `entry.metaSerializedByteSize`; publish `session_meta_changed` event with envelope-level `originatorClientId` (via `resolveTrustedClientId(entry, context?.clientId)`) and data payload `{sessionId, meta, byteSize, changeKind}`.
- **`getSessionContextStatus` (line 2784)** — after ACP returns, set `state.meta = entry.meta` (always, even when `{}`) before resolving. Always-present is intentional — see decision #7.

### ACP agent (`packages/cli/src/acp-integration/acpAgent.ts`)

- **`extMethod` switch (after line 2200, the `sessionApprovalMode` case)** — add:
  ```
  case SERVE_CONTROL_EXT_METHODS.sessionCompress:
  ```
  Body:
  1. Validate `sessionId` non-empty string (`RequestError.invalidParams` otherwise).
  2. `const session = this.sessionOrThrow(sessionId)`.
  3. `const client = session.getConfig().getGeminiClient()`.
  4. Wrap in `try/catch`:
     - `const info = await client.tryCompressChat(\`compress-daemon-${randomUUID()}\`, /*force*/ true, /*signal*/ undefined)`.
       - `tryCompressChat` lives at `packages/core/src/core/client.ts:2144`.
       - Returns `ChatCompressionInfo` (`packages/core/src/core/turn.ts:176`): `{originalTokenCount, newTokenCount, compressionStatus}`.
     - If `info.compressionStatus` is one of the `*_FAILED_*` enum values, throw `RequestError` with `errorKind: 'compress_failed'` and the failure status as `data.compressionStatus`.
     - `catch (err)`: re-wrap any unhandled exception (transport / auth / OOM mid-side-query) into `RequestError` with `errorKind: 'compress_failed'`. The `tryCompressChat` path is not guaranteed to convert all failures into `*_FAILED_*` statuses; throws can escape.
  5. `NOOP` is a SUCCESS (below threshold, nothing to do; bridge layer will skip the SSE event).
  6. Return `{sessionId, originalTokenCount, newTokenCount, compressionStatus}`.

(No agent handler for meta — daemon-side only.)

### HTTP routes (`packages/cli/src/serve/server.ts`)

- **`POST /session/:id/compress`** — model on `/approval-mode` (line 1474). Non-strict `mutate()` gate. `parseClientIdHeader`. `bridge.compressSession(sessionId, {clientId})`. Map `CompactionInFlightError → 409 compaction_in_flight`, `PromptInFlightError → 409 prompt_in_flight`, `compress_failed errorKind → 500`, `SessionNotFoundError → 404` via `sendBridgeError` (extend its mapping table).
- **`POST /session/:id/compress`** body — accept empty `{}` (no fields read). Server always passes `force=true` down. No `force` field in v1 schema; if a client sends one it's ignored.
- **`POST /session/:id/_meta`** — body schema `{meta: Record<string, unknown>, merge?: boolean}`. Non-strict `mutate()`. Body-shape validation order: (1) request body is a plain object → 400 `invalid_body`; (2) `meta` is a plain object → 400 `invalid_meta`; (3) `merge` if present is boolean → 400 `invalid_body`; (4) key regex / reserved prefix / size cap inside `bridge.setSessionMeta`. 200 with `{sessionId, meta, byteSize, changeKind}`. Map all four meta errors via `sendBridgeError`.
- **`GET /session/:id/_meta`** — no `mutate()` gate (matches `GET /session/:id/context`). 200 returns `{sessionId, meta, byteSize}`. 404 on unknown session.

### Capability registry (`packages/cli/src/serve/capabilities.ts`)

- **Append before line 215** (`} as const satisfies …`):
  - `session_compress: { since: 'v1' }` — JSDoc mirroring `session_approval_mode_control` style: route, non-strict gate, ACP control ext, SDK helper.
  - `session_meta: { since: 'v1' }` — JSDoc: routes, validation contract, SSE event, context echo.

### SDK (`packages/sdk-typescript/src/`)

- **`daemon/types.ts`** — near `DaemonApprovalModeResult`:
  - `DaemonCompressSessionResult { sessionId, originalTokenCount, newTokenCount, compressionStatus, durationMs }`
  - `DaemonSessionMetaResult { sessionId, meta, byteSize, changeKind?: 'replace' | 'merge' }`
- **`daemon/events.ts`**:
  - `DAEMON_KNOWN_EVENT_TYPE_VALUES` (line 14) — append `'session_compacted'`, `'session_meta_changed'`.
  - Data shapes near `DaemonApprovalModeChangedData` (~line 491): `DaemonSessionCompactedData`, `DaemonSessionMetaChangedData`.
  - Envelopes after the existing block (~line 670): `DaemonSessionCompactedEvent`, `DaemonSessionMetaChangedEvent`.
  - Type guards near `isSessionMetadataUpdatedData` (~line 1944).
  - `asKnownDaemonEvent` (~line 1185) — two new `case` arms.
  - `reduceDaemonSessionEvent` (~line 1505) — two new `case` arms; bump `sessionCompactedCount`/`lastSessionCompacted`, replace `sessionMeta`/`lastSessionMetaChange`.
  - `DaemonSessionViewState` (line 773) — add `sessionCompactedCount: number`, `lastSessionCompacted?: DaemonSessionCompactedData`, `sessionMeta?: Record<string, unknown>`, `lastSessionMetaChange?: DaemonSessionMetaChangedData`.
  - `createDaemonSessionViewState` (line 986) — seed the four fields.
- **`daemon/DaemonClient.ts`** — add three methods modeled on `setSessionApprovalMode` (line 951):
  - `compressSession(sessionId, opts?: { clientId?: string }): Promise<DaemonCompressSessionResult>`
  - `setSessionMeta(sessionId, body: {meta, merge?}, opts?): Promise<DaemonSessionMetaResult>`
  - `getSessionMeta(sessionId, opts?): Promise<DaemonSessionMetaResult>`
- **`daemon/DaemonSessionClient.ts`** — after `updateMetadata` (line 259): `compress()`, `setMeta(meta, opts?)`, `getMeta()` thin wrappers forwarding `this.sessionId` + `this.clientId`.
- **`daemon/index.ts`** + **`src/index.ts`** — re-export the four new type names, mirroring the `DaemonApprovalModeChangedData` row.

## Implementation order (compile-safe)

1. `status.ts` (ext-method constant + `ServeSessionContextStatus.state.meta`).
2. `bridgeTypes.ts` (interface methods + error class declarations).
3. SDK `daemon/events.ts` value list addition (open-set `KnownDaemonEvent` union).
4. `acpAgent.ts` extMethod case for compress.
5. `bridge.ts` — `SessionEntry` fields → helpers (validation, byte-size, depth walk) → error classes → `compressSession` → `setSessionMeta` / `getSessionMeta` → splice meta into `getSessionContextStatus`.
6. `server.ts` three routes + `sendBridgeError` mappings + `capabilities.ts` two tags.
7. SDK: `types.ts` → `events.ts` (data shapes, envelopes, guards, narrow, reducer, view-state seed) → `DaemonClient.ts` → `DaemonSessionClient.ts` → both barrels.
8. Tests + docs.

## Test plan

Mirror the approval-mode / recap split:

- **`packages/acp-bridge/src/bridge.test.ts`** — `describe('compressSession (T1.3)')`: happy-path returns counts + emits `session_compacted` with originator stamp; **NOOP returns success WITHOUT emitting event** (assert event log is empty); sets `compressInFlight` and clears on success/failure; concurrent compress → 409 `compaction_in_flight`; compress during in-flight prompt (`activePromptOriginatorClientId` set) → 409 `prompt_in_flight`; 180s timeout; unknown session → `SessionNotFoundError`. `describe('setSessionMeta (T1.4)')`: replace, merge, clear via empty replace, invalid-key regex, reserved `qwen.*`, 8 KB overshoot, emits `session_meta_changed` with correct `changeKind`. `describe('getSessionMeta')`: fresh `{}`, post-write payload. `describe('getSessionContextStatus echoes meta')`: assert `state.meta === {}` on fresh session (always-present even when empty), then round-trips after a write.
- **`packages/cli/src/serve/server.test.ts`** — `describe('POST /session/:id/compress')`: 200 happy, 200 NOOP (no event), 409 `compaction_in_flight`, 409 `prompt_in_flight`, 404 unknown, 401 gating. `describe('POST/GET /session/:id/_meta')`: round-trip, 400 invalid key, 400 reserved prefix, 413 too large, `merge:true` semantics, GET on fresh `{}`, `GET /session/:id/context` returns `state.meta: {}` on fresh session and the stored bag after writes.
- **`packages/sdk-typescript/test/unit/DaemonClient.test.ts`** — fetch-mock the three methods (status, error parsing, clientId header echo).
- **`packages/sdk-typescript/test/unit/DaemonSessionClient.test.ts`** — wrapper forwarding.
- **`packages/sdk-typescript/test/unit/daemonEvents.test.ts`** — narrow + reducer for both new event types (positive narrow, payload-shape rejection, view-state field bumps).
- **`packages/sdk-typescript/test/unit/daemon-public-surface.test.ts`** — assert the **six** new type names are re-exported from both `src/daemon/index.ts` and `src/index.ts`: `DaemonCompressSessionResult`, `DaemonSessionMetaResult`, `DaemonSessionCompactedData`, `DaemonSessionCompactedEvent`, `DaemonSessionMetaChangedData`, `DaemonSessionMetaChangedEvent`.

## Documentation

- **`docs/developers/qwen-serve-protocol.md`** — three new subsections (compress, POST meta, GET meta) with full request/response/error/SSE shapes. Extend `/session/:id/context` to document `state.meta`. Update capability-tag list with the two new tags.
- **`docs/users/qwen-serve.md`** — extend Remote runtime control bullet with compress + meta one-liners. Update §361 "session-state mutations without wire events" caveat — compress + meta now DO publish events.

## Verification

```bash
# Typecheck both packages
npm run typecheck --workspace packages/cli
npm run typecheck --workspace packages/sdk-typescript
npm run typecheck --workspace packages/acp-bridge

# Focused tests
cd packages/acp-bridge && npx vitest run src/bridge.test.ts
cd packages/cli && npx vitest run src/serve/server.test.ts
cd packages/sdk-typescript && npx vitest run \
  test/unit/DaemonClient.test.ts \
  test/unit/DaemonSessionClient.test.ts \
  test/unit/daemonEvents.test.ts \
  test/unit/daemon-public-surface.test.ts

# Manual smoke (after `qwen serve --token=dev-token`)
TOKEN=dev-token; SID=$(curl -sS -H "Authorization: Bearer $TOKEN" -X POST http://127.0.0.1:4170/session | jq -r .sessionId)

# Compress
curl -sS -H "Authorization: Bearer $TOKEN" -H "X-Qwen-Client-Id: c1" \
  -X POST http://127.0.0.1:4170/session/$SID/compress | jq

# Meta round-trip
curl -sS -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -X POST http://127.0.0.1:4170/session/$SID/_meta \
  -d '{"meta":{"chat_id":"42","sender_id":"u9"},"merge":true}' | jq
curl -sS -H "Authorization: Bearer $TOKEN" http://127.0.0.1:4170/session/$SID/_meta | jq
curl -sS -H "Authorization: Bearer $TOKEN" http://127.0.0.1:4170/session/$SID/context | jq .state.meta

# 409 collision: fire two compress curls in parallel against a large session
( curl -sS -X POST -H "Authorization: Bearer $TOKEN" http://127.0.0.1:4170/session/$SID/compress &
  curl -sS -X POST -H "Authorization: Bearer $TOKEN" http://127.0.0.1:4170/session/$SID/compress )
# Expect exactly one 200, one 409 with code: "compaction_in_flight".

# SSE event echo
curl -sS -N -H "Authorization: Bearer $TOKEN" http://127.0.0.1:4170/session/$SID/events
# Expect session_compacted + session_meta_changed frames after the above mutations.
```

## Critical files

- `packages/acp-bridge/src/status.ts`
- `packages/acp-bridge/src/bridgeTypes.ts`
- `packages/acp-bridge/src/bridge.ts` (`SessionEntry:183`, `byId:618`, `setSessionApprovalMode:2893` template, `updateSessionMetadata:2445` meta template, `getSessionContextStatus:2784`)
- `packages/cli/src/acp-integration/acpAgent.ts` (`extMethod` switch, `sessionApprovalMode` case at `:2200` as anchor for placement)
- `packages/cli/src/serve/server.ts` (`/approval-mode` route at `:1474` as template)
- `packages/cli/src/serve/capabilities.ts` (append before `:215`)
- `packages/sdk-typescript/src/daemon/types.ts`
- `packages/sdk-typescript/src/daemon/events.ts` (`:14` enum, `:773` view-state, `:986` seed, `:1185` `asKnownDaemonEvent`, `:1505` reducer, `:1944` guards)
- `packages/sdk-typescript/src/daemon/DaemonClient.ts` (`:951` `setSessionApprovalMode` template)
- `packages/sdk-typescript/src/daemon/DaemonSessionClient.ts` (`:259` after `updateMetadata`)
- `packages/sdk-typescript/src/daemon/index.ts` + `packages/sdk-typescript/src/index.ts` (barrel re-exports)
- `docs/developers/qwen-serve-protocol.md`
- `docs/users/qwen-serve.md`

## Final Implementation Status

- **PR #4504** — MERGED 2026-05-26. Title: "feat(serve): add POST /session/:id/recap". This was the recap route, not compress/meta.
- **#4514** — OPEN issue (capability backlog tracker). T1.3 compress + T1.4 meta remain listed as unimplemented.
- **Outcome**: The compress + meta routes described in THIS plan have NOT been implemented yet. PR #4504 (recap) served as the template/reference for this plan's design but covers a different capability (T1.2, not T1.3/T1.4).
- **Files from PR #4504 (recap, used as template)**: `bridge.ts/.test.ts`, `bridgeTypes.ts`, `status.ts`, `acpAgent.ts`, `server.ts/.test.ts`, `capabilities.ts`, SDK daemon types/events/client, protocol docs.
- **Key divergence**: Plan remains unexecuted. The compress and meta routes are still in the backlog tracked by #4514.
