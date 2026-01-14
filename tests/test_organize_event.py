#!/usr/bin/env python3
"""
Test script to verify the organize_event method works
"""

import sys
from pathlib import Path

# Add the project root to the path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from astra_ai.memory.Mem0_ai_organizer import AIOrganizer

def main():
    """Test the organize_event method."""
    print("Testing organize_event method...")
    
    # Configuration
    config = {
        'organizer_enabled': True,
        'memory_file_path': 'test_data/nova_ai_memory.json',
        'check_interval': 1.0,
        'llm_enabled': False  # Disable LLM for this test
    }
    
    # Initialize organizer
    organizer = AIOrganizer(config)
    
    # Test data
    memory_data = {
        "memory_events": [
            {
                "type": "ADD",
                "summary": "user said they love py programming",
                "timestamp": "2025-09-20T10:00:00.000000",
                "provenance": {}
            }
        ],
        "current_facts": {
            "user_identity": {
                "category": "user_identity",
                "value": "My name is Alex",
                "confidence": 0.9
            }
        },
        "conversation": [
            {
                "role": "user",
                "content": "I really love Python programming! It's so elegant.",
                "timestamp": "2025-09-20T10:00:00.000000"
            }
        ],
        "user": {
            "name": "Alex"
        }
    }
    
    # Test the organize_event method
    try:
        updated_memory_data, organizer_event = organizer.organize_event(memory_data, 0)
        print("organize_event method executed successfully!")
        print(f"Updated memory data: {updated_memory_data}")
        print(f"Organizer event: {organizer_event}")
        
        # Check if the event was enhanced
        if updated_memory_data and 'memory_events' in updated_memory_data:
            event = updated_memory_data['memory_events'][0]
            print(f"\nEnhanced event summary: {event.get('summary', 'N/A')}")
            print(f"Provenance: {event.get('provenance', {})}")
        
    except Exception as e:
        print(f"Error testing organize_event method: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()