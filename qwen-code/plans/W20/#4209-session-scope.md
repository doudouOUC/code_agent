# Wave 2 PR 5.1 — `fix(serve): align integration test + user doc with merged sessionScope override`

## Context

PR #4209 (Wave 2 PR 5) was squash-merged at `878f35fc4` on 2026-05-16, but wenshao's `CHANGES_REQUESTED` review carried two findings that landed unaddressed because the inline `!== undefined` fix shipped while the review-level findings did not. Both are direct semantic regressions caused by my PR — neither is a future enhancement.

**Finding 1 (Critical) — integration test asserts a stale feature list.** `integration-tests/cli/qwen-serve-routes.test.ts:183` says `it('advertises all 9 Stage 1 features', ...)` and asserts `caps.features` deep-equals a 9-element array. The merged daemon now advertises 10 features (`session_scope_override` inserted between `session_create` and `session_list` in `capabilities.ts:29`). Running this test against a real daemon **fails**. PR CI didn't catch it because the integration suite needs a real `qwen serve` spawn and runs only in the release pipeline; my unit-level update of `EXPECTED_STAGE1_FEATURES` in `server.test.ts:62` left the integration sibling stale.

**Finding 2 (Suggestion) — user doc contradicts shipped behavior.** `docs/users/qwen-serve.md:193` lists "Per-request `sessionScope` override on `POST /session`" as item 1 of the **Blockers for serious downstream use** section ("today the daemon-wide default is the only setting"). That bullet is the literal opposite of what the daemon now does and what the protocol doc documents. Downstream integrators reading the user guide will get inverse guidance.

**Why a follow-up PR rather than CHANGELOG / amend.** The PR is squash-merged, so no amend. Reverting + re-merging is wasteful for a 2-file fix. Both fixes are pure documentation/test corrections; bundling them in a tiny `fix(serve)` PR is the cleanest path.

## Critical files

Two modifications, no new files.

| Path | Change | Approx LOC |
|---|---|---|
| `integration-tests/cli/qwen-serve-routes.test.ts` | Update test name to "all 10 Stage 1 features"; insert `'session_scope_override'` into the asserted feature array between `session_create` and `session_list` (matches the registry order in `packages/cli/src/serve/capabilities.ts:29`) | +2 / −1 |
| `docs/users/qwen-serve.md` | Remove item 1 from the "Blockers for serious downstream use" list (the per-request `sessionScope` override bullet); renumber the remaining blockers and reliability items to keep the section internally consistent | +2 / −2 |

No code changes. No SDK changes. No test additions beyond the corrected assertion.

## Implementation sketch

### 1. `integration-tests/cli/qwen-serve-routes.test.ts`

Around `:183`:

```ts
describe('qwen serve — capabilities envelope', () => {
  it('advertises all 10 Stage 1 features', async () => {
    const caps = await client.capabilities();
    expect(caps.v).toBe(1);
    expect(caps.mode).toBe('http-bridge');
    expect(caps.features).toEqual([
      'health',
      'capabilities',
      'session_create',
      'session_scope_override',  // ← added per #4209 (registry order)
      'session_list',
      'session_prompt',
      'session_cancel',
      'session_events',
      'session_set_model',
      'permission_vote',
    ]);
  });
});
```

Mirrors the unit-level constant `EXPECTED_STAGE1_FEATURES` at `packages/cli/src/serve/server.test.ts:58-69` exactly — they should stay in lockstep.

### 2. `docs/users/qwen-serve.md`

Around `:191-201`:

- Remove item 1 ("Per-request `sessionScope` override on `POST /session`…") from the **Blockers for serious downstream use** list.
- Renumber items 2 / 3 → 1 / 2 in that block.
- Renumber items 4–7 → 3–6 in the **Reliability baseline** block.
- Renumber items 8–10 → 7–9 in the **Integration ergonomics** block.

Optionally add a one-line note at the top of the section saying "Per-request `sessionScope` override shipped in #4175 PR 5; see protocol doc for usage." — but that risks rotting too. Cleaner: just delete the obsolete bullet and renumber.

## Verification

```bash
# 1. Unit test sanity (already passes, just confirming no drift).
npx vitest run packages/cli/src/serve/server.test.ts

# 2. Integration test against a built daemon — this is the test that was
#    failing before this PR. Requires `npm run build` to refresh dist.
npm run build
TEST_CLI_PATH=$(pwd)/packages/cli/dist/index.js \
  npx vitest run integration-tests/cli/qwen-serve-routes.test.ts \
  -t "advertises all 10 Stage 1 features"

# 3. Cross-check the unit constant and integration array are identical.
diff <(grep -A 11 "EXPECTED_STAGE1_FEATURES" packages/cli/src/serve/server.test.ts | head -12) \
     <(grep -A 11 "advertises all 10" integration-tests/cli/qwen-serve-routes.test.ts | head -12)
# (visual diff — strings should match in the same order)

# 4. Markdown lint / doc render — open docs/users/qwen-serve.md and skim
#    the "Stage 1.5+ runtime guarantees" section to confirm renumbering
#    is consistent.
```

### Engineering principles checklist

- [x] **Independently mergeable** — pure doc + test correction; no production code touched.
- [x] **Backward compatible** — no API / wire / behavior change.
- [x] **Default off** — N/A (no feature flag, no toggleable behavior).
- [x] **Stage 1 routes preserved** — no route changes.
- [x] **Gradual migration** — N/A.
- [x] **Reversible** — revert restores the prior (now-incorrect) wording / count.
- [x] **Tests-first** — the failing integration test IS the regression; this PR fixes it.

## PR shape

- Branch: `fix/serve-session-scope-override-followup` (off `origin/main`)
- Title: `fix(serve): align integration test + user doc with merged sessionScope override`
- Body cites PR #4209 + the two wenshao findings as the explicit motivation; references issue #4175 as the parent rollout.
- Single squash commit acceptable.

## Estimated work

| Step | Estimate |
|---|---|
| Branch off `origin/main` | 0.02d |
| `integration-tests/cli/qwen-serve-routes.test.ts` edit | 0.02d |
| `docs/users/qwen-serve.md` edit (renumbering) | 0.05d |
| Verification (unit + integration spot-run) | 0.05d |
| PR description + push | 0.05d |
| **Total** | **~0.2d** |

## Final Implementation Status

- **PR status**: #4209 — MERGED on 2026-05-16 (the parent PR this follow-up was written for)
- **What was implemented**: PR #4209 shipped the `sessionScope` override feature. This plan describes a follow-up fix PR (#4175 Wave 2 PR 5.1) to align the integration test and user doc with the merged change.
- **Key divergences**: The follow-up PR for the test/doc fix does not appear to have been created as a standalone PR. The fixes may have been folded into subsequent PRs or remain pending.
- **Files planned to change**: `integration-tests/cli/qwen-serve-routes.test.ts`, `docs/users/qwen-serve.md`
- **Parent PR #4209 files changed**: `docs/developers/qwen-serve-protocol.md`, `packages/cli/src/serve/capabilities.ts`, `packages/cli/src/serve/httpAcpBridge.ts` (+test), `packages/cli/src/serve/server.ts` (+test), `packages/sdk-typescript/src/daemon/DaemonClient.ts` (+test)
