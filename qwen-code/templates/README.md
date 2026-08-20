# Agent 文档输出模板

本目录定义定时 Agent 更新 `qwen-code/` 文档时必须遵守的结构契约。模板只约束输出结构和状态措辞，不替代事实核验；最终内容仍以 PR diff、changed files、patch、测试/配置路径、最新 `main` 代码和 PR 当前状态为准。

## 模板入口

| 模板 | 适用内容 | 约束强度 |
|---|---|---|
| [weekly-report.md](weekly-report.md) | 周目录 `README.md` 及配套 `implementations/README.md` | 强模板 |
| [pr-implementation.md](pr-implementation.md) | `implementations/pr-*.md` | 强模板 |
| [feature-update-checklist.md](feature-update-checklist.md) | `feature/` 下的专题文档增量更新 | 检查清单 |

## 事实与范围规则

1. 只处理任务窗口内 `createdAt` 命中的目标作者 PR；不能按更新时间、关闭时间或合入时间补收其他 PR。
2. 日更向当前周加入前一天新建的目标 PR，同时刷新当前周已收录 PR 的状态、规模和最终实现口径；刷新不能改变其按 `createdAt` 归属的周。
3. PR body 只作为目标线索，不能作为最终实现证据。
4. merged PR 按最终合入 diff 和最新 `main` 描述；open PR 只能描述当前 diff；closed 未合入 PR 只能作为历史方案观察。
5. 代码量、文件数、状态和时间必须来自同一次数据快照，表格与正文保持一致。
6. 不确定的事实必须标记为“待确认”，不能用推测补齐模板。
7. 没有命中 PR 时不创建空周报、空实现文档或空 Feature 章节。
8. 输出不得保留 `{{placeholder}}`；不适用的可选内容应删除，而不是填“无”来凑章节。

## 使用流程

1. 读取对应模板及现有目标文档。
2. 收集 PR 元数据、diff、changed files、测试和最新 `main` 证据。
3. 按状态选择准确措辞，生成或增量更新文档。
4. 检查目标作者范围、统计一致性、Markdown 链接、空章节和状态漂移。
5. 查看最终 diff，确认没有模板占位符和无关作者内容。
