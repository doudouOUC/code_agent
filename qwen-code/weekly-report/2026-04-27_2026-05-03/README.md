# qwen-code PRs · 2026-04-27 ~ 2026-05-03  (W18)

**主题**: monitor 工具 / Monitor 权限、background agent、telemetry OTLP 起步、sdk-python 发布 CI

**统计**: 11 PRs — 10 merged / 0 open / 1 closed
**代码量**: +14,853 / -698，130 个文件变更
**类型**: fix ×5, feat ×4, chore ×1, other ×1
**范围 (scope)**: core ×3, telemetry ×3, ci ×2, gitignore ×1, sdk-python ×1

**本周最大改动**:
- [#3684](https://github.com/QwenLM/qwen-code/pull/3684) (+6297/-147, 37 files) feat(core): event monitor tool with throttled stdout streaming (Phase C)
- [#3739](https://github.com/QwenLM/qwen-code/pull/3739) (+4087/-165, 40 files) Add background agent resume and continuation
- [#3685](https://github.com/QwenLM/qwen-code/pull/3685) (+2082/-32, 8 files) feat(sdk-python): add PyPI release workflow

| PR | 状态 | 类型 | 标题 | 变更 | 文件 | 创建 | 合并/关闭 | 链接 |
|---|---|---|---|---|---|---|---|---|
| #3665 | ✅ merged | chore(gitignore) | chore(gitignore): add .codex directory | +1/-0 | 1 | 04-27 | 04-27 | https://github.com/QwenLM/qwen-code/pull/3665 |
| #3684 | ✅ merged | feat(core) | feat(core): event monitor tool with throttled stdout streaming (Phase C) _[type/feature-request, TBD]_ | +6297/-147 | 37 | 04-28 | 05-02 | https://github.com/QwenLM/qwen-code/pull/3684 |
| #3685 | ✅ merged | feat(sdk-python) | feat(sdk-python): add PyPI release workflow | +2082/-32 | 8 | 04-28 | 05-04 | https://github.com/QwenLM/qwen-code/pull/3685 |
| #3703 | ⬜ closed | fix(ci) | fix(ci): use squash auto-merge for sdk release pr | +1/-1 | 1 | 04-28 | 04-28 | https://github.com/QwenLM/qwen-code/pull/3703 |
| #3705 | ✅ merged | fix(ci) | fix(ci): preserve preview version overrides _[type/bug, category/development]_ | +22/-6 | 2 | 04-28 | 04-28 | https://github.com/QwenLM/qwen-code/pull/3705 |
| #3726 | ✅ merged | feat(core) | feat(core): add Monitor(...) permission namespace | +169/-15 | 5 | 04-29 | 04-29 | https://github.com/QwenLM/qwen-code/pull/3726 |
| #3739 | ✅ merged | other | Add background agent resume and continuation | +4087/-165 | 40 | 04-29 | 05-01 | https://github.com/QwenLM/qwen-code/pull/3739 |
| #3779 | ✅ merged | feat(telemetry) | feat(telemetry): define HTTP OTLP endpoint behavior and signal routing | +1387/-102 | 11 | 05-01 | 05-01 | https://github.com/QwenLM/qwen-code/pull/3779 |
| #3792 | ✅ merged | fix(core) | fix(core): address post-merge monitor tool and UI routing issues | +664/-227 | 21 | 05-02 | 05-04 | https://github.com/QwenLM/qwen-code/pull/3792 |
| #3807 | ✅ merged | fix(telemetry) | fix(telemetry): suppress async resource attribute warning on startup | +13/-0 | 2 | 05-03 | 05-03 | https://github.com/QwenLM/qwen-code/pull/3807 |
| #3813 | ✅ merged | fix(telemetry) | fix(telemetry): add bounded shutdown timeout and fix service.version resource attribute | +130/-3 | 2 | 05-03 | 05-05 | https://github.com/QwenLM/qwen-code/pull/3813 |

---

## PR 解决问题与实现方式

> 来源：同目录 `review.md` 的逐 PR diff 审查，结合 PR 状态与标题压缩成“解决了什么问题 / 怎么做的”。open/closed PR 只记录当前观察，不写成已落地实现。

| PR | 解决了什么问题 | 怎么做的 |
|---|---|---|
| [#3665](https://github.com/QwenLM/qwen-code/pull/3665) | gitignore 加 .codex，最小正确 | diff 仅在 `# Editors` 段新增 `.codex`，与 body 完全相符。 单行忽略规则，无风险。 |
| [#3684](https://github.com/QwenLM/qwen-code/pull/3684) | event monitor 工具：节流/生命周期/权限边界严谨 | Monitor 工具 + MonitorRegistry + sleep 拦截 + 权限 + CLI 接入均落地；body 声明不做的 footer pill/送信确不在文件列表，Phase-C 范围吻合。节流为 token-bucket（burst5/1s），超额行丢弃计入 `droppedLines` 而非缓冲；偏行缓冲受 `PARTIAL_LINE_BUFFER_CAP=4096` 截断——无背压/无界缓冲； |
| [#3685](https://github.com/QwenLM/qwen-code/pull/3685) | PyPI 发布流水线，供应链卫生扎实 | `release-sdk-python.yml` + `get-release-version.js` + `build:sdk:python` + CI 联动齐全。供应链卫生扎实：PyPI OIDC Trusted Publishing 无长期 token；actions 全 SHA 钉死；`environment:production-release` 门控；ref 仅限 `refs/heads/main`；真实发布禁用 `force_skip_tests`。 |
| [#3703](https://github.com/QwenLM/qwen-code/pull/3703) | 未作为已落地实现；squash auto-merge 修复，正确但被取代（关联 issue 已删）。 | 把 `--merge` 改为 `--squash`，与 body 一致（附 `gh repo view` 证据仓库仅允许 squash）。 改动正确；main 现已是 `--squash`，说明同等修复经他途落地。 |
| [#3705](https://github.com/QwenLM/qwen-code/pull/3705) | 保留 preview 版本覆盖，小而严谨（关联 issue 已删） | release.yml/release-sdk.yml 同步加 shell 规范化（preview 透传 / 派生 `-preview.0` / 其余 exit 1），main 已确认。 正则先 strip `v` 再匹配，无边界缺陷。 |
| [#3726](https://github.com/QwenLM/qwen-code/pull/3726) | Monitor 权限命名空间隔离干净 | `rule-parser.ts` 加 Monitor 别名/SHELL_TOOL_NAMES/显示名映射，`permission-manager.ts` 抽 `SHELL_LIKE_TOOLS` 复用 4 路径，`monitor.ts` 改发 `Monitor(...)`，与描述表逐项吻合。 |
| [#3739](https://github.com/QwenLM/qwen-code/pull/3739) | 后台 agent resume/continuation 状态处理严谨 | `BackgroundAgentResumeService`、registry `paused` 态、transcript 记录/读回、resume 重跑 SubagentStart hook、并发 resume 合并、paused 分支均落实。并发 resume 合并无竞态（`resumeOperations` Map get/set 同步无 await）；消息无丢失窗口（复制→重注册为同步段）； |
| [#3779](https://github.com/QwenLM/qwen-code/pull/3779) | OTLP 端点；getter 默认值使"自动接桥/跳过"成死代码 + 夹带越界重构 | 头部功能（`resolveHttpOtlpUrl`、per-signal override、`LogToSpanProcessor`、`validateUrl`）齐全，但 diff 还夹带 #3734 明确划为范围外的改动：移除 sdk.ts 的 `process.on('SIGTERM'/'SIGINT'/'exit')`、新增 `installInteractiveSignalHandlers`、幂等 `telemetryShutdownPromise`、Config.… |
| [#3792](https://github.com/QwenLM/qwen-code/pull/3792) | monitor + UI routing post-merge 清理，无回归 | 时钟回拨守卫、AST 解析失败 `debugLogger.warn`、`SHELL_TOOL_NAMES` 导出为 `ReadonlySet` 复用、抽 `backgroundWorkUtils.ts`、共享 `routing.ts` 并补 VSCode `web_search` 别名，五项全落实。 `hasRunningEntries()` 存在（替换语义等价）；时钟回拨守卫只重置不补桶（符合注释，有测试）；`routing.ts` 八分支全覆盖。 |
| [#3807](https://github.com/QwenLM/qwen-code/pull/3807) | 关闭自动资源探测，定向消警告 | 仅在 `NodeSDK` 构造加 `autoDetectResources:false` + 断言测试，与描述一致。 `service.name/version`、`session.id` 已由 `resourceFromAttributes` 同步注入，禁用自动探测仅丢弃未被使用的 `host.*`/`process.*`，权衡已说明。 |
| [#3813](https://github.com/QwenLM/qwen-code/pull/3813) | 有界 shutdown 超时 + service.version 修正 | `Promise.race` 10s 超时 fail-open；`service.version` 由 `process.version` 改为优先 `config.getCliVersion()`、空值回退 `unknown`。 与 #3779 幂等 promise 整合正确：成功/catch 两路 `clearTimeout`，`finally` 复位全部状态；超时后真实 shutdown 后台 pending（进程将退，注释认可）属可接受 fail-open。 |
