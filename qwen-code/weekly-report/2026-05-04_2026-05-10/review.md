# qwen-code PR 审查 · 2026-05-04 ~ 2026-05-10 (W19)

**审查方法**：逐个 PR 拉取 _关联 issue + PR 描述 + 代码 diff_，核对 (1) 描述↔实现 **一致性**；(2) 描述 **准确性**；(3) 代码 **正确性**。评级：✅ 良好 / ⚠️ 有出入或小隐患 / ❌ 明显不符。#3893 关键结论已在本地 main 核验。

---

## 汇总

| PR | 状态 | 一致性 | 正确性 | 一句话 |
|---|---|---|---|---|
| [#3832](https://github.com/QwenLM/qwen-code/pull/3832) | merged | ✅ | ✅ | TAG_PREFIX 加 v，行为保持的标准化 |
| [#3833](https://github.com/QwenLM/qwen-code/pull/3833) | merged | ✅ | ✅ | 发布脚本加网络超时，顺序处理正确 |
| [#3834](https://github.com/QwenLM/qwen-code/pull/3834) | merged | ✅ | ✅ | 抽共享 release helper，行为保持 + 顺手修 bug |
| [#3835](https://github.com/QwenLM/qwen-code/pull/3835) | merged | ✅ | ✅ | --generate-notes 取代逐字继承，修 125KB 增长 |
| [#3847](https://github.com/QwenLM/qwen-code/pull/3847) | merged | ✅ | ✅ | traceId/spanId 注入 debug log；一处设计注释过时 |
| [#3872](https://github.com/QwenLM/qwen-code/pull/3872) | merged | ✅ | ✅ | 收缩 file diff 会话记录，持久层非破坏性裁剪 |
| [#3879](https://github.com/QwenLM/qwen-code/pull/3879) | merged | ✅ | ✅ | 上下文溢出反应式压缩，单次重试有护栏 |
| [#3883](https://github.com/QwenLM/qwen-code/pull/3883) | merged | ✅ | ✅ | 警告被忽略的 provider 生成配置（缓解非修复 #3878） |
| [#3893](https://github.com/QwenLM/qwen-code/pull/3893) | merged | ✅ | ⚠️ | opt-in 默认 OFF 正确；但附带未受门控的 response_text 采集 |
| [#3933](https://github.com/QwenLM/qwen-code/pull/3933) | merged | ✅ | ✅ | 修 subagent monitor 通知错投，owner 路由可靠 |
| [#3985](https://github.com/QwenLM/qwen-code/pull/3985) | merged | ✅ | ✅ | 反应式压缩 follow-up 加固，回滚逻辑正确 |
| [#3986](https://github.com/QwenLM/qwen-code/pull/3986) | merged | ✅ | ✅ | OTel 诊断从 UI 改路由到 debug log |
| [#3995](https://github.com/QwenLM/qwen-code/pull/3995) | merged | ✅ | ✅ | Python SDK 文档扩充，且纠正既有错误 |

**一致性**：✅14 / ⚠️0 / ❌0　　**正确性**：✅12 / ⚠️1 / —1

---

## 逐 PR 明细

### #3832 fix(sdk-python): standardize TAG_PREFIX to include v suffix
- **状态**: merged | **关联 issue**: #3793（standardize TAG_PREFIX）
- **一致性**: ✅ — `TAG_PREFIX='sdk-python-v'`，参数 `releaseTag`→`releaseVersion`，拼接点统一，正如 issue 所求。
- **描述准确性**: 准确——内部重构，最终 tag 不变。
- **正确性**: ✅ — `fullTag` 及两处 `console.error` 不再双 `v`；`releaseTag` 仍带 v，workflow `TAG_NAME` 不受影响。
- **结论**: 行为保持的干净标准化。

### #3833 feat(sdk-python): add network timeouts to release version helper
- **状态**: merged | **关联 issue**: #3794（add network timeouts）
- **一致性**: ✅ — `fetch` 用 `AbortSignal.timeout`，三处 `execSync` 加 `timeout`。
- **描述准确性**: 准确（含"超时检测须先于 isExpectedMissingGitHubRelease"）。
- **正确性**: ✅ — `isTimeoutError` 主判 `ETIMEDOUT`（经 `makeTimeoutError` 测试验证），gh catch 中超时判断确在 missing-release 之前，避免空 stderr 误判。
- **结论**: 逻辑正确、测试充分。

### #3834 refactor: extract shared release helper utilities
- **状态**: merged | **关联 issue**: #3795（extract shared release helpers）
- **一致性**: ✅ — 抽出 `getArgs/readJson/validateVersion/isExpectedMissingGitHubRelease` 到 `scripts/lib/release-helpers.js`，三消费者导入路径正确。
- **描述准确性**: 准确（含 `getArgs` 保留 `=` 的行为变更说明）。
- **正确性**: ✅ — 行为保持：`getArgs` 用 `indexOf('=')`+substring 修值内 `=` 截断；python `?.test` 与新 `||` 等价；删 `readFileSync` 导入安全。
- **结论**: 干净去重重构兼顺手修 bug。

### #3835 feat(sdk-python): replace verbatim release notes inheritance with --generate-notes
- **状态**: merged | **关联 issue**: #3796（replace verbatim notes inheritance）
- **一致性**: ✅ — 删逐字链式继承，改 `--generate-notes --notes-start-tag`，正解 125KB 线性增长。
- **描述准确性**: 准确（含首发/孤儿 tag 回退）。
- **正确性**: ✅ — `PREVIOUS_TAG_NAME` 格式与 git tag 一致；首发/preview/nightly 及 `git rev-parse` 失败均回退静态 notes；`set -u` 下空数组安全。
- **结论**: 正确修复增长问题，边界周全。

### #3847 feat(telemetry): inject traceId/spanId into debug log files for OTel correlation
- **状态**: merged | **关联 issue**: #3846（同标题，CLOSED）
- **一致性**: ✅ — `debugLogger.ts:getTraceContext` = active span → session-root ctx（仅 telemetry inited）→ omit，与 summary 一致。偏离 issue tier-2（要 SHA-256-from-sessionId 即便 telemetry off），合并版收窄；PR 有说明。
- **描述准确性**: 顶部 summary 准确；"Stable fallback spanId" 设计注释相对最终门控已过时。
- **正确性**: ✅ — 无 span 时不泄露（返回 null 字段省略）；shutdown 经 `setSessionContext(undefined)` 清理；OTel 错误吞掉。小：stream span 仅在 generator 从不迭代时泄露，正常消费 `finally` 结束。
- **结论**: 扎实的 best-effort 关联，仅一处设计注释过时。

### #3872 fix(core): shrink file diff session records
- **状态**: merged | **关联 issue**: #3822（大文件 edit 后 JSONL 膨胀致 /resume 慢）
- **一致性**: ✅ — 正是 issue 建议的持久层裁剪（`chatRecordingService.ts:sanitizeToolCallResultForRecording`），裁 fileDiff/originalContent/newContent，留 fileName/diffStat + 截断元数据；live 行为不变。
- **描述准确性**: 准确——仅裁剪存档历史。
- **正确性**: ✅ — 非破坏性（`{...display}`，测试确认原对象不变）；null originalContent 处理；消费者（ToolCallEmitter/ToolMessage/export）均更新，diffStat 保留以保计数准确。
- **结论**: 正确、范围干净的根因修复。

### #3879 feat(core): add reactive compression on context overflow
- **状态**: merged | **关联 issue**: 无
- **一致性**: ✅ — `geminiChat.ts:sendMessageStream` 捕获 provider 溢出（`contextLengthError.ts`），强制压缩一次后用压缩历史重试。
- **描述准确性**: 准确（含单次重试护栏与 timeout 排除）。
- **正确性**: ✅ — 无限循环由 `reactiveCompressionAttempted` 守卫（仅一次）；NOOP/失败 → break → 原错误传播；`attempt--` 使反应式重试不占内容重试预算；abort 重抛不吞；`force=true` 正确绕过阈值；分类器排除 timeout/MAX_TOKENS 并逐 fragment 匹配避免误判。
- **结论**: 设计周密、测试充分，保守分类器是合理权衡。

### #3883 fix(cli): warn on ignored provider generation config
- **状态**: merged | **关联 issue**: #3878（context window size 错误，settings 值被忽略，CLOSED；"Related to"）
- **一致性**: ✅ — `modelConfigUtils.ts:getIgnoredTopLevelGenerationConfigFields` 在顶层 `model.generationConfig` 有值但 provider 条目缺失时告警；docs 更新；不改解析。
- **描述准确性**: 准确，但注意是 warn+docs，不自动修 #3878 的错误 context size。
- **正确性**: ✅ — 用 `Object.hasOwn` 比对 `MODEL_GENERATION_CONFIG_FIELDS`；未知字段忽略（有测试）；受 `authType && modelProvider` 守卫；单复数语法处理。
- **结论**: 正确、低风险的 DX/文档修复；缓解（非修复）#3878。

### #3893 feat(telemetry): add sensitive span attribute opt-in
- **状态**: merged | **关联 issue**: 无（#3731 P3 项）
- **一致性**: ✅ — `includeSensitiveSpanAttributes` 全链路默认 OFF（config/telemetry-config/getter/LogToSpanProcessor）；bridge 仅在开启时保留 prompt/function_args/response_text。标题偏窄，但 body 充分披露了额外的 response_text 改动。
- **描述准确性**: 准确且充分（主动披露了非 bridge 的泄露面）。
- **正确性**: ⚠️（已核验 `loggingContentGenerator.ts:259-261`）— bridge 默认关闭确实不泄露；但 `extractResponseText` 对**非 internal** 请求**无条件**提取 response_text（`isInternal ? undefined : extractResponseText(result)`，仅 4096 截断、排除 thought），既不受新 opt-in 也不受 `logPrompts` 约束 → 配了 logs exporter 即外泄模型回复（已披露，建议挂到 `logPrompts` 下）。
- **结论**: 命名特性正确、默认安全；附带的 response_text 采集是已披露但未受门控的隐私扩面。

### #3933 [codex] fix monitor notifications for subagents
- **状态**: merged | **关联 issue**: #3925（子代理 Monitor 通知错投）、#3666
- **一致性**: ✅ — `monitor.ts` 记 `ownerAgentId`；`monitorRegistry.dispatchNotification` 按 owner 路由，无 owner 才回退全局；owner monitor 跳过全局注册，避免污染父 UI。
- **描述准确性**: 准确，覆盖路由/idle-wait/owner 退出清理。
- **正确性**: ✅ — owner 回调缺失丢弃并告警不崩溃；`cancelRunningForOwner({notify:false})` 先 settle 再 abort 再唤醒 waiter。空闲等待有界。
- **结论**: 根因（单例回调）修复正确，测试充分。

### #3985 fix(core): harden reactive compression follow-ups
- **状态**: merged | **关联 issue**: 无（#3879 follow-up）
- **一致性**: ✅ — setup 失败把 `createUserContent`/`history.push` 纳入 try，catch 中 `history.pop()` 回滚并释放 send-lock；reactive 失败置 `hasFailedCompressionAttempt`；摘要 generateContent 透传 `abortSignal`。
- **描述准确性**: 准确。
- **正确性**: ✅ — `isCompressionFailureStatus` 仅匹配 INFLATED/EMPTY_SUMMARY/TOKEN_COUNT_ERROR，正确排除 NOOP；回滚仅 pop 自身刚 push 的 user content，无误删。
- **结论**: 聚焦的正确性补强，无回归。

### #3986 feat(telemetry) suppress OpenTelemetry diagnostics from UI
- **状态**: merged | **关联 issue**: #3731（P0 项）
- **一致性**: ✅ — 移除 `DiagConsoleLogger`，改用自建 DiagLogger 路由到 `createDebugLogger('OTEL')`，保留 `DiagLogLevel.WARN`。
- **描述准确性**: 准确。
- **正确性**: ✅ — `diag.setLogger` 加载期执行，但 debug logger 写日志时惰性解析 session（测试覆盖 `[OTEL]` 前缀），不受时序影响。
- **结论**: 小而正确的日志路由改动。

### #3995 doc[sdk-python] Expand Python SDK usage documentation
- **状态**: merged | **关联 issue**: 无
- **一致性**: ✅ — 纯文档扩充（README + docs/developers/sdk-python.md）。
- **描述准确性**: 准确（async/sync/权限/多轮/运行时控制/resume/错误）。
- **正确性**: ✅ — 示例均用真实导出与方法（`Query.supported_commands/set_model/...`、`ProcessExitError.exit_code`、`auth_type`/`permission_mode` 取值与 `types.py` 一致）；并纠正旧文档错误（stderr 改"支持"、mcp_servers 标"不支持"）。
- **结论**: 文档与公开 API 高度吻合，且纠错。

### #4001 feat(cli): add structured JSON schema output
- **状态**: closed（未合并）| **关联 issue**: 无
- **一致性**: ✅（就代码本身）— `structured-output.ts`（AJV 启动期校验、`build()` 校验、`terminalResult`）+ 内部工具接线 + 三语言 SDK `structured_result` 协议字段。

---

## 重点跟进清单

### Merged（代码 OK，建议跟进）
1. **#3893**（telemetry 隐私）：把 `loggingContentGenerator.ts:extractResponseText` 的 response_text 采集挂到 `logPrompts`（或新 opt-in）下，否则配置 logs exporter 时会默认外泄模型回复——这是本周唯一与隐私相关的项，建议优先。
2. **#3847**：删除/更新 "Stable fallback spanId" 这条与最终门控不符的设计注释。

### Closed（记录）

---

## 深挖补充（2026-05-31，来自 feature 深度文档）

> 写 `feature/telemetry-observability/04-sensitive-attributes-and-pii.md` 时的新发现。

- **#3893**（敏感属性 opt-in）：除已记录的 `response_text` 外，**`api_request.request_text` 是更严重的未门控泄露面**——它既不受 `includeSensitiveSpanAttributes` 也不受 `logPrompts` 约束，且**不在** bridge 的 `SENSITIVE_ATTRIBUTE_KEYS` 白名单里，故连 span/bridge 路径都会泄露（`response_text` 至少 bridge 路径受控）。建议：请求/响应文本统一挂到 `logPrompts` 下，并把 `request_text` 补进 `SENSITIVE_ATTRIBUTE_KEYS`。

_审查于 2026-05-30；方法：并行只读子代理逐 PR 拉取 issue+描述+diff，#3893 由主代理在本地 main 核验 `extractResponseText` 调用门控。_
