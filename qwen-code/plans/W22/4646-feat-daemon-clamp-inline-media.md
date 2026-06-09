# feat(daemon): clamp oversized inline media on the prompt path

PR: #4646 | Merged: 2026-05-31 | +256/-16 | 6 files

## What it does
Adds `clampInlineMediaPart` utility that replaces inline image/audio/blob payloads exceeding a configurable byte ceiling (default 10 MB via `QWEN_CODE_MAX_INLINE_MEDIA_BYTES`) with a sanitized text placeholder, preventing oversized daemon media from blowing up request size or token budget.

## Key files changed
- `packages/core/src/core/inlineMediaLimit.ts`: New clamping utility with base64/buffer threshold detection
- `packages/cli/src/acp-integration/session/Session.ts`: Wire clamp into `#resolvePrompt`
- `packages/cli/src/serve/acpHttp/dispatch.ts`: Advertise `audio: true` in prompt capabilities

## Final Implementation Status
- **Status**: MERGED (2026-05-31)
- **Outcome**: Implemented as designed
