# Managed Agent E2B Cloud Runtime 候选

## 当前状态

2026-10-31 对照 main `57d9a8fb50f4`，本人 [#15879](../../weekly-report/2026-10-26_2026-11-01/implementations/pr-15879.md) 仍 open，head `2382bcce7d6b`。它基于拆分前目录，不是当前 Maven 多模块主干或有界历史候选的整合版本；以下均为当前 diff 观察。真实 E2B、Linux 镜像/Volume、中央 publication ingress、MySQL、Hosted、模型和发行验收未由本次执行。

## 所有权与准入

中央 Server/Hosted Harness 继续拥有会话准入、模型、审批和 journal，独立 adapter 持 E2B 凭据并运行 tool worker，不把云凭据放入 Core/Harness。显式 external-workspace-files 提供 Read/Write/Edit/WebFetch；external-workspace-tools 再加 Glob/前台 Shell，要求中央 HTTPS Tool Publication 与 Artifact，结果不依赖 sandbox 存活读取。

loopback operator 先注册 provider/不可变 Volume ID/revision，再以原 key 原子发布 ACTIVE Workspace/指定 actor 的 OWNER。公共 Session 必须选择该 EXTERNAL storage 且 cwd 为 .；原租户/物理 owner/revision 和排他执行检查保留，不把两个 Session 描述成独立磁盘。旧 external-scratch/workspace 不因本候选放宽。

## 耐久创建与观察

adapter 需 Node >=22.19、E2B SDK 2.61.0、0700 canonical 私有目录和 0600 SQLite；WAL/FULL journal 绑定 provider 与原 API key 摘要，保存原创建意图/请求摘要、随机 create key、route 和访问凭据。同 key 只回原记录，SDK 禁创建重试；缺失创建回复/traffic credentials 时只列原 metadata 并返回 UNKNOWN，不另建、不调用可能恢复暂停 VM 的 Sandbox.connect。启动也先记录一次性状态，不因失答二次启动。

每个物理 Workspace 唯一既有 Volume，先由 Volume-ID API 写随机挑战、从 mount 读回，再写私有 boot 并启动匹配 Linux worker。观察必须匹配原 sandbox metadata、私有网络和 attest；受保护 wildcard ingress 核原 bearer/lease/epoch，只转发白名单并注入私有 traffic token，不接受任意上游 URL。E2B Volume API 是依赖边界，改 endpoint 不足以证明 AgentSandbox 兼容。

## 执行与关闭

文件准备及确认/执行前重验 realpath，拒更新输入绕过范围。Hosted/SDK 持久 pin fileRewindEnabled=false 并在恢复重述；不支持 rewind、后台 Shell、PTY/Monitor、MCP/Hook/扩展、child Workspace、cwd/挂载转移和 Workspace 浏览。会话级 worker 不是卷副本或宿主权限隔离声明。

关闭先释放原 worker Session、ACK 原结果、排空 channels/pending 并发布 files/tools drain proof。Broker 核原 bytes/digest/boot/lease/storage revision；provider 先保存原 retirement key/完整证明，再 kill 原 sandbox ID 并核 absence，Volume 保留。失答仅确认同一记录；RETIRING 可带原证明重试同一停止。仅 TTL、暂停、GONE 或普通 release 不是 close 证明，未知仍保留占用。

## 验证边界

关键代码在 `integrations/e2b-runtime-provider/src/provider.ts`、`e2b.ts`、`server.ts`，候选 Java 接线仍在拆分前 `packages/managed-agent-server/src/main/java/`。测试入口及完整路径见 [PR 实现观察](../../weekly-report/2026-10-26_2026-11-01/implementations/pr-15879.md)。fixture/本地 worker、真实 Cloud/持久卷、MySQL、公开 Hosted 与部署必须分层；本次只核源码和文档，未创建任何云资源或运行源码测试。未知创建可能需人工调查，自动换凭据和重建恢复不覆盖。
