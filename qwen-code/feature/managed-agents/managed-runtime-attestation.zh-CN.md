# Managed Runtime 身份证明与就绪门禁

[English](managed-runtime-attestation.md) | [简体中文](managed-runtime-attestation.zh-CN.md)

状态：v1.13 目标契约；日期：2026-09-21。本文细化阶段 C/F 的 Runtime 恢复和 `attest` 门禁，并记录 #12358 分支 `e666150153` 的即时修复。该提交尚未合入上游 `main`；本文不把预览分支、单元测试或一次 E2E 当作生产验收。

## 1. 问题与结论

Java Runtime Broker 持久化 endpoint 后，不能因为地址可连接或 `/health` 返回成功就执行工具。端口、Pod IP、Pod 名称和进程 PID 都可能被复用；数据库中的 `READY` 也只是上次观察，不能证明当前响应者仍属于原 binding、lease、Workspace 和配置。

`attest` 是 Broker 使用 Runtime 前的私有身份核验：调度器先证明“这个物理资源仍是原资源”，Runtime 再证明“当前 HTTP 响应者装载了原 boot identity”。两项同时成功并通过数据库 CAS 后，本 JVM 才打开工具 gate。

它不是 TPM/TEE remote attestation，也不证明镜像没有被攻破。当前保证依赖调度器 resource handle、placement 校验、每代随机凭据和受保护的内部网络；跨不可信网络需要 TLS/mTLS 或等价的服务身份，不能只依赖明文 HTTP 加 bearer token。

## 2. 核实的当前实现

在 `feature/managed-agents-p0-p8@e666150153`：

- Java `RuntimeBrokerService` 对持久 `READY` 记录保持本地 gate 关闭，先执行 provisioner `reconcile`，再调用 `RuntimeTransport.attest`。
- `HttpRuntimeTransport` 调用 `POST /internal/managed-runtime/v2/attest`，携带 bearer token、lease ID、epoch 和不可变 scope。
- Tool Runtime 将请求与只读 boot 文档比较，返回 `runtimeInstanceId/runtimeIncarnation/leaseId/epoch/provisionRequestId` 及完整 scope；不启动或附着 ACP，不执行工具。
- Broker 再与持久 seed、lease 和 `RuntimeProvisionRequest.scope` 比较。只有仍持有同一个 operation generation 时，才以一次 CAS 更新 endpoint/handle、递增 `attestation_generation`、写 `last_reconciled_at` 并完成进程内 ready gate。
- `34ea187c62` 的 route 已在 Express 注册，但 owned-worker 外层 HTTP 白名单遗漏 `attest`，因此真实请求在到达 Express 前返回 404。`e666150153` 已把该 method/path 加入白名单，并增加穿过真实外层 gate 的测试；同一提交也为 E2E 生成并注入临时 Broker 凭据加密密钥。

当前修复解决了已知 404 和 E2E 启动失败，但 method/path 仍在注册点与外层 gate 分别维护。下一步需要单一 route manifest 和 TS/Java 共用契约门禁，避免下一个私有操作再次“已注册但不可达”。

## 3. `attest` 精确证明什么

必须同时核验以下三组证据：

| 证据 | 权威来源 | 证明内容 |
| --- | --- | --- |
| 调度器资源身份 | provisioner `reconcile` + 持久 `resourceHandle` | 原进程/Pod/Secret/UID 仍存在，endpoint 属于允许的 placement domain |
| Runtime boot 身份 | Runtime 只读 boot 文档 + 私有 `attest` 响应 | HTTP 响应者持有该 generation 的 boot 信息和服务凭据 |
| Broker 所有权 | MySQL binding、operation owner/generation、CAS version | 当前 Java 副本仍有资格发布这次观察并打开本地 gate |

任何一项缺失都不能把 binding 视为本 JVM 可用。`attestation_generation > 0` 是持久审计计数，不是其他 JVM 可以直接复用的活证明；每个 JVM 第一次使用恢复 binding 时仍须完成自己的 reconcile + attest。

下列字段共同构成 v2 identity：

