# oh-my-qwencode (omq) 实现方案 v3

## Context

oh-my-claudecode (OMC, 35k stars) 为 Claude Code 提供多 agent 编排能力。我们要为 Qwen Code（Claude Code fork，插件机制高度相似）创建同类项目 oh-my-qwencode，面向开源社区。

**v3 修订：** 基于第二轮 review（含 qwen-code 源码验证）修正致命问题：
- ~~`--dangerously-skip-permissions`~~ → **`--yolo`**（qwen-code 实际 flag）
- ~~detached 子进程~~ → **非 detached，保持 stdin pipe**
- ~~CLAUDE.md 文件发现~~ → **`--append-system-prompt` CLI flag 直接注入**
- ~~30s 心跳超时~~ → **PID 存活为主，心跳过期(5min)为辅**
- ~~rebase 活跃 worktree~~ → **只 merge worker→leader，空闲时才 rebase worker**
- ~~debounce 无互斥~~ → **加 merge mutex，同一时刻只有一个 batch 在跑**
- Worker 输入协议：**`--input-format stream-json`**（JSONL over stdin）

---

## 架构决策（审计修订版）

### 决策 1：Worker 进程模型 — 双模式 + Stream JSON 协议

**问题：** tmux 对中国开发者（VS Code 终端、云 IDE、WSL）是致命依赖。

**方案：** 支持两种模式，子进程模式为默认：

| 模式 | 机制 | 适用场景 |
|------|------|----------|
| **subprocess** (默认) | `child_process.spawn`，**不 detach** | 所有环境，零额外依赖 |
| **tmux** (可选) | tmux pane，可视化并行 | 终端 power user，需手动 `--tmux` |

**子进程模式（经 qwen-code 源码验证）：**

```typescript
// 正确的 spawn 方式（不 detach，保持 pipe）
const worker = spawn('qwen', [
  '--input-format', 'stream-json',   // JSONL over stdin/stdout
  '--output-format', 'stream-json',
  '--yolo',                           // 跳过权限（非 --dangerously-skip-permissions）
  '--append-system-prompt', overlayContent,  // Worker Overlay 直接注入
  '-p', initialTaskPrompt             // 初始任务
], { stdio: ['pipe', 'pipe', 'pipe'] });  // 不 detach！
```

**关键源码依据：**
- `qwen-code/packages/cli/src/config/config.ts:639` → `--yolo` flag
- `qwen-code/packages/cli/src/nonInteractive/io/StreamJsonInputReader.ts` → JSONL stdin
- Worker 进程是 leader 的子进程，leader 退出时子进程会收到 SIGHUP

**后续消息发送：** 通过 stdin pipe 写入 JSONL：
```json
{"type": "user_message", "content": "New task: implement X"}
```

tmux 模式：
- `--tmux` flag 启用
- 每个 worker 一个 pane，用 `tmux send-keys` 发送命令
- 预检 tmux 安装，未安装时给出清晰错误 + 安装指引

```typescript
// src/team/worker-process.ts
interface WorkerBackend {
  spawn(config: WorkerConfig): Promise<WorkerHandle>;
  isAlive(handle: WorkerHandle): boolean;
  kill(handle: WorkerHandle): Promise<void>;
  sendMessage(handle: WorkerHandle, message: StreamJsonMessage): Promise<void>;
}

class SubprocessBackend implements WorkerBackend {
  // spawn 不 detach，保持 stdin/stdout pipe
  // isAlive = kill(pid, 0)
  // sendMessage = worker.stdin.write(JSON.stringify(msg) + '\n')
}
class TmuxBackend implements WorkerBackend {
  // spawn = tmux split-pane + send-keys
  // isAlive = tmux list-panes 检查
  // sendMessage = tmux send-keys (适用于交互模式)
}
```

**Leader 退出时的清理：**
- 注册 `process.on('exit')` 和 `process.on('SIGTERM')` handler
- 向所有 worker 发送 shutdown 消息
- 等待 5s grace period 后 `kill(pid, SIGKILL)`

### 决策 2：原子文件 I/O

