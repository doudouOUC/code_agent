// Analyze memory log produced by monitor.cjs.
// Usage: node analyze.cjs <path-to-memory-log.log>

const fs = require('node:fs');

const logPath = process.argv[2];
if (!logPath) {
  console.error('Usage: node analyze.cjs <memory-log.log>');
  process.exit(1);
}

const raw = fs.readFileSync(logPath, 'utf8').trim();
const lines = raw.split('\n');
const header = lines[0].split(',');
const rows = lines.slice(1).map((l) => {
  const cols = l.split(',');
  const o = {};
  for (let i = 0; i < header.length; i++) {
    o[header[i]] = cols[i];
  }
  return o;
});

if (rows.length < 2) {
  console.log('Not enough samples to analyze.');
  process.exit(0);
}

const first = rows[0];
const last = rows[rows.length - 1];
const durationSec = parseFloat(last.uptime_sec) - parseFloat(first.uptime_sec);
const durationMin = durationSec / 60;

function delta(field) {
  return parseFloat(last[field]) - parseFloat(first[field]);
}

function rate(field) {
  return delta(field) / durationMin;
}

const heapDelta = delta('heap_used_mb');
const externalDelta = delta('external_mb');
const rssDelta = delta('rss_mb');
const heapRate = rate('heap_used_mb');
const externalRate = rate('external_mb');
const rssRate = rate('rss_mb');

// Final heap pct of limit
const finalHeapPct = parseFloat(last.heap_pct_of_limit);

console.log('=== OOM Diagnostic Summary ===');
console.log(`Samples:           ${rows.length}`);
console.log(`Duration:          ${durationSec.toFixed(0)}s (${durationMin.toFixed(1)}min)`);
console.log(`Heap limit:        ${last.heap_limit_mb} MB`);
console.log();
console.log('Memory growth (delta first → last sample, post any GC):');
console.log(`  heap_used:       ${heapDelta.toFixed(1).padStart(8)} MB  (${heapRate.toFixed(2)} MB/min)`);
console.log(`  external:        ${externalDelta.toFixed(1).padStart(8)} MB  (${externalRate.toFixed(2)} MB/min)`);
console.log(`  rss:             ${rssDelta.toFixed(1).padStart(8)} MB  (${rssRate.toFixed(2)} MB/min)`);
console.log();
console.log(`Final heap usage:  ${last.heap_used_mb} MB (${finalHeapPct}% of limit)`);
console.log();

// Heuristic classification
console.log('=== Heuristic classification ===');

const sigHeapGrowth = heapRate > 5;
const sigExternalGrowth = externalRate > 5;
const sigRssGrowth = rssRate > 10;
const rssMinusJsGrowth = rssRate - heapRate - externalRate;

if (heapDelta < 50 && externalDelta < 20 && rssDelta < 50) {
  console.log('✅ Memory growth looks healthy. Probably not the leak causing your OOM.');
  console.log('   Consider whether the OOM happened at a different time / different workload.');
} else if (sigHeapGrowth && !sigExternalGrowth && rssMinusJsGrowth < 5) {
  console.log('⚠️ Pattern: heap_used grows steadily, external is flat.');
  console.log('   → Likely Scenario A (long-session structuredClone / history accumulation).');
  console.log('   → If on Qwen Code < v0.16.0, upgrade — PR #4286 in v0.16.0 fixes this.');
} else if (!sigHeapGrowth && sigRssGrowth && rssMinusJsGrowth > 10) {
  console.log('⚠️ Pattern: RSS grows but heap is flat. Native (non-V8) memory leak.');
  console.log('   → Likely Scenario B-TLS (streaming HTTPS resource not released).');
  console.log('   → V0.16.0 does NOT fix this. Workaround: avoid long sessions, restart periodically.');
  console.log('   → Heap snapshot may not show much (leak is in native socket pool).');
  console.log('   → See: https://github.com/doudouOUC/code_agent/blob/main/docs/investigation-oom-series.md');
} else if (sigHeapGrowth && sigExternalGrowth) {
  console.log('⚠️ Pattern: both heap and external grow. Multiple leaks possible.');
  console.log('   → Could be a mix of Scenarios A (heap) and B (native).');
  console.log('   → Capture a heap snapshot at ~70% heap usage (kill -USR2 <pid>) and');
  console.log('     analyze in Chrome DevTools to see which objects dominate retained size.');
} else {
  console.log('? Pattern is mixed or noisy. Try recording for longer (≥ 30 min).');
  console.log(`   heap rate=${heapRate.toFixed(2)} MB/min, external rate=${externalRate.toFixed(2)} MB/min, rss rate=${rssRate.toFixed(2)} MB/min`);
}

console.log();
console.log('Time to OOM (estimated, assuming linear growth):');
const remainingMb = parseFloat(last.heap_limit_mb) - parseFloat(last.heap_used_mb);
if (heapRate > 0.5) {
  const minToOOMHeap = remainingMb / heapRate;
  console.log(`  via heap:        ~${minToOOMHeap.toFixed(0)} min (rate ${heapRate.toFixed(1)} MB/min, ${remainingMb.toFixed(0)} MB remaining)`);
}
if (rssRate > 0.5) {
  // Estimate: native OOM when external alloc tracker fires, roughly when rss ≈ 1.5x heap limit
  const rssCeiling = parseFloat(last.heap_limit_mb) * 1.5;
  const minToOOMRss = Math.max(0, (rssCeiling - parseFloat(last.rss_mb))) / rssRate;
  console.log(`  via rss:         ~${minToOOMRss.toFixed(0)} min (rate ${rssRate.toFixed(1)} MB/min, est ceiling ${rssCeiling.toFixed(0)} MB)`);
}

console.log();
console.log('See full investigation: https://github.com/doudouOUC/code_agent/blob/main/docs/investigation-oom-series.md');
