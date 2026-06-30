# PR 最终实现文档

本目录按 PR 合入后的最终代码变更整理中文实现文档。每个文件以 PR changed files、已提取的 patch 线索、测试和配置路径为依据，记录实现范围、关键代码路径和验证线索。

| PR | 状态 | 标题 |
|---|---|---|
| [#4483](pr-4483.md) | 已合入 | docs(deploy): local launch templates for v0.16-alpha (PR 30a) |
| [#4500](pr-4500.md) | 已合入 | chore(integration): sync main into daemon_mode_b_main (2026-05-25) |
| [#4390](pr-4390.md) | 已合入 | feat(telemetry): client-side HTTP span + opt-in W3C traceparent propagation (#4384) |
| [#4366](pr-4366.md) | 已合入 | fix(core): stop AbortSignal listener leak in long sessions (MaxListenersExceededWarning) |
| [#4504](pr-4504.md) | 已合入 | feat(serve): add POST /session/:id/recap |
| [#4530](pr-4530.md) | 已合入 | feat(serve): prompt absolute deadline + SSE writer idle timeout (#4514 T2.9) |
| [#4559](pr-4559.md) | 已合入 | feat(serve): add daemon file logger (#4548) |
| [#4482](pr-4482.md) | 已合入 | fix(telemetry): improve LogToSpan bridge error info and TUI handling |
| [#4507](pr-4507.md) | 已合入 | feat(daemon): server-pushed followup_suggestion event for the webui |
| [#4576](pr-4576.md) | 已合入 | feat(daemon): server-side shell command execution for ! (bang) prefix |
| [#4578](pr-4578.md) | 已合入 | feat(daemon): add session tasks snapshot endpoint |
| [#4556](pr-4556.md) | 已合入 | feat(telemetry): trace daemon prompt lifecycle |
| [#4606](pr-4606.md) | 已合入 | feat(daemon): add request-level logging for serve routes |
| [#4552](pr-4552.md) | 已合入 | feat(serve): runtime MCP server add/remove (T2.8 #4514) |
| [#4610](pr-4610.md) | 已合入 | feat(daemon): add POST /session/:id/btw endpoint for side questions |
| [#4628](pr-4628.md) | 已合入 | feat(telemetry): add client_id attribute and permission route spans |
| [#4630](pr-4630.md) | 已合入 | feat(telemetry): add tool spans and session.id to daemon/ACP path |
| [#4505](pr-4505.md) | 已合入 | fix(core): emit enable_thinking on DashScope when reasoning is disabled |
| [#4646](pr-4646.md) | 已合入 | feat(daemon): clamp oversized inline media on the prompt path |
| [#4563](pr-4563.md) | 已合入 | refactor(serve): extract DaemonWorkspaceService from AcpSessionBridge (issue #4542, 方案 C) |
