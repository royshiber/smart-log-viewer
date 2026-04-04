from __future__ import annotations

import re
from datetime import datetime
from pathlib import Path


INVALID_CHARS = r'[<>:"/\\|?*]'


def sanitize_name(name: str, fallback: str = "component") -> str:
    # Why: Windows paths reject special chars; What: returns safe folder/file name.
    cleaned = re.sub(INVALID_CHARS, "_", name).strip().strip(".")
    return cleaned or fallback


def create_root_output(base_dir: Path) -> Path:
    # Why: keep each run isolated; What: creates timestamped run folder.
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    root = base_dir / f"Drone_Components_{timestamp}"
    root.mkdir(parents=True, exist_ok=True)
    return root


def create_component_folder(root: Path, component_name: str) -> Path:
    # Why: separate files per component; What: creates collision-safe subfolder.
    base = sanitize_name(component_name)
    candidate = root / base
    i = 2
    while candidate.exists():
        candidate = root / f"{base}_{i}"
        i += 1
    candidate.mkdir(parents=True, exist_ok=False)
    return candidate
