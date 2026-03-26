import sys
import os
sys.path.append(os.getcwd())

from astra_ai.memory.mem0_memory_system import NovaMemoryAI
import json

def test_memory_system():
    # Create a new memory system instance
    memory_system = NovaMemoryAI()

    print('=== Test 1: Basic preference ===')
    print('Before processing:')
    print(f'Memory events count: {len(memory_system.data["memory_engine"]["memory_events"])}')

    # Test with a simple user message that should create an ADD event
    test_message = 'i like anime'
    ai_response = 'That is great!'

    # Process the conversation
    result = memory_system.process_conversation(test_message, ai_response)
    print(f'Processing result: {len(result["operations"])} operations created')

    print('After processing:')
    print(f'Memory events count: {len(memory_system.data["memory_engine"]["memory_events"])}')
    print()

    # Clear and test another message
    print('=== Test 2: Name introduction ===')
    # Create a fresh instance to test name introduction
    memory_system2 = NovaMemoryAI()
    
    test_message2 = 'my name is Rich'
    ai_response2 = 'Nice to meet you Rich!'

    print(f'Before processing: {len(memory_system2.data["memory_engine"]["memory_events"])} events')
    result2 = memory_system2.process_conversation(test_message2, ai_response2)
    print(f'Processing result: {len(result2["operations"])} operations created')
    print(f'After processing: {len(memory_system2.data["memory_engine"]["memory_events"])} events')
    
    for i, event in enumerate(memory_system2.data['memory_engine']['memory_events']):
        print(f'Memory event {i}: {json.dumps(event, indent=2)}')

if __name__ == "__main__":
    test_memory_system()