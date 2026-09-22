# Managed Runtime Identity Attestation and Readiness Gate

[English](managed-runtime-attestation.md) | [简体中文](managed-runtime-attestation.zh-CN.md)

Status: v1.13 target contract; updated 2026-09-22. This document refines the stage C/F Runtime recovery and `attest` gate and records the immediate fix on #12358 branch commit `e666150153`. Upstream #12447 now proposes the independently reviewable A1 route source and the schema/fixture portion of A2, but it is not mounted in a Hosted profile and does not complete the Java transport, Broker readiness gate, required cross-language CI, or deployment acceptance.

## 1. Problem and Decision

After Java Runtime Broker persists an endpoint, it cannot execute tools merely because the address is reachable or `/health` succeeds. Ports, Pod IPs, Pod names, and process PIDs can be reused. A database `READY` value is a previous observation and cannot prove that the current responder still belongs to the original binding, lease, Workspace, and configuration.

`attest` is the Broker's private identity check before Runtime use. The scheduler first proves that the physical resource is still the original resource; the Runtime then proves that the current HTTP responder loaded the original boot identity. Only after both succeed and a database CAS commits may this JVM open its tool gate.

This is not TPM/TEE remote attestation and does not prove that an image is uncompromised. The current guarantee depends on scheduler resource handles, placement validation, per-generation random credentials, and a protected internal network. Traffic over an untrusted network requires TLS/mTLS or equivalent workload identity; plain HTTP plus a bearer token is insufficient.

## 2. Verified Current Implementation

At `feature/managed-agents-p0-p8@e666150153`:

- Java `RuntimeBrokerService` keeps the local gate closed for a persisted `READY` record, runs provisioner `reconcile`, and then calls `RuntimeTransport.attest`.
- `HttpRuntimeTransport` calls `POST /internal/managed-runtime/v2/attest` with a bearer token, lease ID, epoch, and immutable scope.
- Tool Runtime compares the request with its read-only boot document and returns `runtimeInstanceId/runtimeIncarnation/leaseId/epoch/provisionRequestId` plus the complete scope. It does not start or attach ACP and executes no tool.
- Broker compares the response with the durable seed, lease, and `RuntimeProvisionRequest.scope`. Only while it still owns the same operation generation does one CAS update endpoint/handle, increment `attestation_generation`, write `last_reconciled_at`, and complete the in-process ready gate.
- At `34ea187c62`, Express registered the route but the owned-worker outer HTTP allowlist omitted `attest`, so real requests returned 404 before Express. `e666150153` adds the method/path and a test through the real outer gate; the same commit generates and injects an ephemeral Broker credential-encryption key for E2E.

The immediate preview fix resolves the known 404 and E2E startup failure. Upstream #12447 replaces the duplicated `attest` method/path with one typed manifest, runs shared fixtures through a real raw TypeScript HTTP gate, and makes the Java Runtime Broker tests consume the same schema/fixtures. The PR is still open and deliberately unmounted; a concrete Java transport, process E2E, and one required cross-language CI lane remain the next A2 work.

## 3. Exact Meaning of Attestation

Three evidence classes must match:

| Evidence | Authority | What it proves |
| --- | --- | --- |
| Scheduler resource identity | provisioner `reconcile` plus durable `resourceHandle` | The original process/Pod/Secret/UID still exists and its endpoint belongs to the allowed placement domain |
| Runtime boot identity | Runtime read-only boot document plus private `attest` response | The HTTP responder holds this generation's boot information and service credential |
| Broker ownership | MySQL binding, operation owner/generation, and CAS version | This Java replica remains authorized to publish the observation and open its local gate |

Missing any one prevents this JVM from using the binding. `attestation_generation > 0` is a durable audit counter, not live proof reusable by another JVM. Every JVM must reconcile and attest before first use of a recovered binding.

These fields form the v2 identity:

```text
runtimeInstanceId + runtimeIncarnation
+ provisionRequestId
+ leaseId + epoch
+ tenantId + workspaceId + workspaceGeneration + workspaceCwd
+ capabilityDigest + isolationClass
```

When W0 introduces a stable Hosted Workspace ID, `workspaceCwd` cannot remain the public Workspace identity. A new `managed-context/1` boot envelope binds storage identity, context revision, and context digest while preserving the old local path hash only as a compatibility alias. Negotiate new fields with a new version; do not extend strict v2 in place.

## 4. Private Protocol

Request:

```http
POST /internal/managed-runtime/v2/attest
Authorization: Bearer <per-generation-token>
X-Qwen-Managed-Lease-Id: <leaseId>
X-Qwen-Managed-Lease-Epoch: <epoch>
Content-Type: application/json
Cache-Control: no-store
```

```json
{
  "protocolVersion": 2,
  "provisionRequestId": "provision_01",
  "tenantId": "tenant_a",
  "workspaceId": "workspace_a",
  "workspaceGeneration": "7",
  "workspaceCwd": "/runtime/workspace",
  "capabilityDigest": "sha256:...",
  "isolationClass": "session"
}
```

