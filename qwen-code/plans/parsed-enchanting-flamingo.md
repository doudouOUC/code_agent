# Plan: 补全 `qwen-code.llm_request` span 缺失属性（v2 — 审计修正版）

## Context

排查 session `ccb6e187` 卡住问题时，发现 `llm_request` span 缺少 DashScope request ID、模型停止原因等关键元数据，无法跨系统关联。这些数据在 logging 事件（`ApiResponseEvent`）中已采集，但没同步到 OTel span。

## 属性清单（审计后 6 个，砍掉 2 个）

| 属性 | GenAI semconv dual | 来源 |
|------|-------------------|------|
| `response_id` | `gen_ai.response.id` | `firstResponseId` |
| `finish_reason` | `gen_ai.response.finish_reasons`（**数组**） | streaming loop 里追踪的 `lastFinishReason` |
| `thoughts_token_count` | `gen_ai.usage.reasoning_tokens` | `lastUsageMetadata.thoughtsTokenCount` |
| `subagent_name` | — | `subagentNameContext.getStore()`（入口捕获） |
| `error_type` | `error.type` | `getErrorType(lastError)` |
| `error_status_code` | — | `getErrorStatus(lastError)` |

**砍掉的**：
- ~~`total_token_count`~~ — `input + output` 可推导，加了有一致性风险
- ~~`response_model`~~ — converter 里 `modelVersion` 复制的是请求模型名，跟现有 `qwen-code.model` 重复且误导。converter 修复作为独立 issue

## 实现

### 1. 扩展 `LLMRequestMetadata`

**文件**: `packages/core/src/telemetry/session-tracing.ts:52-95`

```typescript
export interface LLMRequestMetadata {
  // ... existing fields ...
  responseId?: string;
  finishReason?: string;
  /**
   * Reasoning/thinking token count. For OpenAI-compatible providers,
   * this value is already INCLUDED in outputTokens (candidatesTokenCount).
   * Do not sum with outputTokens to avoid double-counting.
   * The converter does not subtract reasoning_tokens from completion_tokens.
   */
  thoughtsTokenCount?: number;
  subagentName?: string;
  errorType?: string;
  errorStatusCode?: number;
}
```

### 2. 更新 `endLLMRequestSpan` 写入新属性

**文件**: `packages/core/src/telemetry/session-tracing.ts`，在 `endAttributes` 构建逻辑中（~line 515-564）追加：

```typescript
if (metadata.responseId !== undefined) {
  endAttributes['response_id'] = metadata.responseId;
  endAttributes['gen_ai.response.id'] = metadata.responseId;
}
if (metadata.finishReason !== undefined) {
  endAttributes['finish_reason'] = metadata.finishReason;
  endAttributes['gen_ai.response.finish_reasons'] = [metadata.finishReason]; // 数组，per semconv
}
if (metadata.thoughtsTokenCount !== undefined) {
  endAttributes['thoughts_token_count'] = metadata.thoughtsTokenCount;
  endAttributes['gen_ai.usage.reasoning_tokens'] = metadata.thoughtsTokenCount;
}
if (metadata.subagentName !== undefined) {
  endAttributes['subagent_name'] = metadata.subagentName;
}
if (metadata.errorType !== undefined) {
  endAttributes['error_type'] = metadata.errorType;
  endAttributes['error.type'] = metadata.errorType; // OTel error convention
}
if (metadata.errorStatusCode !== undefined) {
  endAttributes['error_status_code'] = metadata.errorStatusCode;
}
```

### 3. 更新 `loggingContentGenerator.ts` — 5 个调用点

**文件**: `packages/core/src/core/loggingContentGenerator/loggingContentGenerator.ts`

#### 3.0 新增闭包变量（streaming 路径，~line 463-466 区域）

```typescript
let firstResponseId = '';
let firstModelVersion = '';
let lastUsageMetadata: GenerateContentResponseUsageMetadata | undefined;
let errorOccurred = false;
// ↓ NEW
let lastFinishReason: string | undefined;       // 追踪 finishReason，finally 里用
let lastError: unknown;                          // 捕获 error 对象，finally 里提取 type/status
const subagentName = subagentNameContext.getStore(); // 入口捕获，避免 ALS 在 setTimeout/finally 丢失
```

在 streaming for-await loop（~line 516-543）中追加：

```typescript
const candidate = response.candidates?.[0];
if (candidate?.finishReason) {
  lastFinishReason = candidate.finishReason as string;
}
```

在 catch 块（~line 579-606）追加 `lastError = error;`：

