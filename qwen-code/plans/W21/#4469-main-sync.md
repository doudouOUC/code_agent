# Plan: Defer #4330 Option C + W133-c to v0.16.x, sync issue body + notify

## Context

2026-05-24 scope freeze 持续精简后，对 #4330 Option C 和 W133-c PoolEvent.source 也应用同一套"无真实消费场景的硬化 = 延后"标准（与 `--max-body-size` / PR 29 / PR 30b 同逻辑）：

**#4330 Option C**：纯防御性、防多版本 SDK ↔ daemon 部署漂移。v0.16-alpha 单版本对场景下 SDK 默认 330k / daemon 300k 同一 release 一起发，0 真实漂移 → 等多版本环境出现再做（v0.17 / v0.16.x）。

**W133-c PoolEvent.source**：契约 polish 给"未来消费者"。grep 确认 `@qwen-code/sdk` + `@qwen-code/webui` + 内部 `mcp-client-manager` 都不区分两种 PoolEvent['failed'] 来源 → 0 真实消费者 → 等真实需求出现再做。

**净影响**：v0.16-alpha 服务端代码改动 ≈ 0。整个 alpha = 文档 + 打包发布。

## 行动项（非代码）

1. **更新 issue #4175 body**：
   - "Explicitly deferred" 段加 `#4330 Option C` + `W133-c PoolEvent.source discriminator` 两条
   - F5 chain "In scope" 段去掉 #4330 Option C 服务端 / SDK 改动相关描述
   - PR 28 描述简化为"纯 release infra"（不再含服务端代码）
   - F2 follow-ups bucket PR C 行标"deferred to v0.16.x"
   - Item 6 "Immediate F1 follow-ups" #4330 行从"决定 Option C"改为"延后 v0.16.x"

2. **发周知 comment** `#4175` ping @wenshao + @chiga0：
   - 说明 #4330 Option C + W133-c 同 PR 29 / PR 30b 同逻辑延后
   - 确认 v0.16-alpha 服务端代码改动 ≈ 0（PR 27 含 ~10 LOC SDK env fallback 不算服务端）
   - 修正后的 F5 链：PR 27 → 28 → 30a → 31，纯文档 + release infra

3. **清理 sync worktree**：本会话产物已用完（#4469 已 push）。可以保留到 #4469 merge 后再清，或现在就清（git worktree remove）。

## 不需要做的事

- 不开新 PR 实现 #4330 / W133-c
- 不改任何 .ts / .json 源码
- 不写新测试

## 等待中

- ⏳ `#4469` sync PR 等 wenshao review + merge
- 🟢 等 `#4469` merge 后可开 PR 27（alpha docs + ~10 LOC SDK env fallback）

## 后续 v0.16-alpha 关键路径（修订）

```
#4469 sync           ⏳ 等 maintainer merge
   ↓
PR 27 alpha docs + ~10 LOC SDK env fallback        ~1-2 天
PR 28 npm publish scaffolding（0 服务端代码）       ~1-2 天
PR 30a 本地部署 refs（纯 markdown）                 ~1 天
PR 31 v0.16-alpha.0 cut                              ~半天

总计 ~4-5 个工作日（瓶颈消失，全是文档和打包）
```

## 延后到 v0.16.x 的项（更新版）

| 项 | 触发再做的场景 |
|---|---|
| `--max-body-size` | 多模态 alpha / 企业硬化 |
| PR 29 production token defaults | 远程部署 / 多 daemon / 企业 pilot |
| PR 30b 容器部署 refs | enterprise pilot（依赖 PR 29） |
| **#4330 Option C SDK/server timeout compat warn** | **多版本 SDK ↔ daemon 部署出现** |
| **W133-c PoolEvent.source discriminator** | **第一个真实 PoolEvent 消费者需要区分** |
| chiga0 #27 P0 #2/#3/#4 | 多模态 alpha |
| F4 主 scope | v0.17 |
| Keesan12 receipt seam | enterprise pilot |
| chiga0 #18 ACP Streamable HTTP | 设计级讨论 |

## Final Implementation Status

- **PR #4469** — MERGED 2026-05-24. Sync PR merged as planned.
- **#4175** — OPEN issue (roadmap tracker). Issue body updated with deferrals per this plan.
- **#4330** — CLOSED issue. Timeout coupling deferred as planned (no multi-version deployment scenario yet).
- **Outcome**: Plan fully executed. #4330 Option C and W133-c PoolEvent.source were successfully deferred. The sync PR (#4469) merged, unblocking the F5 release chain (PR 27 alpha docs merged shortly after). No code changes were needed — this was purely a scope-management action.
- **Key divergence**: None. The plan was a non-code scope freeze decision and was carried out as written.
