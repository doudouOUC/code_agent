# Managed Agent Public API 与 WebShell 契约

状态：v1.12 目标契约；日期：2026-09-21。在 v1.10 的持久 operation、Action、生命周期与 actor 授权之上细化 planned W0 创建前能力、默认 Workspace 与创建权限提示；v1.11 完整工具结果新增接口仍是候选，尚未全部纳入。机器可读契约见 [`managed-agent-public-api.openapi.yaml`](managed-agent-public-api.openapi.yaml)。该文件是 Java DTO、WebShell TypeScript 类型和契约测试的单一来源；当前源码未生成这些类型，OpenAPI 中用 `x-qwen-implementation-status` 区分“已有路由但契约未完全对齐”的 `partial` 与尚未实现的 `planned`，全部契约通过后才改为 `implemented`。

## 1. 路由与兼容范围

- 公共资源前缀固定为 `/v1/agents`，Session 前缀固定为 `/v1/agents/sessions`；不再另建 `/v1/sessions` 或实验 `/managed/sessions*` 作为正式资源。
- WebShell BFF 适配前缀固定为 `/api/agent/web-shell/v1`。适配层只改变传输形状，不建立另一套 Session、Turn、事件或幂等语义。
- `POST /v1/agents/sessions`、Session 列表/查询、输入/取消事件、Session 事件查询/SSE，以及带 Snapshot 水位的 Item 列表是当前阶段性实现。AgentDefinition、删除、Turn/Artifact 资源仍为阶段 D 的 `planned` 接口。
- 旧 `/managed/sessions*` 只用于实验兼容；公共 API 完成准入、查询、事件和幂等覆盖后删除，不写入本契约。

## 2. 身份、租户与授权

生产入口先完成终端用户认证，再由可信 Gateway 从认证上下文注入 `X-Qwen-Tenant-Id`。浏览器提供的同名 Header 必须在边界处删除或覆盖；它是授权范围，不是身份凭证。

每个 Session、Turn、Item、Artifact 和事件查询都用 `(tenantId, resourceId)` 校验。资源不存在和跨租户访问都返回 `404 session_not_found` 或对应资源的 `*_not_found`，不通过 `403` 泄露资源是否存在。Java 到 Harness、Runtime、RocketMQ 和节点间通知使用工作负载身份或 mTLS，不能转发浏览器 Cookie、用户 Token 或可伪造的 tenant 查询参数。

## 3. 幂等、请求关联与错误

- 所有会创建或推进业务状态的请求必须携带调用前生成的稳定幂等键。公共 REST 使用 `Idempotency-Key` Header；WebShell adapter 使用请求体的 `idempotencyKey`。
- 目标唯一域为 tenant/session/operation/actor/key（创建时用 create scope），当前权限复核后，相同摘要返回原结果，并用 `replayed: true` 或 `X-Qwen-Idempotent-Replay: true` 表示重放；同键不同摘要返回 `409 idempotency_conflict`。
- `requestId` 只用于 trace 关联，不参与业务幂等。WebShell 当前 DTO 中该字段尚未生效；接入生成类型时必须把它写入 trace 并回传 `X-Request-Id`，未实现前客户端不得依赖它。
- 错误统一为 `{"error":{"code":"...","message":"...","request_id":"..."}}`。至少冻结 `invalid_request`、`invalid_limit`、`invalid_cursor`、`invalid_event_cursor`、`unsupported_event`、`unsupported_feature`、`idempotency_conflict`、`session_not_found`、`turn_not_found`、`session_not_active`、`turn_active`、`cursor_expired`、`recovery_blocked`、`over_capacity` 和 `internal_error`。

## 4. 分页、事件与 SSE

