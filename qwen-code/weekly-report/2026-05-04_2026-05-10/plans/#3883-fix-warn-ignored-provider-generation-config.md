# fix(cli): warn on ignored provider generation config

PR: #3883 | Merged: 2026-05-07 | +296/-5 | 6 files

## What it does
Adds a startup warning when a selected provider-backed model has top-level generation settings that will not apply (since provider-backed models use their provider entry as effective configuration). Also clarifies local model configuration examples in documentation to prevent misconfiguration.

## Key files changed
- `packages/cli/src/utils/modelConfigUtils.ts`: Warning detection logic for ignored settings
- `packages/cli/src/utils/modelConfigUtils.test.ts`: Tests for warning conditions
- `packages/core/src/index.ts`: Export for config validation utility
- `docs/users/configuration/model-providers.md`: Clarified provider config examples
- `docs/users/configuration/settings.md`: Updated settings documentation
- `README.md`: Minor config documentation update

## Final Implementation Status
- **Status**: MERGED (2026-05-07)
- **Outcome**: Implemented as designed
