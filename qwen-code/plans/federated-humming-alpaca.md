# ACP 子进程生命周期优化

## Context

Daemon 冷启动（boot + 首个 session）耗时 ~2.5s，其中 ACP 子进程生命周期管理占主要开销。三个优化合并一个 PR：

1. **P0-1**：跳过 ACP 不必要的 `relaunchAppInChildProcess`（省 0.2-0.3s）
2. **P0-2**：daemon boot 后预热 ACP（省 0.3-0.5s）
3. **P1-3**：ACP 空闲保活，避免频繁冷启动

关联 issue：#4748

---

## 改动 1：跳过 ACP relaunch（P0-1）

### 文件：`packages/acp-bridge/src/spawnChannel.ts`

**修改点**：`createSpawnChannelFactory` 函数（line 89-165）

在 `scrubChildEnv()` 之后、`spawn()` 之前：

1. 设 `childEnv['QWEN_CODE_NO_RELAUNCH'] = 'true'` — 跳过 `gemini.tsx` 中的 relaunch
2. 计算 `--max-old-space-size` 并加到 spawn args — 因为跳过了 relaunch 就跳过了 `getNodeMemoryArgs()`

```ts
// 在 line 101 之后，line 102 之前插入：
childEnv['QWEN_CODE_NO_RELAUNCH'] = 'true';

const memoryArgs = getAcpMemoryArgs();
const child = spawn(process.execPath, [...memoryArgs, cliEntry, '--acp'], {
  // ... 原有参数不变
});
```

新增辅助函数（文件内，在 `createSpawnChannelFactory` 之前）：

```ts
import * as os from 'node:os';

function getAcpMemoryArgs(): string[] {
  const totalMB = Math.floor(os.totalmem() / (1024 * 1024));
  const targetMB = Math.floor(totalMB * 0.5);
  return targetMB > 2048 ? [`--max-old-space-size=${targetMB}`] : [];
}
```

### 注意事项

- `QWEN_CODE_NO_RELAUNCH` 不在 `SCRUBBED_CHILD_ENV_KEYS` 中，不会被清除
- `getNodeMemoryArgs()` 在 `cli` 包中且未导出，不能跨包引用，必须内联计算逻辑
- 原始 `getNodeMemoryArgs()` 还检查 `autoConfigureMemory` 设置，但 `spawnChannel` 无法访问 settings。对 ACP 子进程统一按 50% RAM 设置是安全的默认行为

---

## 改动 2：预热 ACP（P0-2）

### 文件 1：`packages/acp-bridge/src/bridgeTypes.ts`

在 `HttpAcpBridge` 接口（line 149-571）中追加方法：

```ts
preheat(): Promise<void>;
```

### 文件 2：`packages/acp-bridge/src/bridge.ts`

在返回对象（line 2008+）中追加实现：

```ts
async preheat() {
  if (shuttingDown) return;
  await ensureChannel();
},
```

### 文件 3：`packages/cli/src/serve/runQwenServe.ts`

在 `app.listen()` 回调中（line 931+），`resolve(handle)` 之前，添加 fire-and-forget 预热：

```ts
bridge.preheat().catch((err) => {
  writeStderrLine(
    `qwen serve: ACP preheat failed, will retry on first session: ${err instanceof Error ? err.message : String(err)}`,
  );
});
```

### 安全性

- `ensureChannel()` 完全幂等（有 `channelInfo` 快路径 + `inFlightChannelSpawn` 合并机制）
- 首个 `POST /session` 和 preheat 并发时自动合并到同一个 spawn
- preheat 失败不影响 daemon 启动，首个 session 照常 lazy spawn
- `shuttingDown` guard 防止 daemon 关闭期间预热

---

## 改动 3：ACP 空闲保活（P1-3）

### 文件 1：`packages/acp-bridge/src/bridgeOptions.ts`

在 `BridgeOptions` 接口（line 117-359）中追加字段：

```ts
channelIdleTimeoutMs?: number;
```

### 文件 2：`packages/acp-bridge/src/bridge.ts`

**新增状态变量**（在 `channelInfo` 声明附近）：

```ts
let idleTimer: ReturnType<typeof setTimeout> | undefined;
```

**新增辅助函数**：

```ts
function cancelIdleTimer() {
  if (idleTimer !== undefined) {
    clearTimeout(idleTimer);
    idleTimer = undefined;
  }
}

function startIdleTimer(ci: ChannelInfo) {
  const timeoutMs = opts.channelIdleTimeoutMs;
  if (!timeoutMs || timeoutMs <= 0) {
    // 0 或未设置 = 立即杀（当前行为）
    ci.isDying = true;
    void ci.channel.kill().catch(() => {});
    return;
  }
  cancelIdleTimer();
  idleTimer = setTimeout(() => {
    idleTimer = undefined;
    if (ci.sessionIds.size === 0 && ci.pendingRestoreIds.size === 0) {
      ci.isDying = true;
      void ci.channel.kill().catch(() => {});
    }
  }, timeoutMs);
  idleTimer.unref();  // 不阻止 daemon 自然退出
}
```

**修改 `closeSession`**（line 2756-2764）：将立即杀改为调 `startIdleTimer`：

```ts
if (ci && ci.sessionIds.size === 0 && ci.pendingRestoreIds.size === 0) {
  startIdleTimer(ci);  // 替换原来的 ci.isDying + ci.channel.kill()
}
```

**修改 `killSession`**（line 4322-4335）：同上改为 `startIdleTimer(ci)`。

**修改 `ensureChannel`**（line 988-989 快路径前）：

