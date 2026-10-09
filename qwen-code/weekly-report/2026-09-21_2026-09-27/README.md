# qwen-code PRs · 2026-09-21 ~ 2026-09-27 (W39 最终版)

> 本文件已整理 2026-09-21 至 2026-09-27（Asia/Shanghai）创建的 @doudouOUC 个人 PR。以 author 和 createdAt 决定归属，更新/关闭/合入时间不用于新增统计；open 为当前 diff，closed 未合入为历史方案，均不能作为 `main` 能力。状态与规模快照更新于 2026-10-09，相关主干 `55ee50d34e55`。

**主题**: Runtime Broker 与持久 journal、Hosted 控制面、Workspace 准入及私有文件/Shell、提示词和中文设置

**PR 统计**: 37 PRs - 35 merged / 0 open / 2 closed
**当前已合并 PR 代码量**: +107,792 / -3,108，707 个文件变更
**全量代码量**: +112,728 / -6,923，722 个文件变更
**类型分布**: fix ×9, feat ×28
**范围 (scope)**: cli ×5, java ×7, serve ×6, vscode ×1, review ×1, sdk-java ×5, core ×5, managed-agent ×4, runtime-broker ×1, web-shell ×2

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
| [#12671](https://github.com/QwenLM/qwen-code/pull/12671) | ✅ merged | @doudouOUC | feat(cli): Mount the v2 tool operations on the Managed Runtime worker | +1469/-60 | 9 | 09-25 03:24 | 09-25 10:27 |
| [#12691](https://github.com/QwenLM/qwen-code/pull/12691) | ✅ merged | @doudouOUC | feat(serve): add guarded Hosted Runtime foundations | +11141/-78 | 45 | 09-25 11:08 | 09-25 15:33 |
| [#12692](https://github.com/QwenLM/qwen-code/pull/12692) | ✅ merged | @doudouOUC | feat(managed-agent): Spring control plane and dual-path WebShell | +20302/-11 | 99 | 09-25 11:08 | 09-25 16:30 |
| [#12693](https://github.com/QwenLM/qwen-code/pull/12693) | ✅ merged | @doudouOUC | feat(core): Durable Managed Session journal and failover | +21277/-147 | 59 | 09-25 11:08 | 09-25 17:00 |
| [#12709](https://github.com/QwenLM/qwen-code/pull/12709) | ✅ merged | @doudouOUC | feat(managed-agent): admit workspace-bound sessions without execution | +2454/-130 | 31 | 09-25 16:56 | 09-26 03:59 |
| [#12713](https://github.com/QwenLM/qwen-code/pull/12713) | ✅ merged | @doudouOUC | feat(serve): Enable private Hosted Harness no-tool text turns | +2044/-35 | 22 | 09-25 18:10 | 09-26 06:16 |
| [#12730](https://github.com/QwenLM/qwen-code/pull/12730) | ✅ merged | @doudouOUC | feat(runtime-broker): install managed Workspace contexts (W0c-2) | +1700/-69 | 24 | 09-26 02:58 | 09-26 12:11 |
| [#12742](https://github.com/QwenLM/qwen-code/pull/12742) | ✅ merged | @doudouOUC | fix(serve): Settle hosted turns after transient read failures | +272/-13 | 2 | 09-26 06:38 | 09-26 09:46 |
| [#12754](https://github.com/QwenLM/qwen-code/pull/12754) | ✅ merged | @doudouOUC | feat(managed-agent): wire private Workspace execution (W0c-3) | +1561/-18 | 20 | 09-26 09:47 | 09-26 17:00 |
| [#12767](https://github.com/QwenLM/qwen-code/pull/12767) | ✅ merged | @doudouOUC | feat(core): add local managed tool-result segment store | +2981/-56 | 8 | 09-26 13:08 | 09-26 22:24 |
| [#12783](https://github.com/QwenLM/qwen-code/pull/12783) | ✅ merged | @doudouOUC | fix(web-shell): complete zh-CN translations for the settings panel | +541/-267 | 7 | 09-26 16:10 | 09-26 19:05 |
| [#12784](https://github.com/QwenLM/qwen-code/pull/12784) | ✅ merged | @doudouOUC | fix(core): deduplicate todo guidance and compress comment rule in a third prompt pass | +135/-24 | 5 | 09-26 16:12 | 09-26 17:50 |
| [#12797](https://github.com/QwenLM/qwen-code/pull/12797) | ✅ merged | @doudouOUC | feat(web-shell): Select and bind managed Workspaces | +2813/-160 | 30 | 09-26 18:30 | 09-27 08:28 |
| [#12821](https://github.com/QwenLM/qwen-code/pull/12821) | ✅ merged | @doudouOUC | feat(core): Capture foreground Managed Shell results with local receipts | +4180/-49 | 20 | 09-27 05:11 | 09-27 08:31 |
| [#12831](https://github.com/QwenLM/qwen-code/pull/12831) | ✅ merged | @doudouOUC | feat(serve): add gated Hosted Workspace file tool turns | +2645/-129 | 29 | 09-27 07:21 | 09-27 15:00 |
| [#12839](https://github.com/QwenLM/qwen-code/pull/12839) | ✅ merged | @doudouOUC | feat(managed-agent): Add W0e terminal recovery fences | +2962/-500 | 46 | 09-27 10:55 | 09-28 05:15 |
| [#12848](https://github.com/QwenLM/qwen-code/pull/12848) | ✅ merged | @doudouOUC | feat(serve): add gated Hosted foreground Shell turns | +5193/-516 | 46 | 09-27 12:09 | 09-28 14:53 |

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
| [#12654](https://github.com/QwenLM/qwen-code/pull/12654) | Java 产品控制面缺少 Hosted Harness 专用的会话、turn、SSE 与恢复客户端。 | 最终合入 Java 私有 client：协商 capability digest/boot ID 并为请求做代际 fence，提供会话生命周期、prompt 身份重试、事件流与恢复操作；Java 公共投影/接线已由后续 #12692 承接。 | 已更新 Managed Agents/SDK 专题，标注已合入及边界；完整实现见 [implementations/pr-12654.md](implementations/pr-12654.md)。 |
| [#12671](https://github.com/QwenLM/qwen-code/pull/12671) | v2 契约已有 Java 客户端，但 worker 尚不能接收真实 execute/status/cancel。 | worker 挂载统一路由并创建工具执行器；稳定调用引用匹配已有 journal，重复请求加入原 promise，冲突引用拒绝。取消按原记录置位，首版拒绝后台 Shell。 | 已同步Managed Agents的merged口径；完整实现见 [implementations/pr-12671.md](implementations/pr-12671.md)。 |
| [#12691](https://github.com/QwenLM/qwen-code/pull/12691) | Hosted Harness 与 Tool Runtime 缺明确进程和权限边界，本地 provider 路径容易混入宿主工具。 | 新增 guarded Hosted profile、Broker HTTP provider 和本地 Runtime 适配；协议、URL、scope 和返回体有界校验，Broker lease 驱动工具访问，独立进程生命周期与配置隔离。 | 已同步Managed Agents的merged口径；完整实现见 [implementations/pr-12691.md](implementations/pr-12691.md)。 |
| [#12692](https://github.com/QwenLM/qwen-code/pull/12692) | Managed Agent 的持久公共身份、事件投影和 WebShell 入口尚未形成可连接的产品控制面。 | Spring 控制面通过 JDBC 保存 Session、Turn、幂等命令与投影；Harness 消费者按持久游标提交事件，公共 REST/WebShell DTO 和 SSE 由控制面提供。WebShell provider 选择本地或 Managed 链路，复用 Java Hosted client。 | 已同步Managed Agents的merged口径；完整实现见 [implementations/pr-12692.md](implementations/pr-12692.md)。 |
| [#12693](https://github.com/QwenLM/qwen-code/pull/12693) | Harness 重启后模型历史、checkpoint 与 writer 归属若仅存在内存，会造成恢复时丢失事实或重放副作用。 | Managed Session authority 用事务记录和持久资源表达输入、执行意图、checkpoint 与回执；writer/activation fence 决定提交权限。checkpoint schema 校验恢复闭集，HTTP store 和 scheduler 从已提交边界恢复，不把未提交 tail 当权威历史。 | 已同步恢复与运维的merged口径；完整实现见 [implementations/pr-12693.md](implementations/pr-12693.md)。 |
| [#12709](https://github.com/QwenLM/qwen-code/pull/12709) | 公共创建无法稳定选择有权限的 Workspace，直接开放执行会越过尚未接通的 Runtime 边界。 | 在创建事务中读取 Registry、访问权限和默认选择，保存稳定 Workspace binding；相同幂等 key 复用原 Session 并再次校验可见性。该切片只准入空 Session，带输入和执行请求明确拒绝。 | 已同步Managed Agents的merged口径；完整实现见 [implementations/pr-12709.md](implementations/pr-12709.md)。 |
| [#12713](https://github.com/QwenLM/qwen-code/pull/12713) | Hosted profile 的路由基础尚不能通过真实模型完成一个可持久结算的文本回合。 | Session 路由以持久 authority 准入输入和结算；模型配置注册零工具，工具调用或不支持的 continuation 失败关闭。已存在未结算输入或恢复不可用时拒绝普通 load，事件从提交事实投影。 | 已同步Managed Agents的merged口径；完整实现见 [implementations/pr-12713.md](implementations/pr-12713.md)。 |
| [#12730](https://github.com/QwenLM/qwen-code/pull/12730) | Broker 虽可采用 Runtime，却不能证明 Runtime 已安装原 Session 的 Workspace/cwd context。 | managed-context 协议绑定 seed、lease、epoch 和 context digest；HTTP transport 在 acquire 时安装 context，校验原身份 receipt。JDBC binding/session 持久化相应上下文以便恢复时再次核验。 | 已同步Managed Agents的merged口径；完整实现见 [implementations/pr-12730.md](implementations/pr-12730.md)。 |
| [#12742](https://github.com/QwenLM/qwen-code/pull/12742) | 输入已持久准入后，读取或模型前置步骤出现 transient failure，可能遗留未结算 Turn 阻塞后续操作。 | 扩大已准入回合的异常结算范围；失败时通过原 sink 写入终态，使用 admitted/settled 判断避免重复结算。 | 已同步Managed Agents的merged口径；完整实现见 [implementations/pr-12742.md](implementations/pr-12742.md)。 |
| [#12754](https://github.com/QwenLM/qwen-code/pull/12754) | 绑定 context 尚不能约束真实文件副作用归属，多个 Session 可能同时使用同一 storage。 | Workspace transport 在 acquire/execute 前校验权限、scope、目录和精确 lease，事务 claim holder 并安装/激活原 context；release 先停用 context，再按原 holder 身份释放。 | 已同步Managed Agents的merged口径；完整实现见 [implementations/pr-12754.md](implementations/pr-12754.md)。 |
| [#12767](https://github.com/QwenLM/qwen-code/pull/12767) | 裁剪后的模型消息不能保存完整工具输出，也不能证明分段资源已完整封存。 | 本地 segment store 用受控目录、独占 staging、文件同步及发布管理不可变分段和 manifest；校验长度/digest、ordinal 和 seal/prefix 请求，形成可核验 receipt。 | 已同步完整工具结果的merged口径；完整实现见 [implementations/pr-12767.md](implementations/pr-12767.md)。 |
| [#12783](https://github.com/QwenLM/qwen-code/pull/12783) | 中文界面的设置 schema 描述、选项和面板文字仍会显示英文或缺失翻译。 | 补齐 WebShell 中文消息和 schema 描述映射，workspace-settings 暴露一致的允许项，构建产物和 i18n 测试覆盖实际消费端。 | 已同步Feature 索引的merged口径；完整实现见 [implementations/pr-12783.md](implementations/pr-12783.md)。 |
| [#12784](https://github.com/QwenLM/qwen-code/pull/12784) | Todo 与代码注释规则在多个片段重复，增加上下文成本并可能令模型收到重叠要求。 | 合并 Todo 使用指导并压缩注释规则，更新提示词快照、结构断言和 token 测量记录，保持原工具/模式边界。 | 已同步系统提示词的merged口径；完整实现见 [implementations/pr-12784.md](implementations/pr-12784.md)。 |
| [#12797](https://github.com/QwenLM/qwen-code/pull/12797) | 用户不能从可见 Workspace 中选择并持久绑定 Session，前后端容易把默认目录当稳定身份。 | Java 提供带租户/actor scope cursor 的可见 Workspace discovery；WebShell 创建器根据 capability 展示选择并传递稳定 workspaceId，服务端仍在创建事务复核权限和绑定。 | 已同步Managed Agents的merged口径；完整实现见 [implementations/pr-12797.md](implementations/pr-12797.md)。 |
| [#12821](https://github.com/QwenLM/qwen-code/pull/12821) | Shell 的原始 stdout/stderr 在模型裁剪前缺少与原执行绑定的完整捕获。 | Shell 管道捕获进入分段 store；Session 在执行前持久记录 intent，结果 seal 后按 writer/activation 和调用身份接受 receipt，再推进 checkpoint。v3 工具路由关联结果 ACK。 | 已同步完整工具结果的merged口径；完整实现见 [implementations/pr-12821.md](implementations/pr-12821.md)。 |
| [#12831](https://github.com/QwenLM/qwen-code/pull/12831) | Hosted 无工具文本回合不能在绑定 Workspace 中执行文件操作。 | 固定 files/1 profile，仅宣告远程文件工具；Harness 持久记录执行 intent，由 Broker warm/acquire/prepare/start 调用原 Runtime，结果提交后继续模型。路径和未知结果失败关闭。 | 已同步Managed Agents的merged口径；完整实现见 [implementations/pr-12831.md](implementations/pr-12831.md)。 |
| [#12839](https://github.com/QwenLM/qwen-code/pull/12839) | Runtime 丢失后原执行终态和 holder 清理可能被 READY/新代际校验阻断，或被证据不足的清理释放。 | 终态 execution 可按原引用重放而不重新执行；LOST 清理要求 stopped-writer/loss 证据、无活跃 execution 和 live operation claim，同事务核对 binding/session/holder 后释放。 | 已同步恢复与运维的merged口径；完整实现见 [implementations/pr-12839.md](implementations/pr-12839.md)。 |
| [#12848](https://github.com/QwenLM/qwen-code/pull/12848) | Hosted 文件回合缺前台 Shell 的原始输出捕获和持久结果关联。 | 引入受门禁 Shell profile 与 publisher；复用 ManagedShellResultSession 的 intent/receipt，Broker 执行原调用，完整输出存入 Session resources，模型消费有界结果，receipt 后推进恢复边界。 | 已同步完整工具结果的merged口径；完整实现见 [implementations/pr-12848.md](implementations/pr-12848.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [Managed Agents 双链路方案](../../feature/managed-agents/README.md) | #12390/#12391/#12409/#12438/#12445/#12447/#12477/#12478/#12506/#12522/#12552/#12627/#12630/#12637/#12654(merged), #12458(closed) | 持久恢复基础、工具契约/Java 客户端已合入；后续主干已挂载 worker 路由，但生产跨进程恢复与 Hosted 链路验收仍缺。 |
| [Runtime Broker JDBC 持久化](../../feature/managed-agents/managed-runtime-broker-jdbc.zh-CN.md) | #12390/#12391/#12438/#12445/#12477/#12478/#12627(merged), #12458(closed) | 登记持久 seed/handle 与恢复 CAS 已合入，durable provisioner 已由 #12865 承接。 |
| [Managed Runtime 身份核验](../../feature/managed-agents/managed-runtime-attestation.zh-CN.md) | #12447/#12506/#12522/#12552/#12627(merged) | 本地进程采用与持久 READY reconcile 基础已合入；维护恢复与产品接线由后续切片承接。 |
| [Session / Harness / Runtime 私有协议](../../feature/managed-agents/managed-agent-control-protocol.md) | #12409/#12447/#12506/#12522/#12552/#12630/#12637/#12654(merged) | 工具 wire contract 与 Java HTTP 方法已合入；后续主干已挂载 worker 路由，完整 Hosted Tool Runtime 验收仍未证明。 |
| [SDK](../../feature/sdk.md) | #12390/#12391/#12438/#12445/#12477/#12478/#12522/#12552/#12627/#12637/#12654(merged), #12458(closed) | 持久恢复基础、工具 HTTP 操作和 Hosted Harness client 已合入；后续 #12692/#12865/#12869 承接产品接线与恢复；部署验收另行验证。 |
| [Review 信任状态](../../feature/review-trusted-state.md) | #12491(merged) | 记录权威状态移出工作区及旧路径兼容镜像。 |
| [系统提示词指引](../../feature/system-prompt-guidance.md) | #12546(merged) | 记录第二轮去重已合入与真实模型 A/B 缺口。 |
| [telemetry 可观测性](../../feature/telemetry-observability/README.md) | #12374(merged) | 登记 session debug log 的交互式 retention 方案及非交互入口边界。 |
| [feature索引](../../feature/README.md) | #12374/#12390/#12391/#12409/#12438/#12445/#12447/#12458/#12477/#12478/#12491/#12506/#12522/#12546/#12552/#12627/#12630/#12637/#12654 | 同步 W39 当前状态和入口；#12482 未合入且无 feature。 |
| [Managed Agents](../../feature/managed-agents/README.md) | #12671(merged), #12691(merged), #12692(merged), #12709(merged), #12713(merged), #12730(merged), #12742(merged), #12754(merged), #12797(merged), #12831(merged) | 按最终合入/当前方案同步状态和关键边界；详情在逐 PR 实现文档。 |
| [恢复与运维](../../feature/managed-agents/managed-agent-recovery-operations.md) | #12693(merged), #12839(merged) | 按最终合入/当前方案同步状态和关键边界；详情在逐 PR 实现文档。 |
| [完整工具结果](../../feature/managed-agents/managed-agent-tool-result-artifacts.zh-CN.md) | #12767(merged), #12821(merged), #12848(merged) | 按最终合入/当前方案同步状态和关键边界；详情在逐 PR 实现文档。 |
| [Feature 索引](../../feature/README.md) | #12783(merged) | 按最终合入/当前方案同步状态和关键边界；详情在逐 PR 实现文档。 |
| [系统提示词](../../feature/system-prompt-guidance.md) | #12784(merged) | 按最终合入/当前方案同步状态和关键边界；详情在逐 PR 实现文档。 |

_按个人 PR 口径更新于 2026-10-09_
