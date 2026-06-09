# feat(telemetry): define HTTP OTLP endpoint behavior and signal routing

PR: #3779 | Merged: 2026-05-01 | +1387/-102 | 11 files

## What it does
Adds explicit HTTP OTLP signal routing with `resolveHttpOtlpUrl()` that appends `/v1/traces`, `/v1/logs`, `/v1/metrics` to base endpoints per OTel spec. Introduces per-signal endpoint overrides for non-standard backends and a `LogToSpanProcessor` that bridges OTel log records to spans for traces-only backends using session-based traceId correlation (SHA-256 of sessionId).

## Key files changed
- `packages/core/src/telemetry/config.ts`: Per-signal endpoint fields and resolution logic
- `packages/core/src/telemetry/log-to-span-processor.ts`: New bridge processor with traceId derivation
- `packages/core/src/telemetry/log-to-span-processor.test.ts`: Tests for attribute mapping, duration, traceId
- `packages/core/src/telemetry/sdk.test.ts`: Integration tests for endpoint wiring
- `packages/core/src/config/config.ts`: New TelemetrySettings fields for overrides
- `docs/developers/development/telemetry.md`: Documentation for new endpoint config

## Final Implementation Status
- **Status**: MERGED (2026-05-01)
- **Outcome**: Implemented as designed
