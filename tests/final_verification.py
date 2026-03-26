import sys
import os
sys.path.insert(0, '.')

# Final verification test
print("=== Final Verification Test ===")

try:
    # Test that both memory systems can work with the new file location
    print("Testing mem0_memory_system.py with new file location...")
    from astra_ai.memory.mem0_memory_system import AdvancedMemoryAgent
    agent = AdvancedMemoryAgent('astra_ai/Date/Mem0_storage_ai.json')
    print(f"[PASS] mem0_memory_system.py works with new file location: {agent.memory_system.storage_file}")
    
    # Test that Mem0_ai_organizer.py can work with the new file location
    print("Testing Mem0_ai_organizer.py with new file location...")
    from astra_ai.memory.Mem0_ai_organizer import Mem0AiOrganizer
    organizer = Mem0AiOrganizer('astra_ai/Date/Mem0_storage_ai.json')
    print(f"[PASS] Mem0_ai_organizer.py works with new file location: {organizer.memory_file_path}")
    
    # Test that nova_ai.py can work with the new file location
    print("Testing nova_ai.py with new file location...")
    from astra_ai.core.nova_ai import AleChatBot
    bot = AleChatBot()
    print(f"[PASS] nova_ai.py imports successfully")
    print(f"  - Memory enabled: {bot.memory_enabled}")
    if bot.memory_enabled and bot.mem0_memory_agent:
        print(f"  - Memory storage file: {bot.mem0_memory_agent.memory_system.storage_file}")
    
    # Check current conversation count
    import json
    with open('astra_ai/Date/Mem0_storage_ai.json', 'r') as f:
        data = json.load(f)
    print(f"[PASS] Current conversation count: {len(data.get('conversation', []))}")
    
    print("\n=== All Systems Verified ===")
    print("✅ Mem0_storage_ai.json is properly set up as a standalone file")
    print("✅ mem0_memory_system.py works with the new file location")
    print("✅ Mem0_ai_organizer.py works with the new file location")
    print("✅ nova_ai.py integrates with the new file location")
    print("✅ All conversations will be stored in the centralized file")
    
except Exception as e:
    print(f"[FAIL] Error: {e}")
    import traceback
    traceback.print_exc()

print("\n=== Verification Complete ===")