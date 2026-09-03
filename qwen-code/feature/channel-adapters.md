# Channel adapters 技术方案

> 适用范围：`QwenLM/qwen-code` channels 包与 CLI channel registry。本文只按 `@doudouOUC` 个人 PR 口径整理。

---

## 1. 背景与动机

Channel adapter 让 qwen-code 可以从本地 TUI 之外的消息通道接收用户输入。adapter 不应该依赖某个具体 bridge 实现，否则后续要切到 daemon-backed bridge、测试 fake bridge 或多 channel bridge 时，所有 adapter 都会被迫跟着底层类名和生命周期细节变化。

#5978 的目标是把 adapter-facing 依赖从具体 `AcpBridge` 收窄为 `ChannelAgentBridge` contract：adapter 只需要知道“创建/恢复 session、发送 prompt、订阅事件、清理 session”等 agent-session 行为，不再把 `AcpBridge` 当成唯一实现。#6031 在此基础上让 `qwen serve --channel` 托管 out-of-process channel worker；#6098 再补 worker restart、heartbeat、status issue 和日志脱敏；#6165 把 daemon prompt completion 从 one-tick guess 改为 `turn_complete` SSE barrier；#6182 给 bridge 增加 session listing；#6309 进一步让 daemon-owned load replay 可以由 bridge snapshot 批量承接，避免历史帧走 live fanout；#6598 新增 channel worker reload，让 settings 变更不必重启整个 daemon；#6635 把 daemon-managed channel workers 按 workspace 分组，避免 multi-workspace daemon 中 secondary workspace channel 误用 primary env/settings；#6741 把 channel selection 做成 daemon runtime resource，支持运行时启用、替换、查询和停止 worker；#6950 把 adapter `connect()` startup failure 作为结构化诊断带回 supervisor/API/CLI；#7019 把 channel ownership 与 hardening fail-closed 口径同步到用户/开发文档；#10198 再为 daemon-managed user scope 增加 owner-scoped 命名任务目录；#10420 已合入命名任务可见输出归因，#10574 已合入 running task 期间的精确切换/取消/权限控制；#10643 当前 open diff 进一步提出 worktree-isolated named task。

---

## 2. ChannelAgentBridge 合约

`ChannelAgentBridge` 是 adapter 与 agent runtime 之间的窄接口：

- `SessionRouter` 和 adapter 构造参数面向 bridge contract，而不是具体 `AcpBridge`；
- standalone `qwen channel start` 仍由现有 `AcpBridge` 实现，不改变默认运行路径；
- thread-scoped `/clear`、`/status` 与 prompt 使用同一 routing key，router 可以按 bridge session id 移除所有状态；
- restore 会拒绝非法 session id，restore/create race 中收到 session-death event 时会清理 stale mapping；
- `ChannelBase` 在 bridge swap 后重新绑定 listener，避免 prompt stream listener 泄漏。
- optional `listSessions()` 返回 `BridgeSessionInfo[]`，让 adapter/诊断工具能看到当前 bridge 内 session id、workspace 和 active prompt 状态。

```mermaid
flowchart LR
  Adapter["Channel adapter"] --> Router["SessionRouter"]
  Router --> Bridge["ChannelAgentBridge"]
  Bridge --> Session["agent session"]
  Session --> Events["event stream"]
  Events --> Adapter
```

---

## 3. 插件兼容策略

TypeScript 插件如果显式把 adapter 构造参数标成 `AcpBridge`，应迁移到 `ChannelAgentBridge`；运行时 JavaScript 插件保持结构兼容。这样现有 standalone ACP-backed 启动路径不被破坏，同时新 adapter 或测试 double 可以只实现 contract。

#5978 本身没有实现 `qwen serve --channel` 或 daemon-managed worker；它先把 adapter 合约提前收窄，降低后续 bridge 替换的耦合成本。#6031 已把 daemon-managed worker 合入 main：serve 进程 fork internal `channel daemon-worker`，worker 使用 TS SDK + `DaemonChannelBridge` 回连 daemon，并强制 thread-scoped daemon session，避免污染默认 single session。#6098 则把该 worker 从“能启动”加固到“能运行”：ready 后有界重启、IPC heartbeat/stale kill、partial-connect issue、pidfile workerPid 清理和日志脱敏。#6165 用 `turn_complete` / `turn_error` 释放 per-session barrier，主路径不再靠 `setTimeout(0)` 猜测 SSE chunk drain；#6182 让 `DaemonChannelBridge` 从内部 `sessions` map 和 `activePrompts` set 构造 session snapshot，并由 daemon-worker facade optional 透传。#6309 对 load replay 的影响是 bridge 可以从 ACP response seed 当前 snapshot，随后 channel/ACP stream attach 再从 snapshot 发 replayed `session/update`，而不是在 restore 期间把历史帧逐条推进 live EventBus。#6598 给 worker supervisor 增加 `restart()`，对外暴露 HTTP/SDK/CLI reload 面，支持不重启 daemon 的 settings reload。#6741 把 selection lifecycle 抽到 `ChannelWorkerManager`，daemon 即使启动时未带 `--channel`，也能后续通过 API 设置 selection。#6950 在 worker startup IPC 中保留 adapter `connect()` failures，避免 dynamic channel control 只返回 generic startup failure；#7019 进一步明确 selected channel 按 owning trusted workspace 分组，`--channel all` 暂保持 primary-only v1，multi-workspace hardening 文档不把它误写成全 workspace 自动展开。

