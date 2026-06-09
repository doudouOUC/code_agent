# feat(serve): add workspace file write/edit routes (#4175 PR20)

PR: #4280 | Merged: 2026-05-18 | +2557/-266 | 25 files

## What it does
Adds PR20 workspace file mutation support for `qwen serve`: bounded raw byte reads, hash-bearing text reads, strict-auth text write/edit routes, content-hash concurrency checks, and TypeScript SDK helpers. Implements safe remote file mutation with symlink-following write escapes protection and atomic temp+rename write operations.

## Key files changed
- `packages/cli/src/serve/fs/workspaceFileSystem.ts`: Core filesystem implementation with hash concurrency and symlink protection
- `packages/cli/src/serve/routes/workspaceFileWrite.ts`: Write/edit route handlers with expected-hash validation
- `packages/cli/src/serve/routes/workspaceFileRead.ts`: Bounded byte read + hash-bearing text read
- `packages/cli/src/serve/server.ts`: Route registration
- `packages/sdk-typescript/src/daemon/DaemonClient.ts`: SDK helpers for file operations
- `packages/core/src/utils/fileUtils.ts`: Shared file utilities
- `packages/core/src/services/fileSystemService.ts`: Service layer for file operations

## Final Implementation Status
- **Status**: MERGED (2026-05-18)
- **Outcome**: Implemented as designed
