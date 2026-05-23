// User-side OOM diagnostic — injects into qwen via NODE_OPTIONS=--require
// Polls process.memoryUsage() every 5s and logs to ~/.qwen/oom-diag/.
//
// Usage:
//   NODE_OPTIONS="--require /absolute/path/to/monitor.cjs" qwen
//
// Outputs (in ~/.qwen/oom-diag/):
//   memory-<pid>-<timestamp>.log   — one line per sample (CSV)
//   heap-<pid>-<timestamp>.heapsnapshot — captured on SIGUSR2 (kill -USR2 <pid>)
//
// What to look at in the log:
//   heap   stays flat, external/rss grow → Scenario B-TLS (native leak)
//   heap and external both grow steadily → Scenario A (likely fixed in v0.16.0)
//   sudden 3-5x spike in heap → Scenario C (compression peak)

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const v8 = require('node:v8');

const DIAG_DIR = process.env.QWEN_OOM_DIAG_DIR
  || path.join(os.homedir(), '.qwen', 'oom-diag');

try {
  fs.mkdirSync(DIAG_DIR, { recursive: true });
} catch {}

const startTime = Date.now();
const ts = new Date(startTime).toISOString().replace(/[:.]/g, '-');
const logPath = path.join(DIAG_DIR, `memory-${process.pid}-${ts}.log`);

const header = [
  'iso_time',
  'uptime_sec',
  'heap_used_mb',
  'heap_total_mb',
  'heap_limit_mb',
  'external_mb',
  'array_buffers_mb',
  'rss_mb',
  'heap_pct_of_limit',
].join(',');
fs.writeFileSync(logPath, header + '\n');

const heapLimit = v8.getHeapStatistics().heap_size_limit;

function sample() {
  const m = process.memoryUsage();
  const heapPct = (m.heapUsed / heapLimit * 100).toFixed(1);
  const line = [
    new Date().toISOString(),
    ((Date.now() - startTime) / 1000).toFixed(0),
    (m.heapUsed / 1e6).toFixed(1),
    (m.heapTotal / 1e6).toFixed(1),
    (heapLimit / 1e6).toFixed(1),
    (m.external / 1e6).toFixed(1),
    (m.arrayBuffers / 1e6).toFixed(1),
    (m.rss / 1e6).toFixed(1),
    heapPct,
  ].join(',');
  try {
    fs.appendFileSync(logPath, line + '\n');
  } catch {}
}

// Initial sample
sample();
const interval = setInterval(sample, 5000);
interval.unref?.();

// Capture heap snapshot on SIGUSR2 — `kill -USR2 <pid>`
process.on('SIGUSR2', () => {
  try {
    const snapPath = path.join(
      DIAG_DIR,
      `heap-${process.pid}-${Date.now()}.heapsnapshot`,
    );
    v8.writeHeapSnapshot(snapPath);
    process.stderr.write(`[oom-diag] heap snapshot written to ${snapPath}\n`);
    sample();
  } catch (err) {
    process.stderr.write(`[oom-diag] heap snapshot failed: ${err.message}\n`);
  }
});

// Final sample on exit
process.on('exit', () => {
  try {
    sample();
  } catch {}
});

process.stderr.write(
  `[oom-diag] monitoring qwen pid=${process.pid}, heap_limit=${(heapLimit / 1e6).toFixed(0)}MB, log=${logPath}\n`,
);
process.stderr.write(
  `[oom-diag] to capture heap snapshot before OOM: kill -USR2 ${process.pid}\n`,
);
