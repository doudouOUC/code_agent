# feat(sdk-python): add network timeouts to release version helper

PR: #3833 | Merged: 2026-05-05 | +105/-3 | 2 files

## What it does
Adds timeout guards to all `execSync` calls in the Python SDK release version script. The `gh release view` call inside the version-conflict while loop previously had no timeout, meaning an unresponsive GitHub API could hang CI until the 360-minute job limit. Now fails fast with a clear error message.

## Key files changed
- `packages/sdk-python/scripts/get-release-version.js`: Added AbortSignal.timeout to all execSync calls
- `scripts/tests/get-release-version-python-sdk.test.js`: Tests for timeout behavior

## Final Implementation Status
- **Status**: MERGED (2026-05-05)
- **Outcome**: Implemented as designed
