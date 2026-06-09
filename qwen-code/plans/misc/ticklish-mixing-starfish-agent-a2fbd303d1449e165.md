# Audit 11: Production-adversarial review of Phase 4 tool result disk overflow plan

## Investigation Summary

Investigated all six proposed concerns against the actual codebase. Below are findings organized by severity.

---

### Finding 1: Chars-vs-bytes confusion in 50MB cap and 500MB session budget (Critical, 92)

**The problem**: The plan measures content size using `content.length` (JavaScript string length = UTF-16 code units) but writes to disk as UTF-8. The 50MB hard cap and 500MB session budget are described as byte limits, but the plan's measurement uses char length.

- A 50-million-char CJK string (`content.length === 50_000_000`) would produce 150MB on disk in UTF-8.
- The plan says "超 50MB 的内容不写磁盘" and "累计已写字节 > 500MB" -- both phrased as byte limits -- but the check `content.length > 50_000_000` measures chars, not bytes.
- Similarly, `trackToolResultBytes(n)` would track `content.length` (chars), not `Buffer.byteLength(content)` (bytes).

**Impact**: In CJK-heavy sessions (common for this codebase's target audience), the actual disk writes could be 3x the intended budget. A 500MB char budget could produce 1.5GB of disk files.

**Fix**: Use `Buffer.byteLength(content, 'utf-8')` for the 50MB cap check and for the value passed to `trackToolResultBytes()`. Alternatively, define the budgets explicitly in chars and adjust the numbers accordingly (e.g., 16M chars for ~50MB CJK).

### Finding 2: Streaming write path (>10MB) bypasses atomicWriteFile security guarantees (Important, 87)

**The problem**: The plan specifies two write paths:
- <= 10MB: `atomicWriteFile(path, content, { mode: 0o600, noFollow: true, flush: false })`
- > 10MB: `fs.open` + chunked `write` + `close`, mode 0o600

The streaming path for >10MB content bypasses all of `atomicWriteFile`'s hardened behaviors:
1. No symlink resolution/protection (the `noFollow` logic in `atomicWriteFile` does `unlink` + `O_EXCL` on EXDEV)
2. No atomic rename (write-to-temp + rename)
3. No EPERM/EACCES retry on rename
4. No ownership preservation

While these are less critical for tool-results (not credentials), the plan promises `noFollow: true` for symlink attack prevention in its security measures table, but the >10MB path doesn't deliver it.

**Impact**: A symlink at the tool-results path could redirect a >10MB write to an arbitrary file. The risk is somewhat mitigated by the `tool-results/` directory being under a controlled temp dir, but it's an inconsistency.

**Fix**: The streaming path should: (a) create the directory if missing, (b) use `unlink` + `O_EXCL` when opening, matching `atomicWriteFile`'s noFollow EXDEV path. Or simpler: just use `atomicWriteFile` for all sizes -- Node's `fs.writeFile` handles large strings fine (it's not "double-buffering" in any meaningful OOM sense, since the string is already in memory as a JS string).

### Finding 3: The >10MB "streaming write" doesn't actually reduce memory (Important, 85)

**The problem**: The plan introduces streaming writes for content >10MB to prevent OOM (F8). But the content is already a JavaScript string in memory -- `persistAndTruncateToolResult` receives `content: string`. Converting from `string` to chunked `Buffer.from(content.slice(offset, offset+chunkSize))` doesn't reduce peak memory; the full string is still held by the caller. The "double buffer" concern is that `atomicWriteFile` creates a temp file (so two files exist briefly), but that's a disk concern, not memory.

The real OOM prevention is the 50MB cap (don't write content >50MB at all), which is already in the plan. The >10MB streaming path adds implementation complexity for no actual memory benefit.

**Impact**: Engineering complexity without benefit. Not a bug, but the justification (F8: "双缓冲可能 OOM") is based on a misunderstanding of what `atomicWriteFile` does.

**Fix**: Remove the >10MB streaming path. Use `atomicWriteFile` for all sizes up to 50MB. If disk space during rename is a concern (two copies of 50MB on disk briefly), document it as a known limitation rather than implementing a streaming path that doesn't solve the stated problem.

### Finding 4: Session budget not reset on /clear or session change (Important, 83)

**The problem**: The plan adds `private readonly toolResultBudget = { bytesWritten: 0 }` to Config, with `readonly` preventing reassignment. The budget is described as "per-session" (500MB累计上限). However, `startNewSession()` (which handles `/clear`, `/reset`, `/new`, `/resume`) does not reset this counter.

Looking at `startNewSession()`, it resets `fileReadCache`, `fileHistoryService`, `memoryPressureMonitor`, and `CommitAttributionService` -- but there's no mention of resetting `toolResultBudget`.

Since `toolResultBudget` is a shared object reference (for prototype chain reasons), resetting it requires `this.toolResultBudget.bytesWritten = 0`, not reassignment. This is possible despite `readonly` on the field because `readonly` only prevents rebinding the reference, not mutating the object.

**Impact**: After `/clear`, the budget from the previous session carries over. A long-running CLI session that repeatedly uses `/clear` would hit the 500MB limit even though the old files were cleaned up by the cleanup function. The user would see tool outputs silently falling back to memory-only truncation with no way to recover except restarting the process.

**Fix**: Add `this.toolResultBudget.bytesWritten = 0;` to `startNewSession()`, alongside the existing `this.getFileReadCache().clear()` call.

### Finding 5: path.basename on POSIX does not strip backslash separators (Low concern, confirmed benign, 60)

**Verified**: On POSIX, `path.basename('a\\b')` returns `'a\\b'` (the backslash is not a separator). On Windows, `path.basename('a\\b')` returns `'b'`. However, `callId` values come from the LLM API (e.g., `toolu_xxx` format for Anthropic, `call_xxx` for OpenAI) and are alphanumeric with underscores/hyphens. They don't contain path separators. The `assertPathWithinDirectory()` check is a defense-in-depth that catches any edge case. No real issue here.

### Finding 6: Config serialization concern (Non-issue, confirmed, 40)

**Verified**: `Config` is never serialized to JSON for session persistence. Session resume uses `ResumedSessionData` (chat history, not Config object). `Object.create` delegation doesn't involve serialization. The `toolResultBudget` object will not be lost to serialization.

---

## Concerns dismissed after investigation

- **Windows mode 0o600**: `atomicWriteFile` already handles this -- its `tryChmod` catches `ENOSYS`/`ENOTSUP` for FAT/exFAT. On NTFS, `chmod` is approximated by Node but not dangerous if it silently does nothing. The plan's use of `atomicWriteFile` with `mode: 0o600` inherits this handling.

- **Null bytes in includes()**: Verified that `String.prototype.includes()` works correctly on strings containing null bytes. `'hello\x00... [CONTENT TRUNCATED] ...'.includes('... [CONTENT TRUNCATED] ...')` returns `true`.

- **Concurrent += safety**: `trackToolResultBytes(n)` is a synchronous method with no `await` between read and write. JavaScript's event loop guarantees atomicity of synchronous expressions. Even with `Promise.all` dispatching parallel tool calls, each `+=` operation completes before yielding.

- **GATE_HEADROOM at larger thresholds**: When threshold is 50K, GATE_HEADROOM of 3K means gate triggers at 53K. Tool headers (grep header, truncation notice) are well under 3K even with long paths. The concern about "very long file paths in truncation messages" is theoretical -- paths would need to be >2K characters to exhaust headroom, which is unrealistic. When threshold is 0 or negative, `getTruncateToolOutputThreshold()` returns `Infinity`, so `Infinity + 3000 = Infinity` and the gate never triggers -- correct behavior.
