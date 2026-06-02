# qwen-code PRs · 2026-06-01 ~ 2026-06-07  (W23)

**主题**: daemon 修复（btw 泄漏/transcript/resync/stream）、telemetry 路由覆盖 + 响应元数据、core 流式超时 + stream:false

**统计**: 9 PRs — 4 merged / 4 open / 1 closed  
**代码量**: +2,433 / -197，43 个文件变更  
**类型**: fix ×6, feat ×2, chore ×1  
**范围 (scope)**: daemon ×4, core ×2, telemetry ×2, integration ×1

| PR | 状态 | 类型 | 标题 | 变更 | 文件 | 创建 | 合并/关闭 | 链接 |
|---|---|---|---|---|---|---|---|---|
| #4666 | ✅ merged | fix(daemon) | fix(daemon): btw cross-session leak + timeout + input cap + permission requestId cardinality | +67/-45 | 5 | 06-01 | 06-01 | https://github.com/QwenLM/qwen-code/pull/4666 |
| #4667 | 🟡 open | fix(core) | fix(core): add configurable bodyTimeout to prevent streaming timeout with local models | +281/-91 | 12 | 06-01 | — | https://github.com/QwenLM/qwen-code/pull/4667 |
| #4682 | ✅ merged | feat(telemetry) | feat(telemetry): expand daemon telemetry route coverage | +52/-11 | 1 | 06-01 | 06-02 | https://github.com/QwenLM/qwen-code/pull/4682 |
| #4683 | ⬜ closed | chore(integration) | chore(integration): mark main merged for PR 4490 | +0/-0 | 0 | 06-01 | 06-01 | https://github.com/QwenLM/qwen-code/pull/4683 |
| #4689 | 🟡 open | fix(daemon) | fix(daemon): isolate parallel subAgent text streams in transcript reducer | +729/-18 | 8 | 06-02 | — | https://github.com/QwenLM/qwen-code/pull/4689 |
| #4693 | 🟡 open | feat(telemetry) | feat(telemetry): enrich llm_request span with response metadata and error details | +213/-4 | 3 | 06-02 | — | https://github.com/QwenLM/qwen-code/pull/4693 |
| #4694 | 🟡 open | fix(daemon) | fix(daemon): compacted session replay for long-session recovery | +1056/-20 | 9 | 06-02 | — | https://github.com/QwenLM/qwen-code/pull/4694 |
| #4702 | ✅ merged | fix(daemon) | fix(daemon): auto-recover transcript on ring_evicted resync | +29/-7 | 3 | 06-02 | 06-02 | https://github.com/QwenLM/qwen-code/pull/4702 |
| #4703 | ✅ merged | fix(core) | fix(core): explicitly set stream: false in non-streaming requests | +6/-1 | 2 | 06-02 | 06-02 | https://github.com/QwenLM/qwen-code/pull/4703 |

### W22 漏收补录（创建于 05-31，原周报查询时尚未提交）

| PR | 状态 | 类型 | 标题 | 变更 | 文件 | 创建 | 合并/关闭 | 链接 |
|---|---|---|---|---|---|---|---|---|
| #4658 | ✅ merged | fix(infra) | fix(infra): enforce SDK/server MCP-restart timeout coupling (#4330) | +48/-39 | 7 | 05-31 | 06-01 | https://github.com/QwenLM/qwen-code/pull/4658 |
| #4659 | ⬜ closed | feat(telemetry) | feat(telemetry): per-prompt traceId for bounded, renderable traces | +26291/-2413 | 200 | 05-31 | 05-31 | https://github.com/QwenLM/qwen-code/pull/4659 |
| #4660 | 🟡 open | fix(telemetry) | fix(telemetry): clear span dedup state after chat compression (#3731) | +28/-2 | 4 | 05-31 | — | https://github.com/QwenLM/qwen-code/pull/4660 |
| #4661 | ✅ merged | feat(telemetry) | feat(telemetry): per-prompt traceId for bounded, renderable traces | +107/-144 | 8 | 05-31 | 06-01 | https://github.com/QwenLM/qwen-code/pull/4661 |

### 本周合并的历史 PR（创建于更早周，本周合入 main / daemon_mode_b_main）

- #4333（W21，atomic write rollout）→ merged 06-02
- #4414（W21，file-history housekeeping）→ merged 06-02
- #4431（W21，uid/gid atomicWriteFile）→ merged 06-01

_生成于 2026-06-03_