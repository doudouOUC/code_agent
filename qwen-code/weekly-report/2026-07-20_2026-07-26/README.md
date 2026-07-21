# qwen-code PRs · 2026-07-20 ~ 2026-07-26 (W30 周内累计)

> 本文件已整理 2026-07-20 ~ 2026-07-21（Asia/Shanghai）的 @doudouOUC 个人 PR。口径为 `QwenLM/qwen-code` 中 author 为 @doudouOUC 且 createdAt 落在对应北京时间日窗口内的 PR；只在窗口内更新、关闭或合入，但创建时间不在窗口内的 PR 不计入新增统计。

**主题**: Plan mode entry boundary、workspace trust hot reload、SDK SSE request cleanup、lazy telemetry SDK / OTLP protocol split、ACP permission cancellation preservation、final tool response budget、daemon detach attach-ref ledger、exactly-once prompt terminal events

**PR 统计**: 8 PRs - 7 merged / 1 open / 0 closed
**当前已合并 PR 代码量**: +6,766 / -1,397，91 个文件变更
**全量代码量**: +15,960 / -2,447，209 个文件变更
**类型分布**: fix ×6, feat ×1, perf ×1
**范围 (scope)**: core ×2, acp-bridge ×2, serve ×1, sdk ×1, telemetry ×1, cli ×1

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 变更 | 文件 | 创建(UTC) | 合并/关闭(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#7248](https://github.com/QwenLM/qwen-code/pull/7248) | ✅ merged | @doudouOUC | fix(core): Enforce Plan mode entry boundary | +650/-16 | 12 | 07-19 17:06 | 07-20 04:35 |
| [#7268](https://github.com/QwenLM/qwen-code/pull/7268) | 🟡 open | @doudouOUC | feat(serve): Hot-reload workspace trust changes | +9194/-1050 | 118 | 07-20 03:16 | — |
| [#7269](https://github.com/QwenLM/qwen-code/pull/7269) | ✅ merged | @doudouOUC | fix(sdk): clean up SSE requests on errors and dispose | +304/-96 | 3 | 07-20 03:22 | 07-20 06:16 |
| [#7276](https://github.com/QwenLM/qwen-code/pull/7276) | ✅ merged | @doudouOUC | perf(telemetry): lazy-load the SDK and split OTLP exporter chains by protocol | +1774/-672 | 18 | 07-20 03:50 | 07-21 07:35 |
| [#7295](https://github.com/QwenLM/qwen-code/pull/7295) | ✅ merged | @doudouOUC | fix(cli): Preserve cancellation during permission prompts | +326/-26 | 2 | 07-20 06:54 | 07-20 11:07 |
| [#7323](https://github.com/QwenLM/qwen-code/pull/7323) | ✅ merged | @doudouOUC | fix(core): Enforce final tool response budgets | +2628/-425 | 46 | 07-20 09:00 | 07-21 16:10 |
| [#7386](https://github.com/QwenLM/qwen-code/pull/7386) | ✅ merged | @doudouOUC | fix(acp-bridge): make detachClient idempotent via per-clientId attach-ref ledger | +209/-3 | 2 | 07-21 03:46 | 07-21 04:52 |
| [#7400](https://github.com/QwenLM/qwen-code/pull/7400) | ✅ merged | @doudouOUC | fix(acp-bridge): guarantee exactly-once prompt terminal events in daemon serve mode | +875/-159 | 8 | 07-21 07:37 | 07-21 11:49 |

---

## PR 解决问题、实现方式与 feature 处理

| PR | 解决了什么问题 | 最终怎么实现（open 只登记当前观察） | 对应 feature 文档 |
|---|---|---|---|
| [#7248](https://github.com/QwenLM/qwen-code/pull/7248) | `enter_plan_mode` 在同一模型响应里会立即改变 approval mode，但 sibling tool call 仍可能在旧/新边界两侧继续执行；同时成功进入 Plan mode 只回短句，下一轮模型可能看不到完整 Plan 约束。 | 新增 `plan-mode-entry-policy`，在 Core scheduler、ACP 与 headless 路径中把 dedupe 后的第一个 `enter_plan_mode` 作为执行边界，其它 executable siblings 返回 `EXECUTION_DENIED` 并要求下一轮重试；`enter_plan_mode` 成功/幂等返回完整 `getPlanModeSystemReminder()`，并绕过持久化 spill、batch offload 与 per-tool 输出限制。 | 已更新 [permission-system.md](../../feature/permission-system.md)。完整实现见 [implementations/pr-7248.md](implementations/pr-7248.md)。 |
| [#7268](https://github.com/QwenLM/qwen-code/pull/7268) | daemon 只在 runtime 构造时计算 workspace trust，用户/system/default folder、IDE trust 或 `trustedFolders.json` 变化后，settings/env/filesystem/ACP/MCP/extensions/channel/scheduled work 仍可能停留在旧 trust 边界直到重启。 | 当前 open diff 新增 side-effect-free trust policy loader、1s 语义 hash monitor、same-process change trigger、stable `WorkspaceEntry` + immutable `RuntimeGeneration` + one-way generation guard，并由 trust reconciler 在 revoke/grant 时关闭旧 generation、drain、重建 fresh runtime、重挂 ACP/服务；所有 workspace-scoped route 在请求和 commit 边界 recheck generation，transition/failed/blocked 状态 fail-closed，不 fallback primary。新增 `workspace_trust_hot_reload` capability、v2 trust status、SDK 类型/helper 与 Web Shell applying/failed polling。 | 已更新 daemon feature 与 SDK/Web Shell 文档。完整实现见 [implementations/pr-7268.md](implementations/pr-7268.md)。 |
| [#7269](https://github.com/QwenLM/qwen-code/pull/7269) | TS daemon SDK 的 REST SSE 订阅在 iterator early return、consumer throw、stream/connection error 或 `dispose()` 时不一定 abort 底层 fetch/TCP，可能泄漏 daemon EventBus subscriber 或卡住 pending read。 | `RestSseTransport` 为每个 `subscribeEvents()` 请求创建并跟踪 `AbortController`，连接超时、caller signal 与 request controller 组合成 fetch signal；generator `finally` 一律 abort 并移出 active set，`dispose()` 幂等 abort 所有 active SSE 请求。`parseSseStream` 的 cleanup 改为 cancel body stream，并补早退、throw、stream error、connect error、dispose、多订阅 pending read 等单测。 | 已更新 [sdk.md](../../feature/sdk.md) 与 [daemon-serve-mode/10-client-adapters-and-sdk.md](../../feature/daemon-serve-mode/10-client-adapters-and-sdk.md)。完整实现见 [implementations/pr-7269.md](implementations/pr-7269.md)。 |
| [#7276](https://github.com/QwenLM/qwen-code/pull/7276) | 默认 telemetry 关闭时，ACP child 仍静态加载 OpenTelemetry NodeSDK、grpc/protobuf/exporter/instrumentation 约 2MiB 模块；telemetry 开启时 HTTP/gRPC exporter 链也会一起加载，影响 daemon cold start。 | 最终实现把 `telemetry/sdk.ts` 拆成轻量 facade 与 heavy `sdk-impl.ts`，`initializeTelemetry()` 改为 async single-flight dynamic import，disabled path 不加载重依赖；OTLP URL、HTTP exporters、gRPC exporters 分文件并按 protocol 动态加载，outfile 不加载 OTLP。daemon runtime 在初始化 daemon metrics 前显式 await，Config/startup prefetch 走 fire-and-forget。esbuild stub 掉 NodeSDK env-var auto exporter requires，并扩展 bundle guard 防 telemetry/protocol 链回到 ACP static closure。 | 已更新 [telemetry-observability](../../feature/telemetry-observability/) 与 [cli-startup-performance.md](../../feature/cli-startup-performance.md)。完整实现见 [implementations/pr-7276.md](implementations/pr-7276.md)。 |
| [#7295](https://github.com/QwenLM/qwen-code/pull/7295) | ACP session 在权限 prompt、Stop hook 续跑、Plan unknown shell approval 或 background notification 等等待点被父级取消时，旧路径仍可能返回 `end_turn`，并在 abort 中丢掉之前已经恢复的 mid-turn message。 | 新增 `getAbortAwareEndTurnStopReason()`，所有 permission cancel / loop / Stop-hook / background notification terminal path 在返回前检查 parent abort，abort 赢时报告 `cancelled`；pending send 主循环被 abort 立即返回 cancelled。`#preserveStoppedToolRun()` 在 abort 场景中用 `preserveFallbackOnAbort` 保留已 recovered 的 mid-turn message，避免取消响应丢上下文；测试覆盖 Plan shell approval、Stop hook permission、Stop-hook iteration 间 abort 与 background notification 权限等待。 | 已更新 [permission-system.md](../../feature/permission-system.md) 与 [daemon-serve-mode/03-session-lifecycle.md](../../feature/daemon-serve-mode/03-session-lifecycle.md)。完整实现见 [implementations/pr-7295.md](implementations/pr-7295.md)。 |
| [#7323](https://github.com/QwenLM/qwen-code/pull/7323) | Shell/MCP/generic producer 各自截断后，scheduler 看到 truncation marker 就跳过 aggregate budget；多个已截断结果合起来仍可能超出 batch budget。headless、interactive duplicate/synthetic、ACP、Agent、speculation 也都有 scheduler 外的聚合边界，导致发送给模型和录进 transcript 的 tool result 可能不一致。 | 最终实现新增 `ToolResult.persistedOutputFiles` / `ToolCallResponseInfo.persistedOutputFiles` 内部元数据，Shell/MCP/generic producer 返回模型预览和可复用 artifact path；共享 `finalizeToolResponses()` 以 max-min water-fill 给所有 model-facing text slot 分配预算，复用已有 artifact、必要时只持久化一次，最后 no-I/O hard cap 保证不超预算并保护 surrogate pair。Core scheduler 在 `PostToolBatch` 前后 finalize，interactive/headless/ACP/Agent/speculation 在各自最终聚合边界 finalize；`GeminiChat` 发送边界再做 tool-response-only no-I/O guard。成功 `enter_plan_mode` 输出是 lifecycle policy，作为唯一预算豁免。 | 新增 [tool-response-budget.md](../../feature/tool-response-budget.md)，并更新 [context-compression.md](../../feature/context-compression.md) 边界说明。完整实现见 [implementations/pr-7323.md](implementations/pr-7323.md)。 |
| [#7386](https://github.com/QwenLM/qwen-code/pull/7386) | `detachClient` 旧逻辑不区分“真实释放 attach 引用”和重复/未知/匿名/owner detach，任何 detach 都可能偷减全局 `attachCount`，导致 spawn-owner tombstone 或 close-on-last-detach 提前杀掉仍有 live attacher 的 session。 | 在 `SessionEntry` 增加 `attachRefs: Map<clientId, count>`。只有 attach-after-spawn、restore raced/coalesce 等真正贡献 `attachCount` 的注册才 `recordAttachRef()`；`detachClient()` 只有 `releaseAttachRef()` 成功才递减 `attachCount`，同时仍幂等移除 client registration。`rollbackAttachRegistration()` 也按 ledger 释放发起者引用，再扣除未登记 clientId 的 coalesce reservation，保证失败回滚只扣自己贡献。 | 已更新 daemon session lifecycle 与可靠性审计文档。完整实现见 [implementations/pr-7386.md](implementations/pr-7386.md)。 |
| [#7400](https://github.com/QwenLM/qwen-code/pull/7400) | 已返回 202 的 daemon prompt 在 queued remove、deadline、close/kill/crash/shutdown、最后客户端 detach 的 FIFO 交接窗口等路径下可能没有 `turn_complete`/`turn_error`，SDK/WebUI 等按 `promptId` 等待 terminal 的消费者会永久挂起或丢掉已接受工作。 | 在 bridge 内新增 per-prompt `terminalPublished` latch 和统一 `publishPromptTerminal()`，所有 agent settle、queued removal、deadline、teardown flush 都经同一发布点；`deadlineMs` 从 route timer 移入 `BridgeClientRequestContext`，在 admission 点 arm 并参与 dispatch race，超时发布 `turn_error{code:'prompt_deadline_exceeded'}`、释放 FIFO、清 active state 并 best-effort cancel agent。`flushPromptTerminals()` 在 close/kill/channel crash/shutdown 关 bus 前为 active+queued prompt 发布 error terminal；close-on-last-detach/rollback/idle reaper 改看 `pendingPromptCount`，deferred close 在 terminal broadcast 后执行。 | 已更新 daemon session lifecycle、HTTP deadline、能力协议、SDK prompt 结算和可靠性审计文档。完整实现见 [implementations/pr-7400.md](implementations/pr-7400.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [permission-system.md](../../feature/permission-system.md) | #7248 / #7295 | 补 `enter_plan_mode` batch execution boundary、完整 Plan reminder 保护，以及 ACP permission 等待期间父级取消必须保留 `cancelled` stopReason 和 recovered mid-turn message。 |
| [daemon-serve-mode/](../../feature/daemon-serve-mode/) | #7268 / #7295 / #7386 / #7400 | 补 workspace trust hot reload、ACP permission cancellation、attach-ref ledger detach 幂等、prompt terminal exactly-once、bridge-owned prompt deadline 与 close/kill/shutdown terminal flush。 |
| [sdk.md](../../feature/sdk.md) | #7269 / #7268 / #7400 | 补 REST SSE transport 的 active request abort/dispose 语义、trust v2 status、workspace client 行为，以及 `prompt()`/`DaemonSessionClient` 依赖 daemon 按 `promptId` 发布 exactly-once terminal 的结算契约。 |
| [telemetry-observability/](../../feature/telemetry-observability/) | #7276 | 补 telemetry facade/implementation 懒加载、async init、OTLP protocol chain split、bundle guard 和 disabled-path cold start 边界。 |
| [cli-startup-performance.md](../../feature/cli-startup-performance.md) | #7276 | 补 ACP child static closure 的 telemetry cluster 移出与 performance gate。 |
| [tool-response-budget.md](../../feature/tool-response-budget.md) | #7323 | 新增最终工具响应预算专题，覆盖 structured persisted-output metadata、共享 finalizer、runtime aggregation boundaries、record/send 一致性和 Plan mode reminder exception。 |
| [context-compression.md](../../feature/context-compression.md) | #7323 | 补“active tool result history 预算”之外的最终 tool response batch budget，明确它约束当前批次发给模型与录制的 finalized parts。 |

_周内累计按个人 PR 口径更新于 2026-07-21_
