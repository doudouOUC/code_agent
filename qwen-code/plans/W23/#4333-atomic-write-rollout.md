# feat(core): atomic write rollout for credentials, memory, config, JSONL (closes #3681, #4095 Phase 2)

PR: #4333 | Merged: 2026-06-02 | +2421/-157 | 34 files

## What it does
Phase 2 of #4095 -- replaces all remaining bare `fs.writeFile`/`fs.writeFileSync`/`fs.appendFile` calls in security-sensitive and data-integrity paths with atomic helpers (temp + fsync + rename + EXDEV fallback + EPERM retry). Covers OAuth credentials, memory metadata, session transcripts (JSONL), trusted hooks, config files, and more. Adds `atomicWriteFileSync` and `forceMode` option for credential healing.

## Key files changed
- `packages/core/src/utils/atomicFileWrite.ts`: New atomicWriteFileSync + forceMode option
- `packages/core/src/mcp/oauth-token-storage.ts`: Migrated to atomic writes with mode 0o600
- `packages/core/src/mcp/token-storage/file-token-storage.ts`: Atomic credential writes
- `packages/core/src/qwen/sharedTokenManager.ts`: Atomic token writes
- `packages/core/src/utils/jsonl-utils.ts`: Atomic JSONL append (closes #3681)
- `packages/core/src/memory/manager.ts`: Atomic memory metadata writes
- `packages/core/src/hooks/trustedHooks.ts`: Atomic trusted hooks config writes
- `packages/cli/src/config/trustedFolders.ts`: Atomic trusted folders writes
- `packages/core/src/core/logger.ts`: Atomic debug log writes

## Final Implementation Status
- **Status**: MERGED (2026-06-02)
- **Outcome**: Implemented as designed
