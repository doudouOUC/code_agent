# fix(cli): auto-submit on number key press in AskUserQuestionDialog

PR: #3407 | Merged: 2026-04-18 | +135/-65 | 2 files

## What it does
Fixes number key behavior in `AskUserQuestionDialog` so that pressing a number key auto-submits immediately for single-select predefined options (matching `RadioButtonSelect` behavior). Multi-select and "Other" custom input remain highlight-only. Extracts a shared `selectAndAdvance` helper to deduplicate logic across 4 code paths.

## Key files changed
- `packages/cli/src/ui/components/messages/AskUserQuestionDialog.tsx`: Implement auto-submit for single-select, extract shared helper
- `packages/cli/src/ui/components/messages/AskUserQuestionDialog.test.tsx`: Add 3 new tests for auto-submit, multi-select, and Other behaviors

## Final Implementation Status
- **Status**: MERGED (2026-04-18)
- **Outcome**: Implemented as designed
