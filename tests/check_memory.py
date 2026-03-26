import json

with open('data/nova_ai_memory.json', 'r') as f:
    data = json.load(f)
    
print('Total memory events:', len(data.get('memory_events', [])))

events = data.get('memory_events', [])
if events:
    print('Last 3 events:')
    for i, event in enumerate(events[-3:], 1):
        print(f'  {i}. {event["summary"]}')
else:
    print('No events found')

# Check current facts
facts = data.get('current_facts', {})
print(f'Current facts: {len(facts)}')
for key, fact in facts.items():
    if isinstance(fact, dict):
        print(f'  - {key}: {fact.get("value", "N/A")}')
    else:
        print(f'  - {key}: {fact}')