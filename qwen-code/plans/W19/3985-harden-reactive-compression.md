# fix(core): harden reactive compression follow-ups

PR: #3985 | Merged: 2026-05-09 | +189/-18 | 4 files

## What it does
Hardens the reactive compression follow-up paths after PR #3879 by releasing the send lock on setup failures, latching explicit reactive compression failures for later auto-compaction, and passing abort signals into compression summary generation. Fixes correctness gaps that could leave later sends blocked or spend repeated compression calls after a failed reactive recovery.

## Key files changed
- `packages/core/src/core/geminiChat.ts`: Release send lock for setup failures, latch failed compression status
- `packages/core/src/core/geminiChat.test.ts`: Tests for lock release and latch behavior
- `packages/core/src/services/chatCompressionService.ts`: Pass abort signal into summary generation
- `packages/core/src/services/chatCompressionService.test.ts`: Tests for abort signal propagation

## Final Implementation Status
- **Status**: MERGED (2026-05-09)
- **Outcome**: Implemented as designed
