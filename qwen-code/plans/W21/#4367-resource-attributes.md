# feat(telemetry): support custom resource attributes and add metric cardinality controls

PR: #4367 | Merged: 2026-05-21 | +1897/-60 | 13 files

## What it does

Adds support for operator-defined custom resource attributes on OpenTelemetry resources, allowing deployment-specific metadata (e.g. cluster name, environment, team) to be attached to all telemetry signals. Also introduces metric cardinality controls via a new `telemetry.metricCardinalityMode` setting that lets operators choose between full-fidelity and reduced-cardinality metric emission to prevent high-cardinality attribute explosion in production backends.

## Key files changed
- `packages/core/src/telemetry/resource-attributes.ts`: New module for parsing and validating custom resource attributes
- `packages/core/src/telemetry/resource-attributes.test.ts`: Comprehensive tests for attribute parsing
- `packages/core/src/telemetry/config.ts`: Extended telemetry config with resource attribute and cardinality settings
- `packages/core/src/telemetry/config.test.ts`: Config tests
- `packages/core/src/telemetry/sdk.ts`: Wired custom attributes into OTel SDK resource initialization
- `packages/core/src/telemetry/sdk.test.ts`: SDK initialization tests with custom attributes
- `packages/core/src/telemetry/metrics.ts`: Cardinality mode gating for metric attribute sets
- `packages/core/src/telemetry/metrics.test.ts`: Metric cardinality tests
- `packages/core/src/config/config.ts`: Config plumbing for new settings
- `packages/cli/src/config/settingsSchema.ts`: Settings schema entries
- `docs/design/telemetry-resource-attributes-design.md`: Design document
- `docs/developers/development/telemetry.md`: Developer documentation

## Final Implementation Status
- **Status**: MERGED (2026-05-21)
- **Outcome**: Implemented as designed
