#!/usr/bin/env python3
"""Add a new test search to trigger widget update"""

import json
from datetime import datetime

# Read current file
with open('content_analysis.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Create new search entry
new_search = {
    'content_id': f'search_{datetime.now().strftime("%Y%m%d_%H%M%S")}',
    'content_type': 'search',
    'query': 'what is artificial intelligence and how does it work',
    'raw_content': """SEARCH_RESULT: What is Artificial Intelligence

Direct Answer
Artificial Intelligence (AI) is the simulation of human intelligence processes by machines, particularly computer systems. These processes include learning, reasoning, and self-correction.

Key Components
1. Machine Learning: Systems that learn from data without being explicitly programmed
2. Deep Learning: Neural networks inspired by biological brains
3. Natural Language Processing: Understanding and generating human language

Applications Today
- Virtual Assistants (Siri, Alexa, ChatGPT)
- Autonomous Vehicles: Self-driving cars
- Healthcare: Medical diagnosis and drug discovery
- Finance: Fraud detection and algorithmic trading

How It Works
AI systems process large amounts of data, identify patterns, and make decisions based on those patterns. Modern AI uses deep learning with artificial neural networks.

Future Developments
Researchers are working on creating more efficient, interpretable, and ethically aligned AI systems. Areas of focus include explainability and responsible AI development."""
}

# Add to analyses
data['analyses'].append(new_search)

# Write back
with open('content_analysis.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f'✅ New search added: {new_search["content_id"]}')
print(f'Query: {new_search["query"]}')
print(f'Total searches now: {len(data["analyses"])}')
