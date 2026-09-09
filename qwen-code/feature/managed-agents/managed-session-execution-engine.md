# daemon 会话执行引擎选择与持久化

## 目标与当前缺口

本项优先级遵循[首阶段计划](managed-agent-daemon-default-plan.md)。先让同一工作区的普通 daemon 会话按创建时确定的执行引擎运行，再扩大 Managed 默认适用范围。完整媒体展示、Skills、后台任务和历史迁移继续延期，已验证能力保留。

调查基线为 `bbeaf24bdb`。普通 daemon 的三处 workspace factory 和直接嵌入入口仍启动 ACP 子进程。完整 Managed host 已存在，但同一 Bridge 只有一个可复用 channel，创建来源在取得 channel 后才传入。仅替换 factory 无法保留同工作区中的旧会话和 Channel 路径。

当前 `sourceType` 表示创建来源；`managed-gateway` 专用于禁止 Prompt 的 Tool-only Session；工作区 `runtime-owner.json` 表示进程所有权；writer lease 表示写入资格。这些字段都不能兼作会话执行引擎。普通 Prompt 和 Cancel 已使用 SessionEntry 的 connection，可以复用其队列和事件契约。

本文是待实现设计，不表示默认入口已经切换。

## 不变量

1. 同一 Session ID 的执行引擎不可变。创建、冷恢复决定连接，后续发送、取消、审批、模型设置和关闭沿既有连接执行。
2. 新建仅在用途和有效配置明确兼容时选择 Managed。Channel、延期能力依赖和兼容性未知选择 legacy。已有 Managed 恢复遇到不兼容配置应失败，不能改选 legacy。
3. Managed 失败后不调用 legacy factory 重试。响应丢失、初始化超时或关闭未收敛，不代表工具未执行或原所有者已退出。
4. 旧会话必须有完整可读的无引擎记录证据才能解释为 legacy。未知版本、非法值、冲突、读取失败不能被默认值掩盖。
5. 面向客户端仍使用普通 Session、Prompt ACK、事件和 transcript。完整 Managed Agent 不冒用 Tool-only 的来源或独立实验会话协议。
6. 保留同一 Bridge 的 Session 总量、ID reservation、事件和 workspace owner index；引入两个执行通道不能翻倍既有会话限额或进程预算。

## 持久化与恢复

在普通 transcript 中新增不可变 system 记录 `session_execution_engine`，payload 为版本 1 和 `legacy` / `managed` 枚举。Session ID、cwd 和项目存储域由 transcript envelope 与 SessionService 验证，不保存进程 ID、模型凭据或整个配置。相同记录可以幂等；不同值不能 last-wins。引擎属于整个会话，不能在压缩或选择另一条历史分支时消失。

SessionService 提供严格读取。读取应覆盖所有物理引擎记录，而不是只查尾部或当前有效模型分支；区分不存在的会话、完整旧会话、有效所有者和不可判定状态。历史展示仍允许原有容错读取；执行恢复不能用容错读取中的字段缺失推断 legacy。应复用现有文件快照、JSONL 完整性和项目归属能力，避免另造第二份 owner 文件。

创建与恢复按以下顺序执行：

1. 保留既有 workspace/generation、Session ID reservation、来源及数量准入。CLI 的 Bridge 回调根据真实用途、配置或严格历史预读选择引擎。
2. 取得该引擎的 channel。expected engine 来自服务端实际 host 配置，不接受外部 `_meta` 授权；响应中返回实际引擎，Bridge 核对后绑定 entry。
3. 新建 Managed 必须启用持久记录与 writer lease。获取 lease 后重新读取权威历史，核验预读选择；新建严格落盘 owner 后才能进入会话初始化的 Hooks、MCP、模型及工具副作用。写失败沿已有清理流程拒绝发布 Session，不能像来源记录一样返回 `persisted:false` 后继续。
4. 恢复前的配置加载也必须检查 owner。当前 nonleased recorder 在构造时就可写，且 Goal 恢复可能早于 `Config.initialize`；因此只在 `activateChatRecording` 的 leased 分支校验不够。`loadCliConfig` 的 resume/continue/fork 以及运行中切换入口必须保留引擎证明或拒绝不支持的接管，不能让原生 CLI 或非 leased ACP 绕过保护。
5. writer lease 内的第二次检查防止预读到取得 lease 之间历史变化。完整恢复与 selective projection 都携带相同 owner；不能以 recent replay 没有 owner 为依据改选。

实现读取时，在 `SessionTranscriptReader` 的物理行解析阶段累计完整性和引擎记录，早于结构过滤、UUID 去重和活跃分支筛选。复用 JSONL 已有完整性解析器及文件快照前后校验；解析器能完整恢复的拼接对象可接受，部分恢复不能证明没有 owner。只读索引保留错误诊断，执行加载显式要求有效证明；证明绑定同一个 Session 和文件快照，不能把另一轮读取的 owner 拼接到较旧的恢复数据。

Managed 的 writer lease 是必要条件，但 `experimentalZedIntegration` 和实际录制状态也影响它是否生效。验收要检查最终 Config 和 ACP host 冻结的协议值。用户关闭录制时，创建选择应保留 legacy，直接 Managed 创建则明确拒绝，不能静默打开录制；恢复已记录 Managed 时不能借关闭录制绕过归属检查。真正的只读 replay 由内部调用用途明确指定，不能用用户配置推断。

