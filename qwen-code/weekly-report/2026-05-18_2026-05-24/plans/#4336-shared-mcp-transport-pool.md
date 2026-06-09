# feat(serve): shared MCP transport pool [F2]

PR: #4336 | Merged: 2026-05-21 | +10308/-147 | 38 files

## What it does
Implements F2 shared MCP transport pool for Mode B daemon. Introduces McpTransportPool with fingerprint-keyed refcounting, SessionMcpView for per-session tool/prompt filtering, cross-platform pid sweep for process cleanup, and pool-aware status/restart HTTP routes. Delivered as 6 atomic feature commits + 16 review fold-ins.

## Key files changed
- `packages/core/src/tools/mcp-transport-pool.ts`: Pool core with fingerprint key, refcount, drain state machine, snapshot replay, generation guard
- `packages/core/src/tools/session-mcp-view.ts`: Per-session filtered view of pooled MCP tools/prompts
- `packages/core/src/tools/pid-descendants.ts`: Cross-platform pid sweep (Linux/macOS pgrep + Windows CIM)
- `packages/cli/src/acp-integration/acpAgent.ts`: Wire pool into QwenAgent daemon mode
- `packages/cli/src/serve/server.ts`: Pool-aware status + restart routes with capability tags

## Final Implementation Status
- **Status**: MERGED (2026-05-21)
- **Outcome**: Implemented as designed — full F2 feature for Mode B Wave 5
