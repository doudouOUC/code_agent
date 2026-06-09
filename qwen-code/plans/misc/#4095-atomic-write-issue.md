# Phase 4: Tool Result Disk Overflow 设计方案

## Context

Issue #4095 Phase 4 要求将超大工具输出溢出到磁盘，防止 OOM 和上下文污染。qwen-code 已有基础截断（`truncation.ts`），但仅 Shell/MCP 工具使用，且截断文件用随机文件名、无清理机制。本方案在现有基础上增量改进。

经过八轮独立审计（正确性 + 架构 + 边界条件 + 安全/鲁棒性 + 实现缺口 + 一致性 + 完整性 + 运维/UX），方案已修订。

## 方案概述

```
Tool.execute() → ToolResult
  → [Shell/MCP] 现有 truncateToolOutput()（保持不变）
  → PostToolUse hooks
  → [NEW] maybePersistLargeToolResult()  ← 通用截断门
       → 检测已截断标记 → 跳过（防双文件）
       → 超阈值: atomicWriteFile → tool-results/<sanitized-callId>.txt
       → 替换 text parts，保留 media parts
       → 未超: 直通
  → conditional rules / system-reminders 追加
  → convertToFunctionResponse() → history

[启动时 + /clear + 周期性] cleanupOldToolResults()
```

## 四轮审计发现汇总及修订

### 第 1-2 轮

| # | 问题 | 严重度 | 修订 |
|---|------|--------|------|
| 1 | `contentLength` 在门之前捕获，替换后 stale | Critical | 门运行后对所有 PartListUnion 变体重新计算 |
| 2 | Shell/MCP 截断 + system-reminder 可能双文件 | Critical | 门移到 system-reminder 之前 |
| 3 | worktree `getProjectTempDir()` 路径不同 | Critical | 清理扫描全局临时目录 |
| 4 | 仅启动时清理不够 | High | `/clear` + 周期性清理 |
| 5 | MCP 多 Part 合计可能超阈值 | Important | 门对多 Part 结果生效 |
| 6 | system-reminder 被持久化到磁盘 | Important | 门在 system-reminder 之前（同 #2） |
| 7 | 错误结果（大 stderr）绕过门 | Important | 错误分支也加大小检查 |
| 8 | 4a+4b 应合并，4c 与 microcompact 重复 | Medium | 合并，删除 4c |
| 9 | `flag: 'wx'` 多余 | Low | 用 `atomicWriteFile`（同时解决权限和 symlink） |
| 10 | 会话恢复后文件可能已清理 | Important | stub 注明文件可能过期 |

### 第 3 轮（边界条件）

| # | 问题 | 严重度 | 修订 |
|---|------|--------|------|
| C1 | Shell/MCP 截断后内容 ≈ threshold+425 chars，门**必定**触发双文件 | Critical(97%) | 门检测 `[CONTENT TRUNCATED]` 标记，已截断内容跳过 |
| I1 | Part[] 替换为 string stub 会丢失 inlineData/fileData | Important(88%) | 仅替换 text parts，保留 media parts，返回 Part[] |
| I2 | Part.functionResponse（子 agent 结果）未在 text 提取中处理 | Important(85%) | text 提取递归处理 functionResponse.response |
| I3 | 错误分支插入点范围很窄（lines 3061-3070） | Important(83%) | 精确定位到 additionalContext 之后、new Error 之前 |
| I4 | 接口名写错 "ConfigParams" → "ConfigParameters" | Important(89%) | 修正 |
| I5 | line 2930 在表达式内部，非语句边界 | Important(86%) | 插入点改为 line 2911-2913 之间 |
| I6 | QWEN_RUNTIME_DIR 变化时清理遗漏 | Important(80%) | 文档化为已知限制 |

### 第 4 轮（安全/鲁棒性）— 已修订

