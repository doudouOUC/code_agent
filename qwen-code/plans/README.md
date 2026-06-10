# Implementation Plans

PR 实现计划已按周移入 `weekly-report/<周>/plans/` 目录，与对应周的 README.md 和 review.md 同级。

## 当前结构

```
weekly-report/
├── 2026-04-13_2026-04-19/plans/   # W16 (8 plans)
├── 2026-04-20_2026-04-26/plans/   # W17 (7 plans)
├── 2026-04-27_2026-05-03/plans/   # W18 (5 plans)
├── 2026-05-04_2026-05-10/plans/   # W19 (12 plans)
├── 2026-05-11_2026-05-17/plans/   # W20 (25 plans)
├── 2026-05-18_2026-05-24/plans/   # W21 (21 plans)
├── 2026-05-25_2026-05-31/plans/   # W22 (24 plans)
├── 2026-06-01_2026-06-07/plans/   # W23 (17 plans)
├── 2026-06-08_2026-06-14/plans/   # W24 (6 plans)
plans/
└── misc/                          # 跨周 epic / issue 设计 / agent 子 plan (44 files)
```

**总计**: 169 个 plan 文件，覆盖 ~145 个 PR。

## 命名规范

`#<PR号>-<短标题>.md`，如 `#4096-atomic-write.md`。同一 PR 有多个 plan 时加 `-plan2`/`-plan3` 后缀。

## misc/

44 个无法分配到具体周的文件：
- **15 个 issue 设计文档**：epic 计划（#3731/#4175/#4514）、tracking issues、未落地设计
- **29 个 agent 子 plan**：Claude Code session 的子代理临时 plan

_更新于 2026-06-09_
