// Real-workload concurrency probe: how many workspaces can actually run agent
// turns at once on this 4c8g host?
//
// Drives real daemon sessions through the SDK against a real model endpoint, so
// unlike every earlier run the ACP children hold context, call tools and grow.
// Escalates concurrency and stops early if the host runs out of headroom, since
// there is no swap.

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { DaemonClient, DaemonSessionClient } from '/root/qwen-code/packages/sdk-typescript/dist/index.mjs';

const ROOT = '/root/cap';
const CLI = '/root/qwen-code/dist/cli.js';
const REPOS = path.join(ROOT, 'repos');
const OUT = path.join(ROOT, 'out');

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2)
  args.set(process.argv[i].replace(/^--/, ''), process.argv[i + 1]);
const registered = Number(args.get('registered') ?? 256);
const levels = (args.get('concurrency') ?? '1,2,4,6').split(',').map(Number);
const model = args.get('model') ?? 'qwen3.8-flash';
const promptTimeoutMs = Number(args.get('prompt-timeout') ?? 240000);
/** Abort a level rather than risk an OOM kill on a swapless host. */
const MIN_AVAIL_MIB = Number(args.get('min-avail') ?? 600);

const BASE_URL = process.env['CAP_BASE_URL'];
const API_KEY = process.env['CAP_API_KEY'];
if (!BASE_URL || !API_KEY) throw new Error('CAP_BASE_URL / CAP_API_KEY required');

const profile = args.get('profile') ?? 'light';

/**
 * `light` is the original two-turn task: a directory listing and two small
 * files. `heavy` deliberately grows context and tool output — a repo-wide
 * search plus three large real files (60K + 60K + 176K) accumulated across four
 * turns — to test whether the ~280 MiB per active workspace measured under
 * `light` still holds.
 */
const PROFILES = {
  light: [
    'List the TypeScript files directly under packages/cli/src/serve (top level only), then read packages/cli/src/serve/workspace-inputs.ts. Summarise in exactly 5 bullet points what limits that file enforces. Use tools to read real content; do not guess.',
    'Now also read packages/cli/src/serve/routes/workspace-runtime.ts and add exactly 3 more bullet points describing what that route file exposes.',
  ],
  heavy: [
    'Search the repository for every occurrence of the term "workspace" under packages/cli/src/serve and report how many distinct files contain it, naming the ten files with the most occurrences. Use tools; do not guess.',
    'Read packages/cli/src/serve/daemon-status.ts in full and summarise in 10 bullet points every limit or capacity field it reports.',
    'Read packages/core/src/utils/gitDiff.ts in full. Compare its timeout and failure handling against what daemon-status.ts reports, in 8 bullet points.',
    'Read packages/cli/src/config/settingsSchema.ts in full. Now, holding all three files in mind, produce 12 bullet points describing how settings, daemon status limits, and git behaviour relate. Cite the specific file for each point.',
  ],
};
const TURNS = PROFILES[profile];
if (!TURNS) throw new Error(`unknown --profile ${profile}`);

/* ------------------------------- /proc sampling ------------------------------ */

