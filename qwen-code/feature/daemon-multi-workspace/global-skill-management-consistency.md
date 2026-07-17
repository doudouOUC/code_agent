# daemon global Skill management 一致性设计

> 状态：基于 `QwenLM/qwen-code@401170d4888914fb50c1640a1256239931c9b009` 的补充 correctness 方案；相关 Skill 实现由 #7018 在 `0ecba4b3` 引入，之后到本审阅基线没有相关路径变化。本文只处理 daemon multi-workspace 下的 Skill ownership、文件事务、传播和 source filesystem 边界，不扩展成通用 user-global resource framework。

## 问题定义

#7018 为 Skill install/delete 增加了 `workspace | global` scope，但两种 scope 仍走 selected runtime 的同一条 workspace route/service：

- `global` destination 实际是 `Storage.getGlobalQwenDir()/skills`，同一 Qwen home 下的所有 runtime 和 daemon process 共享；
- operation 使用 selected runtime 的 `skillInstallEnv`，因此同一 user-global mutation 会随 workspace env 改变 GitHub credential；
- install/delete 没有 daemon-global 或 cross-process destination lock；
- `removeInstallArtifacts` 按公共 prefix 删除 staging/backup，可能删掉另一个并发 operation 的目录；
- global mutation 只 invalidate/refresh owning runtime 的 cache/child，其他 runtime 继续使用旧 catalog；
- delete 先查询 selected runtime 的 cached status，再按第一个同名 Skill 推断 path；workspace/user 同名 shadowing 或 stale cache 会产生错误 target；
- folder source 接收任意 server absolute path，并直接用 `fs` 读取，没有经过 selected runtime 的 `routeRoots`/filesystem boundary；
- public catalog/status、mutation result 和部分 error 可以返回 absolute installed/source path。

这不是 permission 问题。Skill catalog 不需要 authorization gate 或 tool execution-start barrier，但需要自己的窄 coordinator、目标锁、原子目录事务、全 runtime invalidation 和 turn/lookup revision barrier。

## Ownership contract

每次 operation 明确区分 destination ownership 与 source capability：

| 维度              | Workspace Skill                    | Global Skill                                                          |
| ----------------- | ---------------------------------- | --------------------------------------------------------------------- |
| destination scope | selected runtime                   | daemon/user-global                                                    |
| destination root  | `<workspace>/.qwen/skills`         | global Qwen home `skills`                                             |
| route owner       | selected runtime                   | parent daemon coordinator                                             |
| credential/env    | owning runtime env                 | daemon baseline user env                                              |
| live propagation  | owning runtime consumers           | all runtime consumers                                                 |
| folder source     | selected `routeRoots` 内的相对路径 | 仍需显式 source workspace；不能把 global destination 当作全盘读取权限 |

`scope: global` 不能因为请求 URL 带 workspace 就变成 workspace-owned。反过来，global destination 也不能让 folder source 绕过 workspace filesystem capability。

## 必须满足的不变量

1. 同一 canonical `(baseDir, canonicalSkillIdentity)` 的 install/delete 在 daemon 内和 Qwen processes 间串行化；identity 使用 ASCII case-fold，实际目录名仍保留已验证 manifest 的拼写。
2. global mutation 不读取 selected runtime env、settings 或 trust 作为隐式 user-global owner。
3. folder source 只读取 captured source workspace 的 `routeRoots`，不能接受 daemon API 提供的任意 absolute path。
4. 正常 operation 只能清理自己创建的 staging/tombstone；recovery 也只能在目标锁内，凭可验证 operation marker 和过期 lease 清理 stale artifact，公共 prefix 不能作为 ownership proof。
5. install commit 是完整、已验证目录一次 rename 到不存在的 destination；不能先移走旧 Skill 再留下 crash gap。
6. delete commit 先把 destination 原子 rename 成本 operation 的 tombstone，再异步清理。
7. global commit 后，所有 running runtime cache/consumer 已 refresh，或响应明确标记 partial/deferred；stale runtime 在下一次 session/prompt/Skill lookup admission 前必须追平 revision，idle child 不因传播而启动。
8. workspace 切换不能把已 dispatch 的 mutation 重放到新 target，旧 target 的晚到 read 不能覆盖新 UI state。
9. public catalog/status、mutation response 和 error 不暴露 Qwen home、canonical source、staging 或 backup absolute path。
10. 跨 daemon 只承诺文件事务串行化和 bounded full rescan 后的最终一致，不声称同步 refresh 另一个 daemon。

