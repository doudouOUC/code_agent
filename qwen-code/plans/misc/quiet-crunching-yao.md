# Plan: 移除 GitService，将 /restore 迁移到 FileHistoryService

## Context

qwen-code 有两套并行的文件恢复系统：
- `/restore` — 基于 `GitService`（shadow git），per-tool-call 快照，gated by `checkpointing`（默认关）
- `/rewind` — 基于 `FileHistoryService`（per-file copy），per-turn 快照，gated by `fileCheckpointingEnabled`（交互模式默认开）

目标：删除 GitService，让 `/restore` 复用 FileHistoryService，保留"恢复会话 + 重新提交 tool call"的能力。同时修复审计中发现的 `EDIT_TOOL_NAMES` bug。

**接受的语义差异**：rewind 回退到 turn 开始而非 tool call awaiting_approval 那一刻，与 Claude Code 一致。

---

## Phase 1: 修复 EDIT_TOOL_NAMES + 改写 checkpoint 创建

**文件**: `packages/cli/src/ui/hooks/useGeminiStream.ts`

1. **修复 bug**：L239 `new Set(['replace', 'write_file'])` → `new Set(['edit', 'write_file', 'notebook_edit'])`
   - `'replace'` 是旧名，tool name 现为 `'edit'`，checkpoint 和 AUTO_EDIT 自动批准对 edit 工具完全失效
   - 加 `'notebook_edit'`：core 权限层（`rule-parser.ts:161`）已认定它是 edit tool
2. **更新注释**：L2023 `// For AUTO_EDIT mode, only approve edit tools (replace, write_file)` → 更新工具名
3. 删除 `GitService` import（L40）
4. 删除 `gitService = useMemo(...)` 块（L389-394）
5. 改写 `saveRestorableToolCalls` useEffect（L2398-2515）：
   - Gate：`config.getCheckpointingEnabled()` → `config.getFileCheckpointingEnabled()`
   - 删除全部 git 相关逻辑（L2437-2464）
   - JSON 字段：`commitHash` → `promptId: toolCall.request.prompt_id`
   - **新增 guard**：filter 中加 `!toolCall.request.isClientInitiated`，防止 `/restore` 重新提交的 tool 创建冗余 checkpoint
6. 从 dependency array 移除 `gitService`（L2511）

**简化后的 filter**:
```typescript
const restorableToolCalls = toolCalls.filter(
  (toolCall) =>
    EDIT_TOOL_NAMES.has(toolCall.request.name) &&
    toolCall.status === 'awaiting_approval' &&
    !toolCall.request.isClientInitiated,
);
```

**新 checkpoint JSON 结构**:
```json
{
  "history": [...],
  "clientHistory": [...],
  "toolCall": { "name": "edit", "args": {...} },
  "promptId": "<session_id>########<count>",
  "filePath": "/path/to/file"
}
```

---

## Phase 2: 改写 /restore 命令

**文件**: `packages/cli/src/ui/commands/restoreCommand.ts`

1. Feature gate：L142 `config?.getCheckpointingEnabled()` → `config?.getFileCheckpointingEnabled()`
2. 删除 `git: gitService` 解构（L23）
3. 替换文件恢复逻辑（L96-105）：
   ```typescript
   if (toolCallData.promptId) {
     try {
       await config?.getFileHistoryService().rewind(toolCallData.promptId, true);
       addItem({ type: 'info', text: 'Restored project to the state before the tool call.' }, Date.now());
     } catch (error) {
       addItem({ type: 'warning', text: `Could not restore files: ${error instanceof Error ? error.message : String(error)}` }, Date.now());
     }
   }
   ```
   - 注意 `config?.` guard 防止 null crash
   - `rewind()` 在 disabled 时返回空 result 不会 throw
4. `loadHistory`、`setHistory`、tool re-submit 逻辑不变
5. 新消息不加 `t()` — 与现有消息风格一致（仅 description 用了 `t()`）

**为什么 `truncateHistory=true`**：
- `/restore` 替换了 UI 和 model 历史，旧 timeline 的 snapshot 成为 phantom
- truncate 后 target snapshot 成为 `snapshots.at(-1)`
- 后续 `trackEdit()` 正确写入该 snapshot（已验证：backup 准确反映 pre-edit 状态）

