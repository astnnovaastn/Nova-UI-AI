"""Test without organizer to isolate the issue."""

import json
import os
from datetime import datetime
from astra_ai.memory.mem0_memory_system import NovaMemoryAI

def test_without_organizer():
    print("Testing without organizer interference...")
    
    # Create a temporary memory file for testing
    test_memory_file = "test_no_org.json"
    
    # Initialize the memory system directly
    memory_system = NovaMemoryAI(test_memory_file)
    
    # Disable organizer temporarily
    organizer_enabled = memory_system.organizer.organizer_enabled
    memory_system.organizer.organizer_enabled = False
    
    try:
        # Process a single message
        print(f"\nProcessing: 'I like coffee'")
        memory_system.process_conversation("I like coffee", "Noted.")
        
        # Check current facts
        current_facts = memory_system.data.get("current_facts", {})
        pref_facts = {k: v for k, v in current_facts.items() if 'preference' in k.lower()}
        print(f"Preference facts: {json.dumps(pref_facts, indent=2)}")
        
        # Process another
        print(f"\nProcessing: 'I hate horror movies'")
        memory_system.process_conversation("I hate horror movies", "Noted.")
        
        current_facts = memory_system.data.get("current_facts", {})
        pref_facts = {k: v for k, v in current_facts.items() if 'preference' in k.lower()}
        print(f"Preference facts after second: {json.dumps(pref_facts, indent=2)}")
        
        # Process third with don't like
        print(f"\nProcessing: 'I don't like spicy food'")
        memory_system.process_conversation("I don't like spicy food", "Noted.")
        
        current_facts = memory_system.data.get("current_facts", {})
        pref_facts = {k: v for k, v in current_facts.items() if 'preference' in k.lower()}
        print(f"Preference facts after third: {json.dumps(pref_facts, indent=2)}")
        
        # Now re-enable organizer and see what happens
        memory_system.organizer.organizer_enabled = True
        print(f"\nRe-enabling organizer and checking facts again:")
        current_facts = memory_system.data.get("current_facts", {})
        pref_facts = {k: v for k, v in current_facts.items() if 'preference' in k.lower()}
        print(f"Preference facts: {json.dumps(pref_facts, indent=2)}")
        
    finally:
        # Restore organizer
        memory_system.organizer.organizer_enabled = organizer_enabled
        # Clean up
        if os.path.exists(test_memory_file):
            os.remove(test_memory_file)

if __name__ == "__main__":
    test_without_organizer()