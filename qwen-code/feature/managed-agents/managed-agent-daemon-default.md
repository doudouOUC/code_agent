# Managed Agent 作为 daemon 默认执行实现

## 状态与目标

2026-09-08 设计草案，依据代码 `7f498eed1b`。用户明确的目标是让 Managed Agent 替换 daemon 的默认 Agent 执行实现，普通 Web Shell、SDK 和 daemon 内部调用者直接使用它。独立 Managed Agents 页面是已有实验验证入口，不是最终交付形态。

本文记录当前差异和建议迁移顺序；没有将 Managed 设为默认，也不声明能力已对齐。已有 P0～P8、P9a 和展示测试继续复用。P9b 外部资源分配不作为本地默认替换的先决条件。

## 当前差异有多大

daemon 的 HTTP 服务、认证、工作区注册、部分工具基础设施和 UI 组件可以复用；Agent 执行能力及会话协议的差异较大。当前 Managed 是可运行的只读 Agent 实验实现，不能通过替换一个路由就获得普通 daemon 的全部编码能力。

```mermaid
flowchart LR
    U[普通 Web Shell / SDK] --> D[daemon 会话接口]
    D --> B[所属工作区 ACP Bridge]
    B --> A[ACP Session 完整 Agent 执行]
    A --> M[模型服务]
    A --> T[工具 / 审批 / 工作区上下文]
    X[实验 Managed 页面 / API] --> G[Managed Gateway 精简模型循环]
    G --> M
    G --> R[Tool-only Runtime]
    R --> RT[只读工具]
```

| 方面         | 普通 daemon 当前实现                                                                      | Managed 当前实现                                                                                                               | 替换前要求                                                                      |
| ------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| 推理执行     | 请求进入所属 Bridge，再进入 ACP `Session.prompt`，包含上下文、Hooks、压缩、工具和停止处理 | Gateway 直接调用 `generateContentStream`，使用独立系统提示词和循环                                                             | 复用现有 Agent 行为，迁移模型与工具执行的所有权，避免维护第二套精简 Agent       |
| 工具能力     | 沿用普通 Session 的工具注册、调度及权限交互                                               | Gateway Agent Definition 和 Runtime manifest 均按安全只读 kind 过滤                                                            | 补齐编辑、Shell 等能力前，先接通审批、执行取消及副作用结果处理                  |
| 配置与扩展   | 存在会话模型设置、工作区配置以及 Session 的 Hooks/记忆处理                                | 一个 Gateway runner 持有自身配置；跳过 workspace settings、MCP discovery、Hooks、Skill Manager、文件检查点，固定 low reasoning | 定义每个逻辑 Session 的有效配置和上下文快照；复用现有解析与策略，保持工作区隔离 |
| 会话模型     | 可先创建空 Session，再发 Prompt；普通 load/resume、fork、归档等已有契约                   | 创建会话同时提交初始 Prompt；续轮依赖已有成功提交的模型历史                                                                    | 支持空会话、失败首轮后的合理继续行为，并兼容现有会话操作                        |
| 历史与恢复   | 普通 transcript、replay、压缩和会话持久化链路                                             | 自有 conversation/presentation journal；模型历史仅在成功结束时提交                                                             | 统一面向客户端的历史契约，明确失败/取消时展示与模型上下文的差别，补齐压缩和迁移 |
| 长任务限制   | 完整 Agent 路径自身的限制与配置                                                           | 固定 16 个工具轮次、32 次工具调用、4096 输出 token；历史至多 256 个 Content entry、每记录 4 MiB                                | 不把实验常量当作普通 daemon 的兼容承诺；沿用产品已有预算和压缩语义              |
| 对外协议     | 普通 session 接口、DaemonEvent 与 ACP 传输等                                              | 独立 `/managed/sessions` REST/SSE，Managed SDK 方法直接走 REST，事件类型不同                                                   | 保持既有客户端协议，统一事件投影及操作结果，覆盖 ACP 与 REST 两条路径           |
| 进程生命周期 | Bridge 管理 ACP 子进程和会话所有者                                                        | Gateway 保留模型状态，Runtime 专门执行工具；P9a 支持本地 worker 激活、复用、失效与清理                                         | 保留 Managed 的职责划分，继续验证工作区生命周期与在途执行边界                   |

