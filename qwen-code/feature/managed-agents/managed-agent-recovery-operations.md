# Managed Runtime：持久回执、平台与运行验收

## W43 当前恢复边界，2026-10-23

[#15094](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15094.md) 无新事件时按原 cached attachment/boot/eventEpoch 观察 recoveryBlocked，停放原 Turn、不耗重试预算、不再 submit；[#15131](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15131.md) 则独立证明原 journal/inputSettled/continuationReady，ready 必须无 pending 执行、Hook/MCP/file undo 或 cleanup 债务。终态失败先取消原 prompt，再结算/退休 driver；cleanup-only 不跑模型/工具，不支持的冷 Hook/MCP 拒绝。初始无 Turn 也验完整 genesis/head，不只看 SQL 空行。未知工具不重放，handoff 仅文字草稿。

[#15104](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15104.md) 手动压缩在外部 submit 前标 HARNESS_SUBMITTED，丢答只对账原维护记录；candidate 先耐久，恢复不重生成摘要，原 Hook 仍需确定终态。[#15119](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15119.md) MCP 选择先提交、物理连接 drain/configure 后进行；未知管理操作只原键 resume，原 owner/grant/binding/generation 与资源证据不能替换。连接释放不删恢复历史。

[#15170](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15170.md) 分页 checkpoint 读取须 hydrate 并验证完整原页链和 JOURNAL 引用，兼容旧 inline，但旧消费者须升级后才能读新分页写入。[#15171](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15171.md) 子委派取消先持久 source fence 再 abort，禁止新 launch/被取消源的后继通知，保留原 child cleanup，不将 stopRequested 当 terminal。实际模型/provider/审批/Skills 由原 launch snapshot 决定，不重扫配置。

[#15200](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15200.md) MySQL/MariaDB integration CI 显式 forks=2，对应两台独立 disposable server，避免全局 deadlock counter 互扰；默认本地仍 1。Hosted lane 保留自己的隔离，当前 AGENTS 要求匹配 sibling SDK、聚焦 changed behavior 和含 setup 的共享本地 10 分钟预算；CI 全套/真实进程证据不能由文档核验替代。

main `c61044fae46c` 已合入 [#14603](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14603.md)：V11 在原 head 保存 wake 提示/退避，独立 scheduler 默认 2 秒扫描最多 8 个公共 ACTIVE、失租且未压缩的 Session，按 Session→head 锁序领取，数据库时间退避 30 秒。完整 journal 前缀校验六类 wake 的未结算 Turn，部分证明不可清提示；私有 CSI/活 writer 不参与，子会话检查 parent run。被动 load 与 boot/ref fencing 不启动无关前台工作，MQ watermark 不是恢复证明。

[#14679](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14679.md) 只为 monitor/child_agent/workflow 崩溃后结算的通知，先以固定摘要键持久入队后继 continuation，再 settle 旧 Turn；恢复原通知/结果，成功后按原 notification ID 消费 child，不重放原副作用。不扩展 channel/automation/session_message 的后继政策。

[#14695](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14695.md) 在原已安装新 writer/activation 下回读 SETTLED 原批次，补缺失 receipt；严格证明最终 assistant/attempt/history 已闭合时直接消费并结算，不重复模型或工具。此前 #14487/#14523/#14599 已合入但仍归 W42；创建 warm 仍默认关闭、workspace/no SSH、placement-only，不保证返回 READY。下方其 open 描述保留 W42 观察，不代表当前状态。

[#14698](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14698.md) 应用退役已合入：V12/boot6、原库存/观察冻结、事务 CUT、原 worker 独立验 CUT 后关闭文件 fd 并返回 DRAINED。库存漂移、未知、超限或缺证明均阻塞；不是 Pod/PVC 已删除/可复用或完整 K2。本次仅独立核对 diff、changed files、关键调用与主干，未运行源码、浏览器、真实 MySQL/OSS/CSI/SSH/模型或部署验收。

[#14758](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14758.md) 固定常驻路径的可信平台、ACK Disk CSI/RWOP/ext4 及原运行身份，撤出节点证据候选；[#14761](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14761.md) 安装/冷启动仅保留 closed 未合入观察。[#14765](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14765.md) 最终维护入口只接受已授权 OWNER 的空闲 Workspace：原 READY 共享 binding/slot/registration/RESERVED owner、无活 Session/writer/Runtime Session/未结算执行；原子保存计划并 seal 为 DRAINING。删除前复核原 Pod/container/spec/Ready node/protection，先存 UNKNOWN 再按 UID/resourceVersion 发 DELETE；每 resourceVersion 至多一次、最多 8 次，丢答不重发。HTTP 成功/404/对象消失不产生 DRAINED/RELEASED，不清 reservation 或允许替换/复用；与 #14698 的私有应用退役分开。

[#14763](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14763.md) 对 cancel_unconfirmed 只查原 operation/Turn/prompt/完整 scope 的保留 settleTurn：cancelled 完成，completed/error 明确失败，只有停止请求、缺失/损坏/不可读仍不成功，不能重发取消。[#14764](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14764.md) 在原提交中持久 HOSTED_CLEANUP 引用，confirmed 仅移除相同 descriptor/binding/generation；旧 cleanup_head_revision 不覆盖当前 journal 时保守保留原 Runtime，不因 close/租约过期免债。

[#14760](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14760.md) v2 状态快照保留原 epoch/lease/消息/幂等身份和单调序号，替换或 sync 失败停止当前 writer；不是裁剪恢复证据。[#14920](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14920.md) 新检查读单调 live 模式、旧 Hook 按保存字段恢复，查询失败/倒退不执行；明确 Hook ask/Plan 退出不自动放行。[#14875](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14875.md) 的自动清 ma_* 只在 disposable MySQL Hosted IT profile 的类边界运行，不是生产维护命令；单 fork 禁并行，保留 Flyway/结构。主干 V1–V17，旧目录须按 canonical 校验迁移；本次未执行上述源码/数据库/原生/部署门禁。

[#14930](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14930.md) 将创建时 Skills 快照写入原 actor receipt 和资源，load/lifecycle/recovery 沿同一 sessionSkillsRef/digest，缺能力、来源变化或损坏拒绝，不重新发现宿主。[#14970](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14970.md) 的原本地导入切片要求 OPEN/loopback/trusted actor 及 durable/verified recovery（当前 signed 扩展见 #14928），固定原项目 native identity 和 actor key；两阶段重验/已授权根复用，不允许原键换路径或重放恢复撤权。

[#15026](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15026.md) 普通 LOCAL/SSH_LOCAL 的 UNKNOWN 保留原 Runtime Session membership、不重放，但 READY binding 不因此排斥其它普通 Session。undo 只在无其它成员时置 exclusive，错误/未知保留并阻断后续执行/释放；原 binding stopped/lost 清理需原 operation/lease/fence、无未结算工作，只清原成员。operator recovery 仍要求唯一精确原 LOCAL 成员，歧义拒绝；存储维护必须全部 drain，cleanup debt 不因并发免除。CSI/resident 仍沿原单 Session/reservation。V15 部署必须先用旧 build 停新准入、完成/恢复并释放普通 holder，再停所有 writer/worker、验空 holder 后升级匹配版本，不自动转换未知 owner 或滚动混用。

[#14928](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14928.md) 现已合入统一 daemon/Managed 启动、精确版本/摘要下载、worktree 外私有状态、signed loopback 与 H2 file 服务监督；退出关前门并逆序停服务，不把 Java 退出当作全部 worker 清理。signed loopback 导入已扩展 #14970 原 OPEN-only 条件，远端 listener 仍拒绝。[#15040](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15040.md) 本身 closed 未合入；[#15066](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15066.md) 原成员/进程树故障测试已合入，[#15072](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15072.md) 本地 MCP 两 Turn/close 原生验收仍 open。以上门禁本次均未运行，也未执行发行或真实下载。

> **2026-10-12 实施快照：** #12839/#12869 已合入原终态/holder fence 与可信同宿主 reboot 清理；#12977 的离线 inspect/prepare/complete 固定原 generation/holder，记录操作员 stop evidence 和 producer_lost，不恢复原回合。#13088 的 W1a 核验原 storage marker/身份与资源闭合；#13138 W1b 导出和验证离线 bundle；#13260 W1c 以 storage fence、原 request 和历史证据分阶段迁移，#13655 成功迁移清除旧诊断。#13135/#13194/#13354 以持久 lifecycle authority 排空、关闭、保留和删除 Session。#13673 已合入原 Hook 退休恢复：按保存的 drain receipt、stop evidence 和 exact holder 在同事务确认 stopped release，不替换 Hook 或重放未知效果。所有路径继续要求原资源证据，UNKNOWN 不换 Runtime 重放；本文未执行物理 reboot、迁移或部署故障门禁。

关键实现：`WorkspaceOperatorRecoveryStore.java:prepare`、`WorkspaceStorageGuard.java:inspect`、`workspace-recovery-bundle.ts`、`WorkspaceMigrationStore.java:retire`、`WorkspaceLifecycleStore.java:requireClaim`、`RuntimeBrokerService.java:drainHarnessSession`。逐 PR 与验证入口见 [W40 实现索引](../../weekly-report/2026-09-28_2026-10-04/implementations/README.md) 和 [W41 实现索引](../../weekly-report/2026-10-05_2026-10-11/implementations/README.md)。

#12693 已合入持久 journal 与 failover 基础，原操作按持久记录恢复或准确阻塞；它不授权新进程重放状态未知的副作用。该切片的控制流与回归入口见 [PR #12693](../../weekly-report/2026-09-21_2026-09-27/implementations/pr-12693.md)。

> **G3 停靠 Turn（2026-10-13，#13777 merged，head `4a92b1ef6116`）：** 已合入有界的原模型请求、原生审批 continuation 和 cleanup descriptor；这个合入范围不等于泛化接管。主模型快照固定原 Session/header/activation、请求/config/route/provider 摘要和已完成调用，不保存 secret/瞬态 transport 字段。完整证据且没有后继输出/intent 时沿用原 prompt/deadline 重发模型；已有最终 assistant 消息时只补终态，部分公开输出按原 journal 身份撤回。审批保存原 Action/批次/参数/定义/Runtime generation，只恢复 read_file/write_file/edit/glob 的限定无 Hooks/MCP 路径；扫描限定在原 assistant 消息之后并匹配 batch/requestedAction，旧 v2 不按 v3 恢复。原 execution/prepare 不换 ID 重放。

原 binding/generation 确定后、Runtime acquire 前即保存 owed debt，覆盖 acquire 响应丢失。`hosted-turn-cleanup.ts:reconcileHostedTurnCleanup` 在 durable terminal 和 file-history 闭合后释放原 binding/generation，再写 confirmed；释放失败保留 owed、输入屏障及可重试清理，不重复终态，返回各 debt 的 owed/confirmed 结果。load/resident attachment/lifecycle 对账原 debt；Java 递归检查新资源引用闭包，并以 reader floor 2/private ceiling 拒绝旧 reader。`hostedRuntimeSessionId(promptId)` 保留路径安全 ID，将带冒号等 wake ID 映射为稳定 `wake-sha256` Runtime ID；历史/prompt 身份不变，审批、输入与 cleanup 沿用该映射。无快照、未知副作用、Hooks/MCP、未完成 prefix continuation、Shell owner、两侧 owner 同时重启及跨宿主接管均不能从此推断支持。模型重发不保证 provider exactly-once。完整路径、回归和 PR 内 Linux fixture 证据的范围限制见 [#13777 最终实现](../../weekly-report/2026-10-05_2026-10-11/implementations/pr-13777.md)，本次未独立执行源码/故障门禁。

最终实现还将 wake Runtime ID 一致用于 prepare key/reference，并对超 maxIdBytes 的 cleanup command/event ID 使用稳定 SHA-256、兼容原 ID 查重，不换原 prompt/binding。resident redrive 持有 mcpRecovering 并反复核验 resident/mcpClosing，避免并发关闭后的旧 attachment；cancel 优先于 deadline 分类。含 image payload reference 的请求不捕获/冷重发，旧快照也拒绝重新推理；已提交最终输出仍可只补终态。保存的可选 allowPersistentRetry 只在 unattended 模式和原 deadline 内沿用。清理屏障只在 debt 对账后解除，legacy handback 仅容忍精确 404 runtime_session_not_found，不把 owed 清理伪装 confirmed；本次未执行新增故障用例。

最终 G3 使用 `{promptId, runtimeSessionId}` 保持原实际 lease，MCP configuration owner 不被普通 prompt handback 提前释放；原 debt 与 drain 一起对账，清理失败 kick 维护泵。此范围仍不扩展成 MCP/Hook/Shell 模型重放。

> **L4 最终实现（2026-10-14，#13931 merged，主干 `96cfa244917c`）：** 精确 Shell/1、MCP/1 用 lifecycle v2，files/1 保留 v1，`QWEN_HOSTED_LIFECYCLE_V2_PROFILES` 默认空，未知版本不走 legacy。close 的 SessionEnd、delete 的 SessionEnd→SessionDelete 先存原 effects 回执，再以原 operation/claim 在 DRAINING 做 prepare_resources/settle_resources；冷加载只建立清理 writer，不触发 SessionStart/模型/新 Monitor。Shell drain 保留最终输出但抑制通知，MCP 先释放各连接再共享 owner；死 worker 必须可信原 stopped proof。Java 核验原 binding/generation/owner、publication 内容与资源闭包，私有输出退役和 tombstone 在最终事务完成，共享 Workspace/其它 Session 不删除。不确定身份/效果仍 blocked；必须先升级全部 consumer 再开精确 profile。完整路径与未运行门禁见 [#13931 最终实现](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-13931.md)。

L4 的原 cleanup writer seal 仍核验 head 的原 token/generation 与有效 cleanup claim，但不只因 writer lease 到期拒绝清理。Broker 在原 lease/resource handle、无 active execution 和原 lifecycle authority 匹配后保存可信 stopped drain receipt，再允许 LOST→DRAINING；receipt CAS 继续复核 claim。MCP 的 workspace_close_identity_unverified 可尝试该原 stopped recovery，不能绕过其它身份/授权/closed-admission 拒绝或把断线当完成。

### 已合入的原清理与结果续接修复

- [#14039](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14039.md)：`QwenHostedHarnessConnector:settleLifecycle` 仅在 v2 非 effects 404 时条件删除仍匹配的 AttachmentRef，继续抛原异常；下一次从 SQL 原 effects/claim cleanup-only load，不删除并发替换附件，也不把 404 当释放证明。
- [#14045](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14045.md)：`WorkspaceProfileLifecycleVerifier` 读取原 scoped input 并核验 payload/hash，仅已结算的 deferred read_file/write_file/edit/glob 且无 protocol/publication/source 才免不适用的 Shell 输出检查；真实 Shell/MCP 输出和原 owner 关闭条件保留。
- [#14059](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14059.md)：`hosted-workspace-tool-turn:restoreRuntime` 只对 files 的 settled/results_ready、完整 outcome/history、无 Hooks/MCP/未决 history/undo 续接。`confirmReplacedHostedTurnOwner` 在同 Workspace generation 下复核 owed 原 binding/generation 与 prompt/runtimeSession，确认原 release 后只消费结果，不再 acquire/运行新工具；构造器仍可能预热，不承诺零 provision。Write/Edit 必须有原 history，下一工具用新 Turn。

上述修复不开放 UNKNOWN 重放、跨 owner 泛化接管或 CSI finalization，也不交付 JDBC retention 所需的独立 Hosted cleanup release-proof。合入与 default-off profile 开启、真实 MySQL/Runtime/Linux 故障验收是不同证据；本次仅审阅代码与回归入口，未运行这些门禁。

### 关闭的 Hosted 测试方案观察

[#14141](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14141.md) closed 未合入，head `63262ebaae03`：probe 沿 canonical alias→physical_key 查询原 ma_storage_owner，不回退 legacy hash/decoy，并在自有装置注册前固定 mtime 以区别真实 birth time。它不修改生产 identity reader 或 stop proof；main 同类测试修正不表示本 PR 合入，也不证明本次 Linux/MySQL 故障门禁通过。各原始回执、generation、holder、companion Session 与物理清理断言仍需实际验收。

### 常驻设计、搜索与 SSH 的增量边界

截至 2026-10-19 main `79362c2ecc21`，[#14214](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14214.md) 是常驻设计，[#14254](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14254.md) 最初保留 session-only；后续 #14435 才增加显式绑定 Session 共享。已合入 [#14339](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14339.md)：精确共享 binding 的 admission/recovery/release 按 Runtime Session/execution 真 Harness owner，而非 binding isolation key；缺原 Session 不能创清理 tombstone，storage/drain fence 仍保留。它不是打开任意 provider 共享的开关。

已合入 [#14340](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14340.md) 的独立 resident CSI/files profile：管理员精确映射一 Workspace/原 Pod/PVC，锁内只许一个未完成 public Session 和活动上下文，Read/Write/Edit 后逻辑 close 撤销上下文并保留原 binding/reservation。释放未知阻止下一 Session；丢 Pod/重启/身份不符不自动重建，物理 release 明确拒绝。无 Shell/MCP/Hook/子环境共享/会话内 cwd 变更；Pod 关闭后仍计费。旧 ACK 证据和 H2/boot-2 同 JVM fixture 不证明当前真实 CSI/进程崩溃资格。通用 idle retirement、硬预算调度、创建预热和 keep-warm 仍未交付，不能把窄常驻路径写成 #13526 累计方案全部完成。

open [#14290](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14290.md) 搜索沿原 execution 的 prepare/status/cancel/结果持久化恢复，取消/期限必须停止真实 rg/枚举 worker，不能只返回超时；未知或持久写入失败继续 blocked，不能重搜补回执。

已合入 [#14318](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14318.md)，最终 head `1a32fe4dbc47`，统一 server 目录和 V7；独立 register、claim 前事务外 cwd/marker probe，确定拒绝不占 holder，claim 后未知保留。bootstrap launch=false intent 在 SQL handle 前，launch=true 后模糊不再 spawn；原子 no-overwrite launch/never-start claim 和 worker 自报同 PID 区分确定 spawn 前 FAILED 与已启动未知。startup-close 未决只 pending，不抢写 stop fence。双向 SSH 重连只接原 generation/lease，严格 host key/OS 锁限定同控制面主机接管；死亡/reboot/身份冲突继续 blocked。

SSH close 必须结清原结果/ACK、Runtime Session 和原进程组，再以匹配 cleanProof+进程消失生成 drain receipt；not_started/capture:null 先 close_not_started 原 publication，再重试原 direct/deferred ACK。ledger 失败或进程组退出证据失败取消 clean proof 资格，空 holder/kill/超时不算停止证明；不保证 setsid 逃逸的任意 daemon。开关关闭只拒绝新 SSH 准入，原 operation/关闭仍需保留节点配置。仅 /1 文件和前台 Shell，无后台/MCP/Hook/child/池/idle/自动替换。

PR 设计记载 macOS 本地和 loopback SSH 的分层验证，其中 publication 对端/页面有 mock；Linux、跨物理主机和完整 WebShell→Java→MySQL→远端 publication 未资格化。本次未独立执行这些源码/故障/部署门禁；具体入口见单 PR 文档。

### 扩展、后台关闭与取消恢复增量

已合入 [#14357](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14357.md) 的 Linux/MySQL 真实 MCP/Hook 进程门禁：受控模型、原 worker、SIGKILL Harness、Hook 后代/cgroup 与产品 close 分开观测；MCP 一次 fsync 后失联仍 UNKNOWN，拒绝新输入/close，不强写 FAILED。测试强制收尾不替代产品停止证据；本次未运行。

已合入 [#14364](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14364.md)：publication 局部 READ_COMMITTED 修复 discovery 后 head 锁读取旧 journal；只对原 child_run shell/monitor_run 的精确调用免前台 receipt，后台原记录、物理停止及输出闭包仍要核验。

已合入 [#14377](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14377.md)，最终 head `9d29555ed5c9`：原有效 grant 内重排瞬态续租，activation 沿同事务重试，不复活过期 writer。未 admission 取消在 fenced head 锁下复用完整 idle journal 扫描返回的 accepted 集合，避免 RR 旧快照二次读；原 profile 的 monitor 规则保留。恢复失败先做原取消接管，不覆盖并发用户取消，工作区未结算保留重试。UNKNOWN Runtime 仅尝试原 cancel；仅 ECONNREFUSED 且原 aborted/PID/POSIX 组 gone 才保留 cancelled/blocked capture。只对原 cancelled/blocked 结算核验并持久唯一原生 receipt，再解除等待；精确 404、legacy 无 capture 不补造 receipt。物理停止或普通历史不替代回执，不放松 close。本次未跑 Linux/数据库/whole-JVM 验收。

### 2026-10-19 单 run 取消与受限恢复增量

已合入 [#14526](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14526.md)：稳定 cancel_run 写原 Turn cancel.requested，排队 wake 不执行模型就持久结算，正在运行仅 abort 相同 automationInputId。Java 经原 committed-stop attachment 授权，原 run 的 cancelled 终态才使取消 operation 完成；ACK、schedule retirement、其它 Turn 和资源物理停止不是同一事实。清理/UNKNOWN 仍按原 proof，本次未运行 Hosted/MySQL。

W42 历史 open 观察（当前已合入；最终边界见本文 W43 增量）：open [#14523](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14523.md) `5adfab798f62` 依赖 open [#14487](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14487.md) 的文件 Turn。只在原 writer/activation 双 lease 到期、单无 deadline 输入/单文件批次全 settled 且 receipt 完整时，按原事务锁序取得后继 writer 并安装下一 activation；先预检整个原批次再补消息/checkpoint，原 worker/history 不换，修复不派发工具。原 pending batch 已清除、最终模型输出已提交、缺 receipt/取消/UNKNOWN 均不在冷准入范围；stacked 代码量含前置实现，不代表 main 或完整 K2。源码/真实 CSI/OS 进程崩溃本次未执行。

W42 历史 open 观察（当前已合入；最终边界见本文 W43 增量）：open [#14599](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14599.md) `ad3d0f68d833` 是创建 warm 的独立方案：默认关闭，要求 workspace isolation/no SSH，仅无输入创建在原提交后投递既有 executor，复用授权 resolver 做 placement-only warm。不开 Runtime Session/context、不执行工具、不新增公开事件，不保证创建返回时 READY；首 Turn 保留原 warm。不是 Session 隔离预热、idle/硬预算/keep-warm 或已合入能力，真实进程复用门禁未由本次运行。

### 公开常驻与 macOS 的最终边界，2026-10-18

周更 main `79362c2ecc21` 的后续释放增量与原 PR 切片分开：worker releasePrepared 等待上限 20 秒，owner_hold_pending/release_timeout 是可重试拒绝，迟到 attempt 不可关闭后继身份。仅拥有原关闭 drain 权限且支持 stopDrained 的级联可停止原 worker、持久化匹配 drain receipt 后继续；普通 Session release 不升级成物理 stop。无活跃 Session/execution 后，在 binding RELEASED 前按原 generation 每批 100 个执行 releaseRetired，Workspace transport 必须看到 DRAINING/匹配 receipt 才清精确 holder；LOST 交独立恢复，网络丢响应不授权清占用。关键路径为 RuntimeBrokerService、WorkspaceRuntimeTransport、HttpRuntimeTransport 与 managed-runtime-provider-worker；对应 worker、WorkspaceRuntimeTransportTest、ProviderRuntimeTransportTest 已核对但本次未运行。

已合入 [#14435](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14435.md)：bound-session-isolation-class 默认 session，显式 workspace 需 durable local-process 且不可结合 child Workspaces。placement 用原 Session 授权，共享请求不存单一 owner；执行/Hook/cleanup 按原 Runtime Session owner/claim fence。两套 close 都每批最多 100 个只释放原 Harness 的 Runtime Session/holder，binding/worker 留 READY，v2 never-initialized 不漏共享 Session。丢 worker、未知或释放失败阻塞；物理 stop 只属于 storage-fenced retirement。V9 单列索引，原 storage 串行保留；不同于 #14340 CSI，且不交付创建 warm、idle/硬预算或 keep-warm。源报告仅单元/H2/变异，真实 Linux/MySQL 多 Session 进程链路未由本次验证。

已合入 [#14442](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14442.md)：macOS 用 ioreg hardware UUID、sysctl bootsessionuuid 与 stat dev/inode/纳秒 birth 核对原 mount/worker；同 host/boot 可接回原 durable worker。trusted-local-reboot-recovery 必须 false，macOS reboot/host 改变保持 UNKNOWN，不以 Linux trusted reboot 证明代替或碰原 worker；不增加 cgroup、CSI、跨机器替换资格。原生探测、进程和部署门禁本次均未运行。

> **普通工具接线（2026-09-20，HTML v1.7；工具契约源自 v1.4）：** 普通工具另须完成[补充验收 S01～S08](managed-agent-ordinary-tools-integration.md#9-补充验收与实施顺序)。干净 idle 回收后的新 binding 可挂回原持久存储；started/unknown 的故障恢复仍阻塞，不能混用两条路径。

> **HTML 对齐（2026-09-18）：** Java 恢复 SessionBackendBinding、RuntimeBinding、Execution Ledger；Harness 依据正式 Transcript/checkpoint 和原 Ledger 恢复；Runtime 提供物理回执。started 无终态保持 recovery_blocked，禁止换 Runtime 重放。F 验收现有部署故障，G 验收共享 Authority 与跨实例接管；内部 UNKNOWN 须显式映射，不直接替换目标状态。以[HTML 双链路基准](managed-agent-dual-path-architecture.html)与[Markdown 方案](managed-agent-java-hosted-runtime.md)为准。

> **首版运行范围（2026-09-19）：** 首版先通过[运行验收 M01～M10](managed-agent-first-runtime.md#8-首版验收与阶段关系)：原 ID 受理/执行查询、取消与真实释放、单实例重启恢复或准确阻塞。完整跨实例接管留 G，多副本路由/创建竞争只在该部署启用前强制；不将本文全量平台方案均列为首版条件。

历史设计日期：2026-09-10；源码基线 `a836081466`。本文补齐当时 daemon 路线中的 worker/daemon 重启、远端执行、平台和容量设计，配合[存储契约](managed-agent-session-storage.md)、[私有门禁](managed-agent-control-protocol.md)及[coordinator](managed-agent-coordinator.md)。先前产品文档记录过部分 durable Broker 与 UNKNOWN 能力进展，现保留为历史证据；本地文件账本、任意恢复和平台门槛仍须按具体条目核验，不能整体标记完成或未完成。

## 1. 当前事实与选定后端

当前 ManagedToolRuntime 的 invocation/started prompt 保存在内存，最多 1024 个 invocation、1 MiB 进度；worker 在父 IPC 断开后退出，activator 会清理 outputRoot。因而现有 status 或本地 Map 不能证明跨 worker 重启的执行结论。原工具参数、确认、Hook、history bind/checkpoint 都可能产生工作，恢复保护不能只记录 execute。

全量实现新增 `RuntimeReceiptStore`，由原执行环境持有，路径在可信 runtimeBaseDir 下 `managed-runtime/receipts/<bindingId>/`，不放临时 outputRoot；由绑定 owner 独占写入。它只记录物理调用事实，不成为 Session/turn 的第二权威。所有资源具有原 invocation、phase、digest 和 retention pin；所属 authority 的 acceptance ACK 作为物理账本收件证明保存：Session scope 使用 CommitReceipt，无 Session workspace scope 使用 workspace 控制 receipt。

Runtime 生命周期分为 worker（执行与服务）、持久 receipt store（历史）与 process owner（实际命令）三部分。默认本地 daemon 重启可停止旧 worker，结果仍从 receipt store 读取；不要求保活旧 worker 才能保存已完成结果。真正保活的执行环境可以按下面的认证 attach 协议接管；旧进程是否存活必须实际核验。

## 2. 操作账本与恢复分类

工具 phase 使用稳定 `phaseOperationId=(InvocationBinding, phase, effectRevision)`，内容摘要包含原 args/capability/policy/media/Hook revision。此处 effectRevision 是冻结的效果输入版本，不是重领 gate 的 operationRevision。工具顶层 phase 限于 begin_turn/history_bind/checkpoint/prepare/confirm/pre_hook/execute/post_hook/model_bridge/result_publish；模型 bridge 的模型事实由 Harness 提交，Runtime 只记录请求/接受答复。

| 持久记录             | 内容与写入时机                                                                                  | 崩溃后的解释                                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| intent               | phaseOperationId、输入 ref、原 lease/generation、gate revision                                  | 在任何可能的该阶段效果前同步；只有 intent 无 dispatch 且完整账本/owner证明时，才可能证明该阶段未开始 |
| dispatch_started     | 原生开始标记、process owner ref 或本地执行序号                                                  | 在进入可能有副作用的原生函数前同步；记录完成后到实际开始之间崩溃也算 unknown，不猜测为未执行         |
| phase_settled        | native status、原错误/Hook结果、输出/备份refs、实际进程结算证明                                 | 先保全结果/资源再同步；允许幂等重交付，禁止再次运行原阶段                                            |
| accepted             | 按 scope 的 Session CommitReceipt 或 workspace 控制 receipt、已接收资源清单/父 history revision | 单独保存，ACK丢失查原Session；不能据接受一个结果就释放整个有子任务的binding                          |
| released / tombstone | 已结算phase集合、最终资源pin、关闭原因和owner证明                                               | 只有资源闭包安全才release；调用ID/输入摘要留在Session可恢复历史内，不因缓存TTL重用ID                 |

统一接口：`recordIntent`、`markDispatched`、`commitPhysicalResult`、`readOriginal`、`ackAccepted`、`releasePins`、`sealBinding`。ackAccepted 必须按原 scope 核验收件者及其 receipt 类型，不能跨用 Session/工作区回执。readOriginal 返回封闭 union：`not_started_proven`（附完整前缀及原owner已隔离证明）、`running_attached`、`settled`、`unknown`、`corrupt`。404/Map空/日志不存在绝不等于 not_started_proven。

模型外维护和领域发送使用[私有协议](managed-agent-control-protocol.md)的 OperationGrant；物理账本 key 对应 `(SessionKey,effectId,phase,effectRevision)`，不虚构 ManagedToolInvocationReference。grant 重领不换 phaseOperationId；已持久效果只重交付，未知不重跑。Runtime 账本和有外部 I/O 的领域发送器使用同一 intent/dispatch/settled 分类，各自保留真实执行 owner。

无 Session 的工作区维护采用 WorkspaceOperationGrant，物理 key 为 `(WorkspaceKey,generation,effectId,phase,effectRevision)`；所属 workspace 控制 owner 持久化操作元数据并持有恢复入口，不创建假的 Session 日志。与 Session operation 共用相同账本格式的 scope 分型、限额、资源 pin 和撤权规则；读者不能把两种 key 混用。

prepare/build、确认和 Hook 也使用同样 phase 规则。不同阶段不能共用一个“工具执行过”布尔值；改参后有新 revision，旧确认不能批准新参数。原结果仍保留原 toolUseId、缓存更新和 Hook 事实。重复 pre/post Hook 默认只查询；远端系统无幂等能力时 unknown 不自动补跑。

### 领域 phase 的注册与身份

上面的工具顶层枚举不限制无工具的领域调用。domain/version 选择固定 phase schema，Runtime/领域发送器只接受已注册阶段及该阶段的输入类型；不是把 phase 设为任意字符串。领域的 `effectId` 为实际单次效果的稳定 ID（hookExecutionId、delivery segmentId、MCP request operationId、维护计划的步骤 ID），始终能反查父 operationId。`effectRevision` 固定该阶段参数/目标/前置证明；`operationRevision` 是 authority 条件更新/领取 gate 的控制版本，重领不改变 effectId/effectRevision。改参数必须有明确的新效果意图，不能覆盖未知原效果。

| 注册域                                    | v1 实际 phase 与结果                                                                                                                                                                                            |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| config_install / workspace_initialization | source_read（只读）、stage_view、install_view、enable_view、retire_view；初始化的 filesystem/registry/context/curator/watch 作为固定 component 分型；每项含原 config/root revision 与完整 receipt               |
| skill_activation                          | args_write、args_clear；正文/permission/Hook/model selector 的逻辑事实经 Session domain，不伪造 Runtime phase                                                                                                   |
| mcp_configuration / mcp_operation         | connect、discover_tools、discover_resources、discover_prompts、resource_read、prompt_get、subscribe、unsubscribe、disconnect；tool_call 仍是工具 invoke 的 execute，原请求 ID 不因 transport 重建变化           |
| hook_execution                            | command、http、prompt_bridge、registered_handler；具体 hookExecutionId/ordinal/inputRevision 固定，模型事实由有资格 Harness 提交                                                                                |
| channel_delivery                          | send_segment、edit_segment、query_receipt、revoke_message；adapter 未支持的 phase 拒绝，不能重发代替 query                                                                                                      |
| child_run / memory_job                    | launch、attach、cancel、drain；memory 的 scaffold、write、index、cursor、metadata 单独记结果，实际工具写入仍引用其原 invocation，不同时重复派发                                                                 |
| 历史/产物/工作区维护                      | prepare_backup、stage_file、apply_file、undo_file、copy_resource、publish_manifest、delete_owned、git_command、publish_artifact；路径/步骤由已提交计划的封闭 action union 决定，按每文件/分段稳定 effectId 记录 |

纯逻辑 schedule/Goal/parent acceptance 提交不创造物理 phase；一旦派发 child/工具/发送器，引用对应原效果 ID。工具定义中的混合阶段是 `execute` 下的已声明 segment（例如 fetch/model_bridge/file_publish），子 segment 使用独立 effectId 与输入摘要并汇总为一个原 tool receipt；新增工具版本必须同时注册其封闭 stage schema，不容许 Harness 自报阶段绕过实际 owner。

## 3. 重启和接管流程

1. daemon 启动先取得 authority writer，读取未结算binding/phase及原process refs，暂停相应 Session 的新 activation；不在扫描完成前启动 cron/Goal/通知。
2. 若原worker仍服务：通过认证的 runtime endpoint、binding incarnation、lease、cwd/root/config摘要和私有capability核对身份，安装门禁高水位，接管原status/cancel/结果。不能仅凭旧端口或PID attach。
3. 若worker已经退出：新reader仅打开原receipt store，核验独占/封存和资源完整性。settled 重交付Session；没有dispatch且有未开始证明的阶段才允许新受控派发；started无终态保持unknown。
4. 本地文件阶段可增加工具专用reconciler，例如核对已准备的原前像/后像、备份和持久事务阶段；只能输出有证据的已成功/未开始/可修复，不能对任意Shell命令用文件存在推定成功。
5. 外部API、MCP、Shell等非事务操作结果不明时提交 recovery_blocked。用户可继续查询、取消原工作、导出诊断、关闭待处理会话，或另开新任务；“重新执行”必须是显式新命令/新调用ID，并显示原未知操作仍可能生效。原成功/未知记录不能被人工确认覆盖为“未执行”。
6. 结算和资源恢复先于模型下一步。旧调用迟到结果始终经原binding校验接收；新worker绝不以同cwd替换原owner的结果归属。

新进程的启动不证明旧进程停止。未知物理工作保持持久风险状态，但已明确退出的worker不永久占用活进程槽；容量与未决事实分别计数。管理员移除workspace不删除原收件端和恢复记录。

## 4. 原进程所有权与平台

`ProcessOwnerRef` 包含 backend、hostId、boot/incarnation、ownerId、PID+startIdentity、作用域、执行phase及原生句柄/组身份摘要；不把PID单独作为可取消的目标。统一接口为 `spawnOwned`、`cancelOwned`、`inspectOwned`、`waitExited`，结果区分 exited/no_effect_proven/running/unknown/unsupported。

| 平台/profile   | 目标后端                                                                                                                       | 允许声明的保证                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| macOS 本地     | 保留现有 detached 进程组、PID开始身份和组观测；原生工具使用共同 owned-command                                                  | 证明已观测所属进程组退出；ps失败/PID复用/脱离组未知保持unknown；不是恶意进程安全沙箱                                              |
| Linux 普通本地 | 同一进程组后端；具备委派权限时选 cgroup v2 owner，所有派生进程启动即在该cgroup                                                 | cgroup.kill后核对cgroup.events populated=0及实际输出关闭；无权限保留明确的进程组profile，不声称具有cgroup隔离                     |
| Windows 本地   | 增加受控原生 launcher：CreateProcess挂起→加入禁止breakaway的Job Object→登记owner→恢复线程；取消使用Job，查询实际成员与管道结束 | 设置KILL_ON_JOB_CLOSE，不能只靠Node AbortError或根PID。Job分配/嵌套失败在恢复线程前拒绝；原生helper未安装/未验收时继续unsupported |
| 远端/容器      | 环境worker提供相同receipt/gate/process owner能力并声明backend                                                                  | 只承诺已证明的profile；容器运行不自动证明本地文件持久或外部请求撤销                                                               |

以上Windows方案基于Job的进程归属和关闭语义；通知可能丢失，因此以查询和管道关闭共同核对，不能仅等待一条通知。某些外部创建进程方式并不自动归Job，需专门适配或声明unsupported。[Microsoft Job Objects](https://learn.microsoft.com/en-us/windows/win32/procthread/job-objects)、[AssignProcessToJobObject](https://learn.microsoft.com/en-us/windows/win32/api/jobapi2/nf-jobapi2-assignprocesstojobobject)

Linux cgroup设计采用内核定义的层级存活计数与终止入口；不要求普通用户为了首版Managed必须取得管理员权限。[Linux cgroup v2](https://www.kernel.org/doc/html/latest/admin-guide/cgroup-v2.html)

首版存储profile为具备可验证文件身份和文件/目录同步的本地文件系统。macOS/Linux按原writer加强事务验证；Windows选定原生适配 `openIdentity/flushFile/publishNoReplace/replaceOwned/verifySealed`：以卷与文件ID及独占句柄验证身份，staging 与目标必须同卷，写完整文件后 FlushFileBuffers；发布用带 WRITE_THROUGH 的 MoveFileExW（no-replace 不设 REPLACE_EXISTING），受控替换另核验目标旧身份并持有原锁。禁止跨卷 COPY_ALLOWED 模拟原子提交，目录项/重命名耐久性须以实际NTFS配置的故障证据认证，不能凭该flag宣称任意设备断电安全；未达到存储契约则整个强耐久profile返回unsupported，而非降低ACK语义。网络盘、FUSE或无法提供identity/sync的挂载准确拒绝该profile；不靠平台名称猜保证。

Windows 的文件 flush 和移动操作按原生 API 的能力使用，设计中的身份/发布适配仍需实现与故障验证。[FlushFileBuffers](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-flushfilebuffers)、[MoveFileExW](https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-movefileexw)

## 5. 远端协议与凭据

**阶段归属：** 远端 Runtime 与跨主机挑战属于 R5/F8，不是默认切换的前置条件。R2～R4 只使用本地 profile；未启用 remote provider 时本节的握手能力不参与装配，缺少它也不影响本地 Managed 的准入与恢复。写在这里是为了让本地 gate 的时窗与身份规则从一开始就兼容跨主机场景，不是把跨主机作为交付范围。

复用现有RemoteManagedRuntimeProvider的可信endpoint和token入口，新增私有capability的协商，不新增面向模型的地址。endpoint由服务端配置绑定，禁用携带凭据的跨origin重定向；TLS验证默认必需，HTTP仅允许显式本机/受控开发配置。工具参数、Hook输出和网页内容不能更换endpoint、租户或凭据。

跨主机的gate不直接比较两边墙钟。Runtime生成一次性install/renew挑战并从挑战创建时启动本地单调倒计时；authority在该挑战上条件提交grant/renewal，经已认证私有连接返回 challengeId/runtimeIncarnation/SessionKey/grantRevision/commitDigest；Runtime核对响应身份及剩余时窗后开启或续期，迟到应答不能把期限重新从收到时间开始计算。下一epoch仍必须取得原Runtime revoke/stage屏障；联系不上则不发新工作，超期本身不证明旧副作用结束。相同挑战重复只返原ACK，binding重启后旧挑战失效。所有资格仍由authority和Runtime各自的单调版本共同约束。

本地profile保持既有60秒租期/20秒续租设计，远端使用同一上限但扣除挑战已经消耗的时间；挑战在10秒control deadline内未完成就失效并重新申请，不能续开被revoke的epoch。网络分区可以停止新派发并继续交付已开始结果，不从另一Runtime重跑。

当前同进程Session client与完整Harness继续适用；若未来Session authority独立部署，后端必须提供同等CAS、单writer、幂等和持久ACK，禁止两个authority分别使用本地文件授予同一Session。Kubernetes/VM的部署模板、调度产品和SaaS多租户平台不属于本次daemon替换交付；其适配需实现上述已定义的能力接口。

## 6. 容量、观测和性能门槛

容量沿现有daemon/Bridge配置，分开登记workspace、Session、activation、host、Runtime、未决phase和临时/持久资源。coordinator在全局共享预算上预留，不为legacy/Managed各开一套上限；provider lazy prepare并在真实退出后归还容量。新实现不自动把现有workspace上限扩大。

`ManagedExecutionMetrics` 采用固定低基数字段：engine、entry kind、phase、outcome、platform/profile；session/prompt/activation/invocation ID 只放结构化trace，避免指标高基数。记录admission/commit/queue/TTFT/model/tool/approval wait/recovery/drain耗时、活对象计数、保留资源bytes、失败原因、late/duplicate receipt和blocked状态。没有测量值输出unknown，不用0表示缺失；不记prompt正文、工具参数、密钥、完整路径或模型思考内容。

以下是待验收的默认切换门槛，不是已测得SLO：同机、同构建设置、同自有模型响应夹具，以legacy基线比较，预热20次，正式至少200轮并重复3组；排除供应商波动后，Managed入口/编排TTFT p95额外开销不超过max(100ms,legacy的20%)，无工具吞吐不低于legacy的90%，相同并发稳定RSS不高于legacy的125%。1/8/32会话分别测，若有效限额低于32按实际限额测并明确范围，不能为过测试升限额。

恢复读10,000事件（正文用refs）的p95目标≤2s；耐久提交小事务p95≤50ms，仅对符合该磁盘profile的测试机设门槛。30分钟稳定运行及100次create/close、reload和故障循环后，owner计数回基线、无自有子进程/端口残留，静默10分钟后RSS相对第一次稳定点增长≤10%；超出进入分析而非加timeout掩盖。实测硬件/OS/fs/Node版本、trace和误差随报告提交。未达门槛时保持默认关闭，按测量定位后修正实现或经明确方案修订改变门槛。

## 7. 运行验收矩阵

| 编号 | 必测动作与判断                                                                                                             |
| ---- | -------------------------------------------------------------------------------------------------------------------------- |
| O01  | 每个物理phase的intent/dispatch/settled/Session ACK窗口中断；已完成不重跑，未知准确blocked，未开始须附证明                  |
| O02  | 分别杀Harness、worker、daemon，保留/删除临时outputRoot；持久已提交资源可恢复，丢失唯一资源不能报成功                       |
| O03  | 新旧epoch并发、墙钟偏差、续租迟到、挑战重放、网络分区；无新越权派发，原回执仍可结算                                        |
| O04  | macOS/Linux进程组、Linux委派cgroup、Windows Job分别验证孙进程/根退出/ID复用/观测失败；不能互借平台通过结果                 |
| O05  | shared host与多个workspace代际混合关闭；只回收自有资源，old generation清理不触碰new generation                             |
| O06  | 1/8/32会话及性能/循环门槛，慢订阅/大媒体/磁盘压力；统计同时核对物理进程、authority及客户端，不用单个active Map证明全局空闲 |
| O07  | 不支持的profile、旧协议worker、错误信任/凭据、重定向、错tenant；在创建/派发前准确拒绝，不降级重跑                          |

## 8. 具体施工接缝

Core ManagedToolRuntime/owned-command/owned-process-group、managed-tool-file-history、Invocation reference与gate适配；CLI managed-tool-session、Runtime provider/worker routes、worker launcher/activator与registry drain；Session authority和coordinator的恢复/cleanup路径；平台原生helper与测试夹具；既有telemetry/tracing接入。先有持久phase与strict reader，再支持重启读取与工具专用reconciler，最后开放该恢复profile；不是仅把内存Map写到磁盘就宣称可恢复所有副作用。
