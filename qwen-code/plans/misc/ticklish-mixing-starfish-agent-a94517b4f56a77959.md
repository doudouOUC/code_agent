# Audit 7 Findings: Phase 4 Tool Result Disk Overflow

## Investigation Summary

Six angles investigated: background shell output bypass, sub-agent Config propagation, MCP streaming, returnDisplay bounding, existing test breakage, and `<persisted-output>` tag collision.

## Findings

### Finding 1: Session budget accounting splits across sub-agent Config overrides (Important, 85%)

**Location**: Plan section 3, line ~189

The plan places `toolResultBytesWritten` on the `Config` class and tracks it via `this.config.trackToolResultBytes()`. Sub-agents receive a Config override created via `Object.create(parentConfig)` (see `subagent-manager.ts:724`, `agent.ts:1639`). JavaScript prototype delegation means:

- Reading `getToolResultBytesWritten()` on the override initially falls through to the parent prototype and returns the parent's counter.
- The first `trackToolResultBytes(n)` call on the override executes `this.toolResultBytesWritten += n`. Because `toolResultBytesWritten` is a private numeric field initialized to `0` on the parent, the `+=` assignment creates an **own property** on the override object. From that point forward, the sub-agent tracks its own isolated counter, never incrementing the parent's budget.
- Multiple concurrent sub-agents each see their own zero-start counter, effectively multiplying the 500MB session budget by `1 + number_of_sub-agents`. A session that spawns 5 parallel sub-agents each producing 400MB would write 2GB total while each individual counter stays under 500MB.

**Fix suggestion**: Move the budget counter to a shared mutable holder (e.g., `{ value: number }` object reference) on the root Config, not a primitive field. Alternatively, use an `AtomicBudget` class instance that is shared via reference identity across prototype-delegated overrides. Object references survive prototype inheritance without shadowing.

### Finding 2: `contentLength` stale on the error branch after gate application (Important, 84%)

**Location**: Plan section 3, line ~182; `coreToolScheduler.ts:3070`

The plan adds a gate in the error branch (lines 3061-3070) that rewrites `errorMessage` when it exceeds the threshold. However, the error response is constructed at line 3070 via `new Error(errorMessage)` -> `createErrorResponse()`. The `createErrorResponse` at line 692 computes `contentLength: error.message.length`. This is **already the post-gate value**, so it is correct in isolation.

BUT: the plan's success-branch `contentLength` recalculation (line ~169-176) explicitly recalculates after the gate. The error branch has no equivalent recalculation. While the error branch's `contentLength` is computed from `errorMessage` at construction time (line 710: `contentLength: error.message.length`), that is the **original** `errorMessage` length if the gate was not applied (when `isAlreadyTruncated` returns true and the gate is skipped). This is actually fine -- if skipped, the content is unchanged, so the original length is correct. However, if the gate IS applied and rewrites `errorMessage`, the new `createErrorResponse` at line 3070 already uses the rewritten value. This is correct.

**Verdict**: No bug here on closer inspection. Withdrawing this finding.

### Finding 3: Background shell terminal notification XML can carry unbounded `<output-tail>` (Important, 83%)

**Location**: `backgroundShellRegistry.ts:470`, plan's cleanup section

When a background shell completes, `BackgroundShellRegistry.emitNotification()` constructs an XML envelope that includes an `<output-tail>` element containing the last N bytes of the `.output` file (line 470). This notification text is delivered as a user message (not a tool result) via `notificationCallback` -> `submitQuery(item.modelText, SendMessageType.Notification)` (see `useGeminiStream.ts:2610`). Since it is injected as a user message, it **bypasses the tool result gate entirely**.

The `output-tail` is typically bounded by `readOutputTail()` (which reads a capped number of bytes from the end of the file). However, the `<result>` element in the `<task-notification>` XML for background **agents** (not shells) can contain the agent's `entry.result` string (see `background-tasks.ts:796`), which is the full `finalText` from `bgSubagent.getFinalText()`. This agent result string is NOT bounded by the gate because it is constructed AFTER the sub-agent's execution and injected directly into the notification XML.

The plan focuses exclusively on the tool result gate inside `CoreToolScheduler._executeToolCallBody`. Notification payloads from `BackgroundTaskRegistry.emitNotification()` and `BackgroundShellRegistry.emitNotification()` are a separate ingress path into the model's context that the plan does not address.

**Fix suggestion**: Document this as a known limitation, or add size capping to the notification XML construction in `emitNotification()`. The notification's `<result>` field in `background-tasks.ts:796` should be truncated to a reasonable size (e.g., 2KB) to match the gate's preview behavior.

### Finding 4: `<persisted-output>` tag in tool result content is not sanitized against model injection (Important, 82%)

**Location**: Plan section 2 line ~113; `xml.ts`

