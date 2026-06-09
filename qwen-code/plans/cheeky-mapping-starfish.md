# Plan: T2.1 — `loadSession`/`resume` 从 `unstable_` 毕业

## Context

`qwen serve` daemon 的 `POST /session/:id/load` 和 `POST /session/:id/resume` 路由已在 PR #4222 发布，但 ACP 方法名仍为 `unstable_resumeSession`，capability tag 仍为 `unstable_session_resume`。

**核心阻塞问题：** `FileHistoryService` 的快照链完全是内存态——从不写入 JSONL，进程退出即丢失。Resume 后 `/rewind` 对之前的 turn 无效，因为快照链是空的。`restoreFromSnapshots()` 方法存在但从未在生产代码中被调用。

本设计完全替代 PR #4253（已停滞 3 周）的方案。

## PR 结构

**单 PR：File History 快照持久化 & 恢复 + Capability Tag 毕业**

ACP 方法名 rename（`unstable_resumeSession` → `resumeSession`）需要 `@agentclientprotocol/sdk` 升级配合，推迟到 SDK 升级后的独立 PR。本 PR 只做快照持久化 + tag 新增。

---

## Implementation

### 设计决策

1. **每 turn 写一条增量快照**（不是全链）：每次 `makeSnapshot()` 后，将刚创建的单个快照写入 JSONL。Resume 时从 JSONL 收集所有 `file_history_snapshot` 记录重建链。每条 JSONL entry ~8KB（vs 全链 ~800KB）。
2. **不自动恢复文件内容**：resume 不修改用户工作树。只恢复快照链让 `/rewind` 可用。
3. **Rewind 后补录存活快照**（审计 R1-F2）：rewind 会把 pre-rewind 快照放到死分支上，`reconstructHistory()` 排除死分支。`rewindRecording()` 执行后，必须将当前内存中存活的所有快照作为一条复合记录重新写入活跃分支，否则 resume 后会丢失 pre-rewind 历史的 `/rewind` 能力。
4. **MAX_SNAPSHOTS 常量导出**（审计 R1-F5）：从 `fileHistoryService.ts` 导出 `MAX_SNAPSHOTS`，`sessionService.ts` 导入使用，避免硬编码 100。
5. **Backup 文件完整性校验**：restore 后异步检查 `~/.qwen/file-history/<sessionId>/` 下的备份文件是否存在，缺失的标记 `failed`。
6. **Fork 备份迁移**：`forkSession()` 用 hard link（fallback copy）复制备份文件到新 session 目录。
7. **不做 dedup**（审计 R1-F3）：每个快照有唯一 promptId+timestamp，JSON 比较永远不会命中。直接写入，无 dedup 开销。
8. **Date fallback 用 `new Date(0)`**（审计 R1-F7）：malformed date 反序列化用 epoch 而非当前时间，避免误导性时间戳。

### Step 1: 序列化类型 + 序列化/反序列化函数

**文件：`packages/core/src/services/fileHistoryService.ts`**

1a. 导出 `MAX_SNAPSHOTS`（当前 line 101 为 file-scoped const）。

1b. 新增导出类型：

```typescript
export interface SerializedFileHistorySnapshot {
  promptId: string;
  trackedFileBackups: Record<string, SerializedFileHistoryBackup>;
  timestamp: string; // ISO 8601
}

export interface SerializedFileHistoryBackup {
  backupFileName: string | null;
  version: number;
  backupTime: string; // ISO 8601
  failed?: boolean;
}
```

1c. 新增导出函数：

```typescript
export function serializeSnapshot(s: FileHistorySnapshot): SerializedFileHistorySnapshot;
export function deserializeSnapshots(arr: SerializedFileHistorySnapshot[]): FileHistorySnapshot[];
```

`deserializeSnapshots` 对 malformed date 用 `new Date(0)` 作 fallback。

1d. 新增 `validateRestoredSnapshots()` 实例方法：异步检查每个非 null、非 failed 的 `backupFileName` 是否存在于 `~/.qwen/file-history/<sessionId>/`，缺失的设 `failed: true`。使用已有的 `resolveBackupPath()` 函数。

### Step 2: ChatRecordingService 新增子类型和录制方法

**文件：`packages/core/src/services/chatRecordingService.ts`**

