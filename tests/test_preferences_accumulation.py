"""Test script to verify the personal preferences accumulation functionality."""

import json
import os
from datetime import datetime
from astra_ai.memory.mem0_memory_system import AdvancedMemoryAgent

def test_personal_preferences_accumulation():
    print("Testing personal preferences accumulation functionality...")
    
    # Create a temporary memory file for testing
    test_memory_file = "test_preferences_memory.json"
    
    # Initialize the memory agent
    agent = AdvancedMemoryAgent(test_memory_file)
    
    # Simulate conversation that adds multiple likes
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
    
    # Retrieve all accumulated preferences
    all_prefs = agent.get_accumulated_preferences()
    print(f"\nAll accumulated preferences: {json.dumps(all_prefs, indent=2)}")
    
    # Retrieve just likes
    likes = agent.get_accumulated_preferences('likes')
    print(f"\nAccumulated likes: {json.dumps(likes, indent=2)}")
    
    # Retrieve just dislikes
    dislikes = agent.get_accumulated_preferences('dislikes')
    print(f"\nAccumulated dislikes: {json.dumps(dislikes, indent=2)}")
    
    # Check that likes contain expected items (this might not work as expected due to pattern matching)
    likes_items = [item['item'] for item in likes.get('likes', [])]
    expected_likes = ['coffee', 'chocolate', 'tea']
    
    print(f"\nVerifying likes contain expected items...")
    for expected_like in expected_likes:
        if expected_like in likes_items:
            print(f"[OK] '{expected_like}' found in likes")
        else:
            print(f"[MISSING] '{expected_like}' NOT found in likes")
    
    # Check that dislikes contain expected items
    dislikes_items = [item['item'] for item in dislikes.get('dislikes', [])]
    expected_dislikes = ['spicy food', 'horror movies']
    
    print(f"\nVerifying dislikes contain expected items...")
    for expected_dislike in expected_dislikes:
        if expected_dislike in dislikes_items:
            print(f"[OK] '{expected_dislike}' found in dislikes")
        else:
            print(f"[MISSING] '{expected_dislike}' NOT found in dislikes")
    
    # Verify that timestamps are present
    print(f"\nVerifying timestamps are present...")
    for like_item in likes.get('likes', []):
        if 'added_at' in like_item:
            print(f"[OK] Timestamp found for '{like_item['item']}': {like_item['added_at']}")
        else:
            print(f"[MISSING] Timestamp missing for '{like_item['item']}'")
    
    for dislike_item in dislikes.get('dislikes', []):
        if 'added_at' in dislike_item:
            print(f"[OK] Timestamp found for '{dislike_item['item']}': {dislike_item['added_at']}")
        else:
            print(f"[MISSING] Timestamp missing for '{dislike_item['item']}'")
    
    # Test to make sure duplicates are not added
    print(f"\n6. Adding duplicate like: 'coffee' (should not be added again)")
    agent.process_conversation("I like coffee", "Noted that you like coffee.")
    
    # Check that there are still only the expected number of likes
    likes_after_duplicate = agent.get_accumulated_preferences('likes')
    likes_count_after = len(likes_after_duplicate.get('likes', []))
    print(f"Number of likes after adding duplicate: {likes_count_after}")
    
    if likes_count_after <= 3:  # May be fewer depending on pattern matching
        print("[OK] Duplicates are properly prevented or handled")
    else:
        print(f"[ERROR] Expected <=3 likes but found {likes_count_after}")
    
    # Test other preference categories
    print(f"\n7. Adding hobby: 'painting'")
    agent.process_conversation("I enjoy painting as a hobby", "Noted that you enjoy painting.")
    
    print(f"\n8. Adding interest: 'AI development'")
    agent.process_conversation("I'm interested in AI development", "Noted your interest in AI development.")
    
    hobbies = agent.get_accumulated_preferences('hobbies')
    interests = agent.get_accumulated_preferences('interests')
    
    print(f"Accumulated hobbies: {json.dumps(hobbies, indent=2)}")
    print(f"Accumulated interests: {json.dumps(interests, indent=2)}")
    
    print("\nTest completed! Check the preferences format and accumulation behavior.")
    
    # Also look at raw memory data to understand how preferences are stored
    raw_data = agent.memory_system.data
    current_facts = raw_data.get("current_facts", {})
    print(f"\nRaw current_facts: {json.dumps({k: v for k, v in current_facts.items() if 'preference' in k.lower()}, indent=2)}")
    
    # Clean up test file
    if os.path.exists(test_memory_file):
        os.remove(test_memory_file)

if __name__ == "__main__":
    test_personal_preferences_accumulation()