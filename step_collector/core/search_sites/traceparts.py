from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import quote_plus
from typing import Optional
from playwright.sync_api import BrowserContext

from ..models import SearchHit
from ..relevance import score_candidate


@dataclass
class TracePartsCredentials:
    email: str
    password: str


class TracePartsClient:
    def __init__(self, context: BrowserContext, credentials: TracePartsCredentials | None) -> None:
        self.context = context
        self.credentials = credentials
        self.last_page_blocked = False
        self.last_page_title = ""

    def login(self) -> bool:
        # Why: gated downloads can require auth; What: attempts sign-in with provided env credentials.
        if not self.credentials or not self.credentials.email or not self.credentials.password:
            return False
        page = self.context.new_page()
        try:
            page.goto("https://www.traceparts.com/en/sign-in", wait_until="domcontentloaded", timeout=30000)
            self._dismiss_common_popups(page)
            page.fill("input[type='email'], input[name='email']", self.credentials.email)
            page.fill("input[type='password'], input[name='password']", self.credentials.password)
            page.click("button[type='submit'], button:has-text('Sign in'), button:has-text('Log in')")
            page.wait_for_timeout(2500)
            return "sign-in" not in page.url.lower()
        except Exception:
            return False
        finally:
            page.close()

    def search_best(self, component: str) -> Optional[SearchHit]:
        # Why: fallback source when GrabCAD misses; What: checks top search results and selects best match.
        page = self.context.new_page()
        try:
            query = quote_plus(component)
            page.goto(
                f"https://www.traceparts.com/en/search/{query}",
                wait_until="domcontentloaded",
                timeout=30000,
            )
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
            cards = page.locator("a[href*='/en/product/'], a[href*='/en/search/']").all()[:20]
            best: Optional[SearchHit] = None
            for card in cards:
                title = (card.inner_text() or "").strip()
                url = card.get_attribute("href") or ""
                if url and url.startswith("/"):
                    url = f"https://www.traceparts.com{url}"
                if not url:
                    continue
                hint = ".step" in title.lower() or ".stp" in title.lower() or "step" in title.lower()
                score = score_candidate(component, title, url, hint)
                hit = SearchHit(site="TraceParts", title=title, url=url, score=score)
                if best is None or hit.score > best.score:
                    best = hit
            return best
        except Exception:
            return None
        finally:
            page.close()

    def _dismiss_common_popups(self, page) -> None:
        # Why: consent overlays can block login/search interactions; What: dismisses likely consent buttons when present.
        for selector in ["button:has-text('Accept')", "button:has-text('I agree')", "button:has-text('Agree')"]:
            try:
                btn = page.locator(selector).first
                if btn.count() > 0:
                    btn.click(timeout=1000)
            except Exception:
                continue