A success response returns fixed identity only. It returns no token, seed, capability expansion, or dynamic configuration:

```json
{
  "protocolVersion": 2,
  "runtimeInstanceId": "runtime_01",
  "runtimeIncarnation": "boot_01",
  "leaseId": "lease_01",
  "epoch": 4,
  "provisionRequestId": "provision_01",
  "tenantId": "tenant_a",
  "workspaceId": "workspace_a",
  "workspaceGeneration": "7",
  "workspaceCwd": "/runtime/workspace",
  "capabilityDigest": "sha256:...",
  "isolationClass": "session"
}
```

Requests and responses are closed, bounded UTF-8 JSON objects. Tighten the response limit to 16 KiB. Return `Cache-Control: no-store`; intermediaries must not cache the POST. Reject unknown fields, duplicate JSON keys, invalid UTF-8, non-integer or non-positive epochs, and IDs with different case. Paths are compared exactly with boot values; boot/prepare separately performs canonicalization and containment checks.

Do not add a challenge field to v2. If cryptographic freshness or operation across untrusted networks is required, negotiate a new version using a random challenge plus TLS/mTLS or a response MAC derived from the per-generation key. A challenge alone prevents stale responses but does not prove image integrity.

## 5. End-to-End Sequence and Gate

```mermaid
sequenceDiagram
    participant B as Java Broker
    participant DB as MySQL
    participant P as Provisioner
    participant R as Tool Runtime
    B->>DB: claim binding operation generation N
    B->>P: reconcile(request, seed, resourceHandle)
    P-->>B: READY + exact handle + endpoint + lease identity
    B->>R: POST v2/attest (token + lease headers + expected scope)
    R->>R: compare auth, headers, and body with immutable boot
    R-->>B: exact Runtime identity and scope
    B->>B: compare response with seed, lease, and request
    B->>DB: CAS owner=N; persist endpoint/handle, attestationGeneration+1
    DB-->>B: committed current binding
    B->>B: open this JVM's ready gate
    B->>R: prepare / manifest / tool operations
```

Ordering requirements:

1. Validate placement/resource handle before sending credentials to the endpoint.
2. A successful `attest` response does not open the gate directly. Commit it with the original operation generation and binding version first.
3. Discard a late success after CAS failure, claim expiry, or deadline; do not update the health cache.
4. Permit `prepare/manifest/execute/status/cancel/release` only after opening the local gate. Read-only manifest cannot bypass identity.
5. Close and re-attest when endpoint, resource handle, lease/epoch, Workspace generation, context revision, capability digest, or credential generation changes.
6. If validation fails after tool dispatch, query the original `executionCallId`; never create another Runtime to replay the side effect.

## 6. Failure Classification

| Observation | Classification | State and client behavior |
| --- | --- | --- |
| Network error, 408/425/429, 5xx, call timeout | Temporarily unavailable | Keep the gate closed; bounded backoff within the operation deadline; expose `environment.preparing/unavailable` |
| 400, invalid JSON, oversized response, protocol version/shape error | Protocol conflict | Binding becomes `RECOVERY_BLOCKED`; prohibit tools; record a safe reason |
| 401/403 | Credential or service-identity conflict | `RECOVERY_BLOCKED` plus alert; do not mint a new token and retry the old resource |
| 404/405 | Peer lacks the required route/method | Capability/protocol incompatibility and `RECOVERY_BLOCKED`; never fall back to `/health` |
| 409 or any identity/scope mismatch | Resource identity conflict | `RECOVERY_BLOCKED`; retain handle and evidence for platform/operator repair |
| provisioner `STARTING/UNKNOWN` | Physical state unresolved | Do not attest or open the gate; continue bounded reconciliation |
| provisioner proves `NOT_FOUND` | Original physical resource is absent | Settle Session/unresolved-execution rules first; create a generation only when allowed |
| Attest succeeds after CAS/claim loss | Late result | Discard it; the new owner performs its own reconcile + attest |

Public APIs expose neither endpoints, tokens, absolute paths, Pods/PIDs, nor internal exceptions. WebShell shows only `preparing/ready/recovery_blocked` plus actionable stable codes. Operational logs use binding ID, generation, provisioner kind, placement hash, and operation generation.

## 7. Single Route Manifest

The known 404 came from two route lists, not from the `attest` handler. Define one `OWNED_MANAGED_RUNTIME_ROUTES` manifest with method, exact path, protocol version, body requirement, request/response limits, and handler key:

```ts
const OWNED_MANAGED_RUNTIME_ROUTES = [
  { method: 'GET', path: '/health', handler: 'health' },
  { method: 'POST', path: '/internal/managed-runtime/v2/attest', handler: 'attest' },
  // prepare / manifest / history / tool operations
] as const;
```

Generate the outer raw HTTP check from the manifest and use the same path constants during Express registration. A build test enumerates actual owned-worker registrations and requires exact equality with the manifest. Adding a route to only one side must fail. Java consumes versioned JSON Schema/fixtures instead of generating source from TypeScript constants.

