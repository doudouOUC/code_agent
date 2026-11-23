# qwen-code PRs · 2026-11-23 ~ 2026-11-29 (W48 日更至 11-23)

> 本次日更新增北京时间2026-11-23创建的 @doudouOUC 个人 PR，UTC半开窗口 `[2026-11-22T16:00:00Z, 2026-11-23T16:00:00Z)`，共14个，也是当前周已收录集合；按 createdAt 固定归属周，不按更新/关闭/合入时间纳入其他周或其他作者。状态/规模/head采用北京时间2026-11-24凌晨快照，对照 main `2fef40262f36`。open 仅当前观察，closed 未合入仅历史方案，设计/测试交付不当作运行时能力或验收。

**主题**: provider发现与恢复证据、Action parking拒绝统计/候选覆盖、临时服务规则与CI代理观察

**PR 统计**: 14 PRs - 9 merged / 4 open / 1 closed
**当前已合并 PR 代码量**: +1,742 / -229，38 个文件变更
**全量代码量**: +2,786 / -327，54 个文件变更
**类型分布**: fix ×6, docs ×4, feat ×4
**范围 (scope)**: managed-agent ×10, agents ×2, ci ×2

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 代码量 | 文件数 | 创建时间(UTC) | 合并/关闭时间(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#18125](https://github.com/QwenLM/qwen-code/pull/18125) | merged | @doudouOUC | fix(managed-agent): Discover runtime providers with the application loader | +179/-61 | 6 | 2026-11-22 16:05:56 | 2026-11-22 17:34:48 |
| [#18132](https://github.com/QwenLM/qwen-code/pull/18132) | merged | @doudouOUC | fix(managed-agent): Use session recovery after unadmitted cancellation | +226/-36 | 7 | 2026-11-22 17:11:46 | 2026-11-22 18:47:47 |
| [#18151](https://github.com/QwenLM/qwen-code/pull/18151) | merged | @doudouOUC | docs(managed-agent): design widening Action parking coverage and confirm its pre-start checks | +628/-6 | 6 | 2026-11-23 02:55:43 | 2026-11-23 14:53:37 |
| [#18157](https://github.com/QwenLM/qwen-code/pull/18157) | merged | @doudouOUC | feat(managed-agent): name why a waiting Turn cannot park | +363/-86 | 5 | 2026-11-23 03:55:07 | 2026-11-23 14:31:06 |
| [#18164](https://github.com/QwenLM/qwen-code/pull/18164) | open | @doudouOUC | feat(managed-agent): park and recover image-only approval waits | +194/-42 | 3 | 2026-11-23 06:02:21 | - |
| [#18166](https://github.com/QwenLM/qwen-code/pull/18166) | open | @doudouOUC | feat(managed-agent): park extension command-step approval waits | +351/-10 | 5 | 2026-11-23 06:55:53 | - |
| [#18168](https://github.com/QwenLM/qwen-code/pull/18168) | merged | @doudouOUC | docs(agents): add rules for disposable background services | +17/-0 | 1 | 2026-11-23 07:22:37 | 2026-11-23 14:27:44 |
| [#18170](https://github.com/QwenLM/qwen-code/pull/18170) | open | @doudouOUC | fix(managed-agent): resume a wake Turn's approval wait after a Harness crash | +392/-45 | 4 | 2026-11-23 07:47:28 | - |
| [#18172](https://github.com/QwenLM/qwen-code/pull/18172) | merged | @doudouOUC | fix(managed-agent): advance a crashed wake Turn's await_action wait | +193/-14 | 2 | 2026-11-23 08:26:25 | 2026-11-23 11:34:23 |
| [#18173](https://github.com/QwenLM/qwen-code/pull/18173) | merged | @doudouOUC | feat(managed-agent): report suspension counts on the instance metrics route | +60/-2 | 6 | 2026-11-23 09:10:17 | 2026-11-23 14:34:38 |
| [#18174](https://github.com/QwenLM/qwen-code/pull/18174) | closed | @doudouOUC | fix(ci): Route Hangzhou linter downloads through proxy | +33/-0 | 2 | 2026-11-23 09:25:18 | 2026-11-23 09:57:42 |
| [#18183](https://github.com/QwenLM/qwen-code/pull/18183) | merged | @doudouOUC | docs(agents): scope disposable MySQL rules to managed-agent-server | +70/-18 | 3 | 2026-11-23 14:46:00 | 2026-11-23 16:03:28 |
| [#18184](https://github.com/QwenLM/qwen-code/pull/18184) | open | @doudouOUC | fix(ci): Route Hangzhou transcript downloads through proxy | +74/-1 | 2 | 2026-11-23 14:49:30 | - |
| [#18186](https://github.com/QwenLM/qwen-code/pull/18186) | merged | @doudouOUC | docs(managed-agent): schedule MCP reclamation guard for Action parks | +6/-6 | 2 | 2026-11-23 15:44:18 | 2026-11-23 16:18:37 |

---

## PR 解决问题、实现方式与 feature 处理

| PR | 解决了什么问题 | 最终怎么实现（open/closed 只登记当前观察） | 对应 feature 文档 |
|---|---|---|---|
| [#18125](https://github.com/QwenLM/qwen-code/pull/18125) | Broker 回调线程的 context ClassLoader 可能看不到宿主 provider JAR，导致已安装后端被误报未安装；只改成 system loader 又会漏掉自定义应用加载器。 | 已合入：application/context 双加载器发现、按 factory Class 去重，保真正重复 kind 拒绝和原后端校验。 | 更新Feature 总览、Managed Agents、恢复与运维、配置与扩展；完整实现/观察见 [implementations/pr-18125.md](implementations/pr-18125.md)。 |
| [#18132](https://github.com/QwenLM/qwen-code/pull/18132) | 最近一个 SQL Turn 在 Harness 准入前取消时，以它的 prompt 强行查询会挡住更早已接收输入的恢复或清理；撤回 submission 标记也不能证明 Harness 从未接收。 | 已合入：本地未准入取消查询 Session 最后 accepted input，只按完整 cleanup 证据定向 recheck，缺证据保持保守。 | 更新Feature 总览、Managed Agents、恢复与运维、客户端与交互；完整实现/观察见 [implementations/pr-18132.md](implementations/pr-18132.md)。 |
| [#18151](https://github.com/QwenLM/qwen-code/pull/18151) | 首个 Phase4 仅覆盖少数可恢复等待；直接放开图片、wake、子 Session、Hooks/MCP 或 command-step，会出现能停靠却无法冷恢复的形状。 | 仅设计与实施前测试合入：按冷恢复前提分切片扩大停靠，未一次实现图片/wake/Hooks/MCP 等能力。 | 更新Feature 总览、Managed Agents、恢复与运维、自动任务与交付、Session 存储；完整实现/观察见 [implementations/pr-18151.md](implementations/pr-18151.md)。 |
| [#18157](https://github.com/QwenLM/qwen-code/pull/18157) | 停靠返回 undefined 无法解释常驻原因，生产者未捕获 continuation 的等待甚至不注册；停靠和冷恢复各维护形状条件容易漂移。 | 已合入：共享冷恢复形状门、持久等待携 typed refusal 注册，按每个等待首个原因计数，不放开既有禁区。 | 更新Feature 总览、Managed Agents、恢复与运维、自动任务与交付、配置与扩展；完整实现/观察见 [implementations/pr-18157.md](implementations/pr-18157.md)。 |
| [#18164](https://github.com/QwenLM/qwen-code/pull/18164) | 持久输入只有附件时，原 prompt-text truthy 判断把合法空文本误当丢失，阻止停靠或恢复；原始附件本来可从 managed-input 读回。 | 当前 open：原附件输入可恢复为空文本，统一缺失判定；main 尚不承诺纯图片等待停靠。 | 更新Feature 总览、Managed Agents、恢复与运维、自动任务与交付；完整实现/观察见 [implementations/pr-18164.md](implementations/pr-18164.md)。 |
| [#18166](https://github.com/QwenLM/qwen-code/pull/18166) | 扩展 command-step 已有 takeover continuation，但停靠只注册 command_step 拒绝，无法复用已有冷恢复能力释放等待 resident。 | 当前 open：真实冻结 command-step waiter，共享扩展恢复形状门；普通 Hooks/MCP 批次不因此开放。 | 更新Feature 总览、Managed Agents、恢复与运维、自动任务与交付、配置与扩展；完整实现/观察见 [implementations/pr-18166.md](implementations/pr-18166.md)。 |
| [#18168](https://github.com/QwenLM/qwen-code/pull/18168) | 手工启动的测试数据库/worker 若跨轮遗留，删状态后仍运行会持续输出错误，可能填满磁盘；杀 wrapper 不等于终止真实服务。 | 仅规则文档合入：一次性服务限制输出并配对清理，后续 MySQL 专项细节由18183收敛。 | 更新Feature 总览、Managed Agents、恢复与运维；完整实现/观察见 [implementations/pr-18168.md](implementations/pr-18168.md)。 |
| [#18170](https://github.com/QwenLM/qwen-code/pull/18170) | wake Turn 已尝试且在 await_action 崩溃时，原 pump 不恢复可重建的审批等待；新增恢复臂还必须保留取消/失败不确认 child result 消费的原门禁。 | 当前 open：部分 wake 来源优先恢复原 await_action；与main已合的取消/推进 fallback 是不同路径。 | 更新Feature 总览、Managed Agents、恢复与运维、自动任务与交付；完整实现/观察见 [implementations/pr-18170.md](implementations/pr-18170.md)。 |
| [#18172](https://github.com/QwenLM/qwen-code/pull/18172) | crash aftermath 消耗 wake 输入但留下 await_action checkpoint，后续 continuation Turn 无法启动，可能持续卡在旧审批等待。 | 已合入：await_action 原 Action 取消并推进等待，未读到持久 verdict 不消费输入；不是恢复原审批。 | 更新Feature 总览、Managed Agents、恢复与运维、自动任务与交付；完整实现/观察见 [implementations/pr-18172.md](implementations/pr-18172.md)。 |
| [#18173](https://github.com/QwenLM/qwen-code/pull/18173) | suspensionStats 和逐等待拒绝原因只留在路由实现内部，运维入口无法读取，不能据此观察停靠覆盖的实际分布。 | 已合入：内部受契约中间件保护的 metrics 接真实 suspensionStats，保可选回调兼容，不改变停靠门。 | 更新Feature 总览、Managed Agents、恢复与运维、自动任务与交付；完整实现/观察见 [implementations/pr-18173.md](implementations/pr-18173.md)。 |
| [#18174](https://github.com/QwenLM/qwen-code/pull/18174) | 自托管杭州 runner 的 Git 代理不会自动覆盖 linter archive downloader，真实二进制测试的准备步骤可能下载失败。 | 关闭未合入：linter provisioning 步骤级杭州主机代理及结构测试，仅历史方案。 | 更新Feature 总览；完整实现/观察见 [implementations/pr-18174.md](implementations/pr-18174.md)。 |
| [#18183](https://github.com/QwenLM/qwen-code/pull/18183) | 根规则混杂 MySQL 命令，重复模块约束；仅依赖 wrapper 退出或 pgrep 文本匹配删除 datadir，可能误判仍存活的真实进程。 | 仅文档合入：MySQL操作归模块README，明确输出上限、真实PID存在性与确认停止后删除。 | 更新Feature 总览、Managed Agents、恢复与运维；完整实现/观察见 [implementations/pr-18183.md](implementations/pr-18183.md)。 |
| [#18184](https://github.com/QwenLM/qwen-code/pull/18184) | transcript document 浏览器测试依赖固定 unpkg 资源，Node fetch 默认不会仅因宿主 Git 代理就使用本机出站代理。 | 当前 open：仅transcript步骤启用Node环境代理，保loopback no_proxy；不等于实际浏览器/下载验收。 | 更新Feature 总览；完整实现/观察见 [implementations/pr-18184.md](implementations/pr-18184.md)。 |
| [#18186](https://github.com/QwenLM/qwen-code/pull/18186) | 覆盖设计把 Action park owner 的回收豁免写得像现有实现，但 sealedFor 当前只检查 SEALED；若未来MCP审批停靠仍被回收，会丢掉 continuation 固定目录。 | 仅文档修正合入：MCP Action park回收豁免是S6待实施项，不是现有Broker能力。 | 更新Feature 总览、Managed Agents、恢复与运维、自动任务与交付、Session 存储、配置与扩展；完整实现/观察见 [implementations/pr-18186.md](implementations/pr-18186.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [Feature 总览](../../feature/README.md) | #18125(merged), #18132(merged), #18151(merged), #18157(merged), #18164(open), #18166(open), #18168(merged), #18170(open), #18172(merged), #18173(merged), #18174(closed), #18183(merged), #18184(open), #18186(merged) | 增量核对原diff与main，分开设计、候选、关闭方案和验收证据。 |
| [Managed Agents](../../feature/managed-agents/README.md) | #18125(merged), #18132(merged), #18151(merged), #18157(merged), #18164(open), #18166(open), #18168(merged), #18170(open), #18172(merged), #18173(merged), #18183(merged), #18186(merged) | 增量核对原diff与main，分开设计、候选、关闭方案和验收证据。 |
| [恢复与运维](../../feature/managed-agents/managed-agent-recovery-operations.md) | #18125(merged), #18132(merged), #18151(merged), #18157(merged), #18164(open), #18166(open), #18168(merged), #18170(open), #18172(merged), #18173(merged), #18183(merged), #18186(merged) | 增量核对原diff与main，分开设计、候选、关闭方案和验收证据。 |
| [配置与扩展](../../feature/managed-agents/managed-agent-config-extensions.md) | #18125(merged), #18157(merged), #18166(open), #18186(merged) | 增量核对原diff与main，分开设计、候选、关闭方案和验收证据。 |
| [自动任务与交付](../../feature/managed-agents/managed-agent-automation.md) | #18151(merged), #18157(merged), #18164(open), #18166(open), #18170(open), #18172(merged), #18173(merged), #18186(merged) | 增量核对原diff与main，分开设计、候选、关闭方案和验收证据。 |
| [Session 存储](../../feature/managed-agents/managed-agent-session-storage.md) | #18151(merged), #18186(merged) | 增量核对原diff与main，分开设计、候选、关闭方案和验收证据。 |
| [客户端与交互](../../feature/managed-agents/managed-agent-client-surfaces.md) | #18132(merged) | 增量核对原diff与main，分开设计、候选、关闭方案和验收证据。 |

_按个人 PR 口径更新于 2026-11-24_
