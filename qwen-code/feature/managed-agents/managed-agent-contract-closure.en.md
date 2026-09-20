# Managed Agent admission, delivery and interaction contracts

[中文](managed-agent-contract-closure.md)

Status: HTML v1.10 target design; 2026-09-21. This document closes seven gaps found in the v1.9 review; it does not claim Java/Harness/Runtime implementation. Java still commits SQL before local SSE delivery; MQ provides notifications and asynchronous work. qwen remains the sole writer of private execution history.

## 1. Two admission profiles

| Profile | Durable boundary for accepted | Recovery |
| --- | --- | --- |
| `qwen_confirmed`: existing product `/sessions` compatibility entry | qwen has committed input + WakeIntent and its CommitReceipt has been saved; Java routing/idempotency metadata alone is insufficient | Query the original commandId after an ambiguous response; do not create another Prompt. An unverified original owner blocks progress |
| `java_durable`: target stage D `/v1/agents` and its BFF | One Java transaction stores idempotency, immutable input, Turn, control event and command delivery. HTTP 202 transfers delivery responsibility to the platform | Deliver a stable commandId and query the original commit. Saving qwen's receipt advances admission to `harness_confirmed`, not Turn completion |

Entry version and deployment capability fix the profile; a slow qwen must not trigger an early ACK fallback. Old clients retain their contract. New public `operation_id/admission_stage/delivery_state` fields are planned; advertise `durable_operations` only after fault tests. Missing fields do not mean Harness acceptance. Session creation 202 likewise proves only the declared admission boundary, not model execution.

Public creation also persists a `create_session` operation, exposed as Session `creation_operation_id`. Before the client knows a Session ID, resolve tenant/actor/create/idempotency key through a separate creation receipt; atomically save the new Session, operation and receipt. Never allocate another Session before resolving a retry. qwen creation and input use the same identity, with the creation receipt confirmed before input delivery. AgentDefinition writes retain equivalent actor-scoped idempotency in their own resource domain; legacy tenant-shared receipts cannot bypass authorization.

Java durable delivery transitions `pending → leased → confirmed`; transient failure may return to pending and ambiguous reconciliation becomes `blocked`. Claims use database time and monotonically increasing generations; confirmation must match the original claim. Save the original CommitReceipt only after a confirmed submission/query. Timeout, 404 and lease expiration alone cannot prove absence of execution. Reconcile a possibly committed old owner; never change commandId or Runtime to rerun it.

For input/cancel/action responses, operation `completed` means the command has its corresponding durable receipt. Turn completion, physical stop and final approval remain separate Turn, Execution and Action facts. Cancelling pending input serializes with its claim; if leased or ambiguous, retain cancellation intent, reconcile the input and submit cancel to the same qwen command domain. Do not merely remove the queue row. Close/delete first persist an admission barrier.

## 2. Batch delivery without a global maximum cursor

AUTO_INCREMENT/sequence allocation order is not commit order. If A allocates 1 but B commits 2 first, advancing a scan cursor to 2 skips A's later commit forever. `batch_offset` is only an internal locator/fairness ordering key. Never exclude unfinished work with `> last_batch_offset`.

Create `managed_agent_batch_delivery` metadata in the accept transaction, unique by `(tenant, session, batch, consumer)`; batch payload is stored once. Required tasks are `materializer:v1` in SQL mode, or `relay:v1` plus `materializer:v1` in MQ mode. Temporary SSE node subscriptions are not permanent required consumers. Source-only zero-event checkpoints create no delivery tasks.

