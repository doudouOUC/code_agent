# refactor: extract shared release helper utilities

PR: #3834 | Merged: 2026-05-05 | +211/-108 | 5 files

## What it does
Extracts four duplicated utility functions (`getArgs`, `readJson`, `validateVersion`, `isExpectedMissingGitHubRelease`) from three separate `get-release-version.js` scripts into a single shared module at `scripts/lib/release-helpers.js`. Also fixes a pre-existing bug where argument values containing `=` were silently truncated.

## Key files changed
- `scripts/lib/release-helpers.js`: New shared module with extracted utilities
- `scripts/get-release-version.js`: Refactored to import from shared module
- `packages/sdk-python/scripts/get-release-version.js`: Refactored to import from shared module
- `packages/sdk-typescript/scripts/get-release-version.js`: Refactored to import from shared module
- `scripts/tests/release-helpers.test.js`: 17 unit tests for shared module

## Final Implementation Status
- **Status**: MERGED (2026-05-05)
- **Outcome**: Implemented as designed
