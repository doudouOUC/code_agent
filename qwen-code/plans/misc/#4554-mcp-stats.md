# Issue #4554 Section 6: Daemon OTel Metrics & Structured Logs

## Context

`qwen serve` daemon 已经有完整的 traces 覆盖（HTTP 请求 span、bridge 操作 span、W3C trace context 传播），但**没有任何 OTel metrics**。运维无法通过时序数据库监控 daemon 的请求吞吐、延迟分位、session 并发数、错误率等关键运行指标。

本 PR 补全 daemon 的可观测性最后一环：低基数 OTel 指标 + 结构化 log records。

## 设计原则

1. **低基数**：所有 attribute 值域有限（route ≤ 30、status_class ∈ {1xx,2xx,3xx,4xx,5xx}）
2. **零性能影响**：guard check + synchronous `.add(1)` / `.record(v)`
3. **disabled 安全**：所有 recording function 首行 `if (!initialized) return`
4. **bridge 解耦**：扩展现有 `BridgeTelemetry` 接口，不新增独立接口
5. **免疫漂移**：gauge 类指标用 ObservableGauge（直接读源数据），不用 UpDownCounter
6. **复用已有 API**：泛化 `emitDaemonLog` 而非新增函数

---

## 变更清单

| # | 文件 | 改动 |
|---|------|------|
| 1 | `packages/core/src/telemetry/daemon-metrics.ts` | **新增**：所有 daemon metric instruments + recording functions |
| 2 | `packages/core/src/telemetry/daemon-tracing.ts` | 泛化 `emitDaemonLog` 签名（加 options 参数） |
| 3 | `packages/core/src/telemetry/sdk.ts` | Resource attributes 加 `service.instance.id`；shutdown 前 forceFlush metrics |
| 4 | `packages/core/src/telemetry/index.ts` | 导出新函数 |
| 5 | `packages/acp-bridge/src/bridgeOptions.ts` | 扩展 `BridgeTelemetry` 接口加 `metrics?` 子对象 |
| 6 | `packages/acp-bridge/src/bridge.ts` | 在生命周期节点调用 `telemetry.metrics?.xxx()` |
| 7 | `packages/cli/src/serve/server.ts` | HTTP 指标 + SSE 指标 + bridge error 指标 |
| 8 | `packages/cli/src/serve/runQwenServe.ts` | `initializeDaemonMetrics(bridge)` + metrics 实现绑入 telemetry |
| 9 | `packages/core/test/telemetry/daemon-metrics.test.ts` | 单元测试 |

---

## 1. daemon-metrics.ts（新文件）

路径：`packages/core/src/telemetry/daemon-metrics.ts`

### 指标定义

| 指标名 | 类型 | 单位 | Attributes | Bucket Boundaries |
|--------|------|------|-----------|-------------------|
| `qwen-code.daemon.http.request.count` | Counter | — | `route`, `status_class` | — |
| `qwen-code.daemon.http.request.duration` | Histogram | ms | `route` | [1,2,5,10,25,50,100,250,500,1000,2500,5000,10000,30000] |
| `qwen-code.daemon.session.active` | **ObservableGauge** | — | — | — |
| `qwen-code.daemon.session.lifecycle` | Counter | — | `action` (spawn/close/die) | — |
| `qwen-code.daemon.channel.lifecycle` | Counter | — | `action` (spawn/exit), `expected` | — |
| `qwen-code.daemon.prompt.queue_wait` | Histogram | ms | — | [1,5,10,50,100,500,1000,5000,10000,30000,60000] |
| `qwen-code.daemon.prompt.duration` | Histogram | ms | — | [100,500,1000,2500,5000,10000,30000,60000,120000,300000,600000] |
| `qwen-code.daemon.bridge.error.count` | Counter | — | `error_type` | — |
| `qwen-code.daemon.cancel.count` | Counter | — | — | — |
| `qwen-code.daemon.sse.active` | **ObservableGauge** | — | — | — |
| `qwen-code.daemon.process.heap_used` | **ObservableGauge** | bytes | — | — |

### 关键设计决定

**ObservableGauge 替代 UpDownCounter**（审计 #1/#2 修复）：
- `session.active`：回调读 `sessionCountGetter()` — 由 daemon host 在 init 时注入 `() => bridge.sessionCount`
- `sse.active`：读 module-level `activeSseCount` 变量（由 server.ts 维护）
- `process.heap_used`：读 `process.memoryUsage().heapUsed`

这样完全免疫 +1/-1 不配对导致的漂移。

