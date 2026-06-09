# perf(core): F2 cleanup PR A — R9/W11/W12/R10 (post-merge follow-ups)

PR: #4411 | Merged: 2026-05-23 | +823/-594 | 8 files

## What it does
Four pure-refactor/data-structure fixes for the F2 MCP transport pool with no behavior change: refactors McpClientManager constructor from 7 positional args to options object, extracts acquire() helpers, precomputes filter Sets in SessionMcpView for O(1) per-tool predicates, and switches pid-descendants from per-pid pgrep BFS to single ps snapshot + in-memory tree walk.

## Key files changed
- `packages/core/src/tools/mcp-client-manager.ts`: Constructor refactored to (config, toolRegistry, options?)
- `packages/core/src/tools/mcp-transport-pool.ts`: Extracted attachPooledSession + rollbackReservationOnSpawnFailure helpers
- `packages/core/src/tools/session-mcp-view.ts`: Precomputed filter Sets for O(1) tool filtering
- `packages/core/src/tools/pid-descendants.ts`: Single ps snapshot + in-memory BFS (fallback for BusyBox)
- `packages/core/src/tools/mcp-client-manager.test.ts`: mkManager factory replacing 80 inline constructions

## Final Implementation Status
- **Status**: MERGED (2026-05-23)
- **Outcome**: Implemented as designed — fork hygiene + code clarity + data-structure correctness
