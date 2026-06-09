# Plan: 从 BFF 获取 telemetry 开关写入 workspace settings.json

## Context

当前 qwen-code 的 `telemetry.enabled` 需要手动在 `~/.qwen/settings.json` 中配置为 `true` 才能生效（`packages/opencode/src/qwen/env.ts:130`）。没有任何代码自动设置这个值。需要新增一个 BFF 调用，在 `fetchQwenToken` 流程中获取 telemetry 开关并写入 workspace settings.json。

## BFF 接口

- **路径**: `GET ${bffBaseUrl}/lsp/enableQwenCodeOpentelemetry`
- **Base URL**: 直接拼在 `resolveBffBaseUrl()` 返回值后面（同 `/bff_v1/newPersonalToken`）
- **返回**: `{ requestId: string, data: boolean, code: 200, message: null }`

## 改动方案

### 文件: `packages/app/src/context/frontend-hooks-lib.ts`

#### 1. 新增 `fetchTelemetryEnabled` 函数

在 `fetchQwenToken` 附近新增一个 best-effort 的辅助函数：

```typescript
async function fetchTelemetryEnabled(bffBaseUrl: string): Promise<boolean | null> {
  try {
    const res = await fetch(`${bffBaseUrl}/lsp/enableQwenCodeOpentelemetry`, {
      method: "GET",
      credentials: "include",
    })
    if (!res.ok) return null
    const result = await res.json()
    if (result.code !== 200 || typeof result.data !== "boolean") return null
    return result.data
  } catch {
    return null
  }
}
```

- Best-effort：接口失败不阻塞 token 流程，返回 `null` 表示跳过
- 不需要 CSRF header（同 token 请求模式）

#### 2. 在 `fetchQwenToken` 中调用并写入 settings.json

在 `fetchQwenToken()` 中，`mergeSettingsJson()` 返回 `merged` 对象后、`writeFileViaServer()` 写入前，调用 `fetchTelemetryEnabled` 并将结果写入 `merged.telemetry.enabled`：

```typescript
// 获取 telemetry 开关（best-effort，不阻塞 token 流程）
const telemetryEnabled = await fetchTelemetryEnabled(bffBaseUrl)
if (telemetryEnabled !== null) {
  const existingTelemetry = (merged.telemetry ?? {}) as Record<string, unknown>
  merged.telemetry = { ...existingTelemetry, enabled: telemetryEnabled }
}
```

- 保留现有 `telemetry` 下的其他字段（如 `otlpEndpoint`、`regionEndpoints` 等）
- `telemetryEnabled` 为 `null` 时不修改（接口失败则保持现有配置不变）
- 放在 `mergeSettingsJson()` 之后、`writeFileViaServer()` 之前

#### 3. 可选优化：与 token 请求并发

`fetchTelemetryEnabled` 和 token fetch 无依赖关系，可以用 `Promise.all` 并发请求节省时间。但鉴于代码简洁性，先串行实现，后续需要可优化。

## 关键文件

- `packages/app/src/context/frontend-hooks-lib.ts` — 主改动文件（`fetchQwenToken` 函数 + 新增 `fetchTelemetryEnabled`）
- `packages/opencode/src/qwen/env.ts:118-131` — 消费端，`mergeTelemetryEnv` 检查 `telemetry.enabled === true`（无需修改）
- `packages/opencode/src/qwen/meta.ts:35-51` — `TelemetrySettings` 类型定义（无需修改）

## 验证

1. `bun typecheck` 通过（在 `packages/app` 目录下）
2. `cd packages/app && bun run test:unit` 现有测试不回归
3. 本地 `bun run dev:local` 启动后，检查 workspace `.qwen/settings.json` 中 `telemetry.enabled` 是否被正确写入
