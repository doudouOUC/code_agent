# Managed Agent Harness Scheduling: From Java-Routed Push to Pull

[English](managed-agent-harness-pull-scheduling.md) | [简体中文](managed-agent-harness-pull-scheduling.zh-CN.md)

Personal design proposal, first drafted on 2026-11-25 and revised on 2026-11-27. Upstream submission is pending. The scheduling paths were rechecked against QwenLM/qwen-code `main` at [`d1a313445a`](https://github.com/QwenLM/qwen-code/commit/d1a313445aee7848e45a8d819a2b81752ff9f686). The P4 paths in §7 were rechecked against [`099ce50da2`](https://github.com/QwenLM/qwen-code/commit/099ce50da29f0c793f7e8c56028ff17417505591) and have not changed since `d1a313445a`. The November 26 source links retain their original snapshot (`afcc98595a`). §12 describes proposed acceptance tests. This proposal builds on the stateless Hosted Harness design ([#17527](https://github.com/QwenLM/qwen-code/pull/17527)) and [the gap analysis on #18149](https://github.com/QwenLM/qwen-code/issues/18149#issuecomment-7156978186), and complements [Java control-plane multi-instance deployment](managed-agent-java-multi-instance.md).

## 1. Problem and Decision

The goal is a stateless Hosted Harness that also scales elastically. An instance holds a Session only while there is work for it, any instance can open any Session, a crash loses nothing the journal does not hold, and an autoscaler adds and removes instances as independently scheduled Pods. The question is which call direction gets there.

Three options were considered:

- **Option A, push behind a load balancer.** A load balancer in front of the Harness picks the instance. Dropped (§4): every gap it has to close exists only because the load balancer, not Java, picks the instance.
- **Option A0, Java-routed push.** What `main` does today. Java picks a pool member, records the placement in MySQL, routes later calls to the recorded owner, and, since [#18404](https://github.com/QwenLM/qwen-code/pull/18404), moves a released or departed Session to another member (§5).
- **Option B, pull scheduling.** Harness instances open outbound connections to Java and claim Session work when they have capacity. Java never calls a Harness (§6).

**Decision (proposed):**

1. **Choose B for an independently autoscaled Harness pool.** A Harness with a free slot can claim runnable work immediately. If the deployment only needs failover among a fixed set of members, A0 already routes to the owner and supports safe handoff after a clean release. Both designs recover through the journal, `wake` and placement fencing (§5, §9).
2. **A0 + P4 is the intermediate state and the rollback state.** P4, event ingest from the Harness, is part of B, and under either option it removes the Java instance that has to stay attached to a running Turn (§2.4, §7).
3. **No A0-only investment.** Load-aware member selection and re-placement after `hosted_session_open_busy` are not built. An SQL instance registry and a network-addressable Harness listener are built only as an optional bridge, if independent Harness Pods are needed before P5 (§5.2). B needs neither (§6.8).
4. **Order.** Migrate P4, P1, P3, P5 and P6 behind capability bits (§10); P1 depends on P4 (§7). Before scaling Harness Pods separately, remove the remaining Java-to-Harness calls or enable the A0 bridge, and establish cross-Pod access to the Session Store and any enabled Runtime Broker (§12).
5. **No message queue.** B runs on SQL and HTTP. Where a broker is already deployed it can carry wake-up hints, but not requests or results (§6.9).

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
- The **Java dispatcher** that claimed the Turn holds its `dispatch_owner` lease ([`AgentTurnExecution.java:81-86`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/persistence/src/main/java/com/alibaba/qwen/code/managedagent/persistence/AgentTurnExecution.java#L81-L86)) and renews it ([`HarnessCoordinator.java:286-297`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/control-plane/src/main/java/com/alibaba/qwen/code/managedagent/session/HarnessCoordinator.java#L286-L297)). It keeps the Harness event stream open for the whole Turn and turns it into public events ([`HarnessCoordinator.java:934-968`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/control-plane/src/main/java/com/alibaba/qwen/code/managedagent/session/HarnessCoordinator.java#L934-L968)). If that Java instance dies, another instance's sweep picks the Turn up after the dispatch lease lapses and attaches to the stream again.

Much of the recent multi-instance work handles this second owner: reattaching Harness Sessions from another control plane ([#18433](https://github.com/QwenLM/qwen-code/pull/18433)), reading recovery status without an attachment ([#18440](https://github.com/QwenLM/qwen-code/pull/18440)), and resuming a Turn after Broker failover ([#18455](https://github.com/QwenLM/qwen-code/pull/18455)). [#18463](https://github.com/QwenLM/qwen-code/pull/18463) also covers an interrupted Broker status poll. A surviving Harness and original Runtime Worker can recover the result using the same execution ID and dispatch generation. If the Worker cannot confirm the outcome, the Broker leaves the record pending. Java still dispatches the Turn.

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
4. Anthropic documents outbound polling for self-hosted **sandbox workers**, which execute tool calls. Its Harness article describes recovery from a Session log. The internal Harness placement algorithm remains unpublished (§3.2). For capacity-driven scheduling, the closer precedent is Temporal’s worker slots (§6.6).

## 4. Option A: Push Behind a Load Balancer (Dropped)

With a load balancer in front of the Harness, any instance can receive a call for any Session. That creates three gaps: owner routing (forwarding, redirects or consistent hashing to reach the live writer), Session-scoped fencing (moving the expected boot ID from the client to the Session reference), and writer grants that do not name an instance (a claim ticket exchanged at `writers:acquire`).

A narrower push variant would put only a new `/work` notification behind the load balancer. The receiving Harness would claim through the Store. This can work when the network requires push, but it also needs a protocol for a busy recipient, duplicate delivery and signals to the live owner. A0 already provides owner routing. For an elastic pool, proceed directly to B and issue the writer credential to the successful poller.

## 5. Option A0: Java-Routed Push (Intermediate State)

### 5.1 What it already provides

- **Owner routing.** Java reads the placement on every call and sends the call only to the recorded owner. No forwarding or Session-scoped fencing is needed.
- **Movement.** A released placement goes to any accepting member on its next call. A departed owner's expired suspension moves at the next refresh.
- **Fencing.** Placement epoch and writer generation in the Store, unchanged.

### 5.2 What the intermediate state needs

1. **The Phase 1–4 rollout.** The measurement gates decide how short the idle period can become, and a short idle period is what turns placement stickiness into cache affinity. This is independent of the call direction.
2. **P4, event ingest** (§7).
3. **Optional: boot-level reclamation.** Java knows the boot ID each reachable member negotiated, because its member map is keyed by instance and boot. The reaper can therefore exclude only a configured instance's current boot instead of the whole instance, under the same expiry proof and without a registry. Request-driven takeover after lease expiry already keeps these Sessions correct, so the change only cleans up earlier.
4. **Optional bridge: dynamic membership outside the Java Pod.** Needed only if independent Harness Pods are required before P5. Inside the Java Pod the Pod spec fixes the members, so the two parts only make sense together:
   - **An SQL instance registry as `HarnessDiscovery`.** Each Harness registers its instance ID, base URL, boot ID and accepting state on a private Java route, and renews a heartbeat measured in database time. The snapshot lists rows with a live heartbeat. When the query fails, the snapshot is not current; refresh then withholds new placements and skips the reaper, as it already does for a non-current snapshot, while calls to existing owners continue. Every Java instance reads the same table, so all of them see the same members, and a departed instance drops out of the snapshot for the existing reaper. Java sends Session credentials to a registered URL, so registration must be authenticated per instance and bound to the instance ID, preferably through mTLS.
   - **A network-addressable Harness.** Either allow a non-loopback bind with mTLS on the Harness, or put a TLS proxy in front of each instance. Java already requires mTLS for remote endpoints.
   - P6 removes both. B needs neither (§6.8).
5. **Not built.** Load-aware member selection and re-placement after `hosted_session_open_busy` would rebuild in Java what capacity-gated claims give B (§9), so A0 keeps round robin.

### 5.3 Limits

- Sessions are placed without knowing member capacity (§2.6).
- Membership stays static unless the optional bridge is built.
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
- **Lease.** B uses the writer lease (`writers:renew`, 60 seconds by default) as the Session execution lease. Placement assignment and writer acquisition are separate operations today. Losing the poll response before acquisition must allow a retry to discover the current placement or qualify for takeover. The Turn dispatch lease and the Action operation claim generation protect different writes today. Each migrating path must preserve those checks or replace them with an equivalent fence. [Placement takeover](https://github.com/QwenLM/qwen-code/blob/d1a313445aee7848e45a8d819a2b81752ff9f686/packages/managed-agent-server/persistence/src/main/java/com/alibaba/qwen/code/managedagent/persistence/JdbcHarnessPlacementStore.java#L181-L247) · [Writer acquisition](https://github.com/QwenLM/qwen-code/blob/d1a313445aee7848e45a8d819a2b81752ff9f686/packages/managed-agent-server/persistence/src/main/java/com/alibaba/qwen/code/managedagent/persistence/JournalWriterLifecycle.java#L143-L194) · [Action claim renewal](https://github.com/QwenLM/qwen-code/blob/d1a313445aee7848e45a8d819a2b81752ff9f686/packages/managed-agent-server/control-plane/src/main/java/com/alibaba/qwen/code/managedagent/session/ActionResponseCoordinator.java#L74-L92)
- **Writer identity** stays the boot ID. The Turn's `bindHarness(bootId)` still records which process runs the Turn, and a change of process still goes through recovery.

### 6.4 Signals to the holder

- **Wakeup.** The poll lists the Sessions the instance holds, and Java answers early when any of them gets work. With one Java instance this is an in-process wakeup. With several, the Java instance holding the poll learns of work written elsewhere the way #18431 streams learn of events: one batched SQL query, every few hundred milliseconds, over the work watermarks of the Sessions its pollers hold. A message queue is not needed; where one is deployed, a per-Session LiteTopic can carry the same hint (§6.9).
- **Bounded fallback.** A missed signal is caught by a periodic recheck of held Sessions, so lost signals cost latency, never correctness.
- **Cancel** is the latency-sensitive case. It is a durable `CANCELLING` status plus a signal. The holder aborts on the signal, and the fallback bounds the worst case. Claude documents the same effect: an interrupt can take longer to apply while tools run.

### 6.5 Completions, fencing and compatibility

- **Completions.** The holder posts the answer it returns today to `operations/{id}:complete`, fenced by its writer token. The existing operation IDs keep this idempotent.
- **Fencing.** Correctness rests on the writer lease generation and the placement epoch, both already enforced by the Store. No request is fenced by which process answered.
- **Compatibility.** Java checks the poller's protocol version and capability digest at poll time, and an incompatible poller receives no work. Unlike today's homogeneous pool (§2.1), this allows mixed versions during a rolling upgrade, with each work kind gated by the versions able to run it. The cross-version contract itself still has to be defined.

### 6.6 Capacity, drain and security

- Free cold-open and active-Turn slots gate **new** Session claims. A full or draining instance keeps polling for cancellation, approval and other signals for Sessions it already holds. Allocate new work fairly across tenants. Temporal uses worker slots to decide when to poll for new tasks, a useful precedent for this part of the protocol. [Temporal Worker performance](https://docs.temporal.io/develop/worker-performance)
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

### 6.8 What B does not need

- **No instance registry.** Each poll carries the instance identity, authenticated through mTLS, with its protocol version, capability digest, free capacity and the Sessions it holds. Liveness is the per-Session writer lease that the Store already keeps, and the rule that a held Session's work never goes to another instance checks that lease, not whether an instance is registered.
- **No reaper.** A Session with new work becomes claimable by any poller under the existing takeover proof. A stale placement of a Session without work is harmless until work arrives. Boot-level reclamation needs nothing either.
- A table of each instance's last poll time can serve dashboards. Correctness does not depend on it.

### 6.9 A message queue as transport (alternative)

A variant replaces long-polls with a message queue: Java publishes requests to one queue, Harness instances consume them, and results return through a second queue that Java consumes. It keeps B's benefits (an outbound-only Harness, consumption gated by capacity, the backlog as a scaling metric), but it cannot be the scheduler:

1. **Session-bound work.** Cancel, decisions and messages for a running Turn, and reads of resident state, must reach the writer-lease holder (§2.3). Competing consumers deliver them to any instance. Partitioning by Session keeps a Session on one consumer, but consumer rebalancing and the writer lease are two independent ownerships that disagree during scaling and crashes. Ordered consumption also serializes a queue, so a Turn that runs for minutes blocks the other Sessions on it. One LiteTopic per Session avoids the blocking, but subscribing to it after a claim is B's claim-then-deliver, and the claim is still a MySQL CAS.
2. **Acknowledgement timing.** MQ3 measured that a crashed consumer's unacknowledged message moves to another member only after the broker expires the client, after 121 to 129 seconds locally, with the topic's later messages waiting behind it ([MQ3 finding 1](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/docs/design/2026-10-14-managed-agent-event-transport-mq3.md#findings)). Acknowledging after the Turn stalls the Session that long after a crash. Acknowledging on receipt loses the message on a crash, and recovery comes from SQL.
3. **Delivery is at least once, ordered or not.** Redelivery after a crash or an acknowledgement timeout, a queue lock expiring during rebalance, a producer retry after a timed-out send, and broker failover all duplicate messages. The [event transport design](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/docs/design/2026-10-04-managed-agent-event-transport.md) already requires idempotent consumers (invariant 5) and does not rely on ordered delivery for correctness. Even exactly-once delivery would not cover side effects outside the broker: model calls, tool executions, file edits and Store writes. The Store, journal and Worker evidence govern retries. Writer generation and placement epoch fence stale processors, operation IDs make completions idempotent, and the tool execution ledger keeps the execution ID and dispatch generation, so recovery queries the Worker instead of executing again. Recovery resumes from the journal, not from the request.
4. **Two writes.** Turns, decisions and operations must be in SQL first: the public API reads them, and single-writer and idempotency checks depend on them. Publishing them to a queue is a second write that needs an outbox. MQ3 also found no producer retry buffer, so envelopes sent during a long broker outage are dropped ([MQ3 finding 2](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/docs/design/2026-10-14-managed-agent-event-transport-mq3.md#findings)). Results posted to a queue still have to be written to SQL with fencing by whichever Java instance consumes them, so a result queue only adds a hop.
5. **Infrastructure.** Event transport is off by default ([`EventTransportConfiguration.java:56-57`](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/packages/managed-agent-server/server/src/main/java/com/alibaba/qwen/code/managedagent/config/EventTransportConfiguration.java#L56-L57)), the Helm deployment has no broker, a node cannot start while the broker is down ([MQ3 finding 3](https://github.com/QwenLM/qwen-code/blob/afcc98595ac61e330021ad325d0ef914eb46ce80/docs/design/2026-10-14-managed-agent-event-transport-mq3.md#findings)), and the TypeScript side has no consumer.

Where a broker is already deployed, it can carry hints. A shared "Session has work" topic carries only tenant and Session; an instance with capacity consumes a hint, claims through Java, and acknowledges whether or not the claim succeeds. A per-Session LiteTopic carries the holder's wake-ups. Requests, results and events stay in SQL and HTTP, and a lost or late hint costs only latency. B therefore defines wake-up as an interface whose default implementation is SQL watermark polling, with LiteTopic as an optional implementation.

## 7. Event Ingest (P4)

P4 moves event delivery and its authorization off the dispatching Java instance. The same change applies whether Java pushes the Turn or a Harness claims it.

It must also land before P1. P1 requires that a Harness can claim a parked Session and continue the original Turn without Java calling it. Today the continued Turn's events and its terminal settlement are recorded only by the dispatcher that reopened the stream after claiming the Turn. Without P4, Java would still have to reach the claimer to pull that stream.

- **Current transaction.** Java locks the Session and Turn, checks the dispatch owner, lease deadline and event epoch, then advances the source cursor, appends public events and settles a terminal Turn in one transaction. Its increasing-source-ID check assumes ordered input from one stream. [Event persistence](https://github.com/QwenLM/qwen-code/blob/d1a313445aee7848e45a8d819a2b81752ff9f686/packages/managed-agent-server/persistence/src/main/java/com/alibaba/qwen/code/managedagent/persistence/AgentTurnExecution.java#L568-L627)
- **Batch ingest.** The Harness sends the existing envelopes to any Java instance. Each batch identifies the Turn, source epoch, expected previous journal cursor and the journal range it covers. Under the same transaction, verify the current writer grant and Turn binding, acknowledge an already committed retry, and advance only from the expected cursor. A batch arriving ahead of a gap receives the last committed cursor for replay. Retractions and terminal events follow their source order. The public SSE cursor keeps its own sequence.
- **Replay after a crash.** If the Harness exits after journal commit but before delivery or acknowledgement, resume from the projection cursor using the committed journal. A successor must establish its current authority and preserve the source identity of replayed events, including bounded retractions. Once ingestion and terminal settlement work without a Java dispatcher, the dispatch lease passes to the Harness at admission. [Journal-to-envelope projection](https://github.com/QwenLM/qwen-code/blob/d1a313445aee7848e45a8d819a2b81752ff9f686/packages/cli/src/serve/hosted-harness-session/observation-routes.ts#L312-L339)
- **Duties of the stream consumer.** The dispatcher's stream loop does more than write events, and each duty needs an owner after P4. [Stream consumer](https://github.com/QwenLM/qwen-code/blob/d1a313445aee7848e45a8d819a2b81752ff9f686/packages/managed-agent-server/control-plane/src/main/java/com/alibaba/qwen/code/managedagent/session/HarnessCoordinator.java#L968-L1110)
  - An Action park is inferred: a stream that ends cleanly without a terminal event parks the Turn through `parkTurnForAction`. Ingest needs an explicit park report from the Harness.
  - Every 15 seconds the loop probes whether the Harness stopped with recovery blocked, and marks the Turn through `markTurnRecoveryBlocked`. The observation lane for a Turn already parked this way also reads the stream ([`observeBlockedHarness`](https://github.com/QwenLM/qwen-code/blob/d1a313445aee7848e45a8d819a2b81752ff9f686/packages/managed-agent-server/control-plane/src/main/java/com/alibaba/qwen/code/managedagent/session/HarnessCoordinator.java#L942-L966)).
  - It skips events of other prompts, batches text deltas by interval, count and bytes, and records the first visible text at once. After P4 the Harness sends at the events route's 250 ms cadence and Java keeps this grouping, so first-text latency stays where it is.
  - It flushes the pending batch before a retraction and passes the bounded retraction source (`sourceBootId`, `sourceEventEpoch`) to the Store.
  - It builds each event's source key as `bootId:eventEpoch:sourceId`. Replayed events must keep it.
- **Turn lease.** Ending the dispatch lease at admission would make every running Turn dispatchable on the next scan ([`findDispatchable`](https://github.com/QwenLM/qwen-code/blob/d1a313445aee7848e45a8d819a2b81752ff9f686/packages/managed-agent-server/persistence/src/main/java/com/alibaba/qwen/code/managedagent/persistence/AgentTurnExecution.java#L55-L64)). Instead, the admission transaction hands `dispatch_owner` to `harness:` + boot ID, and every ingest request, or a heartbeat at the renewal interval, renews the lease. Every existing `dispatch_owner` guard and the sweep keep working: a Harness that dies or stalls is a lapsed lease, recovered through today's path. Cancel takes a Harness-owned Turn back to the stream path.
- **Epoch adoption stays at admission.** The dispatcher still claims, attaches and records the admission, including the epoch reconciliation in `runClaimed`, and ingest only checks the epoch recorded there. That reconciliation moves when the Harness claims work itself (P1, P3).
- **Transport.** Each resident Session already holds its Session Store base URL and writer token ([`session-state.ts:85`](https://github.com/QwenLM/qwen-code/blob/d1a313445aee7848e45a8d819a2b81752ff9f686/packages/cli/src/serve/hosted-harness-session/session-state.ts#L85)), so the ingest route can sit on the Store surface with no new connection or authentication.
- **Slices.** (1) The Java ingest route and handling, with nothing requesting ingest. (2) The Harness pusher and the `parked` and `recovery_blocked` end markers, inert until requested. (3) Enablement: the flag, the hand-off at admission and the cancel take-back. Ingest covers fresh submissions; recovery admissions and continuations stay on the stream until pull scheduling.
- **Later alternative.** Java projects public events directly from the journal commits it already receives on the Store route. That removes the ingest hop but duplicates the TypeScript projection in Java (§11).

## 8. Comparison

| Concern | A0: Java-routed push | B: pull |
| --- | --- | --- |
| Reaches the stateless end state | Yes, with the Phase 1–4 rollout | Yes, with the same rollout plus the protocol move |
| Membership | Static list; an SQL registry only with the optional bridge | None: polls carry identity, version, capacity and held Sessions; liveness is the writer lease |
| Capacity-aware placement | No: round robin, placement recorded before the call | Yes: an instance claims only when it has capacity |
| A new instance takes work | Only new or released Sessions, when round robin reaches it; a Session placed on a busy member waits for it | Can claim eligible work immediately, subject to tenant fairness and compatible capacity |
| Autoscaling signal | Derive from durable work and placement | Count and oldest age of Sessions a new worker can claim |
| Harness inbound listener | Required, behind mTLS once off-Pod | None |
| Java-to-Harness reachability | Every Java instance must reach every Harness | Harness reaches Java through a load balancer |
| Owner routing | Done by Java from the placement | Not needed: work goes to the holder |
| Fencing change | P4 hands the dispatch-owner lease to the Harness after admission | Same P4 change. Claims reuse placement and writer fences |
| Java-side owner of a running Turn | Removed by P4 | Removed by P4, which B includes |
| Cancel and decision latency | One direct call | Signal plus fallback, within the P3 budget |
| Synchronous reads | Unchanged | Java-side reads or request items |
| Rolling upgrade | Homogeneous pool | Work gated by poller version; contract undefined |
| Infrastructure | MySQL | MySQL; a broker is optional for hints |
| Size of change | Small: P4; the optional bridge adds a registry and a listener | Large: 43 routes over P1, P3, P5 and P6 |

## 9. Why Pull Is the End State

A0 can scale. With an instance registry (the optional bridge, §5.2), a new instance joins without a configuration change and starts taking new Sessions within one refresh, and drain, suspension release and the reaper handle removal. It scales poorly for three reasons, all of which come from Java choosing the instance before knowing whether that instance can take the work:

1. **Capacity.** A0 records the placement first and calls second, round robin (§2.6). A busy member refuses with `hosted_session_open_busy`, the Session waits on it, and a newly added idle member gets nothing until round robin reaches it with a new Session. Fixing this in A0 needs load reports in the registry, load-aware selection and re-placement after a refusal: a second scheduler in Java. In B an instance claims only when it has capacity, so a new instance can start eligible work, and a full one simply stops claiming.
2. **Connectivity.** A0 needs every Java instance to reach every Harness instance over mTLS, so autoscaled Harness Pods need addresses, certificates and registrations that every Java instance trusts. In B each Harness opens outbound connections to Java through one load balancer. A customer-hosted Harness needs the same, which is the constraint Claude's self-hosted workers answer with outbound-only polling.
3. **Scaling signal.** Count distinct Sessions with work due now that a new compatible worker can claim, and measure how long the oldest has been eligible. Exclude Sessions waiting for user input, future wake times and work bound to a live writer. A0 could derive the same metric from durable work and placement. In B it follows the claim predicate and can feed a Kubernetes autoscaler as an external metric. [Horizontal Pod Autoscaling](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/)

Removal is about equal: A0 drains, B stops claiming, and both release placements as Sessions go idle. Running Sessions stay with their holder in both, so rebalancing existing load relies on the stateless roadmap's short idle release, not on the call direction.

P3's latency budget for cancel and decisions is an exit criterion of P3, not a condition for choosing B.

## 10. Migration Plan

Each phase is behind a capability bit, and push and pull coexist until P6. Until then, rolling a phase back turns its bit off and returns that work kind to push. Every claim from P1 on is gated by the poller's free capacity.

| Phase | Change | Role in the end state | Exit criteria | Status |
| --- | --- | --- | --- | --- |
| P2 | Release the placement on clean suspension and park; reaper for departed instances | Release kept; the reaper is removed at P6 | A released Session is claimed by any member without waiting for its lease | Done (#18404, #18443) |
| P4 | Event ingest from the Harness, in three slices (§7) | Kept | Public events identical to today for the same journal; killing the dispatching Java instance mid-Turn needs no stream reattach; a Harness that dies mid-Turn is recovered through its lapsed Turn lease | Proposed |
| P1 | Pull for work that already goes to any instance: wake inputs, parked decisions, relay deliveries to suspended Sessions | Kept | These paths never call a Harness; same outcomes on real-process MySQL tests | |
| P3 | Signals and pull for resident work: Turns, decisions, cancel, messages | Kept | Cancel and decision latency within a budget measured against today's direct calls; a full instance receives no new Session while another has capacity | |
| P5 | Reads served by Java from SQL and the journal; request items for the remaining management routes and side queries | Kept | Every `/session/:id/*` route has a pull or Java-side equivalent; Harness Pods can be scheduled independently of Java | |
| P6 | Remove push routes, the static pool, the reaper and the optional bridge | — | A Harness with no private listener passes the full suite; scaling on queue depth adds and removes instances | |
| Bridge | Optional, A0 only: SQL instance registry as `HarnessDiscovery` with authenticated self-registration, plus a network-addressable Harness (§5.2) | Removed at P6 | Instances join and leave without a Java configuration change; all Java instances see one member list | Only if independent Harness Pods are needed before P5 |
| Reaper by boot | Optional, A0 only: exclude a configured instance's current boot, not the whole instance (§5.2) | Removed at P6 | Placements left by an earlier boot are reclaimed without waiting for a request | Optional |

## 11. Risks and Open Questions

1. **Ingest ordering and fencing (P4).** Per-Session order, the event-epoch check, retries after a lost acknowledgement, and retraction handling must match today's stream consumer exactly, and so must its park and recovery-blocked decisions. After the hand-off a dead or stalled Harness is found only through the Turn lease it renews, and every take-back or recovery must refuse the old Harness's writes through the `dispatch_owner` CAS.
2. **Event projection.** Harness ingest keeps one projection implementation. Projecting in Java removes a hop but duplicates logic across languages.
3. **Latency (P3).** Cancel, decisions and the first event go through a signal. They are measured against today's direct calls as P3's exit criterion.
4. **Signal cost with several Java instances.** The SQL watermark poll costs one query per instance per tick. #18431 notes that index use at production scale is unmeasured for its event-tail query; the same applies here. A broker can replace the poll as a hint where one is deployed (§6.9).
5. **Protocol size.** 43 routes move. The phases must stay small enough to review.
6. **Interim scaling.** Until P5, Harness Pods cannot be scheduled independently of Java unless the optional bridge is built, and P6 discards that bridge.
7. **Registry trust (bridge only).** A registered base URL receives Session credentials. Registration must be authenticated per instance and bound to the instance ID.
8. **Capacity accounting.** The free capacity a poller reports must cover cold opens, active Turns and held Runtimes. Otherwise claims overload an instance just as round robin does.
9. **Roadmap gates.** The stateless roadmap's measurement gates still decide how short the idle period can become. Neither option makes cold opens cheaper.
10. **Fairness.** A tenant flooding work must not starve others at claim time.

## 12. Acceptance Criteria

Intermediate state (Phase 1–4 rollout, P4):

1. Kill a Harness with an active tool execution. After lease expiry and a safe takeover, query the original Worker under the same execution ID. A confirmed result resumes the Turn once. An unknown result stays pending reconciliation. A cleanly released idle Session can move on its next request.
2. Kill the dispatching Java instance mid-Turn. Deliver the second ingest batch before the first, drop an acknowledgement after commit, and terminate the Harness after a journal commit but before ingest. Reconnect public SSE from its last public cursor and compare with A0 on the same journal. Text deltas, retractions and the single terminal event must match without reattaching the dispatcher. Then kill the Harness mid-Turn with no dispatcher attached: the Turn lease it renewed must lapse and the sweep recover the Turn through takeover. A Turn that parks for an Action, and one that stops with recovery blocked, must be recorded as they are today.

Optional bridge and reaper change, if built:

3. Adding or removing a Harness instance needs no Java configuration change, and every Java instance sees the same members.
4. Placements left by an earlier boot of a restarted instance are reclaimed by the reaper under the same expiry proof.

End state (B):

5. A Harness with no private listener serves a Session end to end: create, Turn, approval, cancel, close.
6. A newly started instance claims pending work without a Java configuration change or registration, and a full instance receives no new Session while another has capacity.
7. Keep the Java replica count fixed and scale the Harness workload up and down under load. The reference chart advertises a loopback Session Store at `:8081` and points the optional Runtime Broker client at `:4182`. From a separate Harness Pod, verify authenticated Store access and, with Workspace tools enabled, execute a tool and recover its result through the Broker. A new member must take eligible work. Draining a member must preserve active Turns. [Store configuration](https://github.com/QwenLM/qwen-code/blob/d1a313445aee7848e45a8d819a2b81752ff9f686/deploy/kubernetes/chart/templates/deployment.yaml#L82-L100) · [Harness and Broker configuration](https://github.com/QwenLM/qwen-code/blob/d1a313445aee7848e45a8d819a2b81752ff9f686/deploy/kubernetes/chart/templates/deployment.yaml#L185-L207)
8. An incompatible poller receives no work.
9. With the same burst workload and resources, compare B with A0 for p95 runnable-to-start, first visible text, cancellation and approval-delivery latency. Record MySQL query rate and lock waits. Include a saturated or draining owner receiving a cancellation or approval while another Harness takes new Sessions. Agree the latency budgets from the A0 baseline before enabling P3.
10. With no broker deployed, every criterion above holds.

**First P1 acceptance.** Run two Java instances and two real Harness processes against MySQL 8.4. Harness A asks a structured question, parks and releases the Session while remaining healthy. Submit the answer through Java and have B claim it and continue the original Turn. Repeat with a lost claim response before writer acquisition, a duplicate answer and a late write from A. Require one effective writer, one applied answer and one terminal event for the original Turn. The release design lists a healthy two-member parked handoff as follow-up coverage. [Existing verification scope](https://github.com/QwenLM/qwen-code/blob/d1a313445aee7848e45a8d819a2b81752ff9f686/docs/design/2026-11-26-managed-suspension-placement-release.md#L138-L164)

Each phase requires real-process MySQL 8.4 verification. The P1 handoff, P4 fault cases and scaling measurements above are acceptance criteria for this proposal.

## 13. Changes From the First Draft

- B stays the end state. The case for it now rests on elastic scaling (capacity, connectivity, scaling signal) rather than on statelessness, which A0 also reaches.
- Option A is dropped. A0, the code on `main`, is the intermediate and rollback state.
- P2 is marked done.
- The first draft's P0 is no longer on the main path. B needs no instance registry and no reaper (§6.8). The registry survives only as an optional bridge together with a network-addressable Harness, and boot-level reclamation as an optional reaper change. The claim ticket at acquire is dropped, since neither A0 nor B lets a third party pick the instance.
- P4 moves first, and §7 explains why it is independent of the call direction.
- P5 prefers Java-side reads over request items.
- No capacity work is done in A0.
- §6.9 records why a message queue can carry wake-up hints but not requests or results: Session-bound work, acknowledgement timing, at-least-once delivery, the second write and the extra infrastructure.
- The multi-Java risk is rewritten: the slices are merging, and signals use SQL watermark polling by default.
- Current-state references move to `afcc98595a`, and the route count is corrected to 43.
- The November 27 review adds #18463, the P4 replay contract, a first P1 healthy-member handoff, and the independent-Pod and load tests in §12.
- The November 27 recheck against `099ce50da2` expands §7: P4 as a prerequisite of P1, the stream consumer's other duties (park, recovery blocked, filtering, batching, retractions, source keys), the Turn lease handed to the Harness, epoch adoption staying at admission, the existing Store transport, and three slices. §1, §8, §10, §11 and §12 follow. A first upstream design draft corrected the earlier sweep and epoch notes.

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
- [Temporal Worker performance](https://docs.temporal.io/develop/worker-performance) covers execution slots, polling and backlog metrics (§6.6).
- [Kubernetes Horizontal Pod Autoscaling](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/) documents how a Deployment scales on custom or external metrics (§9).
- [Qwen Broker failover recovery](https://github.com/QwenLM/qwen-code/blob/d1a313445aee7848e45a8d819a2b81752ff9f686/docs/design/2026-11-26-managed-broker-turn-recovery.md) defines how to reconcile an interrupted execution with its original Worker (§2.4).
- [Qwen MQ3 event-transport experiments](https://github.com/QwenLM/qwen-code/blob/d1a313445aee7848e45a8d819a2b81752ff9f686/docs/design/2026-10-14-managed-agent-event-transport-mq3.md) report redelivery and broker-outage behavior from the local test setup (§6.9).
