# Daemon 技术文档完善计划

## Context

PR #4412 的文档写于 `daemon_mode_b_main` 的某个快照。之后 `daemon_mode_b_main` 又合入了 ~30 个 daemon 相关 PR（包括 F3 权限协调、F4 resync/replay、runtime MCP add/remove、shell 命令执行、followup_suggestion、btw side-question、non-blocking prompt 等），导致文档中的数字和引用跟最新代码产生偏差。

本计划以 `origin/daemon_mode_b_main` HEAD 为事实来源，修正文档中与代码不一致的内容。

---

## 修改清单

### 1. 修正 `09-event-schema.md` — 函数名引用错误 + payload 字段 + ViewState 描述

**问题**：
- 全文引用 `narrowDaemonEvent(evt)`，但代码中该函数叫 `asKnownDaemonEvent(evt)`（`daemon_mode_b_main` 上同样如此）
- `workspace_initialized` 的 action 列为 `'created' | 'overwritten'`，实际代码是 `'created' | 'overwrote' | 'noop'`
- `DaemonSessionViewState` 描述使用了过时的字段名（`messages: HistoryItem[]`、`pendingPermissionRequests`、`mcpRestartHistory[]`、`latestPermissionResolution?`、`lastModelSwitchError?`）

**验证源**：`origin/daemon_mode_b_main:packages/sdk-typescript/src/daemon/events.ts`

**修改**：
1. 全文替换 `narrowDaemonEvent` → `asKnownDaemonEvent`（出现在第 6、115、143、157、227 行附近，以及 00-index.md 第 143 行）
2. 修正 `workspace_initialized` payload：`'created' | 'overwritten'` → `'created' | 'overwrote' | 'noop'`
3. 重写 `DaemonSessionViewState` 字段列表，对齐 `daemon_mode_b_main` 的实际接口（包含 `pendingPermissions: Record<...>`、`mcpRestartCount` / `lastMcpRestart?` / `mcpRestartRefusedCount` / `lastMcpRestartRefused?`、`permissionVoteProgress`、`forbiddenVotes`、`forbiddenVoteCount`、`awaitingResync`、`resyncRequiredCount`、`lastFollowupSuggestion?`、`lastTurnComplete?`、`lastTurnError?`）

### 2. 修正 `11-capabilities-versioning.md` — tag 数量过时

**问题**：
- 文档称 "38 个 tag"，实际 `daemon_mode_b_main` 有 ~54 个
- 新增 tag 未列出：`workspace_agent_generate`、`session_context_usage`、`session_tasks`、`session_stats`、`workspace_mcp_manage`、`mcp_server_runtime_mutation`、`session_recap`、`session_btw`、`allow_origin`、`prompt_absolute_deadline`、`writer_idle_timeout`、`non_blocking_prompt` 等
- 条件 tag 从 3 个增长到 6 个（新增 `allow_origin`、`prompt_absolute_deadline`、`writer_idle_timeout`）

**验证源**：`origin/daemon_mode_b_main:packages/cli/src/serve/capabilities.ts`

**修改**：
1. 更新 "38 个 tag" 为实际数量
2. 在按域分组列表中补入新 tag
3. 更新 `CONDITIONAL_SERVE_FEATURES` 代码块从 3 条改为 6 条
4. 更新条件 tag 描述从 "三个 tag" 改为 "六个 tag"

### 3. 修正 `00-index.md` — 事件数、函数名、tui.md 状态

**问题**：
- 第 111 行 "29 种已知事件" → 实际 38 种
- 第 122 行 "29 种 UI 友好事件" → 已增长
- 第 143 行引用 `narrowDaemonEvent` → 应为 `asKnownDaemonEvent`
- 第 139 行声称 `tui.md` "草案已删除"，但文件仍存在

**修改**：
1. 更新事件数
2. 修正函数名引用
3. 修正 tui.md 状态描述（改为 "已过时，请参考 14-cli-tui-adapter.md"）

### 4. 修正 `04-permission-mediation.md` — 标注实现状态

**问题**：
- 文档以 `MultiClientPermissionMediator` 实现为视角编写，但该类在 `daemon_mode_b_main` 上存在（`packages/acp-bridge/src/permissionMediator.ts`），验证通过
- 但 `permission_partial_vote`、`permission_forbidden` 事件仅在 `consensus` / `designated` / `local-only` 策略下触发，而当前只有 `first-responder` 是默认激活的
- 无需大改，但应在概览段落中明确标注：只有 `first-responder` 是默认策略，其他三种需要通过 `policy.permissionStrategy` 显式配置

**修改**：
- 在概览第一段或配置表中增加提示：当前默认策略为 `first-responder`

### 5. 修正 `18-error-taxonomy.md` — Bridge 错误表漏 `MissingCliEntryError`

**问题**：
- bridge 表列了 19 行（含 BridgeChannelClosedError 和 BridgeTimeoutError），但 `status.ts` 还有一个 `MissingCliEntryError`
- 需确认是否缺失

**验证源**：`origin/daemon_mode_b_main:packages/acp-bridge/src/status.ts`

**修改**：
- 如确认缺失，补一行 `MissingCliEntryError`

### 6. 更新 `daemon-client-adapters/tui.md` — 标注过时

**问题**：
- 文件仍存在（97 行），描述已删除的 `DaemonTuiAdapter`
- 00-index.md 声称已删除，但实际未删除

**修改**：
- 在文件顶部添加醒目的弃用通知，指向 `14-cli-tui-adapter.md`

---

## 实施顺序

1. `09-event-schema.md` — 影响最大，多处引用错误
2. `00-index.md` — 传播性修正
3. `11-capabilities-versioning.md` — 数量对齐
4. `04-permission-mediation.md` — 小补充
5. `18-error-taxonomy.md` — 小补充
6. `daemon-client-adapters/tui.md` — 状态标注

## 验证方式

- 每处修改对照 `git show origin/daemon_mode_b_main:<file>` 验证
- 检查所有 `narrowDaemonEvent` 引用已替换
- 检查事件数/tag 数与代码一致

## Final Implementation Status

- **PR status**: #4412 — OPEN (not yet merged), title: "docs(developers): add daemon-mode developer deep-dive documentation set"
- **What was implemented**: PR #4412 is a large documentation PR (25 files) that creates/updates the full daemon developer documentation set. This plan specifically targets corrections to align that doc set with the actual `daemon_mode_b_main` code.
- **Key divergences**: The plan focuses on 6 targeted corrections (function name renames, field updates, event/tag count fixes, deprecation notices). The PR itself is the initial doc set creation; these corrections appear to be incorporated into the same PR as iterative review fixes rather than a separate follow-up.
- **Files actually changed (PR #4412)**: `docs/developers/daemon/00-index.md` through `20-quickstart-operations.md` (full 00-20 doc set), `docs/developers/daemon/_meta.ts`, `docs/developers/_meta.ts`, `docs/developers/daemon-client-adapters/tui.md`, `docs/developers/qwen-serve-protocol.md`
