# daemon/serve（Mode B）路线图、覆盖矩阵与当前缺口

> 以 [#3803](https://github.com/QwenLM/qwen-code/issues/3803)（设计提案 + 6 章设计系列）与 [#4175](https://github.com/QwenLM/qwen-code/issues/4175)（F1-F5 wave 计划）为 spec，盘点已建设 / 已文档化 / 仍缺失。
>
> 核对基准：本文原始矩阵在 **2026-05-31** 用 `gh pr view` / `gh issue view` 实测；2026-06-16 已回填 #4490 mainline 合入与 #5144 daemon docs refresh。状态图例：✅ merged、🔧 open/in-progress、⏳ pending（roadmap 无实现）、🅿️ parked、❌ closed/dropped/superseded。**分支后缀**标注 `→main`（已落 main）或 `→dmbm`（仅落集成分支 `daemon_mode_b_main`，尚未进 main）。
>
> **⚠️ 注意**：除 #4490/#5144 状态回填外，本文仍以 2026-05-31 的路线图矩阵为骨架；6 月新增端点和补强（如 #4820 rewind、#4822 hooks、#4826 /directory ACP、#4819 /remember ACP 等）需结合 [08-extension-endpoints.md](08-extension-endpoints.md) 和周报阅读。

---

## 0. 一句话结论（最重要的核对结果）

**截至 2026-06-16，5 月 31 日的头号交付缺口已经关闭：[#4490](https://github.com/QwenLM/qwen-code/pull/4490) 已于 2026-06-11 合入 main。** 它把 daemon_mode feature batch 反向集成到 main，覆盖 ACP bridge、MCP transport pool、多客户端权限协调、daemon server 扩展端点、WebUI/SDK、telemetry 和 F5 alpha docs 等 487 个文件（GitHub 当前统计 +148639/-16017）。

因此，本文后续矩阵中大量 `→dmbm` 结论是**原始 2026-05-31 状态**，不再代表 mainline 交付状态。#5144（2026-06-15 merged）随后刷新 upstream daemon developer docs，并按当前 main 重新核对 daemon event schema、serve capabilities、startup flags、error taxonomy、resync behavior、MCP pool behavior 和 web UI wording。

#7019（2026-07-16 open）又把 multi-workspace hardening 文档作为当前口径补齐：一个 daemon 可管理多个 isolated workspace runtime，第一项 workspace 是 primary / legacy default；后续 route 和 capability 应按 process-global、legacy-primary、workspace-qualified、live-session-owner、persisted-workspace 五类 ownership 判断，不再沿用本文早期“1 daemon = 1 workspace”的设计前提。

---

## 1. 设计与路线图来源

### 1.1 #3803 的 6 章设计系列（§01-§06）

设计系列托管在 `wenshao/codeagents` 仓库 `docs/comparison/qwen-code-daemon-design/`，是 **source of truth**；#3803 仅做实现追踪。各章一句话覆盖：

| 章 | 文件 | 覆盖 |
|---|---|---|
| §01 Overview | `01-overview.md` | TL;DR + 两层术语 + 架构图 + 资源经济学 + stage 进度。 |
| §02 Architectural Decisions | `02-architectural-decisions.md` | 7 条核心决策（修正：MCP per-session 生命周期；Mode A → parking lot）。 |
| §03 HTTP API & Protocol | `03-http-api.md` | 路由表 + ACP wire 4 层兼容矩阵 + SSE + Last-Event-ID + reverse-RPC 异步 + 能力协商 + **additive 兼容原则**。 |
| §04 Deployment & Client | `04-deployment-and-client.md` | Mode B 客户端收敛 + TUI/channels/web/IDE adapter 边界 + remote-control deferred + 多客户端协作 + **runtime locality / environment contract（§五，commit `36c9927`）**。 |
| §06 Roadmap & Ecosystem | `06-roadmap.md` | 时间线 + Stage 1.5（Mode B 优先）+ client adapters + remote-control + 7 工程原则 + Stage 2 + External Reference Architecture + #4175 25-PR Wave breakdown。 |


### 1.2 #4175 的 F1-F5 wave 计划

[#4175](https://github.com/QwenLM/qwen-code/issues/4175)（@doudouOUC，OPEN）是 Mode B v0.16 production-ready 的**权威 25-PR rollout 计划**。其 Wave 1-6 已**整合为 5 个 feature-cohesive PR（F1-F5）**（2026-05-19 maintainer guidance：小 PR 太多，改为 feature 批量并入集成分支）。关键依赖链：

```
capability registry → DaemonSessionClient → typed events
  → daemon-stamped clientId → session-scoped permission
  → mutation-gating helper → control-plane mutation routes
  → bridge extraction → real MCP pool + full PermissionMediator
```

本仓子文档（[README](README.md) + [01](01-http-server-and-middleware.md)–[08](08-extension-endpoints.md)）做**函数/行级深入**；本文是 roadmap 视角的**覆盖矩阵与缺口盘点**。

---

## 2. 双部署模式

| Mode | 命令 | TUI | 定位 | 优先级 | 状态 |
|---|---|:--:|---|:--:|---|
| **Mode B** headless daemon | `qwen serve [--port N]` | ❌ | server / container / K8s pod / 统一客户端 runtime | **P0 mainline** | 🔧 主体在 `daemon_mode_b_main`，Stage 1 + Wave 1-4 已 →main |
| **Mode A** CLI + HttpServer | `qwen --serve [--port N]` | ✅ local | 本机 TUI 超级客户端 + 远程客户端共享同一 daemon | **P2 parking lot** | 🅿️ parked，仅 A1 落地 |

两模式共享同一 wire 协议（Express 5 + ACP NDJSON over HTTP+SSE）。**Mode B 优先（2026-05-15 决策）**：Mode A 价值依赖 1.5c daemon-side state CRUD（否则 Mode A 下远程客户端仍是 thin shell），故先 ship Mode B 契约。

### Mode A 缺口（#4156 三阶段计划，OPEN）

[#4156](https://github.com/QwenLM/qwen-code/issues/4156)（@doudouOUC，**OPEN**）= Stage 1.5b 三阶段计划：

- **Phase A — loopback-only 最小骨架**（A0/A1/A2/A3 stacked）：
  - ✅ **A1** 抽 `createInMemoryChannel` helper — **[#4160](https://github.com/QwenLM/qwen-code/pull/4160) MERGED →main**（2026-05-15，作为可复用原语保留，即便其余 Mode A 工作 parked）。
  - ⏳ **A2** 新 `inProcessAcpBridge.ts`（~200 LOC，实现 `HttpAcpBridge` 接口）— pending。
  - ⏳ **A3** `gemini.tsx` `--serve` flag 集成（lazy import / boot path / default port 0）— pending。
- ⏳ **Phase B** — remote bind + auth/CORS defaults（~1d）— pending。
- ⏳ **Phase C** — lifecycle coordination（~1d）— pending。

**为何 parked**：Mode A 价值 = "本机 TUI 超级客户端 + 远程客户端共享同一 daemon"。缺 1.5c 则远程客户端仍是 thin shell；缺 1.5-prereq typed event contract 则 TUI adapter 无共享 reducer 可消费。先 ship Mode B 契约 → Mode A 再 revisit。

---

## 3. 阶段与 wave 全景（带状态）

### 3.1 已奠基阶段

| 阶段 | 描述 | 状态 | PR |
|---|---|---|---|
| `createInMemoryChannel` 原语 | 配对 NDJSON channel helper | ✅ →main | [#4160](https://github.com/QwenLM/qwen-code/pull/4160) |

### 3.2 P0 — Stage 1.5a 9 must-haves + per-session permission routing

#3803 列的 9 must-haves，已在 #4175 Wave 1-2.5 落地（全部 →main）：

| # | must-have | 状态 | PR | 落点 |
|---|---|---|---|---|
| #1 | per-request `sessionScope` override | ✅ | [#4209](https://github.com/QwenLM/qwen-code/pull/4209) + #4214 | →main |
| #2 | `loadSession` / `resume` HTTP（★最大痛点）| ✅ | [#4222](https://github.com/QwenLM/qwen-code/pull/4222) | →main |
| #4 | client heartbeat | ✅ | [#4235](https://github.com/QwenLM/qwen-code/pull/4235) | →main |
| #6 | per-session 可配 replay ring | ✅ | [#4237](https://github.com/QwenLM/qwen-code/pull/4237) | →main |
| #7 | `slow_client_warning` 事件 | ✅ | [#4237](https://github.com/QwenLM/qwen-code/pull/4237) | →main |
| #8 | `_meta` per-session 上下文 push + close/delete | ✅(close/delete) / ❌(`_meta`) | [#4240](https://github.com/QwenLM/qwen-code/pull/4240)；`_meta` 见 [#4516](https://github.com/QwenLM/qwen-code/pull/4516) **CLOSED 未合入** | →main |
| #9 | `/capabilities` 真协商 + protocol_versions | ✅ | [#4191](https://github.com/QwenLM/qwen-code/pull/4191) | →main |
| #10 | durability 文档 | ✅ | commit `bbc7b8b6` | →main |

### 3.3 P0 — Stage 1.5c daemon-side state CRUD（control-plane parity，10+ 路由）

| 路由 | 状态 | PR | 落点 |
|---|---|---|---|
| `GET/POST /workspace/memory` | ✅ | [#4249](https://github.com/QwenLM/qwen-code/pull/4249) | →main |
| `GET/POST/DELETE /workspace/agents[/:agentType]` | ✅ | [#4249](https://github.com/QwenLM/qwen-code/pull/4249) | →main |
| `POST /workspace/tools/:name/enable` | ✅ | [#4282](https://github.com/QwenLM/qwen-code/pull/4282) | →main |
| `POST /session/:id/approval-mode` | ✅ | [#4282](https://github.com/QwenLM/qwen-code/pull/4282) | →main |
| `POST /workspace/init` | ✅ | [#4282](https://github.com/QwenLM/qwen-code/pull/4282) | →main |
| `POST /workspace/mcp/:server/restart` | ✅ | [#4282](https://github.com/QwenLM/qwen-code/pull/4282) | →main |
| `GET /workspace/{mcp,skills,providers}` + `GET /session/:id/{context,supported-commands}` | ✅ | [#4241](https://github.com/QwenLM/qwen-code/pull/4241) | →main |
| `GET /workspace/{env,preflight}` 诊断（closed errorKind 分类）| ✅ | [#4251](https://github.com/QwenLM/qwen-code/pull/4251) | →main |
| `POST /workspace/auth/device-flow`（OAuth 2.0 Device Grant，4 路由）| ✅ | [#4255](https://github.com/QwenLM/qwen-code/pull/4255) + [#4291](https://github.com/QwenLM/qwen-code/pull/4291) | →main |
| `POST /workspace/mcp/servers` / `DELETE /workspace/mcp/servers/:name`（运行时增删，T2.8）| ✅ | [#4552](https://github.com/QwenLM/qwen-code/pull/4552) | →dmbm |

### 3.4 P1 — Stage 1.5-prereq typed contract & bridge primitives

| 项 | 状态 | PR | 落点 |
|---|---|---|---|
| acp-bridge 骨架 + EventBus/inMemoryChannel/AcpChannel/PermissionMediator 类型桩（22a）| ✅ | [#4295](https://github.com/QwenLM/qwen-code/pull/4295) | →main |
| status/paths/errors/bridgeTypes 抬升（22b/1）| ✅ | [#4298](https://github.com/QwenLM/qwen-code/pull/4298) | →main |
| `BridgeOptions` + `DaemonStatusProvider` seam（22b/2）| ✅ | [#4304](https://github.com/QwenLM/qwen-code/pull/4304) | →main |
| typed errors（channel-closed / missing-cli-entry）| ✅ | [#4300](https://github.com/QwenLM/qwen-code/pull/4300) | →main |
| **F4-prereq 协议补全**（`serverTimestamp` / `provenance` / `errorKind` / `state_resync_required`）| ✅ | [#4360](https://github.com/QwenLM/qwen-code/pull/4360) | →dmbm |

> 说明：typed event schema、reducer、normalizer 等 **SDK 层**已经落地（部分 →main、F4-prereq →dmbm）。但 #3803 列的 `FileSystemService` / `Capability registry per-session` / `Output sinks` 等 prereq 项，部分以 daemon 侧形态落地（FileSystemService 见 #4250、capability registry 见 #4191），`Output sinks`（PR 25 OutputSink lift）⏳ **未实现**（CLI-internal cleanup，低优先级）。

### 3.5 F1-F5 feature-cohesive 计划（全部 →dmbm，尚未 →main）

| Feature | 状态 | PR | 说明 |
|---|---|---|---|
| **F1** acp-bridge 包自足 | ✅ →dmbm | [#4319](https://github.com/QwenLM/qwen-code/pull/4319) + [#4334](https://github.com/QwenLM/qwen-code/pull/4334) + [#4445](https://github.com/QwenLM/qwen-code/pull/4445) | bridge 核心整体 lift；`httpAcpBridge.ts` 缩 4682→97 行 shim；6861 行测试抬升。 |
| **F2** 共享 MCP 传输池 | ✅ →dmbm | [#4336](https://github.com/QwenLM/qwen-code/pull/4336) + [#4411](https://github.com/QwenLM/qwen-code/pull/4411) + [#4460](https://github.com/QwenLM/qwen-code/pull/4460) | workspace 级 `McpTransportPool`，`(name,fingerprint)` keyed；168 review threads。 |
| **F3** 多客户端权限协调 | ✅ →dmbm | [#4335](https://github.com/QwenLM/qwen-code/pull/4335) | 4 策略 `MultiClientPermissionMediator` + audit ring + `permission_partial_vote`/`permission_forbidden`。**pair-token revocation 仍 out-of-scope**。 |
| **F4** 非浏览器 ACP 客户端 daemon-native 体验 | ⏳ pending | （sub-scope TBD）| 浏览器被砍；候选 `qwen --connect` / IDE daemon-native / channel demo / Phase-1 scale instrumentation。**未实现**。 |
| **F5** 生产发布链 | 🔧 部分 →dmbm | [#4473](https://github.com/QwenLM/qwen-code/pull/4473)(PR27) + [#4483](https://github.com/QwenLM/qwen-code/pull/4483)(PR30a)；PR28 npm / PR31 cut 待启 | alpha 文档 + 本机部署模板已合；npm publish + v0.16-alpha.0 cut ⏳。PR29/PR30b deferred 到 v0.16.x。 |

### 3.6 Stage 2（2a-2e，逐项核对）

| 子阶段 | 项 | 状态 | 实测/PR |
|---|---|---|---|
| | `/health?deep=1` | ✅(浅) →main | server.ts 已有 `deep`，但只读 Map-size getter（`sessionCount`/`pendingPermissionCount`），非真实 liveness（见 [README](README.md) §7 已知限制）。 |
| | `POST /ext/:method` | ⏳ pending | serve 源**未实现**（实测 absent）。 |
| | Reverse-RPC 5 类 Client Capability（editor/clipboard/browser/notification/file_picker）| ⏳ pending | 仅 §04 设计；runtime-locality 更新澄清其为"显式委派 client-local 资源"，**未实现**。 |
| **2b** 生态 | OpenAPI codegen | ⏳ pending | 无 PR。 |
| | multi-token | ⏳ pending | 属 PR29 production token defaults，**deferred 到 v0.16.x**。 |
| | `HttpTransport` SDK adapter | 🔧 部分 | `DaemonClient`/`DaemonSessionClient`（HTTP/SSE over fetch）已存在；可插拔 `HttpTransport` 抽象 ⏳ 未抽。 |
| **2c** 可观测 | Prometheus metrics | ⏳ pending | 无 PR。 |
| | mDNS | ⏳ pending | 无 PR。 |
| | `--max-sessions` guard rail | ✅ →main | runQwenServe.ts 已实现（超限 `503 session_limit_exceeded` + `Retry-After`）。 |
| | （额外）daemon 文件 logger | ✅ →dmbm | [#4559](https://github.com/QwenLM/qwen-code/pull/4559)（关闭 issue [#4548](https://github.com/QwenLM/qwen-code/issues/4548)）+ request 级日志 [#4606](https://github.com/QwenLM/qwen-code/pull/4606)。 |
| | （额外）OpenTelemetry daemon e2e | 🔧 部分 | tool spans + session.id [#4630](https://github.com/QwenLM/qwen-code/pull/4630) →dmbm；全链路 issue [#4554](https://github.com/QwenLM/qwen-code/issues/4554) **OPEN**。 |
| | perf eval + docs | ⏳ pending | harness 已在，正式评测/调优未做。 |
| **2e** native in-process | 去掉 `qwen --acp` child | ⏳ pending | 仍 spawn ACP 子进程；`acpAgent.ts` `loadSettings(cwd)` 跨 workspace 污染未解。**未实现**。 |

---

## 4. 覆盖矩阵：roadmap 项 → 实现 PR → 本仓子文档

> "本仓子文档"列指 [01](01-http-server-and-middleware.md)–[08](08-extension-endpoints.md)；标「未文档化」= 已实现但 01-08 未做深入覆盖（仅 README 路由表一笔带过或完全缺）。

| roadmap 能力 | 状态 | 实现 PR | 本仓子文档 |
|---|---|---|---|
| `--allow-origin` CORS allowlist | ✅ →dmbm | [#4527](https://github.com/QwenLM/qwen-code/pull/4527) | [01](01-http-server-and-middleware.md) §CORS |
| 协议帧 serverTimestamp/provenance/errorKind | ✅ →dmbm | [#4360](https://github.com/QwenLM/qwen-code/pull/4360) | [02](02-sse-event-bus.md) / [04](04-capabilities-and-protocol.md) |
| 会话 spawn/attach/close/delete + sessionScope | ✅ →main | #4209 / #4240 | [03](03-session-lifecycle.md) |
| heartbeat + load/resume | ✅ →main | #4235 / #4222 | [03](03-session-lifecycle.md) |
| capability registry + protocol versions | ✅ →main | [#4191](https://github.com/QwenLM/qwen-code/pull/4191) | [04](04-capabilities-and-protocol.md) |
| WorkspaceFileSystem 边界 + 文件读写/edit CAS | ✅ →main | #4250 / #4269 / #4280 | [05](05-workspace-files-and-fs-boundary.md) |
| prompt deadline + SSE writer-idle timeout | ✅ →dmbm | [#4530](https://github.com/QwenLM/qwen-code/pull/4530) | [01](01-http-server-and-middleware.md) / [02](02-sse-event-bus.md) |
| MCP per-session 守卫（budget + push 事件 + 迟滞）| ✅ →main | #4247 / #4271 | [06](06-mcp-guardrails-and-pool.md) |
| MCP workspace 级共享传输池（F2）| ✅ →dmbm | [#4336](https://github.com/QwenLM/qwen-code/pull/4336) | [06](06-mcp-guardrails-and-pool.md) |
| 运行时 MCP server 增删（T2.8）| ✅ →dmbm | [#4552](https://github.com/QwenLM/qwen-code/pull/4552) | [06](06-mcp-guardrails-and-pool.md) |
| acp-bridge 抽包 seam（F1）| ✅ →dmbm | #4295/#4298/#4304/#4319/#4334/#4445 | [07](07-acp-bridge-and-permission.md) |
| 4 策略多客户端权限仲裁（F3）| ✅ →dmbm | [#4335](https://github.com/QwenLM/qwen-code/pull/4335) | [07](07-acp-bridge-and-permission.md) |
| 扩展端点 recap/btw/shell/tasks/stats/rewind/hooks/extensions/settings + daemon logger | ✅ →dmbm | #4504/#4610/#4576/#4578/#4559/#4606/#4816/#4820/#4822/#4832 | [08](08-extension-endpoints.md) |
| **read-only 状态路由**（`/workspace/{mcp,skills,providers,extensions,hooks}` + `/session/:id/{context,context-usage,supported-commands,tasks,stats,hooks}`）| ✅ →main/→dmbm | [#4241](https://github.com/QwenLM/qwen-code/pull/4241) + follow-ups #4515/#4822/#4832 | [01](01-http-server-and-middleware.md) 路由表 + [04](04-capabilities-and-protocol.md) 覆盖矩阵 + [08](08-extension-endpoints.md) |
| **preflight/env 诊断路由** + closed errorKind 分类 | ✅ →main | [#4251](https://github.com/QwenLM/qwen-code/pull/4251) | ⚠️ **未文档化** |
| **workspace memory/agents CRUD + generate** | ✅ →main/→dmbm | [#4249](https://github.com/QwenLM/qwen-code/pull/4249) + follow-up `workspace_agent_generate` | ⚠️ **部分未文档化**（01/04 提及，缺少单独 CRUD 深入）|
| **OAuth 2.0 Device Grant 鉴权子系统**（DeviceFlowRegistry / BrandedSecret）| ✅ →main | #4255 / #4291 | ⚠️ **未文档化**（01 只讲 5 道闸，未讲 device-flow 路由）|
| **daemon telemetry（tool spans + session.id）**| ✅ →dmbm | [#4630](https://github.com/QwenLM/qwen-code/pull/4630) | ⚠️ 交叉到 telemetry 方案，01-08 未覆盖 |
| Mode A `qwen --serve` | 🅿️ parked | #4156（A1=#4160 ✅）| 未文档化（roadmap parked）|
| Stage 2a 余下 / 2b / 2c Prometheus·mDNS / 2e | ⏳ pending | 无 PR | — |

---

## 5. 当前缺口（未实现 或 已实现未文档化）

### 5.1 已关闭的交付缺口：F1-F5 整批进入 main（#4490）

原始 2026-05-31 结论是：F1/F2/F3/F4-prereq/F5/扩展端点/Stage-2 partial 全部只在 `daemon_mode_b_main`，#4490 仍 OPEN / DRAFT / CONFLICTING，因此属于"已实现但未交付"的最大缺口。

2026-06-11 该缺口已由 [#4490](https://github.com/QwenLM/qwen-code/pull/4490) 关闭：daemon_mode_b_main → main feature batch 已合入 main。后续关注点从"是否进 main"转为"main 上的文档、测试、发布和实现面是否继续同步"。#5144 已在文档侧做了一轮英文 daemon developer docs refresh 和源码引用核对。

### 5.2 Mode A 余下（#4156，parked）

`A0`（`validateAndCanonicalizeWorkspace` 抽取）/ `A2`（`inProcessAcpBridge.ts`）/ `A3`（`gemini.tsx --serve` flag）+ Phase B（remote bind/auth/CORS）+ Phase C（lifecycle coordination）全部 ⏳ pending；仅 A1（[#4160](https://github.com/QwenLM/qwen-code/pull/4160)）✅。等 Mode B 契约稳定后 revisit。

### 5.3 客户端适配器 onboarding（behind flag）当前状态

- **F4 具体 sub-scope 仍 TBD**（`qwen --connect` / IDE daemon-native / channel demo / scale instrumentation 都 ⏳ 未实现）。

### 5.7 Stage 2 逐项缺口（gh 核对：均无已合 PR，除下列）

- **2b**：OpenAPI codegen ⏳ / multi-token ⏳（PR29 deferred）/ `HttpTransport` SDK adapter 🔧 部分（具体 client 有，抽象 transport 未抽）。**均无已合 PR**。
- **2c**：Prometheus ⏳ / mDNS ⏳（**均无 PR**）；`--max-sessions` ✅ 已实现（→main）；daemon 文件 logger ✅（[#4559](https://github.com/QwenLM/qwen-code/pull/4559) →dmbm）/ request 日志 ✅（[#4606](https://github.com/QwenLM/qwen-code/pull/4606)）/ OTel daemon e2e 🔧（[#4630](https://github.com/QwenLM/qwen-code/pull/4630) 部分，issue [#4554](https://github.com/QwenLM/qwen-code/issues/4554) OPEN）。
- **2d**：perf harness ✅（[#4205](https://github.com/QwenLM/qwen-code/pull/4205) →main）；正式 perf eval + docs ⏳。
- **2e**：native in-process（去 `qwen --acp` child）⏳ **未实现**。

### 5.8 已实现但本仓 01-08 未覆盖（文档缺口）

逐条对照 §4 矩阵的 ⚠️ 项，**已合并（→main 或 →dmbm）但 01-08 未深入**：

1. **read-only 状态路由**（[#4241](https://github.com/QwenLM/qwen-code/pull/4241)，→main）—— 01 路由表提及，无专章讲 redaction / idle placeholder / protocol-versioned payload。
2. **preflight/env 诊断路由 + closed errorKind 分类**（[#4251](https://github.com/QwenLM/qwen-code/pull/4251)，→main）—— 完全未文档化。
3. **workspace memory/agents CRUD**（[#4249](https://github.com/QwenLM/qwen-code/pull/4249)，→main）—— control-plane state CRUD 无专章。
4. **OAuth 2.0 Device Grant 鉴权子系统**（#4255/#4291，→main）—— 01 只讲 5 道闸，未讲 `/workspace/auth/device-flow` 4 路由 / DeviceFlowRegistry / BrandedSecret。
6. **daemon telemetry tool spans + session.id**（[#4630](https://github.com/QwenLM/qwen-code/pull/4630)，→dmbm）—— 交叉到 telemetry 方案，01-08 未覆盖。

> 注：sessionScope / heartbeat / load-resume / close-delete / SSE 背压 / MCP 池 / FS 边界 / acp-bridge 抽包 / 4 策略权限 / 扩展端点等**核心子系统均已被 01-08 深入覆盖**——文档缺口集中在 **control-plane state CRUD（1.5c 那批 read-only + memory/agents + device-flow + 诊断）** 与 **`/acp` Streamable HTTP + daemon-ui 库**两块。

---

## 6. v0.16-alpha 范围决策

**2026-05-24 scope freeze**：v0.16-alpha = **text-only + local-only deployment**。

- **In scope（F5 text-only flavor，4 PR）**：PR27 alpha docs（[#4473](https://github.com/QwenLM/qwen-code/pull/4473) ✅）+ PR28 npm publish scaffolding（待启）+ PR30a 本机启动模板（[#4483](https://github.com/QwenLM/qwen-code/pull/4483) ✅ systemd/launchd/tmux/nohup）+ PR31 v0.16-alpha.0 cut（待启）。**净服务端代码 ≈ 0**（仅 PR27 ~10 LOC SDK `QWEN_SERVER_TOKEN` env fallback 是真代码）。
- **browser / webui 作为 daemon-hosted 被砍 → 独立发布**：daemon 不 host `/web`；`@qwen-code/webui` 独立 npm 包（见 §5.4）。publish list（2026-05-24 frozen）：`@qwen-code/qwen-code` + `-core` + `@qwen-code/sdk`(0.1.7→0.2.0) + `@qwen-code/webui`；**`@qwen-code/acp-bridge` 不发 npm**（保持 workspace-internal，避免过早锁 50+ semver export）。
- **explicitly deferred 到 v0.16.x**：PR29 production token defaults（auto-gen/instance-path keying/stale cleanup）、PR30b 容器化部署 refs（Docker/k8s/nginx+TLS）、`--max-body-size` CLI flag、#4330 SDK/server MCP-restart timeout compat、W133-c `PoolEvent.source` discriminator——理由统一：**无真实 consumer 场景就 defer，否则文档/代码会因无人验证而腐烂**。

---

## 7. 工程原则与集成分支策略

### 7.1 #3803 的 7 条迁移原则（每个 PR 必须满足）

Stage 1.5 是**增量迁移，非大重写**：

1. **独立可合并**（Independently mergeable）—— 每 PR 自含测试，合后 main 仍可发布。
2. **向后兼容**（Backward compatible）—— 不删既有路由/事件字段/CLI 行为；新字段 additive + optional。
3. **默认关**（Default off）—— TUI/channels/IDE 走 flag 或 dual-stack adapter，默认保留旧路径直至验证通过。
4. **不破坏 `qwen serve`**（unbroken）—— Stage 1 路由/SDK 行为保留，新能力经 `/capabilities` feature tag 暴露。
5. **渐进迁移**（Gradual migration）—— P0/CRUD/typed contract 可并行；client adapter 先 flag 后默认切。
6. **可逆**（Reversible）—— 每个 client adapter 可独立禁用，不影响其他客户端或 daemon。
7. **测试先行**（Tests-first）—— 新契约有 unit test，client adapter 有 smoke/e2e，旧路径有回归测试。

### 7.2 集成分支策略（`daemon_mode_b_main` ↔ `main`）

2026-05-19 maintainer guidance：Mode B feature PR **不再逐个直合 main**，而是合入长生命周期集成分支 [`daemon_mode_b_main`](https://github.com/QwenLM/qwen-code/tree/daemon_mode_b_main)（2026-05-19 从 `origin/main@68e3ec988` 建），再**周期性 feature-cohesive 批量反向并入 main**。

- **反向集成合并 [#4490](https://github.com/QwenLM/qwen-code/pull/4490)**：`daemon_mode_b_main → main`，2026-06-11 **MERGED**。该 batch 汇总 ACP bridge、MCP transport pool、多客户端权限协调、daemon server、WebUI/SDK、telemetry 和 docs 等 feature 面；GitHub 当前统计 487 files / +148639−16017。merge 后文档口径由 #5144 再次按当前 main 校正。
- **周期 sync `main → daemon_mode_b_main`**：[#4469](https://github.com/QwenLM/qwen-code/pull/4469)（2026-05-24 ✅）+ [#4500](https://github.com/QwenLM/qwen-code/pull/4500)（2026-05-25 ✅），把 main 的独立提交（worktree/Auto mode/telemetry/v0.16.x 等）折回集成分支，解 import-block 冲突。
- **pre-F1 housekeeping**：[#4305](https://github.com/QwenLM/qwen-code/pull/4305) + [#4297](https://github.com/QwenLM/qwen-code/pull/4297) ✅（从 main re-target 到 dmbm，保留 review threads）。

> 历史症结：#4490 DRAFT 期间，集成分支与 main 持续分叉，每次 ready 前都要追加 sync PR 清冲突。这放大了"大批量反向合并"的 review 与回归负担。该合并已完成，但"大 batch 回归面"仍是后续维护风险。

---

## 附:本文引用 PR/issue 状态速查（2026-05-31 gh 实测）

| 编号 | 类型 | 状态 | base/落点 |
|---|---|---|---|
| #4236 #4249 #4250 #4255 #4269 #4280 #4282 #4291 | PR | ✅ MERGED | main（Wave 4）|
| #4295 #4298 #4300 #4304 | PR | ✅ MERGED | main（acp-bridge 骨架 22a/22b）|
| #4319 #4334 #4445 | PR | ✅ MERGED | daemon_mode_b_main（F1）|
| #4336 #4411 #4460 | PR | ✅ MERGED | daemon_mode_b_main（F2）|
| #4335 | PR | ✅ MERGED | daemon_mode_b_main（F3）|
| #4360 | PR | ✅ MERGED | daemon_mode_b_main（F4-prereq）|
| #4473 #4483 | PR | ✅ MERGED | daemon_mode_b_main（F5 partial）|
| #4469 #4500 | PR | ✅ MERGED | daemon_mode_b_main（sync main→dmbm）|
| #4490 | PR | ✅ MERGED 2026-06-11 | base main（反向集成）|
| #4412 | PR | ✅ MERGED | daemon deep-dive docs 初版 |
| #5144 | PR | ✅ MERGED 2026-06-15 | daemon developer docs English refresh + main 实现面核对 |
| #4563 | PR | ✅ MERGED | #4563 base dmbm(DaemonWorkspaceService refactor，06-06 合入)|
| #4516 | PR | ❌ CLOSED 未合入 | dmbm（compress/_meta 砍了）|
| #4515 / #6297 / #6844 | PR | ✅ 后续落地 | 原 stats/export PR 未合入；stats 后续已落地，primary export 由 #6297 落地，workspace-qualified export 由 #6844 落地 |
| #4156 #4554 | issue | 🔧 OPEN | Mode A 3-phase；OTel daemon e2e |
| #4548 | issue | ✅ CLOSED | 由 #4559 实现 |
