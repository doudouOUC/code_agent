# qwen-code PR 审查 · 2026-06-01 ~ 2026-06-07 (W23)

**审查方法**：逐个 PR 拉取 _关联 issue + PR 描述 + 代码 diff_，核对 (1) 描述↔实现 **一致性**；(2) 描述 **准确性**；(3) 代码 **正确性**。评级：✅ 良好 / ⚠️ 有出入或小隐患 / ❌ 明显不符。

> 说明：含 W22 漏收补录（#4658/#4661，创建于 05-31）。本周仍在进行中。

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
| [#4667](https://github.com/QwenLM/qwen-code/pull/4667) | open | ✅ | ✅ | bodyTimeout 可配置，55 测试全绿 |
| [#4689](https://github.com/QwenLM/qwen-code/pull/4689) | open | ✅ | ✅ | 并行 subAgent 文本流隔离，keyed/scalar 双路径正确 |
| [#4693](https://github.com/QwenLM/qwen-code/pull/4693) | open | ✅ | ✅ | llm_request span 补响应元数据，无 PII/secret 泄漏 |
| [#4694](https://github.com/QwenLM/qwen-code/pull/4694) | open | ✅ | ⚠️ | 压缩重放设计合理；resume 后环淘汰间隙未覆盖 + O(turns) 无界增长 |

**一致性**：✅7 / ⚠️2 / ❌0　　**正确性**：✅8 / ⚠️2 / ❌0

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
- **状态**: open | **关联 issue**: 无
- **一致性**: ✅ — config 字段 + undici Agent + sanitize + proxy 回退 + keepAliveTimeout 五项全落地。
- **描述准确性**: 准确，诚实披露了 no-proxy 用户的行为变更。
- **正确性**: ✅ — `sanitizeBodyTimeout` 处理 negative/float/NaN/Infinity/undefined 全回退 0；`noProxyDispatcherCache` 按 bodyTimeout keyed 防 Agent 膨胀；proxy 路径硬编码 `bodyTimeout:0` 并忽略用户配置；Bun 路径优雅降级。55 测试全绿。
- **结论**: 设计全面、测试充分、无问题。

### #4689 fix(daemon): isolate parallel subAgent text streams in transcript reducer
- **状态**: open | **关联 issue**: 无
- **一致性**: ✅ — per-parent keyed map 替代标量、六层修改（emit/tracker/types/normalizer/reducer/store）全对应。
- **描述准确性**: 准确，已知限制（WebUI renderer、global clear）诚实披露。
- **正确性**: ✅ — `appendTextDelta` 按 `parentToolCallId` 分流（keyed vs scalar），无交叉污染（T5 测试验证）；`finishAssistant` 遍历所有 keyed map 条目防 zombie spinner；`trimTranscriptState` 裁剪过期条目防内存泄漏。11 reducer + 4 normalizer 测试覆盖充分。
- **结论**: 并发隔离设计正确、测试到位。

### #4693 feat(telemetry): enrich llm_request span with response metadata and error details
- **状态**: open | **关联 issue**: 无
- **一致性**: ✅ — 6 个新属性 + GenAI semconv dual 全落地。
- **描述准确性**: 准确。
- **正确性**: ✅ — 无 PII/secret 泄漏（response_id 是 provider 请求 ID、finish_reason 是枚举、error_type/status_code 是结构化元数据）；`lastError` 闭包捕获不抑制原始 throw；`thoughtsTokenCount` 值 0 有意义（测试验证），undefined 时 omit。12 新测试。
- **结论**: 安全、正确的 span 补强。

### #4694 fix(daemon): compacted session replay for long-session recovery
- **状态**: open | **关联 issue**: 无
- **一致性**: ✅ — turn-boundary 压缩引擎、同步 snapshot、slot 压缩、`liveJournal`、向后兼容可选字段全落地。
- **描述准确性**: 准确（supersedes #4678 的声明经验证）。
- **正确性**: ⚠️ — 核心压缩逻辑（文本合并、tool 折叠、slot 排序、transient 过滤）正确；但 (1) **resume 路径仅返回 `lastEventId`**，若 ring 淘汰了上一完整 turn 与 resume 之间的事件，客户端丢失该段状态；(2) 压缩引擎 per-session、O(turns) 无上限增长，超长 session（数百 turn）可能显著。22 compaction + 20 EventBus + 19 SDK 测试覆盖。
- **结论**: 25-30× 体积缩减的设计权衡合理；resume 后环淘汰间隙 + 无界增长是已知的 v1 权衡。

---

## 重点跟进清单

### ⚠️ 需处理
1. **#4666**（已合并）：`btwUtils.ts` 的 shallow copy（`getHistoryTail(40, false)`）**仅在描述中，代码未落地**（仍为 `true` = deep clone）——需补一个 follow-up commit 或修正 PR 描述。

### 📝 建议
2. **#4661**：`SessionIdSpanProcessor.onStart` 的 `getCurrentSessionId()` 全局读在 daemon 多 session 下可能误归因——可考虑 ALS 化（如已有 `interactionContext`），或接受 best-effort。
3. **#4694**（open）：resume 路径不返 compactedReplay——若 ring eviction 发生在上一完整 turn 与 resume 之间，客户端有盲区。per-session 压缩引擎无 turn 上限——超长 session 的内存需关注。

---

_审查于 2026-06-03；方法：3 个并行只读子代理逐 PR 拉取 issue+描述+diff。_