function procTree(rootPid) {
  const parent = new Map();
  for (const name of fs.readdirSync('/proc')) {
    if (!/^\d+$/.test(name)) continue;
    const pid = Number(name);
    try {
      const stat = fs.readFileSync(`/proc/${pid}/stat`, 'utf8');
      parent.set(pid, Number(stat.slice(stat.lastIndexOf(')') + 2).split(' ')[1]));
    } catch {
      /* exited */
    }
  }
  const tree = new Set([rootPid]);
  let n;
  do {
    n = tree.size;
    for (const [pid, ppid] of parent) if (tree.has(ppid)) tree.add(pid);
  } while (tree.size !== n);
  const procs = [];
  for (const pid of tree) {
    if (!parent.has(pid)) continue;
    try {
      const status = fs.readFileSync(`/proc/${pid}/status`, 'utf8');
      const rssKiB = Number(/^VmRSS:\s+(\d+)/m.exec(status)?.[1] ?? 0);
      const threads = Number(/^Threads:\s+(\d+)/m.exec(status)?.[1] ?? 0);
      const fds = fs.readdirSync(`/proc/${pid}/fd`).length;
      procs.push({ pid, rssKiB, threads, fds, isDaemon: pid === rootPid });
    } catch {
      /* exited */
    }
  }
  const meminfo = fs.readFileSync('/proc/meminfo', 'utf8');
  return {
    procs,
    totalRssKiB: procs.reduce((a, p) => a + p.rssKiB, 0),
    daemonRssKiB: procs.find((p) => p.isDaemon)?.rssKiB ?? 0,
    childCount: procs.length - 1,
    totalFds: procs.reduce((a, p) => a + p.fds, 0),
    memAvailableKiB: Number(/^MemAvailable:\s+(\d+)/m.exec(meminfo)?.[1] ?? 0),
    loadavg: fs.readFileSync('/proc/loadavg', 'utf8').trim().split(' ').slice(0, 3),
  };
}

function oomKills() {
  try {
    return execFileSync('dmesg', ['--level=err,warn', '--since', '-30min'], {
      encoding: 'utf8',
    })
      .split('\n')
      .filter((l) => /oom|Killed process|out of memory/i.test(l));
  } catch {
    return ['<dmesg unavailable>'];
  }
}

/* ---------------------------------- one level -------------------------------- */

