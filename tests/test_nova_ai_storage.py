import sys
import os
sys.path.insert(0, '.')

# Test that nova_ai.py can store conversations in the centralized file
print("=== Testing nova_ai.py conversation storage ===")

try:
    # Import nova_ai.py
    from astra_ai.core.nova_ai import AleChatBot
    
    # Initialize the chatbot
    bot = AleChatBot()
    print("[PASS] nova_ai.py imports successfully")
    
    # Check if memory system is enabled
    if bot.memory_enabled and bot.mem0_memory_agent:
        print("[PASS] Memory system is enabled")
        print(f"  - Storage file: {bot.mem0_memory_agent.memory_system.storage_file}")
        
        # Process a test conversation
        result = bot._store_conversation_memory_async(
            "Hello, I'm Bob and I'm interested in machine learning.",
            "Nice to meet you Bob! Machine learning is a fascinating field."
        )
        print("[PASS] Conversation storage initiated")
        
        # Check the storage file
        import json
        storage_file = bot.mem0_memory_agent.memory_system.storage_file
        if os.path.exists(storage_file):
            with open(storage_file, 'r') as f:
                data = json.load(f)
            print(f"[PASS] Storage file exists with {len(data.get('conversation', []))} conversations")
            print(f"  - Memory events: {len(data.get('memory_events', []))}")
        else:
            print("[FAIL] Storage file does not exist")
    else:
        print("[FAIL] Memory system is not enabled")
        
except Exception as e:
    print(f"[FAIL] Error: {e}")

print("\n=== Test Complete ===")