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
