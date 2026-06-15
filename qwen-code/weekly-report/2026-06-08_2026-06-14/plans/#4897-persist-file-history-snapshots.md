# feat(core): persist file history snapshots for cross-session /rewind (T2.1)

PR: #4897 | MERGED: 2026-06-12 | +375/-19 | 13 files

## What it does

Persists `FileHistorySnapshot` to JSONL as system records so that `/rewind` works across session resume. Previously snapshots were purely in-memory and lost on process exit, blocking the graduation of session resume from the unstable capability alias. The final PR also advertises stable `session_resume` while keeping `unstable_session_resume`, enables file checkpointing explicitly for ACP sessions, seeds resumed TUI prompt counts to avoid prompt-id collisions, validates restored backup files, and re-records surviving file-history snapshots after rewind.

## Key files changed

- `packages/core/src/services/fileHistoryService.ts`: Add serialize/deserialize logic, record snapshots after `makeSnapshot`
- `packages/core/src/services/chatRecordingService.ts`: New `file_history_snapshot` system record type
- `packages/core/src/services/sessionService.ts`: Load persisted snapshots on session resume
- `packages/core/src/core/client.ts`: Wire snapshot persistence into turn lifecycle
- `packages/cli/src/acp-integration/acpAgent.ts`: Enable file checkpointing in ACP sessions
- `packages/cli/src/acp-integration/session/Session.ts`: Snapshot ACP turns and keep surviving snapshots after rewind
- `packages/cli/src/serve/capabilities.ts`: Advertise stable `session_resume` plus the deprecated unstable alias
- `packages/cli/src/ui/AppContainer.tsx`: UI integration for restored snapshot state and resumed prompt count

## Final Implementation Status

- **Status**: MERGED (2026-06-12)
- **Outcome**: Enables cross-session `/rewind`, stabilizes resume capability advertising, and keeps ACP/TUI snapshot indexes aligned after resume and rewind; replaces stalled PR #4253