| # | 问题 | 严重度 | 修订 |
|---|------|--------|------|
| F1 | 磁盘写入失败时 fallback 静默吞错误 | Critical | 添加 warn 日志 + 遥测事件 |
| F8 | 大输出 writeFile 双缓冲可能 OOM | Critical | 超 10MB 用流式写入；加 50MB 硬上限 |
| F2 | 无磁盘空间预算 | High | 加 per-session 500MB 累计上限 |
| F5 | 文件权限 world-readable | High | atomicWriteFile mode: 0o600 |
| F6 | symlink 攻击 | High | atomicWriteFile noFollow: true |
| F9 | 现有 truncateAndSaveToFile catch 静默吞错误 | High | 添加 warn 日志（顺带修复） |
| F3 | callId 无路径遍历防护 | Medium | path.basename() 消毒 |
| F4 | 清理竞态（并发删除） | Medium | 删除时 catch ENOENT |
| F7 | 2KB preview 可能泄露敏感数据 | Medium | 文档化为已知限制 |
| F10 | contentLength 重算不完整 | Medium | 对所有 PartListUnion 变体重算 |
| F11 | fire-and-forget 隐藏系统性失败 | Medium | 清理结果 debug 日志，errors>0 时 warn |

---

## 实现计划

### 1. `packages/core/src/config/storage.ts` — 添加存储目录

```typescript
getToolResultsDir(): string {
  return path.join(this.getProjectTempDir(), 'tool-results');
}
```

### 2. `packages/core/src/utils/truncation.ts` — 添加持久化函数 + 修复现有问题

**前置**：`truncation.ts` 需添加 `createDebugLogger('TRUNCATION')` import（当前只有 telemetry logger）。

**修复现有问题**：`truncateAndSaveToFile` line 101 的 catch 块添加 warn 日志：
```typescript
} catch (error) {
  debugLogger.warn(`Failed to save truncated output to ${outputFile}: ${error}`);
  return { content: truncatedContent + '\n[Note: Could not save full output to file]' };
}
```

**新增 `persistAndTruncateToolResult(callId, toolName, content, config, sessionBudget)`**：

```typescript
interface PersistResult {
  content: string;
  outputFile?: string;
  bytesWritten: number;
}
```

流程：
1. **callId 消毒**：`path.basename(callId)` 防路径遍历，再用 `Storage.assertPathWithinDirectory()` 验证
2. **大小上限**：超 50MB 的内容不写磁盘，仅内存截断（防 OOM）
3. **session 预算检查**：累计已写**字节**（`Buffer.byteLength`）> 500MB 时跳过磁盘写入，仅内存截断 + warn 日志
4. **大小检查用 `Buffer.byteLength(content, 'utf-8')` 而非 `string.length`**（CJK 文本 1 char = 3 bytes，char 计数会严重低估磁盘占用）
5. **写入方式**：统一用 `atomicWriteFile(path, content, { mode: 0o600, noFollow: true, flush: false })`。不分流式/非流式——content 已是内存中的 string，分块写入不减少峰值内存，反而绕过 atomicWriteFile 的安全保护（noFollow/EPERM retry/ownership preservation）
5. **生成 stub**：使用 `<persisted-output>` XML 标签包装（便于下游 compaction/microcompact 识别），配合系统提示教模型识别：
   ```
   <persisted-output>
   Output too large (145,230 chars). Full output saved to: /path/to/tool-results/<callId>.txt
   Note: this file may be cleaned up after 24 hours.
   To read the complete output, use the read_file tool with the absolute file path above.
   The truncated output below shows the beginning of the content.

   Preview (first 2000 chars):
   <preview content>
   ...
   </persisted-output>
   ```
   同时在 `packages/core/src/core/prompts.ts` 的系统提示中添加一段简短说明：
   ```
   When you see a <persisted-output> tag in a tool result, the full output was saved to disk.
   Use the read_file tool to access the complete content if the preview is insufficient.
   ```
6. **失败处理**：catch 中 warn 日志 + 遥测事件，fallback 到内存截断（`truncateAndSaveToFile`）

