# PR 30a — Local launch references for v0.16-alpha (systemd / launchd / nohup / tmux)

## Context

Per the **2026-05-24 v0.16-alpha scope freeze** in #4175, v0.16-alpha targets text-only chat / coding with **local-only deployment**. PR 30a is the third PR in the F5 release chain (PR 27 ✅ → **PR 30a** → PR 28 → PR 31).

PR 27 (✅ merged 2026-05-24 15:57Z, commit `63803deab`) added the alpha banner + a "v0.16-alpha known limits" section to `docs/users/qwen-serve.md`. That section explicitly says (line 32): *"Local launch via `systemd` / `launchd` / `nohup &` / `tmux` (templates land in PR 30a)"* — PR 30a fills in those templates as a sibling reference page.

Pure markdown. Zero code. Zero tests. ~250 LOC across 1 new file + 2 small cross-link edits.

## Decisions made

| # | Decision | Choice | Why |
|---|---|---|---|
| 1 | New file vs section in `qwen-serve.md` | **New file `docs/users/qwen-serve-deploy-local.md`** (sibling) | `qwen-serve.md` is already 463 lines — adding 200+ LOC of copy-paste templates would push it past readability. Templates are reference material users skim/copy, distinct from the conceptual user guide. |
| 2 | systemd user-level vs system-wide | **User-level (`~/.config/systemd/user/`)** primary, system-wide as a brief 2-line alternative | User-level is safer for the alpha audience (dogfooding developers): no sudo, no system contamination, daemon runs as the user with their existing env/credentials/SSH keys. System-wide is overkill for local-only. |
| 3 | Windows coverage | **Brief footnote pointing to WSL2** (NOT a primary target) | Windows native service infrastructure (`nssm`, Service Control Manager wrappers) is its own surface; alpha is local-only and Linux/macOS dominate the dogfooding audience. WSL2 covers Windows users at zero additional doc cost. |
| 4 | Where to put cross-links from `qwen-serve.md` | (a) line 32 "templates land in PR 30a" → live link; (b) "What's next" section adds a deploy-local entry | Two-point cross-link: existing forward reference becomes hot, plus the natural "where do I go next" hub at the bottom. |
| 5 | Navigation entry in `_meta.ts` | **Sub-entry under existing `qwen-serve`** (not top-level) | Keeps the "Outside of the terminal" group from sprawling. Users land on the main daemon guide first; the deploy reference is a sibling they discover via cross-link or sub-nav. |
| 6 | BYO-token integration | **All templates write `Environment=QWEN_SERVER_TOKEN=...` (or platform equivalent) directly inline** | Matches the PR 27 BYO-token guide pattern. No separate token file, no auto-gen — user generates via `openssl rand -hex 32` and inlines into the unit/plist. Explicit comments call out NOT committing the unit file with a real token. |
| 7 | Token regeneration policy | **Document the rotation flow** ("regenerate → edit unit → systemctl restart" / `launchctl unload+load`) | Operators will ask. One-paragraph callout + commands. Avoids future re-asks. |
| 8 | Reverse proxy / TLS coverage | **Out of scope, explicit callout pointing at PR 30b** | Local-only alpha. Reverse proxy = enterprise pilot, defers per scope freeze. |
| 9 | restart-on-failure semantics | **Cross-link to the archived daemon/serve durability discussion** rather than re-explain | Avoid duplication. Just say "service-manager restart works as expected; sessions are in-memory and re-attach via SSE Last-Event-ID per the daemon/serve durability model". |

## Migration steps

### 0. Branch off `daemon_mode_b_main` (HEAD includes PR 27 merge `63803deab`)

```bash
git fetch origin daemon_mode_b_main
git checkout -b f5-pr30a-local-launch-refs origin/daemon_mode_b_main
git branch --unset-upstream
```

### 1. New file `docs/users/qwen-serve-deploy-local.md` (~220 LOC markdown)

Structure:

```markdown
# Local launch templates for `qwen serve` (v0.16-alpha)

Reference templates for running `qwen serve` as a long-lived background process on a developer workstation. Pairs with the [v0.16-alpha known limits](./qwen-serve.md#v016-alpha-known-limits) — local-only, single-user, BYO bearer token. Containerized / multi-host / TLS-fronted deployments defer to v0.16.x ([PR 30b placeholder]).

## Generate a bearer token (once)

```bash
openssl rand -hex 32 > ~/.qwen-serve-token  # 0600 perms recommended
chmod 600 ~/.qwen-serve-token
export QWEN_SERVER_TOKEN="$(cat ~/.qwen-serve-token)"
```

(See [PR 27 BYO-token guide](./qwen-serve.md#authentication) for the canonical setup; the path / filename is user-managed, not a built-in convention.)

## Linux: systemd user unit

`~/.config/systemd/user/qwen-serve.service`:

```ini
[Unit]
Description=Qwen Code daemon (loopback HTTP + SSE)
After=network.target

