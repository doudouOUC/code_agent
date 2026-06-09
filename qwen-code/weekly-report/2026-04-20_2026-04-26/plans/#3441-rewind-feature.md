# feat(cli): add conversation rewind feature with double-ESC and /rewind command

PR: #3441 | Merged: 2026-04-25 | +1533/-6 | 21 files

## What it does
Adds conversation history rollback/rewind allowing users to return to a previous turn and restart. Activated via double-ESC on empty prompt or `/rewind` (alias `/rollback`) slash command. Opens a scrollable pick-list of user turns with confirmation, then truncates both UI and API history consistently and pre-populates input with the original prompt text.

## Key files changed
- `packages/cli/src/ui/components/RewindSelector.tsx`: Scrollable turn picker component
- `packages/cli/src/ui/commands/rewindCommand.ts`: Slash command registration
- `packages/cli/src/ui/components/Footer.tsx`: "Press Esc again to rewind" hint
- `packages/cli/src/ui/AppContainer.tsx`: Double-ESC detection and rewind trigger
- `packages/cli/src/ui/contexts/UIActionsContext.tsx`: Rewind action and history truncation logic
- `packages/cli/src/ui/hooks/slashCommandProcessor.ts`: Wire /rewind and /rollback aliases

## Final Implementation Status
- **Status**: MERGED (2026-04-25)
- **Outcome**: Implemented as designed