**新增 `isAlreadyTruncated(content: string): boolean`**：
- 使用 `content.includes('... [CONTENT TRUNCATED] ...')` 子串匹配（标记文本足够独特，误判风险可接受）
- 覆盖 shell/MCP 截断产生的标记
- 门用此跳过已截断内容，**防双文件**

### 3. `packages/core/src/core/coreToolScheduler.ts` — 通用截断门

**新增常量**：
```typescript
const GATE_HEADROOM = 3000; // chars — 给工具 header/footer 留余量
const GATE_EXEMPT_TOOLS = new Set(['read_file']); // 恢复工具永远跳过门
```

**新增 `maybePersistLargeToolResult(callId, toolName, content)`**：

```typescript
private async maybePersistLargeToolResult(
  callId: string,
  toolName: string,
  content: PartListUnion,
): Promise<PartListUnion>
```

**三重跳过逻辑（防级联循环 — 审计 9 Critical 发现）**：
1. **工具豁免**：`GATE_EXEMPT_TOOLS.has(toolName)` → 跳过。`read_file` 是恢复机制，被 gate 会造成 read→persist→read 无限循环。与 claude-code `FileReadTool.maxResultSizeChars = Infinity` 一致。
2. **已截断检测**：`isAlreadyTruncated(textContent)` → 跳过。Shell/MCP 截断后的内容不需要再持久化。
3. **门阈值**：`gateThreshold = configThreshold + GATE_HEADROOM`（25K + 3K = 28K）。read_file/grep/ripGrep 截断到 25K 后加 header 约 25.1K，在 28K 内不触发。只有真正未截断的大输出（>28K）才触发门。

**text 提取逻辑**（处理所有 PartListUnion 变体）：
- `string`：直接测量
- `Part` with `.text`：测量 `.text`
- `Part` with `.functionResponse`：递归提取 `.response.output` 或 `.response.content`
- `Part[]`：遍历所有 Part，sum text 长度
- `Part` with `.inlineData` / `.fileData`：跳过不计

**替换逻辑**：
- `string` 内容 → 替换为 stub string
- `Part[]` 内容 → **仅替换 text parts 为 stub，保留 inlineData/fileData parts**（**解决 I1 media 丢失**）
- 返回类型与输入类型一致

**插入位置**：line 2911（PostToolUse shouldStop 子块 `}` 之后）到 line 2913（filesystem paths 收集注释之前）：
```typescript
// line 2911: } // shouldStop sub-block end

// 通用截断门 — PostToolUse 之后、system-reminder 之前
content = await this.maybePersistLargeToolResult(callId, toolName, content);

// line 2913: // Collect filesystem paths...
```

**contentLength 重算**（注意：line 2839 的 `const contentLength` 需改为 `let`）：
```typescript
const recalcLength = (c: PartListUnion): number | undefined => {
  if (typeof c === 'string') return c.length;
  if (Array.isArray(c)) return c.reduce((n, p) => n + (p.text?.length ?? 0), 0);
  if ('text' in c && typeof c.text === 'string') return c.text.length;
  return undefined;
};
contentLength = recalcLength(content) ?? contentLength;
```

**错误分支**（line 3068-3069，addToolResultAttributes 之后、`const error = new Error` 之前）：
```typescript
// 错误分支大输出检查
const gateThreshold = this.config.getTruncateToolOutputThreshold() + GATE_HEADROOM;
if (errorMessage.length > gateThreshold && !isAlreadyTruncated(errorMessage)) {
  const result = await persistAndTruncateToolResult(callId, toolName, errorMessage, this.config);
  errorMessage = result.content;
}
```

**session 预算追踪**：`CoreToolScheduler` 是 per-query/per-agent 实例化的（`agent-core.ts:1082` 每轮新建），不能在其上追踪。在 `Config` 类中添加共享预算对象：
```typescript
private readonly toolResultBudget = { bytesWritten: 0 };
trackToolResultBytes(n: number): void { this.toolResultBudget.bytesWritten += n; }
getToolResultBytesWritten(): number { return this.toolResultBudget.bytesWritten; }
```
使用对象引用（非原始值）是因为 sub-agent 通过 `Object.create(parentConfig)` 继承 Config——原始值字段在子对象上赋值时会创建 own property 导致计数器分裂，而对象引用通过原型链查找返回同一堆对象，mutations 共享。