**问题：** 读写竞态导致 partial JSON 解析崩溃。

**方案：** 所有状态文件使用 `writeFileAtomic()`：

```typescript
// src/lib/atomic-write.ts
async function writeFileAtomic(filePath: string, data: string): Promise<void> {
  const tmpPath = `${filePath}.${process.pid}.tmp`;
  await fs.writeFile(tmpPath, data, 'utf-8');
  await fs.rename(tmpPath, filePath);  // POSIX rename is atomic
}
```

读取侧用 try-catch + 重试（最多 3 次，间隔 50ms）处理极端竞态。

### 决策 3：Worker 崩溃恢复（双信号检测）

**问题：** 崩溃后孤儿状态文件，用户看到沉默。且 LLM 思考 60s+ 无 I/O 不等于崩溃。

**方案：** 双信号分级检测：

| 信号 | 检测方式 | 判定 |
|------|----------|------|
| **进程死亡**（主信号） | `kill(pid, 0)` 返回 false 或 spawn 的 `exit` 事件 | 立即判定崩溃 |
| **心跳过期**（辅助信号） | heartbeat.json 的 `last_turn_at` 超 5 分钟 | 可能假死/卡住 |

**关键区分：** `kill(pid, 0)` 探活 ≠ 进程有进展。进程可能存在但死循环。因此：
- PID 不存在 → 确定崩溃，立即恢复
- PID 存在但 5 分钟无心跳更新 → 疑似假死，通知 leader 人工判断

**Heartbeat 写入机制（子进程模式）：**
- **不依赖 Worker 自己写心跳**（LLM 思考时无法执行工具）
- 改为：监听 worker stdout 的 stream-json 输出，有任何输出即更新 `last_activity_at`
- Worker 的 `--output-format stream-json` 每次 tool call、思考输出都会产生 JSONL

**崩溃恢复流程：**
1. 检测到进程退出 → 标记 `status: crashed`
2. `git -C {worktree} stash` 保存未提交变更（留存证据）
3. `git -C {worktree} reset --hard HEAD` 恢复干净状态
4. 任务重新入队（标注 `retry_count++`，超过 3 次标记 `failed`）
5. 通知 leader + 写入 events.jsonl

```typescript
// src/team/watchdog.ts
class WorkerWatchdog {
  private readonly checkIntervalMs = 5000;
  private readonly staleThresholdMs = 5 * 60 * 1000; // 5 minutes
  
  onWorkerExit(worker: WorkerState, code: number | null) {
    // 进程退出 = 确定崩溃（或正常完成）
    if (worker.status !== 'done') {
      this.handleCrash(worker, `process exited with code ${code}`);
    }
  }
  
  checkForStaleWorkers() {
    for (const worker of this.workers) {
      const elapsed = Date.now() - worker.lastActivityAt;
      if (elapsed > this.staleThresholdMs) {
        this.notifyLeader(`Worker ${worker.name} may be stuck (${elapsed}ms no activity)`);
      }
    }
  }
}
```

### 决策 4：AST 工具优雅降级

**问题：** `@ast-grep/napi` native binding 在部分平台/网络下装不上。

**方案：** 
- `@ast-grep/napi` 作为 `optionalDependencies`
- MCP server 启动时探测，不可用则 AST 工具返回友好错误
- 提供纯 regex 回退（精度低但可用）
- 文档说明 npmmirror 加速安装方法

```typescript
// src/tools/ast/loader.ts
let astGrep: typeof import('@ast-grep/napi') | null = null;

try {
  astGrep = await import('@ast-grep/napi');
} catch {
  // AST tools will return graceful error
}

export function isAstAvailable(): boolean { return astGrep !== null; }
```

### 决策 5：Merge 策略（单向 merge + 空闲 rebase）

**问题：**
1. N 个 worker 同时 commit → N² rebase 操作
2. Rebase 活跃 worktree 存在 TOCTOU 竞态（检查后 worker 立即开始写入）

**方案（重新设计）：** 只做 worker→leader 单向 merge，不在活跃时 rebase worker：

