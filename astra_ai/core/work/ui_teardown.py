"""V33 UI teardown: what an interface is made of, measured from its own HTML, before any model writes.

Until V33 a UI teardown searched like a product comparison and the lead wrote patterns from page text,
so the result read like an article about design. Here each inspected interface (pasted HTML, or a page
the agent browser read) gets a deterministic inspection: a component inventory, accessibility findings
with the element they are about, the page's structure (title, landmarks, heading outline, primary
actions) and its declared colours and type. The canvas objects built from it are facts about this
interface; the lead only adds observations, UX findings and recommendations on top of them.

Everything read from a page is untrusted data: it is counted and quoted, never followed or executed.
"""
from __future__ import annotations

import re
from collections import Counter

HTML_BLOCK = re.compile(r'```html\s*\n([\s\S]*?)```', re.I)
RAW_HTML = re.compile(r'(<!doctype html[\s\S]*?</html>|<html[\s\S]*?</html>)', re.I)
TEXT_INPUTS = {'text', 'email', 'password', 'search', 'tel', 'url', 'number', 'date', ''}
HEX = re.compile(r'#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b')


def supplied_html(*texts):
    """HTML documents the person pasted (a ```html block or a whole document), in order."""
    out = []
    for text in texts:
        for block in HTML_BLOCK.findall(text or '') or RAW_HTML.findall(text or ''):
            if '<' in block and block.strip() not in out:
                out.append(block.strip()[:400000])
    return out


def _soup(html):
    from bs4 import BeautifulSoup
    return BeautifulSoup(html or '', 'html.parser')


def _short(text, limit=80):
    return re.sub(r'\s+', ' ', str(text or '')).strip()[:limit]


def _name(tag):
    """An element's accessible name, as far as static HTML shows it."""
    return _short(tag.get('aria-label') or tag.get_text(' ', strip=True) or tag.get('title') or tag.get('value')
                  or ' '.join(i.get('alt', '') for i in tag.find_all('img')))


def _where(tag):
    ident = ('#' + tag['id']) if tag.get('id') else ''
    classes = ('.' + '.'.join(tag.get('class')[:2])) if tag.get('class') else ''
    return tag.name + ident + classes


def _rgb(value):
    value = value.strip().lstrip('#')
    if len(value) == 3:
        value = ''.join(ch * 2 for ch in value)
    try:
        return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))
    except ValueError:
        return None


def contrast(a, b):
    """WCAG contrast ratio of two #rgb colours."""
    def lum(rgb):
        out = []
        for channel in rgb:
            c = channel / 255
            out.append(c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4)
        return 0.2126 * out[0] + 0.7152 * out[1] + 0.0722 * out[2]
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def _declared(style, prop):
    match = re.search(r'(?:^|[;{\s])' + prop + r'\s*:\s*(#[0-9a-fA-F]{3,6})\b', style or '')
    return _rgb(match.group(1)) if match else None


def _css_rules(soup):
    """Simple `selector { ... }` rules from the page's own <style> blocks (no cascade beyond that)."""
    rules = []
    for style in soup.find_all('style'):
        for selector, body in re.findall(r'([^{}]+)\{([^{}]*)\}', style.get_text() or ''):
            rules.append((selector.strip(), body))
    return rules


