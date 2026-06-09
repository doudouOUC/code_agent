# Plan — Daemon Mode Developer Documentation Set

## Context

`worktree-enumerated-stirring-adleman` (HEAD `8375e61a8`) is the most up-to-date integration of the qwen-code daemon work — `qwen serve` runtime, the `acp-bridge` package, multi-client permission mediation (F3), the workspace-scoped MCP transport pool (F2), the typed daemon event schema v1, the TypeScript SDK daemon client, plus the CLI TUI / channel / VSCode IDE adapters built on top.

What exists in `docs/` today is **not a developer architecture set**:

- `docs/users/qwen-serve.md` — user-facing operator guide (start it, flags, threat model, runtime gap list).
- `docs/developers/qwen-serve-protocol.md` — wire-level HTTP route reference.
- `docs/developers/daemon-client-adapters/{tui,ide,channel-web}.md` — *draft* design notes, not finished docs.
- `docs/developers/examples/daemon-client-quickstart.md` — TS walkthrough using the SDK.
- `docs/design/f2-mcp-transport-pool.md` — internal design notes for F2.

What's missing — and what this plan delivers — is a per-component **developer technical documentation set** that walks a new contributor through every load-bearing piece of the daemon stack, in both English and Chinese, with a top-level architecture map and per-topic deep-dives covering **功能 (functionality) / 核心实现 (core implementation) / 流程 (workflow)**.

The target branch is already checked out at:
`/Users/jinye.djy/Projects/qwen-code/.claude/worktrees/enumerated-stirring-adleman` (no need to switch branches in the current worktree). All new files land under `docs/developers/daemon/` in this current worktree (`drifting-churning-waffle`).

## Deliverable Shape

- **Location**: `docs/developers/daemon/` (new directory).
- **File format**: one `.md` per topic, containing English content first, then a `---` separator, then mirrored Chinese content. Each language section is fully self-contained (same headings, same diagrams, same code refs).
- **Diagrams**: Mermaid (GitHub-native). Each diagram appears once and is referenced from both language sections.
- **Cross-link convention**: relative paths within `docs/developers/daemon/`. External docs (`qwen-serve.md`, `qwen-serve-protocol.md`) are linked, never duplicated.

### Per-topic doc structure (the contract every file follows)

Each topic file is laid out as:

```
# <Title> (English)

## Overview                  — what this is, why it exists, who depends on it
## Responsibilities          — capability surface in one bullet list
## Architecture              — modules, classes, data model (with file:line refs)
## Workflow                  — sequence diagram(s) for the load-bearing flows
## State & Lifecycle         — state machine where applicable
## Dependencies              — upstream/downstream modules (link to other docs)
## Configuration             — env vars / flags / settings.json that affect it
## Caveats & Known Limits    — pitfalls, race conditions, current gaps
## References                — files, related docs, PRs/issues (#3803, #4175)

---

# <标题> (中文)

(same structure, mirrored)
```

## Document Set (20 files)

Foundation layer:

| # | File | Topic |
|---|------|-------|
| 00 | `00-index.md` | README / navigation / glossary / reading order |
| 01 | `01-architecture.md` | **System architecture & diagrams** — process topology, package map, request/event/permission/pool flows. Contains the "overall architecture diagram" the user asked for, plus all top-level sequence diagrams. |

Server core deep-dives:

| # | File | Source under doc |
|---|------|------------------|
| 02 | `02-serve-runtime.md` | `packages/cli/src/serve/runQwenServe.ts:308-994`, `server.ts:261-339`, middleware (`auth.ts`), graceful shutdown |
| 03 | `03-acp-bridge.md` | `packages/acp-bridge/src/bridge.ts`, `bridgeClient.ts`, `bridgeOptions.ts`, `bridgeTypes.ts`, `channel.ts`, `spawnChannel.ts` |
| 04 | `04-permission-mediation.md` | `permission.ts:1-177`, `permissionMediator.ts:1-1292` — four policies (`first-responder`, `designated`, `consensus`, `local-only`), N1 timeout invariant, `CANCEL_VOTE_SENTINEL`, `forgetSession` |
| 05 | `05-mcp-transport-pool.md` | `packages/core/src/tools/mcp-transport-pool.ts`, `mcp-pool-entry.ts`, `mcp-pool-key.ts`, `session-mcp-view.ts` |
| 06 | `06-mcp-budget-guardrails.md` | `packages/core/src/tools/mcp-workspace-budget.ts`, hysteresis, `beginBulkPass`/`endBulkPass`, modes |
| 07 | `07-workspace-filesystem.md` | `packages/cli/src/serve/fs/` (policy, paths, audit, workspaceFileSystem) + `BridgeFileSystem` interface + bridge adapter |
| 08 | `08-session-lifecycle.md` | `bridge.ts` session map, `BridgeSession`, `loadSession`/`resumeSession`, `X-Qwen-Client-Id` identity, heartbeat, eviction, `displayName` metadata |
| 09 | `09-event-schema.md` | `packages/sdk-typescript/src/daemon/events.ts:13-63` — `DAEMON_KNOWN_EVENT_TYPE_VALUES`, `narrowDaemonEvent`, all 30 typed event envelopes + payloads, reducers (`reduceDaemonSessionEvent`, `reduceDaemonAuthEvent`) |
| 10 | `10-event-bus.md` | `packages/acp-bridge/src/eventBus.ts` — monotonic IDs, ring buffer, `Last-Event-ID` replay, slow-client backpressure, `client_evicted` terminal frame |
| 11 | `11-capabilities-versioning.md` | `packages/cli/src/serve/capabilities.ts:1-160`, `SERVE_PROTOCOL_VERSION`, `CAPABILITIES_SCHEMA_VERSION`, `EVENT_SCHEMA_VERSION`, `since` tags, conditional advertisement |
| 12 | `12-auth-security.md` | `packages/cli/src/serve/auth.ts` (bearer, hostAllowlist, CORS, mutationGate), `--require-auth`, `/health` exemption, device-flow routes |

Client adapters:

| # | File | Source under doc |
|---|------|------------------|
| 13 | `13-sdk-daemon-client.md` | `packages/sdk-typescript/src/daemon/{index,DaemonClient,DaemonSessionClient,DaemonAuthFlow,types,events,sse}.ts` — full public surface |
| 14 | `14-cli-tui-adapter.md` | `packages/cli/src/ui/daemon/DaemonTuiAdapter.ts` — `DaemonTuiSessionClient`, `reduceDaemonEventToTuiUpdates`, `DaemonTuiUpdate` union |
| 15 | `15-channel-adapters.md` | `packages/channels/` — `DaemonChannelBridge`, `ChannelBase`, DingTalk/WeChat/Telegram adapters, per-channel transport matrix |
| 16 | `16-vscode-ide-adapter.md` | `packages/vscode-ide-companion/src/services/daemonIdeConnection.ts:161-628`, loopback enforcement, webview bridging |

Cross-cutting:

| # | File | Topic |
|---|------|-------|
| 17 | `17-configuration.md` | Env vars (`QWEN_SERVER_TOKEN`, `QWEN_SERVE_DEBUG`, `QWEN_SERVE_NO_MCP_POOL`, `QWEN_SERVE_MCP_CLIENT_BUDGET`, `QWEN_SERVE_MCP_BUDGET_MODE`), `--token`/`--require-auth`/`--hostname`/`--workspace`/etc. CLI flags, relevant `settings.json` keys |
| 18 | `18-error-taxonomy.md` | `DaemonErrorKind`, fs error kinds, `packages/acp-bridge/src/bridgeErrors.ts` (typed errors), SDK error wrapping |
| 19 | `19-observability.md` | `QWEN_SERVE_DEBUG=1`, stderr logging, telemetry gaps, debugging recipes (`/health`, `/capabilities`, `/workspace/preflight`, SSE tail with `curl`) |

## Architecture diagram package (in `01-architecture.md`)

Six Mermaid diagrams, in order:

