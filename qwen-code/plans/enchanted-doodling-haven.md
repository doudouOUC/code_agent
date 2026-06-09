# Fix: `ring_evicted` resync — reset store to accept ring replay

## Context

WebUI 客户端断连重连时，如果 SSE 的 `Last-Event-ID` 已落后 EventBus ring buffer，daemon 发出 `state_resync_required(ring_evicted)`。当前 WebUI 对此 **不做任何恢复**（fall-through no-op），而 reducer 已设置 `awaitingResync = true`，导致随后的 ring replay 事件全部被丢弃，transcript 留下历史空洞。

`epoch_reset` 路径已有正确恢复：`store.reset()` 清空 state → replay 事件重建 transcript。`ring_evicted` 应走相同路径。

## 事件流时间线（修复后）

```
state_resync_required{ring_evicted}   → dispatch → reducer 设 awaitingResync=true
                                      → handler → store.reset() → awaitingResync=false, blocks=[]
replay event #2634                    → dispatch → reducer 正常处理，创建新 blocks
replay event #2635                    → ...
...
replay event #10633                   → ...
replay_complete                       → handler → 清除 catchingUp
live event #10634                     → dispatch → 正常
```

## 改动

### 1. `packages/webui/src/daemon/session/DaemonSessionProvider.tsx` (~行 511-514)

将 `ring_evicted` 从 fall-through no-op 改为 `store.reset()`：

```typescript
// 现在:
if (reason === 'epoch_reset') {
    store.reset();
    activeSession.setLastEventId(0);
} else if (reason !== 'ring_evicted') {   // ring_evicted → no-op
    resyncRequested = true;
    ...
}

// 改为:
if (reason === 'epoch_reset') {
    store.reset();
    activeSession.setLastEventId(0);
} else if (reason === 'ring_evicted') {
    store.reset();
} else {
    resyncRequested = true;
    store.reset();
    session = undefined;
    ...
    break;
}
```

**不需要 `setLastEventId(0)`**：`ring_evicted` 时 SSE 流仍然活着，replay 事件已在 subscriber queue 中排好队。`epoch_reset` 需要 `setLastEventId(0)` 是因为 daemon 重启后序列号不兼容。

**不做 full reconnect**：SSE 流未断，replay + live 事件已在排队。`loadSession` HTTP 响应不含 transcript 数据，重连会再次用 `Last-Event-ID: 0` 命中同样的 ring eviction。

### 2. `packages/sdk-typescript/src/daemon/ui/transcript.ts` (行 319)

去掉误导性的 "Reload the session to recover."：

```typescript
// 现在:
`State resync required: ${formatMissedRange(...)}.  Reload the session to recover.`

// 改为:
`State resync required: ${formatMissedRange(...)}.`
```

WebUI 现在自动恢复，reload 没用（会再次触发 ring eviction）。Terminal 端有自己的 formatter（`terminal.ts`），不受影响。

### 3. `packages/webui/src/daemon/session/DaemonSessionProvider.test.tsx`

**修改** "clears awaitingResync on replay_complete after ring-evicted resync" (行 1937)：
- 在 `state_resync_required` 和 `replay_complete` 之间加一个 replay session_update 事件
- 断言 replay 事件被正确处理（出现在 transcript 中），而非被 awaitingResync 丢弃
- 断言旧的 error status block 被 reset 清除

**修改** "clears ring-evicted awaitingResync on same-session reattach" (行 2008)：
- 第一个流仍然触发 `ring_evicted`，但 store 现在会 reset
- 更新断言：`ring_evicted` 后不应再有 error block（已被 reset 清除）

### 4. `packages/sdk-typescript/test/unit/daemonUi.test.ts`

- 行 2323: 断言用 `stringContaining('State resync required')` 匹配，不含 "Reload"，无需改动
- 确认无其他测试匹配 "Reload the session" 文本

## 已验证的边界条件

| 条件 | 结论 |
|------|------|
| `replay_complete` 是否一定会到达？ | 是。EventBus 在 subscribe() 中无条件 force-push |
| replay 事件能否与 live 事件交叉？ | 不能。replay 在 subscribe() 中同步 force-push 完毕 |
| 能否同时收到 epoch_reset + ring_evicted？ | 不能。EventBus 中 if/else 互斥 |
| reset 后 replay_complete handler 是否安全？ | 是。clearAwaitingResync 对 false 状态 early-return |
| catchingUp 状态是否正确？ | 是。reset 不影响 connection state，replay_complete 正常清除 |
| reset 后 reducer 能否从 replay 事件创建新 blocks？ | 是。activeBlockId 全为 undefined，reducer 走创建路径 |
| 与 PR #4694 是否冲突？ | 不冲突。#4694 改初始 load 路径，我们改运行中重连路径 |

## 验证

```bash
cd packages/sdk-typescript && npx vitest run test/unit/daemonUi.test.ts
cd packages/webui && npx vitest run src/daemon/session/DaemonSessionProvider.test.tsx
```

## Final Implementation Status

- **PR #4694**: MERGED (2026-06-03) — "fix(daemon): compacted session replay for long-session recovery"
- **Summary**: The PR addressed the broader daemon session replay problem. This plan specifically targets the `ring_evicted` resync path in WebUI's `DaemonSessionProvider.tsx` — making it call `store.reset()` (like `epoch_reset`) instead of being a no-op. PR #4694 focused on compaction-based replay, which is complementary.
- **Key divergences**: PR #4694 landed a compaction engine (`compactionEngine.ts`) and SDK `DaemonSessionClient` compaction support rather than the narrow `ring_evicted` store.reset() fix described here. The `ring_evicted` fix may have been folded in or remains as a follow-up.
- **Files changed in #4694**: `bridge.ts`, `bridgeTypes.ts`, `compactionEngine.ts` (new), `eventBus.ts`, `DaemonSessionClient.ts`, `types.ts` + tests.
