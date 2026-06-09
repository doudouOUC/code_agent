# Fix: mid-turn user messages break rewind count

Issue: https://github.com/QwenLM/qwen-code/issues/4579

## Context

用户在 tool 执行期间打字发送消息（mid-turn user message），之后 rewind 报假的"已被压缩"错误。Live session 和 `--continue` 都可复现。

根因：mid-turn 消息在 UI 中是 `type: 'user'` 的独立条目（被 `isRealUserTurn` 计数），在 API 中却与 `tool_result` 的 `functionResponse` 合并在同一个 Content 里（被 `isUserTextContent` 跳过）。两侧计数不一致导致 `computeApiTruncationIndex` 返回 -1。

同样的 mismatch 也影响 `/diff` 命令（`useTurnDiffs.ts:74` 同样用 `isRealUserTurn` 枚举 turn）。

## 方案

用 `type: 'notification'` 代替 `type: 'user'` 来记录 mid-turn 消息。

**为什么选 `notification`**：
- `notification` 已有完整的类型定义（`HistoryItemNotification`）和渲染支持（`InfoMessage` 组件，`●` 前缀）
- `isRealUserTurn` 不计数 `notification`（只看 `type === 'user'`）
- `RewindSelector` 不显示 `notification`（`getUserTurns` 过滤）
- 语义正确：mid-turn 消息是"通知"性质，不是一个独立的用户 prompt turn
- `notification` 类型在 JSONL resume 时已有处理路径（`resumeHistoryUtils.ts:267-280`）
- 不需要创建新的 type 或改任何类型定义

**为什么不用 `info`**：
- `info` 用于系统通知（rewind 成功、context usage 等），mid-turn 用户消息用 `info` 语义上不太对
- `notification` 已被用于 background agent completion 和 cron fires，和 mid-turn 用户消息更接近

**为什么不用 `btw`**：
- `HistoryItemBtw` 需要 `btw: { question, answer, isPending }` 字段，mid-turn 消息没有独立的 answer
- BTW 有专门的 overlay 渲染逻辑，不是 inline message

## 改动

### 0. 类型定义 — `packages/cli/src/ui/types.ts`

`MessageType` 枚举中没有 `NOTIFICATION`。需要添加：

```diff
  ARENA_SESSION_COMPLETE = 'arena_session_complete',
  INSIGHT_PROGRESS = 'insight_progress',
  BTW = 'btw',
+ NOTIFICATION = 'notification',
  DIFF_STATS = 'diff_stats',
```

（`HistoryItemNotification` 类型定义已存在于 line 264，只是枚举缺少对应值）

### 1. Live path — `packages/cli/src/ui/hooks/useGeminiStream.ts:2351`

```diff
- addItem({ type: MessageType.USER, text: msg }, Date.now());
+ addItem({ type: MessageType.NOTIFICATION, text: msg }, Date.now());
```

mid-turn 消息在 UI 中显示为 `● 插入` 而非 `> 插入`，视觉上区分于正常 user prompt。不被 `isRealUserTurn` 计数，不出现在 rewind selector 中。

**渲染说明**：`notification` 使用 `InfoMessage`（`●` 白色前缀）。用户在 tool 执行期间打字时已经立即看到了自己输入的文本，`●` 前缀在之后的会话历史中清晰表达"这是一条 interjection，不是一个独立的 prompt turn"。resume 后也保持一致。不需要额外加 `[Mid-turn]:` 前缀——保持和 cron/background-agent notification 相同的简洁风格。

### 2. Resume UI path — `packages/cli/src/ui/utils/resumeHistoryUtils.ts:290`

```diff
- items.push({ type: 'user', text });
+ items.push({ type: 'notification', text });
```

对齐 live 路径。`notification` 类型在 `resumeHistoryUtils` 中已有处理先例（line 267-280 处理 `subtype === 'notification'` 和 `subtype === 'cron'`），这里是 `subtype === 'mid_turn_user_message'` 用同样的输出类型。

### ~~3. Resume API path — `sessionService.ts:1228`~~ — 不改

