// Linux 4c8g workspace-capacity harness for QwenLM/qwen-code#11386.
//
// Measures what the macOS P1 evidence explicitly did not cover: Linux limits,
// real Git repositories, FD/inotify accounting, startup and list/Git latency,
// a full default keepalive interval, registration churn, and fixed active-child
// workloads separated from idle registration cost.
//
// No model traffic: a local 503 server stands in for the provider and every run
// asserts it was never called.

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';

const ROOT = '/root/cap';
const CLI = '/root/qwen-code/dist/cli.js';
const REPOS = path.join(ROOT, 'repos');
const OUT = path.join(ROOT, 'out');

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) {
  args.set(process.argv[i].replace(/^--/, ''), process.argv[i + 1]);
}
const phase = args.get('phase') ?? 'ladder';
const counts = (args.get('counts') ?? '1,25,64,128,256').split(',').map(Number);
const childLevels = (args.get('children') ?? '0,2,4').split(',').map(Number);
const soakSeconds = Number(args.get('duration') ?? 660);
const cycles = Number(args.get('cycles') ?? 5);
const label = args.get('label') ?? phase;

/* ------------------------------ /proc metrics ------------------------------ */

function readProcTree(rootPid) {
  const pids = fs
    .readdirSync('/proc')
    .filter((name) => /^\d+$/.test(name))
    .map(Number);
  const parent = new Map();
  for (const pid of pids) {
    try {
      const stat = fs.readFileSync(`/proc/${pid}/stat`, 'utf8');
      // comm can contain spaces and parentheses; ppid is the field after ')'.
      const tail = stat.slice(stat.lastIndexOf(')') + 2).split(' ');
      parent.set(pid, Number(tail[1]));
    } catch {
      /* process exited while sampling */
    }
  }
  const tree = new Set([rootPid]);
  let size;
  do {
    size = tree.size;
    for (const [pid, ppid] of parent) if (tree.has(ppid)) tree.add(pid);
  } while (tree.size !== size);
  return [...tree].filter((pid) => parent.has(pid));
}

function readProcess(pid) {
  const status = fs.readFileSync(`/proc/${pid}/status`, 'utf8');
  const field = (name) => {
    const match = new RegExp(`^${name}:\\s+(\\d+)`, 'm').exec(status);
    return match ? Number(match[1]) : null;
  };
  const fdDir = `/proc/${pid}/fd`;
  const fds = fs.readdirSync(fdDir);
  const kinds = {};
  let inotifyInstances = 0;
  let inotifyWatches = 0;
  for (const fd of fds) {
    let target;
    try {
      target = fs.readlinkSync(path.join(fdDir, fd));
    } catch {
      continue;
    }
    let kind;
    if (target.startsWith('socket:')) kind = 'socket';
    else if (target.startsWith('pipe:')) kind = 'pipe';
    else if (target === 'anon_inode:inotify' || target.endsWith(':inotify'))
      kind = 'inotify';
    else if (target.includes('[eventpoll]')) kind = 'eventpoll';
    else if (target.includes('[eventfd]')) kind = 'eventfd';
    else if (target.includes('[timerfd]')) kind = 'timerfd';
    else if (target.startsWith('anon_inode:')) kind = 'anon';
    else kind = 'file';
    kinds[kind] = (kinds[kind] ?? 0) + 1;
    if (kind === 'inotify') {
      inotifyInstances++;
      try {
        const info = fs.readFileSync(`/proc/${pid}/fdinfo/${fd}`, 'utf8');
        inotifyWatches += (info.match(/^inotify wd:/gm) ?? []).length;
      } catch {
        /* fd closed while sampling */
      }
    }
  }
  let command = '';
  try {
    command = fs
      .readFileSync(`/proc/${pid}/cmdline`, 'utf8')
      .split('\0')
      .filter(Boolean)
      .join(' ')
      .slice(0, 200);
  } catch {
    /* ignore */
  }
  return {
    pid,
    command,
    rssKiB: field('VmRSS'),
    vmSizeKiB: field('VmSize'),
    threads: field('Threads'),
    fdCount: fds.length,
    fdKinds: kinds,
    inotifyInstances,
    inotifyWatches,
  };
}

