# qwen-code PRs · 2026-05-11 ~ 2026-05-17  (W20)

**主题**: telemetry 层级 span、atomicWrite、rewind 文件恢复、/stuck，daemon/serve Wave 1–4 大爆发

**统计**: 29 PRs — 29 merged / 0 open / 0 closed
**代码量**: +39,561 / -2,486，332 个文件变更
**类型**: feat ×19, fix ×4, refactor ×3, docs ×1, test ×1, other ×1
**范围 (scope)**: serve ×16, telemetry ×6, rewind ×2, cli ×2, core ×1, skills ×1, perf ×1

**本周最大改动**:
- [#4255](https://github.com/QwenLM/qwen-code/pull/4255) (+6172/-51, 22 files) feat(serve): auth device-flow route (#4175 Wave 4 PR 21)
- [#4249](https://github.com/QwenLM/qwen-code/pull/4249) (+5318/-8, 23 files) feat(serve): workspace memory and agents CRUD (#4175 Wave 4 PR 16)
- [#4250](https://github.com/QwenLM/qwen-code/pull/4250) (+4753/-68, 16 files) refactor(serve): add FileSystemService boundary (#4175 Wave 4 PR 18)

| PR | 状态 | 类型 | 标题 | 变更 | 文件 | 创建 | 合并/关闭 | 链接 |
|---|---|---|---|---|---|---|---|---|
| #4058 | ✅ merged | fix(telemetry) | fix(telemetry): address PR #3847 review follow-ups for trace correlation _[type/bug]_ | +407/-38 | 12 | 05-11 | 05-13 | https://github.com/QwenLM/qwen-code/pull/4058 |
| #4061 | ✅ merged | refactor(telemetry) | refactor(telemetry): remove dead useCollector setting and unreachable TelemetryTarget.QWEN | +1/-82 | 9 | 05-11 | 05-11 | https://github.com/QwenLM/qwen-code/pull/4061 |
| #4064 | ✅ merged | feat(rewind) | feat(rewind): add file restoration support to /rewind command _[type/feature-request]_ | +2225/-81 | 26 | 05-11 | 05-16 | https://github.com/QwenLM/qwen-code/pull/4064 |
| #4066 | ✅ merged | docs(telemetry) | docs(telemetry): align config and docs semantics for target, outfile, and CLI flags | +22/-22 | 2 | 05-11 | 05-13 | https://github.com/QwenLM/qwen-code/pull/4066 |
| #4071 | ✅ merged | feat(telemetry) | feat(telemetry): add hierarchical session tracing spans _[type/feature-request]_ | +1318/-409 | 6 | 05-12 | 05-12 | https://github.com/QwenLM/qwen-code/pull/4071 |
| #4096 | ✅ merged | feat(core,cli) | feat(core,cli): add generic atomicWriteFile, wire into Write/Edit tools, upgrade @types/node _[type/feature-request]_ | +526/-126 | 14 | 05-12 | 05-15 | https://github.com/QwenLM/qwen-code/pull/4096 |
| #4097 | ✅ merged | feat(telemetry) | feat(telemetry): add interaction span and detailed sensitive attributes _[type/feature-request]_ | +893/-175 | 13 | 05-12 | 05-16 | https://github.com/QwenLM/qwen-code/pull/4097 |
| #4122 | ✅ merged | feat(cli) | feat(cli): warn users that rewind is disabled in IDE mode _[type/enhancement]_ | +94/-3 | 2 | 05-13 | 05-15 | https://github.com/QwenLM/qwen-code/pull/4122 |
| #4126 | ✅ merged | feat(telemetry) | feat(telemetry): unify span creation paths for hierarchical trace tree _[type/feature-request]_ | +1739/-877 | 10 | 05-13 | 05-16 | https://github.com/QwenLM/qwen-code/pull/4126 |
| #4133 | ✅ merged | feat(skills) | feat(skills): add /stuck diagnostic skill for frozen sessions _[type/feature-request]_ | +172/-0 | 2 | 05-14 | 05-16 | https://github.com/QwenLM/qwen-code/pull/4133 |
| #4160 | ✅ merged | refactor(serve) | refactor(serve): extract createInMemoryChannel helper (#4156 A1) _[skip-changelog]_ | +315/-40 | 4 | 05-14 | 05-15 | https://github.com/QwenLM/qwen-code/pull/4160 |
| #4191 | ✅ merged | feat(serve) | [codex] feat(serve): add capability registry protocol versions _[skip-changelog]_ | +212/-39 | 10 | 05-16 | 05-16 | https://github.com/QwenLM/qwen-code/pull/4191 |
| #4205 | ✅ merged | test(perf) | test(perf): add daemon baseline harness (#4175 Wave 1 PR 1) _[skip-changelog]_ | +1343/-0 | 5 | 05-16 | 05-16 | https://github.com/QwenLM/qwen-code/pull/4205 |
| #4209 | ✅ merged | feat(serve) | feat(serve): per-request sessionScope override on POST /session (#4175 Wave 2 PR 5) _[skip-changelog]_ | +512/-20 | 8 | 05-16 | 05-16 | https://github.com/QwenLM/qwen-code/pull/4209 |
| #4214 | ✅ merged | fix(serve) | fix(serve): align integration test + user doc with merged sessionScope override (#4175 follow-up) _[skip-changelog]_ | +14/-11 | 2 | 05-16 | 05-16 | https://github.com/QwenLM/qwen-code/pull/4214 |
| #4216 | ✅ merged | fix(rewind) | fix(rewind): restore upstream TOCTOU ordering + heal sticky failed marker | +245/-16 | 6 | 05-16 | 05-16 | https://github.com/QwenLM/qwen-code/pull/4216 |
| #4222 | ✅ merged | other | [codex] Add daemon session load/resume _[skip-changelog]_ | +2078/-51 | 16 | 05-17 | 05-17 | https://github.com/QwenLM/qwen-code/pull/4222 |
| #4226 | ✅ merged | feat(serve) | feat(serve): advertise typed_event_schema + pin SDK public surface (#4175 PR 4 follow-up) _[skip-changelog]_ | +112/-1 | 5 | 05-17 | 05-17 | https://github.com/QwenLM/qwen-code/pull/4226 |
| #4235 | ✅ merged | feat(serve) | feat(serve): add client heartbeat (#4175 Wave 2.5 PR 9) _[skip-changelog]_ | +581/-2 | 15 | 05-17 | 05-17 | https://github.com/QwenLM/qwen-code/pull/4235 |
| #4236 | ✅ merged | feat(serve) | feat(serve): mutation gating helper and --require-auth _[skip-changelog]_ | +620/-24 | 11 | 05-17 | 05-17 | https://github.com/QwenLM/qwen-code/pull/4236 |
| #4237 | ✅ merged | feat(serve) | feat(serve): SSE replay sizing + slow_client_warning backpressure (#4175 Wave 2.5 PR 10) _[skip-changelog]_ | +893/-81 | 18 | 05-17 | 05-17 | https://github.com/QwenLM/qwen-code/pull/4237 |
| #4240 | ✅ merged | feat(serve) | feat(serve): session metadata and close/delete lifecycle (#4175 Wave 2.5 PR 11) _[skip-changelog]_ | +1175/-35 | 16 | 05-17 | 05-17 | https://github.com/QwenLM/qwen-code/pull/4240 |
| #4241 | ✅ merged | feat(serve) | feat(serve): add read-only status routes _[skip-changelog]_ | +2363/-64 | 19 | 05-17 | 05-17 | https://github.com/QwenLM/qwen-code/pull/4241 |
| #4245 | ✅ merged | fix(serve) | fix(serve): align integration test mirrors with merged capability + EventBus changes _[skip-changelog]_ | +14/-4 | 2 | 05-17 | 05-17 | https://github.com/QwenLM/qwen-code/pull/4245 |
| #4247 | ✅ merged | feat(serve) | feat(serve): MCP client guardrails (#4175 Wave 3 PR 14) _[skip-changelog]_ | +2867/-31 | 15 | 05-17 | 05-18 | https://github.com/QwenLM/qwen-code/pull/4247 |
| #4249 | ✅ merged | feat(serve) | feat(serve): workspace memory and agents CRUD (#4175 Wave 4 PR 16) _[skip-changelog]_ | +5318/-8 | 23 | 05-17 | 05-18 | https://github.com/QwenLM/qwen-code/pull/4249 |
| #4250 | ✅ merged | refactor(serve) | refactor(serve): add FileSystemService boundary (#4175 Wave 4 PR 18) _[skip-changelog]_ | +4753/-68 | 16 | 05-17 | 05-18 | https://github.com/QwenLM/qwen-code/pull/4250 |
| #4251 | ✅ merged | feat(serve) | feat(serve): preflight and env diagnostics routes (#4175 Wave 3 PR 13) _[skip-changelog]_ | +2577/-127 | 23 | 05-17 | 05-17 | https://github.com/QwenLM/qwen-code/pull/4251 |
| #4255 | ✅ merged | feat(serve) | feat(serve): auth device-flow route (#4175 Wave 4 PR 21) _[skip-changelog]_ | +6172/-51 | 22 | 05-17 | 05-18 | https://github.com/QwenLM/qwen-code/pull/4255 |

---

## PR 解决问题与实现方式

> 来源：同目录 `review.md` 的逐 PR diff 审查，结合 PR 状态与标题压缩成“解决了什么问题 / 怎么做的”。open/closed PR 只记录当前观察，不写成已落地实现。

| PR | 解决了什么问题 | 怎么做的 |
|---|---|---|
| [#4058](https://github.com/QwenLM/qwen-code/pull/4058) | trace 关联 follow-up，sampler/idle 逻辑正确 | 5 项中 4 项忠实落地。`runInSpan()` 那条描述的是既有 helper（#3847 已用），本 PR 未新增该 wrapping。 `tracer.ts:shouldForceSampled` 正确映射各 sampler；idle 超时幂等（`spanEnded` 守卫 + unref + clearTimeout）；`withSpan({autoOkOnSuccess:false})` 覆盖全部 tool 路径。 |
| [#4061](https://github.com/QwenLM/qwen-code/pull/4061) | 删死代码 useCollector / 不可达 QWEN target | diff 与描述一致；`packages/*/src` 中零残留 `useCollector`/`QWEN`。 base 处 sdk.ts 无 "collector" 引用，getter 确死；`parseTelemetryTargetValue` 只返回 LOCAL/GCP（否则抛错），`QWEN` 确不可达。 |
| [#4064](https://github.com/QwenLM/qwen-code/pull/4064) | rewind 文件恢复；可能覆盖用户后续手改，提示语误导 | 三段式 UI、diff-stats、部分失败处理、门控均对应 issue。`fileHistoryService.ts` 边界处理强（ENOENT/`failed` 标记/`applySnapshot` 在 filesFailed 时跳过截断/对新建文件 unlink）。 |
| [#4066](https://github.com/QwenLM/qwen-code/pull/4066) | telemetry 文档对齐，3 项均核实 | 纯文档。三项均核实：`getTelemetryTarget()` 无生产调用点；OTLP 路由由 parsed endpoint 或 per-signal 配置触发，且 outfile 会覆盖该路由；`--telemetry-target` 已弃用。 outfile 覆盖 OTLP、target 仅信息性，均正确。 |
| [#4071](https://github.com/QwenLM/qwen-code/pull/4071) | "层级"span 仅 interaction 接线，其余死代码 + 非并发安全 | 仅 interaction span 接线（client.ts）；`startLLMRequestSpan`/`startToolSpan` 等导出但合并时未用（死代码），"层级"尚未生效。body 诚实披露。interaction 生命周期严谨（幂等 `endInteractionSpan`、try/finally、30min TTL、shutdown hook、错误脱敏 `[API error]`）。 |
| [#4096](https://github.com/QwenLM/qwen-code/pull/4096) | atomicWrite 扎实；但丢 uid/gid（#4431 后修）+ 可覆盖只读文件 | `atomicWriteFile` 齐全（temp+rename、`flush:true` fsync、mode 保留、`resolveSymlinkChain` 含断链/ELOOP、EXDEV 回退、FAT chmod 容错）；`atomicWriteJSON` 委托；Write/Edit 经 `StandardFileSystemService.writeTextFile` 落地（write-file.ts:460、edit.ts:582/590）。 |
| [#4097](https://github.com/QwenLM/qwen-code/pull/4097) | 夹带删除 `prompt` hook schema（实测仍是 main 回归）+ 无关设置 | （已核验）— diff 夹带未声明、无关改动：从 `settingsSchema.ts` 与 vscode `settings.schema.json` 移除 `prompt` hook 类型及 prompt/model 字段，并新增 `dynamicCommandTranslation` 设置（对比 base `daaa85e9` 确认）。描述只提 `includeSensitiveSpanAttributes` 文档更新。 |
| [#4122](https://github.com/QwenLM/qwen-code/pull/4122) | IDE 模式禁用 rewind 提示，双守卫精准 | 双守卫：`openRewindSelector` 在 IDE 下加提示并提前返回（覆盖 `/rewind`）；双击 ESC 块加 `!config.getIdeMode()`（AppContainer.tsx:2947）。 首次 ESC 行为在被守卫块之前不受影响；依赖数组改 `historyManager` 消除陈旧闭包。 |
| [#4126](https://github.com/QwenLM/qwen-code/pull/4126) | ALS 统一 span 创建路径，用法正确 | `toolContext` ALS + `runInToolSpanContext` 接入 `coreToolScheduler._schedule`，`startToolExecutionSpan()` 从 `toolContext` 读父；E2E 输出确认树形。ALS 用 `run`（非 `enterWith`），跨 await 传播正确；`span.end()` 单独 try 防泄漏。 |
| [#4133](https://github.com/QwenLM/qwen-code/pull/4133) | /stuck 诊断技能，防御性强 | 新增 bundled `stuck/SKILL.md` + 解析全部 bundled SKILL.md 前置元数据的集成测试。 纯 prompt skill：纯数字 PID 白名单（防注入）、密钥脱敏、跨平台栈转储、`timeout` 包裹；前置字段经 `parseSkillContent` 正确解析。 |
| [#4160](https://github.com/QwenLM/qwen-code/pull/4160) | 行为保持的测试重构；body 低描述了 shipped 的 abort() | 行为保持：10 处迁移点各以 `createInMemoryChannel()` 替换等价 4 行模板；第 11 处（需 raw ab/ba 的 kill）正确保留 inline。 helper 忠实；`abort()` fire-and-forget。纯测试重构，无运行时风险。 |
| [#4191](https://github.com/QwenLM/qwen-code/pull/4191) | capability 协议版本，附加且向后兼容 | 以 `SERVE_CAPABILITY_REGISTRY` + 助手替换硬编码 FIXME，envelope 加 `protocolVersions:{current:'v1',supported:['v1']}`；`STAGE1_FEATURES` 保留为 deprecated alias。向后兼容已验证（`protocolVersions?` 可选，SDK 测试"接受无该字段的旧 envelope"通过）；助手返回 fresh copy 防外部 mutate； |
| [#4205](https://github.com/QwenLM/qwen-code/pull/4205) | daemon 基线 perf 工具，方法可靠且坦诚局限 | 纯测试，全在 `integration-tests/`，无生产代码；含 RSS/attach/MCP/SSE/prompt 工具 + 基线 JSON。方法可靠（`ps -o rss=` 取峰值、丢样比例门、nearest-rank 分位、递归 pgrep 子进程）。 |
| [#4209](https://github.com/QwenLM/qwen-code/pull/4209) | sessionScope 覆盖，实为修隔离泄漏（非引入） | 加 `BridgeSpawnRequest.sessionScope?`，`spawnOrAttach` 解析 `effectiveScope = req.sessionScope ?? default`；能力标签 + SDK 字段 + docs。无 auth 绕过（bearer/CORS/host 中间件在路由前，scope 在 auth 后）；无升级（跨工作区仍被 `WorkspaceMismatchError` 挡）；override 只增隔离。 |
| [#4214](https://github.com/QwenLM/qwen-code/pull/4214) | 对齐 test+doc，机械清理 | 仅文档+测试：routes 测试 9→10 features 插入 `session_scope_override`（与 registry/server.test 一致）；移除 qwen-serve.md 过时 "blocker" 并重编号。 顺序与 registry 一致，重编号一致；遗留的 `protocol_versions` 描述属本 PR 重编号范围外。 |
| [#4216](https://github.com/QwenLM/qwen-code/pull/4216) | 复原 TOCTOU 顺序 + heal sticky 标记，正确 | 把 `trackEdit` 移到 `checkPriorRead` 之前（edit.ts、write-file.ts）；在 `trackEdit` 中 heal `failed` 条目。 重排真正把"新鲜检查→写"窗口缩回相邻 syscall（无 await）；backup-first 安全（幂等 `{hash}@v{version}`）；heal 对称（early guard + re-check 正确替换失败条目，测试断言新鲜内容）。 |
| [#4222](https://github.com/QwenLM/qwen-code/pull/4222) | daemon session load/resume，竞态处理极细致 | `POST /session/:id/{load,resume}` 路由、bridge `loadSession/resumeSession`、ACP `unstable_resumeSession`、SDK load/resume、capabilities/types/docs 齐全。load/resume 正确区分（load 传 conversation→replayHistory，resume 不传）；回放帧经 `pendingRestoreEvents` 缓冲； |
| [#4226](https://github.com/QwenLM/qwen-code/pull/4226) | typed_event_schema + 公共面围栏；注释引用了不存在符号 | registry 插入 `typed_event_schema`，server.test 与集成镜像同序更新，新增 `daemon-public-surface.test.ts` 围栏。 纯附加，未触 auth；公共面测试类型+运行时双锁 `asKnownDaemonEvent`。瑕疵：registry 注释称 `narrowDaemonEvent` 回退 `kind:'unknown'`，但 SDK 无此符号（仅注释不实）。 |
| [#4235](https://github.com/QwenLM/qwen-code/pull/4235) | client heartbeat，伪造 clientId 被拒、清理到位 | 路由/SDK `heartbeat()`/能力标记/`recordHeartbeat`/`getHeartbeatState`/`SessionEntry` 字段全到位。`recordHeartbeat` 先 `resolveTrustedClientId` 再写，伪造 clientId 抛错且不 bump；`unregisterClient` refcount 归零清理；`getHeartbeatState` 拷贝返回。全同步无 await → 无 TOCTOU； |
| [#4236](https://github.com/QwenLM/qwen-code/pull/4236) | mutation gating；`--token ""` 判定不一致（strict 路由前需修） | `createMutationGate` 矩阵、`--require-auth`、条件标记、boot 检查、`/health` 收口、变更路由统一挂 `mutate()` 齐备。gate 本身不可绕过； |
| [#4237](https://github.com/QwenLM/qwen-code/pull/4237) | 背压逻辑正确；漏更集成镜像（#4245 补救） | 产品代码与描述完全吻合，但更新了 server.test 却漏更集成镜像 `qwen-serve-routes.test.ts`（未加 `slow_client_warning`）——破坏 release CI、需 #4245 修，未守自述 lockstep 纪律。`BoundedAsyncQueue` 由位置相关 `forcedInBuf` 改为逐条 `forced` + `liveCount`，修了中途 forcePush 致 live 漂移（有回归测试）； |
| [#4240](https://github.com/QwenLM/qwen-code/pull/4240) | session 元数据 + close/delete，幂等竞态到位 | `DELETE /session/:id`、`PATCH /session/:id/metadata`、enriched listing、`session_closed`/`session_metadata_updated` 事件、SDK 方法均对应。`closeSession` 在首个 await 前同步完成 `byId.delete`/清理/取消 pending 权限，并发双删第二次 404，SDK 吸收 204/404 幂等； |
| [#4241](https://github.com/QwenLM/qwen-code/pull/4241) | 只读状态路由，脱敏得当无泄露 | 5 条只读路由（workspace mcp/skills/providers + session context/supported-commands）、能力标签、SDK 包装。`requestWorkspaceStatus` 用 `liveChannelInfo()` 判空不 spawn；未知/dying session 404； |
| [#4245](https://github.com/QwenLM/qwen-code/pull/4245) | 对齐集成镜像漂移，诚实最小修复 | 纯测试：routes 镜像 18→24（补 #4237 `slow_client_warning` + #4241 五个标记；`require_auth` 作条件标记正确排除）；SSE 断言 3→4 帧。 核对 `daemon_mode_b_main` registry 顺序与镜像一致；帧序与 eventBus.test 吻合；未触产品代码。 |
| [#4247](https://github.com/QwenLM/qwen-code/pull/4247) | MCP 配额实为 per-session，未限守护进程总量（已披露） | 标题/原意"workspace 级"配额，实际为 per-session（每会话独立 `McpClientManager`）；描述经 R3 已诚实改写、`buildBudgetCells` 出 `scope:'session'`，故描述与代码现自洽，但"guardrail"对守护进程总量无封顶。 |
| [#4249](https://github.com/QwenLM/qwen-code/pull/4249) | workspace memory/agents CRUD，路径穿越被拦 | 7 路由全落地，POST/DELETE 均 `mutate({strict:true})`，`memory_changed`/`agent_changed` 事件、Proxy 化 Config stub、空白追加抑制均与描述一致。路径穿越被拦：`validateAgentType` 用 `/^[\p{L}\p{N}_-]+$/u`+长度上限拒 `/`、`.`；`resolveContextFilePath` 由 scope 枚举定路径无用户路径分量； |
| [#4250](https://github.com/QwenLM/qwen-code/pull/4250) | FileSystemService 边界，可证明工作区约束 | 纯重构：`canonicalizeWorkspace` 抽到 `fs/paths.ts`，bridge import + re-export（行为保持），无新路由/能力标签。 |
| [#4251](https://github.com/QwenLM/qwen-code/pull/4251) | preflight/env 诊断，机密零泄露 | `GET /workspace/env` + `GET /workspace/preflight`、能力标签、闭合 errorKind 联合，idle 不 spawn。（机密不泄露）— `buildEnvStatusFromProcess` 仅遍历白名单，env_var cell 只发 `present` 布尔绝不带 value；proxy 经 `safeProxyValue` 降为 host:port；不遍历全量 process.env； |
| [#4255](https://github.com/QwenLM/qwen-code/pull/4255) | auth 设备流处理审慎；body 门控表过时（代码更严） | 4 路由/能力标签/5 事件/SDK/qwenOAuth2 改动均落地；但"What ships"表称 `GET …/device-flow/:id` 为 "bearerAuth only"，合并代码经 fold-in 升级为 `mutate({strict:true})`（防 userCode 偷窥）——表过时，但代码更严。PKCE S256；密钥经 `BrandedSecret`（冻结+WeakMap，转换即 `[redacted]`）； |