“跳过 MCP/Skill 初始化”特指 Gateway 当前初始化链路，不能据此声称 Runtime 中所有扩展都不可用。实际可执行集合仍受 Gateway Definition、Runtime manifest 和兼容校验共同约束，尚不是普通 Session 的完整扩展契约。

当前证据入口（仓库相对路径）：

- `packages/cli/src/serve/routes/session.ts`：普通 `/session/:id/prompt` 调用 `ownerBridge.sendPrompt`，与 Managed admission/list/transcript/cancel 路径并存。
- `packages/acp-bridge/src/bridge.ts`：普通 Prompt 入队、取消、权限交互、模型设置及会话生命周期。
- `packages/cli/src/acp-integration/session/Session.ts`：`prompt`、`#sendMessageStreamWithAutoCompression`、UserPromptSubmit/Stop Hooks、记忆和权限处理。
- `packages/cli/src/serve/managed-gateway-model-runtime.ts`：只读 Definition、独立循环、固定预算、Gateway 配置初始化。
- `packages/cli/src/acp-integration/acpAgent.ts`：Runtime manifest 的只读过滤；Tool-only Session 拒绝模型 Prompt。
- `packages/cli/src/serve/managed-gateway-conversation-store.ts`、`managed-prompt-service.ts`：历史上限、成功提交、续轮资格与并发轮次拒绝。
- `packages/sdk-typescript/src/daemon/DaemonClient.ts`、`managed-sessions.ts`：独立 Managed 请求与事件类型。
- `packages/cli/src/serve/run-qwen-serve.ts`：实验开关、工作区绑定、Gateway runner 与 Runtime Provider/Activator 的接线。

### 内部入口不能只靠 HTTP 改道

Web Shell 的普通 Session client 与 SDK 依赖普通 Prompt 的 ACK/事件契约；ACP 服务入口还会直接调用所属 Bridge。Conversations、Live 任务等也有内部 `sendPrompt` 调用，并非所有请求都经过 `/session/:id/prompt`。当前 Managed 创建还明确拒绝内部 Conversations 工作区。

Channels 通过 `packages/cli/src/commands/channel/daemon-worker.ts` 和 `packages/channels/base/src/DaemonChannelBridge.ts` 使用普通 Session SDK，依赖 workspace、model、approvalMode、`sourceType=channel` 和实例级 `sourceId`。交付要等待正式回复、内容块和 stopReason，不能用 Prompt admission 代替。适配层须保留受信 channel metadata、附件在 admission 不确定时的保留行为，以及 thread/user 路由与取消归属。

定时任务存在两类路径：手动 fresh-session 触发通过 `routes/scheduled-tasks.ts` 创建 Session 并 `sendPrompt`；自动 tick 则由 ACP `Session.ts` 的 `startCronScheduler` → `#enqueueCronPrompt` → `#executeCronPrompt` 在子进程内推进模型。Tool-only Session 在 `acpAgent.ts` 中明确不启动该 scheduler。因此，只替换 Bridge 的 `sendPrompt` 也会漏掉自动执行。

替换时应将需要模型推进的定时/自动任务接入 Gateway 准入与执行所有者，同时保留现有 cron 锁、执行记录和过期 one-shot 处理规则。Goal、通知触发、后台子任务等同样要逐项审计实际模型入口，不能让 Tool-only worker 为兼容功能重新运行模型。相关入口还包括 `standalone-session-service.ts`、`live-session-coordinator.ts`、`live-task-service.ts`，迁移清单应记录最终回复交付和取消归属，而不仅记录发送函数。

## 目标执行与复用边界

普通客户端继续创建和使用逻辑 Session。daemon 在内部为该 Session 选择并持久化执行所有者；最终新建普通 Session 默认由 Managed Gateway 执行。Gateway 持有模型凭据、模型循环和模型历史；Runtime 持有工作区文件、工具执行及需要本地进程的操作。

```mermaid
flowchart LR
    C[现有客户端与内部调用者] --> F[daemon 会话服务与协议适配]
    F --> G[Managed Gateway / 复用现有 Agent 行为]
    G --> H[模型上下文与会话历史]
    G --> P[模型服务]
    G --> R[Tool-only Runtime]
    R --> W[所属工作区工具与本地操作]
    R --> Q[审批请求]
    Q --> F
    F --> C
```