1. In a short transaction, select pending or expired leased rows by state/due time with `FOR UPDATE SKIP LOCKED`; set owner/database-time lease and increment claim generation. Each scan examines all unfinished work with no persisted global lower bound. LIMIT bounds work, not correctness.
2. Perform MQ I/O outside the transaction. Relay may resend the same batchId; only durable publish confirmation permits done via CAS on owner, generation and unexpired lease. A stale ACK cannot finish a newer claim.
3. Materialization revalidates the claim in fixed Session → Turn if needed → Owner if needed → consumer progress → delivery → Item/Snapshot lock order. Existing V2 per-Session `covered_sequence` enforces a continuous prefix. Effects, progress and delivery done commit atomically. Covered duplicates are acknowledged without appending content; gaps require earlier pending work, never a watermark jump.
4. An MQ consumer claims the same materializer task. Late/duplicate notifications can ACK already completed work. SQL reconciliation can claim pending work despite lost notifications: MQ wakes workers, SQL records completion. Ambiguous/active leases require deferred redelivery, not premature acknowledgment of necessary processing.
5. Relay publishes per Session in public sequence order using a separate per-Session relay lease in extended V2 consumer progress. Lock Session before relay progress; the earliest unfinished relay task blocks later ones. Acquire this lease before delivery, following the fixed lock order, and commit the short claim transaction. After external sending, one confirmation transaction rechecks both generations/leases and completes the task. A stale claim can still send late; consumers must deduplicate/repair sequence gaps. FIFO does not replace this check.

A delivery-only claim transaction must not subsequently acquire Session locks; release it before starting materialization. Per-Session relay claims use the full order above. Blocked tasks remain visible and recoverable; dead-lettering never means done. Adding a required consumer needs an initialization barrier: fixed Snapshot plus protected tail, progress and tail tasks, then a consumer-set-version switch under the same Session lock used by acceptBatch. A configuration edit cannot imply existing tasks for old batches.

GC requires expired window, content-complete Snapshot, all required tasks done and no reader/recovery pins. Before deleting payload, atomically retain batch identity, digest, source cursor and sequence range in a compact receipt. Delete receipts only after the promised retry horizon: batch R starts at initial acceptance; command/tombstone retention lasts at least R after terminal settlement, and unsettled commands never expire. Reject/reconcile out-of-window retries; absence does not prove nonexecution. Receipts deduplicate but cannot restore payload.

## 3. Approvals and user questions

The [OpenAPI](managed-agent-public-api.openapi.yaml) adds planned Session routes `GET actions`, `GET actions/{actionId}` and `POST actions/{actionId}/responses`, with BFF `actions/query`, `actions/get` and `actions/respond`. On reconnect, fetch pending Actions and then events; notifications are not the only pending-action source. Bind each Action to its original Turn/Invocation or non-tool operation, never a browser callback identity.

Public Actions are closed permission/question DTOs with bounded options/questions. Responses only select original option IDs or answer original question IDs; arbitrary tool payload, configuration or policy overrides are forbidden. Permission choices come from the original arbiter rather than client-defined allow/deny enums. Validate required answers, nonduplicated question IDs, option membership, single/multiple choice and free-text eligibility on the server. These are sanitized projections without raw execution arguments, absolute paths, credentials or internal optionsRef values.

Responses carry `input_revision/policy_revision` and an idempotency key. Java persists a command operation and forwards it to the original qwen `resolveAction`. Revalidate the actor's responder eligibility before looking up a replay receipt; a new response must match versions, deadline and requested state. Same key/different content is 409; competing different keys are serialized by the original arbiter's CAS. A recorded vote yields `vote_recorded`; a final decision yields `decided`. Completed operation does not imply final Action decision. Only its final receipt can create WakeIntent or release tool execution.

Cancellation, expiration and the final vote serialize at the same Action authority. Late responses return `action_expired/action_cancelled/action_already_resolved`; a successfully committed original retry returns the original result and current Action view. Forwarding timeout remains pending/blocked and queries by commandId; no auto-approval, policy substitution or recreated Action. Existing local-only and multi-vote rules still apply; administrator status does not bypass them.

## 4. Workspace wiring into private protocols

Negotiate `managed-context/1` for wrapper fields without mutating strict Tool v2 / InvocationContextV1. The new control envelope carries `ContextBinding`: `workspaceId/workspaceGeneration/storageId/contextRevision/contextConfigRef/contextDigest`, additionally bound to `runtimeBindingId/runtimeGeneration` and Harness owner generation at execution. Trusted connections and ledgers establish identity; supplied fields only support equality checks.