function treeMetrics(rootPid) {
  const processes = [];
  for (const pid of readProcTree(rootPid)) {
    try {
      processes.push(readProcess(pid));
    } catch {
      /* exited */
    }
  }
  const sum = (key) => processes.reduce((acc, p) => acc + (p[key] ?? 0), 0);
  const daemon = processes.find((p) => p.pid === rootPid) ?? null;
  return {
    processCount: processes.length,
    daemon,
    children: processes.filter((p) => p.pid !== rootPid),
    total: {
      rssKiB: sum('rssKiB'),
      threads: sum('threads'),
      fdCount: sum('fdCount'),
      inotifyInstances: sum('inotifyInstances'),
      inotifyWatches: sum('inotifyWatches'),
    },
  };
}

function systemMetrics() {
  const meminfo = fs.readFileSync('/proc/meminfo', 'utf8');
  const kb = (name) => {
    const m = new RegExp(`^${name}:\\s+(\\d+) kB`, 'm').exec(meminfo);
    return m ? Number(m[1]) : null;
  };
  return {
    memAvailableKiB: kb('MemAvailable'),
    memFreeKiB: kb('MemFree'),
    loadavg: fs.readFileSync('/proc/loadavg', 'utf8').trim().split(' ').slice(0, 3),
    inotifyMaxInstances: Number(
      fs.readFileSync('/proc/sys/fs/inotify/max_user_instances', 'utf8'),
    ),
    inotifyMaxWatches: Number(
      fs.readFileSync('/proc/sys/fs/inotify/max_user_watches', 'utf8'),
    ),
  };
}

/* ------------------------------ inspector client --------------------------- */

async function inspectorClient(url) {
  const socket = new WebSocket(url);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let serial = 0;
  const pending = new Map();
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data));
    const item = pending.get(message.id);
    if (!item) return;
    clearTimeout(item.timer);
    pending.delete(message.id);
    if (message.error) item.reject(new Error(JSON.stringify(message.error)));
    else item.resolve(message.result);
  });
  const call = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++serial;
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`inspector timeout: ${method}`));
      }, 30000);
      pending.set(id, { resolve, reject, timer });
      socket.send(JSON.stringify({ id, method, params }));
    });
  return {
    call,
    async evaluate(expression) {
      const result = await call('Runtime.evaluate', {
        expression,
        returnByValue: true,
      });
      if (result.exceptionDetails)
        throw new Error(JSON.stringify(result.exceptionDetails));
      return result.result.value;
    },
    async collectGarbage() {
      await call('HeapProfiler.collectGarbage');
    },
    close() {
      try {
        socket.close();
      } catch {
        /* ignore */
      }
    },
  };
}

/* --------------------------------- helpers -------------------------------- */

const quantile = (values, q) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor(q * sorted.length));
  return +sorted[index].toFixed(1);
};

