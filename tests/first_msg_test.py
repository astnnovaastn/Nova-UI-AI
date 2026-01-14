"""Test just the first message to isolate the issue."""

import json
import os
from astra_ai.memory.mem0_memory_system import NovaMemoryAI

def test_first_message_only():
    print("Test first message only...")
    
    # Create a temporary memory file for testing
    test_memory_file = "first_msg_only.json"
    
    # Initialize the memory system directly
    memory_system = NovaMemoryAI(test_memory_file)
    
    # Disable organizer completely for this test
    memory_system.organizer.organizer_enabled = False
    
    print("\nAdding first like: 'coffee' (same as in single test that worked)")
    memory_system.process_conversation("I like coffee", "Noted that you like coffee.")
    
    # Check results immediately
    all_prefs = memory_system.get_accumulated_preferences()
    print(f"\nAll accumulated preferences: {json.dumps(all_prefs, indent=2)}")
    
    # Check raw data
    print(f"\nRaw current_facts: {json.dumps(memory_system.data['current_facts'], indent=2)}")
    
    # Check memory events
    print(f"\nMemory events: {json.dumps(memory_system.data['memory_events'], indent=2)}")
    
    # Clean up
    if os.path.exists(test_memory_file):
        os.remove(test_memory_file)

if __name__ == "__main__":
    test_first_message_only()