# Managed Runtime：持久回执、平台与运行验收

更新日期：2026-09-10；源码基线 `a836081466`。本文补齐全量目标中的 worker/daemon 重启、远端执行、平台和容量设计，配合[存储契约](managed-agent-session-storage.md)、[私有门禁](managed-agent-control-protocol.md)及[coordinator](managed-agent-coordinator.md)。这些增强尚未实现；首个交付仍先保证原 coordinator/worker 存活时替换 Harness，后续按本稿扩大能力。

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
