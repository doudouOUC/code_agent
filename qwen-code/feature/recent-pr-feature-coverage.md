# 近期 PR → feature 文档覆盖矩阵

> 说明：本文件用于把周报里的 PR 归到 feature 文档。不是所有 PR 都需要单开专题；release/CI/test-only、小修、closed/wrong-base PR 只登记归属判断。open PR 只登记后续观察，不按已落地实现写入专题正文。

---

## 2026-06-22 ~ 2026-06-28（上周，全作者）

> 覆盖口径：`QwenLM/qwen-code`，`created:2026-06-22..2026-06-28` 全作者、全状态 PR；补充口径为上周内合入但创建更早的 PR。统计以 2026-06-29 查询为准：上周创建共 252 个 PR，当前 203 merged / 22 open / 27 closed；其中 2026-06-28（昨天）创建 14 个 PR，当前 10 merged / 3 open / 1 closed。`merged:2026-06-28` 口径返回 20 个 `mergedAt` 非空 PR，包含 #5030/#5777/#5856/#5868/#5890/#5944 等前序创建但昨天才落地的能力。

上周已拆成六层记录：

| 范围 | 作用 |
|---|---|
| 2026-06-28 昨日复核 | 本次重点：补昨天创建与昨天合入的 PR，尤其把前序 open 观察转为已落地 feature。 |
| 2026-06-27 昨日复核 | 本次重点：逐一复核昨天创建与昨天合入的 PR，补“每个 PR 做什么、怎么做、对应 feature 是否要更新”。 |
| 2026-06-26 昨日复核 | 本次重点：逐一复核昨天创建与昨天合入的 PR，补“每个 PR 做什么、怎么做、对应 feature 是否要更新”。 |
| 2026-06-25~26 增量 | 本节重点补 06-25/26 新创建或新合入的 PR，以及上一节 open 观察转 merged 的 PR。 |
| 2026-06-24 | 见下一节，覆盖 06-24 创建 PR 和 06-24 合入的跨日 PR。 |
| 2026-06-22~23 | 见后续节，覆盖周一/周二创建 PR；其中部分在 06-24/25 合入的 PR 已在本周增量节复核。 |

### 2026-06-28 昨日 PR 专项复核

昨天创建 14 个 PR：当前 10 merged / 3 open / 1 closed。昨天合入 20 个 PR；其中 #5030/#5777/#5856/#5868/#5890/#5944 属于前序创建但 06-28 合入，已从 open 观察或前序待办转入对应 feature 文档。

| PR | 处理结果 |
|---|---|
| #5963 | 已更新 [managed-memory.md](managed-memory.md)：auto-memory 关闭时不再发起 memory recall side-query，避免本地/单 GPU 用户关闭自动记忆后仍被后台记忆查询拖慢。手动 `/remember` 与已有 memory injection 仍按非 `--bare` 能力边界理解。 |
| #5960 | 已更新 [telemetry-observability/README.md](telemetry-observability/README.md)：记录 telemetry 文档/schema 刷新，并标注 `tool_output_truncated` 事件名改为 `qwen-code.tool_output_truncated` 的下游 filter 兼容性影响。 |
| #5955 | 已更新 [daemon-serve-mode/README.md](daemon-serve-mode/README.md)：serve 侧不再保留 event-bus/status/in-memory-channel wrapper；CLI 内部改直接使用 `@qwen-code/acp-bridge` exports，serve barrel 对外保持兼容，旧的 “eventBus re-export shim” 描述已修正。 |
| #5948 | 已更新 [daemon-serve-mode/11-webui-and-transport.md](daemon-serve-mode/11-webui-and-transport.md)：TodoPanel progress 在 mobile 下切为 compact `3 / 8` + progress ring，desktop 仍显示完整 `Step 3 / 8` / `第 3 / 8 步`。 |
| #5947 | 已更新 [voice-dictation.md](voice-dictation.md) 与 [daemon-serve-mode/11-webui-and-transport.md](daemon-serve-mode/11-webui-and-transport.md)：`ComposerToolbarAction` 增加 `voice`，embedding host 可通过 `composerToolbarActions` 隐藏/显示 voice button，默认保持向后兼容。 |
| #5946 | 已更新 [auth-providers.md](auth-providers.md)：Anthropic generator 与 OpenAI path 对齐，把 caller abort signal 包成 per-request child controller，流式/非流式请求结束后清理，隔离 SDK `fetchWithTimeout` 泄漏到长寿 session signal 的 abort listener。 |
| #5944 | 已更新 [tool-call-id-integrity.md](tool-call-id-integrity.md)：always-on shell git overview inspection guard，重复 `git status` / overview `git diff` / `git ls-files` 变体时以 `shell_command_stagnation` 中止；file-specific diff、带写操作的复合命令和非 inspection 工具调用不会入桶。 |
| #5890 | 已更新 [loop-wakeup.md](loop-wakeup.md)：`.qwen/loop.md` 动态任务文件，`<<loop.md-dynamic>>` / `<<loop.md>>` sentinel 在 fire 时展开全文或短提醒，project 文件优先且受 workspace realpath、25KB cap 和投递后提交缓存约束。 |
| #5868 | 已更新 [context-compression.md](context-compression.md)：新增 `context.autoCompactThreshold` 和 Stop hook 的 `context_usage/context_limit/input_tokens`，同时保留三层阈值中 large-window absolute branch 可能主导的设计边界。 |
| #5856 | 已更新 [voice-dictation.md](voice-dictation.md)：desktop Electron composer 增加 mic button/recording bar，renderer 采集 16kHz mono PCM 到 main process loopback `/voice/stream`，server-core 复用 CLI ASR pipeline；端到端 mic runtime 仍标记未实测。 |
| #5777 | 已更新 [daemon-serve-mode/README.md](daemon-serve-mode/README.md) 与 [daemon-serve-mode/10-client-adapters-and-sdk.md](daemon-serve-mode/10-client-adapters-and-sdk.md)：Chrome extension 从 Native Messaging 改为 daemon-direct side panel，浏览器工具以 client-hosted MCP server 经 daemon WebSocket 反向暴露，`QWEN_SERVE_CLIENT_MCP_OVER_WS` 默认关闭。 |
| #5030 | 已更新 [background-agent-resume.md](background-agent-resume.md)：SDK / stream-json `continueLastTurn()` 从持久化历史分类 interrupted prompt/turn/none，不再向 transcript 注入合成 `"continue"` 用户消息；dangling tool calls 用合成 error tool result 续上。 |
| #5954 | daemon developer docs refresh（resumable SSE、cross-connection vote routing、capability/event count、proposed workspace remember）；上游 docs-only，本轮只登记为覆盖依据，不按已落地实现新增专题正文。 |
| #5952 | v0.19.3 release PR，仅版本和 changelog，不新增 feature 文档。 |
| #5961 #5959 | CI review timeout 调整，属于 CI 可靠性，不新增 feature 文档。 |
| #5962 | 仍 open：model API `--insecure` / `QWEN_TLS_INSECURE` 跳过 TLS 验证；若合入归 [auth-providers.md](auth-providers.md) 的 provider/network runtime 边界，并需强调 MITM 风险与 `NODE_EXTRA_CA_CERTS` 推荐路径。 |
| #5957 | 仍 open：compression 阈值扣除 reserved output tokens；若合入归 [context-compression.md](context-compression.md)，补 `reservedOutputTokens` 从 context window 中扣除以避免 64K output reservation 下 auto-compression 过晚触发。 |
| #5953 | 仍 open：native LSP server runtime hot reload；若合入归 daemon/LSP 或另开 LSP runtime feature，关注 `.lsp.json` watcher、semantic config hash、incremental reconcile 和 cleanup 边界。 |
| #5951 | closed：chat-panel package 拆分 PR 未合入，不作为已落地 feature。 |
| #5911 #5860 | desktop source hardening / CI test PR；昨天合入但当前 feature 目录没有对应长期专题或属于 CI，覆盖矩阵登记不展开。 |