```
正常流：  Worker commit → Merge into Leader (via merger worktree) → Done
空闲时：  Worker 完成任务 → 状态变 idle → Rebase worker onto latest leader
```

**核心原则：**
- **永远不 rebase 正在工作的 worker** — 消除 TOCTOU 竞态
- **Rebase 只在 worker 空闲时进行** — 通过检查 `status.json === 'idle'`
- **Merge 操作加 mutex** — 同一时刻只有一个 merge batch 在执行

```typescript
// src/team/merge-orchestrator.ts
class MergeOrchestrator {
  private mergeMutex = new Mutex();  // 防止并发 merge
  private pollIntervalMs = 5000;     // 5s 轮询（非 1s）
  private debounceMs = 3000;         // 3s 收集窗口
  
  private scheduleMergeBatch = debounce(async () => {
    await this.mergeMutex.runExclusive(async () => {
      const batch = [...this.pendingWorkers];
      this.pendingWorkers.clear();
      
      // 只 merge worker→leader，不触发 rebase
      for (const worker of batch) {
        await this.mergeWorkerIntoLeader(worker);
      }
    });
  }, this.debounceMs);
  
  // 单独的空闲 rebase 循环
  async rebaseIdleWorkers() {
    for (const worker of this.workers) {
      if (worker.status === 'idle' && this.isWorkerBehindLeader(worker)) {
        await this.rebaseWorker(worker);
      }
    }
  }
}
```

**效果：**
- 3 个 worker 同时 commit → 1 次 batch merge（3 个顺序 merge 操作），0 次 rebase
- Worker 完成任务变 idle → 此时才 rebase 追上 leader 最新代码
- 消除了活跃写入期间的所有竞态

### 决策 6：人类介入 UX

**问题：** Merge 冲突写入 AI leader inbox，但 AI 可能无法解决，人类没有介入点。

**方案：** 分层处理：

1. **AI 尝试**：leader agent 先尝试 resolve（简单的非语义冲突）
2. **暂停通知**：如果 AI 无法解决（超过 1 轮重试），暂停 merge，写入人类可读文件 + 终端提示：
   ```
   .omq/state/team/{t}/CONFLICT.md  ← 冲突详情 + 操作指引
   ```
3. **终端提醒**：`omq team status` 显示红色 CONFLICT 状态
4. **恢复命令**：人类手动解决后 `omq team resume` 继续

### 决策 7：Worker 权限模式

**问题：** 非交互模式下 worker 无法响应 permission prompt。

**方案（qwen-code 验证后）：**
- Worker 统一使用 **`--yolo`** 启动（qwen-code 的 auto-approve flag）
- Worker Overlay（通过 `--append-system-prompt`）注入严格约束：
  - 只操作 assigned 文件路径
  - 禁止 `git push`、`rm -rf`、网络请求等危险操作
  - 禁止 spawn 子 agent 或创建新进程
- 安全等级可配置：`omq.json` 中 `team.permissions: "yolo" | "allowlist"`
- allowlist 模式：自动写入 worker worktree 的 `.claude/settings.local.json`

### 决策 8：Worker Overlay 注入方式

**问题：** `findProjectRoot` 用 `.git` 是否为目录来判断项目根，worktree 中 `.git` 是文件（`gitdir: ...`），导致 CLAUDE.md 不被加载。

**方案：** 不依赖文件发现机制，通过 CLI flag 直接注入：

```bash
qwen --append-system-prompt "$(cat /path/to/worker-overlay.md)" \
     --input-format stream-json --output-format stream-json \
     --yolo -p "Initial task description"
```

**Worker Overlay 内容仍然生成到文件**（`.omq/state/team/{t}/workers/{w}/overlay.md`），但通过 CLI 参数注入而非文件发现。

**注意：** 如果 `--append-system-prompt` 不存在，回退方案是：
1. 将 overlay 内容作为 initial prompt 的前缀注入
2. 或通过 `--system-prompt-file /path/to/overlay.md`（需验证 flag 存在性）

### 决策 9：Merge Orchestrator 感知 Worker 状态

