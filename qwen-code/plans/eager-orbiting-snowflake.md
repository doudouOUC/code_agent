# Plan: babysit-pr skill optimizations

## Context

After extensive use of the babysit-pr skill on PR #4556 (30+ polls, 3 review fix rounds, 24 comment threads), several friction points emerged:
- Own replies flood every poll as "new" items
- SKILL.md references `--full` as if it doesn't exist, but `poll.py` already has it
- Bot-reply table contradicts the autonomous handling section
- No squash guidance after multi-round review fixes
- Cron defaults to session-only, dies on restart
- No concrete mechanism for "already addressed" detection in full-mode polls

## Changes

### 1. Add `--exclude-author` to `poll.py` (~10 lines)

**File:** `~/.claude/skills/babysit-pr/scripts/poll.py`

After `diff()` returns the delta dict in `main()`, filter out comments/reviews from excluded authors:

```python
parser.add_argument('--exclude-author', nargs='*', default=[])
# After diff:
if args.exclude_author:
    excluded = set(args.exclude_author)
    delta["new_reviews"] = [r for r in delta["new_reviews"] if r["author"] not in excluded]
    delta["new_comments"] = [c for c in delta["new_comments"] if c["author"] not in excluded]
    delta["new_issue_comments"] = [c for c in delta["new_issue_comments"] if c["author"] not in excluded]
```

### 2. Update SKILL.md invocation to auto-exclude PR author (~5 lines)

**File:** `~/.claude/skills/babysit-pr/SKILL.md`

In the Invocation section, add guidance:
- Always pass `--exclude-author <pr-author-login>` to filter own replies
- The model should resolve the PR author login via `gh pr view --json author --jq .author.login` and pass it automatically

### 3. Fix `--full` references in SKILL.md

**File:** `~/.claude/skills/babysit-pr/SKILL.md`

The script already supports `--full`. Update the skill to:
- Remove any language suggesting `--full` doesn't exist or needs `--reset-state` as a workaround
- Update the invocation table to include `--full`
- Clarify: `--full` = read-only full report, `--reset-state` = destructive re-baseline

### 4. Remove contradictory bot-reply table row for humans

**File:** `~/.claude/skills/babysit-pr/SKILL.md`

The "Auto-replying to bot reviewers" table has a row for human reviewers saying "Always report and wait for user direction." This contradicts the "Autonomous comment handling" section. Remove the human row from the bot-reply table — it's a bot-only policy table, humans are covered by autonomous handling.

### 5. Add squash guidance after approval

**File:** `~/.claude/skills/babysit-pr/SKILL.md`

Add a section after "Post-fix obligations":
- After reviewer approves (CHANGES_REQUESTED dismissed), if there are >1 fix commits on top of the original PR commits, recommend squashing fix commits into one before merge
- Don't auto-squash — suggest to the user

### 6. Default cron to durable for `/loop` combinations

**File:** `~/.claude/skills/babysit-pr/SKILL.md`

In "Combining with `/loop`" section, add guidance:
- When setting up recurring polls via CronCreate, use `durable: true` so the job survives session restarts
- Mention the 7-day auto-expiry still applies

## Verification

1. Run `python3 ~/.claude/skills/babysit-pr/scripts/poll.py --pr 4556 --exclude-author doudouOUC` — should filter out all doudouOUC comments
2. Run `python3 ~/.claude/skills/babysit-pr/scripts/poll.py --pr 4556 --full` — should show all items without mutating state
3. Run incremental poll after `--full` — should still report correctly from last saved baseline
4. Read through updated SKILL.md and verify no contradictions remain

## Final Implementation Status

- **PR #4556**: MERGED (2026-05-29) — "feat(telemetry): trace daemon prompt lifecycle" (unrelated to this plan)
- **Summary**: This plan targets local skill file improvements (`~/.claude/skills/babysit-pr/`), not a repo PR. PR #4556 was merely the context where these friction points were observed during 30+ polls. The skill optimizations (--exclude-author, --full clarification, bot-reply table fix, squash guidance, durable cron) are local config changes, not tracked in the QwenLM/qwen-code repo.
- **Implementation status**: Partially applied as local skill file edits. No corresponding repo PR exists or is needed.
- **Key divergences**: N/A — this is a local skill improvement plan, not a codebase change.
