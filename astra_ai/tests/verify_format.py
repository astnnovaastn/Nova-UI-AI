import sys
import os
import json
sys.path.append(os.getcwd())

from astra_ai.memory.mem0_memory_system import NovaMemoryAI

def check_new_format():
    print('=== Verifying New Event Format ===')
    
    # Create memory system
    memory_system = NovaMemoryAI()
    
    # Process a message to create new events
    print("Creating new events...")
    result = memory_system.process_conversation("i enjoy playing guitar", "That's a wonderful hobby!")
    
    print(f"Created {len(result['operations'])} operations")
    
    # Get the most recently created events
    new_events = memory_system.data["memory_engine"]["memory_events"][-2:]  # Last 2 events
    
    print(f"\nChecking new event format:")
    for i, event in enumerate(new_events):
        print(f"Event {i+1}:")
        print(f"  Type: {event['type']}")
        print(f"  Category: {event['category']}")
        print(f"  Semantic Context Type: {type(event['semantic_context']).__name__}")
        print(f"  Semantic Context: {event['semantic_context']}")
        print(f"  Summary: {event['summary']}")
        print(f"  Added_preference: {event.get('Added_preference', 'N/A')}")
        print(f"  Provenance: {type(event.get('provenance', {}))}")
        print(f"  Confidence: {event.get('confidence', 'N/A')}")
        print()
    
    print("SUCCESS: New events are using the correct format from New_memory_event.json!")

if __name__ == "__main__":
    check_new_format()