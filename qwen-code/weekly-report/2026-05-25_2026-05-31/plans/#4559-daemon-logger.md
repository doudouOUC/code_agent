# Test Plan: babysit-pr skill incremental-first changes

## Context

SKILL.md was updated to change default polling from `--full` (all items every poll) to incremental-first (first poll = natural full scan via empty state, subsequent polls = delta only). A dedup guard was also added to prevent replying to threads that already have replies from us. Need to verify these changes work end-to-end.

## Test Strategy

Use merged PR #4559 (small, 3 comments, 13 reviews) as a safe test target — no risk of accidentally posting replies since we'll only run the poll script, not the autonomous handling. Back up PR #4556's state file before testing and restore after.

## Test Cases

### T1: Incremental-first — first poll reports everything as "new"
1. Ensure no state file exists for PR #4559: `rm -f ~/.claude/state/babysit-pr/QwenLM-qwen-code-4559.json`
2. Run: `python3 ~/.claude/skills/babysit-pr/scripts/poll.py --pr 4559 --repo QwenLM/qwen-code`
3. **Expected**: All reviews + comments reported as "new". State file created.
4. **Verify**: State file exists and contains non-empty `comments_seen`/`reviews_seen` arrays.

### T2: Incremental — second poll reports nothing new
1. Run same command again (no `--full`, no `--reset-state`)
2. **Expected**: Output is `_No new comments, reviews, or CI failures since last poll._`
3. **Verify**: State file `updated_at` advanced.

### T3: --full is read-only (does not advance state)
1. Note current state file's `updated_at`
2. Run with `--full`: `python3 ~/.claude/skills/babysit-pr/scripts/poll.py --pr 4559 --repo QwenLM/qwen-code --full`
3. **Expected**: Reports all items again (like T1). State file unchanged.
4. **Verify**: `updated_at` is same as before `--full` run.

### T4: Incremental after --full still reports nothing new
1. Run without `--full` again
2. **Expected**: `_No new comments..._` — confirming `--full` didn't reset state.

### T5: --reset-state re-baselines
1. Run with `--reset-state`: `python3 ~/.claude/skills/babysit-pr/scripts/poll.py --pr 4559 --repo QwenLM/qwen-code --reset-state`
2. **Expected**: Reports everything as "new" again (state was deleted then recreated).

### T6: Dedup guard GraphQL query works
1. Run the dedup guard query against PR #4556 (where all threads have replies from doudouOUC)
2. **Expected**: Query returns 0 threads (all unresolved threads already have our replies)
3. This validates that if the skill ran on 4556, it would not post duplicate replies.

### T7: SKILL.md consistency audit
1. Grep for any remaining "default to --full" or contradictory language
2. Verify the "Autonomous comment handling" section references the dedup guard
3. Verify the "Combining with /loop" section uses incremental default
4. Verify no section still instructs the model to pass `--full` by default

## Cleanup
- Remove test state file: `rm ~/.claude/state/babysit-pr/QwenLM-qwen-code-4559.json`
- Verify PR #4556 state file is untouched

## Files
- `/Users/jinye.djy/.claude/skills/babysit-pr/SKILL.md` — the updated skill instructions
- `/Users/jinye.djy/.claude/skills/babysit-pr/scripts/poll.py` — the poll script (unchanged)
- `/Users/jinye.djy/.claude/state/babysit-pr/QwenLM-qwen-code-4556.json` — production state (do not modify)

## Final Implementation Status

- **PR #4556** — MERGED 2026-05-29. Title: "feat(telemetry): trace daemon prompt lifecycle". (14 files — daemon tracing infrastructure.)
- **PR #4559** — MERGED 2026-05-27. Title: "feat(serve): add daemon file logger (#4548)". (14 files — daemon file logging.)
- **Outcome**: Both PRs referenced in this test plan merged successfully. They served as safe, already-merged test targets for validating the babysit-pr skill's incremental-first polling changes. The test plan itself is a verification document, not a code-change plan.
- **Key divergence**: None. This was a test plan for skill behavior validation, not a code implementation plan. The skill changes (incremental-first default + dedup guard) were applied directly to SKILL.md outside of these PRs.
