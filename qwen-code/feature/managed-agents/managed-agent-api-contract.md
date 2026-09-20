# Managed Agent Public API 与 WebShell 契约

状态：v1.6 设计冻结；日期：2026-09-20。机器可读契约见 [`managed-agent-public-api.openapi.yaml`](managed-agent-public-api.openapi.yaml)。该文件是 Java DTO、WebShell TypeScript 类型和契约测试的单一来源；当前源码未生成这些类型，OpenAPI 中用 `x-qwen-implementation-status` 区分“已有路由但契约未完全对齐”的 `partial` 与尚未实现的 `planned`，全部契约通过后才改为 `implemented`。

## 1. 路由与兼容范围

- 公共资源前缀固定为 `/v1/agents`，Session 前缀固定为 `/v1/agents/sessions`；不再使用 `/v1/agents/sessions`。
- WebShell BFF 适配前缀固定为 `/api/agent/web-shell/v1`。适配层只改变传输形状，不建立另一套 Session、Turn、事件或幂等语义。
- `POST /v1/agents/sessions`、Session 列表/查询、输入/取消事件以及 Session 事件查询/SSE 是当前阶段性实现。AgentDefinition、删除、Turn/Item/Artifact 资源仍为阶段 D 的 `planned` 接口。
- 旧 `/managed/sessions*` 只用于实验兼容；公共 API 完成准入、查询、事件和幂等覆盖后删除，不写入本契约。

## 2. 身份、租户与授权

生产入口先完成终端用户认证，再由可信 Gateway 从认证上下文注入 `X-Qwen-Tenant-Id`。浏览器提供的同名 Header 必须在边界处删除或覆盖；它是授权范围，不是身份凭证。

每个 Session、Turn、Item、Artifact 和事件查询都用 `(tenantId, resourceId)` 校验。资源不存在和跨租户访问都返回 `404 session_not_found` 或对应资源的 `*_not_found`，不通过 `403` 泄露资源是否存在。Java 到 Harness、Runtime、RocketMQ 和节点间通知使用工作负载身份或 mTLS，不能转发浏览器 Cookie、用户 Token 或可伪造的 tenant 查询参数。

## 3. 幂等、请求关联与错误

- 所有会创建或推进业务状态的请求必须携带调用前生成的稳定幂等键。公共 REST 使用 `Idempotency-Key` Header；WebShell adapter 使用请求体的 `idempotencyKey`。
- 同一个租户、操作和幂等键携带相同摘要时返回原结果，并用 `replayed: true` 或 `X-Qwen-Idempotent-Replay: true` 表示重放；同键不同摘要返回 `409 idempotency_conflict`。
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

公共 JSON 和 SSE 事件携带 `schemaVersion` 与 `projectionVersion`。Session 响应携带 `capabilities`，至少声明 `items`、`snapshots`、`artifacts` 和 `resync` 是否可用。服务端不得向未声明 Snapshot reset 能力的客户端清理其所需增量。

兼容规则如下：

1. 同一主版本只允许增加可选字段和新事件类型；客户端必须忽略未知可选字段，并把未知终态事件当作需要刷新 Session 的信号。
2. 删除或改变必填字段、游标语义和状态含义时提升 API 主版本。
3. `schemaVersion` 决定事件封装；`projectionVersion` 决定 Item/Snapshot 解释。重放必须返回最初接受时的版本，不能用最新版投影器重写历史事件。

## 6. 当前实现差异

OpenAPI 的 `partial` 表示路由存在，不能解释为字段已经兼容。以 `feature/managed-agents-p0-p8` 的 `c818c21910` 为基线，至少还有这些差异：

- `PublicSession` 尚无 `agent_revision`、`capabilities`、`replay_floor_sequence` 和 `snapshot_through_sequence`。
- `PublicEvent` 尚无 `schema_version`、`projection_version`、`item_id` 和 `content_part_id`；稳定 Item 身份需要 Harness 协议先提供。
- 公共事件 JSON 查询尚未返回真实 `has_more/next_cursor`，过期游标和 Snapshot reset 也未实现。
- WebShell `requestId` 尚未写入 trace 或回传，`WebShellStreamRequest.limit` 仍在 Java record 中但被忽略。
- 错误响应尚无 `request_id` 及游标重置水位；Java 与 TypeScript 仍手写 DTO。

这些差异必须通过实现、生成类型和契约测试关闭；不能为了让 Schema 暂时通过而删除目标字段。

## 7. 契约生成与验收

实现时由 OpenAPI 生成或校验 Java DTO 与 TypeScript 类型，并运行以下同一套契约测试：

- 每个 `partial` 路由的请求、响应、Header、错误码和字段命名与 Schema 对齐后改为 `implemented`。
- WebShell adapter 与公共 API 对同一 Session 返回相同身份、状态和 sequence。
- 首次响应丢失后按原幂等键返回同一 Session/Turn；不同载荷被拒绝。
- `Last-Event-ID`、历史补齐、实时切换、慢连接溢出及 `cursor_expired` 不重文、不跳序。
- 租户 Header 只能由可信入口注入；跨租户查询、SSE、取消和 Artifact 下载均不可见。
- `planned` 路由在实现前不出现在生产发现文档或 SDK 中；实现后同步改为 `implemented` 并补契约测试。
