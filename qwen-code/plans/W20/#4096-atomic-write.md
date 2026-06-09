# Phase 2: Atomic write rollout (issue #4095, closes #3681)

## Context

Issue [QwenLM/qwen-code#4095](https://github.com/QwenLM/qwen-code/issues/4095) tracks a four-phase rollout to make Qwen Code's disk writes crash-safe. Status snapshot:

| Phase | Status |
|---|---|
| 1. Generic `atomicWriteFile` + Write/Edit tool integration | ✅ Merged (PR #4096) |
| 2. Batch fix remaining bare `fs.writeFile` calls | ❌ This PR |
| 3. `FileCheckpointService` (`/rewind` file restore) | ✅ Merged (PR #4064, landed out of order) |
| 4. Tool result disk overflow | ❌ Deferred |

Phase 2 is the only remaining item in the "data safety" cluster. The Phase 1 helper (`atomicWriteFile`) is already strictly better than Claude Code's equivalent (`writeFileSyncAndFlush_DEPRECATED`) in EXDEV handling, symlink chain resolution, and rename retry — so this PR is mostly a mechanical migration of callers plus one new sync helper, **not** a re-architecture of the atomic-write utility itself.

This PR also closes [#3681](https://github.com/QwenLM/qwen-code/issues/3681) (JSONL session writer durability) by adding `flush: true` to the append paths in `jsonl-utils.ts`.

Single PR (user opted not to split), structured as 6 logical commits for review.

---

## Critical files modified

| File | Why |
|---|---|
| `packages/core/src/utils/atomicFileWrite.ts` | Add `atomicWriteFileSync` + `renameWithRetrySync` + `forceMode` option on shared options |
| `packages/core/src/utils/atomicFileWrite.test.ts` | New `describe('atomicWriteFileSync')` block mirroring async tests + forceMode tests |
| Tier 1: `packages/core/src/mcp/oauth-token-storage.ts`, `packages/core/src/mcp/token-storage/file-token-storage.ts`, `packages/core/src/qwen/qwenOAuth2.ts`, `packages/core/src/qwen/sharedTokenManager.ts` | Credentials → atomic + forceMode 0o600 |
| Tier 2: `packages/core/src/memory/{manager,extract,indexer,dream,forget}.ts` | Memory state → atomic |
| Tier 3a (config/state): `packages/cli/src/config/trustedFolders.ts`, `packages/core/src/core/logger.ts`, `packages/cli/src/services/tips/tipHistory.ts`, `packages/core/src/utils/installationManager.ts`, `packages/core/src/utils/projectSummary.ts`, `packages/core/src/tools/todoWrite.ts`, `packages/core/src/hooks/trustedHooks.ts` | Atomic for state/config files |
| Tier 3b (JSONL fsync, closes #3681): `packages/core/src/utils/jsonl-utils.ts`, `packages/core/src/utils/debugLogger.ts` | `flush: true` on `appendFile`/`appendFileSync`; `writeFileSync` at L299 → `atomicWriteFileSync` |
| Tests for above: `oauth-token-storage.test.ts`, `file-token-storage.test.ts`, `qwenOAuth2.test.ts`, `sharedTokenManager.test.ts`, `logger.test.ts`, `trustedFolders.test.ts`, `jsonl-utils.test.ts` | Mock updates to track helper instead of raw `fs.writeFile` |

---

## New helper code

### `atomicWriteFileSync(filePath, data, options?)` in `atomicFileWrite.ts`

Mirror the async API exactly. Reuse existing types where possible.

```ts
export function atomicWriteFileSync(
  filePath: string,
  data: string | Buffer,
  options?: AtomicWriteFileOptions,
): void
```

Implementation notes:
- Symlink chain via `lstatSync` + `readlinkSync` + `realpathSync(dirname(current))` for relative-link resolution (max 40 hops, mirror async `resolveSymlinkChain`)
- Tmp file in same dir as resolved target: `${target}.tmp.${process.pid}.${Date.now()}.${random}`
- `writeFileSync(tmp, data, { encoding, mode, flush: true })` — Node ≥21.1 supports `flush` on sync (engine is ≥22, fine)
- After write: `chmodSync(tmp, desiredMode)` belt-and-suspenders for umask, wrapped in `tryChmodSync` that swallows errors (FAT/exFAT tolerance — mirror async)
- Permission resolution:
  - If `options.forceMode === true` → use `options.mode` directly
  - Else if target exists → preserve `statSync(target).mode & 0o7777`
  - Else use `options.mode`
- `renameSync(tmp, target)` with `renameWithRetrySync` helper (retries on EPERM/EACCES, default 3, exponential backoff via `Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delayMs)` for true blocking sleep without busy-wait)
- EXDEV fallback: cleanup tmp, direct `writeFileSync(target, data, { encoding, mode, flush: true })` followed by `tryChmodSync`. Document as non-atomic
- Tmp cleanup on any error via `unlinkSync` in catch block, swallowed

### `forceMode` option on `AtomicWriteFileOptions`

```ts
export interface AtomicWriteFileOptions extends AtomicWriteOptions {
  mode?: number;
  encoding?: BufferEncoding;
  flush?: boolean;
  /**
   * When true, ignore the existing target file's permission bits and apply
   * `mode` regardless. Use for credentials/secrets where we must heal
   * historically over-permissive files (e.g. user copied a 0o644 token
   * file from a backup — must be forced back to 0o600).
   */
  forceMode?: boolean;
}
```

Both async (`atomicWriteFile`) and sync (`atomicWriteFileSync`) honor it. Default `false` keeps existing behavior.

---

## Migration table

`AWF` = `atomicWriteFile`, `AWS` = `atomicWriteFileSync`.

### Tier 1 — Credentials (forceMode: true, mode: 0o600)

| File:Line | Before | After |
|---|---|---|
| `mcp/oauth-token-storage.ts:102` | `fs.writeFile(tokenFile, JSON.stringify(arr,null,2), {mode:0o600})` | `AWF(tokenFile, JSON.stringify(arr,null,2)+'\n', {mode:0o600, forceMode:true})` |
| `mcp/oauth-token-storage.ts:182` | same shape | same |
| `mcp/token-storage/file-token-storage.ts:103` | `fs.writeFile(path, encrypted, {mode:0o600})` | `AWF(path, encrypted, {mode:0o600, forceMode:true})` |
| `qwen/qwenOAuth2.ts:982` | `fs.writeFile(path, credString)` (no mode!) | `AWF(path, credString, {mode:0o600, forceMode:true})` — **behavior change: tightens 0o644 → 0o600** |
| `qwen/sharedTokenManager.ts:639` | hand-rolled tmp+rename with `{mode:0o600}` | `AWF(path, credString, {mode:0o600, forceMode:true})` — drops ~15 lines of duplicate logic |
| `qwen/sharedTokenManager.ts:720` | `fs.writeFile(lockPath, lockId, {flag:'wx'})` | **LEAVE ALONE** — exclusive-create lock |

### Tier 2 — Memory state

All sites write `JSON.stringify(x, null, 2) + '\n'`. Use `AWF`, not `atomicWriteJSON` (the latter omits the trailing newline).

| File:Line | Replacement |
|---|---|
| `memory/manager.ts:291` | `AWF(path, JSON.stringify(metadata,null,2)+'\n', {encoding:'utf-8'})` |
| `memory/manager.ts:362` | **LEAVE ALONE** — `flag:'wx'` lock file |
| `memory/extract.ts:93` | `AWF(...)` |
| `memory/extract.ts:118` | `AWF(...)` |
| `memory/indexer.ts:81` | `AWF(path, content, {encoding:'utf-8'})` — plain markdown |
| `memory/dream.ts:125` | `AWF(...)` |
| `memory/forget.ts:225` | `AWF(...)` |
| `memory/forget.ts:290` | `AWF(path, frontmatter+newBody+'\n', {encoding:'utf-8'})` |

### Tier 3a — Config / logger / additional state files

| File:Line | Replacement |
|---|---|
| `cli/src/config/trustedFolders.ts:182` | `AWS(path, JSON.stringify(config,null,2), {encoding:'utf-8', mode:0o600, forceMode:true})` |
| `core/src/core/logger.ts:190` | `AWF(logFilePath, '[]', {encoding:'utf-8'})` |
| `core/src/core/logger.ts:261` | `AWF(path, JSON.stringify(logs,null,2), {encoding:'utf-8'})` |
| `core/src/core/logger.ts:464` | `AWF(...)` |
| `core/src/core/logger.ts:542` | `AWF(path, JSON.stringify(conversation,null,2), {encoding:'utf-8'})` |
| `cli/src/services/tips/tipHistory.ts:117` | `AWS(...)` with existing `mode:0o600` |
| `core/src/utils/installationManager.ts:35` | `AWS(...)` (uuid file, sync path) |
| `core/src/utils/projectSummary.ts:88` | `AWF(...)` |
| `core/src/tools/todoWrite.ts:287` | `AWF(...)` — hot path, writes often mid-session |
| `core/src/hooks/trustedHooks.ts:53` | `AWF(...)` |

### Tier 3b — JSONL append fsync (closes #3681)

| File:Line | Change |
|---|---|
| `utils/jsonl-utils.ts:270` (`writeLine`) | `fs.promises.appendFile(path, line, { encoding:'utf8', flush:true })` |
| `utils/jsonl-utils.ts:285` (`writeLineSync`) | `fs.appendFileSync(path, line, { encoding:'utf8', flush:true })` |
| `utils/jsonl-utils.ts:299` (`write`, full-file replace) | `AWS(path, content, {encoding:'utf8'})` |
| `utils/debugLogger.ts:151` | `fs.appendFile(path, line, { encoding:'utf8', flush:true })` |

---

## Out of scope / deliberately deferred

- **Lock files** (`flag:'wx'`): `sharedTokenManager.ts:720`, `memory/manager.ts:362`, `chatRecordingService.ts:633`, `sessionService.ts:937` — intentional exclusive-create semantics, must not become atomic-write.
- **Already atomic, refactor opportunity**: `cli/src/serve/httpAcpBridge.ts:1274` has ~100 lines of hand-rolled atomic write. Should be folded into `atomicWriteFile` in a follow-up PR with BOM/encoding regression testing.
- **`cli/src/config/settings.ts:875`** (recovery write-back): has its own backup machinery; touching it risks settings migration regressions, defer.
- **Transient per-request logs** (`openaiLogger.ts:141`, `tools/shell.ts:2277`): write-once, partial files would just regenerate. Defer.
- **Phase 4** (tool result disk overflow): separate issue scope.
- **Claude Code patterns NOT ported**: backup rotation (5-file timestamped backups), auth-loss guard, parent-dir fsync. None requested, none materially safer for this scope.

---

## Commit sequence (single PR, 6 commits)

Each commit should compile and pass tests independently.

1. **`feat(core): add atomicWriteFileSync + forceMode option`** — new sync helper, `renameWithRetrySync`, `forceMode` on `AtomicWriteFileOptions`. Add ~15 new tests in `atomicFileWrite.test.ts` mirroring async cases plus 2 forceMode tests (one async, one sync).
2. **`refactor(core): migrate credential writes to atomicWriteFile (Tier 1, closes #4095 Tier 1)`** — 5 sites across 4 files. Behavior change: tightens `qwenOAuth2.ts` token file from 0o644 → 0o600. Update `oauth-token-storage.test.ts`, `file-token-storage.test.ts`, `qwenOAuth2.test.ts`, `sharedTokenManager.test.ts` mocks.
3. **`refactor(core): migrate memory state writes to atomicWriteFile (Tier 2)`** — 7 sites across 5 files. Memory tests use real fs, no mock updates needed.
4. **`refactor: migrate config + logger + state writes to atomic helpers (Tier 3a)`** — `trustedFolders` (sync), `logger` (4 sites), plus `tipHistory`, `installationManager`, `projectSummary`, `todoWrite`, `trustedHooks`. Update `logger.test.ts`, `trustedFolders.test.ts` mocks.
5. **`fix(core): flush JSONL appends to disk (Tier 3b, closes #3681)`** — `jsonl-utils.ts` writeLine/writeLineSync + write, `debugLogger.ts` appendFile. Add tests in `jsonl-utils.test.ts` verifying `flush: true` is forwarded.
6. **(optional) `test: tighten atomic-write call-site assertions`** — only if mock-update churn would balloon commits 2–5; fold inline where possible.

---

## Test plan

### Unit tests (must pass)

- `npx vitest run packages/core/src/utils/atomicFileWrite.test.ts` — async (existing 14) + sync (new ~14) + forceMode (new ~3)
- `npx vitest run packages/core/src/utils/jsonl-utils.test.ts` — verify `flush:true` forwarded to append paths
- `npx vitest run packages/core/src/mcp/oauth-token-storage.test.ts packages/core/src/mcp/token-storage/file-token-storage.test.ts packages/core/src/qwen/sharedTokenManager.test.ts packages/core/src/qwen/qwenOAuth2.test.ts` — Tier 1 mock updates pass
- `npx vitest run packages/core/src/core/logger.test.ts packages/cli/src/config/trustedFolders.test.ts` — Tier 3a mock updates pass
- `npx vitest run packages/core/src/memory/` — Tier 2 still green (real fs, no mock changes)
- `npx tsc --noEmit -p packages/core && npx tsc --noEmit -p packages/cli` — typecheck clean

### Manual smoke verification (unit tests cannot catch these)

1. **OAuth refresh crash recovery**: Start `npm run dev`, sign in, trigger token refresh, `kill -9` the process mid-refresh, restart, verify auth still works (no half-written `~/.qwen/oauth_creds.json`).
2. **Mode tightening (umask interaction)**: With `umask 077`, do a fresh OAuth credential write, then `stat -f %p ~/.qwen/oauth_creds.json` — confirm `0o600`, not `0o000` (umask × mode interaction in sync path).
3. **forceMode heals legacy bad perms**: `chmod 644 ~/.qwen/oauth_creds.json`, trigger any write that touches it, confirm mode is upgraded to `0o600` (proves `forceMode:true` path works).
4. **Broken symlink write-through**: `ln -s /tmp/nonexistent-xyz ~/.qwen/oauth_creds.json` (after backing up the real file), trigger refresh, verify `/tmp/nonexistent-xyz` is created with credentials and symlink preserved (`readlink ~/.qwen/oauth_creds.json` still points to it). Repeat for `trustedFolders.json` to exercise sync path.
5. **#3681 JSONL fsync regression**: Start a session, send several messages and tool calls, `kill -9` immediately after a tool result, restart, verify session transcript file is intact through the last completed line (no `}{` glued records, no truncation).
6. **Windows AV stress** (optional, only if Windows VM handy): With Defender real-time scan on, repeatedly trigger token writes in a loop — verify no EPERM crashes escape `renameWithRetry`/`renameWithRetrySync`.

---

## Risk callouts

1. **Mode-tightening behavior change in `qwenOAuth2.ts:982`**: existing token files were created at `0o644` (no mode passed). After this PR with `forceMode:true`, they become `0o600`. Correct fix, but list in release notes — any user script reading the file via `other` perms will break.
2. **`forceMode` is new API surface**: ensure documented in JSDoc and reflected in `atomicWriteFileSync` parity. Misuse (passing `forceMode:true` without `mode`) should be a no-op fall-through to preservation; add explicit test for that.
3. **JSONL `flush:true` perf**: `writeLine` is called per assistant turn / per tool call. Adding fsync adds disk-sync latency (single-digit ms on SSD, possibly 10s of ms on spinning disk / network FS). This is the intentional trade-off for closing #3681 — record in PR description so reviewers don't relitigate. If perf data is requested, run `time` on a 50-message replay before/after.
4. **`packages/cli` → `packages/core` import direction**: `trustedFolders.ts` lives in cli; importing `atomicWriteFileSync` from core follows existing dependency arrows (cli already imports core utilities), no inversion concern.
5. **Tier 3a expansion (`tipHistory`, `todoWrite`, etc.)**: these were added beyond the issue's listed files. They're trivially safe to migrate but inflate the diff. PR description should call out the scope addition with rationale ("same write-shape, same risk profile, avoids a Phase 2.5 PR").

---

## Estimated volume

- New helper + tests: ~250 lines (`atomicWriteFileSync` ~80 prod, ~170 tests)
- Tier 1 migration: ~30 prod + ~50 test-mock updates
- Tier 2 migration: ~20 prod (no test changes — memory uses real fs)
- Tier 3a migration: ~50 prod + ~40 test-mock updates
- Tier 3b (JSONL + debugLogger): ~10 prod + ~30 tests
- **Total ~480 lines.** Matches earlier estimate (~400 with original scope, ~480 with the bonus sites the Plan agent surfaced).

## Final Implementation Status

- **PR #4096**: MERGED (2026-05-15) — "feat(core,cli): add generic atomicWriteFile, wire into Write/Edit tools, upgrade @types/node"
- **Summary**: Phase 1 of the atomic write rollout landed. It introduced the `atomicWriteFile` utility and integrated it into the Write/Edit tools. Phase 2 (this plan — batch migration of remaining bare `fs.writeFile` calls) has NOT been submitted as a separate PR yet.
- **Key divergences**: Only Phase 1 (generic helper + tool integration) merged. The Tier 1-3 migrations, `atomicWriteFileSync`, `forceMode` option, and JSONL fsync (#3681 fix) described in this plan remain unimplemented.
- **Files changed in #4096**: `atomicFileWrite.ts` (new), `atomicFileWrite.test.ts`, `fileSystemService.ts`, `edit.test.ts`, `runtimeStatus.ts`, `writeWithBackup.ts`, package.json updates.
