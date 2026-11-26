# Managed Agent Java Control Plane: Multi-Instance Deployment

[English](managed-agent-java-multi-instance.md) | [简体中文](managed-agent-java-multi-instance.zh-CN.md)

Status: proposal, 2026-11-25. Personal design draft, not submitted upstream. Every finding about current behavior was checked against QwenLM/qwen-code `main` at [`67f85d324e`](https://github.com/QwenLM/qwen-code/commit/67f85d324e5f83cabca9229e1e9fc6161b794947). This document complements [Harness pull scheduling](managed-agent-harness-pull-scheduling.md): that one covers multiple Harness instances, this one covers multiple Java control-plane instances.

## 1. Problem and conclusion

Target deployment: several Java control-plane instances, each embedding a Runtime Broker, behind a round-robin load balancer, with Runtimes placed by an external provisioner (`external-scratch` or `external-workspace`). Any request may reach any instance, with no session affinity.

Today: upstream supports one Java control plane only ([README "Hosted recovery scope"](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/README.md?plain=1#L2155-L2175)). Durable state is already in SQL, fenced by CAS, leases and generations, so running several instances does not corrupt data. But six places depend on in-process state or the local clock, and a round-robin load balancer turns them into failures or delays (§3.2).

**Conclusion (proposed):** introduce neither Java-side Session owner routing nor session affinity. Apply one rule: **in-process state is only a cache that is rebuilt from SQL when missing, and every cross-instance constraint lives in SQL and uses the database clock.** The plan is seven changes (§4) plus deployment requirements (§5). It does not need MQ.

## 2. Scope

In scope:

- two or more Java instances behind a round-robin load balancer;
- external runners;
- a single-address Hosted Harness (every Java instance points at the same Harness) or a static Harness pool.

Out of scope:

- the `local-process` and `ssh-process` runners: their worker endpoints are fixed to `127.0.0.1`, so they are single-host by design;
- session affinity and other interim measures;
- multiple Harness instances: see the pull scheduling document;
- the known MQ EventTransport issues ([MQ3](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/docs/design/2026-10-14-managed-agent-event-transport-mq3.md) findings 1–3): this plan does not use MQ;
- cross-version contracts for mixed-version rollouts.

## 3. Current state

### 3.1 What already works across instances

- Turns, lifecycle operations, approval responses, task cancels, renames and context compressions are SQL rows claimed through dispatch leases. Every instance scans for them, and whichever claims a row runs it.
- The private Session Store routes only read and write JDBC ([`ManagedSessionStoreController.java:49`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/server/src/main/java/com/alibaba/qwen/code/managedagent/api/ManagedSessionStoreController.java#L49)), so any instance can serve them.
- Journal writer leases, writer generations and Harness pool placements are in SQL, and writes from stale holders are refused.
- The client-files relay uses a SQL queue polled every 100 ms. Side queries converge through a reconcile that runs once a second. Action parking state is in SQL, and terminal holds are durable records.
- The Harness generates one `clientId` per resident Session ([`session-open.ts:2052`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/cli/src/serve/hosted-harness-session/session-open.ts#L2052)). A load that reuses the resident returns the same `clientId`, so another Java instance can re-attach, and its later requests pass the identity check in [`session-http.ts:203-216`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/cli/src/serve/hosted-harness-session/session-http.ts#L203-L216).

### 3.2 What breaks across instances

| # | Problem | Effect behind a round-robin load balancer | Source |
| --- | --- | --- | --- |
| 1 | Terminal WebSocket tickets are kept in an in-process map | A ticket issued by instance A fails when the upgrade reaches instance B. The sessionId is in the request body, so hashing by path cannot route it | [`TerminalTicketStore.java:41`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/server/src/main/java/com/alibaba/qwen/code/managedagent/api/TerminalTicketStore.java#L41), [`TerminalRelayHandshakeInterceptor.java:69`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/server/src/main/java/com/alibaba/qwen/code/managedagent/api/TerminalRelayHandshakeInterceptor.java#L69), [`TerminalTicketController.java:36`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/server/src/main/java/com/alibaba/qwen/code/managedagent/api/TerminalTicketController.java#L36) |
| 2 | SSE delivery goes only through the in-process hub. The admitting instance runs the Turn immediately after commit; a stream on any other instance waits up to `events.poll-interval` (default 5 s) before it re-reads SQL. The MQ public lane only triggers materialization and never reaches SSE | On any instance not running the Turn, streamed output arrives in batches every 5 seconds | [`SessionEventHub.java:20`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/control-plane/src/main/java/com/alibaba/qwen/code/managedagent/session/SessionEventHub.java#L20), [`CompositeCommittedEventPublisher.java:67`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/control-plane/src/main/java/com/alibaba/qwen/code/managedagent/event/CompositeCommittedEventPublisher.java#L67), [`ManagedEventStreamService.java:128`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/control-plane/src/main/java/com/alibaba/qwen/code/managedagent/session/ManagedEventStreamService.java#L128), [`ManagedAgentService.java:1830`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/control-plane/src/main/java/com/alibaba/qwen/code/managedagent/session/ManagedAgentService.java#L1830), [`EventTransportConsumer.java:150`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/control-plane/src/main/java/com/alibaba/qwen/code/managedagent/event/EventTransportConsumer.java#L150) |
| 3 | Dispatch leases are written and compared with the JVM clock | An instance whose clock runs ahead by more than the lease duration (default 60 s) takes over a Turn that is still running and eventually fails it; MQ3 finding 6 observed this | [`AgentTurnExecution.java:80-104`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/persistence/src/main/java/com/alibaba/qwen/code/managedagent/persistence/AgentTurnExecution.java#L80-L104) |
| 4 | Callback addresses are derived per instance: `session-store.base-url` and `client-files.relay-url` default to the instance's own loopback address. The Harness compares `storeBaseUrl` for a resident Session, and its lifecycle path deep-compares the whole Store descriptor | When two instances send different addresses for the same Session, the Harness answers 409 `hosted_session_store_mismatch` | [`ManagedAgentProperties.java:311,351`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/server/src/main/java/com/alibaba/qwen/code/managedagent/config/ManagedAgentProperties.java#L311), [`QwenHostedHarnessConnector.java:2665-2689`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/adapters/src/main/java/com/alibaba/qwen/code/managedagent/harness/QwenHostedHarnessConnector.java#L2665-L2689), [`session-open.ts:837`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/cli/src/serve/hosted-harness-session/session-open.ts#L837-L838), [`session-open.ts:1058`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/cli/src/serve/hosted-harness-session/session-open.ts#L1058) |
| 5 | Java-side Harness attachments and recovery evidence exist only in the memory of the instance that loaded them | [#17538](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/docs/design/2026-11-19-managed-recovery-native-terminal.md) already switched terminal Turns to durable evidence. Other paths that need an attachment still get no evidence, or fail, on an instance without one | Same design, §1 and §3 |
| 6 | The Broker keeps Runtime Sessions and live bindings in process. About 28 call sites require the Runtime Session to be in this process and otherwise return 404; only monitor operations and execution recovery adopt on a miss. `ma_runtime_session` has no Broker owner column. External placements are also in process, capped at 1024 and never evicted | When the Harness's Broker address goes through a load balancer, many calls return `runtime_session_not_found`; every instance accumulates a placement for almost every Session and eventually returns `runtime_external_capacity` | [`RuntimeBindingRegistry.java:147-167`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/runtime-broker/src/main/java/com/alibaba/qwen/code/runtimebroker/service/RuntimeBindingRegistry.java#L147-L167), [`RuntimeBrokerService.java:797-799`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/runtime-broker/src/main/java/com/alibaba/qwen/code/runtimebroker/service/RuntimeBrokerService.java#L797-L799), [`V1__managed_schema.sql:1034`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/persistence/src/main/resources/db/managed-schema/V1__managed_schema.sql#L1034), [`ExternalRuntimeProvisioner.java:53,63,340`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/runtime-external/src/main/java/com/alibaba/qwen/code/runtimebroker/provisioning/external/ExternalRuntimeProvisioner.java#L53-L64) |

## 4. Design

### 4.1 Terminal tickets in SQL

Add a table `ma_terminal_ticket` with `ticket_hash` (SHA-256, unique), `tenant_id`, `actor_id`, `session_id`, `terminal_id`, `binding_id`, `binding_generation` and `expires_at`. Following the module rules, edit the V1 baseline in place rather than adding a V2 migration.

- **Issue**: insert a row whose `expires_at` is database time plus 30 s. The existing caps of 256 per tenant and 1024 overall become SQL counts, which makes them cluster-wide.
- **Consume**: run `DELETE ... WHERE ticket_hash = ? AND expires_at > <database now>`. The ticket is accepted only when exactly one row is deleted, which keeps it single-use. Then re-read the binding by `binding_id` and `binding_generation`, and refuse the upgrade if it changed.
- **Cleanup**: an existing scheduled task deletes expired rows.
- Neither the plaintext ticket nor the whole binding record is stored.

### 4.2 Cross-instance SSE notification

Each instance runs one notification loop, every 200 ms by default:

1. Collect the Sessions that have local subscribers, which are the keys the hub still references.
2. Read their `ma_event_stream.last_sequence` in one query ([`V1__managed_schema.sql:310`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/persistence/src/main/resources/db/managed-schema/V1__managed_schema.sql#L310), `SESSION` stream, by unique key). Split the query into batches when there are many subscribers.
3. For each Session whose watermark is past the last sequence seen locally, read the new events from SQL once and publish them to the local hub. All local connections to that Session share that one read.

Notes:

- Events this instance writes itself are still pushed right after commit, with no added latency. The hub stores events by sequence, so a duplicate publish is harmless.
- The existing 5 s SQL re-read on each stream remains as a fallback.
- The cost is one unique-key IN query per instance per cycle, independent of the number of connections, plus one read for each Session that actually has new events.
- This is the "batched per-node watermark check" from [storage and event architecture §7.1](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/docs/design/2026-09-20-managed-agent-storage-event-architecture.md#71-sse-and-multiple-instances), without the node-to-node notification in front of it. It therefore needs neither service discovery nor MQ.

### 4.3 Database clock for every lease

- Every dispatch and claim lease is written and compared with database time instead of `clock.millis()`. This covers Turns, lifecycle operations, Action parking and responses, task cancels and the relay ledgers.
- The existing `ManagedSchemaTime.SQL_NOW` has one-second precision (`UNIX_TIMESTAMP()`), while leases need milliseconds. Either use `UNIX_TIMESTAMP(NOW(3)) * 1000`, or read the database time once before a claim. Pick one and use it throughout the module.
- Journal writer leases and wake decisions already use the database clock; this change covers the remaining leases.
- Candidate files include `AgentTurnExecution`, `AgentLifecycleOperations`, `AgentActionParking`, `AgentSessionCommands` and `JdbcChildResultRelayStore`. Before implementing, confirm for each timestamp whether it is a lease or an ordinary timestamp.

### 4.4 Instance-independent callback addresses

These callback addresses must be identical on every instance and point at an internal load-balanced address that reaches the internal listener of any Java instance:

- `session-store.base-url`
- `client-files.relay-url`
- `tool-publication.service-base-url`
- the Broker address the Harness uses (see §4.6)

Why this is enough:

- The Store routes only read and write JDBC, so any instance can serve them.
- The writer token is a deterministic HMAC over the binding key ([`WriterCredentialPolicy.java:115-116`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/contracts/src/main/java/com/alibaba/qwen/code/managedagent/contracts/security/WriterCredentialPolicy.java#L115-L116)), and the descriptor's `writerId` is the Harness boot ID.
- So, with identical configuration, every instance builds the same Store descriptor for a given Session, and both of the Harness's comparisons pass.

This change is configuration only; no code changes.

### 4.5 Harness attachments as a cache

Rules:

1. **Read-only views come from durable state only.** Session reads, the recovery view and the send gate must not answer differently just because this instance has no attachment. #17538 already does this for terminal Turns; this change extends the same rule to the remaining branches, so an active Turn shows its SQL state. Right after a Turn ends, the instance holding the attachment may report `cleanup_pending`. That brief difference is accepted, and the next Turn's pre-admission retry absorbs it.
2. **Write operations that call the Harness attach first when this instance has no attachment.** This covers Turn submission, approval delivery, cancel, MCP and extension management, client-files registration and side queries. The attach is a load that reuses the resident Session. A missing local attachment must never produce a failure or empty evidence.
3. **Before implementing, list every call site that reads the attachment caches** (`attachments`, `selectedAttachments` and the recovery cache in `QwenHostedHarnessConnector`) and assign each one to rule 1 or rule 2.

### 4.6 Broker adopt-on-miss and evictable placements

- Resolve a Runtime Session the same way everywhere: use the in-process entry if there is one; otherwise read it from SQL and adopt it through reconcile and attest, which is the existing `requireOrAdoptReadySession` path. Once all of the roughly 28 call sites do this, the Harness's Broker address can go through an internal load balancer.
- Execution-level fencing stays as it is: every execution has a SQL dispatch lease and generation (`ma_tool_execution`), each binding claims one background observation puller, and terminal holds are durable.
- [`RuntimeExecutionDispatcher.java:188`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/runtime-broker/src/main/java/com/alibaba/qwen/code/runtimebroker/service/RuntimeExecutionDispatcher.java#L188-L192) currently marks the binding LOST and the execution UNKNOWN when this process does not recognize the lease. Change it to reconcile first, and mark the binding LOST only when the provider reports that the resource is gone.
- Make external placements an evictable cache: an entry with no local Runtime Session may be evicted, and reconcile rebuilds it on next use. This is safe because the provider persists its mapping by `provisionRequestId` and the handle is already in SQL. The cap stays at 1024 per process, but counts only active entries.
- **Open questions, to settle with real processes before implementing:**
  - When two Brokers adopt the same binding at once, does the worker accept both attestations?
  - Does adoption advance the runtime generation? If it does, in-flight executions on the previous Broker are fenced to UNKNOWN. Then either adopt only while the original Runtime Session is idle, or add a Broker owner lease to `ma_runtime_session`.

### 4.7 Graceful shutdown

- On SIGTERM, the instance sets readiness to false and its scans stop claiming new work.
- For Turns not yet submitted to the Harness, call the existing `releaseTurnLease` at once, so another instance picks them up on its next scan (1 s) instead of waiting for the 60 s lease to expire.
- Submitted Turns are not migrated: the instance stops renewing them, and once their leases expire another instance takes over through the existing recovery paths.
- SSE connections are closed, and clients reconnect to another instance with `Last-Event-ID`.

## 5. Deployment requirements

- **Identical configuration on every instance:**
  - `auth.signing-key` and `session-store.binding-key`;
  - the runtime credential key and its previous keys;
  - the Harness token and capability digest, and `harness.base-url` or the pool member list;
  - `external-provider-id`, `external-provider-url` and `workspace-id`;
  - `session-store.writer-lease-duration`;
  - the callback addresses in §4.4.
- **Network:**
  - The public load balancer exposes only public routes.
  - Put `/internal/**` on a separate internal listener (`internal-server.port`), reachable only from the Harness and Runtime networks, with a binding key configured.
  - The public load balancer must not buffer SSE, must use an idle timeout longer than the 15 s heartbeat, and must support WebSocket upgrades.
- **Clocks:** after §4.3, correctness no longer depends on instance clocks. NTP is still recommended so that logs and metrics are accurate.
- **MQ:** keep `event-transport.enabled=false`; this plan does not use MQ.

## 6. Phases

| Phase | Changes | Done when |
| --- | --- | --- |
| M1 | §4.1, §4.3, §4.4 | With 3 instances behind round robin, terminals attach from any instance; an instance whose clock is 10 minutes fast never takes a running Turn |
| M2 | §4.2 | On an instance not running the Turn, p95 latency of the first text delta is at most one notification cycle plus one SQL read |
| M3 | §4.5 | Submit, approve, cancel, MCP management and side queries succeed on any instance; reads of the same Session agree across instances |
| M4 | §4.6 | No `runtime_session_not_found` with the Broker behind an internal load balancer; placements stay bounded; the §4.6 open questions are answered |
| M5 | §4.7 and the multi-instance gate | After any one instance is killed, its Turns are completed by other instances once their leases expire, or stay blocked under the existing rules, and no tool call is replayed |

## 7. Acceptance

Add a multi-instance gate: 3 Java instances, a round-robin load balancer, real MySQL 8.4, an external provider stub and the packaged Hosted Harness. It asserts each completion criterion in §6. H2 tests and single-process tests are not a substitute.

## 8. Risks and open questions

1. **Concurrent Broker adoption:** see §4.6.
2. **Cleanup window:** §4.5 rule 1 leaves a brief cleanup window on the instance holding the attachment. Tests must show that dispatch retries fully absorb it.
3. **Database load of the notification loop:** with many subscribers, the size of the IN list and the cycle length need load testing.
4. **Relationship to pull scheduling:** with several Java instances, pull scheduling must broadcast work signals to holders. It can reuse the per-Session watermark polling of §4.2, and it also depends on the database clock from §4.3.
5. **Per-process limits:** besides terminal tickets, per-process limits such as tool publication concurrency and artifact read concurrency become N times larger with N instances. This plan leaves them unchanged; plan capacity per instance.

## 9. References

- [README: Hosted recovery scope](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/README.md?plain=1#L2155-L2175)
- [Storage and event architecture §7.1](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/docs/design/2026-09-20-managed-agent-storage-event-architecture.md#71-sse-and-multiple-instances)
- [EventTransport MQ3: deployment fault matrix](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/docs/design/2026-10-14-managed-agent-event-transport-mq3.md)
- [Managed recovery from durable native terminals (#17538)](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/docs/design/2026-11-19-managed-recovery-native-terminal.md)
- [External Runtime provider](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/docs/design/2026-10-23-external-runtime-provider.md)
- [Configuration reference](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/docs/users/managed-agent-configuration-reference.md)
- [Harness pull scheduling](managed-agent-harness-pull-scheduling.md)
