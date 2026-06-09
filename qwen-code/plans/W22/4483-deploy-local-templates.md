# docs(deploy): local launch templates for v0.16-alpha (PR 30a)

PR: #4483 | Merged: 2026-05-25 | +224/-1 | 3 files

## What it does
Third PR in the F5 release chain. Adds local deployment templates (systemd, launchd, nohup, tmux) for qwen-serve v0.16-alpha, fulfilling the forward reference from PR 27's known-limits section. Pure documentation with zero code changes.

## Key files changed
- `docs/users/qwen-serve-deploy-local.md`: New file with 4 launcher templates + token rotation + smoke-check
- `docs/users/qwen-serve.md`: Cross-link edits (forward reference becomes live link)
- `docs/users/_meta.ts`: Nav entry under qwen-serve section

## Final Implementation Status
- **Status**: MERGED (2026-05-25)
- **Outcome**: Implemented as designed — pure documentation for local deployment patterns
