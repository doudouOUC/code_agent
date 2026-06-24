# 近期 PR → feature 文档覆盖矩阵

> 说明：本文件用于把周报里的 PR 归到 feature 文档。不是所有 PR 都需要单开专题；release/CI/test-only、小修、closed/wrong-base PR 只登记归属判断。open PR 只登记后续观察，不按已落地实现写入专题正文。

---

## 2026-06-22 ~ 2026-06-23（昨天 + 前天，全作者）

> 覆盖口径：`QwenLM/qwen-code`，`created:2026-06-22..2026-06-23`，全作者，全状态。统计以 2026-06-24 `gh pr list/view` 查询为准，共 127 个 PR：84 merged / 24 open / 19 closed。#5743 等 06-23 创建但 06-24 合入的 PR 仍按创建日期纳入。

### 已落地且需要更新 feature 文档

| PR | 状态 | feature 归属判断 | 文档动作 |
|---|---|---|---|
| #5600 | merged | Dynamic Workflows 的主体完工：nested `workflow()`, stall watchdog/retry, JSONL journal resume, run snapshot, saved slash workflow, keyword trigger, notification, telemetry。 | 已补 [workflow-token-budget.md](workflow-token-budget.md)，并在标题/正文中把它从单点 token budget 扩展为 Dynamic Workflows。 |
| #5679 | merged | agent/workflow integer env var 严格解析，覆盖 `QWEN_CODE_MAX_TOKENS_PER_WORKFLOW`、workflow agent/concurrency 和 background agent 上限。 | 已补 [workflow-token-budget.md](workflow-token-budget.md) 与 [background-agent-resume.md](background-agent-resume.md)。 |
| #5740 | merged | workflow snapshot pruning 防路径穿越：递归删除 journal dir 前验证 runId 形态，恶意 `.json` 只能被 unlink，不能驱动越界 rm。 | 已补 [workflow-token-budget.md](workflow-token-budget.md) 的安全边界。 |
| #5589 | merged | MCP OAuth guidance / runtime recovery：把失效凭据与错误恢复入口指向 `/mcp`，清理过期 `/mcp auth` 文档。 | 已补 [mcp-resources-prompts.md](mcp-resources-prompts.md) 的 OAuth/诊断边界。 |
| #5635 | merged | `/mcp` dialog 新增 resource browser：server resource 列表、detail view、`@server:uri` reference。 | 已补 [mcp-resources-prompts.md](mcp-resources-prompts.md)。 |
| #5733 | merged | `@server:uri` 补全支持按 friendly name/title、大小写不敏感匹配，并在冒号前发现 resource server。 | 已补 [mcp-resources-prompts.md](mcp-resources-prompts.md)。 |
| #5774 | merged | 裸 `@<partial>` 跨 server 全局匹配 resource URI/name，dropdown 保留完整 `server:uri` 引用。 | 已补 [mcp-resources-prompts.md](mcp-resources-prompts.md)。 |
| #5613 | merged | daemon-backed Web Shell `/branch` / `/fork`：REST/SDK/web-shell 命令、transcript adapter、branch/fork 通知与失败文案。 | 已补 [daemon-serve-mode/README.md](daemon-serve-mode/README.md) 与 [daemon-serve-mode/11-webui-and-transport.md](daemon-serve-mode/11-webui-and-transport.md)。 |
| #5638 | merged | `GET /workspace/providers` 变为 daemon 侧 fresh workspace settings/env，表达下一个新 session 的 workspace provider defaults。 | 已补 [daemon-serve-mode/README.md](daemon-serve-mode/README.md) 与 [auth-providers.md](auth-providers.md)。 |
| #5741 | merged | 远程 LSP status route：REST、ACP HTTP/WS、ACP child status extension、TS SDK 只读状态。 | 已补 [daemon-serve-mode/08-extension-endpoints.md](daemon-serve-mode/08-extension-endpoints.md)。 |
| #5743 | merged | workspace permissions API：`GET/POST /workspace/permissions`、ACP ext methods、SDK helpers、malformed rule 校验。 | 已补 [daemon-serve-mode/08-extension-endpoints.md](daemon-serve-mode/08-extension-endpoints.md) 与 [permission-system.md](permission-system.md)。 |
| #5753 | merged | extension mutation 返回 operationId，新增 operation polling，覆盖 queued/running/succeeded/failed/refresh-error 状态。 | 已补 [daemon-serve-mode/08-extension-endpoints.md](daemon-serve-mode/08-extension-endpoints.md)。 |
| #5784 | merged | stale prompt client admission fail-fast：无效 clientId 在 prompt admission 阶段直接 400，不再先 202 后无终态事件。 | 已补 [daemon-serve-mode/README.md](daemon-serve-mode/README.md)。 |
| #5605/#5609/#5628/#5632 | merged | voice native recorder fallback 日志、stop-error 后释放 active state、standalone archive 打包 audio addon、`fastOnly`/`voiceOnly` 模型旗标。 | 已补 [voice-dictation.md](voice-dictation.md)；#5632 同时补 [auth-providers.md](auth-providers.md)。 |
| #5615/#5617 | merged | Artifact host/OSS 发布确认文案说明会离开本机、取消语义、`artifact.autoOpen` settings/schema。 | 已补 [artifact-tool.md](artifact-tool.md)。 |
| #5622/#5754 | merged | `ask_user_question` answer index 严格校验；AUTO 模式对破坏性 git/IaC 命令加 deterministic Layer 0 hard block。 | 已补 [permission-system.md](permission-system.md)。 |
| #5624 | merged | 历史 replay 中 dangling tool call 补合成 failed terminal update，避免恢复 UI 永远 processing。 | 已补 [tool-call-id-integrity.md](tool-call-id-integrity.md)。 |
| #5637/#5654/#5729/#5769 | merged | DashScope `preserve_thinking` 默认开启；auth wizard 恢复自定义模型；configured model list 保留 active runtime model；重复 model display name 按 baseUrl 消歧。 | 已补 [auth-providers.md](auth-providers.md)。 |

