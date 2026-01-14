"""
Simple test script to verify the removal of 'current_facts' while preserving 'fact_history'.
"""

import json
import os
from astra_ai.memory.mem0_memory_system import AdvancedMemoryAgent


def test_simple_remove_current_facts():
    """Simple test for removing 'current_facts'."""
    
    # Create a temporary memory file for testing
    temp_memory_file = "simple_test_memory.json"
    
    try:
        # Create sample memory data with both 'current_facts' and 'fact_history'
        sample_data = {
            "user": {
                "user_id": "test_user_123",
                "name": "Test User"
            },
            "memory_events": [],
            "conversation": [],
            "current_facts": {
                "name": "Test User",
                "age": "30",
                "occupation": "Software Engineer"
            },
            "fact_history": {
                "name": [
                    {
                        "value": "Test User",
                        "timestamp": "2025-10-15T10:30:00.000000",
                        "status": "current",
                        "confidence": 0.9
                    }
                ],
                "age": [
                    {
                        "value": "29",
                        "timestamp": "2025-10-10T10:00:00.000000",
                        "status": "previous",
                        "confidence": 0.8
                    },
                    {
                        "value": "30",
                        "timestamp": "2025-10-15T10:30:00.000000",
                        "status": "current",
                        "confidence": 0.9
                    }
                ]
            },
            "sessions": {},
            "current_session": None,
            "conversation_state": {}
        }
        
        # Write the sample data to the temporary file
        with open(temp_memory_file, 'w', encoding='utf-8') as f:
            json.dump(sample_data, f, indent=2)
        
        print("Created sample memory data")
        print(f"Initial data has {len(sample_data.get('current_facts', {}))} current facts")
        print(f"Initial data has {len(sample_data.get('fact_history', {}))} fact history entries")
        
        # Create AdvancedMemoryAgent with the test file
        agent = AdvancedMemoryAgent(temp_memory_file)
        
        # Verify initial state
        print("\n=== BEFORE TRANSFORMATION ===")
        print(f"'current_facts' exists: {'current_facts' in agent.memory_system.data}")
        print(f"'fact_history' exists: {'fact_history' in agent.memory_system.data}")
        
        # Test the dedicated remove_current_facts method
        print("\n=== TESTING REMOVE METHOD ===")
        result = agent.memory_system.remove_current_facts()
        print(f"Remove operation successful: {result}")
        
        # Verify state after removal
        print("\n=== AFTER REMOVAL ===")
        print(f"'current_facts' exists: {'current_facts' in agent.memory_system.data}")
        print(f"'fact_history' exists: {'fact_history' in agent.memory_system.data}")
        
        if 'fact_history' in agent.memory_system.data:
            print(f"Number of fact history entries: {len(agent.memory_system.data['fact_history'])}")
        
        # Load the file to verify it was saved correctly
        with open(temp_memory_file, 'r', encoding='utf-8') as f:
            saved_data = json.load(f)
        
        print("\n=== FILE CONTENT VERIFICATION ===")
        current_facts_exists = 'current_facts' in saved_data
        fact_history_exists = 'fact_history' in saved_data
        print(f"'current_facts' exists in file: {current_facts_exists}")
        print(f"'fact_history' exists in file: {fact_history_exists}")
        
        success = True
        if current_facts_exists:
            print("FAIL: 'current_facts' still exists in the saved file!")
            success = False
        else:
            print("SUCCESS: 'current_facts' has been removed from the file!")
        
        if not fact_history_exists:
            print("FAIL: 'fact_history' was accidentally removed!")
            success = False
        else:
            print("SUCCESS: 'fact_history' is preserved in the file!")
            print(f"Number of fact history entries: {len(saved_data['fact_history'])}")
        
        if success:
            print("\nTEST PASSED! 'current_facts' successfully removed while preserving 'fact_history'")
        else:
            print("\nTEST FAILED!")
        
        return success
        
    except Exception as e:
        print(f"ERROR during test: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        # Clean up the test file
        if os.path.exists(temp_memory_file):
            os.remove(temp_memory_file)
            print(f"\nCleaned up test file: {temp_memory_file}")


if __name__ == "__main__":
    print("Simple test for removing 'current_facts' while preserving 'fact_history'")
    print("=" * 60)
    test_simple_remove_current_facts()