async function portOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port });
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
    socket.setTimeout(500, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

/* ---------------------------------- run ----------------------------------- */

async function run({
  runLabel,
  count,
  preheat = false,
  fixtureName = runLabel,
  reuseFixture = false,
  keepFixture = false,
  expectRegistered,
  work = async () => {},
}) {
  // A restore run starts with one --workspace flag but must become ready only
  // once the persisted store has been replayed, so readiness is its own knob.
  const readyCount = expectRegistered ?? count;
  // The persisted registration store is keyed by a scope hash derived from the
  // fixture paths, so a restart test has to reuse the very same fixture dir.
  const fixture = path.join(ROOT, 'fixtures', fixtureName);
  if (!reuseFixture) await fsp.rm(fixture, { recursive: true, force: true });
  for (const dir of ['config', 'runtime', 'os-home', 'tmp', 'cache'])
    await fsp.mkdir(path.join(fixture, dir), { recursive: true });

  const workspaces = Array.from({ length: count }, (_, i) =>
    path.join(REPOS, `ws${String(i).padStart(3, '0')}`),
  );

  let modelRequests = 0;
  const mock = http.createServer((_req, res) => {
    modelRequests++;
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end('{"error":"capacity harness expects no model calls"}');
  });
  await new Promise((resolve) => mock.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${mock.address().port}/v1`;

  await fsp.writeFile(
    path.join(fixture, 'config/settings.json'),
    JSON.stringify({
      security: { folderTrust: { enabled: false }, auth: { selectedType: 'openai' } },
      modelProviders: {
        openai: [
          {
            id: 'capacity-model',
            name: 'Capacity Model',
            baseUrl,
            envKey: 'QWEN_CAPACITY_API_KEY',
          },
        ],
      },
      model: { name: 'capacity-model', baseUrl },
      telemetry: { enabled: false },
    }),
  );
  await fsp.writeFile(path.join(fixture, 'system-settings.json'), '{}');
  await fsp.writeFile(
    path.join(fixture, 'config/trustedFolders.json'),
    JSON.stringify(
      Object.fromEntries(
        Array.from({ length: 257 }, (_, i) => [
          path.join(REPOS, `ws${String(i).padStart(3, '0')}`),
          'TRUST_FOLDER',
        ]),
      ),
    ),
  );
  await fsp.writeFile(
    path.join(fixture, 'probe.cjs'),
    "const os=require('node:os');os.homedir=()=>process.env.QWEN_CAPACITY_OS_HOME;" +
      "require('node:module').syncBuiltinESMExports();\n",
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
    QWEN_CAPACITY_API_KEY: 'local-experiment-dummy',
    QWEN_SANDBOX: 'false',
    QWEN_CODE_SKIP_UPDATE_CHECK_ONCE: 'true',
    QWEN_TELEMETRY_ENABLED: 'false',
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_CONFIG_NOSYSTEM: '1',
    CI: 'true',
    TERM: 'dumb',
    NO_COLOR: '1',
    NO_PROXY: '127.0.0.1,localhost',
  };
  // Startup ACP preheat is on unless VITEST_WORKER_ID exists; the ladder wants a
  // child-free host baseline, the preheat run wants production default.
  if (!preheat) env.VITEST_WORKER_ID = 'capacity-experiment';

  const record = {
    runLabel,
    count,
    readyCount,
    preheat,
    startedAt: new Date().toISOString(),
    cli: CLI,
    node: process.version,
    system: { before: systemMetrics() },
    samples: [],
    latency: {},
    events: [],
  };

  let stdout = '';
  let stderr = '';
  let port;
  let inspector;
  const started = performance.now();
  const child = spawn(
    process.execPath,
    [
      '--inspect=127.0.0.1:0',
      CLI,
      'serve',
      '--hostname',
      '127.0.0.1',
      '--port',
      '0',
      '--no-open',
      '--no-web',
      ...workspaces.flatMap((cwd) => ['--workspace', cwd]),
    ],
    { cwd: workspaces[0], env, stdio: ['ignore', 'pipe', 'pipe'], detached: true },
  );
  record.pid = child.pid;
  child.stdout.on('data', (chunk) => {
    stdout += chunk;
    if (!port) {
      const match = stdout.match(/listening on http:\/\/127\.0\.0\.1:(\d+)/);
      if (match) {
        port = Number(match[1]);
        record.listenerMs = +(performance.now() - started).toFixed(1);
      }
    }
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk;
  });

  const request = async (route, body, method = body === undefined ? 'GET' : 'POST') => {
    const at = performance.now();
    const response = await fetch(`http://127.0.0.1:${port}${route}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(120000),
    });
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text.slice(0, 400);
    }
    return { status: response.status, body: data, ms: performance.now() - at };
  };
  const ok = async (route, body, method) => {
    const result = await request(route, body, method);
    if (result.status < 200 || result.status >= 300)
      throw new Error(`${route} -> ${result.status} ${JSON.stringify(result.body).slice(0, 300)}`);
    return result;
  };

  const sample = async (tag) => {
    const tree = treeMetrics(child.pid);
    let heap = null;
    try {
      heap = await inspector?.evaluate(
        '({memory:process.memoryUsage(),cpu:process.cpuUsage(),resources:process.getActiveResourcesInfo()})',
      );
    } catch {
      /* inspector may be busy */
    }
    const status = await request('/daemon/status?detail=full');
    const entry = {
      tag,
      at: new Date().toISOString(),
      elapsedMs: +(performance.now() - started).toFixed(0),
      tree,
      heap,
      system: systemMetrics(),
      registeredWorkspaces: status.body?.runtime?.memory?.registeredWorkspaces ?? null,
      activeAcpChildren: status.body?.runtime?.memory?.activeAcpChildren ?? null,
      activeSessions: status.body?.runtime?.sessions?.active ?? null,
      limits: status.body?.limits ?? null,
      startupPreheat: status.body?.startup?.preheat ?? null,
    };
    record.samples.push(entry);
    console.log(
      JSON.stringify({
        runLabel,
        tag,
        registered: entry.registeredWorkspaces,
        acpChildren: entry.activeAcpChildren,
        procs: tree.processCount,
        treeRssMiB: +(tree.total.rssKiB / 1024).toFixed(1),
        daemonRssMiB: +((tree.daemon?.rssKiB ?? 0) / 1024).toFixed(1),
        heapMiB: heap ? +(heap.memory.heapUsed / 1048576).toFixed(1) : null,
        fd: tree.total.fdCount,
        inotifyFd: tree.total.inotifyInstances,
        inotifyWatches: tree.total.inotifyWatches,
        memAvailMiB: +(entry.system.memAvailableKiB / 1024).toFixed(0),
      }),
    );
    return entry;
  };

  try {
    for (;;) {
      if (child.exitCode !== null)
        throw new Error(`early exit ${child.exitCode}: ${stderr.slice(-1500)}`);
      if (performance.now() - started > 600000) throw new Error('startup timeout');
      if (port) {
        const status = await request('/daemon/status?detail=full');
        if (
          status.status === 200 &&
          status.body?.runtime?.memory?.registeredWorkspaces === readyCount
        ) {
          record.readyMs = +(performance.now() - started).toFixed(1);
          break;
        }
      }
      await delay(100);
    }

    const debuggerUrl = stderr.match(/Debugger listening on (ws:\/\/\S+)/)?.[1];
    if (debuggerUrl) inspector = await inspectorClient(debuggerUrl);

    const capabilities = await ok('/capabilities');
    record.capabilities = {
      workspaces: capabilities.body.workspaces.length,
      trusted: capabilities.body.workspaces.filter((w) => w.trusted).length,
      limits: capabilities.body.limits,
      ms: +capabilities.ms.toFixed(1),
    };
    record.workspaceIds = capabilities.body.workspaces.map((w) => w.id);

    await sample('ready');
    await work({ record, request, ok, sample, capabilities, child, workspaces });

    if (inspector) {
      await inspector.collectGarbage();
      await delay(300);
      await sample('after-gc');
    }
    record.modelRequests = modelRequests;
    if (modelRequests !== 0)
      throw new Error(`unexpected model requests: ${modelRequests}`);
  } catch (error) {
    record.error = String(error?.stack ?? error);
    console.log(JSON.stringify({ runLabel, error: record.error.split('\n')[0] }));
  } finally {
    const before = treeMetrics(child.pid);
    record.childrenBeforeStop = before.children.map((c) => c.pid);
    inspector?.close();
    if (child.exitCode === null) {
      child.kill('SIGTERM');
      for (let i = 0; i < 300 && child.exitCode === null && child.signalCode === null; i++)
        await delay(100);
      if (child.exitCode === null && child.signalCode === null) {
        record.forcedKill = true;
        try {
          process.kill(-child.pid, 'SIGKILL');
        } catch {
          /* already gone */
        }
        await delay(1000);
      }
    }
    await delay(500);
    const leftover = record.childrenBeforeStop.filter((pid) =>
      fs.existsSync(`/proc/${pid}`),
    );
    record.cleanup = {
      exitCode: child.exitCode,
      signalCode: child.signalCode,
      portClosed: port ? !(await portOpen(port)) : null,
      leftoverPids: leftover,
      daemonAlive: fs.existsSync(`/proc/${child.pid}`),
    };
    record.system.after = systemMetrics();
    await new Promise((resolve) => mock.close(resolve));
    record.finishedAt = new Date().toISOString();
    await fsp.mkdir(OUT, { recursive: true });
    await fsp.writeFile(
      path.join(OUT, `${runLabel}.json`),
      JSON.stringify(record, null, 2) + '\n',
    );
    await fsp.writeFile(
      path.join(OUT, `${runLabel}.log`),
      `--- stdout ---\n${stdout}\n--- stderr ---\n${stderr}`.replaceAll(token, '<redacted>'),
    );
    if (!keepFixture) await fsp.rm(fixture, { recursive: true, force: true });
  }
  return record;
}