## Route 与 API 分层

新增 parent-owned daemon-global methods，例如：

```text
POST   /skills/install
DELETE /skills/:name?scope=global
GET    /skills?scope=global
```

workspace scope 继续使用：

```text
POST   /workspaces/:workspace/skills/install
DELETE /workspaces/:workspace/skills/:name?scope=workspace
```

为保持 wire compatibility，现有 workspace-qualified route 收到 `scope: global` 时可以转发到 parent coordinator，但必须满足：

- 不调用 selected runtime 的 global writer；
- 不使用 runtime env；
- response 标明 effective scope；
- 后续 SDK/Web Shell 使用 daemon-global client method；
- 兼容转发经过一个发布周期后再考虑 deprecate，不需要立刻删除旧 shape。

wire migration 使用 capability negotiation，不复用不安全的旧 folder shape：

- `installedPath` 当前已经是 optional；先标记 deprecated 并停止 server emission，旧 client 继续按缺失 optional field 工作，下一版 generated SDK 再删除字段；
- 新 daemon folder source 使用新的 discriminant，例如 `workspace-folder` + `{ workspace, relativePath }`；旧 `{ type: "folder", path: absolute }` 在 daemon route 返回稳定 `folder_source_upgrade_required`，不能静默继续读取；
- standalone local CLI 可以保留内部 absolute-path input，但不把该 DTO 暴露给 daemon wire；
- SDK 优先使用 advertised daemon-global methods；旧 server 不支持时，GitHub/ZIP global operation 可走 workspace-qualified compatibility route，folder source 不降级。

global route 的 authorization 使用 daemon 已有 authenticated mutation policy。workspace trust 只约束 workspace destination 或 folder source，不应导致 GitHub/ZIP global install 因当前选中了 untrusted secondary 而随机不可用。

## `GlobalSkillCoordinator`

coordinator 只负责 global Skill destination，不复用 `UserPermissionCoordinator`：

```ts
interface GlobalSkillCoordinatorState {
  catalogRevision: number;
  catalogDirty: boolean;
  catalogLane: Promise<void>;
  targetLanes: Map<string, Promise<void>>;
  consumers: Set<SkillCatalogConsumer>;
}
```

- target key 是 canonical global skills base + ASCII case-folded Skill identity；在 case-sensitive filesystem 上，`Foo`/`foo` 也不能成为两个逻辑 Skill；
- 同名 operation 串行；不同名的 download/validation/staging 可以并行，只有 daemon-local final rename/publish 进入短 catalog lane；
- cross-process lock 使用同一 target identity；
- final rename、daemon-local revision publish 和 consumer snapshot 进入一个窄 catalog lane；锁顺序固定为 target lock -> catalog lane，catalog lane 不反向获取 target lock；
- catalog lane 只更新 dirty/revision、同步 invalidate/required revision 与 consumer snapshot，不等待 child refresh IPC/ack；
- consumer 绑定 concrete runtime/child incarnation，并记录 applied revision；旧 runtime ack 不能刷新 replacement；
- consumer set 包含 active、draining 和尚未确认停止的 fenced runtime；idle runtime 只 invalidate cached revision。

不要建立通用 `UserGlobalCoordinator`。global Skills 与 permission 的成功语义不同：Skill refresh 失败可以 partial/deferred，permission stale allow 则必须 fence。

## Destination transaction

### Install

先在 destination lock 外下载/读取、展开和验证 package，形成 bounded immutable file set。随后：

```text
acquire target lock
  -> rescan declared base for the canonical Skill identity
  -> exact/case-colliding destination exists: return skill_exists (409)
  -> create unique same-filesystem staging under base parent, outside scanned skills base
  -> write files + validate SKILL.md + fsync files/staging directory where supported
  -> acquire daemon-local catalog lane; set catalogDirty
  -> rename staging -> destination (commit); fsync base parent where supported
  -> bump revision + snapshot/invalidate consumers + best-effort shared change token
  -> clear catalogDirty; release catalog lane
  -> release lock
```

