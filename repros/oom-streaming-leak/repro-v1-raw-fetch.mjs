// Minimal repro of the qwen-code streaming pattern.
// Goal: confirm that `for await` exited via exception (without explicit
// stream cleanup) leaks native memory over many iterations.
//
// This mimics:
// - packages/core/src/core/openaiContentGenerator/pipeline.ts:141-228
// - The OpenAI SDK's Stream<T> wraps Response.body (a ReadableStream).
//
// We use Node's built-in fetch + a local HTTPS server to control timing.

import https from 'node:https';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Generate self-signed cert for local HTTPS
const keyDir = '/tmp/oom-repro';
try {
  execSync(
    `openssl req -x509 -newkey rsa:2048 -keyout ${keyDir}/key.pem -out ${keyDir}/cert.pem -days 1 -nodes -subj "/CN=localhost" 2>/dev/null`,
    { stdio: 'ignore' },
  );
} catch {
  console.error('openssl required');
  process.exit(1);
}

const KEY = readFileSync(`${keyDir}/key.pem`);
const CERT = readFileSync(`${keyDir}/cert.pem`);

// Server: stream 100 KB chunks slowly, then drop the connection.
// Each chunk contains 100KB of payload; we send 10 chunks then close.
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

// Disable TLS verification for self-signed cert (test only).
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Client pattern A: BAD — mimics current qwen-code behavior.
// for-await + try/catch + NO finally. Throws after first chunk.
async function* badStreamConsumer(response) {
  // Mimics pipeline.ts:processStreamWithLogging shape
  const reader = response.body.getReader();
  try {
    let count = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      count++;
      // Simulate downstream consumer error after first chunk
      if (count === 1) {
        throw new Error('simulated consumer abort after first chunk');
      }
      yield value;
    }
  } catch (e) {
    // mimics pipeline.ts:218 catch — does NOT release reader
    throw e;
  }
  // ❌ NO finally — reader.releaseLock() never called
}

// Client pattern B: GOOD — explicitly releases reader.
async function* goodStreamConsumer(response) {
  const reader = response.body.getReader();
  try {
    let count = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      count++;
      if (count === 1) {
        throw new Error('simulated consumer abort after first chunk');
      }
      yield value;
    }
  } catch (e) {
    throw e;
  } finally {
    // ✅ Explicit cleanup
    try {
      await reader.cancel();
    } catch {}
    try {
      reader.releaseLock();
    } catch {}
  }
}

function fmtMB(bytes) {
  return (bytes / 1e6).toFixed(1).padStart(7) + ' MB';
}

function snapMem(label) {
  const m = process.memoryUsage();
  console.log(
    `${label.padEnd(35)} heapUsed=${fmtMB(m.heapUsed)}  external=${fmtMB(m.external)}  arrayBuffers=${fmtMB(m.arrayBuffers)}  rss=${fmtMB(m.rss)}`,
  );
  return m;
}

async function runIterations(label, consumer, iterations) {
  console.log(`\n=== ${label} ===`);
  if (global.gc) global.gc();
  const start = snapMem('Before iterations');

  for (let i = 0; i < iterations; i++) {
    try {
      const res = await fetch(`https://127.0.0.1:${PORT}/`);
      const gen = consumer(res);
      for await (const chunk of gen) {
        // No-op — but the consumer throws on chunk 1 so we never get here
      }
    } catch {
      // expected — simulated consumer abort
    }
    if ((i + 1) % 50 === 0) {
      if (global.gc) global.gc();
      snapMem(`  After ${i + 1} iterations`);
    }
  }

  if (global.gc) global.gc();
  // Wait a moment for any deferred cleanup
  await new Promise((r) => setTimeout(r, 1000));
  if (global.gc) global.gc();
  const end = snapMem('After all iterations');

  return {
    deltaHeap: end.heapUsed - start.heapUsed,
    deltaExternal: end.external - start.external,
    deltaArrayBuffers: end.arrayBuffers - start.arrayBuffers,
    deltaRss: end.rss - start.rss,
  };
}

const ITERATIONS = parseInt(process.env.ITER || '500');
console.log(`Iterations per pattern: ${ITERATIONS}`);

const badDelta = await runIterations('BAD pattern (no cleanup)', badStreamConsumer, ITERATIONS);
const goodDelta = await runIterations('GOOD pattern (with cleanup)', goodStreamConsumer, ITERATIONS);

console.log(`\n=== Summary (delta after ${ITERATIONS} iterations) ===`);
console.log('Pattern             heapUsed       external       arrayBuffers   rss');
console.log(
  `BAD  (no cleanup)   ${fmtMB(badDelta.deltaHeap)}   ${fmtMB(badDelta.deltaExternal)}   ${fmtMB(badDelta.deltaArrayBuffers)}   ${fmtMB(badDelta.deltaRss)}`,
);
console.log(
  `GOOD (with cleanup) ${fmtMB(goodDelta.deltaHeap)}   ${fmtMB(goodDelta.deltaExternal)}   ${fmtMB(goodDelta.deltaArrayBuffers)}   ${fmtMB(goodDelta.deltaRss)}`,
);

server.close();
process.exit(0);
