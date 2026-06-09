# fix(core): shrink file diff session records

PR: #3872 | Merged: 2026-05-06 | +616/-20 | 12 files

## What it does
Session history now stores bounded previews for oversized file edit results instead of persisting full pre-edit content, post-edit content, and giant diffs. This prevents large edit/write operations from inflating JSONL history and making session listing and resume noticeably slow.

## Key files changed
- `packages/cli/src/utils/truncatedDiffPreview.ts`: New utility for bounded diff previews
- `packages/core/src/services/chatRecordingService.test.ts`: Tests for trimmed recording
- `packages/cli/src/acp-integration/session/emitters/ToolCallEmitter.ts`: Apply trimming to emitted records
- `packages/cli/src/ui/components/messages/ToolMessage.tsx`: Handle preview display
- `packages/cli/src/ui/utils/export/normalize.ts`: Normalize trimmed records for export
- `packages/cli/src/ui/utils/export/collect.ts`: Collect with preview awareness

## Final Implementation Status
- **Status**: MERGED (2026-05-06)
- **Outcome**: Implemented as designed
