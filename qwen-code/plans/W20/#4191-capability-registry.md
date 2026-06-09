# Wave 1 PR 4 — `feat(protocol): typed daemon event schema v1`

Issue: https://github.com/QwenLM/qwen-code/issues/4175 (Wave 1 PR 4)
Branch: from `main` (deps PR 2 #4191 + PR 3 #4201 already merged)

## Context

Mode B daemon (`qwen serve`) 当前向 SSE 广播帧的 envelope 是 `DaemonEvent { id?, v: 1, type: string, data: unknown, originatorClientId? }`（`packages/sdk-typescript/src/daemon/types.ts:132`）。`data: unknown` 让所有消费者必须 cast，测试代码里就有 6+ 处 inline `as { ... }`，且 `DaemonSessionClient.ts:47` docstring 明确说 "typed event reducers belong to the protocol schema layer" — PR 4 就是来填这个层。

PR 4 是 Wave 1 协议骨架的最后一块：解锁 PR 7（daemon-stamped clientId）和 PR 8（session-scoped permission），因为它们都需要先有"按 type 区分的 event 形状"才能往里加 envelope 字段或新 frame 类型。

## Goal

为 SDK 加一个 discriminated union (`TypedDaemonEvent`) + narrow helper + reducer skeleton (`SessionState`)，**不改任何现有运行时代码路径**，原 `DaemonEvent` 接口保持原样。daemon 端在 capability registry advertise 一个 `typed_event_schema` tag。

## Key decisions

1. **Union 放 SDK，不动 `BridgeEvent`**。CLI 侧的 `BridgeEvent`（`packages/cli/src/serve/eventBus.ts:117` 已有 FIXME 想提取共享包）保持独立定义，作为独立 follow-up，不在 PR 4 scope。
2. **保留 `DaemonEvent` 完全不动**。新增 `TypedDaemonEvent` 作为 envelope 子集（同 `id?/v: 1/originatorClientId?` 字段），通过 `narrowDaemonEvent(event)` 转换。`DaemonClient.subscribeEvents` / `DaemonSessionClient.events` 签名不变。
3. **`parseFrame` 不动**。typed union 仅做 compile-time narrowing，不做 runtime data shape 校验。`v: 1` 的 forward-compat 契约（"clients should ignore frames whose v they don't understand"）必须保持。
4. **ACP 类型用 type-only import**。新增 `@agentclientprotocol/sdk` 到 sdk-typescript dependency（用户已确认），所有引用走 `import type * as ACP from '@agentclientprotocol/sdk'`，避免运行时拉 ACP runtime。
5. **Envelope 用泛型** `DaemonEventEnvelope<TType, TData>` 减少 8 次重复声明。
6. **Reducer 折中处理 `session_update`**：仅记 `lastSessionUpdateMarker` + `sessionUpdateCount`（< 5 行，纯 liveness signal），不解读 ACP message payload —— 真正的累积逻辑留给 PR 25 output sinks。其它 7 个帧（含 `session_died` 三个子型）做完整结构转换。
7. **Capability tag 命名 `typed_event_schema`**（不带 `_v1`，因为 `DaemonCapabilities.v: 1` + `protocolVersions.current = 'v1'` 已承载版本号）。
8. **`permission_resolved.outcome` 直接用 `ACP.RequestPermissionOutcome`**（已是 ACP 内置 union），不要复用本地 `PermissionOutcome`（避免新增第 3 份副本，本地副本统一另外做 follow-up）。

## Frame inventory (typed union 成员)

| `type` | data shape | 来源 (read-only ref) | 备注 |
|---|---|---|---|
| `session_update` | `ACP.SessionNotification` | `httpAcpBridge.ts:807` | 完整含 `sessionId+update+_meta?` |
| `permission_request` | `{ requestId, sessionId, toolCall: ACP.ToolCallUpdate, options: ACP.PermissionOption[] }` | `httpAcpBridge.ts:767` | |
| `permission_resolved` | `{ requestId, outcome: ACP.RequestPermissionOutcome }` | `httpAcpBridge.ts:1206` | |
| `model_switched` | `{ sessionId, modelId }` | `httpAcpBridge.ts:1600 / 2139` | |
| `model_switch_failed` | `{ sessionId, requestedModelId, error }` | `httpAcpBridge.ts:1608 / 2125` | |
| `session_died` | sub-discriminated on `reason`（见下） | `httpAcpBridge.ts:1360 / 2191 / 2327` | 3 子型 |
| `client_evicted` | `{ reason: 'queue_overflow', droppedAfter }` | `eventBus.ts:203` | synthetic, 无 id |
| `stream_error` | `{ error }` | `server.ts:764` | synthetic, 无 id, **不走 EventBus** |

`SessionDiedData`：
```ts
type SessionDiedData =
  | { sessionId: string; reason: 'channel_closed'; exitCode: number | null; signalCode: string | null }
  | { sessionId: string; reason: 'killed' }
  | { sessionId: string; reason: 'daemon_shutdown' };
```

## File layout

**新增**:
- `packages/sdk-typescript/src/daemon/events.ts` — `DaemonEventEnvelope<T,D>` + 8 个 frame alias + `TypedDaemonEvent` + `KNOWN_DAEMON_EVENT_TYPES` + `narrowDaemonEvent` + `isTypedDaemonEvent` + `DAEMON_FEATURE_TYPED_EVENT_SCHEMA` 常量
- `packages/sdk-typescript/src/daemon/sessionState.ts` — `SessionState` + `createSessionState` + `applyDaemonEvent` + `createSessionStateReducer`
- `packages/sdk-typescript/test/unit/daemon-events.test.ts`
- `packages/sdk-typescript/test/unit/daemon-session-state.test.ts`

**修改**:
- `packages/sdk-typescript/src/daemon/index.ts` — re-export 新增 types/functions/constants
- `packages/sdk-typescript/package.json` — 加 `@agentclientprotocol/sdk: ^0.14.1`（与 `packages/cli/package.json` 同版本对齐）
- `packages/cli/src/serve/capabilities.ts` — 在 `SERVE_CAPABILITY_REGISTRY` 末尾加 `typed_event_schema: { since: 'v1' }`
- `packages/cli/src/serve/capabilities.test.ts`（如存在快照） — 更新 advertised features 数组

**不动**: `types.ts`、`sse.ts`、`DaemonClient.ts`、`DaemonSessionClient.ts`、`eventBus.ts`、`httpAcpBridge.ts`、所有 daemon emit 代码。

## 类型骨架要点

```ts
// events.ts
export interface DaemonEventEnvelope<TType extends string, TData> {
  id?: number;
  v: 1;
  type: TType;
  data: TData;
  originatorClientId?: string;
}

export type SessionUpdateFrame = DaemonEventEnvelope<'session_update', ACP.SessionNotification>;
// ... 其余 7 个 alias
export type TypedDaemonEvent =
  | SessionUpdateFrame
  | PermissionRequestFrame
  | PermissionResolvedFrame
  | ModelSwitchedFrame
  | ModelSwitchFailedFrame
  | SessionDiedFrame
  | ClientEvictedFrame
  | StreamErrorFrame;

export const KNOWN_DAEMON_EVENT_TYPES = [
  'session_update', 'permission_request', 'permission_resolved',
  'model_switched', 'model_switch_failed', 'session_died',
  'client_evicted', 'stream_error',
] as const;

export type NarrowedDaemonEvent =
  | { kind: 'typed'; event: TypedDaemonEvent }
  | { kind: 'unknown'; event: DaemonEvent };

export function narrowDaemonEvent(event: DaemonEvent): NarrowedDaemonEvent;
export function isTypedDaemonEvent(event: DaemonEvent): event is TypedDaemonEvent;
export const DAEMON_FEATURE_TYPED_EVENT_SCHEMA = 'typed_event_schema' as const;
```

`narrowDaemonEvent` 实现核心：检查 `event.v === 1` + `KNOWN_DAEMON_EVENT_TYPES.includes(event.type)`，**不验证 data shape**（forward-compat）。docstring 明确 "type discriminator narrowing only, not data validation; consumers must still guard data shape if interop with untrusted daemon"。

## Reducer 要点

```ts
// sessionState.ts
export interface SessionState {
  sessionId: string;
  currentModelId?: string;
  modelSwitchError?: string;
  pendingPermissions: Map<string, { sessionId: string; toolCall: ACP.ToolCallUpdate; options: ACP.PermissionOption[] }>;
  resolvedPermissions: Map<string, ACP.RequestPermissionOutcome>;
  terminated?: { reason: 'channel_closed' | 'killed' | 'daemon_shutdown'; exitCode?: number | null; signalCode?: string | null };
  evicted?: { droppedAfter: number };
  streamError?: string;
  lastSessionUpdateMarker?: number;  // monotonic; 取 event.id ?? sessionUpdateCount+1
  sessionUpdateCount: number;
}

export type SessionStateReducer = (state: SessionState, event: TypedDaemonEvent) => SessionState;
```

实现要求：
- **纯函数**：不读 `Date.now()`、不调外部
- exhaustive switch on `event.type`，每 case 返回新对象（immutable）
- `session_died` case **必须清空 `pendingPermissions`**（终止态语义）
- `client_evicted` / `stream_error` **不清** pending（client 侧错误，session 可能仍活着）
- `session_update` 仅 `sessionUpdateCount++` + 更新 `lastSessionUpdateMarker`，注释解释"payload accumulation deferred to PR 25 output sinks"
- 用 `never` 兜底确保 union 完整性

## Capability 注册

`packages/cli/src/serve/capabilities.ts` 第 36 行 `} as const satisfies` 之前加一行：
```ts
typed_event_schema: { since: 'v1' },
```
SDK 端 `events.ts` 导出 `DAEMON_FEATURE_TYPED_EVENT_SCHEMA = 'typed_event_schema'` 常量，便于消费者 `caps.features.includes(DAEMON_FEATURE_TYPED_EVENT_SCHEMA)`。**SDK 不 gate 任何行为 off 这个 tag** — narrow 对老 daemon 仍工作（按 type 字符串）。

## Implementation steps（独立 commit）

1. **commit 1**: `chore(sdk): add @agentclientprotocol/sdk dependency` — 仅改 `packages/sdk-typescript/package.json`，无代码改动
2. **commit 2**: `feat(sdk): add TypedDaemonEvent discriminated union and narrow helper` — 新增 `events.ts` + `daemon-events.test.ts` + `index.ts` re-export
3. **commit 3**: `feat(sdk): add SessionState reducer skeleton` — 新增 `sessionState.ts` + `daemon-session-state.test.ts` + `index.ts` re-export
4. **commit 4**: `feat(serve): advertise typed_event_schema capability` — 改 `capabilities.ts`（+ 可能的快照测试）
5. **commit 5（optional）**: `docs(sdk): point DaemonSessionClient docstring to sessionState reducer` — 改 `DaemonSessionClient.ts:47` 那条 docstring，加一句指引 `// see ./sessionState.ts`

每步独立 `npm test` 通过；commit 顺序保证 reviewer 可逐步消化。

## Test matrix

**daemon-events.test.ts**:
- 每个 frame type → narrow → `kind: 'typed'`，data 字段在 narrowed 分支可被 assigned to 对应 ACP/local 类型（compile-time via `expectTypeOf`）
- 未知 type（`'foo_bar'`）→ `kind: 'unknown'`
- `v: 2` 的 envelope → `kind: 'unknown'`（forward-compat）
- `isTypedDaemonEvent` 与 `narrowDaemonEvent` 一致性
- `KNOWN_DAEMON_EVENT_TYPES.length === 8`

**daemon-session-state.test.ts**:
- 每个 frame type 一个 reducer transition 测试（含 `session_died` 三个子型）
- `permission_request` → `permission_resolved` 端到端：pending → resolved
- `session_died` 任一 reason 都清空 pending
- `client_evicted` / `stream_error` 不清 pending
- `session_update` 仅增 counter + marker，不触碰其他字段
- 输入未知 frame（强转 DaemonEvent → TypedDaemonEvent）→ state 不变
- exhaustive switch 用 `never` 守护（new frame type 加进 union 时编译失败）

无需 e2e。`DaemonSessionClient.test.ts` 现有测试必须继续通过（PR 4 不动它）。

## Engineering principles self-check (PR description checklist)

- [x] **Independently mergeable**: 不改任何现有运行时路径
- [x] **Backward compatible**: `DaemonEvent` / `subscribeEvents` / `events()` 签名不变；新增全部 additive；parseFrame 不变
- [x] **Default off**: 新 union 是纯类型 + 一个 narrow 函数；老消费者不用改任何代码
- [x] **Stage 1 routes preserved**: 不动任何 HTTP/SSE 路由
- [x] **Gradual migration**: SDK 用户增量采用 narrow helper
- [x] **Reversible**: 删 events.ts/sessionState.ts + revert capabilities.ts 一行 = 完全回滚
- [x] **Tests-first**: 单测覆盖 narrow + reducer 全部 transitions

## Risks / deferred items（PR description 必写）

1. `BridgeEvent` 与 `DaemonEvent` 仍是结构平行副本 — 跟踪 `eventBus.ts:117` FIXME，独立 follow-up
2. `session_update` payload 累积未实现，reducer 仅记 marker — 留给 PR 25 output sinks
3. `parseFrame` 不做 per-type data 校验 — forward-compat 设计选择，narrow docstring 写明
4. 本地 `PermissionOutcome` 与 ACP `RequestPermissionOutcome` 共存 — 本地副本统一是另一个 follow-up
5. `originatorClientId` 仍未 populate — PR 7 范围
6. native daemon mode 帧集合未来再定义
7. `KNOWN_DAEMON_EVENT_TYPES` 是手维护元组 — 未来若 daemon 端从 `BridgeEvent` 提取共享常量，SDK 应订阅

## Verification

```bash
# 在 worktree root 跑：
npm install                                              # commit 1 之后，确保 ACP 拉到位
npm --workspace=@qwen-code/sdk run test                  # commit 2/3 之后
npm --workspace=@qwen-code/qwen-code run test            # commit 4 之后，确保 capabilities 测试通过
npm run lint && npm run typecheck                        # 全仓
```

手动 smoke：起 `qwen serve` daemon → SDK 客户端 subscribe → 触发各类 frame（创建 session / 发 prompt 触发 tool call permission / kill session）→ narrow 每帧确认 `kind: 'typed'` + 类型推断正确 → reducer 累积 SessionState 与预期一致。

## Final Implementation Status

- **PR status**: MERGED — PR #4217 "feat(protocol): typed daemon event schema v1" merged 2026-05-17. Prerequisite PRs #4191 and #4201 also merged 2026-05-16.
- **Summary**: The typed daemon event discriminated union, narrow helper, and test suite were implemented in the SDK package. The capability tag registration was included.
- **Key divergences**: The `SessionState` reducer skeleton (planned commit 3) and capability advertisement in `capabilities.ts` (commit 4) are not visible in the PR #4217 diff — it only touched `packages/sdk-typescript/src/daemon/events.ts`, `index.ts`, `README.md`, and `test/unit/daemonEvents.test.ts`. The reducer was likely deferred to a follow-up (PR #4271 or later). The `@agentclientprotocol/sdk` dependency addition (planned commit 1) was also not in this PR's diff.
- **Files actually changed**: `packages/sdk-typescript/src/daemon/events.ts`, `packages/sdk-typescript/src/daemon/index.ts`, `packages/sdk-typescript/src/index.ts`, `packages/sdk-typescript/README.md`, `packages/sdk-typescript/test/unit/daemonEvents.test.ts`

## Critical reference files (read-only during implementation)

- `packages/sdk-typescript/src/daemon/types.ts:132` — DaemonEvent envelope（不动，参考）
- `packages/sdk-typescript/src/daemon/index.ts` — re-export 入口
- `packages/sdk-typescript/src/daemon/DaemonSessionClient.ts:40-55` — docstring 指引点
- `packages/cli/src/serve/capabilities.ts` — capability registry
- `packages/cli/src/serve/httpAcpBridge.ts:767-1614, 2125-2329` — frame emit 全部 ground truth
- `packages/cli/src/serve/eventBus.ts:117, 203` — BridgeEvent FIXME + client_evicted emit
- `packages/cli/src/serve/server.ts:764` — stream_error emit（HTTP 直写，不走 bus）
