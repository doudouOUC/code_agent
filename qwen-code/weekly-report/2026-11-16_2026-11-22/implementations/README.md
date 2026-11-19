# 2026-11-16 ~ 2026-11-22 PR 实现文档

| PR | 状态 | 标题 | 实现文档 |
|---|---|---|---|
| [#17415](https://github.com/QwenLM/qwen-code/pull/17415) | merged | refactor(managed-agent): archive Kubernetes runtime and resident CSI backend | [pr-17415.md](pr-17415.md) |
| [#17439](https://github.com/QwenLM/qwen-code/pull/17439) | merged | fix(serve): accept hook description and statusMessage during extension preparation | [pr-17439.md](pr-17439.md) |
| [#17449](https://github.com/QwenLM/qwen-code/pull/17449) | open | feat(managed-agent): Public API parity (slice 4a) and Web Shell consumer migration (slice 4b) | [pr-17449.md](pr-17449.md) |
| [#17450](https://github.com/QwenLM/qwen-code/pull/17450) | merged | feat(managed-agent): Support external content child agents | [pr-17450.md](pr-17450.md) |
| [#17457](https://github.com/QwenLM/qwen-code/pull/17457) | merged | fix(managed-agent): Wait for workspace preparation before turn admission | [pr-17457.md](pr-17457.md) |
| [#17459](https://github.com/QwenLM/qwen-code/pull/17459) | merged | fix(managed-agent): recover timed-out hosted journal commits | [pr-17459.md](pr-17459.md) |
| [#17466](https://github.com/QwenLM/qwen-code/pull/17466) | merged | fix(managed-agent): recover macOS workspaces after reboot | [pr-17466.md](pr-17466.md) |
| [#17480](https://github.com/QwenLM/qwen-code/pull/17480) | merged | fix(managed-agent): resolve shared workspace owners for extension control | [pr-17480.md](pr-17480.md) |
| [#17507](https://github.com/QwenLM/qwen-code/pull/17507) | merged | chore(managed-agent): deduplicate verification Failsafe profiles and land #17139 follow-ups | [pr-17507.md](pr-17507.md) |
| [#17508](https://github.com/QwenLM/qwen-code/pull/17508) | merged | refactor(managed-agent): unify coordinator dispatch deduplication and lease renewal | [pr-17508.md](pr-17508.md) |
| [#17509](https://github.com/QwenLM/qwen-code/pull/17509) | merged | refactor(managed-agent): replace regex DDL catalog parsing with a tokenizing parser | [pr-17509.md](pr-17509.md) |
| [#17510](https://github.com/QwenLM/qwen-code/pull/17510) | merged | refactor(managed-agent): require canonical Broker URLs at the preflight and Harness entry | [pr-17510.md](pr-17510.md) |
| [#17513](https://github.com/QwenLM/qwen-code/pull/17513) | merged | feat: add qwen4-max support with native effort ladder, cache TTL, and image detail | [pr-17513.md](pr-17513.md) |
| [#17521](https://github.com/QwenLM/qwen-code/pull/17521) | merged | fix(managed-agent): recover vanished Harness admissions safely | [pr-17521.md](pr-17521.md) |
| [#17527](https://github.com/QwenLM/qwen-code/pull/17527) | merged | docs(design): propose idle Session suspension toward a stateless Hosted Harness | [pr-17527.md](pr-17527.md) |
| [#17654](https://github.com/QwenLM/qwen-code/pull/17654) | merged | fix(serve): Prevent automatic work from blocking worktree restore | [pr-17654.md](pr-17654.md) |
| [#17680](https://github.com/QwenLM/qwen-code/pull/17680) | merged | fix(managed-agent): drive continuation-ready parks in the epoch-less resubmission arm | [pr-17680.md](pr-17680.md) |
| [#17681](https://github.com/QwenLM/qwen-code/pull/17681) | merged | feat(managed-agent): notify attachment retirement and age out suspension waits | [pr-17681.md](pr-17681.md) |
| [#17690](https://github.com/QwenLM/qwen-code/pull/17690) | merged | feat(managed-agent): implement stateless Hosted Harness phase 1 idle suspension | [pr-17690.md](pr-17690.md) |
| [#17703](https://github.com/QwenLM/qwen-code/pull/17703) | merged | feat(managed-agent): Discover and pin default workspace Skills | [pr-17703.md](pr-17703.md) |
| [#17749](https://github.com/QwenLM/qwen-code/pull/17749) | merged | feat(managed-agent): keep idle MCP connections across suspension | [pr-17749.md](pr-17749.md) |
| [#17753](https://github.com/QwenLM/qwen-code/pull/17753) | merged | fix(managed-agent): restore the class-size and facade-population gates | [pr-17753.md](pr-17753.md) |
| [#17805](https://github.com/QwenLM/qwen-code/pull/17805) | merged | docs(managed-agent): add Phase 3 control-plane wake design | [pr-17805.md](pr-17805.md) |
| [#17856](https://github.com/QwenLM/qwen-code/pull/17856) | open | perf(managed-agent-server): bound hot-path SQL scans and round-trips | [pr-17856.md](pr-17856.md) |

_按个人 PR 口径更新于 2026-11-20；北京时间11-19新增4个，本周累计24个：22 merged / 2 open / 0 closed。#17450 仅功能分支 merged，#17527/#17805 仅设计合入，非完整周窗口。_
