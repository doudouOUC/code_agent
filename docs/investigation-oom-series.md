# Qwen Code OOM 系列问题调研

**日期**: 2026-05-14 ~ 2026-05-15
**调研者**: doudouOUC
**仓库**: [QwenLM/qwen-code](https://github.com/QwenLM/qwen-code)
**版本**: 0.13.x ~ 0.15.11

## 目录

- [背景与方法](#背景与方法)
- [Issue #4116 — idle 状态长会话 OOM](#issue-4116--idle-状态长会话-oom)
- [Issue #4116（@Kieaer 跟进） — 45GB 堆持续泄漏](#issue-4116kieaer-跟进--45gb-堆持续泄漏)
- [Issue #4116（@maxinteresa-ops，v0.16.0 升级后仍崩） — Scenario B-TLS 验证](#issue-4116maxinteresa-opsv0160-升级后仍崩--scenario-b-tls-验证)
- [Issue #2868 — 100 秒快速崩溃](#issue-2868--100-秒快速崩溃)
- [Issue #2945 — `/resume` 期间崩溃](#issue-2945--resume-期间崩溃)
- [Issue #4167 — `/compress` 触发的峰值 OOM](#issue-4167--compress-触发的峰值-oom)
- [Issue #4167（@wwwi2vv-dev 跟进） — 8GB 堆 + Object.defineProperty 栈帧](#issue-4167wwwi2vv-dev-跟进--8gb-堆--objectdefineproperty-栈帧)
- [Issue #4315 — 19 小时长会话 + 输入触发 OOM](#issue-4315--19-小时长会话--输入触发-oom)
- [Issue #4322 — 4GB 堆 + BIO_ssl_shutdown 第三次 TLS 帧](#issue-4322--4gb-堆--bio_ssl_shutdown-第三次-tls-帧)
- [内部 Case A — 6.45h + StackGuard 栈帧](#内部-case-a--645h--stackguard-栈帧)
- [内部 Case B — 孤儿 tool_use 死锁 + new Set 触发 OOM](#内部-case-b--孤儿-tool_use-死锁--new-set-触发-oom)
- [Claude Code 对照设计](#claude-code-对照设计)
- [最终总结与行动项](#最终总结与行动项)
- [附录：相关链接](#附录相关链接)

---

## 背景与方法

近期 qwen-code 出现多起 `FATAL ERROR: Ineffective mark-compacts near heap limit` 崩溃报告，集中在 `scope/memory-usage` 标签下。本文档对每个 issue 单独建立独立的根因分析章节，并在末尾给出统一的总结与可执行的优化清单。

调研方法：
1. 阅读 issue 原始 GC 日志、native stack trace、`/about` 输出；
2. 在仓库中对核心数据流（`GeminiChat.history`、压缩、流式响应处理、JSONL 写入、UI 渲染）做静态溯源；
3. 与同类工具（Claude Code）的内存设计做对比，识别架构差异；
4. 在 GitHub issue 上发布定位报告与可复用 workaround。

每个 issue 的章节统一包含：**报告概要 → GC 日志特征 → 根因分析 → 与其他 issue 的关系 → 已发布动作**。

---

## Issue #4116 — idle 状态长会话 OOM

### 报告概要

| 项 | 值 |
|---|---|
| Issue | [#4116](https://github.com/QwenLM/qwen-code/issues/4116) |
| Qwen Code | 0.15.11 (782403d71) |
| Node.js | v24.15.0 |
| OS | Windows 10 (10.0.26200) x64 |
| 认证 | API Key (openai 模式) |
| Base URL | https://api.deepseek.com |
| 模型 | deepseek-v4-pro（**1M 上下文**） |
| 上下文使用 | 9.5% |
| 运行时长 | 50 min (3,024,101 ms) |
| 用户状态 | **idle**（停在输入提示符） |

### GC 日志特征

```
[7812:0x...]  3024101 ms: Scavenge (interleaved)
  2034.3 (2044.6) -> 2032.8 (2052.6) MB

[7812:0x...]  3024321 ms: Mark-Compact (reduce)
  2041.9 (2056.1) -> 2028.0 (2036.4) MB

FATAL ERROR: Ineffective mark-compacts near heap limit
```

栈帧关键：`v8::ValueDeserializer::ReadValue` —— V8 内部反序列化函数，由 `structuredClone()` 调用。

### 根因分析

**直接触发**：崩溃发生在 `structuredClone(this.history)` 调用时。堆已经接近 2GB 上限，再分配一份历史的克隆就溢出。

**会话数据三份在内存中的拷贝**：

| 副本 | 位置 |
|------|------|
| API 格式历史 | `GeminiChat.history` (`Content[]`) (`packages/core/src/core/geminiChat.ts:422`) |
| React UI 状态 | `useHistory()` (`HistoryItem[]`) (`packages/cli/src/ui/hooks/useHistoryManager.ts:34`) |
| Ink Static fiber 树 | `<Static>` 组件渲染保留 (`packages/cli/src/ui/components/MainContent.tsx:355-381`) |

Ink 的 `<Static>` 是**只追加**：渲染过的消息对应的 React fiber 节点永久保留。

**频繁的全量克隆**：

| 调用点 | 文件 | 行号 | 克隆次数 |
|--------|------|------|----------|
| `checkNextSpeaker` | `utils/nextSpeakerChecker.ts` | 55, 63 | **2 次全量** |
| `microcompactHistory` | `core/client.ts` | 1034 | 1 次 |
| `tryCompress` | `services/chatCompressionService.ts` | 227 | 1 次（curated） |
| `sessionTitle` | `services/sessionTitle.ts` | 116 | 1 次 |
| `sessionRecap` | `services/sessionRecap.ts` | 57 | 1 次 |
| `buildApiHistoryFromConversation` | `services/sessionService.ts` | 1219-1242 | N 次 |

**1M 上下文窗口的放大效应**：

- `tokenLimits.ts:129`: `[/^deepseek-v4/, LIMITS['1m']]`
- 压缩阈值 0.7 → 70 万 token 才触发
- 70 万 token 在嵌套 Content/Part 对象、JS 引擎开销、三份副本下放大 100-500 倍
- V8 堆 2GB 远早于 70 万 token 阈值就被填满

**Memory Monitor 阈值错位**：

- `useMemoryMonitor.ts:11`: `MEMORY_WARNING_THRESHOLD = 7 * 1024^3` (7GB RSS)
- 实际 V8 堆限只有 ~2GB，警告永远不触发

### 已发布动作

- [Workaround 评论](https://github.com/QwenLM/qwen-code/issues/4116#issuecomment-4447005872) — 提供 `NODE_OPTIONS=--max-old-space-size=8192`
- [完整技术分析评论](https://github.com/QwenLM/qwen-code/issues/4116#issuecomment-4448193086) — 含 P0/P1/P2 优化建议

---

## Issue #4116（@Kieaer 跟进） — 45GB 堆持续泄漏

### 报告概要

| 项 | 值 |
|---|---|
| 来源 | [#4116 评论](https://github.com/QwenLM/qwen-code/issues/4116#issuecomment-4455633231) |
| 报告人 | @Kieaer |
| 堆峰值 | **~45 GB** (44,962 MB) |
| 运行时长 | ~7.2 小时 (25,931,686 ms) |
| 增长速率 | ~100 MB/min |
| 平台 | Windows |

### GC 日志特征

```
25931686 ms: Mark-Compact (reduce)
  44962.1 (45042.3) -> 44867.0 (44940.9) MB
  2520.57 / 9.04 ms (+ 4892.3 ms in 980 steps)
```

栈帧出现 OpenSSL 相关符号（X509_STORE_set_cleanup, SSL_CTX_set_cookie_generate_cb），但符号偏移过大，仅作为最近导出符号锚点参考，不能直接当成调用真因。

### 根因分析

**关键反证**：堆给到 45GB 仍然崩溃 → **单纯 `structuredClone` 放大理论无法解释**。这是真实的内存增长，必须存在持续泄漏源。

**可疑代码路径**：

#### 1. 流式响应聚合数组未释放

```typescript
// packages/core/src/core/openaiContentGenerator/pipeline.ts:129
const collectedGeminiResponses: GenerateContentResponse[] = [];
for await (const chunk of stream) {
  // ...
  collectedGeminiResponses.push(response);  // 每个 chunk 都 push
}

// packages/core/src/core/loggingContentGenerator/loggingContentGenerator.ts:398
const responses: GenerateContentResponse[] = [];
for await (const response of stream) {
  if (shouldCollectResponses) {
    responses.push(response);
  }
}
```

- 流式响应的**每个 chunk** 都被收集
- 流异常退出未调用 `stream.return?.()` 时，底层 SSE/TLS 资源可能泄漏 → 解释栈帧中的 OpenSSL 符号

#### 2. ChatRecordingService writeChain 闭包堆积

```typescript
// packages/core/src/services/chatRecordingService.ts:480
private writeChain: Promise<void> = Promise.resolve();

private appendRecord(record: ChatRecord, ...) {
  this.writeChain = this.writeChain
    .catch(() => {})
    .then(() => jsonl.writeLine(conversationFile, record))  // 闭包捕获 record
    .catch(...);
}
```

- 磁盘慢（Windows Defender、网络盘）→ 闭包堆积 → record 强引用无法释放

#### 3. EventEmitter 订阅泄漏

- `packages/core/src/` 中 `.on(` 与 `removeListener` 比例为 **146:67**
- React 严格模式 + Ink 多次渲染可能放大订阅数

### 与 #4116 原报告的关系

**不是同一根因**。原报告是堆达到默认上限触发，本评论是应用层真实持续泄漏触发。两者并存。

### 已发布动作

- [追加评论](https://github.com/QwenLM/qwen-code/issues/4116#issuecomment-4456488521) 区分两类场景

---

## Issue #4116（@maxinteresa-ops，v0.16.0 升级后仍崩） — Scenario B-TLS 验证

### 报告概要

| 项 | 值 |
|---|---|
| 来源 | [#4116 评论 1](https://github.com/QwenLM/qwen-code/issues/4116#issuecomment-4516854785)、[#4116 评论 2](https://github.com/QwenLM/qwen-code/issues/4116#issuecomment-4517382471) |
| 报告人 | @maxinteresa-ops |
| Qwen Code | **0.16.0 (1b1f48674)** ← 已升级 |
| Node.js | v24.15.0 |
| OS | Windows 11 (10.0.26200) x64 |
| `NODE_OPTIONS` | `--max-old-space-size=6000 --max-semi-space-size=32 --expose-gc` |
| 模型 | deepseek-v4-pro via api.deepseek.com（DeepSeek API Key auth） |

### Crash 1

- 堆峰值：5984 MB（committed 6009 MB，**用户已主动调到 6GB**）
- 运行时长：6,422,934 ms ≈ **107 分钟**
- 上下文使用：**11.3%**（low！）
- 模式：YOLO mode（多次切换）
- 泄漏速率 ≈ **1 MB/秒**

栈帧（关键部分）：

```
9:  X509_STORE_set_cleanup+5098         ← OpenSSL 证书清理
10-12: uv_timer_set_repeat × 多次       ← libuv 周期定时器
13-22: RegExp::GetFlags（多次）         ← regex 代码路径
23: EVP_MD_CTX_set_update_fn+464390     ← OpenSSL 摘要上下文
```

### Crash 2

- 堆峰值：5957 MB
- 运行时长：3,839,322 ms ≈ **64 分钟**
- 上下文使用：**12.4%**
- 模式：YOLO mode、"2 tasks done"

栈帧关键：

```
9:  v8::Unlocker::~Unlocker+9273        ← V8 isolate locker（worker thread?）
10: v8::String::Utf8Value::~Utf8Value   ← V8 string 转换
```

### 关键判断：v0.16.0 只修了 Scenario A，B-TLS 仍存在

数据三连击：

1. **上下文 11-12% 低使用率** → 排除 history 累积（Scenario A 在 6GB 堆下根本撑不到这种程度）
2. **6GB 堆 + 1 MB/秒泄漏** → 真实持续泄漏（Scenario B）
3. **OpenSSL `X509_STORE_set_cleanup` + `EVP_MD_CTX_set_update_fn` 帧** → 具体子类是 **B-TLS**

栈帧中**`uv_timer_set_repeat` 出现 4 次** → 周期性定时器在做 TLS 清理时分配失败。

### 怀疑的具体来源（周期性定时器 + TLS）

| 来源 | 周期 | 涉及 TLS |
|------|------|---------|
| MCP client health-check (`mcp-client-manager.ts:337`) | 可配置 | ✅ |
| `BatchSpanProcessor` flush（OpenTelemetry） | 5s | ✅ |
| `LogToSpanProcessor` flush (`log-to-span-processor.ts:105`) | 5s | ✅ |
| undici HTTPS agent connection pool reaper | 可配置 | ✅ |
| session-tracing 清理定时器（`session-tracing.ts:78`） | 60s | ❌（不直接 TLS） |

### 与已有报告的关系（B-TLS 子类累积）

至此，**B-TLS 子类已有 4 个独立报告**：

| Issue | 堆 | 时长 | 触发 |
|-------|-----|------|------|
| #2945 | 4 GB | 220s | `/resume` |
| #4116 (@Kieaer) | 45 GB | 7.2h | 普通使用 |
| #4322 | 4 GB | 7.1h | 普通使用 |
| **#4116 (@maxinteresa-ops)** | **6 GB** | **107min** | **YOLO mode + DeepSeek API（v0.16.0 升级后仍崩）** |

### 关键意义：v0.16.0 修复有效性的验证

**正面**：v0.16.0 的 PR #4286 确实在 Scenario A 上做对了——@maxinteresa-ops 的崩溃已经**不在 `structuredClone` 路径上**（栈帧不含 `ValueDeserializer`）。

**负面**：B-TLS 子类**完全没有修**。v0.16.0 用户只要使用任何 HTTPS API + 周期性后台任务（telemetry / MCP 等），仍然会 OOM。

### 已发布动作

- [#4116 跟进评论：v0.16.0 后崩溃分析 + 给 @maxinteresa-ops 的针对性建议](https://github.com/QwenLM/qwen-code/issues/4116#issuecomment-4521009279)
- [#4116 修正评论：BatchSpanProcessor / LogToSpanProcessor 默认不启用，符号 offset 解读修正](https://github.com/QwenLM/qwen-code/issues/4116#issuecomment-4521113616)
- 给出了具体的临时缓解：关闭 telemetry、禁用 HTTPS MCP server、避免长会话、降级 v0.15.9 对照测试

### 本地复现验证 — Scenario B-TLS 已确证

仓库内附独立可执行的复现：[`repros/oom-streaming-leak/`](../../repros/oom-streaming-leak/)。

三层渐进式测试（Node fetch / fetch + for-await / 真实 OpenAI SDK 5.11.0），每层都对 BAD / GOOD / BEST 三种模式跑 300 次迭代。

V3（真实 OpenAI SDK）结果，macOS arm64 / Node v24.12.0：

```
Pattern                              heap          external      arrayBuffers   rss
A: BAD  (qwen-code current)         1.9 MB       0.2 MB       0.1 MB      55.1 MB
B: GOOD (iter.return cleanup)       0.2 MB       0.0 MB       0.0 MB      -4.8 MB
C: BEST (AbortController)           0.0 MB       0.0 MB       0.0 MB      -1.5 MB

Per-iteration leak (BAD vs GOOD):
  RSS: 194.9 KB/iter   External: 0.7 KB/iter
```

**关键观察**：
1. JS 堆 / external / ArrayBuffer 三个 V8 可见层**几乎都不漏**——OpenAI SDK 的 `Stream<T>` 类做了基本的 reader 释放
2. **但 RSS 持续增长 ~195 KB/iter**——native socket / TLS 状态被 undici keep-alive 池保留，**V8 看不到这部分**
3. 加 `finally { iter.return() }` 或 `AbortController.abort()` 后，**RSS 增长完全消除**（甚至略降）

**与生产报告对照**：

| 报告 | 速率 | 推算 iter 频率 |
|------|------|--------------|
| @maxinteresa-ops（6GB/107min） | ~56 MB/min RSS | ~280 iter/min ≈ 5 iter/sec |
| @Kieaer（45GB/7.2h） | ~104 MB/min RSS | ~500 iter/min ≈ 8 iter/sec |
| #4322（4GB/7.1h） | ~9 MB/min RSS | ~50 iter/min ≈ 1 iter/sec |

YOLO mode + tool 循环 + 偶发网络抖动下，每秒 1-8 次 stream 异常退出完全合理（每个 turn 含 1-3 个 stream）。

---

## Issue #2868 — 100 秒快速崩溃

### 报告概要

| 项 | 值 |
|---|---|
| Issue | [#2868](https://github.com/QwenLM/qwen-code/issues/2868) |
| Qwen Code | 0.13.2 (1b1a029fd) |
| Node.js | v24.12.0 |
| OS | Linux x64 (debian13-amd64) |
| 认证 | Qwen OAuth |
| 模型 | coder-model |
| 堆峰值 | ~2 GB |
| 运行时长 | **101 秒** |
| 增长速率 | ~20 MB/秒 |
| 用户状态 | active，"RAM consumption keep rising" |

### 根因分析

**100 秒不可能积累长会话历史** → 必然是快速增长源。

用户原话："I have schrinked context several times already" — 已主动压缩但仍然崩溃，说明压缩并未充分释放，或者压缩本身贡献了内存压力（见 Issue #4167）。

**最可能的元凶**：流式响应 chunk 累积（`collectedGeminiResponses` / `responses[]`）。模型生成超长输出（如读取大文件并复述），单次请求内累积数 GB。

### 与其他 issue 的关系

与 @Kieaer 同属 **Scenario B（持续泄漏）**，但触发更快（active 状态 + 大流式响应）。

### 后续评论新数据（2026-05-15 ~ 05-20）

| 评论者 | 日期 | 内容 |
|--------|------|------|
| @dyrnq | 2026-05-15 | "关注这个问题" |
| @supercargotim-rgb | 2026-05-17 | 俄语，"今天一天崩了 4 次" |
| @kstepyra | 2026-05-17 | "happens constantly" |
| @gkubon | 2026-05-20 | "happens multiple times a day" + 完整 GC trace |

**频率从偶发升到高频** —— 三个独立用户在 3 天内反映"频繁崩溃"，与 v0.15.10/0.15.11 时间线吻合，是**版本回归确实存在**的强证据。

### @gkubon 数据点详细分析

| 项 | 值 |
|---|---|
| 上下文使用 | **56.4%** （UI 显示）|
| 当前响应 | 6.3k tokens（最近一次模型输出） |
| 已运行 | 5m 54s（agent 任务进行中） |
| 总运行时长 | 533,546 ms ≈ **8.9 分钟** |
| 堆峰值 | 4044 MB（committed 4146 MB ≈ 默认 4GB） |
| Mark-Compact 释放 | 仅 ~9-10 MB |
| 平均 mu | 0.120 / 0.028 — **GC 占 88-97% CPU** |
| 模式 | **YOLO mode**（自动接受工具调用） |
| 当前操作 | "Checking for syntax errors in the universe..." |
| 平台 | 系统 Node `/usr/bin/node`（Linux/容器，默认 4GB 堆） |

栈帧截断在 frame 10：

```
8: Factory::NewFillerObject
9: Runtime_AllocateInYoungGeneration
10: 0x752bff66c476   ← JIT'd JS 代码（最具诊断价值的位置，被截断了）
```

**推断**：

1. **增长速率 ~6-8 MB/sec** —— 与 @wwwi2vv-dev（7.6 MB/sec）同量级
2. **YOLO mode 是关键放大器** —— 没有用户停顿，agent 持续调用工具，每次 turn 都跑 `checkNextSpeaker`（双 `structuredClone`）+ `microcompactHistory` 入参的 `getHistory()`
3. **"Checking for syntax errors in the universe"** 看起来像 codegraph 或自定义 skill 在大量并行扫描文件
4. **56.4% 接近 70% 自动压缩阈值** —— 可能正在或即将触发压缩窗口期峰值

### 已发布动作

- [#2868 交叉引用评论（2026-05-19）](https://github.com/QwenLM/qwen-code/issues/2868#issuecomment-4487242267)
- [#2868 跟进评论（2026-05-20）](https://github.com/QwenLM/qwen-code/issues/2868#issuecomment-4498312245) — 请求 @gkubon 补完整 stack + /about + 试用 `kill -USR2` 抓 heap snapshot

---

## Issue #2945 — `/resume` 期间崩溃

### 报告概要

| 项 | 值 |
|---|---|
| Issue | [#2945](https://github.com/QwenLM/qwen-code/issues/2945) |
| Qwen Code | 0.14.0 (de66ee198) |
| Node.js | v22.17.0 |
| OS | Windows 10 (10.0.26200) x64 |
| 认证 | Qwen OAuth |
| 模型 | coder-model |
| 堆峰值 | ~4 GB |
| 运行时长 | 220 秒 |
| 触发 | **`/resume` 命令** |

### GC 日志特征

栈帧含 `BIO_ssl_shutdown` 与 `SSL_get_quiet_shutdown` —— TLS 关闭路径。

### 根因分析

`/resume` 加载历史 JSONL 文件 + 重建 React/Ink 树 + 网络初始化 + 可能的会话回放，几个昂贵操作并行：

- `sessionService.reconstructHistory` 读取整个 JSONL 文件
- `replayUiTelemetryFromConversation` 重放所有事件
- 在重建过程中可能多次触发 `structuredClone`

如果会话本身已经较大（多日积累），单次 `/resume` 即可冲垮 4GB 堆。

### 与其他 issue 的关系

属于**会话恢复**这个特定路径下的内存峰值问题。与 #4167 的"操作峰值"类似，但触发点不同。

---

## Issue #4167 — `/compress` 触发的峰值 OOM

### 报告概要

| 项 | 值 |
|---|---|
| Issue | [#4167](https://github.com/QwenLM/qwen-code/issues/4167) |
| Qwen Code | 0.15.11 (782403d71) |
| Node.js | v22.12.0 |
| OS | macOS arm64 (25.4.0) |
| 认证 | Coding Plan (Aliyun DashScope) |
| Base URL | coding.dashscope.aliyuncs.com/v1 |
| 模型 | **glm-5**（**200K 上下文**，非 Qwen 模型） |
| 堆峰值 | ~2 GB |
| 运行时长 | ~3.3 小时 |
| 触发 | 用户原话 "i was compressing" |
| 报告时 RSS | 105.1 MB（启动期记录） |

### GC 日志特征

```
Mark-Compact 2017.1 (2080.4) -> 2004.3 (2080.4) MB    // 仅释放 13 MB
Mark-Compact 2017.1 (2080.4) -> 2004.3 (2080.4) MB    // 再次仅释放 13 MB
Ineffective mark-compacts near heap limit
```

栈帧关键：`Heap::CollectGarbage` → `MinorGCJob::Task::RunInternal` —— 普通年轻代 GC 任务期间无法分配，**不是** `structuredClone` 反序列化时崩溃。

### 根因分析

`packages/core/src/services/chatCompressionService.ts:227-393` 压缩流程在窗口期同时持有：

| 步骤 | 文件:行号 | 内存代价 |
|------|----------|----------|
| 1. 取 curated 历史 | `chat.getHistory(true)` (geminiChat.ts:1095) | **`structuredClone` × 1 全量历史** |
| 2. 计算 compressCount | line 297-300 | 对每个 Content 做 `JSON.stringify` |
| 3. 计算 totalCount | line 301-304 | 对**整个** `historyForSplit` **再做一次** `JSON.stringify` |
| 4. 切片 compress + keep | line 276-277 | 浅拷贝 |
| 5. spread 到 contents | line 326-327 | 新数组 |
| 6. 压缩 API 请求 | OpenAI SDK | 请求体序列化 |
| 7. 流式响应 chunk 累积 | `pipeline.ts:129` | `collectedGeminiResponses[]` |
| 8. Logging 层再收集 | `loggingContentGenerator.ts:398` | `responses[]`（第二份） |
| 9. 构造 extraHistory | line 366-393 | 新数组 spread `historyToKeep` |

**峰值约稳态历史的 3-5 倍**。

**双重 `JSON.stringify` 是特别浪费**：

```typescript
// chatCompressionService.ts:297-304
const compressCharCount = historyToCompress.reduce(
  (sum, c) => sum + JSON.stringify(c).length, 0,
);
const totalCharCount = historyForSplit.reduce(  // 包含 historyToCompress 全部
  (sum, c) => sum + JSON.stringify(c).length, 0,
);
```

仅为 size 校验做 O(2N) 序列化。对 200K token 历史而言，每次 stringify 产生数 MB 的临时字符串。

### 关键启示

用户使用的是 **200K 上下文窗口**模型（不是 #4116 的 1M），稳态远低。但 **3.3 小时**累积 + 压缩 3-5 倍峰值放大，足以耗尽 2GB 堆。

**压缩本身是 OOM 的高风险时刻**，需要单独优化。

### 已发布动作

- [详细分析评论](https://github.com/QwenLM/qwen-code/issues/4167#issuecomment-4458237121) 含修复建议 S0-S3

---

## Issue #4167（@wwwi2vv-dev 跟进） — 8GB 堆 + Object.defineProperty 栈帧

### 报告概要

| 项 | 值 |
|---|---|
| 来源 | [#4167 评论](https://github.com/QwenLM/qwen-code/issues/4167#issuecomment-4458728005) |
| 报告人 | @wwwi2vv-dev |
| 堆峰值 | **~8 GB** (8047 MB) |
| Mark-Compact 释放 | ~60 MB |
| 运行时长 | 17.5 分钟 (1,049,315 ms) |
| 增长速率 | **~7.6 MB/秒** |
| Node.js | v20.20.0 (fnm 管理) |
| 平台 | Linux x64 |

### 关键判断

**用户已应用 `--max-old-space-size=8192`** —— 否则 Node v20 默认堆 ~4GB 即崩溃。即便堆翻倍仍然崩溃，**确证存在持续真实泄漏**（非单纯 `structuredClone` 放大）。

### GC 日志特征（与之前完全不同）

native stack frames 13-25：
```
13: NameDictionary::New
14: BaseNameDictionary::New
15: NameDictionary::New
16: JSObject::MigrateToMap          ← 对象迁移到字典模式
17: LookupIterator::TransitionToAccessorProperty
18: JSObject::DefineAccessor         ← 定义访问器属性
19-23: JSReceiver::OrdinaryDefineOwnProperty / DefineProperty
24: Builtin_ObjectDefineProperty     ← Object.defineProperty()
25: 0x705532e99df6                   ← JIT 编译的 JS 代码
```

**这是迄今为止最有诊断价值的栈**：崩溃发生在 `Object.defineProperty` 调用过程中，V8 试图分配新的 `NameDictionary`（属性存储慢路径）失败。

### V8 NameDictionary 增长含义

V8 将对象从快速模式（hidden class）切换到字典模式时机：
- 对象拥有过多不同属性名（>~30）
- 属性以不一致顺序增删
- 属性 attribute 变更（writable/enumerable）

**持续 NameDictionary 分配 + 留存堆 ≈ 大量对象正在被构造、各自挂载许多不同属性键、且未被释放**。

### 可疑路径：错误冗余清洗 (redactProxyError)

`packages/core/src/utils/runtimeFetchOptions.ts:482-518` 的 `cloneErrorWithRedactedFields` 是热错误路径中唯一密集使用 `Object.defineProperty` 的位置：

```typescript
function cloneErrorWithRedactedFields(...) {
  for (const key of Reflect.ownKeys(error)) {
    // ...
    Object.defineProperty(clone, key, updatedDescriptor);
  }
  defineMissingRedactedValue(clone, copiedKeys, 'message', ...);
  defineMissingRedactedValue(clone, copiedKeys, 'stack', ...);
  defineMissingRedactedValue(clone, copiedKeys, 'cause', ...);  // 递归
  defineMissingRedactedValue(clone, copiedKeys, 'errors', ...); // 递归
}
```

调用点遍布所有 OpenAI/Anthropic SDK 错误捕获路径：
- `pipeline.ts:222`（流式响应错误）
- `openaiContentGenerator.ts:159`
- `errorHandler.ts:28`
- `anthropicContentGenerator.ts:234,262,763`

**8GB / 17 min 的增长场景假设**：
1. 流式请求遭遇错误（rate limit、网络抖动、畸形 chunk）
2. 错误经 `redactProxyError` → `cloneErrorWithRedactedFields` 克隆
3. 每个克隆通过 `new Error(..., { cause })` 沿调用栈往上抛 → 包装 → 再抛
4. 若包装链或 logging 持有引用，错误克隆（携带肥大 NameDictionary）累积
5. 配合 `collectedGeminiResponses[]` chunk 累积（见 #4116 Kieaer 评论中的可疑路径），错误事件触发流重建可同时泄漏 chunks + error clones

### 与其他报告的关系

属于 **Scenario B（真实持续泄漏）**，但提供了迄今最具体的 V8 栈帧线索：
- @Kieaer 的 45GB 案例：栈是 OpenSSL 符号 → 怀疑 TLS 资源
- @wwwi2vv-dev 的 8GB 案例：栈是 `defineProperty + NameDictionary` → 怀疑错误克隆/对象属性爆炸

两者可能是**同一根因的不同分支**（流处理 + 错误处理累积），或是两个独立的泄漏源叠加。

### 已发布动作

- [详细分析评论](https://github.com/QwenLM/qwen-code/issues/4167#issuecomment-4459269515) 含 5 项请求信息（约会获取 /about、模型配置、操作上下文、错误日志、heap snapshot）

---

## Issue #4315 — 19 小时长会话 + 输入触发 OOM

### 报告概要

| 项 | 值 |
|---|---|
| Issue | [#4315](https://github.com/QwenLM/qwen-code/issues/4315) |
| Qwen Code | 0.15.11 (782403d71) |
| Node.js | v22.12.0 |
| OS | macOS arm64 (25.4.0) |
| 认证 | Coding Plan (Aliyun DashScope) |
| 模型 | **glm-5**（200K 上下文） |
| 堆峰值 | ~2027 MB（默认 2GB 堆限） |
| **运行时长** | **70,561,968 ms ≈ 19.6 小时** ← 系列中最长 |
| 触发动作 | 任务完成后**用户在输入框打字**时崩溃 |
| /about 时 RSS | 127.5 MB（启动期记录） |

### GC 日志特征

```
[21822] 70561968 ms: Scavenge (interleaved)
  2027.9 (2079.0) -> 2024.1 (2079.5) MB

[21822] 70562036 ms: Scavenge
  2029.7 (2079.5) -> 2026.8 (2098.0) MB
  allocation failure
```

### 栈帧关键解读

```
9-22:  ValueDeserializer::ReadDenseJSArray ↔ ReadObject  ← 深层嵌套数组对象递归
24:    v8::ValueDeserializer::ReadValue
25:    node::worker::Message::Deserialize           ← 走 worker_threads 消息通道
26:    node::worker::StructuredClone                ← Node 全局 structuredClone()
27:    Builtins_CallApiCallbackOptimizedNoProfiling
28:    0x10b59b3d8                                   ← JIT'd 用户代码调用 structuredClone
...
34:    v8_inspector::V8Console::runTask             ← async 上下文跟踪
36-92: 大量重复地址                                   ← 深递归 JIT JS 代码
100:   node::Environment::CheckImmediate            ← libuv check 阶段
101:   uv__run_check
102:   uv_run
```

三个关键观察：

1. **Frame 26 = `node::worker::StructuredClone`**：Node.js 全局 `structuredClone()`（v17+）。与 #4116 原报告（V8 内置 `ValueDeserializer`）路径一致，从 Node 表面 API 进入。

2. **Frame 100 = `CheckImmediate`**：崩溃实际发生在 **libuv check 阶段**（`setImmediate` 回调执行）。用户打字未直接调用 `structuredClone`——keystroke 触发了状态变更，状态变更落地到一条 setImmediate 链上，链中某处的 `structuredClone(history)` 撑爆了堆。

3. **Frame 34 = `V8Console::runTask`**：V8 Inspector 的 async 上下文跟踪。出现在普通堆栈说明运行期开启了 async stack traces 或 inspector，每个 task 都背负额外开销。

### 根因分析

**Scenario A 的输入触发变种**。任务完成后会触发的 `getHistory()` 调用点（每个都会 `structuredClone`）：

- `recordAssistantTurn` 写 JSONL
- `checkNextSpeaker`（**两次**全量克隆，行 55、63）
- 自动压缩阈值检查
- IDE 上下文同步
- microcompaction 时间触发评估

任意一个在 setImmediate 链上的 continuation 都可能在 19+ 小时累积的历史上 OOM。

### 与其他 issue 的对比

| | #4116 原 | #4167 原 | #4167 (@wwwi2vv-dev) | **#4315** |
|---|---------|---------|---------|---------|
| 触发 | idle | `/compress` | 流式 + 错误 | **输入打字** |
| 堆 | 2 GB | 2 GB | 8 GB | 2 GB |
| 时长 | 50 min | 3.3 h | 17 min | **19.6 h** |
| 栈关键 | `ValueDeserializer` | regular GC | `Object.defineProperty` | `node::worker::StructuredClone` |
| 分类 | A | C | B | **A 变种** |

19.6 小时是系列中最长的。说明现有的 microcompaction（按时间清理工具结果）+ 自动压缩（按 token 阈值）在长期运行中**没能保持稳态**，历史持续增长。

### 不需要新机制

根因与 #4116 原报告一致。已识别的 P0 修复（`getHistoryReadonly`、`peekLastHistoryEntry`、消除压缩双重 stringify、启动时设置堆限）全部适用，无需新增 P 级修复项。

唯一新增的细节是：**输入处理路径上的 setImmediate 链需要审计**——任何在 keystroke 后的 continuation 中的 `structuredClone(history)` 都应替换为 readonly 引用或 peek 访问。

### 已发布动作

- [#4315 分析评论](https://github.com/QwenLM/qwen-code/issues/4315#issuecomment-4485434397)

---

## Issue #4322 — 4GB 堆 + BIO_ssl_shutdown 第三次 TLS 帧

### 报告概要

| 项 | 值 |
|---|---|
| Issue | [#4322](https://github.com/QwenLM/qwen-code/issues/4322) |
| OS | Windows（PS 路径 `D:\odoo\odoo-18.0`） |
| 堆峰值 | ~4023 MB（committed 4129 MB ≈ Node v22 在 64-bit Windows 默认堆限） |
| Mark-Compact 释放 | 仅 ~14 MB / 4023 MB |
| Mutator 利用率 | 0.126 / 0.076 — V8 87-92% CPU 在 GC |
| 运行时长 | ~7.1 小时（25,553,508 ms） |
| 工作目录 | Odoo 18.0 项目（暗示大代码库） |

### 栈帧（第三次出现 OpenSSL 关键）

```
1: node::SetCppgcReference                            ← Node Cppgc API
2: SSL_get_quiet_shutdown                             ← OpenSSL TLS shutdown
3: v8::Isolate::ReportExternalAllocationLimitReached  ← 外部内存限触发！
4: v8::Function::Experimental_IsNopFunction
5-6: v8::internal::StrongRootAllocatorBase
7: v8::CpuProfileNode::GetScriptResourceNameStr       ← 仅符号锚点（偏移过大）
8: BIO_ssl_shutdown                                   ← OpenSSL Basic I/O shutdown
```

**两个关键诊断点**：

1. **Frame 3 `ReportExternalAllocationLimitReached`**：触发不是 V8 普通堆分配，而是 V8 的**外部内存追踪**触发的。"外部内存"是 native（C++ 管理）层面的分配——TLS 读缓冲区、Node Buffer、native handle 等。

2. **Frame 2 + 8 `BIO_ssl_shutdown` / `SSL_get_quiet_shutdown`**：失败的分配发生在 **TLS 连接拆除过程中**。每次 shutdown 都要分配内部 OpenSSL 状态结构。

### TLS 模式跨报告强化

至此，**已有三个独立报告含 OpenSSL 栈帧**：

| Issue | 堆 | 时长 | OpenSSL 帧 |
|-------|----|------|-----------|
| #2945 | 4 GB | 220s | `BIO_ssl_shutdown`、`SSL_get_quiet_shutdown`（`/resume` 期间） |
| #4116（@Kieaer 评论） | **45 GB** | 7.2h | `X509_STORE_set_cleanup`、`SSL_CTX_set_cookie_generate_cb` |
| **#4322** | 4 GB | 7.1h | `BIO_ssl_shutdown`、`SSL_get_quiet_shutdown` |

三次独立出现，**已超过巧合范围**。

### 根因假设：流式 HTTPS 连接错误路径未完全清理

代码侧关键证据：

```bash
$ grep "stream\.return\|stream\.close" \
    packages/core/src/core/openaiContentGenerator/pipeline.ts \
    packages/core/src/core/loggingContentGenerator/loggingContentGenerator.ts
# 无匹配
```

`pipeline.ts` 与 `loggingContentGenerator.ts` 都没有显式调用 `stream.return?.()` / `stream.close()`。`for await (... of stream)` 异常退出时 JS 会尝试调用 iterator 的 `return()`，但 OpenAI SDK 的流封装坐落在 HTTPS Response body 之上。如果底层 `Response.body` 的 reader 没被释放、或释放了但 TLS socket 没被 agent pool 回收，native TLS 资源就累积。7 小时会话 + 重试 + 网络抖动逐步堆积，最终外部内存溢出，连 `BIO_ssl_shutdown` 自身都无法分配。

### 与其他 issue 关系

属于 **Scenario B（持续真实泄漏）** 的 **TLS 子类**：
- @Kieaer (#4116) ：45GB 堆，OpenSSL 帧（X509、SSL_CTX）
- #2945：4GB 堆，OpenSSL 帧（BIO_ssl_shutdown、SSL_get_quiet_shutdown），`/resume` 触发
- **#4322**：4GB 堆，OpenSSL 帧（BIO_ssl_shutdown、SSL_get_quiet_shutdown），普通使用

与 @wwwi2vv-dev 的 8GB / `Object.defineProperty` 案例（也是 Scenario B 但栈帧不同）共同构成 Scenario B 的两条独立子线索：
- **TLS 子类**（#2945、#4116-Kieaer、#4322）
- **defineProperty/NameDictionary 子类**（#4167-wwwi2vv-dev）

### 已发布动作

- [#4322 分析评论](https://github.com/QwenLM/qwen-code/issues/4322#issuecomment-4487156141)

---

## 内部 Case A — 6.45h + StackGuard 栈帧

### 报告概要

| 项 | 值 |
|---|---|
| 来源 | 内部同事反馈（非公开 issue） |
| 堆峰值 | 4061-4062 MB（committed 4076 MB） |
| Mark-Compact 释放 | 仅 ~21 MB（4062 → 4041） |
| 运行时长 | 23,205,336 ms ≈ **6.45 小时** |
| Node | v23.11.1（fnm 管理） |
| 平台 | macOS |
| 推测后端 | 内部 DashScope / Coding Plan（与 #4167、#4315 同栈生态） |

### 原始栈帧（保留供日后参考）

```
[85150:0x8ec800000] 23205336 ms: Scavenge (reduce) (interleaved)
  4061.9 (4076.7) → 4061.7 (4077.4) MB
  pooled: 0 MB, 4.42 / 0.00 ms
  (average mu = 0.374, current mu = 0.377) allocation failure;

[85150:0x8ec800000] 23205375 ms: Mark-Compact (reduce)
  4062.0 (4077.4) → 4041.1 (4061.4) MB
  pooled: 0 MB, 15.08 / 0.46 ms
  (+ 409.0 ms in 0 steps since start of marking, biggest step 0.0 ms,
   walltime since start of marking 512 ms)
  (average mu = 0.359, current mu = ...)

FATAL ERROR: Ineffective mark-compacts near heap limit
Allocation failed - JavaScript heap out of memory

----- Native stack trace -----
1: node::OOMErrorHandler
2: v8::internal::V8::FatalProcessOutOfMemory
3: v8::internal::Heap::stack()
4: v8::internal::Heap::CollectGarbage::$_1::operator()()
5: heap::base::Stack::SetMarkerAndCallbackImpl
6: PushAllRegistersAndIterateStack
7: v8::internal::Heap::CollectGarbage
8: v8::internal::StackGuard::HandleInterrupts          ← 关键
9: v8::internal::Runtime_StackGuardWithGap             ← 关键
```

### 栈帧的特殊性：触发点是 V8 内部周期性 GC 检查

- `Runtime_StackGuardWithGap` 是 V8 在 JS 函数序言 / 循环回边插入的**栈守卫检查**
- JS 跑到检查点 → V8 发现有挂起的中断（其中包括"内存压力，做一次 GC"）→ `HandleInterrupts` 触发 GC → GC 失败 OOM
- **这条栈不揭示泄漏源** —— 没有具体的分配方代码（不像 #4116 的 `ValueDeserializer`、#4167 的 `Object.defineProperty`、#4322 的 `BIO_ssl_shutdown`）
- 唯一告诉我们的是："堆已经满了，任何后续 GC 都救不回来"

`+ 409 ms in 0 steps`（增量步数为 0）特别关键 —— Mark-Compact 跑了 409 ms 但实际有效步数 0，说明 GC 还没来得及做增量工作就被强制收尾，**堆里对象绝大部分是 reachable**（不是泄漏临时对象，是真的持有大量数据）。

### 分类归属：Scenario A 或 B 长会话累积，无具体子类证据

判断依据：
1. **6.45 小时时长** —— 与 #4322（7.1h）、@Kieaer（7.2h）同一量级
2. **~4GB 堆 + 默认 Node v23** —— Node v23 在 macOS 默认约 4GB，**很可能未设 `--max-old-space-size`**
3. **Mark-Compact 仅释放 21 MB** —— 整堆基本都是 reachable，**真的累积了数据**
4. **mu = 0.359** —— GC 在崩溃前已频繁打断 JS 执行
5. 推测使用 DashScope / glm-5（同 #4167、#4315 栈生态）→ 倾向 Scenario A 长会话

### 缺什么信息才能进一步定性

| 信息 | 能定性的内容 |
|------|------------|
| `/about` 输出 | 模型 + Auth → 是否同 DashScope 栈 |
| 崩溃前几十行日志 | retry / rate-limit / `/compress` → C 或 B |
| `process.memoryUsage().external` 趋势 | 持续增长 → B-TLS |
| 用户在做什么（agent 循环 / 读大文件 / 流响应大） | A 还是 B-defineProperty |
| 是否设过 `NODE_OPTIONS` | 没设 + 4GB → 默认堆 |

### 与已识别场景的关系

最佳猜测：**Scenario A 的又一例**（长会话 + `structuredClone` 累积），与 #4315（19.6h glm-5 macOS）同源。已识别的 P0 修复（`getHistoryReadonly`、启动时设置堆限）适用，无需新增 P 级修复项。

### 已采取动作

- 信息保留在本调研文档（去掉用户名）
- 未在公开渠道发布（内部 case）

---

## 内部 Case B — 孤儿 tool_use 死锁 + new Set 触发 OOM

### 报告概要

| 项 | 值 |
|---|---|
| 来源 | 内部同事反馈（非公开 issue） |
| 堆峰值 | 4085-4088 MB（committed 4098 MB ≈ Node 24 默认 4GB） |
| Mark-Compact 释放 | 仅 ~9 MB（4088 → 4079） |
| Mark-Compact 增量步数 | **707 步**（与内部 Case A 的 0 步不同——GC 真的在尝试，但徒劳） |
| 运行时长 | 3,826,469 ms ≈ **63.8 分钟** |
| Node | v24.9.0（Homebrew） |
| 平台 | macOS arm64 |
| 模型 | **DeepSeek/deepseek-v4-pro（1M 上下文）** |
| Auth | anthropic（Aliyun 内部 `idealab.alibaba-inc.com/api/anthropic` 代理） |

### 应用层错误（载荷信息！）

```
✕ [API Error: messages.7:tool_use ids were found without tool_result blocks
   immediately after: call_01_WJDOodB3Djek95FFdMdF5651,
                       call_02_GGdFyaUSKytaTlMUbtXr9527,
                       call_03_T7jppFFL8y9SUKpgh2jZ7160.
   Each tool_use block must have a corresponding tool_result block in the next message.]
```

用户在崩溃前输入"继续"，立即返回服务端 400 错误，错误指出会话第 7 条消息有 **3 个孤儿 tool_use 块**（无对应 `tool_result`）。

### 原始栈帧（保留）

```
[19707:0x7f740c000]  3826469 ms: Scavenge (interleaved)
  4085.8 (4098.1) → 4082.3 (4098.4) MB

[19707:0x7f740c000]  3826871 ms: Mark-Compact (reduce)
  4088.3 (4100.4) → 4079.8 (4091.4) MB
  (+ 15.2 ms in 707 steps since start of marking)

----- Native stack trace -----
 1: node::OOMErrorHandler
 2-3: v8::FatalProcessOutOfMemory
 4-10: v8::Heap::CollectGarbage / RecomputeLimits 调用链
11: v8::HeapAllocator::AllocateRawWithRetryOrFailSlowPath
12: v8::Factory::NewFillerObject
13: v8::Runtime_AllocateInYoungGeneration
14: Builtins_CEntry_Return1_ArgvOnStack_NoBuiltinExit
15: Builtins_SetConstructor                  ← new Set() 失败！
16: Builtins_JSBuiltinsConstructStub
17-28: JIT'd JS 代码（深递归）
29-30: Builtins_JSEntry / JSEntryTrampoline
36: node::Environment::CheckImmediate         ← libuv check 阶段
37: uv__run_check
```

### 栈帧定位 — 找到了源头

`packages/core/src/core/openaiContentGenerator/converter.ts:1379-1510` 有一个 `cleanOrphanedToolCalls` 函数：

```typescript
function cleanOrphanedToolCalls(messages) {
  const cleaned = [];
  const toolCallIds = new Set<string>();        // ← Set #1 (line 1383)
  const toolResponseIds = new Set<string>();    // ← Set #2 (line 1384)
  // First pass: collect IDs ...
  // Second pass: filter ...
  const finalToolCallIds = new Set<string>();   // ← Set #3 (line 1459)
  const finalToolResponseIds = new Set<string>(); // ← Set #4 (line 1477)
  // Final validation pass ...
}
```

**单次调用创建 4 个 Set + 3 趟遍历整个 messages 数组 + 多次对象 spread**。栈帧 15 的 `Builtins_SetConstructor` 大概率就是这里某次构造失败。

注意：`anthropicContentGenerator/` 目录下**没有等价的 `cleanOrphanedTools` 函数**——这意味着 Anthropic 路径的孤儿处理可能在客户端缺失，全靠服务端报错（即用户看到的 400）。

### 完整因果链

1. 用户跑了一段时间会话使用 deepseek-v4-pro（**1M 上下文**）
2. 某次模型并行调用 3 个工具（`call_01_*`、`call_02_*`、`call_03_*`）
3. **某种原因**（Ctrl+C / abort / 错误）工具未完成，3 个 `tool_use` 块没有对应 `tool_result`
4. 会话进入**孤儿 tool_use 死锁状态**——任何后续 API 请求都被服务端 400 拒绝
5. 用户看到错误后输入"继续"重试
6. 客户端构造请求 → 调用 `cleanOrphanedToolCalls`（或 Anthropic 路径等价逻辑）
7. **关键**：1M 上下文 + 63 分钟会话，history 已接近 4GB 堆限
8. `new Set<string>()` 构造时分配失败 → OOM
9. `707 步`增量 GC 徒劳挤出 9 MB——history 几乎全部 reachable

### 新维度：会话级死锁阻止 history 收缩

之前所有报告都没暴露这个细节：

- **孤儿 tool_use 状态阻止 turn 完成**
  → microcompaction（按时间清理工具结果）等待"上一个完成的 turn"，被卡死
  → 自动压缩需要等下一个成功 turn，但下一个 turn 永远 400 失败
  → **history 只能增长不能收缩**
- 用户主动输入"继续"重试，进一步放大每次请求的内存占用

本质是一个**会话级死锁**：history 状态错误 → 服务端拒绝 → 客户端重试时再次建请求 → 所有内存压力工具都被触发但**无任何进展**。

### 分类归属

**Scenario A 长会话累积**，新次因："**会话状态死锁场景下 history 无法收缩**"。

### 新增修复项

**P1-11（新）— 孤儿 tool_use 在客户端发请求前主动剪枝**：
- 现有 `cleanOrphanedToolCalls` 在 OpenAI 路径上有，但**它本身就是 4 Set + 3 pass 的内存压力源**
- 应改为**单趟扫描 + 原地修改**（减少 Set 与对象拷贝）
- **Anthropic 路径同样需要等价逻辑**（本次栈帧表明现有逻辑要么没被命中、要么也存在）
- 检测到孤儿 tool_use 时应有用户可见的恢复路径（自动剪枝并提示，而不是无限重试 400）

### 已采取动作

- 信息保留在本调研文档（去掉用户名）
- 未在公开渠道发布（内部 case）

---

## Claude Code 对照设计

通过分析 Claude Code 代码 (`/Users/jinye.djy/Projects/claude-code`)，发现其在内存管理上有几个根本性不同的设计：

### 1. 不在热路径上做深拷贝（最大差异）

`src/QueryEngine.ts:1162`:

```typescript
getMessages(): readonly Message[] {
  return this.mutableMessages  // 返回引用，用 readonly 类型守卫
}
```

查询时仅做一次浅拷贝 (`src/query.ts:365`):

```typescript
let messagesForQuery = [...getMessagesAfterCompactBoundary(messages)]
```

### 2. 单一所有权模型

`QueryEngine.mutableMessages` 是**唯一可信源**。React 状态持有引用而非副本。

### 3. 不使用 Ink `<Static>`

`src/utils/staticRender.tsx:7-9` 明确回避：

> "This is a workaround for the fact that Ink doesn't support multiple `<Static>` components"

替代方案 (`src/components/Messages.tsx:621-623`):

```typescript
if (prev.isStatic && next.isStatic) return true;  // React.memo 跳过 re-render
```

大文本展示层截断 (`UserPromptMessage.tsx`): `MAX_DISPLAY_CHARS = 10_000`

### 4. 基于 heap 的内存监控

`src/hooks/useMemoryUsage.ts`:

- 检测 `process.memoryUsage().heapUsed`（**不是 RSS**）
- 阈值: 1.5GB high, 2.5GB critical
- 配套 `/heapdump` 命令做诊断

### 5. 多层级渐进式压缩

```
snip → time-based microcompact → cached microcompact → session memory compact → full compaction
```

每层比下一层更轻量，全部**原地修改** (in-place mutation)。

### 6. 容器场景下提升堆限

`src/entrypoints/cli.tsx:7-14`:

```typescript
if (process.env.CLAUDE_CODE_REMOTE === 'true') {
  process.env.NODE_OPTIONS = `${existing} --max-old-space-size=8192`;
}
```

---

## 最终总结与行动项

### 三类 OOM 场景汇总

| 场景 | 代表 issue | 触发 | 堆峰值 | 时长 | 关键栈帧 | 修复路径 |
|------|-----------|------|--------|------|----------|---------|
| **A — 长会话 + structuredClone 放大** | #4116（原）、#4315、内部 Case A、**内部 Case B** | idle / 输入 / 任务完成后 / 孤儿 tool_use 死锁 | 2-4 GB | 50 min ~ **19.6 h** | `ValueDeserializer::ReadValue`、`node::worker::StructuredClone`、`StackGuard::HandleInterrupts`、`Builtins_SetConstructor`（孤儿剪枝时） | 减少深拷贝；`readonly` 引用语义；客户端提前剪枝孤儿 tool_use |
| **B — 持续真实泄漏（TLS 子类）** | #2945、#4116 (@Kieaer)、#4322、**#4116 (@maxinteresa-ops, v0.16.0)** | active 流式 / `/resume` / **YOLO mode** | 4-45 GB | 107min ~ 7h | `BIO_ssl_shutdown`、`SSL_get_quiet_shutdown`、`X509_STORE_set_cleanup`、`EVP_MD_CTX_set_update_fn`、`ReportExternalAllocationLimitReached`、`uv_timer_set_repeat` | 流异常退出时 TLS 资源未释放、HTTPS agent pool 不回收、周期性定时器 TLS 清理失败 |
| **B — 持续真实泄漏（defineProperty 子类）** | #2868、**#4167 (@wwwi2vv-dev)** | active 流式 / 错误重试 | 2-8 GB | 100s ~ 17 min | `Object.defineProperty + NameDictionary` 或 regular V8 | 错误克隆链、流 accumulator、writeChain 闭包 |
| **C — 操作期峰值放大** | #4167 | `/compress`、`/resume` | 2-4 GB | 操作触发 | regular GC | 压缩流程双重 stringify、spread 链 |

### 核心理念对比（qwen-code vs Claude Code）

| 维度 | qwen-code 现状 | Claude Code 设计 |
|------|---------------|-----------------|
| 历史所有权 | 多份副本（API + UI + Static） | 单一可变数组 + 引用共享 |
| 访问模式 | 每次调用 `structuredClone` | `readonly` 类型守卫，零拷贝 |
| 渲染层 | Ink `<Static>` 永久保留 | `React.memo` + `isStatic` 跳过 re-render |
| 内存监控 | RSS 7GB（永远不触发） | heapUsed 1.5GB / 2.5GB |
| 压缩触发 | 仅 token 阈值 | token + 时间 + （建议加堆压力） |
| 大文本处理 | 全量保留 | 展示层截断到 10K |

**核心思路**：把"每次访问都深拷贝"的模式改为"单一可变数组 + readonly 类型约束 + 浅拷贝"，从根本上消除内存放大。

### 行动项清单（按优先级）

#### P0 — 立即缓解

| ID | 改动 | 影响场景 | 工作量 | 来源 |
|---|------|---------|--------|------|
| P0-1 | 用户层 workaround：`NODE_OPTIONS=--max-old-space-size=8192` | A、C | - | 已发布 |
| P0-2 | 启动时自动设置堆限（参考 cli.tsx 模式） | A、C | S | Claude Code |
| P0-3 | `getHistory()` 拆分只读引用接口 `getHistoryReadonly()` | A、C | M | Claude Code `getMessages()` |
| P0-4 | 新增 `peekLastHistoryEntry` / `peekHistoryEntry` 修复 `checkNextSpeaker` 双克隆 | A | S | - |
| P0-5 | 消除 `chatCompressionService.ts:297-304` 双重 `JSON.stringify` | C | S | 单趟扫描即可 |
| P0-6 | 内部调用（compression、recap）跳过 chunk accumulator | B、C | M | - |

#### P1 — 结构性改进

| ID | 改动 | 影响场景 | 工作量 |
|---|------|---------|--------|
| P1-1 | 内存监控改 `heapUsed` + 阈值 1.5/2.5 GB | 全部（早预警） | S |
| P1-2 | 堆压力感知压缩触发（不仅看 token） | A | M |
| P1-3 | 流异常退出强制 `stream.return?.()` 释放 | B | S |
| P1-4 | `writeChain` 替换为有界队列 | B | M |
| P1-5 | EventEmitter 订阅 cleanup 审计 | B | M |
| P1-9 | `cloneErrorWithRedactedFields` 改为字符串/原型替换，避免 `Object.defineProperty` 触发字典模式 | B | M |
| P1-10 | 错误链路上限：包装多于 N 层时丢弃中间 `cause` 节点（保留最深处原始错误） | B | M |
| P1-11 | 孤儿 tool_use 在客户端发请求前主动剪枝；`cleanOrphanedToolCalls` 改为单趟扫描；Anthropic 路径补齐等价逻辑 | A（死锁场景） | M |
| P1-12 | 检测到孤儿 tool_use 时给出用户可见的恢复路径（自动剪枝并提示），而不是无限触发 400 重试 | A（死锁场景） | S |
| P1-6 | `/resume` 分块读取 JSONL，避免一次性整文件入内存 | B | M |
| P1-7 | `React.memo + isStatic` 替代 Ink `<Static>` 完全保留 | A、内存常量 | L |
| P1-8 | 大文本展示层截断（10K chars） | A | S |

#### P2 — 长期优化

| ID | 改动 | 影响场景 | 工作量 |
|---|------|---------|--------|
| P2-1 | microcompaction 改为原地修改 | A | M |
| P2-2 | 优化其他 `getHistory()` 调用点（共 9+ 处） | A、C | M |
| P2-3 | 添加 `/heapdump` 命令辅助用户抓快照 | 全部（诊断） | S |
| P2-4 | `/bug` 命令加入 V8 heap 统计输出 | 诊断 | S |
| P2-5 | extraHistory 构造改为 push 而非 spread | C | S |

### 复测方案

为了验证修复效果，建议设计三类回归测试：

**A 类（验证 structuredClone 放大假设）**：

- 长会话场景：连续做 50+ 次小请求
- 观察堆增长曲线，期望基本平稳（不是单调增长）

**B 类（验证流式聚合泄漏假设）**：

- 让模型生成超长响应（一次输出 10+ MB 文本）
- 启动 → 单次大请求 → idle 30 秒 → `global.gc()`（`--expose-gc`）
- 检查 retained heap 应该回落到接近基线

**C 类（验证压缩峰值修复）**：

- 建立 100K token 历史
- 触发 `/compress` 同时监控 `process.memoryUsage().heapUsed` 峰值
- 修复前后峰值差异应该显著（预期下降 50%+）

### 已完成的对外动作

| 时间 | 动作 |
|------|------|
| 2026-05-14 | [#4116 workaround 评论](https://github.com/QwenLM/qwen-code/issues/4116#issuecomment-4447005872) |
| 2026-05-14 | [#4116 完整技术分析评论](https://github.com/QwenLM/qwen-code/issues/4116#issuecomment-4448193086) |
| 2026-05-15 | [#4116 区分两类场景追加评论](https://github.com/QwenLM/qwen-code/issues/4116#issuecomment-4456488521) |
| 2026-05-15 | [#4167 详细分析评论](https://github.com/QwenLM/qwen-code/issues/4167#issuecomment-4458237121) |
| 2026-05-15 | [#4167 跟进评论：@wwwi2vv-dev 8GB 案例分析](https://github.com/QwenLM/qwen-code/issues/4167#issuecomment-4459269515) |
| 2026-05-19 | [#4315 分析评论：19h 长会话输入触发 OOM](https://github.com/QwenLM/qwen-code/issues/4315#issuecomment-4485434397) |
| 2026-05-19 | [#4322 分析评论：第三次 OpenSSL/TLS 帧 OOM](https://github.com/QwenLM/qwen-code/issues/4322#issuecomment-4487156141) |
| 2026-05-19 | [#2868 交叉引用评论：100s 快速崩溃归类到 Scenario B](https://github.com/QwenLM/qwen-code/issues/2868#issuecomment-4487242267) |
| 2026-05-19 | [#2945 交叉引用评论：TLS 子类第一次出现](https://github.com/QwenLM/qwen-code/issues/2945#issuecomment-4487242968) |
| 2026-05-19 | 内部 Case A 入档：6.45h + StackGuard 栈帧（仅文档，未公开） |
| 2026-05-19 | 内部 Case B 入档：孤儿 tool_use 死锁 + new Set 触发 OOM（仅文档，未公开） |
| 2026-05-20 | [#2868 跟进评论：@gkubon 数据点 + 请求完整 stack + heap snapshot 抓取指南](https://github.com/QwenLM/qwen-code/issues/2868#issuecomment-4498312245) |
| 2026-05-23 | [#4116 跟进评论：v0.16.0 升级后 @maxinteresa-ops 仍崩，确认 B-TLS 未修，澄清 #4286 已合并到 v0.16.0](https://github.com/QwenLM/qwen-code/issues/4116#issuecomment-4521009279) |
| 2026-05-23 | [#4116 修正评论：BatchSpanProcessor / LogToSpanProcessor 默认不启用，符号 offset 解读修正](https://github.com/QwenLM/qwen-code/issues/4116#issuecomment-4521113616) |
| 2026-05-23 | 仓库内增加 [`repros/oom-streaming-leak/`](../../repros/oom-streaming-leak/) 本地复现 — V3 实测 OpenAI SDK 5.11.0 + mock SSE 服务器，确认 ~195 KB/iter RSS 累积 |

---

## 附录：相关链接

### 涉及的 issue

- [#4116 - problem critical error](https://github.com/QwenLM/qwen-code/issues/4116)
- [#4167 - cli crashed](https://github.com/QwenLM/qwen-code/issues/4167)
- [#4315 - cli crashed when i was just typing](https://github.com/QwenLM/qwen-code/issues/4315)
- [#4322 - 用着用着, 就这样了](https://github.com/QwenLM/qwen-code/issues/4322)
- [#2868 - Heap out of memory](https://github.com/QwenLM/qwen-code/issues/2868)
- [#2945 - Heap OOM during /resume](https://github.com/QwenLM/qwen-code/issues/2945)
- [#728 - 早期同类 OOM 报告](https://github.com/QwenLM/qwen-code/issues/728)

### 关键代码位置

- `packages/core/src/core/geminiChat.ts:1095` — `getHistory()` `structuredClone` 调用点
- `packages/core/src/services/chatCompressionService.ts:227-393` — 压缩流程
- `packages/core/src/core/openaiContentGenerator/pipeline.ts:129` — 流式 chunk 累积
- `packages/core/src/core/loggingContentGenerator/loggingContentGenerator.ts:398` — Logging chunk 累积
- `packages/core/src/services/chatRecordingService.ts:480-724` — writeChain promise 链
- `packages/cli/src/ui/hooks/useMemoryMonitor.ts:11` — 错位的 RSS 7GB 阈值
- `packages/core/src/core/tokenLimits.ts:129` — 模型上下文窗口配置
- `packages/cli/src/ui/components/MainContent.tsx:355-381` — Ink `<Static>` 使用

### Claude Code 参考位置

- `src/QueryEngine.ts:1162` — `readonly Message[]` 返回模式
- `src/hooks/useMemoryUsage.ts` — 基于 heap 的内存监控
- `src/components/Messages.tsx:621` — `React.memo + isStatic` 优化
- `src/utils/staticRender.tsx:7-9` — 不使用 Ink `<Static>` 的解释
- `src/entrypoints/cli.tsx:7-14` — 容器内自动提升堆限
- `src/services/compact/` — 多层级压缩管道
