# Managed daemon 默认实现：首阶段实施计划

更新日期：2026-09-10；代码核对基线 `a836081466`。完整范围与 C01～C18 能力/入口/状态/验收总表见[默认替换总方案](managed-agent-daemon-default.md)，三层责任与接口见[Session / Harness / Runtime 全局架构](managed-agent-session-harness-runtime.md)。历史 D1～D5 不再单独决定当前执行顺序。用户最新要求先完成全局设计，本轮不开始实现。后续在保留当前 4170 预览、用户数据和已验证能力的前提下，先抽出权威 Session 服务并接入完整 Harness，再完成创建时的兼容选择与普通 factory，让兼容范围明确的新 daemon 会话使用 Managed 默认实现。保持现有 Agent 行为，不把局部验收扩大为全部默认替换完成。

## 当前优先顺序

| 顺序 | 工作                                                             | 完成证据                                                                                                                                                              |
| ---- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1   | 固定 owner 和配对 Bridge                                         | 持久引擎、共享准入、实际回执和发送/取消/恢复归属保持；已有专项验收，不等同普通默认接通                                                                                |
| R2   | Session/Harness/Runtime 拆分、有效配置与四处 factory 接线        | 先证明独立 Session 权威、完整 Harness 重建、持久等待与原调用回执恢复，再验证 selector 和四处普通接线；生命周期与共享预算一致                                          |
| R3   | 普通 Web Shell/SDK 核心链路和必要故障验收                        | create/prompt/events/transcript/cancel、队列、权限、重连、冷恢复、写失败、取消/关闭、重复请求和多工作区通过；MCP/Hooks 依赖及 Channels 来源保留原路径                 |
| R4   | 有限范围默认启用                                                 | primary/secondary/replacement/直接嵌入四处默认工厂策略一致，只有兼容范围明确的新会话默认 Managed；现有会话 owner 稳定，延期能力继续原路径，代码/方案/指定远端分支一致 |
| R5   | 按后续优先级接入定时任务核心链路及补齐延期能力，扩大默认适用范围 | 手动和自动定时任务均符合实际执行/取消/恢复契约；每种新增能力独立验收后再扩大默认选择，不将有限启用等同全量迁移                                                        |

R1/R2 原对应旁支十项清单的第 6 项，R3 对应其第 7 项普通 Web Shell/SDK；本轮按最新要求在 R2 前半段加入三层拆分，不能继续只按旧旁支顺序接 factory。正确工作目录、信任状态、模型与权限配置，有效 MCP/Hooks 依赖和 Channels 来源的识别，以及权威会话持久化与恢复是必要基础，不能一并延期。

## 延期范围与保留行为

首阶段不新增 MCP、Hooks、Channels 的 Managed 接入迁移。旁支第 2～5 项的完整迁移也暂缓：图片展示/产物访问；工作区初始化、Skills 与有效配置；后台进程/子任务/自动记忆；文件历史/撤销/分支/历史迁移。已经验证通过的现有实现保留。最小配置和 owner 恢复属于当前必要基础，与这些完整迁移区分。

当前 PDF 物理取消修复及在途验证已经收尾；Harness PDF 转写等媒体设计保留，不把完整媒体迁移作为开始执行引擎选择调查或实现的额外门槛。依赖延期能力或兼容性不明的会话在创建时固定 legacy。旧实现的保留是明确的入口/配置兼容策略，不是失败后的隐式降级；运行中配置变化不能悄悄更换 owner。

## 当前证据与下一步

M1 已交付；PDF 物理取消已在五阶段真实基线中复现并修复。R1 的持久归属切片现已实现：完整物理 owner 证明、writer lease 内权威校验和严格写入、Config/CLI/UI 恢复保护、实际 ACP engine 回执。build/typecheck/bundle、相关 core/CLI 定向测试及独立审查通过。7 组真实进程验收证明 Managed 新建和冷恢复成功，leased/nonleased ACP 与原生 CLI 拒绝接管，关闭录制时拒绝创建；详细证据与覆盖边界见执行引擎设计。