先建立一次真实调用所需的最小内部接缝，再逐项迁移，不预先引入通用插件式执行框架。不能将整个 ACP Session 原样搬到 Gateway：它包含工作区、副作用和客户端交互依赖。应从现有执行路径中识别可复用的模型轮次、提示词构建、上下文压缩与停止语义，通过明确的工具执行和交互边界运行。复用范围需由首个实现切片验证，本文不声称只换一个类就能完成。

工作区指令、Skill 内容、MCP capability 和 Hooks 需要显式区分“提供给模型的上下文”和“读取文件或执行命令的本地行为”。前者经所属工作区受控解析后交给 Gateway；后者留在 Runtime。跨边界的数据须带有效配置版本，reload 后旧版本不得用于新执行。共享 worker 不代表可以共享不同 Session 的模型上下文。

## 协议、身份与会话所有权

1. 维持普通 Session ID 的稳定性，新增内部执行来源必须持久化。操作按已记录所有者分派；未知、冲突或不可用状态不能回退到 primary workspace 或另一种执行引擎。
2. 面向客户端兼容现有 Session API/ACP 语义。Managed 自有事件可以继续作为内部事实流，普通消息、工具状态、权限请求、用量和结束事件由适配层投影；不能只改事件名称而省略字段或时序。
   例如，普通 Prompt 的 HTTP 202 响应是 `{promptId,lastEventId,eventEpoch}`，后续消费普通 `turn_complete` / `turn_error` 事件；它与 Managed admission 和终态事件不是同一契约。当前普通路由还会拒绝 `sourceType=managed-gateway` 的 Tool-only Session，不能通过取消这项检查来实现默认替换。
3. 创建空 Session 与提交 Prompt 分开。将当前 Managed “创建即首轮 admission”保留为实验 API 的便捷组合，普通创建操作不得偷偷发模型请求或启动工具执行。
4. 保持所属工作区解析、认证和信任校验。普通用户不需要新的 Managed client ID 来重新建立一份目录；当前实验关联机制的兼容仅保留给旧 `/managed` 调用者。
5. 任务状态与 Runtime readiness 仍独立。工具 Runtime 失败不能改写已提交的回答；轮次完成、取消请求 ACK、SSE 断连是不同事实。
6. 既有普通 Prompt 的排队、取消、截止时间及幂等结果必须逐项保持。当前 Managed 单活跃轮次拒绝语义不能直接覆盖 Bridge 的队列行为。

路由所有权应在实现时逐项标注：创建依赖 selected-runtime；活动操作依赖逻辑 Session 的持久化工作区与执行所有者；历史和归档依赖 persisted-workspace；服务能力描述属于 process-global。不能让“Managed 默认”抹掉这些区别。

## 编码能力与交互

编辑和 Shell 的开放以完整权限往返为前提：Runtime 提出工具/操作对应的审批，Gateway 与 daemon 保留关联，客户端通过原有交互返回决策，Runtime 校验 Session、轮次、调用和执行版本后继续。取消或过期后到达的批准不得恢复执行。审批等待、拒绝、超时和用户问题均需要客户端事件及终态处理，不能用自动批准填补缺口。

复用普通工具调度与权限规则，明确哪些模型侧 Hooks 在 Gateway 执行、哪些本地 Hooks 在 Runtime 执行，并对执行次数和顺序做回归。编辑、检查点、撤销、Shell 输出/退出、后台任务、子 Agent、计划/Goal、用量以及模型切换列入能力清单；未对齐项必须显式标明，不能在默认切换时静默丢失。

工具执行已分发后出现崩溃或网络不确定性时，沿用现有 Managed 的保守恢复原则，不自动重放可能有副作用的调用。模型历史与展示历史分开记录，失败或取消不能伪装成成功提交。写工具需要增加执行结果与模型提交之间的一致性验收，当前只读测试不足以证明这一点。

## 旧会话与回退

迁移期间，既有普通会话继续由旧执行路径负责，新建会话在明确启用的开发阶段进入 Managed。首次进入 Managed 不直接将普通 JSONL 当作 Managed history 读取；恢复、fork、压缩边界、工具结果及工作区身份需要经过有版本的转换验证。

默认切换时仅改变新会话的创建策略，不热迁移在途 Prompt。关闭新默认后，新会话可以回到旧路径；已创建的 Managed 会话仍按其所有者继续处理或明确报告不支持。不能把 Managed ID 交给普通 Bridge 去“尝试恢复”。未实现转换之前，保留旧执行路径是旧会话兼容措施，不是 Managed 失败时的隐式降级。

