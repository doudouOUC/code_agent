# 历史归档：被 HTML 基准替代的 Java 产品方案

> 归档日期：2026-09-18。本文件完整保存此次调整前的文档，含当时的方案判断和实现/验收记录。下文的“最新”“canonical”“当前”和 M0～M8 均为历史口径，不再决定现行架构或实施顺序。当前以 [HTML v1.2](managed-agent-dual-path-architecture.html) 和[双链路方案](managed-agent-java-hosted-runtime.md)为准；历史记录中的完成状态未在本次文档更新中重新验证。

---

# Managed Agent 最新产品架构：Java、Hosted Harness 与 Tool Runtime

> 状态：2026-09-18 canonical 产品方案。Hosted Harness、Java Managed 主链路、Runtime Broker durable 核心和本地完整进程 E2E 已完成；产品 WebShell `JavaAgentProvider`、真实 DataAgent/ACS 联合 E2E、双 JVM + MySQL 故障注入和公共 Agent API Adapter 尚未完成。
>
> 本文覆盖 P0～P9a 的产品落地结论。P0～P9a 仍作为历史实验、协议演进和局部能力证据，不再直接代表最终产品部署拓扑。

## 1. 冻结结论

最新产品链路固定为：

```text
WebShell
  -> JavaAgentProvider
  -> Java Session / Prompt / SSE API
  -> Hosted Harness
  -> Java Runtime Broker
  -> Tool Runtime
```

其中：

1. Java 产品服务是 Session、Turn、公共 Event、鉴权和 Runtime binding 的权威层；
2. Hosted Harness 是常驻、逻辑多租户、可水平扩展的完整 Agent 执行服务，负责模型、Context、Agent Loop 和 Tool 编排；
3. Runtime Broker 是 Java 管控面内的模块，通过独立内网 HTTP 入口服务 Hosted Harness，首版不单独部署；
4. Tool Runtime 按需创建，负责 Workspace、Tool、MCP、Skill 和本地副作用，不持有模型凭据，也不决定 Session 终态；
5. WebShell 只访问 Java，不直连 Hosted Harness、Broker 或 Tool Runtime；
6. 本地 `qwen serve` 保留现有 Daemon Provider，与 Managed 产品链路并存；
7. 不实现 Java daemon-compatible 网关，不让 Java 模拟完整 qwen daemon REST/SSE 协议；
8. 首轮 Prompt 到达时，Java 同时提交 Harness 和异步 warm Runtime。模型立即开始，只有真正出现 Tool Call 时才等待 Runtime。

因此，这不是“先用一个临时模型回答，再把第二、三轮会话迁移到 Pod”，而是同一个权威模型会话始终运行在 Hosted Harness，Tool Runtime 就绪后只接入本地工具执行。

## 2. 目标和非目标

### 2.1 目标

- 第一轮请求不等待 Tool Runtime 或 Pod 冷启动，缩短 TTFT；
- 同一轮内部允许先产生模型事件，再等待 Runtime 执行工具并继续模型循环；
- Java、Harness 或 Runtime 重启后不重复 Turn 和有副作用 Tool；
- WebShell 刷新或 SSE 重连后按 durable cursor 精确续传；
- Legacy daemon 和 Managed Session 可以长期并存，存量会话不被隐式迁移；
- 后续可在同一内部执行内核上增加 OpenAI Managed Agents、Responses 或 Claude 风格 Adapter。

### 2.2 首版不做

- 不让浏览器指定 Runtime URL、Pod、容器、token、lease、endpoint 或本地路径；
- 不让浏览器直连 Hosted Harness、Runtime Broker 或 Tool Runtime；
- 不为 Java 实现 daemon-compatible REST/SSE 网关；
- 不把旧 Legacy Session 自动升级成 Managed Session；
- 不在首版开放 WebShell 的 MCP/Skill 管理、终端、文件树、动态 workspace 注册或 permission mutation；
- 不在首版同时开放多套公网写 API；
- 不把 Kubernetes 作为协议前提，Runtime 可以由 ACS、Pod、进程或其他 provisioner 创建，只要满足同一私有协议与隔离契约。

