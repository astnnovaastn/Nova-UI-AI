import json
from datetime import datetime

# Load memory
memory_path = r"d:\Astra_ai\astra_ai\Date\nova_ai_memory.json"
with open(memory_path, 'r') as f:
    data = json.load(f)

# Get last conversation length
print(f"Current conversation length: {len(data['conversation'])}")

# Add a test AI response
test_response = {
    "role": "assistant",
    "content": "Hello! This is a test voice response from the memory monitor. The orb should animate based on the audio frequencies!",
    "timestamp": datetime.now().isoformat(),
    "session_id": data.get("current_session", "session_default"),
    "sent_to_organizer": True
}

data['conversation'].append(test_response)

# Save back
with open(memory_path, 'w') as f:
    json.dump(data, f, indent=2)

print(f"New conversation length: {len(data['conversation'])}")
print(f"✓ Test AI response added")
print(f"Response: {test_response['content'][:80]}...")
