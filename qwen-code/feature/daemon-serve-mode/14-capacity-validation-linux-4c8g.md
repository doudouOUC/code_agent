# daemon workspace 容量实测（Linux 4 vCPU / 8 GB）

> 口径：本文是对 [#11515](https://github.com/QwenLM/qwen-code/pull/11515)（2026-09-10 合入 `main`，默认注册上限 25→256）与 [#11428](https://github.com/QwenLM/qwen-code/pull/11428)（三个容量常量解耦）的**部署侧实测**，被测提交 `dfcf07accce71aa5ce596b8e4283e6e64a8c3e4c`、版本 0.23.2，在机器上现场构建。所有数字均为该主机实测，不是通用容量；结论区分「已实测 / 已推翻 / 未覆盖」三态。
> 起因：[#11386](https://github.com/QwenLM/qwen-code/issues/11386) 的设计文档 `docs/design/workspace-capacity-p1.md` §9 明确把 Linux、真实仓库、watcher/FD、真实负载列为未完成的部署证据；此前 P1 验证跑在 macOS 空目录上。
> 复现脚本与逐次原始数据：[`repros/daemon-capacity-linux-4c8g/`](../../../repros/daemon-capacity-linux-4c8g/)。
> 上游记录：#11386 评论区（容量验证 + 两次更正）、[#8182](https://github.com/QwenLM/qwen-code/issues/8182)（子进程堆授权）、[#11591](https://github.com/QwenLM/qwen-code/issues/11591)（git 状态开销，本次新开）。

---

## 1. 结论

**256 个注册 workspace 在 4 vCPU / 8 GB Linux 上很轻松；注册数不是约束，并发活跃 workspace 才是。**

| 维度 | 实测结论 |
| --- | --- |
| 空闲注册 | 每个 workspace 约 **200 KiB** RSS + **1 个 inotify watch**；FD 完全不增长 |
| 并发活跃 workspace | 每个约 **280 MiB**，线性；**16 并发是可站住的上限**（余 2.9 GB），24 并发也能全部完成但只剩 1.1 GB |
| 内核上限 | 远未触及：256 注册 + 8 子进程只用了 128 个 inotify 实例中的 9 个、58368 个 watch 中的 1110 个 |
| 启动/恢复 | 256 个 workspace 启动到全部就绪 1.3s；只传 1 个 `--workspace` 时从持久化 store 恢复 256 个耗时 2.19s |
| 泄漏 | 3 轮 register/remove churn 后 watch 从 257 完整回落到 2、FD 回到 31；20 分钟空闲观测各项持平 |

同时暴露两个**与本次容量改动无关的既有缺陷**：git 状态每次调用重做全量索引刷新（§6），以及子进程堆授权额度与模型严重不符（§5）。

---

## 2. 注册规模阶梯（无活跃子进程）

启动时用 N 个 `--workspace`，内存取 GC 后留存值。

| N | listener | 全部就绪 | 树 RSS | retained heap | FD | inotify 实例 | watch | `/capabilities` p50 | `/daemon/status?detail=full` p50 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 475 ms | 1785 ms | 175.3 MiB | 91.2 MiB | 32 | 1 | 2 | 2.4 ms | 66.0 ms |
| 25 | 543 ms | 854 ms | 194.4 MiB | 101.9 MiB | 32 | 1 | 26 | 2.6 ms | 67.3 ms |
| 64 | 559 ms | 1034 ms | 199.8 MiB | 106.4 MiB | 32 | 1 | 65 | 2.7 ms | 68.0 ms |
| 128 | 581 ms | 1118 ms | 209.4 MiB | 114.6 MiB | 32 | 1 | 129 | 2.9 ms | 69.8 ms |
| 256 | 633 ms | 1307 ms | 226.4 MiB | 129.7 MiB | 32 | 1 | 257 | 3.7 ms | 70.6 ms |

- 1→256 只多 **51 MiB RSS、38 MiB heap**，即每 workspace 约 200 KiB。
- **FD 恒定 31–32，与 N 无关**；注册完全不消耗 FD。
- **watch 是 N+1，且全部落在同一个 inotify 实例里。**
- `/capabilities` 在 256 时仍 < 4 ms，浏览完整 workspace 列表不会引发唤醒风暴。
- `/daemon/status?detail=full` 恒定 66–71 ms，与 N 无关——不是扩展性风险，但在任何规模下都比 `/capabilities` 慢两个数量级。

**与 macOS 基线的平台差异值得记一笔。** #11386 里的 macOS 基线记录 256 个 workspace 有 256 个 FSEVENTWRAP、Git 读取后 512 个、FD 277。Linux 上同样素材只用**一个 inotify 实例承载 N+1 个 watch，FD 始终 31–32**——macOS 上的 FD 增长在 Linux 不复现。内存则高度一致（macOS 256 时 214.1 MiB RSS / 118.92 MiB GC 后堆）。

空闲 CPU：256 个 workspace 下每 30 秒窗口为**单核的 0.20–0.25%（中位 0.23%）**，观测 20 分钟，覆盖了 `server.ts` 的 `KEEPALIVE_MAX_INTERVAL_MS = 10 * 60_000` 一个完整周期（此前 macOS 的 80 秒窗口做不到）。

---

## 3. 活跃 ACP 子进程（空闲初始化态）

256 注册，经 `POST /workspaces/:id/runtime/ensure` 拉起，最后一个 ensure 后 15s 采样。

| 活跃子进程 | 进程数 | 树 RSS | daemon RSS | FD | inotify 实例 | watch | MemAvailable |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | 1 | 232.6 MiB | 232.6 MiB | 31 | 1 | 257 | 6339 MiB |
| 2 | 3 | 613.9 | 238.1 | 81 | 3 | 472 | 6044 |
| 4 | 5 | 989.4 | 237.0 | 131 | 5 | 686 | 5796 |
| 6 | 7 | 1341.5 | 224.3 | 181 | 7 | 896 | 5489 |
| 8 | 9 | 1735.1 | 232.8 | 231 | 9 | 1110 | 5161 |

**每个空闲子进程边际成本：约 188 MiB RSS（刚拉起峰值约 222 MiB）、恰好 25 个 FD、恰好 1 个 inotify 实例、约 107 个 watch，`ensure` 约 1.0 秒。** daemon 本体恒定 224–238 MiB，增长全在子进程侧。与 macOS 上每个空闲 child 约 192 MiB 吻合。

两点值得记入 [`13-resource-budgeting.md`](13-resource-budgeting.md) 的观测面：

- **256 个 workspace 下启动预热只拉起 1 个子进程**（primary bridge），不是每 workspace 一个。已在生产默认下确认（不设 `VITEST_WORKER_ID`）。
- **拉起 8 个子进程成功且 `refusals: 0`**，超过模型报告的 `maxConcurrentChildren: 6`。`enforced: false` 下预期如此，但这说明 `maxTotalSessions: 800` 与 child heap 模型都不构成约束。

---

## 4. 真实模型负载并发阶梯

前三节的子进程都是「已初始化但空闲」。本节经 SDK（`DaemonClient` + `DaemonSessionClient`）驱动**真实 agent 回合**，真实 OpenAI 兼容端点，模型 `qwen3.8-flash`，全程 256 注册。两种负载形态：

- **light**：2 轮——列 `packages/cli/src/serve` 顶层 `.ts`、读 `workspace-inputs.ts`、5 条要点；再读 `routes/workspace-runtime.ts` 补 3 条。
- **heavy**：4 轮累积——全仓搜 `workspace`（7546 处匹配）、完整读 `daemon-status.ts`（60K）、`gitDiff.ts`（60K）、`settingsSchema.ts`（176K），最后跨文件综合。约 296K 文本进上下文，是 light 的 4 倍。

| 并发 | light 峰值 | light 每并发 | heavy 峰值 | heavy 每并发 | 最低 MemAvailable（light） |
| --- | --- | --- | --- | --- | --- |
| 1 | 515.6 MiB | 268 MiB | — | — | 6128 MiB |
| 2 | 769.7 | 261 | — | — | 5858 |
| 4 | 1418.7 | 293 | 1439.6 MiB | 298 MiB | 5411 |
| 6 | 1999.0 | 292 | — | — | 4933 |
| 8 | 2677.6 | 304 | 2552.9 | 288 | 4423 |
| 12 | 3582.6 | 278 | 3822.0 | 298 | 3743 |
| 16 | 4671.7 | 277 | — | — | **2923** |
| 24 | **6969.0** | 280 | — | — | **1157** |

light 共 73 会话 / **146 回合全部完成**，heavy 三档共 **96 回合全部完成**；零 `prompt_cancelled`、零 OOM、每个 daemon 均 exit 0。

**关键结论：每并发成本对上下文规模不敏感。** light 区间 278–304 MiB，heavy 288–298 MiB，两者重叠，并发 8 时 heavy 反而更低。事后看这是算术：296K 累积文本相对底线约 190 MiB 的 Node 进程微不足道。**内存驱动因素是进程数，不是上下文深度**——该为「增加进程或缓冲」的因素（MCP 服务、浏览器自动化、终端、被保留的大块工具输出）缩放这个数值，而不是为对话长度。

heavy 真正改变的是两件事：**延迟**（末轮综合达 307s，light 第二轮约 39s；按响应性做规划应参考 heavy）与 **daemon 侧事件量**（相同并发下 `session_update` 从 5641/10858/16708 升到 22156/48572/79096，其中一部分只是轮数翻倍，按每轮计仍约 2 倍；daemon RSS 随之从 253–290 MiB 升到 277–307 MiB）。

延迟随并发退化但**非单调**：light 轮 1 从并发 1 到 16 由 40s 升到 143s，并发 24 反而回落到 121s。全程主机 CPU 近乎空闲（loadavg 0.2–0.7），且对同一端点做 12 路并发裸 `curl` 耗时 2.2–11.1s——波动主要来自模型侧，而非 daemon 或主机。

### 4.1 一个必须知道的行为：未应答的授权请求会让回合无限期挂起

第一次跑这组阶梯时，并发 4 有 3 个、并发 6 有 1 个「失败」，全是客户端 240s 超时且 CPU 空闲，我一度误判为端点限流。事件流给出真正原因：`permission_request` 次数与失败数**一一对应**。模型选择用 `run_shell_command`（`ls -1 ... | xargs -n1 basename`）列文件，该工具需要确认；无人应答，回合便一直等待。改为以 `proceed_once` 应答后（整组 14 次批准）所有档位通过。

这属于预期的人在环路行为，不是缺陷。但对容量测试是致命陷阱：**没有授权应答器测出来的「上限」，量到的是挂起而不是极限**；模型对工具的选择存在变化，这也解释了失败数为何看起来非单调。

---

## 5. 子进程堆授权与模型严重不符（#8182 补充证据）

采集时顺手读了子进程的 `/proc/<pid>/cmdline`，发现**8 个子进程全部带 `--max-old-space-size=16384`**——在一台 7265 MiB、无 swap 的机器上，每个子进程被授权 16 GiB 堆（整机的 2.25 倍）。

根因在机器上直接复现：`getAcpMemoryArgs`（`packages/acp-bridge/src/spawnChannel.ts`）把任何 `constrainedMemory() > 0` 当权威值，而本机 `process.constrainedMemory()` 返回 **18446744073709552000（2^64 哨兵值）**，于是 totalMB 被算成 17,592,186,044,416，`min(…, 16384)` 落到 16384；又因 `16384 > currentLimitMB(2096)` 而真的下发。

cgroup 受限档进一步把图补完整（`systemd-run --scope -p MemoryMax=<L>`，各拉 2 个子进程）：

| MemoryMax | `constrainedMemory()` | 实际下发参数 | status 探测 | 模型 perChild × 并发 | 2 个子进程合计授权 |
| --- | --- | --- | --- | --- | --- |
| 无限制 | **2^64 哨兵值** | `16384` | 7265 / `host` | 544 MB × 6 | 32.0 GB / 7.1 GB |
| 2G | 2147483648（正确） | **不下发**，继承约 1048 MB | 2048 / `constrained` | 768 MB × **1** | 2.1 GB / 2 GB |
| 4G | 4294967296（正确） | **不下发**，继承约 2096 MB | 4096 / `constrained` | 597 MB × 3 | 4.2 GB / 4 GB |
| 6G | 6442450944（正确） | `3072` | 6144 / `constrained` | 553 MB × 5 | 6.1 GB / 6 GB |

三点结论：

1. **只要真的设了限额，`constrainedMemory()` 就是正确的**——哨兵值只出现在「无限制」情形，那一半可窄范围修复（`detectAvailableMemoryMb` 已经拒绝哨兵值）。
2. **约 6 GB 以下参数会被整个丢弃**，因为 Node 默认堆本就约为 cgroup 限额的 51%，而 `targetMB > currentLimitMB` 这个守卫只会抬高。于是「50% 可用内存」策略**恰恰在运维真的设了限额的场景中从未生效**，子进程还拿到比策略意图更多的额度。只修哨兵值碰不到这一半。
3. **每种情形的实际授权都超出 daemon 自身模型 1.4–30 倍**，且准入不看模型：`MemoryMax=2G` 时状态接口报 `maxConcurrentChildren: 1`，daemon 仍接纳了 2 个。

注意：`packages/acp-bridge/src/daemon-memory-budget.ts` 已在注释里记录了这处分歧并刻意推迟对齐，但把它限定为 **cgroup v1**。本机是 cgroup v2 统一层级、无 v1 controller、非容器、`memory.max = max`，仍然命中——所以这条路径不是 v1 独有的边缘情况。（也需诚实指出：#8182 正文里那台 3.4 GB Linux 机器算出的是 `target 1747`，**并未**命中哨兵值，故该行为与内核/libuv/cgroup 布局相关，并非普适。）

---

## 6. git 状态每次调用重做全量索引刷新（#11591）

预热 256 个 workspace 的 `GET /workspaces/:id/git?wait=1` 花了 **265 秒**，每次恒定约 1039ms；而同一仓库在索引被持久化后裸 `git status` 只需约 20ms。

`getGitWorkingTreeStatus`（`packages/core/src/utils/gitDiff.ts`）执行的是 `git --no-optional-locks status --porcelain=v1 --branch -z`。**`--no-optional-locks` 禁止 git 写回刷新后的索引，因此刷新每次都要重做、永不摊销。**

| 测量（同一 7952 文件仓库） | 耗时 |
| --- | --- |
| 只被 daemon 读过的仓库，连续三次 | **1.01 / 1.04 / 1.02 s** |
| 执行一次普通 `git status`（写回索引）后，同样三次 | **0.01 / 0.02 / 0.01 s** |
| 真实 `git clone --no-hardlinks` 上连续三次 | **0.62 / 0.62 / 0.61 s** |
| 该 clone 在一次普通 `git status`（0.62s）后 | **0.02 / 0.01 s** |

256 规模下的全量扫描：索引从未持久化时 **264.9s**（p50 1039ms），每仓库跑过一次普通 `git status` 后 **6.2s**（p50 24.1ms）——**43 倍**。`/capabilities` 在三种状态下均不受影响（3.7–4.1ms）。

真实 clone 也复现（0.62s/次），所以不是硬链接夹具的假象：**任何只被 daemon 读取的仓库都会长期为每次状态查询付这份开销。**

溯源：该函数与该标志由 [#7054](https://github.com/QwenLM/qwen-code/pull/7054)（2026-07-18）引入，比容量改动早近两个月，**不是回归**；#11515 提高默认上限只是让它在规模下显现。

### 6.1 超时会静默返回与工作树矛盾的 200

`runGit` 用 `catch { return null }` 吞掉 5 秒超时（`GIT_TIMEOUT_MS = 5000`），`getGitWorkingTreeStatus` 因此返回 `null` 而不抛错，`startRefresh` 的 `if (!status) return;` 保留缓存且不发布事件——对调用方和日志都不可观测。用只延迟 `status` 的 git shim 实测：

| 步骤 | HTTP | 耗时 | `untracked` | `computedAt` | 工作树实况 |
| --- | --- | --- | --- | --- | --- |
| 1 快 git、干净 | 200 | 32 ms | 0 | …561665 | 干净 ✓ |
| 2 快 git、新增一文件 | 200 | 27 ms | 1 | …561692（前进） | 脏 ✓ |
| 3 慢 git、已删除该文件 | 200 | **5004 ms** | **1** | …561692（**冻结**） | **干净 ✗** |
| 4 慢 git、重复 | 200 | 5005 ms | **1** | …561692（**冻结**） | **干净 ✗** |
| 5 恢复快 git | 200 | 31 ms | 0 | …571733（前进） | 干净 ✓ |

步骤 3、4 以 **200** 报告「工作树有改动」而实际干净，无错误字段、无日志行，只要 git 一直慢就一直如此。若该 workspace 从未成功计算过，则返回只含 `{v, workspaceCwd, branch}`、**连 `computedAt` 都没有**。

最锐利的表述来自项目自己的设计文档 `docs/design/2026-07-24-webshell-git-status-fast-path.md`，相隔 5 行的两句话在失败时相撞：`:80` 写明「计算失败/非 git 目录 → 保留旧缓存，不推送」是**有意设计**；`:84` 写明「`wait: true` 调用方总是拿到新鲜计算」。失败时后者静默落空，且没有任何字段能区分「新鲜」与「保留」。**所以缺口不在缓存保留旧数据，而在 `wait=1` 无法分辨。**

CI triage 同时指出：方向上若想给 `wait=1` 加 TTL，等于重开上述「无 TTL」契约；若想去掉 `--no-optional-locks`，等于让只读轮询去写用户索引，牵入 `resolveCommonGitDir` 已在防御的恶意仓库威胁模型。两者都需维护者定调。

---

## 7. 4 vCPU / 8 GB 容量建议

- **注册**：256 安全。daemon 预算约 230 MiB（256 个真实仓库注册且空闲），边际约 200 KiB/workspace。
- **并发活跃 workspace 先触顶**，每个约 280 MiB 且线性，跨 4 倍上下文形态成立：
  - **16 并发可站住**——峰值 4672 MiB，余 2923 MiB。
  - **24 并发也全部完成**，但只剩 1157 MiB。无 swap 的机器不该在这个水位运行，再上一档很可能 OOM。
  - 按响应性规划时用 heavy 的数字：末轮综合可达 307s。
- **此结论取代了我最初「先 2 个并发、验证后到 4 个」的建议**——那是在没有任何真实负载数据时给的，对这类负载保守了 4–8 倍。两版都已在 #11386 评论区更正留痕。
- 内核上限不构成约束：daemon 占 1 个 inotify 实例、每个子进程恰好 1 个，实例要到约 127 个并发子进程才耗尽，内存远早于此触顶。

---

## 8. 未覆盖

- **启用的 channel 与用户 cron 事务**：需要 provider 凭据，本机没有。daemon 自身 keepalive 周期已由空闲观测覆盖。
- **Web Shell / SSE / Web Terminal**：全程 `--no-web`。
- **MCP 服务、浏览器自动化、终端、编译与测试运行**——也正是 §4 修正后的免责说明所指向的、真正会推高每 workspace 成本的方向。
- **cgroup 受限下的完整 sweep**：受限档只测了内存预算与子进程授权路径（各 2 个子进程），注册阶梯、churn、空闲观测都是无限制下跑的。
- **深历史仓库**：素材仓库只有 2 个提交。
- **多小时稳定性**：最长连续运行 19.9 分钟。
- 工具授权由程序自动批准，而非人工应答；两种负载形态都用 `qwen3.8-flash`。