**问题：** 崩溃的 worker 可能留下脏分支，merge 拉到损坏的 SHA。

**方案：**
- Merge 前检查 worker status !== 'crashed'
- 只 merge 状态为 'idle' 或 'done' 的 worker 的最新 commit
- 状态为 'working' 的 worker：等其完成（下次变 idle 时再 merge）
- 状态为 'crashed' 的 worker：跳过，不 merge 其分支

---

## 项目结构（修订版）

```
oh-my-qwencode/
├── .claude-plugin/
│   ├── plugin.json              # 插件清单
│   └── marketplace.json         # Marketplace 注册
├── .mcp.json                    # MCP server 注册
├── agents/                      # Agent 角色定义 (*.md)
│   ├── architect.md
│   ├── critic.md
│   └── explorer.md
├── commands/                    # Slash 命令 (*.md)
│   ├── ultrawork.md
│   ├── ralph.md
│   ├── deep-interview.md
│   ├── autopilot.md
│   ├── team.md
│   └── help.md
├── hooks/
│   └── hooks.json               # 生命周期 Hook 注册
├── skills/                      # 工作流 Skills (*/SKILL.md)
│   ├── ultrawork/SKILL.md
│   ├── ralph/SKILL.md
│   ├── deep-interview/SKILL.md
│   ├── autopilot/SKILL.md
│   ├── team/SKILL.md
│   ├── hud/SKILL.md
│   └── using-omq/SKILL.md
├── scripts/                     # Hook 脚本 + 构建脚本
│   ├── build.mjs               # esbuild 构建
│   ├── session-start.mjs       # SessionStart hook
│   ├── keyword-detector.mjs    # UserPromptSubmit hook
│   └── stop-hook.mjs           # Stop hook
├── src/
│   ├── lib/
│   │   ├── atomic-write.ts     # [NEW] 原子文件写入
│   │   ├── debounce.ts         # [NEW] 防抖工具
│   │   └── process-utils.ts    # [NEW] 进程探活
│   ├── cli/
│   │   ├── index.ts            # CLI 入口 (commander.js)
│   │   └── commands/
│   │       ├── team.ts         # omq team start/stop/status/scale/resume
│   │       └── version.ts
│   ├── team/
│   │   ├── runtime.ts          # 主编排循环
│   │   ├── worker-process.ts   # [NEW] WorkerBackend 抽象
│   │   ├── subprocess-backend.ts # [NEW] 子进程模式 (默认)
│   │   ├── tmux-backend.ts     # tmux 模式 (可选)
│   │   ├── git-worktree.ts     # worktree 生命周期
│   │   ├── worker-bootstrap.ts # Worker Overlay 生成
│   │   ├── watchdog.ts         # [NEW] 崩溃检测 + 恢复
│   │   ├── task-queue.ts       # [NEW] 任务队列 + 重入队
│   │   ├── scaling.ts          # 动态扩缩容
│   │   ├── model-contract.ts   # CLI 类型适配
│   │   ├── merge-orchestrator.ts  # 自动合并 (debounce)
│   │   ├── merge-state.ts      # SHA 状态持久化
│   │   ├── conflict-handler.ts # [NEW] 冲突处理 + 人类介入
│   │   └── types.ts
│   ├── mcp/
│   │   ├── server.ts           # MCP server 入口 (stdio)
│   │   └── tool-registry.ts    # 工具注册
│   ├── tools/
│   │   ├── lsp/
│   │   │   ├── client.ts       # LSP client (JSON-RPC 2.0)
│   │   │   ├── client-pool.ts  # 连接池 + 空闲驱逐
│   │   │   ├── server-configs.ts  # 20 种语言服务器配置
│   │   │   └── tools.ts        # LSP 工具定义
│   │   └── ast/
│   │       ├── loader.ts       # [NEW] 可选加载 + 降级
│   │       └── tools.ts        # AST 工具
│   └── config/
│       └── loader.ts           # 配置加载 (.omq.json)
├── bridge/                      # 构建产物
│   ├── cli.cjs
│   └── mcp-server.cjs
├── tests/
│   ├── unit/                    # [NEW] 单元测试
│   │   ├── atomic-write.test.ts
│   │   ├── watchdog.test.ts
│   │   ├── merge-debounce.test.ts
│   │   └── task-queue.test.ts
│   └── integration/             # [NEW] 集成测试
│       ├── team-subprocess.test.ts
│       └── mcp-server.test.ts
├── package.json
├── tsconfig.json
└── README.md                    # 中文为主
```

