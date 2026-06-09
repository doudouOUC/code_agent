# Plan: Issue #4315 OOM 分析与对外回复

## Context

用户要求分析 [issue #4315](https://github.com/QwenLM/qwen-code/issues/4315)（"cli crashed when i was just typing"），定位 OOM 原因，并整合到现有的 OOM 系列调研中。

本会话此前已对 #4116、#4167、#2868、#2945 做过完整分析，并发布了对外评论与维护了一份调研文档（`docs/plans/2026-05-14-oom-investigation.md` / 远程 `docs/investigation-oom-series.md`）。本次工作是把 #4315 接入既有体系。

预期结果：在 issue 上发布定位评论 + 把 #4315 章节追加到调研文档 + 同步到 code_agent 仓库。

## 关键发现

### Issue #4315 报告概要

| 项 | 值 |
|---|---|
| Qwen Code | 0.15.11 (782403d71) |
| Node.js | v22.12.0 |
| OS | macOS arm64 (25.4.0) |
| 认证 | Coding Plan (Aliyun DashScope) |
| 模型 | glm-5（200K 上下文） |
| 堆峰值 | ~2027 MB（默认 2GB 堆限） |
| **运行时长** | **70,561,968 ms ≈ 19.6 小时** |
| 触发动作 | 任务完成后 **用户在输入框打字** 时崩溃 |
| /about 时 RSS | 127.5 MB |

### 栈帧关键分析（最具诊断价值）

```
9-22:  ValueDeserializer::ReadDenseJSArray ↔ ReadObject  ← 深层嵌套数组对象递归
24:    v8::ValueDeserializer::ReadValue
25:    node::worker::Message::Deserialize           ← 走 worker_threads 消息通道反序列化
26:    node::worker::StructuredClone                ← Node 全局 structuredClone()
27:    Builtins_CallApiCallbackOptimizedNoProfiling
28:    0x10b59b3d8                                   ← JIT'd 用户代码调用 structuredClone
...
34:    v8_inspector::V8Console::runTask             ← V8 Inspector runTask（async 上下文跟踪）
36-92: 大量重复地址 0x10b6089e4 / 0x10b608710         ← 深递归 JIT JS 代码
100:   node::Environment::CheckImmediate            ← libuv check 阶段
101:   uv__run_check
102:   uv_run
```

### 三个新观察

1. **Frame 26 是 `node::worker::StructuredClone`**：Node.js 全局 `structuredClone()`（v17+），实现走 `worker_threads` 消息通道。这与 #4116 原报告（V8 内置 `ValueDeserializer`）路径一致，但是从 Node 表面 API 进入。

2. **Frame 100 `CheckImmediate`**：本次崩溃发生在 **libuv check 阶段**（`setImmediate` 回调执行），不是用户输入直接调用。说明：
   - 用户打字"触发"了一系列状态变更
   - 状态变更在某条 setImmediate 链上落地
   - 该链上某处 `structuredClone(history)` 把堆撑爆

3. **Frame 34 `V8Console::runTask`**：V8 Inspector 的 `console.runTask` 出现在栈中。这通常是异步上下文跟踪机制（如 OpenTelemetry async hooks 或 Node.js 内置 async stack traces）使用的。出现在普通堆栈说明运行期开启了 async stack traces 或 inspector，可能放大每次 task 的内存印记。

### 与既有场景对应

属于 **Scenario A（structuredClone 放大）** 的一个变种，新维度：

- **持续时间最长**：19.6 小时（之前最长是 #4116 Kieaer 的 7 小时）
- **触发器是输入而不是 idle / compress / resume**：键入触发某个 setImmediate 回调链，链中 `structuredClone(history)` 在 19+ 小时积累的历史上失败
- **glm-5 200K 上下文窗口**：与 #4167 同一模型族，但运行时长 6 倍于 #4167，证明压缩或微压缩没能在长期运行中保持稳态
- **"任务完成后"的关键性**：任务完成会触发 `recordAssistantTurn` / `checkNextSpeaker` / 自动压缩阈值检查 / IDE 上下文同步等多个 `getHistory()` 调用 → 多次 `structuredClone`

### 不需要新机制

#4315 的根因与 #4116 原报告一致（structuredClone 放大）。已识别的 P0 修复（`getHistoryReadonly` 引用语义、`peekLastHistoryEntry`、压缩流程消除双重 stringify、启动时自动设置堆限）全部适用，不需要新增 P 级修复项。

唯一新增的细节是：**输入处理路径上的 setImmediate 链需要审计**，确认是否有非必要的 `structuredClone` 触发。

## 执行步骤

### Step 1：在 issue #4315 上发布分析评论

通过 `gh issue comment 4315 --repo QwenLM/qwen-code --body "..."` 发布。

评论内容要点：
- 区分本次为 Scenario A 变种（输入触发）
- 解释 19.6 小时累积 + glm-5 200K 上下文 + 默认 2GB 堆限的组合
- 解释栈帧含义：libuv check 阶段 setImmediate 回调中的 structuredClone
- 推荐 workaround：`NODE_OPTIONS=--max-old-space-size=8192`
- 链接到既有的调研文档与相关 issue 评论
- 不重复贴已经在 #4116 评论中给过的完整修复方案

### Step 2：更新本地调研文档

编辑 `docs/plans/2026-05-14-oom-investigation.md`：

1. 在目录中加入 "Issue #4315" 链接
2. 在 #4167（@wwwi2vv-dev）章节后插入新章节 "Issue #4315 — 19 小时长会话 + 输入触发 OOM"
3. 在 "三类 OOM 场景汇总" 表格里更新 Scenario A 一行：把 #4315 加入代表 issue
4. 在 "已完成的对外动作" 表格追加 #4315 评论链接

新章节模板：
```
## Issue #4315 — 19 小时长会话 + 输入触发 OOM

### 报告概要 (表格)
### GC 日志特征 / 栈帧关键
### 根因分析（输入路径上的 setImmediate + structuredClone）
### 与其他 issue 的关系（Scenario A 变种）
### 已发布动作
```

### Step 3：同步到 code_agent 仓库

将更新后的文档复制到 `https://github.com/doudouOUC/code_agent` 的 `docs/investigation-oom-series.md`，commit 并 push。

commit message:
```
docs(oom): add issue #4315 — input-triggered structuredClone OOM after 19h session
```

## 关键文件

- `docs/plans/2026-05-14-oom-investigation.md` — 本地调研文档（追加 #4315 章节）
- 远程 `docs/investigation-oom-series.md`（在 doudouOUC/code_agent）

## 不需要修改的内容

- `packages/core/src/core/geminiChat.ts:1095`（getHistory 实现）等代码 —— 本次只做分析与文档，不改源码（修复路径已在既有的 P0/P1/P2 行动项中归档）

## 验证

- 通过 `gh issue view 4315 --repo QwenLM/qwen-code --json comments` 确认评论发布成功
- 通过 `git log --oneline -1` 在远程克隆中确认 commit 推送成功
- 打开 code_agent 仓库的 docs/investigation-oom-series.md 链接确认渲染正确

## Final Implementation Status

- **PR status**: N/A (this plan targeted issue comments and documentation, not a code PR)
- **Referenced issues**: #4116 (CLOSED), #4167 (CLOSED), #4315 (CLOSED) — all OOM crash reports
- **What was implemented**: Analysis comment posted on #4315, local investigation doc updated, findings synced to code_agent repo. The plan was a documentation/analysis task, fully executed as designed.
- **Key divergences**: None — plan was followed as written (comment + doc update + sync).
- **Files changed**: `docs/plans/2026-05-14-oom-investigation.md` (local), `docs/investigation-oom-series.md` (code_agent repo)
