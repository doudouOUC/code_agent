# Managed Agent 扩展运行时设计

> **方案状态（HTML v1.7，2026-09-20）：** 本文收敛阶段 H 的 MCP、Hooks、Channels、自动化、子 Agent、后台 Shell 与 Monitor。它定义目标职责、持久资源、恢复边界和 WebShell 投影，不表示这些能力已经在 Hosted Managed profile 中实现或通过生产验收。首版普通工具范围仍以[首版运行契约](managed-agent-first-runtime.md)为准。

本文补齐[全量覆盖表](managed-agent-full-design.md)中 C08～C12 的横向运行模型。MCP 与 Hooks 的字段级契约仍以[配置与扩展](managed-agent-config-extensions.md)为准；Channels、Schedule、child/team/memory 的字段级契约仍以[自动任务](managed-agent-automation.md)为准；工具结果、Artifact、Monitor 和工作区操作仍以[工具与历史](managed-agent-tools-history.md)为准。本文解决的是这些专项之间此前没有统一回答的四个问题：谁可以推进模型、谁执行副作用、什么事实必须持久化、进程或节点替换后怎样继续。

## 1. 统一结论

1. **Harness 是唯一模型推进者。** Channel、Scheduler、Hook runner、MCP server、子 Agent relay、后台进程和 Monitor 都不能直接启动第二套主 Agent loop。它们只能提交已认证输入、领域结果或 `WakeIntent`，由 Session Authority 准入后唤醒 Harness。
2. **Java Control Plane 拥有产品级持久资源。** 它保存定义修订、运行记录、Session 路由、outbox、租约代际、配额与公共投影；MQ 只分发已经提交的事实，不成为 Session 真相或浏览器游标。
3. **Tool Runtime 拥有物理副作用。** stdio MCP、命令 Hook、后台 Shell、Monitor、文件、Git 和本地进程都在 Runtime 内执行，并使用原调用身份、进程 owner 和物理 receipt。Harness 不通过本机 fallback 补执行。
4. **所有异步能力都是“持久资源 + 触发意图”。** 内存 callback、Promise、PID、`notified=true`、本地 sidecar 或 MQ offset 都不是恢复凭据。每次派发先有稳定 ID 和持久 intent，再执行，再接收 receipt。
5. **定义、运行与交付分开。** 配置定义可以更新，已经开始的调用固定原 revision；逻辑运行完成不等于父 Session 已接收，也不等于 Channel 已送达。
6. **未知副作用不盲重试。** 已经 dispatch 但结果无法证明时进入 `outcome_unknown` 或 `recovery_blocked`。只有原系统支持稳定幂等键、状态查询或确定未执行证明时才允许自动恢复。

```text
外部事件 / 定时触发 / 子任务结果 / Monitor 变化
                    │
                    ▼
Java 可信入口 → SQL 事务提交领域记录 + outbox + WakeIntent
                    │ after commit
                    ├──────────────→ EventTransport → 物化 / 跨节点唤醒
                    ▼
              Session Authority
                    │ activation fence
                    ▼
              Managed Harness ──────→ Model
                    │ tool / hook / child intent
                    ▼
            Java Runtime Broker
                    │ invocation / operation grant
                    ▼
               Tool Runtime
        MCP / command Hook / Shell / Monitor / 文件
                    │ physical receipt / Artifact
                    └──────────────→ Authority 提交 → Harness 继续
```

浏览器始终从 Java 的公共 Session/Event/Item/Task 投影读取。Runtime 输出不能绕过 SQL 接受点直接成为正式前端事件；同节点可以在事务提交后直接推 SSE，断线按 Session 公开 sequence 补齐。

## 2. 当前源码接缝与缺口

以下按 qwen-code `feature/managed-agents-p0-p8` 的源码快照 `756087dbcd` 核对；这些本地/daemon 能力不等于 Hosted Managed 已接线。

