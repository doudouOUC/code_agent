# qwen-code 文档索引

本目录按最终实现口径整理 [QwenLM/qwen-code](https://github.com/QwenLM/qwen-code) 的 PR 周报、feature 技术方案和描述准确性审查。历史 `plans/` 归档已删除；后续不再以 plan 作为 PR 最终实现方案来源。

## 当前口径

- 每周 PR 汇总入口在 [`weekly-report/`](weekly-report/README.md)。
- 每个周目录的 `README.md` 记录逐 PR 的“解决了什么问题 / 怎么做的”摘要。
- 已深读并整理的 PR，完整中文最终实现文档放在对应周目录的 `implementations/` 下。
- 跨 PR 的能力沉淀在 [`feature/`](feature/README.md)；每篇 feature 文档以 merged diff、changed files、patch、测试/配置路径和关闭状态为准。
- Agent 生成或更新文档时遵循 [`templates/`](templates/README.md) 中的结构契约和状态措辞。
- PR body 只作为目标线索；如果 body 与代码不一致，以最终合入代码和周报实现文档为准。

## 当前入口

| 入口 | 内容 | 使用场景 |
|---|---|---|
| [`weekly-report/`](weekly-report/README.md) | 按周整理的 PR 明细、逐 PR 问题与实现摘要、每周 `implementations/pr-*.md` 最终实现文档 | 查某个 PR 最终做了什么、怎么做的 |
| [`feature/`](feature/README.md) | 按 feature topic 汇总的技术方案和跨 PR 能力演进 | 查某个能力的整体架构、关键流程、涉及 PR |
| [`templates/`](templates/README.md) | Agent 周报、单 PR 实现文档的强模板及 Feature 增量更新检查清单 | 约束自动生成结构、状态措辞和审计口径 |
| [`description-accuracy.md`](description-accuracy.md) | PR 标题/body 与实际实现不一致的清单 | 修正 PR 描述、核对历史审查发现 |

## 当前结构

```text
qwen-code/
├── README.md
├── description-accuracy.md
├── feature/
├── templates/
└── weekly-report/
    ├── README.md
    └── 2026-xx-xx_2026-xx-xx/
        ├── README.md
        └── implementations/
            ├── README.md
            └── pr-xxxx.md
```

## 使用顺序

1. 查单个 PR：先看对应周目录的 `README.md`，再看同周 `implementations/pr-xxxx.md`。
2. 查一个能力：先看 `feature/README.md` 找专题，再进入对应 feature 文档。
3. 查描述是否准确：看 `description-accuracy.md`，必要时回到周报实现文档交叉验证。
4. 生成或审计文档：先看 `templates/README.md`，再按目标文档选择强模板或 Feature 检查清单。

_更新于 2026-08-22_