**error_type 基数控制**（审计 #3 修复）：
```typescript
const KNOWN_ERROR_TYPES = new Set([
  'SessionNotFoundError', 'WorkspaceMismatchError', 'InvalidClientIdError',
  'SessionLimitExceededError', 'RestoreInProgressError', 'InvalidSessionScopeError',
  'TrustGateError', 'WorkspaceInitConflictError', 'WorkspaceInitPathEscapeError',
  'WorkspaceInitSymlinkError', 'WorkspaceInitRaceError', 'McpServerNotFoundError',
  'McpServerRestartFailedError', 'PromptDeadlineExceededError',
]);

function normalizeErrorType(err: unknown): string {
  const name = err instanceof Error ? err.name : typeof err;
  return KNOWN_ERROR_TYPES.has(name) ? name : 'unknown';
}
```

### API 接口

```typescript
export interface DaemonMetricsOptions {
  sessionCountGetter: () => number;
  sseCountGetter: () => number;
}

export function initializeDaemonMetrics(options: DaemonMetricsOptions): void;

export function recordDaemonHttpRequest(durationMs: number, route: string, statusCode: number): void;
export function recordDaemonSessionLifecycle(action: 'spawn' | 'close' | 'die'): void;
export function recordDaemonChannelLifecycle(action: 'spawn' | 'exit', expected?: boolean): void;
export function recordDaemonPromptQueueWait(durationMs: number): void;
export function recordDaemonPromptDuration(durationMs: number): void;
export function recordDaemonBridgeError(err: unknown): void;
export function recordDaemonCancel(): void;
```

---

## 2. daemon-tracing.ts — 泛化 `emitDaemonLog`

（审计 #8 修复：不新增函数，泛化现有 API）

```diff
 export function emitDaemonLog(
   body: string,
   attributes: LogAttributes = {},
+  options?: { eventName?: string; severityNumber?: number },
 ): void {
   if (!isTelemetrySdkInitialized()) return;
   try {
     logs.getLogger(SERVICE_NAME).emit({
       body,
       timestamp: new Date(),
       attributes: {
-        'event.name': EVENT_DAEMON_ERROR,
+        'event.name': options?.eventName ?? EVENT_DAEMON_ERROR,
         ...attributes,
       },
+      ...(options?.severityNumber != null
+        ? { severityNumber: options.severityNumber }
+        : {}),
     });
   } catch { /* ... */ }
 }
```

现有唯一调用者（server.ts:4085）不传 options，行为不变。

---

## 3. sdk.ts — Resource 加 `service.instance.id` + shutdown flush

（审计 #7/#4 修复）

### 3a. Resource attributes

在 `createDaemonTelemetryRuntimeConfig` 中（`runQwenServe.ts:98-125`）已有 `getResourceAttributes()` 返回 service.name/version。扩展为：

```diff
   getResourceAttributes() {
     return {
       'service.name': SERVICE_NAME,
       'service.version': cliVersion,
+      'service.instance.id': sessionId, // "daemon:<hash>:<pid>"
     };
   },
```

`sessionId` 已是 `daemon:${daemonWorkspaceHash}:${process.pid}`，天然唯一标识进程 incarnation。

### 3b. Shutdown 前 force flush

在 `runQwenServe.ts` shutdown 路径中，bridge.shutdown() 之前添加：

```diff
+  // Best-effort metrics snapshot before bridge teardown (10s+).
+  try { await forceFlushMetrics(); } catch { /* tolerable */ }
   bridge.shutdown() ...
```

`forceFlushMetrics` 新增于 `sdk.ts`，调用 `metricReader.forceFlush()`。

---

## 4. BridgeTelemetry 扩展（而非新增 BridgeMetrics）

（审计 #5 修复）

路径：`packages/acp-bridge/src/bridgeOptions.ts`

```diff
 export interface BridgeTelemetry {
   captureContext(): unknown;
   runWithContext<T>(captured: unknown, fn: () => Promise<T>): Promise<T>;
   withSpan<T>(operation: string, attributes: BridgeTelemetryAttributes, fn: () => Promise<T>): Promise<T>;
   event(name: string, attributes: BridgeTelemetryAttributes): void;
   injectPromptContext<T extends object>(request: T): T;
+  metrics?: {
+    sessionLifecycle(action: 'spawn' | 'close' | 'die'): void;
+    channelLifecycle(action: 'spawn' | 'exit', expected?: boolean): void;
+    promptQueueWait(durationMs: number): void;
+    promptDuration(durationMs: number): void;
+    cancelled(): void;
+  };
 }
```

---

## 5. bridge.ts 集成

调用点（均用 optional chaining）：

