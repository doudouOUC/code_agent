# qwen-code PR 审查 · 2026-05-18 ~ 2026-05-24 (W21)

**审查方法**：逐个 PR 拉取 _关联 issue + PR 描述 + 代码 diff_，核对 (1) 描述↔实现 **一致性**；(2) 描述 **准确性**；(3) 代码 **正确性**。评级：✅ 良好 / ⚠️ 有出入或小隐患 / ❌ 明显不符。大型/集成 PR（#4319/#4321/#4335/#4336/#4469 等）按文件分组抽样核心源码。#4453 关键结论已在本地 main 核验。

> 说明：serve/acp-bridge 系 PR 多合入集成分支 `daemon_mode_b_main`，本地 main 未含或已被后续改写，故以各自 diff / mergeCommit 为准。本周 43 个 PR 是单周最高峰（daemon/serve 路由 + acp-bridge 抽包 + telemetry Phase 2–4 + 原子写）。

---

## 汇总

| PR | 状态 | 一致性 | 正确性 | 一句话 |
|---|---|---|---|---|
| [#4269](https://github.com/QwenLM/qwen-code/pull/4269) | merged | ✅ | ✅ | 只读文件路由，路径限制严谨 |
| [#4271](https://github.com/QwenLM/qwen-code/pull/4271) | merged | ⚠️ | ✅ | MCP 守卫推送+迟滞；阈值断言条目陈旧 |
| [#4279](https://github.com/QwenLM/qwen-code/pull/4279) | merged | ✅ | ✅ | 规范化 Windows 路径分隔符，单行精准 |
| [#4280](https://github.com/QwenLM/qwen-code/pull/4280) | merged | ✅ | ✅ | 文件写/编辑路由，鉴权严格+符号链接防护到位 |
| [#4282](https://github.com/QwenLM/qwen-code/pull/4282) | merged | ✅ | ✅ | 变更路由 strict 门控+trust-gate 403 |
| [#4284](https://github.com/QwenLM/qwen-code/pull/4284) | merged | ✅ | ✅ | 同步 E2E baseline，纯测试 |
| [#4291](https://github.com/QwenLM/qwen-code/pull/4291) | merged | ⚠️ | ✅ | device-flow 加固；body 表述落后于更安全的代码 |
| [#4293](https://github.com/QwenLM/qwen-code/pull/4293) | closed | ⚠️ | ✅ | 被 #4282/#4306 取代的重复 PR，正确关闭 |
| [#4295](https://github.com/QwenLM/qwen-code/pull/4295) | merged | ✅ | ✅ | acp-bridge 骨架+零耦合搬迁，行为保持 |
| [#4298](https://github.com/QwenLM/qwen-code/pull/4298) | merged | ✅ | ✅ | lift status/paths/errors，逐字节一致 |
| [#4300](https://github.com/QwenLM/qwen-code/pull/4300) | merged | ✅ | ✅ | typed error 替代正则，按预期收紧分类 |
| [#4304](https://github.com/QwenLM/qwen-code/pull/4304) | merged | ⚠️ | ✅ | seam 设计扎实；夹带未披露的 SkillError 改动 |
| [#4297](https://github.com/QwenLM/qwen-code/pull/4297) | merged | ⚠️ | ✅ | #4282 P2 修正；body 少报 fold-in 且 P2-2 与最终行为矛盾 |
| [#4305](https://github.com/QwenLM/qwen-code/pull/4305) | merged | ⚠️ | ✅ | device-flow 评审修复；标题"7 threads"严重少报 |
| [#4306](https://github.com/QwenLM/qwen-code/pull/4306) | merged | ✅ | ✅ | 修 #4271 后 E2E，纯测试对症 |
| [#4312](https://github.com/QwenLM/qwen-code/pull/4312) | closed | ⚠️ | ✅ | #4305 的重复 PR，正确关闭 |
| [#4313](https://github.com/QwenLM/qwen-code/pull/4313) | closed | ⚠️ | ✅ | #4297 的更早快照重复，正确关闭 |
| [#4302](https://github.com/QwenLM/qwen-code/pull/4302) | merged | ✅ | ✅ | telemetry Phase 1.5 收尾，描述高度吻合 |
| [#4319](https://github.com/QwenLM/qwen-code/pull/4319) | merged | ⚠️ | ✅ | acp-bridge F1 自足；lift 行为保持，文件清单陈旧 |
| [#4321](https://github.com/QwenLM/qwen-code/pull/4321) | merged | ✅ | ✅ | telemetry Phase 2，防泄漏无 PII，187 测试 |
| [#4333](https://github.com/QwenLM/qwen-code/pull/4333) | open | ⚠️ | ✅ | 原子写铺开扎实；debugLogger flush 描述与代码相反 |
| [#4334](https://github.com/QwenLM/qwen-code/pull/4334) | merged | ✅ | ✅ | BridgeFileSystem 接线 + #4325 修复，无 TOCTOU |
| [#4335](https://github.com/QwenLM/qwen-code/pull/4335) | merged | ✅ | ✅ | 多客户端权限协调，并发不变量成立 |
| [#4336](https://github.com/QwenLM/qwen-code/pull/4336) | merged | ✅ | ✅ | 共享 MCP 传输池，生命周期/引用计数谨慎 |
| [#4360](https://github.com/QwenLM/qwen-code/pull/4360) | merged | ✅ | ✅ | F4 协议补全，向后兼容干净 |
| [#4366](https://github.com/QwenLM/qwen-code/pull/4366) | merged | ✅ | ✅ | 修 AbortSignal 监听器泄漏，双层修复货真价实 |
| [#4367](https://github.com/QwenLM/qwen-code/pull/4367) | merged | ✅ | ✅ | 自定义资源属性+把 session.id 移出 metrics |
| [#4390](https://github.com/QwenLM/qwen-code/pull/4390) | merged | ✅ | ✅ | client HTTP span + opt-in traceparent，默认安全 |
| [#4393](https://github.com/QwenLM/qwen-code/pull/4393) | closed | ✅ | ✅ | session-id 传播，因无 allowlist 隐私隐患被重构取代 |
| [#4410](https://github.com/QwenLM/qwen-code/pull/4410) | open | ✅ | ✅ | Phase 3 subagent span，并发隔离正确 |
| [#4411](https://github.com/QwenLM/qwen-code/pull/4411) | merged | ✅ | ✅ | F2 cleanup A，纯重构行为保持 |
| [#4412](https://github.com/QwenLM/qwen-code/pull/4412) | open | ⚠️ | ⚠️ | daemon 开发文档；非杜撰但 doc-rot（事件数/行号过时） |
| [#4414](https://github.com/QwenLM/qwen-code/pull/4414) | open | ✅ | ✅ | file-history 后台清理，数据丢失防护充分 |
| [#4417](https://github.com/QwenLM/qwen-code/pull/4417) | merged | ✅ | ✅ | Phase 4a TTFT + 语义双发，无双计 |
| [#4431](https://github.com/QwenLM/qwen-code/pull/4431) | open | ⚠️ | ⚠️ | 修 #4096 属主丢失；实为 uid-only，"uid/gid"超出实现 |
| [#4432](https://github.com/QwenLM/qwen-code/pull/4432) | open | ✅ | ✅ | Phase 4b retry 可见性，sampling_ms 公式修复正确 |
| [#4445](https://github.com/QwenLM/qwen-code/pull/4445) | merged | ⚠️ | ✅ | 测试拆分 lift；body 对 testUtils 是否发布自相矛盾 |
| [#4453](https://github.com/QwenLM/qwen-code/pull/4453) | merged | ❌ | ✅ | 修 TS5055；**body 讲 tsc --clean，代码实为 rmSync（相反）** |
| [#4460](https://github.com/QwenLM/qwen-code/pull/4460) | merged | ✅ | ✅ | F2 cleanup B 自愈可观测性，逻辑正确 |
| [#4469](https://github.com/QwenLM/qwen-code/pull/4469) | merged | ✅ | ✅ | 423 文件集成同步，分组与范围吻合 |
| [#4473](https://github.com/QwenLM/qwen-code/pull/4473) | merged | ✅ | ✅ | SDK QWEN_SERVER_TOKEN env fallback，码文一致 |
| [#4482](https://github.com/QwenLM/qwen-code/pull/4482) | merged | ✅ | ✅ | LogToSpan 错误信息+TUI 处理，范围清晰 |
| [#4483](https://github.com/QwenLM/qwen-code/pull/4483) | merged | ✅ | ✅ | 本地启动模板文档，实际比摘要更稳妥 |

**一致性**：✅29 / ⚠️13 / ❌1　　**正确性**：✅41 / ⚠️2 / ❌0

> 整体：本周无安全漏洞——文件路由的路径穿越、写入约束、鉴权门控、env/密钥脱敏、device-flow token 处理均经核验站得住；acp-bridge 系重构均行为保持；并发关键的 #4335/#4336/#4366 均正确。问题集中在**描述与实现的漂移**（13 个 ⚠️ 一致性 + 1 个 ❌），多为大量评审 round 的 fold-in 未同步进 PR 描述。

---

## 逐 PR 明细

### #4269 feat(serve): safe workspace file read routes (#4175 PR 19)
- **状态**: merged | **关联 issue**: #4175（Refs）
- **一致性**: ✅ — `applyReadHeaders`(no-store+nosniff)、`sendFsError` 复用映射、glob 默认5000/上限50000、PR18 follow-up 均落地。
- **描述准确性**: 准确（连"读意图未信任放行""读路由不跑 mutate()"都一致）。
- **正确性**: ✅ — 路径限制委托 `paths.ts:resolveDaemonInputPath`（textual `..` 预过滤 + realpath + 符号链接链）+ glob `symlink_escape` 过滤；`list` 用 `opendir` 不跟随；读路由 loopback 无 token 开放（设计），`denyBrowserOriginCors` 兜底。
- **结论**: 实现严谨、码文高度吻合的只读文件面。

### #4271 feat(serve): MCP guardrail push events + hysteresis (#4175 Wave 3 PR 14b)
- **状态**: merged | **关联 issue**: #4175（Refs）
- **一致性**: ⚠️ — 迟滞(0.75/0.375)、`refused_batch` 合并、off 模式剥离回调、桥丢弃未知 method 均属实；但**测试计划写"rejects thresholdRatio !==0.75"与代码矛盾**——`isMcpBudgetWarningData` 经 codex round 6 改为 `isFiniteNumber`（描述未更新）。
- **描述准确性**: 大体准确，仅该 threshold 断言条目陈旧。
- **正确性**: ✅ — `evaluateBudgetState` 迟滞正确；拒 `mode:'warn'`；`bufferEarlyEvent` 有 tombstone+上限。类型 `0.75` 与运行时 finite 校验是刻意前向兼容。
- **结论**: 代码正确加固充分，仅描述一处陈旧。

### #4279 fix(serve): normalize Windows path separators in workspace file read responses
- **状态**: merged | **关联 issue**: #4175（Refs；亦引 #4269 CI 失败）
- **一致性**: ✅ — 单行：`workspaceRelative` 按 `path.sep` 切分再以 `/` 连接。
- **描述准确性**: 准确（含 Windows CI 用例与四路由）。
- **正确性**: ✅ — POSIX 原样透传（保留文件名合法反斜杠），仅 Windows 规范化；空串仍 `'.'`。
- **结论**: 干净、精准的跨平台响应修复。

### #4280 feat(serve): add workspace file write/edit routes (#4175 PR20)
- **状态**: merged | **关联 issue**: #4175（Refs）
- **一致性**: ✅ — `workspace_file_write`/`_bytes` 标签、写路由 `mutate({strict:true})`、`/file` 加 hash、有界 `/file/bytes`、`parseIntInRange`→`isSafeInteger`，均吻合。
- **描述准确性**: 准确，且诚实披露"hash 校验与 rename 间有窗口（非内核级 CAS）"。
- **正确性**: ✅ — strict 鉴权（无 token loopback 401）+ `resolveOriginatorClientId` 校验 `knownClientIds()`；`editAtomic` 单匹配 + hash CAS；`atomicWriteTextResolvedFile` 同目录 `'wx'`、父符号链接守卫、rename 前复核 hash、dev/ino TOCTOU、create 用 `link()+unlink()` 防覆盖。
- **结论**: 限制关键的写面实现得当，鉴权严格、并发与符号链接逃逸防护到位。

### #4282 feat(serve): approval / tools / init / MCP-restart mutation routes (#4175 Wave 4 PR 17)
- **状态**: merged | **关联 issue**: #4175（Refs）
- **一致性**: ✅ — 4 路由均 `mutate({strict:true})`；core 新增 `TrustGateError`/`Config.disabledTools`/`isToolDisabled`/`isServerDiscovering`。仅正文 coordination notes 的 E2E 折入 tag 名写错。
- **描述准确性**: 主体精确；唯折入 tag 名陈旧。
- **正确性**: ✅ — approval-mode 闭合枚举校验 + untrusted 目录特权模式抛 `TrustGateError`→403；tool/server 名 trim+长度上限；clientId 对 `knownClientIds()` 防伪造；rename 后二次查 disabled 集堵漏。
- **结论**: 加固扎实的变更路由，仅正文一处 tag 名陈旧。

### #4284 fix(serve): sync E2E baseline capabilities with registry
- **状态**: merged | **关联 issue**: 无（指 #4249/#4269 漂移）
- **一致性**: ✅ — 在 `workspace_providers`/`mcp_guardrails` 后补标签，与正文一致。
- **描述准确性**: 准确（纯测试）。
- **正确性**: ✅ — 仅同步 baseline，顺序匹配 registry。
- **结论**: 正确的最小化 E2E baseline 修复。

### #4291 fix(serve): auth device-flow follow-up for #4255 review threads
- **状态**: merged | **关联 issue**: 无（Refs #4255/#4175）
- **一致性**: ⚠️ — 5 项中 4 项匹配（30s poll 超时 race、GET clientId 脱敏门、`cancellerRecorded` first-writer、union 加 `not_found_or_evicted`）；但正文表 #1 称"writes raw err.message to stderr"，代码恰相反——`sanitizeForStderr` 仅输出结构化 `oauthError=`，刻意不打印 raw（防 device_code 泄漏）。
- **描述准确性**: 表 #1 陈旧（最终代码更安全），其余准确。
- **正确性**: ✅ — 实际比正文更稳：避免 stderr 泄密、超时有界、attribution 有 guard。
- **结论**: 好的加固 follow-up，正文 #1 描述落后于更安全的实现。

### #4293 fix(serve): sync E2E baseline with PR20/PR21 capabilities
- **状态**: closed（未合并）| **关联 issue**: 无（follow-up #4284）
- **一致性**: ⚠️ — diff 正确叠加 3 个 tag，但被取代：#4282 已折入同样 3 tag。
- **描述准确性**: 对所修漂移准确，但已陈旧（未料 #4282 折入）。
- **正确性**: ✅（本可生效）但冗余；main 经 #4282+#4306 已含全部 tag。
- **结论**: 被 #4282/#4306 取代的重复 PR，正确关闭。

### #4295 refactor(acp-bridge): create skeleton + lift zero-coupling primitives (#4175 PR 22a)
- **状态**: merged | **关联 issue**: 无（epic #4175）
- **一致性**: ✅ — `eventBus`/`inMemoryChannel` 移入，cli 侧 `export *` 包装；`permission.ts` 为 6 个纯类型声明无运行时（与 "PR 24 填充" 吻合）。
- **描述准确性**: 准确（仅去内部标记注释）。
- **正确性**: ✅ — 纯 lift，包装器保留所有 import 站点，无行为改动。
- **结论**: 干净的骨架+零耦合搬迁，行为保持。

### #4298 refactor(acp-bridge): lift status, paths, errors, and bridge types (#4175 PR 22b/1)
- **状态**: merged | **关联 issue**: 无（epic #4175）
- **一致性**: ✅ — `status.ts`(600行) 搬迁 + `export *`；11 个 error 类 re-export；`MAX_WORKSPACE_PATH_LENGTH` 两处 re-export。
- **描述准确性**: 准确（error 表与 HTTP 映射一致）。
- **正确性**: ✅ — 唯一非类型代码 `canonicalizeWorkspace` 与原版**逐字节相同**；error 类 verbatim。
- **结论**: 机械忠实的 type/util lift，行为保持。

### #4300 refactor(serve): typed errors for channel-closed and missing-cli-entry (#4299)
- **状态**: merged | **关联 issue**: #4299
- **一致性**: ✅ — 新增两 error，全部 throw 站点改 typed，消息 byte-for-byte 保留，无遗漏。
- **描述准确性**: 详尽准确（References 称改 pre-lift 路径略陈旧，实际改已 lift 的 status.ts）。
- **正确性**: ✅ — 故意收紧（foreign error→undefined）即为修的 bug；正确保留 `protocol_error`（未盲从 issue 笔误）。
- **结论**: 干净正确的 tech-debt 修复，按预期非行为保持地收紧分类。

### #4304 refactor(acp-bridge): lift BridgeOptions + introduce DaemonStatusProvider seam (#4175 PR 22b/2)
- **状态**: merged | **关联 issue**: 无（epic #4175）
- **一致性**: ⚠️ — `BridgeOptions`/`DaemonStatusProvider` 抽出、`buildDaemonPreflightCells` 移入均符；但**未披露**夹带的 `mapDomainErrorToErrorKind` 中 SkillError 放宽（#4298 fold-in），且 Wiring 段漏提 `server.ts:248` 注入。
- **描述准确性**: 设计决策表与代码一致；漏述 SkillError 改动。
- **正确性**: ✅ — 两生产构造点均注入 `createDaemonStatusProvider()`，lift 等价；SkillError 放宽照搬既有 TrustGateError 先例，有测试，风险低。
- **结论**: seam 设计扎实、行为保持，但"design slice"夹带未披露（良性）改动。

### #4297 fix(serve): post-merge P2 corrections from Codex review on #4282
- **状态**: merged | **关联 issue**: 无（Refs #4282）
- **一致性**: ⚠️ — 4 个 P2 落地正确，但合并版还含正文未提的 fold-in 1/2/3/5/7/9/10（`WorkspaceInitRaceError`、`'wx'` 原子创建、`verifyParentWithinWorkspace` 等）。
- **描述准确性**: 基本准确但**已过期**：P2-2 称"已注册工具不会被回收注销"，与 fold-in 9 矛盾——`discoverToolsForServer`(tool-registry.ts:501-510) 实际会清除旧 MCP 工具（行为更优，描述错）。
- **正确性**: ✅ — 父链 realpath 校验、`setDisabledTools` 防御拷贝、`fetchWithTimeout` 的 0=禁用/NaN→默认 均正确。
- **结论**: 代码扎实加固到位；正文只覆盖初版 4 项且 P2-2 与最终行为冲突，建议更新描述。

### #4305 fix(serve): post-merge fixes for #4291 review (7 threads)
- **状态**: merged | **关联 issue**: 无（Refs #4255/#4291）
- **一致性**: ⚠️ — 表格 7 项（round-4）命中，但 diff 还含未记录的 **round-5/6**（`pollTimedOut` 竞态、品牌自过滤、Unicode/Trojan-Source 净化、terminal `.catch()`）；`deviceFlow.ts +256/-50` 远超"7 threads"。
- **描述准确性**: 明显**低估范围**（标题"7 threads"，实为 rounds 4-6 十余项）。
- **正确性**: ✅ — late-poll 观察者解构原始字段避免持 `BrandedSecret`、`name+length` 取代裸 message 杜绝 device_code 泄漏、品牌门控防伪造，均稳健。
- **结论**: 安全质量高，但正文严重少报；标题/表格应反映 rounds 5-6。

### #4306 fix(serve): unbreak E2E after #4271 (capabilities + clientCount)
- **状态**: merged | **关联 issue**: 无（Refs #4271）
- **一致性**: ✅ — 仅改两个集成测试，补 `mcp_guardrail_events`、pgrep 期望改 `*2`。
- **描述准确性**: 准确（drift 同 #4268/#4284）。
- **正确性**: ✅ — 保留两条不变式；`N*2` 硬编码偏脆但作为未来统一 manager 的 tripwire，有意为之。
- **结论**: 纯测试修复，对症且诚实。

### #4312 fix(serve): post-merge review fixes for #4291 [daemon_mode_b_main mirror]
- **状态**: closed（存活约 11 分钟）| **关联 issue**: 无
- **一致性**: ⚠️ — **确认为 #4305 的重复**（同 head 分支、同 base、正文与增删行数完全相同）；承袭同样"少报 rounds 5-6"。
- **描述准确性**: 同 #4305；标题"mirror"易误导（base 实为同一分支）。
- **正确性**: ✅ — 即 #4305 内容，无独立问题。
- **结论**: 冗余重复 PR，正确关闭、由 #4305 取代。

### #4313 fix(serve): post-PR-17 Codex P2 fold-ins (against daemon_mode_b_main)
- **状态**: closed（存活约 8 分钟）| **关联 issue**: 无
- **一致性**: ⚠️ — **确认为 #4297 的重复**（同 head 分支、正文逐字相同），其 diff 是较早快照（无 fold-in 9/10）。
- **描述准确性**: 同 #4297（P2-2 过期）。
- **正确性**: ✅ — 同 #4297 早期代码，无独立问题。
- **结论**: 冗余重复 PR，正确关闭、由 #4297 取代。

### #4302 fix(telemetry): Phase 1.5 polish — fallback order, abort-as-result, log/span consistency
- **状态**: merged | **关联 issue**: #4212（#4126 follow-up）
- **一致性**: ✅ — 4 项全落地：`resolveParentContext()` 统一三处、exec span 抓 `signal.aborted` 传 cancelled、test mock 补常量、idle-timeout 用 `spanEndedByTimeout` gate 成功+catch 两路。
- **描述准确性**: 准确（如实说明 catch-path 是 review 追加）。
- **正确性**: ✅ — 优先级与 `tracer.ts:getParentContext()` 一致；cancelled 时跳过 setStatus 保持 UNSET 与父 span 一致。
- **结论**: 干净、测试充分的收尾 PR。

### #4319 feat(acp-bridge): F1 — acp-bridge package self-sufficiency (#4175)
- **状态**: merged | **关联 issue**: #4175（Refs）+ Closes #4329
- **一致性**: ⚠️ — 核心 lift+seam 与描述吻合，但正文 file-diff 表**陈旧**（漏列 acpAgent.ts/config.ts/DaemonClient.ts 等）；且夹带 #4329 helper 抽取与 SDK 超时 300→330s（prose 有提及）。
- **描述准确性**: 极详尽但文件清单与 4682→97 LOC 数字与实际 diff 不符。
- **正确性**: ✅ — 经与 main pre-F1 `writeTextFile/readTextFile` 逐字对比 lift 行为保持；`BridgeFileSystem` 可选，缺省回落内联 proxy，**不削弱** confinement；fs-proxy 对 `params.path` 无校验属既有缺口（#4250 已声明 defer），seam 正是后续修复前置；`spawnOrAttach` 的 WorkspaceMismatch 约束保留。
- **结论**: 行为保持的 lift+未来修复 seam，坦诚标注 confinement 推迟；唯描述文件清单过时。

### #4321 feat(telemetry): Phase 2 — tool.blocked_on_user + hook spans (#3731)
- **状态**: merged | **关联 issue**: #3731（Phase 2）
- **一致性**: ✅ — `blocked_on_user`/`hook` span、tool span 生命周期移入 `_schedule`、callId-keyed Map、`withHookSpan` 包 6 处、显式传 span 规避 findLast。正文端点计数略少报（偏安全方向）。
- **描述准确性**: 准确，仅端点计数保守。
- **正确性**: ✅ — 仅 setAttributes 保持 UNSET、仅 hook throw 才 ERROR；`spanCtx.ended` 幂等；`releaseBatchListenerIfDrained`+30min TTL 防泄漏；span 仅记 name/decision/source/布尔，无 PII。187/187 测试。
- **结论**: 防泄漏、无 PII、测试充分的高质量 Phase 2。

### #4333 feat(core): atomic write rollout for credentials, memory, config, JSONL (closes #3681, #4095 Phase 2)
- **状态**: open | **关联 issue**: #3681、#4095
- **一致性**: ⚠️ — credentials（oauth/file-token/sharedTokenManager）正确经 `atomicWriteFile {mode:0o600,forceMode,noFollow}`；jsonl `flush:true`；logger/LSP/memory/config 全迁移。**但** commit-5 称"`debugLogger.ts` appendFile 加 flush:true"，代码恰相反——保留裸 `appendFile` 并加注释说明 debug log 有意跳过 fsync。
- **描述准确性**: 详尽但两处过度声明：debugLogger flush（上）、"closes #3681" 仅覆盖 Item 2（writer 持久性），未含 Item 1。
- **正确性**: ✅ — `atomicWriteFile/Sync` 扎实：`forceMode` 守卫防权限降级、`noFollow` EXDEV 回退用 `O_EXCL`+fchmod-on-fd 防符号链接 race。注：oauth/file-token 现替换符号链接（security-positive，轻描述）。
- **结论**: 高质量、测试充分的铺开；合并前修 debugLogger 描述与 #3681 Item-1 范围措辞。

### #4334 feat(serve): F1 follow-up — BridgeFileSystem wiring + #4325 channelInfo fix
- **状态**: merged | **关联 issue**: #4325（closeSession/killSession 用模块级 channelInfo）
- **一致性**: ✅ — 三项核实：`closeSession`/`killSession` 改用 `channelInfoForEntry(entry)`（#4325 两行修复）；`bridgeFileSystemAdapter.ts` 经 `resolveBridgeFsFactory` 注入；`writeTextOverwrite` 加 mode 保留/0o600/符号链接拒。
- **描述准确性**: 准确（含行为变更说明）。
- **正确性**: ✅ — `writeTextOverwrite` 在 `pathLocks.runExclusive` 内预写 lstat 得 `created`（无 TOCTOU）；meta-read 容错。两处有意行为变更（默认 `trusted:false` 拒 embed 写、符号链接写拒）均警示。
- **结论**: 干净忠实的 follow-up；#4325 修复正确（回归测试为单通道 smoke，PR 已承认）。

### #4335 feat(acp-bridge): F3 — multi-client permission coordination (#4175)
- **状态**: merged | **关联 issue**: epic #4175；frozen contract #4295
- **一致性**: ✅ — 4 策略、3 typed error（403/501/500）、2 SSE 事件、`permissionStrategy`/`consensusQuorum` 设置、`permission_mediation` 能力均符。
- **描述准确性**: 准确；仅 nit——body 称 resolved store "LRU"，实为 FIFO（代码注释自更正）。
- **正确性**: ✅ — 并发不变量成立：`request()` 在 executor 同步注册；`resolveEntry` 经身份检查防 double-resolve，`safeEmit`/`safeAudit` 全 try/catch 故 Promise 必 settle；consensus `voteConsensus` 防灌票；cancel-sentinel 碰撞在 issue+wire 双拒；`detectFromLoopback` 只读 `remoteAddress` 忽略 XFF、fail-closed。无死锁/double-resolve。跨策略 cancel 逃生口已文档化且仅 abort 方向。
- **结论**: 异常加固、描述忠实的并发实现。

### #4336 feat(serve): shared MCP transport pool [F2]
- **状态**: merged | **关联 issue**: 无 closing；epic #4175 F2（对应 #4271 预算基座）
- **一致性**: ✅ — 池默认开（`QWEN_SERVE_NO_MCP_POOL=1` 关）、workspace 级、fingerprint 排除 per-session 过滤、`spawnInFlight` 去重、drain+max-idle 硬顶、`sessionToEntries` 反查、`evictEntry`/预算释放、跨平台 pid sweep；已接入 acpAgent（killSession→releaseSession、SIGTERM→drainAll）。
- **描述准确性**: 技术准确；仅 Status 头统计陈旧（"34 files" 实为 38f/+10308）。
- **正确性**: ✅（采样 core）— 生命周期/引用计数详尽，`statusChangeListener` 在所有终态移除；预算按**名字**封顶（同名异 fingerprint 共享 1 槽却可生多子进程，有意取舍，已记录）；W90 残留竞态文档化。
- **结论**: 体量大但实现谨慎、覆盖充分。

### #4360 feat(serve+sdk): F4 prereq — daemon protocol completion
- **状态**: merged | **关联 issue**: 无 closing；落地 #4175 评论 #19/#15
- **一致性**: ✅ — `serverTimestamp`(_meta)、`resolveToolProvenance`(mcp__ 启发式)、`errorKind`(mapDomainErrorToErrorKind)、`state_resync_required`(环淘汰检出) + SDK reducer `awaitingResync` 门控均落地。
- **描述准确性**: 准确，诚实标注 SDK 读取端在未合的 #4353。
- **正确性**: ✅ — gap 检测正确（非终态跳过但游标推进、终态透传）；provenance 对畸形名回退 builtin。
- **结论**: 范围清晰、向后兼容的协议补全。

### #4366 fix(core): stop AbortSignal listener leak in long sessions (MaxListenersExceededWarning)
- **状态**: merged | **关联 issue**: #4423（1596 abort listeners，匹配）
- **一致性**: ✅ — `createChildAbortController`({once:true}+WeakRef+反向清理)、调用点均 finally abort、`promptHookRunner` 真实泄漏修复、删 `combinedAbortSignal` shim、移除 `pipeline.ts` band-aid。
- **描述准确性**: 准确（repro+26 helper 测试可信）。
- **正确性**: ✅ — 泄漏确被修复：子 abort 反向摘除父监听器，且每子都在 finally abort（二者皆满足）；无功能回归；band-aid 移除安全（cap 50+每轮 GC）。
- **结论**: 货真价实的双层修复，机制与调用点均正确。

### #4367 feat(telemetry): support custom resource attributes and add metric cardinality controls
- **状态**: merged | **关联 issue**: #4365（CLOSED）
- **一致性**: ✅ — `resource-attributes.ts` 解析器、保留键、合并优先级、`OTEL_SERVICE_NAME`、session.id 移出 Resource、`includeSessionId` 默认 false 均落地。
- **描述准确性**: 基本准确；"cardinality controls" 实为单一 session.id 开关（issue 建议的 includeVersion 未实现也未声称）。
- **正确性**: ✅ — `getCommonAttributes` 按开关注入；sdk.ts defense-in-depth 从 Resource 剥离 session.id；解析器 percent-decode 防 `service%2Eversion` 绕过保留键。自定义属性仍无界附着 metrics（按设计属运维责任）。
- **结论**: 实现扎实，默认把 session.id 移出 metrics 严格改善基数安全。

### #4390 feat(telemetry): client-side HTTP span + opt-in W3C traceparent propagation (#4384)
- **状态**: merged | **关联 issue**: #4384（CLOSED）
- **一致性**: ✅ — 默认装 `NOOP_PROPAGATOR`、经 `outboundCorrelation.propagateTraceContext` opt-in、undici client span、OTLP 反馈环 guard；session-id 部分已拆出。
- **描述准确性**: 准确且诚实交代 R4 缩容；但 `Closes #4384` 关掉了仅部分完成的 issue（session-id 与默认 traceparent 均被移除）——轻微追踪缺口。
- **正确性**: ✅ — 默认安全（NOOP inject 为空，不泄漏）；OTLP guard origin+path 边界防环。残留：opt-in=true 时 traceparent 广播到**所有**出站 fetch（含第三方），比 host-allowlist 粗，但默认关且标注 SECURITY-RELEVANT。
- **结论**: 默认安全、opt-in 正确；启用时是 all-or-nothing 广播。

### #4393 feat(telemetry): propagate X-Qwen-Code-Session-Id on outbound LLM requests (part 2 of #4384)
- **状态**: closed | **关联 issue**: 无（自述 #4384 part 2）
- **一致性**: ✅ — 代码实现所述（openai/anthropic fetch wrapper 注入 header，Gemini 静态 header 并文档化 staleness）。
- **描述准确性**: 准确（含 Gemini 限制）。
- **正确性**: ✅（关闭合理）— session-id 先合入 #4390 后又被 R4 整体移除→改到未来 `outboundCorrelation.*`；其 `wrapFetchWithCorrelation` 仅以 `getTelemetryEnabled()` 为门、**无 host allowlist**，会把 session id 发往所有第三方 LLM endpoint（隐私问题，正是重构动因），代码已不在 main。
- **结论**: 正确地被取代/关闭；无 allowlist 的隐私隐患推动了重构。

### #4410 feat(telemetry): Phase 3 — qwen-code.subagent span with concurrent isolation (#3731)
- **状态**: open | **关联 issue**: #3731（Phase 3）
- **一致性**: ✅ — `startSubagentSpan`/`runInSubagentSpanContext`、hybrid traceId（foreground 子 span / fork root+Link）、type-aware TTL、LogToSpan skip-list、GenAI 双发、depth 均落地。
- **描述准确性**: 准确。
- **正确性**: ✅ — `subagentContext` ALS 隔离；子 `startLLM/Tool/Hook` 优先读 subagentContext 而非 interactionContext（防并发串属，关键修复）；body 清空 toolContext 防 hook 错挂。已文档化遗留：4h fork 子 span 仍用 30min TTL→trace 空洞（follow-up）。
- **结论**: 并发互不串属正确，仅余 TTL 继承延后项。

### #4411 perf(core): F2 cleanup PR A — R9/W11/W12/R10 (post-merge follow-ups)
- **状态**: merged（落 `daemon_mode_b_main`）| **关联 issue**: #4175 item 7
- **一致性**: ✅ — R9 构造器收敛、W12 `compileNameFilter` 预编译 Set、R10 `ps` 快照+pgrep 回退均符（W11 仅读 commit 说明）。
- **描述准确性**: 准确诚实（"no behavior change"、R10 仅约 2x）。
- **正确性**: ✅ — `walkDescendants` 含 visited 防环、保留 MAX 上限、回退；filter 语义保留；R9 字段赋值不变。R10 还修了 BFS 跨层漏抓。
- **结论**: 高质量纯重构，行为保持。

### #4412 docs(developers): add daemon-mode developer deep-dive documentation set
- **状态**: open(draft) | **关联 issue**: 无 closing；related #3803、#4175
- **一致性**: ⚠️ — 结构属实（23 文件 ~4366 行中文文档+导航），但标榜的可验证不变量已随分支漂移。
- **描述准确性**: pin 时准确，现 stale——doc 09 称"29 种事件"，分支现为 **38**；行号锚漂移（auth.ts 1-294→452、permissionMediator 1-1292→1318）。
- **正确性**: ⚠️ — 未杜撰行为（4 策略 union、createServeApp/runQwenServe/serveCommand 调用链符号皆真实）；但 09 少计 9 个事件（mcp_server_added/removed、permission_partial_vote 等）。
- **结论**: 属前向引用文档的 doc-rot（PR 自认风险）；合并前宜刷新事件数与行号锚。

### #4414 feat(cli): background housekeeping for stale file-history dirs
- **状态**: open | **关联 issue**: #4173（Closes）
- **一致性**: ✅ — 30 天 mtime 扫除、10min 延迟/24h 周期、idle 门控、O_EXCL 锁+marker 节流、排除当前 session、全 `.unref()`。
- **描述准确性**: 准确（含 `0→1h` clamp、`requiresRestart:true` 诚实说明）。
- **正确性**: ✅ — `getCutoffDate` 对 ≤0 clamp 1h 防全删；`excludeSessionIds` lazy `getSessionId()` 抗 /clear；`tryAcquire` 用 `'wx'` 原子；仅 REPL 门控。极小残留：他进程 30 天空闲 active session 目录未单独排除（需 30 天无快照，可忽略，沿用 claude-code 设计）。
- **结论**: 数据丢失防护充分，排除/节流/路径均正确。

### #4417 feat(telemetry): Phase 4a — TTFT capture + GenAI semconv dual-emit (#3731)
- **状态**: merged | **关联 issue**: #4413（partial）；#3731 P3
- **一致性**: ✅ — `hasUserVisibleContent` 首 token 检测、TTFT 用方法内闭包、`LLMRequestMetadata` 扩展、`endLLMRequestSpan` 写 attr+dual-emit 均符。
- **描述准确性**: 准确（含 `thought===true` 修复、4b/4c 占位）。
- **正确性**: ✅ — dual-emit 仅并列写 `gen_ai.*` attr 键（非 counter），不双计；`sampling_ms=max(0,dur-ttft-setup)`、`tokens_per_second` 有除零守卫；`time_to_first_token` 秒制正确。4a TTFT 以 stream 入口为基线（含 setup，4b 处理）。
- **结论**: TTFT 测量与语义双发均正确，Phase 4a 自洽。

### #4431 fix(core): preserve uid/gid in atomicWriteFile to avoid breaking shared-write files
- **状态**: open | **关联 issue**: 无正式 link（修复 #4096 在 v0.16.0 引入的回归）
- **一致性**: ⚠️ — 实现并非 fchown，而是 inode 保留：uid 不符时走 in-place `fs.writeFile`；isFile() FIFO 守卫、`resolveSymlinkChain`、win32 守卫均符。
- **描述准确性**: 反复称"uid/gid"，但 `ownershipWouldChange()` 只比较 `uid !== euid`（注释承认 gid 因 macOS 父目录继承误报而跳过）。
- **正确性**: ⚠️ — 核心路径正确（Docker root、他人属主两上报场景均命中）；但 (a) 同 uid/异 gid 共享文件在 Linux 非 setgid 目录仍经 rename 丢组；(b) 非 root 写无写权限文件现抛 EACCES（旧 rename 静默成功）——已记录的行为变更/近似恢复 #4096 前语义。无 fchown 故无 chown-EPERM。
- **结论**: 思路稳健、修复上报场景，但"uid/gid"超出实现（仅按 uid 触发），EACCES 变更需评审权衡。

### #4432 feat(telemetry): Phase 4b — retry visibility for qwen-code.llm_request (#3731)
- **状态**: open | **关联 issue**: 无正式 link（#3731 P3 / #4413）
- **一致性**: ✅ — 9 项组件全落地：`retryContext.ts`(ALS)、`retry.ts` onRetry+单调 iterationCount、`ApiRetryEvent`、`logApiRetry` 三汇、`api.retry.count{model}`、sampling_ms 修复、`snapshotRetryMetadata`、4 调用点。
- **描述准确性**: 高度准确（测试/生产 LOC 微差无关紧要）。
- **正确性**: ✅ — sampling_ms 修复正确（duration_ms 从 span 起算不含 setup，旧式再减 setup 会重复扣减）；onRetry 受 `signal?.aborted`+try/catch 保护；iterationCount 与钳制的 attempt 解耦；ALS 并发隔离有测试。
- **结论**: 实现与详尽描述一致、测试充分，公式修复推理正确。

### #4445 refactor(acp-bridge): F1 test split — lift bridge.test.ts (6861 LOC) to acp-bridge
- **状态**: merged | **关联 issue**: 无（#4334/#4319 的 F1 follow-up）
- **一致性**: ⚠️ — 移动忠实（similarity 94% 重命名、零生产改动、跨包解析按述）；但正文称 testUtils.js "does ship in dist"，而 `package.json` `files` 实际用 `"!dist/internal/testUtils.*"` 主动排除，二者矛盾（JSDoc 又称经 `.npmignore` 排除，实际无 .npmignore）。
- **描述准确性**: 主体准确；发布排除一节自相矛盾。
- **正确性**: ✅ — 仅 test/config/fixture，无生产改动；blame 经重命名保留；排除测试产物属正确改进。
- **结论**: 干净的行为保持迁移，唯发布排除文档前后不一。

### #4453 fix(build): clean stale outputs before tsc --build to prevent TS5055
- **状态**: merged | **关联 issue**: #4447（npm run build TS5055 due to stale dist）
- **一致性**: ❌（已核验）— 正文称 "prepends `tsc --build --clean`" 并论证"用 `tsc -b --clean` 而非 rmSync"；但合并代码 `scripts/build_package.js:34-35` 用 `rmSync('dist')`+`rmSync('tsconfig.tsbuildinfo')`，且注释（:32）恰好反向论证"删文件而非 `tsc --build --clean`，因后者会沿 project references 抹掉上游"。描述与实现机制完全相反。
- **描述准确性**: 机制段落与代码相悖（描述的是被否决的早期方案）；复现/验证部分仍成立。
- **正确性**: ✅ — `rmSync` 仅清本包 dist+tsbuildinfo，按包调用作用域正确，与 #4447 建议修复一致，避免误删上游产物。
- **结论**: 修复正确且优于所描述方案，但 PR 描述被合并代码直接打脸——应更新描述。

### #4460 fix(core): F2 cleanup PR B — self-heal observability (W133-a + W134)
- **状态**: merged | **关联 issue**: 无（F2 #4336 post-merge）
- **一致性**: ✅ — W133-a：`mcp-client.ts` 加 `lastTransportError`/getter，onerror 中先赋值后 updateStatus、connect 顶部重置；W120 静默丢弃拼接 `: <msg>`。W134：`sweepAndDisconnect` 返回 `SweepResult`，对 pidSweepError/partial-signal 发 `debugLogger.warn`。
- **描述准确性**: 基本准确；Changes 表行数偏旧（评审轮次增长）。
- **正确性**: ✅ — partial-signal 判定与 unknown 哨兵正确；测试 debugLogger mock 为单例 stub（一处注释自相矛盾但无害）。
- **结论**: W133-a/W134 落地与描述一致、逻辑正确，仅行数表轻微过时。

### #4469 chore(integration): sync main into daemon_mode_b_main (2026-05-24)
- **状态**: merged（base `daemon_mode_b_main`）| **关联 issue**: 无（Refs #4175）
- **一致性**: ✅（按文件分组）— 分页确认 **423 文件 / +50124**；分组 core 193 / cli 134 / vscode 31 / sdk 5 / channels 5 / scripts 17 / docs 23，与"main→分支广域同步"吻合；45 commits+1 merge 与"45 commits"一致；4 个声明冲突文件均存在且 churn 自洽。
- **描述准确性**: 冲突表 + 跨合并 test-mock 修复叙述与文件 churn 相符。
- **正确性**: ✅ — 机械同步，分组无语义重叠红旗；typecheck/291/946 测试结论未实跑（按分组评估）。
- **结论**: 合法的周期性集成同步，范围与正文一致。

### #4473 docs(serve): v0.16-alpha known limits + SDK QWEN_SERVER_TOKEN env fallback (PR 27)
- **状态**: merged（base `daemon_mode_b_main`）| **关联 issue**: 无（Refs #4175）
- **一致性**: ✅ — `DaemonClient.ts` 加 `readTokenFromEnv()`、改 `this.token = opts.token ?? readTokenFromEnv()`，与描述完全一致。
- **描述准确性**: 准确（globalThis.process 间接、trim、空串→undefined、构造期解析、opts.token 优先 5 项全兑现）。
- **正确性**: ✅ — `readTokenFromEnv` try/catch + `typeof raw!=='string'` 守卫稳健。
- **结论**: 代码与文档精确对应，小而扎实。

### #4482 fix(telemetry): improve LogToSpan bridge error info and TUI handling
- **状态**: merged（base main）| **关联 issue**: 无（label type/bug；正文留未填占位 URL）
- **一致性**: ✅ — `formatExportError`、可注入 `diagnosticsSink`、仅 `isInteractive()` 才注入 `debugLogger.warn` sink 均符。
- **描述准确性**: 基本准确；两小瑕：称"200-byte snippet"实为 200 UTF-16 code units（注释已说明）；遗留占位 issue 链接。
- **正确性**: ✅ — `typeof extra.code==='number'` 守卫避免误标 httpCode；`emitDiagnostic` 吞 sink 异常；`LogToSpanDiagnosticsSink` 确未从 index 再导出。
- **结论**: 范围清晰的 bug fix，码文一致。

### #4483 docs(deploy): local launch templates for v0.16-alpha (PR 30a)
- **状态**: merged（base `daemon_mode_b_main`）| **关联 issue**: 无（Refs #4175）
- **一致性**: ✅ — 含 4 种启动器（systemd/launchd/tmux/nohup）+ token 轮换 + smoke check；`qwen-serve.md`/`_meta.ts` 交叉链接均符。
- **描述准确性**: 大体准确，两小偏差：称"~160 LOC"实为 +221；"All templates inline TOKEN"实则 systemd 用更安全的 `EnvironmentFile=`。
- **正确性**: ✅ — 纯 markdown，交叉链接有效，引用 #4473 SDK fallback 与真实代码一致。
- **结论**: 干净的文档 PR，实际内容比摘要更稳妥。

---

## 重点跟进清单

### Open PR（优先）
1. **#4333**（原子写铺开）：修正 body —— `debugLogger` 实为**保留** bare appendFile（描述说加 flush:true，相反）；澄清 "closes #3681" 仅覆盖 Item 2。
2. **#4431**（修 #4096 属主）：标题/正文称 "uid/gid"，实现**仅按 uid** 触发（gid 跳过）——要么改述、要么补 gid 处理；并评审"非 root 写只读文件现抛 EACCES"这一行为变更是否可接受。
3. **#4412**（daemon 文档 draft）：合并前刷新 doc 09 事件数（29→38）与行号锚（doc-rot，PR 已自认）。
4. **#4410 / #4414 / #4432**（open）：均干净，仅 #4410 的 fork 子 span TTL 继承是已声明的 follow-up。

### Merged（代码 OK，建议修订描述）
5. **#4453**：body 讲 `tsc --build --clean` 但代码是 `rmSync`（机制相反）——修复正确，描述需重写。
6. **描述漂移群**（#4271/#4291/#4297/#4304/#4305/#4319/#4445/#4460）：大量评审 round 的 fold-in / 更安全实现未同步进 PR 描述（陈旧断言、少报范围、未披露夹带改动、testUtils 发布矛盾）——建议合并前把标题/正文对齐最终 diff。
7. **#4390**：`Closes #4384` 关掉了仅部分完成的 issue（session-id / 默认 traceparent 已降级到未来 PR）——补一个 tracking issue 以免 #3731 清单悬空。

### Closed（记录）
8. **#4293 / #4312 / #4313**：均为重复 PR，已正确关闭（#4312↔#4305、#4313↔#4297 同 head 分支）。

---

## 深挖补充（2026-05-31，来自 feature 深度文档）

> 写 `feature/daemon-serve-mode/04-capabilities-and-protocol.md`、`07-acp-bridge-and-permission.md` 时的新发现。

- **#4360**（协议补全）：**`errorKind` 枚举 SDK 与 daemon 不一致**——`stat_failed` 在 daemon 侧 `SERVE_ERROR_KINDS` 存在，但**缺失**于 SDK `DAEMON_ERROR_KINDS`（本 PR JSDoc 已自披露此 gap）。客户端按 errorKind 分支时该值会落到 unknown。
- **#4335**（多客户端权限）：除已记录的 `rememberResolved` 实为 FIFO（非 body 所称 LRU）外，`packages/acp-bridge/README.md` 仍把 mediator 描述为 F1 时点的 "type-only stub"，与 F3 已落地实现不符（文档时间差）。

_审查于 2026-05-31；方法：11 个并行只读子代理分两波逐 PR 拉取 issue+描述+diff（大 PR 抽样核心源码、集成 PR 按文件分组），#4453 由主代理在本地 main 核验。_
