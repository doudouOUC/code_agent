# Managed 多媒体与调用配置

状态：2026-09-09，基于 `3c6556e70b` 实施 M1，限定真实验收、两轮自审及独立最终源码审查通过；M2/M3 仍为设计。完整目标仍为 [daemon 默认替换](managed-agent-daemon-default.md)，此文不代表完整多媒体或默认替换已验收。三个普通会话 factory 尚未切换；4170 预览与用户数据保持原状。

## 迁移前差距

Read 已在所属 Runtime 执行，但 fileUtils 读取 ContentGeneratorConfig.modalities；Tool-only Config 没有 Gateway 完成认证与模型解析后的能力。文本模型的图片/PDF候选也不会保留：Tool-only 的 getDefaultVisionBridgeModel 明确返回 undefined。这个禁止推理的保护必须保留，不能把 Gateway 的模型选择或凭据灌入 worker 解除它。

迁移前 ZoomImage 由 Gateway 构造与执行，要求有效 image 能力，工作区权限、忽略规则、原生 sharp 解码和归一化裁剪都必须迁移。其延迟声明、searchHint、参数和错误保持原样。DisplayImage 同时检查 fork 作用域、工作区 PNG、尺寸与终端渲染器；daemon 非交互入口原本没有终端渲染支持。不能因为拿到 worker 路径就向用户报告已展示。

普通图片的 Vision Bridge 原本在 Gateway 调度器/Session 后处理；PDF 转写则位于原生 Read.execute 内，在错误分类、读取缓存、telemetry 和 PostToolUse 之前。把 PDF 候选放入一个已经 settled 的工具结果再后处理，会改变失败、取消和 Hook 语义，并误走普通图片允许的整轮模型切换。

迁移前 HTTP v2 execute/status/cancel 沿用 8 MiB 响应限制，进度只保留 1 MiB。原生 Zoom 输出最多 9 MiB 编码前字节；Read 原始媒体约 9.9 MiB，PDF渲染通常限制为 25 MiB base64，但保留首张页面存在例外。daemon ACP 原有单帧和队列上限为 64 MiB。不能用小图成功证明整个媒体链路可用，也不能把媒体塞进进度或静默截断。

## 调用快照

把纯媒体决策放在私有 prepare 元数据中，与模型工具 input 分离。第一步只包含解析后的 inputModalities（image/pdf/audio/video 布尔值）；PDF桥接与终端阶段再增加实际使用的字段，不提前写未使用开关。Gateway 在每个 invocation 首次 prepare 时采集并保留快照；重试、用户确认、预检与执行继续同一快照。后续调用重新采集，支持完成认证后的能力及同一 prompt 内的模型切换。

不能绑定到现有 immutable file-history executionContext：它在认证前就可能捕获。也不把整轮 beginTurn 固定为唯一媒体配置，因为普通图片可以触发同一 prompt 的 full-turn vision reroute。快照参与准备摘要，Runtime Entry 保留它；相同调用重试但快照变化必须拒绝，不把已批准引用热替换。现有 invocationId、Session、prompt、call、policy 和参数引用继续构成调用身份。

Runtime 根据已准入的原生工具生成该调用的 Config 视图，读取解析后的能力，保留同一工作区、读取缓存和父文件历史。不要全局修改 Config，也不扩展现有严格 InvocationContextV1 wire 的字段。只接受实际支持媒体上下文的工具，跨 Session、未知字段、错误布尔类型和未经绑定的能力都失败；省略元数据的旧私有调用不获得额外能力。Gateway 不通过这个快照传模型 ID、endpoint、密钥或用户 Prompt。

## 原生工具与传输

Read 的物理读取仍使用 processSingleFileContent；给它显式传递有效输入能力，使 Tool-only 视图不必伪造 ContentGeneratorConfig。普通调用省略该选项时保留现有行为。ZoomImage 抽取共享公共声明，Gateway 使用 Runtime proxy，Runtime 按原生 registry 准入，复用原生校验、权限、解码和返回内容，不复制图像算法。

