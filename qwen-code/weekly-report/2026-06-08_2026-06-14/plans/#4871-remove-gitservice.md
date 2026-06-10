# refactor(core): remove GitService, migrate /restore to FileHistoryService

PR: #4871 | MERGED: 2026-06-09 | +170/-733 | 31 files

## What it does

Removes the shadow-git-based `GitService` entirely and rewires `/restore` to use `FileHistoryService`, unifying two parallel file recovery systems under one backend. Also fixes a bug where `EDIT_TOOL_NAMES` used stale tool name `'replace'` instead of `ToolNames.EDIT`, which broke checkpoint creation and AUTO_EDIT auto-approval for the edit tool.

## Key files changed

- `packages/cli/src/config/config.ts`: Remove GitService config and registration
- `packages/cli/src/config/settingsSchema.ts`: Remove shadow-git settings
- `docs/users/features/checkpointing.md`: Update docs to reflect single-backend model
- `docs/users/features/commands.md`: Update /restore command documentation
- `packages/cli/src/gemini.test.tsx`: Update test expectations

## Final Implementation Status

- **Status**: MERGED (2026-06-09)
- **Outcome**: Net deletion of 563 lines; eliminates shadow-git dependency, reduces startup latency, and fixes edit-tool checkpoint bug