---

## 实现阶段（修订版）

### Phase 0: 项目骨架 (Day 1-3)

1. `package.json` — name: oh-my-qwencode, type: module
2. `.claude-plugin/plugin.json` — 最小清单（兼容 Qwen Code 的实际加载方式）
3. `hooks/hooks.json` — SessionStart + UserPromptSubmit + Stop
4. `scripts/session-start.mjs` — 注入 using-omq 上下文
5. `skills/using-omq/SKILL.md` — 启动引导 skill
6. `src/lib/atomic-write.ts` — 原子文件写入基础设施
7. `tsconfig.json` + `scripts/build.mjs` (esbuild)
8. **兼容性验证** — 在 Qwen Code 中实际安装并验证插件加载

验证：插件安装后 SessionStart 触发，`/using-omq` 可调用。

### Phase 1: 工作流 Skills (Day 4-9)

纯 Markdown，**可独立发布使用（无 TS 代码依赖）**：

| Skill | 行数 | 核心改进 |
|-------|------|----------|
| ultrawork | ~600 | 3 级路由 (qwen-turbo/plus/max)，成本预估提示 |
| deep-interview | ~400 | 中文优先的问答模板 |
| ralph | ~500 | PRD 循环 + 失败恢复指引 |
| autopilot | ~500 | 5 阶段 + 各阶段可独立重试 |
| team | ~200 | 入口 skill，检测环境能力后选择 subprocess/tmux |
| hud | ~150 | `omq team status` 调用结果格式化展示 |

**与 OMC 差异：**
- 模型路由默认 Qwen 系列
- Skill 中加入成本预估（"本次预计消耗 ~X tokens"）
- 各阶段加入明确的"人类介入点"说明

验证：每个 skill 用 `/skill-name` 触发后行为正确。

### Phase 2: LSP/AST MCP Server (Day 10-20)

**独立可用模块** — 即使不装 Team Runtime 也能单独使用。

核心文件（同原方案），新增：
- `src/tools/ast/loader.ts` (~50 行) — 可选加载 ast-grep，失败时降级
- 安装脚本检测 `@ast-grep/napi` 是否可用，不可用时提示但不阻塞

**中国网络适配：**
- README 中提供 `npm install --registry=https://registry.npmmirror.com` 指引
- 可选 `OMQ_NPM_REGISTRY` 环境变量

**依赖调整：**
```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.26.0"
  },
  "optionalDependencies": {
    "@ast-grep/napi": "^0.31.0"
  }
}
```

验证：
1. 有 ast-grep：`ast_search` + `ast_replace` 正常工作
2. 无 ast-grep：MCP server 正常启动，AST 工具返回"ast-grep not installed"提示
3. LSP：对 TypeScript 项目 `lsp_hover` 返回类型信息

### Phase 3: Team Runtime (Day 21-35)

**核心设计（v3 源码验证后）：**

1. **双模式 Backend** — 默认 subprocess（stream-json），可选 tmux
2. **进程退出事件 + stdout 活跃度** — 双信号崩溃检测
3. **`--append-system-prompt`** — Overlay 通过 CLI flag 注入（绕过 worktree 文件发现 bug）
4. **`--yolo`** — qwen-code 的 auto-approve flag
5. **任务队列** — 支持重入队、retry 计数、认领锁

