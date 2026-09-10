# Managed daemon 默认实现：首阶段实施计划

更新日期：2026-09-11；代码核对基线 `a836081466`。完整范围与 C01～C18 能力/入口/状态/验收总表见[默认替换总方案](managed-agent-daemon-default.md)，三层责任与接口见[Session / Harness / Runtime 全局架构](managed-agent-session-harness-runtime.md)。历史 D1～D5 不再单独决定当前执行顺序。用户最新要求补齐[全量详细设计](managed-agent-full-design.md)，本轮不开始实现。后续在保留当前 4170 预览、用户数据和已验证能力的前提下，先抽出权威 Session 服务并接入完整 Harness，再完成创建时的兼容选择与普通 factory，让兼容范围明确的新 daemon 会话使用 Managed 默认实现。保持现有 Agent 行为，不把局部验收扩大为全部默认替换完成。

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

上面两段 R1 证据的适用范围必须一起写清：`managed` 引擎的选择条件是配对 factory 存在（`packages/cli/src/config/config.ts:1909`），而唯一生产该 factory 的 `createManagedAgentChannelFactory`（`packages/cli/src/serve/managed-agent-channel.ts:70`）当前只被自己的单测引用，`packages/acp-bridge/src/bridge.ts` 的 `executionEngines` 也只在测试中注入。因此这些定向测试与真实进程验收都是在测试装配或分支内 staged host 下取得的，**证明的是机制与拒绝路径正确，不证明任何默认入口已经产生过 `managed` owner 记录**；复核这些数字时必须连同其装配方式一起复现。在 R2.3 完成普通 factory 接线之前，R1 的 enforcement 在默认路径上等于 no-op，不能据此把 R1 记为“默认已接通”。

严格 settings 与项目 MCP 读取基础已实现，并接入实际 Managed host 的启动和 new/load/resume；旧版 settings 仅内存迁移，坏配置明确拒绝，悬空祖先目录不再误判缺失。构建、类型检查、定向单测和独立复审通过，真实验证证明十六次坏配置拒绝不改写配置/历史，修复配置后原会话可恢复并完成 Read。它保留原全局配置路径语义，尚不构成跨来源、跨 QWEN_HOME 的统一输入快照。

当前先完成全局设计，后续按 R2.S1～R2.S3 抽出 Session 权威接口、接入完整 Harness、补齐持久等待与原调用恢复，再执行 extension 严格只读输入、全来源依赖/用途兼容和普通 factory 接线。三个普通 workspace factory 及直接嵌入入口尚未切换。MCP 包括 extension、runtime 和 Session 注入，Hooks 受 extension、trust 与 disable 设置影响；Channels 入口保持原执行路径，热 attach 也须校验用途。[执行引擎详细设计](managed-session-execution-engine.md)继续维护这部分消费范围，完整媒体等后置项不改变三层设计边界。

每步沿用设计、基线或复现、实现、相关包定向测试、build/typecheck/bundle、真实行为验证、自审与独立审查。变更推送至 `feature/managed-agents-p0-p8` 并同步 companion 方案。未经验证的兼容判定不得用于扩大默认范围。

## R2 的具体施工与验收顺序

R2.S1 已进入施工，其余两片仍是设计。R2.S1 拆为 R2.S1a 记录格式与 R2.S1b 权威追加路径：**R2.S1a 已交付**，`packages/core/src/managed-runtime/managed-session-records.ts` 按[存储规范](managed-agent-session-storage.md)实现 §1 的三个 ChatRecord subtype 与 header 字段、§2 的 StableId/Sequence/Digest/Time/SessionKey/DurableRef 共用规则、§3 的 15 项封闭 kind union 及逐 kind 必需字段与四类 actor 资格、§3.1 的 30 个封闭 domain、§5 的记录与事务限额，并含原始 JSON 重复键拒绝（`JSON.parse` 会静默折叠它）。证据：57 项定向单测通过，`chatRecordingService` 原 126 项与 `managed-runtime` 全部 212 项无回归，仓库 build/typecheck、该包 prettier/eslint 通过。独立审查发现格式层无法表达规范允许的「输入投影适配」生产者——承载用户输入的 `message.committed` 与 `input.accepted` 同事务提交，此时尚无 activation，却被强制要求 activation subject；已把该要求移到知道 actor 的资格检查处。同轮修复：事务摘要原先只覆盖事件身份（被替换的正文仍可匹配 marker），现覆盖完整内容；自由形态 payload 子树原先不校验，现按 §2 编码规则拒绝非有限数字、循环与超深结构，并拒绝原始 JSON 的 `__proto__` 键；SessionKey 三元组现约束为单一路径段。

