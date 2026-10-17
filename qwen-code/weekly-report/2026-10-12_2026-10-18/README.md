# qwen-code PRs · 2026-10-12 ~ 2026-10-18 (W42 日更)

> 本文件已整理北京时间 2026-10-12 至 2026-10-17 创建的 @doudouOUC 个人 PR，UTC 半开窗口 `[2026-10-11T16:00:00Z, 2026-10-17T16:00:00Z)`。按 author/createdAt 归属，不按更新、关闭或合入日期补收。当前周尚未结束；本次快照取北京时间 2026-10-18，主干 `0ed9895ae9aa`。open 仅当前 diff，closed 未合入仅历史观察；前一周后续合入的 PR 仍留 W41。规模逐 PR 累加，不是去重后的 main 增量。前次 #14186 两文件 parser 零错误仅对应当时主干，本次未运行源码门禁。

**主题**: L4/私有 CSI 与 32 表、统一 Server、目录选择与持久进度、静态扩展、SSH/macOS、Workspace 常驻及取消恢复；open 搜索与已保存定义审批

**PR 统计**: 38 PRs - 34 merged / 2 open / 2 closed
**当前已合并 PR 代码量**: +115,335 / -24,636，2790 个文件变更
**全量代码量**: +118,757 / -24,996，2881 个文件变更
**类型分布**: feat ×16, fix ×11, test ×2, chore ×1, docs ×2, refactor ×6
**范围 (scope)**: managed-agent ×21, web-shell ×4, sdk-java ×2, serve ×2, core ×1, none ×1, runtime-broker ×4, design ×1, runtime ×1, managed ×1

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 代码量 | 文件数 | 创建时间(UTC) | 合并/关闭时间(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#13931](https://github.com/QwenLM/qwen-code/pull/13931) | ✅ merged | @doudouOUC | feat(managed-agent): add L4 Shell and MCP session lifecycle | +3110/-346 | 52 | 10-12 00:30 | 10-13 08:17 |
| [#13936](https://github.com/QwenLM/qwen-code/pull/13936) | ✅ merged | @doudouOUC | feat(web-shell): add Managed child Agent task panel | +3062/-7 | 28 | 10-12 03:22 | 10-12 13:02 |
| [#13973](https://github.com/QwenLM/qwen-code/pull/13973) | ✅ merged | @doudouOUC | feat(web-shell): Reuse standard UI for Managed Agents | +1992/-155 | 31 | 10-12 12:03 | 10-13 07:30 |
| [#13996](https://github.com/QwenLM/qwen-code/pull/13996) | ✅ merged | @doudouOUC | feat(sdk-java): add private CSI Session and native SQL authority | +23131/-2803 | 105 | 10-12 18:04 | 10-14 08:24 |
| [#14039](https://github.com/QwenLM/qwen-code/pull/14039) | ✅ merged | @doudouOUC | fix(managed-agent): recover lost lifecycle detach replies | +1236/-1 | 10 | 10-13 09:48 | 10-13 14:06 |
| [#14045](https://github.com/QwenLM/qwen-code/pull/14045) | ✅ merged | @doudouOUC | fix(managed-agent): close shell profiles after native file calls | +114/-9 | 8 | 10-13 11:16 | 10-13 14:05 |
| [#14059](https://github.com/QwenLM/qwen-code/pull/14059) | ✅ merged | @doudouOUC | fix(serve): resume committed file results after runtime retirement | +396/-120 | 6 | 10-13 12:45 | 10-13 14:07 |
| [#14069](https://github.com/QwenLM/qwen-code/pull/14069) | ✅ merged | @doudouOUC | feat(managed-agent): consolidate persistence into a 32-table baseline | +27000/-10758 | 362 | 10-13 13:47 | 10-14 00:58 |
| [#14081](https://github.com/QwenLM/qwen-code/pull/14081) | ✅ merged | @doudouOUC | feat(serve): attach private CSI Sessions to Hosted text turns | +1848/-15 | 21 | 10-13 15:06 | 10-17 14:29 |
| [#14124](https://github.com/QwenLM/qwen-code/pull/14124) | ✅ merged | @doudouOUC | fix(managed-agent): Wire OSS capture budgets into Hosted sessions | +350/-68 | 9 | 10-14 00:34 | 10-14 08:21 |
| [#14141](https://github.com/QwenLM/qwen-code/pull/14141) | 🔴 closed | @doudouOUC | fix(sdk-java): repair Hosted owner probes and mount fixtures | +109/-15 | 10 | 10-14 05:54 | 10-14 06:23 |
| [#14174](https://github.com/QwenLM/qwen-code/pull/14174) | 🔴 closed | @doudouOUC | test(managed-agent): align the baseline witness with canonical V2 | +1/-1 | 1 | 10-14 09:52 | 10-14 12:15 |
| [#14180](https://github.com/QwenLM/qwen-code/pull/14180) | ✅ merged | @doudouOUC | fix(core): retain CSI preparation resources through the HTTP store | +1482/-0 | 7 | 10-14 11:14 | 10-15 16:56 |
| [#14185](https://github.com/QwenLM/qwen-code/pull/14185) | ✅ merged | @doudouOUC | fix(managed-agent): Standardize SQL timestamps and query mappings | +2785/-2466 | 182 | 10-14 12:37 | 10-15 16:46 |
| [#14186](https://github.com/QwenLM/qwen-code/pull/14186) | ✅ merged | @doudouOUC | chore: adopt qwen-code-checks.xml and fix all checkstyle violations | +4436/-3344 | 433 | 10-14 12:42 | 10-15 03:56 |
| [#14214](https://github.com/QwenLM/qwen-code/pull/14214) | ✅ merged | @doudouOUC | docs(runtime-broker): design Workspace-resident Managed Tool Runtime | +743/-0 | 2 | 10-14 16:18 | 10-15 03:48 |
| [#14254](https://github.com/QwenLM/qwen-code/pull/14254) | ✅ merged | @doudouOUC | refactor(runtime-broker): name the local-process kind and Workspace isolation policy | +617/-388 | 15 | 10-15 05:04 | 10-15 09:33 |
| [#14270](https://github.com/QwenLM/qwen-code/pull/14270) | ✅ merged | @doudouOUC | docs(design): drop stray conflict markers from the actor-roles design | +0/-3 | 2 | 10-15 07:11 | 10-15 09:41 |
| [#14277](https://github.com/QwenLM/qwen-code/pull/14277) | ✅ merged | @doudouOUC | refactor(managed-agent): Consolidate server and broker sources | +1180/-1093 | 878 | 10-15 08:44 | 10-16 00:28 |
| [#14280](https://github.com/QwenLM/qwen-code/pull/14280) | ✅ merged | @doudouOUC | refactor(managed-agent): Reuse Apache Commons utilities | +519/-338 | 69 | 10-15 08:53 | 10-15 12:21 |
| [#14290](https://github.com/QwenLM/qwen-code/pull/14290) | 🟡 open | @doudouOUC | feat(managed-agent): Add bounded Workspace search tools | +2027/-171 | 54 | 10-15 10:13 | - |
| [#14306](https://github.com/QwenLM/qwen-code/pull/14306) | ✅ merged | @doudouOUC | fix(managed-agent): Align hosted prompts with declared tools | +551/-22 | 5 | 10-15 15:03 | 10-15 17:19 |
| [#14307](https://github.com/QwenLM/qwen-code/pull/14307) | ✅ merged | @doudouOUC | refactor(managed-agent): Reuse text and byte-range utilities | +83/-30 | 8 | 10-15 15:12 | 10-15 16:40 |
| [#14316](https://github.com/QwenLM/qwen-code/pull/14316) | ✅ merged | @doudouOUC | feat(web-shell): integrate Managed sessions into the home workflow | +9332/-387 | 91 | 10-15 15:46 | 10-16 06:12 |
| [#14318](https://github.com/QwenLM/qwen-code/pull/14318) | ✅ merged | @doudouOUC | feat(managed-agent): Add SSH Tool Runtime support | +11846/-548 | 118 | 10-15 15:54 | 10-16 18:18 |
| [#14319](https://github.com/QwenLM/qwen-code/pull/14319) | ✅ merged | @doudouOUC | feat(managed-agent): Wire static Skills and extension configuration | +3066/-130 | 45 | 10-15 16:18 | 10-16 02:40 |
| [#14323](https://github.com/QwenLM/qwen-code/pull/14323) | ✅ merged | @doudouOUC | feat(managed-agent): add Shell Full Access and session approval switching | +3032/-167 | 59 | 10-15 17:35 | 10-16 09:21 |
| [#14339](https://github.com/QwenLM/qwen-code/pull/14339) | ✅ merged | @doudouOUC | refactor(runtime-broker): key Harness ownership on shared Workspace bindings by Runtime Session | +929/-610 | 14 | 10-16 02:47 | 10-16 03:54 |
| [#14340](https://github.com/QwenLM/qwen-code/pull/14340) | ✅ merged | @doudouOUC | feat(runtime): add resident Workspace file sessions | +3349/-65 | 50 | 10-16 02:56 | 10-16 08:34 |
| [#14357](https://github.com/QwenLM/qwen-code/pull/14357) | ✅ merged | @doudouOUC | test(managed-agent): Add real extension process acceptance | +886/-0 | 5 | 10-16 04:48 | 10-16 09:27 |
| [#14364](https://github.com/QwenLM/qwen-code/pull/14364) | ✅ merged | @doudouOUC | fix(managed-agent): Fix publication grants and background close | +86/-14 | 4 | 10-16 06:28 | 10-16 06:57 |
| [#14370](https://github.com/QwenLM/qwen-code/pull/14370) | ✅ merged | @doudouOUC | refactor(managed-agent): Decouple tool publication storage from OSS | +518/-133 | 33 | 10-16 09:36 | 10-16 11:46 |
| [#14377](https://github.com/QwenLM/qwen-code/pull/14377) | ✅ merged | @doudouOUC | fix(managed): Recover cancellation after process restarts | +4003/-200 | 38 | 10-16 11:33 | 10-17 11:02 |
| [#14405](https://github.com/QwenLM/qwen-code/pull/14405) | ✅ merged | @doudouOUC | feat(managed-agent): Improve workspace selection and tool progress | +2194/-232 | 53 | 10-16 17:43 | 10-17 02:35 |
| [#14435](https://github.com/QwenLM/qwen-code/pull/14435) | ✅ merged | @doudouOUC | feat(runtime-broker): Workspace-resident Tool Runtime for bound Sessions | +970/-156 | 31 | 10-17 04:31 | 10-17 11:02 |
| [#14436](https://github.com/QwenLM/qwen-code/pull/14436) | ✅ merged | @doudouOUC | fix(web-shell): Distinguish unavailable shell output | +42/-2 | 3 | 10-17 04:42 | 10-17 06:06 |
| [#14442](https://github.com/QwenLM/qwen-code/pull/14442) | ✅ merged | @doudouOUC | feat(managed-agent): support native macOS workspace runtime | +447/-26 | 13 | 10-17 06:05 | 10-17 06:35 |
| [#14484](https://github.com/QwenLM/qwen-code/pull/14484) | 🟡 open | @doudouOUC | feat(managed-agent): allow approval changes in stored agent sessions | +1285/-173 | 26 | 10-17 15:58 | - |

---

## PR 解决问题、实现方式与 feature 处理

| PR | 解决了什么问题 | 最终怎么实现（open/closed 只登记当前观察） | 对应 feature 文档 |
|---|---|---|---|
| [#13931](https://github.com/QwenLM/qwen-code/pull/13931) | files 回执不能证明 Shell/MCP 原资源及完整输出已安全关闭。 | 已合入：精确 profile v2 默认关闭；effects 后以原 claim 做资源屏障，验证输出闭包，可信原 stopped receipt 才允许 LOST→DRAINING，有效原 cleanup claim 允许 writer 租约到期后的 seal。 | 更新恢复与运维、Managed Agents 的最终口径；完整实现见 [implementations/pr-13931.md](implementations/pr-13931.md)。 |
| [#13936](https://github.com/QwenLM/qwen-code/pull/13936) | 子 Agent 状态/产物缺入口，取消丢响应或提前显示终态会误导用户。 | 已合入：复用原 task API/分页，child_agent 侧栏或 Dialog；原取消键先持久再发，operation 接受后仍查询 task 真终态，保留未知意图与权限撤销后的恢复入口。 | 更新客户端与事件、Managed Agents 的 merged 范围；完整实现见 [implementations/pr-13936.md](implementations/pr-13936.md)。 |
| [#13973](https://github.com/QwenLM/qwen-code/pull/13973) | 独立 Managed 表单与标准聊天割裂，首次输入和草稿重试易重复/丢失。 | 已合入：标准 composer/欢迎页/selector，一次创建、原 payload/key 重试；受理后精确清原草稿，放弃恢复原初始输入并刷新列表，不宣称服务端未受理。 | 更新客户端与事件、Managed Agents 的最终实现；完整实现见 [implementations/pr-13973.md](implementations/pr-13973.md)。 |
| [#13996](https://github.com/QwenLM/qwen-code/pull/13996) | 私有 worker 的 Session/writer/grant/history 缺少同源 SQL authority，legacy mutation 可破坏原归属。 | 已合入：原 CSI Session/READY/journal/结果核验，最终 V2 扩展 32 表；read 意图进入 typed receipt、交付进入 read lease，不沿用旧 V69–V72。 | 更新 JDBC 双语、客户端与总览的最终私有边界；完整实现见 [implementations/pr-13996.md](implementations/pr-13996.md)。 |
| [#14039](https://github.com/QwenLM/qwen-code/pull/14039) | detach 成功但丢响应留下旧附件，原清理重试反复 404。 | 已合入：仅 v2 非 effects 404 条件移除原 AttachmentRef，仍抛原错误；下一次从 SQL 原 authority cleanup-only load，不将 404 当完成。 | 更新恢复与运维、总览；完整实现见 [implementations/pr-14039.md](implementations/pr-14039.md)。 |
| [#14045](https://github.com/QwenLM/qwen-code/pull/14045) | Shell 内 deferred 原生文件调用没有 Shell publication，合法关闭被误阻塞。 | 已合入：核验原 scoped input/payload hash，仅已结算且无 protocol/publication 的四种 deferred 文件调用免 Shell source；owner/真实 Shell 输出证明保留。 | 更新恢复与运维、总览；完整实现见 [implementations/pr-14045.md](implementations/pr-14045.md)。 |
| [#14059](https://github.com/QwenLM/qwen-code/pull/14059) | 原 Runtime 退役后已提交文件结果无法续接，重新 acquire 可能诱发二次效果。 | 已合入：限定 files results_ready/settled/history，复核 owed 原 binding/generation 释放与全部 outcome；只消费原结果，不再 acquire/运行工具。 | 增补 G3 恢复边界与总览；完整实现见 [implementations/pr-14059.md](implementations/pr-14059.md)。 |
| [#14069](https://github.com/QwenLM/qwen-code/pull/14069) | 表族扩展和多套初始化路径增加维护复杂度，粗暴缩表会破坏事务与恢复。 | 已合入新库 32 表、typed catalog 和独立 fence/lease；DDL 前拒绝 system catalog/未执行 CHECK，分页只读 view 不虚假续租，旧库不原地转换。 | 更新存储、JDBC 双语与总览的最终基线；完整实现见 [implementations/pr-14069.md](implementations/pr-14069.md)。 |
| [#14081](https://github.com/QwenLM/qwen-code/pull/14081) | 私有 CSI 文本误走普通 owner/close 会替换写者或 seal 原 authority。 | 已合入私有 attach/text/history 纯文本，fresh 原 admission、失租阻塞、stopLocal 不 seal/release；不装 file toolTurn 或公共 selector。 | 更新客户端、JDBC 双语与总览；完整实现见 [implementations/pr-14081.md](implementations/pr-14081.md)。 |
| [#14124](https://github.com/QwenLM/qwen-code/pull/14124) | Java 未传 captureBytes，启用 publication 的 Shell 仍选 inline producer。 | 已合入可选 SDK 字段及精确 Shell family create 接线；load 恢复原预算，不传新部署值，raw capture 与聚合开销/独立 GC 开关分开。 | 增补完整结果双语、SDK 与总览；完整实现见 [implementations/pr-14124.md](implementations/pr-14124.md)。 |
| [#14141](https://github.com/QwenLM/qwen-code/pull/14141) | Hosted probe 旧 hash 查错 physical owner，fixture birth/mtime 同 tick 误触身份拒绝。 | 关闭前测试方案沿 canonical alias JOIN physical owner，原字节身份/decoy 不回退；仅装置 mtime 固定，不改生产身份读取器。 | 恢复与总览保留 closed 观察；完整观察见 [implementations/pr-14141.md](implementations/pr-14141.md)。 |
| [#14174](https://github.com/QwenLM/qwen-code/pull/14174) | 已初始化 V2 catalog 的 baseline witness 仍预期版本 1。 | closed 未合入，仅一行 expected 1→2，32 业务表+history 的断言保留；不新增生产 DDL 或迁移。 | 存储与总览记录有限 witness；完整观察见 [implementations/pr-14174.md](implementations/pr-14174.md)。 |
| [#14180](https://github.com/QwenLM/qwen-code/pull/14180) | HTTP adapter 遗漏 private preparation refs，SQL 同事务 candidate 不闭合。 | 已合入精确 schema2/profile preparation 遍历；prepared 通过 intentRef 重纳 predecessor，不泛化遍历顶层旧引用；有限真实 SQL/worker fixture 不证明原生 CSI。 | 更新存储、JDBC 双语与总览；完整实现见 [implementations/pr-14180.md](implementations/pr-14180.md)。 |
| [#14185](https://github.com/QwenLM/qwen-code/pull/14185) | 混合 SQL 时间/driver 类型和 SELECT * 使 lease/分页/映射难核验。 | 已合入 V1/V3 epoch-ms/UNSIGNED/gmt 和 typed projection，保留 actor 字节/immutable 列表 keyset，终态 collector 用安全整数 NEVER_DUE；没有旧 catalog 版本化升级。 | 更新存储、JDBC 双语与总览；完整实现见 [implementations/pr-14185.md](implementations/pr-14185.md)。 |
| [#14186](https://github.com/QwenLM/qwen-code/pull/14186) | server 静态规则不统一，测试源码缺少低成本独立 Checkstyle 门禁。 | 已合入规则、server pom/test 和 Ubuntu/Java21 workflow 步骤；最终两文件仅 import 调整，前次原 revision parser 零错误，本次未复跑。 | SDK 与总览保留 merged/有限验证边界；完整实现见 [implementations/pr-14186.md](implementations/pr-14186.md)。 |
| [#14214](https://github.com/QwenLM/qwen-code/pull/14214) | 共享常驻 worker 的 owner、容量和停止证据没有分层方案。 | 已合入双语设计；后续 #14254/#14339/#14435 分别落地身份策略、共享归属和显式常驻/逻辑 close，创建预热、idle/硬预算与 keep-warm 仍为后续方案。 | 恢复与总览区分设计/实现；完整实现见 [implementations/pr-14214.md](implementations/pr-14214.md)。 |
| [#14254](https://github.com/QwenLM/qwen-code/pull/14254) | local-process 字面量和 Session 隔离规则多点重复，易漏改归属。 | 已合入公开 KIND 和 session-only helper；后续 owner/resident profile 见 #14339/#14340，#14435 独立配置显式共享 bound Session 及逻辑 close，非 idle/warm 交付。 | 更新恢复与总览；完整实现见 [implementations/pr-14254.md](implementations/pr-14254.md)。 |
| [#14270](https://github.com/QwenLM/qwen-code/pull/14270) | actor roles 双语设计残留冲突标记。 | 已合入两文件三行删除，仅清标记，不改 ACL 或运行代码。 | 总览记录文档维护，不新增权限技术方案；完整实现见 [implementations/pr-14270.md](implementations/pr-14270.md)。 |
| [#14277](https://github.com/QwenLM/qwen-code/pull/14277) | 仅服务端消费的独立 Broker 模块增加构建和 classpath 维护成本。 | 已合入 packages/managed-agent-server，保留包名/资源/测试和双规则检查，迁移 CI/Docker/合约 rename guard；SDK 目录不变。 | 更新 SDK、存储与总览及当前周验证路径；完整实现见 [implementations/pr-14277.md](implementations/pr-14277.md)。 |
| [#14280](https://github.com/QwenLM/qwen-code/pull/14280) | 重复字符串/摘要/HMAC/mapper 实现增加维护并易改持久字节。 | 已合入直接 Commons 依赖和固定组件复用，保留 UTF-16/Unicode 专用规则、canonical JSON、hash 编码/流限制/异常分类。 | 更新 SDK 与总览；完整实现见 [implementations/pr-14280.md](implementations/pr-14280.md)。 |
| [#14290](https://github.com/QwenLM/qwen-code/pull/14290) | 普通 grep/ls 缺 Session ownership、进程取消与硬结果预算。 | 当前 diff 默认关闭 /3 profile，随包 rg/worker 五秒期限，扫描前查嵌套 owner，1 MiB 原始/48 KiB wire/64 KiB outcome；恢复只观察原执行。 | 增补客户端、恢复与总览；完整观察见 [implementations/pr-14290.md](implementations/pr-14290.md)。 |
| [#14306](https://github.com/QwenLM/qwen-code/pull/14306) | Hosted tools 已替换，但 prompt 仍指导不可用工具。 | 已合入实际声明名称集合和 context 同步 fresh prompt，空集明确无工具；prepared replay 保留原请求，失败不发推理。 | 更新客户端与总览；完整实现见 [implementations/pr-14306.md](implementations/pr-14306.md)。 |
| [#14307](https://github.com/QwenLM/qwen-code/pull/14307) | 手写 escape、LF 切分和 Range 运算重复且替换易放松协议。 | 已合入 replaceEach/split/HttpRange，保留三字符语义和旧 ASCII/逗号/错误分类门禁，不开放多 range。 | 更新 SDK、客户端与总览；完整实现见 [implementations/pr-14307.md](implementations/pr-14307.md)。 |
| [#14316](https://github.com/QwenLM/qwen-code/pull/14316) | 托管首页割裂、工作区只读发现、审批和模型/上下文无真实控制。 | 已合入单 sidebar/独立后端归属、actor 回执两阶段建目录、Turn 模型快照及成功 usage；V4/V5 已在 main，审批后续见 #14323。 | 更新客户端、存储、SDK 与总览；完整实现见 [implementations/pr-14316.md](implementations/pr-14316.md)。 |
| [#14318](https://github.com/QwenLM/qwen-code/pull/14318) | 远端目录工具缺原 worker 唯一启动、重连和严格退役证据。 | 已合入 V7/独立 register、claim 前 probe、原子 launch/never-start 与 startup-close pending；仅 /1 文件和前台 Shell，UNKNOWN 不重放。 | 更新恢复、客户端、JDBC 双语与总览；完整实现见 [implementations/pr-14318.md](implementations/pr-14318.md)。 |
| [#14319](https://github.com/QwenLM/qwen-code/pull/14319) | 保存的扩展不能稳定进入 Session，恢复可能改变指令与权限。 | 已合入静态 Skill 字节/ref 与 MCP/Hook pin；独立批次、原 Hook 决策恢复和嵌套资源闭包，不发现宿主 Skill。 | 更新客户端与总览；完整实现见 [implementations/pr-14319.md](implementations/pr-14319.md)。 |
| [#14323](https://github.com/QwenLM/qwen-code/pull/14323) | Shell 缺显式 Full Access，空闲审批切换会改变在途策略。 | 已合入 owner+OPERATOR 幂等改策、V6 Session override/Turn 快照、revision 0 wire 兼容与 UI 读回；默认不改 yolo。 | 更新客户端、存储、SDK 与总览；完整实现见 [implementations/pr-14323.md](implementations/pr-14323.md)。 |
| [#14339](https://github.com/QwenLM/qwen-code/pull/14339) | 共享 binding 的 isolation key 不能证明 Harness 归属。 | 已合入精确共享条件和 Runtime Session/execution owner；缺原 owner 不创清理 tombstone，storage/drain fence 保留。 | 更新恢复、JDBC 双语与总览；完整实现见 [implementations/pr-14339.md](implementations/pr-14339.md)。 |
| [#14340](https://github.com/QwenLM/qwen-code/pull/14340) | 保留 Pod 不能保证公开 Session 交接及原上下文撤销。 | 已合入显式 CSI/files 单未完成 Session，逻辑 close 留原 Pod/PVC/reservation；未知拒绝下一 Session，不物理释放/重建。 | 更新恢复、JDBC 双语与总览；完整实现见 [implementations/pr-14340.md](implementations/pr-14340.md)。 |
| [#14357](https://github.com/QwenLM/qwen-code/pull/14357) | 配置/模拟响应不能证明真实扩展执行、不重放和清理。 | 已合入 Linux/MySQL MCP/Hook 真进程与受控模型门禁，替换 Harness、取消/close、UNKNOWN 一次效果负向对照。 | 更新客户端、恢复与总览；完整实现见 [implementations/pr-14357.md](implementations/pr-14357.md)。 |
| [#14364](https://github.com/QwenLM/qwen-code/pull/14364) | RR 旧快照误拒 publication，后台 close 误要前台 receipt。 | 已合入局部 READ_COMMITTED；精确 child/monitor 调用免前台 receipt，仍核验原输出/物理停止。 | 更新完整结果双语、恢复与总览；完整实现见 [implementations/pr-14364.md](implementations/pr-14364.md)。 |
| [#14370](https://github.com/QwenLM/qwen-code/pull/14370) | 自定义字节存储仍被强制 OSS 装配及异常类型耦合。 | 已合入通用配置/错误与有条件 OSS 默认 Bean；保留 immutable/guard/delete，换 Bean 不迁移旧对象。 | 更新完整结果双语、SDK 与总览；完整实现见 [implementations/pr-14370.md](implementations/pr-14370.md)。 |
| [#14377](https://github.com/QwenLM/qwen-code/pull/14377) | 续租停止、丢 admission 及 parked 取消缺原生结算回执。 | 已合入原 grant 内重试、锁定日志同源未接纳证明；仅 ECONNREFUSED+原进程组 gone 保留取消，先写唯一 Shell receipt，不重放未知。 | 更新恢复、完整结果双语与总览；完整实现见 [implementations/pr-14377.md](implementations/pr-14377.md)。 |
| [#14405](https://github.com/QwenLM/qwen-code/pull/14405) | 不能选择原项目目录，工具缺及时进度且硬编码 16 轮。 | 已合入 OWNER/ROOT 原 storage 目录别名、原回执/default cwd；从持久 intent/receipt 投影状态不泄露输出，轮数遵循配置。 | 增补客户端、存储与总览；完整实现见 [implementations/pr-14405.md](implementations/pr-14405.md)。 |
| [#14435](https://github.com/QwenLM/qwen-code/pull/14435) | 共享 worker 下 close 会漏释放自身或误停其它 Session。 | 已合入独立 default-session 配置、真实 owner fence、逐 Session 有界释放；binding 留 READY，物理退役只属 storage fence，V9 索引。 | 增补恢复、JDBC 双语、存储与总览；完整实现见 [implementations/pr-14435.md](implementations/pr-14435.md)。 |
| [#14436](https://github.com/QwenLM/qwen-code/pull/14436) | Shell 无法取回输出被误显示为真实空 stdout。 | 已合入 raw/content 存在性判定、活动等待和两种模式不可获取提示；不改变执行或 capture 事实。 | 增补客户端、完整结果双语与总览；完整实现见 [implementations/pr-14436.md](implementations/pr-14436.md)。 |
| [#14442](https://github.com/QwenLM/qwen-code/pull/14442) | macOS 缺可靠 storage/worker 原生身份，不能安全重接。 | 已合入 hardware UUID、boot UUID、dev/inode/纳秒 birth 校验；同 boot 接原 worker，拒绝 macOS trusted reboot。 | 增补恢复、JDBC 双语、客户端与总览；完整实现见 [implementations/pr-14442.md](implementations/pr-14442.md)。 |
| [#14484](https://github.com/QwenLM/qwen-code/pull/14484) | 已保存定义会话不能改下一 Turn 策略，单放菜单破坏恢复。 | 当前 diff 精确 profile、owner+OPERATOR、V6 原快照及双 Harness 能力；初始定义不改，旧 Java writer 须隔离升级。 | 增补客户端、存储、SDK 与总览的 open 边界；完整观察见 [implementations/pr-14484.md](implementations/pr-14484.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [Managed Agents](../../feature/managed-agents/README.md) | #13931(merged), #13936(merged), #13973(merged), #13996(merged), #14039(merged), #14045(merged), #14059(merged), #14069(merged), #14081(merged), #14124(merged), #14141(closed), #14174(closed), #14180(merged), #14185(merged), #14186(merged), #14214(merged), #14254(merged), #14270(merged), #14277(merged), #14280(merged), #14290(open), #14306(merged), #14307(merged), #14316(merged), #14318(merged), #14319(merged), #14323(merged), #14339(merged), #14340(merged), #14357(merged), #14364(merged), #14370(merged), #14377(merged), #14405(merged), #14435(merged), #14436(merged), #14442(merged), #14484(open) | 同步最终/设计/观察范围与未运行门禁；不移动创建周。 |
| [恢复与运维](../../feature/managed-agents/managed-agent-recovery-operations.md) | #13931(merged), #14039(merged), #14045(merged), #14059(merged), #14141(closed), #14214(merged), #14254(merged), #14290(open), #14318(merged), #14339(merged), #14340(merged), #14357(merged), #14364(merged), #14377(merged), #14435(merged), #14442(merged) | 原取消回执、公开共享 worker、窄 CSI 与 macOS 同 boot 恢复分别限定。 |
| [客户端与事件](../../feature/managed-agents/managed-agent-client-surfaces.md) | #13936(merged), #13973(merged), #13996(merged), #14081(merged), #14290(open), #14306(merged), #14307(merged), #14316(merged), #14318(merged), #14319(merged), #14323(merged), #14357(merged), #14405(merged), #14436(merged), #14442(merged), #14484(open) | 目录/进度、SSH/macOS 已合入；保存定义审批仍 open。 |
| [存储、事件与会话恢复](../../feature/managed-agents/managed-agent-storage-event-architecture.md) | #14069(merged), #14174(closed), #14180(merged), #14185(merged), #14277(merged), #14316(merged), #14323(merged), #14405(merged), #14435(merged), #14484(open) | 当前 V1–V9；原目录 receipt、单列索引和未合入无 schema 改策分开。 |
| [Runtime Broker JDBC 中文](../../feature/managed-agents/managed-runtime-broker-jdbc.zh-CN.md) / [English](../../feature/managed-agents/managed-runtime-broker-jdbc.md) | #13996(merged), #14069(merged), #14081(merged), #14180(merged), #14185(merged), #14318(merged), #14339(merged), #14340(merged), #14435(merged), #14442(merged) | 原 authority、逐 Session close、storage 物理退役与平台身份分开。 |
| [完整工具结果中文](../../feature/managed-agents/managed-agent-tool-result-artifacts.zh-CN.md) / [English](../../feature/managed-agents/managed-agent-tool-result-artifacts.md) | #14124(merged), #14364(merged), #14370(merged), #14377(merged), #14436(merged) | 最终连接拒绝/原停止回执边界，输出缺失显示不等于真实空 stdout。 |
| [SDK](../../feature/sdk.md) | #14124(merged), #14186(merged), #14277(merged), #14280(merged), #14307(merged), #14316(merged), #14323(merged), #14370(merged), #14484(open) | 已合入协议保留；保存定义双能力/旧 writer 兼容仍为 open。 |

_按个人 PR 口径更新于 2026-10-18；本次仅执行文档审计，源码、浏览器、MySQL/OSS/CSI/SSH/macOS 原生进程及部署门禁未运行。_
