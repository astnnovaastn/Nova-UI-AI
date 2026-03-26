import sys
import os
import json
sys.path.append(os.getcwd())

from astra_ai.memory.mem0_memory_system import NovaMemoryAI

def test_all_event_types():
    print('=== Testing All Event Types ===')
    
    # Create a new memory system instance
    memory_system = NovaMemoryAI()
    
    # Test creating ADD events
    print("\n1. Testing ADD event creation:")
    result1 = memory_system.process_conversation("i love pizza", "That's delicious!")
    print(f"   Created {len(result1['operations'])} operations")
    
    # Check the last few events to see their structure
    recent_events = memory_system.data["memory_engine"]["memory_events"][-2:]  # Get last 2 events
    for i, event in enumerate(recent_events):
        print(f"   Event {i+1}: type={event['type']}, semantic_context_type={type(event['semantic_context']).__name__}")
        print(f"               semantic_context='{event['semantic_context']}'")
        print(f"               Added_preference='{event.get('Added_preference', 'N/A')}'")
    
    # Now let's check the saved file to confirm format
    print(f"\n2. Checking saved file structure:")
    with open("astra_ai/Date/nova_ai_memory.json", "r") as f:
        saved_data = json.load(f)
    
    # Check the most recent events
    recent_saved_events = saved_data["memory_engine"]["memory_events"][-2:]
    for i, event in enumerate(recent_saved_events):
        print(f"   Saved Event {i+1}: type={event['type']}, semantic_context_type={type(event['semantic_context']).__name__}")
        print(f"                    semantic_context='{event['semantic_context']}'")
        print(f"                    Added_preference='{event.get('Added_preference', 'N/A')}'")

if __name__ == "__main__":
    test_all_event_types()