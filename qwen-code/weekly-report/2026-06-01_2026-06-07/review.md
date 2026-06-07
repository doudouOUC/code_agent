# qwen-code PR 审查 · 2026-06-01 ~ 2026-06-07 (W23)

**审查方法**：逐个 PR 拉取 _关联 issue + PR 描述 + 代码 diff_，核对 (1) 描述↔实现 **一致性**；(2) 描述 **准确性**；(3) 代码 **正确性**。评级：✅ 良好 / ⚠️ 有出入或小隐患 / ❌ 明显不符。

> 说明：含 W22 漏收补录（#4658/#4661，创建于 05-31）。全部 23 PR 已审查完毕（首批 11 + 补充 12）。

---

## 汇总

| PR | 状态 | 一致性 | 正确性 | 一句话 |
|---|---|---|---|---|
| [#4658](https://github.com/QwenLM/qwen-code/pull/4658) | merged | ⚠️ | ✅ | MCP 超时耦合正确；描述虚报 barrel re-export + README |
| [#4661](https://github.com/QwenLM/qwen-code/pull/4661) | merged | ✅ | ⚠️ | per-prompt traceId 架构合理；daemon 多 session 下 SessionIdSpanProcessor 理论竞态 |
| [#4666](https://github.com/QwenLM/qwen-code/pull/4666) | merged | ⚠️ | ✅ | btw 修复 4/5 项到位；**shallow copy 项仅在描述中、代码未落地** |
| [#4682](https://github.com/QwenLM/qwen-code/pull/4682) | merged | ✅ | ✅ | daemon telemetry 路由覆盖扩展，无基数问题 |
| [#4683](https://github.com/QwenLM/qwen-code/pull/4683) | closed | — | — | chore，未合并无代码 |
| [#4702](https://github.com/QwenLM/qwen-code/pull/4702) | merged | ✅ | ✅ | ring_evicted resync 自动恢复 transcript，逻辑正确 |
| [#4703](https://github.com/QwenLM/qwen-code/pull/4703) | merged | ✅ | ✅ | 非流式请求显式 stream:false，最小安全修复 |
| [#4667](https://github.com/QwenLM/qwen-code/pull/4667) | closed | ✅ | ✅ | bodyTimeout 可配置，55 测试全绿 |
| [#4689](https://github.com/QwenLM/qwen-code/pull/4689) | merged | ✅ | ✅ | 并行 subAgent 文本流隔离，keyed/scalar 双路径正确 |
| [#4693](https://github.com/QwenLM/qwen-code/pull/4693) | merged | ✅ | ✅ | llm_request span 补响应元数据，无 PII/secret 泄漏 |
| [#4694](https://github.com/QwenLM/qwen-code/pull/4694) | merged | ✅ | ⚠️ | 压缩重放设计合理；resume 后环淘汰间隙未覆盖 + O(turns) 无界增长 |

**一致性**（首批 11 PR）：✅8 / ⚠️2 / ❌0　　**正确性**：✅8 / ⚠️2 / ❌0

> 注：#4812（open，session forking）、#4816（open，/settings）未审查（仍在开发中）；#4817（closed，superseded by #4820，同标题）已被 #4820 取代，不单独审查。

### 补充审查（#4730-#4826，12 PR）

| PR | 状态 | 一致性 | 正确性 | 一句话 |
|---|---|---|---|---|
| [#4730](https://github.com/QwenLM/qwen-code/pull/4730) | merged | ✅ | ✅ | 补回合并丢失的 TelemetryRuntimeConfig 方法；删除已迁移的 6k 行旧测试 |
| [#4731](https://github.com/QwenLM/qwen-code/pull/4731) | merged | ✅ | ✅ | 补回合并丢失的 isForkSubagentEnabled；13 行 additive 修复 |
| [#4749](https://github.com/QwenLM/qwen-code/pull/4749) | merged | ✅ | ✅ | 11 个 OTel metric 仪表盘，基数有界（~200 max）；17 测试 |
| [#4751](https://github.com/QwenLM/qwen-code/pull/4751) | merged | ✅ | ⚠️ | ACP 子进程生命周期优化（skip relaunch+preheat+idle）；**1852 行 benchmark 测试维护面大 + POSIX-only** |
| [#4765](https://github.com/QwenLM/qwen-code/pull/4765) | merged | ✅ | ✅ | compaction 引擎 parentToolCallId 保留；双路径 merge 设计正确；9 测试含 9-subagent 压力 |
| [#4774](https://github.com/QwenLM/qwen-code/pull/4774) | merged | ✅ | ✅ | net -2194 行；提取共享 helper + 剥离 PR/commit 引用注释 |
| [#4811](https://github.com/QwenLM/qwen-code/pull/4811) | merged | ✅ | ⚠️ | /remember /forget /dream ACP 实现正确，**但合入错误分支 main**（已 revert） |
| [#4818](https://github.com/QwenLM/qwen-code/pull/4818) | merged | ✅ | ✅ | GitHub 生成的 #4811 revert，diff 完全互逆 |
| [#4819](https://github.com/QwenLM/qwen-code/pull/4819) | merged | ✅ | ✅ | v2 re-land：ACP 模式 fire-and-forget + argumentHint + try-catch；15 测试 |
| [#4820](https://github.com/QwenLM/qwen-code/pull/4820) | merged | ✅ | ✅ | HTTP rewind 端点；结构化错误 409/400；`session_rewound` SSE 事件；向后兼容 targetTurnIndex |
| [#4822](https://github.com/QwenLM/qwen-code/pull/4822) | merged | ✅ | ✅ | hooks 诊断端点（只读）；`Record<HookEventName>` 编译期穷举；/hooks ACP 模式 |
| [#4826](https://github.com/QwenLM/qwen-code/pull/4826) | merged | ✅ | ✅ | /directory ACP 重构；MessageActionReturn 输出；path 逗号分割修复；41 测试 |

**补充批一致性**：✅12 / ⚠️0 / ❌0　　**正确性**：✅10 / ⚠️2 / ❌0

---

## 逐 PR 明细

### #4658 fix(infra): enforce SDK/server MCP-restart timeout coupling
- **状态**: merged | **关联 issue**: #4330
- **一致性**: ⚠️ — `mcpTimeouts.ts` 新增 + bridge/SDK 导入共享常量均到位；但描述声称有 `index.ts` barrel re-export 和 `README.md` subpath 更新，两者不在变更列表中。
- **描述准确性**: 核心准确，两处虚报文件。
- **正确性**: ✅ — `300_000 + 30_000 = 330_000` 与旧硬编码值完全一致，零行为变更；esbuild 内联常量。
- **结论**: 编译时耦合消除文档耦合风险；描述有两处虚报文件不影响正确性。

### #4661 feat(telemetry): per-prompt traceId for bounded, renderable traces
- **状态**: merged | **关联 issue**: #4554（提及非 closing）
- **一致性**: ✅ — 五项变更全部体现：per-prompt traceId、`SessionIdSpanProcessor`、`ROOT_CONTEXT` 默认、`resolveParentContext` 简化、debugLogger fallback。`createSessionRootContext` 标记 `@deprecated` 保留兼容。
- **描述准确性**: 准确，含 ARMS 查询迁移指导。
- **正确性**: ⚠️ — `SessionIdSpanProcessor.onStart` 读模块级 `getCurrentSessionId()` 全局状态；daemon 多 session 并发时可能 stamp 错误 `session.id` 到自动插桩 HTTP span。但 ALS 路径已有独立归因，此处是 best-effort fallback，风险可控。
- **结论**: 设计合理，解决长 session trace 不可渲染问题；多 session 理论竞态影响有限。

### #4666 fix(daemon): btw cross-session leak + timeout + input cap + permission requestId cardinality
- **状态**: merged | **关联 issue**: 无（follow-up to #4610/#4628）
- **一致性**: ⚠️ — 描述列 5 项修复，但 **"btw shallow copy: `getHistoryTail(40, false)`" 未在 diff 中**；`btwUtils.ts` 当前仍为 `getHistoryTail(maxHistoryEntries, true)`（deep clone）。其余 4 项（cross-session leak、timeout、input cap、requestId cardinality）均落地。
- **描述准确性**: 4/5 准确，shallow copy 仅存于描述。
- **正确性**: ✅ — 已实现的 4 项均正确：移除 `getCacheSafeParams()` 回退；`childSignal.aborted` 替代不可靠的 `instanceof DOMException`（并修正 `RequestError.internalError` 参数顺序）；`BTW_MAX_INPUT_LENGTH` 统一三入口；`CLIENT_ID_RE` + 长度上限防基数爆炸。
- **结论**: 安全性改进到位，但 shallow copy 项虚报——需补实现或修正描述。

### #4682 feat(telemetry): expand daemon telemetry route coverage
- **状态**: merged | **关联 issue**: 无
- **一致性**: ✅ — 新增 9 条路由模式（recap/btw/model/shell/detach/approval-mode/metadata/sessions-delete/workspace 系列）+ 尾部斜杠归一化 + `[^/]+` regex 收紧，全部对应描述。
- **描述准确性**: 准确。heartbeat 排除属实。
- **正确性**: ✅ — 路由值全为静态模板（参数化占位），无原始 ID 泄入 span name；`[^/]+` 正确防止跨段匹配。
- **结论**: 干净的 telemetry 覆盖扩展，无基数问题。

### #4683 chore(integration): mark main merged for PR 4490
- **状态**: closed（未合并）
- 无代码变更，用于辅助 #4490 合并状态计算的 chore PR，已被关闭。

### #4702 fix(daemon): auto-recover transcript on ring_evicted resync
- **状态**: merged | **关联 issue**: 无
- **一致性**: ✅ — `store.reset()` 提升到 reason 分支前、错误信息简化、测试更新，全部对应。
- **描述准确性**: 准确。
- **正确性**: ✅ — ring_evicted 流程：reducer 置 `awaitingResync` + 加错误块 → provider `store.reset()` 清除闩+错误 → replay 帧重建 transcript。无 `setLastEventId(0)`（epoch 不变，正确）。reset 在 effect 回调中同步执行，无并发问题。
- **结论**: 正确修复了 WebUI 在 ring_evicted 后无法恢复 transcript 的问题。

### #4703 fix(core): explicitly set stream: false in non-streaming requests
- **状态**: merged | **关联 issue**: 无
- **一致性**: ✅ — `pipeline.ts:331` else 分支加 `stream: false`。
- **描述准确性**: 准确（根因：网关在字段缺失时默认 SSE）。
- **正确性**: ✅ — 流式路径不变（仍 `stream: true` + `stream_options`）；最小安全修复。
- **结论**: 一行修复，干净。

### #4667 fix(core): add configurable bodyTimeout to prevent streaming timeout with local models
- **状态**: closed | **关联 issue**: 无
- **一致性**: ✅ — config 字段 + undici Agent + sanitize + proxy 回退 + keepAliveTimeout 五项全落地。
- **描述准确性**: 准确，诚实披露了 no-proxy 用户的行为变更。
- **正确性**: ✅ — `sanitizeBodyTimeout` 处理 negative/float/NaN/Infinity/undefined 全回退 0；`noProxyDispatcherCache` 按 bodyTimeout keyed 防 Agent 膨胀；proxy 路径硬编码 `bodyTimeout:0` 并忽略用户配置；Bun 路径优雅降级。55 测试全绿。
- **结论**: 设计全面、测试充分、无问题。

### #4689 fix(daemon): isolate parallel subAgent text streams in transcript reducer
- **状态**: merged | **关联 issue**: 无
- **一致性**: ✅ — per-parent keyed map 替代标量、六层修改（emit/tracker/types/normalizer/reducer/store）全对应。
- **描述准确性**: 准确，已知限制（WebUI renderer、global clear）诚实披露。
- **正确性**: ✅ — `appendTextDelta` 按 `parentToolCallId` 分流（keyed vs scalar），无交叉污染（T5 测试验证）；`finishAssistant` 遍历所有 keyed map 条目防 zombie spinner；`trimTranscriptState` 裁剪过期条目防内存泄漏。11 reducer + 4 normalizer 测试覆盖充分。
- **结论**: 并发隔离设计正确、测试到位。

### #4693 feat(telemetry): enrich llm_request span with response metadata and error details
- **状态**: merged | **关联 issue**: 无
- **一致性**: ✅ — 6 个新属性 + GenAI semconv dual 全落地。
- **描述准确性**: 准确。
- **正确性**: ✅ — 无 PII/secret 泄漏（response_id 是 provider 请求 ID、finish_reason 是枚举、error_type/status_code 是结构化元数据）；`lastError` 闭包捕获不抑制原始 throw；`thoughtsTokenCount` 值 0 有意义（测试验证），undefined 时 omit。12 新测试。
- **结论**: 安全、正确的 span 补强。

### #4694 fix(daemon): compacted session replay for long-session recovery
- **状态**: merged | **关联 issue**: 无
- **一致性**: ✅ — turn-boundary 压缩引擎、同步 snapshot、slot 压缩、`liveJournal`、向后兼容可选字段全落地。
- **描述准确性**: 准确（supersedes #4678 的声明经验证）。
- **正确性**: ⚠️ — 核心压缩逻辑（文本合并、tool 折叠、slot 排序、transient 过滤）正确；但 (1) **resume 路径仅返回 `lastEventId`**，若 ring 淘汰了上一完整 turn 与 resume 之间的事件，客户端丢失该段状态；(2) 压缩引擎 per-session、O(turns) 无上限增长，超长 session（数百 turn）可能显著。22 compaction + 20 EventBus + 19 SDK 测试覆盖。
- **结论**: 25-30× 体积缩减的设计权衡合理；resume 后环淘汰间隙 + 无界增长是已知的 v1 权衡。

### #4730 fix: add missing TelemetryRuntimeConfig methods
- **状态**: merged | **关联 issue**: 无（#4490 合并回归）
- **一致性**: ✅ — 补回 2 个 `TelemetryRuntimeConfig` 接口方法 + 删除已迁移至 `acp-bridge/bridge.test.ts` 的 6184 行旧测试文件。
- **正确性**: ✅ — 纯恢复性修复，无新逻辑。

### #4731 fix: add missing isForkSubagentEnabled
- **状态**: merged | **关联 issue**: 无（#4490 合并回归）
- **一致性**: ✅ — 补回 `isForkSubagentEnabled()` 到 Config 接口 + 环境变量门控 + re-export。
- **正确性**: ✅ — 13 行 additive 修复，完全匹配描述。

### #4749 feat(telemetry): add daemon OTel metrics and structured log records
- **状态**: merged | **关联 issue**: 无
- **一致性**: ✅ — 11 个 OTel metric 仪表（counter/histogram/observable gauge）全部在 diff 中。bridge 经 optional `metrics` 子对象解耦。
- **正确性**: ✅ — 基数有界（~200 max time-series）；shutdown 路径 `forceFlushMetrics()` → `bridge.shutdown()` 链式正确。17 单测覆盖。

### #4751 feat(daemon): optimize ACP child lifecycle
- **状态**: merged | **关联 issue**: 无
- **一致性**: ✅ — skip relaunch + preheat + idle keep-alive 三项优化全落地；描述含架构图。
- **正确性**: ⚠️ — 核心逻辑（`getAcpMemoryArgs` cgroup 感知内存分配 + 16GB cap）正确；但 1852 行 benchmark 测试文件（`qwen-daemon-vs-cli-benchmark.test.ts`）虽有 `QWEN_BENCHMARK_ENABLED=1` 门控，维护面大且 POSIX-only（`ps`/`pgrep`/`/usr/bin/time`）。

### #4765 fix(daemon): preserve parentToolCallId in compaction engine
- **状态**: merged | **关联 issue**: 无
- **一致性**: ✅ — `TurnBoundaryCompactionEngine` 双路径 merge：subagent chunks 按 `(kind, parentToolCallId)` 索引，top-level 按连续同 kind。
- **正确性**: ✅ — tool call eviction 保留段边界；`seed()` 清除 in-flight 状态。9 新测试含 9-subagent 并发压力测试。本批最高质量修复。

### #4774 refactor(daemon): simplify code and strip PR/commit references
- **状态**: merged | **关联 issue**: 无
- **一致性**: ✅ — net -2194 行；两类改动：(1) 提取共享 helper（`resolveWithVote`/`requireSessionId`/`optionalField` 等）消除跨 ~20 文件重复；(2) 剥离所有 PR/issue/commit 引用注释、保留技术 WHY（约束/不变量/spec 引用如 `RFD #721`）。
- **正确性**: ✅ — 机械重构，无行为变更。

### #4811 feat(cli): enable /remember, /forget, /dream in ACP mode (v1)
- **状态**: merged | **关联 issue**: 无
- **一致性**: ✅ — 三命令 ACP 模式实现完整。
- **正确性**: ⚠️ — 实现正确但**合入错误分支 `main`**（应入 `daemon_mode_b_main`）；#4818 revert + #4819 re-land 修正。

### #4818 Revert /remember /forget /dream ACP
- **状态**: merged | **关联 issue**: #4811 回退
- **一致性**: ✅ — GitHub 生成的 revert，diff 完全互逆。
- **正确性**: ✅。

### #4819 feat(cli): enable /remember, /forget, /dream in ACP mode (v2)
- **状态**: merged | **关联 issue**: 无
- **一致性**: ✅ — re-land + 改进：ACP 模式 `recordDream().catch(() => {})` fire-and-forget；`/forget` 加 `argumentHint`；`/dream` 和 `/forget` 加 try-catch。
- **正确性**: ✅ — 15 单测覆盖三个命令文件。

### #4820 feat(serve): add HTTP rewind endpoints
- **状态**: merged | **关联 issue**: #4514 T3.2
- **一致性**: ✅ — `GET /session/:id/rewind/snapshots` + `POST /session/:id/rewind` 全落地；结构化错误 `SessionBusyError`(409) / `InvalidRewindTargetError`(400)；ACP `errorKind` → typed bridge 错误映射；`session_rewound` SSE 事件。
- **正确性**: ✅ — 向后兼容（同时接受 `promptId` 和 legacy `targetTurnIndex`）；SDK 类型+客户端方法完整。

### #4822 feat(serve): add hooks diagnostic HTTP/ACP surface
- **状态**: merged | **关联 issue**: #4514 T3.9
- **一致性**: ✅ — `GET /workspace/hooks` + `GET /session/:id/hooks` 只读端点；hook 类型层次（Command/Http/Function/Prompt/Unknown）；`IDLE_HOOK_EVENTS` 用 `Record<HookEventName, ...>` 编译期穷举；`/hooks` 命令 ACP 模式。
- **正确性**: ✅ — 无变更、无副作用；`workspace_hooks`/`session_hooks` 能力注册。12 文件跨 4 包。

### #4826 feat(cli): enable /directory command in ACP mode
- **状态**: merged | **关联 issue**: #4514 T3.10
- **一致性**: ✅ — `/directory`（show + add）`supportedModes` 扩展 ACP；输出 `addItem` → `MessageActionReturn`；path 逗号分割修复。
- **正确性**: ✅ — config-null 守卫 + 沙箱拒绝 + 空参 usage hint。41 测试全绿。
- **已知权衡**: 混合成功+失败结果用 `messageType: 'error'`——单 `MessageActionReturn` 无法表达混合严重级。

---

## 重点跟进清单

### ⚠️ 需处理
1. **#4666**（已合并）：`btwUtils.ts` 的 shallow copy（`getHistoryTail(40, false)`）**仅在描述中，代码未落地**（仍为 `true` = deep clone）——需补一个 follow-up commit 或修正 PR 描述。

### 📝 建议
2. **#4661**：`SessionIdSpanProcessor.onStart` 的 `getCurrentSessionId()` 全局读在 daemon 多 session 下可能误归因——可考虑 ALS 化（如已有 `interactionContext`），或接受 best-effort。
3. **#4694**（已合并）：resume 路径不返 compactedReplay——若 ring eviction 发生在上一完整 turn 与 resume 之间，客户端有盲区。per-session 压缩引擎无 turn 上限——超长 session 的内存需关注。
4. **#4751**（已合并）：1852 行 benchmark 测试（`qwen-daemon-vs-cli-benchmark.test.ts`）仅 POSIX 可用（`ps`/`pgrep`/`/usr/bin/time`）、维护面大——考虑标记 `@platform posix` 或瘦身。
5. **#4811→#4818→#4819 分支靶错误**：#4811 误入 `main` → revert → re-land。建议 CI 或 PR 模板增加 branch-target 验证。

---

_审查于 2026-06-03（明细段状态 2026-06-05 更新；补充审查 #4730-#4826 于 2026-06-07）；方法：并行只读子代理逐 PR 拉取 issue+描述+diff。_
