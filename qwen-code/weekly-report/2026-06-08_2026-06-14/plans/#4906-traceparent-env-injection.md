# feat(telemetry): inject TRACEPARENT env var into shell child processes

PR: #4906 | OPEN | +463/-104 | 11 files

## What it does

When `outboundCorrelation.propagateTraceContext` is enabled, injects a W3C `TRACEPARENT` environment variable into all shell child processes (Bash tool, hooks, monitor) so CLI tools and Python scripts can participate in distributed tracing. Extracts a shared `trace-context.ts` module from `debugLogger.ts` to eliminate code duplication.

## Key files changed

- `packages/core/src/telemetry/trace-context.ts`: New shared module for W3C trace context formatting and validation
- `packages/core/src/utils/shellContextEnv.ts`: Inject TRACEPARENT into shell spawn environment
- `packages/core/src/utils/debugLogger.ts`: Refactored to use shared trace-context module
- `packages/core/src/telemetry/sdk.ts`: Wire propagation config into telemetry SDK
- `packages/cli/src/config/settingsSchema.ts`: Schema update for propagateTraceContext setting

## Final Implementation Status

- **Status**: OPEN
- **Outcome**: Extends distributed tracing coverage to shell child processes; enables end-to-end trace correlation for CLI tools and scripts spawned by qwen-code
