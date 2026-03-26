#!/usr/bin/env python3
"""
Test script to verify the new _rewrite_memory_entry function works correctly.
"""
import sys
import os

# Add the astra_ai directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '.'))

from astra_ai.memory.Mem0_ai_organizer import AIOrganizer

def test_rewrite_function():
    print("Testing the new _rewrite_memory_entry function...")
    
    # Create an instance of AIOrganizer
    config = {
        'organizer_enabled': False,  # Disable monitoring for testing
        'memory_file_path': os.path.join('astra_ai', 'Date', 'nova_ai_memory.json'),
        'check_interval': 1.0,
        'llm_enabled': False
    }
    
    organizer = AIOrganizer(config)
    
    # Test case 1: Basic transformation
    print("\nTest 1: Basic transformation")
    original_summary = "Nemzz said: I like anime a lot"
    source_context = "User: I really enjoy watching anime, especially action series"
    user_name = "Nemzz"
    
    result = organizer._rewrite_memory_entry(original_summary, source_context, user_name)
    print(f"Input: original_summary='{original_summary}', source_context='{source_context}', user_name='{user_name}'")
    print(f"Output: '{result}'")
    
    # Test case 2: No user name provided
    print("\nTest 2: No user name provided")
    result2 = organizer._rewrite_memory_entry(original_summary, source_context)
    print(f"Input: original_summary='{original_summary}', source_context='{source_context}', user_name=None")
    print(f"Output: '{result2}'")
    
    # Test case 3: Different input pattern
    print("\nTest 3: Different input pattern")
    original_summary3 = "User stated: I prefer Python over Java for web development"
    source_context3 = "User mentioned Python skills"
    user_name3 = "Nemzz"
    
    result3 = organizer._rewrite_memory_entry(original_summary3, source_context3, user_name3)
    print(f"Input: original_summary='{original_summary3}', source_context='{source_context3}', user_name='{user_name3}'")
    print(f"Output: '{result3}'")
    
    # Test case 4: Complex sentence
    print("\nTest 4: Complex sentence")
    original_summary4 = "Nemzz said: I think I need to study more about machine learning"
    source_context4 = "Discussion about learning goals"
    user_name4 = "Nemzz"
    
    result4 = organizer._rewrite_memory_entry(original_summary4, source_context4, user_name4)
    print(f"Input: original_summary='{original_summary4}', source_context='{source_context4}', user_name='{user_name4}'")
    print(f"Output: '{result4}'")
    
    print("\nAll tests completed!")

if __name__ == "__main__":
    test_rewrite_function()