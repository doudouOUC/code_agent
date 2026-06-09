# Daemon `!` (Bang) Shell Command 支持实施方案

## Context

CLI 模式下 `!` 让用户直接执行 shell 命令，不经过 LLM，结果注入 LLM history 作为上下文。Daemon 模式下（web-shell、channel 适配器）此功能不完整：
- Web-shell 把命令包装成 LLM prompt，LLM 用 Bash tool 执行（慢、不确定、浪费 token）
- Channel 适配器无任何 `!` 处理

目标：在 daemon 服务端直接执行 shell 命令，与 CLI 语义对齐。

## 设计决策

| 决策 | 选项 | 理由 |
|------|------|------|
| PTY vs child_process | `shouldUseNodePty: false` | daemon 环境无需交互终端 |
| 输出流式 vs 批量 | 流式（复用 `shell_output` SSE 事件） | 与 CLI 行为一致，normalizer 已有支持 |
| 并发 | 每 session 同时只允许一个 `!` 命令 | 简化实现，CLI 也是串行 |
| History 注入 | 通过 ACP extMethod 调用 `chat.addHistory()` | bridge 层无直接 addHistory，需经 ACP 通道 |
| 输出截断 | 注入 history 时截断到 256KB | 避免撑大 LLM context |

## 实施步骤（按依赖序）

### Step 1: 协议层常量 + 类型

**`packages/acp-bridge/src/status.ts`** — `SERVE_CONTROL_EXT_METHODS` 加 `sessionShellHistory: 'qwen/control/session/shell_history'`

**`packages/acp-bridge/src/bridgeTypes.ts`** — `HttpAcpBridge` 接口加 `executeShellCommand` 方法签名 + `ShellCommandResult` 类型：
```typescript
executeShellCommand(
  sessionId: string, command: string,
  signal?: AbortSignal, context?: BridgeClientRequestContext,
): Promise<ShellCommandResult>;

interface ShellCommandResult {
  exitCode: number | null;
  output: string;
  aborted: boolean;
}
```

### Step 2: SDK 事件类型

**`packages/sdk-typescript/src/daemon/events.ts`**:
- `DAEMON_KNOWN_EVENT_TYPE_VALUES` 加 `'user_shell_command'`, `'user_shell_result'`
- 新增 `DaemonUserShellCommandData`, `DaemonUserShellResultData` 接口
- 新增 `DaemonUserShellCommandEvent`, `DaemonUserShellResultEvent` 类型别名
- 加入 `KnownDaemonEvent` union
- `asKnownDaemonEvent` 加验证 case
- `reduceDaemonSessionEvent` 加 pass-through case（信息性事件不改 state）

**`packages/sdk-typescript/src/daemon/ui/normalizer.ts`**:
- `user_shell_command` → 发射 `user.text.delta` 事件（展示 `! <command>`）
- `user_shell_result` → 发射 `status` 事件（展示 exit code）
- `shell_output` 已有处理，无需改动

### Step 3: Bridge 实现

**`packages/acp-bridge/src/bridge.ts`** — 实现 `executeShellCommand`：
1. `byId.get(sessionId)` 获取 session entry
2. 并发守卫：用 `Map<string, AbortController>` 跟踪活跃 shell 命令，已有则返回 409
3. 发布 `user_shell_command` SSE 事件（command + cwd）
4. 调用 `ShellExecutionService.execute(command, entry.workspaceCwd, onOutput, signal, false, { terminalWidth: 120, terminalHeight: 40 })`
5. 每个 `onOutputEvent` data chunk → 发布 `session_update` / `shell_output` SSE 事件
6. 完成时发布 `user_shell_result` SSE 事件
7. 调用 `connection.extMethod(SERVE_CONTROL_EXT_METHODS.sessionShellHistory, { sessionId, command, output, exitCode })` 注入 history
8. 返回 `{ exitCode, output, aborted }`

### Step 4: ACP Agent 层 — History 注入

