# 系统提示词指引

## 当前状态

#12360 与 #12546 已分别合入第一轮、第二轮系统提示词精简；结构验证不等于真实模型行为等价证明。

## 当前方案观察

`packages/core/src/core/prompts.ts:getCoreSystemPrompt` 在主会话提示词中合并重复的验证/报告要求，压缩 direct 与 CodeModeOnly 工具、subagent、代码搜索和 Git 指引，同时保持工具过滤依赖的 gated line prefix、模式问询、Todo 与安全章节。最终 head `0f8b00373a60` 补充了 `prompts.test.ts` 中的验证/报告规则、段落间隔和 CodeModeOnly 规则断言，快照、`ArenaManager` 测试与 context-token-governance 尺寸验证记录同步调整；调用 API 与模型路由不变。

## 验证与限制

PR 的结构测试、快照和文本尺寸测量只能说明渲染和大致上下文成本，不能证明模型行为等价。合入后仍需同任务、同环境的真实模型 A/B；本文未本地复跑测试。代码路径：`packages/core/src/core/prompts.ts`、`packages/core/src/core/__snapshots__/prompts.test.ts.snap`。
