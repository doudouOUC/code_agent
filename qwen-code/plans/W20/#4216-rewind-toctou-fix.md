# fix(rewind): restore upstream TOCTOU ordering + heal sticky failed marker

PR: #4216 | Merged: 2026-05-16 | +245/-16 | 6 files

## What it does
Fixes two related bugs from PR #4064. First, restores the upstream-aligned TOCTOU ordering by moving `trackEdit` before `checkPriorRead` in edit.ts and write-file.ts (the prior PR had widened the window between pre-write check and actual write). Second, fixes a sticky `failed` marker in `trackEdit` that was not cleared on subsequent runs, preventing the heal path from recording fresh backups.

## Key files changed
- `packages/core/src/tools/edit.ts`: Move trackEdit before checkPriorRead to restore TOCTOU ordering
- `packages/core/src/tools/write-file.ts`: Same TOCTOU fix for write path
- `packages/core/src/services/fileHistoryService.ts`: Allow next trackEdit to overwrite failed entry
- `packages/core/src/tools/edit.test.ts`: Tests for corrected ordering
- `packages/core/src/tools/write-file.test.ts`: Tests for write path fix
- `packages/core/src/services/fileHistoryService.test.ts`: Tests for sticky marker healing

## Final Implementation Status
- **Status**: MERGED (2026-05-16)
- **Outcome**: Implemented as designed
