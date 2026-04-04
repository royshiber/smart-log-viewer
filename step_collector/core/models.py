from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Optional


@dataclass
class SearchHit:
    site: str
    title: str
    url: str
    score: float


@dataclass
class ComponentResult:
    component: str
    success: bool
    message: str
    site: Optional[str] = None
    saved_file: Optional[Path] = None
    preview_image: Optional[Path] = None


@dataclass
class ProgressEvent:
    kind: str
    message: str
    current: int = 0
    total: int = 0
    result: Optional[ComponentResult] = None
    component: Optional[str] = None
    component_state: Optional[str] = None
    preview_image: Optional[Path] = None
