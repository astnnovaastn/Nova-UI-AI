#!/usr/bin/env python3
"""
Comprehensive test to verify ADD functionality works in conversation processing.
"""

from astra_ai.memory.mem0_memory_system import AdvancedMemoryAgent

def test_conversation_add():
    """Test ADD functionality through conversation processing."""
    print("Testing ADD functionality through conversation processing...")
    
    # Create memory agent instance
    agent = AdvancedMemoryAgent(storage_file="test_conversation_memory.json")
    
    # Simulate a conversation that should trigger ADD events
    user_message = "I like watching anime during weekends"
    ai_response = "That sounds like a relaxing way to spend your weekends!"
    
    print(f"User message: '{user_message}'")
    
    # Process the conversation
    result = agent.process_conversation(user_message, ai_response)
    
    print(f"Memory operations performed: {result['memory_operations']}")
    
    # Check memory events in the system
    memory_events = agent.memory_system.data.get("memory_engine", {}).get("memory_events", [])
    
    add_events = [event for event in memory_events if isinstance(event, dict) and event.get("type") == "ADD"]
    
    print(f"Found {len(add_events)} ADD events in memory")
    
    if add_events:
        latest_add_event = add_events[-1]  # Get the most recent ADD event
        print("\nMost recent ADD event:")
        print(f"  Type: {latest_add_event.get('type')}")
        print(f"  Event ID: {latest_add_event.get('event_id')}")
        print(f"  Summary: {latest_add_event.get('summary')}")
        print(f"  Current value: {latest_add_event.get('current_value')}")
        print(f"  Category: {latest_add_event.get('category')}")
        print(f"  Subcategory: {latest_add_event.get('subcategory')}")
        print(f"  Timestamp: {latest_add_event.get('timestamp')}")
        print(f"  Added preference: {latest_add_event.get('Added_preference')}")
        
        # Verify the values
        assert latest_add_event.get('type') == 'ADD', f"Expected type 'ADD', got {latest_add_event.get('type')}"
        assert 'anime' in latest_add_event.get('current_value', '').lower(), "Expected 'anime' to be in current value"
        assert latest_add_event.get('Added_preference'), "Added_preference should not be empty"
        
        print("\n[SUCCESS] Conversation processing correctly created ADD event!")
        return True
    else:
        print("\n[ERROR] No ADD events found in memory after conversation processing")
        return False

if __name__ == "__main__":
    success = test_conversation_add()
    if success:
        print("\n[SUCCESS] Conversation ADD functionality test passed!")
    else:
        print("\n[ERROR] Conversation ADD functionality test failed!")
        exit(1)