## 3. 组件与所有权

| 组件 | 权威职责 | 明确不负责 |
| --- | --- | --- |
| WebShell `JavaAgentProvider` | 将 Java Session、Turn、Item、Event 投影为前端会话；提交 Prompt、重连和取消 | daemon 协议；Harness/Runtime 凭证；直接工具执行 |
| Java Session/Prompt 服务 | 用户鉴权、tenant/workspace scope、Session/Turn 状态、Prompt admission、公共事件、取消、删除和恢复 | 模型循环；本地工具副作用 |
| Hosted Harness | 模型调用、Context、压缩、Agent Loop、Tool Call 编排、Harness 私有 transcript/status | 公共租户鉴权；公共 Session 状态；Runtime 生命周期 |
| Java Runtime Broker | durable binding/session/execution、warm、lease/generation fencing、幂等 execute/cancel/release | 模型调用；公共 Web API；前端事件投影 |
| Tool Runtime | Workspace 文件、Shell、Tool、MCP、Skill、本地进程与物理取消 | 模型凭据；用户 Prompt；公共 Session 终态 |

Java 仍是控制面，但 Tool payload 的内部数据链路为：

```text
Hosted Harness -> Java Runtime Broker -> Tool Runtime
```

这不意味着浏览器或 Java Prompt Controller 需要转发每个工具输出。Broker 作为 Java 内嵌模块提供受鉴权的内网协议，统一控制 Runtime 身份、租约、幂等和恢复；大结果可以使用受控 Artifact 引用，避免无界内存转发。

## 4. 部署模型

### 4.1 Hosted Harness

Hosted Harness 是常驻服务，可由多个无状态服务实例组成。这里的“无状态”是指实例本身不作为 Session 的最终权威存储，不是指执行过程中没有内存状态。

- 一个物理 Harness 进程或 Pod 可以并发承载多个租户和 Session；
- 每个 Session/Turn 使用独立逻辑 handle、scope、generation 和资源预算；
- Java 保存 Session 到 Harness owner/session 的 durable binding；
- 实例故障后只能依据持久 binding、status/transcript 和 fencing 恢复，不能重新提交一个可能已执行的 Turn；
- 容量可以采用常驻最小副本加水平扩展，不要求“一用户一 Harness Pod”。

### 4.2 Java Runtime Broker

Broker 首版作为 Java 管控面模块部署：

- 复用 Java 的 tenant/workspace、DataAgent 生命周期和数据库能力；
- 对 Hosted Harness 暴露独立的内网 HTTP endpoint 和 bearer；
- 不经浏览器，不暴露到公共网络；
- Broker 状态写入 durable Repository，不能依赖单 JVM Map；
- 多 Java 实例通过数据库 CAS、claim lease 和 generation fencing 竞争同一 execution。

当 Broker 的伸缩或故障域以后需要独立拆分时，可以保持协议不变再独立部署；首版不为这个可能性增加第二套服务。

### 4.3 Tool Runtime

Tool Runtime 按 tenant、workspace 和 generation 创建或复用，可以是 Pod、容器或本地进程。产品实现当前优先接 DataAgent/ACS，但协议不依赖 Kubernetes。

Runtime 必须：

- 使用专用 owned Managed Runtime 启动模式，而不是普通 `qwen serve`；
- 只暴露 `prepare / execute / status / cancel / release` 等私有能力；
- 校验 lease、epoch、Session、scope、executionCallId 和输入摘要；
- 不接收模型、Hosted Harness、Gateway、IDE 或 BFF 凭据；
- 物理副作用结果不确定时保留原 Runtime/execution 身份并进入 `UNKNOWN`，禁止换 Runtime 自动重放。

## 5. 第一轮 Prompt 与异步 warm

第一轮时序固定为：

