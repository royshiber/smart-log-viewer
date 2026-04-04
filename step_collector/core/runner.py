from __future__ import annotations

import os
import tempfile
from datetime import datetime, timedelta
from pathlib import Path
from queue import Queue
from threading import Event, Thread
from typing import Iterable
from urllib.parse import quote_plus
from urllib.request import urlretrieve

from dotenv import load_dotenv
from playwright.sync_api import Page, sync_playwright

from .download_manager import DownloadManager
from .file_organizer import create_component_folder, create_root_output
from .manual_mode import ManualBrowserSession
from .models import ComponentResult, ProgressEvent, SearchHit
from .paths import collect_download_watch_dirs
from .search_sites.grabcad import GrabCadClient, GrabCadCredentials
from .search_sites.traceparts import TracePartsClient, TracePartsCredentials


def _emit(events: Queue, kind: str, message: str, current: int = 0, total: int = 0, result: ComponentResult | None = None) -> None:
    # Why: UI updates must be thread-safe; What: pushes typed progress events into queue.
    events.put(ProgressEvent(kind=kind, message=message, current=current, total=total, result=result))


def _emit_component_state(
    events: Queue,
    component: str,
    state: str,
    message: str,
    current: int,
    total: int,
    preview_image: Path | None = None,
) -> None:
    # Why: visual board in UI needs explicit per-component state transitions; What: emits state event for one component card.
    events.put(
        ProgressEvent(
            kind="component_state",
            message=message,
            current=current,
            total=total,
            component=component,
            component_state=state,
            preview_image=preview_image,
        )
    )


def _click_any_download(page: Page) -> bool:
    # Why: websites use different download labels/selectors; What: tries a selector list until one click succeeds.
    selectors = [
        "a:has-text('Download')",
        "button:has-text('Download')",
        "text=STEP",
        "text=.STP",
        "text=.STEP",
    ]
    for selector in selectors:
        locator = page.locator(selector).first
        if locator.count() == 0:
            continue
        try:
            locator.click(timeout=2500)
            return True
        except Exception:
            continue
    return False


def _attempt_headless_download(context, hit: SearchHit) -> Path | None:
    # Why: avoid manual fallback whenever direct download works; What: attempts automated click and returns downloaded temp path.
    page = context.new_page()
    try:
        page.goto(hit.url, wait_until="domcontentloaded", timeout=35000)
        page.wait_for_timeout(1200)
        with page.expect_download(timeout=14000) as download_info:
            if not _click_any_download(page):
                return None
        download = download_info.value
        download_path = download.path()
        if not download_path:
            return None
        return Path(download_path)
    except Exception:
        return None
    finally:
        page.close()


def _capture_preview(context, hit: SearchHit, preview_dir: Path, component_name: str) -> Path | None:
    # Why: user asked for visual confirmation per found component; What: saves product preview image (og:image or page screenshot).
    page = context.new_page()
    safe_name = "".join(ch if ch.isalnum() or ch in ("-", "_") else "_" for ch in component_name)[:80]
    preview_dir.mkdir(parents=True, exist_ok=True)
    target = preview_dir / f"{safe_name}.png"
    try:
        page.goto(hit.url, wait_until="domcontentloaded", timeout=35000)
        page.wait_for_timeout(1200)
        og_image = page.locator("meta[property='og:image']").first.get_attribute("content")
        if og_image:
            try:
                urlretrieve(og_image, target)
                if target.exists() and target.stat().st_size > 0:
                    return target
            except Exception:
                pass
        page.screenshot(path=str(target), full_page=False)
        if target.exists() and target.stat().st_size > 0:
            return target
    except Exception:
        return None
    finally:
        page.close()
    return None


def _open_manual_search_tabs(mctx, component: str) -> None:
    # Why: headless is often blocked; What: opens several vendor/search tabs so the user can find a STEP from multiple catalogs.
    query = quote_plus(component)
    google_q = quote_plus(f"{component} CAD STEP STP site:grabcad.com OR site:traceparts.com OR site:3dfindit.com")
    urls = [
        f"https://grabcad.com/library?query={query}",
        f"https://www.traceparts.com/en/search/{query}",
        f"https://www.3dfindit.com/en/search/?searchQuery={query}",
        f"https://www.google.com/search?q={google_q}",
    ]
    pages = list(mctx.pages)
    for i, url in enumerate(urls):
        if i < len(pages):
            pages[i].goto(url, wait_until="domcontentloaded")
        else:
            mctx.new_page().goto(url, wait_until="domcontentloaded")


