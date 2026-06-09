# feat(core): add reactive compression on context overflow

PR: #3879 | Merged: 2026-05-09 | +797/-12 | 5 files

## What it does
Adds a recovery path that recognizes provider context-window overflow errors, compresses the current conversation, and retries the failed turn once with compressed context. Handles OpenAI-style maximum-context errors, `context_length_exceeded`, prompt-too-long, and DashScope input-length errors, keeping long sessions recoverable instead of failing immediately.

## Key files changed
- `packages/core/src/utils/contextLengthError.ts`: Error classifier for context overflow patterns
- `packages/core/src/utils/contextLengthError.test.ts`: Tests for all error pattern variants
- `packages/core/src/core/geminiChat.ts`: Retry logic with compression on overflow detection
- `packages/core/src/core/geminiChat.test.ts`: Tests for retry/compression interaction
- `packages/core/src/services/chatCompressionService.ts`: Compression service integration point

## Final Implementation Status
- **Status**: MERGED (2026-05-09)
- **Outcome**: Implemented as designed
