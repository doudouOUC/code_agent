# qwen-code PRs · 2026-05-25 ~ 2026-05-31  (W22)

**主题**: daemon 新端点（recap/btw/tasks/shell）、serve T2.x、daemon prompt 链路追踪、集成合并

**统计**: 23 PRs — 14 merged / 6 open / 3 closed
**代码量**: +153,167 / -35,166，1000 个文件变更
**类型**: feat ×17, fix ×3, chore ×2, refactor ×1
**范围 (scope)**: serve ×8, telemetry ×5, daemon ×6, integration ×2, core ×1, sdk ×1, rewind ×1

**本周最大改动**:
- [#4490](https://github.com/QwenLM/qwen-code/pull/4490) (+93283/-22535, 489 files) chore(integration): merge daemon_mode_b_main into main — F1/F2/F3/F4-prereq + F5 alpha docs batch (#4175)
- [#4608](https://github.com/QwenLM/qwen-code/pull/4608) (+32913/-8576, 232 files) feat(telemetry): add tool spans and session.id to daemon/ACP path
- [#4563](https://github.com/QwenLM/qwen-code/pull/4563) (+6622/-2236, 39 files) refactor(serve): extract DaemonWorkspaceService from AcpSessionBridge (issue #4542, 方案 C)

| PR | 状态 | 类型 | 标题 | 变更 | 文件 | 创建 | 合并/关闭 | 链接 |
|---|---|---|---|---|---|---|---|---|
| #4490 | 🟡 open | chore(integration) | chore(integration): merge daemon_mode_b_main into main — F1/F2/F3/F4-prereq + F5 alpha docs batch (#4175) | +93283/-22535 | 489 | 05-25 | — | https://github.com/QwenLM/qwen-code/pull/4490 |
| #4499 | ✅ merged | fix(telemetry) | fix(telemetry): attach interaction span to session root context _[type/bug]_ | +59/-6 | 2 | 05-25 | 05-27 | https://github.com/QwenLM/qwen-code/pull/4499 |
| #4500 | ✅ merged | chore(integration) | chore(integration): sync main into daemon_mode_b_main (2026-05-25) | +501/-0 | 7 | 05-25 | 05-25 | https://github.com/QwenLM/qwen-code/pull/4500 |
| #4504 | ✅ merged | feat(serve) | feat(serve): add POST /session/:id/recap | +621/-11 | 19 | 05-25 | 05-26 | https://github.com/QwenLM/qwen-code/pull/4504 |
| #4505 | 🟡 open | fix(core) | fix(core): emit enable_thinking on DashScope when reasoning is disabled _[type/bug]_ | +331/-5 | 2 | 05-25 | — | https://github.com/QwenLM/qwen-code/pull/4505 |
| #4507 | ✅ merged | feat(daemon) | feat(daemon): server-pushed followup_suggestion event for the webui | +1154/-22 | 18 | 05-25 | 05-27 | https://github.com/QwenLM/qwen-code/pull/4507 |
| #4515 | ⬜ closed | feat(serve+sdk) | feat(serve+sdk): add GET /session/:id/stats + /export (#4514 T2.5+T2.6) | +1741/-0 | 18 | 05-25 | 05-26 | https://github.com/QwenLM/qwen-code/pull/4515 |
| #4516 | ⬜ closed | feat(serve) | feat(serve): POST /session/:id/compress + POST /session/:id/_meta (T1.3 + T1.4 from #4514) | +2860/-6 | 22 | 05-25 | 05-26 | https://github.com/QwenLM/qwen-code/pull/4516 |
| #4527 | ✅ merged | feat(serve) | feat(serve): --allow-origin <pattern> CORS allowlist (T2.4 #4514) | +860/-23 | 10 | 05-26 | 05-26 | https://github.com/QwenLM/qwen-code/pull/4527 |
| #4530 | ✅ merged | feat(serve) | feat(serve): prompt absolute deadline + SSE writer idle timeout (#4514 T2.9) | +1458/-151 | 12 | 05-26 | 05-26 | https://github.com/QwenLM/qwen-code/pull/4530 |
| #4552 | ✅ merged | feat(serve) | feat(serve): runtime MCP server add/remove (T2.8 #4514) | +2969/-31 | 23 | 05-26 | 05-30 | https://github.com/QwenLM/qwen-code/pull/4552 |
| #4556 | ✅ merged | feat(telemetry) | feat(telemetry): trace daemon prompt lifecycle | +1325/-424 | 14 | 05-26 | 05-29 | https://github.com/QwenLM/qwen-code/pull/4556 |
| #4559 | ✅ merged | feat(serve) | feat(serve): add daemon file logger (#4548) _[DDAR]_ | +3028/-217 | 14 | 05-26 | 05-27 | https://github.com/QwenLM/qwen-code/pull/4559 |
| #4563 | 🟡 open | refactor(serve) | refactor(serve): extract DaemonWorkspaceService from AcpSessionBridge (issue #4542, 方案 C) | +6622/-2236 | 39 | 05-27 | — | https://github.com/QwenLM/qwen-code/pull/4563 |
| #4576 | ✅ merged | feat(daemon) | feat(daemon): server-side shell command execution for ! (bang) prefix | +356/-10 | 16 | 05-27 | 05-28 | https://github.com/QwenLM/qwen-code/pull/4576 |
| #4578 | ✅ merged | feat(daemon) | feat(daemon): add session tasks snapshot endpoint | +934/-4 | 26 | 05-27 | 05-28 | https://github.com/QwenLM/qwen-code/pull/4578 |
| #4580 | ✅ merged | fix(rewind) | fix(rewind): false "compressed turn" error when mid-turn messages exist | +51/-7 | 6 | 05-28 | 05-29 | https://github.com/QwenLM/qwen-code/pull/4580 |
| #4606 | ✅ merged | feat(daemon) | feat(daemon): add request-level logging for serve routes | +178/-6 | 4 | 05-28 | 05-29 | https://github.com/QwenLM/qwen-code/pull/4606 |
| #4608 | ⬜ closed | feat(telemetry) | feat(telemetry): add tool spans and session.id to daemon/ACP path | +32913/-8576 | 232 | 05-28 | 05-29 | https://github.com/QwenLM/qwen-code/pull/4608 |
| #4610 | 🟡 open | feat(daemon) | feat(daemon): add POST /session/:id/btw endpoint for side questions | +385/-128 | 11 | 05-28 | — | https://github.com/QwenLM/qwen-code/pull/4610 |
| #4628 | 🟡 open | feat(telemetry) | feat(telemetry): add client_id attribute and permission route spans | +167/-10 | 6 | 05-29 | — | https://github.com/QwenLM/qwen-code/pull/4628 |
| #4630 | 🟡 open | feat(telemetry) | feat(telemetry): add tool spans and session.id to daemon/ACP path | +1115/-742 | 4 | 05-29 | — | https://github.com/QwenLM/qwen-code/pull/4630 |
| #4646 | ✅ merged | feat(daemon) | feat(daemon): clamp oversized inline media on the prompt path | +256/-16 | 6 | 05-30 | 05-31 | https://github.com/QwenLM/qwen-code/pull/4646 |

---

## PR 解决问题与实现方式

> 来源：同目录 `review.md` 的逐 PR diff 审查，结合 PR 状态与标题压缩成“解决了什么问题 / 怎么做的”。open/closed PR 只记录当前观察，不写成已落地实现。

| PR | 解决了什么问题 | 怎么做的 |
|---|---|---|
| [#4490](https://github.com/QwenLM/qwen-code/pull/4490) | 仍在观察，尚未作为已落地实现；当前目标是 超大集成 PR；body 严重过期 + 自相矛盾 + 有冲突。 | 声称区域确实都在（acp-bridge 23 / core 97 / docs 32 含 qwen-serve*.md / webui 53 / sdk 48）；但大量未描述范围：web-shell 109 文件（全新增、body 只字未提）、cli 103、channels 5、vscode-ide-companion 6。巨型合并典型风险：6 包 / 489 文件，几乎不可逐行审； |
| [#4499](https://github.com/QwenLM/qwen-code/pull/4499) | 干净修复，对应 #4486 | 以 `getSessionContext() ?? otelContext.active()` 作为 `startInteractionSpan` 的父 context，正是 issue 建议的修法；`clearSessionTracingForTesting` 里 `setSessionContext(undefined)` 卫生处理也已实现。 |
| [#4504](https://github.com/QwenLM/qwen-code/pull/4504) | 功能完整；body 把"无取消"说成"断连即取消" | route、capability `session_recap`、ext-method `qwen/control/session/recap`、`bridge.generateSessionRecap`、SDK `recapSession`/`recap`、docs、tests 全部到位。逻辑无 bug；ACP 侧传 never-abort signal，bridge 有 60s backstop。 |
| [#4505](https://github.com/QwenLM/qwen-code/pull/4505) | 仍在观察，尚未作为已落地实现；当前目标是 修复有效；body 漏说 model gate，pipeline gate 口径存疑。 | 核心修复对（去掉死的 `'enable_thinking' in typed` 守卫）； |
| [#4507](https://github.com/QwenLM/qwen-code/pull/4507) | 纯增量，护栏完善 | SDK schema（events/normalizer/types/transcript/store/terminal）、bridge `extNotification` 解 `qwen/notify/session/prompt-suggestion`→`followup_suggestion`、`Session.#maybeEmitFollowupSuggestion` fire-and-forget、webui `useDaemonFollowupSuggestio… |
| [#4515](https://github.com/QwenLM/qwen-code/pull/4515) | 未作为已落地实现；实现扎实，因与 /prompt 重复关闭（非 superseded）。 | stats/export 两路由、`qwen/status/session/{stats,export}` ext-method、能力标签、SDK `sessionStats`/`sessionExport` 与 `parseAttachmentFilename`(RFC5987) 均与描述吻合。GET 只读、继承全局 `bearerAuth`/CORS/`hostAllowlist`； |
| [#4516](https://github.com/QwenLM/qwen-code/pull/4516) | 未作为已落地实现；质量高，作为可选/产品决策关闭。 | compress 双 409(`compaction_in_flight`/`prompt_in_flight`)、NOOP 不发事件、`_meta` key 正则 / `qwen.` 保留 / 8KB 上限、full-bag `session_meta_changed`、`/context` 回显 `state.meta` 全部落实。 |
| [#4527](https://github.com/QwenLM/qwen-code/pull/4527) | CORS 白名单安全细致 | `--allow-origin`(可重复)、`parseAllowOriginPatterns`+`InvalidAllowOriginPatternError`、`allowOriginCors` 中间件、条件 tag、`*`+无 token 启动拒绝（双重）、docs、向后兼容分支齐全。`new URL().origin===entry` 严校验；`Origin:null` 即便 `*` 也拒；两路均 `Vary:Origin`；拒绝路径不漏 CORS 头； |
| [#4530](https://github.com/QwenLM/qwen-code/pull/4530) | 代码正确；body 夸大 FIXME 修复 + 错述 <15s 空闲行为 | 两 flag + env fallback(`parseDeadlineEnv`)、boot 校验、条件 tag、`resolvePromptDeadlineMs`(Math.min 封顶)、`Promise.race` 硬 504、idle timer + `lastWriteAt`、SDK `deadlineMs` + `DAEMON_ERROR_KINDS` 镜像。 |
| [#4552](https://github.com/QwenLM/qwen-code/pull/4552) | body 漏说 env/headers 静默剥离，运行时加鉴权 MCP 不可用 | 路由/事件/能力标签/错误种类/SDK helper/预算与幂等替换均吻合；但 body 未提及服务端会静默剥离 `trust/env/cwd/oauth/headers/authProviderType/includeTools/excludeTools/type`（仅 docs 第 54 行有写，且 SDK `MCPServerConfigShape` 仍声明这些字段）。 |
| [#4556](https://github.com/QwenLM/qwen-code/pull/4556) | 扎实的 daemon 遥测地基；"Closes #4554" 偏乐观 | daemon `initializeTelemetry`/`shutdownTelemetry`、route span(`daemonTelemetryMiddleware`/`withDaemonRequestSpan`)、bridge 生命周期 span(spawn/initialize/session.new/cancel/close)、W3C 传播(`injectDaemonTraceContext`→`extract`)、FIFO 还原(`runWithDaemo… |
| [#4559](https://github.com/QwenLM/qwen-code/pull/4559) | 高质量日志特性；"Closes #4548" 未实际关联 | `daemonLogger.ts`(init/info/warn/error/raw/latest symlink/降级/opt-out)、`bridgeOptions.onDiagnosticLine`、`spawnChannel` stderr 转发、`runQwenServe`(daemonLog + shutdown flush)、`server.sendBridgeError`→`daemonLog.error` 全部落地。 |
| [#4563](https://github.com/QwenLM/qwen-code/pull/4563) | 仍在观察，尚未作为已落地实现；当前目标是 方案 C 抽取扎实；preflight 非行为保持 + initWorkspace 描述夸大。 | 大体忠实落地方案 C：status 方法经回调委托回 bridge，file 走 `fsFactory.forRequest(ctx)`，auth/agents/memory 为薄委托，REST + ACP 一致地 `bridge.*`→`workspace.*` 并穿 `ctx`，HTTP/ACP 面不变。 |
| [#4576](https://github.com/QwenLM/qwen-code/pull/4576) | 主路径正确安全；channels 路径 inert + `this` 绑定隐患（已核验） | HTTP `POST /session/:id/shell`、`bridge.executeShellCommand`、SDK `shellCommand`、web-shell `sendShellCommand`、`sessionShellHistory` 注入、`user_shell_*` SSE 均到位； |
| [#4578](https://github.com/QwenLM/qwen-code/pull/4578) | 干净只读快照，V1 范围诚实 | `GET /session/:id/tasks`、status extMethod `sessionTasks`、`bridge.getSessionTasksStatus`(走 `requestSessionStatus` 绕过 prompt FIFO，有专门测试)、SDK helpers、web-shell `handleTasksSlashCommand` 本地拦截全部到位。 |
| [#4580](https://github.com/QwenLM/qwen-code/pull/4580) | 正确最小修复，对应 #4579 | 实现 issue 建议的修法：加 `NOTIFICATION` 枚举，live(`useGeminiStream.ts`)+resume(`resumeHistoryUtils.ts` mid_turn) 从 `user`→`notification`，更新 4 测试 + 1 回归测试。`isRealUserTurn` 对非 `'user'` 返回 false，消除错配；`HistoryItemNotification` 已在 union 中（仅枚举改动可编译）； |
| [#4606](https://github.com/QwenLM/qwen-code/pull/4606) | 合理请求级日志；小文档遗漏（heartbeat） | （略宽）— access-log 中间件(method/path/sessionId/clientId/status/durationMs，注册在 bearerAuth/json 之前)、各路由 inline 日志(spawn/attach、prompt enqueue + completed/failed、cancel、recap、shell、SSE open/close)、全部 gated on `daemonLog`； |
| [#4608](https://github.com/QwenLM/qwen-code/pull/4608) | 未作为已落地实现；错基分支废弃产物，已被 #4630 取代。 | body 描述一个聚焦的遥测改动（给 llm_request/tool/tool.execution 加 `session.id`、包裹 `Session.runTool`、turn 末 `conversation_finished`、cron 包 `withInteractionSpan`），但 diff 达 232 文件 / +32913。 |
| [#4610](https://github.com/QwenLM/qwen-code/pull/4610) | 仍在观察，尚未作为已落地实现；当前目标是 干净 well-scoped；clientId 未用。 | `POST /session/:id/btw`(server.ts)、`generateSessionBtw`(bridge.ts)、`sessionBtw` ext-method(acpAgent.ts)、共享 `buildBtwPrompt`/`buildBtwCacheSafeParams`(core/btwUtils.ts)、`supportedModes:['interactive','acp']`、`session_btw… |
| [#4628](https://github.com/QwenLM/qwen-code/pull/4628) | 仍在观察，尚未作为已落地实现；当前目标是 小而正确的遥测增强；helper 未接线。 | `qwen-code.client_id` 加到 request span(经 `CLIENT_ID_RE`/`MAX_CLIENT_ID_LENGTH` 校验)与 `prompt.dispatch` span；permission 路由在 `resolveDaemonTelemetryRoute` 匹配并加 `qwen-code.daemon.permission.request_id`； |
| [#4630](https://github.com/QwenLM/qwen-code/pull/4630) | 仍在观察，尚未作为已落地实现；当前目标是 #4608 的干净重写，正确实现 #4602。 | Milestone 1：`session.id` 经 `resolveSessionId`(session-tracing.ts) 加到 llm_request/tool/tool.execution。 |
| [#4646](https://github.com/QwenLM/qwen-code/pull/4646) | 限制 prompt path 中过大的 inline media，避免 base64 图片直接撑爆模型输入或 daemon/ACP 传输。 | 新增 `inlineMediaLimit` 工具，按 `QWEN_CODE_MAX_INLINE_MEDIA_BYTES` / 默认 10MB 估算 base64 解码大小；超限 image part 降级为文本 placeholder，CLI ACP session 与 ACP HTTP dispatch 共用该边界，并补大小估算和降级测试。 |
