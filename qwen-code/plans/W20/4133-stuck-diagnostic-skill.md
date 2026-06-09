# feat(skills): add /stuck diagnostic skill for frozen sessions

PR: #4133 | Merged: 2026-05-16 | +172/-0 | 2 files

## What it does
Adds a new `/stuck` bundled skill that diagnoses frozen, stuck, or slow Qwen Code sessions. Scans system processes for high CPU, abnormal states (D/T/Z), excessive memory, and hung subprocesses. Checks `~/.qwen/debug/` logs and supports macOS `sample` + Linux `/proc/stack` for stack dumps. Presents a structured diagnostic report directly to the user.

## Key files changed
- `packages/core/src/skills/bundled/stuck/SKILL.md`: Skill definition with diagnostic steps and output format
- `packages/core/src/skills/bundled-skills.integration.test.ts`: Integration test for skill loading

## Final Implementation Status
- **Status**: MERGED (2026-05-16)
- **Outcome**: Implemented as designed
