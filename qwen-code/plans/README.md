# Historical Plan Archive

这个目录只保留历史设计、跨周 epic 和未落地/难以归属到单个合入 PR 的 agent plan 记录，不再作为每周 PR 说明的主入口。

## 当前口径

- 每周 PR 汇总入口在 [`../weekly-report/`](../weekly-report/)。
- 每个周目录的 `README.md` 记录逐 PR 的“做什么 / 最终实现方案”摘要。
- 已深读并整理的 PR，完整中文最终实现文档放在对应周目录的 `implementations/` 下。
- 最终实现说明以 merged diff、changed files、patch、测试/配置路径和关闭状态为准；PR body 与本目录历史 plan 只能作为意图线索。

## 当前结构

```
plans/
├── README.md
└── misc/        # 跨周 epic / issue 设计 / agent 子 plan（44 files）
```

## misc/

`misc/` 下的 44 个文件主要包括：

- issue / epic 级设计记录，例如 telemetry、daemon、atomic write 等阶段性方案。
- 未作为独立 PR 合入、或后续实现与原设计发生偏移的历史 plan。
- Claude Code session 的 agent 子 plan 和审计记录。

这些文件适合作为背景材料或决策脉络检索，不适合作为“最终实现方案”引用。需要描述某个 PR 的最终行为时，应优先查对应周报和 `implementations/pr-*.md`。

_更新于 2026-06-30_