```text
Client -> Java: create/load Session + submit Prompt
Java -> DB: admission(promptId, payloadDigest, executionEngine=MANAGED)
Java -> Hosted Harness: submit 同一 promptId
Java -> Runtime Broker: warm(tenant, workspace, generation)  [并行]
Hosted Harness -> Model: 立即开始模型调用
Hosted Harness -> Java: 模型 delta / Turn 事件
Java -> Client: SSE durable public event

alt 无 Tool Call
  Hosted Harness -> Java: final
else 出现 Tool Call
  Hosted Harness -> Broker: execute(executionCallId, ...)
  Broker -> Tool Runtime: 等待原 warm 并执行
  Tool Runtime -> Broker -> Hosted Harness: durable result
  Hosted Harness -> Model: 继续同一 Turn
  Hosted Harness -> Java -> Client: final
end
```

关键约束：

- `submit Harness` 和 `warm Runtime` 在 Java admission 提交后并行触发；
- 首个模型 token 不等待 Runtime ready；
- 无 Tool Turn 即使 Runtime warm 尚未完成也可以结束；
- Tool Call 等待的是同一个 warm future/binding；
- 同一 `promptId + payloadDigest` 只能 admission 一次；
- 同一 `executionCallId` 最多发生一次物理执行；
- Java/Harness/Broker 的响应丢失都通过原身份查询和对账，不能创建第二个 Turn 或 execution。

## 6. `JavaAgentProvider` MVP

WebShell 不复用 Daemon Provider 访问 Java。宿主只有显式选择 Managed 产品模式时才装配 `JavaAgentProvider`。

MVP 只实现四组能力：

```text
createSession / loadSession
submitPrompt
subscribeEvents(managedLastSequence)
cancelTurn
```

### 6.1 Provider 契约

- create/load 返回 Java 公共 Session View，不返回 Harness/Runtime binding；
- submit 返回稳定的 Session/Turn 标识和已受理状态；
- SSE 中每个 durable 事件携带单调 `managedSequence`；
- 前端只保存并回传 `managedLastSequence`；
- Java 从公共 Event Store replay，不让前端使用 Harness `eventEpoch/sequence`；
- Event 投影必须按稳定 Item/Turn ID 去重，刷新和重连不能重复 transcript block；
- cancel 只调用 Java，由 Java 分流 Harness Turn 与 Broker execution 的取消；
- 未支持的 daemon workspace 能力由宿主隐藏或明确返回 unsupported，不能静默调用 Legacy endpoint。

### 6.2 浏览器安全边界

浏览器只持有现有 Java/BFF 登录态或面向 Java API 的短期凭证。下列信息不得进入前端响应、日志或浏览器网络请求：

- Hosted Harness bearer 和 endpoint；
- Runtime Broker bearer 和内网 endpoint；
- Runtime bearer、lease、epoch 和 generation；
- Pod、容器或进程身份；
- 服务器本地 workspace path；
- BFF、模型 Provider 或 MCP 服务端密钥。

跨域、Cookie/Bearer、SSE keepalive 和限流由 Java/BFF 统一处理，不能通过开放 Broker 私网端口绕过。

## 7. Durable 状态、幂等与 `UNKNOWN`

### 7.1 Java 权威对象

首阶段复用产品现有表，不立即复制一整套公共数据模型：

| 逻辑对象 | 首阶段真相源 | 说明 |
| --- | --- | --- |
| Agent Session | `chat_session` + 当前 Hosted binding | `sessionCode` 作为公共 Session ID |
| Hosted binding | `agent_cli_runtime_session` | Harness session/client/boot/protocol/digest；不进入公共响应 |
| Turn | `chat_history` | `requestCode` 作为公共 Turn ID；admission 信息存入扩展字段 |
| Public Event / Item View | `agent_managed_event` | Java 分配 `publicSequence`，用于 SSE replay 和只读 View |
| Artifact | 现有 Artifact Repository/OSS | Java 做 scope 和权限校验 |
| Runtime binding/session/execution | Broker durable Repository | 保存 generation、claim、执行终态和恢复证据 |

