# daemon workspace 容量验证（Linux 4 vCPU / 8 GB）

对 [#11515](https://github.com/QwenLM/qwen-code/pull/11515)（默认注册上限 256）在真实 Linux 机器、真实 Git 仓库、真实模型负载下的容量实测。结论与分析见
[`../../qwen-code/feature/daemon-serve-mode/14-capacity-validation-linux-4c8g.md`](../../qwen-code/feature/daemon-serve-mode/14-capacity-validation-linux-4c8g.md)。

这批脚本是补 [#11386](https://github.com/QwenLM/qwen-code/issues/11386) 设计文档 §9 遗留的部署证据时写的——此前的 P1 验证跑在 macOS 空目录上，明确未覆盖 Linux、真实仓库、watcher/FD 与真实负载。

## 环境

| 项 | 值 |
| --- | --- |
| 主机 | 阿里云 ECS，AMD EPYC，4 vCPU，7265 MiB，**无 swap** |
| 系统 | Ubuntu 26.04 LTS，内核 7.0.0-29-generic，无容器限制 |
| Node | v22.23.2（官方 tarball） |
| 被测提交 | `dfcf07accce71aa5ce596b8e4283e6e64a8c3e4c`（#11515 合并提交），版本 0.23.2 |
| 内核上限 | `fs.inotify.max_user_instances=128`，`max_user_watches=58368`，`ulimit -n=65535` |

## 脚本

| 脚本 | 用途 |
| --- | --- |
| `scripts/make-repos.sh` | 造 257 个**真实** Git 仓库：以 qwen-code 源码树为工作树（7952 个跟踪文件 / 201 MiB / 16 分支 / 5 标签），用 `cp -al` 硬链接复制，让 257 份副本在 40G 盘上可行 |
| `scripts/harness.mjs` | 主采集器，6 个 phase：`ladder`（注册规模阶梯）、`children`（固定活跃子进程）、`preheat`（生产默认预热）、`restore`（持久化重启恢复）、`churn`（反复注册/移除）、`soak`（空闲观测） |
| `scripts/load-probe.mjs` | 真实模型负载并发阶梯，经 SDK（`DaemonClient` + `DaemonSessionClient`）驱动真实会话；`--profile light\|heavy` 切换负载形态 |
| `scripts/slowgit-probe.mjs` | 用只延迟 `status` 的 git shim 触发 5s 超时，观察路由返回形状 |
| `scripts/stale-probe.mjs` | 同上，但先成功计算再超时，并在两次调用之间改动工作树，验证是否返回过期数据 |

## 采集口径

- 每次运行独立 fixture：隔离 `QWEN_HOME`、runtime dir、OS-home override、trust 文件、`TMPDIR`、cache，关闭遥测，per-run bearer token；跑完删除 fixture。
- `/proc` 读整棵进程树：`VmRSS`、`VmSize`、`Threads`、FD 数与分类、**inotify 实例数**（`anon_inode:inotify`）与 **watch 数**（`fdinfo` 里的 `inotify wd:` 行）。
- 经 inspector 协议取 V8 heap / CPU / active handles，并在末次采样前强制 `HeapProfiler.collectGarbage` 得到 retained heap。
- 除真实负载阶梯外，所有运行都把 provider 指向本地返回 503 的服务，并断言从未被调用（`modelRequests: 0`）。
- 退出检查：SIGTERM 后 exit 0、端口释放、无残留后代进程。

## 跑法

```bash
# 一次性：造素材（257 个真实仓库，硬链接，约 37s）
./scripts/make-repos.sh 257

# 注册规模阶梯
node scripts/harness.mjs --phase ladder --counts 1,25,64,128,256 --label ladder

# 固定活跃子进程（0/2/4/6/8）
node scripts/harness.mjs --phase children --counts 256 --children 0,2,4,6,8 --label children

# 生产默认预热 / 重启恢复 / churn / 空闲观测
node scripts/harness.mjs --phase preheat --counts 256 --label preheat
node scripts/harness.mjs --phase restore --counts 256 --label restore
node scripts/harness.mjs --phase churn   --counts 256 --cycles 3 --label churn
node scripts/harness.mjs --phase soak    --counts 256 --duration 660 --label soak

# cgroup 受限（验证子进程堆授权，见 #8182）
systemd-run --scope --quiet -p MemoryMax=2G -p MemorySwapMax=0 \
  node scripts/harness.mjs --phase children --counts 2 --children 2 --label cg-2G

# 真实模型负载（需要 OpenAI 兼容端点；key 只经环境变量注入）
export CAP_BASE_URL=... CAP_API_KEY=...
node scripts/load-probe.mjs --registered 256 --concurrency 1,2,4,6,8,12,16,24 --profile light
node scripts/load-probe.mjs --registered 256 --concurrency 4,8,12 --profile heavy --prompt-timeout 600000

# git 超时行为
node scripts/slowgit-probe.mjs
node scripts/stale-probe.mjs
```

## 数据

`data/` 下 55 个 JSON，是全部运行的逐次记录与汇总。命名规则：

- `ladder-*` / `children-*` / `preheat-*` / `restore-*` / `churn-*` / `soak-*` — 主 sweep，共 18 次 daemon 启动
- `cgroup-2G/4G/6G.json` — cgroup 受限下的子进程堆授权
- `load-r256-c*.json` / `load-heavy-r256-c*.json` — 真实负载轻/重两种形态的并发阶梯
- `probe-timeout-summary.json` / `probe-stale-summary.json` — git 超时行为

三个已废弃、**未被引用**的记录：`children-n1-a2.json`、`cgroup-2G-summary.json`、`cgroup-6G-summary.json`。它们是第一次 cgroup 尝试，我把 `--children 2` 配了 `--counts 1`，于是访问了不存在的 workspace 下标——是采集脚本的 bug，不是产品问题；正式数字来自 `--counts 2` 的重跑。

`load-summary-r256.json` 被 12/16/24 那次调用覆盖过，只剩这三档；八档完整数据在各自的 `load-r256-c*.json` 里。

## 关于凭据

真实负载需要模型端点与 key。key 全程只经环境变量注入：fixture 的 `settings.json` 只写 `envKey` 名称、不含 key 本身，`data/` 与本目录经检索确认 **0 次**出现 key 或端点域名——脱敏路径甚至没触发过，因为 daemon 两者都不记录。复跑时自备端点即可。
