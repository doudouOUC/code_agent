# 工具调用 ID 完整性技术方案

> 适用代码库：`QwenLM/qwen-code` `main`。

---

## 1. 背景与动机

OpenAI-compatible provider 的 tool-call 协议要求：一次 assistant tool call 与后续 tool result 要用同一个 `tool_call.id` 一一配对，且请求 payload 内不能出现重复 surviving pair。现实里部分 provider 会出现两类异常：

1. **同一 turn 内 replay 已完成的 call id**：stream 中又发一次相同 id 的 function call。如果照常执行，会重复触发 shell/edit 等副作用。
2. **跨 turn 复用 raw id**：模型下一轮又返回旧 id。qwen-code 若把 raw id 原样写进 history，后续 OpenAI payload 会带多个同 id tool result，导致 payload 膨胀和 provider 校验错误，例如 `duplicate_tool_result_in_request dup_id_0001`。

#5107 的目标不是改 provider 协议，而是在 qwen-code 内部建立一个稳定的本地 ID 不变量：**同 turn 重复 id 只执行一次；跨 turn 复用 raw id 进入 history 前必须变成新的唯一 local id；出站 OpenAI payload 最后再清理一次重复 surviving pair。** #9435/#9436 又补齐两条运行时边界：repeated duplicate provider id 在 daemon 前台也必须变成可见 `loop_detected` stop；跨 turn raw id 复用只有在工具名与参数指纹相同的时候才算 replay，参数不同的碰撞必须作为新调用执行。

#5624 处理的是另一类历史完整性问题：保存的 session 里可能只有 tool start，没有匹配 tool result。恢复或导出 transcript 时，如果原样 replay，会重新创建一个永远 in-progress 的工具卡片。修复后 replay 阶段会把 dangling historical tool calls 合成为 failed terminal update，保证恢复出的 UI 是终态。


---

## 2. 整体架构

```mermaid
flowchart TD
    MODEL["OpenAI-compatible stream<br/>function_call id=raw"] --> PARSER["streamingToolCallParser"]
    PARSER --> NORM["toolCallIdUtils<br/>normalize before history"]
    NORM -->|"same turn duplicate"| DROP["drop replayed call<br/>do not execute again"]
    NORM -->|"cross turn reused raw id"| SUFFIX["append local suffix<br/>raw -> raw__qwen_N"]
    SUFFIX --> HIST["GeminiChat history"]
    DROP --> HIST
    HIST --> GUARD["execution guards<br/>scheduler / nonInteractive / AgentCore / ACP Session"]
    GUARD --> FPRINT["provider id + canonical<br/>name/args fingerprint"]
    GUARD --> CONV["OpenAI converter cleanup"]
    CONV --> REQ["provider request<br/>one assistant call + adjacent tool result per id"]
    HIST --> REPLAY["HistoryReplayer<br/>dangling start tracking"]
    REPLAY --> FAIL["synthetic failed update<br/>missing saved result"]
    GUARD --> CB["duplicate response circuit breaker<br/>same provider id + same fingerprint"]
    FPRINT --> CB
    CB --> TERM["visible loop-detected stop<br/>global_tool_call_duplicate"]
    GUARD --> CAP["per-turn tool-call cap<br/>100 always-on"]
    GUARD --> IDENT["consecutive identical call guard<br/>threshold 5 always-on"]
    CAP --> LOOPSTOP["loop-detected terminal event"]
    IDENT --> LOOPSTOP
    LOOPSTOP --> NIFAIL["non-interactive CLI<br/>exit 1 + JSON isError"]
    GUARD --> TRUNC["truncated write/edit rejection<br/>retry-loop counter"]
    TRUNC --> STOP["3rd same rejection<br/>RETRY LOOP DETECTED"]
    GUARD --> SHELL["shell git overview inspection bucket"]
    SHELL --> SHELLSTOP["8th similar inspection<br/>shell_command_stagnation"]
```

关键边界：