**核心文件（v3）：**
- `src/team/runtime.ts` (~500 行) — 主循环 + 生命周期管理 + cleanup handler
- `src/team/worker-process.ts` (~100 行) — Backend 接口
- `src/team/subprocess-backend.ts` (~300 行) — stream-json spawn + stdin pipe + stdout 监听
- `src/team/tmux-backend.ts` (~300 行) — tmux 管理（可选）
- `src/team/git-worktree.ts` (~300 行) — worktree 生命周期
- `src/team/worker-bootstrap.ts` (~300 行) — Overlay 生成 + CLI args 构建
- `src/team/watchdog.ts` (~200 行) — 进程退出监听 + 活跃度监控 + 崩溃恢复
- `src/team/task-queue.ts` (~200 行) — 任务分配 + 重入队 + retry 上限
- `src/team/model-contract.ts` (~250 行) — qwen-code/claude/codex CLI flag 差异适配
- `src/team/conflict-handler.ts` (~100 行) — 冲突 → 暂停 → 人类通知
- `src/cli/commands/team.ts` (~250 行) — start/stop/status/scale/resume

**Worker 启动参数（qwen-code 模式）：**
```bash
qwen --input-format stream-json --output-format stream-json \
     --yolo \
     --append-system-prompt "$(cat .omq/state/team/{t}/workers/{w}/overlay.md)" \
     -p "Read your task assignment and begin work"
```

**Worker Overlay 注入方式（跨 CLI 验证）：**
| CLI | 注入方式 | 权限 flag |
|-----|---------|-----------|
| qwen-code | `--append-system-prompt` | `--yolo` |
| claude | `--append-system-prompt` | `--dangerously-skip-permissions` |
| codex | 初始 prompt 前缀注入 | `--approval-mode full-auto` |

**Leader 退出时清理：**
```typescript
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);
process.on('exit', cleanup);

async function cleanup() {
  for (const worker of activeWorkers) {
    worker.stdin.write(JSON.stringify({type: 'shutdown'}) + '\n');
  }
  await Promise.race([
    Promise.all(workers.map(w => w.exitPromise)),
    sleep(5000)  // 5s grace period
  ]);
  workers.forEach(w => w.process.kill('SIGKILL'));
}
```

验证：
1. `omq team start --workers 2 "Task"` — 子进程模式，stdout 有 stream-json 输出
2. `omq team start --workers 2 --tmux "Task"` — tmux 模式正常
3. `kill -9 <worker_pid>` — 立即检测（exit 事件），任务重入队
4. `omq team status` — 正确显示各 worker 状态 + 活跃度
5. Leader `Ctrl+C` — 所有 worker 优雅退出

### Phase 4: Merge Orchestrator (Day 32-40，Phase 3 完成后开始)

**v3 策略（重新设计）：** 单向 merge + 空闲 rebase

核心原则：
- **只做 worker→leader 单向 merge**（通过 merger worktree）
- **永不 rebase 正在工作的 worker**（消除 TOCTOU 竞态）
- **空闲时才 rebase worker**（status === 'idle' 时）
- **Merge 加 mutex**（同一时刻只有一个 batch）
- **状态感知**（跳过 crashed worker 的分支）

**核心文件（v3）：**
- `src/team/merge-orchestrator.ts` (~500 行) — mutex + debounce + 状态感知 merge
- `src/team/merge-state.ts` (~120 行) — 原子 SHA 持久化
- `src/team/conflict-handler.ts` (共用) — CONFLICT.md + 暂停 + resume
- `src/lib/mutex.ts` (~50 行) — 简单 async mutex

**工作流：**
```
1. 5s 轮询各 worker branch HEAD SHA
2. 有变化 → 加入 pending set
3. 3s debounce 窗口关闭 → 获取 merge mutex
4. 对 pending 中 status 非 crashed 的 worker，逐个 merge 到 leader
5. 释放 mutex
6. （独立循环）扫描 idle 且 behind-leader 的 worker → rebase
```

**Phase 依赖说明：** 
Phase 4 在 Phase 3 **完成后**开始（Day 32），因为 merge 依赖 worker 生命周期管理（spawn/status/exit）已稳定。