### 2026-06-27 昨日 PR 专项复核

昨天创建 26 个 PR：当前 19 merged / 4 open / 3 closed。昨天合入的跨日 PR 里，#5886/#5903/#5869/#5778 从前序 open 观察转为 merged，需要同步更新对应 feature 文档；#5906 已在前一轮写入 settings minimum validation，本轮只复核状态。

| PR | 处理结果 |
|---|---|
| #5886 | 已更新 [managed-memory.md](managed-memory.md)：新增 git-shared team memory tier，写清 `.qwen/team-memory/`、secret guard、生成式 `MEMORY.md` index、可选 git sync 和 trusted workspace 边界。 |
| #5903 | 已更新 [daemon-serve-mode/08-extension-endpoints.md](daemon-serve-mode/08-extension-endpoints.md)：ACP `/cd` 走 server-side cwd update，说明绝对路径、trust/sandbox/client 校验、per-session logical cwd、`session_cwd_changed` 事件和 prompt-busy 排队语义。 |
| #5938 | 已更新 [daemon-serve-mode/README.md](daemon-serve-mode/README.md)：`qwen serve` fast path 增加 Node compile cache 与 deferred `getCliVersion()`，解释 warm restart bytecode cache 和 version promise 并行化。 |
| #5945 | 已更新 [daemon-serve-mode/08-extension-endpoints.md](daemon-serve-mode/08-extension-endpoints.md)：`general.sessionRecapAwayThresholdMinutes` 增加 `minimum:1`，与 #5906 的 minimum validator 统一到 daemon API、TUI settings、VS Code schema。 |
| #5931 #5917 #5943 #5869 | 已更新 [daemon-serve-mode/11-webui-and-transport.md](daemon-serve-mode/11-webui-and-transport.md)：workspace session sidebar、enhanced table 手动 toggle、error boundaries、streaming code highlight / fence alias。 |
| #5930 | 已更新 [workflow-token-budget.md](workflow-token-budget.md)：`QWEN_CODE_WORKFLOW_STALL_SECONDS` 只接受十进制整秒，`0` 禁用，hex/scientific/float 回落默认值。 |
| #5927 #5921 | 已更新 [loop-wakeup.md](loop-wakeup.md)：footer scheduled task count，以及 cron/loop 管理意图在 `tool_search` 中更容易命中 list/delete/wakeup。 |
| #5925 | 已更新 [cua-driver.md](cua-driver.md)：shared Computer Use client 增加 idle timeout，默认空闲 5 分钟停止 `cua-driver`，`tools.computerUse.idleTimeoutMs=0` 可禁用。 |
| #5923 | 已更新 [conversation-rewind.md](conversation-rewind.md)：resume/load 重建 rewind turn boundaries 时保留 persisted `parentUuid`，覆盖 CLI resume、ACP loadSession 和 unstable_resumeSession。 |
| #5919 | 已更新 [channel-adapters.md](channel-adapters.md)：Telegram bot command menu 与 shared `/cancel` command adapter，补 command 注册和 group mention 边界。 |
| #5918 | 已更新 [monitor-tool.md](monitor-tool.md)：交互式前台 shell 临近超时 live warning，只在可 Ctrl+B promote 的 TUI 场景显示，不改变 shell 输出或后台任务行为。 |
| #5934 | 已更新 [tool-call-id-integrity.md](tool-call-id-integrity.md)：默认输出 token 上限改为模型声明上限，重复截断 `write_file`/edit 拒绝接入 retry-loop detector。 |
| #5778 | 已更新 [auth-providers.md](auth-providers.md)：`/model --vision` fallback vision model、`visionModel` 配置、跨 provider vision bridge 和 stale modality gate 修复。 |
| #5835 | 非昨天创建/合入，但本轮复核时从 06-24 open 观察转 merged；已更新 [auth-providers.md](auth-providers.md)：provider install plan 重新应用时保留当前已选模型。 |
| #5937 | serve server assembly refactor，属于 daemon 内部拆分；不改变协议/feature 合约，本轮只登记。 |
| #5935 #5916 #5915 #5898 | MCP dialog border、tool display cleanup、schema warning 静音、mid-input skill completion 等局部 UX/补全/噪音修复；暂无长期 feature 专题，只在矩阵登记。 |
| #5914 #5911 #5829 | desktop source slug/path validation hardening；当前 feature 目录没有 desktop source 专题，本轮登记安全边界但不新增专题。 |
| #5631 #3683 | CONTRIBUTING provider governance docs / GitHub Actions 升级；属于 docs/process/CI，不新增 feature 专题。 |
| #5928 #5926 #5912 | 仍 open，分别归 todo persistence、PR intake evidence gate、ACP permission votes；合入后再更新对应 feature。#5944 已于 2026-06-28 合入并补 [tool-call-id-integrity.md](tool-call-id-integrity.md)。 |
| #5940 #5913 #5910 | closed / superseded / clarification；不作为已落地 feature。#5910 的 ACP permission vote 方向由 open #5912 继续承接。 |

### 2026-06-25 ~ 2026-06-26 已落地且需要更新 feature 文档

