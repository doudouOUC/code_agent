# qwen-code PRs · 2026-07-06 ~ 2026-07-12 (W28 周内累计)

> 本文件已整理 2026-07-06 至 2026-07-07（Asia/Shanghai）的 @doudouOUC 个人 PR。口径为 `QwenLM/qwen-code` 中 author 为 @doudouOUC 且 createdAt 落在对应北京时间日窗口内的 PR；只在窗口内更新、关闭或合入，但创建时间不在窗口内的 PR 不计入新增统计。

**主题**: session start profiler、ACP `/tmp` local fallback read、daemon workspace runtime registry、大文本范围读取、settings reload UI signal、PDF 读取预算、Phase 2a workspace foundation、serve env isolation / total admission（open 方案）

**PR 统计**: 8 PRs - 7 merged / 1 open / 0 closed
**当前已合并 PR 代码量**: +5,435 / -407，66 个文件变更
**全量代码量**: +7,642 / -673，111 个文件变更
**类型分布**: fix ×4, feat ×3, perf ×1
**范围 (scope)**: core/perf ×1, ACP/file boundary ×1, cli/serve ×3, core/file-reading ×2, daemon/webui ×1

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 变更 | 文件 | 创建(UTC) | 合并/关闭(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#6349](https://github.com/QwenLM/qwen-code/pull/6349) | ✅ merged | @doudouOUC | perf(core): Add session start profiler | +1172/-37 | 5 | 07-05 17:01 | 07-07 05:06 |
| [#6370](https://github.com/QwenLM/qwen-code/pull/6370) | ✅ merged | @doudouOUC | fix(cli): Allow ACP local fallback reads from /tmp | +159/-79 | 3 | 07-06 06:42 | 07-06 07:43 |
| [#6394](https://github.com/QwenLM/qwen-code/pull/6394) | ✅ merged | @doudouOUC | feat(cli): Add Phase 1 workspace runtime registry | +527/-100 | 13 | 07-06 12:15 | 07-06 14:01 |
| [#6404](https://github.com/QwenLM/qwen-code/pull/6404) | ✅ merged | @doudouOUC | fix(core): Support large text range reads | +1417/-82 | 20 | 07-06 15:31 | 07-07 11:40 |
| [#6407](https://github.com/QwenLM/qwen-code/pull/6407) | ✅ merged | @doudouOUC | fix(daemon): Handle settings reload events outside transcript | +151/-0 | 4 | 07-06 16:17 | 07-06 21:56 |
| [#6409](https://github.com/QwenLM/qwen-code/pull/6409) | ✅ merged | @doudouOUC | fix(core): Gate large PDF text extraction | +988/-66 | 9 | 07-06 16:25 | 07-07 04:40 |
| [#6410](https://github.com/QwenLM/qwen-code/pull/6410) | ✅ merged | @doudouOUC | feat(cli): Add Phase 2a workspace foundation | +1021/-43 | 12 | 07-06 17:18 | 07-07 01:40 |
| [#6416](https://github.com/QwenLM/qwen-code/pull/6416) | 🟡 open | @doudouOUC | feat(cli): Add serve env isolation and total admission | +2207/-266 | 45 | 07-07 03:35 | — |

---

## PR 解决问题、实现方式与 feature 处理

| PR | 解决了什么问题 | 最终怎么实现（open 只登记当前观察） | 对应 feature 文档 |
|---|---|---|---|
| [#6349](https://github.com/QwenLM/qwen-code/pull/6349) | #6312 后续优化需要知道 `GeminiClient.startChat()` 的具体耗时阶段，而现有 startup profiler 只能看到更粗的 CLI 启动成本。 | 新增 opt-in `session-start-profiler.ts`，仅在 `QWEN_CODE_PROFILE_SESSION_START=1` 时写 runtime 目录下的 JSONL；`startChat()` 用静态 stage 名包住 tool registry warm、deferred tool reveal、history build、system instruction、hook、`setTools()` 等阶段，并只输出 stage duration、success 和聚合计数。 | 已更新 [cli-startup-performance.md](../../feature/cli-startup-performance.md)，从 open 方案修正为 merged 实现。 |
| [#6370](https://github.com/QwenLM/qwen-code/pull/6370) | ACP 客户端会把 `/tmp/datastudio_cli_extract/...` 这类生成文件判成 workspace 外路径，导致 daemon 本地能读但 ACP read_file 失败。 | 只扩大 ACP local read fallback roots：POSIX 默认追加 `/tmp`，新增 `QWEN_ACP_LOCAL_READ_ROOTS` 追加绝对路径；普通 `read_file` 默认权限不变，fallback 仍走 realpath/subpath 安全校验。 | 已补 [daemon-serve-mode/05-workspace-files-and-fs-boundary.md](../../feature/daemon-serve-mode/05-workspace-files-and-fs-boundary.md)。 |
| [#6394](https://github.com/QwenLM/qwen-code/pull/6394) | daemon multi-workspace 后续阶段需要内部 runtime 边界，但当前 serve 装配仍把 bridge、workspace service、REST fsFactory 等对象散落在单 workspace 路径中；重复 `--workspace` 也没有明确失败。 | 新增 `WorkspaceRuntime` / `WorkspaceRegistry`，把当前 primary runtime 作为唯一 runtime 暴露给 server assembly；保留现有 route schema 和 legacy locals；daemon log/telemetry identity 改成 daemon-scoped，workspace hash 作为 metadata；多个显式 `--workspace` 在 boot 阶段报错。 | 已补 [daemon-serve-mode/README.md](../../feature/daemon-serve-mode/README.md)。 |
| [#6404](https://github.com/QwenLM/qwen-code/pull/6404) | 10MB 以上纯文本日志会被 `read_file` 直接拒绝，模型无法分析 CI log 等大文本产物。 | 新增 `readTextRange.ts`，把小文本和大文本范围读取分流；大文本按 line/limit/maxOutputBytes 流式返回有界内容和截断元数据，并把 cancel signal 传到 `read_file`、`read_many_files`、ACP filesystem 和 `@file` 读取链路；非文本和媒体大小保护不变。 | 已更新 [file-reading.md](../../feature/file-reading.md)，从 open 方案修正为 merged 实现。 |
| [#6407](https://github.com/QwenLM/qwen-code/pull/6407) | daemon settings reload 广播会被 Web Shell 当成未知 debug 事件插进 transcript，用户看到 `settings_reloaded (unrecognized daemon event)` 噪声，开发者也缺少结构化排障日志。 | SDK normalizer 把 `settings_reloaded` 转成 `workspace.settings.changed` signal；WebUI `DaemonSessionProvider` 在归一化前输出一条筛选字段的 `console.debug`，只记录 changed keys、env key 名、child reload 状态和刷新/跳过 session，且不再生成 transcript debug block。 | 已补 [daemon-serve-mode/README.md](../../feature/daemon-serve-mode/README.md)、[08-extension-endpoints.md](../../feature/daemon-serve-mode/08-extension-endpoints.md) 与 [10-client-adapters-and-sdk.md](../../feature/daemon-serve-mode/10-client-adapters-and-sdk.md)。 |
| [#6409](https://github.com/QwenLM/qwen-code/pull/6409) | 纯文本模型读取大型 PDF 时，旧 fallback 会把整本 PDF 的 `pdftotext` 结果塞进 prompt，100 页 PDF 级别内容会在自动压缩后仍触发上下文溢出。 | PDF text fallback 引入 page-count/size heuristic：大 PDF 不带 `pages` 时返回短 guidance；`@` 附件使用 reference 行为而不是失败读；显式 `pages` 继续走 `pdftotext`，但结果用 tokenizer 估算守住 12k token 上限，过密页返回更窄页段建议。 | 已补 [file-reading.md](../../feature/file-reading.md) 的 PDF 读取预算章节。 |
| [#6410](https://github.com/QwenLM/qwen-code/pull/6410) | #6378 需要在真正多 workspace session dispatch 前先固定 parser、runtime registry 和 live session owner 边界；否则重复 `--workspace` 可能被 parser 依赖行为误当成单 workspace。 | `--workspace` 在 yargs 层改为 repeatable，fast path 看到重复值回退完整 parser；`workspace-inputs.ts` 对空值、duplicate、nested 和 distinct multi-workspace 输入 fail closed；`WorkspaceRegistry` 增加 workspace id/cwd lookup、primary fallback、live session owner resolution；`createServeApp` 支持 registry 注入并检测 split-brain 依赖冲突。 | 已补 [daemon-serve-mode/README.md](../../feature/daemon-serve-mode/README.md)。 |
| [#6416](https://github.com/QwenLM/qwen-code/pull/6416) | Phase 2a 后续要安全创建 non-primary runtime，需要 runtime-local env source 和 daemon-wide fresh session cap；否则子进程会读共享 `process.env`，并发 session 创建也可能在 bridge 注册前超卖总量。 | 当前 open diff 新增 `buildRuntimeEnvironment()` 与 mutable runtime env snapshot，把 `sourceEnv` 传入 ACP child spawn，并让 status/provider/voice/a2ui 等 workspace-scoped 低成本读取点消费注入 env；`BridgeOptions.freshSessionAdmission` 在 spawn/load/resume/branch 前同步 reserve，`--max-total-sessions` 命中时返回 `session_limit_exceeded` + `scope:"total"`，并在 `/daemon/status.limits.maxTotalSessions` 暴露配置。 | 已补 [daemon-serve-mode/README.md](../../feature/daemon-serve-mode/README.md) 的 open 方案记录。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [cli-startup-performance.md](../../feature/cli-startup-performance.md) | #6349 | session start profiler 从 open 方案改为 merged 实现，保留 JSONL stage timing、敏感信息边界和验证方式。 |
| [daemon-serve-mode/05-workspace-files-and-fs-boundary.md](../../feature/daemon-serve-mode/05-workspace-files-and-fs-boundary.md) | #6370 | 补 ACP-only `/tmp` fallback root 与 `QWEN_ACP_LOCAL_READ_ROOTS` append-only roots。 |
| [daemon-serve-mode/README.md](../../feature/daemon-serve-mode/README.md) | #6394 / #6407 / #6410 / #6416 | 补 Phase 1/2a workspace registry、settings reload signal、repeatable workspace guardrail、runtime env snapshot 与 total admission open 方案。 |
| [daemon-serve-mode/08-extension-endpoints.md](../../feature/daemon-serve-mode/08-extension-endpoints.md) | #6407 | 补 `settings_reloaded` 作为 workspace settings refresh signal 的客户端处理边界。 |
| [daemon-serve-mode/10-client-adapters-and-sdk.md](../../feature/daemon-serve-mode/10-client-adapters-and-sdk.md) | #6407 | 补 SDK/WebUI normalizer 对 `settings_reloaded` 的 transcript 过滤和 debug log 边界。 |
| [file-reading.md](../../feature/file-reading.md) | #6404 / #6409 | 大文本范围读取改为 merged 实现，并新增大型 PDF guidance/reference/token guard。 |

_周内累计按个人 PR 口径更新于 2026-07-08_