默认 install 采用 create-only。当前“先把 existing rename 到 backup，再把 staging rename 到 destination”的 replace 流程有 crash gap；在没有 versioned directory 或窄 transaction marker 前，不继续支持隐式 overwrite。更新 Skill 可先显式 delete，再 install；若未来需要 atomic replace，应独立设计，不把它偷偷塞进 install。

### Delete

delete 不依赖 selected runtime status cache 或 public `installedPath` 推断目标。under lock 重新扫描 declared scope base，以 ASCII case-folded identity 解析恰好一个 direct child；然后验证 directory、manifest name 与 basename 精确一致、symlink 和 containment。零个返回 not-found，多个 case-colliding entry 返回稳定 conflict：

```text
acquire target lock
  -> validate exact managed destination
  -> acquire daemon-local catalog lane; set catalogDirty
  -> rename destination -> unique hidden tombstone outside scanned skills base (commit)
  -> fsync base parent where supported
  -> bump revision + snapshot/invalidate consumers + best-effort shared change token
  -> clear catalogDirty; release catalog lane
  -> release lock
  -> best-effort recursive cleanup tombstone
```

例如把 `<base>/<name>` rename 到 `<base-parent>/.<base-name>-<name>.deleting-<operationId>`，保证同 filesystem 原子 rename，同时不被 Skill catalog 扫描。cleanup 失败只留下不可发现的 tombstone，不恢复已提交的 catalog entry。下一次持锁 operation 或 housekeeping 只能在验证 operation marker、确认 lease 过期后清理对应 stale artifact；新的同名 destination 是否存在不影响该 tombstone 的 ownership。不能按 skill-name prefix 删除所有 staging/backup。

这里的 crash-safety 默认指 process crash。实现应在平台支持时 fsync file、staging directory 和 rename 所在 parent directory；不支持 directory fsync 的平台必须把 power-loss durability 作为明确边界，不能用原子 rename 推导出断电持久性。

### Cross-process lock

daemon、standalone CLI、VS Code/其他 Qwen writer 若操作同一 Skill base，必须使用相同 lock convention。lock 覆盖 destination check 和 commit rename，但不覆盖 GitHub download 或 ZIP parsing。

非 Qwen 外部编辑器仍可能直接改目录；daemon 通过 watcher/catalog rescan 最终收敛，不对外部 writer 宣称线性一致。

## Source filesystem capability

GitHub 与 ZIP source 不需要 workspace filesystem read。folder source 则是独立的 server-side read capability：

- daemon API 使用新 shape：`source: { type: "workspace-folder", workspace, relativePath }`；
- capture source workspace at submit，按 id/canonical cwd 解析 selected runtime，并获取窄 filesystem request lease；
- lease 覆盖 containment、目录遍历、复制成 bounded immutable file set 和全部 file handle close；removal 的 physical release 必须等待 lease；
- path 全程通过该 runtime 的 route filesystem/canonical containment 读取，不能在解析出 absolute path 后退回 raw `fs`；
- reject absolute path、`..` escape、所有 symlink、special file 和 read-time replacement；普通文件使用 no-follow open，并在 read 前后比较 file identity/metadata；
- untrusted/draining/removed/ambiguous source runtime fail closed，不 fallback primary；
- global destination 不改变 source workspace；切换 UI workspace 不重放读取；
- standalone local CLI 可以保留 absolute path，因为调用者就是本机 user，不要把该语义复制到 remote daemon route。

如果短期不愿扩充 source descriptor，daemon route 应先禁用 folder source，只保留 GitHub/ZIP，而不是继续接受任意 absolute path。

## Credential 与 trust boundary

- global GitHub install 使用 daemon startup 的 baseline user env/credential provider；
- workspace Skill install 可以使用 owning runtime env，但 response/log 不暴露 token 来源；
- 不从 `.env` 或 selected runtime overlay 为 global operation 选择 `GH_TOKEN`；
- client id 只用于 audit/correlation，不决定 target 或 credential；
- public catalog/status 只返回展示和调用所需 metadata；`installedPath` 只保留在 server-side provider 内部，delete 直接按 declared scope base 解析目标；
- public result 返回 `skillName`、`scope`、`changed`、`activation`，不返回 `installedPath`；
- public errors 使用 stable code，不回显 Qwen home、realpath 或 staging directory。

