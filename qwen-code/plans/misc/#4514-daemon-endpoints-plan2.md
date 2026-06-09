# Plan: Daemon HTTP Rate Limiting (Issue #4514 T3.4)

## Context

`qwen serve` daemon 没有任何 HTTP 级别的请求限流。现有的容量限制（maxSessions=20、maxConnections=256、SSE subscriber cap=64/session）是硬资源上限，不是速率控制。恶意或失控客户端可以无限速发请求耗尽 daemon 资源。

目标：实现分层 token-bucket 速率限制，可通过 CLI flags 配置，默认关闭以兼容现有部署。

## 设计决策

- **自定义实现**，不依赖 `express-rate-limit`（传递依赖不稳定）
- **连续滴注 Token bucket**：`tokens = min(max, tokens + elapsed * rate)`，不是固定窗口批量重置
- **默认关闭**（`--rate-limit` opt-in），不破坏现有部署
- **按 tier 分层**，不设全局限制
- **SSE/health/heartbeat/ACP 免除限流**
- **Fail-open**：rate limiter 内部异常时 `next()`，不返回 500
- **日志采样**：first + 1/100 sample，防攻击时日志爆炸

## 分层设计

| Tier | 路由 | 默认限制 (per key/60s) |
|------|------|----------------------|
| `prompt` | `POST .../prompt` | 10 |
| `mutation` | 其他 POST/DELETE/PATCH（session CRUD、workspace 操作等） | 30 |
| `read` | 所有 GET（除 exempt） | 120 |
| exempt | `GET /health`、`GET /demo`、`POST .../heartbeat`、`GET .../events`、`/acp`、OPTIONS | 无限制 |

## Key 提取策略

- **Loopback**（bind 时判断 `isLoopbackBind(hostname)`）：用 `X-Qwen-Client-Id`，无 header 时回退到 `'anonymous'` 共享桶
- **Non-loopback**：用 `req.socket.remoteAddress`（不用 `req.ip`，不依赖 trust proxy），IPv6 `::ffff:` 前缀规范化为 IPv4。有 client-id 时组合为 `{ip}:{clientId}`
- **Bucket Map 总量硬上限**：10,000 entries，超出时 fail-open（不限流），防止 client-id 爆炸攻击

## Token Bucket 算法细节

```typescript
// 连续滴注，非固定窗口
const rate = max / windowMs; // tokens per ms
const elapsed = Math.max(0, now - bucket.lastRefill); // 防时钟回跳
bucket.tokens = Math.min(max, bucket.tokens + elapsed * rate);
bucket.lastRefill = now;

if (bucket.tokens >= 1) {
  bucket.tokens -= 1;
  next(); // pass
} else {
  const retryAfterMs = Math.ceil((1 - bucket.tokens) / rate);
  res.status(429)...
}
```

## 中间件位置

```
bearerAuth → **rateLimiter** → express.json() → daemonTelemetry → routes
```

在 auth 之后（只计认证过的请求），body parser 之前（被限流的请求不浪费 JSON.parse CPU）。

## GC 策略

- **请求驱动**：每 1000 个请求扫描一次，清除 `lastRefill` 超过 2×windowMs 的 bucket
- **Timer 兜底**：`setInterval(sweep, 5 * 60 * 1000).unref()`，防低流量内存泄漏
- **总量上限**：bucket Map size > 10,000 时 fail-open，不创建新 bucket

## Graceful Shutdown

- 暴露 `setDraining(true)` 方法
- Draining 状态下 rate limiter pass-through 所有请求，让 bridge/route handlers 返回正确的 503

## Factory 返回接口

```typescript
interface RateLimiterInstance {
  middleware: RequestHandler;   // app.use(limiter.middleware)
  reset(): void;                // 清空所有 bucket（测试用）
  setDraining(v: boolean): void; // shutdown 时 pass-through
  dispose(): void;              // clearInterval(gcTimer)，测试/shutdown 清理
}
```
参考 `DeviceFlowRegistry` 模式（`auth/deviceFlow.ts:688-713`）。

## Tier 解析注意事项

- 先 strip trailing slash：`const p = path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path`
- 然后做 `endsWith` 匹配（`/prompt`、`/heartbeat`、`/events`）
- `/acp` 前缀匹配免除
- OPTIONS 方法免除
- `req.path` 不解码 percent-encoding — 不可实际利用但加一行注释

## CLI Flags

| Flag | 类型 | 默认 | 环境变量 |
|------|------|------|---------|
| `--rate-limit` | boolean | false | `QWEN_SERVE_RATE_LIMIT`（解析：`'1'` 或 `'true'`） |
| `--rate-limit-prompt` | number | 10 | `QWEN_SERVE_RATE_LIMIT_PROMPT` |
| `--rate-limit-mutation` | number | 30 | `QWEN_SERVE_RATE_LIMIT_MUTATION` |
| `--rate-limit-read` | number | 120 | `QWEN_SERVE_RATE_LIMIT_READ` |
| `--rate-limit-window-ms` | number | 60000 | `QWEN_SERVE_RATE_LIMIT_WINDOW_MS` |

**启动校验**：每个 limit 必须为正有限整数，window-ms >= 1000。无效值 → stderr error + exit(1)。

## 429 响应格式

```json
{
  "error": "Rate limit exceeded",
  "code": "rate_limit_exceeded",
  "tier": "prompt",
  "retryAfterMs": 12345
}
```
Headers: `Retry-After: <seconds>`（`Math.ceil(retryAfterMs / 1000)` 转换）

RateLimit-Limit/Remaining/Reset headers 仅在 429 响应时返回，不泄露配置。

## 日志策略

