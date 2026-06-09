# Plan: Fix tanzhenxin's PR #4064 Review Comments

## Context

PR #4064 (file history for `/rewind`) received a `CHANGES_REQUESTED` review from tanzhenxin with 4 issues. We adopt 3 of them (issues 1, 3, 4) and defer issue 2 (disk cleanup) to a follow-up PR.

---

## Fix 1: Disable file checkpointing for non-interactive (`-p`) mode

**Problem:** `fileCheckpointingEnabled` defaults to `!params.sdkMode`, but `-p` mode never sets `sdkMode=true`. So pipe/headless runs silently write backup files to `~/.qwen/file-history/` with no UI for the user to use them.

**File:** `packages/core/src/config/config.ts` (line 884-885)

**Current:**
```typescript
this.fileCheckpointingEnabled =
  params.fileCheckpointingEnabled ?? !params.sdkMode;
```

**Fix:**
```typescript
this.fileCheckpointingEnabled =
  params.fileCheckpointingEnabled ?? (!params.sdkMode && params.interactive !== false);
```

This ensures checkpointing is only enabled when:
- Not explicitly disabled via param
- Not in SDK mode
- In interactive mode (has a TTY / not `-p`)

One line change. `params.interactive` is `false` for `-p` mode (set at line 1290-1314 in `packages/cli/src/config/config.ts`).

---

## Fix 3: Surface partial restore failures; block conversation truncation on failure

**Problem:** `applySnapshot()` catches per-file errors silently (only `debugLogger.error()`). In "both" mode, even if files partially fail to restore, the conversation still truncates — leaving an inconsistent state.

### 3a: Change `rewind()` return type to include failures

**File:** `packages/core/src/services/fileHistoryService.ts`

Change `rewind()` to return both successes and failures:

```typescript
export interface RewindResult {
  filesChanged: string[];
  filesFailed: string[];
}

async rewind(promptId: string, truncateHistory = true): Promise<RewindResult>
```

In `applySnapshot()`, collect failed file paths instead of just logging:

```typescript
// Current (line 532-536):
} catch (error) {
  debugLogger.error(`FileHistory: Error restoring file ${trackingPath}: ${error}`);
}

// New:
} catch (error) {
  debugLogger.error(`FileHistory: Error restoring file ${trackingPath}: ${error}`);
  filesFailed.push(trackingPath);
}
```

Return `{ filesChanged, filesFailed }` from `applySnapshot()` and propagate through `rewind()`.

### 3b: Block conversation truncation when restore has failures

**File:** `packages/cli/src/ui/AppContainer.tsx` (lines 2023-2052)

```typescript
// After rewind() call:
const result = await config.getFileHistoryService().rewind(promptId, truncateHistory);
if (result.filesChanged.length > 0) {
  fileRestoreMessage = t('Restored {{count}} file(s).', { count: String(result.filesChanged.length) });
}
if (result.filesFailed.length > 0) {
  fileRestoreError = t('Failed to restore {{count}} file(s): {{files}}', {
    count: String(result.filesFailed.length),
    files: result.filesFailed.map(f => basename(f)).join(', '),
  });
}

// For "both" mode: skip conversation truncation if ANY file failed
const hasRestoreFailure = result.filesFailed.length > 0;
```

Then gate the conversation truncation:

```typescript
if (needsConversation && geminiClient && apiTruncateIndex >= 0 && !hasRestoreFailure) {
  // ... existing truncation logic ...
}
```

### 3c: Add i18n string

Add to both `en.js` and `zh.js`:
```
'Failed to restore {{count}} file(s): {{files}}'
```

### Export change

Update `packages/core/src/index.ts` export to include `RewindResult` type.

---

## Fix 4: Add unit tests for FileHistoryService

**New file:** `packages/core/src/services/fileHistoryService.test.ts`

Test scenarios:

