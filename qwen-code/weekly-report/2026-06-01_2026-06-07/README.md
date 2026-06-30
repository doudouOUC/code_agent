# qwen-code PRs · 2026-06-01 ~ 2026-06-07  (W23 最终版)

**主题**: daemon 修复（btw 泄漏/transcript 隔离/compaction/resync）、ACP 命令扩展（rewind/hooks/directory/remember）、telemetry metrics + 响应元数据、大规模重构

**统计**: 25 PRs — 22 merged / 0 open / 3 closed
**代码量**: +12,945 / -12,163，264 个文件变更
**类型**: feat ×13, fix ×9, refactor ×1, chore ×1
**范围 (scope)**: daemon ×7, serve ×5, cli ×4, telemetry ×3, core ×2, integration ×1

**本周最大改动**:
- [#4774](https://github.com/QwenLM/qwen-code/pull/4774) (+2775/-4969, 81 files) refactor(daemon): simplify code and strip PR/commit references from comments — net -2194 行
- [#4730](https://github.com/QwenLM/qwen-code/pull/4730) (+4/-6184, 3 files) fix: add missing TelemetryRuntimeConfig methods — 删除已迁移的旧测试文件
- [#4751](https://github.com/QwenLM/qwen-code/pull/4751) (+2224/-21, 15 files) feat(daemon): optimize ACP child lifecycle — skip relaunch + preheat + idle keep-alive

| PR | 状态 | 标题 | 变更 | 文件 | 创建 | 合并/关闭 | 链接 |
|---|---|---|---|---|---|---|---|
| #4666 | ✅ merged | fix(daemon): btw cross-session leak + timeout + input cap + permission | +67/-45 | 5 | 06-01 | 06-01 | https://github.com/QwenLM/qwen-code/pull/4666 |
| #4667 | ⬜ closed | fix(core): add configurable bodyTimeout to prevent streaming timeout w | +255/-100 | 12 | 06-01 | 06-03 | https://github.com/QwenLM/qwen-code/pull/4667 |
| #4682 | ✅ merged | feat(telemetry): expand daemon telemetry route coverage | +52/-11 | 1 | 06-01 | 06-02 | https://github.com/QwenLM/qwen-code/pull/4682 |
| #4683 | ⬜ closed | chore(integration): mark main merged for PR 4490 | +0/-0 | 0 | 06-01 | 06-01 | https://github.com/QwenLM/qwen-code/pull/4683 |
| #4689 | ✅ merged | fix(daemon): isolate parallel subAgent text streams in transcript redu | +798/-18 | 8 | 06-02 | 06-03 | https://github.com/QwenLM/qwen-code/pull/4689 |
| #4693 | ✅ merged | feat(telemetry): enrich llm_request span with response metadata and er | +213/-4 | 3 | 06-02 | 06-03 | https://github.com/QwenLM/qwen-code/pull/4693 |
| #4694 | ✅ merged | fix(daemon): compacted session replay for long-session recovery | +1084/-35 | 11 | 06-02 | 06-03 | https://github.com/QwenLM/qwen-code/pull/4694 |
| #4702 | ✅ merged | fix(daemon): auto-recover transcript on ring_evicted resync | +29/-7 | 3 | 06-02 | 06-02 | https://github.com/QwenLM/qwen-code/pull/4702 |
| #4703 | ✅ merged | fix(core): explicitly set stream: false in non-streaming requests | +6/-1 | 2 | 06-02 | 06-02 | https://github.com/QwenLM/qwen-code/pull/4703 |
| #4730 | ✅ merged | fix: add missing TelemetryRuntimeConfig methods and remove obsolete te | +4/-6184 | 3 | 06-03 | 06-03 | https://github.com/QwenLM/qwen-code/pull/4730 |
| #4731 | ✅ merged | fix: add missing isForkSubagentEnabled from main merge | +13/-0 | 2 | 06-03 | 06-03 | https://github.com/QwenLM/qwen-code/pull/4731 |
| #4749 | ✅ merged | feat(telemetry): add daemon OTel metrics and structured log records | +837/-66 | 9 | 06-03 | 06-05 | https://github.com/QwenLM/qwen-code/pull/4749 |
| #4751 | ✅ merged | feat(daemon): optimize ACP child lifecycle — skip relaunch, preheat, i | +2224/-21 | 15 | 06-03 | 06-05 | https://github.com/QwenLM/qwen-code/pull/4751 |
| #4765 | ✅ merged | fix(daemon): preserve parentToolCallId in compaction engine for parall | +569/-29 | 2 | 06-04 | 06-04 | https://github.com/QwenLM/qwen-code/pull/4765 |
| #4774 | ✅ merged | refactor(daemon): simplify code and strip PR/commit references from co | +2775/-4969 | 81 | 06-04 | 06-05 | https://github.com/QwenLM/qwen-code/pull/4774 |
| #4811 | ✅ merged | feat(cli): enable /remember, /forget, /dream in ACP mode | +278/-43 | 6 | 06-05 | 06-06 | https://github.com/QwenLM/qwen-code/pull/4811 |
| #4812 | ✅ merged | feat(serve): add POST /session/:id/branch for session forking | +396/-63 | 15 | 06-05 | 06-08 | https://github.com/QwenLM/qwen-code/pull/4812 |
| #4816 | ✅ merged | feat(serve): add /settings slash command for web-shell | +1109/-9 | 28 | 06-06 | 06-08 | https://github.com/QwenLM/qwen-code/pull/4816 |
| #4817 | ⬜ closed | feat(serve): add HTTP rewind endpoints for daemon/web-shell (issue #45 | +443/-13 | 15 | 06-06 | 06-06 | https://github.com/QwenLM/qwen-code/pull/4817 |
| #4818 | ✅ merged | Revert "feat(cli): enable /remember, /forget, /dream in ACP mode" | +43/-278 | 6 | 06-06 | 06-07 | https://github.com/QwenLM/qwen-code/pull/4818 |
| #4819 | ✅ merged | feat(cli): enable /remember, /forget, /dream in ACP mode | +302/-43 | 6 | 06-06 | 06-06 | https://github.com/QwenLM/qwen-code/pull/4819 |
| #4820 | ✅ merged | feat(serve): add HTTP rewind endpoints for daemon/web-shell (issue #45 | +474/-14 | 16 | 06-06 | 06-07 | https://github.com/QwenLM/qwen-code/pull/4820 |
| #4822 | ✅ merged | feat(serve): add hooks diagnostic HTTP/ACP surface (issue #4514 T3.9) | +681/-4 | 15 | 06-06 | 06-07 | https://github.com/QwenLM/qwen-code/pull/4822 |
| #4826 | ✅ merged | feat(cli): enable /directory command in ACP mode | +350/-267 | 2 | 06-06 | 06-07 | https://github.com/QwenLM/qwen-code/pull/4826 |
| #4832 | ✅ merged | feat(serve): add extensions diagnostic HTTP/ACP surface (issue #4514 T3.9) | +538/-51 | 14 | 06-07 | 06-08 | https://github.com/QwenLM/qwen-code/pull/4832 |

---

## 技术周报

### 本周重点

1. **daemon 稳定性修复**（#4666/#4689/#4694/#4702/#4765）：修复 btw 跨 session 历史泄漏、并行 subAgent 文本流交叉污染（per-parentToolCallId keyed map 隔离）、长 session 恢复（turn-boundary compaction engine，25-30× 压缩）、ring_evicted 后 transcript 自动恢复、compaction 引擎 parentToolCallId 丢失。本周 daemon 从"能跑"进入"可靠"阶段。

2. **ACP 命令扩展**（#4819/#4820/#4822/#4826）：4 个 slash 命令（`/remember`+`/forget`+`/dream`、`/directory`）启用 ACP 模式；2 组新 HTTP 端点（rewind 快照+回退、hooks 诊断）使 web-shell/SDK 客户端获得 TUI 同等能力。全部走 `MessageActionReturn` 统一输出管线。

3. **telemetry 补强**（#4682/#4693/#4749）：daemon 路由 telemetry 覆盖扩展（9 条新模式）、llm_request span 补齐 6 个响应元数据属性（GenAI semconv 双发）、daemon OTel metrics（11 个仪表，基数有界 ~200 time-series）。

4. **大规模重构**（#4774）：net -2194 行——提取共享 helper 消除 ~20 文件重复模式 + 剥离所有 PR/issue/commit 引用注释。daemon 代码库显著瘦身。

5. **ACP 子进程优化**（#4751）：跳过冗余 grandchild relaunch（直接传 `--max-old-space-size` + cgroup 感知内存分配）、daemon 启动预热 ACP child（首 session 延迟 0-0.5s）、末 session 关闭后 idle keep-alive。

### 本周关注

- **分支靶错误**：#4811 误入 `main` → #4818 revert → #4819 re-land `daemon_mode_b_main`。建议 CI 增加 branch-target 验证。
- **周末合入**：#4812（session forking）、#4816（/settings 命令）、#4832（extensions diagnostic）于 06-08 合入。
- **合并修复**：#4730/#4731 补回 #4490 大合并丢失的接口方法/配置项。

### 关联 feature 文档更新

| feature doc | 本周新增 PR |
|---|---|
| daemon/08-extension-endpoints | #4666 #4820 #4822 #4826 #4819（+ #4646 补录，合并于 05-31） |
| daemon/04-capabilities-and-protocol | session_rewind / workspace_hooks / session_hooks 三个新能力标签 |
| daemon/02-sse-event-bus | #4820 session_rewound SSE 事件 |
| daemon/03-session-lifecycle | #4694 compacted replay + #4751 ACP lifecycle |
| conversation-rewind | #4820 HTTP rewind 端点 |
| telemetry/02-span-tree | #4693 响应元数据 |

_W23 最终版 · 更新于 2026-06-08_

---

## PR 解决问题与实现方式

> 来源：同目录 `review.md` 的逐 PR diff 审查，结合 PR 状态与标题压缩成“解决了什么问题 / 怎么做的”。open/closed PR 只记录当前观察，不写成已落地实现。

| PR | 解决了什么问题 | 怎么做的 |
|---|---|---|
| [#4666](https://github.com/QwenLM/qwen-code/pull/4666) | btw 修复 4/5 项到位；shallow copy 项仅在描述中、代码未落地 | 描述列 5 项修复，但 "btw shallow copy: `getHistoryTail(40, false)`" 未在 diff 中；`btwUtils.ts` 当前仍为 `getHistoryTail(maxHistoryEntries, true)`（deep clone）。其余 4 项（cross-session leak、timeout、input cap、requestId cardinality）均落地。 |
| [#4667](https://github.com/QwenLM/qwen-code/pull/4667) | 未作为已落地实现；bodyTimeout 可配置，55 测试全绿。 | config 字段 + undici Agent + sanitize + proxy 回退 + keepAliveTimeout 五项全落地。`sanitizeBodyTimeout` 处理 negative/float/NaN/Infinity/undefined 全回退 0；`noProxyDispatcherCache` 按 bodyTimeout keyed 防 Agent 膨胀； |
| [#4682](https://github.com/QwenLM/qwen-code/pull/4682) | daemon telemetry 路由覆盖扩展，无基数问题 | 新增 9 条路由模式（recap/btw/model/shell/detach/approval-mode/metadata/sessions-delete/workspace 系列）+ 尾部斜杠归一化 + `[^/]+` regex 收紧，全部对应描述。 路由值全为静态模板（参数化占位），无原始 ID 泄入 span name；`[^/]+` 正确防止跨段匹配。 |
| [#4683](https://github.com/QwenLM/qwen-code/pull/4683) | 未作为已落地实现；chore，未合并无代码。 | 无代码变更，用于辅助 #4490 合并状态计算的 chore PR，已被关闭。 |
| [#4689](https://github.com/QwenLM/qwen-code/pull/4689) | 并行 subAgent 文本流隔离，keyed/scalar 双路径正确 | per-parent keyed map 替代标量、六层修改（emit/tracker/types/normalizer/reducer/store）全对应。`appendTextDelta` 按 `parentToolCallId` 分流（keyed vs scalar），无交叉污染（T5 测试验证）；`finishAssistant` 遍历所有 keyed map 条目防 zombie spinner；`trimTranscriptState` 裁剪过期条目防内存泄漏。 |
| [#4693](https://github.com/QwenLM/qwen-code/pull/4693) | llm_request span 补响应元数据，无 PII/secret 泄漏 | 6 个新属性 + GenAI semconv dual 全落地。 无 PII/secret 泄漏（response_id 是 provider 请求 ID、finish_reason 是枚举、error_type/status_code 是结构化元数据）；`lastError` 闭包捕获不抑制原始 throw；`thoughtsTokenCount` 值 0 有意义（测试验证），undefined 时 omit。12 新测试。 |
| [#4694](https://github.com/QwenLM/qwen-code/pull/4694) | 压缩重放设计合理；resume 后环淘汰间隙未覆盖 + O(turns) 无界增长 | turn-boundary 压缩引擎、同步 snapshot、slot 压缩、`liveJournal`、向后兼容可选字段全落地。核心压缩逻辑（文本合并、tool 折叠、slot 排序、transient 过滤）正确；但 (1) resume 路径仅返回 `lastEventId`，若 ring 淘汰了上一完整 turn 与 resume 之间的事件，客户端丢失该段状态； |
| [#4702](https://github.com/QwenLM/qwen-code/pull/4702) | ring_evicted resync 自动恢复 transcript，逻辑正确 | `store.reset()` 提升到 reason 分支前、错误信息简化、测试更新，全部对应。 ring_evicted 流程：reducer 置 `awaitingResync` + 加错误块 → provider `store.reset()` 清除闩+错误 → replay 帧重建 transcript。无 `setLastEventId(0)`（epoch 不变，正确）。reset 在 effect 回调中同步执行，无并发问题。 |
| [#4703](https://github.com/QwenLM/qwen-code/pull/4703) | 非流式请求显式 stream:false，最小安全修复 | `pipeline.ts:331` else 分支加 `stream: false`。 流式路径不变（仍 `stream: true` + `stream_options`）；最小安全修复。 |
| [#4730](https://github.com/QwenLM/qwen-code/pull/4730) | 补回合并丢失的 TelemetryRuntimeConfig 方法；删除已迁移的 6k 行旧测试 | 补回 2 个 `TelemetryRuntimeConfig` 接口方法 + 删除已迁移至 `acp-bridge/bridge.test.ts` 的 6184 行旧测试文件。 纯恢复性修复，无新逻辑。 |
| [#4731](https://github.com/QwenLM/qwen-code/pull/4731) | 补回合并丢失的 isForkSubagentEnabled；13 行 additive 修复 | 补回 `isForkSubagentEnabled()` 到 Config 接口 + 环境变量门控 + re-export。 13 行 additive 修复，完全匹配描述。 |
| [#4749](https://github.com/QwenLM/qwen-code/pull/4749) | 11 个 OTel metric 仪表盘，基数有界（~200 max）；17 测试 | 11 个 OTel metric 仪表（counter/histogram/observable gauge）全部在 diff 中。bridge 经 optional `metrics` 子对象解耦。 基数有界（~200 max time-series）；shutdown 路径 `forceFlushMetrics()` → `bridge.shutdown()` 链式正确。17 单测覆盖。 |
| [#4751](https://github.com/QwenLM/qwen-code/pull/4751) | ACP 子进程生命周期优化（skip relaunch+preheat+idle）；1852 行 benchmark 测试维护面大 + POSIX-only | skip relaunch + preheat + idle keep-alive 三项优化全落地；描述含架构图。核心逻辑（`getAcpMemoryArgs` cgroup 感知内存分配 + 16GB cap）正确； |
| [#4765](https://github.com/QwenLM/qwen-code/pull/4765) | compaction 引擎 parentToolCallId 保留；双路径 merge 设计正确；9 测试含 9-subagent 压力 | `TurnBoundaryCompactionEngine` 双路径 merge：subagent chunks 按 `(kind, parentToolCallId)` 索引，top-level 按连续同 kind。 tool call eviction 保留段边界；`seed()` 清除 in-flight 状态。9 新测试含 9-subagent 并发压力测试。本批最高质量修复。 |
| [#4774](https://github.com/QwenLM/qwen-code/pull/4774) | net -2194 行；提取共享 helper + 剥离 PR/commit 引用注释 | net -2194 行；两类改动：(1) 提取共享 helper（`resolveWithVote`/`requireSessionId`/`optionalField` 等）消除跨 ~20 文件重复；(2) 剥离所有 PR/issue/commit 引用注释、保留技术 WHY（约束/不变量/spec 引用如 `RFD #721`）。 机械重构，无行为变更。 |
| [#4811](https://github.com/QwenLM/qwen-code/pull/4811) | /remember /forget /dream ACP 实现正确，但合入错误分支 main（已 revert） | 三命令 ACP 模式实现完整。 实现正确但合入错误分支 `main`（应入 `daemon_mode_b_main`）；#4818 revert + #4819 re-land 修正。 |
| [#4812](https://github.com/QwenLM/qwen-code/pull/4812) | 给 daemon/web-shell 增加 session forking 能力，让客户端能从现有会话分叉出新 session。 | 新增 `POST /session/:id/branch`、bridge branch request/response 类型、唯一标题生成、`session_branched` 事件、SDK client/types/events 与 server 测试。 |
| [#4816](https://github.com/QwenLM/qwen-code/pull/4816) | 给 web-shell/daemon 会话补 `/settings` slash command，缩小与 TUI 命令面的差距。 | 接入 serve/ACP slash command 路径、settings 命令输出与 web-shell 消费链路，并更新相关命令、类型和测试文件。 |
| [#4817](https://github.com/QwenLM/qwen-code/pull/4817) | closed：HTTP rewind endpoints 初稿，目标是让 daemon/web-shell 触发会话 rewind。 | 初稿增加 rewind snapshot/execute 端点方向，但关闭后由 #4820 继续落地；本 PR 不作为最终实现统计。 |
| [#4818](https://github.com/QwenLM/qwen-code/pull/4818) | GitHub 生成的 #4811 revert，diff 完全互逆 | GitHub 生成的 revert，diff 完全互逆。 。 |
| [#4819](https://github.com/QwenLM/qwen-code/pull/4819) | v2 re-land：ACP 模式 fire-and-forget + argumentHint + try-catch；15 测试 | re-land + 改进：ACP 模式 `recordDream().catch(() => {})` fire-and-forget；`/forget` 加 `argumentHint`；`/dream` 和 `/forget` 加 try-catch。 15 单测覆盖三个命令文件。 |
| [#4820](https://github.com/QwenLM/qwen-code/pull/4820) | HTTP rewind 端点；结构化错误 409/400；`session_rewound` SSE 事件；向后兼容 targetTurnIndex | `GET /session/:id/rewind/snapshots` + `POST /session/:id/rewind` 全落地；结构化错误 `SessionBusyError`(409) / `InvalidRewindTargetError`(400)；ACP `errorKind` → typed bridge 错误映射；`session_rewound` SSE 事件。 |
| [#4822](https://github.com/QwenLM/qwen-code/pull/4822) | hooks 诊断端点（只读）；`Record<HookEventName>` 编译期穷举；/hooks ACP 模式 | `GET /workspace/hooks` + `GET /session/:id/hooks` 只读端点；hook 类型层次（Command/Http/Function/Prompt/Unknown）；`IDLE_HOOK_EVENTS` 用 `Record<HookEventName, ...>` 编译期穷举；`/hooks` 命令 ACP 模式。 无变更、无副作用；`workspace_hooks`/`session_hooks` 能力注册。12 文件跨 4 包。 |
| [#4826](https://github.com/QwenLM/qwen-code/pull/4826) | /directory ACP 重构；MessageActionReturn 输出；path 逗号分割修复；41 测试 | `/directory`（show + add）`supportedModes` 扩展 ACP；输出 `addItem` → `MessageActionReturn`；path 逗号分割修复。 config-null 守卫 + 沙箱拒绝 + 空参 usage hint。41 测试全绿。 |
| [#4832](https://github.com/QwenLM/qwen-code/pull/4832) | 增加 extensions 诊断 HTTP/ACP surface，让 daemon/web-shell 能查看扩展状态。 | 新增 workspace/session extensions diagnostic 端点、ACP `/extensions` 接线、capability/type/SDK surface，并补对应服务端测试。 |
