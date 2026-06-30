# qwen-code PRs · 2026-05-04 ~ 2026-05-10  (W19)

**主题**: sdk-python 发布工具链、telemetry trace 关联、reactive compression

**统计**: 14 PRs — 13 merged / 0 open / 1 closed
**代码量**: +10,277 / -1,242，120 个文件变更
**类型**: feat ×7, fix ×5, refactor ×1, docs ×1
**范围 (scope)**: sdk-python ×4, telemetry ×3, core ×3, cli ×2

**本周最大改动**:
- [#3847](https://github.com/QwenLM/qwen-code/pull/3847) (+3504/-573, 21 files) feat(telemetry): inject traceId/spanId into debug log files for OTel correlation
- [#3933](https://github.com/QwenLM/qwen-code/pull/3933) (+1772/-82, 19 files) [codex] fix monitor notifications for subagents
- [#4001](https://github.com/QwenLM/qwen-code/pull/4001) (+1543/-283, 25 files) feat(cli): add structured JSON schema output

| PR | 状态 | 类型 | 标题 | 变更 | 文件 | 创建 | 合并/关闭 | 链接 |
|---|---|---|---|---|---|---|---|---|
| #3832 | ✅ merged | fix(sdk-python) | fix(sdk-python): standardize TAG_PREFIX to include v suffix | +6/-6 | 1 | 05-04 | 05-06 | https://github.com/QwenLM/qwen-code/pull/3832 |
| #3833 | ✅ merged | feat(sdk-python) | feat(sdk-python): add network timeouts to release version helper | +105/-3 | 2 | 05-04 | 05-05 | https://github.com/QwenLM/qwen-code/pull/3833 |
| #3834 | ✅ merged | refactor | refactor: extract shared release helper utilities | +211/-108 | 5 | 05-04 | 05-05 | https://github.com/QwenLM/qwen-code/pull/3834 |
| #3835 | ✅ merged | feat(sdk-python) | feat(sdk-python): replace verbatim release notes inheritance with --generate-notes | +20/-20 | 1 | 05-04 | 05-08 | https://github.com/QwenLM/qwen-code/pull/3835 |
| #3847 | ✅ merged | feat(telemetry) | feat(telemetry): inject traceId/spanId into debug log files for OTel correlation _[type/feature-request]_ | +3504/-573 | 21 | 05-05 | 05-10 | https://github.com/QwenLM/qwen-code/pull/3847 |
| #3872 | ✅ merged | fix(core) | fix(core): shrink file diff session records | +616/-20 | 12 | 05-06 | 05-06 | https://github.com/QwenLM/qwen-code/pull/3872 |
| #3879 | ✅ merged | feat(core) | feat(core): add reactive compression on context overflow _[type/feature-request]_ | +797/-12 | 5 | 05-06 | 05-09 | https://github.com/QwenLM/qwen-code/pull/3879 |
| #3883 | ✅ merged | fix(cli) | fix(cli): warn on ignored provider generation config _[type/bug]_ | +296/-5 | 6 | 05-06 | 05-07 | https://github.com/QwenLM/qwen-code/pull/3883 |
| #3893 | ✅ merged | feat(telemetry) | feat(telemetry): add sensitive span attribute opt-in | +414/-52 | 15 | 05-07 | 05-07 | https://github.com/QwenLM/qwen-code/pull/3893 |
| #3933 | ✅ merged | fix | [codex] fix monitor notifications for subagents _[type/bug]_ | +1772/-82 | 19 | 05-07 | 05-09 | https://github.com/QwenLM/qwen-code/pull/3933 |
| #3985 | ✅ merged | fix(core) | fix(core): harden reactive compression follow-ups _[type/enhancement]_ | +189/-18 | 4 | 05-09 | 05-09 | https://github.com/QwenLM/qwen-code/pull/3985 |
| #3986 | ✅ merged | feat(telemetry) | feat(telemetry) suppress OpenTelemetry diagnostics from UI | +93/-3 | 2 | 05-09 | 05-09 | https://github.com/QwenLM/qwen-code/pull/3986 |
| #3995 | ✅ merged | docs(sdk-python) | doc[sdk-python] Expand Python SDK usage documentation | +711/-57 | 2 | 05-09 | 05-12 | https://github.com/QwenLM/qwen-code/pull/3995 |
| #4001 | ⬜ closed | feat(cli) | feat(cli): add structured JSON schema output | +1543/-283 | 25 | 05-09 | 05-11 | https://github.com/QwenLM/qwen-code/pull/4001 |

---

## PR 解决问题与实现方式

> 来源：同目录 `review.md` 的逐 PR diff 审查，结合 PR 状态与标题压缩成“解决了什么问题 / 怎么做的”。open/closed PR 只记录当前观察，不写成已落地实现。

| PR | 解决了什么问题 | 怎么做的 |
|---|---|---|
| [#3832](https://github.com/QwenLM/qwen-code/pull/3832) | TAG_PREFIX 加 v，行为保持的标准化 | `TAG_PREFIX='sdk-python-v'`，参数 `releaseTag`→`releaseVersion`，拼接点统一，正如 issue 所求。 `fullTag` 及两处 `console.error` 不再双 `v`；`releaseTag` 仍带 v，workflow `TAG_NAME` 不受影响。 |
| [#3833](https://github.com/QwenLM/qwen-code/pull/3833) | 发布脚本加网络超时，顺序处理正确 | `fetch` 用 `AbortSignal.timeout`，三处 `execSync` 加 `timeout`。 `isTimeoutError` 主判 `ETIMEDOUT`（经 `makeTimeoutError` 测试验证），gh catch 中超时判断确在 missing-release 之前，避免空 stderr 误判。 |
| [#3834](https://github.com/QwenLM/qwen-code/pull/3834) | 抽共享 release helper，行为保持 + 顺手修 bug | 抽出 `getArgs/readJson/validateVersion/isExpectedMissingGitHubRelease` 到 `scripts/lib/release-helpers.js`，三消费者导入路径正确。 行为保持：`getArgs` 用 `indexOf('=')`+substring 修值内 `=` 截断；python `?.test` 与新的 OR fallback 写法等价；删 `readFileSync` 导入安全。 |
| [#3835](https://github.com/QwenLM/qwen-code/pull/3835) | --generate-notes 取代逐字继承，修 125KB 增长 | 删逐字链式继承，改 `--generate-notes --notes-start-tag`，正解 125KB 线性增长。 `PREVIOUS_TAG_NAME` 格式与 git tag 一致；首发/preview/nightly 及 `git rev-parse` 失败均回退静态 notes；`set -u` 下空数组安全。 |
| [#3847](https://github.com/QwenLM/qwen-code/pull/3847) | traceId/spanId 注入 debug log；一处设计注释过时 | `debugLogger.ts:getTraceContext` = active span → session-root ctx（仅 telemetry inited）→ omit，与 summary 一致。偏离 issue tier-2（要 SHA-256-from-sessionId 即便 telemetry off），合并版收窄；PR 有说明。无 span 时不泄露（返回 null 字段省略）； |
| [#3872](https://github.com/QwenLM/qwen-code/pull/3872) | 收缩 file diff 会话记录，持久层非破坏性裁剪 | 正是 issue 建议的持久层裁剪（`chatRecordingService.ts:sanitizeToolCallResultForRecording`），裁 fileDiff/originalContent/newContent，留 fileName/diffStat + 截断元数据；live 行为不变。非破坏性（`{...display}`，测试确认原对象不变）；null originalContent 处理； |
| [#3879](https://github.com/QwenLM/qwen-code/pull/3879) | 上下文溢出反应式压缩，单次重试有护栏 | `geminiChat.ts:sendMessageStream` 捕获 provider 溢出（`contextLengthError.ts`），强制压缩一次后用压缩历史重试。无限循环由 `reactiveCompressionAttempted` 守卫（仅一次）；NOOP/失败 → break → 原错误传播；`attempt--` 使反应式重试不占内容重试预算；abort 重抛不吞；`force=true` 正确绕过阈值； |
| [#3883](https://github.com/QwenLM/qwen-code/pull/3883) | 警告被忽略的 provider 生成配置（缓解非修复 #3878） | `modelConfigUtils.ts:getIgnoredTopLevelGenerationConfigFields` 在顶层 `model.generationConfig` 有值但 provider 条目缺失时告警；docs 更新；不改解析。 用 `Object.hasOwn` 比对 `MODEL_GENERATION_CONFIG_FIELDS`；未知字段忽略（有测试）；受 `authType && modelProvider` 守卫；单复数语法处理。 |
| [#3893](https://github.com/QwenLM/qwen-code/pull/3893) | opt-in 默认 OFF 正确；但附带未受门控的 response_text 采集 | `includeSensitiveSpanAttributes` 全链路默认 OFF（config/telemetry-config/getter/LogToSpanProcessor）；bridge 仅在开启时保留 prompt/function_args/response_text。标题偏窄，但 body 充分披露了额外的 response_text 改动。 |
| [#3933](https://github.com/QwenLM/qwen-code/pull/3933) | 修 subagent monitor 通知错投，owner 路由可靠 | `monitor.ts` 记 `ownerAgentId`；`monitorRegistry.dispatchNotification` 按 owner 路由，无 owner 才回退全局；owner monitor 跳过全局注册，避免污染父 UI。 owner 回调缺失丢弃并告警不崩溃；`cancelRunningForOwner({notify:false})` 先 settle 再 abort 再唤醒 waiter。空闲等待有界。 |
| [#3985](https://github.com/QwenLM/qwen-code/pull/3985) | 反应式压缩 follow-up 加固，回滚逻辑正确 | setup 失败把 `createUserContent`/`history.push` 纳入 try，catch 中 `history.pop()` 回滚并释放 send-lock；reactive 失败置 `hasFailedCompressionAttempt`；摘要 generateContent 透传 `abortSignal`。 |
| [#3986](https://github.com/QwenLM/qwen-code/pull/3986) | OTel 诊断从 UI 改路由到 debug log | 移除 `DiagConsoleLogger`，改用自建 DiagLogger 路由到 `createDebugLogger('OTEL')`，保留 `DiagLogLevel.WARN`。 `diag.setLogger` 加载期执行，但 debug logger 写日志时惰性解析 session（测试覆盖 `[OTEL]` 前缀），不受时序影响。 |
| [#3995](https://github.com/QwenLM/qwen-code/pull/3995) | Python SDK 文档扩充，且纠正既有错误 | 纯文档扩充（README + docs/developers/sdk-python.md）。 示例均用真实导出与方法（`Query.supported_commands/set_model/...`、`ProcessExitError.exit_code`、`auth_type`/`permission_mode` 取值与 `types.py` 一致）；并纠正旧文档错误（stderr 改"支持"、mcp_servers 标"不支持"）。 |
