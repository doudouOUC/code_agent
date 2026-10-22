# Qwen Code Managed Agents 双链路方案

**10-22 能力闭环：** [#15094](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15094.md) 的 1 MiB checkpoint 与原 attachment 恢复阻塞观察、[#15170](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15170.md) 的 32 项/48 KiB 页及 4096 页/64 MiB 链已合入，不是无限历史/常数内存。[#15100](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15100.md) 生命周期原键与阅读导出不提供恢复备份；[#15104](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15104.md) V16 压缩保留原 journal/candidate/Hook，[#15119](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15119.md) 空闲授权 MCP 管理只选管理员 pin，[#15131](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15131.md) 以同快照原 prompt 证据判断继续/cleanup，UNKNOWN 不重跑。[#15171](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15171.md) V17 新 root 一层委派要求 session isolation、无 MCP/Hooks/SSH/CSI，原实际模型/审批/Skills 固定且取消先存 fence。[#15200](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15200.md) 双数据库 fork 与本地验证预算只改测试/CI。

> **W43 当前快照（2026-10-23，main `c61044fae46c`）：** 10-19 至 10-22 累积 40 个个人 PR，37 merged/1 open/2 closed。[#14602](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14602.md) 固定 Skills、[#14604](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14604.md) 展开详情、[#14628](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14628.md)/[#14704](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14704.md) 8 MiB 编码附件/GIF/JPG alias、[#14639](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14639.md) 本地/SSH 文本快照引用已合入。[#14603](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14603.md) 的独立 SQL wake 扫描与 [#14679](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14679.md) 的 monitor/child 后继通知不扩大未知执行重放；[#14695](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14695.md) 只恢复原 SETTLED 批次及严格闭合的最终输出。[#14710](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14710.md) 保持单 Maven/部署并重排 Java 职责包。

main 当前 canonical V1–V17、32 业务表；[#14698](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14698.md) 的 V12 与 boot6 应用 SETTLING/FROZEN/CUT/DRAINED 已合入，不证明 Pod/PVC 删除或完整 K2。此前 #14487/#14523/#14599 已合入，W42 表格与下方标注旧 head 的 open 讨论保留历史快照；#14290 仍 open，#13526 仅确认元数据 head `5af71a247a19`，不审计其累计 proposal。本次仅独立核对 diff、changed files、关键调用与主干，未运行源码、浏览器、真实 MySQL/OSS/CSI/SSH/模型或部署验收。

[#14758](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14758.md) 最终只补已有常驻路径的可信平台/验收说明，[#14761](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14761.md) 节点离线安装/冷启动关闭未合入；[#14765](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14765.md) 最终独立增加 OWNER 显式空闲退役，原 Workspace/binding 保持 DRAINING，Pod 删除请求仍不释放 reservation/PVC/PV。[#14760](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14760.md)/[#14767](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14767.md) 是转换日志压缩和历史查询索引，不是完整长期存储上限；[#14762](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14762.md)/[#14766](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14766.md) 只增 MCP/媒体保留验证。[#14763](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14763.md) 原 prompt 终态取消对账、[#14764](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14764.md) V13 cleanup 债务引用、[#14816](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14816.md) 传输内部去重与 [#14875](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14875.md) disposable MySQL 逐类隔离均已合入。[#14916](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14916.md) 是持久 MCP 菜单、非连接/调用 API；[#14920](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14920.md) live approval 仅在双能力与原授权下影响后续检查，Plan/模型仍需空闲，原 Hook/Turn 快照不改。

> **10-21 新建增量：** [#14930](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14930.md) 创建时冻结所选 daemon Workspace 启用的 Skills 正文，原 receipt/ref/digest 与幂等键贯穿恢复，不复制宿主 assets；[#14970](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14970.md) 默认关闭、原 OPEN/loopback 单用户切片导入已有项目（当前 signed 扩展见 #14928），登记仓库外根并验证原物理身份。[#14987](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14987.md) 将原 fenced 改名命令接 WebShell；[#15061](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15061.md) 只合入双链路统一导航，显式 Workspace/权限/pending 不回退另一后端。[#15026](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15026.md) V15 将普通 LOCAL/SSH_LOCAL 执行权改为每 Runtime Session 并发成员，undo 独占和维护 drain 保留；这是共享可变文件系统，不是隔离事务，旧 canonical 部署需停写排空切换。[#14928](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14928.md) 已合入精确版本下载、普通 daemon 前门/boot/延迟 ACP、安全模型目录和 signed loopback 项目导入；[#15040](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15040.md) 本身仍 closed 未合入，不用后续实现改写历史状态。[#15066](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15066.md) 故障门禁适配已合入；[#15072](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15072.md) 本地 MCP 两 Turn/close 验收仍 open。代码合入不表示本次运行源码/下载/发行或数据库/进程/部署验收。

> **v1.13 Runtime 身份核验：** [中文设计](managed-runtime-attestation.zh-CN.md) / [English](managed-runtime-attestation.md)定义持久 `READY` 恢复后的 scheduler reconcile、私有 `attest`、数据库 CAS 与本 JVM ready gate。`feature/managed-agents-p0-p8@e666150153` 已修复预览分支真实 outer gate 的 404 和 E2E 密钥注入；upstream #12447/#12506/#12522/#12552/#12627 已合入 route/worker/Java client、本地进程采用和持久恢复基础。后续 #12691/#12692/#12865 已补 Hosted 接线、Spring 控制面和显式 durable provisioner；真实部署保证仍按各切片验收。该私有协议不新增公共 OpenAPI 路由。

> **v1.12 创建时选择 Workspace：** [中文设计](managed-agent-workspace-context.md) / [English](managed-agent-workspace-context.en.md)细化工作区选择器、可选子目录、创建前能力/默认查询、原键重试、持久绑定及 Broker/Worker 接线。OpenAPI v1.12 同步 planned 契约；W0 准入、选择器、私有执行和恢复 fence 已由 #12709/#12730/#12754/#12797/#12839/#12869 合入；Session 目录切换仍属独立 W2。

> **v1.10 审查修订（2026-09-21）：** [中文](managed-agent-contract-closure.md) / [English](managed-agent-contract-closure.en.md) 明确两种受理 Profile、逐批 delivery 认领、Action API、ContextBinding、真实 V1/V2 升级、actor ACL、close/archive/delete 与容量门槛。同步 HTML/OpenAPI/[storage delta](managed-agent-storage-schema.mysql.sql)/[command delta](managed-agent-command-schema.mysql.sql)；目标契约不表示已全部实现，后续切片状态见下文。

> **当前基准：[HTML v1.13](managed-agent-dual-path-architecture.html)。** 同步日期：2026-09-22；在用户提供的 v1.2 上补充首版运行条件、普通工具接线、统一 Session 身份、事件与恢复契约、扩展运行模型、SQL 物化、Workspace/cwd、v1.10 契约收敛、完整工具结果、创建时工作区选择及 Runtime 身份核验。现行架构保留 `qwen serve` 统一会话协议与同 daemon 的 Legacy/Managed 双引擎；Java 是产品控制面并内嵌 Runtime Broker，托管部署使用 Java Pod + qwen serve Sidecar，工具环境按需启动。实施顺序为 HTML 的 A～H。
>
> **存储与事件实现补充（更新于 2026-09-21）：** [Java 存储、事件与会话恢复设计](managed-agent-storage-event-architecture.md)已经收敛数据库/MQ 边界，并冻结 [OpenAPI](managed-agent-public-api.openapi.yaml)、[MySQL 目标 DDL](managed-agent-storage-schema.mysql.sql)、多实例 owner/通知及 Harness 恢复协议。源码分支已完成 `AgentStateStore`、有界 Harness 事件批处理、游标/序号/终态单事务提交、提交后本机 SSE 直推、V2 Item/Snapshot 物化及 WebShell Snapshot 加尾部恢复；独立 `feature/managed-agent-p2-delivery` 分支的 `72e215c1e5` 又实现 V4 SQL Batch/Delivery，尚待与 P3 的 V3 集成。Outbox Relay、RocketMQ/Redis Transport、PostgreSQL 适配器及完整 Harness/资源恢复仍待实现。这一补充细化 D/F/G，不改变既有组件职责与 A～H 顺序。
>
> **Workspace/cwd 设计补充（2026-09-21）：** [中文方案](managed-agent-workspace-context.md) / [English](managed-agent-workspace-context.en.md) 区分稳定 Workspace、Session 相对 cwd 与 Runtime 挂载路径，补齐创建绑定、冷恢复、受控目录切换、后台任务归属及旧数据迁移。[OpenAPI](managed-agent-public-api.openapi.yaml) 与 [增量目标 DDL](managed-agent-workspace-schema.mysql.sql) 同步；该段保留 2026-09-21 设计基线；当前 W0 与 W1a/W1b/W1c 已有实现，Java 已持久绑定 Workspace，状态见下方补录快照。
>
> **Runtime Broker JDBC 补充（更新于 2026-09-25）：** [中文方案](managed-runtime-broker-jdbc.zh-CN.md) / [English](managed-runtime-broker-jdbc.md) 记录 Binding、Runtime Session 和 Tool Execution 三类 Repository 的四表切片。#12390/#12391/#12438/#12445 已依次合入 JDBC binding/session、内存 execution、Broker core 和第四表 JDBC；#12458 是关闭的平行实现。#12477/#12478 已合入 owner fence 与数据库时钟修复；#12522/#12552 已合入 attestation client 与本地进程采用。#12627 已合入加密 seed/handle 持久化与恢复 CAS 基础；Spring/Flyway 与 durable provisioner 已分别由 #12692/#12865 合入；多进程与部署故障保证仍须对应验收。

> **Hosted Harness 私有协议基础（2026-09-22）：** #12409 已合入 `HostedHarnessContract` 与 Express middleware：protocol v1、进程级 boot UUID、canonical capability digest，以及稳定 426/400/409 generation fence。该 PR 没有创建 Hosted profile、挂载 route、广告 capability 或接入 Java client；bearer authentication 与部署 capability canonicalization 仍由后续集成完成。
>
> **阶段 H 设计补充（2026-09-20）：** [扩展运行时设计](managed-agent-extension-runtime.md)统一 MCP、Hooks、Channels、自动化、子 Agent、后台 Shell 与 Monitor 的执行 owner、持久资源、任务投影、Runtime hold 和恢复语义。该文档补齐设计，不表示 Hosted Managed 已启用这些能力。
>
> 本次是文档对齐，不表示新阶段已实现或通过验收。此前 `JavaAgentProvider / M0～M8 / 首阶段 Java 统一 Session authority` 路线已[归档](managed-agent-java-hosted-runtime-history.md)，不再覆盖 HTML。源码中的接口差异、已有验证记录和未完成项见[实现对照](managed-agent-java-hosted-runtime.md#17-实现快照与待对齐项)。

> **W38 upstream PR 快照（更新于 2026-09-22）：** #12301 与 #12302 已合入上游，分别提供 Java Runtime 状态基础和 Managed Session v1 Transcript 基础。#12358 仍是 open draft architecture preview，当前 head `e666150153` 已修复私有 `v2/attest` 的 outer-route 404、增加穿过真实 gate 的回归测试，并为 E2E 注入临时 Broker 凭据加密密钥。该分支已有 reconcile/attest gate、同宿主进程接管与 Kubernetes adapter，但 route 仍是双清单，且跨 TS/Java conformance、真实集群、生产 MQ/Redis 和跨平台验收尚未完成；不能用预览实现覆盖本文 A～H 目标契约或宣布完整 Managed Agents 已交付。

> **W39 upstream PR 快照（更新于 2026-09-27）：** #12390/#12391/#12438/#12445 已合入 Broker/JDBC 基础，#12409/#12447/#12506/#12522 已合入私有协议与 attestation 基础，#12477/#12478 已合入正确性修复；#12458 为 closed 平行实现。#12552/#12627/#12630/#12637/#12654 已合入本地进程采用、持久 binding 恢复基础、v2 工具 wire contract、Java HTTP 方法和 Hosted Harness Java client；后续主干已挂载 worker 工具路由并扩展本地 provisioner，但跨 Broker 接管与生产 Hosted Managed 链路仍未验收。

> **W39–W41 实施快照（2026-10-09，主干 `55ee50d34e55`）：** #12671 挂载 worker 工具路由；#12691/#12692/#12693 合入 Hosted 基础、Spring/双链路 WebShell 与持久 journal；#12709/#12730/#12754/#12797 合入 Workspace 准入、context、私有执行与选择器，#12713/#12831/#12848 合入私有文本/文件/前台 Shell。#12865/#12869/#12977 合入持久本地 worker、可信 reboot 和人工审计恢复；#12920 是已合入的 docs-only 后置排期决定，M2/M4–M6 不由此实现。#12894/#13037 合入远程结果与公共投影；#13084/#13225/#13090/#13296 合入退休保护、默认关闭 collector、部署门禁与保护候选退避，#13087 closed 未合入。#13088/#13138/#13260 合入 W1a/W1b/W1c；#13135/#13194/#13354 合入 Session close、closed retention 和 ACTIVE 删除。#13289 仅为已合入的实验 CSI worker/ACK 基础。

> **W41/W42 归档快照（2026-10-19，主干 `79362c2ecc21`）：** W41 #13642 retention 已合入但仍须独立开启/cleanup release-proof 资格，#13526 累计 CSI proposal 仍 open。W42 完整创建集合 43 PR（37 merged/4 open/2 closed），既有能力保持；#14484 定义改策已 merged，10 月 18 日新增 #14526 单 run 取消与 #14531 Plan/附件 merged。#14290 搜索、#14487 私有 CSI 文件、#14523 回执完整恢复和 #14599 创建预热 open；#14141/#14174 closed 未合入，不据主干重叠代码改 merged。各 PR 保留创建周，见 [W39](../../weekly-report/2026-09-21_2026-09-27/README.md)、[W40](../../weekly-report/2026-09-28_2026-10-04/README.md)、[W41](../../weekly-report/2026-10-05_2026-10-11/README.md)、[W42](../../weekly-report/2026-10-12_2026-10-18/README.md)。

> **读取失败边界：** #12742 已合入准入后瞬时读取失败的结算保护，以原 sink 重试终态写入；只有再次结算失败才阻塞，不能把失败写入当成功。#12950 已合入托管文件路径拒绝的结果保全，保留拒绝原因和原调用结算，不把路径拒绝变成挂起执行。

> **W41 的 2026-10-13 历史 open diff：** #13526 `4088e2455c2c` 校验原批次/资源再消费结果，boot6 CUT/finalization、五分钟 retirement 屏障不证明 Pod/卷已释放；当前元数据 head 为 `1a6529b73c00`，本次未复核累计 diff，只核对已拆出切片，不承诺累计方案全部增量。#13642 旧 `5832d8824a31`/V69 观察保留在 W41，其当前已合入 head `75f118ac7504` 不因后续合入移到 W42。#13654 的 async 行为已在 canonical catalog 继承，FAILED collector 对象仍须 VERIFIED；旧 V68/V69 不是当前部署编号。

> **公开前台 Shell 最终实现：** #13674 区分默认关闭的 Shell opt-in 和 Workspace files 总准入，fresh sending 需 `foregroundShell=true`；最初仅 default/auto-edit，后续 #14323 已允许内置 bound Session 显式 yolo 及空闲切换，部署默认不变。Java create/load 抑制 child agents，Hosted 未附着 child orchestrator 时不接 message funnel，Connector 重验原有效策略/能力。其最初合入时公共 Shell 生命周期关闭；当前 #13931 已合入 L4 v2，但仍须全部 consumer 升级并显式开启精确 profile，不能以文件准入或 archive 操作推断物理关闭。不表示公开后台 Shell/Monitor 或 CSI 全能力已开放。

> **Parts 与验证基础（已合入）：** #13750 的 `hosted-harness-model.ts:runHostedHarnessTextTurn` 校验并复制完整模型 Parts，无工具分支不再只返回 text，thought-only 不算已回答；suppressOutput 仍抑制返回 Parts。#13763 的 `.github/workflows/qwen-triage.yml` 在不可信 PR checkout 前安装固定校验的 Java/Maven，PR 只恢复可信 Maven cache，随后无 token 准备 siblings；准备失败明确 Not covered。它们分别修复历史保全和 CI 覆盖基础，不证明完整冷恢复、Java 测试或 MySQL/OSS 门禁已通过。

> **W2/G3/CSI 当前实现：** merged #13760 在 [Workspace/cwd 双语方案](managed-agent-workspace-context.md)接通 OPERATOR capability、原 revision/幂等键持久意图与完成后摘要确认；#13761 仅保留关闭前观察。merged #13777 在[恢复与运维](managed-agent-recovery-operations.md)保存原模型请求、限定原生审批批次与 cleanup debt，精确追踪 prompt 与实际 Runtime Session owner，不泛化 Hooks/MCP/Shell 重放。merged #13772 固定 root descriptor，前后验证 mount/disk/dev/inode 并逐级 O_NOFOLLOW 解析 cwd，close join 借用/观察并聚合错误；挂载身份不保证内容不可变或公共 CSI 已开放。

> **私有 worker 与锁顺序（已合入）：** [#13899](../../weekly-report/2026-10-05_2026-10-11/implementations/pr-13899.md) v5 绑定原 input/grant/prepared history，排斥 prepare/execution 重叠，保留 backup；drain 仍 DRAINING/BLOCKED。closed [#13893](../../weekly-report/2026-10-05_2026-10-11/implementations/pr-13893.md) 的重叠 profile 仅作历史观察，主干来源为 #13899。[#13894](../../weekly-report/2026-10-05_2026-10-11/implementations/pr-13894.md) 核验持久 original Runtime 后 placement-first；普通/K1 锁序不替代私有 CSI 全链路接线。

> **周更 head 增量：** #13642 补 binding/generation execution lease 引用索引；#13654 将 Session recovery block 与原 writer/identity 冲突永久 fenced，但不因此证明对象损坏，未知读异常才保全 PENDING/bytes/charge 供重试。#13777 为长 wake ID 的 prepare/cleanup 保持原身份，封闭 resident recovery 与 close 竞态，图片引用快照不冷重发。#13899 增加 history 容量预拒绝、准备失败后原观察对账、部分写入/取消的文件回滚及 seal executor 准入；#13894 新增五种入口的真实 MySQL 锁竞争 IT。本次只核验代码/用例，没有执行源码、MySQL/OSS/CSI 或产品 E2E。

## 当前方案入口

cwd 准入/广告与原 initiator 的已合入行为见 [Workspace/cwd 最终实现](managed-agent-workspace-context.md#41-webshell-最终实现2026-10-12)；旧 V56/V63–V69 与 CSI branch V69–V72 仅为 legacy/历史迁移观察。W42 归档时 main canonical V1–V10（当前版本见上方 W43），V3 为 immutable Session-list keyset，V4/V5/V6 分别覆盖 Workspace 创建、模型和审批快照，V7 SSH、V8 Turn command operation、V9 原 Harness 索引、V10 Plan；#14185 改 V1/V3 为 epoch-ms/gmt 列。先验证 catalog，不沿旧清单升级 legacy 库；没有现存 DATETIME catalog 的版本化升级，不可 repair 历史后宣称兼容。

> **W42 增量：** [客户端](managed-agent-client-surfaces.md)记录已合入定义审批、Plan/附件和单 run 取消，搜索/私有 CSI 文件仍 open。[恢复](managed-agent-recovery-operations.md)与 [JDBC 双语](managed-runtime-broker-jdbc.zh-CN.md)区分已合入原资源行为、open 回执完整恢复与创建预热，不宣称完整 K2、idle/硬预算/keep-warm。[存储](managed-agent-storage-event-architecture.md)/[SDK](../sdk.md)同步 V1–V10、独立 Plan/原输入与双能力兼容边界；[完整结果](managed-agent-tool-result-artifacts.zh-CN.md)保留原停止/receipt 及展示边界。本次仅文档审计，前次 parser 保留原 revision；未运行源码、浏览器、MySQL/OSS/CSI/SSH/macOS 原生或部署门禁。

新增实现入口：[常驻设计 #14214](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14214.md)、[身份策略 #14254](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14254.md)、[actor roles 冲突标记清理 #14270](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14270.md)、[目录整合 #14277](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14277.md)、[Commons #14280](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14280.md)、[搜索 #14290](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14290.md)、[prompt #14306](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14306.md)、[文本/Range #14307](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14307.md)、[首页与模型 #14316](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14316.md)、[SSH #14318](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14318.md)。文档标记清理不增加 ACL 能力，open 条目不能扩写成已上线。

10 月 16 日新增：[静态扩展 #14319](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14319.md)、[审批切换 #14323](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14323.md)、[共享 owner #14339](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14339.md)、[常驻文件 #14340](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14340.md)、[扩展验收 #14357](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14357.md)、[发布与后台关闭 #14364](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14364.md)、[存储接口 #14370](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14370.md)、[取消恢复 #14377](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14377.md)。取消恢复已合入，但不把 HTTP 接受、租约过期或普通 history 当成物理停止/原生 receipt。

10 月 17 日新增：[目录与进度 #14405](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14405.md)、[公开常驻 #14435](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14435.md)、[输出提示 #14436](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14436.md)、[macOS 身份 #14442](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14442.md) 与后续 [保存定义审批 #14484](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14484.md) 均 merged。

10 月 18 日新增：[私有 CSI 文件 #14487](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14487.md)、[回执完整恢复 #14523](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14523.md)、[创建预热 #14599](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14599.md) open；[单 run 取消 #14526](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14526.md) 与 [Plan/内联附件 #14531](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14531.md) merged。stacked diff 的规模不代表独立 main 增量。

v1.11 增加[完整工具结果与持久产物](managed-agent-tool-result-artifacts.zh-CN.md)及 [HTML 图解](managed-agent-dual-path-architecture.html#tool-results)，明确现有本地保存与待实现的 Hosted 交付、读取、展示边界。v1.12 细化[创建时选择 Workspace](managed-agent-workspace-context.md#3-创建与请求路由w0)，OpenAPI 升至 v1.12。v1.13 细化[Runtime 身份核验与就绪门禁](managed-runtime-attestation.zh-CN.md)，不改变公共 OpenAPI；既有目标 DDL 不变，完整工具结果新增接口仍需在 O1～O4 实现前纳入类型和契约测试。

先读 [HTML 双链路技术方案](managed-agent-dual-path-architecture.html)，再读对应的 [Markdown 技术方案](managed-agent-java-hosted-runtime.md)。[首版运行契约](managed-agent-first-runtime.md)固定最小范围，v1.4 新增[普通工具接线设计](managed-agent-ordinary-tools-integration.md)，补齐 Bundle/Session、调用阶段、资源交付及回收续轮；v1.5 固定公共 API、qwen Session Authority、JSONL 和 Runtime Broker 共用同一个 RFC UUID `sessionId`；v1.6 冻结事件接受、SSE、存储、API Schema、多实例通知与恢复边界；v1.7 统一阶段 H 的扩展运行模型；v1.8 同步 SQL 物化实现快照与 Runtime Broker JDBC Repository 边界；v1.9 补齐 Workspace 与 Session cwd 的 W0/W1/W2 设计；v1.10 收敛七项审查接缝。原 v1.2 可从 Git 提交 `479432d`、v1.3 可从 `7e96cb2` 追溯。

| 文档层级 | 用途 | 冲突处理 |
| --- | --- | --- |
| HTML v1.13 | 决定组件职责、部署、目标协议、状态、公共 API、Workspace 选择、Runtime 身份核验、完整工具结果、扩展运行时、持久化实现边界和 A～H 阶段 | 作为当前架构基准 |
| Markdown 双链路方案 | 将 HTML 转为可检索的契约、时序、实施门槛及实现差异 | 与 HTML 同步，不用源码现状反向改写目标 |
| Session/Harness/Runtime 专项 | 细化 owner、存储、权限、工具、checkpoint、取消、恢复及兼容 | 按 A～H 映射；不能提前宣布 G 的完整外置/接管已完成 |
| P/D/R/F 历史阶段与验收记录 | 追溯实验、局部能力、失败和测试环境 | 保留原日期与范围，不作为另一套当前实施顺序 |

## 首版运行范围

首版验证采用单 Java + qwen Sidecar、预发布静态 Bundle、Session 独占 Runtime，复用现有产品 SSE/历史。Hosted 请求必须由可信入口从已认证身份注入 `X-Qwen-Tenant-Id`，所有资源按 `(tenantId, resourceId)` 校验；终端用户身份系统、配额与跨租户故障验收在生产开放前完成，不阻塞单实例运行烟测。

首版只支持普通工具，以 Read、Write、Edit 和前台 Shell 为最小验收集；自动记忆、子 Agent、后台 Shell 暂不涉及。复用现有配置与 Bundle 工具目录表达范围，普通工具所需的审批、结果/文件历史保存和取消清理仍是必需项。

- 五项必需：qwen 持久受理后 ACK 与原请求幂等、Broker 完整调用/查询、固定 Bundle、Session 归属与持久存储、Runtime 有界创建/取消/释放。
- 条件必需：已开放工具需要的审批必须可用；跨 Session 共享 Runtime 开启前完成独立配置/权限/gate/释放验收。
- 多 Java 副本启用前完成原 owner 路由与跨副本 provision 去重；单实例验证不证明分布式能力。
- D 的独立公共 Item/eventSequence 投影、G 的共享 Authority/自动接管和 H 的完整扩展可后置；首版按[运行验收 M01～M10](managed-agent-first-runtime.md#8-首版验收与阶段关系)交付。

多 Workspace 接入与 H 阶段扩展前先交付 [W0 持久 Workspace 绑定](managed-agent-workspace-context.md#8-实施顺序与验收)；W1 随恢复阶段验收，W2 目录切换不阻塞固定 cwd 的最小闭环。它们细化 A/B/C/D/G/H 的依赖，不替代原阶段编号。

普通工具还须完成[补充验收 S01～S08](managed-agent-ordinary-tools-integration.md#9-补充验收与实施顺序)：真实 Edit 审批、Shell 大输出持久交付、文件历史提交、Runtime 干净回收后同 Session 继续下一轮，并覆盖 ACK 丢失、取消及存储故障。

## 1. 架构与职责

```text
托管：前端 -> Java Product API -> qwen serve Session/Prompt/SSE
                                  ├── Legacy -> qwen --acp -> 原 Workspace
                                  └── Managed -> 进程内 TS Harness -> Model
                                                    └── Java 内嵌 Broker -> Tool Runtime

本地：qwen serve -> Legacy / Local Managed -> 本地或 Auto Local Runtime
```

- Java 负责产品鉴权、租户、配额、Session 后端路由、公共资源/事件投影、RuntimeBinding 和 Execution Ledger。
- qwen serve 负责统一 Session/Prompt/Load/Resume/SSE、执行引擎选择、固定 owner 和客户端兼容。
- Managed Harness 负责唯一完整模型循环、Context、压缩、工具编排与 Approval；不以 Java 重写 Agent。
- Tool Runtime 负责 Workspace、文件、Shell、Git、搜索、MCP、Artifact 和物理取消，不接收用户 Prompt 或模型凭据。
- 执行 Transcript/checkpoint 的权威与 Java 公共投影分开；阶段 G 才外置权威事件与 checkpoint、完成可替换 Harness 和取消实例粘性。

首次 Prompt 由 Java 并行转发 Harness 与启动/复用 Runtime。无 Tool 直接完成；有 Tool 才在同一 Turn 内等待 Runtime ready，随后继续原模型上下文。不是先临时回答再迁移到 Pod。

## 2. 双链路与部署

四种 Profile 为 Local Legacy、Local Managed、Hosted Managed、Hosted Legacy。本地 Managed 使用 Auto Local Runtime；Hosted Managed 第一阶段采用 Java Pod + qwen serve Sidecar，Broker 与 Java 同进程，Tool Runtime 为按需 Pod/Process。第一阶段不建设独立 Harness Worker Pool。

新 Session 仅在用途、可信 cwd、扩展依赖和协议版本均兼容时选择 Managed。已有 Legacy、兼容性未知、依赖未迁移 MCP/Hooks/Channels，以及 Channel/Scheduled Task/Standalone/Worktree/Branch 首阶段保留 Legacy。创建时持久化 executionEngine，运行中不切换；Managed 失败不调用 Legacy 重跑。

Legacy 续接须创建新 Managed Session ID 并记录 migratedFrom。完整历史转换后续再核验 writer 封存、压缩/Tool Result 和能力兼容，不能原地热切换。

## 3. 协议与恢复

| 边界 | HTML 目标契约 |
| --- | --- |
| 浏览器 → Java | 产品 `/sessions`、Prompt、Cancel、Events；不直连 Harness/Runtime |
| Java → qwen serve | 复用 `/session`、Prompt、Cancel、Resume、`/events` 等 daemon 契约 |
| Harness → Java Broker | `JavaBrokerManagedRuntimeProvider` 调用 prepare/manifest/execute/cancel/release，并使用原 execution 查询、control 与持久结果 ack；见[目标方法表](managed-agent-first-runtime.md#3-broker-到-runtime-的最小协议) |
| Java → Runtime | `/healthz`、`/v1/prepare`、manifest、executions/query/events/cancel、release；HTTP 与 SSE 均由 Java 发起 |
| 公共 Agent API | 阶段 D 在 Java 提供 Agent/Session/Event/Turn/Item；Session UUID 直接贯穿 qwen/Harness/JSONL/Broker，其余公共 ID 与内部 attachment、进程和 Runtime ID 解耦 |

上表是目标接口。现有代码使用 `/internal/runtime-broker/v1/*` 等路径，必须按[接口差异表](managed-agent-java-hosted-runtime.md#17-实现快照与待对齐项)适配和验收后才称为对齐。

稳定 executionCallId 用于查询原调用与幂等；started 后失联且无法证明终态时进入 recovery_blocked，禁止换 Runtime 重放。取消 ACK 不证明工具或进程树已停止；有未决副作用或未转存 Artifact 唯一副本时不能释放资源。

首版复用现有 SSE 与正式历史查询；D 开放的公共事件使用 eventSequence / Last-Event-ID，Items/Turns 从权威记录投影，届时补齐原子提交/重建契约。旧实验 `/managed/sessions*` 不升级为公共 API，待 Java 覆盖 admission、事件、查询和幂等后退役；普通 `/session + executionEngines` 保留。

## 4. A～H 实施顺序

A～H 表示能力阶段，完整 D 不阻塞 E 的现有产品 API 首版闭环；A/B/C/E 联合 F 的必要验收先交付，D/G/H 按各自门槛扩展。

| 阶段 | 做什么 | 怎么做 |
| --- | --- | --- |
| A | 冻结协议和基线 | 资源/状态/trace identity，TTFT、Pod 启动和前三轮 Tool 分布 |
| B | 双引擎正式接线 | 同 Bridge 的 Legacy/Managed、持久 owner、兼容 selector、指定流量 |
| C | Java 内嵌 Runtime Broker | Binding、Execution Ledger、租约和 Java→Runtime HTTP/SSE，不单独部署 |
| D | Public Agent API MVP | Agent/Session/Event/Turn/Item、AgentBundle revision、公共投影、实验 API 退役 |
| E | Hosted Harness | Java Pod + qwen serve Sidecar；推理/provisioning 并行；禁止本地 Tool fallback |
| F | 可靠性与故障注入 | ACK/SSE/started 断线、三端崩溃、Cancel 竞争、Artifact 失败 |
| G | Session Authority 外置 | 共享事件/checkpoint、可替换 Harness、activation epoch/fencing、取消粘性 |
| H | 扩大 Managed 范围 | 先建立共用领域账本/任务投影，再迁移 MCP、Hooks、后台 Shell/Monitor、child/workflow/team、Channels、Automation；Media、Worktree 和历史操作沿专项验收 |

完整完成门槛见[实施与验收](managed-agent-java-hosted-runtime.md#15-ah-实施顺序)。P0～P9a、D1～D5、R1～R5/F1～F8 只作历史切片索引；C01～C18 继续覆盖完整能力面，并映射至 A～H。

## 5. 专项技术文档

| 专项 | 如何使用 |
| --- | --- |
| [普通工具首版接线](managed-agent-ordinary-tools-integration.md) | 源码调研依据、Bundle/Session 字段、完整 Broker 操作、bytes 交付、持久挂载/回收续轮与 S01～S08 |
| [全量能力覆盖 C01～C18](managed-agent-full-design.md) | A～H 对应、能力范围和专项验收索引 |
| [Session / Harness / Runtime](managed-agent-session-harness-runtime.md) | 三层职责、单一执行权威、checkpoint 与阶段 G 接管 |
| [执行引擎选择与持久化](managed-session-execution-engine.md) | 阶段 B 的 selector、同 Bridge 双引擎、sticky owner |
| [Session 存储](managed-agent-session-storage.md) | 本地权威日志、writer、公共投影与共享存储的边界 |
| [Java 存储、事件与恢复](managed-agent-storage-event-architecture.md) | `AgentStateStore`、事件批次、提交后 SSE、SQL/MQ/物化边界、MySQL/PostgreSQL 与恢复阶段 |
| [Runtime Broker JDBC 持久化](managed-runtime-broker-jdbc.zh-CN.md) / [English](managed-runtime-broker-jdbc.md) | Binding/Session/Execution Repository、四表 schema、CAS/租约 fencing、H2/真实 MySQL 验证与 Spring 接线边界 |
| [Runtime 身份核验与就绪门禁](managed-runtime-attestation.zh-CN.md) / [English](managed-runtime-attestation.md) | reconcile + attest + CAS + 本地 gate、route 单源、失败分类、跨 TS/Java 契约门禁与部署身份 |
| [Public API 与 WebShell 契约](managed-agent-api-contract.md) / [OpenAPI](managed-agent-public-api.openapi.yaml) | 统一公共/WebShell 路由、DTO、错误、幂等、分页、SSE 与租户范围 |
| [MySQL v1.10 目标增量结构](managed-agent-storage-schema.mysql.sql) | 真实 V1/V2 后新增 Batch/Delivery/Receipt/immutable Snapshot/Owner，保留已有 Item/Part 与每 Session 进度 |
| [Session 兼容](managed-agent-session-compatibility.md) / [方法映射](managed-agent-session-method-map.md) | 复用 daemon 契约及原调用者审计 |
| [完整 Harness](managed-agent-harness.md) | TS Agent 装配、逻辑 handle、安全点与恢复范围 |
| [私有协议](managed-agent-control-protocol.md) | Java/daemon/Broker/Runtime 边界、fencing、原调用恢复 |
| [coordinator](managed-agent-coordinator.md) | daemon 执行协调与 Java Broker 资源协调的职责 |
| [客户端与事件](managed-agent-client-surfaces.md) | 产品 REST/SSE、公共投影与内部游标映射 |
| [恢复与运行](managed-agent-recovery-operations.md) | F/G 故障、物理回执、平台和容量验收 |
| [Runtime invocation v2](managed-agent-runtime-invocations.md) | 复用工具身份、权限、执行回执和取消语义 |
| [配置与扩展](managed-agent-config-extensions.md) | AgentBundle、MCP/Skills/Hooks 版本和执行归属 |
| [扩展运行时](managed-agent-extension-runtime.md) | MCP、Hooks、Channels、自动化、子 Agent、后台 Shell 与 Monitor 的共同状态机、任务投影、恢复和 H0～H6 顺序 |
| [全部工具与文件历史](managed-agent-tools-history.md) | 工具族、Artifact、备份、撤销、迁移 |
| [完整工具结果与持久产物](managed-agent-tool-result-artifacts.zh-CN.md) / [English](managed-agent-tool-result-artifacts.md) | v1.11 调研与拟议契约：裁剪前捕获、不可变分段、receipt ACK、三种结果表示、range/下载、WebShell 与引用保留；Shell O1/O2、O3 投影及 O4 保护/collector/门禁已合入；其它工具与部署验收仍按目标契约推进 |
| [子作用域](managed-agent-child-scopes.md) / [自动任务](managed-agent-automation.md) | 扩展范围的持久准入、调度、交付与父子关系 |
| [搜索](managed-agent-search-tools.md) / [Grep](managed-agent-grep-tools.md) / [Notebook](managed-agent-notebook-tools.md) / [媒体](managed-agent-media.md) | 局部工具能力与有限验收，不能外推全部阶段完成 |

## 6. 历史设计与证据

历史生产源码锚点为 [a836081466](https://github.com/doudouOUC/qwen-code/commit/a8360814668b3dfdff72ad3d99cbcaf26dd009a9)，历史文档提交为 [32543e5273](https://github.com/doudouOUC/qwen-code/commit/32543e527348bc5400641267933d3da9d5f0313b)。它们不代表 QwenLM/qwen-code main 已具备相同能力，也不作为本次 HTML 对齐的完整实现证明。

| 阶段 / 记录 | 内容 |
| --- | --- |
| [P0](managed-agent-runtime-p0.md) / [P1](managed-agent-activation-p1.md) / [P2](managed-agent-prompt-admission-p2.md) | Runtime、activation/lease、Prompt admission |
| [P3](managed-agent-live-prompt-p3.md) / [P4](managed-agent-gateway-bootstrap-p4.md) / [P5](managed-agent-multi-turn-p5.md) | live Prompt、已淘汰的非权威 bootstrap、多轮绑定 |
| [P6](managed-agent-tool-runtime-p6.md) / [P7](managed-agent-eager-authoritative-p7.md) / [P8](managed-agent-remote-runtime-p8.md) | Tool-only、权威模型立即开始、远程协议 |
| [P8 会话展示](managed-agent-session-surfaces.md) / [P9a](managed-agent-local-runtime-activation-p9a.md) | 实验 Managed UI、Local Managed 的激活与生命周期证据 |
| [daemon 总方案](managed-agent-daemon-default.md) / [R1～R5 计划](managed-agent-daemon-default-plan.md) | B/G/H 可复用的能力与接缝；阶段顺序以 A～H 为准 |
| [daemon 历史调查](managed-agent-daemon-default-history.md) | 原有调查、失败和验收全文 |
| [原 README](managed-agent-readme-history.md) | P0～P9a 摘要、实验命令、数据与测试限制 |
| [原 Java 产品方案](managed-agent-java-hosted-runtime-history.md) | 已替换的 M0～M8/Provider 路线及当时的实现记录 |

HTML 当前修订作为方案基准；已有代码、定向测试、本地进程 E2E、真实产品 E2E 和生产灰度分别记录。本次未重跑历史测试，后续按目标契约逐项补齐证据。