- Session 列表使用不透明 `cursor`，排序固定为 `updatedAt DESC, sessionId DESC`。`limit` 默认 20，范围 1～100。
- Transcript、Item 和事件历史使用公开 `sequence`，不能暴露 Harness event ID、RocketMQ offset 或数据库自增 offset。
- JSON 事件查询的 `after` 表示严格大于该 sequence，`limit` 默认 100，范围 1～1000；响应给出 `has_more` 和 `next_cursor`。
- SSE 使用 `id: <sequence>`、`event: <type>`，`data` 是完整 `PublicEvent` JSON。重连优先读取 `Last-Event-ID`，Header 与查询参数同时存在时 Header 胜出。
- WebShell 的 POST SSE 通过 `fetch` 流读取，`afterSequence` 与公共 `Last-Event-ID` 同义。原 DTO 的 `limit` 没有稳定的流语义，v1.6 契约删除该字段；兼容代码可暂时忽略，生成 DTO 接管后删除。
- 游标早于 `replayFloorSequence` 时，JSON 查询返回 `409 cursor_expired`；SSE 发送一次 `agent.session.resync_required` 后关闭，其中包含 `replayFloorSequence`、`snapshotThroughSequence` 和重新读取 Session/Items 的动作。客户端读取 Snapshot/Items 后从 `snapshotThroughSequence` 继续订阅。
- 网络断开不取消 Turn。终态只由持久 `turn.completed`、`turn.failed` 或 `turn.cancelled` 事件决定。

## 5. 版本与能力协商

公共 JSON 和 SSE 事件携带 `schema_version` 与 `projection_version`，BFF 映射为 `schemaVersion/projectionVersion`。Session 响应携带 `capabilities`，至少声明 `items`、`snapshots`、`artifacts` 和 `resync` 是否可用。服务端不得向未声明 Snapshot reset 能力的客户端清理其所需增量。

兼容规则如下：

1. 同一主版本只允许增加可选字段和新事件类型；客户端必须忽略未知可选字段，并把未知终态事件当作需要刷新 Session 的信号。
2. 删除或改变必填字段、游标语义和状态含义时提升 API 主版本。
3. `schemaVersion` 决定事件封装；`projectionVersion` 决定 Item/Snapshot 解释。重放必须返回最初接受时的版本，不能用最新版投影器重写历史事件。

## 6. 阶段 H 扩展资源

