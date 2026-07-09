# qwen-code feature 技术方案

按 **@doudouOUC 个人 PR** 口径汇总 [QwenLM/qwen-code](https://github.com/QwenLM/qwen-code) 的重点实现（2026-04 ~ 07），并结合代码整理详细技术方案。每篇含：背景动机 / 整体架构 / 子系统详解（带 `file:symbol` 锚点）/ 关键流程（mermaid 时序图、调用链、状态机）/ 设计决策与权衡 / 涉及 PR / 已知限制。

> 配套：逐 PR 的描述↔实现一致性 + 正确性审查见 [`../weekly-report/`](../weekly-report/)。
> 口径：这里只保留 @doudouOUC 自己创建的 PR；其他作者 PR 不再作为本目录统计或专题入口。open/closed 未合入 PR 只作为方案记录，不能视为当前 `main` 已落地能力。

## 16 篇技术方案

> **daemon/serve** 与 **telemetry** 两块内容最多，已各自拆成文件夹（README 总览 + 多篇函数级深入子文档）；其余为单篇。

| 主题 | 文档 | 关键 PR | 一句话 |
|---|---|---|---|
| daemon/serve 模式 | [daemon-serve-mode/](daemon-serve-mode/) | epic #4175 / #5977 / #5989 / #5995 / #6013 / #6031 / #6058 / #6098 / #6146 / #6253(closed) / #6263 / #6270 / #6292 / #6296 / #6297 / #6305 / #6309 / #6310 / #6314 / #6325 / #6335 / #6370 / #6394 / #6407 / #6410 / #6416 / #6482 / #6511 / #6525(open) / #6540 / #6558 / #6567 / #6598 / #6621(open) | Mode B：agent core 常驻 HTTP daemon，多客户端经 REST+SSE 并发附着，ACP bridge 解耦；近期补 standalone serve fast path、daemon-managed channel worker、session archive、worker hardening、stderr credential redaction、NDJSON perf、status activity、ACP session settings isolation、preflight auth、session export、session organization、batch load replay、settings cache、EventBus byte cap、prompt queue status、large pipe frame measurement、ACP `/tmp` local fallback、Phase 1/2a/2b/3 workspace runtime registry、settings reload signal、runtime env/total admission、bounded replay snapshot、multi-workspace live routing、secondary persisted session list、workspace-qualified REST、channel worker reload；paged transcript 与 workspace-qualified ACP 仍为 open 方案记录。 |
| telemetry 可观测性 | [telemetry-observability/](telemetry-observability/) | epic #3731 / #4384 / #5960 / #6263 / #6335 | 层级 span 树、上下文传播、OTLP 路由、敏感属性门控、daemon 端到端追踪、event-loop lag / pipe metrics、大帧低敏归因和 telemetry 文档/schema 对齐。 |
| Channel adapters | [channel-adapters.md](channel-adapters.md) | #5978 / #6031 / #6098 / #6165 / #6182 / #6309 / #6598 | `ChannelAgentBridge` adapter-facing 合约，把 channel adapter 从具体 `AcpBridge` 实现中解耦；daemon-managed channel worker 由 `qwen serve --channel` 托管，并补 prompt turn barrier、session listing、batch load replay 和 settings reload。 |
| conversation rewind | [conversation-rewind.md](conversation-rewind.md) | #3441 #4064 #4216 #4122 #3622 #4580 #4820 #4897 #5057 #5141 | double-ESC/`/rewind` 回退历史、文件恢复、snapshot 持久化、supported `sed -i` tracking、HTTP rewind 端点与 resume 边界。 |
| 原子文件写 | [atomic-file-write.md](atomic-file-write.md) | #4096 #4333 #4431 | temp+rename+fsync 原子写，铺开到 credentials、memory、config、JSONL，并补 uid 保留边界。 |
| CLI 启动性能 | [cli-startup-performance.md](cli-startup-performance.md) | #3318 #3319 #3297 #3232 #6349 | API 预连接、早期输入捕获、工具懒注册、启动 profiler；#6349 补 `GeminiClient.startChat()` session-start profiler。 |
| SDK (Python/TS) | [sdk.md](sdk.md) | #3494 #3685 #3832-3835 #4226 #4360 | Python SDK（子进程+控制协议）、TS daemon event surface、PyPI 发布工具链和 daemon protocol completion。 |
| monitor 事件工具 | [monitor-tool.md](monitor-tool.md) | #3684 #3726 #3792 #3933 #5165 | 长任务节流流式监控、MonitorRegistry owner-scoped 通知、batch drain 降 token waste、前台 shell 临近超时提示。 |
| 后台 agent/会话恢复 | [background-agent-resume.md](background-agent-resume.md) | #3739 #4222 #5972 #6502 | 背景 agent paused/resume、daemon session load/resume、subagent output-token display；broken parentUuid chain 恢复时显式展示不可恢复的 history gap。 |
| 上下文压缩 | [context-compression.md](context-compression.md) | #3879 #3985 #3872 #5042 #5111 | 反应式溢出压缩、会话记录瘦身、大工具结果外置、active tool result history 预算。 |
| 工具调用 ID 完整性 | [tool-call-id-integrity.md](tool-call-id-integrity.md) | #5107 #5624 | OpenAI-compatible provider 的 `tool_call.id` 规范化、去重执行、dangling replay 终止化。 |
| Diff 渲染与变更统计 | [diff-rendering.md](diff-rendering.md) | #6141 | edit/write/shell 等工具的 whitespace-only diff 不再显示为 “No changes detected”，diff stat 也按 smart fallback 统计。 |
| 文件读取 / 大文本范围 / PDF 预算 | [file-reading.md](file-reading.md) | #6404 / #6409 / #6585 | 大文本范围读取与 PDF 读取预算：超过旧 10MB 文本 guard 时返回有界行范围，大型 PDF 不带 `pages` 时返回 guidance/reference；文本提取失败或超预算时可用 bounded page image fallback。 |
| 诊断 / creator skills | [diagnostic-skills.md](diagnostic-skills.md) | #3404 #4133 #3079 #6117 #6233(closed) | `/doctor` 代码命令、`/stuck` 诊断技能、`/batch` prompt 技能、ACP/non-interactive `/skills` 列表输出；disabled skill wire/filtering 仅为 #6233 closed 方案记录。 |
| auth/provider | [auth-providers.md](auth-providers.md) | #3212 #3495 #3623 #3624 #4255 #4291 #4305 #5179 #5638 #5769 | provider 配置、apiKey 保留、auth status 识别、device-flow、workspace provider defaults、重复 display name 消歧。 |
| 权限系统 | [permission-system.md](permission-system.md) | #3467 #3726 #4335 #5085 #5105 #5218 #5258 #5260 #5743 #6026 #6087 #6138 | 规则解析与畸形规则守卫、多客户端权限协调、ACP 取消停止语义、workspace permissions API、subagent approval-mode override、subagent plan lifecycle tool 阻断、plan-required teammate leader approval。 |

## 使用口径

- 查单个 PR 的最终实现，优先看对应周目录的 `implementations/pr-*.md`。
- 查跨 PR 能力演进，再看本目录的 feature 文档。
- 本目录只维护 @doudouOUC 个人 PR；其他作者 PR 即使属于同一 upstream feature，也不在这里继续追踪。

## 备注

- **跨主题 PR**：少量 PR 同时属于多个 feature（如 #3726 既是 monitor 工具也是权限命名空间；#4255/#4291/#4305 既属 daemon/serve 也属 auth；#4335 既属 daemon/serve 也属权限系统）——各文档从自身角度切入。
- **acp-bridge 抽包**（#4295/4298/4300/4304/4319/4334/4445）作为 daemon/serve 的内部分层，归入 [daemon-serve-mode/](daemon-serve-mode/)（见其 07 子文档）。
- 每篇「已知限制」综合 weekly-report 的 review 发现（描述漂移、遗留缺口、待修项），便于直接对照跟进。

_生成于 2026-05-31；按个人 PR 口径更新于 2026-07-10_
