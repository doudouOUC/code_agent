# T3.1: `POST /session/:id/branch` — Session Fork HTTP Route

## Context

Issue #4514 lists T3.1 as a Tier 3 gap: "POST /session/:id/branch (fork a session) — /branch is interactive/dialog-based today; daemon route needs sessionService fork semantics alignment."

The CLI `/branch` command today is dialog-based (returns `{ type: 'dialog' }`) and cannot be invoked via the slash-command passthrough path (`POST /session/:id/prompt`). A dedicated HTTP route is needed so remote clients (web shell, IDE extensions, SDK consumers) can fork sessions programmatically.

## Design

### Route Semantics

```
POST /session/:id/branch
Body: { name?: string }
Response 201: BridgeBranchedSession (extends BridgeRestoredSession + fork metadata)
```

The route performs **fork + resume** atomically (matching TUI behavior):
1. Validate: source session is live in `byId` AND idle (no active prompt)
2. Finalize + flush source session's recording service to ensure JSONL is complete (including trailing title record)
3. Fork the source session's JSONL to a new file (`sessionService.forkSession`)
4. Compute a unique branch title with `(Branch)` / `(Branch N)` collision avoidance
5. Record the title in the new session's JSONL via `sessionService.renameSession()`
6. **Resume** (not load) the new session into the daemon — avoids full history replay flood
7. Emit cross-client events
8. Return the new session info with fork provenance metadata

### Why `resume` instead of `load`

`restoreSession('load', ...)` replays the ENTIRE transcript as `session_update` SSE events. For a forked 10k-message session this would:
- Flood the EventBus ring buffer (frames may exceed `eventRingSize` and roll off)
- Block the SSE stream for seconds/minutes
- Waste bandwidth — the branch caller already has the parent history

`restoreSession('resume', ...)` registers the session without history replay. The caller gets back session state (models, modes, configOptions) immediately. Since the fork is a continuation of a known parent, the client already has the conversation context.

### Architecture — ACP extMethod Pattern

Following the established `SERVE_CONTROL_EXT_METHODS` pattern (same as `sessionApprovalMode` and `workspaceMcpRestart`):

1. **ACP child does the fork** — the ext method handler in `acpAgent.ts`:
   - Finalizes the source session's `ChatRecordingService` (queues trailing title record)
   - Flushes via `flush()` to drain pending writes (including the finalize record) to disk
   - Calls `SessionService.forkSession()` to create the new JSONL
   - Derives the base name from the source session's loaded state (first user prompt text)
   - Computes a unique branch title via `computeUniqueBranchTitle()`
   - Records the title via `SessionService.renameSession()` (cold disk write — the new session is not yet loaded as a live Session object)
2. **Bridge resumes the result** — after the ext method returns `{ newSessionId, title }`, the bridge calls `restoreSession('resume', ...)` to register the new session in `byId` and start its event bus.
3. **Bridge emits events** — publishes `session_branched` on the source session's EventBus AND workspace-wide via `publishWorkspaceEvent`.

### Guards & Safety

| Guard | Rationale |
|-------|-----------|
| **Source must be in `byId`** | Guarantees the ACP child has the session loaded (invariant: byId ↔ child.sessions are synced; channel death clears both) |
| **Source must be idle** (`activePromptOriginatorClientId === undefined`) | Prevents reading a JSONL mid-append. CLI `/branch` has the same guard via `isIdleRef`. Return 409 Conflict. |
| **Pre-check session limit** before ext method | Avoids orphaning a freshly-created JSONL when the subsequent resume hits `SessionLimitExceededError`. Not a hard guarantee (race with parallel spawns), but handles the common case. |
| **Ext method calls `finalize()` then `flush()`** | `finalize()` queues the trailing title record onto `writeChain`. `flush()` awaits `writeChain`, ensuring everything (including the finalize record) is on disk before `forkSession()` reads the file. Without both, the fork could miss records. |

### Base Name Derivation

When the caller does NOT provide a `name`, the ACP agent derives a base name from the source session's loaded state:

1. The ext method handler has `this.sessions.get(sessionId)` → `Session` object
2. Session has `getConfig()` → `Config`
3. Config has `getChatRecordingService()` → `ChatRecordingService`
4. `ChatRecordingService` has `getSessionTitle()` which returns the existing title (or undefined)
5. Fallback: read the session's loaded messages from the Config's internal state to find the first user prompt text (same logic as `deriveFirstPrompt` in the CLI)

