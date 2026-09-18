# Qwen Code Managed Agents 双链路方案

> **当前基准：用户指定的 [HTML v1.2](managed-agent-dual-path-architecture.html)。** 同步日期：2026-09-18。现行架构保留 `qwen serve` 统一会话协议与同 daemon 的 Legacy/Managed 双引擎；Java 是产品控制面并内嵌 Runtime Broker，托管部署使用 Java Pod + qwen serve Sidecar，工具环境按需启动。实施顺序为 HTML 的 A～H。
>
> 本次是文档对齐，不表示新阶段已实现或通过验收。此前 `JavaAgentProvider / M0～M8 / 首阶段 Java 统一 Session authority` 路线已[归档](managed-agent-java-hosted-runtime-history.md)，不再覆盖 HTML。源码中的接口差异、已有验证记录和未完成项见[实现对照](managed-agent-java-hosted-runtime.md#17-实现快照与待对齐项)。

## 当前方案入口

先读 [HTML 双链路技术方案](managed-agent-dual-path-architecture.html)，再读对应的 [Markdown 技术方案](managed-agent-java-hosted-runtime.md)。HTML 原样收录，SHA-256 为 `81805b396e8e9b7e46eab3478ed0b57e0327b683a5c631a9494f328d40b16191`。

| 文档层级 | 用途 | 冲突处理 |
| --- | --- | --- |
| HTML v1.2 | 决定组件职责、部署、目标协议、状态、公共 API 和 A～H 阶段 | 作为当前架构基准 |
| Markdown 双链路方案 | 将 HTML 转为可检索的契约、时序、实施门槛及实现差异 | 与 HTML 同步，不用源码现状反向改写目标 |
| Session/Harness/Runtime 专项 | 细化 owner、存储、权限、工具、checkpoint、取消、恢复及兼容 | 按 A～H 映射；不能提前宣布 G 的完整外置/接管已完成 |
| P/D/R/F 历史阶段与验收记录 | 追溯实验、局部能力、失败和测试环境 | 保留原日期与范围，不作为另一套当前实施顺序 |

## 1. 架构与职责

```text
托管：前端 -> Java Product API -> qwen serve Session/Prompt/SSE
                                  ├── Legacy -> qwen --acp -> 原 Workspace
                                  └── Managed -> 进程内 TS Harness -> Model
                                                    └── Java 内嵌 Broker -> Tool Runtime

本地：qwen serve -> Legacy / Local Managed -> 本地或 Auto Local Runtime
```

- Java 负责产品鉴权、租户、配额、Session 后端路由、公共资源/事件投影、RuntimeBinding 和 Execution Ledger。
- qwen serve 负责统一 Session/Prompt/Load/Resume/SSE、执行引擎选择、固定 owner 和客户端兼容。
- Managed Harness 负责唯一完整模型循环、Context、压缩、工具编排与 Approval；不以 Java 重写 Agent。
- Tool Runtime 负责 Workspace、文件、Shell、Git、搜索、MCP、Artifact 和物理取消，不接收用户 Prompt 或模型凭据。
- 执行 Transcript/checkpoint 的权威与 Java 公共投影分开；阶段 G 才外置权威事件与 checkpoint、完成可替换 Harness 和取消实例粘性。

首次 Prompt 由 Java 并行转发 Harness 与启动/复用 Runtime。无 Tool 直接完成；有 Tool 才在同一 Turn 内等待 Runtime ready，随后继续原模型上下文。不是先临时回答再迁移到 Pod。

## 2. 双链路与部署

四种 Profile 为 Local Legacy、Local Managed、Hosted Managed、Hosted Legacy。本地 Managed 使用 Auto Local Runtime；Hosted Managed 第一阶段采用 Java Pod + qwen serve Sidecar，Broker 与 Java 同进程，Tool Runtime 为按需 Pod/Process。第一阶段不建设独立 Harness Worker Pool。

新 Session 仅在用途、可信 cwd、扩展依赖和协议版本均兼容时选择 Managed。已有 Legacy、兼容性未知、依赖未迁移 MCP/Hooks/Channels，以及 Channel/Scheduled Task/Standalone/Worktree/Branch 首阶段保留 Legacy。创建时持久化 executionEngine，运行中不切换；Managed 失败不调用 Legacy 重跑。

Legacy 续接须创建新 Managed Session ID 并记录 migratedFrom。完整历史转换后续再核验 writer 封存、压缩/Tool Result 和能力兼容，不能原地热切换。

## 3. 协议与恢复

| 边界 | HTML 目标契约 |
| --- | --- |
| 浏览器 → Java | 产品 `/sessions`、Prompt、Cancel、Events；不直连 Harness/Runtime |
| Java → qwen serve | 复用 `/session`、Prompt、Cancel、Resume、`/events` 等 daemon 契约 |
| Harness → Java Broker | `JavaBrokerManagedRuntimeProvider` 调用 `/internal/agent-runtime/v1/{prepare,manifest,execute,cancel,release}` |
| Java → Runtime | `/healthz`、`/v1/prepare`、manifest、executions/query/events/cancel、release；HTTP 与 SSE 均由 Java 发起 |
| 公共 Agent API | 阶段 D 在 Java 提供 Agent/Session/Event/Turn/Item，公共 ID 与内部进程/Runtime ID 解耦 |

上表是目标接口。现有代码使用 `/internal/runtime-broker/v1/*` 等路径，必须按[接口差异表](managed-agent-java-hosted-runtime.md#17-实现快照与待对齐项)适配和验收后才称为对齐。

稳定 executionCallId 用于查询原调用与幂等；started 后失联且无法证明终态时进入 recovery_blocked，禁止换 Runtime 重放。取消 ACK 不证明工具或进程树已停止；有未决副作用或未转存 Artifact 唯一副本时不能释放资源。

公共事件使用 eventSequence / Last-Event-ID；Items/Turns 从权威记录投影。旧实验 `/managed/sessions*` 不升级为公共 API，待 Java 覆盖 admission、事件、查询和幂等后退役；普通 `/session + executionEngines` 保留。

## 4. A～H 实施顺序

| 阶段 | 做什么 | 怎么做 |
| --- | --- | --- |
| A | 冻结协议和基线 | 资源/状态/trace identity，TTFT、Pod 启动和前三轮 Tool 分布 |
| B | 双引擎正式接线 | 同 Bridge 的 Legacy/Managed、持久 owner、兼容 selector、指定流量 |
| C | Java 内嵌 Runtime Broker | Binding、Execution Ledger、租约和 Java→Runtime HTTP/SSE，不单独部署 |
| D | Public Agent API MVP | Agent/Session/Event/Turn/Item、AgentBundle revision、公共投影、实验 API 退役 |
| E | Hosted Harness | Java Pod + qwen serve Sidecar；推理/provisioning 并行；禁止本地 Tool fallback |
| F | 可靠性与故障注入 | ACK/SSE/started 断线、三端崩溃、Cancel 竞争、Artifact 失败 |
| G | Session Authority 外置 | 共享事件/checkpoint、可替换 Harness、activation epoch/fencing、取消粘性 |
| H | 扩大 Managed 范围 | Built-in Tools、Skills、MCP、Hooks、Media、Channels、Scheduled Tasks、Worktree、历史操作逐项迁移 |

完整完成门槛见[实施与验收](managed-agent-java-hosted-runtime.md#15-ah-实施顺序)。P0～P9a、D1～D5、R1～R5/F1～F8 只作历史切片索引；C01～C18 继续覆盖完整能力面，并映射至 A～H。

## 5. 专项技术文档

| 专项 | 如何使用 |
| --- | --- |
| [全量能力覆盖 C01～C18](managed-agent-full-design.md) | A～H 对应、能力范围和专项验收索引 |
| [Session / Harness / Runtime](managed-agent-session-harness-runtime.md) | 三层职责、单一执行权威、checkpoint 与阶段 G 接管 |
| [执行引擎选择与持久化](managed-session-execution-engine.md) | 阶段 B 的 selector、同 Bridge 双引擎、sticky owner |
| [Session 存储](managed-agent-session-storage.md) | 本地权威日志、writer、公共投影与共享存储的边界 |
| [Session 兼容](managed-agent-session-compatibility.md) / [方法映射](managed-agent-session-method-map.md) | 复用 daemon 契约及原调用者审计 |
| [完整 Harness](managed-agent-harness.md) | TS Agent 装配、逻辑 handle、安全点与恢复范围 |
| [私有协议](managed-agent-control-protocol.md) | Java/daemon/Broker/Runtime 边界、fencing、原调用恢复 |
| [coordinator](managed-agent-coordinator.md) | daemon 执行协调与 Java Broker 资源协调的职责 |
| [客户端与事件](managed-agent-client-surfaces.md) | 产品 REST/SSE、公共投影与内部游标映射 |
| [恢复与运行](managed-agent-recovery-operations.md) | F/G 故障、物理回执、平台和容量验收 |
| [Runtime invocation v2](managed-agent-runtime-invocations.md) | 复用工具身份、权限、执行回执和取消语义 |
| [配置与扩展](managed-agent-config-extensions.md) | AgentBundle、MCP/Skills/Hooks 版本和执行归属 |
| [全部工具与文件历史](managed-agent-tools-history.md) | 工具族、Artifact、备份、撤销、迁移 |
| [子作用域](managed-agent-child-scopes.md) / [自动任务](managed-agent-automation.md) | 扩展范围的持久准入、调度、交付与父子关系 |
| [搜索](managed-agent-search-tools.md) / [Grep](managed-agent-grep-tools.md) / [Notebook](managed-agent-notebook-tools.md) / [媒体](managed-agent-media.md) | 局部工具能力与有限验收，不能外推全部阶段完成 |

## 6. 历史设计与证据

历史生产源码锚点为 [a836081466](https://github.com/doudouOUC/qwen-code/commit/a8360814668b3dfdff72ad3d99cbcaf26dd009a9)，历史文档提交为 [32543e5273](https://github.com/doudouOUC/qwen-code/commit/32543e527348bc5400641267933d3da9d5f0313b)。它们不代表 QwenLM/qwen-code main 已具备相同能力，也不作为本次 HTML 对齐的完整实现证明。

| 阶段 / 记录 | 内容 |
| --- | --- |
| [P0](managed-agent-runtime-p0.md) / [P1](managed-agent-activation-p1.md) / [P2](managed-agent-prompt-admission-p2.md) | Runtime、activation/lease、Prompt admission |
| [P3](managed-agent-live-prompt-p3.md) / [P4](managed-agent-gateway-bootstrap-p4.md) / [P5](managed-agent-multi-turn-p5.md) | live Prompt、已淘汰的非权威 bootstrap、多轮绑定 |
| [P6](managed-agent-tool-runtime-p6.md) / [P7](managed-agent-eager-authoritative-p7.md) / [P8](managed-agent-remote-runtime-p8.md) | Tool-only、权威模型立即开始、远程协议 |
| [P8 会话展示](managed-agent-session-surfaces.md) / [P9a](managed-agent-local-runtime-activation-p9a.md) | 实验 Managed UI、Local Managed 的激活与生命周期证据 |
| [daemon 总方案](managed-agent-daemon-default.md) / [R1～R5 计划](managed-agent-daemon-default-plan.md) | B/G/H 可复用的能力与接缝；阶段顺序以 A～H 为准 |
| [daemon 历史调查](managed-agent-daemon-default-history.md) | 原有调查、失败和验收全文 |
| [原 README](managed-agent-readme-history.md) | P0～P9a 摘要、实验命令、数据与测试限制 |
| [原 Java 产品方案](managed-agent-java-hosted-runtime-history.md) | 已替换的 M0～M8/Provider 路线及当时的实现记录 |

HTML 原文只作为方案基准；已有代码、定向测试、本地进程 E2E、真实产品 E2E 和生产灰度分别记录。本次未重跑历史测试，后续按目标契约逐项补齐证据。
