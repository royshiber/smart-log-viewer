from __future__ import annotations

import os
from pathlib import Path


def collect_download_watch_dirs() -> list[Path]:
    # Why: Windows often redirects Downloads (OneDrive); What: returns deduped list of folders to poll for new STEP files.
    dirs: list[Path] = []
    seen: set[str] = set()

    def add(candidate: Path | None) -> None:
        if candidate is None:
            return
        try:
            expanded = candidate.expanduser()
            key = str(expanded.resolve())
            if key in seen:
                return
            seen.add(key)
            dirs.append(expanded)
        except OSError:
            return

    home = Path.home()
    add(home / "Downloads")
    userprofile = os.environ.get("USERPROFILE")
    if userprofile:
        add(Path(userprofile) / "Downloads")
    onedrive = os.environ.get("OneDrive")
    if onedrive:
        add(Path(onedrive) / "Downloads")
    add(home / "OneDrive" / "Downloads")
    extra = os.environ.get("STEP_COLLECTOR_EXTRA_DOWNLOAD_DIRS", "")
    sep = ";" if os.name == "nt" else ":"
    for part in extra.split(sep):
        part = part.strip().strip('"')
        if part:
            add(Path(part))
    return dirs