---

## Phase 3: 从命令基础设施移除 GitService（可并行）

| 文件 | 改动 |
|------|------|
| `packages/cli/src/ui/commands/types.ts` | 删 `GitService` import（L11）；删 `services.git` 字段（L53） |
| `packages/cli/src/ui/hooks/slashCommandProcessor.ts` | 删 `GitService` import（L22）；删 `gitService` useMemo（L210-215）；删所有 `gitService` 引用（L329, 369, 490, 555） |
| `packages/cli/src/test-utils/mockCommandContext.ts` | 删 `GitService` type import 和 `git` 字段 |

---

## Phase 4: 清理 core config

**文件**: `packages/core/src/config/config.ts`

- 删 `import { GitService }`（L47）
- 删 `private gitService` 字段（L1081）
- 删 `initialize()` 中的 `if (this.getCheckpointingEnabled()) { await this.getGitService(); }`（L1417-1418）
- 删 `checkpointing` 相关字段及构造函数赋值
- 删 `getCheckpointingEnabled()` 方法（L3320-3322）
- 删 `async getGitService()` 方法（L3739-3745）
- 从 `ConfigParams` interface 删 `checkpointing?: boolean`
- **保留** `fileCheckpointingEnabled` 和 `getFileCheckpointingEnabled()`

---

## Phase 5: 删除 CLI checkpointing flag

**文件**: `packages/cli/src/config/config.ts`

- 删 `.option('checkpointing', ...)`（L669-673）
- 删 `.deprecateOption('checkpointing', ...)`（L914-917）
- 删 params 映射 `checkpointing:` 行（L1867-1868）
- 删 argv type 中的 `checkpointing`

---

## Phase 6: 删除 GitService 文件 + barrel export + dead code

- **删除** `packages/core/src/services/gitService.ts`
- **删除** `packages/core/src/services/gitService.test.ts`
- **编辑** `packages/core/src/index.ts`：删 `export * from './services/gitService.js'`（L151）
- **删除** `packages/core/src/config/storage.ts` 的 `getHistoryDir()` 方法（L335-340）— 仅 GitService 使用
- **删除** `packages/core/src/config/storage.test.ts` 的 `getHistoryDir` 测试（L398-403）

**不删的文件**：`gitInit.ts`（`gitWorktreeService.ts` 用）、`simple-git` 依赖（worktree/extension 用）、`getProjectHash`（SessionService 等大量使用）

---

## Phase 7: 清理 settings schema + docs + skills

| 文件 | 改动 |
|------|------|
| `packages/cli/src/config/settingsSchema.ts` | 删 L456-475 的 `checkpointing` schema 定义 |
| `docs/users/features/checkpointing.md` | 删除 |
| `docs/users/features/_meta.ts` | 删 L14 的 `checkpointing` entry |
| `docs/users/configuration/settings.md` | 删 L89 settings 表行 + L641 CLI flag 表行 |
| `packages/core/src/skills/bundled/qc-helper/SKILL.md` | 删 L61 的 Checkpointing 表行 |
| `.qwen/skills/docs-update-from-diff/references/docs-surface.md` | L10 列表中移除 "checkpointing" |
| `packages/core/src/services/chatRecordingService.ts` | L203/208/449 注释 "checkpointing" → "conversation branching"（消除歧义） |

**保留不动**：
- `v1-to-v2-shared.ts` migration map（向后兼容旧 V1 配置文件）
- i18n locale 中 "file checkpointing" 消息（属于 `/rewind`，不是 `/restore`）
- `AppContainer.tsx:2557` 消息（属于 `fileCheckpointingEnabled`，不是 `checkpointing`）
- `storage.ts` 的 `getProjectTempCheckpointsDir()`（`/restore` 仍使用）
- `cleanup.ts` 的 `cleanupCheckpoints()`（行为不变）
- VS Code `settings.schema.json`（由 `settingsSchema.ts` 自动生成，build 时自动更新）

---

## Phase 8: 更新测试