第一版采用独立的 v2 媒体响应预算和结构检查，不引入尚无必要的 artifact/chunk 生命周期。execute、settled status、settled cancel 都要处理媒体；manifest、历史和其他控制、v1 的上限保持原边界。只对原生工具结果 llmContent 中合法 inlineData 扣除媒体字节，普通文本/metadata 继续原控制预算，组合上限不得超过已有 64 MiB ACP 帧能力并预留 envelope。校验字段类型、base64、媒体聚合字节和包络，边读边限制实际字节，不信任 Content-Length。保留原生尺寸限制与可观察错误，不额外截断图片/PDF页。首张 PDF 例外和接近原有帧上限的行为必须在定向测试中明确，不能把 25 MiB 当作无条件硬上限。

这不是抬高所有工具与历史的公共额度。若实测原生支持的结果无法通过现有 ACP framed transport，才以该反例设计分块；分块必须另行解决访问身份、幂等、并发 close 时取回和释放顺序，不能先返回一个无法取回的 worker 路径。

直接 Local/ACP v2 目前只有整体帧与结构限制，不能把 HTTP 的 8 MiB 控制预算额外施加到它。共享检查在 Tool-only dispatcher 返回前验证媒体与 ACP 包络，避免让超限结果直接导致父进程关闭整个 ACP child；HTTP 再按实际收到的字节减去合法媒体字符串长度验证原有控制预算。空白、转义、重复 JSON 键和额外字段都必须继续计入实际控制字节。

ACP 的 64 MiB 单帧限制不等于并发队列容量保证：接收队列也只有 64 MiB，小消息最低占用 256 KiB，且有 depth=64、nodes=10000、array=4096 的结构限制。预留包络不能证明两条近上限结果与控制消息共存。需要验证 execute 与 settled status/cancel 的相邻回执，记录实际可达的原生 PDF 首张大图行为；不能仅凭一个 HTTP 测试声称完成了并发传输验收。

空字符串是零字节的标准 base64 编码。原生 Read 可以对空音频、视频或原生 PDF 返回这样的 inlineData；传输层保留它并计 0 媒体字节，不自行判定文件能否播放或被模型理解。新增校验曾拒绝空 WAV 的真实成功回执，导致 execute/status/cancel 反复拒绝，Session.close 无法到达 release；已按该真实反例修正编码判断，完整原生结果及 PostToolUse 回执不变。

通用超限或不可序列化结果的终态回执与关闭收敛仍须另行解决：当前拒绝结果不等于物理工具尚未执行，也不证明取消或资源释放完成。不能把已经完成的副作用改记为 not_started/cancelled 后重试，亦不能静默丢弃 Hook/产物。这是完整默认替换的剩余条件；本阶段空编码修复不引入新的回执协议。

## PDF 模型调用

给原生 Read 注入专用 PDF bridge executor。普通实例继续调用现有 runVisionBridge；Managed 实例生成受控的 Gateway 工作请求并等待答复。原生 transcribePdfCandidate 在 Runtime 保留 renderedRange、continuation、fallback、Stats、完整转写检查、unsafe media 拒绝、notice、错误分类和缓存记录，随后再结束 native execute，执行既有 Hook。这样无需复制 PDF 回退算法或事后回滚错误的成功记录。

pending 请求属于已批准 invocation，带完整引用、requestId 和摘要。status 只公布小型请求标识；专用私有读取获取原生图片和 PDF sourceContext，专用完成操作回传有界 VisionBridgeResult。所有层按 live-session-owner 作用域验证同一工作区/lease；不接受 Runtime 指定模型、URL、凭据、提示词或新预算。Gateway 使用原 runVisionBridge/runSideQuery 与绑定 Config 的路由规则，并按请求幂等，避免重连重复调用模型。普通图片继续既有 Gateway 后处理与整轮换模行为。

