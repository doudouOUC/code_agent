# qwen-code PR 描述准确性清单

> 汇总所有「PR 描述（标题/body）与实际实现/代码不符」之处，供逐个 PR 修正描述使用。
> 每条给出：**body 怎么说** / **代码实际** / **建议补充或更正的措辞**（即可直接追加到 PR 描述的文字）。
> 来源：`weekly-report/` 逐 PR 审查 + `feature/` 深度文档核实。状态为撰写时（2026-05-31）的 open/merged/closed。

**统计**：约 45 个 PR 存在不同程度的描述不准确。其中 ❌ 严重不符 4 个、⚠️ 夸大/遗漏/过时为主。

---

## A. 严重不符（body 与实现相反或大幅偏差）

| PR | 状态 | body 说法 | 代码实际 | 建议补充措辞 |
|---|---|---|---|---|
| [#3103](https://github.com/QwenLM/qwen-code/pull/3103) | open | 新增 `@qwen-code/modifiers-napi` 原生插件 + 扩展 `/terminal-setup`(Alacritty/Zed/Apple) + VSCode 改 ESC+CR | diff 恰好**相反**：删除 `terminalSetup.ts`(-393)/`terminalSetupCommand.ts`/KeypressContext ESC\r 处理；package.json/lock 虽**新增** `@qwen-code/modifiers-napi` 依赖，但 `packages/modifiers-napi` 源码缺失（悬空引用、CONFLICTING 之因）；仅 `KeyboardShortcuts.tsx` 改帮助文案 | **更新：body 部分相反**——实际删除了 `/terminal-setup` 与 VSCode ESC+CR 处理；napi 依赖虽加进 package.json/lock 但源码缺失，原生插件未真正落地。若为 pivot 到更简方案请重写描述并说明为何删除既有支持；当前状态会回退 VSCode 换行且 #241 未修复。 |
| [#4097](https://github.com/QwenLM/qwen-code/pull/4097) | merged | 仅 telemetry interaction span + `includeSensitiveSpanAttributes` 文档 | 夹带从 `settingsSchema.ts` **移除 `prompt` hook 类型**（运行时仍支持 → 回归）+ 新增 `dynamicCommandTranslation` 设置，body 未提 | **补充：本 PR 还（未声明地）从 settings schema 移除了 `prompt` hook 类型并新增 `dynamicCommandTranslation`。** 前者与运行时矛盾（`hookRegistry.ts` 仍接受 `prompt`/`function`），属回归，应单独拆出或恢复。 |
| [#4453](https://github.com/QwenLM/qwen-code/pull/4453) | merged | "prepends `tsc --build --clean`"，并论证用 `--clean` 而非 rmSync | 代码用 `rmSync('dist')`+`rmSync('tsconfig.tsbuildinfo')`，注释恰好反对 `--clean`（会沿 project references 抹上游） | **更正：实际实现用 `rmSync` 删本包 dist/tsbuildinfo，而非描述所称的 `tsc --build --clean`**（后者会误删上游产物）。修复正确，描述需改。 |
| [#4530](https://github.com/QwenLM/qwen-code/pull/4530) | merged | 命中 prompt deadline 返回硬 **504**；"Closes the FIXME…holding the FIFO" | 路由实际返回**非阻塞 202**，deadline 经 SSE `errorKind` 抵达；**bridge 侧仍无绝对 deadline**（`bridge.ts` FIXME 仍在），非协作 agent 仍可占住 per-session FIFO | **更正：命中 deadline 实际为非阻塞 202 + SSE errorKind，而非 504；bridge 侧绝对 deadline 仍未实现（FIFO 占用问题未根除）**，route 级 race 只保证快速回客户端。 |

---

## B. 夸大 / 未兑现（claims 超出实现）

| PR | 状态 | 问题 | 建议补充措辞 |
|---|---|---|---|
| [#3079](https://github.com/QwenLM/qwen-code/pull/3079) | merged | /batch 是纯 prompt 技能，"自动分块/--dry-run/聚合"为 LLM 指令；Test Plan 勾选项无对应自动化测试 | 注明：本技能为 prompt 指令，无确定性代码与自动化测试，效果取决于模型遵循度与运行时多 Agent 支持。 |
| [#3297](https://github.com/QwenLM/qwen-code/pull/3297) | merged | "修复原有 ensureTool 的 P0 并发 bug"（实为全新增代码）；"懒加载"但 `Config.initialize()` 仍 `warmAll({strict:true})` 全量急加载 | 改为：本 PR 新增 lazy factory + inflight 去重；当前 `warmAll` 仍全量预热，故启动收益未兑现；非修复既有并发 bug。 |
| [#3441](https://github.com/QwenLM/qwen-code/pull/3441) | merged | 场景4"无历史时选择器不打开"不实（`/rewind` 自身成 user item 会打开）；写 `recordRewind`（实为 `rewindRecording`） | 更正方法名 `rewindRecording`；说明无历史时仍会打开（随即空态提示）。 |
| [#3624](https://github.com/QwenLM/qwen-code/pull/3624) | merged | "fixes #3413"（Fireworks/OpenRouter）但实际只补通用 BYOK，Fireworks 无专项入口 | 改为：补充 BYOK/API-Key 通用入口；Fireworks 仍走通用 Custom 路径，未提供专项入口。 |
| [#4071](https://github.com/QwenLM/qwen-code/pull/4071) | merged | "concurrent-safe"夸大（模块全局 `lastInteractionCtx` 非并发安全）；`startLLMRequestSpan`/`startToolSpan` 等导出但未接线（死代码） | 注明：仅 interaction span 接线，其余 span API 暂未使用；并发声明仅适用顺序路径。 |
| [#4247](https://github.com/QwenLM/qwen-code/pull/4247) | merged | "guardrail/配额"实为 **per-session**，总量 = N×budget，不限守护进程总量 | 已在 R3 改述为 per-session；可补：workspace 级封顶由 #4336 共享池提供。 |
| [#4556](https://github.com/QwenLM/qwen-code/pull/4556) | merged | "Closes #4554" 乐观——issue 第 6 区（daemon metrics）未交付 | 改为 "addresses part of #4554"；metrics 待后续。 |
| [#4563](https://github.com/QwenLM/qwen-code/pull/4563) | open | "initWorkspace fixes FIXME（改用 fsFactory+trust+audit）"实为逐字搬运、仍用 `node:fs` 并删了 FIXME 注释 | 更正：initWorkspace 为纯搬运，未接 fsFactory/trust/audit；preflight 的 acp-locality 过滤是行为变更需声明。 |
| [#4576](https://github.com/QwenLM/qwen-code/pull/4576) | merged | "频道(Telegram/钉钉/微信) ! 直执行" | 实测不生效（`ChannelBase.bridge` 是 AcpBridge 无 shellCommand，inert；且 `this`-binding 隐患）。改为：仅 web-shell/HTTP/SDK 路径生效；channels 路径当前未接通。 |

---

## C. 遗漏 / 未声明的夹带改动

| PR | 状态 | 遗漏内容 | 建议补充措辞 |
|---|---|---|---|
| [#3498](https://github.com/QwenLM/qwen-code/pull/3498) | merged | 漏报把文档里 `target:"qwen"`→`"gcp"` 的功能性修正（旧值被 `parseTelemetryTargetValue` 拒） | 补充：同时修正了文档示例 `target` 值 `qwen`→`gcp`（旧值无效）。 |
| [#3779](https://github.com/QwenLM/qwen-code/pull/3779) | merged | 漏报移除 SIGTERM/SIGINT/exit handler、新增 `installInteractiveSignalHandlers`、幂等 shutdown、删 console exporter（#3734 明列范围外） | 补充：本 PR 同时重构了 shutdown/信号处理并移除 console exporter。 |
| [#4096](https://github.com/QwenLM/qwen-code/pull/4096) | merged | 未明说 rename 路线会**丢 uid/gid**且**可覆盖只读(444)文件** | 补充：rename 换 inode → 不保留 uid/gid（后由 #4431 处理）、可改写只读文件（行为变更）。 |
| [#4304](https://github.com/QwenLM/qwen-code/pull/4304) | merged | "design slice"夹带 `mapDomainErrorToErrorKind` 的 SkillError 放宽（#4298 fold-in），body 未提 | 补充：附带放宽了 SkillError 分类（instanceof || name 判定）。 |
| [#4319](https://github.com/QwenLM/qwen-code/pull/4319) | merged | File-diff 表与 4682→97 LOC 数字陈旧；夹带 #4329 helper 抽取 + SDK 超时 300→330s | 更新文件清单/LOC；注明含 #4329 与 SDK 超时调整。 |
| [#4552](https://github.com/QwenLM/qwen-code/pull/4552) | merged | 漏说服务端静默剥离 `trust/env/cwd/oauth/headers/...`（运行时加鉴权 MCP 不可用且无回传） | 补充：运行时 add 会剥离 env/headers/trust 等字段，需密钥/鉴权头的 MCP server 不可用；建议回传告警。 |
| [#4297](https://github.com/QwenLM/qwen-code/pull/4297) | merged | 只覆盖初版 4 个 P2，未提 fold-in 1/2/3/5/7/9/10；P2-2"工具不回收"与 `discoverToolsForServer` 清除行为矛盾 | 补充 fold-in 清单；更正 P2-2（重启确实会清除被禁用工具）。 |
| [#4305](https://github.com/QwenLM/qwen-code/pull/4305) | merged | 标题"7 threads"实为 rounds 4-6 十余项（`deviceFlow.ts +256/-50`） | 改标题/正文反映 rounds 5-6（pollTimedOut 竞态、Unicode 净化等）。 |

---

## D. 过时 / 数字或细节错误 / 陈旧注释

| PR | 状态 | 问题 | 建议补充措辞 |
|---|---|---|---|
| [#3148](https://github.com/QwenLM/qwen-code/pull/3148) | merged | 告警文案与 body 关于 REPLACE 的说法相反（代码说"no effect"） | 统一措辞：`modelProviders` REPLACE 当前未被 deepMerge 兑现，告警针对空对象 no-op。 |
| [#3318](https://github.com/QwenLM/qwen-code/pull/3318) | merged | "Proxy env vars set → skip"过时；实为经共享 dispatcher 隧道复用 | 更正：配代理时不跳过，而是隧道复用。 |
| [#3404](https://github.com/QwenLM/qwen-code/pull/3404) | merged | "Node v20+ per package.json" 实为 `>=22`（发布时阈值 bug，现已修） | 更正 Node 阈值为 22。 |
| [#3534](https://github.com/QwenLM/qwen-code/pull/3534) | merged | "1268 keys each" 实为 1267 | 更正数字 1267。 |
| [#3847](https://github.com/QwenLM/qwen-code/pull/3847) | merged | "Stable fallback spanId per session" 设计注释与最终门控不符 | 删除/更新该设计注释。 |
| [#4160](https://github.com/QwenLM/qwen-code/pull/4160) | merged | 称"bare API / 5 tests / 不需 teardown"，实际 ships `abort()` + 8 tests | 更新：含 `abort()` 原语与 8 个测试。 |
| [#4226](https://github.com/QwenLM/qwen-code/pull/4226) | merged | registry 注释引用不存在的 `narrowDaemonEvent`（实为 `asKnownDaemonEvent`，返回 undefined 非 `{kind:'unknown'}`） | 更正注释符号名与回退语义。 |
| [#4255](https://github.com/QwenLM/qwen-code/pull/4255) | merged | "What ships"表称 GET device-flow/:id 为 bearerAuth-only | 代码经 fold-in 已升级为 `mutate({strict:true})`（更安全）；更新表格。 |
| [#4271](https://github.com/QwenLM/qwen-code/pull/4271) | merged | 测试计划"rejects thresholdRatio !== 0.75"与代码矛盾（改为 `isFiniteNumber`） | 更新该断言条目。 |
| [#4291](https://github.com/QwenLM/qwen-code/pull/4291) | merged | 表 #1 称"writes raw err.message to stderr"，代码恰相反（`sanitizeForStderr` 防泄漏） | 更正：实际脱敏，不打印 raw message。 |
| [#4333](https://github.com/QwenLM/qwen-code/pull/4333) | merged | commit-5 称 debugLogger `appendFile` 加 `flush:true`，代码恰相反（有意不 fsync）；"closes #3681"仅覆盖 Item 2 | 更正 debugLogger flush 说法；澄清 #3681 仅 Item 2。 |
| [#4360](https://github.com/QwenLM/qwen-code/pull/4360) | merged | `errorKind` 枚举 SDK 缺 `stat_failed`（daemon 侧有；本 PR JSDoc 已自披露此 gap） | 补充：SDK `DAEMON_ERROR_KINDS` 需补 `stat_failed`。 |
| [#4431](https://github.com/QwenLM/qwen-code/pull/4431) | merged | 反复称"uid/gid"，实现**仅按 uid** 触发（gid 跳过）；非 root 写只读文件现抛 EACCES | 更正为 uid-only；说明 EACCES 行为变更。 |
| [#4445](https://github.com/QwenLM/qwen-code/pull/4445) | merged | body 称 testUtils.js "does ship in dist"，但 `files` 用负向 glob 排除；JSDoc 又称经 `.npmignore`（不存在） | 统一：testUtils 经 `files` 负向 glob 排除发布。 |
| [#4460](https://github.com/QwenLM/qwen-code/pull/4460) | merged | Changes 表行数偏旧（mcp-pool-entry 实 +113/-5） | 更新行数（非阻塞）。 |
| [#4490](https://github.com/QwenLM/qwen-code/pull/4490) | open | "14 PR/139 files/+42368"实为 **28 commit/489 files/+93283**（~3×）；"out of scope #4472/#4484"实际已在 commit list（自相矛盾）；web-shell 109 文件未提 | 刷新统计；删除自相矛盾的 out-of-scope 条目；补 web-shell 范围；解决 mergeable=dirty。 |
| [#4504](https://github.com/QwenLM/qwen-code/pull/4504) | merged | Architecture 称"client disconnect aborts the bridge-side wait"，但 PR 自带 docs 写"Cancellation absent in v1"，代码无 res.on('close')/AbortSignal | 更正：v1 无取消（与 docs 一致）。 |
| [#4559](https://github.com/QwenLM/qwen-code/pull/4559) | merged | "Closes #4548" 未实际关联（issue 仍 open）；"64KiB 截断"实在 `spawnChannel.ts` 非 `daemonLogger.ts` | 修正关联；更正截断位置。 |
| [#4606](https://github.com/QwenLM/qwen-code/pull/4606) | merged | 只称排除 /health + SSE，代码还排除 `POST .../heartbeat` | 补充排除 heartbeat。 |
| [#4630](https://github.com/QwenLM/qwen-code/pull/4630) | merged | ~~称代码无 `resolveSessionId`~~ —— **此前判断有误（误读 main）** | **撤回**：#4630 本身新增了 `resolveSessionId`（`daemon_mode_b_main:session-tracing.ts:175`，从父 span 属性派生 session.id，用于 llm_request/tool/tool.execution）；原 W22 审查正确，无描述不符。PR #4630 上的误注已移除。 |
| [#3893](https://github.com/QwenLM/qwen-code/pull/3893) | merged | 仅披露 bridge 侧门控；`extractResponseText` 的 `response_text` + `api_request.request_text` 未受 opt-in/logPrompts 门控（隐私） | 补充：request_text/response_text 在 log 路径未门控（request_text 连 bridge 路径都泄露），建议挂 `logPrompts` 并补进 `SENSITIVE_ATTRIBUTE_KEYS`。 |

---

## E. "Closes #x" 未生效 / 标题与内容错配 / issue 卫生

| PR | 状态 | 问题 | 建议 |
|---|---|---|---|
| [#3492](https://github.com/QwenLM/qwen-code/pull/3492) / [#3493](https://github.com/QwenLM/qwen-code/pull/3493) | closed | 标题"real smoke test"，diff 实为**整个 Python SDK**（24 文件）；仅 "Related to #3010" | 历史 PR，记录即可（已被 #3494 取代）。 |
| [#3494](https://github.com/QwenLM/qwen-code/pull/3494) | merged | 夹带无关 `SettingsDialog.test.tsx` 改动未提；"Related to #3010" 未 close | 补充夹带项说明。 |
| [#4390](https://github.com/QwenLM/qwen-code/pull/4390) | merged | "Closes #4384" 关掉了仅部分完成的 issue（session-id + 默认 traceparent 已降级到未来 PR） | 补 tracking issue，避免 #3731 清单悬空。 |
| [#4548](https://github.com/QwenLM/qwen-code/issues/4548) / [#4554](https://github.com/QwenLM/qwen-code/issues/4554) | open issue | #4559/#4556 写了 Closes 但 `closingIssuesReferences` 为空（跨分支 PR 副作用） | 确认是否需手动关联/关闭。 |

---

## 备注

- **修正 GitHub PR 描述**时建议 **append-only**：在原 body 末尾追加一段「更新说明（2026-05-31）」，保留原文，不覆盖。
- **优先级**：A 类（4 个，尤其 open 的 #3103（#4333/#4431 已合并））> open 的 #3103 / #4490> merged 的 ❌/隐私（#4097/#4453/#4530/#3893）> 其余过时细节。
- 本清单与 [`weekly-report/`](weekly-report/) 的逐 PR「描述准确性」项一一对应，可交叉查证。

## 执行状态（2026-05-31）

- 上述清单 + 补充共 **48 个 PR** 已逐个 **append-only** 追加「描述准确性更新」说明到 GitHub PR body（保留原文、未覆盖）：6 个 open + 41 个 merged/closed（清单 A–E）+ 补充的 #4505。
- 追加格式：原 body 末尾加一段 `> 📝 描述准确性更新（2026-05-31，作者自查）`；编辑 body **不发通知**、可撤销（PR 会显示 "edited"）。
- 补充条目 **#4505**（merged，归 B 类）：body 称 `enable_thinking` 为 unconditional / mirroring deepseek，实际还有 model-name 门（`model` 以 qwen 开头或 `coder-model`）。注：该门基于 `request.model`（= side-query 运行时模型，符合预期、非缺陷）。

_生成于 2026-05-31；最后更新 2026-06-04_