| 能力 | 当前可复用实现 | Hosted Managed 仍缺什么 |
| --- | --- | --- |
| MCP | `mcp-client-manager.ts`、transport pool、workspace budget、Session view、resource/prompt/tool 与 workspace 管理路由 | 连接与凭据下沉 Runtime、固定 catalog revision、持久 operation receipt、Runtime 丢失后的查询与阻塞 |
| Hooks | `HookRegistry`、`HookPlanner`、command/HTTP/prompt/function 四类 runner、async registry 与完整 Hook event union | 跨 Harness/Runtime 的确定性计划、occurrence 去重、prompt Hook 模型资格、异步命令物理 owner 与恢复 |
| Channels | `SessionRouter`、`ChannelBase`、`DaemonChannelBridge`、loop/webhook 和多个 adapter | 入站去重与附件 ownership、持久 route、正式回复 outbox、逐段发送 receipt、重启后恢复 |
| 自动化 | scheduled task 文件、CronScheduler、手动 `/run`、Goal/Live/内部队列 | 单一 server-owned 派发、run ledger、扫描者 lease、重叠与 missed 策略、未知派发不重复执行 |
| 子 Agent | SubagentManager、Agent/Workflow、daemon sub-session、team/task/mailbox、后台恢复 | 独立 child Session authority、父结果 outbox/accept/consume、工作区隔离、跨 daemon 恢复 |
| 后台 Shell | `BackgroundShellRegistry`、输出文件、best-effort status sidecar、`task_stop`、前台转后台 | 持久 process identity、Runtime generation、日志 Artifact、真实 drain、Runtime 替换后的状态对账 |
| Monitor | `MonitorTool`、`MonitorRegistry`、节流/max events/idle timeout、通知回调 | 当前 registry 为内存状态，保留的 output path 还没有 writer；需要持久定义、观测游标、去重、重建与 Runtime hold |
| Task UI | `TaskBase` 已统一 agent/shell/monitor/workflow，daemon 有 `/session/:id/tasks` 与 cancel | 这是原 owner 的实时视图；还需要 Java 的可恢复 `SessionTaskView`，不能直接暴露本地绝对路径、PID 或 registry 状态 |

因此阶段 H 不是新增七套独立服务，而是把现有能力接到同一 Authority、Broker、Artifact、Outbox 和恢复协议上。

## 3. 共用资源与状态机

### 3.1 权威记录与只读任务投影

已有 `domain.committed` 保持唯一扩展领域提交载体。权威记录继续使用专项定义的 domain：

- MCP：`mcp_configuration`、`mcp_operation`；
- Hooks：`hook_registration`、`hook_execution`；
- Channels：`channel_route`、`channel_delivery`；
- 自动化：`schedule`、`automation_run`；
- 子 Agent/后台 Shell：`child_run`、`child_acceptance`，其中后台 Shell 使用 `child_run.kind=shell`；
- Monitor：新增 `monitor_run`，保存定义、物理 binding、观测水位、通知策略与终态；
- team、peer message、Goal/Todo/plan 等继续使用原专项已注册 domain。

前端需要一个统一列表，但该列表只是可重建的读模型，不能反向成为领域真相：

```ts
interface SessionTaskView {
  taskId: string;
  sessionId: string;
  kind:
    | 'child_agent'
    | 'workflow'
    | 'background_shell'
    | 'monitor'
    | 'automation_run';
  state:
    | 'pending'
    | 'running'
    | 'waiting'
    | 'completed'
    | 'failed'
    | 'cancelled'
    | 'degraded'
    | 'recovery_blocked';
  definitionRevision?: number;
  runtimeState?:
    | 'unbound'
    | 'provisioning'
    | 'ready'
    | 'draining'
    | 'lost';
  startedAt?: string;
  settledAt?: string;
  outputCursor?: string;
  artifactRefs: string[];
  actionCapabilities: Array<'cancel' | 'send_input' | 'read_output'>;
}
```

`SessionTaskView` 不返回 `runtimeBindingId`、generation、Runtime endpoint、Pod、绝对路径、原始 PID、SecretHandle 或本地 sidecar。需要诊断时返回受权的 Artifact/日志引用和脱敏后的物理状态；内部 binding 只在受控的 Java ↔ Tool Runtime 协议中流转。

### 3.2 三条共同状态线

所有能力至少区分三条状态，不能压成一个 `status`：

| 状态线 | 状态 | 含义 |
| --- | --- | --- |
| 逻辑运行 | `reserved → admitted → running/waiting → settled/failed/cancelled/recovery_blocked` | 本次业务是否已准入和完成 |
| 物理执行 | `intent → dispatch_started → running_attached → settled/not_started_proven/outcome_unknown/corrupt` | Runtime、进程或远端调用实际发生了什么 |
| 交付/接收 | `planned → sending/accepting → delivered/accepted → consumed`，另有 `partial/unknown` | 结果是否到达 Channel 或父 Session，以及是否被模型消费 |

