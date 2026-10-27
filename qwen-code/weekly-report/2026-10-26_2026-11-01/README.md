# qwen-code PRs · 2026-10-26 ~ 2026-11-01 (W44 日更至 10-27)

> 本文件收录北京时间 2026-10-26 至 10-27 创建的 @doudouOUC 个人 PR，UTC 半开窗口 `[2026-10-25T16:00:00Z, 2026-10-27T16:00:00Z)`；本周尚未结束。本次日更新增 10-27 创建的 6 个，并刷新本周已收录 9 个。快照取北京时间 2026-10-28，主干 `32f6713ce639`。只按 author/createdAt 收录，不因更新、关闭或合入时间补收或移动创建周；W43 后续变化不计入 W44 新增。以下 merged 为最终实现，open 只观察当前 diff，不能作为 main 能力承诺。代码规模逐 PR 累加，包含叠加分支/重叠 diff，不是去重 main 增量。本次只核对代码与文档，未运行源码、规模、浏览器、CI 或真实环境门禁。

**主题**: 终态索引、HTTP/本地快照、Workspace 上传与 Hosted 隔离、发布 CI 修复；有界历史/常驻与 resident 正常回收仍 open

**PR 统计**: 15 PRs - 13 merged / 2 open / 0 closed
**当前已合并 PR 代码量**: +12,925 / -4,296，214 个文件变更
**全量代码量**: +45,051 / -14,342，510 个文件变更
**类型分布**: feat ×7, test ×3, fix ×5
**范围 (scope)**: core ×3, managed-agent ×7, serve ×1, ci ×2, managed ×1, runtime ×1

唯一 V1 仍 38 业务表；本周已合入的存储变更只扩 NATIVE_SNAPSHOT owner 与 WORKSPACE_UPLOAD operation CHECK，开发 catalog 重建，不用相同 schemaVersion 推断混版本兼容。#15599 先合入 HTTP 接线，#15569 最终聚合 diff 也包含该部分；两项按 PR 统计但 main 不存在两套恢复。#15616 的 breaking 标记对应删除 cwd 新提交路由，旧 operation 查询/结算保留。

