# qwen-code PRs · 2026-09-14 ~ 2026-09-20 (W38 周内累计)

> 本文件已整理 2026-09-14 至 2026-09-20（Asia/Shanghai）创建的 @doudouOUC 个人 PR。口径为 `QwenLM/qwen-code` 中 author 为 @doudouOUC 且 createdAt 落在对应北京时间日/周窗口内的 PR；只在窗口内更新、关闭或合入，但创建时间不在窗口内的 PR 不计入新增统计。open PR 只记录当前 diff 方案，不能视为 `main` 已落地能力。

**主题**: ACP child 容量准入/回收/用户恢复、MCP App 资源失败可见性、Linux bwrap CI 与工具级执行沙箱拆分、HTTP standalone UUID 兼容

**PR 统计**: 11 PRs - 6 merged / 5 open / 0 closed
**当前已合并 PR 代码量**: +2,682 / -299，70 个文件变更
**全量代码量**: +22,088 / -3,926，310 个文件变更
**类型分布**: feat ×5, fix ×4, other ×1, test ×1
**范围 (scope)**: serve/daemon ×3, web-shell ×3, sdk-typescript ×3, ci ×4, core ×3, linux-sandbox ×3

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 代码量 | 文件数 | 创建时间(UTC) | 合并/关闭时间(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#11781](https://github.com/QwenLM/qwen-code/pull/11781) | ✅ merged | @doudouOUC | fix(ci): raise the build heap cap from 3072 to 4096 MB | +1/-1 | 1 | 09-13 16:13 | 09-13 21:46 |
| [#11812](https://github.com/QwenLM/qwen-code/pull/11812) | ✅ merged | @doudouOUC | fix(sdk): support standalone session creation over HTTP | +118/-45 | 2 | 09-14 05:18 | 09-14 07:02 |
| [#11819](https://github.com/QwenLM/qwen-code/pull/11819) | ✅ merged | @doudouOUC | ci(triage): install zip in the verify lane | +5/-1 | 1 | 09-14 06:50 | 09-14 07:33 |
| [#11911](https://github.com/QwenLM/qwen-code/pull/11911) | ✅ merged | @doudouOUC | feat(serve): add budget-based ACP child admission | +1177/-144 | 43 | 09-15 05:31 | 09-15 08:28 |
| [#11938](https://github.com/QwenLM/qwen-code/pull/11938) | ✅ merged | @doudouOUC | fix(ci): isolate runner schedule fixture module scope | +2/-5 | 1 | 09-15 09:02 | 09-15 11:55 |
| [#11940](https://github.com/QwenLM/qwen-code/pull/11940) | ✅ merged | @doudouOUC | feat(serve): reclaim idle ACP children when admission is full | +1379/-103 | 22 | 09-15 09:27 | 09-16 04:01 |
| [#11960](https://github.com/QwenLM/qwen-code/pull/11960) | 🟡 open | @doudouOUC | fix(mcp): show MCP App resource load warnings | +240/-49 | 3 | 09-15 16:25 | — |
| [#11981](https://github.com/QwenLM/qwen-code/pull/11981) | 🟡 open | @doudouOUC | test(ci): Add real Linux bwrap integration coverage | +815/-7 | 12 | 09-16 03:31 | — |
| [#12008](https://github.com/QwenLM/qwen-code/pull/12008) | 🟡 open | @doudouOUC | feat(serve): let users stop workspace runtimes to release ACP capacity | +4476/-351 | 58 | 09-16 08:35 | — |
| [#12064](https://github.com/QwenLM/qwen-code/pull/12064) | 🟡 open | @doudouOUC | feat(core): Move bwrap confinement to tool execution | +11282/-3180 | 148 | 09-17 04:11 | — |
| [#12067](https://github.com/QwenLM/qwen-code/pull/12067) | 🟡 open | @doudouOUC | feat(core): Add the bwrap execution foundation | +2593/-40 | 19 | 09-17 05:31 | — |

---

## PR 解决问题、实现方式与 feature 处理

| PR | 解决了什么问题 | 最终怎么实现（open/closed 只登记当前观察） | 对应 feature 文档 |
|---|---|---|---|
| [#11781](https://github.com/QwenLM/qwen-code/pull/11781) | 全仓 TypeScript build 的实测 RSS 已逼近 3072 MB Node heap 上限，runner 争用时会以 V8 OOM 而非编译错误退出，使相同提交在不同 CI lane 上随机成败。 | 最终只把根 `npm run build` 的 `--max-old-space-size` 从 3072 提到 4096；测试脚本仍保留 3072，既不改变产品运行时，也不把新增上限当作预留内存。 | CI 构建资源修复，不新增长期产品 feature。完整实现见 [implementations/pr-11781.md](implementations/pr-11781.md)。 |
| [#11812](https://github.com/QwenLM/qwen-code/pull/11812) | 普通 HTTP 非回环来源不是 secure context，浏览器仍提供 `crypto.getRandomValues()` 却不提供 `crypto.randomUUID()`；No workspace 首次发送会在发出 create 请求前直接失败。 | 最终让 SDK 优先使用原生 `randomUUID()`，缺失时从 16 个安全随机字节设置 UUID v4 version/variant 位并格式化为小写 ID；显式 caller ID、单次 create 与 outcome-unknown exact recovery 语义保持不变，并补前导零、全 0/全 255 字节和两条 recovery 路径回归。 | 已更新 SDK、daemon客户端适配器、WebUI transport与daemon总览。完整实现见 [implementations/pr-11812.md](implementations/pr-11812.md)。 |
| [#11819](https://github.com/QwenLM/qwen-code/pull/11819) | Qwen Triage 的 `verify` job 使用 `node:22-bookworm`，镜像有 `unzip` 但无 `zip`；archive 安全测试在 `CI=true` 时因此于 collection 阶段硬失败，产生与被测 PR 无关的 `consistent-fail`。 | 最终在 verify runner tools 安装步骤中把 `zip` 与既有 `util-linux` 一起安装；主 CI 已有同等依赖，未运行该套件的 `tmux-testing` job 保持不变。 | CI 验证环境修复，不新增长期产品 feature。完整实现见 [implementations/pr-11819.md](implementations/pr-11819.md)。 |
| [#11911](https://github.com/QwenLM/qwen-code/pull/11911) | `observe` 只报告 modeled child 上限，仍允许冷 workspace 在满额时继续 spawn，operator 无法限制 daemon 管理的 ACP 进程数量，客户端也拿不到可识别的容量失败。 | 最终新增 opt-in `--child-heap-mode admit`：共享 `ProcessRegistry` 把 reservation、attached 与 terminating child 一并计数，新 spawn 在超过 modeled limit 时于 OS spawn 前拒绝；REST/ACP 返回 `acp_child_capacity_exhausted` 与 503 元数据，WebShell 停止自动重试并保留普通、shell 与首个 `/goal` 草稿。status 区分 count admission 与仍未应用的 heap ceiling。 | 已更新daemon资源预算、协议/SDK、WebUI transport、Linux容量实测与daemon总览。完整实现见 [implementations/pr-11911.md](implementations/pr-11911.md)。 |
| [#11938](https://github.com/QwenLM/qwen-code/pull/11938) | runner 调度测试生成的 fake `gh` 会继承临时父目录的 package module 类型；在 ESM 作用域中执行 CommonJS `require` 时，两条 subprocess 测试失败。 | 最终让 fixture 自带 `{"type":"module"}` package scope，并把 fake CLI 改为 `import fs from 'node:fs'`，使默认、ESM 与 CommonJS 临时父目录得到同一加载语义，不改变真实 runner 标签切换逻辑。 | CI 测试夹具修复，不新增长期产品 feature。完整实现见 [implementations/pr-11938.md](implementations/pr-11938.md)。 |
| [#11940](https://github.com/QwenLM/qwen-code/pull/11940) | `admit` 满额时即使最旧 child 没有任何 live session 或待处理工作，新的冷 workspace 仍会被拒绝；注册、历史和 runtime 服务本可保留，只回收空闲物理 child。 | 最终在首次拒绝后取消 reservation，从同一 registry 的可信 runtime 中筛选零 session、零 prompt/connection/task/Channel/Voice/coordinator activity 的候选，按 `lastUsedAt` 选择一个并复核 channel identity 后终止 exact child，再做一次 fresh admission；workspace 注册、文件与持久化历史保留，loaded session 不会被自动回收。 | 已把最终边界登记到daemon资源预算、总览与Linux容量实测。完整实现见 [implementations/pr-11940.md](implementations/pr-11940.md)。 |
| [#11960](https://github.com/QwenLM/qwen-code/pull/11960) | MCP 工具可成功返回数据，但 App resource 超限、超时、元数据错误或读取失败时，用户只看到缺失的 iframe，原因仅存在于 debug log。 | 当前 diff 把资源失败转换为 `mcp_app` 空 HTML fallback：可见警告包含 server/resource 与真实失败原因，超限报告 UTF-8 字节数，超时报告生效上限；原工具结果、LLM 内容和成功状态保持不变，caller cancellation 不新增警告。 | 变更聚焦工具展示降级，暂不新增长期 feature 专题。完整观察见 [implementations/pr-11960.md](implementations/pr-11960.md)。 |
| [#11981](https://github.com/QwenLM/qwen-code/pull/11981) | #11614 的 whole-CLI bwrap 后端缺少真实 Linux CI，mock spawn 无法证明 mount/network enforcement、普通 CLI hop、writer ownership 与进程清理。 | 当前 draft 新增独立 Ubuntu workflow 与 14 项真实 bwrap 集成用例，显式命令在缺少 Linux/bwrap 时失败，普通 integration suite 排除该组；覆盖工作区/越界写、open/closed 网络、linked worktree、fake-model Shell、writer lease 与 SIGINT/SIGTERM cleanup。 | 已更新 Linux 内核沙箱专题；当前 CI 有 classify、lint/static 与 Ubuntu test 失败，不能视为已落地覆盖。完整观察见 [implementations/pr-11981.md](implementations/pr-11981.md)。 |
| [#12008](https://github.com/QwenLM/qwen-code/pull/12008) | 自动回收只处理零 session runtime；loaded session 占满 ACP 名额时，用户缺少保留工作区/历史同时显式释放容量的恢复路径。 | 当前 diff 增加 stop-options 与 exact-identity stop 操作、additive capability/SDK/event，并在 WebShell 容量对话框中要求用户选择和确认；成功停止后等待 registry 释放，只允许原草稿一次 guarded continuation，被停止页面保留历史并要求显式 Resume。 | 已更新daemon session/protocol/SDK/WebUI、资源预算与总览；当前仍是 open diff。完整观察见 [implementations/pr-12008.md](implementations/pr-12008.md)。 |
| [#12064](https://github.com/QwenLM/qwen-code/pull/12064) | whole-CLI bwrap 同时约束模型网络与可信应用状态，而仅包 Shell 又会漏掉文件工具；需要把命令/文件副作用移到工具级 kernel boundary。 | 当前 draft 提供完整迁移参考：operator-only `tools.executionSandbox`、Shell/文件 worker、unsupported integration fail-closed、旧 bwrap selector 迁移错误、两架构无凭据验收 workflow，并删除 whole-CLI backend；该 148 文件方案正在拆分，不能视为 `main` 行为。 | 已更新 Linux 内核沙箱专题，标记为总体 draft/reference。完整观察见 [implementations/pr-12064.md](implementations/pr-12064.md)。 |
| [#12067](https://github.com/QwenLM/qwen-code/pull/12067) | 工具级 bwrap 需要结构化 executable/argv/env/stdin、可信完成证据、进程监管和受限文件 worker，且不能在 setup 不确定时重放 payload。 | 当前第一拆分只交付内部 foundation：`executeLaunch` 与 bwrap relay/receipt、pipe/PTY 生命周期、binary file worker/version checks、两份 worker 打包和独立 Linux verifier；不开放 runtime policy、公开设置或工具路由，旧 whole-CLI backend 仍保留。 | 已更新 Linux 内核沙箱专题，明确 foundation 与公开启用边界。完整观察见 [implementations/pr-12067.md](implementations/pr-12067.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [SDK](../../feature/sdk.md) | #11812/#11911(merged), #12008(open) | 更新 standalone UUID、count admission status 与 runtime-stop SDK 当前方案。 |
| [daemon客户端适配器与SDK](../../feature/daemon-serve-mode/10-client-adapters-and-sdk.md) | #11812/#11911(merged), #12008(open) | 登记 UUID fallback、admission 字段和 stop-options/stop-runtime additive client surface。 |
| [WebUI与传输](../../feature/daemon-serve-mode/11-webui-and-transport.md) | #11812/#11911(merged), #12008(open) | 记录普通 HTTP UUID、容量错误草稿保留和显式 stop/Resume 当前交互。 |
| [daemon session lifecycle](../../feature/daemon-serve-mode/03-session-lifecycle.md) | #12008(open) | 登记 exact-identity runtime stop、partial outcome 与 stopped-session 显式恢复边界。 |
| [daemon能力与协议](../../feature/daemon-serve-mode/04-capabilities-and-protocol.md) | #11911(merged), #12008(open) | 更新 additive admission status/error 与 runtime-stop capability/事件当前方案。 |
| [daemon资源预算](../../feature/daemon-serve-mode/13-resource-budgeting.md) | #11911/#11940(merged), #12008(open) | 登记数量准入、零会话单候选自动回收和 loaded-session 用户确认恢复的分层边界。 |
| [Linux 4c8g容量实测](../../feature/daemon-serve-mode/14-capacity-validation-linux-4c8g.md) | #11911/#11940(merged) | 修正 observe/admit 与自动回收的当前 `main` 口径，保留 heap/RSS enforcement 缺口。 |
| [daemon总览](../../feature/daemon-serve-mode/README.md) | #11812/#11911/#11940(merged), #12008(open) | 同步容量三阶段、SDK/WebShell 与未合入用户恢复边界。 |
| [Linux 内核沙箱](../../feature/linux-kernel-sandbox.md) | #11981/#12064/#12067(open) | 在 #11614 merged whole-CLI backend 基线上登记真实 CI draft、工具级总体迁移 draft 与第一拆分 foundation。 |
| [feature 索引](../../feature/README.md) | #11911/#11940(merged), #11960/#11981/#12008/#12064/#12067(open) | 同步 W38 状态、长期专题入口与无专题的展示诊断边界。 |

_按个人 PR 口径更新于 2026-09-18_