| PR | 状态 | feature 归属判断 | 文档动作 |
|---|---|---|---|
| #5561 | merged | MCP settings live reconcile：settings / extensions 改动后增删改 server、approval gating、`/mcp` pending/denied reason 不再要求重启 session。 | 已补 [mcp-resources-prompts.md](mcp-resources-prompts.md)。 |
| #5616 | merged | auto-generated skills 先 staged 到 `.qwen/pending-skills/`，用户确认后才进入 skill library；避免一次性任务污染 skill 库。 | 新增 [managed-memory.md](managed-memory.md)。 |
| #5650 | merged | Web Shell assistant Markdown table 变成可排序、过滤、选择、复制、隐藏列、展开行的增强表格。 | 已补 [daemon-serve-mode/11-webui-and-transport.md](daemon-serve-mode/11-webui-and-transport.md)。 |
| #5657 | merged | repeated duplicate provider tool-call response 熔断，避免 OpenAI-compatible provider 反复 replay 同一个 tool id 导致工具结果循环。 | 已补 [tool-call-id-integrity.md](tool-call-id-integrity.md)。 |
| #5747 | merged | 发布包 bundling native audio capture，改善 mirror/private registry 未同步 optional dependency 时的 voice capture 体验。 | 已补 [voice-dictation.md](voice-dictation.md)。 |
| #5765 | merged | daemon workspace voice/control APIs：`GET/POST /workspace/voice`、batch transcription、trust request、permission/LSP/status SDK/ACP surface。 | 已补 [daemon-serve-mode/README.md](daemon-serve-mode/README.md)、[daemon-serve-mode/08-extension-endpoints.md](daemon-serve-mode/08-extension-endpoints.md) 与 [voice-dictation.md](voice-dictation.md)。 |
| #5793 | merged | `providerProtocol` 映射让自定义 provider id 可复用内置 SDK protocol，分离 provider identity 与 transport behavior。 | 已补 [auth-providers.md](auth-providers.md)。 |
| #5804 | merged | `telemetry.sensitiveSpanAttributeMaxLength` / env override，让敏感 span 属性截断上限从硬编码变成可配置。 | 已补 [telemetry-observability/README.md](telemetry-observability/README.md) 与 [telemetry-observability/04-sensitive-attributes-and-pii.md](telemetry-observability/04-sensitive-attributes-and-pii.md)。 |
| #5814 | merged | `/remember` 不再在 `enableManagedAutoMemory=false` 时回退写 QWEN.md；auto-extract 与 manual memory 管理解耦。 | 已补 [managed-memory.md](managed-memory.md)。 |
| #5817 | merged | voice keyterms file：`general.voice.keytermsFile` 或 `.qwen/voice-keyterms.txt` 合并到 ASR bias。 | 已补 [voice-dictation.md](voice-dictation.md)。 |
| #5818 #5822 | merged | Web Shell active prompt loading 与 streaming turn 中本地命令排队，修复刷新/重连/命令插入导致的状态和 transcript 边界问题。 | 已补 [daemon-serve-mode/11-webui-and-transport.md](daemon-serve-mode/11-webui-and-transport.md)。 |
| #5825 #5874 | merged | daemon startup benchmark 与 `qwen serve` 跳过 wrapper `spawnSync`，补齐性能测量和冷启动优化。 | 已补 [daemon-serve-mode/README.md](daemon-serve-mode/README.md)。 |
| #5844 | merged | self-paced `/loop` 对 monitor/background-task terminal notification 做模型侧引导，长 fallback heartbeat + 事件优先处理。 | 已补 [loop-wakeup.md](loop-wakeup.md)。 |
| #5845 | merged | `QWEN_STREAM_IDLE_TIMEOUT_MS` env override，补 #5827 stream idle timeout 的部署级配置口。 | 已补 [auth-providers.md](auth-providers.md)。 |
| #5857 | merged | `GET /session/:id/status` 查询单个 live session 的 client count / active prompt，不再分页拉全 workspace session list。 | 已补 [daemon-serve-mode/README.md](daemon-serve-mode/README.md) 与 [daemon-serve-mode/08-extension-endpoints.md](daemon-serve-mode/08-extension-endpoints.md)。 |
| #5864 #5876 | merged | Web Shell thinking summary 保留 finished duration，中文工具组文案从“执行了”改为“调用了”。 | 已补 [daemon-serve-mode/11-webui-and-transport.md](daemon-serve-mode/11-webui-and-transport.md)。 |
| #5865 | merged | context compression side-query 改 opt-in streaming，避免 BFF/gateway 60s read timeout 杀死长摘要请求。 | 已补 [context-compression.md](context-compression.md)。 |
| #5879 | merged | Web Shell `/mcp` resource browser：daemon status 暴露 resource/prompt counts，新增 resources route / ACP ext method / SDK action，Web Shell dialog 可展开资源 detail 并插入 `@server:uri`。 | 已补 [mcp-resources-prompts.md](mcp-resources-prompts.md)。 |
| #5892 | merged | Windows interactive-shell PTY teardown 改为 `taskkill /f /t` tree-kill，并在正常完成后 guarded reap，避免 ConPTY 下残留 `pwsh`/`powershell`/`cmd` 子树。 | 已补 [daemon-serve-mode/08-extension-endpoints.md](daemon-serve-mode/08-extension-endpoints.md)。 |
| #5893 #5900 | merged | Web Shell chat UI polish 与 host loading phrase customization：权限/问题面板、queued prompt、hover actions、welcome/status、todo/scroll/model/voice 细节，以及 `loadingPhrases` resolver/array/empty-array override。 | 已补 [daemon-serve-mode/11-webui-and-transport.md](daemon-serve-mode/11-webui-and-transport.md)。 |
| #5896 | merged | vendored `qwen-cua-driver` + opt-in 0-1000 relative-coordinate mode：input denormalization、tool/param descriptions、agent instructions、screenshot dimension rewrite、zoom/move_cursor、release/sync workflow。 | 新增 [cua-driver.md](cua-driver.md)。 |
| #5904 | merged | `endLLMRequestSpan` 调用 `recordApiRequestBreakdown`，按 REQUEST_PREPARATION / NETWORK_LATENCY / RESPONSE_PROCESSING 记录 `qwen-code.api.request.breakdown` histogram。 | 已补 [telemetry-observability/README.md](telemetry-observability/README.md) 与 [telemetry-observability/06-genai-ttft-retry-and-metrics.md](telemetry-observability/06-genai-ttft-retry-and-metrics.md)。 |
| #5906 | merged | settings schema 增加 `minimum?: number`，`general.cleanupPeriodDays` 在 daemon API、TUI `/settings` 与 VS Code generated schema 中一致拒绝负数。 | 已补 [daemon-serve-mode/08-extension-endpoints.md](daemon-serve-mode/08-extension-endpoints.md)。 |
| #5828 | merged 2026-06-26 | bundled `/extension-creator` skill：复用 `qwen extensions new` 模板，引导 extension context / commands / skills / agents / MCP server wiring / local linking；不改变 scaffold 行为。 | 已补 [diagnostic-skills.md](diagnostic-skills.md)。 |
| #5849 | merged 2026-06-26 | CLI `@extension` mention：`@` autocomplete 展示 active extensions，选择后插入 `@ext:name`，提交 turn 时注入 extension skills / MCP servers / agents / context files。 | 已补 [diagnostic-skills.md](diagnostic-skills.md)，归入 extension activation。 |

