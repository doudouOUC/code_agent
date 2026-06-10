# qwen-code PRs · 2026-06-08 ~ 2026-06-14  (W24)

**主题**: daemon rate limiting、stress test、GitService 移除、file history 持久化、telemetry TRACEPARENT

**统计**: 6 PRs — 3 merged / 2 open / 1 closed  
**代码量**: +3,270 / -1,360，70 个文件变更 _(不含 closed #4886)_  
**类型**: feat ×4, refactor ×1, merge ×1 (closed)  
**范围 (scope)**: serve ×1, test ×1, core ×2, telemetry ×1

| PR | 状态 | 标题 | 变更 | 文件 | 创建 | 合并/关闭 | 链接 |
|---|---|---|---|---|---|---|---|
| #4861 | ✅ merged | feat(serve): add per-tier HTTP rate limiting for daemon (issue #4514 T3.4) | +1051/-1 | 8 | 06-08 | 06-08 | https://github.com/QwenLM/qwen-code/pull/4861 |
| #4862 | ✅ merged | feat(test): add daemon connection stress test + refactor perf harness | +1268/-505 | 10 | 06-08 | 06-08 | https://github.com/QwenLM/qwen-code/pull/4862 |
| #4871 | ✅ merged | refactor(core): remove GitService, migrate /restore to FileHistoryService | +170/-733 | 31 | 06-08 | 06-09 | https://github.com/QwenLM/qwen-code/pull/4871 |
| #4886 | ⬜ closed | merge: resolve conflicts with origin/main | +33833/-3651 | 351 | 06-09 | 06-09 | https://github.com/QwenLM/qwen-code/pull/4886 |
| #4897 | 🟡 open | feat(core): persist file history snapshots for cross-session /rewind (T2.1) | +318/-17 | 10 | 06-09 | — | https://github.com/QwenLM/qwen-code/pull/4897 |
| #4906 | 🟡 open | feat(telemetry): inject TRACEPARENT env var into shell child processes | +463/-104 | 11 | 06-09 | — | https://github.com/QwenLM/qwen-code/pull/4906 |

_W24 进行中 · 更新于 2026-06-09_
