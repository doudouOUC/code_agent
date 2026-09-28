# qwen-code PRs · 2026-09-28 ~ 2026-10-04 (W40 周内累计)

> 本文件已整理 2026-09-28 至 2026-10-04（Asia/Shanghai）创建的 @doudouOUC 个人 PR。口径为 `QwenLM/qwen-code` 中 author 为 @doudouOUC 且 createdAt 落在对应北京时间日/周窗口内的 PR；只在窗口内更新、关闭或合入，但创建时间不在窗口内的 PR 不计入新增统计。open PR 只记录当前 diff 方案，不能视为 `main` 已落地能力。本次仅查询北京时间 2026-09-28 的创建窗口，尚非整周统计。

**主题**: 持久本地 Runtime 与可信重启恢复、远程 Shell 结果持久交付、daemon 审批模式冷恢复、本地 Managed engine 后置、附件分块上传、Hosted 文件路径拒绝

**PR 统计**: 7 PRs - 1 merged / 6 open / 0 closed
**当前已合并 PR 代码量**: +1,682 / -21，24 个文件变更
**全量代码量**: +20,748 / -571，187 个文件变更
**类型分布**: feat ×3, fix ×3, docs ×1
**范围 (scope)**: managed-agent ×4, serve ×2, daemon ×1

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 代码量 | 文件数 | 创建时间(UTC) | 合并/关闭时间(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#12865](https://github.com/QwenLM/qwen-code/pull/12865) | 🟡 open | @doudouOUC | feat(managed-agent): Adopt durable local Runtime workers | +1574/-101 | 19 | 09-27 16:08 | - |
| [#12869](https://github.com/QwenLM/qwen-code/pull/12869) | 🟡 open | @doudouOUC | feat(managed-agent): Recover Workspace holders after trusted local reboot (W0e-3) | +1346/-52 | 39 | 09-27 16:55 | - |
| [#12894](https://github.com/QwenLM/qwen-code/pull/12894) | 🟡 open | @doudouOUC | feat(managed-agent): Add durable remote Shell result delivery | +12440/-287 | 67 | 09-28 04:58 | - |
| [#12918](https://github.com/QwenLM/qwen-code/pull/12918) | ✅ merged | @doudouOUC | fix(daemon): persist session approval mode across cold restore | +1682/-21 | 24 | 09-28 09:25 | 09-28 15:07 |
| [#12920](https://github.com/QwenLM/qwen-code/pull/12920) | 🟡 open | @doudouOUC | docs(managed-agent): Defer local engine delivery behind Hosted | +130/-61 | 4 | 09-28 09:26 | - |
| [#12923](https://github.com/QwenLM/qwen-code/pull/12923) | 🟡 open | @doudouOUC | fix(serve): upload session attachments in 512 KiB chunks | +3181/-33 | 28 | 09-28 09:53 | - |
| [#12950](https://github.com/QwenLM/qwen-code/pull/12950) | 🟡 open | @doudouOUC | fix(serve): Persist Hosted file path refusals | +395/-16 | 6 | 09-28 15:56 | - |

---

## PR 解决问题、实现方式与 feature 处理

| PR | 解决了什么问题 | 最终怎么实现（open/closed 只登记当前观察） | 对应 feature 文档 |
|---|---|---|---|
| [#12865](https://github.com/QwenLM/qwen-code/pull/12865) | 本地 worker 在 Broker 重启后缺可信身份记录，不能安全接管。 | 当前 open diff 增加显式 Linux durable 模式、目录隔离、进程身份登记及 ready/attest 后采用；默认路径不变。 | 已更新 Managed Agents 当前状态；完整观察见 [implementations/pr-12865.md](implementations/pr-12865.md)。 |
| [#12869](https://github.com/QwenLM/qwen-code/pull/12869) | 可信本机重启后旧 binding/Workspace holder 可能阻塞新代际。 | 当前 open 增量在 #12865 之上加入 reboot 证据、批量维护 reconcile 和有条件事务释放；未知执行不自动清理。 | 已更新 Managed Agents 当前状态；完整观察见 [implementations/pr-12869.md](implementations/pr-12869.md)。 |
| [#12894](https://github.com/QwenLM/qwen-code/pull/12894) | Hosted Shell 原始输出失联后可能丢失或无法证实完整交付。 | 当前 open diff 以 publication grant、Java 持久 admission/分段存储、Runtime 捕获与 Harness 原调用 receipt 串联交付；不等于产品端全链路已验收。 | 已更新 Managed Agents 与完整工具结果状态；完整观察见 [implementations/pr-12894.md](implementations/pr-12894.md)。 |
| [#12918](https://github.com/QwenLM/qwen-code/pull/12918) | daemon 会话内审批模式冷恢复时丢失，并可能被未变更 settings 覆盖。 | 最终合入 transcript `session_approval_mode` 记录/投影、safe/bare 限制下的恢复，以及文件派生 mode 与 live Session mode 分离收敛。 | 已更新 daemon/serve 模式；完整实现见 [implementations/pr-12918.md](implementations/pr-12918.md)。 |
| [#12920](https://github.com/QwenLM/qwen-code/pull/12920) | 本地 Managed engine 排期与 Hosted 首个闭环的依赖混淆。 | 当前 open 文档 diff 保留 M1/M3，后置 M2/M4–M6，并将未来本地宿主设计改为按需子进程；无 runtime 代码。 | 已更新 Managed Agents 设计状态；完整观察见 [implementations/pr-12920.md](implementations/pr-12920.md)。 |
| [#12923](https://github.com/QwenLM/qwen-code/pull/12923) | 单次附件 POST 会被约 1 MiB 代理 body 限额拒绝。 | 当前 open diff 增加 512 KiB 分块/完成/取消 API、offset 幂等及 SDK capability 探测；旧 daemon 仍用原路径。 | 已更新 daemon/serve 模式；完整观察见 [implementations/pr-12923.md](implementations/pr-12923.md)。 |
| [#12950](https://github.com/QwenLM/qwen-code/pull/12950) | Hosted 文件路径错误在多工具批次中缺有序持久回执，可能部分执行。 | 当前 open diff 在 dispatch 前验证全部 `file_path`，整批按序持久写入拒绝结果，失败则要求恢复，不启动 Broker 执行。 | 已更新 Managed Agents 当前状态；完整观察见 [implementations/pr-12950.md](implementations/pr-12950.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [Managed Agents 双链路方案](../../feature/managed-agents/README.md) | #12865/#12869/#12894/#12920/#12950(open) | 区分 durable/reboot、Shell publication、文件路径拒绝的 open 实现观察和本地 engine 的 docs-only 后置决定。 |
| [完整工具结果与持久产物](../../feature/managed-agents/managed-agent-tool-result-artifacts.zh-CN.md) | #12894(open) | 登记 O1/O2 当前候选实现，保留公共投影和部署验收缺口。 |
| [daemon/serve 模式](../../feature/daemon-serve-mode/README.md) | #12918(merged), #12923(open) | 区分审批模式已合入与附件分块未合入。 |

_按个人 PR 口径更新于 2026-09-29_
