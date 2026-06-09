# feat(sdk-python): add PyPI release workflow

PR: #3685 | Merged: 2026-05-04 | +2082/-32 | 8 files

## What it does
Adds a dedicated GitHub Actions workflow to build, validate, and publish `qwen-code-sdk` to PyPI. Includes a version computation script supporting stable, preview, and nightly releases with PyPI/GitHub conflict checks. Wires `npm run build:sdk:python` and updates existing CI to react to the new release workflow.

## Key files changed
- `.github/workflows/release-sdk-python.yml`: New release workflow for PyPI trusted publishing
- `packages/sdk-python/scripts/get-release-version.js`: Version computation with conflict detection
- `.github/workflows/sdk-python.yml`: Updated CI triggers for release workflow
- `scripts/tests/get-release-version-python-sdk.test.js`: Version logic tests
- `package.json`: Added `build:sdk:python` script

## Final Implementation Status
- **Status**: MERGED (2026-05-04)
- **Outcome**: Implemented as designed
