# qwen-code PRs · 2026-08-31 ~ 2026-09-06 (W36 周内累计)

> 本文件已整理 2026-08-31 至 2026-09-06（Asia/Shanghai）创建的 @doudouOUC 个人 PR。口径为 `QwenLM/qwen-code` 中 author 为 @doudouOUC 且 createdAt 落在对应北京时间日/周窗口内的 PR；只在窗口内更新、关闭或合入，但创建时间不在窗口内的 PR 不计入新增统计。open PR 只记录当前 diff 方案，不能视为 `main` 已落地能力。

**主题**: provider/SDK 错误详情、Channel 命名任务并发与 worktree 隔离、managed daemon PATH、Mem0 dialect 与 npm 分发、standalone provisional reasoning 和 WebShell 首屏模型选项

**PR 统计**: 9 PRs - 6 merged / 3 open / 0 closed
**当前已合并 PR 代码量**: +1,763 / -649，35 个文件变更
**全量代码量**: +7,237 / -992，105 个文件变更
**类型分布**: feat ×4, fix ×4, docs ×1
**范围 (scope)**: serve/daemon ×5, sdk ×3, acp-bridge ×3, channels ×2, external-context ×2, web-shell ×1, cli ×1, release ×1, core/worktree ×1, docs/deployment ×1

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 代码量 | 文件数 | 创建时间(UTC) | 合并/关闭时间(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#10569](https://github.com/QwenLM/qwen-code/pull/10569) | ✅ merged | @doudouOUC | fix(serve): surface provider error detail in turn_error messages | +385/-11 | 7 | 08-30 16:08 | 08-31 03:12 |
| [#10571](https://github.com/QwenLM/qwen-code/pull/10571) | ✅ merged | @doudouOUC | fix(sdk): Surface daemon JSON-RPC error details | +196/-3 | 2 | 08-30 16:42 | 08-31 02:52 |
| [#10574](https://github.com/QwenLM/qwen-code/pull/10574) | ✅ merged | @doudouOUC | feat(channels): Enable concurrent named task control | +510/-124 | 7 | 08-30 16:57 | 08-31 08:31 |
| [#10576](https://github.com/QwenLM/qwen-code/pull/10576) | ✅ merged | @doudouOUC | docs(serve): Document tool PATH for managed daemons | +12/-3 | 1 | 08-30 17:24 | 08-31 02:33 |
| [#10634](https://github.com/QwenLM/qwen-code/pull/10634) | ✅ merged | @doudouOUC | feat(external-context): Load administrator-owned Mem0 dialects | +582/-502 | 16 | 08-31 12:21 | 08-31 13:14 |
| [#10643](https://github.com/QwenLM/qwen-code/pull/10643) | 🟡 open | @doudouOUC | feat(channels): Add worktree-isolated named tasks | +4486/-299 | 32 | 08-31 14:07 | — |
| [#10653](https://github.com/QwenLM/qwen-code/pull/10653) | 🟡 open | @doudouOUC | feat(external-context): Publish the Mem0 Extension package | +157/-11 | 12 | 08-31 16:02 | — |
| [#10706](https://github.com/QwenLM/qwen-code/pull/10706) | ✅ merged | @doudouOUC | fix(cli): Defer provisional standalone reasoning options | +78/-6 | 2 | 09-01 13:06 | 09-01 13:39 |
| [#10719](https://github.com/QwenLM/qwen-code/pull/10719) | 🟡 open | @doudouOUC | fix(web-shell): Load models for fresh standalone sessions | +831/-33 | 26 | 09-01 14:56 | — |

---

## PR 解决问题、实现方式与 feature 处理

| PR | 解决了什么问题 | 最终怎么实现（open/closed 只登记当前观察） | 对应 feature 文档 |
|---|---|---|---|
| [#10569](https://github.com/QwenLM/qwen-code/pull/10569) | provider 通过 Agent SDK 返回的 JSON 错误常落在 `data.error.message`，bridge 只能发出泛化 `Internal error`，上层 `turn_error` 丢失可操作原因。 | 最终在共享 JSON-RPC 错误提取器中保留原有优先级，再识别 nested `data.error` 字符串或 `message`；最终 terminal event、live state、transcript 和 SDK 消费者共用同一 provider detail，不改 wire schema、`errorKind` 或 retry 语义。 | 已更新 daemon ACP bridge/总览错误终态口径。完整实现见 [implementations/pr-10569.md](implementations/pr-10569.md)。 |
| [#10571](https://github.com/QwenLM/qwen-code/pull/10571) | TypeScript SDK 对 daemon HTTP 500 JSON-RPC 只展示顶层 `Internal error`，丢失 `data/details/message` 中的稳定详情。 | 最终在 `DaemonClient` 共享 HTTP 错误 formatter 中只对精确 generic 5xx + numeric code 解包，按 data 字符串、`details`、`message` 顺序选取首个非空详情；具体顶层错误、4xx、非数字 code 和原 response 保持不变。 | 已更新 [sdk.md](../../feature/sdk.md) 与 daemon SDK 子文档。完整实现见 [implementations/pr-10571.md](implementations/pr-10571.md)。 |
| [#10574](https://github.com/QwenLM/qwen-code/pull/10574) | 命名任务存在 running turn 时不能创建/切换其他 task，也无法精确取消非 selected task；权限快捷命令还可能误命中别的 task。 | 最终在 owner lock 下增加 exact task lookup/reservation，入站 turn 在异步准备前保留目标 session；解除 create/use 的 selected busy guard，但 close busy 仍 fail closed。`/session cancel [name]` 可取消精确 owned active prompt，bare permission 命令只看 selected task，显式 request ID 才能跨 inactive task。 | 已更新 [channel-adapters.md](../../feature/channel-adapters.md) 的 Part 3B 并发控制。完整实现见 [implementations/pr-10574.md](implementations/pr-10574.md)。 |
| [#10576](https://github.com/QwenLM/qwen-code/pull/10576) | systemd/launchd 管理的 daemon 不读交互 shell profile，导致 `qwen` 能启动但 child session 找不到 `gh`/`git`/`npm`/`node`；命令级临时 PATH 又会绕开稳定运行环境。 | 最终在本地部署文档中要求 service 显式设置受信绝对 PATH，token 仍与 PATH 分离保管；reload 后从新 daemon session 验证 bare `command -v gh`，不通过每条命令注入 PATH。 | 已在 daemon 总览登记 managed service PATH 部署边界。完整实现见 [implementations/pr-10576.md](implementations/pr-10576.md)。 |
| [#10634](https://github.com/QwenLM/qwen-code/pull/10634) | configurable Mem0 skeleton 的内置 preset 为空，又不能为了可用性把 provider-specific 协议或任意模板嵌入 Qwen 代码。 | 最终将 instance schema 升到 v2，用绝对 `dialectPath` 引用管理员所有的 closed Dialect V1；instance/dialect 独立 64 KiB 有界读取、严格校验和脱敏错误，完成 endpoint/路径/语义校验后才读 credential env。旧 v1 preset config fail closed，不增写入、retry、redirect、probe 或任意 template。 | 已更新 [external-context-provider.md](../../feature/external-context-provider.md) 的可配置 Mem0 runtime 和 v1→v2 迁移边界。完整实现见 [implementations/pr-10634.md](implementations/pr-10634.md)。 |
| [#10643](https://github.com/QwenLM/qwen-code/pull/10643) | shared-workspace 命名 task 不能隔离 Git 工作树；若只记录一个 cwd，重启恢复时也无法证明 session、sidecar、marker 和 worktree 仍属于同一 owner。 | 当前 open diff 为 `/session new <name> --worktree` 增加能力门控的 opt-in；daemon 创建 canonical worktree，将 exact session relocate 后用排他 0600 marker + 原子 sidecar 提供 `persisted-v1` 证明。最新 head 把 restore AUQ prompt 延后到 worktree 证明完成，并补 active/cold restore cwd 不确定状态，任一 ownership 失败都 fail closed 且不 fallback shared workspace。 | 已在 Channel 文档与 daemon lifecycle/capability/SDK 子文档刷新 open worktree 方案；未合入，不得视为 `main` 能力。完整观察见 [implementations/pr-10643.md](implementations/pr-10643.md)。 |
| [#10653](https://github.com/QwenLM/qwen-code/pull/10653) | #10634 已让管理员自有 dialect 可运行，但 Extension 仍是 private package，缺少受支持的 scoped npm 安装、版本同步和发布路径。 | 当前 open diff 移除 package private 标记，使 package/extension manifest 随 Qwen Code 版本一起更新，将包加入统一的已发布版本 guard，并在显式 bootstrap repository variable 后用 provenance 发布。tarball 继续只含 bundle、schema、manifest、README 和 package metadata，不携带 provider preset、管理员 config 或 credential。 | 已在 external-context feature 登记 open npm 分发与 bootstrap 边界。完整观察见 [implementations/pr-10653.md](implementations/pr-10653.md)。 |
| [#10706](https://github.com/QwenLM/qwen-code/pull/10706) | daemon-owned standalone create/load/resume 的 provisional 阶段尚未建立 content-generator config，构造 `reasoning_effort` 时会解引用 `thinkingMandatory` 并返回 500。 | 最终让 config option builder 对 optional generation config fail soft：缺失时只返回 mode/model，不提前刷新认证或激活 workspace；managed activation 完成后，普通 session-context refresh 再发布完整 reasoning 选项并保留 mandatory model 不含 `none` 的约束。 | 已更新 daemon standalone lifecycle 口径。完整实现见 [implementations/pr-10706.md](implementations/pr-10706.md)。 |
| [#10719](https://github.com/QwenLM/qwen-code/pull/10719) | WebShell 延迟到首个 prompt 才创建 standalone session，但模型列表也只能 attach 后获得，导致首屏 picker 为空；创建后再 best-effort 切模型还可能让首个 prompt 使用 daemon 默认模型。 | 当前 open diff 新增 capability-gated、无 workspace 输入的只读 standalone options route，复用 exact Conversations runtime 并只返回脱敏 provider/model options；SDK 做严格运行时校验，WebShell 在零 session 时 hydrate picker，并把选择的 `modelServiceId` 原子放进首次 create，跳过后续 model switch。旧 daemon/读取失败仍按默认模型创建。 | 已更新 daemon capability、SDK 和 WebUI transport 的 open 方案；未合入。完整观察见 [implementations/pr-10719.md](implementations/pr-10719.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [daemon-serve-mode/](../../feature/daemon-serve-mode/README.md) | #10569 / #10576 / #10643(open) / #10706 / #10719(open) | 补 provider error terminal、managed service PATH、worktree restore follow-up、standalone provisional reasoning 与首屏模型选项边界。 |
| [daemon-serve-mode/03-session-lifecycle.md](../../feature/daemon-serve-mode/03-session-lifecycle.md) | #10643(open) / #10706 | 记录 persisted-v1 restore/AUQ 顺序与 standalone provisional config 生命周期。 |
| [daemon-serve-mode/04-capabilities-and-protocol.md](../../feature/daemon-serve-mode/04-capabilities-and-protocol.md) | #10643(open) / #10719(open) | 记录 `session_worktree_persistence_v1` 与 `standalone_session_options_v1` 的 capability/response 双重校验。 |
| [daemon-serve-mode/07-acp-bridge-and-permission.md](../../feature/daemon-serve-mode/07-acp-bridge-and-permission.md) | #10569 | 更新 nested JSON-RPC/provider error detail 提取优先级。 |
| [daemon-serve-mode/10-client-adapters-and-sdk.md](../../feature/daemon-serve-mode/10-client-adapters-and-sdk.md) | #10571 / #10643(open) / #10719(open) | 更新 SDK 5xx detail、worktree attestation 与 standalone options 严格 validator。 |
| [daemon-serve-mode/11-webui-and-transport.md](../../feature/daemon-serve-mode/11-webui-and-transport.md) | #10719(open) | 记录零 session 模型 hydration、首次 create 原子 model 选择和旧 daemon fallback。 |
| [channel-adapters.md](../../feature/channel-adapters.md) | #10574 / #10643(open) | 补命名 task 并发控制和 open worktree isolation 阶段。 |
| [sdk.md](../../feature/sdk.md) | #10571 | 登记 daemon JSON-RPC 5xx 错误详情保留规则。 |
| [external-context-provider.md](../../feature/external-context-provider.md) | #10634 / #10653(open) | 将 configurable Mem0 更新为管理员所有 dialect，并登记受 bootstrap gate 保护的公开 npm 分发方案。 |

_按个人 PR 口径更新于 2026-09-02_