同一 Bridge 的双通道和 SessionEntry 归属绑定已实现并验收：共享会话限额、ID reservation、事件及资源账本，在创建/冷恢复时调用服务端 selector，核验实际引擎回执后绑定 entry；发送/取消/关闭沿已绑定通道运行。build/typecheck/bundle、885 项定向测试、自审和独立审查通过。两组真实 host 验收证明同工作区共存、双向模型流取消、关闭后冷恢复及活会话交接关闭；合计 10 次原生 Read/final、22 次模型 HTTP，物理资源和 writer 凭据已独立核对。该证据不代替默认入口及权限等未覆盖验收。

严格 settings 与项目 MCP 读取基础已实现，并接入实际 Managed host 的启动和 new/load/resume；旧版 settings 仅内存迁移，坏配置明确拒绝，悬空祖先目录不再误判缺失。构建、类型检查、定向单测和独立复审通过，真实验证证明十六次坏配置拒绝不改写配置/历史，修复配置后原会话可恢复并完成 Read。它保留原全局配置路径语义，尚不构成跨来源、跨 QWEN_HOME 的统一输入快照。

当前先完成全局设计，后续按 R2.S1～R2.S3 抽出 Session 权威接口、接入完整 Harness、补齐持久等待与原调用恢复，再执行 extension 严格只读输入、全来源依赖/用途兼容和普通 factory 接线。三个普通 workspace factory 及直接嵌入入口尚未切换。MCP 包括 extension、runtime 和 Session 注入，Hooks 受 extension、trust 与 disable 设置影响；Channels 入口保持原执行路径，热 attach 也须校验用途。[执行引擎详细设计](managed-session-execution-engine.md)继续维护这部分消费范围，完整媒体等后置项不改变三层设计边界。

每步沿用设计、基线或复现、实现、相关包定向测试、build/typecheck/bundle、真实行为验证、自审与独立审查。变更推送至 `feature/managed-agents-p0-p8` 并同步 companion 方案。未经验证的兼容判定不得用于扩大默认范围。

## R2 的具体施工与验收顺序

以下均为后续施工设计，不因本次文档更新变为已交付。本轮停在设计阶段；施工时先按新增三片完成 Session 独立权威与恢复，再执行原 R2.1～R2.4；每步保留可审查的变更和证据。

| 新增步骤                | 本步产物                                                                             | 验收边界                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| R2.S1 Session 权威接口  | 全部读写消费者、首批事件/命令、单一日志格式、幂等提交、writer/fence 和旧格式适配     | 无活 host 可读写；输入与唤醒意图持久；重复 ID 唯一；旧 epoch/跨 workspace 拒绝，不双写权威历史                     |
| R2.S2 完整 Harness 接入 | 复用完整 Agent，Session client、checkpoint、正式事件与 UI 投影，物理 writer 安全交接 | 替换 host 后历史/owner/配置与下一轮保留；首轮失败可继续；原 Agent 行为保持，不升级实验精简 Runner 作为默认模型循环 |
| R2.S3 持久等待与恢复    | 工具/审批等待、原 invocation 回执、派发资格屏障、detach 与 close 分离                | 换 host 不取消原调用；完成 ACK 丢失不重执行；旧代新派发无副作用；Runtime 丢失不丢 Session，未决副作用明确阻塞      |

逐方法兼容清单已补齐，见[接口与实现串联](managed-agent-session-compatibility.md)及[方法映射附录](managed-agent-session-method-map.md)。R2.S1 先建立现有实现与本地接口的一致性基准，再接入可等待的持久提交；每个增强点必须同时迁移实际生产者和消费者，保留 sendPrompt/onPromptAdmitted、审批 boolean 与 best-effort 记录的旧契约。

