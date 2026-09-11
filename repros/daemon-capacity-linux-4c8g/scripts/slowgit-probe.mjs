// Does a git-status timeout surface to the client, or silently return stale 200?
//
// `runGit` swallows its 5 s timeout and returns null, so `getGitWorkingTreeStatus`
// returns null without throwing. This probe forces that path with a git shim that
// delays only `status`, and compares the `wait=1` response against a control
// daemon running real git.

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';

const ROOT = '/root/cap';
const CLI = '/root/qwen-code/dist/cli.js';
const WS = path.join(ROOT, 'repos/ws000');
const SHIM_DIR = path.join(ROOT, 'slowgit');

await fsp.mkdir(SHIM_DIR, { recursive: true });
await fsp.writeFile(
  path.join(SHIM_DIR, 'git'),
  `#!/bin/sh
# Delay only 'status' so branch resolution stays fast and the delay lands
# squarely on getGitWorkingTreeStatus's 5s timeout.
for a in "$@"; do
  if [ "$a" = "status" ]; then sleep 6; break; fi
done
exec /usr/bin/git "$@"
`,
);
await fsp.chmod(path.join(SHIM_DIR, 'git'), 0o755);

async function run(label, { slowGit }) {
  const fixture = path.join(ROOT, 'fixtures', `probe-${label}`);
  await fsp.rm(fixture, { recursive: true, force: true });
  for (const d of ['config', 'runtime', 'os-home', 'tmp', 'cache'])
    await fsp.mkdir(path.join(fixture, d), { recursive: true });

  let modelRequests = 0;
  const mock = http.createServer((_q, res) => {
    modelRequests++;
    res.writeHead(503).end('{}');
  });
  await new Promise((r) => mock.listen(0, '127.0.0.1', r));
  const baseUrl = `http://127.0.0.1:${mock.address().port}/v1`;

  await fsp.writeFile(
    path.join(fixture, 'config/settings.json'),
    JSON.stringify({
      security: { folderTrust: { enabled: false }, auth: { selectedType: 'openai' } },
      modelProviders: {
        openai: [{ id: 'm', name: 'M', baseUrl, envKey: 'QWEN_CAPACITY_API_KEY' }],
      },
      model: { name: 'm', baseUrl },
      telemetry: { enabled: false },
    }),
  );
  await fsp.writeFile(path.join(fixture, 'system-settings.json'), '{}');
  await fsp.writeFile(
    path.join(fixture, 'config/trustedFolders.json'),
    JSON.stringify({ [WS]: 'TRUST_FOLDER' }),
  );
  await fsp.writeFile(
    path.join(fixture, 'probe.cjs'),
    "const os=require('node:os');os.homedir=()=>process.env.QWEN_CAPACITY_OS_HOME;require('node:module').syncBuiltinESMExports();\n",
  );

  const token = randomBytes(24).toString('hex');
  const env = {
    PATH: slowGit ? `${SHIM_DIR}:${process.env.PATH}` : process.env.PATH,
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
    QWEN_CAPACITY_API_KEY: 'dummy',
    QWEN_SANDBOX: 'false',
    QWEN_CODE_SKIP_UPDATE_CHECK_ONCE: 'true',
    QWEN_TELEMETRY_ENABLED: 'false',
    VITEST_WORKER_ID: 'capacity-experiment',
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_CONFIG_NOSYSTEM: '1',
    CI: 'true',
    TERM: 'dumb',
    NO_COLOR: '1',
    NO_PROXY: '127.0.0.1,localhost',
  };

  let out = '';
  let err = '';
  let port;
  const child = spawn(
    process.execPath,
    [CLI, 'serve', '--hostname', '127.0.0.1', '--port', '0', '--no-open', '--no-web', '--workspace', WS],
    { cwd: WS, env, stdio: ['ignore', 'pipe', 'pipe'], detached: true },
  );
  child.stdout.on('data', (c) => {
    out += c;
    port ??= Number(out.match(/listening on http:\/\/127\.0\.0\.1:(\d+)/)?.[1]) || undefined;
  });
  child.stderr.on('data', (c) => (err += c));

  const req = async (route) => {
    const at = performance.now();
    const res = await fetch(`http://127.0.0.1:${port}${route}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(120000),
    });
    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = text.slice(0, 300);
    }
    return { status: res.status, body, ms: Math.round(performance.now() - at) };
  };

  const result = { label, slowGit };
  try {
    for (let i = 0; i < 1200; i++) {
      if (child.exitCode !== null) throw new Error(`early exit: ${err.slice(-800)}`);
      if (port) {
        const s = await req('/daemon/status?detail=full');
        if (s.status === 200 && s.body?.runtime?.memory?.registeredWorkspaces === 1) break;
      }
      await delay(100);
    }
    const caps = await req('/capabilities');
    const id = caps.body.workspaces[0].id;
    result.calls = [];
    for (const route of [
      `/workspaces/${encodeURIComponent(id)}/git?wait=1`,
      `/workspaces/${encodeURIComponent(id)}/git?wait=1`,
      `/workspaces/${encodeURIComponent(id)}/git`,
    ]) {
      result.calls.push({ route: route.replace(id, '<id>'), ...(await req(route)) });
    }
    result.modelRequests = modelRequests;
  } catch (e) {
    result.error = String(e?.message ?? e);
  } finally {
    child.kill('SIGTERM');
    for (let i = 0; i < 100 && child.exitCode === null && child.signalCode === null; i++)
      await delay(100);
    result.exitCode = child.exitCode;
    result.gitStderrLines = err
      .split('\n')
      .filter((l) => /git/i.test(l))
      .slice(0, 5);
    await new Promise((r) => mock.close(r));
    await fsp.writeFile(
      path.join(ROOT, 'out', `probe-${label}.log`),
      `--- stdout ---\n${out}\n--- stderr ---\n${err}`.replaceAll(token, '<redacted>'),
    );
    await fsp.rm(fixture, { recursive: true, force: true });
  }
  console.log(JSON.stringify(result, null, 2));
  return result;
}

const control = await run('control', { slowGit: false });
const slow = await run('slowgit', { slowGit: true });
await fsp.writeFile(
  path.join(ROOT, 'out', 'probe-timeout-summary.json'),
  JSON.stringify({ control, slow }, null, 2) + '\n',
);
console.log('WROTE /root/cap/out/probe-timeout-summary.json');
