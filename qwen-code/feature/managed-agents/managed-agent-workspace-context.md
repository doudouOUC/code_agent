# Managed Agent Workspace 与 Session cwd 契约

[English](managed-agent-workspace-context.en.md) | [简体中文](managed-agent-workspace-context.md)

状态：v1.9 目标设计，尚未实现。日期：2026-09-21。补充 [HTML 总方案](managed-agent-dual-path-architecture.html#workspace-context)、[公共接口](managed-agent-api-contract.md)和[扩展运行时](managed-agent-extension-runtime.md)。本轮只更新文档、OpenAPI 与目标 DDL，不表示 Java 已支持多 Workspace 或 Session 目录切换。

## 1. 核实的起点与范围

源码基线为 `feature/managed-agents-p0-p8@2695220a3a`。daemon 的 `WorkspaceRegistry` 已区分已注册工作区和 Session owner，普通 Session 创建、恢复、历史查询与 `/session/:id/cd` 各有原有路由约束。新 Hosted API 不直接继承本地 primary fallback，也不扩大 Legacy `/cd` 的适用范围。

Java 当前 `CreateSessionRequest`、`PublicSession` 和 `managed_agent_session` 尚无 Workspace 绑定。`EmbeddedRuntimeBroker` 在启动时解析一组全局 `workspaceCwd/workspaceId/workspaceGeneration`，为所有 Session 构造同一 Workspace scope；RuntimeScope 能携带目录不等于 Session 已有持久归属。qwen Session Authority 还会在私有日志记录 cwd，但它不能替代 Java 的创建准入与 Workspace 授权记录。现阶段只能按单个静态配置工作区理解。

Workspace 创建、仓库 clone、worktree 创建、跨 Workspace 迁移和独立聊天 scratch 分配不在 W0 内。W0 使用管理员预注册且可授权的 Workspace；W2 只开放同一允许文件系统范围内的目录切换。

## 2. 身份、目录与权威

| 概念 | 权威与用途 | 稳定性 |
| --- | --- | --- |
| `tenantId + workspaceId` | Java 的已鉴权 Workspace Registry；Hosted 使用不透明 ID，本地 path hash 仅为兼容别名 | 不由绝对路径、Pod 或启动进程推导新的 Hosted 身份 |
| `workspaceGeneration` | Registry 单调版本，表示替换、删除重建等失效边界；Session 保存创建时预期版本 | Runtime 重启、普通 `/cd` 不递增它；旧版本仍可查询原执行 |
| `workspaceStorageId` | 持久文件、历史和 manifest 对应的逻辑存储身份 | 必须在容器回收后仍可解析；同名空目录不是原工作区 |
| `canonicalWorkspaceCwd` | Runtime 已校验的 Workspace 挂载根目录；本地模式必须 realpath | 仅内部使用；换节点后可重新解析，不作为可移植资源 ID |
| `cwdRelative` | 相对挂载根的逻辑 Session cwd，根目录表示为 `.`；由 Java 持久保存 | 跨实例恢复依据；公共 API 可返回，限制到授权 Workspace 内 |
| `effectiveCwd` | Runtime 由根目录和 `cwdRelative` 解析、校验的实际绝对路径 | 内部执行快照；换挂载点后重新计算，不能直接重用旧主机路径 |
| `contextRevision` | Java Session Workspace 上下文的 CAS 版本；新的 cwd 或已安装配置上下文生效时递增 | 与 Workspace generation、Runtime epoch、Harness activation epoch 分开 |

`contextConfigRef` 指向已冻结的配置上下文描述（Bundle/config revision、policy 引用、允许根与加载来源），与 Session 绑定一并持久保存；Registry 最新配置不能覆盖旧 Session 的已安装配置。授权和 trust 撤销仍按当前权威策略检查。模型先行使用已发布且绑定的配置视图；任何 cwd 派生的仓库配置/文件发现由 Runtime 校验后安装，不能偷读 Harness 宿主目录。

Java 保存 Workspace 绑定元数据和目录变更命令，qwen Authority 保存模型私有上下文及已安装 revision 的回执，Runtime 保存物理安装和执行回执。三者通过固定 operationId/revision 对账，不分别写入互相竞争的“当前 cwd”。Harness 宿主进程自己的 `process.cwd()` 和 journal 存储目录都不能替代执行 cwd。

绝对路径列只保存受控诊断/安装快照；恢复以 storage identity + 相对路径为准。私有历史中的旧绝对路径要通过已验证的 mount 映射处理；未支持路径重映射的工具/历史组件必须保持原挂载点或准确阻塞，不能只改 cwd 后假称上下文已恢复。

## 3. 创建与请求路由（W0）

```text
WebShell 选择 workspaceId + cwdRelative
  → Java 校验租户、Workspace 权限、状态、trust 与允许根目录
  → 命令幂等事务：Session + Workspace 绑定 + contextRevision=1
  → Harness 加载绑定的配置视图；模型可先运行
  → Broker 从 Session 绑定解析 storage/mount，创建 Runtime
  → Runtime realpath/信任/generation 校验 + 安装上下文回执
  → 校验对应 revision 的 activation gate 后执行工具
```

创建请求新增可选 `workspace` 对象（公共 snake_case、BFF camelCase）。指定时由服务端解析，不能接受浏览器自报 tenant、generation、Runtime endpoint、绝对 cwd 或允许根目录。相对路径采用 `/` 分段，拒绝绝对路径、盘符、反斜线、NUL 和 `..` 分段；规范化后做 realpath、符号链接和目录存在性检查。第一次访问文件系统可以随 Runtime 分配完成，但校验失败前不得执行工具或 workspace 命令。

字段缺省只为兼容：由管理员显式配置的租户默认 Workspace 解析并持久保存；没有默认值返回 `workspace_required`，不能回退到 Java/Harness 启动目录或 daemon primary。对旧 Session 的续轮和恢复一律读取已有绑定，不再重算默认值。`workspace` 参数进入命令摘要；幂等重试先查原命令结果，不能因默认 Workspace 已变而创建另一 Session。

提交、取消、工具和 Session task 操作按持久 Session 绑定路由；历史/导出读取已鉴权的持久数据，不要求启动 Runtime。Workspace 列表与 Session 查询属于不同资源，UI 切换工作区不改变已有 Session 的归属。未实现 W0 的服务不能宣告 `workspace_context` 能力或悄悄忽略该参数。

## 4. 目录切换（W2）

`POST /v1/agents/sessions/{sessionId}/cwd` 接收 `cwd_relative` 和 `expected_context_revision`，携带 `Idempotency-Key`。返回持久 operation（202）；客户端通过 operation 查询或 `session.context.changed` 事件确认生效。BFF 使用 `/sessions/cwd/change` 和 `/operations/query` 的等价 DTO。

只支持同一 Workspace 授权范围内切换；跨 Workspace、进入新的独立 worktree 或改变共享写入边界需单独准入，首版创建新 Session。不能把 shell 命令里的 `cd` 当作持久 Session 目录切换。

1. 需要 Registry 锁时统一按 Registry → Session → Turn → SessionOwner 顺序，不需要时从 Session 开始；Registry 失效流程不得逆序取锁。锁定 Session 并按预期 revision 做 CAS；活动 Turn、排队/已准入的输入、未决工具、审批、后台 Shell/Monitor/async Hook、共享写 child 或 MCP 操作/连接 hold 存在时返回 `session_context_busy`。幂等重试必须先返回原 operation。
2. 同事务保存不可变目标、原上下文和 `operationId`，置 `context_state=changing`，封新 prompt、调度输入与工具准入。并发输入与变更竞争同一准入屏障，只有一方成功。
3. 使用窄化维护 OperationGrant，在原 owner 安装关闭的 gate；验证目标目录，准备新的配置/trust/权限视图、MCP/Hook catalog 和 cwd 相关缓存。关闭需要重建的空闲 stdio MCP 连接；失败不允许混合新旧配置继续执行。
4. Runtime 和 Harness 分别持久记录安装回执；文件历史根保留 Workspace 语义，read cache 按新上下文隔离，模型收到目录变化的可信上下文。收齐回执后，Java 事务更新 cwd、contextConfigRef、revision、operation 终态并提交公开事件。
5. 只有确认该事务提交且双方安装 revision 匹配，才重新开放新准入；后续 Turn 获取新的 activation。这里没有跨 Java/qwen/Runtime 的分布式原子事务。

operation 状态为 `pending → installing → completed`，另有 `failed/recovery_blocked`。超时后查询原 operation；能证明未安装或已完整回滚且旧上下文一致时可标记 failed 并恢复旧 gate，否则保持 blocked。崩溃发生在任一 ACK/commit 前后时，按原 operation 与回执恢复，不能换 ID 再执行目录变更。

已启动的进程、Monitor、child、Hook 与在途工具固定启动时的 cwd、contextRevision、配置 revision 和原 binding；它们不会因父 Session cwd 变化而迁移。W2 首版选择先拒绝有 hold 的切换，后续若允许并存，必须保留各自旧上下文，不能修改共享 `process.chdir()`。

## 5. 冷恢复与失效（W1）

1. 读取租户授权后的 Session 绑定，检查 Registry 状态、原 Workspace generation 和 trust。generation 变化不自动“升级”旧 Session；需要显式迁移契约。
2. 按 workspaceStorageId 恢复原持久文件与 file-history manifest，核对摘要及未决执行。不得建同名空目录冒充恢复。
3. 分配新 Runtime binding/epoch，解析根目录与 cwdRelative，检查 symlink、权限、目录存在性和挂载身份。绝对路径变化必须有可验证的历史重映射能力。
4. 恢复 Harness 私有日志与资源闭包，安装同一 contextRevision 的配置与权限视图；所有必要 ACK 完成后才开放 activation gate。公开 Item/Snapshot 不能反向恢复模型私有状态。
5. 原 binding 上结果未知的调用仍查询原 executionCallId；新 Runtime 不接管并重跑它的副作用。

Workspace removed、generation 冲突、卷丢失、路径越界、trust 被撤销或上下文回执不完整时，执行进入 `recovery_blocked`；已授权的历史、导出及受限原执行查询/取消仍可用。只要旧进程仍存在，必须保留其清理 owner；Registry 替换不能把清理请求路由给同路径的新 Runtime。

## 6. MCP、Hooks、Channels、自动化和子任务

| 能力 | 绑定规则 |
| --- | --- |
| MCP / command Hook | 连接/进程固定 Workspace、contextRevision、cwd 和 credential/config revision；新上下文需要重新发现/安装，旧连接不可隐式复用 |
| Shell / Monitor | 启动时记录 cwdRef、contextRevision、generation；运行中持有原 Runtime，恢复查询原 handle |
| child / worktree | 父上下文显式复制为不可变启动输入；独立 worktree 使用自己的存储/Workspace 绑定，共享写入需显式串行化；父 `/cd` 不改子 cwd |
| Channel | route binding 保存已授权 workspaceId 和目标 Session；消息、昵称或 UI 当前目录不能改变归属 |
| Automation | persistent 模式使用目标 Session 的已提交上下文；per_run 在 run intent 冻结 Workspace 与 cwd。changing 时延后准入，重试核对同一 run，不临时改用默认 Workspace |
| 无 Session 的 Workspace 操作 | 使用独立 WorkspaceOperationGrant 与 Registry owner；不伪造 Session cwd，不借用 primary Session |

## 7. 存储与版本兼容

目标增量结构见 [workspace DDL](managed-agent-workspace-schema.mysql.sql)，以当前已实施的 Flyway V1/V2 为起点；它不覆盖或重新执行旧的总体目标 DDL。新增 Registry、Session 绑定字段和 cwd operation ledger。绝对路径不放入公共 SSE、通用日志、错误或 OpenAPI DTO。

存量 Session 的字段保持空且 `context_state=unbound`。运维回填必须有可核验的原部署 Workspace/配置或原 binding 证据，逐 Session 记录绑定和 revision；缺少证据保留只读并阻塞执行。不能用升级时的全局配置批量覆盖历史。混合版本部署先升级支持新字段和准入检查的 reader/writer，再启用能力；旧 writer 退出或被 fencing 后才开放多 Workspace 和 `/cd`，回退版本不支持绑定时只能只读。

## 8. 实施顺序与验收

| 阶段 | 交付 | 出口 |
| --- | --- | --- |
| W0：持久归属 | Registry/ACL 适配、Session 绑定、创建/BFF/查询字段、Broker 按 Session 解析 | 两个 Workspace 的文件、配置、历史与 Session 路由不串；缺省/错误路径明确拒绝 |
| W1：恢复 | 存量回填、storage manifest、generation/trust 校验与执行端上下文 ACK | 重启可回原目录；换挂载点有证据；丢卷/换代/未知执行准确 blocked |
| W2：受控切换 | `/cwd` operation、CAS、跨进程安装、准入屏障和公开事件 | 并发 prompt/CD 只有一方准入；ACK 丢失/崩溃可查原命令；后台任务不迁移 |

W0 是多 Workspace 产品接入和 H 阶段扩展的前置条件，可与 P2 的 MQ/Outbox 独立推进；W1 与持久恢复阶段合并验证；W2 不阻塞固定 cwd 的最小闭环。

验收至少覆盖：跨租户隐藏资源；两个同路径但不同存储的 Workspace；realpath/symlink 逃逸与检查到执行之间的路径替换（执行时重新验证，必要时使用受限挂载/句柄）；原请求重试时默认 Workspace 改变；创建响应丢失；活动/排队 Turn 与 CD 竞争；每个安装/ACK/commit 点崩溃；后台任务原 cwd；不同 cwd 子 Agent；standalone 无 cwd 不回 primary；目录或卷删除后历史可读、执行 blocked；新旧 schema 混合升级。必须同时核验 Java SQL、qwen journal 和 Runtime receipt，单个 API 200 不能证明恢复完成。

本轮文档校验：OpenAPI 3.1 validator、引用/操作唯一性及 15 组正反例通过；在独立临时 MySQL 26.7.0 库中实际执行 V1/V2 后应用增量 DDL，检查旧行保留、租户外键、幂等、revision 和回执约束；HTML 经 1440px/390px 渲染检查无页面横向溢出。这些校验不证明 W0/W1/W2 运行行为，故障与并发验收仍属实现工作。
