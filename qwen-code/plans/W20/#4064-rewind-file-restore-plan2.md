# Plan: Address wenshao's 2026-05-15 review on PR #4064

## Context

PR #4064 (`feat(rewind): add file restoration support to /rewind command`) received a 7-thread review from wenshao at 2026-05-15T01:49Z. After analysis, **6 of 7** are being adopted. The 7th (Critical: `applySnapshot` v1 fallback, [r3245314565](https://github.com/QwenLM/qwen-code/pull/4064#discussion_r3245314565)) is being held — wenshao's repro doesn't actually demonstrate the bug (the v1 backup is `null` in his scenario, so the existing code correctly `unlink`s the file), and his proposed fix introduces a new regression (it would `unlink` files that pre-existed on disk untracked at the target turn, e.g. project files first edited by a tool well after the target turn).

The remaining 6 split into:
- **1 Critical**: disk backup files are never cleaned up when snapshots are evicted (`MAX_SNAPSHOTS=100` overflow + `rewind` truncation paths). Real, growing on-disk leak.
- **3 UX**: silent no-op when `geminiClient` is null in `'conversation'` / `'both'` modes; one hardcoded English string missed by i18n.
- **2 Cleanup**: dead `null` branch in `createBackup`; duplicated `maxVersion` scan loop.

## Changes

### A. `packages/core/src/services/fileHistoryService.ts`

#### A1. Per-eviction backup cleanup (Critical)

Add a private helper that, given a list of removed snapshots, computes which `backupFileName`s are no longer referenced by any surviving snapshot and deletes those files from disk. Critical detail: backups are content-deduplicated — a single `backupFileName` may be referenced by many snapshots (when content is unchanged across a snapshot, `makeSnapshot:377` reuses the same `latestBackup` reference). So we must compute the live-set from **surviving** snapshots and only delete `backupFileName`s in the removed set that are NOT in the live-set.

```ts
private async cleanupOrphanedBackups(
  removedSnapshots: FileHistorySnapshot[],
): Promise<void> {
  const liveBackups = new Set<string>();
  for (const s of this.state.snapshots) {
    for (const b of Object.values(s.trackedFileBackups)) {
      if (b.backupFileName !== null) liveBackups.add(b.backupFileName);
    }
  }
  const toDelete = new Set<string>();
  for (const s of removedSnapshots) {
    for (const b of Object.values(s.trackedFileBackups)) {
      if (b.backupFileName !== null && !liveBackups.has(b.backupFileName)) {
        toDelete.add(b.backupFileName);
      }
    }
  }
  await Promise.all(
    Array.from(toDelete, async (name) => {
      try {
        await unlink(resolveBackupPath(name, this.sessionId));
      } catch (e: unknown) {
        if (!isENOENT(e)) {
          debugLogger.error(`FileHistory: cleanup failed for ${name}: ${e}`);
        }
      }
    }),
  );
}
```

`unlink` and `resolveBackupPath` are already imported/defined.

Call sites:
- `makeSnapshot` (currently `:407-410`): capture the dropped slice before reassigning.
  ```ts
  if (this.state.snapshots.length > MAX_SNAPSHOTS) {
    const removed = this.state.snapshots.slice(0, this.state.snapshots.length - MAX_SNAPSHOTS);
    this.state.snapshots = this.state.snapshots.slice(-MAX_SNAPSHOTS);
    await this.cleanupOrphanedBackups(removed);
  }
  ```
- `rewind` (currently `:431-440`): same pattern, capture removed slice after `targetIdx`.
  ```ts
  const removed = this.state.snapshots.slice(targetIdx + 1);
  this.state.snapshots = this.state.snapshots.slice(0, targetIdx + 1);
  this.state.trackedFiles = new Set(...);
  await this.cleanupOrphanedBackups(removed);
  ```
  Out-of-scope: this only runs when `result.filesFailed.length === 0` (the existing guard from `a569e33e7`), which is correct — partial-failure paths must not clean up either.

Best-effort: each unlink is wrapped, ENOENT swallowed, other errors logged but don't propagate.