/* -------------------------------- git warm -------------------------------- */

async function gitWarm({ record, ok, workspaceIds, tag = 'git' }) {
  const durations = [];
  const at = performance.now();
  for (const id of workspaceIds) {
    const result = await ok(`/workspaces/${encodeURIComponent(id)}/git?wait=1`);
    durations.push(result.ms);
  }
  record.latency[tag] = {
    calls: durations.length,
    totalMs: +(performance.now() - at).toFixed(0),
    p50: quantile(durations, 0.5),
    p95: quantile(durations, 0.95),
    max: durations.length ? +Math.max(...durations).toFixed(1) : null,
  };
}

async function measureListLatency({ record, ok, rounds = 5 }) {
  const caps = [];
  const status = [];
  for (let i = 0; i < rounds; i++) {
    caps.push((await ok('/capabilities')).ms);
    status.push((await ok('/daemon/status?detail=full')).ms);
    await delay(200);
  }
  record.latency.capabilities = { p50: quantile(caps, 0.5), max: +Math.max(...caps).toFixed(1) };
  record.latency.statusFull = {
    p50: quantile(status, 0.5),
    max: +Math.max(...status).toFixed(1),
  };
}

/* --------------------------------- phases --------------------------------- */

const results = [];

if (phase === 'ladder') {
  for (const count of counts) {
    results.push(
      await run({
        runLabel: `ladder-n${count}`,
        count,
        work: async ({ record, ok, sample }) => {
          await measureListLatency({ record, ok });
          await gitWarm({ record, ok, workspaceIds: record.workspaceIds });
          await delay(3000);
          await sample('git-warmed');
          await delay(10000);
          await sample('settled');
        },
      }),
    );
  }
}

