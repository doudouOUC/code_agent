# qwen-code PRs · 2026-11-23 ~ 2026-11-29 (W48 日更至 11-24)

> 本次日更新增北京时间2026-11-24创建的 @doudouOUC 个人PR，UTC半开窗口 `[2026-11-23T16:00:00Z, 2026-11-24T16:00:00Z)`，共16个；当前周累计窗口 `[2026-11-22T16:00:00Z, 2026-11-24T16:00:00Z)` 共30个。按createdAt固定归属周，不按更新/关闭/合入时间纳入其他周或其他作者。状态/规模/head采用北京时间2026-11-25凌晨快照，对照main `f38f6fe7c3e2`。26个merge均已在main；open仅当前观察，closed未合入仅历史方案，设计/测试交付不当运行时或验收。

**主题**: Action parking覆盖与原证据恢复、身份SQL连接、主题测试拆分、Java SDK与闭合JSON候选

**PR 统计**: 30 PRs - 26 merged / 2 open / 2 closed
**当前已合并 PR 代码量**: +59,368 / -51,199，211 个文件变更
**全量代码量**: +61,578 / -51,495，257 个文件变更
**类型分布**: fix ×10, docs ×5, feat ×10, test ×4, refactor ×1
**范围 (scope)**: managed-agent ×24, agents ×2, ci ×2, serve ×1, sdk-java ×1

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 代码量 | 文件数 | 创建时间(UTC) | 合并/关闭时间(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#18125](https://github.com/QwenLM/qwen-code/pull/18125) | merged | @doudouOUC | fix(managed-agent): Discover runtime providers with the application loader | +179/-61 | 6 | 2026-11-22 16:05:56 | 2026-11-22 17:34:48 |
| [#18132](https://github.com/QwenLM/qwen-code/pull/18132) | merged | @doudouOUC | fix(managed-agent): Use session recovery after unadmitted cancellation | +226/-36 | 7 | 2026-11-22 17:11:46 | 2026-11-22 18:47:47 |
| [#18151](https://github.com/QwenLM/qwen-code/pull/18151) | merged | @doudouOUC | docs(managed-agent): design widening Action parking coverage and confirm its pre-start checks | +628/-6 | 6 | 2026-11-23 02:55:43 | 2026-11-23 14:53:37 |
| [#18157](https://github.com/QwenLM/qwen-code/pull/18157) | merged | @doudouOUC | feat(managed-agent): name why a waiting Turn cannot park | +363/-86 | 5 | 2026-11-23 03:55:07 | 2026-11-23 14:31:06 |
| [#18164](https://github.com/QwenLM/qwen-code/pull/18164) | merged | @doudouOUC | feat(managed-agent): park and recover image-only approval waits | +194/-42 | 3 | 2026-11-23 06:02:21 | 2026-11-23 17:27:24 |
| [#18166](https://github.com/QwenLM/qwen-code/pull/18166) | merged | @doudouOUC | feat(managed-agent): park extension command-step approval waits | +401/-11 | 5 | 2026-11-23 06:55:53 | 2026-11-23 17:32:05 |
| [#18168](https://github.com/QwenLM/qwen-code/pull/18168) | merged | @doudouOUC | docs(agents): add rules for disposable background services | +17/-0 | 1 | 2026-11-23 07:22:37 | 2026-11-23 14:27:44 |
| [#18170](https://github.com/QwenLM/qwen-code/pull/18170) | merged | @doudouOUC | fix(managed-agent): resume a wake Turn's approval wait after a Harness crash | +445/-47 | 4 | 2026-11-23 07:47:28 | 2026-11-23 18:24:27 |
| [#18172](https://github.com/QwenLM/qwen-code/pull/18172) | merged | @doudouOUC | fix(managed-agent): advance a crashed wake Turn's await_action wait | +193/-14 | 2 | 2026-11-23 08:26:25 | 2026-11-23 11:34:23 |
| [#18173](https://github.com/QwenLM/qwen-code/pull/18173) | merged | @doudouOUC | feat(managed-agent): report suspension counts on the instance metrics route | +60/-2 | 6 | 2026-11-23 09:10:17 | 2026-11-23 14:34:38 |
| [#18174](https://github.com/QwenLM/qwen-code/pull/18174) | closed | @doudouOUC | fix(ci): Route Hangzhou linter downloads through proxy | +33/-0 | 2 | 2026-11-23 09:25:18 | 2026-11-23 09:57:42 |
| [#18183](https://github.com/QwenLM/qwen-code/pull/18183) | merged | @doudouOUC | docs(agents): scope disposable MySQL rules to managed-agent-server | +70/-18 | 3 | 2026-11-23 14:46:00 | 2026-11-23 16:03:28 |
| [#18184](https://github.com/QwenLM/qwen-code/pull/18184) | closed | @doudouOUC | fix(ci): Route Hangzhou transcript downloads through proxy | +74/-1 | 2 | 2026-11-23 14:49:30 | 2026-11-24 03:05:54 |
| [#18186](https://github.com/QwenLM/qwen-code/pull/18186) | merged | @doudouOUC | docs(managed-agent): schedule MCP reclamation guard for Action parks | +6/-6 | 2 | 2026-11-23 15:44:18 | 2026-11-23 16:18:37 |
| [#18187](https://github.com/QwenLM/qwen-code/pull/18187) | merged | @doudouOUC | feat(managed-agent): park an approval wait beside a certified background hold | +215/-36 | 15 | 2026-11-23 16:19:45 | 2026-11-23 18:30:08 |
| [#18190](https://github.com/QwenLM/qwen-code/pull/18190) | merged | @doudouOUC | fix(managed-agent): keep identity joins on full index keys | +342/-71 | 15 | 2026-11-23 17:05:41 | 2026-11-24 01:50:54 |
| [#18194](https://github.com/QwenLM/qwen-code/pull/18194) | merged | @doudouOUC | feat(managed-agent): park a wake-started Turn's approval wait | +511/-59 | 22 | 2026-11-23 18:07:26 | 2026-11-23 19:27:51 |
| [#18195](https://github.com/QwenLM/qwen-code/pull/18195) | merged | @doudouOUC | fix(managed-agent): align actor admission test with the UTF-16 VARCHAR(36) cap | +15/-6 | 2 | 2026-11-23 18:52:23 | 2026-11-23 19:28:45 |
| [#18203](https://github.com/QwenLM/qwen-code/pull/18203) | merged | @doudouOUC | feat(managed-agent): park channel and pr_event Turns' approval waits | +237/-7 | 4 | 2026-11-24 00:43:40 | 2026-11-24 01:40:29 |
| [#18211](https://github.com/QwenLM/qwen-code/pull/18211) | merged | @doudouOUC | test(managed-agent): Pin identity join key parts in MySQL | +35/-2 | 1 | 2026-11-24 02:51:16 | 2026-11-24 03:38:31 |
| [#18212](https://github.com/QwenLM/qwen-code/pull/18212) | merged | @doudouOUC | fix(managed-agent): Settle unadmitted cancellations with owed cleanup | +67/-22 | 4 | 2026-11-24 03:17:24 | 2026-11-24 03:38:58 |
| [#18216](https://github.com/QwenLM/qwen-code/pull/18216) | merged | @doudouOUC | test(serve): Split Hosted Harness Session tests | +52108/-50553 | 63 | 2026-11-24 03:44:22 | 2026-11-24 09:01:32 |
| [#18218](https://github.com/QwenLM/qwen-code/pull/18218) | merged | @doudouOUC | docs(managed-agent): scope S5 Hooks parking and confirm its pre-start checks | +360/-15 | 4 | 2026-11-24 03:50:30 | 2026-11-24 04:52:57 |
| [#18224](https://github.com/QwenLM/qwen-code/pull/18224) | merged | @doudouOUC | feat(managed-agent): park a child Session's approval wait | +280/-15 | 10 | 2026-11-24 04:53:29 | 2026-11-24 06:21:24 |
| [#18231](https://github.com/QwenLM/qwen-code/pull/18231) | merged | @doudouOUC | test(managed-agent): pin public-children Shell parking and confirm S8a pre-start checks | +573/-16 | 4 | 2026-11-24 06:17:05 | 2026-11-24 10:52:27 |
| [#18233](https://github.com/QwenLM/qwen-code/pull/18233) | merged | @doudouOUC | test(managed-agent): wait for the resumed wake Turn to free the Session before closing | +10/-0 | 1 | 2026-11-24 06:50:43 | 2026-11-24 07:54:58 |
| [#18234](https://github.com/QwenLM/qwen-code/pull/18234) | merged | @doudouOUC | fix(managed-agent): keep an Action-parked Session's MCP owner from reclamation | +54/-7 | 4 | 2026-11-24 07:03:46 | 2026-11-24 10:22:11 |
| [#18236](https://github.com/QwenLM/qwen-code/pull/18236) | merged | @doudouOUC | feat(managed-agent): park Hooks and MCP Session approval waits | +1779/-61 | 12 | 2026-11-24 07:12:10 | 2026-11-24 12:16:05 |
| [#18247](https://github.com/QwenLM/qwen-code/pull/18247) | open | @doudouOUC | feat(sdk-java): Add a public Managed Agent client | +848/-95 | 11 | 2026-11-24 09:56:46 | - |
| [#18267](https://github.com/QwenLM/qwen-code/pull/18267) | open | @doudouOUC | refactor(managed-agent): Make closed JSON fields explicit | +1255/-200 | 31 | 2026-11-24 13:20:46 | - |

---

## PR 解决问题、实现方式与 feature 处理

| PR | 解决了什么问题 | 最终怎么实现（open/closed 只登记当前观察） | 对应 feature 文档 |
|---|---|---|---|
| [#18125](https://github.com/QwenLM/qwen-code/pull/18125) | Broker 回调线程的 context ClassLoader 可能看不到宿主 provider JAR，导致已安装后端被误报未安装；只改成 system loader 又会漏掉自定义应用加载器。 | 已合入：application/context 双加载器发现、按 factory Class 去重，保真正重复 kind 拒绝和原后端校验。 | 更新Feature 总览、Managed Agents、恢复与运维、配置与扩展；完整实现/观察见 [implementations/pr-18125.md](implementations/pr-18125.md)。 |
| [#18132](https://github.com/QwenLM/qwen-code/pull/18132) | 最近一个 SQL Turn 在 Harness 准入前取消时，以它的 prompt 强行查询会挡住更早已接收输入的恢复或清理；撤回 submission 标记也不能证明 Harness 从未接收。 | 已合入：本地未准入取消查询 Session 最后 accepted input，只按完整 cleanup 证据定向 recheck，缺证据保持保守。 | 更新Feature 总览、Managed Agents、恢复与运维、客户端与交互；完整实现/观察见 [implementations/pr-18132.md](implementations/pr-18132.md)。 |
| [#18151](https://github.com/QwenLM/qwen-code/pull/18151) | 首个 Phase4 仅覆盖少数可恢复等待；直接放开图片、wake、子 Session、Hooks/MCP 或 command-step，会出现能停靠却无法冷恢复的形状。 | 仅设计与实施前测试合入：按冷恢复前提分切片扩大停靠，未一次实现图片/wake/Hooks/MCP 等能力。 | 更新Feature 总览、Managed Agents、恢复与运维、自动任务与交付、Session 存储；完整实现/观察见 [implementations/pr-18151.md](implementations/pr-18151.md)。 |
| [#18157](https://github.com/QwenLM/qwen-code/pull/18157) | 停靠返回 undefined 无法解释常驻原因，生产者未捕获 continuation 的等待甚至不注册；停靠和冷恢复各维护形状条件容易漂移。 | 已合入：共享冷恢复形状门、持久等待携 typed refusal 注册，按每个等待首个原因计数，不放开既有禁区。 | 更新Feature 总览、Managed Agents、恢复与运维、配置与扩展、自动任务与交付；完整实现/观察见 [implementations/pr-18157.md](implementations/pr-18157.md)。 |
| [#18164](https://github.com/QwenLM/qwen-code/pull/18164) | 持久输入只有附件时，原 prompt-text truthy 判断把合法空文本误当丢失，阻止停靠或恢复；原始附件本来可从 managed-input 读回。 | 已合入：原附件存在可恢复为空文本，按undefined区分缺失，保原形状/证书门。 | 更新Feature 总览、Managed Agents、恢复与运维、自动任务与交付；完整实现/观察见 [implementations/pr-18164.md](implementations/pr-18164.md)。 |
| [#18166](https://github.com/QwenLM/qwen-code/pull/18166) | 扩展 command-step 已有 takeover continuation，但停靠只注册 command_step 拒绝，无法复用已有冷恢复能力释放等待 resident。 | 已合入：command-step真实freeze与共享恢复shape，最终补bare-load保护；后续Hooks/MCP另案。 | 更新Feature 总览、Managed Agents、恢复与运维、配置与扩展、自动任务与交付；完整实现/观察见 [implementations/pr-18166.md](implementations/pr-18166.md)。 |
| [#18168](https://github.com/QwenLM/qwen-code/pull/18168) | 手工启动的测试数据库/worker 若跨轮遗留，删状态后仍运行会持续输出错误，可能填满磁盘；杀 wrapper 不等于终止真实服务。 | 仅规则文档合入：一次性服务限制输出并配对清理，后续 MySQL 专项细节由18183收敛。 | 更新Feature 总览、Managed Agents、恢复与运维；完整实现/观察见 [implementations/pr-18168.md](implementations/pr-18168.md)。 |
| [#18170](https://github.com/QwenLM/qwen-code/pull/18170) | wake Turn 已尝试且在 await_action 崩溃时，原 pump 不恢复可重建的审批等待；新增恢复臂还必须保留取消/失败不确认 child result 消费的原门禁。 | 已合入：原wake审批优先恢复；传输暂态重试，持久拒绝走aftermath，不误确认child消费。 | 更新Feature 总览、Managed Agents、恢复与运维、自动任务与交付；完整实现/观察见 [implementations/pr-18170.md](implementations/pr-18170.md)。 |
| [#18172](https://github.com/QwenLM/qwen-code/pull/18172) | crash aftermath 消耗 wake 输入但留下 await_action checkpoint，后续 continuation Turn 无法启动，可能持续卡在旧审批等待。 | 已合入：await_action 原 Action 取消并推进等待，未读到持久 verdict 不消费输入；不是恢复原审批。 | 更新Feature 总览、Managed Agents、恢复与运维、自动任务与交付；完整实现/观察见 [implementations/pr-18172.md](implementations/pr-18172.md)。 |
| [#18173](https://github.com/QwenLM/qwen-code/pull/18173) | suspensionStats 和逐等待拒绝原因只留在路由实现内部，运维入口无法读取，不能据此观察停靠覆盖的实际分布。 | 已合入：内部受契约中间件保护的 metrics 接真实 suspensionStats，保可选回调兼容，不改变停靠门。 | 更新Feature 总览、Managed Agents、恢复与运维、自动任务与交付；完整实现/观察见 [implementations/pr-18173.md](implementations/pr-18173.md)。 |
| [#18174](https://github.com/QwenLM/qwen-code/pull/18174) | 自托管杭州 runner 的 Git 代理不会自动覆盖 linter archive downloader，真实二进制测试的准备步骤可能下载失败。 | 关闭未合入：linter provisioning 步骤级杭州主机代理及结构测试，仅历史方案。 | 更新Feature 总览；完整实现/观察见 [implementations/pr-18174.md](implementations/pr-18174.md)。 |
| [#18183](https://github.com/QwenLM/qwen-code/pull/18183) | 根规则混杂 MySQL 命令，重复模块约束；仅依赖 wrapper 退出或 pgrep 文本匹配删除 datadir，可能误判仍存活的真实进程。 | 仅文档合入：MySQL操作归模块README，明确输出上限、真实PID存在性与确认停止后删除。 | 更新Feature 总览、Managed Agents、恢复与运维；完整实现/观察见 [implementations/pr-18183.md](implementations/pr-18183.md)。 |
| [#18184](https://github.com/QwenLM/qwen-code/pull/18184) | transcript document 浏览器测试依赖固定 unpkg 资源，Node fetch 默认不会仅因宿主 Git 代理就使用本机出站代理。 | 关闭未合入：步骤级Node代理仅历史观察，不作为main或真实下载通过证据。 | 更新Feature 总览；完整实现/观察见 [implementations/pr-18184.md](implementations/pr-18184.md)。 |
| [#18186](https://github.com/QwenLM/qwen-code/pull/18186) | 覆盖设计把 Action park owner 的回收豁免写得像现有实现，但 sealedFor 当前只检查 SEALED；若未来MCP审批停靠仍被回收，会丢掉 continuation 固定目录。 | 仅设计修正合入：原回收保护要求后续由18234实现，受限MCP审批由18236接线。 | 更新Feature 总览、Managed Agents、恢复与运维、配置与扩展、自动任务与交付、Session 存储；完整实现/观察见 [implementations/pr-18186.md](implementations/pr-18186.md)。 |
| [#18187](https://github.com/QwenLM/qwen-code/pull/18187) | 后台工作尚在运行时，原 Action park 资格一概拒绝；直接清证书唤醒又会失去原审批的恢复身份。 | 已合入：后台能力随 grant 协商，staged wake 使证书立即到期而保留原身份，事务解除 SQL 停靠。 | 更新Feature 总览、Managed Agents、恢复与运维、Session 存储、存储与事件架构、自动任务与交付；完整实现/观察见 [implementations/pr-18187.md](implementations/pr-18187.md)。 |
| [#18190](https://github.com/QwenLM/qwen-code/pull/18190) | 资源、artifact、取消证据和恢复候选查询对索引列做类型转换，可能把精确身份连接变成大量扫描或回调往返。 | 已合入：资源/artifact 类型对齐，转换放在 probe 侧并保精确残余条件；MySQL 计划断言未独立执行。 | 更新Feature 总览、Managed Agents、恢复与运维、Session 存储、存储与事件架构；完整实现/观察见 [implementations/pr-18190.md](implementations/pr-18190.md)。 |
| [#18194](https://github.com/QwenLM/qwen-code/pull/18194) | wake 输入没有协调器 ma_turn 行，不能套用普通 SQL Turn 的停靠/CAS模型；保 pending 又会被旧资格当作未清工作。 | 已合入：wake owner 证书和 grant，不新建 ma_turn；按原输入/审批修订唤醒并保 cleanup 边界。 | 更新Feature 总览、Managed Agents、恢复与运维、Session 存储、存储与事件架构、自动任务与交付；完整实现/观察见 [implementations/pr-18194.md](implementations/pr-18194.md)。 |
| [#18195](https://github.com/QwenLM/qwen-code/pull/18195) | 常量和测试称36 code points，实际 requireActor 用 String.length，补充平面字符用例因此与真实准入条件相反。 | 已合入：名称/测试对齐既有36 UTF16单元门，不改变生产长度算法。 | 更新Feature 总览、Managed Agents、配置与扩展、Session 存储；完整实现/观察见 [implementations/pr-18195.md](implementations/pr-18195.md)。 |
| [#18203](https://github.com/QwenLM/qwen-code/pull/18203) | channel/pr_event wake 的原审批等待未进入可恢复来源集，停靠或崩溃后只能走来源 aftermath，可能丢失原等待。 | 已合入：共享 wake 来源集增加channel/pr_event，复用原审批恢复，不重跑新输入。 | 更新Feature 总览、Managed Agents、恢复与运维、自动任务与交付；完整实现/观察见 [implementations/pr-18203.md](implementations/pr-18203.md)。 |
| [#18211](https://github.com/QwenLM/qwen-code/pull/18211) | 仅断言使用某个索引不保证复合键中 target_id/target_revision 或 turn_id 真正参与定位。 | 仅测试合入：从索引名提升到实际复合键使用列，增加取消证据规模场景。 | 更新Feature 总览、Managed Agents、恢复与运维、Session 存储、存储与事件架构；完整实现/观察见 [implementations/pr-18211.md](implementations/pr-18211.md)。 |
| [#18212](https://github.com/QwenLM/qwen-code/pull/18212) | 前序输入仍欠cleanup，新Turn已尝试派发却无准入回执时，原空闲journal门可能挡住证实未接收后的本地取消。 | 已合入：仅本地未准入取消允许旧cleanup欠账，保锁/准入识别和后续清理证明。 | 更新Feature 总览、Managed Agents、恢复与运维、客户端与交互；完整实现/观察见 [implementations/pr-18212.md](implementations/pr-18212.md)。 |
| [#18216](https://github.com/QwenLM/qwen-code/pull/18216) | 超过五万行的单一测试文件不利于聚焦选择、fixture顺序和失败归属，单文件编辑/审查成本过高。 | 仅测试/文档合入：按主题与fixture拆分原巨型文件；固定Git diff核实API逐文件统计差异。 | 更新Feature 总览、Managed Agents、恢复与运维；完整实现/观察见 [implementations/pr-18216.md](implementations/pr-18216.md)。 |
| [#18218](https://github.com/QwenLM/qwen-code/pull/18218) | 设计对Hook owner和启动Hook重放的假设未核实，可能据错误前提开放无法恢复的等待。 | 仅设计/测试合入：核配置owner与启动Hook/原prompt历史；不等于新增原生Hooks停靠代码。 | 更新Feature 总览、Managed Agents、恢复与运维、配置与扩展、自动任务与交付；完整实现/观察见 [implementations/pr-18218.md](implementations/pr-18218.md)。 |
| [#18224](https://github.com/QwenLM/qwen-code/pull/18224) | 有lineage的子Session已能冷恢复，但资格仍拒停靠；父relay若把reload中暂态当失败会消耗消息重试预算。 | 已合入：去lineage专属拒绝，relay对closing/open_busy保lease无损重试；父等子仍非本范围。 | 更新Feature 总览、Managed Agents、恢复与运维、自动任务与交付；完整实现/观察见 [implementations/pr-18224.md](implementations/pr-18224.md)。 |
| [#18231](https://github.com/QwenLM/qwen-code/pull/18231) | 已有public-children Shell审批可停靠，但缺少按原reservation重放与Allow/Deny/到期等路径的覆盖，不能据代码存在就开启功能。 | 仅设计/测试合入：核public-children既有Shell原reservation恢复，不新增普通Shell停靠。 | 更新Feature 总览、Managed Agents、恢复与运维、自动任务与交付、配置与扩展；完整实现/观察见 [implementations/pr-18231.md](implementations/pr-18231.md)。 |
| [#18233](https://github.com/QwenLM/qwen-code/pull/18233) | journal先完成Turn，run稍后才释放Runtime和active slot；测试立即DELETE会与合法清理链竞争而偶发失败。 | 仅测试合入：关闭前等待hasActivePrompt=false，消除与Runtime释放的测试竞争。 | 更新Feature 总览、Managed Agents、恢复与运维；完整实现/观察见 [implementations/pr-18233.md](implementations/pr-18233.md)。 |
| [#18234](https://github.com/QwenLM/qwen-code/pull/18234) | 连接空闲回收若仅看SEALED，可能把正等待审批的MCP原目录/连接回收，破坏固定continuation。 | 已合入：sealedFor仅给无Action证书的owner回收证明，idle/expedite共用。 | 更新Feature 总览、Managed Agents、恢复与运维、Session 存储、配置与扩展、自动任务与交付；完整实现/观察见 [implementations/pr-18234.md](implementations/pr-18234.md)。 |
| [#18236](https://github.com/QwenLM/qwen-code/pull/18236) | 原shape一概拒Hooks/MCP；只去掉判断会重放Hook、重发现出不同MCP目录，或让bare load写tool_result破坏原continuation。 | 已合入：owner限定、Hook结果digest只读恢复、MCP原目录/输入核对及bare-load保护；非任意Hooks/MCP放行。 | 更新Feature 总览、Managed Agents、恢复与运维、配置与扩展、Session 存储、自动任务与交付、存储与事件架构；完整实现/观察见 [implementations/pr-18236.md](implementations/pr-18236.md)。 |
| [#18247](https://github.com/QwenLM/qwen-code/pull/18247) | 现有Java扩展客户端没有完整公开Session/Turn/Action查询写入和SSE接入，调用者需重复签名、错误处理与游标控制。 | 当前open：公开Java客户端与签名transport/SSE候选，写入不自动重试，分页/重连由调用者负责。 | 更新Feature 总览、Managed Agents、SDK、客户端与交互；完整实现/观察见 [implementations/pr-18247.md](implementations/pr-18247.md)。 |
| [#18267](https://github.com/QwenLM/qwen-code/pull/18267) | 固定JSON形状在多处以Map取字段，协议/状态拼写及定义投影容易分歧；不能为类型化顺便改存储wire或把动态metadata封死。 | 当前open：状态/boot/model/定义投影改命名值，保wire/digest与动态扩展，不是schema迁移。 | 更新Feature 总览、Managed Agents、配置与扩展、Session 存储、存储与事件架构、恢复与运维；完整实现/观察见 [implementations/pr-18267.md](implementations/pr-18267.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [Feature 总览](../../feature/README.md) | #18125(merged), #18132(merged), #18151(merged), #18157(merged), #18164(merged), #18166(merged), #18168(merged), #18170(merged), #18172(merged), #18173(merged), #18174(closed), #18183(merged), #18184(closed), #18186(merged), #18187(merged), #18190(merged), #18194(merged), #18195(merged), #18203(merged), #18211(merged), #18212(merged), #18216(merged), #18218(merged), #18224(merged), #18231(merged), #18233(merged), #18234(merged), #18236(merged), #18247(open), #18267(open) | 按原diff与main增量核对，分开设计/测试、实现、开放及关闭方案。 |
| [Managed Agents](../../feature/managed-agents/README.md) | #18125(merged), #18132(merged), #18151(merged), #18157(merged), #18164(merged), #18166(merged), #18168(merged), #18170(merged), #18172(merged), #18173(merged), #18183(merged), #18186(merged), #18187(merged), #18190(merged), #18194(merged), #18195(merged), #18203(merged), #18211(merged), #18212(merged), #18216(merged), #18218(merged), #18224(merged), #18231(merged), #18233(merged), #18234(merged), #18236(merged), #18247(open), #18267(open) | 按原diff与main增量核对，分开设计/测试、实现、开放及关闭方案。 |
| [SDK](../../feature/sdk.md) | #18247(open) | 按原diff与main增量核对，分开设计/测试、实现、开放及关闭方案。 |
| [恢复与运维](../../feature/managed-agents/managed-agent-recovery-operations.md) | #18125(merged), #18132(merged), #18151(merged), #18157(merged), #18164(merged), #18166(merged), #18168(merged), #18170(merged), #18172(merged), #18173(merged), #18183(merged), #18186(merged), #18187(merged), #18190(merged), #18194(merged), #18203(merged), #18211(merged), #18212(merged), #18216(merged), #18218(merged), #18224(merged), #18231(merged), #18233(merged), #18234(merged), #18236(merged), #18267(open) | 按原diff与main增量核对，分开设计/测试、实现、开放及关闭方案。 |
| [配置与扩展](../../feature/managed-agents/managed-agent-config-extensions.md) | #18125(merged), #18157(merged), #18166(merged), #18186(merged), #18195(merged), #18218(merged), #18231(merged), #18234(merged), #18236(merged), #18267(open) | 按原diff与main增量核对，分开设计/测试、实现、开放及关闭方案。 |
| [自动任务与交付](../../feature/managed-agents/managed-agent-automation.md) | #18151(merged), #18157(merged), #18164(merged), #18166(merged), #18170(merged), #18172(merged), #18173(merged), #18186(merged), #18187(merged), #18194(merged), #18203(merged), #18218(merged), #18224(merged), #18231(merged), #18234(merged), #18236(merged) | 按原diff与main增量核对，分开设计/测试、实现、开放及关闭方案。 |
| [Session 存储](../../feature/managed-agents/managed-agent-session-storage.md) | #18151(merged), #18186(merged), #18187(merged), #18190(merged), #18194(merged), #18195(merged), #18211(merged), #18234(merged), #18236(merged), #18267(open) | 按原diff与main增量核对，分开设计/测试、实现、开放及关闭方案。 |
| [客户端与交互](../../feature/managed-agents/managed-agent-client-surfaces.md) | #18132(merged), #18212(merged), #18247(open) | 按原diff与main增量核对，分开设计/测试、实现、开放及关闭方案。 |
| [存储与事件架构](../../feature/managed-agents/managed-agent-storage-event-architecture.md) | #18187(merged), #18190(merged), #18194(merged), #18211(merged), #18236(merged), #18267(open) | 按原diff与main增量核对，分开设计/测试、实现、开放及关闭方案。 |

_按个人 PR 口径更新于 2026-11-25_
