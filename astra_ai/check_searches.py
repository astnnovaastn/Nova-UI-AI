#!/usr/bin/env python3
"""Check the content_analysis.json file"""

import json

data = json.load(open('content_analysis.json', encoding='utf-8'))
print(f'Total searches in file: {len(data["analyses"])}')
print(f'Last 3 search IDs:')
for a in data['analyses'][-3:]:
    print(f'  - {a["content_id"]}: {a["query"]}')