逻辑 settled 不能覆盖仍未 drain 的进程；父 accepted 不能冒充父 consumed；模型完成不能冒充 Channel delivered。恢复分别对账三条状态线。

### 3.3 身份、版本与门禁

- 定义使用不可变 `definitionRevision` 和内容 digest；Session/Turn/调用固定实际使用的 revision。
- 模型产生的新意图必须带有效 `ActivationFence`；已受理的异步维护使用窄化 `OperationGrant`，它不能调用主模型循环。
- 物理调用使用稳定 `executionCallId/effectId`；跨 Session 派发另有稳定 `dispatchId`；外部交付另有 `deliveryId`。
- Runtime 接受 `runtimeBindingId + generation`，旧 generation 只能查询、取消和结算原调用，不能创建新副作用。
- 领域 intent、必要资源引用、outbox 和 WakeIntent 尽量在同一 Session 事务提交；跨 Session 使用发送方 outbox、接收方幂等接受与 ACK，明确不承诺跨库原子。

## 4. MCP

MCP 分为定义、Session binding、catalog 和 operation 四层。

1. `McpServerDescriptor` 随 AgentBundle/workspace/session 配置发布，保存 transport、source、revision、credential handle 和准入策略。Harness 只得到可展示能力与 schema，不得到凭据。
2. `McpSessionBinding` 固定 Session 允许的 server revision、连接 generation、工具/resource/prompt catalog revision 和 trust 状态。
3. stdio MCP 只在 Tool Runtime 启动；HTTP/SSE MCP 也通过 Runtime 或受控网络执行器发送。SDK reverse transport 绑定原 client lease，不转成共享服务。
4. tool call 走普通工具的 prepare→approval→preflight→execute→receipt；resource read 和 prompt get 也产生 `mcp_operation`，但不伪造 tool result。
5. discovery 的合法空集合与失败、partial、stale 分开。Catalog 更新只影响后续新调用；在途调用继续使用原 revision。
6. 远端调用已经发出但结果未知时不因 reconnect 自动重发。只有 server 提供稳定幂等键或状态查询时才能配置恢复策略。

MCP 连接池可按 workspace 共享，但预算、凭据、Session view 和调用门禁必须隔离。连接池的存在不允许 Session A 使用 Session B 才启用的工具。

## 5. Hooks

Hook plan 由 Harness 按固定 catalog revision 和 occurrence 生成，执行位置按类型分开：

| Hook 类型 | 执行 owner | 关键约束 |
| --- | --- | --- |
| command | Tool Runtime | 使用进程 owner、cwd/env view、超时与真实退出 receipt；async 命令不能只靠内存 registry |
| HTTP | Tool Runtime 或受控网络执行器 | URL/DNS/redirect/credential scope 每跳校验；发送后未知不重试 |
| prompt | Harness | 使用 `turn` 或 `hook_operation` activation；共享 Session 单调 epoch、模型槽位和预算，不启动主 Agent loop |
| function | 注册该 handler 的可信 host | 必须有可重建 `RegisteredHandlerRef`；不可序列化 closure 丢失时准确阻塞 |

每个逻辑事件生成稳定 `occurrenceId` 和 `HookPlan`；每个 Hook 生成 `hookExecutionId`。before Hook 必须结算后才能进入目标动作；after/failure Hook 在原动作 receipt 之后执行，不能改写物理结果。Sequential Hook 按 ordinal 提交有效输入，parallel Hook 也按计划顺序聚合，不能按网络返回顺序改变语义。

每个 Hook 定义显式声明 fail-open/fail-closed、timeout、async 和 once 语义。`once` 在 intent 提交时消费，调用失败不能自动恢复资格。异步 Hook 使用 `hook_execution` 自己的物理 binding 和 lease，不另造无 owner 的后台任务。

## 6. Channels

Channel 是输入/输出适配器，不是 Session owner。

```text
平台事件 → 验签/认证实例 → ingressId 去重 → route binding
        → 附件转存 Artifact → input + reply intent + WakeIntent
        → Harness 计算正式结果
        → channel_delivery outbox → adapter → provider receipt
```

