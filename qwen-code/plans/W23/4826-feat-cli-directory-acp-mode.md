# feat(cli): enable /directory command in ACP mode

PR: #4826 | Merged: 2026-06-07 | +350/-267 | 2 files

## What it does
Refactors `/directory` (`show`/`add`) from `addItem`-based TUI output to returning `MessageActionReturn`, enabling ACP mode (web-shell) support. Multiple `addItem` calls in the `add` subcommand are collapsed into a single return with collected messages.

## Key files changed
- `packages/cli/src/ui/commands/directoryCommand.tsx`: Refactor to MessageActionReturn + add `supportedModes: ['interactive', 'acp']`
- `packages/cli/src/ui/commands/directoryCommand.test.tsx`: Updated tests for new return type

## Final Implementation Status
- **Status**: MERGED (2026-06-07)
- **Outcome**: Implemented as designed
