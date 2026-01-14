import sys
import os
sys.path.insert(0, '.')

# Test that both memory systems can work with the new file location
print("=== Testing Memory Systems with New File Location ===")

try:
    # Test mem0_memory_system.py
    from astra_ai.memory.mem0_memory_system import AdvancedMemoryAgent
    agent = AdvancedMemoryAgent('astra_ai/Date/Mem0_storage_ai.json')
    print("[PASS] mem0_memory_system.py works with new file location")
    print(f"  - Storage file: {agent.memory_system.storage_file}")
    
    # Process a test conversation
    result = agent.process_conversation(
        "Hello, I'm Eve and I'm testing the new file location.",
        "Nice to meet you Eve! I'm glad you're testing the new file location."
    )
    print("[PASS] Conversation processed successfully with mem0_memory_system.py")
    
except Exception as e:
    print(f"[FAIL] mem0_memory_system.py test failed: {e}")

try:
    # Test Mem0_ai_organizer.py
    from astra_ai.memory.Mem0_ai_organizer import Mem0AiOrganizer
    organizer = Mem0AiOrganizer('astra_ai/Date/Mem0_storage_ai.json')
    print("[PASS] Mem0_ai_organizer.py works with new file location")
    print(f"  - Storage file: {organizer.memory_file_path}")
    
    # Prepare memory for AI
    memory_for_ai = organizer.prepare_memory_for_ai()
    print("[PASS] Memory prepared successfully with Mem0_ai_organizer.py")
    print(f"  - Memory structure keys: {list(memory_for_ai.keys())}")
    
except Exception as e:
    print(f"[FAIL] Mem0_ai_organizer.py test failed: {e}")

print("\n=== Test Complete ===")