### 2026-06-26 昨日 PR 专项复核

昨天创建的 20 个 PR 中，13 个已合入、7 个仍 open；昨天当天另有 18 个 PR 合入。下表按“昨天创建或昨天合入”双口径复核：除 release / CI / test-only / 小 UI 修正外，需要更新 feature 的 PR 已映射如下。

| PR | 处理结果 |
|---|---|
| #5879 | 从 open 观察转 merged，已更新 MCP resources/prompts：Web Shell `/mcp` resources 链路与实现细节。 |
| #5892 | 已更新 daemon shell/extension endpoint 文档：Windows PTY tree-kill 与 guarded reap。 |
| #5893 #5900 | 已更新 Web Shell/transport 文档：chat polish 与 host loading phrase customization。 |
| #5896 | 已新增 CUA driver 专题，写清楚 vendored fork、相对坐标开关、输入/输出契约改写和验证边界。 |
| #5904 | 已更新 telemetry 总览和深入子文档：LLM request phase breakdown metric。 |
| #5906 | 已更新 daemon settings surface：`cleanupPeriodDays` minimum validation。 |
| #5828 | 虽非 06-26 创建，但 06-26 合入；已更新 diagnostic/creator skills 文档。 |
| #5849 | 虽非 06-26 创建，但 06-26 合入；已更新 diagnostic/creator skills 文档中的 extension activation。 |
| #5807 #5809 | 06-26 合入；IDE stale workspace config ignore 与 serve route split 属于 workspace/daemon 内部边界或重构，本次只登记不新增专题。 |
| #5878 #5880 #5885 #5899 | release / test / CI reliability，覆盖矩阵登记，不新增 feature 专题。 |
| #5891 #5898 | CLI tool-call description wrapping、mid-input skill completion，属于局部 UX/补全修复；暂无对应长期 feature 专题，只在矩阵登记。 |
| #5884 #5888 #5895 #5902 | 仍 open，分别归 sessionless remember、channel qwen tag、session artifacts、QQ Bot streaming，合入后再更新对应 feature。#5886/#5903 已于 2026-06-27 合入并在本轮更新 feature 文档；#5890 已于 2026-06-28 合入并补 [loop-wakeup.md](loop-wakeup.md)。 |

### 2026-06-25 ~ 2026-06-26 已看过但暂不新增专题

| PR | 归属判断 |
|---|---|
| #5727 #5839 #5850 #5872 #5891 #5898 | docs / startup warning / response timestamp consistency / macOS Option-compose Alt+T / tool-call description wrapping / mid-input skill completion，属于用户体验或文档小修；不改变 feature 长期技术方案。 |
| #5792 #5824 #5846 | status line default、auto mode startup copy、thinking-intent loading indicator revert，属于 CLI copy/默认值细节；本轮覆盖矩阵登记，不新增专题。 |
| #5783 | WebFetch userinfo URL 拒绝，属于 WebFetch URL validation 小安全边界；当前 feature 目录未维护独立 WebFetch 专题。 |
| #5811 #5815 | token speed accounting、reasoning_content merge preservation，属于 metrics/provider merge 小修；不单开专题。 |
| #5842 #5851 #5854 #5858 #5859 #5862 #5870 #5878 #5880 #5885 #5899 | CI / release / test reliability，不作为 product feature 技术方案。 |

### 2026-06-25 ~ 2026-06-26 open PR 后续观察

| PR | 当前归属判断 |
|---|---|
| #5847 #5852 #5884 | daemon runtime context injection、resumable ACP stream、sessionless workspace remember；若合入归 daemon/serve 与 memory。 |
| #5848 | UI / transcript rendering polish；若合入归 Web Shell 或 CLI UX。#5869 已于 2026-06-27 合入并在本轮更新 Web Shell 文档。 |
| #5856 | 已于 2026-06-28 合入并补 [voice-dictation.md](voice-dictation.md)：desktop voice dictation。 |
| #5868 | 已于 2026-06-28 合入并补 [context-compression.md](context-compression.md)：auto-compact threshold / Stop hook context usage。 |
| #5888 | qwen tag / multiplayer channel-resident agent RFC，若合入补 [channel-adapters.md](channel-adapters.md)。 |
| #5890 | 已于 2026-06-28 合入并补 [loop-wakeup.md](loop-wakeup.md)：loop task file injection via sentinels。 |
| #5895 | session artifacts daemon API design，若合入补 daemon/serve 或 artifact 专题。 |
| #5902 | QQ Bot streaming idle flush / markdown pipe / replyMsgId TTL，若合入补 [channel-adapters.md](channel-adapters.md)。 |
| #5928 #5926 #5912 | 06-27 新增 open 观察：project-local todo persistence、PR intake evidence gate、ACP permission votes；合入后再补对应专题。#5944 已于 2026-06-28 合入并补 [tool-call-id-integrity.md](tool-call-id-integrity.md)。 |

### 2026-06-25 ~ 2026-06-26 closed / superseded / wrong-base

| PR | 原因 |
|---|---|
| #5843 #5853 #5871 | release/CI merge-queue 或 throwaway validation closed，不作为 feature 实现统计。 |

---

## 2026-06-24（按 2026-06-25 请求口径，全作者）

> 覆盖口径：`QwenLM/qwen-code`，主口径为 `created:2026-06-24` 的全作者、全状态 PR；补充口径为 `merged:2026-06-24` 但创建更早的 PR。统计以 2026-06-25 查询为准：当天创建共 36 个 PR，当前状态 15 merged / 20 open / 1 closed；补充合入但创建更早的 PR 共 9 个，其中 #5654/#5743/#5784 已在前一轮按创建日期覆盖，本次重点补 #5660/#5752/#5755/#5781/#5785/#5788。

