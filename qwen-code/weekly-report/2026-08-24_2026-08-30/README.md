# qwen-code PRs · 2026-08-24 ~ 2026-08-30 (W35 周内累计)

> 本文件当前整理 2026-08-24 至 2026-08-25（Asia/Shanghai）创建的 @doudouOUC 个人 PR。口径为 `QwenLM/qwen-code` 中 author 为 @doudouOUC 且 createdAt 落在对应北京时间日/周窗口内的 PR；只在窗口内更新、关闭或合入，但创建时间不在窗口内的 PR 不计入新增统计。open PR 只记录当前 diff 方案，不能视为 `main` 已落地能力。

**主题**: Live task bridge session ID canonicalization、conditional-close refusal hold 上限、当前会话 scheduled task 复用、ACP permission/AUQ 默认无限等待、ACP channel transport liveness、standalone session 内部核心、OTel context usage 属性

**PR 统计**: 7 PRs - 4 merged / 3 open / 0 closed
**当前已合并 PR 代码量**: +1,530 / -113，33 个文件变更
**全量代码量**: +14,260 / -1,052，140 个文件变更
**类型分布**: fix ×3, feat ×4
**范围 (scope)**: serve/daemon ×5, acp-bridge ×6, cli/acp-integration ×5, core ×4, web-shell ×1, telemetry ×1, docs/design ×5

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 代码量 | 文件数 | 创建时间(UTC) | 合并/关闭时间(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#9819](https://github.com/QwenLM/qwen-code/pull/9819) | ✅ merged | @doudouOUC | fix(serve): Canonicalize Live task bridge session IDs | +396/-42 | 4 | 08-23 16:37 | 08-24 09:11 |
| [#9820](https://github.com/QwenLM/qwen-code/pull/9820) | ✅ merged | @doudouOUC | fix(daemon): Bound conditional-close refusal holds | +104/-12 | 5 | 08-23 16:43 | 08-24 05:00 |
| [#9838](https://github.com/QwenLM/qwen-code/pull/9838) | 🟡 open | @doudouOUC | feat(daemon): Support current-session scheduled tasks | +2132/-192 | 27 | 08-24 03:43 | — |
| [#9933](https://github.com/QwenLM/qwen-code/pull/9933) | ✅ merged | @doudouOUC | fix(acp-bridge): Disable permission timeout by default | +179/-58 | 15 | 08-24 12:09 | 08-24 16:09 |
| [#9976](https://github.com/QwenLM/qwen-code/pull/9976) | ✅ merged | @doudouOUC | feat(daemon): Add ACP channel transport liveness | +851/-1 | 9 | 08-25 03:42 | 08-25 06:29 |
| [#9978](https://github.com/QwenLM/qwen-code/pull/9978) | 🟡 open | @doudouOUC | feat(cli): Add standalone sessions for projectless tasks | +9150/-710 | 67 | 08-25 03:47 | — |
| [#10016](https://github.com/QwenLM/qwen-code/pull/10016) | 🟡 open | @doudouOUC | feat(telemetry): Emit context usage span attribute | +1448/-37 | 13 | 08-25 12:05 | — |

---

## PR 解决问题、实现方式与 feature 处理

| PR | 解决了什么问题 | 最终怎么实现（open/closed 只登记当前观察） | 对应 feature 文档 |
|---|---|---|---|
| [#9819](https://github.com/QwenLM/qwen-code/pull/9819) | Live task 使用持久化 session ID 的原始大小写做 bridge/runtime 操作，mixed-case UUID 可能找不到已驻留会话、重复 cold resume，或让 storage owner 与 live owner 判断落在不同 key 上。 | 最终把 caller-visible/persisted `threadId` 与 canonical `bridgeSessionId` 分离：存储读取和协议返回保留原 spelling，resident bridge lookup、owner resolution、resume、event subscription、prompt dispatch 与 Conversations private directory 统一使用 `normalizeSessionIdForLookup()`；已有 canonical resident entry 优先复用，存储/live owner 不一致或存储多解时 fail closed。 | 已在 daemon session lifecycle 与总览登记为 merged Live task identity follow-up。完整实现见 [implementations/pr-9819.md](implementations/pr-9819.md)。 |
| [#9820](https://github.com/QwenLM/qwen-code/pull/9820) | child 拒绝 conditional close 时可返回 active-work holds；若无上限采纳并缓存，异常或恶意超大数组会让 daemon 遍历、保留和报告无界数据，放大 close/reap 路径成本。 | 最终复用共享 `ACTIVE_WORK_MAX_SESSION_HOLDS = 1024`：拒绝语义仍保留 session，但只有长度不超过 1024 的 hold 数组会被遍历并替换缓存；超限响应不采纳、保留最后一次合法 cache。恰好 1024 可采纳，1025 不替换，wire 与 capability 不变。 | 已在 daemon lifecycle、ACP bridge 与总览登记为 merged activeWork hardening。完整实现见 [implementations/pr-9820.md](implementations/pr-9820.md)。 |
| [#9838](https://github.com/QwenLM/qwen-code/pull/9838) | scheduled task 只能创建独立 session，无法把任务绑定到当前 daemon 会话继续执行；若直接复用当前 session，又必须防止子会话、特殊来源、跨 workspace、活跃 prompt、pending interaction 或已有 task 绑定被错误接管。 | 当前 open diff 给 `cron_create` 增加 `sessionMode:'current'` opt-in，要求 `durable:true` 且来自当前 daemon 顶层 prompt；Core 通过 prompt context 调 private ACP creator，bridge 校验 connection/session/prompt 精确归属，Serve host 再校验 workspace owner、idle/当前精确 prompt、无 pending interaction、普通 source、无 parent/既有 task，并以 generation assertion + rollback 持久化 `sessionOwnedByTask:false`。能力 `scheduled_task_session_reuse` 只在 managed runtime 完整挂载后广告，fast-path bootstrap envelope 可暂时缺少该 tag；Web Shell 仅在 capability 和当前 session 状态允许时展示并发送复用选择。 | 新增 [scheduled-tasks.md](../../feature/scheduled-tasks.md) 汇总跨层方案，并在 daemon lifecycle、capabilities、ACP bridge、WebUI 与总览登记为 open 观察。完整观察见 [implementations/pr-9838.md](implementations/pr-9838.md)。 |
| [#9933](https://github.com/QwenLM/qwen-code/pull/9933) | ACP 普通权限和 `ask_user_question` 默认 5 分钟自动取消，长时间无人值守、跨时区审批或恢复后的 HITL 会被默认 deadline 非预期中断；文档与 stderr 还把 timeout 写成必然存在。 | 最终把共享默认值改为 `0`：未配置或显式 0 时不装 timeout，等待投票/回答、voter/session cancellation 或 daemon shutdown；正整数仍同时约束普通权限与 AUQ，并继续做启动校验和 timer clamp。empty-voter/split-vote breadcrumb、CLI help、settings schema 与设计文档同步成 optional timeout，不改 wire、策略或 restore 协议。 | 已更新 permission system、daemon HTTP/capabilities/ACP permission 与总览中的默认值和兼容迁移口径。完整实现见 [implementations/pr-9933.md](implementations/pr-9933.md)。 |
| [#9976](https://github.com/QwenLM/qwen-code/pull/9976) | daemon 只能感知 ACP child 退出或显式 transport failure；child 若进程仍在且 pipe 未断、但事件循环或协议处理已冻结，共享该 channel 的全部 session 会无限驻留，单 session activeWork 又不足以证明整条 channel 已死。 | 最终增加协商式 channel-level liveness v1：支持方在 initialize 确认后按共享 channel 回显 nonce；parent 每次健康响应后等待 15 秒再探测，单次 10 秒超时立即重试，连续两次按时超时才进入既有 transport-failure teardown。单调时钟把 parent timer 延迟归为 local delay 并清零 streak；错误版本/nonce 或 request rejection 直接按协议失败处理，未协商 child 保持旧行为。 | 已在 daemon lifecycle、ACP bridge 与总览登记为 merged transport liveness；不新增 public Serve capability。完整实现见 [implementations/pr-9976.md](implementations/pr-9976.md)。 |
| [#9978](https://github.com/QwenLM/qwen-code/pull/9978) | projectless task 仍可能沿用 legacy Conversations/workspace 行为，在创建、恢复或 follow-up 时观察未选择的共享 cwd/project 状态；在公开 standalone API 前还缺统一的持久化 identity、私有目录 containment、owner routing 和终止性失败隔离。 | 当前 open diff 增加内部 `StandaloneSessionService`，在共享 Conversations runtime 中创建、查询、列表、load/resume、prompt/continue，并把 canonical persisted ID 绑定到确定性的 owner-only direct-child directory；projectless Live task 与 standalone child 复用 explicit `sourceType:'standalone'`。generic routes 和配置/权限/cron/workflow 等 source-aware guards 阻止 workspace 能力越界；目录 compromise、spawn outcome 不明或 close 无法证明时 quarantine runtime，已知 owner 不 fallback primary。 | 已在 daemon lifecycle、capabilities 与 ACP bridge 登记为 open PR2B 内部集成；没有 `/standalone/*`、`standalone_sessions_v1`、SDK 或 UI。完整观察见 [implementations/pr-9978.md](implementations/pr-9978.md)。 |
| [#10016](https://github.com/QwenLM/qwen-code/pull/10016) | `qwen-code.llm_request` 只有 provider 总输入 token，无法在 trace 中区分 system prompt、built-in/MCP tools、memory、skills 与 messages 对上下文窗口和自动压缩余量的占用；`/context` 的交互式拆分也不能与延迟、重试或错误关联。 | 当前 open diff 在用户可见 LLM request span 上增加最长 1024 字符的私有 JSON 属性 `qwen-code.context.usage`。请求开始时从 provider-neutral request 与已提交内存 cache 同步估算六类用量；结束时若 provider 给出合法 input total，则保留固定类别比例并把 messages 归一化为 residual，使分类和严格等于 `gen_ai.usage.input_tokens`，同时计算 compaction 前余量。内部 prompt、关闭 telemetry、异常或序列化超限均 best-effort 省略。 | 已在 telemetry 总览与 GenAI request 子文档登记为 open；只记录 numeric aggregate，不新增 metric/log/session 字段。完整观察见 [implementations/pr-10016.md](implementations/pr-10016.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [daemon-serve-mode/](../../feature/daemon-serve-mode/README.md) | #9819 / #9820 / #9838(open) / #9933 / #9976 / #9978(open) | 刷新 Live task identity、activeWork 上限、current-session task、permission timeout、channel liveness 与 standalone PR2B 边界。 |
| [daemon-serve-mode/01-http-server-and-middleware.md](../../feature/daemon-serve-mode/01-http-server-and-middleware.md) | #9838(open) / #9933 | 记录完整 runtime 才安装 current-session host callback，并把 permission timeout 默认改为 disabled。 |
| [daemon-serve-mode/03-session-lifecycle.md](../../feature/daemon-serve-mode/03-session-lifecycle.md) | #9819 / #9820 / #9838(open) / #9976 / #9978(open) | 补 canonical bridge ID、bounded refusal holds、existing-session task binding、channel liveness 与 standalone containment 生命周期。 |
| [daemon-serve-mode/04-capabilities-and-protocol.md](../../feature/daemon-serve-mode/04-capabilities-and-protocol.md) | #9819 / #9820 / #9838(open) / #9933 / #9976 / #9978(open) | 记录 `scheduled_task_session_reuse` 条件广告、private liveness 协商和 standalone 内部集成不新增 public capability 的边界。 |
| [daemon-serve-mode/07-acp-bridge-and-permission.md](../../feature/daemon-serve-mode/07-acp-bridge-and-permission.md) | #9820 / #9838(open) / #9933 / #9976 / #9978(open) | 更新 timeout、private task creator、hold 上限、channel probe 与 standalone service/guard。 |
| [daemon-serve-mode/11-webui-and-transport.md](../../feature/daemon-serve-mode/11-webui-and-transport.md) | #9838(open) | 记录 capability-gated session mode selector 和当前会话不可复用条件。 |
| [permission-system.md](../../feature/permission-system.md) | #9933 | 将普通权限/AUQ 默认 deadline 从 5 分钟改为 disabled，并记录显式 `300000` 的兼容迁移。 |
| [scheduled-tasks.md](../../feature/scheduled-tasks.md) | #9838(open) | 新增 current-session scheduled task 的端到端架构、准入、持久化、失败回滚、兼容与验证方案。 |
| [telemetry-observability/](../../feature/telemetry-observability/README.md) | #10016(open) | 记录 request-start context snapshot、provider-total normalization、1024 字符与低敏 best-effort 边界。 |
| [telemetry-observability/06-genai-ttft-retry-and-metrics.md](../../feature/telemetry-observability/06-genai-ttft-retry-and-metrics.md) | #10016(open) | 增加 `qwen-code.context.usage` 的 LLM request span 生命周期、分类不变量与未合入限制。 |

_按个人 PR 口径更新于 2026-08-26_
