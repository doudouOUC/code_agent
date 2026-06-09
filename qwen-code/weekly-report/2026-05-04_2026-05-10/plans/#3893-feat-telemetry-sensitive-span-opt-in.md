# feat(telemetry): add sensitive span attribute opt-in

PR: #3893 | Merged: 2026-05-07 | +414/-52 | 15 files

## What it does
Adds an opt-in telemetry setting that allows sensitive attributes (prompt text, tool arguments, model responses) to be included in spans produced by the log-to-span bridge, while keeping the default filtering behavior. Also records model response text for non-internal prompts in API response telemetry, excluding thought text and internal prompt responses.

## Key files changed
- `packages/core/src/telemetry/config.ts`: New sensitive bridge setting with default off
- `packages/core/src/telemetry/log-to-span-processor.ts`: Conditional attribute retention
- `packages/core/src/core/loggingContentGenerator/loggingContentGenerator.ts`: Response text source events
- `packages/core/src/config/config.ts`: New TelemetrySettings field
- `packages/cli/src/config/settingsSchema.ts`: Schema definition for opt-in setting
- `docs/developers/development/telemetry.md`: Documentation for sensitive attribute config

## Final Implementation Status
- **Status**: MERGED (2026-05-07)
- **Outcome**: Implemented as designed
