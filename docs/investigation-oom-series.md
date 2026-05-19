# Qwen Code OOM 系列问题调研

**日期**: 2026-05-14 ~ 2026-05-15
**调研者**: doudouOUC
**仓库**: [QwenLM/qwen-code](https://github.com/QwenLM/qwen-code)
**版本**: 0.13.x ~ 0.15.11

## 目录

- [背景与方法](#背景与方法)
- [Issue #4116 — idle 状态长会话 OOM](#issue-4116--idle-状态长会话-oom)
- [Issue #4116（@Kieaer 跟进） — 45GB 堆持续泄漏](#issue-4116kieaer-跟进--45gb-堆持续泄漏)
- [Issue #2868 — 100 秒快速崩溃](#issue-2868--100-秒快速崩溃)
- [Issue #2945 — `/resume` 期间崩溃](#issue-2945--resume-期间崩溃)
- [Issue #4167 — `/compress` 触发的峰值 OOM](#issue-4167--compress-触发的峰值-oom)
- [Issue #4167（@wwwi2vv-dev 跟进） — 8GB 堆 + Object.defineProperty 栈帧](#issue-4167wwwi2vv-dev-跟进--8gb-堆--objectdefineproperty-栈帧)
- [Issue #4315 — 19 小时长会话 + 输入触发 OOM](#issue-4315--19-小时长会话--输入触发-oom)
- [Claude Code 对照设计](#claude-code-对照设计)
- [最终总结与行动项](#最终总结与行动项)
- [附录：相关链接](#附录相关链接)

---

## 背景与方法

近期 qwen-code 出现多起 `FATAL ERROR: Ineffective mark-compacts near heap limit` 崩溃报告，集中在 `scope/memory-usage` 标签下。本文档对每个 issue 单独建立独立的根因分析章节，并在末尾给出统一的总结与可执行的优化清单。

调研方法：
1. 阅读 issue 原始 GC 日志、native stack trace、`/about` 输出；
2. 在仓库中对核心数据流（`GeminiChat.history`、压缩、流式响应处理、JSONL 写入、UI 渲染）做静态溯源；
3. 与同类工具（Claude Code）的内存设计做对比，识别架构差异；
4. 在 GitHub issue 上发布定位报告与可复用 workaround。

每个 issue 的章节统一包含：**报告概要 → GC 日志特征 → 根因分析 → 与其他 issue 的关系 → 已发布动作**。

---

## Issue #4116 — idle 状态长会话 OOM

### 报告概要

| 项 | 值 |
|---|---|
| Issue | [#4116](https://github.com/QwenLM/qwen-code/issues/4116) |
| Qwen Code | 0.15.11 (782403d71) |
| Node.js | v24.15.0 |
| OS | Windows 10 (10.0.26200) x64 |
| 认证 | API Key (openai 模式) |
| Base URL | https://api.deepseek.com |
| 模型 | deepseek-v4-pro（**1M 上下文**） |
| 上下文使用 | 9.5% |
| 运行时长 | 50 min (3,024,101 ms) |
| 用户状态 | **idle**（停在输入提示符） |

### GC 日志特征

```
[7812:0x...]  3024101 ms: Scavenge (interleaved)
  2034.3 (2044.6) -> 2032.8 (2052.6) MB

[7812:0x...]  3024321 ms: Mark-Compact (reduce)
  2041.9 (2056.1) -> 2028.0 (2036.4) MB

FATAL ERROR: Ineffective mark-compacts near heap limit
```

栈帧关键：`v8::ValueDeserializer::ReadValue` —— V8 内部反序列化函数，由 `structuredClone()` 调用。

### 根因分析

**直接触发**：崩溃发生在 `structuredClone(this.history)` 调用时。堆已经接近 2GB 上限，再分配一份历史的克隆就溢出。

**会话数据三份在内存中的拷贝**：

| 副本 | 位置 |
|------|------|
| API 格式历史 | `GeminiChat.history` (`Content[]`) (`packages/core/src/core/geminiChat.ts:422`) |
| React UI 状态 | `useHistory()` (`HistoryItem[]`) (`packages/cli/src/ui/hooks/useHistoryManager.ts:34`) |
| Ink Static fiber 树 | `<Static>` 组件渲染保留 (`packages/cli/src/ui/components/MainContent.tsx:355-381`) |

Ink 的 `<Static>` 是**只追加**：渲染过的消息对应的 React fiber 节点永久保留。

**频繁的全量克隆**：

| 调用点 | 文件 | 行号 | 克隆次数 |
|--------|------|------|----------|
| `checkNextSpeaker` | `utils/nextSpeakerChecker.ts` | 55, 63 | **2 次全量** |
| `microcompactHistory` | `core/client.ts` | 1034 | 1 次 |
| `tryCompress` | `services/chatCompressionService.ts` | 227 | 1 次（curated） |
| `sessionTitle` | `services/sessionTitle.ts` | 116 | 1 次 |
| `sessionRecap` | `services/sessionRecap.ts` | 57 | 1 次 |
| `buildApiHistoryFromConversation` | `services/sessionService.ts` | 1219-1242 | N 次 |

**1M 上下文窗口的放大效应**：

- `tokenLimits.ts:129`: `[/^deepseek-v4/, LIMITS['1m']]`
- 压缩阈值 0.7 → 70 万 token 才触发
- 70 万 token 在嵌套 Content/Part 对象、JS 引擎开销、三份副本下放大 100-500 倍
- V8 堆 2GB 远早于 70 万 token 阈值就被填满

**Memory Monitor 阈值错位**：

- `useMemoryMonitor.ts:11`: `MEMORY_WARNING_THRESHOLD = 7 * 1024^3` (7GB RSS)
- 实际 V8 堆限只有 ~2GB，警告永远不触发

### 已发布动作

- [Workaround 评论](https://github.com/QwenLM/qwen-code/issues/4116#issuecomment-4447005872) — 提供 `NODE_OPTIONS=--max-old-space-size=8192`
- [完整技术分析评论](https://github.com/QwenLM/qwen-code/issues/4116#issuecomment-4448193086) — 含 P0/P1/P2 优化建议

---

## Issue #4116（@Kieaer 跟进） — 45GB 堆持续泄漏

### 报告概要

| 项 | 值 |
|---|---|
| 来源 | [#4116 评论](https://github.com/QwenLM/qwen-code/issues/4116#issuecomment-4455633231) |
| 报告人 | @Kieaer |
| 堆峰值 | **~45 GB** (44,962 MB) |
| 运行时长 | ~7.2 小时 (25,931,686 ms) |
| 增长速率 | ~100 MB/min |
| 平台 | Windows |

### GC 日志特征

```
25931686 ms: Mark-Compact (reduce)
  44962.1 (45042.3) -> 44867.0 (44940.9) MB
  2520.57 / 9.04 ms (+ 4892.3 ms in 980 steps)
```

栈帧出现 OpenSSL 相关符号（X509_STORE_set_cleanup, SSL_CTX_set_cookie_generate_cb），但符号偏移过大，仅作为最近导出符号锚点参考，不能直接当成调用真因。

### 根因分析

**关键反证**：堆给到 45GB 仍然崩溃 → **单纯 `structuredClone` 放大理论无法解释**。这是真实的内存增长，必须存在持续泄漏源。

**可疑代码路径**：

#### 1. 流式响应聚合数组未释放

```typescript
// packages/core/src/core/openaiContentGenerator/pipeline.ts:129
const collectedGeminiResponses: GenerateContentResponse[] = [];
for await (const chunk of stream) {
  // ...
  collectedGeminiResponses.push(response);  // 每个 chunk 都 push
}

// packages/core/src/core/loggingContentGenerator/loggingContentGenerator.ts:398
const responses: GenerateContentResponse[] = [];
for await (const response of stream) {
  if (shouldCollectResponses) {
    responses.push(response);
  }
}
```

- 流式响应的**每个 chunk** 都被收集
- 流异常退出未调用 `stream.return?.()` 时，底层 SSE/TLS 资源可能泄漏 → 解释栈帧中的 OpenSSL 符号

#### 2. ChatRecordingService writeChain 闭包堆积

```typescript
// packages/core/src/services/chatRecordingService.ts:480
private writeChain: Promise<void> = Promise.resolve();

private appendRecord(record: ChatRecord, ...) {
  this.writeChain = this.writeChain
    .catch(() => {})
    .then(() => jsonl.writeLine(conversationFile, record))  // 闭包捕获 record
    .catch(...);
}
```

- 磁盘慢（Windows Defender、网络盘）→ 闭包堆积 → record 强引用无法释放

#### 3. EventEmitter 订阅泄漏

- `packages/core/src/` 中 `.on(` 与 `removeListener` 比例为 **146:67**
- React 严格模式 + Ink 多次渲染可能放大订阅数

### 与 #4116 原报告的关系

**不是同一根因**。原报告是堆达到默认上限触发，本评论是应用层真实持续泄漏触发。两者并存。

### 已发布动作

- [追加评论](https://github.com/QwenLM/qwen-code/issues/4116#issuecomment-4456488521) 区分两类场景

---

## Issue #2868 — 100 秒快速崩溃

### 报告概要

| 项 | 值 |
|---|---|
| Issue | [#2868](https://github.com/QwenLM/qwen-code/issues/2868) |
| Qwen Code | 0.13.2 (1b1a029fd) |
| Node.js | v24.12.0 |
| OS | Linux x64 (debian13-amd64) |
| 认证 | Qwen OAuth |
| 模型 | coder-model |
| 堆峰值 | ~2 GB |
| 运行时长 | **101 秒** |
| 增长速率 | ~20 MB/秒 |
| 用户状态 | active，"RAM consumption keep rising" |

### 根因分析

**100 秒不可能积累长会话历史** → 必然是快速增长源。

用户原话："I have schrinked context several times already" — 已主动压缩但仍然崩溃，说明压缩并未充分释放，或者压缩本身贡献了内存压力（见 Issue #4167）。

**最可能的元凶**：流式响应 chunk 累积（`collectedGeminiResponses` / `responses[]`）。模型生成超长输出（如读取大文件并复述），单次请求内累积数 GB。

### 与其他 issue 的关系

与 @Kieaer 同属 **Scenario B（持续泄漏）**，但触发更快（active 状态 + 大流式响应）。

---

## Issue #2945 — `/resume` 期间崩溃

### 报告概要

| 项 | 值 |
|---|---|
| Issue | [#2945](https://github.com/QwenLM/qwen-code/issues/2945) |
| Qwen Code | 0.14.0 (de66ee198) |
| Node.js | v22.17.0 |
| OS | Windows 10 (10.0.26200) x64 |
| 认证 | Qwen OAuth |
| 模型 | coder-model |
| 堆峰值 | ~4 GB |
| 运行时长 | 220 秒 |
| 触发 | **`/resume` 命令** |

### GC 日志特征

栈帧含 `BIO_ssl_shutdown` 与 `SSL_get_quiet_shutdown` —— TLS 关闭路径。

### 根因分析

`/resume` 加载历史 JSONL 文件 + 重建 React/Ink 树 + 网络初始化 + 可能的会话回放，几个昂贵操作并行：

- `sessionService.reconstructHistory` 读取整个 JSONL 文件
- `replayUiTelemetryFromConversation` 重放所有事件
- 在重建过程中可能多次触发 `structuredClone`

如果会话本身已经较大（多日积累），单次 `/resume` 即可冲垮 4GB 堆。

### 与其他 issue 的关系

属于**会话恢复**这个特定路径下的内存峰值问题。与 #4167 的"操作峰值"类似，但触发点不同。

---

## Issue #4167 — `/compress` 触发的峰值 OOM

### 报告概要

| 项 | 值 |
|---|---|
| Issue | [#4167](https://github.com/QwenLM/qwen-code/issues/4167) |
| Qwen Code | 0.15.11 (782403d71) |
| Node.js | v22.12.0 |
| OS | macOS arm64 (25.4.0) |
| 认证 | Coding Plan (Aliyun DashScope) |
| Base URL | coding.dashscope.aliyuncs.com/v1 |
| 模型 | **glm-5**（**200K 上下文**，非 Qwen 模型） |
| 堆峰值 | ~2 GB |
| 运行时长 | ~3.3 小时 |
| 触发 | 用户原话 "i was compressing" |
| 报告时 RSS | 105.1 MB（启动期记录） |

### GC 日志特征

```
Mark-Compact 2017.1 (2080.4) -> 2004.3 (2080.4) MB    // 仅释放 13 MB
Mark-Compact 2017.1 (2080.4) -> 2004.3 (2080.4) MB    // 再次仅释放 13 MB
Ineffective mark-compacts near heap limit
```

栈帧关键：`Heap::CollectGarbage` → `MinorGCJob::Task::RunInternal` —— 普通年轻代 GC 任务期间无法分配，**不是** `structuredClone` 反序列化时崩溃。

### 根因分析

`packages/core/src/services/chatCompressionService.ts:227-393` 压缩流程在窗口期同时持有：

| 步骤 | 文件:行号 | 内存代价 |
|------|----------|----------|
| 1. 取 curated 历史 | `chat.getHistory(true)` (geminiChat.ts:1095) | **`structuredClone` × 1 全量历史** |
| 2. 计算 compressCount | line 297-300 | 对每个 Content 做 `JSON.stringify` |
| 3. 计算 totalCount | line 301-304 | 对**整个** `historyForSplit` **再做一次** `JSON.stringify` |
| 4. 切片 compress + keep | line 276-277 | 浅拷贝 |
| 5. spread 到 contents | line 326-327 | 新数组 |
| 6. 压缩 API 请求 | OpenAI SDK | 请求体序列化 |
| 7. 流式响应 chunk 累积 | `pipeline.ts:129` | `collectedGeminiResponses[]` |
| 8. Logging 层再收集 | `loggingContentGenerator.ts:398` | `responses[]`（第二份） |
| 9. 构造 extraHistory | line 366-393 | 新数组 spread `historyToKeep` |

**峰值约稳态历史的 3-5 倍**。

**双重 `JSON.stringify` 是特别浪费**：

```typescript
// chatCompressionService.ts:297-304
const compressCharCount = historyToCompress.reduce(
  (sum, c) => sum + JSON.stringify(c).length, 0,
);
const totalCharCount = historyForSplit.reduce(  // 包含 historyToCompress 全部
  (sum, c) => sum + JSON.stringify(c).length, 0,
);
```

仅为 size 校验做 O(2N) 序列化。对 200K token 历史而言，每次 stringify 产生数 MB 的临时字符串。

### 关键启示

用户使用的是 **200K 上下文窗口**模型（不是 #4116 的 1M），稳态远低。但 **3.3 小时**累积 + 压缩 3-5 倍峰值放大，足以耗尽 2GB 堆。

**压缩本身是 OOM 的高风险时刻**，需要单独优化。

### 已发布动作

- [详细分析评论](https://github.com/QwenLM/qwen-code/issues/4167#issuecomment-4458237121) 含修复建议 S0-S3

---

## Issue #4167（@wwwi2vv-dev 跟进） — 8GB 堆 + Object.defineProperty 栈帧

### 报告概要

| 项 | 值 |
|---|---|
| 来源 | [#4167 评论](https://github.com/QwenLM/qwen-code/issues/4167#issuecomment-4458728005) |
| 报告人 | @wwwi2vv-dev |
| 堆峰值 | **~8 GB** (8047 MB) |
| Mark-Compact 释放 | ~60 MB |
| 运行时长 | 17.5 分钟 (1,049,315 ms) |
| 增长速率 | **~7.6 MB/秒** |
| Node.js | v20.20.0 (fnm 管理) |
| 平台 | Linux x64 |

### 关键判断

**用户已应用 `--max-old-space-size=8192`** —— 否则 Node v20 默认堆 ~4GB 即崩溃。即便堆翻倍仍然崩溃，**确证存在持续真实泄漏**（非单纯 `structuredClone` 放大）。

### GC 日志特征（与之前完全不同）

native stack frames 13-25：
```
13: NameDictionary::New
14: BaseNameDictionary::New
15: NameDictionary::New
16: JSObject::MigrateToMap          ← 对象迁移到字典模式
17: LookupIterator::TransitionToAccessorProperty
18: JSObject::DefineAccessor         ← 定义访问器属性
19-23: JSReceiver::OrdinaryDefineOwnProperty / DefineProperty
24: Builtin_ObjectDefineProperty     ← Object.defineProperty()
25: 0x705532e99df6                   ← JIT 编译的 JS 代码
```

**这是迄今为止最有诊断价值的栈**：崩溃发生在 `Object.defineProperty` 调用过程中，V8 试图分配新的 `NameDictionary`（属性存储慢路径）失败。

### V8 NameDictionary 增长含义

V8 将对象从快速模式（hidden class）切换到字典模式时机：
- 对象拥有过多不同属性名（>~30）
- 属性以不一致顺序增删
- 属性 attribute 变更（writable/enumerable）

**持续 NameDictionary 分配 + 留存堆 ≈ 大量对象正在被构造、各自挂载许多不同属性键、且未被释放**。

### 可疑路径：错误冗余清洗 (redactProxyError)

`packages/core/src/utils/runtimeFetchOptions.ts:482-518` 的 `cloneErrorWithRedactedFields` 是热错误路径中唯一密集使用 `Object.defineProperty` 的位置：

```typescript
function cloneErrorWithRedactedFields(...) {
  for (const key of Reflect.ownKeys(error)) {
    // ...
    Object.defineProperty(clone, key, updatedDescriptor);
  }
  defineMissingRedactedValue(clone, copiedKeys, 'message', ...);
  defineMissingRedactedValue(clone, copiedKeys, 'stack', ...);
  defineMissingRedactedValue(clone, copiedKeys, 'cause', ...);  // 递归
  defineMissingRedactedValue(clone, copiedKeys, 'errors', ...); // 递归
}
```

调用点遍布所有 OpenAI/Anthropic SDK 错误捕获路径：
- `pipeline.ts:222`（流式响应错误）
- `openaiContentGenerator.ts:159`
- `errorHandler.ts:28`
- `anthropicContentGenerator.ts:234,262,763`

**8GB / 17 min 的增长场景假设**：
1. 流式请求遭遇错误（rate limit、网络抖动、畸形 chunk）
2. 错误经 `redactProxyError` → `cloneErrorWithRedactedFields` 克隆
3. 每个克隆通过 `new Error(..., { cause })` 沿调用栈往上抛 → 包装 → 再抛
4. 若包装链或 logging 持有引用，错误克隆（携带肥大 NameDictionary）累积
5. 配合 `collectedGeminiResponses[]` chunk 累积（见 #4116 Kieaer 评论中的可疑路径），错误事件触发流重建可同时泄漏 chunks + error clones

### 与其他报告的关系

属于 **Scenario B（真实持续泄漏）**，但提供了迄今最具体的 V8 栈帧线索：
- @Kieaer 的 45GB 案例：栈是 OpenSSL 符号 → 怀疑 TLS 资源
- @wwwi2vv-dev 的 8GB 案例：栈是 `defineProperty + NameDictionary` → 怀疑错误克隆/对象属性爆炸

两者可能是**同一根因的不同分支**（流处理 + 错误处理累积），或是两个独立的泄漏源叠加。

### 已发布动作

- [详细分析评论](https://github.com/QwenLM/qwen-code/issues/4167#issuecomment-4459269515) 含 5 项请求信息（约会获取 /about、模型配置、操作上下文、错误日志、heap snapshot）

---

## Issue #4315 — 19 小时长会话 + 输入触发 OOM

### 报告概要

| 项 | 值 |
|---|---|
| Issue | [#4315](https://github.com/QwenLM/qwen-code/issues/4315) |
| Qwen Code | 0.15.11 (782403d71) |
| Node.js | v22.12.0 |
| OS | macOS arm64 (25.4.0) |
| 认证 | Coding Plan (Aliyun DashScope) |
| 模型 | **glm-5**（200K 上下文） |
| 堆峰值 | ~2027 MB（默认 2GB 堆限） |
| **运行时长** | **70,561,968 ms ≈ 19.6 小时** ← 系列中最长 |
| 触发动作 | 任务完成后**用户在输入框打字**时崩溃 |
| /about 时 RSS | 127.5 MB（启动期记录） |

### GC 日志特征

```
[21822] 70561968 ms: Scavenge (interleaved)
  2027.9 (2079.0) -> 2024.1 (2079.5) MB

[21822] 70562036 ms: Scavenge
  2029.7 (2079.5) -> 2026.8 (2098.0) MB
  allocation failure
```

### 栈帧关键解读

```
9-22:  ValueDeserializer::ReadDenseJSArray ↔ ReadObject  ← 深层嵌套数组对象递归
24:    v8::ValueDeserializer::ReadValue
25:    node::worker::Message::Deserialize           ← 走 worker_threads 消息通道
26:    node::worker::StructuredClone                ← Node 全局 structuredClone()
27:    Builtins_CallApiCallbackOptimizedNoProfiling
28:    0x10b59b3d8                                   ← JIT'd 用户代码调用 structuredClone
...
34:    v8_inspector::V8Console::runTask             ← async 上下文跟踪
36-92: 大量重复地址                                   ← 深递归 JIT JS 代码
100:   node::Environment::CheckImmediate            ← libuv check 阶段
101:   uv__run_check
102:   uv_run
```

三个关键观察：

1. **Frame 26 = `node::worker::StructuredClone`**：Node.js 全局 `structuredClone()`（v17+）。与 #4116 原报告（V8 内置 `ValueDeserializer`）路径一致，从 Node 表面 API 进入。

2. **Frame 100 = `CheckImmediate`**：崩溃实际发生在 **libuv check 阶段**（`setImmediate` 回调执行）。用户打字未直接调用 `structuredClone`——keystroke 触发了状态变更，状态变更落地到一条 setImmediate 链上，链中某处的 `structuredClone(history)` 撑爆了堆。

3. **Frame 34 = `V8Console::runTask`**：V8 Inspector 的 async 上下文跟踪。出现在普通堆栈说明运行期开启了 async stack traces 或 inspector，每个 task 都背负额外开销。

### 根因分析

**Scenario A 的输入触发变种**。任务完成后会触发的 `getHistory()` 调用点（每个都会 `structuredClone`）：

- `recordAssistantTurn` 写 JSONL
- `checkNextSpeaker`（**两次**全量克隆，行 55、63）
- 自动压缩阈值检查
- IDE 上下文同步
- microcompaction 时间触发评估

任意一个在 setImmediate 链上的 continuation 都可能在 19+ 小时累积的历史上 OOM。

### 与其他 issue 的对比

| | #4116 原 | #4167 原 | #4167 (@wwwi2vv-dev) | **#4315** |
|---|---------|---------|---------|---------|
| 触发 | idle | `/compress` | 流式 + 错误 | **输入打字** |
| 堆 | 2 GB | 2 GB | 8 GB | 2 GB |
| 时长 | 50 min | 3.3 h | 17 min | **19.6 h** |
| 栈关键 | `ValueDeserializer` | regular GC | `Object.defineProperty` | `node::worker::StructuredClone` |
| 分类 | A | C | B | **A 变种** |

19.6 小时是系列中最长的。说明现有的 microcompaction（按时间清理工具结果）+ 自动压缩（按 token 阈值）在长期运行中**没能保持稳态**，历史持续增长。

### 不需要新机制

根因与 #4116 原报告一致。已识别的 P0 修复（`getHistoryReadonly`、`peekLastHistoryEntry`、消除压缩双重 stringify、启动时设置堆限）全部适用，无需新增 P 级修复项。

唯一新增的细节是：**输入处理路径上的 setImmediate 链需要审计**——任何在 keystroke 后的 continuation 中的 `structuredClone(history)` 都应替换为 readonly 引用或 peek 访问。

### 已发布动作

- [#4315 分析评论](https://github.com/QwenLM/qwen-code/issues/4315#issuecomment-4485434397)

---

## Claude Code 对照设计

通过分析 Claude Code 代码 (`/Users/jinye.djy/Projects/claude-code`)，发现其在内存管理上有几个根本性不同的设计：

### 1. 不在热路径上做深拷贝（最大差异）

`src/QueryEngine.ts:1162`:

```typescript
getMessages(): readonly Message[] {
  return this.mutableMessages  // 返回引用，用 readonly 类型守卫
}
```

查询时仅做一次浅拷贝 (`src/query.ts:365`):

```typescript
let messagesForQuery = [...getMessagesAfterCompactBoundary(messages)]
```

### 2. 单一所有权模型

`QueryEngine.mutableMessages` 是**唯一可信源**。React 状态持有引用而非副本。

### 3. 不使用 Ink `<Static>`

`src/utils/staticRender.tsx:7-9` 明确回避：

> "This is a workaround for the fact that Ink doesn't support multiple `<Static>` components"

替代方案 (`src/components/Messages.tsx:621-623`):

```typescript
if (prev.isStatic && next.isStatic) return true;  // React.memo 跳过 re-render
```

大文本展示层截断 (`UserPromptMessage.tsx`): `MAX_DISPLAY_CHARS = 10_000`

### 4. 基于 heap 的内存监控

`src/hooks/useMemoryUsage.ts`:

- 检测 `process.memoryUsage().heapUsed`（**不是 RSS**）
- 阈值: 1.5GB high, 2.5GB critical
- 配套 `/heapdump` 命令做诊断

### 5. 多层级渐进式压缩

```
snip → time-based microcompact → cached microcompact → session memory compact → full compaction
```

每层比下一层更轻量，全部**原地修改** (in-place mutation)。

### 6. 容器场景下提升堆限

`src/entrypoints/cli.tsx:7-14`:

```typescript
if (process.env.CLAUDE_CODE_REMOTE === 'true') {
  process.env.NODE_OPTIONS = `${existing} --max-old-space-size=8192`;
}
```

---

## 最终总结与行动项

### 三类 OOM 场景汇总

| 场景 | 代表 issue | 触发 | 堆峰值 | 时长 | 关键栈帧 | 修复路径 |
|------|-----------|------|--------|------|----------|---------|
| **A — 长会话 + structuredClone 放大** | #4116（原）、**#4315** | idle / 输入 / 任务完成后 | 2 GB | 50 min ~ **19.6 h** | `ValueDeserializer::ReadValue`、`node::worker::StructuredClone` | 减少深拷贝；`readonly` 引用语义 |
| **B — 持续真实泄漏** | #4116 (@Kieaer)、#2868、**#4167 (@wwwi2vv-dev)** | active 流式 / 错误重试 | 2-45 GB | 100s ~ 7h | OpenSSL/TLS、`Object.defineProperty + NameDictionary` 或 regular V8 | 流 accumulator、错误克隆链、writeChain 闭包、订阅审计 |
| **C — 操作期峰值放大** | #4167 | `/compress`、`/resume` | 2-4 GB | 操作触发 | regular GC | 压缩流程双重 stringify、spread 链 |

### 核心理念对比（qwen-code vs Claude Code）

| 维度 | qwen-code 现状 | Claude Code 设计 |
|------|---------------|-----------------|
| 历史所有权 | 多份副本（API + UI + Static） | 单一可变数组 + 引用共享 |
| 访问模式 | 每次调用 `structuredClone` | `readonly` 类型守卫，零拷贝 |
| 渲染层 | Ink `<Static>` 永久保留 | `React.memo` + `isStatic` 跳过 re-render |
| 内存监控 | RSS 7GB（永远不触发） | heapUsed 1.5GB / 2.5GB |
| 压缩触发 | 仅 token 阈值 | token + 时间 + （建议加堆压力） |
| 大文本处理 | 全量保留 | 展示层截断到 10K |

**核心思路**：把"每次访问都深拷贝"的模式改为"单一可变数组 + readonly 类型约束 + 浅拷贝"，从根本上消除内存放大。

### 行动项清单（按优先级）

#### P0 — 立即缓解

| ID | 改动 | 影响场景 | 工作量 | 来源 |
|---|------|---------|--------|------|
| P0-1 | 用户层 workaround：`NODE_OPTIONS=--max-old-space-size=8192` | A、C | - | 已发布 |
| P0-2 | 启动时自动设置堆限（参考 cli.tsx 模式） | A、C | S | Claude Code |
| P0-3 | `getHistory()` 拆分只读引用接口 `getHistoryReadonly()` | A、C | M | Claude Code `getMessages()` |
| P0-4 | 新增 `peekLastHistoryEntry` / `peekHistoryEntry` 修复 `checkNextSpeaker` 双克隆 | A | S | - |
| P0-5 | 消除 `chatCompressionService.ts:297-304` 双重 `JSON.stringify` | C | S | 单趟扫描即可 |
| P0-6 | 内部调用（compression、recap）跳过 chunk accumulator | B、C | M | - |

#### P1 — 结构性改进

| ID | 改动 | 影响场景 | 工作量 |
|---|------|---------|--------|
| P1-1 | 内存监控改 `heapUsed` + 阈值 1.5/2.5 GB | 全部（早预警） | S |
| P1-2 | 堆压力感知压缩触发（不仅看 token） | A | M |
| P1-3 | 流异常退出强制 `stream.return?.()` 释放 | B | S |
| P1-4 | `writeChain` 替换为有界队列 | B | M |
| P1-5 | EventEmitter 订阅 cleanup 审计 | B | M |
| P1-9 | `cloneErrorWithRedactedFields` 改为字符串/原型替换，避免 `Object.defineProperty` 触发字典模式 | B | M |
| P1-10 | 错误链路上限：包装多于 N 层时丢弃中间 `cause` 节点（保留最深处原始错误） | B | M |
| P1-6 | `/resume` 分块读取 JSONL，避免一次性整文件入内存 | B | M |
| P1-7 | `React.memo + isStatic` 替代 Ink `<Static>` 完全保留 | A、内存常量 | L |
| P1-8 | 大文本展示层截断（10K chars） | A | S |

#### P2 — 长期优化

| ID | 改动 | 影响场景 | 工作量 |
|---|------|---------|--------|
| P2-1 | microcompaction 改为原地修改 | A | M |
| P2-2 | 优化其他 `getHistory()` 调用点（共 9+ 处） | A、C | M |
| P2-3 | 添加 `/heapdump` 命令辅助用户抓快照 | 全部（诊断） | S |
| P2-4 | `/bug` 命令加入 V8 heap 统计输出 | 诊断 | S |
| P2-5 | extraHistory 构造改为 push 而非 spread | C | S |

### 复测方案

为了验证修复效果，建议设计三类回归测试：

**A 类（验证 structuredClone 放大假设）**：

- 长会话场景：连续做 50+ 次小请求
- 观察堆增长曲线，期望基本平稳（不是单调增长）

**B 类（验证流式聚合泄漏假设）**：

- 让模型生成超长响应（一次输出 10+ MB 文本）
- 启动 → 单次大请求 → idle 30 秒 → `global.gc()`（`--expose-gc`）
- 检查 retained heap 应该回落到接近基线

**C 类（验证压缩峰值修复）**：

- 建立 100K token 历史
- 触发 `/compress` 同时监控 `process.memoryUsage().heapUsed` 峰值
- 修复前后峰值差异应该显著（预期下降 50%+）

### 已完成的对外动作

| 时间 | 动作 |
|------|------|
| 2026-05-14 | [#4116 workaround 评论](https://github.com/QwenLM/qwen-code/issues/4116#issuecomment-4447005872) |
| 2026-05-14 | [#4116 完整技术分析评论](https://github.com/QwenLM/qwen-code/issues/4116#issuecomment-4448193086) |
| 2026-05-15 | [#4116 区分两类场景追加评论](https://github.com/QwenLM/qwen-code/issues/4116#issuecomment-4456488521) |
| 2026-05-15 | [#4167 详细分析评论](https://github.com/QwenLM/qwen-code/issues/4167#issuecomment-4458237121) |
| 2026-05-15 | [#4167 跟进评论：@wwwi2vv-dev 8GB 案例分析](https://github.com/QwenLM/qwen-code/issues/4167#issuecomment-4459269515) |
| 2026-05-19 | [#4315 分析评论：19h 长会话输入触发 OOM](https://github.com/QwenLM/qwen-code/issues/4315#issuecomment-4485434397) |

---

## 附录：相关链接

### 涉及的 issue

- [#4116 - problem critical error](https://github.com/QwenLM/qwen-code/issues/4116)
- [#4167 - cli crashed](https://github.com/QwenLM/qwen-code/issues/4167)
- [#4315 - cli crashed when i was just typing](https://github.com/QwenLM/qwen-code/issues/4315)
- [#2868 - Heap out of memory](https://github.com/QwenLM/qwen-code/issues/2868)
- [#2945 - Heap OOM during /resume](https://github.com/QwenLM/qwen-code/issues/2945)
- [#728 - 早期同类 OOM 报告](https://github.com/QwenLM/qwen-code/issues/728)

### 关键代码位置

- `packages/core/src/core/geminiChat.ts:1095` — `getHistory()` `structuredClone` 调用点
- `packages/core/src/services/chatCompressionService.ts:227-393` — 压缩流程
- `packages/core/src/core/openaiContentGenerator/pipeline.ts:129` — 流式 chunk 累积
- `packages/core/src/core/loggingContentGenerator/loggingContentGenerator.ts:398` — Logging chunk 累积
- `packages/core/src/services/chatRecordingService.ts:480-724` — writeChain promise 链
- `packages/cli/src/ui/hooks/useMemoryMonitor.ts:11` — 错位的 RSS 7GB 阈值
- `packages/core/src/core/tokenLimits.ts:129` — 模型上下文窗口配置
- `packages/cli/src/ui/components/MainContent.tsx:355-381` — Ink `<Static>` 使用

### Claude Code 参考位置

- `src/QueryEngine.ts:1162` — `readonly Message[]` 返回模式
- `src/hooks/useMemoryUsage.ts` — 基于 heap 的内存监控
- `src/components/Messages.tsx:621` — `React.memo + isStatic` 优化
- `src/utils/staticRender.tsx:7-9` — 不使用 Ink `<Static>` 的解释
- `src/entrypoints/cli.tsx:7-14` — 容器内自动提升堆限
- `src/services/compact/` — 多层级压缩管道
