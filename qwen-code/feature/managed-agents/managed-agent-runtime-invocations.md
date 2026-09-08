# Managed Agent：Runtime invocation v2

状态：方案待实现。2026-09-09 按当前源码核对；本文不代表默认 daemon 替换已完成。

目标是让普通 daemon 的完整 Agent 留在常驻 Gateway，并把工作区工具真实执行交给独立 Tool-only Runtime worker。保留现有权限、调度、客户端事件和结果语义；不能用只读工具集作为最终替换验收。

## 责任边界

| Gateway                                                                    | 独立 Runtime worker                                                                     |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 模型循环、会话/历史、工具调度、L4/L5 权限与用户交互、最终执行授权          | 工作区工具真实构造/build、参数校验与规范化、工具固有权限 L3、确认数据与真实 `onConfirm` |
| 模型侧 task/subagent、Goal/计划/会话状态、ask-user、结构化输出、ToolSearch | 文件/Shell/Git/worktree、MCP 发现与执行、文件检查点、工具 Hook 和子进程                 |
| 模型输出转换、图片模型处理、客户端事件、持久化结果索引                     | 原始工具输出、进度、产物与受控资源读取                                                  |

Skill 由 Runtime 读取文件/运行脚本，Gateway 负责模型展开和模型覆盖；TaskStop 分别取消 Gateway 的 Agent 与 Runtime 的后台 Shell。不能仅按工具 `Kind` 决定归属。Session/Prompt Hook 的工作区脚本也需要远端执行，模型参与的决策仍在 Gateway；只迁移 Pre/PostToolUse 不构成完整 Hook 兼容。

## 已验证的实际入口

