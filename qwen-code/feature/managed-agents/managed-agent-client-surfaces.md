# Managed 普通客户端、交互与事件投影

## W43 当前客户端增量，2026-10-23

[#15094](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15094.md) 恢复阻塞时保留取消、禁新输入；[#15131](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15131.md) 查询 recovering/awaiting_evidence/cleanup_pending/ready/operator_required，可见时 5 秒观察精确原 Turn，切换 abort，recheck 不允许换 prompt 或重放未知工具。不可恢复时只生成有界、可审阅文字 handoff，不自动执行或迁移 checkpoint。[#15170](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15170.md) 统一运行反馈，完成后停止 spinner，不改变执行权威。

[#15100](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15100.md) 生命周期操作发送前存原意图，未知响应沿原键/operationId；close_archive 先确认 close，再走独立 archive，202 不算完成。archive filter 在 SQL keyset 固定；阅读导出固定 lastSequence/watermark，拒绝跨 scope/重复分页，32 MiB 上限及安全 HTML/图片策略保留。它不是备份或工具全文导出。[#15104](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15104.md) 手动压缩保存原 expectedCompactionRevision/key，未知结果不换键；完成后需 summary revision 追齐才解除 pending，noop/失败明确反馈。

[#15119](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15119.md) 在 #14916 只读目录之上增加独立管理页，空闲 OPERATOR 可 add/edit/remove/enable/disable/reload/restart 管理员已发布 pin，不输入 command/env/secrets；原命令按 provider/client/Workspace/Session 保存并验证 action/server/revision，恢复只继续原操作。[#15171](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15171.md) 新合资格 root 可一层委派，任务详情/父级审批携带实际 childSessionId、stopRequested、approvalMode，activeChildCount 来自 SQL；子视图只读，委派执行仍可经原授权工具修改共享文件，但不能独立发 Turn 或改模型/审批/Plan/cwd，stopRequested 不代表已停。

main `c61044fae46c` 已合入 [#14602](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14602.md)：原切片目录来自可读 Session 的 pinned definition（当前优先创建快照，见后续增量），菜单懒加载；前导有效 /skill 通过原工具 Turn 在首次模型请求前加载，恢复不重复，静态加载允许 Plan。[#14604](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14604.md) 的 Read/Shell 详情展开后才请求，按原 item/Turn/call 追溯持久 journal/resource，读取前后授权，8 MiB/512 页硬预算；loader/call/status/revision 隔离迟到响应，返回有界预览与结构化 Shell outcome，不伪造全文。

[#14628](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14628.md) 将含附件的完整规范化编码输入提升到 8 MiB（不是单文件原始大小），大 pending 先保存 IndexedDB，sessionStorage 留原 key 的引用，保存失败不换键发送。[#14704](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14704.md) 同步 Java/Hosted/WebShell 接受 GIF87a/GIF89a 并把 image/jpg 规范为 image/jpeg；canonical base64/签名、模型 image 能力和原输入摘要保留，不增加 URL/任意宿主文件访问。

[#14639](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14639.md) 从授权 LOCAL/SSH_LOCAL Workspace/cwd 选择最多 24 KiB 的非空 UTF-8 文本快照，scope revision 和 SHA-256 随草稿保存；发送前复核，读未完成禁止提交，切换 scope 拒绝旧引用，不按路径静默重读。查询有 4096 扫描项/50 返回项/32 深度/约 2 秒预算，拒绝 symlink/保留目录，不支持 CSI/二进制浏览。

[#14916](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14916.md) 新增 actor 保护的 session-mcp/query，复用持久 Session catalog；菜单列三类能力计数和 complete/partial/failed/stale，不重连/刷新或执行 MCP。provider/client/Session scope 与 abort 防迟到结果污染，已释放连接不冒充 live；partial tool 描述携带 JSON 转义原 server/tool 身份，执行名字/schema 不变。

[#14920](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14920.md) 仅在 approval-selection/1 + live-approval-selection/1 下允许公开 bound files/1、shell/1、shell/2 在运行/等待中切 default/auto-edit/yolo，保留 OWNER/OPERATOR、expected revision、原键与回执；关闭/取消/恢复阻塞拒绝。Plan 与模型仍要求空闲。Hosted 后续工具/Hook 检查读单调 revision，缺失/回退拒绝；普通策略等待在当前不需询问时经原 Action allow，明确 Hook ask/exit_plan_mode 不自动通过。已执行工具不撤回，原 Turn/Hook 审计字节不重写。[#14763](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14763.md) 让停放取消只从原 prompt 终态恢复已取消/未取消，停止请求或未知证据不显示成功。

#14487/#14523 现已 merged，当前私有文件及冷恢复以 [#14695](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14695.md) 为准；下方旧 open head 和 48 KiB 限制仅是 W42 历史观察，不是当前行为。本次仅独立核对 diff、changed files、关键调用与主干，未运行源码、浏览器、真实 MySQL/OSS/CSI/SSH/模型或部署验收。

[#14930](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14930.md) 扩展 #14602：新建时从显式选择的可信 daemon/Workspace 取启用 Skills 正文，正式提交重新快照，原 pending key/body 固定相同来源字节；存入 SESSION_CREATE_ACTOR receipt，并用 session-skills/2 的原 sessionSkillsRef 沿 create/load/恢复。现有会话不随宿主配置变化，无快照才读原定义。model_invocable/user_invocable 分别约束模型与用户；不复制脚本/assets/宿主路径，原 Hook/Skill 独立批次和模型结果预算保留。

[#14970](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14970.md) 默认关闭、原切片仅 OPEN/loopback/trusted actor 的单用户 LOCAL 导入（当前 #14928 也允许 signed loopback）；绝对路径 canonical 校验及原 native identity 两次复核，仓库外根登记/原授权根复用，不复制项目。[#14987](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14987.md) 改名 adapter 复用既有 creator/OPERATOR、receipt/revision/fenced title delivery，ACTIVE + title 能力才广告 canRename；UI 256 上限/IME/busy，未知结果重试同标题原键，切 provider/Session 隔离迟到响应。

[#15061](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15061.md) 最终只是 WebShell：同 sidebar 展示 daemon 与 Managed 分组，按 provider.storageKey/Workspace 分页/搜索/展开；显式目标必须 get 并验证原 ID/canCreateSession，失败不静默默认。dirty cwd/pending/编码/未知创建阻止误切；已有会话只开创建对话框，关闭后的迟到成功不强制导航。执行选择不统一后端权限或主机路径。[#14928](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-14928.md) 现已合入同一普通 daemon 前门/boot/延迟 ACP、安全模型目录与 signed loopback 导入，部署仍需精确资产/Java21/私有状态。[#15040](../../weekly-report/2026-10-19_2026-10-25/implementations/pr-15040.md) 仅保留关闭历史，不将 UI 或最终启动器交付记到该 closed PR。

> **2026-10-19 W42 归档快照（主干 `79362c2ecc21`）：** 既有客户端能力保持；#14484 已保存定义审批、#14526 单次自动化取消、#14531 Plan/内联附件现已合入。#14290 搜索、#14487 私有 CSI 文件、#14523 回执完整恢复及 #14599 创建预热仍 open。以下历史设计不表示全部交付；本次未运行组件/浏览器或真实宿主门禁。

### 已合入的子 Agent 任务面板

`ManagedSessionsPage.tsx` 按容器 1100px 阈值选择 360px 侧栏或 Dialog，关闭后归还焦点。`use-managed-tasks.ts` 对原 task API 每页 50 条做查询，面板打开且页面可见时每 3 秒轮询；混合页只过滤 child_agent，不扫描其它页或声称有 child 总数。task/Session 身份、owner/generation/AbortController 隔离旧请求，终态不回退，events 按 cursor 去重；游标过期显示历史缺口。artifactRefs 通过既有授权 reader 读取，不新增公共最终结果。

`use-managed-task-cancel.ts` 先保存按 provider/Session 分区的原 task/idempotencyKey 再 POST，存储失败不发送。显式 productScope 与当前 capability 限定新取消；operation completed 只表示原停止请求被接受，仍查询 task 真终态，自然完成不改成 cancelled。30 秒确认预算后保留 stopping/unconfirmed，重放拒绝不证明未受理；刷新优先查询原 operationId，未知 ID 的意图只能恢复原键。capability 撤销后仍有保存意图的恢复入口，不额外锁住聊天输入。

### 标准 UI 的最终实现

#13973 最终合入 `72316e6608d7`，复用 WelcomeHeader/MessageList/ChatEditor 和 frame/theme；model presets 是宿主发布的 AgentDefinition ID，仅新建时选择，不热改现有 Session。初始 input_text 与原 Workspace/cwd/key 一次创建并核验 admission，未确认重试原 payload/key；拿到 sessionId 后读回失败仅重读。受理确认才 commit，按原 provider/Session 和原 draftText 精确清草稿，跨 Session 重试和较新不同草稿不丢失；empty-only provider 保持兼容。Managed 明确禁用 Shell mode、附件、slash commands 和 daemon Workspace 特性，!/? 保留字面语义。标准视觉组件不能扩大执行权限，现有 cwd/进度/审批/取消屏障仍保留。

放弃未知创建恢复原 initial input、清本地 pending/commit callback，并由 `WorkspaceBindingCreator:onAbandoned` 刷新 Session 列表，允许重新发现服务器已创建但响应丢失的 Session。仅 pending 且不 busy 显示恢复行；含初始输入与空创建分别提示风险，不能凭放弃断言原输入未执行。

上述 #13973 禁用附件、#14323 最初不覆盖固定定义是各自合入范围；当前 main 已由 #14484/#14531 分别扩展，不能作为当前一律拒绝附件/定义改策的结论。

### 私有 CSI 文本的最终实现

已合入 [#14081](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14081.md)，最终 head `d4ee6e1dbdba`，继承已合入 #13996/#14069，不复制 schema 或沿用旧 stacked 测试资格。Hosted-only `QWEN_HOSTED_CSI_SESSION_STORE_URL` 使认证 primary listener 提供 private attach/text/history；固定原 canonical Session UUID、writer/binding generation 1、activation epoch 1，text/history 前 fresh acquire 核验原准入。只生产纯文本与已结算 history，不安装 file toolTurn 或生命周期，也不是标准 UI/public CSI selector。

`hosted-csi-session.ts` 续租失效阻塞 owner 并 abort 原 prompt；`http-managed-session-store.ts:stopLocal` 停本地续租/写入而不 seal authority，shutdown 不 release Runtime。普通 route 拒绝私有 owner 的大小写变体，原 prompt/相同文本只在本进程复用原结果，不承诺跨 boot exactly-once。真实模型、SQL/CSI 正向链路与部署仍须独立验收。

### 首页与工具集合的实施增量

[#14290](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14290.md) 当前 /3 profile 新增受限 glob/grep_search/list_directory，开关默认关闭且只影响内置新会话。名称准入、只读原生审批、恢复和生命周期显式扩展，不能授权同名 MCP；worker 在五秒、目录 ownership、48 KiB 编码预算内运行，持久结果后才继续模型。/1、/2 与既有 Session 不被部署开关重写。

已合入 [#14306](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14306.md)，在 Hosted fresh model request 之前由实际声明名称设 prompt snapshot，空集表示无工具；agent 只有实际声明才可达。名称集合或 Workspace context 变化合并一次 refresh，schema/描述继续更新 tools；preparedRecovery 沿原请求不重绘。不是过滤用户/AgentDefinition/Workspace 自带文本中的全部工具名称。

已合入 [#14316](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14316.md)，托管导航以 portal 放进原 sidebar，App 持久化本地/托管 URL，隐藏状态保留但不捕获键盘，Java ID 不进入 daemon；草稿和原未确认请求不跨后端。服务端 options 驱动初始审批；只有已配置模型目录和空闲/expected revision 允许换模型。原意图发出前持久化、响应后读回确认，Turn/model-admission 固定模型快照；最近成功 usage 才显示上下文，缺失保持未知。工作区创建使用受控根目录与原 actor receipt，不接受浏览器宿主路径。V4/V5 已进入 main，SSH V7 也已合入，非旧 V4 冲突；不能当成纯前端改动或生产已验收。

后续已合入 [#14323](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14323.md)：内置 public bound qwen-code Session 可显式 Shell yolo，原 owner 且当前 OPERATOR 在空闲状态按 expected revision 改下一 Turn 策略；固定定义不 override。V6 保存当前 override/原 Turn 快照，SDK/Harness 的 approval-selection/1 仅非零 revision 发送在线字段；恢复不读会话当前策略。UI 原键/意图先落盘，读回 revision 才解锁，旧摘要不回退。部署默认仍非 Full Access，Hook deny/ask 保留；本次未复验进程/浏览器，原 whole-Java warm 超时报告不算通过。

已合入 [#14319](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14319.md) 将静态 Skill 正文/ref 和管理员 MCP/独立 Hook pin 固定在定义及 Session；不发现宿主 Skill、执行其脚本或读取最新定义。Skill 独立批次，混合工具先拒绝；恢复沿原 Hook deny/effective input，无 marker 记未执行拒绝，已有 marker 无结算则 blocked，不重跑。缺失/损坏 ref 拒绝；历史无 pin MCP Session 须独立审计，不能假设不存在。

已合入 [#14357](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14357.md) 的 Linux/MySQL HostedExtensionsIT，用真实 stdio MCP/command Hook 和受控模型核验 pin、Harness 替换、取消/close 及一次效果 UNKNOWN 不重放；本次未运行。它不增加生产能力、不支持 SSH MCP/Hook，也不证明真实模型/凭证或跨机器验收。

已合入 [#14318](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14318.md)，最终 head `1a32fe4dbc47` 的 SSH 登记 UI 只展示授权静态节点，检查目录不授予登记权限；独立 workspaces/register 沿原 operation/幂等键读回后选工作区，本地 workspaces/create 不复用。默认关闭，仅 files/1 和 foreground shell/1，拒绝后台/Monitor/MCP/Hook/child Workspace。已合入 [#14307](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14307.md) 的 Artifact 单 Range 在旧 ASCII/错误门禁后复用 HttpRange，不扩权限。以上源码、浏览器、物理重启及远端完整链路本次均未执行。

### 目录、进度与审批后续，2026-10-18

已合入 [#14405](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14405.md)：只对 OWNER 的 ACTIVE ROOT、原已验证 LOCAL storage 枚举真实直接子目录，扫描最多 1024 项/返回 100 项，排除 symlink/保留目录；授权 route 可返回执行宿主根路径。原 actor receipt 固定源 generation/storage/cwd，pending 与最终提交再验；只建共享原 storage 的逻辑别名，默认 cwd 从 completed receipt 恢复，不提供子目录隔离。WebShell 保留原键/目录/草稿和选择，放弃不证明服务端未创建。后续 [#14442](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14442.md) 扩到 macOS native identity，但不开放 SSH/CSI 目录浏览或任意客户端路径。

#14405 的 hosted-tool-progress.ts 从原 intent/receipt/已提交结果按 batch/ordinal 映射原 call，投影状态不泄露参数或输出；重放保留 startTime，完成时对齐 assistant 时间。轮数读配置而非固定 16，正上限才触发 hosted_turn_limit_exceeded。已合入 [#14436](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14436.md) 把 raw/content 都不存在与真实空字符串分开，活动状态继续等待；提示不增加结果或停止证明。

已合入 [#14484](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14484.md)，最终 head `078e540799b2` 扩已有已保存定义会话的下一用户 Turn 审批覆盖：精确 files/1、shell/1,/2，owner+当前 OPERATOR、原空闲/CAS/回执和 V6 快照。固定定义/创建初始策略不改，正 revision 执行同时要求 approval-selection/1 与 agent-definition-approval-selection/1；缺能力拒绝，不回退初始策略。读回/已授权回执与取消清理保留，旧 Java writer 必须隔离升级，不能因本 PR 无 schema 变化认为兼容。本次未执行源码/浏览器/数据库验收。

### Plan、附件与单 run 取消，2026-10-19

已合入 [#14531](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14531.md)：Plan 是独立布尔值，保留 default/auto-edit/yolo 和原 Turn 快照。仅合资格无 Hook 的根 public files/1、shell/1,/2；规划只读 read_file/glob，exit_plan_mode 必须单独批次且有非空有界 Markdown，yolo 也须原 owner+当前 OPERATOR 批准。原 Action/continuation 核验后，同 Turn 沿原执行权限继续；Java 按匹配 revision 关闭 Session Plan 并递增 revision，不改写在途快照。无批准或拒绝不解除只读，MCP/CSI/child 不由此开放。

#14531 的 input-attachments/1 支持 UTF-8 文本及签名匹配的 canonical base64 PNG/JPEG/WebP，含附件的完整规范化 input 编码限 48 KiB/最多 100 blocks。Java/Hosted 双端验证，拒绝 URL/宿主路径和 PDF/Office/音视频，不写 Workspace 文件。原 input resource、请求 digest、Item 与 pending 键保留附件；重载恢复原字节且不覆盖较新草稿，图片模型无 image 能力明确失败。plan-mode/1 与附件能力分别协商；本次未运行组件、浏览器或真实模型。

已合入 [#14526](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14526.md)：automation_run 进入既有任务取消接口，schedule/occurrence/run ID 精确对应，稳定 cancel_run 只取消原 wake Turn；intent 直接结算、排队在模型执行前保存 cancelled，运行中仅匹配原 active prompt 才 abort。不退休 schedule、不取消其它 run，取消 ACK 不证明完成；此类 operation 必须观察原 run cancelled 终态，区别于其它任务仅接受停止请求的结果。

### 私有 CSI 文件入口的 open 观察

W42 历史 open 观察（当前已合入；最终边界见本文 W43 增量）：open [#14487](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14487.md) `76902629d1d9` 才接原 read_file/write_file/edit：首代 writer/activation、完整原批次/修改备份准备/receipt/history 和最终输出原子提交；prepare 丢响应后独立回读一次、限 5 秒，保留原错误，结果先经封闭 schema 校验，拒绝外部 function 身份再发布 receipt。不提供公共选择器或冷恢复。open [#14523](../../weekly-report/2026-10-12_2026-10-18/implementations/pr-14523.md) 是 stacked 的回执完整冷恢复，严格限定原单输入/单批次、全部 settled receipt 与双 lease 到期；只补原消息/checkpoint，不重跑工具。它仍基于 `57c3a24470e7`，不能自动继承 #14487 的最新 head。本次未执行源码/MySQL/CSI 验收，主干仍只有 #14081 的私有纯文本范围。

> **HTML 对齐（2026-09-18）：** 托管前端继续访问 Java 产品 REST/SSE；Java 内部复用 qwen serve Session/Prompt/Load/Resume/SSE，普通 /session + executionEngines 保留。HTML 未冻结 JavaAgentProvider 类名，也不要求 Java 暴露全部 daemon 管理路由；公共 API 和投影在 D 实现。以[HTML 双链路基准](managed-agent-dual-path-architecture.html)与[Markdown 方案](managed-agent-java-hosted-runtime.md)为准。

> **首版运行范围（2026-09-19）：** [运行契约](managed-agent-first-runtime.md#7-审批与用户问答)要求已开放能力的审批/问答经过 Java 回到原持久仲裁；复用既有产品入口、SSE 和历史查询。独立公共 Item/eventSequence 投影属于 D，不阻塞首版 Hosted 运行；首版 accepted 必须等待 qwen 持久受理。

> **统一 Session 身份（2026-09-20，HTML v1.7）：** Java 在创建前分配的 RFC UUID `sessionId` 同时用于公共 Agent API、qwen Session Authority、Managed Harness、JSONL 和 Runtime Broker scope，不再维护公共 Session 到 Harness Session 的映射。ACP client/attachment、Harness boot/instance、Runtime Session 与执行 ID 仍保持内部化。

> **v1.6 接口冻结：** 公共 REST 与 WebShell adapter 的路由、DTO、错误、幂等、分页和 SSE 语义以 [API 契约](managed-agent-api-contract.md)及 [OpenAPI](managed-agent-public-api.openapi.yaml)为单一来源。当前 Java/TypeScript 尚未由该 Schema 生成，属于实现与契约测试缺口。

更新日期：2026-09-11；基于源码 `a836081466` 和三层设计 `4cacfbd0ed`。本稿细化 C05/C14/C15/C18 的 Web Shell、REST、ACP、SDK 和管理路径；是待实现设计，现有公开接口仍按[兼容映射](managed-agent-session-method-map.md)逐项保留，独立 Managed 实验页不替代普通入口。

## 0. HTML 当前客户端链路

```text
托管前端 -> Java 产品 REST/SSE -> qwen serve Session/Prompt/Load/Resume/SSE
                                      -> 固定 Legacy / Managed owner
本地前端 -> qwen serve 原有会话接口
```

浏览器只访问 Java 的必要产品路由，不直连 Harness/Broker/Runtime；内部保留普通 `/session + executionEngines`。HTML 未指定 JavaAgentProvider，也未要求 Java 模拟全部 daemon 管理接口。阶段 D 提供 Agent、Session、Event、Turn、Item 的稳定公共资源；公共 Session UUID 直接传给 qwen/Harness，ACP attachment、Harness boot/instance、Runtime Session 和 execution ID 不作为公共 ID。

| 层次 | 提交 / 查询 | 事件与恢复 |
| --- | --- | --- |
| 当前产品入口 | `/sessions`、`/sessions/{id}/prompt`、`/cancel` | `/sessions/{id}/events`，Java 产品 SSE |
| Java→qwen serve | `/session`、`/session/{id}/prompt`、`/cancel`、`/resume` | `/events` 与 daemon Load/Resume/SSE 契约 |
| 阶段 D 公共 Agent API | `/v1/agents`、`/v1/agents/sessions`、Session events/turns/items/artifacts | 单调 eventSequence、Last-Event-ID；公共 Item/Turn 从权威记录投影；字段以 OpenAPI 为准 |

所有可重试写请求使用调用前确定的稳定幂等键；首版等待 qwen 输入及 WakeIntent 持久提交后返回 accepted，Java 不提前 ACK 并另建异步交付队列。断线不取消后台 Turn。Cancel 是持久输入事件，不能把 HTTP 关闭或接受回执当作物理完成。私有 eventEpoch/sequence、旧实验 cursor 与公共 eventSequence 必须显式映射，不互相替代。

旧 `/managed/sessions*` 实验页面和事件存储不升级为公共 API。只有 Java 覆盖 admission、事件、查询与幂等后才退役过渡控制面；不提前删除尚有消费者的实验入口。

验收覆盖同 daemon 双引擎、冷恢复 sticky owner、Managed 失败不转 Legacy、公共 SSE 重连无重复、取消可追踪及内部地址/凭据不泄漏。原 JavaAgentProvider/managedLastSequence 路线保存在[历史产品方案](managed-agent-java-hosted-runtime-history.md)，不是 HTML 冻结契约。

以下各节为普通 daemon 兼容与完整客户端行为的专项约束；其阶段范围按 A～H 映射，不把完整能力清单都视作第一阶段已开放。

## 1. 入口与路由归属

| 接口组                                      | 所属范围与调用链                                                              | 兼容要求                                                                             |
| ------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| capabilities / daemon配置 / 共享注册表管理  | process-global；仅声明已实现能力，mutation使用其原管理owner                   | 不从一个Session的能力扩大整个daemon支持面；auth/rate limit原顺序保留                 |
| workspace列表/信任/目录服务                 | resolved selected-runtime；使用其env、FS、trust和generation                   | unknown/removed/bootstrapping/draining不能回primary；工作区管理与Session引擎选择分开 |
| new/create（含仅创建与初始prompt）          | 持久workspace内的admission，selector与paired Bridge                           | 创建仅持久身份不跑模型；初始prompt另提交；普通ID reservation/同步错误保持            |
| prompt/cancel/permission/活事件             | live-session-owner；Bridge→绑定SessionExecutor→authority/coordinator          | 不因当前请求来源更换engine；取消定位原turn/调用；旧方法可选性和返回类型保持          |
| list/title/archive/export/transcript/冷恢复 | persisted-workspace scoped；Repository/authority，必要时兼容legacycontrol传输 | Managed读取不需要Harness；老controlSlot行为不改变成新强保证；不展示Tool-onlySession  |
| fork/rewind/delete                          | 原Session维护owner，关闭/锁/版本检查后执行专项协议                            | 无执行暂停证明不修改历史；新fork有新ID，当前Session不跨engine重放                    |
| Channels/Live/Standalone/定时               | 先解析可信来源与purpose，再进入上述同一接缝                                   | 普通SDK成功不代表这些入口已迁移；各自目录锁、交付、run和父子身份保留                 |

实现位置：CLI `serve/routes/session.ts`、`serve/acp-http/dispatch.ts`、server的workspace解析及archive/list；ACP Bridge与bridgeTypes；Web Shell的DaemonClient/WorkspaceProvider/SessionView；Standalone/Live协调器。旧方法的精确返回与调用者在268项附录中列明，不另建一套Managed公共REST。

## 2. 受理、终态和物理完成

普通REST prompt仍返回已有202 `{promptId,lastEventId,eventEpoch}`，但Managed适配等待输入+唤醒的持久ACK后才响应。同步admission ticket仍先检查Session、队列、ID、workspace与用途；onPromptAdmitted/完成Promise的时机分别保留。客户端断线不等于撤销已接受输入，重复请求使用同业务ID查原结果。

authority投影维护 `turnId/promptId → inputId/terminal event/physical holds`。用户正式消息只出现一次；模型流preview带attemptId且可丢弃，模型完成内容和ToolOutcomeRef提交后才合并为正式历史。内容块、tool IDs、模型切换、用量、stopReason、附件和引用保持原形状；display裁剪不修改模型恢复内容。

deadline、用户cancel和原操作实际结算可先后到达。外部已经发出的正式 turn_error/turn_complete 不再被迟到工具结果改写为另一终态；物理晚成功单独保留结果并更新原调用投影，后续执行仍受未决安全屏障约束。内部turn.settled仅一个正式终态，`pendingOwnersRef`可以非空；最后一个physical hold消失不额外触发第二次任务完成通知。

## 3. 历史、流与恢复游标

Session authority是正式事件唯一来源；Bridge live bus是有界投影缓存。订阅先读固定throughSequence快照，注册后补齐大于该位置的事件，再持续追流；按eventId去重。projection revision或Bridge eventEpoch变化时客户端重读快照，不把旧bus整数cursor直接当authoritysequence。

| 事件/投影          | 正式来源                                      | 客户端行为                                                                                      |
| ------------------ | --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| user消息/排队      | input.accepted                                | 原inputId去重，发送失败可准确区分未受理与已受理后断线                                           |
| assistant/tool内容 | message.committed / tool.receipt              | 按message/call/part归并，保留并行工具ordinal；不从preview制造完整结果                           |
| 工具运行与进度     | 已提交意图/原Runtime进度                      | 展示工具名、状态和输出；进度丢失可显示缺口，不能把0字节当空闲                                   |
| 等待审批/问答      | action.changed(state=requested)及当前决策投影 | 只恢复仍pending的请求；过期、已决、被改参旧票据不可再次授权                                     |
| 用量               | model attempt正式usage与已提交累计            | 以attemptId/receipt去重；provider未提供为unknown，不使用0；重试费用保留attempt归属              |
| 终态/通知          | authority正式turn终态                         | 继续映射现有turn_complete/turn_error；不能由Artifact callback或UI idle推断完成                  |
| 恢复被阻塞         | 原调用/配置/存储的可公开原因                  | 显示“上次操作结果待确认”等可操作信息，提供查原状态/取消/另开任务，不暴露lease、secret或内部路径 |

冷历史分页沿原cursor形状，通过适配返回user/assistant/tool/Goal/artifact/压缩/分支投影。无live对象照常可读；未知格式严格恢复拒绝，展示容错不能静默写回。目录合并持久记录与活状态，以逻辑Session ID去重，worker/runtime ID仅作受控诊断。

## 4. 权限和用户问答

保留first-responder、consensus、local-only等已实现策略。`votePermission/respondToPermission`的同步boolean仍表示原协议的登记结果；最终决策持久化由内部异步仲裁门槛完成。Harness派发只消费最终decision receipt，不能据中间投票true执行工具。

Action记录包含 `requestId, kind, source, inputRevision, optionsRef, policyRevision, createdAt, expiresAt?, state, decisionRef?`。source 是封闭 union：`tool_call {sourceCallId,executionCallId}`、`automation_run {runId,occurrenceId,targetRef}`、`team_plan {teamId,requestId,childRunId,planRevision}`、`user_operation {operationId,originClientRef}`；由已认证来源选择并校验原记录，不接受模型自报 scheduler/leader 身份。旧权限工具的 sourceCallId 从 tool_call 分型投影，非工具确认不造假 call ID。Runtime工具另带原prepare/ref；纯问答不创建Runtime。重连根据authority重建action和新连接waiter，不恢复旧Promise；重复响应查原decision，冲突、改参或过期按原协议返回拒绝。新参数必须新prepare/revision和重新审批，旧版票据不可升级。

创建与决定分别校验：tool_call 由有效 Harness 经 appendExecution 请求；其余三类只由注册适配器经私有 requestAction 请求，actor/来源矩阵以[存储 §3](managed-agent-session-storage.md#3-事件-union-与生产消费链)为准。客户端没有任意创建 action 的权限，原用户操作入口由服务端适配；所有最终决定仍走 resolveAction 和原仲裁。UI 从已提交 requested 投影展示非工具确认，不依赖活 Harness、正在生成的 turn 或伪造 sourceCallId；重连/重复点击只消费原 requestId 与版本。

无客户端时保持原用途的超时/自动拒绝规则：foreground需要交互的调用等待其原deadline或授权client重连；非交互明确不支持的询问准确失败；已持久支持detachable wait时可释放Harness。legacy ACP当前无live stream的拒绝行为保留；Managed新的持久等待通过协商能力接入，不能让不支持客户端永久挂住。关闭/取消先提交取消意图，再结束原waiter；与可恢复detach分别处理。

## 5. Web Shell 状态与可操作性

普通SessionView继续使用现有组件和交互，不新增要求用户选择engine的控制。运行时有明确的生成/工具运行/等待授权状态；没有assistant内容时也能显示已接受输入和当前工作。流暂断显示重连并后台读取正式状态，不一直维持无法恢复的loading。

Send的可用性沿原普通入口的并发/排队契约：空输入、提交中的同一请求、关闭或超限准确禁用并给出原因；运行中的后续输入按原队列能力处理，不能因Managed未释放一个布尔busy永远无法发送。cancel在无活Harness而原工具仍运行时也能调用coordinator；按钮受取消状态控制，不只依赖本地streamingState。

终态到达后结束对应prompt的生成状态，保留其他prompt/后台工作的占用。terminal已发但原副作用待结算时，输入框不自动触发危险续轮；展示待确认原因和可用操作。页面重载根据持久snapshot恢复消息、审批、队列及取消状态，无需实验URL参数。

通知只消费最小 `{sessionId,promptId,outcome}`，结合原用户开关、后台/失焦状态以及站点/OS权限；重放终态不会再次通知，打开过的历史任务不补发完成提醒。父任务接受和Channels发送走各自持久outbox，不用浏览器通知完成作为业务交付证明。

## 6. 客户端版本与有限默认

定时任务由新能力 `scheduled_task_server_run_v1` 在显示 Run 入口前协商；新 Managed 任务采用服务端统一受理/派发，不能让旧客户端沿先 prompt 后登记 run 的路径重复发送。未协商的客户端仅得到该类任务只读/明确不支持的入口；legacy 任务保留旧协议。详见[自动任务与交付](managed-agent-automation.md)。

能力声明区分 `session_schema`, `durable_admission`, `durable_actions`, `harness_restore`, `runtime_receipts`, `artifact_resources`, `scheduled_task_server_run_v1`，服务器只发布实际实现且满足该workspace/config/platform组合的能力。新client可以消费增强投影，旧client仍走相同公开DTO；无法无损适配的增强操作准确unsupported，不偷偷改成legacy执行。

新默认按purpose、配置快照和平台proof选择；同一workspace可以并存legacy与Managed，旧Session沿固定owner。开关关闭只影响后续新建，保留已存在Managed authority和恢复client；不可停用它们的reader再要求旧引擎执行。发布回退必须包含新格式reader/maintenance兼容版本，或关闭旧Session执行只提供导出，不删除格式guard。

## 7. 普通入口验收

| 编号 | 场景与通过条件                                                                                                                     |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------- |
| U01  | 四处factory与Web Shell/REST/ACP/SDK create→prompt→工具→final；持久ACK、实际engine与真实物理结果对应，无实验flag                    |
| U02  | 首轮失败后继续、队列满/重复/断线/重载；Send和cancel可恢复，消息不重复，未知受理可查原ID                                            |
| U03  | ask-user/权限策略、改参、重复票、无client、换连接、close/detach竞争；无旧票据新授权，无永久孤儿waiter                              |
| U04  | preview中断、换model attempt、完整正式内容、超大媒体与慢SSE；历史及用量完整去重，未收到usage不记0                                  |
| U05  | turn terminal与物理晚成功/父接受/通知并发；单正式终态、单通知，原结果不被cancel覆盖                                                |
| U06  | cold history、archive/export、旧reader/新schema、workspace remove/replacement；不启动无关Harness，不回primary、不暴露workerSession |
| U07  | 浏览器后台/失焦和两层通知权限、完成后重开旧页面；真正新完成才通知，历史重放不通知                                                  |

本轮不运行这些产品验收。实施必须保留源码版本、普通入口请求/事件与物理证据，不能把文档矩阵或实验页面通过写成全量客户端支持。
