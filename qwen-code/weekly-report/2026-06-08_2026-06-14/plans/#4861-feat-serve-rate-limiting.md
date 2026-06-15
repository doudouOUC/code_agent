# feat(serve): add per-tier HTTP rate limiting for daemon (issue #4514 T3.4)

PR: #4861 | Merged: 2026-06-08 | +1051/-1 | 8 files

## What it does
Adds opt-in per-tier HTTP rate limiting to `qwen serve` via `--rate-limit`, `--no-rate-limit`, and matching `QWEN_SERVE_RATE_LIMIT*` env vars. Uses token bucket with continuous drip refill. Three tiers default to prompt (10/min), mutation (30/min), and read (120/min) per client key, with per-tier and window overrides. Health, demo, OPTIONS, heartbeat, SSE, and ACP endpoints are exempt. Limited requests return `429 rate_limit_exceeded` with `Retry-After` and rate-limit headers. The limiter fails open on capacity overflow and supports draining during shutdown. Default off for backward compatibility.

## Key files changed
- `packages/cli/src/serve/rateLimit.ts`: Core middleware with token bucket, key extractor, tier resolver, GC
- `packages/cli/src/serve/rateLimit.test.ts`: 25 unit tests covering bucket mechanics and edge cases
- `packages/cli/src/commands/serve.ts`: CLI/env parsing for enablement, per-tier limits, and window size
- `packages/cli/src/serve/capabilities.ts`: Conditional `rate_limit` advertised feature
- `packages/cli/src/serve/server.ts`: Wire middleware after auth and expose rate-limit hit counts in health status

## Final Implementation Status
- **Status**: MERGED (2026-06-08)
- **Outcome**: Implemented with additional env-var controls, per-tier/window overrides, conditional capability advertisement, and HTTP rate-limit response headers
