# qwen-code PRs · 2026-09-21 ~ 2026-09-27 (W39 周内累计)

> 本文件已整理 2026-09-21 至 2026-09-27（Asia/Shanghai）创建的 @doudouOUC 个人 PR。口径为 `QwenLM/qwen-code` 中 author 为 @doudouOUC 且 createdAt 落在对应北京时间日/周窗口内的 PR；只在窗口内更新、关闭或合入，但创建时间不在窗口内的 PR 不计入新增统计。open PR 只记录当前 diff 方案，不能视为 `main` 已落地能力。

**主题**: session debug 日志保留、review 信任状态迁移、Managed Runtime Broker/JDBC/attestation/恢复与工具协议、Hosted Harness Java client、系统提示词去重

**PR 统计**: 20 PRs - 18 merged / 0 open / 2 closed
**当前已合并 PR 代码量**: +24,122 / -846，205 个文件变更
**全量代码量**: +29,058 / -4,661，220 个文件变更
**类型分布**: feat ×14, fix ×6
**范围 (scope)**: managed-agent ×16, java ×12, cli ×5, serve ×2, sdk-java ×5, review ×1, core ×1, vscode ×1

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
| [#12477](https://github.com/QwenLM/qwen-code/pull/12477) | ✅ merged | @doudouOUC | fix(java): Fence stale tool dispatch owners | +116/-1 | 2 | 09-22 15:30 | 09-22 17:20 |
| [#12478](https://github.com/QwenLM/qwen-code/pull/12478) | ✅ merged | @doudouOUC | fix(java): Make JDBC lease clocks timezone and storage safe | +107/-9 | 6 | 09-22 15:30 | 09-22 23:19 |
| [#12482](https://github.com/QwenLM/qwen-code/pull/12482) | ⚫ closed | @doudouOUC | fix(vscode): Refresh third-party notices | +3770/-3770 | 1 | 09-22 16:13 | 09-22 16:31 |
| [#12491](https://github.com/QwenLM/qwen-code/pull/12491) | ✅ merged | @doudouOUC | fix(review): Move trusted state outside workspaces | +547/-214 | 17 | 09-22 18:20 | 09-23 00:26 |
| [#12506](https://github.com/QwenLM/qwen-code/pull/12506) | ✅ merged | @doudouOUC | feat(cli): Add managed runtime attestation worker | +487/-24 | 6 | 09-23 00:35 | 09-23 03:30 |
| [#12522](https://github.com/QwenLM/qwen-code/pull/12522) | ✅ merged | @doudouOUC | feat(sdk-java): Add managed runtime attestation client | +1102/-20 | 10 | 09-23 06:03 | 09-23 11:40 |
| [#12546](https://github.com/QwenLM/qwen-code/pull/12546) | ✅ merged | @doudouOUC | fix(core): deduplicate system prompt guidance in a second pass | +307/-262 | 9 | 09-23 11:04 | 09-25 17:49 |
| [#12552](https://github.com/QwenLM/qwen-code/pull/12552) | ✅ merged | @doudouOUC | feat(sdk-java): Adopt a Managed Runtime only after attestation | +1220/-6 | 11 | 09-23 11:59 | 09-24 07:58 |
| [#12627](https://github.com/QwenLM/qwen-code/pull/12627) | ✅ merged | @doudouOUC | feat(sdk-java): Reconcile and adopt restored Runtime bindings | +4066/-149 | 33 | 09-24 10:25 | 09-25 03:41 |
| [#12630](https://github.com/QwenLM/qwen-code/pull/12630) | ✅ merged | @doudouOUC | feat(cli): Declare the v2 execute/status/cancel Managed Runtime contract | +1658/-29 | 12 | 09-24 11:22 | 09-25 03:14 |
| [#12637](https://github.com/QwenLM/qwen-code/pull/12637) | ✅ merged | @doudouOUC | feat(sdk-java): Add the v2 tool operations to the runtime transport | +881/-54 | 7 | 09-24 11:53 | 09-25 09:31 |
| [#12654](https://github.com/QwenLM/qwen-code/pull/12654) | ✅ merged | @doudouOUC | feat(sdk-java): Add the Hosted Harness private client | +3942/-4 | 25 | 09-24 15:40 | 09-24 16:47 |

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
| [#12477](https://github.com/QwenLM/qwen-code/pull/12477) | 旧 Broker 输掉 `EXECUTING` CAS 后只检查胜出状态，可能在记录已归新 generation 时仍调用 transport，产生重复副作用。 | 最终在 transport 前复核 `EXECUTING` 记录仍属于原 owner/generation；确定性双 Broker 测试证明旧 owner 零 transport 调用。 | 已在 JDBC/Hosted Runtime/SDK 专题登记合入；完整实现见 [implementations/pr-12477.md](implementations/pr-12477.md)。 |
| [#12478](https://github.com/QwenLM/qwen-code/pull/12478) | JDBC session time zone 解码使 lease 相对服务时钟偏移，数据库存储精度也可能改变 lease 往返值。 | 最终改读 epoch 秒+微秒构造 `Instant` 并截断到秒，补 H2/MySQL 三时区测试与 MariaDB CI lane。 | 已在 JDBC/Hosted Runtime/SDK 专题登记合入；完整实现见 [implementations/pr-12478.md](implementations/pr-12478.md)。 |
| [#12482](https://github.com/QwenLM/qwen-code/pull/12482) | VS Code companion 的第三方声明生成顺序漂移。 | 关闭前 diff 只重排 `NOTICES.txt`；相同内容已由其他变更入主干，本 PR 未合入。 | 无独立 feature 能力；关闭观察见 [implementations/pr-12482.md](implementations/pr-12482.md)。 |
| [#12491](https://github.com/QwenLM/qwen-code/pull/12491) | review lease/base-tree 信任记录位于可写工作区，影响清理授权与 sandbox 边界。 | 最终迁至 `$QWEN_HOME/review-state/<hash>`，按规范化外层仓库分区；旧路径仅兼容镜像，不再作权威读取。 | 已新增 review 信任状态专题；完整实现见 [implementations/pr-12491.md](implementations/pr-12491.md)。 |
| [#12506](https://github.com/QwenLM/qwen-code/pull/12506) | attestation 契约缺真实可启动的独立 worker。 | 最终隐藏 CLI 命令从 stdin 读取有界 boot JSON，仅在 loopback 提供 v2 attest，输出无 token ready 记录。 | 已更新 Managed Runtime 专题；完整实现见 [implementations/pr-12506.md](implementations/pr-12506.md)。 |
| [#12522](https://github.com/QwenLM/qwen-code/pull/12522) | Java Broker 无法按 v2 契约真实核验 worker lease/seed/scope。 | 最终加入 bounded HTTP attestation client，严格比对身份并分类重试；尚未接 Broker READY/reconcile。 | 已更新 Managed Runtime/SDK 专题；完整实现见 [implementations/pr-12522.md](implementations/pr-12522.md)。 |
| [#12546](https://github.com/QwenLM/qwen-code/pull/12546) | 默认系统提示词仍重复说明工具、验证、报告和 Git 规则。 | 最终合入去重提示词、结构/模式断言及 token governance 测量修订；结构验证不能替代真实模型 A/B。 | 已更新系统提示词专题，标注已合入及验证边界；完整实现见 [implementations/pr-12546.md](implementations/pr-12546.md)。 |
| [#12552](https://github.com/QwenLM/qwen-code/pull/12552) | Broker 尚不能启动并核验本地 worker 后才采用 lease。 | 最终合入本地 provisioner 的 boot/ready/attest 采用与 warm confirm，补进程失活/竞争测试；worker 仍无 execute route，未实现持久 reconcile。 | 已更新 Managed Runtime/SDK 专题，标注已合入及边界；完整实现见 [implementations/pr-12552.md](implementations/pr-12552.md)。 |
| [#12627](https://github.com/QwenLM/qwen-code/pull/12627) | 持久 READY binding 在新 Broker 进程没有 live lease，既不能盲信旧 endpoint，也缺少恢复仍存活资源的机制。 | 最终合入加密 seed/handle 持久化与 observe→attest→CAS 的本 JVM gate；身份冲突阻塞恢复，其他 attest 失败不误判身份，LOST 遗留会话有条件释放。 | 已更新 Managed Runtime/JDBC/SDK 专题，标注已合入与生产 provisioner 缺口；完整实现见 [implementations/pr-12627.md](implementations/pr-12627.md)。 |
| [#12630](https://github.com/QwenLM/qwen-code/pull/12630) | v2 工具 execute/status/cancel 缺统一 wire contract，原调用与 UNKNOWN 语义易漂移。 | 最终合入 route manifest、schema/fixtures 和 TS/Java conformance；该 PR 本身未实现 worker handler，后续主干已挂载工具路由。 | 已更新私有协议专题，区分契约与后续主干接线；完整实现见 [implementations/pr-12630.md](implementations/pr-12630.md)。 |
| [#12637](https://github.com/QwenLM/qwen-code/pull/12637) | Java HTTP adapter 只有 attest，不能按稳定调用引用查询/取消工具结果。 | 最终在 #12630 契约基础上合入 execute/status/cancel HTTP 方法与严格结果校验；最终 diff 为 7 个文件，worker handler 属于后续主干演进。 | 已更新私有协议/SDK 专题，区分客户端与后续主干接线；完整实现见 [implementations/pr-12637.md](implementations/pr-12637.md)。 |
| [#12654](https://github.com/QwenLM/qwen-code/pull/12654) | Java 产品控制面缺少 Hosted Harness 专用的会话、turn、SSE 与恢复客户端。 | 最终合入 Java 私有 client：协商 capability digest/boot ID 并为请求做代际 fence，提供会话生命周期、prompt 身份重试、事件流与恢复操作；Java 公共投影/生产接线仍未实现。 | 已更新 Managed Agents/SDK 专题，标注已合入及边界；完整实现见 [implementations/pr-12654.md](implementations/pr-12654.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [Managed Agents 双链路方案](../../feature/managed-agents/README.md) | #12390/#12391/#12409/#12438/#12445/#12447/#12477/#12478/#12506/#12522/#12552/#12627/#12630/#12637/#12654(merged), #12458(closed) | 持久恢复基础、工具契约/Java 客户端已合入；后续主干已挂载 worker 路由，但生产跨进程恢复与 Hosted 链路验收仍缺。 |
| [Runtime Broker JDBC 持久化](../../feature/managed-agents/managed-runtime-broker-jdbc.zh-CN.md) | #12390/#12391/#12438/#12445/#12477/#12478/#12627(merged), #12458(closed) | 登记持久 seed/handle 与恢复 CAS 已合入，生产 durable provisioner 仍缺。 |
| [Managed Runtime 身份核验](../../feature/managed-agents/managed-runtime-attestation.zh-CN.md) | #12447/#12506/#12522/#12552/#12627(merged) | 本地进程采用与持久 READY reconcile 基础已合入；生产 scheduler 接线仍缺。 |
| [Session / Harness / Runtime 私有协议](../../feature/managed-agents/managed-agent-control-protocol.md) | #12409/#12447/#12506/#12522/#12552/#12630/#12637/#12654(merged) | 工具 wire contract 与 Java HTTP 方法已合入；后续主干已挂载 worker 路由，完整 Hosted Tool Runtime 验收仍未证明。 |
| [SDK](../../feature/sdk.md) | #12390/#12391/#12438/#12445/#12477/#12478/#12522/#12552/#12627/#12637/#12654(merged), #12458(closed) | 持久恢复基础、工具 HTTP 操作和 Hosted Harness client 已合入；生产跨进程恢复与产品接线仍需验收。 |
| [Review 信任状态](../../feature/review-trusted-state.md) | #12491(merged) | 记录权威状态移出工作区及旧路径兼容镜像。 |
| [系统提示词指引](../../feature/system-prompt-guidance.md) | #12546(merged) | 记录第二轮去重已合入与真实模型 A/B 缺口。 |
| [telemetry 可观测性](../../feature/telemetry-observability/README.md) | #12374(merged) | 登记 session debug log 的交互式 retention 方案及非交互入口边界。 |
| [feature索引](../../feature/README.md) | #12374/#12390/#12391/#12409/#12438/#12445/#12447/#12458/#12477/#12478/#12491/#12506/#12522/#12546/#12552/#12627/#12630/#12637/#12654 | 同步 W39 当前状态和入口；#12482 未合入且无 feature。 |

_按个人 PR 口径更新于 2026-09-27_
