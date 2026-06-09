# feat(daemon): server-pushed followup_suggestion event for the webui

PR: #4507 | Merged: 2026-05-27 | +1154/-22 | 18 files

## What it does
Adds a `followup_suggestion` daemon SSE event that lets the ACP child push server-generated ghost-text suggestions to attached clients after every assistant turn. The webui's existing `<InputForm followupState>` prop is now fed via a new `useDaemonFollowupSuggestion` hook. The wire contract is additive with no protocol version bump.

## Key files changed
- `packages/sdk-typescript/src/daemon/events.ts`: New `DaemonFollowupSuggestionData` type and event envelope
- `packages/acp-bridge/src/bridgeClient.ts`: Translate `qwen/notify/session/prompt-suggestion` extNotification into SSE frame
- `packages/cli/src/acp-integration/session/Session.ts`: Fire-and-forget followup generation after `end_turn`
- `packages/sdk-typescript/src/daemon/ui/store.ts`: `lastFollowupSuggestion` field and `clearFollowupSuggestion` action

## Final Implementation Status
- **Status**: MERGED (2026-05-27)
- **Outcome**: Implemented as designed
