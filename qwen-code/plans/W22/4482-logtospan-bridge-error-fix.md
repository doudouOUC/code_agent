# fix(telemetry): improve LogToSpan bridge error info and TUI handling

PR: #4482 | Merged: 2026-05-27 | +593/-17 | 4 files

## What it does
Fixes two issues in the LogToSpanProcessor bridge (used when OTLP backend lacks log support): surfaces useful error messages on export failure (previously empty due to HTTP/2 stripping reason-phrases) by extracting name/message/httpCode/data snippet, and eliminates TUI pollution by routing diagnostics through an injectable sink (debugLogger in interactive mode, stderr in CI/batch).

## Key files changed
- `packages/core/src/telemetry/log-to-span-processor.ts`: Injectable diagnosticsSink, structured error extraction with JSON-escaping
- `packages/core/src/telemetry/log-to-span-processor.test.ts`: Tests for error formatting and sink routing
- `packages/core/src/telemetry/sdk.ts`: Injects debugLogger sink in interactive mode
- `packages/core/src/telemetry/sdk.test.ts`: Integration tests for sink wiring

## Final Implementation Status
- **Status**: MERGED (2026-05-27)
- **Outcome**: Implemented as designed — export failures now show actionable info without breaking TUI
