# PR 16 follow-up — Codex P2 review fixes

## Context

PR #4249 (`feat(serve): workspace memory and agents CRUD`) is in review. A Codex review pass against `main` flagged three P2 correctness issues. All three are real bugs, not style nits, and they're cheap to fix. Land them as a follow-up commit on the same branch before reviewers spend more cycles, so the next round of feedback can focus on design rather than concurrency / cache / shadow-name traps.

The three issues:

1. **Concurrent `POST /workspace/memory` append loses writes.** `writeContextFile.ts:105-106` reads existing content, composes the new content in JS memory, then `fs.writeFile`s. Two simultaneous appends both read the same existing file, both compose, and the later write overwrites the earlier appended entry. Both clients see 200 + `memory_changed` for a write that effectively didn't happen.
2. **`GET /workspace/agents` returns stale data.** `workspaceAgents.ts:62` calls `manager.listSubagents()` with default options. `SubagentManager` serves the in-memory cache unless `force: true` is passed. Out-of-band edits to `.qwen/agents/*.md` (a developer editing in their IDE while the daemon is running) never appear in the list, even though `GET /workspace/agents/:agentType` reads from disk every call (`listSubagentsAtLevel` always re-reads).
3. **Project-level agent shadowing a builtin name becomes undeleteable.** `parseAgentConfig` in `workspaceAgents.ts` lets a client `POST /workspace/agents { name: "general-purpose", scope: "workspace" }`. The file lands at `<workspace>/.qwen/agents/general-purpose.md`. List/load resolve the project entry first (project > builtin), `isBuiltin: false`. The DELETE pre-check at `workspaceAgents.ts:395-408` therefore passes. But `manager.deleteSubagent` at `subagent-manager.ts:302` rejects on **name** alone (`BuiltinAgentRegistry.isBuiltinAgent(name)`), not on the resolved entry — so DELETE returns 403 `agent_readonly` and the file persists forever. The user has no API path to remove it.

**Outcome:** patch all three on the same branch (`feat/serve-workspace-memory-agents-crud`) and push as a follow-up commit; CI runs against the existing PR.

## Reuse map

| Need | Reuse | File:line |
|---|---|---|
| Per-file mutex map | Pattern from `jsonl-utils.ts` | `packages/core/src/utils/jsonl-utils.ts:36-46` (`fileLocks: Map<string, Mutex>`, `getFileLock(path)`) |
| Mutex API | `async-mutex` (already a core dep) | `packages/core/package.json` `"async-mutex": "^0.5.0"` |
| Builtin-name check | `BuiltinAgentRegistry.isBuiltinAgent(name)` | `packages/core/src/subagents/builtin-agents.ts:311` (case-insensitive name match) |
| Force-refresh option | `ListSubagentsOptions { force: true }` | `packages/core/src/subagents/types.ts:172`, consumed at `subagent-manager.ts:396-401` |
| Re-export path | `BuiltinAgentRegistry` is already exported | `packages/core/src/subagents/index.ts:31` |

## Files to modify (no new files)

1. `packages/core/src/memory/writeContextFile.ts` — wrap the read-compose-write critical section in a per-file `Mutex.runExclusive`. Keep the public API unchanged (still returns `{ filePath, bytesWritten, changed }`).
2. `packages/core/src/memory/writeContextFile.test.ts` — add a "10 parallel appends, all entries survive" test.
3. `packages/cli/src/serve/workspaceAgents.ts` — flip `manager.listSubagents()` to `manager.listSubagents({ force: true })` (one-line change at line 62); reject builtin agent names in `parseAgentConfig` before validation passes (return 422 `invalid_config` with a hint).
4. `packages/cli/src/serve/workspaceAgents.test.ts` — add a "stale-cache invalidation" test for the LIST route + a "create with builtin name returns 422" test.

## Fix details

### Fix 1 — Per-file mutex on memory writes

```ts
// writeContextFile.ts (top of file, after imports)
import { Mutex } from 'async-mutex';
const fileLocks = new Map<string, Mutex>();
function getFileLock(filePath: string): Mutex {
  if (!fileLocks.has(filePath)) fileLocks.set(filePath, new Mutex());
  return fileLocks.get(filePath)!;
}
```