```typescript
} catch (error) {
  errorOccurred = true;
  lastError = error;  // ← NEW: 为 finally 保留
  // ... existing logging ...
  throw error;
}
```

#### 3.1 调用点 #1 — 非流式成功（line 285）

```typescript
endLLMRequestSpan(llmSpan, {
  success: true,
  inputTokens: response.usageMetadata?.promptTokenCount,
  outputTokens: response.usageMetadata?.candidatesTokenCount,
  cachedInputTokens: response.usageMetadata?.cachedContentTokenCount,
  durationMs: Date.now() - startTime,
  // NEW
  responseId: response.responseId || undefined,
  finishReason: (response.candidates?.[0]?.finishReason as string) || undefined,
  thoughtsTokenCount: response.usageMetadata?.thoughtsTokenCount,
  subagentName: subagentNameContext.getStore() || undefined,
});
```

#### 3.2 调用点 #2 — 非流式错误（line 301）

```typescript
endLLMRequestSpan(llmSpan, {
  success: false,
  durationMs,
  error: aborted ? API_CALL_ABORTED_SPAN_STATUS_MESSAGE : API_CALL_FAILED_SPAN_STATUS_MESSAGE,
  // NEW
  errorType: getErrorType(error),
  errorStatusCode: getErrorStatus(error),
  subagentName: subagentNameContext.getStore() || undefined,
});
```

#### 3.3 调用点 #3 — 流式创建失败（line 380）

```typescript
endLLMRequestSpan(llmSpan, {
  success: false,
  durationMs,
  error: aborted ? API_CALL_ABORTED_SPAN_STATUS_MESSAGE : API_CALL_FAILED_SPAN_STATUS_MESSAGE,
  // NEW
  errorType: getErrorType(error),
  errorStatusCode: getErrorStatus(error),
  subagentName: subagentNameContext.getStore() || undefined,
});
```

#### 3.4 调用点 #4 — 流式空闲超时（line 503，setTimeout 回调内）

```typescript
endLLMRequestSpan(span, {
  success: false,
  durationMs: Date.now() - startTime,
  error: 'Stream span timed out (idle)',
  // NEW — 用闭包变量，不读 ALS
  responseId: firstResponseId || undefined,
  subagentName: subagentName || undefined,
  // 不传 finishReason（超时 = 没收到完整响应）
});
```

#### 3.5 调用点 #5 — 流式 finally（line 617）

```typescript
endLLMRequestSpan(span, {
  success: !errorOccurred,
  inputTokens: lastUsageMetadata?.promptTokenCount,
  outputTokens: lastUsageMetadata?.candidatesTokenCount,
  cachedInputTokens: lastUsageMetadata?.cachedContentTokenCount,
  ttftMs,
  durationMs: Date.now() - startTime,
  error: errorOccurred
    ? aborted ? API_CALL_ABORTED_SPAN_STATUS_MESSAGE : API_CALL_FAILED_SPAN_STATUS_MESSAGE
    : undefined,
  // NEW
  responseId: firstResponseId || undefined,
  finishReason: lastFinishReason,
  thoughtsTokenCount: lastUsageMetadata?.thoughtsTokenCount,
  subagentName: subagentName || undefined,
  errorType: lastError ? getErrorType(lastError) : undefined,
  errorStatusCode: lastError ? getErrorStatus(lastError) : undefined,
});
```

## 文件清单

| 文件 | 改动 |
|------|------|
| `packages/core/src/telemetry/session-tracing.ts` | 扩展 `LLMRequestMetadata`，更新 `endLLMRequestSpan` |
| `packages/core/src/core/loggingContentGenerator/loggingContentGenerator.ts` | 5 个调用点 + 3 个新闭包变量 |
| `packages/core/src/telemetry/session-tracing.test.ts` | 新属性的 span attribute 验证（跟随 Phase 4a describe block 的模式） |
| `packages/core/src/core/loggingContentGenerator/loggingContentGenerator.test.ts` | 各调用点的 metadata 传递验证；**必须同步更新 `endLLMRequestSpan` mock 的显式类型定义（~line 163-175）**，否则 TS 编译失败 |

## 验证

1. `npm run test -- packages/core/src/telemetry/session-tracing.test.ts`
2. `npm run test -- packages/core/src/core/loggingContentGenerator/loggingContentGenerator.test.ts`
3. 本地启动 qwen-code，发一个带工具调用的 prompt，检查 ARMS trace 中 `llm_request` span 上是否出现 `response_id`、`finish_reason`、`thoughts_token_count`
4. 触发 API 错误（如无效 key），验证 `error_type`、`error_status_code` 出现在 span 上