后续 Agent API 使用供应商无关的 `AgentSessionApplicationService` 和只读 View 适配这些事实。只有真实查询、保留期或性能证据证明现有表不足时，才物化独立 Session/Turn/Item 表。

### 7.2 三个幂等身份

- Prompt：`promptId + payloadDigest`；
- Runtime warm/binding：tenant + workspace + generation；
- Tool execution：`executionCallId + idempotencyKey + inputDigest`。

相同 ID、相同 digest 返回原结果；相同 ID、不同 digest 返回稳定冲突。JVM 锁只减少竞争，数据库唯一键和 CAS 才是最终保证。

### 7.3 `UNKNOWN` 语义

当 Tool 可能已产生副作用，但原 Runtime 不可达、binding generation 丢失或执行结果无法证明时：

1. execution 持久化为 `UNKNOWN`；
2. 清除可重新派发的 claim，但保留原 Runtime、generation 和 execution 身份；
3. 禁止自动投递到新 Runtime；
4. Hosted Harness 收到稳定的 recovery-blocked 结果，不能继续假装 Tool 未执行；
5. 只有受审计的 Java 管控面可以显式选择接受未知失败，或在外部证据证明未执行后允许重试；
6. 处置竞争继续使用数据库 CAS，不能由 Harness bearer 直接修改。

`UNKNOWN` 是副作用安全门禁，不是普通可重试错误。

## 8. Legacy 与 Managed 并存

两条链路同时保留：

```text
本地/Legacy：WebShell -> Daemon Provider -> qwen serve
产品/Managed：WebShell -> JavaAgentProvider -> Java -> Hosted Harness -> Broker -> Runtime
```

规则：

- 新建 Session 时根据显式产品配置选择 execution engine；
- 选择结果写入 durable binding，之后 sticky；
- 配置开关变化不能让活动 Managed Session 回落到 Legacy；
- Legacy Session 不能仅因使用 Managed 页面而自动升级；
- 如需迁移，必须是独立、显式、可审计的离线/终态迁移流程；
- 本地 `qwen serve` 的 REST、ACP、WebShell 和 workspace 行为保持不变；
- Managed 故障时 fail closed，不通过 Legacy 重跑 Prompt 或 Tool。

## 9. 公共 Agent API 演进

公共 Agent API 放在 Java 产品服务，不放进 Hosted Harness 或 Runtime Broker。内部先定义供应商无关的：

```text
Agent / Session / Turn / Item / Artifact / Event
```

推荐顺序：

1. 先建立只读 `AgentSessionApplicationService` 和 View；
2. 影子校验 DataAgent API 与新 View 的 Session、Turn、Item、Event 一致性；
3. 实现 `JavaAgentProvider`；
4. 开放只读 OpenAI Managed Agents Adapter；
5. 增加 Command Ledger 后开放 create/message/cancel/stream；
6. 稳定后再增加 Responses Adapter，一个 Response 映射为一个 Turn；
7. Claude 风格 Adapter 和 Subagent 只有在持久事件、资源和真实需求明确后再实现。

所有 Adapter 共用 Java admission、鉴权、事件、取消和恢复内核，不复制 Harness 调用链。

## 10. 当前代码与验证状态

### 10.1 已完成

- Hosted Harness 私有协议 v1：能力协商、boot/generation fencing、caller-owned Session/Prompt ID、payload digest、SSE epoch/sequence、status 和 transcript；
- Java Hosted Harness client、Managed binding、sticky routing、Prompt admission 和事件两段投影；
- submit outcome unknown 的 status/transcript 对账和一次 durable retry；
- `ManagedTurnReconciler`、Managed load durable replay、`managedSequence`、cancel、delete/close、permission fail-closed 和 attachment detach；
- Tool Runtime 异步 warm、Broker durable Repository、DataAgent 幂等 provision、execution 响应丢失恢复和 `UNKNOWN` 门禁；
- 本地 Hosted Harness + Java Broker fixture + 冷 Runtime 完整进程 E2E。