#15696 的 40 表和异步有界历史是 open diff，不覆盖 main 的 38 表；#15729 的正常平台回收与同租户数据保留复用也尚未合入。#15676 的完整测试进程隔离、#15713 的 canonical artifact ID 和 #15715 的连接 fixture 修复，不等于发行物或平台资格通过。

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
| [#15696](https://github.com/QwenLM/qwen-code/pull/15696) | open | @doudouOUC | feat(managed): Add bounded authority history queries | +30355/-9984 | 265 | 10-27 04:38 | - |
| [#15713](https://github.com/QwenLM/qwen-code/pull/15713) | ✅ merged | @doudouOUC | fix(ci): Preserve canonical artifacts across job retries | +12/-5 | 2 | 10-27 09:30 | 10-27 13:10 |
| [#15715](https://github.com/QwenLM/qwen-code/pull/15715) | ✅ merged | @doudouOUC | test(managed-agent): initialize the snapshot pool connection synchronously | +1/-0 | 1 | 10-27 09:50 | 10-27 10:06 |
| [#15729](https://github.com/QwenLM/qwen-code/pull/15729) | open | @doudouOUC | feat(runtime): add resident workspace reclamation and reuse | +1771/-62 | 31 | 10-27 15:49 | - |

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
| [#15696](https://github.com/QwenLM/qwen-code/pull/15696) | 全历史数组/Map 和 bulk restore 常驻增长，直接淘汰会破坏旧 key/回执/冲突事实。 | open 当前观察：固定 canonical prefix 异步冷查询、文件 trie/SQL fact 连续覆盖与代际修复，逐事务流式恢复，有限 cache 加活跃状态；40 表候选未进入 main。 | 更新总览、Managed、存储/Session 存储、恢复、兼容、SDK 与 JDBC 双语；完整当前观察见 [implementations/pr-15696.md](implementations/pr-15696.md)。 |
| [#15713](https://github.com/QwenLM/qwen-code/pull/15713) | 仅重试下游 job 时，当前 attempt 名称找不到上游原 canonical artifact。 | 已合入：upload ID 作为 job output，下游按该不可变 ID 下载，再保留 checkout 绑定；不代表产物已发布或验收成功。 | 更新总览、Managed 与恢复的 CI 证据边界；完整实现见 [implementations/pr-15713.md](implementations/pr-15713.md)。 |
| [#15715](https://github.com/QwenLM/qwen-code/pull/15715) | 单连接 snapshot fixture 异步首连接可能先触发 500 ms 借用超时。 | 测试已合入：init 前设 initialSize=1，保留 maxActive/maxWait；不改生产连接池。 | 更新总览、Managed、恢复与 JDBC 双语；完整实现见 [implementations/pr-15715.md](implementations/pr-15715.md)。 |
| [#15729](https://github.com/QwenLM/qwen-code/pull/15729) | resident 删除尝试缺正常卸载/detach 后的释放闭环，404/DELETE 不足以安全复用。 | open 当前观察：原 finalizer/baseline、terminated/新鲜同 boot NodeLease/卸载/detach receipt 推进三阶段，SQL 释放原 owner；resident 奇偶 revision 和保留 tenant 支撑同租户复用，main 尚无闭环。 | 更新总览、Managed、恢复、存储与 JDBC 双语；完整当前观察见 [implementations/pr-15729.md](implementations/pr-15729.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [Feature 总览](../../feature/README.md) | #15566(merged), #15569(merged), #15585(merged), #15586(merged), #15588(merged), #15599(merged), #15608(merged), #15616(merged), #15626(merged), #15670(merged), #15676(merged), #15696(open), #15713(merged), #15715(merged), #15729(open) | 同步 W44 创建集合、最终实现与未执行的验收边界。 |
| [Managed Agents](../../feature/managed-agents/README.md) | #15566(merged), #15569(merged), #15585(merged), #15586(merged), #15588(merged), #15599(merged), #15608(merged), #15616(merged), #15626(merged), #15670(merged), #15676(merged), #15696(open), #15713(merged), #15715(merged), #15729(open) | 区分已合入基础/Hosted 修复、发布证据和两个 open 方案。 |
| [恢复与运维](../../feature/managed-agents/managed-agent-recovery-operations.md) | #15566(merged), #15569(merged), #15585(merged), #15586(merged), #15599(merged), #15608(merged), #15626(merged), #15670(merged), #15676(merged), #15696(open), #15713(merged), #15715(merged), #15729(open) | 原 proof 不授权未知重放；区分 open 正常回收与发布/规模/平台资格。 |
| [存储与事件](../../feature/managed-agents/managed-agent-storage-event-architecture.md) | #15566(merged), #15569(merged), #15586(merged), #15599(merged), #15626(merged), #15696(open), #15729(open) | 保留 journal 权威，区分 main 38 表与 open 40 表、原物理 owner 回收。 |
| [Session 存储](../../feature/managed-agents/managed-agent-session-storage.md) | #15566(merged), #15569(merged), #15599(merged), #15626(merged), #15696(open) | 说明快照布局与 open 固定前缀/异步历史、cache 和 scratch 边界。 |
| [客户端与事件](../../feature/managed-agents/managed-agent-client-surfaces.md) | #15586(merged), #15588(merged), #15616(merged), #15670(merged) | 上传确认后引用、cwd 退役与 Hosted 身份/前台参数一致性。 |
| [Session 兼容](../../feature/managed-agents/managed-agent-session-compatibility.md) | #15616(merged), #15626(merged), #15696(open) | reader2/旧 cwd 保留；open 异步历史与消费者须配套迁移。 |
| [SDK](../../feature/sdk.md) | #15569(merged), #15599(merged), #15616(merged), #15626(merged), #15696(open) | 已合入 HTTP/reader 边界与 open nativeHistory/异步契约分开。 |
| [JDBC English](../../feature/managed-agents/managed-runtime-broker-jdbc.md) | #15569(merged), #15585(merged), #15586(merged), #15599(merged), #15696(open), #15715(merged), #15729(open) | 原 writer/存储 CHECK、open 查询/回收与测试首连接边界。 |
| [JDBC 中文](../../feature/managed-agents/managed-runtime-broker-jdbc.zh-CN.md) | #15569(merged), #15585(merged), #15586(merged), #15599(merged), #15696(open), #15715(merged), #15729(open) | 与英文同步 main/open/fixture，不作 MySQL 或平台验收承诺。 |

_按个人 PR 口径更新于 2026-10-28；文档审计不替代源码、规模、浏览器、真实 MySQL/SSH/CSI/模型、CI 及部署验收。_
