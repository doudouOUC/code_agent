# Open Source Bounty Issues Research

> Researched: 2026-06-01

## Tier 1: High-Quality Projects + Clear Requirements

### 1. commaai/openpilot #33207 - Get MetaDrive simulator working on macOS

- **Repo**: commaai/openpilot (61k+ stars)
- **URL**: https://github.com/commaai/openpilot/issues/33207
- **Bounty**: Labeled bounty (amount unlisted)
- **Difficulty**: Medium
- **Direction**: Python / MetaDrive / macOS adaptation
- **Requirements**: Must work as well as on Linux. Must pass CI test: `tools/sim/tests/test_metadrive_bridge.py`
- **Comments**: 11
- **Author**: adeebshihadeh (Adeeb Shihadeh, comma.ai founder)

### 2. commaai/openpilot #30693 - Run MetaDrive simulation test in GitHub Actions

- **Repo**: commaai/openpilot (61k+ stars)
- **URL**: https://github.com/commaai/openpilot/issues/30693
- **Bounty**: Labeled bounty (amount unlisted)
- **Difficulty**: Medium
- **Direction**: CI / Docker / headless rendering
- **Requirements**:
  - Runs on free-tier GitHub Actions instances
  - Reliable — passes 20+ times in a row
  - Real-time: 1m driving = 1m CI time
  - Logs (qlog, rlog, camera files) uploaded as artifacts
- **Reference**: `tools/sim/tests/test_sim_bridge.py`

### 3. commaai/openpilot #32425 - Fuzz testing for tx messages

- **Repo**: commaai/openpilot (61k+ stars)
- **URL**: https://github.com/commaai/openpilot/issues/32425
- **Bounty**: Labeled bounty (amount unlisted)
- **Difficulty**: Medium-High
- **Direction**: Python/C fuzz testing
- **Requirements**:
  - Detect mismatches in tx (sent messages) logic between openpilot and panda
  - Extensible (generic, easy to expand with more state)
  - As performant as current fuzzy testing
  - Covers as many cases as possible
- **Comments**: 8
- **Reference PR**: https://github.com/commaai/openpilot/pull/30443

### 4. spaceandtimefdn/sxt-proof-of-sql #228 - Make Scalar conversions explicit

- **Repo**: spaceandtimefdn/sxt-proof-of-sql (5.4k stars)
- **URL**: https://github.com/spaceandtimefdn/sxt-proof-of-sql/issues/228
- **Bounty**: 💎 Bounty label
- **Difficulty**: Medium
- **Direction**: Rust refactor, multiple sub-PRs
- **Requirements** (each a separate PR):
  1. Remove `Into<[u64; 4]>`, `From<[u64; 4]>`, `RefInto<[u64; 4]>` bounds → replace with trait methods `from_limbs` / `to_limbs`
  2. Remove `From<&str>`, `From<String>` bounds → replace with `fn from_str_via_hash(val: &str) -> Self`
  3. Remove `VarInt` bound → replace with blanket `impl<S: Scalar> VarInt for S`
- **Comments**: 28
- **Note**: Beware merge conflicts with issue #234

### 5. microg/GmsCore #2994 - RCS Support

- **Repo**: microg/GmsCore
- **URL**: https://github.com/microg/GmsCore/issues/2994
- **Bounty**: $14,999
- **Difficulty**: Very High
- **Direction**: Android / protocol reverse engineering
- **Note**: Extremely complex, requires deep Android framework + messaging protocol knowledge

---

## Tier 2: Smaller Bounties + Clear Specs (Quick Wins)

### 6. ~~claude-builders-bounty #3 - Pre-tool-use hook blocking destructive bash~~ [SUBMITTED]

- **URL**: https://github.com/claude-builders-bounty/claude-builders-bounty/issues/3
- **PR**: https://github.com/claude-builders-bounty/claude-builders-bounty/pull/2378
- **Status**: PR submitted, awaiting merge
- **Bounty**: $100
- **Difficulty**: Low
- **Direction**: Shell / Hook / Security
- **Labels**: bounty, hook, security

### 7. claude-builders-bounty #4 - PR review sub-agent

- **URL**: https://github.com/claude-builders-bounty/claude-builders-bounty/issues/4
- **Bounty**: $150
- **Difficulty**: Medium
- **Direction**: Claude Code agent development
- **Labels**: bounty, agent

### 8. claude-builders-bounty #5 - n8n + Claude Code weekly dev summary

- **URL**: https://github.com/claude-builders-bounty/claude-builders-bounty/issues/5
- **Bounty**: $200
- **Difficulty**: Medium
- **Direction**: n8n workflow automation
- **Labels**: bounty, workflow

### 9. claude-builders-bounty #1 - CHANGELOG generator skill

- **URL**: https://github.com/claude-builders-bounty/claude-builders-bounty/issues/1
- **Bounty**: $50
- **Difficulty**: Low
- **Direction**: Git / Shell scripting
- **Labels**: bounty, skill, good first issue

---

## Tier 3: High Bounty but Requires Specific Hardware/Domain

### 10. commaai/opendbc #3426 - Ford F-150 2026 (TRON) support

- **URL**: https://github.com/commaai/opendbc/issues/3426
- **Bounty**: $10,000
- **Difficulty**: High
- **Direction**: Car porting / CAN bus / hardware
- **Requirements**: Harness design (schematic), high quality lateral port, proof-of-concept longitudinal support
- **Note**: Requires physical car + comma hardware

### 11. QubesOS/qubes-issues #4318 - Port Qubes to ppc64

- **URL**: https://github.com/QubesOS/qubes-issues/issues/4318
- **Bounty**: 3 BTC
- **Difficulty**: Extreme
- **Direction**: Kernel / hypervisor / OS porting
- **Note**: Multi-year effort, requires deep systems programming

---

## Tier 4: Paid Feature Bounties (warpSpeed)

### 12. warpspeed-bounties #1 - Attachment Summarizer Service

- **URL**: https://github.com/warpspeedopen-source/warpspeed-bounties/issues/1
- **Bounty**: $960
- **Difficulty**: Expert
- **Direction**: Node.js / TypeScript / AWS SQS / GCS / Ollama
- **Requirements**: SQS consumer → GCS download → file parsing (PDF/Word/Excel/HTML/images) → LLM summarization
- **Note**: Must sign up at warpspeedopen.org and claim before starting

### 13. warpspeed-bounties #9 - Audio Note Recording

- **URL**: https://github.com/warpspeedopen-source/warpspeed-bounties/issues/9
- **Bounty**: $750
- **Difficulty**: Hard
- **Direction**: React Native / TypeScript / Audio
- **Requirements**: Record, playback, transcribe, manage audio notes with full UX
- **Note**: Repo has only 1 star — newer/smaller project

---

## Recommended Strategy

| Your Stack | Best Pick | Why |
|---|---|---|
| Rust | sxt-proof-of-sql #228 | Clear refactor, split into small PRs, active maintainers |
| Python + macOS | openpilot #33207 | Well-scoped, huge project, straightforward goal |
| Shell / DevTools | claude-builders-bounty #3 | $100, low effort, clear deliverable |
| Node.js/TS backend | warpspeed #1 | $960, well-specified service |
| CI/DevOps | openpilot #30693 | GitHub Actions + headless rendering |

---

## Bounty Platforms to Watch

- **Algora** (console.algora.io) — automated bounty payouts for GitHub issues
- **Polar.sh** — open source funding + bounties
- **comma.ai bounties** — labeled directly in their repos
- **GitHub "bounty" label** — manual search across repos
