# feat(cli): support tools.sandboxImage in settings

PR: #3146 | Merged: 2026-04-13 | +146/-19 | 8 files

## What it does
Adds first-class `tools.sandboxImage` setting support for sandbox image selection. Establishes a clear resolution order: `--sandbox-image` flag > `QWEN_SANDBOX_IMAGE` env var > `tools.sandboxImage` setting > package default. Updates documentation and schema accordingly.

## Key files changed
- `packages/cli/src/config/config.ts`: Add sandboxImage resolution from settings
- `packages/cli/src/config/settingsSchema.ts`: Add tools.sandboxImage to schema
- `packages/cli/src/config/sandboxConfig.ts`: Wire up precedence logic
- `docs/users/configuration/settings.md`: Document new setting
- `docs/users/features/sandbox.md`: Add usage examples

## Final Implementation Status
- **Status**: MERGED (2026-04-13)
- **Outcome**: Implemented as designed
