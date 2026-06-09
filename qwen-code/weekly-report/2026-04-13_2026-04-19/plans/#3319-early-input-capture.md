# feat(cli): add early input capture to prevent keystroke loss during startup

PR: #3319 | Merged: 2026-04-18 | +775/-0 | 4 files

## What it does
Starts raw mode stdin listening immediately after `setRawMode(true)`, buffers user input during REPL initialization (200-500ms), then replays it once `KeypressProvider` is mounted. Filters out terminal response sequences (DA, DA2, OSC, DCS, APC) while preserving real user keystrokes. Disableable via `QWEN_CODE_DISABLE_EARLY_CAPTURE=1`.

## Key files changed
- `packages/cli/src/utils/earlyInputCapture.ts`: Core capture/buffer/replay implementation with 64KB limit
- `packages/cli/src/utils/earlyInputCapture.test.ts`: Comprehensive tests for filtering and replay
- `packages/cli/src/gemini.tsx`: Activate capture at startup entry point
- `packages/cli/src/ui/contexts/KeypressContext.tsx`: Replay buffered input on mount

## Final Implementation Status
- **Status**: MERGED (2026-04-18)
- **Outcome**: Implemented as designed