### 3.1 daemon-managed channel worker reload（#6598）

`ChannelWorkerSupervisor.restart()` 是 stop+start relaunch：当前 worker 停止后重新 fork，让新 worker 重新读取 `settings.json` 中的 channel token、proxy、per-channel model 等配置。并发 reload 会合并到同一个 Promise，避免一连串 reload 请求 fork 多个 worker；`killAllSync()` 会 latch `disposed`，reload 与 daemon teardown 竞争时不再 relaunch。

对外有三条入口：

- HTTP：`POST /workspace/channel/reload`，走 strict mutation auth；worker 未启用时返回 `409 channel_worker_not_enabled`，成功返回 `{ reloaded:true, worker:<snapshot> }`。
- SDK：`DaemonClient.reloadChannelWorker()`，建议先检查 `channel_reload` capability。
- CLI：`qwen channel reload`，支持 `--daemon-url` / `--token`，并回退 `QWEN_DAEMON_URL` / `QWEN_SERVER_TOKEN`。

能力 `channel_reload` 只有在 `getChannelWorkerSnapshot` 和 `reloadChannelWorker` 两个 deps 都被 wire 时才广告；route 也使用同一条件注册，避免客户端看到 capability 但调用 route 404。

### 3.2 multi-workspace channel worker grouping（#6635）

#6635 把 selected channels 先解析为 workspace groups：显式 cwd 或 workspace-scoped channel config 归属对应 trusted workspace；user/system scope 无 cwd 的 channel 视为 ambiguous；未注册 cwd 返回 mismatch；untrusted workspace fail fast。`--channel all` 暂保持 primary-only v1，避免自动展开所有 workspace channel 改变既有语义。

每个 trusted workspace group 启动一个 `ChannelWorkerSupervisor`，worker 绑定 runtime workspace cwd、`QWEN_DAEMON_WORKSPACE` 和 `runtime.env.effectiveEnv`，webhook config 也从 owner workspace 读取。`ChannelWorkerGroup` 管理多个 supervisors：start 顺序执行并在失败时回滚；restart 是 daemon-wide fail-closed transaction，任一 worker restart 失败会 stop 整组，避免混合 generation 继续对外服务；webhook dispatch 按 channel owner 路由，找不到 worker 时返回 `channel_worker_unavailable`。

兼容面：单 workspace 时 pidfile/status 保持旧字段；multi-workspace 时 pidfile `workers[]` 记录 `workspaceId/workspaceCwd/channels/workerPid`，`/daemon/status.runtime.channelWorkers[]` 暴露完整列表，旧 `channelWorker` 与 reload response 仍指 primary 或首个 worker。

### 3.3 runtime daemon channel control（#6741）

#6741 新增 `ChannelWorkerManager` 和 `channel_control` capability，把 channel worker selection 变成 daemon runtime resource。runtime selection 是临时控制态：`PUT` 不写 settings 或 boot options，daemon 重启后仍回到 `qwen serve --channel` 的启动选择，或在未传该参数时保持 disabled。入口包括：

- HTTP：`GET /workspace/channel` 查询 selection/worker snapshot，`PUT /workspace/channel` 设置或替换 selection，`DELETE /workspace/channel` 停止并清空 selection，`POST /workspace/channel/reload` 沿用 reload 语义。
- SDK：channel control helpers 与既有 `reloadChannelWorker()` 分层，客户端先 gate `channel_control` / `channel_reload`。
- CLI：`qwen channel set`、`qwen channel status`、`qwen channel stop` 走 daemon API。

manager 串行化 lifecycle mutation，并复用 #6635 的 worker group reconcile：未变化 workspace worker 保持运行，新增/删除 group 做精确启动/停止；替换失败回滚到旧 selection、PID file 和 webhook routing state。worker callbacks 带 generation，替换前 worker 的 late ready/exit 只记录日志，不覆盖当前状态；daemon drain/shutdown 返回 `daemon_draining`。worker shutdown 还保留 PID lease 直到 child exit 被确认，避免 stale exit race 下重复 worker。