if (phase === 'preheat') {
  results.push(
    await run({
      runLabel: `preheat-n${counts[0]}`,
      count: counts[0],
      preheat: true,
      work: async ({ record, ok, sample }) => {
        await delay(15000);
        await sample('preheat-settled');
        await measureListLatency({ record, ok });
        await gitWarm({ record, ok, workspaceIds: record.workspaceIds });
        await sample('preheat-git-warmed');
      },
    }),
  );
}

if (phase === 'children') {
  const count = counts[0];
  for (const level of childLevels) {
    results.push(
      await run({
        runLabel: `children-n${count}-a${level}`,
        count,
        work: async ({ record, ok, sample }) => {
          await gitWarm({ record, ok, workspaceIds: record.workspaceIds });
          const ensureMs = [];
          for (let i = 0; i < level; i++) {
            const id = record.workspaceIds[i];
            const result = await ok(
              `/workspaces/${encodeURIComponent(id)}/runtime/ensure`,
              {},
            );
            ensureMs.push(+result.ms.toFixed(0));
            await sample(`ensured-${i + 1}`);
          }
          record.latency.ensureMs = ensureMs;
          await delay(15000);
          const settled = await sample('children-settled');
          if (settled.activeAcpChildren !== level)
            record.events.push(
              `expected ${level} acp children, saw ${settled.activeAcpChildren}`,
            );
          await measureListLatency({ record, ok });
          await gitWarm({
            record,
            ok,
            workspaceIds: record.workspaceIds,
            tag: 'git-with-children',
          });
          await sample('children-after-git');
        },
      }),
    );
  }
}

if (phase === 'soak') {
  results.push(
    await run({
      runLabel: `soak-n${counts[0]}`,
      count: counts[0],
      work: async ({ record, ok, sample }) => {
        await gitWarm({ record, ok, workspaceIds: record.workspaceIds });
        const deadline = Date.now() + soakSeconds * 1000;
        let index = 0;
        while (Date.now() < deadline) {
          await delay(30000);
          await sample(`soak-${++index}`);
        }
        await measureListLatency({ record, ok });
        await gitWarm({ record, ok, workspaceIds: record.workspaceIds, tag: 'git-after-soak' });
        await sample('soak-final');
      },
    }),
  );
}

