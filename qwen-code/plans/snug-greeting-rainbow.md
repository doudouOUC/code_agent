# Plan: Support /btw via Daemon HTTP

## Context

`/btw` 是一个"side question"命令，允许用户在不中断主对话的情况下问一个快速问题。当前仅支持 `interactive` 模式（CLI TUI），daemon HTTP 场景完全没有 btw 相关代码。需要添加 HTTP endpoint + ACP ext-method 让 daemon 客户端（web-shell、IDE 插件等）也能使用 btw。

## Design Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| 传输方式 | ext-method (like recap) | btw 是短时单轮 LLM 调用，不走 prompt pipeline，适合 control-plane 模式 |
| HTTP 响应 | 同步 200 JSON | btw 通常 2-5s，可接受同步等待 |
| 取消机制 | AbortController wired to res.close (bridge 侧); child 侧 AbortSignal.timeout(55s) | 客户端断开时 bridge 侧 reject; child 侧独立设 timeout 自保，避免永久占用资源 |
| SSE 事件 | 不发布 | 同 recap — 短时信息查询，不需要 peer 感知 |
| 并发控制 | 无队列 | btw 用 runForkedAgent 独立 LLM 调用，不经过 promptQueue |
| Slash command | 同时支持 'acp' mode | 用户在 ACP session 中输入 `/btw` 时也能工作 |
| Model | 使用主会话模型（与 cacheSafeParams 一致） | 保持 prompt cache 命中率 |
| maxOutputTokens | 不额外限制（继承主会话 generationConfig） | btw prompt 自带"answer directly"约束，模型自然简短 |
| Timeout | bridge 侧 60s (SESSION_BTW_TIMEOUT_MS) | 与 recap 一致 |
| 首轮空历史 | 允许调用（history=[]） | 模型有 systemInstruction，可回答无需上下文的问题 |
| ACP JSON-RPC | 初版不做（REST-only，与 recap/shell 一致） | IDE 客户端通过 HTTP REST 调用即可 |
| BridgeTimeoutError HTTP code | 初版 500（沿用现有 sendBridgeError 逻辑） | 后续可优化为 504 |

## Implementation

### 1. `packages/acp-bridge/src/status.ts` (~line 130)

在 `SERVE_CONTROL_EXT_METHODS` 中添加:
```typescript
sessionBtw: 'qwen/control/session/btw',
```

### 2. `packages/acp-bridge/src/bridgeTypes.ts` (after `generateSessionRecap`, ~line 384)

在 `HttpAcpBridge` interface 中添加:
```typescript
generateSessionBtw(
  sessionId: string,
  question: string,
  signal?: AbortSignal,
  context?: BridgeClientRequestContext,
): Promise<{ sessionId: string; answer: string | null }>;
```

### 3. `packages/acp-bridge/src/bridge.ts`

添加常量 (~line 582):
```typescript
const SESSION_BTW_TIMEOUT_MS = 60_000;
```

添加实现 (after `generateSessionRecap`, ~line 3393), 复用 recap 的 pattern:
```typescript
async generateSessionBtw(sessionId, question, _signal, _context) {
  const entry = byId.get(sessionId);
  if (!entry) throw new SessionNotFoundError(sessionId);
  const info = channelInfoForEntry(entry);
  if (!info || info.isDying) throw new SessionNotFoundError(sessionId);
  const response = (await Promise.race([
    withTimeout(
      entry.connection.extMethod(SERVE_CONTROL_EXT_METHODS.sessionBtw, {
        sessionId, question,
      }),
      SESSION_BTW_TIMEOUT_MS,
      SERVE_CONTROL_EXT_METHODS.sessionBtw,
    ),
    getTransportClosedReject(entry),
  ])) as { sessionId: string; answer: string | null };
  return { sessionId: entry.sessionId, answer: response.answer ?? null };
}
```

### 4. `packages/cli/src/acp-integration/acpAgent.ts` (after sessionRecap case, ~line 2539)

添加新 case:
```typescript
case SERVE_CONTROL_EXT_METHODS.sessionBtw: {
  const sessionId = params['sessionId'];
  const question = params['question'];
  if (typeof sessionId !== 'string' || !sessionId) {
    throw RequestError.invalidParams(undefined, 'Invalid or missing sessionId');
  }
  if (typeof question !== 'string' || !question.trim()) {
    throw RequestError.invalidParams(undefined, 'Invalid or missing question');
  }
  const session = this.sessionOrThrow(sessionId);
  const config = session.getConfig();
  const cacheSafeParams = buildBtwCacheSafeParams(config);
  if (!cacheSafeParams) {
    throw RequestError.invalidParams(undefined, 'No conversation context available');
  }
  const result = await runForkedAgent({
    config,
    userMessage: buildBtwPrompt(question.trim()),
    cacheSafeParams,
    abortSignal: AbortSignal.timeout(55_000), // 自保，略小于 bridge 60s timeout
  });
  return { sessionId, answer: result.text || null };
}
```

需要 import:
- `runForkedAgent` from `@qwen-code/qwen-code-core`
- `buildBtwCacheSafeParams`, `buildBtwPrompt` — 从共享 util (见步骤 8)

### 5. `packages/cli/src/serve/server.ts` (after recap route, ~line 1790)