**R2.S1a 的边界必须一起写清**：它只是格式与校验层——authority、writer lease 换锁、投影与幂等提交不在其中，因此那批绿色测试证明的是 schema 判定正确，不证明任何权威事件被追加过。§2 的 RestoreBundle 与 §2.1 资源仓库落盘规则不在本片内，随恢复与资源切片交付。

**R2.S1b 权威追加路径已交付**：`packages/core/src/managed-runtime/managed-session-authority.ts` 的 `LocalManagedSessionAuthority` 覆盖 R2.S1 验收行的五项——无活 host 即可 open/读/写并冷重开恢复；`submitInput` 在同一事务持久化 `input.accepted` 与 authority 自生成的 `wake.requested`；`(operation, commandId)` 幂等（重放返回原 receipt 且不追加，索引从 marker 重建故跨冷重开仍成立，内容不同报 conflict）；harness 的旧 activation epoch、subject 不匹配、缺 activation 与跨 workspace/跨 session 的命令与事件一律拒绝；事件与 marker 都写进原 transcript 容器，不另开第二份历史。它**通过既有 `SessionWriterLease.appendJsonLine` 追加**（逐行 fsync、逐行复核归属、`runExclusive` 串行），没有新增第二条写路径。事务顺序为「先全部 event、最后 marker」，marker 携带 `previousCommitDigest` 链与覆盖全部事件内容的 `eventsDigest`；恢复扫描读完整已提交前缀，损坏中段、序号断裂、链断裂或内容不符一律失败而非跳过。追加中途失败会闩死该 authority（那些序号已被落盘行占用），后续提交明确拒绝。证据：25 项定向单测（用真实 lease 与真实临时目录，含以真实 lease 追加无 marker 事件来模拟崩溃）、`managed-runtime` 全部 111 项、`chatRecordingService` 与 `session-writer-lease` 无回归、仓库 build/typecheck 与该包 prettier/eslint 通过。

**R2.S1b 独立审查发现两处必修并已修复**：其一，`commit()` 没有事务级串行——lease 只按行串行，两个未交错 `await` 的事务都通过了序号检查，随后各自的行在 lease 队列里交叉排队，实测产生重复序号且该会话**永久不可打开**，走的还不是有既定补救语义的坏尾错误。现已由 authority 自有串行尾包住整个事务，序号在锁内读取。其二，activation fence 原先只做单调 epoch 比较：日志从未提交任何 activation 时，harness 自报任意 epoch 被接受；activation 转为 released/revoked 后仍可继续追加；coordinator 还能自报 epoch。现改为按已提交事实授权——必须存在已提交 activation，`activationId` 与 epoch 精确相等，phase 仍为 installing/active；`activation.changed` 的 epoch 由 authority 判定（新 activation 必须为当前 +1，同一 activation 改 phase 不得改 epoch）。同轮另修四项：恢复扫描不再静默跳过 header 之后的未知 subtype 与中段空行（§4 规则 6）；`eventId` 全局与事务内唯一（原先同一 `inputId` 换 `commandId` 可追加出重复事件，与验收行「重复 ID 唯一」不符）；重放回执改报当前 `committedSequence`（原先返回历史值，调用方据此设 `expectedSequence` 必然冲突）；类文档不再声称本类提供了它当时并未提供的事务边界。

