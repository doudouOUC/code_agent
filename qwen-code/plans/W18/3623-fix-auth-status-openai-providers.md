# fix(cli): recognize OpenAI-compatible providers in `qwen auth status`

PR: #3623 | Merged: 2026-04-28 | +475/-30 | 2 files

## What it does
Fixes `qwen auth status` which previously misclassified all `selectedType=openai` configs as Coding Plan. Splits the USE_OPENAI branch into Coding Plan path (detected via region or URL heuristic) and a generic OpenAI-compatible path that displays provider name, model, and base URL.

## Key files changed
- `packages/cli/src/commands/auth/handler.ts`: Split OpenAI status logic into Coding Plan vs generic provider branches
- `packages/cli/src/commands/auth/status.test.ts`: Added 17 unit tests covering both classification paths

## Final Implementation Status
- **Status**: MERGED (2026-04-28)
- **Outcome**: Implemented as designed
