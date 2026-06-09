# feat(SDK) Add Python SDK implementation for #3010

PR: #3494 | Merged: 2026-04-24 | +4676/-14 | 25 files

## What it does
Adds the `packages/sdk-python` SDK package with full Python implementation supporting async `query`, sync `query_sync`, process transport, control requests, and permission handling. Includes a real E2E smoke test script and CI workflow for Python SDK validation.

## Key files changed
- `packages/sdk-python/src/qwen_code_sdk/__init__.py`: Core SDK implementation
- `packages/sdk-python/pyproject.toml`: Package configuration with dependencies
- `packages/sdk-python/scripts/smoke_real.py`: E2E smoke test against real CLI
- `.github/workflows/sdk-python.yml`: CI workflow for Python SDK
- `docs/developers/sdk-python.md`: Developer documentation
- `packages/sdk-python/README.md`: Usage guide and API reference

## Final Implementation Status
- **Status**: MERGED (2026-04-24)
- **Outcome**: Implemented as designed