| 源码锚点                                                                                                                                       | 当前约束与改动位置                                                                                                            |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| [Config.createToolRegistry](https://github.com/doudouOUC/qwen-code/blob/824e92d84f41fc9ab19d1130385b491a8f37c466/packages/core/src/config/config.ts#L9078)                                                                    | 两处执行器共用 DeclarativeTool 注册表；在此替换工作区工具工厂，不能先本地 build 再替换 execute。                              |
| [ToolInvocation](https://github.com/doudouOUC/qwen-code/blob/824e92d84f41fc9ab19d1130385b491a8f37c466/packages/core/src/tools/tools.ts#L20)                                                                                   | DeclarativeTool.build 产生 invocation，再调用 getDefaultPermission、getConfirmationDetails、execute；确认回调不能直接序列化。 |
| [CoreToolScheduler](https://github.com/doudouOUC/qwen-code/blob/824e92d84f41fc9ab19d1130385b491a8f37c466/packages/core/src/core/coreToolScheduler.ts#L2078)                                                                   | build 后进入权限/确认；setArgsInternal（1749）会重建 invocation，执行前 guard 在 4648，execute 在 4853。                      |
| [Session.runTool](https://github.com/doudouOUC/qwen-code/blob/824e92d84f41fc9ab19d1130385b491a8f37c466/packages/cli/src/acp-integration/session/Session.ts#L10989)                                                            | 独立的完整执行路径：build（11380）、权限（11439）、确认（12158）、guard（12344）、execute（12505），必须同时接线。            |
| [现有 Runtime 执行](https://github.com/doudouOUC/qwen-code/blob/824e92d84f41fc9ab19d1130385b491a8f37c466/packages/cli/src/acp-integration/acpAgent.ts#L11698)                                                                 | 当前 manifest（845）限制只读，execute（11791）复用完整非交互调度器；不能直接作为 v2 的执行内核。                              |
| [非交互执行器](https://github.com/doudouOUC/qwen-code/blob/824e92d84f41fc9ab19d1130385b491a8f37c466/packages/core/src/core/nonInteractiveToolExecutor.ts#L30)                                                                 | 会再次运行 CoreToolScheduler；非交互 ask 被拒绝，且其结果处理可能调用图片模型。                                               |
| [ToolResult](https://github.com/doudouOUC/qwen-code/blob/824e92d84f41fc9ab19d1130385b491a8f37c466/packages/core/src/tools/tools.ts#L486) / [v1 返回值](https://github.com/doudouOUC/qwen-code/blob/824e92d84f41fc9ab19d1130385b491a8f37c466/packages/acp-bridge/src/bridgeTypes.ts#L127)                     | v1 responseParts/status/error 不能完整表达原始 ToolResult、产物和输出文件。                                                   |
| [Config 初始化](https://github.com/doudouOUC/qwen-code/blob/824e92d84f41fc9ab19d1130385b491a8f37c466/packages/core/src/config/config.ts#L3038) / [子 Agent 配置](https://github.com/doudouOUC/qwen-code/blob/824e92d84f41fc9ab19d1130385b491a8f37c466/packages/core/src/subagents/subagent-manager.ts#L1024) | 初始化及派生 Config 会建立本地服务/重建注册表；远端工具边界必须由真实 host producer 传入并继承。                              |

文件校验和确认本身已有工作区访问，例如 [ReadFile 参数校验](https://github.com/doudouOUC/qwen-code/blob/824e92d84f41fc9ab19d1130385b491a8f37c466/packages/core/src/tools/read-file.ts#L573) 和 [Edit 确认/diff](https://github.com/doudouOUC/qwen-code/blob/824e92d84f41fc9ab19d1130385b491a8f37c466/packages/core/src/tools/edit.ts#L408)。因此远端边界从真实 build 开始。

## v2 最小协议

沿用现有私有传输与 worker lease，不新增产品配置或通用授权框架。现有会话 `/prepare` 仍表示会话准备；以下 `prepareInvocation` 专指一次工具调用。通过独立 v2 方法/路由与能力协商扩展，v1 路由、严格请求字段及只读语义保持兼容；v2 能力不足时明确失败，写入/确认不得降级到 v1。

所有操作由服务器已解析的 tenant、workspaceId、canonical cwd、sessionId、worker generation/lease epoch 绑定，再校验 promptId、callId、capabilityDigest、policyRevision；不得从模型参数或任意客户端字段接受执行授权。固定 URL 模式继续使用原有认证，不伪造 owned-worker lease；两种模式都需要 v2 调用身份绑定。

| 操作                          | 最小语义                                                                                                                                                  |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| manifest                      | 返回工具声明、displayName、kind、permissionAliases、MCP server/tool 身份、defer/search 元数据及输出策略；所有影响权限/执行的元数据纳入 capabilityDigest。 |
| prepareInvocation             | Runtime 真实 build，返回随机 invocationId、normalizedArgs、argsDigest、描述/位置、L3、交互要求和分类器所需数据；此时不 execute。                          |
| getConfirmation               | 按 invocationId/digest 返回现有确认 union 的可序列化 DTO；真实回调留在 Runtime。                                                                          |
| confirmInvocation             | 校验绑定并调用真实 onConfirm；传递 outcome 及现有 payload，不能顺带 execute。取消释放尚未执行的 invocation。                                              |
| preflightInvocation           | 权限完成后，在原 PreToolUse 位置执行 Runtime Hook；保存 toolUseId/结果，返回 allow/ask/deny/stop。先于 Gateway 最终 guard，ask 重入不重复触发。           |
| executeInvocation             | 接受同一调用的 Gateway 执行授权，检查已完成 preflight、lease、版本、参数摘要及状态，只启动一次；重复请求返回同一次执行状态/结果。                         |
| cancelInvocation              | 返回 cancelRequested/当前状态；取消 ACK 不表示执行已结束。                                                                                                |
| watch/getResult、readResource | 按 invocationId 读取有序进度、终态及产物；断线后继续同一调用，不创建新调用重试执行。                                                                      |

准备记录保存规范化参数及真实 invocation，绑定上述身份与摘要；已准备记录在取消、到期、会话关闭或 generation 失效时释放。有效状态为 prepared → authorized → executing → settled；另有执行前 cancelled/not_started、needs_reprepare/needs_confirmation 和非终态 cancel_requested。过期的会话、lease、manifest 或授权必须拒绝。

授权只证明 Gateway 对该 invocation/digest 已完成现有权限与执行前 guard，使用现有认证私有通道传递即可，不引入签名体系。自动允许不会调用 onConfirm，因此授权不能等同于 confirmInvocation 成功；两处执行器按 Runtime preflight → Gateway 原 guard → 授权/执行的顺序接线，只调用一次既有 Bridge/provider 策略链。Tool-only worker 没有 Gateway 的活跃模型 Prompt，不能把它自身 Bridge 的反向 guard 当成 Gateway guard；v2 Runtime 不重复安装同一个 managed guard，仍检查执行身份、lease 和摘要。未授权的代理 buildAndExecute 必须失败。

## 注册表与两处调度器接线

1. Gateway host 按 workspace generation 创建远端工具注册表，注册 RuntimeBackedTool；proxy build 只做纯参数结构处理，不构造本地工作区工具。模型侧工具显式保留，子 Agent 派生 Config/重建注册表继承相同边界，额外 MCP 配置交给 Runtime 发现。
2. 给 ToolInvocation 增加可选异步 `prepare(signal, { callId, promptId })` 或等价窄接口；CoreToolScheduler 和 Session.runTool 在 build 后、读取有效参数/描述/位置/权限之前 await。旧工具行为不变，Session 补齐 promptId 传递；不能把网络准备偷偷放进无 AbortSignal 的 getDefaultPermission。
3. Gateway 用远端 L3/确认 DTO 继续现有 PermissionManager、交互确认、权限持久化和 guard。Runtime onConfirm 的必要效果按现有 outcome 显式同步，例如 ProceedAlways 对审批模式的影响；不提供任意远端 Config 修改能力。
4. Core 的 setArgsInternal、编辑器修改、权限 Hook updatedInput，以及 Session 的直接参数更新，都使旧 invocation/digest/授权失效并重新 prepare。编辑器可操作建议内容缓冲区，真实文件读取/diff 由 Runtime 完成，不能复用 Gateway 本地 EditTool 文件访问。
5. 保留当前 Hook 时序。现有 PreToolUse 返回 allow/ask/deny/stop 及上下文，不支持 updatedInput；参数重写来自 PermissionRequest Hook，按上一项重新 prepare/授权。PreToolUse 要求 ask 时，Runtime 返回 needs_confirmation 并保留 toolUseId，由 Gateway 按调用者现有策略处理：Core 以同一 callId 进入确认后继续，不能重复触发该 PreToolUse；Session 当前仍把 ask 视为阻断，不在本次迁移中悄悄改成自动允许或新增交互。迁移不额外新增 PreToolUse 改参能力，也不能为省一次 RPC 提前执行 Hook。
6. 从当前执行器抽取窄的“已准备 invocation 执行阶段”，包含 Runtime preflight/工具 Hook、执行绑定校验、execute 和进度；不把整个非交互 CoreToolScheduler 放回 Runtime。文件检查点保留真实 Edit/Write execute 内部的 FileHistoryService.trackEdit，并把 Session 的 turn makeSnapshot 接入 Runtime；不在内核外额外重复记一次 edit。Gateway 不重复运行这些 Hook，也不在 proxy 内调用本地 invocation.execute。

Gateway 既有 built-in guard 仍含本地文件检查，完整迁移需把这些检查放到 Runtime 并以绑定当前调用的结果接回原策略链，不能两端重复运行整个 guard，也不能在默认验收中豁免这些本地访问。

MCP 当前存在 `instanceof DiscoveredMCPTool` 消费者；proxy 需要可验证的 MCP 元数据/窄判定辅助，保留权限分类、显示、发现与输出行为，不能通过在 Gateway 构造 MCP client 满足类型分支。

## 输出、取消与资源生命周期

v2 返回独立 executionStatus（not_started/success/error/cancelled）及原始 ToolResult 投影：llmContent、returnDisplay、error、resultFilePaths、artifacts、persistedOutputFiles 和必要 Hook 上下文。字段按现有 union 校验，不传函数。Gateway 只包装一次 functionResponse，保留模型图片处理及规范历史记录；两处调度器不能因为调用过 proxy.execute 就把远端 not_started 误记成执行失败。

文件 diff、ANSI/Shell/MCP 进度、MCP App、终端图片等显示类型需要各自 DTO。工作区工具不得任意返回模型控制字段；Skill 的 modelOverride/终止语义按上述职责拆分。大输出遵守一次截断和现有预算，不能把截断后的字符串冒充完整产物。

Runtime 绝对路径不是 Gateway 本地路径。产物使用绑定当前 invocation 的资源标识及 MIME/size/digest，经授权读取并落入 Gateway 持久化存储后才能释放唯一副本；资源读取限制在该调用登记的输出中。后台 Shell 拥有独立活动占用及停止入口，prompt 完成不代表 worker 空闲。

进度使用单调 seq，支持重连/终态查询并标识缺口，终态只提交一次。取消继续沿真实 AbortSignal/子进程取消链传递；结果不确定时保留占用并按 generation 生命周期进入 retiring，禁止新 use，已有其他 use 可完成。只有执行终态或确认 worker 进程树退出才能释放不确定占用。丢失执行响应不得自动重新执行可能产生副作用的调用。

## 初始化与生产接入约束

Gateway Config 不能只设置 skipMcpDiscovery/skipHooks/skipSkillManager/skipFileCheckpointing 后仍初始化本地工具。需要在已有 host profile 下避免 FileService、extensions.refreshCache、ripgrep 探测、warmAll、过期 Agent worktree 清理及本地 MCP 文件读取；对应功能由 Runtime 接管，不能静默删去。Gateway 保留自身会话持久化与模型鉴权，不允许 LocalManagedRuntimeProvider 退回 Gateway 注册表执行。

配置由已解析 workspace/generation、信任状态及显式环境快照产生。Runtime 自行加载该工作区获准的工具配置；Gateway 不读其他 workspace 的 .env/MCP/Skill 文件补缺。信任撤销、配置 revision 变化及关闭应先封住新调用，再按现有 generation drain 规则取消/回收。普通 create/prompt 必须通过真实 Bridge/ChannelFactory 使用此注册表，接口单测或未被生产调用的 host option 不算接入完成。

## 分阶段实现与退出条件

| 阶段                      | 必须可验证的退出条件                                                                                                                                                                           |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. v2 协议与 Runtime 内核 | 独立 worker 完成真实 read/write/Shell 的 build、确认和执行；prepare 不写目标文件；错误 tenant/session/lease/digest 被拒绝；同 id execute 不重复产生副作用；v1 回归通过。                       |
| 2. 注册表及两处执行器     | 真实内存 ACP 使用完整 Agent，正常读写与 Shell 批准/拒绝均通过代理；Core 调度路径及子 Agent 工具同样接入；观测证明 Gateway 不 build/execute 工作区工具。                                        |
| 3. 完整语义               | 实测批准后改参重新确认、Hook 恰好一次、编辑 diff、MCP/Skill、图片/大输出/产物、后台 Shell 停止；两处执行器保留 not_started、取消及客户端显示语义。                                             |
| 4. 普通 daemon 接入       | 真实普通 create/prompt 经过 Bridge → 完整 Gateway Agent → 独立 Runtime；跨 workspace 隔离、撤销信任、配置轮换、断线重连、worker 死亡和 shutdown await 均验证，持久化产物在 worker 回收后可读。 |

每阶段补充对应源码测试及真实进程验收；阶段 1–3 不宣称普通 daemon 默认替换完成。第 4 阶段还需原有消费者回归，模型只在 Gateway、工作区副作用只在 Runtime 的观测证据作为最终退出条件。

实现前需按现有确认/显示 union 列全序列化字段，并核对全部 MCP 类型判定消费者；这些是协议实现清单，不增加产品配置。具体路由命名及内部授权接口随最小接线确定，以上身份、参数摘要、单次执行和结果语义不可省略。

2026-09-09 阶段 1 基线已使用隔离的真实 worker/ACP 进程验证：当前只声明 v1，已有 v1 路径拒绝 protocolVersion 2 及额外 invocation 字段，真实 read 成功，manifest 不包含 write/Shell，错误 lease/epoch/tenant 被拒绝。重复 release 曾返回 500，另一轮返回 released:true；不据此声明响应幂等或资源清理语义已达到 v2 要求。v2 准备、确认、执行及结果查询尚未实现，此基线不是阶段 1 验收通过。
