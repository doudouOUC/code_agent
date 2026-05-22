// V2: closer to qwen-code production pattern.
// Uses `for await (chunk of stream)` on Response.body (which is iterable).
// This more accurately replicates the OpenAI SDK Stream<T> consumption pattern.

import https from 'node:https';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

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

const PAYLOAD = Buffer.alloc(100 * 1024, 'X'); // 100 KB per chunk

const server = https.createServer({ key: KEY, cert: CERT }, (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
  });
  let n = 0;
  const tick = setInterval(() => {
    if (n++ < 10) {
      res.write(`data: ${PAYLOAD.toString()}\n\n`);
    } else {
      clearInterval(tick);
      res.end();
    }
  }, 5);
});

await new Promise((r) => server.listen(0, '127.0.0.1', r));
const PORT = server.address().port;
console.log(`Server listening on https://127.0.0.1:${PORT}`);
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// ========================================================================
// Pattern A: BAD — exact qwen-code shape: try/catch + for-await + NO finally
// Mirrors packages/core/src/core/openaiContentGenerator/pipeline.ts:141-228
// ========================================================================
async function* badStreamGenerator(stream) {
  try {
    let count = 0;
    for await (const chunk of stream) {
      count++;
      if (count === 1) {
        // Simulate downstream consumer abort (e.g., user Ctrl+C, or yield throws)
        throw new Error('simulated abort');
      }
      yield chunk;
    }
  } catch (e) {
    // mimics pipeline.ts:218 — only redacts/forwards, doesn't release
    throw e;
  }
  // ❌ NO finally — same as production code today
}

// ========================================================================
// Pattern B: GOOD — try/catch/finally + explicit iterator.return()
// ========================================================================
async function* goodStreamGenerator(stream) {
  // Get the iterator explicitly so we can call return() on it
  const iter = stream[Symbol.asyncIterator]();
  try {
    let count = 0;
    while (true) {
      const { done, value } = await iter.next();
      if (done) break;
      count++;
      if (count === 1) throw new Error('simulated abort');
      yield value;
    }
  } catch (e) {
    throw e;
  } finally {
    // ✅ Force iterator cleanup
    try {
      await iter.return?.();
    } catch {}
  }
}

// ========================================================================
// Pattern C: BEST — explicit AbortController + finally
// ========================================================================
async function* bestStreamGeneratorWithSignal(stream, ac) {
  try {
    let count = 0;
    for await (const chunk of stream) {
      count++;
      if (count === 1) throw new Error('simulated abort');
      yield chunk;
    }
  } catch (e) {
    throw e;
  } finally {
    // ✅ Abort the underlying fetch — propagates to TLS socket release
    ac.abort();
  }
}

function fmtMB(bytes) {
  return (bytes / 1e6).toFixed(1).padStart(7) + ' MB';
}
function snapMem(label) {
  const m = process.memoryUsage();
  console.log(
    `${label.padEnd(35)} heap=${fmtMB(m.heapUsed)}  external=${fmtMB(m.external)}  ab=${fmtMB(m.arrayBuffers)}  rss=${fmtMB(m.rss)}`,
  );
  return m;
}

async function runIterations(label, makeReq, iterations) {
  console.log(`\n=== ${label} ===`);
  if (global.gc) {
    global.gc();
    global.gc();
  }
  await new Promise((r) => setTimeout(r, 200));
  const start = snapMem('Before iterations');

  for (let i = 0; i < iterations; i++) {
    try {
      await makeReq();
    } catch {
      // expected — simulated abort
    }
  }

  if (global.gc) {
    global.gc();
    global.gc();
  }
  await new Promise((r) => setTimeout(r, 1000));
  if (global.gc) global.gc();
  const end = snapMem(`After ${iterations} iterations`);

  return {
    deltaHeap: end.heapUsed - start.heapUsed,
    deltaExternal: end.external - start.external,
    deltaArrayBuffers: end.arrayBuffers - start.arrayBuffers,
    deltaRss: end.rss - start.rss,
  };
}

const ITER = parseInt(process.env.ITER || '300');
console.log(`Iterations per pattern: ${ITER}\n`);

// Pattern A: no cleanup
const badDelta = await runIterations(
  'A: BAD (qwen-code shape — no finally)',
  async () => {
    const res = await fetch(`https://127.0.0.1:${PORT}/`);
    const gen = badStreamGenerator(res.body);
    for await (const _c of gen) {
      // consumer
    }
  },
  ITER,
);

// Pattern B: finally + iter.return()
const goodDelta = await runIterations(
  'B: GOOD (finally + iter.return)',
  async () => {
    const res = await fetch(`https://127.0.0.1:${PORT}/`);
    const gen = goodStreamGenerator(res.body);
    for await (const _c of gen) {
      // consumer
    }
  },
  ITER,
);

// Pattern C: AbortController
const bestDelta = await runIterations(
  'C: BEST (AbortController + finally)',
  async () => {
    const ac = new AbortController();
    const res = await fetch(`https://127.0.0.1:${PORT}/`, {
      signal: ac.signal,
    });
    const gen = bestStreamGeneratorWithSignal(res.body, ac);
    for await (const _c of gen) {
      // consumer
    }
  },
  ITER,
);

console.log(`\n=== Summary (delta after ${ITER} iterations, post-GC) ===`);
console.log(
  'Pattern                              heap          external      arrayBuffers   rss',
);
console.log(
  `A: BAD (qwen-code current)        ${fmtMB(badDelta.deltaHeap)}   ${fmtMB(badDelta.deltaExternal)}   ${fmtMB(badDelta.deltaArrayBuffers)}   ${fmtMB(badDelta.deltaRss)}`,
);
console.log(
  `B: GOOD (iter.return cleanup)     ${fmtMB(goodDelta.deltaHeap)}   ${fmtMB(goodDelta.deltaExternal)}   ${fmtMB(goodDelta.deltaArrayBuffers)}   ${fmtMB(goodDelta.deltaRss)}`,
);
console.log(
  `C: BEST (AbortController)         ${fmtMB(bestDelta.deltaHeap)}   ${fmtMB(bestDelta.deltaExternal)}   ${fmtMB(bestDelta.deltaArrayBuffers)}   ${fmtMB(bestDelta.deltaRss)}`,
);

server.close();
process.exit(0);
