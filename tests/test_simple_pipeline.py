#!/usr/bin/env python3
"""
Simple test to verify the pipeline updates work correctly.
"""
import sys
import os
import json
from datetime import datetime

# Add the astra_ai directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '.'))

from astra_ai.memory.Mem0_ai_organizer import AIOrganizer

def test_pipeline():
    print("Testing the updated pipeline...")
    
    # Create an instance of AIOrganizer
    config = {
        'organizer_enabled': False,  # Disable monitoring for testing
        'memory_file_path': os.path.join('astra_ai', 'Date', 'nova_ai_memory.json'),
        'check_interval': 1.0,
        'llm_enabled': False
    }
    
    organizer = AIOrganizer(config)
    
    # Create a mock memory event for testing
    mock_event = {
        'summary': 'Nemzz Added preference likes: python over java for web development and values this and enjoys python over java for web development and considers it an interest and enjoys python over java for web development and considers it an interest',
        'type': 'ADD',
        'timestamp': datetime.now().isoformat()
    }
    
    mock_conv_item = {
        'role': 'user',
        'content': 'I like Python better than Java for web development',
        'timestamp': datetime.now().isoformat()
    }
    
    mock_memory_data = {
        'memory_events': [mock_event],
        'current_facts': {},
        'fact_history': {},
        'conversation': [mock_conv_item],
        'user': {'name': 'Nemzz'}
    }
    
    mock_source_info = {
        'source_type': 'conversation',
        'source_details': f"Conversation at {mock_conv_item.get('timestamp', '')}",
        'context': f"User {mock_conv_item.get('role', '')}: {mock_conv_item.get('content', '')[:100]}...",
        'event_index': 0
    }
    
    print(f"Original summary: {mock_event['summary']}")
    
    # Test the enhanced event processing pipeline
    organizer._enhance_event_in_place(mock_event, mock_conv_item, mock_memory_data, mock_source_info)
    
    print(f"Processed summary:  {mock_event['summary']}")
    
    # Check if provenance was added
    if 'provenance' in mock_event:
        print(f"Provenance exists: {mock_event['provenance'].get('enhanced_in_place', False)}")
        if 'original_summary' in mock_event['provenance']:
            print(f"Original in provenance: {mock_event['provenance']['original_summary']}")
    
    print("\nPipeline test completed!")

def test_remove_repetitive_phrases():
    print("\nTesting _remove_repetitive_phrases function directly...")
    
    config = {
        'organizer_enabled': False,
        'memory_file_path': os.path.join('astra_ai', 'Date', 'nova_ai_memory.json'),
        'check_interval': 1.0,
        'llm_enabled': False
    }
    
    organizer = AIOrganizer(config)
    
    # Test the direct function
    test_text = "Nemzz likes programming. Nemzz likes programming."
    result = organizer._remove_repetitive_phrases(test_text)
    print(f"Input:  {test_text}")
    print(f"Output: {result}")
    
    # Test with "and" conjunctions
    test_text2 = "Nemzz enjoys Python and enjoys Python"
    result2 = organizer._remove_repetitive_phrases(test_text2)
    print(f"Input:  {test_text2}")
    print(f"Output: {result2}")

if __name__ == "__main__":
    test_pipeline()
    test_remove_repetitive_phrases()