# GenAI 语义双发 / TTFT / 重试可见性 / 指标与资源属性（深入）

> 子文档；总览见 ../README.md
> 本文 **取代并细化** 总览 `telemetry-observability.md` 的 §3.7（GenAI 语义双发 / TTFT / retry）与 §3.8（资源属性与基数控制），下沉到 function/line 级。
> 代码均基于 `QwenLM/qwen-code@main`（除显式标注分支/PR 外）。引用格式 `file:symbol`（+行号），行号以阅读时的 `main` 为准。
> **OPEN PR 标注**：本文凡涉及 **#4432（Phase 4b retry，OPEN 未合入）** 的符号均显式标注 `【#4432 OPEN】`；其行号以 `gh pr diff 4432` 为准，合入后会漂移。

---

## 概述

本文聚焦 `qwen-code.llm_request` span 的「请求计时与可观测语义」这一条线，四块内容彼此咬合：

1. **TTFT（time-to-first-token）采集**：在流式迭代中捕获「首个用户可见 chunk」的墙钟时延。关键点是**基线（baseline）的语义**——`ttftMs` 从 `generateContentStream` 进入点开始计时（含本次调用的 request setup），是**方法内闭包变量**（绝不能是实例字段），首 token 判定用 `hasUserVisibleContent` 并对 `thought === true` 做了精确修复。
2. **GenAI 语义双发（dual-emit）**：在写私有属性（`input_tokens` / `output_tokens` / `ttft_ms` …）的同时，并行写一份 OTel GenAI 语义约定属性（`gen_ai.*`）。**关键设计：双发只写 span attribute，绝不再发一份 metric counter**——token 计量已由 `loggers.ts:logApiResponse → recordTokenUsageMetrics` 承担一次，再发 counter 就会**双计**。
3. **重试可见性【#4432 OPEN】**：通过 `AsyncLocalStorage`（`retryContext`）把「第几次尝试 / 累计退避 / 累计 setup」从 `retryWithBackoff` 透传到 `LoggingContentGenerator`。核心三处精妙：(a) `iterationCount` **单调计数器**与被 clamp 的 `attempt` 循环变量**解耦**；(b) `onRetry` 三汇（QwenLogger / OTel log / metric counter）；(c) 顺带修复 Phase 4a 的 `sampling_ms` **重复扣减 setup** bug。
4. **指标与资源属性基数控制（#4367）**：`session.id` **默认移出 metrics**（每 session 一个新值→时序无限 fan-out），但 **span/log 永远带**；自定义 resource attributes 解析对 key/value **都 percent-decode**（防 `service%2Eversion` 绕过保留字过滤），保留字 `service.version` / `session.id` 任何用户源都不能覆盖。

一句话串起来：**一次 LLM 请求 = 一个 `llm_request` span**；TTFT/token/gen_ai.\* 都是这个 span 的**属性**；retry 在这个 span 之**上**（每次重试是一个**全新**的 span），靠 ALS 把上下文灌进每个 per-attempt span；只有 token 用量和 retry 次数会另外落 **metric counter**（受基数开关约束）。

---

## 涉及 PR（表格）

| PR | 状态 | 子主题 | 与本文的关系 |
|---|---|---|---|
| **#4417** | MERGED | Phase 4a — TTFT + GenAI 双发 | 引入流式 `ttftMs` 采集（`loggingStreamWrapper` 闭包变量 + `hasUserVisibleContent`）、`endLLMRequestSpan` 的 `gen_ai.*` 双发、派生 `sampling_ms` / `output_tokens_per_second`。本文 TTFT + 双发两节的代码主体。 |
| **#4432** | **OPEN 未合入** | Phase 4b — retry 可见性 | 新增 `utils/retryContext.ts`（ALS）、`retry.ts` 的 `onRetry` + 单调 `iterationCount` + try/catch、`types.ts:ApiRetryEvent`、`loggers.ts:logApiRetry`、`metrics.ts:api.retry.count`、`loggingContentGenerator.ts:snapshotRetryMetadata`，并**修复** `session-tracing.ts` 的 `sampling_ms` 双减 setup bug。本文「重试可见性」整节 + sampling 修复。 |
| **#4367** | MERGED | Resource 属性 + metric 基数 | `resource-attributes.ts` 自定义属性解析、percent-decode 防保留键绕过、`RESERVED_RESOURCE_ATTRIBUTE_KEYS`、`session.id` 移出 metrics 默认（`metrics.ts:getCommonAttributes` + `QWEN_TELEMETRY_METRICS_INCLUDE_SESSION_ID`）、`OTEL_SERVICE_NAME` 逃生口。本文「指标与资源属性」整节。 |
| #4482 | MERGED | 桥接错误信息 + TUI | 与本文弱相关：`logApiRetry` 走 OTel log → `LogToSpanProcessor` 桥接路径时，复用 #4482 的 `formatExportError` / `diagnosticsSink`。 |
| #3893 | MERGED | 敏感属性 opt-in | 弱相关：`logApiResponse` 的 `response_text` 与本文 token 计量同函数；详见 04 子文档。 |
| #4212 / #4302 | MERGED | stream idle 超时 / 一致性 | 相关：`STREAM_IDLE_TIMEOUT_MS` 与 `spanEndedByTimeout` 闸门是 TTFT 闭包所在的 `loggingStreamWrapper` 的防泄漏骨架；#4432 的 `retrySnapshot` 必须穿透这条超时路径。 |

---

## TTFT 捕获

### 1. 数据流与「per-attempt span」前提

TTFT 全部发生在 `core/loggingContentGenerator/loggingContentGenerator.ts` 的流式包装器 `loggingStreamWrapper`（L445）内。要理解 TTFT 的基线语义，必须先确立一个**架构前提**：

- retry 层（`retryWithBackoff`）位于 `LoggingContentGenerator` 之**上**：4 个 LLM 调用点（`client.ts:2105`、`baseLlmClient.ts:235/333`、`geminiChat.ts:2178`）都把 `apiCall = () => contentGenerator.generateContent(...)` 丢进 `retryWithBackoff`。
- 因此**每一次重试都会重新调用 `apiCall()` → 重新进入 `generateContentStream` → 重新 `startLLMRequestSpan` → 一个全新的 `qwen-code.llm_request` span**。不存在「跨多次尝试共享的同一个 span」。
- 推论：TTFT 是**每个 per-attempt span 各自**的「本次尝试首 token 时延」，不是「整条重试链的首 token」。这正是 #4432 设计文档自述「比原计划更丰富的可观测性」的由来。

### 2. `ttftMs` 必须是方法内闭包变量（不能是实例字段）

`loggingContentGenerator.ts:loggingStreamWrapper`（L468–474）：

```ts
// TTFT (time to first token): wall-clock from generateContentStream
// dispatch to the first stream chunk containing user-visible content.
// Method-local closure variable — NEVER an instance field — because
// LoggingContentGenerator is shared across concurrent generateContentStream
// calls (one per ContentGenerator, see contentGenerator.ts:createContentGenerator).
let ttftMs: number | undefined;
```