- 入站 ID 绑定 channel instance、账号 generation、平台 event ID 与语义 revision。相同文本的两条真实消息必须保留为两个 input。
- senderName、chat title 和模型文本不授予权限；路由依据认证后的 instance/account/sender/chat/thread。
- 附件先转存受控 Artifact，再准入 input。未知是否准入时保留 staged bytes 并查询原 inputId。
- 流式卡片或分段回复为稳定 segmentId/ordinal；只补确定未发送的段。模型 Turn 完成与外部送达分别展示。
- 没有 provider query 或幂等键时，发送后断线进入 `delivery_unknown`；用户显式重发创建新的 deliveryId，并提示可能重复。

Channel 收到新消息只提交 input/WakeIntent。它不能直接调用 Harness 内部方法，也不能用当前选中的 UI Session 覆盖原 reply target。

## 7. 自动化

自动化拆成 `ScheduleDefinition` 与 `AutomationRun`。Scheduler 只发现候选和 claim run，不执行模型。

- 定义固定 cron/时区、prompt revision、目标 Session 模式、delivery、missed/catch-up、并发与预算策略。
- 每个触发生成稳定 `runId` 和 `occurrenceKey`。定时触发用 `scheduleId + revision + slot`；手动运行用 commandId；webhook 用已验证 eventId。
- `sessionMode=persistent` 向绑定 task Session 提交 input；`per_run` 创建独立 child Session。目标在 run intent 中冻结。
- 重叠策略显式为 `skip`、`queue_one` 或 `allow`；默认 `skip`。catch-up 默认为 `none`，可选 `latest` 或有界次数，禁止无限补跑。
- 扫描者使用 workspace lease/fencing；多个 Java 节点只能有一个 claim 成功。超时、404 或不完整响应不能证明 fresh child 未准入。
- run settled 后按已提交 delivery policy 创建 Channel outbox；发送失败不重跑模型。

Goal、Live、channel loop、webhook 和后台完成通知仍通过统一内部输入队列进入 Session；它们保留各自优先级和预算，但不拥有第二套 scheduler 或模型 loop。

## 8. 子 Agent

子 Agent 是独立执行 scope；需要独立长期运行、冷恢复或跨进程时，使用完整 child Session：

```text
父 Session 提交 child_run launch + outbox
  → Java 幂等创建 child Session / Runtime binding
  → child Harness 执行并提交 terminal result
  → child result outbox
  → 父 Session acceptChildResult（accepted）+ WakeIntent
  → 父 Harness 消费（consumed）
```

- child 保存 `rootSessionId`、`parentSessionId`、`childRunId`、purpose、depth、AgentBundle revision、预算和工作区隔离策略；不隐式共享父模型上下文。
- 工作区模式固定为只读 snapshot、独立 worktree 或显式串行的 shared workspace。默认需要写入时使用独立 worktree；共享写入必须有 generation/barrier。
- foreground child 只回原 tool result；background child 只走持久 notification input，不能两路都返回。
- parent close 默认 cascade cancel 未分离 child；明确 detached 的 child 必须换成独立 durable owner。关闭父后到达的结果保存为 orphaned，不自动复活父模型。
- child terminal、parent accepted、parent consumed 是三个独立事实。重启后 relay 只重投未 accepted 的原结果，不新建 child。
- team/task/mailbox 是 lead Session authority 下的持久领域资源；成员身份、任务分配和消息都走 outbox/ACK，不依赖共享内存 callback。

## 9. 后台 Shell

后台 Shell 不是一个一直占住 Harness 调用栈的普通 Tool Call。启动阶段仍走 Shell 工具的审批、preflight 和执行门禁，但成功启动后立即返回持久 handle：

```ts
interface BackgroundProcessBinding {
  childRunId: string;
  executionCallId: string;
  processId: string;
  runtimeBindingId: string;
  runtimeGeneration: number;
  commandDigest: string;
  cwdRef: string;
  startReceiptRef: string;
  status: 'starting' | 'running' | 'stopping' | 'exited' | 'lost';
  outputArtifactRef?: string;
  outputCursor: string;
}
```