### 10.2 已验证本地证据

- 首个模型事件约 495 ms；
- Runtime ready 约 15.916 s；
- 首个模型事件明显早于 Runtime ready；
- 同一 Tool 的 physical execute = 1；
- 丢失一次 execution 响应后可从原 execution 恢复，未重复副作用。

这些证据证明了架构关键路径，但不等同于产品环境上线完成。

### 10.3 尚未完成

- 产品 WebShell `JavaAgentProvider`；
- 供应商无关 `AgentSessionApplicationService` 和公共只读 View/Adapter；
- SDK 发布到产品 CI 可解析的内部 Maven 仓库；
- 产品 Java + 真实 Hosted Harness 的 create/submit/SSE/reconnect/restart/cancel/delete E2E；
- DataAgent/ACS 的真实网络、鉴权、冷启动和三个 provision crash point；
- 两个独立 JVM + MySQL + 普通负载均衡下的 claim 接管、旧 owner fencing 和处置竞争；
- owner crash、数据库不可用、Runtime 不可达的真实 `UNKNOWN` 故障注入；
- 容量、安全、灰度和回滚门禁。

## 11. 可执行实施顺序

| 阶段 | 内容 | 完成门槛 |
| --- | --- | --- |
| M0 | 发布 SDK、固定配置和网络探针 | 产品 Java 可解析 SDK；Java/Harness/Broker/Runtime 私网互通且凭证不泄漏 |
| M1 | 产品 Java + Hosted Harness E2E | create -> submit -> SSE -> complete、断流续传、Java 重建、cancel、detach/reattach、delete/close 全通过 |
| M2 | DataAgent/ACS Runtime E2E | 冷启动不阻塞首个模型事件；三个 provision crash point 可收敛且不重复创建 |
| M3 | 双 JVM + MySQL 故障注入 | 同一 execution 物理执行一次；旧 owner 写入被 fence；不确定结果进入 `UNKNOWN` |
| M4 | `AgentSessionApplicationService` 只读 View | 与现有 DataAgent Session/Turn/Event 结果一致，跨 tenant 读取被拒绝 |
| M5 | WebShell `JavaAgentProvider` MVP | 浏览器只访问 Java；刷新/重连无重复；cancel 只走 Java；daemon 路径零变化 |
| M6 | OpenAI Managed Agents 只读 Adapter | 无副作用、租户隔离、契约 fixture 通过 |
| M7 | 写入 Adapter + Command Ledger | create/submit/cancel 幂等，不能绕过 admission 和事件存储 |
| M8 | Responses/其他 Adapter | 复用同一 Session/Turn/Item 内核，不新增第二套 Agent Loop |

生产开流前，M0～M3 和目标 tenant 的 M5 必须通过。M6～M8 是公共 API 演进，不是首个产品 Managed 会话的前置条件。

## 12. 统一验收原则

1. 默认开关关闭时，Legacy、`QWEN_CODE`、`QWEN_DAEMON_REST` 和本地 `qwen serve` 零行为变化；
2. Managed Session 的 owner、generation、promptId、event cursor 或 Runtime lease 任一无法证明一致时 fail closed；
3. 同一 Turn 最多产生一次 Harness admission，同一 `executionCallId` 最多产生一次物理 Tool 副作用；
4. TTFT 指标单独记录模型首事件、Runtime ready 和首个 Tool result，不能用最终 Turn 时长替代；
5. 公共响应和浏览器请求不得暴露内部 endpoint、token、lease、Pod 或本地路径；
6. 代码完成、单元测试通过、本地进程 E2E、真实产品 E2E 和生产灰度是不同完成层级，文档必须分别标注；
7. 任一门禁失败时只停止新 Managed admission/warm，不把活动 Managed Session 降级到 Legacy。
