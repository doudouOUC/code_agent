# 2026-11-02 ~ 2026-11-08 PR 实现文档

| PR | 状态 | 标题 | 实现文档 |
|---|---|---|---|
| [#16090](https://github.com/QwenLM/qwen-code/pull/16090) | ✅ merged | refactor(managed-agent): split Agent and Session stores | [pr-16090.md](pr-16090.md) |
| [#16099](https://github.com/QwenLM/qwen-code/pull/16099) | ✅ merged | fix(managed-agent): keep javadoc valid after the module split | [pr-16099.md](pr-16099.md) |
| [#16101](https://github.com/QwenLM/qwen-code/pull/16101) | ✅ merged | test(managed-agent): Reconnect Hosted fault probes to execution owners | [pr-16101.md](pr-16101.md) |
| [#16114](https://github.com/QwenLM/qwen-code/pull/16114) | ✅ merged | fix(ci): repair Javadoc for the 0.26.5 managed runtime release | [pr-16114.md](pr-16114.md) |
| [#16134](https://github.com/QwenLM/qwen-code/pull/16134) | ✅ merged | fix(managed-agent): Restore profile-owned runtime verification | [pr-16134.md](pr-16134.md) |
| [#16139](https://github.com/QwenLM/qwen-code/pull/16139) | ✅ merged | refactor(managed-agent): simplify row locking and runtime verification | [pr-16139.md](pr-16139.md) |
| [#16141](https://github.com/QwenLM/qwen-code/pull/16141) | ✅ merged | refactor(managed-agent): Make runtime backends optional Maven modules | [pr-16141.md](pr-16141.md) |
| [#16142](https://github.com/QwenLM/qwen-code/pull/16142) | ✅ merged | refactor(managed-agent): trim store delegation boilerplate | [pr-16142.md](pr-16142.md) |
| [#16143](https://github.com/QwenLM/qwen-code/pull/16143) | ✅ merged | refactor(managed-agent): align shared MySQL schema conventions | [pr-16143.md](pr-16143.md) |
| [#16153](https://github.com/QwenLM/qwen-code/pull/16153) | ✅ merged | feat(managed-agent): support full model configuration at session creation | [pr-16153.md](pr-16153.md) |
| [#16205](https://github.com/QwenLM/qwen-code/pull/16205) | ✅ merged | fix(managed-agent): keep workspace execution off the tenant lock | [pr-16205.md](pr-16205.md) |
| [#16212](https://github.com/QwenLM/qwen-code/pull/16212) | ✅ merged | feat(managed-agent): allow concurrent workspace uploads | [pr-16212.md](pr-16212.md) |
| [#16217](https://github.com/QwenLM/qwen-code/pull/16217) | ✅ merged | perf(managed-agent): take resident claim off the tenant lock | [pr-16217.md](pr-16217.md) |
| [#16221](https://github.com/QwenLM/qwen-code/pull/16221) | ✅ merged | perf(managed-agent): take harness admission checks off the tenant lock | [pr-16221.md](pr-16221.md) |
| [#16223](https://github.com/QwenLM/qwen-code/pull/16223) | ✅ merged | perf(managed-agent): take turn admission off the tenant lock | [pr-16223.md](pr-16223.md) |
| [#16225](https://github.com/QwenLM/qwen-code/pull/16225) | ✅ merged | perf(managed-agent): take session commands off the tenant lock | [pr-16225.md](pr-16225.md) |
| [#16229](https://github.com/QwenLM/qwen-code/pull/16229) | ✅ merged | perf(managed-agent): reuse local workspace file capability probes | [pr-16229.md](pr-16229.md) |
| [#16240](https://github.com/QwenLM/qwen-code/pull/16240) | ✅ merged | test(managed-agent): refresh concurrent membership snapshot | [pr-16240.md](pr-16240.md) |
| [#16256](https://github.com/QwenLM/qwen-code/pull/16256) | ✅ merged | perf(managed-agent): queue journal commits on the Session row instead of the tenant lock | [pr-16256.md](pr-16256.md) |
| [#16268](https://github.com/QwenLM/qwen-code/pull/16268) | ✅ merged | perf(managed-agent): narrow output, lifecycle, and storage lock scopes | [pr-16268.md](pr-16268.md) |
| [#16270](https://github.com/QwenLM/qwen-code/pull/16270) | ✅ merged | fix(core): preserve Gemini thought signatures for tool replay | [pr-16270.md](pr-16270.md) |
| [#16275](https://github.com/QwenLM/qwen-code/pull/16275) | ✅ merged | fix(managed-agent): reject dangling Hosted cleanup references | [pr-16275.md](pr-16275.md) |
| [#16283](https://github.com/QwenLM/qwen-code/pull/16283) | ✅ merged | perf(managed-agent): separate workspace reads from durable admission | [pr-16283.md](pr-16283.md) |
| [#16288](https://github.com/QwenLM/qwen-code/pull/16288) | ✅ merged | fix(managed-agent): enforce strict SQL mode per embedded connection | [pr-16288.md](pr-16288.md) |
| [#16296](https://github.com/QwenLM/qwen-code/pull/16296) | ✅ merged | fix(managed-agent): use current state for approval changes | [pr-16296.md](pr-16296.md) |
| [#16298](https://github.com/QwenLM/qwen-code/pull/16298) | ✅ merged | fix(managed): Reap Git descendants before terminating parents | [pr-16298.md](pr-16298.md) |
| [#16312](https://github.com/QwenLM/qwen-code/pull/16312) | ✅ merged | perf(managed-agent): avoid storage locks in read preflight | [pr-16312.md](pr-16312.md) |
| [#16318](https://github.com/QwenLM/qwen-code/pull/16318) | ✅ merged | fix(managed-agent): harden capacity recovery and clean up Java conventions | [pr-16318.md](pr-16318.md) |
| [#16327](https://github.com/QwenLM/qwen-code/pull/16327) | ✅ merged | perf(managed-agent): narrow queue dispatch and workspace session creation locks | [pr-16327.md](pr-16327.md) |
| [#16329](https://github.com/QwenLM/qwen-code/pull/16329) | ✅ merged | perf(managed-agent): share the storage fence in session command admissions | [pr-16329.md](pr-16329.md) |
| [#16330](https://github.com/QwenLM/qwen-code/pull/16330) | ✅ merged | fix(managed-agent): bound runtime thread pools | [pr-16330.md](pr-16330.md) |
| [#16335](https://github.com/QwenLM/qwen-code/pull/16335) | ✅ merged | perf(managed-agent): take ordinary tool publication and read leases off the tenant lock | [pr-16335.md](pr-16335.md) |
| [#16354](https://github.com/QwenLM/qwen-code/pull/16354) | ✅ merged | perf(managed-agent): take ordinary publication lanes off the placement guard | [pr-16354.md](pr-16354.md) |
| [#16369](https://github.com/QwenLM/qwen-code/pull/16369) | ✅ merged | feat(managed-agent): allow concurrent workspace rewinds | [pr-16369.md](pr-16369.md) |
| [#16370](https://github.com/QwenLM/qwen-code/pull/16370) | ✅ merged | perf(managed-agent): remove ordinary journal and publication storage locks | [pr-16370.md](pr-16370.md) |
| [#16386](https://github.com/QwenLM/qwen-code/pull/16386) | ✅ merged | perf(managed-agent): narrow SSH settlement and worktree locking | [pr-16386.md](pr-16386.md) |
| [#16410](https://github.com/QwenLM/qwen-code/pull/16410) | ✅ merged | perf(managed-agent): take native journal snapshots off the tenant guards | [pr-16410.md](pr-16410.md) |
| [#16413](https://github.com/QwenLM/qwen-code/pull/16413) | ✅ merged | fix(serve): bound command snapshot replay memory | [pr-16413.md](pr-16413.md) |
| [#16415](https://github.com/QwenLM/qwen-code/pull/16415) | ✅ merged | perf(managed-agent): take tool execution control off the tenant guards | [pr-16415.md](pr-16415.md) |
| [#16433](https://github.com/QwenLM/qwen-code/pull/16433) | ✅ merged | feat(managed-agent): support durable structured user questions | [pr-16433.md](pr-16433.md) |
| [#16445](https://github.com/QwenLM/qwen-code/pull/16445) | ✅ merged | feat(cli): align managed agent basic tools with daemon | [pr-16445.md](pr-16445.md) |
| [#16448](https://github.com/QwenLM/qwen-code/pull/16448) | ✅ merged | feat(managed-agent): enable automation by default | [pr-16448.md](pr-16448.md) |

_按个人 PR 口径更新于 2026-11-07_
