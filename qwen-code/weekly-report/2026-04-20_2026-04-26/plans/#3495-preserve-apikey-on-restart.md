# fix(core): preserve settings-sourced apiKey when registry model envKey is absent

PR: #3495 | Merged: 2026-04-25 | +675/-0 | 2 files

## What it does
Fixes a 401 error on restart where `applyResolvedModelDefaults` unconditionally cleared the apiKey resolved from `settings.security.auth.apiKey` and only read from `process.env[model.envKey]`. Now captures the previously-resolved key before clearing and falls back to it when the provider-specific env var is absent, but only for safe source kinds (`settings` and general `env`).

## Key files changed
- `packages/core/src/models/modelsConfig.ts`: Preserve apiKey fallback logic with safe-source guard
- `packages/core/src/models/modelsConfig.test.ts`: 5 new test cases covering restart fallback, env priority, programmatic key atomicity, cross-model safety, and env var preservation

## Final Implementation Status
- **Status**: MERGED (2026-04-25)
- **Outcome**: Implemented as designed
