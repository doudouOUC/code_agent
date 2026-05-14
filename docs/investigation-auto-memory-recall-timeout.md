# Auto-Memory Recall 100% 超时失败调查报告

**日期**: 2026-05-14
**调查人**: jinye
**影响范围**: qwen-code 所有启用 managed auto-memory 的会话

---

## 1. 现象

通过 ARMS 链路追踪发现 auto-memory recall 功能存在严重问题：**最近 30 天内所有触发模型调用的 memory recall 请求全部超时失败，成功率为 0%。**

具体表现：用户保存的记忆文件虽然存在于磁盘上，但从未在对话中被智能召回。每次 recall 均因超时返回空结果，memory 功能形同虚设。

---

## 2. 总结

| 指标 | 数值 |
|---|---|
| 统计周期 | 最近 30 天（2026-04-14 ~ 2026-05-14） |
| 总 user prompt 数 | 49 |
| 触发 memory recall 次数 | 56 |
| 成功次数 | **0** |
| 失败次数 | **56（100%）** |

### 失败原因拆分

| 错误类型 | 错误信息 | 次数 | 说明 |
|---|---|---|---|
| `APIUserAbortError` | Request was aborted. | 19 | 内层 1s 超时触发 abort |
| `DOMException` | This operation was aborted | 7 | 同上，不同 abort 路径 |
| `APIError` | 406 status code (no body) | 1 | API 服务端拒绝 |
| _(无模型调用)_ | docs_scanned=0 | 29 | 无 memory 文件，未触发模型调用 |

### 触发了模型调用的 recall（docs_scanned >= 1）

| docs_scanned | 次数 | 平均耗时 |
|---|---|---|
| 1 | 21 | 1088ms |
| 2 | 4 | 841ms |
| 3 | 2 | 1067ms |

**27 次有文档需要选择的 recall 全部超时被 abort，没有一次成功返回。**

### 按模型拆分

| 模型 | 次数 | 平均耗时 | 状态 |
|---|---|---|---|
| glm-5 | 19 | 1005ms | 全部失败 |
| qwen3.5-flash | 8 | 908ms | 全部失败 |

两个模型都无法在 1 秒内完成 side query，qwen3.5-flash 略快但仍卡在超时边缘。

---

## 3. 调查步骤

### 3.1 ARMS 单条 Trace 分析

使用 `aliyun arms GetTrace` 查询了一条具体 trace（`traceId=abfd2b49bd9bd9c1a03cb0a2cf1e3f77`）：

```bash
now_ms=$(($(date +%s) * 1000))
start_ms=$(( ($(date +%s) - 30*86400) * 1000 ))

aliyun arms GetTrace \
  --RegionId cn-zhangjiakou \
  --TraceID abfd2b49bd9bd9c1a03cb0a2cf1e3f77 \
  --StartTime "$start_ms" --EndTime "$now_ms" \
  --endpoint arms.cn-zhangjiakou.aliyuncs.com
```

该 trace 包含 60 个 span，时间线分析显示：

```
20:40:58.337  user_prompt "say hi"
20:40:58.385  api.generateContent (side-query:auto-memory-recall) 开始
20:40:59.392  api.generateContent 被 abort (1007ms)    ← 内层 1s 超时
20:40:59.397  memory.recall span 结束 (1058ms)
20:40:59.398  api.generateContentStream (主请求) 开始   ← 差 6ms
```

memory recall 的模型调用在 1007ms 时被 abort，主请求几乎同时开始（差 6ms）。abort 时间远小于外层 2.5s deadline，说明是内层超时触发。

### 3.2 代码溯源：双层超时机制

**内层超时** — `packages/core/src/memory/relevanceSelector.ts:95-96`：

```typescript
abortSignal: callerAbortSignal
  ? AbortSignal.any([AbortSignal.timeout(1_000), callerAbortSignal])
  : AbortSignal.timeout(1_000),
```

side query 的模型调用有 **1 秒硬超时**（`AbortSignal.timeout(1_000)`）。

**外层 deadline** — `packages/core/src/core/client.ts:152-168`：

```typescript
async function resolveAutoMemoryWithDeadline(promise, onDeadline) {
  const deadline = new Promise((resolve) => {
    timer = setTimeout(() => {
      onDeadline();            // → recallAbortController.abort()
      resolve(EMPTY_RESULT);
    }, 2_500);                 // 2.5s deadline
  });
  return await Promise.race([promise, deadline]);
}
```

整个 recall 流程（含 heuristic fallback）有 **2.5 秒 deadline**。

**实际触发的是内层 1 秒超时**，而非外层 2.5 秒。

### 3.3 SLS 聚合验证

从 ARMS trace app 反推 SLS 存储位置，进行 30 天数据聚合：

