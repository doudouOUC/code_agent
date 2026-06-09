# F3 实施期间的开放问题（带后问用户）

## Q1 — 用户消息里 "[Pasted text #1 +5 lines]" 的内容缺失

用户的指令是："设置一个每 10min 的定时任务，看 pr 中 **[Pasted text #1 +5 lines]** 这三部分，然后判断是否需要采纳..."

但 `[Pasted text #1 +5 lines]` 是粘贴占位符，实际内容**没传到 Claude**——所以"这三部分"具体指 PR 的哪三块不清楚。我**默认猜测**为：

1. **GitHub Actions / CI checks**（`gh pr checks`）
2. **Inline review comments**（`gh api repos/.../pulls/N/comments`）
3. **Top-level PR reviews**（`gh api repos/.../pulls/N/reviews`）

如果用户指的是别的（比如：Copilot 自动 review / wenshao 评论 / DeepSeek bot / 某个特定的 GH Actions workflow），需要回头校准 cron 任务的 prompt。

## Q2 — F1 PR #4319 实际未 merge 的影响

整个 F3 plan 假设 F1 已 merge，但实际 daemon_mode_b_main 头还在 F1 之前（commit `066cab229`）。我在 worktree 当前分支 `worktree-fluttering-coalescing-kettle`（HEAD `078bee639`，origin/main）上做。

- `httpAcpBridge.ts` 还是 pre-F1 的整体（尚未 shrunk to 97-line shim）。
- F3 的 Commit 3 直接改 `httpAcpBridge.ts`，会与未来 F1 merge 后产生冲突。
- 当前操作：F3 的代码物理上写在 pre-F1 的 `httpAcpBridge.ts` 上；future rebase 时合并冲突需要解决。

是否需要先把 F3 PR 标 "depends on F1 #4319"，blocked 直到 F1 merge？

## Q3 — Commit 1 review 中 type-design-analyzer 提议但仅文档化的项

- `PermissionResolutionRecord` 加 `resolverClientId` + `resolvedAtMs` 用于 late-vote audit replay。当前 Commit 1 部分采纳了 `resolverClientId`（C1 修复要求），未加 `resolvedAtMs`。是否后续 Commit 4 加？
- consensus-quorum DecisionReason 的 numeric range constraint（`quorum >= 1`、`tally >= quorum`）当前未在类型层面强制。Commit 4 实施 voteConsensus 时是否落实 `makeConsensusReason` helper？

记下，留 Commit 4。

## Q4 — Cancel sentinel 长期方案

当前用 `'__cancelled__'` 字符串 + request-time 校验冲突。type-design-analyzer 建议的"branded unique symbol"方案被我以"过工程"拒绝。但**长期最佳方案是扩 `PermissionVote` 加 `cancel?: boolean` 字段**——这要 break 契约。

是否后续起 PR 22a-v2 contract revision，加 `cancel?: boolean` 然后 deprecate sentinel？

记下，作为 follow-up 候选。

## Final Implementation Status

- **PR status**: The referenced PR #4319 "feat(acp-bridge): F1 — acp-bridge package self-sufficiency" MERGED 2026-05-19. The F3 PR #4335 also MERGED 2026-05-20.
- **Summary**: All open questions in this file were resolved during implementation. Q1 (cron task scope) was addressed pragmatically. Q2 (F1 dependency) was resolved by F1 merging before F3. Q3 (resolverClientId/resolvedAtMs) was partially addressed in F3 commit 4 (audit ring includes resolver info). Q4 (cancel sentinel) was shipped with `'__cancelled__'` + collision detection as planned; the `cancel?: boolean` contract revision remains a deferred follow-up.
- **Key divergences**: The F1 merge unblocked F3 as expected. The per-session Config MCP duplication flagged in Q2 context remains an open architectural item (not a blocker).
