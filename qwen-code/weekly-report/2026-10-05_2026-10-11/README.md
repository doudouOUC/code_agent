# qwen-code PRs · 2026-10-05 ~ 2026-10-11 (W41 周内累计)

> 本文件已整理 2026-10-05 至 2026-10-11（Asia/Shanghai）创建的 @doudouOUC 个人 PR。以 author 和 createdAt 决定归属，更新/关闭/合入时间不用于新增统计；open 为当前 diff，closed 未合入为历史方案，均不能作为 `main` 能力。本次日更新增窗口为 2026-10-11 全天，向其原创建周补入 3 个 PR，并刷新此前已收录条目；本周创建窗口截至 2026-10-11 23:59:59。状态与规模快照更新于 2026-10-12，相关主干 `a8990042e648`。未创建空 W42 目录，周一 10:10 整周复核另行执行。

**主题**: 私有 CSI worker/本机隔离与原批次、publication 锁序/异步验证、JDBC 保留、公开 Shell 审批、WebShell cwd、Hosted G3、文件单源读取与 Java CI

**PR 统计**: 16 PRs - 8 merged / 6 open / 2 closed
**当前已合并 PR 代码量**: +10,417 / -574，131 个文件变更
**全量代码量**: +93,066 / -3,258，580 个文件变更
**类型分布**: feat ×10, fix ×5, other ×1
**范围 (scope)**: runtime ×3, runtime-broker ×2, managed-agent ×8, cli ×1, verify ×1, core ×1

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 代码量 | 文件数 | 创建时间(UTC) | 合并/关闭时间(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#13526](https://github.com/QwenLM/qwen-code/pull/13526) | 🟡 open | @doudouOUC | feat(runtime): add private CSI tool runtime execution | +54588/-1600 | 255 | 10-06 16:54 | - |
| [#13642](https://github.com/QwenLM/qwen-code/pull/13642) | 🟡 open | @doudouOUC | feat(runtime-broker): add bounded retention for terminal JDBC history | +2769/-11 | 28 | 10-08 03:06 | - |
| [#13654](https://github.com/QwenLM/qwen-code/pull/13654) | 🟡 open | @doudouOUC | feat(managed-agent): verify tool publications asynchronously | +2616/-74 | 22 | 10-08 05:09 | - |
| [#13655](https://github.com/QwenLM/qwen-code/pull/13655) | ✅ merged | @doudouOUC | fix(managed-agent): clear successful Workspace migration diagnostics | +103/-2 | 3 | 10-08 05:14 | 10-08 08:10 |
| [#13673](https://github.com/QwenLM/qwen-code/pull/13673) | ✅ merged | @doudouOUC | fix(managed-agent): recover original Hook sessions during Workspace retirement | +991/-21 | 13 | 10-08 10:33 | 10-11 15:41 |
| [#13674](https://github.com/QwenLM/qwen-code/pull/13674) | ✅ merged | @doudouOUC | feat(managed-agent): admit public foreground Shell with mandatory approval | +2163/-192 | 44 | 10-08 11:08 | 10-11 16:06 |
| [#13750](https://github.com/QwenLM/qwen-code/pull/13750) | ✅ merged | @doudouOUC | fix(cli): preserve complete Hosted no-tool model Parts | +299/-59 | 5 | 10-09 09:35 | 10-09 11:47 |
| [#13760](https://github.com/QwenLM/qwen-code/pull/13760) | ✅ merged | @doudouOUC | feat(managed-agent): support WebShell session cwd changes | +2161/-33 | 31 | 10-09 10:23 | 10-11 04:55 |
| [#13761](https://github.com/QwenLM/qwen-code/pull/13761) | 🔴 closed | @doudouOUC | feat(managed-agent): advertise WebShell cwd change capability | +205/-25 | 10 | 10-09 10:29 | 10-09 11:18 |
| [#13763](https://github.com/QwenLM/qwen-code/pull/13763) | ✅ merged | @doudouOUC | ci(verify): provision a Java toolchain for sdk-java PRs | +971/-17 | 8 | 10-09 10:51 | 10-09 15:00 |
| [#13772](https://github.com/QwenLM/qwen-code/pull/13772) | ✅ merged | @doudouOUC | fix(runtime): retain CSI mount identity through directory resolution | +2028/-111 | 9 | 10-09 12:43 | 10-11 04:03 |
| [#13776](https://github.com/QwenLM/qwen-code/pull/13776) | ✅ merged | @doudouOUC | feat(core): Keep complete file reads on one opened source | +1701/-139 | 18 | 10-09 14:08 | 10-11 04:17 |
| [#13777](https://github.com/QwenLM/qwen-code/pull/13777) | 🟡 open | @doudouOUC | feat(managed-agent): recover Hosted G3 parked turns | +8938/-741 | 79 | 10-09 14:11 | - |
| [#13893](https://github.com/QwenLM/qwen-code/pull/13893) | 🔴 closed | @doudouOUC | feat(runtime-broker): reserve the private CSI local-process boundary | +321/-0 | 6 | 10-11 09:02 | 10-11 12:52 |
| [#13894](https://github.com/QwenLM/qwen-code/pull/13894) | 🟡 open | @doudouOUC | fix(managed-agent): order publication placement before retention | +374/-42 | 6 | 10-11 09:08 | - |
| [#13899](https://github.com/QwenLM/qwen-code/pull/13899) | 🟡 open | @doudouOUC | feat(runtime): add private CSI file worker with local-process isolation | +12838/-191 | 43 | 10-11 10:35 | - |

---

## PR 解决问题、实现方式与 feature 处理

| PR | 解决了什么问题 | 最终怎么实现（open/closed 只登记当前观察） | 对应 feature 文档 |
|---|---|---|---|
| [#13526](https://github.com/QwenLM/qwen-code/pull/13526) | 已合入 CSI worker 基础仍缺 Hosted 私有对话、文件 history 与原 activation 的完整证明。 | 当前 diff 冻结原工具批次/intent 后执行文件工具；冷恢复核对整个已结算批次的 input/definition/grant/checkpoint，不重放副作用。还包含 generic retention 原身份对账，与 worker/锁序拆分仍有重叠。 | 已同步 Managed Agents 的 open 口径；完整观察见 [implementations/pr-13526.md](implementations/pr-13526.md)。 |
| [#13642](https://github.com/QwenLM/qwen-code/pull/13642) | 终态 binding/session/execution 历史无上限增长，直接删除会破坏 Workspace、publication 和子运行引用。 | 当前 diff 的 JdbcRuntimeRetention 以数据库时间、游标和有界 batch 分阶段扫描终态记录，在 slot/行锁内核对年龄、状态和 claim；Managed reference guard 排除仍被 holder/publication/未结算 lineage 引用的记录。 | 已同步Managed Agents的open口径；完整观察见 [implementations/pr-13642.md](implementations/pr-13642.md)。 |
| [#13654](https://github.com/QwenLM/qwen-code/pull/13654) | 大 publication 验证占据请求预算，失败或暂时失效的 operation 可能阻塞清理。 | 当前 diff 持久 PENDING/claim/轮询，以 epoch/deadline fence 旧提交；CLAIM 可完成原已接受任务，暂时 activation 失效退避。失败 finish 撤销原 candidate/charge；collector 仍要求 objects VERIFIED。 | 已同步完整工具结果的 open 口径；完整观察见 [implementations/pr-13654.md](implementations/pr-13654.md)。 |
| [#13655](https://github.com/QwenLM/qwen-code/pull/13655) | 迁移失败后重试成功，last_error_code 若残留，会让操作员把已完成阶段误读为仍失败。 | migration 成功状态更新同时将 last_error_code 置空；保持原 operation/result 和状态校验，测试覆盖失败后成功路径。 | 已同步恢复与运维的merged口径；完整实现见 [implementations/pr-13655.md](implementations/pr-13655.md)。 |
| [#13673](https://github.com/QwenLM/qwen-code/pull/13673) | Hook 的原 Runtime Session 在冷恢复/退休时缺 live handle，直接 release 会遗留 holder 或误删不确定资源。 | 已合入：观察原 binding/session 与持久 drain receipt，在无活跃 execution、stop 证据和精确 holder 匹配下同事务结算 stopped release；不确定原资源仍阻塞。 | 已同步恢复与运维的 merged 口径；完整实现见 [implementations/pr-13673.md](implementations/pr-13673.md)。 |
| [#13674](https://github.com/QwenLM/qwen-code/pull/13674) | 公共 Workspace 开放 Shell 若缺部署门禁与 asking mode 会绕过确认或隐式开放其它工具。 | 已合入：独立默认关闭 Shell 开关，持久复核 default/auto-edit 和 foregroundShell；create/load 抑制 child agent，公共 Shell 生命周期仍拒绝，原键/取消不绕过 files 总准入。 | 已同步 Managed Agents 的 merged 口径；完整实现见 [implementations/pr-13674.md](implementations/pr-13674.md)。 |
| [#13750](https://github.com/QwenLM/qwen-code/pull/13750) | Hosted 无工具回答丢失 thought/signature 等模型 Parts，thought-only 被误判为已回答。 | 已合入：校验并复制完整最后模型 Parts，再按展示抑制返回；历史过滤只把非 thought 文本认作回答。 | 已同步 Managed Agents；完整实现见 [implementations/pr-13750.md](implementations/pr-13750.md)。 |
| [#13760](https://github.com/QwenLM/qwen-code/pull/13760) | WebShell 无 cwd 入口/可信 capability，超时换键或提前发送会混淆目录 revision。 | 已合入：批量核验 OPERATOR/OWNER 与原创建 actor execution facts；持久原 revision/目标/键，原 operation completed 且摘要追平才解输入屏障，401/404/408/429 保留未确认意图。 | 已同步 Workspace/cwd 双语与总览；完整实现见 [implementations/pr-13760.md](implementations/pr-13760.md)。 |
| [#13761](https://github.com/QwenLM/qwen-code/pull/13761) | Session DTO 缺少基于当前部署/Workspace/用户的 cwdChange 能力。 | 关闭前方案批量核验 creator、ACTIVE、files 开关、冻结 generation/storage、registry 与 grant，派生 DTO/OpenAPI capability；不包含 UI。 | 仅保留 Workspace/cwd 历史观察；完整记录见 [implementations/pr-13761.md](implementations/pr-13761.md)。 |
| [#13763](https://github.com/QwenLM/qwen-code/pull/13763) | verify 容器缺 Java/Maven 和 sibling 依赖，可能误报 Java 已覆盖。 | 已合入：sdk-java diff 才准备可信固定工具链，PR 只 restore cache；无 token 安装 siblings，可信 main producer 去旧 JAR。失败明确 Not covered。 | CI 支撑边界写入 Managed Agents；完整实现见 [implementations/pr-13763.md](implementations/pr-13763.md)。 |
| [#13772](https://github.com/QwenLM/qwen-code/pull/13772) | CSI 身份核验与 pathname cwd 解析之间可发生 root/目录替换及关闭竞态。 | 已合入：固定根 descriptor，前后核验 mount/disk/dev/inode；逐级 no-follow、逆序关闭并 join 观察/借用，永久 fence，启动/关闭聚合原错误和清理错误。 | 已同步 Managed Agents；完整实现见 [implementations/pr-13772.md](implementations/pr-13772.md)。 |
| [#13776](https://github.com/QwenLM/qwen-code/pull/13776) | sniff/内容/PDF 重开路径会读取不同版本，特殊文件的打开还有副作用。 | 已合入：先分类，Linux/macOS 非空普通文件的 read_file pipeline 共用 descriptor，PDF 继承 FD 3，失败撤销本次 cache 记录；特殊/空文件及平台/Omni/custom service 保留兼容路径。 | 已同步文件读取；完整实现见 [implementations/pr-13776.md](implementations/pr-13776.md)。 |
| [#13777](https://github.com/QwenLM/qwen-code/pull/13777) | 替代 Harness 缺原模型请求、审批批次和清理 debt，停靠 Turn 无法准确续跑。 | 当前 diff 持久请求/原批次/cleanup，证据完整才继续，原 owner 释放失败保留屏障；wake ID 稳定映射为 path-safe Runtime Session，审批只核对原 assistant 之后的事件。 | 已同步恢复与运维；完整观察见 [implementations/pr-13777.md](implementations/pr-13777.md)。 |
| [#13893](https://github.com/QwenLM/qwen-code/pull/13893) | 本机 provisioner 可能误接私有 CSI capability，混淆原挂载/Session。 | 关闭前方案固定私有 profile 与规范 UUID/挂载身份，并在本机 provision/recovery/release 前拒绝，无 spawn/注册副作用；相同代码也在 #13899 open diff，不能写成主干能力。 | Managed Agents/JDBC Broker 保留关闭观察；完整记录见 [implementations/pr-13893.md](implementations/pr-13893.md)。 |
| [#13894](https://github.com/QwenLM/qwen-code/pull/13894) | publication 与 admission 的 placement/retention 反向锁序可死锁，外层 preflight 会保留锁。 | 当前 diff 先认证实际 publication/binding/Runtime，再统一 placement-first；外层 preflight 同序，锁后复核 scope/digest，保留普通/K1 语义，不引入私有 CSI 资格。 | 同步完整工具结果双语与总览；完整观察见 [implementations/pr-13894.md](implementations/pr-13894.md)。 |
| [#13899](https://github.com/QwenLM/qwen-code/pull/13899) | CSI 缺独立文件/history owner，pathname 与直接输入不能证明原调用授权。 | 当前 diff 隔离私有 v4/v5 worker，v5 按 native readback/原 prepared history 执行；descriptor/no-follow IO、备份 pin/inventory、永久 fence；drain 保持 BLOCKED，local-process 拒绝私有摘要。 | 同步 Managed Agents/JDBC Broker；完整观察见 [implementations/pr-13899.md](implementations/pr-13899.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [Managed Agents](../../feature/managed-agents/README.md) | #13526(open), #13642(open), #13654(open), #13655(merged), #13673(merged), #13674(merged), #13750(merged), #13760(merged), #13761(closed), #13763(merged), #13772(merged), #13777(open), #13893(closed), #13894(open), #13899(open) | 同步合入状态、原批次/worker/锁序拆分及迁移编号，保留默认关闭和原资源边界。 |
| [Workspace/cwd 中文](../../feature/managed-agents/managed-agent-workspace-context.md) / [English](../../feature/managed-agents/managed-agent-workspace-context.en.md) | #13760(merged), #13761(closed) | WebShell 最终 capability 使用 OPERATOR 与 execution facts；原键拒绝/确认机制和历史方案分开。 |
| [完整工具结果中文](../../feature/managed-agents/managed-agent-tool-result-artifacts.zh-CN.md) / [English](../../feature/managed-agents/managed-agent-tool-result-artifacts.md) | #13654(open), #13894(open) | 补充原 CLAIM、activation 退避、失败 finish 回滚和 placement-first 拆分；不提前启用 verifier。 |
| [恢复与运维](../../feature/managed-agents/managed-agent-recovery-operations.md) | #13655(merged), #13673(merged), #13777(open) | 原 Hook 恢复已合入；G3 保留原批次、wake ID、清理与 reader-version 边界。 |
| [JDBC Broker 中文](../../feature/managed-agents/managed-runtime-broker-jdbc.zh-CN.md) | #13642(open), #13893(closed), #13899(open) | retention V68 集成风险与私有 profile/local-process 拒绝单独记录。 |
| [文件读取](../../feature/file-reading.md) / [Feature 总览](../../feature/README.md) | #13776(merged) | 最终非空普通文件单 descriptor/PDF FD 继承；保留空/特殊文件、平台/Omni 兼容及同 inode 可变限制。 |

_按个人 PR 口径更新于 2026-10-12_