2a. `ChatRecord.subtype` 联合类型加 `'file_history_snapshot'`。

2b. 新增 payload 接口并加入 `systemPayload` 联合：
```typescript
export interface FileHistorySnapshotRecordPayload {
  snapshot: SerializedFileHistorySnapshot;
}
```

2c. 新增 `recordFileHistorySnapshot(snapshot: FileHistorySnapshot)` 方法：
- **无 dedup**（审计 R1-F3：每条快照有唯一 promptId，比较永远不命中）
- 内部全程 try-catch 吞错误（审计 R1-F4：与 recordAttributionSnapshot 一致）
- 调用 `serializeSnapshot()` 转换
- 写 `{ type: 'system', subtype: 'file_history_snapshot', systemPayload: { snapshot: serialized } }`

2d. **Rewind 后补录存活快照**（审计 R1-F2）：在 `rewindRecording()` 末尾新增逻辑——接受一个可选的 `fileHistorySnapshots?: FileHistorySnapshot[]` 参数。当有存活快照时，写一条 compound `file_history_snapshot_restore` 记录（或复用 `file_history_snapshot` subtype，payload 改为 `{ snapshots: SerializedFileHistorySnapshot[] }` 数组形式）到活跃分支。这确保 resume 后能看到 rewind 前的快照。

**payload 统一为数组形式**：
```typescript
export interface FileHistorySnapshotRecordPayload {
  snapshots: SerializedFileHistorySnapshot[];
}
```
普通 turn 写 `{ snapshots: [oneSnapshot] }`。Rewind 后写 `{ snapshots: allSurvivingSnapshots }`。`loadSession` 解析时用最后一条 `file_history_snapshot` 记录的 `snapshots` 数组作为完整快照链即可。

**这简化了 loadSession 的解析逻辑**：不需要逐条收集再合并，直接取最后一条记录的完整数组。每条记录都是当前时刻的完整快照链视图。

**⚠️ 但这又回到了"全链"方案的膨胀问题。** 重新评估：

**最终方案——混合策略：**
- 普通 turn：写增量（单条快照）→ `{ snapshots: [latest] }`
- Rewind 后：写全量（所有存活快照）→ `{ snapshots: allSurviving }`
- `loadSession`：收集所有 `file_history_snapshot` 记录，合并所有 `snapshots` 数组，去重（by promptId），取最后 MAX_SNAPSHOTS 条

### Step 3: client.ts 在 makeSnapshot 后录制

**文件：`packages/core/src/core/client.ts`**（~line 1570）

**必须在 makeSnapshot 的 try 块内部**（审计 R1-F1）：
```typescript
if (messageType === SendMessageType.UserQuery) {
  try {
    await this.config.getFileHistoryService().makeSnapshot(prompt_id);
    // 录制到 JSONL（makeSnapshot 成功才录制，避免写入 stale snapshot）
    try {
      const latestSnapshot = this.config.getFileHistoryService().getSnapshots().at(-1);
      if (latestSnapshot) {
        this.config.getChatRecordingService()?.recordFileHistorySnapshot(latestSnapshot);
      }
    } catch (e) {
      debugLogger.error(`FileHistory: recordSnapshot failed: ${e}`);
    }
  } catch (e) {
    debugLogger.error(`FileHistory: makeSnapshot failed: ${e}`);
  }
}
```

外层 try 保护 makeSnapshot，内层 try 保护录制。录制只在 makeSnapshot 成功后执行。

### Step 4: sessionService.loadSession() 解析快照

**文件：`packages/core/src/services/sessionService.ts`**

4a. `ResumedSessionData` 新增可选字段：
```typescript
fileHistorySnapshots?: FileHistorySnapshot[];
```

4b. `loadSession()` 在 `reconstructHistory()` 返回的 messages 中收集 `file_history_snapshot` 记录：
```typescript
import { deserializeSnapshots, MAX_SNAPSHOTS } from './fileHistoryService.js';

const fileHistorySnapshots: FileHistorySnapshot[] = [];
const seenPromptIds = new Set<string>();
for (const msg of messages) {
  if (msg.type === 'system' && msg.subtype === 'file_history_snapshot' && msg.systemPayload) {
    const payload = msg.systemPayload as FileHistorySnapshotRecordPayload;
    for (const s of deserializeSnapshots(payload.snapshots)) {
      if (!seenPromptIds.has(s.promptId)) {
        seenPromptIds.add(s.promptId);
        fileHistorySnapshots.push(s);
      }
    }
  }
}
const capped = fileHistorySnapshots.length > MAX_SNAPSHOTS
  ? fileHistorySnapshots.slice(-MAX_SNAPSHOTS) : fileHistorySnapshots;
```