**为什么不能是实例字段**：`LoggingContentGenerator` 是**单实例**装饰器（每个 ContentGenerator 一个），但同一实例会被多个并发的 `generateContentStream` 调用复用。若 `ttftMs` 放成 `this.ttftMs`，并发流之间会相互覆盖首 token 时间，串值。作为方法内 `let` 闭包变量后，每次 `loggingStreamWrapper` 调用各自持有独立的 `ttftMs`，天然并发安全。这与第 03 子文档「ALS `run` vs `enterWith`」是同一类并发隔离思路，只是这里用的是「闭包变量」这一最轻量手段。

### 3. 基线 = stream 进入点（含本次调用 setup）

`startTime` 在 `generateContentStream` 顶部 L340 捕获（`const startTime = Date.now();`），**早于** `context.with(...)` 包裹的 `this.wrapped.generateContentStream(...)`（L362–373），随后作为参数传入 `loggingStreamWrapper`（L411）。因此 TTFT 基线包含了：

- `addSystemPromptAttributes` / `addToolSchemaAttributes` / `logApiRequest`（L350–369）；
- 真正的 `wrapped.generateContentStream` 网络建链到首 chunk 的时间。

即 **TTFT = 「本次 attempt 的 stream 进入点」→「首个用户可见 chunk」**，含本次调用内的 request setup，但**不含 retry 层的退避 / 失败尝试**（那些发生在 `generateContentStream` 被调用之前，在 `retryWithBackoff` 里）。`span` 的 `startTime`（`session-tracing.ts:startLLMRequestSpan` L380）与这里的 `startTime` 几乎同刻捕获，所以 `duration_ms` 与 `ttftMs` **同基线**——这是后面 `sampling_ms = duration - ttft` 自洽的前提。

> **4b 如何细化**：`requestSetupMs`（retry 层累计 setup）是**另一个维度**的属性，由 retry 层经 ALS 注入（见后文），与 TTFT 基线**正交**、不重叠：TTFT 量「本 attempt stream 内首 token」，`requestSetupMs` 量「进入本 attempt 之前在重试预算里耗了多久」。

### 4. 首 token 判定：`hasUserVisibleContent` 与 `thought === true` 修复

捕获点 `loggingStreamWrapper` L533–535：

```ts
if (ttftMs === undefined && hasUserVisibleContent(response)) {
  ttftMs = Date.now() - startTime;
}
```

判定逻辑集中在 `core/loggingContentGenerator/streamContentDetection.ts`：

- `hasUserVisibleContent(chunk)`（L32）：取 `chunk.candidates?.[0]?.content?.parts`，空则 `false`，否则 `parts.some(isUserVisiblePart)`。
- `isUserVisiblePart(part)`（L38）：命中任一即用户可见——
  - `typeof p.text === 'string' && p.text.length > 0`（非空文本，L47）；
  - `p.functionCall !== undefined`（纯工具调用 chunk 也算，L48）；
  - `p.inlineData !== undefined`（图像/二进制，L49）；
  - `p.executableCode !== undefined`（代码执行，L50）；
  - **`p.thought === true`**（reasoning 内容，L55）。

**`thought === true` 修复（本文重点）**（`streamContentDetection.ts:isUserVisiblePart` L51–55）：

```ts
// `thought` is a boolean flag in this codebase — `true` means the part
// carries reasoning content ... Match strict `=== true`
// rather than checking presence — `thought: false` parts are explicitly NOT user-visible.
if (p.thought === true) return true;
```

为什么必须严格 `=== true` 而不是 `p.thought !== undefined`（存在性检查）：在本代码库里 `thought` 是**布尔 flag**，规范模式是 `loggingContentGenerator.ts` 多处的 `...(part.thought ? { thought: true } : {})`（如 L773、L945）。如果用存在性检查，`thought: false` 的 part（明确「这不是思考内容」）会被误判为用户可见，导致 TTFT 在一个本不该触发的 chunk 上提前打点。strict `=== true` 把 `false` / 缺失都正确地排除在外。

> 设计意图（`streamContentDetection.ts` 顶注 L24–30）：把首 token 判定**集中成一个谓词**，4 个 provider（Anthropic / OpenAI / Gemini / Qwen）在抵达 `LoggingContentGenerator` 前都已把各自原生 chunk 归一化成 `GenerateContentResponse`，因此只需一处判定，不必每个 provider 各写一套。纯 role 元数据 chunk、纯 `usageMetadata`（末尾汇总）chunk、空 parts 都**不算**用户可见，TTFT 不会在它们上触发。

### 5. TTFT 如何穿透「idle 超时 / finally」抵达 `endLLMRequestSpan`

`ttftMs` 闭包变量被 `loggingStreamWrapper` 的 `finally` 块（L607–631）读取并交给 `endLLMRequestSpan`：

```ts
endLLMRequestSpan(span, {
  success: !errorOccurred,
  inputTokens: lastUsageMetadata?.promptTokenCount,
  outputTokens: lastUsageMetadata?.candidatesTokenCount,
  cachedInputTokens: lastUsageMetadata?.cachedContentTokenCount,
  ttftMs,                              // ← 闭包变量
  durationMs: Date.now() - startTime,  // ← 与 ttft 同基线
  ...
});
```

注意 idle 超时路径（L497–509）走的是另一个 `endLLMRequestSpan`（`success:false, error:'Stream span timed out (idle)'`），**不带 ttftMs**——因为超时意味着消费者放弃迭代，首 token 时延已无意义。`spanEndedByTimeout` 闸门（L556/L586/L615）确保 finally 不会对已超时结束的 span 重复打点。【#4432 OPEN】会把 `retrySnapshot` 也灌进这条超时路径（见后文「重试可见性」R2#8）。

---

## GenAI 语义双发

### 1. 双发写在哪：`endLLMRequestSpan` 与 `startLLMRequestSpan`

双发分两处落地，**全部写 span attribute**：

**(a) start 时**（`telemetry/session-tracing.ts:startLLMRequestSpan` L361–369）：

```ts
const attributes: Attributes = {
  'qwen-code.model': model,
  'qwen-code.prompt_id': promptId,
  'llm_request.context': parentCtx ? 'interaction' : 'standalone',
  // Dual-emit OTel GenAI semantic convention (Stable). Private name
  // (qwen-code.model) remains authoritative; gen_ai.* is a compat layer
  'gen_ai.request.model': model,
};
```

**(b) end 时**（`telemetry/session-tracing.ts:endLLMRequestSpan` L390，L410–430）：

