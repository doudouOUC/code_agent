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
| [#17856](https://github.com/QwenLM/qwen-code/pull/17856) | merged | perf(managed-agent-server): bound hot-path SQL scans and round-trips | [pr-17856.md](pr-17856.md) |
| [#17864](https://github.com/QwenLM/qwen-code/pull/17864) | merged | refactor(managed-agent): converge pre-production version machinery | [pr-17864.md](pr-17864.md) |
| [#17866](https://github.com/QwenLM/qwen-code/pull/17866) | merged | fix(web-shell): render local-path and failed markdown images as text chips | [pr-17866.md](pr-17866.md) |
| [#17869](https://github.com/QwenLM/qwen-code/pull/17869) | merged | docs(managed-agent): add Phase 3 seal-time wake stamp addendum | [pr-17869.md](pr-17869.md) |
| [#17871](https://github.com/QwenLM/qwen-code/pull/17871) | merged | refactor(managed-agent): files-on-v2 lifecycle and public child relaxation (D3/D5') | [pr-17871.md](pr-17871.md) |
| [#17886](https://github.com/QwenLM/qwen-code/pull/17886) | merged | fix(managed-agent): settle recovery from durable native terminals | [pr-17886.md](pr-17886.md) |
| [#17907](https://github.com/QwenLM/qwen-code/pull/17907) | merged | fix(managed-agent-server): keep journal blob reclamation moving past sealed heads | [pr-17907.md](pr-17907.md) |
| [#17908](https://github.com/QwenLM/qwen-code/pull/17908) | merged | feat(managed-agent): stamp clean suspensions for wake dispatch | [pr-17908.md](pr-17908.md) |
| [#17909](https://github.com/QwenLM/qwen-code/pull/17909) | merged | test(managed-agent): re-home publication lifecycle IT v1 witness to external-files | [pr-17909.md](pr-17909.md) |
| [#17912](https://github.com/QwenLM/qwen-code/pull/17912) | merged | docs(managed-agent): design Runtime-owned background observation (Phase 3b) | [pr-17912.md](pr-17912.md) |
| [#17927](https://github.com/QwenLM/qwen-code/pull/17927) | merged | refactor(managed-agent): key tenant guard on readable VARCHAR scope (identity de-hash increment 1) | [pr-17927.md](pr-17927.md) |
| [#17932](https://github.com/QwenLM/qwen-code/pull/17932) | merged | fix(managed-agent): settle a parked turn whose runtime is terminally lost | [pr-17932.md](pr-17932.md) |
| [#17944](https://github.com/QwenLM/qwen-code/pull/17944) | merged | feat(managed-agent): degrade process components per package in content-only extension runtimes | [pr-17944.md](pr-17944.md) |
| [#17953](https://github.com/QwenLM/qwen-code/pull/17953) | merged | feat(managed-agent): runtime-owned background observation with suspend-safe staging and drain (Phase 3b) | [pr-17953.md](pr-17953.md) |
| [#17954](https://github.com/QwenLM/qwen-code/pull/17954) | merged | test(managed-agent): run the wake stamp suites on MySQL and pin each suspension gate clause | [pr-17954.md](pr-17954.md) |
| [#17955](https://github.com/QwenLM/qwen-code/pull/17955) | merged | fix(managed-agent): load transport wakes through the passive verb | [pr-17955.md](pr-17955.md) |
| [#17958](https://github.com/QwenLM/qwen-code/pull/17958) | merged | refactor(managed-agent): drop redundant storage keys | [pr-17958.md](pr-17958.md) |
| [#17959](https://github.com/QwenLM/qwen-code/pull/17959) | merged | refactor(managed-agent): drop redundant in-process locks and the archived legacy Session guard stub | [pr-17959.md](pr-17959.md) |
| [#17960](https://github.com/QwenLM/qwen-code/pull/17960) | merged | docs(managed-agent): correct identity budgets and record duplicate-key survey in de-hash design | [pr-17960.md](pr-17960.md) |
| [#17961](https://github.com/QwenLM/qwen-code/pull/17961) | merged | fix(managed-agent): hand the Hosted Harness client over under one lock | [pr-17961.md](pr-17961.md) |
| [#18019](https://github.com/QwenLM/qwen-code/pull/18019) | merged | refactor(managed-agent): drop redundant same-row identity hash keys | [pr-18019.md](pr-18019.md) |
| [#18041](https://github.com/QwenLM/qwen-code/pull/18041) | merged | refactor(managed-agent): drop dead and redundant schema objects | [pr-18041.md](pr-18041.md) |
| [#18047](https://github.com/QwenLM/qwen-code/pull/18047) | merged | docs(managed-agent): design Action parking (stateless Harness phase 4) | [pr-18047.md](pr-18047.md) |
| [#18048](https://github.com/QwenLM/qwen-code/pull/18048) | merged | refactor(managed-agent): use plaintext identity segments in OSS object keys | [pr-18048.md](pr-18048.md) |
| [#18058](https://github.com/QwenLM/qwen-code/pull/18058) | open | refactor(managed-agent): de-hash identity columns with bounded VARCHAR and canonical refs | [pr-18058.md](pr-18058.md) |
| [#18110](https://github.com/QwenLM/qwen-code/pull/18110) | merged | fix(managed-agent): close three confirmed post-merge observation audit findings | [pr-18110.md](pr-18110.md) |
| [#18115](https://github.com/QwenLM/qwen-code/pull/18115) | merged | feat(managed-agent): park recoverable Action waits behind a sealed certificate (Phase 4) | [pr-18115.md](pr-18115.md) |
| [#18118](https://github.com/QwenLM/qwen-code/pull/18118) | merged | chore(managed-agent): retire K8s harness deployment templates and clean up archived CSI remnants | [pr-18118.md](pr-18118.md) |

_按个人 PR 口径更新于2026-11-23；11-22新增7个，累计51个，48 merged / 3 open / 0 closed；#17450仅功能分支合入，覆盖完整创建周，尚未标为周一上午周更。_