1. **Process topology** — daemon process + ACP child + N clients + MCP servers (pooled) over HTTP/SSE + stdio JSON-RPC.
2. **Package map** — `cli/serve` → `acp-bridge` → ACP child (`core`, `cli/ui/daemon`-equivalent runtime, `core/tools/mcp-*`); `sdk-typescript/daemon` → HTTP; adapters (`cli/ui/daemon`, `channels`, `vscode-ide-companion`, `webui`) → SDK.
3. **HTTP request lifecycle** — client → bearer/host/CORS/mutationGate → route handler → bridge → ACP child → response.
4. **SSE event delivery** — ACP child event → BridgeClient → EventBus.publish → per-subscriber queue → SSE wire; reconnect with `Last-Event-ID`.
5. **Permission mediation (multi-client)** — agent → `mediator.request` → fan-out to subscribers → `mediator.vote` → policy-specific resolution (consensus partial votes, designated cancel, first-responder, local-only loopback).
6. **MCP pool acquire/release + restart** — `acquire` dedup via `spawnInFlight`, idle drain timer, `restartByName` flow, `releaseSession` reverse-index sweep.

## Critical files to keep in mind

| Concern | File:line |
|---|---|
| Serve bootstrap | `packages/cli/src/serve/runQwenServe.ts:308-994` |
| Express app factory | `packages/cli/src/serve/server.ts:261-339` |
| Capability registry | `packages/cli/src/serve/capabilities.ts:1-160` |
| Auth middleware | `packages/cli/src/serve/auth.ts:1-60` |
| Bridge core | `packages/acp-bridge/src/bridge.ts` |
| Permission mediator | `packages/acp-bridge/src/permissionMediator.ts:1-1292` + `permission.ts:1-177` |
| Event bus | `packages/acp-bridge/src/eventBus.ts` |
| Bridge file system | `packages/acp-bridge/src/bridgeFileSystem.ts:39-97` + `packages/cli/src/serve/bridgeFileSystemAdapter.ts` + `packages/cli/src/serve/fs/` |
| MCP transport pool | `packages/core/src/tools/mcp-transport-pool.ts:104-180+` |
| MCP pool entry | `packages/core/src/tools/mcp-pool-entry.ts:1-60` |
| MCP workspace budget | `packages/core/src/tools/mcp-workspace-budget.ts:55+` |
| Typed events | `packages/sdk-typescript/src/daemon/events.ts:13-63` |
| SDK DaemonClient | `packages/sdk-typescript/src/daemon/DaemonClient.ts:209-1506` |
| SDK SessionClient | `packages/sdk-typescript/src/daemon/DaemonSessionClient.ts:61-385` |
| SDK SSE parser | `packages/sdk-typescript/src/daemon/sse.ts:70-295` |
| SDK Auth device flow | `packages/sdk-typescript/src/daemon/DaemonAuthFlow.ts:102-340` |
| CLI TUI adapter | `packages/cli/src/ui/daemon/DaemonTuiAdapter.ts:33-905` |
| Channel base bridge | `packages/channels/base/src/DaemonChannelBridge.ts:1-179+` |
| DingTalk adapter | `packages/channels/dingtalk/src/DingtalkAdapter.ts:79-586` |
| WeChat adapter | `packages/channels/weixin/src/WeixinAdapter.ts:33-309` |
| Telegram adapter | `packages/channels/telegram/src/TelegramAdapter.ts:19-308` |
| VSCode IDE adapter | `packages/vscode-ide-companion/src/services/daemonIdeConnection.ts:161-628` |
| Daemon status provider | `packages/cli/src/serve/daemonStatusProvider.ts:41-287` |
| Permission audit ring | `packages/cli/src/serve/permissionAudit.ts:1-60` |

## Reuse vs duplication boundary

These existing docs stay the source of truth — the new set **links** to them and never copies their content:

- Route catalogue → `docs/developers/qwen-serve-protocol.md` (referenced from doc 02, 11, 12, 13).
- End-to-end SDK walkthrough → `docs/developers/examples/daemon-client-quickstart.md` (referenced from doc 13).
- Operator-facing flags & quickstart → `docs/users/qwen-serve.md` (referenced from doc 17).
- F2 design history → `docs/design/f2-mcp-transport-pool.md` (referenced from doc 05).