### 3.4 startup failure diagnostics（#6950）

#6950 补齐 adapter `connect()` 失败的诊断链路。worker child 捕获每个 adapter `connect()` rejection 后，发送 `channel_startup_failure` IPC，并等待 parent `channel_startup_report_ack` 再继续尝试下一个 adapter；ACK 才是 supervisor 已处理的边界，避免 worker 同步退出时只剩 generic “No channels connected.”。

failure payload 只包含 bounded/redacted `channel`、`phase:'connect'`、optional adapter `code` 和 message；parent 再次校验、净化控制字符、redact daemon token/sensitive env/generic credentials，并按 Unicode code point 截断。单个 startup 最多保留 64 条，超过后设置 `startupFailuresTruncated`。partial connect 仍 ready，snapshot 暴露 failures；dynamic all-fail 返回 `502 channel_worker_start_failed`，body 带 workspace-annotated attempted failures 和 rollback 后 state，后续 GET 不保留失败 attempt。

### 3.5 same-chat delivery ownership（#10145）

#10145 已合入同一 chat 多 session 的异步投递修复。QQ 用 `QQReplyContext {chatId,msgId,timestamp}` 和 `AsyncLocalStorage` 把入站 message identity 绑定到完整 async call chain；stream segment、final response、延迟 flush 和 retry 都保留 segment-origin context，不再在发送时读取易漂移的 latest message。context/msgSeq 以 5 分钟 TTL 清理，persisted QQ schema 不变。

微信 typing 状态从 chat-level set 改为 chat 下按 session 引用计数；一个 session 完成只释放自己的 owner，最后一个 owner 离开才取消 indicator。示例 adapter 同样使用 async-local context 与 `ChannelOutputSegmentContext.messageId`，覆盖重叠消息乱序完成。该机制保证进程内归属，不提供跨进程 exactly-once journal。

### 3.6 owner-scoped named sessions（#10198）

#10198 已合入 opt-in `multiSession:true`。启用时必须同时使用 `sessionScope:'user'` 和 daemon-managed worker；standalone channel、非 user scope、history backfill、webhook 与 persisted loop 等不兼容组合在启动期失败关闭。未启用时仍走旧 `SessionRouter` 单 selected-session 行为。

`NamedSessionManager` 按 channel instance + chat/thread + sender 建 owner key，在 owner 私有的有界原子 JSON catalog 中维护最多 8 个命名任务。`/sessions`、`/session current|new|use|close` 只展示任务名、open/closed 和 shared isolation，不泄露 daemon session ID；inactive task 只按 catalog 中的精确 ID load，失败不创建 replacement。现有 route 继续作为当前选择兼容指针。

入站 turn 在异步 media preparation 前绑定接收时的 session ID 与 generation，并用 queued-turn ownership 保持到 prompt 完成。#10198 合入时 queued/running turn、pending permission、cancel wind-down 或 bridge active prompt 都使 create/use/close fail closed；#10574 已在不改变已绑定 turn 目标的前提下放开 create/use，close busy task 仍 fail closed。当前 merged 能力仍只支持 shared workspace；worktree 隔离只存在于 #10643 open diff，主动投递、webhook、loop 和跨 daemon exactly-once 仍在范围外。

### 3.7 named-task delivery attribution（#10420 merged）

#10420 最终合入 Part 3A。`NamedSessionManager` 从已验证 catalog 派生 exact session ID→task name/status/target 索引；registry 与索引只在原子写成功后一起发布。常规 turn 走已有 named resolution，background/permission miss 只允许按 owner lock、exact selected route 与 cwd 规则有界收养 legacy `default`，不扫描无界 closed task 列表。

Turn 或 permission admission 捕获独立于 model text 的 immutable `sourceLabel`：私聊为 `[task]`，群聊为 `[sender · task]`。各 adapter 在自己的 plain/Markdown/HTML/card/split/fallback/media/retry 最终发送边界转义并重复标签，保证每个独立可见对象恰好一次；raw bridge response、transcript 与 telemetry 不被改写。GitHub restart-safe final-delivery outbox 仅持久化 optional captured label，以维持既有重试归因。Feishu 在 bot-origin card reply extraction 时剥离已渲染标签，避免 attribution 进入引用输入；Telegram 在 4096 字符限制内做 markup-balanced 分片并给每片重复标签，必要时逐片回退 plain。

