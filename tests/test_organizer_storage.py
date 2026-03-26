from astra_ai.memory.Mem0_ai_organizer import Mem0AiOrganizer
import json

# Initialize the organizer
organizer = Mem0AiOrganizer('data/Mem0_storage_ai.json')
print('Organizer initialized successfully')

# Get memory status
memory_status = organizer.get_memory_status()
print(f'Memory events: {memory_status.get("total_memory_events", 0)}')
print(f'Conversation count: {memory_status.get("conversation_count", 0)}')

# Prepare memory for AI
ai_memory = organizer.prepare_memory_for_ai()
print(f'AI memory prepared with {len(ai_memory.get("facts", []))} facts')
print(f'Recent sessions count: {len(ai_memory.get("recent_sessions", []))}')

# Check the storage file directly
with open('data/Mem0_storage_ai.json', 'r') as f:
    data = json.load(f)

print(f'Direct file check - Conversation count: {len(data.get("conversation", []))}')
print(f'Direct file check - Memory events: {len(data.get("memory_events", []))}')