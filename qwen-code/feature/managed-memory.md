# Managed memory 技术方案

> 适用范围：`QwenLM/qwen-code` managed memory、`/remember` / `/dream` / `/forget`、auto-generated skills persistence。
> 涉及 PR：#5616（confirm auto-generated skills before persisting）、#5814（decouple `/remember` from auto-extract, stop writing to QWEN.md）。
> 状态：2026-06-25 已合入本周主线。

---

## 1. 背景与动机

Managed memory 负责把长期有用的信息保存到 qwen-code 的 memory/skill 体系里。它有两类写入来源：

- 用户显式命令：`/remember`、`/dream`、`/forget` 等手动管理入口。
- 后台自动流程：tool-heavy session 结束后触发 skill-review / auto-extract，把可能复用的经验整理成 skill 或 memory。

本周两个 PR 解决的是“自动流程不能污染用户长期状态”的边界：

1. #5616：auto-generated skills 不再直接进入 `.qwen/skills/`，而是先 staged 到 `.qwen/pending-skills/`，用户确认后才变成可加载 skill。
2. #5814：`enableManagedAutoMemory` 不再是 managed memory 的总开关，只控制后台 auto-extract；`/remember` 等手动能力只在 `--bare` 下禁用，且绝不再回退写 QWEN.md。

---

## 2. 整体架构

```mermaid
flowchart TB
  TOOL["tool-heavy session"] --> REVIEW["skill-review agent"]
  REVIEW --> GEN["generated SKILL.md"]
  GEN --> CONF{"memory.autoSkillConfirm?"}
  CONF -->|true| PENDING[".qwen/pending-skills/<name>/SKILL.md<br/>loader never scans"]
  CONF -->|false| LIVE[".qwen/skills/<name>/SKILL.md"]
  PENDING --> UI["SkillReviewDialog / footer hint"]
  UI -->|Keep| LIVE
  UI -->|Discard| DROP["delete staged copy"]

  USER["/remember"] --> MANUAL{"managed memory available?"}
  MANUAL -->|!bare| MEM["managed memory write path<br/>user/feedback/project/reference"]
  MANUAL -->|bare| DISABLED["disabled"]
  AUTO["background auto-extract"] --> AUTOFLAG{"enableManagedAutoMemory"}
  AUTOFLAG -->|true| MEM
  AUTOFLAG -->|false| NOAUTO["skip auto-extract only"]
```

关键边界：

- `.qwen/pending-skills/` 是 `.qwen/skills/` 的 sibling，不会被 skill loader 扫描；未确认 skill 对模型不可见。
- `memory.autoSkillConfirm` 默认 `true`。设为 `false` 时恢复旧的直接持久化行为。
- `enableManagedAutoMemory=false` 只关闭后台 auto-extract，不关闭手动 `/remember`、memory prompt injection、recall prefetch、`/dream` / `/forget` 注册。
- `--bare` 是 managed memory 的真正全局禁用边界。

---

## 3. 关键实现

### 3.1 pending skills staging（#5616）

#5616 在 `MemoryManager.runSkillReview` 的持久化出口加确认门。skill-review agent 的生成逻辑不变；代码根据 `Config.getAutoSkillConfirmEnabled()` 决定最终落点：

| 模式 | 落点 | 用户可见性 |
|---|---|---|
| confirm enabled | `.qwen/pending-skills/` | 不被 loader 扫描，等待 review |
| confirm disabled | `.qwen/skills/` | 与旧行为一致，立即可加载 |

确认 UI：

- idle session 弹 `SkillReviewDialog`，支持 Keep / Discard / Keep all / Discard all。
- session busy 或用户 Esc 选择 later 时，footer 显示 pending count。
- Keep 会把 staged skill 移入 `.qwen/skills/`；Discard 删除 staged copy。

限制：pending task record 仍在内存里，session 重启后不会自动重新弹出 review；文件仍留在 `.qwen/pending-skills/`，后续跨 session recovery 是另一个问题。

### 3.2 `/remember` 与 auto-extract 解耦（#5814）

#5814 把 `enableManagedAutoMemory` 从“总开关”缩小为“后台 auto-extract 开关”。新增的 `isManagedMemoryAvailable()` 以 `!getBareMode()` 作为手动 memory 能力 gate：

| 行为 | #5814 前 | #5814 后 |
|---|---|---|
| background auto-extract | 受 `enableManagedAutoMemory` 控制 | 仍受 `enableManagedAutoMemory` 控制 |
| `/remember` routing | auto memory 关闭时可能回退写 QWEN.md | 只要不是 `--bare`，走 managed memory；不写 QWEN.md |
| `/dream` / `/forget` | auto memory 关闭时隐藏 | 只要不是 `--bare`，仍注册 |
| memory prompt injection / recall prefetch | 受 auto memory 总开关影响 | 只要不是 `--bare`，仍可用 |

这个改动保护 QWEN.md 的用户控制权：QWEN.md 类似 AGENTS.md / CLAUDE.md，应由用户手动维护，不应被 `/remember` 或自动流程半自动改写。

---

## 4. 涉及 PR

| PR | 状态 | 作用 |
|---|---|---|
| #5616 | merged | auto-generated skills 先 staged 到 `.qwen/pending-skills/`，经 `SkillReviewDialog` Keep/Discard 后才进入 `.qwen/skills/`；新增 `memory.autoSkillConfirm`。 |
| #5814 | merged | `enableManagedAutoMemory` 只控制后台 auto-extract；`/remember`、`/dream`、`/forget`、memory injection 和 recall prefetch 改由 `!bare` gate，且 `/remember` 不再写 QWEN.md。 |

---

## 5. 已知限制 / 后续

1. **pending skills 跨 session 恢复未落地**。#5616 只保证 staged 文件不会被加载；重启后如何重新提示用户处理 `.qwen/pending-skills/` 仍是后续工作。
2. **memory 开关粒度仍不如 Codex 三开关完整**。#5814 先把 auto-extract 与手动 memory 解耦；更细的 read/write/tool 独立开关尚未展开。
3. **team/shared memory 仍在 open PR**。#5886 处于 open 状态，git-shared team memory tier 不计入当前已落地方案。

_新增于 2026-06-26_