| 位置 | 调用 |
|------|------|
| `createSessionEntry` 成功后 | `telemetry.metrics?.sessionLifecycle('spawn')` |
| `closeSession` 中 `byId.delete` 后 | `telemetry.metrics?.sessionLifecycle('close')` |
| `channel.exited` per-session loop 内 | `telemetry.metrics?.sessionLifecycle('die')` |
| `ensureChannel` spawn 成功 | `telemetry.metrics?.channelLifecycle('spawn')` |
| `channel.exited` handler | `telemetry.metrics?.channelLifecycle('exit', expected)` |
| `sendPrompt` 进入 FIFO 后 queue wait 计算完 | `telemetry.metrics?.promptQueueWait(queueWaitMs)` |
| `sendPrompt` finally block（prompt 完成/取消）| `telemetry.metrics?.promptDuration(Date.now() - dispatchStartMs)` |
| `cancelSession` | `telemetry.metrics?.cancelled()` |

---

## 6. server.ts 集成

### 6a. HTTP 指标（`daemonTelemetryMiddleware`）

```diff
 return (req, res, next) => {
   const route = resolveDaemonTelemetryRoute(req);
-  if (!route) { next(); return; }
+  if (!route) { next(); return; } // GET-only routes 不在 span/metric 范围
+  const startMs = Date.now();
   // ... existing span logic ...
   const finish = () => {
     if (done) return;
     done = true;
     recordDaemonHttpResponse(span, res.statusCode);
+    recordDaemonHttpRequest(Date.now() - startMs, route.route, res.statusCode);
     resolve();
   };
```

### 6b. SSE 连接指标（审计 #4 修复：+1 放在 subscribe 成功后）

```typescript
// module-level
let activeSseCount = 0;
export function getActiveSseCount(): number { return activeSseCount; }

// 在 GET /session/:id/events 路由内，subscribeEvents 成功 + flushHeaders 之后：
activeSseCount++;
res.on('close', () => { activeSseCount--; });
```

ObservableGauge 回调读 `getActiveSseCount()`。

### 6c. Bridge Error 指标（审计 #9 修复：仅 500 路径）

仅在 `sendBridgeErrorImpl` 的 generic 500 fallback 分支（~line 4081）记录：

```diff
+  recordDaemonBridgeError(err);
   recordDaemonError(undefined, err, { ... });
   emitDaemonLog('Daemon bridge error.', { ... });
```

4xx 路径不记录 error 指标（用 HTTP request counter 的 status_class 即可区分）。

---

## 7. runQwenServe.ts 集成

在 `initializeTelemetry(...)` 立即之后：

```typescript
initializeDaemonMetrics({
  sessionCountGetter: () => bridge.sessionCount,
  sseCountGetter: () => getActiveSseCount(),
});
```

扩展 `createDaemonBridgeTelemetry()` 返回值中加 `metrics` 属性：

```typescript
const daemonTelemetry = createDaemonBridgeTelemetry();
// Attach metrics implementations
daemonTelemetry.metrics = {
  sessionLifecycle(action) {
    recordDaemonSessionLifecycle(action);
    emitDaemonLog(`Session ${action}.`, {
      'qwen-code.workspace.hash': daemonWorkspaceHash,
    }, {
      eventName: `qwen-code.daemon.session.${action}`,
      ...(action === 'die' ? { severityNumber: 13 /* WARN */ } : {}),
    });
  },
  channelLifecycle(action, expected) {
    recordDaemonChannelLifecycle(action, expected);
    emitDaemonLog(
      action === 'spawn' ? 'ACP channel spawned.' : `ACP channel exited (expected=${expected}).`,
      { 'qwen-code.daemon.channel.expected': expected ?? true },
      {
        eventName: `qwen-code.daemon.channel.${action}`,
        ...(!expected && action === 'exit' ? { severityNumber: 13 } : {}),
      },
    );
  },
  promptQueueWait(durationMs) {
    recordDaemonPromptQueueWait(durationMs);
  },
  promptDuration(durationMs) {
    recordDaemonPromptDuration(durationMs);
  },
  cancelled() {
    recordDaemonCancel();
  },
};
```

**注意**：`initializeDaemonMetrics` 中的 `sessionCountGetter` 引用 `bridge`，而 bridge 在后面创建。解决：用 lazy getter 模式 —— ObservableGauge callback 在 export 周期（10s）才首次被调用，此时 bridge 已存在。或者将 getter 注册改为 bridge 创建后调用 `registerDaemonGaugeCallbacks({ sessionCount: () => bridge.sessionCount, ... })`。

推荐后者（更清晰）：

```typescript
// 先初始化 counters/histograms
initializeDaemonMetrics();

// bridge 创建后注册 gauge callbacks
const bridge = createHttpAcpBridge({ ... });
registerDaemonGaugeCallbacks({
  sessionCount: () => bridge.sessionCount,
  sseCount: () => getActiveSseCount(),
  heapUsed: () => process.memoryUsage().heapUsed,
});
```

