#!/usr/bin/env python3
"""
Final integration test to ensure the fix works in the complete system.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from astra_ai.memory.mem0_memory_system import NovaMemoryAI

def test_integration():
    """Test that the memory system works correctly with the new method."""
    print("Running final integration test...")
    print("="*50)
    
    try:
        # Create a memory AI instance
        memory_ai = NovaMemoryAI("integration_test.json")
        print("Created NovaMemoryAI instance successfully")
        
        # Check that the method exists
        if hasattr(memory_ai, 'remove_duplicate_memory_events'):
            print("remove_duplicate_memory_events method exists")
        else:
            print("remove_duplicate_memory_events method missing")
            return False
        
        # Test that save_memory method works without errors
        try:
            memory_ai.save_memory()
            print("save_memory method works without errors")
        except Exception as e:
            print(f"save_memory method failed: {e}")
            return False
            
        # Check that the method removes duplicates as expected
        # Add some test events with duplicates
        original_events = [
            {"event_id": "evt_abc123", "type": "ADD", "summary": "Test event", "timestamp": "2023-01-01T00:00:00Z"},
            {"event_id": "evt_def456", "type": "ADD", "summary": "Test event 2", "timestamp": "2023-01-01T00:01:00Z"},
            {"event_id": "evt_abc123", "type": "ADD", "summary": "Duplicate event", "timestamp": "2023-01-01T00:02:00Z"},  # Duplicate
        ]
        
        memory_ai.data["memory_engine"]["memory_events"] = original_events
        print(f"Before deduplication: {len(memory_ai.data['memory_engine']['memory_events'])} events")
        
        # Run duplicate removal
        removed_count = memory_ai.remove_duplicate_memory_events()
        print(f"Removed {removed_count} duplicate events")
        
        final_count = len(memory_ai.data["memory_engine"]["memory_events"])
        print(f"After deduplication: {final_count} events")
        
        if final_count == 2 and removed_count == 1:
            print("Deduplication worked correctly")
            
            # Verify no duplicate IDs remain
            event_ids = [event["event_id"] for event in memory_ai.data["memory_engine"]["memory_events"]]
            if len(event_ids) == len(set(event_ids)):
                print("No duplicate IDs remain")
            else:
                print("Duplicate IDs still exist")
                return False
        else:
            print(f"Expected 2 events after deduplication, got {final_count}")
            return False
        
        # Test save/load cycle
        memory_ai.save_memory()
        
        # Create new instance and load to verify persistence
        memory_ai2 = NovaMemoryAI("integration_test.json")
        if len(memory_ai2.data["memory_engine"]["memory_events"]) == 2:
            print("Data persisted correctly through save/load cycle")
        else:
            print("Data not persisted correctly")
            return False
            
        print("\nINTEGRATION TEST PASSED!")
        print("The fix is working correctly in the complete system.")
        return True
        
    except Exception as e:
        print(f"Integration test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_integration()
    
    if success:
        print("\n✨ ALL SYSTEM TESTS PASSED!")
    else:
        print("\n💥 SYSTEM TESTS FAILED!")
    
    sys.exit(0 if success else 1)