# feat(cli): add startup performance profiler

PR: #3232 | Merged: 2026-04-14 | +383/-0 | 6 files

## What it does
Adds a lightweight startup profiler activated via `QWEN_CODE_PROFILE_STARTUP=1` that instruments `main()` with 7 checkpoints at key startup phases. Writes a JSON timing report to `~/.qwen/startup-perf/` with per-phase durations, platform info, and session ID. Zero overhead when disabled.

## Key files changed
- `packages/cli/src/utils/startupProfiler.ts`: Core profiler implementation with mark/measure/report APIs
- `packages/cli/src/utils/startupProfiler.test.ts`: Unit tests for profiler
- `packages/cli/src/gemini.tsx`: Instrument main() with 7 checkpoint calls
- `packages/cli/index.ts`: Entry point integration
- `docs/users/configuration/settings.md`: Document env var

## Final Implementation Status
- **Status**: MERGED (2026-04-14)
- **Outcome**: Implemented as designed
