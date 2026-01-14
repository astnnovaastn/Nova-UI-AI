#!/usr/bin/env python3
"""
Test script to verify the remove_duplicate_memory_events method is working correctly.
"""

import sys
import os
import json
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from astra_ai.memory.mem0_memory_system import NovaMemoryAI

def test_remove_duplicate_memory_events():
    """Test that the remove_duplicate_memory_events method works properly."""
    print("Testing remove_duplicate_memory_events method implementation...")
    print("-" * 60)
    
    # Create a NovaMemoryAI instance
    memory_ai = NovaMemoryAI("test_dup_removal.json")
    
    # Verify the method exists
    if not hasattr(memory_ai, 'remove_duplicate_memory_events'):
        print("ERROR: remove_duplicate_memory_events method does not exist")
        return False
    
    print("Method exists")
    
    # Verify the method is callable
    if not callable(getattr(memory_ai, 'remove_duplicate_memory_events')):
        print("ERROR: remove_duplicate_memory_events method is not callable")
        return False
    
    print("Method is callable")
    
    # Test with sample data containing duplicates
    # First, set up some test data with duplicate events
    test_memory_events = [
        {
            "event_id": "evt_abc123",
            "type": "ADD",
            "summary": "User likes programming",
            "timestamp": "2023-01-01T00:00:00Z",
            "category": "personal_preferences",
            "subcategory": "likes"
        },
        {
            "event_id": "evt_def456", 
            "type": "ADD",
            "summary": "User enjoys anime",
            "timestamp": "2023-01-01T00:01:00Z",
            "category": "personal_preferences", 
            "subcategory": "entertainment"
        },
        {
            "event_id": "evt_abc123",  # Duplicate of first event
            "type": "ADD",
            "summary": "User loves programming",
            "timestamp": "2023-01-01T00:02:00Z", 
            "category": "personal_preferences",
            "subcategory": "likes"
        },
        {
            "event_id": "evt_ghi789",
            "type": "UPDATE", 
            "summary": "Updated user's job status",
            "timestamp": "2023-01-01T00:03:00Z",
            "category": "current_state",
            "subcategory": "employment"
        },
        {
            "event_id": "evt_def456",  # Duplicate of second event
            "type": "ADD",
            "summary": "User loves anime",
            "timestamp": "2023-01-01T00:04:00Z",
            "category": "personal_preferences",
            "subcategory": "entertainment"
        }
    ]
    
    # Set up the memory engine with the test events
    if "memory_engine" not in memory_ai.data:
        memory_ai.data["memory_engine"] = {}
    
    memory_ai.data["memory_engine"]["memory_events"] = test_memory_events
    
    print(f"Initially: {len(test_memory_events)} memory events in data")
    
    # Test the method
    try:
        removed_count = memory_ai.remove_duplicate_memory_events()
        print(f"Method executed successfully")
        print(f"Removed {removed_count} duplicate events")
    except Exception as e:
        print(f"ERROR: Method execution failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Check the results
    final_events = memory_ai.data["memory_engine"]["memory_events"]
    print(f"Finally: {len(final_events)} memory events remain")
    
    # Verify the count is correct (should be 3 unique events after removing 2 duplicates)
    if len(final_events) != 3:
        print(f"ERROR: Expected 3 events after removing duplicates, but got {len(final_events)}")
        print("Event IDs in final list:")
        for event in final_events:
            print(f"  - {event.get('event_id', 'NO_ID')}")
        return False
    
    print("Correct number of events after deduplication")
    
    # Check that only unique event IDs remain
    final_event_ids = [event["event_id"] for event in final_events]
    unique_event_ids = set(final_event_ids)
    
    if len(final_event_ids) != len(unique_event_ids):
        print(f"ERROR: Duplicates still exist in final events: {final_event_ids}")
        return False
    
    print("No duplicate event IDs found in final list")
    
    # Verify the right events survived (first occurrence should be kept)
    expected_ids = {"evt_abc123", "evt_def456", "evt_ghi789"}
    actual_ids = set(final_event_ids)
    
    if expected_ids != actual_ids:
        print(f"ERROR: Expected IDs {expected_ids}, but got {actual_ids}")
        return False
    
    print("Correct events remained after deduplication")
    
    # Test method when there are no duplicates
    memory_ai.data["memory_engine"]["memory_events"] = [
        {
            "event_id": "evt_unique1",
            "type": "ADD",
            "summary": "Unique event 1",
            "timestamp": "2023-01-01T00:00:00Z"
        },
        {
            "event_id": "evt_unique2",
            "type": "UPDATE",
            "summary": "Unique event 2",
            "timestamp": "2023-01-01T00:01:00Z"
        }
    ]
    
    removed_count = memory_ai.remove_duplicate_memory_events()
    if removed_count != 0:
        print(f"ERROR: Method should return 0 when no duplicates exist, but returned {removed_count}")
        return False
    
    print("Method correctly returns 0 when no duplicates exist")
    
    # Test with empty events
    memory_ai.data["memory_engine"]["memory_events"] = []
    removed_count = memory_ai.remove_duplicate_memory_events()
    if removed_count != 0:
        print(f"ERROR: Method should return 0 when no events exist, but returned {removed_count}")
        return False
    
    print("Method correctly handles empty event list")
    
    print("\n" + "="*60)
    print("ALL TESTS PASSED! The remove_duplicate_memory_events method is working correctly!")
    print("="*60)
    return True

if __name__ == "__main__":
    success = test_remove_duplicate_memory_events()
    
    if not success:
        print("\nTESTS FAILED!")
        sys.exit(1)
    else:
        print("\nTESTS PASSED!")
        sys.exit(0)