[Service]
Type=simple
WorkingDirectory=%h/your-project
ExecStart=/usr/local/bin/qwen serve --bind 127.0.0.1
Environment=QWEN_SERVER_TOKEN=PASTE-YOUR-TOKEN-HERE
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=default.target
```

Manage:

```bash
systemctl --user daemon-reload
systemctl --user enable --now qwen-serve.service
journalctl --user -u qwen-serve -f          # tail logs
systemctl --user restart qwen-serve.service # after token rotation
```

System-wide alternative (shared dev hosts): drop the file at `/etc/systemd/system/qwen-serve@user.service` with `User=...`, manage via `sudo systemctl`. Same body otherwise.

## macOS: launchd user agent

`~/Library/LaunchAgents/com.qwenlm.qwen-serve.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.qwenlm.qwen-serve</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/qwen</string>
    <string>serve</string>
    <string>--bind</string>
    <string>127.0.0.1</string>
  </array>
  <key>WorkingDirectory</key>
  <string>/Users/YOUR-USERNAME/your-project</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>QWEN_SERVER_TOKEN</key>
    <string>PASTE-YOUR-TOKEN-HERE</string>
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/tmp/qwen-serve.out.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/qwen-serve.err.log</string>
</dict>
</plist>
```

Manage:

```bash
launchctl load   ~/Library/LaunchAgents/com.qwenlm.qwen-serve.plist
launchctl unload ~/Library/LaunchAgents/com.qwenlm.qwen-serve.plist  # to stop
tail -f /tmp/qwen-serve.out.log /tmp/qwen-serve.err.log
```

## tmux session (interactive supervision)

```bash
tmux new -d -s qwen-serve "cd ~/your-project && qwen serve"
tmux attach -t qwen-serve   # see live logs, Ctrl-b d to detach
tmux kill-session -t qwen-serve
```

Best when you want to occasionally watch the daemon's stdout (auth warnings, MCP discovery progress) without committing to a service unit.

## nohup one-liner (quick + dirty)

```bash
nohup qwen serve --bind 127.0.0.1 > qwen-serve.log 2>&1 &
echo $!  # daemon PID; save it if you want to kill cleanly later
```

OK for one-off "let me run this in the background while I poke at the API" workflows. **Not recommended** for anything beyond a single session — no restart-on-crash, log file grows unbounded, no clean way to find the daemon if you forget the PID.

## Verifying the daemon is up

```bash
curl http://127.0.0.1:4170/health                                   # → {"status":"ok"}
curl -H "Authorization: Bearer $QWEN_SERVER_TOKEN" \
  http://127.0.0.1:4170/capabilities | jq .protocolVersions         # full feature list
```

## Token rotation

1. Generate a new token: `openssl rand -hex 32 > ~/.qwen-serve-token-new`
2. Edit the unit file / plist / shell export with the new value
3. Restart:
   - systemd: `systemctl --user restart qwen-serve.service`
   - launchd: `launchctl unload ... && launchctl load ...`
4. Update any client SDKs / scripts to read the new token (the SDK env fallback added in PR 27 picks up `QWEN_SERVER_TOKEN` automatically — no client code change needed)

## Restart and crash behavior

Service-manager restart works as expected (systemd `Restart=on-failure`, launchd `KeepAlive=true`). Sessions are in-memory and re-attach via SSE `Last-Event-ID` resume per the archived daemon/serve durability model in [01-http-server-and-middleware.md](../../feature/daemon-serve-mode/01-http-server-and-middleware.md). Cross-restart durability is NOT in v0.16-alpha.

## Out of scope (defers to v0.16.x)

- **Containerized deployment** (Docker, Compose, Kubernetes manifests, nginx + TLS reverse proxy)
- **Cross-host federation** / multi-daemon coordination on one host
- **Auto-generated daemon tokens** with instance-path keying + stale cleanup
- **Windows native service** (`nssm`, Service Control Manager) — for now use [WSL2](https://learn.microsoft.com/en-us/windows/wsl/) and follow the systemd section above

See [v0.16-alpha known limits](./qwen-serve.md#v016-alpha-known-limits) for the full deferred-features list and [#4175](https://github.com/QwenLM/qwen-code/issues/4175) for tracking.
```

