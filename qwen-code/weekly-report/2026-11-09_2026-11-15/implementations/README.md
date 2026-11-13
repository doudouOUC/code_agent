# 2026-11-09 ~ 2026-11-15 PR 实现文档

| PR | 状态 | 标题 | 实现文档 |
|---|---|---|---|
| [#16723](https://github.com/QwenLM/qwen-code/pull/16723) | merged | fix(managed): Allow short browser tokens in Web gateway | [pr-16723.md](pr-16723.md) |
| [#16758](https://github.com/QwenLM/qwen-code/pull/16758) | merged | feat(managed-agent): add private BTW and session recap | [pr-16758.md](pr-16758.md) |
| [#16759](https://github.com/QwenLM/qwen-code/pull/16759) | merged | refactor(managed-agent): give JDBC stores names distinct from their interfaces | [pr-16759.md](pr-16759.md) |
| [#16763](https://github.com/QwenLM/qwen-code/pull/16763) | merged | refactor(managed-agent): share Hosted Harness feature tokens between connectors | [pr-16763.md](pr-16763.md) |
| [#16788](https://github.com/QwenLM/qwen-code/pull/16788) | merged | refactor(cli): single-source the Managed Runtime worker route surface | [pr-16788.md](pr-16788.md) |
| [#16822](https://github.com/QwenLM/qwen-code/pull/16822) | merged | chore(managed-agent): remove unused constructors and helpers | [pr-16822.md](pr-16822.md) |
| [#16826](https://github.com/QwenLM/qwen-code/pull/16826) | merged | fix(managed-agent): harden Harness error-code parsing, host reader and exception causes | [pr-16826.md](pr-16826.md) |
| [#16827](https://github.com/QwenLM/qwen-code/pull/16827) | merged | perf(managed-agent): remove redundant read-path queries | [pr-16827.md](pr-16827.md) |
| [#16828](https://github.com/QwenLM/qwen-code/pull/16828) | merged | perf(managed-agent): cheapen proof copies, CSI lookup and startup polling | [pr-16828.md](pr-16828.md) |
| [#16837](https://github.com/QwenLM/qwen-code/pull/16837) | open | feat(managed-agent): add pluggable object storage and journal archiving | [pr-16837.md](pr-16837.md) |
| [#16840](https://github.com/QwenLM/qwen-code/pull/16840) | merged | refactor(managed-agent): keep asynchronous admission as the only publication mode | [pr-16840.md](pr-16840.md) |
| [#16868](https://github.com/QwenLM/qwen-code/pull/16868) | merged | feat(managed-agent): OSS externalization of oversized session resources and journal compaction | [pr-16868.md](pr-16868.md) |
| [#16882](https://github.com/QwenLM/qwen-code/pull/16882) | merged | feat(managed-agent): Add external extension source and archive storage SPIs | [pr-16882.md](pr-16882.md) |
| [#16910](https://github.com/QwenLM/qwen-code/pull/16910) | merged | refactor(managed-agent): scope CSI retirement evidence to its own session | [pr-16910.md](pr-16910.md) |
| [#16922](https://github.com/QwenLM/qwen-code/pull/16922) | merged | refactor(managed-agent): complete broker facade decomposition | [pr-16922.md](pr-16922.md) |
| [#16923](https://github.com/QwenLM/qwen-code/pull/16923) | merged | fix(managed-agent): read the frozen CSI commit body with its own size bound | [pr-16923.md](pr-16923.md) |
| [#16928](https://github.com/QwenLM/qwen-code/pull/16928) | merged | refactor(managed-agent): remove uncalled CSI admission and workspace catalog code | [pr-16928.md](pr-16928.md) |
| [#16934](https://github.com/QwenLM/qwen-code/pull/16934) | merged | fix(managed-agent): honour the declared base64 bounds and drop an orphaned import | [pr-16934.md](pr-16934.md) |
| [#16936](https://github.com/QwenLM/qwen-code/pull/16936) | merged | refactor(managed-agent): extract binding admission and fence engine | [pr-16936.md](pr-16936.md) |
| [#16953](https://github.com/QwenLM/qwen-code/pull/16953) | merged | refactor(managed-agent): retire the InMemory runtime broker repositories | [pr-16953.md](pr-16953.md) |
| [#16956](https://github.com/QwenLM/qwen-code/pull/16956) | merged | fix(managed-agent): give the CSI retirement size bounds a single owner | [pr-16956.md](pr-16956.md) |
| [#16957](https://github.com/QwenLM/qwen-code/pull/16957) | merged | refactor(managed-agent): remove unused CSI checkpoint snapshot and log readers | [pr-16957.md](pr-16957.md) |
| [#16981](https://github.com/QwenLM/qwen-code/pull/16981) | merged | chore(managed-agent): finish the CSI bound conversion and name it once | [pr-16981.md](pr-16981.md) |
| [#16983](https://github.com/QwenLM/qwen-code/pull/16983) | merged | fix(managed-agent): fence concurrent journal pack publication with a builder lease | [pr-16983.md](pr-16983.md) |
| [#16984](https://github.com/QwenLM/qwen-code/pull/16984) | merged | docs(managed-agent): drop removed WorkspaceCsiCheckpointSnapshotStore from the deletion precondition | [pr-16984.md](pr-16984.md) |
| [#17006](https://github.com/QwenLM/qwen-code/pull/17006) | merged | refactor(managed-agent): settle Session rename synchronously under one display authority | [pr-17006.md](pr-17006.md) |
| [#17043](https://github.com/QwenLM/qwen-code/pull/17043) | merged | fix(managed-agent): repair rename recovery test and address the #17006 review round | [pr-17043.md](pr-17043.md) |
| [#17044](https://github.com/QwenLM/qwen-code/pull/17044) | merged | chore(managed-agent): trim verification meta-ratchets and align local gate profiles | [pr-17044.md](pr-17044.md) |
| [#17047](https://github.com/QwenLM/qwen-code/pull/17047) | merged | feat(managed-agent): make CSI admission, activation-lease, and broker repository readers pack-aware | [pr-17047.md](pr-17047.md) |
| [#17058](https://github.com/QwenLM/qwen-code/pull/17058) | merged | refactor(managed-agent): converge OSS hot path, dead code and pool defaults | [pr-17058.md](pr-17058.md) |
| [#17064](https://github.com/QwenLM/qwen-code/pull/17064) | merged | refactor(managed-agent): collapse the distribution to a single executable jar | [pr-17064.md](pr-17064.md) |
| [#17069](https://github.com/QwenLM/qwen-code/pull/17069) | merged | fix(managed-agent): stop the legacy CSI guard from gap-locking other Sessions | [pr-17069.md](pr-17069.md) |
| [#17072](https://github.com/QwenLM/qwen-code/pull/17072) | merged | refactor(managed-agent): drop the catalog probe and repeated root lock from binding control | [pr-17072.md](pr-17072.md) |
| [#17073](https://github.com/QwenLM/qwen-code/pull/17073) | merged | docs(managed-agent): inventory the lifecycle claim mirror and tenant guards | [pr-17073.md](pr-17073.md) |
| [#17074](https://github.com/QwenLM/qwen-code/pull/17074) | merged | fix(managed-agent): drop the stale tenant guard from synchronous rename settlement | [pr-17074.md](pr-17074.md) |
| [#17075](https://github.com/QwenLM/qwen-code/pull/17075) | merged | refactor(managed-agent): delete the redundant JdbcRuntimeBrokerSchema alias | [pr-17075.md](pr-17075.md) |
| [#17139](https://github.com/QwenLM/qwen-code/pull/17139) | merged | chore(managed-agent): convergence alignment — embedding regression test, release repair removal, design | [pr-17139.md](pr-17139.md) |

_按个人 PR 口径更新于 2026-11-14；累计收录北京时间 11-09 至 11-13 创建的目标 PR，非完整周窗口。_
