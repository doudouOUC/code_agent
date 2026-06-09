# Plan: Add Detailed Span Content Attributes (Align with Claude Code Beta Tracing)

## Context

Currently `includeSensitiveSpanAttributes` only controls whether 6 sensitive keys are stripped in `LogToSpanProcessor` (log-to-span bridge). Direct spans (`tool.<name>`, `api.generateContent`, `api.generateContentStream`, `qwen-code.interaction`) carry no content data — no tool input/output, no model output, no system prompt, no user prompt.

Claude Code's `ENABLE_BETA_TRACING_DETAILED` adds rich content attributes to every span type. We want to align `includeSensitiveSpanAttributes` to provide equivalent capability, gated by the same existing flag.

## Design

### New module: `packages/core/src/telemetry/detailed-span-attributes.ts`

A standalone module (analogous to claude-code's `betaSessionTracing.ts`) containing:

#### Utilities

```typescript
const MAX_CONTENT_SIZE = 60 * 1024; // 60KB

export function truncateContent(
  content: string,
  maxSize?: number,
): { content: string; truncated: boolean };

function shortHash(content: string): string;
// SHA-256 first 12 hex chars, for system prompt and tool schema dedup
```

#### State

```typescript
const seenHashes = new Set<string>();
// tracks system prompt hashes (sp_xxx) and tool schema hashes (tool_xxx)
// to avoid sending full content more than once per session

export function clearDetailedSpanState(): void;
// clears seenHashes, called from clearSessionTracingForTesting
```

#### Attribute functions (all no-op when flag is false)

Each function takes a `Config` as first arg. Guard logic (return early if any fails):
1. `isTelemetrySdkInitialized()` — avoid serialization cost when SDK is off
2. `config.getTelemetryIncludeSensitiveSpanAttributes()` — respect the flag

**1. `addUserPromptAttributes(config, span, promptText)`**

Sets on interaction span:
- `new_context`: `"[USER PROMPT]\n${promptText}"` (truncated 60KB)
- `new_context_truncated`: boolean (if truncated)
- `new_context_original_length`: number (if truncated)

**2. `addSystemPromptAttributes(config, span, systemInstruction)`**

Sets on LLM request span:
- `system_prompt_hash`: `"sp_${shortHash(systemPrompt)}"`
- `system_prompt_preview`: first 500 chars
- `system_prompt_length`: number

First-time hash: emit full content via `span.setAttribute('system_prompt', truncatedContent)`.

**3. `addToolSchemaAttributes(config, span, tools)`**

Sets on LLM request span:
- `tools`: JSON array of `{name, hash}` objects
- `tools_count`: number

First-time per hash: emit full tool JSON via `span.addEvent('tool_schema', {tool_name, tool_hash, tool_definition})`.

**4. `addModelOutputAttributes(config, span, responseText)`**

Sets on LLM request span (at end):
- `response.model_output`: truncated 60KB
- `response.model_output_truncated`: boolean (if truncated)
- `response.model_output_original_length`: number (if truncated)

**5. `addToolInputAttributes(config, span, toolName, toolInput)`**

Sets on tool span (at start):
- `tool_input`: `"[TOOL INPUT: ${toolName}]\n${serializedInput}"` (truncated 60KB)
- `tool_input_truncated`: boolean (if truncated)
- `tool_input_original_length`: number (if truncated)

**6. `addToolResultAttributes(config, span, toolName, toolResult)`**

Sets on tool span (at end):
- `tool_result`: `"[TOOL RESULT: ${toolName}]\n${serializedResult}"` (truncated 60KB)
- `tool_result_truncated`: boolean (if truncated)
- `tool_result_original_length`: number (if truncated)

> Note: Claude Code uses `new_context` for tool results; we use `tool_result` for clarity since our span model differs.

---

### Call site changes

#### 1. `packages/core/src/core/client.ts` (~line 930)

After `startInteractionSpan()`, add user prompt:

```typescript
if (isTopLevelInteraction) {
  startInteractionSpan(this.config, { ... });
  // NEW: add user prompt content when flag is enabled
  addUserPromptToInteractionSpan(this.config, partToString(request));
}
```

This requires a new helper in `session-tracing.ts` that retrieves the current interaction span and calls `addUserPromptAttributes`. Or simpler: `startInteractionSpan` returns the span, and we pass it. But current API returns void.

**Approach**: Add a new export `addInteractionSpanAttributes(config, attrs)` to `session-tracing.ts` that accesses the current interaction span via ALS and calls `span.setAttributes()`. This keeps the existing `startInteractionSpan` API unchanged.

#### 2. `packages/core/src/core/loggingContentGenerator/loggingContentGenerator.ts`

**Non-streaming (`api.generateContent`, line 213):**

At span start (inside `withSpan` callback):
```typescript
addSystemPromptAttributes(this.config, span, req.config?.systemInstruction);
addToolSchemaAttributes(this.config, span, req.config?.tools);
```

At span end (after response, ~line 234, only for non-internal prompts):
```typescript
if (!isInternal) {
  addModelOutputAttributes(this.config, span, responseText);
}
```

**Streaming (`api.generateContentStream`, line 294):**

At span start:
```typescript
addSystemPromptAttributes(this.config, span, req.config?.systemInstruction);
addToolSchemaAttributes(this.config, span, req.config?.tools);
```

At stream end (in `loggingStreamWrapper`, ~line 454, only for non-internal prompts):
```typescript
if (!isInternal) {
  addModelOutputAttributes(this.config, span, this.extractResponseText(consolidatedResponse));
}
```

Note: `systemInstruction` is type `ContentUnion` (string | Part | Content). The `addSystemPromptAttributes` function should stringify non-string values via `JSON.stringify`.

#### 3. `packages/core/src/core/coreToolScheduler.ts` (~line 1855)

At span start (inside `withSpan` callback, after line 1860):
```typescript
addToolInputAttributes(this.config, span, toolName, safeJsonStringify(toolInput));
```

At tool result — covers both success and error paths:

**Success path** (after line 2002, inside `if (toolResult.error === undefined)`):
```typescript
addToolResultAttributes(this.config, span, toolName,
  typeof content === 'string' ? content : safeJsonStringify(content));
```

**Error path** (after line 2190, inside `else` when `toolResult.error` exists):
```typescript
addToolResultAttributes(this.config, span, toolName,
  `ERROR: ${toolResult.error.message}`);
```

Note: cancelled and exception paths don't have a meaningful tool result to record.

---

### Barrel exports

**`packages/core/src/telemetry/index.ts`**: Add exports:
```typescript
export {
  addUserPromptAttributes,
  addSystemPromptAttributes,
  addToolSchemaAttributes,
  addModelOutputAttributes,
  addToolInputAttributes,
  addToolResultAttributes,
  truncateContent,
  clearDetailedSpanState,
} from './detailed-span-attributes.js';
```

**`packages/core/src/telemetry/session-tracing.ts`**: Add `addInteractionSpanAttributes()` export.

---

### Test file: `packages/core/src/telemetry/detailed-span-attributes.test.ts`

Tests:
1. `truncateContent` — under limit returns as-is; over limit truncates with marker
2. `shortHash` — deterministic, 12 chars
3. `addUserPromptAttributes` — sets `new_context` when flag true; no-ops when false
4. `addSystemPromptAttributes` — sets hash/preview/length; deduplicates via seenHashes
5. `addToolSchemaAttributes` — sets tools/tools_count; deduplicates individual tool schemas
6. `addModelOutputAttributes` — sets `response.model_output`; truncates large content
7. `addToolInputAttributes` — sets `tool_input` with prefix
8. `addToolResultAttributes` — sets `tool_result` with prefix
9. `clearDetailedSpanState` — resets seenHashes

---

### Serialization notes

- **`systemInstruction`** (`ContentUnion`): Can be `string | Part | Content`. Use `typeof si === 'string' ? si : JSON.stringify(si)`.
- **`tools`** (`Tool[]`): Array of tool definitions. Use `JSON.stringify` per tool for hashing; summary array `{name, hash}` for the span attribute.
- **`toolInput`** (`Record<string, unknown>`): Already serialized via `safeJsonStringify(toolInput)`.
- **`toolResult.llmContent`** (`PartListUnion`): Can be `string | Part[]`. Use `typeof content === 'string' ? content : safeJsonStringify(content)`.

---

### What we intentionally skip (can iterate later)

| Feature | Claude Code | Our approach | Reason |
|---------|-------------|-------------|--------|
| `response.thinking_output` | ant-only | Skip | No internal/external user distinction |
| Incremental message tracking | `lastReportedMessageHash` per agent | Skip | Complex state management, low priority |
| `system_reminders` extraction | Parses `<system-reminder>` tags | Skip | Architecture differs |
| Compaction-aware state reset | `clearBetaTracingState()` on compact | Partial | `clearDetailedSpanState()` exists but not wired to compaction yet |

---

## Files to modify

| File | Change |
|------|--------|
| `packages/core/src/telemetry/detailed-span-attributes.ts` | **NEW** — all attribute functions + truncation + hash dedup |
| `packages/core/src/telemetry/detailed-span-attributes.test.ts` | **NEW** — unit tests |
| `packages/core/src/telemetry/index.ts` | Add exports |
| `packages/core/src/telemetry/session-tracing.ts` | Add `addInteractionSpanAttributes()` |
| `packages/core/src/core/client.ts` | Call `addUserPromptAttributes` after `startInteractionSpan` |
| `packages/core/src/core/loggingContentGenerator/loggingContentGenerator.ts` | Call `addSystemPromptAttributes`, `addToolSchemaAttributes`, `addModelOutputAttributes` |
| `packages/core/src/core/coreToolScheduler.ts` | Call `addToolInputAttributes`, `addToolResultAttributes` |

## Verification

```bash
cd packages/core

# Unit tests
npx vitest run src/telemetry/detailed-span-attributes.test.ts

# Existing tests still pass
npx vitest run src/telemetry/session-tracing.test.ts
npx vitest run src/telemetry/log-to-span-processor.test.ts
npx vitest run src/core/coreToolScheduler.test.ts

# Type check
npx tsc --noEmit --project tsconfig.json
```

E2E verification:
```bash
QWEN_TELEMETRY_ENABLED=1 \
QWEN_TELEMETRY_OUTFILE=/tmp/telemetry.jsonl \
QWEN_TELEMETRY_INCLUDE_SENSITIVE_SPAN_ATTRIBUTES=1 \
node packages/cli/dist/index.js

# Then check /tmp/telemetry.jsonl for spans with tool_input, tool_result,
# response.model_output, new_context, system_prompt_hash attributes
```