The plan introduces a `<persisted-output>` XML tag in the stub text that replaces large tool results. This tag appears inside the tool result content (the `text` field of a Part, which becomes `response.output` in the `FunctionResponse`). A future tool result that legitimately contains the string `</persisted-output>` could prematurely close the envelope.

More critically: `escapeSystemReminderTags()` in `xml.ts` only escapes `<system-reminder>` tags. It does not escape `<persisted-output>`. If a malicious or accidental tool output contains `<persisted-output>` tags, and the model later sees both real and spoofed versions, it could be confused about which outputs were persisted vs. inline.

However, since `<persisted-output>` appears inside a `functionResponse.response.output` string (not in a system-prompt envelope), the risk is lower than system-reminder injection. The tag is model-guidance metadata, not a trust boundary. Still, the `isAlreadyTruncated()` check (which prevents double-filing) does NOT check for `<persisted-output>`. If a tool result happens to contain the string `<persisted-output>` naturally, the gate would still process it (it only checks for `[CONTENT TRUNCATED]`). This is fine -- the gate checks size, not content markers, so there's no false-skip issue with `<persisted-output>`.

**Verdict**: Low risk. No collision with existing tags (confirmed by grep). `<persisted-output>` is not used anywhere in the codebase. The tag lives inside tool result content, not in a system-level envelope. Consider adding an `isAlreadyPersisted()` check that detects `<persisted-output>` to prevent re-persisting a stub, but this is defense-in-depth, not a bug.

### Finding 5: Chat recording captures post-gate (truncated) content, making session resume see stubs instead of full output (Important, 82%)

**Location**: `coreToolScheduler.ts:3247`, `coreToolScheduler.ts:3008`

The `recordToolResults` method at line 3247 records `call.response.responseParts`, which are built from `content` at line 3008 **after** the gate has already replaced large content with stubs. The chat recording service stores these truncated `responseParts` into the JSONL session recording.

When a session is resumed from disk, the restored conversation history will contain the stub text (`<persisted-output>... Preview (first 2000 chars)...</persisted-output>`) instead of the original tool result. The plan already acknowledges in "Known Limitation 2" that the persisted file may have been cleaned up by that time, and the stub notes the 24h expiry. However, there is a subtle interaction: during compaction/micro-compact, the compactor sees the stub text and may further summarize it, losing even the 2KB preview.

This is already documented as a known limitation. No additional action needed, but worth noting that the chat recording path is downstream of the gate.

### Finding 6: MCP tool results are double-truncated -- tool-level `truncateTextParts` then scheduler-level gate (Important, 81%)

**Location**: `mcp-tool.ts:430-449`, plan section 3

The MCP tool's `truncateTextParts()` method (line 430) already calls `truncateToolOutput()` on each text Part individually. After the tool returns, the scheduler's gate (`maybePersistLargeToolResult`) runs on the combined `ToolResult.llmContent`.

The plan's `isAlreadyTruncated()` check is designed to prevent double-filing by detecting `[CONTENT TRUNCATED]` in the content. If `truncateTextParts` truncated a part (adding `[CONTENT TRUNCATED]`), the gate should detect it and skip. This is the design intent per C1 in the plan.

However, consider an MCP tool that returns 10 text Parts, each 3KB (total 30KB, above 25KB threshold). None of the individual parts exceed the threshold, so `truncateTextParts` does NOT truncate any of them. The combined `Part[]` totals 30KB. The plan's gate sums all text parts, finds 30KB > 25KB, and triggers persistence. The plan says it "replaces text parts with stub, preserving media parts". But the stub text is a SINGLE string -- does the gate replace ALL text parts with one stub, or each text part independently?

The plan says (section 3, line ~155): "`Part[]` content -> only replace text parts with stub, preserve inlineData/fileData parts". If the gate replaces all 10 text parts with a single stub part, the output structure changes from `Part[10]` to `Part[1]` (the stub) plus any media parts. This is semantically correct for the model (it sees the stub) but changes the Part count. `convertToFunctionResponse` at line 605 handles `Part[]` by joining all text parts with newlines, so the structural change is absorbed.

**Verdict**: Not a bug, but worth documenting that multi-Part MCP results get collapsed into a single text stub Part when persisted.

---

## Summary of Actionable Findings

| # | Issue | Severity | Confidence |
|---|-------|----------|-----------|
| 1 | Session budget accounting splits across sub-agent Config overrides due to primitive field shadowing in `Object.create` | Important | 85% |
| 3 | Background task notification XML (`<result>` in `<task-notification>`) carries unbounded agent result text, bypassing the tool result gate entirely | Important | 83% |
| 4 | `<persisted-output>` tag has no collision in codebase (confirmed clean) but also no injection protection; low risk | Informational | 75% |
| 5 | Chat recording stores post-gate stubs (by design, already documented as known limitation) | Informational | N/A |
| 6 | Multi-Part MCP results get collapsed to single stub Part (correct behavior, worth documenting) | Informational | N/A |
