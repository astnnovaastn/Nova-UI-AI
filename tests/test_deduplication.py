import sys
import os
import tempfile
sys.path.append(os.getcwd())

from astra_ai.memory.mem0_memory_system import NovaMemoryAI
import json

def test_deduplication():
    # Create a new memory system instance with a temporary file to avoid conflicts
    temp_memory_file = "test_memory.json"
    
    # Remove file if it exists
    if os.path.exists(temp_memory_file):
        os.remove(temp_memory_file)
    
    memory_system = NovaMemoryAI(storage_file=temp_memory_file)

    print('=== Deduplication Test ===')
    print('Initial memory events count:', len(memory_system.data["memory_engine"]["memory_events"]))

    # Test creating the same event multiple times
    test_cases = [
        ("my name is Rich", "Nice to meet you Rich!"),
        ("my name is Rich", "Hello Rich again!"), # Duplicate
        ("i enjoy reading science fiction novels", "Interesting!"),
        ("i enjoy reading science fiction novels", "Great hobby!"), # Duplicate
        ("i work as a software engineer", "Cool job!"),
    ]
    
    for i, (user_msg, ai_resp) in enumerate(test_cases):
        print(f'\nTest {i+1}: {user_msg}')
        result = memory_system.process_conversation(user_msg, ai_resp)
        print(f'Result: {len(result["operations"])} operations created')
        print(f'Total events now: {len(memory_system.data["memory_engine"]["memory_events"])}')
        
    print(f'\nFinal memory events:')
    for i, event in enumerate(memory_system.data['memory_engine']['memory_events']):
        print(f'Event {i} - Type: {event["type"]}, Summary: {event["summary"]}, Category: {event["category"]}, Value: {event["current_value"]}')
    
    # Clean up
    if os.path.exists(temp_memory_file):
        os.remove(temp_memory_file)

if __name__ == "__main__":
    test_deduplication()