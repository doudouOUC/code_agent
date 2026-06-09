# Fix qwen-code E2E run 26065945125

## Context

GitHub Actions E2E run [#26065945125](https://github.com/QwenLM/qwen-code/actions/runs/26065945125) on `main` failed across Linux/Linux-docker/macOS with two deterministic test failures (each `retry x2`). Both regressions were introduced by PR #4271 (`feat(serve): MCP guardrail push events + hysteresis`, commit `3ffe321cf`); they have failed every subsequent main run as well (#4295 / #4298 / #4291 / #4300). The two failures are independent and need separate fixes.

## Failure #1: capabilities envelope drift

**Test**: `integration-tests/cli/qwen-serve-routes.test.ts:183` — `qwen serve — capabilities envelope > advertises all baseline capabilities`

**Symptom**: `expected [ 'health', 'capabilities', …(36) ] to deeply equal [ … …(35) ]` — actual list has one more entry than expected.

**Root cause**: PR #4271 added `mcp_guardrail_events` at `packages/cli/src/serve/capabilities.ts:110` and synced the unit-test list at `packages/cli/src/serve/server.test.ts:119`, but missed the integration test's hand-maintained list at `integration-tests/cli/qwen-serve-routes.test.ts:190-228`. Same drift class as the prior fixes in PR #4268 / #4284.

**Fix**: Add `'mcp_guardrail_events'` immediately after `'mcp_guardrails'` (line 219) in `integration-tests/cli/qwen-serve-routes.test.ts`. Order matches the registry insertion order in `capabilities.ts` (the test's leading comment requires this).

```ts
      'mcp_guardrails',
      'mcp_guardrail_events',  // <- new line
      'workspace_file_read',
```

## Failure #2: clientCount vs pgrep observation

**Test**: `integration-tests/cli/qwen-serve-baseline.test.ts:488` — `MCP child amplification (P1 baseline) > clientCount matches external pgrep observation` (added by PR #4271 itself; never passed CI)

**Symptom**: `expected 4 to be 2` — `observed.mcpGrandchildren.length` is 4, the test expected 2.

**Root cause**: A `qwen serve` ACP child runs **two** Config objects, each with its own `McpClientManager`:

1. **Bootstrap Config** (`packages/cli/src/acp-integration/acpAgent.ts:158`) — `runAcpAgent` calls `await config.initialize({ skipGeminiInitialization: true })`, then `await config.waitForMcpReady()`. This kicks off MCP discovery that spawns `idle1` + `idle2` (= 2 grandchildren).
2. **Per-session Config** (`packages/cli/src/acp-integration/acpAgent.ts:1875`) — when the test calls `daemon.client.createOrAttachSession(...)`, `newSessionConfig` builds a fresh `Config` and calls `await config.initialize()`, which runs **another** MCP discovery pass for the same servers (= 2 more grandchildren).

Total grandchildren observed by `pgrep -P`: 4. But `/workspace/mcp` snapshot reads only the bootstrap manager via `buildWorkspaceMcpStatus(this.config)` (`acpAgent.ts:1399`), which reports `clientCount = 2`. The test's invariant ("snapshot matches OS reality") is therefore impossible to satisfy as written — the snapshot is workspace-level, but pgrep counts every grandchild across both managers.

The author of PR #4271 didn't realize that bootstrap and per-session Configs each carry their own manager. Sub-agent exploration confirmed bootstrap MCP IS load-bearing for three diagnostic routes (`/workspace/mcp`, `/workspace/preflight`, `POST /workspace/mcp/:server/restart`) so removing bootstrap discovery would degrade the routes' "no sessions yet" UX.

**Fix (per user decision: test-side)**: Restructure the test to assert the invariant in a state where it actually holds — namely, after `spawnDaemon` but **before** `createOrAttachSession`. At that point bootstrap has run discovery (2 grandchildren) and no session-Config exists, so `clientCount = pgrep-observed = MCP_SERVERS_CONFIGURED = 2`. The invariant the test was designed to validate ("`/workspace/mcp` snapshot matches OS reality") is intact at this layer.

```ts
it('clientCount matches external pgrep observation', async () => {
  const ws = makeTempWorkspace('mcp-counter');
  let daemon: SpawnedDaemon | undefined;
  try {
    writeWorkspaceSettings(ws, {
      mcpServers: {
        idle1: { command: 'node', args: [IDLE_MCP_PATH] },
        idle2: { command: 'node', args: [IDLE_MCP_PATH] },
      },
    });
    daemon = await spawnDaemon({ workspaceCwd: ws });

    // Snapshot BEFORE creating any session: only the bootstrap Config's
    // McpClientManager is alive, so `/workspace/mcp` snapshot accounting
    // and `pgrep -P` see the same MCP grandchildren. After a session is
    // created, the per-session Config spawns its OWN MCP children
    // (separate manager) — pgrep would observe 2× while the snapshot
    // (which reads only bootstrap) stays at MCP_SERVERS_CONFIGURED.
    // That's a known architectural property of #4175 PR 14b, not a bug;
    // the invariant we need to validate is the bootstrap-only one.
    const observed = await waitForMcpGrandchildren(
      daemon.daemon.pid!,
      MCP_SERVERS_CONFIGURED,
    );
    const snapshot = await daemon.client.workspaceMcp();

    expect(snapshot.clientCount).toBe(MCP_SERVERS_CONFIGURED);
    expect(observed.mcpGrandchildren.length).toBe(MCP_SERVERS_CONFIGURED);
    expect(snapshot.clientCount).toBeLessThanOrEqual(
      observed.mcpGrandchildren.length,
    );
  } finally {
    if (daemon) await daemon.dispose();
    fs.rmSync(ws, { recursive: true, force: true });
  }
}, 120_000);
```

The change vs the current test:
- **Removed**: `await daemon.client.createOrAttachSession({ workspaceCwd: ws });`
- **Updated comment block** to explain why we measure pre-session — also documents the per-session-manager-spawns-own-children behavior so a future reader understands what the post-session pgrep count would look like.
- All three `expect` lines unchanged.

Doesn't require touching the prior test (`counts MCP grandchildren as session count grows` at line 406) — that one creates sessions and intentionally measures `mcpGrandchildren.length` against `MCP_SERVERS_CONFIGURED * <sessionCount> * mcpAmplificationFactor`, which already accounts for per-session managers.

## Files to modify

| File | Change |
| --- | --- |
| `integration-tests/cli/qwen-serve-routes.test.ts` | Add `'mcp_guardrail_events',` after line 219 |
| `integration-tests/cli/qwen-serve-baseline.test.ts` | Remove `createOrAttachSession` call inside `clientCount matches external pgrep observation`; update the explanatory comment |

No source code changes. No new imports. Both files already import everything required.

## Follow-up worth flagging (NOT in this PR)

The "double MCP discovery in ACP child" itself is real waste — every `qwen serve` ACP child spawns 2× the MCP child processes it actually uses for tool execution. Worth filing a separate issue for #4175 follow-up to either (a) gate bootstrap MCP discovery in daemon mode behind a `--skip-bootstrap-mcp` flag, or (b) refactor `newSessionConfig` to share the bootstrap's `McpClientManager`. Out of scope here.

## Verification

Local — run only the two affected tests against a freshly bundled CLI:

```sh
npm run build
npm run bundle
KEEP_OUTPUT=true VERBOSE=true npx vitest run \
  integration-tests/cli/qwen-serve-routes.test.ts \
  integration-tests/cli/qwen-serve-baseline.test.ts
```

Expect both to pass on first try (no retries). Specifically:
- `qwen serve — capabilities envelope > advertises all baseline capabilities` — green
- `daemon baseline harness (POSIX-only) > MCP child amplification (P1 baseline) > clientCount matches external pgrep observation` — green
- `... > counts MCP grandchildren as session count grows` — still green (untouched)

CI — push the branch and confirm `E2E Test (Linux) - sandbox:none`, `E2E Test (Linux) - sandbox:docker`, and `E2E Test - macOS` all turn green. The capabilities mismatch will surface immediately if the registry order in `capabilities.ts` ever drifts again — same fail-fast pattern PRs #4268 / #4284 used.

## Final Implementation Status

- **PR status**: All referenced PRs MERGED (2026-05-18). #4295 "refactor(acp-bridge): create skeleton + lift zero-coupling primitives" merged first, followed by #4271 (MCP guardrail events), #4268/#4284 (E2E capability fixes), #4291 (auth follow-up), #4298 (lift status/paths/errors), #4300 (typed errors).
- **Summary**: Both E2E test fixes were implemented exactly as planned. Failure #1 (capabilities list drift) was fixed by adding `'mcp_guardrail_events'` to the integration test. Failure #2 (clientCount vs pgrep) was fixed by restructuring the test to measure pre-session (bootstrap-only state).
- **Key divergences**: None significant. The fix was test-only as planned — no source code changes, just `integration-tests/cli/qwen-serve-routes.test.ts` and `integration-tests/cli/qwen-serve-baseline.test.ts`. The broader refactoring PRs (#4295, #4298, #4300) landed in the same batch.
- **Files actually changed (fix PRs)**: `integration-tests/cli/qwen-serve-routes.test.ts`, `integration-tests/cli/qwen-serve-baseline.test.ts`
