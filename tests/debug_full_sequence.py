"""Debug script with full sequence from the test."""

import json
import os
from datetime import datetime
from astra_ai.memory.mem0_memory_system import AdvancedMemoryAgent

def debug_full_sequence():
    print("Debugging full sequence...")
    
    # Create a temporary memory file for testing
    test_memory_file = "debug_full_sequence.json"
    
    # Initialize the memory agent
    agent = AdvancedMemoryAgent(test_memory_file)
    
    # Simulate conversation that adds multiple likes exactly as in the test
    print("\n1. Adding first like: 'coffee'")
    agent.process_conversation("I like coffee", "Noted that you like coffee.")
    
    print("\n2. Adding second like: 'chocolate'")
    agent.process_conversation("I like chocolate", "Noted that you like chocolate.")
    
    print("\n3. Adding third like: 'tea'")
    agent.process_conversation("I also like tea", "Noted that you like tea.")
    
    print("\n4. Adding first dislike: 'spicy food'")
    agent.process_conversation("I don't like spicy food", "Noted that you dislike spicy food.")
    
    print("\n5. Adding second dislike: 'horror movies'")
    agent.process_conversation("I hate horror movies", "Noted that you hate horror movies.")
    
    # Check all current facts
    current_facts = agent.memory_system.data.get("current_facts", {})
    pref_facts = {k: v for k, v in current_facts.items() if 'preference' in k.lower()}
    print(f"\nPreference facts after all additions: {json.dumps(pref_facts, indent=2)}")
    
    # Now test the get_accumulated_preferences function
    all_prefs = agent.get_accumulated_preferences()
    print(f"\nAll accumulated preferences: {json.dumps(all_prefs, indent=2)}")
    
    # Retrieve just likes
    likes = agent.get_accumulated_preferences('likes')
    print(f"\nAccumulated likes: {json.dumps(likes, indent=2)}")
    
    # Extract items from likes
    likes_items = [item['item'] for item in likes.get('likes', [])]
    print(f"\nLike items: {likes_items}")
    
    # Clean up test file
    if os.path.exists(test_memory_file):
        os.remove(test_memory_file)

if __name__ == "__main__":
    debug_full_sequence()