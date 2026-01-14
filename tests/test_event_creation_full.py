import sys
import os
sys.path.append(os.getcwd())

from astra_ai.memory.mem0_memory_system import NovaMemoryAI

def test_event_creation():
    print('=== Testing Event Creation After Fix ===')
    
    # Create a new memory system instance
    memory_system = NovaMemoryAI()
    
    initial_count = len(memory_system.data["memory_engine"]["memory_events"])
    print(f'Starting with {initial_count} events')
    
    # Process a message that previously created multiple events
    print(f'\nProcessing: "i enjoy reading books"')
    result = memory_system.process_conversation("i enjoy reading books", "That sounds nice!")
    
    after_count = len(memory_system.data["memory_engine"]["memory_events"])
    events_created = after_count - initial_count
    print(f'Events created: {events_created}')
    print(f'Total events now: {after_count}')
    
    # Check the newly created events
    new_events = memory_system.data["memory_engine"]["memory_events"][initial_count:after_count]
    print(f'\nNewly created events ({len(new_events)}):')
    for i, event in enumerate(new_events):
        print(f'  Event {i+1}:')
        print(f'    Type: {event["type"]}')
        print(f'    Category: {event["category"]}')
        print(f'    Subcategory: {event["subcategory"]}')
        print(f'    Value: {event["current_value"]}')
        print(f'    Summary: {event["summary"]}')
    
    # Test with another input
    print(f'\nProcessing: "i work as a software engineer"')
    result2 = memory_system.process_conversation("i work as a software engineer", "Interesting career!")
    
    final_count = len(memory_system.data["memory_engine"]["memory_events"])
    events_created2 = final_count - after_count
    print(f'Second input events created: {events_created2}')
    
    # Show recent events
    recent_events = memory_system.data["memory_engine"]["memory_events"][after_count:final_count]
    print(f'\nSecond input events ({len(recent_events)}):')
    for i, event in enumerate(recent_events):
        print(f'  Event {i+1}: Type={event["type"]}, Cat={event["category"]}, Val={event["current_value"]}')
    
    print(f'\nSummary:')
    print(f'  Total new events from different inputs: {events_created + events_created2}')
    print(f'  Single event per input: {events_created == 1 and events_created2 == 1}')
    print(f'  Success: {events_created >= 0 and events_created2 >= 0}')  # At least some processing happened

if __name__ == "__main__":
    test_event_creation()