| # | 文件 | 改动 |
|---|------|------|
| 1 | `packages/core/src/services/gitService.test.ts` | **删除** |
| 2 | `packages/core/src/config/config.test.ts` | 删 GitService mock（L239-242）；删 checkpointing 相关测试（L766-788）；其他测试中 `checkpointing: false` 参数直接删除 |
| 3 | `packages/core/src/config/storage.test.ts` | 删 `getHistoryDir` 测试（L398-403）；保留 `getProjectTempCheckpointsDir` 测试 |
| 4 | `packages/cli/src/config/config.integration.test.ts` | 删 L202-217 的 checkpointing 配置测试 |
| 5 | `packages/cli/src/config/settingsSchema.test.ts` | 删 L87-96 和 L222 的 checkpointing schema 测试 |
| 6 | `packages/cli/src/config/migration/versions/v1-to-v2.test.ts` | **保留**（migration 必须能处理旧 `checkpointing` key） |
| 7 | `packages/cli/src/ui/commands/restoreCommand.test.ts` | 删 mockGitService；gate 改 `getFileCheckpointingEnabled`；fixture 用 `promptId`；mock `getFileHistoryService` 返回 `{ rewind: vi.fn() }`；断言 `rewind(promptId, true)` |
| 8 | `packages/cli/src/ui/hooks/useGeminiStream.test.tsx` | 删 `GitService: vi.fn()` mock；`getCheckpointingEnabled` → `getFileCheckpointingEnabled` |
| 9 | `packages/cli/src/gemini.test.tsx` | 删 `checkpointing: undefined` fixture 字段 |
| 10 | `integration-tests/cli/settings-migration.test.ts` | **保留**（测试旧配置迁移） |
| 11 | `integration-tests/fixtures/settings-migration/workspaces.json` | **保留**（旧配置 fixture） |

---

## Verification

1. **类型检查**: `pnpm tsc --noEmit`
2. **单测**:
   ```bash
   pnpm test -- --run \
     packages/core/src/services/fileHistoryService.test.ts \
     packages/cli/src/ui/commands/restoreCommand.test.ts \
     packages/core/src/config/config.test.ts \
     packages/core/src/config/storage.test.ts \
     packages/cli/src/config/settingsSchema.test.ts \
     packages/cli/src/config/config.integration.test.ts \
     packages/cli/src/config/migration/versions/v1-to-v2.test.ts
   ```
3. **无残留检查**:
   ```bash
   grep -r "GitService\|gitService\|getGitService\|getCheckpointingEnabled" \
     packages/ --include="*.ts" | grep -v node_modules | grep -v ".d.ts" | grep -v ".test."
   ```
4. **功能测试**:
   - 启动交互 session → 让模型用 edit 工具编辑文件 → 在 awaiting_approval 时检查 checkpoint JSON 含 `promptId`
   - `/restore <checkpoint>` → 验证文件恢复 + 会话回退 + tool 重新提交
   - `/rewind` → 验证不受影响
   - AUTO_EDIT 模式 → 验证 edit 工具能被正确自动批准
5. **Schema 重新生成**: `pnpm build` 后确认 `settings.schema.json` 不再包含 `checkpointing`

---

## 审计发现的额外 bug（本次一并修复）

1. **`EDIT_TOOL_NAMES` 使用旧名 `'replace'`**（`useGeminiStream.ts:239`）：checkpoint 创建和 AUTO_EDIT 自动批准对 edit 工具完全失效
2. **缺少 `isClientInitiated` guard**：`/restore` 重新提交的 tool 到达 `awaiting_approval` 会创建冗余 checkpoint
3. **`notebook_edit` 未纳入 `EDIT_TOOL_NAMES`**：core 权限层认定它是 edit tool，CLI 层遗漏

---

## Bad Effects 分析与缓解

### 1. `/restore` 对所有交互用户可见（低风险）

**变化**：`/restore` 原来 gated by `checkpointing`（默认关，需 opt-in），迁移后 gated by `fileCheckpointingEnabled`（交互模式默认开）。所有交互用户将在 `/help` 中看到 `/restore`。

