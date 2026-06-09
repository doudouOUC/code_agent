# feat(cli): enable /remember, /forget, /dream in ACP mode

PR: #4811 | Merged: 2026-06-06 | +278/-43 | 6 files

## What it does
Enables `/remember`, `/forget`, `/dream` slash commands in ACP mode (web-shell) by adding `supportedModes: ['interactive', 'acp']`. Adds try-catch in `/forget` handler for user-friendly error messages. Documents that `/dream`'s `onComplete` callback is not invoked in ACP mode.

## Key files changed
- `packages/cli/src/ui/commands/rememberCommand.ts`: Add ACP mode support
- `packages/cli/src/ui/commands/forgetCommand.ts`: Add ACP mode support + error handling
- `packages/cli/src/ui/commands/dreamCommand.ts`: Add ACP mode support with onComplete limitation

## Final Implementation Status
- **Status**: MERGED (2026-06-06)
- **Outcome**: Implemented as designed
