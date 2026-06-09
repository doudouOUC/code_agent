# Wire `clearDetailedSpanState()` into chat compression cleanup

## Context

`detailed-span-attributes.ts` uses a module-level `seenHashes: Set<string>` to deduplicate system prompt / tool schema full content on spans — first occurrence emits full text, subsequent ones only emit hash + preview. After chat compression, the conversation is rebuilt and system prompt / tool schemas are re-injected, but `seenHashes` isn't cleared, so post-compression spans silently lose full content. This matters most for long-running daemon/qwen-serve sessions that compress multiple times.

Claude Code handles this via `clearBetaTracingState()` called from a centralized `runPostCompactCleanup()`. Qwen-code has no equivalent centralized cleanup — post-compression state resets are inline in `GeminiChat.tryCompress()`.

## Changes

### 1. Export `clearDetailedSpanState` from telemetry barrel

**File:** `packages/core/src/telemetry/index.ts` (line 175 area)

Add `clearDetailedSpanState` to the existing `detailed-span-attributes.js` re-export block:

```ts
export {
  addUserPromptAttributes,
  addSystemPromptAttributes,
  addToolSchemaAttributes,
  addModelOutputAttributes,
  addToolInputAttributes,
  addToolResultAttributes,
  truncateContent,
  clearDetailedSpanState,  // <-- add
} from './detailed-span-attributes.js';
```

### 2. Call `clearDetailedSpanState()` in `GeminiChat.tryCompress()`

**File:** `packages/core/src/core/geminiChat.ts` (line ~1402)

Add the call in the `COMPRESSED` success branch, alongside the existing FileReadCache clear:

```ts
if (info.compressionStatus === CompressionStatus.COMPRESSED && newHistory) {
  // ... existing recording, setHistory, FileReadCache clear ...
  this.config.getFileReadCache().clear();
  clearDetailedSpanState();  // <-- add here, after FileReadCache clear
  this.lastPromptTokenCount = info.newTokenCount;
  // ...
}
```

Import at top of file (alongside existing telemetry imports from `../telemetry/loggers.js`):
```ts
import { clearDetailedSpanState } from '../telemetry/detailed-span-attributes.js';
```

### 3. Add a test case

**File:** `packages/core/src/telemetry/detailed-span-attributes.test.ts`

Add a test in the existing `clearDetailedSpanState` describe block verifying that after clear, both system prompt and tool schema are re-emitted in full (not just hash/preview).

## Why `tryCompress()` is the right insertion point

`tryCompress()` is the single convergence point for all compression paths:
- Pre-send hard-tier rescue (line 1579)
- Reactive overflow recovery (line 1891)
- Manual `/compress` + ACP compress (via `GeminiClient.tryCompressChat()`)

All three funnel through `tryCompress()`, so one call site covers everything.

## Verification

```bash
cd packages/core
npx vitest run src/telemetry/detailed-span-attributes.test.ts
npx vitest run src/core/geminiChat.test.ts
npm run typecheck
```
