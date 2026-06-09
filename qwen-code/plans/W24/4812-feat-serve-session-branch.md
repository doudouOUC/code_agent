# feat(serve): add POST /session/:id/branch for session forking

PR: #4812 | Merged: 2026-06-08 | +396/-63 | 15 files

## What it does
Adds `POST /session/:id/branch` HTTP route that forks a live session's JSONL transcript and loads the fork via resume semantics (no history replay). Remote clients (web shell, IDE extensions, SDK) can programmatically branch sessions without the interactive CLI dialog. This is T3.1 from #4514.

## Key files changed
- `packages/cli/src/serve/server.ts`: New `/branch` route returning 201 with new sessionId + title
- `packages/cli/src/acp-integration/acpAgent.ts`: Branch extMethod implementation
- `packages/acp-bridge/src/bridge.ts`: Bridge-side branch handling
- `packages/cli/src/serve/acpSessionBridge.ts`: Session bridge fork support
- `packages/cli/src/serve/capabilities.ts`: Branch capability advertisement

## Final Implementation Status
- **Status**: MERGED (2026-06-08)
- **Outcome**: Implemented as designed
