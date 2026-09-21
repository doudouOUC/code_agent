# qwen-code PRs · 2026-09-14 ~ 2026-09-20 (W38 最终版)

> 本文件已整理 2026-09-14 至 2026-09-20（Asia/Shanghai）创建的 @doudouOUC 个人 PR。口径为 `QwenLM/qwen-code` 中 author 为 @doudouOUC 且 createdAt 落在对应北京时间日/周窗口内的 PR；只在窗口内更新、关闭或合入，但创建时间不在窗口内的 PR 不计入新增统计。open PR 只记录当前 diff 方案，不能视为 `main` 已落地能力。

**主题**: ACP child 容量/恢复/堆执行、MCP App 诊断、Linux bwrap 工具级拆分与 Landlock、Managed Agent 状态/Runtime 恢复预览、系统提示词精简、HTTP standalone UUID

**PR 统计**: 20 PRs - 11 merged / 8 open / 1 closed
**当前已合并 PR 代码量**: +16,787 / -960，207 个文件变更
**全量代码量**: +163,385 / -18,127，1,153 个文件变更
**类型分布**: feat ×12, fix ×5, other ×1, test ×1, docs ×1
**范围 (scope)**: serve/daemon ×6, web-shell ×4, sdk-typescript ×4, ci ×4, core ×9, linux-sandbox ×6, cli ×3, java ×2, managed-agent ×3, docs ×1

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
| [#11960](https://github.com/QwenLM/qwen-code/pull/11960) | ✅ merged | @doudouOUC | fix(mcp): show MCP App resource load warnings | +315/-49 | 4 | 09-15 16:25 | 09-18 03:03 |
| [#11981](https://github.com/QwenLM/qwen-code/pull/11981) | ⚪ closed | @doudouOUC | test(ci): Add real Linux bwrap integration coverage | +815/-7 | 12 | 09-16 03:31 | 09-20 12:41 |
| [#12008](https://github.com/QwenLM/qwen-code/pull/12008) | ✅ merged | @doudouOUC | feat(serve): let users stop workspace runtimes to release ACP capacity | +4798/-359 | 59 | 09-16 08:35 | 09-19 01:52 |
| [#12064](https://github.com/QwenLM/qwen-code/pull/12064) | 🟡 open draft | @doudouOUC | feat(core): Move bwrap confinement to tool execution | +8800/-3141 | 132 | 09-17 04:11 | — |
| [#12067](https://github.com/QwenLM/qwen-code/pull/12067) | ✅ merged | @doudouOUC | feat(core): Add the bwrap execution foundation | +3732/-48 | 25 | 09-17 05:31 | 09-19 13:54 |
| [#12265](https://github.com/QwenLM/qwen-code/pull/12265) | ✅ merged | @doudouOUC | docs(serve): Document ACP child heap calibration | +648/-0 | 3 | 09-19 15:38 | 09-20 03:22 |
| [#12267](https://github.com/QwenLM/qwen-code/pull/12267) | 🟡 open draft | @doudouOUC | feat(cli): Move bwrap sandboxing to tool execution | +2180/-3057 | 82 | 09-19 15:48 | — |
| [#12269](https://github.com/QwenLM/qwen-code/pull/12269) | ✅ merged | @doudouOUC | feat(core): Route runtime tools through bwrap | +4612/-205 | 46 | 09-19 16:16 | 09-20 23:41 |
| [#12278](https://github.com/QwenLM/qwen-code/pull/12278) | 🟡 open draft | @doudouOUC | feat(core): Add Landlock execution fallback | +8214/-3594 | 146 | 09-19 18:18 | — |
| [#12301](https://github.com/QwenLM/qwen-code/pull/12301) | 🟡 open | @doudouOUC | feat(java): Add managed runtime state foundation | +1632/-2 | 20 | 09-20 04:07 | — |
| [#12302](https://github.com/QwenLM/qwen-code/pull/12302) | 🟡 open | @doudouOUC | feat(core): Add managed session record foundation | +2463/-2 | 8 | 09-20 04:07 | — |
| [#12353](https://github.com/QwenLM/qwen-code/pull/12353) | 🟡 open draft | @doudouOUC | feat(serve): Add opt-in fixed ACP child heap enforcement | +993/-427 | 27 | 09-20 13:34 | — |
| [#12358](https://github.com/QwenLM/qwen-code/pull/12358) | 🟡 open draft | @doudouOUC | feat(managed-agent): Add standalone managed agent stack | +121033/-5652 | 514 | 09-20 14:31 | — |
| [#12360](https://github.com/QwenLM/qwen-code/pull/12360) | 🟡 open | @doudouOUC | fix(core): Simplify system prompts and remove conflicting examples | +468/-1285 | 5 | 09-20 15:06 | — |

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
| [#11960](https://github.com/QwenLM/qwen-code/pull/11960) | MCP 工具可成功返回数据，但 App resource 超限、超时、元数据错误或读取失败时，用户只看到缺失的 iframe，原因仅存在于 debug log。 | 最终把资源失败转换为 `mcp_app` 空 HTML fallback：可见警告包含 server/resource 与真实失败原因，超限报告 UTF-8 字节数；host/SDK timeout 才标注生效上限，server 自报 `-32001` 保留原错误。原工具结果、LLM 内容和成功状态不变，caller cancellation 不新增警告。 | 变更聚焦工具展示降级，未新增长期 feature 专题。完整实现见 [implementations/pr-11960.md](implementations/pr-11960.md)。 |
| [#11981](https://github.com/QwenLM/qwen-code/pull/11981) | #11614 的 whole-CLI bwrap 后端缺少真实 Linux CI，mock spawn 无法证明 mount/network enforcement、普通 CLI hop、writer ownership 与进程清理。 | 关闭前 draft 增加独立 Ubuntu workflow 与 14 项真实 bwrap 集成用例，覆盖工作区/越界写、open/closed 网络、linked worktree、fake-model Shell、writer lease 与信号 cleanup；最终 closed-unmerged，classify、lint/static 与 Ubuntu test 仍失败。 | 已更新 Linux 内核沙箱专题为 closed 历史方案，不能视为已落地覆盖。完整观察见 [implementations/pr-11981.md](implementations/pr-11981.md)。 |
| [#12008](https://github.com/QwenLM/qwen-code/pull/12008) | 自动回收只处理零 session runtime；loaded session 占满 ACP 名额时，用户缺少保留工作区/历史同时显式释放容量的恢复路径。 | 最终增加 stop-options 与 exact-identity stop 操作、additive capability/SDK/event，并在 WebShell 容量对话框中要求用户选择和确认；停止只在 registry 证明名额释放后完成，只允许原草稿一次 guarded continuation。队列、deferred `/plan`、停止态 submit 与 rejected-intent fences 防止隐式执行，被停止页面保留历史并要求显式 Resume。 | 已更新daemon session/protocol/SDK/WebUI、资源预算、容量实测与总览。完整实现见 [implementations/pr-12008.md](implementations/pr-12008.md)。 |
| [#12064](https://github.com/QwenLM/qwen-code/pull/12064) | whole-CLI bwrap 同时约束模型网络与可信应用状态，而仅包 Shell 又会漏掉文件工具；需要把命令/文件副作用移到工具级 kernel boundary。 | 当前 132 文件 draft 提供完整迁移参考：operator-only `tools.executionSandbox`、Shell/文件 worker、unsupported integration fail-closed、旧 selector 迁移错误和跨架构验收；当前 head 两个 Bwrap acceptance lane 失败，且方案正拆为独立 PR。 | 已更新 Linux 内核沙箱专题，标记为总体 draft/reference。完整观察见 [implementations/pr-12064.md](implementations/pr-12064.md)。 |
| [#12067](https://github.com/QwenLM/qwen-code/pull/12067) | 工具级 bwrap 需要结构化 executable/argv/env/stdin、可信完成证据、进程监管和受限文件 worker，且不能在 setup 不确定时重放 payload。 | 最终第一拆分交付内部 foundation：`executeLaunch` 与 bwrap relay/receipt、最多 1 秒 post-exit drain、三态执行证据保留、16 KiB header 加精确长度的 binary file worker、两份 worker 打包和 36 项 Linux verifier；不开放 runtime policy、公开设置或工具路由。 | 已更新 Linux 内核沙箱专题，明确 merged foundation 与公开启用边界。完整实现见 [implementations/pr-12067.md](implementations/pr-12067.md)。 |
| [#12265](https://github.com/QwenLM/qwen-code/pull/12265) | count admission、空闲回收与用户 stop 已落地，但 modeled per-child heap ceiling 仍缺少可审计的实机校准证据，不能仅凭 RSS 或策略下限启用。 | 最终 docs-only diff 发布中英设计与 compact summary；Node 24 接受集汇总 8 次运行、184 个真实模型回合和 360 次精确工具调用，包含长会话、MCP、四 child 并发的 3632/544 MiB 对照，同时保留协议/hash、排除尝试和覆盖缺口。生产 enforcement 仍关闭。 | 已更新daemon资源预算、Linux 4c8g容量实测、daemon总览与feature索引。完整实现见 [implementations/pr-12265.md](implementations/pr-12265.md)。 |
| [#12267](https://github.com/QwenLM/qwen-code/pull/12267) | whole-CLI bwrap 把可信模型/认证/会话面一起放入沙箱，而工具级执行若只接部分入口又会从未迁移路径回落宿主。 | 当前 draft 已在 merged #12269 上重基线，为普通 headless、Ink/OpenTUI 暴露 operator-only policy，让已接入工具与直接 shell 入口共用 runtime boundary，删除 whole-CLI bwrap，对旧 selector 给迁移错误，并对未移植宿主副作用 fail closed；后续加固 operator 设置读取/合并并让 settings-cache failure fixture 使用 malformed sandbox policy，但精确 head Linux 验收仍后置。 | 已更新 Linux 内核沙箱专题与feature索引；不能视为 `main` 公开能力。完整观察见 [implementations/pr-12267.md](implementations/pr-12267.md)。 |
| [#12269](https://github.com/QwenLM/qwen-code/pull/12269) | 已合入 foundation 尚未接到生产工具，需要可信宿主一次准入且不可被 workspace 放宽的内部策略，覆盖 Shell/Monitor 与文件变更并阻断未迁移入口。 | 最终冻结 canonical workspace/install/state policy，Shell/Monitor 走 bwrap adapter，Write/Edit 走带 stale-version 核验的 file worker；派生 Config 保持同一 ceiling，未支持 agent/worktree/MCP/LSP 等在副作用前拒绝，且不公开配置。 | 已更新 Linux 内核沙箱专题与feature索引，标记为 merged internal integration。完整实现见 [implementations/pr-12269.md](implementations/pr-12269.md)。 |
| [#12278](https://github.com/QwenLM/qwen-code/pull/12278) | bwrap 在缺二进制、user namespace 或 mount 能力的 Linux 上不可用，但 host fallback 会破坏工具级 fail-closed 边界。 | 当前 stacked draft 增加 Landlock x64/arm64 helper；显式或 `auto` 只在 open command network 下选择，启动时固定 effective backend/ABI，workspace-write 才授予工作区写，receipt 不确定时不回放 payload，并明确报告 `partial`。 | 已更新 Linux 内核沙箱专题与feature索引。完整观察见 [implementations/pr-12278.md](implementations/pr-12278.md)。 |
| [#12301](https://github.com/QwenLM/qwen-code/pull/12301) | Managed Runtime Broker 缺少可先独立评审的多租户 identity、乐观版本和 operation lease 状态边界。 | 当前 open Java 21 模块定义 binding/session record 与 repository contract，内存实现原子 `findOrCreate`、CAS、可过期 claim/renew、scope isolation 和 generation fencing；不含 Spring、HTTP、持久化或真实 provision。 | 已在 Managed Agents 专题登记 state foundation。完整观察见 [implementations/pr-12301.md](implementations/pr-12301.md)。 |
| [#12302](https://github.com/QwenLM/qwen-code/pull/12302) | Managed Session 的 writer/recovery/projection 需要先共享一份封闭、可校验的记录格式，私有日志也不能混入普通对话。 | 当前 open diff 定义 v1 header/event/commit marker、closed kind/domain/state、strict raw/typed parser、actor/transition/transaction/digest 校验，并把三种 subtype 注册为非对话 transcript record；不含 writer、Harness 或迁移。 | 已在 Managed Agents 专题登记 record foundation。完整观察见 [implementations/pr-12302.md](implementations/pr-12302.md)。 |
| [#12353](https://github.com/QwenLM/qwen-code/pull/12353) | `admit` 只限制 child 数量，真实 V8 old-space 仍沿用 host-derived 参数，modeled fixed partition 无法执行。 | 当前 draft 新增 opt-in `enforce`：所有 managed ACP child 共用 boot-resolved fixed ceiling 与 count admission，替换 inherited fixed heap flag、拒绝 percentage 冲突，仅在真实接线时报告 enforced；默认 `observe` 及 `admit` heap 行为不变。 | 已更新daemon资源预算、容量实测、总览与feature索引。完整观察见 [implementations/pr-12353.md](implementations/pr-12353.md)。 |
| [#12358](https://github.com/QwenLM/qwen-code/pull/12358) | Java 控制面、常驻 Harness、按需 Tool Runtime、持久事件和 dual-path WebShell 尚缺一条可运行的整体预览链路，Runtime endpoint 也必须在 Java 重启后按物理身份恢复而非盲信旧 URL。 | 当前 514 文件/154 commit draft 汇总 Spring 服务、Hosted Harness、Runtime Broker、Managed record/authority、事件批处理/提交后 SSE、SDK 与 WebShell，并增加加密持久 seed/resource handle、reconcile+attest gate、同宿主进程接管和 Kubernetes adapter；本地/MySQL/fake-Kubernetes 证据仍不等于真实集群或完整生产验收。 | 保留并增量更新 Managed Agents 既有专题，不按大 draft 重写。完整观察见 [implementations/pr-12358.md](implementations/pr-12358.md)。 |
| [#12360](https://github.com/QwenLM/qwen-code/pull/12360) | 主会话 prompt 重复规则，并在 headless no-reply 模式中保留主动追问示例，增加上下文且产生行为冲突。 | 当前 open diff 合并重复 guidance，把五种 format 的示例从七个减为三个并删除 headless 冲突问句，保留 capability filtering、interactive/ACP clarification、CodeModeOnly 约定和安全边界；固定输入体积下降不等于真实模型质量已验证。 | 暂不新建长期专题，在feature索引登记当前 open 方案。完整观察见 [implementations/pr-12360.md](implementations/pr-12360.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [SDK](../../feature/sdk.md) | #11812/#11911/#12008(merged), #12301/#12353(open) | 更新 standalone UUID、count admission/runtime-stop SDK surface，并登记 Java state foundation 与 heap enforcement status 的未合入边界。 |
| [daemon客户端适配器与SDK](../../feature/daemon-serve-mode/10-client-adapters-and-sdk.md) | #11812/#11911/#12008(merged) | 登记 UUID fallback、admission 字段和 stop-options/stop-runtime additive client surface。 |
| [WebUI与传输](../../feature/daemon-serve-mode/11-webui-and-transport.md) | #11812/#11911/#12008(merged) | 记录普通 HTTP UUID、容量错误草稿保留和显式 stop/Resume 最终交互。 |
| [daemon session lifecycle](../../feature/daemon-serve-mode/03-session-lifecycle.md) | #12008(merged) | 登记 exact-identity runtime stop、partial outcome 与 stopped-session 显式恢复边界。 |
| [daemon能力与协议](../../feature/daemon-serve-mode/04-capabilities-and-protocol.md) | #11911/#12008(merged) | 更新 additive admission status/error 与 runtime-stop capability/事件最终契约。 |
| [daemon资源预算](../../feature/daemon-serve-mode/13-resource-budgeting.md) | #11911/#11940/#12008/#12265(merged), #12353(open) | 登记数量准入、恢复链、已合入 heap 校准证据与 opt-in `enforce` draft。 |
| [Linux 4c8g容量实测](../../feature/daemon-serve-mode/14-capacity-validation-linux-4c8g.md) | #11911/#11940/#12008/#12265(merged), #12353(open) | 对齐 count recovery 与 Node 24 evidence，标记 fixed-heap enforcement 尚未合入/跨平台校准。 |
| [daemon总览](../../feature/daemon-serve-mode/README.md) | #11812/#11911/#11940/#12008/#12265(merged), #12353(open) | 同步容量三阶段、校准证据与 `enforce` draft 边界。 |
| [Linux 内核沙箱](../../feature/linux-kernel-sandbox.md) | #12067/#12269(merged), #11981(closed), #12064/#12267/#12278(open) | 登记 foundation、merged runtime integration、关闭的旧 CI、总体参考、公开 cutover 与 Landlock stacked draft。 |
| [Managed Agents](../../feature/managed-agents/README.md) | #12301/#12302/#12358(open) | 增量登记 Java state、Core record foundation，以及加入 durable Runtime recovery 的超大 standalone preview，不覆盖既有更完整目标设计。 |
| [feature 索引](../../feature/README.md) | 本周全部 20 个 PR | 同步 W38 最终周范围、状态、长期专题入口及无专题的诊断/提示词边界。 |

_按个人 PR 口径更新于 2026-09-21_
