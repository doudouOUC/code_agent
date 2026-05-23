# Qwen Code OOM 自助诊断工具

用来回答**用户自己**："我的 OOM 是哪种类型？升级 v0.16.0 能修吗？需要换什么 workaround？"

不需要改动 qwen-code 源码——通过 `NODE_OPTIONS=--require` 注入一个内存采样脚本，记录到本地文件。崩溃后跑 `analyze.cjs` 出诊断结论。

## 快速开始

```bash
# 1) 下载这两个脚本到本地任意位置（例如 ~/oom-diag/）
mkdir -p ~/oom-diag
curl -o ~/oom-diag/monitor.cjs https://raw.githubusercontent.com/doudouOUC/code_agent/main/repros/oom-user-diagnostic/monitor.cjs
curl -o ~/oom-diag/analyze.cjs https://raw.githubusercontent.com/doudouOUC/code_agent/main/repros/oom-user-diagnostic/analyze.cjs

# 2) 用注入了监控的方式启动 qwen
NODE_OPTIONS="--require $HOME/oom-diag/monitor.cjs" qwen

# 3) 正常工作直到崩溃
#    (启动时会打印一行 "[oom-diag] monitoring qwen pid=...")
#    数据写到 ~/.qwen/oom-diag/memory-<pid>-<时间戳>.log

# 4) 崩溃后跑分析
node ~/oom-diag/analyze.cjs ~/.qwen/oom-diag/memory-*.log
```

PowerShell（Windows）：

```powershell
$env:NODE_OPTIONS = "--require $HOME\oom-diag\monitor.cjs"
qwen
```

## 它做什么

注入到 qwen 进程后：

- **每 5 秒采样一次** `process.memoryUsage()` + `v8.getHeapStatistics().heap_size_limit`
- 写入 CSV 文件 `~/.qwen/oom-diag/memory-<pid>-<时间戳>.log`
- 退出时再采一次（包含 OOM 崩溃前最后一个样本）

记录的字段：

| 字段 | 含义 |
|------|------|
| `iso_time` | 时间戳 |
| `uptime_sec` | 进程已运行秒数 |
| `heap_used_mb` | V8 JS 堆已用 |
| `heap_total_mb` | V8 JS 堆已分配 |
| `heap_limit_mb` | V8 堆上限（默认 ~2-4GB，被 `--max-old-space-size` 影响） |
| `external_mb` | V8 追踪的 native 内存（主要 ArrayBuffer） |
| `array_buffers_mb` | ArrayBuffer 单独追踪 |
| `rss_mb` | **整个进程驻留内存（含 native socket、TLS 缓冲等）** |
| `heap_pct_of_limit` | 堆已用占上限的百分比 |

## 崩溃前抓 heap snapshot（可选但推荐）

在 OOM 前几分钟（堆达到 70% 左右）：

```bash
# 找到 qwen 的 PID
ps aux | grep qwen | grep -v grep

# 触发 heap snapshot
kill -USR2 <pid>

# 文件落地在 ~/.qwen/oom-diag/heap-<pid>-<ts>.heapsnapshot
# 可以拖到 Chrome DevTools 的 Memory 面板分析（看哪些对象 retained size 最大）
```

Windows 没有 `kill -USR2`，但可以用 Node 内置的 `inspector`（更复杂）或 PowerShell + WMI 实现等价信号——暂时跳过。

## 分析输出

跑 `analyze.cjs` 后会得到类似：

```
=== OOM Diagnostic Summary ===
Samples:           1200
Duration:          5994s (99.9min)
Heap limit:        6000 MB

Memory growth (delta first → last sample, post any GC):
  heap_used:       12.3 MB  (0.12 MB/min)
  external:         8.1 MB  (0.08 MB/min)
  rss:           5102.4 MB  (51.06 MB/min)

Final heap usage:  124.5 MB (2.1% of limit)

=== Heuristic classification ===
⚠️ Pattern: RSS grows but heap is flat. Native (non-V8) memory leak.
   → Likely Scenario B-TLS (streaming HTTPS resource not released).
   → V0.16.0 does NOT fix this. Workaround: avoid long sessions, restart periodically.
   → Heap snapshot may not show much (leak is in native socket pool).
   → See: https://github.com/doudouOUC/code_agent/blob/main/docs/investigation-oom-series.md

Time to OOM (estimated, assuming linear growth):
  via rss: ~80 min (rate 51.1 MB/min, est ceiling 9000 MB)
```

