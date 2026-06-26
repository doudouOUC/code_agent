# qwen-code feature 技术方案

按 **feature topic** 汇总 [QwenLM/qwen-code](https://github.com/QwenLM/qwen-code) 的重点 PR（2026-04 ~ 06），并结合代码整理的详细技术方案。每篇含：背景动机 / 整体架构 / 子系统详解（带 `file:symbol` 锚点）/ 关键流程（mermaid 时序图·调用链·状态机）/ 设计决策与权衡 / 涉及 PR / 已知限制。

> 配套：逐 PR 的描述↔实现一致性 + 正确性审查见 [`../weekly-report/`](../weekly-report/)。
> 说明：daemon/serve 主体已随 #4490 合入 `main`；少量子文档仍保留早期 `daemon_mode_b_main` 标注，阅读时以各文档顶部的适用范围和 PR 状态更新为准。

## 20 篇技术方案

> **daemon/serve** 与 **telemetry** 两块内容最多，已各自拆成文件夹（README 总览 + 多篇函数级深入子文档）；其余为单篇。

| 主题 | 文档 | 关键 PR | 一句话 |
|---|---|---|---|
| daemon/serve 模式 | [daemon-serve-mode/](daemon-serve-mode/) 📁 | epic #4175 / #3803（~47 PR） | Mode B：agent core 常驻 HTTP daemon，多客户端经 REST+SSE 并发附着，ACP bridge 解耦（README + 8 篇深入 + 09 路线图 + 10 客户端/SDK + 11 WebUI/传输） |
| telemetry 可观测性 | [telemetry-observability/](telemetry-observability/) 📁 | epic #3731 / #4384（~25 PR） | 层级 span 树 + 上下文传播 + OTLP 路由 + 敏感属性门控 + daemon 端到端追踪（README + 7 篇深入） |
| voice dictation | [voice-dictation.md](voice-dictation.md) | #5502 #5605 #5609 #5628 #5632 #5747 #5755 #5765 #5794 #5817 | CLI/Web Shell 语音听写：native/fallback 或浏览器采集 + daemon `/voice/stream` / workspace voice API + batch/realtime ASR + keyterms file + transcript refinement |
| Artifact 工具 | [artifact-tool.md](artifact-tool.md) | #5557 #5615 #5617 | opt-in HTML artifact 发布：本地 file URL 优先，可选 host/OSS publisher，带自包含校验、权限门控、托管提示与 auto-open 设置 |
| Workflow token budget / Dynamic Workflows | [workflow-token-budget.md](workflow-token-budget.md) | #5231 #5600 #5679 #5740 | Workflow per-run output-token 软预算 + saved workflows / resume / journal / snapshot / `/workflows` UI + snapshot prune 防穿越 |
| MCP resources / prompts | [mcp-resources-prompts.md](mcp-resources-prompts.md) | #5544 #5561 #5589 #5635 #5733 #5774 #5781 #5812 | 宽松发现 MCP prompts/resources，`ResourceRegistry` + `/mcp` resource browser + `@server:uri`/裸 `@` 补全注入 + model-callable resource read tool + live settings reconcile |
| loop wakeup | [loop-wakeup.md](loop-wakeup.md) | #5182 #5197 #5808 #5844 | prompt-only `/loop` 改成 self-paced wakeup，秒级单次唤醒 + 24h session budget + abort 清理 + monitor/background-task notification guidance |
| Channel adapters | [channel-adapters.md](channel-adapters.md) | #5202 #5414-#5417 | QQ Bot channel adapter + token refresh / gateway reconnect / timer / backup path 稳定性修复 |
| conversation rewind | [conversation-rewind.md](conversation-rewind.md) | #3441 #4064 #4216 #4122 #3622 #4580 #4820 #4897 #5057 #5141 | double-ESC/`/rewind` 回退历史 + 文件恢复 + snapshot 持久化 + supported `sed -i` tracking + HTTP rewind 端点 |
| 原子文件写 | [atomic-file-write.md](atomic-file-write.md) | #4096 #4333 #4431 | temp+rename+fsync 原子写，铺开到 credentials/memory/config/JSONL |
| CLI 启动性能 | [cli-startup-performance.md](cli-startup-performance.md) | #3318 #3319 #3297 #3232 | API 预连接 + 早期输入捕获 + 工具懒注册 + 启动 profiler |
| SDK (Python/TS) | [sdk.md](sdk.md) | #3494 #3685 #3832-3835 #4217 #4226 #4353 #4360 | Python SDK(子进程+控制协议) + TS daemon SDK + PyPI 发布工具链 |
| monitor 事件工具 | [monitor-tool.md](monitor-tool.md) | #3684 #3726 #3792 #3933 #5165 | 长任务节流流式监控 + MonitorRegistry owner-scoped 通知 + batch drain 降 token waste |
| 后台 agent/会话恢复 | [background-agent-resume.md](background-agent-resume.md) | #3739 #4222 #5556 #5679 | 背景 agent paused/resume(transcript-fork) + daemon session load/resume + completed agent revive / transcript TTL + background agent cap 严格解析 |
| Managed memory | [managed-memory.md](managed-memory.md) | #5616 #5814 | auto-generated skills staged confirmation + `/remember` 与 auto-extract 解耦，避免 QWEN.md 被半自动写入 |
| 上下文压缩 | [context-compression.md](context-compression.md) | #3879 #3985 #3872 #5042 #5111 #5865 | 反应式溢出压缩 + 会话记录瘦身 + 大工具结果外置 + active tool result history 预算 + streaming compression side-query |
| 工具调用 ID 完整性 | [tool-call-id-integrity.md](tool-call-id-integrity.md) | #5107 #5624 #5657 | OpenAI-compatible provider 的 `tool_call.id` 规范化、去重执行、跨轮复用 suffix、repeated duplicate response 熔断、dangling replay 终止化 |
| 诊断 skills | [diagnostic-skills.md](diagnostic-skills.md) | #3404 #4133 #3079 #5826 | /doctor 代码命令 + /stuck /batch prompt 技能 + session skill usage stats |
| auth/provider | [auth-providers.md](auth-providers.md) | #3212 #3495 #3623 #3624 #4255 #4291 #4305 #5179 #5404 #5478 #5539 #5632 #5637 #5654 #5729 #5769 #5793 #5827 #5845 | provider 配置/apiKey 保留/auth status 识别 + daemon 设备流(PKCE) + Requesty/custom provider + providerProtocol + OpenAI stream idle timeout/env knob |
| 权限系统 | [permission-system.md](permission-system.md) | #3467 #3726 #4335 #5085 #5105 #5196 #5218 #5258 #5260 #5622 #5743 #5754 | 规则解析+畸形规则守卫 + 多客户端权限协调 + ACP 取消停止语义 + workspace permissions API + auto 模式破坏性命令硬拦截 |

## 本周 PR 覆盖核对（2026-06-22 ~ 2026-06-26，全作者）

> 逐 PR 明细见 [recent-pr-feature-coverage.md](recent-pr-feature-coverage.md)。覆盖口径：`created:2026-06-22..2026-06-26` 全作者、全状态 PR；统计以 2026-06-26 查询为准，共 207 个 PR：146 merged / 38 open / 23 closed。06-25~26 合入但创建更早的 #5561 也按本周落地能力纳入。

| feature 文档 | 本周新增/完善 PR | 本周文档动作 |
|---|---|---|
| [managed-memory.md](managed-memory.md) | #5616 #5814 | 新增专题，覆盖 pending skills confirmation、`memory.autoSkillConfirm`、`/remember` 不再写 QWEN.md、auto-extract 与手动 memory 解耦。 |
| [mcp-resources-prompts.md](mcp-resources-prompts.md) | #5561 #5589 #5635 #5733 #5774 #5781 #5812 | 补 live MCP settings reconcile、resource browser / completion / read tool、Claude MCP transport mapping。 |
| [voice-dictation.md](voice-dictation.md) | #5605 #5609 #5628 #5632 #5747 #5755 #5765 #5794 #5817 | 补 mirror install native audio bundling、daemon workspace voice APIs、keyterms file、Web Shell daemon voice、ASR refinement。 |
| [daemon-serve-mode/](daemon-serve-mode/) | #5613 #5638 #5741 #5743 #5752 #5753 #5755 #5765 #5784 #5785 #5797 #5825 #5857 #5874 | 补 Web Shell branch/fork、workspace defaults、permissions/LSP/status/voice/control APIs、startup fast path、benchmark、single-session status route。 |
| [daemon-serve-mode/11-webui-and-transport.md](daemon-serve-mode/11-webui-and-transport.md) | #5650 #5818 #5822 #5864 #5876 | 补 enhanced Markdown tables、active prompt loading、streaming turn command queue、thinking duration、中文工具组文案。 |
| [loop-wakeup.md](loop-wakeup.md) | #5808 #5844 | 补 abort 清理 pending wakeup，以及 monitor/background-task notification 优先于短轮询的 self-paced loop 指导。 |
| [auth-providers.md](auth-providers.md) | #5793 #5827 #5845 | 补 providerProtocol 映射、stream idle timeout、`QWEN_STREAM_IDLE_TIMEOUT_MS` 部署级 override。 |
| [telemetry-observability/](telemetry-observability/) | #5804 | 补 sensitive span attribute max length 设置 / env override 与新 1 MiB default。 |
| [context-compression.md](context-compression.md) | #5865 | 补 compression side-query streaming，避免 gateway read timeout。 |
| [tool-call-id-integrity.md](tool-call-id-integrity.md) | #5657 | 补 repeated duplicate provider response circuit breaker 与 per-prompt ACP tracking reset。 |

open / closed PR 处理规则：open PR 只登记后续观察，不写成已落地实现；closed/superseded/release-only/CI-only PR 不新增 feature 专题。

## 最近 PR 覆盖核对（2026-06-24，全作者）

> 逐 PR 明细见 [recent-pr-feature-coverage.md](recent-pr-feature-coverage.md)。覆盖口径：主口径为 `QwenLM/qwen-code` 中 `created:2026-06-24` 的全作者、全状态 PR；补充口径纳入 `merged:2026-06-24` 但创建更早的 PR。统计以 2026-06-25 查询为准：当天创建 36 个 PR，当前 15 merged / 20 open / 1 closed。

| feature 文档 | 对应 PR | 本次文档动作 |
|---|---|---|
| [daemon-serve-mode/](daemon-serve-mode/) | #5752 #5755 #5785 #5797 #5826 | 补 MCP client budget 严格解析、Web Shell voice daemon route、serve slim startup fast path 与 timing、SDK stale clientId self-heal、session skill stats。 |
| [daemon-serve-mode/11-webui-and-transport.md](daemon-serve-mode/11-webui-and-transport.md) | #5755 | 补浏览器麦克风 PCM → daemon `/voice/stream` WebSocket → composer transcript 的 Web Shell 语音链路。 |
| [daemon-serve-mode/08-extension-endpoints.md](daemon-serve-mode/08-extension-endpoints.md) | #5826 | 补 `GET /session/:id/stats` 的 `skills` block 与 `/stats skills` 只读诊断面。 |
| [voice-dictation.md](voice-dictation.md) | #5755 #5794 | 补 Web Shell daemon voice，以及 fast model 对 ASR transcript 的保守修正与超时/失败回退。 |
| [mcp-resources-prompts.md](mcp-resources-prompts.md) | #5781 #5812 | 补 model-callable `read_mcp_resource`，以及 Claude MCP transport config 到 qwen MCP config 的规范化映射。 |
| [loop-wakeup.md](loop-wakeup.md) | #5808 | 补用户 abort 当前 self-paced tick 时取消 pending one-shot wakeup，避免 `/loop` 自动复活。 |
| [diagnostic-skills.md](diagnostic-skills.md) | #5826 | 补真实 skill body load 的 per-session success/fail/by-name 统计与 `/stats skills` 展示。 |
| [auth-providers.md](auth-providers.md) | #5827 | 补 OpenAI-compatible streaming inactivity timeout：无 chunk 超时 abort、合成 `ETIMEDOUT` 并复用 retry 分类。 |

open / closed PR 处理规则：open PR 仅在 [recent-pr-feature-coverage.md](recent-pr-feature-coverage.md) 登记后续观察，不按已落地能力写成实现；closed/superseded/release-only/CI-only PR 不新增 feature 专题。

## 前序 PR 覆盖核对（2026-06-22 ~ 2026-06-23，全作者）

> 逐 PR 明细见 [recent-pr-feature-coverage.md](recent-pr-feature-coverage.md)。覆盖口径：`QwenLM/qwen-code` 中 `created:2026-06-22..2026-06-23` 的全作者、全状态 PR；统计以 2026-06-24 查询为准，共 127 个 PR：84 merged / 24 open / 19 closed。#5743 等 06-23 创建、06-24 合入的 PR 按创建日期纳入。

| feature 文档 | 对应 PR | 本次文档动作 |
|---|---|---|
| [workflow-token-budget.md](workflow-token-budget.md) | #5600 #5679 #5740 | 从单点 token budget 扩展为 Dynamic Workflows：nested workflow、stall retry、journal resume、snapshot、saved slash workflow、env 严格解析和 snapshot prune 防穿越。 |
| [mcp-resources-prompts.md](mcp-resources-prompts.md) | #5589 #5635 #5733 #5774 | 补 `/mcp` OAuth 恢复提示、resource browser、按友好名称/裸 `@` 全局资源补全与完整引用展示。 |
| [daemon-serve-mode/](daemon-serve-mode/) | #5613 #5638 #5741 #5743 #5753 #5784 | 补 Web Shell `/branch`/`/fork`、workspace provider defaults、remote LSP status、workspace permissions、extension operation polling、stale prompt client 拒绝。 |
| [voice-dictation.md](voice-dictation.md) | #5605 #5609 #5628 #5632 | 补 native recorder fallback 日志、stop-error 后可重试、standalone audio addon 打包、`voiceOnly` 模型标记。 |
| [artifact-tool.md](artifact-tool.md) | #5615 #5617 | 补 host/OSS 远端发布确认文案、用户取消语义与 `artifact.autoOpen` 设置。 |
| [permission-system.md](permission-system.md) | #5622 #5743 #5754 | 补 `ask_user_question` answer index 校验、远程 workspace rule API、auto 模式破坏性命令硬拦截。 |
| [auth-providers.md](auth-providers.md) | #5632 #5637 #5654 #5729 #5769 | 补 fast/voice model flag、DashScope thinking 默认值、自定义模型恢复、runtime model 列表与重复 display name 消歧。 |
| [tool-call-id-integrity.md](tool-call-id-integrity.md) | #5624 | 补历史 replay 中 dangling tool call 的失败终态化，防恢复 UI 永远 processing。 |

open / closed PR 处理规则：open PR 仅在 feature 文档的「后续观察」中登记，不按已落地能力写成实现；closed/superseded/wrong-base/release-only/CI-only PR 不新增 feature 专题，只在覆盖矩阵保留归属判断。

## 近期 PR 覆盖核对（2026-06-15 ~ 2026-06-21，全作者）

> 逐 PR 明细见 [recent-pr-feature-coverage.md](recent-pr-feature-coverage.md)。覆盖口径：`QwenLM/qwen-code` 中 `created:2026-06-15..2026-06-21` 的全作者 PR；其中 06-21 创建但 06-22 合入的 #5502/#5556/#5557 也按上周创建口径纳入。

| 动作 | PR | feature 文档 |
|---|---|---|
| 新增专题 | #5502 #5557 #5231 #5544 #5182/#5197 #5202 | [voice-dictation.md](voice-dictation.md)、[artifact-tool.md](artifact-tool.md)、[workflow-token-budget.md](workflow-token-budget.md)、[mcp-resources-prompts.md](mcp-resources-prompts.md)、[loop-wakeup.md](loop-wakeup.md)、[channel-adapters.md](channel-adapters.md) |
| 完善 daemon/serve/web-shell | #5118 #5125 #5161 #5163 #5166 #5174 #5175 #5193 #5211 #5216 #5260 #5266 #5392 #5398 #5484 #5504 #5541 | [daemon-serve-mode/](daemon-serve-mode/) |
| 完善权限/ACP 取消语义 / shell 边界 | #5085 #5105 #5196 #5218 #5258 #5260 | [permission-system.md](permission-system.md) |
| 完善 auth/provider | #5179 #5404 #5478 #5539 | [auth-providers.md](auth-providers.md) |
| 完善后台 agent | #5556 | [background-agent-resume.md](background-agent-resume.md) |
| 完善 rewind / monitor | #5141 #5165 | [conversation-rewind.md](conversation-rewind.md)、[monitor-tool.md](monitor-tool.md) |
| 周报记录，后续观察 | #5122 #5126 #5145 #5146 #5187 #5203 #5220 #5284 #5289 #5311 #5401 | 已记录 feature 归属；暂不单开深度专题或属于平台/CI/小功能面；#5561 已在本周合入后移入 MCP 专题 |
| 不作为 feature 实现统计 | #5148 #5151 #5162 #5170 #5195 #5217 #5232 #5240 #5242 #5405 #5406 #5507 #5513 #5519 #5571 | closed / superseded / wrong-base / test-only 草稿，不新增专题 |

## 备注

- **跨主题 PR**：少量 PR 同时属于多个 feature（如 #3726 既是 monitor 工具也是权限命名空间；#4255/#4291/#4305 既属 daemon/serve 也属 auth；#4335 既属 daemon/serve 也属权限系统）——各文档从自身角度切入。
- **acp-bridge 抽包**（#4295/4298/4300/4304/4319/4334/4445）作为 daemon/serve 的内部分层，归入 [daemon-serve-mode/](daemon-serve-mode/)（见其 07 子文档）。
- 每篇「已知限制」综合了 weekly-report 的 review 发现（描述漂移、遗留缺口、待修项），便于直接对照跟进。

_生成于 2026-05-31；最后更新 2026-06-26_