**影响**：
- 用户执行 `/restore` 时若无 checkpoint，只显示 "No restorable tool calls found"，不会造成数据损失
- checkpoint JSON 会为每个 edit/write_file/notebook_edit awaiting_approval 工具调用创建

**缓解**：`cleanupCheckpoints()` 在 `gemini.tsx:453` 每次启动时清理 checkpoint 目录，不会跨 session 累积。单 session 内 checkpoint JSON 的磁盘占用可控（每个含 history + clientHistory，长 session 可达数十 MB，但 session 结束后下次启动即清理）。

### 2. AUTO_EDIT 行为变化（中风险）

**变化**：修复 `EDIT_TOOL_NAMES` 后，`edit`（最常用的编辑工具）和 `notebook_edit` 在 AUTO_EDIT 模式下会被自动批准。此前因为 bug 只有 `write_file` 被自动批准。

**影响**：依赖 AUTO_EDIT 模式下 edit 工具仍需手动审批的用户会发现行为改变。

**缓解**：这是 bug 修复——AUTO_EDIT 的设计意图就是自动批准所有编辑工具。core 权限层（`autoMode.ts:82-85`）已正确使用 `ToolNames.EDIT`。CLI 层的 `EDIT_TOOL_NAMES` 是唯一出错的地方。文档和命名都表明 AUTO_EDIT 应该自动批准 edit 工具。

### 3. 孤立的 shadow git 仓库（低风险）

**变化**：曾启用 `checkpointing` 的用户在 `~/.qwen/runtime/history/<hash>/` 下有 shadow git 仓库。迁移后这些目录永远不会被自动清理。

**影响**：每个 shadow repo 可能 50-500 MB（取决于项目大小），占用磁盘空间。

**缓解**：
- 这些用户是极少数（`checkpointing` 默认关，需显式 opt-in）
- 在 `packages/cli/src/utils/housekeeping/cleanup.ts` 中增加一次性清理逻辑：如果 `~/.qwen/runtime/history/` 存在，删除整个目录。housekeeping 系统已有清理旧 `file-history/` 目录的先例
- 或者在 docs 中提醒用户手动删除

### 4. 旧 `general.checkpointing.enabled` 设置静默失效（低风险）

**变化**：曾设置 `general.checkpointing.enabled: true` 的用户，该设置被静默忽略。

**影响**：无功能损失——`/restore` 迁移后由 `fileCheckpointingEnabled` 控制（默认开），用户仍然能用 `/restore`。底层机制从 git 切到 file-copy，但 UX 不变。设置残留在 JSON 中不会报错。

**缓解**：无需特殊处理。VS Code schema 更新后，旧设置在 IDE 中会显示黄色 warning（unknown key），提示用户可以删除。

### 5. 单 session 内 checkpoint JSON 磁盘占用（低风险）

**变化**：修复 `EDIT_TOOL_NAMES` 后，`edit` 工具（最常用）也会创建 checkpoint JSON。每个 JSON 包含完整 `history` + `clientHistory`（可达 10-50 MB）。

**影响**：长 session 中如果有 50+ 次编辑操作，checkpoint JSON 可达 ~1 GB。

**缓解**：
- `cleanupCheckpoints()` 每次启动时清理，不会跨 session 累积
- 可考虑后续优化：只保留最近 N 个 checkpoint（如 10 个），或不在 JSON 中序列化完整 clientHistory（体积最大的部分）
- 当前不做优化，先保持与旧行为一致（旧行为也没有限制，只是因为 bug 很少触发）

### 6. `/restore` 后 `/rewind` 交互正确性（无风险）

**分析**：迁移后 `/restore` 调用 `rewind(promptId, true)`，这是 FileHistoryService 的公开 API。
- truncate 清理 phantom snapshots → `/rewind` 只看到有效快照
- target snapshot 正确作为后续 `trackEdit()` 的写入目标
- 新 message 触发 `makeSnapshot` 创建新快照 → `/rewind` 时间线正确

**与旧实现对比**：旧实现的 `/restore` 根本不与 FileHistoryService 交互（两套独立系统），反而更容易导致状态不一致。迁移后两个命令共享同一套状态，一致性更好。
