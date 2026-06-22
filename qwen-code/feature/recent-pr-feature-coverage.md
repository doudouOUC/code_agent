# 近期 PR → feature 文档覆盖矩阵

> 覆盖口径：`QwenLM/qwen-code`，`created:2026-06-15..2026-06-21`，全作者，全状态。统计以 2026-06-23 `gh pr list/view` 查询为准；06-21 创建但 06-22 合入的 #5502/#5556/#5557 按创建周纳入。
> 说明：本文件用于把周报里的 PR 归到 feature 文档。不是所有 PR 都需要单开专题；release/CI/test-only、小修、closed/wrong-base PR 只登记归属判断。

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

_更新于 2026-06-23_