验证：
1. 2 worker 改不同文件 → 自动 merge 成功
2. 3 worker 同时 commit → 只 1 次 batch merge（mutex 保证）
3. Worker 完成变 idle → 自动 rebase 追上 leader
4. Worker 工作中 → 不被 rebase
5. 冲突 → CONFLICT.md + 暂停 → `omq team resume` 恢复
6. Crashed worker → 其分支被跳过，不被 merge

### Phase 5: 集成测试与打磨 (Day 41-50)

1. **单元测试** (~1000 行)
   - `atomic-write.test.ts` — 并发写入安全性
   - `watchdog.test.ts` — 进程退出检测 + 活跃度超时 + 重入队
   - `merge-mutex.test.ts` — mutex 互斥 + debounce 批量 + 状态过滤
   - `task-queue.test.ts` — 认领/释放/重入队/retry 上限
   - `model-contract.test.ts` — 各 CLI 参数生成正确性

2. **集成测试** (~600 行)
   - `team-subprocess.test.ts` — stream-json worker 生命周期（spawn→message→exit）
   - `team-crash-recovery.test.ts` — kill worker → 检测 → stash → 重入队
   - `mcp-server.test.ts` — MCP tool 调用正确性
   - `merge-idle-rebase.test.ts` — worker idle 后自动 rebase

3. **端到端验证**
   - 完整 team 工作流：拆任务→并行→merge→汇总
   - Worker 崩溃 → 恢复 → 任务完成
   - Leader Ctrl+C → 优雅清理所有 worker

4. **文档** — README.md（中文为主，英文附录）

5. **CI** — GitHub Actions: lint + type-check + unit test + build

---

## 模块独立性（渐进采纳）

每个模块可独立安装使用：

| 模块 | 独立安装方式 | 无依赖要求 |
|------|-------------|-----------|
| Skills | 只需 `skills/` + `hooks/` 目录 | 无 |
| LSP/AST MCP | 只需 `bridge/mcp-server.cjs` + `.mcp.json` | Node.js |
| Team Runtime | 需要 CLI (`bridge/cli.cjs`) | Node.js, git 2.5+ |
| Merge Orchestrator | Team Runtime 的子功能 | 同上 |

用户可以：
- 只装 Skills → 获得 ultrawork/ralph/deep-interview
- 只装 MCP server → 获得 LSP/AST 工具
- 装完整版 → 获得全部能力

---

## 关键设计决策（修订版）

| 决策 | 选择 | 原因 |
|------|------|------|
| Worker 进程模型 | subprocess 默认，tmux 可选 | 覆盖 VS Code/云 IDE 用户 |
| 文件 I/O | 全部 temp+rename 原子写 | 防止竞态读到 partial JSON |
| 崩溃恢复 | Watchdog + 任务重入队 | 不让用户看到沉默 |
| Merge 频率 | 5s 轮询 + 3s debounce | 防 N² 风暴 |
| AST 依赖 | optionalDependencies + 降级 | 不因 native addon 阻塞安装 |
| 权限 | --dangerously-skip-permissions | Team 场景用户已授权，非交互必须 |
| 冲突处理 | AI 先试 → 写 CONFLICT.md → 暂停等人 | 有明确的人类介入路径 |
| 模块耦合 | 每个模块可独立使用 | 渐进采纳，降低入门门槛 |

---