### 已看过但暂不新增专题的 merged PR

| PR | 归属判断 |
|---|---|
| #5577 #5578 #5592 #5604 #5607 #5618 #5639 #5646 #5652 #5671 #5676 #5684 #5685 #5688 #5689 #5709 #5711 #5714 #5716 #5718 #5719 #5720 #5724 #5731 #5735 #5737 #5745 #5746 #5764 #5767 #5772 #5788 | CLI completion、命名/大小写 refactor、测试 smoke、整数校验、迁移幂等、ACP/VS Code/extension 小边界、release gate、theme/render 小修等。它们有对应周报归类，但没有改变 feature 目录里的长期技术方案合约，故不单开或大幅改专题。 |
| #5593 #5595 #5599 #5627 #5730 #5751 #5757 #5775 | docs / plan-mode / model adapter / TUI viewer / desktop preview / VS Code view / web-shell UI restructure 等用户体验面补强。现阶段进入周报或 daemon/web-shell 后续观察，不新增单独 feature 文档。 |
| #5739 #5762 | release PR。只反映版本发布，不作为 feature 实现统计。 |

### open PR 后续观察

| PR | 当前归属判断 |
|---|---|
| #5616 #5629 | memory auto-generated skill confirmation、PreToolUse hook ask TUI confirmation，若合入后归入权限/skills/hook 交互。 |
| #5650 #5657 #5661 #5666 #5668 #5773 #5778 | web-shell markdown tables、provider duplicate response、TUI tool display partition、TUI transcript view、thinking intent、`/config key=value`、`/model --vision`，若合入后分别归 daemon/web-shell、auth/provider、TUI/UX、模型配置专题。 |
| #5727 #5747 #5752 #5755 #5765 #5777 #5780 #5781 #5783 #5785 #5786 | docs drift、audio packaging、MCP budget strict parse、daemon voice/control API、browser extension daemon-direct、update command、MCP resource read tool、WebFetch userinfo URL 拒绝、serve startup perf、review suggestion findings。已记录观察点，待合入后再写入对应 feature。 |