添加 REST endpoint:
```typescript
app.post('/session/:id/btw', mutate(), async (req, res) => {
  const sessionId = req.params['id'];
  if (!sessionId) {
    res.status(400).json({ error: '`sessionId` route parameter is required' });
    return;
  }
  const body = safeBody(req);
  const question = body['question'];
  if (typeof question !== 'string' || question.trim().length === 0) {
    res.status(400).json({ error: '`question` is required and must be a non-empty string' });
    return;
  }
  const abort = new AbortController();
  const onResClose = () => { if (!res.writableEnded) abort.abort(); };
  res.once('close', onResClose);
  const clientId = parseClientIdHeader(req, res);
  if (clientId === null) { res.off('close', onResClose); return; }
  try {
    const result = await bridge.generateSessionBtw(
      sessionId, question.trim(), abort.signal,
      clientId !== undefined ? { clientId } : undefined,
    );
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError' && abort.signal.aborted) return;
    sendBridgeError(res, err, { route: 'POST /session/:id/btw', sessionId });
  } finally {
    res.off('close', onResClose);
  }
});
```

### 6. `packages/cli/src/serve/capabilities.ts`

添加 capability:
```typescript
session_btw: { since: 'v1' },
```

### 7. `packages/cli/src/ui/commands/btwCommand.ts`

**a)** 修改 `supportedModes` (line 126):
```typescript
supportedModes: ['interactive', 'acp'] as const,
```

**b)** 在 action 函数中，validation 之后、UI 操作之前，添加 ACP/non-interactive 模式分支:
```typescript
const executionMode = context.executionMode ?? 'interactive';
if (executionMode !== 'interactive') {
  try {
    const answer = await askBtw(context, question, new AbortController().signal);
    return { type: 'message', messageType: 'info', content: answer };
  } catch (error) {
    return { type: 'message', messageType: 'error', content: formatBtwError(error) };
  }
}
```

### 8. 提取共享 util: `packages/core/src/utils/btwUtils.ts`

从 `btwCommand.ts` 提取两个函数，让 acpAgent.ts 也能复用:

```typescript
// packages/core/src/utils/btwUtils.ts
import type { CacheSafeParams } from './forkedAgent.js';
import type { Config } from '../config/config.js';

export function buildBtwPrompt(question: string): string {
  return [
    '<system-reminder>',
    'This is a side question from the user. Answer directly in a single response.',
    '',
    'CRITICAL CONSTRAINTS:',
    '- You have NO tools available — you cannot read files, run commands, or take any actions.',
    '- You can ONLY use information already present in the conversation context.',
    '- NEVER promise to look something up or investigate further.',
    '- If you do not know the answer, say so.',
    '- The main conversation is NOT interrupted; you are a separate, lightweight fork.',
    '</system-reminder>',
    '',
    question,
  ].join('\n');
}

export function buildBtwCacheSafeParams(config: Config): CacheSafeParams | null {
  const geminiClient = config.getGeminiClient();
  try {
    const chat = geminiClient.getChat();
    const generationConfig = chat.getGenerationConfig();
    if (!generationConfig) return null;
    const fullHistory = geminiClient.getHistory(true);
    const maxHistoryEntries = 40;
    const history = fullHistory.length > maxHistoryEntries
      ? fullHistory.slice(-maxHistoryEntries)
      : fullHistory;
    return { generationConfig, history, model: config.getModel() ?? '', version: 0 };
  } catch {
    return null; // chat not initialized
  }
}
```

在 `packages/core/src/index.ts` 中 export:
```typescript
export { buildBtwPrompt, buildBtwCacheSafeParams } from './utils/btwUtils.js';
```

更新 `btwCommand.ts` 改为 import 这两个函数（删除本地的 `buildBtwPrompt` 和 `getBtwCacheSafeParams`）。

## Edge Cases

| Case | Handling |
|------|----------|
| 首轮未完成时调用 btw | history=[], 模型仅凭 systemInstruction 回答 |
| 无 chat（极端异常） | `buildBtwCacheSafeParams` 返回 null → bridge 返回 error |
| 客户端断开 | bridge 侧 AbortError catch → 静默返回 |
| ACP child timeout (>55s) | AbortSignal.timeout 触发 → runForkedAgent 中止 |
| Bridge timeout (>60s) | BridgeTimeoutError → HTTP 500 |
| 并发多个 btw | 各自独立运行，无冲突 |

## Verification

1. **Build**: `pnpm build` in `packages/core`, `packages/acp-bridge`, `packages/cli`
2. **Unit tests**:
   - `packages/core/src/utils/btwUtils.test.ts` — 测试 `buildBtwPrompt` 和 `buildBtwCacheSafeParams`
   - `packages/acp-bridge` — mock extMethod 验证 `generateSessionBtw`
   - `packages/cli/src/ui/commands/btwCommand.test.ts` — 验证 ACP mode 分支返回 MessageActionReturn
3. **Integration test**:
   - Start daemon: `qwen serve`
   - Create session, send a prompt (to populate history)
   - Call `POST /session/:id/btw` with `{ "question": "what is 1+1?" }`
   - Verify 200 response with `{ sessionId, answer }`
4. **Supported commands**: `GET /session/:id/supported-commands` 包含 `btw`
5. **Abort**: curl 发起 btw 后 Ctrl-C → 验证 server 侧无错误日志
6. **首轮 btw**: 新 session 不发 prompt 直接调 btw → 验证返回有效回答（即使无上下文）
7. **Slash in ACP**: 发送 `/btw what time is it` 作为 prompt → 验证作为 agent_message_chunk 返回