def inspect(html, url='', title=''):
    """The inspection of one interface: components, accessibility findings, structure, colours and type."""
    soup = _soup(html)
    for hidden in soup(['script', 'noscript', 'template']):
        hidden.decompose()
    found = Counter()
    notes = {}

    def count(name, items, note=''):
        items = list(items)
        if items:
            found[name] += len(items)
            if note and name not in notes:
                notes[name] = note
        return items

    buttons = count('Button', soup.find_all('button') + soup.find_all('input', attrs={'type': re.compile('^(submit|button|reset)$', re.I)})
                    + [t for t in soup.find_all(attrs={'role': 'button'}) if t.name not in ('button', 'input')])
    links = count('Link', [a for a in soup.find_all('a') if a.get('href')])
    fields = count('Text field', [i for i in soup.find_all('input') if (i.get('type') or '').lower() in TEXT_INPUTS] + soup.find_all('textarea'))
    count('Select', soup.find_all('select'))
    count('Checkbox or radio', soup.find_all('input', attrs={'type': re.compile('^(checkbox|radio)$', re.I)}))
    images = count('Image', soup.find_all('img'))
    count('Icon (SVG)', soup.find_all('svg'))
    count('Form', soup.find_all('form'))
    count('Table', soup.find_all('table'))
    count('Navigation', soup.find_all('nav') + soup.find_all(attrs={'role': 'navigation'}))
    count('Dialog', soup.find_all('dialog') + soup.find_all(attrs={'role': 'dialog'}))
    count('Tab', soup.find_all(attrs={'role': 'tab'}))
    count('Card', [t for t in soup.find_all(class_=re.compile(r'(^|-)card($|-)', re.I))])
    count('Video or audio', soup.find_all(['video', 'audio']))
    headings = count('Heading', soup.find_all(re.compile('^h[1-6]$')))

    findings = []

    def finding(title_, detail, severity='medium'):
        if len(findings) < 24:
            findings.append({'title': title_, 'detail': _short(detail, 160), 'severity': severity})

    for img in images:
        if img.get('alt') is None and img.get('role') != 'presentation' and img.get('aria-hidden') != 'true':
            finding('Image without alt text', _where(img) + ' ' + _short(img.get('src'), 60), 'high')
    labelled = {label.get('for') for label in soup.find_all('label') if label.get('for')}
    for field in fields + soup.find_all('select'):
        wrapped = field.find_parent('label') is not None
        if not (wrapped or field.get('aria-label') or field.get('aria-labelledby') or (field.get('id') and field['id'] in labelled) or field.get('title')):
            placeholder = ' (placeholder "' + _short(field.get('placeholder'), 40) + '" is not a label)' if field.get('placeholder') else ''
            finding('Form field without a label', _where(field) + placeholder, 'high')
    for button in buttons:
        if not _name(button):
            finding('Button without an accessible name', _where(button), 'high')
    for link in links:
        if not _name(link):
            finding('Link without text', _where(link) + ' → ' + _short(link.get('href'), 60), 'medium')
        elif _name(link).lower() in ('click here', 'here', 'read more', 'more'):
            finding('Vague link text', '"' + _name(link) + '" at ' + _where(link), 'low')
    root = soup.find('html')
    if root is not None and not root.get('lang'):
        finding('Page language not declared', '<html> has no lang attribute', 'medium')
    levels = [int(h.name[1]) for h in headings]
    if headings and 1 not in levels:
        finding('No top-level heading', 'the page has no h1', 'medium')
    if levels.count(1) > 1:
        finding('Several top-level headings', str(levels.count(1)) + ' h1 elements', 'low')
    for before, after, tag in zip(levels, levels[1:], headings[1:]):
        if after > before + 1:
            finding('Heading level skipped', 'h' + str(before) + ' → h' + str(after) + ' at "' + _name(tag)[:40] + '"', 'low')
            break
    for tag in soup.find_all(attrs={'tabindex': re.compile(r'^[1-9]')}):
        finding('Positive tabindex changes the focus order', _where(tag) + ' tabindex=' + tag['tabindex'], 'medium')
    viewport = soup.find('meta', attrs={'name': 'viewport'})
    if viewport and re.search(r'user-scalable\s*=\s*no|maximum-scale\s*=\s*1(\.0)?\b', viewport.get('content', ''), re.I):
        finding('Zoom is disabled', 'viewport meta blocks pinch zoom', 'high')
    for media in soup.find_all(['video', 'audio']):
        if media.has_attr('autoplay') and not media.has_attr('muted'):
            finding('Media plays sound automatically', _where(media), 'medium')
    # Low contrast where the page itself declares both colours (inline, or one simple rule for the selector).
    rules = _css_rules(soup)
    checked = 0
    for selector, body in rules + [(None, t.get('style', '')) for t in soup.find_all(style=True)]:
        fg = _declared(body, 'color')
        bg = _declared(body, 'background(?:-color)?') or (255, 255, 255)
        if fg and checked < 40:
            checked += 1
            ratio = contrast(fg, bg)
            if ratio < 4.5:
                finding('Low text contrast', (selector or 'inline style') + ': ' + '#%02x%02x%02x' % fg + ' on ' + '#%02x%02x%02x' % bg
                        + ' is ' + f'{ratio:.1f}:1 (needs 4.5:1)', 'high' if ratio < 3 else 'medium')
    error_rules = [s for s, body in rules if re.search(r'error|invalid', s, re.I) and _declared(body, 'color')]
    if error_rules and not soup.find(attrs={'role': 'alert'}) and not soup.find(attrs={'aria-live': True}):
        finding('Errors may be shown by colour alone', 'styles ' + ', '.join(error_rules[:2]) + ' set a colour; no role="alert" or aria-live region', 'medium')

    landmarks = [name for name, present in (('header', soup.find('header')), ('nav', soup.find('nav')), ('main', soup.find('main') or soup.find(attrs={'role': 'main'})),
                                             ('footer', soup.find('footer'))) if present]
    if 'main' not in landmarks and (headings or fields):
        finding('No main landmark', 'no <main> or role="main"', 'low')
    palette = [c.lower() for c, _ in Counter(HEX.findall(' '.join(body for _, body in rules) + ' '.join(t.get('style', '') for t in soup.find_all(style=True)))).most_common(6)]
    fonts = list(dict.fromkeys(_short(f.split(',')[0].strip(' "\''), 40) for f in re.findall(r'font-family\s*:\s*([^;}]+)', ' '.join(body for _, body in rules))))[:4]
    page_title = _short(title or (soup.title.get_text() if soup.title else '') or url, 120)
    primary = [n for n in (_name(b) for b in buttons) if n][:6]
    return {
        'url': url,
        'title': page_title,
        'components': [{'name': name, 'count': n, 'note': notes.get(name, '')} for name, n in found.most_common()],
        'accessibility': findings,
        'structure': {'landmarks': landmarks, 'headings': [('h' + str(l)) + ' ' + _name(h)[:60] for l, h in zip(levels, headings)][:14],
                      'actions': primary, 'links': len(links), 'fields': len(fields)},
        'palette': palette,
        'fonts': fonts,
    }


