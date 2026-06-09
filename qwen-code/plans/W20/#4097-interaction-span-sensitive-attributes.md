# feat(telemetry): add interaction span and detailed sensitive attributes

PR: #4097 | Merged: 2026-05-16 | +893/-175 | 13 files

## What it does
Adds a top-level `qwen-code.interaction` span per user-driven turn, and when `includeSensitiveSpanAttributes` is enabled, attaches rich content attributes (user prompt, system prompt, tool I/O, model output) to existing LLM and tool spans. All large content is truncated at 60KB with metadata. The sensitive flag defaults to false; when off, none of the sensitive attributes are written.

## Key files changed
- `packages/core/src/telemetry/detailed-span-attributes.ts`: New module for sensitive attribute recording with SHA-256 dedup
- `packages/core/src/telemetry/detailed-span-attributes.test.ts`: Tests for truncation and deduplication
- `packages/core/src/core/client.ts`: Interaction span creation with sensitive attributes
- `packages/core/src/core/coreToolScheduler.ts`: Tool input/result attribute recording
- `packages/core/src/core/loggingContentGenerator/loggingContentGenerator.ts`: Model output attribute recording
- `packages/cli/src/config/settingsSchema.ts`: New `includeSensitiveSpanAttributes` setting
- `docs/developers/development/telemetry.md`: Developer documentation for new attributes

## Final Implementation Status
- **Status**: MERGED (2026-05-16)
- **Outcome**: Implemented as designed
