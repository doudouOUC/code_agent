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

---

## PR 解决问题与实现方式

> 来源：同目录 `review.md` 的逐 PR diff 审查，结合 PR 状态与标题压缩成“解决了什么问题 / 怎么做的”。open/closed PR 只记录当前观察，不写成已落地实现。

| PR | 解决了什么问题 | 怎么做的 |
|---|---|---|
| [#3212](https://github.com/QwenLM/qwen-code/pull/3212) | 最小精准的 gemini baseUrl 修复 | 在 `createGeminiContentGenerator` 按描述把 `config.baseUrl` 注入 `httpOptions`，仅在配置时添加，headers 不变。 `config.baseUrl ? {headers,baseUrl} : {headers}` 干净，避免写 `undefined`；两路径均有回归测试。 |
| [#3232](https://github.com/QwenLM/qwen-code/pull/3232) | 启动 profiler；仅 SANDBOX 下启用，默认场景无输出 | profiler + 7 个 checkpoint + 写 `~/.qwen/startup-perf/` JSON，与描述吻合。(1) `initStartupProfiler` 仅在 `SANDBOX` 存在时启用（并由测试固化）；sandbox 关闭（常见默认）时设 `QWEN_CODE_PROFILE_STARTUP=1` 不产出报告，削弱"度量生产启动"目标。 |
| [#3297](https://github.com/QwenLM/qwen-code/pull/3297) | 并发去重逻辑扎实；但"懒加载"无启动收益、bug 叙述夸大 | 确实新增 lazy factory + inflight 去重，但 `Config.initialize()` 调用 `warmAll({strict:true})`（config.ts:1561）在启动期一次性加载全部工具，故 #3221 核心验收（"首次使用才实例化""init 降 30%+"）未达成（PR 已坦诚说明）。 |
| [#3318](https://github.com/QwenLM/qwen-code/pull/3318) | API 预连接稳健；"代理即跳过"为过时说法 | fire-and-forget HEAD 预连接 + 共享 undici dispatcher + 多项跳过条件，与描述一致。`isDefaultBaseUrl` 用 `startsWith(default+'/')` 正确拒绝子域伪造；`preconnectFired` 守卫 + 无目标时允许重试；`AbortSignal.timeout(5s)` 限定生命周期。 |
| [#3319](https://github.com/QwenLM/qwen-code/pull/3319) | early input capture 严谨，测试充分 | `earlyInputCapture.ts` 实现捕获/过滤/replay/64KB 上限/`QWEN_CODE_DISABLE_EARLY_CAPTURE`，并在 `KeypressContext` 用 `setImmediate` 重放，与描述完全一致。 （轻微）— `classifyEscapeSequence` 把 CPR(`ESC[...R`) 漏判为 user input，但启动期 qwen 不请求 CPR，风险低。18 项测试覆盖拆包/UTF-8/边界。 |
| [#3404](https://github.com/QwenLM/qwen-code/pull/3404) | /doctor 实用；漏 issue 要求的检查 + Node 阈值 bug（现已修） | 正文所列 System/Auth/Config/MCP/Tools/Git 检查均落地；但 issue 要求的 shell/permissions/proxy 检查均未实现。 `doctorChecks.ts:checkNodeVersion` 原始 diff 用 `MIN_NODE_MAJOR=20`，与 package.json(>=22) 不符，会把 Node20/21 误报 pass，当前 main 已修正为 22。其余（并行检查、非交互 MCP 不误报）合理。 |
| [#3407](https://github.com/QwenLM/qwen-code/pull/3407) | 干净的数字键自动提交；issue 绑定稍松 | 抽出 `selectAndAdvance` 复用 4 处；单选预定义项数字键即提交，multi-select/"Other"/Submit tab 仅高亮。 数字键分支守卫 `!isMultiSelect && !isSubmitTab && targetIndex<options.length` 正确；删除冗余 `if(!isFocused)` 由 `useKeypress` 的 `isActive` 覆盖，安全。 |
| [#3441](https://github.com/QwenLM/qwen-code/pull/3441) | 旗舰 rewind 功能，核心健壮；守卫不一致+文档小瑕 | double-ESC(空输入+idle) 与 `/rewind`(altNames `rollback`) 均开 `RewindSelector`；同步截断 UI+API history、预填原 prompt、Footer 提示、chatRecording `parentUuid` 分支，全部对应。（轻微）— 守卫(`h.type==='user'`) 与列表(`isRealUserTurn` 过滤斜杠命令) 定义不一致，仅致无害空态； |
