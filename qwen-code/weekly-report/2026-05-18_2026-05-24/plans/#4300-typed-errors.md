# refactor(serve): typed errors for channel-closed and missing-cli-entry (#4299)

PR: #4300 | Merged: 2026-05-18 | +118/-29 | 3 files

## What it does

Introduces typed error classes for two common daemon failure modes: channel-closed (when the ACP child process exits unexpectedly) and missing-cli-entry (when the CLI entry point file cannot be found at spawn time). These replace ad-hoc string-based error checks with structured error types that the bridge can catch and map to appropriate HTTP status codes and `errorKind` values. The errors are defined in the new `acp-bridge` package's status module.

## Key files changed
- `packages/acp-bridge/src/status.ts`: New typed error classes (ChannelClosedError, MissingCliEntryError)
- `packages/acp-bridge/src/status.test.ts`: Tests for error construction and instanceof checks
- `packages/cli/src/serve/httpAcpBridge.ts`: Updated error handling to use typed errors instead of string matching

## Final Implementation Status
- **Status**: MERGED (2026-05-18)
- **Outcome**: Implemented as designed
