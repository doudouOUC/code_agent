# Qwen Code Daemon 多 Workspace 规模化设计（25 → 上百）

**日期**: 2026-09-04
**作者**: doudouOUC
**仓库**: [QwenLM/qwen-code](https://github.com/QwenLM/qwen-code)
**基线 commit**: [`be585888f8cf`](https://github.com/QwenLM/qwen-code/commit/be585888f8cf)
**状态**: 设计草案，未实现

> **代码引用约定**：本文所有 `文件:行号` 均锚定在上述基线 commit。永久链接前缀为
> `https://github.com/QwenLM/qwen-code/blob/be585888f8cf/`。

## 一句话结论

当前 daemon 的 workspace 上限 `MAX_DAEMON_WORKSPACES = 25` **不是"内存装不下更多"，而是
同一个常量被当成三种不同的容量在用**。所以要支持上百个 workspace，核心工作不是把 25 改
大，而是先把被混用的三个轴拆开，并给真正花钱的那个轴装上强制准入——**放开注册上限是最
后一步，不是第一步。**

## 目录

- [1. 问题陈述](#1-问题陈述)
- [2. 目标与非目标](#2-目标与非目标)
- [3. 三轴模型](#3-三轴模型)
- [4. 阶段顺序](#4-阶段顺序顺序本身是设计的一部分)
- [5. Phase 0 — 测量基线](#5-phase-0--测量基线)
- [6. Phase 1 — 解耦常量](#6-phase-1--解耦常量行为等价)
- [7. Phase 2 — 轴 C：live child 准入](#7-phase-2--轴-clive-child-准入enforce)
- [8. Phase 3 — 轴 B：懒物化与 runtime 回收](#8-phase-3--轴-b懒物化与-runtime-回收)
- [9. Phase 4 — 轴 A：放开注册上限](#9-phase-4--轴-a放开注册上限)
- [10. Phase 5 — fan-out 收敛与启动去阻塞](#10-phase-5--fan-out-收敛与启动去阻塞)
- [11. Phase 6 — 验证](#11-phase-6--验证)
- [12. 被否决的方案](#12-被否决的方案)
- [13. 风险](#13-风险)
- [14. PR 拆解与依赖](#14-pr-拆解与依赖)
- [15. 当前状态与未验证项](#15-当前状态与未验证项)

## 关键代码锚点

| 锚点 | 位置 | 在本方案中的角色 |
| --- | --- | --- |
| `MAX_DAEMON_WORKSPACES = 25` | [channel-control-timeouts.ts#L7](https://github.com/QwenLM/qwen-code/blob/be585888f8cf/packages/acp-bridge/src/channel-control-timeouts.ts#L7) | 硬上限的唯一来源 |
| `CHANNEL_CONTROL_DEFAULT_TIMEOUT_MS` | [channel-control-timeouts.ts#L20](https://github.com/QwenLM/qwen-code/blob/be585888f8cf/packages/acp-bridge/src/channel-control-timeouts.ts#L20) | 耦合点 1：SDK 超时 |
| `admissible = min(…, MAX_DAEMON_WORKSPACES)` | [child-heap-policy.ts#L117](https://github.com/QwenLM/qwen-code/blob/be585888f8cf/packages/acp-bridge/src/child-heap-policy.ts#L117) | 耦合点 2：堆分区分母错用 |
| metrics sampler fan-out | [run-qwen-serve.ts#L6389](https://github.com/QwenLM/qwen-code/blob/be585888f8cf/packages/cli/src/serve/run-qwen-serve.ts#L6389) | 耦合点 3：安全性论证依赖上限 |
| `processRegistry.reserve()` | [spawnChannel.ts#L464](https://github.com/QwenLM/qwen-code/blob/be585888f8cf/packages/acp-bridge/src/spawnChannel.ts#L464) | **唯一正确的准入缝** |
| `committedProcessCount` | [process-registry.ts#L157](https://github.com/QwenLM/qwen-code/blob/be585888f8cf/packages/acp-bridge/src/process-registry.ts#L157) | 轴 C 的计数器 |
| `createDynamicWorkspaceRuntime` | [run-qwen-serve.ts#L6544](https://github.com/QwenLM/qwen-code/blob/be585888f8cf/packages/cli/src/serve/run-qwen-serve.ts#L6544) | **现成的按需 runtime 工厂** |
| boot 期 secondary 构造循环 | [run-qwen-serve.ts#L5909](https://github.com/QwenLM/qwen-code/blob/be585888f8cf/packages/cli/src/serve/run-qwen-serve.ts#L5909) | 上者的 ~380 行近重复实现 |
| `registeredWorkspaces` 字段文档 | [daemon-status.ts#L403-L407](https://github.com/QwenLM/qwen-code/blob/be585888f8cf/packages/cli/src/serve/daemon-status.ts#L403-L407) | 仓库自身已写明"注册 ≠ 分配" |
| primary 唯一性校验 | [workspace-registry.ts#L252-L263](https://github.com/QwenLM/qwen-code/blob/be585888f8cf/packages/cli/src/serve/workspace-registry.ts#L252-L263) | 约束 cold 态设计 |

**相关既有设计文档**（均在同仓库）：

- [`docs/design/workspace-runtime-architecture.md`](https://github.com/QwenLM/qwen-code/blob/be585888f8cf/docs/design/workspace-runtime-architecture.md) —— 权威的 workspace runtime 生命周期与五态机，下称 *runtime 架构文档*
- [`docs/design/2026-07-31-daemon-capacity-model-and-memory-bounds.md`](https://github.com/QwenLM/qwen-code/blob/be585888f8cf/docs/design/2026-07-31-daemon-capacity-model-and-memory-bounds.md) —— 下称 *capacity doc*
- [`docs/design/session-idle-reaper/README.md`](https://github.com/QwenLM/qwen-code/blob/be585888f8cf/docs/design/session-idle-reaper/README.md) —— session 级回收，本方案的对齐参照

---

## 1. 问题陈述

当前 daemon 的 workspace 注册上限是硬编码的 `MAX_DAEMON_WORKSPACES = 25`
（`channel-control-timeouts.ts:7`），没有任何 flag、settings 或环境变量可以覆盖。

但**直接把它改大会立刻产生错误行为**，因为这个常量已经被三处当成容量前提在做算术：

| 位置 | 用法 | 改成 100 的后果 |
| --- | --- | --- |
| `channel-control-timeouts.ts:20` | `2 * N * (12s + 30s) + 30s` 作为 SDK 侧 channel control 默认超时 | 35.5 min → **2.3 h** |
| `child-heap-policy.ts:117` | `admissible = min(floor(childPoolMb / 512), N)` | 模型允许 100 个子进程各 512MB 起，需 ~51GB child pool 才不是 binding term；且该模块只有 `off \| observe`，**不会真的拒绝** |
| `run-qwen-serve.ts:6389`（metrics sampler） | 注释明写"不加并发限制是因为 bridge 数量被 `MAX_DAEMON_WORKSPACES` 兜住" | 每 5s 无上界 fan-out 100 个 RPC |

第二行值得单独强调：`daemon-status.ts:403-406` 在描述 `registeredWorkspaces` 时已经写下
**"Registration is not allocation, so this can exceed the live child count and is unsafe
to divide the pool by."** 而 `child-heap-policy.ts:117` 做的恰恰是拿注册上限去除 pool。
仓库自身的字段文档已经否决了这个用法。

此外 `maxTotalSessions` 默认按 `maxSessions(32) × workspaceCount` 推导
（`run-qwen-serve.ts:454-464`），100 workspace → 3200 session 许可，而 capacity doc 第
162 行已明确记录聚合内存上界（其 Part 4）尚未实现。

### 1.1 关键洞察

**"已注册的 workspace 数"和"同时吃内存的 workspace 数"是两个不同的量，而当前用同一个
常量表达。**

架构本身已经把两者分开了 —— runtime 架构文档第 298 行写明"注册 WorkspaceRuntime 本身
不启动 ACP child"，且 `channelIdleTimeoutMs` 默认解析为 0（`run-qwen-serve.ts:2302`），
在 bridge 里走的是**最后一个 lease 释放即刻 kill channel** 的分支
（`bridge.ts:3604-3609`）。也就是说 100 个已注册但空闲的 workspace 并不等于 100 个 node
子进程。

真正缺的是：**第二个轴上没有任何机制**，而第一个轴的常量被拿来当它的代理。

所以本方案的核心不是"放开 25"，而是**把被混用的轴拆开，给真正花钱的那个轴装上强制
准入**。放开注册上限是最后一步，不是第一步。

---

## 2. 目标与非目标

### 目标

1. 注册上限可配置，默认保持 25，硬上界 200。
2. 引入**强制**（enforce，非 observe）的并发活跃 ACP child 上限，带排队与超时。
3. 常驻开销与注册数解耦：冷 workspace 不持有定时器、watcher、bridge、service。
4. 所有 per-workspace fan-out 有并发上界。
5. daemon 启动时间不随注册数线性增长，且不阻塞 listen。
6. 先测量后定默认值。

### 非目标

- 多进程分片 / 集群。daemon 的价值在于共享进程内资源。
- 聚合字节账本（capacity doc Part 4、以及被它否决的 #8093 `ResourceBudget`）。本方案
  只提供**计数**与 gauge，不引入 byte ledger。
- 提高 per-workspace session 上限。
- 改变 primary workspace 的任何语义。
- 让 cold workspace 支持"完全无感知的透明恢复"——首次访问会付冷启动延迟，这是显式代价。

---

## 3. 三轴模型

整个方案的骨架。后续每一节各自对应一个轴。

| 轴 | 名称 | 花什么钱 | 现状 | 目标 |
| --- | --- | --- | --- | --- |
| **A** | registered — 持久化注册条目 | 磁盘 JSON + 路由表条目 | 25 硬编码 | `--max-workspaces`，默认 25，硬上界 200 |
| **B** | materialized — 主进程内 `WorkspaceRuntime` 对象 | bridge 闭包、service、fsFactory、定时器、fs.watch | = A，boot 期全量同步构造 | 懒物化 + idle 回收，`--max-materialized-workspaces` 默认 32 |
| **C** | live — 已启动的 ACP child | **真正的内存**（每个子进程一个 V8 堆） | 无上限，靠 A 间接兜 | `--max-live-workspace-children`，默认由 memory budget 推导，**enforce + 排队** |

不变式：`live ≤ materialized ≤ registered`。

---

## 4. 阶段顺序（顺序本身是设计的一部分）

Phase 4（放开 A）必须排在 Phase 2、3 之后。反序执行得到的是一个"启动更慢、超时更长、
内存无上界、且自身注释里的安全性论证已经失效"的 daemon。

```
Phase 0  测量基线              ── 无行为变化，先落
Phase 1  解耦常量              ── 纯重构，行为等价
Phase 2  轴 C：live child 准入  ── 内存安全的前提
Phase 3  轴 B：懒物化 + 回收    ── 常驻开销的前提（含最大的一次重构）
Phase 4  轴 A：放开注册上限     ── 到这里才允许 >25
Phase 5  fan-out 收敛 + 启动去阻塞
Phase 6  负载验证
```

---

## 5. Phase 0 — 测量基线

不做任何行为变更，只补可观测量。**Phase 2/3 的默认值必须由这一步的数据决定**，而不是
猜。这与 capacity doc 的立场一致："every limit chosen later should be calibrated
against its data rather than guessed"。

### 5.1 `GET /daemon/status` 补齐三轴计数

**先确认已有的部分。**`runtime.memory` 已经 publish 了两个轴
（`daemon-status.ts:407,417` 与 `:678,760`）：

| 已有字段 | 对应 | 语义 |
| --- | --- | --- |
| `registeredWorkspaces` | 轴 A | 所有非 removed entry，含 draining / 替换中 / blocked |
| `activeAcpChildren` | 轴 C（窄） | channel live 的 ACP child；**不含** dying channel、未 attach 的 reservation、channel worker、MCP 后代 |

所以 Phase 0 真正缺的只有**轴 B** 和高水位。落在同一个 `runtime.memory` 里：

```ts
materializedWorkspaces: number;        // 轴 B（新）
committedAcpChildren: number;          // 轴 C（宽，新）
materializedHighWater: number;         // 新
committedAcpChildrenHighWater: number; // 新
```

**`committedAcpChildren` 与既有 `activeAcpChildren` 必须并存，不能合并。**前者是
`ProcessRegistry.committedProcessCount`（`process-registry.ts:157`），把终止中的 child 与
已 reserve 未 attach 的 spawn 都算进来——因为它们的内存都在。后者刻意更窄。
`daemon-status.ts:412-416` 的字段文档已经预告了这个区别：

> Deliberately narrow — it also excludes channel workers, MCP descendants, and spawn
> reservations that have not attached, **so a later admission policy cannot mistake it
> for a process-tree count. Such a policy will additionally need an in-flight spawn
> count to admit without racing.**

Phase 2 的准入计数器用的正是宽的那个（§7.3）。把两者混为一谈会引入该注释警告的竞态。

聚合 RSS 不新增，复用已有的 `runtime.memory.children`（带 `sampled`，且 `sampled` 受
SSE/WS watcher 门控——无观察者时会掉到 0，读数时必须一起看）。

新字段全部 additive + optional，SDK 镜像同步，旧 daemon 对新客户端仍可解析。

### 5.2 启动耗时 breadcrumb

在 secondary runtime 构造处记录每个 workspace 的构造耗时与累计耗时，走 `daemonLog`
（不新增 telemetry 事件）。

### 5.3 交付物

N = 1 / 8 / 25 三档下的：daemon RSS、boot 到 listen 的耗时、fd 数、
`GET /workspaces` p99。**这份数据是 Phase 2 与 Phase 3 默认值的唯一依据。**

---

## 6. Phase 1 — 解耦常量（行为等价）

### 6.1 拆分 `channel-control-timeouts.ts`

`MAX_DAEMON_WORKSPACES` 迁出该文件（它与 channel control 超时是两件事），新建
`packages/acp-bridge/src/workspace-capacity.ts`：

```ts
export const DEFAULT_MAX_REGISTERED_WORKSPACES = 25;
export const MAX_REGISTERED_WORKSPACES_HARD_CAP = 200;
export const DEFAULT_MAX_MATERIALIZED_WORKSPACES = 32;
```

`workspace-inputs.ts:11` 的 `MAX_REGISTERED_WORKSPACES` 由模块常量改为从解析后的配置
读取（见 Phase 4）。

### 6.2 channel control 超时改为服务端播发

先厘清一个容易混淆的点：`CHANNEL_CONTROL_DEFAULT_TIMEOUT_MS` 约束的是 **channel
worker**（IM 适配器子进程，`channel-worker-supervisor.ts` 按 workspace spawn），
**不是 ACP child**。它的唯一消费者是 TS SDK 的客户端默认超时
（`DaemonClient.ts` 共 10 处引用，其中 9 处形如
`opts?.timeoutMs ?? CHANNEL_CONTROL_DEFAULT_TIMEOUT_MS`）。

所以正确的分母不是"注册的 workspace 数"，而是"**实际配置了 channel 插件的 workspace
数**"——绝大多数部署里是 0。

决策：

- 服务端在 channel control 的能力播发里新增
  `channelControlWorstCaseMs = 2 * workersConfigured * (STOP + STARTUP) + HEADROOM`，
  按当前实际 worker 数计算。
- SDK 默认超时 = 播发值（若存在）→ 否则回退到一个**固定**常量
  `CHANNEL_CONTROL_LEGACY_FALLBACK_MS = 2_130_000`（即今天 N=25 的字面值，保持对旧
  daemon 的行为不变），不再由任何 workspace 上限推导。
- 显式 `opts.timeoutMs` 语义不变。

这样放开轴 A 不再拉长任何客户端超时。

### 6.3 child heap policy 换分母

`child-heap-policy.ts:117` 的 `MAX_DAEMON_WORKSPACES` 替换为注入的
`maxLiveWorkspaceChildren`（轴 C）。这是语义纠正：该策略讨论的一直是**并发子进程
数**，从来不是注册数（见 §1 引用的 `daemon-status.ts` 字段文档）。

Phase 1 里 `maxLiveWorkspaceChildren` 默认取 25，使本阶段成为**真正的 no-op**；
Phase 2 才有意地改变它的默认值。文件头部关于"25 live children 时每次 channel
replacement 都记一次 refusal"的注释需要按新分母重写。

### 6.4 不在本阶段做

metrics sampler 的 fan-out 逻辑不动，只在注释里标注它依赖轴 C 而非轴 A；实际修复在
Phase 5。

---

## 7. Phase 2 — 轴 C：live child 准入（enforce）

这是让"上百个注册"在内存上安全的那一步。

### 7.1 准入缝

`packages/acp-bridge/src/spawnChannel.ts:464`：

```ts
const reservation = processRegistry.reserve();
...
options.childHeapPolicy?.decide(processRegistry.committedProcessCount);
```

`reserve()` 是进程创建的唯一入口，`decide()` 已经在这里做 observe-only 判定。准入放在
同一处，不新增 seam。capacity doc 也已认定这是必经之路："any enforceable live-child
budget requires admission at spawn time"。

### 7.2 新模块 `packages/acp-bridge/src/live-child-admission.ts`

```ts
createLiveChildAdmission({
  maxLiveChildren: number,        // 0 / Infinity = 不限
  queueDepth: number,             // 默认 64
  queueWaitMs: number,            // 默认 30_000
}): {
  acquire(kind: 'session' | 'swap' | 'background', signal?: AbortSignal):
    Promise<{ release(): void }>;
  snapshot(): { live, queued, admitted, refused, timedOut, highWater };
}
```

不直接复用 `createFifoTaskQueue`：capacity doc 明确指出它"has no waiting bound and no
timeout"，而这两者恰好是本处必需的。实现借用其 FIFO + `runUntilReleased` 形状，另加
深度与等待上限。

### 7.3 语义决策表

| 项 | 决策 |
| --- | --- |
| slot 获取时机 | `reserve()` 之前 |
| slot 释放时机 | child **真正 exit**（与 `committedProcessCount` 一致）。终止中的 child 仍占 slot——它的内存仍在 |
| channel swap | **独立单令牌豁免**，同一时刻只允许一个 swap 越过 cap。不采用 `cap + 1`：`child-heap-policy.ts:79-81` 已论证过"给比较留 swap headroom 等于用一个指标假象换真实超卖" |
| 排队溢出 | 深度满 → 立即 `503 workspace_child_admission_rejected` |
| 等待超时 | `503 workspace_child_admission_timeout`，retryable |
| preheat | **不排队**。满占用时直接返回 `ready:false, reason:'admission'`。它本就是 fire-and-forget，排队只会占着 slot 等一个没人在等的预热 |
| 优先级 | 单队列 FIFO，不做多级队列。避免优先级反转设计；若 Phase 6 测出交互请求被后台请求饿死，再按 kind 加权（届时有数据支撑） |

### 7.4 默认值

`maxLiveWorkspaceChildren` 默认沿用 child-heap-policy 已有算式
`min(floor(childPoolMb / MIN_CHILD_HEAP_MB), 25)`——但现在**强制执行**。
flag `--max-live-workspace-children`，`0` 关闭。

对小内存宿主这是行为变化（可能 < 25），方向是安全的一侧；对 ≥32GB 宿主默认与今天等价。

**调优张力（必须写入运维文档）：** slot 只在 child 退出时释放，而 `ensure` 的既有保活
窗口至少 10 分钟（runtime 架构文档 §8.3）。因此当 C 偏小且多个 workspace 各自持有长
保活窗口时，第 C+1 个 workspace 会稳定吃 503。这是正确且诚实的行为（快速失败 +
retryable，优于隐式超卖），但运维文档必须把"C 应 ≥ 预期并发活跃 workspace 数"写成显式
容量规则，而不是让使用者从 503 去猜。

### 7.5 与 `maxTotalSessions` 的关系

不动它。轴 C 约束的是子进程数，session 在子进程内多路复用。文档需要写清
`maxSessions` 是**公平性与 fd 杠杆，不是内存杠杆**（capacity doc 已有此结论）。

---

## 8. Phase 3 — 轴 B：懒物化与 runtime 回收

### 8.1 先消重：统一两条构造路径（独立 PR，必须先落）

现状是**两套近重复的 runtime 构造实现**：

- boot 期 secondary：`run-qwen-serve.ts:5909-6291`，约 380 行同步 `for` 循环
- 动态注册：`createDynamicWorkspaceRuntime`（`run-qwen-serve.ts:6544-7048`，约 500 行
  async 工厂），已被 `POST /workspaces` 使用，且是前者的**功能超集**（额外覆盖
  sub-session launcher、cleanup 注册、trust 快照复用）

动作：删除 boot 循环，改为

```ts
await createDynamicWorkspaceRuntime(cwd, {
  primary: false, removable, registrationIds, displayName,
  snapshot: bootTrustSnapshot,
});
```

必须逐字段 diff 的差异点（每一条都要有测试）：`bootTrustSnapshot` 复用 vs 重读、
`skipLoadEnvironment: true`、`displayName` / `registrationIds` 来源、
`contextFilenameForInit` 回退链、未受信 secondary 的 `daemonLog.warn`。

**本 PR 仍然 `await` 全部 secondary 再创建 registry**，只把同步构造换成 async 构造，
不改变"listen 前所有 workspace 已就绪"这一可观察行为。启动不阻塞是 Phase 5.3 的事，
两者不得混在一个 PR 里。

**这是全案最大的一块**（净删约 380 行核心生产代码），按仓库 `AGENTS.md` 属于
maintainer-initiated 的大范围核心重构，必须单独成 PR、单独评审，不与任何行为变更
混在一起。它同时也是 8.2/8.3 的前置——没有单一构造入口就没法谈懒物化。

### 8.2 `cold` 注册态

`WorkspaceEntry.state` 增加 `'cold'`：已注册、可路由、但尚未物化。**这是内部态**，
对外投影仍为 `active`（见 §10.3）。

随之而来的两个结构约束：

- `WorkspaceEntry.current`（现持有 `runtime` + `guard`）对 cold entry 为 `undefined`。
- **primary 永不为 cold。**`createWorkspaceRegistry` 已要求"至少一个 runtime、恰好一个
  primary"（`workspace-registry.ts:252-263`），且 `registry.primary` 返回非可空
  `WorkspaceRuntime` 并被大量调用点依赖。把 primary 钉死为已物化可以让这些调用点全部
  不变。

Registry 新增：

```ts
ensureMaterialized(entry: WorkspaceEntry): Promise<WorkspaceRuntime>;
```

内部调用 8.1 统一后的工厂，单飞（同一 entry 的并发调用共享同一 promise）。

**同步 getter 的处理**（关键约束）：现有 `getByWorkspaceCwd` / `getManagedBy*` 是同步
的，而物化是 async。不把它们改成 async（会波及大量调用点），而是：

- 返回 **runtime** 的同步 getter 对 cold entry 返回 `undefined`；返回 **entry** 的
  `getEntryBy*` / `listEntries` 照旧返回 cold entry。
- **路由不匹配的判定必须基于 entry，而不是 runtime 是否存在。**否则一个已注册但 cold
  的 workspace 会被答成 `400 workspace_mismatch`——一个错误且误导的结论。现有
  `respondWorkspaceMismatch`（`workspace-route-runtime.ts:336-344`）已经读
  `listEntries().length`，区分所需的信息已具备；但**每一个同步 runtime getter 的调用点
  都需要审一遍**，确认它把 `undefined` 当"未注册"还是"需要先物化"。这是本阶段
  最容易造成隐形回归的一步。
- 需要改造的入口（都已经是 async）：`POST /session`、workspace-qualified 路由的
  `resolve*`（`workspace-route-runtime.ts`）、SSE 订阅建立处。
- **不需要物化即可回答的请求走 entry 元数据**：`GET /workspaces` 列表、displayName、
  注册状态、rename、remove。这顺手消掉了列表接口触发全量物化的放大。

### 8.3 dematerialize（runtime 级回收）

**不新建 lease 体系。** runtime 架构文档第 271-350 行已有权威的
cold/starting/active/idle/stopping 五态机与物理 work lease；回收条件直接读它。

回收条件（全部满足）：

- bridge channel 处于 `cold`（无 channel、无在途启动）——即所有物理 work lease 已释放
- 无 live session、无 SSE 订阅者、无在途 operation
- 距上次使用 > `workspaceIdleTimeoutMs`，默认 `30 min`（与 session reaper 对齐）

动作：停 keepalive interval 与 fs.watch、释放 bridge / service / fsFactory /
clientMcpSenderRegistry、`entry.state = 'cold'`。**保留**持久化注册元数据与磁盘
transcript——与 session reaper 同样的"只释放内存态"原则。

admission 复用现有 `beginDrain` / `commitDrain` / `completeDrain` 的关门语义，新增
`beginDematerialize` 走同一个 gate，终态是 `cold` 而非 `removed`。

**单个** reaper 定时器扫描 entries（不是 per-workspace 定时器），`.unref()`。

### 8.4 物化上限与 LRU

`--max-materialized-workspaces` 默认 32。达到上限且需要物化新 workspace 时：

1. 按最久未使用顺序，强制 dematerialize 一个满足 8.3 条件的 entry；
2. 一个都不满足 → `503 workspace_materialization_limit`（retryable）。

**不驱逐有活跃工作的 workspace**——与 Phase 2 选择"排队而非驱逐"同一条原则。

### 8.5 收益

per-workspace 的定时器与 watcher 只在物化期间存在，常驻成本从 `O(注册数)` 降为
`O(物化数)`。

---

## 9. Phase 4 — 轴 A：放开注册上限

### 9.1 配置

`--max-workspaces <n>`，默认 `DEFAULT_MAX_REGISTERED_WORKSPACES = 25`，硬上界
`MAX_REGISTERED_WORKSPACES_HARD_CAP = 200`。

`workspace-registration-store.ts:21` 的 `MAX_SECONDARY_WORKSPACES = n - 1` 由模块常量
改为 store 构造参数。

### 9.2 注册文件尺寸

`MAX_STORE_BYTES = 256 * 1024`（`workspace-registration-store.ts:22`）在 200 条最坏
路径长度下会被突破：`MAX_WORKSPACE_PATH_LENGTH = 4096`
（`workspacePaths.ts:183`），仅路径部分 200 × 4096 ≈ 819 KiB，再加 256 字符
displayName 与 JSON 开销。

决策：改为按上限推导 `max(256 KiB, n * 1 KiB + 64 KiB)`。

### 9.3 降配不能让 daemon 起不来（必须显式设计）

store 是**跨进程持久化**的：用 `--max-workspaces 200` 写出的文件，在一个默认 25 的
进程里读取时，现有代码会**整体抛错**
（`workspace-registration-store.ts:222-226`），导致 daemon 拿不到任何注册。

决策：读取时不因超限整体失败，改为**截断保留前 n 条 + stderr 警告**。这与
`run-qwen-serve.ts:3835` 已有的"超限跳过并打日志"行为一致，也避免了"降一次配就起不来"
这个运维陷阱。

### 9.4 不改的

`proper-lockfile` 的 `retries: 120 / maxTimeout: 100`
（`workspace-registration-store.ts:24-35`）保持不变。注册是低频人工操作，不是热路径；
仅在文档中注明注册串行化。

---

## 10. Phase 5 — fan-out 收敛与启动去阻塞

### 10.1 metrics sampler

`run-qwen-serve.ts:6389-6397`：改为只遍历**已物化且 channel live** 的 workspace，并经
`createFifoTaskQueue(4)` 限并发。同时重写那段注释——它当前的安全性论证建立在
`MAX_DAEMON_WORKSPACES` 上，放开轴 A 后即失效。

### 10.2 extension generation reconciler

`routes/workspace-extensions.ts:829` 的 30s poller：`Promise.allSettled` 全量 fan-out
改为经同一队列（limit 4），且只覆盖已物化的 workspace。

### 10.3 启动只物化 primary

boot 期只物化 primary；显式 `--workspace` 与持久化恢复的条目一律注册为 `cold`。启动
时间与注册数解耦，同时消掉 boot 期的 `O(n)` 同步 `loadSettings`（它当前在事件循环上
阻塞）。

**对外契约的兼容决策**：不把 `cold` 暴露成新的 `state` 值——那会破坏按现有五态穷举的
旧客户端。cold entry 对外仍投影为 `active`（它可被路由、可接受请求，这个投影是诚实
的），另新增可选字段 `materialized: boolean` 供新客户端观测。

### 10.4 cron / scheduled task（本阶段唯一的真实行为回归）

现状每个受信 workspace 一个 `setInterval` + 一个 `fs.watch(cronDir)`
（`server.ts:3019-3031`、`scheduled-task-keepalive.ts:425,450`）。若 cold workspace 不再
持有它们，其定时任务将不再触发——**这是回归，不能接受**。

决策：把 per-workspace 的 watcher + interval 收敛为**一个全局 cron 扫描器**：

- 扫描所有已注册 workspace 的 cron 文件（纯 JSON 读，**不需要物化 runtime**）；
- 仅在命中到期任务时 `ensureMaterialized` 并 spawn。

一举同时解决 O(n) watcher 与 cold workspace 的定时任务可用性。

---

## 11. Phase 6 — 验证

### 11.1 单元测试

- 轴 C 准入：满占用排队、超时、深度溢出、swap 单令牌、release 在 exit 而非 kill 时机
- 轴 B：cold → materialized → cold 往返；LRU 驱逐跳过活跃 entry；物化上限 503
- store：超限截断 + 警告；尺寸推导
- SDK：播发超时优先于 fallback

### 11.2 负载测试

新增到 `integration-tests/`（已有 `vitest.loadtest.config.ts`）：

| 场景 | 断言 |
| --- | --- |
| N = 25 / 100 / 200 注册，boot 到 listen | 耗时与 N **不呈线性** |
| N = 100，全部 cold | RSS 相对 N=1 的增量有上界；fd 数不随 N 增长 |
| N = 100，C = 4，轮转发 prompt | 无 OOM、无死锁、排队公平、p99 有界 |
| N = 100，`GET /workspaces` | 不触发物化；p99 有界 |

### 11.3 E2E 计划

按仓库 `AGENTS.md` 在 `.qwen/e2e-tests/` 落测试计划，先对全局 `qwen` 跑基线。

---

## 12. 被否决的方案

**直接把 25 改成 200。** 见 §1：客户端超时 4×、堆分区模型允许 100 × 512MB 而不拒绝、
两处 fan-out 的安全性论证失效、启动时间线性增长。

**per-workspace 独立 daemon 进程 / 分片。** 隔离性最好，但 daemon 的价值恰恰是共享
进程内资源（settings、trust、path locks、process registry），且 fd 与总内存都更差。

**满占用时 LRU 驱逐 live child（而非排队）。** 会杀掉用户正在跑的 prompt。排队让请求
变慢，驱逐让工作丢失——两者不对等。轴 B 的 LRU 只驱逐**已 cold 的** runtime 对象，
不驱逐工作。

**新建一套 workspace 级 lease 来判断可回收。** runtime 架构文档已有权威的物理 work
lease 与五态机，且该文档明确"Coordinator 不建立第二套用于物理生命周期的可写逻辑
lease"。第二套 lease 只会产生两个可能不一致的真相源。

**进程级字节账本。** capacity doc 已详细否决 #8093 的 `ResourceBudget`（堆代理常数与
V8 无稳定关系、误差 2~5 倍、类别是全局而非 per-workspace）。本方案只做计数与准入。

**给 channel control 超时留 workspace 数余量。** 见 §6.2：分母本来就选错了，应该是
配置了 channel 插件的 workspace 数，而非注册数。

---

## 13. 风险

| 风险 | 缓解 |
| --- | --- |
| 8.1 的 380 行消重引入行为差异 | 独立 PR、逐字段 diff 清单（见 8.1）、每条差异一个测试、不混入任何行为变更 |
| cold workspace 首次访问的冷启动延迟被用户感知 | 已列为非目标并显式承认；`ensure` 的既有 ≥10 min 保活窗口覆盖连续使用 |
| 轴 C 排队在长 prompt 场景下饿死交互请求 | Phase 6 专项场景；若测出饿死，再按 kind 加权（届时有数据） |
| `materialized` 新字段被旧客户端忽略而误判容量 | additive + optional；cold 仍投影 `active`，旧客户端语义不变 |
| 降配后旧注册文件读不出来 | §9.3 截断 + 警告，不整体失败 |
| 全局 cron 扫描器读取上百个 workspace 的 cron 文件成为新热点 | 纯 JSON 读、无需物化；扫描间隔沿用现值；文件不存在即跳过 |

---

## 14. PR 拆解与依赖

| # | 内容 | 依赖 | 类型 |
| --- | --- | --- | --- |
| 1 | Phase 0 测量（status 字段 + boot breadcrumb） | — | feat，无行为变化 |
| 2 | Phase 1.1/1.3 常量迁移与换分母 | 1 | refactor，等价 |
| 3 | Phase 1.2 channel control 超时播发 + SDK 默认 | 2 | feat |
| 4 | Phase 2 live child 准入 | 2 | feat |
| 5 | **Phase 3.1 统一 runtime 构造路径（消重 380 行）** | — | refactor，核心大改 |
| 6 | Phase 3.2 cold 态 + `ensureMaterialized` | 5 | feat |
| 7 | Phase 3.3/3.4 dematerialize + LRU + 物化上限 | 6 | feat |
| 8 | Phase 5.4 全局 cron 扫描器 | 6 | refactor + feat |
| 9 | Phase 5.1/5.2/5.3 fan-out 限流 + 启动只物化 primary | 7, 8 | feat |
| 10 | Phase 4 放开注册上限 + store 尺寸/截断 | 9 | feat |
| 11 | Phase 6 负载测试与文档 | 10 | test + docs |

PR 5 与 PR 1~4 无依赖，可并行推进；但 PR 10（真正放开上限）必须排在最后。

---

## 15. 当前状态与未验证项

本文是**设计草案，尚未实现任何一个 PR**。以下事项需要在动工前补齐或注意：

1. **Phase 0 的测量还没做。** §5.3 的 N = 1 / 8 / 25 基线（RSS、boot 耗时、fd 数）是
   Phase 2 的 `maxLiveWorkspaceChildren` 默认值与 Phase 3 的物化上限默认值的**唯一
   依据**。在没有这份数据之前，文中出现的 `32`、`4`、`64`、`30_000` 等具体数字都属于
   待校准的占位值，不应直接实现。
2. **`--max-workspaces` 的硬上界 200 是设计取值，不是实测结论。** 它来自 §9.2 的注册
   文件尺寸推算，而非"200 个 workspace 已验证可用"。真实可用上界由宿主内存与轴 B/C
   的配置共同决定。
3. **§8.2 列出的"每一个同步 runtime getter 调用点都要审一遍"尚未逐点清点。** 这是本
   方案里最可能藏隐形回归的地方，实施 PR 6 时需要先产出完整的调用点清单。
4. 文中所有行号锚定基线 commit `be585888f8cf`。上游演进后需要重新核对，尤其是
   `run-qwen-serve.ts` 这种数千行的文件。
