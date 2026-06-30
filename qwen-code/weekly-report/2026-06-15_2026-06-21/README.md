# qwen-code PRs · 2026-06-15 ~ 2026-06-21  (W25 最终版)

**主题**: supported `sed -i` file-history tracking、daemon docs English refresh、monitor notification batch drain、daemon status API、duplicate model id provider persistence、mid-turn image preservation、ACP cancellation stop semantics、serve permission timeout flag

**个人 PR 统计**: 10 PRs — 9 merged / 0 open / 1 closed
**个人 PR 代码量**: +13,180 / -3,079，103 个文件变更 _(不含 closed #5162)_
**个人 PR 类型**: feat ×2, fix ×7, docs ×1
**个人 PR 范围 (scope)**: core ×1, daemon/serve ×3, monitor ×2, model ×1, cli/ACP cancellation ×2, cli/desktop ×1

**个人 PR 最大改动**:
- [#5183](https://github.com/QwenLM/qwen-code/pull/5183) (+3350/-169, 12 files) fix(cli): Preserve mid-turn image messages
- [#5144](https://github.com/QwenLM/qwen-code/pull/5144) (+2819/-2555, 26 files) docs(daemon): Refresh daemon docs in English
- [#5141](https://github.com/QwenLM/qwen-code/pull/5141) (+2275/-25, 12 files) fix(core): Track supported sed edits in file history

---

## 个人 PR 明细

| PR | 状态 | 标题 | 变更 | 文件 | 创建 | 合并/关闭 | 链接 |
|---|---|---|---|---|---|---|---|
| #5141 | ✅ merged | fix(core): Track supported sed edits in file history | +2275/-25 | 12 | 06-15 | 06-18 | https://github.com/QwenLM/qwen-code/pull/5141 |
| #5144 | ✅ merged | docs(daemon): Refresh daemon docs in English | +2819/-2555 | 26 | 06-15 | 06-15 | https://github.com/QwenLM/qwen-code/pull/5144 |
| #5162 | ⬜ closed | fix(monitor): batch-drain notifications to reduce token waste | +576251/-25085 | 2525 | 06-15 | 06-15 | https://github.com/QwenLM/qwen-code/pull/5162 |
| #5165 | ✅ merged | fix(monitor): batch-drain notifications to reduce token waste | +167/-41 | 7 | 06-15 | 06-15 | https://github.com/QwenLM/qwen-code/pull/5165 |
| #5174 | ✅ merged | feat(cli): Add daemon status API | +1584/-42 | 15 | 06-16 | 06-16 | https://github.com/QwenLM/qwen-code/pull/5174 |
| #5179 | ✅ merged | fix(model): remember selected provider when multiple share a model id (#5173) | +525/-14 | 16 | 06-16 | 06-18 | https://github.com/QwenLM/qwen-code/pull/5179 |
| #5183 | ✅ merged | fix(cli): Preserve mid-turn image messages | +3350/-169 | 12 | 06-16 | 06-18 | https://github.com/QwenLM/qwen-code/pull/5183 |
| #5218 | ✅ merged | fix(cli): Stop after cancelled ask_user_question | +1751/-92 | 4 | 06-17 | 06-17 | https://github.com/QwenLM/qwen-code/pull/5218 |
| #5258 | ✅ merged | fix(cli): Stop after cancelled permissions | +601/-140 | 4 | 06-18 | 06-19 | https://github.com/QwenLM/qwen-code/pull/5258 |
| #5260 | ✅ merged | feat(serve): make ACP permission timeout configurable | +108/-1 | 7 | 06-18 | 06-18 | https://github.com/QwenLM/qwen-code/pull/5260 |

---

## 个人 PR 解决问题与实现方式

> 来源：merged diff、文件列表、patch 和当前状态；GitHub PR body 只作为目标线索。这里压缩成“解决了什么问题 / 怎么做的”，便于快速阅读。

| PR | 解决了什么问题 | 怎么做的 |
|---|---|---|
| [#5141](https://github.com/QwenLM/qwen-code/pull/5141) | 让一小类安全的单文件 `sed -i` 替换命令走编辑确认和 file history 记录，补 `/rewind` 对 shell 原地编辑的缺口。 | 新增 sed edit parser，shell 确认阶段读取目标文件并模拟替换生成文件 diff；执行前重新读取做 stale-content guard，写入前调用 `FileHistoryService.trackEdit()`，再通过 `FileSystemService.writeTextFile()` 落盘；不支持的 sed 形式继续走原 shell 路径，同时隐藏这类 shell-backed edit 的修改入口并补 core/CLI focused tests，已于 06-18 合入。 |
| [#5144](https://github.com/QwenLM/qwen-code/pull/5144) | 把 daemon developer docs 全量刷新为英文，并重新核对当前 `main` 的 daemon 实现面。 | 重写 `docs/developers/daemon/00-20`、daemon 导航、TUI adapter、serve protocol 和用户 serve 文档；按源码核对 event schema、capability tags、startup flags、error taxonomy、resync passthrough、MCP pool 和 web UI wording，并用 prettier、中文残留扫描、Node 计数检查、build/typecheck 验证。 |
| [#5162](https://github.com/QwenLM/qwen-code/pull/5162) | 原本尝试修 monitor 通知逐条触发 LLM roundtrip 的 token 浪费问题，但因为基于错误 base 带入大量无关 diff，最终关闭。 | PR body 的目标与 #5165 一致；由于 diff 混入 daemon/docs/历史 `.qwen` 文件和大规模无关改动，未作为有效实现统计，后续由干净分支 #5165 取代。 |
| [#5165](https://github.com/QwenLM/qwen-code/pull/5165) | 合入 monitor notification batch drain，减少 stdout/running 事件导致的一条事件一次 LLM roundtrip。 | 在 interactive CLI、nonInteractive session、nonInteractiveCli 和 ACP session 路径批量 drain 连续同类 notification；monitor callback 入队前过滤已 settled 的 stale running 事件；`MonitorRegistry.emitTerminalNotification` 复用 `TaskBase.notified` 防重复 terminal notification，并补 monitor registry、monitor tool、useGeminiStream、nonInteractiveCli focused tests。 |
| [#5174](https://github.com/QwenLM/qwen-code/pull/5174) | 新增只读 `GET /daemon/status`，给 operator 和 dashboard 一个统一的 daemon 诊断 JSON surface。 | 新增 `daemonStatus.ts` 聚合 summary/full 两级状态；summary 从内存计数返回 session、permission、REST SSE、ACP transport、rate-limit、runtime、auth、limits、capabilities，full 额外聚合 session/ACP/auth/workspace 诊断并按 section 独立超时降级；暴露 `daemon_status` capability，补 bridge/ACP registry snapshot helper、connection registry snapshot helper、focused tests 和 serve protocol/user docs，已于 06-16 合入。 |
| [#5179](https://github.com/QwenLM/qwen-code/pull/5179) | 修复多个 `modelProviders` 条目共享同一 model id 但 `baseUrl` 不同时，模型选择器重启后丢失用户实际选择的 provider。 | 选择器持久化 `model.name` 时同步写入 `model.baseUrl`；启动解析和 pre-flight auth 按 `id + baseUrl` 精确匹配 provider，找不到时回退首个 id；`/model <id>`、ACP `setModel`、`qwen/settings/setCoreValue` 和 provider install 等 id-only 写入路径用空字符串 tombstone 清掉旧 `model.baseUrl`，避免跨 scope stale disambiguator 继续生效，并补 model config/auth/dialog/command/ACP/provider install tests，已于 06-18 合入。 |
| [#5183](https://github.com/QwenLM/qwen-code/pull/5183) | 在 CLI、ACP 和 desktop Qwen backend 的 mid-turn 路径中保留用户图片输入，避免工具执行期间插入的图片消息被降级成文本或提前 ack 丢失。 | mid-turn `@` 文件消息在工具结果发送前解析成结构化 parts；ACP mid-turn drain extension 支持 structured `items` content blocks，同时保留 legacy text-only `messages`；desktop live image attachments 通过 mid-turn queue 传递并按稳定 message id ack，缺少 live base64 的图片消息保留到下一轮；补 CLI `@` 图片 continuation、ACP structured block、desktop drain 和 missing-base64 fallback tests，已于 06-18 合入。 |
| [#5218](https://github.com/QwenLM/qwen-code/pull/5218) | `ask_user_question` 被取消或超时后，ACP turn 立即停止，避免模型继续执行后续工具或 sibling Agent。 | 在 ACP session loop 中把取消从“工具错误”提升为 turn stop：记录未执行工具的 skipped response，保留 replay 所需 pending tool-response history，等待 pending message rewrite 后结束 turn；嵌套 Agent 使用 active abort signal 向当前 Agent 和同批 sibling Agent 传播取消，并补 Session/SubAgentTracker focused tests。 |
| [#5258](https://github.com/QwenLM/qwen-code/pull/5258) | 把 #5218 的停止语义推广到所有 ACP 工具权限取消，不只限于 `ask_user_question`。 | 当权限 vote 解析为 cancelled、reject option 映射到 `Cancel`、或权限请求通道失败时，记录被拒工具并跳过同一模型响应里的后续工具；嵌套 Agent 权限取消也 fail-closed 中止父 Agent turn，并用 daemon/WebShell HTTP/SSE E2E 验证取消后两个 shell sentinel 都不会落盘，已于 06-19 合入。 |
| [#5260](https://github.com/QwenLM/qwen-code/pull/5260) | 给 `qwen serve` 增加 ACP 权限/`ask_user_question` 单次响应超时配置，解决 5 分钟固定等待不可调的问题。 | 新增 `--permission-response-timeout-ms`，从 CLI 透传到 `ServeOptions` / `createAcpSessionBridge` 覆盖 bridge 默认 5 分钟；`0` 表示无限等待；启动时拒绝非有限/负数/非整数，bridge 将超大值 clamp 到 Node timer 上限，补 serve/runQwenServe/server/bridge tests，已于 06-18 合入。 |

## 个人 PR 最终实现文档

> 2026-06-30 对照 GitHub 当前 PR changed files 和 patch 重新整理。已建立深读记录的 PR，其完整中文最终实现文档放在本周 `implementations/` 目录。

- 已按最终实现校准：#5141
- 直接按 merged diff 写入正文：#5144、#5165、#5174、#5179、#5183、#5218、#5258、#5260
- #5162 为 wrong-base closed PR，diff 中出现的 `.qwen/design/`、`.qwen/e2e-tests/` 来自被错误带入的历史改动，不作为 #5162 的有效实现依据

_W25 最终版 · 个人 PR 说明更新于 2026-06-22_
