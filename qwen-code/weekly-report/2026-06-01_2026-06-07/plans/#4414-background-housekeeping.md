# feat(cli): background housekeeping for stale file-history dirs

PR: #4414 | Merged: 2026-06-02 | +1059/-12 | 13 files

## What it does
Adds a generic background housekeeping framework with file-history cleanup as the first consumer. Sweeps ~/.qwen/file-history/ directories older than 30 days (configurable via general.cleanupPeriodDays). Uses 10-min startup delay, 24h recurring cadence, idle-gating, O_EXCL lockfile for multi-process safety, and current-session whitelisting.

## Key files changed
- `packages/cli/src/utils/housekeeping/scheduler.ts`: Core scheduler with startup delay, cadence, idle-gate, unref timers
- `packages/cli/src/utils/housekeeping/cleanup.ts`: File-history sweep with mtime check + session whitelist
- `packages/cli/src/utils/housekeeping/lastInteractionAt.ts`: Idle detection via last keystroke tracking
- `packages/cli/src/utils/housekeeping/throttledOnce.test.ts`: Lockfile + mtime throttle tests
- `packages/cli/src/config/settingsSchema.ts`: general.cleanupPeriodDays setting

## Final Implementation Status
- **Status**: MERGED (2026-06-02)
- **Outcome**: Implemented as designed — closes #4173
