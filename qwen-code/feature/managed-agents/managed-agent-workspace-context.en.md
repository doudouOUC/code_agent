# Managed Agent Workspace and Session cwd Contract

> **v1.10 clarification:** [Contract closure](managed-agent-contract-closure.en.md) section 4 binds context installation to private envelopes and receipts. Idle MCP connections are drainable after sealing admission, not hard blockers before the drain step. Runtime reclamation still treats an open connection as a hold. Section 6 adds actor-scoped authorization/idempotency; apply the command SQL delta after this Workspace delta.

[English](managed-agent-workspace-context.en.md) | [简体中文](managed-agent-workspace-context.md)

Status: v1.12 target design, not implemented. Date: 2026-09-21. Refines W0 Workspace selection at Session creation on top of v1.9 ownership and v1.10 private wiring. Supplements the [HTML architecture](managed-agent-dual-path-architecture.html#workspace-context), [public contract](managed-agent-api-contract.md), and [extension runtime](managed-agent-extension-runtime.md). This update changes the design and planned OpenAPI; it reuses the existing target DDL and does not enable multiple Workspaces or Session cwd changes in Java.

## 1. Verified Baseline and Scope

The original source baseline is `feature/managed-agents-p0-p8@2695220a3a`. This update rechecks P3 `34ea187c628c` and P2 `c0905b2c3b`; the Workspace gaps below remain. The daemon WorkspaceRegistry distinguishes registered workspaces and Session owners. Ordinary Session creation, restore, history, and `/session/:id/cd` retain their existing routing restrictions. Hosted APIs do not inherit local primary fallback or expand Legacy `/cd` support.

Java CreateSessionRequest, PublicSession, and managed_agent_session have no Workspace binding. EmbeddedRuntimeBroker resolves one global workspaceCwd/workspaceId/workspaceGeneration at startup and uses it for all Sessions. RuntimeScope carrying a directory does not make Session ownership durable. qwen Authority records cwd in its private journal, but cannot replace Java admission and Workspace authorization. The current implementation supports one statically configured Workspace.

Workspace creation, clone, worktree creation, migration between Workspaces, and standalone scratch allocation are outside W0. W0 uses administrator-registered, authorizable Workspaces. W2 changes cwd only within the same authorized filesystem scope.

The frontend `java-managed-agent-provider.ts` sets `acceptsWorkspaceCwd: false` and sends no Workspace on creation; only the local daemon Provider sends cwd. `managed-runtime-worker-bootstrap.ts` also requires the Worker workspaceId to equal the canonical cwd's local hash. W0 must connect UI, Java, Harness, and Worker together; a directory field alone or placing an opaque Hosted ID into the old boot field is insufficient.

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

### 3.1 Creation Form and Selection Rules

The new-Session form shows Agent, a Workspace selector, an optional working-directory field, and Prompt. The directory defaults to `.`, with `services/api` as an example. Initially use relative-path text input, without a remote file browser or starting a Runtime to populate the selector. Display names and short IDs; disable visible Workspaces that are unavailable or do not permit creation. Creating requires an explicitly selected, creatable Workspace.

Preserve the user's current choice, otherwise use the server's explicit default. Reconcile with current authorized results; never pick the first page item or infer a default from a single result. Initially do not automatically reuse recent directories from other Sessions or accounts. Without a default or choice, show “Select a workspace”; without any creatable Workspace, show an empty state and retain the draft. Listing failure, authorization failure, and an unsupported old service are distinct states, never reasons to silently switch to a default directory.

Changing Workspace resets the child directory to `.` and asks the user to confirm it; never carry project A's child directory into project B. Explain beside the form that Sessions in the same Workspace share files. Independent copies belong to future worktree/clone support.

On send, freeze `agentId + workspaceId + cwdRelative + input + idempotencyKey` into the existing pending-create record. Network retries and reloads use that exact payload and key, not the current selector. Retain a “Confirming creation” state while the outcome is unknown. Use a new key only after definitive non-acceptance or an explicit user decision to abandon the request and create another Session, explaining that the original may still complete. On success, show the server-returned Workspace and relative directory in the header. Sidebar Workspace changes affect lists/new drafts, never an existing Session. W0 exposes no directory editing for existing Sessions.

### 3.2 Discovery Before Creation and API Example

Reuse `GET /v1/agents/workspaces` and BFF `POST /api/agent/web-shell/v1/workspaces/query`. Add list-level `capabilities.workspace_context` (BFF `workspaceContext`) so clients can discover creation support before a Session exists. Return true only when the service, Harness, Broker, and Worker support the complete W0 contract. A missing field or explicit unsupported response disables the entry; network/authentication failure is not unsupported. Session queries independently report their capabilities; upgrading the service does not make old unbound Sessions executable.

Each item adds `can_create_session` (BFF `canCreateSession`), an actor-specific permission hint; submission still validates Agent/config compatibility. Add `default_workspace` (BFF `defaultWorkspace`), a descriptor of the same shape or null. Return an object only for an explicitly configured, active default on which the actor can create. Include it even when it is outside the current page, allowing a definite default selection. Neither pages nor default descriptors expose mount paths, storageId, or policy rules. Bind cursors to tenant, actor, and query parameters; recheck ACLs on every page.

Public creation reuses `WorkspaceSelection`, for example:

```json
{
  "agent_id": "code_agent",
  "input": [{ "type": "input_text", "text": "检查 API 模块" }],
  "workspace": { "workspace_id": "ws_project_a", "cwd_relative": "services/api" }
}
```

The BFF maps this to `workspace: {workspaceId, cwdRelative}`. Do not use `environmentId` or the local Provider's absolute `workspaceCwd`. Add a distinct Hosted Workspace selection type and listing capability to `ManagedAgentProvider`; the existing `acceptsWorkspaceCwd` continues to describe local-path support only. The Java Provider must transmit the selection through generated DTOs, never drop it silently.

After HTTP acceptance, querying the Session should return `workspace: {workspace_id: "ws_project_a", cwd_relative: "services/api", context_revision: 1, state: "ready"}`. Ready means the logical binding is committed; the environment may still be provisioning. Show “Session created” separately from “Preparing tool environment”; this is not Runtime readiness. Errors are:

| Timing / condition | Result |
| --- | --- |
| No choice and no usable default before creation | `400 workspace_required`, without creating a Session |
| Invalid path syntax | `400 invalid_cwd`, without creating a Session; an empty string is not `.` |
| Unknown or unreadable Workspace | `404 workspace_not_found`; readable but not creatable returns `403 workspace_forbidden` |
| Draining/removed resource or unavailable configuration snapshot | `409 workspace_unavailable`, without creating a Session |
| Unsupported W0/private protocol | `400 unsupported_feature`, without default-directory fallback |
| Same key with different selection/input | `409 idempotency_conflict`, without a second Session |
| Missing directory, mount failure, or identity conflict discovered after durable admission | Retain the original Session/creation receipt; mark Session context recovery_blocked and record typed failure on the relevant Turn/installation operation. Keep the tool gate closed; never rewrite a completed creation receipt or execute in another directory |

Omission is distinct from explicit null: only an omitted object permits default resolution; null and empty objects are invalid. Preserve valid spaces and case instead of trimming filenames. Use `/`; reject absolute paths, drive prefixes, backslashes, NUL, and `..` segments. Normalize repeated separators and `.` segments into one logical form. JSON values are not URLs and receive no extra percent decoding. Runtime still checks existence, realpath, and substitution at execution.

### 3.3 Atomic Binding, Defaults, and ACK

1. Validate trusted actor, endpoint Profile, and request syntax. Hash the normalized caller payload, using a fixed omission marker when Workspace is absent; do not resolve a new default Workspace or latest Agent revision whenever computing the request digest.
2. Look up the original creation receipt within tenant/actor/create/key and recheck the actor's current access to its Session. If present, compare the original request digest and return the same Session/operation. Subsequent execution uses the original binding and current authorization, not a newly resolved default.
3. On first admission, resolve the explicit Workspace or tenant default; validate creation permission, Agent/Bundle/config compatibility, generation, storage identity, and allowed roots. Lock Registry → Session and commit Session, pinned Workspace/config/revision, creation receipt, and `create_session` operation in one transaction. Unique constraints converge concurrent identical keys; a losing transaction sends no side effects to Harness or the scheduler.
4. The closed operation payload stores the resolved binding and exact configuration reference, never “resolve the default later.” Deliver the same Session ID and logical context to Harness; deliver input only after qwen's creation receipt. Reuse v1.10 delivery/receipt semantics without another queue or command ledger.
5. A `java_durable` 202 still means Java assumed durable delivery responsibility; `qwen_confirmed` still waits for qwen's original command receipt. Neither waits for Runtime readiness or changes its ACK boundary. Query the original command after timeout; directory preparation failure cannot dispatch the same Prompt under a new Session ID.

Reuse Session columns from the Workspace delta and creation receipt/operation from the command delta. Selector capabilities, permission hints, and default descriptors are computed views without new columns. Initially adapt Registry from controlled deployment configuration or a product directory, resolving defaults from existing tenant configuration. Do not add a public API for registering arbitrary server paths. `QWEN_MANAGED_AGENT_WORKSPACE_CWD` can explicitly register a default Workspace in a compatible deployment; it must not overwrite bindings on every creation or restoration.

### 3.4 Harness, Broker, and Worker Wiring

Harness stores its journal in its own service directory. The model loads immutable bound Bundle/contextConfigRef, and logical-directory context comes from the Session. Model-first execution uses published configuration only. If directory-derived configuration is unpublished, reject admission or remain preparing; never substitute configuration read from the Harness host. Do not switch multiple Sessions through shared `process.chdir()`.

Replace the global cwd captured by `EmbeddedRuntimeBroker` with a Session resolver that reads durable workspaceId/generation/storageId/cwdRelative/config revision. A storage resolver uses registry storage identity and placement domain to resolve a local root or authorized PVC/mount. Kubernetes claims and local roots never come from browser parameters. Compute `effectiveCwd = verifiedMountRoot + cwdRelative`; validate directories, symlinks, permissions, and mount identity during Worker installation and at tool boundaries.

Existing Worker boot v1's `workspaceId = hash(canonical cwd)` is distinct from the opaque Hosted Workspace ID. W0 negotiates `managed-context/1` and a new strict boot-envelope version, distinguishing public Workspace/storage identity, mount root, effectiveCwd, and the compatible local path-hash alias. Do not add fields in place to old boot/Tool v2. The ContextBinding digest covers logical cwd and pinned configuration; Runtime attestation, InvocationBinding, history roots, and installation receipts validate that same binding. Old-boot-only peers reject W0 before side effects.

Configuration instances and tool cwd use effectiveCwd. File history and Workspace write coordination use the stable Workspace root and storage identity. Cwd is the tool's starting directory, not a new security boundary; file access remains constrained by authorized Workspace roots and policy. Session-exclusive Runtimes may still share files. Reuse the ordinary-tool Workspace turn lease from the initial snapshot through all tool settlement and history commit; process isolation does not establish file isolation. Separate per-process memory locks cannot protect writes across Sessions.

Logical `context_state=ready` does not prove physical installation. Runtime initialization/first prepare returns the binding digest, contextRevision, generation, and installation receipt; the existing activation gate validates these before tools run. Late old receipts cannot open a new binding. Initial installation uses the original create operation and revision=1; later directory changes use W2 changing/CAS.

### 3.5 Minimum W0 Recovery

W0 must reload the same binding after Java restart and recreate a cleanly reclaimed Runtime against the same available durable storage and directory. W1 adds fuller historical backfill, mount-relocation history mapping, and disaster recovery; W0 cannot therefore keep directories only in memory. Default changes, sidebar selection, or Harness restart never rebind an old Session.

A missing directory/volume, changed generation, or revoked authorization blocks execution; authorized history remains readable. W0 never mkdir/clones an empty project to claim recovery or silently switches to the Workspace root. After infrastructure repair, reconcile the original operation/binding. Use a new Session to choose another Workspace or change a logical cwd while switching remains unsupported. Unknown tools still query their original executionCallId; recreating a Runtime cannot replay their side effects.

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
3. First recover the original binding through P3 reconcile/attest. Allocate a new binding/epoch only after proving the old resource safely settled and released with no unresolved execution, never merely because Java restarted. Resolve root and cwdRelative; validate symlinks, permissions, directory existence, and mount identity. Absolute-path changes require verified history remapping.
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

Implement W0 in these verifiable slices. Enable list and Session `workspace_context` only after all pass:

| Slice | Scope | Minimum evidence |
| --- | --- | --- |
| W0a: binding contract | Generated OpenAPI DTOs, Registry/ACL/default resolution, versioned ContextBinding and boot | Equivalent public/BFF behavior; invalid selections and incompatible peers rejected |
| W0b: durable creation | Atomic Session binding plus creation receipt/operation, original-key recovery, explicitly unbound old Sessions after migration | Lost responses, concurrent keys, changed defaults, and Java restart retain bindings |
| W0c: execution directory | Session-based Broker resolution, isolated Harness configuration, Worker prepare/attest and Workspace turn lease | Real Read/Write/Shell use two Workspaces and child directories correctly; shared-Workspace writes serialize |
| W0d: WebShell | Selector, relative directory, default/empty states, frozen pending-create, Session location display | Reloads preserve retries; old services never silently drop fields; sidebar changes do not rebind Sessions |
| W0e: recovery and rollout | Original-storage recovery, invalidation blocks, old-writer fencing, compatible Profile ACK | Clean reclamation/restart resumes the same directory with no repeated tool execution; advertise capability only after full-chain proof |

Additional W0 acceptance: a default outside the current list page remains visible; unauthorized entries do not leak; unsupported service, request failure, and no Workspaces have distinct UI states. Bind Session A to project A's `services/api` and Session B to project B's root without mixing files/configuration. Different cwd values in one project never mutate shared process configuration. With a 15-second Runtime delay, model output using published configuration still begins first. Physical-directory validation failure allows no tool execution. Cross-actor idempotency, post-selection revocation, retry after default changes, and UI changes during unresolved creation retain original ownership.

Acceptance covers cross-tenant invisibility; identical paths backed by different storage; realpath/symlink escapes and path replacement between checking and execution (revalidate at execution, using restricted mounts/handles where needed); changed defaults during idempotent retry; lost create responses; active/queued input versus cwd races; crashes at each installation/ACK/commit boundary; background cwd pinning; children with different cwd; standalone without primary fallback; deleted directory/volume with readable history but blocked execution; and mixed schema upgrades. Verify Java SQL, qwen journal, and Runtime receipts together; an API 200 alone does not prove restoration.

Historical v1.9 documentation checks passed OpenAPI 3.1 validation, reference/operation uniqueness, and 15 positive/negative payload examples; the delta was applied after V1/V2 in a disposable MySQL 26.7.0 database, and HTML was rendered at 1440 px/390 px. Those records do not cover this v1.12 revision. V1.12 passed OpenAPI 3.1 validation, 20 positive/negative schema examples, bilingual structure/examples, and link/HTML structure checks. Schema checks do not establish directory or authorization behavior. Database structure is unchanged; this update did not rerun historical MySQL/product E2E or claim new browser-rendering verification. W0/W1/W2 fault and concurrency acceptance remains implementation work.
