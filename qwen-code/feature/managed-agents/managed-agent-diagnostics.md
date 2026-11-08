# Managed 持久诊断与执行测量

## 资源与直接调用进入主干，2026-11-09

main `7d99e7d26ee4`：[#16640](../../weekly-report/2026-11-02_2026-11-08/implementations/pr-16640.md) 已合入 main：resources/agent-trace、Java SDK、生成类型和 WebShell resources/agents 页签。短只读 RR、原 actor 授权、private/no-store；配置/发现/最新尝试/实时未知分开，扫描及响应有预算，partial 不伪造完整。direct-invocations 在 SQL 分页前筛 child_agent，子链接需独立授权和谱系匹配，不递归执行。[#16475](../../weekly-report/2026-11-02_2026-11-08/implementations/pr-16475.md) 已关闭；[#16641](../../weekly-report/2026-11-02_2026-11-08/implementations/pr-16641.md) 当前 open diff 才持久模型/context（floor 3），[#16642](../../weekly-report/2026-11-02_2026-11-08/implementations/pr-16642.md) 依赖它并持久 activity（floor 4）；[#16499](../../weekly-report/2026-11-02_2026-11-08/implementations/pr-16499.md) 仍仅合入旧功能分支，[#16498](../../weekly-report/2026-11-02_2026-11-08/implementations/pr-16498.md) floor 5/Tool v4 当前 open diff 尚未改 base。以下旧章节为关闭前方案与分支技术历史，不代表 main。

本次只核源码与文档，未运行产品、CI、MySQL、Hosted、浏览器或真实 provider 测试。下方旧日期段落保留历史，状态/基底/拆分范围以本节为准。

## 关闭前历史快照，2026-11-08

对照 main `a32684604a12`。在该历史快照中生产入口尚未进入 main；后续 #16640 已落资源/直接 agent-trace，其余按上方最新切片状态。

| PR | 当前状态与基底 | 口径 |
|---|---|---|
| [#16475](../../weekly-report/2026-11-02_2026-11-08/implementations/pr-16475.md) | open，base main，head `6e23c493a759` | 当前 open diff；已含功能分支内合并的 activity。 |
| [#16499](../../weekly-report/2026-11-02_2026-11-08/implementations/pr-16499.md) | merged 到 `codex/managed-session-diagnostics-20261106`，merge `d303213cf0e7` | 功能分支最终实现，不能作为 main 能力承诺。 |
| [#16498](../../weekly-report/2026-11-02_2026-11-08/implementations/pr-16498.md) | open，base 同诊断功能分支，head `3d9700345c1d` | 当前 open diff；只扩执行方测量，不另建 collector。 |

## 数据与查询权威

#16475 当前方案在 Hosted prepared-request/usage commit 采集有界 context 与 main/hook/compression 累计，持久 revision 防回退、同 revision 内容冲突拒绝。最近请求上下文不是下一次请求预览；累计和近期样本不能重复相加，未知/provider 缺数不补零。资源清单区分配置选择、发现结果和实时健康，不在查询时 warm/attach/恢复 Runtime 或重新发现 MCP。

`ManagedSessionDiagnosticsService` 与相关资源/activity 服务复用原 actor/Workspace 授权，在短只读 REPEATABLE_READ 事务读取；Public/WebShell 返回 private/no-store。子调用链接还要子 Session 独立授权；分页、配置链扫描和资源字节均有预算，超限给 partial/coverage，不能宣称完整。原 journal/资源引用与投影同事务提交，不成为第二份执行 authority。

## 执行活动与测量边界

#16499 在功能分支以 tenant/Session、assistant UUID 和 functionCall ordinal 标识出现，关联原 intent/receipt/typed evidence；增量 SQL 投影按前后贡献替换，重放不再计数。请求、准入、执行、交付分开。显式 read/write/edit 不审计 Shell/MCP 内部 I/O；Skill 指令加载不证明后续模型消费或因果归属。惰性子树只组合已有授权谱系，不放开多层执行。

#16498 当前方案用 Tool v4 封装原 v2/v3，冻结结果、可空单调执行耗时/原生文件行数和 canonical digest，Broker 持久后 ACK，未知不降级重跑。`tool.measured` 沿已有 activity 投影绑定原 outcome/invocation，先提交再交付；Hook/审批改参时不伪造有效模型提议行数。累计操作增删行不是 Git 净 diff，旧记录未知与明确零分开，CSI /1–3 不扩执行方测量。

## 关键代码锚点

- `packages/core/src/managed-runtime/managed-session-diagnostics.ts`：#16475 的有界统计与上下文契约，仅在关闭前 broad diff，新模型切片为 #16641。
- `packages/managed-agent-server/persistence/src/main/java/com/alibaba/qwen/code/managedagent/persistence/ManagedActivityDiagnosticProjection.java`：#16499 的功能分支最终活动投影，不在 main。
- `packages/cli/src/serve/managed-runtime-tool-v4-routes.ts`：#16498 当前 open diff 的冻结结果与 ACK，不在 main。

## 版本与验证

基础 usage v2 诊断使用 storage floor 3/CSI /2，activity evidence 使用 floor 4/CSI /3，v4 测量候选用 storage/HTTP reader 5 和 `managed-session/3`。这些是 Session reader 协议，不是数据库迁移号；诊断不新增业务表，main 仍是自身当前 reader 能力与 V1/38 表。测量开关默认 false，需要匹配 reader、writer 与 attested binding，不能替旧 binding 自动换 capability。

本次只核 diff、changed files、main/分支源码和测试定义。Java/TypeScript/MySQL/Hosted/真实 Worker/浏览器/平台测试均未执行。具体测试选择器、生成契约与恢复矩阵见各 PR 实现文档；夹具截图、分支内 merged 或源码中的 green 声明都不替代当前 revision 的验收。
