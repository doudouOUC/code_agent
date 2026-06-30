# qwen-code PRs · 2026-05-18 ~ 2026-05-24  (W21)

**主题**: serve 路由密集开发、acp-bridge 大重构、telemetry Phase 1.5–4、原子写、F1/F2/F3

**统计**: 43 PRs — 36 merged / 3 open / 4 closed
**代码量**: +120,272 / -20,559，920 个文件变更
**类型**: feat ×18, fix ×15, refactor ×5, docs ×3, perf ×1, chore ×1
**范围 (scope)**: serve ×18, telemetry ×9, acp-bridge ×6, core ×5, sdk ×1, developers ×1, cli ×1, build ×1, integration ×1, deploy ×1

**本周最大改动**:
- [#4469](https://github.com/QwenLM/qwen-code/pull/4469) (+50124/-9334, 423 files) chore(integration): sync main into daemon_mode_b_main (2026-05-24)
- [#4336](https://github.com/QwenLM/qwen-code/pull/4336) (+10308/-147, 38 files) feat(serve): shared MCP transport pool [F2]
- [#4319](https://github.com/QwenLM/qwen-code/pull/4319) (+5620/-4710, 19 files) feat(acp-bridge): F1 — acp-bridge package self-sufficiency (#4175 mechanical lift + BridgeFileSystem seam)

| PR | 状态 | 类型 | 标题 | 变更 | 文件 | 创建 | 合并/关闭 | 链接 |
|---|---|---|---|---|---|---|---|---|
| #4269 | ✅ merged | feat(serve) | feat(serve): safe workspace file read routes (#4175 PR 19) _[skip-changelog]_ | +1454/-8 | 10 | 05-18 | 05-18 | https://github.com/QwenLM/qwen-code/pull/4269 |
| #4271 | ✅ merged | feat(serve) | feat(serve): MCP guardrail push events + hysteresis (#4175 Wave 3 PR 14b) _[skip-changelog]_ | +3329/-266 | 19 | 05-18 | 05-18 | https://github.com/QwenLM/qwen-code/pull/4271 |
| #4279 | ✅ merged | fix(serve) | fix(serve): normalize Windows path separators in workspace file read responses _[skip-changelog]_ | +7/-1 | 1 | 05-18 | 05-18 | https://github.com/QwenLM/qwen-code/pull/4279 |
| #4280 | ✅ merged | feat(serve) | feat(serve): add workspace file write/edit routes (#4175 PR20) _[skip-changelog]_ | +2557/-266 | 25 | 05-18 | 05-18 | https://github.com/QwenLM/qwen-code/pull/4280 |
| #4282 | ✅ merged | feat(serve) | feat(serve): approval / tools / init / MCP-restart mutation routes (#4175 Wave 4 PR 17) _[skip-changelog]_ | +3685/-13 | 28 | 05-18 | 05-18 | https://github.com/QwenLM/qwen-code/pull/4282 |
| #4284 | ✅ merged | fix(serve) | fix(serve): sync E2E baseline capabilities with registry _[skip-changelog]_ | +3/-0 | 1 | 05-18 | 05-18 | https://github.com/QwenLM/qwen-code/pull/4284 |
| #4291 | ✅ merged | fix(serve) | fix(serve): auth device-flow follow-up for #4255 review threads _[skip-changelog]_ | +1406/-31 | 7 | 05-18 | 05-18 | https://github.com/QwenLM/qwen-code/pull/4291 |
| #4293 | ⬜ closed | fix(serve) | fix(serve): sync E2E baseline with PR20/PR21 capabilities | +3/-0 | 1 | 05-18 | 05-18 | https://github.com/QwenLM/qwen-code/pull/4293 |
| #4295 | ✅ merged | refactor(acp-bridge) | refactor(acp-bridge): create skeleton + lift zero-coupling primitives (#4175 PR 22a) _[skip-changelog]_ | +1106/-688 | 17 | 05-18 | 05-18 | https://github.com/QwenLM/qwen-code/pull/4295 |
| #4297 | ✅ merged | fix(serve) | fix(serve): post-merge P2 corrections from Codex review on #4282 | +1695/-61 | 15 | 05-18 | 05-19 | https://github.com/QwenLM/qwen-code/pull/4297 |
| #4298 | ✅ merged | refactor(acp-bridge) | refactor(acp-bridge): lift status, paths, errors, and bridge types (#4175 PR 22b/1) _[skip-changelog]_ | +1431/-1450 | 12 | 05-18 | 05-18 | https://github.com/QwenLM/qwen-code/pull/4298 |
| #4300 | ✅ merged | refactor(serve) | refactor(serve): typed errors for channel-closed and missing-cli-entry (#4299) _[skip-changelog]_ | +118/-29 | 3 | 05-18 | 05-18 | https://github.com/QwenLM/qwen-code/pull/4300 |
| #4302 | ✅ merged | fix(telemetry) | fix(telemetry): Phase 1.5 polish — fallback order, abort-as-result, log/span consistency | +454/-65 | 7 | 05-18 | 05-19 | https://github.com/QwenLM/qwen-code/pull/4302 |
| #4304 | ✅ merged | refactor(acp-bridge) | refactor(acp-bridge): lift BridgeOptions + introduce DaemonStatusProvider seam (#4175 PR 22b/2) _[skip-changelog]_ | +852/-371 | 11 | 05-18 | 05-19 | https://github.com/QwenLM/qwen-code/pull/4304 |
| #4305 | ✅ merged | fix(serve) | fix(serve): post-merge fixes for #4291 review (7 threads) | +768/-161 | 5 | 05-18 | 05-19 | https://github.com/QwenLM/qwen-code/pull/4305 |
| #4306 | ✅ merged | fix(serve) | fix(serve): unbreak E2E after #4271 (capabilities + clientCount) _[skip-changelog]_ | +48/-40 | 2 | 05-19 | 05-19 | https://github.com/QwenLM/qwen-code/pull/4306 |
| #4312 | ⬜ closed | fix(serve) | fix(serve): post-merge review fixes for #4291 [daemon_mode_b_main mirror] | +768/-161 | 5 | 05-19 | 05-19 | https://github.com/QwenLM/qwen-code/pull/4312 |
| #4313 | ⬜ closed | fix(serve) | fix(serve): post-PR-17 Codex P2 fold-ins (against daemon_mode_b_main) | +1497/-58 | 14 | 05-19 | 05-19 | https://github.com/QwenLM/qwen-code/pull/4313 |
| #4319 | ✅ merged | feat(acp-bridge) | feat(acp-bridge): F1 — acp-bridge package self-sufficiency (#4175 mechanical lift + BridgeFileSystem seam) | +5620/-4710 | 19 | 05-19 | 05-19 | https://github.com/QwenLM/qwen-code/pull/4319 |
| #4321 | ✅ merged | feat(telemetry) | feat(telemetry): Phase 2 — tool.blocked_on_user + hook spans (#3731) | +3287/-99 | 8 | 05-19 | 05-21 | https://github.com/QwenLM/qwen-code/pull/4321 |
| #4333 | ✅ merged | feat(core) | feat(core): atomic write rollout for credentials, memory, config, JSONL (closes #3681, #4095 Phase 2) | +2308/-155 | 31 | 05-19 | — | https://github.com/QwenLM/qwen-code/pull/4333 |
| #4334 | ✅ merged | feat(serve) | feat(serve): F1 follow-up — BridgeFileSystem wiring + #4325 channelInfo fix | +1365/-59 | 9 | 05-19 | 05-20 | https://github.com/QwenLM/qwen-code/pull/4334 |
| #4335 | ✅ merged | feat(acp-bridge) | feat(acp-bridge): F3 — multi-client permission coordination (#4175) | +5263/-417 | 27 | 05-19 | 05-20 | https://github.com/QwenLM/qwen-code/pull/4335 |
| #4336 | ✅ merged | feat(serve) | feat(serve): shared MCP transport pool [F2] | +10308/-147 | 38 | 05-19 | 05-21 | https://github.com/QwenLM/qwen-code/pull/4336 |
| #4360 | ✅ merged | feat(serve+sdk) | feat(serve+sdk): F4 prereq — daemon protocol completion (serverTimestamp / provenance / errorKind / state_resync_required) | +1500/-26 | 13 | 05-20 | 05-21 | https://github.com/QwenLM/qwen-code/pull/4360 |
| #4366 | ✅ merged | fix(core) | fix(core): stop AbortSignal listener leak in long sessions (MaxListenersExceededWarning) _[type/bug]_ | +1698/-562 | 25 | 05-20 | 05-26 | https://github.com/QwenLM/qwen-code/pull/4366 |
| #4367 | ✅ merged | feat(telemetry) | feat(telemetry): support custom resource attributes and add metric cardinality controls _[ToB]_ | +1897/-60 | 13 | 05-20 | 05-21 | https://github.com/QwenLM/qwen-code/pull/4367 |
| #4390 | ✅ merged | feat(telemetry) | feat(telemetry): client-side HTTP span + opt-in W3C traceparent propagation (#4384) _[status/on-hold, type/feature-request, scope/data-privacy, need-discussion]_ | +1822/-5 | 14 | 05-21 | 05-25 | https://github.com/QwenLM/qwen-code/pull/4390 |
| #4393 | ⬜ closed | feat(telemetry) | feat(telemetry): propagate X-Qwen-Code-Session-Id on outbound LLM requests (part 2 of #4384) | +533/-51 | 13 | 05-21 | 05-21 | https://github.com/QwenLM/qwen-code/pull/4393 |
| #4410 | 🟡 open | feat(telemetry) | feat(telemetry): Phase 3 — qwen-code.subagent span with concurrent isolation (#3731) | +2335/-91 | 11 | 05-21 | — | https://github.com/QwenLM/qwen-code/pull/4410 |
| #4411 | ✅ merged | perf(core) | perf(core): F2 cleanup PR A — R9/W11/W12/R10 (post-merge follow-ups) | +823/-594 | 8 | 05-21 | 05-23 | https://github.com/QwenLM/qwen-code/pull/4411 |
| #4412 | 🟡 open | docs(developers) | docs(developers): add daemon-mode developer deep-dive documentation set | +4513/-0 | 23 | 05-21 | — | https://github.com/QwenLM/qwen-code/pull/4412 |
| #4414 | ✅ merged | feat(cli) | feat(cli): background housekeeping for stale file-history dirs | +1059/-12 | 13 | 05-21 | — | https://github.com/QwenLM/qwen-code/pull/4414 |
| #4417 | ✅ merged | feat(telemetry) | feat(telemetry): Phase 4a — TTFT capture + GenAI semconv dual-emit (#3731) | +1190/-2 | 7 | 05-22 | 05-22 | https://github.com/QwenLM/qwen-code/pull/4417 |
| #4431 | ✅ merged | fix(core) | fix(core): preserve uid/gid in atomicWriteFile to avoid breaking shared-write files | +203/-47 | 4 | 05-22 | — | https://github.com/QwenLM/qwen-code/pull/4431 |
| #4432 | 🟡 open | feat(telemetry) | feat(telemetry): Phase 4b — retry visibility for qwen-code.llm_request (#3731) | +1240/-40 | 18 | 05-22 | — | https://github.com/QwenLM/qwen-code/pull/4432 |
| #4445 | ✅ merged | refactor(acp-bridge) | refactor(acp-bridge): F1 test split — lift bridge.test.ts (6861 LOC) to acp-bridge | +597/-449 | 5 | 05-22 | 05-23 | https://github.com/QwenLM/qwen-code/pull/4445 |
| #4453 | ✅ merged | fix(build) | fix(build): clean stale outputs before tsc --build to prevent TS5055 | +9/-1 | 1 | 05-23 | 05-23 | https://github.com/QwenLM/qwen-code/pull/4453 |
| #4460 | ✅ merged | fix(core) | fix(core): F2 cleanup PR B — self-heal observability (W133-a + W134) | +405/-5 | 3 | 05-23 | 05-23 | https://github.com/QwenLM/qwen-code/pull/4460 |
| #4469 | ✅ merged | chore(integration) | chore(integration): sync main into daemon_mode_b_main (2026-05-24) | +50124/-9334 | 423 | 05-23 | 05-24 | https://github.com/QwenLM/qwen-code/pull/4469 |
| #4473 | ✅ merged | docs(serve) | docs(serve): v0.16-alpha known limits + SDK QWEN_SERVER_TOKEN env fallback (PR 27) | +175/-6 | 4 | 05-24 | 05-24 | https://github.com/QwenLM/qwen-code/pull/4473 |
| #4482 | ✅ merged | fix(telemetry) | fix(telemetry): improve LogToSpan bridge error info and TUI handling _[type/bug]_ | +593/-17 | 4 | 05-24 | 05-27 | https://github.com/QwenLM/qwen-code/pull/4482 |
| #4483 | ✅ merged | docs(deploy) | docs(deploy): local launch templates for v0.16-alpha (PR 30a) | +224/-1 | 3 | 05-24 | 05-25 | https://github.com/QwenLM/qwen-code/pull/4483 |

---

## PR 解决问题与实现方式

> 来源：同目录 `review.md` 的逐 PR diff 审查，结合 PR 状态与标题压缩成“解决了什么问题 / 怎么做的”。open/closed PR 只记录当前观察，不写成已落地实现。

| PR | 解决了什么问题 | 怎么做的 |
|---|---|---|
| [#4269](https://github.com/QwenLM/qwen-code/pull/4269) | 只读文件路由，路径限制严谨 | `applyReadHeaders`(no-store+nosniff)、`sendFsError` 复用映射、glob 默认5000/上限50000、PR18 follow-up 均落地。路径限制委托 `paths.ts:resolveDaemonInputPath`（textual `..` 预过滤 + realpath + 符号链接链）+ glob `symlink_escape` 过滤；`list` 用 `opendir` 不跟随； |
| [#4271](https://github.com/QwenLM/qwen-code/pull/4271) | MCP 守卫推送+迟滞；阈值断言条目陈旧 | 迟滞(0.75/0.375)、`refused_batch` 合并、off 模式剥离回调、桥丢弃未知 method 均属实；但测试计划写"rejects thresholdRatio !==0.75"与代码矛盾——`isMcpBudgetWarningData` 经 codex round 6 改为 `isFiniteNumber`（描述未更新）。`evaluateBudgetState` 迟滞正确；拒 `mode:'warn'`； |
| [#4279](https://github.com/QwenLM/qwen-code/pull/4279) | 规范化 Windows 路径分隔符，单行精准 | 单行：`workspaceRelative` 按 `path.sep` 切分再以 `/` 连接。 POSIX 原样透传（保留文件名合法反斜杠），仅 Windows 规范化；空串仍 `'.'`。 |
| [#4280](https://github.com/QwenLM/qwen-code/pull/4280) | 文件写/编辑路由，鉴权严格+符号链接防护到位 | `workspace_file_write`/`_bytes` 标签、写路由 `mutate({strict:true})`、`/file` 加 hash、有界 `/file/bytes`、`parseIntInRange`→`isSafeInteger`，均吻合。strict 鉴权（无 token loopback 401）+ `resolveOriginatorClientId` 校验 `knownClientIds()`； |
| [#4282](https://github.com/QwenLM/qwen-code/pull/4282) | 变更路由 strict 门控+trust-gate 403 | 4 路由均 `mutate({strict:true})`；core 新增 `TrustGateError`/`Config.disabledTools`/`isToolDisabled`/`isServerDiscovering`。仅正文 coordination notes 的 E2E 折入 tag 名写错。approval-mode 闭合枚举校验 + untrusted 目录特权模式抛 `TrustGateError`→403； |
| [#4284](https://github.com/QwenLM/qwen-code/pull/4284) | 同步 E2E baseline，纯测试 | 在 `workspace_providers`/`mcp_guardrails` 后补标签，与正文一致。 仅同步 baseline，顺序匹配 registry。 |
| [#4291](https://github.com/QwenLM/qwen-code/pull/4291) | device-flow 加固；body 表述落后于更安全的代码 | 5 项中 4 项匹配（30s poll 超时 race、GET clientId 脱敏门、`cancellerRecorded` first-writer、union 加 `not_found_or_evicted`）；但正文表 #1 称"writes raw err.message to stderr"，代码恰相反——`sanitizeForStderr` 仅输出结构化 `oauthError=`，刻意不打印 raw（防 device_code 泄漏）。 |
| [#4293](https://github.com/QwenLM/qwen-code/pull/4293) | 未作为已落地实现；被 #4282/#4306 取代的重复 PR，正确关闭。 | diff 正确叠加 3 个 tag，但被取代：#4282 已折入同样 3 tag。 （本可生效）但冗余；main 经 #4282+#4306 已含全部 tag。 |
| [#4295](https://github.com/QwenLM/qwen-code/pull/4295) | acp-bridge 骨架+零耦合搬迁，行为保持 | `eventBus`/`inMemoryChannel` 移入，cli 侧 `export *` 包装；`permission.ts` 为 6 个纯类型声明无运行时（与 "PR 24 填充" 吻合）。 纯 lift，包装器保留所有 import 站点，无行为改动。 |
| [#4297](https://github.com/QwenLM/qwen-code/pull/4297) | #4282 P2 修正；body 少报 fold-in 且 P2-2 与最终行为矛盾 | 4 个 P2 落地正确，但合并版还含正文未提的 fold-in 1/2/3/5/7/9/10（`WorkspaceInitRaceError`、`'wx'` 原子创建、`verifyParentWithinWorkspace` 等）。 父链 realpath 校验、`setDisabledTools` 防御拷贝、`fetchWithTimeout` 的 0=禁用/NaN→默认 均正确。 |
| [#4298](https://github.com/QwenLM/qwen-code/pull/4298) | lift status/paths/errors，逐字节一致 | `status.ts`(600行) 搬迁 + `export *`；11 个 error 类 re-export；`MAX_WORKSPACE_PATH_LENGTH` 两处 re-export。 唯一非类型代码 `canonicalizeWorkspace` 与原版逐字节相同；error 类 verbatim。 |
| [#4300](https://github.com/QwenLM/qwen-code/pull/4300) | typed error 替代正则，按预期收紧分类 | 新增两 error，全部 throw 站点改 typed，消息 byte-for-byte 保留，无遗漏。 故意收紧（foreign error→undefined）即为修的 bug；正确保留 `protocol_error`（未盲从 issue 笔误）。 |
| [#4302](https://github.com/QwenLM/qwen-code/pull/4302) | telemetry Phase 1.5 收尾，描述高度吻合 | 4 项全落地：`resolveParentContext()` 统一三处、exec span 抓 `signal.aborted` 传 cancelled、test mock 补常量、idle-timeout 用 `spanEndedByTimeout` gate 成功+catch 两路。 优先级与 `tracer.ts:getParentContext()` 一致；cancelled 时跳过 setStatus 保持 UNSET 与父 span 一致。 |
| [#4304](https://github.com/QwenLM/qwen-code/pull/4304) | seam 设计扎实；夹带未披露的 SkillError 改动 | `BridgeOptions`/`DaemonStatusProvider` 抽出、`buildDaemonPreflightCells` 移入均符；但未披露夹带的 `mapDomainErrorToErrorKind` 中 SkillError 放宽（#4298 fold-in），且 Wiring 段漏提 `server.ts:248` 注入。两生产构造点均注入 `createDaemonStatusProvider()`，lift 等价； |
| [#4305](https://github.com/QwenLM/qwen-code/pull/4305) | device-flow 评审修复；标题"7 threads"严重少报 | 表格 7 项（round-4）命中，但 diff 还含未记录的 round-5/6（`pollTimedOut` 竞态、品牌自过滤、Unicode/Trojan-Source 净化、terminal `.catch()`）；`deviceFlow.ts +256/-50` 远超"7 threads"。 |
| [#4306](https://github.com/QwenLM/qwen-code/pull/4306) | 修 #4271 后 E2E，纯测试对症 | 仅改两个集成测试，补 `mcp_guardrail_events`、pgrep 期望改 `*2`。 保留两条不变式；`N*2` 硬编码偏脆但作为未来统一 manager 的 tripwire，有意为之。 |
| [#4312](https://github.com/QwenLM/qwen-code/pull/4312) | 未作为已落地实现；#4305 的重复 PR，正确关闭。 | 确认为 #4305 的重复（同 head 分支、同 base、正文与增删行数完全相同）；承袭同样"少报 rounds 5-6"。 即 #4305 内容，无独立问题。 |
| [#4313](https://github.com/QwenLM/qwen-code/pull/4313) | 未作为已落地实现；#4297 的更早快照重复，正确关闭。 | 确认为 #4297 的重复（同 head 分支、正文逐字相同），其 diff 是较早快照（无 fold-in 9/10）。 同 #4297 早期代码，无独立问题。 |
| [#4319](https://github.com/QwenLM/qwen-code/pull/4319) | acp-bridge F1 自足；lift 行为保持，文件清单陈旧 | 核心 lift+seam 与描述吻合，但正文 file-diff 表陈旧（漏列 acpAgent.ts/config.ts/DaemonClient.ts 等）；且夹带 #4329 helper 抽取与 SDK 超时 300→330s（prose 有提及）。经与 main pre-F1 `writeTextFile/readTextFile` 逐字对比 lift 行为保持；`BridgeFileSystem` 可选，缺省回落内联 proxy，不削弱 confinement； |
| [#4321](https://github.com/QwenLM/qwen-code/pull/4321) | telemetry Phase 2，防泄漏无 PII，187 测试 | `blocked_on_user`/`hook` span、tool span 生命周期移入 `_schedule`、callId-keyed Map、`withHookSpan` 包 6 处、显式传 span 规避 findLast。正文端点计数略少报（偏安全方向）。仅 setAttributes 保持 UNSET、仅 hook throw 才 ERROR；`spanCtx.ended` 幂等； |
| [#4333](https://github.com/QwenLM/qwen-code/pull/4333) | 原子写铺开扎实；debugLogger flush 描述与代码相反 | credentials（oauth/file-token/sharedTokenManager）正确经 `atomicWriteFile {mode:0o600,forceMode,noFollow}`；jsonl `flush:true`；logger/LSP/memory/config 全迁移。 |
| [#4334](https://github.com/QwenLM/qwen-code/pull/4334) | BridgeFileSystem 接线 + #4325 修复，无 TOCTOU | 三项核实：`closeSession`/`killSession` 改用 `channelInfoForEntry(entry)`（#4325 两行修复）；`bridgeFileSystemAdapter.ts` 经 `resolveBridgeFsFactory` 注入；`writeTextOverwrite` 加 mode 保留/0o600/符号链接拒。 |
| [#4335](https://github.com/QwenLM/qwen-code/pull/4335) | 多客户端权限协调，并发不变量成立 | 4 策略、3 typed error（403/501/500）、2 SSE 事件、`permissionStrategy`/`consensusQuorum` 设置、`permission_mediation` 能力均符。并发不变量成立：`request()` 在 executor 同步注册；`resolveEntry` 经身份检查防 double-resolve，`safeEmit`/`safeAudit` 全 try/catch 故 Promise 必 settle； |
| [#4336](https://github.com/QwenLM/qwen-code/pull/4336) | 共享 MCP 传输池，生命周期/引用计数谨慎 | 池默认开（`QWEN_SERVE_NO_MCP_POOL=1` 关）、workspace 级、fingerprint 排除 per-session 过滤、`spawnInFlight` 去重、drain+max-idle 硬顶、`sessionToEntries` 反查、`evictEntry`/预算释放、跨平台 pid sweep；已接入 acpAgent（killSession→releaseSession、SIGTERM→drainAll）。 |
| [#4360](https://github.com/QwenLM/qwen-code/pull/4360) | F4 协议补全，向后兼容干净 | `serverTimestamp`(_meta)、`resolveToolProvenance`(mcp__ 启发式)、`errorKind`(mapDomainErrorToErrorKind)、`state_resync_required`(环淘汰检出) + SDK reducer `awaitingResync` 门控均落地。 gap 检测正确（非终态跳过但游标推进、终态透传）；provenance 对畸形名回退 builtin。 |
| [#4366](https://github.com/QwenLM/qwen-code/pull/4366) | 修 AbortSignal 监听器泄漏，双层修复货真价实 | `createChildAbortController`({once:true}+WeakRef+反向清理)、调用点均 finally abort、`promptHookRunner` 真实泄漏修复、删 `combinedAbortSignal` shim、移除 `pipeline.ts` band-aid。泄漏确被修复：子 abort 反向摘除父监听器，且每子都在 finally abort（二者皆满足）；无功能回归；band-aid 移除安全（cap 50+每轮 GC）。 |
| [#4367](https://github.com/QwenLM/qwen-code/pull/4367) | 自定义资源属性+把 session.id 移出 metrics | `resource-attributes.ts` 解析器、保留键、合并优先级、`OTEL_SERVICE_NAME`、session.id 移出 Resource、`includeSessionId` 默认 false 均落地。`getCommonAttributes` 按开关注入；sdk.ts defense-in-depth 从 Resource 剥离 session.id；解析器 percent-decode 防 `service%2Eversion` 绕过保留键。 |
| [#4390](https://github.com/QwenLM/qwen-code/pull/4390) | client HTTP span + opt-in traceparent，默认安全 | 默认装 `NOOP_PROPAGATOR`、经 `outboundCorrelation.propagateTraceContext` opt-in、undici client span、OTLP 反馈环 guard；session-id 部分已拆出。默认安全（NOOP inject 为空，不泄漏）；OTLP guard origin+path 边界防环。 |
| [#4393](https://github.com/QwenLM/qwen-code/pull/4393) | 未作为已落地实现；session-id 传播，因无 allowlist 隐私隐患被重构取代。 | 代码实现所述（openai/anthropic fetch wrapper 注入 header，Gemini 静态 header 并文档化 staleness）。（关闭合理）— session-id 先合入 #4390 后又被 R4 整体移除→改到未来 `outboundCorrelation.*`； |
| [#4410](https://github.com/QwenLM/qwen-code/pull/4410) | 仍在观察，尚未作为已落地实现；当前目标是 Phase 3 subagent span，并发隔离正确。 | `startSubagentSpan`/`runInSubagentSpanContext`、hybrid traceId（foreground 子 span / fork root+Link）、type-aware TTL、LogToSpan skip-list、GenAI 双发、depth 均落地。`subagentContext` ALS 隔离； |
| [#4411](https://github.com/QwenLM/qwen-code/pull/4411) | F2 cleanup A，纯重构行为保持 | R9 构造器收敛、W12 `compileNameFilter` 预编译 Set、R10 `ps` 快照+pgrep 回退均符（W11 仅读 commit 说明）。 `walkDescendants` 含 visited 防环、保留 MAX 上限、回退；filter 语义保留；R9 字段赋值不变。R10 还修了 BFS 跨层漏抓。 |
| [#4412](https://github.com/QwenLM/qwen-code/pull/4412) | 仍在观察，尚未作为已落地实现；当前目标是 daemon 开发文档；非杜撰但 doc-rot（事件数/行号过时）。 | 结构属实（23 文件 ~4366 行中文文档+导航），但标榜的可验证不变量已随分支漂移。 未杜撰行为（4 策略 union、createServeApp/runQwenServe/serveCommand 调用链符号皆真实）；但 09 少计 9 个事件（mcp_server_added/removed、permission_partial_vote 等）。 |
| [#4414](https://github.com/QwenLM/qwen-code/pull/4414) | file-history 后台清理，数据丢失防护充分 | 30 天 mtime 扫除、10min 延迟/24h 周期、idle 门控、O_EXCL 锁+marker 节流、排除当前 session、全 `.unref()`。`getCutoffDate` 对 ≤0 clamp 1h 防全删；`excludeSessionIds` lazy `getSessionId()` 抗 /clear；`tryAcquire` 用 `'wx'` 原子；仅 REPL 门控。 |
| [#4417](https://github.com/QwenLM/qwen-code/pull/4417) | Phase 4a TTFT + 语义双发，无双计 | `hasUserVisibleContent` 首 token 检测、TTFT 用方法内闭包、`LLMRequestMetadata` 扩展、`endLLMRequestSpan` 写 attr+dual-emit 均符。dual-emit 仅并列写 `gen_ai.*` attr 键（非 counter），不双计；`sampling_ms=max(0,dur-ttft-setup)`、`tokens_per_second` 有除零守卫； |
| [#4431](https://github.com/QwenLM/qwen-code/pull/4431) | 修 #4096 属主丢失；实为 uid-only，"uid/gid"超出实现 | 实现并非 fchown，而是 inode 保留：uid 不符时走 in-place `fs.writeFile`；isFile() FIFO 守卫、`resolveSymlinkChain`、win32 守卫均符。核心路径正确（Docker root、他人属主两上报场景均命中）；但 (a) 同 uid/异 gid 共享文件在 Linux 非 setgid 目录仍经 rename 丢组； |
| [#4432](https://github.com/QwenLM/qwen-code/pull/4432) | 仍在观察，尚未作为已落地实现；当前目标是 Phase 4b retry 可见性，sampling_ms 公式修复正确。 | 9 项组件全落地：`retryContext.ts`(ALS)、`retry.ts` onRetry+单调 iterationCount、`ApiRetryEvent`、`logApiRetry` 三汇、`api.retry.count{model}`、sampling_ms 修复、`snapshotRetryMetadata`、4 调用点。 |
| [#4445](https://github.com/QwenLM/qwen-code/pull/4445) | 测试拆分 lift；body 对 testUtils 是否发布自相矛盾 | 移动忠实（similarity 94% 重命名、零生产改动、跨包解析按述）；但正文称 testUtils.js "does ship in dist"，而 `package.json` `files` 实际用 `"!dist/internal/testUtils.*"` 主动排除，二者矛盾（JSDoc 又称经 `.npmignore` 排除，实际无 .npmignore）。仅 test/config/fixture，无生产改动；blame 经重命名保留； |
| [#4453](https://github.com/QwenLM/qwen-code/pull/4453) | 修 TS5055；body 讲 tsc --clean，代码实为 rmSync（相反） | （已核验）— 正文称 "prepends `tsc --build --clean`" 并论证"用 `tsc -b --clean` 而非 rmSync"； |
| [#4460](https://github.com/QwenLM/qwen-code/pull/4460) | F2 cleanup B 自愈可观测性，逻辑正确 | W133-a：`mcp-client.ts` 加 `lastTransportError`/getter，onerror 中先赋值后 updateStatus、connect 顶部重置；W120 静默丢弃拼接 `: <msg>`。W134：`sweepAndDisconnect` 返回 `SweepResult`，对 pidSweepError/partial-signal 发 `debugLogger.warn`。 |
| [#4469](https://github.com/QwenLM/qwen-code/pull/4469) | 423 文件集成同步，分组与范围吻合 | （按文件分组）— 分页确认 423 文件 / +50124；分组 core 193 / cli 134 / vscode 31 / sdk 5 / channels 5 / scripts 17 / docs 23，与"main→分支广域同步"吻合；45 commits+1 merge 与"45 commits"一致；4 个声明冲突文件均存在且 churn 自洽。 机械同步，分组无语义重叠红旗；typecheck/291/946 测试结论未实跑（按分组评估）。 |
| [#4473](https://github.com/QwenLM/qwen-code/pull/4473) | SDK QWEN_SERVER_TOKEN env fallback，码文一致 | `DaemonClient.ts` 加 `readTokenFromEnv()`、改 `this.token = opts.token ?? readTokenFromEnv()`，与描述完全一致。 `readTokenFromEnv` try/catch + `typeof raw!=='string'` 守卫稳健。 |
| [#4482](https://github.com/QwenLM/qwen-code/pull/4482) | LogToSpan 错误信息+TUI 处理，范围清晰 | `formatExportError`、可注入 `diagnosticsSink`、仅 `isInteractive()` 才注入 `debugLogger.warn` sink 均符。 `typeof extra.code==='number'` 守卫避免误标 httpCode；`emitDiagnostic` 吞 sink 异常；`LogToSpanDiagnosticsSink` 确未从 index 再导出。 |
| [#4483](https://github.com/QwenLM/qwen-code/pull/4483) | 本地启动模板文档，实际比摘要更稳妥 | 含 4 种启动器（systemd/launchd/tmux/nohup）+ token 轮换 + smoke check；`qwen-serve.md`/`_meta.ts` 交叉链接均符。 纯 markdown，交叉链接有效，引用 #4473 SDK fallback 与真实代码一致。 |
