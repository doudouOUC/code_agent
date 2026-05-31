# qwen-code PR 审查 · 2026-04-13 ~ 2026-04-19 (W16)

**审查方法**：逐个 PR 拉取 _关联 issue + PR 描述 + 代码 diff_，核对 (1) 描述↔实现 **一致性**；(2) 描述 **准确性**；(3) 代码 **正确性**。评级：✅ 良好 / ⚠️ 有出入或小隐患 / ❌ 明显不符。

---

## 汇总

| PR | 状态 | 一致性 | 正确性 | 一句话 |
|---|---|---|---|---|
| [#3212](https://github.com/QwenLM/qwen-code/pull/3212) | merged | ✅ | ✅ | 最小精准的 gemini baseUrl 修复 |
| [#3232](https://github.com/QwenLM/qwen-code/pull/3232) | merged | ✅ | ⚠️ | 启动 profiler；仅 SANDBOX 下启用，默认场景无输出 |
| [#3297](https://github.com/QwenLM/qwen-code/pull/3297) | merged | ⚠️ | ✅ | 并发去重逻辑扎实；但"懒加载"无启动收益、bug 叙述夸大 |
| [#3318](https://github.com/QwenLM/qwen-code/pull/3318) | merged | ✅ | ✅ | API 预连接稳健；"代理即跳过"为过时说法 |
| [#3319](https://github.com/QwenLM/qwen-code/pull/3319) | merged | ✅ | ✅ | early input capture 严谨，测试充分 |
| [#3404](https://github.com/QwenLM/qwen-code/pull/3404) | merged | ⚠️ | ⚠️ | /doctor 实用；漏 issue 要求的检查 + Node 阈值 bug（现已修） |
| [#3407](https://github.com/QwenLM/qwen-code/pull/3407) | merged | ✅ | ✅ | 干净的数字键自动提交；issue 绑定稍松 |
| [#3441](https://github.com/QwenLM/qwen-code/pull/3441) | merged | ✅ | ✅ | 旗舰 rewind 功能，核心健壮；守卫不一致+文档小瑕 |

**一致性**：✅6 / ⚠️2 / ❌0　　**正确性**：✅6 / ⚠️2 / ❌0

---

## 逐 PR 明细

### #3212 fix(core): respect custom Gemini baseUrl from modelProviders
- **状态**: merged | **关联 issue**: #3166（gemini provider 自定义 baseUrl 被忽略）
- **一致性**: ✅ — 在 `createGeminiContentGenerator` 按描述把 `config.baseUrl` 注入 `httpOptions`，仅在配置时添加，headers 不变。
- **描述准确性**: 准确；root cause（只透传 headers、丢弃 baseUrl）与 issue 自带源码定位一致。
- **正确性**: ✅ — `config.baseUrl ? {headers,baseUrl} : {headers}` 干净，避免写 `undefined`；两路径均有回归测试。
- **结论**: 最小且精准的 bug 修复，与 issue 一一对应。

### #3232 feat(cli): add startup performance profiler
- **状态**: merged | **关联 issue**: #3219（启动 profiler），parent #3011
- **一致性**: ✅ — profiler + 7 个 checkpoint + 写 `~/.qwen/startup-perf/` JSON，与描述吻合。
- **描述准确性**: 基本准确。
- **正确性**: ⚠️ — (1) `initStartupProfiler` 仅在 `SANDBOX` 存在时启用（并由测试固化）；sandbox 关闭（常见默认）时设 `QWEN_CODE_PROFILE_STARTUP=1` 不产出报告，削弱"度量生产启动"目标。(2) `index.ts` 注释"must run before any other imports"不严谨——ESM hoisting 会先求值 import 再执行，靠 `processUptimeAtT0Ms` 补盲。无崩溃。
- **结论**: 实现稳健、测试充分，但 SANDBOX 门槛限制了实际可用范围。

### #3297 fix(tool-registry): add lazy factory registration with inflight concurrency dedup
- **状态**: merged | **关联 issue**: #3221（工具懒加载），parent #3011
- **一致性**: ⚠️ — 确实新增 lazy factory + inflight 去重，但 `Config.initialize()` 调用 `warmAll({strict:true})`（config.ts:1561）在启动期一次性加载全部工具，故 #3221 核心验收（"首次使用才实例化""init 降 30%+"）未达成（PR 已坦诚说明）。
- **描述准确性**: dedup/stop/缓存清理描述准确；但把它定性为修复"原有 ensureTool 的 P0 并发 bug"误导——相关代码均为本 PR 净新增，线上并无旧 `ensureTool`。
- **正确性**: ✅ — `ensureTool` 在缓存/inflight 检查与 `inflight.set` 间无 `await`，并发共享同一 promise，factory 只跑一次；失败清 inflight 保留 factory 可重试；`stop()` 先 `await Promise.allSettled(inflight)` 再 dispose。未见 double-init/漏 reject。
- **结论**: 并发逻辑扎实正确，但当前"懒加载"无启动收益且 bug 修复叙述夸大。

### #3318 feat(cli): add API preconnect to reduce first-call latency
- **状态**: merged | **关联 issue**: #3223（API 预连接），关联拆分 PR #3085
- **一致性**: ✅ — fire-and-forget HEAD 预连接 + 共享 undici dispatcher + 多项跳过条件，与描述一致。
- **描述准确性**: 大体准确，但"Smart skip: Proxy env vars set"不实——`shouldSkipPreconnect()` 仅检查 `NODE_EXTRA_CA_CERTS`；代理不跳过，而经 `getOrCreateSharedDispatcher(proxy)` 隧道复用。
- **正确性**: ✅ — `isDefaultBaseUrl` 用 `startsWith(default+'/')` 正确拒绝子域伪造；`preconnectFired` 守卫 + 无目标时允许重试；`AbortSignal.timeout(5s)` 限定生命周期。注：共享 dispatcher 新增 `keepAliveTimeout:60s` 也作用于 SDK（良性行为变更）；自测省 55–90ms，低于 issue 100ms+ 目标。
- **结论**: 实现稳健、测试覆盖全面，仅"代理即跳过"为过时说法。

### #3319 feat(cli): add early input capture to prevent keystroke loss during startup
- **状态**: merged | **关联 issue**: #3224（[P2] Early input capture during REPL init）
- **一致性**: ✅ — `earlyInputCapture.ts` 实现捕获/过滤/replay/64KB 上限/`QWEN_CODE_DISABLE_EARLY_CAPTURE`，并在 `KeypressContext` 用 `setImmediate` 重放，与描述完全一致。
- **描述准确性**: 准确；StrictMode 下"render 前 drain、用稳定 prop 传入"处理得当。
- **正确性**: ✅（轻微）— `classifyEscapeSequence` 把 CPR(`ESC[...R`) 漏判为 user input，但启动期 qwen 不请求 CPR，风险低。18 项测试覆盖拆包/UTF-8/边界。
- **结论**: 实现严谨、测试充分。

### #3404 feat(cli): add /doctor diagnostic command
- **状态**: merged | **关联 issue**: #3018（[P2] /doctor 诊断工具）
- **一致性**: ⚠️ — 正文所列 System/Auth/Config/MCP/Tools/Git 检查均落地；但 issue 要求的 shell/permissions/proxy 检查均未实现。
- **描述准确性**: 基本准确，唯"Node v20+ required per package.json"有误——package.json 实为 `>=22.0.0`。
- **正确性**: ⚠️ — `doctorChecks.ts:checkNodeVersion` 原始 diff 用 `MIN_NODE_MAJOR=20`，与 package.json(>=22) 不符，会把 Node20/21 误报 pass，**当前 main 已修正为 22**。其余（并行检查、非交互 MCP 不误报）合理。
- **结论**: 结构清晰实用，但发布时 Node 阈值有 bug（现已修）。

### #3407 fix(cli): auto-submit on number key press in AskUserQuestionDialog
- **状态**: merged | **关联 issue**: #500（选项后不继续）
- **一致性**: ✅ — 抽出 `selectAndAdvance` 复用 4 处；单选预定义项数字键即提交，multi-select/"Other"/Submit tab 仅高亮。
- **描述准确性**: 准确；但 #500 截图是 v0.0.9 的写权限审批框，并非本 PR 修的 `AskUserQuestionDialog`，issue 关联略牵强（同类症状）。
- **正确性**: ✅ — 数字键分支守卫 `!isMultiSelect && !isSubmitTab && targetIndex<options.length` 正确；删除冗余 `if(!isFocused)` 由 `useKeypress` 的 `isActive` 覆盖，安全。
- **结论**: 干净的 UX 修复，唯 issue 绑定稍松。

### #3441 feat(cli): add conversation rewind feature with double-ESC and /rewind command
- **状态**: merged | **关联 issue**: #3186（会话历史回退功能）
- **一致性**: ✅ — double-ESC(空输入+idle) 与 `/rewind`(altNames `rollback`) 均开 `RewindSelector`；同步截断 UI+API history、预填原 prompt、Footer 提示、chatRecording `parentUuid` 分支，全部对应。
- **描述准确性**: 多数准确；但场景4"无历史时不打开"不实——`/rewind` 自身成为 user item，守卫 `h.type==='user'` 会通过并打开（随即空态提示）；另描述写 `recordRewind`，实际方法名 `rewindRecording`。
- **正确性**: ✅（轻微）— 守卫(`h.type==='user'`) 与列表(`isRealUserTurn` 过滤斜杠命令) 定义不一致，仅致无害空态；`handleRewindConfirm` 用 `filter(h.id<userItem.id)` 依赖 id 单调却未复用新增的 `truncateToItem`。压缩不可达、IDE 模式、流式中 ESC 取消均有守卫。
- **结论**: 工程化扎实的旗舰功能，核心健壮，仅守卫不一致与文档小瑕。

---

## 重点跟进清单

### Merged（代码 OK，仅建议修订描述 / 后续清理）
1. **#3297 / #3232**：两者都是 #3011 启动优化子任务，但实际**未带来启动收益**（#3297 仍 `warmAll` 全量预热；#3232 仅 SANDBOX 下出报告）——若启动优化是目标，建议跟进真正的懒加载/默认开启 profiler；并修正 #3297 中"修 P0 并发 bug"的夸大叙述。
2. **#3404**：补 issue #3018 要求的 shell/permissions/proxy 检查；Node 阈值 bug 已在 main 修复（记录）。
3. **#3318 / #3441**：小文档/守卫瑕疵（"代理即跳过"措辞、rewind 空态守卫与 `recordRewind` 命名）——非阻塞，可顺手修。

---

_审查于 2026-05-30；方法：并行只读子代理逐 PR 拉取 issue+描述+diff，结论交叉核对合并后代码。_
