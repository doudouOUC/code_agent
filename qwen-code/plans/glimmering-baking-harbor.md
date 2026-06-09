# customHeaders 模板变量支持

## Context

PR #4649 注入了 `QWEN_CODE_SESSION_ID` 等环境变量到子进程，但 sessionId 作为 HTTP header 传到 LLM API 后端这部分没做。Reviewer 建议不要硬编码 header，而是让用户通过已有的 `customHeaders` 配置来决定发什么。

当前 `customHeaders` 是静态 `Record<string, string>`，在 client 构造时绑定为 `defaultHeaders`，无法携带动态值。本方案扩展它支持 `${VAR}` 模板变量，框架 per-request 解析。

用户配置示例：
```json
{
  "model": {
    "generationConfig": {
      "customHeaders": {
        "X-Session-Id": "${QWEN_CODE_SESSION_ID}",
        "X-Prompt-Id": "${QWEN_CODE_PROMPT_ID}",
        "X-Project-Id": "my-static-value"
      }
    }
  }
}
```

## 设计

### 1. 模板解析工具函数

新建 `packages/core/src/utils/headerTemplateResolver.ts`

复用已有的 `resolveEnvVarsInString(value, customEnv)` (`packages/core/src/utils/envVarResolver.ts:20`)，它已支持 `$VAR` / `${VAR}` 语法和 `customEnv` 优先查找。

```typescript
export interface HeaderTemplateContext {
  sessionId?: string;
  promptId?: string;
  agentId?: string | null;
  model?: string;
  channel?: string;
}

// 判断 header value 是否含模板变量
export function containsTemplateVariable(value: string): boolean

// 把 customHeaders 分为 static（无模板）和 dynamic（有模板）
export function partitionHeaders(headers: Record<string, string>): {
  staticHeaders: Record<string, string>;
  dynamicTemplates: Record<string, string>;
}

// 解析 dynamic templates → 最终 header 值
export function resolveTemplateHeaders(
  templates: Record<string, string>,
  context: HeaderTemplateContext,
): Record<string, string>
```

`resolveTemplateHeaders` 将 context 转为 `customEnv` map 传入 `resolveEnvVarsInString`：

| context 字段 | 变量名 | 来源 |
|---|---|---|
| `sessionId` | `QWEN_CODE_SESSION_ID` | `cliConfig.getSessionId()` |
| `promptId` | `QWEN_CODE_PROMPT_ID` | `userPromptId` 参数 |
| `agentId` | `QWEN_CODE_AGENT_ID` | `getCurrentAgentId()` |
| `model` | `QWEN_CODE_MODEL` | `contentGeneratorConfig.model` |
| `channel` | `QWEN_CODE_CHANNEL` | `cliConfig.getChannel()` |

不在上表的变量 fallback 到 `process.env`（`resolveEnvVarsInString` 已有的行为），用户可以通过环境变量注入自定义业务上下文。

### 2. OpenAI-compatible 路径

**a. 扩展 provider 接口**（`packages/core/src/core/openaiContentGenerator/provider/types.ts`）

```typescript
export interface OpenAICompatibleProvider {
  // ...existing
  buildPerRequestHeaders?(userPromptId: string): Record<string, string> | undefined;
}
```

Optional 方法，7+ 个 provider 子类无需改动即兼容。

**b. DefaultOpenAICompatibleProvider**（`packages/core/src/core/openaiContentGenerator/provider/default.ts`）

- 构造时用 `partitionHeaders` 分离 static / dynamic
- `buildHeaders()` 只合并 static 部分（行为对无模板的用户完全不变）
- 新增 `buildPerRequestHeaders(userPromptId)`:
  - `dynamicTemplates` 为空时返回 `undefined`（快路径，零分配）
  - 否则构造 `HeaderTemplateContext`，调用 `resolveTemplateHeaders` 返回解析后的 headers

**c. DashScopeOpenAICompatibleProvider**（`packages/core/src/core/openaiContentGenerator/provider/dashscope.ts`）

- `buildHeaders()` override 同样只合并 static 部分
- `buildPerRequestHeaders` 继承自 `DefaultOpenAICompatibleProvider`，无需额外实现

**d. Pipeline 注入 per-request headers**（`packages/core/src/core/openaiContentGenerator/pipeline.ts`）

两处 `create()` 调用（line 56 非流式, line 84 流式）改为：

```typescript
const perRequestHeaders = this.config.provider.buildPerRequestHeaders?.(userPromptId);
await this.client.chat.completions.create(openaiRequest, {
  signal: request.config?.abortSignal,
  ...(perRequestHeaders ? { headers: perRequestHeaders } : {}),
});
```

