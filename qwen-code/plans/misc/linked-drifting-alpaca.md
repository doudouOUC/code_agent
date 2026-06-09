# Qwen Code Atomic File Write Implementation Plan

## Context

Qwen Code's core file write paths (Write tool, Edit tool) use bare `fs.writeFile`. A crash or power loss mid-write produces half-written corrupt files. `write-file.ts:371-385` and `edit.ts:487-497` already contain explicit TODOs noting atomic write as the fix. This plan implements Phase 1 — the minimum viable change.

## Phase 1 Implementation

### 1.1 Extend `atomicFileWrite.ts` — add `atomicWriteFile()`

**File**: `packages/core/src/utils/atomicFileWrite.ts`

- Add `atomicWriteFile(filePath, data: string | Buffer, options?)` — generic atomic write
- `flush: true` (fsync) by default; permission preservation (stat target → chmod tmp); encoding support
- **Symlink resolution**: call `fs.realpath()` before writing; create tmp next to the **real target** and rename to real target path, so symlinks are preserved (matches Claude Code's `readlinkSync` + resolve in `writeFileSyncAndFlush_DEPRECATED`)
- Same-directory tmp file (`${resolvedPath}.${randomHex}.tmp`) to guarantee rename doesn't cross filesystems
- EXDEV fallback to direct write; cleanup tmp on all error paths
- **Export `renameWithRetry`** for external reuse
- Refactor `atomicWriteJSON` to delegate to `atomicWriteFile` (adds missing `flush: true`)

### 1.2 Deduplicate `renameWithRetry`

**File**: `packages/core/src/utils/runtimeStatus.ts`

- Delete private `renameWithRetry` (L220-239), identical to `atomicFileWrite.ts:50-72`
- Import from `'./atomicFileWrite.js'`
- Refactor `writeRuntimeStatus()` inline tmp+rename (L110-121) → `atomicWriteJSON(filePath, payload)`

### 1.3 Wire `fileSystemService.writeTextFile()` to atomic write

**File**: `packages/core/src/services/fileSystemService.ts`

Replace 4 bare `fs.writeFile` calls in `StandardFileSystemService.writeTextFile()` (L214-262):

| Line | Current | Replace with |
|------|---------|-------------|
| L244-247 | `fs.writeFile(filePath, Buffer.concat(...))` | `atomicWriteFile(filePath, Buffer.concat(...))` |
| L249 | `fs.writeFile(filePath, encoded)` | `atomicWriteFile(filePath, encoded)` |
| L258 | `fs.writeFile(filePath, Buffer.concat(...))` | `atomicWriteFile(filePath, Buffer.concat(...))` |
| L260 | `fs.writeFile(filePath, content, 'utf-8')` | `atomicWriteFile(filePath, content, { encoding: 'utf-8' })` |

`AcpFileSystemService` (second implementation) delegates to remote ACP or falls back to `StandardFileSystemService` — no changes needed.

### 1.4 Add fsync to `writeWithBackup.ts`

**File**: `packages/cli/src/utils/writeWithBackup.ts`

L81: `fs.writeFileSync(tempPath, content, { encoding })` → add `flush: true`

### 1.5 Upgrade `@types/node`

`@types/node` is `^20.11.24` in `packages/cli/package.json` (L90). The `flush` option type requires `@types/node` >= 22. Upgrade to match the project's Node >=22 engine requirement.

### 1.6 Tests

**File**: `packages/core/src/utils/atomicFileWrite.test.ts` (already exists with 5 tests for `atomicWriteJSON`)

Append new test cases for `atomicWriteFile`:
- String and Buffer content write
- Permission preservation on existing files
- Explicit mode option
- No tmp files left on success
- Tmp cleanup on write/rename failure
- EXDEV fallback to direct write
- Symlink resolution (writes through symlink to real target)

## Files to modify

| File | Change |
|------|--------|
| `packages/core/src/utils/atomicFileWrite.ts` | Add `atomicWriteFile`, export `renameWithRetry`, refactor `atomicWriteJSON` |
| `packages/core/src/utils/runtimeStatus.ts` | Delete duplicate `renameWithRetry`, use `atomicWriteJSON` |
| `packages/core/src/services/fileSystemService.ts` | 4x `fs.writeFile` → `atomicWriteFile` |
| `packages/cli/src/utils/writeWithBackup.ts` | Add `flush: true` |
| `packages/cli/package.json` | Upgrade `@types/node` to >=22 |
| `packages/core/src/utils/atomicFileWrite.test.ts` | Add `atomicWriteFile` tests |

## Verification

1. `npm run typecheck` — no type errors (including flush option)
2. `npx vitest run packages/core/src/utils/atomicFileWrite.test.ts` — all tests pass
3. `npx vitest run packages/core/src/utils/runtimeStatus.test.ts` — no regression
4. `npx vitest run packages/core/src/services/fileSystemService.test.ts` — writeTextFile works through atomicWriteFile
5. Manual: Write tool creates file → no tmp residue, permissions correct
6. Manual: Edit tool modifies file → atomic replacement, symlinks preserved
