# fix(core): reject truncated subagent write_file calls

PR: #3505 | Merged: 2026-04-22 | +305/-20 | 4 files

## What it does
Propagates MAX_TOKENS truncation metadata from subagent model responses into scheduled tool requests, then rejects truncated edit tool calls before schema validation. Prevents half-generated `write_file` calls from surfacing misleading missing-parameter errors or writing partial content to disk.

## Key files changed
- `packages/core/src/core/coreToolScheduler.ts`: Detect and reject truncated tool calls with truncation-protection error
- `packages/core/src/core/coreToolScheduler.test.ts`: Regression tests for scheduler-level truncation
- `packages/core/src/agents/runtime/agent-core.ts`: Propagate truncation metadata from model response
- `packages/core/src/agents/runtime/agent-headless.test.ts`: Subagent-level truncation test

## Final Implementation Status
- **Status**: MERGED (2026-04-22)
- **Outcome**: Implemented as designed
