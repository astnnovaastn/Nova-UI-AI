import json
from datetime import datetime

# Test writing to the new storage file
with open('astra_ai/Date/Mem0_storage_ai.json', 'r+') as f:
    data = json.load(f)
    data['conversation'].append({
        'role': 'user', 
        'content': 'Test message for verifying new storage file', 
        'timestamp': datetime.now().isoformat()
    })
    f.seek(0)
    json.dump(data, f, indent=2)
    f.truncate()

print("Successfully wrote test message to new storage file")