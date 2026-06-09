# Audit 8: Operational and User Experience Review

## Scope

Focused on user-visible behavior, model comprehension, latency, config discoverability, telemetry, and documentation gaps.

---

## Finding 1: User Display is Unaffected (Confirmed OK)

**Confidence: 95 (Verified)**

The `ToolResult` interface (`tools/tools.ts:422`) has two separate fields:
- `llmContent`: what goes into the model's conversation history
- `returnDisplay`: what the user sees in the terminal

In `coreToolScheduler.ts`, the gate modifies `content` (which is `toolResult.llmContent`, assigned at line 2838), while `resultDisplay` is set from `toolResult.returnDisplay` at line 3012 and is never touched by the gate. User-visible output is unaffected.

**One minor concern**: For tools that bypass existing truncation (i.e., the tools this gate targets), `returnDisplay` may contain the full large output. If a tool returns 1MB of text as both `llmContent` and `returnDisplay`, the gate compresses `llmContent` into a stub, but `returnDisplay` remains 1MB. This could cause TUI rendering slowness for extremely large outputs. However, in practice, most tools set `returnDisplay` to a short summary (e.g., shell tool builds a separate `returnDisplayMessage`), so this is LOW risk.

**Recommendation**: No action required. Document as a known characteristic.

---

## Finding 2: No System Prompt Guidance for `<persisted-output>` Pattern -- HIGH Risk

**Confidence: 92 (Critical)**

The plan introduces a new `<persisted-output>` XML tag that replaces large tool results. The stub contains a 2KB preview and a `To read the complete output, use the read_file tool.` instruction. However:

1. **No system prompt teaches the model about this pattern.** I searched `prompts.ts` (1164 lines) thoroughly -- there is zero mention of `persisted-output`, `persisted`, `read_file` in the context of truncated output, or any guidance about what to do when tool output is replaced with a stub.

2. **The existing shell/MCP truncation DOES include inline instructions** (in `truncation.ts:92-97`): "To read the complete output, use the read_file tool with the absolute file path above." This works because the model sees it inline with the tool result. The new gate's stub follows this same inline pattern, which is good.

3. **Risk scenario**: The 2KB preview may look like complete output. For example, if a grep search returns 50KB of results, the first 2KB might contain seemingly complete results and the model may conclude the search is done without reading the full file. The model has no training signal or system prompt telling it that `<persisted-output>` tags always represent partial content.

4. **The existing truncation marker `[CONTENT TRUNCATED]` is an established pattern** the model has been trained on. The new `<persisted-output>` tag is novel and untested against the model's behavior.

**Recommendation**:
- Add a brief system prompt instruction in `prompts.ts` about the `<persisted-output>` pattern: "When a tool result is wrapped in `<persisted-output>` tags, the output has been truncated and saved to disk. Use the read_file tool to access the full output when needed."
- Alternatively, reuse the existing truncation format (with `[CONTENT TRUNCATED]`) instead of inventing a new XML tag, since the model already knows how to handle that pattern.
- At minimum, add a test case verifying the model's response to a `<persisted-output>` stub (e.g., does it call `read_file`?).

---

## Finding 3: Unnecessary fsync on Hot Path -- MEDIUM Risk

**Confidence: 88 (Important)**

The plan specifies using `atomicWriteFile` for writing tool result files. `atomicWriteFile` defaults to `flush: true` (line 160 of `atomicFileWrite.ts`), which triggers `fsync` (line 310: `if (flush) await fd.sync()`).

For a tool result slightly over the 25K threshold:
- `stat()` on target path
- `writeFile()` to a temp file
- `fsync()` on the temp file (forces disk flush, 1-10ms on SSD, 10-100ms on HDD)
- `rename()` from temp to final path
- Potential `chmod()`

This runs on the hot path of every large tool result, AFTER the tool has already completed. The latency is additive to the user's perceived tool execution time.

These files are ephemeral and recoverable (the model can re-run the tool). If the process crashes, the tool result file is lost, but so is the conversation turn that referenced it. There is no durability requirement.

The existing `truncateAndSaveToFile` in `truncation.ts` uses `fs.writeFile` directly (line 89) WITHOUT fsync, demonstrating that the codebase already accepts non-durable writes for this use case.

**Recommendation**: Pass `{ flush: false }` when calling `atomicWriteFile` for tool result files. This preserves the atomicity guarantees (temp-file + rename) while skipping the unnecessary fsync. Add a code comment explaining why flush is disabled.

---

## Finding 4: `toolResultsMaxFileAgeMinutes` Not in Settings Schema -- MEDIUM Risk

