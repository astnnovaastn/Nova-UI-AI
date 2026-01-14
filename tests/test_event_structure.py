import sys
import os
import json
sys.path.append(os.getcwd())

from astra_ai.memory.mem0_memory_system import NovaMemoryAI

def test_event_structure():
    print('=== Testing Event Structure ===')
    
    # Create a temporary memory file to avoid conflicts
    temp_file = 'temp_test_memory.json'
    if os.path.exists(temp_file):
        os.remove(temp_file)
        
    memory_system = NovaMemoryAI(storage_file=temp_file)
    
    # Process a simple message to create an ADD event
    result = memory_system.process_conversation("i enjoy reading books", "That's a great hobby!")
    
    print(f"Created {len(result['operations'])} operations")
    
    # Check the event structure in memory
    if memory_system.data["memory_engine"]["memory_events"]:
        event = memory_system.data["memory_engine"]["memory_events"][-1]  # Get the last created event
        print(f"Event type: {event['type']}")
        print(f"Semantic context type: {type(event['semantic_context'])}")
        print(f"Semantic context value: {event['semantic_context']}")
        print(f"Event structure: {json.dumps(event, indent=2)}")
    else:
        print("No events created")
        
    # Clean up
    if os.path.exists(temp_file):
        os.remove(temp_file)

if __name__ == "__main__":
    test_event_structure()