### 已落地且需要更新 feature 文档

| PR | 状态 | feature 归属判断 | 文档动作 |
|---|---|---|---|
| #5752 | merged | `QWEN_SERVE_MCP_CLIENT_BUDGET` 严格十进制解析，避免 `Number()` 接受 `0x10` / `1e2` / `1.0` 这类非预期预算写法。 | 已补 [daemon-serve-mode/README.md](daemon-serve-mode/README.md)，作为 daemon MCP client budget 安全边界。 |
| #5755 | merged | Web Shell 语音听写走 daemon：浏览器采集麦克风 PCM，经 `/voice/stream` WebSocket 发给 daemon，daemon 复用现有 ASR pipeline 转写并回填 composer。 | 已补 [voice-dictation.md](voice-dictation.md)、[daemon-serve-mode/README.md](daemon-serve-mode/README.md) 与 [daemon-serve-mode/11-webui-and-transport.md](daemon-serve-mode/11-webui-and-transport.md)。 |
| #5781 | merged | 新增模型可调用 `read_mcp_resource` 工具，通过 server name + URI 在普通 tool-call turn 读取 MCP resource；与用户手输 `@server:uri` 互补。 | 已补 [mcp-resources-prompts.md](mcp-resources-prompts.md)。 |
| #5785 | merged | `qwen serve` slim fast path：先监听再延迟加载 interactive UI / React Ink / web-shell / ACP runtime，并通过 `/daemon/status` 暴露 startup timing。 | 已补 [daemon-serve-mode/README.md](daemon-serve-mode/README.md)。 |
| #5794 | merged | voice ASR transcript fast-model refinement：转写后用 fast model 做保守清理，超时/失败/不安全输出回退 raw transcript。 | 已补 [voice-dictation.md](voice-dictation.md)。 |
| #5797 | merged | SDK prompt 遇到 `invalid_client_id` 时单飞 `resumeSession` 重新注册 clientId，并对 admission-time prompt 重试一次。 | 已补 [daemon-serve-mode/README.md](daemon-serve-mode/README.md)。 |
| #5808 | merged | self-paced `/loop` in-flight 被用户中断时取消 pending one-shot wakeup，防止 Esc 后下一轮自动复活。 | 已补 [loop-wakeup.md](loop-wakeup.md)。 |
| #5812 | merged | Claude MCP server config transport mapping：`type:http|sse|stdio` 规范化为 qwen 的 `httpUrl` / `url` / `command` 字段。 | 已补 [mcp-resources-prompts.md](mcp-resources-prompts.md)，归入 MCP config ingestion 边界。 |
| #5826 | merged | session skill usage stats：统计真实 skill body load 的成功/失败/按技能分组，并通过 daemon stats 与 `/stats skills` 展示。 | 已补 [diagnostic-skills.md](diagnostic-skills.md)、[daemon-serve-mode/README.md](daemon-serve-mode/README.md) 与 [daemon-serve-mode/08-extension-endpoints.md](daemon-serve-mode/08-extension-endpoints.md)。 |
| #5827 | merged | OpenAI-compatible streaming inactivity timeout：stream 长时间无 chunk 时 abort 当前请求并按 `ETIMEDOUT` 走既有 retry 分类。 | 已补 [auth-providers.md](auth-providers.md)。 |

### 已看过但暂不新增专题的 merged PR

| PR | 归属判断 |
|---|---|
| #5660 | `web_fetch` JSON fallback，属于 WebFetch 小边界修复；目前 feature 目录未维护独立 WebFetch 专题，暂只在覆盖矩阵登记。 |
| #5788 | emoji thinking/summary icon 替换，属于 UI copy/presentation 小改；不改变长期 feature 合约。 |
| #5799 | 非 VP 模式 multi-agent 滚动回弹/flicker 修复，属于 TUI rendering bugfix；不单开 feature。 |
| #5801 | browser daemon bundle budget 提升到 126 KiB，属于打包预算调参；不改变 daemon 协议面。 |
| #5803 | pasted image path 自动提升为 attachment，属于输入体验小功能；后续若集中整理 multimodal input 再展开。 |
| #5805 | IDE server port 环境变量校验，属于 IDE lockfile 读取前置防护；不单开 feature。 |
| #5807 | 忽略其它 workspace 的 IDE configs，属于 IDE/workspace 边界小修；本轮登记但不新增专题。 |
| #5809 | serve server routes 拆分，属于 daemon 内部重构；未改变协议面，不写专题正文。 |
| #5810 #5813 #5833 | Linux CI / macOS-Windows tests / CodeQL / merge queue reliability，属于 CI 调度与可靠性；不作为 product feature。 |
| #5815 | assistant turn merge 时保留 `reasoning_content`，属于 provider stream history 合并 bugfix；当前不新增专题。 |
| #5830 | v0.19.2 release PR，只反映版本发布。 |

### open PR 后续观察

| PR | 当前归属判断 |
|---|---|
| #5791 #5802 | CLI keybinding / shortcut 文案修复，若合入归 CLI/TUI UX。 |
| #5835 | 已于 2026-06-28 合入，当前轮按本周状态复核更新 [auth-providers.md](auth-providers.md)。 |
| #5795 | subagent crash notification 带 partial results / recent activities，若合入归 background agent / subagent 诊断。 |
| #5821 | local OpenAI backends 跳过默认 follow-up suggestions，若合入归 auth/provider 或 UX 小修。 |
| #5829 | desktop unsafe source slug deletion guard，若合入归 desktop 安全边界。 |
| #5832 | release flow merge-queue-safe，若合入归 release automation，不写 feature 专题。 |

### closed / superseded / wrong-base

| PR | 原因 |
|---|---|
| #5820 | closed（标题为 `Main`，无可落地 feature）。 |

### 已在前一轮覆盖、本次按状态复核

| PR | 复核结果 |
|---|---|
| #5654 #5743 #5784 | 这些 PR 在 2026-06-24 合入，但已按 06-22~06-23 创建日期纳入上一节并更新对应 feature 文档；本次不重复展开。 |
| #5792 #5793 #5804 #5807 #5809 #5814 #5817 #5818 #5822 #5824 #5825 #5828 | 这些 PR 在 06-24 查询时仍属 open 观察；截至 2026-06-27 已合入或转为本周增量判断，当前处理见 2026-06-25~26 小节。 |

---

## 2026-06-22 ~ 2026-06-23（全作者）

