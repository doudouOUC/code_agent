# Managed Runtime Broker JDBC Persistence

## Current Native Recovery and Layout, 2026-10-21

Main `6e6598e35c3c` now includes the earlier #14487/#14523/#14599; their W42 open heads below are historical observations. [#14695](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14695.md) retains one original no-deadline input/batch and the installed successor writer/activation fence. Same-source SQL verifies every original SETTLED member, grant/intent/checkpoint/input/definition and result before missing receipts/messages are repaired. Each input/definition/result/authorization byte block is bounded to 64 KiB, and the whole response to 8 MiB. Repair dispatches no tool; a fully proven output_committed assistant/route/history/results_ready tail is consumed without another model call.

[#14710](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14710.md) keeps one Maven module/deployment while moving the SQL aggregate to managedagent.persistence, business services to their owning packages and shared model/exception types out of api. Broker provisioning/transport/security are separate. Main is V1–V14; [#14698](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14698.md) V12/boot6 and SETTLING/FROZEN/CUT/DRAINED are merged. Original inventories, worker observations and independently verified saved CUT do not establish physical Pod/PVC deletion. No source/database/CSI/deployment gates ran in this documentation task; legacy catalogs still need a separate migration, never history repair.

[#14758](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14758.md) ends as documentation of the trusted-platform resident path and its acceptance boundary; its former node-evidence candidate was withdrawn. [#14761](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14761.md) is closed unmerged, so its offline-install/cold-boot paths are not on main. The redesigned [#14765](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14765.md) independently adds explicit idle resident maintenance: current OWNER, configuration/registration/protection, original READY shared binding/slot/RESERVED owner, and no live Session/writer, unreleased Runtime Session or unsettled tool. A transaction saves the V14 original plan and seals Workspace/binding DRAINING. The CLI starts no service, worker or migration. Before deletion it rechecks original Pod UID/spec/container, Ready node and resourceVersion; a durable UNKNOWN attempt precedes a preconditioned DELETE, once per version and at most eight attempts. Bounded responses retain the original claim fence. Lost replies, HTTP 2xx/404 or object absence never clear storage ownership, establish RELEASED or authorize replacement/cross-Workspace reuse.

[#14764](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14764.md) adds V13 references to the original cleanup descriptor/binding/generation and head-history coverage. Only matching confirmed evidence removes a reference; uncovered old history protects the original Runtime. Main is canonical V1–V14 with 32 business tables. Legacy catalogs need independent migration, never history repair. Keep software/H2, MySQL, independent-process and ACK evidence separate; none of those gates ran in this read-only documentation verification.

> Historical delta, 2026-10-13 (current status is in the October 15 section below): #12692 merged Spring/Flyway wiring; #12865 uses durable host/boot/process identity beyond the old owned map, with trusted reboot/operator cleanup in #12869/#12977. #13289 merged experimental CSI/persistent ACK foundations. In this snapshot #13642 was open at `5832d8824a31`, with V69 retention indexes, DAYS maxAge, MILLIS scanDelay and a 1ms minimum maxAge. The original background_shell process row remained protected while its child_run was unsettled. V68 async verification was merged; the old migration collision was resolved, but cleanup stayed off pending writer lock upgrades and separate Hosted cleanup release-proof validation. #13673 merged original Hook drain/stop/holder recovery. The September 27 delivery note below is historical.

> Private CSI boundary: closed [#13893](../../weekly-report/2026-10-05_2026-10-11/implementations/pr-13893.md) rejects private file profiles across local-process create/adopt/register/observe/confirm/release/operator paths; it is not merged support. Similar guards appear in merged [#13899](../../weekly-report/2026-10-05_2026-10-11/implementations/pr-13899.md), whose separate v5 file worker checks original input/readback/history identity but always returns BLOCKED drain and retains backups. This worker diff does not establish complete Java/Hosted native/readback wiring, production CSI deletion or cross-owner recovery.

> Weekly additions: #13642 indexes execution-lease references by `(binding_id, runtime_generation)` in Flyway and idempotent JDBC setup. #13899 preflights the 100-snapshot/64-KiB history-envelope capacity before prepare. A failed prepare with changed or unprovable effects marks historyFailed and rejects subsequent writes/queued snapshots; only identical before/after observations permit same-reference retry. Ordinary read-path refusals do not automatically fence the mount. Partial/cancelled writes attempt file rollback against the original inode; failed rollback retains aggregated faults. Seal also closes executor admission, while drain stays BLOCKED. This is not whole-call atomic rollback or physical deletion; source/CSI gates were not run here.

Final merged #13899 excludes prepare/execution overlap without retiring the Session for timing refusals. Scoped new files/directories request 0600/0700, existing mode is preserved; only successful rollback of the exact cancellation reason restores availability. ENOSPC/storage failures still fence after bytes are restored. Ordinary Write retains pre-write errors. Boot6 CUT/finalization and full native control-plane wiring remain in open #13526, not this merged boot4/5 worker.

[English](managed-runtime-broker-jdbc.md) | [简体中文](managed-runtime-broker-jdbc.zh-CN.md)

#13642 is merged; the main guard deduplicates background owners by raw Session value and binary identity before indexed projection lookup. This is conservative Session-level protection, not Hosted cleanup release-proof qualification: owed descriptors can outlive RELEASED bindings and must retain original-release verification. A merge, writer lock upgrade or documentation update alone cannot enable retention. H2/MySQL settled-Shell and folded-owner tests were not run here; its creation week remains W41.

## Final private authority and new-database baseline, 2026-10-15

Merged [#13996](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-13996.md) provides final SQL/native authority; main `79362c2ecc21` now has canonical V1–V10, including V3 immutable Session-list keysets and later Workspace/model/approval, SSH/Turn-operation/shared-index changes. `WorkspaceCsiRuntimeAccess` locks original Session/binding after placement/retention in a fresh same-source transaction, then verifies registration, READY generation/lease/seed/handle/context. Native authentication checks both seed/lease tokens; comparison references come from authenticated native readback. Journal transactions verify genesis/first writer/activation/finite batches/results. Resource-read intentions use ma_request_receipt and delivery uses ma_read_lease, with final identity/byte checks. Generic private cancel/close/delete, release/finalization and true CSI deployment remain outside this qualification.

`V2__private_csi_authority.sql` extends only request key/generated csi_guard/index, first activation and native authorization; the business table count remains 32. Old V68/V69 and CSI branch V69-V72 are legacy/historical numbering, not deployment steps for current V1/V2. Broker initialization of a verified V1 catalog without history is distinct from application Flyway V2 migration; old collision notes do not qualify current catalog/CHECK/lock-order gates.

Merged [#14081](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14081.md), final head `d4ee6e1dbdba`, inherits merged authority/catalog. Old stacked validation does not qualify the final integrated version. Private attach/text/history pins UUID/writer/activation and fresh admission; text only, lease loss blocks, stopLocal neither seals nor releases. It adds no file toolTurn/finalization/public selector/cold writer replacement, and process-local deduplication does not establish cross-boot replay.

Merged [#14069](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14069.md) supplies the fresh-database 32-table baseline. System/missing catalogs are rejected before DDL and MariaDB CHECK enforcement is required; exact catalog/column/key/index/check/FK validation precedes baseline/migrate. Typed receipt/work preserves separate Runtime generation, Session head, operation claim/read lease. Snapshot read views cannot fake lease renewal; see the [storage/event design](managed-agent-storage-event-architecture.md). Component, MySQL, OSS/CSI and deployment gates were not run here.

Merged [#14180](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14180.md), final head `0b92ddcd49e3`, walks only private schema2 preparation: a prepared record's intentRef equals its predecessor and must re-admit it in this transaction. It does not generically walk top-level previousRecordRef for bind/result records, and rejects malformed JSON. Its real SQL/native/worker/history fixture explicitly maps placement/mount/proc-fd on every platform; it is not native CSI deployment.

Merged [#14185](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14185.md), final head `010664ddba0e`, changes V1/V3 timestamps to epoch-ms/UNSIGNED/gmt fields with typed Time/Rows/Projection, retaining actor bytes and immutable gmt_create list keysets. Terminal collectors use NEVER_DUE_MILLIS=9007199254740991 rather than zero/negative values that become due or violate signedness. Main now uses this shape, but no versioned upgrade for existing DATETIME catalogs is supplied. Never repair history to bypass checksum/shape rejection. Old open SQL fixtures and other branches need integration against this shape; merge status does not establish a compatible migration or passing database tests.

### Final SSH Original-Resource Boundary

Merged [#14318](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14318.md), final `1a32fe4dbc47`, selects ssh-process only from trusted SSH_LOCAL storage. Registration uses a separate workspaces/register route and V7 after V6, database-ms/gmt fields and canonical physical keys. A pre-claim out-of-transaction cwd/marker probe leaves no holder on deterministic refusal; unknown post-claim installation retains ownership. Routing dispatches by saved kind/seed/handle without local fallback. Forwarding changes only the send address, not the saved lease. Atomic no-overwrite launch/never-start claims, worker-published PID and retryable startup-close pending distinguish proven pre-spawn failure from uncertain startup; neither authorizes a replacement.

Strict stop verifies original generation/provisionRequest/incarnation/lease/retirement cleanProof and process exit before creating RuntimeDrainReceipt. Limited original not_started/capture:null publication/ACK recovery does not authorize UNKNOWN replay. The former V4 collision is resolved by current V7 numbering, not by repairing applied history; combined upgrades/checksums still require qualification. Default off, only /1 files and foreground Shell; this documentation run executed no SSH/MySQL/remote publication gates. Reported macOS loopback/component results do not qualify Linux, cross-machine or full deployed acceptance.

### Merged Shared Ownership and Resident Files, 2026-10-17

Merged [#14339](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14339.md) fences precisely selected shared local managed bindings by the persisted Runtime Session/execution Harness owner, not the binding isolation key. Storage/physical fences and Session drain checks remain; a missing shared Session cannot mint a cleanup tombstone. This slice did not enable sharing; later #14435 adds separate opt-in configuration, not arbitrary provider sharing or idle retirement.

Merged [#14340](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14340.md) separately wires explicit resident CSI/files mappings. One unfinished public Session and one revocable Read/Write/Edit context use the same original Pod/PVC. Workspace-row locking prevents overlap; logical close settles original work and releases the exact owner, retaining READY binding, generation and RESERVED physical storage. Uncertain release blocks handoff; missing/replaced/restarted Pods remain unavailable. No physical release, volume reuse, collector, Shell/MCP/Hook or automatic replacement is added. H2/boot-2 same-JVM fixtures and older ACK evidence do not qualify current CSI deployment; no source/deployment gates ran here. Current Java sources/tests are under packages/managed-agent-server after merged #14277; SDK remains under sdk-java/qwencode.

### Public Workspace Residency and macOS, 2026-10-18

Merged [#14435](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14435.md) adds bound-session-isolation-class, default session; explicit workspace requires durable local-process and excludes child Workspaces. Session-authorized placement is distinct from a shared binding's empty isolation key; original Runtime Session owner/claim fences cover execution, Hooks and cleanup. Both close protocols release only that Harness Session's Runtime Sessions/holders in keyset batches of 100, leaving the binding/worker READY. Missing workers or unknown work block close, and v2 never-initialized evidence cannot omit shared records. Only storage-fenced retirement physically drains/stops the worker; retention protects original owners' unsettled child runs. V9 indexes harness_session_id alone to avoid an oversized dual VARBINARY key, filtering tenant in the query. Creation warm, idle/hard budgets and keep-warm are not delivered. Reported unit/H2/mutation checks do not qualify real Linux/MySQL multi-Session processes.

Merged [#14442](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14442.md) verifies macOS LOCAL storage/worker using hardware UUID, boot UUID, nanosecond birth, device/inode and the original marker. Native probes have five-second/64-KiB limits. The same host/boot may reconnect the original durable worker; trusted-local-reboot-recovery must be false on macOS. Changed host/boot remains UNKNOWN without adopting, attesting or stopping the original worker or borrowing Linux reboot proof. This adds no Linux cgroup, CSI or cross-machine qualification. Native/source/database/deployment gates were not run here.

### Open Private File Turns and Receipt-Complete Recovery, 2026-10-19

Historical W42 open observation (now merged; see the W43 update for current boundaries): Open [#14487](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14487.md), `76902629d1d9`, connects only original read_file/write_file/edit on writer generation 1/activation epoch 1. It reserves the accepted batch, persists mutation intent and original backup preparation, then commits tool intent/checkpoint, complete outcomes/receipts and closed history before model consumption. Refusals are validated against the original call; admitted work still needs native receipts. Final assistant output and the successful model attempt commit atomically. This is not cold recovery, physical finalization/release or public CSI selection, and is not on main.

Historical W42 open observation (now merged; see the W43 update for current boundaries): Open [#14523](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14523.md), `5adfab798f62`, is stacked on codex/csi-hosted-files and includes prerequisite file-turn changes in its reported size. Same-Connection native admission verifies one original no-deadline input/batch, all SETTLED members with complete receipts and both expired writer/activation leases. A newer writer and exactly the next activation retain the original READY worker/history. It prechecks the full original result/message prefix, repairs missing original messages/checkpoint resolutions, and only then continues the model; repair allocates or executes no file operation. A cleared pending batch, final model output, live owner, missing receipt, cancellation or UNKNOWN refuses cold admission. Main still has the narrower merged text path; complete K2, OS-crash and deployed CSI gates were not run here.

### Weekly Recheck Boundaries, 2026-10-19

Weekly recheck: the new #14487 head makes one independent membership read, bounded to five seconds, after prepare failure and preserves the original error if readback fails. Closed outcome/error/text/media schemas and original function identity are checked before receipt publication; invalid outcomes retain pending work. #14523 remains based on `57c3a24470e7`, not the updated prerequisite head. Later main clears exact storage holders through releaseRetired only under the original close drain, a matching persisted stop receipt and no active Sessions/executions. A failed ordinary release or lost network response cannot authorize physical stop or holder removal; acknowledged logical release retains its existing path. See [recovery operations](managed-agent-recovery-operations.md). No source/database gates ran in this documentation task.

## Historical foundation

The non-goals, four-table schema and initialization sections below retain the September 27 foundation snapshot, not all current behavior or the open 32-table branch.

Status: Base merged upstream by #12445; wiring-gate fixes #12477 and #12478 have also merged

> Upstream delivery status (updated 2026-09-27): #12390/#12391/#12438/#12445 merged JDBC Binding/Session storage, Tool Execution state, Broker core, and the fourth JDBC table; #12458 was closed as superseded. The exact #12445 review head passed 63 JDK 21 tests, Checkstyle, a shared H2 contract, and the same contract on a disposable MySQL 26.7.0 database using `utf8mb4_0900_ai_ci`, including case-sensitive identifiers, opaque `$ref`/`@type`, and positive-exponent BigDecimal round trips. #12477/#12478 merged the dispatch owner fence, timezone-independent storage-safe database-clock reads, and a MariaDB CI lane; #12552 merged local process adoption. #12627 merged encrypted seed, resource handle, attestation generation, LOST/RECOVERY_BLOCKED states, and observe→attest→CAS recovery foundation. Later mainline uses `local-process` kind with ensure/reconcile, but observation still depends on the process-local owned map; production cross-Broker adoption, full Tool Runtime transport, and multi-process end-to-end proof remain outstanding.

## Problem

The managed runtime broker foundation defines Runtime Binding, Runtime Session, and Tool Execution state, but its Tool Execution implementation is process-local. A restart loses execution identity, dispatch ownership, cancellation intent, `UNKNOWN` recovery state, and settled results. Multiple broker processes also cannot coordinate an at-most-once dispatch boundary through a shared source of truth.

## Goals

- Persist runtime bindings, runtime sessions, and tool executions through JDBC.
- Preserve atomic binding creation, binding generation fencing, compare-and-set updates, operation leases, tenant and workspace isolation for Binding and Session state, and terminal session semantics.
- Preserve idempotent Tool Execution creation, dispatch owner and generation fencing, database-clock leases, cancellation intent, `UNKNOWN` reconciliation, and settled results.
- Initialize the private broker schema idempotently.
- Verify the same repository contract against H2 and a real MySQL instance.

## Non-goals

- Starting, stopping, or otherwise managing runtime processes.
- Integrating the repositories into the Harness, Spring wiring, transport layer, or public API.
- Dispatching a Tool call or resolving an `UNKNOWN` execution automatically.
- Delivering events through SSE, an outbox, MQ, or Redis.
- Sharing one managed runtime across unrelated workspaces.

## Dependency boundary

The JDBC repositories use `javax.sql.DataSource` for database access and fastjson2 (2.0.60) as the JSON codec for the `reference_json`/`result_json` columns. Opaque Tool payloads disable fastjson2 reference detection so `$ref` and `@type` members remain data, and finite `BigDecimal` values are written without exponent notation so the reader cannot narrow or overflow them as doubles. They do not choose a connection pool, require Spring, manage database migrations through a framework, or bundle a production database driver. The test profile supplies H2 for the default repository contract and MySQL Connector/J for the optional MySQL integration test.

## Schema

The broker owns four private tables:

- `qwen_runtime_binding_slot` serializes creation for one hashed runtime scope.
- `qwen_runtime_binding` stores the current runtime binding, generation, endpoint, operation lease, lifecycle state, and optimistic version.
- `qwen_runtime_session` stores runtime sessions and their terminal state under a binding generation.
- `qwen_tool_execution` stores one durable Tool Execution per globally unique idempotency key, including immutable request identity, dispatch fencing, cancellation intent, `UNKNOWN` state, and the settled result. Execution-call and idempotency identifiers use deterministic hashes for case-sensitive lookup under any database collation, while each lookup verifies the complete identifier.

Scope identity is represented by a deterministic hash and is always checked together with the full tenant-scoped identity. Endpoint tokens remain encrypted or opaque values supplied by the caller; the repository does not log or transform them.

## Transaction and concurrency semantics

Binding creation locks the scope slot, re-reads the binding inside the transaction, and inserts exactly one active record for that scope. Binding updates use the stored version and generation as fences. Operation leases use the database clock so competing JVMs do not depend on synchronized local clocks. #12478 converts that clock to Unix epoch seconds and microseconds in the SQL query, so a connection's session time zone cannot shift lease instants relative to the service clock.

Session creation relies on the database uniqueness constraint and re-reads the winning record after a concurrent insert. Session compare-and-set updates lock the current row, validate the expected version and binding generation, and reject any attempt to reactivate a terminal session. SQL failures roll back the transaction and propagate to the caller; there is no silent fallback to process-local state.

Tool Execution creation uses a unique SHA-256 key for bounded database indexing while retaining and verifying the full idempotency key. Mutations lock the execution row. Compare-and-set and `UNKNOWN` reconciliation validate the supplied immutable identity and version; cancellation validates the expected version; dispatch claim and renewal validate the applicable owner, generation, and lease fences. Lease decisions use the database clock. An expired `DISPATCHING` claim can be reissued because physical execution has not started; an expired `EXECUTING` or `CANCEL_REQUESTED` claim becomes `UNKNOWN` and cannot be dispatched again until an explicit reconciliation result settles it.

The service must also fence the physical side effect after its state transition. #12477 re-checks that the record returned from the `EXECUTING` transition still has the claimed owner and generation before starting renewal or calling `transport.execute`; losing the claim makes the stale dispatcher exit without invoking the transport.

## Schema lifecycle

Schema initialization executes idempotent `CREATE TABLE IF NOT EXISTS` statements for the four broker-owned tables. This is sufficient for the current private module boundary. A later server integration must define how migrations are versioned and deployed before these repositories become production wiring.

## Recovery boundary

A durable binding or session row proves only that broker state survived. It does not prove that the referenced runtime process is live. Likewise, an `UNKNOWN` Tool Execution records uncertainty rather than proving whether the side effect happened. Process reconciliation, transport health checks, and authoritative execution reconciliation remain responsibilities of the later runtime integration.

## Security and tenancy

Binding and Session lookups and mutations are constrained by the complete Runtime Scope or an identity created from it. Tool Execution methods accept opaque execution, idempotency, and Runtime Session identifiers without a separate tenant or workspace argument. The embedding service must derive globally unique identifiers from authenticated tenant, workspace, and session context before calling this repository and must never accept an untrusted identifier as sufficient authorization. Within this precondition, the unique keys prevent cross-scope aliasing; the Tool Execution repository does not independently enforce tenant or workspace scope. The Binding and Session repositories never search for a compatible binding in another tenant or workspace, and no repository falls back to a primary runtime when state is missing or ambiguous.

## Validation

The repository contract covers:

- concurrent creation of one binding per scope;
- reconstruction through a new repository instance;
- stale version and stale generation rejection;
- operation lease ownership and takeover after expiry;
- tenant and workspace isolation for Binding and Session state;
- concurrent session creation;
- terminal sessions that cannot be reactivated;
- concurrent idempotent Tool Execution creation across repository instances;
- dispatch claim, renewal, cancellation, expired-owner fencing, and `UNKNOWN` reconciliation;
- deterministic owner takeover between the `EXECUTING` transition and transport call;
- database clock conversion under UTC, +08:00, and -04:00 session time zones on H2 and real MySQL;
- settled result reconstruction through a new repository instance; and
- repeatable schema initialization.

The default test suite runs the contract on H2 in MySQL compatibility mode. The optional `mysql-integration` Maven profile runs the same contract against a caller-supplied MySQL database.

## Acceptance criteria

- Multiple repository instances coordinate through the database and observe one active binding for a scope.
- Binding and session state survives repository reconstruction.
- Stale owners cannot mutate a newer binding generation or version.
- Expired operation leases can be taken over while live leases remain fenced.
- Binding and Session state remains isolated by tenant and workspace.
- Tool Execution identifiers are globally unique and namespace-bound to authenticated tenant, workspace, and session context by the embedding service.
- Terminal sessions cannot return to a non-terminal state.
- Concurrent callers observe one Tool Execution for an idempotency key.
- A live dispatch lease rejects another owner, while an expired executing claim becomes `UNKNOWN` instead of being replayed.
- A dispatcher that loses owner/generation fencing before the transport boundary does not invoke the transport.
- Database lease instants remain aligned with the service clock regardless of the JDBC session time zone.
- Cancellation intent and settled Tool results survive repository reconstruction.
- Schema initialization is safe to repeat.
- The H2 contract and the optional real-MySQL contract pass without process-local fallback.

## Follow-up work

#12477 and #12478 have merged the two correctness fixes required before server wiring and multi-broker dispatch. Process reconciliation, authoritative `UNKNOWN` resolution, schema migration deployment, concrete service/transport wiring, and multi-process end-to-end validation remain follow-up work.
