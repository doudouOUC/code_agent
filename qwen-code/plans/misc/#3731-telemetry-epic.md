# Plan: Clean up `useCollector` and `TelemetryTarget.QWEN` dead code

## Context

Issue #3731 P1 checklist has two items:
- "Clean up `useCollector` dead setting — either wire it into SDK init or remove from config/docs"
- "Clean up `target` enum — `QWEN` value exists but is unreachable through config resolution"

Both are dead code: `useCollector` is plumbed through config but never consumed by the SDK; `TelemetryTarget.QWEN` exists in the enum but `parseTelemetryTargetValue()` only accepts `local`/`gcp`, so passing `'qwen'` throws a `FatalConfigError`.

**Decision: remove both.** Neither has any runtime consumer, and keeping them misleads users who see them in docs/settings.

## Changes

### 1. Remove `TelemetryTarget.QWEN` from the enum

**File:** `packages/core/src/telemetry/index.ts:10` — delete the `QWEN = 'qwen'` line.

### 2. Remove `useCollector` from `TelemetrySettings`

**File:** `packages/core/src/config/config.ts:241` — remove `useCollector?: boolean;` from the interface.

### 3. Remove `getTelemetryUseCollector()` getter

**File:** `packages/core/src/config/config.ts:2210-2212` — delete the method.

### 4. Remove `useCollector` from Config constructor assignment

**File:** `packages/core/src/config/config.ts:863` — remove the `useCollector: params.telemetry?.useCollector,` line.

### 5. Remove `useCollector` from `resolveTelemetrySettings()`

**File:** `packages/core/src/telemetry/config.ts:112-114` — remove the `useCollector` resolution block.
**File:** `packages/core/src/telemetry/config.ts:144` — remove `useCollector` from the return object.

### 6. Remove `useCollector` from `TelemetryArgOverrides`

This interface (`packages/core/src/telemetry/config.ts:37-44`) does not have a `useCollector` field — no change needed.

### 7. Update tests

- **`packages/core/src/config/config.test.ts:977-1002`** — remove 3 tests for `useCollector` constructor behavior.
- **`packages/core/src/config/config.test.ts:1132-1138, 1211-1215`** — keep tests for default target, they test `LOCAL`/`GCP` which are still valid.
- **`packages/core/src/telemetry/config.test.ts`** — remove `useCollector` from settings fixtures and expected results throughout.
- **`packages/core/src/telemetry/sdk.test.ts:139`** — remove `getTelemetryUseCollector` from mock config.
- **`packages/core/src/telemetry/sdk.test.ts:385-405`** — remove the test "should use OTLP exporters when target is gcp but useCollector is true" (tests dead behavior).
- **`packages/core/src/telemetry/sdk.test.ts:554`** — remove `getTelemetryUseCollector` from second mock config.
- **`packages/cli/src/config/config.test.ts:2896-2903`** — remove test for `QWEN_TELEMETRY_USE_COLLECTOR` env var.

### 8. Update documentation

- **`docs/users/configuration/settings.md:482`** — remove `telemetry.useCollector` row from settings table.
- **`docs/users/configuration/settings.md:582`** — remove `QWEN_TELEMETRY_USE_COLLECTOR` row from env var table.
- **`docs/developers/development/telemetry.md:73`** — remove `useCollector` row from developer reference table.
- **`docs/developers/development/telemetry.md:76`** — remove `useCollector` from the boolean env var note.

### 9. Remove `QWEN_TELEMETRY_USE_COLLECTOR` env var handling

**File:** `packages/core/src/telemetry/config.ts:112-114` — already covered in step 5.

## Files to modify (summary)

1. `packages/core/src/telemetry/index.ts`
2. `packages/core/src/config/config.ts`
3. `packages/core/src/telemetry/config.ts`
4. `packages/core/src/config/config.test.ts`
5. `packages/core/src/telemetry/config.test.ts`
6. `packages/core/src/telemetry/sdk.test.ts`
7. `packages/cli/src/config/config.test.ts`
8. `docs/users/configuration/settings.md`
9. `docs/developers/development/telemetry.md`

## Verification

```bash
# Type check
npm run typecheck

# Run affected unit tests
cd packages/core && npx vitest run src/config/config.test.ts src/telemetry/config.test.ts src/telemetry/sdk.test.ts
cd packages/cli && npx vitest run src/config/config.test.ts

# Grep to confirm no remaining references
grep -rn 'useCollector\|USE_COLLECTOR' --include='*.ts' --include='*.md' . | grep -v node_modules
grep -rn 'QWEN' packages/core/src/telemetry/index.ts
```

## Final Implementation Status

- **PR status**: No standalone PR was created for this cleanup. Parent issue #3731 remains OPEN.
- **What was implemented**: The cleanup described in this plan (removing `useCollector` and `TelemetryTarget.QWEN` dead code) was not implemented as a dedicated PR. PR #4367 (merged 2026-05-21) touched overlapping telemetry files but focused on custom resource attributes and metric cardinality controls rather than dead code removal.
- **Key divergences**: Plan was never executed. The dead code (`useCollector` setting and `QWEN` target enum value) likely still exists in the codebase.
- **Current state**: Blocked/deferred — the issue tracking this work (#3731) is still open.