**`packages/cli/src/acp-integration/acpAgent.ts`** — extMethod switch 新增 case：
```typescript
case SERVE_CONTROL_EXT_METHODS.sessionShellHistory: {
  const session = this.sessionOrThrow(params['sessionId']);
  const config = session.getConfig();
  const geminiClient = config.getGeminiClient()!;
  const outputText = typeof params['output'] === 'string'
    ? params['output'].slice(0, 256 * 1024)
    : '';
  geminiClient.addHistory({
    role: 'user',
    parts: [{ text: `I ran the following shell command:\n\`\`\`sh\n${params['command']}\n\`\`\`\n\nThis produced the following result:\n\`\`\`\n${outputText}\n\`\`\`` }],
  });
  return { sessionId: params['sessionId'], injected: true };
}
```

格式与 CLI 的 `addShellCommandToGeminiHistory` 一致（`shellCommandProcessor.ts:38-63`）。

### Step 5: Daemon Server HTTP 路由

**`packages/cli/src/serve/server.ts`** — 新增 `POST /session/:id/shell`：
- 验证 `command` 字段（非空字符串）
- abort 接线（`res.once('close')` → `abort.abort()`，与 prompt 路由一致）
- `parseClientIdHeader` 校验
- 调用 `bridge.executeShellCommand(sessionId, command, signal, context)`
- 成功 → `200 { exitCode, output, aborted }`
- 错误 → `sendBridgeError()`

### Step 6: SDK Client 层

**`packages/sdk-typescript/src/daemon/DaemonClient.ts`** — 新增 `shellCommand()`:
```typescript
async shellCommand(sessionId: string, command: string,
  signal?: AbortSignal, clientId?: string): Promise<ShellCommandResult>
```
调用 `POST /session/:id/shell`。

**`packages/sdk-typescript/src/daemon/DaemonSessionClient.ts`** — 新增 `shellCommand()` 委托给 client。

**`packages/sdk-typescript/src/daemon/index.ts`** — 导出 `ShellCommandResult` 类型。

### Step 7: Web-shell 客户端

**`packages/web-shell/client/hooks/useDaemonSession.ts`** — `DaemonActions` 接口加 `sendShellCommand(command: string)` 方法，内部调用 `session.shellCommand(command)`。

**`packages/web-shell/client/App.tsx`** — 替换 `!` 处理逻辑：
```typescript
// 原来:
actions.sendPrompt(formatShellCommandPrompt(cmd))
// 改为:
actions.sendShellCommand(cmd)
```
删除 `formatShellCommandPrompt` 函数。

### Step 8: Channel 适配器

**`packages/channels/base/src/DaemonChannelBridge.ts`** — 新增 `shellCommand(sessionId, command)` 方法。

**`packages/channels/base/src/ChannelBase.ts`** — `handleInbound()` 在 slash command 检查前加 `!` 前缀检测：
```typescript
if (envelope.text.startsWith('!')) {
  const cmd = envelope.text.slice(1).trim();
  if (cmd) {
    const sessionId = await this.router.resolve(...);
    const result = await this.bridge.shellCommand(sessionId, cmd);
    await this.sendMessage(envelope.chatId, formatShellResult(cmd, result));
    return;
  }
}
```

## 验证方案

1. **单元测试**：bridge `executeShellCommand` mock ShellExecutionService，验证 SSE 事件发布顺序和 extMethod 调用
2. **集成测试**：启动 daemon server，用 SDK client 调用 `POST /session/:id/shell`，验证返回 exitCode + output
3. **端到端**：web-shell 中输入 `! echo hello`，验证：
   - 输出立即显示（不等 LLM）
   - 后续对话中 LLM 能引用 shell 输出
   - `! exit 42` 正确显示非零 exit code
4. **Channel**：Telegram 发送 `! ls`，验证收到格式化的 shell 输出
5. **边界**：并发 `!` 命令返回 409；长输出在 history 中被截断