**会话私有资源仓库已交付**：`managed-session-resources.ts` 的 `LocalManagedSessionResourceStore` 按存储规范 §2.1/§4 规则 2 实现发布与读取——受控临时文件、边写边算 hash、fsync、原子改名、再 fsync 所属目录；`resourceId` 由服务端生成且不以内容 digest 命名；读取按可信 SessionKey 解析并核验 byteLength 与 digest，不符即失败而非当作缓存缺失；kind 与 resourceId 都必须是单一路径段。这补上了此前的空档：`submitInput` 的 `contentRef` 原本可以指向根本不存在的字节。回收、已发布孤儿、pin 与 workspace 资源仍未实现，随引用闭包切片交付。证据：9 项定向单测，含「发布 → submitInput → 冷重开 → 从恢复出的事件读回原始 prompt 字节」的端到端往返。合计 `managed-runtime` 128 项通过。

**会话元数据与目录标题投影已交付**（存储规范 §6 列为默认启用前必须结清项，验收 S09）：生产端与消费端一起交付，避免只写 reader 变成无生产者的死开关。`domain.committed` 的可提交 domain 由 `MANAGED_SESSION_ENABLED_DOMAINS` 单独把关——§3.1 的 30 个名称是封闭命名空间，认识名称不等于获准提交，本轮只启用 `session_metadata`，`schedule` 等已注册但未启用者提交即拒。authority 的 `commitDomainRecord` 先把正文发布为资源再提交事件，并自行编排 `operationId/revision/previousRecordRef`，调用方不能自选 revision 或断链；revision 从已提交事件重建，冷重开后继续递增。读取端 `readManagedSessionTitleInfoSync` 先让 legacy 扫描跑（Managed transcript 不会带 `custom_title` 记录，故不会误命中），只有没有 legacy 标题时才探测 Managed，因此现有 legacy 会话列表的开销不变；Managed 会话的 sessionId 取自 header 记录中的 `sessionKey`，不由文件名推断。非 Managed transcript 返回 undefined 以回落 legacy；Managed 但从未重命名返回 `{}`（确实没有自定义标题）；正文不可读时展示层容错返回 `{}` 而不是抛到会话列表。资源根解析器放在 `utils/` 以保持叶子层，由资源仓库反向依赖它，避免两侧路径漂移。证据：7 项定向单测，含「重命名 → 同步目录读取拿到标题」「两次重命名取最新且 previousRecordRef 链接」「冷重开后 revision 续增」「legacy transcript 回落」；`managed-runtime`、`sessionService`、`sessionStorageUtils` 合计 418 项通过，仓库 build/typecheck 与 eslint 通过。仍未覆盖：标题只在 tail/head 窗口内可见（与 legacy 同样的限制），归档/重命名/fork 维护路径尚未按 Managed 适配。

**坏尾恢复已交付**（存储规范 §4 规则 6）：崩溃在事件与 marker 之间会留下从未提交的尾部，原先**完整行**形态的该尾部会让会话永久不可写。新增 `SessionWriterLease.truncateTo(byteLength)` 在同一 `runExclusive` 屏障与逐次归属校验下截断，并重读保留前缀重建被钉住的证明（滚动 hash 不能回退）。authority 侧 `recoverUncommittedTail` 显式发起，先存诊断副本再截断；`open()` 仍报错拒写，修复不会被打开会话或兼容探测隐式触发。**限定**：末行被撕裂（无换行）时 `SessionWriterLease.acquire` 会先以 `SessionTranscriptChangedError` 拒绝，拿不到 lease，因此这类半行尾部仍不可恢复，不在本次修复范围。

**该切片的独立审查发现一处阻塞级数据销毁并已修复**：header 独立成行且其后没有 commit marker，因此会话第一个事务崩溃时 `committedBytes` 仍为 0，`truncateTo(0)` 会清空整个文件——header 承载 sessionKey 与 definition/rootSnapshot 引用，删掉后会话永久无法打开（审查者实测 1591 字节 → 0 字节）。现扫描额外记录 `headerBytes`，恢复保留 `max(committedBytes, headerBytes)`；两者皆为 0 时明确拒绝而不是清空。同轮另修三项：诊断副本改为先写 `.pending`、截断成功后才改名发布，截断失败即清理，避免留下孤儿诊断文件并覆盖上一份；被丢弃字节改为按 `Buffer` 切片而非解码后的字符串（撕裂在多字节字符中间时字节数不符）；`truncateTo` 补齐 append 路径的错误归一化（原始 errno 不再逃出 `SessionWriterError` 体系）与重建 pin 时的 `sameFileSecurityMetadata` 校验。新增用例覆盖「第一个事务未提交 → 恢复后 header 仍在、会话可重开、序号从 1 继续」与「无前缀可保留时拒绝」。

