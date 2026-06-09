# chore(integration): sync main into daemon_mode_b_main (2026-05-25)

PR: #4500 | Merged: 2026-05-25 | +501/-0 | 7 files

## What it does
Periodic main-to-integration branch sync pulling 5 main commits into daemon_mode_b_main. Unblocks PR #4490 (the reverse daemon_mode_b_main -> main merge for v0.16-alpha) which was CONFLICTING due to these 5 commits. Includes weixin image fixes, stale closure race fix, memory-leak-debug skill, and directory completion improvement.

## Key files changed
- `.qwen/skills/memory-leak-debug/SKILL.md`: Memory-leak-debug skill from #4468
- `packages/core/src/extension/redaction.ts`: From #4464 weixin image fix
- `packages/core/src/utils/projectRoot.ts`: From #4288 directory completion fix
- `.qwen/skills/memory-leak-debug/scripts/find-leaf-node.sh`: Heap snapshot diagnosis script
- `packages/core/src/extension/redaction.test.ts`: Tests for weixin image payloads

## Final Implementation Status
- **Status**: MERGED (2026-05-25)
- **Outcome**: Implemented as designed — integration sync enabling v0.16-alpha merge
