"""Definitive test of the fix without organizer."""

import json
import os
from astra_ai.memory.mem0_memory_system import NovaMemoryAI

def definitive_test():
    print("Definitive test - with modifications but without organizer...")
    
    # Create a temporary memory file for testing
    test_memory_file = "definitive_test.json"
    
    # Initialize the memory system directly
    memory_system = NovaMemoryAI(test_memory_file)
    
    # Disable organizer
    original_enabled = memory_system.organizer.organizer_enabled
    memory_system.organizer.organizer_enabled = False
    
    try:
        # Simulate conversation that adds multiple likes
        print("\n1. Adding first like: 'coffee'")
        memory_system.process_conversation("I like coffee", "Noted that you like coffee.")
        
        print("\n2. Adding second like: 'chocolate'")
        memory_system.process_conversation("I like chocolate", "Noted that you like chocolate.")
        
        print("\n3. Adding third like: 'tea'")
        memory_system.process_conversation("I also like tea", "Noted that you like tea.")
        
        print("\n4. Adding first dislike: 'spicy food'")
        memory_system.process_conversation("I don't like spicy food", "Noted that you dislike spicy food.")
        
        print("\n5. Adding second dislike: 'horror movies'")
        memory_system.process_conversation("I hate horror movies", "Noted that you hate horror movies.")
        
        # Retrieve all accumulated preferences
        all_prefs = memory_system.get_accumulated_preferences()
        print(f"\nAll accumulated preferences: {json.dumps(all_prefs, indent=2)}")
        
        # Check specific likes
        likes = memory_system.get_accumulated_preferences('likes')
        likes_items = [item['item'] for item in likes.get('likes', [])]
        expected_likes = ['coffee', 'chocolate', 'tea']
        
        print(f"\nLikes items: {likes_items}")
        print("Checking likes:")
        all_found = True
        for expected_like in expected_likes:
            if expected_like in likes_items:
                print(f"  OK '{expected_like}' found")
            else:
                print(f"  MISSING '{expected_like}' NOT found")
                all_found = False
        
        # Check specific dislikes
        dislikes = memory_system.get_accumulated_preferences('dislikes')
        dislikes_items = [item['item'] for item in dislikes.get('dislikes', [])]
        expected_dislikes = ['spicy food', 'horror movies']
        
        print(f"\nDislikes items: {dislikes_items}")
        print("Checking dislikes:")
        for expected_dislike in expected_dislikes:
            if expected_dislike in dislikes_items:
                print(f"  OK '{expected_dislike}' found")
            else:
                print(f"  MISSING '{expected_dislike}' NOT found")
                all_found = False
        
        if all_found:
            print("\n🎉 SUCCESS: All preferences extracted and accumulated correctly!")
        else:
            print("\n❌ Some preferences were not extracted correctly.")
            
        # Check memory events to see what happened
        print(f"\nMemory events:")
        for event in memory_system.data.get("memory_events", [])[-5:]:  # Last 5 events
            print(f"  - {event.get('summary', 'No summary')}")
    
    finally:
        memory_system.organizer.organizer_enabled = original_enabled
        # Clean up test file
        if os.path.exists(test_memory_file):
            os.remove(test_memory_file)

if __name__ == "__main__":
    definitive_test()