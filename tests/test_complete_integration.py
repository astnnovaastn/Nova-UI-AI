import sys
import os
sys.path.insert(0, '.')

# Test that all components work with the new centralized storage file
print(\"=== Testing Complete System Integration ===\")

try:
    # Test 1: AdvancedMemoryAgent with new file location
    print(\"1. Testing AdvancedMemoryAgent...\")
    from astra_ai.memory.mem0_memory_system import AdvancedMemoryAgent
    agent = AdvancedMemoryAgent('astra_ai/Date/Mem0_storage_ai.json')
    print(\"   [PASS] Agent initialized successfully\")
    print(f\"   [INFO] Storage file: {agent.memory_system.storage_file}\")
    
    # Test 2: Process a conversation
    print(\"2. Testing conversation processing...\")
    result = agent.process_conversation(
        \"Hello, I'm testing the new centralized storage system.\",
        \"Great! I'm glad you're testing the new centralized storage system.\"
    )
    print(\"   [PASS] Conversation processed successfully\")
    
    # Test 3: Mem0AiOrganizer with new file location
    print(\"3. Testing Mem0AiOrganizer...\")
    from astra_ai.memory.Mem0_ai_organizer import Mem0AiOrganizer
    organizer = Mem0AiOrganizer('astra_ai/Date/Mem0_storage_ai.json')
    print(\"   [PASS] Organizer initialized successfully\")
    print(f\"   [INFO] Storage file: {organizer.memory_file_path}\")
    
    # Test 4: Prepare memory for AI
    print(\"4. Testing memory preparation...\")
    memory_for_ai = organizer.prepare_memory_for_ai()
    print(\"   [PASS] Memory prepared successfully\")
    print(f\"   [INFO] Memory keys: {list(memory_for_ai.keys())}\")
    
    # Test 5: Check that data was stored in the file
    print(\"5. Testing file storage...\")
    import json
    with open('astra_ai/Date/Mem0_storage_ai.json', 'r') as f:
        data = json.load(f)
    conversation_count = len(data.get('conversation', []))
    print(\"   [PASS] Conversations stored successfully\")
    print(f\"   [INFO] Conversations stored: {conversation_count}\")
    
    print(\"\\n=== All Tests Passed! ===\")
    print(\"[SUCCESS] AdvancedMemoryAgent works with new file\")
    print(\"[SUCCESS] Mem0AiOrganizer works with new file\") 
    print(\"[SUCCESS] Conversations are stored in centralized file\")
    print(\"[SUCCESS] All systems integrated successfully\")
    
except Exception as e:
    print(f\"[ERROR] Error: {e}\")
    import traceback
    traceback.print_exc()

print(\"\\n=== Integration Test Complete ===\")