### 2. Cross-link from `docs/users/qwen-serve.md` (2 small edits)

**Edit A** at line 32 — make the existing forward reference live:

```diff
-- ✅ Local launch via `systemd` / `launchd` / `nohup &` / `tmux` (templates land in PR 30a)
++ ✅ Local launch via `systemd` / `launchd` / `nohup &` / `tmux` — see [Local launch templates](./qwen-serve-deploy-local.md)
```

**Edit B** at the "What's next" section (line 459+) — add a third bullet at top:

```diff
 ## What's next

+- **Setting up a long-running daemon?** [Local launch templates (systemd / launchd / nohup / tmux)](./qwen-serve-deploy-local.md) for v0.16-alpha (local-only).
 - **Build a client?** See the [DaemonClient TypeScript quickstart]...
```

### 3. Navigation entry in `docs/users/_meta.ts`

Add a sub-entry under `qwen-serve`:

```diff
   'qwen-serve': 'Daemon mode (qwen serve)',
+  'qwen-serve-deploy-local': 'Daemon mode — local launch templates',
```

Placed immediately after the existing `qwen-serve` line so the nav reads as a consecutive pair.

### 4. Format + verify before commit

- `npm run format -- docs/users/qwen-serve-deploy-local.md docs/users/qwen-serve.md docs/users/_meta.ts` (pre-emptive prettier)
- Visual sanity-check: `cat docs/users/qwen-serve-deploy-local.md | head -50` (no formatter regressions on code blocks)
- No tsc / vitest / eslint runs needed — pure markdown + a 1-line `_meta.ts` addition (TS file but a string literal, no type changes)
- For `_meta.ts` only: `npx tsc --noEmit -p docs/tsconfig.json` if a docs tsconfig exists; otherwise the global pre-commit hook handles it
- Verify anchors render: `grep -c "## v016-alpha-known-limits\|## Authentication\|## Durability model" docs/users/qwen-serve.md` returns 3 (anchors my new file links to)

### 5. Single commit + push

```
docs(deploy): local launch templates for v0.16-alpha (PR 30a)

Third PR in the F5 release chain (PR 27 ✅ → PR 30a → 28 → 31) per
the 2026-05-24 v0.16-alpha scope freeze in #4175 (text-only +
local-only). Pure markdown.

New `docs/users/qwen-serve-deploy-local.md` with copy-paste-ready
templates for:
  - systemd user-level unit (Linux)
  - launchd LaunchAgent plist (macOS)
  - tmux session (interactive supervision)
  - nohup one-liner (quick + dirty, with caveats)
  - curl smoke-check + token rotation walkthrough

All templates inline `QWEN_SERVER_TOKEN=...` directly per the BYO-
token guide PR 27 added to qwen-serve.md. No auto-gen, no token-
store infrastructure — user generates via openssl rand -hex 32 and
pastes into the unit/plist. Explicit "don't commit your token"
callout where it matters.

Cross-links from qwen-serve.md "v0.16-alpha known limits" line 32
(forward reference becomes a live link) and "What's next" section
(natural discovery hub at the bottom). _meta.ts gets a sibling
nav entry under qwen-serve.

Out of scope (deferred to v0.16.x): containerized deployment,
cross-host federation, auto-gen tokens, native Windows service.
WSL2 footnote covers Windows users for free.

Part of #4175.
```

```bash
git push -u origin f5-pr30a-local-launch-refs
```

### 6. Open PR targeting `daemon_mode_b_main`

Use a PR body that:
- Opens with the 2026-05-24 scope freeze + PR 27 ✅ context
- One-line summary of each template (systemd / launchd / tmux / nohup) with file count and LOC
- Lists the 2 cross-link edits in qwen-serve.md
- Lists the 1-line _meta.ts nav addition
- Explicit "out of scope: containerized / cross-host / Windows native" callout matching the file's own callout

## Critical files

**Created** (1):
- `docs/users/qwen-serve-deploy-local.md` (~220 LOC markdown — 4 templates + token rotation + smoke-check + out-of-scope callout)

**Modified** (2):
- `docs/users/qwen-serve.md` — 2 small cross-link edits (line 32 forward reference becomes live + new bullet in "What's next")
- `docs/users/_meta.ts` — 1 new nav entry under `qwen-serve`

**Unchanged**:
- All production code; SDK; tests; build / CI scaffolding
- Root `README.md` — daemon section already mentions `QWEN_SERVER_TOKEN`; alpha framing (per PR 27 decision) lives in the user guide, not the README. Same applies here.
- `docs/developers/*` — local launch is user-facing, not developer-facing

