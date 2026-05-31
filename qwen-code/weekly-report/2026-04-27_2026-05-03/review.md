# qwen-code PR 审查 · 2026-04-27 ~ 2026-05-03 (W18)

**审查方法**：逐个 PR 拉取 _关联 issue + PR 描述 + 代码 diff_，核对 (1) 描述↔实现 **一致性**；(2) 描述 **准确性**；(3) 代码 **正确性**。评级：✅ 良好 / ⚠️ 有出入或小隐患 / ❌ 明显不符。大 PR（#3684、#3739）按文件分组抽样。#3779 关键结论已在本地 main 核验。

---

## 汇总

| PR | 状态 | 一致性 | 正确性 | 一句话 |
|---|---|---|---|---|
| [#3665](https://github.com/QwenLM/qwen-code/pull/3665) | merged | ✅ | ✅ | gitignore 加 .codex，最小正确 |
| [#3684](https://github.com/QwenLM/qwen-code/pull/3684) | merged | ✅ | ✅ | event monitor 工具：节流/生命周期/权限边界严谨 |
| [#3685](https://github.com/QwenLM/qwen-code/pull/3685) | merged | ✅ | ✅ | PyPI 发布流水线，供应链卫生扎实 |
| [#3703](https://github.com/QwenLM/qwen-code/pull/3703) | closed | ✅ | ✅ | squash auto-merge 修复，正确但被取代（关联 issue 已删） |
| [#3705](https://github.com/QwenLM/qwen-code/pull/3705) | merged | ✅ | ✅ | 保留 preview 版本覆盖，小而严谨（关联 issue 已删） |
| [#3726](https://github.com/QwenLM/qwen-code/pull/3726) | merged | ✅ | ✅ | Monitor 权限命名空间隔离干净 |
| [#3739](https://github.com/QwenLM/qwen-code/pull/3739) | merged | ✅ | ✅ | 后台 agent resume/continuation 状态处理严谨 |
| [#3779](https://github.com/QwenLM/qwen-code/pull/3779) | merged | ⚠️ | ⚠️ | OTLP 端点；getter 默认值使"自动接桥/跳过"成死代码 + 夹带越界重构 |
| [#3792](https://github.com/QwenLM/qwen-code/pull/3792) | merged | ✅ | ✅ | monitor + UI routing post-merge 清理，无回归 |
| [#3807](https://github.com/QwenLM/qwen-code/pull/3807) | merged | ✅ | ✅ | 关闭自动资源探测，定向消警告 |
| [#3813](https://github.com/QwenLM/qwen-code/pull/3813) | merged | ✅ | ✅ | 有界 shutdown 超时 + service.version 修正 |

**一致性**：✅10 / ⚠️1 / ❌0　　**正确性**：✅10 / ⚠️1 / ❌0

---

## 逐 PR 明细

### #3665 chore(gitignore): add .codex directory
- **状态**: merged | **关联 issue**: 无
- **一致性**: ✅ — diff 仅在 `# Editors` 段新增 `.codex`，与 body 完全相符。
- **描述准确性**: 准确。
- **正确性**: ✅ — 单行忽略规则，无风险。
- **结论**: 最小化正确改动。

### #3684 feat(core): event monitor tool with throttled stdout streaming (Phase C)
- **状态**: merged（37 文件 +6297，已采样核心源码）| **关联 issue**: 无 closing ref；Related #3634/#3666
- **一致性**: ✅ — Monitor 工具 + MonitorRegistry + sleep 拦截 + 权限 + CLI 接入均落地；body 声明不做的 footer pill/送信确不在文件列表，Phase-C 范围吻合。
- **描述准确性**: 准确详尽（含 tmux 验证）；唯 `monitor.ts:652` 成功消息引导用 `/tasks`，而 tasksCommand 由兄弟 PR 接线（前瞻措辞）。
- **正确性**: ✅ — 节流为 token-bucket（burst5/1s），超额行丢弃计入 `droppedLines` 而非缓冲；偏行缓冲受 `PARTIAL_LINE_BUFFER_CAP=4096` 截断——无背压/无界缓冲；`emitEvent` 在 maxEvents 先 settle 后 abort 防重复终态；权限非对称（Bash 规则覆盖 monitor，反之不覆盖）。
- **结论**: 高质量大型新功能，throttling/生命周期/权限边界设计严谨。

### #3685 feat(sdk-python): add PyPI release workflow
- **状态**: merged | **关联 issue**: 无
- **一致性**: ✅ — `release-sdk-python.yml` + `get-release-version.js` + `build:sdk:python` + CI 联动齐全。
- **描述准确性**: 准确（trusted publishing、stable/preview/nightly、smoke 门控）。
- **正确性**: ✅ — 供应链卫生扎实：PyPI OIDC Trusted Publishing 无长期 token；actions 全 SHA 钉死；`environment:production-release` 门控；ref 仅限 `refs/heads/main`；真实发布禁用 `force_skip_tests`。`getVersion` 符合 PEP440，含 yanked/三方冲突检测。
- **结论**: 工程化、安全的发布流水线，无实质缺陷。

### #3703 fix(ci): use squash auto-merge for sdk release pr
- **状态**: closed（未合入）| **关联 issue**: #3689（已删除，HTTP 410）
- **一致性**: ✅ — 把 `--merge` 改为 `--squash`，与 body 一致（附 `gh repo view` 证据仓库仅允许 squash）。
- **描述准确性**: 准确，根因/证据充分。
- **正确性**: ✅ — 改动正确；main 现已是 `--squash`，说明同等修复经他途落地。
- **结论**: 修复正确但被取代，关联 issue 已删无法回溯。

### #3705 fix(ci): preserve preview version overrides
- **状态**: merged | **关联 issue**: #3686（已删除，HTTP 410）
- **一致性**: ✅ — release.yml/release-sdk.yml 同步加 shell 规范化（preview 透传 / 派生 `-preview.0` / 其余 exit 1），main 已确认。
- **描述准确性**: 准确，含本地验证。
- **正确性**: ✅ — 正则先 strip `v` 再匹配，无边界缺陷。
- **结论**: 小而严谨的 CI 修复。

### #3726 feat(core): add Monitor(...) permission namespace
- **状态**: merged | **关联 issue**: 无（#3684 follow-up，review threads 8/10/11）
- **一致性**: ✅ — `rule-parser.ts` 加 Monitor 别名/SHELL_TOOL_NAMES/显示名映射，`permission-manager.ts` 抽 `SHELL_LIKE_TOOLS` 复用 4 路径，`monitor.ts` 改发 `Monitor(...)`，与描述表逐项吻合。
- **描述准确性**: 准确，含跨工具隔离回归测试。
- **正确性**: ✅ — `Bash(rm *)` deny 不再匹配 monitor（符合本 PR 意图的边界），但危险 monitor 命令仍由 `resolveDefaultPermission`（AST 只读判定）兜底 ask，非静默绕过。
- **结论**: 干净的权限命名空间隔离，实现与意图一致。

### #3739 Add background agent resume and continuation
- **状态**: merged | **关联 issue**: 无
- **一致性**: ✅ — `BackgroundAgentResumeService`、registry `paused` 态、transcript 记录/读回、resume 重跑 SubagentStart hook、并发 resume 合并、paused 分支均落实。
- **描述准确性**: 准确，含 transcript-first fork 恢复说明。
- **正确性**: ✅ — 并发 resume 合并无竞态（`resumeOperations` Map get/set 同步无 await）；消息无丢失窗口（复制→重注册为同步段）；transcript 经 `initialParentUuid=lastStableUuid` 分支 + 裁剪悬挂 tool-call 防损坏。轻微（非 bug）：同 sessionId 双开 CLI 理论可重复 resume（罕见）；夹带 ~215 行 shell.ts 后台操作符解析略偏题。
- **结论**: resume/continuation 状态处理严谨正确，仅少量边界/范围小瑕。

### #3779 feat(telemetry): define HTTP OTLP endpoint behavior and signal routing
- **状态**: merged | **关联 issue**: #3734（define HTTP OTLP endpoint behavior，CLOSED）
- **一致性**: ⚠️ — 头部功能（`resolveHttpOtlpUrl`、per-signal override、`LogToSpanProcessor`、`validateUrl`）齐全，但 diff 还夹带 #3734 明确划为范围外的改动：移除 sdk.ts 的 `process.on('SIGTERM'/'SIGINT'/'exit')`、新增 `installInteractiveSignalHandlers`、幂等 `telemetryShutdownPromise`、Config.cleanup 接管 shutdown、删 console exporter——body 只字未提。
- **描述准确性**: 头部特性准确；遗漏 shutdown/信号处理重构与 console-exporter 移除。
- **正确性**: ⚠️（已核验 `config.ts:3002`）— `getTelemetryOtlpEndpoint(): string|undefined` 实为 `?? DEFAULT_OTLP_ENDPOINT`，**永不返回 undefined**；故 `logsUrl` 恒有值，LogToSpanProcessor 的"traces 有/logs 无自动接桥"与 gRPC"无 base 跳过启动"分支在生产中均**不可达**（单测靠 mock getter 返回 `''` 才通过）。只设 traces override 时 logs 会被静默发往 `localhost:4317`。
- **结论**: per-signal override 主路径可用，但桥接特性因 getter 默认值成死代码；建议让 getter 真正返回 undefined，并把越界重构在描述中说明。

### #3792 fix(core): address post-merge monitor tool and UI routing issues
- **状态**: merged | **关联 issue**: 无（#3684 follow-up）
- **一致性**: ✅ — 时钟回拨守卫、AST 解析失败 `debugLogger.warn`、`SHELL_TOOL_NAMES` 导出为 `ReadonlySet` 复用、抽 `backgroundWorkUtils.ts`、共享 `routing.ts` 并补 VSCode `web_search` 别名，五项全落实。
- **描述准确性**: 准确细致。
- **正确性**: ✅ — `hasRunningEntries()` 存在（替换语义等价）；时钟回拨守卫只重置不补桶（符合注释，有测试）；`routing.ts` 八分支全覆盖。
- **结论**: 高质量 post-merge 清理，去重 + 修 bug + 补测试，无回归。

### #3807 fix(telemetry): suppress async resource attribute warning on startup
- **状态**: merged | **关联 issue**: #3731（父 tracking issue，OPEN，"Closes part of"）
- **一致性**: ✅ — 仅在 `NodeSDK` 构造加 `autoDetectResources:false` + 断言测试，与描述一致。
- **描述准确性**: 准确，root cause 分析合理。
- **正确性**: ✅ — `service.name/version`、`session.id` 已由 `resourceFromAttributes` 同步注入，禁用自动探测仅丢弃未被使用的 `host.*`/`process.*`，权衡已说明。
- **结论**: 两行定向修复，安全对症。

### #3813 fix(telemetry): add bounded shutdown timeout and fix service.version resource attribute
- **状态**: merged | **关联 issue**: #3811（CLOSED）
- **一致性**: ✅ — `Promise.race` 10s 超时 fail-open；`service.version` 由 `process.version` 改为 `config.getCliVersion() || 'unknown'`。
- **描述准确性**: 准确，21 用例。
- **正确性**: ✅ — 与 #3779 幂等 promise 整合正确：成功/catch 两路 `clearTimeout`，`finally` 复位全部状态；超时后真实 shutdown 后台 pending（进程将退，注释认可）属可接受 fail-open。
- **结论**: 正确解决 CLI 退出挂起与版本属性错误。

---

## 重点跟进清单

### Merged（代码 OK，建议跟进）
1. **#3779**（telemetry）：让 `getTelemetryOtlpEndpoint()` 真正返回 `undefined`（去掉 `?? DEFAULT_OTLP_ENDPOINT`），否则 LogToSpanProcessor 自动接桥 + "无 base 跳过"两个卖点在生产中是死代码；并在描述补回夹带的 shutdown/信号/console-exporter 重构。
2. **#3739**：记录"同 sessionId 双开 CLI 可能重复 resume"边界；shell.ts 后台操作符解析与主题略偏，后续可拆。
3. **关联 issue 卫生**：#3703/#3705 的 issue（#3689/#3686）已被删除，且多个 PR `closingIssuesReferences` 为空——建议关联前确认 issue 存在。

---

## 深挖补充（2026-05-31，来自 feature 深度文档）

> 写 `feature/telemetry-observability/01-sdk-init-and-otlp-routing.md` 时对本周 PR 的进一步核实。

- **#3779**（OTLP 路由）：精确定位"桥接死代码"——`getTelemetryOtlpEndpoint() ?? DEFAULT_OTLP_ENDPOINT` 使默认（grpc）下 `sdk.ts:289-314`（traces 有 / logs 无 → LogToSpan 自动接桥）与 `sdk.ts:323-330`（无 base 跳过启动）两分支**均不可达**，单测仅靠 `mockReturnValue('')` 才覆盖。修法仍是让 getter 真正返回 `undefined`。

_审查于 2026-05-30；方法：并行只读子代理逐 PR 拉取 issue+描述+diff，#3779 由主代理在本地 main 核验 getter。_
