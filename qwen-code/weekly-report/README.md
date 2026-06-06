# qwen-code PR 记录

我（[@doudouOUC](https://github.com/doudouOUC)）在 [QwenLM/qwen-code](https://github.com/QwenLM/qwen-code) 提交的 PR，按周整理。每个周目录下的 `README.md` 含该周完整明细（类型 / 代码量 / 文件数 / 链接）。

**时间范围**: 2026-04-06 ~ 2026-06-07（持续更新）  
**总计**: 153+ PRs（W15–W23，含 W22 漏收补录 4 个）  
**代码量**: +361,180 / -61,411，2,721 个文件变更 _(W15–W22；W23 见对应周目录)_

## 按周

| 周 | PRs | merged/open/closed | 代码量 | 主题 |
|---|---|---|---|---|
| [2026-04-06 ~ 2026-04-12](2026-04-06_2026-04-12/) (W15) | 6 | 4/1/1 | +3,254/-651 | CLI 启动优化起步 + skills/settings |
| [2026-04-13 ~ 2026-04-19](2026-04-13_2026-04-19/) (W16) | 8 | 8/0/0 | +5,369/-416 | CLI 性能（preconnect/profiler/early-input）、/doctor、rewind 功能首发 |
| [2026-04-20 ~ 2026-04-26](2026-04-20_2026-04-26/) (W17) | 11 | 9/0/2 | +14,683/-209 | 权限修复、Python SDK 落地、auth 修复、rewind E2E |
| [2026-04-27 ~ 2026-05-03](2026-04-27_2026-05-03/) (W18) | 11 | 10/0/1 | +14,853/-698 | monitor 工具 / Monitor 权限、background agent、telemetry OTLP 起步、sdk-python 发布 CI |
| [2026-05-04 ~ 2026-05-10](2026-05-04_2026-05-10/) (W19) | 14 | 13/0/1 | +10,277/-1,242 | sdk-python 发布工具链、telemetry trace 关联、reactive compression |
| [2026-05-11 ~ 2026-05-17](2026-05-11_2026-05-17/) (W20) | 29 | 29/0/0 | +39,561/-2,486 | telemetry 层级 span、atomicWrite、rewind 文件恢复、/stuck，daemon/serve Wave 1–4 大爆发 |
| [2026-05-18 ~ 2026-05-24](2026-05-18_2026-05-24/) (W21) | 43 | 33/6/4 | +120,272/-20,559 | serve 路由密集开发、acp-bridge 大重构、telemetry Phase 1.5–4、原子写、F1/F2/F3 |
| [2026-05-25 ~ 2026-05-31](2026-05-25_2026-05-31/) (W22) | 22+4 | 13/6/3 | +152,911/-35,150 | daemon 新端点（recap/btw/tasks/shell）、serve T2.x、daemon prompt 链路追踪、集成合并；+4 漏收补录 |
| [2026-06-01 ~ 2026-06-07](2026-06-01_2026-06-07/) (W23) | 23 | 15/5/3 | 见周目录 | daemon 修复（btw 泄漏/transcript/resync/stream）、telemetry 路由覆盖 + 响应元数据、core 流式超时 |

## 类型分布

feat ×74, fix ×44, refactor ×10, docs ×6, other ×4, chore ×4, test ×1, perf ×1

## 范围 (scope) 分布 — 工作重心

serve ×42, telemetry ×27, cli ×17, core ×17, acp-bridge ×6, sdk-python ×5, daemon ×5, sdk ×3, rewind ×3, integration ×3, skills ×2, ci ×2, tool-registry ×1, i18n ×1, test ×1


_生成于 2026-05-31；W23 + 索引更新于 2026-06-06_