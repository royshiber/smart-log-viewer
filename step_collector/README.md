# Desktop STEP Collector

Python desktop app that **organizes** STEP/STP files per component. It **tries** automated search (GrabCAD → TraceParts), but many networks block headless browsers (403 / Cloudflare). The app is designed around that reality.

## Concept

1. **Automated path** — Playwright Chromium searches and clicks download when the sites respond normally.
2. **Resilient downloads** — Each run has `<Drone_Components_…>/_incoming/`. Both headless and manual Chromium contexts use `downloads_path` so files land where we scan. We also poll common **Downloads** locations (profile, OneDrive).
3. **Manual multi-source path** — If automation finds nothing (or is blocked), a visible browser opens **several tabs**: GrabCAD, TraceParts, 3Dfindit, and a Google query scoped to CAD sites. You download `.STEP`, `.STP`, or a **`.ZIP` containing STEP**; the app detects new files and moves them into the component folder.
4. **Local import** — Use **Import local STEP/STP…** to copy files you already have into a fresh run folder (no browser).

## Setup

1. Create virtual environment and install dependencies:
   - `pip install -r step_collector/requirements.txt`
2. Install Playwright browser:
   - `playwright install chromium`
3. Copy `step_collector/.env.example` to `.env` (workspace root) and set credentials (optional but helps when sites require login).

## Run

- `python -m step_collector.main`

## Environment (optional)

- `STEP_COLLECTOR_HEADLESS=1` — force **headless** automation (faster to hide the window, but more likely to be blocked by sites). **Default is a visible browser window** for better success rates.
- `STEP_COLLECTOR_EXTRA_DOWNLOAD_DIRS` — Windows: semicolon-separated list of extra folders to watch for downloads.

## Why the first run feels slow

Playwright downloads/unpacks Chromium on first use; **one to several minutes is common** (disk, antivirus). The UI shows an **indeterminate** progress bar and **heartbeat lines** in the log every ~15s so it does not look frozen.

- One-time terminal fix: `playwright install chromium`
- Often faster: use installed **Google Chrome** — set `STEP_COLLECTOR_BROWSER_CHANNEL=chrome` in `.env`

Logins to GrabCAD/TraceParts are **skipped** if credentials are missing in `.env`.

## Notes

- Results live under `Drone_Components_YYYYMMDD_HHMMSS` in the output directory you pick.
- The Run Log lists every folder being watched for new STEP/STP/ZIP files.
- Visual Status Board shows per-component state; preview images appear when a product page was reachable for automation.
