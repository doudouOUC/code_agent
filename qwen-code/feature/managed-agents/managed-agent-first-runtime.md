# Managed Agents 首版运行契约

> **v1.10 入口范围：** 本文“qwen 持久受理后 Java ACK”限定现有产品 `/sessions` 的 `qwen_confirmed` Profile。阶段 D 公共 `/v1/agents` 的 `java_durable` Profile 另需 SQL command delivery、operation 查询及崩溃恢复；两者不得静默切换，见 [v1.10 契约收敛](managed-agent-contract-closure.md)。

更新日期：2026-09-20。依据 [HTML v1.7](managed-agent-dual-path-architecture.html#minimum-runtime) 和[双链路总方案](managed-agent-java-hosted-runtime.md)。本文落实本轮审查后的首版取舍，不声明实现或测试已经完成；A～H 仍是全量能力的阶段编号。Bundle/Session DTO、完整工具阶段、资源传输与回收续轮的具体接线见[普通工具首版设计](managed-agent-ordinary-tools-integration.md)。

## 1. 首版范围与运行条件

首版验证配置采用一个 Java 实例及其 qwen serve Sidecar、预发布的静态 AgentBundle、Session 独占 Tool Runtime，并复用现有产品 REST/SSE 和 qwen 会话历史。一个 Runtime 可以服务所属 Session 的多轮 Prompt；“独占”不等于每轮新建 Runtime，也不等于一个 Session 一个 Harness 进程。Legacy 保留已有后端与工作区归属，不因新增 Sidecar 搬迁其工具环境。

首版只支持普通工具调用，以 Read、Write、Edit 和前台 Shell 为最小验收集；其他普通工具按同一调用契约逐项验证后纳入。自动记忆、子 Agent、后台 Shell 暂不涉及，本轮不补充其专项设计，也不作为运行前提。前台 Shell 在当前工具调用内等待结果；不提供转后台或脱离调用继续工作的产品能力，但取消、超时和释放仍须核验它创建的后代进程。

Hosted `tenantId` 必须由可信入口从已认证身份注入，并贯穿 Session、Workspace、Turn、Event 与 Broker 校验。本地单实例烟测不以前置完整身份平台为条件，但生产流量开放前必须完成资源级授权、内部服务认证和跨租户隔离验收。

| 项目 | 首版要求 | 后置边界 |
| --- | --- | --- |
| Prompt 受理与幂等 | 必需；qwen 持久受理后 Java 才返回 accepted | Java 提前 ACK、再异步交付的队列方案后置 |
| Broker 调用协议 | 必需；同轮等待、原执行查询、取消、释放及门禁映射 | 跨实例自动接管不作为首版要求 |
| AgentBundle | 必需；预发布固定版本，开始模型前可读 | 动态发现、完整配置热更新按 H 扩展 |
| Session 归属与存储 | 必需；固定后端和持久保存位置，无法恢复准确阻塞 | 共享 Authority、无粘性接管按 G |
| Runtime 生命周期 | 必需；创建去重、有限等待、容量和实际释放 | 多副本竞争控制在多实例启用前完成 |
| 审批与用户问答 | 已开放能力需要交互时必需；保留原权限策略 | 未支持的交互能力不进入首版工具目录，不静默自动批准 |
| 跨 Session 共享 Runtime | 首版默认关闭；开启前完成逻辑绑定与隔离验收 | 独占模式不要求先完成共享优化 |
| 独立公共 SSE/Item 投影 | 可后置；首版复用现有 SSE 和历史查询 | D 冻结公共序号、投影事务、重放与重建后再开放 |

该配置不改变现有生产部署。如果目标 Java 服务已有多个副本，必须在接入首版流量前满足第 5、6 节的多实例门槛，不能直接套用单实例的保证。

## 2. Prompt 受理与最小幂等链路

1. 可重试的创建 Session、Prompt、Cancel 和审批响应都携带稳定请求标识。沿用现有业务 ID；产品接口没有对应字段时由调用者提供 `Idempotency-Key`。作用域为原授权范围、目标 Session（创建时为创建入口）、操作类型和请求键，同键不同规范化内容返回 `409 idempotency_conflict`。服务端新生成且只出现在可能丢失的响应里的 ID，不能作为客户端唯一重试依据。
2. Java 在第一次转发前生成并持久保存全局唯一 RFC UUID `sessionId`、请求键、内容摘要与目标 BackendBinding；公共 API、qwen Session Authority、Managed Harness、JSONL 和 Runtime Broker scope 使用同一个 `sessionId`，不得保存第二套 Harness Session ID 或映射。重试沿用原 ID。该记录用于路由/查询，不保存第二份模型 Transcript，也不意味着已经接受模型执行。
3. Java 将同一业务命令映射到 qwen 的 commandId、inputId/turnId，但不转换 Session ID。qwen 经固定 engine 的 authority 持久提交输入及 WakeIntent，返回原 CommitReceipt；只有此时 Java 才返回 accepted。响应不等待模型完成或 Runtime ready。没有调用方 Session UUID、持久命令回执或原命令查询能力的 qwen 版本不能启用该 Managed profile。
4. 等待 ACK 超时或连接断开时返回暂时不可确认的结果，保留原请求标识；先向原 authority 查原命令。重试仍使用相同 ID，由其持久去重，不能换 turnId 或 backend 重跑。无法核验提交记录时保持 unavailable/recovery_blocked，不将一次 404 或本地 Map 为空当作未执行证明。
5. 本文兼容入口首版没有“Java 保存输入即 ACK”的语义，不要求输入 outbox。阶段 D 的公共入口已将该能力作为独立目标 Profile 设计，须先实现持久交付队列与原命令对账，不能只修改响应时机。
6. 同 Session 沿用现有串行 Turn/有界排队规则。Cancel 指向原 turn/scope，先经 qwen 持久提交取消意图再确认受理；实际模型、工具和进程树的结算另行查询。断开 SSE 不产生 Cancel。

产品受理前的 Runtime 预热只能消费有限预留，不授权任何工具执行；输入被拒绝或取消后，未被领取的预热按第 6 节回收。

Java 创建前固定 bundleRef、workspaceStorageRef 和稳定 sessionId/commandId；qwen 创建成功须持久提交 header/定义/Workspace 绑定。新增目标只读命令查询 `GET /session/{id}/commands/{commandId}?operation=...` 返回原 CommitReceipt/pending/not_found/blocked，查询不创建 Session 或模型执行。字段、能力协商及 not_found/回执过期的边界见[普通工具首版设计](managed-agent-ordinary-tools-integration.md#3-session-创建与受理回执)。

## 3. Broker 到 Runtime 的最小协议

以下为 v1.4 的工具目标接口补充，并遵循 v1.5 的统一 Session 身份；不声称与当前 `/internal/runtime-broker/v1/*` 实现路径相同。Java 与 Runtime 的 HTTP/SSE 均由 Java 发起。所有写操作复用受控 command envelope 与严格 validator，不提供任意方法名/任意 JSON 的通用执行入口。

| Harness → Java Broker | 请求及响应语义 | Java → Runtime / 本地处理 |
| --- | --- | --- |
| `POST /internal/agent-runtime/v1/prepare` | 原 Session/Workspace/配置和 binding 身份；分别返回环境 preparing/ready 与 gateState。环境 ready 不授予执行资格 | provision + `POST /v1/prepare`；准备状态可用 control 的 queryReceipt 查询 |
| `POST /internal/agent-runtime/v1/manifest` | 原 binding 下读取版本化能力与 digest；未就绪明确 not_ready，不阻塞离线 Bundle 推理 | `GET /v1/manifest` |
| `POST /internal/agent-runtime/v1/execute` | executionCallId 来自已提交 tool.intent；Broker 持久受理后返回 accepted 和原 ID，accepted 不等于工具完成 | `POST /v1/executions`；以原身份至多派发一次 |
| `GET /internal/agent-runtime/v1/executions/{executionCallId}` | 返回原执行状态、原 Runtime 身份、有界进度、最终 receipt/result refs；不触发派发 | 查询 Ledger；必要时 `GET /v1/executions/{id}`，或消费 Java 已建立的原执行 SSE |
| `POST /internal/agent-runtime/v1/control` | 按 activation/tool/history/receipt 四个 domain 的封闭操作表；包含原 gate、工具准备/确认/preflight/只读状态/取消、文件历史和回执查询；写控制固定 commandId、digest 与资格 | `POST /v1/control` 适配原 managed-runtime-control/1 和 tool v2；queryReceipt 查原命令；完整枚举见下文链接 |
| `GET /internal/agent-runtime/v1/resources/{resourceId}` | 原调用登记的资源，offset/length/purpose；受信 Session/绑定身份，最多 1 MiB 分片，校验完整内容 digest | `GET /v1/resources/{resourceId}`；Java 流式代理，qwen 持久资源仓库接收，不读取任意路径 |
| `POST /internal/agent-runtime/v1/executions/{executionCallId}/ack` | 可信 coordinator 提交 qwen 的结果接收 CommitReceipt 与匹配 digest；重复返回原交付记录 | Broker 核验原绑定及提交证明后记 delivered；不因此直接 release Runtime |
| `POST /internal/agent-runtime/v1/cancel` | 原 binding + 原 turn/scope/execution；持久 cancel_requested，返回取消受理与查询标识 | `POST /v1/executions/{id}/cancel`；尚未执行的等待者由 Broker 停止准入 |
| `POST /internal/agent-runtime/v1/release` | 原 binding 和稳定 commandId；返回 draining 或已核实的 released receipt | `POST /v1/release`；通过 queryReceipt 跟踪实际完成 |

Broker 的执行查询是首版 Harness 等待工具完成的必要能力，可做有界轮询；Java→Runtime 的事件订阅仍使用 `/v1/executions/{id}/events`。无需先新增一套 Harness→Broker SSE 服务。首次 execute 响应丢失后走原 ID 查询，不用重新 POST execute 代替 status，更不能生成新调用 ID。

`/prepare` 只准备环境，不替代一次工具的真实 build。工具按 bindHistory/beginTurn → prepareInvocation/confirmation/confirm → preflight/最终 guard → execute 顺序接线；未执行取消走 cancelInvocation，不能为了 status/cancel 创建 execution。轮末 readHistory 和备份持久化后才提交 authority checkpoint/turn.settled；原 fileHistory.checkpoint 是轮次起始快照。封闭操作、版本及 ACK 丢失处理见[完整映射](managed-agent-ordinary-tools-integration.md#4-普通工具各阶段与-broker-映射)。

作用域字段由已认证连接和服务端绑定核对。Session ID、Workspace generation、RuntimeBinding ID/incarnation、配置摘要和 executionCallId 必须贯穿 prepare/execute/query/cancel/release。activationEpoch 由 qwen authority 按 Session 颁发；Binding generation 表示原环境代际，两者不互相代替。全量 typed 字段与门禁顺序沿用[私有协议](managed-agent-control-protocol.md#4-runtime-的-activation-门禁)，局部门禁不是 G 的跨实例接管。

`stageGate → authority completeActivationInstall → enableGate ACK` 后才允许工具派发；新建惰性 Runtime 同样执行安装。环境预热可在没有活跃 activation 时完成并保持 gate closed，不能为了发布 ready 申请虚假的模型 activation；实际 Tool Call 再安装对应 Session/activation 的门禁。Runtime 丢失原门禁状态必须拒绝旧 binding。query/cancel/原回执接收保持受限可用，不能为了收尾重新授予模型推进权。

错误至少区分 bad_request、unsupported_version、scope_mismatch、version_mismatch、not_ready、idempotency_conflict 和 recovery_blocked；派发后 HTTP 超时不转换成可重试的普通 failed。delivered 表示 qwen 已持久接收结果与必要输出引用；释放还必须核验相关 checkpoint、所有引用和物理工作已收敛，Artifact 唯一副本不能因 ACK 到达就删除。

## 4. 静态 AgentBundle 与工具范围

首版由可信配置发布步骤生成不可变 Bundle，保存 agentRevision、已纳入的普通工具声明、提示/项目指令快照、权限策略及其资源引用。未启用的 Skill/MCP 扩展不要求准备能力快照，相应目录为空；完整扩展仍按 H 交付。只有 Bundle 和引用闭包已发布、Harness 在不启动 Tool Runtime 的条件下可读，才允许创建该 Managed Session。首次运行缺少快照时返回 bundle_unavailable，不在准入路径启动 Runtime 做隐式发现，也不默默删掉项目指令。

复用现有配置和 AgentBundle 工具目录表达首版范围，不新增一套开关或白名单协议。模型工具目录、Runtime 执行能力和 Session 初始化行为须一致：该 profile 不注册子 Agent 或后台任务能力，也不自动启动记忆任务。配置要求范围外能力时，沿用既有 selector 在创建前选择 Legacy；显式要求 Managed 而不兼容则拒绝准入，不能静默删掉用户配置后宣称兼容。这里约定目标配置，不表示现有实现已经具备这些限制。

模型看到的声明来自同一份实际工具定义；Runtime ready 后核验原 revision 和执行视图对应的 manifest digest。不匹配时阻止工具调用并报告配置错误，不能临时改模型工具目录或换 Legacy 重跑。Session 绑定的 Agent revision 不随发布 latest 自动变化。

首版以 Java/Sidecar 共享只读发布目录装载完整 Bundle，staging 校验后原子标记 revision ready；工具目录复用共享 TS 定义。bundleDigest、toolManifestDigest、Hosted 协议 capabilityDigest 分型核验；Runtime 工具实现构建/模板也须匹配。具体字段与发布失败窗口见[Bundle 接线](managed-agent-ordinary-tools-integration.md#2-bundle-发布与装载)。

首版不开放 definition 热切换；升级 Agent 定义使用新 Session。原权限策略中的审批决定和明确支持的 Session 控制不是 definition 更新，但每次调用仍绑定其有效权限/配置版本。完整 workspace reload、动态 MCP、Hook/Skill 注册和安全边界升级按 H 实施，不把全量配置专项中的热更新规则直接套到此 profile。

耗时记录分别包含 Bundle 发布/准备、Session 创建、Prompt→首 token、Runtime provision 与首次工具等待。15 秒慢启动验收使用预发布配置，并明确报告这个前提，不能宣称已覆盖任意全新 workspace 的动态配置初始化。

## 5. Session 归属、存储与事件

单实例首版将 SessionBackendBinding、原 engine、后端身份与 qwen 启动 incarnation 分开记录。逻辑后端身份稳定不等于新进程已经取得 writer；进程重启必须核验原存储、锁/owner 与未决工具。qwen 的 runtimeBaseDir、Transcript/checkpoint 和必要资源使用明确持久保存位置，不能仅落在随容器删除的临时目录；Java Broker Ledger 同样持久保存。

| 故障 / 部署方式 | 首版结果 |
| --- | --- |
| Java 进程重启、原 Sidecar/Runtime 仍在 | 从持久映射和 Ledger 查询原输入/调用；校验原 incarnation，不重新创建执行 |
| qwen Sidecar 重启、存储仍在 | 核验唯一 writer 并读取正式历史；未决操作没有恢复证明则阻塞，可读历史不等于可以继续模型 |
| Runtime 丢失或 started 后失联 | 查询原 owner/receipt；无终态证据保持 recovery_blocked，不换环境重放 |
| 整个 Pod 替换、卷不可用或无法核实旧 owner | 首版不保证自动恢复；返回不可用/阻塞，不能以空目录创建同 ID 的新 Session |
| 多 Java 副本 | 启用前必须实现所有 Prompt/Cancel/Approval/History/SSE 请求到原 owner 的路由、后端 incarnation 核验，以及 Broker 跨副本创建去重；缺任一项拒绝该部署 profile |

首版 Java 转发现有 qwen SSE、状态与历史查询，保留既有游标命名空间，客户端不直连 daemon。游标失效则通过正式历史/状态快照重建；临时 delta 不成为正式模型历史。Java 仅做必要协议适配和有界缓冲，不提前引入独立持久 Item 库或公共 eventSequence。

D 开放公共 Agent API 前，再冻结源事件键、公共 Item ID/版本、源进度与公共事件的原子提交、Last-Event-ID 保留/过期和重建规则。D 未完成不阻塞现有产品 API 上的 Hosted 首版验证；A～H 是能力阶段，不能把完整 D 当成 E 最小闭环的依赖。

## 6. 独占 Runtime 生命周期与可选共享

首版 RuntimeBinding 的归属包含原 Workspace scope、workspaceGeneration、canonicalCwd 和 sessionId。该 Session 后续轮次可复用原环境；其他 Session 不能借用它。不同物理环境模板/配置不可在原 binding 上覆盖安装。endpoint 仍由服务端选择，模型和 Harness 不能指定部署位置。

Java 在外部创建前持久保存 provisionRequestId、目标 binding key/generation 和需求归属；同 key 的并发请求合并到一次创建，创建时先预留 Runtime 容量。外部 provisioner 支持幂等创建或按稳定请求 ID 查询时沿用原 ID；创建结果不明且没有查询证明时保持 provisioning_unknown/recovery_blocked 的保留状态，不生成新 ID 再创建。

状态主路径仍为 `absent → provisioning → preparing → ready → idle → draining → released`。部署配置必须给出有限的启动 deadline、idle 保留时间、Runtime 总量、active turns 和 Tool 并发上限；沿用已有有效预算，不为 Managed 另开无限额。超时封住新工作，清理尚未确认时仍保留责任与容量记录，不能只删除内存 Map。

取消/关闭先撤销等待者的工具准入。迟到的 provision/ready 回调重新核验 Session 生命周期、原 generation 与需求引用；已经取消的轮次不得因此执行工具。Session 仍开放且有后续需求时可以按原身份保留 idle；Session 已关闭、generation 退休或无人持有的环境进入 draining。无工具轮次预热出来的环境同样进入受 idle deadline/容量限制的管理，不能永久挂在 provisioning 或 ready。

release 先拒绝新调用，等待实际工具/后代进程退出和资源引用收敛后返回 released。未决副作用、原执行回执或 Artifact 唯一副本不能按 idle TTL 删除。有限等待返回 pending/draining，不将 timeout 伪装成安全释放。

工作区文件、原 ownerSessionId 的文件历史备份、qwen Transcript/资源仓库均独立于计算环境保存。干净 idle 回收后，后续工具可创建新 binding incarnation/Runtime Session ID，挂回同一 storage identity 并恢复原 history；不递增 workspaceGeneration、不迁移旧 execution。旧环境未知或备份缺失则阻塞。同 Workspace 的工具轮次从起始快照至 history 提交串行占用；Session 独占 Runtime 不宣称物理文件隔离。并发竞争、挂载证明与建议验证参数见[回收续轮设计](managed-agent-ordinary-tools-integration.md#6-workspace-持久性与空闲环境回收)。

跨 Session 共享作为可选 profile 保留原 workspace 级复用思路。启用前必须有 per-session ToolSessionBinding，独立保存配置/权限版本、原 Runtime Session ID、文件历史与 activation gate；定义环境模板兼容性和共享资源引用计数。两个 Session 同时运行且其中一个取消、关闭或升级时，另一个不受影响，才能打开复用开关。多 Java 副本还需持久唯一约束/CAS、provision owner 交接和旧回调拒绝；单进程互斥不能作为该能力的证明。

## 7. 审批与用户问答

已开放工具遵守原权限策略。首版产品适配必须能列出/重建 pending actions，并把响应送回原 Session 的权限/问答仲裁入口；复用现有产品审批接口，不强制为了首版新建公共 Agent API。如果原产品入口没有可承载的响应方法，补充目标接口 `POST /sessions/{id}/actions/{requestId}/responses`，再开放相应交互工具。

响应携带稳定 responseId、原 requestId、inputRevision、policyRevision 和受原 options 约束的决定；actor 来自原认证连接。最终决定通过 qwen resolveAction 持久提交，重复查原决定，冲突/过期/改参旧票拒绝。沿用 first-responder/consensus 等原仲裁规则，中间投票登记成功不等于最终批准或持久提交。

SSE 恢复与状态查询只展示仍 pending 的 Action；取消和关闭结束原等待，不从旧 Promise 恢复权限。未实现交互适配的能力必须从首版工具目录和准入配置中排除，不能自动批准或永久挂起。纯用户问答不为了等待回答启动 Runtime。

## 8. 首版验收与阶段关系

以下检查针对普通工具首版配置，以 Read、Write、Edit 和前台 Shell 覆盖调用、写文件审批及进程取消。所有场景先断言公共响应、qwen Session/JSONL 和 Broker scope 使用同一个规范 RFC UUID `sessionId`，数据库不存在第二套 Harness Session ID。再核对实际 Bundle、Runtime manifest 和生效配置符合第 4 节，初始化及轮次结束不触发自动记忆、子 Agent 或后台 Shell；不要求实现或验收这些延期能力。后续共享存储、公共投影或多租户设计也不混入本轮门槛：

| 编号 | 场景 | 通过条件 |
| --- | --- | --- |
| M01 | Runtime 启动延迟 15 秒 | 使用预发布 Bundle，首个模型 token 先于 ready；无工具轮次可完成；同时报告 Session 创建耗时 |
| M02 | 同轮请求工具 | 工具等待 ready 后返回，原 Turn/模型上下文继续；manifest 不匹配在执行前拒绝 |
| M03 | 输入已提交但 ACK 丢失 | 原请求 ID 查回同一个 Turn；重复提交不新增输入/模型派发；未知模型尝试不自动重跑 |
| M04 | 工具受理/结果交付 ACK 丢失 | 原 executionCallId 可查询与重交付；physical execute 次数为 1，终态和输出归属保持原 binding |
| M05 | preparing、审批等待和 started 时取消 | 未开始的不因迟到 ready/旧票执行；已开始的追踪真实停止；release 不早于物理退出和资源安全保留 |
| M06 | 两个 Session、同一 Workspace | 默认独占 binding；配置/历史/权限不串扰，一个关闭不结束另一个工作 |
| M07 | Java 重启、Sidecar 重启及存储缺失 | 按第 5 节逐项恢复或准确阻塞；无空 Session 替代、无跨引擎重跑、无旧 epoch 新派发 |
| M08 | SSE 断线和游标失效 | 后台 Turn 不取消；历史、终态和 pending actions 可重新查询，不从重连触发执行 |
| M09 | 容量到限、创建超时、无工具预热和迟到回调 | 准入有界、重复创建被合并、未领取资源进入清理，未确认退出不提前释放容量 |
| M10 | 需要交互的已开放工具 | 审批/拒绝/重复响应/重连/改参均经过原持久仲裁，无未批准执行或永久等待 |

[补充验收 S01～S08](managed-agent-ordinary-tools-integration.md#9-补充验收与实施顺序)覆盖 Bundle 发布、原命令查询、完整工具阶段、分片资源交付、文件历史提交、干净回收后的第二轮及 Workspace 并发。与 M01～M10 一起完成首版普通工具闭环，不以文档检查代替跨进程 E2E。

多实例启用额外验证任意副本接收后续请求仍命中原 Session owner、双副本同时 provision 只有一个合法 active binding、旧 owner/迟到回调不能重新开放工作。共享 Runtime 启用额外验证不同版本/权限 Session 的并发、取消和释放隔离。未开启对应 profile 时，这两组不阻塞单实例独占首版。

A 冻结本文最小契约；B 完成固定 owner 与受理；C 完成 Broker、独占 Runtime 和回执；E 接入 Sidecar，结合 F 的 M01～M10 与 S01～S08 验证首版。D 的完整公共 API/投影、G 的共享 Authority/自动接管和 H 的全量扩展继续后置。每项实现记录 commit、环境与证据，文档定义本身不勾选完成。
