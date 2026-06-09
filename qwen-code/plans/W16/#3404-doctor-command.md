# feat(cli): add /doctor diagnostic command

PR: #3404 | Merged: 2026-04-19 | +1016/-1 | 10 files

## What it does
Adds a `/doctor` slash command that performs comprehensive environment and configuration health checks across system (Node.js version, npm, platform), auth (API key validation), config (settings, model), MCP (per-server connection status), tools (registry, ripgrep), and git categories. Results are displayed in a color-coded bordered report.

## Key files changed
- `packages/cli/src/ui/commands/doctorCommand.ts`: Command registration and orchestration
- `packages/cli/src/utils/doctorChecks.ts`: Individual check implementations
- `packages/cli/src/ui/components/views/DoctorReport.tsx`: React component for formatted output
- `packages/cli/src/utils/doctorChecks.test.ts`: Unit tests for checks
- `packages/cli/src/ui/commands/doctorCommand.test.ts`: Integration tests
- `packages/cli/src/utils/systemInfo.ts`: System information gathering utilities

## Final Implementation Status
- **Status**: MERGED (2026-04-19)
- **Outcome**: Implemented as designed
