# qwen-code PRs · 2026-10-05 ~ 2026-10-11 (W41 最终版)

> 本文件已整理 2026-10-05 00:00:00 至 2026-10-11 23:59:59（Asia/Shanghai）创建的 @doudouOUC 个人 PR，对应 UTC 半开窗口 `[2026-10-04T16:00:00Z, 2026-10-11T16:00:00Z)`。周更重新查询整周集合，与午夜日更的 16 个 PR 一致，没有遗漏或跨周补收。以 author 和 createdAt 决定归属，更新/关闭/合入时间不用于新增统计；open 为当前 diff，closed 未合入为历史方案，均不能作为 `main` 能力。本次完成未提交周更并刷新后续合入，状态与规模取 2026-10-13 快照，相关主干 `18f80f56666a`；“最终版”指整周创建集合核验完成，不表示所有 PR 都已合入或源码门禁通过。

**主题**: 私有 CSI worker/本机隔离与原批次、publication 锁序/异步验证、JDBC 保留、公开 Shell 审批、WebShell cwd、Hosted G3、文件单源读取与 Java CI

**PR 统计**: 16 PRs - 12 merged / 2 open / 2 closed
**当前已合并 PR 代码量**: +39,188 / -2,037，296 个文件变更
**全量代码量**: +118,387 / -3,889，697 个文件变更
**类型分布**: feat ×10, fix ×5, other ×1
**范围 (scope)**: runtime ×3, runtime-broker ×2, managed-agent ×8, cli ×1, verify ×1, core ×1

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 代码量 | 文件数 | 创建时间(UTC) | 合并/关闭时间(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#13526](https://github.com/QwenLM/qwen-code/pull/13526) | 🟡 open | @doudouOUC | feat(runtime): add private CSI tool runtime execution | +75601/-1801 | 354 | 10-06 16:54 | - |
| [#13642](https://github.com/QwenLM/qwen-code/pull/13642) | 🟡 open | @doudouOUC | feat(runtime-broker): add bounded retention for terminal JDBC history | +3072/-26 | 31 | 10-08 03:06 | - |
| [#13654](https://github.com/QwenLM/qwen-code/pull/13654) | ✅ merged | @doudouOUC | feat(managed-agent): verify tool publications asynchronously | +2792/-89 | 23 | 10-08 05:09 | 10-12 13:02 |
| [#13655](https://github.com/QwenLM/qwen-code/pull/13655) | ✅ merged | @doudouOUC | fix(managed-agent): clear successful Workspace migration diagnostics | +103/-2 | 3 | 10-08 05:14 | 10-08 08:10 |
| [#13673](https://github.com/QwenLM/qwen-code/pull/13673) | ✅ merged | @doudouOUC | fix(managed-agent): recover original Hook sessions during Workspace retirement | +991/-21 | 13 | 10-08 10:33 | 10-11 15:41 |
| [#13674](https://github.com/QwenLM/qwen-code/pull/13674) | ✅ merged | @doudouOUC | feat(managed-agent): admit public foreground Shell with mandatory approval | +2163/-192 | 44 | 10-08 11:08 | 10-11 16:06 |
| [#13750](https://github.com/QwenLM/qwen-code/pull/13750) | ✅ merged | @doudouOUC | fix(cli): preserve complete Hosted no-tool model Parts | +299/-59 | 5 | 10-09 09:35 | 10-09 11:47 |
| [#13760](https://github.com/QwenLM/qwen-code/pull/13760) | ✅ merged | @doudouOUC | feat(managed-agent): support WebShell session cwd changes | +2161/-33 | 31 | 10-09 10:23 | 10-11 04:55 |
| [#13761](https://github.com/QwenLM/qwen-code/pull/13761) | 🔴 closed | @doudouOUC | feat(managed-agent): advertise WebShell cwd change capability | +205/-25 | 10 | 10-09 10:29 | 10-09 11:18 |
| [#13763](https://github.com/QwenLM/qwen-code/pull/13763) | ✅ merged | @doudouOUC | ci(verify): provision a Java toolchain for sdk-java PRs | +971/-17 | 8 | 10-09 10:51 | 10-09 15:00 |
| [#13772](https://github.com/QwenLM/qwen-code/pull/13772) | ✅ merged | @doudouOUC | fix(runtime): retain CSI mount identity through directory resolution | +2028/-111 | 9 | 10-09 12:43 | 10-11 04:03 |
| [#13776](https://github.com/QwenLM/qwen-code/pull/13776) | ✅ merged | @doudouOUC | feat(core): Keep complete file reads on one opened source | +1701/-139 | 18 | 10-09 14:08 | 10-11 04:17 |
| [#13777](https://github.com/QwenLM/qwen-code/pull/13777) | ✅ merged | @doudouOUC | feat(managed-agent): recover Hosted G3 parked turns | +11474/-1141 | 92 | 10-09 14:11 | 10-12 13:06 |
| [#13893](https://github.com/QwenLM/qwen-code/pull/13893) | 🔴 closed | @doudouOUC | feat(runtime-broker): reserve the private CSI local-process boundary | +321/-0 | 6 | 10-11 09:02 | 10-11 12:52 |
| [#13894](https://github.com/QwenLM/qwen-code/pull/13894) | ✅ merged | @doudouOUC | fix(managed-agent): order publication placement before retention | +693/-42 | 7 | 10-11 09:08 | 10-12 04:19 |
| [#13899](https://github.com/QwenLM/qwen-code/pull/13899) | ✅ merged | @doudouOUC | feat(runtime): add private CSI file worker with local-process isolation | +13812/-191 | 43 | 10-11 10:35 | 10-12 13:06 |

---

## PR 解决问题、实现方式与 feature 处理

| PR | 解决了什么问题 | 最终怎么实现（open/closed 只登记当前观察） | 对应 feature 文档 |
|---|---|---|---|
| [#13526](https://github.com/QwenLM/qwen-code/pull/13526) | 已合入 worker 仍缺完整 CSI Hosted/原 activation 与最终应用清理证明。 | 当前 diff 冻结原批次，恢复只消费原已结算结果；boot6 固定原 CUT/hash，join 并复核 inventory 后关闭 descriptor，DRAINED 不证明 Pod/卷释放。generic retention 原身份保护仍是分支观察。 | 已同步 Managed Agents 的 open 口径；完整观察见 [implementations/pr-13526.md](implementations/pr-13526.md)。 |
| [#13642](https://github.com/QwenLM/qwen-code/pull/13642) | 终态 binding/session/execution 历史无上限增长，直接删除会破坏 Workspace、publication 和子运行引用。 | 当前 diff 以数据库时间、游标和有界 batch 扫描，锁内复核原引用；V69/lease 索引，DAYS maxAge/MILLIS scanDelay，未结算 background_shell 原 process 行受保护。writer 锁协议与独立 Hosted cleanup 释放证明均验证前 cleanup 关闭。 | 已同步 Managed Agents/JDBC 的 open 口径；完整观察见 [implementations/pr-13642.md](implementations/pr-13642.md)。 |
| [#13654](https://github.com/QwenLM/qwen-code/pull/13654) | 大 publication 验证占据请求预算，授权/恢复 fence 与对象损坏混淆可能误伤原 candidate。 | 已合入：持久 PENDING/claim/轮询，未知读异常可退避；recovery block/原身份冲突永久 fenced，但健康 resource candidate 不误 quarantine，FINISHING 按原 operation 回滚 terminal candidate/charge。collector 仍要求 objects VERIFIED。 | 已同步完整工具结果的 merged 口径；完整实现见 [implementations/pr-13654.md](implementations/pr-13654.md)。 |
| [#13655](https://github.com/QwenLM/qwen-code/pull/13655) | 迁移失败后重试成功，last_error_code 若残留，会让操作员把已完成阶段误读为仍失败。 | migration 成功状态更新同时将 last_error_code 置空；保持原 operation/result 和状态校验，测试覆盖失败后成功路径。 | 已同步恢复与运维的merged口径；完整实现见 [implementations/pr-13655.md](implementations/pr-13655.md)。 |
| [#13673](https://github.com/QwenLM/qwen-code/pull/13673) | Hook 的原 Runtime Session 在冷恢复/退休时缺 live handle，直接 release 会遗留 holder 或误删不确定资源。 | 已合入：观察原 binding/session 与持久 drain receipt，在无活跃 execution、stop 证据和精确 holder 匹配下同事务结算 stopped release；不确定原资源仍阻塞。 | 已同步恢复与运维的 merged 口径；完整实现见 [implementations/pr-13673.md](implementations/pr-13673.md)。 |
| [#13674](https://github.com/QwenLM/qwen-code/pull/13674) | 公共 Workspace 开放 Shell 若缺部署门禁与 asking mode 会绕过确认或隐式开放其它工具。 | 已合入：独立默认关闭 Shell 开关，持久复核 default/auto-edit 和 foregroundShell；create/load 抑制 child agent，公共 Shell 生命周期仍拒绝，原键/取消不绕过 files 总准入。 | 已同步 Managed Agents 的 merged 口径；完整实现见 [implementations/pr-13674.md](implementations/pr-13674.md)。 |
| [#13750](https://github.com/QwenLM/qwen-code/pull/13750) | Hosted 无工具回答丢失 thought/signature 等模型 Parts，thought-only 被误判为已回答。 | 已合入：校验并复制完整最后模型 Parts，再按展示抑制返回；历史过滤只把非 thought 文本认作回答。 | 已同步 Managed Agents；完整实现见 [implementations/pr-13750.md](implementations/pr-13750.md)。 |
| [#13760](https://github.com/QwenLM/qwen-code/pull/13760) | WebShell 无 cwd 入口/可信 capability，超时换键或提前发送会混淆目录 revision。 | 已合入：批量核验 OPERATOR/OWNER 与原创建 actor execution facts；持久原 revision/目标/键，原 operation completed 且摘要追平才解输入屏障，401/404/408/429 保留未确认意图。 | 已同步 Workspace/cwd 双语与总览；完整实现见 [implementations/pr-13760.md](implementations/pr-13760.md)。 |
| [#13761](https://github.com/QwenLM/qwen-code/pull/13761) | Session DTO 缺少基于当前部署/Workspace/用户的 cwdChange 能力。 | 关闭前方案批量核验 creator、ACTIVE、files 开关、冻结 generation/storage、registry 与 grant，派生 DTO/OpenAPI capability；不包含 UI。 | 仅保留 Workspace/cwd 历史观察；完整记录见 [implementations/pr-13761.md](implementations/pr-13761.md)。 |
| [#13763](https://github.com/QwenLM/qwen-code/pull/13763) | verify 容器缺 Java/Maven 和 sibling 依赖，可能误报 Java 已覆盖。 | 已合入：sdk-java diff 才准备可信固定工具链，PR 只 restore cache；无 token 安装 siblings，可信 main producer 去旧 JAR。失败明确 Not covered。 | CI 支撑边界写入 Managed Agents；完整实现见 [implementations/pr-13763.md](implementations/pr-13763.md)。 |
| [#13772](https://github.com/QwenLM/qwen-code/pull/13772) | CSI 身份核验与 pathname cwd 解析之间可发生 root/目录替换及关闭竞态。 | 已合入：固定根 descriptor，前后核验 mount/disk/dev/inode；逐级 no-follow、逆序关闭并 join 观察/借用，永久 fence，启动/关闭聚合原错误和清理错误。 | 已同步 Managed Agents；完整实现见 [implementations/pr-13772.md](implementations/pr-13772.md)。 |
| [#13776](https://github.com/QwenLM/qwen-code/pull/13776) | sniff/内容/PDF 重开路径会读取不同版本，特殊文件的打开还有副作用。 | 已合入：先分类，Linux/macOS 非空普通文件的 read_file pipeline 共用 descriptor，PDF 继承 FD 3，失败撤销本次 cache 记录；特殊/空文件及平台/Omni/custom service 保留兼容路径。 | 已同步文件读取；完整实现见 [implementations/pr-13776.md](implementations/pr-13776.md)。 |
| [#13777](https://github.com/QwenLM/qwen-code/pull/13777) | 替代 Harness 缺原请求、审批和清理 debt，长 wake ID/close 竞态还可能破坏原回合。 | 已合入：持久请求/原批次/cleanup，wake prepare 和长 cleanup ID 保持稳定原身份；resident redrive 与 close 互斥复核，图片引用快照不冷重发，原 owner 释放失败保留屏障。 | 已同步恢复与运维；完整实现见 [implementations/pr-13777.md](implementations/pr-13777.md)。 |
| [#13893](https://github.com/QwenLM/qwen-code/pull/13893) | 本机 provisioner 可能误接私有 CSI capability，混淆原挂载/Session。 | 关闭前方案在本机 provision/recovery/release 前拒绝私有 profile，无 spawn/注册副作用；同类边界已由 #13899 合入，不把本关闭 PR 算作合入来源。 | Managed Agents/JDBC Broker 保留关闭观察；完整记录见 [implementations/pr-13893.md](implementations/pr-13893.md)。 |
| [#13894](https://github.com/QwenLM/qwen-code/pull/13894) | publication 与 admission 的 placement/retention 反向锁序可死锁，外层 preflight 会保留锁。 | 已合入：先认证实际 publication/binding/Runtime，再统一 placement-first；外层 preflight 同序，锁后复核 scope/digest。新增五种入口的真实 MySQL 等锁 IT，但本次未执行，不引入私有 CSI 资格。 | 同步完整工具结果双语与总览；完整实现见 [implementations/pr-13894.md](implementations/pr-13894.md)。 |
| [#13899](https://github.com/QwenLM/qwen-code/pull/13899) | CSI 缺独立文件/history owner，准备/部分写入失败可能留下无法证明的 retained 效果。 | 已合入：隔离私有 worker，以原 readback/prepared history 执行；预拒绝 history 容量、失败后对账或 retirement fence，部分文件写入尝试原 inode 回滚；seal 封 executor，drain 仍 BLOCKED。 | 同步 Managed Agents/JDBC Broker；完整实现见 [implementations/pr-13899.md](implementations/pr-13899.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [Managed Agents](../../feature/managed-agents/README.md) | #13526(open), #13642(open), #13654(merged), #13655(merged), #13673(merged), #13674(merged), #13750(merged), #13760(merged), #13761(closed), #13763(merged), #13772(merged), #13777(merged), #13893(closed), #13894(merged), #13899(merged) | 同步合入状态、原批次/worker/锁序拆分及迁移编号，保留默认关闭和原资源边界。 |
| [Workspace/cwd 中文](../../feature/managed-agents/managed-agent-workspace-context.md) / [English](../../feature/managed-agents/managed-agent-workspace-context.en.md) | #13760(merged), #13761(closed) | WebShell 最终 capability 使用 OPERATOR 与 execution facts；原键拒绝/确认机制和历史方案分开。 |
| [完整工具结果中文](../../feature/managed-agents/managed-agent-tool-result-artifacts.zh-CN.md) / [English](../../feature/managed-agents/managed-agent-tool-result-artifacts.md) | #13654(merged), #13894(merged) | 补充 typed failure、永久 recovery fence 与未知读故障保全、MySQL 锁序 IT；不提前启用 verifier 或宣布测试通过。 |
| [恢复与运维](../../feature/managed-agents/managed-agent-recovery-operations.md) | #13655(merged), #13673(merged), #13777(merged) | 原 Hook 已合入；G3 补长 ID、resident/close、图片快照和清理屏障边界。 |
| [JDBC Broker 中文](../../feature/managed-agents/managed-runtime-broker-jdbc.zh-CN.md) / [English](../../feature/managed-agents/managed-runtime-broker-jdbc.md) | #13642(open), #13893(closed), #13899(merged) | retention V69/lease 索引与私有 worker 容量/回滚/historyFailed/ seal 边界分开记录。 |
| [文件读取](../../feature/file-reading.md) / [Feature 总览](../../feature/README.md) | #13776(merged) | 最终非空普通文件单 descriptor/PDF FD 继承；保留空/特殊文件、平台/Omni 兼容及同 inode 可变限制。 |

_按个人 PR 口径更新于 2026-10-13_