- `onLimitReached` 回调采用 sampled logging：同一 key 第一次触发立即记录，之后每 100 次记一条，附带 suppressed count
- 参考 `createDefaultFsAuditEmit` 模式（server.ts:86-107）

## 可观测性

- Rate limit hit 计数暴露到 `GET /health?deep=1` 响应：`{ rateLimitHits: { prompt: N, mutation: N, read: N } }`（最简方案，无需新 metrics 基础设施）
- `GET /capabilities` 只返回 `rate_limit` presence tag，不暴露阈值
- 429 不被 `daemonTelemetryMiddleware` span 覆盖（在其之前返回），通过 access-log middleware 记录 status=429

## 文件变更

| 文件 | 变更 | 说明 |
|------|------|------|
| `packages/cli/src/serve/rateLimit.ts` | NEW | Token bucket 中间件：`createRateLimiter()`、`createKeyExtractor()`、tier 解析、`setDraining()`、`reset()` |
| `packages/cli/src/serve/rateLimit.test.ts` | NEW | 单元测试（连续滴注、tier 分配、key 提取、429 格式、GC、fail-open、draining、bucket 上限） |
| `packages/cli/src/serve/types.ts` | MODIFY | `ServeOptions` 添加 5 个 rate limit 字段 |
| `packages/cli/src/serve/server.ts` | MODIFY | bearerAuth 和 express.json 之间挂载 rate limiter；shutdown 时调 `setDraining(true)` |
| `packages/cli/src/serve/server.test.ts` | MODIFY | 集成测试（启用/禁用、分层独立性、exempt 路由含 /acp、自定义限制、--require-auth 下 anonymous 不可达） |
| `packages/cli/src/commands/serve.ts` | MODIFY | 添加 yargs options + 环境变量回退 + 启动校验 |
| `packages/cli/src/serve/capabilities.ts` | MODIFY | 4 个改动点：registry + AdvertiseFeatureToggles interface + CONDITIONAL_SERVE_FEATURES array + caller in server.ts |

## 实现顺序

1. `rateLimit.ts` — 核心中间件（无依赖）
2. `types.ts` — ServeOptions 字段（无依赖）
3. `capabilities.ts` — feature tag（无依赖）
4. `server.ts` — 挂载中间件 + shutdown draining（依赖 1-3）
5. `serve.ts` — CLI flags + 启动校验（依赖 2）
6. `rateLimit.test.ts` — 单元测试（依赖 1）
7. `server.test.ts` — 集成测试（依赖 1-4）

## 已知限制（documented, not blocking）

- **反向代理**：非 loopback 部署时 `req.socket.remoteAddress` 是代理 IP，所有客户端共享一个桶。需配合 `--rate-limit-trust-proxy` 或 nginx 层限流（future scope）
- **Anonymous 桶共享**：loopback 无 token 时，无 client-id 的请求共享同一个桶。建议配合 `X-Qwen-Client-Id` 使用
- **`0.0.0.0` bind**：所有本地客户端 remoteAddress 都是 `127.0.0.1`，共享一个桶。建议使用 `X-Qwen-Client-Id` 区分
- **Batch endpoints**：`POST /sessions/delete` 计为 1 个 mutation 请求但可触发最多 100 个删除（bounded by maxSessions=20）
- **Window 边界**：连续滴注算法天然平滑，无固定窗口突发翻倍问题
- **Restart 重置**：daemon 重启清空所有 bucket，不做持久化
- **Boot-time only**：limits 不支持运行时热更新，需重启 daemon
- **Client-id bypass**：loopback 上恶意客户端可发唯一 client-id 绕过限流获取 fresh bucket（bucket Map 上限 10,000 后 fail-open）。已认证 loopback 不视为信任边界违规

## SDK 影响（follow-up scope）

- `DaemonClient` 当前无 429 重试逻辑 — `DaemonHttpError` 上暴露 `retryAfterMs` 字段
- 后续可选：opt-in auto-retry for 429 in `DaemonClientOptions`

## 验证

1. `npm run typecheck` — packages/cli
2. `npm run test -- packages/cli/src/serve/rateLimit.test.ts` — 单元测试
3. `npm run test -- packages/cli/src/serve/server.test.ts` — 集成测试
4. 手动测试：
   ```bash
   qwen serve --rate-limit --rate-limit-prompt 2
   # 快速发 3 个 prompt → 第 3 个返回 429
   curl -X POST http://127.0.0.1:4170/session/$SID/prompt \
     -H 'Content-Type: application/json' \
     -d '{"prompt":[{"type":"text","text":"hi"}]}'
   ```
5. 验证 exempt 路由：`/health`、`/acp`、`.../events`、`.../heartbeat` 不被限流
6. 验证 fail-open：人为注入 bucket Map 异常，确认请求正常通过
7. 验证 GC：大量唯一 key 后检查 bucket Map size 不超过上限

## Final Implementation Status

- **PR status**: #4514 (tracking issue) — OPEN. No dedicated implementation PR found for T3.4 (HTTP rate limiting).
- **What was implemented**: This plan (T3.4: daemon HTTP rate limiting) does not appear to have been implemented yet. The tracking issue #4514 remains open as a capability gap backlog item.
- **Key divergences**: Plan was written but implementation has not started or has not been submitted as a PR.
- **Files planned to change**: `packages/cli/src/serve/rateLimit.ts` (new), `packages/cli/src/serve/types.ts`, `packages/cli/src/serve/server.ts`, `packages/cli/src/commands/serve.ts`, `packages/cli/src/serve/capabilities.ts`, `packages/cli/src/serve/rateLimit.test.ts` (new), `packages/cli/src/serve/server.test.ts`
