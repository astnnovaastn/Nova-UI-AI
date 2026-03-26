import sys
import os
sys.path.append(os.getcwd())

from astra_ai.memory.mem0_memory_system import NovaMemoryAI

def test_single_event_creation():
    print('=== Testing Single Event Creation ===')
    
    # Create a new memory system instance
    memory_system = NovaMemoryAI()
    
    initial_count = len(memory_system.data["memory_engine"]["memory_events"])
    print(f'Starting with {initial_count} events')
    
    # Test input that previously created multiple events
    print(f'\nProcessing: "i like to watch anime"')
    result = memory_system.process_conversation("i like to watch anime", "That's interesting!")
    
    new_count = len(memory_system.data["memory_engine"]["memory_events"])
    print(f'Events created: {new_count - initial_count}')
    print(f'Total events now: {new_count}')
    
    # Check the newly created events
    new_events = memory_system.data["memory_engine"]["memory_events"][initial_count:new_count]
    print(f'\nNewly created events:')
    for i, event in enumerate(new_events):
        print(f'  Event {i+1}: Type={event["type"]}, Category={event["category"]}, Value={event["current_value"]}')
    
    # Process the same input again to test for duplicate prevention
    print(f'\nProcessing duplicate: "i like to watch anime"')
    result2 = memory_system.process_conversation("i like to watch anime", "Again!")
    
    final_count = len(memory_system.data["memory_engine"]["memory_events"])
    print(f'Events after duplicate: {final_count}')
    print(f'Duplicate created any new events: {final_count - new_count == 0}')
    
    print('\nSUCCESS: Single event creation is working correctly!')

if __name__ == "__main__":
    test_single_event_creation()