`userPromptId` 已在 `executeWithErrorHandling` 的闭包中可用，无需新增参数。

### 3. Anthropic 路径

`packages/core/src/core/anthropicContentGenerator/anthropicContentGenerator.ts`

Anthropic 已有 `buildPerRequestHeaders` per-request 注入模式（line 361）。改动：

- `buildHeaders()` (line 312): 遍历 `customHeaders` 时跳过含模板变量的 entry（除已有的 skip `anthropic-beta`）
- `buildPerRequestHeaders()` (line 361): 在返回前合并动态模板解析结果。用 `promptIdContext.getStore()` 取 promptId（因为这个方法不接收 `userPromptId` 参数，而 ALS 在调用链上层已设置）

### 4. Gemini 路径

`packages/core/src/core/geminiContentGenerator/index.ts`

Google GenAI SDK 不支持 per-request headers。在 `createGeminiContentGenerator()` 工厂函数中，构造 client 前解析所有模板变量（用构造时可用的 context）。

限制：`QWEN_CODE_PROMPT_ID` 和 `QWEN_CODE_AGENT_ID` 在构造时可能为空，fallback 到 `process.env`。sessionId/model/channel 是稳定值，正常工作。

### 5. 关键不变量

- `ContentGeneratorConfig.customHeaders` 类型不变（`Record<string, string>`），不影响 settings schema
- 无模板变量的 `customHeaders` 行为完全不变（全部走 `defaultHeaders`，`buildPerRequestHeaders` 返回 `undefined`）
- `modelProviders` 优先级不变（whole-field replacement，provider 级 customHeaders 整体覆盖 settings 级）
- `buildMetadata()` 的 body metadata（DashScope `metadata.sessionId`）保持不变，两种传播方式共存

## 文件变更清单

| 文件 | 变更 |
|---|---|
| `packages/core/src/utils/headerTemplateResolver.ts` | **新建**：模板解析工具函数 |
| `packages/core/src/utils/headerTemplateResolver.test.ts` | **新建**：单元测试 |
| `packages/core/src/core/openaiContentGenerator/provider/types.ts` | 接口加 optional `buildPerRequestHeaders` |
| `packages/core/src/core/openaiContentGenerator/provider/default.ts` | 分区逻辑 + `buildPerRequestHeaders` 实现 |
| `packages/core/src/core/openaiContentGenerator/provider/dashscope.ts` | `buildHeaders()` 只用 static 部分 |
| `packages/core/src/core/openaiContentGenerator/pipeline.ts` | 两处 `create()` 注入 per-request headers |
| `packages/core/src/core/anthropicContentGenerator/anthropicContentGenerator.ts` | `buildHeaders` + `buildPerRequestHeaders` 合并动态模板 |
| `packages/core/src/core/geminiContentGenerator/index.ts` | 构造时解析模板 |
| 已有的 provider/generator 测试文件 | 补充模板变量相关 case |

## 验证

1. `npx vitest run packages/core/src/utils/headerTemplateResolver.test.ts`
2. `npx vitest run packages/core/src/core/openaiContentGenerator/provider/default.test.ts`
3. `npx vitest run packages/core/src/core/openaiContentGenerator/provider/dashscope.test.ts`
4. `npx vitest run packages/core/src/core/anthropicContentGenerator/anthropicContentGenerator.test.ts`
5. `npx vitest run packages/core/src/core/openaiContentGenerator/pipeline.test.ts`（如有）
6. `npx tsc --noEmit -p packages/core/tsconfig.json`
7. 端到端：配置 `customHeaders` 含 `${QWEN_CODE_SESSION_ID}`，启动后通过 debug log 或抓包验证 header 值等于 session UUID

## Final Implementation Status

- **PR #4649** — MERGED 2026-06-02. Title: "feat(core): inject context env vars (session/agent/prompt ID) into shell subprocesses".
- **Outcome**: The PR implemented the env-var injection into shell subprocesses (the prerequisite), but the `customHeaders` template variable expansion (the subject of THIS plan) was NOT implemented in PR #4649. The plan describes a follow-up feature that extends `customHeaders` with `${VAR}` support for HTTP headers to the LLM API.
- **What was actually done**: Shell context env vars (`QWEN_CODE_SESSION_ID`, `QWEN_CODE_PROMPT_ID`, `QWEN_CODE_AGENT_ID`) injected into subprocesses via `shellContextEnv.ts`. No per-request header template resolution was added.
- **Files changed**: `config.ts`, `hookRunner.ts`, `shellExecutionService.ts`, `monitor.ts`, `shellContextEnv.ts` + tests.
- **Key divergence**: This plan (customHeaders template expansion) remains unimplemented. PR #4649 only covers the subprocess env-var injection that this plan builds upon.
