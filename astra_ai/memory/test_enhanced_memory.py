"""Test script for the enhanced Nova Memory AI system"""

import sys
import os
sys.path.insert(0, '.')

from astra_ai.memory.enhanced_nova_memory_ai import EnhancedNovaMemoryAI, create_memory_agent

def test_enhanced_memory_system():
    """Test the enhanced Nova Memory AI system"""
    print("=== Testing Enhanced Nova Memory AI System ===\n")
    
    # Create memory agent
    storage_file = "astra_ai/Date/test_enhanced_memory.json"
    memory_agent = create_memory_agent(storage_file)
    
    print("1. Creating test memory events...")
    
    # Create an ADD event
    add_event_id = memory_agent.add_memory_event(
        user_input="enjoys reading science fiction novels",
        context="User: I love reading sci-fi novels.",
        category="personal_preferences",
        subcategory="likes",
        confidence=0.85
    )
    
    print(f"   Created ADD event with ID: {add_event_id}")
    
    # Create an UPDATE event
    update_event_id = memory_agent.update_memory_event(
        previous_event_id=add_event_id,
        new_value="enjoys reading science fiction and fantasy novels",
        context="User: Actually, I also like fantasy novels.",
        confidence=0.88
    )
    
    print(f"   Created UPDATE event with ID: {update_event_id}")
    
    print("\n2. Retrieving memory context...")
    
    # Get memory context
    context = memory_agent.get_memory_context()
    print(f"   Memory context retrieved successfully")
    
    print("\n3. Testing conversation context...")
    
    # Test conversation context
    conversation_context = memory_agent.get_conversation_context()
    print(f"   Conversation context: {conversation_context}")
    
    print("\n4. Testing memory stats...")
    
    # Test memory stats
    stats = memory_agent.get_memory_stats()
    print(f"   Memory stats: {stats}")
    
    print("\n=== Test Complete ===")
    
    # Clean up test file
    try:
        if os.path.exists(storage_file):
            os.remove(storage_file)
            print(f"\nCleaned up test file: {storage_file}")
    except Exception as e:
        print(f"\nError cleaning up test file: {e}")

if __name__ == "__main__":
    test_enhanced_memory_system()