**预算重置**：在 `Config.startNewSession()`（config.ts line 2038）中添加 `this.toolResultBudget.bytesWritten = 0`，与现有 `fileReadCache.clear()` 并列。确保 `/clear`、`/reset`、`/new` 后预算清零。

### 4. `packages/core/src/utils/toolResultCleanup.ts` — 新文件

```typescript
export async function cleanupOldToolResults(
  globalTempDir: string,
  maxAgeMs: number,
): Promise<{ filesDeleted: number; bytesFreed: number; errors: number }>
```

- 扫描 `globalTempDir` 下所有项目子目录的 `tool-results/` + `*.output`
- 按 mtime 判断，超过 `maxAgeMs` 则 `unlink()`
- 每个 `unlink` catch ENOENT（**解决并发竞态 F4**）
- 返回统计结果

### 5. `packages/core/src/config/config.ts` — 配置

`ConfigParameters`（**修正接口名 I4**）添加：
```typescript
toolResultsMaxFileAgeMinutes?: number;  // 默认 1440（24h），-1 禁用
```

### 6. `packages/core/src/core/client.ts` — 集成清理

- **会话启动时**：fire-and-forget，结果 debug 日志，errors>0 warn 日志
- **`resetChat()`**：也触发清理（与 `FileReadCache.clear()` 并列）
- **周期性**：每 100 次工具调用检查一次（piggyback 在现有 tool execution 计数上），仅当上次清理超过 1 小时才执行

## 关键文件清单

| 文件 | 改动 |
|------|------|
| `packages/core/src/config/storage.ts` | 添加 `getToolResultsDir()` |
| `packages/core/src/utils/truncation.ts` | 修复 catch 日志 + 添加 `persistAndTruncateToolResult()`、`isAlreadyTruncated()` |
| `packages/core/src/core/coreToolScheduler.ts` | 添加 `maybePersistLargeToolResult()` + 错误分支检查 + session 预算 |
| `packages/core/src/utils/toolResultCleanup.ts` | 新文件 |
| `packages/core/src/config/config.ts` | 添加 `toolResultsMaxFileAgeMinutes` 到 `ConfigParameters` + session 预算追踪（共享对象引用） |
| `packages/core/src/core/client.ts` | 启动/clear/周期性清理集成 |
| `packages/core/src/core/prompts.ts` | 系统提示添加 `<persisted-output>` 说明 |
| `packages/core/src/telemetry/types.ts` | 新增 `ToolResultPersistedEvent`（区别于现有 `ToolOutputTruncatedEvent`） |
| `packages/cli/src/config/settingsSchema.ts` | 添加 `toolResultsMaxFileAgeMinutes` schema 条目 |

**跨 package 注意**：`toolResultCleanup.ts` 在 core package，被 `client.ts`（也在 core）调用——无需从 `index.ts` 导出。如果 CLI package 也需调用，再导出。

## 安全措施

| 措施 | 解决问题 |
|------|---------|
| `atomicWriteFile` + `mode: 0o600` | 文件权限不泄露（F5） |
| `atomicWriteFile` + `noFollow: true` | 防 symlink 攻击（F6） |
| `path.basename(callId)` + `assertPathWithinDirectory()` | 防路径遍历（F3） |
| 50MB 单文件上限（`Buffer.byteLength`）| 防 OOM（F8）|
| 500MB session 累计上限 | 防磁盘耗尽（F2） |
| 失败时 warn 日志 + 遥测 | 防静默吞错误（F1, F9） |
| 清理时 catch ENOENT | 防并发竞态（F4） |

## 已知限制（接受的权衡）

