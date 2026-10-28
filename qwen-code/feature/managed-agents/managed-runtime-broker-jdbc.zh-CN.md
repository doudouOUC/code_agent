# Managed Runtime Broker JDBC 持久化

## 历史查询候选与已合入正常回收，2026-10-29

main `dda006c237ee` 仍唯一 V1/38 业务表。[#15696](../../weekly-report/2026-10-26_2026-11-01/implementations/pr-15696.md) open head `2fda44212b59` 的两张 generation-qualified history state/fact 表形成 40 表候选，不是已落地迁移。新派生 facts 与 canonical commit 同事务写，旧数据有界连续 backfill，bucket 计数及原事务 locator/digest 核验答案，repair 使用 generation CAS。query/backfill 保留原 writer token 和 Workspace/Session 授权；未覆盖或损坏是错误，不是 absence，canonical 损坏不能按索引问题修写。

[#15729](../../weekly-report/2026-10-26_2026-11-01/implementations/pr-15729.md) 已以 `414efe80a78b` 合入，仅扩 finalizer-attempt CHECK，在既有 retirement operation 保存 baseline/cleanup receipt。原 container 正常终止、同 boot 的新鲜 Node/Lease、卸载与 detach 证据先形成 PLATFORM_CLEANED，才允许移 finalizer、确认原 Pod 消失和 fenced RELEASED 事务。resident 奇偶 reservation revision 支撑同租户保留数据复用，tenant owner 不清；DELETE 成功/提前 404 不是释放证明，异常节点 fence、跨租户复用和真实平台资格声明仍不覆盖。

新 open [#15745](../../weekly-report/2026-10-26_2026-11-01/implementations/pr-15745.md) head `e8e80328de20` 独立新增 ma_session_worktree 与 SESSION_WORKTREE operation CHECK，形成 39 表候选，不是与 #15696 的 40 表合并。Session/最终 binding/准备/receipt 原子准入，原 completion identity 与 whole-storage maintenance 保护 Git 操作。共享导入 marker 存服务 stateDirectory，拒排他 recovery/fence/migration/rewind；两个候选都不是 main 能力或旧 catalog 升级路径。

#15696 新增量将 READ_COMMITTED 来源页的长度候选和正文限在捕获 head，只用现有有效 read grant、不先续普通写 authority；未知 append 仍拒历史读。本地 launcher/规模 JVM 限每个临时 direct-buffer 缓存 1 MiB，外部文件 H2 JVM 需同启动参数，不是进程 RSS/direct-memory 上限或同步持久化变化；修正后的规模资格仍需独立证据。

已合并 [#15715](../../weekly-report/2026-10-26_2026-11-01/implementations/pr-15715.md) 只在 snapshot 单连接测试池 init 前设 initialSize=1，保留 maxWait=500 ms，不改生产池。本次未运行源码、规模、MySQL 或真实平台门禁；相同 V1 标签和 fixture 对齐都不证明混版本 catalog 兼容或发行资格。

## 原生快照 pins 与上传占用，2026-10-27

main `ca9d5f7ffab9` 的 [#15569](../../weekly-report/2026-10-26_2026-11-01/implementations/pr-15569.md) 将 native committed-prefix 页/manifest 及原 JOURNAL 依赖 census 固定为 NATIVE_SNAPSHOT pins。发布锁定原 writer/placement/ACTIVE/READY scope，冻结 revision/sequence/digest，保护读取并在提交前重验原 head。仅修改唯一 V1 的 owner CHECK，不新增表或 V2 migration。退休按有界批次移除 native pins，遗留时拒绝完成；快照存在不授权删 journal 或收集资源。

[#15599](../../weekly-report/2026-10-26_2026-11-01/implementations/pr-15599.md) 只选冻结 restore head 以内的原生镜像，重验原 generation/scope/覆盖；HTTP consumer 校验页/交易/资源链和 tail 后才更新 grant。其聚焦接线与后来 #15569 最终 diff 重叠，公共消息 snapshot 仍是另一种投影，已选坏镜像不静默回退。

[#15586](../../weekly-report/2026-10-26_2026-11-01/implementations/pr-15586.md) 在 operation CHECK 增 WORKSPACE_UPLOAD。LOCAL/SSH_LOCAL 准入将原 actor/scope/目标/载荷摘要存入 ma_operation，取得准确空闲 physical storage 的 holder；只有新操作传 bytes，后续对账只查询原 upload ID。原已确认终态仅清自己的 holder，未知仍保留占用。不加表，当前仍 38 业务表，consumer 匹配并重建开发 catalog。

[#15585](../../weekly-report/2026-10-26_2026-11-01/implementations/pr-15585.md) 只对齐 lifecycle v2 工具及 38 表 fixture。本次文档任务未执行源码、MySQL、独立进程或原生平台门禁；fixture 修正与合入不证明 S1、安全复用或 CSI 恢复通过。

## 固定包持久化基线，2026-10-26 周更

main `49569f16a5a3` 已合入 [#15490](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15490.md)，最终 head `099f5f46621d`、merge `41ce46af24c0`。包发布/执行仍默认关闭；package、加密 settings 与 operation 三表在队列 35 表上增加，唯一 V1 当前 38 业务表。发布依真实耐久 archive 字节、摘要与原 operation；Session effective bundle 沿既有 config_install domain 保存两端 ACK、原 Runtime 身份与代数。安装未知保留屏障；补偿须原 stopped receipt 和新 revision，不盲重放。

开发 catalog 重建，Server/SDK/Harness/Runtime 与外部 writer 匹配切换；schemaVersion=1 不证明混版本 writer 或回滚兼容。下方 35 表及旧编号 migration 段落是带日期快照，不是当前 catalog。本次文档复核未运行源码、MySQL、独立进程或原生平台门禁，合入不等于这些验收通过。

## 队列基线与常驻准入，2026-10-26 凌晨快照

凌晨快照 main `b3ab3ec64c81` 已合入 [#15449](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15449.md)：唯一 V1 增队列、消息和命令三表，当时为 35 业务表。原 actor/key receipt 在 close 后可回读，新修改仍要求 ACTIVE；丢弃 blocked claim 保留原 revision/Turn/prompt，迟到已提交 user message 回执仍可消费，不重新派发。开发 catalog 重建，不是 V2 迁移或混版本 writer 兼容保证。

[#15457](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15457.md) 已 merged。内存/JDBC 仅双方精确 resident capability、Workspace isolation、kubernetes-workspace 时忽略相同 cwd，相同 Workspace/存储、不完整 managed context 和非 resident 路径仍拒绝。原 Harness scope 能力查询不分配物理资源；仅旧路由 404 等待原 warm。resident 声明限三文件工具及本地 Plan 退出；有效但不支持的原 PREPARED payload 派发前原子 not_started，竞争和已 dispatch/UNKNOWN 保留原证据。S1 需修复版本的新资格记录，S2/S3 物理回收仍单独设计。本次未运行源码、MySQL 或原生 ACK。

## 常驻范围历史候选，2026-10-25

历史 open head `d1b4639e4cb0` 记录 S1 pin 2c0c9fa8dc4a 的原生失败：同 tenant 一个 binding DRAINING 后，不同注册存储的新 Workspace 因旧围栏还匹配 /workspace 而被拒绝。后续源码修复不能追溯清除此失败或原 UNKNOWN，已有 binding/另一 tenant 资格也不足以冲销；需在修复源码复跑 S1。本次未复跑原生现场。

[#15457](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15457.md) 此时为六份文档候选，现已连同上文源码修复 merged。完整 CSI 审计不再是首版前置，但不新增平台回收 authority。既有同原 Pod/PVC handoff 保留 binding READY/owner RESERVED；显式 idle retirement 保留 DRAINING/slot/owner/history，RETURNED 仅完整 DELETE 响应（含非 2xx），UNKNOWN 不释放，不删 PVC/PV/Secret/保护对象，资源继续计费。

后续 S2 必须定义正常平台完成、失节点/强删隔离、原身份 readback、数据与跨 Workspace 策略，再由 S3 在同事务重验代数并释放；Pod 缺失/VolumeAttachment 消失或单一云盘状态都非单独完成证明。候选 S1 pin 2c0c9fa8dc4a 与旧撤出/ACK 基准分开，不能据范围决定宣布新源码或完整 K2 验收。本次只核对候选 diff 与 main `395c7a820a47` 的既有边界，未运行源码/MySQL/原生 ACK。

## 当前新库与发布授权，2026-10-24

main `eeb853048aa3` 的 [#15263](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15263.md) 将有效 V2–V17 字段/索引/CHECK 折叠为唯一 V1/32 业务表，ManagedSchema 版本固定 1 并校验实际 catalog。首个正式版本前重建开发目录，不维护旧升级链；下方 V12–V17、旧 catalog 独立迁移/逐版本 cutover 是历史说明，不能作为当前部署命令或兼容承诺。

ToolPublicationStore 只能依原 journal head/activation revision、身份与有效租约授权，不再 legacy walk/head backfill；MCP 释放必须原 drain receipt。O3 backfill 列删除不撤销原 retention/read lease/GC 与 cleanup debt。统一持久 operation、强 checkpoint 字段和 journal handle 要求整套 consumer/外部 writer 匹配，未知旧 owner 应保留证据并隔离，不能手清后重建。未执行源码、MySQL、多进程、CSI 或部署门禁。

## W43 先前快照原生恢复与布局，2026-10-23 (历史对照)

[#15094](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15094.md) checkpoint/native readback 上限统一 1 MiB；[#15170](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15170.md) 将已结算消费历史按原页链 hydrate，48 KiB/32 项页、4096 页/64 MiB 链与 1 MiB 根共同约束。旧页必须来自同 scope/digest、已提交且 revision 不越界的 JOURNAL 引用；更新所有相关 TS/Java/CSI 消费方后才启新分页写入，旧 inline 仍可读。

[#15119](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15119.md) MCP 选择先提交 config_install、再按原 owner drain/configure；无新 DDL、原资源保留。[#15131](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15131.md) ready/cleanup-only 必须证明同原 prompt/journal/lease，UNKNOWN 不重放、不换 Runtime。canonical V16 扩压缩 operation kind，V17 为 [#15171](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15171.md) 增 public_child_agents_version 默认0；公开新 root 委派仍排除 CSI/SSH/MCP/Hooks，不能由默认开关推断 CSI 支持。

main `c61044fae46c` 已合入此前 #14487/#14523/#14599；下方 W42 open head 仅保留当时观察，不是当前状态。[#14695](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14695.md) 补齐原单无 deadline 输入/单批次的冷恢复：新 owner 受当前 writer/activation fence，SQL 在同源事务证明全部原 SETTLED 成员、grant/intent/checkpoint/input/definition 与结果。每份 input/definition/result/authorization 字节资源分别限 64 KiB、响应 8 MiB；整批预检后补原 receipt/message，不派发工具。最终 output_committed/assistant/route/history/results_ready 完整闭合时只消费，不重复模型。

[#14710](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14710.md) 保持同 Maven/部署；原 managedagent.store SQL 聚合移至 persistence，业务分别归 session/workspace/runtime/artifact/catalog/event，model/exception 脱离 api；Broker provisioning/transport/security 分开。当前 main 为 V1–V17，[#14698](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14698.md) 的 V12/boot6、SETTLING→FROZEN→CUT→DRAINED 已合入。其原库存/worker 观察/持久 CUT 与独立 worker-authority 不证明物理 Pod/PVC 删除，旧 legacy catalog 不可直接升级或 repair。本次仅独立核对 diff、changed files、关键调用与主干，未运行源码、浏览器、真实 MySQL/OSS/CSI/SSH/模型或部署验收。

[#14758](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14758.md) 最终只更新常驻可信平台与验收文档，原节点证据候选撤出；[#14761](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14761.md) 离线安装/冷启动 closed 未合入，路径不在 main。[#14765](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14765.md) 最终重设计为独立的显式空闲 resident 维护：OWNER 和原配置/registration/protection/READY shared binding/slot/RESERVED owner，且无活 Session/writer、未释放 Runtime Session、未结算工具；事务中保存 V14 原计划并 seal Workspace/binding DRAINING。CLI 不启服务/worker/迁移，删除前重核原 Pod UID/spec/container、Ready node 和 resourceVersion，先持久 UNKNOWN 再发前置条件 DELETE；每版本至多一次、最多 8 个尝试。响应有界并受原 claim fence；丢答/HTTP2xx/404/对象消失不清存储 owner、不形成 RELEASED，不允许替换/跨 Workspace 复用。

[#14764](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14764.md) 的 V13 保存原 cleanup descriptor/binding/generation 引用及 head 历史覆盖标记；confirmed 只删同源引用，旧未覆盖历史阻止原 Runtime 退休。当前 canonical V1–V17、32 业务表，旧库必须独立迁移，不能 repair 绕过拒绝。软件/H2/MySQL/独立进程/ACK 证据分开；本次只读核验文档与代码，没有运行这些门禁。

[#15026](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15026.md) V15 只加 ma_runtime_session.execution_storage_key/execution_exclusive 与索引，业务表仍 32。普通 LOCAL/SSH_LOCAL 在原 physical domain/binding/owner 锁序下保存每 Runtime Session 的并发成员，release/原 stopped 清理只清自身；READY 上 UNKNOWN 保留原成员而不排他。undo 无其它当前成员才临时 exclusive，未知结果不清；维护/登记/fence/恢复需 drain，operator recovery 歧义拒绝。CSI reservation/私有库存路径保持单 unfinished Session，新字段必须 null/false，无共享事务隔离保证。

V1–V14 canonical catalog 需停写排空切换而非混版本滚动：旧版本禁新 Turn、完成/恢复并释放所有普通 holder，停旧 Server/Broker/Harness/worker 和外部 writer，核查 LOCAL/SSH_LOCAL 非 maintenance holder_key 全空，再应用 V15/启匹配 build。UNKNOWN writer 未清理继续保留旧环境，禁止手清 owner；不转换 singleton 或提供旧 authority 回退。旧 retired/DATETIME catalog 的独立迁移限制不变，本次未运行数据库/SSH/故障门禁。

> **2026-10-13 历史增量（当前状态见下方 2026-10-15）：** #12692 Spring/Flyway、#12865 持久本机/boot/process 与 #12869/#12977 可信 reboot/人工清理已合入，#13289 实验 CSI/持久 ACK 已合入。该快照的 #13642 retention 为 open，head `5832d8824a31` 顺延 V69，maxAge 按 DAYS、scanDelay 按 MILLIS，maxAge 至少 1ms，并保护未结算 background_shell 的原 process 行。当时主干 V68 async 已合入，旧编号冲突已解决，但writer 锁协议及独立 Hosted cleanup 释放证明均验证前 cleanup 仍关闭。#13673 原 drain/stop/holder Hook 恢复已合入。下方 2026-09-27 记录保留为历史，不作当前 owned-map-only 结论。

> **私有 CSI 边界：** closed [#13893](../../weekly-report/2026-10-05_2026-10-11/implementations/pr-13893.md) 在 create/adopt/register/observe/confirm/release/operator 路径拒绝私有文件 profile 误入 local-process，不能当作已合入支持；同类 guard 位于 merged [#13899](../../weekly-report/2026-10-05_2026-10-11/implementations/pr-13899.md)。后者提供独立 v5 文件 worker 与原输入/readback/history 身份校验，但 drain 始终 BLOCKED，保留 backup。不能据 worker diff 推断完整 Java/Hosted native/readback 接线、生产 CSI 删除或跨 owner 恢复已交付。

> **周更补充：** #13642 为 execution lease 的 `(binding_id, runtime_generation)` 引用查询补齐 Flyway/幂等 JDBC 索引。#13899 的 worker 在 history prepare 前预估 100 snapshot/64 KiB envelope 容量；准备失败后效果改变或不能证明时 historyFailed 并拒绝后续写入/排队 snapshot，只有准备前后观察相等才允许原引用重试。普通读取路径拒绝不自动 fence 挂载；部分文件写入/取消尝试按原 inode 回滚，失败才保留聚合故障。seal 也封 executor 准入，drain 仍 BLOCKED；不承诺整个调用原子回滚或物理删除。本次未执行源码/CSI 门禁。

[English](managed-runtime-broker-jdbc.md) | [简体中文](managed-runtime-broker-jdbc.zh-CN.md)

#13642 已合入；main 的 guard 先按原 Session 值和二进制身份共同去重，再查 indexed projection，permissive collation 不合并不同 owner；这是保守 Session 级保护。retention 开启仍须独立的精确身份 Hosted cleanup release-proof 资格：owed descriptor 可比 RELEASED binding 保留更久，原释放不能因收集失去核对资格。不能仅据合入、writer 锁协议或本次文档启用清理。H2/MySQL 大量 settled Shell 与折叠身份用例本次未执行；创建归属仍在 W41。

#13899 最终合入版还排斥 prepare/execution 重叠，此类时序拒绝不退役 Session；scoped 新文件/目录请求 0600/0700，旧文件保留 mode。只有成功回滚且错误正是原取消 reason 才恢复可用，ENOSPC 等存储故障即使恢复 bytes 仍 fence；普通 Write 保留 pre-write 抛错。boot6 CUT/finalization 与完整 native 控制面仍在 open #13526，不属于已合入 boot4/5 worker。

## 2026-10-15 私有 authority 与新库最终基线

已合入 [#13996](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-13996.md) 最终 SQL/native authority，main `79362c2ecc21` 当前 canonical V1–V10，包含 V3 immutable Session-list keyset 及后续 Workspace/模型/审批、SSH/Turn operation/共享索引。`WorkspaceCsiRuntimeAccess` 在同源新事务按 placement/retention 锁原 Session/binding，核验 registration、READY、原 generation/lease/seed/handle/context；native 认证同时校验 seed/lease token，comparison reference 来自原生读回。`ManagedSessionStore` 在 journal 事务核验 genesis/首 writer/activation/有限批次/结果，资源 read 意图在 ma_request_receipt、交付 lease 在 ma_read_lease，结算前再验 identity/bytes。generic 私有 cancel/close/delete 与 release/finalization 不开放，正向 SQL→worker→retained history 和真实 CSI 仍需验收。

`V2__private_csi_authority.sql` 只扩展 request key/generated csi_guard/index、first activation revision 和 native authorization，业务表仍 32。旧 V68/V69 与 CSI branch V69–V72 是 legacy/历史分支编号，不用于当前 32 表 V1/V2 部署；已验证 V1 无 history 的 Broker 初始化与 application Flyway V2 迁移分开。历史编号冲突不替代当前 catalog/check/锁序验收。

已合入 [#14081](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14081.md)，最终 head `d4ee6e1dbdba` 继承已合入 authority/catalog；旧 stacked baseline 的验证不自动资格化最终集成版。私有 attach/text/history 固定原 UUID/writer/activation，fresh admission 后生产纯文本；失租阻塞，stopLocal 不 seal/release。不安装 file toolTurn/finalization/public selector/冷替换写者，进程内去重不证明跨 boot replay。

已合入 [#14069](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14069.md) 的 fresh database 32 表基线，DDL 前拒绝 system/missing catalog、要求 MariaDB CHECK enforcement，验证 catalog/列/键/索引/check/FK 后 baseline/migrate。typed receipt/work 不合并 Runtime generation、Session head、operation claim/read lease。snapshot 只读 view 不伪续租，分页/GC/切换见[存储、事件方案](managed-agent-storage-event-architecture.md)。本次未跑组件、MySQL、OSS/CSI 或部署门禁。

已合入 [#14180](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14180.md)，最终 `0b92ddcd49e3` 只遍历 private schema2 preparation：prepared 的 intentRef 与 predecessor 相同，须在本事务重纳，不是排除所有 predecessor；bind/result 顶层 previousRecordRef 不被泛化遍历，畸形 JSON 拒绝。真实 SQL/native/worker/history fixture 所有平台显式映射 placement/mount/proc-fd，不是原生 CSI 部署。

已合入 [#14185](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14185.md)，最终 `010664ddba0e` 改 V1/V3 为 epoch-ms/UNSIGNED/gmt 字段，接 typed Time/Rows/Projection，保留 actor 字节和 immutable gmt_create 列表 keyset；终态 collector 用 NEVER_DUE_MILLIS=9007199254740991，避免零/负值到期或 signedness 错误。main 已采用新形状，但没有现存 DATETIME catalog 的版本化升级；不可 repair 历史规避 checksum/shape 拒绝。旧 open SQL fixture 及其它分支必须对齐新形状再验收，不能据已合入推断兼容迁移或原数据库测试已通过。

### SSH 的最终原资源边界

已合入 [#14318](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14318.md)，最终 `1a32fe4dbc47` 从受信 SSH_LOCAL storage 选择 ssh-process。独立 workspaces/register、V7 接 V6，沿数据库毫秒/gmt 与统一 physicalKey；claim 前事务外 probe cwd/marker，确定拒绝不占 holder，claim 后未知仍保留。路由按原 kind/seed/handle 不回退本地，SSH 转发只改发送地址不改原 lease。原子 no-overwrite launch/never-start claim、worker 自报 PID 与 startup-close pending 区分确定 spawn 前失败和模糊启动，均不授权替换。

严格 stop 验证原 generation/provisionRequest/incarnation/lease/retirement cleanProof 和进程消失，再写 RuntimeDrainReceipt；原 not_started/capture:null publication/ACK 有限恢复不扩展 UNKNOWN 重放。旧 V4 冲突已由当前 V7 编号解决，不是 repair 已应用历史；仍需 checksum/组合升级门禁。默认关闭、仅 /1 文件/前台 Shell；本次未执行 SSH/MySQL/远端 publication，PR 的 macOS loopback/组件报告不等于 Linux、跨机器或完整部署验收。

### 已合入共享归属与常驻文件增量，2026-10-17

已合入 [#14339](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14339.md)：精确共享 local managed binding 按持久 Runtime Session/execution 的真实 Harness owner，而非 binding isolation key 核验。storage/physical fence、Session drain 保留，缺共享 Session 不能创清理 tombstone。本切片没有开启共享；后续 #14435 单独增加显式配置，并非任意 provider 共享或 idle retirement。

已合入 [#14340](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14340.md) 独立显式 resident CSI/files 映射：一个未完成 public Session、一个可撤销 Read/Write/Edit 上下文使用原 Pod/PVC。Workspace 行锁拒绝重叠，逻辑 close 结清原工作并释放精确 owner，保留 READY binding/generation/RESERVED 物理存储；释放未知阻止交接，丢失/替换/重启 Pod 保持不可用。没有物理 release/卷复用/collector/Shell/MCP/Hook/自动替换。H2/boot-2 同 JVM fixture 及旧 ACK 证据不为当前 CSI 部署授予资格，本次未运行源码/部署门禁。#14277 合入后 Java 源码/测试位于 packages/managed-agent-server，SDK 仍 sdk-java/qwencode。

### 公开 Workspace 常驻与 macOS，2026-10-18

已合入 [#14435](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14435.md)：bound-session-isolation-class 默认 session，显式 workspace 要求 durable local-process 且排斥 child Workspaces。Session 授权 placement 与共享 binding 空 isolation key 分开，原 Runtime Session owner/claim fence 覆盖执行/Hook/cleanup。两个 close 协议按原 Harness keyset 每批 100 个只释放自身 Runtime Session/holder，binding/worker 留 READY；丢 worker/未知仍阻塞，v2 never-initialized 不漏共享记录。仅 storage-fenced retirement 可物理 drain/stop，retention 保护真实 owner 的未结算 child run。V9 单列 harness_session_id 索引避免双 VARBINARY 键过长，tenant 在查询过滤；未交付创建 warm、idle/硬预算、keep-warm。源单元/H2/变异报告不替代真实 Linux/MySQL 多 Session 进程资格。

已合入 [#14442](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14442.md)：macOS hardware UUID/boot UUID/纳秒 birth 与 dev/inode/原 marker 联合核验 LOCAL storage 和 worker，原生探测有五秒/64 KiB 限制。同 host/boot 可接原 durable worker，macOS trusted-local-reboot-recovery 必须 false；换 boot/host 仍 UNKNOWN，不 adopt/attest/stop 原 worker，不借 Linux reboot 证明自动清理。不增加 Linux cgroup/CSI/跨机器资格。本次未执行原生、源码、数据库或部署门禁。

### 私有文件 Turn 与回执完整恢复的 open 观察，2026-10-19

W42 历史 open 观察（当前已合入；最终边界见本文 W43 增量）：open [#14487](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14487.md) `76902629d1d9` 仅接原 read_file/write_file/edit，writer generation 1/activation epoch 1 不变。完整原批次 reservation、修改 intent/原备份准备后才提交 intent/checkpoint，保存完整 outcome/receipt 与闭合 history 后供模型消费；拒绝按原调用验证，已准入工作仍必须有原生 receipt。最终 assistant 与成功模型 attempt 原子提交；不是冷恢复、物理 finalize/release 或公共 CSI 选择，尚未合入。

W42 历史 open 观察（当前已合入；最终边界见本文 W43 增量）：open [#14523](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14523.md) `5adfab798f62` stacked 于 codex/csi-hosted-files，统计包含前置文件 Turn。同连接 native admission 只接受单原无 deadline 输入/批次、全部 SETTLED 完整 receipt，数据库时间确认 writer/activation 双 lease 过期。递增 writer 与恰好下一 activation 保留原 READY worker/history；整批原结果/消息前缀预检后只补缺失原消息与 checkpoint，再继续模型，修复不分配/执行文件操作。pending batch 已清、最终输出、活 owner、缺回执、取消或 UNKNOWN 拒绝冷准入。main 仍只有较窄的已合入文本入口，本次未运行完整 K2、OS 崩溃或部署 CSI 门禁。

### 周更复核边界，2026-10-19

周更补充：#14487 新 head 的 prepare 异常只做一次独立、五秒有界的成员回读，失败保留原错误；发布 receipt 前严格校验结果/error/text/media 的封闭 schema 与原 function 身份，非法结果保留原待结算工作。#14523 仍基于 `57c3a24470e7`，不自动继承新的前置 head。当前 main 的后续 storage 退役只在原关闭 drain、持久匹配停止 receipt、无活跃 Session/execution 的条件下，经 releaseRetired 清精确 holder；普通 release 失败或网络丢响应不授权物理 stop 或清占用，成功应答的原逻辑释放仍走既有路径。见[恢复与运维](managed-agent-recovery-operations.md)。这些源码/数据库门禁本次未运行。

## 历史基础切片

以下非目标、四表 Schema 和初始化方式保留 2026-09-27 的基础切片语义，不是对当前全部实现或 32 表 open branch 的描述。

状态：基础切片已由 upstream #12445 合入；接线门槛修复 #12477 与 #12478 也已合入

> Upstream 交付状态（更新于 2026-09-27）：#12390/#12391/#12438/#12445 已合入 Binding/Session JDBC、Tool Execution 状态、Broker core 与第四表 JDBC；#12458 是关闭的平行实现。#12445 的精确评审 head 曾通过 JDK 21 下 63 个测试、Checkstyle、H2 共用合约及一次性 MySQL 26.7.0 `utf8mb4_0900_ai_ci` 验证，覆盖大小写敏感标识、不透明 `$ref`/`@type` 与正指数 BigDecimal 往返。#12477/#12478 已合入 dispatch owner 最终 fence、时区无关且秒级存储安全的数据库时钟读取，并有 MariaDB CI lane；#12552 已合入本地进程采用。#12627 已为持久 binding 合入加密 seed、resource handle、attestation generation、LOST/RECOVERY_BLOCKED 与 observe→attest→CAS 恢复基础。后续主干的 local-process provisioner 已返回 `local-process` kind、实现 ensure/reconcile，但 observe 仍依赖本进程 owned map；生产跨 Broker 接管、完整 Tool Runtime transport 与多进程端到端验证仍需单独证明。

## 问题

Managed Runtime Broker 基础能力已经定义 Runtime Binding、Runtime Session 和 Tool Execution 状态，但 Tool Execution 实现仍在进程内。进程重启会丢失执行身份、dispatch 所有权、取消意图、`UNKNOWN` 恢复状态和最终结果。多个 Broker 进程也无法通过共享事实源协调 at-most-once dispatch 边界。

## 目标

- 通过 JDBC 持久化 Runtime Binding、Runtime Session 和 Tool Execution。
- 保持 Binding 原子创建、Binding generation fencing、CAS 更新、操作租约、Binding 与 Session 状态的租户和 Workspace 隔离，以及 Session 终态语义。
- 保持 Tool Execution 幂等创建、dispatch owner 与 generation fencing、数据库时钟租约、取消意图、`UNKNOWN` 对账和最终结果。
- 幂等初始化 Broker 私有 Schema。
- 使用同一套 Repository 契约同时验证 H2 和真实 MySQL。

## 非目标

- 启动、停止或以其他方式管理 Runtime 进程。
- 把 Repository 接入 Harness、Spring 装配、传输层或公共 API。
- 执行 Tool call 或自动解决 `UNKNOWN` 执行。
- 通过 SSE、Outbox、MQ 或 Redis 分发事件。
- 让无关 Workspace 共享同一个 Managed Runtime。

## 依赖边界

JDBC Repository 使用 `javax.sql.DataSource` 访问数据库，并使用 fastjson2（2.0.60）作为 `reference_json`/`result_json` 列的 JSON 编解码。不透明 Tool 载荷会关闭 fastjson2 引用检测，使 `$ref` 与 `@type` 成员保持普通数据；有限 `BigDecimal` 不使用指数形式写出，避免读取时被收窄为 double 或溢出。它们不选择连接池、不要求 Spring、不通过框架管理数据库迁移，也不捆绑生产数据库驱动。测试配置默认提供 H2 来运行 Repository 契约，并为可选的 MySQL 集成测试提供 MySQL Connector/J。

## Schema

Broker 私有拥有四张表：

- `qwen_runtime_binding_slot` 用于串行化同一哈希 Runtime Scope 的创建。
- `qwen_runtime_binding` 保存当前 Runtime Binding、generation、endpoint、操作租约、生命周期状态和乐观锁版本。
- `qwen_runtime_session` 保存某个 Binding generation 下的 Runtime Session 及其终态。
- `qwen_tool_execution` 按全局唯一的 idempotency key 保存一个持久化 Tool Execution，包括不可变请求身份、dispatch fencing、取消意图、`UNKNOWN` 状态和最终结果。execution-call 和 idempotency 标识使用确定性哈希，从而在任意数据库排序规则下保持大小写敏感查询；每次查询还会校验完整标识。

Scope 身份使用确定性哈希表示，并始终与完整的租户级身份一起校验。Endpoint token 仍是调用方提供的加密值或不透明值；Repository 不记录也不转换它。

## 事务与并发语义

创建 Binding 时会锁定 Scope slot，在事务内重新读取 Binding，并确保每个 Scope 只插入一个活动记录。Binding 更新同时使用已保存的 version 和 generation 作为 fencing 条件。操作租约使用数据库时钟，使竞争 JVM 不依赖彼此同步的本地时钟。#12478 在 SQL 查询中把该时钟转换为 Unix epoch 秒和微秒，使连接的 session time zone 无法相对服务时钟偏移租约 instant。

创建 Session 时依赖数据库唯一约束，并在并发插入后重新读取胜出的记录。Session 的 CAS 更新会锁定当前行，校验预期 version 和 Binding generation，并拒绝把终态 Session 重新激活。SQL 失败会回滚事务并向调用方传播；不会静默回退到进程内状态。

创建 Tool Execution 时使用唯一 SHA-256 key 保持数据库索引长度可控，同时保留并校验完整 idempotency key。变更操作会锁定 execution 行。CAS 更新和 `UNKNOWN` 对账校验调用方提供的不可变身份与 version；取消请求校验预期 version；dispatch claim 与续租校验各自适用的 owner、generation 和 lease fencing。租约判断使用数据库时钟。过期的 `DISPATCHING` claim 可以重新发放，因为物理执行尚未开始；过期的 `EXECUTING` 或 `CANCEL_REQUESTED` claim 会进入 `UNKNOWN`，在显式对账结果完成它之前不得再次 dispatch。

Service 还必须在状态转换后对物理副作用执行 fencing。#12477 已在启动续租或调用 `transport.execute` 前，再次校验 `EXECUTING` 转换返回的记录仍具有已认领的 owner 和 generation；已丢失 claim 的旧 dispatcher 会直接退出，不调用 transport。

## Schema 生命周期

Schema 初始化会对四张 Broker 私有表执行幂等的 `CREATE TABLE IF NOT EXISTS`。这满足当前私有模块边界。后续接入服务端之前，还需要明确 Migration 的版本管理和部署方式。

## 恢复边界

持久化的 Binding 或 Session 行只能证明 Broker 状态仍然存在，不能证明它引用的 Runtime 进程仍然存活。同样，`UNKNOWN` Tool Execution 记录的是不确定性，不能证明副作用是否已经发生。进程对账、传输健康检查和权威执行对账仍属于后续 Runtime 集成的职责。

## 安全与租户隔离

Binding 和 Session 查询与变更受完整 Runtime Scope 或从该 Scope 创建的身份约束。Tool Execution 方法接收不透明的 execution、idempotency 和 Runtime Session 标识，接口没有单独的租户或 Workspace 参数。接入服务必须先根据已认证的租户、Workspace 和 Session 上下文生成全局唯一标识，再调用 Repository，并且不能把不可信标识本身当作充分授权。在此前提下，唯一键会阻止跨 Scope 别名；Tool Execution Repository 本身不独立执行租户或 Workspace Scope 校验。Binding 与 Session Repository 不会跨租户或 Workspace 搜索“兼容”的 Binding；任何 Repository 都不会在状态缺失或不明确时回退到 Primary Runtime。

## 验证

Repository 契约覆盖：

- 同一 Scope 下并发创建唯一 Binding；
- 通过新 Repository 实例恢复状态；
- 拒绝过期 version 和过期 generation；
- 操作租约所有权以及过期后的接管；
- Binding 和 Session 状态的租户与 Workspace 隔离；
- 并发创建 Session；
- 终态 Session 不能重新激活；
- 多 Repository 实例并发幂等创建 Tool Execution；
- dispatch claim、续租、取消、过期 owner fencing 和 `UNKNOWN` 对账；
- `EXECUTING` 转换与 transport 调用之间的确定性 owner 接管；
- H2 与真实 MySQL 在 UTC、+08:00、-04:00 session time zone 下的数据库时钟转换；
- 通过新 Repository 实例恢复最终结果；
- Schema 可重复初始化。

默认测试套件在 MySQL 兼容模式的 H2 上运行该契约。可选的 `mysql-integration` Maven profile 会对调用方提供的 MySQL 数据库运行同一套契约。

## 验收标准

- 多个 Repository 实例通过数据库协调，并且同一 Scope 只能观察到一个活动 Binding。
- Binding 和 Session 状态在 Repository 重建后仍然存在。
- 过期所有者不能修改更新后的 Binding generation 或 version。
- 已过期操作租约可被接管，未过期租约仍受 fencing 保护。
- Binding 和 Session 状态按租户和 Workspace 保持隔离。
- 接入服务根据已认证的租户、Workspace 和 Session 上下文生成全局唯一并带命名空间约束的 Tool Execution 标识。
- 终态 Session 不能回到非终态。
- 并发调用方对同一 idempotency key 只能观察到一个 Tool Execution。
- 有效 dispatch 租约会拒绝其他 owner，过期的执行中 claim 会进入 `UNKNOWN` 而不会被重放。
- dispatcher 在 transport 边界前丢失 owner/generation fencing 后不会调用 transport。
- JDBC session time zone 不会改变数据库租约 instant 与服务时钟的对齐关系。
- 取消意图和 Tool 最终结果在 Repository 重建后仍然存在。
- Schema 初始化可安全重复执行。
- H2 契约和可选的真实 MySQL 契约均无需进程内回退即可通过。

## 后续工作

#12477 与 #12478 已合入服务端装配和多 Broker dispatch 前要求的两个正确性修复。进程对账、权威 `UNKNOWN` 解决、Schema migration 部署、具体 service/transport 接线和多进程端到端验证仍属于后续工作。
