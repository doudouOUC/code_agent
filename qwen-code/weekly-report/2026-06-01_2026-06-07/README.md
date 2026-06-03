# qwen-code PRs · 2026-06-01 ~ 2026-06-07  (W23)

**主题**: daemon 修复（btw 泄漏/transcript 隔离/resync 恢复/压缩重放）、telemetry（路由覆盖/span 补强/per-prompt traceId/dedup 清理）、core（stream:false/bodyTimeout）

**统计**: 11 PRs — 9 merged / 0 open / 2 closed  
**代码量**: +2,521 / -6,405，50 个文件变更

| PR | 状态 | 类型 | 标题 | 变更 | 文件 | 创建 | 合并/关闭 | 链接 |
|---|---|---|---|---|---|---|---|---|
| #4666 | ✅ merged | fix(daemon) | fix(daemon): btw cross-session leak + timeout + input cap + permission requestId cardinality | +67/-45 | 5 | 06-01 | 06-01 | https://github.com/QwenLM/qwen-code/pull/4666 |
| #4667 | ⬜ closed | fix(core) | fix(core): add configurable bodyTimeout to prevent streaming timeout with local models | +255/-100 | 12 | 06-01 | 06-03 | https://github.com/QwenLM/qwen-code/pull/4667 |
| #4682 | ✅ merged | feat(telemetry) | feat(telemetry): expand daemon telemetry route coverage | +52/-11 | 1 | 06-01 | 06-02 | https://github.com/QwenLM/qwen-code/pull/4682 |
| #4683 | ⬜ closed | chore(integration) | chore(integration): mark main merged for PR 4490 | +0/-0 | 0 | 06-01 | 06-01 | https://github.com/QwenLM/qwen-code/pull/4683 |
| #4689 | ✅ merged | fix(daemon) | fix(daemon): isolate parallel subAgent text streams in transcript reducer | +798/-18 | 8 | 06-02 | 06-03 | https://github.com/QwenLM/qwen-code/pull/4689 |
| #4693 | ✅ merged | feat(telemetry) | feat(telemetry): enrich llm_request span with response metadata and error details _[type/feature-request]_ | +213/-4 | 3 | 06-02 | 06-03 | https://github.com/QwenLM/qwen-code/pull/4693 |
| #4694 | ✅ merged | fix(daemon) | fix(daemon): compacted session replay for long-session recovery | +1084/-35 | 11 | 06-02 | 06-03 | https://github.com/QwenLM/qwen-code/pull/4694 |
| #4702 | ✅ merged | fix(daemon) | fix(daemon): auto-recover transcript on ring_evicted resync | +29/-7 | 3 | 06-02 | 06-02 | https://github.com/QwenLM/qwen-code/pull/4702 |
| #4703 | ✅ merged | fix(core) | fix(core): explicitly set stream: false in non-streaming requests | +6/-1 | 2 | 06-02 | 06-02 | https://github.com/QwenLM/qwen-code/pull/4703 |
| #4730 | ✅ merged | fix | fix: add missing TelemetryRuntimeConfig methods and remove obsolete test | +4/-6184 | 3 | 06-03 | 06-03 | https://github.com/QwenLM/qwen-code/pull/4730 |
| #4731 | ✅ merged | fix | fix: add missing isForkSubagentEnabled from main merge | +13/-0 | 2 | 06-03 | 06-03 | https://github.com/QwenLM/qwen-code/pull/4731 |

### W22 漏收补录（创建于 05-31）

| PR | 状态 | 类型 | 标题 | 变更 | 文件 | 创建 | 合并/关闭 | 链接 |
|---|---|---|---|---|---|---|---|---|
| #4658 | ✅ merged | fix(infra) | fix(infra): enforce SDK/server MCP-restart timeout coupling (#4330) | +48/-39 | 7 | 05-31 | 06-01 | https://github.com/QwenLM/qwen-code/pull/4658 |
| #4659 | ⬜ closed | feat(telemetry) | feat(telemetry): per-prompt traceId for bounded, renderable traces | +26291/-2413 | 200 | 05-31 | 05-31 | https://github.com/QwenLM/qwen-code/pull/4659 |
| #4660 | ✅ merged | fix(telemetry) | fix(telemetry): clear span dedup state after chat compression (#3731) | +28/-2 | 4 | 05-31 | 06-03 | https://github.com/QwenLM/qwen-code/pull/4660 |
| #4661 | ✅ merged | feat(telemetry) | feat(telemetry): per-prompt traceId for bounded, renderable traces | +107/-144 | 8 | 05-31 | 06-01 | https://github.com/QwenLM/qwen-code/pull/4661 |

_更新于 2026-06-04_