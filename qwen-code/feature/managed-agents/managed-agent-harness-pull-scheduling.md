# Managed Agent Harness Scheduling: From Java-Routed Push to Pull

[English](managed-agent-harness-pull-scheduling.md) | [简体中文](managed-agent-harness-pull-scheduling.zh-CN.md)

Status: proposal, 2026-11-25, revised 2026-11-26. Personal design draft; not submitted upstream. Current-state claims were checked against QwenLM/qwen-code `main` at [`afcc98595a`](https://github.com/QwenLM/qwen-code/commit/afcc98595ac61e330021ad325d0ef914eb46ce80); the first draft was checked at `67f85d324e`, and §13 lists what changed. Claude Managed Agents facts come from the public pages listed in §14, read on 2026-11-25. This builds on the stateless Hosted Harness design ([#17527](https://github.com/QwenLM/qwen-code/pull/17527)) and the [gap analysis on #18149](https://github.com/QwenLM/qwen-code/issues/18149#issuecomment-7156978186), and complements [Java control-plane multi-instance deployment](managed-agent-java-multi-instance.md).

## 1. Problem and Decision

The goal is a stateless Hosted Harness that also scales elastically. An instance holds a Session only while there is work for it, any instance can open any Session, a crash loses nothing the journal does not hold, and an autoscaler adds and removes instances as independently scheduled Pods. The question is which call direction gets there.

Three options were considered:

- **Option A, push behind a load balancer.** A load balancer in front of the Harness picks the instance. Dropped (§4): every gap it has to close exists only because the load balancer, not Java, picks the instance.
- **Option A0, Java-routed push.** What `main` does today. Java picks a pool member, records the placement in MySQL, routes later calls to the recorded owner, and, since [#18404](https://github.com/QwenLM/qwen-code/pull/18404), moves a released or departed Session to another member (§5).
- **Option B, pull scheduling.** Harness instances open outbound connections to Java and claim Session work when they have capacity. Java never calls a Harness (§6).

**Decision (proposed):**

1. **B is the end state.** Statelessness itself does not depend on the call direction. It comes from the journal, `wake` and placement release, which A0 already has. Elastic scaling does depend on it. A0 can add and remove instances once membership is dynamic, but it places Sessions without knowing capacity, needs every Java instance to reach every Harness, and has no queue to scale on (§9).
2. **A0 + P0 + P4 is the intermediate state and the rollback state.** P0, an SQL instance registry, and P4, event ingest from the Harness, are useful in both shapes. The P0 registry becomes the record of poller liveness and capacity in B, and P4 is part of B.
3. **No A0-only investment.** Load-aware member selection and re-placement after `hosted_session_open_busy` are not built in A0, because B replaces them. A network-addressable Harness listener is built only if independent Harness Pods are needed before P5 (§5.2).
4. **Order.** Migrate P0, P4, P1, P3, P5, P6, each behind a capability bit (§10). Independent, autoscaled Harness Pods become possible once P5 removes the last Java-to-Harness call.

## 2. Current State

### 2.1 How Java reaches a Harness

| Fact | Source |
| --- | --- |
| A pool is a static list of `instance-id` and `base-url` pairs. Discovery is already an interface that returns a snapshot of endpoints and whether the snapshot is current; configuration accepts only `static` | [`HarnessConfiguration.java:52-69`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/server/src/main/java/com/alibaba/qwen/code/managedagent/config/HarnessConfiguration.java#L52-L69), [`HarnessDiscovery.java`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/adapters/src/main/java/com/alibaba/qwen/code/managedagent/harness/HarnessDiscovery.java) |
| For each call, Java reads the Session's placement and routes to the recorded owner. With no placement, or with a released, quiescing or unreachable owner, it picks an accepting member round robin and runs the assign or takeover CAS | [`HarnessPoolConnector.java:286-337`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/adapters/src/main/java/com/alibaba/qwen/code/managedagent/harness/HarnessPoolConnector.java#L286-L337) |
| Every call carries a placement descriptor and a writer credential bound to tenant, Workspace, Session, instance, boot ID and placement epoch | [`HarnessPoolConnector.java:333-336`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/adapters/src/main/java/com/alibaba/qwen/code/managedagent/harness/HarnessPoolConnector.java#L333-L336), [`WriterCredentialPolicy.java:65`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/contracts/src/main/java/com/alibaba/qwen/code/managedagent/contracts/security/WriterCredentialPolicy.java#L65) |
| The Store checks that credential and the current placement on every writer operation | [`JdbcHarnessPlacementStore.java:225-248`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/persistence/src/main/java/com/alibaba/qwen/code/managedagent/persistence/JdbcHarnessPlacementStore.java#L225-L248) |
| Each pool member has its own client, and each client pins one boot ID; another process answers 409 `hosted_harness_generation_mismatch`. Only the single-address connector treats a new boot ID as its process being replaced; in pool mode a new boot is a different owner | [`hosted-harness-contract.ts:156-159`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/cli/src/serve/hosted-harness-contract.ts#L156-L159), [`QwenHostedHarnessConnector.java:2808-2811`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/adapters/src/main/java/com/alibaba/qwen/code/managedagent/harness/QwenHostedHarnessConnector.java#L2808-L2811) |
| A load or create must name the receiving process as writer and placement owner, or is refused | [`session-open.ts:709-729`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/cli/src/serve/hosted-harness-session/session-open.ts#L709-L729) |
| A pool refuses members whose negotiated capabilities differ, so all members run the same contract | [`HarnessPoolConnector.java:192-195`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/adapters/src/main/java/com/alibaba/qwen/code/managedagent/harness/HarnessPoolConnector.java#L192-L195) |
| The Harness binds only to loopback. Java accepts remote pool endpoints only with mTLS configured | [`hosted-harness-profile.ts:36-38`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/cli/src/serve/hosted-harness-profile.ts#L36-L38), [`HarnessPoolConnector.java:155`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/adapters/src/main/java/com/alibaba/qwen/code/managedagent/harness/HarnessPoolConnector.java#L155) |
| The Helm chart runs two pool members next to Java in one application Pod, on loopback, with one replica and the Recreate strategy ([#18444](https://github.com/QwenLM/qwen-code/pull/18444)) | [`deployment.yaml:6-16`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/deploy/kubernetes/chart/templates/deployment.yaml#L6-L16), [`README.md:289-291`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/deploy/kubernetes/README.md?plain=1#L289-L291) |

### 2.2 What is already durable

Most of what Java sends to a Harness already exists as a durable record before it is sent:

- **Turns** are `ma_turn` rows. A one-second sweep finds dispatchable rows and pushes them ([`HarnessCoordinator.java:249-261`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/control-plane/src/main/java/com/alibaba/qwen/code/managedagent/session/HarnessCoordinator.java#L249-L261)).
- **Approval decisions** are outbox operations, delivered and retried every second ([`ActionResponseCoordinator.java:63-73`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/control-plane/src/main/java/com/alibaba/qwen/code/managedagent/session/ActionResponseCoordinator.java#L63-L73)). Session messages, child results, automation fires and channel operations follow the same pattern through their own relays.
- **Wake inputs** are journal inputs with a seal-time wake stamp, found by `WakeRecovery` and the transport wake activator.
- **Events.** The Harness commits every event, including text deltas, to the journal in the Java-hosted Session Store. The Harness event stream is a projection of that journal ([`observation-routes.ts:273`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/cli/src/serve/hosted-harness-session/observation-routes.ts#L273)). Public clients read events from Java storage, never from the Harness.

### 2.3 What still needs the owner process

- 43 private `/session/:id/*` routes assume the Session is resident in the process being called.
- The running Turn's event stream is served from the owner's in-memory journal copy. Its event epoch is the owner's boot ID ([`hosted-harness-session.ts:113`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/cli/src/serve/hosted-harness-session.ts#L113)).
- Cancel aborts the Turn in the owner's memory. A resident approval wait is answered in the owner's memory.
- Side queries keep their execution in a process-local map, so their read and cancel must return to the same process ([`hosted-side-query.ts:387`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/cli/src/serve/hosted-side-query.ts#L387)).

### 2.4 A running Turn has two owners

Two processes hold state for a running Turn:

- The **Harness owner** holds the Session's writer lease and runs the loop (§2.3).
- The **Java dispatcher** that claimed the Turn holds its `dispatch_owner` lease ([`AgentTurnExecution.java:81-86`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/persistence/src/main/java/com/alibaba/qwen/code/managedagent/persistence/AgentTurnExecution.java#L81-L86)) and renews it ([`HarnessCoordinator.java:121-122`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/control-plane/src/main/java/com/alibaba/qwen/code/managedagent/session/HarnessCoordinator.java#L121-L122)). It keeps the Harness event stream open for the whole Turn and turns it into public events ([`HarnessCoordinator.java:934-968`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/control-plane/src/main/java/com/alibaba/qwen/code/managedagent/session/HarnessCoordinator.java#L934-L968)). If that Java instance dies, another instance's sweep picks the Turn up after the dispatch lease lapses and attaches to the stream again.

Much of the recent multi-instance work handles this second owner: reattaching Harness Sessions from another control plane ([#18433](https://github.com/QwenLM/qwen-code/pull/18433)), reading recovery status without an attachment ([#18440](https://github.com/QwenLM/qwen-code/pull/18440)), and resuming a Turn after Broker failover ([#18455](https://github.com/QwenLM/qwen-code/pull/18455)). Event ingest (P4) removes it under either option. A0 alone does not.

### 2.5 Stateless roadmap and pool status

- Phases 1 to 4 of the stateless design are merged, and Action parking (Phase 4) Stages 0 to 5 are implemented. Rollout measurements are still open. Server defaults keep SQL wake dispatch off ([`application.yml:47-48`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/server/src/main/resources/application.yml#L47-L48)); the Helm chart turns it on.
- **P2 of the first draft is done.** [#18404](https://github.com/QwenLM/qwen-code/pull/18404) releases the placement after a clean suspension or Action park, behind the `suspensionPlacementRelease` writer-grant capability, which is advertised only with wake dispatch. A healthy member can then take over while the old owner is still healthy. [#18443](https://github.com/QwenLM/qwen-code/pull/18443) ends the sealed writer's lease when a takeover consumes the release receipt. #18404 also adds a departed-placement reaper at the end of each pool refresh ([`HarnessPoolConnector.java:245-275`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/adapters/src/main/java/com/alibaba/qwen/code/managedagent/harness/HarnessPoolConnector.java#L245-L275)): an expired, wake-stamped suspension whose owner is absent from the snapshot, or known unreachable, moves to a healthy member through the existing takeover CAS, without opening an attachment.
- Running several Java instances is being built slice by slice: event-stream wake-up across instances by polling the SQL event tail every 200 ms ([#18431](https://github.com/QwenLM/qwen-code/pull/18431), [`EventTailPoller.java`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/control-plane/src/main/java/com/alibaba/qwen/code/managedagent/session/EventTailPoller.java)), terminal tickets in SQL ([#18426](https://github.com/QwenLM/qwen-code/pull/18426)), and the three slices in §2.4.

### 2.6 Remaining gaps

1. **Membership is static.** Every Java instance must hold the same member list, which static configuration can only promise.
2. **Boot-level reclamation.** The reaper excludes a configured instance that has any reachable incarnation. Placements left by an earlier boot of a still-configured instance wait for a request-driven takeover after the lease expires ([departed-placement reaper §9](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/docs/design/2026-11-26-managed-departed-placement-reaper.md#9-cost-and-follow-up)).
3. **Loopback only.** A Harness must share a network namespace with every Java instance that calls it, so Harness members live in the Java Pod, and the chart runs one replica.
4. **The Java-side owner of a running Turn** (§2.4).
5. **Placement is not capacity-aware.** Java selects round robin among accepting members ([`HarnessPoolConnector.java:296-307`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/adapters/src/main/java/com/alibaba/qwen/code/managedagent/harness/HarnessPoolConnector.java#L296-L307)) and records the placement before calling. The instance counters Java reads at each 5-second refresh ([`HarnessPoolConnector.java:125-131`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/adapters/src/main/java/com/alibaba/qwen/code/managedagent/harness/HarnessPoolConnector.java#L125-L131), [`hosted-harness-instance.ts:96`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/cli/src/serve/hosted-harness-instance.ts#L96)) are not used for selection. A member at its cold-open limit answers 409 `hosted_session_open_busy` ([`session-open.ts:1723-1726`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/cli/src/serve/hosted-harness-session/session-open.ts#L1723-L1726)). Java treats that as transient and retries ([`HarnessConflictCodes.java:23-26`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/contracts/src/main/java/com/alibaba/qwen/code/managedagent/contracts/session/HarnessConflictCodes.java#L23-L26)), and only a lost attachment or a transport failure makes it select again ([`HarnessPoolConnector.java:348-370`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/adapters/src/main/java/com/alibaba/qwen/code/managedagent/harness/HarnessPoolConnector.java#L348-L370)). The Session therefore waits for the busy member, and an idle new instance does not take the work.

## 3. Reference: Claude Managed Agents

### 3.1 What is published

| Topic | Published behavior |
| --- | --- |
| Split | A session is "the append-only log of everything that happened", a harness is the loop that calls Claude and routes tool calls, a sandbox executes code |
| Stateless harness | "nothing in the harness needs to survive a crash"; a new harness resumes with `wake(sessionId)`, `getSession(id)`, writes with `emitEvent(id, event)` and reads positional slices with `getEvents()` |
| Scheduling | "Inference could start as soon as the orchestration layer pulled pending events from the session log"; p50 TTFT dropped about 60% and p95 over 90% once containers were no longer set up first |
| Client API | Clients append events (`user.message`, `user.interrupt`, `user.tool_confirmation`, `user.custom_tool_result`) and read a stream or a list. Events sent while running are queued; reconnecting means listing history, tailing the stream and deduplicating by event ID |
| Waits | With `always_ask`, the session goes `idle` with `stop_reason` `requires_action` and the blocking `event_ids`; "The session waits indefinitely for a response" |
| Session states | `idle`, `running`, `rescheduling` ("Transient error occurred, retrying automatically"), `terminated` |
| Tools and credentials | Each sandbox is a tool, `execute(name, input) → string`; a dead container is returned to Claude as a tool error. MCP goes through a proxy that fetches credentials from a vault; "The harness is never made aware of any credentials" |
| Self-hosted workers | Outbound HTTPS only. A worker long-polls `GET /v1/environments/{id}/work/poll`, acknowledges a work item to take it off the queue, renews a lease with an `expected_last_heartbeat` precondition (412 when "another worker may hold the lease"), and posts results back as events. Unacknowledged items are reclaimed after 5 seconds by default. "Work items are queued when sessions are created or when long-dormant sessions receive new messages" |

### 3.2 What is not published

How the harness tier ensures a single writer, who calls `wake`, how a harness is chosen, request affinity, what happens to an in-flight tool call when a harness dies mid-Turn, and whether a waiting session holds compute. The blog says containers are created lazily on first use. The sessions page says the sandbox starts provisioning when the session is created. The two may describe different points in time.

### 3.3 What this design takes from it

1. Clients and the control plane never address a harness by process. They write durable work, and whichever harness holds the session consumes it. A0 meets this through placement routing, B through claims.
2. The scheduling unit is the session, held under a renewable lease and given back. Both options use the existing writer lease and placement.
3. A wait is a state of the session log, not a resident process. This is Phase 4, Action parking.
4. The published pull API is the one for self-hosted workers, which run where Anthropic cannot open connections. How the internal harness tier is scheduled is not published beyond the sentence above (§3.2). Statelessness comes from the session log and `wake`, not from the call direction. This design chooses pull for elastic scaling (§9).

## 4. Option A: Push Behind a Load Balancer (Dropped)

With a load balancer in front of the Harness, any instance can receive a call for any Session. That creates three gaps: owner routing (forwarding, redirects or consistent hashing to reach the live writer), Session-scoped fencing (moving the expected boot ID from the client to the Session reference), and writer grants that do not name an instance (a claim ticket exchanged at `writers:acquire`).

A0 has none of these gaps, because Java, not a load balancer, picks the instance (§5.1). A load balancer adds nothing that Java's selection does not already do, while adding a forwarding layer that must carry SSE without buffering and must not retry mutations. B does not need a claim ticket either, because the poll response carries the grant after the claim CAS. The first draft's P0 claim-ticket item is therefore dropped.

## 5. Option A0: Java-Routed Push (Intermediate State)

### 5.1 What it already provides

- **Owner routing.** Java reads the placement on every call and sends the call only to the recorded owner. No forwarding or Session-scoped fencing is needed.
- **Movement.** A released placement goes to any accepting member on its next call. A departed owner's expired suspension moves at the next refresh.
- **Fencing.** Placement epoch and writer generation in the Store, unchanged.

### 5.2 What the intermediate state needs

1. **The Phase 1–4 rollout.** The measurement gates decide how short the idle period can become, and a short idle period is what turns placement stickiness into cache affinity. This is independent of the call direction.
2. **P0, an SQL instance registry.** Implement `HarnessDiscovery` over a registry table:
   - Each Harness registers its instance ID, base URL, boot ID, accepting state and free capacity on a private Java route, and renews a heartbeat measured in database time. It already holds an authenticated outbound connection to Java for the Session Store.
   - The snapshot lists rows with a live heartbeat. When the query fails, the snapshot is not current. Refresh then withholds new placements and skips the reaper, as it already does for a non-current snapshot, while calls to existing owners continue.
   - Every Java instance reads the same table, so all of them see the same member list.
   - A departed instance drops out of the snapshot, and the existing reaper picks up its suspended placements. Because each row carries a boot ID, the reaper's exclusion can be narrowed from instance IDs to instance-and-boot pairs. That closes the boot-level reclamation gap under the same expiry proof.
   - Java sends Session credentials to a registered URL, so registration must be authenticated per instance and bound to the instance ID, preferably through mTLS.
   - In B the same table records poller liveness and capacity, refreshed by polling instead of a separate heartbeat. P0 is not discarded.
3. **Optional bridge: a network-addressable Harness.** Needed only if independent Harness Pods are required before P5. Either allow a non-loopback bind with mTLS on the Harness, or put a TLS proxy in front of each instance; Java already requires mTLS for remote endpoints. P6 removes it.
4. **Not built.** Load-aware member selection and re-placement after `hosted_session_open_busy` would rebuild in Java what capacity-gated claims give B (§9), so A0 keeps round robin.

### 5.3 Limits

- Sessions are placed without knowing member capacity (§2.6).
- Every Java instance must be able to reach every Harness instance.
- The Harness keeps an inbound listener for 43 private routes.
- The Java-side owner of a running Turn remains until P4.
- In exchange, cancel, decisions and reads stay one direct call.

## 6. Option B: Pull Scheduling (End State)

### 6.1 Model

A **Session work item** says "Session S has work". It is derived from the durable records in §2.2; it is not a new copy of them. A Harness instance runs one worker loop:

1. **Poll.** Long-poll Java with its identity, protocol version, capability digest and free capacity.
2. **Claim.** For an unclaimed Session, Java runs the placement assign or takeover CAS for the poller, using today's rules. It then returns the Session descriptor and a writer grant in today's token format.
3. **Run.** Load the Session, take its pending work from the journal and the operation records, and execute.
4. **Report.** Post operation completions and events to Java (§7).
5. **Release.** When idle, suspend and release the placement with a receipt (#18404), so that any instance can claim the Session next.

While a Session is held, Java delivers new work for it to the holder through the same long-poll (§6.4). Work for a Session held by another live writer is never handed to a different instance.

### 6.2 Work sources

| Work kind | Durable source today | Change |
| --- | --- | --- |
| Turn | `ma_turn` dispatchable rows | Sweep marks the Session as having work instead of pushing |
| Approval or question decision | Action response operations | Holder reads the decision; parked Turns resume on claim as today |
| Session message, child result, automation fire, channel operation | Relay operations | Same as decisions |
| Wake input | Journal input plus seal-time wake stamp | Wake scan marks work instead of calling `activateForWake` |
| Cancel and mode change | Turn status `CANCELLING`, Session selection revision | Delivered as a signal to the holder (§6.4) |
| Close, delete, archive | Lifecycle operations with claims | Lifecycle operation becomes a work item with its claim |
| Synchronous reads and management (status, transcript, MCP or extension management, client files, side queries) | Request and response today | Served by Java from SQL and the journal where possible, as the recovery views already are (#18440); a request item with a reply slot for the rest |

### 6.3 Claim, lease and grant

- **Claim** is the existing placement CAS, now run when a Harness polls instead of when Java picks a member. The takeover rules are unchanged: either a released placement with a receipt, or a lapsed writer lease with a known activation. A refusal means the Session is still held, so the item stays with its holder.
- **Grant.** The poll response carries the existing placement-bound writer token. The Store keeps checking it on every writer operation, so `JournalFencing` and `requireCurrent` do not change.
- **Lease.** The writer lease (`writers:renew`, 60 seconds by default) is the claim lease. No second lease is introduced. Claude's `expected_last_heartbeat` precondition corresponds to today's writer generation check.
- **Writer identity** stays the boot ID. The Turn's `bindHarness(bootId)` still records which process runs the Turn, and a change of process still goes through recovery.

### 6.4 Signals to the holder

- **Wakeup.** The poll lists the Sessions the instance holds, and Java answers early when any of them gets work. With one Java instance this is an in-process wakeup. With several, the Java instance holding the poll learns of work written elsewhere the way #18431 streams learn of events: one batched SQL query, every few hundred milliseconds, over the work watermarks of the Sessions its pollers hold. LiteTopic, which has no TypeScript consumer, is not needed.
- **Bounded fallback.** A missed signal is caught by a periodic recheck of held Sessions, so lost signals cost latency, never correctness.
- **Cancel** is the latency-sensitive case. It is a durable `CANCELLING` status plus a signal. The holder aborts on the signal, and the fallback bounds the worst case. Claude documents the same effect: an interrupt can take longer to apply while tools run.

### 6.5 Completions, fencing and compatibility

- **Completions.** The holder posts the answer it returns today to `operations/{id}:complete`, fenced by its writer token. The existing operation IDs keep this idempotent.
- **Fencing.** Correctness rests on the writer lease generation and the placement epoch, both already enforced by the Store. No request is fenced by which process answered.
- **Compatibility.** Java checks the poller's protocol version and capability digest at poll time, and an incompatible poller receives no work. Unlike today's homogeneous pool (§2.1), this allows mixed versions during a rolling upgrade, with each work kind gated by the versions able to run it. The cross-version contract itself still has to be defined.

### 6.6 Capacity, drain and security

- An instance polls only for work it can take. The cold-open limit and active Turn count become poll admission. Java hands out new Sessions round robin across tenants, as the shared Harness design requires. Queue depth, oldest pending work and polling instances become scaling signals, like Claude's `work/stats`.
- **Drain.** Stop claiming new Sessions, keep serving held ones, and release each as it goes idle. A timed-out drain falls back to crash recovery. No inbound drain route is needed.
- **Security.** The Harness opens no listener, so the loopback-only binding and per-instance TLS proxies are no longer needed. The Harness authenticates to Java with an instance identity, preferably mTLS with the instance ID in the certificate. Grants are issued per claim, so a credential exists only for Sessions the instance holds.

### 6.7 Failure semantics

| Failure | Behavior |
| --- | --- |
| Holder dies | Its leases lapse; the Sessions become claimable; recovery runs through today's takeover and G3 continuation paths |
| Java restarts | Work is durable; instances re-poll and renew; held Sessions keep their writer until their lease lapses |
| Completion reply lost | The holder retries the completion under the same operation ID |
| Signal lost | The periodic recheck delivers the work later |
| Claim races | The placement CAS admits one claimer; others get no item |

## 7. Event Ingest (P4)

P4 changes only how Java receives a running Turn's events. It does not depend on who starts the Turn, so it applies to A0 and B alike.

- **Today.** The Java dispatcher reads the Harness event stream for the whole Turn (§2.4).
- **Change.** The Harness posts the envelopes it streams today, batched and keyed by journal sequence, to an ingest route on any Java instance, fenced by its writer token. The coordinator's stream-consumption logic becomes that route's handler. Duplicates are dropped by sequence, and an envelope whose event epoch differs from the Turn's bound Harness is refused, as the stream consumer refuses it today ([`HarnessCoordinator.java:948`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/control-plane/src/main/java/com/alibaba/qwen/code/managedagent/session/HarnessCoordinator.java#L948)). The terminal event settles the Turn, as the end of the stream does today.
- **Effect.** No Java instance has to stay attached for a Turn's lifetime. The dispatch lease can shrink to covering admission. A Java instance that dies mid-Turn needs no reattach, and any instance behind a load balancer can accept the events. A Harness crash is still handled by the writer lease and recovery.
- **Later alternative.** Java projects public events directly from the journal commits it already receives on the Store route. That removes the ingest hop but duplicates the TypeScript projection in Java (§11).

## 8. Comparison

| Concern | A0: Java-routed push | B: pull |
| --- | --- | --- |
| Reaches the stateless end state | Yes, with P0 and the Phase 1–4 rollout | Yes, with the same prerequisites plus the protocol move |
| Membership | SQL registry (P0) | The same registry, kept current by polling |
| Capacity-aware placement | No: round robin, placement recorded before the call | Yes: an instance claims only when it has capacity |
| A new instance takes work | Only new or released Sessions, when round robin reaches it; a Session placed on a busy member waits for it | Immediately: it claims the oldest pending work |
| Autoscaling signal | Derived from placements and instance counters | Queue depth and oldest pending work |
| Harness inbound listener | Required, behind mTLS once off-Pod | None |
| Java-to-Harness reachability | Every Java instance must reach every Harness | Harness reaches Java through a load balancer |
| Owner routing | Done by Java from the placement | Not needed: work goes to the holder |
| Fencing change | None | None |
| Java-side owner of a running Turn | Removed by P4 | Removed by P4, which B includes |
| Cancel and decision latency | One direct call | Signal plus fallback, within the P3 budget |
| Synchronous reads | Unchanged | Java-side reads or request items |
| Rolling upgrade | Homogeneous pool | Work gated by poller version; contract undefined |
| Size of change | Small: one registry and one registration route | Large: 43 routes over P1, P3, P5 and P6 |

## 9. Why Pull Is the End State

A0 can scale. With P0, a new instance joins without a configuration change and starts taking new Sessions within one refresh, and drain, suspension release and the reaper handle removal. It scales poorly for three reasons, all of which come from Java choosing the instance before knowing whether that instance can take the work:

1. **Capacity.** A0 records the placement first and calls second, round robin (§2.6). A busy member refuses with `hosted_session_open_busy`, the Session waits on it, and a newly added idle member gets nothing until round robin reaches it with a new Session. Fixing this in A0 needs load reports in the registry, load-aware selection and re-placement after a refusal: a second scheduler in Java. In B an instance claims only when it has capacity, so a new instance starts on the oldest pending work, and a full one simply stops claiming.
2. **Connectivity.** A0 needs every Java instance to reach every Harness instance over mTLS, so autoscaled Harness Pods need addresses, certificates and registrations that every Java instance trusts. In B each Harness opens outbound connections to Java through one load balancer. A customer-hosted Harness needs the same, which is the constraint Claude's self-hosted workers answer with outbound-only polling.
3. **Scaling signal.** In B the pending-work queue is the autoscaling metric, through its depth and the age of its oldest item, like Claude's `work/stats`. In A0 the metric has to be derived from placements and instance counters.

Removal is about equal: A0 drains, B stops claiming, and both release placements as Sessions go idle. Running Sessions stay with their holder in both, so rebalancing existing load relies on the stateless roadmap's short idle release, not on the call direction.

P3's latency budget for cancel and decisions is an exit criterion of P3, not a condition for choosing B.

## 10. Migration Plan

Each phase is behind a capability bit, and push and pull coexist until P6. Until then, rolling a phase back turns its bit off and returns that work kind to push. Every claim from P1 on is gated by the poller's free capacity.

| Phase | Change | Role in the end state | Exit criteria | Status |
| --- | --- | --- | --- | --- |
| P2 | Release the placement on clean suspension and park; reaper for departed instances | Kept | A released Session is claimed by any member without waiting for its lease | Done (#18404, #18443); boot-level reclamation moves to P0 |
| P0 | SQL instance registry as `HarnessDiscovery`, with authenticated self-registration; reaper exclusion by instance and boot | Kept as the record of poller liveness and capacity | Instances join and leave without a Java configuration change; all Java instances see one list; earlier-boot placements are reclaimed; the static pool still works | Proposed |
| P4 | Event ingest from the Harness (§7) | Kept | Public events identical to today for the same journal; killing the dispatching Java instance mid-Turn needs no stream reattach | Proposed |
| P1 | Pull for work that already goes to any instance: wake inputs, parked decisions, relay deliveries to suspended Sessions | Kept | These paths never call a Harness; same outcomes on real-process MySQL tests | |
| P3 | Signals and pull for resident work: Turns, decisions, cancel, messages | Kept | Cancel and decision latency within a budget measured against today's direct calls; a full instance receives no new Session while another has capacity | |
| P5 | Reads served by Java from SQL and the journal; request items for the remaining management routes and side queries | Kept | Every `/session/:id/*` route has a pull or Java-side equivalent; Harness Pods can be scheduled independently of Java | |
| P6 | Remove push routes, the static pool and any optional listener bridge | — | A Harness with no private listener passes the full suite; scaling on queue depth adds and removes instances | |

## 11. Risks and Open Questions

1. **Registry trust (P0).** A registered base URL receives Session credentials. Registration must be authenticated per instance and bound to the instance ID.
2. **Ingest ordering and fencing (P4).** Per-Session order, the event-epoch check, retries after a lost acknowledgement, and retraction handling must match today's stream consumer exactly.
3. **Event projection.** Harness ingest keeps one projection implementation. Projecting in Java removes a hop but duplicates logic across languages.
4. **Latency (P3).** Cancel, decisions and the first event go through a signal. They are measured against today's direct calls as P3's exit criterion.
5. **Signal cost with several Java instances.** The SQL watermark poll costs one query per instance per tick. #18431 notes that index use at production scale is unmeasured for its event-tail query; the same applies here.
6. **Protocol size.** 43 routes move. The phases must stay small enough to review.
7. **Interim scaling.** Until P5, Harness Pods cannot be scheduled independently of Java unless the optional listener bridge is built, and P6 discards that bridge.
8. **Capacity accounting.** The free capacity a poller reports must cover cold opens, active Turns and held Runtimes. Otherwise claims overload an instance just as round robin does.
9. **Roadmap gates.** The stateless roadmap's measurement gates still decide how short the idle period can become. Neither option makes cold opens cheaper.
10. **Fairness.** A tenant flooding work must not starve others at claim time.

## 12. Acceptance Criteria

Intermediate state (Phase 1–4 rollout, P0, P4):

1. Adding or removing a Harness instance needs no Java configuration change, and every Java instance sees the same members.
2. Killing a Harness instance moves its Sessions to other members after the lease lapses, with no replayed tool call. An idle-released Session moves on its next request.
3. Placements left by an earlier boot of a restarted instance are reclaimed by the reaper under the same expiry proof.
4. Killing the Java instance that dispatched a running Turn leaves the Turn completed and its public events identical, with no stream reattach.

End state (B):

5. A Harness with no private listener serves a Session end to end: create, Turn, approval, cancel, close.
6. A newly started instance claims pending work without a Java configuration change, and a full instance receives no new Session while another has capacity.
7. Scaling on queue depth adds and removes instances under load, with no lost or replayed work.
8. An incompatible poller receives no work.
9. Cancel and decision latency stay within the budget set in P3.

Every phase passes the real-process MySQL 8.4 suites, not only unit or H2 tests.

## 13. Changes From the First Draft

- B stays the end state. The case for it now rests on elastic scaling (capacity, connectivity, scaling signal) rather than on statelessness, which A0 also reaches.
- Option A is dropped. A0, the code on `main`, is the intermediate and rollback state.
- P2 is marked done, and boot-level reclamation moves into P0.
- P0 is an SQL instance registry that B keeps as the record of poller liveness. It no longer includes a claim ticket at acquire, since neither A0 nor B lets a third party pick the instance.
- P4 moves before P1, and §7 explains why it is independent of the call direction.
- P5 prefers Java-side reads over request items.
- No capacity work is done in A0, and the off-Pod listener is an optional bridge.
- The multi-Java risk is rewritten: the slices are merging, and signals can reuse SQL watermark polling instead of LiteTopic.
- Current-state references move to `afcc98595a`, and the route count is corrected to 43.

## 14. Sources

- [Scaling Managed Agents: Decoupling the brain from the hands](https://www.anthropic.com/engineering/managed-agents)
- [Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview)
- [Session event stream](https://platform.claude.com/docs/en/managed-agents/events-and-streaming)
- [Session operations](https://platform.claude.com/docs/en/managed-agents/session-operations)
- [Permission policies](https://platform.claude.com/docs/en/managed-agents/permission-policies)
- [Sessions](https://platform.claude.com/docs/en/managed-agents/sessions)
- [Self-hosted sandboxes](https://platform.claude.com/docs/en/managed-agents/self-hosted-sandboxes)
- [Self-hosted workers](https://platform.claude.com/docs/en/managed-agents/self-hosted-sandboxes-workers)
- [Environments work API](https://platform.claude.com/docs/en/api/beta/environments/work)
- [Stateless Hosted Harness design](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/docs/design/2026-11-16-managed-stateless-harness.md)
- [Shared Harness design](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/docs/design/2026-10-21-managed-shared-harness.md)
- [Suspension placement release](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/docs/design/2026-11-26-managed-suspension-placement-release.md)
- [Departed-placement reaper](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/docs/design/2026-11-26-managed-departed-placement-reaper.md)
- [Cross-instance event stream wake-up](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/docs/design/2026-11-26-managed-cross-instance-sse.md)
- [Control-plane attachment recovery](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/docs/design/2026-11-26-managed-control-plane-attachments.md)
- [Helm Harness pool](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/docs/design/2026-11-26-managed-agent-helm-harness-pool.md)
