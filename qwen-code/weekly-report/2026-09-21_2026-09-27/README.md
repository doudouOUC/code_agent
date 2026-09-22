# qwen-code PRs · 2026-09-21 ~ 2026-09-27 (W39 周内累计)

> 本文件已整理 2026-09-21 至 2026-09-27（Asia/Shanghai）创建的 @doudouOUC 个人 PR。口径为 `QwenLM/qwen-code` 中 author 为 @doudouOUC 且 createdAt 落在对应北京时间日/周窗口内的 PR；只在窗口内更新、关闭或合入，但创建时间不在窗口内的 PR 不计入新增统计。open PR 只记录当前 diff 方案，不能视为 `main` 已落地能力。

**主题**: session debug 日志保留、Managed Runtime JDBC/工具执行状态、Hosted Harness 私有协议基础

**PR 统计**: 4 PRs - 4 merged / 0 open / 0 closed
**当前已合并 PR 代码量**: +4,074 / -13，35 个文件变更
**全量代码量**: +4,074 / -13，35 个文件变更
**类型分布**: feat ×3, fix ×1
**范围 (scope)**: managed-agent ×3, java ×2, cli ×2, serve ×1

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 代码量 | 文件数 | 创建时间(UTC) | 合并/关闭时间(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#12374](https://github.com/QwenLM/qwen-code/pull/12374) | ✅ merged | @doudouOUC | fix(cli): clean up stale session debug logs | +472/-7 | 9 | 09-21 02:20 | 09-21 23:57 |
| [#12390](https://github.com/QwenLM/qwen-code/pull/12390) | ✅ merged | @doudouOUC | feat(java): Add JDBC binding and session persistence | +1709/-1 | 14 | 09-21 08:13 | 09-21 11:25 |
| [#12391](https://github.com/QwenLM/qwen-code/pull/12391) | ✅ merged | @doudouOUC | feat(java): Add managed tool execution state | +1501/-5 | 8 | 09-21 08:13 | 09-22 02:07 |
| [#12409](https://github.com/QwenLM/qwen-code/pull/12409) | ✅ merged | @doudouOUC | feat(serve): Define Hosted Harness private protocol | +392/-0 | 4 | 09-21 12:06 | 09-21 12:56 |

---

## PR 解决问题、实现方式与 feature 处理

| PR | 解决了什么问题 | 最终怎么实现（open/closed 只登记当前观察） | 对应 feature 文档 |
|---|---|---|---|
| [#12374](https://github.com/QwenLM/qwen-code/pull/12374) | 开启 file debug logging 后，每个会话会留下独立 `.txt` 日志；这些文件没有跟随 `general.cleanupPeriodDays` 清理，长期交互使用会让 runtime `debug/` 目录持续增长。 | 最终在交互式 housekeeping 中按 resolved debug 目录建立独立 marker，批量扫描合法 session/pseudo-session 的普通 `.txt`，按 mtime 删除过期文件并排除当前会话；`latest` 软链、daemon 子目录、无关文件和 debug 根目录均保留。 | 已在 telemetry 可观测性专题登记最终保留方案；完整实现见 [implementations/pr-12374.md](implementations/pr-12374.md)。 |
| [#12390](https://github.com/QwenLM/qwen-code/pull/12390) | Runtime Binding 与逻辑 Runtime Session 只有进程内 Repository 时，Java 重启会丢失 generation、CAS 与 operation lease，多实例也无法通过共享事实源协调。 | 最终新增 DataSource-only JDBC binding/session Repository 和三表 schema：binding allocation 通过 slot 行锁串行化，更新按 version/generation fencing，租约使用数据库时钟；H2 合约和可选真实 MySQL profile 复用同一测试边界，但不含 Tool Execution、Spring/Flyway 或 Runtime reconcile。 | 已更新 Managed Agents、Runtime Broker JDBC 与 SDK 专题，明确 upstream `main` 只合入 binding/session 子集。完整实现见 [implementations/pr-12390.md](implementations/pr-12390.md)。 |
| [#12391](https://github.com/QwenLM/qwen-code/pull/12391) | Broker 尚不能用稳定身份跨重试追踪一次 Tool 调用；响应丢失、dispatch owner 过期或取消竞争可能导致重复物理执行、旧 owner 结算或取消意图丢失。 | 最终定义 execution/idempotency identity、六态记录和同步内存 Repository；live dispatch claim 才能 CAS/结算，执行中 claim 过期接管转为 `UNKNOWN` 而不重放，独立 `requestCancel` 按 PREPARED/DISPATCHING/EXECUTING 分别结算、置位或转入取消请求。 | 已更新 Managed Agents、Runtime Broker JDBC 与 SDK 专题，明确已合入的是内存状态基础，仍无 JDBC 或真实 dispatch。完整实现见 [implementations/pr-12391.md](implementations/pr-12391.md)。 |
| [#12409](https://github.com/QwenLM/qwen-code/pull/12409) | Java 控制面调用长期运行 Hosted Harness 时，普通 bearer token 不能证明双方协议版本、部署 capability 集或当前进程 generation；重启后旧调用可能命中另一个内存 owner。 | 最终新增独立 contract foundation：启动时生成非持久 boot UUID，校验 canonical capability digest，并由 Express middleware 按 protocol header 与 boot ID 返回稳定 426/400/409 错误及当前 boot header；尚未挂入 `qwen serve` profile、capabilities 或 Java 调用链。 | 已更新 Managed Agents 总览与私有协议专题，明确只落地 contract/middleware foundation。完整实现见 [implementations/pr-12409.md](implementations/pr-12409.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [Managed Agents 双链路方案](../../feature/managed-agents/README.md) | #12390/#12391/#12409(merged) | 修正 upstream 快照，区分 JDBC binding/session、Tool Execution 内存状态与 Hosted Harness contract foundation 的合入边界。 |
| [Runtime Broker JDBC 持久化](../../feature/managed-agents/managed-runtime-broker-jdbc.zh-CN.md) | #12390/#12391(merged) | 明确四表目标/分支证据与 upstream 三表实现的差异，Tool Execution JDBC 仍未进入 `main`。 |
| [Session / Harness / Runtime 私有协议](../../feature/managed-agents/managed-agent-control-protocol.md) | #12409(merged) | 登记 version/boot fence middleware 已合入，但 Hosted profile、鉴权后挂载与 Java 接线仍待实现。 |
| [SDK](../../feature/sdk.md) | #12390/#12391(merged) | 更新 Java Runtime Broker 模块的持久化与执行状态边界。 |
| [telemetry 可观测性](../../feature/telemetry-observability/README.md) | #12374(merged) | 登记 session debug log 的交互式 retention 方案及非交互入口边界。 |
| [feature索引](../../feature/README.md) | #12374/#12390/#12391/#12409 | 同步 W39 当前状态和入口。 |

_按个人 PR 口径更新于 2026-09-22_