## Backward compatibility guarantees

- Net-additive: 1 new doc page + 2 cross-link edits + 1 nav entry. Zero behavior change.
- All existing anchors (`#authentication`, `#durability-model`, `#v016-alpha-known-limits`) verified to exist in `qwen-serve.md` so the new file's `./qwen-serve.md#anchor` links resolve.
- The new nav entry is namespaced under the existing "Outside of the terminal" group; no reordering, no rename, no breaking link from any external site that currently deep-links into the docs.

## Verification

1. **Renderer sanity** — open `docs/users/qwen-serve-deploy-local.md` in a markdown previewer (or rely on the qwenlm.github.io publish pipeline which uses the same renderer):
   - All code fences render correctly (especially the `<plist>` XML and the `[Service]` ini blocks)
   - All anchor links to `./qwen-serve.md#...` resolve
   - The "Out of scope" callout reads cleanly
2. **Cross-link integrity**:
   - `grep -n "qwen-serve-deploy-local" docs/users/qwen-serve.md` returns 2 hits (line 32 + "What's next")
   - `grep -n "qwen-serve-deploy-local" docs/users/_meta.ts` returns 1 hit
3. **Pre-commit hooks** pass: prettier reformats consistently (expect cosmetic reflow only, no real diff)
4. **Manual smoke** (optional):
   - Copy the systemd unit template into `~/.config/systemd/user/qwen-serve.service`, paste a real token, `systemctl --user enable --now qwen-serve.service`, verify `curl http://127.0.0.1:4170/health` returns `{"status":"ok"}` and `journalctl --user -u qwen-serve` shows the daemon's startup banner
   - Same for the launchd plist on macOS

## Risk + mitigation

| Risk | Mitigation |
|---|---|
| User pastes their real token into the unit file then commits the unit to git | Inline `# DO NOT COMMIT this file with a real token` comment in each template's token line. Plus the explicit "user-managed file, not a built-in path" framing throughout. |
| Anchor link `#v016-alpha-known-limits` doesn't render (markdown anchor generation rules differ between GitHub and qwenlm.github.io) | Use the same anchor pattern that PR 27 already established in `qwen-serve.md`. If PR 27's anchors render correctly post-merge (verify on qwenlm.github.io after publish), the same pattern works here. |
| systemd `WorkingDirectory=%h/your-project` example confuses users (it's a literal placeholder) | Add an explicit comment: `# Replace with your actual project path; %h expands to $HOME under systemd user instances`. |
| launchd plist requires absolute paths (no `~` or `%h` expansion) — common confusion | Plist example uses `/Users/YOUR-USERNAME/your-project` literal placeholder + a one-line callout below the plist warning that launchd doesn't expand `~`. |
| `nohup` + `kill $!` pattern leaks the PID if the user forgets to capture it | Section explicitly says "Not recommended" + points users at tmux/systemd/launchd as the better default. |
| Pre-commit prettier reformats the markdown table / nested code fences | Pre-emptively run `npm run format`; expect cosmetic reflow only. |
| Lockfile churn | No package.json changes. Verify `git diff package-lock.json` empty before push. |

## Follow-ups (out of scope for this PR)

- **PR 30b** (deferred to v0.16.x patch): containerized deployment refs (Dockerfile, docker-compose, k8s manifest, nginx reverse-proxy with TLS termination, multi-instance token isolation). Requires a real enterprise pilot to avoid documentation rot.
- **Windows native service**: `nssm` wrapper or Service Control Manager integration. Probably v0.16.x patch alongside any wider Windows hardening work.
- **Generated unit-file CLI**: `qwen serve install --systemd-user` could write the unit file with a freshly-generated token. Out of scope for v0.16-alpha (would partially overlap with PR 29's auto-gen feature, which is itself deferred). Re-evaluate alongside any v0.16.x pilot needs.

## Final Implementation Status

- **#4175** — OPEN issue (roadmap tracker). PR 30a was part of the F5 release chain documented there.
- **Outcome**: This plan (PR 30a — local launch reference docs) has NOT been implemented as a merged PR. The plan is a pure-markdown documentation PR (systemd/launchd/tmux/nohup templates) that was designed to follow PR 27's merge. PR 27 merged 2026-05-24 but PR 30a itself does not appear as a merged PR in the repository.
- **Key divergence**: Plan remains unexecuted. The F5 release chain (PR 27 -> 30a -> 28 -> 31) stalled after PR 27.