> 覆盖口径：`QwenLM/qwen-code`，`created:2026-06-22..2026-06-23`，全作者，全状态。统计以 2026-06-24 `gh pr list/view` 查询为准，共 127 个 PR：84 merged / 24 open / 19 closed。#5743 等 06-23 创建但 06-24 合入的 PR 仍按创建日期纳入。

### 已落地且需要更新 feature 文档

| PR | 状态 | feature 归属判断 | 文档动作 |
|---|---|---|---|
| #5600 | merged | Dynamic Workflows 的主体完工：nested `workflow()`, stall watchdog/retry, JSONL journal resume, run snapshot, saved slash workflow, keyword trigger, notification, telemetry。 | 已补 [workflow-token-budget.md](workflow-token-budget.md)，并在标题/正文中把它从单点 token budget 扩展为 Dynamic Workflows。 |
| #5679 | merged | agent/workflow integer env var 严格解析，覆盖 `QWEN_CODE_MAX_TOKENS_PER_WORKFLOW`、workflow agent/concurrency 和 background agent 上限。 | 已补 [workflow-token-budget.md](workflow-token-budget.md) 与 [background-agent-resume.md](background-agent-resume.md)。 |
| #5740 | merged | workflow snapshot pruning 防路径穿越：递归删除 journal dir 前验证 runId 形态，恶意 `.json` 只能被 unlink，不能驱动越界 rm。 | 已补 [workflow-token-budget.md](workflow-token-budget.md) 的安全边界。 |
| #5589 | merged | MCP OAuth guidance / runtime recovery：把失效凭据与错误恢复入口指向 `/mcp`，清理过期 `/mcp auth` 文档。 | 已补 [mcp-resources-prompts.md](mcp-resources-prompts.md) 的 OAuth/诊断边界。 |
| #5635 | merged | `/mcp` dialog 新增 resource browser：server resource 列表、detail view、`@server:uri` reference。 | 已补 [mcp-resources-prompts.md](mcp-resources-prompts.md)。 |
| #5733 | merged | `@server:uri` 补全支持按 friendly name/title、大小写不敏感匹配，并在冒号前发现 resource server。 | 已补 [mcp-resources-prompts.md](mcp-resources-prompts.md)。 |
| #5774 | merged | 裸 `@<partial>` 跨 server 全局匹配 resource URI/name，dropdown 保留完整 `server:uri` 引用。 | 已补 [mcp-resources-prompts.md](mcp-resources-prompts.md)。 |
| #5613 | merged | daemon-backed Web Shell `/branch` / `/fork`：REST/SDK/web-shell 命令、transcript adapter、branch/fork 通知与失败文案。 | 已补 [daemon-serve-mode/README.md](daemon-serve-mode/README.md) 与 [daemon-serve-mode/11-webui-and-transport.md](daemon-serve-mode/11-webui-and-transport.md)。 |
| #5638 | merged | `GET /workspace/providers` 变为 daemon 侧 fresh workspace settings/env，表达下一个新 session 的 workspace provider defaults。 | 已补 [daemon-serve-mode/README.md](daemon-serve-mode/README.md) 与 [auth-providers.md](auth-providers.md)。 |
| #5741 | merged | 远程 LSP status route：REST、ACP HTTP/WS、ACP child status extension、TS SDK 只读状态。 | 已补 [daemon-serve-mode/08-extension-endpoints.md](daemon-serve-mode/08-extension-endpoints.md)。 |
| #5743 | merged | workspace permissions API：`GET/POST /workspace/permissions`、ACP ext methods、SDK helpers、malformed rule 校验。 | 已补 [daemon-serve-mode/08-extension-endpoints.md](daemon-serve-mode/08-extension-endpoints.md) 与 [permission-system.md](permission-system.md)。 |
| #5753 | merged | extension mutation 返回 operationId，新增 operation polling，覆盖 queued/running/succeeded/failed/refresh-error 状态。 | 已补 [daemon-serve-mode/08-extension-endpoints.md](daemon-serve-mode/08-extension-endpoints.md)。 |
| #5784 | merged | stale prompt client admission fail-fast：无效 clientId 在 prompt admission 阶段直接 400，不再先 202 后无终态事件。 | 已补 [daemon-serve-mode/README.md](daemon-serve-mode/README.md)。 |
| #5605/#5609/#5628/#5632 | merged | voice native recorder fallback 日志、stop-error 后释放 active state、standalone archive 打包 audio addon、`fastOnly`/`voiceOnly` 模型旗标。 | 已补 [voice-dictation.md](voice-dictation.md)；#5632 同时补 [auth-providers.md](auth-providers.md)。 |
| #5615/#5617 | merged | Artifact host/OSS 发布确认文案说明会离开本机、取消语义、`artifact.autoOpen` settings/schema。 | 已补 [artifact-tool.md](artifact-tool.md)。 |
| #5622/#5754 | merged | `ask_user_question` answer index 严格校验；AUTO 模式对破坏性 git/IaC 命令加 deterministic Layer 0 hard block。 | 已补 [permission-system.md](permission-system.md)。 |
| #5624 | merged | 历史 replay 中 dangling tool call 补合成 failed terminal update，避免恢复 UI 永远 processing。 | 已补 [tool-call-id-integrity.md](tool-call-id-integrity.md)。 |
| #5637/#5654/#5729/#5769 | merged | DashScope `preserve_thinking` 默认开启；auth wizard 恢复自定义模型；configured model list 保留 active runtime model；重复 model display name 按 baseUrl 消歧。 | 已补 [auth-providers.md](auth-providers.md)。 |

### 已看过但暂不新增专题的 merged PR

| PR | 归属判断 |
|---|---|
| #5577 #5578 #5592 #5604 #5607 #5618 #5639 #5646 #5652 #5671 #5676 #5684 #5685 #5688 #5689 #5709 #5711 #5714 #5716 #5718 #5719 #5720 #5724 #5731 #5735 #5737 #5745 #5746 #5764 #5767 #5772 #5788 | CLI completion、命名/大小写 refactor、测试 smoke、整数校验、迁移幂等、ACP/VS Code/extension 小边界、release gate、theme/render 小修等。它们有对应周报归类，但没有改变 feature 目录里的长期技术方案合约，故不单开或大幅改专题。 |
| #5593 #5599 #5627 #5730 #5751 #5757 #5775 | docs / model adapter / TUI viewer / desktop preview / VS Code view / web-shell UI restructure 等用户体验面补强。现阶段进入周报或 daemon/web-shell 后续观察，不新增单独 feature 文档；#5595 已移出本表，见上方 Plan Mode 行。 |
| #5739 #5762 | release PR。只反映版本发布，不作为 feature 实现统计。 |

