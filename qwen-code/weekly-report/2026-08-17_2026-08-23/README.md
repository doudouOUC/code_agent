# qwen-code PRs · 2026-08-17 ~ 2026-08-23 (W34 周内累计)

> 本文件已整理 2026-08-17 至 2026-08-23（Asia/Shanghai）创建的 @doudouOUC 个人 PR。口径为 `QwenLM/qwen-code` 中 author 为 @doudouOUC 且 createdAt 落在对应北京时间日/周窗口内的 PR；只在窗口内更新、关闭或合入，但创建时间不在窗口内的 PR 不计入新增统计。open PR 只记录当前 diff 方案，不能视为 `main` 已落地能力。

**主题**: standalone conversation source/identity/admission primitives、Conversations runtime owner/discovery transient I/O retryability

**PR 统计**: 2 PRs - 0 merged / 2 open / 0 closed
**当前已合并 PR 代码量**: +0 / -0，0 个文件变更
**全量代码量**: +3,489 / -382，29 个文件变更
**类型分布**: feat ×1, fix ×1
**范围 (scope)**: serve/conversations ×2, core/session metadata ×1, docs/design ×1

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 代码量 | 文件数 | 创建时间(UTC) | 合并/关闭时间(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#9341](https://github.com/QwenLM/qwen-code/pull/9341) | 🟡 open | @doudouOUC | feat(cli): Add standalone conversation isolation primitives | +3341/-375 | 26 | 08-17 07:47 | — |
| [#9362](https://github.com/QwenLM/qwen-code/pull/9362) | 🟡 open | @doudouOUC | fix(cli): Keep transient runtime record I/O retryable | +148/-7 | 3 | 08-17 15:14 | — |

---

## PR 解决问题、实现方式与 feature 处理

| PR | 解决了什么问题 | 最终怎么实现（open/closed 只登记当前观察） | 对应 feature 文档 |
|---|---|---|---|
| [#9341](https://github.com/QwenLM/qwen-code/pull/9341) | standalone session lifecycle 落地前，需要可信地区分 explicit standalone、兼容 legacy projectless 与 Live transcript；旧的空 metadata / 容忍 JSONL 读取 / 非权威大小写查找可能把损坏 Live 或 child transcript 提升为 standalone，并绑定错误 private directory。 | 当前 open diff 交付 PR2A primitives：新增 standalone source 常量与分类器、只在 active/archive location 稳定且 creation metadata 完整时分类；generic REST/ACP creation 拒绝保留 source；load/resume 先做大小写不敏感持久化 ID 权威解析，case-only duplicate 转 typed conflict；`readCreationMetadataIfReadable()` 用完整性读取区分 clean legacy 与损坏头部；新增 Conversations root/private child identity 校验和 prepare/inspect/ensure API。 | 已在 daemon session lifecycle、capabilities/protocol 与 daemon 总览登记为 open diff，不新增 public standalone route、capability、SDK 或 UI。完整观察见 [implementations/pr-9341.md](implementations/pr-9341.md)。 |
| [#9362](https://github.com/QwenLM/qwen-code/pull/9362) | #9181 的 owner/discovery 安全读取把所有 open/read 失败都当作持久化损坏；一次 `EMFILE` 或 `EIO` 会在 daemon 生命周期内锁死 `conversation_runtime_ownership_compromised`，必须重启才恢复。 | 当前 open diff 只把瞬时 I/O 与终态损坏分开：owner record 和 Live discovery 读取中，`ELOOP`、identity/permission/schema/JSON 损坏继续映射为 terminal compromised；非 `ELOOP` 的 open/readFile 错误向外抛出，由 acquisition 映射为 retryable `conversation_runtime_unavailable`，后续重试可重新 reclaim。 | 已在 daemon session lifecycle 中登记为 #9181 merged 后续的 open diff，并在 capabilities/protocol 口径说明不改变公开 API。完整观察见 [implementations/pr-9362.md](implementations/pr-9362.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [daemon-serve-mode/](../../feature/daemon-serve-mode/) | #9341(open) / #9362(open) | 补 standalone PR2A source/classification、case-insensitive persisted ID conflict、Conversations private-directory identity primitives，以及 owner/discovery transient I/O retryability。 |
| [daemon-serve-mode/03-session-lifecycle.md](../../feature/daemon-serve-mode/03-session-lifecycle.md) | #9341(open) / #9362(open) | 新增 standalone conversation isolation primitives 与 #9181 runtime record I/O retry follow-up 的 open diff 口径。 |
| [daemon-serve-mode/04-capabilities-and-protocol.md](../../feature/daemon-serve-mode/04-capabilities-and-protocol.md) | #9341(open) / #9362(open) | 登记 #9341/#9362 均不发布 standalone capability、route、SDK 或 UI；#9341 仅收紧内部 source/admission，#9362 仅调整 retryable error classification。 |

_按个人 PR 口径更新于 2026-08-18_
