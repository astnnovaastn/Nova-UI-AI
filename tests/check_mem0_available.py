import sys
import os
sys.path.insert(0, '.')

# Check if MEM0_MEMORY_AVAILABLE is set correctly
print("=== Checking MEM0_MEMORY_AVAILABLE ===")

try:
    # Try to import the memory system directly
    from astra_ai.memory.mem0_memory_system import AdvancedMemoryAgent, NovaMemoryAI
    print("[PASS] mem0_memory_system imports successfully")
    
    # Try to initialize it
    storage_path = os.path.normpath(os.path.join('data', 'Mem0_storage_ai.json'))
    agent = AdvancedMemoryAgent(storage_path)
    print("[PASS] AdvancedMemoryAgent initializes successfully")
    print(f"  - Storage file: {agent.memory_system.storage_file}")
    
    # Process a test conversation
    result = agent.process_conversation(
        "Hello, I'm testing the standalone file.",
        "Great! The standalone file is working correctly."
    )
    print("[PASS] Conversation processed successfully")
    
except Exception as e:
    print(f"[FAIL] Error: {e}")

print("\n=== Check Complete ===")