保持只读 transcript/list 可用。完整 Managed fork/rewind 等迁移尚未验收时，执行入口准确拒绝，不能复制出一个无 owner 的 Session 再交给 legacy。`SessionService.forkSession` 在截取历史和选择分支前检查源的完整物理 owner；当前拒绝 Managed 源，legacy 源的新记录由归属证明生成，不能从被截取的消息猜测。archive/unarchive 的既有物理移动应保留记录并做回归。

## 同一 Bridge 的两种通道

保留原 spawn factory 为 legacy，另提供 Managed factory。只把可复用 channel、在途创建和对应 idle 状态按引擎分槽；继续使用一个 `byId`、一个总量 admission 和 `aliveChannels`。同一种引擎并发创建合并，不同引擎独立创建。dying、初始化失败、晚到响应和 shutdown 仍须等实际所属资源退出，不能因新槽可用而遗忘旧通道。

| 操作                                  | 分派依据                                                            |
| ------------------------------------- | ------------------------------------------------------------------- |
| 普通新建、手动内部新建                | 服务端用途和有效配置，只选一次                                      |
| `single` attach、热恢复               | 已有 entry，不能按当前默认值改变引擎；来源/用途冲突保留既有准入限制 |
| 冷 load/resume                        | 严格持久 owner；缺少有效记录的完整旧会话固定 legacy                 |
| Prompt、Cancel、权限、模型、cwd、关闭 | live Session 的 connection / channel；不重选                        |
| transcript/list/工作区文件等只读控制  | 明确的工作区控制通道；不启动另一模型执行者                          |
| 延期的 MCP/Hooks/Skills 工作区控制    | legacy 控制通道；不能声称已同步到 Managed                           |
| fork/branch/运行中历史切换            | 已验证的源所有者契约；Managed 未支持时明确拒绝                      |
| shutdown、强制退出、idle/reap         | 所有存活通道及在途创建，保持既有资源与失败语义                      |

会话通知必须校验它来自 entry 的实际 channel；双通道不能只凭 sessionId 让另一个 channel 对已有 Session 发通知。没有 Session ID 的控制消息必须有明确工作区归属，不能挑任意 channel。

## 首阶段兼容选择

不要为探测兼容性启动 Hooks 或 MCP。先使用现有无执行副作用的配置加载；未能确定扩展有效状态即视为未知，选择 legacy。有效 MCP 包括 settings、`.mcp.json`、CLI、Session 注入、extension、runtime overlay 及 allow/exclude/safe/bare 的共同结果。Hooks 包括用户、可信项目和活动 extension，并受禁用设置影响。

服务端需传入创建用途，不能把缺省 source 或字符串 `default` 当作完整支持证明。例如手动定时运行目前使用 `default` 加 `scheduled_task_run:`，子会话有父关联，Channel 有可信来源；这些均须进入共同选择入口。当前不能绑定的 worktree/cwd/context、模型/权限或延期能力组合选择 legacy。

实际 Managed host 初始化前复核必要配置。如果选择后配置变化，不在初始化副作用开始后改投 legacy。已 Managed Session 的后续配置变更只能在已验证范围内应用，超出范围准确失败。有限默认启用必须有正向可达的普通创建范围；不能以所有请求都选 legacy 通过测试来宣称替换成功。

## 实施与验收顺序

| 次序 | 实现范围                                                    | 必须证明                                                                                               |
| ---- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 1    | 严格 owner 读取、落盘、真实配置加载/初始化保护及恢复传播    | 真实 Managed 新建有 durable owner；旧引擎及非 leased/CLI 恢复不能接管；未知/冲突/写失败不进入执行      |
| 2    | 双 channel、共同创建/恢复选择、实际 owner 回执与 entry 绑定 | 同工作区 Managed/legacy 共存；发送/取消/关闭固定归属；限额和关闭不回归                                 |
| 3    | 有效配置、用途兼容判定和所有普通 factory 接线               | primary/secondary/replacement/嵌入入口一致，REST 与 ACP HTTP/SDK 路由一致；延期来源仍原路径            |
| 4    | 普通 Web Shell/SDK 及必要故障验收后有限默认启用             | 普通 create/prompt/events/transcript/cancel、冷重启、权限和故障实际经过 Managed；legacy 不发生隐式重跑 |

主要涉及 core 的 SessionService、transcript reader、ChatRecordingService、Config，CLI 的配置加载、ACP Session 创建/恢复与 managed channel，ACP Bridge 的通道生命周期和 Session 类型，以及 daemon 四处入口。新增 system subtype 同时进入共享 transcript schema，避免被结构校验记作未知类型。按上述顺序交付，避免只增加未被实际调用的字段。

测试先用全局 CLI 与当前 bundle 建立隔离基线，再验证本地构建。重点覆盖创建回执丢失、写失败、预读与 lease 之间变化、非 leased ACP/CLI 接管、压缩后 recent replay、同工作区两种引擎并发、单引擎故障和 shutdown。当前 4170 预览、用户配置和用户历史不作为夹具。
