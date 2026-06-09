# feat(serve): add per-tier HTTP rate limiting for daemon (issue #4514 T3.4)

PR: #4861 | Merged: 2026-06-08 | +1051/-1 | 8 files

## What it does
Adds opt-in per-tier HTTP rate limiting to `qwen serve` via `--rate-limit` flag. Uses token bucket with continuous drip refill. Three tiers: prompt (10/min), mutation (30/min), read (120/min) per client key. Health/heartbeat/SSE/ACP endpoints exempt. Fail-open on capacity overflow and internal errors. Default off for backward compatibility.

## Key files changed
- `packages/cli/src/serve/rateLimit.ts`: Core middleware with token bucket, key extractor, tier resolver, GC
- `packages/cli/src/serve/rateLimit.test.ts`: 25 unit tests covering bucket mechanics and edge cases
- `packages/cli/src/commands/serve.ts`: `--rate-limit` CLI flag
- `packages/cli/src/serve/server.ts`: Wire middleware into request pipeline

## Final Implementation Status
- **Status**: MERGED (2026-06-08)
- **Outcome**: Implemented as designed
