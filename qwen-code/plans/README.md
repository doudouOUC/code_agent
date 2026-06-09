# Implementation Plans

按周组织的 PR 实现计划。每个 plan 文件对应一个 QwenLM/qwen-code PR，末尾有 `## Final Implementation Status` 节记录最终实现状态。

## 目录结构

```
plans/
├── W16/          # 2026-04-13 ~ 2026-04-19 (8 plans)
├── W17/          # 2026-04-20 ~ 2026-04-26 (7 plans)
├── W18/          # 2026-04-27 ~ 2026-05-03 (5 plans)
├── W19/          # 2026-05-04 ~ 2026-05-10 (12 plans)
├── W20/          # 2026-05-11 ~ 2026-05-17 (25 plans)
├── W21/          # 2026-05-18 ~ 2026-05-24 (20 plans)
├── W22/          # 2026-05-25 ~ 2026-05-31 (24 plans)
├── W23/          # 2026-06-01 ~ 2026-06-07 (16 plans)
├── W24/          # 2026-06-08 ~ 2026-06-14 (3 plans)
├── misc/         # 跨周 epic / 未落地设计 / agent 子 plan (46 files)
└── README.md     # 本文件
```

**总计**: 166 个 plan 文件，覆盖 ~140 个 PR。

## 命名规范

`#<PR号>-<短标题>.md`，如 `#4096-atomic-write.md`。同一 PR 有多个 plan 时加 `-plan2`/`-plan3` 后缀。

## Plan 来源

- **Claude Code session plans**（54 个）：原始 `~/.claude/plans/` 中的详细实现方案，含设计决策、文件列表、commit 序列、测试计划。已对比 PR 最终代码追加 Final Status。
- **Codex session 提取**（83 个）：从 PR diff + body 逆向重建的精简摘要（15-30 行），覆盖没有 Claude Code plan 的 PR。
- **misc**（29 个）：agent 子 plan、跨周 epic 设计、未落地方案。

## 按周统计

| 周 | Plans | 覆盖 PR 范围 | 主题 |
|---|---|---|---|
| W16 | 8 | #3079-#3534 | CLI 启动优化、/batch skill、rewind 首发、Python SDK |
| W17 | 7 | #3318-#3534 | preconnect、rewind、SDK、权限修复、i18n |
| W18 | 5 | #3623-#3779 | auth 修复、monitor tool、telemetry OTLP |
| W19 | 12 | #3685-#3985 | PyPI 发布、reactive compression、monitor 修复、telemetry 敏感属性 |
| W20 | 25 | #3985-#4255 | telemetry 层级 span、atomic write、serve Wave 1-4、device flow |
| W21 | 20 | #4269-#4473 | acp-bridge 抽包、F1/F2/F3、MCP 池、protocol completion |
| W22 | 24 | #4366-#4646 | daemon 端点（recap/btw/shell/tasks）、rate limit、abort leak、MCP runtime |
| W23 | 16 | #4333-#4826 | atomic write rollout、compaction、subagent span、ACP 命令扩展 |
| W24 | 3 | #4812-#4862 | session branch、rate limiting、stress test |
| misc | 46 | — | daemon epic 设计、tracking issues、agent 子 plan |

_生成于 2026-06-09_