```text
runtimeInstanceId + runtimeIncarnation
+ provisionRequestId
+ leaseId + epoch
+ tenantId + workspaceId + workspaceGeneration + workspaceCwd
+ capabilityDigest + isolationClass
```

W0 接入稳定 Hosted Workspace ID 后，`workspaceCwd` 不能继续充当公共 Workspace 身份；新 `managed-context/1` boot envelope 需要额外绑定 storage identity、context revision 和 context digest，并保留旧本地路径哈希为兼容别名。新字段通过新版本协商，不能原地扩充严格 v2。

## 4. 私有协议

请求：

```http
POST /internal/managed-runtime/v2/attest
Authorization: Bearer <per-generation-token>
X-Qwen-Managed-Lease-Id: <leaseId>
X-Qwen-Managed-Lease-Epoch: <epoch>
Content-Type: application/json
Cache-Control: no-store
```

```json
{
  "protocolVersion": 2,
  "provisionRequestId": "provision_01",
  "tenantId": "tenant_a",
  "workspaceId": "workspace_a",
  "workspaceGeneration": "7",
  "workspaceCwd": "/runtime/workspace",
  "capabilityDigest": "sha256:...",
  "isolationClass": "session"
}
```

成功响应只返回固定身份，不返回 token、seed、宿主路径以外的新能力或动态配置：

```json
{
  "protocolVersion": 2,
  "runtimeInstanceId": "runtime_01",
  "runtimeIncarnation": "boot_01",
  "leaseId": "lease_01",
  "epoch": 4,
  "provisionRequestId": "provision_01",
  "tenantId": "tenant_a",
  "workspaceId": "workspace_a",
  "workspaceGeneration": "7",
  "workspaceCwd": "/runtime/workspace",
  "capabilityDigest": "sha256:...",
  "isolationClass": "session"
}
```

请求与响应必须是封闭对象、字段有界、UTF-8 JSON，响应上限收紧到 16 KiB。响应带 `Cache-Control: no-store`；代理不得缓存 POST。未知字段、重复 JSON key、非法 UTF-8、非整数或非正 epoch、大小写不同的 ID 均拒绝。路径只作与 boot 值的精确相等校验；实际路径规范化和 containment 在 boot/prepare 阶段完成。

v2 不加入 challenge 字段。若需要防代理缓存之外的密码学新鲜度或跨不可信网络证明，协商新版本，使用随机 challenge 加 TLS/mTLS 或基于每代密钥的响应 MAC；不能改变旧 v2 响应形状。challenge 单独只能防陈旧响应，不能证明镜像完整性。

## 5. 端到端时序与 gate

```mermaid
sequenceDiagram
    participant B as Java Broker
    participant DB as MySQL
    participant P as Provisioner
    participant R as Tool Runtime
    B->>DB: claim binding operation generation N
    B->>P: reconcile(request, seed, resourceHandle)
    P-->>B: READY + exact handle + endpoint + lease identity
    B->>R: POST v2/attest (token + lease headers + expected scope)
    R->>R: compare auth, headers and body with immutable boot
    R-->>B: exact Runtime identity and scope
    B->>B: compare response with seed, lease and request
    B->>DB: CAS owner=N; persist endpoint/handle, attestationGeneration+1
    DB-->>B: committed current binding
    B->>B: open this JVM's ready gate
    B->>R: prepare / manifest / tool operations
```

顺序约束：

1. 先核验 placement/resource handle，后向 endpoint 发送凭据。
2. `attest` 成功不能直接开 gate；必须先用原 operation generation 和 binding version 提交数据库。
3. CAS 失败、claim 过期或 deadline 到达时丢弃迟到成功，不更新 health cache。
4. 本地 gate 打开后才允许 `prepare/manifest/execute/status/cancel/release`；只读 manifest 也不能绕过身份门禁。
5. Runtime endpoint、resource handle、lease/epoch、Workspace generation、context revision、capability digest 或凭据 generation 改变时关闭本地 gate并重新核验。
6. 工具已 dispatch 后发生核验失败，只查询原 `executionCallId`；不能创建新 Runtime 重放副作用。