| Location | Required evidence |
| --- | --- |
| ActivationGrant / RunnableGrant | Committed ContextBinding, config installation receipt, original epoch and enable ACKs; gates open only when all match |
| InvocationBinding wrapper | Frozen ContextBinding digest, Runtime incarnation and original invocation ID; inner tool payload cannot override cwd |
| config_install stage/enable | cwd operationId, expected/target context revisions, target config ref/digest and both installation receipts; reuse `config.bound/domain.committed`, no second config authority |
| Runtime/Harness receipt | commandId, operationId, ContextBinding digest, receiving incarnation/generation, installed revision, result and durable commit identity; idempotent reuse requires the same command and digest |
| journal/checkpoint/RestoreBundle | config_install domain facts and exact ContextBinding/committed operation receipt references; verify storage, generation, config and installation evidence before activation |

Java owns product Workspace/cwd metadata; qwen owns installation facts and execution history. `contextRevision` is distinct from config version, workspace generation and activation epoch. W2 first seals input/resource admission and persists the target operation, then drains idle stdio MCP connections before installation. Active MCP calls/unsettled receipts are hard blockers; a purely idle connection is drainable and cannot permanently prevent reaching the drain step. For a shared pool, detach only this Session's idle reference; never close a connection still used by another Session. A new binding uses the new context key. Failed/ambiguous shutdown blocks progress. Long-lived processes, watchers and background jobs cannot be relabeled idle connections for automatic migration. Reopening after failure requires verified rollback receipts; do not release the Workspace write lock before context validation.

## 5. Migration, mixed versions and rollback

Current source has V1 core tables plus V2 Item/Part/latest Snapshot/per-Session consumer progress. The former v1.6 target SQL used incompatible same-name tables and must not run as another V2. The revised [storage delta](managed-agent-storage-schema.mysql.sql) follows actual V1/V2, preserves existing tables, adds immutable `snapshot_version`, batch/delivery/receipt/owner and extends progress leases. Then apply the [Workspace delta](managed-agent-workspace-schema.mysql.sql) and [command delta](managed-agent-command-schema.mysql.sql). These are design SQL, not registered source migrations; assign future Flyway versions from the implementation branch's actual migration tail.

| Stage | Fresh installation and upgrade | Rollback boundary |
| --- | --- | --- |
| Expand | Fresh installs apply V1/V2 first; upgrades verify applied checksums before deltas. Keep old tables/events | Old binaries remain usable with all new capabilities disabled |
| Reader first | Read both storage_version=1/2; support command/context gates; drain/fence old writers | Never route new Sessions to old-format-only writers |
| Backfill | Old Sessions remain version=1/context unbound. Seal each writer, record fixed H, rebuild stable Items from original inputs/events, build snapshot_version with verified contents/digest and check V2 progress ≤ H without gaps | On failure retain old path; never guess cwd or renumber public events |
| Cutover | Under Session lock commit baseline Snapshot/H, required consumer set and storage_version=2; new batches start at H+1. Isolate per-Session routing and exclude old writers | Sessions with accepted batches cannot directly downgrade to event-row-only binaries; stop writes and retain a compatible reader |
| Contract / GC | Clear observation/rollback windows and remove old clients/readers before retention-based old-event GC | Deletion is irreversible; restores validate commands, events, Workspace manifests and receipts together |

Do not enable batch GC for version=1 Sessions, or use a mutable V2 latest snapshot for immutable pagination. Backfill does not republish historical MQ or reexecute tools; new materializers start at the baseline watermark. Before enabling java_durable, Java restart must recover delivery using SQL operations plus original qwen command queries alone. W0/W1/W2 and P2 have separate gates, but Workspace writer fencing precedes all multi-Workspace access.

## 6. Identity, authorization and Session lifecycle

Production requires trusted `(tenantId, actorId)`; the gateway removes browser-supplied identity headers and injects verified identity. Workloads separately use mTLS/service identity. The two OpenAPI headers describe an internal trust boundary, not browser authentication with arbitrary strings. Every query and idempotency replay rechecks current authorization; the unique idempotency domain includes tenant/session/operation/actor/key, preventing cross-actor receipt replay.

| Role/source | Product permissions |
| --- | --- |
| Session reader | Lists/history/events/sanitized Actions/operations, subject to Workspace and Artifact ACLs |
| Session operator, including reader | Input/cancel; approval separately requires original Action responder eligibility; no direct config changes or release of others' resources |
| Session owner or authorized administrator, including operator | close/archive/delete/cwd, still constrained by Workspace permissions and lifecycle/config gates; no implicit tool approval |
| Channel/Automation service principal | Fixed Session/purpose/delegated-actor scope; no inherited tenant-admin rights or fabricated user votes |

