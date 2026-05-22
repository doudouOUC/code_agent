# Streaming HTTPS Resource Leak — Local Reproduction

This repro demonstrates the **Scenario B-TLS native memory leak** identified in [`docs/investigation-oom-series.md`](../../docs/investigation-oom-series.md). It targets the streaming pattern used in `qwen-code`:

- `packages/core/src/core/openaiContentGenerator/pipeline.ts:141-228` (`processStreamWithLogging`)
- `packages/core/src/core/loggingContentGenerator/loggingContentGenerator.ts:442-528`
- `packages/core/src/core/anthropicContentGenerator/anthropicContentGenerator.ts:758-781` (`redactStreamErrors` + `processStream`)

All three sites use `for await (chunk of stream)` inside a `try/catch` **without an explicit `finally` block** that releases the underlying stream. When the loop exits via exception (downstream consumer error, network blip, mid-stream provider error, reactive compression retry, etc.), JavaScript's runtime does call the iterator's `return()` automatically, but **the cleanup is incomplete at the native socket layer** — the OpenAI SDK's `Stream<T>` class releases the JS-visible reader but the underlying undici keep-alive socket pool retains TLS state.

This shows up in production OOM reports as:

- `process.memoryUsage().external` looks normal
- `process.memoryUsage().rss` grows steadily
- Native stack traces include `BIO_ssl_shutdown`, `X509_STORE_set_cleanup`, `EVP_MD_CTX_set_update_fn`, or `v8::Isolate::ReportExternalAllocationLimitReached`
- Heap raised via `--max-old-space-size=NNNN` only delays the crash
- Affects long sessions of heavy users (YOLO mode, agent loops, network-unstable connections)

