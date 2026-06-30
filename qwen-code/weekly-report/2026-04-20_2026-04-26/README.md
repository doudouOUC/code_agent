# qwen-code PRs · 2026-04-20 ~ 2026-04-26  (W17)

**主题**: 权限修复、Python SDK 落地、auth 修复、rewind E2E

**统计**: 11 PRs — 9 merged / 0 open / 2 closed
**代码量**: +14,683 / -209，99 个文件变更
**类型**: fix ×7, other ×2, feat ×1, docs ×1
**范围 (scope)**: core ×3, cli ×2, sdk ×1, telemetry ×1, i18n ×1, test ×1

**本周最大改动**:
- [#3494](https://github.com/QwenLM/qwen-code/pull/3494) (+4676/-14, 25 files) feat(SDK) Add Python SDK implementation for #3010
- [#3492](https://github.com/QwenLM/qwen-code/pull/3492) (+3824/-4, 24 files) [codex] Add Python SDK real smoke test
- [#3493](https://github.com/QwenLM/qwen-code/pull/3493) (+3824/-4, 24 files) [codex] Add Python SDK real smoke test for #3010

| PR | 状态 | 类型 | 标题 | 变更 | 文件 | 创建 | 合并/关闭 | 链接 |
|---|---|---|---|---|---|---|---|---|
| #3467 | ✅ merged | fix(core) | fix(core): prevent malformed permission rules from becoming tool-wide catch-alls | +145/-9 | 5 | 04-20 | 04-20 | https://github.com/QwenLM/qwen-code/pull/3467 |
| #3492 | ⬜ closed | other | [codex] Add Python SDK real smoke test | +3824/-4 | 24 | 04-21 | 04-21 | https://github.com/QwenLM/qwen-code/pull/3492 |
| #3493 | ⬜ closed | other | [codex] Add Python SDK real smoke test for #3010 | +3824/-4 | 24 | 04-21 | 04-21 | https://github.com/QwenLM/qwen-code/pull/3493 |
| #3494 | ✅ merged | feat(sdk) | feat(SDK) Add Python SDK implementation for #3010 _[type/feature-request]_ | +4676/-14 | 25 | 04-21 | 04-24 | https://github.com/QwenLM/qwen-code/pull/3494 |
| #3495 | ✅ merged | fix(core) | fix(core): preserve settings-sourced apiKey when registry model envKey is absent _[type/bug]_ | +675/-0 | 2 | 04-21 | 04-25 | https://github.com/QwenLM/qwen-code/pull/3495 |
| #3498 | ✅ merged | docs(telemetry) | docs(telemetry): clarify Alibaba Cloud console entry _[type/documentation]_ | +55/-17 | 1 | 04-21 | 04-25 | https://github.com/QwenLM/qwen-code/pull/3498 |
| #3505 | ✅ merged | fix(core) | fix(core): reject truncated subagent write_file calls _[type/bug]_ | +305/-20 | 4 | 04-21 | 04-22 | https://github.com/QwenLM/qwen-code/pull/3505 |
| #3534 | ✅ merged | fix(i18n) | fix(i18n): sync mismatched keys between en.js and zh.js _[type/bug]_ | +202/-18 | 5 | 04-22 | 04-23 | https://github.com/QwenLM/qwen-code/pull/3534 |
| #3622 | ✅ merged | fix(test) | fix(test): update rewind E2E Test 1 assertion after isRealUserTurn fix | +6/-7 | 1 | 04-25 | 04-25 | https://github.com/QwenLM/qwen-code/pull/3622 |
| #3623 | ✅ merged | fix(cli) | fix(cli): recognize OpenAI-compatible providers in `qwen auth status` | +475/-30 | 2 | 04-25 | 04-28 | https://github.com/QwenLM/qwen-code/pull/3623 |
| #3624 | ✅ merged | fix(cli) | fix(cli): add API Key option to `qwen auth` interactive menu | +496/-86 | 6 | 04-25 | 04-27 | https://github.com/QwenLM/qwen-code/pull/3624 |

---

## PR 解决问题与实现方式

> 来源：同目录 `review.md` 的逐 PR diff 审查，结合 PR 状态与标题压缩成“解决了什么问题 / 怎么做的”。open/closed PR 只记录当前观察，不写成已落地实现。

| PR | 解决了什么问题 | 怎么做的 |
|---|---|---|
| [#3467](https://github.com/QwenLM/qwen-code/pull/3467) | 权限规则安全修复，分层防御到位 | 完全按 issue 建议的"显式 `invalid` 标志"：`types.ts` 加 `invalid?`、`parseRule` 标记括号不配规则、`matchesRule` 短路、`add*Rule` 警告并跳过、`listRules` 过滤，外加 `PermissionsDialog.handleAddRuleSubmit` UI 守卫。分层防御；`matchesRule:rule.invalid→false` 是兜底。 |
| [#3492](https://github.com/QwenLM/qwen-code/pull/3492) | 未作为已落地实现；标题只说 smoke test，diff 实为整个 SDK；被 #3493 取代。 | 标题/正文只讲 "real smoke test"，但 diff 实际新增整个 SDK（`src/qwen_code_sdk/*`，24 files +3824）。代码与 #3010 一致，但叙述严重低估范围。 合并版的较早快照；`smoke_real.py` 为真实路径（无 mock）。未合并、未独立验证。 |
| [#3493](https://github.com/QwenLM/qwen-code/pull/3493) | 未作为已落地实现；#3492 的换分支重开；被 #3494 取代。 | 文件清单与 #3492 逐字节相同，唯一差异是标题加 "for #3010"、分支改 issue-scoped 名。同样以 "smoke test" 框定全量 SDK diff。 代码同 #3492，未独立验证。 |
| [#3494](https://github.com/QwenLM/qwen-code/pull/3494) | 真正的 Python SDK 实现；夹带一处无关测试改动 | 标题/正文已正确描述完整 SDK；交付 async `query`/sync `query_sync`/`ProcessTransport`/control 请求/权限回调 + 真实 smoke，契合 #3010。 |
| [#3495](https://github.com/QwenLM/qwen-code/pull/3495) | apiKey 保留修复；一种 provider-baseUrl 配置仍可能丢 key | `syncAfterAuthRefresh` 在 `applyResolvedModelDefaults` 清空前保存解析出的 apiKey，并在 `process.env[envKey]` 为空时恢复，受 `isUnchanged`（同 authType+modelId）门控。真实启动传 `initialAuthType`(config.ts:1252)，故 fix 会触发。核心场景已修+测试。 |
| [#3498](https://github.com/QwenLM/qwen-code/pull/3498) | Aliyun 文档；body 漏报了一处真实的 target 值修正 | body 只提产品名澄清+控制台链接。但 diff 还静默把 "Direct Export"→"Manual OTLP Export"、重写步骤，并把文档示例从 qwen target 改为 gcp target，这是一处未声明的功能性文档修正。`gcp`/`local` 匹配 `TelemetryTarget` 枚举。 |
| [#3505](https://github.com/QwenLM/qwen-code/pull/3505) | 用 MAX_TOKENS 信号拒截断 write_file，保守且对 | 两处协同：`agent-core.ts` 把 `finishReason===MAX_TOKENS` 传入 `wasOutputTruncated`；`coreToolScheduler.ts` 把 `Kind.Edit`+truncated 拒绝移到 `buildInvocation` 之前，让清晰的截断信息盖过 schema 报错。检测用 API 信号（非内容启发式）。 |
| [#3534](https://github.com/QwenLM/qwen-code/pull/3534) | i18n 双向同步完整；body 键数写成 1268（实 1267） | 完整对齐（非部分）。合并前 en 缺 4、zh 缺 5；合并提交处实测 en=zh=1267、双向 0 不匹配。另加 CI `check-i18n` + CI 下跳过写 json。 5 条 zh 译文正确，en 4 条为规范英文 identity；`prompts`→`提示` 在 MCP 语境略宽但可接受；无错误翻译。 |
| [#3622](https://github.com/QwenLM/qwen-code/pull/3622) | rewind E2E 断言更新，逻辑自洽 | 纯测试断言更新，匹配 `isRealUserTurn` 修复；注释已改正。 `isRealUserTurn` 排除 `/rewind`，选择列表起点 GAMMA3 上移一次→BETA2，断言改 BETA2 且 ALPHA1 仍在 scrollback，正确。 |
| [#3623](https://github.com/QwenLM/qwen-code/pull/3623) | auth status 识别 OpenAI-compat provider，测试充分 | 把 USE_OPENAI 拆为 OpenRouter/CodingPlan/Standard/通用四路，解决误报 "Coding Plan (Incomplete)"。 通用分支有 `envKey` 不回退 `OPENAI_API_KEY`；陈旧 key 场景 17 测试覆盖。小瑕：Incomplete 文案丢了 envKey 名（仅文案）。 |
| [#3624](https://github.com/QwenLM/qwen-code/pull/3624) | auth 菜单加 API Key；未按 issue 字面提供 Fireworks 专项入口 | 菜单新增 "API Key"（Alibaba Standard 引导流 + Custom=仅打印文档链接）及 `auth api-key` 子命令。但 #3413 要 Fireworks/OpenRouter：OpenRouter 此前已在菜单，Fireworks 仍无专门入口，只能走通用 Custom 路径。Ctrl+C 走 `reject(Error('Interrupted'))`→exit(1)；modelIds 去重去空；清理陈旧 Coding Plan 状态； |
