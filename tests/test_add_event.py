#!/usr/bin/env python3
"""
Test script for ADD event processing with the new rewrite function.
"""

import sys
import os

# Add project root to path
project_root = 'C:/Users/afian/OneDrive/Desktop/Astra_ai'
sys.path.append(project_root)

def test_add_event_processing():
    """Test that ADD events are automatically processed with the rewrite function."""
    print("Testing ADD event processing...")
    
    # Import the module
    from astra_ai.memory import Mem0_ai_organizer
    import json
    
    # Create a test organizer instance
    config = {
        'organizer_enabled': False,
        'memory_file_path': os.path.join(project_root, 'test_memory.json'),
        'check_interval': 1.0,
        'llm_enabled': False
    }
    
    organizer = Mem0_ai_organizer.AIOrganizer(config)
    
    # Create test memory data with an ADD event
    test_memory_data = {
        'memory_events': [
            {
                'type': 'ADD',
                'summary': 'Nemzz said: I like anime a lot',
                'timestamp': '2023-01-01T12:00:00',
                'category': 'personal_preferences'
            }
        ],
        'conversation': [
            {
                'role': 'user',
                'content': 'I really enjoy watching anime series, especially ones with complex storylines',
                'timestamp': '2023-01-01T12:00:00'
            }
        ],
        'current_facts': {}
    }
    
    print("Before processing:")
    print(f"  Summary: '{test_memory_data['memory_events'][0]['summary']}'")
    
    # Process the event
    organizer._process_new_event(test_memory_data, 0)
    
    print("After processing:")
    result_summary = test_memory_data['memory_events'][0]['summary']
    print(f"  Summary: '{result_summary}'")
    
    # Check if it was rewritten
    original = 'Nemzz said: I like anime a lot'
    if result_summary != original and 'User likes' in result_summary:
        print("SUCCESS: ADD event was automatically rewritten for clarity")
        return True
    else:
        print("FAILURE: ADD event was not properly rewritten")
        return False

if __name__ == "__main__":
    success = test_add_event_processing()
    if success:
        print("\nTest completed successfully!")
    else:
        print("\nTest failed!")
    sys.exit(0 if success else 1)