# fix(telemetry): add bounded shutdown timeout and fix service.version resource attribute

PR: #3813 | Merged: 2026-05-05 | +130/-3 | 2 files

## What it does
Adds a 10-second timeout race to `shutdownTelemetry()` so that unreachable OTLP endpoints fail open instead of hanging CLI exit indefinitely. Also fixes the `service.version` resource attribute which incorrectly reported Node.js runtime version instead of the actual application version from `config.getCliVersion()`.

## Key files changed
- `packages/core/src/telemetry/sdk.ts`: Added Promise.race timeout and fixed service.version attribute
- `packages/core/src/telemetry/sdk.test.ts`: Tests for timeout behavior and version attribute

## Final Implementation Status
- **Status**: MERGED (2026-05-05)
- **Outcome**: Implemented as designed
