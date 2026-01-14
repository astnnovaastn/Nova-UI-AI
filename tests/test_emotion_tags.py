#!/usr/bin/env python3
"""
Test script to verify the emotion tagging implementation follows the guidelines correctly.
"""

import sys
import os
# Add the astra_ai directory to the path so we can import the organizer
sys.path.append(os.path.join(os.path.dirname(__file__), '.'))

from astra_ai.memory.Mem0_ai_organizer import AIOrganizer
import json


def test_emotion_tagging():
    """Test the emotion tagging functionality with examples from the guidelines."""
    
    # Create a basic config for the organizer
    config = {
        'organizer_enabled': True,
        'memory_file_path': 'test_memory.json',
        'check_interval': 1.0,
        'llm_enabled': False,  # Disable LLM for testing
    }
    
    # Initialize the organizer
    organizer = AIOrganizer(config)
    
    print("Testing emotion tagging implementation with examples from guidelines...\n")
    
    # Test cases from the guidelines
    test_cases = [
        {
            "input": "User sees watch anime sometimes during the weekend.",
            "expected": ["anime", "weekend"],
            "description": "Example: 'User sees watch anime sometimes during the weekend.' -> Tags: ['anime', 'weekend']"
        },
        {
            "input": "User loves Italian food, especially pasta.",
            "expected": ["italian", "pasta"],
            "description": "Example: 'User loves Italian food, especially pasta.' -> Tags: ['italian', 'pasta'] or ['food', 'italian']"
        },
        {
            "input": "User always have coffee in the morning.",
            "expected": ["coffee", "morning"],
            "description": "Example: 'User always have coffee in the morning.' -> Tags: ['coffee', 'morning']"
        },
        {
            "input": "User enjoys reading sci-fi novels.",
            "expected": ["reading", "sci-fi"],
            "description": "Example: 'User enjoys reading sci-fi novels.' -> Tags: ['reading', 'sci-fi']"
        },
        {
            "input": "User prefer dark roast coffee, black.",
            "expected": ["coffee", "dark-roast"],
            "description": "Example: 'User prefer dark roast coffee, black.' -> Tags: ['coffee', 'dark-roast']"
        },
        {
            "input": "User walk for about 45 minutes every morning.",
            "expected": ["walking", "morning"],
            "description": "Example: 'User walk for about 45 minutes every morning.' -> Tags: ['walking', 'morning']"
        },
        {
            "input": "User loves trying new restaurants and cuisines.",
            "expected": ["restaurants", "food"],
            "description": "Example: 'User loves trying new restaurants and cuisines.' -> Tags: ['restaurants', 'food'] or ['dining', 'cuisine']"
        },
        {
            "input": "User always read for 30 minutes before bed.",
            "expected": ["reading", "bedtime"],
            "description": "Example: 'User always read for 30 minutes before bed.' -> Tags: ['reading', 'bedtime']"
        }
    ]
    
    all_passed = True
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"Test {i}: {test_case['description']}")
        
        # Generate tags using the new implementation - use the method that returns just tags
        result = organizer._generate_emotion_tags(test_case['input'])
        actual_tags = result['emotion_tags']  # Extract just the emotion tags from the result

        print(f"  Input: {test_case['input']}")
        print(f"  Expected: {test_case['expected']}")
        print(f"  Actual: {actual_tags}")

        # Check if expected tags are in the actual results (order may vary)
        expected_match = all(exp in actual_tags for exp in test_case['expected'][:2])  # At least first 2 should match
        
        # Also check against alternative expected outcomes mentioned in guidelines
        alternatives = []
        if test_case['input'] == "User loves Italian food, especially pasta.":
            alternatives = [["food", "italian"]]
        elif test_case['input'] == "User loves trying new restaurants and cuisines.":
            alternatives = [["dining", "cuisine"]]
        
        alternative_match = any(
            all(alt in actual_tags for alt in alt_list) 
            for alt_list in alternatives
        )
        
        if expected_match or alternative_match:
            print("  PASSED")
        else:
            print("  FAILED")
            all_passed = False
        
        print()
    
    # Additional tests to ensure guidelines are followed
    print("Additional compliance tests:\n")
    
    # Test 1: Should not include 'user' as a tag
    test_no_user = {
        "input": "User loves Italian food, especially pasta.",
        "description": "Should NOT include 'user' as a tag"
    }
    
    print(f"Test additional 1: {test_no_user['description']}")
    result = organizer._generate_emotion_tags(test_no_user['input'])
    tags = result['emotion_tags']  # Extract just the emotion tags from the result
    print(f"  Input: {test_no_user['input']}")
    print(f"  Tags: {tags}")
    if 'user' not in tags:
        print("  PASSED - 'user' tag not present")
    else:
        print("  FAILED - 'user' tag is present")
        all_passed = False
    print()

    # Test 2: Should not include vague category labels like 'preference', 'behavior', 'habit'
    test_no_vague = {
        "input": "User has a preference for dark roast coffee",
        "description": "Should NOT include vague tags like 'preference', 'behavior', 'habit'"
    }

    print(f"Test additional 2: {test_no_vague['description']}")
    result = organizer._generate_emotion_tags(test_no_vague['input'])
    tags = result['emotion_tags']  # Extract just the emotion tags from the result
    print(f"  Input: {test_no_vague['input']}")
    print(f"  Tags: {tags}")
    vague_tags = ['preference', 'behavior', 'habit', 'learning']
    has_vague = any(vague in tags for vague in vague_tags)
    if not has_vague:
        print("  PASSED - No vague category tags present")
    else:
        print("  FAILED - Vague category tags found:", [v for v in vague_tags if v in tags])
        all_passed = False
    print()

    # Test 3: Should extract specific genres, types, and attributes
    test_specific = {
        "input": "User enjoys reading sci-fi novels",
        "description": "Should extract 'sci-fi' instead of just 'books'"
    }

    print(f"Test additional 3: {test_specific['description']}")
    result = organizer._generate_emotion_tags(test_specific['input'])
    tags = result['emotion_tags']  # Extract just the emotion tags from the result
    print(f"  Input: {test_specific['input']}")
    print(f"  Tags: {tags}")
    if 'sci-fi' in tags and 'books' not in tags:
        print("  PASSED - Specific genre 'sci-fi' extracted")
    elif 'reading' in tags and 'sci-fi' in tags:  # This is also acceptable
        print("  PASSED - Both activity and specific genre extracted")
    else:
        print("  FAILED - Specific genre not properly extracted")
        all_passed = False
    print()
    
    print(f"Overall result: {'ALL TESTS PASSED' if all_passed else 'SOME TESTS FAILED'}")
    return all_passed


if __name__ == "__main__":
    test_emotion_tagging()