命名模式文本权限提示展示 exact request ID 和带 ID 的 approve/deny 命令；bare command 与同步 catalog/selection 回执保持 Part 2 行为。该 PR 本身不解除 selected-task busy guard、不增加 named cancel 或并发执行；这些 shared-workspace 控制已由后续 #10574 合入。#10420 与 #10574 都不扩展 webhook/loop/history/standalone/worktree 范围。

### 3.8 concurrent named-task control（#10574 merged）

#10574 在 owner lock 下增加 exact task `lookup()` 与 `resumeReserved()`，让入站 turn 在异步准备前保留目标 session，之后即使 selected task 已变也不会误投。create/use/fallback 不再被 selected 或 destination busy 全局阻塞，但 close busy task 仍拒绝，避免正在运行的 session 失去 catalog owner。

`/session cancel [name]` 可取消 selected 或 exact owned open task 的 active prompt，并复用已有 `requestActivePromptCancellation()` 语义。bare permission 命令只检查 selected session，显式 request ID 才允许定位 owned inactive task。`multiSession:false` 仍走原有单 selected-session 路径。这一阶段解决 shared-workspace 并发控制，不提供文件/Git 工作树隔离。

### 3.9 worktree-isolated named tasks（#10643 open）

#10643 当前 open diff 为 `/session new <name> --worktree` 增加 opt-in isolation。worker 必须先看到 daemon `session_worktree_persistence_v1` 能力；daemon 创建 canonical worktree、relocate exact session，再用排他 0600 `.qwen-session` marker 和原子 sidecar 产生 per-response `persisted-v1` attestation。registry 只在该证明完整时记录 `isolation:'worktree'` 与 canonical cwd。latest head 还把 restore AUQ prompt 和 dangling prompt terminal reconciliation 延后到 sidecar/marker/cwd attestation 完成；只有 deferred prompt 未接纳时才补 interrupted terminal，避免恢复 turn 在错误 cwd 启动或被误记为丢失。

restore 严格校验 workspace/repo root、realpath containment、sidecar/marker owner 和运行时 cwd；不确定时 fail closed，不 fallback shared workspace。spawn 前失败可直接回收 checkout/branch；spawn 完成后只在 exact session 已确认删除时回收，generation 关闭、kill 拒绝或探测不确定时保留以免破坏未知 owner 的数据。selected worktree task 中 `/clear`/`/new`/`/reset` 当前会提前拒绝，close 保留 transcript/worktree。该 PR 尚未合入，不能将这些行为当作 `main` 能力。

---

## 4. 涉及 PR

