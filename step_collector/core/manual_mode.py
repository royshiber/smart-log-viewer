from __future__ import annotations

from pathlib import Path

from playwright.sync_api import BrowserContext, Download, Playwright


def _save_playwright_download(download: Download, downloads_dir: Path) -> None:
    # Why: many sites save via browser download pipeline instead of landing in OS Downloads; What: copies finished download into _incoming.
    try:
        name = download.suggested_filename or "download.bin"
        base = Path(name).name
        dest = downloads_dir / base
        stem = Path(base).stem
        suffix = Path(base).suffix or ".bin"
        n = 2
        while dest.exists():
            dest = downloads_dir / f"{stem}_{n}{suffix}"
            n += 1
        download.save_as(str(dest))
    except Exception:
        return


class ManualBrowserSession:
    def __init__(self, playwright: Playwright, profile_dir: Path, downloads_dir: Path) -> None:
        # Why: manual fallback must land files where we poll; What: stores profile path and forced Chromium download directory.
        self.playwright = playwright
        self.profile_dir = profile_dir
        self.downloads_dir = downloads_dir
        self.context: BrowserContext | None = None

    def ensure_open(self) -> BrowserContext:
        # Why: keep one shared manual browser window; What: opens persistent Chromium with downloads_path + download events into _incoming.
        if self.context is None:
            self.profile_dir.mkdir(parents=True, exist_ok=True)
            self.downloads_dir.mkdir(parents=True, exist_ok=True)
            ctx = self.playwright.chromium.launch_persistent_context(
                user_data_dir=str(self.profile_dir),
                headless=False,
                accept_downloads=True,
                downloads_path=str(self.downloads_dir),
            )
            incoming = self.downloads_dir

            def _on_download(download: Download) -> None:
                _save_playwright_download(download, incoming)

            ctx.on("download", _on_download)
            self.context = ctx
        return self.context

    def close(self) -> None:
        # Why: avoid resource leaks; What: closes persistent context if open.
        if self.context:
            self.context.close()
            self.context = None
