# Plan: claude-builders-bounty #3 — PreToolUse Destructive Command Blocker

## Context

Bounty issue: https://github.com/claude-builders-bounty/claude-builders-bounty/issues/3
Reward: $100 via Opire, auto-paid on merge.

There are ~20+ open PRs but **none merged**. The existing submissions (e.g., PR #2285) use Python. We'll differentiate with a **pure bash implementation** (zero dependencies beyond `jq`) that is more robust in pattern matching and handles edge cases the others miss.

## Deliverables

```
tools/pre-tool-use-guard/
├── block-destructive.sh   # The hook script
├── install.sh             # 1-command installer
└── README.md              # Usage docs
```

## Implementation

### 1. `block-destructive.sh` (the hook)

- Reads JSON from stdin, extracts `tool_input.command` via `jq`
- Checks against these required patterns:
  - `rm -rf` / `rm -fr` (including `rm -r -f`, flags reordered)
  - `DROP TABLE` (case-insensitive)
  - `git push --force` / `git push -f` / `git push origin main --force`
  - `TRUNCATE` (case-insensitive)
  - `DELETE FROM ... ` without `WHERE` (case-insensitive)
- On match: outputs JSON with `permissionDecision: "deny"` + reason
- On match: appends to `~/.claude/hooks/blocked.log` (format: `ISO-timestamp\tcommand\tproject-path\treason`)
- On no match: exits 0 silently (defer to normal flow)
- Edge cases handled: backslash escapes, quoted substrings, piped commands

### 2. `install.sh`

- Copies hook to `~/.claude/hooks/block-destructive.sh`
- Merges hook config into `~/.claude/settings.json` (using `jq`)
- Idempotent (safe to run multiple times)

### 3. `README.md`

- What it blocks (with examples)
- Install in 2 commands: `git clone ... && ./tools/pre-tool-use-guard/install.sh`
- Uninstall instructions
- How to check the log

## Verification

1. Run `echo '{"tool_name":"Bash","tool_input":{"command":"rm -rf /"},"cwd":"/tmp"}' | ./block-destructive.sh` → should output deny JSON
2. Run `echo '{"tool_name":"Bash","tool_input":{"command":"ls -la"},"cwd":"/tmp"}' | ./block-destructive.sh` → should output nothing (exit 0)
3. Check `~/.claude/hooks/blocked.log` after blocked attempt
4. Run installer, verify `~/.claude/settings.json` has the hook entry
5. Test in actual Claude Code session

## Final Implementation Status

- **PR status**: CLOSED (not merged) — PR #2285 "refactor: Start qwen after installation" was closed without merge.
- **Summary**: This plan targeted the claude-builders-bounty #3 (PreToolUse Destructive Command Blocker, $100 reward). The PR was submitted but never merged. The bounty issue had 20+ competing submissions; none were merged at the time of this PR's closure.
- **Key divergences**: The plan proposed a pure bash implementation with `block-destructive.sh` + `install.sh` + `README.md`. The PR title ("Start qwen after installation") suggests the actual PR content may have diverged from the plan, or was a different submission entirely.
- **Outcome**: Bounty not claimed. Plan abandoned.
