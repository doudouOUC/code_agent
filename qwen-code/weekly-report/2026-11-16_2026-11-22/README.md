# qwen-code PRs · 2026-11-16 ~ 2026-11-22 (W47 日更至 11-18)

> 本次日更新增北京时间 2026-11-18 00:00:00 至 23:59:59 创建的 @doudouOUC 个人 PR，UTC 窗口 `[2026-11-17T16:00:00Z, 2026-11-18T16:00:00Z)`，新增4个；本周累计独立分页核验 author 与 createdAt 窗口 `[2026-11-15T16:00:00Z, 2026-11-18T16:00:00Z)` 的20个，尚非完整周报。不按更新/关闭/合入时间补收其他周或其他作者，不移动原创建周。状态、规模与 head 为北京时间 2026-11-19 凌晨快照，对照 main `164bb1eb58bb`。#17450 仅合入 `stack/17247-external-content-base`，不在 main；18 merged 含该项，主干已合入17个，其中 #17527 仅设计文档。#17449/#17690 为当前 open diff，不能作为 main 能力承诺。

**主题**: worktree restore 最终修正、park continue/退役通知/等待老化与默认 Skills 已合；idle suspension Phase 1 仍候选

**PR 统计**: 20 PRs - 18 merged / 2 open / 0 closed
**当前已合并 PR 代码量**: +16,547 / -8,324，651 个文件变更
**全量代码量**: +40,984 / -19,471，749 个文件变更
**类型分布**: refactor ×4, fix ×8, feat ×6, chore ×1, docs ×1
**范围 (scope)**: managed-agent ×16, serve ×2, unscoped ×1, design ×1

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 代码量 | 文件数 | 创建时间(UTC) | 合并/关闭时间(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#17415](https://github.com/QwenLM/qwen-code/pull/17415) | merged | @doudouOUC | refactor(managed-agent): archive Kubernetes runtime and resident CSI backend | +1534/-6374 | 338 | 2026-11-16 04:44:20 | 2026-11-16 08:13:25 |
| [#17439](https://github.com/QwenLM/qwen-code/pull/17439) | merged | @doudouOUC | fix(serve): accept hook description and statusMessage during extension preparation | +507/-3 | 5 | 2026-11-16 09:01:32 | 2026-11-16 12:46:00 |
| [#17449](https://github.com/QwenLM/qwen-code/pull/17449) | open | @doudouOUC | feat(managed-agent): Public API parity (slice 4a) and Web Shell consumer migration (slice 4b) | +21613/-11070 | 71 | 2026-11-16 10:49:37 | - |
| [#17450](https://github.com/QwenLM/qwen-code/pull/17450) | merged | @doudouOUC | feat(managed-agent): Support external content child agents | +3699/-253 | 93 | 2026-11-16 11:12:56 | 2026-11-16 15:08:05 |
| [#17457](https://github.com/QwenLM/qwen-code/pull/17457) | merged | @doudouOUC | fix(managed-agent): Wait for workspace preparation before turn admission | +886/-39 | 8 | 2026-11-16 11:51:15 | 2026-11-16 12:43:52 |
| [#17459](https://github.com/QwenLM/qwen-code/pull/17459) | merged | @doudouOUC | fix(managed-agent): recover timed-out hosted journal commits | +849/-52 | 16 | 2026-11-16 12:02:16 | 2026-11-16 20:19:47 |
| [#17466](https://github.com/QwenLM/qwen-code/pull/17466) | merged | @doudouOUC | fix(managed-agent): recover macOS workspaces after reboot | +1530/-104 | 28 | 2026-11-16 13:42:44 | 2026-11-16 18:21:45 |
| [#17480](https://github.com/QwenLM/qwen-code/pull/17480) | merged | @doudouOUC | fix(managed-agent): resolve shared workspace owners for extension control | +133/-5 | 3 | 2026-11-16 15:28:12 | 2026-11-16 16:42:12 |
| [#17507](https://github.com/QwenLM/qwen-code/pull/17507) | merged | @doudouOUC | chore(managed-agent): deduplicate verification Failsafe profiles and land #17139 follow-ups | +126/-208 | 9 | 2026-11-17 02:44:03 | 2026-11-17 05:29:13 |
| [#17508](https://github.com/QwenLM/qwen-code/pull/17508) | merged | @doudouOUC | refactor(managed-agent): unify coordinator dispatch deduplication and lease renewal | +392/-225 | 10 | 2026-11-17 02:44:19 | 2026-11-17 03:33:28 |
| [#17509](https://github.com/QwenLM/qwen-code/pull/17509) | merged | @doudouOUC | refactor(managed-agent): replace regex DDL catalog parsing with a tokenizing parser | +720/-131 | 5 | 2026-11-17 02:44:33 | 2026-11-17 03:42:36 |
| [#17510](https://github.com/QwenLM/qwen-code/pull/17510) | merged | @doudouOUC | refactor(managed-agent): require canonical Broker URLs at the preflight and Harness entry | +467/-452 | 15 | 2026-11-17 02:44:44 | 2026-11-17 09:31:12 |
| [#17513](https://github.com/QwenLM/qwen-code/pull/17513) | merged | @doudouOUC | feat: add qwen4-max support with native effort ladder, cache TTL, and image detail | +1297/-81 | 34 | 2026-11-17 03:29:45 | 2026-11-17 09:24:42 |
| [#17521](https://github.com/QwenLM/qwen-code/pull/17521) | merged | @doudouOUC | fix(managed-agent): recover vanished Harness admissions safely | +942/-119 | 11 | 2026-11-17 05:59:58 | 2026-11-17 14:47:39 |
| [#17527](https://github.com/QwenLM/qwen-code/pull/17527) | merged | @doudouOUC | docs(design): propose idle Session suspension toward a stateless Hosted Harness | +642/-0 | 4 | 2026-11-17 07:13:05 | 2026-11-17 11:27:33 |
| [#17654](https://github.com/QwenLM/qwen-code/pull/17654) | merged | @doudouOUC | fix(serve): Prevent automatic work from blocking worktree restore | +989/-114 | 19 | 2026-11-17 14:33:19 | 2026-11-18 05:54:57 |
| [#17680](https://github.com/QwenLM/qwen-code/pull/17680) | merged | @doudouOUC | fix(managed-agent): drive continuation-ready parks in the epoch-less resubmission arm | +205/-5 | 2 | 2026-11-18 02:40:14 | 2026-11-18 04:02:18 |
| [#17681](https://github.com/QwenLM/qwen-code/pull/17681) | merged | @doudouOUC | feat(managed-agent): notify attachment retirement and age out suspension waits | +485/-61 | 16 | 2026-11-18 02:40:23 | 2026-11-18 04:54:43 |
| [#17690](https://github.com/QwenLM/qwen-code/pull/17690) | open | @doudouOUC | feat(managed-agent): implement stateless Hosted Harness phase 1 idle suspension | +2824/-77 | 27 | 2026-11-18 05:20:40 | - |
| [#17703](https://github.com/QwenLM/qwen-code/pull/17703) | merged | @doudouOUC | feat(managed-agent): Discover and pin default workspace Skills | +1144/-98 | 35 | 2026-11-18 08:59:16 | 2026-11-18 11:01:12 |

---

## PR 解决问题、实现方式与 feature 处理

| PR | 解决了什么问题 | 最终怎么实现（open/closed 只登记当前观察） | 对应 feature 文档 |
|---|---|---|---|
| [#17415](https://github.com/QwenLM/qwen-code/pull/17415) | Kubernetes Runtime、Resident Workspace/CSI 与 EndpointSlice Harness discovery 混在日常 Java reactor 内，使 local/SSH/external/static 部署也承担专属配置、schema 字段和锁/验证路径维护成本。 | 已合入：Java 后端、CSI/resident 与发现器移冷归档，活动 V1 去专属字段，通用校验留活动模块。 | 更新Feature 总览、Managed Agents、Session 存储、存储事件架构、恢复与运维、配置与扩展；完整实现/观察见 [implementations/pr-17415.md](implementations/pr-17415.md)。 |
| [#17439](https://github.com/QwenLM/qwen-code/pull/17439) | 合法扩展的 hook description/statusMessage 被 worker 的闭集 parser 当未知字段拒绝，HTTP hook 的 if 条件也被挡在准备阶段，导致包无法完成预备。 | 已合入：闭集接受字符串展示元数据与 HTTP if；公开 control view 仍裁剪私有字段。 | 更新Feature 总览、Managed Agents、配置与扩展；完整实现/观察见 [implementations/pr-17439.md](implementations/pr-17439.md)。 |
| [#17449](https://github.com/QwenLM/qwen-code/pull/17449) | Web Shell 依赖独立 camelCase 私有路由和生成类型，Public API 缺模型/审批/能力、文件和 transcript 等 UI 所需形状，双契约持续漂移。 | 当前 open diff：补 Public wire/能力与路由、迁移 Web Shell adapter/类型和代理；保留兼容入口。 | 更新Feature 总览、Managed Agents、客户端；完整实现/观察见 [implementations/pr-17449.md](implementations/pr-17449.md)。 |
| [#17450](https://github.com/QwenLM/qwen-code/pull/17450) | 外部文件 Workspace 原只支持普通文件任务，无法在保持原外部执行 actor 与受限工具面的同时提供持久、可恢复的公开子 Agent 和内容扩展包。 | 仅功能分支 merged：默认关闭的外部 content profile、精确资源闭包与原 writer/config/父子 actor 授权；未在 main。 | 更新Feature 总览、Managed Agents、配置与扩展、Session 存储、存储事件架构、客户端、恢复与运维；完整实现/观察见 [implementations/pr-17450.md](implementations/pr-17450.md)。 |
| [#17457](https://github.com/QwenLM/qwen-code/pull/17457) | Runtime warm 原是 fire-and-forget，首次 Workspace 较慢时 Harness load 先遭拒绝，消耗 Turn pre-admission retry，可能在环境尚未就绪时过早失败。 | 已合入：准入前等待准备，预算内重试并持续核取消/失租，不取消共享 warm。 | 更新Feature 总览、Managed Agents、恢复与运维、存储事件架构；完整实现/观察见 [implementations/pr-17457.md](implementations/pr-17457.md)。 |
| [#17459](https://github.com/QwenLM/qwen-code/pull/17459) | append 丢答后仅看 head 未变化并不能证明原事务没提交，直接丢批次或重新编码会与迟到提交冲突，把本可恢复的 writer 永久 fence。 | 已合入：保存精确 append records，settle 后原字节复投，区分未知、确定拒绝和永久失败。 | 更新Feature 总览、Managed Agents、Session 存储、恢复与运维、存储事件架构；完整实现/观察见 [implementations/pr-17459.md](implementations/pr-17459.md)。 |
| [#17466](https://github.com/QwenLM/qwen-code/pull/17466) | macOS 的设备号可能跨重启变化，原 numeric dev 身份和被排除的 reboot 判定使未移动的 Workspace/worktree 也被当成变更或无法回收旧 Runtime。 | 已合入：VolumeUUID 稳定身份与显式离线 plan/fence/retire/complete，拒自动绕校验。 | 更新Feature 总览、Managed Agents、恢复与运维、Session 存储；完整实现/观察见 [implementations/pr-17466.md](implementations/pr-17466.md)。 |
| [#17480](https://github.com/QwenLM/qwen-code/pull/17480) | findByHarnessSession 只适用于 session-isolated binding；共享 Workspace 没有 Harness isolation key，identity-free extension status 因此查不到原 READY owner。 | 已合入：共享 scope 按完整 request slot 找原 READY owner，保身份/drain 围栏且不创建 Runtime。 | 更新Feature 总览、Managed Agents、配置与扩展、恢复与运维、存储事件架构；完整实现/观察见 [implementations/pr-17480.md](implementations/pr-17480.md)。 |
| [#17507](https://github.com/QwenLM/qwen-code/pull/17507) | 十余个验证 profile 重复声明相同 Failsafe 版本和执行目标，容易漂移；嵌入宿主还需防止专用调度器成为默认候选，发布 gate 也不能被跳过 Javadoc 或忽略错误绕开。 | 已合入：共享 Failsafe execution，保 profile 选择器，补专用 Bean 与发布 gate 断言。 | 更新Feature 总览、Managed Agents、恢复与运维；完整实现/观察见 [implementations/pr-17507.md](implementations/pr-17507.md)。 |
| [#17508](https://github.com/QwenLM/qwen-code/pull/17508) | Turn、lifecycle、action response、取消与 worktree 服务各自维护 active 集合和续租线程，重复代码的提交失败清理、失租标记与关闭行为容易分叉。 | 已合入：实例内 dispatchOnce 与可关闭续租句柄，SQL fencing 仍由调用方负责。 | 更新Feature 总览、Managed Agents、存储事件架构、恢复与运维；完整实现/观察见 [implementations/pr-17508.md](implementations/pr-17508.md)。 |
| [#17509](https://github.com/QwenLM/qwen-code/pull/17509) | 按行缩进/正则提取 V1 DDL 会把多行列、generated/check 表达式或注释中的分号/逗号错误切开，使合法格式调整破坏初始化和 catalog 校验。 | 已合入：结构化 tokenizer 共用 splitter，保 catalog 严格拒绝；非 schema 升级。 | 更新Feature 总览、Managed Agents、Session 存储、存储事件架构；完整实现/观察见 [implementations/pr-17509.md](implementations/pr-17509.md)。 |
| [#17510](https://github.com/QwenLM/qwen-code/pull/17510) | Java 模拟 WHATWG 宽松 URL 归一化既复杂又容易与 Node 分叉，非标准 IPv4、空端口或 dot path 可在预检和实际启动得到不同判定。 | 已合入：两端与 launcher 限 canonical origin，保 HTTP loopback；不是通用 SSRF 方案。 | 更新Feature 总览、Managed Agents、配置与扩展、恢复与运维；完整实现/观察见 [implementations/pr-17510.md](implementations/pr-17510.md)。 |
| [#17513](https://github.com/QwenLM/qwen-code/pull/17513) | 仅按旧 Qwen 默认值接入 qwen4-max 会暴露错误 effort 档位、压低 thinking 输出预算，关闭 thinking 又可能发送超限 token；缓存保留与图片细节还缺完整配置透传。 | 已合入：原生 effort 与预算、qwen4 DashScope TTL、image detail；真实 provider 未验收。 | 更新Feature 总览、模型与 Provider；完整实现/观察见 [implementations/pr-17513.md](implementations/pr-17513.md)。 |
| [#17521](https://github.com/QwenLM/qwen-code/pull/17521) | 缓存 attachment 指向已被 Harness 移除的 Session 时，合法准入会重复命中 coded 404；旧引用清理还可能删掉并发新 attachment 的 recovery marker，导致后续恢复丢快照。 | 已合入：coded404 按引用清缓存，准入单次恢复/pool 重选，Turn 重入绑定与快照。 | 更新Feature 总览、Managed Agents、恢复与运维、存储事件架构；完整实现/观察见 [implementations/pr-17521.md](implementations/pr-17521.md)。 |
| [#17527](https://github.com/QwenLM/qwen-code/pull/17527) | 常驻 idle Session 持续续租、占内存与 MCP/Hook owner；直接复用 detach 又会终结输入，不能把关闭流程当可逆的暂停。 | 仅设计文档合入：提出 idle suspension/失败 gate 与四阶段边界，未启运行时能力。 | 更新Feature 总览、Managed Agents、存储事件架构、恢复与运维；完整实现/观察见 [implementations/pr-17527.md](implementations/pr-17527.md)。 |
| [#17654](https://github.com/QwenLM/qwen-code/pull/17654) | 恢复持久 worktree Session 时，cron/goal/notification 在 cwd relocation 前先启动会使恢复被 active work 阻塞，或在旧目录执行；AUQ 恢复还需保工具调用与回答相邻。 | 已合入：strict sidecar 锁下判定，可信 ACP hold，成功 cwd 后释放与统一 scheduled restore；非 Channel 仍修 marker/notice。 | 更新Feature 总览、daemon 总览、daemon 会话生命周期；完整实现/观察见 [implementations/pr-17654.md](implementations/pr-17654.md)。 |
| [#17680](https://github.com/QwenLM/qwen-code/pull/17680) | 曾发出 submit 但尚未绑定 event epoch 的 Turn，重提交遇到已准入/需恢复的 coded 409 后，即使 attach 带回 continuation-ready park，旧分支也只开 stream；这不会驱动 continue，Turn 因而停在可恢复点。 | 已合入：epoch-less 恢复的 ready park 明确 continue，守 lease/水位并阻塞 workflow 重跑。 | 更新Feature 总览、Managed Agents、存储事件架构、恢复与运维；完整实现/观察见 [implementations/pr-17680.md](implementations/pr-17680.md)。 |
| [#17681](https://github.com/QwenLM/qwen-code/pull/17681) | Java SDK 心跳确认 attachment 消失后，控制面独立缓存仍可能留旧引用；closing/cold-open/pool 等暂态等待若永远豁免预算，Turn 会无进展地无限重试，teardown 阻塞还可能丢失原错误码。 | 已合入：SDK 退役精确引用通知与两缓存清理，暂态分类和等待老化保错误码。 | 更新Feature 总览、Managed Agents、存储事件架构、恢复与运维、SDK；完整实现/观察见 [implementations/pr-17681.md](implementations/pr-17681.md)。 |
| [#17690](https://github.com/QwenLM/qwen-code/pull/17690) | idle Hosted Session 持续占 writer/activation 续租、内存和 Runtime owner；直接 detach 会终结输入，缓存缺失也不能证明恢复已就绪。需要保 durable obligations 的非终态暂停与可审计的冷开恢复。 | 当前 open diff：idle gate/非终态 teardown/冷开、候选租约界自动清理与 durable recovery view；未在 main。 | 更新Feature 总览、Managed Agents、存储事件架构、恢复与运维、Session 存储；完整实现/观察见 [implementations/pr-17690.md](implementations/pr-17690.md)。 |
| [#17703](https://github.com/QwenLM/qwen-code/pull/17703) | 业务来源缺少默认 Skill 发现协议，创建 Session 只能靠显式选择；直接动态读来源又会让撤权/版本变动污染已受理请求，自动导入包还可能意外暴露在 Workspace 显式目录中。 | 已合入：授权发现默认 Skill→原不可变发布→创建 receipt pin；隐藏默认 revision，按已安装配置读目录。 | 更新Feature 总览、Managed Agents、配置与扩展、Session 存储、客户端；完整实现/观察见 [implementations/pr-17703.md](implementations/pr-17703.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [Feature 总览](../../feature/README.md) | #17415(merged), #17439(merged), #17449(open), #17450(merged), #17457(merged), #17459(merged), #17466(merged), #17480(merged), #17507(merged), #17508(merged), #17509(merged), #17510(merged), #17513(merged), #17521(merged), #17527(merged), #17654(merged), #17680(merged), #17681(merged), #17690(open), #17703(merged) | 按最终 diff 与新 main 复核，保留有效历史；open/设计/功能分支单列边界。 |
| [Managed Agents](../../feature/managed-agents/README.md) | #17415(merged), #17439(merged), #17449(open), #17450(merged), #17457(merged), #17459(merged), #17466(merged), #17480(merged), #17507(merged), #17508(merged), #17509(merged), #17510(merged), #17521(merged), #17527(merged), #17680(merged), #17681(merged), #17690(open), #17703(merged) | 按最终 diff 与新 main 复核，保留有效历史；open/设计/功能分支单列边界。 |
| [Session 存储](../../feature/managed-agents/managed-agent-session-storage.md) | #17415(merged), #17450(merged), #17459(merged), #17466(merged), #17509(merged), #17690(open), #17703(merged) | 按最终 diff 与新 main 复核，保留有效历史；open/设计/功能分支单列边界。 |
| [存储事件架构](../../feature/managed-agents/managed-agent-storage-event-architecture.md) | #17415(merged), #17450(merged), #17457(merged), #17459(merged), #17480(merged), #17508(merged), #17509(merged), #17521(merged), #17527(merged), #17680(merged), #17681(merged), #17690(open) | 按最终 diff 与新 main 复核，保留有效历史；open/设计/功能分支单列边界。 |
| [恢复与运维](../../feature/managed-agents/managed-agent-recovery-operations.md) | #17415(merged), #17450(merged), #17457(merged), #17459(merged), #17466(merged), #17480(merged), #17507(merged), #17508(merged), #17510(merged), #17521(merged), #17527(merged), #17680(merged), #17681(merged), #17690(open) | 按最终 diff 与新 main 复核，保留有效历史；open/设计/功能分支单列边界。 |
| [配置与扩展](../../feature/managed-agents/managed-agent-config-extensions.md) | #17415(merged), #17439(merged), #17450(merged), #17480(merged), #17510(merged), #17703(merged) | 按最终 diff 与新 main 复核，保留有效历史；open/设计/功能分支单列边界。 |
| [客户端](../../feature/managed-agents/managed-agent-client-surfaces.md) | #17449(open), #17450(merged), #17703(merged) | 按最终 diff 与新 main 复核，保留有效历史；open/设计/功能分支单列边界。 |
| [模型与 Provider](../../feature/auth-providers.md) | #17513(merged) | 按最终 diff 与新 main 复核，保留有效历史；open/设计/功能分支单列边界。 |
| [daemon 总览](../../feature/daemon-serve-mode/README.md) | #17654(merged) | 按最终 diff 与新 main 复核，保留有效历史；open/设计/功能分支单列边界。 |
| [daemon 会话生命周期](../../feature/daemon-serve-mode/03-session-lifecycle.md) | #17654(merged) | 按最终 diff 与新 main 复核，保留有效历史；open/设计/功能分支单列边界。 |
| [SDK](../../feature/sdk.md) | #17681(merged) | 按最终 diff 与新 main 复核，保留有效历史；open/设计/功能分支单列边界。 |

_按个人 PR 口径更新于 2026-11-19；本次只核静态文档、diff、完整文件、源码与测试定义，未运行产品测试、CI、数据库、Hosted、业务 provider 或浏览器验收。_
