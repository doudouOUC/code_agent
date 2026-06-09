# feat(serve): preflight and env diagnostics routes (#4175 Wave 3 PR 13)

PR: #4251 | Merged: 2026-05-17 | +2577/-127 | 23 files

## What it does
Adds two read-only HTTP routes to `qwen serve` for remote clients to pre-flight the daemon's environment and readiness without spawning an ACP child. `GET /workspace/env` returns a daemon-process snapshot (runtime, platform, sandbox, proxy, presence-only secret env vars). `GET /workspace/preflight` runs readiness checks for Node version, CLI entry, workspace dir, ripgrep, git, npm, plus ACP-level checks when a live child is available. Introduces the closed `errorKind` taxonomy.

## Key files changed
- `packages/cli/src/serve/envSnapshot.ts`: New module for daemon environment snapshot
- `packages/cli/src/serve/server.ts`: Route registration for /workspace/env and /workspace/preflight
- `packages/cli/src/acp-integration/acpAgent.ts`: ACP-level preflight cell generation
- `packages/cli/src/acp-integration/authPreflight.test.ts`: Auth preflight tests
- `packages/cli/src/serve/capabilities.ts`: Capability tags for new routes
- `docs/developers/qwen-serve-protocol.md`: Protocol documentation

## Final Implementation Status
- **Status**: MERGED (2026-05-17)
- **Outcome**: Implemented as designed
