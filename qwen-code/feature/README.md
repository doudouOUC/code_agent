# qwen-code feature 技术方案

按 **feature topic** 汇总 [@doudouOUC](https://github.com/doudouOUC) 在 [QwenLM/qwen-code](https://github.com/QwenLM/qwen-code) 的 PR（2026-04 ~ 05，共 144 个），并结合代码整理的详细技术方案。每篇含：背景动机 / 整体架构 / 子系统详解（带 `file:symbol` 锚点）/ 关键流程（mermaid 时序图·调用链·状态机）/ 设计决策与权衡 / 涉及 PR / 已知限制。

> 配套：逐 PR 的描述↔实现一致性 + 正确性审查见 [`../weekly-report/`](../weekly-report/)。
> 说明：serve/daemon/acp-bridge/部分 telemetry 代码位于集成分支 `daemon_mode_b_main`，文中已逐处标注。

## 12 篇技术方案

> **daemon/serve** 与 **telemetry** 两块内容最多，已各自拆成文件夹（README 总览 + 多篇函数级深入子文档）；其余为单篇。

| 主题 | 文档 | 关键 PR | 一句话 |
|---|---|---|---|
| daemon/serve 模式 | [daemon-serve-mode/](daemon-serve-mode/) 📁 | epic #4175 / #3803（~47 PR） | Mode B：agent core 常驻 HTTP daemon，多客户端经 REST+SSE 并发附着，ACP bridge 解耦（README + 8 篇深入 + 09 路线图/覆盖/缺口） |
| telemetry 可观测性 | [telemetry-observability/](telemetry-observability/) 📁 | epic #3731 / #4384（~25 PR） | 层级 span 树 + 上下文传播 + OTLP 路由 + 敏感属性门控 + daemon 端到端追踪（README + 7 篇深入） |
| conversation rewind | [conversation-rewind.md](conversation-rewind.md) | #3441 #4064 #4216 #4122 #4580 | double-ESC/`/rewind` 回退历史 + 文件恢复 + TOCTOU 顺序 |
| 原子文件写 | [atomic-file-write.md](atomic-file-write.md) | #4096 #4333 #4431 | temp+rename+fsync 原子写，铺开到 credentials/memory/config/JSONL |
| CLI 启动性能 | [cli-startup-performance.md](cli-startup-performance.md) | #3318 #3319 #3297 #3232 | API 预连接 + 早期输入捕获 + 工具懒注册 + 启动 profiler |
| SDK (Python/TS) | [sdk.md](sdk.md) | #3494 #3685 #3832-3835 #4226 #4360 | Python SDK(子进程+控制协议) + TS daemon SDK + PyPI 发布工具链 |
| monitor 事件工具 | [monitor-tool.md](monitor-tool.md) | #3684 #3726 #3792 #3933 | 长任务节流流式监控 + MonitorRegistry owner-scoped 通知 |
| 后台 agent/会话恢复 | [background-agent-resume.md](background-agent-resume.md) | #3739 #4222 | 背景 agent paused/resume(transcript-fork) + daemon session load/resume |
| 上下文压缩 | [context-compression.md](context-compression.md) | #3879 #3985 #3872 | 反应式溢出压缩(单次重试护栏) + 会话记录瘦身 |
| 诊断 skills | [diagnostic-skills.md](diagnostic-skills.md) | #3404 #4133 #3079 | /doctor 代码命令 + /stuck /batch prompt 技能 |
| auth/provider | [auth-providers.md](auth-providers.md) | #3212 #3495 #3623 #3624 #4255 | provider 配置/apiKey 保留/auth status 识别 + daemon 设备流(PKCE) |
| 权限系统 | [permission-system.md](permission-system.md) | #3467 #3726 #4335 | 规则解析+畸形规则守卫 + 工具命名空间 + 多客户端权限协调 |

## 备注

- **跨主题 PR**：少量 PR 同时属于多个 feature（如 #3726 既是 monitor 工具也是权限命名空间；#4255/#4291/#4305 既属 daemon/serve 也属 auth；#4335 既属 daemon/serve 也属权限系统）——各文档从自身角度切入。
- **acp-bridge 抽包**（#4295/4298/4300/4304/4319/4334/4445）作为 daemon/serve 的内部分层，归入 [daemon-serve-mode/](daemon-serve-mode/)（见其 07 子文档）。
- 每篇「已知限制」综合了 weekly-report 的 review 发现（描述漂移、遗留缺口、待修项），便于直接对照跟进。

_生成于 2026-05-31；最后更新 2026-06-04_
