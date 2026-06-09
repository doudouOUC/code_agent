# PR 11: `feat(serve): session metadata and close/delete lifecycle`

## Context

Issue #4175 Wave 2.5 PR 11. Dependencies PR 6 (load/resume, #4222) and PR 7 (client identity, #4231) are both merged.

Today, daemon sessions have no explicit close/delete route — they only die when the ACP child crashes (`session_died`), the daemon shuts down, or the internal orphan reaper fires. The protocol doc at `docs/developers/qwen-serve-protocol.md:103-107` explicitly calls this out as a Stage 1 limitation. There is also no session metadata (no timestamps, no labels), and `listWorkspaceSessions` returns only `{ sessionId, workspaceCwd }`.

This PR adds:
1. `DELETE /session/:id` — explicit client-initiated session teardown
2. Session metadata on `SessionEntry` — `createdAt` timestamp, optional client-supplied `displayName`
3. `PATCH /session/:id/metadata` — update session metadata
4. Enriched session listing — include `createdAt`, `displayName`, `clientCount`, `hasActivePrompt` in `GET /workspace/:id/sessions`
5. `session_closed` event type — distinct from `session_died`, fired on voluntary client-initiated close
6. SDK methods — `DaemonClient.closeSession()`, `DaemonSessionClient.close()`, `DaemonClient.updateSessionMetadata()`

## Design decisions

### Close vs Delete semantics

**Close = delete for live sessions.** A `DELETE /session/:id` tears down the session immediately (cancels active prompt, resolves pending permissions as cancelled, publishes `session_closed` event, closes EventBus, removes from `byId`). There is no "closed but still queryable" state — the session is gone from the daemon's live maps after close. On-disk persisted sessions are NOT deleted (they can still be `POST /session/:id/load`'d later against a fresh channel). This matches the existing `killSession` semantics but exposes it via HTTP.

Rationale: Adding a "closed" intermediate state would require changes to every route that looks up sessions, and the `byId` map has no concept of state today. Keep it simple — close = remove from daemon memory.

### Event type: `session_closed` vs extending `session_died`

Use a NEW event type `session_closed` rather than extending `session_died` with a new reason. Rationale:
- `session_died` is terminal and means "the session ended unexpectedly or was killed by the system"
- `session_closed` is terminal and means "a client explicitly asked to close this session"
- SDK consumers can branch on event type without parsing reason strings
- The `session_died` reducer already clears `pendingPermissions` and sets `alive: false` — `session_closed` should do the same

### ACP `closeSession` notification

The FIXME at `httpAcpBridge.ts:2767` notes ACP lacks a `closeSession` call. We do NOT add one in this PR — the agent-side session map entry accumulates until the channel dies, bounded by `maxSessions`. If ACP adds `closeSession` later, the daemon's `closeSession` bridge method is the natural place to wire it in.

### Any client can close

Any client with a valid bearer token (and optionally a registered `clientId`) can close any session. We do not gate close on "only the originator" because: (a) there's no concept of session ownership today, (b) multi-client UIs need ops/admin to close sessions, (c) the existing `killSession` has no ownership check.

### Metadata: minimal

Only add `createdAt: string` (ISO 8601 timestamp) and `displayName?: string` (client-supplied label, max 256 chars). Avoid over-designing — future PRs can add more fields. `createdAt` is set at session creation time and is immutable. `displayName` is mutable via `PATCH /session/:id/metadata`.

## Files to modify

### 1. `packages/cli/src/serve/capabilities.ts`
- Add `session_close` and `session_metadata` to `SERVE_CAPABILITY_REGISTRY`

### 2. `packages/cli/src/serve/httpAcpBridge.ts`

**SessionEntry** (line 637):
- Add `createdAt: string` field
- Add `displayName?: string` field

**createSessionEntry** (~line 1917):
- Set `createdAt: new Date().toISOString()`

**HttpAcpBridge interface** (line 140):
- Add `closeSession(sessionId: string, context?: BridgeClientRequestContext): Promise<void>` — throws `SessionNotFoundError` if unknown
- Add `updateSessionMetadata(sessionId: string, metadata: { displayName?: string }, context?: BridgeClientRequestContext): void` — throws `SessionNotFoundError`
- Add `getSessionMetadata(sessionId: string): SessionMetadata` — throws `SessionNotFoundError`

**BridgeSessionSummary** (line 129):
- Add `createdAt: string`, `displayName?: string`, `clientCount: number`, `hasActivePrompt: boolean`

