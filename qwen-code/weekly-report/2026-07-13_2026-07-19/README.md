# qwen-code PRs · 2026-07-13 ~ 2026-07-19 (W29 周内累计)

> 本文件已整理 2026-07-13（Asia/Shanghai）的 @doudouOUC 个人 PR。口径为 `QwenLM/qwen-code` 中 author 为 @doudouOUC 且 createdAt 落在对应北京时间日窗口内的 PR；只在窗口内更新、关闭或合入，但创建时间不在窗口内的 PR 不计入新增统计。

**主题**: multi-workspace legacy session mutation owner routing、multi-workspace rewind/shell owner routing、Extension Management V2 事务化 store、extension SDK/TUI/Web Shell surface、session continue/language/artifact owner routing

**PR 统计**: 4 PRs - 2 merged / 2 open / 0 closed
**当前已合并 PR 代码量**: +1,788 / -152，31 个文件变更
**全量代码量**: +19,174 / -2,011，121 个文件变更
**类型分布**: feat ×2, fix ×2
**范围 (scope)**: serve ×4

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 变更 | 文件 | 创建(UTC) | 合并/关闭(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#6798](https://github.com/QwenLM/qwen-code/pull/6798) | ✅ merged | @doudouOUC | fix(serve): route session actions to the owning workspace | +578/-82 | 4 | 07-13 04:30 | 07-13 08:56 |
| [#6825](https://github.com/QwenLM/qwen-code/pull/6825) | 🟡 open | @doudouOUC | feat(serve): add extension management v2 | +17058/-1843 | 86 | 07-13 11:04 | — |
| [#6826](https://github.com/QwenLM/qwen-code/pull/6826) | ✅ merged | @doudouOUC | feat(serve): support multi-workspace rewind and shell | +1210/-70 | 27 | 07-13 11:48 | 07-13 15:33 |
| [#6833](https://github.com/QwenLM/qwen-code/pull/6833) | 🟡 open | @doudouOUC | fix(serve): Route session continue, language, and artifacts by owner | +328/-16 | 4 | 07-13 15:24 | — |

---

## PR 解决问题、实现方式与 feature 处理

| PR | 解决了什么问题 | 最终怎么实现（open 只登记当前观察） | 对应 feature 文档 |
|---|---|---|---|
| [#6798](https://github.com/QwenLM/qwen-code/pull/6798) | multi-workspace daemon 中，metadata、recap、BTW、mid-turn message、task cancel、goal clear 这些 legacy session routes 已能解析 secondary live session，却仍被 primary-only guard 拦截或调用 primary bridge，导致可信 secondary session 的常用操作返回 `non_primary_session_route_not_supported`。 | 把 6 条既有 route 从 `withMutableSession` 改为 `withOwnerMutableSession`，复用 live owner resolver 选中 owning runtime，再调用 `runtime.bridge` 上的原方法；URL、payload、鉴权、client id、archive lease、错误映射和响应 shape 都保持不变。测试用 primary/secondary fake bridge sentinel 断言 secondary-only dispatch、primary 行为、unauthenticated 401、invalid input 与 untrusted 403。 | 已更新 [daemon-serve-mode/README.md](../../feature/daemon-serve-mode/README.md) 与 [03-session-lifecycle.md](../../feature/daemon-serve-mode/03-session-lifecycle.md)，补 legacy session action owner-routing。完整实现见 [implementations/pr-6798.md](implementations/pr-6798.md)。 |
| [#6825](https://github.com/QwenLM/qwen-code/pull/6825) | 旧 extension 管理把安装 artifact 与 workspace 启用状态混在 primary `/workspace/extensions` 兼容面里，多 workspace daemon 下并发 mutation 会竞争同一个 user-level artifact 目录，runtime refresh 失败也可能被 CLI/TUI 吞掉；敏感 settings 还需要参与 artifact commit，不能出现新 artifact 配旧 secret。 | 当前 open diff 新增 `extension_management_v2` 能力。`ExtensionStore` 作为唯一 writer 管理 user-level artifact、activation policy、generation、journal/recovery 和 legacy projection；daemon controller 以最多 2 个 preparation task + 1 条 durable commit lane 串行写 artifact/state，commit 后再 reconcile runtime，warning 通过 operation/legacy CLI/TUI 暴露。V2 全局 `/extensions/*` 管 install/check/update/uninstall/default activation，workspace `/workspaces/:workspace/extensions/*` 管 projection、override 和 refresh；SDK、TUI、Web Shell 补 catalog/mutation/polling/activation surface。敏感 settings 以 revisioned bundle selector 写入 staged artifact，commit 后激活完整 bundle，取消/替换负责清理未选中或旧 bundle。 | 已更新 [daemon-serve-mode/README.md](../../feature/daemon-serve-mode/README.md)、[04-capabilities-and-protocol.md](../../feature/daemon-serve-mode/04-capabilities-and-protocol.md)、[08-extension-endpoints.md](../../feature/daemon-serve-mode/08-extension-endpoints.md)、[10-client-adapters-and-sdk.md](../../feature/daemon-serve-mode/10-client-adapters-and-sdk.md) 与 [11-webui-and-transport.md](../../feature/daemon-serve-mode/11-webui-and-transport.md)，把 #6638 观察口径推进到 #6825 当前实现。完整实现见 [implementations/pr-6825.md](implementations/pr-6825.md)。 |
| [#6826](https://github.com/QwenLM/qwen-code/pull/6826) | `GET /session/:id/rewind/snapshots`、`POST /session/:id/rewind` 和 `POST /session/:id/shell` 仍绑定 primary bridge；secondary live session 会读错 snapshot、rewind/shell 失败，或如果经 ACP transport 绕路则可能丢掉 strict REST mutation 鉴权。 | 三条 singular route 改为 owner-aware：rewind snapshot 用 `withOwnerReadSession`，rewind/shell 用 `withOwnerMutableSession`，并在日志里带 workspace id/cwd。新增条件能力 `multi_workspace_session_rewind` 与 `multi_workspace_session_shell`；`rewindFiles` 严格校验为可选 boolean。TS SDK 的 rewind API 即使配置 ACP/WS/HTTP transport 也强制走 authenticated REST，shell 保持既有 transport。telemetry 增加 session owner resolver，让 legacy session route 的 workspace hash 能按 owner 归因。 | 已更新 [daemon-serve-mode/README.md](../../feature/daemon-serve-mode/README.md)、[03-session-lifecycle.md](../../feature/daemon-serve-mode/03-session-lifecycle.md)、[04-capabilities-and-protocol.md](../../feature/daemon-serve-mode/04-capabilities-and-protocol.md)、[08-extension-endpoints.md](../../feature/daemon-serve-mode/08-extension-endpoints.md)、[10-client-adapters-and-sdk.md](../../feature/daemon-serve-mode/10-client-adapters-and-sdk.md) 与 [conversation-rewind.md](../../feature/conversation-rewind.md)。完整实现见 [implementations/pr-6826.md](implementations/pr-6826.md)。 |
| [#6833](https://github.com/QwenLM/qwen-code/pull/6833) | #6798/#6826 后仍有 continue、language、artifact add/delete 4 条 legacy REST mutation 使用 primary-only guard，可信 secondary session 无法继续中断 turn、切换输出语言或管理 artifact。 | 当前 open diff 按同一 owner-routing 模式，把 `/session/:id/continue`、`/language`、`/artifacts`、`/artifacts/:artifactId` 改为 `withOwnerMutableSession` 并调用 owning `runtime.bridge`。保留 continue/artifact strict auth、language 的既有非 strict auth、client id 透传、prompt id 生成、artifact live-session 要求和错误映射；协议文档标注这些 route 已 owner-routed。 | 已更新 [daemon-serve-mode/README.md](../../feature/daemon-serve-mode/README.md)、[03-session-lifecycle.md](../../feature/daemon-serve-mode/03-session-lifecycle.md) 与 [08-extension-endpoints.md](../../feature/daemon-serve-mode/08-extension-endpoints.md)。完整实现见 [implementations/pr-6833.md](implementations/pr-6833.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [daemon-serve-mode/README.md](../../feature/daemon-serve-mode/README.md) | #6798 / #6825 / #6826 / #6833 | 补 multi-workspace legacy session action、rewind/shell、continue/language/artifact owner-routing，并把 extension management v2 从 #6638 观察版更新为 #6825 当前事务实现。 |
| [daemon-serve-mode/03-session-lifecycle.md](../../feature/daemon-serve-mode/03-session-lifecycle.md) | #6798 / #6826 / #6833 | 补 owner-routed legacy session mutations、rewind/shell route、continue/language/artifact route 的 session lifecycle 边界。 |
| [daemon-serve-mode/04-capabilities-and-protocol.md](../../feature/daemon-serve-mode/04-capabilities-and-protocol.md) | #6825 / #6826 | 登记 `multi_workspace_session_rewind`、`multi_workspace_session_shell` 与 #6825 当前 `extension_management_v2` operation/SDK surface。 |
| [daemon-serve-mode/08-extension-endpoints.md](../../feature/daemon-serve-mode/08-extension-endpoints.md) | #6825 / #6826 / #6833 | 更新 extension management v2 的 route/transaction/warning/settings 语义，补 rewind/shell owner routing 和 continue/language/artifact owner routing。 |
| [daemon-serve-mode/10-client-adapters-and-sdk.md](../../feature/daemon-serve-mode/10-client-adapters-and-sdk.md) | #6825 / #6826 | 补 SDK rewind 强制 REST、extension V2 SDK helpers、operation polling 和 post-commit warning 处理。 |
| [daemon-serve-mode/11-webui-and-transport.md](../../feature/daemon-serve-mode/11-webui-and-transport.md) | #6825 | 补 Web Shell/extension TUI 对 V2 operation、warnings、catalog/projection 的处理边界。 |
| [conversation-rewind.md](../../feature/conversation-rewind.md) | #6826 | 补 daemon multi-workspace rewind route 按 live owner runtime 分发，`rewindFiles` 校验和 SDK REST-only 调用。 |

_周内累计按个人 PR 口径更新于 2026-07-14_
