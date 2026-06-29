# qwen-code feature 技术方案

按 **feature topic** 汇总 [QwenLM/qwen-code](https://github.com/QwenLM/qwen-code) 的重点 PR（2026-04 ~ 06），并结合代码整理的详细技术方案。每篇含：背景动机 / 整体架构 / 子系统详解（带 `file:symbol` 锚点）/ 关键流程（mermaid 时序图·调用链·状态机）/ 设计决策与权衡 / 涉及 PR / 已知限制。

> 配套：逐 PR 的描述↔实现一致性 + 正确性审查见 [`../weekly-report/`](../weekly-report/)。
> 说明：daemon/serve 主体已随 #4490 合入 `main`；少量子文档仍保留早期 `daemon_mode_b_main` 标注，阅读时以各文档顶部的适用范围和 PR 状态更新为准。

## 21 篇技术方案

> **daemon/serve** 与 **telemetry** 两块内容最多，已各自拆成文件夹（README 总览 + 多篇函数级深入子文档）；其余为单篇。

| 主题 | 文档 | 关键 PR | 一句话 |
|---|---|---|---|
| daemon/serve 模式 | [daemon-serve-mode/](daemon-serve-mode/) 📁 | epic #4175 / #3803（~50+ PR） | Mode B：agent core 常驻 HTTP daemon，多客户端经 REST+SSE 并发附着，ACP bridge 解耦（README + 8 篇深入 + 09 路线图 + 10 客户端/SDK + 11 WebUI/传输） |
| telemetry 可观测性 | [telemetry-observability/](telemetry-observability/) 📁 | epic #3731 / #4384 / #5904（~27 PR） | 层级 span 树 + 上下文传播 + OTLP 路由 + 敏感属性门控 + LLM request phase breakdown + daemon 端到端追踪（README + 7 篇深入） |
| voice dictation | [voice-dictation.md](voice-dictation.md) | #5502 #5605 #5609 #5628 #5632 #5747 #5755 #5765 #5794 #5817 #5856 #5947 | CLI/Web Shell/desktop 语音听写：native/fallback、浏览器/Electron 采集 + daemon/loopback `/voice/stream` + batch/realtime ASR + keyterms file + transcript refinement + embed toolbar visibility |
| Artifact 工具 | [artifact-tool.md](artifact-tool.md) | #5557 #5615 #5617 | opt-in HTML artifact 发布：本地 file URL 优先，可选 host/OSS publisher，带自包含校验、权限门控、托管提示与 auto-open 设置 |
| Workflow token budget / Dynamic Workflows | [workflow-token-budget.md](workflow-token-budget.md) | #5231 #5600 #5679 #5740 #5930 | Workflow per-run output-token 软预算 + saved workflows / resume / journal / snapshot / `/workflows` UI + snapshot prune 防穿越 + stall env 严格解析 |
| MCP resources / prompts | [mcp-resources-prompts.md](mcp-resources-prompts.md) | #5544 #5561 #5589 #5635 #5733 #5774 #5781 #5812 #5879 | 宽松发现 MCP prompts/resources，`ResourceRegistry` + TUI/Web Shell `/mcp` resource browser + `@server:uri`/裸 `@` 补全注入 + model-callable resource read tool + live settings reconcile |
| CUA driver / computer-use | [cua-driver.md](cua-driver.md) | #5896 #5925 | vendored `qwen-cua-driver` + opt-in 0-1000 relative-coordinate shim，打通 Qwen-VL `computer_use` 与 pixel-based CUA driver，并在空闲时自动停 driver |
| loop wakeup | [loop-wakeup.md](loop-wakeup.md) | #5182 #5197 #5808 #5844 #5890 #5921 #5927 | prompt-only `/loop` 改成 self-paced wakeup，秒级单次唤醒 + 24h session budget + abort 清理 + `.qwen/loop.md` 动态任务文件 + notification guidance + scheduled-task 可见性/搜索 |
| Channel adapters | [channel-adapters.md](channel-adapters.md) | #5202 #5414-#5417 #5919 | QQ Bot channel adapter + 稳定性修复；Telegram bot command menu 与 shared `/cancel` command alignment |
| conversation rewind | [conversation-rewind.md](conversation-rewind.md) | #3441 #4064 #4216 #4122 #3622 #4580 #4820 #4897 #5057 #5141 #5923 | double-ESC/`/rewind` 回退历史 + 文件恢复 + snapshot 持久化 + supported `sed -i` tracking + HTTP rewind 端点 + resume 后 parentUuid 边界保留 |
| 原子文件写 | [atomic-file-write.md](atomic-file-write.md) | #4096 #4333 #4431 | temp+rename+fsync 原子写，铺开到 credentials/memory/config/JSONL |
| CLI 启动性能 | [cli-startup-performance.md](cli-startup-performance.md) | #3318 #3319 #3297 #3232 | API 预连接 + 早期输入捕获 + 工具懒注册 + 启动 profiler |
| SDK (Python/TS) | [sdk.md](sdk.md) | #3494 #3685 #3832-3835 #4217 #4226 #4353 #4360 | Python SDK(子进程+控制协议) + TS daemon SDK + PyPI 发布工具链 |
| monitor 事件工具 | [monitor-tool.md](monitor-tool.md) | #3684 #3726 #3792 #3933 #5165 #5918 | 长任务节流流式监控 + MonitorRegistry owner-scoped 通知 + batch drain 降 token waste + 前台 shell 临近超时 Ctrl+B 提示 |
| 后台 agent/会话恢复 | [background-agent-resume.md](background-agent-resume.md) | #3739 #4222 #5030 #5556 #5679 | 背景 agent paused/resume(transcript-fork) + daemon session load/resume + SDK/stream-json interrupted turn continuation + completed agent revive / transcript TTL + background agent cap 严格解析 |
| Managed memory | [managed-memory.md](managed-memory.md) | #5616 #5814 #5886 #5963 | auto-generated skills staged confirmation + `/remember` 与 auto-extract 解耦，避免 QWEN.md 被半自动写入；新增 git-shared team memory tier；auto-memory 关闭时不再发起 memory recall side-query |
| 上下文压缩 | [context-compression.md](context-compression.md) | #3879 #3985 #3872 #5042 #5111 #5865 #5868 | 反应式溢出压缩 + 会话记录瘦身 + 大工具结果外置 + active tool result history 预算 + streaming compression side-query + 可配置 auto-compact 阈值 / Stop hook context usage |
| 工具调用 ID 完整性 | [tool-call-id-integrity.md](tool-call-id-integrity.md) | #5107 #5624 #5657 #5934 #5944 | OpenAI-compatible provider 的 `tool_call.id` 规范化、去重执行、跨轮复用 suffix、repeated duplicate response 熔断、dangling replay 终止化、截断 write/edit retry-loop backstop，以及 repeated shell inspection stagnation guard |
| 诊断 / creator skills / extension activation | [diagnostic-skills.md](diagnostic-skills.md) | #3404 #4133 #3079 #5826 #5828 #5849 | /doctor 代码命令 + /stuck /batch /extension-creator prompt 技能 + session skill usage stats + CLI `@ext:name` activation |
| auth/provider | [auth-providers.md](auth-providers.md) | #3212 #3495 #3623 #3624 #4255 #4291 #4305 #5179 #5404 #5478 #5539 #5632 #5637 #5654 #5729 #5769 #5778 #5793 #5827 #5835 #5845 #5946 | provider 配置/apiKey 保留/auth status 识别 + daemon 设备流(PKCE) + Requesty/custom provider + providerProtocol + OpenAI stream idle timeout/env knob + vision fallback model + provider install model preservation + Anthropic SDK abort listener isolation |
| 权限系统 | [permission-system.md](permission-system.md) | #3467 #3726 #4335 #5085 #5105 #5196 #5218 #5258 #5260 #5622 #5743 #5754 | 规则解析+畸形规则守卫 + 多客户端权限协调 + ACP 取消停止语义 + workspace permissions API + auto 模式破坏性命令硬拦截 |

## 上周 PR 覆盖核对（2026-06-22 ~ 2026-06-28，全作者）

> 逐 PR 明细见 [recent-pr-feature-coverage.md](recent-pr-feature-coverage.md)。覆盖口径：`created:2026-06-22..2026-06-28` 全作者、全状态 PR；统计以 2026-06-29 查询为准，共 252 个 PR：203 merged / 22 open / 27 closed。2026-06-28 创建 14 个 PR（当前 10 merged / 3 open / 1 closed），当天 `mergedAt` 非空合入 20 个 PR；06-25~28 合入但创建更早的 #5030/#5777/#5856/#5868/#5890/#5944 等也按上周落地能力纳入。

| feature 文档 | 本周新增/完善 PR | 本周文档动作 |
|---|---|---|
| [managed-memory.md](managed-memory.md) | #5616 #5814 #5886 | 新增专题并补 team memory，覆盖 pending skills confirmation、`memory.autoSkillConfirm`、`/remember` 不再写 QWEN.md、auto-extract 与手动 memory 解耦、`.qwen/team-memory/` git-shared tier。 |
| [mcp-resources-prompts.md](mcp-resources-prompts.md) | #5561 #5589 #5635 #5733 #5774 #5781 #5812 #5879 | 补 live MCP settings reconcile、TUI/Web Shell resource browser、completion / read tool、Claude MCP transport mapping。 |
| [voice-dictation.md](voice-dictation.md) | #5605 #5609 #5628 #5632 #5747 #5755 #5765 #5794 #5817 #5856 #5947 | 补 mirror install native audio bundling、daemon workspace voice APIs、keyterms file、Web Shell daemon voice、ASR refinement、desktop Electron voice dictation，以及嵌入式 Web Shell 对 voice toolbar action 的显隐控制。 |
| [daemon-serve-mode/](daemon-serve-mode/) | #5613 #5638 #5741 #5743 #5752 #5753 #5755 #5765 #5777 #5784 #5785 #5797 #5825 #5857 #5874 #5892 #5903 #5906 #5938 #5945 #5955 | 补 Web Shell branch/fork、workspace defaults、permissions/LSP/status/voice/control APIs、Chrome extension daemon-direct + client-hosted MCP、startup fast path、benchmark、single-session status route、ACP `/cd`、Windows PTY tree-kill、settings minimum validation、compile-cache/version 延迟加载和 serve bridge wrapper 删除后的 import 归属。 |
| [daemon-serve-mode/11-webui-and-transport.md](daemon-serve-mode/11-webui-and-transport.md) | #5650 #5818 #5822 #5864 #5869 #5876 #5893 #5900 #5917 #5931 #5943 #5947 #5948 | 补 enhanced Markdown tables、active prompt loading、streaming turn command queue、thinking duration、stream-highlight code blocks、中文工具组文案、Web Shell chat polish、host loading phrase customization、session sidebar、error boundaries、voice toolbar visibility 与 mobile TodoPanel progress。 |
| [loop-wakeup.md](loop-wakeup.md) | #5808 #5844 #5890 #5921 #5927 | 补 abort 清理 pending wakeup、monitor/background-task notification 优先于短轮询的 self-paced loop 指导、`.qwen/loop.md` 动态任务文件、footer scheduled task count 与 cron tool-search intent。 |
| [auth-providers.md](auth-providers.md) | #5778 #5793 #5827 #5835 #5845 #5946 | 补 `/model --vision` fallback、providerProtocol 映射、stream idle timeout、provider install plan preserve selected model、`QWEN_STREAM_IDLE_TIMEOUT_MS` 部署级 override，以及 Anthropic generator 的 per-request child abort controller。 |
| [telemetry-observability/](telemetry-observability/) | #5804 #5904 #5960 | 补 sensitive span attribute max length 设置 / env override、新 1 MiB default、LLM request phase breakdown metric，以及 telemetry docs/schema 刷新中 `tool_output_truncated` 事件名前缀变更。 |
| [context-compression.md](context-compression.md) | #5865 #5868 | 补 compression side-query streaming，避免 gateway read timeout；补 `context.autoCompactThreshold` 与 Stop hook 的 `context_usage/context_limit/input_tokens`。 |
| [tool-call-id-integrity.md](tool-call-id-integrity.md) | #5657 #5934 #5944 | 补 repeated duplicate provider response circuit breaker、per-prompt ACP tracking reset、截断 write/edit 重试循环 backstop，以及 always-on repeated shell git overview inspection guard。 |
| [background-agent-resume.md](background-agent-resume.md) | #5030 | 补 SDK / stream-json `continueLastTurn()`：从持久化历史分类 interrupted prompt/turn，不注入合成 `"continue"` 用户消息。 |
| [diagnostic-skills.md](diagnostic-skills.md) | #5828 #5849 | 补 bundled `/extension-creator` creator skill，以及 CLI `@ext:name` mention 对 extension skills/MCP/agents/context files 的 turn-level activation。 |
| [cua-driver.md](cua-driver.md) | #5896 #5925 | 新增专题并补 computer-use idle shutdown，覆盖 vendored `qwen-cua-driver`、相对坐标开关、输入 denormalization、工具契约改写、release/sync 边界，以及空闲自动停 `cua-driver`。 |

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

_生成于 2026-05-31；最后更新 2026-06-29_