- **进入 history 前规范化**：把 provider raw id 与 qwen-code local id 分开。跨 turn 复用 raw id 时，local id 加 suffix；同 turn replay 的 id 被丢弃，不进入可执行路径。
- **执行路径兜底**：core scheduler、non-interactive CLI、AgentCore、ACP Session 都加 duplicate-id guard，即便上游 parser 漏掉，也不会让同一 replay 重复执行；#9436 后，replay 判定同时要求 provider id 与 canonical 工具名/参数 fingerprint 相同。
- **出站 payload 最终清理**：OpenAI converter 在发请求前保守清理重复 surviving pair，保证 provider 看到的是合法的 call/result 邻接结构。
- **speculation 配对**：follow-up speculation 生成的 function call 与 function response 继续共用同一 local id，避免 speculative path 自己制造不配对。

---

## 3. 关键流程

### 3.1 同 turn replay：只保留第一次

同一个模型 turn 内，如果 provider 用相同 `tool_call.id` replay 已完成调用，qwen-code 视为无效重复。保留第一次 call，后续同 id call 不再触发工具执行。这个选择偏安全：如果两个调用语义不同但 id 相同，provider 已违反协议；重复执行 shell/edit 的风险比丢弃 replay 更高。

### 3.2 跨 turn raw id 复用：追加 suffix

跨 turn 出现旧 raw id 时，不能简单丢弃，因为模型可能确实想发起一个新调用；也不能原样写 history，因为会污染后续 payload。#5107 将其映射为新的本地 id，例如 `dup_id_0001__qwen_2`，让后续 assistant call 和 tool result 用 local id 配对。#9436 进一步要求重复 raw id 的 replay 判定读取已处理调用的 canonical `(toolName,args)` fingerprint：同 id 同 fingerprint 才合成 duplicate response；同 id 但参数不同则继续走 suffixed local id 执行，避免 provider id 碰撞吞掉真实新命令。

### 3.3 OpenAI 出站转换：最后一道清理

历史里可能已经存在旧版本留下的损坏记录。OpenAI converter 在出站前再做一次 cleanup：同一 id 只保留一个存活 assistant tool call 与一个相邻 tool result，避免把重复 pair 发给 provider。对旧腐化 reused-id history，microcompaction 仍保留保守 disarm 行为，避免把不可信历史继续压进模型上下文。

### 3.4 dangling replay：历史 start 必须有终态

#5624 在 `HistoryReplayer` 中跟踪 replay 出来的 assistant tool starts：真实 tool result 会按 call ID 移除 pending entry；如果保存历史结束时仍有 pending call，replayer 会补发 `tool_call_update{status:'failed'}`，错误信息说明 saved history 缺失工具结果，上一轮可能在工具完成前结束。匹配逻辑会从 saved result call id fallback 到 function response id，再回退 record uuid，兼容旧历史形态。这个变化只影响历史 transcript reconstruction，不改变 live tool execution、REST、SDK 或 ACP wire shape。

### 3.5 repeated duplicate provider id：可见 loop stop

duplicate response circuit breaker 命中时，不应只在内部 drop 当前 batch。#9435 把 ACP daemon session 的 repeated duplicate provider id stop 接入既有 `loopDetected` 管道，前台 prompt 发布 `loop_detected` turn error，并携带 `global_tool_call_duplicate` loop type；cron/background notification turn 保持 graceful end-turn 语义。这样 CLI、ACP daemon 与 telemetry 对同一安全停机原因使用同一终态，而不是 daemon UI 静默结束。

## 4. 涉及 PR