HTML v1.7 的[扩展运行时](managed-agent-extension-runtime.md#11-webshell-与公共接口)在当前 Session/Turn/Item API 上增加 Task、MCP catalog、Hook catalog、Automation 和 Channel/Delivery 资源。WebShell 仍只访问 Java BFF，不直连 Harness 或 Runtime；后台输出与 Monitor 原始行通过受控 Artifact/分页游标读取，不写入每行一个主对话事件。

阶段 H 的 Task/MCP/Hook/Channel/Automation 路由和 DTO 尚未加入 OpenAPI，因此仍属于设计候选，不能被生产发现或 SDK 暴露。实现 H0 前先在 `managed-agent-public-api.openapi.yaml` 冻结 `SessionTaskView`、任务查询/取消、幂等命令和错误，再按 H1～H6 分别加入 MCP、Hooks、Channel 与 Automation 资源。daemon 已有的 `/session/:id/tasks`、`/session/:id/hooks`、workspace MCP 和 `/scheduled-tasks` 只作为内部适配来源，不能原样升级为租户级公共契约。

## 7. 当前实现差异

OpenAPI 的 `partial` 表示路由存在，不能解释为字段已经兼容。以 `feature/managed-agents-p0-p8` 的 `2695220a3a` 为实现基线，至少还有这些差异：

- Workspace 选择/绑定、Registry 查询、cwd operation 与能力字段均未实现；当前 Broker 从启动配置读取单一工作区。
- `PublicSession` 尚无 `agent_revision`、`capabilities`、`replay_floor_sequence` 和 `snapshot_through_sequence`。
- `PublicEvent` 尚无 `schema_version`、`projection_version`、顶层 `item_id` 和 `content_part_id`；当前文本/工具投影已在 `data` 中携带确定性 Item/Part 身份，仍需按冻结字段上移并协商版本。
- 公共事件 JSON 查询尚未返回真实 `has_more/next_cursor`，过期游标和 Snapshot reset 也未实现。
- Item/Part、Snapshot 和连续物化进度已有 Flyway V2 与 SQL scanner 实现，Item 列表已返回 `snapshot_through_sequence`；固定 Snapshot 版本分页、长输出不可变分段和清理保护仍未实现。
- WebShell `requestId` 尚未写入 trace 或回传，`WebShellStreamRequest.limit` 仍在 Java record 中但被忽略。
- 错误响应尚无 `request_id` 及游标重置水位；Java 与 TypeScript 仍手写 DTO。

这些差异必须通过实现、生成类型和契约测试关闭；不能为了让 Schema 暂时通过而删除目标字段。

## 8. 契约生成与验收

实现时由 OpenAPI 生成或校验 Java DTO 与 TypeScript 类型，并运行以下同一套契约测试：

- 每个 `partial` 路由的请求、响应、Header、错误码和字段命名与 Schema 对齐后改为 `implemented`。
- WebShell adapter 与公共 API 对同一 Session 返回相同身份、状态和 sequence。
- 首次响应丢失后按原幂等键返回同一 Session/Turn；不同载荷被拒绝。
- `Last-Event-ID`、历史补齐、实时切换、慢连接溢出及 `cursor_expired` 不重文、不跳序。
- 租户 Header 只能由可信入口注入；跨租户查询、SSE、取消和 Artifact 下载均不可见。
- `planned` 路由在实现前不出现在生产发现文档或 SDK 中；实现后同步改为 `implemented` 并补契约测试。

## 9. Workspace 与 Session cwd（v1.12 细化，planned）

完整语义见 [Workspace/cwd 设计](managed-agent-workspace-context.md)（[English](managed-agent-workspace-context.en.md)）。以下路由和新增字段已加入 OpenAPI，但尚未加入 Java/TypeScript 实现。生产发现、SDK 生成和 WebShell 功能入口必须按实现状态过滤到字段级，不能只过滤整条路由；服务端不能静默忽略客户端指定的 Workspace。

| 契约 | 目标行为 |
| --- | --- |
| `GET /v1/agents/workspaces`、`GET /v1/agents/workspaces/{workspaceId}` | 返回可读取的预注册 Workspace 及当前 actor 的 `can_create_session` 提示，按稳定 ID 分页；不暴露挂载路径、storageId 或凭据 |
| Workspace 列表的 `capabilities/default_workspace` | 创建前发现 `workspace_context` 能力；已配置且 active、可创建的默认项独立于当前页返回，否则为 null；不启动 Runtime |
| 创建 Session 的 `workspace` | 公共字段 `workspace_id/cwd_relative`；BFF 为 `workspaceId/cwdRelative`。缺省只允许解析显式租户默认值，首次准入后固定；重试先查原结果 |
| Session 的 `workspace` | 返回逻辑身份、相对 cwd、context revision 和状态；旧 unbound 记录省略该对象并阻塞执行，不用当前默认配置补身份 |
| `POST /v1/agents/sessions/{sessionId}/cwd` | 同 Workspace 的异步切换，必需 `cwd_relative/expected_context_revision` 与幂等键；202 表示命令已受理 |
| `GET /v1/agents/sessions/{sessionId}/operations/{operationId}` | 查询 cwd、command 或 lifecycle operation 的封闭 union；cwd completed 才带新 revision，查询不要求 Runtime 在线 |
| BFF `/workspaces/query`、`/sessions/cwd/change`、`/operations/query` | 位于 `/api/agent/web-shell/v1`，语义相同，使用 camelCase 请求和响应 |

`workspace_context/cwd_change`（BFF `workspaceContext/cwdChange`）缺省 false；未声明能力时 UI 不显示相应写操作。`workspace.state=ready` 只表示当前上下文已提交，不表示 Runtime ready 或 activation gate 已打开。`changing` 期间拒绝新的 prompt 和工具准入。W2 初版在活动/排队 Turn、未决审批/执行或后台资源 hold 存在时拒绝切换。

W0 新会话表单要求明确选择工作区，工作目录缺省 `.`。可使用服务端默认项预选，但不自动取列表第一项。BFF 将 `can_create_session/default_workspace/capabilities.workspace_context` 映射为 `canCreateSession/defaultWorkspace/capabilities.workspaceContext`；分页 cursor 绑定 tenant/actor/过滤条件并逐页复核授权。创建时再次检查权限、状态、Agent/config 兼容，列表结果不是执行授权。

对象省略才允许解析默认 Workspace，null/空对象非法。请求摘要基于规范化原载荷及省略标记，原 creation receipt 优先于默认解析；服务端解析出的 storage/generation/config/revision 随 Session 与 create operation 原子固定。UI 把选择与原幂等键冻结到 pending-create，刷新或超时不改写载荷。旧服务不得忽略 Workspace 参数；本地绝对 cwd 与 Hosted selection 使用不同 DTO。完整交互、安装接线与 W0a～W0e 验收见专项第 3、8 节。

cwd operation 的状态为 `pending/installing/completed/failed/recovery_blocked`。Java 收齐 Runtime 与 Harness 的持久安装回执后，在同一事务提交 Session cwd/revision、operation completed 与公开 `session.context.changed` 事件。事件使用既有 PublicEvent 封装，`data` 为 `{operation_id, workspace_id, cwd_relative, context_revision}`，不带绝对路径；WebShell adapter 映射为 camelCase。客户端漏事件后以 Session 和原 operation 查询为准。安装失败只在证明未安装或完整回滚后恢复旧状态，结果未知保持 blocked。

新增错误：`400 workspace_required/invalid_cwd/unsupported_feature`；`404 workspace_not_found/operation_not_found`（含跨租户/无读取权）；`403 workspace_forbidden`（可读取但不可创建）；`409 workspace_unavailable/workspace_generation_conflict/context_revision_conflict/session_context_busy/recovery_blocked`。准入之后发现路径无效等错误记录在相关安装 operation/Turn，Session 上下文保持 blocked；已完成的创建回执仍证明原受理事实，不能反写为未创建。HTTP 202 不能解释为验证和安装都已完成。幂等重试复核原资源当前访问权，再按原摘要返回同一 operation 和最新持久状态，之后检查新的 CAS/忙碌条件。


## 10. v1.10 准入、Action 与生命周期

完整约束与角色矩阵见 [契约收敛](managed-agent-contract-closure.md)。阶段 D 目标 `java_durable` 入口返回 operation/admission stage/delivery state，202 仅表示保存并承担投递责任；兼容产品入口仍等 qwen receipt。新增字段及 capability 默认关闭，不能仅靠新 OpenAPI 宣称代码支持。

| 公共 Session 路由 | BFF 路由 | 返回/边界 |
| --- | --- | --- |
| `GET actions` / `GET actions/{actionId}` | `actions/query` / `actions/get` | pending 列表与原 Action 的当前状态；permission/question 封闭 DTO |
| `POST actions/{actionId}/responses` | `actions/respond` | 202 command operation；原 input/policy revision、option/question ID，原仲裁决定 `vote_recorded` 或 `decided` |
| `POST close` / `POST archive` / `DELETE session` | `sessions/close` / `sessions/archive` / `sessions/delete` | 各自明确的 durable operation；archive 仅接受 closed，delete 不删除共享 Workspace |
| `GET operations/{operationId}` | `operations/query` | cwd/command/lifecycle union，delete tombstone 重试期内仍可查；不是任意执行入口 |

所有入口再校验可信 tenant + actor、资源 ACL 和原 Action responder 资格。reader/operator/owner 与服务委托范围不混用；无权读取返回 404，有读取权但无操作权返回 403。幂等域包含 tenant/session/operation/actor/key；不能凭同租户取回他人的幂等回执。新增 API、actor 验证和能力开关均待实现。close/删除仍执行既有 Hooks/资源结算门槛，202 不证明工具已停止。
