# qwen-code PRs · 2026-06-01 ~ 2026-06-07  (W23 最终版)

**统计**: 23 PRs — 15 merged / 5 open / 3 closed

| PR | 状态 | 标题 | 变更 | 文件 | 创建 | 合并/关闭 | 链接 |
|---|---|---|---|---|---|---|---|
| #4666 | ✅ merged | fix(daemon): btw cross-session leak + timeout + input cap + permission | +67/-45 | 5 | 06-01 | 06-01 | https://github.com/QwenLM/qwen-code/pull/4666 |
| #4667 | ⬜ closed | fix(core): add configurable bodyTimeout to prevent streaming timeout w | +255/-100 | 12 | 06-01 | 06-03 | https://github.com/QwenLM/qwen-code/pull/4667 |
| #4682 | ✅ merged | feat(telemetry): expand daemon telemetry route coverage | +52/-11 | 1 | 06-01 | 06-02 | https://github.com/QwenLM/qwen-code/pull/4682 |
| #4683 | ⬜ closed | chore(integration): mark main merged for PR 4490 | +0/-0 | 0 | 06-01 | 06-01 | https://github.com/QwenLM/qwen-code/pull/4683 |
| #4689 | ✅ merged | fix(daemon): isolate parallel subAgent text streams in transcript redu | +798/-18 | 8 | 06-02 | 06-03 | https://github.com/QwenLM/qwen-code/pull/4689 |
| #4693 | ✅ merged | feat(telemetry): enrich llm_request span with response metadata and er | +213/-4 | 3 | 06-02 | 06-03 | https://github.com/QwenLM/qwen-code/pull/4693 |
| #4694 | ✅ merged | fix(daemon): compacted session replay for long-session recovery | +1084/-35 | 11 | 06-02 | 06-03 | https://github.com/QwenLM/qwen-code/pull/4694 |
| #4702 | ✅ merged | fix(daemon): auto-recover transcript on ring_evicted resync | +29/-7 | 3 | 06-02 | 06-02 | https://github.com/QwenLM/qwen-code/pull/4702 |
| #4703 | ✅ merged | fix(core): explicitly set stream: false in non-streaming requests | +6/-1 | 2 | 06-02 | 06-02 | https://github.com/QwenLM/qwen-code/pull/4703 |
| #4730 | ✅ merged | fix: add missing TelemetryRuntimeConfig methods and remove obsolete te | +4/-6184 | 3 | 06-03 | 06-03 | https://github.com/QwenLM/qwen-code/pull/4730 |
| #4731 | ✅ merged | fix: add missing isForkSubagentEnabled from main merge | +13/-0 | 2 | 06-03 | 06-03 | https://github.com/QwenLM/qwen-code/pull/4731 |
| #4749 | ✅ merged | feat(telemetry): add daemon OTel metrics and structured log records | +837/-66 | 9 | 06-03 | 06-05 | https://github.com/QwenLM/qwen-code/pull/4749 |
| #4751 | ✅ merged | feat(daemon): optimize ACP child lifecycle — skip relaunch, preheat, i | +2224/-21 | 15 | 06-03 | 06-05 | https://github.com/QwenLM/qwen-code/pull/4751 |
| #4765 | ✅ merged | fix(daemon): preserve parentToolCallId in compaction engine for parall | +569/-29 | 2 | 06-04 | 06-04 | https://github.com/QwenLM/qwen-code/pull/4765 |
| #4774 | ✅ merged | refactor(daemon): simplify code and strip PR/commit references from co | +2775/-4969 | 81 | 06-04 | 06-05 | https://github.com/QwenLM/qwen-code/pull/4774 |
| #4811 | ✅ merged | feat(cli): enable /remember, /forget, /dream in ACP mode | +278/-43 | 6 | 06-05 | 06-06 | https://github.com/QwenLM/qwen-code/pull/4811 |
| #4812 | 🟡 open | feat(serve): add POST /session/:id/branch for session forking | +345/-3 | 14 | 06-05 | — | https://github.com/QwenLM/qwen-code/pull/4812 |
| #4816 | 🟡 open | feat(serve): add /settings slash command for web-shell | +1103/-8 | 27 | 06-06 | — | https://github.com/QwenLM/qwen-code/pull/4816 |
| #4817 | ⬜ closed | feat(serve): add HTTP rewind endpoints for daemon/web-shell (issue #45 | +443/-13 | 15 | 06-06 | 06-06 | https://github.com/QwenLM/qwen-code/pull/4817 |
| #4818 | 🟡 open | Revert "feat(cli): enable /remember, /forget, /dream in ACP mode" | +43/-278 | 6 | 06-06 | — | https://github.com/QwenLM/qwen-code/pull/4818 |
| #4819 | ✅ merged | feat(cli): enable /remember, /forget, /dream in ACP mode | +302/-43 | 6 | 06-06 | 06-06 | https://github.com/QwenLM/qwen-code/pull/4819 |
| #4820 | 🟡 open | feat(serve): add HTTP rewind endpoints for daemon/web-shell (issue #45 | +474/-14 | 16 | 06-06 | — | https://github.com/QwenLM/qwen-code/pull/4820 |
| #4822 | 🟡 open | feat(serve): add hooks diagnostic HTTP/ACP surface (issue #4514 T3.9) | +593/-4 | 15 | 06-06 | — | https://github.com/QwenLM/qwen-code/pull/4822 |

_W23 最终版 · 更新于 2026-06-07_