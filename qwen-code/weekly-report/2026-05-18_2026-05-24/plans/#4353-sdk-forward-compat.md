# F4 direction decision — web endpoint dropped

## Decision (2026-05-20)

用户确认（plan 阶段 AskUserQuestion 答复）：
- **浏览器不是 qwen-code daemon mode 的 first-class client surface**
- 操作员只通过 CLI / IDE companion / Node SDK client 接 daemon
- chiga0 #4328 / #4353 的 React 组件库变成 **library-only**（下游谁需要 web UI 自己 host）

**F4 (1c) `qwen serve` `/web` 端点设计被废弃。** 不做：
- `packages/web-templates/src/webui/` 新 app 目录
- `packages/cli/src/serve/web/` 新模块
- HttpOnly cookie BFF / OTT bootstrap / CSP / `/web` 路由
- `auth.ts` side-channel cookie short-circuit
- `--web` / `--no-web` CLI flag
- `web_endpoint` capability tag

## 决定的根据

用户明确：浏览器不在目标 client 列表内。daemon ACP-over-HTTP/SSE（F1 已有）已经覆盖：
- CLI client（直接 HTTP + bearer）
- IDE companion / VS Code WebView（trust-scoped，token 持有安全）
- Node SDK client（chiga0 #4296 在做 channel adapter API）

浏览器作为 client surface 的特殊性（不能安全持 bearer → 需要 cookie BFF）→ 既然 not a target，BFF 层就没有存在理由。

## 后续影响（需要操作）

| 工作流 | 影响 | 后续动作 |
|---|---|---|
| chiga0 PR #4296（web-first pivot + channel adapter API）| 仍有效 — 影响的是 UI library 方向，不是 daemon hosting | 无 |
| chiga0 #4328（SDK `daemon/ui` + `@qwen-code/webui`）| 仍有效 — library-only，无须 daemon 端集成 | 无 |
| chiga0 #4353（webui PR A-E follow-up）| 仍有效 — library-only | 无 |
| 我的 #4296 ack comment（4497876531）| 仍准确 — 我承认了 web-first pivot 的方向，没承诺 hosting | 无 |
| 我在 #4328 的 recalibration comment（4498444665）| 当时我说"F4 (1c) 是 missing piece"，需修正 | **需要再发一条 follow-up comment** 收回 hosting 承诺 |
| Issue #4175 F4 行 | 当前包含 F4 (1c) web endpoint 子项 | **需要修订** — 删 (1c) 子项 + 重新定义 F4 含义 |

## 接下来的开放问题（尚未定）

如果 "daemon-native client experience" 不含 browser，F4 还剩什么？候选方向：

1. **IDE companion daemon-native 改造**
   - 现状：VS Code 扩展（`packages/vscode-ide-companion/`）当前是"spawn CLI 进程"模式
   - 改造：让扩展直接 talk to 本机 `qwen serve` daemon（ACP-over-HTTP/SSE）
   - 价值：开多个窗口共享 session、F3 多客户端协调真正落地、daemon 长连提供更好的 UX
   - 复杂度：中等。chiga0 docs 里说"VS Code stays on direct ACP / runtime paths"，意味着现有路径仍 OK，但 daemon 模式是显式 opt-in 的并行选项

2. **CLI multi-session attach** (`qwen --connect <port>`)
   - 现状：每次 `qwen` 启动 spawn 新进程
   - 改造：`qwen --connect 4170` 让 CLI 接到 running daemon 的现有 session
   - 价值：操作员能跨多个终端窗口接同一会话；F3 multi-client coordination 在 CLI 域内有真实用例
   - 复杂度：中等。需要在 CLI 启动路径加 client 模式

3. **Channel adapter 端到端 demo**
   - 基于 chiga0 PR 25（OutputSink + channel adapter API）
   - 做一个非-HTTP channel 实现（stdio/IPC/WebSocket-per-session）作为参考
   - 价值：让第三方知道怎么写新 channel
   - 复杂度：低-中等。等 chiga0 PR 25 merge 后做

4. **跳过 F4，直接做 F5 production release chain**
   - F5 包括：production auth defaults（`--require-auth` 默认开 + `--token` 强制非空）、log rotation、graceful shutdown、SIGTERM 处理、release notes 准备
   - 价值：让 daemon mode 进入 GA-ready 状态
   - 复杂度：中等。但相对独立，不依赖 F4

## 推荐方向

候选 (1) **IDE companion daemon-native 改造** 最对得起 chiga0 #4296 的 "native TUI / VS Code stay on direct ACP / runtime paths" 表述 — 那句话是说"VS Code 的 daemon 路径不需要 web hosting"，而不是说"VS Code 不需要 daemon 模式"。F3 的多客户端协调真正能在 IDE 多窗口场景落地。

但这个方向超出当前对话能确定的范围 — 需要用户决策。

---

## 原 F4 (1c) plan 归档说明

原 ~1300 LOC web endpoint plan 详细内容（auth 3 模式 / CSP / OTT / cookie BFF / string-bundle architecture）如果未来浏览器又重新成为目标，可以从 git history 中此文件早期版本恢复。当前不保留细节以免误导执行者。

## Final Implementation Status

- **PR #4328** — MERGED 2026-05-22. Added shared UI transcript layer (`@qwen-code/webui` library-only).
- **PR #4353** — MERGED 2026-05-24. Unified completeness follow-up to #4328.
- **PR #4296** — CLOSED (not merged). Web-first pivot docs superseded by the decision to drop browser as a client surface.
- **#4175** — OPEN issue (roadmap tracker). F4 (1c) web endpoint sub-item was removed per this plan.
- **Outcome**: Plan was fully executed. The web endpoint was officially dropped; the UI library shipped as library-only (no daemon hosting). Related PRs #4328/#4353 merged the SDK `daemon/ui` layer without any server-side web route.
- **Files changed**: SDK `packages/sdk-typescript/src/daemon/ui/` (transcript, store, normalizer, types, toolPreview, terminal) + DaemonTuiAdapter + docs.