def _resolve_playwright_browser_channel() -> str | None:
    # Why: bundled Chromium download/AV scan can hang for a long time; What: optional use of system Chrome/Edge via Playwright channel.
    raw = (os.getenv("STEP_COLLECTOR_BROWSER_CHANNEL") or "").strip().lower()
    allowed = (
        "chrome",
        "chrome-beta",
        "chrome-dev",
        "msedge",
        "msedge-beta",
        "msedge-dev",
        "chromium",
    )
    if raw in allowed:
        return raw
    if (os.getenv("STEP_COLLECTOR_USE_SYSTEM_CHROME") or "").strip().lower() in ("1", "true", "yes"):
        return "chrome"
    return None


def _manual_search_and_wait_download(
    component: str,
    manual: ManualBrowserSession,
    manager: DownloadManager,
    events: Queue,
    idx: int,
    total: int,
    incoming_dir: Path,
) -> Path | None:
    # Why: anti-bot pages block automation; What: opens visible browser tabs and waits for STEP/STP/ZIP into watched folders.
    mctx = manual.ensure_open()
    # Why: clock skew / instant download; What: slightly earlier cutoff so files saved via Playwright download events are not missed.
    manual_marker = datetime.now() - timedelta(seconds=5)
    _open_manual_search_tabs(mctx, component)
    _emit(
        events,
        "manual",
        f"Manual search: use the opened tabs. Downloads are saved to:\n  {incoming_dir}\n"
        f"(Playwright also captures browser downloads into this folder.) "
        f"Then download .STEP / .STP or .ZIP containing STEP — app watches here + your Downloads folders.",
        idx - 1,
        total,
    )
    return manager.wait_for_step_file(after=manual_marker, timeout_seconds=420)


