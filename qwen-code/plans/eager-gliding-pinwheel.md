# Final Decision: No Migration Needed

## Conclusion

After 4 rounds of adversarial audit, the workspace route migration is **not needed**.

### Evidence
1. agents/memory/auth routes are already well-layered (route → SubagentManager/Registry → fs)
2. The facade adds zero logic for pass-through status queries (ctx is discarded as `_ctx`)
3. tools-status has a critical blocker (QueryWorkspaceStatusFn lacks params arg for serverName)
4. All routes work correctly and have test coverage
5. Bridge already provides idle fallbacks internally

### What's Done
PR #4563 workspace-service extraction is complete. No follow-up PR needed.

### If Future Work Requires It
- If audit/ctx is needed for status queries → migrate at that time with justification
- If ACP dispatch parity is needed → add vendor methods in the PR that needs them
- Sub-service extraction → only if SubagentManager coupling becomes a problem

## Final Implementation Status

- **PR #4563**: MERGED (2026-06-06) — "refactor(serve): extract DaemonWorkspaceService from AcpSessionBridge (issue #4542, method C)"
- **Summary**: The workspace-service extraction completed successfully. After 4 rounds of adversarial audit, the conclusion was that no further migration was needed beyond the extraction PR itself.
- **Key divergences**: The plan correctly concluded no follow-up work was required. The PR renamed `httpAcpBridge.ts` to `acpSessionBridge.ts` and extracted workspace concerns into a new service layer.
- **Files changed**: `bridge.ts`, `bridgeTypes.ts`, `bridgeOptions.ts`, `httpAcpBridge.ts` -> `acpSessionBridge.ts`, `status.ts`, `dispatch.ts`, `transport.test.ts`, `daemonStatusProvider.test.ts`.