def summary(inspection):
    """What the lead is shown of an inspection: compact, already counted."""
    return {
        'title': inspection['title'],
        'url': inspection['url'],
        'components': {c['name']: c['count'] for c in inspection['components']},
        'accessibility': [f"{f['title']}: {f['detail']}" for f in inspection['accessibility'][:12]],
        'structure': inspection['structure'],
        'palette': inspection['palette'],
        'fonts': inspection['fonts'],
    }


def inventory_data(inspections, refs):
    """A Zephium sheet: one row per component kind, a count column per inspected interface."""
    many = len(inspections) > 1
    names = list(dict.fromkeys(c['name'] for i in inspections for c in i['components']))
    columns = [{'label': 'Component', 'kind': 'entity'}] + [
        {'label': (_short(i['title'], 24) if many else 'Count'), 'kind': 'number'} for i in inspections]
    rows = []
    for name in names:
        cells = [name] + [str(next((c['count'] for c in i['components'] if c['name'] == name), 0)) for i in inspections]
        rows.append({'cells': cells, **({'source': refs[0]} if refs and not many else {})})
    return {'columns': columns, 'rows': rows, 'note': 'Counted from the page HTML (static markup; content added later by scripts is not counted).'}


def accessibility_data(inspections, refs):
    """A Zephium list of accessibility findings, most severe first, each saying the element it is about."""
    order = {'high': 0, 'medium': 1, 'low': 2}
    items = []
    for inspection, ref in zip(inspections, refs or [None] * len(inspections)):
        for f in sorted(inspection['accessibility'], key=lambda f: order.get(f['severity'], 3)):
            label = (' — ' + _short(inspection['title'], 30)) if len(inspections) > 1 else ''
            items.append({'title': f['title'] + label, 'detail': f['detail'], **({'priority': 'high'} if f['severity'] == 'high' else {}),
                          **({'source': ref} if ref else {})})
    if not items:
        items.append({'title': 'No static accessibility issues found', 'detail': 'Checked: alt text, labels, names, language, headings, zoom, contrast where declared'})
    return {'style': 'requirements', 'items': items[:20]}
