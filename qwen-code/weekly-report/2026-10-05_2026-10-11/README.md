# qwen-code PRs · 2026-10-05 ~ 2026-10-11 (W41 周内累计)

> 本文件已整理 2026-10-05 至 2026-10-11（Asia/Shanghai）创建的 @doudouOUC 个人 PR。以 author 和 createdAt 决定归属，更新/关闭/合入时间不用于新增统计；open 为当前 diff，closed 未合入为历史方案，均不能作为 `main` 能力。本次创建窗口截至 2026-10-09 23:59:59。状态与规模快照更新于 2026-10-10，相关主干 `5b1c701400c9`。

**主题**: 私有 CSI 与挂载身份、JDBC/异步 publication、WebShell cwd、Hosted Parts/G3 恢复、完整文件单源读取与 Java CI

**PR 统计**: 13 PRs - 3 merged / 9 open / 1 closed
**当前已合并 PR 代码量**: +1,373 / -78，16 个文件变更
**全量代码量**: +67,908 / -2,547，448 个文件变更
**类型分布**: feat ×8, fix ×4, other ×1
**范围 (scope)**: runtime ×2, runtime-broker ×1, managed-agent ×7, cli ×1, core ×1, verify ×1

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 代码量 | 文件数 | 创建时间(UTC) | 合并/关闭时间(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#13526](https://github.com/QwenLM/qwen-code/pull/13526) | 🟡 open | @doudouOUC | feat(runtime): add private CSI tool runtime execution | +46219/-1339 | 207 | 10-06 16:54 | - |
| [#13642](https://github.com/QwenLM/qwen-code/pull/13642) | 🟡 open | @doudouOUC | feat(runtime-broker): add bounded retention for terminal JDBC history | +2736/-11 | 28 | 10-08 03:06 | - |
| [#13654](https://github.com/QwenLM/qwen-code/pull/13654) | 🟡 open | @doudouOUC | feat(managed-agent): verify tool publications asynchronously | +2329/-61 | 21 | 10-08 05:09 | - |
| [#13655](https://github.com/QwenLM/qwen-code/pull/13655) | ✅ merged | @doudouOUC | fix(managed-agent): clear successful Workspace migration diagnostics | +103/-2 | 3 | 10-08 05:14 | 10-08 08:10 |
| [#13673](https://github.com/QwenLM/qwen-code/pull/13673) | 🟡 open | @doudouOUC | fix(managed-agent): recover original Hook sessions during Workspace retirement | +989/-21 | 13 | 10-08 10:33 | - |
| [#13674](https://github.com/QwenLM/qwen-code/pull/13674) | 🟡 open | @doudouOUC | feat(managed-agent): admit public foreground Shell with mandatory approval | +1268/-69 | 25 | 10-08 11:08 | - |
| [#13750](https://github.com/QwenLM/qwen-code/pull/13750) | ✅ merged | @doudouOUC | fix(cli): preserve complete Hosted no-tool model Parts | +299/-59 | 5 | 10-09 09:35 | 10-09 11:47 |
| [#13760](https://github.com/QwenLM/qwen-code/pull/13760) | 🟡 open | @doudouOUC | feat(managed-agent): support WebShell session cwd changes | +2116/-39 | 33 | 10-09 10:23 | - |
| [#13761](https://github.com/QwenLM/qwen-code/pull/13761) | 🔴 closed | @doudouOUC | feat(managed-agent): advertise WebShell cwd change capability | +205/-25 | 10 | 10-09 10:29 | 10-09 11:18 |
| [#13763](https://github.com/QwenLM/qwen-code/pull/13763) | ✅ merged | @doudouOUC | ci(verify): provision a Java toolchain for sdk-java PRs | +971/-17 | 8 | 10-09 10:51 | 10-09 15:00 |
| [#13772](https://github.com/QwenLM/qwen-code/pull/13772) | 🟡 open | @doudouOUC | fix(runtime): retain CSI mount identity through directory resolution | +1414/-112 | 8 | 10-09 12:43 | - |
| [#13776](https://github.com/QwenLM/qwen-code/pull/13776) | 🟡 open | @doudouOUC | feat(core): Keep complete file reads on one opened source | +1518/-139 | 18 | 10-09 14:08 | - |
| [#13777](https://github.com/QwenLM/qwen-code/pull/13777) | 🟡 open | @doudouOUC | feat(managed-agent): recover Hosted G3 parked turns | +7741/-653 | 69 | 10-09 14:11 | - |

---

## PR 解决问题、实现方式与 feature 处理

| PR | 解决了什么问题 | 最终怎么实现（open/closed 只登记当前观察） | 对应 feature 文档 |
|---|---|---|---|
| [#13526](https://github.com/QwenLM/qwen-code/pull/13526) | 已合入 CSI worker 基础仍缺 Hosted 私有对话、文件 history 与原 activation 的完整证明。 | 当前 diff 持久冻结原工具批次、intent 与 await_runtime 后真实执行 Read/Write/Edit；worker 核验原证据及 prepared history，完整 receipt/消息提交后才消费等待结果。冷恢复只继续已结算结果，不重放原工具。 | 已同步Managed Agents的open口径；完整观察见 [implementations/pr-13526.md](implementations/pr-13526.md)。 |
| [#13642](https://github.com/QwenLM/qwen-code/pull/13642) | 终态 binding/session/execution 历史无上限增长，直接删除会破坏 Workspace、publication 和子运行引用。 | 当前 diff 的 JdbcRuntimeRetention 以数据库时间、游标和有界 batch 分阶段扫描终态记录，在 slot/行锁内核对年龄、状态和 claim；Managed reference guard 排除仍被 holder/publication/未结算 lineage 引用的记录。 | 已同步Managed Agents的open口径；完整观察见 [implementations/pr-13642.md](implementations/pr-13642.md)。 |
| [#13654](https://github.com/QwenLM/qwen-code/pull/13654) | 大 publication 的 seal/terminal 验证占据请求预算，失败 operation 还可能永久阻塞清理。 | 当前 diff 持久提交 PENDING，再由有界 verifier claim/验证和原 operation 轮询；epoch/deadline fence 旧提交。FAILED 也算终态，但 collector 仍要求全部 objects VERIFIED。 | 已同步完整工具结果的open口径；完整观察见 [implementations/pr-13654.md](implementations/pr-13654.md)。 |
| [#13655](https://github.com/QwenLM/qwen-code/pull/13655) | 迁移失败后重试成功，last_error_code 若残留，会让操作员把已完成阶段误读为仍失败。 | migration 成功状态更新同时将 last_error_code 置空；保持原 operation/result 和状态校验，测试覆盖失败后成功路径。 | 已同步恢复与运维的merged口径；完整实现见 [implementations/pr-13655.md](implementations/pr-13655.md)。 |
| [#13673](https://github.com/QwenLM/qwen-code/pull/13673) | Hook 的原 Runtime Session 在冷恢复/退休时缺 live handle，直接 release 会遗留 holder 或误删不确定资源。 | 当前 diff 根据原 binding/session 观察并使用已持久 drain receipt；在无活跃 execution、stop 证据和精确 holder 匹配下，同事务结算 stopped Session release。无法确认的原资源继续阻塞。 | 已同步恢复与运维的open口径；完整观察见 [implementations/pr-13673.md](implementations/pr-13673.md)。 |
| [#13674](https://github.com/QwenLM/qwen-code/pull/13674) | 公共 Workspace 创建仍使用 files profile，开放 Shell 若没有部署门禁与 asking mode 会绕过用户确认。 | 当前 diff 以独立 Shell 开关选定 shell/1，持久并复核 default/auto-edit；fresh sending 还需 foregroundShell capability。Shell 开关关闭保留原 key/取消结算，但不绕过 Workspace files 总准入开关；Shell 生命周期仍不开放。 | 已同步Managed Agents的open口径；完整观察见 [implementations/pr-13674.md](implementations/pr-13674.md)。 |
| [#13750](https://github.com/QwenLM/qwen-code/pull/13750) | Hosted 无工具回答丢失 thought/signature 等模型 Parts，thought-only 被误判为已回答。 | 已合入：校验并复制完整最后模型 Parts，再按展示抑制返回；历史过滤只把非 thought 文本认作回答。 | 已同步 Managed Agents；完整实现见 [implementations/pr-13750.md](implementations/pr-13750.md)。 |
| [#13760](https://github.com/QwenLM/qwen-code/pull/13760) | WebShell 无 cwd 入口/可信 capability，超时换键或提前发送会混淆目录 revision。 | 当前 diff 批量核验 capability；先持久原 revision/目标/幂等键，轮询原 operation，completed 且摘要追平后才解输入屏障。不确定结果保留原意图。 | 已同步 Workspace/cwd 双语与总览；完整观察见 [implementations/pr-13760.md](implementations/pr-13760.md)。 |
| [#13761](https://github.com/QwenLM/qwen-code/pull/13761) | Session DTO 缺少基于当前部署/Workspace/用户的 cwdChange 能力。 | 关闭前方案批量核验 creator、ACTIVE、files 开关、冻结 generation/storage、registry 与 grant，派生 DTO/OpenAPI capability；不包含 UI。 | 仅保留 Workspace/cwd 历史观察；完整记录见 [implementations/pr-13761.md](implementations/pr-13761.md)。 |
| [#13763](https://github.com/QwenLM/qwen-code/pull/13763) | verify 容器缺 Java/Maven 和 sibling 依赖，可能误报 Java 已覆盖。 | 已合入：sdk-java diff 才准备可信固定工具链，PR 只 restore cache；无 token 安装 siblings，可信 main producer 去旧 JAR。失败明确 Not covered。 | CI 支撑边界写入 Managed Agents；完整实现见 [implementations/pr-13763.md](implementations/pr-13763.md)。 |
| [#13772](https://github.com/QwenLM/qwen-code/pull/13772) | CSI 身份核验与 pathname cwd 解析之间可发生 root/目录替换及关闭竞态。 | 当前 diff 固定根 descriptor，前后核验 mount/disk/dev/inode；逐级 O_NOFOLLOW 解析、逆序关闭，join 借用和观察，异常永久 fence。 | 已同步 Managed Agents；完整观察见 [implementations/pr-13772.md](implementations/pr-13772.md)。 |
| [#13776](https://github.com/QwenLM/qwen-code/pull/13776) | stat/sniff/内容/PDF 多次打开路径会读取不同文件版本。 | 当前 diff 将 read_file pipeline 包在单 descriptor scope，内容/缓存/媒体共用源，PDF 继承 FD 3；平台/Omni/custom service 保留兼容路径。 | 已同步文件读取；完整观察见 [implementations/pr-13776.md](implementations/pr-13776.md)。 |
| [#13777](https://github.com/QwenLM/qwen-code/pull/13777) | 替代 Harness 缺原模型请求、审批批次和清理 debt，停靠 Turn 无法准确续跑。 | 当前 diff 持久精确请求/原批次/cleanup；仅证据完整才重发模型或续原生审批，已提交回答只补终态；原 owner 释放失败保留屏障，reader floor 保护新记录。 | 已同步恢复与运维；完整观察见 [implementations/pr-13777.md](implementations/pr-13777.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [Managed Agents](../../feature/managed-agents/README.md) | #13526(open), #13642(open), #13654(open), #13655(merged), #13673(open), #13674(open), #13750(merged), #13760(open), #13761(closed), #13763(merged), #13772(open), #13777(open) | 总览区分已合入 Parts/CI 与未合入 cwd/G3/CSI 等方案，并保持原执行身份边界。 |
| [Workspace/cwd 中文](../../feature/managed-agents/managed-agent-workspace-context.md) / [English](../../feature/managed-agents/managed-agent-workspace-context.en.md) | #13760(open), #13761(closed) | 区分已有 Java operation、open WebShell 意图/确认机制与 closed capability-only 观察。 |
| [完整工具结果中文](../../feature/managed-agents/managed-agent-tool-result-artifacts.zh-CN.md) / [English](../../feature/managed-agents/managed-agent-tool-result-artifacts.md) | #13654(open) | 补充 FAILED operation 终态清理资格仍受 object_verified 约束。 |
| [恢复与运维](../../feature/managed-agents/managed-agent-recovery-operations.md) | #13655(merged), #13673(open), #13777(open) | 增补模型/审批/清理三类 G3 证据和不重放、reader-version 边界。 |
| [文件读取](../../feature/file-reading.md) / [Feature 总览](../../feature/README.md) | #13776(open) | 增补单 descriptor 完整读取和 PDF FD 继承；保留平台/Omni 兼容及同 inode 可变限制。 |

_按个人 PR 口径更新于 2026-10-10_
