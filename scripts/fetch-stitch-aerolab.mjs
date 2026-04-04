/**
 * Fetches Stitch screen HTML + screenshot assets for a fixed Aero-Lab project.
 * Why: Design handoff — obtain hosted export URLs via the Stitch API and save them locally.
 * Runtime: Reads STITCH_API_KEY (or loads KEY= lines from server/.env), calls @google/stitch-sdk,
 *          then downloads each URL with curl -L (falls back to fetch if curl fails).
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const OUT_DIR = join(REPO_ROOT, 'docs', 'stitch-aerolab');

const PROJECT_ID = '4104598718881540433';

/** @type {{ slug: string; name: string; screenId: string }[]} */
const SCREENS = [
  { slug: '01-option5-tactical-precision', name: 'Option 5: Aero-Lab Tactical Precision', screenId: '51037dcaec49437e8412f1436b0acc56' },
  { slug: '02-logs-notes-v5', name: 'Logs & Notes - Aero-Lab v5', screenId: '9044b06262b647e7a9620e1504da55ea' },
  { slug: '03-jetson-pc-status-v5', name: 'Jetson PC Status - Aero-Lab v5', screenId: '71375b81cb634a2fb5c6fdb19844f169' },
  { slug: '04-logs-notes-style', name: 'Logs & Notes - Aero-Lab Style', screenId: '9dd231cd2fba460487d9e7a614599826' },
  { slug: '05-landing-flow-v5', name: 'Landing Flow - Aero-Lab v5', screenId: 'ceda72e0e36a4753bf7375b9c4167a7e' },
  { slug: '06-extended-telemetry-style', name: 'Extended Telemetry - Aero-Lab Style', screenId: '2eb67699682b47cfa272cdfedb7a9ad8' },
];

function loadDotEnvKeys(path) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, 'utf8').replace(/^\uFEFF/, '');
  for (let line of text.split(/\n/)) {
    line = line.replace(/\r$/, '');
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!m || m[1].startsWith('#')) continue;
    let v = m[2].trimEnd();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    const cur = process.env[m[1]];
    if (cur !== undefined && cur !== '') continue;
    if (!v.trim()) continue;
    process.env[m[1]] = v.trim();
  }
}

function ensureStitchKey() {
  if (!process.env.STITCH_API_KEY?.trim()) {
    const candidates = [
      join(REPO_ROOT, 'server', '.env'),
      join(REPO_ROOT, '.env'),
      join(process.cwd(), 'server', '.env'),
      join(process.cwd(), '.env'),
    ];
    for (const p of candidates) loadDotEnvKeys(p);
  }
  if (!process.env.STITCH_API_KEY?.trim()) {
    const serverEnvPath = join(process.cwd(), 'server', '.env');
    const hint = existsSync(serverEnvPath)
      ? '\nTip: If you added STITCH_API_KEY in the editor, save server/.env — Node reads the file on disk, not unsaved buffers.'
      : '';
    console.error(
      'Missing STITCH_API_KEY. Add it to server/.env or the environment.\n' +
        'Get a key from Google Stitch / AI Studio (see @google/stitch-sdk README).' +
        hint
    );
    process.exit(1);
  }
}

/**
 * Downloads a URL to disk using curl -L; falls back to fetch if curl is unavailable.
 * Why: User-requested curl workflow; Windows may lack curl in PATH in edge cases.
 */
async function downloadToFile(url, destPath) {
  try {
    execFileSync('curl.exe', ['-L', '-f', '-sS', '-o', destPath, url], { stdio: 'inherit' });
    return;
  } catch {
    try {
      execFileSync('curl', ['-L', '-f', '-sS', '-o', destPath, url], { stdio: 'inherit' });
      return;
    } catch {
      /* fall through */
    }
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url} -> HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(destPath, buf);
}

async function main() {
  ensureStitchKey();
  mkdirSync(OUT_DIR, { recursive: true });

  const { stitch } = await import('@google/stitch-sdk');
  const project = stitch.project(PROJECT_ID);

  const manifest = { projectId: PROJECT_ID, fetchedAt: new Date().toISOString(), screens: [] };

  for (const { slug, name, screenId } of SCREENS) {
    console.error(`Fetching screen ${slug} (${screenId})…`);
    const screen = await project.getScreen(screenId);
    const htmlUrl = await screen.getHtml();
    const imageUrl = await screen.getImage();

    const htmlPath = join(OUT_DIR, `${slug}.html`);
    const pngPath = join(OUT_DIR, `${slug}.png`);

    await downloadToFile(htmlUrl, htmlPath);
    await downloadToFile(imageUrl, pngPath);

    manifest.screens.push({
      name,
      screenId,
      htmlUrl,
      imageUrl,
      files: {
        html: relative(REPO_ROOT, htmlPath).replace(/\\/g, '/'),
        image: relative(REPO_ROOT, pngPath).replace(/\\/g, '/'),
      },
    });
  }

  writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.error(`Done. Wrote ${SCREENS.length} HTML + PNG pairs under docs/stitch-aerolab/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
