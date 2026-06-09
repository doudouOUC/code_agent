# fix(cli): add API Key option to `qwen auth` interactive menu

PR: #3624 | Merged: 2026-04-27 | +496/-86 | 6 files

## What it does
Adds a missing "API Key" option to the `qwen auth` CLI menu with two sub-paths: Alibaba Cloud ModelStudio Standard API Key (guided flow for region, key, model IDs) and Custom API Key (docs link for manual config). Also adds `qwen auth api-key` yargs subcommand and refactors shared helpers.

## Key files changed
- `packages/cli/src/commands/auth.ts`: Added `api-key` yargs subcommand definition
- `packages/cli/src/commands/auth/handler.ts`: Implemented API Key menu flow with Alibaba Standard and Custom sub-paths
- `docs/users/configuration/auth.md`: Updated documentation for new auth options
- `docs/users/quickstart.md`: Updated quickstart with API Key flow

## Final Implementation Status
- **Status**: MERGED (2026-04-27)
- **Outcome**: Implemented as designed
