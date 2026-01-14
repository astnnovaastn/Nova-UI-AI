import sys
import os
sys.path.append(os.getcwd())

from astra_ai.memory.mem0_memory_system import NovaMemoryAI

def test_duplicate_prevention():
    print('=== Testing Duplicate Prevention With Single Event Creation ===')
    
    # Create a new memory system instance
    memory_system = NovaMemoryAI()
    
    initial_count = len(memory_system.data["memory_engine"]["memory_events"])
    print(f'Starting with {initial_count} events')
    
    # Process the same input twice
    print(f'\nProcessing first time: "i love hiking"')
    result1 = memory_system.process_conversation("i love hiking", "That's great!")
    after_first = len(memory_system.data["memory_engine"]["memory_events"])
    first_events_created = after_first - initial_count
    print(f'First input - Events created: {first_events_created}')
    
    print(f'Processing second time: "i love hiking" (duplicate)')
    result2 = memory_system.process_conversation("i love hiking", "Again!")
    after_second = len(memory_system.data["memory_engine"]["memory_events"])
    second_events_created = after_second - after_first
    print(f'Second input (duplicate) - Events created: {second_events_created}')
    
    print(f'\nResults:')
    print(f'  First input created events: {first_events_created > 0}')
    print(f'  Duplicate input created no new events: {second_events_created == 0}')
    print(f'  Duplicate detection working: {first_events_created > 0 and second_events_created == 0}')
    print(f'  Total after both: {after_second} events')
    
    # Check the created event (if any from first input)
    if first_events_created > 0:
        new_events = memory_system.data["memory_engine"]["memory_events"][initial_count:after_first]
        print(f'\nEvent created from first input:')
        for i, event in enumerate(new_events):
            print(f'  Event {i+1}: Type={event["type"]}, Cat={event["category"]}, Value={event["current_value"]}')

if __name__ == "__main__":
    test_duplicate_prevention()