返回 `{ ...result, fileHistorySnapshots: capped.length > 0 ? capped : undefined }`。

### Step 5: config.getFileHistoryService() 恢复快照

**文件：`packages/core/src/config/config.ts`**（~line 3377）

`getFileHistoryService()` 创建新实例后检查 `this.sessionData?.fileHistorySnapshots`：
```typescript
const snapshots = this.sessionData?.fileHistorySnapshots;
if (snapshots?.length) {
  this.fileHistoryService.restoreFromSnapshots(snapshots);
  void this.fileHistoryService.validateRestoredSnapshots().catch((e) => {
    this.debugLogger.error(`FileHistory: validateRestoredSnapshots failed: ${e}`);
  });
}
```

### Step 6: forkSession() 复制备份文件

**文件：`packages/core/src/services/sessionService.ts`**

新增 async `copyFileHistoryBackups(sourceSessionId, targetSessionId)` 函数：
- 读 `~/.qwen/file-history/<source>/` 目录（ENOENT → 静默返回）
- `mkdir(targetDir, { recursive: true })`
- 对每个文件 `link(src, dst)` → fallback `copyFile(src, dst)`
- Best-effort：失败只 warn

在 `forkSession()` 写完 JSONL 后 `await` 调用（async 函数，non-blocking hard link fast path）。

### Step 7: rewindRecording 集成

**文件：`packages/core/src/services/chatRecordingService.ts`**

修改 `rewindRecording()` 签名：
```typescript
rewindRecording(
  targetTurnIndex: number,
  payload: RewindRecordPayload,
  survivingFileHistorySnapshots?: FileHistorySnapshot[],
): void
```

在现有逻辑末尾（rewind record 写入后），如果 `survivingFileHistorySnapshots?.length`，录制一条 `file_history_snapshot` 记录（`{ snapshots: serializeAll }`）到活跃分支。

**调用方**：`AppContainer.tsx` 或 `restoreCommand.ts` 中 `rewindRecording` 的调用处，需要传入 `getFileHistoryService().getSnapshots()`。

### Step 8: 新增稳定 capability tag

**文件：`packages/cli/src/serve/capabilities.ts`**

```typescript
session_resume: { since: 'v1' },
// 弃用别名，保留至 @agentclientprotocol/sdk 支持稳定方法名后移除
unstable_session_resume: { since: 'v1' },
```

注：capability tag 纯信息性（审计 R2-F3）。SDK `DaemonClient.resumeSession()` 直接调 HTTP `POST /session/:id/resume`，不检查 tag。Tag 毕业是给第三方客户端的信号。ACP 方法名 rename 推迟到 SDK 升级后的独立 PR。

---

## 关键文件

| File | Action |
|------|--------|
| `packages/core/src/services/fileHistoryService.ts` | +导出 MAX_SNAPSHOTS +序列化类型/函数 +validateRestoredSnapshots |
| `packages/core/src/services/chatRecordingService.ts` | +subtype +payload +recordFileHistorySnapshot +rewindRecording 集成 |
| `packages/core/src/services/sessionService.ts` | +解析快照 +copyFileHistoryBackups +ResumedSessionData 扩展 |
| `packages/core/src/config/config.ts` | getFileHistoryService() 恢复逻辑 |
| `packages/core/src/core/client.ts` | makeSnapshot 后录制（内层 try-catch） |
| rewind 调用方（AppContainer/restoreCommand） | 传 survivingSnapshots 给 rewindRecording |
| `packages/cli/src/serve/capabilities.ts` | +session_resume tag |

## 向后兼容

