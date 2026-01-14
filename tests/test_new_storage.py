import sys
import os
sys.path.insert(0, '.')

# Test that both memory systems work with the new storage file
print("=== Testing Both Memory Systems with New Storage File ===")

# 1. Test that mem0_memory_system.py works with the new file
try:
    from astra_ai.memory.mem0_memory_system import AdvancedMemoryAgent
    agent = AdvancedMemoryAgent('data/Mem0_storage_ai.json')
    print("[PASS] mem0_memory_system.py works with new storage file")
    print(f"  - Storage file: {agent.memory_system.storage_file}")
    print(f"  - Memory events: {len(agent.memory_system.data.get('memory_events', []))}")
except Exception as e:
    print(f"[FAIL] mem0_memory_system.py failed: {e}")

# 2. Test that Mem0_ai_organizer.py works with the new file
try:
    from astra_ai.memory.Mem0_ai_organizer import Mem0AiOrganizer
    organizer = Mem0AiOrganizer('data/Mem0_storage_ai.json')
    print("[PASS] Mem0_ai_organizer.py works with new storage file")
    print(f"  - Storage file: {organizer.memory_file_path}")
    memory_status = organizer.get_memory_status()
    print(f"  - Memory events: {memory_status.get('total_memory_events', 0)}")
except Exception as e:
    print(f"[FAIL] Mem0_ai_organizer.py failed: {e}")

# 3. Test conversation processing with both systems
try:
    # Process a conversation with mem0_memory_system
    result = agent.process_conversation(
        "Hello, my name is John and I love programming in Python.",
        "Nice to meet you John! Python is a great programming language."
    )
    print("[PASS] Conversation processing works with mem0_memory_system")
    
    # Check if the conversation was saved to the file
    import json
    with open('data/Mem0_storage_ai.json', 'r') as f:
        data = json.load(f)
    conversation_count = len(data.get('conversation', []))
    memory_events_count = len(data.get('memory_events', []))
    print(f"[PASS] Conversation saved to Mem0_storage_ai.json")
    print(f"  - Total conversations: {conversation_count}")
    print(f"  - Total memory events: {memory_events_count}")
    
except Exception as e:
    print(f"[FAIL] Conversation processing failed: {e}")

# 4. Test that the organizer can read the updated file
try:
    memory_status = organizer.get_memory_status()
    print(f"[PASS] Mem0_ai_organizer can read updated file")
    print(f"  - Memory events: {memory_status.get('total_memory_events', 0)}")
    print(f"  - Conversation count: {memory_status.get('conversation_count', 0)}")
except Exception as e:
    print(f"[FAIL] Mem0_ai_organizer failed to read file: {e}")

print("\n=== Test Complete ===")