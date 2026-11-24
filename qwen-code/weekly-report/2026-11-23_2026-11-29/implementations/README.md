# 2026-11-23 ~ 2026-11-29 PR 实现文档

| PR | 状态 | 标题 | 实现文档 |
|---|---|---|---|
| [#18125](https://github.com/QwenLM/qwen-code/pull/18125) | merged | fix(managed-agent): Discover runtime providers with the application loader | [pr-18125.md](pr-18125.md) |
| [#18132](https://github.com/QwenLM/qwen-code/pull/18132) | merged | fix(managed-agent): Use session recovery after unadmitted cancellation | [pr-18132.md](pr-18132.md) |
| [#18151](https://github.com/QwenLM/qwen-code/pull/18151) | merged | docs(managed-agent): design widening Action parking coverage and confirm its pre-start checks | [pr-18151.md](pr-18151.md) |
| [#18157](https://github.com/QwenLM/qwen-code/pull/18157) | merged | feat(managed-agent): name why a waiting Turn cannot park | [pr-18157.md](pr-18157.md) |
| [#18164](https://github.com/QwenLM/qwen-code/pull/18164) | merged | feat(managed-agent): park and recover image-only approval waits | [pr-18164.md](pr-18164.md) |
| [#18166](https://github.com/QwenLM/qwen-code/pull/18166) | merged | feat(managed-agent): park extension command-step approval waits | [pr-18166.md](pr-18166.md) |
| [#18168](https://github.com/QwenLM/qwen-code/pull/18168) | merged | docs(agents): add rules for disposable background services | [pr-18168.md](pr-18168.md) |
| [#18170](https://github.com/QwenLM/qwen-code/pull/18170) | merged | fix(managed-agent): resume a wake Turn's approval wait after a Harness crash | [pr-18170.md](pr-18170.md) |
| [#18172](https://github.com/QwenLM/qwen-code/pull/18172) | merged | fix(managed-agent): advance a crashed wake Turn's await_action wait | [pr-18172.md](pr-18172.md) |
| [#18173](https://github.com/QwenLM/qwen-code/pull/18173) | merged | feat(managed-agent): report suspension counts on the instance metrics route | [pr-18173.md](pr-18173.md) |
| [#18174](https://github.com/QwenLM/qwen-code/pull/18174) | closed | fix(ci): Route Hangzhou linter downloads through proxy | [pr-18174.md](pr-18174.md) |
| [#18183](https://github.com/QwenLM/qwen-code/pull/18183) | merged | docs(agents): scope disposable MySQL rules to managed-agent-server | [pr-18183.md](pr-18183.md) |
| [#18184](https://github.com/QwenLM/qwen-code/pull/18184) | closed | fix(ci): Route Hangzhou transcript downloads through proxy | [pr-18184.md](pr-18184.md) |
| [#18186](https://github.com/QwenLM/qwen-code/pull/18186) | merged | docs(managed-agent): schedule MCP reclamation guard for Action parks | [pr-18186.md](pr-18186.md) |
| [#18187](https://github.com/QwenLM/qwen-code/pull/18187) | merged | feat(managed-agent): park an approval wait beside a certified background hold | [pr-18187.md](pr-18187.md) |
| [#18190](https://github.com/QwenLM/qwen-code/pull/18190) | merged | fix(managed-agent): keep identity joins on full index keys | [pr-18190.md](pr-18190.md) |
| [#18194](https://github.com/QwenLM/qwen-code/pull/18194) | merged | feat(managed-agent): park a wake-started Turn's approval wait | [pr-18194.md](pr-18194.md) |
| [#18195](https://github.com/QwenLM/qwen-code/pull/18195) | merged | fix(managed-agent): align actor admission test with the UTF-16 VARCHAR(36) cap | [pr-18195.md](pr-18195.md) |
| [#18203](https://github.com/QwenLM/qwen-code/pull/18203) | merged | feat(managed-agent): park channel and pr_event Turns' approval waits | [pr-18203.md](pr-18203.md) |
| [#18211](https://github.com/QwenLM/qwen-code/pull/18211) | merged | test(managed-agent): Pin identity join key parts in MySQL | [pr-18211.md](pr-18211.md) |
| [#18212](https://github.com/QwenLM/qwen-code/pull/18212) | merged | fix(managed-agent): Settle unadmitted cancellations with owed cleanup | [pr-18212.md](pr-18212.md) |
| [#18216](https://github.com/QwenLM/qwen-code/pull/18216) | merged | test(serve): Split Hosted Harness Session tests | [pr-18216.md](pr-18216.md) |
| [#18218](https://github.com/QwenLM/qwen-code/pull/18218) | merged | docs(managed-agent): scope S5 Hooks parking and confirm its pre-start checks | [pr-18218.md](pr-18218.md) |
| [#18224](https://github.com/QwenLM/qwen-code/pull/18224) | merged | feat(managed-agent): park a child Session's approval wait | [pr-18224.md](pr-18224.md) |
| [#18231](https://github.com/QwenLM/qwen-code/pull/18231) | merged | test(managed-agent): pin public-children Shell parking and confirm S8a pre-start checks | [pr-18231.md](pr-18231.md) |
| [#18233](https://github.com/QwenLM/qwen-code/pull/18233) | merged | test(managed-agent): wait for the resumed wake Turn to free the Session before closing | [pr-18233.md](pr-18233.md) |
| [#18234](https://github.com/QwenLM/qwen-code/pull/18234) | merged | fix(managed-agent): keep an Action-parked Session's MCP owner from reclamation | [pr-18234.md](pr-18234.md) |
| [#18236](https://github.com/QwenLM/qwen-code/pull/18236) | merged | feat(managed-agent): park Hooks and MCP Session approval waits | [pr-18236.md](pr-18236.md) |
| [#18247](https://github.com/QwenLM/qwen-code/pull/18247) | open | feat(sdk-java): Add a public Managed Agent client | [pr-18247.md](pr-18247.md) |
| [#18267](https://github.com/QwenLM/qwen-code/pull/18267) | open | refactor(managed-agent): Make closed JSON fields explicit | [pr-18267.md](pr-18267.md) |

_按个人 PR 口径更新于 2026-11-25_
