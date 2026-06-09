# Daemon Follow-up Suggestions — End-to-End Design

## Context

Today the follow-up suggestion feature (ghost-text "what you might want to ask next") only works in the in-process CLI. When users run qwen-code via the daemon — webui at `packages/webui/`, plus future TUI/IDE daemon adapters — they never see suggestions. The webui's `InputForm` already accepts a `followupState` prop (`packages/webui/src/components/layout/InputForm.tsx:134`) but the daemon never populates it (dead prop, left as a hook point).

This plan adds a `followup_suggestion` event to the daemon event bus so the ACP child generates a suggestion after each turn and pushes it to all attached clients. Phase 1 wires it through to the webui.

### Locked decisions (already confirmed with user)

- **Generation site**: server-side push. ACP child generates after each turn; clients are passive consumers.
- **Phase 1 scope**: webui only. TUI/IDE daemon adapters out of scope.
- **Setting**: reuse the existing `enableFollowupSuggestions` setting from `packages/cli/src/config/settingsSchema.ts`.
- **No feature flag, no protocol version bump** — additive on the wire (mirrors precedent PR #4360 `state_resync_required`).

## Data flow

```
┌──── ACP child (qwen --acp subprocess) ─────────────────────────────────────────┐
│ Session.prompt()                  packages/cli/src/acp-integration/session/    │
│   await #executePrompt(...)           Session.ts:545                            │
│   if result.stopReason === 'end_turn' && enableFollowupSuggestions:            │
│     fire-and-forget IIFE:                                                       │
│       generatePromptSuggestion(config, history, followupAbort.signal,          │
│                                { enableCacheSharing })                          │
│       if suggestion:                                                            │
│         client.extNotification(                                                 │
│           'qwen/notify/session/prompt-suggestion',                              │
│           { v:1, sessionId, suggestion, promptId })                            │
└──────────────────────────────────┬──────────────────────────────────────────────┘
                                   │ ACP wire (extNotification)
                                   ▼
┌──── BridgeClient.extNotification    packages/acp-bridge/src/bridgeClient.ts:491┐
│ + NEW branch for 'qwen/notify/session/prompt-suggestion'                       │
│   resolveEntry(sessionId).events.publish({                                      │
│     type: 'followup_suggestion',                                                │
│     data: { sessionId, suggestion, promptId },                                  │
│     ...originatorClientId? })                                                   │
└──────────────────────────────────┬──────────────────────────────────────────────┘
                                   │ EventBus → SSE
                                   ▼
┌──── SDK   packages/sdk-typescript/src/daemon/events.ts ────────────────────────┐
│ + 'followup_suggestion' in DAEMON_KNOWN_EVENT_TYPE_VALUES                      │
│ + DaemonFollowupSuggestionData + envelope + predicate                          │
│ + DaemonAssistEvent union (new) → KnownDaemonEvent                             │
│ + asKnownDaemonEvent + reduceDaemonSessionEvent cases                          │
│ + lastFollowupSuggestion on DaemonSessionViewState                             │
│                                                                                 │
│ ui/normalizer.ts: 'followup_suggestion' → DaemonUiFollowupSuggestionEvent      │
│ ui/transcript.ts: stores lastFollowupSuggestion on DaemonTranscriptState       │
└──────────────────────────────────┬──────────────────────────────────────────────┘
                                   ▼
┌──── Webui    packages/webui/src/daemon/DaemonSessionProvider.tsx:196 ──────────┐
│ existing for-await loop dispatches normalized events into transcript store     │
│ + NEW useDaemonFollowupSuggestion(actions) hook reads lastFollowupSuggestion   │
│   and feeds existing useFollowupSuggestions controller (hooks/useFollowup-     │
│   Suggestions.ts) — same controller the CLI uses, just driven by daemon       │
│   state instead of in-process state                                            │
│ + Hook clears on sendPrompt (client-side self-invalidation, no wire round-trip)│
│                                                                                 │
│ Downstream consumer wires <InputForm followupState={...} ... /> using          │
│ existing props (no JSX change inside packages/webui/src/)                       │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## New event type

Joins a **new** `DaemonAssistEvent` union (cleaner than overloading `DaemonControlEvent`, which is for mutations; this is an assist/UX hint and the union can grow later, e.g. `speculation_available`).

```ts
export interface DaemonFollowupSuggestionData {
  sessionId: string;     // matches the sessionId-on-data invariant in events.ts
  suggestion: string;    // already post-filter (getFilterReason()===null), non-empty
  promptId: string;      // `<sessionId>########<turn>` — Session.ts:567 shape
  [key: string]: unknown; // forward-compat (events.ts convention)
}

export type DaemonFollowupSuggestionEvent =
  DaemonEventEnvelope<'followup_suggestion', DaemonFollowupSuggestionData>;

export type DaemonAssistEvent = DaemonFollowupSuggestionEvent;
// add DaemonAssistEvent to KnownDaemonEvent union
```

**Field justification**
- `sessionId`: every session-scoped event in `events.ts:108-194` carries it.
- `suggestion`: only emit when filter passes — the wire never carries garbage.
- `promptId`: enables client-side stale-suppression without coupling to SDK clock; mirrors the existing identifier shape.
- No `filterReason` field on the wire — suppressed cases just don't emit; suppression telemetry stays server-side via the existing `PromptSuggestionEvent`.

## ACP child (Session.ts) changes

**Hook site**: at the end of `Session.prompt()` in `packages/cli/src/acp-integration/session/Session.ts:545`, just after `await this.#executePrompt(...)` resolves.

**New private field**: `private followupAbort: AbortController | null = null;`

**Abort wiring** (cancel any in-flight generation when a new prompt arrives or the user cancels):
- `prompt()` top alongside `pendingPrompt?.abort()` at line 504
- `cancelPendingPrompt()` alongside `pendingPrompt.abort()` at line 476

**Fire-and-forget IIFE** after `#executePrompt` resolves with `stopReason === 'end_turn'`:

```ts
if (
  result.stopReason === 'end_turn' &&
  this.config.isInteractive() &&
  this.config.getApprovalMode() !== ApprovalMode.PLAN &&
  this.settings.merged.ui?.enableFollowupSuggestions === true
) {
  const ac = new AbortController();
  this.followupAbort = ac;
  const promptId = this.config.getSessionId() + '########' + this.turn;
  void (async () => {
    try {
      const chat = this.config.getGeminiClient()?.getChat();
      if (!chat) return;
      const history = chat.getHistory(true).slice(-40);
      const r = await generatePromptSuggestion(this.config, history, ac.signal, {
        enableCacheSharing: this.settings.merged.ui?.enableCacheSharing === true,
      });
      if (ac.signal.aborted || !r.suggestion) return;
      await this.client.extNotification(
        'qwen/notify/session/prompt-suggestion',
        { v: 1, sessionId: this.sessionId, suggestion: r.suggestion, promptId },
      );
    } catch {
      // best-effort UX; swallow
    }
  })();
}
```

Guards parity with CLI (`AppContainer.tsx:2038-2139`): interactive only, not PLAN mode, setting enabled. History slicing to last 40 entries matches CLI behaviour. Cache-sharing flag forwarded.

Reuse — do NOT refactor:
- `generatePromptSuggestion` from `packages/core/src/followup/suggestionGenerator.ts:93` — handles fast-model selection, `MIN_ASSISTANT_TURNS=2` gate, `getFilterReason()`, abort behaviour, telemetry via `PromptSuggestionEvent`.

## ACP wire choice

Use the existing `extNotification` escape hatch with a new method `qwen/notify/session/prompt-suggestion`. Mirrors the `qwen/notify/session/mcp-budget-event` precedent at `bridgeClient.ts:495`.

**Why not piggyback on `session/update`**: `session/update` is the ACP-standard `SessionNotification` shape with a `update.sessionUpdate` discriminator. Adding a non-standard kind would pollute the ACP namespace and surface as a `debug` block in the normalizer's default case. `extNotification` is the project's existing namespaced channel for this exact use case.

**Forward/backward compat**: `extNotification` documents "Unknown methods, unknown event kinds, and missing sessionIds are dropped silently for forward-compat" — old bridges ignore the new method, old children just don't send it.

**Early-event buffering**: not needed — the new method only fires *after* a prompt completes, never inside `newSession`. Skip the `bufferEarlyEvent` path used by `mcp-budget-event`.

## Bridge handler (BridgeClient)

Extend `extNotification` in `packages/acp-bridge/src/bridgeClient.ts:491` with a second method branch. Pattern follows `mcp-budget-event` (lines 491-532), simpler (no `kind` switch):

```ts
async extNotification(method: string, params: Record<string, unknown>): Promise<void> {
  if (method === 'qwen/notify/session/prompt-suggestion') {
    const sessionId = params['sessionId'];
    const suggestion = params['suggestion'];
    const promptId = params['promptId'];
    if (typeof sessionId !== 'string') return;
    if (typeof suggestion !== 'string' || !suggestion) return;
    if (typeof promptId !== 'string') return;
    const entry = this.resolveEntry(sessionId);
    if (!entry) return; // no early buffering for this method
    entry.events.publish({
      type: 'followup_suggestion',
      data: { sessionId, suggestion, promptId },
      ...(entry.activePromptOriginatorClientId
        ? { originatorClientId: entry.activePromptOriginatorClientId }
        : {}),
    });
    return;
  }
  if (method !== 'qwen/notify/session/mcp-budget-event') return;
  // ... existing code
}
```

## Invalidation semantics

**Client-side self-invalidation via `promptId` correlation.** When webui calls `actions.sendPrompt()`, the new hook synchronously clears any displayed suggestion. When a fresh `followup_suggestion` event arrives, the hook displays it; its `promptId` (= just-completed turn) lets clients suppress stale events that race a new prompt.

Trade-off considered and rejected: server-emitted `{suggestion: null}` event on every new prompt — doubles SSE traffic, wastes a ring slot per prompt, and the client already knows it sent a prompt.

## SDK / UI plumbing

Add to `packages/sdk-typescript/src/daemon/events.ts`:

1. `'followup_suggestion'` in `DAEMON_KNOWN_EVENT_TYPE_VALUES` (line 14)
2. `DaemonFollowupSuggestionData` interface + `DaemonFollowupSuggestionEvent` envelope
3. `DaemonAssistEvent` union; add to `KnownDaemonEvent` (line 719-771)
4. `isFollowupSuggestionData` predicate
5. `case 'followup_suggestion'` in `asKnownDaemonEvent` (line 1082)
6. `case 'followup_suggestion'` in `reduceDaemonSessionEvent` (line 1236) — set `state.lastFollowupSuggestion = data`
7. `lastFollowupSuggestion?: DaemonFollowupSuggestionData` field on `DaemonSessionViewState`; add to `createDaemonSessionViewState`

Add to `packages/sdk-typescript/src/daemon/ui/`:
- `normalizer.ts` — case 'followup_suggestion' → emits `DaemonUiFollowupSuggestionEvent`
- `types.ts` — `'followup.suggestion'` in `DaemonUiEventType`; new `DaemonUiFollowupSuggestionEvent` interface; new `lastFollowupSuggestion?` on `DaemonTranscriptState`
- `transcript.ts` — case 'followup.suggestion' → `next.lastFollowupSuggestion = {...}`

## Webui wiring

Consumer file: `packages/webui/src/daemon/DaemonSessionProvider.tsx:196` (the `store.dispatch(uiEvents)` site — no change here; the transcript reducer above already absorbs the event).

**New hook export** in `packages/webui/src/daemon/`:

```ts
export function useDaemonFollowupSuggestion(actions: {
  sendPrompt: (...) => void;
}): {
  followupState: FollowupState;
  onAcceptFollowup: (method?, options?) => void;
  onDismissFollowup: () => void;
} {
  // Subscribe to store's lastFollowupSuggestion
  // Use existing useFollowupSuggestions controller (hooks/useFollowupSuggestions.ts)
  // On lastFollowupSuggestion change → setSuggestion(text)
  // On actions.sendPrompt call → dismiss()
}
```

Downstream consumers of `@qwen-code/webui` wire it via:

```tsx
const { followupState, onAcceptFollowup, onDismissFollowup } =
  useDaemonFollowupSuggestion(actions);

<InputForm
  ...
  followupState={followupState}
  onAcceptFollowup={onAcceptFollowup}
  onDismissFollowup={onDismissFollowup}
/>
```

**Reuse — do NOT refactor**:
- `packages/webui/src/hooks/useFollowupSuggestions.ts` — client-side controller (timing, accept/dismiss).
- `packages/webui/src/components/layout/InputForm.tsx:134-141, 201-203` — props already exist.

**Why hook export, not JSX edit**: `<InputForm>` has no callsite inside `packages/webui/src/` per grep — it's consumed downstream by app integrators.

## Telemetry

Reuse `PromptSuggestionEvent` from `packages/core/src/telemetry/types.ts:1110` verbatim. The `generatePromptSuggestion` function already logs server-side via this event. Accept/ignore telemetry continues to fire client-side via the existing `useFollowupSuggestions` `onOutcome` callback. No new dimension — daemon-vs-CLI source is inferable from the `prompt_id` shape and process context.

## Filtering — confirmation

`generatePromptSuggestion` (`suggestionGenerator.ts:130-136`) calls `getFilterReason(suggestion)` server-side and returns `{ suggestion: null, filterReason }` if rejected. The Session IIFE only fires `extNotification` when `r.suggestion` is non-null. **The wire never carries garbage suggestions.**

## Tests

**`packages/cli/src/acp-integration/session/Session.test.ts`** (+~5 cases)
- Emits `followup_suggestion` extNotification after `end_turn` when setting enabled
- Omits when `stopReason === 'cancelled'`
- Omits when `getFilterReason` rejects (mock `generatePromptSuggestion` to return `{ suggestion: null, filterReason: 'meta' }`)
- Aborts in-flight generation when a new `prompt()` arrives (asserts the AbortSignal in the mocked generator)
- Skips emission when `enableFollowupSuggestions` is false

**`packages/acp-bridge/src/bridgeClient.test.ts`** (+~3 cases)
- `extNotification('qwen/notify/session/prompt-suggestion')` publishes a `followup_suggestion` event with all three fields
- Stamps `originatorClientId` from session entry
- Drops malformed payloads silently (missing sessionId / non-string suggestion)

**`packages/sdk-typescript/test/unit/daemonEvents.test.ts`** (+~3 cases)
- `isFollowupSuggestionData` rejects missing fields / non-string suggestion / empty suggestion
- `asKnownDaemonEvent` narrows `followup_suggestion`
- `reduceDaemonSessionEvent` populates `lastFollowupSuggestion`

**`packages/sdk-typescript/test/unit/daemonUi.test.ts`** (+~2 cases)
- `normalizeDaemonEvent` maps `followup_suggestion` → `followup.suggestion` UI event
- Transcript reducer stores `lastFollowupSuggestion`

**`packages/webui/src/daemon/__tests__/useDaemonFollowupSuggestion.test.tsx`** (new file, +~3 cases)
- Surfaces suggestion to controller when `lastFollowupSuggestion` updates
- Dismisses on `actions.sendPrompt` call
- Returns stable `onAcceptFollowup` / `onDismissFollowup` callbacks across renders

## Files modified (grouped, line-count estimates)

| Package | File | Δ lines |
|---|---|---|
| cli (ACP child) | `src/acp-integration/session/Session.ts` | +60 |
| acp-bridge | `src/bridgeClient.ts` | +25 |
| sdk-typescript | `src/daemon/events.ts` | +90 |
| sdk-typescript | `src/daemon/ui/normalizer.ts` | +20 |
| sdk-typescript | `src/daemon/ui/types.ts` | +15 |
| sdk-typescript | `src/daemon/ui/transcript.ts` | +10 |
| webui | `src/daemon/useDaemonFollowupSuggestion.ts` (new) | +50 |
| webui | `src/daemon/index.ts` (re-export) | +1 |
| Tests | 6 test files (per above) | +400 |
| **Total** | | **~670** |

## Open risks / non-goals

1. **Ring eviction of last suggestion**: a client reconnecting with `Last-Event-ID > suggestion.id` won't replay it. Acceptable — suggestions are best-effort UX, not state.
2. **Fast-model availability**: `config.getFastModel()` may be unset for some providers; `generatePromptSuggestion` already falls back gracefully (`suggestionGenerator.ts:209`).
3. **Multi-client divergence**: two webui tabs see the same suggestion. Intended — `originatorClientId` is stamped so future logic can suppress for non-originators if desired.
4. **NOT addressed**: TUI daemon adapter, IDE daemon adapter — out of scope per locked decisions.
5. **NOT addressed**: speculative execution (`enableSpeculation`) — daemon parity would require porting the `overlayFs` / `speculation` pipeline; separate effort.

## Phasing — 3 commits, each independently shippable

**Commit 1 — `feat(sdk): add followup_suggestion event type`**
- `packages/sdk-typescript/src/daemon/events.ts` additions
- `packages/sdk-typescript/src/daemon/ui/normalizer.ts`
- `packages/sdk-typescript/src/daemon/ui/types.ts`
- `packages/sdk-typescript/src/daemon/ui/transcript.ts`
- Tests in `daemonEvents.test.ts`, `daemonUi.test.ts`
- **Zero runtime effect** — pure schema addition. Independently shippable: old daemons just don't emit it.

**Commit 2 — `feat(acp-bridge): publish followup_suggestion from extNotification`**
- `packages/acp-bridge/src/bridgeClient.ts` handler addition
- `packages/acp-bridge/src/bridgeClient.test.ts` cases
- Independently shippable: old ACP children just don't send the new method.

**Commit 3 — `feat(daemon+webui): generate and surface followup suggestions per turn`**
- `packages/cli/src/acp-integration/session/Session.ts` generation hook
- `packages/webui/src/daemon/useDaemonFollowupSuggestion.ts` (new) + index export
- `Session.test.ts` + `useDaemonFollowupSuggestion.test.tsx`
- The activating change.

Each commit is independently revertable. No protocol version bump, no setting, no flag.

## Critical files for implementation

- `/Users/jinye.djy/Projects/qwen-code/.claude/worktrees/cozy-noodling-clarke/packages/cli/src/acp-integration/session/Session.ts` (line 545)
- `/Users/jinye.djy/Projects/qwen-code/.claude/worktrees/cozy-noodling-clarke/packages/acp-bridge/src/bridgeClient.ts` (line 491)
- `/Users/jinye.djy/Projects/qwen-code/.claude/worktrees/cozy-noodling-clarke/packages/sdk-typescript/src/daemon/events.ts`
- `/Users/jinye.djy/Projects/qwen-code/.claude/worktrees/cozy-noodling-clarke/packages/sdk-typescript/src/daemon/ui/normalizer.ts`
- `/Users/jinye.djy/Projects/qwen-code/.claude/worktrees/cozy-noodling-clarke/packages/sdk-typescript/src/daemon/ui/transcript.ts`
- `/Users/jinye.djy/Projects/qwen-code/.claude/worktrees/cozy-noodling-clarke/packages/webui/src/daemon/DaemonSessionProvider.tsx` (consumer site reference; transcript reducer absorbs the new event without code changes here)
- `/Users/jinye.djy/Projects/qwen-code/.claude/worktrees/cozy-noodling-clarke/packages/core/src/followup/suggestionGenerator.ts` (reuse `generatePromptSuggestion`, do not refactor)

## Verification

End-to-end manual test:
1. Build all three packages: `npm run build` from repo root.
2. Start the daemon: `qwen serve --port 8765`.
3. Start the webui pointing at the daemon.
4. Send a prompt that triggers a multi-turn assistant response (need ≥ 2 assistant turns — `MIN_ASSISTANT_TURNS = 2`).
5. After the assistant finishes, observe a ghost-text suggestion appearing in the InputForm placeholder area within ~1 second.
6. Press `Tab` (or `→`) to accept — suggestion text fills the input.
7. Send a new prompt mid-generation — verify no stale suggestion appears (server-side abort + client-side dismiss).
8. Reconnect a second webui tab to the same session — verify the latest suggestion replays from the ring.
9. Disable `enableFollowupSuggestions` in settings, restart daemon — verify no `followup_suggestion` events appear in SSE output.

Automated:
- `npm run test --workspaces` from repo root — all new tests above pass.
- Spot-check SSE wire format: `curl -N http://localhost:8765/sessions/<id>/events` after a turn — observe a frame `data: {"id":N,"v":1,"type":"followup_suggestion","data":{...}}`.

## Final Implementation Status

- **PR status**: #4360 — MERGED on 2026-05-21 ("feat(serve+sdk): F4 prereq — daemon protocol completion (serverTimestamp / provenance / errorKind / state_resync_required)")
- **What was implemented**: PR #4360 shipped the prerequisite event infrastructure (`state_resync_required` event, provenance fields, `errorKind` typing). The `followup_suggestion` event type itself builds on this foundation but was likely implemented in a follow-up commit on the `daemon_mode_b_main` branch.
- **Key divergences**: The plan targeted `followup_suggestion` specifically, while PR #4360 was broader (F4 prereq protocol completion). The followup suggestion feature followed the same `extNotification` wire pattern described in this plan. The plan's `DaemonAssistEvent` union and bridge handler pattern appear consistent with the merged approach.
- **Files actually changed (PR #4360)**: `packages/acp-bridge/src/bridgeClient.ts` (+test), `packages/acp-bridge/src/eventBus.ts` (+test), `packages/cli/src/acp-integration/session/` (HistoryReplayer, ToolCallEmitter), `packages/cli/src/serve/server.ts` (+test), `packages/sdk-typescript/src/daemon/events.ts` (+test), `packages/sdk-typescript/src/daemon/index.ts`, `packages/sdk-typescript/src/index.ts`
