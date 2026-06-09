# Plan: Daemon Server Request Logging

## Context

Daemon server 当前几乎没有请求级日志。`DaemonLogger` 已经存在（`daemonLogger.ts`），但 `server.ts` 里除了 `sendBridgeError` 的 5xx 路径外，没有任何 `daemonLog.info(...)` 调用。当前端报告 `/recap` 无返回时，后端完全没有日志可以排查——不知道请求是否到达、是否处理中超时、还是返回了 `null`。

## Approach: Request Logging Middleware + Key Route Inline Logs

### 1. 添加请求日志中间件

在 `packages/cli/src/serve/server.ts` 的 `createServeApp` 中，JSON body parser (line 764) 之后、第一个 route (line 799 `GET /capabilities`) 之前，注册 access-log 中间件。

**技术实现：**
- 使用 `res.on('finish')` hook（响应发送完成后触发）
- 从 `req.path` 用正则 `/\/session\/([^/]+)/` 提取 sessionId（因为 app-level middleware 中 `req.params` 为空）
- 从 `req.headers['x-qwen-client-id']` 提取 clientId
- 用 `Date.now()` 计算请求耗时

**日志格式（单行）：**
```
2026-05-28T10:30:00.000Z [INFO] [DAEMON] route=POST:/session/abc/recap sessionId=abc clientId=xyz status=200 durationMs=45 request completed
```

**排除规则：**
- `GET /health` — 高频健康检查，刷屏
- `GET /session/:id/events` — SSE 长连接，单独用 inline 日志记录开/关

**日志级别：**
- 2xx/3xx → `daemonLog.info`
- 4xx → `daemonLog.warn`
- 5xx → `daemonLog.info`（error 细节已由 `sendBridgeError` 记录，access log 只记 timing + status）

**容错：** middleware 内部 try-catch，logging 异常不应导致请求失败。

### 2. 关键路由补充 inline 日志

在以下路由的成功路径中，用 `daemonLog.info(...)` 补充业务上下文（这些信息 middleware 无法感知）：

| Route | 补充日志 | 目的 |
|-------|---------|------|
| `POST /session/:id/recap` | `recap=null` vs `recap generated (len=xxx)` | 区分"模型没返回"和"请求没到" |
| `POST /session/:id/prompt` | `prompt enqueued promptId=xxx` | 关联 promptId 到日志 |
| `POST /session` | `session spawned/attached id=xxx` | 确认 session 创建成功 |
| `POST /session/:id/cancel` | `cancel sent` | 确认取消请求已转发 |
| `POST /session/:id/shell` | `shell command completed exitCode=x` | 不记录命令内容 |
| `GET /session/:id/events` | open: `SSE stream opened`; close: `SSE stream closed durationMs=xxx` | SSE 生命周期 |

### 3. 文件变更

仅修改 **`packages/cli/src/serve/server.ts`**：
- 在 line ~776（JSON error handler 之后）插入 access-log middleware (~25 行)
- 在 6 个 route handler 中添加 inline 日志 (~30 行)

不需要修改 `daemonLogger.ts`。

## Verification

1. `npx tsc --noEmit -p packages/cli/tsconfig.json` 类型检查
2. `npx jest packages/cli/src/serve/server.test.ts` 现有测试不 break（middleware guards on `!daemonLog`）
3. 手动测试：启动 daemon → 发 `/recap` → 确认 daemon log 文件有 access + inline 日志