## 依赖（修订版）

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.26.0",
    "commander": "^12.0.0"
  },
  "optionalDependencies": {
    "@ast-grep/napi": "^0.31.0"
  },
  "devDependencies": {
    "esbuild": "^0.21.0",
    "typescript": "^5.7.0",
    "vitest": "^2.0.0",
    "@types/node": "^22.0.0"
  }
}
```

注意：`@ast-grep/napi` 移到 optional，装不上不影响其他功能。

---

## 验证计划（修订版）

| 场景 | 验证方法 | 通过标准 |
|------|----------|----------|
| 插件加载 | 安装后 SessionStart 触发 | hook 输出正常 |
| Skills | `/ultrawork "X and Y"` | 触发并行 agent 调用 |
| LSP (有 LS) | `lsp_hover` on .ts file | 返回类型信息 |
| LSP (无 LS) | `lsp_hover` on .ts file | 清晰错误 + 安装指引 |
| AST (有 napi) | `ast_search {pattern}` | 返回匹配 |
| AST (无 napi) | `ast_search {pattern}` | 友好提示 "未安装" |
| Team (subprocess) | `omq team start --workers 2` | 2 worker 启动，任务分配 |
| Team (tmux) | `omq team start --tmux --workers 2` | tmux pane 可见 |
| Worker 崩溃 | `kill -9 <pid>` | 30s 内检测，任务重入队 |
| Merge 正常 | 2 worker 改不同文件 | 自动合并成功 |
| Merge 冲突 | 2 worker 改同文件 | 写 CONFLICT.md + 暂停 |
| Merge 批量 | 3 worker 同时 commit | 只 1 轮 merge+rebase |
| 人类介入 | 冲突后 `omq team resume` | 恢复执行 |
| 中国网络 | npmmirror registry 安装 | 无 native 超时 |

---

## 工作量估算（v3，含测试和缓冲）

| 阶段 | 天数 | TypeScript | Markdown | 测试 |
|------|------|-----------|----------|------|
| Phase 0: 骨架 + 验证 | 3 | 250 行 | 100 行 | 0 |
| Phase 1: Skills | 6 | 0 | 2500 行 | 0 |
| Phase 2: LSP/AST MCP | 11 | 2200 行 | 0 | 300 行 |
| Phase 3: Team Runtime | 15 | 2800 行 | 200 行 | 600 行 |
| Phase 4: Merge | 9 | 900 行 | 0 | 400 行 |
| Phase 5: 集成 + 文档 + CI | 10 | 500 行 | 800 行 | 600 行 |
| **合计** | **~50 天** | **~6650 行** | **~3600 行** | **~1900 行** |

**vs v2 变化：** +5 天（stream-json 集成、mutex、空闲 rebase 逻辑、CLI flag 验证、Phase 依赖调整）。

**关键路径：** Phase 0 → Phase 3 → Phase 4 → Phase 5 (37 天)
**并行路径：** Phase 1 + Phase 2 与 Phase 3 并行

两人协作约 35 天，单人约 50 天。

---

## 风险清单及缓解（v3）

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| `--append-system-prompt` flag 不存在或行为不同 | 中 | 高 | Phase 0 验证；回退：initial prompt 前缀注入 |
| `--input-format stream-json` JSONL 格式与预期不符 | 低 | 高 | 参考 `StreamJsonInputReader.ts` 源码实现 |
| Worker 子进程在 leader 退出后成为 zombie | 中 | 中 | SIGTERM + 5s grace + SIGKILL；process group kill |
| Qwen Code 插件加载机制与 Claude Code 有差异 | 中 | 高 | Phase 0 立即验证，失败则调整 |
| ast-grep 在 ARM Linux/musl 无预编译 | 低 | 低 | optionalDependencies + 运行时降级 |
| 多 worker 并发写 events.jsonl 损坏 | 中 | 中 | 每个 worker 写独立日志，leader 汇总 |
| Merge mutex 死锁（异常退出未释放） | 低 | 高 | 超时释放（30s）+ 进程内 mutex（不跨进程） |
| API 额度耗尽 | 中 | 中 | Skill 中加入 token 预估；team start 前提示 |

## 源码验证清单（Phase 0 必须确认）

| 验证项 | 源码位置 | 预期行为 |
|--------|---------|---------|
| `--yolo` flag 存在 | `packages/cli/src/config/config.ts` | 跳过所有权限确认 |
| `--input-format stream-json` | `packages/cli/src/nonInteractive/` | JSONL stdin/stdout |
| `--append-system-prompt` | `packages/cli/src/config/` | 追加到 system prompt |
| 插件 hooks.json 加载 | `packages/core/src/hooks/` | SessionStart hook 被调用 |
| SKILL.md 发现和注册 | `packages/core/src/skills/` | skill 出现在 `/` 命令列表 |
| MCP server stdio 启动 | `packages/core/src/tools/mcp-transport-pool.ts` | server 正常连接 |
