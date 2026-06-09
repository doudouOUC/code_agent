# feat(serve): add HTTP rewind endpoints for daemon/web-shell (issue #4514 T3.2)

PR: #4820 | Merged: 2026-06-07 | +474/-14 | 16 files

## What it does
Adds HTTP rewind endpoints (`GET /session/:id/rewind/snapshots` and `POST /session/:id/rewind`) so web-shell and SDK clients can rewind a session's conversation and files to a previous turn. Extends `rewindSession` ACP extMethod to accept `promptId` parameter and perform file history rewind via `FileHistoryService`. Adds `SessionBusyError` (409) and `InvalidRewindTargetError` (400) error classes, plus `session_rewound` SSE event.

## Key files changed
- `packages/cli/src/serve/server.ts`: New GET/POST rewind routes
- `packages/cli/src/acp-integration/acpAgent.ts`: Extended rewindSession extMethod with promptId + file rewind
- `packages/acp-bridge/src/bridgeErrors.ts`: SessionBusyError, InvalidRewindTargetError
- `packages/cli/src/serve/capabilities.ts`: Rewind capability advertisement

## Final Implementation Status
- **Status**: MERGED (2026-06-07)
- **Outcome**: Implemented as designed
