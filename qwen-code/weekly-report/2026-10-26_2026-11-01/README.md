# qwen-code PRs · 2026-10-26 ~ 2026-11-01 (W44 日更至 10-30)

> 本文件收录北京时间 2026-10-26 至 10-30 创建的 @doudouOUC 个人 PR，UTC 半开窗口 `[2026-10-25T16:00:00Z, 2026-10-30T16:00:00Z)`；本周尚未结束。本次日更新增 10-30 创建的 2 个，并刷新本周已收录 23 个，#15870/#15871 后续合入不改变创建归属。快照取北京时间 2026-10-31，主干 `57d9a8fb50f4`。只按 author/createdAt 收录，不因更新、关闭或合入时间补收或移动创建周；W43 后续变化不计入 W44 新增。以下 merged 为最终实现，open 只观察当前 diff，不能作为 main 能力承诺。代码规模逐 PR 累加，包含叠加分支/重叠 diff，不是去重 main 增量。本次只核对代码与文档，未运行源码、规模、浏览器、CI 或真实环境门禁。

**主题**: 公共消息快照移除和 Maven 模块拆分已合入；完整有界历史、E2B Cloud 执行及拆分后验证补口仍 open

**PR 统计**: 25 PRs - 22 merged / 3 open / 0 closed
**当前已合并 PR 代码量**: +44,257 / -20,363，1732 个文件变更
**全量代码量**: +79,547 / -30,664，2083 个文件变更
**类型分布**: feat ×11, test ×4, fix ×6, perf ×1, other ×1, refactor ×2
**范围 (scope)**: core ×3, managed-agent ×10, serve ×1, ci ×3, managed ×6, runtime ×1, java ×1

唯一 V1 当前 38 业务表：#15745 曾新增 worktree 成 39 表，#15870 再删除公共 ma_snapshot，但 NATIVE_SNAPSHOT/journal 仍在；#15871 将资源/DDL 与代码迁入六生产模块和 verification，不新增迁移。开发 catalog 重建，不用相同 schemaVersion 推断混版本兼容。#15599 与 #15569 的 HTTP/native 恢复 diff 有重叠，两项 PR 不是两套 main 恢复；#15616 旧 cwd operation 查询/结算保留。其余续租、上传、retirement 原身份围栏不放宽。

