# fix(daemon): isolate parallel subAgent text streams in transcript reducer

PR: #4689 | Merged: 2026-06-03 | +798/-18 | 8 files

## What it does
Fixes garbled text in WebShell when parallel subAgents (e.g. from `/review`) stream text chunks that were interleaved into a single transcript block. Extends the existing `parentToolCallId` isolation pattern from tool blocks to text/thought events, using per-parent keyed maps in the transcript reducer.

## Key files changed
- `packages/cli/src/acp-integration/session/emitters/MessageEmitter.ts`: Add `subagentMeta?` parameter to emit methods
- `packages/cli/src/acp-integration/session/SubAgentTracker.ts`: Pass `getSubagentMeta()` to stream handler
- `packages/sdk-typescript/src/daemon/ui/transcript.ts`: `appendTextDelta` per-parent isolation with keyed maps
- `packages/sdk-typescript/src/daemon/ui/normalizer.ts`: Extract `parentToolCallId` from `_meta`

## Final Implementation Status
- **Status**: MERGED (2026-06-03)
- **Outcome**: Implemented as designed