## 6. 失败分类

| 观察 | 分类 | 状态与客户端行为 |
| --- | --- | --- |
| 网络错误、408/425/429、5xx、调用超时 | 暂时不可用 | gate 保持关闭；在 operation deadline 内有界退避，公开为 `environment.preparing/unavailable` |
| 400、无效 JSON、超限响应、协议版本/形状错误 | 协议冲突 | binding `RECOVERY_BLOCKED`；禁止工具；记录非敏感原因 |
| 401/403 | 凭据或服务身份冲突 | `RECOVERY_BLOCKED` 并告警；不得自动生成新 token 后重试旧资源 |
| 404/405 | peer 不支持该必需 route 或 method | capability/protocol 不兼容，`RECOVERY_BLOCKED`；不能回退 `/health` |
| 409 或任何 identity/scope 不等 | 资源身份冲突 | `RECOVERY_BLOCKED`；保留 handle 与证据，人工/平台修复 |
| provisioner `STARTING/UNKNOWN` | 物理状态未定 | 不调用 attest 或不开 gate；继续有界 reconcile |
| provisioner 明确 `NOT_FOUND` | 原物理资源不存在 | 先按 Session/未决 execution 规则结算；只有允许时才创建新 generation |
| attest 成功但 CAS/claim 失效 | 迟到结果 | 丢弃；新 owner 自行 reconcile + attest |

公开 API 不暴露 endpoint、token、原始路径、Pod/PID 或内部异常。WebShell 只显示 `preparing/ready/recovery_blocked` 和可操作的稳定错误码；运维日志使用 binding ID、generation、provisioner kind、placement hash 与 operation generation。

## 7. 单一 route manifest

已知 404 的根因不是 `attest` 业务实现，而是同一私有表面存在两份路由清单。目标实现定义一个 `OWNED_MANAGED_RUNTIME_ROUTES` manifest，每项包含 method、精确 path、协议版本、是否需要 body、最大请求/响应大小和 handler key：

```ts
const OWNED_MANAGED_RUNTIME_ROUTES = [
  { method: 'GET', path: '/health', handler: 'health' },
  { method: 'POST', path: '/internal/managed-runtime/v2/attest', handler: 'attest' },
  // prepare / manifest / history / tool operations
] as const;
```

外层 raw HTTP gate 从 manifest 生成允许判断；Express 注册使用同一 path 常量。构建测试枚举实际注册的 owned-worker 路由，要求它们与 manifest 完全相等。新增 route 若只修改一侧，测试必须失败。Java 使用版本化 JSON Schema/fixture，而不从 TypeScript 常量生成源码。

manifest 只约束 owned Tool Runtime 的最小网络面，不包含 daemon Session、WebShell、capabilities 或静态资源。query、尾斜线、大小写变体、OPTIONS、WebSocket upgrade 和未登记 method 均返回 404；鉴权在解析业务 body 前执行。

## 8. 安全边界

- token 每个 binding generation 唯一，持久化时只保存受 AES-GCM 保护的 seed；日志、异常、ready record 和公共响应都不输出 token。
- local-process endpoint 必须是同 placement host 的 loopback origin；boot/ready 文件为受控 generation 目录中的普通文件，拒绝符号链接与权限放宽。
- Kubernetes 先核验 Pod/Secret UID 与 resourceVersion，再解析 endpoint；同名不同 UID 为冲突。生产使用 NetworkPolicy、ServiceAccount/RBAC 和 TLS/mTLS 或平台工作负载身份。
- plain HTTP bearer 只允许在已证明的 loopback 或受保护网络范围内。跨主机、跨租户或经过共享代理时必须升级 transport trust，不能把 v2 echo 宣称为密码学 remote attestation。
- `attest` 不执行用户代码、不启动 ACP、不触发模型、不修改 Workspace，也不成为 liveness 轮询接口。高频健康检查继续使用受保护的 `/health`，身份失效才触发重新核验。

