# qwen-code PRs · 2026-06-08 ~ 2026-06-14  (W24 最终版)

**主题**: daemon rate limiting、prompt queue backpressure、direct shell opt-in、tool result 持久化、telemetry TRACEPARENT、workspace reload、rewind 测试补强、file history snapshot 持久化、Agent 权限弹窗、tool call id 修复、截断 diff 回放修复、active tool result history budget

**统计**: 23 PRs — 20 merged / 0 open / 3 closed
**代码量**: +12,419 / -1,989，256 个文件变更 _(不含 closed #4886/#4986/#5056)_
**类型**: feat ×9, fix ×9, refactor ×1, chore ×1, test ×1, docs ×1, merge ×1
**范围 (scope)**: core ×6, daemon ×5, serve ×3, telemetry ×2, acp ×2, cli ×1, test ×1, docs ×1, other ×2

**本周最大改动**:
- [#5033](https://github.com/QwenLM/qwen-code/pull/5033) (+1677/-89, 24 files) fix(serve): Add prompt queue backpressure
- [#5107](https://github.com/QwenLM/qwen-code/pull/5107) (+1483/-49, 19 files) fix(core): Repair duplicate tool call IDs
- [#4862](https://github.com/QwenLM/qwen-code/pull/4862) (+1268/-505, 10 files) feat(test): add daemon connection stress test + refactor perf harness

| PR | 状态 | 标题 | 变更 | 文件 | 创建 | 合并/关闭 | 链接 |
|---|---|---|---|---|---|---|---|
| #4861 | ✅ merged | feat(serve): add per-tier HTTP rate limiting for daemon (issue #4514 T3.4) | +1051/-1 | 8 | 06-08 | 06-08 | https://github.com/QwenLM/qwen-code/pull/4861 |
| #4862 | ✅ merged | feat(test): add daemon connection stress test + refactor perf harness | +1268/-505 | 10 | 06-08 | 06-08 | https://github.com/QwenLM/qwen-code/pull/4862 |
| #4871 | ✅ merged | refactor(core): remove GitService, migrate /restore to FileHistoryService | +170/-733 | 31 | 06-08 | 06-09 | https://github.com/QwenLM/qwen-code/pull/4871 |
| #4886 | ⬜ closed | merge: resolve conflicts with origin/main | +33833/-3651 | 351 | 06-09 | 06-09 | https://github.com/QwenLM/qwen-code/pull/4886 |
| #4897 | ✅ merged | feat(core): persist file history snapshots for cross-session /rewind (T2.1) | +375/-19 | 13 | 06-09 | 06-12 | https://github.com/QwenLM/qwen-code/pull/4897 |
| #4906 | ✅ merged | feat(telemetry): inject TRACEPARENT env var into shell child processes | +463/-104 | 11 | 06-09 | 06-10 | https://github.com/QwenLM/qwen-code/pull/4906 |
| #4924 | ✅ merged | feat(daemon): add POST /workspace/reload-env for hot-reloading env vars and session auth | +446/-17 | 17 | 06-10 | 06-10 | https://github.com/QwenLM/qwen-code/pull/4924 |
| #4954 | ✅ merged | fix(serve): isolate per-session stats in daemon mode | +275/-55 | 10 | 06-10 | 06-11 | https://github.com/QwenLM/qwen-code/pull/4954 |
| #4965 | ✅ merged | feat(daemon): add POST /workspace/reload for unified settings hot-reload | +213/-129 | 14 | 06-10 | 06-11 | https://github.com/QwenLM/qwen-code/pull/4965 |
| #4986 | ⬜ closed | chore: Merge main into daemon_mode_b_main | +28121/-974 | 201 | 06-11 | 06-11 | https://github.com/QwenLM/qwen-code/pull/4986 |
| #5006 | ✅ merged | fix(daemon): Sanitize logs and type MCP restarts | +185/-11 | 9 | 06-11 | 06-12 | https://github.com/QwenLM/qwen-code/pull/5006 |
| #5031 | ✅ merged | feat(daemon): gate direct session shell behind explicit opt-in | +1146/-37 | 21 | 06-12 | 06-12 | https://github.com/QwenLM/qwen-code/pull/5031 |
| #5033 | ✅ merged | fix(serve): Add prompt queue backpressure | +1677/-89 | 24 | 06-12 | 06-13 | https://github.com/QwenLM/qwen-code/pull/5033 |
| #5042 | ✅ merged | feat(core): persist oversized tool results to disk (#4095 Phase 4) | +489/-3 | 10 | 06-12 | 06-12 | https://github.com/QwenLM/qwen-code/pull/5042 |
| #5044 | ✅ merged | test(cli): Cover rewind selection and confirm flow | +453/-0 | 2 | 06-12 | 06-13 | https://github.com/QwenLM/qwen-code/pull/5044 |
| #5047 | ✅ merged | fix(telemetry): Propagate daemon ACP trace context | +225/-34 | 7 | 06-12 | 06-12 | https://github.com/QwenLM/qwen-code/pull/5047 |
| #5056 | ⬜ closed | docs: Refresh daemon developer docs | +4788/-1 | 24 | 06-12 | 06-12 | https://github.com/QwenLM/qwen-code/pull/5056 |
| #5057 | ✅ merged | fix(core): Persist file history snapshot updates | +1206/-30 | 12 | 06-12 | 06-13 | https://github.com/QwenLM/qwen-code/pull/5057 |
| #5085 | ✅ merged | fix(acp): add internal Kind.Agent, keep ACP wire on 'other' (no-regression) | +15/-3 | 6 | 06-13 | 06-14 | https://github.com/QwenLM/qwen-code/pull/5085 |
| #5105 | ✅ merged | feat(acp): dedicated agent permission dialog via _meta.toolName (follow-up to #5085) | +251/-5 | 14 | 06-14 | 06-14 | https://github.com/QwenLM/qwen-code/pull/5105 |
| #5107 | ✅ merged | fix(core): Repair duplicate tool call IDs | +1483/-49 | 19 | 06-14 | 06-14 | https://github.com/QwenLM/qwen-code/pull/5107 |
| #5108 | ✅ merged | fix(daemon): Avoid replaying truncated session diffs | +239/-16 | 6 | 06-14 | 06-14 | https://github.com/QwenLM/qwen-code/pull/5108 |
| #5111 | ✅ merged | fix(core): Bound active tool result history | +789/-149 | 12 | 06-14 | 06-15 | https://github.com/QwenLM/qwen-code/pull/5111 |

---

## PR 解决问题与实现方式

> 来源：merged diff、文件列表、patch 和当前状态；GitHub PR body 只作为目标线索。这里压缩成“解决了什么问题 / 怎么做的”，便于快速阅读。

| PR | 解决了什么问题 | 怎么做的 |
|---|---|---|
| [#4861](https://github.com/QwenLM/qwen-code/pull/4861) | 为 `qwen serve` 增加可选的分层 HTTP rate limit，保护 daemon HTTP 面。 | 新增 `rateLimit.ts` token bucket 和 Express middleware，CLI/配置接入 `--rate-limit`，按 prompt / mutation / read 三档限流；health、SSE、heartbeat、ACP 豁免，异常 fail-open，测试覆盖 bucket refill、分层 key 和路由豁免。 |
| [#4862](https://github.com/QwenLM/qwen-code/pull/4862) | 补 daemon 连接压力测试，并整理 perf/baseline 测试 harness。 | 抽出 `_daemon-harness`、benchmark/report helper 和 mock ACP child；新增 `QWEN_LOADTEST_ENABLED=1` 门控的连接、prompt、SSE、crash recovery、resource snapshot 场景，避免默认 CI 跑重型压力测试。 |
| [#4871](https://github.com/QwenLM/qwen-code/pull/4871) | 移除 shadow-git `GitService`，把 `/restore` 统一迁到 `FileHistoryService`。 | 删除 GitService 配置/注册/docs，`/restore` 改读 file history snapshot；同时修正 edit 工具 checkpoint 使用 stale tool name 的问题，并把相关测试迁到 FileHistoryService 口径。 |
| [#4886](https://github.com/QwenLM/qwen-code/pull/4886) | 一次 merge/conflict-resolution PR，最终关闭，未作为独立功能落地。 | 用于尝试同步 `origin/main` 冲突；没有形成稳定功能面，关闭后不计入代码量汇总，只在表格中保留历史记录。 |
| [#4897](https://github.com/QwenLM/qwen-code/pull/4897) | 持久化 file history snapshots，让 `/rewind` 在 session resume 后仍可用。 | 新增 `file_history_snapshot` JSONL system record，序列化/反序列化 `FileHistorySnapshot`；resume 时恢复到 `FileHistoryService`，并覆盖旧日志兼容、空 snapshot、跨 session 恢复等路径。 |
| [#4906](https://github.com/QwenLM/qwen-code/pull/4906) | 把 W3C `TRACEPARENT` 注入 shell 子进程，扩展链路追踪到 bash/hooks/monitor。 | 抽出共享 `trace-context.ts`，shell spawn env 按 `outboundCorrelation.propagateTraceContext` 注入；补配置 schema、sanitize/NOOP 传播守卫和 focused telemetry/shell 测试。 |
| [#4924](https://github.com/QwenLM/qwen-code/pull/4924) | 新增 env-only hot reload 端点，允许 daemon 不重启刷新 `.env`/`settings.env` 和 idle session auth。 | 实现 `POST /workspace/reload-env`、SDK `reloadEnv()`、`workspace_reload_env` capability 和 `env_reloaded` SSE；通过 workspace service 重新加载 env/auth 状态，后续由 #4965 的统一 reload 覆盖。 |
| [#4954](https://github.com/QwenLM/qwen-code/pull/4954) | 修复 daemon 多 session 下 `/session/:id/stats` 返回进程全局统计的问题。 | `UiTelemetryService` 双写全局与 per-session metrics；ACP stats 改按 sessionId 读取，session cleanup 时移除 per-session 指标，测试覆盖多 session 隔离和旧全局行为。 |
| [#4965](https://github.com/QwenLM/qwen-code/pull/4965) | 用统一 `POST /workspace/reload` 替代 env-only reload，支持 daemon 设置热加载。 | workspace service / acpAgent 统一应用 env、model providers、model、credentials、tools、approval、memory、system instruction 的 diff reload，发 reload 事件并保留 #4924 的 env-only 兼容入口。 |
| [#4986](https://github.com/QwenLM/qwen-code/pull/4986) | daemon 分支同步 main 的 chore PR，最终关闭。 | 用于批量合并 main 变更到 `daemon_mode_b_main`；关闭后不作为独立功能统计，表格仅保留同步尝试和代码规模。 |
| [#5006](https://github.com/QwenLM/qwen-code/pull/5006) | 补 daemon 小修：清理日志注入风险，并补齐 pooled MCP restart 的 SDK/web-shell 类型。 | session-delete stderr 做单行脱敏，SDK `restartMcpServer` 转发 `entryIndex` 并暴露 pooled `entries[]` result，web-shell dialog 同时适配单项和池化返回。 |
| [#5031](https://github.com/QwenLM/qwen-code/pull/5031) | 把 direct session shell 改成显式 opt-in 能力，降低 daemon 高风险命令入口默认暴露面。 | 新增 `--enable-session-shell`，且必须同时配置 bearer token；REST/ACP/bridge 三层统一检查 enabled、token、session-bound client id，未启用时隐藏 capability 和 ACP method。 |
| [#5033](https://github.com/QwenLM/qwen-code/pull/5033) | 给 `qwen serve` 增加按 session 的 prompt admission backpressure，避免单 session 无限堆积已接受 prompt。 | bridge 维护默认 5 个 pending prompt 上限并同步拒绝；REST 返回 `503` + `Retry-After` + `prompt_queue_full`，ACP 映射结构化 JSON-RPC 错误，capabilities/CLI/SDK 增加 limit 配置和本地 reservation。 |
| [#5042](https://github.com/QwenLM/qwen-code/pull/5042) | 将超大工具结果落盘，避免大输出撑爆上下文或内存。 | 超过 28K 字符的工具结果写入 `tool-results/<callId>.txt`；上下文只保留 `<persisted-output>` stub、2KB 预览和文件指针，并加 24h 清理、会话磁盘预算和相关 schema/test。 |
| [#5044](https://github.com/QwenLM/qwen-code/pull/5044) | 补 rewind selector 和 confirm flow 的回归测试，覆盖过去主要靠手工验证的路径。 | 新增 selector 导航/取消、restore fallback、restoring 按键 guard，以及 code/conversation/both/no-client/compressed/file-restore-failure 等 confirm 分支测试，不改运行时代码。 |
| [#5047](https://github.com/QwenLM/qwen-code/pull/5047) | 修 daemon 到 ACP 的 trace context 贯通，方便还原 HTTP span → bridge span → ACP child interaction 链路。 | 从 active daemon bridge span 派生 ACP prompt metadata `traceparent`，把 promptId 写回 request span，修 deferred span 的 session id 归因，并补 daemon tracing/Session 测试。 |
| [#5056](https://github.com/QwenLM/qwen-code/pull/5056) | 刷新 daemon Developer Guide 文档草案，但最终关闭，未作为独立文档 PR 合入。 | 新增 `docs/developers/daemon/00-20`、导航 meta，并修正 daemon adapter 草案；覆盖 serve runtime、ACP bridge、MCP pool、capabilities、SDK/UI/adapters、配置、错误和观测等，关闭后只作为后续文档整理参考。 |
| [#5057](https://github.com/QwenLM/qwen-code/pull/5057) | 让 file history snapshot 在单轮 edit/write 后立即持久化，避免进程在下一轮 snapshot 前退出导致 resume 后 `/rewind` 丢最后一轮文件历史。 | `trackEdit` 真正新增或修复备份后追加记录最新 `file_history_snapshot`；保持 append-only payload 和按 promptId last-wins 恢复模型，补 core client/session/chat recording/ACP tests 和 E2E 计划。 |
| [#5085](https://github.com/QwenLM/qwen-code/pull/5085) | 给 Agent/sub-agent 工具保留内部 `Kind.Agent` 分类，但避免把不存在的 ACP `agent` kind 发到线协议上导致 daemon Zod 校验丢帧。 | Agent 工具内部返回 `Kind.Agent`，`ToolCallEmitter.mapToolKind` 对外仍映射协议合法的 `other`；回退 WebUI/web-shell/Java SDK 等依赖 `agent` wire kind 的消费侧改动，锁定 no-regression 单测。 |
| [#5105](https://github.com/QwenLM/qwen-code/pull/5105) | 在不改 ACP `kind` 的前提下，为 Agent 权限请求恢复专属 “Launch this agent?” UI。 | `Session.ts` 在 `session/request_permission` 的 `toolCall._meta.toolName` 镜像规范工具名；VS Code `PermissionDrawer` 和 daemon web-shell `ToolApproval` 读取 `_meta.toolName === 'agent'` 后展示 agent 专属标题与描述。 |
| [#5107](https://github.com/QwenLM/qwen-code/pull/5107) | 修复 OpenAI-compatible provider 复用或 replay `tool_call.id` 时引发的重复 tool result、payload 膨胀和 provider 校验错误。 | 新增 `toolCallIdUtils`，同 turn 重复 id 只执行一次，跨 turn 复用 raw id 加 suffix；OpenAI parser/converter 出站前清理为一组 assistant call + 相邻 tool result，并给 core scheduler、non-interactive、AgentCore、ACP Session、speculation 补执行守卫。 |
| [#5108](https://github.com/QwenLM/qwen-code/pull/5108) | 避免 saved-session 回放时把已截断 edit/write diff 当作 raw output 再次回放，减少 web-shell 误渲染完整 diff 的风险。 | daemon replay 对截断 diff 只发 preview content，不再塞 raw output；web-shell transcript adapter 保留规范化 tool content，`ToolGroup` 忽略已截断 raw diff fallback，并在无 diff 时展示省略预览。 |
| [#5111](https://github.com/QwenLM/qwen-code/pull/5111) | 为 active tool result history 增加累计字符预算，避免多轮大型工具结果在 provider history 中持续膨胀。 | 新增 `context.clearContextOnIdle.toolResultsTotalCharsThreshold`（默认 500000，`-1` 禁用）；provider request 前把 pending ToolResult 当虚拟尾部计入总量，超过阈值就用现有 microcompaction 清理较早 compactable results，保留近期结果；同时更新 settings schema、用户文档和 focused tests，已于 06-15 合入。 |

## 最终实现文档

> 2026-06-30 对照 GitHub 当前 PR changed files 和 patch 重新整理。已建立深读记录的 PR，其完整中文最终实现文档放在本周 `implementations/` 目录。

- 已按最终实现校准：#4861、#4862、#4871、#4897、#4906、#4924、#4954、#4965、#5006、#5031、#5033、#5057
- 直接按 merged diff / closed 状态写入正文：#5042、#5044、#5047、#5056、#5085、#5105、#5107、#5108、#5111；#4886/#4986 为关闭的 merge/chore PR，只保留未落地说明

_W24 最终版 · 状态回填于 2026-06-16_