Refactor `writeWorkspaceContextFile` so the entire read-compose-write happens inside `getFileLock(filePath).runExclusive(async () => { ... })`. Keep the early `mkdir` + the `replace` short-circuit + the whitespace-only short-circuit inside the critical section so all sequencing decisions see a consistent file state. Replace mode also acquires the lock — two concurrent replaces or replace-vs-append would otherwise race the writeFile order, and the deterministic last-write semantics are still well-defined under the mutex.

The Map grows by one entry per unique `(scope, projectRoot)` tuple. Production has at most 2 entries (workspace QWEN.md + global QWEN.md). No cleanup needed.

### Fix 2 — Force-refresh agent listings

```ts
// workspaceAgents.ts:62
const agents = await manager.listSubagents({ force: true });
```

`force: true` causes `refreshCache()` to re-walk `.qwen/agents/` directories every call. Cost per request: ~50-agent ceiling × ~1ms readdir+parse on local SSD = sub-millisecond. The detail route (`GET /workspace/agents/:agentType`) already always reads disk via `loadSubagent → findSubagentByNameAtLevel → listSubagentsAtLevel`, so this just brings the LIST route to parity.

### Fix 3 — Reject builtin agent names on create

In `parseAgentConfig`, immediately after the empty-name check, add:

```ts
if (BuiltinAgentRegistry.isBuiltinAgent(name)) {
  res.status(422).json({
    error: `\"${name}\" shadows a built-in subagent and cannot be used as a project- or user-level name. Choose a different name.`,
    code: 'invalid_config',
    name,
  });
  return undefined;
}
```

Import `BuiltinAgentRegistry` from `@qwen-code/qwen-code-core`. This is the cleanest fix because:
- Once enforced, the asymmetry between create-allows / delete-rejects is gone by construction.
- It surfaces the issue at the point of first-write rather than letting it hide until first DELETE.
- Matches the existing reserved-name policy in `validation.ts:140-152` (which already reserves `self/system/user/model/tool/config/default/main`); this just extends the set to the dynamic builtin list.

`BuiltinAgentRegistry.isBuiltinAgent` is case-insensitive (`builtin-agents.ts:311-316`), which matches `loadSubagent`'s case-insensitive cascade resolution — so a `name: "Explore"` and a `name: "explore"` both reject correctly.

Does NOT touch update or delete paths. The pre-check at line 395-408 stays as a defense-in-depth (handles legacy on-disk shadow files that predate this PR), but new files can't reach that state.

## Test plan

### `packages/core/src/memory/writeContextFile.test.ts` — add 1 it block

```ts
it('serializes concurrent appends so no entry is lost', async () => {
  const writes = Array.from({ length: 10 }, (_, i) =>
    writeWorkspaceContextFile({
      scope: 'workspace',
      mode: 'append',
      content: `- entry ${i}`,
      projectRoot: workspace,
    }),
  );
  await Promise.all(writes);
  const written = await fs.readFile(
    path.join(workspace, 'QWEN.md'),
    'utf8',
  );
  for (let i = 0; i < 10; i++) {
    expect(written).toContain(`- entry ${i}`);
  }
});
```

Without the mutex, this test fails with high probability — Promise.all schedules all reads before any write completes.

### `packages/cli/src/serve/workspaceAgents.test.ts` — add 2 it blocks

```ts
it('GET /workspace/agents reflects out-of-band agent file changes', async () => {
  const bridge = buildBridgeStub();
  const app = buildApp({ bridge, boundWorkspace: workspace });

  // First call populates cache.
  let res = await request(app).get('/workspace/agents');
  const before = (res.body.agents as Array<{name:string}>).map(a => a.name);
  expect(before).not.toContain('fresh-out-of-band');

  // Out-of-band: write a new agent file directly to disk.
  const projectAgentsDir = path.join(workspace, QWEN_DIR, 'agents');
  await fs.mkdir(projectAgentsDir, { recursive: true });
  await fs.writeFile(
    path.join(projectAgentsDir, 'fresh-out-of-band.md'),
    `---\nname: fresh-out-of-band\ndescription: out-of-band agent description\n---\nyou are the fresh out-of-band agent\n`,
    'utf8',
  );

  // Second call must see it (force: true reads disk every call).
  res = await request(app).get('/workspace/agents');
  const after = (res.body.agents as Array<{name:string}>).map(a => a.name);
  expect(after).toContain('fresh-out-of-band');
});

