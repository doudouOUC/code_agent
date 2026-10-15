# qwen-code PRs · 2026-10-12 ~ 2026-10-18 (W42 日更)

> 本文件已整理北京时间 2026-10-12 至 2026-10-15 创建的 @doudouOUC 个人 PR，UTC 半开窗口 `[2026-10-11T16:00:00Z, 2026-10-15T16:00:00Z)`。按 author/createdAt 归属，不按更新、关闭或合入日期补收。当前周尚未结束；本次快照取 2026-10-16，主干 `01d97f571a66`。open 仅当前 diff，closed 未合入仅历史观察；前一周后续合入的 PR 仍留 W41。规模逐 PR 累加，不是去重后的 main 增量。#14186 已合入，旧语法错误仅属历史 head，本次 main 两文件 parser 为零错误；不等于完整源码测试通过。

**主题**: L4/UI/私有 CSI 与 32 表、capture/静态门禁、Runtime 设计与库复用，以及 open 搜索、托管首页和 SSH

**PR 统计**: 25 PRs - 17 merged / 6 open / 2 closed
**当前已合并 PR 代码量**: +71,056 / -20,836，1329 个文件变更
**全量代码量**: +95,925 / -22,711，2466 个文件变更
**类型分布**: feat ×9, fix ×8, test ×1, chore ×1, docs ×2, refactor ×4
**范围 (scope)**: managed-agent ×13, web-shell ×3, sdk-java ×2, serve ×2, core ×1, none ×1, runtime-broker ×2, design ×1

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
| [#14081](https://github.com/QwenLM/qwen-code/pull/14081) | 🟡 open | @doudouOUC | feat(serve): attach private CSI Sessions to Hosted text turns | +1833/-16 | 20 | 10-13 15:06 | - |
| [#14124](https://github.com/QwenLM/qwen-code/pull/14124) | ✅ merged | @doudouOUC | fix(managed-agent): Wire OSS capture budgets into Hosted sessions | +350/-68 | 9 | 10-14 00:34 | 10-14 08:21 |
| [#14141](https://github.com/QwenLM/qwen-code/pull/14141) | 🔴 closed | @doudouOUC | fix(sdk-java): repair Hosted owner probes and mount fixtures | +109/-15 | 10 | 10-14 05:54 | 10-14 06:23 |
| [#14174](https://github.com/QwenLM/qwen-code/pull/14174) | 🔴 closed | @doudouOUC | test(managed-agent): align the baseline witness with canonical V2 | +1/-1 | 1 | 10-14 09:52 | 10-14 12:15 |
| [#14180](https://github.com/QwenLM/qwen-code/pull/14180) | ✅ merged | @doudouOUC | fix(core): retain CSI preparation resources through the HTTP store | +1482/-0 | 7 | 10-14 11:14 | 10-15 16:56 |
| [#14185](https://github.com/QwenLM/qwen-code/pull/14185) | ✅ merged | @doudouOUC | fix(managed-agent): Standardize SQL timestamps and query mappings | +2785/-2466 | 182 | 10-14 12:37 | 10-15 16:46 |
| [#14186](https://github.com/QwenLM/qwen-code/pull/14186) | ✅ merged | @doudouOUC | chore: adopt qwen-code-checks.xml and fix all checkstyle violations | +4436/-3344 | 433 | 10-14 12:42 | 10-15 03:56 |
| [#14214](https://github.com/QwenLM/qwen-code/pull/14214) | ✅ merged | @doudouOUC | docs(runtime-broker): design Workspace-resident Managed Tool Runtime | +743/-0 | 2 | 10-14 16:18 | 10-15 03:48 |
| [#14254](https://github.com/QwenLM/qwen-code/pull/14254) | ✅ merged | @doudouOUC | refactor(runtime-broker): name the local-process kind and Workspace isolation policy | +617/-388 | 15 | 10-15 05:04 | 10-15 09:33 |
| [#14270](https://github.com/QwenLM/qwen-code/pull/14270) | ✅ merged | @doudouOUC | docs(design): drop stray conflict markers from the actor-roles design | +0/-3 | 2 | 10-15 07:11 | 10-15 09:41 |
| [#14277](https://github.com/QwenLM/qwen-code/pull/14277) | 🟡 open | @doudouOUC | refactor(managed-agent): Consolidate server and broker sources | +1059/-1002 | 858 | 10-15 08:44 | - |
| [#14280](https://github.com/QwenLM/qwen-code/pull/14280) | ✅ merged | @doudouOUC | refactor(managed-agent): Reuse Apache Commons utilities | +519/-338 | 69 | 10-15 08:53 | 10-15 12:21 |
| [#14290](https://github.com/QwenLM/qwen-code/pull/14290) | 🟡 open | @doudouOUC | feat(managed-agent): Add bounded Workspace search tools | +2027/-171 | 54 | 10-15 10:13 | - |
| [#14306](https://github.com/QwenLM/qwen-code/pull/14306) | 🟡 open | @doudouOUC | fix(managed-agent): Align hosted prompts with declared tools | +551/-22 | 5 | 10-15 15:03 | - |
| [#14307](https://github.com/QwenLM/qwen-code/pull/14307) | ✅ merged | @doudouOUC | refactor(managed-agent): Reuse text and byte-range utilities | +83/-30 | 8 | 10-15 15:12 | 10-15 16:40 |
| [#14316](https://github.com/QwenLM/qwen-code/pull/14316) | 🟡 open | @doudouOUC | feat(web-shell): integrate Managed sessions into the home workflow | +9031/-367 | 86 | 10-15 15:46 | - |
| [#14318](https://github.com/QwenLM/qwen-code/pull/14318) | 🟡 open | @doudouOUC | feat(managed-agent): Add SSH Tool Runtime support | +10258/-281 | 103 | 10-15 15:54 | - |

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
| [#14081](https://github.com/QwenLM/qwen-code/pull/14081) | 私有 CSI 文本误走普通 owner/close 会替换写者或 seal 原 authority。 | 当前面向 main 的 diff 私有 attach/text/history 接纯文本，fresh 原 admission、失租阻塞、stopLocal 不 seal/release；SQL/catalog 已继承 main，但本提取仍 open。 | 更新客户端、JDBC 双语与总览；完整观察见 [implementations/pr-14081.md](implementations/pr-14081.md)。 |
| [#14124](https://github.com/QwenLM/qwen-code/pull/14124) | Java 未传 captureBytes，启用 publication 的 Shell 仍选 inline producer。 | 已合入可选 SDK 字段及精确 Shell family create 接线；load 恢复原预算，不传新部署值，raw capture 与聚合开销/独立 GC 开关分开。 | 增补完整结果双语、SDK 与总览；完整实现见 [implementations/pr-14124.md](implementations/pr-14124.md)。 |
| [#14141](https://github.com/QwenLM/qwen-code/pull/14141) | Hosted probe 旧 hash 查错 physical owner，fixture birth/mtime 同 tick 误触身份拒绝。 | 关闭前测试方案沿 canonical alias JOIN physical owner，原字节身份/decoy 不回退；仅装置 mtime 固定，不改生产身份读取器。 | 恢复与总览保留 closed 观察；完整观察见 [implementations/pr-14141.md](implementations/pr-14141.md)。 |
| [#14174](https://github.com/QwenLM/qwen-code/pull/14174) | 已初始化 V2 catalog 的 baseline witness 仍预期版本 1。 | closed 未合入，仅一行 expected 1→2，32 业务表+history 的断言保留；不新增生产 DDL 或迁移。 | 存储与总览记录有限 witness；完整观察见 [implementations/pr-14174.md](implementations/pr-14174.md)。 |
| [#14180](https://github.com/QwenLM/qwen-code/pull/14180) | HTTP adapter 遗漏 private preparation refs，SQL 同事务 candidate 不闭合。 | 已合入精确 schema2/profile preparation 遍历；prepared 通过 intentRef 重纳 predecessor，不泛化遍历顶层旧引用；有限真实 SQL/worker fixture 不证明原生 CSI。 | 更新存储、JDBC 双语与总览；完整实现见 [implementations/pr-14180.md](implementations/pr-14180.md)。 |
| [#14185](https://github.com/QwenLM/qwen-code/pull/14185) | 混合 SQL 时间/driver 类型和 SELECT * 使 lease/分页/映射难核验。 | 已合入 V1/V3 epoch-ms/UNSIGNED/gmt 和 typed projection，保留 actor 字节/immutable 列表 keyset，终态 collector 用安全整数 NEVER_DUE；没有旧 catalog 版本化升级。 | 更新存储、JDBC 双语与总览；完整实现见 [implementations/pr-14185.md](implementations/pr-14185.md)。 |
| [#14186](https://github.com/QwenLM/qwen-code/pull/14186) | server 静态规则不统一，测试源码缺少低成本独立 Checkstyle 门禁。 | 已合入规则、server pom/test 和 Ubuntu/Java21 workflow 步骤；最终两文件仅 import 调整，本次 main parser 零错误，旧错误不再列当前阻塞。 | SDK 与总览更新 merged/有限验证；完整实现见 [implementations/pr-14186.md](implementations/pr-14186.md)。 |
| [#14214](https://github.com/QwenLM/qwen-code/pull/14214) | 共享常驻 worker 的 owner、容量和停止证据没有分层方案。 | 已合入双语设计；最新 main 修订为身份策略→idle→硬预算共享→创建预热，keep-warm 推后；设计合入不等于运行能力已实现。 | 恢复与总览区分设计/实现；完整实现见 [implementations/pr-14214.md](implementations/pr-14214.md)。 |
| [#14254](https://github.com/QwenLM/qwen-code/pull/14254) | local-process 字面量和 Session 隔离规则多点重复，易漏改归属。 | 已合入公开 KIND 和 admitsIsolationClass，统一配置/解析/stop/release，仍严格只许 session，不开放共享或空闲退役。 | 更新恢复与总览；完整实现见 [implementations/pr-14254.md](implementations/pr-14254.md)。 |
| [#14270](https://github.com/QwenLM/qwen-code/pull/14270) | actor roles 双语设计残留冲突标记。 | 已合入两文件三行删除，仅清标记，不改 ACL 或运行代码。 | 总览记录文档维护，不新增权限技术方案；完整实现见 [implementations/pr-14270.md](implementations/pr-14270.md)。 |
| [#14277](https://github.com/QwenLM/qwen-code/pull/14277) | 仅服务端消费的独立 Broker 模块增加构建和 classpath 维护成本。 | 当前 diff 合并到 packages/managed-agent-server，保留包名/资源/测试和双规则检查，迁移 CI/Docker/合约 rename guard；main 仍旧目录。 | 增补 SDK、存储与总览；完整观察见 [implementations/pr-14277.md](implementations/pr-14277.md)。 |
| [#14280](https://github.com/QwenLM/qwen-code/pull/14280) | 重复字符串/摘要/HMAC/mapper 实现增加维护并易改持久字节。 | 已合入直接 Commons 依赖和固定组件复用，保留 UTF-16/Unicode 专用规则、canonical JSON、hash 编码/流限制/异常分类。 | 更新 SDK 与总览；完整实现见 [implementations/pr-14280.md](implementations/pr-14280.md)。 |
| [#14290](https://github.com/QwenLM/qwen-code/pull/14290) | 普通 grep/ls 缺 Session ownership、进程取消与硬结果预算。 | 当前 diff 默认关闭 /3 profile，随包 rg/worker 五秒期限，扫描前查嵌套 owner，1 MiB 原始/48 KiB wire/64 KiB outcome；恢复只观察原执行。 | 增补客户端、恢复与总览；完整观察见 [implementations/pr-14290.md](implementations/pr-14290.md)。 |
| [#14306](https://github.com/QwenLM/qwen-code/pull/14306) | Hosted tools 已替换，但 prompt 仍指导不可用工具。 | 当前 diff 以实际声明名称集合和 context 同步 fresh prompt，空集明确无工具；prepared replay 保留原请求，失败不发推理。 | 增补客户端与总览；完整观察见 [implementations/pr-14306.md](implementations/pr-14306.md)。 |
| [#14307](https://github.com/QwenLM/qwen-code/pull/14307) | 手写 escape、LF 切分和 Range 运算重复且替换易放松协议。 | 已合入 replaceEach/split/HttpRange，保留三字符语义和旧 ASCII/逗号/错误分类门禁，不开放多 range。 | 更新 SDK、客户端与总览；完整实现见 [implementations/pr-14307.md](implementations/pr-14307.md)。 |
| [#14316](https://github.com/QwenLM/qwen-code/pull/14316) | 托管首页割裂、工作区只读发现、审批和模型/上下文无真实控制。 | 当前 diff 单 sidebar/独立后端归属，actor 回执两阶段建目录，固定审批、Turn 模型快照和成功 usage 投影；含 V4/V5，非纯 UI。 | 增补客户端、存储、SDK 与总览；完整观察见 [implementations/pr-14316.md](implementations/pr-14316.md)。 |
| [#14318](https://github.com/QwenLM/qwen-code/pull/14318) | 远端目录工具缺原 worker 唯一启动、重连和严格退役证据。 | 当前 diff 默认关闭 ssh-process，固定 intent/handle、双向转发、原 lease/clean proof；仅 /1 文件及前台 Shell，不重放 UNKNOWN。 | 增补恢复、客户端、JDBC 双语与总览；完整观察见 [implementations/pr-14318.md](implementations/pr-14318.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [Managed Agents](../../feature/managed-agents/README.md) | #13931(merged), #13936(merged), #13973(merged), #13996(merged), #14039(merged), #14045(merged), #14059(merged), #14069(merged), #14081(open), #14124(merged), #14141(closed), #14174(closed), #14180(merged), #14185(merged), #14186(merged), #14214(merged), #14254(merged), #14270(merged), #14277(open), #14280(merged), #14290(open), #14306(open), #14307(merged), #14316(open), #14318(open) | 同步最终/设计/观察范围与未运行门禁；不移动创建周。 |
| [恢复与运维](../../feature/managed-agents/managed-agent-recovery-operations.md) | #13931(merged), #14039(merged), #14045(merged), #14059(merged), #14141(closed), #14214(merged), #14254(merged), #14290(open), #14318(open) | 原资源停止、设计提案和开放搜索/SSH 恢复分开。 |
| [客户端与事件](../../feature/managed-agents/managed-agent-client-surfaces.md) | #13936(merged), #13973(merged), #13996(merged), #14081(open), #14290(open), #14306(open), #14307(merged), #14316(open), #14318(open) | 已合入 UI 与 open 首页、声明、模型、SSH 接口分开。 |
| [存储、事件与会话恢复](../../feature/managed-agents/managed-agent-storage-event-architecture.md) | #14069(merged), #14174(closed), #14180(merged), #14185(merged), #14277(open), #14316(open) | 已合入 V3/gmt 时间与资源闭包；open 目录、V4/V5 及兼容边界。 |
| [Runtime Broker JDBC 中文](../../feature/managed-agents/managed-runtime-broker-jdbc.zh-CN.md) / [English](../../feature/managed-agents/managed-runtime-broker-jdbc.md) | #13996(merged), #14069(merged), #14081(open), #14180(merged), #14185(merged), #14318(open) | 原 authority、prepared predecessor、终态时间与 SSH 原资源证据。 |
| [完整工具结果中文](../../feature/managed-agents/managed-agent-tool-result-artifacts.zh-CN.md) / [English](../../feature/managed-agents/managed-agent-tool-result-artifacts.md) | #14124(merged) | captureBytes create/load、预算与真实云验收区分。 |
| [SDK](../../feature/sdk.md) | #14124(merged), #14186(merged), #14277(open), #14280(merged), #14307(merged), #14316(open) | capture、已合入静态规则/库复用与开放目录/模型协议分开。 |

_按个人 PR 口径更新于 2026-10-16_