### closed / superseded / wrong-base

| PR | 原因 |
|---|---|
| #5598 #5606 #5608 #5625 #5651 #5658 #5662 #5674 #5678 #5681 #5691 #5693 #5696 #5699 #5701 #5703 #5705 #5707 #5776 | closed / superseded / wrong-base / draft no-merge。只登记归属判断，不作为已落地 feature。 |

---

## 新增或显著完善的 feature 专题

| PR | 状态 | feature 归属判断 | 文档动作 |
|---|---|---|---|
| #5502 | merged | 独立 voice 输入栈：native/fallback mic capture、batch/realtime ASR、`/voice`、`/model --voice`、VoiceIndicator。 | 新增 [voice-dictation.md](voice-dictation.md)。 |
| #5557 | merged | 独立 Artifact tool：HTML fragment 校验、local/host/OSS publisher、实验开关和权限门控。 | 新增 [artifact-tool.md](artifact-tool.md)。 |
| #5231 | merged | Workflow tool per-run output-token budget 与 `/workflows`/后台任务 UI。 | 新增 [workflow-token-budget.md](workflow-token-budget.md)。 |
| #5544 | merged | MCP prompt/resource discovery 与 `@server:uri` 注入，属于 MCP resources/prompts feature。 | 新增 [mcp-resources-prompts.md](mcp-resources-prompts.md)。 |
| #5182 | merged | second-resolution session wakeup engine，给 self-paced loop 提供底座。 | 新增 [loop-wakeup.md](loop-wakeup.md)。 |
| #5197 | merged | prompt-only `/loop` 改为 self-paced wakeup，替代固定 10m cron。 | 新增 [loop-wakeup.md](loop-wakeup.md)。 |
| #5202 | merged | QQ Bot channel adapter，属于外部 channel adapter feature。 | 新增 [channel-adapters.md](channel-adapters.md)。 |
| #5556 | merged | completed background sub-agent revive + subagent transcript TTL，属于 background agent resume 的后续扩展。 | 已补 [background-agent-resume.md](background-agent-resume.md)。 |
| #5478 | merged | Requesty first-class provider，属于 auth/provider 的 OpenAI-compatible provider 族扩展。 | 已补 [auth-providers.md](auth-providers.md)。 |

---

## Daemon / serve / web-shell

