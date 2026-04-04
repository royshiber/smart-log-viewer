# Aero-Lab Web (Stitch → Next.js)

Scaffold generated from **Google Stitch HTML exports** in `docs/stitch-aerolab/`. Design tokens (colors, fonts, radii) are copied verbatim from the embedded `tailwind.config` in `06-extended-telemetry-style.html` — see `docs/STITCH_DESIGN_DNA.json` and `lib/stitch-design-tokens.ts`.

## Routes

| Stitch screen (manifest) | Path |
| --- | --- |
| Option 5: Aero-Lab Tactical Precision | `/dashboard/tactical-precision` |
| Logs & Notes - Aero-Lab v5 | `/dashboard/logs-notes` |
| Jetson PC Status - Aero-Lab v5 | `/dashboard/jetson-pc` |
| Logs & Notes - Aero-Lab Style | `/dashboard/logs-style` |
| Landing Flow - Aero-Lab v5 | `/dashboard/landing-flow` |
| Extended Telemetry - Aero-Lab Style (**primary dashboard**) | `/dashboard/telemetry` |

## Dev

```bash
npm install --prefix apps/aero-lab-web
npm run dev --prefix apps/aero-lab-web
```

Open `http://localhost:3010`.

## Jetson version management API

The `JETSON` dashboard route now uses Next API endpoints:

- `GET /api/jetson/releases` - available upgrade/rollback versions
- `GET /api/jetson/status` - currently installed version + install history
- `POST /api/jetson/install` - install a selected version

By default, install/state is persisted locally in `apps/aero-lab-web/.runtime/jetson-state.json`.
If you have a real companion installer service, set:

`JETSON_COMPANION_BASE_URL=http://<your-jetson-bridge-host>:<port>`

Then `POST /api/jetson/install` will forward to `<base>/install`.

## After Stitch changes

1. `npm run fetch:stitch-aerolab` (updates `docs/stitch-aerolab/*.html`).
2. `node scripts/stitch-sync-report.mjs` — lists which routes to reconcile.
3. Port changed markup into the matching `app/dashboard/**/page.tsx` (telemetry is already partially ported).

Real-time “notify me” requires CI (e.g. scheduled workflow) or a Stitch webhook — not included here.