Out of scope: cross-session cleanup (stale `~/.qwen/file-history/{otherSessionId}/` dirs). Tracked separately.

#### A2. Tighten `createBackup` signature (Cleanup)

Currently:
```ts
async function createBackup(filePath: string | null, ...): Promise<FileHistoryBackup> {
  if (filePath === null) return { backupFileName: null, version, backupTime: new Date() };
  ...
}
```

Both callers (`trackEdit:333`, `makeSnapshot:398`) always pass `string`. Drop the `| null` and the early-return branch.

#### A3. Extract `getMaxVersion` helper (Cleanup)

Replace the two identical loops at `trackEdit:306-312` and `makeSnapshot:344-348`:
```ts
private getMaxVersion(trackingPath: string): number {
  let maxVersion = 0;
  for (const snapshot of this.state.snapshots) {
    const existing = snapshot.trackedFileBackups[trackingPath];
    if (existing && existing.version > maxVersion) {
      maxVersion = existing.version;
    }
  }
  return maxVersion;
}
```

Both call sites become `const maxVersion = this.getMaxVersion(trackingPath);`. Pure refactor, no behavior change. Explicitly **no cache** (per prior discussion: 100×50 ≈ 5000 lookups is microseconds; cache adds consistency risk for no measurable win).

### B. `packages/cli/src/ui/AppContainer.tsx` — `handleRewindConfirm`

Current shape (around `:1985-2016`):
```ts
const needsConversation = option === 'conversation' || option === 'both';
const geminiClient = needsConversation ? config.getGeminiClient() : null;
let apiTruncateIndex = -1;
if (needsConversation) {
  if (!geminiClient) {
    if (option === 'conversation') return;
    // 'both' with no client: skip conversation, still try files
  } else {
    ...
  }
}
```

#### B1. Surface 'conversation' + no client error

```ts
if (!geminiClient) {
  if (option === 'conversation') {
    historyManager.addItem(
      { type: 'error', text: t('Cannot rewind conversation: no active model client.') },
      Date.now(),
    );
    return;
  }
  ...
}
```

#### B2. Surface 'both' + no client warning

The 'both' fall-through still proceeds to file restoration. Add a flag set here, surface the message after the file-restore block (alongside `fileRestoreMessage` / `fileRestoreError`):

```ts
let conversationSkippedNoClient = false;
if (!geminiClient) {
  if (option === 'conversation') { /* B1 */ return; }
  if (option === 'both') conversationSkippedNoClient = true;
}

// ... existing file restore ...

if (conversationSkippedNoClient) {
  historyManager.addItem(
    { type: 'info', text: t('Code restored, but conversation could not be rewound (no active client).') },
    Date.now(),
  );
}
```

Place the new message item alongside the existing `fileRestoreMessage` / `fileRestoreError` adds (around `:2109-2120`) so ordering matches the rest of the post-rewind output.

#### B3. i18n the hardcoded "Conversation rewound" string

`AppContainer.tsx:2094-2100`:
```ts
historyManager.addItem(
  {
    type: 'info',
    text: 'Conversation rewound. Edit your prompt and press Enter to continue.',
  },
  Date.now(),
);
```

Wrap with `t(...)`. `t` is already imported (`:154`).

### C. i18n locale files (9 files)

Add three new keys to each of `packages/cli/src/i18n/locales/{en,zh,zh-TW,ja,de,fr,pt,ru,ca}.js`:

1. `'Cannot rewind conversation: no active model client.'`
2. `'Code restored, but conversation could not be rewound (no active client).'`
3. `'Conversation rewound. Edit your prompt and press Enter to continue.'`

Place them adjacent to the existing rewind cluster (after `'Rewind failed: {{error}}'`). The `mustTranslateKeys` test enforces that every key used by `t()` exists in every locale, so missing any locale will fail CI.

### D. Test additions

#### D1. `packages/core/src/services/fileHistoryService.test.ts`

Three new tests under `describe('snapshot eviction', ...)` and a new `describe('rewind cleanup', ...)`:

