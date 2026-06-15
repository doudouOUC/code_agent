# fix(core): Persist file history snapshot updates

PR: #5057 | MERGED | +1206/-30 | 12 files

Source Codex artifacts:
- `.qwen/design/2026-06-13-file-history-snapshot-persistence.md`
- `.qwen/e2e-tests/2026-06-13-file-history-snapshot-persistence.md`

## What it does

Persist file-history snapshot updates immediately after a tracked edit/write mutates the latest snapshot, so a process exit before the next user turn no longer loses the last turn's `/rewind` state on resume.

The persisted record shape stays the existing append-only `file_history_snapshot` payload. Resume still reconstructs by `promptId` with last-wins semantics, so older session logs remain compatible and repeated snapshot updates do not require log rewriting.

## Key files changed

- `packages/core/src/services/fileHistoryService.ts`: records the latest snapshot after `trackEdit` adds or heals a backup.
- `packages/core/src/services/chatRecordingService.ts`: serializes repeated snapshot records and keeps later records authoritative during reconstruction.
- `packages/core/src/services/sessionService.test.ts` and `packages/core/src/core/client.test.ts`: cover resume/client prompt flows where snapshot updates happen inside a turn.
- `packages/cli/src/acp-integration/session/Session.test.ts`: covers the ACP prompt path.
- `.qwen/design/2026-06-13-file-history-snapshot-persistence.md` and `.qwen/e2e-tests/2026-06-13-file-history-snapshot-persistence.md`: capture the design rationale and manual resume + `/rewind` E2E scenario.

## Final Implementation Status

- **PR status**: MERGED — PR #5057 merged 2026-06-13.
- **Summary**: The implementation followed the plan: snapshot updates are recorded best-effort after real file-history mutations, duplicate non-mutating `trackEdit` calls do not emit extra records, recorder failures do not block edit/write behavior, and resume keeps the later snapshot for the same `promptId`.
- **Key divergences**: No material divergence. The plan explicitly kept `schemaVersion`, `isSnapshotUpdate`, shell edit tracking, `sed -i` simulation, `getDiffStats` concurrency limiting, and per-file failure reasons out of scope; the merged PR kept that scope.