工具会根据 `heap_used` / `external` / `rss` 三者的增长模式做启发式分类：

| 增长模式 | 推断分类 | 怎么办 |
|---------|---------|--------|
| `heap_used` 增长，其他基本不变 | **Scenario A**（structuredClone 累积） | **升级 v0.16.0**（PR #4286 已修） |
| `rss` 增长但 `heap_used` 平稳 | **Scenario B-TLS**（native socket 泄漏） | **v0.16.0 不修这条**，临时方案：定期重启 |
| `heap_used` 和 `external` 都涨 | 多种泄漏混合 | 抓 heap snapshot 分析 retained size |
| 周期性 3-5x heap spike | **Scenario C**（压缩窗口期峰值） | v0.16.0 间接缓解（A 修了，C 峰值降低） |
| 增长非常慢 / 没明显增长 | 不是文档里已识别的泄漏 | 可能是别的问题，建议把日志发到 issue |

## 隐私说明

监控脚本**只采样进程的内存数字**，**不读取 qwen 的会话内容、不读 history、不读 token**。日志只包含数字和时间戳，可以放心分享到 GitHub issue。

如果想看里面有什么：

```bash
head -3 ~/.qwen/oom-diag/memory-*.log
# iso_time,uptime_sec,heap_used_mb,heap_total_mb,heap_limit_mb,external_mb,array_buffers_mb,rss_mb,heap_pct_of_limit
# 2026-05-23T10:00:00.000Z,0,4.9,7.0,4096.0,2.5,0.1,57.8,0.1
# 2026-05-23T10:00:05.000Z,5,8.2,12.5,4096.0,3.6,0.4,68.5,0.2
```

只有数字。

## 故障排除

**没看到日志文件？**

检查 `[oom-diag] monitoring qwen pid=...` 这一行有没有出现在 qwen 启动时的 stderr。没有的话说明 `NODE_OPTIONS=--require` 没生效——通常因为路径写错（必须**绝对路径**）。

**Windows 路径**：

```powershell
# 用反斜杠 + 双引号
$env:NODE_OPTIONS = "--require C:\Users\YOU\oom-diag\monitor.cjs"
qwen
```

**qwen 启动慢了？**

监控脚本每 5 秒采一次内存，开销极小（<1 KB/sample）。慢的话更可能是其他原因。

**`heap_limit_mb` 显示 4096 但我没设过 `--max-old-space-size`？**

Node.js 22+ 在 64-bit 系统上的默认堆约 4 GB（旧版本是 ~2GB）。如果你想加大：

```bash
NODE_OPTIONS="--max-old-space-size=8192 --require $HOME/oom-diag/monitor.cjs" qwen
```

## 把结果发到 issue

崩溃后建议把以下内容粘贴到对应 GitHub issue（[#4116](https://github.com/QwenLM/qwen-code/issues/4116) 等）：

```
1. /about 输出（qwen-code 版本、Node 版本、模型）
2. analyze.cjs 的完整输出
3. 崩溃时的 native stack trace（在 qwen 控制台最后一段）
4. （可选）heap snapshot 文件（注意：可能 100+ MB，建议上传到云盘后给链接）
```

这能让维护者直接定位是哪一类 OOM。

## 链接

- 完整 OOM 调研：[`docs/investigation-oom-series.md`](../../docs/investigation-oom-series.md)
- 假设验证 repro（开发者侧）：[`../oom-streaming-leak/`](../oom-streaming-leak/)
- 相关 issue：[#4116](https://github.com/QwenLM/qwen-code/issues/4116)、[#4167](https://github.com/QwenLM/qwen-code/issues/4167)、[#4315](https://github.com/QwenLM/qwen-code/issues/4315)、[#4322](https://github.com/QwenLM/qwen-code/issues/4322)、[#2868](https://github.com/QwenLM/qwen-code/issues/2868)
