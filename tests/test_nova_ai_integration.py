import sys
import os
sys.path.insert(0, '.')

# Test nova_ai.py integration with standalone file
print("=== Testing nova_ai.py Integration ===")

try:
    # Import nova_ai.py
    from astra_ai.core.nova_ai import AleChatBot
    
    # Initialize the chatbot
    bot = AleChatBot()
    print("[PASS] nova_ai.py imports successfully")
    
    # Check if memory system is enabled
    print(f"Memory enabled: {bot.memory_enabled}")
    
    if bot.memory_enabled and bot.mem0_memory_agent:
        print("[PASS] Memory system is enabled")
        print(f"  - Storage file: {bot.mem0_memory_agent.memory_system.storage_file}")
        
        # Test conversation storage
        result = bot._store_conversation_memory_async(
            "Hello, I'm David and I'm testing the standalone file integration.",
            "Nice to meet you David! I'm glad you're testing the standalone file integration."
        )
        print("[PASS] Conversation storage initiated")
        
    else:
        print("[INFO] Memory system not enabled in nova_ai.py")
        
except Exception as e:
    print(f"[FAIL] Error: {e}")

print("\n=== Test Complete ===")