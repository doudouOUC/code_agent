# F3 — Multi-Client Permission Coordination (#4175)

Implements [F3 from #4175](https://github.com/QwenLM/qwen-code/issues/4175): the
`PermissionMediator` contract frozen by [PR 22a (#4295)](https://github.com/QwenLM/qwen-code/pull/4295)
plus 4 strategy implementations, audit ring, capability surface, SDK reducer support, and docs.

## Strategies

| Strategy            | Behavior                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| `first-responder`   | Pre-F3 default. Any validated voter wins; later voters get `404`. Wire-shape byte-for-byte preserved. |
| `designated`        | Only the prompt originator decides; non-originators get `403 permission_forbidden / designated_mismatch`. Anonymous prompts (no `X-Qwen-Client-Id`) fall back to first-responder. |
| `consensus`         | N-of-M voters agree (default `N = floor(M/2) + 1`; override via `policy.consensusQuorum`). First option to reach quorum wins. Intermediate votes fan out `permission_partial_vote` SSE events. |
| `local-only`        | Loopback voters only; remote callers get `403 permission_forbidden / remote_not_allowed`. Decided by kernel-stamped `req.socket.remoteAddress` — does NOT consult `X-Forwarded-For` or any header. |

## What's new

- `MultiClientPermissionMediator` (mediator owns ALL pending + resolved permission state; bridge keeps only `entry.pendingPermissionIds` as a fast cap-check index)
- `PermissionAuditRing` + `createPermissionAuditPublisher` (in-memory bounded ring, default 512 entries, NOT routed onto SSE)
- 2 new SSE wire events: `permission_partial_vote` (consensus only), `permission_forbidden` (designated/consensus/local-only)
- 3 new typed errors: `PermissionForbiddenError` (403), `PermissionPolicyNotImplementedError` (501, forward-compat), `CancelSentinelCollisionError` (500)
- New settings: `policy.permissionStrategy` enum, `policy.consensusQuorum` number
- New capability: `permission_mediation` (always-on, `modes: [...]`); `/capabilities.policy.permission` exposes the active policy
- SDK: `DaemonPermissionPartialVoteEvent` / `DaemonPermissionForbiddenEvent` types, reducer extensions (`permissionVoteProgress`, `forbiddenVotes`), barrel re-exports

## Hardness invariants

- **N1**: `mediator.request()` registers pending entries synchronously inside the Promise executor (no await before register) so a `forgetSession` racing with the bridge's `publish → register → await` sequencing can never miss a new pending.
- **N2**: `resolveEntry` cleanup is hardened — clearTimeout → state delete → emit (try/catch) → audit (try/catch) → Promise resolve (last). Tests verify the Promise settles even when emit/audit throw.
- **N3**: New events (`permission_partial_vote`, `permission_forbidden`) stamp `originatorClientId = pending.originatorClientId` (prompt originator). Pre-existing `permission_resolved.originatorClientId === voter.clientId` inconsistency is **deliberately preserved** for wire-shape compatibility — frozen by regression test.
- **O5**: Voter cancel (`{outcome:'cancelled'}`) maps to `optionId: '__cancelled__'` sentinel. Mediator resolves cancelled regardless of policy; collision against agent-declared option labels is detected at request issue time and throws `CancelSentinelCollisionError`.
- **O8**: Pre-F3 wire shape preserved bit-for-bit when policy is `first-responder` (default). `httpAcpBridge.test.ts` snapshot tests continue to pass.

## Out of scope (follow-ups)

- `GET /workspace/permission/audit` query route on the audit ring (Commit 4 stages the ring; route follow-up).
- Pair-token + revocation API for `consensus` voter authentication.
- `POST /workspace/policy` live-reload (today: daemon restart).
- Decision persistence ("always allow" rules).
- Hook layer (PreToolUse-style external arbitrators).

## References

- Issue: #4175
- Frozen contract: [PR 22a #4295](https://github.com/QwenLM/qwen-code/pull/4295)
- Design references: opencode `permission/index.ts` (Deferred + map-delete-before-resolve), claude-code `PermissionRequest` hook (decisionReason discriminator)
- Plan: `.claude/plans/fluttering-coalescing-kettle.md`

## Testing

- 35 mediator unit tests (4 strategies × happy path / forbidden / timeout / forgetSession; consensus 48-case property enumeration + M=4 N=3 split timeout)
- 10 audit ring tests (capacity, FIFO, snapshot filters, all 5 record shapes)
- 55 SDK reducer tests (8 new for partial vote / forbidden + ordering + forward-compat)
- 3 bridge integration tests (policy accessor, quorum validation)
- Pre-existing `httpAcpBridge.test.ts` snapshot suite stays green (first-responder bit-for-bit preserved)

## Migration

Default behavior unchanged: omitting `policy.permissionStrategy` from settings keeps the daemon on first-responder. Operators opt in by writing one of the 4 strings under `policy.permissionStrategy` in workspace `settings.json`. Daemon restart required to pick up changes.

🤖 Generated with [Qwen Code](https://github.com/QwenLM/qwen-code)

## Final Implementation Status

- **PR status**: MERGED — PR #4335 "feat(acp-bridge): F3 — multi-client permission coordination (#4175)" merged 2026-05-20. The contract PR #4295 (skeleton) merged 2026-05-18 as prerequisite.
- **Summary**: The full F3 multi-client permission coordination was implemented: `MultiClientPermissionMediator` with 4 strategies (first-responder, designated, consensus, local-only), `PermissionAuditRing`, new SSE events (`permission_partial_vote`, `permission_forbidden`), new typed errors, settings schema, capability tag `permission_mediation`, and SDK reducer extensions. 27 files changed.
- **Key divergences**: Implementation closely matched the plan. The `PermissionAuditRing` was placed in `packages/cli/src/serve/permissionAudit.ts` (not in acp-bridge as might be expected). The mediator was in `packages/acp-bridge/src/permissionMediator.ts`. All 4 strategies, hardness invariants (N1/N2/N3/O5/O8), and the cancel sentinel pattern were implemented as described.
- **Files actually changed**: 27 files across `packages/acp-bridge/src/` (bridge, bridgeClient, bridgeErrors, bridgeOptions, bridgeTypes, permission, permissionMediator + tests), `packages/cli/src/serve/` (httpAcpBridge, capabilities, permissionAudit, runQwenServe, server, types + tests), `packages/cli/src/config/settingsSchema.ts`, `packages/sdk-typescript/src/daemon/` (events, index), and docs.
