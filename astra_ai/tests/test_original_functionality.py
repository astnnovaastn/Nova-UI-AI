import sys
import os
import json
sys.path.append(os.getcwd())

from astra_ai.memory.mem0_memory_system import NovaMemoryAI

def test_original_functionality():
    # Create a new memory system instance
    memory_system = NovaMemoryAI()

    print('=== Original Functionality Test ===')
    print('Initial memory events count:', len(memory_system.data["memory_engine"]["memory_events"]))

    # Test various different inputs to make sure they create separate events
    test_cases = [
        ("i like anime", "That's great!"),
        ("i enjoy hiking on weekends", "Sounds fun!"),
        ("my favorite color is blue", "Nice choice!"),
        ("i work at Google", "Great company!"),
        ("i live in California", "Beautiful state!"),
    ]
    
    for i, (user_msg, ai_resp) in enumerate(test_cases):
        print(f'\nTest {i+1}: {user_msg}')
        result = memory_system.process_conversation(user_msg, ai_resp)
        print(f'Result: {len(result["operations"])} operations created')
        print(f'Total events now: {len(memory_system.data["memory_engine"]["memory_events"])}')
        
    print(f'\nFinal memory events:')
    for i, event in enumerate(memory_system.data['memory_engine']['memory_events']):
        print(f'Event {i} - Type: {event["type"]}, Category: {event["category"]}, Subcategory: {event["subcategory"]}, Value: {event["current_value"]}')
    
    # Check the actual memory file
    print(f'\nChecking saved file...')
    try:
        with open("astra_ai/Date/nova_ai_memory.json", "r") as f:
            saved_data = json.load(f)
        print(f'Saved file has {len(saved_data["memory_engine"]["memory_events"])} events')
    except Exception as e:
        print(f'Error reading saved file: {e}')

if __name__ == "__main__":
    test_original_functionality()