- Runtime 使用进程组/cgroup/Job Object 监督根进程和后代；PID 只是诊断字段，不能作为跨重启身份。
- stdout/stderr 写有界分段日志并转存 Artifact，事件只发送进度与游标，不把每行永久写为一条公共事件。
- `status/read_output/send_input/terminate/kill` 都校验 Session、process owner 和 generation；cancel ACK 后仍等待真实退出或明确 `lost`。
- 有 running/stopping 进程时 Runtime 不能按普通 idle 回收。Session close 默认 terminate+drain；只有显式 detached 且已迁移到独立 durable owner 的进程可以继续。
- Runtime 丢失后，只有 OS/container supervisor 能用稳定 process identity 重新 attach 时才继续；best-effort status sidecar、空输出或旧 PID 不足以证明 running/settled。无法证明时为 `recovery_blocked`，不自动重跑命令。

## 10. Monitor

这里的 Monitor 指模型调用的长期观察工具；它不同于平台健康监控，也不同于定时 Automation heartbeat。

`monitor_run` 保存：`monitorId`、Session/owner scope、command/target digest、Runtime binding/generation、maxEvents、idle timeout、过滤/去抖策略、物理 start receipt、连续 observation sequence、最后观测摘要、通知水位、终态和输出 Artifact。

- Runtime 执行真实 watch/poll 命令并拥有进程；Java 保存定义、lease 和已接受观测；Harness 只收到有意义的通知输入。
- 连续相同状态或高频 stdout 先在 Runtime 有界聚合，再以 `observationSequence` 提交。没有状态变化时不创建新模型 Turn。
- 每个观测先持久接受，达到 notification policy 后再提交一个去重的 input+WakeIntent。`maxEvents` 计算已接受的有意义事件，不按原始日志行计算。
- Monitor 不占用 active Turn，但占用 Runtime、进程、日志和 monitor quota。Runtime idle 判定必须把它计入 hold。
- 对纯观察且可从持久定义重建的目标，Runtime 丢失后可以用新 generation 重新建立 watch，并从已提交水位继续；依赖旧本地进程、管道 offset 或不可重建文件句柄时标记 `degraded/recovery_blocked`。
- stop 先封新 observation，再取消物理进程、收尾输出、提交终态。迟到旧 generation 观测拒绝。

## 11. WebShell 与公共接口

阶段 H 不让 WebShell 直连 Runtime。Java 在现有公共 API 上增加以下资源，daemon 原 `/session/:id/tasks`、hooks、MCP 和 scheduled task 路由只作为内部适配来源：

| 资源 | 目标公共接口 | 用途 |
| --- | --- | --- |
| Session tasks | `GET /v1/agents/sessions/{sessionId}/tasks` | 合并 child/workflow/shell/monitor/automation 的持久读模型 |
| Task detail/output | `GET /v1/agents/sessions/{sessionId}/tasks/{taskId}`、`.../events?after=` | 状态、受控日志游标和 Artifact；不暴露本地路径 |
| Task action | `POST .../tasks/{taskId}:cancel`，按 capability 后续增加 send-input | 持久命令 ID、异步返回、可查询原命令 |
| MCP | `GET /v1/agents/sessions/{sessionId}/mcp-catalog`；workspace 管理面维护 server definition | 展示本 Session 固定 catalog；配置变更走管理权限和 revision CAS |
| Hooks | `GET /v1/agents/sessions/{sessionId}/hook-catalog` | 只读展示有效 plan 来源；用户决定继续走统一 Action API |
| Automations | `/v1/agent-automations` 与 `/runs` | 定义 CRUD、手动 run、run 查询；定义与历史 run 分开分页 |
| Channels | `/v1/agent-channels` 与 `/deliveries` | 连接/路由/交付查询；普通聊天仍复用 Session prompt/event API |

所有 mutation 使用 `Idempotency-Key`，列表使用稳定游标，异步命令返回 `202 + operationId`。Task 状态变化投影为已有公共 event sequence；高频日志和 Monitor 原始行放 Artifact/分页流，不挤占主对话 SSE。

## 12. 容量、恢复与关闭

