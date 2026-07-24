# qwen-code PR 记录

我（[@doudouOUC](https://github.com/doudouOUC)）在 [QwenLM/qwen-code](https://github.com/QwenLM/qwen-code) 提交的 PR，按周整理。每个周目录下的 `README.md` 含该周完整明细（类型 / 代码量 / 文件数 / 链接）及逐 PR 的“解决了什么问题 / 怎么做的”摘要；已建立深读记录的 PR，其完整中文最终实现文档放在对应周目录的 `implementations/` 下。最终口径以 merged diff、changed files、patch、测试/配置路径和关闭状态为准；PR body 只作为目标线索。

**时间范围**: 2026-04-06 ~ 2026-07-24（持续更新）
**总计**: 326 PRs（按当前保留的 @doudouOUC 个人 PR 最终实现文档计）
**代码量**: W15–W22 历史累计 +361,436 / -61,427；W23/W24/W25/W27/W28/W29/W30 见对应周目录（W30 当前个人增量 +68,099 / -5,654，625 个文件变更）

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
| [2026-05-25 ~ 2026-05-31](2026-05-25_2026-05-31/) (W22) | 23 | 14/6/3 | +153,167/-35,166 | daemon 新端点（recap/btw/tasks/shell）、serve T2.x、daemon prompt 链路追踪、集成合并；补 W22 末漏收 telemetry/daemon PR |
| [2026-06-01 ~ 2026-06-07](2026-06-01_2026-06-07/) (W23 最终版) | 26 | 23/0/3 | 见周目录 | daemon 修复、telemetry 补强、ACP 命令扩展（rewind/hooks/directory/remember/settings/branch） |
| [2026-06-08 ~ 2026-06-14](2026-06-08_2026-06-14/) (W24 最终版) | 23 | 20/0/3 | 见周目录 | rate limiting、prompt queue backpressure、direct shell opt-in、tool result 持久化、TRACEPARENT、rewind 测试补强、file history snapshot、Agent 权限弹窗、tool call id 修复 |
| [2026-06-15 ~ 2026-06-21](2026-06-15_2026-06-21/) (W25 最终版) | 10 | 9/0/1 | 见周目录 | sed edit file history、daemon docs English refresh、monitor notification batch drain、daemon status API、model provider 选择持久化、mid-turn 图片保留、ACP 取消停止语义、serve 权限超时配置 |
| [2026-06-29 ~ 2026-07-05](2026-06-29_2026-07-05/) (W27 周报) | 31 | 29/0/2 | +39,985/-3,521 | serve fast-path guard、daemon channel worker/session archive、skills ACP 输出、plan-required teammate approval、worker stderr redaction、ChannelAgentBridge session listing、daemon dashboard/status/perf、session export/organization、prompt queue status、large pipe frame measurement |
| [2026-07-06 ~ 2026-07-12](2026-07-06_2026-07-12/) (W28 周内累计) | 30 | 29/0/1 | +70,513/-6,343 | session start profiler、ACP `/tmp` fallback、大文本/PDF 读取、Phase 2a/2b/3/4 multi-workspace sessions + REST/ACP、bounded/paged/workspace-qualified transcript、workspace management sidebar、non-primary archived/organized/untrusted session catalog、channel worker reload/grouping/runtime control、extension management v2、persistent registration、runtime removal、recording failure visibility |
| [2026-07-13 ~ 2026-07-19](2026-07-13_2026-07-19/) (W29 最终版) | 29 | 27/1/1 | +74,269/-11,430 | multi-workspace owner-routed session mutations、Extension Management V2、workspace-qualified Voice/session export、PDF vision bridge fallback、shell timeout/heartbeat、cold first-session tracing、archived export、Todo stop guard、channel startup diagnostics、deep health、Plan exit approval、bounded daemon logs、legacy telemetry、ownership guard hardening、hardening closeout、shell safety tri-state classification、ACP initialize profiling、single-writer sessions、Plan shell routing、ACP startup closure slimming、conversation branch inspection、ACP preheat readiness、ACP writer fencing |
| [2026-07-20 ~ 2026-07-26](2026-07-20_2026-07-26/) (W30 周内累计) | 32 | 22/8/2 | +68,099/-5,654 | Plan mode entry boundary、workspace trust hot reload、SDK SSE request cleanup、lazy telemetry SDK / OTLP protocol split、ACP permission cancellation preservation、final tool response budget、daemon detach attach-ref ledger、exactly-once prompt terminal events、prompt-terminal follow-up hardening、lazy undici、daemon replay epoch/compaction hardening、Java daemon SDK alpha、Shell truncation regression、enterprise memory gateway stack、lazy Google GenAI SDK、GenAI telemetry ARMS alignment、deferred ACP telemetry init、retrieval-only external context search、ACP compile cache propagation、Java daemon transport reliability hardening、epoch cursor review follow-up、daemon event pipeline resource hardening、GenAI request telemetry/content fields、OpenAI empty-frame usage preservation |

## 类型分布

feat ×167, fix ×108, refactor ×13, other ×8, docs ×9, chore ×6, perf ×10, test ×4, merge ×1

## 范围 (scope) 分布 — 工作重心

serve / daemon / telemetry 是 5–6 月主线；CLI、core、acp-bridge、sdk-python、rewind、integration 为主要支撑范围。精确逐周分布见各周 README。
