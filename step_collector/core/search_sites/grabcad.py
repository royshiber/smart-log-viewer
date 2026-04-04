from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import quote_plus
from typing import Optional
from playwright.sync_api import BrowserContext

from ..models import SearchHit
from ..relevance import score_candidate


@dataclass
class GrabCadCredentials:
    email: str
    password: str


class GrabCadClient:
    def __init__(self, context: BrowserContext, credentials: GrabCadCredentials | None) -> None:
        self.context = context
        self.credentials = credentials
        self.last_page_blocked = False
        self.last_page_title = ""

    def login(self) -> bool:
        # Why: some downloads require authenticated session; What: attempts login and returns success/failure.
        if not self.credentials or not self.credentials.email or not self.credentials.password:
            return False
        page = self.context.new_page()
        try:
            page.goto("https://grabcad.com/login", wait_until="domcontentloaded", timeout=30000)
            self._dismiss_common_popups(page)
            page.fill('input[name="email"], input[type="email"]', self.credentials.email)
            page.fill('input[name="password"], input[type="password"]', self.credentials.password)
            page.click("button[type='submit'], button:has-text('Sign in'), button:has-text('Log in')")
            page.wait_for_timeout(2500)
            return "login" not in page.url.lower()
        except Exception:
            return False
        finally:
            page.close()

    def search_best(self, component: str) -> Optional[SearchHit]:
        # Why: component names can return many results; What: scans top cards and returns best-scored hit.
        page = self.context.new_page()
        try:
            query = quote_plus(component)
            page.goto(f"https://grabcad.com/library?query={query}", wait_until="domcontentloaded", timeout=30000)
            self._dismiss_common_popups(page)
            page.wait_for_timeout(1500)
            title_text = page.title()
            body_excerpt = (page.locator("body").inner_text() or "")[:400]
            lowered = f"{title_text}\n{body_excerpt}".lower()
            self.last_page_title = title_text
            self.last_page_blocked = (
                "request could not be satisfied" in lowered
                or "403 error" in lowered
                or "security verification" in lowered
                or "access denied" in lowered
                or "just a moment" in lowered
            )
            cards = page.locator("a[href*='/library/'][href*='-']").all()[:20]
            best: Optional[SearchHit] = None
            for card in cards:
                title = (card.inner_text() or "").strip()
                url = card.get_attribute("href") or ""
                if url and url.startswith("/"):
                    url = f"https://grabcad.com{url}"
                if not url or url.endswith("/library"):
                    continue
                hint = ".step" in title.lower() or ".stp" in title.lower() or "step" in title.lower()
                score = score_candidate(component, title, url, hint)
                hit = SearchHit(site="GrabCAD", title=title, url=url, score=score)
                if best is None or hit.score > best.score:
                    best = hit
            return best
        except Exception:
            return None
        finally:
            page.close()

    def _dismiss_common_popups(self, page) -> None:
        # Why: cookie/modals can block click/fill actions; What: best-effort close of common consent dialogs.
        for selector in ["button:has-text('Accept')", "button:has-text('I agree')", "button:has-text('Got it')"]:
            try:
                btn = page.locator(selector).first
                if btn.count() > 0:
                    btn.click(timeout=1000)
            except Exception:
                continue