**closeSession implementation**:
- Look up entry in `byId`, throw `SessionNotFoundError` if missing
- Cancel active prompt via `connection.cancel(...)` (best-effort, don't throw if nothing active)
- Resolve pending permissions as cancelled (same as `killSession`)
- Publish `session_closed` event with `{ sessionId, reason: 'client_close', closedBy?: originatorClientId }`
- Close EventBus
- Remove from `byId`, clear `defaultEntry` if needed
- Detach from channel (same as `killSession`)
- Kill channel if no sessions remain (same as `killSession`)
- Key difference from `killSession`: no `requireZeroAttaches` guard (explicit close overrides the attach guard), and publishes `session_closed` instead of `session_died`

**updateSessionMetadata implementation**:
- Look up entry, throw `SessionNotFoundError` if missing
- Validate `displayName` length (max 256 chars), throw a new `InvalidSessionMetadataError` if too long
- Set `entry.displayName = metadata.displayName`
- Publish `session_metadata_updated` event with `{ sessionId, displayName }`

**listWorkspaceSessions** (~line 2594):
- Include `createdAt`, `displayName`, `clientCount: entry.clientIds.size`, `hasActivePrompt: !!entry.activePromptOriginatorClientId` in the returned summaries

### 3. `packages/cli/src/serve/server.ts`

**New route: `DELETE /session/:id`** (after the existing session routes):
```
- Extract sessionId from req.params['id']
- Parse clientId from header
- Call bridge.closeSession(sessionId, context)
- Return 204 on success
- Use sendBridgeError for errors (SessionNotFoundError → 404, InvalidClientIdError → 400)
```

**New route: `PATCH /session/:id/metadata`**:
```
- Extract sessionId from req.params['id']
- Extract displayName from body
- Validate displayName is string (if present) and <= 256 chars
- Call bridge.updateSessionMetadata(sessionId, { displayName }, context)
- Return 200 with updated metadata
- Use sendBridgeError for errors
```

**Update GET /workspace/:id/sessions** response to include new fields (no route change needed, just richer data from bridge).

### 4. `packages/cli/src/serve/eventBus.ts`
- No changes needed — the EventBus is generic and already handles new event types.

### 5. `packages/sdk-typescript/src/daemon/events.ts`

**New event types**:
- Add `'session_closed'` to `DAEMON_KNOWN_EVENT_TYPE_VALUES`
- Add `DaemonSessionClosedData`: `{ sessionId: string, reason: string, closedBy?: string }`
- Add `DaemonSessionClosedEvent` type alias
- Add to `DaemonSessionEvent` union
- Add to `KnownDaemonEvent` union
- Add `'session_metadata_updated'` to known types
- Add `DaemonSessionMetadataUpdatedData`: `{ sessionId: string, displayName?: string }`
- Add `DaemonSessionMetadataUpdatedEvent` type alias

**Reducer** (`reduceDaemonSessionEvent`):
- `session_closed`: same as `session_died` — sets `alive: false`, `terminalEvent`, clears `pendingPermissions`
- `session_metadata_updated`: updates a new `displayName` field on `DaemonSessionViewState`

**`DaemonSessionViewState`**:
- Add `displayName?: string` field

**Validation** (`asKnownDaemonEvent`):
- Add validation for `session_closed` (requires `sessionId: string`, `reason: string`)
- Add validation for `session_metadata_updated` (requires `sessionId: string`)

### 6. `packages/sdk-typescript/src/daemon/types.ts`

**`DaemonSession`**:
- Add `createdAt?: string` (optional for backward compat with old daemons)

**`DaemonSessionSummary`**:
- Add `createdAt?: string`, `displayName?: string`, `clientCount?: number`, `hasActivePrompt?: boolean`

### 7. `packages/sdk-typescript/src/daemon/DaemonClient.ts`

**New methods**:
- `closeSession(sessionId: string, clientId?: string): Promise<void>` — sends `DELETE /session/:id`, returns void on 204, throws on error. 404 → `SessionNotFoundError`? No — just throw `DaemonHttpError` as with other methods. Actually, make it idempotent: return void on both 204 and 404 (session already gone = success).
- `updateSessionMetadata(sessionId: string, metadata: { displayName?: string }, clientId?: string): Promise<void>` — sends `PATCH /session/:id/metadata`

### 8. `packages/sdk-typescript/src/daemon/DaemonSessionClient.ts`

**New methods**:
- `close(): Promise<void>` — calls `this.client.closeSession(this.sessionId, this.clientId)`
- `updateMetadata(metadata: { displayName?: string }): Promise<void>` — calls `this.client.updateSessionMetadata(this.sessionId, metadata, this.clientId)`

### 9. `packages/sdk-typescript/src/daemon/index.ts`
- Export new types: `DaemonSessionClosedData`, `DaemonSessionClosedEvent`, `DaemonSessionMetadataUpdatedData`, `DaemonSessionMetadataUpdatedEvent`

### 10. Tests

**`packages/cli/src/serve/server.test.ts`**:
- Add `session_close` and `session_metadata` to `EXPECTED_STAGE1_FEATURES`
- Add `closeImpl` and `updateMetadataImpl` to `FakeBridgeOpts`
- Add `closeCalls` and `updateMetadataCalls` to `FakeBridge`
- Add `describe('DELETE /session/:id')` tests:
  - 204 on success
  - Passes client identity context
  - 404 on SessionNotFoundError
  - 400 on InvalidClientIdError
- Add `describe('PATCH /session/:id/metadata')` tests:
  - 200 on success with displayName
  - 404 on SessionNotFoundError
  - 400 on invalid displayName (too long)

**`packages/cli/src/serve/httpAcpBridge.test.ts`**:
- Add `describe('closeSession')` tests:
  - Publishes `session_closed` event
  - Resolves pending permissions as cancelled
  - Removes session from byId
  - Closes EventBus
  - Kills channel when last session is closed
  - Does NOT kill channel when other sessions exist
  - Throws SessionNotFoundError for unknown session
  - Idempotent (second close on same session is no-op or throws)
- Add `describe('updateSessionMetadata')` tests:
  - Updates displayName
  - Publishes `session_metadata_updated` event
  - Throws SessionNotFoundError for unknown session
- Add tests for enriched `listWorkspaceSessions`

**`packages/sdk-typescript/test/unit/DaemonClient.test.ts`**:
- Add `describe('closeSession')` tests: DELETE URL, 204 → void, 404 → void (idempotent), client identity header
- Add `describe('updateSessionMetadata')` tests: PATCH URL, body shape, 200 → void

**`packages/sdk-typescript/test/unit/DaemonSessionClient.test.ts`**:
- Add `close()` and `updateMetadata()` to the session-scoped operations test
- Add error handling tests

**`packages/sdk-typescript/test/unit/daemonEvents.test.ts`**:
- Add validation tests for `session_closed` and `session_metadata_updated` in `asKnownDaemonEvent`
- Add reducer tests: `session_closed` sets `alive: false`, clears `pendingPermissions`, sets `terminalEvent`
- Add reducer tests: `session_metadata_updated` sets `displayName`
- Add test: `session_closed` takes priority over `stream_error`/`client_evicted` (same as `session_died`)

**`integration-tests/cli/qwen-serve-routes.test.ts`**:
- Update capabilities assertion to include `session_close` and `session_metadata`
- Add integration test for `DELETE /session/:id`
- Add integration test for `PATCH /session/:id/metadata`

### 11. Protocol documentation

**`docs/developers/qwen-serve-protocol.md`**:
- Remove the "Stage 1 limitation — no DELETE /session/:id" callout
- Add `DELETE /session/:id` route documentation
- Add `PATCH /session/:id/metadata` route documentation
- Add `session_closed` and `session_metadata_updated` event documentation
- Update session listing docs with new fields

**`docs/users/qwen-serve.md`**:
- Add section on closing sessions
- Update durability model if needed

## Implementation order

1. **Bridge layer** — `httpAcpBridge.ts`: SessionEntry fields, closeSession, updateSessionMetadata, enriched listing
2. **Capabilities** — `capabilities.ts`: register new features
3. **Server routes** — `server.ts`: DELETE + PATCH routes
4. **SDK types** — `types.ts`: DaemonSession, DaemonSessionSummary enrichment
5. **SDK events** — `events.ts`: new event types, validation, reducer
6. **SDK client** — `DaemonClient.ts`: closeSession, updateSessionMetadata
7. **SDK session client** — `DaemonSessionClient.ts`: close(), updateMetadata()
8. **SDK barrel** — `index.ts`: exports
9. **Tests** — all test files
10. **Docs** — protocol and user docs

## Verification

```bash
# Type checking
npm run typecheck --workspace packages/cli
npm run typecheck --workspace packages/sdk-typescript

# Unit tests
cd packages/cli && npx vitest run src/serve/server.test.ts src/serve/httpAcpBridge.test.ts src/serve/eventBus.test.ts
cd packages/sdk-typescript && npx vitest run test/unit/DaemonClient.test.ts test/unit/DaemonSessionClient.test.ts test/unit/daemonEvents.test.ts

# Lint
npx eslint packages/cli/src/serve/httpAcpBridge.ts packages/cli/src/serve/server.ts packages/cli/src/serve/capabilities.ts packages/sdk-typescript/src/daemon/DaemonClient.ts packages/sdk-typescript/src/daemon/DaemonSessionClient.ts packages/sdk-typescript/src/daemon/events.ts packages/sdk-typescript/src/daemon/types.ts packages/sdk-typescript/src/daemon/index.ts

# Build
npm run build

# Integration tests (requires full build + bundle)
npm run build && npm run bundle && cd integration-tests && QWEN_SANDBOX=false npx vitest run cli/qwen-serve-routes.test.ts
```

## Final Implementation Status

- **PR #4240**: MERGED (2026-05-17) — "feat(serve): session metadata and close/delete lifecycle (#4175 Wave 2.5 PR 11)"
- **Summary**: Implementation closely followed the plan. All major features landed: `DELETE /session/:id`, `PATCH /session/:id/metadata`, `session_closed` event type, enriched session listing, SDK methods (`closeSession`, `updateSessionMetadata`, `close()`, `updateMetadata()`).
- **Key divergences**: None significant. The plan's file list matches the actual diff almost exactly (server.ts, httpAcpBridge.ts, capabilities.ts, DaemonClient.ts, DaemonSessionClient.ts, events.ts, types.ts, protocol docs, integration tests).
- **Files changed**: `httpAcpBridge.ts`, `server.ts`, `capabilities.ts`, `DaemonClient.ts`, `DaemonSessionClient.ts`, `events.ts`, `types.ts`, `qwen-serve-protocol.md`, `qwen-serve-routes.test.ts` + unit tests.