**Managed 会话的引擎归属已记录**：此前 authority 只写自己的 header，不写容器原有的 `session_execution_engine` 记录，而引擎读取器在没有该记录时返回 `engine: 'legacy'` 且 `status: 'verified'`——即把 Managed 会话**误判为已验证的 legacy**，于是 `forkSession` 会照常复制（产出 header sessionKey 与文件不符、永远打不开的副本），`renameSession` 会往 Managed 日志里追加 `custom_title` 记录，形成与 authority 并存的第二个标题权威。现在创建时先按容器原有形状写 `session_execution_engine`（engine=`managed`）再写 header，因此**凡是真正调用 `assertSessionExecutionEngine` 的守卫**——`forkSession` 与 config/CLI 各处——都会正确拒绝，不必逐个入口打补丁；`renameSession` 从不调用该守卫，需单独修复，见下一段。引擎记录与 header 之间崩溃时下次 create 会补齐 header 而不是卡死。同时把三个 subtype 注册进 `transcript-records.ts` 的 `KNOWN_RECORD_SUBTYPES`——此前只加进了 TypeScript union，运行时集合缺失使每条 Managed 记录都被判 `unknown_record_or_part` 且影响完整性，导致整个 transcript 被视为不完整、引擎状态变成 `unavailable`。证据：`managed-runtime` 143 项，连同 `session-writer-lease`、`chatRecordingService`、`sessionService`、`session-transcript-reader`、`transcript-records` 合计 738 项通过，仓库 build/typecheck 与 eslint 通过。

**重命名对 Managed 会话的拒绝已补上**：上一轮记录引擎归属后我曾声称「fork、rename 与 config/CLI 的既有守卫都会正确拒绝」，复核后发现**这对 rename 不成立**——`renameSessionInternal` 从来不检查引擎，它直接追加 `custom_title` 记录，因此仍会在 Managed 日志里立起与 authority 并存的第二个标题权威，并在 writer 之外改动 transcript。现已在项目归属校验之后拒绝。判定方式改用**正向识别 header**（`isManagedSessionTranscriptSync`）而不是 `assertSessionExecutionEngine`：后者要求 `status === 'verified'`，而任何带完整性诊断的 transcript 都会变成 `unavailable`，实测会让三个既有 legacy 重命名用例失败——即把今天能正常重命名的 legacy 会话也一并拒掉，属于不可接受的回归。证据：新增「Managed 会话重命名被拒且 transcript 字节不变、不含 `custom_title`」与「legacy 会话仍能重命名并写入 `custom_title`」两个用例（用真实 `SessionService` 与真实临时项目目录）；`managed-runtime` 与 `sessionService`（含 rename/corruption）、`session-writer-lease`、`sessionStorageUtils` 合计 616 项通过，仓库 build/typecheck 与 eslint 通过。

**删除会话现在会清理其私有资源**：Managed 会话把事件正文（prompt 内容、domain 记录）存在自己的资源目录下，而删除此前只删 transcript，会留下孤儿资源目录。现按该文件既有的 sidecar 清理惯例，在 `cleanupRemovedSessionFiles` 中与 worktree/PR/prompt ledger/文件历史备份并列清理，并同样受 `assertCleanupOwned` 围栏保护（该围栏调用次数因此由 6 变 7，是新增一步清理的正确结果）。workspace 拥有的资源在另一个根下，明确不动。顺带把资源根的「单一路径段」校验从 `path.basename` 改为正则：`sessionService.test.ts` 会自动 mock `node:path`，依赖 `basename` 会让整个 `removeSession` 套件失败——这已是第二次踩到，改用正则后守卫不再依赖可被 stub 的函数，安全性不变。§2.1 要求的 `deleting` 状态机、tombstone、排空与跨 Session 引用/pin 保留仍未实现，本次只是止住泄漏，不冒充完整生命周期。证据：新增「删除 Managed 会话后 transcript 与资源目录都不存在」用例；`managed-runtime`、`packages/core/src/services` 全量与 `sessionStorageUtils` 合计 2908 项通过、21 项跳过，仓库 build/typecheck 与 eslint 通过。