### open PR 后续观察

| PR | 当前归属判断 |
|---|---|
| #5629 | PreToolUse hook ask TUI confirmation，若合入后归入权限/skills/hook 交互。 |
| #5666 #5773 | TUI transcript view、`/config key=value`，若合入后分别归 TUI/UX、模型配置专题。#5661/#5668 已合入但仍属 TUI/UX 小面，本轮只登记；#5778 已于 2026-06-27 合入并更新 [auth-providers.md](auth-providers.md)。 |
| #5780 #5786 | update command、review suggestion findings。已记录观察点，待合入后再写入对应 feature。#5777 已于 2026-06-28 合入并补 [daemon-serve-mode/](daemon-serve-mode/) 的 daemon-direct Chrome extension / client-hosted MCP 文档。 |

> 状态复核：#5752/#5755/#5781/#5785 在上一轮查询时作为后续观察登记，已于 2026-06-24 合入；#5616/#5650/#5657/#5747/#5765 已于 2026-06-25~26 合入并在本周增量小节补文档；#5783 已按“暂不新增专题”登记。

### closed / superseded / wrong-base

| PR | 原因 |
|---|---|
| #5598 #5606 #5608 #5625 #5651 #5658 #5662 #5674 #5678 #5681 #5691 #5693 #5696 #5699 #5701 #5703 #5705 #5707 #5776 | closed / superseded / wrong-base / draft no-merge。只登记归属判断，不作为已落地 feature。 |

---

## 新增或显著完善的 feature 专题

| PR | 状态 | feature 归属判断 | 文档动作 |
|---|---|---|---|
| #5502 | merged | 独立 voice 输入栈：native/fallback mic capture、batch/realtime ASR、`/voice`、`/model --voice`、VoiceIndicator。 | 新增 [voice-dictation.md](voice-dictation.md)。 |
| #5557 | merged | 独立 Artifact tool：HTML fragment 校验、local/host/OSS publisher、实验开关和权限门控。 | 新增 [artifact-tool.md](artifact-tool.md)。 |
| #5231 | merged | Workflow tool per-run output-token budget 与 `/workflows`/后台任务 UI。 | 新增 [workflow-token-budget.md](workflow-token-budget.md)。 |
| #5544 | merged | MCP prompt/resource discovery 与 `@server:uri` 注入，属于 MCP resources/prompts feature。 | 新增 [mcp-resources-prompts.md](mcp-resources-prompts.md)。 |
| #5182 | merged | second-resolution session wakeup engine，给 self-paced loop 提供底座。 | 新增 [loop-wakeup.md](loop-wakeup.md)。 |
| #5197 | merged | prompt-only `/loop` 改为 self-paced wakeup，替代固定 10m cron。 | 新增 [loop-wakeup.md](loop-wakeup.md)。 |
| #5202 | merged | QQ Bot channel adapter，属于外部 channel adapter feature。 | 新增 [channel-adapters.md](channel-adapters.md)。 |
| #5556 | merged | completed background sub-agent revive + subagent transcript TTL，属于 background agent resume 的后续扩展。 | 已补 [background-agent-resume.md](background-agent-resume.md)。 |
| #5478 | merged | Requesty first-class provider，属于 auth/provider 的 OpenAI-compatible provider 族扩展。 | 已补 [auth-providers.md](auth-providers.md)。 |

---

## Daemon / serve / web-shell

| PR | 状态 | feature 归属判断 | 文档动作 |
|---|---|---|---|
| #5118 | merged | web-shell completed todo per-task token/time detail，属于 daemon Web Shell transcript/UI 归一化。 | 已补 [daemon-serve-mode/11-webui-and-transport.md](daemon-serve-mode/11-webui-and-transport.md)。 |
| #5125 | merged | completed turn collapse，属于 web-shell transcript 展示。 | 已补 [daemon-serve-mode/11-webui-and-transport.md](daemon-serve-mode/11-webui-and-transport.md)。 |
| #5161 | merged | imperative composer API，属于 web-shell embedding/customization surface。 | 已补 [daemon-serve-mode/11-webui-and-transport.md](daemon-serve-mode/11-webui-and-transport.md)。 |
| #5163 | merged | per-turn time/tokens seam，属于 daemon UI metrics surface。 | 已补 [daemon-serve-mode/11-webui-and-transport.md](daemon-serve-mode/11-webui-and-transport.md)。 |
| #5166 | merged | custom footer renderer，属于 web-shell host customization。 | 已补 [daemon-serve-mode/11-webui-and-transport.md](daemon-serve-mode/11-webui-and-transport.md)。 |
| #5174 | merged | `GET /daemon/status` operator diagnostic API。 | 已补 [daemon-serve-mode/README.md](daemon-serve-mode/README.md) 与 W25 daemon 补强表。 |
| #5175 | merged | web-shell mid-turn message injection into running turn。 | 已补 [daemon-serve-mode/11-webui-and-transport.md](daemon-serve-mode/11-webui-and-transport.md) 与 daemon 总表。 |
| #5183 | merged | CLI/ACP/desktop mid-turn 图片保留，横跨 daemon mid-turn 与 multimodal input。 | 已补 daemon/W25 周报；暂不单开 multimodal 专题。 |
| #5190 | merged | web-shell execution display polish，属于 UI 展示小改。 | 归入 [daemon-serve-mode/11-webui-and-transport.md](daemon-serve-mode/11-webui-and-transport.md)，不单开。 |
| #5193 | merged | transcript event change callback，属于 daemon session provider/web-shell sync。 | 已补 [daemon-serve-mode/11-webui-and-transport.md](daemon-serve-mode/11-webui-and-transport.md)。 |
| #5211 | merged | `daemon_status` capability E2E baseline，属于 daemon capability 漂移守护。 | 已补 daemon/serve 近期补强表。 |
| #5216 | merged | ACP daemon sessions 加载 extension commands。 | 已补 [daemon-serve-mode/08-extension-endpoints.md](daemon-serve-mode/08-extension-endpoints.md)。 |
| #5260 | merged | `qwen serve --permission-response-timeout-ms`，属于 serve startup flag + ACP permission timeout。 | 已补 [daemon-serve-mode/README.md](daemon-serve-mode/README.md) 和 [permission-system.md](permission-system.md)。 |
| #5266 | merged | mid-turn event constant + timed-out drain recovery。 | 已补 [daemon-serve-mode/11-webui-and-transport.md](daemon-serve-mode/11-webui-and-transport.md)。 |
| #5392 | merged | release `qwen serve` 默认同源托管 Web Shell SPA，`--open`/`--no-web`。 | 已补 [daemon-serve-mode/11-webui-and-transport.md](daemon-serve-mode/11-webui-and-transport.md)。 |
| #5398 | merged | web-shell extension management：install/enable/disable/update/uninstall/refresh + `extensions_changed`。 | 已补 [daemon-serve-mode/08-extension-endpoints.md](daemon-serve-mode/08-extension-endpoints.md) 与 [daemon-serve-mode/11-webui-and-transport.md](daemon-serve-mode/11-webui-and-transport.md)。 |
| #5484 | merged | serve session reaper timeout validation。 | 已补 daemon/serve 近期补强表；不单开。 |
| #5504 | merged | ACP model-invocable commands。 | 已补 [daemon-serve-mode/08-extension-endpoints.md](daemon-serve-mode/08-extension-endpoints.md)。 |
| #5541 | merged | hosted Web Shell dotfile path fix。 | 已补 [daemon-serve-mode/11-webui-and-transport.md](daemon-serve-mode/11-webui-and-transport.md)。 |
| #5560 | merged | fake OpenAI server for no-AK daemon integration tests。 | 归入 daemon 测试基础设施，不单开 feature。 |

