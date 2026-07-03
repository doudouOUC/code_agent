# qwen-code PRs · 2026-06-29 ~ 2026-07-05 (W27 日增量)

> 本文件已整理 2026-06-29、2026-06-30、2026-07-01、2026-07-02 与 2026-07-03（Asia/Shanghai）的 @doudouOUC 个人 PR。2026-07-03 窗口为北京时间 `2026-07-03 00:00:00` ~ `23:59:59`，对应 UTC `2026-07-02T16:00:00Z` ~ `2026-07-03T15:59:59Z`。口径为 `QwenLM/qwen-code` 中 author 为 @doudouOUC 且 createdAt 落在本周窗口内的 PR；只在本周合入、但创建时间不在本周窗口内的 PR 不计入本周统计。

**主题**: subagent output-token display、serve fast-path guard、ChannelAgentBridge、daemon-managed channel worker、session archive、subagent plan lifecycle policy、skills ACP 输出、plan-required teammate approval、whitespace-only diff、worker stderr credential redaction、turn_complete SSE barrier、bridge session listing、skills.disabled status、daemon dashboard、daemon NDJSON perf、daemon status activity

**PR 统计**: 22 PRs - 19 merged / 1 open / 2 closed
**当前已合并 PR 代码量**: +26,207 / -2,799，314 个文件变更
**全量代码量**: +28,173 / -2,840，343 个文件变更
**类型分布**: fix ×11, feat ×11
**范围 (scope)**: cli/serve ×8, channels ×5, core/permissions ×3, daemon/session ×1, ui/background-agent ×1, ACP/file boundary ×1, cli/skills ×1, core/diff ×1, acp-bridge/logging ×1

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 变更 | 文件 | 创建(UTC) | 合并/关闭(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#5972](https://github.com/QwenLM/qwen-code/pull/5972) | ✅ merged | @doudouOUC | fix(ui): display output tokens instead of cumulative API throughput for subagents | +108/-81 | 21 | 06-29 02:09 | 06-29 07:38 |
| [#5977](https://github.com/QwenLM/qwen-code/pull/5977) | ✅ merged | @doudouOUC | fix(standalone): Route serve shim through cli-entry | +157/-5 | 2 | 06-29 03:52 | 06-29 07:10 |
| [#5978](https://github.com/QwenLM/qwen-code/pull/5978) | ✅ merged | @doudouOUC | feat(channels): Add channel agent bridge abstraction | +1661/-274 | 36 | 06-29 03:58 | 06-29 10:42 |
| [#5989](https://github.com/QwenLM/qwen-code/pull/5989) | ✅ merged | @doudouOUC | fix(cli): Avoid ACP runtime preload on serve fast path | +234/-5 | 2 | 06-29 06:40 | 06-29 07:51 |
| [#5995](https://github.com/QwenLM/qwen-code/pull/5995) | ✅ merged | @doudouOUC | fix(cli): Guard serve fast-path bundle closure | +725/-87 | 6 | 06-29 08:23 | 06-29 15:53 |
| [#6013](https://github.com/QwenLM/qwen-code/pull/6013) | ✅ merged | @doudouOUC | fix(cli): Keep serve health responsive before runtime load | +1190/-55 | 8 | 06-29 12:48 | 06-30 10:53 |
| [#6021](https://github.com/QwenLM/qwen-code/pull/6021) | ✅ merged | @doudouOUC | fix(cli): Handle ACP read_file for managed local paths | +1515/-38 | 18 | 06-29 13:57 | 06-30 11:32 |
| [#6026](https://github.com/QwenLM/qwen-code/pull/6026) | ✅ merged | @doudouOUC | fix(core): Allow subagents to exit plan mode | +318/-27 | 2 | 06-29 16:05 | 06-30 04:48 |
| [#6031](https://github.com/QwenLM/qwen-code/pull/6031) | ✅ merged | @doudouOUC | feat(cli): Add daemon-managed channel worker for serve --channel | +5636/-265 | 49 | 06-30 01:55 | 07-01 01:53 |
| [#6058](https://github.com/QwenLM/qwen-code/pull/6058) | ✅ merged | @doudouOUC | feat(daemon): Add session archive support | +5543/-1323 | 41 | 06-30 08:23 | 07-01 08:24 |
| [#6087](https://github.com/QwenLM/qwen-code/pull/6087) | ✅ merged | @doudouOUC | feat(core): Disallow plan lifecycle tools in subagents | +966/-58 | 17 | 06-30 16:10 | 07-01 04:43 |
| [#6098](https://github.com/QwenLM/qwen-code/pull/6098) | ✅ merged | @doudouOUC | feat(cli): Harden daemon-managed channel worker | +2541/-238 | 15 | 07-01 03:24 | 07-01 13:29 |
| [#6117](https://github.com/QwenLM/qwen-code/pull/6117) | ✅ merged | @doudouOUC | feat(cli): show description and level in /skills ACP output | +194/-99 | 6 | 07-01 09:23 | 07-01 20:12 |
| [#6138](https://github.com/QwenLM/qwen-code/pull/6138) | ✅ merged | @doudouOUC | feat(core): Add leader approval for plan-required teammates | +3212/-118 | 43 | 07-01 15:00 | 07-01 23:46 |
| [#6141](https://github.com/QwenLM/qwen-code/pull/6141) | ✅ merged | @doudouOUC | fix(diff): show whitespace-only edits instead of 'No changes detected' | +174/-61 | 8 | 07-01 15:56 | 07-01 20:14 |
| [#6146](https://github.com/QwenLM/qwen-code/pull/6146) | ✅ merged | @doudouOUC | feat(cli): add credential redaction for worker stderr forwarding | +432/-6 | 7 | 07-01 23:39 | 07-02 12:55 |
| [#6165](https://github.com/QwenLM/qwen-code/pull/6165) | ✅ merged | @doudouOUC | fix(channels): replace setTimeout(0) drain with turn_complete SSE barrier | +128/-11 | 2 | 07-02 05:34 | 07-02 08:59 |
| [#6182](https://github.com/QwenLM/qwen-code/pull/6182) | ✅ merged | @doudouOUC | feat(channels): add listSessions to ChannelAgentBridge | +264/-0 | 6 | 07-02 09:43 | 07-02 10:49 |
| [#6233](https://github.com/QwenLM/qwen-code/pull/6233) | ❌ closed | @doudouOUC | fix(serve): surface skills.disabled user setting in /workspace/skills endpoint | +86/-8 | 10 | 07-03 05:56 | 07-03 12:17 |
| [#6253](https://github.com/QwenLM/qwen-code/pull/6253) | ❌ closed | @doudouOUC | feat(serve): Add daemon status dashboard | +1766/-32 | 15 | 07-03 08:24 | 07-03 12:07 |
| [#6263](https://github.com/QwenLM/qwen-code/pull/6263) | ✅ merged | @doudouOUC | fix(serve): Optimize daemon NDJSON stream handling | +1209/-48 | 25 | 07-03 11:29 | 07-03 15:27 |
| [#6270](https://github.com/QwenLM/qwen-code/pull/6270) | 🟡 open | @doudouOUC | feat(serve): Add runtime.activity fields to daemon status API | +114/-1 | 4 | 07-03 12:38 | open |

---

## PR 解决问题、实现方式与 feature 处理

| PR | 解决了什么问题 | 最终怎么实现（open 只登记当前观察） | 对应 feature 文档 |
|---|---|---|---|
| [#5972](https://github.com/QwenLM/qwen-code/pull/5972) | subagent/background agent token 展示改为 output tokens，避免把 API 吞吐量显示成百万 token。 | CLI/web-shell/webui 多个 agent card/status 面统一读 `outputTokens`，旧 payload fallback 到 `totalTokens`。 | 已补 [background-agent-resume.md](../../feature/background-agent-resume.md) 与 WebUI 文档。 |
| [#5977](https://github.com/QwenLM/qwen-code/pull/5977) | standalone 包中的 `qwen serve` 走 `cli-entry.js` fast path。 | 打包脚本让 serve shim 调 `lib/cli-entry.js`，非 serve 保持 `node --expose-gc lib/cli.js`，并跳过 npm-only artifacts。 | 已补 [daemon-serve-mode/README.md](../../feature/daemon-serve-mode/README.md)。 |
| [#5978](https://github.com/QwenLM/qwen-code/pull/5978) | 引入 adapter-facing `ChannelAgentBridge` 抽象。 | adapters/router/channel start 依赖窄 bridge contract；`AcpBridge` 继续作为 standalone 实现，并修 session cleanup、restore/create race 和 bridge swap listener。 | 已补 [channel-adapters.md](../../feature/channel-adapters.md)。 |
| [#5989](https://github.com/QwenLM/qwen-code/pull/5989) | 防止 serve fast path 静态拉入 ACP runtime。 | request helper 改用轻量子路径，新增 source import graph 与 bundle metafile 静态闭包回归测试。 | 已补 [daemon-serve-mode/README.md](../../feature/daemon-serve-mode/README.md)。 |
| [#5995](https://github.com/QwenLM/qwen-code/pull/5995) | serve fast path 增加 bundle-level guard。 | 将真实 esbuild metafile 静态 reachability 检查移到显式 CI script，禁止 ACP/core/vendor 静态闭包进入 pre-listen path。 | 已补 [daemon-serve-mode/README.md](../../feature/daemon-serve-mode/README.md)。 |
| [#6013](https://github.com/QwenLM/qwen-code/pull/6013) | `qwen serve` 虽然已先监听，但首个 `/health` 仍可能被 runtime import/evaluation 与 YOLO 警告阻塞。 | `run-qwen-serve.ts` 在 fast path flush 首个 bootstrap health 后再启动重 runtime，并加 fallback timer；headless warning 只依赖轻量判断，新增 fast-path open/runtime startup error 测试覆盖。 | 已补 [daemon-serve-mode/README.md](../../feature/daemon-serve-mode/README.md)。 |
| [#6021](https://github.com/QwenLM/qwen-code/pull/6021) | serve/ACP 下 `read_file` 读取 skill、临时输出、subagent transcript、自动 memory、extension 等 managed local roots 时会被 workspace FS 误拒，并把结构化错误显示成 `[object Object]`。 | ACP filesystem service 在 workspace boundary 拒绝后，对 read-only 且命中受管本地根的路径 fallback 到 local FS；read/edit/write 工具统一错误 message normalization。 | 已补 [daemon-serve-mode/05-workspace-files-and-fs-boundary.md](../../feature/daemon-serve-mode/05-workspace-files-and-fs-boundary.md)。 |
| [#6026](https://github.com/QwenLM/qwen-code/pull/6026) | subagent 继承 plan mode 后，即使 `exit_plan_mode` 成功也无法真正离开 plan mode。 | `createApprovalModeOverride` 改为持有可变 approval mode 与 plan gate state；AUTO dangerous-rule denial tracking 在子 config 内隔离并按实际 mode 生命周期恢复。 | 已补 [permission-system.md](../../feature/permission-system.md)。 |
| [#6031](https://github.com/QwenLM/qwen-code/pull/6031) | `qwen serve --channel` 缺少由 daemon 托管 channel worker 的路径，standalone `qwen channel start` 与 daemon 会话生命周期分离。 | `serve` 接受 repeatable `--channel` / `--channel all`，runtime ready 后由 `channel-worker-supervisor.ts` fork internal `channel daemon-worker`；worker 通过 TS SDK 和 `DaemonChannelBridge` 回连 daemon，强制 thread-scoped session，pidfile/status/stop 记录 serve ownership 与 worker pid。 | 已补 [channel-adapters.md](../../feature/channel-adapters.md) 与 [daemon-serve-mode/README.md](../../feature/daemon-serve-mode/README.md)。 |
| [#6058](https://github.com/QwenLM/qwen-code/pull/6058) | daemon 需要 archive/unarchive session，把旧会话移出 active 列表但不删除 transcript。 | 以 `chats/` vs `chats/archive/` 的 JSONL 位置表达 active/archived；新增 REST、ACP vendor methods、HTTP-over-ACP、capability、SDK types/client，拒绝 archived load/resume，并用 `SessionArchiveCoordinator` 串行化 archive/delete/load/prompt 竞态。 | 已补 [daemon-serve-mode/03-session-lifecycle.md](../../feature/daemon-serve-mode/03-session-lifecycle.md) 与 [daemon-serve-mode/README.md](../../feature/daemon-serve-mode/README.md)。 |
| [#6087](https://github.com/QwenLM/qwen-code/pull/6087) | subagent/team agent 仍可能调用 `enter_plan_mode` / `exit_plan_mode`，打断父会话的 plan 生命周期或伪造已获主用户批准的状态。 | 新增 `subagent-plan-tool-policy.ts`，在 AgentCore、WorkflowOrchestrator、tool-search、Enter/ExitPlanModeTool 和 CoreToolScheduler 多层阻断 plan lifecycle tools；scheduler 在 plan-mode 阻塞时对 subagent/SDK 返回“直接交回计划”的 reminder。 | 已补 [permission-system.md](../../feature/permission-system.md)。 |
| [#6098](https://github.com/QwenLM/qwen-code/pull/6098) | daemon-managed channel worker 需要生产级稳定性：异常退出、无心跳、日志泄密、pidfile stale 和部分 channel 连接都需可诊断。 | supervisor 增加 ready 后重启策略（5 分钟窗口 3 次，1s/5s/15s backoff）、15s heartbeat/45s stale kill、stdout/stderr 脱敏与有界 buffer、snapshot error redaction、partial-connect issue、pidfile workerPid 清理和永久失败升级。 | 已补 [daemon-serve-mode/README.md](../../feature/daemon-serve-mode/README.md)；也复核 [channel-adapters.md](../../feature/channel-adapters.md)。 |
| [#6117](https://github.com/QwenLM/qwen-code/pull/6117) | ACP/non-interactive 下 `/skills` 只能回退到简陋列表，缺少 description 和 level；interactive 与 ACP 行为也容易漂移。 | `/skills` 在 interactive 仍打开 dialog；ACP/non-interactive 返回只读列表，按 priority/name 排序，过滤 disabled / non-user-invocable skill，显示 description 与本地化 level；`levelLabel()` 被 dialog/list 共享。 | 已补 [diagnostic-skills.md](../../feature/diagnostic-skills.md) 的命令/技能注册输出口径。 |
| [#6138](https://github.com/QwenLM/qwen-code/pull/6138) | 计划型 teammate 需要先提交 plan 给 leader 批准，否则 team agent 可以在 plan mode 下直接执行。 | 新增 `plan_mode_required` agent 参数、`team_plan_approval` leader-only tool、TeamManager pending approval map、teammate plan envelope、pre-approval tool gate；teammate 只允许 `exit_plan_mode` 和 claim-only `task_update`，批准后按 leader 当前安全 mode 恢复。 | 已补 [permission-system.md](../../feature/permission-system.md) 的 team plan approval。 |
| [#6141](https://github.com/QwenLM/qwen-code/pull/6141) | edit/write/shell 等工具对 whitespace-only 改动使用 `ignoreWhitespace:true` 生成 diff 时会显示 “No changes detected”。 | 抽出 `createPatchSmart` / `structuredPatchSmart`：先用默认 ignoreWhitespace 生成干净 diff，若无 hunk 则 fallback 到 `ignoreWhitespace:false`；edit/notebook/write/shell/modifiable diff 统一走该 helper。 | 作为 core diff 工具修复登记在本周实现文档。 |
| [#6146](https://github.com/QwenLM/qwen-code/pull/6146) | worker stderr 透传路径可能把 bearer token、API key、proxy credential、secret env 等敏感值写入 daemon stderr 或日志。 | 新增 `redactLogCredentials()`，覆盖 Bearer/QQBot/Authorization/API key/env secret/JSON secret/URL credential/DingTalk token 等模式；ACP child stderr forwarder 和 daemon channel worker stderr pipe 均逐行脱敏、64 KiB 有界截断，并把安全行回调给 daemon log。 | 已补 [daemon-serve-mode/README.md](../../feature/daemon-serve-mode/README.md) 与 channel worker hardening 说明。 |
| [#6165](https://github.com/QwenLM/qwen-code/pull/6165) | `DaemonChannelBridge.prompt()` 依赖 `setTimeout(0)` 等待 late SSE chunk，存在时序猜测。 | `DaemonChannelBridge` 增加 per-session turn barrier；`turn_complete` 解析为确定性完成屏障，`turn_error` 先记录协议错误再释放屏障；drop/cancel/stop 都先 resolve，避免 prompt 等待泄漏；非 SSE prompt 路径仍保留 one-tick fallback。 | 已补 [channel-adapters.md](../../feature/channel-adapters.md)。 |
| [#6182](https://github.com/QwenLM/qwen-code/pull/6182) | channel adapter/诊断工具无法枚举 bridge 当前附着的 daemon sessions。 | `ChannelAgentBridge` 增加 optional `listSessions()` 与 `BridgeSessionInfo`；`DaemonChannelBridge` 从内部 `sessions` map 和 `activePrompts` set 返回快照；daemon-worker facade 在 bridge 支持时透传该方法。 | 已补 [channel-adapters.md](../../feature/channel-adapters.md)。 |
| [#6233](https://github.com/QwenLM/qwen-code/pull/6233) | `/workspace/skills` 没有把用户 `skills.disabled` 设置透给客户端，禁用 skill 仍会出现在 Web Shell 和 webui 命令列表。 | workspace skill wire type 增加 optional `disabled`；status mapper 命中 disabled names 时输出 `status: disabled` 与 `disabled: true`；Web Shell、webui mapper 和 hook 过滤 disabled skill。 | 已补 [diagnostic-skills.md](../../feature/diagnostic-skills.md) 与实现文档；closed 未合入。 |
| [#6253](https://github.com/QwenLM/qwen-code/pull/6253) | daemon status JSON 缺少可直接打开的可视化排障入口，Web Shell 内也没有 status dashboard。 | 新增 standalone `/dashboard` inline HTML 页面和 Web Shell `DashboardDialog`；页面消费 `/daemon/status`，支持 Summary/Full、自动刷新、bearer token；路由继承 `/demo` 的 loopback/pre-auth 与非 loopback bearer 策略，并加 CSP/XFO。 | 已补 [daemon-serve-mode/README.md](../../feature/daemon-serve-mode/README.md)；closed 未合入。 |
| [#6263](https://github.com/QwenLM/qwen-code/pull/6263) | daemon/ACP child NDJSON stdio receive path 对跨 chunk 大消息可能做重复 whole-buffer split，且缺少 event-loop lag 与 pipe payload size 观测。 | `@qwen-code/acp-bridge` 新增 incremental `ndJsonStream`；daemon child 路径使用本地 stream 和 byte hooks，非 daemon 保持 SDK stream；daemon 与 ACP child 启动 event-loop lag monitor，OTel 暴露 daemon/acp lag gauge 与 daemon pipe histogram，`/daemon/status` 增加 optional `runtime.perf`。 | 已补 [daemon-serve-mode/README.md](../../feature/daemon-serve-mode/README.md) 与 telemetry/observability 说明。 |
| [#6270](https://github.com/QwenLM/qwen-code/pull/6270) | `/daemon/status` 缺少 active prompt、last activity 与 idle duration；full workspace status 的 MCP summary 也缺少 server health 聚合。 | `runtime.activity` 增加 `activePrompts`、`lastActivityAt`、`idleSinceMs`，bootstrap status 返回稳定默认值；MCP section summary 统计 connected/errored/disabled servers。 | 已补 [daemon-serve-mode/README.md](../../feature/daemon-serve-mode/README.md)；open 当前观察。 |

## PR 对应 feature 覆盖

| feature 文档 | 本日新增/复核 PR | 文档动作 |
|---|---|---|
| [background-agent-resume.md](../../feature/background-agent-resume.md) | #5972 | 补 subagent output-token 展示口径。 |
| [daemon-serve-mode/README.md](../../feature/daemon-serve-mode/README.md) | #5977 #5989 #5995 #6013 #6031 #6058 #6098 #6146 | 补 standalone serve shim、serve fast-path source/bundle guard、首个 `/health` 前 runtime defer、daemon channel worker、session archive、worker hardening 和 stderr credential redaction。 |
| [daemon-serve-mode/03-session-lifecycle.md](../../feature/daemon-serve-mode/03-session-lifecycle.md) | #6058 | 补 active/archive JSONL 状态、archive/unarchive 路由和竞态门控。 |
| [daemon-serve-mode/05-workspace-files-and-fs-boundary.md](../../feature/daemon-serve-mode/05-workspace-files-and-fs-boundary.md) | #6021 | 补 ACP managed local read fallback 与结构化错误渲染边界。 |
| [channel-adapters.md](../../feature/channel-adapters.md) | #5978 #6031 #6098 #6165 #6182 | #5978 落地 `ChannelAgentBridge`；#6031 落地 daemon-managed worker；#6098 补 worker hardening；#6165 补 turn_complete prompt barrier；#6182 补 bridge session listing。 |
| [permission-system.md](../../feature/permission-system.md) | #6026 #6087 #6138 | 补 subagent approval-mode override、plan lifecycle tool 阻断与 plan-required teammate leader approval。 |
| [diagnostic-skills.md](../../feature/diagnostic-skills.md) | #6117 #6233 | 补 `/skills` ACP/non-interactive 输出 description 与 level 的口径；#6233 记录 `/workspace/skills` disabled wire/filtering 方案（closed 未合入）。 |
| [telemetry-observability/README.md](../../feature/telemetry-observability/README.md) | #6263 | 补 daemon/ACP event-loop lag gauge 与 daemon pipe message byte histogram。 |

_日增量按个人 PR 口径更新于 2026-07-04_
