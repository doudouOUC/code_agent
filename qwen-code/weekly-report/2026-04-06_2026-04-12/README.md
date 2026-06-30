# qwen-code PRs · 2026-04-06 ~ 2026-04-12  (W15)

**主题**: CLI 启动优化起步 + skills/settings

**统计**: 6 PRs — 4 merged / 1 open / 1 closed
**代码量**: +3,254 / -651，38 个文件变更
**类型**: feat ×4, fix ×2
**范围 (scope)**: cli ×4, skills ×1

**本周最大改动**:
- [#3103](https://github.com/QwenLM/qwen-code/pull/3103) (+1392/-630, 15 files) fix(cli): support Shift+Enter for newline insertion across terminals
- [#3085](https://github.com/QwenLM/qwen-code/pull/3085) (+1245/-0, 9 files) feat(cli): add startup optimization with API preconnect and early input capture
- [#3079](https://github.com/QwenLM/qwen-code/pull/3079) (+303/-0, 1 files) feat(skills): add /batch skill for parallel batch operations

| PR | 状态 | 类型 | 标题 | 变更 | 文件 | 创建 | 合并/关闭 | 链接 |
|---|---|---|---|---|---|---|---|---|
| #3041 | ✅ merged | fix | [codex] fix checkpointing init in non-repo directories _[type/bug]_ | +17/-1 | 2 | 04-09 | 04-09 | https://github.com/QwenLM/qwen-code/pull/3041 |
| #3079 | ✅ merged | feat(skills) | feat(skills): add /batch skill for parallel batch operations _[type/feature-request]_ | +303/-0 | 1 | 04-10 | 04-17 | https://github.com/QwenLM/qwen-code/pull/3079 |
| #3085 | ⬜ closed | feat(cli) | feat(cli): add startup optimization with API preconnect and early input capture _[type/feature-request]_ | +1245/-0 | 9 | 04-10 | 04-16 | https://github.com/QwenLM/qwen-code/pull/3085 |
| #3103 | 🟡 open | fix(cli) | fix(cli): support Shift+Enter for newline insertion across terminals _[type/bug]_ | +1392/-630 | 15 | 04-10 | — | https://github.com/QwenLM/qwen-code/pull/3103 |
| #3146 | ✅ merged | feat(cli) | feat(cli): support tools.sandboxImage in settings _[type/feature-request]_ | +146/-19 | 8 | 04-11 | 04-13 | https://github.com/QwenLM/qwen-code/pull/3146 |
| #3148 | ✅ merged | feat(cli) | feat(cli): warn when workspace overrides global modelProviders _[roadmap/configuration]_ | +151/-1 | 3 | 04-11 | 04-13 | https://github.com/QwenLM/qwen-code/pull/3148 |

---

## PR 解决问题与实现方式

> 来源：同目录 `review.md` 的逐 PR diff 审查，结合 PR 状态与标题压缩成“解决了什么问题 / 怎么做的”。open/closed PR 只记录当前观察，不写成已落地实现。

| PR | 解决了什么问题 | 怎么做的 |
|---|---|---|
| [#3041](https://github.com/QwenLM/qwen-code/pull/3041) | 小而准的 checkpointing 修复，有测试 | body 三点（catch `checkIsRepo` 抛错、视为未初始化走 `git init`、加回归测试）diff 全部实现；测试用 `mockRejectedValueOnce` 断言 `init` 被调用。 `gitService.ts:setupShadowGitRepository` try/catch 兜底；bare catch 虽吞所有错误，但 git 可用性已在上游 `initialize()` 校验，重复 `init` 幂等安全。 |
| [#3079](https://github.com/QwenLM/qwen-code/pull/3079) | /batch 技能合规可加载；描述比实现"重" | 交付 `batch/SKILL.md`（已并入 main 的 bundled 技能），frontmatter `allowedTools` 均合法。 prompt 连贯、排除项合理、工具名有效。隐忧：并行依赖运行时支持单消息多 Agent 调用，否则退化为串行（输出仍正确）。 |
| [#3085](https://github.com/QwenLM/qwen-code/pull/3085) | 未作为已落地实现；启动优化，按拆分关闭（→#3318/#3319）；残留边界缺陷。 | diff 含 `apiPreconnect.ts`/`earlyInputCapture.ts` 及测试并接入，覆盖两特性。`apiPreconnect.ts:isDefaultBaseUrl` 用 `startsWith`，`https://api.openai.com.evil.com` 会被误判为默认域（仅 HEAD 无凭据，低危；该问题在拆分后的 #3318 用 `startsWith(default+'/')` 已修）； |
| [#3103](https://github.com/QwenLM/qwen-code/pull/3103) | 仍在观察，尚未作为已落地实现；当前目标是 body 与 diff 完全相反：描述加 napi+terminal-setup，diff 实为删除。 | （已 `gh pr diff` 核验）— body 声称新增 `@qwen-code/modifiers-napi` 原生插件、扩展 `/terminal-setup`（Alacritty/Zed/Apple Terminal）、VSCode 改 ESC+CR； |
| [#3146](https://github.com/QwenLM/qwen-code/pull/3146) | sandboxImage 设置项，干净有测试 | `settingsSchema.ts` 加 `tools.sandboxImage`；`sandboxConfig.ts:loadSandboxConfig` 按 `argv ?? QWEN_SANDBOX_IMAGE ?? settings.tools?.sandboxImage ?? default` 解析，与所述优先级一致；docs + vscode schema + 4 个优先级测试齐全。`??` 链正确(`:99-103`)； |
| [#3148](https://github.com/QwenLM/qwen-code/pull/3148) | 警告文案与 body 自相矛盾；REPLACE 声明未被 deepMerge 兑现 | 代码仅在"可信工作区 + 空 `modelProviders:{}` 遮蔽已有 user providers"时告警；但 body 称告警解释 `modelProviders` "用 REPLACE 合并策略会覆盖"，而实际文案(`settings.ts:getModelProvidersOverrideWarnings`)说"在当前合并行为下无效"——自相矛盾。守卫逻辑合理且有测试； |
