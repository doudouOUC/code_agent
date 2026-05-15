# Issue #4116 OOM 分析与优化方案

**日期**: 2026-05-14
**Issue**: [#4116 - problem critical error](https://github.com/QwenLM/qwen-code/issues/4116)
**版本**: Qwen Code 0.15.11 (782403d71)

## 1. 问题概述

用户在 Windows 环境下使用 `deepseek-v4-pro` 模型，运行约 50 分钟后崩溃，错误为：

```
FATAL ERROR: Ineffective mark-compacts near heap limit
Allocation failed - JavaScript heap out of memory
```

GC 日志显示堆已填满到 ~2034-2056 MB，触发崩溃时上下文使用仅 9.5%，用户处于输入提示符的空闲状态。

### 1.1 用户环境

| 项目 | 值 |
|------|-----|
| Qwen Code | 0.15.11 (782403d71) |
| Node.js | v24.15.0 |
| OS | Windows 10 (10.0.26200) x64 |
| 认证 | API Key - openai |
| Base URL | https://api.deepseek.com |
| 模型 | deepseek-v4-pro |
| 上下文使用 | 9.5% |
| 运行时长 | ~50 分钟 (3,024,101 ms) |

### 1.2 关键 GC 日志

```
[7812:0x...]  3024101 ms: Scavenge (interleaved)
  2034.3 (2044.6) -> 2032.8 (2052.6) MB

[7812:0x...]  3024321 ms: Mark-Compact (reduce)
  2041.9 (2056.1) -> 2028.0 (2036.4) MB

FATAL ERROR: Ineffective mark-compacts near heap limit
```

"Ineffective mark-compacts" 意味着 ~2GB 内存全部**可达**（reachable），不是传统意义的内存泄漏，而是应用确实持有了这么多数据。

### 1.3 崩溃栈帧

```
v8::ValueDeserializer::ReadValue
node::MultiIsolatePlatform::DisposeIsolate ...
```

`v8::ValueDeserializer::ReadValue` 是 V8 内部反序列化函数，由 `structuredClone()` 调用。崩溃发生在 `structuredClone` 试图分配新对象时。

## 2. 根因分析

### 2.1 直接触发因素

崩溃发生在 `structuredClone(this.history)` 调用时——堆已经接近 2GB 上限，再分配一份历史的克隆就溢出了。

### 2.2 内存三份拷贝架构

会话数据在内存中至少存在 3 份：

| 副本 | 位置 | 文件:行号 |
|------|------|----------|
| API 格式历史 | `GeminiChat.history` (`Content[]`) | `packages/core/src/core/geminiChat.ts:422` |
| React UI 状态 | `useHistory()` (`HistoryItem[]`) | `packages/cli/src/ui/hooks/useHistoryManager.ts:34` |
| Ink Static fiber 树 | `<Static>` 组件渲染保留 | `packages/cli/src/ui/components/MainContent.tsx:355-381` |

Ink 的 `<Static>` 组件是**只追加**的：一旦消息被渲染，对应的 React fiber 节点永久保留在内存中，永远不会被释放。

### 2.3 频繁的全量克隆调用

`getHistory()` 每次调用都执行 `structuredClone(history)`：

| 调用点 | 文件 | 行号 | 克隆次数 |
|--------|------|------|----------|
| `checkNextSpeaker` | `utils/nextSpeakerChecker.ts` | 55, 63 | **2 次全量** |
| `microcompactHistory` | `core/client.ts` | 1034 | 1 次全量 |
| `tryCompress` | `services/chatCompressionService.ts` | 227 | 1 次 curated |
| `sessionTitle` | `services/sessionTitle.ts` | 116 | 1 次全量 |
| `sessionRecap` | `services/sessionRecap.ts` | 57 | 1 次全量 |
| `buildApiHistoryFromConversation` | `services/sessionService.ts` | 1219-1242 | N 次 |

最关键的是 `checkNextSpeaker` 每次模型回合后都会触发，且做 **2 次** 全量克隆。

### 2.4 1M 上下文窗口模型放大问题

`packages/core/src/core/tokenLimits.ts:129`:
```typescript
[/^deepseek-v4/, LIMITS['1m']],  // DeepSeek V4 (flash, pro): 1M
```

- **压缩阈值** (`chatCompressionService.ts:27`): `COMPRESSION_TOKEN_THRESHOLD = 0.7` → 在 70 万 token 时才触发
- 70 万 token 在结构化对象表示下（嵌套 Content/Part 对象 + JS 引擎开销 + 三份副本 + React fiber 树）会膨胀 100-500 倍
- V8 堆 2GB 远早于 70 万 token 阈值就被填满

### 2.5 Memory Monitor 阈值错位

`packages/cli/src/ui/hooks/useMemoryMonitor.ts:11`:
```typescript
MEMORY_WARNING_THRESHOLD = 7 * 1024 * 1024 * 1024;  // 7GB RSS
```

- 监控的是 RSS（包括 native memory + 共享库）
- 但实际 V8 堆限只有 ~2GB
- 应用在 RSS 远未达到 7GB 时就崩溃，警告永远不触发

## 3. Claude Code 的对照实现

通过分析 Claude Code 代码 (`/Users/jinye.djy/Projects/claude-code`)，发现其在内存管理上有几个根本性不同的设计：

### 3.1 不在热路径上做深拷贝（最大差异）

**Claude Code** (`src/QueryEngine.ts:1162`):
```typescript
getMessages(): readonly Message[] {
  return this.mutableMessages  // 返回引用，用 readonly 类型守卫
}
```

查询时仅做一次浅拷贝 (`src/query.ts:365`):
```typescript
let messagesForQuery = [...getMessagesAfterCompactBoundary(messages)]
```

**qwen-code** (`packages/core/src/core/geminiChat.ts:1095`):
```typescript
getHistory(curated: boolean = false): Content[] {
  const history = curated ? extractCuratedHistory(this.history) : this.history;
  return structuredClone(history);  // 每次都深拷贝
}
```

### 3.2 单一所有权模型

Claude Code 的 `QueryEngine.mutableMessages` 是**唯一可信源**。React 状态持有引用而非副本。微压缩、自动压缩、全量压缩都通过引用或浅拷贝传递，不做深克隆。

### 3.3 不使用 Ink `<Static>`

Claude Code 明确回避 `<Static>` (`src/utils/staticRender.tsx:7-9`):
> "This is a workaround for the fact that Ink doesn't support multiple `<Static>` components"

替代方案 (`src/components/Messages.tsx:621-623`):
```typescript
if (prev.isStatic && next.isStatic) return true;  // React.memo 跳过已完成消息的 re-render
```

大文本展示层截断 (`src/components/messages/UserPromptMessage.tsx:20-30`):
```typescript
const MAX_DISPLAY_CHARS = 10_000;
const TRUNCATE_HEAD_CHARS = 2_500;
const TRUNCATE_TAIL_CHARS = 2_500;
```

### 3.4 基于 heap 的内存监控

`src/hooks/useMemoryUsage.ts`:
- 检测 `process.memoryUsage().heapUsed`（**不是 RSS**）
- 阈值: 1.5GB = high, 2.5GB = critical
- 每 10 秒轮询
- 配套 `/heapdump` 命令做诊断快照

### 3.5 多层级渐进式压缩

Claude Code 的压缩管道：
```
snip → time-based microcompact → cached microcompact → session memory compact → full compaction
```

每层比下一层更轻量，全部**原地修改** (in-place mutation)，不创建临时副本。

### 3.6 容器场景下提升堆限

`src/entrypoints/cli.tsx:7-14`:
```typescript
if (process.env.CLAUDE_CODE_REMOTE === 'true') {
  process.env.NODE_OPTIONS = `${existing} --max-old-space-size=8192`;
}
```

## 4. 优化方案

### 4.1 立即缓解（P0）

#### 4.1.1 用户侧 Workaround

设置 `NODE_OPTIONS` 提升 V8 堆上限：

**PowerShell**:
```powershell
$env:NODE_OPTIONS="--max-old-space-size=8192"
qwen
```

**CMD**:
```cmd
set NODE_OPTIONS=--max-old-space-size=8192
qwen
```

#### 4.1.2 启动时自动注入堆参数

参考 Claude Code `cli.tsx`，在 CLI 入口检测环境并自动设置：

```typescript
// packages/cli/src/index.ts 或入口文件
if (!process.env.NODE_OPTIONS?.includes('--max-old-space-size')) {
  // 仅当用户未自定义时设置
  process.env.NODE_OPTIONS = [
    process.env.NODE_OPTIONS,
    '--max-old-space-size=8192'
  ].filter(Boolean).join(' ');
}
```

注意：`NODE_OPTIONS` 只对子进程生效，需要在 wrapper 脚本（如 `qwen` bin 入口）中处理。

### 4.2 消除热路径深拷贝（P0）

#### 4.2.1 改造 `getHistory()` 返回只读引用

```typescript
// packages/core/src/core/geminiChat.ts

/** 返回不可变引用，零拷贝。调用方不得修改。 */
getHistoryReadonly(curated: boolean = false): readonly Content[] {
  return curated ? extractCuratedHistory(this.history) : this.history;
}

/** 保留旧接口用于确实需要可变副本的场景（应该极少）。 */
getHistory(curated: boolean = false): Content[] {
  const history = curated ? extractCuratedHistory(this.history) : this.history;
  return structuredClone(history);
}
```

排查所有 `getHistory()` 调用点，将只读用途迁移到 `getHistoryReadonly()`：

| 调用点 | 是否需要可变 | 迁移目标 |
|--------|--------------|----------|
| `checkNextSpeaker` (× 2) | 否，仅读取 | `getHistoryReadonly` |
| `microcompactHistory` | 是，会替换 setHistory | 保持 `getHistory` 或改为原地修改 |
| `tryCompress` | 是，会构造新历史 | 保持 `getHistory` |
| `sessionTitle` / `sessionRecap` | 否，仅读取做摘要 | `getHistoryReadonly` |

#### 4.2.2 新增定向访问方法

```typescript
// packages/core/src/core/geminiChat.ts

/** O(1) 读取最后一条消息，不克隆。 */
peekLastHistoryEntry(): Content | undefined {
  return this.history[this.history.length - 1];
}

/** O(1) 按索引读取，不克隆。 */
peekHistoryEntry(index: number): Content | undefined {
  return this.history[index];
}
```

`checkNextSpeaker` 用这两个方法替代两次全量克隆：

```typescript
// 优化前
const curatedHistory = chat.getHistory(true);   // structuredClone × 1
const comprehensiveHistory = chat.getHistory(); // structuredClone × 1
const lastComprehensive = comprehensiveHistory[comprehensiveHistory.length - 1];

// 优化后
const last = chat.peekLastHistoryEntry();
const curatedReadonly = chat.getHistoryReadonly(true);  // 零拷贝
```

### 4.3 内存监控对齐 V8 堆（P1）

参考 Claude Code 的 `useMemoryUsage`:

```typescript
// packages/cli/src/ui/hooks/useMemoryMonitor.ts

import * as v8 from 'node:v8';

const HEAP_HIGH_THRESHOLD = 1.5 * 1024 * 1024 * 1024;     // 1.5GB
const HEAP_CRITICAL_THRESHOLD = 2.5 * 1024 * 1024 * 1024; // 2.5GB
const MEMORY_CHECK_INTERVAL = 10_000;                     // 10s

useEffect(() => {
  const intervalId = setInterval(() => {
    const { heapUsed } = process.memoryUsage();
    const heapLimit = v8.getHeapStatistics().heap_size_limit;
    const usageRatio = heapUsed / heapLimit;

    if (heapUsed > HEAP_CRITICAL_THRESHOLD || usageRatio > 0.85) {
      addItem({ type: MessageType.ERROR, text: `Critical heap usage: ${...}` });
    } else if (heapUsed > HEAP_HIGH_THRESHOLD || usageRatio > 0.7) {
      addItem({ type: MessageType.WARNING, text: `High heap usage: ${...}` });
    }
  }, MEMORY_CHECK_INTERVAL);
  return () => clearInterval(intervalId);
}, []);
```

### 4.4 堆压力感知的压缩触发（P1）

在 token 阈值之外，加入堆压力触发：

```typescript
// packages/core/src/services/chatCompressionService.ts

import * as v8 from 'node:v8';

function shouldCompressByHeapPressure(): boolean {
  const { heapUsed } = process.memoryUsage();
  const heapLimit = v8.getHeapStatistics().heap_size_limit;
  return heapUsed / heapLimit > 0.7;  // 堆使用 70% 即触发
}

// 在 tryCompress 检查中加入
if (!force && tokenUsage < COMPRESSION_TOKEN_THRESHOLD * contextWindow
    && !shouldCompressByHeapPressure()) {
  return { status: CompressionStatus.SKIPPED };
}
```

### 4.5 优化 Ink Static 渲染（P1）

参考 Claude Code 的 `React.memo + isStatic` 模式：

- 已完成的消息（非 streaming、tool 已 resolved）标记为 `isStatic = true`
- 使用 `React.memo` 自定义比较器，对 `isStatic` 的消息跳过 re-render
- 大文本展示层截断到 10K 字符（保留首尾，中间省略）

### 4.6 microcompaction 原地修改（P2）

当前 `client.ts:1033-1039`:
```typescript
const mcResult = microcompactHistory(
  this.getChat().getHistory(),  // structuredClone 全量历史
  ...
);
if (mcResult.meta) {
  this.getChat().setHistory(mcResult.history);  // 替换
}
```

改为接受只读引用 + 原地修改 mutator API，减少临时分配。

## 5. 实施优先级与影响面

| 优先级 | 改动 | 来源 | 工作量 | 影响面 |
|--------|------|------|--------|--------|
| P0 | 用户层 workaround：`NODE_OPTIONS=--max-old-space-size=8192` | - | 仅文档 | 立即缓解 |
| P0 | 启动时自动设置堆限 | Claude Code `cli.tsx` | S | 全部用户 |
| P0 | `getHistory()` 拆分只读引用接口 | Claude Code `getMessages()` | M | 消除最大浪费 |
| P0 | 新增 `peekLastHistoryEntry` / `peekHistoryEntry` | - | S | 修复 `checkNextSpeaker` 双克隆 |
| P1 | 内存监控改用 `heapUsed` + V8 堆限阈值 | Claude Code `useMemoryUsage` | S | 崩溃前能预警 |
| P1 | 堆压力感知压缩触发 | - | M | 防止堆满 |
| P1 | `React.memo` + `isStatic` 优化替代 Static 完全保留 | Claude Code `Messages.tsx` | L | 释放 fiber 内存 |
| P1 | 大文本展示层截断 | Claude Code `UserPromptMessage` | S | 减少 React 节点 |
| P2 | microcompaction 改为原地修改 | - | M | 减少临时分配 |
| P2 | 优化其他 `getHistory()` 调用点 | - | M | 累积收益 |

## 6. 核心理念对比

| 维度 | qwen-code 现状 | Claude Code 设计 |
|------|---------------|-----------------|
| 历史所有权 | 多份副本（API + UI + Static） | 单一可变数组 + 引用共享 |
| 访问模式 | 每次调用 `structuredClone` | `readonly` 类型守卫，零拷贝 |
| 渲染层 | Ink `<Static>` 永久保留 | `React.memo` + `isStatic` 跳过 re-render |
| 内存监控 | RSS 7GB 阈值（永远不触发） | heapUsed 1.5GB/2.5GB |
| 压缩触发 | 仅 token 阈值 | token + 时间 + (建议加堆压力) |
| 大文本处理 | 全量保留 | 展示层截断到 10K |

**核心思路**：把"每次访问都深拷贝"的模式改为"单一可变数组 + readonly 类型约束 + 浅拷贝"，从根本上消除内存放大。

## 7. 相关 Issue 与 PR

- #4116 - 本次 OOM 报告
- #728 - 之前的 OOM 报告（含 `--max-old-space-size` workaround）
- #2868 - 长会话内存问题
- #2945 - `/resume` 操作期间的 OOM

## 8. 已发布的 issue 评论

- [Workaround 方案](https://github.com/QwenLM/qwen-code/issues/4116#issuecomment-4447005872)
- [完整技术分析](https://github.com/QwenLM/qwen-code/issues/4116#issuecomment-4448193086)

---

## 9. 后续发现：存在第二类 OOM 场景

阅读 issue #4116 新评论与关联 issue #2868、#2945 后，发现单纯的 `structuredClone` 放大理论**不能解释所有崩溃**，存在另一类更严重的内存泄漏问题。

### 9.1 数据点对比

| 来源 | 堆大小 | 运行时长 | 速率 | 平台 | 模型/认证 |
|------|--------|----------|------|------|-----------|
| #4116 (原报告) | ~2 GB | 50 min | ~40 MB/min | Win + Node v24.15 | deepseek API Key |
| #4116 (Kieaer 评论) | **~45 GB** | 7.2 hours | ~100 MB/min | Win | n/a |
| #2868 | ~2 GB | **100 秒** | **~20 MB/秒** | Linux + Node v24.12 | Qwen OAuth + coder-model |
| #2945 | ~4 GB | 220 秒 | ~18 MB/秒 | Win + Node v22.17 | Qwen OAuth (`/resume` 触发) |

### 9.2 关键观察

1. **45GB 用户的存在彻底否定了"提升堆限即可"的方案**——即便堆给到 45GB 也会崩。这是**真实的内存增长**，不是仅由 `structuredClone` 临时放大造成的。

2. **#2868 在 100 秒内崩溃**——根本没时间累积长会话历史。用户原话："RAM consumption keep rising until this happens. No backup options to schrink context"。说明在很短时间内有持续高速分配。

3. **#2945 在 `/resume` 期间崩溃**——栈帧出现 `SSL_get_quiet_shutdown` / `BIO_ssl_shutdown`，怀疑是恢复历史时的 JSONL 加载与 TLS 资源混合压力。

4. **跨平台/版本一致**——Linux/Windows、Node v22/v24、不同认证方式都有报告，说明问题在通用代码层而非平台特定。

### 9.3 第二类问题的可疑代码路径

#### 候选 1: 流式响应聚合数组

**`packages/core/src/core/openaiContentGenerator/pipeline.ts:129`**:
```typescript
const collectedGeminiResponses: GenerateContentResponse[] = [];
// ...
for await (const chunk of stream) {
  // ...
  collectedGeminiResponses.push(response);  // 每个 chunk 都 push
}
```

**`packages/core/src/core/loggingContentGenerator/loggingContentGenerator.ts:398`**:
```typescript
const responses: GenerateContentResponse[] = [];
// ...
for await (const response of stream) {
  if (shouldCollectResponses) {
    responses.push(response);
  }
}
```

- 流式响应的**每个 chunk** 都被收集到数组里供日志/合并使用
- 对于很长的响应（如模型读了大文件并完整复述），这个数组可以非常大
- 每个 chunk 是独立的 `GenerateContentResponse` 对象，不是简单字符串
- 当流式响应中有大量 reasoning/thinking 内容时，累积更明显

**改进方向**: 流处理改为**增量合并**到单个对象，不保留每个 chunk 的引用。

#### 候选 2: ChatRecordingService 写入链

**`packages/core/src/services/chatRecordingService.ts:480`**:
```typescript
private writeChain: Promise<void> = Promise.resolve();

private appendRecord(record: ChatRecord, ...) {
  this.writeChain = this.writeChain
    .catch(() => {})
    .then(() => jsonl.writeLine(conversationFile, record))  // 闭包捕获 record
    .catch(...);
}
```

- 每次写入都创建新的 Promise 节点链入 `writeChain`
- `.then()` 闭包**捕获 `record` 对象的强引用**，直到该写入完成
- 如果磁盘写入慢于产生速率（高延迟磁盘、网络盘、Windows Defender 实时扫描），闭包会堆积
- 单条 `record` 可能很大（包含完整的 tool result）

**改进方向**: 用真正的有界队列代替 promise chain，背压控制 + 丢弃溢出记录。

#### 候选 3: EventEmitter 订阅泄漏

**`packages/cli/src/ui/contexts/SessionContext.tsx:243`**:
```typescript
uiTelemetryService.on('update', handleUpdate);
```

需要核查所有 `.on()` 订阅是否都有对应 cleanup。React 严格模式下 effect 重跑会导致重复订阅；Ink 多次渲染同样可能。

#### 候选 4: 流式响应未关闭

如果 `for await (const chunk of stream)` 因异常退出而 stream 没被显式 `return()`（关闭迭代器），底层的 HTTP/SSE 连接和缓冲区可能留存。这能解释栈帧中的 OpenSSL 符号——TLS 缓冲区随未关闭连接累积。

### 9.4 修订后的优化方案

在原方案基础上**新增以下 P0**：

10. **流式响应聚合改为增量合并**——`collectedGeminiResponses[]` / `responses[]` 不保留每个 chunk，仅维护合并后的单个对象 + 必要的元数据（token 统计等）。

11. **强制关闭异常退出的流**——在 `processStreamWithLogging` 的 `catch` 中显式调用 `stream.return?.()` 释放底层资源；同样保护其他流消费点。

12. **`writeChain` 替换为有界队列**——参考 `monitorRegistry.ts` 的 `pruneTerminalEntries` 模式，对内存中尚未写入磁盘的 record 设置硬上限。

13. **核查所有 EventEmitter 订阅 cleanup**——`grep '.on('` 与 `grep 'removeListener'` 比例失衡（146 vs 67），需逐一审计 React effect/Ink 使用。

14. **`/resume` 时分块读取 JSONL**——避免一次性把整个会话文件读到内存；或在加载后立即丢弃中间数据结构。

### 9.5 复测方案

为了区分两类问题，建议设计两种复测：

**A. 验证 structuredClone 放大假设**
- 长会话场景：连续做大量小请求 50+ 次，观察堆增长曲线
- 加 `--max-old-space-size=8192` 后观察是否仅延迟崩溃

**B. 验证流式聚合泄漏假设**
- 让模型生成超长响应（一次输出几十 MB 文本），观察单次请求后堆是否回落
- 启动 → 单次大请求 → idle 30 秒 → 强制 GC（`global.gc()` with `--expose-gc`）→ 检查 retained heap

如果方案 B 显示单次请求后堆不回落，则 candidate 1/2 命中。

### 9.6 给上游的更新评论建议

应在 issue #4116 上追加一条评论，承认：
- 原分析（structuredClone 放大）适用于原报告但不能解释 Kieaer 的 45GB 案例
- 关联 #2868（100s 崩溃）说明存在快速增长的内存泄漏
- 怀疑 streaming response 聚合数组未及时释放、writeChain 闭包堆积
- 建议团队添加更细粒度的 heap profiling 工具（如 `/heapdump` 命令）以便用户主动抓快照

---

## 10. 第三类场景：压缩峰值内存（Issue #4167）

### 10.1 报告概要

- **Issue**: [#4167 - cli crashed](https://github.com/QwenLM/qwen-code/issues/4167)
- **触发**: 用户原话 "i was compressing"（手动 `/compress` 或自动压缩触发时崩溃）
- **环境**:
  - macOS arm64 (25.4.0) - Apple Silicon
  - Node.js v22.12.0
  - Auth: Coding Plan (Aliyun DashScope)
  - 模型: **glm-5**（注意：不是 Qwen，而是智谱 GLM；context window 仅 **200K** 而非 1M）
  - 运行时长: ~3.3 小时 (11,919,276 ms)
  - 报告时 RSS: 105.1 MB（启动时记录，远低于 V8 堆崩溃时的 2GB）

### 10.2 GC 日志特征

```
Mark-Compact 2017.1 (2080.4) -> 2004.3 (2080.4) MB  // 仅释放 13 MB
Mark-Compact 2017.1 (2080.4) -> 2004.3 (2080.4) MB  // 再次仅释放 13 MB
Ineffective mark-compacts near heap limit
```

栈帧关键：`Heap::CollectGarbage` → `MinorGCJob::Task::RunInternal` —— 普通 MinorGC（年轻代清理）触发的 OOM，**不是** `structuredClone` 反序列化时崩溃。

含义：堆**已经接近满**，压缩流程中某次 V8 内部 GC 任务调度时无法分配。

### 10.3 压缩流程的内存峰值放大

`packages/core/src/services/chatCompressionService.ts:227-393` 的关键步骤：

| 步骤 | 文件:行号 | 内存代价 |
|------|----------|----------|
| 1. 取 curated 历史 | `chat.getHistory(true)` (geminiChat.ts:1095) | **`structuredClone` × 1 全量历史** |
| 2. 计算 compressCount | line 297-300 | 对每个 Content 做 `JSON.stringify` |
| 3. 计算 totalCount | line 301-304 | 对**整个** `historyForSplit` **再做一次** `JSON.stringify` |
| 4. 切片 compress + keep | line 276-277 | 浅拷贝，元素仍引用 |
| 5. spread 到 runSideQuery contents | line 326-327 | 新数组（同引用） |
| 6. 压缩 API 请求 | `runSideQuery` → OpenAI SDK | SDK 内部序列化请求体 |
| 7. 流式响应 chunk 累积 | `pipeline.ts:129` | **`collectedGeminiResponses[]` 收集每个 chunk** |
| 8. Logging 层再收集 | `loggingContentGenerator.ts:398` | **`responses[]` 第二份 chunk 收集** |
| 9. 构造 extraHistory | line 366-393 | 新数组 spread `historyToKeep` |

压缩窗口期内**同时存在**：
- 原 `GeminiChat.history`（1×）
- `curatedHistory` 深拷贝（1×）
- 2× `JSON.stringify` 临时字符串
- 压缩 API 请求体（OpenAI SDK 序列化）
- 2× 流式 chunk 数组
- 新构造的 `extraHistory`

**峰值约稳态历史的 3-5 倍**。

### 10.4 双重 `JSON.stringify` 的特别浪费

```typescript
// chatCompressionService.ts:297-304
const compressCharCount = historyToCompress.reduce(
  (sum, c) => sum + JSON.stringify(c).length, 0,    // 序列化每个 Content
);
const totalCharCount = historyForSplit.reduce(
  (sum, c) => sum + JSON.stringify(c).length, 0,    // 再次序列化（包含 historyToCompress 全部）
);
```

仅为了一个 size 校验做 O(2N) 序列化。对 200K token 历史而言，每次 stringify 都会产生数 MB 的临时字符串。

### 10.5 与已知场景的对比

| 维度 | #4116 原 | #4116 Kieaer | #2868 | #2945 | **#4167** |
|------|---------|-------------|-------|-------|----------|
| 触发 | idle | n/a | active 流式 | `/resume` | **`/compress`** |
| 堆峰值 | 2 GB | **45 GB** | 2 GB | 4 GB | 2 GB |
| 时长 | 50 min | 7 h | **100 秒** | 220 秒 | 3.3 h |
| 模型 | deepseek-v4-pro | n/a | qwen coder-model | qwen-oauth | **glm-5** |
| 上下文窗口 | 1M | n/a | n/a | n/a | **200K** |
| 栈帧关键 | `ValueDeserializer::ReadValue` | OpenSSL/TLS | regular V8 | `BIO_ssl_shutdown` | **regular MinorGC** |
| 推断分类 | Scenario A (structuredClone) | Scenario B (real leak) | Scenario B | A+B | **Scenario C (peak)** |

### 10.6 关键启示

`#4167` 用户使用的是 **200K 上下文窗口模型**，理论上稳态远低于 1M 模型。但 **3.3 小时**累积的工具调用结果 + 压缩窗口的 3-5 倍峰值放大，足以耗尽 2GB 默认堆。

这说明**压缩本身是 OOM 的高风险时刻**，需要单独优化：

### 10.7 针对 Scenario C 的修复（增量、可独立合并）

**S0 — 消除双重 `JSON.stringify`**（最低成本，最直接收益）:
```typescript
// 单趟扫描：先算 compressCount，再借助闭包对剩余部分累加
let compressCount = 0;
let keepCount = 0;
for (const c of historyForSplit) {
  const len = JSON.stringify(c).length;
  if (idx < splitPoint) compressCount += len;
  else keepCount += len;
}
const totalCount = compressCount + keepCount;
```

或者**完全跳过 size 校验**：用条目数阈值代替（`historyToCompress.length / historyForSplit.length < MIN_FRACTION`）。

**S1 — `getHistoryReadonly(true)` 接口**:
压缩流程只读历史，不应该 `structuredClone`。新增只读接口避免这次拷贝。

**S2 — 内部调用绕过 chunk accumulator**:
对于 `runSideQuery` 这类内部调用（promptId 标记为 internal），跳过 `collectedGeminiResponses[]` 与 `responses[]` 累积。当前 `loggingContentGenerator.ts:397` 已有 `isInternal` 判断但仍然累积——应改为完全跳过。

**S3 — `extraHistory` 构造改为 push**:
```typescript
const newHistory: Content[] = [
  { role: 'user', parts: [{ text: summary }] },
  { role: 'model', parts: [{ text: 'Got it...' }] },
];
if (keepNeedsContinuationBridge) newHistory.push({ role: 'user', parts: [...] });
for (const item of historyToKeep) newHistory.push(item);
// 替代当前的 [...spread...] + [...spread] 模式
```

### 10.8 已发布评论

- [#4167 详细分析](https://github.com/QwenLM/qwen-code/issues/4167#issuecomment-4458237121)
