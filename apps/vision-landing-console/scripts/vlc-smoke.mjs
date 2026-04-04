/**
 * Why: automated verification that the Vision Landing Console server and browser UI respond as designed.
 * What: spawns `server.js` on a free port, runs HTTP API checks, then Playwright clicks through main tabs, subtabs, Ardu categories, terrain controls, and key buttons.
 *
 * Run: `npm run test:smoke` from apps/vision-landing-console (first time: `npx playwright install chromium`).
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VLC_ROOT = path.resolve(__dirname, '..');
const PORT = process.env.VLC_SMOKE_PORT || '4031';
const BASE = `http://127.0.0.1:${PORT}`;

let serverProc = null;
const failures = [];
const warnings = [];

function fail(msg) {
  failures.push(msg);
  console.error(`FAIL: ${msg}`);
}

function warn(msg) {
  warnings.push(msg);
  console.warn(`WARN: ${msg}`);
}

function ok(msg) {
  console.log(`OK  ${msg}`);
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitHealth(maxMs = 20000) {
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    try {
      const r = await fetch(`${BASE}/api/health`);
      if (r.ok) return;
    } catch {
      /* retry */
    }
    await sleep(200);
  }
  throw new Error('Server did not become healthy in time');
}

function startServer() {
  serverProc = spawn(process.execPath, ['server.js'], {
    cwd: VLC_ROOT,
    env: { ...process.env, PORT },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  serverProc.stderr?.on('data', (d) => process.stderr.write(d));
  serverProc.stdout?.on('data', (d) => process.stdout.write(d));
  serverProc.on('error', (e) => console.error('spawn error', e));
}

function stopServer() {
  if (serverProc && !serverProc.killed) {
    try {
      serverProc.kill('SIGTERM');
    } catch {
      /* ignore */
    }
  }
  serverProc = null;
}

async function apiExpect(name, fn) {
  try {
    await fn();
    ok(`API ${name}`);
  } catch (e) {
    fail(`API ${name}: ${e?.message || e}`);
  }
}

async function runApiSuite() {
  await apiExpect('GET /api/health', async () => {
    const r = await fetch(`${BASE}/api/health`);
    if (!r.ok) throw new Error(`status ${r.status}`);
    const j = await r.json();
    if (!j.ok || j.project !== 'vision-landing-console') throw new Error(JSON.stringify(j));
  });

  await apiExpect('GET /api/meta', async () => {
    const r = await fetch(`${BASE}/api/meta`);
    if (!r.ok) throw new Error(String(r.status));
    const j = await r.json();
    if (!j.appVersion) throw new Error('missing appVersion');
  });

  await apiExpect('GET /api/jetson/status', async () => {
    const r = await fetch(`${BASE}/api/jetson/status`);
    const j = await r.json();
    if (j.installedVersion == null) throw new Error('missing installedVersion');
  });

  await apiExpect('GET /api/jetson/releases', async () => {
    const r = await fetch(`${BASE}/api/jetson/releases`);
    const j = await r.json();
    if (!Array.isArray(j.releases) || j.releases.length < 1) throw new Error('releases');
  });

  await apiExpect('GET /api/vision/nav-mode', async () => {
    const r = await fetch(`${BASE}/api/vision/nav-mode`);
    const j = await r.json();
    if (!j.mode) throw new Error(String(r.status));
  });

  await apiExpect('POST /api/vision/nav-mode toggle', async () => {
    for (const mode of ['satellite_match', 'prior_mission_map']) {
      const r = await fetch(`${BASE}/api/vision/nav-mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const j = await r.json();
      if (!j.ok || j.mode !== mode) throw new Error(JSON.stringify(j));
    }
  });

  await apiExpect('GET /api/flights', async () => {
    const r = await fetch(`${BASE}/api/flights`);
    const j = await r.json();
    if (!j.ok || !Array.isArray(j.flights)) throw new Error('flights');
  });

  await apiExpect('GET /api/flights/all-logs', async () => {
    const r = await fetch(`${BASE}/api/flights/all-logs`);
    const j = await r.json();
    if (!j.ok || !Array.isArray(j.logs)) throw new Error('all-logs');
  });

  await apiExpect('GET /api/terrain/coverage', async () => {
    const r = await fetch(`${BASE}/api/terrain/coverage`);
    const j = await r.json();
    if (!j.ok || !Array.isArray(j.cells)) throw new Error('coverage');
  });

  await apiExpect('GET /api/vision/latest', async () => {
    const r = await fetch(`${BASE}/api/vision/latest`);
    if (!r.ok) throw new Error(String(r.status));
  });

  await apiExpect('GET /api/vision/slam-latest', async () => {
    const r = await fetch(`${BASE}/api/vision/slam-latest`);
    if (!r.ok) throw new Error(String(r.status));
  });

  await apiExpect('POST /api/jetson/heartbeat', async () => {
    const r = await fetch(`${BASE}/api/jetson/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpuLoadPct: 12, tempC: 40, memPct: 30 }),
    });
    const j = await r.json();
    if (!j.ok) throw new Error(JSON.stringify(j));
  });

  await apiExpect('GET /api/stream (first telemetry event)', async () => {
    const ac = new AbortController();
    const to = setTimeout(() => ac.abort(), 8000);
    try {
      const res = await fetch(`${BASE}/api/stream`, { signal: ac.signal });
      if (!res.ok) throw new Error(String(res.status));
      const reader = res.body?.getReader();
      if (!reader) throw new Error('no body');
      const dec = new TextDecoder();
      let buf = '';
      const t0 = Date.now();
      while (Date.now() - t0 < 7000) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        if (buf.includes('event: telemetry') && buf.includes('jetson')) break;
      }
      if (!buf.includes('event: telemetry')) throw new Error('no telemetry event');
    } finally {
      clearTimeout(to);
    }
  });

  await apiExpect('GET / + static app.js', async () => {
    const r = await fetch(`${BASE}/`);
    if (!r.ok) throw new Error(String(r.status));
    const html = await r.text();
    const m = html.match(/app\.js\?v=([^"']+)/);
    if (!m) throw new Error('no app.js?v= in index');
    const r2 = await fetch(`${BASE}/app.js?v=${m[1]}`);
    if (!r2.ok) throw new Error(`app.js ${r2.status}`);
  });

  await apiExpect('GET /api/vision/config', async () => {
    const r = await fetch(`${BASE}/api/vision/config`);
    if (!r.ok) throw new Error(String(r.status));
  });

  await apiExpect('POST /api/vision/config', async () => {
    const r = await fetch(`${BASE}/api/vision/config`);
    const cur = await r.json();
    const r2 = await fetch(`${BASE}/api/vision/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: cur.profile || {},
        arduTarget: cur.arduTarget || {},
      }),
    });
    const j = await r2.json();
    if (!j.ok) throw new Error(JSON.stringify(j));
  });

  await apiExpect('POST /api/flights (smoke flight)', async () => {
    const r = await fetch(`${BASE}/api/flights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: `smoke-${Date.now()}` }),
    });
    const j = await r.json();
    if (!j.ok || !j.flight?.id) throw new Error(JSON.stringify(j));
  });
}