The manifest limits only the owned Tool Runtime network surface. It excludes daemon Sessions, WebShell, capabilities, and static files. Query strings, trailing slashes, case variants, OPTIONS, WebSocket upgrades, and unregistered methods return 404. Authenticate before parsing the business body.

## 8. Security Boundary

- Generate a unique token per binding generation. Persist only the AES-GCM-protected seed; logs, exceptions, ready records, and public responses never expose the token.
- A local-process endpoint must be a loopback origin in the same placement host. Boot/ready files are regular files under an owned generation directory; reject symlinks and permissive modes.
- Kubernetes validates Pod/Secret UID and resourceVersion before endpoint resolution. A same-name object with a different UID conflicts. Production adds NetworkPolicy, ServiceAccount/RBAC, and TLS/mTLS or platform workload identity.
- Plain HTTP bearer is allowed only over proved loopback or a protected network. Cross-host, cross-tenant, or shared-proxy traffic upgrades transport trust; v2 echo is not cryptographic remote attestation.
- `attest` executes no user code, starts no ACP/model, mutates no Workspace, and is not the liveness polling endpoint. Protected `/health` remains for frequent liveness; identity invalidation triggers re-attestation.

## 9. Cross-Implementation Contract Gate

Stage A adds a named `managed-runtime-attestation-conformance-v1` deliverable:

1. Store language-neutral success/failure JSON fixtures and a closed schema that fix method/path, headers, fields, limits, and error classes.
2. Drive a real raw HTTP server from the fixtures in TypeScript provider tests so the outer gate is covered, rather than testing only the Express app.
3. Make Java transport/validator consume the same fixtures and verify request emission, parsing, and full equality. A permissive Java-owned mock is insufficient.
4. Run a minimal process E2E with a real TS worker and Java Broker for success, missing credentials, wrong lease/epoch, wrong Workspace generation, incompatible 404, late completion, and re-attestation after restart.
5. Put protocol fixtures/schema, TS tests, Java tests, and route-manifest consistency in one required CI job. A protocol change updates fixtures and both implementations in one change.

This gate proves interface behavior, not Kubernetes, network policy, key rotation, or production capacity; those remain deployment acceptance.

## 10. Implementation Slices

| Slice | Deliverable | Exit |
| --- | --- | --- |
| A0: immediate fix | Allow v2/attest, inject ephemeral E2E encryption key, regression through raw gate | Completed on preview branch `e666150153`; still requires PR CI/review and upstream merge |
| A1: route source | Route manifest, exact allowlist, 16 KiB limit, no-store | Proposed in upstream #12447; registration/allowlist divergence fails real raw-HTTP tests, but production mounting remains follow-up work |
| A2: contract gate | Language-neutral fixtures/schema, TS and Java consumers, required CI | #12447 provides the shared files, TypeScript behavior tests, and Java fixture consumer; a concrete Java transport and one required cross-language CI lane remain outstanding |
| A3: state and observation | Gate/CAS/late-result behavior, error mapping, metrics, safe logs | Restart, claim loss, endpoint changes, and conflicts fail closed |
| A4: deployment proof | Real MySQL/two JVMs, real Kubernetes/target platform, TLS/identity, key rotation | One active generation per resource, no cross-binding connection, no repeated tool side effect |

A0 does not complete stages C/F. A1–A3 are code gates before enabling the Hosted profile; A4 is completed per target deployment before broader production traffic. W0c reuses this gate and adds ContextBinding to a new identity version instead of inventing separate Workspace attestation.

## 11. Acceptance Checklist

- A successful `/health` plus a 404/409 `attest` never marks Runtime ready and sends no tool request.
- Wrong token, lease, epoch, provision request, Runtime instance/incarnation, Workspace generation/cwd, capability digest, or isolation class fails closed.
- After Java restart reads durable `READY`, it sends no prepare/execute until new reconcile + attest + CAS completes.
- With two Java replicas, only the operation-generation owner commits attestation; late completion changes neither gate nor health.
- Endpoint changes persist before re-attestation. Reused Pod names, UIDs, ports, or PIDs cannot pass.
- E2E creates an ephemeral test key itself and never prints or persists plaintext; production startup fails when the key is missing.
- CI fails if a route is added/removed at registration or the allowlist only.
- TS and Java agree on shared positive/negative fixtures and error classes; 404 is never “temporarily not ready.”
- Runtime delay does not block first model output; the actual tool request waits for the attestation gate.
- A dispatched tool is queried by its original execution identity after Runtime/Java failure and is never replayed because attestation restarted.

## 12. Relationship to the Architecture

This design refines A's cross-implementation protocol gate, C's Broker readiness state, F's fault injection, and W0c's execution-directory proof. Public OpenAPI does not expose an `attest` route; browsers never connect to Runtime. Runtime attestation also does not replace G's Harness writer/checkpoint fencing: they prove Tool Runtime and model-history writer identity separately.

Once implemented, promote the stable contract to upstream `docs/design/` as linked English and Chinese documents. The external code_agent set remains the full architecture index and decision history.