普通会话列表、标题、归档、删除、导出、分支和通知应读取统一逻辑会话投影，避免双目录和重复通知。Tool-only Runtime Session 继续隐藏；展示的对象始终是 Gateway 的逻辑 Session。

## 实施顺序与退出条件

| 切片                       | 交付内容                                                                                                                   | 退出条件                                                                                                              |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| D1：内部执行接缝与普通入口 | 为逻辑 Session 持久化执行所有者；在开发 opt-in 下串起普通 create/prompt/events/transcript/cancel；复用现有权限与工作区检查 | 普通 URL 和现有 SDK 可完成只读轮次，无需 Managed 页面；空会话、取消、重连、队列语义有契约测试。此时仍不是默认替换完成 |
| D2：现有 Agent 行为复用    | 用现有提示词、上下文/压缩与模型配置路径替换实验精简循环；明确本地上下文和 Hooks 边界                                       | 同一配置与固定模型夹具下，普通/Managed 的关键请求内容、工具顺序、停止行为和历史一致；长会话可压缩继续                 |
| D3：编码与交互能力         | 审批往返、写文件、Shell、检查点及任务/子 Agent 等现有能力逐项接通；补齐扩展和模型设置                                      | 现有编码任务可完成，审批拒绝/取消不会执行副作用，崩溃不会重复写入；其余产品能力无静默丢失                             |
| D4：目录、恢复与所有入口   | 统一展示投影；旧会话兼容；覆盖 ACP/REST、内部调用者与工作区生命周期                                                        | 刷新/重启后 ID、历史、设置及状态一致；列表不重复、Runtime 不泄露，多工作区不串环境                                    |
| D5：默认切换               | 新建 daemon Session 默认 Managed，保留明确旧会话与回退策略；独立页面降为实验诊断入口                                       | 既有 daemon 验收与新增故障矩阵通过，切换/回退不重放在途 Prompt；文档和能力声明同步                                    |

D1 的开发启用方式沿用实验配置入口，不先对普通用户增加新的引擎选择 UI。只有 D2～D4 的兼容门槛满足，D5 才改变默认。

## 验收矩阵

以下为待实现后的验收计划，不是已通过结果。

- 用既有普通 Web Shell 和未改调用方式的 SDK 走 create → prompt → thought/tool → completed；检查普通 SSE 与 ACP 的等价事件投影、用量和通知。
- Channels 检查 thread/user 会话恢复、附件和最终交付；自动调度检查 controller/run 血缘、锁、错过 one-shot 的确认行为及单次执行。子任务完成通知须由 parent 持久接受，不能把 UI 收到事件当作交付完成。
- 只读、编辑、Shell、用户问题分别覆盖允许、拒绝、取消、超时、重复决策和失联；写工具执行计数与文件结果必须可核对。
- 首轮失败/取消、后续失败/取消、空会话、排队消息及完成竞态；展示历史与模型历史的差异必须可解释。
- 工作区指令、Hooks、MCP/Skills、模型与模式设置、上下文压缩：校验模型请求和实际本地行为，不仅检查 UI 文本。
- refresh/reconnect/restart、旧 Session restore/fork/archive/delete/export；确认没有重复模型调用和工具副作用。
- primary/secondary/dynamic workspace 的 reload、撤信任、移除；共享 Runtime 中取消一个 Session 不影响另一个，配置和凭据不跨工作区。
- 默认开启/关闭与版本回退：已有会话所有者不变，未知所有者失败明确，绝不隐式执行另一套 Agent。

测试使用隔离端口、目录和可控模型服务；当前 4170 预览不作为迁移试验对象。本次仅做代码调查和文档设计，没有运行替换后的行为测试。

## 本轮结论与待细化项

优先解决的是 Agent 能力复用和普通会话契约，而不是继续扩充独立页面。下一项可实施工作是 D1 的调用者/路由清单与最小接缝，并用 D2 的一个真实上下文/工具轮次验证复用方向。

具体可提取的 Agent driver 边界、普通历史转换格式和全部内部调用者迁移顺序，需要在对应切片中完成精确接口设计；本文不提前承诺实现工期，也不把这些项目列为已完成。独立本地 CLI/TUI 的执行默认不在此次 daemon 替换范围内。