- 旧 session 无 `file_history_snapshot` 记录 → `loadSession` 返回 `undefined` → 跳过恢复 → 行为不变
- 旧 daemon 遇到新 JSONL 中的 `file_history_snapshot` → 未知 subtype 被 `reconstructHistory` 正常包含但被忽略 → 无影响
- `unstable_session_resume` tag 和 `unstable_resumeSession` 方法保留至 SDK 升级

## HistoryReplayer 容忍性

`HistoryReplayer` 处理 system records 时只关注 `slash_command` subtype（有 `phase: 'result'`），其他 system subtypes 被跳过。`file_history_snapshot` 会被静默忽略。需加一个测试验证。

## JSONL 膨胀评估（审计 R1-F6）

- 普通 turn：1 条快照 ~8KB（100 个 tracked files × 80 bytes/entry）
- 100 turns 增加 ~800KB 快照数据
- Rewind 后全量补录：与 MAX_SNAPSHOTS × files 成正比，最大 ~800KB/条
- 可接受：attribution_snapshot 已有类似量级；JSONL 文件通常 50-200MB

## 验证

```bash
# Unit tests
npx vitest run packages/core/src/services/fileHistoryService.test.ts
npx vitest run packages/core/src/services/chatRecordingService.test.ts
npx vitest run packages/core/src/services/sessionService.test.ts

# 关键测试用例：
# 1. serialize/deserialize round-trip
# 2. deserialize with malformed dates → Date(0) fallback
# 3. recordFileHistorySnapshot 写入 JSONL
# 4. loadSession 从 JSONL 解析快照
# 5. loadSession 旧 session 无快照 → undefined
# 6. rewind-before-resume：rewind 后补录的全量快照在 resume 后可见
# 7. validateRestoredSnapshots 标记缺失备份为 failed
# 8. forkSession 复制备份文件
# 9. HistoryReplayer 跳过 file_history_snapshot records
# 10. resume → /rewind 到 pre-resume turn → 文件恢复

# Capability tests
npx vitest run packages/cli/src/serve/capabilities.test.ts
```

## 预估

| 新增行数 | 修改行数 |
|---------|---------|
| ~305 | ~55 |

## 审计记录

| Round | Finding | Severity | Resolution |
|-------|---------|----------|------------|
| R1-F1 | Step 3 录制在 try 块外，makeSnapshot 失败写 stale snapshot | Critical | 移到 try 块内，内层 try-catch 隔离录制错误 |
| R1-F2 | Rewind+resume 丢失 pre-rewind 快照 | Critical | rewindRecording 后补录存活快照到活跃分支 |
| R1-F3 | Dedup 无效（唯一 promptId/timestamp） | Important | 移除 dedup，直接写入 |
| R1-F4 | Step 3 缺错误隔离 | Important | 内层 try-catch + method 内部 try-catch |
| R1-F5 | MAX_SNAPSHOTS 硬编码 100 | Important | 导出常量，sessionService 导入 |
| R1-F6 | 大会话 JSONL 膨胀 | Important | 评估可接受（~800KB/100turns），文档化 |
| R1-F7 | Date fallback new Date() 误导 | Minor | 用 new Date(0) |
| R2-F1 | ClientSideConnection 无 resumeSession | Critical | PR2 缩减为仅 tag，方法 rename 推迟 |
| R2-F2 | AgentSideConnection dispatch 硬编码 unstable_ | Critical | 同上 |
| R2-F3 | Capability tag 纯信息性 | Important | 文档化，SDK 不检查 tag |

## Final Implementation Status

- **PR status**: #4253 — OPEN (not yet merged), #4222 — MERGED on 2026-05-17
- **What was implemented**: PR #4222 shipped daemon session load/resume. PR #4253 implements file history snapshot persistence (the PR1 portion of this plan) and is still open/in-review.
- **Key divergences**: The plan proposed two PRs (PR1: snapshot persistence, PR2: capability tag graduation). PR #4222 handled the load/resume route; #4253 addresses the snapshot persistence. The capability tag graduation (PR2) appears not yet submitted as a separate PR.
- **Files actually changed (PR #4253)**: `packages/core/src/config/config.ts`, `packages/core/src/core/client.ts`, `packages/core/src/services/chatRecordingService.ts`, `packages/core/src/services/fileHistoryService.ts`, `packages/core/src/services/sessionService.ts` (+ tests) — closely matches the plan's PR1 file list.
