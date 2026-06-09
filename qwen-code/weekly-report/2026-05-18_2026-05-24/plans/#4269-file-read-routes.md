# PR 19 round-1 fixup — `fixup(serve): address #4269 review`

PR: https://github.com/QwenLM/qwen-code/pull/4269 (Wave 4 PR 19, in review)

## Context

PR #4269 收到 Copilot 4 条 inline comment + Codex 3 条 P2 finding。其中 5 项是真实的正确性 / 隐私 / 操作问题（log 风暴、glob `truncated` 假阳性、根匹配空串、`pattern` 字段绕过 privacy gate、cwd 解析失败被错标成 glob pattern），3 项是测试注释 / 错误消息字面量 / JSDoc 的 cosmetic 修复。

把这 8 项合成**一个 fixup commit**：`fixup(serve): address PR #4269 round-1 review feedback`，回 PR 19 分支推上去。

不采纳的项（review summary 里的 HIGH-2、MEDIUM-1、LOW-1/2/3）已在上一轮判定中说明理由：HIGH-2 是 follow-up #4 的故意契约，MEDIUM-1 与 `parseMaxQueuedQuery` 一致，LOW-1/2/3 已覆盖或 out of scope。

---

## 8 项改动

### P0（正确性 / 隐私 / 操作）

#### 1. Throttled default `fsAuditEmit` in `runQwenServe`

**文件**：`packages/cli/src/serve/runQwenServe.ts`（默认 emit closure，约 226-265 行）+ `packages/cli/src/serve/server.ts`（导出 `createDefaultFsAuditEmit`）

**问题**：`runQwenServe` 现在总是构造 fsFactory，但默认 `emit` 每次事件都打一行 stderr。`/file`/`/glob` 正常使用会刷屏，与 `createServeApp` 自带的 `createDefaultFsAuditEmit`（每 100 次 warn 一次）行为不一致。

**fix**：
- 把 `server.ts:64-85` 的 `createDefaultFsAuditEmit` 改成 `export function`
- `runQwenServe.ts` 默认 emit 改成 `deps.fsAuditEmit ?? createDefaultFsAuditEmit()`
- 删掉那条 "fs audit emit pre-wire: type=..." 的逐事件 stderr

#### 2. Glob `truncated` 真值化

**文件**：`packages/cli/src/serve/routes/workspaceFileRead.ts`（约 380-410 行 `handleGetGlob`）

**问题**：当前 `truncated: relMatches.length === maxResults`，恰好命中 N 个时会假阳性。

**fix**：probe 时传 `cap + 1`，命中 `cap + 1` 个则削尾到 `cap` 并 `truncated:true`，否则 `false`。

```ts
const cap = maxResults ?? DEFAULT_GLOB_MAX_RESULTS;
const matches = await fs.glob(pattern, {
  cwd: cwdResolved,
  includeIgnored,
  maxResults: cap + 1,
});
const truncated = matches.length > cap;
const trimmed = truncated ? matches.slice(0, cap) : matches;
```

#### 3. Glob 根匹配 `relMatches` 空串归一化

**文件**：`packages/cli/src/serve/routes/workspaceFileRead.ts`（约 388 行）

**问题**：`path.relative(boundWorkspace, match)` 当 match 等于 boundWorkspace 时返回空串，与其他路由 `workspaceRelative()` 返回 `'.'` 不一致。

**fix**：`relMatches = trimmed.map((m) => workspaceRelative(req, m as string))`，复用同一 helper（消除 boundWorkspace undefined 兜底分支，HIGH-1 同时关闭）。

#### 4. `pattern` 字段 privacy gate

**文件**：`packages/cli/src/serve/fs/audit.ts`（`recordAccess` 约 230 行 + `recordDenied` 约 264 行）

**问题**：glob pattern 常含路径片段（`src/secrets/*.env`、被拒的 `/Users/alice/ws/**`），现在不论 `QWEN_AUDIT_RAW_PATHS` 都明文写入 `data.pattern`，绕过了和 `relPath` / `message` 同款的 privacy 门。

**fix**：把 `if (record.pattern !== undefined) payload.pattern = record.pattern;` 两处都加上 `&& includeRawPaths` 守卫。注释里说明：与 `relPath` / `message` 一致 — privacy 模式下 ALL path-bearing 字段都不外发。

