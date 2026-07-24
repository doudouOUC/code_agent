# 2026-07-20_2026-07-26 PR 最终实现文档索引

仅保留 @doudouOUC 个人 PR 的最终实现文档。open PR 只记录当前 diff 方案，不能视为 `main` 已落地能力。

| PR | 状态 | 标题 | 文档 |
|---|---|---|---|
| [#7248](https://github.com/QwenLM/qwen-code/pull/7248) | ✅ merged | fix(core): Enforce Plan mode entry boundary | [pr-7248.md](pr-7248.md) |
| [#7268](https://github.com/QwenLM/qwen-code/pull/7268) | 🟡 open | feat(serve): Hot-reload workspace trust changes | [pr-7268.md](pr-7268.md) |
| [#7269](https://github.com/QwenLM/qwen-code/pull/7269) | ✅ merged | fix(sdk): clean up SSE requests on errors and dispose | [pr-7269.md](pr-7269.md) |
| [#7276](https://github.com/QwenLM/qwen-code/pull/7276) | ✅ merged | perf(telemetry): lazy-load the SDK and split OTLP exporter chains by protocol | [pr-7276.md](pr-7276.md) |
| [#7295](https://github.com/QwenLM/qwen-code/pull/7295) | ✅ merged | fix(cli): Preserve cancellation during permission prompts | [pr-7295.md](pr-7295.md) |
| [#7323](https://github.com/QwenLM/qwen-code/pull/7323) | ✅ merged | fix(core): Enforce final tool response budgets | [pr-7323.md](pr-7323.md) |
| [#7386](https://github.com/QwenLM/qwen-code/pull/7386) | ✅ merged | fix(acp-bridge): make detachClient idempotent via per-clientId attach-ref ledger | [pr-7386.md](pr-7386.md) |
| [#7400](https://github.com/QwenLM/qwen-code/pull/7400) | ✅ merged | fix(acp-bridge): guarantee exactly-once prompt terminal events in daemon serve mode | [pr-7400.md](pr-7400.md) |
| [#7447](https://github.com/QwenLM/qwen-code/pull/7447) | ❌ closed | perf(telemetry): Lazy-load the SDK and split OTLP exporter chains by protocol | [pr-7447.md](pr-7447.md) |
| [#7453](https://github.com/QwenLM/qwen-code/pull/7453) | ✅ merged | fix(acp-bridge): close prompt-terminal follow-ups from the PR #7400 self-review | [pr-7453.md](pr-7453.md) |
| [#7455](https://github.com/QwenLM/qwen-code/pull/7455) | ✅ merged | perf(startup): Load undici lazily behind package-local dynamic imports | [pr-7455.md](pr-7455.md) |
| [#7456](https://github.com/QwenLM/qwen-code/pull/7456) | ✅ merged | test(telemetry): Cover daemon metrics init ordering and document metricReader asymmetry | [pr-7456.md](pr-7456.md) |
| [#7458](https://github.com/QwenLM/qwen-code/pull/7458) | ✅ merged | fix(serve): detect stale SSE cursors across daemon restarts via epoch token; preserve turn attribution and surface compaction failures in replay | [pr-7458.md](pr-7458.md) |
| [#7463](https://github.com/QwenLM/qwen-code/pull/7463) | ✅ merged | feat(sdk-java): Add daemon transport | [pr-7463.md](pr-7463.md) |
| [#7470](https://github.com/QwenLM/qwen-code/pull/7470) | ✅ merged | test(core): Cover Shell truncation without an artifact | [pr-7470.md](pr-7470.md) |
| [#7502](https://github.com/QwenLM/qwen-code/pull/7502) | ❌ closed | feat(integrations): Add enterprise multi-tenant memory gateway | [pr-7502.md](pr-7502.md) |
| [#7505](https://github.com/QwenLM/qwen-code/pull/7505) | 🟡 open | feat(integrations): Add canonical memory persistence | [pr-7505.md](pr-7505.md) |
| [#7506](https://github.com/QwenLM/qwen-code/pull/7506) | 🟡 open | feat(integrations): Add Qwen enterprise memory agent | [pr-7506.md](pr-7506.md) |
| [#7507](https://github.com/QwenLM/qwen-code/pull/7507) | 🟡 open | feat(integrations): Add governed memory lifecycle | [pr-7507.md](pr-7507.md) |
| [#7508](https://github.com/QwenLM/qwen-code/pull/7508) | 🟡 open | feat(integrations): Add enterprise memory APIs | [pr-7508.md](pr-7508.md) |
| [#7509](https://github.com/QwenLM/qwen-code/pull/7509) | 🟡 open | feat(integrations): Add enterprise memory foundations | [pr-7509.md](pr-7509.md) |
| [#7512](https://github.com/QwenLM/qwen-code/pull/7512) | ✅ merged | perf(startup): lazy-load Google GenAI SDK on first use | [pr-7512.md](pr-7512.md) |
| [#7536](https://github.com/QwenLM/qwen-code/pull/7536) | ✅ merged | feat(core): Align GenAI telemetry with ARMS | [pr-7536.md](pr-7536.md) |
| [#7558](https://github.com/QwenLM/qwen-code/pull/7558) | ✅ merged | perf(cli): Defer ACP telemetry initialization | [pr-7558.md](pr-7558.md) |
| [#7586](https://github.com/QwenLM/qwen-code/pull/7586) | 🟡 open | feat(integrations): add retrieval-only external context search | [pr-7586.md](pr-7586.md) |
| [#7594](https://github.com/QwenLM/qwen-code/pull/7594) | ✅ merged | perf(cli): Propagate compile cache to ACP children | [pr-7594.md](pr-7594.md) |
| [#7603](https://github.com/QwenLM/qwen-code/pull/7603) | ✅ merged | fix(sdk-java): Harden daemon transport reliability | [pr-7603.md](pr-7603.md) |
| [#7619](https://github.com/QwenLM/qwen-code/pull/7619) | ✅ merged | fix(daemon): address epoch cursor review follow-ups | [pr-7619.md](pr-7619.md) |
| [#7622](https://github.com/QwenLM/qwen-code/pull/7622) | ✅ merged | fix(acp-bridge): resource hardening for the session event pipeline (DAEMON-009/010/011) | [pr-7622.md](pr-7622.md) |
| [#7635](https://github.com/QwenLM/qwen-code/pull/7635) | ✅ merged | feat(core): Align GenAI request telemetry with ARMS | [pr-7635.md](pr-7635.md) |
| [#7650](https://github.com/QwenLM/qwen-code/pull/7650) | ✅ merged | fix(core): Preserve usage after empty OpenAI stream frames | [pr-7650.md](pr-7650.md) |
| [#7667](https://github.com/QwenLM/qwen-code/pull/7667) | 🟡 open | feat(core): Align GenAI content telemetry fields | [pr-7667.md](pr-7667.md) |

_按个人 PR 口径更新于 2026-07-24_