Priority chain: `body.name` > `recording.getSessionTitle()` (strip any existing " (Branch N)" suffix) > first user prompt text > sessionId prefix.

### Files to Modify

| File | Change |
|------|--------|
| `packages/acp-bridge/src/status.ts` | Add `sessionBranch: 'qwen/control/session/branch'` to `SERVE_CONTROL_EXT_METHODS` |
| `packages/acp-bridge/src/bridgeErrors.ts` | Add `BranchWhilePromptActiveError` class |
| `packages/core/src/services/sessionService.ts` | Export `computeUniqueBranchTitle` (extracted from useBranchCommand.ts) |
| `packages/cli/src/ui/hooks/useBranchCommand.ts` | Re-import `computeUniqueBranchTitle` from core |
| `packages/cli/src/acp-integration/acpAgent.ts` | Handle `sessionBranch` in `extMethod()` switch — finalize + flush + fork + title + renameSession |
| `packages/acp-bridge/src/bridgeTypes.ts` | Add `branchSession(sessionId, req, context?)` to `HttpAcpBridge` interface |
| `packages/cli/src/serve/httpAcpBridge.ts` | Implement `branchSession()` — pre-check idle + limit, call ext method, `restoreSession('resume', ...)`, emit events, return |
| `packages/cli/src/serve/server.ts` | Register route + add `BranchWhilePromptActiveError` branch in `sendBridgeError()` |
| `packages/cli/src/serve/capabilities.ts` | Add `session_branch: { since: 'v1' }` to `SERVE_CAPABILITY_REGISTRY` |
| `packages/sdk-typescript/src/daemon/types.ts` | Add `BranchSessionRequest` + `DaemonBranchedSession` types |
| `packages/sdk-typescript/src/daemon/DaemonClient.ts` | Add `branchSession(sessionId, req?, clientId?)` method |
| `packages/sdk-typescript/src/daemon/events.ts` | Register `session_branched` in `DAEMON_KNOWN_EVENT_TYPE_VALUES`, add type + narrowing + reducer case |
| `packages/sdk-typescript/src/daemon/index.ts` | Export new types |

### Detailed Implementation

#### 1. `SERVE_CONTROL_EXT_METHODS` addition (`packages/acp-bridge/src/status.ts`)

```typescript
export const SERVE_CONTROL_EXT_METHODS = {
  sessionApprovalMode: 'qwen/control/session/approval_mode',
  sessionBranch: 'qwen/control/session/branch',
  workspaceMcpRestart: 'qwen/control/workspace/mcp/restart',
} as const;
```

#### 2. Error class (`packages/acp-bridge/src/bridgeErrors.ts`)

```typescript
export class BranchWhilePromptActiveError extends Error {
  readonly sessionId: string;
  constructor(sessionId: string) {
    super(`Cannot branch session ${sessionId}: a prompt is currently active`);
    this.name = 'BranchWhilePromptActiveError';
    this.sessionId = sessionId;
  }
}
```

Add matching `instanceof` branch in `sendBridgeError()` (`server.ts`):
```typescript
if (err instanceof BranchWhilePromptActiveError) {
  res.status(409).json({
    error: err.message,
    code: 'branch_while_prompt_active',
    sessionId: err.sessionId,
  });
  return;
}
```

#### 3. Shared utility extraction (`packages/core/src/services/sessionService.ts`)

Move `computeUniqueBranchTitle` from `useBranchCommand.ts`:

```typescript
const MAX_BRANCH_COLLISION_SCAN = 99;

export async function computeUniqueBranchTitle(
  baseName: string,
  sessionService: SessionService,
): Promise<string> {
  const trimmed = baseName.trim();
  const taken = new Set(
    (await sessionService.findSessionTitlesByPrefix(`${trimmed} (Branch`)).map(
      (t) => t.toLowerCase().trim(),
    ),
  );
  const first = `${trimmed} (Branch)`;
  if (!taken.has(first.toLowerCase())) return first;
  for (let n = 2; n <= MAX_BRANCH_COLLISION_SCAN; n++) {
    const candidate = `${trimmed} (Branch ${n})`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
  return `${trimmed} (Branch ${Date.now()})`;
}
```

#### 4. ACP agent handler (`packages/cli/src/acp-integration/acpAgent.ts`)

```typescript
case SERVE_CONTROL_EXT_METHODS.sessionBranch: {
  const sessionId = params['sessionId'];
  if (typeof sessionId !== 'string' || !SESSION_ID_RE.test(sessionId)) {
    throw RequestError.invalidParams(undefined, 'Invalid or missing sessionId');
  }
  const name = params['name'];

  // Get source session — validates it's loaded in this agent
  const sourceSession = this.sessions.get(sessionId);
  if (!sourceSession) {
    throw new RequestError(-32004, `Session not found: ${sessionId}`, {
      errorKind: 'session_not_found', sessionId,
    });
  }

  // Finalize + flush: ensures trailing title record AND all pending writes are on disk
  const recording = sourceSession.getConfig().getChatRecordingService();
  if (recording) {
    recording.finalize();
    await recording.flush();
  }

  // Fork the JSONL
  const sessionService = new SessionService(cwd);
  const newSessionId = randomUUID();
  await sessionService.forkSession(sessionId, newSessionId);

  // Derive base name
  let baseName: string;
  if (typeof name === 'string' && name.trim().length > 0) {
    baseName = name.trim();
  } else {
    // Use existing session title, stripping " (Branch ...)" suffix if present
    const existingTitle = recording?.getSessionTitle();
    if (existingTitle) {
      baseName = existingTitle.replace(/\s*\(Branch(?:\s+\d+)?\)\s*$/, '').trim();
    } else {
      // Fallback: first user prompt text
      baseName = deriveFirstPromptFromSession(sourceSession) ?? sessionId.slice(0, 8);
    }
  }
  const title = await computeUniqueBranchTitle(baseName, sessionService);

  // Record title on the new (cold) session
  await sessionService.renameSession(newSessionId, title, 'branch');

  return { newSessionId, title, forkedFrom: sessionId };
}
```

#### 5. Bridge method (`packages/cli/src/serve/httpAcpBridge.ts`)

```typescript
async branchSession(sessionId, req, context?) {
  if (shuttingDown) throw new Error('HttpAcpBridge is shutting down');

  // Guard: source must exist and be idle
  const entry = byId.get(sessionId);
  if (!entry) throw new SessionNotFoundError(sessionId);
  if (entry.activePromptOriginatorClientId !== undefined) {
    throw new BranchWhilePromptActiveError(sessionId);
  }

  // Pre-check session limit (best-effort)
  if (byId.size + inFlightSpawns.size + inFlightRestores.size >= maxSessions) {
    throw new SessionLimitExceededError(maxSessions);
  }

  // Phase 1: fork JSONL via ext method
  const ci = await ensureChannel();
  const result = await withTimeout(
    ci.connection.extMethod(
      SERVE_CONTROL_EXT_METHODS.sessionBranch,
      { sessionId, cwd: boundWorkspace, name: req.name },
    ),
    initTimeoutMs,
    'branchSession',
  ) as { newSessionId: string; title: string; forkedFrom: string };

  // Phase 2: resume (not load) the new session — no history replay
  const restored = await restoreSession('resume', {
    sessionId: result.newSessionId,
    workspaceCwd: boundWorkspace,
    clientId: context?.clientId,
  });

  // Set displayName on the new entry
  const newEntry = byId.get(result.newSessionId);
  if (newEntry) newEntry.displayName = result.title;

  // Emit events: on source session bus + workspace-wide
  const originatorClientId = context?.clientId;
  const eventData = {
    sourceSessionId: sessionId,
    newSessionId: result.newSessionId,
    displayName: result.title,
  };
  entry.events.publish({
    type: 'session_branched',
    data: eventData,
    ...(originatorClientId ? { originatorClientId } : {}),
  });
  publishWorkspaceEvent({
    type: 'session_branched',
    data: eventData,
    ...(originatorClientId ? { originatorClientId } : {}),
  });

  return {
    ...restored,
    title: result.title,
    forkedFrom: { sessionId, title: result.title },
  };
}
```

#### 6. Route handler (`packages/cli/src/serve/server.ts`)

```typescript
app.post('/session/:id/branch', mutate(), async (req, res) => {
  const sessionId = req.params['id'];
  if (!sessionId) {
    res.status(400).json({ error: '`sessionId` route parameter is required' });
    return;
  }
  const body = safeBody(req);
  const name = typeof body?.name === 'string' ? body.name : undefined;
  const clientId = parseClientIdHeader(req, res);
  if (clientId === null) return;
  try {
    const result = await bridge.branchSession(sessionId, { name }, { clientId });
    if (!res.writable) {
      bridge.killSession(result.sessionId, { requireZeroAttaches: true }).catch(() => {});
      return;
    }
    res.status(201).json(result);
  } catch (err) {
    sendBridgeError(res, err, { route: 'POST /session/:id/branch', sessionId });
  }
});
```

#### 7. Capability tag (`packages/cli/src/serve/capabilities.ts`)

```typescript
session_branch: { since: 'v1' },
```

#### 8. SDK event registration (`packages/sdk-typescript/src/daemon/events.ts`)

```typescript
// In DAEMON_KNOWN_EVENT_TYPE_VALUES:
'session_branched',

// New interface:
export interface DaemonSessionBranchedData {
  sourceSessionId: string;
  newSessionId: string;
  displayName: string;
}
export interface DaemonSessionBranchedEvent {
  kind: 'session_branched';
  data: DaemonSessionBranchedData;
  originatorClientId?: string;
}

// In asKnownDaemonEvent switch:
case 'session_branched':
  return isDaemonSessionBranchedData(raw.data)
    ? { kind: 'session_branched', data: raw.data, originatorClientId: raw.originatorClientId }
    : undefined;

// In reduceDaemonSessionEvent — store last branch info:
case 'session_branched':
  return { ...state, lastBranch: event.data };
```

#### 9. SDK types (`packages/sdk-typescript/src/daemon/types.ts`)

```typescript
export interface BranchSessionRequest {
  name?: string;
}

export interface DaemonBranchedSession extends DaemonRestoredSession {
  title: string;
  forkedFrom: { sessionId: string; title: string };
}
```

#### 10. SDK client method (`packages/sdk-typescript/src/daemon/DaemonClient.ts`)

```typescript
async branchSession(
  sessionId: string,
  req: BranchSessionRequest = {},
  clientId?: string,
): Promise<DaemonBranchedSession> {
  return await this.fetchWithTimeout(
    `${this.baseUrl}/session/${encodeURIComponent(sessionId)}/branch`,
    {
      method: 'POST',
      headers: this.headers({ 'Content-Type': 'application/json' }, clientId),
      body: JSON.stringify({ name: req.name }),
    },
    async (res) => {
      if (!res.ok) {
        throw await this.failOnError(res, 'POST /session/:id/branch');
      }
      return (await res.json()) as DaemonBranchedSession;
    },
  );
}
```

### Error Cases

| Condition | HTTP Status | Error |
|-----------|-------------|-------|
| Source session not in `byId` | 404 | `SessionNotFoundError` |
| Source session has active prompt | 409 | `BranchWhilePromptActiveError` |
| Session limit exceeded (pre-check) | 429 | `SessionLimitExceededError` |
| Source session JSONL empty or corrupt | 500 | Propagated from ext method |
| Daemon shutting down | 503 | Standard shutdown error |
| Invalid sessionId format | 400 | Validation error |
| Channel death during fork or resume | 502 | `BridgeChannelClosedError` |

### Cross-Client Events

Two events emitted after successful branch:

1. **Source session EventBus** — notifies clients attached to the source:
   ```typescript
   { type: 'session_branched', data: { sourceSessionId, newSessionId, displayName }, originatorClientId? }
   ```

2. **Workspace-wide** via `publishWorkspaceEvent` — notifies session-list watchers:
   ```typescript
   { type: 'session_branched', data: { sourceSessionId, newSessionId, displayName }, originatorClientId? }
   ```

### Known Limitations (accepted)

| Limitation | Rationale |
|------------|-----------|
| `forkSession` uses sync I/O (`writeFileSync`) | Same behavior as CLI. For large sessions (10k+ messages) this blocks the event loop briefly. Acceptable for M-difficulty Tier 3 work; a worker-thread optimization can follow if profiling shows impact. |
| `findSessionTitlesByPrefix` uses sync I/O (`readdirSync` + `readSync`) | Scans up to 10K JSONL files with blocking reads (64KB tail per file). For workspaces with hundreds of sessions, may block event loop 10-50ms. Same behavior as CLI. Optimization (worker thread or async scan) deferred to v2. |
| Concurrent branch requests on same source | Both succeed (different target UUIDs, `'wx'` exclusive create prevents collisions). The idle guard prevents most concurrent scenarios, but a race window exists between the check and the ext method call. Acceptable: the result is two valid independent forks. |
| Double-read of JSONL | The ext method reads the file for fork, then `restoreSession('resume')` triggers `newSessionConfig` which reads it again to build `sessionData`. This is the cost of the two-phase architecture (ext method for domain ops + restoreSession for lifecycle mgmt). A protocol enhancement could pass through `sessionData` to avoid the second read — deferred to v2. |
| No `afterMessageId` support (fork from a point) | `forkSession` always copies all records. Workaround: branch then rewind. Additive feature for v2, doesn't block current design. |

### Decision: `flush()` only, not `finalize()`

`finalize()` marks the recording service as done (sets internal flags that prevent further appends) and queues a trailing title record. This is acceptable in the CLI because `/branch` switches to a new session. In the daemon, the source session STAYS alive after branch.

**Final answer**: Call only `flush()`, not `finalize()`. This avoids mutating the source session's recording service state. The parent's existing title (if any) is already present in earlier `custom_title` records. The fork's own title is set via `renameSession()`.

### Confirmed by Audit: `resume` is fully functional

Both `loadSession` and `unstable_resumeSession` in the ACP child:
1. Call `newSessionConfig(cwd, [], sessionId, true)` — full Config initialization (tools, MCP, model, permissions)
2. Build `sessionData` from the JSONL via `sessionService.loadSession(sessionId)`
3. Call `geminiClient.initialize()` which seeds the model's chat history from `sessionData.conversation`
4. Return `state: { models, modes, configOptions }` — fully populated

The ONLY difference is that `loadSession` additionally triggers `replayHistory()` which emits `session_update` SSE events. Since we don't want replay on branch, `resume` is the correct choice.

## Verification

1. **Unit tests** (`server.test.ts`):
   - Happy path: POST /session/:id/branch returns 201 with forked session
   - With custom name: verify title contains the custom name
   - Source session not found: 404
   - Source session has active prompt: 409
   - Session limit exceeded: 429
   - Capability tag `session_branch` advertised in GET /capabilities

2. **Integration test** (manual):
   ```bash
   # Start daemon
   qwen serve --port 3100

   # Create a session and send a prompt (wait for completion)
   SESSION=$(curl -s -X POST http://localhost:3100/session | jq -r .sessionId)
   curl -X POST http://localhost:3100/session/$SESSION/prompt \
     -H 'Content-Type: application/json' \
     -d '{"prompt":[{"type":"text","text":"hello"}]}'

   # Branch the session
   BRANCHED=$(curl -s -X POST http://localhost:3100/session/$SESSION/branch \
     -H 'Content-Type: application/json' \
     -d '{"name":"my-experiment"}')
   echo $BRANCHED | jq .
   # Expect 201, sessionId != $SESSION, title contains "my-experiment (Branch)"

   # Verify the new session is live and promptable
   NEW_ID=$(echo $BRANCHED | jq -r .sessionId)
   curl -X POST http://localhost:3100/session/$NEW_ID/prompt \
     -H 'Content-Type: application/json' \
     -d '{"prompt":[{"type":"text","text":"what did I say before?"}]}'

   # Verify source session still works
   curl -X POST http://localhost:3100/session/$SESSION/prompt \
     -H 'Content-Type: application/json' \
     -d '{"prompt":[{"type":"text","text":"continue"}]}'
   ```

3. **SDK test**:
   ```typescript
   const branched = await client.branchSession(sessionId, { name: 'experiment' });
   expect(branched.sessionId).not.toBe(sessionId);
   expect(branched.title).toContain('experiment');
   expect(branched.forkedFrom.sessionId).toBe(sessionId);
   ```

4. **409 guard test**:
   ```typescript
   // Start a prompt, then immediately try to branch
   const promptPromise = client.sendPrompt(sessionId, { prompt: [...] });
   await expect(client.branchSession(sessionId)).rejects.toMatchObject({
     status: 409,
     code: 'branch_while_prompt_active',
   });
   await promptPromise;
   ```

## Final Implementation Status

- **PR status**: #4514 (tracking issue) — OPEN. No dedicated implementation PR found for T3.1 (session branch route).
- **What was implemented**: This plan (T3.1: `POST /session/:id/branch`) does not appear to have been implemented yet. The tracking issue #4514 remains open as a capability gap backlog item.
- **Key divergences**: Plan was written but implementation has not started or has not been submitted as a PR.
- **Files planned to change**: `packages/acp-bridge/src/status.ts`, `packages/acp-bridge/src/bridgeErrors.ts`, `packages/core/src/services/sessionService.ts`, `packages/cli/src/acp-integration/acpAgent.ts`, `packages/cli/src/serve/httpAcpBridge.ts`, `packages/cli/src/serve/server.ts`, `packages/cli/src/serve/capabilities.ts`, `packages/sdk-typescript/src/daemon/types.ts`, `packages/sdk-typescript/src/daemon/DaemonClient.ts`, `packages/sdk-typescript/src/daemon/events.ts`
