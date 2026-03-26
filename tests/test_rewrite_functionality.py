#!/usr/bin/env python3
"""
Test script to verify the updated rewrite functionality works correctly.
"""
import sys
import os
from datetime import datetime

# Add the astra_ai directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '.'))

from astra_ai.memory.Mem0_ai_organizer import AIOrganizer

def test_rewrite_functionality():
    print("Testing updated rewrite functionality...")
    
    # Create an instance of AIOrganizer
    config = {
        'organizer_enabled': False,  # Disable monitoring for testing
        'memory_file_path': os.path.join('astra_ai', 'Date', 'nova_ai_memory.json'),
        'check_interval': 1.0,
        'llm_enabled': False
    }
    
    organizer = AIOrganizer(config)
    
    # Test case 1: The example from the requirements
    print("\nTest 1: Example case from requirements")
    original_summary = "Nemzz Added preference likes: the name nemzz and values this and enjoys the name nemzz and considers it an interest and enjoys the name nemzz and considers it an interest ..."
    source_context = "User mentioned name preferences"
    user_name = "Nemzz"
    
    result = organizer._rewrite_memory_entry(original_summary, source_context, user_name)
    print(f"Input:  '{original_summary}'")
    print(f"Output: '{result}'")
    print(f"Expected: 'Nemzz likes the name 'Nemzz' and considers it a personal preference.'")
    
    # Test case 2: Another example with duplicates
    print("\nTest 2: Another duplicate example")
    original_summary2 = "Nemzz enjoys Python programming and values this and likes Python programming and considers it an interest"
    result2 = organizer._rewrite_memory_entry(original_summary2, "User talked about programming", user_name)
    print(f"Input:  '{original_summary2}'")
    print(f"Output: '{result2}'")
    
    # Test case 3: Basic functionality without duplicates
    print("\nTest 3: Basic functionality without duplicates")
    original_summary3 = "Nemzz mentioned he likes to code"
    result3 = organizer._rewrite_memory_entry(original_summary3, "General conversation", user_name)
    print(f"Input:  '{original_summary3}'")
    print(f"Output: '{result3}'")
    
    # Test case 4: Test the pipeline with an ADD event
    print("\nTest 4: Pipeline test with ADD event")
    event = {
        'summary': original_summary,
        'type': 'ADD',
        'timestamp': datetime.now().isoformat()
    }
    
    source_info = {
        'source_type': 'conversation',
        'context': source_context,
        'event_index': 0
    }
    
    memory_data = {
        'current_facts': {},
        'user': {'name': user_name}
    }
    
    print(f"Input summary: {event['summary']}")
    organizer._enhance_event_in_place(
        event, 
        conv_item=None, 
        memory_data=memory_data, 
        source_info=source_info
    )
    print(f"Output summary: {event['summary']}")
    
    if 'provenance' in event and 'original_summary' in event['provenance']:
        print(f"Original in provenance: {event['provenance']['original_summary']}")
    
    print("\nAll tests completed!")

def test_edge_cases():
    print("\n" + "="*50)
    print("Testing edge cases...")
    
    config = {
        'organizer_enabled': False,
        'memory_file_path': os.path.join('astra_ai', 'Date', 'nova_ai_memory.json'),
        'check_interval': 1.0,
        'llm_enabled': False
    }
    
    organizer = AIOrganizer(config)
    
    # Test with no user name
    print("\nEdge Case 1: No user name")
    result1 = organizer._rewrite_memory_entry("User likes programming and values this and enjoys programming and considers it an interest", "Context here", None)
    print(f"Output: '{result1}'")
    
    # Test with empty inputs
    print("\nEdge Case 2: Empty inputs")
    result2 = organizer._rewrite_memory_entry("", "", "Nemzz")
    print(f"Output: '{result2}'")
    
    # Test with complex duplicates
    print("\nEdge Case 3: Complex duplicates")
    complex_input = "Nemzz enjoys coding in Python and values this and likes coding in Python and considers it an interest and loves coding in Python and finds it fulfilling"
    result3 = organizer._rewrite_memory_entry(complex_input, "Detailed context", "Nemzz")
    print(f"Input: '{complex_input}'")
    print(f"Output: '{result3}'")

if __name__ == "__main__":
    test_rewrite_functionality()
    test_edge_cases()