# AbortSignal MaxListenersExceededWarning 调查报告

**日期**: 2026-05-14
**调查人**: jinye
**影响范围**: qwen-code 长会话场景

---

## 1. 现象

用户在使用 qwen-code 进行长会话时，控制台出现 Node.js 警告：

```
(node: 20668) MaxListenersExceededWarning:
Possible EventTarget memory leak detected.
1509 abort listeners added to [AbortSignal].
MaxListeners is 1500.
```

该警告在会话持续一段时间后出现，表明某个 `AbortSignal` 实例上注册了超过 1500 个 `abort` 事件监听器。

---

## 2. 总结

qwen-code 的 agent 层采用多层 `AbortController` 嵌套设计来实现取消传播。每一层子 controller 都会在父级 signal 上注册一个 `abort` 监听器。在长会话中（数百轮模型调用），**父级长生命周期的 signal 上监听器不断累积**，最终超过 Node.js 的默认上限触发警告。

这不是真正的内存泄漏——监听器在每轮结束时会被清理——但累积速度超过了 Node.js 的检测阈值。

---

## 3. 调查步骤

### 3.1 定位 AbortSignal 相关代码

全局搜索 `AbortSignal`/`AbortController` 引用，发现非测试文件中有 60+ 处使用。同时搜索 `setMaxListeners`，发现仅 `pipeline.ts:36` 有一处已有修复。

### 3.2 分析 AbortController 层级结构

通过代码阅读，梳理出完整的 signal 传播链：

**Interactive 路径：**

```
masterAbortController (会话级，agent-interactive.ts:60)
  └─ roundAbortController (每轮消息级，agent-interactive.ts:153)
       └─ 内层 roundAbortController (每次模型调用级，agent-core.ts:591)
            └─ 各 tool/hook 的 abort 监听
```

**Headless 路径：**

```
externalSignal (外部传入)
  └─ abortController (执行级，agent-headless.ts:229)
       └─ 内层 roundAbortController (同上)
```

每一层都通过 `addEventListener('abort', ...)` 在父级 signal 上注册监听器。

### 3.3 git blame 确认作者

| 文件 & 行 | 代码 | 作者 | 提交时间 | Commit |
|---|---|---|---|---|
| `agent-interactive.ts:60` | `masterAbortController = new AbortController()` | tanzhenxin | 2026-02-21 | `d4cfb18f79` |
| `agent-interactive.ts:153-157` | `roundAbortController` + 监听注册 | tanzhenxin | 2026-02-21 | `d4cfb18f79` |
| `agent-core.ts:589-593` | 内层 `roundAbortController` + 监听注册 | tanzhenxin | 2026-02-19 | `e968483a8a` |
| `agent-headless.ts:228-234` | `abortController` + `externalSignal` 监听 | tanzhenxin | 2026-02-19 | `e968483a8a` |
| `pipeline.ts:35-36` | `setMaxListeners(0, signal)`（已有修复） | Shaojin Wen | 2026-04-20 | `52c7a3d0ed` |

### 3.4 累积机制分析

以 `masterAbortController.signal` 为例：

- 每次用户发送消息 → `agent-interactive.ts:157` 注册一个 `onMasterAbort` 监听器
- 每次模型循环迭代 → `agent-core.ts:593` 注册一个 `onParentAbort` 监听器
- 虽然每轮结束时会清理，但在长会话中数百轮循环后，累积量超过 1500

代码注释（`agent-core.ts:589-590`）已经意识到了这个问题：

> *"Create a new AbortController per round to avoid listener accumulation in the model SDK."*

但这只解决了向下传播给 model SDK 的问题，没有解决向上在父级 signal 上的累积。

### 3.5 已有修复参考

`pipeline.ts:35-37` 中 Shaojin Wen 已为 OpenAI 请求路径做了相同问题的修复：

```typescript
function raiseAbortListenerCap(signal: AbortSignal | undefined): void {
  if (signal) setMaxListeners(0, signal);
}
```

注释说明这些 signal 是 per-request 短生命周期的，累积是结构性的而非泄漏，因此直接取消上限。

---

## 4. 结论

### 根因

agent 层四处 `AbortController` 创建点缺少 `setMaxListeners(0, signal)` 调用。每层子 controller 在父级 signal 上注册监听器，长会话中累积超过 Node.js 默认的 EventTarget 监听器上限。

### 影响

- 控制台产生 `MaxListenersExceededWarning` 警告，对用户产生困扰
- 不影响功能正确性（监听器会被正常清理，不是真正的内存泄漏）
- 不影响性能（EventTarget 监听器管理是 O(1) 操作）

### 建议修复

在四处 `AbortController` 创建点之后添加 `setMaxListeners(0, signal)`，与 `pipeline.ts:36` 的做法一致：

```typescript
import { setMaxListeners } from 'node:events';

// agent-interactive.ts — 构造函数中，masterAbortController 创建后
setMaxListeners(0, this.masterAbortController.signal);

// agent-interactive.ts:153 — roundAbortController 创建后
this.roundAbortController = new AbortController();
setMaxListeners(0, this.roundAbortController.signal);

// agent-core.ts:591 — 内层 roundAbortController 创建后
const roundAbortController = new AbortController();
setMaxListeners(0, roundAbortController.signal);

// agent-headless.ts:229 — abortController 创建后
const abortController = new AbortController();
setMaxListeners(0, abortController.signal);
```

`setMaxListeners(0, ...)` 的第一个参数 `0` 表示不限制监听器数量，仅对指定的 signal 实例生效，不影响全局设置。

---

## 附录：关键文件索引

| 文件 | 关键行 | 说明 |
|---|---|---|
| `packages/core/src/agents/runtime/agent-interactive.ts` | L60 | `masterAbortController` 创建 |
| `packages/core/src/agents/runtime/agent-interactive.ts` | L153-157 | `roundAbortController` 创建 + 监听注册 |
| `packages/core/src/agents/runtime/agent-core.ts` | L589-593 | 内层 `roundAbortController` 创建 + 监听注册 |
| `packages/core/src/agents/runtime/agent-headless.ts` | L228-234 | `abortController` 创建 + `externalSignal` 监听 |
| `packages/core/src/core/openaiContentGenerator/pipeline.ts` | L35-37 | 已有的 `setMaxListeners` 修复参考 |
