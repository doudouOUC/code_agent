# fix(core): preserve uid in atomicWriteFile to avoid breaking shared-write files

PR: #4431 | Merged: 2026-06-01 | +206/-47 | 4 files

## What it does
Fixes atomicWriteFile silently stripping file ownership (uid) on write-to-tmp + rename, which broke shared-write files and Docker bind-mounted sources. When the existing file's uid differs from the process's euid, falls back to in-place writeFile (truncate existing inode) instead of rename, preserving uid at the cost of crash atomicity for that specific case.

## Key files changed
- `packages/core/src/utils/atomicFileWrite.ts`: uid check + in-place fallback when uid mismatch detected
- `packages/core/src/utils/atomicFileWrite.test.ts`: Tests for uid preservation behavior
- `packages/core/src/services/worktreeSessionService.ts`: Adjusted for new atomicWriteFile signature
- `packages/core/src/utils/runtimeStatus.ts`: Related runtime status utility update

## Final Implementation Status
- **Status**: MERGED (2026-06-01)
- **Outcome**: Implemented as designed — fixes regression introduced by #4096 in v0.16.0
