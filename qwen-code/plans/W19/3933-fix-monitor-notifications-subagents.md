# [codex] fix monitor notifications for subagents

PR: #3933 | Merged: 2026-05-09 | +1772/-82 | 19 files

## What it does
Routes Monitor notifications to the agent that started the monitor, including foreground, background, fork, and resumed subagents. Previously subagent-owned monitors used the shared parent notification callback, causing monitor events to pollute the parent context while the owning subagent could not consume them. Also handles idle-wait behavior and cleanup on agent exit.

## Key files changed
- `packages/core/src/agents/runtime/agent-core.ts`: Per-agent monitor notification routing
- `packages/core/src/agents/runtime/agent-events.ts`: Monitor event type definitions
- `packages/core/src/agents/background-tasks.ts`: Monitor ownership tracking
- `packages/core/src/agents/background-agent-resume.ts`: Monitor resume for background agents
- `packages/core/src/agents/agent-transcript.ts`: Transcript integration for monitor events
- `packages/core/src/agents/runtime/agent-headless.test.ts`: Tests for subagent routing

## Final Implementation Status
- **Status**: MERGED (2026-05-09)
- **Outcome**: Implemented as designed
