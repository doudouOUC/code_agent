# Managed Agent Workspace and Session cwd Contract

> **v1.10 clarification:** [Contract closure](managed-agent-contract-closure.en.md) section 4 binds context installation to private envelopes and receipts. Idle MCP connections are drainable after sealing admission, not hard blockers before the drain step. Runtime reclamation still treats an open connection as a hold. Section 6 adds actor-scoped authorization/idempotency; apply the command SQL delta after this Workspace delta.

[English](managed-agent-workspace-context.en.md) | [简体中文](managed-agent-workspace-context.md)

Status: v1.9 target design, not implemented. Date: 2026-09-21. Supplements the [HTML architecture](managed-agent-dual-path-architecture.html#workspace-context), [public contract](managed-agent-api-contract.md), and [extension runtime](managed-agent-extension-runtime.md). This change updates documentation, OpenAPI, and target DDL only; it does not enable multiple Workspaces or Session cwd changes in Java.

## 1. Verified Baseline and Scope

The source baseline is `feature/managed-agents-p0-p8@2695220a3a`. The daemon WorkspaceRegistry distinguishes registered workspaces and Session owners. Ordinary Session creation, restore, history, and `/session/:id/cd` retain their existing routing restrictions. Hosted APIs do not inherit local primary fallback or expand Legacy `/cd` support.

Java CreateSessionRequest, PublicSession, and managed_agent_session have no Workspace binding. EmbeddedRuntimeBroker resolves one global workspaceCwd/workspaceId/workspaceGeneration at startup and uses it for all Sessions. RuntimeScope carrying a directory does not make Session ownership durable. qwen Authority records cwd in its private journal, but cannot replace Java admission and Workspace authorization. The current implementation supports one statically configured Workspace.

Workspace creation, clone, worktree creation, migration between Workspaces, and standalone scratch allocation are outside W0. W0 uses administrator-registered, authorizable Workspaces. W2 changes cwd only within the same authorized filesystem scope.

## 2. Identity, Directories, and Authority

| Concept | Authority and purpose | Stability |
| --- | --- | --- |
| tenantId + workspaceId | Authenticated Java Workspace Registry; opaque Hosted ID, local path hash only a compatibility alias | Never derive a new Hosted identity from a path, Pod, or process |
| workspaceGeneration | Monotonic Registry version for replacement/removal boundaries; Session pins the expected generation | Runtime restart or ordinary cwd changes do not increment it; original executions remain queryable |
| workspaceStorageId | Logical identity of durable files, history, and manifests | Must remain resolvable after container reclamation; an empty same-name directory is not restoration |
| canonicalWorkspaceCwd | Validated Runtime mount root; local mode requires realpath | Internal, resolved again on another node, not a portable resource ID |
| cwdRelative | Durable logical cwd relative to the mount root, `.` for root; Java-owned | Restore input; public APIs may expose it within authorized Workspace scope |
| effectiveCwd | Runtime-resolved absolute path from mount root and cwdRelative | Internal execution snapshot, recalculated after mount relocation |
| contextRevision | Java CAS version for Session Workspace context; increments when a new cwd or installed configuration context becomes effective | Separate from Workspace generation, Runtime epoch, and Harness activation epoch |

contextConfigRef points to a frozen configuration-context descriptor (Bundle/configuration revision, policy reference, allowed roots, and loading sources), persisted with the Session binding. Registry updates do not overwrite an installed Session configuration. Recheck current authoritative authorization and trust revocation. Model-first execution uses the published bound configuration; Runtime must validate and install any cwd-derived repository configuration or file discovery, never read it from the Harness host directory.

Java owns binding metadata and cwd commands; qwen Authority owns private model context and installed-revision receipts; Runtime owns physical installation and execution receipts. Reconcile them through fixed operation IDs and revisions instead of competing current-cwd writers. Harness process.cwd() and journal storage directories are not execution cwd.

Absolute-path columns are internal installation/diagnostic snapshots. Restore uses storage identity and relative paths. Old absolute paths in private history require a verified mount mapping. Tools/history components without remapping support must keep the old mount location or block; changing cwd alone cannot establish successful restoration.

## 3. Creation and Routing (W0)

```text
WebShell selects workspaceId + cwdRelative
  → Java checks tenant, Workspace authorization, state, trust, and allowed roots
  → idempotent transaction: Session + binding + contextRevision=1
  → Harness loads bound configuration; model computation may start
  → Broker resolves storage/mount from the Session binding and provisions Runtime
  → Runtime verifies realpath/trust/generation and records context installation
  → tools execute only behind the matching revision's activation gate
```

Creation adds an optional workspace object, snake_case publicly and camelCase in the BFF. The server resolves it; browsers cannot supply authoritative tenants, generations, endpoints, absolute cwd, or allowed roots. Relative paths use `/` separators; reject absolute paths, drive prefixes, backslashes, NUL, and `..` segments. Normalize and validate realpath, symlinks, and directory existence. Filesystem verification may wait for Runtime provisioning, but no tools or workspace commands may run before it succeeds.

Omission is compatibility-only: resolve an explicitly configured tenant default Workspace and persist that decision. Otherwise return workspace_required. Never fall back to Java/Harness launch cwd or daemon primary. Existing Sessions always use their recorded binding. Workspace parameters enter the command digest; idempotent retries resolve the original command before selecting a default, so a changed default cannot create another Session.

Input, cancellation, tools, and tasks route through the persistent Session binding. Authorized history/export reads do not require Runtime startup. Workspace listing and Session retrieval are distinct resources; UI selection cannot rebind an existing Session. Services without W0 cannot advertise workspace_context or silently ignore the new parameters.

## 4. Directory Changes (W2)

`POST /v1/agents/sessions/{sessionId}/cwd` accepts cwd_relative, expected_context_revision, and Idempotency-Key. Return a durable operation with 202; operation lookup or session.context.changed confirms completion. BFF equivalents are `/sessions/cwd/change` and `/operations/query`.

Only the same authorized Workspace scope is supported. Another Workspace, independent worktree, or changed shared-write boundary needs separate admission; initially create a new Session. A shell command's `cd` does not change persistent Session cwd.

1. Use the global lock order Registry → Session → Turn → SessionOwner when a Registry lock is needed; otherwise start at Session. Registry invalidation cannot take these locks in reverse order. Lock Session and CAS the expected revision. Reject with session_context_busy if an active Turn, queued/admitted input, unresolved tool, approval, background Shell/Monitor/async Hook, shared-write child, or active MCP operation/unsettled receipt exists. Check idempotent replay first.
2. Atomically save the immutable target, prior context, and operationId; set context_state=changing and block new prompt, scheduled-input, and tool admission. Input and cwd mutation compete on the same barrier; only one may enter.
3. Use a narrow maintenance OperationGrant to install a closed gate on the original owner. Verify the target and prepare configuration, trust, permissions, MCP/Hook catalogs, and cwd-sensitive caches. Close idle stdio MCP connections requiring reconstruction. Never proceed with mixed old/new configuration.
4. Runtime and Harness persist installation receipts. File history retains Workspace-root semantics; read caches are isolated by context and the model receives trusted directory-change context. After both receipts, Java atomically updates cwd, contextConfigRef, revision, operation status, and the public event.
5. Reopen admission only after this commit is confirmed and installed revisions match. Subsequent Turns obtain a new activation. There is no distributed atomic transaction across Java, qwen, and Runtime.

Operation states are pending → installing → completed, plus failed/recovery_blocked. After a timeout, query the original operation. Only proof of no installation or a fully restored consistent prior context permits failed and reopening the old gate; otherwise remain blocked. Recover across every ACK/commit boundary using the same operation and receipts, never a fresh ID.

Processes, Monitors, children, Hooks, and in-flight tools pin startup cwd, contextRevision, configuration revision, and original binding. They do not migrate with the parent cwd. Initial W2 rejects changes while holds exist; any future coexistence must preserve independent contexts and must not mutate shared process.chdir().

## 5. Cold Restore and Invalidation (W1)

1. Read the authorized Session binding; verify Registry state, pinned Workspace generation, and trust. A generation change never silently upgrades an existing Session; migration needs an explicit contract.
2. Restore the original files and file-history manifest by workspaceStorageId, checking digests and unresolved executions. Never substitute an empty same-name directory.
3. Allocate a new Runtime binding/epoch, resolve root and cwdRelative, and validate symlinks, permissions, directory existence, and mount identity. Absolute-path changes require verified history remapping.
4. Restore the Harness private journal and resource closure, then install the same contextRevision/configuration/permissions. Open activation only after all required ACKs. Public Items/Snapshots cannot reconstruct private model state.
5. Unknown executions still query their original executionCallId/binding; a new Runtime must not replay their side effects.

Removed Workspaces, generation conflicts, missing volumes, path escapes, revoked trust, or incomplete receipts block execution with recovery_blocked. Authorized history/export and restricted original-execution query/cancellation remain available. Retain the cleanup owner while old processes exist; Registry replacement cannot redirect cleanup to a new Runtime at the same path.

## 6. Extensions and Child Tasks

| Capability | Binding rule |
| --- | --- |
| MCP / command Hook | Pin Workspace, contextRevision, cwd, and credential/configuration revision; rediscover/install for a new context, never reuse an old connection implicitly |
| Shell / Monitor | Persist cwdRef, contextRevision, and generation at launch; hold the original Runtime and query the original handle on recovery |
| child / worktree | Explicitly copy parent context into immutable launch input; independent worktrees get their own storage/Workspace binding; shared writes require serialization; parent cwd changes never affect child cwd |
| Channel | Route binding stores authorized workspaceId and target Session; messages, names, and UI selection cannot change ownership |
| Automation | Persistent mode uses the target Session's committed context; per_run pins Workspace/cwd in run intent. Delay admission during changing; retries reconcile the same run instead of using a new default |
| Sessionless Workspace operations | Use WorkspaceOperationGrant and Registry owner; never invent Session cwd or borrow a primary Session |

## 7. Storage and Version Compatibility

The [Workspace DDL](managed-agent-workspace-schema.mysql.sql) is an additive target against implemented Flyway V1/V2, not a replacement or rerun of the older overall target DDL. It adds Registry, Session binding fields, and a cwd operation ledger. Absolute paths never enter public SSE, generic logs, errors, or OpenAPI DTOs.

Existing Sessions remain empty/unbound. Backfill requires verified original deployment/configuration or binding evidence per Session and records its revision. Without evidence, allow reads and block execution; never overwrite history from the global configuration at upgrade time. Upgrade readers/writers and admission checks before enabling capabilities. Drain or fence old writers before multi-Workspace/cwd changes; unsupported rollback versions are read-only.

## 8. Delivery and Acceptance

| Stage | Deliverable | Exit |
| --- | --- | --- |
| W0: durable ownership | Registry/ACL integration, Session binding, create/BFF/query fields, Session-based Broker resolution | Two Workspaces cannot mix files/configuration/history/routing; omission and invalid paths fail explicitly |
| W1: restoration | Backfill, storage manifests, generation/trust checks, context installation ACKs | Restore the original cwd; mount changes need evidence; lost volume/generation/unknown execution blocks correctly |
| W2: controlled changes | cwd operation, CAS, cross-process installation, admission barrier, public event | Input/cwd races admit one side; lost ACK/crash queries the same command; background tasks never migrate |

W0 precedes multi-Workspace product access and H extensions, and can progress independently of P2 MQ/Outbox. Validate W1 with durable recovery. W2 does not block the fixed-cwd minimum runtime.

Acceptance covers cross-tenant invisibility; identical paths backed by different storage; realpath/symlink escapes and path replacement between checking and execution (revalidate at execution, using restricted mounts/handles where needed); changed defaults during idempotent retry; lost create responses; active/queued input versus cwd races; crashes at each installation/ACK/commit boundary; background cwd pinning; children with different cwd; standalone without primary fallback; deleted directory/volume with readable history but blocked execution; and mixed schema upgrades. Verify Java SQL, qwen journal, and Runtime receipts together; an API 200 alone does not prove restoration.

This documentation change was checked with an OpenAPI 3.1 validator, reference/operation uniqueness checks and 15 positive/negative payload examples. The target delta was applied after the actual V1/V2 migrations in a disposable MySQL 26.7.0 database, including legacy-row preservation, tenant FK, idempotency, revision, and receipt constraints. HTML was rendered at 1440 px and 390 px without page overflow. These checks do not validate W0/W1/W2 runtime behavior; fault and concurrency acceptance remains implementation work.
