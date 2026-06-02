import sys
import os
import json

# Ensure repo root is on sys.path
ROOT = os.path.dirname(os.path.dirname(__file__))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from astra_ai.memory.mem0_memory_system import AdvancedMemoryAgent

agent = AdvancedMemoryAgent()
# Simulate conversation where user states a preference
user_msg = "My favorite coding language is py"
ai_resp = "Nice choice!"
result = agent.process_conversation(user_msg, ai_resp)

print('Processed operations:', result['memory_operations'])

# Load saved file
with open(agent.memory_system.storage_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Print keys in personal preferences
prefs = data.get('memory_categories', {}).get('personal_preferences', {})
print('personal_preferences count:', len(prefs))
for k, v in list(prefs.items())[:10]:
    print(k, '->', v.get('value'))

# Print current_facts entry for user_preferences.likes if present
print('current_facts user_preferences.likes:', data.get('current_facts', {}).get('user_preferences.likes'))