| PR | 状态 | 解决的问题 | 最终实现 |
|---|---|---|---|
| #5978 | merged | adapter 直接依赖 `AcpBridge`，后续切 daemon-backed / fake bridge 时耦合过重。 | 引入 `ChannelAgentBridge` contract，router/adapter 改依赖窄接口，修复 bridge lifecycle 与 listener 重新绑定边界，保留 `AcpBridge` 作为 standalone 实现。 |
| #6031 | merged | `qwen serve --channel` 尚不能由 daemon 托管 channel worker。 | 新增 repeatable `--channel` / `--channel all`、serve-owned worker supervisor、`DaemonChannelBridge` 回连、thread-scoped session load/create、pidfile ownership 与 `/daemon/status` worker snapshot。 |
| #6098 | merged | daemon-managed worker 缺少 ready 后恢复、心跳、日志脱敏和 stale pid/status 诊断。 | ready 后按 5 分钟 3 次策略重启；15s heartbeat / 45s stale kill；worker stdout/stderr 脱敏与有界 buffer；status 暴露 partial connect、restart/error fields。 |
| #6165 | merged | prompt 返回前靠 `setTimeout(0)` 等 late SSE chunks，时序不确定。 | `DaemonChannelBridge` 建 per-session turn barrier；`turn_complete` 释放正常完成，`turn_error` 记录协议错误后释放；drop/cancel/stop 也释放以防悬挂，非 SSE 路径保留 one-tick fallback。 |
| #6182 | merged | adapter/诊断工具无法枚举 bridge 当前 sessions。 | `ChannelAgentBridge` 增加 optional `listSessions()`；`DaemonChannelBridge` 返回 session id、workspace 和 `hasActivePrompt` snapshot；daemon-worker facade 按 optional method 透传。 |
| #6309 | merged | 大历史 session load 逐帧 child-to-daemon replay 会污染 live fanout 与 ring。 | daemon bridge 可请求 response-mode replay，并用 ACP response 中的私有 replay payload seed snapshot；direct ACP 默认 streamed replay 兼容。 |
| #6598 | merged | channel settings 变更需要重启整个 daemon 才能生效。 | `ChannelWorkerSupervisor.restart()` relaunch worker 并重读 settings；新增 strict HTTP reload route、SDK helper、CLI `qwen channel reload` 和条件能力 `channel_reload`。 |
| #6635 | merged | multi-workspace daemon 中 channel worker 仍绑定 primary workspace，secondary workspace channel 会读错 env/settings/status。 | selected channels 按 owning trusted workspace 分组，每组一个 supervisor；`ChannelWorkerGroup` 提供 fail-closed group restart、webhook owner routing、pidfile `workers[]` 与 status `channelWorkers[]`。 |
| #6741 | merged | daemon 启动后无法启用、替换、查询或停止 channel worker selection。 | 新增 runtime `ChannelWorkerManager`、`channel_control` capability、HTTP/SDK/CLI selection control，并在替换失败时回滚旧 worker group/pidfile/webhook state。 |
| #6950 | merged | adapter `connect()` 失败原因在 worker 启动边界丢失。 | 新增 startup failure IPC + ACK，snapshot/HTTP/SDK/CLI 暴露 bounded redacted failures；dynamic all-fail 返回 `channel_worker_start_failed` 和 attempted failures。 |
| #7019 | merged | multi-workspace hardening 文档仍可能把 channel workers 写成 primary-only 或全 workspace 自动展开。 | 用户/开发文档明确 worker selection 按 owning trusted workspace 分组，`--channel all` 暂保持 primary-only v1，并把 channel worker 归入 workspace-qualified / legacy-primary ownership 边界。 |
| #10145 | merged | 同一 chat 多 session 共享 latest reply/typing 状态，乱序异步完成会错投消息或提前取消 typing。 | QQ 用 async-local reply context 保留 segment origin；微信 typing 按 chat/session 引用计数；示例 adapter 同步采用 message-scoped context，公共接口和 persisted schema 不变。 |
| #10198 | merged | 同一 owner 在一个 chat 中无法保留和切换多个隔离任务，异步入站又可能漂移到新的 selected session。 | daemon-only 命名任务 catalog 保存精确 session ID；命令面只暴露任务名，turn 在媒体准备前绑定 session/generation，busy 时拒绝任务变更，重启按原 ID 精确恢复。 |
| #10420 | merged | 命名任务的异步结果和权限界面无法标识来源 task。 | exact session presentation index 和 delivery-only `sourceLabel` 覆盖 adapter 分片、卡片、fallback、后台与权限边界；补 Feishu 回抽剥离与 Telegram markup-balanced 分片，不改变 model text、transcript 或 Part 2 并发语义。 |
| #10574 | merged | running task 会全局阻止创建/切换其他命名 task，且不能精确取消非 selected task 或约束跨 task 权限快捷命令。 | owner-scoped exact lookup/reservation 保留入站 turn 目标，放开 create/use 而保留 busy-close guard；增加 named cancel，bare permission 只看 selected task，exact request ID 可路由 owned inactive task。 |
| #10643 | open | shared-workspace 命名 tasks 会互相干扰 Git/文件状态，重启恢复又缺少 exact worktree ownership 证明。 | 当前 diff 用 capability-gated `--worktree`、canonical relocate、排他 marker+原子 sidecar 和严格 restore attestation 建立 `persisted-v1`；任一 ownership 不确定时 fail closed，尚未合入。 |

---

## 5. 已知限制 / 后续

1. 多账号隔离、平台风控和长期 worker 调度仍需要后续 PR 单独落地。
2. daemon-managed worker 已支持 restart/heartbeat、prompt turn barrier、session listing、settings reload、workspace grouping、#6741 runtime selection control 和 #6950 startup failure diagnostics；多进程 rolling upgrade、跨 daemon worker 迁移仍未在本页覆盖。
3. 新插件应优先面向 `ChannelAgentBridge` 编程，只有 standalone ACP-backed 路径才需要知道 `AcpBridge`。
4. #10145 只修复单进程内的 delivery ownership；跨进程重启、平台去重和 exactly-once 仍需要独立 journal/adapter 协议。
5. #10574 已合入 shared-workspace 的 running-task create/use、named cancel 和权限路由；worktree isolation 只存在于 #10643 open diff，主动投递、webhook、loop 和 history backfill 尚未开放。
6. #10420/#10574 已合入跨 adapter 标签、权限归因与并发控制；真实平台 transport E2E 和预发验证仍待完成。
7. #10643 仍为 open；`session_worktree_persistence_v1`、worktree-isolated task、marker/sidecar restore 和相关 SDK metadata 不能视为 `main` 能力。

_按个人 PR 口径更新于 2026-09-04_
