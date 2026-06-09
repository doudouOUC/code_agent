# feat(core): add Monitor(...) permission namespace

PR: #3726 | Merged: 2026-04-29 | +169/-15 | 5 files

## What it does
Introduces a dedicated `Monitor(...)` permission namespace so monitor and shell tools have independent permission boundaries. Previously monitor emitted `Bash(...)` rules, causing "Always Allow" failures and unintentional `run_shell_command` grants. Adds `SHELL_LIKE_TOOLS` set so all shell-like evaluation paths handle both `run_shell_command` and `monitor`.

## Key files changed
- `packages/core/src/permissions/rule-parser.ts`: Added `Monitor` alias, `SHELL_TOOL_NAMES`, canonical/display mappings
- `packages/core/src/permissions/permission-manager.ts`: Extracted `SHELL_LIKE_TOOLS` set, used in evaluate/hasRelevantRules
- `packages/core/src/tools/monitor.ts`: Emit `Monitor(...)` instead of `Bash(...)` in permissionRules
- `packages/core/src/permissions/permission-manager.test.ts`: Tests for new namespace
- `packages/core/src/tools/monitor.test.ts`: Tests for permission rule emission

## Final Implementation Status
- **Status**: MERGED (2026-04-29)
- **Outcome**: Implemented as designed