---

## Core / CLI / provider / permission

| PR | 状态 | feature 归属判断 | 文档动作 |
|---|---|---|---|
| #5141 | merged | supported `sed -i` file-history tracking，属 rewind/file history。 | 已在 [conversation-rewind.md](conversation-rewind.md) 覆盖。 |
| #5165 | merged | monitor notification batch drain，属 monitor tool consumption。 | 已在 [monitor-tool.md](monitor-tool.md) 覆盖。 |
| #5179 | merged | duplicate model id provider persistence，属 auth/provider 解析。 | 已在 [auth-providers.md](auth-providers.md) 覆盖。 |
| #5196 | merged | `/dev/tcp`/`/dev/udp` redirect 不当建模为 file I/O，属 permission/shell 解析安全边界。 | 已补 [permission-system.md](permission-system.md)；暂不单开。 |
| #5218 | merged | cancelled `ask_user_question` 后停止 ACP turn。 | 已在 [permission-system.md](permission-system.md) 覆盖。 |
| #5258 | merged | cancelled 普通工具权限后停止 ACP turn。 | 已在 [permission-system.md](permission-system.md) 覆盖。 |
| #5279/#5564/#5573 | merged | per-turn tool-call circuit breaker、non-interactive loop failure、consecutive identical tool-call always-on guard，属 tool loop / runaway 防护。 | 已补 [tool-call-id-integrity.md](tool-call-id-integrity.md)。 |
| #5311/#5433/#5595 | merged | plan mode `exit_plan_mode` 显示、opt-in prompt、手动进入后的确认框，属 plan-mode UX/safety。 | 新增 [plan-mode.md](plan-mode.md)。 |
| #5367 | merged | MCP OAuth token file 首次保存时创建文件，属 MCP OAuth/runtime recovery。 | 已补 [mcp-resources-prompts.md](mcp-resources-prompts.md)。 |
| #5404 | merged | custom provider models install 后保留，属 auth/provider provider preset。 | 已补 [auth-providers.md](auth-providers.md) 的近期覆盖表。 |
| #5409 | merged | broad shell self-kill commands 前置拦截，属 permission/shell safety。 | 已补 [permission-system.md](permission-system.md)。 |
| #5478 | merged | Requesty first-class provider。 | 已补 [auth-providers.md](auth-providers.md)。 |
| #5539 | merged | OpenRouter/Requesty provider classes 收敛到 preset customHeaders，属 provider 内部重构。 | 已补 [auth-providers.md](auth-providers.md) 的近期覆盖表。 |
| #5553 | merged | bare fast model 保持当前 auth，属 provider/model fallback。 | 已补 [auth-providers.md](auth-providers.md)。 |

---

## Extension / channels / desktop / docs / CI

| PR | 状态 | feature 归属判断 | 文档动作 |
|---|---|---|---|
| #5289 | merged | extension displayName/description i18n，属 extension packaging/UI。 | 当前仅周报记录；若 extension feature 继续扩展再单开专题。 |
| #5369 | merged | preserve workspace trust state for extensions，属 extension trust state。 | 周报记录；与 #5398 管理面相关但不是独立 feature。 |
| #5414/#5415/#5416/#5417 | merged | QQ Bot token/gateway/timer/path 稳定性修复。 | 已补 [channel-adapters.md](channel-adapters.md)。 |
| #5122 | merged | computer-use screenshot max dimension，属 computer-use 适配参数。 | 小功能；周报记录，不单开。 |
| #5145 | merged | input placeholder follow-up suggestion。 | CLI UX 小功能；周报记录，不单开。 |
| #5187 | merged | `qwen sessions list --json --limit`。 | CLI session command；周报记录，不单开。 |
| #5220 | merged | TUI/web-shell tool display names i18n。 | 横跨 UI badge，本次归入 daemon/web-shell 记录，不单开。 |
| #5284 | merged | desktop macOS 26+ Liquid Glass Assets.car。 | desktop packaging/asset 小功能；周报记录。 |
| #5401 | merged | optional response token rate。 | CLI statusline metric 小功能；周报记录。 |
| #5203 | merged | on-demand tmux real-user testing。 | CI/验证基础设施，不作为 feature 专题。 |
| #5233 | merged | autofix issue-fix/review-response lifecycle。 | CI/automation，不作为 feature 专题。 |
| #5547 | merged | triage review check 文档。 | docs/process，不作为 product feature 专题。 |
| #5561 | merged 2026-06-25 | MCP servers live reconcile on settings change。 | 上周查询时为 open；本周合入后已在 2026-06-25~26 增量小节和 [mcp-resources-prompts.md](mcp-resources-prompts.md) 补正文。 |

---

## 不作为 feature 实现统计

| PR | 状态 | 原因 |
|---|---|---|
| #5148 #5151 #5162 #5170 #5195 #5217 #5232 #5240 #5242 #5405 #5406 #5507 #5513 #5519 #5571 | closed | closed / superseded / wrong-base / test-only 草稿；不计为已落地 feature。 |
| release / version bump PRs | merged | v0.18.x release、desktop release、VS Code companion publish 等只反映发布动作，不单独进入 feature 技术方案。 |
| 大量 path/URL/schema/i18n/desktop/parser 小修 | merged | 归入对应周报主题分组；除改变 feature 合约或安全边界者外，不单开专题。 |

_更新于 2026-06-27_
