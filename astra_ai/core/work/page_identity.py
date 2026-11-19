"""V33 Add to Work: one identity per page, so the same page added twice is one reference.

Mirrors work-canvas/src/work-handoff.ts `pageKey`: scheme and host lower-cased, `www.` dropped, the
fragment, tracking parameters and a trailing slash removed; a YouTube video is its video id whatever
address form it came in (watch, youtu.be, embed, shorts, nocookie).
"""
from __future__ import annotations

import re
from urllib.parse import parse_qsl, urlencode, urlsplit

TRACKING = re.compile(r'^(utm_\w+|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|igshid|ref_src|si|feature)$', re.I)
YOUTUBE_HOSTS = {'youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'music.youtube.com'}


def youtube_id(url):
    try:
        parts = urlsplit(url)
    except ValueError:
        return ''
    host = (parts.hostname or '').lower().removeprefix('www.')
    found = ''
    if host == 'youtu.be':
        found = parts.path.strip('/').split('/')[0]
    elif host in YOUTUBE_HOSTS:
        if parts.path == '/watch':
            found = dict(parse_qsl(parts.query)).get('v', '')
        else:
            match = re.match(r'^/(?:embed|shorts|live|v)/([^/?#]+)', parts.path)
            found = match.group(1) if match else ''
    return found if re.fullmatch(r'[A-Za-z0-9_-]{11}', found or '') else ''


def page_key(url):
    video = youtube_id(url)
    if video:
        return 'youtube:' + video
    try:
        parts = urlsplit(url.strip())
    except ValueError:
        return url
    host = (parts.hostname or '').lower().removeprefix('www.')
    port = f':{parts.port}' if parts.port and parts.port not in (80, 443) else ''
    query = urlencode(sorted((k, v) for k, v in parse_qsl(parts.query, keep_blank_values=True) if not TRACKING.match(k)))
    path = parts.path.rstrip('/') or ''
    return f'{parts.scheme.lower()}://{host}{port}{path}' + (f'?{query}' if query else '')


def clean_meta(meta):
    """Only short plain fields from the page or the person's browser: no HTML, no page body."""
    if not isinstance(meta, dict):
        return {}
    out = {}
    for key, limit in (('description', 400), ('site', 80), ('canonical', 600), ('image', 600), ('favicon', 600), ('kind', 20), ('provenance', 40), ('channel', 120)):
        value = meta.get(key)
        if isinstance(value, str) and value.strip():
            value = re.sub(r'<[^>]*>', '', re.sub(r'\s+', ' ', value)).strip()[:limit]
            if key in ('canonical', 'image', 'favicon') and not value.startswith('https://'):
                continue
            out[key] = value
    if out.get('provenance') not in (None, 'browser_tab', 'source_window', 'video'):
        out.pop('provenance')
    return out