| 私有属性（权威） | `gen_ai.*` 双发 | 稳定度 | 单位换算 |
|---|---|---|---|
| `input_tokens` (L411) | `gen_ai.usage.input_tokens` (L413) | Stable | 同值 |
| `output_tokens` (L416) | `gen_ai.usage.output_tokens` (L417) | Stable | 同值 |
| `cached_input_tokens` (L420) | `gen_ai.usage.cached_tokens` (L422) | Experimental | 同值 |
| `ttft_ms` (L426) | `gen_ai.server.time_to_first_token` (L428) | Experimental | **`ttftMs / 1000`（秒，double）** |
| `qwen-code.model` (L362) | `gen_ai.request.model` (L368) | Stable | 同值 |

私有名始终**权威**，`gen_ai.*` 仅为「懂 spec 的后端」提供兼容层。注意 `gen_ai.server.time_to_first_token` 的单位是**秒（double）**，与私有 `ttft_ms`（毫秒，int）不同——这是 OTel GenAI spec 的约定，代码在 L428–429 显式 `/1000`。

### 2. 为什么双发写 attr 而**不发 counter**——避免 token 双计

这是双发最关键的设计决策。**token 的 metric 计量只有一处**：`telemetry/loggers.ts:logApiResponse`（L459）末尾的 4 次 `recordTokenUsageMetrics`（L496–511）：

```ts
recordTokenUsageMetrics(config, event.input_token_count,  { model, type: 'input'  });
recordTokenUsageMetrics(config, event.output_token_count, { model, type: 'output' });
recordTokenUsageMetrics(config, event.cached_content_token_count, { model, type: 'cache'  });
recordTokenUsageMetrics(config, event.thoughts_token_count, { model, type: 'thought' });
```

如果 `endLLMRequestSpan` 的 `gen_ai.usage.*` 双发**再发一份 counter**，那么 token 用量会在 `qwen-code.token.usage` 这个 counter 上被加两次（一次来自 `logApiResponse`，一次来自双发）→ **双计**。所以双发刻意**只停留在 span attribute**：

- span attribute 提供 **per-request 维度**（每个 `llm_request` span 自带 `gen_ai.usage.input_tokens`），后端可按 span 聚合；
- counter 提供 **预聚合时序**（`token.usage{model,type}`），由 `logApiResponse` 唯一承担。

**取舍**：span attribute 不能像 metric 那样被后端预聚合成低基数时序，但避免了计量错误；且 per-request 维度已足够支撑「这次请求用了多少 token」的分析。

### 3. 派生指标：`sampling_ms` 公式 + 除零守卫

`endLLMRequestSpan` 在 token/ttft 之外派生两个属性（`session-tracing.ts` L440–457，**main / Phase 4a 版本**）：

```ts
if (metadata.ttftMs !== undefined) {
  const samplingMs = Math.max(
    0,
    duration - metadata.ttftMs - (metadata.requestSetupMs ?? 0),  // ← Phase 4a 公式（含 bug，见下节）
  );
  endAttributes['sampling_ms'] = samplingMs;
  // 除零守卫：sampling_ms 为 0 或缺 outputTokens 时不发 output_tokens_per_second
  if (samplingMs > 0 && metadata.outputTokens !== undefined) {
    endAttributes['output_tokens_per_second'] =
      Math.round((metadata.outputTokens / (samplingMs / 1000)) * 100) / 100;
  }
}
```

- `sampling_ms` = 「首个可见 chunk → 流结束」的时间，语义上 ≈ 输出 token 的生成耗时。仅当 `ttftMs` 有值时可算。
- **`Math.max(0, ...)`**：clamp 到非负，防时钟漂移 / 测量误差导致负值。
- **除零守卫**（L453）：`output_tokens_per_second = outputTokens / (samplingMs/1000)`，仅在 `samplingMs > 0 && outputTokens !== undefined` 时计算，避免除零产生 `Infinity` 污染后端。结果 `Math.round(... * 100) / 100` 保留两位小数。

> Phase 4a 下 `requestSetupMs` 恒 `undefined`，故 `(metadata.requestSetupMs ?? 0)` 恒减 0，公式表面正确。但这正是 #4432 揭出的潜伏 bug——下一节展开。

---

## 重试可见性【#4432 OPEN，全节标注】

> 本节全部代码来自 **PR #4432（Phase 4b，OPEN 未合入）**，`gh pr diff 4432 --repo QwenLM/qwen-code`。行号以 PR diff 为准，合入后漂移。

### 1. 为什么用 ALS（而非 in-generator accumulator）

#4432 设计文档（`docs/design/telemetry-llm-request-timing-design.md` D4）记录了一段「实现中才发现的事实」：原计划照搬 claude-code「一个 LLM span 拥有整个 retry loop」的模式，但 qwen-code 的 4 个 `retryWithBackoff` 调用点都把 `apiCall = () => contentGenerator.generateContent(...)` 包在外面——**retry 层在 `LoggingContentGenerator` 之上**，每次 attempt 都是全新的 span，没有「跨 attempt 的共享 span」可供累积。

**解法**：用 `AsyncLocalStorage` 把 per-attempt 上下文从 `retryWithBackoff` 透传到 `LoggingContentGenerator`。这套做法对齐代码库既有模式（`promptIdContext` / `subagentNameContext` / `agent-context`），新增面最小。

### 2. ALS 载体：`utils/retryContext.ts`（新增文件）

`utils/retryContext.ts:RetryAttemptContext`（接口）+ `retryContext`（ALS 实例）：

```ts
export interface RetryAttemptContext {
  readonly attempt: number;            // 1-based 单调迭代计数（= iterationCount）
  readonly retryTotalDelayMs: number;  // 本次 attempt 之前所有退避之和；attempt 1 为 0
  readonly requestSetupMs: number;     // retryWithBackoff 进入 → 本 attempt 开始（含前序 attempt 时长 + 退避）
}
export const retryContext = new AsyncLocalStorage<RetryAttemptContext>();
```

三个字段全 `readonly`（不可变快照语义）。

### 3. `retry.ts`：`onRetry` 回调 + 单调 `iterationCount` 与 clamp 后 `attempt` 解耦

**(a) `RetryAttemptInfo` 与 `onRetry` 契约**（`utils/retry.ts`）：

```ts
export interface RetryAttemptInfo {
  attempt: number;       // 1-based 单调 = ALS 的 attempt
  error: unknown;
  errorStatus?: number;
  delayMs: number;       // 本次失败之后的退避时长
}
// RetryOptions 新增：
onRetry?: (info: RetryAttemptInfo) => void;
```

契约（diff 注释明确）：仅在 `await fn()` reject 后的 catch 块里触发，且**在 `retryContext.run()` ALS 帧之外**；所有 retry 上下文数据通过参数 `RetryAttemptInfo` 传，**禁止**在 `onRetry` 内读 `retryContext.getStore()`；content-retry（`shouldRetryOnContent`）**不**触发 `onRetry`；回调抛错被吞并经 `debugLogger.warn` 记录，绝不影响重试行为。

**(b) 单调 `iterationCount` vs 被 clamp 的 `attempt`（本节最精妙处）**：

`retryWithBackoff` 内有两个计数变量（`utils/retry.ts`，diff L213+）：

