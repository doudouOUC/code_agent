# refactor(serve): add FileSystemService boundary (#4175 Wave 4 PR 18)

PR: #4250 | Merged: 2026-05-18 | +4753/-68 | 16 files

## What it does

Introduces a `FileSystemService` abstraction layer for the daemon's file operations. Creates a new `packages/cli/src/serve/fs/` module with path validation, security policy enforcement, audit logging, and typed error handling. This boundary ensures all daemon file access goes through a controlled service layer with workspace-scoped path restrictions, preventing path traversal and providing an audit trail for file operations.

## Key files changed
- `packages/cli/src/serve/fs/paths.ts`: Path validation and normalization utilities
- `packages/cli/src/serve/fs/policy.ts`: Security policy for workspace-scoped file access
- `packages/cli/src/serve/fs/audit.ts`: Audit logging for file operations
- `packages/cli/src/serve/fs/errors.ts`: Typed error classes for file system operations
- `packages/cli/src/serve/fs/workspaceFileSystem.ts`: Main FileSystemService implementation
- `packages/cli/src/serve/fs/index.ts`: Module barrel exports
- `packages/cli/src/serve/server.ts`: Wired FileSystemService into route handlers
- `packages/cli/src/serve/httpAcpBridge.ts`: Bridge integration with file system service
- `packages/cli/src/serve/fs/*.test.ts`: Comprehensive tests for paths, policy, audit, errors, contract

## Final Implementation Status
- **Status**: MERGED (2026-05-18)
- **Outcome**: Implemented as designed
