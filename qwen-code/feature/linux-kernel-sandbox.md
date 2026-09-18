# Linux bwrap 内核沙箱技术方案

> 适用代码库：`QwenLM/qwen-code`。
> 当前口径：#11614 已合入 whole-CLI bwrap backend；#11981、#12064、#12067 仍为 open，分别是当前真实 Linux CI follow-up、工具级迁移总体 draft 与第一拆分 foundation，不能写成 `main` 已具备工具级沙箱。

## 1. 已合入基线：whole-CLI bwrap（#11614）

Linux 在 Docker/Podman 不可用时可显式选择 `bwrap`。启动前以最小 `--ro-bind / / --dev /dev --die-with-parent -- true` 探针确认二进制、user namespace 与 LSM policy 真正允许约束；显式请求失败会非零退出，不静默回到 unconfined。Docker/Podman 仍走 image/container 路径，bwrap/Seatbelt 属于 in-place backend。

`resolveBwrapWritableRoots()` 规范化 cwd、系统 temp/cache、Qwen 状态目录、显式 include 与 Git 元数据。HOME 及其祖先不能成为可写根；ambient `GIT_DIR` 等 selector 不被信任。普通 checkout 必须匹配真实 `.git`，linked worktree 必须在 common dir 有 registration 且 `gitdir` 反向指针匹配，避免仓库伪造外部写授权。

workspace `.env`/`settings.env` 不能设置 backend/image/network/proxy 或把 HOME 伪装成 temp/cache。operator environment 与用户级 `.env` 是可信输入，但后者在 sandbox 内重新只读 bind。非法 network mode、HOME 内仓库 include 或探针失败均 fail closed。

实际 hop 使用宿主根只读 bind、最小 `/dev` 与逐 root 可写 bind。closed network 通过 `--unshare-net`；open/proxied 仍保留 host network，proxied 不是 direct-connect 防火墙。该实现刻意不创建 PID namespace，并保留宿主 `/tmp`，因此 filesystem `full` 不代表 Unix socket、凭据、进程或宿主服务完全隔离。

`qwen sandbox` 可 inspect backend/root/network，`--verify` 检查 workspace 写、越界 EROFS、host PID 可见性和 network namespace，`-- <command>` 在相同边界透传 stdio/exit code。完整实现见 [[qwen-code/weekly-report/2026-09-07_2026-09-13/implementations/pr-11614|PR #11614 最终实现]]。

## 2. 真实 Linux CI follow-up（#11981 当前 open draft）

#11981 为 merged backend 增加独立 Ubuntu 22.04 workflow 和显式 `test:integration:sandbox:bwrap`。普通 integration suite 排除 Linux-only 测试；显式命令缺少 bwrap/namespace 前置条件时必须失败，不能 skip 后假绿。

当前 14 项用例覆盖真实 workspace/越界写、open/closed 网络、linked-worktree commit、missing backend、direct/proxied fake-model Shell、跨边界 writer lease，以及 SIGINT/SIGTERM 对 payload、descendant/proxy 的清理。它是测试覆盖，不改变生产路径。当前 GitHub classify、lint/static 与 Ubuntu test 仍失败，hosted x64 尚不能作为通过证据。

## 3. 工具级迁移总体方案（#12064 当前 open draft）

whole-CLI 方案把模型通信、认证、审批和 session state 与工具命令放进同一边界；仅包装 Shell 又会漏掉 Write/Edit 等直接副作用。#12064 的总体 draft 将约束移动到命令执行和文件 worker，可信控制面留在 host。

operator-only `tools.executionSandbox` 要求显式 filesystem `read-only|workspace-write` 与 command network `open|closed`，backend 为 `auto|bwrap`。User/System 可配置，Workspace/project env/bare/safe/嵌套 agent 不能放宽。旧 bwrap selector 给迁移错误；backend 不可用、设置损坏或 unsupported integrations 在副作用前 fail closed。

draft 覆盖 ordinary headless、Ink/OpenTUI `!`、prompt interpolation、Monitor、Read/Write/Edit 和部分同 workspace Agent/Code Mode；ACP/serve/web terminal、hooks/MCP/LSP、技能准备、Omni 等未适配路径被拒绝或禁用。它同时包含 x64/ARM64 public/runtime/adapter acceptance，但 148 文件总体改动正在拆分，不能作为当前产品契约。

## 4. 第一拆分：execution foundation（#12067 当前 open）

#12067 只抽取内部执行底座，不开放 runtime policy、公开设置或 tool routing：

- `ShellExecutionService.executeLaunch` 接收绝对 executable/cwd、字面量 argv、精确 snapshot env 与可选 binary stdin；pipe 在 stdio close 或 child exit 后最多 1 秒 drain 中先到者结算，PTY spawn 后失败不得通过另一 transport 重放。
- bwrap relay 用 payload 不继承的 status FD 和受保护 control file 记录最终 receipt；`confirmed/unconfirmed/interrupted/running` 与 stdout 分离，`payloadExitObserved` 保持 true/false/unknown 三态，只有明确 pre-exec 失败可按未执行清理，未知结果不授权 retry。
- binary file worker 使用最多 16 KiB 的 newline JSON header 与精确 binary length，在 namespace 内做 atomic write、file-version 复核和 outside/symlink/special-file 拒绝；host 同时校验 trusted receipt、worker reply 与独立 diagnostics。
- relay/worker 作为独立 bundle/package assets 发布，缺失时在执行前失败；当前 head 另补 scratch-root admission、CI 单测和更强的 Linux evidence，独立 verifier 覆盖 36 项真实 Linux adapter 行为。

旧 whole-CLI backend 在该拆分中仍存在。只有后续 policy/tool wiring 和完整 public cutover 合入后，工具级边界才会成为可用产品能力。

## 5. 设计边界

- bwrap 路径提供 write 与 command-network confinement，不承诺 secret confidentiality 或完整 host isolation；广泛 host read 与 pathname Unix socket 仍可用。
- #11614 默认不自动启用；Landlock、seccomp、一次性提权、Windows/macOS 新 backend 均不在当前 `main` 能力内。
- #11981 是 CI 方案且当前失败；#12064 是总体 draft；#12067 是未接线的内部 foundation，三者都不能替代 merged #11614 的现状描述。
- tool-level 迁移涉及安全边界、PTY/pipe 生命周期、文件并发和配置来源，必须逐拆分核对，不应从大 draft 的通过声明推断每个 extraction 已验证。

## PR 归因

| PR | 状态 | 作用 |
|---|---|---|
| [#11614](https://github.com/QwenLM/qwen-code/pull/11614) | merged | 显式 whole-CLI bwrap backend、最小可写 roots、project-env 来源隔离与 `qwen sandbox` 检查/验证。 |
| [#11981](https://github.com/QwenLM/qwen-code/pull/11981) | open draft | 为 whole-CLI backend 增加真实 Linux workflow 与 14 项 integration coverage；当前 GitHub checks 失败。 |
| [#12064](https://github.com/QwenLM/qwen-code/pull/12064) | open draft | 工具级 bwrap 完整迁移参考、公开 policy/cutover 与跨架构 acceptance。 |
| [#12067](https://github.com/QwenLM/qwen-code/pull/12067) | open | 从总体 draft 抽取 structured execution、trusted receipt、file worker 与 packaging foundation。 |

_按个人 PR 口径更新于 2026-09-19_
