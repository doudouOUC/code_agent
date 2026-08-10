# qwen-code PRs · 2026-08-10 ~ 2026-08-16 (W33 周内累计)

> 本文件已整理 2026-08-10（Asia/Shanghai）创建的 @doudouOUC 个人 PR。口径为 `QwenLM/qwen-code` 中 author 为 @doudouOUC 且 createdAt 落在对应北京时间日/周窗口内的 PR；只在窗口内更新、关闭或合入，但创建时间不在窗口内的 PR 不计入新增统计。open PR 只记录当前 diff 方案，不能视为 `main` 已落地能力。

**主题**: WebUI same-id attachment stale work fencing、approved external built-in text writes、OpenAI API log retention、transactional WebUI cross-session switching

**PR 统计**: 5 PRs - 3 merged / 1 open / 1 closed
**当前已合并 PR 代码量**: +2,934 / -159，43 个文件变更
**全量代码量**: +13,909 / -1,184，80 个文件变更
**类型分布**: fix ×4, feat ×1
**范围 (scope)**: webui ×3, serve ×1, cli ×1

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 变更 | 文件 | 创建(UTC) | 合并/关闭(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#8824](https://github.com/QwenLM/qwen-code/pull/8824) | ❌ closed draft | @doudouOUC | fix(webui): Preserve active sessions during restore | +5765/-566 | 16 | 08-09 18:00 | 08-10 05:31 |
| [#8833](https://github.com/QwenLM/qwen-code/pull/8833) | ✅ merged | @doudouOUC | fix(webui): Fence stale session work by attachment identity | +724/-95 | 4 | 08-10 05:30 | 08-10 07:55 |
| [#8852](https://github.com/QwenLM/qwen-code/pull/8852) | ✅ merged | @doudouOUC | fix(serve): Allow approved external built-in text writes | +1495/-56 | 31 | 08-10 08:25 | 08-10 12:20 |
| [#8862](https://github.com/QwenLM/qwen-code/pull/8862) | ✅ merged | @doudouOUC | feat(cli): add background cleanup for OpenAI API logs | +715/-8 | 8 | 08-10 09:28 | 08-10 12:20 |
| [#8882](https://github.com/QwenLM/qwen-code/pull/8882) | 🟡 open | @doudouOUC | fix(webui): Make cross-session switching transactional | +5210/-459 | 21 | 08-10 13:54 | — |

---

## PR 解决问题、实现方式与 feature 处理

| PR | 解决了什么问题 | 最终怎么实现（open/closed 只登记当前观察） | 对应 feature 文档 |
|---|---|---|---|
| [#8824](https://github.com/QwenLM/qwen-code/pull/8824) | 大型 WebUI load/resume 在目标 restore 完成前就 detach 当前 session、停止 SSE 并清空 transcript；目标失败或被替换时，原本健康的 source 会话也不可用了。 | 该 draft 曾把普通 load/resume/reload/full-resync/live-journal repair 都做成离屏 staging + generation/deadline commit，并在 WebShell 分离 desired/committed owner。最终未合入，已被拆成 #8833 的可合并 same-id attachment fencing，以及 #8882 的 cross-session transactional switching 当前 open diff。 | 不登记为已落地 feature；作为 #8833/#8882 的前身记录。完整观察见 [implementations/pr-8824.md](implementations/pr-8824.md)。 |
| [#8833](https://github.com/QwenLM/qwen-code/pull/8833) | WebUI 只用 `sessionId` 判断异步工作归属；同一个 persisted session 被 reload/reattach 后，旧 attachment 的 metadata、SSE、heartbeat 410、`session_closed` 或 cleanup 可能改坏新 attachment。 | 最终实现把 session-owned async continuation 改为按精确 attachment 对象/`clientId` fence，而不是只看 `sessionId`。Provider runner、actions metadata refresh、SSE terminal、heartbeat failure、transcript batch 和 reload cleanup 都在写共享状态或 detach 前确认仍拥有当前 attachment；same-session reload handoff 精确保留并只回收目标 attachment 一次。 | 已更新 WebUI/transport 口径。完整实现见 [implementations/pr-8833.md](implementations/pr-8833.md)。 |
| [#8852](https://github.com/QwenLM/qwen-code/pull/8852) | same-host `qwen serve` 中，用户已经批准内置 `write_file`/edit/notebook/sed 对 workspace 外文本的写入后，最终 ACP `writeTextFile` 仍会被 WorkspaceFileSystem 以 `path_outside_workspace` 拒绝，导致工具失败并诱导模型用 shell 重试。 | 最终实现为 core built-in write 请求注入严格版本化 `qwen-code/tool-write-origin` 内部来源元数据；只有 daemon-owned same-host adapter 且元数据合法时，workspace 外写入才会走受控 host writer。host writer 保留 trust/generation guard、canonical path lock、普通文件/symlink 校验、5MiB 编码上限、mode 保留或新建 `0600`、原子替换和单次审计；workspace 内、HTTP、通用 ACP、伪造/缺失元数据继续走原 WorkspaceFileSystem 边界并 fail closed。 | 已更新 daemon 文件系统边界与 ACP bridge 权限口径。完整实现见 [implementations/pr-8852.md](implementations/pr-8852.md)。 |
| [#8862](https://github.com/QwenLM/qwen-code/pull/8862) | `model.enableOpenAILogging` 会把完整 OpenAI-compatible 请求/响应写成独立 JSON 文件，长期没有轮转；重度使用会累积大量磁盘、inode 和敏感 prompt/response 数据。 | 最终实现把 OpenAI API log retention 接入 interactive housekeeping：新增 `model.openAILogRetentionDays` 默认 7 天，`0` 表示约 1 小时最短保留；每个解析后的 log dir 每天最多清理一次，只删除 `OpenAILogger` 真实 timestamp+id 文件名，按文件名 UTC 日期快速跳过大多数文件，并用 bounded concurrency 流式删除。默认 workspace log dir 用 merged retention；自定义目录只接受 user/system 级单一策略，workspace-scoped 歧义时跳过。 | 已更新 telemetry/auth-provider 的 OpenAI 日志保留口径。完整实现见 [implementations/pr-8862.md](implementations/pr-8862.md)。 |
| [#8882](https://github.com/QwenLM/qwen-code/pull/8882) | 跨 session load/resume 选择另一个会话时，WebUI 仍可能在目标 restore 成功前先暴露 target/loading 并停止 source；#8691 只解决 daemon restore timeout lifecycle，#8833 只解决 stale attachment，缺少客户端可见状态的事务边界。 | 当前 open diff 让现代 WebUI cross-session switching 事务化：source 继续作为可见 owner，target restore 在隔离 staging store 中有界 replay；一个普通 restore RPC in flight，相同 target coalesce，只保留 latest queued target；commit 前按 attachment/environment/deadline 做最终仲裁，同步安装 target transcript、session/client/workspace refs、connection state、notices 与 side channels，再启动 prepared runner。legacy daemon 缺 `client_identity` 时保留 detach-first 兼容路径，未知 capability 或 malformed modern target fail closed。 | 已在 WebUI/transport 与 roadmap 登记为 open diff，不能视为已落地。完整观察见 [implementations/pr-8882.md](implementations/pr-8882.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [daemon-serve-mode/](../../feature/daemon-serve-mode/) | #8824(closed draft) / #8833 / #8852 / #8882(open) | 补 WebUI same-id attachment fencing、approved external built-in text write host route，以及 transactional WebUI cross-session switching open diff 与 #8824 superseded 关系。 |
| [daemon-serve-mode/05-workspace-files-and-fs-boundary.md](../../feature/daemon-serve-mode/05-workspace-files-and-fs-boundary.md) / [07-acp-bridge-and-permission.md](../../feature/daemon-serve-mode/07-acp-bridge-and-permission.md) | #8852 | 补 `tool-write-origin` provenance、daemon-owned same-host host writer、canonical path/symlink/generation/audit 边界，以及 HTTP/通用 ACP 不放宽的兼容性。 |
| [daemon-serve-mode/11-webui-and-transport.md](../../feature/daemon-serve-mode/11-webui-and-transport.md) | #8824 / #8833 / #8882(open) | 补 attachment identity owner guard、source-visible transactional target staging、WebShell desired/committed target、write gate 与 scheduled-run catch-up timer 语义。 |
| [telemetry-observability/](../../feature/telemetry-observability/) / [auth-providers.md](../../feature/auth-providers.md) | #8862 | 补 OpenAI API log retention 的默认保留期、marker 调度、自定义目录策略和只删除 writer-owned 文件名的隐私/磁盘控制口径。 |

_按个人 PR 口径更新于 2026-08-11_