def run_collection(components: Iterable[str], output_base: Path, events: Queue, stop_event: Event) -> None:
    # Why: central automation workflow; What: runs search/download/organize with resilient download discovery and manual fallbacks.
    load_dotenv()
    components = [c.strip() for c in components if c.strip()]
    total = len(components)
    if total == 0:
        _emit(events, "error", "No components provided.")
        return

    root = create_root_output(output_base)
    incoming = root / "_incoming"
    incoming.mkdir(parents=True, exist_ok=True)
    watch_dirs = [incoming, *collect_download_watch_dirs()]
    deduped: list[Path] = []
    seen_keys: set[str] = set()
    for d in watch_dirs:
        try:
            key = str(d.resolve())
        except OSError:
            key = str(d)
        if key not in seen_keys:
            seen_keys.add(key)
            deduped.append(d)
    manager = DownloadManager(download_dirs=deduped)

    _emit(events, "root", str(root), 0, total)
    preview_dir = root / "_previews"

    watch_msg = "Watching for downloads in:\n" + "\n".join(f"  • {d}" for d in deduped[:8])
    if len(deduped) > 8:
        watch_msg += f"\n  • … (+{len(deduped) - 8} more via STEP_COLLECTOR_EXTRA_DOWNLOAD_DIRS)"
    _emit(events, "info", watch_msg, 0, total)

    for comp in components:
        _emit_component_state(events, comp, "queued", f"{comp}: in queue", 0, total)

    # Why: headless trips many WAF/bot checks; What: default to headed unless user explicitly forces headless.
    _hl = os.getenv("STEP_COLLECTOR_HEADLESS", "").strip().lower()
    if _hl in ("1", "true", "yes"):
        headless = True
    elif _hl in ("0", "false", "no"):
        headless = False
    else:
        headless = False
    _emit(
        events,
        "info",
        "Launching Chromium — first run can take 1–10+ minutes (unpack, antivirus, slow disk). "
        f"Mode: {'headless' if headless else 'visible window'} — STEP_COLLECTOR_HEADLESS=1 hides it. "
        "If stuck forever: run once `playwright install chromium` or set STEP_COLLECTOR_BROWSER_CHANNEL=chrome.",
        0,
        total,
    )
    if components:
        _emit_component_state(
            events,
            components[0],
            "in_progress",
            f"{components[0]}: starting browser...",
            0,
            total,
        )

    launch_ready = Event()

    def _launch_heartbeat() -> None:
        # Why: sync_playwright + chromium.launch block the worker thread with no logs; What: periodic queue messages so the UI is not silent.
        waited = 0
        while not launch_ready.wait(timeout=15):
            if stop_event.is_set():
                return
            waited += 15
            _emit(
                events,
                "info",
                f"Still launching browser (~{waited}s). This is normal on first run or with antivirus scanning. "
                f"If it never finishes, open PowerShell in the project folder and run: playwright install chromium "
                f"— or set STEP_COLLECTOR_BROWSER_CHANNEL=chrome to use installed Google Chrome.",
                0,
                total,
            )

    Thread(target=_launch_heartbeat, daemon=True).start()

    with sync_playwright() as playwright:
        browser = None
        try:
            _emit(events, "info", "Playwright driver loaded — starting Chromium executable (this step often takes longest)…", 0, total)
            channel = _resolve_playwright_browser_channel()
            launch_kw: dict = {"headless": headless, "timeout": 600_000}
            if channel:
                launch_kw["channel"] = channel
                _emit(
                    events,
                    "info",
                    f"Using system browser channel={channel!r} (avoids downloading Playwright's Chromium when Chrome/Edge is installed).",
                    0,
                    total,
                )
            browser = playwright.chromium.launch(**launch_kw)
        except Exception as exc:
            _emit(
                events,
                "error",
                f"Failed to launch Chromium: {exc}\n"
                "One-time setup: open terminal in this project and run: playwright install chromium\n"
                "Faster path: install Google Chrome and set in .env STEP_COLLECTOR_BROWSER_CHANNEL=chrome",
                0,
                total,
            )
            return
        finally:
            launch_ready.set()

        context = browser.new_context(accept_downloads=True, downloads_path=str(incoming))
        manual = ManualBrowserSession(
            playwright,
            Path(tempfile.gettempdir()) / "step_collector_profile",
            downloads_dir=incoming,
        )

        gc_email = (os.getenv("GRABCAD_EMAIL") or "").strip()
        gc_pass = (os.getenv("GRABCAD_PASSWORD") or "").strip()
        tp_email = (os.getenv("TRACEPARTS_EMAIL") or "").strip()
        tp_pass = (os.getenv("TRACEPARTS_PASSWORD") or "").strip()

        grabcad = GrabCadClient(
            context=context,
            credentials=GrabCadCredentials(email=gc_email, password=gc_pass),
        )
        traceparts = TracePartsClient(
            context=context,
            credentials=TracePartsCredentials(email=tp_email, password=tp_pass),
        )

        _emit(events, "info", "Chromium is up — optional logins (skipped if .env credentials empty).", 0, total)
        if components:
            _emit_component_state(
                events,
                components[0],
                "in_progress",
                f"{components[0]}: site login (if configured)…",
                0,
                total,
            )
        if gc_email and gc_pass:
            try:
                _emit(events, "info", "GrabCAD: attempting login…", 0, total)
                grabcad.login()
            except Exception as exc:
                _emit(events, "info", f"GrabCAD login error (continuing): {exc}", 0, total)
        else:
            _emit(events, "info", "GrabCAD: skipping login (set GRABCAD_EMAIL + GRABCAD_PASSWORD in .env to enable).", 0, total)
        if tp_email and tp_pass:
            try:
                _emit(events, "info", "TraceParts: attempting login…", 0, total)
                traceparts.login()
            except Exception as exc:
                _emit(events, "info", f"TraceParts login error (continuing): {exc}", 0, total)
        else:
            _emit(events, "info", "TraceParts: skipping login (set TRACEPARTS_EMAIL + TRACEPARTS_PASSWORD in .env to enable).", 0, total)
        _emit(events, "phase", "startup_done", 0, total)

        successes = 0
        try:
            for idx, component in enumerate(components, start=1):
                if stop_event.is_set():
                    _emit(events, "info", "Stopped by user.", idx - 1, total)
                    break

                _emit_component_state(events, component, "in_progress", f"{component}: searching...", idx - 1, total)
                _emit(events, "info", f"[{idx}/{total}] Searching {component}", idx - 1, total)
                comp_folder = create_component_folder(root, component)

                hit = grabcad.search_best(component)
                if not hit or hit.score < 0.12:
                    hit = traceparts.search_best(component)

                if not hit:
                    blocked_sources: list[str] = []
                    if grabcad.last_page_blocked:
                        blocked_sources.append(f"GrabCAD ({grabcad.last_page_title})")
                    if traceparts.last_page_blocked:
                        blocked_sources.append(f"TraceParts ({traceparts.last_page_title})")
                    if blocked_sources:
                        _emit(
                            events,
                            "info",
                            f"{component}: automated search blocked ({', '.join(blocked_sources)}). Opening manual browser tabs.",
                            idx - 1,
                            total,
                        )
                    else:
                        _emit(
                            events,
                            "info",
                            f"{component}: no automated match. Opening manual browser tabs (Google, 3Dfindit, vendors).",
                            idx - 1,
                            total,
                        )
                    downloaded_file = _manual_search_and_wait_download(
                        component, manual, manager, events, idx, total, incoming
                    )
                    if downloaded_file is not None:
                        saved = manager.move_to_component_folder(downloaded_file, comp_folder, component)
                        successes += 1
                        result = ComponentResult(
                            component=component,
                            success=True,
                            message=f"Saved to {saved.name} (manual)",
                            site="ManualMultiSource",
                            saved_file=saved,
                        )
                        _emit_component_state(events, component, "done", f"{component}: saved via manual search.", idx, total)
                        _emit(events, "result", f"{component}: success (manual)", idx, total, result)
                        continue
                    _emit_component_state(events, component, "failed", f"{component}: no file received.", idx, total)
                    result = ComponentResult(component=component, success=False, message="No relevant result and no manual download.")
                    _emit(events, "result", f"{component}: not found", idx, total, result)
                    continue

                preview_path = _capture_preview(context, hit, preview_dir, component)
                _emit_component_state(
                    events,
                    component,
                    "found",
                    f"{component}: match found on {hit.site}.",
                    idx - 1,
                    total,
                    preview_path,
                )
                _emit(events, "info", f"{component}: candidate from {hit.site} ({hit.title[:70]})", idx - 1, total)

                downloaded_file = _attempt_headless_download(context, hit)

                if downloaded_file is None:
                    _emit(events, "info", f"{component}: automated download failed — opening manual browser on product page.", idx - 1, total)
                    mctx = manual.ensure_open()
                    mpage = mctx.pages[0] if mctx.pages else mctx.new_page()
                    mpage.goto(hit.url, wait_until="domcontentloaded")
                    manual_marker = datetime.now() - timedelta(seconds=5)
                    _emit(
                        events,
                        "manual",
                        f"Manual action: download STEP/STP (or ZIP) for '{component}'.\nFiles go to: {incoming}",
                        idx - 1,
                        total,
                    )
                    downloaded_file = manager.wait_for_step_file(after=manual_marker, timeout_seconds=420)

                if downloaded_file is None:
                    result = ComponentResult(component=component, success=False, message="Download timeout/blocked.", site=hit.site)
                    _emit_component_state(events, component, "failed", f"{component}: download failed.", idx, total, preview_path)
                    _emit(events, "result", f"{component}: download failed", idx, total, result)
                    continue

                saved = manager.move_to_component_folder(downloaded_file, comp_folder, component)
                successes += 1
                result = ComponentResult(
                    component=component,
                    success=True,
                    message=f"Saved to {saved.name}",
                    site=hit.site,
                    saved_file=saved,
                    preview_image=preview_path,
                )
                _emit_component_state(events, component, "done", f"{component}: saved successfully.", idx, total, preview_path)
                _emit(events, "result", f"{component}: success ({hit.site})", idx, total, result)

            _emit(events, "done", f"Finished. Success: {successes}/{total}. Folder: {root}", total, total)
        finally:
            manual.close()
            context.close()
            browser.close()
