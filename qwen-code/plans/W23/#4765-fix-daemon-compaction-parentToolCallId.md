# fix(daemon): preserve parentToolCallId in compaction engine for parallel subagent streams

PR: #4765 | Merged: 2026-06-04 | +569/-29 | 2 files

## What it does
Fixes the compaction engine's `mergeTextSlot` which merged all consecutive same-type chunks regardless of `parentToolCallId`, causing parallel subagent thought/content to become garbled. Implements dual-path merge logic: subagent chunks merge by `(kind, parentToolCallId)` index while main agent chunks use original continuous merge.

## Key files changed
- `packages/acp-bridge/src/compactionEngine.ts`: Dual-path merge with parentToolCallId-indexed slots, eviction on same-parent tool boundary
- `packages/acp-bridge/src/compactionEngine.test.ts`: 9 new test cases covering isolation, interleaving, 9-parallel stress

## Final Implementation Status
- **Status**: MERGED (2026-06-04)
- **Outcome**: Implemented as designed
