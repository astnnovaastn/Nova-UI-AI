"""Debug script to understand how fact extraction works."""

import json
import os
from datetime import datetime
from astra_ai.memory.mem0_memory_system import AdvancedMemoryAgent

def debug_fact_extraction():
    print("Debugging fact extraction process...")
    
    # Create a temporary memory file for testing
    test_memory_file = "debug_memory.json"
    
    # Initialize the memory agent
    agent = AdvancedMemoryAgent(test_memory_file)
    
    # Let's check what operations are generated for a simple "I like coffee" message
    print("\nProcessing: 'I like coffee'")
    result = agent.process_conversation("I like coffee", "Noted that you like coffee.")
    print(f"Operations result: {json.dumps(result, indent=2)}")
    
    # Check memory events
    memory_events = agent.memory_system.data.get("memory_events", [])
    print(f"\nMemory events: {json.dumps(memory_events[-3:], indent=2)}")  # Last 3 events
    
    # Check current facts
    current_facts = agent.memory_system.data.get("current_facts", {})
    pref_facts = {k: v for k, v in current_facts.items() if 'preference' in k.lower()}
    print(f"\nPreference facts: {json.dumps(pref_facts, indent=2)}")
    
    # Let's also test "I hate horror movies"
    print("\nProcessing: 'I hate horror movies'")
    result2 = agent.process_conversation("I hate horror movies", "Noted that you hate horror movies.")
    print(f"Operations result: {json.dumps(result2, indent=2)}")
    
    # Check current facts again
    current_facts = agent.memory_system.data.get("current_facts", {})
    pref_facts = {k: v for k, v in current_facts.items() if 'preference' in k.lower()}
    print(f"\nPreference facts after second message: {json.dumps(pref_facts, indent=2)}")
    
    # Check all current facts to see what's going on
    print(f"\nAll current facts: {json.dumps(current_facts, indent=2)}")
    
    # Clean up test file
    if os.path.exists(test_memory_file):
        os.remove(test_memory_file)

if __name__ == "__main__":
    debug_fact_extraction()