模型准备能力与实际模型选择由 Gateway 保留。每个 invocation 的取消需要联动原 Gateway turn，同时转写计数继续共享原 turn 的图片预算身份；不能每次 HTTP/status 都生成一个新预算信号。实现时需要把服务的预算身份与单次取消信号明确分开并验证，保持默认路径原义。

pending bridge 时工具仍 executing。cancel/release 先封新执行并取消模型请求，允许已经接纳的工作答复作为 drain 回传；等待 Gateway 查询终结、Runtime 原生取消/结果处理、Hook 与 execute 结算，再确认释放。cancelAndDrain 不能停止服务已有回传而死锁，也不能用 Promise.race 提前宣告排空。Gateway 查询在取消前尚未开始时也必须有确定的未执行答复；失联/超时只按明确的失败规则结算，不猜测成功或重复收费。

PDF物理进程取消也需要真实验证：目前 extractPDFText 支持 signal，但 Read 的调用点未传；页面渲染函数没有 signal 参数。这只是源码线索，先复现，再按所属进程退出和临时目录清理补齐，不能把模型取消当作 pdftoppm 已退出。

## 用户展示

DisplayImage 的主/子作用域来自 Gateway 的实际调用位置，不能以 worker 缺少 fork AsyncLocal 状态作为允许执行的依据。非交互客户端延续准确的渲染不支持结果；对支持展示的客户端，Gateway 必须使用该客户端的真实能力，并经现有产物/附件机制取得所属 Runtime 的内容和可展示引用。native 工作区与 PNG 检查留在 Runtime，不能传一个仅在 worker 可读的绝对路径给远端 UI 后报告成功。仅声明 registry 或伪造 available=true 不算展示接通。

## 分阶段实施和验收

| 阶段 | 实际交付                                                             | 关键验收                                                                                                                                                   |
| ---- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1   | invocation 媒体快照、Read 有效模态、原生 Zoom proxy、v2 媒体响应预算 | 认证后能力、同 prompt 后续调用换模、旧引用稳定；真实 Read/Zoom/原生 PDF 图像返回；大于 8 MiB 媒体跨完整链路，普通超限文本仍拒绝；权限/父子缓存和关闭不回退 |
| M2   | 原生 PDF executor 注入与 Gateway bridge 请求/答复                    | 成功与每种原生 fallback/notice 一致；失败/取消的缓存与 Hook；零 worker 模型请求；共享 turn 图片预算、重连不重复；模型和 PDF 进程取消/释放真实排空          |
| M3   | DisplayImage 调用作用域、真实客户端能力和产物路径                    | fork 执行禁止、非交互失败准确、支持客户端实际可见且不泄露私有路径；身份与关闭时的产物可达性                                                                |

各阶段包括设计、E2E计划、全局 CLI 基线、隔离完整 host 反例与修复验收，相关包定向测试、build/typecheck/bundle、两次自审和独立审查。M1 已实施、限定验收见下文；M2/M3 待实施。M1 是完整多媒体迁移的依赖，不替代 M2/M3，也不把默认入口、全部客户端或旧会话迁移改为可选项。

主要代码涉及 core 的 managed protocol/runtime/proxy/session、Read/Zoom/Display 与共享声明、fileUtils、PDF/Vision Bridge 服务；CLI 的 Managed Session、Local/Remote/AutoLocal provider、私有 worker routes、ACP dispatcher；ACP Bridge 方法和转发；各文件的原生与定向回归。改动前列出每个新增字段和方法的完整消费链，逐层验证准入、响应等待与 drain 所有权。

## M1 实施与验收记录

Gateway 的 Read/Zoom 代理在首次准备前捕获严格解析的能力快照，私有 prepare 将其传到所属 Runtime，参与调用摘要。Runtime 按注册结果构造原生 Read/Zoom 的调用 Config 视图，显式共享该作用域的 FileReadCache 与 FileService；没有创建模型生成器或全局修改 Config。Zoom 的公共声明、延迟发现、searchHint 和分类输入保持迁移前摘要一致。省略媒体元数据的旧调用不隐式获得图像能力。

