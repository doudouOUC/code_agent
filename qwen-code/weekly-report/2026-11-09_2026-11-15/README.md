# qwen-code PRs · 2026-11-09 ~ 2026-11-15 (W46 日更至 11-09)

> 本文件已整理北京时间 2026-11-09 00:00:00 至 23:59:59 创建的 @doudouOUC 个人 PR，UTC 窗口为 `[2026-11-08T16:00:00Z, 2026-11-09T16:00:00Z)`。按 `QwenLM/qwen-code` 的 author 与 createdAt 独立分页核验，命中 1 个 PR；只在窗口内更新、关闭或合入而创建时间不在窗口内的 PR 不计入新增统计。快照为北京时间 2026-11-10 凌晨，主干 `e5eb6a177560`；W45 待发布周更同步刷新，但其条目不移动到 W46。open PR 只能描述当前 diff，不能视为 main 已落地能力。

**主题**: 独立 Managed Web 网关接受非空短浏览器 token，保留签名密钥强度和凭据隔离

**PR 统计**: 1 PRs - 1 merged / 0 open / 0 closed
**当前已合并 PR 代码量**: +37 / -32，5 个文件变更
**全量代码量**: +37 / -32，5 个文件变更
**类型分布**: fix ×1
**范围 (scope)**: managed ×1

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 代码量 | 文件数 | 创建时间(UTC) | 合并/关闭时间(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#16723](https://github.com/QwenLM/qwen-code/pull/16723) | merged | @doudouOUC | fix(managed): Allow short browser tokens in Web gateway | +37/-32 | 5 | 2026-11-09 08:15:32 | 2026-11-09 08:35:05 |

---

## PR 解决问题、实现方式与 feature 处理

| PR | 解决了什么问题 | 最终怎么实现（open/closed 只登记当前观察） | 对应 feature 文档 |
|---|---|---|---|
| [#16723](https://github.com/QwenLM/qwen-code/pull/16723) | 独立 Managed Web 网关把浏览器 bearer token 与服务签名密钥套用同一 32 字节下限，导致短而非空的独立 token 无法启动。 | 已合入：只移除浏览器 token 长度检查；沿原解析拒绝空白，签名密钥仍至少 32 个 UTF-8 字节，并拒绝浏览器 token 等于原始或 trim 后的签名密钥；CLI 帮助和 Kubernetes 双语说明对齐。 | 更新 Feature 总览、Managed Agents、客户端、恢复与运维；完整最终实现见 [implementations/pr-16723.md](implementations/pr-16723.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [Feature 总览](../../feature/README.md) | #16723(merged) | 标记非空短 token 已合入及凭据边界。 |
| [Managed Agents](../../feature/managed-agents/README.md) | #16723(merged) | 同步 Managed Web 主干状态。 |
| [客户端](../../feature/managed-agents/managed-agent-client-surfaces.md) | #16723(merged) | 说明启动解析、认证和签名不变。 |
| [恢复与运维](../../feature/managed-agents/managed-agent-recovery-operations.md) | #16723(merged) | 区分浏览器 token 与服务签名密钥，不把代码放宽当作部署验收。 |

_按个人 PR 口径更新于 2026-11-10；本次核对 diff、changed files、主干和测试定义，未运行产品测试、CI、浏览器或 Kubernetes 验收。_
