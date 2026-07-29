# 2026-07-27_2026-08-02 PR 最终实现文档索引

仅保留 @doudouOUC 个人 PR 的实现文档。open PR 只记录当前 diff 方案，不能视为 `main` 已落地能力。

| PR | 状态 | 标题 | 文档 |
|---|---|---|---|
| [#7761](https://github.com/QwenLM/qwen-code/pull/7761) | ✅ merged | test(serve): Add first-output latency benchmark | [pr-7761.md](pr-7761.md) |
| [#7762](https://github.com/QwenLM/qwen-code/pull/7762) | ✅ merged | feat(hooks): Add submitted prompt provenance | [pr-7762.md](pr-7762.md) |
| [#7767](https://github.com/QwenLM/qwen-code/pull/7767) | ✅ merged | perf(acp): Preload providers after session creation | [pr-7767.md](pr-7767.md) |
| [#7812](https://github.com/QwenLM/qwen-code/pull/7812) | ✅ merged | fix(serve): Release managed session writer locks on shutdown | [pr-7812.md](pr-7812.md) |
| [#7820](https://github.com/QwenLM/qwen-code/pull/7820) | ✅ merged | fix(test): Restore first-output benchmark measurement validity and correct its artifact schema | [pr-7820.md](pr-7820.md) |
| [#7821](https://github.com/QwenLM/qwen-code/pull/7821) | ✅ merged | fix(daemon): harden Todo Stop Guard continuations | [pr-7821.md](pr-7821.md) |
| [#7825](https://github.com/QwenLM/qwen-code/pull/7825) | ✅ merged | fix(test): Correct first-output benchmark artifact schema and simplify | [pr-7825.md](pr-7825.md) |
| [#7877](https://github.com/QwenLM/qwen-code/pull/7877) | ✅ merged | feat(external-context): Add submitted-prompt auto recall | [pr-7877.md](pr-7877.md) |
| [#7886](https://github.com/QwenLM/qwen-code/pull/7886) | 🟡 open | fix(core): Tolerate transcript timestamp drift | [pr-7886.md](pr-7886.md) |
| [#7894](https://github.com/QwenLM/qwen-code/pull/7894) | ✅ merged | feat: Gate session writer lease behind opt-in | [pr-7894.md](pr-7894.md) |
| [#7921](https://github.com/QwenLM/qwen-code/pull/7921) | ✅ merged | feat(core): Add ARMS session user ID | [pr-7921.md](pr-7921.md) |
| [#7947](https://github.com/QwenLM/qwen-code/pull/7947) | ✅ merged | fix(serve): allow bounded reads of large text files | [pr-7947.md](pr-7947.md) |
| [#7967](https://github.com/QwenLM/qwen-code/pull/7967) | 🟡 open | refactor(core): thread the descriptor instead of forking text-read helpers | [pr-7967.md](pr-7967.md) |
| [#7975](https://github.com/QwenLM/qwen-code/pull/7975) | 🟡 open | fix(serve): Isolate daemon session maintenance writers | [pr-7975.md](pr-7975.md) |
| [#7976](https://github.com/QwenLM/qwen-code/pull/7976) | 🟡 open | fix(serve): Add certified session writer handoff | [pr-7976.md](pr-7976.md) |
| [#7994](https://github.com/QwenLM/qwen-code/pull/7994) | 🟡 open | test(integration): Measure immediate prompt dispatch stages | [pr-7994.md](pr-7994.md) |
| [#8002](https://github.com/QwenLM/qwen-code/pull/8002) | 🟡 open | feat(serve): page large text files by byte cursor | [pr-8002.md](pr-8002.md) |

_按个人 PR 口径更新于 2026-07-29_