## Catalog propagation

global commit 后 parent 增加 `catalogRevision`：

1. invalidate 每个 runtime 的 daemon-local skills provider/cache；
2. 对 running child 发送窄 `workspaceSkillsRefresh` control；
3. 不启动 idle child；其 next ready 必须读取最新 catalog revision；
4. draining/fenced child 在确认不再解析/执行 Skill 前仍参与，或保持 closed；
5. event 以 daemon-global scope 发布，保留 `originatorClientId`，不能只发 selected workspace event。

runtime attach、parent-owned catalog read 与 final commit 使用同一 catalog lane。新 runtime 初始为 catalog-not-ready：在 lane 内从磁盘加载 global catalog 并记录 committed revision，完成前不能发布 ready。若 `catalogDirty` 为 true，下一次 attach/read/admission/final commit 必须先在 lane 内完整 rescan、推进 revision、重新 invalidate consumers，再清除 dirty；不能接受旧 cache。runtime 保存 `appliedGlobalSkillRevision`；新 session、prompt 构建或 Skill lookup 发现落后时同步 refresh，失败则拒绝本次 admission，不能继续静默使用旧 catalog。

response activation 只描述当前 daemon：

| 结果        | 含义                                                                        |
| ----------- | --------------------------------------------------------------------------- |
| `activated` | 所有 running consumers 已 refresh                                           |
| `deferred`  | 没有 running consumer；后续 ready 会加载新 catalog                          |
| `partial`   | destination 已 commit，但部分 consumer refresh 或 change-token publish 失败 |

`partial` 不回滚文件。已经开始的 turn 采用 snapshot 语义，可以完成当前 turn；下一个 Skill lookup/turn boundary 必须比较 catalog revision 并 refresh，失败时拒绝继续，不能无限使用删除后的 Skill definition。parent-owned public global catalog/status 直接读取 coordinator 的权威视图，不依赖 selected workspace runtime。

revision 和 shared change token 都只是 cache invalidation hint，磁盘 rescan 才是 catalog 事实源。change token 使用 unique temp + rename，存放在 scanned skills base 之外。若 process 在 rename 后、revision publish 前退出，新 daemon startup 必须无条件从磁盘建 catalog；不需要用 durable seqlock 把 daemon-local revision 伪装成跨进程事务。跨 daemon 属于最终一致：Qwen writer 在 destination commit 后原子更新 opaque token，各 daemon watcher 只用于快速 invalidation；public global catalog read、turn/Skill lookup prelude 在 bounded interval 到期后无条件执行完整 rescan，即使 token 未变化，因此 correctness 不依赖 notification 或 token write。token 更新失败使 mutation 返回 committed `partial`，但 bounded rescan 仍会收敛。需要跨 daemon 即时撤销 Skill 的部署，应运行单 daemon 或另行设计 process coordination。

## Web Shell 与 SDK target capture

- workspace install/delete/toggle 在用户确认时捕获 owning workspace client；
- global install/delete 调用 daemon-global client，不把 primary client 当 global alias；
- dialog 打开后若 workspace 变化，workspace-scope form 显示 captured target，并要求用户确认或重新选择；
- list/detail read 记录 `targetKey + requestId`，workspace 变化后丢弃旧结果；
- global list 可以跨 workspace 保留，但 workspace/user 同名 Skill 必须用 `(scope, canonicalSkillIdentity)` 作为 selection key；
- lost mutation response 不自动 replay；按 captured `(scope, canonicalSkillIdentity)` reconcile catalog。

当前 `useSkills()` 直接使用 root `DaemonWorkspaceProvider` actions，不足以证明 active session owner 正确。测试需要让 A/B 拥有不同 workspace Skill 和同名 shadowing，不能只在 primary 跑 happy path。

## Failure semantics

