import sys
import os
sys.path.append(os.getcwd())

from astra_ai.memory.mem0_memory_system import NovaMemoryAI
import json

def test_memory_system():
    # Create a new memory system instance
    memory_system = NovaMemoryAI()

    print('Before processing:')
    print(f'Memory events count: {len(memory_system.data["memory_engine"]["memory_events"])}')

    # Test with a simple user message that should create an ADD event
    test_message = 'i like anime'
    ai_response = 'That is great!'

    # Process the conversation
    result = memory_system.process_conversation(test_message, ai_response)
    print(f'Processing result: {result}')

    print('After processing:')
    print(f'Memory events count: {len(memory_system.data["memory_engine"]["memory_events"])}')

    # Print the memory events if any were created
    for i, event in enumerate(memory_system.data['memory_engine']['memory_events']):
        print(f'Memory event {i}: {json.dumps(event, indent=2)}')

if __name__ == "__main__":
    test_memory_system()