"""V31: what of a read page reaches a model, chosen by code, not by a model.

A page read by the agent browser can be 60,000 characters. V30 passed the first 2,400 (and 700 to the
compose call), which for a vendor page is mostly navigation and hero copy. Here:

- `relevant(text, words, limit)` keeps the paragraphs that carry the task's words (and numbers, prices
  and dates, which comparisons need), in page order, up to `limit` characters;
- `Seen` drops paragraphs another page already supplied (shared footers, cookie banners, syndicated text);
- `table_text` turns the page's first tables into compact rows;
- `follow_links` picks, without a model, the few same-site pages a comparison usually needs (pricing,
  plans, features, docs), never more than asked.

The full page is not kept in the run; a later deeper read opens the source again.
"""
from __future__ import annotations

import hashlib
import re
from urllib.parse import urlsplit

STOP = set('a an the of for and or to in on with by from at is are be how what which who why vs versus best top main about into my our your this that it its as can will we you they'.split())
NUMERIC = re.compile(r'(\$|€|£|¥)\s?\d|\d+(\.\d+)?\s?(%|usd|eur|per\b|/mo|/month|/year|seats?|users?)|\b(19|20)\d\d\b', re.I)
BOILERPLATE = re.compile(r'^(accept( all)? cookies|cookie (settings|policy)|we use cookies|sign in|log in|subscribe|skip to (main )?content|all rights reserved|©)', re.I)
FOLLOW = re.compile(r'/(pricing|plans|price|features|feature|product|compare|docs|documentation|enterprise|business)(/|$|\?)', re.I)


def words_of(*texts):
    out = set()
    for text in texts:
        out |= {w for w in re.findall(r'[a-z0-9][a-z0-9+#.-]{1,}', str(text or '').lower()) if w not in STOP and len(w) > 2}
    return out


def paragraphs(text):
    return [p.strip() for p in re.split(r'\n+', str(text or '')) if len(p.strip()) >= 24 and not BOILERPLATE.match(p.strip())]


class Seen:
    """Paragraph fingerprints already passed on in this run."""
    def __init__(self):
        self.keys = set()

    def fresh(self, paragraph):
        key = hashlib.sha1(re.sub(r'\W+', ' ', paragraph.lower()).strip().encode('utf-8')).hexdigest()[:16]
        if key in self.keys:
            return False
        self.keys.add(key)
        return True


def relevant(text, wanted, limit=2400, seen=None):
    """The page's paragraphs that matter for these words, in page order, within `limit` characters.

    The opening paragraph is kept (it usually says what the page is); the rest are scored by the
    task's words they carry, plus a point for figures. With nothing matching, the opening stands."""
    rows = paragraphs(text)
    if not rows:
        return str(text or '')[:limit]
    if seen is not None:
        rows = [p for p in rows if seen.fresh(p)] or rows[:1]
    scored = []
    for index, paragraph in enumerate(rows):
        lower = paragraph.lower()
        score = sum(1 for word in wanted if word in lower) + (1 if NUMERIC.search(paragraph) else 0)
        scored.append((index, score, paragraph))
    chosen = {0}
    budget = len(rows[0])
    for index, score, paragraph in sorted(scored[1:], key=lambda row: (-row[1], row[0])):
        if score <= 0 or budget + len(paragraph) + 1 > limit:
            continue
        chosen.add(index)
        budget += len(paragraph) + 1
    out = '\n'.join(rows[i] for i in sorted(chosen))
    return out[:limit]


def table_text(tables, rows=12, limit=900):
    """The first tables as ' | '-joined rows: what a pricing or spec table says, compactly."""
    lines = []
    for table in (tables or [])[:2]:
        for row in table[:rows]:
            cells = [str(c).strip() for c in row if str(c).strip()]
            if cells:
                lines.append(' | '.join(cells)[:240])
        lines.append('')
    return '\n'.join(lines).strip()[:limit]


def follow_links(page_url, links, limit=1):
    """Same-site pages worth reading next for a comparison (pricing, plans, features, docs), best first."""
    host = (urlsplit(page_url).hostname or '').lower().removeprefix('www.')
    base = urlsplit(page_url).path.rstrip('/')
    picks = []
    for link in links or []:
        href = str(link.get('href') or '')
        parts = urlsplit(href)
        if parts.scheme not in ('http', 'https') or (parts.hostname or '').lower().removeprefix('www.') != host:
            continue
        if parts.path.rstrip('/') == base or not FOLLOW.search(parts.path + ('?' if parts.query else '')):
            continue
        clean = href.split('#')[0]
        if clean not in picks:
            picks.append(clean)
    order = ('pricing', 'plans', 'price', 'compare', 'features', 'feature', 'product', 'enterprise', 'business', 'docs', 'documentation')
    picks.sort(key=lambda url: next((i for i, word in enumerate(order) if f'/{word}' in url.lower()), len(order)))
    return picks[:limit]
