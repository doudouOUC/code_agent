# qwen-code PRs · 2026-05-25 ~ 2026-05-31  (W22)

**主题**: daemon 新端点（recap/btw/tasks/shell）、serve T2.x、daemon prompt 链路追踪、集成合并

**统计**: 22 PRs — 13 merged / 6 open / 3 closed  
**代码量**: +152,911 / -35,150，994 个文件变更  
**类型**: feat ×16, fix ×3, chore ×2, refactor ×1  
**范围 (scope)**: serve ×8, telemetry ×5, daemon ×5, integration ×2, core ×1, sdk ×1, rewind ×1

**本周最大改动**:
- [#4490](https://github.com/QwenLM/qwen-code/pull/4490) (+93283/-22535, 489 files) chore(integration): merge daemon_mode_b_main into main — F1/F2/F3/F4-prereq + F5 alpha docs batch (#4175)
- [#4608](https://github.com/QwenLM/qwen-code/pull/4608) (+32913/-8576, 232 files) feat(telemetry): add tool spans and session.id to daemon/ACP path
- [#4563](https://github.com/QwenLM/qwen-code/pull/4563) (+6622/-2236, 39 files) refactor(serve): extract DaemonWorkspaceService from AcpSessionBridge (issue #4542, 方案 C)

| PR | 状态 | 类型 | 标题 | 变更 | 文件 | 创建 | 合并/关闭 | 链接 |
|---|---|---|---|---|---|---|---|---|
| #4490 | 🟡 open | chore(integration) | chore(integration): merge daemon_mode_b_main into main — F1/F2/F3/F4-prereq + F5 alpha docs batch (#4175) | +93283/-22535 | 489 | 05-25 | — | https://github.com/QwenLM/qwen-code/pull/4490 |
| #4499 | ✅ merged | fix(telemetry) | fix(telemetry): attach interaction span to session root context _[type/bug]_ | +59/-6 | 2 | 05-25 | 05-27 | https://github.com/QwenLM/qwen-code/pull/4499 |
| #4500 | ✅ merged | chore(integration) | chore(integration): sync main into daemon_mode_b_main (2026-05-25) | +501/-0 | 7 | 05-25 | 05-25 | https://github.com/QwenLM/qwen-code/pull/4500 |
| #4504 | ✅ merged | feat(serve) | feat(serve): add POST /session/:id/recap | +621/-11 | 19 | 05-25 | 05-26 | https://github.com/QwenLM/qwen-code/pull/4504 |
| #4505 | 🟡 open | fix(core) | fix(core): emit enable_thinking on DashScope when reasoning is disabled _[type/bug]_ | +331/-5 | 2 | 05-25 | — | https://github.com/QwenLM/qwen-code/pull/4505 |
| #4507 | ✅ merged | feat(daemon) | feat(daemon): server-pushed followup_suggestion event for the webui | +1154/-22 | 18 | 05-25 | 05-27 | https://github.com/QwenLM/qwen-code/pull/4507 |
| #4515 | ⬜ closed | feat(serve+sdk) | feat(serve+sdk): add GET /session/:id/stats + /export (#4514 T2.5+T2.6) | +1741/-0 | 18 | 05-25 | 05-26 | https://github.com/QwenLM/qwen-code/pull/4515 |
| #4516 | ⬜ closed | feat(serve) | feat(serve): POST /session/:id/compress + POST /session/:id/_meta (T1.3 + T1.4 from #4514) | +2860/-6 | 22 | 05-25 | 05-26 | https://github.com/QwenLM/qwen-code/pull/4516 |
| #4527 | ✅ merged | feat(serve) | feat(serve): --allow-origin <pattern> CORS allowlist (T2.4 #4514) | +860/-23 | 10 | 05-26 | 05-26 | https://github.com/QwenLM/qwen-code/pull/4527 |
| #4530 | ✅ merged | feat(serve) | feat(serve): prompt absolute deadline + SSE writer idle timeout (#4514 T2.9) | +1458/-151 | 12 | 05-26 | 05-26 | https://github.com/QwenLM/qwen-code/pull/4530 |
| #4552 | ✅ merged | feat(serve) | feat(serve): runtime MCP server add/remove (T2.8 #4514) | +2969/-31 | 23 | 05-26 | 05-30 | https://github.com/QwenLM/qwen-code/pull/4552 |
| #4556 | ✅ merged | feat(telemetry) | feat(telemetry): trace daemon prompt lifecycle | +1325/-424 | 14 | 05-26 | 05-29 | https://github.com/QwenLM/qwen-code/pull/4556 |
| #4559 | ✅ merged | feat(serve) | feat(serve): add daemon file logger (#4548) _[DDAR]_ | +3028/-217 | 14 | 05-26 | 05-27 | https://github.com/QwenLM/qwen-code/pull/4559 |
| #4563 | 🟡 open | refactor(serve) | refactor(serve): extract DaemonWorkspaceService from AcpSessionBridge (issue #4542, 方案 C) | +6622/-2236 | 39 | 05-27 | — | https://github.com/QwenLM/qwen-code/pull/4563 |
| #4576 | ✅ merged | feat(daemon) | feat(daemon): server-side shell command execution for ! (bang) prefix | +356/-10 | 16 | 05-27 | 05-28 | https://github.com/QwenLM/qwen-code/pull/4576 |
| #4578 | ✅ merged | feat(daemon) | feat(daemon): add session tasks snapshot endpoint | +934/-4 | 26 | 05-27 | 05-28 | https://github.com/QwenLM/qwen-code/pull/4578 |
| #4580 | ✅ merged | fix(rewind) | fix(rewind): false "compressed turn" error when mid-turn messages exist | +51/-7 | 6 | 05-28 | 05-29 | https://github.com/QwenLM/qwen-code/pull/4580 |
| #4606 | ✅ merged | feat(daemon) | feat(daemon): add request-level logging for serve routes | +178/-6 | 4 | 05-28 | 05-29 | https://github.com/QwenLM/qwen-code/pull/4606 |
| #4608 | ⬜ closed | feat(telemetry) | feat(telemetry): add tool spans and session.id to daemon/ACP path | +32913/-8576 | 232 | 05-28 | 05-29 | https://github.com/QwenLM/qwen-code/pull/4608 |
| #4610 | 🟡 open | feat(daemon) | feat(daemon): add POST /session/:id/btw endpoint for side questions | +385/-128 | 11 | 05-28 | — | https://github.com/QwenLM/qwen-code/pull/4610 |
| #4628 | 🟡 open | feat(telemetry) | feat(telemetry): add client_id attribute and permission route spans | +167/-10 | 6 | 05-29 | — | https://github.com/QwenLM/qwen-code/pull/4628 |
| #4630 | 🟡 open | feat(telemetry) | feat(telemetry): add tool spans and session.id to daemon/ACP path | +1115/-742 | 4 | 05-29 | — | https://github.com/QwenLM/qwen-code/pull/4630 |