**Confidence: 90 (Important)**

The plan adds `toolResultsMaxFileAgeMinutes` to `ConfigParameters` in `config.ts`, but does NOT add a corresponding entry in `packages/cli/src/config/settingsSchema.ts`. The existing truncation settings (`truncateToolOutputThreshold`, `truncateToolOutputLines`) ARE registered in the settings schema (lines 1804-1821) with type, label, category, description, and default values.

Without a settings schema entry:
- The setting will NOT appear in the `/settings` dialog
- Users cannot configure it via settings JSON files
- There is no validation of the value
- `qwen-code --help` or similar discovery mechanisms won't surface it

The setting is effectively invisible and hardcoded to the default (1440 minutes / 24h).

**Recommendation**: Add a `toolResultsMaxFileAgeMinutes` entry to `SETTINGS_SCHEMA` in `settingsSchema.ts`, following the pattern of the existing truncation settings:
```typescript
toolResultsMaxFileAgeMinutes: {
  type: 'number',
  label: 'Tool Result File Max Age',
  category: 'General',
  requiresRestart: false,
  default: 1440,
  description: 'Maximum age in minutes for persisted tool result files before cleanup. Set to -1 to disable cleanup.',
  showInDialog: false,
},
```

---

## Finding 5: Telemetry Event Reuse Creates Ambiguity -- MEDIUM Risk

**Confidence: 86 (Important)**

The existing `ToolOutputTruncatedEvent` (`telemetry/types.ts:695`) has these fields:
- `tool_name`
- `original_content_length`
- `truncated_content_length`
- `threshold`
- `lines` (number of lines kept)

The plan mentions emitting telemetry on failure (F1) and implies using this event for the gate. Problems:

1. **No `source` discriminator**: If the gate reuses `ToolOutputTruncatedEvent`, there is no way to distinguish "shell tool truncated its output" from "scheduler gate persisted large result to disk." Both emit the same `tool_output_truncated` event name. This makes it impossible to debug or measure the gate's behavior independently.

2. **The `lines` field is meaningless for the gate**: The gate operates on character count, not line count. Setting `lines: 0` or an arbitrary value would be misleading.

3. **Semantic difference**: The existing event means "content was truncated in-memory and a file was saved." The gate's event should mean "content was persisted to disk and replaced with a stub." These are different operations with different failure modes.

**Recommendation**: Create a new `ToolResultPersistedEvent` telemetry event class with fields appropriate to the gate:
```typescript
export class ToolResultPersistedEvent implements BaseTelemetryEvent {
  readonly eventName = 'tool_result_persisted';
  tool_name: string;
  original_content_length: number;
  stub_content_length: number;
  bytes_written: number;
  output_file: string;
  prompt_id: string;
}
```
Additionally, add a separate `ToolResultPersistFailedEvent` for the failure case (F1), so failures are explicitly tracked rather than silently mixed into a generic truncation event.

---

## Finding 6: No Documentation or Changelog -- LOW Risk

**Confidence: 82 (Important)**

The plan does not mention:
- Updating any user-facing documentation
- Adding a changelog entry
- Migration notes

While the feature is mostly transparent (users shouldn't notice changed behavior), there are user-observable effects:
1. A new `tool-results/` subdirectory appears in the project temp dir
2. The model may start issuing more `read_file` calls for large outputs (changed behavior)
3. A new config setting `toolResultsMaxFileAgeMinutes` exists but is undocumented

The existing truncation settings (`truncateToolOutputThreshold`) have `showInDialog: false` and no external documentation either, so this is consistent with current practice. However, since this feature changes model behavior (the model receives stubs instead of full content), it would benefit from at least a changelog entry.

**Recommendation**: Add a brief entry to the changelog (if one exists) noting that large tool results are now persisted to disk and replaced with previews, and that this may result in additional `read_file` calls from the model.

---

## Summary

| # | Finding | Severity | Action |
|---|---------|----------|--------|
| 1 | User display unaffected | OK (verified) | None |
| 2 | No system prompt for `<persisted-output>` | Critical (92) | Add prompt guidance or reuse existing truncation format |
| 3 | Unnecessary fsync on hot path | Important (88) | Pass `flush: false` to atomicWriteFile |
| 4 | Config not in settings schema | Important (90) | Add to SETTINGS_SCHEMA |
| 5 | Telemetry event ambiguity | Important (86) | Create distinct ToolResultPersistedEvent |
| 6 | No documentation/changelog | Important (82) | Add changelog entry |