if (phase === 'churn') {
  const count = counts[0];
  results.push(
    await run({
      runLabel: `churn-n${count}`,
      count: 1,
      work: async ({ record, ok, sample, workspaces: _ws }) => {
        record.cycleStats = [];
        for (let cycle = 1; cycle <= cycles; cycle++) {
          const at = performance.now();
          for (let i = 1; i < count; i++)
            await ok('/workspaces', {
              cwd: path.join(REPOS, `ws${String(i).padStart(3, '0')}`),
              persist: false,
            });
          const full = await ok('/capabilities');
          const ids = full.body.workspaces.map((w) => w.id);
          if (ids.length !== count)
            throw new Error(`cycle ${cycle}: registered ${ids.length}, expected ${count}`);
          await gitWarm({ record, ok, workspaceIds: ids, tag: `git-cycle-${cycle}` });
          const loaded = await sample(`cycle-${cycle}-loaded`);
          for (const workspace of full.body.workspaces.filter((w) => !w.primary))
            await ok(`/workspaces/${encodeURIComponent(workspace.id)}`, {}, 'DELETE');
          await delay(3000);
          const drained = await sample(`cycle-${cycle}-drained`);
          record.cycleStats.push({
            cycle,
            durationMs: +(performance.now() - at).toFixed(0),
            loadedRssKiB: loaded.tree.total.rssKiB,
            loadedInotify: loaded.tree.total.inotifyInstances,
            loadedWatches: loaded.tree.total.inotifyWatches,
            loadedFd: loaded.tree.total.fdCount,
            drainedRegistered: drained.registeredWorkspaces,
            drainedRssKiB: drained.tree.total.rssKiB,
            drainedInotify: drained.tree.total.inotifyInstances,
            drainedWatches: drained.tree.total.inotifyWatches,
            drainedFd: drained.tree.total.fdCount,
          });
          if (drained.registeredWorkspaces !== 1)
            throw new Error(`cycle ${cycle}: drained to ${drained.registeredWorkspaces}`);
        }
      },
    }),
  );
}

if (phase === 'restore') {
  const count = counts[0];
  const fixtureName = `restore-n${count}-store`;
  // Seed persisted registrations, then restart the same fixture with a single
  // --workspace flag so every other workspace can only come from the store.
  results.push(
    await run({
      runLabel: `restore-n${count}-seed`,
      fixtureName,
      keepFixture: true,
      count: 1,
      work: async ({ record, ok, sample }) => {
        const at = performance.now();
        for (let i = 1; i < count; i++)
          await ok('/workspaces', {
            cwd: path.join(REPOS, `ws${String(i).padStart(3, '0')}`),
            persist: true,
            displayName: `Repo ${i}`,
          });
        record.latency.persistRegisterMs = +(performance.now() - at).toFixed(0);
        const full = await ok('/capabilities');
        if (full.body.workspaces.length !== count)
          throw new Error(`seed registered ${full.body.workspaces.length}`);
        await sample('seeded');
      },
    }),
  );
  results.push(
    await run({
      runLabel: `restore-n${count}-restart`,
      fixtureName,
      reuseFixture: true,
      count: 1,
      expectRegistered: count,
      work: async ({ record, ok, sample }) => {
        const restored = await ok('/capabilities');
        record.restored = {
          workspaces: restored.body.workspaces.length,
          named: restored.body.workspaces.filter((w) => w.displayName).length,
        };
        await sample('restarted');
        await measureListLatency({ record, ok });
        await gitWarm({ record, ok, workspaceIds: record.workspaceIds });
        await sample('restart-git-warmed');
      },
    }),
  );
}

await fsp.mkdir(OUT, { recursive: true });
await fsp.writeFile(
  path.join(OUT, `${label}-summary.json`),
  JSON.stringify(
    results.map((r) => ({
      runLabel: r.runLabel,
      count: r.count,
      preheat: r.preheat,
      listenerMs: r.listenerMs,
      readyMs: r.readyMs,
      error: r.error ? r.error.split('\n')[0] : undefined,
      cleanup: r.cleanup,
      latency: r.latency,
      cycleStats: r.cycleStats,
      finalSample: r.samples.at(-1)
        ? {
            tag: r.samples.at(-1).tag,
            treeRssKiB: r.samples.at(-1).tree.total.rssKiB,
            daemonRssKiB: r.samples.at(-1).tree.daemon?.rssKiB,
            heapUsed: r.samples.at(-1).heap?.memory?.heapUsed,
            fd: r.samples.at(-1).tree.total.fdCount,
            inotifyInstances: r.samples.at(-1).tree.total.inotifyInstances,
            inotifyWatches: r.samples.at(-1).tree.total.inotifyWatches,
            acpChildren: r.samples.at(-1).activeAcpChildren,
          }
        : null,
    })),
    null,
    2,
  ) + '\n',
);
console.log(`WROTE ${path.join(OUT, `${label}-summary.json`)}`);
if (results.some((r) => r.error)) process.exitCode = 1;
