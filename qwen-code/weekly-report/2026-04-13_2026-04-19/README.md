# qwen-code PRs · 2026-04-13 ~ 2026-04-19  (W16)

**主题**: CLI 性能（preconnect/profiler/early-input）、/doctor、rewind 功能首发

**统计**: 8 PRs — 8 merged / 0 open / 0 closed  
**代码量**: +5,369 / -416，88 个文件变更  
**类型**: feat ×5, fix ×3  
**范围 (scope)**: cli ×6, core ×1, tool-registry ×1

**本周最大改动**:
- [#3441](https://github.com/QwenLM/qwen-code/pull/3441) (+1533/-6, 21 files) feat(cli): add conversation rewind feature with double-ESC and /rewind command
- [#3297](https://github.com/QwenLM/qwen-code/pull/3297) (+739/-330, 35 files) fix(tool-registry): add lazy factory registration with inflight concurrency dedup
- [#3404](https://github.com/QwenLM/qwen-code/pull/3404) (+1016/-1, 10 files) feat(cli): add /doctor diagnostic command

| PR | 状态 | 类型 | 标题 | 变更 | 文件 | 创建 | 合并/关闭 | 链接 |
|---|---|---|---|---|---|---|---|---|
| #3212 | ✅ merged | fix(core) | fix(core): respect custom Gemini baseUrl from modelProviders _[type/bug]_ | +57/-1 | 2 | 04-13 | 04-15 | https://github.com/QwenLM/qwen-code/pull/3212 |
| #3232 | ✅ merged | feat(cli) | feat(cli): add startup performance profiler _[roadmap/context-performance]_ | +383/-0 | 6 | 04-13 | 04-14 | https://github.com/QwenLM/qwen-code/pull/3232 |
| #3297 | ✅ merged | fix(tool-registry) | fix(tool-registry): add lazy factory registration with inflight concurrency dedup _[type/bug, type/feature-request]_ | +739/-330 | 35 | 04-15 | 04-18 | https://github.com/QwenLM/qwen-code/pull/3297 |
| #3318 | ✅ merged | feat(cli) | feat(cli): add API preconnect to reduce first-call latency _[type/feature-request]_ | +731/-13 | 8 | 04-16 | 04-26 | https://github.com/QwenLM/qwen-code/pull/3318 |
| #3319 | ✅ merged | feat(cli) | feat(cli): add early input capture to prevent keystroke loss during startup _[type/feature-request]_ | +775/-0 | 4 | 04-16 | 04-18 | https://github.com/QwenLM/qwen-code/pull/3319 |
| #3404 | ✅ merged | feat(cli) | feat(cli): add /doctor diagnostic command _[type/feature-request]_ | +1016/-1 | 10 | 04-17 | 04-19 | https://github.com/QwenLM/qwen-code/pull/3404 |
| #3407 | ✅ merged | fix(cli) | fix(cli): auto-submit on number key press in AskUserQuestionDialog _[type/bug]_ | +135/-65 | 2 | 04-17 | 04-18 | https://github.com/QwenLM/qwen-code/pull/3407 |
| #3441 | ✅ merged | feat(cli) | feat(cli): add conversation rewind feature with double-ESC and /rewind command | +1533/-6 | 21 | 04-19 | 04-25 | https://github.com/QwenLM/qwen-code/pull/3441 |
