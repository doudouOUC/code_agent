# feat(skills): add /batch skill for parallel batch operations

PR: #3079 | Merged: 2026-04-17 | +303/-0 | 1 file

## What it does
Adds a `/batch` built-in skill for orchestrating large-scale parallel file changes. It discovers target files via glob patterns, splits them into chunks for parallel processing with worker agents, and supports `--dry-run` mode for preview before execution.

## Key files changed
- `packages/core/src/skills/bundled/batch/SKILL.md`: New skill definition with prompt template for batch parallel operations

## Final Implementation Status
- **Status**: MERGED (2026-04-17)
- **Outcome**: Implemented as designed