it('rejects 422 invalid_config when create uses a builtin agent name', async () => {
  const bridge = buildBridgeStub();
  const app = buildApp({ bridge, boundWorkspace: workspace });
  const res = await request(app)
    .post('/workspace/agents')
    .send({
      name: 'general-purpose',
      description: 'a description longer than ten chars',
      systemPrompt: 'this is a system prompt',
      scope: 'workspace',
    });
  expect(res.status).toBe(422);
  expect(res.body.code).toBe('invalid_config');
  expect(res.body.error).toMatch(/built-in/i);

  // Symmetry: case-insensitive match — `Explore` and `explore` both reject.
  const res2 = await request(app)
    .post('/workspace/agents')
    .send({
      name: 'explore',
      description: 'a description longer than ten chars',
      systemPrompt: 'this is a system prompt',
      scope: 'workspace',
    });
  expect(res2.status).toBe(422);
  expect(res2.body.code).toBe('invalid_config');
});
```

## Verification

```bash
npm run build --workspace=packages/core   # rebuild dist for cli imports
npx tsc --noEmit -p packages/cli/tsconfig.json
npx tsc --noEmit -p packages/sdk-typescript/tsconfig.json
npx vitest run packages/core/src/memory/writeContextFile.test.ts packages/cli/src/serve
npx vitest run --project @qwen-code/sdk
npx eslint packages/cli/src/serve/workspaceAgents.ts packages/cli/src/serve/workspaceAgents.test.ts packages/core/src/memory/writeContextFile.ts packages/core/src/memory/writeContextFile.test.ts
```

Expected: typecheck OK; serve **351/351** (was 348, +3 new); writeContextFile **11/11** (was 10, +1); SDK 335/335; eslint clean.

After local validation: `git add` the 4 modified files, commit on the existing branch with message `fix(serve): address Codex P2 review on PR 16` (no Co-Authored-By per memory rule), `git push` (no `-u` needed; tracking already set), and let the PR's CI re-run.

## Risks & follow-ups

- **Mutex Map growth**: bounded at 2 entries in production (workspace + global QWEN.md). Tests run with tmpdirs but each test cleans up via `afterEach`; the Map persists across tests but the entries are inert. Acceptable; revisit if the helper grows multi-scope storage later.
- **`force: true` per LIST request**: each GET re-walks `.qwen/agents/` (and `~/.qwen/agents/`). For a malicious client polling the route, this multiplies daemon disk-IO; mitigated by the existing bearer-token gate + the per-route 256-connection cap. Document; defer rate-limiting to PR 24's audit/policy layer.
- **Builtin-name rejection only at create**: legacy on-disk shadow files written by older code paths (predating this fix) still trip the DELETE asymmetry. Out of scope for this fix — those files require manual cleanup. If we want to fully close the gap, a separate follow-up would teach `manager.deleteSubagent` to consult the resolved level instead of just the name (or use the route's pre-check to bypass with direct `fs.unlink + manager.refreshCache`); both options live downstream of the immediate PR.

## Final Implementation Status

- **PR #4249**: MERGED on 2026-05-18.
- **Title**: "feat(serve): workspace memory and agents CRUD (#4175 Wave 4 PR 16)"
- **Summary**: All three planned fixes (concurrent append mutex, force-refresh agent listing, builtin-name rejection on create) were implemented as part of PR #4249.
- **Key divergences**: The plan expected these as a follow-up commit on the PR branch, but they shipped as part of the main PR itself. The `writeContextFile.ts` mutex, `workspaceAgents.ts` force:true fix, and `BuiltinAgentRegistry.isBuiltinAgent` guard all landed.
- **Files changed** (23 total): `packages/cli/src/serve/workspaceAgents.ts`, `packages/cli/src/serve/workspaceMemory.ts`, `packages/core/src/memory/writeContextFile.ts`, `packages/core/src/memory/writeContextFile.test.ts`, `packages/cli/src/serve/workspaceAgents.test.ts`, `packages/cli/src/serve/workspaceMemory.test.ts`, plus SDK, status, capabilities, and bridge files.