```ts
const requestEntryTime = Date.now();
let iterationCount = 0;      // 单调：永远反映「这是第 N 次调用 fn」
let retryTotalDelayMs = 0;

while (attempt < maxAttempts) {
  attempt++;
  iterationCount++;
  const requestSetupMs = Date.now() - requestEntryTime;
  try {
    const result = await retryContext.run(
      { attempt: iterationCount, retryTotalDelayMs, requestSetupMs },  // ← ALS 注入用 iterationCount
      () => fn(),
    );
    ...
  } catch (error) {
    ...
    // persistent mode（429 容量等待）分支末尾：
    if (attempt >= maxAttempts) {
      attempt = maxAttempts - 1;   // ← clamp！让 while-loop 永不退出
    }
  }
}
```

`attempt` 在 **persistent mode（429 容量重试）** 下会被 clamp 到 `maxAttempts - 1`，目的是让 while 循环**永不退出**（容量类错误可无限等待）。如果直接用 `attempt` 当对外计数，第 5、6、7… 次尝试都会显示成「第 4 次」，计数失真。`iterationCount` 与循环控制变量 `attempt` **解耦**，永远单调递增，因此 ALS context 的 `attempt` 字段、`ApiRetryEvent.attempt_number`、span 的 `attempt` 属性都用 `iterationCount`，反映真实的「第 N 次」。

**(c) `onRetry` 触发点：两条路径，都先于 sleep、都被 `!signal?.aborted` 守卫、都包 try/catch**：

- persistent 路径（diff L313+）与 normal 路径（diff L342+）各有一处 `onRetry?.({ attempt: iterationCount, error, errorStatus, delayMs })`；
- **守卫 `if (!signal?.aborted)`**：避免在 abort 已触发（不会真正再 retry）的情况下发出「幻影 retry 事件」（diff 测试 `signal.aborted before onRetry: no phantom retry event`）；
- **try/catch 包裹**：回调抛错 `debugLogger.warn` 吞掉，「遥测失败绝不能打断重试循环」；
- 触发在 `await delay(...)` **之前**，让运维者能**实时**看到 retry 事件，而非等退避结束。

**(d) `retryTotalDelayMs` 的累加与一处「故意的不一致」**：content-retry 路径也会 `retryTotalDelayMs += delayWithJitter`（diff L239+），但**不**触发 `onRetry`。diff 注释点明：content-retry 的退避在 `api_retry` 遥测通道里**不可见**（`onRetry` 只从错误 catch 路径触发），但 span 的 `retry_total_delay_ms` 属性**包含全部退避（content + error）**，即「用户在退避里实际等待的总时长」——这是有意为之的口径差异。

### 4. `loggingContentGenerator.ts:snapshotRetryMetadata`——在同步前导里读 ALS

【#4432 OPEN】`LoggingContentGenerator` 侧新增 `snapshotRetryMetadata()`：

```ts
function snapshotRetryMetadata(): {
  attempt: number; requestSetupMs?: number; retryTotalDelayMs?: number;
} {
  const ctx = retryContext.getStore();
  return {
    attempt: ctx?.attempt ?? 1,                 // ← 无 retry context 默认 1（warmup/side-query/direct）
    requestSetupMs: ctx?.requestSetupMs,         // ← 无则 undefined
    retryTotalDelayMs: ctx?.retryTotalDelayMs,
  };
}
```

**调用时机至关重要**——必须在 `generateContent` / `generateContentStream` 的**同步前导**（第一个 `await` 之前）调用：

```ts
async generateContentStream(req, userPromptId) {
  // Phase 4b — snapshot retry context in the synchronous prelude. ...
  // once this function returns the AsyncGenerator, the caller iterates
  // AFTER retryWithBackoff has resolved and the frame has exited.
  const retrySnapshot = snapshotRetryMetadata();
  const llmSpan = startLLMRequestSpan(req.model, userPromptId);
  ...
}
```

原因：流式路径返回的是 `AsyncGenerator`，消费者**迭代它的时候 `retryWithBackoff` 早已 resolve、ALS 帧已退出**。所以不能在迭代时读 ALS（那时读到的是 `undefined`），必须在同步前导读出快照，再把 `retrySnapshot` 作为参数**穿线**进 `loggingStreamWrapper`（diff 新增第 7 个参数 `retrySnapshot`），由闭包带到**所有** `endLLMRequestSpan` 调用点：成功（finally L678）、错误（L426）、**idle 超时（L555，setTimeout 另一个宏任务里触发，diff 测试 R2#8 专门验证）**、abort。非流式路径同理在 L245 读快照、`...retrySnapshot` 展开进成功（L323）与错误（L340）两个 `endLLMRequestSpan`。

`attempt ?? 1` 的默认值设计：让 warmup / side-query / 直连（绕过 `retryWithBackoff`）的请求 `attempt=1`，使「`WHERE attempt=1`」的看板能把这些直连请求一并纳入，而非留空。

### 5. `types.ts:ApiRetryEvent`（新增事件类型）

【#4432 OPEN】`telemetry/types.ts:ApiRetryEvent` 字段：`event.name:'api_retry'`、`model`、`prompt_id?`、`attempt_number`（1-based 单调，对齐 ALS `attempt`）、`error_type?`、`error_message`、`status_code?`、`retry_delay_ms`、`duration_ms`、`subagent_name?`。

两个细节：

- **`duration_ms = retryDelayMs`**（构造函数末尾）：注释说明这个值**不是** attempt 自身的耗时（那在对应 `llm_request` span 的 `duration_ms` 上），而是「这次失败之后的退避窗口」——设为 `retry_delay_ms` 是为了让 `LogToSpanProcessor` 桥接出的 span 在 trace 时间线上**可视化「失败 attempt 与下一次 attempt 之间的 sleep 窗口」**。
- **`subagent_name` 来自 `subagentNameContext.getStore()`**：在调用点（4 个 LLM call site 的 `onRetry`）读取，因为 `subagentNameContext` 在 `retry.ts` 的 catch 块里仍然 active。

与既有 `ContentRetryEvent` 的区分（`types.ts` 注释 + `constants.ts:EVENT_API_RETRY = 'qwen-code.api_retry'`）：`ApiRetryEvent` 是 `retryWithBackoff` 发的 **HTTP 429/5xx** 重试；`ContentRetryEvent`（`EVENT_CONTENT_RETRY = 'qwen-code.chat.content_retry'`）是 `geminiChat` 对 `InvalidStreamError` 的重试，走**独立的重试预算**（`INVALID_CONTENT_RETRY_OPTIONS`，`geminiChat.ts:162`，**不**经 `retryWithBackoff`）。一个 prompt 可能同时触发两类，需按 `prompt_id` 跨事件类型求和才得到总重试次数。

### 6. `loggers.ts:logApiRetry`——三汇 fan-out

【#4432 OPEN】`telemetry/loggers.ts:logApiRetry`：

