# feat(serve): MCP guardrail push events + hysteresis (#4175 Wave 3 PR 14b)

PR: #4271 | Merged: 2026-05-18 | +3329/-266 | 19 files

## What it does

Adds real-time push events for MCP client budget state changes, building on PR #4247's snapshot-based guardrails. Introduces `mcp_budget_warning` and `mcp_child_refused_batch` typed SSE events with dual-threshold hysteresis (warn at 75%, reset at 37.5%) to prevent event flooding. Also adds the `mcp_guardrail_events` capability tag, a workspace-level ACP notification channel (`qwen/notify/session/mcp-budget-event`) for budget events from the ACP child process to the daemon event bus, SDK event types and reducer state extensions, and integration test updates for the expanded capabilities list.

## Key files changed
- `packages/cli/src/serve/capabilities.ts`: Added `mcp_guardrail_events` capability tag
- `packages/cli/src/serve/httpAcpBridge.ts`: Hysteresis state machine for budget warning/reset, workspace-scoped event fan-out
- `packages/cli/src/serve/httpAcpBridge.test.ts`: Tests for hysteresis thresholds and fan-out behavior
- `packages/cli/src/serve/server.test.ts`: Updated `EXPECTED_STAGE1_FEATURES` with new capability
- `packages/cli/src/acp-integration/acpAgent.ts`: ACP-side budget event emission via extNotification
- `packages/cli/src/acp-integration/acpAgent.test.ts`: Budget event emission tests
- `packages/core/src/config/config.ts`: Budget config plumbing
- `packages/core/src/tools/mcp-client-manager.ts`: Budget event emission hooks at discovery sites
- `packages/core/src/tools/mcp-client-manager.test.ts`: Budget event tests
- `packages/sdk-typescript/src/daemon/events.ts`: SDK types for mcp_budget_warning, mcp_child_refused_batch events
- `packages/sdk-typescript/src/daemon/DaemonSessionClient.ts`: Reducer state for budget events
- `integration-tests/cli/qwen-serve-baseline.test.ts`: Updated baseline test assertions
- `docs/developers/qwen-serve-protocol.md`: Protocol docs for guardrail push events
- `docs/users/qwen-serve.md`: User-facing docs for budget event behavior

## Final Implementation Status
- **Status**: MERGED (2026-05-18)
- **Outcome**: Implemented as designed