Doc 04 (`permission-mediation`), doc 05 (`mcp-transport-pool`), doc 09 (`event-schema`), doc 10 (`event-bus`), and docs 14/15/16 fill the largest current gaps — those topics have no developer-facing documentation today.

## Execution order

1. **00, 01** first — index + architecture diagrams provide the visual scaffold every later doc links into.
2. **02, 03** — serve runtime + ACP bridge (everything else hangs off these).
3. **08, 09, 10, 11, 12** — sessions, event schema, event bus, capabilities/versioning, auth/security (the wire-side fundamentals).
4. **04, 05, 06, 07** — permission mediation, MCP pool, MCP budget, workspace FS (the cross-cutting server subsystems).
5. **13** — SDK (the lingua franca for all adapters).
6. **14, 15, 16** — adapters (TUI, channels, VSCode IDE).
7. **17, 18, 19** — configuration, error taxonomy, observability (the reference appendices).

Each doc lands as one commit so the trail is reviewable per-topic.

## Verification

Per-doc check, before considering a topic done:

- [ ] **Source accuracy**: every `file:line` reference resolves in `worktree-enumerated-stirring-adleman` (spot-check 5 refs per doc).
- [ ] **Bilingual parity**: EN and ZH sections have the same heading count + diagram count + code-ref count.
- [ ] **No protocol-doc duplication**: route descriptions reference `qwen-serve-protocol.md` instead of copying tables.
- [ ] **Cross-links resolve**: every relative link inside `docs/developers/daemon/` opens its target heading.
- [ ] **Mermaid renders**: paste each diagram into GitHub markdown preview / `https://mermaid.live` to confirm.
- [ ] **Per-topic contract met**: doc answers 功能 (Responsibilities) + 核心实现 (Architecture) + 流程 (Workflow) — these are explicit headings, not implied.

Set-level checks once all 20 land:

- [ ] `00-index.md` lists every other doc with the same titles they actually use.
- [ ] Glossary in `00-index.md` defines every acronym used elsewhere (ACP, MCP, SSE, EventBus, BridgeClient, MediatorPolicy, PoolEntry, etc.).
- [ ] Reading-order recommendation in `00-index.md` matches the execution order above.
- [ ] `grep -r 'docs/developers/daemon' docs/` shows no broken inbound links from existing docs that we updated to cross-reference the new set.
- [ ] Confirm the 30 typed event names listed in doc 09 match the live `DAEMON_KNOWN_EVENT_TYPE_VALUES` array in `events.ts` (catches schema drift between plan-time and write-time).
- [ ] Confirm the 4 permission policies listed in doc 04 match the live `PermissionPolicy` union in `permission.ts`.

## Open follow-ups (out of scope for this set, called out in `00-index.md`)

- Java SDK and Python SDK daemon clients — only the TS SDK ships a daemon client today, so the SDK doc (13) is TS-only.
- Web UI (`packages/webui/`) is a component library, not a daemon client; called out as such in doc 15's neighborhood but not given its own chapter.
- Zed extension uses stdio ACP directly (not the daemon HTTP); briefly noted in `00-index.md` to prevent confusion.
- F4 (in-progress at the time of writing) — protocol completion / `qwen --serve` co-host — gets a forward-looking pointer in `00-index.md`, not its own chapter, since the surface isn't stable.

## Final Implementation Status

- **PR #4412**: OPEN (not yet merged) — "docs(developers): add daemon-mode developer deep-dive documentation set"
- **Summary**: The documentation set PR was created and remains open. The underlying daemon features referenced by this plan (issue #3803, issue #4175) have all been implemented across many PRs (e.g., #3889 Stage 1, #4319 F1, #4335 F3, etc.).
- **Key divergences**: The plan itself is a documentation-only deliverable. The code it documents is complete and merged, but the 20-file developer docs set has not yet landed.
- **Status**: Work in progress — the PR exists but awaits review/merge.
