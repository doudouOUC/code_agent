# qwen-code PRs · 2026-09-28 ~ 2026-10-04 (W40 最终版)

> 本文件已整理 2026-09-28 至 2026-10-04（Asia/Shanghai）创建的 @doudouOUC 个人 PR。以 author 和 createdAt 决定归属，更新/关闭/合入时间不用于新增统计；open 为当前 diff，closed 未合入为历史方案，均不能作为 `main` 能力。状态与规模快照更新于 2026-10-09，相关主干 `55ee50d34e55`。

**主题**: durable worker 与恢复、完整工具结果投影/退休/清理、W1a/W1b/W1c、Session 生命周期、CSI 基础与设置耐久发布

**PR 统计**: 25 PRs - 24 merged / 0 open / 1 closed
**当前已合并 PR 代码量**: +100,191 / -2,943，836 个文件变更
**全量代码量**: +100,820 / -2,947，846 个文件变更
**类型分布**: feat ×15, fix ×8, docs ×1, test ×1
**范围 (scope)**: managed-agent ×17, daemon ×1, serve ×2, sdk-java ×1, cli ×3, runtime ×1

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 代码量 | 文件数 | 创建时间(UTC) | 合并/关闭时间(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#12865](https://github.com/QwenLM/qwen-code/pull/12865) | ✅ merged | @doudouOUC | feat(managed-agent): Adopt durable local Runtime workers | +1640/-104 | 21 | 09-27 16:08 | 09-29 00:33 |
| [#12869](https://github.com/QwenLM/qwen-code/pull/12869) | ✅ merged | @doudouOUC | feat(managed-agent): Recover Workspace holders after trusted local reboot (W0e-3) | +1501/-52 | 39 | 09-27 16:55 | 09-29 09:50 |
| [#12894](https://github.com/QwenLM/qwen-code/pull/12894) | ✅ merged | @doudouOUC | feat(managed-agent): Add durable remote Shell result delivery | +13909/-321 | 71 | 09-28 04:58 | 09-30 11:37 |
| [#12918](https://github.com/QwenLM/qwen-code/pull/12918) | ✅ merged | @doudouOUC | fix(daemon): persist session approval mode across cold restore | +1682/-21 | 24 | 09-28 09:25 | 09-28 15:07 |
| [#12920](https://github.com/QwenLM/qwen-code/pull/12920) | ✅ merged | @doudouOUC | docs(managed-agent): Defer local engine delivery behind Hosted | +146/-61 | 4 | 09-28 09:26 | 09-29 03:44 |
| [#12923](https://github.com/QwenLM/qwen-code/pull/12923) | ✅ merged | @doudouOUC | fix(serve): upload session attachments in 512 KiB chunks | +3588/-33 | 29 | 09-28 09:53 | 09-29 18:25 |
| [#12950](https://github.com/QwenLM/qwen-code/pull/12950) | ✅ merged | @doudouOUC | fix(serve): Persist Hosted file path refusals | +395/-16 | 6 | 09-28 15:56 | 09-28 17:28 |
| [#12977](https://github.com/QwenLM/qwen-code/pull/12977) | ✅ merged | @doudouOUC | feat(sdk-java): Add audited Hosted Workspace operator recovery | +1364/-6 | 24 | 09-29 03:54 | 09-30 03:33 |
| [#13037](https://github.com/QwenLM/qwen-code/pull/13037) | ✅ merged | @doudouOUC | feat(managed-agent): project durable tool results to WebShell | +9095/-158 | 66 | 09-29 16:49 | 10-01 06:19 |
| [#13084](https://github.com/QwenLM/qwen-code/pull/13084) | ✅ merged | @doudouOUC | feat(managed-agent): Protect Session-owned tool output retirement | +1779/-164 | 29 | 09-30 06:01 | 10-02 05:49 |
| [#13087](https://github.com/QwenLM/qwen-code/pull/13087) | ⚫ closed | @doudouOUC | feat(managed-agent): Collect retired tool output safely | +629/-4 | 10 | 09-30 06:24 | 10-02 05:49 |
| [#13088](https://github.com/QwenLM/qwen-code/pull/13088) | ✅ merged | @doudouOUC | feat(managed-agent): add verified W1a workspace cold restore | +3816/-128 | 31 | 09-30 06:37 | 09-30 19:47 |
| [#13090](https://github.com/QwenLM/qwen-code/pull/13090) | ✅ merged | @doudouOUC | test(managed-agent): Add tool output collection deployment gates | +1028/-16 | 17 | 09-30 07:07 | 10-03 02:37 |
| [#13114](https://github.com/QwenLM/qwen-code/pull/13114) | ✅ merged | @doudouOUC | fix(managed-agent): Recover publication expiry with bounded verification | +1058/-53 | 12 | 09-30 14:03 | 10-01 02:05 |
| [#13119](https://github.com/QwenLM/qwen-code/pull/13119) | ✅ merged | @doudouOUC | fix(cli): Publish settings without a missing-file window | +1497/-435 | 13 | 09-30 16:11 | 10-01 04:26 |
| [#13135](https://github.com/QwenLM/qwen-code/pull/13135) | ✅ merged | @doudouOUC | feat(managed-agent): reliably close workspace-bound sessions | +3028/-122 | 49 | 10-01 02:43 | 10-02 10:46 |
| [#13138](https://github.com/QwenLM/qwen-code/pull/13138) | ✅ merged | @doudouOUC | feat(managed-agent): Add offline W1b recovery bundles | +7473/-192 | 28 | 10-01 05:10 | 10-02 10:06 |
| [#13140](https://github.com/QwenLM/qwen-code/pull/13140) | ✅ merged | @doudouOUC | fix(cli): Harden settings failures and sandbox command streams | +3419/-432 | 54 | 10-01 06:08 | 10-03 12:03 |
| [#13194](https://github.com/QwenLM/qwen-code/pull/13194) | ✅ merged | @doudouOUC | feat(managed-agent): archive and delete closed workspace sessions | +2002/-50 | 18 | 10-02 02:06 | 10-02 17:00 |
| [#13225](https://github.com/QwenLM/qwen-code/pull/13225) | ✅ merged | @doudouOUC | feat(managed-agent): Restore safe retired tool output collection | +964/-21 | 15 | 10-02 12:14 | 10-03 00:17 |
| [#13260](https://github.com/QwenLM/qwen-code/pull/13260) | ✅ merged | @doudouOUC | feat(managed-agent): add W1c offline workspace migration | +2885/-129 | 61 | 10-03 06:45 | 10-07 14:24 |
| [#13289](https://github.com/QwenLM/qwen-code/pull/13289) | ✅ merged | @doudouOUC | feat(runtime): add experimental Kubernetes CSI runtime and durable worker ACK | +31614/-209 | 126 | 10-03 12:44 | 10-05 17:07 |
| [#13293](https://github.com/QwenLM/qwen-code/pull/13293) | ✅ merged | @doudouOUC | fix(cli): preserve permissions when replacing settings | +345/-4 | 5 | 10-03 12:57 | 10-06 04:31 |
| [#13296](https://github.com/QwenLM/qwen-code/pull/13296) | ✅ merged | @doudouOUC | fix(managed-agent): Back off protected output collection candidates | +268/-18 | 8 | 10-03 13:25 | 10-05 04:20 |
| [#13354](https://github.com/QwenLM/qwen-code/pull/13354) | ✅ merged | @doudouOUC | feat(managed-agent): add reliable ACTIVE Workspace deletion (L3) | +5695/-198 | 86 | 10-04 00:42 | 10-08 03:06 |

---

## PR 解决问题、实现方式与 feature 处理

| PR | 解决了什么问题 | 最终怎么实现（open/closed 只登记当前观察） | 对应 feature 文档 |
|---|---|---|---|
| [#12865](https://github.com/QwenLM/qwen-code/pull/12865) | 本地 worker 在 Broker 重启后缺可信身份记录，不能安全接管。 | 最终合入 diff 增加显式 Linux durable 模式、目录隔离、进程身份登记及 ready/attest 后采用；默认路径不变。 | 已更新 Managed Agents 当前状态；完整观察见 [implementations/pr-12865.md](implementations/pr-12865.md)。 |
| [#12869](https://github.com/QwenLM/qwen-code/pull/12869) | 可信本机重启后旧 binding/Workspace holder 可能阻塞新代际。 | 最终合入增量在 #12865 之上加入 reboot 证据、批量维护 reconcile 和有条件事务释放；未知执行不自动清理。 | 已更新 Managed Agents 当前状态；完整观察见 [implementations/pr-12869.md](implementations/pr-12869.md)。 |
| [#12894](https://github.com/QwenLM/qwen-code/pull/12894) | Hosted Shell 原始输出失联后可能丢失或无法证实完整交付。 | 最终合入 diff 以 publication grant、Java 持久 admission/分段存储、Runtime 捕获与 Harness 原调用 receipt 串联交付；不等于产品端全链路已验收。 | 已更新 Managed Agents 与完整工具结果状态；完整观察见 [implementations/pr-12894.md](implementations/pr-12894.md)。 |
| [#12918](https://github.com/QwenLM/qwen-code/pull/12918) | daemon 会话内审批模式冷恢复时丢失，并可能被未变更 settings 覆盖。 | 最终合入 transcript `session_approval_mode` 记录/投影、safe/bare 限制下的恢复，以及文件派生 mode 与 live Session mode 分离收敛。 | 已更新 daemon/serve 模式；完整实现见 [implementations/pr-12918.md](implementations/pr-12918.md)。 |
| [#12920](https://github.com/QwenLM/qwen-code/pull/12920) | 本地 Managed engine 排期与 Hosted 首个闭环的依赖混淆。 | 最终合入 文档 diff 保留 M1/M3，后置 M2/M4–M6，并将未来本地宿主设计改为按需子进程；无 runtime 代码。 | 已更新 Managed Agents 设计状态；完整观察见 [implementations/pr-12920.md](implementations/pr-12920.md)。 |
| [#12923](https://github.com/QwenLM/qwen-code/pull/12923) | 单次附件 POST 会被约 1 MiB 代理 body 限额拒绝。 | 最终合入 diff 增加 512 KiB 分块/完成/取消 API、offset 幂等及 SDK capability 探测；旧 daemon 仍用原路径。 | 已更新 daemon/serve 模式；完整观察见 [implementations/pr-12923.md](implementations/pr-12923.md)。 |
| [#12950](https://github.com/QwenLM/qwen-code/pull/12950) | Hosted 文件路径错误在多工具批次中缺有序持久回执，可能部分执行。 | 最终合入 diff 在 dispatch 前验证全部 `file_path`，整批按序持久写入拒绝结果，失败则要求恢复，不启动 Broker 执行。 | 已更新 Managed Agents 当前状态；完整观察见 [implementations/pr-12950.md](implementations/pr-12950.md)。 |
| [#12977](https://github.com/QwenLM/qwen-code/pull/12977) | 无法取得自动可信 stop 证据时，原 holder 可能长期阻塞，但盲目清理会放过未知副作用。 | 离线 inspect/prepare/complete 命令固定原 binding generation 和 holder，保存操作员 stop evidence 与审计记录；满足无活跃执行等条件后释放原资源，缺失生产者的结果标记 producer_lost。 | 已同步恢复与运维的merged口径；完整实现见 [implementations/pr-12977.md](implementations/pr-12977.md)。 |
| [#13037](https://github.com/QwenLM/qwen-code/pull/13037) | 完整 Shell 输出虽已持久保存，公共 Session 用户无法发现、读取或下载原结果。 | 从持久 journal 的 tool.receipt 生成幂等结果投影与 artifact 身份；服务端按 Session 可见性和下载策略提供有界 range/stream，WebShell 展示结果状态与读取入口。 | 已同步完整工具结果的merged口径；完整实现见 [implementations/pr-13037.md](implementations/pr-13037.md)。 |
| [#13084](https://github.com/QwenLM/qwen-code/pull/13084) | Session 删除、读取和输出清理若无统一引用边界，可能删掉仍被读者或恢复依赖的 bytes。 | 增加 Session retirement 和 publication retention 事务；拒绝 active writer，抑制已退休投影，read lease 保护读取，pin/恢复保护和损坏隔离阻止不安全删除。 | 已同步完整工具结果的merged口径；完整实现见 [implementations/pr-13084.md](implementations/pr-13084.md)。 |
| [#13087](https://github.com/QwenLM/qwen-code/pull/13087) | 已退休 publication 需要清理对象，但删除操作必须和 lease、pin、原 Session 引用协调。 | 关闭前 diff 提供默认关闭的 collector，按 claim owner/epoch 分页删除并核验不存在；该分支未合入，后续 #13225 是实际落地来源。 | 已同步完整工具结果的closed口径；完整关闭观察见 [implementations/pr-13087.md](implementations/pr-13087.md)。 |
| [#13088](https://github.com/QwenLM/qwen-code/pull/13088) | 冷启动时仅根据路径重新挂载，不能证明它仍是原 storage，也可能读取不一致的 journal/resource。 | Linux opt-in storage guard 以注册记录、marker 和文件身份验证原挂载；Hosted load 校验 Session 定义、journal/checkpoint 与 durable resources，核对原 Shell receipt，再允许已证明边界恢复。 | 已同步恢复与运维的merged口径；完整实现见 [implementations/pr-13088.md](implementations/pr-13088.md)。 |
| [#13090](https://github.com/QwenLM/qwen-code/pull/13090) | mock 单测无法验证真实 MySQL、OSS 和进程故障时的输出保留与 GC 竞争。 | 增加 O4 MySQL/OSS 集成 profile、故障进程 fixture 和 CI 门禁；报告校验脚本拒绝缺少或跳过的必要 Failsafe 用例，OSS client 构造可注入凭据用于验收。 | 已同步完整工具结果的merged口径；完整实现见 [implementations/pr-13090.md](implementations/pr-13090.md)。 |
| [#13114](https://github.com/QwenLM/qwen-code/pull/13114) | 大结果 seal/terminal 验证超过固定 lease 时，会在已上传完整数据后反复过期或丢失 operation 归属。 | 按验证 bytes、吞吐预算及最大 timeout 计算有界验证窗口；提交前复核 operation epoch/claim。Runtime 在可恢复过期时有限次数查询和重试，保持同一 publication/operation 身份。 | 已同步完整工具结果的merged口径；完整实现见 [implementations/pr-13114.md](implementations/pr-13114.md)。 |
| [#13119](https://github.com/QwenLM/qwen-code/pull/13119) | 先移走原 settings 再写新文件，会让并发 reader 短暂读到不存在，也可能在失败后留下错误状态。 | 在目标旁私有目录写 staging 和恢复副本，完成写入后 rename 发布；原目标在准备阶段持续可读，失败保留不同内容的 recovery copy，成功清理私有目录。 | 已同步Feature 索引的merged口径；完整实现见 [implementations/pr-13119.md](implementations/pr-13119.md)。 |
| [#13135](https://github.com/QwenLM/qwen-code/pull/13135) | Workspace-bound Session 直接关闭可能遗留原 worker、context、holder 或未结算副作用。 | 先持久关闭准入和生命周期 operation，按 claim generation/lease drain Harness 和原 Broker binding；验证原 worker stop receipt 并释放 context/holder，确认后提交 CLOSED。无法证明时保留 RECOVERY_BLOCKED。 | 已同步恢复与运维的merged口径；完整实现见 [implementations/pr-13135.md](implementations/pr-13135.md)。 |
| [#13138](https://github.com/QwenLM/qwen-code/pull/13138) | 同 storage 的资源和 Session 证据缺可审计离线导出/校验，操作员不能可靠确认恢复输入完整。 | 恢复 worker 枚举 Session journal、checkpoint、资源与 publication receipt，递归收集 durable refs；bundle 使用稳定资产身份、digest 和安全文件检查，离线验证原 Session 证据闭合。 | 已同步恢复与运维的merged口径；完整实现见 [implementations/pr-13138.md](implementations/pr-13138.md)。 |
| [#13140](https://github.com/QwenLM/qwen-code/pull/13140) | 坏 settings 的自动恢复可能覆盖并发变化或 linked 文件；sandbox 命令输出尚未完成就退出会丢 bytes。 | settings 恢复前检查原文件身份和内容，保留 recovery copy 并拒绝不安全链接；sandbox 使用实际执行流写 stdout/stderr，等待输出 flush，区分 EPIPE 和其他写入错误，并统一 FatalError 退出。 | 已同步Feature 索引的merged口径；完整实现见 [implementations/pr-13140.md](implementations/pr-13140.md)。 |
| [#13194](https://github.com/QwenLM/qwen-code/pull/13194) | close 成功后的绑定 Session 无法安全 archive/delete，unarchive 也可能错误重新开放执行。 | 要求持久 close receipt 和 creator 权限后才准入 retention operation；archive/delete 复用生命周期状态，unarchive 将记录恢复为 CLOSED，原幂等 key 重放身份。 | 已同步恢复与运维的merged口径；完整实现见 [implementations/pr-13194.md](implementations/pr-13194.md)。 |
| [#13225](https://github.com/QwenLM/qwen-code/pull/13225) | 已退休工具输出仍积累，但不受保护的对象删除会破坏读者或恢复，OSS 自动重试也可能突破 claim 边界。 | 默认关闭的 collector 用数据库 claim 和续租分批处理，只在无 reader/pin/恢复保护时删除；精确 object key 删除后确认不存在再结算。OSS adapter 限定重试行为以配合 fence。 | 已同步完整工具结果的merged口径；完整实现见 [implementations/pr-13225.md](implementations/pr-13225.md)。 |
| [#13260](https://github.com/QwenLM/qwen-code/pull/13260) | 原 storage 无法直接替换为新挂载；迁移若与 live writer 并发，可能破坏原 journal 和 Session 身份。 | 离线 migration operation 固定 request digest 和 storage fence；retire 原资源后用 W1b bundle 验证历史与目标 marker，分阶段准备/完成存储注册迁移。公共 Session 和 journal 事实保持原身份。 | 已同步恢复与运维的merged口径；完整实现见 [implementations/pr-13260.md](implementations/pr-13260.md)。 |
| [#13289](https://github.com/QwenLM/qwen-code/pull/13289) | Runtime provisioner 需要可核验的 CSI 挂载/Pod 身份，worker 输出 ACK 不能只停留在内存。 | 增加实验 CSI provisioner、reservation/registration 和 Kubernetes client，创建受原 claim 约束的 worker 资源并核对 UID/挂载证据；CSI worker 协议携带原 lease/context 与持久 ACK，fence 失效时拒绝继续执行。 | 已同步Managed Agents的merged口径；完整实现见 [implementations/pr-13289.md](implementations/pr-13289.md)。 |
| [#13293](https://github.com/QwenLM/qwen-code/pull/13293) | 原子替换用新 staging inode 时可能丢失原普通 settings 文件的 mode，导致权限收窄或扩大。 | 对原普通文件保存 mode 低 9 位，创建 staging 后 chmod 抵消 umask；不支持 chmod 时只允许权限未扩大，随后原子发布。不复制 uid/gid 或 ACL。 | 已同步Feature 索引的merged口径；完整实现见 [implementations/pr-13293.md](implementations/pr-13293.md)。 |
| [#13296](https://github.com/QwenLM/qwen-code/pull/13296) | 不能清理的 pin/recovery-protected 候选若高频重扫，会持续占用 collector 预算并饿死其他候选。 | 对受保护原因增加持久 recheck 时间，recovery_protected 使用 24 小时退避；保持原 claim/引用保护，补 collector 与门禁报告回归。 | 已同步完整工具结果的merged口径；完整实现见 [implementations/pr-13296.md](implementations/pr-13296.md)。 |
| [#13354](https://github.com/QwenLM/qwen-code/pull/13354) | ACTIVE 绑定 Session 删除尚无可恢复的生命周期 claim，普通请求或旧 writer 可能与删除并发。 | 持久 lifecycle authority 绑定 operation 和 claim generation，冻结新准入并在 Harness load/工具/Hook 处核验；检查 idle journal、drain 原资源，提交退休与删除，重试复用原 operation。 | 已同步恢复与运维的merged口径；完整实现见 [implementations/pr-13354.md](implementations/pr-13354.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [Managed Agents](../../feature/managed-agents/README.md) | #12865(merged), #12869(merged), #12920(merged), #12950(merged), #13289(merged) | 按最终合入/当前方案同步状态和关键边界；详情在逐 PR 实现文档。 |
| [完整工具结果](../../feature/managed-agents/managed-agent-tool-result-artifacts.zh-CN.md) | #12894(merged), #13037(merged), #13084(merged), #13087(closed), #13090(merged), #13114(merged), #13225(merged), #13296(merged) | 按最终合入/当前方案同步状态和关键边界；详情在逐 PR 实现文档。 |
| [daemon/serve](../../feature/daemon-serve-mode/README.md) | #12918(merged), #12923(merged) | 按最终合入/当前方案同步状态和关键边界；详情在逐 PR 实现文档。 |
| [恢复与运维](../../feature/managed-agents/managed-agent-recovery-operations.md) | #12977(merged), #13088(merged), #13135(merged), #13138(merged), #13194(merged), #13260(merged), #13354(merged) | 按最终合入/当前方案同步状态和关键边界；详情在逐 PR 实现文档。 |
| [Feature 索引](../../feature/README.md) | #13119(merged), #13140(merged), #13293(merged) | 按最终合入/当前方案同步状态和关键边界；详情在逐 PR 实现文档。 |

_按个人 PR 口径更新于 2026-10-09_
