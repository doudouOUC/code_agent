# qwen-code PRs · 2026-06-29 ~ 2026-07-05 (W27 日增量)

> 本文件已整理 2026-06-29 与 2026-06-30（Asia/Shanghai）的 @doudouOUC 个人 PR。2026-06-30 窗口为北京时间 `2026-06-30 00:00:00` ~ `23:59:59`，对应 UTC `2026-06-29T16:00:00Z` ~ `2026-06-30T15:59:59Z`。口径为 `QwenLM/qwen-code` 中由 @doudouOUC 创建、更新、关闭或合入的 PR；open PR 只登记观察，不按已落地实现写入 feature 正文。

**主题**: telemetry 文档/schema 对齐、subagent output-token display、serve fast-path guard、ChannelAgentBridge、subagent plan-mode override、ACP managed local path read_file、daemon channel worker / session archive 观察

**PR 统计**: 11 PRs — 9 merged / 2 open / 0 closed
**当前已合并 PR 代码量**: +6,300 / -737，104 个文件变更
**全量代码量**: +13,893 / -1,237，184 个文件变更
**类型分布**: fix ×7, feat ×3, docs ×1
**范围 (scope)**: cli/serve ×6, daemon/session ×1, channels ×2, telemetry ×1, ui/background-agent ×1, ACP/file boundary ×1, core/permissions ×1

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 变更 | 文件 | 创建(UTC) | 合并/关闭(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#5960](https://github.com/QwenLM/qwen-code/pull/5960) | ✅ merged | @doudouOUC | docs(telemetry): comprehensive documentation update to match current implementation | +392/-165 | 9 | 06-28 12:46 | 06-28 21:10 |
| [#5972](https://github.com/QwenLM/qwen-code/pull/5972) | ✅ merged | @doudouOUC | fix(ui): display output tokens instead of cumulative API throughput for subagents | +108/-81 | 21 | 06-29 02:09 | 06-29 07:38 |
| [#5977](https://github.com/QwenLM/qwen-code/pull/5977) | ✅ merged | @doudouOUC | fix(standalone): Route serve shim through cli-entry | +157/-5 | 2 | 06-29 03:52 | 06-29 07:10 |
| [#5978](https://github.com/QwenLM/qwen-code/pull/5978) | ✅ merged | @doudouOUC | feat(channels): Add channel agent bridge abstraction | +1661/-274 | 36 | 06-29 03:58 | 06-29 10:42 |
| [#5989](https://github.com/QwenLM/qwen-code/pull/5989) | ✅ merged | @doudouOUC | fix(cli): Avoid ACP runtime preload on serve fast path | +234/-5 | 2 | 06-29 06:40 | 06-29 07:51 |
| [#5995](https://github.com/QwenLM/qwen-code/pull/5995) | ✅ merged | @doudouOUC | fix(cli): Guard serve fast-path bundle closure | +725/-87 | 6 | 06-29 08:23 | 06-29 15:53 |
| [#6013](https://github.com/QwenLM/qwen-code/pull/6013) | ✅ merged | @doudouOUC | fix(cli): Keep serve health responsive before runtime load | +1190/-55 | 8 | 06-29 12:48 | 06-30 10:53 |
| [#6021](https://github.com/QwenLM/qwen-code/pull/6021) | ✅ merged | @doudouOUC | fix(cli): Handle ACP read_file for managed local paths | +1515/-38 | 18 | 06-29 13:57 | 06-30 11:32 |
| [#6026](https://github.com/QwenLM/qwen-code/pull/6026) | ✅ merged | @doudouOUC | fix(core): Allow subagents to exit plan mode | +318/-27 | 2 | 06-29 16:05 | 06-30 04:48 |
| [#6031](https://github.com/QwenLM/qwen-code/pull/6031) | 🟡 open | @doudouOUC | feat(cli): Add daemon-managed channel worker for serve --channel | +4389/-252 | 46 | 06-30 01:55 | - |
| [#6058](https://github.com/QwenLM/qwen-code/pull/6058) | 🟡 open | @doudouOUC | feat(daemon): Add session archive support | +3204/-248 | 34 | 06-30 08:23 | - |

---

## PR 解决问题、实现方式与 feature 处理

| PR | 解决了什么问题 | 怎么做的（open/closed 只登记当前观察） | 对应 feature 文档 |
|---|---|---|---|
| [#5960](https://github.com/QwenLM/qwen-code/pull/5960) | telemetry 文档/schema 与当前实现重新对齐。 | 刷新 developer docs、telemetry constants/loggers 与相关测试，修正 `qwen-code.tool_output_truncated` 事件命名。 | 已在上周补 [telemetry-observability/](../../feature/telemetry-observability/)，本轮只登记。 |
| [#5972](https://github.com/QwenLM/qwen-code/pull/5972) | subagent/background agent token 展示改为 output tokens，避免把 API 吞吐量显示成百万 token。 | CLI/web-shell/webui 多个 agent card/status 面统一读 `outputTokens`，旧 payload fallback 到 `totalTokens`。 | 已补 [background-agent-resume.md](../../feature/background-agent-resume.md) 与 WebUI 文档。 |
| [#5977](https://github.com/QwenLM/qwen-code/pull/5977) | standalone 包中的 `qwen serve` 走 `cli-entry.js` fast path。 | 打包脚本让 serve shim 调 `lib/cli-entry.js`，非 serve 保持 `node --expose-gc lib/cli.js`，并跳过 npm-only artifacts。 | 已补 [daemon-serve-mode/README.md](../../feature/daemon-serve-mode/README.md)。 |
| [#5978](https://github.com/QwenLM/qwen-code/pull/5978) | 引入 adapter-facing `ChannelAgentBridge` 抽象。 | adapters/router/channel start 依赖窄 bridge contract；`AcpBridge` 继续作为 standalone 实现，并修 session cleanup、restore/create race 和 bridge swap listener。 | 已补 [channel-adapters.md](../../feature/channel-adapters.md)。 |
| [#5989](https://github.com/QwenLM/qwen-code/pull/5989) | 防止 serve fast path 静态拉入 ACP runtime。 | request helper 改用轻量子路径，新增 source import graph 与 bundle metafile 静态闭包回归测试。 | 已补 [daemon-serve-mode/README.md](../../feature/daemon-serve-mode/README.md)。 |
| [#5995](https://github.com/QwenLM/qwen-code/pull/5995) | serve fast path 增加 bundle-level guard。 | 将真实 esbuild metafile 静态 reachability 检查移到显式 CI script，禁止 ACP/core/vendor 静态闭包进入 pre-listen path。 | 已补 [daemon-serve-mode/README.md](../../feature/daemon-serve-mode/README.md)。 |
| [#6013](https://github.com/QwenLM/qwen-code/pull/6013) | `qwen serve` 虽然已先监听，但首个 `/health` 仍可能被 runtime import/evaluation 与 YOLO 警告阻塞。 | `run-qwen-serve.ts` 在 fast path flush 首个 bootstrap health 后再启动重 runtime，并加 fallback timer；headless warning 只依赖轻量判断，新增 fast-path open/runtime startup error 测试覆盖。 | 已补 [daemon-serve-mode/README.md](../../feature/daemon-serve-mode/README.md)。 |
| [#6021](https://github.com/QwenLM/qwen-code/pull/6021) | serve/ACP 下 `read_file` 读取 skill、临时输出、subagent transcript、自动 memory、extension 等 managed local roots 时会被 workspace FS 误拒，并把结构化错误显示成 `[object Object]`。 | ACP filesystem service 在 workspace boundary 拒绝后，对 read-only 且命中受管本地根的路径 fallback 到 local FS；read/edit/write 工具统一错误 message normalization，相关 fileUtils/errors/package-script 测试覆盖。 | 已补 [daemon-serve-mode/05-workspace-files-and-fs-boundary.md](../../feature/daemon-serve-mode/05-workspace-files-and-fs-boundary.md)。 |
| [#6026](https://github.com/QwenLM/qwen-code/pull/6026) | subagent 继承 plan mode 后，即使 `exit_plan_mode` 成功也无法真正离开 plan mode；AUTO 危险规则清理还依赖初始 mode，容易在子 config 中残留或误恢复。 | `createApprovalModeOverride` 改为持有可变 approval mode 与 plan gate state，`getApprovalMode` 读取当前值；AUTO dangerous-rule denial tracking 在子 config 内隔离，并按进入/退出 AUTO 的实际状态恢复共享 PermissionManager。 | 已补 [permission-system.md](../../feature/permission-system.md)。 |
| [#6031](https://github.com/QwenLM/qwen-code/pull/6031) | open：为 `qwen serve --channel` 增加 daemon-managed channel worker。 | 计划让 serve 接受 repeatable `--channel` / `--channel all`，runtime ready 后拉起 serve-owned channel worker，经 TS SDK 和 `DaemonChannelBridge` 回连 daemon；同时给 pidfile/status/stop 增加 ownership 元数据。 | open，若合入归 [channel-adapters.md](../../feature/channel-adapters.md) 与 daemon channel worker 文档。 |
| [#6058](https://github.com/QwenLM/qwen-code/pull/6058) | open：daemon session archive。 | 计划以 JSONL 所在 active/archive 目录表达状态，支持 archive/unarchive/list/delete，并通过 REST、ACP vendor methods、HTTP-over-ACP、capabilities 和 TS SDK 暴露。 | open，若合入归 [daemon-serve-mode/03-session-lifecycle.md](../../feature/daemon-serve-mode/03-session-lifecycle.md) 与 SDK 文档。 |

## PR 对应 feature 覆盖

| feature 文档 | 本日新增/复核 PR | 文档动作 |
|---|---|---|
| [telemetry-observability/](../../feature/telemetry-observability/) | #5960 | 复核 telemetry 文档/schema 与当前实现对齐，周报按个人 PR 口径登记。 |
| [background-agent-resume.md](../../feature/background-agent-resume.md) | #5972 | 补 subagent output-token 展示口径。 |
| [daemon-serve-mode/README.md](../../feature/daemon-serve-mode/README.md) | #5977 #5989 #5995 #6013 | 补 standalone serve shim 走 `cli-entry.js`、serve fast-path source/import guard、bundle closure guard 和首个 `/health` 响应前 runtime defer。 |
| [daemon-serve-mode/05-workspace-files-and-fs-boundary.md](../../feature/daemon-serve-mode/05-workspace-files-and-fs-boundary.md) | #6021 | 补 ACP managed local read fallback 与结构化错误渲染边界。 |
| [channel-adapters.md](../../feature/channel-adapters.md) | #5978 #6031 | #5978 已落地 `ChannelAgentBridge`；#6031 open，仅登记 daemon-managed worker 归属。 |
| [permission-system.md](../../feature/permission-system.md) | #6026 | 补 subagent approval-mode override 可变状态和 AUTO cleanup 边界。 |
| open 观察 | #6031 #6058 | 仅登记后续归属；合入后再写入 daemon channel worker / session archive 正文。 |

_日增量按个人 PR 口径更新于 2026-07-01_