**静止期防写屏障已交付，并修正了对 schema 3 的定位**：实测（一次性探针）发现三件事——`release()` 会把锁整个删掉，Managed 会话静止时**锁目录为空**；因此任何 writer 都能 acquire 并往权威日志里追加 legacy 记录；追加之后 authority 再也打不开该日志（`unknown subtype ... after the Managed header`），会话被永久废掉，且这条外来记录不计入未提交尾部，坏尾恢复也救不了。**结论：仅把锁版本升到 schema 3 在静止期没有任何作用，因为静止期根本没有锁。**规范 §1 真正承载屏障的是「Managed 关闭保留经过核验的 sealed 锁」，schema 版本只是在此之上再挡掉懂得认证接管的旧二进制。据此本轮先交付 sealing：`LocalManagedSessionAuthority.close()` 用 `sealForHandoff()` 取代 `release()`，`acquireWriter()` 统一以 `takeoverPolicy: 'certified'` 取回自己的封存锁——封存锁遇到默认策略的 acquire 会直接 `SessionWriterConflictError`，认证接管则会拿 sealed proof 与实际文件核对。证据：3 项定向单测——封存后普通 acquire 被拒且 transcript 行数不变；Managed writer 能接管自己的封存锁并从序号 3 续写、再封存、再冷接管读到 4；封存后被外部追加则接管被拒。顺带修正 authority 测试夹具：封存会记录相对 runtimeBaseDir 的 transcript 路径，原夹具把 transcript 放在 runtimeBaseDir 之外（append 能过、seal 不能过），现改为经 `Storage` 派生的真实布局。`managed-runtime` 44/141 项与 `session-writer-lease`、`sessionService` 合计 478 项通过、3 项跳过，仓库 build/typecheck 与 eslint 通过。

**尚未包含**：lock schema 3 本身（现在定位为在 sealing 之上的增量加固，用于挡住会认证接管的旧二进制，不再是屏障的主体）；归档/取消归档尚未按 Managed 校验；§2.1 的删除状态机与跨 Session 引用/pin 保留。fork 与 rename 已分别由既有引擎守卫和 header 判定拒绝。四处普通 factory 未接线，因此 R1 在默认路径上仍等于 no-op。下一步在 R2.S1b 基础上按 R2.S2 接入完整 Harness，再执行原 R2.1～R2.4；每步保留可审查的变更和证据。

| 新增步骤                | 本步产物                                                                             | 验收边界                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| R2.S1 Session 权威接口  | 全部读写消费者、首批事件/命令、单一日志格式、幂等提交、writer/fence 和旧格式适配     | 无活 host 可读写；输入与唤醒意图持久；重复 ID 唯一；旧 epoch/跨 workspace 拒绝，不双写权威历史                     |
| R2.S2 完整 Harness 接入 | 复用完整 Agent，Session client、checkpoint、正式事件与 UI 投影，物理 writer 安全交接 | 替换 host 后历史/owner/配置与下一轮保留；首轮失败可继续；原 Agent 行为保持，不升级实验精简 Runner 作为默认模型循环 |
| R2.S3 持久等待与恢复    | 工具/审批等待、原 invocation 回执、派发资格屏障、detach 与 close 分离                | 换 host 不取消原调用；完成 ACK 丢失不重执行；旧代新派发无副作用；Runtime 丢失不丢 Session，未决副作用明确阻塞      |

