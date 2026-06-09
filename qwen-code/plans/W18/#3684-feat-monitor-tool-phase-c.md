# feat(core): event monitor tool with throttled stdout streaming (Phase C)

PR: #3684 | Merged: 2026-05-02 | +6297/-147 | 37 files

## What it does
Introduces a new Monitor tool that spawns long-running shell commands and streams stdout/stderr back to the agent as event notifications with token-bucket throttling (burst=5, sustain=1/sec). Includes MonitorRegistry with lifecycle management, idle timeout, max events auto-stop, and AbortController-based cancellation. Also adds sleep interception in shell.ts that blocks foreground `sleep N` (N>=2) and guides model to use Monitor instead.

## Key files changed
- `integration-tests/cli/monitor.test.ts`: Integration tests for monitor tool
- `integration-tests/cli/sleep-interception.test.ts`: Tests for sleep blocking
- `packages/cli/src/config/config.ts`: Monitor configuration options
- `packages/cli/src/nonInteractive/session.ts`: Headless session monitor wiring
- `packages/cli/src/nonInteractiveCli.ts`: Non-interactive CLI monitor support
- `packages/cli/src/ui/commands/clearCommand.ts`: Background work blocking for /clear

## Final Implementation Status
- **Status**: MERGED (2026-05-02)
- **Outcome**: Implemented as designed
