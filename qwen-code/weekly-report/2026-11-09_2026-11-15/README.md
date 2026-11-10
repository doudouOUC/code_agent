# qwen-code PRs · 2026-11-09 ~ 2026-11-15 (W46 日更至 11-10)

> 本次日更新增北京时间 2026-11-10 00:00:00 至 23:59:59 创建的 @doudouOUC 个人 PR，UTC 窗口为 `[2026-11-09T16:00:00Z, 2026-11-10T16:00:00Z)`，命中 9 个；同时刷新已收录的 11-09 PR。独立按 `QwenLM/qwen-code` 的 author 与 createdAt 分页核验，本周截至 11-10 的累计创建窗口为 `[2026-11-08T16:00:00Z, 2026-11-10T16:00:00Z)`，共 10 个，尚非完整周报。只在窗口内更新、关闭或合入而创建时间不在窗口内的 PR 不计入新增统计，不移动历史周条目。快照为北京时间 2026-11-11 凌晨，主干 `74b8cde46612`；open PR 只能描述当前 diff，不能视为 main 已落地能力。

**主题**: 私有 BTW/Recap、JDBC 名称与能力/路由同源、请求内读取复用；错误解析与对象存储/冷归档仍 open

**PR 统计**: 10 PRs - 8 merged / 2 open / 0 closed
**当前已合并 PR 代码量**: +19,315 / -9,277，505 个文件变更
**全量代码量**: +25,267 / -9,965，628 个文件变更
**类型分布**: refactor ×3, fix ×2, feat ×2, perf ×2, chore ×1
**范围 (scope)**: managed-agent ×8, managed ×1, cli ×1

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 代码量 | 文件数 | 创建时间(UTC) | 合并/关闭时间(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#16723](https://github.com/QwenLM/qwen-code/pull/16723) | merged | @doudouOUC | fix(managed): Allow short browser tokens in Web gateway | +37/-32 | 5 | 2026-11-09 08:15:32 | 2026-11-09 08:35:05 |
| [#16758](https://github.com/QwenLM/qwen-code/pull/16758) | merged | @doudouOUC | feat(managed-agent): add private BTW and session recap | +14255/-5368 | 90 | 2026-11-09 16:04:43 | 2026-11-10 05:20:00 |
| [#16759](https://github.com/QwenLM/qwen-code/pull/16759) | merged | @doudouOUC | refactor(managed-agent): give JDBC stores names distinct from their interfaces | +3919/-3483 | 386 | 2026-11-09 16:48:20 | 2026-11-09 17:13:23 |
| [#16763](https://github.com/QwenLM/qwen-code/pull/16763) | merged | @doudouOUC | refactor(managed-agent): share Hosted Harness feature tokens between connectors | +86/-111 | 3 | 2026-11-09 17:17:35 | 2026-11-09 19:09:12 |
| [#16788](https://github.com/QwenLM/qwen-code/pull/16788) | merged | @doudouOUC | refactor(cli): single-source the Managed Runtime worker route surface | +977/-92 | 7 | 2026-11-10 06:53:46 | 2026-11-10 07:37:18 |
| [#16822](https://github.com/QwenLM/qwen-code/pull/16822) | merged | @doudouOUC | chore(managed-agent): remove unused constructors and helpers | +4/-168 | 6 | 2026-11-10 13:12:26 | 2026-11-10 13:35:10 |
| [#16826](https://github.com/QwenLM/qwen-code/pull/16826) | open | @doudouOUC | fix(managed-agent): harden Harness error-code parsing, host reader and exception causes | +83/-40 | 9 | 2026-11-10 13:25:17 | - |
| [#16827](https://github.com/QwenLM/qwen-code/pull/16827) | merged | @doudouOUC | perf(managed-agent): remove redundant read-path queries | +11/-11 | 3 | 2026-11-10 13:32:09 | 2026-11-10 16:23:29 |
| [#16828](https://github.com/QwenLM/qwen-code/pull/16828) | merged | @doudouOUC | perf(managed-agent): cheapen proof copies, CSI lookup and startup polling | +26/-12 | 5 | 2026-11-10 13:37:38 | 2026-11-10 14:38:17 |
| [#16837](https://github.com/QwenLM/qwen-code/pull/16837) | open | @doudouOUC | feat(managed-agent): add pluggable object storage and journal archiving | +5869/-648 | 114 | 2026-11-10 15:53:40 | - |

---

## PR 解决问题、实现方式与 feature 处理

| PR | 解决了什么问题 | 最终怎么实现（open/closed 只登记当前观察） | 对应 feature 文档 |
|---|---|---|---|
| [#16723](https://github.com/QwenLM/qwen-code/pull/16723) | 独立 Managed Web 网关把浏览器 bearer token 与服务签名密钥套用同一 32 字节下限，导致短而非空的独立 token 无法启动。 | 已合入：只移除浏览器 token 长度检查；沿原解析拒绝空白，签名密钥仍至少 32 个 UTF-8 字节，并拒绝浏览器 token 等于原始或 trim 后的签名密钥；CLI 帮助和 Kubernetes 双语说明对齐。 | 更新 Feature 总览、Managed Agents、客户端、恢复与运维；完整最终实现见 [implementations/pr-16723.md](implementations/pr-16723.md)。 |
| [#16758](https://github.com/QwenLM/qwen-code/pull/16758) | 需要不污染主任务、跨刷新可恢复的私有追问和冷 Session 回顾。 | 已合入：tenant/Session/actor 私有账本冻结前缀与模型，原 claim 约束无工具模型执行；WebShell 恢复原意图并按返回/idle 门禁触发 Recap，两类开关默认关闭。 | 更新总览、Managed Agents、客户端、存储、恢复与 SDK；完整最终实现见 [implementations/pr-16758.md](implementations/pr-16758.md)。 |
| [#16759](https://github.com/QwenLM/qwen-code/pull/16759) | 接口与实现同名导致全限定引用与事务入口歧义。 | 已合入：23 个 JDBC 实现改 Jdbc 前缀，artifact reader 与 child port 分别明确名称；同步调用方和锁/体量验证路径，不改 SQL/wire/事务边界。 | 更新总览、Managed Agents、存储与存储事件架构；完整最终实现见 [implementations/pr-16759.md](implementations/pr-16759.md)。 |
| [#16763](https://github.com/QwenLM/qwen-code/pull/16763) | 单/池 Harness 两套 token 与依赖判断易漂移。 | 已合入：HarnessFeature 统一 token 和审批依赖，连接器仍保 SessionStore、lifecycle 和失败拒绝。 | 更新总览、Managed Agents、配置扩展；完整最终实现见 [implementations/pr-16763.md](implementations/pr-16763.md)。 |
| [#16788](https://github.com/QwenLM/qwen-code/pull/16788) | worker 外层路由放行与实际 publisher 挂载组合可能不一致。 | 已合入：共享 publisher mode 与 worker route plan，gate 消费实际 plan；保 boot v1/v2、resident 和原授权边界。 | 更新总览、Managed Agents、存储事件架构与恢复；完整最终实现见 [implementations/pr-16788.md](implementations/pr-16788.md)。 |
| [#16822](https://github.com/QwenLM/qwen-code/pull/16822) | 无调用的构造器和转发 helper 造成旧契约噪音。 | 已合入：删除闲置缩参构造器/转发，Unicode 测试直接调用 policy；record 字段、HTTP/JSON 与存储协议不改。 | 更新总览、Managed Agents、存储；完整最终实现见 [implementations/pr-16822.md](implementations/pr-16822.md)。 |
| [#16826](https://github.com/QwenLM/qwen-code/pull/16826) | 带空白或截断错误体丢 code，多处异常丢 cause。 | 当前 open diff：共享 bodyCode、结构化 code 优先、保 cause 与 stdout 虚拟线程；最新 head 已撤取消键回收，不登记取消泄漏修复。 | 更新总览、Managed Agents、自动任务与恢复；完整当前实现观察见 [implementations/pr-16826.md](implementations/pr-16826.md)。 |
| [#16827](https://github.com/QwenLM/qwen-code/pull/16827) | 同一控制流重复查 Git diff、occurrence、owner binding。 | 已合入：复用本次已读事实，不建跨请求缓存或放宽 generation/state 判定；未测收益。 | 更新总览、Managed Agents、自动任务与恢复；完整最终实现见 [implementations/pr-16827.md](implementations/pr-16827.md)。 |
| [#16828](https://github.com/QwenLM/qwen-code/pull/16828) | proof JSON 往返、逐参编译 regex 与固定轮询带来开销。 | 已合入：字段复制保 installRef deepCopy、单 matcher 顺序 lookup、200–2000 ms 启动退避；原身份/超时不改。 | 更新总览、Managed Agents、存储事件架构与恢复；完整最终实现见 [implementations/pr-16828.md](implementations/pr-16828.md)。 |
| [#16837](https://github.com/QwenLM/qwen-code/pull/16837) | 大资源与长期 journal 占 SQL，外置需要原身份与 UNKNOWN/恢复围栏。 | 当前 open diff：不可变 SPI/插件、SQL 归属资源上传/回读/GC、manifest 冷归档与受保护补热；默认关闭，候选 reader 6，尚非 main。 | 更新总览、Managed Agents、存储、存储事件架构与恢复；完整当前实现观察见 [implementations/pr-16837.md](implementations/pr-16837.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [Feature 总览](../../feature/README.md) | #16723(merged), #16758(merged), #16759(merged), #16763(merged), #16788(merged), #16822(merged), #16826(open), #16827(merged), #16828(merged), #16837(open) | 同步主干、默认关闭与候选边界。 |
| [Managed Agents](../../feature/managed-agents/README.md) | #16723(merged), #16758(merged), #16759(merged), #16763(merged), #16788(merged), #16822(merged), #16826(open), #16827(merged), #16828(merged), #16837(open) | 按专题链接新增实现，保留历史快照。 |
| [客户端](../../feature/managed-agents/managed-agent-client-surfaces.md) | #16723(merged), #16758(merged) | 私有 BTW/Recap、原意图恢复和凭据边界。 |
| [Session 存储](../../feature/managed-agents/managed-agent-session-storage.md) | #16758(merged), #16759(merged), #16822(merged), #16837(open) | 42 表、JDBC 现行名称；区分 main reader 5 与候选 6。 |
| [恢复与运维](../../feature/managed-agents/managed-agent-recovery-operations.md) | #16723(merged), #16758(merged), #16788(merged), #16826(open), #16827(merged), #16828(merged), #16837(open) | 旁路 claim、路由/启动与对象归档验证边界。 |
| [存储事件架构](../../feature/managed-agents/managed-agent-storage-event-architecture.md) | #16759(merged), #16788(merged), #16828(merged), #16837(open) | 当前实现入口、路由同源、性能及冷归档候选。 |
| [配置与扩展](../../feature/managed-agents/managed-agent-config-extensions.md) | #16763(merged) | 共享 token/依赖不替代执行授权。 |
| [自动任务与 Channels](../../feature/managed-agents/managed-agent-automation.md) | #16826(open), #16827(merged) | 错误码候选与已合入请求内查询复用。 |
| [SDK](../../feature/sdk.md) | #16758(merged) | Java Hosted 旁路 claim/资源/结果契约。 |

_按个人 PR 口径更新于 2026-11-11；本次核对 diff、changed files、主干和测试定义，未运行产品测试、CI、数据库、浏览器或平台验收。_
