# feat(test): add daemon connection stress test + refactor perf harness

PR: #4862 | Merged: 2026-06-08 | +1268/-505 | 10 files

## What it does
Extracts shared helpers from baseline/benchmark daemon tests into dedicated modules and adds a new mock-ACP connection stress test suite gated by `QWEN_LOADTEST_ENABLED=1`. Includes a mock ACP agent with env-controlled error injection modes (echo/reject/crash/hang) and 5 stress scenarios: rapid lifecycle, SSE slow-consumer eviction, Last-Event-ID reconnect, ACP crash recovery, burst concurrent sessions.

## Key files changed
- `integration-tests/cli/qwen-daemon-loadtest.test.ts`: 5 stress test scenarios
- `integration-tests/fixtures/mock-acp-child/agent.mjs`: Mock ACP agent with error injection
- `integration-tests/cli/_daemon-harness.ts`: Shared test helpers extracted
- `integration-tests/cli/_daemon-perf-report.ts`: Shared reporting utilities

## Final Implementation Status
- **Status**: MERGED (2026-06-08)
- **Outcome**: Implemented as designed