1. **单阈值**：工具级截断和调度器级持久化共用 25K 阈值。提高阈值会同时放松两层。
2. **会话恢复后文件可能已清理**：stub 注明 24h 过期，模型仍有 2KB preview。
3. **无 per-message 聚合预算**：N 个并行工具各自 < 25K 但合计可能很大。
4. **2KB preview 可能含敏感数据**：与现有截断行为一致，stub 持久化在 JSONL 中。
5. **QWEN_RUNTIME_DIR 变化时清理遗漏**：不同 runtime dir 下的文件不会被跨目录清理。
6. **`atomicWriteFile` + `noFollow` 在 EXDEV 路径上用 O_EXCL**：如果 tool-results 在不同文件系统（罕见），且文件已存在，会返回 EEXIST。门的 catch 应将 EEXIST 视为"已持久化"并跳过写入。
7. **后台 agent 通知 `<result>` XML 绕过门**：`BackgroundTaskRegistry.emitNotification()` 把完整 agent summary 作为 user message 注入，不经过工具结果门。当前不处理，留作后续 notification 大小上限 feature。
8. **遥测事件**：新增 `ToolResultPersistedEvent`（含 `bytes_written`、`output_file`），与现有 `ToolOutputTruncatedEvent` 区分来源。
9. **read_file/grep/ripGrep 级联循环（审计 9 Critical）**：这些工具截断到 25K 后加 header 约 25.1K，略超 25K 阈值。若门用相同阈值，read_file 读持久化文件 → 门再次触发 → 无限循环。修复：门阈值 = 配置阈值 + 3K headroom（28K），read_file 工具永远豁免。
10. **contentLength 是 const（审计 10）**：line 2839 需改为 `let` 才能重赋值。
11. **chars vs bytes 混淆（审计 11 Critical）**：CJK 文本 1 char = 3 bytes UTF-8，`string.length` 低估磁盘占用。50MB/500MB 限制必须用 `Buffer.byteLength` 而非 `string.length`。
12. **流式写入无实际内存收益且绕过安全保护（审计 11）**：content 已是内存 string，分块不减少峰值内存。统一用 `atomicWriteFile`。
13. **预算跨 /clear 不重置（审计 11+12）**：在 `Config.startNewSession()` 中重置 `bytesWritten = 0`。
14. **叙述与代码自相矛盾（审计 12）**：已修正，统一使用 `<persisted-output>` 标签。

## 验证

### 单元测试

1. `npx vitest run packages/core/src/utils/truncation.test.ts`
   - `persistAndTruncateToolResult`：文件创建、preview、callId 消毒、大文件流式写入、50MB 上限、500MB session 预算、写入失败 fallback
   - `isAlreadyTruncated`：检测 `[CONTENT TRUNCATED]` 标记

2. `npx vitest run packages/core/src/core/coreToolScheduler.test.ts`
   - 小输出透传、大 string 截断、大 Part[] 截断保留 media、已截断内容跳过（防双文件）
   - Part.functionResponse 文本提取、错误分支大 stderr 截断
   - contentLength 重算三种变体
   - 并发 5 工具无竞态

3. `npx vitest run packages/core/src/utils/toolResultCleanup.test.ts`
   - 旧文件删除、新文件保留、ENOENT 容忍、目录不存在 graceful、统计正确

### 手动验证

4. 执行大输出命令（`find / -name "*.ts" 2>/dev/null | head -50000`）→ 验证截断+文件创建+stub
5. `tool-results/` 目录结构按 callId 命名
6. `/clear` 触发清理
7. 文件权限 `ls -la` 验证 0o600

## Final Implementation Status

- **PR status**: No merged PR. Issue #4095 remains OPEN. Related PRs #4520 and #4880 are still OPEN as of 2026-06-09.
- **Summary**: This plan has not been implemented yet. The design was completed (8 rounds of audit) but no PR was merged implementing the `maybePersistLargeToolResult()` gate, `toolResultCleanup.ts`, or the session budget tracking described in this plan.
- **Key divergences**: N/A (not yet implemented).
- **Related open work**: #4520 "fix(core): truncate model-facing tool output" and #4880 "feat(core): layered tool-output truncation, per-message budget, per-tool limits" appear to be alternative/evolved approaches to the same problem space.