| PR | 子主题 | 作用 |
|---|---|---|
| [#5107](https://github.com/QwenLM/qwen-code/pull/5107) | duplicate tool call id repair | 规范化模型返回 id；同 turn replay 去重；跨 turn raw id suffix；OpenAI payload cleanup；core/CLI/AgentCore/ACP Session 执行 guard；speculation id 配对 |
| #5624 | dangling replay tool calls | replay 历史时跟踪 tool start/result 配对，对缺失 result 的 historical tool call 合成 failed terminal update，避免恢复 UI 卡在 processing |
| [#9435](https://github.com/QwenLM/qwen-code/pull/9435) | visible duplicate-provider-id stop | ACP daemon repeated duplicate provider id breaker 走 `loopDetected`，前台发布 `loop_detected` turn error 与 `global_tool_call_duplicate` telemetry。 |
| [#9436](https://github.com/QwenLM/qwen-code/pull/9436) | argument-aware replay detection | duplicate provider id 只有在 provider id 与 canonical 工具名/参数 fingerprint 都匹配时才算 replay；参数不同的 id collision 作为 fresh call 执行。 |

---

## 5. 已知限制 / 后续

1. **同 turn 相同 id 的两个不同调用仍只保留第一个**：这是刻意的安全取舍。OpenAI-compatible 协议不允许同一 turn 内复用 id；重复执行副作用更危险。#9436 只放宽跨 turn handled-id replay 判定，不把同 batch duplicate 变成可执行多调用。
2. **Anthropic-compatible 出站转换未改**：#5107 针对 OpenAI-compatible provider 的历史和 payload 修复；其它 provider 协议仍按原路径。
3. **旧损坏历史只能保守处理**：已经写入 session 的重复 id 记录无法可靠还原模型真实意图；出站 cleanup 与 microcompaction disarm 是防止继续放大的保护，不是历史迁移。
4. **dangling replay 修复仅限历史重建**：#5624 不改变 live tool lifecycle；它只保证旧 transcript 恢复时不会留下无终态 tool block。
5. **参数指纹无法修复已损坏历史**：#9436 的 fingerprint map 只能从可解析、已配对的 assistant call / tool result 推导；历史中缺参数、缺 result 或已被旧逻辑压扁的语义不能恢复。

---

## 6. 代码贡献

### PR #5107 — repair duplicate tool call IDs

- `packages/core/src/core/toolCallIdUtils.ts`：新增工具调用 ID 规范化/去重 helper。
- `packages/core/src/core/geminiChat.ts`：模型返回 function call 进入 history 前做 id 规范化。
- `packages/core/src/core/openaiContentGenerator/{streamingToolCallParser,converter}.ts`：解析与出站转换阶段清理重复 id 和 surviving pair。
- `packages/core/src/core/coreToolScheduler.ts`、`packages/cli/src/nonInteractiveCli.ts`、`packages/core/src/agents/runtime/agent-core.ts`、`packages/cli/src/acp-integration/session/Session.ts`：执行路径增加 duplicate-id guard。
- `packages/core/src/followup/speculation.ts`：保持 speculative function call / response 使用同一 local id 配对。

### PR #5624 — fail dangling replayed tool calls

- `HistoryReplayer.ts`：replay assistant tool starts 时按 call id 记录 pending，replay tool result 时移除匹配项。
- result matching：从 saved result call id fallback 到 function response id，再回退 record uuid，覆盖旧历史数据形态。
- replay 完成后对剩余 pending calls 发 failed terminal update，说明 saved history 缺失 tool result。
- `selectors.test.ts`：确保 webui restored transcript 中 failed/completed tool blocks 都被视为 idle，不再让 session 卡在 responding。

### PR #9435 — visible daemon loop stop

- `packages/cli/src/acp-integration/session/Session.ts`：repeated duplicate provider id breaker 移除 bespoke result flag，改走 `loopDetected` 与 `LoopType.GLOBAL_TOOL_CALL_DUPLICATE`。
- `packages/cli/src/acp-integration/session/Session.test.ts`：覆盖 ACP foreground visible `loop_detected` error、history context preservation 与 cron/background graceful stop。
- `docs/design/2026-08-19-duplicate-provider-toolcall-id-guard.md`：记录 daemon 可见 stop 与 args-aware replay 的设计边界。

### PR #9436 — argument-aware replay detection

- `packages/core/src/utils/tool-call-repeat-key.ts`：提供 leaf repeat-key helper，按 canonical tool name 与排序后的 JSON-compatible args 生成 fingerprint。
- `packages/core/src/core/toolCallIdUtils.ts`：handled provider id 记录 original fingerprint；同 id 同 fingerprint 判为 replay，同 id 不同 fingerprint 保留 suffixed local id 执行。
- `packages/core/src/core/geminiChat.ts` / `turn.ts` / `coreToolScheduler.ts`：history fingerprint map、turn normalization 与 scheduler guard 接入新 replay predicate。
- `packages/cli/src/ui/hooks/useGeminiStream.ts`、`packages/cli/src/nonInteractiveCli.ts`、`packages/cli/src/acp-integration/session/Session.ts`、`packages/core/src/agents/runtime/agent-core.ts`：TUI、headless、ACP daemon 和 Agent runtime 共用参数敏感 duplicate guard。