v2 execute/settled status/settled cancel 的组合响应上限为原 ACP 64 MiB 减去 64 KiB 包络预留。原生结果在写入 ACP 前做结构与编码检查；HTTP 保留实际流字节上限，并将非媒体控制内容限制在原有 8 MiB。单测验证合法媒体、空编码、非规范 base64、重复 JSON 键、转义膨胀、尾随空白、Hook 元数据、超限结构与旧 v1/历史额度，未放宽共享 ACP 队列。

全局 `qwen 0.22.3` 的隔离基线先验证原生图片 Read、Zoom 和 PDF 页面输出。修改前完整 Managed host 复现 Read 返回不支持图像、Zoom 仍在 Gateway 读取文件、PDF 未回退为图像；这些命令按“预期缺陷复现”退出 0，不记为功能通过。所有模型服务请求均发往自有 localhost 夹具，Config 通过公开 modelProviders generationConfig.modalities 和实际认证解析能力。

本阶段最终顺序 build/typecheck/bundle 通过，bundle SHA-256 为 `5702a684a46f01881bfba5a96e4b4ffa0470d5d54a67aec2d592e167f3555254`。633 项去重定向测试通过（Core 483、CLI 109、ACP 41；另外 831 项 ACP 测试未选中，不计入通过数），修改文件 lint/格式检查及连续两轮自审通过。认证后的能力、同 prompt 后续调用变化、旧引用稳定、并发能力隔离、未注册工具拒绝和 Read→Notebook 缓存连续性由定向测试覆盖；它们不代表所有组合均完成真实客户端验收。

最终冻结构建的两组完整 host 复验通过，真实原生 worker 输出、v2 物理回执与实际 Gateway 模型输入逐项字节数、顺序及 SHA-256 一致。Read 的 JPEG 为 38,290 字节（51,056 base64 字节），Zoom 为 107,584 字节（143,448 base64 字节）；PDF 由真实 worker 的 pdftoppm 渲染六页，共 9,907,128 base64 字节，超过旧 HTTP 8 MiB 限制。两组分别发生 3 次和 2 次 Gateway 模型请求，worker 模型推理、Gateway 原生媒体执行及媒体文件读取均为 0；流式与持久历史都包含最终回答。

PDF 历史实际分页三次，最终回答在第三页。早先夹具只检查第一页，导致一次已成功媒体调用被测试判为失败；保留该失败，修正为跟随 cursor 直至 hasMore=false 后重跑通过。最终两组各收到一次严格 HTTP 200 v2 released=true 回执，81 项源码/构建摘要前后与预检一致，所有自有进程、四个端口、临时根及 PDF 渲染目录完成清理，没有超时或兜底终止信号。

独立审查复核了完整生产/测试改动、字段消费链、路由归属和最终运行记录，没有新增阻塞性发现。PDF 组保留了实际 postHook.hookError，不能据该组宣称所有 Hook 成功；空 WAV 的实际 Hook 次数是下述独立证据。缺失的 /review 技能未被冒称执行，本阶段采用直接独立源码审查。

空 WAV 的内部真实 native/dispatcher/ManagedToolSession 夹具已复验通过：execute、settled status/cancel 重复查询均保留完整 native 与 Hook DTO，媒体预算为 0；Runtime Pre/Post Hook 各执行一次，正常 close 到达一次 release。修改前同夹具确认原生 physical success，但六次查询及两次 close 均拒绝、release 为 0，随后进行了明确标注的手动底层清理。固定后 83 项源码/构建摘要一致，测试进程、端口和临时根已清理；本组 provider/transport 使用本地适配，不声称覆盖 HTTP worker lease 或音频模型转换。

目前真实运行平台仅 macOS。设计要求的 M2/M3、PDF 物理取消、媒体首张例外和近上限并发回执、通用不可交付结果的关闭收敛、全部客户端和三个默认 factory 切换仍待完成。当前 4170 预览未访问或重启，用户数据不参与隔离测试。