---

## 8. 结构化 Log Records

通过泛化后的 `emitDaemonLog(body, attrs, { eventName, severityNumber })` 发出：

| Event Name | 触发点 | Severity |
|------------|--------|----------|
| `qwen-code.daemon.session.spawn` | session 创建 | INFO (9) |
| `qwen-code.daemon.session.close` | session 正常关闭 | INFO (9) |
| `qwen-code.daemon.session.die` | channel exit 导致 session 死亡 | WARN (13) |
| `qwen-code.daemon.channel.spawn` | ACP 子进程启动 | INFO (9) |
| `qwen-code.daemon.channel.exit` | ACP 子进程退出 | INFO/WARN |

所有 log records 自动继承当前 span 的 trace_id / span_id。

---

## 9. 基数分析

| Attribute | 值域上界 |
|-----------|---------|
| `route` | ~25 (resolveDaemonTelemetryRoute 输出) |
| `status_class` | 5 |
| `error_type` | 15 (allowlist) + 1 (unknown) = 16 |
| `action` | spawn/close/die/exit = 4 |
| `expected` | 2 |

**最大 fan-out**: HTTP counter = 25 × 5 = 125 series。总计 < 200 series。

---

## 10. 测试策略

### daemon-metrics.test.ts

- mock `getMeter()` 返回的 Meter 对象
- 验证 `initializeDaemonMetrics()` 创建正确 instrument（name, unit, boundaries）
- 验证初始化前 recording functions 是 no-op
- 验证 `recordDaemonHttpRequest` 计算 statusClass 正确
- 验证 `recordDaemonBridgeError` 的 error_type 归一化（allowlist → 名字，其他 → 'unknown'）
- 验证 `registerDaemonGaugeCallbacks` 的 ObservableGauge callback 正确读取 getter
- 验证重复 init 不创建重复 instrument

### bridge.ts 集成测试

- mock `telemetry.metrics`
- 验证 spawn/close/die/cancel 各触发对应方法
- 验证 `metrics` 为 undefined 时不抛异常（optional chaining）

---

## 验证

```bash
cd packages/core && npx vitest run test/telemetry/daemon-metrics.test.ts
cd packages/acp-bridge && npx vitest run src/bridge.test.ts
npm run build
```

---

## 审计修复追踪

| 审计发现 | 修复措施 | 状态 |
|---------|---------|------|
| UpDownCounter 漂移 | 改用 ObservableGauge | ✅ 已纳入 |
| error_type 无界基数 | allowlist + 'unknown' 兜底 | ✅ 已纳入 |
| Histogram bucket 不适配 | 显式 explicitBucketBoundaries | ✅ 已纳入 |
| SSE +1 泄漏 | subscribe 成功后才 +1 | ✅ 已纳入 |
| 接口冗余 | 合并入 BridgeTelemetry.metrics | ✅ 已纳入 |
| emitDaemonStructuredLog 重复 | 泛化 emitDaemonLog | ✅ 已纳入 |
| 进程 incarnation 不可区分 | service.instance.id | ✅ 已纳入 |
| Error 计数含 4xx | 仅 500 路径 | ✅ 已纳入 |
| 缺 prompt duration | 新增 histogram | ✅ 已纳入 |
| 缺 heap gauge | 新增 ObservableGauge | ✅ 已纳入 |
| shutdown flush | bridge.shutdown 前 forceFlush | ✅ 已纳入 |

## Final Implementation Status

- **PR status**: MERGED — PR #4749 "feat(telemetry): add daemon OTel metrics and structured log records" merged 2026-06-05. Issue #4554 remains OPEN (broader OTel tracking issue).
- **Summary**: Daemon OTel metrics and structured logs were implemented as planned. The PR touched 9 files matching the plan's change list closely: new `daemon-metrics.ts` + test, extended `daemon-tracing.ts`, `sdk.ts`, bridge integration in `bridgeOptions.ts` and `bridge.ts`, and server/runQwenServe integration.
- **Key divergences**: The implementation appears faithful to the plan. All 11 metric instruments (counters, histograms, ObservableGauges) were included. The `BridgeTelemetry.metrics` optional sub-object pattern was used as designed. The two-phase init pattern (counters first, gauge callbacks after bridge creation) was adopted.
- **Files actually changed**: `packages/core/src/telemetry/{daemon-metrics.ts,daemon-metrics.test.ts,daemon-tracing.ts,index.ts,sdk.ts}`, `packages/acp-bridge/src/{bridge.ts,bridgeOptions.ts}`, `packages/cli/src/serve/{runQwenServe.ts,server.ts}`