Cross-references: [#2945](https://github.com/QwenLM/qwen-code/issues/2945), [#4116 @Kieaer comment (45 GB)](https://github.com/QwenLM/qwen-code/issues/4116#issuecomment-4455633231), [#4116 @maxinteresa-ops comment (post-v0.16.0)](https://github.com/QwenLM/qwen-code/issues/4116#issuecomment-4516854785), [#4322](https://github.com/QwenLM/qwen-code/issues/4322).

## Setup

```bash
cd repros/oom-streaming-leak
npm install
# Need openssl on PATH for the self-signed cert.
```

`openai` 5.11.0 is pinned to match qwen-code's version (see `packages/core/package.json` upstream).

## Running

Three increasingly accurate reproductions. Each one runs three patterns back-to-back and prints memory deltas.

| Script | Mimics | What it tests |
|--------|--------|---------------|
| `repro-v1-raw-fetch.mjs` | Direct `Response.body.getReader()` | Worst case — no runtime auto-cleanup, fully manual reader. Maximum leak signal. |
| `repro-v2-fetch-iterator.mjs` | `for await (chunk of response.body)` | Realistic-shape — runtime auto-cleanup partially saves you, but RSS still grows. |
| `repro-v3-openai-sdk.mjs` | Real `OpenAI` client + mock SSE server | **Production-realistic** — uses `client.chat.completions.create({ stream: true })` then `for await (chunk of stream)`. |

Each iteration:
- Opens a streaming HTTPS request to a local server
- Reads the first chunk
- Throws an exception (simulates downstream consumer error / abort / retry trigger)
- Lets the runtime + SDK clean up however they will

Three patterns per script:
- **A: BAD** — current qwen-code shape: `try/catch` + `for await`, **no `finally`**
- **B: GOOD** — adds `finally { iter.return() }` to force iterator cleanup
- **C: BEST** — uses an `AbortController` and aborts in `finally`

Run with `--expose-gc` so the script can call `global.gc()` between snapshots:

```bash
ITER=300 node --expose-gc repro-v3-openai-sdk.mjs
```

Increase `ITER` for higher signal-to-noise (1000+ iterations make the linear growth obvious).

## Reference results

On Apple Silicon macOS, Node v24.12.0, OpenAI SDK 5.11.0, 50 KB chunk × 10 chunks per response, 300 iterations per pattern:

```
=== Summary (delta after 300 iter, post-GC) ===
Pattern                              heap          external      arrayBuffers   rss
A: BAD  (qwen-code current)         1.9 MB       0.2 MB       0.1 MB      55.1 MB
B: GOOD (iter.return cleanup)       0.2 MB       0.0 MB       0.0 MB      -4.8 MB
C: BEST (AbortController)           0.0 MB       0.0 MB       0.0 MB      -1.5 MB

Per-iteration leak (BAD vs GOOD):
  RSS:      194.9 KB/iter
  External: 0.7 KB/iter
```

### How to read these numbers

- **`heap` and `external` near zero** for all three patterns — the OpenAI SDK's `Stream<T>` class properly releases the JS-side reader and ArrayBuffer-backed buffers. This is **not** a JS-heap leak.
- **`rss` grows ~195 KB per iteration in BAD** — these are native socket / TLS handles retained in libuv / undici layers that V8 cannot see or GC.
- **`rss` is flat or slightly negative for GOOD/BEST** — explicit cleanup releases the native handles immediately.

The 5× difference (BAD: +55 MB vs GOOD: -5 MB over 300 iterations) is the leak.

### Mapping to production OOM reports

| Production report | Reported metric | Maps to |
|-------------------|----------------|---------|
| @Kieaer (#4116) | 45 GB heap, 7 hrs | RSS-level leak; V8 heap is large because `--max-old-space-size` was raised |
| @maxinteresa-ops (#4116) | 6 GB heap, 107 min, 11.3% context | RSS leak ≈ 56 MB/min ≈ 5 stream-aborts/sec — plausible for YOLO + tool loops |
| #4322 | 4 GB heap, 7 hrs, OpenSSL frames + `ReportExternalAllocationLimitReached` | Direct match — `external` tracker fires when native side fills |
| #2945 | `BIO_ssl_shutdown` during `/resume` | Same TLS shutdown path |

## Suggested fix

Apply pattern B or C to the three call sites:

```typescript
// Before (current):
try {
  for await (const chunk of stream) {
    yield convertChunk(chunk);
  }
} catch (error) {
  await this.handleError(error, ...);
}

// After (pattern B):
try {
  for await (const chunk of stream) {
    yield convertChunk(chunk);
  }
} catch (error) {
  await this.handleError(error, ...);
} finally {
  const iter = stream[Symbol.asyncIterator]?.();
  if (iter && typeof iter.return === 'function') {
    await iter.return().catch(() => {});  // swallow — best-effort
  }
}

// Or pattern C (more aggressive, uses dedicated AbortController):
const streamAc = new AbortController();
const combinedSignal = AbortSignal.any(
  [request.config?.abortSignal, streamAc.signal].filter(Boolean),
);
const stream = await client.chat.completions.create(req, { signal: combinedSignal });
try {
  for await (const chunk of stream) {
    yield convertChunk(chunk);
  }
} catch (error) {
  await this.handleError(error, ...);
} finally {
  streamAc.abort();
}
```

Pattern C is more reliable across SDK versions because it forces the underlying fetch to abort, which transitively releases the TLS socket.

## Files

- `repro-v1-raw-fetch.mjs` — direct `Response.body.getReader()` baseline
- `repro-v2-fetch-iterator.mjs` — `for await` on `response.body` (no SDK)
- `repro-v3-openai-sdk.mjs` — **production-realistic**, uses `openai` 5.11.0 against a local mock SSE server
- `package.json` — pins `openai` to 5.11.0 (matches `packages/core/package.json` upstream)

## Caveats

- `NODE_TLS_REJECT_UNAUTHORIZED=0` is set inside the script for the self-signed cert. **This is test-only**; do not copy into production code.
- Single-process measurement on macOS arm64. Linux / Windows numbers may differ (Windows tends to be worse — see #4116, #4322 reports).
- The 50 KB / chunk payload is conservative. Production responses with reasoning content can be MB-scale, in which case the per-iteration leak is proportionally larger.
- The runtime `for await` auto-cleanup behavior depends on Node version. Tested on v24.12.0 — earlier versions (v20/22) may have different cleanup semantics.
