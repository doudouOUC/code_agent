# fix(tool-registry): add lazy factory registration with inflight concurrency dedup

PR: #3297 | Merged: 2026-04-18 | +739/-330 | 35 files

## What it does
Introduces lazy factory registration in `ToolRegistry` with an inflight promise map to prevent concurrent duplicate instantiation of the same tool. Fixes a P0 bug where two simultaneous `ensureTool()` calls could both pass the cache check and instantiate the same tool twice, leaking event listeners. Also fixes `stop()` resource cleanup.

## Key files changed
- `packages/cli/src/config/config.ts`: Updated tool registration to use lazy factories
- `packages/cli/src/ui/hooks/useToolScheduler.test.ts`: Test updates for new registration API
- `packages/cli/src/acp-integration/session/Session.ts`: Adapt to lazy tool loading
- `packages/cli/src/acp-integration/session/emitters/ToolCallEmitter.ts`: Handle async tool resolution
- Multiple other files: Migrate from eager to lazy registration pattern

## Final Implementation Status
- **Status**: MERGED (2026-04-18)
- **Outcome**: Implemented as designed
