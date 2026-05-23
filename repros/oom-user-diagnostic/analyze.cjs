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

// Key metric: RSS minus JS-visible (heap+external) = pure native growth
// (libuv handles, undici sockets, TLS state — invisible to V8).
const nativeOnlyRate = rssRate - heapRate - externalRate;

const NATIVE_DOMINANT = 20; // MB/min — native-only growth is significant
const HEAP_GROWS = 10;
const EXT_GROWS = 5;
const MIN_DURATION_MIN = 3; // need at least this long to distinguish leak from startup noise

if (durationMin < MIN_DURATION_MIN) {
  console.log(`⚠️ Session too short (${durationMin.toFixed(1)} min) to classify reliably.`);
  console.log(`   Early samples are dominated by Node.js + qwen-code module loading and warm-up.`);
  console.log(`   To get a useful diagnosis: keep the session running for at least ${MIN_DURATION_MIN} minutes,`);
  console.log(`   ideally until the OOM (or close to it). Then re-run analyze.cjs on the same log file.`);
  console.log();
  console.log(`Observed: heap=${heapRate.toFixed(1)} MB/min, external=${externalRate.toFixed(1)} MB/min, rss=${rssRate.toFixed(1)} MB/min (likely startup noise — ignore).`);
} else if (heapDelta < 50 && externalDelta < 20 && rssDelta < 50) {
  console.log('✅ Memory growth looks healthy. Probably not the leak causing your OOM.');
  console.log('   Consider whether the OOM happened at a different time / different workload.');
} else if (heapRate > HEAP_GROWS && externalRate < EXT_GROWS && nativeOnlyRate < 10) {
  // Heap grows but external/native flat → JS-heap leak.
  // Could be EITHER:
  //   A1: structuredClone amplification of conversation history
  //       (fixed in v0.16.0 PR #4286 — getHistoryShallow + readonly accessors)
  //   A2: React reconciler dev-build PerformanceMeasure leak
  //       (fixed in PR #4462 — not yet in any release as of 2026-05-23)
  // Distinguishing them needs a heap snapshot; the recommendation covers both.
  console.log('⚠️ Pattern: heap grows steadily, external flat, RSS tracks heap.');
  console.log(`   (heap=${heapRate.toFixed(1)} MB/min, external=${externalRate.toFixed(1)}, native-only=${nativeOnlyRate.toFixed(1)})`);
  console.log('   → Likely Scenario A — JS-heap leak. Two known causes:');
  console.log('     A1: long-session structuredClone of history → fixed in v0.16.0 (PR #4286).');
  console.log('     A2: React reconciler dev-build PerformanceMeasure → NOT in any release yet (PR #4462).');
  console.log('   → If on Qwen Code < v0.16.0, upgrade first — covers A1.');
  console.log('   → If still leaking on v0.16.0: this is A2. Watch for PR #4462 to ship.');
  console.log('   → To confirm A2: capture heap snapshot (kill -USR2 <pid>) and look for');
  console.log('     `measureEntryBuffer` retaining a large share (PR #4462 found 45% of heap).');
} else if (nativeOnlyRate > NATIVE_DOMINANT && nativeOnlyRate > heapRate * 3) {
  // RSS grows much faster than heap+external → native socket / TLS pool leak.
  // This is a real but SECONDARY leak. The dominant production OOMs in v0.15.11
  // and v0.16.0 are actually Scenario A2 (React PerformanceMeasure), not this.
  // This branch only fires if heap stays flat — usually the React leak co-occurs
  // and you land in the "Multiple leaks" branch instead.
  console.log('⚠️ Pattern: RSS grows much faster than V8-visible memory.');
  console.log(`   (rss=${rssRate.toFixed(1)} MB/min, heap=${heapRate.toFixed(1)}, external=${externalRate.toFixed(1)}, native-only=${nativeOnlyRate.toFixed(1)})`);
  console.log('   → Likely Scenario B-TLS (streaming HTTPS resource not released).');
  console.log('   → SECONDARY contributor — usually smaller than the React leak (Scenario A2).');
  console.log('   → No release fix yet. Workaround: avoid long sessions, restart periodically.');
} else if (heapRate > HEAP_GROWS && (externalRate > EXT_GROWS || nativeOnlyRate > 10)) {
  // Both heap and native grow — most likely the React PerformanceMeasure leak
  // (A2) dominating the JS heap PLUS undici socket retention (B-TLS) bumping RSS.
  console.log('⚠️ Pattern: heap and native both grow. Multiple leaks likely.');
  console.log(`   (heap=${heapRate.toFixed(1)} MB/min, external=${externalRate.toFixed(1)}, native-only=${nativeOnlyRate.toFixed(1)})`);
  console.log('   → Most common combination in v0.15.11 / v0.16.0:');
  console.log('     - Heap growth: Scenario A2 (React reconciler dev build PerformanceMeasure)');
  console.log('       → fixed by PR #4462 (not released yet as of 2026-05-23)');
  console.log('     - RSS/native growth: Scenario B-TLS (undici socket pool retention)');
  console.log('       → no release fix yet');
  console.log('   → Confirm A2: heap snapshot (kill -USR2 <pid>), look for `measureEntryBuffer`.');
} else {
  console.log('? Pattern is unclear or noise-level. Try recording for longer (≥ 30 min).');
  console.log(`   heap=${heapRate.toFixed(2)} MB/min, external=${externalRate.toFixed(2)} MB/min, rss=${rssRate.toFixed(2)} MB/min, native-only=${nativeOnlyRate.toFixed(2)} MB/min`);
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