```bash
# 1. 获取 trace app 信息
aliyun arms ListTraceApps --RegionId cn-zhangjiakou \
  --endpoint arms.cn-zhangjiakou.aliyuncs.com
# → AppName: qwen-code, PID: bbvzdnvk69@851d5d500f08f92, Type: XTRACE

# 2. 找到 XTRACE 对应的 SLS project
aliyun sls ListProject --endpoint cn-zhangjiakou.log.aliyuncs.com \
  --projectName "xtrace"
# → proj-xtrace-5c7b1bbaa7f252f8e8cffb39da9195be-cn-zhangjiakou

# 3. 确认 logstore（逐个 count(*) 确认数据在 logstore-tracing）
aliyun sls ListLogStores \
  --endpoint cn-zhangjiakou.log.aliyuncs.com \
  --project proj-xtrace-5c7b1bbaa7f252f8e8cffb39da9195be-cn-zhangjiakou
# → logstore-tracing（有数据）

# 4. 按 error_type 聚合 auto-memory-recall 失败
now_sec=$(date +%s); start_sec=$((now_sec - 30*86400))
aliyun sls GetLogs \
  --endpoint cn-zhangjiakou.log.aliyuncs.com \
  --project proj-xtrace-5c7b1bbaa7f252f8e8cffb39da9195be-cn-zhangjiakou \
  --logstore logstore-tracing \
  --from "$start_sec" --to "$now_sec" \
  --query "servicename: qwen-code AND spanname: qwen-code.api_error \
    | select json_extract_scalar(attributes, '\$.error_type') as error_type, \
             json_extract_scalar(attributes, '\$.error_message') as error_msg, \
             count(*) as cnt \
      from log \
      where json_extract_scalar(attributes, '\$.prompt_id') = 'side-query:auto-memory-recall' \
      group by error_type, error_msg \
      order by cnt desc"

# 5. 按 docs_scanned 分组统计
aliyun sls GetLogs \
  --endpoint cn-zhangjiakou.log.aliyuncs.com \
  --project proj-xtrace-5c7b1bbaa7f252f8e8cffb39da9195be-cn-zhangjiakou \
  --logstore logstore-tracing \
  --from "$start_sec" --to "$now_sec" \
  --query "servicename: qwen-code AND spanname: qwen-code.memory.recall \
    | select json_extract_scalar(attributes, '\$.docs_scanned') as docs_scanned, \
             count(*) as cnt, \
             avg(duration/1000000) as avg_ms \
      from log \
      group by docs_scanned \
      order by cnt desc"
```

---

## 4. 结论

### 根因

`relevanceSelector.ts` 中 side query 的 `AbortSignal.timeout(1_000)`（1 秒超时）对于当前使用的模型来说**过于激进**。glm-5 平均响应时间约 1005ms，qwen3.5-flash 约 908ms，均刚好卡在 1 秒阈值附近，导致 100% 超时。

这个 1 秒超时沿用的是上游 Claude Code 中 Anthropic API 的延迟特征（Anthropic Haiku 模型通常在 500ms 内返回 side query 结果）。Qwen Code fork 后未调整该配置，但 glm-5 和 qwen3.5-flash 通过 OpenAI 兼容接口的延迟更高。

### 影响

- Auto-memory recall 功能完全失效：模型无法根据上下文选择相关记忆，所有 recall 均返回空结果
- 用户手动保存的记忆文件虽然存在，但从未在对话中被智能召回
- 每次失败的 recall 会产生一次无效 API 调用，浪费约 1 秒延迟和 token 消耗

### 建议修复

**方案 A（推荐）**：将内层超时从 1s 提高到 2s

```typescript
// packages/core/src/memory/relevanceSelector.ts:95-96
abortSignal: callerAbortSignal
  ? AbortSignal.any([AbortSignal.timeout(2_000), callerAbortSignal])
  : AbortSignal.timeout(2_000),
```

外层 2.5s deadline 仍然兜底，最坏情况用户多等 1 秒。

**方案 B**：去掉内层超时，只依赖外层 2.5s deadline

```typescript
abortSignal: callerAbortSignal ?? undefined,
```

更简单，但可能让慢请求多等 1.5 秒。

---

## 附录：关键文件索引

| 文件 | 关键行 | 说明 |
|---|---|---|
| `packages/core/src/memory/relevanceSelector.ts` | L95-96 | 内层 1s 超时（根因） |
| `packages/core/src/core/client.ts` | L152-168 | 外层 2.5s deadline |
| `packages/core/src/core/client.ts` | L972-1005 | recall 发起与 abort 控制 |
| `packages/core/src/utils/sideQuery.ts` | L98 | side query prompt_id 生成 |
