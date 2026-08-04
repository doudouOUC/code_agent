# qwen-code PRs · 2026-08-03 ~ 2026-08-09 (W32 周内累计)

> 本文件已整理 2026-08-03 至 2026-08-04（Asia/Shanghai）创建的 @doudouOUC 个人 PR。口径为 `QwenLM/qwen-code` 中 author 为 @doudouOUC 且 createdAt 落在对应北京时间日窗口内的 PR；只在窗口内更新、关闭或合入，但创建时间不在窗口内的 PR 不计入新增统计。open PR 只记录当前 diff 方案，不能视为 `main` 已落地能力。

**主题**: MCP unsafe replay guard、WebUI live journal truncation recovery、caller-supplied session ID admission、daemon memory pressure observation、write_file prior-read prompt guidance、ACP tool-result text projection、daemon active ACP child RSS aggregation、tool-result microcompaction low watermark、ACP repeated tool execution failure guard、Direct External Context Mem0 write variant、daemon child heap partition modeling

**PR 统计**: 11 PRs - 4 merged / 7 open / 0 closed
**当前已合并 PR 代码量**: +1,601 / -102，48 个文件变更
**全量代码量**: +13,467 / -1,025，181 个文件变更
**类型分布**: fix ×5, feat ×4, perf ×1, refactor ×1
**范围 (scope)**: serve ×4, core ×3, acp ×1, cli ×1, external-context ×1, webui ×1

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 变更 | 文件 | 创建(UTC) | 合并/关闭(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#8387](https://github.com/QwenLM/qwen-code/pull/8387) | ✅ merged | @doudouOUC | fix(core): Avoid replaying unsafe MCP tool calls | +492/-21 | 7 | 08-02 16:21 | 08-03 11:04 |
| [#8414](https://github.com/QwenLM/qwen-code/pull/8414) | 🟡 open | @doudouOUC | fix(webui): recover complete turns after live journal truncation | +2394/-166 | 17 | 08-03 03:02 | — |
| [#8415](https://github.com/QwenLM/qwen-code/pull/8415) | 🟡 open | @doudouOUC | fix(serve): Coordinate caller-supplied session IDs | +3097/-618 | 44 | 08-03 03:08 | — |
| [#8423](https://github.com/QwenLM/qwen-code/pull/8423) | 🟡 open | @doudouOUC | feat(serve): observe daemon memory pressure against a real denominator | +974/-32 | 21 | 08-03 04:29 | — |
| [#8428](https://github.com/QwenLM/qwen-code/pull/8428) | ✅ merged | @doudouOUC | fix(core): Clarify write_file prior-read guidance | +134/-1 | 5 | 08-03 06:00 | 08-03 10:36 |
| [#8450](https://github.com/QwenLM/qwen-code/pull/8450) | 🟡 open | @doudouOUC | fix(cli): Bound ACP textual tool-result payloads | +1057/-4 | 9 | 08-03 09:51 | — |
| [#8462](https://github.com/QwenLM/qwen-code/pull/8462) | ✅ merged | @doudouOUC | feat(serve): report aggregate ACP child RSS, not just the primary's | +350/-38 | 12 | 08-03 13:47 | 08-03 14:01 |
| [#8464](https://github.com/QwenLM/qwen-code/pull/8464) | 🟡 open | @doudouOUC | perf(core): clear tool results to a low watermark to preserve prompt cache | +265/-26 | 7 | 08-03 13:52 | — |
| [#8469](https://github.com/QwenLM/qwen-code/pull/8469) | 🟡 open draft | @doudouOUC | feat(acp): Protect against repeated tool execution failures | +2081/-7 | 14 | 08-03 15:25 | — |
| [#8507](https://github.com/QwenLM/qwen-code/pull/8507) | 🟡 open draft | @doudouOUC | feat(external-context): Add optional Mem0 memory writes | +1998/-70 | 21 | 08-04 03:12 | — |
| [#8508](https://github.com/QwenLM/qwen-code/pull/8508) | ✅ merged | @doudouOUC | refactor(serve): model a per-child heap partition of the daemon budget | +625/-42 | 24 | 08-04 03:36 | 08-04 12:32 |

---

## PR 解决问题、实现方式与 feature 处理

| PR | 解决了什么问题 | 最终怎么实现（open 只登记当前观察） | 对应 feature 文档 |
|---|---|---|---|
| [#8387](https://github.com/QwenLM/qwen-code/pull/8387) | MCP 连接在工具执行后断开时，旧逻辑可能自动重连并重放同一次工具调用；如果工具不是明确幂等或只读，自动 replay 可能重复写入、重复发起外部动作或掩盖真实执行结果。 | 最终实现新增安全 replay 判定：仅在 trusted server、trusted workspace、工具 annotations 存在且声明 `idempotentHint:true` 或无冲突 `readOnlyHint:true` 时自动重试；连接恢复后还会用 rediscovered tool 重新校验 trust、workspace trust 与 annotations。其余连接丢失统一返回固定 unsafe replay 错误，提示不要自动重试。 | 已更新 daemon MCP guardrail 口径。完整实现见 [implementations/pr-8387.md](implementations/pr-8387.md)。 |
| [#8414](https://github.com/QwenLM/qwen-code/pull/8414) | WebUI live journal 环形缓冲被截断后，用户可能只能看到 `history_truncated` marker 和残缺 turn；仅依赖 replay event 会丢失同一 turn 的完整输出，影响长输出、慢客户端或移动端恢复体验。 | 当前 open diff 让 daemon 在 live-journal truncation marker 中带上 `promptId`，WebUI 在看到 marker 后先保持当前 UI，不立即破坏 transcript；等同一 prompt 的 terminal 到达后，用一次 same-session load 拉取 memory replay，校验目标 user input 与 terminal，再用重建出的 suffix 原子替换 marker 后的残缺尾部。repair 失败只提示一次并继续消费 live SSE。 | 已更新 daemon WebUI/transport 口径。当前实现见 [implementations/pr-8414.md](implementations/pr-8414.md)。 |
| [#8415](https://github.com/QwenLM/qwen-code/pull/8415) | 外部调用方希望指定会话 ID 来把 REST/ACP/SDK 调用与自己的 thread 对齐，但未协调的 caller-supplied session id 会与 live session、pending create、archive/history 或其它 workspace 冲突，甚至产生 orphan session。 | 当前 open diff 新增 `session_id_override` capability、严格 UUID v1-v5 lowercase validator、daemon-wide requested-session admission 和 refcounted pending claim。REST `POST /session {sessionId}`、ACP `_meta["qwen-code/sessionId"]`、TS/Java/MCP SDK 均先 gate capability，再验证 response 是否 honor 请求；冲突、历史已存在和 restore 竞争均返回 typed error 并清理 orphan。 | 已更新 daemon session lifecycle、protocol 与 SDK 口径。当前实现见 [implementations/pr-8415.md](implementations/pr-8415.md)。 |
| [#8423](https://github.com/QwenLM/qwen-code/pull/8423) | daemon status 已有内存绝对值和预算模型，但没有用真实 cgroup/host/heap denominator 计算压力等级，操作者无法判断当前 daemon root 离可用内存耗尽还有多近。 | 当前 open diff 新增 `--memory-pressure-mode off|observe`，默认 observe；status 中报告 `runtime.memory.pressure`，ratio 取 daemon root RSS / available memory 与 V8 heap used / heap limit 的较大值，并标注 source、level 与原始字节数。observe 模式只产生 warning，不做 admission 或进程杀停。 | 已更新 daemon resource budgeting 口径。当前实现见 [implementations/pr-8423.md](implementations/pr-8423.md)。 |
| [#8428](https://github.com/QwenLM/qwen-code/pull/8428) | `write_file` prompt guidance 仍容易被模型理解成“创建/生成文件可直接写目标路径”；在 prior-read enforcement 打开时，这类 blind overwrite 会被拒绝，也可能在未确认文件状态时覆盖已有内容。 | 最终实现直接收紧 `WriteFileTool` 描述和系统 prompt 示例：除非本轮会话已经确认目标不存在或读过当前内容，否则创建/生成目标文件前必须先 `read_file`；示例改为先读目标 test 文件，读到不存在后再写。测试用 snapshot 和 write-file 单测锁住描述与示例顺序。 | 已更新原子文件写/写文件口径。完整实现见 [implementations/pr-8428.md](implementations/pr-8428.md)。 |
| [#8450](https://github.com/QwenLM/qwen-code/pull/8450) | ACP transport 会把工具结果文本投影给 UI/live replay；超大 textual payload 即使不进入模型，也会撑大 ACP update、history replay 或 virtual subagent replay，拖慢 WebUI/IDE 并放大内存压力。 | 当前 open diff 在 ACP transport boundary 增加 65,536 byte JSON 预算，只裁剪 canonical text blocks 的 `content` 和 string `rawOutput`，保留 A2UI、structured diff、terminal/media/mixed payload、canonical transcript、model-facing response 与 offline export。超限文本按 UTF-8 JSON byte 预算保留 head/tail 和固定 marker，live、history replay、virtual subagent replay 共用同一投影函数。 | 已更新 tool response budget / ACP transport 口径。当前实现见 [implementations/pr-8450.md](implementations/pr-8450.md)。 |
| [#8462](https://github.com/QwenLM/qwen-code/pull/8462) | #8423/#8245 只能报告 daemon root 和 primary ACP child RSS；多 workspace 或多 active ACP child 时，status 会低估总子进程内存占用，操作者看不出是否有未采样 child。 | 最终实现把 status 的 `runtime.memory.childRssCoverage` 扩展为 `active_children`，新增 `runtime.memory.children`，同步遍历所有 live managed runtime child 并汇总已缓存 RSS，报告 `rssBytes`、`sampled` 和 `oldestReadingAgeMs`。它只做观测，不把 child aggregate 折入 memory pressure ratio。 | 已更新 daemon resource budgeting 口径。完整实现见 [implementations/pr-8462.md](implementations/pr-8462.md)。 |
| [#8464](https://github.com/QwenLM/qwen-code/pull/8464) | active tool-result history budget 在刚超过阈值时只清到低于阈值，长会话会频繁小幅 compaction，破坏 prompt cache locality；pending batch 还可能错误消耗 committed history 的 keep-recent slots。 | 当前 open diff 把 size-triggered microcompaction 目标改为 `threshold / 2` 低水位，触发仍是超过阈值，`-1` disable 不变。pending result 继续计入虚拟总量但不再占 committed keep-recent 槽；metadata/debug log 暴露 low watermark 和 soft-exceeded 情况。 | 已更新 context compression 口径。当前实现见 [implementations/pr-8464.md](implementations/pr-8464.md)。 |
| [#8469](https://github.com/QwenLM/qwen-code/pull/8469) | ACP 前台工具如果反复以同一种执行错误失败，模型可能不断重试同一工具，浪费 turn、打满日志并延迟用户可见失败；现有 stop guard 只覆盖 Todo 等特定模式，缺少基于 execution outcome 的通用保护。 | 当前 draft diff 新增 prompt-local repeated tool execution failure guard，默认 `shadow`。它只统计完全 settle 的前台 ACP batch 中真实进入 execution 后的 terminal error，key 为 `(policyToolName, executionErrorType)`；达到 8 次且跨至少 2 个 batch 后在 warn/enforce 模式注入固定纠偏提醒，再次匹配时 enforce 可停止自动续跑并关闭 Todo continuation，直到新用户输入重置。telemetry 只记录低基数字段，不采集参数、输出、路径或 MCP server 名。 | 已更新 daemon ACP/telemetry 口径。当前实现见 [implementations/pr-8469.md](implementations/pr-8469.md)。 |
| [#8507](https://github.com/QwenLM/qwen-code/pull/8507) | Direct External Context 已有只读检索和 submitted-prompt auto recall，但可信团队没有一个窄范围、管理员绑定 provider/app_id、内容可见确认的 Mem0 记忆写入入口；直接暴露 Mem0 MCP 又会扩大管理面和写入语义。 | 当前 draft diff 只在严格 v1 Mem0 config 且 `write.enabled=true` 时注册非幂等 `context_remember({content})`，把已确认内容原样作为一条 Mem0 V3 Direct Import user message 发送，固定 `app_id` 与 `infer:false`。写路径不预搜索、不规范化、不重试、不轮询、不缓存、不去重；`SUCCEEDED` 映射 `stored`，带有效 UUID 的 `PENDING` 映射 `accepted`，超时/取消/坏 JSON/redirect/非法状态等不确定结果映射为 `unknown` MCP 错误并明确禁止自动 retry。专用 `PreToolUse` Hook 展示完整可逆转义内容并二次确认，默认 approval 下仍先走普通 MCP prompt，YOLO 下也保留内容确认。 | 已更新 Direct External Context 口径。当前实现见 [implementations/pr-8507.md](implementations/pr-8507.md)。 |
| [#8508](https://github.com/QwenLM/qwen-code/pull/8508) | `getAcpMemoryArgs()` 把 host-derived heap ceiling 原样发给每个 ACP child，最多 25 个 workspace 会把 32GB 主机建模成 25×16GB 的子进程堆授权；早期按派生时刻递减 share 的方案又不能约束已运行 child，且零池时把 `--max-old-space-size=0` 误当作零上限。 | 最终实现只建模、不应用：新增 `--child-heap-mode off|observe`（默认 observe），status 报告 `limits.memory.childHeap.mode/maxConcurrentChildren/perChildCeilingMb/refusals`。模型给每个 child 一个恒定 ceiling，并让 `maxConcurrentChildren * perChildCeilingMb <= modeled.childPoolMb`；容不下一个 512MB floor child 时返回 `maxConcurrentChildren:0`、`perChildCeilingMb:null`。spawn argv 保持 host-derived ceiling，`limits.memory.enforced` 仍是字面量 `false`，`enforce` flag、`ChildHeapPoolExhaustedError` 和应用路径均被删除。 | 已更新 daemon resource budgeting 口径。完整实现见 [implementations/pr-8508.md](implementations/pr-8508.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [daemon-serve-mode/](../../feature/daemon-serve-mode/) | #8387 / #8414 / #8415 / #8423 / #8450(open) / #8462 / #8469(draft open) / #8508 | 补 MCP unsafe replay guard、WebUI live journal repair、caller-supplied session id admission、memory pressure / active child RSS status、ACP tool-result transport projection、repeated execution failure guard 和 child heap partition status model 的 daemon 影响面。 |
| [sdk.md](../../feature/sdk.md) / [daemon-serve-mode/10-client-adapters-and-sdk.md](../../feature/daemon-serve-mode/10-client-adapters-and-sdk.md) | #8415 | 补 TS/Java/MCP SDK 的 `sessionId` override capability gate、response verification 与 typed conflict errors。 |
| [atomic-file-write.md](../../feature/atomic-file-write.md) | #8428 | 补 `write_file` prior-read guidance 与 blind-overwrite enforcement 的提示边界。 |
| [tool-response-budget.md](../../feature/tool-response-budget.md) | #8450(open) | 补 ACP transport-only textual projection 与 model-facing finalizer 的边界差异。 |
| [context-compression.md](../../feature/context-compression.md) | #8464(open) | 补 active tool-result microcompaction 低水位目标和 pending result keep-recent 修正。 |
| [telemetry-observability/](../../feature/telemetry-observability/) | #8469(draft open) | 补 repeated tool execution failure guard telemetry 的低基数字段与隐私边界。 |
| [external-context-provider.md](../../feature/external-context-provider.md) | #8507(draft open) | 补可选 Mem0 write variant、`context_remember` 非幂等写入语义、内容可见确认 Hook 与不确定结果禁止自动重试边界。 |

_周内累计按个人 PR 口径更新于 2026-08-04_