| 资源 | 至少需要的额度 | Runtime/Session hold | 恢复重点 |
| --- | --- | --- | --- |
| MCP | workspace 连接、Session binding、inflight operation | stdio 连接或调用未结算时 hold | catalog revision、connection generation、远端 unknown |
| Hooks | 每 occurrence 数、prompt Hook 模型预算、async process | async command/function handler 未结算时 hold | occurrence/ordinal 去重、once 消费、handler 可重建 |
| Channels | ingress、staged bytes、delivery/segment backlog | 不因纯 outbox 常驻 Runtime | provider receipt、部分发送、账号 generation |
| 自动化 | active run、每时段触发、模型/工具预算 | 运行目标 Session 按实际工作 hold | scanner fencing、overlap/catch-up、dispatch unknown |
| child | depth、并发 child、模型/工具预算、worktree | 未 terminal 或有 physical hold 时保留 | child/parent 三阶段、独立 history/workspace |
| shell | 进程数、CPU/内存、日志 bytes | running/stopping 必须 hold | 进程 owner、真实退出、日志闭包 |
| monitor | 数量、事件速率、日志 bytes、Runtime 时长 | active/degraded 待处理时 hold | observation 水位、去抖、可重建目标 |

Session close 顺序固定为：封新输入与派发 → 取消或分离长期任务 → 接收原调用/子结果/发送 receipt → 关闭 Harness activation → 核验 Runtime 无 hold → release Runtime → 最后结束 writer。观察超时只影响 API 等待，不自动释放物理 owner。

## 13. 阶段 H 实施顺序

| 子阶段 | 交付 | 通过门槛 |
| --- | --- | --- |
| H0 | 共用 domain validator、outbox、OperationGrant、`SessionTaskView`、配额与恢复 reason | Java/qwen/Runtime 对稳定 ID、generation 和 unknown 解释一致；重启可重建任务列表 |
| H1 | MCP definition/binding/catalog/operation | stdio/HTTP/resource/prompt/tool、凭据、发现失败、连接替换和 lost ACK 全部按原调用对账 |
| H2 | Hook plan/execution | 四类 runner、顺序/并行、once、async、prompt activation 与全事件时序不重复执行 |
| H3 | 后台 Shell 与 Monitor | 真实进程 owner、日志 Artifact、Runtime hold、stop/drain、重启 attach 或准确 blocked |
| H4 | child/workflow/team | 独立 child Session、worktree、父 accept/consume、消息与关闭级联可恢复 |
| H5 | Channels | 入站路由/附件、正式结果 outbox、逐段 receipt、部分/unknown 交付和账号换代 |
| H6 | 自动化、Goal/Live/loop/webhook | 单扫描者 claim、run ledger、overlap/catch-up、persistent/per-run、结果交付不重跑模型 |

Worktree、历史操作、媒体和 Memory 继续按原专项阶段接入；某个 H 子阶段通过不能扩大未验收能力。每个 profile 的 AgentBundle 明确列出允许能力，缺少 capability 时创建前选择 Legacy 或拒绝显式 Managed 请求，不能运行中切引擎。

## 14. 验收清单

1. Java、Harness、Runtime 任一在 intent 前、dispatch 后、receipt 前后崩溃，恢复只查询原 operation，不重复副作用。
2. Session 断开和重连不会取消 child、shell、monitor 或 automation run；WebShell 从 SQL 投影读到相同 taskId 与状态。
3. Runtime 有后台进程或 Monitor 时不会错误 idle release；stop 后根进程和后代真实退出，迟到旧 generation 事件被拒绝。
4. MCP catalog 变更、Hook 更新和 AgentBundle 升级不改变在途调用；新调用使用新 revision。
5. Channel 重投只形成一个 input，真实相同文本仍是两条；外发 ACK 丢失不会自动双发。
6. 自动化双扫描者只 claim 一个 run；fresh child 派发 unknown 不回父重复执行；模型完成后 Channel 发送失败不重跑模型。
7. child terminal、parent accepted、parent consumed 可分别观察；父重启后只补原结果，父关闭后不被 orphan 结果复活。
8. 高频 Monitor/日志不按每行永久膨胀公共事件表；有界聚合、Artifact 和保留清理后仍能恢复连续水位。
9. 租户、workspace、Session、client 与账号 generation 的越权访问均失败；SecretHandle、Runtime endpoint、绝对路径和 PID 不出现在公共 API。
10. 所有失败都能归为确定未执行、已结算、可 attach、unknown/corrupt 之一；unknown 不伪装成功或自动重跑。

实现验收必须保留精确源码版本、协议请求/receipt、SQL commit sequence、MQ 重投、真实进程树、Artifact digest、平台 provider ID 和故障注入点。本轮只完成设计收敛，没有执行上述产品 E2E。
