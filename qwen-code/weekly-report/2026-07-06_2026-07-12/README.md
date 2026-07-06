# qwen-code PRs · 2026-07-06 ~ 2026-07-12 (W28 日增量)

> 本文件已整理 2026-07-06（Asia/Shanghai）的 @doudouOUC 个人 PR。2026-07-06 窗口为北京时间 `2026-07-06 00:00:00` ~ `23:59:59`，对应 UTC `2026-07-05T16:00:00Z` ~ `2026-07-06T15:59:59Z`。口径为 `QwenLM/qwen-code` 中 author 为 @doudouOUC 且 createdAt 落在该窗口内的 PR；只在当日合入、但创建时间不在窗口内的 PR 不计入当日统计。

**主题**: session start profiler（open 方案）、ACP `/tmp` local fallback read、daemon workspace runtime registry、大文本范围读取（open 方案）

**PR 统计**: 4 PRs - 2 merged / 2 open / 0 closed
**当前已合并 PR 代码量**: +686 / -179，16 个文件变更
**全量代码量**: +2,581 / -281，36 个文件变更
**类型分布**: fix ×2, feat ×1, perf ×1
**范围 (scope)**: core/perf ×1, ACP/file boundary ×1, cli/serve ×1, core/file-reading ×1

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 变更 | 文件 | 创建(UTC) | 合并/关闭(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#6349](https://github.com/QwenLM/qwen-code/pull/6349) | 🟡 open | @doudouOUC | perf(core): Add session start profiler | +1150/-37 | 5 | 07-05 17:01 | — |
| [#6370](https://github.com/QwenLM/qwen-code/pull/6370) | ✅ merged | @doudouOUC | fix(cli): Allow ACP local fallback reads from /tmp | +159/-79 | 3 | 07-06 06:42 | 07-06 07:43 |
| [#6394](https://github.com/QwenLM/qwen-code/pull/6394) | ✅ merged | @doudouOUC | feat(cli): Add Phase 1 workspace runtime registry | +527/-100 | 13 | 07-06 12:15 | 07-06 14:01 |
| [#6404](https://github.com/QwenLM/qwen-code/pull/6404) | 🟡 open | @doudouOUC | fix(core): Support large text range reads | +745/-65 | 15 | 07-06 15:31 | — |

---

## PR 解决问题、实现方式与 feature 处理

| PR | 解决了什么问题 | 最终怎么实现（open 只登记当前观察） | 对应 feature 文档 |
|---|---|---|---|
| [#6349](https://github.com/QwenLM/qwen-code/pull/6349) | #6312 后续优化需要知道 `GeminiClient.startChat()` 的具体耗时阶段，而现有启动 profiler 只能看到更粗的初始化成本。 | 新增 opt-in `session-start-profiler.ts`，仅在 `QWEN_CODE_PROFILE_SESSION_START=1` 时写 runtime 目录下的 JSONL；`startChat()` 用静态 stage 名包住 tool registry warm、deferred tool reveal、history build、system instruction、hook、`setTools()` 等阶段，并只输出 stage duration、success 和聚合计数。 | 已补 [cli-startup-performance.md](../../feature/cli-startup-performance.md) 的 open 方案记录。 |
| [#6370](https://github.com/QwenLM/qwen-code/pull/6370) | ACP 客户端会把 `/tmp/datastudio_cli_extract/...` 这类生成文件判成 workspace 外路径，导致 daemon 本地能读但 ACP read_file 失败。 | 只扩大 ACP local read fallback roots：POSIX 默认追加 `/tmp`，新增 `QWEN_ACP_LOCAL_READ_ROOTS` 追加绝对路径；普通 `read_file` 默认权限不变，fallback 仍走 realpath/subpath 安全校验。 | 已补 [daemon-serve-mode/05-workspace-files-and-fs-boundary.md](../../feature/daemon-serve-mode/05-workspace-files-and-fs-boundary.md)。 |
| [#6394](https://github.com/QwenLM/qwen-code/pull/6394) | daemon multi-workspace 后续阶段需要内部 runtime 边界，但当前 serve 装配仍把 bridge、workspace service、REST fsFactory 等对象散落在单 workspace 路径中；重复 `--workspace` 也没有明确失败。 | 新增 `WorkspaceRuntime` / `WorkspaceRegistry`，把当前 primary runtime 作为唯一 runtime 暴露给 server assembly；保留现有 route schema 和 legacy locals；daemon log/telemetry identity 改成 daemon-scoped，workspace hash 作为 metadata；多个显式 `--workspace` 在 boot 阶段报错。 | 已补 [daemon-serve-mode/README.md](../../feature/daemon-serve-mode/README.md)。 |
| [#6404](https://github.com/QwenLM/qwen-code/pull/6404) | 10MB 以上纯文本日志会被 `read_file` 直接拒绝，模型无法分析 CI log 等大文本产物。 | 新增 `readTextRange.ts`，把小文本和大文本范围读取分流；大文本按 line/limit/maxOutputBytes 流式返回有界内容和截断元数据，并把 cancel signal 传到 `read_file`、`read_many_files`、ACP filesystem 和 `@file` 读取链路；非文本和媒体大小保护不变。 | 已补 [file-reading.md](../../feature/file-reading.md) 的 open 方案记录。 |

## PR 对应 feature 覆盖

| feature 文档 | 本日新增/复核 PR | 文档动作 |
|---|---|---|
| [cli-startup-performance.md](../../feature/cli-startup-performance.md) | #6349 | 补 session start profiler open 方案：JSONL stage timing、敏感信息边界和验证方式。 |
| [daemon-serve-mode/05-workspace-files-and-fs-boundary.md](../../feature/daemon-serve-mode/05-workspace-files-and-fs-boundary.md) | #6370 | 补 ACP-only `/tmp` fallback root 与 `QWEN_ACP_LOCAL_READ_ROOTS` append-only roots。 |
| [daemon-serve-mode/README.md](../../feature/daemon-serve-mode/README.md) | #6394 | 补 Phase 1 single-runtime `WorkspaceRegistry`、daemon-scoped identity 和重复 `--workspace` boot guard。 |
| [file-reading.md](../../feature/file-reading.md) | #6404 | 新增大文本范围读取 open 方案，记录 core/ACP/@file/read_many_files 的读取边界。 |

_日增量按个人 PR 口径更新于 2026-07-07_
