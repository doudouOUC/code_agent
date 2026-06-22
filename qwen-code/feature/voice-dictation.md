# Voice dictation 技术方案

> 适用范围：`QwenLM/qwen-code` CLI 输入框语音听写能力。
> 涉及 PR：#5502（voice dictation with native capture, streaming, and biasing）。
> 状态：2026-06-22 已合入；上周 PR 口径中属于 W25 创建、06-22 合入的跨周尾部 PR。

---

## 1. 背景与动机

Voice dictation 让用户在交互式 CLI 的空输入框里直接说话生成 prompt。它不是独立语音服务，而是复用现有 OpenAI-compatible / DashScope provider 配置，把音频采集、批量或实时 ASR、输入框状态和模型选择统一进 qwen-code 现有 CLI/TUI 体系。

核心目标：

- `/voice hold|tap|off|status` 控制听写；hold 模式按住 Space 说话，tap 模式按一次开始、再按一次或静音自动结束。
- `/model --voice <id>` 选择 ASR 模型；`general.voice.{enabled,mode,language}` 持久化用户偏好。
- 本机采集优先使用 `@qwen-code/audio-capture` 原生 addon，Linux 可回退 `arecord`，再回退 SoX。
- `qwen3-asr-flash` 走批量转写；realtime 模型走 WebSocket PCM streaming 并显示 partial transcript。

---

## 2. 整体架构

```mermaid
flowchart TB
  KEY["空 prompt 下 Space / /voice 命令"] --> HOOK["useVoiceInput"]
  HOOK --> REC["VoiceRecorder 抽象"]
  REC --> NATIVE["@qwen-code/audio-capture<br/>miniaudio N-API"]
  REC --> AREC["arecord fallback"]
  REC --> SOX["SoX fallback"]
  HOOK --> MODEL["voice model resolver<br/>/model --voice"]
  MODEL --> BATCH["batch ASR<br/>chat/completions + input_audio"]
  MODEL --> RT["realtime ASR<br/>WebSocket PCM stream"]
  BATCH --> POST["转写结果写回 InputPrompt"]
  RT --> PARTIAL["partial transcript + VoiceIndicator"]
  PARTIAL --> POST
```

实现按三层切开：

| 层 | 作用 | 代表路径 |
|---|---|---|
| 音频采集 | native mic、permission query、fallback recorder、silence stop | `packages/audio-capture/`、`packages/cli/src/ui/voice/*recorder.ts` |
| 转写协议 | batch `input_audio`、realtime WebSocket、重试、语言/词表 bias | `voice-transcriber.ts`、`voice-stream-session.ts`、`qwen-asr-realtime-session.ts` |
| TUI 集成 | `/voice`、`/model --voice`、Space key matcher、状态/音量/partial UI | `voice-command.ts`、`use-voice-input.ts`、`VoiceIndicator.tsx` |

---

## 3. 关键实现

### 3.1 采集后端与 fallback

PR #5502 新增 `packages/audio-capture`，用 miniaudio 封装跨平台麦克风采集。CLI 侧抽象出 recorder interface，优先加载 native backend；不可用时 Linux 回退 `arecord`，再回退 SoX。这样普通安装路径依赖预编译产物，开发或 CI 可以通过 `node-gyp` 构建验证。

macOS 增加麦克风权限查询，避免无权限时只表现为“没有声音”。原生加载有冷启动预热，降低第一次按 Space 时 addon 初始化吞掉交互的概率。

### 3.2 batch 与 realtime 两条 ASR 路径

模型 id 决定转写路径：

- `qwen3-asr-flash`：把录音后的音频作为 OpenAI-compatible `chat/completions` 的 `input_audio` 发送，得到一次性结果。
- `qwen3-asr-flash-realtime`、`fun-asr-realtime`、`paraformer-realtime-v2` 等：把 PCM chunk 推到 WebSocket，实时展示 partial transcript，最终结果写回输入框。

两条路径都会使用语言偏好和开发术语 keyterms 做 bias，但不发送项目路径或 git branch 元数据。若非语音音频导致模型只回显 bias 词，结果会被丢弃，避免把提示词噪声写进用户输入。

### 3.3 输入框状态机

`useVoiceInput` 负责把 key event、voice mode、recorder、transcriber 和 `InputPrompt` 串起来：

- hold：空 prompt 下按住 Space 开始录音，释放后停止并转写。
- tap：第一次 Space 开始，第二次 Space 或 silence auto-stop 结束。
- off：Space 恢复普通输入行为。

`VoiceIndicator` 渲染 recording / transcribing / error 状态、音量条和 realtime partial transcript。转写完成只更新输入框内容，不直接绕过用户提交动作。

---

## 4. 设计约束

- **默认 opt-in**：语音由 `general.voice.enabled` 和 `/voice` 控制，不改变默认键盘输入。
- **不新增专用后端**：ASR 走已有 provider 配置，减少凭据和 endpoint 的新分支。
- **跨平台以预编译优先**：native addon 是最大风险面，因此通过 prebuildify + node-gyp-build + CI matrix 降低安装门槛。
- **隐私边界**：bias 只使用全局开发术语，不采集项目路径、git branch 等本地上下文。

---

## 5. 涉及 PR

| PR | 状态 | 作用 |
|---|---|---|
| #5502 | merged | 新增 voice command、voice model 选择、native/fallback recorder、batch/realtime ASR、VoiceIndicator、设置 schema、打包与 prebuild CI。 |

---

## 6. 已知限制 / 后续

1. **Windows/Linux live mic 端到端仍依赖 CI 与后续实机验证**。PR 本地主要验证 macOS；Windows/Linux prebuild 与 realtime mic-to-WebSocket 需要持续关注。
2. **hold 模式依赖终端按键行为**。终端通常没有 key-up 事件，release 检测依赖 key repeat/输入事件模型，不同终端可能存在交互差异。
3. **语音 telemetry 未纳入本次 PR**。当前文档仅覆盖输入与转写链路，不把 voice 事件指标归入 telemetry 专题。

_新增于 2026-06-23_
