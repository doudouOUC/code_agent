# fix(core): stop AbortSignal listener leak in long sessions (MaxListenersExceededWarning)

PR: #4366 | Merged: 2026-05-26 | +1698/-562 | 25 files

## What it does
Fixes MaxListenersExceededWarning (1509 abort listeners) in long interactive sessions. The nested AbortController hierarchy (master -> per-message -> per-API-call -> tool) accumulated dead listeners on long-lived parents. Introduces a new abortController.ts utility with WeakRef-based child propagation, {once:true} listeners, and reverse-cleanup. Adds a belt-and-suspenders warningHandler to hide remaining warnings from end users.

## Key files changed
- `packages/core/src/utils/abortController.ts`: createAbortController, createChildAbortController (WeakRef + reverse cleanup), combineAbortSignals
- `packages/cli/src/utils/warningHandler.ts`: Hides MaxListenersExceededWarning from users (visible in debug mode)
- `packages/cli/src/gemini.tsx`: Migrated to new abort controller utilities
- Multiple agent/tool files: Migrated all AbortController usage to new helpers
- `eslint.config.js`: Lint rule to prevent raw AbortController usage

## Final Implementation Status
- **Status**: MERGED (2026-05-26)
- **Outcome**: Implemented as designed — structural two-layer fix for listener accumulation
