# Managed Agents 普通工具首版接线设计

> **v1.10 Workspace 接线：** [v1.10 契约收敛](managed-agent-contract-closure.md)第 4 节冻结 `managed-context/1` 外层 `ContextBinding`，映射 ActivationGrant、InvocationBinding、config_install、两端安装回执及 journal/checkpoint/RestoreBundle。复用既有 `config.bound/domain.committed`，不修改严格 Tool v2 内层或增加另一份配置权威；未协商或 revision/digest/generation 不匹配时不开 gate。

更新日期：2026-09-20。依据 [HTML v1.7](managed-agent-dual-path-architecture.html#ordinary-tools) 和[首版运行契约](managed-agent-first-runtime.md)。本文补齐 Bundle、Session、工具阶段、资源交付和环境回收之间的契约，定义目标行为与实施验收；不表示源码已经实现或 E2E 已通过。

范围为单 Java + qwen Sidecar、Session 独占 Runtime、Read/Write/Edit/前台 Shell。其他普通工具逐项接入；自动记忆、子 Agent、后台 Shell 和 tenantId 语义不在本轮设计中。复用现有 TS Agent、工具、权限与文件历史实现，Java 不实现第二套工具调度或权限裁决。

## 1. 调研依据与可复用基础

本轮只读抽查本机 `b095/qwen-code`，HEAD 为 `056e4dc61f6ac21324e838f668e27bdb5eb9e9bc`。该工作树另有在途修改；下表前五项以与 HEAD 一致的文件为依据，Java 枚举另用 `git show HEAD:...` 核对。Session 路由观察来自工作树，单独标明，不能当作已发布版本。路径均相对该源码仓库；本次只修改 `code_agent` 设计文档。

| 来源 | 已有事实 | 本轮设计结论 |
| --- | --- | --- |
| `packages/core/src/tools/managed-tool-session.ts`：`createManagedBuiltinTool` | 已使用共享 builtin definition 和 RuntimeBackedTool | 发布 Bundle 复用这些纯定义及分类器；不手抄另一套 Schema |
| `packages/cli/src/serve/hosted-harness-contract.ts`、`hosted-harness-profile.ts` | 有 Hosted 协议版本、bootId、capabilityDigest 校验及独立部署配置 | 可复用连接握手；进程能力摘要不等于已发布的 AgentBundle |
| `packages/cli/src/serve/broker-managed-runtime-provider.ts`：`createToolClient` | 已映射 bind-history/checkpoint/history/begin-turn/prepare/confirmation/confirm/preflight；status/cancel 共用 `ensureExecution` | 这些阶段已有基础；目标协议补齐类型映射、稳定命令回执，并拆开只读查询与执行创建 |
| 同文件：`acquire/control/createExecution` | acquire/control 每次生成 requestId；createExecution 对部分错误重发同一幂等 body | 实施时区分传输 requestId 与持久 commandId；目标 execute ACK 丢失后查询原执行，不依赖重发 POST 获知状态 |
| `packages/core/src/tools/managed-tool-runtime.ts`：`beginTurn`；`managed-tool-file-history.ts`；`services/fileHistoryService.ts` | beginTurn 准备快照；fileHistory.checkpoint 同样确保轮次快照；history 返回序列化状态，备份 bytes 仍在文件存储 | 不能将 checkpoint RPC 当成轮末持久提交；恢复需同时保留元数据、备份 bytes 和稳定 ownerSessionId |
| `packages/sdk-java/runtime-broker/.../RuntimeBrokerService.java`：`CONTROL_OPERATIONS` | 已有九种 tool/history control kind | v1.3 的 gate-only 表漏掉了已有调用阶段，本轮修正封闭操作表，不退化为任意 RPC |
| 工作树 `packages/cli/src/serve/routes/session.ts`：普通 create/prompt | create 可接收调用方 sessionId；prompt 有 promptId、payloadDigest、受理水位等接缝 | 继续复用普通入口；这些字段自身尚不能证明 Bundle 注入、持久 CommitReceipt 和只读命令查询均已贯通 |

既有[invocation v2](managed-agent-runtime-invocations.md)给出了真实 build、确认、preflight、execute 的职责，[资源契约](managed-agent-tools-history.md#51-内容身份和访问)给出了受控分片读取，[Session 存储](managed-agent-session-storage.md)给出了提交与 DurableRef。下面确定 Hosted 路径如何组装它们。源码实际路由仍为 `/internal/runtime-broker/v1/*`；本文及 HTML 使用 `/internal/agent-runtime/v1/*` 目标路由，须通过显式适配交付，不能只改名称即声明兼容。

## 2. Bundle 发布与装载

### 2.1 首版发布路径

使用受信发布步骤，从已解析的工作区配置、项目指令和同构建的共享工具定义生成不可变 Bundle。首版不增加发布服务：发布进程先写 staging，再校验并原子发布，Java 和 Sidecar 挂载同一只读 Bundle 目录消费；引用使用受控 resourceId，禁止请求提供任意本机路径或 URL。工作区首次纳管时可先做配置准备，但必须计入 Bundle 准备耗时，不能藏在首 Prompt TTFT 之外宣称无需准备。

发布包包含 manifest 和其引用闭包。manifest 使用如下最小字段，字段缺失或未知版本拒绝发布：

| 字段 | 定义 / 核验 |
| --- | --- |
| schemaVersion、agentId、agentRevision | 固定 schema 1；revision 不可覆盖，latest 只在创建 Session 前解析一次 |
| runtimeBuildId、runtimeTemplateRevision | 工具实现构建和环境模板；首版 Harness/Runtime 使用同一兼容构建，不只比较 Schema |
| modelConfigRef、instructionsRef、policyRef | 版本化配置、完整 System Prompt/项目指令、权限摘要；模型凭据仅在 Harness 由既有凭据引用解析，不放入发布包或 Runtime |
| toolCatalogRef、toolManifestDigest | 实际启用普通工具的完整定义及权限分类/输出预算；由共享 TS 定义产生，与 Runtime 同算法核验 |
| workspaceConfigDigest、resourceManifestRef | 获准的配置快照摘要及资源闭包，每项含 resourceId、byteLength、digest、用途；不包含任意活工作区文件快照 |
| extension catalogs | 首版未启用的扩展显式为空；实际配置要求范围外能力按既有 selector 拒绝 Managed 或在新建前选择 Legacy |

`bundleDigest` 是发布 manifest 原始 UTF-8 bytes 的 SHA-256；引用项单独验证内容摘要。`toolManifestDigest` 使用当前工具协议的 canonical digest 实现；Java 原样传递，不自行重新序列化计算。Hosted `capabilityDigest` 是进程协议能力握手值，三个摘要不得混用；现有十六进制与 `sha256:` 表示只在明确类型的适配边界转换。

发布顺序为写资源 → 同步并验证 bytes → 写 manifest → 原子发布 revision 记录 → 标记 ready。只有 ready 且闭包完整的 revision 可创建 Session。崩溃留下的 staging 不可见；同 revision 不同 digest 冲突。共享目录权限和既有授权检查决定谁可读取，digest 不充当鉴权。Session 创建持有 Bundle 引用，关闭后的正式历史保留期间仍保留恢复所需定义；Runtime 回收不删除 Bundle。

### 2.2 装载与模型开始

Java 解析并持久固定 `bundleRef{resourceId,agentRevision,bundleDigest}`；Sidecar 以该引用读取、验摘要、解析全部必要资源，用共享 definition 工厂构建模型目录和 RuntimeBackedTool。此过程不能创建工作区工具实例、探测远端 cwd、启动自动记忆或发现未启用扩展。服务端缺少 Bundle 装载能力时拒绝该 profile，不用本地默认配置补齐。

Runtime 在准备时收到受信的工具配置投影、toolManifestDigest 和 runtimeBuildId，自行初始化普通工具，报告执行视图。定义/构建/模板不匹配则该 binding 不可执行；禁止以 Runtime 返回的新目录覆盖已开始推理的 Bundle。后续修改项目指令或工具定义须发布新 revision 并创建新 Session；正常文件编辑本身不升级定义。

## 3. Session 创建与受理回执

### 3.1 固定的调用方与字段

浏览器沿用产品入口。Java 认证用户、解析既有 Workspace、选择 engine/后端和 Bundle，将下面的内部字段传给普通 daemon 接口。字段是目标扩展，须加入严格 DTO 和能力协商；旧 daemon 不支持时明确失败。客户端不能自行指定后端、mount 或内部 Bundle 位置。

| 入口 | 必需的内部语义字段 | 成功依据 |
| --- | --- | --- |
| `POST /session` | sessionId、commandId、contentDigest、executionEngine=managed、bundleRef、workspaceId/workspaceGeneration、服务端解析的 cwd、workspaceStorageRef；原认证 actor | authority 提交 Session header、definitionRef、Workspace 绑定和原 command receipt 后，返回同 sessionId/engine/revision/CommitReceipt |
| `POST /session/{id}/prompt` | commandId、promptId/inputId、contentDigest、原 content blocks、原 Session binding | input + WakeIntent 持久提交；响应可兼容既有 promptId/lastEventId/eventEpoch，另带 admissionReceipt，不等待模型或 Runtime |
| `GET /session/{id}/commands/{commandId}?operation=...` | 原 Session、操作类型、命令 ID；仅原有访问授权 | 只读返回 committed + 原 CommitReceipt、pending、not_found 或 recovery_blocked；不创建 Session、不启动模型 |

创建前 Java 生成全局唯一 RFC UUID `sessionId`，并把这个值同时作为公共 Session、qwen Session Authority、Managed Harness、JSONL 与 Broker scope 的身份；不保存公共 ID 到内部 Harness Session ID 的映射。Java 另行持久保存业务幂等键 → commandId 与 payload digest 的映射；promptId 与 turnId 的映射同样先固定。稳定 commandId 属于业务命令，HTTP requestId 仅用于一次传输观测。命令键为现有授权范围 + Session + operation + commandId；同键不同内容返回 idempotency_conflict，保持[私有协议](managed-agent-control-protocol.md)的原 actor 检查。

创建响应丢失也按预先确定的 sessionId/commandId 查询。查询 committed 则 Java 补回原响应；pending 则继续有界等待；not_found 只有在原 owner、持久存储和读取边界均有效时才说明该边界未见提交，仍不能证明原请求永远不会到达。此时允许重送同一业务命令，由 authority 在处理效果前持久去重；不能另换 ID 或后端。owner 不明、存储损坏和 tombstone/receipt 过期明确返回不可确认，不能解释成 not_found。

创建命令的查询用原创建 actor 和持久创建映射授权，即使 Session header 尚未出现也不依赖活 Session handle；只返回该 actor 原命令的状态，不枚举其他人的 Session。其他操作查询继续核验原 Session 访问权限。查询实现直接读取权威记录，不调用 load/resume/create 作为副作用。

Java→Sidecar 复用既有 Hosted 版本和 bootId header。后端逻辑身份与 boot incarnation 分开；bootId 变化后先验证原 authority 存储/writer，再更新连接，不因换进程而重建同 ID 空会话。新建 Session 不启动工具；Java 在 Prompt 准入时可并行预热，但模型开始仅依赖已发布 Bundle。

### 3.2 Receipt 与保留

`CommitReceipt` 最小包含 operation、commandId、contentDigest、sessionId、committedSequence/transactionId、commitDigest 和原结果 ID；它证明 qwen authority 持久提交，不是 Java 收到请求或模型产出 delta。查询能力在 handshake 中明确声明，与 Bundle 装载、普通工具 v2、资源读取和历史恢复能力一起校验，不能只看协议数字相同。

首版命令记录至少随 Session 正式历史保留；关闭/删除后保留既有重试窗口内的命令 tombstone。过期后返回 receipt_expired，不重新接受旧键。具体保留期跟随既有存储政策在部署配置中声明，不能用内存 Map 存在与否判断重试安全。Cancel/Approval 同样查询原命令；cancel committed 仅表示取消意图被接受。

## 4. 普通工具各阶段与 Broker 映射

### 4.1 路由及封闭操作

保留环境 `/prepare`、执行 `/execute`、结果 query/ack、cancel/release 路由。`/control` 扩展为下列已注册操作，分为 activation、tool、history、receipt 四个 domain；每个操作有独立严格 schema 和调用资格，未知 domain/kind/version 拒绝。复用原 `managed-runtime-control/1` 和 tool v2 payload，外层携带稳定 commandId/contentDigest 与原绑定。发布双方能力清单后再启用新增操作；不向旧 gate-only 实现发送未协商命令。

目标 envelope 固定为 `v: 1, commandId, contentDigest, sessionBinding, actor, operation: { domain, kind, payload }`；actor 由受信连接校验，payload 逐 kind 复用原 typed DTO，不允许调用方覆盖绑定。写响应区分 `accepted{commandId}`、`settled{commandId,result,receipt}` 和类型化错误；accepted 只表示原意图已持久登记，必须查到该步骤 settled 成功才能进入下一阶段。HTTP requestId 不参与效果去重。查询返回 `snapshot{commandId,result,readWatermark}`，不追加新执行意图；queryReceipt 的 result 可包含查到的原写入 receipt，但本次读取水位/digest 不能当成新的副作用成功 receipt。

| domain / 目标 operation | 复用的现有操作 | 返回和执行资格 |
| --- | --- | --- |
| activation / stageGate、enableGate、renewGate、revokeGate、queryGate | 原 activation 门禁 | coordinator 安装/续租/撤销；环境 ready 本身不授权 |
| history / bindHistory | `fileHistory.bind` / `bind-history` | 固定原 ownerSessionId、已提交 history revision/快照与备份存储；新 Runtime 先装当前 gate 再绑定，空新 Session 显式为空 |
| history / beginTurn | `beginTurn` / `begin-turn` | 原 promptId 的轮次起始快照 ACK，至多一次；持有当前 activation 和 Workspace 工具轮次占用 |
| history / checkpoint | `fileHistory.checkpoint` / `checkpoint` | 确保同 promptId 的起始快照；与 beginTurn 去重，必须在该轮第一次修改前完成，不用它生成轮末快照 |
| history / readHistory | `fileHistory.snapshot` / `history` | 返回排空后的 ownerSessionId、revision、快照和 backup refs；只读，不重新 makeSnapshot；原结算 owner 在 gate 关闭后仍可读 |
| tool / prepareInvocation | `prepare` | 固定 tool call identity、toolName、input 和版本；真实 build 返回 invocation reference、规范参数、argsDigest、描述、L3/确认资料；不 execute |
| tool / getConfirmation | `confirmation` | 原 invocation 的可序列化确认 DTO，包括 Edit diff；真实回调留 Runtime |
| tool / confirmInvocation | `confirm` | 仅执行原版本的真实 onConfirm，记录回执；自动允许无需伪造确认回调；不 execute |
| tool / preflightInvocation | `preflight` | 保留原执行前阶段并记录回执，之后 Harness 执行原最终 guard；无扩展 Hook 的首版不启动 Hook |
| tool / cancelInvocation、queryInvocation | 原 v2 `cancel`、`status` | 针对已准备引用或原 prepare command 查询/取消；不创建 execution，不授予新 activation |
| receipt / queryReceipt | Broker 持久命令记录 | 查询 prepare/control/cancel/release 的原 ACK/终态；回执未知保持 blocked，不触发重做 |

Harness→Broker 仍为 `POST /internal/agent-runtime/v1/control`，Java→Runtime 为 `POST /v1/control`。manifest 继续使用独立接口。`GET /internal/agent-runtime/v1/executions/{executionCallId}` 及 Runtime status/SSE 只读取已有执行；当前 provider 的 `ensureExecution` 只能由 execute 路径调用，status/cancel 不得隐式进入它。

cancelInvocation/queryInvocation 的 target 是封闭 union：已知 invocationReference，或同绑定的 prepareCommandId。后者由 Broker/Runtime 原命令账本解析，不接受替代工具参数。prepare 尚在途时，取消先持久封住该命令后续准入；迟到的 prepared 回执进入原取消流程并排空引用，不能借取消创建 execution。原 v2 仅接受 reference 的实现需由适配器补齐这层命令定位，不声称原接口已经支持该 union。

所有会访问工作区或改变调用状态的准备、确认、历史入口都执行原 gate 检查。纯回执查询、原结果读取、取消和结算可使用 coordinator 的受限资格，不为收尾重启模型。运行中的任务不会因 gate 撤销变成 not_started；清理仍追踪原物理执行。

既有 built-in guard 中读文件、检查路径等工作区操作也必须留在 Runtime，并以绑定原 invocation/版本的事实 DTO 返回；Harness 只保留权限决策和最终授权，不在 Sidecar 重新读文件，也不能通过跳过这些 guard 宣称普通工具兼容。对相同检查不在两端各执行一次完整调度器。

### 4.2 调用顺序与文件历史

```text
模型生成 Tool Call → 提交 tool.intent（固定 executionCallId / callId）
→ 等待 Runtime ready → 核验 manifest → 安装当前 activation gate
→ bindHistory（每个新 Runtime）→ 取得 Workspace 工具轮次占用
→ beginTurn / 同轮起始快照 ACK
→ prepareInvocation → getConfirmation → 原权限仲裁
→ confirmInvocation（需要真实回调时）→ preflightInvocation → Harness 最终 guard
→ execute（原 executionCallId、invocation reference、授权摘要）
→ 原执行查询 → 结果 bytes 持久接收 → acceptRuntimeReceipt → 结果 ACK
→ 模型继续；全部工具结算后 readHistory → authority checkpoint + turn.settled
→ 释放 Workspace 占用 → Runtime idle
```

起始快照沿用 FileHistoryService；真实 Write/Edit 内部调用 trackEdit，不在 Java 或代理外再记一次 edit。history 的 Runtime revision 只在该 binding 内有效；持久身份是 ownerSessionId + 原 binding incarnation + revision + 内容摘要。新 Runtime 从零计数也不能覆盖旧的更高 revision；authority 持有跨环境的 history commit 顺序。

轮末读取 history 元数据并确保备份 bytes 已持久保存，再由 qwen authority 在最终 checkpoint/turn.settled 中引用。`fileHistory.checkpoint(promptId)`、Tool Result ACK、模型 Final 三者都不能单独证明这个提交已经完成。无工具轮次无需为文件快照启动 Runtime。首版保留既有文件历史覆盖范围；Shell 任意写文件并不自动获得 Write/Edit 的逐文件 trackEdit，也不承诺所有 Shell 副作用可回滚。

用户改参使旧 invocation、argsDigest、确认和授权失效，先取消并核验旧调用未执行，再提交 superseding tool.intent，分配新的 preparation revision/executionCallId；原模型 callId 保留，旧 intent 明确终结为未执行，新参数不复用旧幂等键。文件内容在 Edit 确认后改变，执行前按原文件身份/内容校验拒绝或重新准备确认，不能把旧 diff 的批准用于新内容。已 started/unknown 的调用不能靠改参或新 preparation 覆盖。

### 4.3 每个失败窗口

| 窗口 | 处理 |
| --- | --- |
| beginTurn/prepare ACK 丢失，尚无 invocationId | 查稳定 commandId 找回同一快照/引用；取消可按原 prepare 命令定位等待者，不构造新调用 |
| confirm/preflight ACK 丢失 | 查原回执，不重跑 callback/Hook；Runtime 崩溃且回执不足则阻塞，不声称可透明恢复真实内存 callback |
| 拒绝或取消发生在 execute 前 | cancelInvocation 结算为 not_started/cancelled；execution Ledger 可记录未派发终态，但不为取消调用 execute |
| execute 响应丢失 | 原 executionCallId 查询 Ledger/Runtime；not_found 不构成未派发证明，禁止新 ID 执行 |
| 物理执行成功，输出转存或 ACK 失败 | 保留原输出和 binding，继续同一资源交付；不重新运行工具 |
| 结果已提交，轮末 history 提交失败 | 结果不回滚，不重新执行；Turn 显示提交/恢复阻塞，保留 history 与资源占用直至核验 |

## 5. 结果 bytes 传输与持久交付

### 5.1 内容入口

增加目标 `GET /internal/agent-runtime/v1/resources/{resourceId}`，Java 以相同原 binding 转发 `GET /v1/resources/{resourceId}`，接受 offset/length/purpose。每次验证原 Session 授权、生产者 execution/invocation、绑定代际、用途和保留状态；resourceId 从输出 registry 解析，不接收模型给出的 path/URL。必要的身份字段置于受信 header/envelope，不把 bearer token 放 URL。

输出 DTO 继续保留 executionStatus 和原 ToolResult 的 llmContent/returnDisplay/error/resultFilePaths/artifacts/persistedOutputFiles。大内容改用带 MIME、长度、digest、producer identity 的受控资源引用；Runtime 的路径只作来源说明，不映射成 Harness 本机路径。结果 manifest 本身也可引用外置正文，避免超过现有有界 JSON envelope。列表、分片和进度仍有界。

首版 Java 直接流式代理原 Runtime 的只读内容，qwen authority 的资源仓库负责持久保存；不要求另建 OSS 服务。使用每片最多 1 MiB、manifest 每页最多 256 项/1 MiB 的既有资源契约，校验分片以及完整内容长度/digest。断点只复用已核验分片，同一 ref 的内容变化即报错。工作区可变文件需先在 Runtime 冻结为该调用的不可变输出，不能读一半时文件改变却仍声称匹配原结果。

### 5.2 接收、ACK 与释放

1. Runtime 物理 settled 后保留结果 manifest 和全部必要输出，Broker 记录 completed；此时尚未 delivered。
2. qwen 从 Broker 拉取模型后续读取、正式历史、用户下载所需的完整引用闭包，写 staging，校验、同步并原子进入资源仓库。已有独立持久存储可复用其已核验 DurableRef，不强制复制第二份；仅存在于 Runtime 临时盘的内容必须转存。
3. authority 在 acceptRuntimeReceipt 的提交中同时登记正式工具结果及已持久 refs，返回 result CommitReceipt。部分下载或只有资源 metadata 不得返回接收成功。
4. coordinator 向 Broker `/executions/{executionCallId}/ack` 提交该 CommitReceipt、原结果 digest 和资源闭包 digest。Broker 验证受信调用方、原绑定以及 authority 提交证明后记 delivered；重复 ACK 返回原记录。
5. 模型可以消费已接收结果继续当前 Turn。Runtime 的 invocation/result pin 在 delivered 后可按引用释放；环境回收仍须全部调用、轮末 history/checkpoint 和物理进程收敛。文件历史备份可以留在独立持久卷，不能随环境删除。

下载失败只重试读取；digest 错误、磁盘满、资源 missing 返回明确 transfer_failed/resource_corrupt/storage_unavailable 并保留原调用，不把结果改成可重执行工具失败。若唯一源已丢失，保持 recovery_blocked。SSE 展示可先发有界预览，正式可下载状态必须等待持久接收；浏览器通过产品→Java→qwen 的既有授权内容入口读取，不直连 Runtime。

首版资源总量、单调用输出上限、磁盘预留和保留期由现有预算配置明确约束。命令运行前预留可用输出预算；捕获达到上限时按既有截断/输出限制语义记录真实 overflow，必要时取消并追踪子进程，不宣称保留了完整输出，也不无限等待磁盘。容量不足不能先删除唯一结果/历史副本来换取新调用资格。

## 6. Workspace 持久性与空闲环境回收

### 6.1 三类持久对象

| 对象 | 首版保存位置与 owner | 回收条件 |
| --- | --- | --- |
| 工作区当前文件 | 既有 Workspace 服务的持久 volume/root，由 `workspaceStorageRef{storageId,workspaceId,workspaceGeneration,rootRef}` 标识；服务端解析到 Runtime 内稳定 cwd | Runtime release 只卸载/释放计算环境，不删除工作区；工作区删除另走已有生命周期 |
| 文件历史元数据和备份 | metadata 随 qwen authority 提交；backup bytes 放持久 file-history root，目录仍以稳定 ownerSessionId 组织 | 按历史保留政策回收；不以随机 Runtime Session ID 改写 owner，不以容器 TTL 删除 |
| Transcript、Bundle refs、已接收结果 | qwen 持久 runtimeBaseDir/资源仓库；Java 只保存路由与执行 Ledger | Session 历史/引用保留政策，与 Runtime idle 独立 |

首版 provisioner 必须能把同一受信 Workspace 存储和 file-history root 挂到后继 Runtime，返回核验过的 storage identity；不要求 Kubernetes，但只带临时容器文件系统的模板不合格。不在新环境从 Git clone 替代现有文件，因为未提交修改也是 Session 当前工作区。存储丢失或身份不符拒绝重新激活，不创建空目录冒充恢复。

Session 独占 Runtime 不等于独占工作区文件。首版对同一 Workspace generation 的工具轮次串行准入：beginTurn/首次文件快照前取得占用，所有工具及 history 持久提交后释放；其他 Session 可推理，工具有界等待。普通工作区维护/切换与该占用共用现有屏障，不要求建设分布式锁平台。用户外部编辑不受此锁控制，仍靠真实工具的文件身份与 stale-content 检查。M06 不宣称不同 Session 看不到对方在同一工作区的文件修改，只验证权限、配置、历史和取消归属不串扰。

### 6.2 安全回收与重新获得环境

同 Session 的下一轮优先复用 ready/idle binding。空闲回收前 Broker 条件关闭新工具准入，检查没有准备中调用、pending approval、活工具、未交付结果、未提交 history 和未知物理进程，并取得原释放回执；任何未知项保留 draining/责任与容量。下一轮到达与回收竞争时，在同一个 binding 状态更新内二选一：重新使用尚未封口的 idle，或等待已经开始的 draining 完成；不能让已封口环境再次接收新调用。

只有旧环境已确认 released，Session 仍开放，工作区/备份存储可读且没有未决副作用，才为后续新工具调用创建新的 bindingId/incarnation 和 Runtime Session ID。`workspaceGeneration` 保持原值，环境替换只推进 binding generation；工作区或信任范围改变才按原规则改变 Workspace generation。旧 executionCallId、资源与 receipt 永久指向原 binding，不迁移到新环境。

新 binding 复用原 Bundle revision、Workspace storage identity、cwd 和稳定 file-history owner；准备环境后完成 manifest 核验、安装本轮 activation gate、bindHistory 并核验备份，最后 beginTurn。模型仍可先用持久历史推进，实际 Tool Call 等待这些步骤。若之前不是干净 idle 回收，而是 started 丢失/旧环境失联，按故障矩阵保持 blocked，不能套用此正常换环境流程。

工具命令默认不承诺跨调用保留进程内变量；需要持久的修改须落在工作区文件或已登记持久资源。Shell 背景进程、容器临时盘和进程内缓存不属于跨轮恢复对象。新的 Runtime 不恢复旧 prepared invocation 或继续未知执行。

## 7. 首版验证参数与运行观测

以下是首个单实例验证 profile 的建议起始值，不是生产容量结论；映射现有配置，若已有更严格有效预算则取更小值。缺少有限预算映射时拒绝启用，而不是新增一套用户开关。

| 项目 | 验证初值 / 规则 |
| --- | --- |
| Runtime provision/prepare deadline | 120 秒；到期停止新工作，追踪迟到创建并清理，不能当作已释放 |
| Runtime idle 保留 | 5 分钟；从全部调用、结果与 history 已收敛时计算；引用变化重新核验 |
| 同时 Runtime / 活跃模型 Turn | 每个 Java owner 各 4；其他请求有界排队，排队量最多 32，等待最多 60 秒，取消可撤销；无槽位不启动额外模型/Runtime |
| 工具并发 | 首版每 Session 1；同 Workspace 同时 1 个工具轮次占用，不把模型并发等同工具并发 |
| 前台 Shell 默认 / 最大运行时间 | 验证配置为 120 秒 / 600 秒；更短调用期限优先，超时沿原进程取消链处理 |
| 用户审批等待 | 最长 10 分钟或原请求更短 deadline；超时取消尚未执行调用，返回可重建终态 |
| 资源传输与请求 | 分片 1 MiB；RPC 单次等待最多 30 秒，读资源空闲超时 30 秒；较长 prepare/control 返回 accepted + commandId 并查原 receipt，长工具由 execute accepted + 状态查询承接，不用长 HTTP 占位；RPC 超时不更改业务 deadline 或证明未执行 |
| 状态轮询 | 250 ms 起步，上限 2 秒，带抖动；同执行单一在途查询；仅查询/幂等回执读取可按原 ID 重试 |
| 输出与存储 | JSON envelope 沿用当前 8 MiB 上限；完整输出与磁盘保留预算读取既有配置，启动报告中给出实际数值；分片限制不代替总量限额 |

模型 Turn 沿用现有有限 deadline/token 预算；其截止不包括给未知副作用编造终态。内部 HTTP 连接池为 command、query 和资源流预留额度，状态查询、取消和释放不能被大文件下载或同步等待的 prepare 占满。带用户 content 的日志沿用现有脱敏政策，不记录凭据。

观测按同一 sessionId/commandId/turnId/executionCallId/bindingId 串联，分别记录 Bundle 发布、Session 创建、持久受理、首 token、provision/prepare、工具等待、审批、物理执行、资源转存、history 提交、release 耗时。计数至少包含等待队列、活跃/未知/正在释放的环境、未交付 bytes 和 blocked 原因；所有“未确认已退出”环境仍计入占用。

## 8. 一条贯通的验收流程

1. 可信步骤发布普通工具 Bundle B1；创建 Session S1，固定 B1 和持久 Workspace W1，关闭自动记忆/子 Agent/后台 Shell 的现有能力配置。
2. 提交 Prompt P1，故意让 Runtime R1 延迟 15 秒。验证 qwen 持久受理与模型首 token 不等待 R1；工具调用才等待 ready/gate/history 准备。
3. 模型调用 Edit 修改 `demo.txt`。UI 收到来自 R1 的真实 diff，批准后按原 invocation 执行一次；拒绝分支物理执行次数为零。
4. 同轮前台 Shell 产生超过单片但在总输出预算内的输出。模拟 execute ACK 丢失，查询原 executionCallId；模拟中途下载断线，续读原资源；两者均不重跑 Shell。
5. qwen 完整接收结果后 ACK，保存文件历史、正式 checkpoint 和终态。可读历史/下载不依赖活 Runtime；读到的输出 digest 与 Runtime 原结果一致。
6. 等待或缩短测试 idle deadline，确认 R1 真实退出、资源持久可读。保留 S1、B1、W1 和正式历史。
7. 在 S1 提交 P2，创建 R2，挂回 W1、恢复原文件历史 owner。Read 读到 P1 修改后的文件；新调用归 R2，P1 执行查询仍归 R1 的原 Ledger。
8. 对照故障分支：R1 在执行中失联、卷丢失、history 缺备份或 manifest 不匹配时明确阻塞，不能通过 R2 重放旧调用或创建空文件树“恢复”。

## 9. 补充验收与实施顺序

本表补充 M01～M10，用普通工具执行真实跨进程链路。测试计划不是测试结果；每项交付记录源码 commit、构建摘要、实际存储/部署及证据。

| 编号 | 覆盖与通过条件 |
| --- | --- |
| S01 | Bundle staging 崩溃、引用缺失、同 revision 改写、错误构建/manifest 均拒绝；Session 固定 B1，不随 latest 漂移；首次初始化不访问 Runtime 工作区 |
| S02 | 公共 API、qwen Session/JSONL 与 Broker scope 接收完全相同的 RFC UUID，数据库没有第二套 Harness Session ID；create/prompt ACK 丢失及 Java 重启后查回同 ID/receipt；只读 command 查询不调用模型；过期/未知不能当未执行 |
| S03 | Edit prepare/confirm/preflight 各自丢 ACK；原回执/参数摘要保持一致；改参和文件变化触发重新确认；取消 prepared 调用不创建物理 execution |
| S04 | 大于 1 MiB 输出分片、下载中断、错误 digest、磁盘不足与 ACK 丢失；物理执行一次，完整资源落盘才 ACK，回收后仍可读 |
| S05 | beginTurn 与 checkpoint 同轮幂等，不重复起始快照；轮末 history/backup 未提交时不 settled/release；Shell 文件变动不被误报为完整可回滚历史 |
| S06 | 同 Session 在 R1 干净 idle 回收后经 R2 读到未提交 Git 的原修改和原历史；binding 变化而 Workspace generation 不变；旧执行查询不指向 R2 |
| S07 | 同 Workspace 两 Session 工具轮次串行、不同 Workspace 可并发；取消排队不影响另一 Session；新 Turn 与 idle 回收竞争无双 active binding |
| S08 | 慢资源流和满工具队列下仍可取消/查询；deadline 触发后真实进程/后代未退出继续计数；范围外能力不自动启动 |

实施依赖为：A 冻结字段/能力与预算 → B 接通 Bundle loader、Session 创建及持久命令查询 → C 接通完整 tool/history control、纯查询/取消和资源读取 → C/E 接通持久挂载与干净回收后的新 binding → F 跑完整两轮及故障矩阵。B/C 可分别开发，最终须在同一构建上验证，接口 fixture 和历史本地实验不代替 Hosted 产品验收。原四处接缝至此有了目标设计，实现差异仍须按表逐项关闭。