⚠️ 阻止 btw 合并进 tool_result 会产生连续 user-role Content 条目，Gemini API 会拒绝。btw 合并进 tool_result 是正确的 API 行为（对齐 live session 中 `submitQuery` 把 btw text 和 functionResponse 放在同一个 Content 的做法）。

修复只需要 UI 侧：Change 1 和 Change 2 让 mid-turn 消息不再被 `isRealUserTurn` 计数，消除了 UI/API 的 mismatch。API 侧的合并行为保持不变。

### 3. Tests

**`packages/cli/src/ui/hooks/useGeminiStream.test.tsx`** — 更新 mid-turn addItem 断言：
- ~line 629,639: `MessageType.USER` → `MessageType.NOTIFICATION`
- ~line 4955: filter on `MessageType.USER` → 需适配

**`packages/cli/src/ui/utils/historyMapping.test.ts`** — 已有的 bug repro test 改为验证 fix 后行为：当 UI 中 btw 是 `notification` 类型时（不被 `isRealUserTurn` 计数），`computeApiTruncationIndex` 应返回正确的 truncation index（而非 -1）。

**`packages/cli/src/ui/utils/resumeHistoryUtils.test.ts`** — btw resume 测试更新预期类型为 `notification`。

**`packages/core/src/services/sessionService.test.ts`** — 不改（API 合并行为保持不变）。

## 不改的地方

- **`isUserTextContent` / `isRealUserTurn`** — 这两个函数的语义是正确的，问题在调用方传入了错误的数据
- **`useGeminiStream.ts:2346` (API 侧)** — mid-turn 消息合并进 tool_result 发给模型是正确行为（qwen-code 的特色功能），不改
- **`sessionService.ts:1228` (resume API 侧)** — btw 合并进 tool_result 是正确的 API 行为，阻止合并会产生连续 user-role Content 导致 Gemini API 报错，不改
- **`HistoryItemDisplay.tsx`** — `notification` 已有渲染支持，无需改
- **ACP `Session.ts:417`** — `#computeApiTruncationIndexForUserTurn` 的 `targetTurnIndex` 参数来自外部，不受此 fix 影响

## 副作用评估

| 影响点 | 风险 | 说明 |
|--------|------|------|
| Away summary count (`useAwaySummary.ts:55`) | 无 | mid-turn 不应计为独立 turn，修复后计数更准确 |
| User message dedup (`useHistoryManager.ts:58`) | 极低 | notification 不走 user dedup，连发相同 btw 会显示两条（边界场景） |
| Cross-session history (上箭头) | 无 | 过滤 `type === 'user'`，mid-turn 不再出现在上箭头历史中（正确行为） |
| isSyntheticHistoryItem | 无 | notification 已在 synthetic list 中，auto-restore 视为可忽略（正确） |
| Visual rendering | 低 | mid-turn 从 `> text` 变为 `● text`，视觉上区分于正常 prompt，更清晰 |
| `/diff` 命令 | 无 | mid-turn 消息没有 `promptId`，`useTurnDiffs.ts:86` 本来就跳过它们 |
| ACP HistoryReplayer | 无 | ACP 不支持 rewind，mid-turn 通过 `emitUserMessage` 发送不受影响 |
| 连发相同 btw 去重 | 极低 | `useHistoryManager.ts:58` 只对 `type === 'user'` 去重，notification 不走去重路径 |

## 验证

```bash
# 1. 单测
npx vitest run packages/core/src/services/sessionService.test.ts
npx vitest run packages/cli/src/ui/utils/historyMapping.test.ts

# 2. 合成 JSONL 复现（--continue 路径）
python3 /tmp/qwen-btw-repro/gen_session.py
cd /private/tmp/qwen-btw-repro && qwen --continue
# /rewind → 选 #3 或最后一个 turn → 应成功，不报错

# 3. Live session 复现
qwen
# 发 "Hi，请依次调用3次工具" → 工具执行时打字 "插入" 回车 → 再发一条消息
# /rewind → 选最后一个 turn → 应成功
# mid-turn 消息应显示为 ● 而非 >
```
