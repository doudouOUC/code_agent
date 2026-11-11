# qwen-code PRs · 2026-11-09 ~ 2026-11-15 (W46 日更至 11-11)

> 本次日更新增北京时间 2026-11-11 00:00:00 至 23:59:59 创建的 @doudouOUC 个人 PR，UTC 窗口为 `[2026-11-10T16:00:00Z, 2026-11-11T16:00:00Z)`，命中 10 个；同时刷新本周已收录 PR。按 author 与 createdAt 独立分页核验，累计创建窗口 `[2026-11-08T16:00:00Z, 2026-11-11T16:00:00Z)` 共 20 个，尚非完整周报。不按更新/合入时间补收其他周条目，也不保留其他作者 PR。快照为北京时间 2026-11-12 凌晨，主干 `3c0140f98c26`；open PR 只记录当前 diff，不能作为 main 能力承诺。

**主题**: 异步 publication、OSS pack、业务扩展来源与 CSI 范围/限额修复；Broker/fence 与 JDBC 测试边界

**PR 统计**: 20 PRs - 18 merged / 2 open / 0 closed
**当前已合并 PR 代码量**: +28,796 / -21,774，849 个文件变更
**全量代码量**: +37,176 / -26,577，1019 个文件变更
**类型分布**: refactor ×9, fix ×4, feat ×4, perf ×2, chore ×1
**范围 (scope)**: managed-agent ×18, managed ×1, cli ×1

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
| [#16826](https://github.com/QwenLM/qwen-code/pull/16826) | merged | @doudouOUC | fix(managed-agent): harden Harness error-code parsing, host reader and exception causes | +158/-41 | 11 | 2026-11-10 13:25:17 | 2026-11-10 18:27:50 |
| [#16827](https://github.com/QwenLM/qwen-code/pull/16827) | merged | @doudouOUC | perf(managed-agent): remove redundant read-path queries | +11/-11 | 3 | 2026-11-10 13:32:09 | 2026-11-10 16:23:29 |
| [#16828](https://github.com/QwenLM/qwen-code/pull/16828) | merged | @doudouOUC | perf(managed-agent): cheapen proof copies, CSI lookup and startup polling | +26/-12 | 5 | 2026-11-10 13:37:38 | 2026-11-10 14:38:17 |
| [#16837](https://github.com/QwenLM/qwen-code/pull/16837) | open | @doudouOUC | feat(managed-agent): add pluggable object storage and journal archiving | +5869/-648 | 114 | 2026-11-10 15:53:40 | - |
| [#16840](https://github.com/QwenLM/qwen-code/pull/16840) | merged | @doudouOUC | refactor(managed-agent): keep asynchronous admission as the only publication mode | +621/-527 | 34 | 2026-11-10 16:34:28 | 2026-11-11 02:07:36 |
| [#16868](https://github.com/QwenLM/qwen-code/pull/16868) | merged | @doudouOUC | feat(managed-agent): OSS externalization of oversized session resources and journal compaction | +4046/-560 | 92 | 2026-11-11 02:42:03 | 2026-11-11 13:04:12 |
| [#16882](https://github.com/QwenLM/qwen-code/pull/16882) | merged | @doudouOUC | feat(managed-agent): Add external extension source and archive storage SPIs | +1874/-190 | 58 | 2026-11-11 06:09:10 | 2026-11-11 09:30:33 |
| [#16910](https://github.com/QwenLM/qwen-code/pull/16910) | merged | @doudouOUC | refactor(managed-agent): scope CSI retirement evidence to its own session | +348/-7598 | 26 | 2026-11-11 09:16:26 | 2026-11-11 10:13:20 |
| [#16922](https://github.com/QwenLM/qwen-code/pull/16922) | merged | @doudouOUC | refactor(managed-agent): complete broker facade decomposition | +1399/-1013 | 14 | 2026-11-11 10:36:59 | 2026-11-11 12:18:44 |
| [#16923](https://github.com/QwenLM/qwen-code/pull/16923) | merged | @doudouOUC | fix(managed-agent): read the frozen CSI commit body with its own size bound | +59/-95 | 5 | 2026-11-11 10:39:05 | 2026-11-11 11:12:02 |
| [#16928](https://github.com/QwenLM/qwen-code/pull/16928) | merged | @doudouOUC | refactor(managed-agent): remove uncalled CSI admission and workspace catalog code | +3/-1812 | 13 | 2026-11-11 11:36:50 | 2026-11-11 12:22:55 |
| [#16934](https://github.com/QwenLM/qwen-code/pull/16934) | merged | @doudouOUC | fix(managed-agent): honour the declared base64 bounds and drop an orphaned import | +27/-4 | 4 | 2026-11-11 12:34:51 | 2026-11-11 13:46:42 |
| [#16936](https://github.com/QwenLM/qwen-code/pull/16936) | merged | @doudouOUC | refactor(managed-agent): extract binding admission and fence engine | +946/-657 | 87 | 2026-11-11 12:52:28 | 2026-11-11 16:20:35 |
| [#16953](https://github.com/QwenLM/qwen-code/pull/16953) | open | @doudouOUC | refactor(managed-agent): retire the InMemory runtime broker repositories | +2511/-4155 | 56 | 2026-11-11 15:26:53 | - |

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
| [#16826](https://github.com/QwenLM/qwen-code/pull/16826) | 带空白或截断错误体丢 code，多处异常丢 cause。 | 已合入：共享 bodyCode、结构化 code 优先、存储 Skills 409 词汇归一并保 cause、stdout 虚拟线程；不含取消键回收。 | 更新总览、Managed Agents、自动任务与恢复；完整最终实现见 [implementations/pr-16826.md](implementations/pr-16826.md)。 |
| [#16827](https://github.com/QwenLM/qwen-code/pull/16827) | 同一控制流重复查 Git diff、occurrence、owner binding。 | 已合入：复用本次已读事实，不建跨请求缓存或放宽 generation/state 判定；未测收益。 | 更新总览、Managed Agents、自动任务与恢复；完整最终实现见 [implementations/pr-16827.md](implementations/pr-16827.md)。 |
| [#16828](https://github.com/QwenLM/qwen-code/pull/16828) | proof JSON 往返、逐参编译 regex 与固定轮询带来开销。 | 已合入：字段复制保 installRef deepCopy、单 matcher 顺序 lookup、200–2000 ms 启动退避；原身份/超时不改。 | 更新总览、Managed Agents、存储事件架构与恢复；完整最终实现见 [implementations/pr-16828.md](implementations/pr-16828.md)。 |
| [#16837](https://github.com/QwenLM/qwen-code/pull/16837) | 大资源与长期 journal 占 SQL，外置需要原身份与 UNKNOWN/恢复围栏。 | 当前 open diff：不可变 SPI/插件、SQL 归属资源上传/回读/GC、manifest 冷归档与受保护补热；默认关闭，候选 reader 6，尚非 main。 | 更新总览、Managed Agents、存储、存储事件架构与恢复；完整当前实现观察见 [implementations/pr-16837.md](implementations/pr-16837.md)。 |
| [#16840](https://github.com/QwenLM/qwen-code/pull/16840) | 同步和异步两条 publication 验证路径同时维护配置、header、SQL execution_mode 和客户端响应分支，容易让相同 operation 的恢复与最终回执口径分叉。 | 异步 operation 是唯一受理模式，移除选择 header/配置/SQL 列，保原 claim 与回执。 | 更新Feature 总览、Managed Agents、Session 存储、存储事件架构、恢复与运维；完整最终实现见 [implementations/pr-16840.md](implementations/pr-16840.md)。 |
| [#16868](https://github.com/QwenLM/qwen-code/pull/16868) | inline 资源上限阻断较大 Session 资源，长期原始 journal BLOB 占 SQL；直接删除正文又会破坏回放、恢复、列表与工具详情等读路径。 | 复用原对象适配器外置超限资源，按 SQL watermark/manifest 发布 pack 并回读；默认关闭，不同于通用冷归档候选。 | 更新Feature 总览、Managed Agents、Session 存储、存储事件架构、恢复与运维；完整最终实现见 [implementations/pr-16868.md](implementations/pr-16868.md)。 |
| [#16882](https://github.com/QwenLM/qwen-code/pull/16882) | 扩展包只支持平台本地归档，业务系统无法按明确资源版本提供 Skill/Extension；若把业务地址或凭据直接下发 Harness，还会绕过 actor 授权和固定内容校验。 | 精确来源引用、事务外授权/暂存/prepare、持久幂等发布与可替换归档；受理核冻结 selection。 | 更新Feature 总览、Managed Agents、配置与扩展；完整最终实现见 [implementations/pr-16882.md](implementations/pr-16882.md)。 |
| [#16910](https://github.com/QwenLM/qwen-code/pull/16910) | 退役应用通过全库 inventory/image 构造证据，扩大扫描、锁与跨 tenant 审阅范围；原 Session 的退役不应依赖无关 Session 的应用表快照。 | 从原 Session 读取 terminal/execution/resource 证据，删除全库 inventory/image；原退役围栏保持。 | 更新Feature 总览、Managed Agents、Session 存储、恢复与运维；完整最终实现见 [implementations/pr-16910.md](implementations/pr-16910.md)。 |
| [#16922](https://github.com/QwenLM/qwen-code/pull/16922) | RuntimeBrokerService 同时承载续租、Session 释放、drain/原资源停止与工具执行，公共入口和内部生命周期状态难以单独审阅。 | 公共 facade 委托续租、Session release 与 drain 协作者，统一身份/v3 比较。 | 更新Feature 总览、Managed Agents、存储事件架构、恢复与运维；完整最终实现见 [implementations/pr-16922.md](implementations/pr-16922.md)。 |
| [#16923](https://github.com/QwenLM/qwen-code/pull/16923) | commitBodyBase64 被短文本 helper 的 4096 字符上限截住，合法正文超过约 3072 字节即拒绝，可能使 CSI 退役停留在 FROZEN。 | 冻结 envelope 与 commit body 分别限 32 MiB/128 KiB，继续核 canonical 与摘要。 | 更新Feature 总览、Managed Agents、Session 存储、恢复与运维；完整最终实现见 [implementations/pr-16923.md](implementations/pr-16923.md)。 |
| [#16928](https://github.com/QwenLM/qwen-code/pull/16928) | 已无生产调用的独立 Workspace catalog/静态授权与 CSI READY admission 仍占据代码和测试入口，容易被误认为现行准入 authority。 | 删无生产调用 catalog/静态授权和 READY helper；实际 JDBC Workspace/CSI 准入不取消。 | 更新Feature 总览、Managed Agents、Session 存储、恢复与运维；完整最终实现见 [implementations/pr-16928.md](implementations/pr-16928.md)。 |
| [#16934](https://github.com/QwenLM/qwen-code/pull/16934) | 公共 proof 的 canonicalBase64 先调用短文本读取，导致不同调用方声明的正文上限被隐式压到约 3072 字节；历史终态 record 的读取也使用过大的通用历史预算。 | proof base64 按调用方 limit，历史 terminal record 明确 128 KiB，不放宽摘要/身份。 | 更新Feature 总览、Managed Agents、Session 存储、恢复与运维；完整最终实现见 [implementations/pr-16934.md](implementations/pr-16934.md)。 |
| [#16936](https://github.com/QwenLM/qwen-code/pull/16936) | JdbcRuntimeBindingRepository 混合持久 repository 操作与被多模块静态调用的 storage/Harness fence 规则，调用点依赖具体实现类，锁与事务归属难以分辨。 | 已合入：无状态 RuntimeAdmissionFences 接收原 Connection，保 repository 事务与原锁。 | 更新Feature 总览、Managed Agents、Session 存储、存储事件架构、恢复与运维；完整最终实现见 [implementations/pr-16936.md](implementations/pr-16936.md)。 |
| [#16953](https://github.com/QwenLM/qwen-code/pull/16953) | 内存 binding/session/execution repository 与 JDBC 两套语义长期漂移，测试可能只证明内存行为而未走实际 schema、CAS 与持久恢复路径。 | 当前 open diff：删除内存三 repository，测试改走 JDBC/H2；专用 fixture 不代替真实 admission。 | 更新Feature 总览、Managed Agents、Session 存储、存储事件架构、恢复与运维；完整当前实现观察见 [implementations/pr-16953.md](implementations/pr-16953.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [Feature 总览](../../feature/README.md) | #16723(merged), #16758(merged), #16759(merged), #16763(merged), #16788(merged), #16822(merged), #16826(merged), #16827(merged), #16828(merged), #16837(open), #16840(merged), #16868(merged), #16882(merged), #16910(merged), #16922(merged), #16923(merged), #16928(merged), #16934(merged), #16936(merged), #16953(open) | 同步本周实现、后续替代路径与候选边界，保留有效历史。 |
| [Managed Agents](../../feature/managed-agents/README.md) | #16723(merged), #16758(merged), #16759(merged), #16763(merged), #16788(merged), #16822(merged), #16826(merged), #16827(merged), #16828(merged), #16837(open), #16840(merged), #16868(merged), #16882(merged), #16910(merged), #16922(merged), #16923(merged), #16928(merged), #16934(merged), #16936(merged), #16953(open) | 同步本周实现、后续替代路径与候选边界，保留有效历史。 |
| [Session 存储](../../feature/managed-agents/managed-agent-session-storage.md) | #16758(merged), #16759(merged), #16822(merged), #16837(open), #16840(merged), #16868(merged), #16910(merged), #16923(merged), #16928(merged), #16934(merged), #16936(merged), #16953(open) | 同步本周实现、后续替代路径与候选边界，保留有效历史。 |
| [存储事件架构](../../feature/managed-agents/managed-agent-storage-event-architecture.md) | #16759(merged), #16788(merged), #16828(merged), #16837(open), #16840(merged), #16868(merged), #16922(merged), #16936(merged), #16953(open) | 同步本周实现、后续替代路径与候选边界，保留有效历史。 |
| [恢复与运维](../../feature/managed-agents/managed-agent-recovery-operations.md) | #16723(merged), #16758(merged), #16788(merged), #16826(merged), #16827(merged), #16828(merged), #16837(open), #16840(merged), #16868(merged), #16910(merged), #16922(merged), #16923(merged), #16928(merged), #16934(merged), #16936(merged), #16953(open) | 同步本周实现、后续替代路径与候选边界，保留有效历史。 |
| [配置与扩展](../../feature/managed-agents/managed-agent-config-extensions.md) | #16763(merged), #16882(merged) | 同步本周实现、后续替代路径与候选边界，保留有效历史。 |
| [自动任务与 Channels](../../feature/managed-agents/managed-agent-automation.md) | #16826(merged), #16827(merged) | 同步本周实现、后续替代路径与候选边界，保留有效历史。 |
| [客户端](../../feature/managed-agents/managed-agent-client-surfaces.md) | #16723(merged), #16758(merged) | 同步本周实现、后续替代路径与候选边界，保留有效历史。 |
| [SDK](../../feature/sdk.md) | #16758(merged) | 同步本周实现、后续替代路径与候选边界，保留有效历史。 |

_按个人 PR 口径更新于 2026-11-12；仅核 diff、changed files、主干和测试定义，未运行产品测试、CI、数据库、真实对象存储、浏览器或平台验收。_
