# 2026-07 PR 月度无方向审计汇总

> 口径：只统计 [QwenLM/qwen-code](https://github.com/QwenLM/qwen-code) 中 author 为 [@doudouOUC](https://github.com/doudouOUC)，且 `createdAt` 落在北京时间 2026-07-01 00:00:00 到 2026-07-31 23:59:59 的 PR。PR body 只作为线索；最终实现方案按 PR diff、changed files、测试路径、文档路径和当前状态整理。

## 总览

- **PR 数量**：140 个。
- **状态**：128 merged / 5 open / 7 closed。
- **代码量**：+283,892 / -30,330，2,780 个文件变更。
- **类型分布**：feat ×76、fix ×45、perf ×12、test ×4、refactor ×2、docs ×1。
- **主要 scope**：serve ×33、core ×29、cli ×29、daemon ×9、integrations ×7、acp-bridge ×5、telemetry ×4、web-shell ×4、acp ×3，其余分散在 external-context、test、sdk、sdk-java、startup、hooks 等。

## 按周切分

| 北京时间窗口 | 周目录 | PRs | merged/open/closed | 代码量 | 说明 |
|---|---|---:|---:|---:|---|
| 2026-07-01 ~ 2026-07-05 | [2026-06-29_2026-07-05](2026-06-29_2026-07-05/) | 21 | 19/0/2 | +22,898/-1,361，268 files | 本月只取该周的 7 月部分；周目录 README 仍按全周口径展示。 |
| 2026-07-06 ~ 2026-07-12 | [2026-07-06_2026-07-12](2026-07-06_2026-07-12/) | 30 | 29/0/1 | +70,513/-6,343，742 files | multi-workspace runtime/REST/ACP、extension management、workspace transcript 与 recording failure visibility 密集推进。 |
| 2026-07-13 ~ 2026-07-19 | [2026-07-13_2026-07-19](2026-07-13_2026-07-19/) | 29 | 28/0/1 | +74,566/-11,383，698 files | owner-routed session mutations、workspace Voice/export、telemetry/status hardening、Plan/shell safety 与 ACP reliability。 |
| 2026-07-20 ~ 2026-07-26 | [2026-07-20_2026-07-26](2026-07-20_2026-07-26/) | 36 | 29/5/2 | +74,992/-6,440，712 files | trust hot reload、daemon replay/epoch/compaction、Java SDK、enterprise memory stack、GenAI telemetry、external-context、first-use lazy loading。 |
| 2026-07-27 ~ 2026-07-31 | [2026-07-27_2026-08-02](2026-07-27_2026-08-02/) | 24 | 23/0/1 | +40,923/-4,803，360 files | 本月只取 W31 的 7 月部分；新增 workspace skill read model、resource budget、tool-call telemetry、external-context dependency hardening、daemon memory budget。 |

## 主题审计

### daemon / serve

7 月 daemon 主线从“多 workspace 能用”推进到“多 workspace 可观测、可恢复、可安全扩展”。W28/W29 建立 workspace runtime registry、workspace-qualified REST/ACP/Voice/session export/transcript、runtime removal、extension management v2 和 owner-routed legacy routes；W30/W31 继续补 trust hot reload、event epoch/replay resource hardening、session writer lease opt-in、timestamp drift reconciliation、maintenance writer isolation、certified handoff、workspace skill status read model、resource budget foundation 和 daemon memory budget reporting。

本轮审计同步修正：#7237/#7268/#7754/#7886/#7975/#7976/#7994/#8002/#8245 已合入的状态漂移；#8093 已关闭为 closed draft，只保留未合入观察，不能当作 `main` 已落地。

### telemetry / GenAI / tool-call outcome

7 月 telemetry 从 daemon route/status 可观测延伸到 GenAI/ARMS 字段对齐和 tool-call outcome。#7536/#7635/#7650/#7667/#7921/#8150 逐步补 provider/operation/output metadata、request 参数、OpenAI usage-only frame、sensitive content fields、span-level `gen_ai.user.id` 与标准 `gen_ai.response.time_to_first_chunk`。#8176 将 tool-call terminal status 统一归一化，#8180 已合入 execution outcome，进一步区分 synthetic pre-execution failure 与实际执行后的 success/failure/cancel。

本轮审计同步修正：#7667/#8150 已合入，不再写作 open；telemetry feature 总览和 06 子文档已补 #8176/#8180 的 terminal/execution 边界。

### file / transcript / SDK

文件读取主线补齐大型文本和 PDF 的有界读取、Serve `/file` 大文本行窗口、byte-cursor paging、TS daemon SDK paging fields，以及 #7967 已合入的 borrowed descriptor refactor。session transcript 主线补 active/workspace transcript paging、writer lease、timestamp drift reconciliation、maintenance writer 与 certified handoff，降低 multi-workspace daemon 下的双写和错误 owner 风险。

### external context / enterprise memory

external-context 先落 retrieval-only MCP，再通过 submitted-prompt auto recall hook 支持确定性只读召回；#8206 已合入，收敛 MCP SDK / Hono / parser dependency path，并保留 mobile MCP 的 Node 18-compatible dependency tree。Enterprise Memory Gateway 系列仍有 5 个 open PR（#7505-#7509），按方案记录，不当作 `main` 能力。

### startup / performance / benchmarking

启动和首输出性能从 lazy telemetry/undici/Google GenAI SDK 扩展到 ACP compile cache、first-use dependencies、daemon first-output benchmark、provider preload、benchmark schema/validity修正，以及 immediate prompt dispatch stages。#7686/#7994 均已合入，feature 索引不再写作 open。

## Open / Closed 跟踪

### 仍 open

| PR | 主题 | 当前处理 |
|---|---|---|
| #7505 / #7506 / #7507 / #7508 / #7509 | Enterprise Memory Gateway stack | 保留在 [enterprise-memory-gateway.md](../feature/enterprise-memory-gateway.md) 作为 open 方案，不写成落地能力。 |

### closed 未合入

| PR | 主题 | 当前处理 |
|---|---|---|
| #6233 | workspace skills disabled status | 保留为 closed 方案记录，不写入落地能力。 |
| #6253 | daemon status dashboard | 保留为 closed 方案记录，不写入落地能力。 |
| #6638 | extension management v2 draft | 由后续已合入 extension management v2 PR 覆盖，closed 记录不作为最终能力。 |
| #7166 | single-writer session persistence 完整方案 | 保留为未合入设计来源，实际落地由 #7237/#7894/#7812/#7886/#7975/#7976 等拆分 PR 承接。 |
| #7447 | lazy SDK / exporter split 早期方案 | 由 #7276/#7456/#7558 等已合入 PR 承接最终实现。 |
| #7502 | enterprise multi-tenant memory gateway | 保留为 closed 方案记录，后续 open stack #7505-#7509 继续拆分推进。 |
| #8093 | daemon resource budget foundation | 关闭前 draft 只作为未合入 foundation 观察，production route 以后续已合入的 #8245/#8423/#8462/#8508/#8911/#8947/#9007/#9380 等拆分 PR 记录。 |

## 本轮审计修正

1. 补齐 W31 漏收的 #8176、#8180、#8206、#8245：周 README、implementations 索引、逐 PR 中文实现文档和 feature 覆盖表均已更新。
2. 修正 7 月状态漂移：#7586、#7667、#7754、#7237、#7268、#7886、#7975、#7976、#7994、#8002、#8150、#7967、#8180、#8206、#8245 已按 merged final 更新；#8093 改为 closed draft 观察；仍 open 的只有 #7505-#7509 enterprise memory stack。
3. 完善 feature 覆盖：daemon resource budgeting 增加 #8245 memory budget reporting；telemetry 增加 #8176 terminal status 和 #8180 execution outcome；external-context 增加 #8206 dependency hardening；root feature 索引同步到 2026-08-20。
4. 修正根周报索引：总实现文档数更新为 416，W29/W30/W31/W32/W33/W34 的 merged/open/closed、代码量和主题摘要按最新个人 PR 元数据修正。
5. 明确口径差异：本月度文件按 2026-07-01 ~ 2026-07-31 切分；W27/W31 周目录仍按自然周目录存在，其中本月只取对应的 7 月部分。

## 后续关注

- W31 目录覆盖到 2026-08-02；2026-08-01/08-02 如新增 PR，应该继续补入同一周目录，但不回写本月度口径。
- open PR 合入后需要把对应 implementations 从“当前实现文档”改成“最终实现文档”，并同步 feature 中的 open/draft 标注；截至 2026-08-20，7 月月度口径内只剩 enterprise memory stack #7505-#7509 仍为 open。
- enterprise memory stack 当前仍是 open 方案记录；不要把 #7505-#7509 作为 `main` 已落地能力写入 feature 总览。

_按个人 PR 口径审计更新于 2026-08-20_
