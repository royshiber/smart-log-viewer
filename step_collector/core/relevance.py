import re


def normalize_tokens(text: str) -> set[str]:
    # Why: normalize free text from search pages; What: returns comparable token set.
    cleaned = re.sub(r"[^a-zA-Z0-9\s]+", " ", text.lower())
    return {t for t in cleaned.split() if t}


def score_candidate(component_name: str, title: str, url: str, has_step_hint: bool) -> float:
    # Why: pick the most likely matching part; What: computes weighted relevance score.
    component_tokens = normalize_tokens(component_name)
    page_tokens = normalize_tokens(f"{title} {url}")
    overlap = len(component_tokens & page_tokens)
    base = overlap / max(1, len(component_tokens))
    bonus = 0.25 if has_step_hint else 0.0
    return min(1.0, base + bonus)