async function runLevel(concurrency) {
  const label = `load-${profile}-r${registered}-c${concurrency}`;
  const fixture = path.join(ROOT, 'fixtures', label);
  await fsp.rm(fixture, { recursive: true, force: true });
  for (const d of ['config', 'runtime', 'os-home', 'tmp', 'cache'])
    await fsp.mkdir(path.join(fixture, d), { recursive: true });

  const workspaces = Array.from({ length: registered }, (_, i) =>
    path.join(REPOS, `ws${String(i).padStart(3, '0')}`),
  );

  // `$version` is required or the loader treats this as a legacy file; each
  // modelProviders entry *is* a model config, so its `id` is the name sent
  // upstream — a mismatch with `model.name` silently falls back to a default
  // model and the provider answers 404.
  await fsp.writeFile(
    path.join(fixture, 'config/settings.json'),
    JSON.stringify({
      $version: 4,
      security: { folderTrust: { enabled: false }, auth: { selectedType: 'openai' } },
      modelProviders: {
        openai: [{ id: model, name: model, baseUrl: BASE_URL, envKey: 'CAP_API_KEY' }],
      },
      model: { name: model },
      telemetry: { enabled: false },
    }),
  );
  await fsp.writeFile(path.join(fixture, 'system-settings.json'), '{}');
  await fsp.writeFile(
    path.join(fixture, 'config/trustedFolders.json'),
    JSON.stringify(Object.fromEntries(workspaces.map((w) => [w, 'TRUST_FOLDER']))),
  );
  await fsp.writeFile(
    path.join(fixture, 'probe.cjs'),
    "const os=require('node:os');os.homedir=()=>process.env.QWEN_CAPACITY_OS_HOME;require('node:module').syncBuiltinESMExports();\n",
  );

  const token = randomBytes(24).toString('hex');
  const env = {
    PATH: process.env.PATH,
    HOME: path.join(fixture, 'os-home'),
    TMPDIR: path.join(fixture, 'tmp'),
    XDG_CACHE_HOME: path.join(fixture, 'cache'),
    QWEN_HOME: path.join(fixture, 'config'),
    QWEN_RUNTIME_DIR: path.join(fixture, 'runtime'),
    QWEN_CAPACITY_OS_HOME: path.join(fixture, 'os-home'),
    NODE_OPTIONS: `--require=${path.join(fixture, 'probe.cjs')}`,
    QWEN_CODE_SYSTEM_SETTINGS_PATH: path.join(fixture, 'system-settings.json'),
    QWEN_CODE_SYSTEM_DEFAULTS_PATH: path.join(fixture, 'system-settings.json'),
    QWEN_CODE_TRUSTED_FOLDERS_PATH: path.join(fixture, 'config/trustedFolders.json'),
    QWEN_SERVER_TOKEN: token,
    CAP_API_KEY: API_KEY,
    QWEN_SANDBOX: 'false',
    QWEN_CODE_SKIP_UPDATE_CHECK_ONCE: 'true',
    QWEN_TELEMETRY_ENABLED: 'false',
    // Keep exactly `concurrency` children attributable to the driven sessions.
    VITEST_WORKER_ID: 'capacity-experiment',
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_CONFIG_NOSYSTEM: '1',
    CI: 'true',
    TERM: 'dumb',
    NO_COLOR: '1',
    NO_PROXY: '127.0.0.1,localhost',
  };

  const record = { label, registered, concurrency, model, profile, startedAt: new Date().toISOString(), samples: [], turns: [] };
  let out = '';
  let err = '';
  let port;
  const started = performance.now();
  const child = spawn(
    process.execPath,
    [CLI, 'serve', '--hostname', '127.0.0.1', '--port', '0', '--no-open', '--no-web',
      ...workspaces.flatMap((w) => ['--workspace', w])],
    { cwd: workspaces[0], env, stdio: ['ignore', 'pipe', 'pipe'], detached: true },
  );
  child.stdout.on('data', (c) => {
    out += c;
    port ??= Number(out.match(/listening on http:\/\/127\.0\.0\.1:(\d+)/)?.[1]) || undefined;
  });
  child.stderr.on('data', (c) => (err += c));

  let sampling = true;
  let aborted = false;
  const samplerTask = (async () => {
    while (sampling) {
      try {
        const t = procTree(child.pid);
        record.samples.push({ at: Math.round(performance.now() - started), ...t, procs: undefined });
        if (t.memAvailableKiB / 1024 < MIN_AVAIL_MIB) {
          aborted = true;
          record.abortReason = `MemAvailable ${(t.memAvailableKiB / 1024).toFixed(0)} MiB below ${MIN_AVAIL_MIB} MiB guard`;
          sampling = false;
        }
      } catch {
        /* daemon gone */
      }
      await delay(2000);
    }
  })();

  try {
    // The listener port only appears on stdout, so wait for it before building
    // a client that needs a concrete base URL.
    for (let i = 0; i < 3000 && !port; i++) {
      if (child.exitCode !== null) throw new Error(`early exit: ${err.slice(-900)}`);
      await delay(100);
    }
    if (!port) throw new Error('listener never published');
    const daemon = new DaemonClient({ baseUrl: `http://127.0.0.1:${port}`, token });
    for (let i = 0; i < 3000; i++) {
      if (child.exitCode !== null) throw new Error(`early exit: ${err.slice(-900)}`);
      try {
        const caps = await daemon.capabilities();
        if (caps.workspaces?.length === registered) break;
      } catch {
        /* not ready */
      }
      await delay(100);
    }
    record.readyMs = Math.round(performance.now() - started);
    const beforeAll = procTree(child.pid);
    record.baseline = { totalRssMiB: +(beforeAll.totalRssKiB / 1024).toFixed(1), childCount: beforeAll.childCount, memAvailMiB: +(beforeAll.memAvailableKiB / 1024).toFixed(0) };

    const sessions = [];
    for (let i = 0; i < concurrency; i++) {
      sessions.push(await DaemonSessionClient.createOrAttach(daemon, { workspaceCwd: workspaces[i] }));
    }
    record.sessionsCreated = sessions.length;

    // Count events per type so "real tool-using workload" is evidence, not an
    // inference from wall time. A prompt blocks forever on an unanswered
    // permission_request, so approve them here and record what was approved.
    const eventCounts = {};
    const approvals = [];
    const eventController = new AbortController();
    const eventTasks = sessions.map(async (s) => {
      try {
        for await (const event of s.events({ signal: eventController.signal })) {
          eventCounts[event.type] = (eventCounts[event.type] ?? 0) + 1;
          if (event.type !== 'permission_request') continue;
          const d = event.data ?? {};
          const options = Array.isArray(d.options) ? d.options : [];
          const pick =
            options.find((o) => /allow|proceed|yes|once/i.test(String(o.optionId)))?.optionId ??
            options[0]?.optionId;
          if (!pick || !d.requestId) continue;
          const toolName =
            (d.toolCall && typeof d.toolCall === 'object'
              ? (d.toolCall.title ?? d.toolCall.name ?? d.toolCall.kind)
              : undefined) ?? 'unknown';
          approvals.push({ tool: String(toolName).slice(0, 80), optionId: String(pick) });
          try {
            await daemon.respondToSessionPermission(d.sessionId ?? s.sessionId, d.requestId, {
              outcome: { outcome: 'selected', optionId: String(pick) },
            });
          } catch {
            /* lost the race or already resolved */
          }
        }
      } catch {
        /* aborted or stream ended */
      }
    });
    record.eventCounts = eventCounts;
    record.approvals = approvals;

    for (const [turnIndex, text] of TURNS.entries()) {
      if (aborted) break;
      const at = performance.now();
      const results = await Promise.allSettled(
        sessions.map(async (s, i) => {
          const t0 = performance.now();
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), promptTimeoutMs);
          try {
            const r = await s.prompt({ prompt: [{ type: 'text', text }] }, controller.signal);
            return { i, ms: Math.round(performance.now() - t0), stopReason: r?.stopReason ?? null };
          } finally {
            clearTimeout(timer);
          }
        }),
      );
      const peak = record.samples.reduce((m, s) => Math.max(m, s.totalRssKiB), 0);
      const minAvail = record.samples.reduce((m, s) => Math.min(m, s.memAvailableKiB), Infinity);
      record.turns.push({
        turn: turnIndex + 1,
        wallMs: Math.round(performance.now() - at),
        ok: results.filter((r) => r.status === 'fulfilled').length,
        failed: results.filter((r) => r.status === 'rejected').map((r) => String(r.reason?.message ?? r.reason).slice(0, 200)),
        perPrompt: results.filter((r) => r.status === 'fulfilled').map((r) => r.value),
        peakTreeRssMiB: +(peak / 1024).toFixed(1),
        minMemAvailMiB: +(minAvail / 1024).toFixed(0),
        treeAfter: (() => { const t = procTree(child.pid); return { totalRssMiB: +(t.totalRssKiB / 1024).toFixed(1), daemonRssMiB: +(t.daemonRssKiB / 1024).toFixed(1), childCount: t.childCount, fds: t.totalFds, loadavg: t.loadavg }; })(),
      });
      console.log(JSON.stringify({ level: concurrency, ...record.turns.at(-1), perPrompt: undefined }));
    }
    await delay(5000);
    const settled = procTree(child.pid);
    record.settled = { totalRssMiB: +(settled.totalRssKiB / 1024).toFixed(1), daemonRssMiB: +(settled.daemonRssKiB / 1024).toFixed(1), childCount: settled.childCount, memAvailMiB: +(settled.memAvailableKiB / 1024).toFixed(0) };
    eventController.abort();
    await Promise.allSettled(eventTasks);
  } catch (e) {
    record.error = String(e?.stack ?? e).slice(0, 1500);
    console.log(JSON.stringify({ level: concurrency, error: record.error.split('\n')[0] }));
  } finally {
    sampling = false;
    await samplerTask;
    record.peakTreeRssMiB = +(record.samples.reduce((m, s) => Math.max(m, s.totalRssKiB), 0) / 1024).toFixed(1);
    record.minMemAvailMiB = +(record.samples.reduce((m, s) => Math.min(m, s.memAvailableKiB), Infinity) / 1024).toFixed(0);
    record.peakChildCount = record.samples.reduce((m, s) => Math.max(m, s.childCount), 0);
    if (child.exitCode === null) {
      child.kill('SIGTERM');
      for (let i = 0; i < 300 && child.exitCode === null && child.signalCode === null; i++) await delay(100);
      if (child.exitCode === null && child.signalCode === null) {
        record.forcedKill = true;
        try { process.kill(-child.pid, 'SIGKILL'); } catch { /* gone */ }
      }
    }
    record.exitCode = child.exitCode;
    record.oomLines = oomKills();
    record.finishedAt = new Date().toISOString();
    await fsp.mkdir(OUT, { recursive: true });
    await fsp.writeFile(path.join(OUT, `${label}.json`), JSON.stringify(record, null, 2) + '\n');
    await fsp.writeFile(
      path.join(OUT, `${label}.log`),
      `--- stdout ---\n${out}\n--- stderr ---\n${err}`.replaceAll(token, '<redacted>').replaceAll(API_KEY, '<redacted-api-key>'),
    );
    // Keep the daemon's own log: it carries the model/provider diagnostics that
    // stdout does not, and the fixture is about to be deleted.
    try {
      const logDir = path.join(fixture, 'runtime/debug/daemon');
      for (const f of await fsp.readdir(logDir)) {
        const body = await fsp.readFile(path.join(logDir, f), 'utf8');
        await fsp.writeFile(
          path.join(OUT, `${label}-daemon-${f}`),
          body.replaceAll(token, '<redacted>').replaceAll(API_KEY, '<redacted-api-key>'),
        );
      }
    } catch {
      /* no daemon log written */
    }
    await fsp.rm(fixture, { recursive: true, force: true });
  }
  return record;
}