## 9. 跨实现契约门禁

Stage A 增加具名交付物 `managed-runtime-attestation-conformance-v1`：

1. 仓库保存语言无关的成功/失败 JSON fixtures 和闭合 schema，固定 method/path、headers、字段、大小和错误类别。
2. TypeScript provider 测试用 fixtures 驱动真实 raw HTTP server，覆盖 outer gate，而不是只测 Express app。
3. Java transport/validator 使用同一 fixtures，验证请求、解析和完整 equality；不以 Java 自建 mock 的宽松响应代替跨实现测试。
4. 一个最小进程 E2E 启动真实 TS worker + Java Broker，覆盖成功、无凭据、错 lease/epoch、错 Workspace generation、404 不兼容、迟到 ACK 和重启后重新 attest。
5. CI 对协议 fixture/schema、TS 测试、Java 测试和 route-manifest 一致性设置同一 required job。任一实现更新协议时必须在同一变更更新 fixtures 与双方测试。

该门禁只证明接口行为一致，不证明 Kubernetes、网络策略、密钥轮换或生产容量；这些属于部署验收。

## 10. 实施切片

| 切片 | 交付 | 出口 |
| --- | --- | --- |
| A0：即时修复 | 放行 v2/attest；E2E 注入临时加密 key；穿过 raw gate 的回归测试 | `e666150153` 已在预览分支完成，待 PR CI/评审与上游合入 |
| A1：路由单源 | route manifest、精确 allowlist、16 KiB 限制、no-store | 注册路由与允许表差异会使测试失败 |
| A2：契约门禁 | 语言无关 fixtures/schema、TS/Java 消费、required CI | 两端对同一正反例给出相同分类 |
| A3：状态与观测 | gate/CAS/迟到结果、错误映射、指标与安全日志 | 重启、claim 丢失、endpoint 变化和冲突均 fail closed |
| A4：部署证明 | 真实 MySQL 双 JVM、真实 Kubernetes/目标平台、TLS/身份、密钥轮换 | 同资源唯一活跃 generation，无错接、无重复工具副作用 |

A0 不等于阶段 C/F 完成。A1～A3 是合入 Hosted profile 前的代码门槛；A4 按目标部署在扩大生产流量前完成。W0c 复用该门禁并把 ContextBinding 加入新版本 identity，不能独立实现一套 Workspace attestation。

## 11. 验收清单

- `/health` 成功但 `attest` 404/409 时，Runtime 永不进入 ready，也没有工具调用。
- 错 token、lease、epoch、provision request、Runtime instance/incarnation、Workspace generation/cwd、capability digest、isolation class 均失败关闭。
- Java 重启读取持久 `READY` 后，在新的 reconcile + attest + CAS 前不发送 prepare/execute。
- 两个 Java 副本竞争时只有 operation generation owner 提交 attestation；迟到结果不更新 gate 或 health。
- endpoint 变化先持久化并重新 attest；同名不同 UID/PID 复用不能通过。
- E2E 入口自行生成临时测试 key，测试后不打印或持久化明文；生产缺 key 时启动失败。
- route 新增或删除只改注册点/allowlist 任一侧时 CI 失败。
- TS/Java 对共享正反例和错误分类一致，404 不被解释为“暂时未 ready”。
- Runtime 延迟不阻塞模型首输出；实际工具调用等待 attestation gate。
- 已 dispatch 的工具在 Runtime/Java 断线后只查询原 execution，不因重新 attest 而重放。

## 12. 与总方案的关系

本文细化 A 的跨实现协议门禁、C 的 Broker 就绪状态、F 的故障注入和 W0c 的 Workspace 执行目录证明。公共 OpenAPI 不新增 `attest` 路由；浏览器不直连 Runtime。`attest` 也不替代 G 的 Harness writer/checkpoint fencing，二者分别证明 Tool Runtime 与模型历史写入者。

实现完成后，将本文件的稳定契约以互链的中英文版本提升到上游 `docs/design/`；外部 code_agent 文档继续保留完整架构索引和历史决策。
