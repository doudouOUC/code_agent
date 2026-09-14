# qwen-code PRs · 2026-09-14 ~ 2026-09-20 (W38 周内累计)

> 本文件已整理 2026-09-14 至 2026-09-20（Asia/Shanghai）创建的 @doudouOUC 个人 PR。口径为 `QwenLM/qwen-code` 中 author 为 @doudouOUC 且 createdAt 落在对应北京时间日/周窗口内的 PR；只在窗口内更新、关闭或合入，但创建时间不在窗口内的 PR 不计入新增统计。open PR 只记录当前 diff 方案，不能视为 `main` 已落地能力。

**主题**: HTTP 非安全上下文下的 standalone session UUID 兼容、根构建堆上限扩容、Qwen Triage verify archive 测试依赖补齐

**PR 统计**: 3 PRs - 3 merged / 0 open / 0 closed
**当前已合并 PR 代码量**: +124 / -47，4 个文件变更
**全量代码量**: +124 / -47，4 个文件变更
**类型分布**: fix ×2, other ×1
**范围 (scope)**: sdk-typescript ×1, ci ×2

---

## PR 明细

| PR | 状态 | 作者 | 标题 | 代码量 | 文件数 | 创建时间(UTC) | 合并/关闭时间(UTC) |
|---|---|---|---|---:|---:|---|---|
| [#11781](https://github.com/QwenLM/qwen-code/pull/11781) | ✅ merged | @doudouOUC | fix(ci): raise the build heap cap from 3072 to 4096 MB | +1/-1 | 1 | 09-13 16:13 | 09-13 21:46 |
| [#11812](https://github.com/QwenLM/qwen-code/pull/11812) | ✅ merged | @doudouOUC | fix(sdk): support standalone session creation over HTTP | +118/-45 | 2 | 09-14 05:18 | 09-14 07:02 |
| [#11819](https://github.com/QwenLM/qwen-code/pull/11819) | ✅ merged | @doudouOUC | ci(triage): install zip in the verify lane | +5/-1 | 1 | 09-14 06:50 | 09-14 07:33 |

---

## PR 解决问题、实现方式与 feature 处理

| PR | 解决了什么问题 | 最终怎么实现（open/closed 只登记当前观察） | 对应 feature 文档 |
|---|---|---|---|
| [#11781](https://github.com/QwenLM/qwen-code/pull/11781) | 全仓 TypeScript build 的实测 RSS 已逼近 3072 MB Node heap 上限，runner 争用时会以 V8 OOM 而非编译错误退出，使相同提交在不同 CI lane 上随机成败。 | 最终只把根 `npm run build` 的 `--max-old-space-size` 从 3072 提到 4096；测试脚本仍保留 3072，既不改变产品运行时，也不把新增上限当作预留内存。 | CI 构建资源修复，不新增长期产品 feature。完整实现见 [implementations/pr-11781.md](implementations/pr-11781.md)。 |
| [#11812](https://github.com/QwenLM/qwen-code/pull/11812) | 普通 HTTP 非回环来源不是 secure context，浏览器仍提供 `crypto.getRandomValues()` 却不提供 `crypto.randomUUID()`；No workspace 首次发送会在发出 create 请求前直接失败。 | 最终让 SDK 优先使用原生 `randomUUID()`，缺失时从 16 个安全随机字节设置 UUID v4 version/variant 位并格式化为小写 ID；显式 caller ID、单次 create 与 outcome-unknown exact recovery 语义保持不变，并补前导零、全 0/全 255 字节和两条 recovery 路径回归。 | 已更新 SDK、daemon客户端适配器、WebUI transport与daemon总览。完整实现见 [implementations/pr-11812.md](implementations/pr-11812.md)。 |
| [#11819](https://github.com/QwenLM/qwen-code/pull/11819) | Qwen Triage 的 `verify` job 使用 `node:22-bookworm`，镜像有 `unzip` 但无 `zip`；archive 安全测试在 `CI=true` 时因此于 collection 阶段硬失败，产生与被测 PR 无关的 `consistent-fail`。 | 最终在 verify runner tools 安装步骤中把 `zip` 与既有 `util-linux` 一起安装；主 CI 已有同等依赖，未运行该套件的 `tmux-testing` job 保持不变。 | CI 验证环境修复，不新增长期产品 feature。完整实现见 [implementations/pr-11819.md](implementations/pr-11819.md)。 |

## PR 对应 feature 覆盖

| feature 文档 | 本周新增/复核 PR | 文档动作 |
|---|---|---|
| [SDK](../../feature/sdk.md) | #11812(merged) | 更新 standalone create 的 UUID 生成兼容路径、exact recovery 不变量与浏览器边界。 |
| [daemon客户端适配器与SDK](../../feature/daemon-serve-mode/10-client-adapters-and-sdk.md) | #11812(merged) | 登记 native/fallback UUID 双路径及调用方显式 ID 不触碰 browser crypto。 |
| [WebUI与传输](../../feature/daemon-serve-mode/11-webui-and-transport.md) | #11812(merged) | 记录普通 HTTP 非回环 WebShell 的修复结果与未扩大的路由/安全边界。 |
| [daemon总览](../../feature/daemon-serve-mode/README.md) | #11812(merged) | 同步 standalone SDK/WebShell 最终能力索引。 |

_按个人 PR 口径更新于 2026-09-15_
