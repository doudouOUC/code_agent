# 2026-07-13_2026-07-19 PR 最终实现文档索引

仅保留 @doudouOUC 个人 PR 的最终实现文档。open PR 只记录当前 diff 方案，不能视为 `main` 已落地能力。

| PR | 状态 | 标题 | 文档 |
|---|---|---|---|
| [#6798](https://github.com/QwenLM/qwen-code/pull/6798) | ✅ merged | fix(serve): route session actions to the owning workspace | [pr-6798.md](pr-6798.md) |
| [#6825](https://github.com/QwenLM/qwen-code/pull/6825) | ✅ merged | feat(serve): add extension management v2 | [pr-6825.md](pr-6825.md) |
| [#6826](https://github.com/QwenLM/qwen-code/pull/6826) | ✅ merged | feat(serve): support multi-workspace rewind and shell | [pr-6826.md](pr-6826.md) |
| [#6833](https://github.com/QwenLM/qwen-code/pull/6833) | ✅ merged | fix(serve): Route session continue, language, and artifacts by owner | [pr-6833.md](pr-6833.md) |
| [#6839](https://github.com/QwenLM/qwen-code/pull/6839) | ✅ merged | feat(serve): Add workspace-qualified Voice | [pr-6839.md](pr-6839.md) |
| [#6844](https://github.com/QwenLM/qwen-code/pull/6844) | ✅ merged | feat(serve): Add workspace-qualified session export | [pr-6844.md](pr-6844.md) |
| [#6846](https://github.com/QwenLM/qwen-code/pull/6846) | ✅ merged | feat(core): add PDF vision bridge fallback | [pr-6846.md](pr-6846.md) |
| [#6864](https://github.com/QwenLM/qwen-code/pull/6864) | ✅ merged | fix(core): Classify shell timeouts as tool errors | [pr-6864.md](pr-6864.md) |
| [#6876](https://github.com/QwenLM/qwen-code/pull/6876) | ✅ merged | feat(core): emit liveness heartbeats for silent foreground shell commands | [pr-6876.md](pr-6876.md) |
| [#6907](https://github.com/QwenLM/qwen-code/pull/6907) | ✅ merged | feat(daemon): Trace cold first-session startup | [pr-6907.md](pr-6907.md) |
| [#6910](https://github.com/QwenLM/qwen-code/pull/6910) | ✅ merged | feat(web-shell): add archived session export | [pr-6910.md](pr-6910.md) |
| [#6911](https://github.com/QwenLM/qwen-code/pull/6911) | ✅ merged | feat(cli): Add archived session export | [pr-6911.md](pr-6911.md) |
| [#6912](https://github.com/QwenLM/qwen-code/pull/6912) | ✅ merged | fix(web-shell): Harden non-primary session archive actions | [pr-6912.md](pr-6912.md) |
| [#6945](https://github.com/QwenLM/qwen-code/pull/6945) | ✅ merged | feat(cli): add daemon Todo stop guard | [pr-6945.md](pr-6945.md) |
| [#6950](https://github.com/QwenLM/qwen-code/pull/6950) | ✅ merged | fix(cli): Preserve channel startup failure details | [pr-6950.md](pr-6950.md) |
| [#6961](https://github.com/QwenLM/qwen-code/pull/6961) | ✅ merged | feat(daemon): Aggregate deep health across workspaces | [pr-6961.md](pr-6961.md) |
| [#6967](https://github.com/QwenLM/qwen-code/pull/6967) | ✅ merged | fix(core): Require explicit approval to exit Plan mode | [pr-6967.md](pr-6967.md) |
| [#6969](https://github.com/QwenLM/qwen-code/pull/6969) | ✅ merged | feat(cli): Add bounded daemon log rotation | [pr-6969.md](pr-6969.md) |
| [#7003](https://github.com/QwenLM/qwen-code/pull/7003) | ✅ merged | feat(serve): Complete legacy session workspace telemetry | [pr-7003.md](pr-7003.md) |
| [#7005](https://github.com/QwenLM/qwen-code/pull/7005) | ✅ merged | fix(serve): Harden multi-workspace ownership guards | [pr-7005.md](pr-7005.md) |
| [#7019](https://github.com/QwenLM/qwen-code/pull/7019) | ✅ merged | docs(serve): Close multi-workspace hardening gaps | [pr-7019.md](pr-7019.md) |
| [#7053](https://github.com/QwenLM/qwen-code/pull/7053) | ✅ merged | refactor(core): Classify shell safety as read-only, write, or unknown | [pr-7053.md](pr-7053.md) |
| [#7145](https://github.com/QwenLM/qwen-code/pull/7145) | ✅ merged | feat(daemon): Profile ACP channel initialization | [pr-7145.md](pr-7145.md) |
| [#7166](https://github.com/QwenLM/qwen-code/pull/7166) | ❌ closed | fix(core): Enforce single-writer session persistence | [pr-7166.md](pr-7166.md) |
| [#7172](https://github.com/QwenLM/qwen-code/pull/7172) | ✅ merged | feat(core): Route Plan-mode shell commands by safety | [pr-7172.md](pr-7172.md) |
| [#7182](https://github.com/QwenLM/qwen-code/pull/7182) | ✅ merged | perf(cli): Defer TUI runtime from ACP startup | [pr-7182.md](pr-7182.md) |
| [#7185](https://github.com/QwenLM/qwen-code/pull/7185) | ✅ merged | feat(core): inspect persisted conversation branches | [pr-7185.md](pr-7185.md) |
| [#7200](https://github.com/QwenLM/qwen-code/pull/7200) | ✅ merged | feat(daemon): Advertise ACP preheat readiness | [pr-7200.md](pr-7200.md) |
| [#7237](https://github.com/QwenLM/qwen-code/pull/7237) | 🟡 open | fix(core): Fence concurrent ACP session writers | [pr-7237.md](pr-7237.md) |

_按个人 PR 口径更新于 2026-07-19_
