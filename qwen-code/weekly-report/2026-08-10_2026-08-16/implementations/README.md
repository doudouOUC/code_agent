# 2026-08-10_2026-08-16 PR 最终实现文档索引

仅保留 @doudouOUC 个人 PR 的实现文档。open/closed PR 只记录当前或最终观察，不能视为 `main` 已落地能力。

| PR | 状态 | 标题 | 文档 |
|---|---|---|---|
| [#8824](https://github.com/QwenLM/qwen-code/pull/8824) | ❌ closed draft | fix(webui): Preserve active sessions during restore | [pr-8824.md](pr-8824.md) |
| [#8833](https://github.com/QwenLM/qwen-code/pull/8833) | ✅ merged | fix(webui): Fence stale session work by attachment identity | [pr-8833.md](pr-8833.md) |
| [#8852](https://github.com/QwenLM/qwen-code/pull/8852) | ✅ merged | fix(serve): Allow approved external built-in text writes | [pr-8852.md](pr-8852.md) |
| [#8862](https://github.com/QwenLM/qwen-code/pull/8862) | ✅ merged | feat(cli): add background cleanup for OpenAI API logs | [pr-8862.md](pr-8862.md) |
| [#8882](https://github.com/QwenLM/qwen-code/pull/8882) | ✅ merged | fix(webui): Make cross-session switching transactional | [pr-8882.md](pr-8882.md) |
| [#8890](https://github.com/QwenLM/qwen-code/pull/8890) | ✅ merged | refactor(cli): Generalize the Conversations runtime foundation | [pr-8890.md](pr-8890.md) |
| [#8891](https://github.com/QwenLM/qwen-code/pull/8891) | ✅ merged | feat(web-shell): Share session catalog scheduling | [pr-8891.md](pr-8891.md) |
| [#8892](https://github.com/QwenLM/qwen-code/pull/8892) | ✅ merged | perf(cli): Cache persisted session catalogs | [pr-8892.md](pr-8892.md) |
| [#8893](https://github.com/QwenLM/qwen-code/pull/8893) | ✅ merged | feat(cli): clean up OpenAI logs in non-interactive sessions | [pr-8893.md](pr-8893.md) |
| [#8911](https://github.com/QwenLM/qwen-code/pull/8911) | ✅ merged | feat(serve): bound daemon ACP NDJSON buffers | [pr-8911.md](pr-8911.md) |
| [#8931](https://github.com/QwenLM/qwen-code/pull/8931) | ✅ merged | fix(web-shell): Enforce prompt-safe session navigation | [pr-8931.md](pr-8931.md) |
| [#8932](https://github.com/QwenLM/qwen-code/pull/8932) | ✅ merged | chore(serve): Log session continuation admissions | [pr-8932.md](pr-8932.md) |
| [#8933](https://github.com/QwenLM/qwen-code/pull/8933) | ✅ merged | fix(serve): Keep restore request shapes distinct | [pr-8933.md](pr-8933.md) |
| [#8939](https://github.com/QwenLM/qwen-code/pull/8939) | ✅ merged | fix(webui): Make same-session refresh transactional | [pr-8939.md](pr-8939.md) |
| [#8947](https://github.com/QwenLM/qwen-code/pull/8947) | ✅ merged | fix(serve): Close daemon ACP resource guard gaps | [pr-8947.md](pr-8947.md) |
| [#8954](https://github.com/QwenLM/qwen-code/pull/8954) | ✅ merged | feat(serve): Propagate session list cancellation | [pr-8954.md](pr-8954.md) |
| [#8955](https://github.com/QwenLM/qwen-code/pull/8955) | ✅ merged | fix(web-shell): Harden prompt admission ownership | [pr-8955.md](pr-8955.md) |
| [#8990](https://github.com/QwenLM/qwen-code/pull/8990) | ✅ merged | fix(webui): Close same-session refresh race gaps | [pr-8990.md](pr-8990.md) |
| [#9007](https://github.com/QwenLM/qwen-code/pull/9007) | ✅ merged | fix(serve): Bound ACP HTTP pre-attach buffers by bytes | [pr-9007.md](pr-9007.md) |
| [#9012](https://github.com/QwenLM/qwen-code/pull/9012) | ✅ merged | fix(cli): Bound headless tool result content | [pr-9012.md](pr-9012.md) |
| [#9039](https://github.com/QwenLM/qwen-code/pull/9039) | ✅ merged | feat(core): Add privacy-safe tool-result boundary diagnostics | [pr-9039.md](pr-9039.md) |
| [#9042](https://github.com/QwenLM/qwen-code/pull/9042) | ✅ merged | feat(daemon): Track background shells in activeWork | [pr-9042.md](pr-9042.md) |
| [#9048](https://github.com/QwenLM/qwen-code/pull/9048) | ❌ closed | fix(webui): Make resync and repair transactional | [pr-9048.md](pr-9048.md) |
| [#9055](https://github.com/QwenLM/qwen-code/pull/9055) | ✅ merged | perf(serve): Restore large sessions selectively | [pr-9055.md](pr-9055.md) |
| [#9068](https://github.com/QwenLM/qwen-code/pull/9068) | ✅ merged | feat(external-context): Add provider extension profile | [pr-9068.md](pr-9068.md) |
| [#9077](https://github.com/QwenLM/qwen-code/pull/9077) | ✅ merged | fix(core): Preserve OTel session ownership in daemons | [pr-9077.md](pr-9077.md) |
| [#9084](https://github.com/QwenLM/qwen-code/pull/9084) | ✅ merged | feat(cli): Correlate daemon logs with OpenTelemetry spans | [pr-9084.md](pr-9084.md) |
| [#9107](https://github.com/QwenLM/qwen-code/pull/9107) | ✅ merged | feat(telemetry): Trace main agent invocations | [pr-9107.md](pr-9107.md) |
| [#9121](https://github.com/QwenLM/qwen-code/pull/9121) | ✅ merged | fix(telemetry): Address main agent tracing edge cases | [pr-9121.md](pr-9121.md) |
| [#9134](https://github.com/QwenLM/qwen-code/pull/9134) | ✅ merged | fix(daemon): Preserve sessions when active-work close is refused | [pr-9134.md](pr-9134.md) |
| [#9180](https://github.com/QwenLM/qwen-code/pull/9180) | ✅ merged | feat(web-shell): support text file attachments in the composer | [pr-9180.md](pr-9180.md) |
| [#9181](https://github.com/QwenLM/qwen-code/pull/9181) | ✅ merged | feat(daemon): Isolate the Conversations runtime boundary | [pr-9181.md](pr-9181.md) |
| [#9261](https://github.com/QwenLM/qwen-code/pull/9261) | ✅ merged | feat(serve): Add workspace session live-state endpoint and catalog version | [pr-9261.md](pr-9261.md) |

_按个人 PR 口径更新于 2026-08-20_
