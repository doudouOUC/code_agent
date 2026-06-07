# qwen-code PRs · 2026-06-01 ~ 2026-06-07  (W23 最终版)

**主题**: daemon 修复（btw 泄漏/transcript 隔离/compaction/resync）、ACP 命令扩展（rewind/hooks/directory/remember）、telemetry metrics + 响应元数据、大规模重构

**统计**: 24 PRs — 19 merged / 2 open / 3 closed  
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
| #4812 | 🟡 open | feat(serve): add POST /session/:id/branch for session forking | +345/-3 | 14 | 06-05 | — | https://github.com/QwenLM/qwen-code/pull/4812 |
| #4816 | 🟡 open | feat(serve): add /settings slash command for web-shell | +1103/-8 | 27 | 06-06 | — | https://github.com/QwenLM/qwen-code/pull/4816 |
| #4817 | ⬜ closed | feat(serve): add HTTP rewind endpoints for daemon/web-shell (issue #45 | +443/-13 | 15 | 06-06 | 06-06 | https://github.com/QwenLM/qwen-code/pull/4817 |
| #4818 | ✅ merged | Revert "feat(cli): enable /remember, /forget, /dream in ACP mode" | +43/-278 | 6 | 06-06 | 06-07 | https://github.com/QwenLM/qwen-code/pull/4818 |
| #4819 | ✅ merged | feat(cli): enable /remember, /forget, /dream in ACP mode | +302/-43 | 6 | 06-06 | 06-06 | https://github.com/QwenLM/qwen-code/pull/4819 |
| #4820 | ✅ merged | feat(serve): add HTTP rewind endpoints for daemon/web-shell (issue #45 | +474/-14 | 16 | 06-06 | 06-07 | https://github.com/QwenLM/qwen-code/pull/4820 |
| #4822 | ✅ merged | feat(serve): add hooks diagnostic HTTP/ACP surface (issue #4514 T3.9) | +681/-4 | 15 | 06-06 | 06-07 | https://github.com/QwenLM/qwen-code/pull/4822 |
| #4826 | ✅ merged | feat(cli): enable /directory command in ACP mode | +350/-267 | 2 | 06-06 | 06-07 | https://github.com/QwenLM/qwen-code/pull/4826 |

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
- **仍 open**：#4812（session forking）、#4816（/settings 命令），仍在开发中。
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