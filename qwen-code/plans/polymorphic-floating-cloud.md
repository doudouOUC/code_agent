# Fix: CompactionEngine 丢失 parentToolCallId 导致子 agent thought/content 找不到归属

## Context

用户反馈 daemon 模式 load session 后 "有些 thought 和 content 找不到归属"。根因定位到 `TurnBoundaryCompactionEngine.mergeTextSlot`：当多个并行子 agent 同时流式输出 thought/message 时，compaction 将所有连续同类 chunk 合并到一个 slot，只保留最后一条的 `_meta`，导致 `parentToolCallId` 丢失。下游 transcript reducer 无法将 text block 路由到正确的 subagent tool call。

实测数据：808 个 `agent_thought_chunk` 中 0 个有 `parentToolCallId`；98 个有 `parentToolCallId` 的 `agent_message_chunk` 全是 usage metadata（被 tool_call 事件打断了连续性才幸免）。

## 修改范围

仅改 2 个文件，不涉及 normalizer / transcript reducer / MessageEmitter（它们已正确处理 parentToolCallId）。

### 1. `packages/acp-bridge/src/compactionEngine.ts`

#### 1a. `CompactedSlot` 类型增加 `parentToolCallId`

```typescript
type CompactedSlot =
  | { kind: 'text'; parentToolCallId?: string; chunks: string[]; lastEventId: number; lastMeta: unknown }
  | { kind: 'thought'; parentToolCallId?: string; chunks: string[]; lastEventId: number; lastMeta: unknown }
  | ... // tool, misc, latestWins 不变
```

#### 1b. 新增 `textSlotIndex` 索引（类比 `toolSlotIndex`）

```typescript
private textSlotIndex: Map<string, number> = new Map();
```

key 格式：`"text::call_xxx"` 或 `"thought::call_xxx"`，仅用于有 `parentToolCallId` 的子 agent chunk。

在 `compactCurrentTurn` 和 `close()` 中清理 `this.textSlotIndex.clear()`。

#### 1c. 新增 helper

```typescript
function extractParentToolCallIdFromMeta(meta: unknown): string | undefined {
  if (typeof meta === 'object' && meta !== null) {
    const val = (meta as Record<string, unknown>)['parentToolCallId'];
    return typeof val === 'string' && val.length > 0 ? val : undefined;
  }
  return undefined;
}
```

#### 1d. 重写 `mergeTextSlot` — 双路径逻辑

- **有 parentToolCallId（子 agent chunk）**：用 `textSlotIndex` 按 `(kind, parentToolCallId)` 查找已有 slot，找到则追加，否则创建新 slot 并注册到 index。允许非连续合并（因为并行子 agent 的 chunk 天然是交错的）。
- **无 parentToolCallId（主 agent chunk）**：保持原有的"仅合并连续同类"逻辑，但增加条件：最后一个 slot 的 `parentToolCallId` 也必须为 undefined。防止主 agent chunk 被错误合并到子 agent slot。

### 2. `packages/acp-bridge/src/compactionEngine.test.ts`

新增 `describe('parentToolCallId-aware text merging')` 块，包含：

| 用例 | 验证点 |
|------|--------|
| 不同 parentToolCallId 产生独立 slot | 两个子 agent 的文本不混合 |
| 相同 parentToolCallId 非连续 chunk 合并 | 交错的 chunk 按 parentToolCallId 聚合 |
| 主 agent chunk 不与子 agent chunk 合并 | 无/有 parentToolCallId 的 chunk 分离 |
| tool_call 间穿插的子 agent chunk 仍正确合并 | 子 agent 的 indexed merge 跨 tool slot 工作 |
| 9 个并行子 agent 压力测试 | 还原生产场景，每个 agent 3 轮 chunk，验证 9 个独立输出 |
| 向后兼容 | 无 parentToolCallId 的 session 行为不变（现有测试全量通过即可） |

新增 helper：`makeTextChunkWithParent(id, text, parentToolCallId)` / `makeThoughtChunkWithParent(id, text, parentToolCallId)`。

## 不需要改的部分

| 组件 | 原因 |
|------|------|
| `MessageEmitter.ts` | 已正确在 `_meta` 中设置 `parentToolCallId` |
| `normalizer.ts` | 已正确从 `_meta` 提取 `parentToolCallId` |
| `transcript.ts` | 已正确按 `parentToolCallId` 路由到 keyed maps |
| `SubAgentTracker.ts` | `createStreamTextHandler` 已正确传递 `subagentMeta` |

### 审计后补充

#### `compactCurrentTurn` 输出防御性保障

当 `slot.parentToolCallId` 有值但 `lastMeta` 为 undefined 或不含 `parentToolCallId` 时，回填到 `_meta`：

```typescript
case 'thought':
case 'text': {
  let meta = slot.lastMeta;
  if (slot.parentToolCallId && extractParentToolCallIdFromMeta(meta) !== slot.parentToolCallId) {
    meta = { ...(typeof meta === 'object' && meta !== null ? meta : {}), parentToolCallId: slot.parentToolCallId };
  }
  compacted.push(makeMergedSessionUpdateEvent(..., meta));
}
```

#### 补充测试用例

| 用例 | 验证点 |
|------|--------|
| 同一 subagent 的 thought + text 产生独立 slot | key 格式 `kind::parentToolCallId` 正确区分 |
| `[subA, main, main, subA]` 交错 | subA 合并为 1 条，main 合并为 1 条 |
| 所有测试显式断言 `_meta.parentToolCallId` | 不仅验证文本，还验证归属信息 |

#### Known limitation

子 agent chunk 的 indexed merge 会跨 tool_call 边界合并，导致 thought 文本被提前到 tool 之前。相比现状（乱码 + 归属完全丢失）是严格改善，后续可细化为按 tool_call 边界分段。

## 验证

1. `cd packages/acp-bridge && npx vitest run src/compactionEngine.test.ts` — 新增用例通过 + 全量回归
2. 用原始数据手动验证：compacted 输出中每个子 agent 的 thought/message 独立且带正确 `parentToolCallId`
