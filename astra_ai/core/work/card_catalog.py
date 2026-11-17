"""Versioned, discoverable card specifications shared by generation and rendering.

The reference designs are compositions of existing Zephium primitives, not model
authored code. Presets are admitted only after their renderer is implemented.
"""
from pathlib import Path
import json

CATALOG = json.loads(Path(__file__).with_name('card_catalog.json').read_text(encoding='utf-8'))
FAMILIES = {row['id']: row for row in CATALOG['families']}
PRESETS = {p['id']: dict(p, family=f['id']) for f in FAMILIES.values() for p in f['presets']}


def find(query='', workflow='', include_unreleased=False):
    terms = set(str(query).lower().split())
    rows = []
    for family in FAMILIES.values():
        words = set((' '.join([family['label'], family['purpose'], *family['uses']])).lower().split())
        score = len(terms & words) + (2 if workflow in family['workflows'] else 0)
        rows.append((score, family['id'], dict(id=family['id'], label=family['label'], kind=family['kind'],
            purpose=family['purpose'], required=family['required'],
            presets=[p['id'] for p in family['presets'] if include_unreleased or p['available']])))
    return [r[2] for r in sorted(rows, key=lambda r: (-r[0], r[1]))]


def read(family, preset=None):
    if family not in FAMILIES:
        raise ValueError('unknown_card_family')
    if preset:
        if preset not in PRESETS or PRESETS[preset]['family'] != family:
            raise ValueError('incompatible_card_preset')
        return PRESETS[preset]
    return FAMILIES[family]
