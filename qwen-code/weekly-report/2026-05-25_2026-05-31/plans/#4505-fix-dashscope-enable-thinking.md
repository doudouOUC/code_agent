# fix(core): emit enable_thinking on DashScope when reasoning is disabled

PR: #4505 | Merged: 2026-05-31 | +419/-6 | 2 files

## What it does
Fixes a bug where qwen3 models on DashScope silently burned reasoning tokens despite `includeThoughts: false` being set. The hostname-gated guard now unconditionally sets `enable_thinking: false` for DashScope providers, mirroring the existing DeepSeek branch logic.

## Key files changed
- `packages/core/src/core/openaiContentGenerator/pipeline.ts`: Replace faulty `'enable_thinking' in typed` guard with DashScope hostname detection
- `packages/core/src/core/openaiContentGenerator/pipeline.test.ts`: Add 5 new tests covering DashScope/QWEN_OAUTH/internal hostname scenarios

## Final Implementation Status
- **Status**: MERGED (2026-05-31)
- **Outcome**: Implemented as designed
