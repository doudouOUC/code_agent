# fix(daemon): Sanitize logs and type MCP restarts

PR: #5006 | MERGED: 2026-06-12 | +185/-11 | 9 files

## What it does

Applies small daemon-mode follow-ups after the previous branch merge. It sanitizes ACP `_qwen/sessions/delete` stderr lines so client-controlled session ids and close errors cannot inject control characters into operator logs. It also exposes pooled MCP restart results and the `entryIndex` query parameter through the TypeScript SDK, and updates the web shell restart dialog to handle pooled restart responses.

## Key files changed

- `packages/cli/src/serve/acpHttp/dispatch.ts`: Sanitizes session-delete stderr messages
- `packages/cli/src/serve/acpHttp/jsonRpc.ts`: Keeps JSON-RPC error formatting aligned with sanitized diagnostics
- `packages/cli/src/serve/acpHttp/transport.test.ts`: Regression test for single-line sanitized stderr
- `packages/sdk-typescript/src/daemon/DaemonClient.ts`: Forwards `entryIndex` for MCP restart
- `packages/sdk-typescript/src/daemon/types.ts`: Types pooled MCP restart `entries`
- `packages/sdk-typescript/test/unit/DaemonClient.test.ts`: SDK entry-index and pooled-result coverage
- `packages/web-shell/client/components/dialogs/McpDialog.tsx`: Handles single-server and pooled restart responses
- `packages/web-shell/client/i18n.tsx`: Adds localized pooled-restart dialog copy
- `packages/core/src/tools/mcp-pool-key.ts`: Corrects fingerprint-field comment

## Final Implementation Status

- **Status**: MERGED (2026-06-12)
- **Outcome**: Log injection risk is narrowed and SDK/web-shell MCP restart typing matches daemon pooled responses