```ts
cancelIdleTimer();  // 新 session 到达，取消空闲计时
if (channelInfo && !channelInfo.isDying) return channelInfo;
```

**修改 `channel.exited` handler**（line 1094+）：头部加 `cancelIdleTimer()`。

**修改 `shutdown()`**（line 4400+）：头部加 `cancelIdleTimer()`。

**修改 `killAllSync()`**（line 4373+）：头部加 `cancelIdleTimer()`。

**restore failure 路径**（约 line 1938）：保留立即杀，不走 idle timer（失败状态不应保活）。

### 文件 3：`packages/cli/src/commands/serve.ts`

在 `ServeArgs`（line 29-47）中追加 CLI 参数：

```ts
'channel-idle-timeout-ms'?: number;
```

在 yargs builder 中追加参数定义：

```ts
.option('channel-idle-timeout-ms', {
  type: 'number',
  description: 'Milliseconds to keep ACP child alive after last session closes (0 = immediate kill)',
  default: 0,
})
```

### 文件 4：`packages/cli/src/serve/types.ts`

在 `ServeOptions` 中追加：

```ts
channelIdleTimeoutMs?: number;
```

### 文件 5：`packages/cli/src/serve/runQwenServe.ts`

在 bridge 创建调用（line 756-845）中追加：

```ts
...(opts.channelIdleTimeoutMs !== undefined ? { channelIdleTimeoutMs: opts.channelIdleTimeoutMs } : {}),
```

在 `serve.ts` 的 `runQwenServe` 调用（line 231-252）中追加：

```ts
...(argv['channel-idle-timeout-ms'] !== undefined ? { channelIdleTimeoutMs: argv['channel-idle-timeout-ms'] } : {}),
```

### 设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 默认值 | `0`（立即杀，当前行为） | 向后兼容，不改变现有资源占用 |
| timer `.unref()` | 是 | 防止空闲 daemon 因 timer 无法自然退出 |
| restore failure 是否用 idle timer | 否 | 失败状态的 channel 不应保活 |

---

## 涉及文件汇总

| 文件 | 改动类型 |
|------|---------|
| `packages/acp-bridge/src/spawnChannel.ts` | P0-1：加 env var + memory args |
| `packages/acp-bridge/src/bridgeTypes.ts` | P0-2：接口加 `preheat()` |
| `packages/acp-bridge/src/bridgeOptions.ts` | P1-3：接口加 `channelIdleTimeoutMs` |
| `packages/acp-bridge/src/bridge.ts` | P0-2 + P1-3：`preheat()` 实现 + idle timer 逻辑 + 6 个清理点 |
| `packages/cli/src/commands/serve.ts` | P1-3：CLI 参数 |
| `packages/cli/src/serve/types.ts` | P1-3：`ServeOptions` 字段 |
| `packages/cli/src/serve/runQwenServe.ts` | P0-2 + P1-3：preheat 调用 + bridge options 透传 |

---

## 验证

### 单元测试

1. `spawnChannel.ts` — 验证 spawn 的 env 包含 `QWEN_CODE_NO_RELAUNCH=true`，args 包含 `--max-old-space-size`
2. `bridge.ts` — 验证 `preheat()` 调用后 `ensureChannel()` 不再重复 spawn
3. `bridge.ts` — 验证 idle timer：
   - `channelIdleTimeoutMs=0` 时立即杀
   - `channelIdleTimeoutMs=5000` 时延迟 5s 杀
   - 新 session 到达时取消 timer 并复用 channel
   - `shutdown()` 时清理 timer

### 集成测试

用现有 benchmark：

```bash
# 验证 P0-1 + P0-2：冷启动应缩短 0.5-0.8s
QWEN_BENCHMARK_ENABLED=1 npx vitest run integration-tests/cli/qwen-daemon-vs-cli-benchmark.test.ts

# 验证 P1-3：unanchored 吞吐应大幅提升
QWEN_BENCHMARK_ENABLED=1 npx vitest run integration-tests/cli/qwen-daemon-vs-cli-benchmark.test.ts
```

手动验证 P1-3：

```bash
# 启动 daemon 带 idle timeout
node dist/cli.js serve --port 4170 --channel-idle-timeout-ms 10000

# 创建 session → 关闭 → 等 5s → 再创建（应复用 warm channel）
# 创建 session → 关闭 → 等 15s → 再创建（应触发新 channel spawn）
```

### 回归检查

```bash
npx vitest run integration-tests/cli/qwen-serve-routes.test.ts
npx vitest run integration-tests/cli/qwen-serve-baseline.test.ts
npx vitest run integration-tests/cli/qwen-serve-streaming.test.ts
```

## Final Implementation Status

- **PR #4751**: MERGED (2026-06-05) — "feat(daemon): optimize ACP child lifecycle — skip relaunch, preheat, idle keep-alive"
- **Issue #4748**: OPEN (tracking issue remains open for further latency work)
- **Summary**: All three optimizations from this plan were implemented: P0-1 (skip ACP relaunch via `QWEN_CODE_NO_RELAUNCH`), P0-2 (preheat ACP on boot), P1-3 (idle keep-alive with `channelIdleTimeoutMs`). Implementation closely followed the plan.
- **Key divergences**: Minor — the PR also touched `workspaceAgents.test.ts`, `workspaceMemory.test.ts`, `runQwenServe.test.ts` for test coverage. The CLI flag and bridge options landed as planned.
- **Files changed**: `spawnChannel.ts`, `bridge.ts`, `bridgeTypes.ts`, `bridgeOptions.ts`, `runQwenServe.ts`, `serve.ts` (commands), `types.ts`, benchmark tests + unit tests.
