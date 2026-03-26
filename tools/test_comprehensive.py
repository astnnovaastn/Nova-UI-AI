import sys
import os
sys.path.append(os.getcwd())

from astra_ai.memory.mem0_memory_system import NovaMemoryAI
import json

def test_comprehensive():
    # Create a new memory system instance
    memory_system = NovaMemoryAI()

    print('=== Comprehensive Test ===')
    print('Initial memory events count:', len(memory_system.data["memory_engine"]["memory_events"]))

    # Test multiple types of information
    test_cases = [
        ("i enjoy reading science fiction novels", "Interesting!"),
        ("i work as a software engineer", "Great career choice!"),
        ("i live in New York", "Nice place!"),
        ("i hate waiting in long lines", "I understand!"),
    ]
    
    for i, (user_msg, ai_resp) in enumerate(test_cases):
        print(f'\nTest {i+1}: {user_msg}')
        result = memory_system.process_conversation(user_msg, ai_resp)
        print(f'Result: {len(result["operations"])} operations created')
        print(f'Total events now: {len(memory_system.data["memory_engine"]["memory_events"])}')
        
    print(f'\nFinal memory events:')
    for i, event in enumerate(memory_system.data['memory_engine']['memory_events']):
        print(f'Event {i} - Type: {event["type"]}, Summary: {event["summary"]}, Category: {event["category"]}')

if __name__ == "__main__":
    test_comprehensive()