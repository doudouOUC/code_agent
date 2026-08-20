# qwen-code PRs · 2026-08-17 ~ 2026-08-23 (W34 周内累计)

> 本文件已整理 2026-08-17 至 2026-08-23（Asia/Shanghai）创建的 @doudouOUC 个人 PR。口径为 `QwenLM/qwen-code` 中 author 为 @doudouOUC 且 createdAt 落在对应北京时间日/周窗口内的 PR；只在窗口内更新、关闭或合入，但创建时间不在窗口内的 PR 不计入新增统计。open PR 只记录当前 diff 方案，不能视为 `main` 已落地能力。

**主题**: standalone conversation source/identity/admission primitives、workspace session live-state endpoint/WebShell consumption/activity watermark、ACP child peak old-generation heap measurement、Conversations runtime owner/discovery transient I/O retryability、duplicate provider tool-call id visible loop stop 与 argument-aware replay detection

**PR 统计**: 8 PRs - 7 merged / 1 open / 0 closed
**当前已合并 PR 代码量**: +8,591 / -382，73 个文件变更
**全量代码量**: +13,402 / -766，105 个文件变更
**类型分布**: feat ×5, fix ×3
**范围 (scope)**: serve/conversations ×4, web-shell/session-catalog ×2, core/tool-call loop guard ×2, resource/status ×1, sdk/protocol docs ×2, docs/design ×4

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 代码量 | 文件数 | 创建时间(UTC) | 合并/关闭时间(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#9341](https://github.com/QwenLM/qwen-code/pull/9341) | 🟡 open | @doudouOUC | feat(cli): Add standalone conversation isolation primitives | +4811/-384 | 32 | 08-17 07:47 | — |
| [#9362](https://github.com/QwenLM/qwen-code/pull/9362) | ✅ merged | @doudouOUC | fix(cli): Keep transient runtime record I/O retryable | +148/-7 | 3 | 08-17 15:14 | 08-17 16:56 |
| [#9366](https://github.com/QwenLM/qwen-code/pull/9366) | ✅ merged | @doudouOUC | feat(web-shell): Consume workspace session live-state | +2220/-117 | 10 | 08-17 17:03 | 08-18 06:53 |
| [#9380](https://github.com/QwenLM/qwen-code/pull/9380) | ✅ merged | @doudouOUC | feat(serve): measure ACP child peak old-generation heap | +1518/-3 | 11 | 08-18 02:51 | 08-19 05:00 |
| [#9396](https://github.com/QwenLM/qwen-code/pull/9396) | ✅ merged | @doudouOUC | feat(serve): Add live-state session activity watermark | +2451/-55 | 15 | 08-18 07:40 | 08-19 03:32 |
| [#9435](https://github.com/QwenLM/qwen-code/pull/9435) | ✅ merged | @doudouOUC | fix(cli): surface the daemon duplicate tool-call breaker as a visible loop-detected stop | +238/-26 | 3 | 08-18 23:55 | 08-19 07:14 |
| [#9436](https://github.com/QwenLM/qwen-code/pull/9436) | ✅ merged | @doudouOUC | fix(core): treat duplicate provider tool-call ids as replays only when arguments match | +1231/-147 | 21 | 08-18 23:55 | 08-19 12:03 |
| [#9476](https://github.com/QwenLM/qwen-code/pull/9476) | ✅ merged | @doudouOUC | feat(web-shell): Consume live-state session activity timestamps | +785/-27 | 10 | 08-19 11:44 | 08-19 15:03 |

---

## PR 解决问题、实现方式与 feature 处理

| PR | 解决了什么问题 | 最终怎么实现（open/closed 只登记当前观察） | 对应 feature 文档 |
|---|---|---|---|
| [#9341](https://github.com/QwenLM/qwen-code/pull/9341) | standalone session lifecycle 落地前，需要可信地区分 explicit standalone、兼容 legacy projectless 与 Live transcript；旧的空 metadata / 容忍 JSONL 读取 / 非权威大小写查找可能把损坏 Live 或 child transcript 提升为 standalone，并绑定错误 private directory。 | 当前 open diff 交付 PR2A primitives：新增 standalone source 常量与分类器、只在 active/archive location 稳定且 creation metadata 完整时分类；generic REST/ACP creation 拒绝保留 source；load/resume 先做大小写不敏感持久化 ID 权威解析，case-only duplicate 转 typed conflict；`readCreationMetadataIfReadable()` 用完整性读取区分 clean legacy 与损坏头部；新增 Conversations root/private child identity 校验和 prepare/inspect/ensure API，并补 dispatch-error/session-archive 的 canonical lock/error 映射；最新 diff 继续收紧 config/transport/session service 测试面。 | 已在 daemon session lifecycle、capabilities/protocol 与 daemon 总览登记为 open diff，不新增 public standalone route、capability、SDK 或 UI。完整观察见 [implementations/pr-9341.md](implementations/pr-9341.md)。 |
| [#9362](https://github.com/QwenLM/qwen-code/pull/9362) | #9181 的 owner/discovery 安全读取把所有 open/read 失败都当作持久化损坏；一次 `EMFILE` 或 `EIO` 会在 daemon 生命周期内锁死 `conversation_runtime_ownership_compromised`，必须重启才恢复。 | 最终实现只把瞬时 I/O 与终态损坏分开：owner record 和 Live discovery 读取中，`ELOOP`、identity/permission/schema/JSON 损坏继续映射为 terminal compromised；非 `ELOOP` 的 open/readFile 错误向外抛出，由 acquisition 映射为 retryable `conversation_runtime_unavailable`，后续重试可重新 reclaim。 | 已在 daemon session lifecycle 中登记为 #9181 merged 后续，并在 capabilities/protocol 口径说明不改变公开 API。完整实现见 [implementations/pr-9362.md](implementations/pr-9362.md)。 |
| [#9366](https://github.com/QwenLM/qwen-code/pull/9366) | WebShell sidebar 把完整 persisted session catalog 当作两秒 live status poll，多个消费者会重复扫描大型 store 并可能把未 fencing 的 catalog/group 结果发布到 UI。 | 最终实现让 capability-enabled workspace 先走 `workspace_session_live_state`：首次或版本变更时用 `live A -> catalog/groups -> live B` 暂存并提交完整 bundle，稳态每 2 秒只 poll live-state；失败退避、显式刷新立即唤醒、legacy daemon 保留原 catalog path。 | 已在 WebUI/transport、daemon lifecycle/protocol 与 daemon 总览登记为 #9261 的 merged WebShell consumer。完整实现见 [implementations/pr-9366.md](implementations/pr-9366.md)。 |
| [#9380](https://github.com/QwenLM/qwen-code/pull/9380) | #8508 已建模 per-child heap partition，但没有真实 workload 的 old-generation 峰值数据；RSS/heapUsed/refusal count 都不能判断未来 enforcement 是否会误杀健康 ACP child。 | 最终实现是在 daemon-spawned ACP child 内安装 `ChildHeapProbe`，每 5 秒随既有 child resource poll 上报 old-generation committed/live-set/total-heap 高水位、major GC 次数/耗时和未归类 space 名称；daemon status 对多个 child 取独立最大值，未采样时返回 `heap:null`，不改 spawn argv 或 enforcement。 | 已在 resource budgeting、capabilities/protocol、SDK 与 daemon 总览登记为 observe-only merged status 字段。完整实现见 [implementations/pr-9380.md](implementations/pr-9380.md)。 |
| [#9396](https://github.com/QwenLM/qwen-code/pull/9396) | live-state 只携带 volatile active/waiting/clientCount，turn 完成后的 recency 仍要靠 WebShell 安排 catalog reconcile；普通活动若推进 catalog version 又会重新触发全量扫描。 | 最终实现是在 bridge 内为达到 running 的 prompt 正式终态推进严格单调 `updatedAt`，由 live-state 返回；workspace session list 取 live watermark 与 persisted mtime 的较晚有效值，普通 turn 活动不改变 `generation+revision`，SDK/protocol 只新增 optional 字段。 | 已在 session lifecycle、capabilities/protocol、WebUI/transport 与 SDK 口径登记为 #9261/#9366 后续 merged watermark；#9476 已继续落地 WebShell consumer。完整实现见 [implementations/pr-9396.md](implementations/pr-9396.md)。 |
| [#9435](https://github.com/QwenLM/qwen-code/pull/9435) | daemon ACP session 遇到重复 provider tool-call id 的 circuit breaker 时，原先只做内部 stop/drop，前台用户看不到标准 loop-detected 终态，也缺少与非交互 CLI 一致的 telemetry/error kind。 | 最终实现移除 bespoke `repeatedDuplicateProviderToolCall` 结果字段，改走既有 `loopDetected` 管道；ACP foreground prompt 发布 visible `loop_detected` turn error，携带 `global_tool_call_duplicate` loop type，并保留未发送 history 中的上下文说明；cron/background notification turn 仍走 graceful end-turn 语义。 | 已在工具调用 ID 完整性方案登记为 duplicate provider id breaker 的可见终止化 follow-up。完整实现见 [implementations/pr-9435.md](implementations/pr-9435.md)。 |
| [#9436](https://github.com/QwenLM/qwen-code/pull/9436) | 部分 provider 会跨 turn 重用同一个 raw tool-call id 但携带不同工具参数；旧 duplicate guard 只看 id，会把真实新调用误判为 replay 并吞掉执行。 | 最终实现把 replay 判定改为 provider id 加 canonical tool name/arguments fingerprint：同 id 且同 fingerprint 继续合成 duplicate response 并触发 breaker；同 id 但参数不同视为 fresh call，使用 suffixed local id 执行并写入 history；core scheduler、TUI stream、non-interactive CLI、Agent runtime 与 ACP Session 共用同一 repeat-key helper。 | 已在工具调用 ID 完整性方案登记为 argument-aware replay detection。完整实现见 [implementations/pr-9436.md](implementations/pr-9436.md)。 |
| [#9476](https://github.com/QwenLM/qwen-code/pull/9476) | #9396 让 live-state 携带 `updatedAt`，但 WebShell 仍需要安全消费它：过早或 stale 的 live-state response 不能清掉刚完成的 turn，也不能把未知/archived/filter 外 session 插入当前页。 | 最终实现让 WebShell 在 turn completion 时记录 per-session sequence，只允许 completion 之后启动的 live-state response settle；合法 watermark 只更新已加载、cursor-less、active、未归档页面中的现有 row，并按 server comparator 重排；缺失/旧服务端/未命中 row 时回落到 10 秒合并的 full catalog refresh。 | 已在 WebUI/transport、session lifecycle 与 daemon 总览登记为 #9396 的 merged WebShell consumer。完整实现见 [implementations/pr-9476.md](implementations/pr-9476.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [daemon-serve-mode/](../../feature/daemon-serve-mode/README.md) | #9261(merged status refresh) / #9341(open) / #9362 / #9366 / #9380 / #9396 / #9476 | 补 standalone PR2A source/classification、runtime record I/O retryability、workspace live-state endpoint/WebShell consumer/activity watermark，以及 ACP child old-generation heap observation。 |
| [daemon-serve-mode/03-session-lifecycle.md](../../feature/daemon-serve-mode/03-session-lifecycle.md) | #9261(merged status refresh) / #9341(open) / #9362 / #9396 / #9476 | 新增 standalone conversation isolation primitives、#9181 runtime record I/O retry follow-up、live-state endpoint/version、activity watermark 与 WebShell completion-sequence 消费口径。 |
| [daemon-serve-mode/04-capabilities-and-protocol.md](../../feature/daemon-serve-mode/04-capabilities-and-protocol.md) | #9261(merged status refresh) / #9341(open) / #9362 / #9366 / #9380 / #9396 | 登记 #9341/#9362 不改变公开 API；#9261 已发布 `workspace_session_live_state` route/capability/SDK；#9380/#9396 是 additive status/live-state optional fields 且已合入。 |
| [daemon-serve-mode/10-client-adapters-and-sdk.md](../../feature/daemon-serve-mode/10-client-adapters-and-sdk.md) | #9261(merged status refresh) / #9380 / #9396 | 把 live-state SDK surface 改为已合入，并补 child heap status types 与 `updatedAt` optional live-state 字段。 |
| [daemon-serve-mode/11-webui-and-transport.md](../../feature/daemon-serve-mode/11-webui-and-transport.md) | #9261(merged status refresh) / #9366 / #9396 / #9476 | 把 workspace live-state 从 handshake design 更新为已合入 route + WebShell consumer，并补 activity watermark 与 completion-sequence 消费。 |
| [daemon-serve-mode/13-resource-budgeting.md](../../feature/daemon-serve-mode/13-resource-budgeting.md) | #9380 | 补 ACP child peak old-generation measurement 的 observe-only 数据面、聚合方式和验证口径。 |
| [sdk.md](../../feature/sdk.md) | #9261(merged status refresh) / #9380 / #9396 | 更新 TS daemon live-state SDK surface，补 resource status child heap types 与 `updatedAt` optional live-state 字段。 |
| [tool-call-id-integrity.md](../../feature/tool-call-id-integrity.md) | #9435 / #9436 | 补 duplicate provider id breaker 的 daemon 可见 loop stop 与 argument-aware replay 判定。 |

_按个人 PR 口径更新于 2026-08-20_