施工按三份专项细化：[Harness](managed-agent-harness.md)定义完整循环与九组 checkpoint；[私有协议](managed-agent-control-protocol.md)定义消息、文件同步 ACK、activation 安装、原调用结算和引用保留；[coordinator](managed-agent-coordinator.md)定义单一 authority 调度与四处装配。R2.S1 将 activation 事实并入 authority，以窄适配复用 scheduler，保留实验 store；输入与唤醒一起提交。R2.S2 先实现 A/D 安全点、基础 activation 门禁及完整 Agent 读写，排空旧 handle 后再替换；禁止绕过实际 ACP Session→LlmChat/runTool 的接缝。R2.S3 再实现 B/C 工具和审批等待，在同一 installing/stage/enable/revoke 协议上支持在途交接、原 Runtime 接管与可恢复 detach；handler 返回不得再等同 turn 完成。

字段与时序已有专项契约；编码前仍需可编译 schema/validator、实际限额表及平台文件同步/崩溃证据。恢复首版限定 coordinator 和原 worker 存活时替换 Harness；worker/daemon 丢失且未决时保持 blocked，跨 worker 重启回执后端单列后续工作。未取得恢复证明时保留现有 `recovery_ambiguous` 保护。

| 步骤                       | 本步产物                                                                                                      | 验收边界                                                                                                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R2.1 空扩展只读输入        | Store 严格 empty proof → CLI Managed loader → Config/同一个 Manager；初始化、状态刷新和管理 mutation 共用保护 | 接受真实常规初始化空 store；不改字节/元数据；坏 state/事务/链接/安装候选不放行；绑定后不能加载新扩展，legacy 正常管理保留                                          |
| R2.2 全来源与用途策略      | 真实 MCP/Hooks/argv/env/trust/来源、runtime/client 动态输入进入共同检查；新建/冷恢复/热 attach 规则明确       | settings/项目/top-tier/extension/动态依赖及 safe/bare/allow/exclude 按实际消费判定；已有 Managed 不兼容准确失败；Live/cron/standalone/Goal 不按 default 字符串放行 |
| R2.3 四处 coordinator 接线 | 同一服务内部组合、延迟 registry/provider、共享进程所有权、host-before-worker 清理、新环境与 generation 绑定   | 普通入口无需实验 flag；worker/注入者不递归；并发预算不翻倍；shutdown/remove/reload/撤信任/失败不泄漏或串工作区                                                     |
| R2.4 普通接线复验          | 明确允许组合、对应代码版本、实际入口及未覆盖列表                                                              | Web Shell/SDK/REST/ACP 至少正向实际 Managed 与真实 Runtime 工具/final；旧会话与未知依赖走 legacy，失败无隐式重跑                                                   |

最新空 store 基线已证明原 refresh 会写入，且普通基础 lock 与真实 lock.lock 不同；新只读 API 和 fixed 组仍待实现。详见执行引擎设计新增章节。本轮只核对源码与既有报告，未重跑历史产品测试；macOS 的已记录局部证据不能替代 Linux/Windows 验收。Windows 原生命令进程组路径目前明确 unsupported，有限范围默认必须限定已支持且已验收的平台/工具组合。

## 后续阶段与完整完成条件

R4 仅是兼容范围的有限默认，不结束总目标。R5 继续手动/自动定时、内部自动执行、媒体/产物、Skills/本地初始化、MCP/Hooks/Channels、后台 Shell/PTY/子任务/记忆、物理历史与全部客户端/平台组合。每项开始前补实际调用者、协议和状态转换、迁移/失败策略及可执行验收计划；完成后更新总表状态和允许范围。

最终逐项核对 C01～C18 的要求、证据、平台与入口。历史兼容可按固定 legacy owner 保留，但不能把大量未迁移新用途一直走 legacy 视为完整默认替换。旧数据不变、无跨引擎重跑、当前预览保留、代码和方案推送一致都是交付条件。与部署载体相关的 P9b/Kubernetes 继续独立规划，不阻挡本地默认替换。
