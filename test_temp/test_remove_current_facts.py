"""
Test script to verify the removal of 'current_facts' while preserving 'fact_history'.
"""

import json
import os
from datetime import datetime
from astra_ai.memory.mem0_memory_system import AdvancedMemoryAgent


def create_sample_memory_data():
    """Create sample memory data with both 'current_facts' and 'fact_history'."""
    return {
        "user": {
            "user_id": "test_user_123",
            "name": "Test User",
            "created_at": "2025-10-15T10:30:00.000000",
            "status": "active",
            "total_sessions": 3,
            "last_seen": "2025-10-15T14:45:00.000000",
            "relationship_established": True
        },
        "memory_events": [
            {
                "type": "ADD",
                "summary": "Added user's name: Test User",
                "timestamp": "2025-10-15T10:30:00.000000",
                "confidence": 0.9
            },
            {
                "type": "ADD",
                "summary": "Added user's occupation: Software Engineer",
                "timestamp": "2025-10-15T10:35:00.000000",
                "confidence": 0.8
            }
        ],
        "conversation": [
            {
                "role": "user",
                "content": "Hi, I'm Test User",
                "timestamp": "2025-10-15T10:30:00.000000",
                "session_id": "session_abc123"
            },
            {
                "role": "assistant",
                "content": "Nice to meet you, Test User!",
                "timestamp": "2025-10-15T10:30:01.000000",
                "session_id": "session_abc123"
            }
        ],
        "current_facts": {
            "name": "Test User",
            "age": "30",
            "occupation": "Software Engineer",
            "location": "San Francisco",
            "interests": "Python, JavaScript, Machine Learning",
            "personal_preferences.likes": [
                {
                    "item": "coding",
                    "added_at": "2025-10-15T10:35:00.000000"
                },
                {
                    "item": "coffee",
                    "added_at": "2025-10-15T10:40:00.000000"
                }
            ],
            "personal_preferences.dislikes": [
                {
                    "item": "debugging",
                    "added_at": "2025-10-15T10:45:00.000000"
                }
            ]
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
            ],
            "occupation": [
                {
                    "value": "Junior Developer",
                    "timestamp": "2025-01-15T09:00:00.000000",
                    "status": "previous",
                    "confidence": 0.7
                },
                {
                    "value": "Software Engineer",
                    "timestamp": "2025-10-15T10:35:00.000000",
                    "status": "current",
                    "confidence": 0.8
                }
            ],
            "location": [
                {
                    "value": "San Francisco",
                    "timestamp": "2025-10-15T10:36:00.000000",
                    "status": "current",
                    "confidence": 0.85
                }
            ],
            "personal_preferences.likes": [
                {
                    "value": "[{'item': 'coding', 'added_at': '2025-10-15T10:35:00.000000'}]",
                    "timestamp": "2025-10-15T10:35:00.000000",
                    "status": "current",
                    "confidence": 0.8
                },
                {
                    "value": "[{'item': 'coffee', 'added_at': '2025-10-15T10:40:00.000000'}]",
                    "timestamp": "2025-10-15T10:40:00.000000",
                    "status": "current",
                    "confidence": 0.9
                }
            ],
            "personal_preferences.dislikes": [
                {
                    "value": "[{'item': 'debugging', 'added_at': '2025-10-15T10:45:00.000000'}]",
                    "timestamp": "2025-10-15T10:45:00.000000",
                    "status": "current",
                    "confidence": 0.7
                }
            ],
            "interests": [
                {
                    "value": "[{'item': 'Python', 'added_at': '2025-10-15T10:50:00.000000'}]",
                    "timestamp": "2025-10-15T10:50:00.000000",
                    "status": "current",
                    "confidence": 0.88
                },
                {
                    "value": "[{'item': 'JavaScript', 'added_at': '2025-10-15T10:51:00.000000'}]",
                    "timestamp": "2025-10-15T10:51:00.000000",
                    "status": "current",
                    "confidence": 0.85
                },
                {
                    "value": "[{'item': 'Machine Learning', 'added_at': '2025-10-15T10:52:00.000000'}]",
                    "timestamp": "2025-10-15T10:52:00.000000",
                    "status": "current",
                    "confidence": 0.9
                }
            ]
        },
        "sessions": {
            "session_abc123": {
                "session_id": "session_abc123",
                "start_time": "2025-10-15T10:30:00.000000",
                "end_time": "2025-10-15T11:00:00.000000",
                "message_count": 15,
                "topics_discussed": ["introduction", "work", "interests"],
                "user_name": "Test User",
                "session_duration": "30 minutes",
                "last_activity": "2025-10-15T11:00:00.000000"
            }
        },
        "current_session": None,
        "conversation_state": {
            "greeting_completed": True,
            "introduction_phase": False,
            "established_user": True
        }
    }


