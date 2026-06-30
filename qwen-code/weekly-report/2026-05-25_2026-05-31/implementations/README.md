# PR 最终实现文档

本目录按本周 README 中登记的 PR 明细整理每个 PR 的中文最终实现文档。
最终口径以 merged diff、changed files、patch、测试/配置路径和关闭状态为准；PR body 只作为目标线索。

| PR | 状态 | 标题 | 文档 |
|---|---|---|---|
| [#4490](https://github.com/QwenLM/qwen-code/pull/4490) | 🟡 open | chore(integration): merge daemon_mode_b_main into main — F1/F2/F3/F4-prereq + F5 alpha docs batch (#4175) | [pr-4490.md](pr-4490.md) |
| [#4499](https://github.com/QwenLM/qwen-code/pull/4499) | ✅ merged | fix(telemetry): attach interaction span to session root context | [pr-4499.md](pr-4499.md) |
| [#4500](https://github.com/QwenLM/qwen-code/pull/4500) | ✅ merged | chore(integration): sync main into daemon_mode_b_main (2026-05-25) | [pr-4500.md](pr-4500.md) |
| [#4504](https://github.com/QwenLM/qwen-code/pull/4504) | ✅ merged | feat(serve): add POST /session/:id/recap | [pr-4504.md](pr-4504.md) |
| [#4505](https://github.com/QwenLM/qwen-code/pull/4505) | 🟡 open | fix(core): emit enable_thinking on DashScope when reasoning is disabled | [pr-4505.md](pr-4505.md) |
| [#4507](https://github.com/QwenLM/qwen-code/pull/4507) | ✅ merged | feat(daemon): server-pushed followup_suggestion event for the webui | [pr-4507.md](pr-4507.md) |
| [#4515](https://github.com/QwenLM/qwen-code/pull/4515) | ⬜ closed | feat(serve+sdk): add GET /session/:id/stats + /export (#4514 T2.5+T2.6) | [pr-4515.md](pr-4515.md) |
| [#4516](https://github.com/QwenLM/qwen-code/pull/4516) | ⬜ closed | feat(serve): POST /session/:id/compress + POST /session/:id/_meta (T1.3 + T1.4 from #4514) | [pr-4516.md](pr-4516.md) |
| [#4527](https://github.com/QwenLM/qwen-code/pull/4527) | ✅ merged | feat(serve): --allow-origin <pattern> CORS allowlist (T2.4 #4514) | [pr-4527.md](pr-4527.md) |
| [#4530](https://github.com/QwenLM/qwen-code/pull/4530) | ✅ merged | feat(serve): prompt absolute deadline + SSE writer idle timeout (#4514 T2.9) | [pr-4530.md](pr-4530.md) |
| [#4552](https://github.com/QwenLM/qwen-code/pull/4552) | ✅ merged | feat(serve): runtime MCP server add/remove (T2.8 #4514) | [pr-4552.md](pr-4552.md) |
| [#4556](https://github.com/QwenLM/qwen-code/pull/4556) | ✅ merged | feat(telemetry): trace daemon prompt lifecycle | [pr-4556.md](pr-4556.md) |
| [#4559](https://github.com/QwenLM/qwen-code/pull/4559) | ✅ merged | feat(serve): add daemon file logger (#4548) | [pr-4559.md](pr-4559.md) |
| [#4563](https://github.com/QwenLM/qwen-code/pull/4563) | 🟡 open | refactor(serve): extract DaemonWorkspaceService from AcpSessionBridge (issue #4542, 方案 C) | [pr-4563.md](pr-4563.md) |
| [#4576](https://github.com/QwenLM/qwen-code/pull/4576) | ✅ merged | feat(daemon): server-side shell command execution for ! (bang) prefix | [pr-4576.md](pr-4576.md) |
| [#4578](https://github.com/QwenLM/qwen-code/pull/4578) | ✅ merged | feat(daemon): add session tasks snapshot endpoint | [pr-4578.md](pr-4578.md) |
| [#4580](https://github.com/QwenLM/qwen-code/pull/4580) | ✅ merged | fix(rewind): false "compressed turn" error when mid-turn messages exist | [pr-4580.md](pr-4580.md) |
| [#4606](https://github.com/QwenLM/qwen-code/pull/4606) | ✅ merged | feat(daemon): add request-level logging for serve routes | [pr-4606.md](pr-4606.md) |
| [#4608](https://github.com/QwenLM/qwen-code/pull/4608) | ⬜ closed | feat(telemetry): add tool spans and session.id to daemon/ACP path | [pr-4608.md](pr-4608.md) |
| [#4610](https://github.com/QwenLM/qwen-code/pull/4610) | 🟡 open | feat(daemon): add POST /session/:id/btw endpoint for side questions | [pr-4610.md](pr-4610.md) |
| [#4628](https://github.com/QwenLM/qwen-code/pull/4628) | 🟡 open | feat(telemetry): add client_id attribute and permission route spans | [pr-4628.md](pr-4628.md) |
| [#4630](https://github.com/QwenLM/qwen-code/pull/4630) | 🟡 open | feat(telemetry): add tool spans and session.id to daemon/ACP path | [pr-4630.md](pr-4630.md) |

## 补录文档

以下 PR 不在本周 README 的主明细表中，但已有深读最终实现文档，按合入/补录语境保留在本周目录。

| PR | 标题 | 文档 |
|---|---|---|
| [#4646](https://github.com/QwenLM/qwen-code/pull/4646) | feat(daemon): clamp oversized inline media on the prompt path | [pr-4646.md](pr-4646.md) |
