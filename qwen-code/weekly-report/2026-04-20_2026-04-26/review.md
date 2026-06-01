# qwen-code PR 审查 · 2026-04-20 ~ 2026-04-26 (W17)

**审查方法**：逐个 PR 拉取 _关联 issue + PR 描述 + 代码 diff_，核对 (1) 描述↔实现 **一致性**；(2) 描述 **准确性**；(3) 代码 **正确性**。评级：✅ 良好 / ⚠️ 有出入或小隐患 / ❌ 明显不符。Python SDK 三连（#3492/#3493/#3494）按文件分组抽样。

---

## 汇总

| PR | 状态 | 一致性 | 正确性 | 一句话 |
|---|---|---|---|---|
| [#3467](https://github.com/QwenLM/qwen-code/pull/3467) | merged | ✅ | ✅ | 权限规则安全修复，分层防御到位 |
| [#3492](https://github.com/QwenLM/qwen-code/pull/3492) | closed | ⚠️ | ✅ | 标题只说 smoke test，diff 实为整个 SDK；被 #3493 取代 |
| [#3493](https://github.com/QwenLM/qwen-code/pull/3493) | closed | ⚠️ | ✅ | #3492 的换分支重开；被 #3494 取代 |
| [#3494](https://github.com/QwenLM/qwen-code/pull/3494) | merged | ✅ | ✅ | 真正的 Python SDK 实现；夹带一处无关测试改动 |
| [#3495](https://github.com/QwenLM/qwen-code/pull/3495) | merged | ✅ | ⚠️ | apiKey 保留修复；一种 provider-baseUrl 配置仍可能丢 key |
| [#3498](https://github.com/QwenLM/qwen-code/pull/3498) | merged | ⚠️ | ✅ | Aliyun 文档；body 漏报了一处真实的 target 值修正 |
| [#3505](https://github.com/QwenLM/qwen-code/pull/3505) | merged | ✅ | ✅ | 用 MAX_TOKENS 信号拒截断 write_file，保守且对 |
| [#3534](https://github.com/QwenLM/qwen-code/pull/3534) | merged | ✅ | ✅ | i18n 双向同步完整；body 键数写成 1268（实 1267） |
| [#3622](https://github.com/QwenLM/qwen-code/pull/3622) | merged | ✅ | ✅ | rewind E2E 断言更新，逻辑自洽 |
| [#3623](https://github.com/QwenLM/qwen-code/pull/3623) | merged | ✅ | ✅ | auth status 识别 OpenAI-compat provider，测试充分 |
| [#3624](https://github.com/QwenLM/qwen-code/pull/3624) | merged | ⚠️ | ✅ | auth 菜单加 API Key；未按 issue 字面提供 Fireworks 专项入口 |

**一致性**：✅7 / ⚠️4 / ❌0　　**正确性**：✅10 / ⚠️1 / ❌0

> **Python SDK 三连关系**：#3492 →（换 issue-scoped 分支）#3493 →（更宽分支）#3494（合并）。三者 8 分钟内创建，#3492/#3493 标题写"smoke test"但已含全量 SDK；smoke 测试**未被废弃**，已折进 #3494（`smoke_real.py` 在 main，`npm run smoke:sdk:python` 已接线）。

---

## 逐 PR 明细

### #3467 fix(core): prevent malformed permission rules from becoming tool-wide catch-alls
- **状态**: merged | **关联 issue**: #3459（括号不配的畸形规则变成 tool-wide catch-all）
- **一致性**: ✅ — 完全按 issue 建议的"显式 `invalid` 标志"：`types.ts` 加 `invalid?`、`parseRule` 标记括号不配规则、`matchesRule` 短路、`add*Rule` 警告并跳过、`listRules` 过滤，外加 `PermissionsDialog.handleAddRuleSubmit` UI 守卫。
- **描述准确性**: 准确；覆盖 deny（过度拦截）与 allow（静默自动批准的安全风险）两向。
- **正确性**: ✅ — 分层防御；`matchesRule:rule.invalid→false` 是兜底。有效规则不受影响：无括号规则早返回，`Tool(spec)` 以 `)` 结尾，仅 `Tool(...` 被判 invalid。测试断言匹配行为而非仅形状。
- **结论**: 正确、范围干净、契合 issue 首选方案的安全修复。

### #3492 [codex] Add Python SDK real smoke test
- **状态**: closed（被 #3493 取代）| **关联 issue**: #3010（"有 python sdk 提供吗？"，仍 open；仅 "Related to"）
- **一致性**: ⚠️ — 标题/正文只讲 "real smoke test"，但 diff 实际新增**整个 SDK**（`src/qwen_code_sdk/*`，24 files +3824）。代码与 #3010 一致，但叙述严重低估范围。
- **描述准确性**: 低描述——正文只列 smoke/npm/docs，未提完整实现。
- **正确性**: ✅ — 合并版的较早快照；`smoke_real.py` 为真实路径（无 mock）。未合并、未独立验证。
- **结论**: 首次尝试的重复 PR，被正确取代；标题错配内容。

### #3493 [codex] Add Python SDK real smoke test for #3010
- **状态**: closed（被 #3494 取代）| **关联 issue**: #3010（仅 "Related to"）
- **一致性**: ⚠️ — 文件清单与 #3492 逐字节相同，唯一差异是标题加 "for #3010"、分支改 issue-scoped 名。同样以 "smoke test" 框定全量 SDK diff。
- **描述准确性**: 与 #3492 完全相同；同样低估范围。
- **正确性**: ✅ — 代码同 #3492，未独立验证。
- **结论**: #3492 的近乎原样重开（仅换分支名），旋即被 #3494 取代。

### #3494 feat(SDK) Add Python SDK implementation for #3010
- **状态**: merged（2026-04-24）| **关联 issue**: #3010（仍 open；仅 "Related to"，未 auto-close）
- **一致性**: ✅ — 标题/正文已正确描述完整 SDK；交付 async `query`/sync `query_sync`/`ProcessTransport`/control 请求/权限回调 + 真实 smoke，契合 #3010。
- **描述准确性**: 准确；唯一小瑕：夹带无关的 `SettingsDialog.test.tsx`(+21/-9) UI 测试改动，正文未提（轻微 scope creep）。
- **正确性**: ✅ — `transport.py:build_cli_arguments` 旗标与真实 CLI 核对一致（`--approval-mode`/`--channel=SDK`/`--core-tools`、`"auto-edit"` 与 `ApprovalMode.AUTO_EDIT` 吻合）；`smoke_real.py` 跑真实 `qwen --version`、期望 `SDK_REAL_ASYNC_OK`、无 mock；错误分层+控制超时齐全。注：作者自述真实 smoke "未运行"（避免 live 调用），`mcp_server_status`/`supported_commands` 控制子类型未在 CLI 侧核验。
- **结论**: 范围正确、设计对齐 TS SDK、smoke 为真实路径的稳健合并；仅夹带一处无关测试改动。

### #3495 fix(core): preserve settings-sourced apiKey when registry model envKey is absent
- **状态**: merged | **关联 issue**: #3417（每次重启 401；settings.json 里的 key 被忽略）
- **一致性**: ✅ — `syncAfterAuthRefresh` 在 `applyResolvedModelDefaults` 清空前保存解析出的 apiKey，并在 `process.env[envKey]` 为空时恢复，受 `isUnchanged`（同 authType+modelId）门控。真实启动传 `initialAuthType`(config.ts:1252)，故 fix 会触发。
- **描述准确性**: 准确；正确限制保留来源、阻断跨 provider 泄漏。
- **正确性**: ⚠️ — 核心场景已修+测试。边界：`isProviderChanged` 用 `apiKeyEnvKey !== resolved.envKey`；若启动时 `baseUrl` 来源已是 `modelProviders`（key 来自 settings、`apiKeyEnvKey` undefined），`isProviderChanged` 变 true → 不保留。注释已承认，仅当启动 `baseUrl` 来自 settings 时安全。
- **结论**: 对上报场景扎实的修复；一种未测的 provider-baseUrl 配置仍可能丢 key。

### #3498 docs(telemetry): clarify Alibaba Cloud console entry
- **状态**: merged | **关联 issue**: #3461（Aliyun 遥测文档不清，求具体控制台入口）
- **一致性**: ⚠️ — body 只提产品名澄清+控制台链接。但 diff **还静默**把 "Direct Export"→"Manual OTLP Export"、重写步骤、并把文档里 `target:"qwen"`→`"gcp"`（及 `<local|qwen>`→`<local|gcp>`）——一处未声明的功能性文档修正。
- **描述准确性**: 不完整——漏报 target 值修正与章节重写。
- **正确性**: ✅ — `gcp`/`local` 匹配 `TelemetryTarget` 枚举；`parseTelemetryTargetValue` 拒 `"qwen"`，故旧值本就是坏的、此处修对；otlpEndpoint 默认与 outfile override 说明与代码一致。
- **结论**: 内容正确且提升准确性，但 PR 描述低报了一处真实的行为性文档修正。

### #3505 fix(core): reject truncated subagent write_file calls
- **状态**: merged | **关联 issue**: #3286（subagent write_file → "must have required property 'content'"）
- **一致性**: ✅ — 两处协同：`agent-core.ts` 把 `finishReason===MAX_TOKENS` 传入 `wasOutputTruncated`；`coreToolScheduler.ts` 把 `Kind.Edit`+truncated 拒绝移到 `buildInvocation` 之前，让清晰的截断信息盖过 schema 报错。
- **描述准确性**: 准确；scheduler 级与 subagent 级两路径 + 回归测试。
- **正确性**: ✅ — 检测用 API 信号（非内容启发式）。重试 handler 重置 `functionCalls/roundText/wasOutputTruncated`（修了潜在的累积陈旧 bug，有测试）。保守误判：完整 edit 恰逢 MAX_TOKENS 会被拒（安全方向）；漏判仅当 provider 不报 MAX_TOKENS。
- **结论**: 正确、保守、命中 subagent 真实根因的修复。

### #3534 fix(i18n): sync mismatched keys between en.js and zh.js
- **状态**: merged | **关联 issue**: #3503（zh-CN 与 en-US 键不匹配）
- **一致性**: ✅ — 完整对齐（非部分）。合并前 en 缺 4、zh 缺 5；合并提交处实测 en=zh=1267、双向 0 不匹配。另加 CI `check-i18n` + CI 下跳过写 json。
- **描述准确性**: 基本准确，但正文称"1268 keys each"实际 1267（差一）。
- **正确性**: ✅ — 5 条 zh 译文正确，en 4 条为规范英文 identity；`prompts`→`提示` 在 MCP 语境略宽但可接受；无错误翻译。
- **结论**: 真正完成双向同步，唯一瑕疵是描述里键数字写错。

### #3622 fix(test): update rewind E2E Test 1 assertion after isRealUserTurn fix
- **状态**: merged | **关联 issue**: 无（引用 PR #3441）
- **一致性**: ✅ — 纯测试断言更新，匹配 `isRealUserTurn` 修复；注释已改正。
- **描述准确性**: 准确。
- **正确性**: ✅ — `isRealUserTurn` 排除 `/rewind`，选择列表起点 GAMMA3 上移一次→BETA2，断言改 BETA2 且 ALPHA1 仍在 scrollback，正确。
- **结论**: 低风险、逻辑自洽的测试修正。

### #3623 fix(cli): recognize OpenAI-compatible providers in `qwen auth status`
- **状态**: merged | **关联 issue**: #3612（auth status 不识别 OpenAI-compatible provider）
- **一致性**: ✅ — 把 USE_OPENAI 拆为 OpenRouter/CodingPlan/Standard/通用四路，解决误报 "Coding Plan (Incomplete)"。
- **描述准确性**: 大体准确；"via codingPlan.region OR isCodingPlanConfig" 略松（有 activeConfig 时只用 `isCodingPlanConfig`，region 仅在无 activeConfig 且无 modelName 时生效，符合意图）。
- **正确性**: ✅ — 通用分支有 `envKey` 不回退 `OPENAI_API_KEY`；陈旧 key 场景 17 测试覆盖。小瑕：Incomplete 文案丢了 envKey 名（仅文案）。
- **结论**: 正确且测试充分的修复。

### #3624 fix(cli): add API Key option to `qwen auth` interactive menu
- **状态**: merged | **关联 issue**: #3413（Fireworks provider 在 qwen auth 不可见）
- **一致性**: ⚠️ — 菜单新增 "API Key"（Alibaba Standard 引导流 + Custom=仅打印文档链接）及 `auth api-key` 子命令。但 #3413 要 Fireworks/OpenRouter：OpenRouter 此前已在菜单，Fireworks 仍无专门入口，只能走通用 Custom 路径。
- **描述准确性**: 对代码准确；"fixes #3413" 相对 issue 的 Fireworks 诉求略宽，实补的是 BYOK 缺口。
- **正确性**: ✅ — Ctrl+C 走 `reject(Error('Interrupted'))`→exit(1)；modelIds 去重去空；清理陈旧 Coding Plan 状态；Custom 仅打印文档为有意设计。
- **结论**: 菜单/UX 补全扎实，唯一弱点是未按 issue 字面提供 Fireworks 专项入口。

---

## 重点跟进清单

### Merged（代码 OK，仅建议修订描述 / 后续）
1. **#3495**：补测/处理"启动 baseUrl 来自 modelProviders 时 `isProviderChanged` 误判 → 丢 key"的边界。
2. **#3498**：PR 描述补回"`target:qwen`→`gcp` 修正"这一真实改动（当前 body 低报）。
3. **#3624**：若要真正闭合 #3413，补 Fireworks 专项入口；否则在 issue 说明已由通用 BYOK 覆盖。
4. **#3494**：剥离夹带的 `SettingsDialog.test.tsx` 无关改动（记录即可）；`mcp_server_status`/`supported_commands` 控制子类型建议补 CLI 侧核验。
5. **描述习惯**：#3492/#3493 标题与内容严重错配（"smoke test" vs 全量 SDK）、#3534 键数写错——建议提 PR 时让标题/正文覆盖 diff 的真实范围。

---

_审查于 2026-05-30；方法：并行只读子代理逐 PR 拉取 issue+描述+diff，SDK 大 PR 抽样核心源码。_
