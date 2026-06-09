# fix(core): address post-merge monitor tool and UI routing issues

PR: #3792 | Merged: 2026-05-04 | +664/-227 | 21 files

## What it does
Follow-up to the monitor tool PR addressing multiple post-merge issues: token bucket clock-drift guard for system suspend/resume, AST parse failure logging, consolidation of duplicated `SHELL_TOOL_NAMES` definitions, extraction of background-work utilities from clearCommand/useResumeCommand into a shared module, and consolidation of tool-call component routing into a shared `routing.ts` in webui.

## Key files changed
- `packages/cli/src/ui/utils/backgroundWorkUtils.ts`: New shared module for background work checks
- `packages/cli/src/ui/commands/clearCommand.ts`: Refactored to use shared utils
- `packages/cli/src/ui/hooks/useResumeCommand.ts`: Refactored to use shared utils
- `packages/core/src/permissions/permission-manager.ts`: Consolidated SHELL_TOOL_NAMES import
- `packages/cli/src/nonInteractiveCli.test.ts`: Added tests for droppedLines, exit settlement

## Final Implementation Status
- **Status**: MERGED (2026-05-04)
- **Outcome**: Implemented as designed