逐方法兼容清单只覆盖外围声明：见[接口与实现串联](managed-agent-session-compatibility.md)及[方法映射附录](managed-agent-session-method-map.md)，其中 268 项是 11 个外围声明（Session 读写、录制、桥接、目录、Runtime provider 等）的声明级归属，**不含真正承载执行的 `packages/cli/src/acp-integration/session/Session.ts`**——该类只有 Harness 专项的代表性接缝表。R2.S2 接入完整 Harness 前必须按附录同一规则枚举该类公开成员并逐项定归属，未完成该枚举不得声称清单已补齐。R2.S1 先建立现有实现与本地接口的一致性基准，再接入可等待的持久提交；每个增强点必须同时迁移实际生产者和消费者，保留 sendPrompt/onPromptAdmitted、审批 boolean 与 best-effort 记录的旧契约。

施工按三份专项细化：[Harness](managed-agent-harness.md)定义完整循环与九组 checkpoint；[私有协议](managed-agent-control-protocol.md)定义消息、文件同步 ACK、activation 安装、原调用结算和引用保留；[coordinator](managed-agent-coordinator.md)定义单一 authority 调度与四处装配。R2.S1 将 activation 事实并入 authority，以窄适配复用 scheduler，保留实验 store；输入与唤醒一起提交。R2.S2 先实现 A/D 安全点、基础 activation 门禁及完整 Agent 读写，排空旧 handle 后再替换；禁止绕过实际 ACP Session→LlmChat/runTool 的接缝。R2.S3 再实现 B/C 工具和审批等待，在同一 installing/stage/enable/revoke 协议上支持在途交接、原 Runtime 接管与可恢复 detach；handler 返回不得再等同 turn 完成。

[存储格式与限额](managed-agent-session-storage.md)本轮已补齐 schema 3 锁与就地升级顺序、资源仓库与 `DurableRef` 的落盘形态、事件 union 的封闭集与扩展规则、写入/fsync 预算及新增验收；但平台文件同步与崩溃证据仍须在编码阶段取得，取得前不按“已定稿”引用它来关闭存储风险。编码按此实现 schema/validator、实际接线并取得平台文件同步/崩溃证据。恢复首版限定 coordinator 和原 worker 存活时替换 Harness；worker/daemon 丢失且未决时保持 blocked，跨 worker 重启回执后端按[恢复与运行专项](managed-agent-recovery-operations.md)单列后续实施。未取得恢复证明时保留现有 `recovery_ambiguous` 保护。

2026-09-11 契约修订：存储 §3.1 统一 30 个全量 domain 的原名称，按实际 capability 启用子集；schema 3 通过旧 writer 已识别的 claim 屏障认证换锁，禁止先 release 变无锁；资源按 Session/workspace 实际 owner 保留，删除来源会话不删除配置或用户 pin；非工具确认由受控 requestAction 受理；RestoreBundle 区分 checkpoint 续跑与有完整证明的合法初始化。对应 S07～S12/H08 与各领域验收要求一起落实，文档静态一致性不等于运行时证明。R2.S1 先完成适用的 schema/资格/归属基础，R2.S2 验证初始 checkpoint 与完整 Harness，历史、自动化和扩展的正向用例仍随各自后续切片交付，不把全量注册表当提前接线。

| 步骤                       | 本步产物                                                                                                      | 验收边界                                                                                                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R2.1 空扩展只读输入        | Store 严格 empty proof → CLI Managed loader → Config/同一个 Manager；初始化、状态刷新和管理 mutation 共用保护 | 接受真实常规初始化空 store；不改字节/元数据；坏 state/事务/链接/安装候选不放行；绑定后不能加载新扩展，legacy 正常管理保留                                          |
| R2.2 全来源与用途策略      | 真实 MCP/Hooks/argv/env/trust/来源、runtime/client 动态输入进入共同检查；新建/冷恢复/热 attach 规则明确       | settings/项目/top-tier/extension/动态依赖及 safe/bare/allow/exclude 按实际消费判定；已有 Managed 不兼容准确失败；Live/cron/standalone/Goal 不按 default 字符串放行 |
| R2.3 四处 coordinator 接线 | 同一服务内部组合、延迟 registry/provider、共享进程所有权、host-before-worker 清理、新环境与 generation 绑定   | 普通入口无需实验 flag；worker/注入者不递归；并发预算不翻倍；shutdown/remove/reload/撤信任/失败不泄漏或串工作区                                                     |
| R2.4 普通接线复验          | 明确允许组合、对应代码版本、实际入口及未覆盖列表                                                              | Web Shell/SDK/REST/ACP 至少正向实际 Managed 与真实 Runtime 工具/final；旧会话与未知依赖走 legacy，失败无隐式重跑                                                   |

