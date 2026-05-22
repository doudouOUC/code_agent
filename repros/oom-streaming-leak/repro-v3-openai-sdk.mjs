// V3: real OpenAI SDK against a local mock OpenAI-compatible server.
// Replicates qwen-code's exact streaming pattern from
// packages/core/src/core/openaiContentGenerator/pipeline.ts:141-228
//
// Pattern A (BAD): try/catch + for-await + NO finally — current production code
// Pattern B (GOOD): try/catch + finally + iter.return()
// Pattern C (BEST): try/catch + finally + AbortController.abort()

import https from 'node:https';
import http from 'node:http';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import OpenAI from 'openai';

// --- Cert setup (reuse if exists) ---
const keyDir = '/tmp/oom-repro';
try {
  execSync(
    `test -f ${keyDir}/key.pem || openssl req -x509 -newkey rsa:2048 -keyout ${keyDir}/key.pem -out ${keyDir}/cert.pem -days 1 -nodes -subj "/CN=localhost" 2>/dev/null`,
    { stdio: 'ignore' },
  );
} catch {
  console.error('openssl required');
  process.exit(1);
}
const KEY = readFileSync(`${keyDir}/key.pem`);
const CERT = readFileSync(`${keyDir}/cert.pem`);

// --- Mock OpenAI-compatible server (HTTPS + SSE) ---
// Sends chat.completion.chunk SSE events, then finishes with [DONE]
const TEXT_PAYLOAD = 'X'.repeat(50 * 1024); // 50KB per chunk content (production-realistic for code generation)

function makeChunk(content, finishReason = null) {
  return {
    id: 'chatcmpl-test',
    object: 'chat.completion.chunk',
    created: 1700000000,
    model: 'mock-deepseek-v4-pro',
    choices: [
      {
        index: 0,
        delta: { content },
        finish_reason: finishReason,
      },
    ],
  };
}

const server = https.createServer({ key: KEY, cert: CERT }, (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  let n = 0;
  const TOTAL_CHUNKS = 10;
  const tick = setInterval(() => {
    if (n < TOTAL_CHUNKS) {
      const finishReason = n === TOTAL_CHUNKS - 1 ? 'stop' : null;
      res.write(`data: ${JSON.stringify(makeChunk(TEXT_PAYLOAD, finishReason))}\n\n`);
      n++;
    } else {
      res.write('data: [DONE]\n\n');
      clearInterval(tick);
      res.end();
    }
  }, 5);
  // Cleanup if client disconnects
  req.on('close', () => clearInterval(tick));
});

await new Promise((r) => server.listen(0, '127.0.0.1', r));
const PORT = server.address().port;
console.log(`Mock OpenAI server listening on https://127.0.0.1:${PORT}`);

// Allow self-signed cert
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new OpenAI({
  apiKey: 'mock-key',
  baseURL: `https://127.0.0.1:${PORT}/v1`,
});

// --- Pattern A: BAD (current qwen-code shape) ---
// Mirrors pipeline.ts:processStreamWithLogging exactly.
async function* processStreamBad(stream) {
  const collectedResponses = []; // mirrors collectedGeminiResponses
  try {
    let count = 0;
    for await (const chunk of stream) {
      count++;
      collectedResponses.push(chunk); // mirrors push(response) at line 188/305
      if (count === 1) {
        // simulate downstream consumer abort (yield throws back into us)
        throw new Error('simulated abort after first chunk');
      }
      yield chunk;
    }
  } catch (error) {
    throw error; // mirrors line 218-227 (only redacts/forwards)
  }
  // ❌ NO finally — same as production
}

// --- Pattern B: GOOD (finally + iter.return) ---
async function* processStreamGood(stream) {
  const iter = stream[Symbol.asyncIterator]();
  try {
    let count = 0;
    while (true) {
      const { done, value } = await iter.next();
      if (done) break;
      count++;
      if (count === 1) throw new Error('simulated abort after first chunk');
      yield value;
    }
  } catch (error) {
    throw error;
  } finally {
    // ✅ Force iterator cleanup
    try {
      await iter.return?.();
    } catch {}
  }
}

// --- Pattern C: BEST (AbortController) ---
async function* processStreamBest(stream, ac) {
  try {
    let count = 0;
    for await (const chunk of stream) {
      count++;
      if (count === 1) throw new Error('simulated abort after first chunk');
      yield chunk;
    }
  } catch (error) {
    throw error;
  } finally {
    // ✅ Abort the underlying fetch — cleanest way to release TLS socket
    ac.abort();
  }
}

