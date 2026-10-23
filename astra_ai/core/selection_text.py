"""Match browser selections against the authorized rendered publication."""
import re
import unicodedata
from bs4 import BeautifulSoup
from markdown_it import MarkdownIt


def rendered_text(markdown):
    from .text_presentation import without_decorative_emoji
    markdown = without_decorative_emoji(markdown)
    soup = BeautifulSoup(MarkdownIt().enable('table').render(markdown), 'html.parser')
    for element in soup.select('script,style,button,figcaption,svg,[data-citation],.research-citation,.research-citation-chip'):
        element.decompose()
    return soup.get_text(' ', strip=True)


def selection_key(text):
    text = unicodedata.normalize('NFKC', str(text)).casefold()
    text = re.sub(r'\[S\d+(?:\s*[,;]\s*S\d+)*\]', '', text, flags=re.I)
    text = re.sub(r'https?://[^\s<>()]+', '', text)
    # Browser textContent joins adjacent inline nodes and table cells, whereas
    # HTML parsers insert separators. Ignore those separators, not actual letters.
    text = text.translate(str.maketrans({'’': "'", '‘': "'", '“': '"', '”': '"', '–': '-', '—': '-'}))
    return ''.join(c for c in text if not c.isspace() and unicodedata.category(c) != 'Cf')


def matches_selection(text, evidence):
    chosen = selection_key(text)
    return bool(chosen) and chosen in selection_key(rendered_text(evidence))
