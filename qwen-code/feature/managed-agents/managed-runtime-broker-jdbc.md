# Managed Runtime Broker JDBC Persistence

## Landed Modules and Public Snapshot Removal, October 31

Main `57d9a8fb50f4` has the sole V1 with 38 business tables. Merged [#15870](../../weekly-report/2026-10-26_2026-11-01/implementations/pr-15870.md) removes public ma_snapshot/SNAPSHOT owners and dedicated metadata, not NATIVE_SNAPSHOT, canonical journal/checkpoints, tool capture or artifact owners. Message reads use live keyset pages with read leases and original resource references; projection coverage and active Turns fence replay-floor advancement, still opt-in, without physical event deletion. Old signed/decimal transcript cursors require reload, limits are 1–100, and projection changes, lag and oversized pages have distinct error semantics. Bodies are not frozen as of the membership bound.

Merged [#15871](../../weekly-report/2026-10-26_2026-11-01/implementations/pr-15871.md) separates contracts/control-plane/runtime-broker/persistence/adapters/server and verification. JDBC/schema stay in persistence, SDK/OSS/MQ in adapters and Boot assembly in server; final SQL retains the same 38-table baseline. Exec/maintenance artifacts live in server/target, reports in verification/target; verification is not published. Its explicit server test resources and original module/CLI properties do not put default application configuration back into the production library. Native declarations belong only to contracts; mixed old catalogs or writers are not thereby qualified.

[#15696](../../weekly-report/2026-10-26_2026-11-01/implementations/pr-15696.md) remains open at `194469a54723`, in the old directory layout with public snapshots and two generation-qualified history state/fact tables: 41 business tables, not a direct two-table extension of current main. Canonical commits append facts atomically; bounded continuous backfill, bucket counts and original locators/digests certify answers, and repair uses generation CAS. Original token and Workspace/Session authorization remain; missing/corrupt views are not absence, and canonical corruption is not repaired as an index issue. Frozen streamed replay preserves certified branch points, external parents and managed JDBC/JSON bean qualifiers.

That candidate bounds READ_COMMITTED source-page candidates and bodies to the captured head and uses the existing valid read grant without renewing ordinary write authority. Unknown append outcomes refuse reads. Its launcher/scale JVM limits each temporary direct-buffer cache to 1 MiB; external file-H2 JVMs need the same flag. This is neither an RSS cap nor a synchronous-durability change; scale qualification remains separate.

Merged [#15745](../../weekly-report/2026-10-26_2026-11-01/implementations/pr-15745.md) retains ma_session_worktree and atomic original Session/binding/preparation/receipt admission. Original completion identity and whole-storage maintenance protect Git; shared imports keep private service markers and refuse exclusive recovery/fencing/migration/rewind. New preparation requires a repository strictly below storage root; before READY, existing queue management/cancellation remain but new execution does not. A blocked checkout does not settle a submitted Turn. Its former 39-table baseline became 38 after public snapshot removal.

Merged [#15813](../../weekly-report/2026-10-26_2026-11-01/implementations/pr-15813.md) updates original activation expiry/renewal sequence and head expiry under writer/epoch/CSI fences, not journal bytes/revision/sequence/digest; uncertain renewal settles the same sequence first. [#15839](../../weekly-report/2026-10-26_2026-11-01/implementations/pr-15839.md) retains metadata-first bounded canonical recent/command reads. Its signed public-snapshot pages and [#15865](../../weekly-report/2026-10-26_2026-11-01/implementations/pr-15865.md)'s explicit messages selector were superseded by #15870; live message paging remains REPEATABLE_READ, 1–100 Items/8 MiB combined, without frozen bodies or mutation authority.

Merged [#15729](../../weekly-report/2026-10-26_2026-11-01/implementations/pr-15729.md) keeps original finalizer/baseline, fresh same-boot Node/Lease, termination/unmount/detach evidence before PLATFORM_CLEANED and fenced RELEASED. Resident odd/even reservations only permit same-tenant retained-data reuse; DELETE/early 404 is not release proof. [#15827](../../weekly-report/2026-10-26_2026-11-01/implementations/pr-15827.md) removes MariaDB full CI, not existing dialect code; complete MySQL 8.4 coverage remains. [#15715](../../weekly-report/2026-10-26_2026-11-01/implementations/pr-15715.md) changes only test-pool initialization.

Open [#15927](../../weekly-report/2026-10-26_2026-11-01/implementations/pr-15927.md), head `0e045ec457cf`, adds a response-start cancellation witness and same-repository/version ordinary/enabled embedding-host CI. It does not alter production cancellation or prove those new runs passed. This task ran no source, scale, MySQL, embedding, Cloud or native gates; earlier dated snapshots below are historical, with current public-message semantics defined here.

## Native Snapshot Pins and Upload Ownership, October 27

Main `ca9d5f7ffab9` includes [#15569](../../weekly-report/2026-10-26_2026-11-01/implementations/pr-15569.md): native committed-prefix pages/manifest and their original JOURNAL dependency census are pinned by NATIVE_SNAPSHOT. Publication locks the original writer/placement/ACTIVE/READY scope, freezes revision/sequence/digest, protects reads and revalidates the original head before commit. The owner CHECK changes in the sole V1, not a new table or V2 migration. Retirement removes native pins in bounded batches and refuses completion while any remain; snapshot existence does not authorize journal deletion or resource collection.

[#15599](../../weekly-report/2026-10-26_2026-11-01/implementations/pr-15599.md) selects a native image no newer than the frozen restore head, rechecking original generation, scope and coverage. The HTTP consumer verifies the page/transaction/resource chain and tail before updating its grant. Its focused changes overlap the later final #15569 diff; public message snapshots remain separate and corrupt selected images do not silently fall back.

[#15586](../../weekly-report/2026-10-26_2026-11-01/implementations/pr-15586.md) extends the operation CHECK with WORKSPACE_UPLOAD. LOCAL/SSH_LOCAL admission freezes actor, scope, original target and payload digest in ma_operation, acquiring the exact idle physical storage holder. Only a fresh operation sends bytes; reconciliation queries the original upload ID. A confirmed original terminal clears only its holder, while uncertainty retains ownership. No table is added: the catalog still has 38 business tables, with matching consumers and recreated development catalogs required.

[#15585](../../weekly-report/2026-10-26_2026-11-01/implementations/pr-15585.md) only updates lifecycle-v2 tool and 38-table acceptance fixtures. This documentation task ran no source, MySQL, independent-process or native platform gates; fixture alignment and merge do not qualify S1, safe reuse or CSI recovery.

## Pinned Package Baseline, October 26 Weekly Review

Main `49569f16a5a3` includes [#15490](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15490.md), final head `099f5f46621d`, merge `41ce46af24c0`. Package publication/execution remain off by default. Package, encrypted settings and operation tables extend the queue's 35-table baseline to 38 business tables in the sole V1. Actual durable archive bytes, their digest and original operation govern publication; an effective Session bundle commits through the existing config_install domain with both endpoint ACKs, original Runtime identity and generations. Unknown installation retains its barrier; compensation needs original stopped receipts and a new revision, not a blind replay.

Recreate development catalogs and match Server/SDK/Harness/Runtime and external writers. Schema version 1 does not prove mixed-writer or rollback compatibility. The 35-table and older numbered migration sections below are dated snapshots, not the current catalog. This documentation review ran no source, MySQL, independent-process or native platform gates; merge does not qualify them.

## Queue Baseline and Resident Admission, October 26 Midnight Snapshot

At the midnight snapshot, main `b3ab3ec64c81` included [#15449](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15449.md): the single V1 had 35 business tables after adding the queue, message and command tables. Original actor/key receipts remain readable after close; fresh mutations require ACTIVE. A discarded blocked claim retains its original revision/Turn/prompt so a late committed user-message receipt can settle it without redispatch. Recreate development catalogs; this is not a V2 migration or mixed-writer compatibility guarantee.

[#15457](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15457.md) is merged. The in-memory/JDBC placement fence ignores equal cwd only when both requests select the exact resident capability, Workspace isolation and kubernetes-workspace provisioner. Same Workspace/storage, incomplete managed context and non-resident path fences remain. The authenticated Harness-scope capability query allocates no physical resource; only an old-route 404 waits for the original warm request. Resident declarations allow Read/Write/Edit and local Plan exit. Unsupported valid PREPARED payloads settle atomically as not_started before dispatch; races and existing dispatched/UNKNOWN results retain their original evidence. S1 requires fresh qualification on the fixed revision; S2/S3 physical reclamation remains separate. This documentation task ran no source, MySQL or native ACK checks.

## Historical Resident Scope Candidate, 2026-10-25

Historical open head `d1b4639e4cb0` records a native failure at S1 pin 2c0c9fa8dc4a: after one same-tenant binding entered DRAINING, a new Workspace on different registered storage could be refused because the old fence also matched /workspace. The later source fix does not retroactively clear this failure or existing UNKNOWN results. An existing binding or another tenant's qualification is insufficient; rerun S1 on the fixed source. This task did not rerun the native scenario.

[#15457](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15457.md) was a six-document candidate at this snapshot; it is now merged with the source fixes above. Complete CSI auditing is no longer a first-release prerequisite, but no new reclamation authority is granted. Existing same-Pod/PVC handoff retains READY binding/RESERVED ownership. Explicit idle retirement retains DRAINING, slot, owner and history. RETURNED means a complete DELETE response, including non-2xx, not completed termination; UNKNOWN never releases. PVC/PV/Secrets/protection remain and retained resources continue to incur costs.

S2 must define normal platform completion, node-loss/forced-delete isolation, original-identity readback and data/cross-Workspace policy before S3 atomically revalidates generations and releases ownership. Pod absence, VolumeAttachment disappearance or one disk status alone is insufficient. Candidate S1 pin 2c0c9fa8dc4a is distinct from historical withdrawal/ACK revisions; a scope change does not qualify new source or complete K2. This task compared the candidate diff with existing boundaries in main `395c7a820a47`, without source/MySQL/native ACK execution.

## Current Baseline and Publication Authority, 2026-10-24

Main `eeb853048aa3` includes [#15263](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15263.md): effective V2–V17 columns/indexes/checks are folded into the sole V1, with 32 business tables. ManagedSchema fixes version 1 and validates the actual catalog. Before the first formal release, recreate development catalogs; no old upgrade chain is maintained. The dated V12–V17, migration and sequential-cutover descriptions below are historical, not current deployment commands or compatibility guarantees.

ToolPublicationStore requires the original journal head/activation revision, identity and live lease, without legacy walks/head backfill. MCP release requires the original drain receipt. Removing O3 backfill columns does not remove retention/read leases/GC or cleanup debt. Durable operations, explicit nullable checkpoint fields and mandatory journal handles require matched consumers and external writers. Preserve and isolate unknown old owners instead of clearing them to rebuild. No source, MySQL, multiprocess, CSI or deployment gates ran here.

## Previous Snapshot: Native Recovery and Layout, 2026-10-23 (Historical)

[#15094](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15094.md) aligns checkpoint/native readback at 1 MiB. [#15170](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15170.md) hydrates settled, consumed history through the original page chain: 48 KiB/32-entry pages, at most 4096 pages/64 MiB and a 1 MiB root. Historical pages require matching scope/digest and a committed JOURNAL reference within the revision ceiling. Upgrade all relevant TS/Java/CSI consumers before new paged writes; old inline checkpoints remain readable.

[#15119](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15119.md) commits Session MCP settings before draining/configuring the original owner, without new DDL or deleting resource evidence. [#15131](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15131.md) proves readiness/cleanup-only against the original prompt/journal/lease; UNKNOWN never authorizes replay or replacement. Canonical V16 expands the compression operation kind; V17 adds public_child_agents_version default0 for [#15171](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15171.md). Its default new-root delegation excludes CSI/SSH/MCP/Hooks and does not expand public CSI admission.

Main `c61044fae46c` now includes the earlier #14487/#14523/#14599; their W42 open heads below are historical observations. [#14695](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14695.md) retains one original no-deadline input/batch and the installed successor writer/activation fence. Same-source SQL verifies every original SETTLED member, grant/intent/checkpoint/input/definition and result before missing receipts/messages are repaired. Each input/definition/result/authorization byte block is bounded to 64 KiB, and the whole response to 8 MiB. Repair dispatches no tool; a fully proven output_committed assistant/route/history/results_ready tail is consumed without another model call.

[#14710](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14710.md) keeps one Maven module/deployment while moving the SQL aggregate to managedagent.persistence, business services to their owning packages and shared model/exception types out of api. Broker provisioning/transport/security are separate. Main is V1–V17; [#14698](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14698.md) V12/boot6 and SETTLING/FROZEN/CUT/DRAINED are merged. Original inventories, worker observations and independently verified saved CUT do not establish physical Pod/PVC deletion. No source/database/CSI/deployment gates ran in this documentation task; legacy catalogs still need a separate migration, never history repair.

[#14758](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14758.md) ends as documentation of the trusted-platform resident path and its acceptance boundary; its former node-evidence candidate was withdrawn. [#14761](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14761.md) is closed unmerged, so its offline-install/cold-boot paths are not on main. The redesigned [#14765](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14765.md) independently adds explicit idle resident maintenance: current OWNER, configuration/registration/protection, original READY shared binding/slot/RESERVED owner, and no live Session/writer, unreleased Runtime Session or unsettled tool. A transaction saves the V14 original plan and seals Workspace/binding DRAINING. The CLI starts no service, worker or migration. Before deletion it rechecks original Pod UID/spec/container, Ready node and resourceVersion; a durable UNKNOWN attempt precedes a preconditioned DELETE, once per version and at most eight attempts. Bounded responses retain the original claim fence. Lost replies, HTTP 2xx/404 or object absence never clear storage ownership, establish RELEASED or authorize replacement/cross-Workspace reuse.

[#14764](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14764.md) adds V13 references to the original cleanup descriptor/binding/generation and head-history coverage. Only matching confirmed evidence removes a reference; uncovered old history protects the original Runtime. Main is canonical V1–V17 with 32 business tables. Legacy catalogs need independent migration, never history repair. Keep software/H2, MySQL, independent-process and ACK evidence separate; none of those gates ran in this read-only documentation verification.

[#15026](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15026.md) adds V15 execution_storage_key/execution_exclusive and an index to ma_runtime_session, retaining 32 business tables. Ordinary LOCAL/SSH_LOCAL acquisitions record one exact member per Runtime Session under the original physical-domain/binding/owner locks. Release and fenced original stopped cleanup clear only that member. UNKNOWN on a READY binding retains its member without excluding another ordinary Session. Undo requires other current members to drain, sets exclusive temporarily, and retains it on uncertain failure. Maintenance/fencing/recovery still drain members; ambiguous operator ownership is refused. Resident/private CSI keeps its original reservation and single unfinished Session; inventory requires the new fields null/false. Shared files provide no transactional isolation.

Existing canonical V1–V14 deployments require a drained cutover, not a mixed-version rolling upgrade: disable new Turns on the old build, finish/recover and release ordinary holders, stop all old Server/Broker/Harness/worker and external writers, verify no non-maintenance LOCAL/SSH_LOCAL holder_key remains, then apply V15 and start the matching build. An unconfirmed UNKNOWN writer stays on the old deployment; never manually clear ownership. There is no singleton conversion or legacy-authority fallback. Retired/DATETIME catalogs still require independent migration. No database/SSH/process gates ran here.

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