function fmtMB(bytes) {
  return (bytes / 1e6).toFixed(1).padStart(7) + ' MB';
}
function snapMem(label) {
  const m = process.memoryUsage();
  console.log(
    `${label.padEnd(38)} heap=${fmtMB(m.heapUsed)}  external=${fmtMB(m.external)}  ab=${fmtMB(m.arrayBuffers)}  rss=${fmtMB(m.rss)}`,
  );
  return m;
}

async function gcSettle() {
  if (global.gc) {
    global.gc();
    global.gc();
  }
  await new Promise((r) => setTimeout(r, 500));
  if (global.gc) global.gc();
}

async function runIterations(label, makeReq, iterations, snapEvery) {
  console.log(`\n=== ${label} ===`);
  await gcSettle();
  const start = snapMem('Before iterations');

  for (let i = 0; i < iterations; i++) {
    try {
      await makeReq();
    } catch {
      // expected — simulated abort
    }
    if (snapEvery && (i + 1) % snapEvery === 0) {
      await gcSettle();
      snapMem(`  After ${i + 1} iterations`);
    }
  }

  await gcSettle();
  const end = snapMem(`After ${iterations} iterations (post-GC)`);

  return {
    deltaHeap: end.heapUsed - start.heapUsed,
    deltaExternal: end.external - start.external,
    deltaArrayBuffers: end.arrayBuffers - start.arrayBuffers,
    deltaRss: end.rss - start.rss,
  };
}

const ITER = parseInt(process.env.ITER || '300');
console.log(`Iterations per pattern: ${ITER}\n`);
console.log(`Each request: ~10 chunks of ~50KB each (~500KB total response)`);
console.log(`Each iteration aborts after first chunk (simulating downstream error).\n`);

// === Pattern A: BAD ===
const badDelta = await runIterations(
  'A: BAD (qwen-code current shape)',
  async () => {
    const stream = await client.chat.completions.create({
      model: 'mock-deepseek-v4-pro',
      messages: [{ role: 'user', content: 'test' }],
      stream: true,
    });
    const gen = processStreamBad(stream);
    for await (const _c of gen) {
      // consume
    }
  },
  ITER,
  Math.floor(ITER / 5),
);

// === Pattern B: GOOD ===
const goodDelta = await runIterations(
  'B: GOOD (finally + iter.return)',
  async () => {
    const stream = await client.chat.completions.create({
      model: 'mock-deepseek-v4-pro',
      messages: [{ role: 'user', content: 'test' }],
      stream: true,
    });
    const gen = processStreamGood(stream);
    for await (const _c of gen) {
      // consume
    }
  },
  ITER,
  Math.floor(ITER / 5),
);

// === Pattern C: BEST ===
const bestDelta = await runIterations(
  'C: BEST (AbortController + finally)',
  async () => {
    const ac = new AbortController();
    const stream = await client.chat.completions.create(
      {
        model: 'mock-deepseek-v4-pro',
        messages: [{ role: 'user', content: 'test' }],
        stream: true,
      },
      { signal: ac.signal },
    );
    const gen = processStreamBest(stream, ac);
    for await (const _c of gen) {
      // consume
    }
  },
  ITER,
  Math.floor(ITER / 5),
);

console.log(`\n=== Summary (delta after ${ITER} iter, post-GC) ===`);
console.log(
  'Pattern                              heap          external      arrayBuffers   rss',
);
console.log(
  `A: BAD  (qwen-code current)       ${fmtMB(badDelta.deltaHeap)}   ${fmtMB(badDelta.deltaExternal)}   ${fmtMB(badDelta.deltaArrayBuffers)}   ${fmtMB(badDelta.deltaRss)}`,
);
console.log(
  `B: GOOD (iter.return cleanup)     ${fmtMB(goodDelta.deltaHeap)}   ${fmtMB(goodDelta.deltaExternal)}   ${fmtMB(goodDelta.deltaArrayBuffers)}   ${fmtMB(goodDelta.deltaRss)}`,
);
console.log(
  `C: BEST (AbortController)         ${fmtMB(bestDelta.deltaHeap)}   ${fmtMB(bestDelta.deltaExternal)}   ${fmtMB(bestDelta.deltaArrayBuffers)}   ${fmtMB(bestDelta.deltaRss)}`,
);

console.log(`\nPer-iteration leak (BAD vs GOOD):`);
const iterLeakRss = (badDelta.deltaRss - goodDelta.deltaRss) / ITER;
const iterLeakExt = (badDelta.deltaExternal - goodDelta.deltaExternal) / ITER;
console.log(`  RSS:      ${(iterLeakRss / 1024).toFixed(1)} KB/iter`);
console.log(`  External: ${(iterLeakExt / 1024).toFixed(1)} KB/iter`);

server.close();
process.exit(0);
