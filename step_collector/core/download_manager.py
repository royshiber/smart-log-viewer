from __future__ import annotations

import shutil
import time
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Optional

from .file_organizer import sanitize_name


def _is_step_suffix(suffix: str) -> bool:
    return suffix.lower() in {".step", ".stp"}


def _step_from_zip(zip_path: Path, after: datetime, extract_parent: Path) -> Optional[Path]:
    # Why: many portals ship CAD as ZIP; What: extracts first STEP/STP from a fresh archive into extract_parent.
    try:
        mtime = datetime.fromtimestamp(zip_path.stat().st_mtime)
    except OSError:
        return None
    if mtime < after:
        return None
    if zip_path.suffix.lower() != ".zip":
        return None
    try:
        with zipfile.ZipFile(zip_path, "r") as zf:
            members = [n for n in zf.namelist() if _is_step_suffix(Path(n).suffix)]
            if not members:
                return None
            member = sorted(members, key=len)[0]
            target_dir = extract_parent / f"_unzipped_{zip_path.stem}"
            target_dir.mkdir(parents=True, exist_ok=True)
            zf.extract(member, target_dir)
            out = (target_dir / member).resolve()
            if out.exists() and out.is_file():
                return out
    except (zipfile.BadZipFile, OSError, ValueError):
        return None
    return None


class DownloadManager:
    def __init__(self, download_dirs: list[Path]) -> None:
        # Why: downloads may land in Playwright incoming dir or system Downloads; What: stores ordered list of dirs to poll.
        self.download_dirs = list(dict.fromkeys(download_dirs))

    def wait_for_step_file(self, after: datetime, timeout_seconds: int = 120) -> Optional[Path]:
        # Why: manual mode and some browsers ignore our path; What: polls all dirs for fresh STEP/STP or ZIP containing STEP.
        end_at = time.time() + timeout_seconds
        while time.time() < end_at:
            candidates: list[Path] = []
            for base in self.download_dirs:
                if not base.exists():
                    continue
                try:
                    for file_path in base.glob("*"):
                        if not file_path.is_file():
                            continue
                        name_lower = file_path.name.lower()
                        if name_lower.endswith(".crdownload") or name_lower.endswith(".tmp"):
                            continue
                        mtime = datetime.fromtimestamp(file_path.stat().st_mtime)
                        if mtime < after:
                            continue
                        if _is_step_suffix(file_path.suffix):
                            candidates.append(file_path)
                            continue
                        if file_path.suffix.lower() == ".zip":
                            unzipped = _step_from_zip(file_path, after, base)
                            if unzipped:
                                candidates.append(unzipped)
                except OSError:
                    continue
            if candidates:
                return sorted(candidates, key=lambda p: p.stat().st_mtime, reverse=True)[0]
            time.sleep(1)
        return None

    def move_to_component_folder(self, source: Path, target_folder: Path, component_name: str) -> Path:
        # Why: user asked normalized output structure; What: moves and renames download to component name.
        base_name = sanitize_name(component_name)
        ext = ".stp" if source.suffix.lower() == ".stp" else ".step"
        target = target_folder / f"{base_name}{ext}"
        i = 2
        while target.exists():
            target = target_folder / f"{base_name}_{i}{ext}"
            i += 1
        shutil.move(str(source), str(target))
        return target
