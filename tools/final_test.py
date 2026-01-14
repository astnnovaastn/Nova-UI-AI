import sys
import os
import json
sys.path.append(os.getcwd())

from astra_ai.memory.mem0_memory_system import NovaMemoryAI

def final_test():
    print('=== Final Integration Test ===')
    
    # Create memory system
    memory_system = NovaMemoryAI()
    
    print(f'Starting with {len(memory_system.data["memory_engine"]["memory_events"])} events')
    
    # Test a complex scenario that should create multiple related events
    conversation_pairs = [
        ("i really love playing video games", "That sounds fun! What types of games do you enjoy?"),
        ("my favorite games are RPGs and strategy games", "Great choices! What makes them your favorites?"),
        ("i usually play in the evening after work", "That's a good time to unwind!"),
    ]
    
    for user_msg, ai_resp in conversation_pairs:
        print(f"\nProcessing: {user_msg}")
        result = memory_system.process_conversation(user_msg, ai_resp)
        print(f"  Created {len(result['operations'])} operations, total events now: {len(memory_system.data['memory_engine']['memory_events'])}")
    
    print(f"\nFinal count: {len(memory_system.data['memory_engine']['memory_events'])} events")
    
    # Show some sample events to confirm proper structure
    print("\nSample of final events:")
    for i, event in enumerate(memory_system.data['memory_engine']['memory_events'][-5:]):  # Last 5 events
        print(f"  {i+len(memory_system.data['memory_engine']['memory_events'])-5}: Type={event['type']}, Cat={event['category']}, Value='{event['current_value'][:50]}...'")
    
    # Verify saved file
    with open("astra_ai/Date/nova_ai_memory.json", "r") as f:
        saved_data = json.load(f)
    
    print(f"\nSaved file verification:")
    print(f"  Total events in saved file: {len(saved_data['memory_engine']['memory_events'])}")
    print(f"  Memory events properly structured: {isinstance(saved_data['memory_engine']['memory_events'], list)}")
    print(f"  All events have required fields: {all('type' in event and 'event_id' in event for event in saved_data['memory_engine']['memory_events'][:3])}")

if __name__ == "__main__":
    final_test()