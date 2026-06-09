# Plan: 为 Agent 工具新增 `Kind.Agent`

## Context

当前 Agent（subAgent）工具的 `kind` 硬编码为 `Kind.Other`，导致：
- WebUI 权限弹窗标题退化为通用的 `toolCall.title || 'Permission Required'`，缺少类型化上下文
- 弹窗不展示描述字幕
- 工具调用渲染走 `GenericToolCall` 兜底组件

目标：新增 `Kind.Agent = 'agent'`，让 Agent 工具在权限弹窗和工具渲染中获得专属的展示。

## 改动概览

共涉及 **14 个源文件 + 5 个测试文件**，按层级从内到外排列。

---

### Layer 1: Core 枚举 & 工具声明

**1.1** `packages/core/src/tools/tools.ts:810`
- 在 `Fetch = 'fetch'` 之后、`Other = 'other'` 之前新增 `Agent = 'agent'`
- 不改 `MUTATOR_KINDS`（Agent 不是直接 mutator）
- 不改 `CONCURRENCY_SAFE_KINDS`（Agent 并发由 `coreToolScheduler.ts:918` 按工具名判断）

**1.2** `packages/core/src/tools/agent/agent.ts:474`
- `Kind.Other` → `Kind.Agent`

---

### Layer 2: ACP 映射层

**2.1** `packages/cli/src/acp-integration/session/emitters/ToolCallEmitter.ts:25-35`
- `KIND_MAP` 新增 `[Kind.Agent]: 'agent' as ToolKind`
- 需要 `as ToolKind` 断言，因为外部 `@agentclientprotocol/sdk` 的 `ToolKind` 类型尚未包含 `'agent'`

**2.2** `packages/cli/src/ui/utils/export/normalize.ts:256`
- `allowedKinds` Set 中添加 `'agent'`

---

### Layer 3: ACP Schema & Java SDK

**3.1** `packages/sdk-java/client/src/main/java/com/alibaba/acp/sdk/protocol/schema.json`
- ToolKind oneOf 中 `"other"` 之前插入 `{"const": "agent", "description": "Launching an autonomous sub-agent.", "type": "string"}`

**3.2** `packages/sdk-java/client/src/test/resources/schema/schema.json`
- 同 3.1

**3.3** `packages/sdk-java/client/src/main/java/com/alibaba/acp/sdk/protocol/domain/tool/ToolKind.java:33`
- `OTHER` 之前新增 `AGENT` 枚举值：`@JSONField(name = "agent", label = "Launching an autonomous sub-agent.") AGENT,`

---

### Layer 4: WebUI

**4.1** `packages/webui/src/components/PermissionDrawer.tsx`
- `getTitle()`（line 107-110）：`switch_mode` case 之后新增 `if (toolCall.kind === 'agent') return 'Launch this agent?';`
- subtitle 条件（line 235-239）：追加 `|| toolCall.kind === 'agent'`

**4.2** `packages/webui/src/components/toolcalls/routing.ts:73`
- default 之前新增 `case 'agent': return AgentToolCall;`（处理 rawOutput 尚未设置的 pending 状态）

**4.3** `packages/webui/src/components/toolcalls/labelUtils.ts`
- `getToolDisplayLabel` switch 中新增 `case 'agent': return 'Agent';`

---

### Layer 5: Web-shell

**5.1** `packages/web-shell/client/adapters/messageTypes.ts:23`
- `DaemonMessageToolKind` union 中 `'other'` 之前添加 `| 'agent'`

**5.2** `packages/web-shell/client/adapters/transcriptToMessages.ts:850`
- `inferToolKind` 中 `name === 'agent' || name === 'task'` 的返回值从 `'other'` 改为 `'agent'`

---

### Layer 6: Tests

| 文件 | 改动 |
|------|------|
| `packages/core/src/tools/agent/agent.test.ts:195` | `toBe('other')` → `toBe('agent')` |
| `packages/cli/src/acp-integration/session/emitters/ToolCallEmitter.test.ts:429` | 新增 `Kind.Agent` → `'agent'` 断言 |
| `packages/web-shell/client/adapters/transcriptToMessages.test.ts:1203,1226` | permission block fixture 中 `kind: 'other'` → `'agent'` |
| `packages/web-shell/client/adapters/transcriptToMessages.test.ts:~1947` | `inferToolKind` 测试新增 agent → 'agent' case |
| `packages/core/src/core/coreToolScheduler.test.ts:7375` | Agent mock `kind: Kind.Other` → `Kind.Agent` |
| `packages/sdk-java/client/src/test/java/.../ToolKindTest.java:49` | 新增 `AGENT` round-trip 测试 |

---

## 不改的部分

- `MUTATOR_KINDS` — Agent 不是直接 mutator
- `CONCURRENCY_SAFE_KINDS` — Agent 并发由工具名判断
- `coreToolScheduler.ts:918` — 保持按名称判断
- CLI 终端权限弹窗 — 使用 `ToolCallConfirmationDetails.type` 而非 `kind`
- `node_modules/@agentclientprotocol/sdk` — 外部依赖，用 `as ToolKind` 过渡

## Verification

1. `npm run typecheck` — 确认无类型错误
2. `npm run test -- packages/core/src/tools/agent/agent.test.ts` — Agent kind 断言
3. `npm run test -- packages/cli/src/acp-integration/session/emitters/ToolCallEmitter.test.ts` — KIND_MAP 映射
4. `npm run test -- packages/web-shell/client/adapters/transcriptToMessages.test.ts` — inferToolKind
5. `npm run test -- packages/core/src/core/coreToolScheduler.test.ts` — 并发调度
6. Java SDK: `cd packages/sdk-java && mvn test -pl client -Dtest=ToolKindTest`
7. 启动 WebUI dev server，触发 Agent 工具调用，验证权限弹窗显示 "Launch this agent?" 及描述字幕
