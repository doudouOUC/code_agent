# 周报 README 强模板

目标文件：`qwen-code/weekly-report/{{week_start}}_{{week_end}}/README.md`

```markdown
# qwen-code PRs · {{week_start}} ~ {{week_end}} (W{{week_number}} {{report_state}})

> 本文件已整理 {{week_start}} 至 {{week_end}}（Asia/Shanghai）创建的 @{{author}} 个人 PR。口径为 `QwenLM/qwen-code` 中 author 为 @{{author}} 且 createdAt 落在对应北京时间日/周窗口内的 PR；只在窗口内更新、关闭或合入，但创建时间不在窗口内的 PR 不计入新增统计。open PR 只记录当前 diff 方案，不能视为 `main` 已落地能力。

**主题**: {{topics}}

**PR 统计**: {{total}} PRs - {{merged}} merged / {{open}} open / {{closed}} closed
**当前已合并 PR 代码量**: +{{merged_additions}} / -{{merged_deletions}}，{{merged_files}} 个文件变更
**全量代码量**: +{{all_additions}} / -{{all_deletions}}，{{all_files}} 个文件变更
**类型分布**: {{type_distribution}}
**范围 (scope)**: {{scope_distribution}}

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 代码量 | 文件数 | 创建时间(UTC) | 合并/关闭时间(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#{{number}}]({{url}}) | {{status_icon}} {{status}} | @{{author}} | {{title}} | +{{additions}}/-{{deletions}} | {{files}} | {{created_at}} | {{finished_at_or_dash}} |

---

## PR 解决问题、实现方式与 feature 处理

| PR | 解决了什么问题 | 最终怎么实现（open/closed 只登记当前观察） | 对应 feature 文档 |
|---|---|---|---|
| [#{{number}}]({{url}}) | {{problem}} | {{implementation}} | {{feature_action}} 完整{{implementation_label}}见 [implementations/pr-{{number}}.md](implementations/pr-{{number}}.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [{{feature_name}}]({{relative_feature_link}}) | {{pr_refs_with_status}} | {{feature_update}} |

_按个人 PR 口径更新于 {{updated_date}}_
```

## 配套 implementations 索引

同周 `implementations/README.md` 使用以下结构：

```markdown
# {{week_start}} ~ {{week_end}} PR 实现文档

| PR | 状态 | 标题 | 实现文档 |
|---|---|---|---|
| [#{{number}}]({{url}}) | {{status_icon}} {{status}} | {{title}} | [pr-{{number}}.md](pr-{{number}}.md) |

_按个人 PR 口径更新于 {{updated_date}}_
```

## 更新检查

- PR 统计等于明细表行数。
- merged/open/closed 之和等于 PR 总数。
- 代码量和文件数与当前 PR 快照一致。
- 每个 PR 都有实现文档和有效相对链接。
- Feature 覆盖表中的状态与 PR 明细一致。
- 日更新增前一天创建的目标 PR，并刷新当前周已收录 PR 的状态、规模和实现口径；不得补收创建时间属于其他周的 PR。
- 周更重新核对完整周窗口，并以 `createdAt` 决定周归属。
