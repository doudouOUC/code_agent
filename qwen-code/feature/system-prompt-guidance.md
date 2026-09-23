# 系统提示词指引

## 当前状态

#12360 已合入第一轮系统提示词精简。#12546 仍为 open diff：第二轮去重不能写为 `main` 行为承诺。

## 当前方案观察

`packages/core/src/core/prompts.ts:getCoreSystemPrompt` 在主会话提示词中合并重复的验证/报告要求，压缩 direct 与 CodeModeOnly 工具、subagent、代码搜索和 Git 指引，同时保持工具过滤依赖的 gated line prefix、模式问询、Todo 与安全章节。快照及 `ArenaManager` 测试随文字调整；调用 API 与模型路由不变。

## 验证与限制

PR 的结构测试、快照和文本尺寸测量只能说明渲染和大致上下文成本，不能证明模型行为等价。合入前仍需同任务、同环境的真实模型 A/B；本文未本地复跑测试。代码路径：`packages/core/src/core/prompts.ts`、`packages/core/src/core/__snapshots__/prompts.test.ts.snap`。
