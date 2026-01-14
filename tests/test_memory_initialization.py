import sys
import os
sys.path.insert(0, '.')

# Test that the memory system initializes correctly in nova_ai.py
print("=== Testing Memory System Initialization ===")

try:
    # Try to import and initialize the memory system directly
    from astra_ai.memory.mem0_memory_system import AdvancedMemoryAgent
    
    # Create an agent with the new storage file
    storage_path = os.path.normpath(os.path.join('data', 'Mem0_storage_ai.json'))
    agent = AdvancedMemoryAgent(storage_path)
    print("[PASS] AdvancedMemoryAgent initialized successfully")
    print(f"  - Storage file: {agent.memory_system.storage_file}")
    
    # Process a test conversation
    result = agent.process_conversation(
        "Hello, I'm Charlie and I'm learning about AI.",
        "Nice to meet you Charlie! AI is a fascinating field to learn about."
    )
    print("[PASS] Conversation processed successfully")
    
    # Check that the conversation was stored
    import json
    with open(storage_path, 'r') as f:
        data = json.load(f)
    print(f"[PASS] Storage file updated with {len(data.get('conversation', []))} conversations")
    print(f"  - Memory events: {len(data.get('memory_events', []))}")
    
except Exception as e:
    print(f"[FAIL] Error: {e}")

print("\n=== Test Complete ===")