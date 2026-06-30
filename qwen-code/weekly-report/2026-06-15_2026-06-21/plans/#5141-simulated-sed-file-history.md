# fix(core): Track supported sed edits in file history

PR: #5141 | MERGED | +2275/-25 | 12 files

Source Codex artifacts:
- `.qwen/design/2026-06-15-simulated-sed-file-history.md`
- `.qwen/e2e-tests/2026-06-15-simulated-sed-file-history.md`

## Design Plan

### Problem

Issue #4204 B1 covers a `/rewind` gap: common agent workflows use `sed -i` to edit files in place, but an opaque shell execution cannot track the target file before mutation. If the process exits before another snapshot captures the previous content, `/rewind` may not be able to restore the pre-edit state.

### Scope

Only a conservative subset of single-file in-place substitutions is simulated, for example:

- `sed -i 's/foo/bar/' file`
- `sed -i '' -E 's/foo|bar/baz/g' file`
- `sed -i -e 's/foo/bar/' file`

The plan keeps compound shell operators, globs, multiple files, command substitutions, shell variables, variable-expanded paths, backup suffixes such as `-i.bak`, unsupported sed flags, environment-prefixed shell wrappers, and platform-sensitive sed behavior on the existing shell path.

### Behavior

Confirmation reads the target file, applies the parsed substitution in memory, and presents a normal edit diff. Execution re-reads the file before writing and rejects stale content with `FILE_CHANGED_SINCE_READ` if the file changed after confirmation.

Before writing, execution calls `FileHistoryService.trackEdit(filePath)` so the current turn's file-history snapshot captures a pre-edit backup. The call is best-effort and must not block the edit. The actual write goes through `FileSystemService.writeTextFile()` so encoding, BOM, and line endings stay aligned with the existing edit/write tools.

Unsupported sed commands and preview failures preserve previous shell behavior.

### E2E Plan

Manual validation should create a temporary project, run a simple `sed -i 's/foo/bar/g' file.txt`, verify the UI shows a file diff instead of only shell command confirmation, approve it, then use `/rewind` to confirm the file returns to its original content.

The fallback flow should run a globbed command such as `sed -i 's/foo/bar/g' *.txt` and confirm it remains a normal shell confirmation path.

## Final Implementation Status

- **PR status**: MERGED — PR #5141 was created 2026-06-15 and merged 2026-06-18 (Asia/Shanghai).
- **Summary**: The implementation follows the plan: supported single-file sed substitutions are parsed, previewed as edit confirmations, stale-guarded before execution, tracked in file history before writing, and written through the existing file-system service; unsupported forms still fall back to shell execution.
- **Key divergences**: No material design divergence found. The final PR also hides edit-modification affordances for shell-backed sed edit confirmations and adds CLI/non-interactive tests around that UI/permission behavior, which is an implementation detail consistent with the plan's limited shell-edit scope.
