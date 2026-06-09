# Fix: Add configurable `bodyTimeout` for streaming responses

## Context

**Issues:** #4604, #4657

**Problem:** Node.js 无代理路径使用内置 fetch（底层 undici 默认 bodyTimeout=300s）。当本地模型（Ollama、mlx_lm.server）在生成 tool call JSON 时 chunk 间隔超过 300 秒，连接被 undici 单方面断开，客户端报 `Body Timeout Error`。

**已复现：** 用 mock server + undici Agent(bodyTimeout:2s) 精确复现了 `UND_ERR_BODY_TIMEOUT`，并验证 `bodyTimeout:0` 可解决。

**设计选择：** 新增 `generationConfig.bodyTimeout` 字段，默认值 `0`（禁用），用户可配置正数值作为安全阈值。

## Implementation Steps

### Step 1: 类型定义 — `ContentGeneratorConfig` 新增字段

**File:** `packages/core/src/core/contentGenerator.ts` (line 83 之后)

```typescript
bodyTimeout?: number;
```

### Step 2: 字段注册 — `MODEL_GENERATION_CONFIG_FIELDS`

**File:** `packages/core/src/models/constants.ts` (line 33 之后)

添加 `'bodyTimeout'` 到数组。

### Step 3: 类型导出 — `ModelGenerationConfig`

**File:** `packages/core/src/models/types.ts` (line 41 之后)

添加 `| 'bodyTimeout'` 到 Pick 联合。

### Step 4: Settings Schema

**File:** `packages/cli/src/config/settingsSchema.ts` (`generationConfig.properties` 末尾)

```typescript
bodyTimeout: {
  type: 'number',
  label: 'Body Timeout',
  category: 'Generation Configuration',
  requiresRestart: false,
  default: 0,
  description: 'Streaming body timeout in milliseconds. Maximum idle time allowed between data chunks. 0 (default) disables the timeout. Recommended for slow local model servers.',
  parentKey: 'generationConfig',
  showInDialog: false,
},
```

### Step 5: 核心逻辑 — `runtimeFetchOptions.ts`

**File:** `packages/core/src/utils/runtimeFetchOptions.ts`

5a. import 添加 `Agent`:
```typescript
import { Agent, ProxyAgent, fetch as undiciFetch, type Dispatcher } from 'undici';
```

5b. 函数签名添加 `options` 参数（3 个 overload + implementation）:
```typescript
buildRuntimeFetchOptions(sdkType, proxyUrl?, options?: { bodyTimeout?: number })
```

5c. `case 'node'` 和 `default` 传递 options:
```typescript
return buildFetchOptionsWithDispatcher(sdkType, proxyUrl, options);
```

5d. `buildFetchOptionsWithDispatcher` 无代理路径改为创建 Agent:
```typescript
if (!proxyUrl) {
  const resolvedBodyTimeout = options?.bodyTimeout ?? 0;
  const dispatcher = getOrCreateNoProxyDispatcher(resolvedBodyTimeout);
  return { fetchOptions: { dispatcher }, fetch: undiciFetch };
}
```

5e. 新增 `getOrCreateNoProxyDispatcher` 函数（带缓存）:
```typescript
const noProxyDispatcherCache = new Map<number, Dispatcher>();

function getOrCreateNoProxyDispatcher(bodyTimeout: number): Dispatcher {
  const cached = noProxyDispatcherCache.get(bodyTimeout);
  if (cached) return cached;
  const dispatcher = new Agent({ bodyTimeout, headersTimeout: 0 });
  noProxyDispatcherCache.set(bodyTimeout, dispatcher);
  return dispatcher;
}
```

5f. 更新注释：删除 "This is sufficient for all current model streaming responses" 的断言。

### Step 6: 调用方传递 bodyTimeout

**3 个文件同样修改：**

- `packages/core/src/core/openaiContentGenerator/provider/default.ts` (line 87)
- `packages/core/src/core/openaiContentGenerator/provider/dashscope.ts` (line 146)
- `packages/core/src/core/anthropicContentGenerator/anthropicContentGenerator.ts` (line 183)

```typescript
const runtimeOptions = buildRuntimeFetchOptions(
  sdkType,
  this.cliConfig.getProxy(),
  { bodyTimeout: this.contentGeneratorConfig.bodyTimeout },
);
```

### Step 7: 更新测试

**File:** `packages/core/src/utils/runtimeFetchOptions.test.ts`

- 修改 "returns undefined for OpenAI when no proxy is set" → 断言返回 dispatcher + fetch
- 修改 "returns empty object for Anthropic when no proxy is set" → 同上
- 修改 "does not inject a fetch override when no proxy is set" → 现在会 inject
- 新增：`bodyTimeout: 0` 和 `bodyTimeout: 60000` 的参数化测试
- 新增：验证 no-proxy dispatcher 缓存行为

### Step 8: 更新 `resetDispatcherCache` 测试辅助

清理 `noProxyDispatcherCache` 以保证测试隔离。

## Verification

1. `cd packages/core && npx vitest run src/utils/runtimeFetchOptions.test.ts`
2. `cd packages/core && npx vitest run src/core/openaiContentGenerator/`
3. `node repro-body-timeout-undici.mjs` — 确认修复后 bodyTimeout:0 路径正常
4. `cd packages/cli && npx vitest run src/config/` — settings schema 无回归
5. 全量测试：`npm test` 或 `npx vitest run`

## Impact

- **所有 Node.js 无代理用户**默认获得修复（bodyTimeout=0）
- **云端 API 用户**行为变化：从 Node 内置 fetch 切换到 bundled undici fetch（proxy 用户已经这样，无风险）
- **Bun 用户**无影响
- **proxy 用户**无影响（已是 bodyTimeout:0）

## Final Implementation Status

- **PR status**: MERGED — PR #4605 "fix(core): disable undici 300s bodyTimeout for no-proxy Node.js path" merged 2026-06-03.
- **Summary**: The core fix was implemented: undici bodyTimeout disabled (set to 0) for the no-proxy Node.js path, solving the Body Timeout Error for local models. A second PR #4667 (configurable bodyTimeout field) was CLOSED without merge.
- **Key divergences**: The plan proposed a user-configurable `generationConfig.bodyTimeout` field across 8 steps (settings schema, ContentGeneratorConfig, 3 provider files). The actual implementation was simpler — it only changed `runtimeFetchOptions.ts` (+ tests) to unconditionally set `bodyTimeout: 0` without exposing a user-facing config knob. The configurable approach was abandoned in favor of a minimal fix.
- **Files actually changed**: `packages/core/src/utils/runtimeFetchOptions.ts`, `packages/core/src/utils/runtimeFetchOptions.test.ts`
