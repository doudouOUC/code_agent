# feat(daemon): server-side shell command execution for ! (bang) prefix

PR: #4576 | Merged: 2026-05-28 | +356/-10 | 16 files

## What it does
Adds `POST /session/:id/shell` route for direct shell command execution in daemon mode, bypassing the LLM. Web-shell `!` prefix and channel adapters (Telegram/DingTalk/WeChat) now route through direct execution with streaming `shell_output` SSE events, instead of wrapping commands as natural-language prompts that waste tokens.

## Key files changed
- `packages/cli/src/serve/server.ts`: New `/shell` route using `ShellExecutionService`
- `packages/acp-bridge/src/bridge.ts`: `executeShellCommand` bridge method
- `packages/channels/base/src/ChannelBase.ts`: Detect `!` prefix and route to direct execution
- `packages/sdk-typescript/src/daemon/events.ts`: `user_shell_command` / `user_shell_result` SSE event types

## Final Implementation Status
- **Status**: MERGED (2026-05-28)
- **Outcome**: Implemented as designed