Single-user smoke deployments may map a trusted actor to the sole Session owner. Same tenant does not grant production users mutual read/write access. Return 404 for unreadable resources; use 403 for readable resources with insufficient mutation permission. Apply ACLs to lists, streams and revocation during a subscription; revoke the stream when authorization is lost, not just at connection setup.

Public `POST .../close` seals input, follows existing ordered cleanup and reaches closed. `POST .../archive` accepts only closed Sessions, marks them archived in lists and retains readable history via include_archived. `DELETE session` creates a durable deletion operation: seal admission, cancel/settle, run lifecycle Hooks, transfer/release resources, then clear Session content. Unsettled execution remains blocked. It never deletes shared Workspaces, other Sessions or held/shared Artifacts. Retain an authorized, policy-bounded tombstone/operation for original command queries after deletion. cwd/close/archive/delete share operation lookup while execution ledgers may remain separate tables; retain the physical Session row until tombstone/command retry horizons expire to avoid cascading receipt loss.

unpin is a client presentation preference, not close or Runtime release; no new execution API is introduced. Existing recovery/lifecycle contracts still define cleanup order; new routes cannot bypass Hooks or original-execution reconciliation.

## 7. Capacity, retention and acceptance gates

These are executable development/staging starting values. Production must explicitly configure them after measuring concurrency, average/peak bytes, index and replica costs. They are not proven throughput or SLO claims.

| Parameter | Development/staging starting value | Constraint |
| --- | --- | --- |
| Text batch | First fragment immediately; then 100ms or 64KiB | Flush before control/terminal events. Oversized single events use Artifact or explicit rejection, not unbounded exceptions |
| Public replay W / command retry R | 1h / 24h | Explicit production values, R ≥ W; receipts/idempotency/tombstones live at least R. Unsettled operations are not TTL-deleted |
| Range reader lease | 60s, renewable, at most 5min per read | Expiration means reset/restart, never bypassing GC. Large histories use stable Snapshot pagination |
| Claim lease | 30s, renewed every 10s | Database time, stale ACKs rejected; long batches renew or stop committing |
| Materializer lag | Warn at 60s; stop new input at 5min | Age of oldest necessary pending acceptedAt, not maximum offset. Reopen only below 30s continuously for 60s |
| Log budget | Environment-specific budgetBytes; warn 70%, stop new input 85% | Reserve the larger of 15% and maximum in-flight output. Do not enable an underbudget environment or TTL-delete pending work |
| Pins | Reader expires; investigation/recovery pins have owners, review deadlines and capacity alerts | Unresolved recovery is not deleted on timeout; stop work if needed instead of silent unlimited accumulation |

Above stop thresholds, reject new Prompts/automated work with 429 + Retry-After, preserving reads/cancel/recovery and reserving capacity to settle accepted work. If reserves also approach exhaustion, pause source consumption only with verified source replay; otherwise deployments need bounded cancellation/blocked handling and must not claim losslessness. DDL expires_at is earliest GC eligibility, never a substitute for Snapshot/task/pin checks.

Implementation exits: (1) no missed late commits, stale claim ACK rejection and duplicate-safe materialization; (2) both admission boundaries, restarts/lost ACKs/cancel races; (3) permission/question votes, expiration/reconnect/role revocation; (4) crashes at every context installation step, idle MCP drain and active-call blocking; (5) real V1/V2 upgrade, fresh/mixed-version/read-only rollback; (6) distinct close/archive/delete semantics; (7) capacity/lag/pin admission stops and verified recovery. Implement 1–3 first, then 4–5; complete 6–7 before production access.

Document validation (2026-09-21): OpenAPI 3.1, reference/uniqueness checks across 35 paths, 39 operations and 84 schemas, and 40 positive/negative DTO cases passed. Temporary MySQL 26.7.0 databases applied all three deltas after fresh V1/V2 and populated V2, checking preservation, late-commit tasks, claim fencing, idempotency scope and GC receipts. HTML rendered at 1440px/390px without page overflow. SQL fragment checks are not adapter or multi-node E2E proof; full materialization, Runtime/Hook/authorization behavior and MySQL 8.0/PostgreSQL version matrices remain implementation acceptance work.