| 失败点                                       | 结果                                                                                                |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| source/trust/validation/download 失败        | 未进入 destination commit；返回 stable error                                                        |
| lock/destination check 失败                  | 未 commit；不清理其他 operation artifact                                                            |
| install rename 前失败                        | destination 保持不存在；只清理本 operation staging                                                  |
| rename 成功、parent fsync/local publish 失败 | committed `partial`；durability 可能未知，保持 catalogDirty，recovery rescan 前拒绝 stale admission |
| local consumer refresh/shared token 失败     | committed `partial`；本地 revision 已一致，不回滚或自动重装                                         |
| delete rename 前失败                         | 原 Skill 仍可见                                                                                     |
| delete rename 成功、recursive cleanup 失败   | committed；tombstone 后续清理                                                                       |
| response 丢失                                | client reconcile captured scope/name，不 replay mutation                                            |

local revision/snapshot 失败时用 `finally` 释放 catalog lane，但不得清除 `catalogDirty`；后续 recovery rescan 是唯一 reopen admission 的路径。

## 验证计划

### Destination concurrency 与 crash

- A/B runtime 同时 global install 同名：一个 commit，一个稳定 409；两者 staging 互不删除；
- 两个 daemon/CLI 同时 install/delete 同名：同一 cross-process lock 串行；
- 不同 Skill name 的 download/staging 可并行，daemon-local final commit lane 有序且不覆盖彼此；
- crash 在 staging write、install rename、delete tombstone rename、cleanup 各 barrier 后，catalog 只有明确 old/new 状态；
- parent-directory fsync 或 local revision publish 在 rename 后失败时不得回滚 destination；返回 committed partial 并通过 dirty recovery rescan；
- workspace/user 同名 Skill 删除使用 `(scope, canonicalSkillIdentity)`，不依赖 status list 顺序。

### Scope 与 propagation

- A/B runtime env 使用不同 `GH_TOKEN` marker，global install 只使用 daemon baseline，workspace install 使用 owner runtime；
- A global install 后，B running child/cache refresh；idle C 不启动但 next ready 看到新 revision；
- B refresh 失败返回 partial，下一 turn 前 revision barrier 触发 reload；
- runtime 在 commit snapshot 后启动时，ready handshake 必须加载新 revision；旧 catalog refresh 失败时新 session/prompt admission 被拒绝；
- final rename 后注入 local revision publish failure 时 `catalogDirty` 保持，attach/read/admission 在 recovery rescan 前均不能接受 stale cache；
- daemon B 丢失 directory watcher event 后，bounded token check/rescan 仍看到 daemon A 的 commit；
- 两个 daemon 同时修改不同 Skill，以及进程在 destination rename 后、revision/token publish 前退出，下一次 bounded rescan 都收敛到磁盘事实；
- untrusted secondary 选中时，GitHub/ZIP global operation 不错误依赖该 workspace trust；workspace/folder source 仍 fail closed。

### Filesystem 与 UI

- folder source absolute path、parent escape、symlink、TOCTOU replacement 全部拒绝；非目标 primary filesystem 调用为 0；
- source workspace draining/removed 后不 fallback primary；复制期间 drain 必须等待 source lease，immutable snapshot 完成前 runtime 异常退出则 install 失败且只清理本 operation artifact；
- Web Shell 在 A list/detail 打开时切到 B，旧 read 丢弃；A mutation 不落到 B；
- global 与 workspace 同名 Skill 在 list、delete、reconcile 中保持独立；
- old SDK 缺失 `installedPath` 时仍能 list；legacy absolute folder request 返回 `folder_source_upgrade_required` 且 server filesystem read 为 0；
- public catalog/status、mutation response 和 error 不包含 absolute Qwen home、source realpath 或 staging path。

## 不采用的方案

- 把 global Skill 放进 `UserPermissionCoordinator`：成功/失败和执行安全语义不同；
- 用 selected/primary runtime 代理 global writer：会引入 env、trust、cache 和 lifecycle 偶然性；
- 只依赖 unique temp name：不能阻止 prefix cleanup 或同 destination commit race；
- 持锁下载 GitHub/解析 ZIP：无谓放大 lock duration；
- 隐式 overwrite + backup rename：没有 crash-safe replace contract；
- daemon folder source 接受 absolute path：workspace trust 不等于全盘读取授权；
- 通用 user-global event bus：当前只需 Skill catalog revision 与窄 refresh control。
