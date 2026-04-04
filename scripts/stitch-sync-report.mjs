/**
 * Why: after `npm run fetch:stitch-aerolab`, show which Next routes should be reviewed for JSX drift.
 * What: prints mapping manifest screen slugs → apps/aero-lab-web routes (no network).
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const manifestPath = join(root, 'docs', 'stitch-aerolab', 'manifest.json');

const ROUTE_BY_SLUG = {
  '01-option5-tactical-precision': '/dashboard/tactical-precision',
  '02-logs-notes-v5': '/dashboard/logs-notes',
  '03-jetson-pc-status-v5': '/dashboard/jetson-pc',
  '04-logs-notes-style': '/dashboard/logs-style',
  '05-landing-flow-v5': '/dashboard/landing-flow',
  '06-extended-telemetry-style': '/dashboard/telemetry',
};

if (!existsSync(manifestPath)) {
  console.error('Missing manifest. Run: npm run fetch:stitch-aerolab');
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
console.log('Stitch → Next route review list (update TSX if HTML export changed):\n');
for (const s of manifest.screens || []) {
  const file = s.files?.html?.replace(/^docs\/stitch-aerolab\//, '') || '';
  const slug = file.replace(/\.html$/, '');
  const route = ROUTE_BY_SLUG[slug] || '(add mapping in scripts/stitch-sync-report.mjs)';
  console.log(`- ${s.name}`);
  console.log(`  file: docs/stitch-aerolab/${file}`);
  console.log(`  route: ${route}\n`);
}
