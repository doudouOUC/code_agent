# 2026-08-03_2026-08-09 PR 最终实现文档索引

仅保留 @doudouOUC 个人 PR 的实现文档。open PR 只记录当前 diff 方案，不能视为 `main` 已落地能力。

| PR | 状态 | 标题 | 文档 |
|---|---|---|---|
| [#8387](https://github.com/QwenLM/qwen-code/pull/8387) | ✅ merged | fix(core): Avoid replaying unsafe MCP tool calls | [pr-8387.md](pr-8387.md) |
| [#8414](https://github.com/QwenLM/qwen-code/pull/8414) | 🟡 open | fix(webui): recover complete turns after live journal truncation | [pr-8414.md](pr-8414.md) |
| [#8415](https://github.com/QwenLM/qwen-code/pull/8415) | 🟡 open | fix(serve): Coordinate caller-supplied session IDs | [pr-8415.md](pr-8415.md) |
| [#8423](https://github.com/QwenLM/qwen-code/pull/8423) | 🟡 open | feat(serve): observe daemon memory pressure against a real denominator | [pr-8423.md](pr-8423.md) |
| [#8428](https://github.com/QwenLM/qwen-code/pull/8428) | ✅ merged | fix(core): Clarify write_file prior-read guidance | [pr-8428.md](pr-8428.md) |
| [#8450](https://github.com/QwenLM/qwen-code/pull/8450) | 🟡 open | fix(cli): Bound ACP textual tool-result payloads | [pr-8450.md](pr-8450.md) |
| [#8462](https://github.com/QwenLM/qwen-code/pull/8462) | ✅ merged | feat(serve): report aggregate ACP child RSS, not just the primary's | [pr-8462.md](pr-8462.md) |
| [#8464](https://github.com/QwenLM/qwen-code/pull/8464) | 🟡 open | perf(core): clear tool results to a low watermark to preserve prompt cache | [pr-8464.md](pr-8464.md) |
| [#8469](https://github.com/QwenLM/qwen-code/pull/8469) | 🟡 open draft | feat(acp): Protect against repeated tool execution failures | [pr-8469.md](pr-8469.md) |
| [#8507](https://github.com/QwenLM/qwen-code/pull/8507) | 🟡 open draft | feat(external-context): Add optional Mem0 memory writes | [pr-8507.md](pr-8507.md) |
| [#8508](https://github.com/QwenLM/qwen-code/pull/8508) | ✅ merged | refactor(serve): model a per-child heap partition of the daemon budget | [pr-8508.md](pr-8508.md) |
| [#8572](https://github.com/QwenLM/qwen-code/pull/8572) | 🟡 open draft | feat(daemon): Add SSE stream and client observability | [pr-8572.md](pr-8572.md) |
| [#8588](https://github.com/QwenLM/qwen-code/pull/8588) | 🟡 open draft | feat(serve): Expose active work state | [pr-8588.md](pr-8588.md) |

_按个人 PR 口径更新于 2026-08-05_