```ts
export function logApiRetry(config: Config, event: ApiRetryEvent): void {
  QwenLogger.getInstance(config)?.logApiRetryEvent(event);   // 汇1：QwenLogger RUM（阿里云内部）
  if (!isTelemetrySdkInitialized()) return;                  // ← SDK 未初始化：仅 QwenLogger，跳过 2/3
  const attributes: LogAttributes = {
    ...getCommonAttributes(config),                          // ← loggers 的 getCommonAttributes：日志永远带 session.id
    ...event,
    'event.name': EVENT_API_RETRY,
  };
  const logger = logs.getLogger(SERVICE_NAME);
  logger.emit({ body: `API retry attempt ${event.attempt_number} for ${event.model} (status ${event.status_code ?? 'unknown'}).`, attributes });  // 汇2：OTel log → LogToSpanProcessor 桥接
  recordApiRetry(config, { model: event.model });            // 汇3：metric counter
}
```

三个汇出口：

1. **QwenLogger RUM**（`qwen-logger.ts:logApiRetryEvent`，diff 新增）：阿里云内部统计，即使 SDK 未初始化也会发。
2. **OTel log signal**（`logger.emit`）：被 `LogToSpanProcessor` 拾取桥接成 span。注释强调这个桥接 span 是挂在**调用方当前 active span（通常是 interaction 或 tool）下的兄弟节点，而非失败的 LLM span**——因为 `onRetry` 触发时那个 `llm_request` span 已经结束了。
3. **`recordApiRetry` counter**（见下节）。

**注意两个 `getCommonAttributes` 的分野**（本文与基数控制咬合的关键）：
- 汇2 用的是 `loggers.ts:getCommonAttributes`（L126），**永远** `{ 'session.id': config.getSessionId() }`——日志走 trace/log 关联，必须带 session.id。
- 汇3 的 counter 用的是 `metrics.ts:baseMetricDefinition.getCommonAttributes`（L62），**默认不带** session.id（见下一大节）。

### 7. `metrics.ts:recordApiRetry` / `api.retry.count`

【#4432 OPEN】`telemetry/metrics.ts`：

```ts
const API_RETRY_COUNT = `${SERVICE_NAME}.api.retry.count`;  // 'qwen-code.api.retry.count'
// COUNTER_DEFINITIONS[API_RETRY_COUNT].attributes = { model: string }  ← 仅 model 标签
export function recordApiRetry(config, attributes /* {model} */): void {
  if (!apiRetryCounter || !isMetricsInitialized) return;
  apiRetryCounter.add(1, {
    ...baseMetricDefinition.getCommonAttributes(config),  // ← session.id 受开关（默认无）
    ...attributes,
  });
}
```

counter 只用 `{model}` 作为业务标签（让运维者画**每模型重试率**），叠加 `getCommonAttributes`（默认只有空对象，session.id opt-in）。这是**有意的低基数设计**——retry counter 不能因 session.id 而 fan-out。

### 8. sampling_ms 重复扣减 setup 修复（4b 顺带修复 4a 的潜伏 bug）

【#4432 OPEN】`telemetry/session-tracing.ts:endLLMRequestSpan` 把公式从

```ts
// Phase 4a（含 bug）：
const samplingMs = Math.max(0, duration - metadata.ttftMs - (metadata.requestSetupMs ?? 0));
```

改为

```ts
// Phase 4b（修复）：
const samplingMs = Math.max(0, duration - metadata.ttftMs);
```

**bug 根因**（diff 注释详述）：`duration_ms = Date.now() - spanCtx.startTime`，而 `spanCtx.startTime` 在 `startLLMRequestSpan` 运行时捕获——那是在 `requestSetupMs` 那段开销**已经过去之后**。所以 span 的 `duration_ms` 只覆盖 `ttft + sampling`，**从不包含前置的 setup**。再减一次 `setup` 是错的。

- Phase 4a 下 `requestSetupMs` 恒 `undefined`，`?? 0` 把 bug 掩盖了（减 0）；
- Phase 4b 一旦用累计 retry 开销填充 `requestSetupMs`，旧公式会对**每个被重试过的请求**把 `sampling_ms` clamp 到 0 → **正好在运维者最需要的时候**（发生了重试）抹掉输出吞吐数据。

修复后：`request_setup_ms`（L432）、`attempt`（L435）、`retry_total_delay_ms`（L438）仍作为**各自独立**的属性输出——运维者能同时看到「重试开销」与「采样时间」，互不干扰。对应测试 `session-tracing.test.ts` 从「`requestSetupMs:300` → sampling 500」改判为「→ sampling 800」（diff）。

### 9. `LLMRequestMetadata` 字段语义的前后变化

【#4432 OPEN】`session-tracing.ts:LLMRequestMetadata`（L46）的三个字段在 4b 中**重新定义了语义**（接口本身在 main 已前向声明，恒 `undefined`）：

| 字段 | Phase 4a（main）语义 | Phase 4b 语义 |
|---|---|---|
| `requestSetupMs` | 「成功 attempt 之前的总耗时（含失败重试）」 | 「`retryWithBackoff` 进入 → **本** attempt 开始」；成功 span 上即「成功前总重试开销」，失败 span 上即「此刻已耗在重试预算里的累计时间」 |
| `attempt` | 「最终 attempt 号，1=无重试」 | 「1-based 单调，由 `LoggingContentGenerator` 从 `retryContext` 读，无 context 时默认 1」 |
| `retryTotalDelayMs` | 「成功前退避之和，0=无重试」 | 「**本** attempt 之前退避之和，attempt 1 为 0，无 context 时 undefined」 |

语义从「整条链的终态」变成「**per-attempt 视角**」，与「每 attempt 一个 span」的架构前提一致。

---

## 指标与资源属性（#4367）

### 1. `session.id` 的三态分野：span/log 永远带，metric 默认不带，Resource 永远禁

这是「关联性」与「基数成本」的精确分界，落在三个不同的 `getCommonAttributes` / Resource 构造点：

| 载体 | session.id 策略 | 代码 |
|---|---|---|
| **span** | 永远带（trace 关联） | session-tracing.ts 各 span（经 session 根 context 共享 traceId） |
| **log** | 永远带（log 关联） | `loggers.ts:getCommonAttributes`（L126）：恒 `{ 'session.id': config.getSessionId() }` |
| **metric** | **默认不带**，opt-in | `metrics.ts:baseMetricDefinition.getCommonAttributes`（L62） |
| **Resource** | **永远禁**（保留字） | `resource-attributes.ts:RESERVED_RESOURCE_ATTRIBUTE_KEYS`（L22）+ `sdk.ts` destructure 剥离（L196–201） |

`metrics.ts:getCommonAttributes`（L62–68）：

```ts
getCommonAttributes: (config: Config): Attributes => {
  const out: Attributes = {};
  if (config.getTelemetryMetricsIncludeSessionId()) {  // 默认 false
    out['session.id'] = config.getSessionId();
  }
  return out;
},
```

