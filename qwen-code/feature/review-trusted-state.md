# Review 信任状态

## 背景与边界

`qwen review` 的 lease 可授权清理 worktree/branch，base-tree 记录决定比较树是否可复用。#12491 已把权威状态从工作区 `.qwen/review-leases` 移至 `$QWEN_HOME/review-state/<hash>`，避免 reviewed code 修改可写工作区中的宿主权限事实。

## 实现

- `packages/cli/src/commands/review/lib/paths.ts` 以规范化的最外层仓库根计算 SHA-256 命名空间；嵌套 review worktree 共享外层命名空间，不同仓库隔离。
- `packages/cli/src/commands/review/lib/base-tree-trust.ts` 和 `packages/cli/src/services/review-worktree-lease.ts` 只从新路径读取权威记录。旧路径仍从 local diff 排除，且不再被自动加入 sandbox mask。
- lease service 在新路径成功取得权威 lease 后，为旧版 CLI 写 advisory mirror；镜像失败只告警，不允许旧路径文件覆盖新权威状态。

## 验证与限制

合入 diff 包含路径、lease、base-tree、sandbox 配置和 host-execution canary 测试。当前文档复核了最新 `main` 中仍存在的兼容镜像逻辑，未独立运行 Linux Landlock 验收。更换 `QWEN_HOME` 或移动仓库会换命名空间；混用迁移前后 CLI 版本不能安全协调同一 review。#12491 不是 Landlock 实现。
