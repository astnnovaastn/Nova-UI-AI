import json

# Check if Mem0_storage_ai.json is a standalone file
with open('data/Mem0_storage_ai.json', 'r') as f:
    data = json.load(f)

print("File is standalone JSON")
print(f"Root keys: {len(data.keys())}")

# Check for required keys
required_keys = ['conversation', 'memory_events', 'current_facts', 'user_preferences', 'long_term_goals']
for key in required_keys:
    print(f"Contains {key}: {key in data}")

# Show some sample data
print(f"\nSample data:")
print(f"  Conversation items: {len(data.get('conversation', []))}")
print(f"  Memory events: {len(data.get('memory_events', []))}")
print(f"  Current facts: {len(data.get('current_facts', {}))}")