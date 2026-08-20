# 单 PR 实现文档强模板

目标文件：`qwen-code/weekly-report/{{week_start}}_{{week_end}}/implementations/pr-{{number}}.md`

标题和措辞必须按状态选择：

| 状态 | 标题措辞 | 方案章节 | 能力口径 |
|---|---|---|---|
| merged | `最终实现` | `最终实现方案` | 可以描述为最新 `main` 已落地能力，但仍需核对后续演进 |
| open | `当前实现观察` | `当前实现方案` | 只能描述当前 diff，不能作为 `main` 行为承诺 |
| closed 未合入 | `关闭方案观察` | `关闭前方案` | 只能作为历史方案，不得写成已落地能力 |

```markdown
# PR #{{number}} {{title_state_label}}：{{short_topic}}

> PR: [{{pr_title}}]({{url}})
> 状态：{{status_sentence}}
> 规模：+{{additions}} / -{{deletions}}，{{files}} 个文件

## 解决了什么问题

{{problem_and_user_impact}}

## {{implementation_heading}}

{{implementation_based_on_diff_and_main}}

## 关键代码路径

- `{{path}}`：{{responsibility_and_change}}

## 验证方式

{{tests_build_lint_and_independent_verification}}

## feature 文档处理

{{feature_files_updated_and_status_wording}}

## 边界与风险

- {{not_covered_or_remaining_risk}}
```

## 写作检查

- 问题部分说明错误行为及用户或系统影响，而不是复述 PR 标题。
- 实现部分包含控制流、数据流或状态边界，不能只列文件名。
- 关键路径只列真正承担行为的文件，并写清各自职责。
- 验证部分区分“PR 声明通过”和“本次独立执行通过”。
- open/closed 文档显式声明不能作为 `main` 能力承诺。
- Feature 处理说明具体更新了哪些专题，以及为何更新或不更新。