最新空 store 基线已证明原 refresh 会写入，且普通基础 lock 与真实 lock.lock 不同；新只读 API 和 fixed 组仍待实现。详见执行引擎设计新增章节。本轮只核对源码与既有报告，未重跑历史产品测试；macOS 的已记录局部证据不能替代 Linux/Windows 验收。Windows 原生命令进程组路径目前明确 unsupported，有限范围默认必须限定已支持且已验收的平台/工具组合。

## 后续阶段与完整完成条件

R4 仅是兼容范围的有限默认，不结束总目标。R5 继续手动/自动定时、内部自动执行、媒体/产物、Skills/本地初始化、MCP/Hooks/Channels、后台 Shell/PTY/子任务/记忆、物理历史与全部客户端/平台组合。各项调用者、协议、状态转换和迁移/失败策略已经补齐；实施时落实相应 validator、适配与可执行验收计划，完成后更新总表状态和允许范围。

最终逐项核对 C01～C18 的要求、证据、平台与入口。历史兼容可按固定 legacy owner 保留，但不能把大量未迁移新用途一直走 legacy 视为完整默认替换。旧数据不变、无跨引擎重跑、当前预览保留、代码和方案推送一致都是交付条件。与部署载体相关的 P9b/Kubernetes 继续独立规划，不阻挡本地默认替换。

## R5 全量能力切片

下表各片已有详细设计，当前均未整体验收；F 编号只拆解 R5，不改变 R1～R4 的顺序。能力通过才扩大普通默认范围，绝不因调试入口通过或方案已写就全量放开。

| 切片 | 设计和工作范围                                                                                                 | 依赖与退出证据                                                                             |
| ---- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| F1   | [配置与扩展](managed-agent-config-extensions.md)：RootSnapshot、初始化、上下文/Skills、动态 revision | R2 来源证明与 authority；E01～E03，全部真实消费者取同一视图，配置漂移不重放原调用          |
| F2   | [工具与历史](managed-agent-tools-history.md)：全工具、混合模型阶段、媒体/产物/资源                   | F1 视图和 Runtime gate；T01～T04，47项注册归位及真实完整结果/取消/GC                       |
| F3   | [自动任务](managed-agent-automation.md)：定时/Goal/Live、child/background/记忆                       | 持久 input/domain/outbox、原 owner；A03～A07，派发不重复、父接受不丢失、未知回执不回父重跑 |
| F4   | [MCP](managed-agent-config-extensions.md)：transport、tool/resource/prompt、鉴权和动态版本           | F1、共享池与原物理 phase；E04/E05，完整内容、授权/取消和连接 owner                         |
| F5   | [Hooks](managed-agent-config-extensions.md)：来源 fallback、执行矩阵、once/async、热更新             | F1、模型/Runtime 分段及回执；E06/E07，原事件顺序与结果合并保持，未知效果不补跑             |
| F6   | [Channels](managed-agent-automation.md)：来源路由、附件、delivery outbox                             | F3 领域收件和客户端正式终态；A01/A02，接收/发送各自去重，不把 HTTP ACK 当外部交付          |
| F7   | [历史与转换](managed-agent-tools-history.md)：物理 rewind、fork、双向转换、目录维护                  | F2 内容/备份、OperationGrant/barrier；T05～T07，源不变、目标闭包、部分失败可恢复           |
| F8   | [恢复与运行](managed-agent-recovery-operations.md)：worker/daemon、远端、平台和性能                  | 持久 phase、原 owner 与 storage profile；O01～O07，三种故障分层及各平台独立实证            |

F8 的基础物理账本可以先于其他片实施以提供公共恢复接缝；F1/F2/F3 内按具体依赖拆 PR，不要求一片包含全域重构。全部 C 项和普通客户端 U01～U07、存储 S01～S06 与旧268项兼容检查共同构成全量完成条件。
