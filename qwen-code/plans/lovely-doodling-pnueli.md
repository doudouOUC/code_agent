# Plan: qwen-code Telemetry 技术分享文档

## Context

qwen-code 基于 Gemini CLI（Google）的平铺 LogRecord 事件埋点基线，自研构建了一套完整的 OpenTelemetry 可观测体系——包括层级 span 树、AsyncLocalStorage 并发隔离、敏感属性 opt-in、出站 HTTP 插桩、subagent 原生 span、daemon 跨进程 trace 传播等。这些工作分布在 25+ PR 中，缺少一篇面向技术分享的综合文档来展示设计思路和决策权衡。本文档将填补这个空白，同时与 Claude Code 的 telemetry 实现做横向对比，突出 qwen-code 的增量价值和设计选择。

## Target File

`docs/tech-sharing-telemetry.md` — 在当前 code_agent 仓库的 docs/ 目录下新建

## Document Structure

### 1. 背景与动机（~500 字）
- CLI Agent 可观测性的三个回答不了的问题（trace 因果链、外部后端对接、daemon 跨进程断裂）
- before/after 对比：平铺 log → 层级 span 树
- 上游基线：Gemini CLI 只有 LogRecord + Metrics，无 hierarchical span

### 2. 整体架构（~1000 字）
- 四层架构图（SDK/路由层、Span/上下文层、属性/语义层、daemon 层）
- Mermaid 架构图（复用已有 README 中的图，适度精简）
- Span 树总览 + 信号模型（Traces + Metrics + Logs 三路路由）

### 3. 核心设计亮点（~2500 字，5 个）
选技术含量最高、最有分享价值的点，每个用"问题→方案→权衡"三段式：

3.1 **AsyncLocalStorage 并发隔离** — `run` vs `enterWith`，为什么 tool 并发必须用 `run`，配并发串属反例图
3.2 **敏感属性 opt-in 与 SHA-256 去重** — 默认安全的四层防线，system prompt/tool schema 按内容 hash 去重
3.3 **TTFT 闭包采集与流式防泄漏** — 为什么不能用实例字段、5min idle timeout 兜底
3.4 **出站 traceparent 与 OTLP 反馈环防护** — NOOP propagator 默认安全 + 边界安全前缀匹配防无限循环
3.5 **span 防泄漏三板斧** — 幂等结束 + 属性/end 分离 + 30min TTL 安全网 + 哨兵属性

### 4. 与 Claude Code 的对比（~2000 字，6 个维度）
每个维度用"同一个问题 → 不同选择 → 各自的道理"叙事：

4.1 **并发隔离模型** — tool ALS `run`(qwen) vs `enterWith`(claude)，反映 agent 编排的架构差异
4.2 **PII 控制** — 运行时多层开关(qwen) vs 编译期 `never` 类型标记(claude)
4.3 **多 Agent 可观测** — OTel 原生 subagent span + Link(qwen) vs Perfetto 私有可视化(claude)
4.4 **per-prompt traceId 演进** — 从 session 共享到独立 trace 的设计修正（ARMS 渲染上限推动）
4.5 **出站 HTTP 插桩 + 反馈环防护** — 双层设计(qwen) vs 完全不做(claude)
4.6 **指标哲学** — 系统性能指标(qwen) vs 业务成果指标(claude)

### 5. 踩过的坑（~800 字）
- 确定性 traceId → per-prompt traceId 的演进（被生产推翻的设计）
- Log-to-Span 桥接的死代码问题（默认值设计的微妙影响）
- `response_text` PII 泄漏面（语义不一致的教训）
- `resolveParentContext` 双镜像的人肉 SYNC 约束

### 6. 效果与展望（~500 字）
- 接入 ARMS 后的可观测效果
- 后续规划方向

## Writing Guidelines

- 中文撰写，技术术语保留英文
- 重"设计决策"轻"代码走读"，不贴大段源码
- 关键代码只用伪代码或 5 行以内片段
- Mermaid 图用于架构图、span 树、并发隔离对比、时序图
- 对比章节用表格 + 叙事结合，不做纯功能清单 PK
- 控制总篇幅 7000-8000 字

## Verification

写完后做三遍无方向全面审计：
1. 第一遍：事实准确性 — 核对每个技术细节（span 名称、ALS 用法、配置项默认值等）是否与代码一致
2. 第二遍：叙事完整性与逻辑连贯性 — 章节衔接、论证是否自洽、对比是否公允
3. 第三遍：文字质量 — 措辞精炼、术语一致、格式统一、无错别字