- **`should delete orphaned backup files on MAX_SNAPSHOTS overflow`**: track a single file across 105 snapshots, modifying its content between each so each snapshot creates a fresh `backupFileName` (no dedupe). After the 105th snapshot, assert versions 1-5's backup files no longer exist on disk under `storageDir/file-history/test-session/` while versions 6-105 do.

- **`should preserve backup files still referenced by surviving snapshots`** (dedupe test): track a file across 105 snapshots **without modifying it** — `makeSnapshot:377` will reuse the same `backupFileName` reference for every snapshot. After eviction, the single shared backup file must NOT be deleted.

- **`should delete orphaned backup files on rewind truncation`**: build snapshots p1, p2, p3 with the file modified between each. Rewind to p1 (truncates p2, p3). Assert p2/p3's unique-version backup files are removed; p1's backup file remains.

#### D2. `packages/cli/src/ui/AppContainer.test.tsx`

If existing tests already mock `handleRewindConfirm` paths, extend them:

- **`shows error when conversation rewind has no client`**: invoke selector with `option='conversation'` and `getGeminiClient()` returning null; assert error history item added; assert `getFileHistoryService().rewind` not called.
- **`shows warning when both-mode rewind has no client`**: same but `option='both'`; assert files were restored AND warning history item added.

If those code paths aren't already covered, scope these as best-effort — the i18n test (`mustTranslateKeys`) is the primary safety net.

## Files modified

| File | Changes |
|---|---|
| `packages/core/src/services/fileHistoryService.ts` | A1 (cleanup helper + 2 call sites), A2 (signature), A3 (helper extraction) |
| `packages/core/src/services/fileHistoryService.test.ts` | D1 (3 tests) |
| `packages/cli/src/ui/AppContainer.tsx` | B1, B2, B3 |
| `packages/cli/src/ui/AppContainer.test.tsx` | D2 (best-effort, see above) |
| `packages/cli/src/i18n/locales/{en,zh,zh-TW,ja,de,fr,pt,ru,ca}.js` (9 files) | C: 3 new keys × 9 |

Total: 13-14 files.

## Verification

```bash
# typecheck both packages
(cd packages/core && npm run typecheck)
(cd packages/cli && npm run typecheck)

# test files most affected
(cd packages/core && npm test -- --run fileHistoryService)
(cd packages/cli && npm test -- --run AppContainer)
(cd packages/cli && npm test -- --run i18n)  # enforces new keys exist in all 9 locales
```

Manual disk-leak verification (sanity check, not blocking):
1. Open an interactive session, run >=101 prompts that each touch at least one tracked file
2. `ls ~/.qwen/file-history/<sessionId>/ | wc -l` — should equal the count of unique `backupFileName`s referenced by the live 100 snapshots, not the cumulative count

## Reply / resolve plan

After commit + push:
- Reply on adopted threads (#2-7) with commit SHA + brief one-liner of the fix
- Reply on held thread (#1) re-stating: wenshao's repro produces correct behavior in current code (because `v1.backupFileName === null` for tool-created files); the proposed `existedAtTarget` fix incorrectly deletes pre-existing untracked files first edited by a tool after the target turn. Offer to discuss if there's a different repro
- Resolve threads #2-7. Leave #1 unresolved pending wenshao's response.

## Final Implementation Status

- **PR status**: #4064 MERGED on 2026-05-16.
- **What was implemented**: File restoration support for `/rewind` command, including the review fixes planned here (orphaned backup cleanup, createBackup signature tightening, getMaxVersion helper extraction, UX error surfacing for null geminiClient, i18n wrapping).
- **Key divergences**: Implementation also touched `DialogManager.tsx`, `RewindSelector.tsx`, `UIActionsContext.tsx`, `useGeminiStream.ts/test`, `edit.ts/test`, `write-file.ts/test`, `exit-worktree.ts`, and `client.ts` beyond what the plan listed — indicating broader file-history integration into tools was done in the same PR.
- **Files actually changed**: 25 files including `fileHistoryService.ts/.test.ts`, `AppContainer.tsx`, 9 i18n locale files, `config.ts`, tool files (`edit.ts`, `write-file.ts`), and UI components.
