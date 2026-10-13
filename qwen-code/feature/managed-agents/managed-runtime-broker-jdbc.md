# Managed Runtime Broker JDBC Persistence

> Current delta, 2026-10-13: #12692 merged Spring/Flyway wiring; #12865 uses durable host/boot/process identity beyond the old owned map, with trusted reboot/operator cleanup in #12869/#12977. #13289 merged experimental CSI/persistent ACK foundations. #13642 remains open at `5832d8824a31`, now with V69 retention indexes, DAYS maxAge, MILLIS scanDelay and a 1ms minimum maxAge. The original background_shell process row remains protected while its child_run is unsettled. V68 async verification is already merged; the old migration collision is resolved, but cleanup stays off pending writer lock upgrades and the separate Hosted cleanup release-proof validation. #13673 merged original Hook drain/stop/holder recovery. The September 27 delivery note below is historical.

> Private CSI boundary: closed [#13893](../../weekly-report/2026-10-05_2026-10-11/implementations/pr-13893.md) rejects private file profiles across local-process create/adopt/register/observe/confirm/release/operator paths; it is not merged support. Similar guards appear in merged [#13899](../../weekly-report/2026-10-05_2026-10-11/implementations/pr-13899.md), whose separate v5 file worker checks original input/readback/history identity but always returns BLOCKED drain and retains backups. This worker diff does not establish complete Java/Hosted native/readback wiring, production CSI deletion or cross-owner recovery.

> Weekly additions: #13642 indexes execution-lease references by `(binding_id, runtime_generation)` in Flyway and idempotent JDBC setup. #13899 preflights the 100-snapshot/64-KiB history-envelope capacity before prepare. A failed prepare with changed or unprovable effects marks historyFailed and rejects subsequent writes/queued snapshots; only identical before/after observations permit same-reference retry. Ordinary read-path refusals do not automatically fence the mount. Partial/cancelled writes attempt file rollback against the original inode; failed rollback retains aggregated faults. Seal also closes executor admission, while drain stays BLOCKED. This is not whole-call atomic rollback or physical deletion; source/CSI gates were not run here.

Final merged #13899 excludes prepare/execution overlap without retiring the Session for timing refusals. Scoped new files/directories request 0600/0700, existing mode is preserved; only successful rollback of the exact cancellation reason restores availability. ENOSPC/storage failures still fence after bytes are restored. Ordinary Write retains pre-write errors. Boot6 CUT/finalization and full native control-plane wiring remain in open #13526, not this merged boot4/5 worker.

[English](managed-runtime-broker-jdbc.md) | [简体中文](managed-runtime-broker-jdbc.zh-CN.md)

Latest #13642 deduplicates background owners by both raw Session value and binary identity before indexed projection lookup; permissive collation must not collapse different owners. This is conservative Session-level protection. Retention must remain disabled until a separate exact-identity Hosted cleanup release-proof contract is delivered and verified: owed descriptors can outlive RELEASED bindings, and collection currently turns original release into a conflict that blocks the Session. This open PR does not implement that contract; writer lock upgrades alone are insufficient for enabling cleanup. New H2/MySQL tests cover large settled Shell volume and folded-owner identities; they were not run here.

## Open private authority and new-database slices, 2026-10-14

[#13996](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-13996.md), head `2d32f7f46196`, adds offline private CREATE, csi_guard and same-source SQL/native authority. `WorkspaceCsiRuntimeAccess` locks original placement/control/registration in a fresh DataSource transaction and verifies READY binding/generation/lease/seed/handle/context. Native authentication checks both provision-seed and Runtime-lease tokens; comparison references must come from authenticated native readback. `ManagedSessionStore` verifies genesis, first writer/activation, finite original batches and execution/history receipts in the journal transaction. Resource delivery uses original read leases and rechecks identity/bytes before settlement. Generic cancel/close/delete remain unavailable, release requires `csi_finalize_required`, and the positive SQL grant-to-worker-to-retained-history chain still requires qualification.

This branch uses V69-V72 for request, activation, execution and read pins. Open #13642 at `d8ddc6ac9871` also contains `V69__runtime_broker_retention.sql`; main `96cfa244917c` already has V68. The older collision-resolved note does not qualify joint deployment of these open branches: integration must recheck numbering, lock order and compatibility gates.

[#14081](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14081.md), head `94167b93b28c`, is stacked on #13996, not an independent main diff. Authenticated Hosted private attach/text/history pins original UUID/writer/activation and performs fresh admission checks. It produces text only; lease loss blocks the owner and `stopLocal` neither seals authority nor releases Runtime. There is no file toolTurn, finalization, public selector or cold writer replacement; process-local prompt deduplication does not prove cross-boot replay.

[#14069](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14069.md), head `740f8e8c5df6`, introduces a fresh-database-only 32-table ma_* catalog and one canonical V1 DDL. Exact catalog/column/key/index/check/FK validation precedes Flyway baseline/migrate; archived old migrations are outside the classpath, with no in-place legacy conversion. Typed receipt/work namespaces preserve separate Runtime generation, Session head, operation claim and read-lease authority. See the [storage/event design](managed-agent-storage-event-architecture.md) for snapshots, projection GC and cutover boundaries. Source, MySQL, OSS/CSI and deployment gates were not run in this documentation update; all three slices remain open rather than main or production promises.

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
