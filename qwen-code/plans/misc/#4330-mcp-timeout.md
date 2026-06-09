# Plan: Enforce SDK/server MCP-restart timeout coupling (Option A)

## Context

Issue #4330: `MCP_RESTART_TIMEOUT_MS` (300s) in `acp-bridge/src/bridge.ts` and `MCP_RESTART_DEFAULT_TIMEOUT_MS` (330s) in `sdk-typescript/src/daemon/DaemonClient.ts` are coupled only by documentation. A future bump on either side could silently break the 30s headroom invariant. Option A: export shared constants from acp-bridge so the SDK computes its deadline from the server value.

## Changes

### 1. New file: `packages/acp-bridge/src/mcpTimeouts.ts`

Export two constants:
```ts
export const MCP_RESTART_SERVER_DEADLINE_MS = 300_000;
export const MCP_RESTART_CLIENT_HEADROOM_MS = 30_000;
```

### 2. `packages/acp-bridge/src/index.ts`

Add: `export * from './mcpTimeouts.js';`

### 3. `packages/acp-bridge/package.json`

Add sub-path export:
```json
"./mcpTimeouts": {
  "types": "./dist/mcpTimeouts.d.ts",
  "import": "./dist/mcpTimeouts.js"
}
```

### 4. `packages/acp-bridge/src/bridge.ts` (line 602)

Replace local `const MCP_RESTART_TIMEOUT_MS = 300_000;` with:
```ts
import { MCP_RESTART_SERVER_DEADLINE_MS } from './mcpTimeouts.js';
```
Then replace all usages of `MCP_RESTART_TIMEOUT_MS` → `MCP_RESTART_SERVER_DEADLINE_MS`.

### 5. `packages/sdk-typescript/package.json`

Add dependency:
```json
"@qwen-code/acp-bridge": "file:../acp-bridge"
```

### 6. `packages/sdk-typescript/src/daemon/DaemonClient.ts` (line ~100-122)

Replace local constant + long comment with:
```ts
import {
  MCP_RESTART_SERVER_DEADLINE_MS,
  MCP_RESTART_CLIENT_HEADROOM_MS,
} from '@qwen-code/acp-bridge/mcpTimeouts';

const MCP_RESTART_DEFAULT_TIMEOUT_MS =
  MCP_RESTART_SERVER_DEADLINE_MS + MCP_RESTART_CLIENT_HEADROOM_MS;
```

Keep a one-line comment explaining the sum if needed.

## Files touched

- `packages/acp-bridge/src/mcpTimeouts.ts` (new)
- `packages/acp-bridge/src/index.ts`
- `packages/acp-bridge/package.json`
- `packages/acp-bridge/src/bridge.ts`
- `packages/sdk-typescript/package.json`
- `packages/sdk-typescript/src/daemon/DaemonClient.ts`

## Verification

1. `npm run build --workspace=packages/acp-bridge` — ensure new export compiles
2. `npm run build --workspace=packages/sdk-typescript` — ensure import resolves
3. `grep -r MCP_RESTART packages/` — confirm no stale local copies remain
4. Run existing tests for both packages

## Final Implementation Status

- **PR #4658**: MERGED (2026-06-01) — "fix(infra): enforce SDK/server MCP-restart timeout coupling (#4330)"
- **Issue #4330**: CLOSED
- **Summary**: Implementation followed the plan (Option A) precisely. Shared constants exported from `acp-bridge/src/mcpTimeouts.ts`, SDK imports and computes its deadline from the server value.
- **Key divergences**: Minor — PR also touched `scripts/build.js` (build pipeline adjustment) and added a test in `DaemonClient.test.ts`. The sub-path export approach and constant naming match the plan exactly.
- **Files changed**: `mcpTimeouts.ts` (new), `acp-bridge/package.json`, `bridge.ts`, `sdk-typescript/package.json`, `DaemonClient.ts`, `DaemonClient.test.ts`, `scripts/build.js`.
