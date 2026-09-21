# Managed Agent Workspace 与 Session cwd 契约

> **v1.10 补充：** [v1.10 契约收敛](managed-agent-contract-closure.md)第 4 节补齐上下文安装的私有协议与回执映射。空闲 MCP 连接在封准入后可排空，不作为到达排空步骤前的硬阻塞；Runtime 回收仍把未关闭连接计入 hold。第 6 节增加 actor 授权/幂等域；command SQL delta 在本 Workspace delta 之后应用。

[English](managed-agent-workspace-context.en.md) | [简体中文](managed-agent-workspace-context.md)

状态：v1.12 目标设计，尚未实现。日期：2026-09-21。在 v1.9 归属与 v1.10 私有接线基础上细化“创建会话时选择 Workspace”的 W0 交付。补充 [HTML 总方案](managed-agent-dual-path-architecture.html#workspace-context)、[公共接口](managed-agent-api-contract.md)和[扩展运行时](managed-agent-extension-runtime.md)。本次更新设计和 planned OpenAPI；原目标 DDL 继续复用，不表示 Java 已支持多 Workspace 或 Session 目录切换。

## 1. 核实的起点与范围

原源码基线为 `feature/managed-agents-p0-p8@2695220a3a`；本次复核 P3 `34ea187c628c` 和 P2 `c0905b2c3b`，下述 Workspace 缺口仍存在。daemon 的 `WorkspaceRegistry` 已区分已注册工作区和 Session owner，普通 Session 创建、恢复、历史查询与 `/session/:id/cd` 各有原有路由约束。新 Hosted API 不直接继承本地 primary fallback，也不扩大 Legacy `/cd` 的适用范围。

Java 当前 `CreateSessionRequest`、`PublicSession` 和 `managed_agent_session` 尚无 Workspace 绑定。`EmbeddedRuntimeBroker` 在启动时解析一组全局 `workspaceCwd/workspaceId/workspaceGeneration`，为所有 Session 构造同一 Workspace scope；RuntimeScope 能携带目录不等于 Session 已有持久归属。qwen Session Authority 还会在私有日志记录 cwd，但它不能替代 Java 的创建准入与 Workspace 授权记录。现阶段只能按单个静态配置工作区理解。

Workspace 创建、仓库 clone、worktree 创建、跨 Workspace 迁移和独立聊天 scratch 分配不在 W0 内。W0 使用管理员预注册且可授权的 Workspace；W2 只开放同一允许文件系统范围内的目录切换。

前端 `java-managed-agent-provider.ts` 当前设置 `acceptsWorkspaceCwd: false`，创建请求未传 Workspace；本地 daemon Provider 才会发送 cwd。`managed-runtime-worker-bootstrap.ts` 又要求 Worker 的 workspaceId 等于 canonical cwd 的本地哈希。因此 W0 必须同时打通 UI、Java、Harness 和 Worker，不能只加一个目录输入框或直接把不透明 Hosted ID 塞进旧 boot 字段。

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

### 3.1 创建页面与选择规则

新会话表单显示 Agent、工作区选择器、可选“工作目录”和 Prompt。工作目录缺省为 `.`，示例为 `services/api`；首版使用相对路径输入，不建设远程文件浏览器，也不为了展示选择器启动 Runtime。选择器展示名称与短 ID，状态不可用或无创建权限的已可见 Workspace 禁用。创建按钮要求明确选择一个可创建的 Workspace。

优先保留用户本次选择，没有选择时使用服务端显式默认工作区；每次都与最新授权结果核对，不能取第一页第一项或把“只有一个结果”推断成默认。首版不自动复用其他会话或账号的最近目录。无默认且没有选择时提示“请选择工作区”；没有可创建项时展示空态并保留草稿。工作区列表获取失败、无权限与旧服务不支持是不同状态，不能悄悄改走默认目录。

选中 Workspace 后切换到另一个 Workspace，应把子目录恢复为 `.` 并提示重新确认，不能把项目 A 的子目录带到项目 B。表单旁提示“同一工作区的会话共享文件”；独立文件副本由未来 worktree/clone 能力负责。

发送时冻结 `agentId + workspaceId + cwdRelative + input + idempotencyKey` 到原 pending-create 记录。网络超时或刷新后重试同一载荷和键，不能套用当前选择器。结果不明期间保留“确认创建结果”状态；只有明确未受理或用户明确放弃原请求并另建会话时才能使用新键，界面说明原请求仍可能完成。成功后标题区显示服务端返回的工作区和相对目录；切换侧栏工作区只影响列表/新会话草稿，不改变已有 Session。W0 不提供已有会话的目录编辑操作。

### 3.2 创建前发现与接口示例

复用 `GET /v1/agents/workspaces` 和 BFF `POST /api/agent/web-shell/v1/workspaces/query`。列表增加 `capabilities.workspace_context`（BFF `workspaceContext`），用于尚无 Session 时发现创建能力；只有服务、Harness、Broker 和 Worker 的 W0 契约均可用才返回 true。旧服务缺字段或返回明确 unsupported 时关闭入口；网络/鉴权失败不能当作不支持。Session 查询仍独立返回自身能力，旧 unbound Session 不因服务升级自动获得执行资格。

每项增加 `can_create_session`（BFF `canCreateSession`），只表示当前 actor 的 Workspace 创建权限提示，Agent/config 兼容性仍在提交时核验。列表增加 `default_workspace`（BFF `defaultWorkspace`），为一个同结构描述或 null：只有配置了默认值且该 actor 有创建权、资源 active 时返回对象；即使默认项不在当前分页，也能显示确定的默认选择。分页与默认描述都不暴露挂载路径、storageId 或权限规则；cursor 绑定 tenant、actor 和查询条件，每页重新校验 ACL。

公共创建请求使用已有 `WorkspaceSelection`，例如：

```json
{
  "agent_id": "code_agent",
  "input": [{ "type": "input_text", "text": "检查 API 模块" }],
  "workspace": { "workspace_id": "ws_project_a", "cwd_relative": "services/api" }
}
```

BFF 只把相同对象映射为 `workspace: {workspaceId, cwdRelative}`，不借用 `environmentId`，也不复用本地 Provider 的绝对 `workspaceCwd`。`ManagedAgentProvider` 需增加明确的 Hosted Workspace selection 类型和列表能力；原 `acceptsWorkspaceCwd` 继续只描述本地路径支持。Java Provider 必须把选择传入生成 DTO，不能静默丢弃。

HTTP 成功后查询 Session 的 `workspace` 应得到 `{workspace_id: "ws_project_a", cwd_relative: "services/api", context_revision: 1, state: "ready"}`。这里 ready 表示逻辑绑定已提交；环境可能还在准备，UI 分别显示“会话已创建”和“工具环境准备中”，不能把它解释为 Runtime ready。错误约定：

| 时点 / 情况 | 结果 |
| --- | --- |
| 创建前无选择且无可用默认值 | `400 workspace_required`，不创建 Session |
| 路径语法非法 | `400 invalid_cwd`，不创建 Session；空字符串不是 `.` |
| 未知或不可读取的 Workspace | `404 workspace_not_found`；可读但不可创建则 `403 workspace_forbidden` |
| draining/removed、配置快照不可用 | `409 workspace_unavailable`，不创建 Session |
| W0 或私有协议不支持 | `400 unsupported_feature`，不降级成默认目录 |
| 同键不同选择/输入 | `409 idempotency_conflict`，不创建第二个 Session |
| 持久准入后才发现目录不存在、挂载失败或身份冲突 | 保留原 Session/creation receipt；Session 上下文进入 recovery_blocked，相关 Turn/安装操作记录类型化失败，工具 gate 关闭；不能改写已完成的创建回执或在错误目录执行 |

选择缺省与显式 null 不等价：对象省略才允许解析默认值，null/空对象非法。路径保留合法空格和大小写，不用 trim 改写文件名；统一 `/`，拒绝绝对路径、盘符、反斜线、NUL 与 `..` 分段，规范化重复分隔符和 `.` 分段为唯一逻辑形式。JSON 字段不是 URL，不进行额外 percent decoding。实际存在性、realpath 和执行时防替换仍由 Runtime 校验。

### 3.3 原子绑定、默认值与 ACK

1. 校验可信 actor、入口 Profile 与请求语法。规范化调用者载荷并计算 request digest，省略 Workspace 使用固定的“省略”标记；不要在每次计算请求摘要时重新代入默认 Workspace 或最新 Agent revision。
2. 在 tenant/actor/create/key 范围查原 creation receipt，并复核 actor 对原 Session 的当前访问权。存在时比较原请求摘要，返回同一 Session/operation；随后执行是否允许由原绑定和当前授权决定，不重新选择默认值。
3. 首次受理解析指定 Workspace 或显式租户默认值，核验 actor 创建权限、Agent/Bundle/config 兼容、generation、storage identity 与允许根。按 Registry → Session 顺序锁定，将 Session、固定 Workspace/config/revision、creation receipt 和 `create_session` operation 同事务提交。并发同键由唯一约束收敛，失败事务不得向 Harness 或调度器发起副作用。
4. operation 的受控载荷保存已解析绑定和精确配置引用，不保存“稍后再找默认工作区”。Java 向 Harness 交付相同 Session ID 与逻辑上下文；qwen 创建回执确认后才投递 input。复用 v1.10 的投递/回执契约，W0 不另建事件队列或另一份命令账本。
5. `java_durable` 的 202 仍只表示 Java 已承担持久投递责任；`qwen_confirmed` 仍等待 qwen 原命令回执。两者都不等待 Runtime ready，不改变原 ACK 边界。超时查原命令；目录准备失败不能换 Session ID 再投递同一个 Prompt。

这使用原 Workspace delta 的 Session 列和 command delta 的 creation receipt/operation；选择器新增的 capability、权限提示和默认描述是查询结果，不增加对应数据库列。首版 Registry 由受控部署配置/产品目录适配，默认工作区由现有租户配置解析；不增加用户注册任意服务器路径的公共 API。`QWEN_MANAGED_AGENT_WORKSPACE_CWD` 只能作为兼容部署中显式登记默认 Workspace 的输入，不能在每次创建或恢复时直接覆盖绑定。

### 3.4 Harness、Broker 与 Worker 接线

Harness 在自己的服务目录保存 journal；模型加载绑定的不可变 Bundle/contextConfigRef，提示中的逻辑目录来自 Session 上下文。模型先行只使用已发布配置，目录派生配置未发布时准入失败或保持准备状态，不能先读 Harness 宿主目录冒充用户项目配置。不得通过共享 `process.chdir()` 切换多个会话。

`EmbeddedRuntimeBroker` 的 Session resolver 从持久绑定读取 workspaceId/generation/storageId/cwdRelative/config revision，替换构造器中捕获的一组全局 cwd。Storage resolver 依据 registry 的 storage identity 与 placement domain 解析本地根或获准 PVC/mount；Kubernetes claim 和本地根都不能来自浏览器参数。计算 `effectiveCwd = verifiedMountRoot + cwdRelative`，在 Worker 安装时及工具边界验证目录、符号链接、权限和挂载身份。

现有 Worker boot v1 的 `workspaceId = hash(canonical cwd)` 与 Hosted 的不透明 Workspace ID 不能混为一谈。W0 协商 `managed-context/1` 及新的严格版本 boot envelope，明确区分公共 Workspace/storage 身份、挂载根、effectiveCwd 与本地路径哈希兼容别名；旧 boot/Tool v2 不原地塞新字段。ContextBinding 摘要必须覆盖逻辑 cwd 和固定配置，Runtime attestation、InvocationBinding、history root 与安装回执核验同一绑定。仅支持旧 boot 的 peer 在副作用前拒绝 W0。

配置实例与工具 cwd 使用 effectiveCwd，文件历史和 Workspace 写入协调使用稳定 Workspace 根及 storage identity。cwd 是工具起始目录，不是新的安全边界；文件权限仍限制在获准的 Workspace 根及策略内。Session 独占 Runtime 仍可能共享文件；复用普通工具方案的 Workspace 工具轮次租约，从起始快照到全部工具结算、历史提交后释放，不把进程隔离当文件隔离。跨 Session 的并发写入不能由各进程的独立内存锁保护。

逻辑 `context_state=ready` 不证明物理安装。Runtime 初始化/首次 prepare 返回绑定摘要、contextRevision、generation 与安装回执；原 activation gate 核对后才允许工具。晚到的旧回执不能开放新绑定。创建时的上下文安装使用原 create operation 与固定 revision=1，后续目录切换才进入 W2 的 changing/CAS 流程。

### 3.5 W0 的恢复下限

W0 必须在 Java 重启后读回同一绑定；干净回收后在可用的原持久存储上重建 Runtime，仍到达同一目录。W1 负责更完整的存量回填、跨挂载点历史重映射和灾难恢复，不能因此把 W0 做成只在内存中保存目录。默认 Workspace 改变、侧栏选择改变或 Harness 重启都不重绑旧 Session。

目录/卷丢失、generation 改变或授权撤销保持执行 blocked；有权限的历史仍可读。W0 不自动 mkdir/clone 一个空项目来“恢复”，也不透明改用 Workspace 根目录。修复基础设施后按原 operation/绑定核验继续；更换 Workspace 或修改尚未支持切换的逻辑 cwd 时创建新 Session。原工具结果未知时仍查询原 executionCallId，不能借重新创建 Runtime 重跑。

## 4. 目录切换（W2）

`POST /v1/agents/sessions/{sessionId}/cwd` 接收 `cwd_relative` 和 `expected_context_revision`，携带 `Idempotency-Key`。返回持久 operation（202）；客户端通过 operation 查询或 `session.context.changed` 事件确认生效。BFF 使用 `/sessions/cwd/change` 和 `/operations/query` 的等价 DTO。

只支持同一 Workspace 授权范围内切换；跨 Workspace、进入新的独立 worktree 或改变共享写入边界需单独准入，首版创建新 Session。不能把 shell 命令里的 `cd` 当作持久 Session 目录切换。

1. 需要 Registry 锁时统一按 Registry → Session → Turn → SessionOwner 顺序，不需要时从 Session 开始；Registry 失效流程不得逆序取锁。锁定 Session 并按预期 revision 做 CAS；活动 Turn、排队/已准入的输入、未决工具、审批、后台 Shell/Monitor/async Hook、共享写 child 或活动 MCP 操作/未决回执存在时返回 `session_context_busy`。幂等重试必须先返回原 operation。
2. 同事务保存不可变目标、原上下文和 `operationId`，置 `context_state=changing`，封新 prompt、调度输入与工具准入。并发输入与变更竞争同一准入屏障，只有一方成功。
3. 使用窄化维护 OperationGrant，在原 owner 安装关闭的 gate；验证目标目录，准备新的配置/trust/权限视图、MCP/Hook catalog 和 cwd 相关缓存。关闭需要重建的空闲 stdio MCP 连接；失败不允许混合新旧配置继续执行。
4. Runtime 和 Harness 分别持久记录安装回执；文件历史根保留 Workspace 语义，read cache 按新上下文隔离，模型收到目录变化的可信上下文。收齐回执后，Java 事务更新 cwd、contextConfigRef、revision、operation 终态并提交公开事件。
5. 只有确认该事务提交且双方安装 revision 匹配，才重新开放新准入；后续 Turn 获取新的 activation。这里没有跨 Java/qwen/Runtime 的分布式原子事务。

operation 状态为 `pending → installing → completed`，另有 `failed/recovery_blocked`。超时后查询原 operation；能证明未安装或已完整回滚且旧上下文一致时可标记 failed 并恢复旧 gate，否则保持 blocked。崩溃发生在任一 ACK/commit 前后时，按原 operation 与回执恢复，不能换 ID 再执行目录变更。

已启动的进程、Monitor、child、Hook 与在途工具固定启动时的 cwd、contextRevision、配置 revision 和原 binding；它们不会因父 Session cwd 变化而迁移。W2 首版选择先拒绝有 hold 的切换，后续若允许并存，必须保留各自旧上下文，不能修改共享 `process.chdir()`。

## 5. 冷恢复与失效（W1）

1. 读取租户授权后的 Session 绑定，检查 Registry 状态、原 Workspace generation 和 trust。generation 变化不自动“升级”旧 Session；需要显式迁移契约。
2. 按 workspaceStorageId 恢复原持久文件与 file-history manifest，核对摘要及未决执行。不得建同名空目录冒充恢复。
3. 先按 P3 reconcile/attest 恢复原 binding；只有已证明原资源安全结算并释放、没有未决执行时才分配新 binding/epoch，不能仅因 Java 重启重复创建。解析根目录与 cwdRelative，检查 symlink、权限、目录存在性和挂载身份；绝对路径变化必须有可验证的历史重映射能力。
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

W0 按以下可验收切片实现，全部完成后才启用列表与 Session 的 `workspace_context`：

| 切片 | 范围 | 最小证据 |
| --- | --- | --- |
| W0a：绑定契约 | 从 OpenAPI 生成 DTO；Registry/ACL/默认解析；版本化 ContextBinding 与 boot | 公共/BFF 等价，非法选择与不兼容 peer 被拒绝 |
| W0b：持久创建 | Session 绑定与 creation receipt/operation 同事务；原键恢复；迁移后旧 Session 明确 unbound | 创建响应丢失、并发同键、默认值变化及 Java 重启不换绑定 |
| W0c：执行目录 | Broker 按 Session 解析，Harness 配置隔离，Worker prepare/attest 与工具轮次租约 | 两个工作区和不同子目录实际 Read/Write/Shell cwd 正确，同工作区写入串行 |
| W0d：WebShell | 选择器、相对目录、默认/空态、冻结 pending-create、会话位置显示 | 刷新重试不换请求；旧服务不静默丢字段；切换侧栏不改已有会话 |
| W0e：恢复与发布 | 原存储恢复、失效阻塞、旧 writer fencing、兼容 Profile ACK | 干净回收与重启后继续原目录；无重复工具执行；完整链路通过后开放 capability |

新增 W0 验收：默认项不在列表当前页仍可显示；列表无权项不泄漏；服务未支持/请求失败/没有工作区分别展示；Session A 绑定项目 A 的 `services/api`、Session B 绑定项目 B 根目录，文件和配置不串；同项目不同 cwd 不覆盖共享进程配置；Runtime 延迟 15 秒时预发布配置的模型首输出仍先行；物理目录校验失败时绝无工具执行；跨 actor 幂等、选择后撤权、换默认后的重试及未决请求切换 UI 全部保持原归属。

验收至少覆盖：跨租户隐藏资源；两个同路径但不同存储的 Workspace；realpath/symlink 逃逸与检查到执行之间的路径替换（执行时重新验证，必要时使用受限挂载/句柄）；原请求重试时默认 Workspace 改变；创建响应丢失；活动/排队 Turn 与 CD 竞争；每个安装/ACK/commit 点崩溃；后台任务原 cwd；不同 cwd 子 Agent；standalone 无 cwd 不回 primary；目录或卷删除后历史可读、执行 blocked；新旧 schema 混合升级。必须同时核验 Java SQL、qwen journal 和 Runtime receipt，单个 API 200 不能证明恢复完成。

历史 v1.9 文档校验记录：OpenAPI 3.1 validator、引用/操作唯一性及 15 组正反例通过；曾在独立临时 MySQL 26.7.0 库执行 V1/V2 和增量 DDL，并完成 1440px/390px HTML 渲染检查。该记录不覆盖本次 v1.12 修订。v1.12 已通过 OpenAPI 3.1 校验、20 组 Schema 正反例、双语结构/示例和链接/HTML 结构检查；Schema 检查不证明目录与权限等运行行为。数据库结构未改，本次未重跑历史 MySQL 或产品 E2E，也不宣称新的浏览器渲染验收。W0/W1/W2 的故障与并发验收仍属实现工作。
