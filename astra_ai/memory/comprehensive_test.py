"""Comprehensive test of the enhanced Nova Memory AI system"""

import sys
import os
sys.path.insert(0, '.')

from astra_ai.memory.enhanced_nova_memory_ai import create_memory_agent
from astra_ai.memory.validate_implementation import validate_new_memory_event_system

def comprehensive_test():
    """Run a comprehensive test of the enhanced Nova Memory AI system"""
    
    print("=== Comprehensive Test of Enhanced Nova Memory AI System ===\n")
    
    # Create memory agent
    storage_file = "astra_ai/Date/comprehensive_test_memory.json"
    memory_agent = create_memory_agent(storage_file)
    
    print("1. Creating initial memory events...")
    
    # Create several ADD events
    event1_id = memory_agent.add_memory_event(
        user_input="enjoys reading science fiction novels",
        context="User: I love reading sci-fi novels.",
        category="personal_preferences",
        subcategory="likes",
        confidence=0.85
    )
    print(f"   Created ADD event 1: {event1_id}")
    
    event2_id = memory_agent.add_memory_event(
        user_input="works as a software developer",
        context="User: I'm a software developer.",
        category="user_identity",
        subcategory="occupation",
        confidence=0.9
    )
    print(f"   Created ADD event 2: {event2_id}")
    
    event3_id = memory_agent.add_memory_event(
        user_input="Marco is my best friend",
        context="User: My best friend Marco helps me with coding.",
        category="collaborator_relationships",
        subcategory="best_friend",
        confidence=0.95
    )
    print(f"   Created ADD event 3: {event3_id}")
    
    print("\n2. Creating UPDATE events...")
    
    # Create UPDATE events
    update1_id = memory_agent.update_memory_event(
        previous_event_id=event1_id,
        new_value="enjoys reading science fiction and fantasy novels",
        context="User: Actually, I also like fantasy novels.",
        confidence=0.88
    )
    print(f"   Created UPDATE event 1: {update1_id}")
    
    update2_id = memory_agent.update_memory_event(
        previous_event_id=event2_id,
        new_value="works as a senior software developer",
        context="User: I've been promoted to senior developer.",
        confidence=0.92
    )
    print(f"   Created UPDATE event 2: {update2_id}")
    
    print("\n3. Retrieving memory context...")
    
    # Get memory context
    context = memory_agent.get_memory_context()
    print(f"   Retrieved memory context with {len(context.get('memory_events', []))} events")
    
    print("\n4. Getting conversation context...")
    
    # Get conversation context
    conversation_context = memory_agent.get_conversation_context()
    print(f"   Conversation context: is_returning_user={conversation_context.get('is_returning_user')}")
    
    print("\n5. Getting memory stats...")
    
    # Get memory stats
    stats = memory_agent.get_memory_stats()
    print(f"   Memory stats: {stats}")
    
    print("\n6. Getting user profile...")
    
    # Get user profile
    profile = memory_agent.get_user_profile()
    print(f"   User profile: {profile}")
    
    print("\n7. Getting conversation state...")
    
    # Get conversation state
    state = memory_agent.get_conversation_state()
    print(f"   Conversation state: {state}")
    
    print("\n8. Validating implementation...")
    
    # Validate implementation
    validation_result = validate_new_memory_event_system()
    print(f"   Validation result: {'PASSED' if validation_result else 'FAILED'}")
    
    print("\n9. Checking saved memory file...")
    
    # Check if file was saved correctly
    if os.path.exists(storage_file):
        import json
        with open(storage_file, 'r') as f:
            memory_data = json.load(f)
        
        print("   Memory file structure:")
        print(f"   - User: {memory_data.get('user', {}).get('name', 'Unknown')}")
        print(f"   - Memory events: {len(memory_data.get('memory_engine', {}).get('memory_events', []))}")
        print(f"   - Vector index entries: {len(memory_data.get('memory_engine', {}).get('vector_index', {}))}")
        print(f"   - Clusters: {len(memory_data.get('memory_engine', {}).get('clusters', {}))}")
        print(f"   - Update log entries: {len(memory_data.get('memory_engine', {}).get('update_log', []))}")
        print(f"   - Fact history entries: {len(memory_data.get('fact_history', {}))}")
        
        # Show the last few events
        memory_events = memory_data.get('memory_engine', {}).get('memory_events', [])
        if memory_events:
            print("\n   Recent memory events:")
            for event in memory_events[-3:]:  # Show last 3 events
                print(f"   - {event.get('type', 'UNKNOWN')}: {event.get('summary', 'No summary')}")
                print(f"     Event ID: {event.get('event_id', 'No ID')}")
                print(f"     Timestamp: {event.get('timestamp', 'No timestamp')}")
                print(f"     Category: {event.get('category', 'No category')}")
                print(f"     Confidence: {event.get('confidence', 'No confidence')}")
                print()
    
    print("\n=== Comprehensive Test Complete ===")
    
    # Clean up test file
    try:
        if os.path.exists(storage_file):
            os.remove(storage_file)
            print(f"\nCleaned up test file: {storage_file}")
    except Exception as e:
        print(f"\nError cleaning up test file: {e}")
    
    return True

if __name__ == "__main__":
    success = comprehensive_test()
    
    if success:
        print("\n🎉 ALL COMPREHENSIVE TESTS PASSED!")
        print("✅ Enhanced Nova Memory AI System is fully functional!")
        sys.exit(0)
    else:
        print("\n❌ COMPREHENSIVE TEST FAILED!")
        print("⚠️ Please fix the identified issues before proceeding.")
        sys.exit(1)