const all = [];
for (const c of levels) {
  const r = await runLevel(c);
  all.push(r);
  console.log(
    `LEVEL ${c}: ready=${r.readyMs}ms baseline=${r.baseline?.totalRssMiB}MiB peak=${r.peakTreeRssMiB}MiB ` +
      `minAvail=${r.minMemAvailMiB}MiB children=${r.peakChildCount} exit=${r.exitCode} ` +
      `turnsOk=${r.turns.map((t) => t.ok).join('/')} ${r.abortReason ?? ''} ${r.error ? 'ERROR' : ''}`,
  );
  if (r.abortReason || r.error) {
    console.log('stopping escalation');
    break;
  }
  await delay(10000);
}
await fsp.writeFile(
  path.join(OUT, `load-summary-${profile}-r${registered}.json`),
  JSON.stringify(
    all.map((r) => ({
      concurrency: r.concurrency, readyMs: r.readyMs, baseline: r.baseline, settled: r.settled,
      peakTreeRssMiB: r.peakTreeRssMiB, minMemAvailMiB: r.minMemAvailMiB, peakChildCount: r.peakChildCount,
      eventCounts: r.eventCounts,
      approvals: r.approvals,
      turns: r.turns?.map((t) => ({ turn: t.turn, wallMs: t.wallMs, ok: t.ok, failed: t.failed, perPrompt: t.perPrompt, peakTreeRssMiB: t.peakTreeRssMiB, minMemAvailMiB: t.minMemAvailMiB, treeAfter: t.treeAfter })),
      exitCode: r.exitCode, forcedKill: r.forcedKill, abortReason: r.abortReason,
      oomLines: r.oomLines, error: r.error ? r.error.split('\n')[0] : undefined,
    })),
    null,
    2,
  ) + '\n',
);
console.log(`WROTE ${path.join(OUT, `load-summary-${profile}-r${registered}.json`)}`);