**为什么 metric 默认不带 session.id**：每个 session 是一个**新值**，metric 默认带它会让每个时序按 session.id **无限 fan-out**（基数爆炸，后端成本失控）。需要 session 级 metric 切片的运维者通过 `QWEN_TELEMETRY_METRICS_INCLUDE_SESSION_ID` 环境变量或 `telemetry.metrics.includeSessionId` 显式开启。

**为什么 Resource 永远禁 session.id**（`resource-attributes.ts` L13–25 注释）：**Resource 属性会自动附着到每一个 metric data point**。如果 session.id 上了 Resource，就会**绕过上面的 metric 基数开关**——无论开关怎么设，每个 metric 点都会带 session.id。所以 session.id 是保留字，任何用户源都不能把它写进 Resource。

开关取值链（`telemetry/config.ts:resolveTelemetrySettings` L173–176 → `config/config.ts:getTelemetryMetricsIncludeSessionId` L3029）：

```ts
const metricsIncludeSessionId =
  parseBooleanEnvFlag(env['QWEN_TELEMETRY_METRICS_INCLUDE_SESSION_ID']) ??  // 环境变量优先
  settings.metrics?.includeSessionId ??                                     // 再 settings.json
  false;                                                                    // 默认关
```

### 2. 自定义 resource attributes 解析 + percent-decode 防保留键绕过

`resource-attributes.ts:parseOtelResourceAttributes`（L59）按 W3C Baggage 格式（`key1=v1,key2=v2`）解析 `OTEL_RESOURCE_ATTRIBUTES`，**容错**：坏 pair 跳过 + `diag.warn`，绝不阻断启动；重复 key last-write-wins。

**percent-decode 防保留键绕过（本节重点）**（L82–96）：

```ts
// Keys are also percent-encoded per the OTel/W3C spec. If we did not
// decode them, a key like `service%2Eversion` would land verbatim and
// miss the RESERVED filter — collectors that decode keys downstream
// could then resurrect `service.version` and bypass reserved-key
// protection. Decode key + value identically.
let key: string;
try { key = decodeURIComponent(rawKey); } catch { /* warn + 用 raw */ }
let value: string;
try { value = decodeURIComponent(valueRaw); } catch { /* warn + 用 raw */ }
```

key 与 value **都** `decodeURIComponent`。**如果只 decode value 不 decode key**：用户传 `service%2Eversion=evil`（`%2E` 是 `.`）时，本进程的保留字过滤（匹配 `service.version`）看到的是字面 `service%2Eversion`，**匹配不上**→放行；但下游 collector 若做 key 解码，就会**复活** `service.version`，绕过保护、伪造版本。两侧同样 decode 杜绝了这条绕过路径。

### 3. 保留字与纵深防御

`resource-attributes.ts:RESERVED_RESOURCE_ATTRIBUTE_KEYS`（L22）= `{ 'service.version', 'session.id' }`：

- `service.version`：防版本伪造（telemetry 完整性）；
- `session.id`：见上节（防绕过 metric 基数开关）。
- `service.name` **不在**保留集——它走自己的优先级链（`OTEL_SERVICE_NAME` 逃生口）。

三道防线：

1. **resolver 层**（`telemetry/config.ts` L143–158）：`stripReservedResourceAttributes` 对 env 源与 settings 源**各剥一次**，drop 累积到 `resourceAttributeWarnings`。
2. **类型 coerce**（`resource-attributes.ts:coerceStringResourceAttributes` L143）：settings.json 可手改，非 string 值 drop + warn，空/纯空白 key 跳过。
3. **SDK 层纵深防御**（`sdk.ts:initializeTelemetry` L196–213）：构造 Resource 时再 destructure 剥离 `service.name` / `service.version` / `session.id`，应对「绕过 resolver 直接构造 Config」的调用方（如测试）。随后用 runtime 值重新注入 `service.name`（`userServiceName?.trim() || SERVICE_NAME`）与 `service.version`（`config.getCliVersion()`）。

### 4. `OTEL_SERVICE_NAME` 逃生口 + 合并优先级

`telemetry/config.ts` L159–171：

```
OTEL_RESOURCE_ATTRIBUTES（最低）  <  settings.telemetry.resourceAttributes（key 冲突时胜）
                                  <  OTEL_SERVICE_NAME（覆盖 service.name 一切来源）
```

`OTEL_SERVICE_NAME` 先 `.trim()`（L165），纯空白视为未设（否则 Resource 上会出现空白 service name，部分后端拒收）。

### 5. 用户可见的一次性汇总告警

所有 drop/coerce 经 `warn()`（`resource-attributes.ts` L36）**同时**进 `diag.warn`（→ debug log 文件）**和** `resourceAttributeWarnings` 数组。因为 `diag.warn` 只进 debug log、用户看不到静默丢弃，所以 `sdk.ts:initializeTelemetry`（L223–233）在启动时把数组**一次性 `console.warn` 汇总**（此时 Ink TUI 尚未渲染，不会与界面交错）。

### 6. 自定义属性基数 = 运维责任

`parseOtelResourceAttributes` / `coerceStringResourceAttributes` **不对属性数量设上界**——只做保留字过滤与类型校验。即自定义 resource attributes 的基数控制是**运维者的责任**：写进 Resource 的每个属性都会附着到所有 metric data point，运维者若塞入高基数自定义属性（如把 user id 写成 resource attr）会自食基数爆炸，框架不代为兜底（与 session.id 这种**框架已知的高基数键**强制保护形成对照）。

---

## 时序图

### 图 1：一次带 1 次 429 重试的流式 LLM 请求（TTFT 标记 → onRetry → span attr 双发 → metric）

```mermaid
sequenceDiagram
    autonumber
    participant Caller as geminiChat.ts<br/>retryWithBackoff
    participant ALS as retryContext (ALS)【#4432】
    participant LCG as LoggingContentGenerator
    participant ST as session-tracing.ts<br/>endLLMRequestSpan
    participant LOG as loggers.ts<br/>logApiRetry / logApiResponse
    participant MET as metrics.ts (counter)

    Note over Caller: attempt=1, iterationCount=1<br/>requestSetupMs=0, retryTotalDelayMs=0
    Caller->>ALS: retryContext.run({attempt:1, setup:0, delay:0}, apiCall)【#4432】
    ALS->>LCG: generateContentStream()
    Note over LCG: 同步前导 snapshotRetryMetadata()<br/>→ {attempt:1,...}【#4432】
    LCG->>ST: startLLMRequestSpan → span#1<br/>(gen_ai.request.model)
    LCG-->>Caller: 抛 429（wrapped 拒绝）
    LCG->>ST: endLLMRequestSpan(span#1,{success:false, ...retrySnapshot})

    Note over Caller: catch: errorStatus=429, 算 delayMs<br/>!signal.aborted 守卫 + try/catch
    Caller->>LOG: onRetry → logApiRetry(ApiRetryEvent{attempt_number:1, status:429})【#4432】
    LOG->>LOG: 汇1 QwenLogger / 汇2 OTel log(桥接 span)
    LOG->>MET: 汇3 recordApiRetry{model} (session.id 默认无)【#4432】
    Note over Caller: sleep(delayMs); retryTotalDelayMs += delayMs

    Note over Caller: attempt=2, iterationCount=2<br/>requestSetupMs=X(累计), retryTotalDelayMs=delayMs
    Caller->>ALS: retryContext.run({attempt:2, setup:X, delay:delayMs}, apiCall)【#4432】
    ALS->>LCG: generateContentStream()
    Note over LCG: snapshotRetryMetadata() → {attempt:2, setup:X, delay:delayMs}【#4432】
    LCG->>ST: startLLMRequestSpan → span#2
    Note over LCG: 首个可见 chunk(hasUserVisibleContent)<br/>→ ttftMs = now - startTime
    LCG->>LOG: logApiResponse → recordTokenUsageMetrics (token 唯一计量处)
    LCG->>ST: endLLMRequestSpan(span#2,{success:true, ttftMs, tokens, ...retrySnapshot})
    Note over ST: 双发 gen_ai.usage.* / gen_ai.server.time_to_first_token<br/>sampling_ms = max(0, dur - ttft) 【4b 修复，不减 setup】<br/>output_tokens_per_second（除零守卫）
    ST-->>Caller: 返回结果
```

