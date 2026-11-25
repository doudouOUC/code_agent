# Managed Agent Harness Scheduling: From Push to Pull

[English](managed-agent-harness-pull-scheduling.md) | [简体中文](managed-agent-harness-pull-scheduling.zh-CN.md)

Status: proposal, 2026-11-25. Personal design draft; not submitted upstream. Current-state claims were checked against QwenLM/qwen-code `main` at [`67f85d324e`](https://github.com/QwenLM/qwen-code/commit/67f85d324e5f83cabca9229e1e9fc6161b794947). Claude Managed Agents facts come from the public pages listed in §10, read on 2026-11-25. This builds on the stateless Hosted Harness design ([#17527](https://github.com/QwenLM/qwen-code/pull/17527)) and the [gap analysis on #18149](https://github.com/QwenLM/qwen-code/issues/18149#issuecomment-7156978186).

## 1. Problem and Decision

The question is whether the Hosted Harness can run as several instances behind one load balancer, with any instance taking any request. Today it cannot. Java addresses one specific Harness process per Session and pins each client to one process boot ID. A request that a load balancer sends to another process is refused as a generation change.

There are two ways to get there:

- **Option A, push behind a load balancer.** Java keeps calling the Harness, a load balancer sits in front of the Harness, and three protocol gaps are closed: owner routing for running Turns, Session-scoped fencing, and writer grants that do not name an instance.
- **Option B, pull scheduling.** The direction reverses. Harness instances open outbound connections to Java and claim Session work. Java never calls a Harness, and any load balancer sits in front of Java.

**Decision (proposed):** make Option B the target. Keep today's push protocol and static pool working, and move one operation family at a time to pull, each behind a capability bit. Option B removes owner routing instead of solving it. It needs no Harness instance list and no inbound Harness listener. It also matches the stateless roadmap's end state and how Claude Managed Agents is built (§3).

One shortcut needs no protocol change. If Java can reach each instance directly and the only goal is adding and removing instances without editing configuration, Phase P0 alone is enough (§7).

## 2. Current State

### 2.1 How Java reaches a Harness

| Fact | Source |
| --- | --- |
| A pool is a static list of `instance-id` and `base-url` pairs; Kubernetes discovery was archived | [`HarnessConfiguration.java:47-62`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/server/src/main/java/com/alibaba/qwen/code/managedagent/config/HarnessConfiguration.java#L47-L62) |
| Java picks a member round robin, records the placement in MySQL, and routes every later call for the Session to it | [`HarnessPoolConnector.java:248-299`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/adapters/src/main/java/com/alibaba/qwen/code/managedagent/harness/HarnessPoolConnector.java#L248-L299) |
| Each Harness client pins one boot ID; another process answers 409 `hosted_harness_generation_mismatch` | [`hosted-harness-contract.ts:156`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/cli/src/serve/hosted-harness-contract.ts#L156) |
| In single-address mode a different boot ID is treated as the process being replaced | [`QwenHostedHarnessConnector.java:2763`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/adapters/src/main/java/com/alibaba/qwen/code/managedagent/harness/QwenHostedHarnessConnector.java#L2763) |
| A load or create names the receiving process as writer and placement owner, or is refused | [`session-open.ts:709-722`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/cli/src/serve/hosted-harness-session/session-open.ts#L709-L722) |
| Java issues the writer grant before dispatch, bound to tenant, Workspace, Session, instance, boot ID and placement epoch | [`WriterCredentialPolicy.java:65`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/contracts/src/main/java/com/alibaba/qwen/code/managedagent/contracts/security/WriterCredentialPolicy.java#L65) |
| The Store checks that grant and the current placement on every writer operation | [`JdbcHarnessPlacementStore.java:176-199`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/persistence/src/main/java/com/alibaba/qwen/code/managedagent/persistence/JdbcHarnessPlacementStore.java#L176-L199) |
| The Harness binds only to loopback; remote pool endpoints need TLS | [`hosted-harness-profile.ts:36`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/cli/src/serve/hosted-harness-profile.ts#L36) |

### 2.2 What is already durable

Most of what Java sends to a Harness already exists as a durable record before it is sent:

- **Turns** are `ma_turn` rows. A one-second sweep finds dispatchable rows and pushes them ([`HarnessCoordinator.java:249-261`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/control-plane/src/main/java/com/alibaba/qwen/code/managedagent/session/HarnessCoordinator.java#L249-L261)).
- **Approval decisions** are outbox operations, delivered and retried every second ([`ActionResponseCoordinator.java:53-106`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/control-plane/src/main/java/com/alibaba/qwen/code/managedagent/session/ActionResponseCoordinator.java#L53-L106)). Session messages, child results, automation fires and channel operations follow the same pattern through their own relays.
- **Wake inputs** are journal inputs with a seal-time wake stamp, found by `WakeRecovery` and the transport wake activator.
- **Events.** The Harness commits every event, including text deltas, to the journal in the Java-hosted Session Store. The Harness event stream is a projection of that journal ([`observation-routes.ts:273-340`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/cli/src/serve/hosted-harness-session/observation-routes.ts#L273-L340)). The coordinator reads that stream and writes public events ([`HarnessCoordinator.java:934`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/managed-agent-server/control-plane/src/main/java/com/alibaba/qwen/code/managedagent/session/HarnessCoordinator.java#L934)). Public clients read those events from Java storage, never from the Harness.

### 2.3 What still needs the owner process

- About 40 private `/session/:id/*` routes assume the Session is resident in the process being called.
- The running Turn's event stream is served from the owner's in-memory journal copy. Its event epoch is the owner's boot ID ([`hosted-harness-session.ts:113`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/cli/src/serve/hosted-harness-session.ts#L113)).
- Cancel aborts the Turn in the owner's memory. A resident approval wait is answered in the owner's memory.
- Side queries keep their execution in a process-local map, so their read and cancel must return to the same process ([`hosted-side-query.ts:387`](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/packages/cli/src/serve/hosted-side-query.ts#L387)).

### 2.4 Stateless roadmap status

Phases 1 to 4 are merged but default off, pending their measurement gates. A suspended Session keeps its placement on the same instance, and placements of departed instances are never reclaimed. The [#18149 comment](https://github.com/QwenLM/qwen-code/issues/18149#issuecomment-7156978186) lists both gaps. Pull scheduling depends on closing them (§7, P2).

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

1. Clients and the control plane never address a harness. They write durable work, and harnesses consume it.
2. The scheduling unit is the session. A worker claims it, holds it under a renewable lease, and gives it back.
3. Workers connect outbound and pull, so they need no inbound address, discovery or load balancer.
4. A wait is a state of the session log, not a resident process.

## 4. Option A: Push Behind a Load Balancer

Option A keeps Java as the caller and closes three gaps.

1. **Owner routing.** Every request for a Session with a live writer must reach that writer. Four variants exist:
   - Java looks up the owner's self-registered address in the Store and calls it directly.
   - Harness instances forward to the owner, one hop at most, with a loop guard.
   - The load balancer hashes on a Session header, with forwarding for Sessions remapped by membership changes.
   - All interactions become durable commands; this is Option B's model without its scheduling.
2. **Session-scoped fencing.** The expected boot ID moves from the client to the Session reference. The receiver classifies the request against Store state:
   - itself: serve it;
   - another live writer: misrouted, so forward or answer `hosted_session_not_owner`;
   - no live writer: keep `hosted_harness_generation_mismatch` and recover.
3. **Instance-free writer grants.** Java signs a short-lived Session claim ticket with no instance in it. The receiving Harness presents it at `writers:acquire`. The Store performs today's assign or takeover CAS for that Harness and returns today's placement-bound token.

Option A's limits:

- The forwarding layer must carry SSE without buffering and must not retry mutations.
- Instances must still reach each other.
- The roughly 40 owner-bound routes keep their synchronous shape.
- The load balancer adds nothing that Java's own selection does not already do.

Item 3 is still worth building. It becomes P0 below, because Option B needs it too.

## 5. Option B: Pull Scheduling (Proposed)

### 5.1 Model

A **Session work item** says "Session S has work". It is derived from the durable records in §2.2; it is not a new copy of them. A Harness instance runs one worker loop:

1. **Poll.** Long-poll Java with its identity, protocol version, capability digest and free capacity.
2. **Claim.** For an unclaimed Session, Java runs the placement assign or takeover CAS for the poller, using today's rules. It then returns the Session descriptor and a writer grant in today's token format.
3. **Run.** Load the Session, take its pending work from the journal and the operation records, and execute.
4. **Report.** Post operation completions and projected events to Java.
5. **Release.** When idle, suspend and release the placement with a receipt, so that any instance can claim the Session next.

While a Session is held, Java delivers new work for it to the holder through the same long-poll (§5.4). Work for a Session held by another live writer is never handed to a different instance.

### 5.2 Work sources

| Work kind | Durable source today | Change |
| --- | --- | --- |
| Turn | `ma_turn` dispatchable rows | Sweep marks the Session as having work instead of pushing |
| Approval or question decision | Action response operations | Holder reads the decision; parked Turns resume on claim as today |
| Session message, child result, automation fire, channel operation | Relay operations | Same as decisions |
| Wake input | Journal input plus seal-time wake stamp | Wake scan marks work instead of calling `activateForWake` |
| Cancel and mode change | Turn status `CANCELLING`, Session selection revision | Delivered as a signal to the holder (§5.4) |
| Close, delete, archive | Lifecycle operations with claims | Lifecycle operation becomes a work item with its claim |
| Synchronous reads and management (status, transcript, MCP or extension management, client files, side queries) | Request and response today | A request item with a reply slot; Java waits for the reply up to the caller's timeout |

### 5.3 Claim, lease and grant

- **Claim** is the existing placement CAS, now run when a Harness polls instead of when Java picks a member. The takeover rules are unchanged: either a released placement with a receipt, or a lapsed writer lease with a known activation. A refusal means the Session is still held, so the item stays with its holder.
- **Grant.** The poll response carries the existing placement-bound writer token. The Store keeps checking it on every writer operation, so `JournalFencing` and `requireCurrent` do not change.
- **Lease.** The writer lease (`writers:renew`, 60 seconds by default) is the claim lease. No second lease is introduced. Claude's `expected_last_heartbeat` precondition corresponds to today's writer generation check.
- **Writer identity** stays the boot ID. The Turn's `bindHarness(bootId)` still records which process runs the Turn, and a change of process still goes through recovery.

### 5.4 Signals to the holder

The holder learns about new work for its Sessions from its own long-poll:

- **Wakeup.** The poll lists the Sessions the instance holds. Java answers early when any of them gets work. With one Java instance this is an in-process wakeup. With several Java instances it needs a broadcast, either the existing per-Session LiteTopic, which has no TypeScript consumer yet, or a database notification table.
- **Bounded fallback.** A missed signal is caught by a periodic recheck of held Sessions, so lost signals cost latency, never correctness.
- **Cancel** is the latency-sensitive case. It is a durable `CANCELLING` status plus a signal. The holder aborts on the signal, and the fallback bounds the worst case. Claude documents the same effect: an interrupt can take longer to apply while tools run.

### 5.5 Results and events

- **Completions.** The holder posts the answer it returns today to `operations/{id}:complete`, fenced by its writer token. The existing operation IDs keep this idempotent.
- **Events, interim.** The holder posts the envelopes it streams today, batched and keyed by journal sequence, to an ingest route. The coordinator's stream-consumption logic becomes that route's handler, and duplicates are dropped by sequence.
- **Events, target.** Java projects public events directly from journal commits. That removes the ingest hop but duplicates the TypeScript projection logic in Java, so it is a later choice (§8).

### 5.6 Fencing and compatibility

- Correctness rests on the writer lease generation and the placement epoch, both already enforced by the Store. No request is fenced by "which process answered".
- Java checks the poller's protocol version and capability digest at poll time. An incompatible poller receives no work. This allows a rolling upgrade where each work kind is gated by the versions able to run it. The cross-version contract itself still has to be defined.

### 5.7 Capacity and fairness

- An instance polls only for work it can take. The cold-open limit and active Turn count become poll admission.
- Java hands out new Sessions round robin across tenants, as the shared Harness design requires.
- Queue depth, oldest pending work and polling instances become scaling signals, like Claude's `work/stats`.

### 5.8 Drain

Stop claiming new Sessions, keep serving held ones, and release each one as it goes idle. A timed-out drain falls back to crash recovery. No inbound drain route is needed.

### 5.9 Security

- The Harness opens no listener for private routes, so the loopback-only binding and the per-instance TLS proxy are no longer needed.
- The Harness authenticates to Java with an instance identity, preferably mTLS with the instance ID in the certificate.
- Grants are issued per claim, so a credential exists only for Sessions the instance currently holds.

### 5.10 Failure semantics

| Failure | Behavior |
| --- | --- |
| Holder dies | Its leases lapse; the Sessions become claimable; recovery runs through today's takeover and G3 continuation paths |
| Java restarts | Work is durable; instances re-poll and renew; held Sessions keep their writer until their lease lapses |
| Completion reply lost | The holder retries the completion under the same operation ID |
| Signal lost | The periodic recheck delivers the work later |
| Claim races | The placement CAS admits one claimer; others get no item |

## 6. Comparison

| Concern | Option A: push behind a load balancer | Option B: pull |
| --- | --- | --- |
| Instance list or discovery | Self-registration needed | None |
| Harness inbound listener | Required, behind TLS | None |
| Owner routing | Forwarding or redirects | Not needed: work goes to the holder |
| Fencing change | Three-state check on every request | None beyond the Store's existing checks |
| Writer grant | Claim ticket at acquire | Issued in the poll response |
| Cancel and streaming latency | One direct hop | Signal latency; needs measurement |
| Synchronous reads | Unchanged | Request items with reply slots |
| Rolling upgrade | Mixed versions behind one address | Work gated by poller version |
| Size of change | Medium, spread over every route | Large, but each phase is separable |
| Fit with stateless end state | Partial | Direct |

## 7. Migration Plan

Each phase is behind a capability bit, and push and pull coexist until the last phase.

| Phase | Change | Exit criteria |
| --- | --- | --- |
| P0 | Instance self-registration and claim at acquire | Instances join and leave without a Java configuration change; static pool still works |
| P1 | Pull for work that already goes to any instance: wake inputs, parked decisions, relay deliveries to suspended Sessions | These paths never call a Harness; same outcomes on real-process MySQL tests |
| P2 | Release the placement on clean suspension and park, plus a reaper for departed instances | A released Session is claimed by any instance without waiting for its lease |
| P3 | Signals and pull for resident work: Turns, decisions, cancel, messages | Cancel and decision latency within an agreed budget |
| P4 | Event ingest from the Harness instead of Java reading the Harness stream | Public events identical to today for the same journal |
| P5 | Request items for synchronous reads, management routes and side queries | All `/session/:id/*` routes have a pull equivalent |
| P6 | Remove push routes and the static pool | A Harness with no private listener passes the full suite |

## 8. Risks and Open Questions

1. **Latency.** Signal latency for cancel, decisions and the first event must be measured against today's direct calls.
2. **Several Java instances.** Signals need a broadcast. LiteTopic exists, but the TypeScript side has no consumer. Running several Java instances is not validated today in any case.
3. **Event projection.** Harness ingest keeps one projection implementation. Projecting in Java removes a hop but duplicates logic across languages.
4. **Synchronous reads over a queue.** Request items add latency to read routes. Some reads, such as the transcript, could be served from the journal in Java instead.
5. **Protocol size.** About 40 routes move. The phases must stay small enough to review.
6. **Roadmap gates.** The stateless roadmap's measurement gates still decide how short the idle period can become. Pull scheduling does not make cold opens cheaper.
7. **Fairness.** A tenant flooding work must not starve others at claim time.

## 9. Acceptance Criteria

1. A Harness with no private listener serves a Session end to end: create, Turn, approval, cancel, close.
2. With N instances and Java behind a load balancer, killing any instance moves its Sessions to another after the lease lapses, with no replayed tool call.
3. Adding or removing an instance needs no Java configuration change.
4. An incompatible poller receives no work.
5. Cancel and decision latency stay within the budget set in P3.
6. Each phase passes the real-process MySQL 8.4 suites, not only unit or H2 tests.

## 10. Sources

- [Scaling Managed Agents: Decoupling the brain from the hands](https://www.anthropic.com/engineering/managed-agents)
- [Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview)
- [Session event stream](https://platform.claude.com/docs/en/managed-agents/events-and-streaming)
- [Session operations](https://platform.claude.com/docs/en/managed-agents/session-operations)
- [Permission policies](https://platform.claude.com/docs/en/managed-agents/permission-policies)
- [Sessions](https://platform.claude.com/docs/en/managed-agents/sessions)
- [Self-hosted sandboxes](https://platform.claude.com/docs/en/managed-agents/self-hosted-sandboxes)
- [Self-hosted workers](https://platform.claude.com/docs/en/managed-agents/self-hosted-sandboxes-workers)
- [Environments work API](https://platform.claude.com/docs/en/api/beta/environments/work)
- [Stateless Hosted Harness design](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/docs/design/2026-11-16-managed-stateless-harness.md)
- [Shared Harness design](https://github.com/QwenLM/qwen-code/blob/67f85d324e5f83cabca9229e1e9fc6161b794947/docs/design/2026-10-21-managed-shared-harness.md)