#### 5. cwd resolve intent 改为 `'list'`

**文件**：`packages/cli/src/serve/routes/workspaceFileRead.ts`（`handleGetGlob` 中 `fs.resolve(cwdString, 'glob')`）

**问题**：路由用 `intent='glob'` 解析 cwd，失败时进入 `recordAndWrap(err, 'glob', cwdString)`，被 `pattern: intent === 'glob' ? input : undefined` 错标成 pattern。实际请求里 pattern 是另一个独立 query，从未到达这条 catch。

**fix**：改成 `fs.resolve(cwdString, 'list')`。语义上 cwd 是目录、`list`-shaped 也合理；trust gate 行为相同（均 read-shaped）；`resolveWithinWorkspace` 行为相同（intent 只影响 ENOENT 容忍 + suspicious-pattern check，两者一致）。fix 完毕后 cwd 解析失败 audit 行为 `intent='list'`，pattern 字段不再被错填。

### P1（cosmetic / 注释正确性）

#### 6. Test 注释修正

**文件**：`packages/cli/src/serve/server.test.ts`（约 3219 行 `honors deps.fsFactory override` 测试）

**问题**：注释写 "regression that reverses the priority order would produce a 200 (built-in factory reads `process.cwd()/package.json`)"。但请求是 `/file?path=a.txt`，built-in factory 会 404 不是 200。

**fix**：注释改成 "a regression would 404 (built-in factory can't find `a.txt` in cwd) instead of 400 with our sentinel"。

#### 7. Error message 用常量

**文件**：`packages/cli/src/serve/routes/workspaceFileRead.ts`（`handleGetFile` 中 `limit` 校验，约 250 行）

**问题**：错误信息 `'limit must be a positive integer in [1, 2000]'` 把 `MAX_LIST_ENTRIES` 硬编码成 `2000`。

**fix**：改成模板字符串 ``\`limit\` must be a positive integer in [1, ${MAX_LIST_ENTRIES}]``。

#### 8. `audit.ts` `Omit` JSDoc 展开

**文件**：`packages/cli/src/serve/fs/audit.ts`（约 145 行 "Per-payload `pattern`..." 注释）

**问题**：当前 JSDoc 偏隐晦，没解释清楚为什么 `pattern` 既出现在 schema 又出现在入参。

**fix**：写成 "AuditPublisher takes a record with computed fields (kind/pathHash/relPath/route) Omit'd; `pattern` survives the Omit because it's an explicit passthrough — only the orchestrator's glob path knows the literal pattern, and tests need to be able to pass it through without TS errors."

---

## 测试增改

- **`packages/cli/src/serve/fs/audit.test.ts`**：新增一条用例 `'omits pattern field when raw paths are disabled'`，构造 `includeRawPaths: false` 的 publisher，确认 `recordAccess` 调用带 `pattern` 入参时输出事件**不含** `pattern` 字段；同步加一条 `'attaches pattern when includeRawPaths is true'` 的对偶（如果不已有的话——当前 `'attaches pattern field for fs.access on glob intent'` 用默认 `setup()` 走 `includeRawPaths: false` 路径，需要改用 `setup({ includeRawPaths: true })`，否则原断言会破）。

- **`packages/cli/src/serve/fs/workspaceFileSystem.test.ts`**：现有 `'records fs.access with workspace-hashed pathHash and pattern field on glob success'` 测试会因为 `pattern` 默认 gated 而失败（默认工厂的 `includeRawPaths: false`）。要么改测试用 `includeRawPaths: true` 重新构造工厂，要么把"pathHash 等于 workspace hash"的断言留下、把 pattern 断言挪进 `includeRawPaths: true` 子测试。

- **`packages/cli/src/serve/routes/workspaceFileRead.test.ts`**：
  - `GET /glob` 加一条 `'truncated reports false when match count equals maxResults'`：写 5 个文件，`?maxResults=5`，断言 `truncated: false`。
  - 加一条 `'workspace-relative paths use \".\" for root match'` 验证 #3 归一化。

- **`packages/cli/src/serve/server.test.ts`**：现有的 `runQwenServe wires fsFactory + emit through to the read routes` 在 emit 默认改成节流后仍然过（测试显式注入了 `fsAuditEmit`，不走默认路径）。无需改。

---

## 关键复用

| 复用 | 来源 | 用途 |
|---|---|---|
| `createDefaultFsAuditEmit` | `serve/server.ts:64-85` | runQwenServe 改 export 后复用，避免实现两份节流逻辑 |
| `workspaceRelative` | `serve/routes/workspaceFileRead.ts`（已有，private） | glob `relMatches` 复用同款归一化 |
| `MAX_LIST_ENTRIES` | `serve/routes/workspaceFileRead.ts`（已有 export） | error message 文本插值 |
| `includeRawPaths` 守卫 pattern | 与 `relPath` / `message` 同款 | privacy gate 一致性 |

---

## 落地步骤

| # | 改动 | 行数估计 |
|---|---|---|
| 1 | `server.ts` 导出 `createDefaultFsAuditEmit`；`runQwenServe.ts` 改用它 | ~5 行 |
| 2 | `workspaceFileRead.ts` glob `truncated` 改 probe-then-trim | ~10 行 |
| 3 | `workspaceFileRead.ts` glob `relMatches` 改用 `workspaceRelative` | ~3 行 |
| 4 | `audit.ts` `pattern` gate 在 `includeRawPaths` 后面（两处） | ~4 行 |
| 5 | `workspaceFileRead.ts` cwd resolve intent='list' | 1 行 |
| 6 | `server.test.ts` 注释修正 | ~5 行 |
| 7 | `workspaceFileRead.ts` error message 用 `${MAX_LIST_ENTRIES}` | 1 行 |
| 8 | `audit.ts` Omit JSDoc 展开 | ~6 行注释 |
| 测试 | 上述测试矩阵新增/调整 | ~30-40 行 |

**单一 commit**：`fixup(serve): address PR #4269 round-1 review feedback`

