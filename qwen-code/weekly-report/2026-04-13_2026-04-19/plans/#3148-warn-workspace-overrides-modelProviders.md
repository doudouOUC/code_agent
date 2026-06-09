# feat(cli): warn when workspace overrides global modelProviders

PR: #3148 | Merged: 2026-04-13 | +151/-1 | 3 files

## What it does
Adds a startup warning when trusted workspace settings define an empty `modelProviders` object that shadows user-level global providers. Explains to users that `modelProviders` uses REPLACE merge strategy and can inadvertently override their global configuration.

## Key files changed
- `packages/cli/src/config/modelProvidersScope.ts`: New module implementing the override detection logic
- `packages/cli/src/config/settings.ts`: Integrate warning into settings loading
- `packages/cli/src/config/settings.test.ts`: Tests for trusted/untrusted workspace scenarios

## Final Implementation Status
- **Status**: MERGED (2026-04-13)
- **Outcome**: Implemented as designed
