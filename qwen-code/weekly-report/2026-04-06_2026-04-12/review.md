# qwen-code PR 审查 · 2026-04-06 ~ 2026-04-12 (W15)

**审查方法**：逐个 PR 拉取 _关联 issue + PR 描述 + 代码 diff_，核对 (1) 描述↔实现 **一致性**；(2) 描述 **准确性**；(3) 代码 **正确性**。评级：✅ 良好 / ⚠️ 有出入或小隐患 / ❌ 明显不符。#3103 的关键结论已用 `gh pr diff` 二次核验。

---

## 汇总

| PR | 状态 | 一致性 | 正确性 | 一句话 |
|---|---|---|---|---|
| [#3041](https://github.com/QwenLM/qwen-code/pull/3041) | merged | ✅ | ✅ | 小而准的 checkpointing 修复，有测试 |
| [#3079](https://github.com/QwenLM/qwen-code/pull/3079) | merged | ✅ | ✅ | /batch 技能合规可加载；描述比实现"重" |
| [#3085](https://github.com/QwenLM/qwen-code/pull/3085) | closed | ✅ | ⚠️ | 启动优化，按拆分关闭（→#3318/#3319）；残留边界缺陷 |
| [#3103](https://github.com/QwenLM/qwen-code/pull/3103) | open | ❌ | ❌ | **body 与 diff 完全相反**：描述加 napi+terminal-setup，diff 实为删除 |
| [#3146](https://github.com/QwenLM/qwen-code/pull/3146) | merged | ✅ | ✅ | sandboxImage 设置项，干净有测试 |
| [#3148](https://github.com/QwenLM/qwen-code/pull/3148) | merged | ⚠️ | ⚠️ | 警告文案与 body 自相矛盾；REPLACE 声明未被 deepMerge 兑现 |

**一致性**：✅4 / ⚠️1 / ❌1　　**正确性**：✅3 / ⚠️2 / ❌1

---

## 逐 PR 明细

### #3041 [codex] fix checkpointing init in non-repo directories
- **状态**: merged | **关联 issue**: #1104（This is an unexpected error）
- **一致性**: ✅ — body 三点（catch `checkIsRepo` 抛错、视为未初始化走 `git init`、加回归测试）diff 全部实现；测试用 `mockRejectedValueOnce` 断言 `init` 被调用。
- **描述准确性**: 准确。根因（simple-git 对非仓库目录抛异常而非返回 false）合理；issue 里附带的 OOM 堆栈属无关日志。
- **正确性**: ✅ — `gitService.ts:setupShadowGitRepository` try/catch 兜底；bare catch 虽吞所有错误，但 git 可用性已在上游 `initialize()` 校验，重复 `init` 幂等安全。
- **结论**: 小而准、有测试的可靠修复。

### #3079 feat(skills): add /batch skill for parallel batch operations
- **状态**: merged | **关联 issue**: #3043（[P2] /batch 并行操作）
- **一致性**: ✅ — 交付 `batch/SKILL.md`（已并入 main 的 bundled 技能），frontmatter `allowedTools` 均合法。
- **描述准确性**: 略夸大——纯 prompt 技能，"自动分块/--dry-run/聚合"均为 LLM 指令而非确定性代码；Test Plan 勾选的 "skill-load tests/13 files processed" 在 diff 中无对应自动化测试。
- **正确性**: ✅ — prompt 连贯、排除项合理、工具名有效。隐忧：并行依赖运行时支持单消息多 Agent 调用，否则退化为串行（输出仍正确）。
- **结论**: 合规可加载的技能，效果取决于模型遵循度，描述比实现"重"。

### #3085 feat(cli): add startup optimization with API preconnect and early input capture
- **状态**: closed（评论确认 "Superseded by #3318 + #3319"，按拆分关闭）| **关联 issue**: #3223、#3224（#3011 子任务）
- **一致性**: ✅ — diff 含 `apiPreconnect.ts`/`earlyInputCapture.ts` 及测试并接入，覆盖两特性。
- **描述准确性**: benchmark（181→56ms/69% 等）以"实测"呈现但从未合入、无法复核，偏乐观；末尾署名误用 Claude Code。
- **正确性**: ⚠️ — `apiPreconnect.ts:isDefaultBaseUrl` 用 `startsWith`，`https://api.openai.com.evil.com` 会被误判为默认域（仅 HEAD 无凭据，低危；**该问题在拆分后的 #3318 用 `startsWith(default+'/')` 已修**）；`earlyInputCapture.ts:isTerminalResponse` 未过滤光标位置报告 CPR(`ESC[n;mR`)，会被当用户输入回放。
- **结论**: 实现尚可、已修主要评审问题，最终以拆分被取代而非合入。

### #3103 fix(cli): support Shift+Enter for newline insertion across terminals
- **状态**: open | **关联 issue**: #241（Shift+Enter 不换行、直接发送）—— 仍 open
- **一致性**: ❌（已 `gh pr diff` 核验）— body 声称**新增** `@qwen-code/modifiers-napi` 原生插件、**扩展** `/terminal-setup`（Alacritty/Zed/Apple Terminal）、VSCode 改 ESC+CR；但当前 diff 恰好相反：**删除** `terminalSetup.ts(-393)`、`terminalSetupCommand.ts(-53)`、其测试(-85)、`BuiltinCommandLoader` 注册、`KeypressContext.tsx` 的 ESC\r→meta 处理(-3)、`platformConstants.ts(-5)`；package.json/lock 虽**新增** `@qwen-code/modifiers-napi` 依赖，但 `packages/modifiers-napi` 源码不存在（悬空引用、亦是 CONFLICTING 之因），**原生插件未真正落地**；仅 `KeyboardShortcuts.tsx(+8)` 改了帮助文案 + 新增 e2e 脚本/报告。
- **描述准确性**: 几乎完全失真——support matrix 与"7 项原生检测/ESC+CR 字节正确性"测试计划描述的是 diff 中不存在的代码（极可能是 pivot/force-push 后 body 未更新）。
- **正确性**: ❌ — 按当前 diff，删掉 ESC+CR 处理与 `/terminal-setup` 会**回退** VSCode/Cursor 换行路径；帮助却新标 `shift+enter`，在发送纯 `\r` 的终端不会换行（正是 #241 的核心场景）。#241 未实际修复。
- **结论**: 当前状态下"声称加大特性、实则删除既有支持"，body 与 diff 必须对齐后才能评估/合并。

### #3146 feat(cli): support tools.sandboxImage in settings
- **状态**: merged | **关联 issue**: #577（Support --sandbox-image via settings.json）
- **一致性**: ✅ — `settingsSchema.ts` 加 `tools.sandboxImage`；`sandboxConfig.ts:loadSandboxConfig` 按 `argv ?? QWEN_SANDBOX_IMAGE ?? settings.tools?.sandboxImage ?? default` 解析，与所述优先级一致；docs + vscode schema + 4 个优先级测试齐全。
- **描述准确性**: 准确。
- **正确性**: ✅ — `??` 链正确(`:99-103`)；小瑕：空串 `QWEN_SANDBOX_IMAGE` 会被采纳，属既有/可接受。
- **结论**: 干净、测试充分，直接解决 #577。

### #3148 feat(cli): warn when workspace overrides global modelProviders
- **状态**: merged | **关联 issue**: #146（为所有项目设默认 OpenAI key/model/URL）
- **一致性**: ⚠️ — 代码仅在"可信工作区 + 空 `modelProviders:{}` 遮蔽已有 user providers"时告警；但 body 称告警解释 `modelProviders` "用 REPLACE 合并策略会覆盖"，而实际文案(`settings.ts:getModelProvidersOverrideWarnings`)说"在当前合并行为下无效"——自相矛盾。
- **描述准确性**: 夸大；告警实际针对空对象 no-op，而非有效覆盖。
- **正确性**: ⚠️ — 守卫逻辑合理且有测试；但文案误导：`settingsSchema.ts:301` 已声明 `mergeStrategy:REPLACE`（只是 `deepMerge.ts:mergeRecursively` 没有 REPLACE 分支未兑现），故"if introduced in the future"不准确。无功能 bug。
- **结论**: 无害的可观测性告警；"Closes #146" 略牵强；REPLACE 措辞不准。

---

## 重点跟进清单

### Open PR（优先）
1. **#3103**（Shift+Enter）：**body 与 diff 完全相反**。需确认 diff 是否为预期——若是 pivot 到更简方案，请重写 body 并说明为何删除 `/terminal-setup`/ESC+CR；若删除属误操作（force-push 丢代码），需恢复。当前状态会回退 VSCode 换行且 #241 未修。

### Merged / Closed（仅记录）
2. **#3148**：告警文案与 REPLACE 语义不符，建议修订文案（当前 `modelProviders` REPLACE 未被 deepMerge 兑现）。
3. **#3085**（已 closed）：其 `isDefaultBaseUrl` 子域校验缺陷已在 #3318 修复，无需处理；记录在案。

---

_审查于 2026-05-30；方法：并行只读子代理逐 PR 拉取 issue+描述+diff，#3103 由主代理 `gh pr diff` 二次核验。_
