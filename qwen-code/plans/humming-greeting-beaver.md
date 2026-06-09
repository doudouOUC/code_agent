# Per-Prompt TraceId 实现方案

## Context

当前所有 span 通过 `deriveTraceId(sessionId)` 共享一个 session 级别的 traceId。长 session 产生上千 span 堆在一条 trace 里，ARMS/Jaeger 无法渲染。Daemon 模式更严重：整个进程生命周期共享一个 traceId。

**目标**：每个 prompt/interaction 产生独立的 traceId（trace root），用 `session.id` attribute 做跨 prompt 关联。

**基准分支**：main

## 核心设计决策

| 决策 | 选择 |
|---|---|
| interaction span parent | `ROOT_CONTEXT`（不再 parent 到 session root） |
| traceId 生成 | OTel SDK 的 `RandomIdGenerator` 自动分配 |
| session.id 关联 | 所有 span 通过新增 `SessionIdSpanProcessor` 自动打 `session.id` |
| session root context | 废弃（`getSessionContext()` 返回 `undefined`） |
| orphaned span（auto-title 等） | 自动成为独立 trace root，通过 `session.id` attribute 关联 |
| LogToSpanProcessor fallback | 保持 `deriveTraceId(sessionId)` 作为 orphaned log 的 catch-all |
| debugLogger | fallback 到 `deriveTraceId(getCurrentSessionId())` 保持日志可 grep |

## 改动文件清单

### 1. `packages/core/src/telemetry/session-tracing.ts` — 核心改动

**`startInteractionSpan` (line 296)**:
```typescript
// Before:
const sessionCtx = getSessionContext() ?? otelContext.active();

// After:
const sessionCtx = ROOT_CONTEXT;
```

传 `ROOT_CONTEXT` 让 OTel SDK 为 interaction span 生成全新 traceId。parentbased sampler 对 root span 默认走 `always_on` delegate，采样行为正确。

**`resolveParentContext` (line 135-144)** — 移除 `getSessionContext()` fallback，简化：
```typescript
function resolveParentContext(parent: SpanContext | undefined): Context {
  if (parent) {
    return trace.setSpan(otelContext.active(), parent.span);
  }
  return otelContext.active();
}
```

移除 `getSessionContext` import（该文件中唯一用法在这两处）。

### 2. `packages/core/src/telemetry/sdk.ts` — 去掉 session root + 注册 SessionIdSpanProcessor

**`initializeTelemetry` (line 549)**:
```typescript
// Before:
setSessionContext(createSessionRootContext(sessionId), sessionId);
// After:
setSessionContext(undefined, sessionId);
```

**`refreshSessionContext` (line 564)**:
```typescript
// Before:
setSessionContext(createSessionRootContext(sessionId), sessionId);
// After:
setSessionContext(undefined, sessionId);
```

**新增 `SessionIdSpanProcessor`**，注册到 SDK 的 `spanProcessors` 数组中：
```typescript
class SessionIdSpanProcessor implements SpanProcessor {
  onStart(span: Span): void {
    const sessionId = getCurrentSessionId();
    if (sessionId) {
      span.setAttribute('session.id', sessionId);
    }
  }
  onEnd(): void {}
  async shutdown(): Promise<void> {}
  async forceFlush(): Promise<void> {}
}
```

在 `NodeSDK` 构造时加入：
```typescript
spanProcessors: [
  new SessionIdSpanProcessor(),
  ...(spanExporter ? [new BatchSpanProcessor(spanExporter)] : []),
],
```

这样所有 span（包括 auto-instrumented HTTP span、`withSpan` 产生的 orphan span）都自动带 `session.id`。interaction span 自己也打了一遍 `session.id`（line 286），但值相同，无害。

移除 `createSessionRootContext` import。

### 3. `packages/core/src/telemetry/tracer.ts` — 简化 parent resolution

**`getParentContext` (line 81-87)**:
```typescript
// Before:
function getParentContext(): Context {
  const active = context.active();
  if (trace.getSpan(active)) { return active; }
  return getSessionContext() ?? active;
}

// After:
function getParentContext(): Context {
  return context.active();
}
```

**`createSessionRootContext` (line 260-270)**: 标记 `@deprecated`，保留导出（`LogToSpanProcessor` 不依赖它，只依赖 `trace-id-utils.ts` 的 `deriveTraceId`）。

移除 `getSessionContext` import。

### 4. `packages/core/src/utils/debugLogger.ts` — fallback 改造

**`getSessionRootTraceContext` (line 96-108)**:
```typescript
function getSessionRootTraceContext(): TraceContext | null {
  try {
    const sessionId = getCurrentSessionId();
    if (sessionId) {
      return { traceId: deriveTraceId(sessionId), spanId: '0'.repeat(16) };
    }
    return null;
  } catch {
    return null;
  }
}
```

新增 import: `deriveTraceId` from `../telemetry/trace-id-utils.js`，`getCurrentSessionId` from `../telemetry/session-context.js`。
移除 `getSessionContext` import（如果之前有的话）。

### 5. `packages/core/src/telemetry/log-to-span-processor.ts` — 不改

现有逻辑自然适配：
- 有 active span 时 → 取 interaction span 的 per-prompt traceId（priority 1）
- 无 active span 时 → `deriveTraceId(sessionId)` 作为 catch-all（priority 2）

### 6. `packages/core/src/telemetry/session-context.ts` — 不改

接口不变，`sessionRootContext` 在运行时始终为 `undefined`。

### 7. `packages/core/src/telemetry/trace-id-utils.ts` — 不改

`deriveTraceId` 保留，仍被 `LogToSpanProcessor` 和 `debugLogger` 使用。

## 测试更新策略

### 需要修改的测试

| 文件 | 修改点 |
|---|---|
| `tracer.test.ts` | `getParentContext` 相关：不再 fallback to session root；`createSessionRootContext` 测试保留（函数仍导出） |
| `session-tracing.test.ts` | interaction span 不再继承 session traceId；验证每次 startInteractionSpan 产生不同 traceId |
| `sdk.test.ts` | `initializeTelemetry` 不再调 `createSessionRootContext`；`refreshSessionContext` 同理；新增 `SessionIdSpanProcessor` 测试 |

### 新增测试

1. **traceId 隔离**：连续两次 `startInteractionSpan` → 两个不同 traceId
2. **child span 继承**：interaction 内的 LLM/tool span 与 interaction 共享 traceId
3. **SessionIdSpanProcessor**：验证 `onStart` 自动打 `session.id`，无 sessionId 时不打
4. **orphaned span**：无 interaction 时 span 成为独立 trace root 且带 `session.id`

## 验证方式

```bash
# 1. 单测
npm run test -- --filter telemetry

# 2. 类型检查
npm run typecheck

# 3. 集成验证（本地，可选）
OTEL_TRACES_EXPORTER=console TELEMETRY_ENABLED=true npx qwen --print "hello"
# 观察：interaction span 有独立 traceId，LLM span 共享该 traceId，所有 span 带 session.id
```

## Migration / 兼容性

- **ARMS 查询**：`traceId = SHA256(sessionId)[:32]` → 改为 `attribute.session.id = <sessionId>`
- **共存期**：老/新 session 在 ARMS 中自然共存，无需 feature flag
- **`qwen-trace-query` skill**：后续更新查询逻辑
- **debug log 格式**：保持 `[trace_id=...]`，值为 `deriveTraceId(sessionId)`（仅用于 grep）
