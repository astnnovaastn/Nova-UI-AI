#!/usr/bin/env python3
"""
Test script to verify the organizer fix for the AI Organizer functionality.
This script will test the _rewrite_memory_entry function with different inputs.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'astra_ai', 'memory'))

from Mem0_ai_organizer import AIOrganizer

def test_rewrite_function():
    """Test the rewritten function with various inputs"""
    # Create organizer instance with minimal config
    config = {
        'organizer_enabled': True,
        'memory_file_path': os.path.join('astra_ai', 'Date', 'nova_ai_memory.json'),
        'check_interval': 1.0
    }
    
    organizer = AIOrganizer(config)
    
    # Test cases based on the examples from the requirements
    test_cases = [
        {
            "original": "Added preference likes: 2pac",
            "source_context": "User user: i like 2pac ...",
            "user_name": "Nemzz",
            "expected_pattern": "Nemzz enjoys"
        },
        {
            "original": "Added preference likes: like",
            "source_context": "User user: i like the name 2pac...",
            "user_name": "Nemzz", 
            "expected_pattern": "unclear"
        },
        {
            "original": "Added preference likes: the name nova and values this and enjoys the name nova and considers it an interest",
            "source_context": "User user: i like your name nova so much nova...",
            "user_name": "Nemzz",
            "expected_pattern": "likes the name"
        }
    ]
    
    print("Testing _rewrite_memory_entry function...")
    
    for i, test_case in enumerate(test_cases):
        print(f"\nTest {i+1}:")
        print(f"  Original: {test_case['original']}")
        print(f"  Source Context: {test_case['source_context']}")
        print(f"  User Name: {test_case['user_name']}")
        
        result = organizer._rewrite_memory_entry(
            test_case['original'], 
            test_case['source_context'], 
            test_case['user_name']
        )
        
        print(f"  Result: {result}")
        print(f"  Expected to contain: {test_case['expected_pattern']}")
        
        if test_case['expected_pattern'] in result.lower():
            print(f"  PASS")
        else:
            print(f"  FAIL")
    
    print("\nTesting completed.")

if __name__ == "__main__":
    test_rewrite_function()