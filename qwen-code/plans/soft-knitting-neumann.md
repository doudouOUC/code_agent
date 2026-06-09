# Plan: Port `/stuck` diagnostic skill to qwen-code

## Context

claude-code has an internal-only `/stuck` skill that diagnoses frozen/slow sessions by scanning system processes, checking CPU/memory/state, and reporting findings. It's a pure prompt-based bundled skill with no TypeScript logic — just a diagnostic prompt injected into the conversation.

We want to port this capability to qwen-code, adapted for:
- qwen-code's process names and directory paths
- No Slack reporting (Anthropic-internal); output diagnostics directly to the user
- Available to all users (no `USER_TYPE` gate)
- Cross-platform (macOS + Linux)

## Implementation

### Create one file

**File:** `packages/core/src/skills/bundled/stuck/SKILL.md`

### Frontmatter

```yaml
---
name: stuck
description: Diagnose frozen, stuck, or slow Qwen Code sessions on this machine. Scans for problematic processes, high CPU/memory usage, hung subprocesses, and debug logs. Use /stuck or /stuck <PID> to focus on a specific process.
argument-hint: '[PID or symptom]'
---
```

- No `allowedTools` — only needs the default Shell tool
- No `disable-model-invocation` — allow model to trigger when user complains about freezing
- No `when_to_use` — keep it simple like the other bundled skills

### Prompt body — key adaptations from claude-code

| Section | claude-code | qwen-code adaptation |
|---------|-------------|---------------------|
| Process scan | `grep -E '(claude\|cli)'` | `grep -E '(qwen\|node.*qwen)'` to catch both installed binary and dev-mode node processes |
| Debug logs | `~/.claude/debug/<session-id>.txt` | `~/.qwen/debug/<session-id>.txt`; also mention `~/.qwen/debug/latest` symlink |
| Stack dump | macOS `sample <pid> 3` only | macOS `sample <pid> 3` + Linux `cat /proc/<pid>/stack` or `strace -p <pid> -c -f` |
| Slack report | Post to `#claude-code-feedback` via Slack MCP | **Remove entirely** — format findings as structured terminal output for the user |
| ToolSearch | `Use ToolSearch to find slack_send_message` | **Remove** — no Slack dependency |
| User args | Appended as `## User-provided context` | Same pattern — handled naturally by `BundledSkillLoader` which appends raw invocation to body |

### Prompt structure

```
# /stuck — diagnose frozen/slow Qwen Code sessions

<intro: user thinks a session is frozen/stuck/slow, investigate>

## What to look for
- High CPU (>=90%) sustained
- Process state D (uninterruptible sleep), T (stopped), Z (zombie)
- Very high RSS (>=4GB)
- Stuck child processes (hung git, node, shell subprocesses)

## Investigation steps
1. List all Qwen Code processes:
   ps -axo pid=,pcpu=,rss=,etime=,state=,comm=,command= | grep -E '(qwen|node.*qwen)' | grep -v grep
   Filter to rows where comm is qwen, OR (comm is node/bun AND command path contains "qwen").
   
2. For suspicious processes: pgrep -lP, re-sample CPU, check command lines
   Check debug logs at ~/.qwen/debug/<session-id>.txt
   Check ~/.qwen/debug/latest symlink for most recent session

3. Stack dump (optional, advanced):
   - macOS: sample <pid> 3
   - Linux: cat /proc/<pid>/stack, or strace -p <pid> -c -f

## Report
Present a structured diagnostic report directly to the user:
- Per-session: PID, CPU%, RSS, state, uptime, command, child processes
- Diagnosis of likely cause
- Relevant debug log tail if captured
- Recommendation (kill, wait, report bug, etc.)

If nothing stuck found, tell user all sessions look healthy.

## Notes
- Diagnostic only — do not kill or signal any processes
- If user gave a PID or symptom as argument, focus there first
```

## Verification

1. **File loading**: Run `qwen` and type `/stuck` — verify the skill appears in autocomplete and executes
2. **Basic diagnosis**: With a healthy system, verify it reports "all sessions look healthy"
3. **With args**: Type `/stuck 12345` — verify it focuses on that PID
4. **Model invocation**: Verify `/skills` lists `stuck` as available to the model
