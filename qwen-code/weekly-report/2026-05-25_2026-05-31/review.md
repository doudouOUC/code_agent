# qwen-code PR 审查 · 2026-05-25 ~ 2026-05-31 (W22)

**审查方法**：逐个 PR 拉取 _关联 issue + PR 描述 + 代码 diff_，核对三件事 —— (1) 描述↔实现 **一致性**；(2) 描述 **准确性**（是否夸大/过期/遗漏、issue 是否对应）；(3) 代码 **正确性**（逻辑/边界/竞态/错误处理/安全）。大型 PR（#4490 489 文件、#4608 232 文件）按文件分组抽样评估，非逐行。

**评级**：✅ 良好 / ⚠️ 有出入或小隐患 / ❌ 明显不符

> 说明：本周多数 feature PR 合并进集成分支 `daemon_mode_b_main`（非 `main`），本地 main 暂无这些代码，故结论以 PR diff 为准。#4576、#4504 的关键结论已用 `gh pr diff` 二次核验。

---

## 汇总

| PR | 状态 | 一致性 | 正确性 | 一句话 |
|---|---|---|---|---|
| [#4490](https://github.com/QwenLM/qwen-code/pull/4490) | open | ⚠️ | ⚠️ | 超大集成 PR；body 严重过期 + 自相矛盾 + 有冲突 |
| [#4499](https://github.com/QwenLM/qwen-code/pull/4499) | merged | ✅ | ✅ | 干净修复，对应 #4486 |
| [#4500](https://github.com/QwenLM/qwen-code/pull/4500) | merged | ✅ | ✅ | 正常 main→分支同步，body 与 squash 一致 |
| [#4504](https://github.com/QwenLM/qwen-code/pull/4504) | merged | ⚠️ | ✅ | 功能完整；body 把"无取消"说成"断连即取消" |
| [#4505](https://github.com/QwenLM/qwen-code/pull/4505) | open | ⚠️ | ⚠️ | 修复有效；body 漏说 model gate，pipeline gate 口径存疑 |
| [#4507](https://github.com/QwenLM/qwen-code/pull/4507) | merged | ✅ | ✅ | 纯增量，护栏完善 |
| [#4515](https://github.com/QwenLM/qwen-code/pull/4515) | closed | ✅ | ✅ | 实现扎实，因与 /prompt 重复关闭（非 superseded） |
| [#4516](https://github.com/QwenLM/qwen-code/pull/4516) | closed | ✅ | ✅ | 质量高，作为可选/产品决策关闭 |
| [#4527](https://github.com/QwenLM/qwen-code/pull/4527) | merged | ✅ | ✅ | CORS 白名单安全细致 |
| [#4530](https://github.com/QwenLM/qwen-code/pull/4530) | merged | ⚠️ | ✅ | 代码正确；body 夸大 FIXME 修复 + 错述 <15s 空闲行为 |
| [#4552](https://github.com/QwenLM/qwen-code/pull/4552) | merged | ⚠️ | ⚠️ | body 漏说 env/headers 静默剥离，运行时加鉴权 MCP 不可用 |
| [#4556](https://github.com/QwenLM/qwen-code/pull/4556) | merged | ✅ | ✅ | 扎实的 daemon 遥测地基；"Closes #4554" 偏乐观 |
| [#4559](https://github.com/QwenLM/qwen-code/pull/4559) | merged | ✅ | ✅ | 高质量日志特性；"Closes #4548" 未实际关联 |
| [#4563](https://github.com/QwenLM/qwen-code/pull/4563) | open | ⚠️ | ⚠️ | 方案 C 抽取扎实；preflight 非行为保持 + initWorkspace 描述夸大 |
| [#4576](https://github.com/QwenLM/qwen-code/pull/4576) | merged | ⚠️ | ⚠️ | 主路径正确安全；channels 路径 inert + `this` 绑定隐患（已核验） |
| [#4578](https://github.com/QwenLM/qwen-code/pull/4578) | merged | ✅ | ✅ | 干净只读快照，V1 范围诚实 |
| [#4580](https://github.com/QwenLM/qwen-code/pull/4580) | merged | ✅ | ✅ | 正确最小修复，对应 #4579 |
| [#4606](https://github.com/QwenLM/qwen-code/pull/4606) | merged | ✅ | ✅ | 合理请求级日志；小文档遗漏（heartbeat） |
| [#4608](https://github.com/QwenLM/qwen-code/pull/4608) | closed | ❌ | — | 错基分支废弃产物，已被 #4630 取代 |
| [#4610](https://github.com/QwenLM/qwen-code/pull/4610) | open | ✅ | ✅ | 干净 well-scoped；clientId 未用 |
| [#4628](https://github.com/QwenLM/qwen-code/pull/4628) | open | ✅ | ✅ | 小而正确的遥测增强；helper 未接线 |
| [#4630](https://github.com/QwenLM/qwen-code/pull/4630) | open | ✅ | ✅ | #4608 的干净重写，正确实现 #4602 |

**一致性**：✅ 14 / ⚠️ 7 / ❌ 1　　**正确性**：✅ 16 / ⚠️ 5 / —（轻审）1

---

## 总体结论

- **合并代码无严重正确性 bug**：merged PR 的逻辑/护栏普遍扎实，测试覆盖到位。唯一被定位到的真实潜在 bug（#4576 channels 路径 `this` 绑定）目前处于 inert（不可达）路径，无线上影响，但接通该路径前必须修。
- **主要问题集中在「描述与实现的出入」**，而非代码错误：多处 PR body 夸大或过期 —— #4490（文件数/PR 数偏差约 3×、out-of-scope 条目自相矛盾）、#4504（取消行为）、#4530（FIXME 修复 + 空闲行为）、#4552（遗漏 env/headers 剥离）、#4563（initWorkspace 修复）。建议把"描述准确性"作为本人提 PR 时的固定自检项。
- **"Closes #xxx" 多次未真正关联**（#4548、#4554 等仍 open）：body 写了 Closes 但 `closingIssuesReferences` 为空，issue 不会自动关闭——可能是跨分支 PR 的副作用，值得确认。
- **重点跟进见文末清单**（区分 open 可改 / merged 仅记录）。

---

## 逐 PR 明细

### #4490 chore(integration): merge daemon_mode_b_main into main — F1/F2/F3/F4-prereq + F5 alpha docs batch (#4175)
- **状态**: open（draft，**mergeable=dirty / 有冲突**）| **关联 issue**: #4175（Mode B `qwen serve` daemon 史诗 / 分批回流策略）
- **一致性**: ⚠️ — 声称区域确实都在（acp-bridge 23 / core 97 / docs 32 含 qwen-serve*.md / webui 53 / sdk 48）；但**大量未描述范围**：web-shell 109 文件（全新增、body 只字未提）、cli 103、channels 5、vscode-ide-companion 6。
- **正确性**: ⚠️ — 巨型合并典型风险：6 包 / 489 文件，几乎不可逐行审；mergeable=dirty（body 自列的"先 sync main"前置未完成）；仍为 draft。
- **结论**: 范围在扩、描述已脱节、且冲突未解的超大集成 PR；合并前必须刷新 body 并解决冲突。

### #4499 fix(telemetry): attach interaction span to session root context
- **状态**: merged | **关联 issue**: #4486（interaction span 的 trace id 不对）
- **一致性**: ✅ — 以 `getSessionContext() ?? otelContext.active()` 作为 `startInteractionSpan` 的父 context，正是 issue 建议的修法；`clearSessionTracingForTesting` 里 `setSessionContext(undefined)` 卫生处理也已实现。
- **描述准确性**: 准确，对应 #4486；"为何不用 resolveParentContext（interaction = turn 边界）"论证合理。小瑕：body 说 "2 new tests"，实际加了 3 个 `it()`。
- **正确性**: ✅ — 核对 6 处 `startSpan` 仅 interaction 缺 ctx，其余 5 处用 `resolveParentContext`；绕过 resolveParentContext 对 turn 边界正确且有测试。
- **结论**: 干净、正确、测试充分的一行修复，忠实对应 #4486。

### #4500 chore(integration): sync main into daemon_mode_b_main (2026-05-25)
- **状态**: merged | **关联 issue**: 无（chore）
- **描述准确性**: 异常详尽诚实——主动披露 50 个既有 tsc error 与明确的 out-of-scope 项。
- **正确性**: ✅ — 纯集成；冲突解决（如 text-buffer 采用 main 的 `useRef`）合理。未逐行复核全部 13 处解决。
- **结论**: 正常的周期性 main→分支同步，描述忠实镜像 squash commit。

### #4504 feat(serve): add POST /session/:id/recap
- **状态**: merged | **关联 issue**: 无直接 closing ref；正文引用 #4175，#4514 已登记为 shipped
- **一致性**: ✅ — route、capability `session_recap`、ext-method `qwen/control/session/recap`、`bridge.generateSessionRecap`、SDK `recapSession`/`recap`、docs、tests 全部到位。
- **描述准确性**: ⚠️ — body 的 Architecture 称 "client disconnect aborts the bridge-side wait"，但 **PR 自带 docs 明写 "Cancellation is absent in v1，route 不监听断连，无 AbortSignal"**（已 `gh pr diff` 核验），且 route 确无 `res.on('close')`——正文与落地自相矛盾。
- **正确性**: ✅ — 逻辑无 bug；ACP 侧传 never-abort signal，bridge 有 60s backstop。非严格门 + 无限流 → 纯 token 成本可被刷（已在 qwen-serve.md 记为 known limit）。
- **结论**: 功能完整可靠，唯正文关于"取消"的描述与实际"无取消"实现冲突。

### #4505 fix(core): emit enable_thinking on DashScope when reasoning is disabled
- **状态**: open | **关联 issue**: #4501（side-query 关思考没传到 qwen3）
- **一致性**: ⚠️ — 核心修复对（去掉死的 `'enable_thinking' in typed` 守卫）；但 body 称"isDashScopeProvider 门控、无条件设置、镜像 deepseek 分支"，**遗漏了实际还有 model-name 门**（`model.startsWith('qwen') || model === 'coder-model'`，含非显然的 `coder-model` 特例），而 deepseek 分支其实没有 model 门。该差异只在代码注释/测试里，summary 没写。
- **描述准确性**: 大体准确（证据来自 #4501），但 "unconditional/mirroring deepseek" 不精确。
- **正确性**: ⚠️ — 对上报场景有效（已核 `dashscope.ts:buildRequest` 把 `extra_body` 拍平到顶层）；其 model-name 门基于 `request.model`（即 side-query 运行时模型，符合预期、非缺陷）；唯 body 的 "unconditional / mirroring deepseek" 表述偏宽，未提及该门（`qwen*`/`coder-model`）。〔深挖更正：此前"基于 config.model"的判断有误。〕
- **结论**: 对上报路径是正确、有测试的修复；但 body 低估了 model-name 门，建议补充并确认 pipeline 门口径。

### #4507 feat(daemon): server-pushed followup_suggestion event for the webui
- **状态**: merged | **关联 issue**: 无（webui followup，属 #4175 系）
- **一致性**: ✅ — SDK schema（events/normalizer/types/transcript/store/terminal）、bridge `extNotification` 解 `qwen/notify/session/prompt-suggestion`→`followup_suggestion`、`Session.#maybeEmitFollowupSuggestion` fire-and-forget、webui `useDaemonFollowupSuggestion` 全有。
- **描述准确性**: 准确；诚实声明 Session.test 与 webui hook 仅 CI 验证、复用 `enableFollowupSuggestions`。
- **正确性**: ✅ — IIFE 吞错并检查 `ac.signal.aborted`；`followupAbort` 在 prompt 顶部与 `cancelPendingPrompt` 中止，finally 用 `=== ac` 防误清。小瑕：bridge 封顶 `MAX_SUGGESTION_LENGTH(500)` 但 SDK 校验仅查非空（生产侧已封顶，无实害）。
- **结论**: 纯增量、护栏完善，未见真 bug。

### #4515 feat(serve+sdk): add GET /session/:id/stats + /export (#4514 T2.5+T2.6)
- **状态**: closed（未合并）| **关联 issue**: #4514（daemon serve HTTP/SSE 能力 backlog 史诗）
- **一致性**: ✅ — stats/export 两路由、`qwen/status/session/{stats,export}` ext-method、能力标签、SDK `sessionStats`/`sessionExport` 与 `parseAttachmentFilename`(RFC5987) 均与描述吻合。
- **描述准确性**: 准确；关闭评论说明因 `/prompt` 透传已覆盖、降级为可选（**非拆分到新 PR**），可按需 reopen。
- **正确性**: ✅ — GET 只读、继承全局 `bearerAuth`/CORS/`hostAllowlist`；`loadNormalizedSessionData` 用 `sessionOrThrow` 挡路径穿越，ENOENT/EACCES 分流，filename 剥 CRLF，export 校验 format。
- **结论**: 实现扎实完整，仅因与 `/prompt` 重复被作为可选项关闭。

### #4516 feat(serve): POST /session/:id/compress + POST /session/:id/_meta (T1.3 + T1.4)
- **状态**: closed（未合并）| **关联 issue**: #4514（同上史诗）
- **一致性**: ✅ — compress 双 409(`compaction_in_flight`/`prompt_in_flight`)、NOOP 不发事件、`_meta` key 正则 / `qwen.` 保留 / 8KB 上限、full-bag `session_meta_changed`、`/context` 回显 `state.meta` 全部落实。
- **描述准确性**: body 标 T1.3/T1.4 为 Tier-1，但 #4514 复盘已重分类为可选；关闭评论指出 `_meta` v1 不注入后续 prompt，未完全满足 #3803 原意。
- **正确性**: ✅ — C1（先解析 clientId 再改状态）、C2（`extPromise.finally` 清 flag 防 setHistory 竞态）到位；唯一权衡：agent 真挂死会令 `compressInFlight` 永置（需 killSession），已文档化。
- **结论**: 工程质量高，被作为可选/产品决策项关闭。

### #4527 feat(serve): --allow-origin <pattern> CORS allowlist (T2.4 #4514)
- **状态**: merged | **关联 issue**: #4514 T2.4
- **一致性**: ✅ — `--allow-origin`(可重复)、`parseAllowOriginPatterns`+`InvalidAllowOriginPatternError`、`allowOriginCors` 中间件、条件 tag、`*`+无 token 启动拒绝（双重）、docs、向后兼容分支齐全。
- **描述准确性**: 准确详尽，与 T2.4 对应无夸大。
- **正确性**: ✅ — `new URL().origin===entry` 严校验；`Origin:null` 即便 `*` 也拒；两路均 `Vary:Origin`；拒绝路径不漏 CORS 头；OPTIONS 预检 204 短路安全；`*` 受 token 约束。
- **结论**: CORS 白名单设计安全细致，未见问题。

### #4530 feat(serve): prompt absolute deadline + SSE writer idle timeout (#4514 T2.9)
- **状态**: merged | **关联 issue**: #4514 T2.9
- **一致性**: ✅ — 两 flag + env fallback(`parseDeadlineEnv`)、boot 校验、条件 tag、`resolvePromptDeadlineMs`(Math.min 封顶)、`Promise.race` 硬 504、idle timer + `lastWriteAt`、SDK `deadlineMs` + `DAEMON_ERROR_KINDS` 镜像。
- **描述准确性**: ⚠️ 两处不准：(1) 称 `writerIdleTimeoutMs<15000` 是 "no-op，心跳抢先"，但代码注释/docs/测试均表明 <15s 会驱逐健康空闲连接（心跳 15s 才发）；(2) "Closes the FIXME(stage-2)…holding the FIFO open indefinitely" 夸大——**本 PR 未改 `httpAcpBridge.ts`，该 FIXME(`:2689`) 仍在**（已核验），race 只保证向 HTTP 客户端快速回 504。
- **正确性**: ✅ — race 实现稳健：timer `unref`、orphan `bridgePromise.catch`、`writableEnded` 提前 return、转发前 strip `deadlineMs`、请求只能缩短 deadline。残留 FIFO 占用为既有问题，非本 PR 引入。
- **结论**: 代码正确且测试充分，但正文夸大了对 FIFO 的修复、并错述了 <15s 空闲行为。

### #4552 feat(serve): runtime MCP server add/remove (T2.8 #4514)
- **状态**: merged（并入 `daemon_mode_b_main`）| **关联 issue**: #4514 T2.8
- **一致性**: ⚠️ — 路由/事件/能力标签/错误种类/SDK helper/预算与幂等替换均吻合；但 body **未提及**服务端会静默剥离 `trust/env/cwd/oauth/headers/authProviderType/includeTools/excludeTools/type`（仅 docs 第 54 行有写，且 SDK `MCPServerConfigShape` 仍声明这些字段）。
- **描述准确性**: 总体详尽准确，唯独正文遗漏了上述安全字段剥离这一重要行为。
- **正确性**: ⚠️ — `acpAgent.ts:workspaceMcpRuntimeAdd` 静默剥离 `env`/`headers`，使需要密钥/鉴权头的 stdio/HTTP MCP server 运行时添加后**不可用且无任何告警字段回传**；`bridge.ts:removeRuntimeMcpServer` 的 try/catch 两分支都 `throw err`，属冗余死代码。预算计账经核验无泄漏。
- **结论**: 实现完善已合并，主要遗憾是 env/headers 静默剥离限制了真实可用性且无回传提示。

### #4556 feat(telemetry): trace daemon prompt lifecycle
- **状态**: merged（base `daemon_mode_b_main`）| **关联 issue**: #4554（用 OTel 覆盖 qwen serve daemon 端到端，仍 open）
- **一致性**: ✅ — daemon `initializeTelemetry`/`shutdownTelemetry`、route span(`daemonTelemetryMiddleware`/`withDaemonRequestSpan`)、bridge 生命周期 span(spawn/initialize/session.new/cancel/close)、W3C 传播(`injectDaemonTraceContext`→`extract`)、FIFO 还原(`runWithDaemonTelemetryContext`)、ACP `withInteractionSpan` 全部到位，甚至超出 body 所述。
- **描述准确性**: 准确，但 "Closes #4554" 偏乐观——issue 第 6 区（daemon metrics）未交付，issue 仍 open。
- **正确性**: ✅ — span 在 finally 结束（无泄漏）；客户端伪造的 `qwen.telemetry.*` 经 `stripReservedTraceMeta` 剥离；error 截断(1024)；span 不含 prompt PII；context 经 AsyncLocalStorage 正确流转。
- **结论**: 扎实、测试充分的 daemon 遥测地基，符合 issue 的 trace 验收标准。

### #4559 feat(serve): add daemon file logger (#4548)
- **状态**: merged | **关联 issue**: #4548（为 qwen serve 诊断加 daemon file logger）——**仍 open**（body 写 "Closes #4548" 但 `closingIssuesReferences` 为空，未实际关闭）
- **一致性**: ✅ — `daemonLogger.ts`(init/info/warn/error/raw/latest symlink/降级/opt-out)、`bridgeOptions.onDiagnosticLine`、`spawnChannel` stderr 转发、`runQwenServe`(daemonLog + shutdown flush)、`server.sendBridgeError`→`daemonLog.error` 全部落地。附带 ~1.7k 行 plan/spec 文档（body 未强调）。
- **描述准确性**: 准确，逐条对应 #4548 验收点。
- **正确性**: ✅ — 异步 append 队列 + 一次性降级、boot 可写探测回退 no-op、64KiB 截断、复用 `updateSymlink`；21 个 spec 覆盖格式化/降级/symlink。
- **结论**: 高质量、测试充分的可观测性特性，描述与实现一致。

### #4563 refactor(serve): extract DaemonWorkspaceService from AcpSessionBridge (issue #4542, 方案 C)
- **状态**: open | **关联 issue**: #4542（抽出 DaemonWorkspaceService，收口 file/auth/agents/memory）；body 写 `Closes #4542` 但未自动关联
- **一致性**: ⚠️ — 大体忠实落地方案 C：status 方法经回调委托回 bridge，file 走 `fsFactory.forRequest(ctx)`，auth/agents/memory 为薄委托，REST + ACP 一致地 `bridge.*`→`workspace.*` 并穿 `ctx`，HTTP/ACP 面不变。但 `workspace-service/index.ts:getWorkspacePreflightStatus` **非行为保持**：新增 `cells.filter(c=>c.locality==='acp')` + `if(acpChannelLive)` 门控；原版是 `[...daemonCells, ...acpResponse.cells]` 不过滤且恒查询——未在描述声明。
- **描述准确性**: 夸大——称 `initWorkspace` "fixes FIXME（改用 fsFactory + trust gate + audit）"，实为逐字搬运、仍用 `node:fs` 且删掉了 FIXME 注释，未接 fsFactory/trust/audit。
- **正确性**: ⚠️ — preflight 过滤可能丢弃子进程返回的非 `acp` locality cells；`initWorkspace` 仍绕过 fsFactory/`assertTrustedForIntent`/审计，安全姿态未变（与描述相悖）。其余抽取忠实。
- **结论**: 扎实的方案 C 抽取，但 preflight 非纯行为保持、且描述高估了 initWorkspace 的修复。

### #4576 feat(daemon): server-side shell command execution for ! (bang) prefix
- **状态**: merged | **关联 issue**: 无
- **一致性**: ⚠️ — HTTP `POST /session/:id/shell`、`bridge.executeShellCommand`、SDK `shellCommand`、web-shell `sendShellCommand`、`sessionShellHistory` 注入、`user_shell_*` SSE 均到位；但 body 宣称的「频道(Telegram/DingTalk/WeChat) ! 直执行」**在本仓库不生效**：`ChannelBase` 的 `this.bridge` 是 `AcpBridge`(无 shellCommand)，`typeof` 检查 false，! 仍回落给 LLM。
- **描述准确性**: web-shell/SDK 准确；channels 部分夸大（实测不生效）。
- **正确性**: ⚠️ — （已 `gh pr diff` 核验）`ChannelBase.ts:216` 把 `bridgeShellCommand` 取成游离函数 `(this.bridge as ...)['shellCommand']` 后无绑定调用，而 `DaemonChannelBridge.shellCommand`(`:280`) 依赖 `this.ensureSession`——该路径若接通会因丢 `this` 抛 TypeError（应 `this.bridge.shellCommand(...)` 或 `.bind`）。HTTP 安全：cwd=`entry.workspaceCwd`（服务端控制）、配 token 时 bearerAuth 守卫、超时/abort/清理完善；任意执行系设计意图（同 CLI !）。
- **结论**: 主路径（web-shell/HTTP/SDK）正确且无明显安全逃逸；channels 子路径实为 inert + `this` 绑定隐患，接通前必须修。

### #4578 feat(daemon): add session tasks snapshot endpoint
- **状态**: merged | **关联 issue**: 无
- **一致性**: ✅ — `GET /session/:id/tasks`、status extMethod `sessionTasks`、`bridge.getSessionTasksStatus`(走 `requestSessionStatus` 绕过 prompt FIFO，有专门测试)、SDK helpers、web-shell `handleTasksSlashCommand` 本地拦截全部到位。
- **描述准确性**: 准确；明确声明 V1 仅快照、不含 stop/tail/live SSE，诚实不夸大。
- **正确性**: ✅ — `tasksSnapshot.ts` 显式字段白名单序列化（测试输入含 `pendingMessages`/`abortController` 均未泄漏）、按 `startTime` 排序、`runtimeMs=max(0,…)`；web-shell `sanitizeTaskText` 去控制符、`formatTaskStatus` 有 `never` 穷尽检查。
- **结论**: 干净、聚焦、测试到位的只读快照端点，描述与实现一致。

### #4580 fix(rewind): false "compressed turn" error when mid-turn messages exist
- **状态**: merged | **关联 issue**: #4579（mid-turn 消息触发假 compressed-turn 错误）
- **一致性**: ✅ — 实现 issue 建议的修法：加 `NOTIFICATION` 枚举，live(`useGeminiStream.ts`)+resume(`resumeHistoryUtils.ts` mid_turn) 从 `user`→`notification`，更新 4 测试 + 1 回归测试。
- **描述准确性**: 准确；根因（UI/API 计数不匹配 → `computeApiTruncationIndex` 返回 -1）对应 #4579。
- **正确性**: ✅ — `isRealUserTurn` 对非 `'user'` 返回 false，消除错配；`HistoryItemNotification` 已在 union 中（仅枚举改动可编译）；renderer(`:127`→`InfoMessage`) 保持 transcript 完整；resume 改动正确限定 `mid_turn_user_message`，其他 `type:'user'` push 未动。
- **结论**: 正确、最小、范围干净的修复，忠实匹配 issue 方法。

### #4606 feat(daemon): add request-level logging for serve routes
- **状态**: merged | **关联 issue**: 无
- **一致性**: ✅（略宽）— access-log 中间件(method/path/sessionId/clientId/status/durationMs，注册在 bearerAuth/json 之前)、各路由 inline 日志(spawn/attach、prompt enqueue + completed/failed、cancel、recap、shell、SSE open/close)、全部 gated on `daemonLog`；另含 `bridge.onDiagnosticLine` 与 `core/sessionRecap.ts` debug 面包屑（超出 "serve routes"，但贴合动机）。
- **描述准确性**: 基本准确；body 仅称排除 `/health` 与 SSE，但代码还排除 `POST .../heartbeat`（未在 body 列出）。
- **正确性**: ✅ — finish 跳过 200 SSE、close 记 SSE 时长、finish handler try/catch 防护、用 `req.path`（不含 query，无 token 泄漏）；prompt 链 `.then(_, onError)` 不改变既有语义。
- **结论**: 合理的请求级可观测性补强，无行为回归，仅小文档遗漏。

### #4608 feat(telemetry): add tool spans and session.id to daemon/ACP path
- **状态**: closed（superseded）| **关联 issue**: #4602（对齐 daemon/ACP 与 CLI 的 session tracing）
- **描述准确性**: body 准确描述了**意图中的**遥测切片，只是与膨胀的 diff 不符。
- **正确性**: —（轻审，未合并）真正的遥测切片已在 #4630 重做并审查。
- **结论**: 错基分支产生的废弃产物，已被干净的 4 文件 #4630（cherry-pick）取代；判断意图应看 #4630。

### #4610 feat(daemon): add POST /session/:id/btw endpoint for side questions
- **状态**: open（base `daemon_mode_b_main`）| **关联 issue**: 无
- **一致性**: ✅ — `POST /session/:id/btw`(server.ts)、`generateSessionBtw`(bridge.ts)、`sessionBtw` ext-method(acpAgent.ts)、共享 `buildBtwPrompt`/`buildBtwCacheSafeParams`(core/btwUtils.ts)、`supportedModes:['interactive','acp']`、`session_btw` capability 全有。
- **描述准确性**: 准确；忠实复用 recap 控制面模式，未勾项均为 manual-only。
- **正确性**: ✅ — 超时分层正确（child 55s `AbortSignal.timeout` < bridge 60s backstop）；abort listener 在 finally 清理；`askBtw` 返回 `Promise<string>` 契约成立。小瑕：`generateSessionBtw` 收了 `_context.clientId` 但未用（无 span）；`withTimeout` 计时器在 abort/transport 抢先时可能滞留（继承自 recap）。
- **结论**: 干净、范围清晰、与描述一致的特性。

### #4628 feat(telemetry): add client_id attribute and permission route spans
- **状态**: open（base `daemon_mode_b_main`）| **关联 issue**: 无（向 #4554 铺路）
- **一致性**: ✅ — `qwen-code.client_id` 加到 request span(经 `CLIENT_ID_RE`/`MAX_CLIENT_ID_LENGTH` 校验)与 `prompt.dispatch` span；permission 路由在 `resolveDaemonTelemetryRoute` 匹配并加 `qwen-code.daemon.permission.request_id`；新增 `addDaemonRequestAttribute` helper。已核两条 permission 路由存在(server.ts:1561/1594)故 span 会触发。
- **描述准确性**: 准确且诚实——明确标注 `addDaemonRequestAttribute` 是为 #4554 预留、当前未接线。
- **正确性**: ✅ — clientId 经长度+正则约束（无基数爆炸/注入）；telemetry 中间件校验失败返回 `undefined`（非 400）而非复用写响应的 `parseClientIdHeader`，路由顺序安全。
- **结论**: 小而聚焦、正确的遥测增强。

### #4630 feat(telemetry): add tool spans and session.id to daemon/ACP path
- **状态**: open（base `daemon_mode_b_main`）| **关联 issue**: #4602（对齐 daemon/ACP 与 CLI 的 session tracing，open）
- **一致性**: ✅ — Milestone 1：`session.id` 经 `resolveSessionId`(session-tracing.ts) 加到 llm_request/tool/tool.execution。Milestone 2：`runTool` 包 `startToolSpan`/`runInToolSpanContext`/`endToolSpan` + `invocation.execute()` 外包 `startToolExecutionSpan`；turn 末 `logConversationFinishedEvent`；`#executeCronPrompt` 包 `withInteractionSpan`。Session.ts 的 +873/-739 churn 是重缩进非新逻辑。**取代 #4608**（body 注明 "Cherry-picked from PR #4608"）。
- **描述准确性**: 准确；#4608 关系与 milestone 映射均说明。
- **正确性**: ✅ — `endToolSpan` 在 finally（无泄漏）；`execSpan` 成功/异常都结束；`session.id` 从父 span 属性派生（避免 `getCurrentSessionId()` 全局碰撞——正是 #4602 的核心关切）；early-error 经 `earlyErrorResponse` 重路由以填充 `spanError`；`conversation_finished` 在 interaction-span context 内发出。
- **结论**: 正确实现 #4602 两个 milestone，干净替换膨胀的 #4608。

---

## 重点跟进清单

### Open PR（仍可改，建议优先）
2. **#4505**（fix core）：body 补上 model-name 门（`qwen*`/`coder-model`）说明（该门基于 `request.model`，即 side-query 运行时模型，符合预期——原 review "基于 config.model" 判断有误，已更正）。
3. **#4563**（refactor）：`getWorkspacePreflightStatus` 的 acp-locality 过滤是**行为变更**——要么在描述声明、要么改回不过滤以保持纯抽取；修正 body 对 `initWorkspace "fixes FIXME"` 的夸大（实为逐字搬运）。
4. **#4576**（已合并，但 channels 路径待接通）：修 `ChannelBase.ts:216` 的 `this` 绑定（`this.bridge.shellCommand(...)` 或 `.bind(this.bridge)`），否则该路径接通即 TypeError；同步修正 body 中"频道 ! 直执行"的描述（当前 inert）。

### Merged（代码 OK，仅建议修订描述 / 补 follow-up）
5. **#4504 / #4530 / #4552**：描述与实现存在出入（取消行为 / FIXME 修复 / env·headers 静默剥离）——建议在对应 docs 或 follow-up PR 中澄清；#4552 尤其建议给运行时 MCP add 在剥离 env/headers 时回传告警字段。
6. **"Closes #xxx" 未生效**（#4548、#4554 等仍 open）：确认是否因跨分支 PR 导致 `closingIssuesReferences` 为空，必要时手动关联/关闭。

---

## 深挖补充（2026-05-31，来自 feature 深度文档）

> 写 `feature/daemon-serve-mode/` 深度文档时对本周 PR 的核实，含对原审查结论的**更正**。

- **#4530**（prompt deadline + SSE idle）⚠️**更正**：原审查与 PR body 称命中 deadline 返回硬 **504**；深挖发现路由实际返回**非阻塞 202**，deadline 经 SSE `errorKind` 抵达客户端，而 **bridge 侧仍无绝对 deadline**（`bridge.ts` 留 FIXME）——非协作 agent 仍可占住 per-session FIFO，route 级 race 只保证快速回客户端。原 "Promise.race 硬 504" 表述不准。
- **#4559**（daemon file logger）**更正**：所谓 "64KiB 截断" 实位于 `spawnChannel.ts` 的 stderr 转发器，而非 `daemonLogger.ts`（后者不截断）。
- **#4630**（tool spans / session.id）**撤回前述更正**：复核 `origin/daemon_mode_b_main`（#4630 已合并）确认 **#4630 本身新增了 `resolveSessionId`**（`session-tracing.ts:175`，从父 span 属性派生 session.id，用于 llm_request/tool/tool.execution）——原 W22 审查的 resolveSessionId 说法**正确**；先前「无此函数」系深挖时误读 `main`（彼时 #4630 未合入）所致，特此更正（PR #4630 上的误注已移除）。
- **#4576**（server-side shell）补充：除 `ChannelBase` `this`-binding 隐患外，`/shell` 端点**未在 `/capabilities` 暴露 feature 标签**（recap/btw/tasks 均有），客户端无法能力协商。

_审查于 2026-05-30（初版）；2026-05-31 追加「深挖补充」与更正（见上节）。方法：7 个并行只读子代理逐 PR 拉取 issue+描述+diff，关键负面结论由主代理 `gh pr diff` 二次核验。_