def test_remove_current_facts():
    """Test the removal of 'current_facts' while preserving 'fact_history'."""
    
    # Create a temporary memory file for testing
    temp_memory_file = "test_nova_ai_memory.json"
    
    try:
        # Create sample memory data
        sample_data = create_sample_memory_data()
        
        # Write the sample data to the temporary file
        with open(temp_memory_file, 'w', encoding='utf-8') as f:
            json.dump(sample_data, f, indent=2)
        
        print("Created sample memory data with both 'current_facts' and 'fact_history'")
        print(f"Initial data has {len(sample_data.get('current_facts', {}))} current facts")
        print(f"Initial data has {len(sample_data.get('fact_history', {}))} fact history entries")
        
        # Create AdvancedMemoryAgent with the test file
        agent = AdvancedMemoryAgent(temp_memory_file)
        
        # Verify initial state
        print("\n=== BEFORE TRANSFORMATION ===")
        print(f"'current_facts' exists: {'current_facts' in agent.memory_system.data}")
        print(f"'fact_history' exists: {'fact_history' in agent.memory_system.data}")
        
        if 'current_facts' in agent.memory_system.data:
            print(f"Number of current facts: {len(agent.memory_system.data['current_facts'])}")
            print("Sample current facts:")
            for key, value in list(agent.memory_system.data['current_facts'].items())[:3]:
                print(f"  {key}: {value}")
        
        if 'fact_history' in agent.memory_system.data:
            print(f"Number of fact history entries: {len(agent.memory_system.data['fact_history'])}")
            print("Sample fact history entries:")
            for key, value in list(agent.memory_system.data['fact_history'].items())[:3]:
                print(f"  {key}: {len(value) if isinstance(value, list) else 'N/A'} entries")
        
        # Test the dedicated remove_current_facts method
        print("\n=== TESTING DEDICATED REMOVE METHOD ===")
        result = agent.memory_system.remove_current_facts()
        print(f"Remove operation successful: {result}")
        
        # Verify state after removal
        print("\n=== AFTER REMOVAL ===")
        print(f"'current_facts' exists: {'current_facts' in agent.memory_system.data}")
        print(f"'fact_history' exists: {'fact_history' in agent.memory_system.data}")
        
        if 'fact_history' in agent.memory_system.data:
            print(f"Number of fact history entries: {len(agent.memory_system.data['fact_history'])}")
            print("Sample fact history entries:")
            for key, value in list(agent.memory_system.data['fact_history'].items())[:3]:
                print(f"  {key}: {len(value) if isinstance(value, list) else 'N/A'} entries")
        
        # Load the file to verify it was saved correctly
        with open(temp_memory_file, 'r', encoding='utf-8') as f:
            saved_data = json.load(f)
        
        print("\n=== FILE CONTENT VERIFICATION ===")
        print(f"'current_facts' exists in file: {'current_facts' in saved_data}")
        print(f"'fact_history' exists in file: {'fact_history' in saved_data}")
        
        if 'current_facts' in saved_data:
            print("FAIL: 'current_facts' still exists in the saved file!")
        else:
            print("SUCCESS: 'current_facts' has been removed from the file!")
        
        if 'fact_history' in saved_data:
            print("SUCCESS: 'fact_history' is preserved with {} entries!".format(len(saved_data['fact_history'])))
        else:
            print("FAIL: 'fact_history' was accidentally removed!")
        
        # Test the transform method as well
        print("\n=== TESTING TRANSFORM METHOD ===")
        # Recreate the sample data since we already removed current_facts
        with open(temp_memory_file, 'w', encoding='utf-8') as f:
            json.dump(create_sample_memory_data(), f, indent=2)
        
        # Reload the agent
        agent = AdvancedMemoryAgent(temp_memory_file)
        
        # Apply the transform method which should also remove current_facts
        transformed_data = agent.memory_system.transform_fact_history_to_unified_format()
        print("Transform method completed")
        print(f"Unified fact_history has {len(transformed_data)} top-level entries")
        
        # Check if personal_preferences section was created
        if "personal_preferences" in transformed_data:
            print("SUCCESS: Unified 'personal_preferences' section created")
            for pref_type, items in transformed_data["personal_preferences"].items():
                print(f"  {pref_type}: {len(items)} items")
        else:
            print("INFO: No personal_preferences section in transformed data")
        
        # Verify current_facts was removed
        print(f"'current_facts' exists after transform: {'current_facts' in agent.memory_system.data}")
        
        print("\n=== FINAL VERIFICATION ===")
        # Load the file again to verify final state
        with open(temp_memory_file, 'r', encoding='utf-8') as f:
            final_data = json.load(f)
        
        success = True
        if 'current_facts' in final_data:
            print("FAILURE: 'current_facts' still exists in final file")
            success = False
        else:
            print("SUCCESS: 'current_facts' successfully removed from final file")
        
        if 'fact_history' not in final_data:
            print("FAILURE: 'fact_history' was accidentally removed")
            success = False
        else:
            print("SUCCESS: 'fact_history' is preserved in final file")
        
        if success:
            print("\nALL TESTS PASSED! 'current_facts' successfully removed while preserving 'fact_history'")
        else:
            print("\nSOME TESTS FAILED!")
        
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
    print("Testing removal of 'current_facts' while preserving 'fact_history'")
    print("=" * 60)
    test_remove_current_facts()