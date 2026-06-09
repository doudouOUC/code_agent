# feat(cli): enable /remember, /forget, /dream in ACP mode (v2)

PR: #4819 | Merged: 2026-06-06 | +302/-43 | 6 files

## What it does
Second iteration of enabling `/remember`, `/forget`, `/dream` in ACP mode. Adds `supportedModes: ['interactive', 'acp']` declarations plus error handling and config guards. Includes conditional eager `recordDream` logic for ACP (fire-and-forget) vs interactive (`onComplete`) paths.

## Key files changed
- `packages/cli/src/ui/commands/dreamCommand.ts`: Conditional eager `recordDream` for ACP mode
- `packages/cli/src/ui/commands/forgetCommand.ts`: ACP mode with filesystem/model error handling
- `packages/cli/src/ui/commands/rememberCommand.ts`: ACP mode support

## Final Implementation Status
- **Status**: MERGED (2026-06-06)
- **Outcome**: Implemented as designed
