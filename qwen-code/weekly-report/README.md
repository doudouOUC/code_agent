# qwen-code PR 记录

我（[@doudouOUC](https://github.com/doudouOUC)）在 [QwenLM/qwen-code](https://github.com/QwenLM/qwen-code) 提交的 PR，以及近期需要按全作者口径复核的 PR，按周整理。每个周目录下的 `README.md` 含该周完整明细（类型 / 代码量 / 文件数 / 链接）及逐 PR 的“做什么 / 怎么做”摘要；如该 PR 有单独 plan 文档，则放在对应周目录的 `plans/` 下。

**时间范围**: 2026-04-06 ~ 2026-06-29（持续更新）
**总计**: 256 PRs（W15–W25 按周索引 + W27 06-29 日增量合计）
**代码量**: W15–W22 历史累计 +387,910 / -64,025，2,946 个文件变更；W23/W24/W25/W27 见对应周目录（W27 06-29 日增量 +39,249 / -4,543，558 个文件变更）

## 按周

| 周 | PRs | merged/open/closed | 代码量 | 主题 |
|---|---|---|---|---|
| [2026-04-06 ~ 2026-04-12](2026-04-06_2026-04-12/) (W15) | 6 | 4/1/1 | +3,254/-651 | CLI 启动优化起步 + skills/settings |
| [2026-04-13 ~ 2026-04-19](2026-04-13_2026-04-19/) (W16) | 8 | 8/0/0 | +5,369/-416 | CLI 性能（preconnect/profiler/early-input）、/doctor、rewind 功能首发 |
| [2026-04-20 ~ 2026-04-26](2026-04-20_2026-04-26/) (W17) | 11 | 9/0/2 | +14,683/-209 | 权限修复、Python SDK 落地、auth 修复、rewind E2E |
| [2026-04-27 ~ 2026-05-03](2026-04-27_2026-05-03/) (W18) | 11 | 10/0/1 | +14,853/-698 | monitor 工具 / Monitor 权限、background agent、telemetry OTLP 起步、sdk-python 发布 CI |
| [2026-05-04 ~ 2026-05-10](2026-05-04_2026-05-10/) (W19) | 14 | 13/0/1 | +10,277/-1,242 | sdk-python 发布工具链、telemetry trace 关联、reactive compression |
| [2026-05-11 ~ 2026-05-17](2026-05-11_2026-05-17/) (W20) | 29 | 29/0/0 | +39,561/-2,486 | telemetry 层级 span、atomicWrite、rewind 文件恢复、/stuck，daemon/serve Wave 1–4 大爆发 |
| [2026-05-18 ~ 2026-05-24](2026-05-18_2026-05-24/) (W21) | 43 | 36/3/4 | +120,272/-20,559 | serve 路由密集开发、acp-bridge 大重构、telemetry Phase 1.5–4、原子写、F1/F2/F3 |
| [2026-05-25 ~ 2026-05-31](2026-05-25_2026-05-31/) (W22) | 27 | 17/6/4 | +179,641/-37,764 | daemon 新端点（recap/btw/tasks/shell）、serve T2.x、daemon prompt 链路追踪、集成合并；补 W22 末漏收 telemetry/daemon PR |
| [2026-06-01 ~ 2026-06-07](2026-06-01_2026-06-07/) (W23 最终版) | 25 | 22/0/3 | 见周目录 | daemon 修复、telemetry 补强、ACP 命令扩展（rewind/hooks/directory/remember/settings/branch） |
| [2026-06-08 ~ 2026-06-14](2026-06-08_2026-06-14/) (W24 最终版) | 23 | 20/0/3 | 见周目录 | rate limiting、prompt queue backpressure、direct shell opt-in、tool result 持久化、TRACEPARENT、rewind 测试补强、file history snapshot、Agent 权限弹窗、tool call id 修复 |
| [2026-06-15 ~ 2026-06-21](2026-06-15_2026-06-21/) (W25 最终版) | 10 | 9/0/1 | 见周目录 | sed edit file history、daemon docs English refresh、monitor notification batch drain、daemon status API、model provider 选择持久化、mid-turn 图片保留、ACP 取消停止语义、serve 权限超时配置；附全作者概览（created 2026-06-15..2026-06-21，285 PRs） |
| [2026-06-29 ~ 2026-07-05](2026-06-29_2026-07-05/) (W27 日增量) | 49 | 26/15/8 | +39,249/-4,543 | 2026-06-29 北京时间创建或合入 PR：safe mode、qwen tag、ChannelAgentBridge、serve fast-path guard、WebShell queued prompt/Esc UX、daemon extension mention、provider TLS insecure |

## 类型分布

feat ×114, fix ×98, refactor ×14, docs ×10, chore ×6, other ×6, test ×3, ci ×2, perf ×1, revert ×1, merge ×1

## 范围 (scope) 分布 — 工作重心

serve / daemon / telemetry 是 5–6 月主线；CLI、core、acp-bridge、sdk-python、rewind、integration 为主要支撑范围。精确逐周分布见各周 README。

_生成于 2026-05-31；W25 最终版 + PR 说明更新于 2026-06-22；W25 全作者概览补充于 2026-06-23；W27 06-29 日增量补充于 2026-06-30_
