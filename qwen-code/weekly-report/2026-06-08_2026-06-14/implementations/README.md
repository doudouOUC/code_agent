# PR 最终实现文档

本目录按 PR 合入后的最终代码变更整理中文实现文档。每个文件以 PR changed files、已提取的 patch 线索、测试和配置路径为依据，记录实现范围、关键代码路径和验证线索。

| PR | 状态 | 标题 |
|---|---|---|
| [#4812](pr-4812.md) | 已合入 | feat(serve): add POST /session/:id/branch for session forking |
| [#4861](pr-4861.md) | 已合入 | feat(serve): add per-tier HTTP rate limiting for daemon (issue #4514 T3.4) |
| [#4862](pr-4862.md) | 已合入 | feat(test): add daemon connection stress test + refactor perf harness |
| [#4871](pr-4871.md) | 已合入 | refactor(core): remove GitService, migrate /restore to FileHistoryService |
| [#4906](pr-4906.md) | 已合入 | feat(telemetry): inject TRACEPARENT env var into shell child processes |
| [#4924](pr-4924.md) | 已合入 | feat(daemon): add POST /workspace/reload-env for hot-reloading env vars and session auth |
| [#4954](pr-4954.md) | 已合入 | fix(serve): isolate per-session stats in daemon mode |
| [#4965](pr-4965.md) | 已合入 | feat(daemon): add POST /workspace/reload for unified settings hot-reload |
| [#4897](pr-4897.md) | 已合入 | feat(core): persist file history snapshots for cross-session /rewind (T2.1) |
| [#5031](pr-5031.md) | 已合入 | feat(daemon): gate direct session shell behind explicit opt-in |
| [#5006](pr-5006.md) | 已合入 | fix(daemon): Sanitize logs and type MCP restarts |
| [#5033](pr-5033.md) | 已合入 | fix(serve): Add prompt queue backpressure |
| [#5057](pr-5057.md) | 已合入 | fix(core): Persist file history snapshot updates |
