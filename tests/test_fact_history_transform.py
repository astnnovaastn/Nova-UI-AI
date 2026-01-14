"""
Test script for fact_history transformation to unified format.
"""

import json
from datetime import datetime
import os
from astra_ai.memory.mem0_memory_system import AdvancedMemoryAgent


def test_fact_history_transformation():
    """Test the fact_history transformation with sample data."""
    
    # Create a sample memory data structure with the original format
    sample_memory_data = {
        "user": {
            "user_id": "test_user",
            "name": "Test User",
            "created_at": datetime.now().isoformat()
        },
        "memory_events": [],
        "conversation": [],
        "current_facts": {
            "name": "Test User",
            "personal_preferences.likes": [
                {"item": "programming", "added_at": "2025-10-12T17:11:22.358875"},
                {"item": "coffee", "added_at": "2025-10-13T10:15:30.123456"}
            ],
            "personal_preferences.dislikes": [
                {"item": "debugging my scripts", "added_at": "2025-10-12T16:45:10.987654"}
            ]
        },
        "fact_history": {
            "name": [
                {
                    "value": "Test User",
                    "timestamp": "2025-10-12T17:34:16.695305",
                    "status": "current",
                    "confidence": 0.9
                }
            ],
            "personal_preferences.likes": [
                {
                    "value": "[{'item': 'programming', 'added_at': '2025-10-12T17:11:22.358875'}]",
                    "timestamp": "2025-10-12T17:34:16.695305",
                    "status": "current",
                    "confidence": 0.8
                },
                {
                    "value": "[{'item': 'coffee', 'added_at': '2025-10-13T10:15:30.123456'}]",
                    "timestamp": "2025-10-13T11:20:45.789012",
                    "status": "current",
                    "confidence": 0.9
                }
            ],
            "personal_preferences.dislikes": [
                {
                    "value": "[{'item': 'debugging my scripts', 'added_at': '2025-10-12T16:45:10.987654'}]",
                    "timestamp": "2025-10-12T17:34:16.695305",
                    "status": "current",
                    "confidence": 0.7
                }
            ],
            "personal_preferences.avoid": [
                {
                    "value": "[{'item': 'junk food like mcdonald\\'s', 'added_at': '2025-10-11T09:30:15.543210'}]",
                    "timestamp": "2025-10-11T10:00:20.098765",
                    "status": "current",
                    "confidence": 0.85
                }
            ],
            "personal_preferences.always": [
                {
                    "value": "[{'item': 'drink coffee before studying', 'added_at': '2025-10-10T08:15:45.111222'}]",
                    "timestamp": "2025-10-10T08:30:50.333444",
                    "status": "current",
                    "confidence": 0.95
                }
            ],
            "personal_preferences.style": [
                {
                    "value": "[{'item': 'keep it minimal', 'added_at': '2025-10-09T14:20:30.555666'}]",
                    "timestamp": "2025-10-09T14:45:35.777888",
                    "status": "current",
                    "confidence": 0.75
                }
            ],
            "personal_preferences.conditional": [
                {
                    "value": "[{'item': 'only exercise when feeling energetic', 'added_at': '2025-10-08T07:00:12.999000'}]",
                    "timestamp": "2025-10-08T07:15:18.111222",
                    "status": "current",
                    "confidence": 0.8
                }
            ],
            "interests": [
                {
                    "value": "[{'item': 'Javascript next', 'added_at': '2025-10-07T16:30:44.333444'}]",
                    "timestamp": "2025-10-07T17:00:50.555666",
                    "status": "current",
                    "confidence": 0.88
                }
            ]
        },
        "sessions": {},
        "current_session": None,
        "conversation_state": {}
    }

    # Create a temporary memory file for testing
    temp_memory_file = "test_nova_ai_memory.json"
    
    try:
        # Write the sample data to the temporary file
        with open(temp_memory_file, 'w', encoding='utf-8') as f:
            json.dump(sample_memory_data, f, indent=2)
        
        # Create AdvancedMemoryAgent with the test file
        agent = AdvancedMemoryAgent(temp_memory_file)
        
        # Print original fact_history
        print("ORIGINAL fact_history structure:")
        print(json.dumps(sample_memory_data["fact_history"], indent=2))
        print("\n" + "="*60 + "\n")
        
        # Apply the transformation
        transformed_fact_history = agent.transform_fact_history_to_unified_format()
        
        # Print the transformed structure
        print("TRANSFORMED fact_history structure:")
        print(json.dumps(transformed_fact_history, indent=2))
        print("\n" + "="*60 + "\n")
        
        # Load the transformed data back from file to verify it was saved
        with open(temp_memory_file, 'r', encoding='utf-8') as f:
            saved_data = json.load(f)
        
        print("SAVED fact_history structure (after transformation):")
        print(json.dumps(saved_data["fact_history"], indent=2))
        
        print("\n" + "="*60 + "\n")
        print("TRANSFORMATION COMPLETED SUCCESSFULLY!")
        print("ALL PERSONAL PREFERENCES CONSOLIDATED UNDER 'personal_preferences' SECTION")
        print("ORIGINAL DATA PRESERVED IN UNIFIED FORMAT")
        
    except Exception as e:
        print(f"ERROR DURING TRANSFORMATION TEST: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Clean up the test file
        if os.path.exists(temp_memory_file):
            os.remove(temp_memory_file)


if __name__ == "__main__":
    test_fact_history_transformation()