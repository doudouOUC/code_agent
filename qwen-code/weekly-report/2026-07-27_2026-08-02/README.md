# qwen-code PRs · 2026-07-27 ~ 2026-08-02 (W31 周内累计)

> 本文件已整理 2026-07-27（Asia/Shanghai）创建的 @doudouOUC 个人 PR。口径为 `QwenLM/qwen-code` 中 author 为 @doudouOUC 且 createdAt 落在对应北京时间日窗口内的 PR；只在窗口内更新、关闭或合入，但创建时间不在窗口内的 PR 不计入新增统计。open PR 只记录当前 diff 方案，不能视为 `main` 已落地能力。

**主题**: daemon first-output latency benchmark、submitted prompt provenance、ACP provider preload after session creation、managed session writer shutdown、first-output benchmark validity/schema hardening、Todo Stop Guard continuation hardening、first-output benchmark artifact schema simplification

**PR 统计**: 7 PRs - 3 merged / 4 open / 0 closed
**当前已合并 PR 代码量**: +7,214 / -304，47 个文件变更
**全量代码量**: +14,088 / -1,411，95 个文件变更
**类型分布**: fix ×4, feat ×1, perf ×1, test ×1
**范围 (scope)**: serve ×2, test ×2, acp ×1, daemon ×1, hooks ×1

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 变更 | 文件 | 创建(UTC) | 合并/关闭(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#7761](https://github.com/QwenLM/qwen-code/pull/7761) | ✅ merged | @doudouOUC | test(serve): Add first-output latency benchmark | +4632/-7 | 6 | 07-26 19:57 | 07-27 03:38 |
| [#7762](https://github.com/QwenLM/qwen-code/pull/7762) | ✅ merged | @doudouOUC | feat(hooks): Add submitted prompt provenance | +2535/-223 | 37 | 07-26 20:07 | 07-27 15:53 |
| [#7767](https://github.com/QwenLM/qwen-code/pull/7767) | 🟡 open | @doudouOUC | perf(acp): Preload providers after session creation | +646/-10 | 6 | 07-26 22:13 | — |
| [#7812](https://github.com/QwenLM/qwen-code/pull/7812) | 🟡 open | @doudouOUC | fix(serve): Release managed session writer locks on shutdown | +2034/-315 | 20 | 07-27 06:57 | — |
| [#7820](https://github.com/QwenLM/qwen-code/pull/7820) | 🟡 open | @doudouOUC | fix(test): Restore first-output benchmark measurement validity and correct its artifact schema | +273/-101 | 7 | 07-27 08:20 | — |
| [#7821](https://github.com/QwenLM/qwen-code/pull/7821) | 🟡 open | @doudouOUC | fix(daemon): harden Todo Stop Guard continuations | +3921/-681 | 15 | 07-27 08:21 | — |
| [#7825](https://github.com/QwenLM/qwen-code/pull/7825) | ✅ merged | @doudouOUC | fix(test): Correct first-output benchmark artifact schema and simplify | +47/-74 | 4 | 07-27 08:48 | 07-27 08:51 |

---

## PR 解决问题、实现方式与 feature 处理

| PR | 解决了什么问题 | 最终怎么实现（open 只登记当前观察） | 对应 feature 文档 |
|---|---|---|---|
| [#7761](https://github.com/QwenLM/qwen-code/pull/7761) | daemon/ACP 首次输出延迟此前只有粗粒度 startup profile，无法把进程启动、session readiness、provider request 到达、首个模型输出、首段 answer text 和 terminal 分开度量，也无法用成对实验判断 preload 类优化是否真的改善用户体感。 | 最终实现新增 opt-in first-output benchmark harness，隔离进程、workspace、home、Qwen home、端口与 compile cache，支持单 bundle cold/warm baseline 与双 bundle AB/BA paired comparison；事件关联以 prompt/session/request 为准，过滤 replay/status/usage/role-only/user echo/compression diagnostics/tool updates，产出 versioned JSON+Markdown artifact、所有 sample、failure code、relative timestamp、request count、cleanup evidence、percentile summary、paired bootstrap CI 与 order-sensitivity。fake OpenAI server 在 benchmark 响应后确定性关闭连接，避免连接池污染。 | 已更新 [cli-startup-performance.md](../../feature/cli-startup-performance.md) 与 daemon feature。完整实现见 [implementations/pr-7761.md](implementations/pr-7761.md)。 |
| [#7762](https://github.com/QwenLM/qwen-code/pull/7762) | `UserPromptSubmit` hook 只能看到已经扩展后的 model-bound `prompt`，无法区分用户原始输入和 reminder、file/resource expansion、slash command、extension、vision 等系统扩展；安全审计和 provenance 需要知道用户实际提交文本，但又不能改变模型上下文或既有 hook 顺序。 | 最终实现给 `UserPromptSubmit` 增加可选 `submitted_prompt`，TUI 只在 fresh `UserQuery` 上填入 trimmed text projection，sidecar 让 deferred turn 与 exact in-memory restoration 继承该 provenance；large paste 使用 compact placeholder projection。对 ambiguous batches、edited restorations、same-turn steering、recursive continuation、retry、machine traffic、unsupported producer、`--prompt-interactive` startup、Vim NORMAL direct submission、image-only 等场景直接省略。取消恢复路径保留 main-turn ownership，同时允许并发 `/btw` side question。 | 新增 [hooks.md](../../feature/hooks.md)。完整实现见 [implementations/pr-7762.md](implementations/pr-7762.md)。 |
| [#7767](https://github.com/QwenLM/qwen-code/pull/7767) | #7761 证明 ACP child 在 session accepted 后到首个 provider 输出之间仍会为 lazy Provider 构造付费；如果等用户第一条 prompt 才加载 provider，首字延迟仍偏高。 | 当前 open diff 在 ACP `session/new` response 写回 child transport 之后，best-effort 触发内部 lazy Provider preparation；第一条 prompt 复用同一个 in-flight/completed promise，preload 与立即 prompt 并发时只构造一次 Provider。非 lazy generator no-op，background failure 被捕获但 rejected promise 仍 memoized 给首次真实调用观察；Qwen OAuth hot model switch、ACP worktree relocation 会丢弃未使用 preload，已经用于请求的 generator 不被替换。 | 已更新 [cli-startup-performance.md](../../feature/cli-startup-performance.md) 与 daemon feature。当前实现见 [implementations/pr-7767.md](implementations/pr-7767.md)。 |
| [#7812](https://github.com/QwenLM/qwen-code/pull/7812) | daemon-managed ACP child 在 daemon shutdown / replacement 时可能没有释放 exact-owned session writer lock；新 daemon 在不同 hostname 上无法证明旧 owner 已死，如果直接抢锁会产生双写风险，不抢锁又可能留下不可恢复的 writer conflict。 | 当前 open diff 建立 cooperative shutdown：首个 shutdown signal 同步关闭 session/turn admission，等待已接受 transcript work drain，原子 retire exact-owned writer locks；SessionEnd hooks 与 resource cleanup 在 writer phase settle 后运行。daemon 级 registry 跟踪 primary/secondary/dynamic runtimes 的所有 ACP children，先 SIGTERM，5s 后 SIGKILL，10s 内要求 raw process reap；partial channel construction 与 overlapping teardown join 同一 terminal outcome。managed acquisition 不再基于 hostname、age、container-visible PID 抢 existing writer lock，standalone ACP 才保留 local stale-owner recovery。 | 已更新 [daemon-serve-mode/03-session-lifecycle.md](../../feature/daemon-serve-mode/03-session-lifecycle.md) 与 [daemon-serve-mode/12-daemon-sdk-reliability-audit.md](../../feature/daemon-serve-mode/12-daemon-sdk-reliability-audit.md)。当前实现见 [implementations/pr-7812.md](implementations/pr-7812.md)。 |
| [#7820](https://github.com/QwenLM/qwen-code/pull/7820) | #7761 benchmark 在 review 中暴露了若干有效性问题：dwell anchor 绑在 session readiness 而非 SSE readiness、共享 integration config 会并发干扰 benchmark、Phase 1 gate 只看裸 percentile diff、artifact schema 中 bundle-level git commit 等字段口径不准。 | 当前 open diff 把 dwell anchor 改成 SSE readiness 并记录实际 idle window；benchmark runner 从共享 integration config 中拆出 serial 专用 config，helper tests 保持在共享套件；Phase 1 gate 改用 paired bootstrap CI lower bound，percentile diff 仅作连续观察。artifact schema 删除错误的 bundle-level git commit、重命名 prompt shape prose 字段并提升 schema version；所有 invalid duration 归一化，success predicate 合并，comparison-only dwell 在 single-mode reject 后解析，设计文档同步更正。 | 已更新 [cli-startup-performance.md](../../feature/cli-startup-performance.md)。当前实现见 [implementations/pr-7820.md](implementations/pr-7820.md)。 |
| [#7821](https://github.com/QwenLM/qwen-code/pull/7821) | Todo Stop Guard continuation 与 daemon bridge/desktop/channel consumer 之间的 prompt ordering 仍不够原子；continuation 可能与用户输入、model selection、compression/provider submission、workspace relocation、session disposal 或外部 Stop hooks 交错，导致续跑拿错 owner、误删内容或污染较新的 prompt。 | 当前 open diff 把 continuation 排序变成 owner-scoped state machine：bridge invocation prompt id 作为可信 owner claim/release key，Guard 在 queued input/model selection 之后、compression/provider submission 之前 claim 排序位置；失败恢复保留已 drain 用户内容与成功 function responses，只移除 synthetic Guard prompt。若 continuation supersedes inspected response，会重跑 Stop hooks；非阻断 allow 后重置 consecutive block accounting；claim 失败时 fail closed 并保留独立外部 Stop hook。session lifecycle 还把 work-chain agent/monitor lineage、workspace relocation close gate、overlapping prompt ownership 与 cron queue cap 一并收紧。 | 已更新 [daemon-serve-mode/03-session-lifecycle.md](../../feature/daemon-serve-mode/03-session-lifecycle.md)。当前实现见 [implementations/pr-7821.md](implementations/pr-7821.md)。 |
| [#7825](https://github.com/QwenLM/qwen-code/pull/7825) | #7761 的 artifact schema 和若干 helper 还存在 review follow-up：bundle-level commit provenance 错误、prompt shape 字段名像结构化数据但实际是说明文字、order balance check 在当前实现下不可达，success 判定也有重复。 | 最终实现删除 bundle-level git commit、重命名 prompt shape 说明字段、提升 schema version；移除不可能触发的 ordering balance check，合并重复 success predicate，并把 comparison-only dwell 解析放到 single-mode reject 之后以给出准确错误。设计文档补充 buffer overflow 同时 latch failure 和 drop frame、cold/warm delta 只是 preload recoverability upper bound、两个 median 定义并存、compile-cache dir 会记录但 teardown 删除。 | 已更新 [cli-startup-performance.md](../../feature/cli-startup-performance.md)。完整实现见 [implementations/pr-7825.md](implementations/pr-7825.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [cli-startup-performance.md](../../feature/cli-startup-performance.md) | #7761 / #7767(open) / #7820(open) / #7825 | 补 daemon/ACP first-output latency benchmark 的阶段边界、artifact、paired comparison、schema follow-up，以及 #7767 当前 open diff 的 provider preload after ACP session creation。 |
| [hooks.md](../../feature/hooks.md) | #7762 | 新增 hooks submitted prompt provenance 技术方案，记录 `submitted_prompt` 的边界、生产者覆盖、恢复/取消语义、隐私与验证。 |
| [daemon-serve-mode/](../../feature/daemon-serve-mode/) | #7761 / #7767(open) / #7812(open) / #7821(open) | 补 first-output benchmark 与 provider preload 对 daemon/ACP 首输出路径的影响，补 managed session writer shutdown 与 Todo Stop Guard continuation hardening 的会话生命周期/可靠性口径。 |

_周内累计按个人 PR 口径更新于 2026-07-27_
