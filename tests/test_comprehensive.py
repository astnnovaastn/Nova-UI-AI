#!/usr/bin/env python3
"""
Comprehensive test to validate the rewrite functionality.
"""
import sys
import os
from datetime import datetime

# Add the astra_ai directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '.'))

from astra_ai.memory.Mem0_ai_organizer import AIOrganizer

def test_comprehensive():
    print("Comprehensive test of updated rewrite functionality...")
    
    # Create an instance of AIOrganizer
    config = {
        'organizer_enabled': False,  # Disable monitoring for testing
        'memory_file_path': os.path.join('astra_ai', 'Date', 'nova_ai_memory.json'),
        'check_interval': 1.0,
        'llm_enabled': False
    }
    
    organizer = AIOrganizer(config)
    
    print("\n" + "="*60)
    print("TESTING MAIN REQUIREMENT EXAMPLE")
    print("="*60)
    
    # Main test case from requirements
    original_summary = "Nemzz Added preference likes: the name nemzz and values this and enjoys the name nemzz and considers it an interest and enjoys the name nemzz and considers it an interest ..."
    source_context = "User mentioned name preferences"
    user_name = "Nemzz"
    
    result = organizer._rewrite_memory_entry(original_summary, source_context, user_name)
    print(f"Input:     '{original_summary}'")
    print(f"Output:    '{result}'")
    print(f"Expected:  'Nemzz likes the name 'Nemzz' and considers it a personal preference.'")
    print(f"Success:   {'✓' if 'likes the name nemzz' in result.lower() and 'considers it a personal preference' in result.lower() else '✗'}")
    
    print("\n" + "="*60)
    print("TESTING ADDITIONAL SCENARIOS")
    print("="*60)
    
    # Test 2: Duplicate pattern with "Python"
    print("\nTest 2: Python programming duplicate pattern")
    test2_input = "Nemzz enjoys Python programming and values this and likes Python programming and considers it an interest"
    result2 = organizer._rewrite_memory_entry(test2_input, "User talked about programming", user_name)
    print(f"Input:  '{test2_input}'")
    print(f"Output: '{result2}'")
    
    # Test 3: Pattern with "coding in Python"
    print("\nTest 3: More complex duplicate pattern")
    test3_input = "Nemzz enjoys coding in Python and values this and likes coding in Python and considers it an interest and loves coding in Python and finds it fulfilling"
    result3 = organizer._rewrite_memory_entry(test3_input, "User talked about coding", user_name)
    print(f"Input:  '{test3_input}'")
    print(f"Output: '{result3}'")
    
    # Test 4: Basic functionality without duplicates
    print("\nTest 4: Basic functionality")
    test4_input = "Nemzz likes to code"
    result4 = organizer._rewrite_memory_entry(test4_input, "", user_name)
    print(f"Input:  '{test4_input}'")
    print(f"Output: '{result4}'")
    
    print("\n" + "="*60)
    print("TESTING PIPELINE INTEGRATION")
    print("="*60)
    
    # Test with pipeline (ADD event)
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
    
    print(f"\nPipeline Input:  {event['summary']}")
    organizer._enhance_event_in_place(
        event, 
        conv_item=None, 
        memory_data=memory_data, 
        source_info=source_info
    )
    print(f"Pipeline Output: {event['summary']}")
    
    if 'provenance' in event and 'original_summary' in event['provenance']:
        print(f"Original saved:  {event['provenance']['original_summary']}")
    
    print("\n" + "="*60)
    print("VALIDATION SUMMARY")
    print("="*60)
    
    # Verify that the main requirement is met
    success = 'likes the name nemzz' in result.lower() and 'personal preference' in result.lower()
    print(f"Main requirement met: {'✓ YES' if success else '✗ NO'}")
    print(f"Output is concise: {'✓ YES' if len(result.split()) <= 15 else '✗ NO'}")
    print(f"Output is in third person: {'✓ YES' if user_name in result else '✗ NO'}")
    print(f"No duplicate phrases: {'✓ YES' if 'and considers it an interest' not in result or result.count('and considers it an interest') <= 1 else '✗ NO'}")
    
    print("\nAll tests completed!")

if __name__ == "__main__":
    test_comprehensive()