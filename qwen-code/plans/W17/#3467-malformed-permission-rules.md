# fix(core): prevent malformed permission rules from becoming tool-wide catch-alls

PR: #3467 | Merged: 2026-04-20 | +145/-9 | 5 files

## What it does
Fixes a security issue where permission rules with unbalanced parentheses (e.g. `Bash(rm -rf /)*`) were silently parsed with `specifier: undefined`, causing them to match every invocation of that tool. Adds an `invalid` flag to `PermissionRule`, marks malformed rules during parsing, and short-circuits them in `matchesRule`.

## Key files changed
- `packages/core/src/permissions/rule-parser.ts`: Mark malformed rules with `invalid` flag
- `packages/core/src/permissions/permission-manager.ts`: Short-circuit invalid rules, filter from UI
- `packages/core/src/permissions/permission-manager.test.ts`: 7 new test cases
- `packages/core/src/permissions/types.ts`: Add `invalid?: boolean` to PermissionRule type
- `packages/cli/src/ui/components/PermissionsDialog.tsx`: Filter invalid rules from display

## Final Implementation Status
- **Status**: MERGED (2026-04-20)
- **Outcome**: Implemented as designed