1. **trackEdit** — backs up file before first edit; skips if already tracked in current snapshot
2. **makeSnapshot** — creates snapshot with correct promptId; re-backs-up changed files; increments version
3. **Version inheritance** — unchanged files inherit previous version (no redundant copy)
4. **rewind (success)** — restores files to target snapshot state; returns correct `filesChanged`
5. **rewind (file deletion)** — file created after target snapshot gets deleted on rewind
6. **rewind (partial failure)** — returns `filesFailed` when backup is missing on disk
7. **rewind (truncateHistory=false)** — snapshot timeline preserved for "code only" mode
8. **Snapshot eviction** — respects `MAX_SNAPSHOTS` cap
9. **getDiffStats** — computes correct insertions/deletions
10. **Disabled service** — all operations are no-ops when `enabled=false`

Approach: Use `tmp` directories for both the "project" files and the backup dir. Mock `debugLogger`. Test the actual filesystem operations (integration-style, like `fileSystemService.test.ts` in the same directory).

---

## Files to Modify

| File | Change |
|------|--------|
| `packages/core/src/config/config.ts:884` | Gate on `interactive` in addition to `sdkMode` |
| `packages/core/src/services/fileHistoryService.ts` | Add `RewindResult` type; change `rewind()`/`applySnapshot()` to return failures |
| `packages/core/src/index.ts` | Export `RewindResult` |
| `packages/cli/src/ui/AppContainer.tsx:2023-2052` | Use `RewindResult`; block conversation truncation on failure |
| `packages/cli/src/i18n/locales/en.js` | Add failure message string |
| `packages/cli/src/i18n/locales/zh.js` | Add failure message string |
| `packages/core/src/services/fileHistoryService.test.ts` | **NEW** — unit tests |

---

## PR Comment Replies

| # | Issue | Action | Reply |
|---|-------|--------|-------|
| 1 | `-p` enables checkpointing | Adopt: gate on `interactive` | "Fixed — now gates on `!sdkMode && interactive !== false`." |
| 2 | Disk grows unbounded | Defer | "Valid concern. Filing as follow-up: session-level TTL sweep (e.g., 7-day expiry) is appropriate but out of scope for this PR." |
| 3 | Partial restore + "both" inconsistency | Adopt: surface failures + block truncation | "Fixed — `rewind()` now returns `{filesChanged, filesFailed}`. 'Both' mode skips conversation truncation when any file fails." |
| 4 | No unit tests | Adopt | "Added `fileHistoryService.test.ts` covering 10 scenarios." |

---

## Verification

```bash
# Unit tests
npx vitest run packages/core/src/services/fileHistoryService.test.ts

# Type check
npm run build

# Manual: verify -p mode doesn't create backup files
echo "say hi" | npm run start -- -p
ls ~/.qwen/file-history/  # should not have new session dir
```

## Final Implementation Status

- **PR #4064** — MERGED 2026-05-16. Title: "feat(rewind): add file restoration support to /rewind command".
- **Outcome**: All 3 adopted review fixes were implemented. Fix 1 (disable checkpointing for `-p` mode), Fix 3 (surface partial restore failures + block conversation truncation), and Fix 4 (unit tests) all shipped.
- **Files changed (26 total)**: `config.ts`, `fileHistoryService.ts` + `.test.ts`, `AppContainer.tsx`, `RewindSelector.tsx`, `DialogManager.tsx`, `useGeminiStream.ts/.test.tsx`, `client.ts`, `edit.ts/.test.ts`, `write-file.ts/.test.ts`, `exit-worktree.ts`, `core/index.ts`, i18n locales (en/zh/ja/fr/de/ru/pt/zh-TW/ca), UI types.
- **Key divergence**: The actual PR was broader than this plan — it included the full `/rewind` file restoration feature (edit/write-file tool integration, RewindSelector UI component, useGeminiStream hook changes), not just the 3 review-comment fixes. Issue 2 (disk cleanup) was deferred as planned.
