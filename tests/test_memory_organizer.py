#!/usr/bin/env python3
"""
Test script for the enhanced memory organizer functionality
"""

import json
import os
from datetime import datetime
from astra_ai.memory.Mem0_ai_organizer import AIOrganizer, ORGANIZER_CONFIG

def test_memory_organizer():
    # Adjust the path for testing
    test_memory_file = "test_memory.json"
    
    # Create test memory data with the specific issue scenario
    test_data = {
        "memory_events": [
            {
                "timestamp": datetime.now().isoformat(),
                "summary": "Added preference likes: like",
                "category": "personal_preferences",
                "fact_category": "likes"
            },
            {
                "timestamp": datetime.now().isoformat(),
                "summary": "Added preference likes: Python. User said: I really enjoy coding in Python",
                "category": "personal_preferences",
                "fact_category": "likes"
            },
            {
                "timestamp": datetime.now().isoformat(),
                "summary": "Added preference likes: 67",
                "category": "personal_preferences", 
                "fact_category": "likes"
            },
            {
                "timestamp": datetime.now().isoformat(),
                "summary": "User mentioned they like coding",
                "category": "interests"
            },
            {
                "timestamp": datetime.now().isoformat(),
                "summary": "Tool usage: file search executed",
                "category": "tool_integration"
            }
        ],
        "current_facts": {
            "fact_1": {
                "value": "user likes python",
                "category": "personal_preferences",
                "confidence": 0.9
            }
        },
        "fact_history": {},
        "conversation": [
            {
                "timestamp": datetime.now().isoformat(),
                "role": "user",
                "content": "I really enjoy coding in Python"
            },
            {
                "timestamp": datetime.now().isoformat(),
                "role": "user", 
                "content": "I like 67"
            },
            {
                "timestamp": datetime.now().isoformat(),
                "role": "user",
                "content": "I like machine learning"
            }
        ],
        "user": {
            "name": "Nemzz"
        }
    }
    
    # Write test data to file
    with open(test_memory_file, 'w') as f:
        json.dump(test_data, f, indent=2)
    
    # Update config to use test file
    config = ORGANIZER_CONFIG.copy()
    config['memory_file_path'] = test_memory_file
    config['organizer_enabled'] = True
    config['llm_enabled'] = False  # Disable LLM for testing
    
    # Create organizer and test enhancement
    organizer = AIOrganizer(config)
    
    print("Original memory events:")
    for i, event in enumerate(test_data['memory_events']):
        print(f"  Event {i}: {event['summary']}")
    
    # Test the enhance_memory_in_place method
    enhanced_data, modified_count = organizer.enhance_memory_in_place(test_data.copy())
    
    print(f"\nEnhanced {modified_count} entries")
    print("Enhanced memory events:")
    for i, event in enumerate(enhanced_data['memory_events']):
        print(f"  Event {i}: {event['summary']}")
        if 'provenance' in event and 'original_summary' in event['provenance']:
            print(f"    Original: {event['provenance']['original_summary']}")
    
    print("\nEnhanced current facts:")
    for key, fact in enhanced_data['current_facts'].items():
        print(f"  {key}: {fact['value']}")
    
    # Test individual event processing as well
    print("\nTesting individual event processing:")
    sample_event = {
        "timestamp": datetime.now().isoformat(),
        "summary": "Added preference likes: like",
        "category": "personal_preferences"
    }
    
    conv_item = {"timestamp": datetime.now().isoformat(), "role": "user", "content": "I like 67"}
    source_info = {
        'source_type': 'conversation',
        'source_details': 'Conversation',
        'context': 'User said: I like 67',
        'event_index': 0
    }
    
    organizer._enhance_event_in_place(sample_event, conv_item, test_data, source_info)
    print(f"Processed event: {sample_event['summary']}")
    
    # Clean up test file
    if os.path.exists(test_memory_file):
        os.remove(test_memory_file)
    
    print("\nTest completed successfully!")

if __name__ == "__main__":
    test_memory_organizer()