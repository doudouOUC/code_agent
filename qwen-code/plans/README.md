# Implementation Plans

按周组织的 PR 实现计划。每个 plan 文件对应一个或多个 QwenLM/qwen-code PR，末尾有 `## Final Implementation Status` 节记录最终实现状态。

## 目录结构

```
plans/
├── W19/          # 2026-05-04 ~ 2026-05-10 (1 plan)
├── W20/          # 2026-05-11 ~ 2026-05-17 (16 plans)
├── W21/          # 2026-05-18 ~ 2026-05-24 (10 plans)
├── W22/          # 2026-05-25 ~ 2026-05-31 (8 plans)
├── W23/          # 2026-06-01 ~ 2026-06-07 (2 plans)
├── misc/         # 跨周/epic 级/未落地 plan (46 files)
└── README.md     # 本文件
```

## 命名规范

`#<PR号>-<短标题>.md`，如 `#4096-atomic-write.md`。同一 PR 有多个 plan 时加 `-plan2`/`-plan3` 后缀。

## 按周索引

### W19 (1)
| 文件 | PR |
|---|---|
| #3847-trace-correlation.md | #3847 telemetry trace correlation |

### W20 (16)
| 文件 | PR |
|---|---|
| #4058-trace-followup.md | #4058 trace correlation followup |
| #4064-rewind-file-restore.md | #4064 rewind file restore |
| #4064-rewind-file-restore-plan2.md | #4064 (review fixes) |
| #4096-atomic-write.md | #4096 atomic write primitive |
| #4126-span-unify.md | #4126 span creation unify |
| #4191-capability-registry.md | #4191 capability registry |
| #4209-session-scope.md | #4209 session scope override |
| #4222-session-load-resume.md | #4222 session load/resume |
| #4222-session-load-resume-plan2.md | #4222 (session metadata) |
| #4237-sse-replay.md | #4237 SSE replay sizing |
| #4241-status-routes.md | #4241 status routes |
| #4241-status-routes-plan2.md | #4241 (staged wave plan) |
| #4247-mcp-guardrails.md | #4247 MCP guardrails |
| #4249-workspace-memory.md | #4249 workspace memory/agents |
| #4250-fs-boundary.md | #4250 FS boundary |
| #4255-device-flow.md | #4255 device flow auth |

### W21 (10)
| 文件 | PR |
|---|---|
| #4269-file-read-routes.md | #4269 file read routes |
| #4295-acp-bridge-skeleton.md | #4295 acp-bridge skeleton |
| #4300-typed-errors.md | #4300 typed errors |
| #4302-telemetry-polish.md | #4302 telemetry polish |
| #4319-acp-bridge-f1.md | #4319 acp-bridge F1 |
| #4360-protocol-completion.md | #4360 protocol completion |
| #4367-resource-attributes.md | #4367 resource attributes |
| #4412-daemon-docs.md | #4412 daemon docs |
| #4417-uid-preserve.md | #4417 uid preserve |
| #4469-main-sync.md | #4469 main sync |

### W22 (8)
| 文件 | PR |
|---|---|
| #4504-recap-endpoint.md | #4504 recap endpoint |
| #4504-recap-endpoint-plan2.md | #4504 (CORS plan) |
| #4527-cors-allowlist.md | #4527 CORS allowlist |
| #4556-batch-delete.md | #4556 batch delete (×3 plans) |
| #4559-daemon-logger.md | #4559 daemon logger |
| #4563-workspace-service.md | #4563 workspace service (×2) |

### W23 (2)
| 文件 | PR |
|---|---|
| #4694-compacted-replay.md | #4694 compacted session replay |
| #4822-hooks-diagnostic.md | #4822 hooks diagnostic |

### misc (46)
跨周 epic 计划（#4175 daemon epic ×3、#4514 endpoints issue ×3）、未落地设计（#4678 compaction）、agent 子 plan、会话级临时 plan 等。

_生成于 2026-06-09_
