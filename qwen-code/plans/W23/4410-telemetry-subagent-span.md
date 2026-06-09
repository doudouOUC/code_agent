# feat(telemetry): Phase 3 — qwen-code.subagent span with concurrent isolation (#3731)

PR: #4410 | Merged: 2026-06-05 | +2469/-111 | 15 files

## What it does
Adds a qwen-code.subagent span around every subagent invocation so that LLM/tool/hook spans emitted by the subagent form a proper subtree instead of interleaving with concurrent siblings under the parent interaction span. Solves the problem where 3 concurrent AGENT tool calls produced indistinguishable children.

## Key files changed
- `packages/core/src/agents/runtime/agent-context.ts`: Subagent span creation with context propagation
- `packages/core/src/agents/runtime/agent-context.test.ts`: Tests for concurrent isolation
- `packages/core/src/telemetry/constants.ts`: New SUBAGENT span name constant
- `packages/core/src/telemetry/index.ts`: Export subagent span utilities
- `docs/design/telemetry-subagent-spans-design.md`: Design document for the feature

## Final Implementation Status
- **Status**: MERGED (2026-06-05)
- **Outcome**: Implemented as designed — Phase 3 of #3731 deeper observability