要点：trace 里出现**两个** `qwen-code.llm_request` span（span#1 失败 attempt=1、span#2 成功 attempt=2），外加一个 `LogToSpanProcessor` 桥接出的 `api_retry` span（挂在 interaction/tool 下，非失败 LLM span 下）；`api.retry.count` counter +1；token 只在 span#2 的 `logApiResponse` 处计入 `token.usage` counter 一次。

### 图 2：属性按载体路由（session.id 三态 + 自定义 resource attrs 基数）

```mermaid
flowchart TB
  subgraph IN["输入源"]
    ENV["OTEL_RESOURCE_ATTRIBUTES<br/>(env, percent-encoded)"]
    SET["settings.telemetry.resourceAttributes"]
    SVC["OTEL_SERVICE_NAME"]
    SID["config.getSessionId()"]
  end

  subgraph PARSE["resource-attributes.ts + telemetry/config.ts"]
    DEC["parseOtelResourceAttributes<br/>decodeURIComponent(key & value)<br/>防 service%2Eversion 绕过"]
    STRIP["stripReservedResourceAttributes<br/>RESERVED={service.version, session.id}"]
    COERCE["coerceStringResourceAttributes<br/>非 string drop + warn"]
  end

  subgraph OUT["载体（session.id 三态）"]
    SPAN["span：永远带 session.id<br/>(trace 关联)"]
    LOGZ["log：永远带 session.id<br/>loggers.getCommonAttributes L126"]
    METRIC["metric：默认不带<br/>baseMetricDefinition L62<br/>QWEN_TELEMETRY_METRICS_INCLUDE_SESSION_ID opt-in"]
    RES["Resource：永远禁 session.id<br/>sdk.ts destructure L196 纵深防御<br/>(否则附着每个 metric point→绕过开关)"]
  end

  ENV --> DEC --> STRIP
  SET --> COERCE --> STRIP
  SVC -. 覆盖 service.name 一切来源 .-> RES
  STRIP --> RES
  SID --> SPAN
  SID --> LOGZ
  SID -. opt-in .-> METRIC
  SID -. 保留字拦截 .-x RES

  STRIP -. drop/coerce 累积 .-> WARN["resourceAttributeWarnings<br/>→ sdk.ts 启动一次性 console.warn"]
```

---

## 边界与错误处理

| 场景 | 行为 | 代码 |
|---|---|---|
| 非流式请求 / 首 token 前 abort | `ttftMs` 为 `undefined`，不算 `sampling_ms` / `output_tokens_per_second` | `session-tracing.ts` L425/L445（`ttftMs !== undefined` 守卫） |
| `sampling_ms === 0`（clamp / 无采样） | 不发 `output_tokens_per_second`（除零守卫） | `session-tracing.ts` L453 |
| `outputTokens` 缺失 | 不发 `output_tokens_per_second` | `session-tracing.ts` L453 |
| stream idle 5min 无 chunk | `endLLMRequestSpan({success:false, error:'Stream span timed out (idle)'})`，置 `stream.timed_out`，`spanEndedByTimeout` 闸住后续 success/error | `loggingContentGenerator.ts` L497–509 / L556 / L586 / L615 |
| `endLLMRequestSpan` 重复调用 | `ended` 幂等守卫直接 return | `session-tracing.ts` L396 |
| `LoggingContentGenerator` 并发流 | `ttftMs` 方法内闭包变量，互不串值 | `loggingContentGenerator.ts` L474 |
| **【#4432】** `onRetry` 回调抛错 | try/catch 吞掉 + `debugLogger.warn`，不打断重试循环 | `retry.ts`（diff catch 块） |
| **【#4432】** abort 在 catch 与 onRetry 之间触发 | `!signal?.aborted` 守卫，不发幻影 retry 事件 | `retry.ts`（diff `if (!signal?.aborted)`） |
| **【#4432】** SDK 未初始化时 `logApiRetry` | 仅 QwenLogger（RUM）发，跳过 `logger.emit` 与 counter | `loggers.ts:logApiRetry`（`if (!isTelemetrySdkInitialized()) return`） |
| **【#4432】** 无 retry context（warmup/直连） | `snapshotRetryMetadata` 默认 `attempt=1`，setup/delay 留 `undefined` | `loggingContentGenerator.ts:snapshotRetryMetadata` |
| **【#4432】** persistent mode（429）attempt clamp | `iterationCount` 单调不受 clamp 影响，ALS/事件用它 | `retry.ts`（diff `iterationCount` vs `attempt`） |
| resource attr percent-encoding 非法 | catch + `warn`，回退 raw key/value，不阻断启动 | `resource-attributes.ts` L88–106 |
| resource attr 坏 pair（无 `=`） | 跳过 + warn（提示 `%2C` 编码逗号） | `resource-attributes.ts` L69–78 |
| settings resource attr 非 string | drop + warn | `resource-attributes.ts:coerceStringResourceAttributes` L165–173 |

---

## 关键设计决策与权衡

1. **TTFT 用方法内闭包变量而非实例字段**：`LoggingContentGenerator` 单实例被并发流复用，实例字段会串值。闭包变量是最轻量的并发隔离（无需 ALS）。取舍：每个 stream wrapper 调用独立，但 TTFT 无法跨调用复用（本就不该复用）。

2. **dual-emit 写 span attr 而非 counter，杜绝双计**：token counter 已由 `logApiResponse → recordTokenUsageMetrics` 唯一承担；`gen_ai.usage.*` 只停在 span attribute。取舍：失去 metric 预聚合能力，换取计量正确 + per-request 维度。