commit message 列出每条 finding（review 来源 + 文件位置 + fix 摘要）。

---

## 验证

```sh
cd packages/cli

# 1. 受影响测试
npx vitest --run src/serve/routes src/serve/fs/audit src/serve/fs/workspaceFileSystem src/serve/server.test

# 2. serve 全量回归
npx vitest --run src/serve

# 3. 类型 + lint
npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/serve" | head
npx eslint src/serve/

# 4. 手测：privacy 模式下 pattern 字段被 strip
unset QWEN_AUDIT_RAW_PATHS
npx vitest --run src/serve/fs/audit -t pattern
QWEN_AUDIT_RAW_PATHS=1 npx vitest --run src/serve/fs/audit -t pattern
```

---

## 不采纳（已在上一轮判定）

- **HIGH-2 review summary**：glob `pathHash` 用 `boundWorkspace` 是 follow-up #4 故意契约
- **MEDIUM-1 review summary**：`parseIntInRange` 三态返回与 `parseMaxQueuedQuery` 一致
- **LOW-1/2/3 review summary**：注释长度 / CSP header / 反向断言已有覆盖或 out of scope

PR 评论会回复说明这些项的判断（一并在 fixup commit 推上去后逐条回 review thread）。

## Final Implementation Status

- **PR #4269**: MERGED on 2026-05-18.
- **Title**: "feat(serve): safe workspace file read routes (#4175 PR 19)"
- **Summary**: All 8 planned fixup items were implemented and landed. The PR shipped the full Wave 4 file-read routes with the round-1 review fixes incorporated.
- **Key divergences**: None significant. The fixes (throttled fsAuditEmit, glob truncated probe-then-trim, relMatches normalization, pattern privacy gate, cwd resolve intent='list', test comment fix, error message constant, JSDoc expansion) all shipped as planned.
- **Files changed** (10): `packages/cli/src/serve/routes/workspaceFileRead.ts`, `packages/cli/src/serve/fs/audit.ts`, `packages/cli/src/serve/fs/audit.test.ts`, `packages/cli/src/serve/fs/workspaceFileSystem.ts`, `packages/cli/src/serve/fs/workspaceFileSystem.test.ts`, `packages/cli/src/serve/routes/workspaceFileRead.test.ts`, `packages/cli/src/serve/runQwenServe.ts`, `packages/cli/src/serve/server.ts`, `packages/cli/src/serve/server.test.ts`, `packages/cli/src/serve/capabilities.ts`.
