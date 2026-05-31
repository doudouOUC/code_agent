# qwen-code PR 审查 · 2026-05-11 ~ 2026-05-17 (W20)

**审查方法**：逐个 PR 拉取 _关联 issue + PR 描述 + 代码 diff_，核对 (1) 描述↔实现 **一致性**；(2) 描述 **准确性**；(3) 代码 **正确性**。评级：✅ 良好 / ⚠️ 有出入或小隐患 / ❌ 明显不符。大型 serve PR（#4247/#4249/#4250/#4251/#4255）按文件分组抽样核心源码。#4097 关键结论已在本地 main 核验。

> 说明：serve/daemon 系 PR 多合入集成分支 `daemon_mode_b_main`，本地 main 未含或已被后续 PR 改写，故以各自 diff / mergeCommit 为准。

---

## 汇总

| PR | 状态 | 一致性 | 正确性 | 一句话 |
|---|---|---|---|---|
| [#4058](https://github.com/QwenLM/qwen-code/pull/4058) | merged | ✅ | ✅ | trace 关联 follow-up，sampler/idle 逻辑正确 |
| [#4061](https://github.com/QwenLM/qwen-code/pull/4061) | merged | ✅ | ✅ | 删死代码 useCollector / 不可达 QWEN target |
| [#4064](https://github.com/QwenLM/qwen-code/pull/4064) | merged | ✅ | ⚠️ | rewind 文件恢复；可能覆盖用户后续手改，提示语误导 |
| [#4066](https://github.com/QwenLM/qwen-code/pull/4066) | merged | ✅ | ✅ | telemetry 文档对齐，3 项均核实 |
| [#4071](https://github.com/QwenLM/qwen-code/pull/4071) | merged | ⚠️ | ⚠️ | "层级"span 仅 interaction 接线，其余死代码 + 非并发安全 |
| [#4096](https://github.com/QwenLM/qwen-code/pull/4096) | merged | ✅ | ⚠️ | atomicWrite 扎实；但丢 uid/gid（#4431 后修）+ 可覆盖只读文件 |
| [#4097](https://github.com/QwenLM/qwen-code/pull/4097) | merged | ❌ | ⚠️ | 夹带删除 `prompt` hook schema（**实测仍是 main 回归**）+ 无关设置 |
| [#4122](https://github.com/QwenLM/qwen-code/pull/4122) | merged | ✅ | ✅ | IDE 模式禁用 rewind 提示，双守卫精准 |
| [#4126](https://github.com/QwenLM/qwen-code/pull/4126) | merged | ✅ | ✅ | ALS 统一 span 创建路径，用法正确 |
| [#4133](https://github.com/QwenLM/qwen-code/pull/4133) | merged | ✅ | ✅ | /stuck 诊断技能，防御性强 |
| [#4160](https://github.com/QwenLM/qwen-code/pull/4160) | merged | ✅ | ⚠️ | 行为保持的测试重构；body 低描述了 shipped 的 abort() |
| [#4191](https://github.com/QwenLM/qwen-code/pull/4191) | merged | ✅ | ✅ | capability 协议版本，附加且向后兼容 |
| [#4205](https://github.com/QwenLM/qwen-code/pull/4205) | merged | ✅ | ✅ | daemon 基线 perf 工具，方法可靠且坦诚局限 |
| [#4209](https://github.com/QwenLM/qwen-code/pull/4209) | merged | ✅ | ✅ | sessionScope 覆盖，实为修隔离泄漏（非引入） |
| [#4214](https://github.com/QwenLM/qwen-code/pull/4214) | merged | ✅ | ✅ | 对齐 test+doc，机械清理 |
| [#4216](https://github.com/QwenLM/qwen-code/pull/4216) | merged | ✅ | ✅ | 复原 TOCTOU 顺序 + heal sticky 标记，正确 |
| [#4222](https://github.com/QwenLM/qwen-code/pull/4222) | merged | ✅ | ✅ | daemon session load/resume，竞态处理极细致 |
| [#4226](https://github.com/QwenLM/qwen-code/pull/4226) | merged | ✅ | ✅ | typed_event_schema + 公共面围栏；注释引用了不存在符号 |
| [#4235](https://github.com/QwenLM/qwen-code/pull/4235) | merged | ✅ | ✅ | client heartbeat，伪造 clientId 被拒、清理到位 |
| [#4236](https://github.com/QwenLM/qwen-code/pull/4236) | merged | ✅ | ⚠️ | mutation gating；`--token ""` 判定不一致（strict 路由前需修） |
| [#4237](https://github.com/QwenLM/qwen-code/pull/4237) | merged | ⚠️ | ✅ | 背压逻辑正确；漏更集成镜像（#4245 补救） |
| [#4240](https://github.com/QwenLM/qwen-code/pull/4240) | merged | ✅ | ✅ | session 元数据 + close/delete，幂等竞态到位 |
| [#4241](https://github.com/QwenLM/qwen-code/pull/4241) | merged | ✅ | ✅ | 只读状态路由，脱敏得当无泄露 |
| [#4245](https://github.com/QwenLM/qwen-code/pull/4245) | merged | ✅ | ✅ | 对齐集成镜像漂移，诚实最小修复 |
| [#4247](https://github.com/QwenLM/qwen-code/pull/4247) | merged | ⚠️ | ⚠️ | MCP 配额实为 per-session，未限守护进程总量（已披露） |
| [#4249](https://github.com/QwenLM/qwen-code/pull/4249) | merged | ✅ | ✅ | workspace memory/agents CRUD，路径穿越被拦 |
| [#4250](https://github.com/QwenLM/qwen-code/pull/4250) | merged | ✅ | ✅ | FileSystemService 边界，可证明工作区约束 |
| [#4251](https://github.com/QwenLM/qwen-code/pull/4251) | merged | ✅ | ✅ | preflight/env 诊断，机密零泄露 |
| [#4255](https://github.com/QwenLM/qwen-code/pull/4255) | merged | ⚠️ | ✅ | auth 设备流处理审慎；body 门控表过时（代码更严） |

**一致性**：✅23 / ⚠️5 / ❌1　　**正确性**：✅23 / ⚠️6 / ❌0

---

## 逐 PR 明细

### #4058 fix(telemetry): address PR #3847 review follow-ups for trace correlation
- **状态**: merged | **关联 issue**: 无（#3847 follow-up；epic #3731）
- **一致性**: ✅ — 5 项中 4 项忠实落地。`runInSpan()` 那条描述的是既有 helper（#3847 已用），本 PR 未新增该 wrapping。
- **描述准确性**: 除 runInSpan 那条描述既有行为外准确。
- **正确性**: ✅ — `tracer.ts:shouldForceSampled` 正确映射各 sampler；idle 超时幂等（`spanEnded` 守卫 + unref + clearTimeout）；`withSpan({autoOkOnSuccess:false})` 覆盖全部 tool 路径。
- **结论**: 扎实、测试充分的正确性修复，仅一处描述小夸大。

### #4061 refactor(telemetry): remove dead useCollector setting and unreachable TelemetryTarget.QWEN
- **状态**: merged | **关联 issue**: 无（#3731 P1）
- **一致性**: ✅ — diff 与描述一致；`packages/*/src` 中零残留 `useCollector`/`QWEN`。
- **描述准确性**: 准确。
- **正确性**: ✅ — base 处 sdk.ts 无 "collector" 引用，getter 确死；`parseTelemetryTargetValue` 只返回 LOCAL/GCP（否则抛错），`QWEN` 确不可达。
- **结论**: 干净、范围正确的死代码清理。

### #4064 feat(rewind): add file restoration support to /rewind command
- **状态**: merged | **关联 issue**: #3697（扩展 /rewind 回滚文件）
- **一致性**: ✅ — 三段式 UI、diff-stats、部分失败处理、门控均对应 issue。
- **描述准确性**: 多数准确；body 称门控 `!sdkMode && interactive !== false`，实际 `!params.sdkMode && (params.interactive ?? false)`（config.ts:1168）——interactive 未定义时默认 **OFF** 而非 ON。
- **正确性**: ⚠️ — `fileHistoryService.ts` 边界处理强（ENOENT/`failed` 标记/`applySnapshot` 在 filesFailed 时跳过截断/对新建文件 unlink）。数据丢失风险：`applySnapshot` 只要 `checkOriginFileChanged` 为真就恢复，故用户**后续手改过**的被跟踪文件会被覆盖，而 RewindSelector 提示"不影响手动编辑的文件"对该情形误导。
- **结论**: 构建良好的功能，主要隐患是会静默回退用户对被跟踪文件的后续手改。

### #4066 docs(telemetry): align config and docs semantics for target, outfile, and CLI flags
- **状态**: merged | **关联 issue**: #3731（checklist 项）
- **一致性**: ✅ — 纯文档。三项均核实：`getTelemetryTarget()` 无生产调用点；路由 `useOtlp=(!!parsedEndpoint||hasPerSignal)&&!outfile`；`--telemetry-target` 已弃用。
- **描述准确性**: 准确，body 的 sdk.ts 行号引用与实际相符。
- **正确性**: ✅ — outfile 覆盖 OTLP、target 仅信息性，均正确。
- **结论**: 干净、忠实的文档/代码对齐。

### #4071 feat(telemetry): add hierarchical session tracing spans
- **状态**: merged | **关联 issue**: 无（epic #3731）
- **一致性**: ⚠️ — 仅 interaction span 接线（client.ts）；`startLLMRequestSpan`/`startToolSpan` 等导出但合并时未用（死代码），"层级"尚未生效。body 诚实披露。
- **描述准确性**: 多数诚实；"concurrent-safe" 夸大。
- **正确性**: ⚠️ — interaction 生命周期严谨（幂等 `endInteractionSpan`、try/finally、30min TTL、shutdown hook、错误脱敏 `[API error]`）。风险：模块全局 `lastInteractionCtx`/`interactionSequence` 非并发安全（并发顶层 interaction 会结束/归因错 span）；`enterWith` 穿异步生成器脆弱（有 fallback 缓解）；`WeakRef` 因 `strongSpans` pin 而装饰性。顺序路径无泄漏/PII。
- **结论**: 真实顺序用途下正确且无泄漏；并发声明与未用 span API 是弱点。

### #4096 feat(core,cli): add generic atomicWriteFile, wire into Write/Edit tools, upgrade @types/node
- **状态**: merged | **关联 issue**: 引用（非 closing）#4095（atomic file write，OPEN）
- **一致性**: ✅ — `atomicWriteFile` 齐全（temp+rename、`flush:true` fsync、mode 保留、`resolveSymlinkChain` 含断链/ELOOP、EXDEV 回退、FAT chmod 容错）；`atomicWriteJSON` 委托；Write/Edit 经 `StandardFileSystemService.writeTextFile` 落地（write-file.ts:460、edit.ts:582/590）。
- **描述准确性**: 准确且详尽，自陈 EXDEV 回退非原子。
- **正确性**: ⚠️ — (1) rename 生成新 inode，仅保 mode 不保 uid/gid，Docker/共享工作区静默重置属主（issue #4095 自述，**后由 #4431 修复**）；(2) 只读(444) 文件现可被覆盖（rename 仅需目录写权限），edit.test.ts 已承认；(3) tmp 恒在 target 同目录，EXDEV 回退实为死代码。原子机制本身正确。
- **结论**: 原子写实现扎实、接线无误，但 rename 路线丢属主并使工具可改写只读文件。

### #4097 feat(telemetry): add interaction span and detailed sensitive attributes
- **状态**: merged | **关联 issue**: 无（epic #3731）
- **一致性**: ❌（已核验）— diff 夹带未声明、无关改动：从 `settingsSchema.ts` 与 vscode `settings.schema.json` **移除 `prompt` hook 类型**及 prompt/model 字段，并新增 `dynamicCommandTranslation` 设置（对比 base `daaa85e9` 确认）。描述只提 `includeSensitiveSpanAttributes` 文档更新。
- **描述准确性**: 遥测部分准确；schema/设置改动完全未提。
- **正确性**: ⚠️ — 遥测侧正确：`detailed-span-attributes.ts` 全部受 `isEnabled`（SDK init + getter，默认 false）门控，调用方双守卫，60KB 截断，SHA-256 system-prompt 去重。**但** 夹带的 `prompt`-hook 移除是回归：**当前 main 仍存** —— `settingsSchema.ts:190` 枚举为 `['command','http']`，而运行时 `hookRegistry.ts:299` 接受 `['command','http','function','prompt']`、`types.ts:216 Prompt='prompt'`，故 schema 现会拒绝合法的 prompt（及 function）hook 配置。
- **结论**: 受控良好的敏感属性特性，但被一处无关、未声明、且与运行时矛盾的 `prompt`-hook schema 移除污染，本应拆分。

### #4122 feat(cli): warn users that rewind is disabled in IDE mode
- **状态**: merged | **关联 issue**: 无
- **一致性**: ✅ — 双守卫：`openRewindSelector` 在 IDE 下加提示并提前返回（覆盖 `/rewind`）；双击 ESC 块加 `!config.getIdeMode()`（AppContainer.tsx:2947）。
- **描述准确性**: 准确。
- **正确性**: ✅ — 首次 ESC 行为在被守卫块之前不受影响；依赖数组改 `historyManager` 消除陈旧闭包。
- **结论**: 小而精准，两条 rewind 入口均被有意双守卫覆盖。

### #4126 feat(telemetry): unify span creation paths for hierarchical trace tree
- **状态**: merged | **关联 issue**: 无（#3731 P3 Phase 1）
- **一致性**: ✅ — `toolContext` ALS + `runInToolSpanContext` 接入 `coreToolScheduler._schedule`，`startToolExecutionSpan()` 从 `toolContext` 读父；E2E 输出确认树形。
- **描述准确性**: 准确，甚至披露 #4212 polish 与 #4097 rebase 需求。
- **正确性**: ✅ — ALS 用 `run`（非 `enterWith`），跨 await 传播正确；`span.end()` 单独 try 防泄漏。Caveat：未带 metadata 时跳过 status（telemetry-only，#4212 跟踪）。
- **结论**: 扎实、测试充分的重构，延后边界诚实披露。

### #4133 feat(skills): add /stuck diagnostic skill for frozen sessions
- **状态**: merged | **关联 issue**: 无
- **一致性**: ✅ — 新增 bundled `stuck/SKILL.md` + 解析全部 bundled SKILL.md 前置元数据的集成测试。
- **描述准确性**: 准确（自 claude-code 移植）。
- **正确性**: ✅ — 纯 prompt skill：纯数字 PID 白名单（防注入）、密钥脱敏、跨平台栈转储、`timeout` 包裹；前置字段经 `parseSkillContent` 正确解析。
- **结论**: 防御性强的诊断 prompt，附带测试是对所有 bundled skill 的回归护栏。

### #4160 refactor(serve): extract createInMemoryChannel helper (#4156 A1)
- **状态**: merged | **关联 issue**: #4156（Stage 1.5b Mode A daemon，引用非 closing）
- **一致性**: ✅ — 行为保持：10 处迁移点各以 `createInMemoryChannel()` 替换等价 4 行模板；第 11 处（需 raw ab/ba 的 kill）正确保留 inline。
- **描述准确性**: ⚠️ — body 宣传"bare API / 5 tests"并论证不需 teardown，但合并版 `inMemoryChannel.ts` 含 `abort()` + 8 测试——描述相对最终代码过时（abort 应为评审中加）。
- **正确性**: ✅ — helper 忠实；`abort()` fire-and-forget。纯测试重构，无运行时风险。
- **结论**: 干净的行为保持抽取，仅 PR 文案低描述了 shipped 的 abort()。

### #4191 [codex] feat(serve): add capability registry protocol versions
- **状态**: merged | **关联 issue**: #4175 / #3803（Related）
- **一致性**: ✅ — 以 `SERVE_CAPABILITY_REGISTRY` + 助手替换硬编码 FIXME，envelope 加 `protocolVersions:{current:'v1',supported:['v1']}`；`STAGE1_FEATURES` 保留为 deprecated alias。
- **描述准确性**: 准确（附加可选字段、v 仍为 1）。
- **正确性**: ✅ — 向后兼容已验证（`protocolVersions?` 可选，SDK 测试"接受无该字段的旧 envelope"通过）；助手返回 fresh copy 防外部 mutate；纯读元数据无 auth/输入面。
- **结论**: 扎实、低风险的协商面铺垫，正确且兼容。

### #4205 test(perf): add daemon baseline harness (#4175 Wave 1 PR 1)
- **状态**: merged | **关联 issue**: #4175（Related）
- **一致性**: ✅ — 纯测试，全在 `integration-tests/`，无生产代码；含 RSS/attach/MCP/SSE/prompt 工具 + 基线 JSON。
- **描述准确性**: 高度准确，预先披露单 scope 局限与后续项。
- **正确性**: ✅ — 方法可靠（`ps -o rss=` 取峰值、丢样比例门、nearest-rank 分位、递归 pgrep 子进程）。Caveat（非缺陷）：默认 `sessionScope:'single'` 下 N 次 attach 同一 session，故 `growthPerSessionMB=0` 量的是 attach 复用而非独立会话成本——已在基线 notes + body 显著说明。
- **结论**: 有意义、诚实界定范围的基线；扁平数字是构造使然且明确披露。

### #4209 feat(serve): per-request sessionScope override on POST /session (#4175 Wave 2 PR 5)
- **状态**: merged | **关联 issue**: #4175（Wave 2 PR 5）/ 解 #3803 FIXME
- **一致性**: ✅ — 加 `BridgeSpawnRequest.sessionScope?`，`spawnOrAttach` 解析 `effectiveScope = req.sessionScope ?? default`；能力标签 + SDK 字段 + docs。
- **描述准确性**: 准确，含评审发现的混合 scope 泄漏叙述。
- **正确性**: ✅ — 无 auth 绕过（bearer/CORS/host 中间件在路由前，scope 在 auth 后）；无升级（跨工作区仍被 `WorkspaceMismatchError` 挡）；override 只增隔离。`doSpawn` 的 `effectiveScope==='single' && !defaultEntry` 真正修了一处泄漏；cap 对 effectiveScope 强制；in-flight tracker 按 effectiveScope keyed 防碰撞。
- **结论**: 实现良好，实为修隔离 bug 而非引入。

### #4214 fix(serve): align integration test + user doc with merged sessionScope override (#4175 follow-up)
- **状态**: merged | **关联 issue**: #4175 follow-up（清理 #4209）
- **一致性**: ✅ — 仅文档+测试：routes 测试 9→10 features 插入 `session_scope_override`（与 registry/server.test 一致）；移除 qwen-serve.md 过时 "blocker" 并重编号。
- **描述准确性**: 准确（解释 PR CI 为何漏：集成测试需真实 daemon spawn，仅 release 跑）。
- **正确性**: ✅ — 顺序与 registry 一致，重编号一致；遗留的 `protocol_versions` 描述属本 PR 重编号范围外。
- **结论**: 正确、机械的 #4209 评审遗留清理。

### #4216 fix(rewind): restore upstream TOCTOU ordering + heal sticky failed marker
- **状态**: merged | **关联 issue**: 无（修 #4064 两处回归）
- **一致性**: ✅ — 把 `trackEdit` 移到 `checkPriorRead` 之前（edit.ts、write-file.ts）；在 `trackEdit` 中 heal `failed` 条目。
- **描述准确性**: 准确（literal port upstream claude-code 顺序）。
- **正确性**: ✅ — 重排真正把"新鲜检查→写"窗口缩回相邻 syscall（无 await）；backup-first 安全（幂等 `{hash}@v{version}`）；heal 对称（early guard + re-check 正确替换失败条目，测试断言新鲜内容）。
- **结论**: 正确、最小、测试充分，复原了丢失的 upstream 不变量。

### #4222 [codex] Add daemon session load/resume
- **状态**: merged | **关联 issue**: 引用（非 closing）#4175
- **一致性**: ✅ — `POST /session/:id/{load,resume}` 路由、bridge `loadSession/resumeSession`、ACP `unstable_resumeSession`、SDK load/resume、capabilities/types/docs 齐全。
- **描述准确性**: 准确，诚实标注并发保守化与缺真机 smoke。
- **正确性**: ✅ — load/resume 正确区分（load 传 conversation→replayHistory，resume 不传）；回放帧经 `pendingRestoreEvents` 缓冲；并发守卫严谨（跨动作拒、同动作 coalesce 且同步预占 attachCount、resourceNotFound 精确匹配）。轻微：resume 已存活 session 仍 seed `lastEventId:0` 会回放现有 ring（边界、有界）。
- **结论**: 体量大但工程化极细致，load/resume 语义与 restore 竞态均正确。

### #4226 feat(serve): advertise typed_event_schema + pin SDK public surface
- **状态**: merged | **关联 issue**: 无（refs #4175 / #4217）
- **一致性**: ✅ — registry 插入 `typed_event_schema`，server.test 与集成镜像同序更新，新增 `daemon-public-surface.test.ts` 围栏。
- **描述准确性**: 准确（冗长无夸大）。
- **正确性**: ✅ — 纯附加，未触 auth；公共面测试类型+运行时双锁 `asKnownDaemonEvent`。瑕疵：registry 注释称 `narrowDaemonEvent` 回退 `kind:'unknown'`，但 SDK 无此符号（仅注释不实）。
- **结论**: 干净的能力标记 + 回归围栏，唯注释引用不存在符号。

### #4235 feat(serve): add client heartbeat (#4175 Wave 2.5 PR 9)
- **状态**: merged | **关联 issue**: 无（实现 Wave 2.5 PR 9，依赖 #4231）
- **一致性**: ✅ — 路由/SDK `heartbeat()`/能力标记/`recordHeartbeat`/`getHeartbeatState`/`SessionEntry` 字段全到位。
- **描述准确性**: 准确（小瑕：称 14 用例，实约 16）。
- **正确性**: ✅ — `recordHeartbeat` 先 `resolveTrustedClientId` 再写，伪造 clientId 抛错且不 bump；`unregisterClient` refcount 归零清理；`getHeartbeatState` 拷贝返回。全同步无 await → 无 TOCTOU；本 PR 无超时逻辑故无心跳/超时竞态。
- **结论**: 资源清理与竞态处理稳健。

### #4236 feat(serve): mutation gating helper and --require-auth
- **状态**: merged | **关联 issue**: 无（Wave 4 PR 15，依赖 #4231）
- **一致性**: ✅ — `createMutationGate` 矩阵、`--require-auth`、条件标记、boot 检查、`/health` 收口、变更路由统一挂 `mutate()` 齐备。
- **描述准确性**: 准确详尽。
- **正确性**: ⚠️ — gate 本身不可绕过；但 `server.ts` 用 `tokenConfigured: opts.token !== undefined`，而 `bearerAuth` 用 `if(!token)`：`--token ""` 时 gate 视为已配置→passthrough，而全局 bearer 仍敞开。本 PR 无 strict 路由故不可利用，应在 Wave 4 前改为 `!!opts.token`。
- **结论**: 集中化与硬化设计正确，需在 strict 路由落地前修空串 token 判定。

### #4237 feat(serve): SSE replay sizing + slow_client_warning backpressure (#4175 Wave 2.5 PR 10)
- **状态**: merged | **关联 issue**: 无（refs PR 10 / #3803）
- **一致性**: ⚠️ — 产品代码与描述完全吻合，但更新了 server.test 却**漏更**集成镜像 `qwen-serve-routes.test.ts`（未加 `slow_client_warning`）——破坏 release CI、需 #4245 修，未守自述 lockstep 纪律。
- **描述准确性**: 产品行为准确；未提漏更镜像。
- **正确性**: ✅ — `BoundedAsyncQueue` 由位置相关 `forcedInBuf` 改为逐条 `forced` + `liveCount`，修了中途 forcePush 致 live 漂移（有回归测试）；告警每 episode 一次 + 滞回；`parseMaxQueuedQuery`/`eventRingSize` 握手前 fail-closed；`safeLogValue` 防注入。
- **结论**: 背压逻辑正确且测试充分，唯一缺口是漏更集成镜像（#4245 补救）。

### #4240 feat(serve): session metadata and close/delete lifecycle (#4175 Wave 2.5 PR 11)
- **状态**: merged | **关联 issue**: #4175 + #3803（非 closing）
- **一致性**: ✅ — `DELETE /session/:id`、`PATCH /session/:id/metadata`、enriched listing、`session_closed`/`session_metadata_updated` 事件、SDK 方法均对应。
- **描述准确性**: 准确（SDK 端吸收 404 实现幂等属实）。
- **正确性**: ✅ — `closeSession` 在首个 await 前同步完成 `byId.delete`/清理/取消 pending 权限，并发双删第二次 404，SDK 吸收 204/404 幂等；metadata 校验类型/256 长度/控制字符。注：无 X-Client-Id 时任何已认证客户端可强关（attribution-only，符合既有设计）。
- **结论**: 实现完整、竞态与幂等到位。

### #4241 feat(serve): add read-only status routes
- **状态**: merged | **关联 issue**: #4175（Related）
- **一致性**: ✅ — 5 条只读路由（workspace mcp/skills/providers + session context/supported-commands）、能力标签、SDK 包装。
- **描述准确性**: 准确（idle 不拉起 ACP、未知 404、脱敏三项均落实）。
- **正确性**: ✅ — `requestWorkspaceStatus` 用 `liveChannelInfo()` 判空不 spawn；未知/dying session 404；脱敏经核：mcp 仅出 name/transport/disabled/description，providers 出 authType（方法名非密钥）/modelId，session context 仅复用已可见的 models/modes；路由用 `boundWorkspace` 无用户路径→无遍历。
- **结论**: 只读、脱敏得当、idle/404 正确，无泄露。

### #4245 fix(serve): align integration test mirrors with merged capability + EventBus changes
- **状态**: merged | **关联 issue**: 无（修 release run，refs #4237/#4241 drift）
- **一致性**: ✅ — 纯测试：routes 镜像 18→24（补 #4237 `slow_client_warning` + #4241 五个标记；`require_auth` 作条件标记正确排除）；SSE 断言 3→4 帧。
- **描述准确性**: 准确诚实（声明把过时 `ringSize:4000` 留作 out-of-scope，并指出这是第 3 次镜像漂移）。
- **正确性**: ✅ — 核对 `daemon_mode_b_main` registry 顺序与镜像一致；帧序与 eventBus.test 吻合；未触产品代码。
- **结论**: 对测试漂移的最小、诚实修复。

### #4247 feat(serve): MCP client guardrails (#4175 Wave 3 PR 14)
- **状态**: merged | **关联 issue**: #4175（Wave 3 PR 14）。已采样核心源，跳过 +1099 测试。
- **一致性**: ⚠️ — 标题/原意"workspace 级"配额，实际为 **per-session**（每会话独立 `McpClientManager`）；描述经 R3 已诚实改写、`buildBudgetCells` 出 `scope:'session'`，故描述与代码现自洽，但"guardrail"对守护进程总量无封顶。
- **描述准确性**: 异常透明，明确标注 per-session 局限并延后 PR 23 共享池。
- **正确性**: ⚠️ — 机制正确：`tryReserveSlot` 同步 check+add（无 TOCTOU），三处 spawn 在 connect 前 refuse，`weReservedSlot` 防 zombie slot 泄漏，正整数校验 + per-handle `childEnvOverrides`（不污染全局 env）。局限：per-session 即总量 = N×budget，多开会话可绕过运营上限（已知、文档化）。
- **结论**: 单会话内不可绕过且无泄漏，但作为"配额"未限守护进程总量，属 v1 已知裁剪（W21 #4336 共享池跟进）。

### #4249 feat(serve): workspace memory and agents CRUD (#4175 Wave 4 PR 16)
- **状态**: merged | **关联 issue**: 无 closingRef；epic #4175 Wave 4 PR 16
- **一致性**: ✅ — 7 路由全落地，POST/DELETE 均 `mutate({strict:true})`，`memory_changed`/`agent_changed` 事件、Proxy 化 Config stub、空白追加抑制均与描述一致。
- **描述准确性**: 准确详尽；唯"memory: static QWEN.md only"略含糊（实际经 `getAllGeminiMdFilenames()` 同列 QWEN.md+AGENTS.md，指排除 auto-memory）。
- **正确性**: ✅ — 路径穿越被拦：`validateAgentType` 用 `/^[\p{L}\p{N}_-]+$/u`+长度上限拒 `/`、`.`；`resolveContextFilePath` 由 scope 枚举定路径无用户路径分量；全局 bearerAuth + strict 双门控。
- **结论**: 安全、消费级质量的 CRUD，路径与鉴权都站得住。

### #4250 refactor(serve): add FileSystemService boundary (#4175 Wave 4 PR 18)
- **状态**: merged | **关联 issue**: 无 closingRef；epic #4175 Wave 4 PR 18
- **一致性**: ✅ — 纯重构：`canonicalizeWorkspace` 抽到 `fs/paths.ts`，bridge import + re-export（行为保持），无新路由/能力标签。
- **描述准确性**: 准确，自审修复（OOM、glob 逃逸、intent 穷尽、unsafe-default）代码可见。
- **正确性**: ✅ — `resolveWithinWorkspace` 边界稳健：可疑模式拒 → 文本 `isWithinRoot` 预筛 → realpath 跟链 → ENOENT 走 lstat+readlink 完整 symlink 链 + inode 环检测 + 目标 containment（封堵悬空/链式 symlink 写逃逸）；read 系预 stat 硬顶 `MAX_READ_BYTES` 防 OOM；默认 factory `trusted:false`。尚未接路由。
- **结论**: 高质量、可证明工作区约束的边界层。

### #4251 feat(serve): preflight and env diagnostics routes (#4175 Wave 3 PR 13)
- **状态**: merged | **关联 issue**: 无 closingRef；epic #4175 Wave 3 PR 13
- **一致性**: ✅ — `GET /workspace/env` + `GET /workspace/preflight`、能力标签、闭合 errorKind 联合，idle 不 spawn。
- **描述准确性**: 准确。
- **正确性**: ✅（机密不泄露）— `buildEnvStatusFromProcess` 仅遍历白名单，env_var cell 只发 `present` 布尔绝不带 value；proxy 经 `safeProxyValue` 降为 host:port；不遍历全量 process.env；preflight 仅 `hasToken=Boolean(...)` 发变量名非值。
- **结论**: 诊断面克制，密钥/令牌/env 值零泄露。

### #4255 feat(serve): auth device-flow route (#4175 Wave 4 PR 21)
- **状态**: merged | **关联 issue**: 无 closingRef；epic #4175 Wave 4 PR 21
- **一致性**: ⚠️ — 4 路由/能力标签/5 事件/SDK/qwenOAuth2 改动均落地；但"What ships"表称 `GET …/device-flow/:id` 为 "bearerAuth only"，合并代码经 fold-in 升级为 `mutate({strict:true})`（防 userCode 偷窥）——表过时，但代码更严。
- **描述准确性**: 基本准确，仅上述 GET 门控表行与代码不符（向更安全方向）。
- **正确性**: ✅ — PKCE S256；密钥经 `BrandedSecret`（冻结+WeakMap，转换即 `[redacted]`）；`toPublicView` 永不含密钥、终态丢弃 userCode；令牌 `cacheQwenCredentials` 原子 temp + `0o600`，chmod 失败拒发布；IdP 原始错误仅截断进 stderr，不入 SSE/响应。POST/DELETE/GET-by-id strict。
- **结论**: 安全关键路径处理极审慎，唯 PR 描述的 GET 门控表行需更新。

---

## 重点跟进清单

### Merged（建议优先处理）
1. **#4097**（实测仍是 main 回归）：把 `prompt`（并建议补 `function`）加回 `settingsSchema.ts:190` 的 hook type 枚举 —— 当前运行时支持 `command/http/function/prompt`，但 schema 仅允许 `command/http`，会拒绝合法 hook 配置。另把夹带的 `dynamicCommandTranslation` 在描述/历史中澄清。
2. **#4236**（serve auth）：把 `tokenConfigured` 改为 `!!opts.token`，避免 `--token ""` 时 gate passthrough 而 bearer 敞开——需在 Wave 4 strict 路由落地前修。
3. **#4096 / #4064**（已有后续）：uid/gid 丢失已由 #4431 修；rewind 覆盖用户后续手改 + RewindSelector 误导提示建议修文案或加二次确认。

### Merged（仅记录 / 描述层面）
4. **#4071 / #4160 / #4226 / #4237 / #4255**：描述/注释与最终代码的小出入（dead-code span API、低描述 abort()、注释引用不存在符号、漏更镜像、GET 门控表过时）——非阻塞，建议同步描述。
5. **#4247**：per-session MCP 配额不限守护进程总量（已披露），W21 #4336 共享池为后续。

---

## 深挖补充（2026-05-31，来自 feature 深度文档）

> 写 `feature/daemon-serve-mode/`、`feature/telemetry-observability/` 深度文档时对本周 PR 的进一步核实。

- **#4126**（统一 span 创建）：`session-tracing.ts:resolveParentContext` 与 `tracer.ts:getParentContext` 的优先级**仅靠一条 `// SYNC:` 注释保持一致**，无编译期约束，易漂移。另：interaction span 有意绕过 `resolveParentContext` 直接钉到 session 根（#4499，属设计非缺陷）。
- **#4245**（E2E 镜像对齐）：注册表↔集成镜像漂移**当前在 `daemon_mode_b_main` 上仍 live**——`qwen-serve-routes.test.ts` 列 39 标签 vs 注册表 advertised 45，缺 6 个（`session_context_usage`/`mcp_server_runtime_mutation`/`session_recap`/`session_btw`/`permission_mediation`/`non_blocking_prompt`），是 #4214/#4245/#4284/#4306 模式的**第 5 次复发**（根因：集成测试仅 nightly/release 跑 + 镜像手维护）。

_审查于 2026-05-30；方法：7 个并行只读子代理逐 PR 拉取 issue+描述+diff（大 PR 抽样核心源码），#4097 由主代理在本地 main 核验 schema vs 运行时。_