3. **【#4432】retry 上下文用 ALS 而非 in-generator accumulator**：retry 层在 `LoggingContentGenerator` 之上、每 attempt 一个全新 span，没有共享 span 可累积。ALS 对齐既有 `promptIdContext` / `subagentNameContext` 模式。取舍：ALS 跨异步边界传播需在同步前导读快照（流式生成器迭代时 ALS 帧已退出），实现上多一层 `snapshotRetryMetadata` + 参数穿线。

4. **【#4432】`iterationCount` 与 `attempt` 解耦**：persistent mode 把循环变量 `attempt` clamp 在 `maxAttempts-1` 以维持无限容量重试，单调 `iterationCount` 才是真实「第 N 次」。取舍：两个计数变量增加阅读成本，换取对外计数语义正确。

5. **【#4432】`onRetry` 先于 sleep、守卫 abort、try/catch 吞错**：让运维者实时看到 retry；避免幻影事件；遥测失败绝不打断重试。取舍：retry 事件时间戳早于实际「下次尝试」时刻（语义上是「失败 + 决定退避」时刻）。

6. **【#4432】`sampling_ms` 不再减 setup**：`duration_ms` 自 span start 计、本就不含前置 setup，再减是双扣。修复前会对每个被重试请求把 sampling clamp 到 0。取舍：`request_setup_ms` 改为**独立属性**，运维者各自看重试开销与采样时间。

7. **session.id 三态（span/log 带、metric 默认不带、Resource 禁）**：精确切分关联性与基数成本。Resource 禁是因为 Resource 属性自动附着每个 metric point，会绕过 metric 开关。取舍：默认无法按 session 切 metric，需 opt-in。

8. **percent-decode key 防保留键绕过**：key/value 同样 decode，杜绝 `service%2Eversion` 在下游 collector 复活。取舍：极少数本意带字面 `%` 的 key 需双重编码。

9. **自定义 resource attrs 不设数量上界**：基数控制是运维责任，框架只强制保护已知高基数键（session.id）。取舍：运维者可能自伤基数，但框架不臆测用户意图。

---

## 已知限制 / 后续

1. **#4432 未合入**：`requestSetupMs` / `attempt` / `retryTotalDelayMs` 在 `main` 上**前向声明但恒 `undefined``（`session-tracing.ts:LLMRequestMetadata` L72–88）。当前 `main` 的 trace 无法体现「一次逻辑请求内部重试了几次、退避总耗时多少」，也没有 `api.retry.count` / `ApiRetryEvent`。注意 `main` 上 `sampling_ms` 仍是含 `- (requestSetupMs ?? 0)` 的旧公式（L448）——因 `requestSetupMs` 恒 undefined 而**暂未暴露**，#4432 合入并填充该字段后若没有同时合入公式修复，会对每个被重试请求把 `sampling_ms` clamp 到 0。两者必须同 PR 合入（#4432 diff 确实把二者放在一起）。

2. **content-retry 在 `api_retry` 通道不可见**【#4432】：`geminiChat` 的 `InvalidStreamError` 重试（`ContentRetryEvent` / `EVENT_CONTENT_RETRY`）走独立预算、不触发 `onRetry`，因此 `api.retry.count` 与 `ApiRetryEvent` **不含** content 重试。运维者要得到「每 prompt 总重试数」需按 `prompt_id` 跨 `api_retry` + `content_retry` 两类事件求和。span 的 `retry_total_delay_ms` 倒是含 content 退避（口径不一致，diff 注释已点明为有意）。

3. **`gen_ai.*` 部分属性为 Experimental**：`gen_ai.usage.cached_tokens` / `gen_ai.server.time_to_first_token` 在 OTel GenAI semconv 里仍是 Experimental，未来可能改名（`session-tracing.ts` L421/L427 注释）。私有名权威可对冲此风险，但依赖 `gen_ai.*` 的看板需关注 spec 演进。

4. **TTFT 与 claude-code 口径不同**：qwen-code 的 TTFT 是「首个用户可见 chunk」，claude-code 是 Anthropic `message_start` 元数据事件（`session-tracing.ts` L66–69 注释）。跨工具对比 TTFT 数值需注意口径差异。

5. **自定义 resource attrs 基数无上界**：见「关键设计决策」第 9 点——高基数自定义属性会拖垮 metric 后端，框架不兜底。

6. **桥接 span 仅在特定路由可达**：`logApiRetry` 汇2 的 OTel log 经 `LogToSpanProcessor` 桥接成 span，但该桥接在默认配置下不可达（见 01 子文档 #3779 死代码问题）；直连 logs 后端时 `api_retry` 以 LogRecord 形态落地，不会有桥接 span。

---

## 测试覆盖

| 测试文件 | 覆盖点 |
|---|---|
| `session-tracing.test.ts`（main + #4432 改动） | `sampling_ms = dur - ttft`（不减 setup，4b 改判 500→800）；`requestSetupMs=300` 仍单独输出 `request_setup_ms`；`ttft > duration` 时 clamp 到 0（时钟漂移） |
| `streamContentDetection.test.ts`（隐含，#4417） | `hasUserVisibleContent` 对 text/functionCall/inlineData/executableCode/`thought===true` 命中；纯 role/usageMetadata/空 parts 不命中 |
| `loggingContentGenerator.test.ts`【#4432】 | 非流式/流式转发 `attempt/requestSetupMs/retryTotalDelayMs` 给 `endLLMRequestSpan`；无 retry context 默认 `attempt=1`、setup/delay `undefined`；**idle 超时路径（R2#8）**：`setTimeout` 另一宏任务触发的 `endLLMRequestSpan` 也带 `retrySnapshot`（fake timers 推进 6min 验证 `attempt=4`） |
| `retry.test.ts`【#4432】 | `retryContext.attempt` 跨 attempt 单调 `[1,2,3]`；`requestSetupMs`/`retryTotalDelayMs` attempt1 为 0、后续 >0；首次成功 `attempt=1` 且 `onRetry` 不触发；`onRetry` 每失败一次触发一次、参数正确；缺 `onRetry` 静默；`onRetry` 抛错不破坏循环；中途 `shouldRetryOnError=false` 不为放弃触发 `onRetry`；**并发**两个 `retryWithBackoff` 各自独立计数；**嵌套**读最内层帧；**persistent mode(429)** `onRetry` 用单调计数 + 指数退避；`Retry-After` 头派生 `delayMs=2000`；`signal.aborted` 阻止幻影事件 |
| `loggers.test.ts`【#4432】 | `logApiRetry` 三汇 fan-out（QwenLogger / `logger.emit` body+attrs / `recordApiRetry{model}`）；带 `subagent_name`；SDK 未初始化仅 QwenLogger |
| `resource-attributes.test.ts`（#4367，隐含） | `parseOtelResourceAttributes` 容错/percent-decode/坏 pair；`stripReservedResourceAttributes` 剥保留字；`coerceStringResourceAttributes` 非 string drop |

> 【#4432 OPEN】标注的测试均来自 PR diff，尚未进入 `main`。
