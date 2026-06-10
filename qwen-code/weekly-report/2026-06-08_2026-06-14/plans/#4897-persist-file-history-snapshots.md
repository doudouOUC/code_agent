# feat(core): persist file history snapshots for cross-session /rewind (T2.1)

PR: #4897 | OPEN | +318/-17 | 10 files

## What it does

Persists `FileHistorySnapshot` to JSONL as system records so that `/rewind` works across session resume. Previously snapshots were purely in-memory and lost on process exit, blocking the graduation of `loadSession`/`resume` from `unstable_` prefix.

## Key files changed

- `packages/core/src/services/fileHistoryService.ts`: Add serialize/deserialize logic, record snapshots after `makeSnapshot`
- `packages/core/src/services/chatRecordingService.ts`: New `file_history_snapshot` system record type
- `packages/core/src/services/sessionService.ts`: Load persisted snapshots on session resume
- `packages/core/src/core/client.ts`: Wire snapshot persistence into turn lifecycle
- `packages/cli/src/ui/AppContainer.tsx`: UI integration for restored snapshot state

## Final Implementation Status

- **Status**: OPEN
- **Outcome**: Enables cross-session /rewind, unblocking T2.1 session-resume stabilization; replaces stalled PR #4253
