# qwen-code PRs · 2026-09-21 ~ 2026-09-27 (W39 周内累计)

> 本文件已整理 2026-09-21 至 2026-09-27（Asia/Shanghai）创建的 @doudouOUC 个人 PR。口径为 `QwenLM/qwen-code` 中 author 为 @doudouOUC 且 createdAt 落在对应北京时间日/周窗口内的 PR；只在窗口内更新、关闭或合入，但创建时间不在窗口内的 PR 不计入新增统计。open PR 只记录当前 diff 方案，不能视为 `main` 已落地能力。

**主题**: session debug 日志保留、Managed Runtime Broker 编排/JDBC/fencing、Hosted Harness 与 attestation 私有协议基础

**PR 统计**: 10 PRs - 7 merged / 2 open / 1 closed
**当前已合并 PR 代码量**: +9,689 / -74，67 个文件变更
**全量代码量**: +11,038 / -125，88 个文件变更
**类型分布**: feat ×7, fix ×3
**范围 (scope)**: managed-agent ×9, java ×7, cli ×3, serve ×2

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 代码量 | 文件数 | 创建时间(UTC) | 合并/关闭时间(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#12374](https://github.com/QwenLM/qwen-code/pull/12374) | ✅ merged | @doudouOUC | fix(cli): clean up stale session debug logs | +472/-7 | 9 | 09-21 02:20 | 09-21 23:57 |
| [#12390](https://github.com/QwenLM/qwen-code/pull/12390) | ✅ merged | @doudouOUC | feat(java): Add JDBC binding and session persistence | +1709/-1 | 14 | 09-21 08:13 | 09-21 11:25 |
| [#12391](https://github.com/QwenLM/qwen-code/pull/12391) | ✅ merged | @doudouOUC | feat(java): Add managed tool execution state | +1501/-5 | 8 | 09-21 08:13 | 09-22 02:07 |
| [#12409](https://github.com/QwenLM/qwen-code/pull/12409) | ✅ merged | @doudouOUC | feat(serve): Define Hosted Harness private protocol | +392/-0 | 4 | 09-21 12:06 | 09-21 12:56 |
| [#12438](https://github.com/QwenLM/qwen-code/pull/12438) | ✅ merged | @doudouOUC | feat(java): Add runtime broker service core | +2810/-11 | 10 | 09-22 03:31 | 09-22 06:58 |
| [#12445](https://github.com/QwenLM/qwen-code/pull/12445) | ✅ merged | @doudouOUC | feat(java): Persist managed tool executions with JDBC | +1063/-50 | 12 | 09-22 04:11 | 09-22 13:51 |
| [#12447](https://github.com/QwenLM/qwen-code/pull/12447) | ✅ merged | @doudouOUC | feat(cli): Add managed runtime attestation contract | +1742/-0 | 10 | 09-22 04:49 | 09-22 08:52 |
| [#12458](https://github.com/QwenLM/qwen-code/pull/12458) | ⚫ closed | @doudouOUC | feat(java): Persist managed tool executions with JDBC | +1166/-45 | 14 | 09-22 08:33 | 09-22 14:30 |
| [#12477](https://github.com/QwenLM/qwen-code/pull/12477) | 🟡 open | @doudouOUC | fix(java): Fence stale tool dispatch owners | +116/-1 | 2 | 09-22 15:30 | — |
| [#12478](https://github.com/QwenLM/qwen-code/pull/12478) | 🟡 open | @doudouOUC | fix(java): Make JDBC lease clocks timezone-safe | +67/-5 | 5 | 09-22 15:30 | — |

---

## PR 解决问题、实现方式与 feature 处理

| PR | 解决了什么问题 | 最终怎么实现（open/closed 只登记当前观察） | 对应 feature 文档 |
|---|---|---|---|
| [#12374](https://github.com/QwenLM/qwen-code/pull/12374) | 开启 file debug logging 后，每个会话会留下独立 `.txt` 日志；这些文件没有跟随 `general.cleanupPeriodDays` 清理，长期交互使用会让 runtime `debug/` 目录持续增长。 | 最终在交互式 housekeeping 中按 resolved debug 目录建立独立 marker，批量扫描合法 session/pseudo-session 的普通 `.txt`，按 mtime 删除过期文件并排除当前会话；`latest` 软链、daemon 子目录、无关文件和 debug 根目录均保留。 | 已在 telemetry 可观测性专题登记最终保留方案；完整实现见 [implementations/pr-12374.md](implementations/pr-12374.md)。 |
| [#12390](https://github.com/QwenLM/qwen-code/pull/12390) | Runtime Binding 与逻辑 Runtime Session 只有进程内 Repository 时，Java 重启会丢失 generation、CAS 与 operation lease，多实例也无法通过共享事实源协调。 | 最终新增 DataSource-only JDBC binding/session Repository 和三表 schema：binding allocation 通过 slot 行锁串行化，更新按 version/generation fencing，租约使用数据库时钟；H2 合约和可选真实 MySQL profile 复用同一测试边界，但不含 Tool Execution、Spring/Flyway 或 Runtime reconcile。 | 已更新 Managed Agents、Runtime Broker JDBC 与 SDK 专题，明确 upstream `main` 只合入 binding/session 子集。完整实现见 [implementations/pr-12390.md](implementations/pr-12390.md)。 |
| [#12391](https://github.com/QwenLM/qwen-code/pull/12391) | Broker 尚不能用稳定身份跨重试追踪一次 Tool 调用；响应丢失、dispatch owner 过期或取消竞争可能导致重复物理执行、旧 owner 结算或取消意图丢失。 | 最终定义 execution/idempotency identity、六态记录和同步内存 Repository；live dispatch claim 才能 CAS/结算，执行中 claim 过期接管转为 `UNKNOWN` 而不重放，独立 `requestCancel` 按 PREPARED/DISPATCHING/EXECUTING 分别结算、置位或转入取消请求。 | 已更新 Managed Agents、Runtime Broker JDBC 与 SDK 专题，明确已合入的是内存状态基础，仍无 JDBC 或真实 dispatch。完整实现见 [implementations/pr-12391.md](implementations/pr-12391.md)。 |
| [#12409](https://github.com/QwenLM/qwen-code/pull/12409) | Java 控制面调用长期运行 Hosted Harness 时，普通 bearer token 不能证明双方协议版本、部署 capability 集或当前进程 generation；重启后旧调用可能命中另一个内存 owner。 | 最终新增独立 contract foundation：启动时生成非持久 boot UUID，校验 canonical capability digest，并由 Express middleware 按 protocol header 与 boot ID 返回稳定 426/400/409 错误及当前 boot header；尚未挂入 `qwen serve` profile、capabilities 或 Java 调用链。 | 已更新 Managed Agents 总览与私有协议专题，明确只落地 contract/middleware foundation。完整实现见 [implementations/pr-12409.md](implementations/pr-12409.md)。 |
| [#12438](https://github.com/QwenLM/qwen-code/pull/12438) | Repository 已定义状态，却没有统一层协调 scope、provision/acquire、控制、Tool dispatch/cancel、续租和 release，接入方可能绕过同一 CAS/lease 边界。 | 最终新增无框架 `RuntimeBrokerService`，以 resolver/provisioner/transport 组合三类 Repository，合并并发工作并续租 operation/dispatch claim；不确定执行转 `UNKNOWN`，持久 `READY` 在本进程没有精确 live lease 时失败关闭。 | 已更新 Managed Agents、JDBC、Hosted Runtime 与 SDK 专题；完整实现见 [implementations/pr-12438.md](implementations/pr-12438.md)。 |
| [#12445](https://github.com/QwenLM/qwen-code/pull/12445) | 内存 Tool Execution ledger 无法跨重启/多 Broker 保留幂等、取消和结果；MySQL collation 与 JSON codec 还可能破坏 case-sensitive identity 或 opaque payload。 | 最终新增第四表和 JDBC Repository，以行锁、数据库时钟、version/owner/generation fencing 持久化完整状态；哈希索引后复核明文，opaque `$ref`/`@type`、null 与数字可安全往返，非有限数值失败关闭。 | 已把 Runtime Broker JDBC 与 SDK 专题更新为四表已合入；完整实现见 [implementations/pr-12445.md](implementations/pr-12445.md)。 |
| [#12447](https://github.com/QwenLM/qwen-code/pull/12447) | raw HTTP gate 与 Express handler 分别维护 attestation route，曾导致 handler 存在但真实请求 404；TS/Java 也缺少一份共用 wire contract。 | 最终以 typed manifest 单源固定 method/path/v2/16 KiB/no-store，先鉴权再解析并严格校验 lease/Workspace identity；共享 schema/fixtures 同时驱动真实 HTTP TypeScript 测试和 Java conformance consumer。 | 已更新 Managed Runtime attestation、私有协议与 Managed Agents 总览；完整实现见 [implementations/pr-12447.md](implementations/pr-12447.md)。 |
| [#12458](https://github.com/QwenLM/qwen-code/pull/12458) | 与 #12445 平行实现同一 Tool Execution JDBC 持久化，并在评审中补充 codec、hash guard 与并发见证。 | 关闭前 head 完成了同类第四表/JDBC adapter，但作者在 #12445 合入后明确关闭为被取代方案；任何额外测试必须基于最新 `main` 重新提取，不能当作已交付来源。 | 不创建第二套 feature 入口，仅在现有 JDBC/Managed Agents 专题标记 superseded；完整关闭观察见 [implementations/pr-12458.md](implementations/pr-12458.md)。 |
| [#12477](https://github.com/QwenLM/qwen-code/pull/12477) | 旧 Broker 输掉 `EXECUTING` CAS 后只检查胜出状态，可能在记录已归新 generation 时仍调用 transport，产生重复副作用。 | 当前 open diff 在 transport 前复核 `EXECUTING` 记录仍属于原 owner/generation；确定性双 Broker 测试证明旧 owner 零 transport 调用。 | 已在 JDBC/Hosted Runtime/SDK 专题登记为 open correctness gate；完整观察见 [implementations/pr-12477.md](implementations/pr-12477.md)。 |
| [#12478](https://github.com/QwenLM/qwen-code/pull/12478) | `CURRENT_TIMESTAMP` 经 JDBC session time zone 解码会让 lease 相对服务时钟偏移数小时，使新 lease 过早失效或长期不失效。 | 当前 open diff 改读 epoch 秒+微秒构造 `Instant`，并在 H2 与真实 MySQL 的 UTC、+08:00、-04:00 session offset 下验证时区无关。 | 已在 JDBC/Hosted Runtime/SDK 专题登记当前 open 修复和精确 head；完整观察见 [implementations/pr-12478.md](implementations/pr-12478.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [Managed Agents 双链路方案](../../feature/managed-agents/README.md) | #12390/#12391/#12409/#12438/#12445/#12447(merged), #12458(closed), #12477/#12478(open) | 同步 Broker service、四表 JDBC、attestation foundation 与两个 correctness gate，明确尚未形成生产 Hosted Runtime。 |
| [Runtime Broker JDBC 持久化](../../feature/managed-agents/managed-runtime-broker-jdbc.zh-CN.md) | #12390/#12391/#12438/#12445(merged), #12458(closed), #12477/#12478(open) | 登记四表 Repository 与 service core 已合入，关闭平行实现被取代；dispatch 最终 fence 和时区安全时钟仍在评审。 |
| [Managed Runtime 身份核验](../../feature/managed-agents/managed-runtime-attestation.zh-CN.md) | #12447(merged) | 登记 attestation route/schema/fixtures foundation，保留 Hosted profile、Java transport 与 required cross-language CI 缺口。 |
| [Session / Harness / Runtime 私有协议](../../feature/managed-agents/managed-agent-control-protocol.md) | #12409/#12447(merged) | 区分 version/boot fence 与 Runtime v2 attestation contract，二者均尚未完成生产挂载。 |
| [SDK](../../feature/sdk.md) | #12390/#12391/#12438/#12445(merged), #12458(closed), #12477/#12478(open) | 更新 Java Runtime Broker 的 service/JDBC 已合入边界与接线前 correctness gates。 |
| [telemetry 可观测性](../../feature/telemetry-observability/README.md) | #12374(merged) | 登记 session debug log 的交互式 retention 方案及非交互入口边界。 |
| [feature索引](../../feature/README.md) | #12374/#12390/#12391/#12409/#12438/#12445/#12447/#12458/#12477/#12478 | 同步 W39 当前状态和入口。 |

_按个人 PR 口径更新于 2026-09-23_