| PR | 状态 | feature 归属判断 | 文档动作 |
|---|---|---|---|
| #5118 | merged | web-shell completed todo per-task token/time detail，属于 daemon Web Shell transcript/UI 归一化。 | 已补 [daemon-serve-mode/11-webui-and-transport.md](daemon-serve-mode/11-webui-and-transport.md)。 |
| #5125 | merged | completed turn collapse，属于 web-shell transcript 展示。 | 已补 [daemon-serve-mode/11-webui-and-transport.md](daemon-serve-mode/11-webui-and-transport.md)。 |
| #5161 | merged | imperative composer API，属于 web-shell embedding/customization surface。 | 已补 [daemon-serve-mode/11-webui-and-transport.md](daemon-serve-mode/11-webui-and-transport.md)。 |
| #5163 | merged | per-turn time/tokens seam，属于 daemon UI metrics surface。 | 已补 [daemon-serve-mode/11-webui-and-transport.md](daemon-serve-mode/11-webui-and-transport.md)。 |
| #5166 | merged | custom footer renderer，属于 web-shell host customization。 | 已补 [daemon-serve-mode/11-webui-and-transport.md](daemon-serve-mode/11-webui-and-transport.md)。 |
| #5174 | merged | `GET /daemon/status` operator diagnostic API。 | 已补 [daemon-serve-mode/README.md](daemon-serve-mode/README.md) 与 W25 daemon 补强表。 |
| #5175 | merged | web-shell mid-turn message injection into running turn。 | 已补 [daemon-serve-mode/11-webui-and-transport.md](daemon-serve-mode/11-webui-and-transport.md) 与 daemon 总表。 |
| #5183 | merged | CLI/ACP/desktop mid-turn 图片保留，横跨 daemon mid-turn 与 multimodal input。 | 已补 daemon/W25 周报；暂不单开 multimodal 专题。 |
| #5190 | merged | web-shell execution display polish，属于 UI 展示小改。 | 归入 [daemon-serve-mode/11-webui-and-transport.md](daemon-serve-mode/11-webui-and-transport.md)，不单开。 |
| #5193 | merged | transcript event change callback，属于 daemon session provider/web-shell sync。 | 已补 [daemon-serve-mode/11-webui-and-transport.md](daemon-serve-mode/11-webui-and-transport.md)。 |
| #5211 | merged | `daemon_status` capability E2E baseline，属于 daemon capability 漂移守护。 | 已补 daemon/serve 近期补强表。 |
| #5216 | merged | ACP daemon sessions 加载 extension commands。 | 已补 [daemon-serve-mode/08-extension-endpoints.md](daemon-serve-mode/08-extension-endpoints.md)。 |
| #5260 | merged | `qwen serve --permission-response-timeout-ms`，属于 serve startup flag + ACP permission timeout。 | 已补 [daemon-serve-mode/README.md](daemon-serve-mode/README.md) 和 [permission-system.md](permission-system.md)。 |
| #5266 | merged | mid-turn event constant + timed-out drain recovery。 | 已补 [daemon-serve-mode/11-webui-and-transport.md](daemon-serve-mode/11-webui-and-transport.md)。 |
| #5392 | merged | release `qwen serve` 默认同源托管 Web Shell SPA，`--open`/`--no-web`。 | 已补 [daemon-serve-mode/11-webui-and-transport.md](daemon-serve-mode/11-webui-and-transport.md)。 |
| #5398 | merged | web-shell extension management：install/enable/disable/update/uninstall/refresh + `extensions_changed`。 | 已补 [daemon-serve-mode/08-extension-endpoints.md](daemon-serve-mode/08-extension-endpoints.md) 与 [daemon-serve-mode/11-webui-and-transport.md](daemon-serve-mode/11-webui-and-transport.md)。 |
| #5484 | merged | serve session reaper timeout validation。 | 已补 daemon/serve 近期补强表；不单开。 |
| #5504 | merged | ACP model-invocable commands。 | 已补 [daemon-serve-mode/08-extension-endpoints.md](daemon-serve-mode/08-extension-endpoints.md)。 |
| #5541 | merged | hosted Web Shell dotfile path fix。 | 已补 [daemon-serve-mode/11-webui-and-transport.md](daemon-serve-mode/11-webui-and-transport.md)。 |
| #5560 | merged | fake OpenAI server for no-AK daemon integration tests。 | 归入 daemon 测试基础设施，不单开 feature。 |

---

## Core / CLI / provider / permission

