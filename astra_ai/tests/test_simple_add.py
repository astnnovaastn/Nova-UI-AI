#!/usr/bin/env python3
"""
Simple test to verify the ADD type functionality works without the conversation processing issues.
"""

from astra_ai.memory.mem0_memory_system import NovaMemoryAI

def test_simple_add():
    """Test ADD functionality directly."""
    print("Testing simple ADD functionality...")
    
    # Create a memory system instance
    memory_system = NovaMemoryAI(storage_file="simple_test_memory.json")
    
    # Test creating an ADD event directly using the new method
    print("Creating ADD event directly...")
    add_event = memory_system._create_complete_add_event(
        user_id="test_user_123",
        text="I enjoy watching anime on weekends",
        session_id="session_456"
    )
    
    print(f"ADD event created successfully with ID: {add_event['event_id']}")
    
    # Verify required fields are present and have correct values
    assert add_event['type'] == 'ADD', f"Expected type 'ADD', got '{add_event['type']}'"
    assert 'evt_' in add_event['event_id'], f"Event ID should start with 'evt_', got '{add_event['event_id']}'"
    assert isinstance(add_event['timestamp'], str), f"Timestamp should be string, got {type(add_event['timestamp'])}"
    assert add_event['timestamp'].endswith('Z'), f"Timestamp should end with 'Z', got '{add_event['timestamp']}'"
    assert add_event['previous_value'] is None, f"previous_value should be None for ADD events, got {add_event['previous_value']}"
    assert add_event['current_value'] == "I enjoy watching anime on weekends", f"current_value incorrect"
    
    # Check emotional context structure
    ec = add_event['emotional_context']
    assert 'sentiment' in ec, "emotional_context missing sentiment"
    assert 'emotion_tags' in ec, "emotional_context missing emotion_tags"
    assert 'confidence' in ec, "emotional_context missing confidence"
    
    # Check provenance structure
    prov = add_event['provenance']
    assert 'enhanced_in_place' in prov, "provenance missing enhanced_in_place"
    assert 'source_info' in prov, "provenance missing source_info"
    assert 'source_conversation_timestamp' in prov, "provenance missing source_conversation_timestamp"
    
    print("\n[SUCCESS] All ADD event fields are correct and follow the required schema!")
    
    # Check that the event was added to memory events
    memory_events = memory_system.data.get("memory_events", [])
    add_events_in_memory = [event for event in memory_events if event.get('type') == 'ADD']
    
    assert len(add_events_in_memory) >= 1, "ADD event should be stored in memory"
    print(f"[SUCCESS] ADD event successfully stored in memory (total ADD events in memory: {len(add_events_in_memory)})")
    
    return True

if __name__ == "__main__":
    success = test_simple_add()
    if success:
        print("\n[SUCCESS] Simple ADD functionality test passed!")
    else:
        print("\n[ERROR] Simple ADD functionality test failed!")
        exit(1)