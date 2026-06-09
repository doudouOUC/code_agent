# Plan: Add client_id attribute and permission route spans

## Context

PR #4556 (`feat/daemon-otel-e2e-design`) adds daemon telemetry to `qwen serve` but the HTTP request spans are missing `client_id` attribute, and the permission routes (`POST /session/:id/permission/:requestId`, `POST /permission/:requestId`) are not traced. This task adds the attribute and route spans.

`prompt_id` attribute will be added after rebase onto main, which already generates `promptId = crypto.randomUUID()` in the prompt route handler.

Working branch: `feat/daemon-otel-e2e-design` (9 commits ahead of `daemon_mode_b_main`). Must checkout this branch before editing.

## Changes

### 1. `packages/core/src/telemetry/daemon-tracing.ts`

**Extend `DaemonRequestSpanOptions`** with optional `clientId` and `permissionRequestId`:

```typescript
export interface DaemonRequestSpanOptions {
  method: string;
  route: string;
  workspaceHash?: string;
  sessionId?: string;
  clientId?: string;             // NEW
  permissionRequestId?: string;  // NEW
}
```

**Update `withDaemonRequestSpan`** — add these to the initial span attributes:

```typescript
...(options.clientId ? { 'qwen-code.client_id': options.clientId } : {}),
...(options.permissionRequestId
  ? { 'qwen-code.daemon.permission.request_id': options.permissionRequestId }
  : {}),
```

**Add `addDaemonRequestAttribute()` helper** — prepares the plumbing for post-rebase promptId enrichment. Route handlers can enrich the active span without importing `@opentelemetry/api`:

```typescript
export function addDaemonRequestAttribute(
  key: string, value: string | number | boolean
): void {
  try {
    trace.getSpan(otelContext.active())?.setAttribute(key, value);
  } catch { /* telemetry must not affect request handling */ }
}
```

### 2. `packages/core/src/telemetry/index.ts`

Export `addDaemonRequestAttribute`.

### 3. `packages/cli/src/serve/server.ts`

**a) Extend `resolveDaemonTelemetryRoute` return type** to `{ route: string; sessionId?: string; permissionRequestId?: string }`.

**b) Add permission route matching** (insert after existing session-action regex, before DELETE):

```typescript
// POST /session/:id/permission/:requestId
const sessionPermission = req.path.match(
  /^\/session\/([^/]+)\/permission\/([^/]+)$/,
);
if (sessionPermission?.[1] && sessionPermission[2] && req.method === 'POST') {
  return {
    route: 'POST /session/:id/permission/:requestId',
    sessionId: sessionPermission[1],
    permissionRequestId: sessionPermission[2],
  };
}
// POST /permission/:requestId (global, no session scope)
const globalPermission = req.path.match(/^\/permission\/([^/]+)$/);
if (globalPermission?.[1] && req.method === 'POST') {
  return {
    route: 'POST /permission/:requestId',
    permissionRequestId: globalPermission[1],
  };
}
```

No ordering collision: the existing session-action regex `(load|resume|prompt|cancel)` expects a single segment after `:id`, while `permission/:requestId` has two, so neither regex can match the other's paths.

**c) In `daemonTelemetryMiddleware`, read raw `clientId` from header, truncate to 128 chars** (matches `MAX_CLIENT_ID_LENGTH`), and pass it plus `permissionRequestId` to `withDaemonRequestSpan`:

```typescript
const rawClientId = req.get(CLIENT_ID_HEADER);
const clientId =
  rawClientId !== undefined && rawClientId !== ''
    ? rawClientId.slice(0, MAX_CLIENT_ID_LENGTH)
    : undefined;
```

Then spread into the options object alongside the existing fields.

### 4. `packages/acp-bridge/src/bridge.ts`

In `sendPrompt`, add `context?.clientId` to the `prompt.dispatch` span attributes:

```typescript
...(context?.clientId
  ? { 'qwen-code.client_id': context.clientId }
  : {}),
```

This is inside the closure where `context` is already captured, so no API change is needed.

### 5. Tests

**`packages/core/src/telemetry/daemon-tracing.test.ts`:**
- Test `withDaemonRequestSpan` with `clientId` and `permissionRequestId` → verify they appear in `startSpan` attributes
- Test `addDaemonRequestAttribute` → mock `trace.getSpan(otelContext.active())` → verify `setAttribute` called

**`packages/acp-bridge/src/bridge.test.ts`:**
- Update existing bridge telemetry test mock: capture `attributes` in `withSpan` (currently `_attributes` is ignored)
- Pass `{ clientId: 'test-client' }` as context to `bridge.sendPrompt`
- Assert `prompt.dispatch` span attributes include `'qwen-code.client_id': 'test-client'`

## Attribute summary

| Span | Attribute | Source |
|------|-----------|--------|
| `qwen-code.daemon.request` (all traced routes) | `qwen-code.client_id` | `X-Qwen-Client-Id` header, truncated to 128 chars |
| `qwen-code.daemon.request` (permission routes) | `qwen-code.daemon.permission.request_id` | URL param `:requestId` |
| `qwen-code.daemon.bridge` (`prompt.dispatch`) | `qwen-code.client_id` | from `context.clientId` in `sendPrompt` |

## Files modified

1. `packages/core/src/telemetry/daemon-tracing.ts` — extend options, add helper
2. `packages/core/src/telemetry/daemon-tracing.test.ts` — new test cases
3. `packages/core/src/telemetry/index.ts` — export
4. `packages/cli/src/serve/server.ts` — route matcher + middleware enrichment
5. `packages/acp-bridge/src/bridge.ts` — client_id on prompt.dispatch span
6. `packages/acp-bridge/src/bridge.test.ts` — capture span attributes, verify client_id

## Verification

1. `cd packages/core && npx vitest run src/telemetry/daemon-tracing.test.ts`
2. `cd packages/acp-bridge && npx vitest run src/bridge.test.ts`
3. Full typecheck: `npx tsc --noEmit` in affected packages

## Final Implementation Status

- **PR #4556**: MERGED on 2026-05-29.
- **Title**: "feat(telemetry): trace daemon prompt lifecycle"
- **Summary**: The `client_id` attribute and permission route spans planned here were implemented as part of PR #4556. The `DaemonRequestSpanOptions` was extended with `clientId`, permission route matching was added to `resolveDaemonTelemetryRoute`, and `addDaemonRequestAttribute` helper was introduced.
- **Key divergences**: The plan described these as additions to the `feat/daemon-otel-e2e-design` branch. They were merged as part of the same PR #4556, not as a separate follow-up. The `prompt_id` attribute (noted as post-rebase) was also likely included in the final merge.
- **Files changed in #4556** (14): `packages/core/src/telemetry/daemon-tracing.ts`, `packages/core/src/telemetry/daemon-tracing.test.ts`, `packages/core/src/telemetry/index.ts`, `packages/cli/src/serve/server.ts`, `packages/acp-bridge/src/bridge.ts`, `packages/acp-bridge/src/bridge.test.ts`, plus Session.ts, runQwenServe.ts, bridgeOptions.ts, metrics.ts, runtime-config.ts, sdk.ts, session-tracing.ts/test.