/**
 * Why: exercise DOM wiring without manual clicking. What: Playwright opens the app and asserts panel visibility after tab clicks.
 */
async function runPlaywrightSuite() {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    warn('Playwright not installed — skip UI suite (npm i -D playwright && npx playwright install chromium)');
    return;
  }

  const browser = await chromium.launch({ headless: true });
  const pageErrors = [];
  const consoleErrors = [];

  try {
    const context = await browser.newContext({ locale: 'he-IL' });
    const page = await context.newPage();
    page.on('pageerror', (e) => pageErrors.push(e.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // EventSource keeps the connection open — avoid waitUntil:'networkidle' (would hang).
    await page.goto(BASE, { waitUntil: 'load', timeout: 60000 });
    await sleep(800);

    async function expectPanelVisible(panelId) {
      const vis = await page.locator(`section#${panelId}.panel.visible`).count();
      if (vis !== 1) throw new Error(`expected single visible panel #${panelId}, got ${vis}`);
    }

    const mainTabs = ['control', 'recordings', 'flights', 'processes', 'telemetry', 'terrain', 'advisor'];
    for (const id of mainTabs) {
      await page.click(`.tab[data-tab="${id}"]`);
      if (id === 'terrain') {
        await page.waitForSelector('#terrainMap.leaflet-container', { timeout: 15000 });
      } else {
        await sleep(150);
      }
      await expectPanelVisible(id);
      ok(`UI main tab → #${id}`);
    }

    await page.click('.tab[data-tab="control"]');
    await sleep(100);

    const controlSubtabs = ['landingParams', 'abortParams', 'visionNavParams', 'arduParams'];
    for (const sid of controlSubtabs) {
      await page.click(`.subtab[data-subtab="${sid}"]`);
      await sleep(100);
      const vis = await page.locator(`#${sid}.subpanel.visible`).count();
      if (vis !== 1) fail(`control subtab ${sid}: visible count ${vis}`);
      else ok(`UI control subtab → #${sid}`);
    }

    await page.click('.subtab[data-subtab="arduParams"]');
    await sleep(400);
    const catButtons = page.locator('#arduParams .ardu-cat-subtab');
    const n = await catButtons.count();
    if (n < 2) fail(`Ardu category tabs expected >=2, got ${n}`);
    else {
      for (let i = 0; i < n; i++) {
        await catButtons.nth(i).click();
        await sleep(80);
        const visPanels = await page.locator('#arduParams .ardu-cat-subpanel.visible').count();
        if (visPanels !== 1) fail(`Ardu cat ${i}: visible subpanels=${visPanels}`);
      }
      ok(`UI ArduPilot: ${n} category tabs each show exactly one panel`);
    }

    await page.click('.tab[data-tab="recordings"]');
    await sleep(100);
    await page.click('#debriefLogsBtn');
    await sleep(80);
    await page.click('#debriefRecBtn');
    ok('UI recordings sub-tabs clicked');

    await page.click('.tab[data-tab="processes"]');
    await sleep(100);
    await page.click('#processNextBtn');
    await page.click('#processPrevBtn');
    ok('UI process next/prev');

    await page.click('.tab[data-tab="telemetry"]');
    await sleep(200);
    await page.click('#jetsonRefreshBtn');
    await sleep(300);
    ok('UI jetson refresh');

    await page.click('.tab[data-tab="terrain"]');
    await page.waitForSelector('#terrainMap.leaflet-container', { timeout: 15000 });
    await sleep(300);
    await page.click('#terrainLayerSatBtn');
    await sleep(200);
    await page.click('#terrainLayerStreetBtn');
    await sleep(200);
    await page.click('#terrainMappedOnlyBtn');
    await sleep(200);
    await page.click('#terrainMappedOnlyBtn');
    await sleep(150);
    await page.click('#terrainClearBtn');
    await sleep(200);
    const leaflet = await page.locator('#terrainMap.leaflet-container').count();
    if (leaflet < 1) fail('Leaflet container missing on terrain tab');
    else ok('UI terrain layers + leaflet present');

    await page.locator('input[name="terrainNavRef"][value="satellite_match"]').click();
    await sleep(200);
    await page.locator('input[name="terrainNavRef"][value="prior_mission_map"]').click();
    await sleep(200);
    ok('UI terrain nav-mode radios');

    const rotPlus = page.locator('.terrain-rot-step[data-rot-delta="15"]');
    if (await rotPlus.count() > 0) {
      await rotPlus.click();
      await page.locator('.terrain-rot-north').click();
      ok('UI map bearing step + north');
    } else warn('Map bearing controls not found (map not inited?)');

    await page.click('.tab[data-tab="control"]');
    await page.click('.subtab[data-subtab="arduParams"]');
    await sleep(200);
    await page.click('#visionConfigReadBtn');
    await sleep(500);
    await page.click('#exportProfileBtn');
    await sleep(200);
    ok('UI vision READ + export profile');

    await page.click('.tab[data-tab="advisor"]');
    await sleep(150);
    await page.fill('#advisorInput', 'בדיקת עשן');
    await page.click('#advisorSendBtn');
    await sleep(4000);
    ok('UI advisor send (waits for server/local reply)');

    await page.click('#versionBtn');
    await sleep(200);
    const modalOpen = await page.locator('#versionModal:not(.hidden)').count();
    if (modalOpen >= 1) ok('UI version modal open');
    else warn('version modal still .hidden after click');
    await page.locator('#closeVersionModalBtn').click().catch(() => {});
    await sleep(150);

    await page.click('.tab[data-tab="control"]');
    await page.click('.subtab[data-subtab="landingParams"]');
    await sleep(100);
    await page.click('#saveProfileBtn');
    await sleep(200);
    ok('UI save profile');

    await page.click('.tab[data-tab="flights"]');
    await sleep(200);
    await expectPanelVisible('flights');
    await page.locator('details.flight-manage summary').click();
    await sleep(200);
    await page.click('#refreshFlightsBtn');
    await sleep(250);
    await page.click('#pullLogsBtn');
    await sleep(250);
    await page.click('#refreshAllLogsBtn', { force: true });
    await sleep(200);
    ok('UI flights tab + refresh flights + pull all logs + refresh all-logs table');

    await page.click('.tab[data-tab="control"]');
    await page.click('.subtab[data-subtab="arduParams"]');
    await sleep(300);
    const downloadEv = page.waitForEvent('download', { timeout: 8000 }).catch(() => null);
    await page.click('#downloadParamBtn');
    await downloadEv;
    ok('UI download .param (if browser offers download)');

    if (pageErrors.length) fail(`pageerror: ${pageErrors.join(' | ')}`);
    if (consoleErrors.length) {
      const critical = consoleErrors.filter((c) => !c.includes('favicon') && !c.includes('404'));
      if (critical.length) warn(`console errors: ${critical.slice(0, 5).join(' | ')}`);
    }
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log(`VLC smoke: starting server on port ${PORT}…`);
  startServer();
  try {
    await waitHealth();
    ok('server healthy');
    await runApiSuite();
    await runPlaywrightSuite();
  } finally {
    stopServer();
    await sleep(300);
  }

  if (warnings.length) {
    console.log('\nWarnings:');
    warnings.forEach((w) => console.log(` - ${w}`));
  }
  if (failures.length) {
    console.log(`\n${failures.length} failure(s)`);
    process.exit(1);
  }
  console.log('\nAll smoke checks passed.');
}

main().catch((e) => {
  console.error(e);
  stopServer();
  process.exit(1);
});