#15696 仍为旧目录/保留公共快照的 41 表完整历史候选，#15879 的 E2B files/tools 同样基于拆分前目录；不视作当前 38 表多模块 main 的整合能力。#15927 只拟补响应开始后取消探针与独立宿主双模式 CI，不改生产取消。main 消息读取已统一 live keyset，旧签名/十进制 transcript cursor 不跨实现复用；canonical 原事务查询和 native 恢复仍独立。#15729/#15782 的合入及本次模块/测试变化均不证明发行、首装、Cloud/MySQL/Hosted 或平台资格。

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 代码量 | 文件数 | 创建时间(UTC) | 合并/关闭时间(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#15566](https://github.com/QwenLM/qwen-code/pull/15566) | ✅ merged | @doudouOUC | feat(core): Add durable terminal identity lookup | +771/-6 | 9 | 10-25 17:51 | 10-26 01:10 |
| [#15569](https://github.com/QwenLM/qwen-code/pull/15569) | ✅ merged | @doudouOUC | feat(managed-agent): add native snapshots and HTTP recovery | +2263/-50 | 24 | 10-25 18:24 | 10-26 08:23 |
| [#15585](https://github.com/QwenLM/qwen-code/pull/15585) | ✅ merged | @doudouOUC | test(managed-agent): align S1 acceptance fixtures with runtime contracts | +8/-4 | 2 | 10-26 00:55 | 10-26 01:17 |
| [#15586](https://github.com/QwenLM/qwen-code/pull/15586) | ✅ merged | @doudouOUC | feat(managed-agent): support Workspace file uploads | +3613/-69 | 44 | 10-26 00:58 | 10-26 01:10 |
| [#15588](https://github.com/QwenLM/qwen-code/pull/15588) | ✅ merged | @doudouOUC | test(managed-agent): Fix workspace upload admission fixtures | +13/-2 | 1 | 10-26 02:17 | 10-26 03:10 |
| [#15599](https://github.com/QwenLM/qwen-code/pull/15599) | ✅ merged | @doudouOUC | feat(core): restore HTTP managed sessions from native snapshots | +921/-37 | 9 | 10-26 03:15 | 10-26 06:44 |
| [#15608](https://github.com/QwenLM/qwen-code/pull/15608) | ✅ merged | @doudouOUC | fix(managed-agent): retry read-only attestation after EOF | +119/-5 | 2 | 10-26 04:35 | 10-26 06:07 |
| [#15616](https://github.com/QwenLM/qwen-code/pull/15616) | ✅ merged | @doudouOUC | fix(managed-agent)!: simplify Web Shell controls and retire cwd submissions | +941/-3261 | 68 | 10-26 05:57 | 10-26 11:07 |
| [#15626](https://github.com/QwenLM/qwen-code/pull/15626) | ✅ merged | @doudouOUC | feat(core): add local managed journal snapshot recovery | +3940/-764 | 34 | 10-26 07:51 | 10-26 14:47 |
| [#15670](https://github.com/QwenLM/qwen-code/pull/15670) | ✅ merged | @doudouOUC | fix(serve): Fix Hosted local state and foreground Shell validation | +309/-92 | 16 | 10-26 17:51 | 10-27 07:48 |
| [#15676](https://github.com/QwenLM/qwen-code/pull/15676) | ✅ merged | @doudouOUC | fix(ci): Isolate Managed runtime release test classes | +14/-1 | 2 | 10-26 19:47 | 10-26 20:09 |
| [#15696](https://github.com/QwenLM/qwen-code/pull/15696) | open | @doudouOUC | feat(managed): Add bounded authority history queries | +31258/-10101 | 286 | 10-27 04:38 | - |
| [#15713](https://github.com/QwenLM/qwen-code/pull/15713) | ✅ merged | @doudouOUC | fix(ci): Preserve canonical artifacts across job retries | +12/-5 | 2 | 10-27 09:30 | 10-27 13:10 |
| [#15715](https://github.com/QwenLM/qwen-code/pull/15715) | ✅ merged | @doudouOUC | test(managed-agent): initialize the snapshot pool connection synchronously | +1/-0 | 1 | 10-27 09:50 | 10-27 10:06 |
| [#15729](https://github.com/QwenLM/qwen-code/pull/15729) | ✅ merged | @doudouOUC | feat(runtime): add resident workspace reclamation and reuse | +1775/-64 | 32 | 10-27 15:49 | 10-28 05:04 |
| [#15745](https://github.com/QwenLM/qwen-code/pull/15745) | ✅ merged | @doudouOUC | feat(managed): add independent worktrees for main sessions | +7416/-288 | 106 | 10-28 00:29 | 10-29 00:55 |
| [#15782](https://github.com/QwenLM/qwen-code/pull/15782) | ✅ merged | @doudouOUC | fix(ci): Decouple managed runtime distribution from Maven Central | +144/-161 | 7 | 10-28 08:27 | 10-28 11:07 |
| [#15813](https://github.com/QwenLM/qwen-code/pull/15813) | ✅ merged | @doudouOUC | perf(managed): Bound activation renewal journal growth | +856/-18 | 18 | 10-28 17:42 | 10-29 06:48 |
| [#15827](https://github.com/QwenLM/qwen-code/pull/15827) | ✅ merged | @doudouOUC | ci(java): remove MariaDB full integration lane | +133/-155 | 15 | 10-29 03:21 | 10-29 06:09 |
| [#15839](https://github.com/QwenLM/qwen-code/pull/15839) | ✅ merged | @doudouOUC | feat(managed): Add bounded SQL history queries | +752/-4 | 23 | 10-29 08:20 | 10-29 11:34 |
| [#15865](https://github.com/QwenLM/qwen-code/pull/15865) | ✅ merged | @doudouOUC | feat(managed): Add live message paging to WebShell | +1122/-37 | 25 | 10-29 13:09 | 10-29 16:09 |
| [#15870](https://github.com/QwenLM/qwen-code/pull/15870) | ✅ merged | @doudouOUC | refactor(managed): Remove persisted public message snapshots | +1318/-2823 | 61 | 10-29 14:12 | 10-30 00:56 |
| [#15871](https://github.com/QwenLM/qwen-code/pull/15871) | ✅ merged | @doudouOUC | refactor(managed-agent): Split server into Maven modules | +17816/-12517 | 1231 | 10-29 14:22 | 10-30 14:56 |
| [#15879](https://github.com/QwenLM/qwen-code/pull/15879) | open | @doudouOUC | feat(managed-agent): add an E2B Cloud runtime provider | +3858/-183 | 58 | 10-29 16:38 | - |
| [#15927](https://github.com/QwenLM/qwen-code/pull/15927) | open | @doudouOUC | test(managed-agent): close post-split verification gaps | +174/-17 | 7 | 10-30 15:51 | - |

---

## PR 解决问题、实现方式与 feature 处理

| PR | 解决了什么问题 | 最终怎么实现（open/closed 只登记当前观察） | 对应 feature 文档 |
|---|---|---|---|
| [#15566](https://github.com/QwenLM/qwen-code/pull/15566) | 已完成 activation/inbox 的原身份需要重启查回，不能再次入队或让派生索引反客为主。 | 已合入：从原 journal 已验证终态懒建摘要索引，私有/fsync/hard-link 不覆盖；duplicate 回原结果，冲突拒绝，不做 eviction/历史删除。 | 更新总览、Managed、存储与事件、Session 存储、恢复；完整实现见 [implementations/pr-15566.md](implementations/pr-15566.md)。 |
| [#15569](https://github.com/QwenLM/qwen-code/pull/15569) | 公共消息 snapshot 不足以恢复 native journal、checkpoint 与资源闭包。 | 已合入：原 writer/head 围栏下发布 committed-prefix-v1 页/manifest，按原 JOURNAL census 另存 NATIVE_SNAPSHOT pins；普通资源路径禁止冒充，退休后有界收集，不授权删 journal。 | 更新总览、Managed、存储、Session 存储、恢复、SDK 与 JDBC 双语；完整实现见 [implementations/pr-15569.md](implementations/pr-15569.md)。 |
| [#15585](https://github.com/QwenLM/qwen-code/pull/15585) | S1 fixture 仍混用旧后台声明和 35 表基线，未准确抵达当前契约。 | 测试已合入：按 lifecycle v2 断言 monitor/is_background，38 表及单 GC authority 断言；无生产行为改动，非 S1 通过证明。 | 更新总览、Managed、恢复与 JDBC 双语；完整实现见 [implementations/pr-15585.md](implementations/pr-15585.md)。 |
| [#15586](https://github.com/QwenLM/qwen-code/pull/15586) | 缺受控本机文件上传，丢响应重发可能覆盖文件或写错 scope。 | 已合入：LOCAL/SSH_LOCAL 原 scope/actor/physical holder、8 MiB bytes/12 MiB 专用进程请求、原 claim/receipt、hard-link 不覆盖；未知只原 ID 查询，不再派发 bytes，确认后才引用。 | 更新总览、Managed、客户端、恢复、存储与 JDBC 双语；完整实现见 [implementations/pr-15586.md](implementations/pr-15586.md)。 |
| [#15588](https://github.com/QwenLM/qwen-code/pull/15588) | 通用上传准入 fixture 缺 query 参数、octet-stream 和原 uploadId，可能提前被解析拒绝。 | 测试已合入：补正确请求形状，区分陌生 actor 的 upload-not-found；不改上传权限或协议。 | 更新总览、Managed 与客户端；完整实现见 [implementations/pr-15588.md](implementations/pr-15588.md)。 |
| [#15599](https://github.com/QwenLM/qwen-code/pull/15599) | 原生快照未进入真实 HTTP 恢复，直接信 descriptor 又有错 scope/损坏/旧 writer 风险。 | 已合入：冻结 head 内选最新合格 snapshot，验页链/原资源/commit 后读 tail，最后重验 head；无 snapshot 沿旧路径，坏 snapshot 不静默回退。与 #15569 最终 diff 重叠。 | 更新总览、Managed、存储、Session 存储、恢复、SDK 与 JDBC 双语；完整实现见 [implementations/pr-15599.md](implementations/pr-15599.md)。 |
| [#15608](https://github.com/QwenLM/qwen-code/pull/15608) | 空闲 SSH 连接 EOF 使只读 attestation 误失败，泛化重试会重放 mutation。 | 已合入：仅 cause 链 EOF 且原 deadline 有剩余时，同原 bytes/lease/path/incarnation 重试一次；第二次失败和 mutation 不重试。 | 更新总览、Managed 与恢复；完整实现见 [implementations/pr-15608.md](implementations/pr-15608.md)。 |
| [#15616](https://github.com/QwenLM/qwen-code/pull/15616) | 重复 UI 控件和 cwd 新提交扩大状态机，直接删旧操作又破坏已受理恢复。 | 已合入 breaking 收窄：菜单改名、统一 plugin manager，删 cwd route/client/OpenAPI/新 admission 并固定能力 false；旧 operation query/settle 保留，模型/审批/Plan 判定独立。 | 更新总览、Managed、客户端、Session 兼容与 SDK；完整实现见 [implementations/pr-15616.md](implementations/pr-15616.md)。 |
| [#15626](https://github.com/QwenLM/qwen-code/pull/15626) | 本地 snapshot base+tail 需阻止旧 writer、offset 混用和资源缺失。 | 已合入：仅认证 sealed resume 一次转换，先存原 bytes 页/资源闭包再围栏 rename/读回；format2/minimumReader2、物理 offset 换算、未知替换不释放，不后台轮换/GC。 | 更新总览、Managed、恢复、Session 存储/兼容、存储与事件、SDK；完整实现见 [implementations/pr-15626.md](implementations/pr-15626.md)。 |
| [#15670](https://github.com/QwenLM/qwen-code/pull/15670) | Hosted 原 store ID 受本地 transcript/恢复扫描干扰，Shell 显式前台参数与能力声明不一致。 | 已合入：Hosted 模型配置跳过本地 ID 占用、按 profile 隔离分支恢复/PR timer；有后台准入才接受显式 false，原 Broker/领域权限不变；Java fixture 修复不改生产。 | 更新总览、Managed、客户端与恢复；完整实现见 [implementations/pr-15670.md](implementations/pr-15670.md)。 |
| [#15676](https://github.com/QwenLM/qwen-code/pull/15676) | release verify 跨类复用 JVM 导致状态干扰，不能靠过滤测试放行。 | 已合入：原完整 clean verify/central-release 增单 fork、不复用；元测试禁止 skip/过滤/失败忽略或 argLine 覆盖。 | 更新总览、Managed 与恢复的发布边界；完整实现见 [implementations/pr-15676.md](implementations/pr-15676.md)。 |
| [#15696](https://github.com/QwenLM/qwen-code/pull/15696) | 全历史常驻增长，淘汰破坏原回执，流式 replay 可能丢 certified 分支边界。 | open 当前观察：固定前缀异步 view/read grant/未知结算不变，补冻结 branch point、逐记录 ACP 最后可见 chunk 和外部 parent 边界；旧目录/含公共快照及 worktree 的 41 表候选未叠加当前 38 表模块 main。 | 更新总览、Managed、存储/Session 存储、恢复、兼容、SDK 与 JDBC 双语；完整当前观察见 [implementations/pr-15696.md](implementations/pr-15696.md)。 |
| [#15713](https://github.com/QwenLM/qwen-code/pull/15713) | 仅重试下游 job 时，当前 attempt 名称找不到上游原 canonical artifact。 | 已合入：upload ID 作为 job output，下游按该不可变 ID 下载，再保留 checkout 绑定；不代表产物已发布或验收成功。 | 更新总览、Managed 与恢复的 CI 证据边界；完整实现见 [implementations/pr-15713.md](implementations/pr-15713.md)。 |
| [#15715](https://github.com/QwenLM/qwen-code/pull/15715) | 单连接 snapshot fixture 异步首连接可能先触发 500 ms 借用超时。 | 测试已合入：init 前设 initialSize=1，保留 maxActive/maxWait；不改生产连接池。 | 更新总览、Managed、恢复与 JDBC 双语；完整实现见 [implementations/pr-15715.md](implementations/pr-15715.md)。 |
| [#15729](https://github.com/QwenLM/qwen-code/pull/15729) | resident 删除尝试缺正常卸载/detach 后的释放闭环，404/DELETE 不足以安全复用。 | 已合入：原 finalizer/baseline、terminated/新鲜同 boot NodeLease/卸载/detach receipt 推进三阶段，SQL 释放原 owner；resident 奇偶 revision 和保留 tenant 支撑同租户数据保留复用，非异常节点 fence 资格。 | 更新总览、Managed、恢复、存储与 JDBC 双语；完整最终实现见 [implementations/pr-15729.md](implementations/pr-15729.md)。 |
| [#15745](https://github.com/QwenLM/qwen-code/pull/15745) | 主 Session 共享编辑目录互相干扰，重试/崩溃/清理可能丢目标身份或文件。 | 已合入：原 receipt/冻结 commit/target 原子准入，原 completion/identity 才 READY；root 仓库拒新建、原队列管理/取消保留，已提交受阻 Turn 保持未知，清理非 force/不删分支；worktree 曾增至 39 表，后续公共快照删除后 main 为 38 表。 | 更新总览、Managed、Workspace 双语、客户端、恢复、存储、兼容、SDK 与 JDBC 双语；完整最终实现见 [implementations/pr-15745.md](implementations/pr-15745.md)。 |
| [#15782](https://github.com/QwenLM/qwen-code/pull/15782) | 安装渠道不消费 Maven 坐标，却因 Central 权限/签名/同步阻塞 runtime 分发。 | 已合入：删 Central 探测/deploy/等待及签名凭据加载，保留完整同源码验证、exec/旧 tag JAR 选择、原版本只补缺失和 OSS/GitHub 同 bytes readback；不证明生产发布/首装成功。 | 更新总览、Managed 与恢复的发行边界；完整最终实现见 [implementations/pr-15782.md](implementations/pr-15782.md)。 |
| [#15813](https://github.com/QwenLM/qwen-code/pull/15813) | HTTP activation 心跳使 journal 持续增长，失答可能重复延租或越过未知写。 | 已合入：协商原 writers:renew，原事务 lease 两列/原序号 replay、同步 head expiry，journal bytes/revision/sequence/digest 不变；authority 串行结算、restore/CSI 核原身份，无能力保留事件路径。 | 更新总览、Managed、存储/Session 存储、恢复、SDK 与 JDBC 双语；完整最终实现见 [implementations/pr-15813.md](implementations/pr-15813.md)。 |
| [#15827](https://github.com/QwenLM/qwen-code/pull/15827) | CI 数据库矩阵仍暗含 MariaDB 持续兼容承诺。 | 已合入：移除 MariaDB lane，固定 MySQL 8.4.6、两 fork 独立数据库和原完整报告 guard；保留既有方言，不新增运行时拒绝。 | 更新总览、Managed、恢复与 JDBC 双语；完整最终实现见 [implementations/pr-15827.md](implementations/pr-15827.md)。 |
| [#15839](https://github.com/QwenLM/qwen-code/pull/15839) | 最近原事务/旧 command 及最近已发布 Item 不应读完整历史。 | 已合入：固定 revision、元数据先选的 recent/lookup 与原 token 复核；本项当时新增签名保留快照倒序页，后续 #15870 已替换为默认 live 消息，不改变 canonical 查询。 | 更新总览、Managed、客户端、存储/Session 存储、恢复、SDK 与 JDBC 双语；完整最终实现见 [implementations/pr-15839.md](implementations/pr-15839.md)。 |
| [#15865](https://github.com/QwenLM/qwen-code/pull/15865) | 全快照首屏和 live tail 拼接可能重复/覆盖 Item、导出误称冻结。 | 已合入：显式 messages view、1–100 Item/8 MiB、原 keyset/投影版本与 coveredSequence；按 Item 替换去重接 SSE，live 导出固定成员不冻结正文，本项当时保留公共快照，后续 #15870 已统一默认 live 页。 | 更新总览、Managed、客户端、恢复、兼容、SDK 与 JDBC 双语；完整最终实现见 [implementations/pr-15865.md](implementations/pr-15865.md)。 |
| [#15870](https://github.com/QwenLM/qwen-code/pull/15870) | ma_message 之外再发布公共 Item 快照，增加重写/保留/GC 复杂度。 | 已合入：删 ma_snapshot/SNAPSHOT owner，默认 live 页/投影 floor，保活跃 Turn/读 lease/NATIVE_SNAPSHOT，不物理删事件；38 表、limit 1–100、旧 cursor 与 pending/changed/超大页错误明确区分。 | 更新总览、Managed、存储/Session 存储、恢复、兼容、SDK 与 JDBC 双语；完整最终实现见 [implementations/pr-15870.md](implementations/pr-15870.md)。 |
| [#15871](https://github.com/QwenLM/qwen-code/pull/15871) | 单 Server 模块混合契约/控制面/JDBC/SDK 与 Boot 装配，依赖难约束。 | 已合入：六生产模块沿 contracts/server 允许矩阵，verification 不发布，传原 module/CLI 路径和测试配置；SQL 仍 38 表，1231 文件含 1051 rename，不是微服务化或资格完成。 | 更新总览、Managed、恢复、兼容、SDK 与 JDBC 双语；完整最终实现见 [implementations/pr-15871.md](implementations/pr-15871.md)。 |
| [#15879](https://github.com/QwenLM/qwen-code/pull/15879) | 云上持久 Workspace 创建/启动失答及关闭不能靠换实例、TTL 或目录名推断。 | open 当前观察：E2B Volume/SQLite 原身份、未知不重建/恢复，operator 原子 Workspace/OWNER，files/tools 前台执行；原 worker proof 先落库再核原 sandbox kill，保留 Volume，未做 Cloud 资格。 | 更新总览、Managed、E2B 专题、恢复、Workspace 双语与 SDK；完整当前观察见 [implementations/pr-15879.md](implementations/pr-15879.md)。 |
| [#15927](https://github.com/QwenLM/qwen-code/pull/15927) | 取消探针时序不稳定，reactor 检查不等于独立 Maven 宿主装配。 | open 当前观察：首响应 flush 后取消/核 close，保留原时间界限；同 job-local repo/version install 生产依赖，再独立跑普通/启用宿主并拒空选择，不改生产取消或发布。 | 更新总览、Managed、恢复、兼容、SDK 与 JDBC 双语；完整当前观察见 [implementations/pr-15927.md](implementations/pr-15927.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [E2B 外部 Runtime](../../feature/managed-agents/managed-agent-external-runtime-e2b.md) | #15879(open) | E2B Volume/原创建与停止证明，未知不重建；真实 Cloud 仍待验收。 |
| [Workspace 中文](../../feature/managed-agents/managed-agent-workspace-context.md) | #15745(merged), #15879(open) | 保 worktree 身份/ready/清理，另列 E2B 注册/排他执行候选。 |
| [Workspace English](../../feature/managed-agents/managed-agent-workspace-context.en.md) | #15745(merged), #15879(open) | 与中文同步 worktree 和 E2B，worker 不等于磁盘副本。 |
| [Feature 总览](../../feature/README.md) | #15566(merged), #15569(merged), #15585(merged), #15586(merged), #15588(merged), #15599(merged), #15608(merged), #15616(merged), #15626(merged), #15670(merged), #15676(merged), #15696(open), #15713(merged), #15715(merged), #15729(merged), #15745(merged), #15782(merged), #15813(merged), #15827(merged), #15839(merged), #15865(merged), #15870(merged), #15871(merged), #15879(open), #15927(open) | 同步 25 个本人 PR、两项新合入与三个独立 open 候选。 |
| [Managed Agents](../../feature/managed-agents/README.md) | #15566(merged), #15569(merged), #15585(merged), #15586(merged), #15588(merged), #15599(merged), #15608(merged), #15616(merged), #15626(merged), #15670(merged), #15676(merged), #15696(open), #15713(merged), #15715(merged), #15729(merged), #15745(merged), #15782(merged), #15813(merged), #15827(merged), #15839(merged), #15865(merged), #15870(merged), #15871(merged), #15879(open), #15927(open) | 38 表多模块 main 与旧 41 表历史/E2B/资格候选分开。 |
| [恢复与运维](../../feature/managed-agents/managed-agent-recovery-operations.md) | #15566(merged), #15569(merged), #15585(merged), #15586(merged), #15599(merged), #15608(merged), #15626(merged), #15670(merged), #15676(merged), #15696(open), #15713(merged), #15715(merged), #15729(merged), #15745(merged), #15782(merged), #15813(merged), #15827(merged), #15839(merged), #15865(merged), #15870(merged), #15871(merged), #15879(open), #15927(open) | 保 native/未知/物理释放边界，E2B proof 和宿主/取消探针未验收。 |
| [存储与事件](../../feature/managed-agents/managed-agent-storage-event-architecture.md) | #15566(merged), #15569(merged), #15586(merged), #15599(merged), #15626(merged), #15696(open), #15729(merged), #15745(merged), #15813(merged), #15839(merged), #15870(merged), #15871(merged) | 38 表公共快照删除/模块资源已合入，旧历史候选分开，native pins 不删。 |
| [Session 存储](../../feature/managed-agents/managed-agent-session-storage.md) | #15566(merged), #15569(merged), #15599(merged), #15626(merged), #15696(open), #15813(merged), #15839(merged), #15870(merged) | 保 lease/原事务/流式历史，默认 live 不改变 native 恢复。 |
| [客户端与事件](../../feature/managed-agents/managed-agent-client-surfaces.md) | #15586(merged), #15588(merged), #15616(merged), #15670(merged), #15745(merged), #15839(merged), #15865(merged), #15870(merged) | 默认 live、旧 cursor/limit 升级与 Item/SSE 去重，不再声明保留公共快照。 |
| [Session 兼容](../../feature/managed-agents/managed-agent-session-compatibility.md) | #15616(merged), #15626(merged), #15696(open), #15745(merged), #15865(merged), #15870(merged), #15871(merged), #15879(open), #15927(open) | 模块/消息接口已合入，E2B pin/宿主候选不泛化旧 writer/reader 兼容。 |
| [SDK](../../feature/sdk.md) | #15569(merged), #15599(merged), #15616(merged), #15626(merged), #15696(open), #15745(merged), #15813(merged), #15839(merged), #15865(merged), #15870(merged), #15871(merged), #15879(open), #15927(open) | SDK/adapter 与 Boot 已分层，内部能力和 E2B pin/宿主候选独立核验。 |
| [JDBC English](../../feature/managed-agents/managed-runtime-broker-jdbc.md) | #15569(merged), #15585(merged), #15586(merged), #15599(merged), #15696(open), #15715(merged), #15729(merged), #15745(merged), #15813(merged), #15827(merged), #15839(merged), #15865(merged), #15870(merged), #15871(merged), #15927(open) | 38 表/模块路径与原事务/lease/GC 分层，不替代 MySQL/Cloud。 |
| [JDBC 中文](../../feature/managed-agents/managed-runtime-broker-jdbc.zh-CN.md) | #15569(merged), #15585(merged), #15586(merged), #15599(merged), #15696(open), #15715(merged), #15729(merged), #15745(merged), #15813(merged), #15827(merged), #15839(merged), #15865(merged), #15870(merged), #15871(merged), #15927(open) | 与英文同步公共快照删除、模块和 open 宿主检查，运行证据独立。 |

_按个人 PR 口径更新于 2026-10-31；文档审计不替代源码、规模、浏览器、真实 MySQL/SSH/CSI/模型、CI 及部署验收。_