| PR | 状态 | feature 归属判断 | 文档动作 |
|---|---|---|---|
| #5141 | merged | supported `sed -i` file-history tracking，属 rewind/file history。 | 已在 [conversation-rewind.md](conversation-rewind.md) 覆盖。 |
| #5165 | merged | monitor notification batch drain，属 monitor tool consumption。 | 已在 [monitor-tool.md](monitor-tool.md) 覆盖。 |
| #5179 | merged | duplicate model id provider persistence，属 auth/provider 解析。 | 已在 [auth-providers.md](auth-providers.md) 覆盖。 |
| #5196 | merged | `/dev/tcp`/`/dev/udp` redirect 不当建模为 file I/O，属 permission/shell 解析安全边界。 | 已补 [permission-system.md](permission-system.md)；暂不单开。 |
| #5218 | merged | cancelled `ask_user_question` 后停止 ACP turn。 | 已在 [permission-system.md](permission-system.md) 覆盖。 |
| #5258 | merged | cancelled 普通工具权限后停止 ACP turn。 | 已在 [permission-system.md](permission-system.md) 覆盖。 |
| #5279 | merged | per-turn tool-call circuit breaker，属 tool loop / runaway 防护。 | 记录为 core safety follow-up；待后续 loop/circuit-breaker 专题统一展开。 |
| #5311/#5433 | merged | plan mode `exit_plan_mode` 显示与 opt-in prompt，属 plan-mode UX/safety。 | 周报记录；当前 feature 目录暂不单开 plan-mode 专题。 |
| #5404 | merged | custom provider models install 后保留，属 auth/provider provider preset。 | 已补 [auth-providers.md](auth-providers.md) 的近期覆盖表。 |
| #5478 | merged | Requesty first-class provider。 | 已补 [auth-providers.md](auth-providers.md)。 |
| #5539 | merged | OpenRouter/Requesty provider classes 收敛到 preset customHeaders，属 provider 内部重构。 | 已补 [auth-providers.md](auth-providers.md) 的近期覆盖表。 |
| #5553 | merged | bare fast model 保持当前 auth，属 provider/model fallback。 | 归入 auth/provider 后续观察，不单开。 |
| #5564 | merged | non-interactive loop detection 触发时 fail run。 | 归入 loop/circuit-breaker 后续观察，不单开。 |

---

## Extension / channels / desktop / docs / CI

| PR | 状态 | feature 归属判断 | 文档动作 |
|---|---|---|---|
| #5289 | merged | extension displayName/description i18n，属 extension packaging/UI。 | 当前仅周报记录；若 extension feature 继续扩展再单开专题。 |
| #5369 | merged | preserve workspace trust state for extensions，属 extension trust state。 | 周报记录；与 #5398 管理面相关但不是独立 feature。 |
| #5414/#5415/#5416/#5417 | merged | QQ Bot token/gateway/timer/path 稳定性修复。 | 已补 [channel-adapters.md](channel-adapters.md)。 |
| #5122 | merged | computer-use screenshot max dimension，属 computer-use 适配参数。 | 小功能；周报记录，不单开。 |
| #5145 | merged | input placeholder follow-up suggestion。 | CLI UX 小功能；周报记录，不单开。 |
| #5187 | merged | `qwen sessions list --json --limit`。 | CLI session command；周报记录，不单开。 |
| #5220 | merged | TUI/web-shell tool display names i18n。 | 横跨 UI badge，本次归入 daemon/web-shell 记录，不单开。 |
| #5284 | merged | desktop macOS 26+ Liquid Glass Assets.car。 | desktop packaging/asset 小功能；周报记录。 |
| #5401 | merged | optional response token rate。 | CLI statusline metric 小功能；周报记录。 |
| #5203 | merged | on-demand tmux real-user testing。 | CI/验证基础设施，不作为 feature 专题。 |
| #5233 | merged | autofix issue-fix/review-response lifecycle。 | CI/automation，不作为 feature 专题。 |
| #5547 | merged | triage review check 文档。 | docs/process，不作为 product feature 专题。 |
| #5561 | open | MCP servers live reconcile on settings change。 | open PR，暂不作为已落地 feature；已在 [mcp-resources-prompts.md](mcp-resources-prompts.md) 后续中提及。 |

---

## 不作为 feature 实现统计

| PR | 状态 | 原因 |
|---|---|---|
| #5148 #5151 #5162 #5170 #5195 #5217 #5232 #5240 #5242 #5405 #5406 #5507 #5513 #5519 #5571 | closed | closed / superseded / wrong-base / test-only 草稿；不计为已落地 feature。 |
| release / version bump PRs | merged | v0.18.x release、desktop release、VS Code companion publish 等只反映发布动作，不单独进入 feature 技术方案。 |
| 大量 path/URL/schema/i18n/desktop/parser 小修 | merged | 归入对应周报主题分组；除改变 feature 合约或安全边界者外，不单开专题。 |

_更新于 2026-06-24_
