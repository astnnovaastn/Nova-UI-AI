"""
Test script for Mem0_ai_organizer.py to verify category detection and enhancement functionality.
"""
import json
import os
from astra_ai.memory.Mem0_ai_organizer import AIOrganizer

def test_organizer_functionality():
    """Test the organizer's category detection and enhancement functionality."""
    print("Testing Mem0 AI Organizer functionality...")
    
    # Create test memory data that matches the requirements
    test_memory_data = {
        "memory_events": [
            {
                "summary": "like to build pc for fun",
                "category": "user_preferences.likes",
                "timestamp": "2025-09-27T16:57:09.762573"
            }
        ],
        "current_facts": {
            "user_preference_1": {
                "value": "like to build pc for fun",
                "category": "user_preferences.likes",
                "timestamp": "2025-09-27T16:57:09.762573"
            },
            "personal_preference_1": {
                "value": "realy like a lot of italy food", 
                "category": "personal_preferences.avoid",
                "timestamp": "2025-09-27T13:45:07.642016"
            }
        },
        "fact_history": {
            "long_term_goal_1": [
                {
                    "value": "want to become software engineer",
                    "category": "long_term_goals",
                    "timestamp": "2025-09-27T12:00:00.000000"
                }
            ]
        },
        "conversation": [
            {
                "role": "user",
                "content": "I like to build PCs for fun",
                "timestamp": "2025-09-27T16:57:09.762573"
            }
        ],
        "user": {
            "name": "Rich"
        }
    }
    
    # Create organizer configuration
    config = {
        'organizer_enabled': True,
        'memory_file_path': './test_memory.json',  # Use a test file
        'check_interval': 0.5,  # Faster for testing
        'llm_enabled': False,  # Disable LLM for predictable testing
        'llm_api_key': '',
        'llm_model': 'qwen2.5:3b'
    }
    
    # Create organizer instance
    organizer = AIOrganizer(config)
    
    print("")
    print("--- Testing current_facts enhancement ---")
    
    # Test enhancement of current facts
    original_value = test_memory_data['current_facts']['user_preference_1']['value']
    original_category = test_memory_data['current_facts']['user_preference_1']['category']
    print("Original value: " + original_value)
    print("Category: " + original_category)
    
    # Simulate the enhancement process
    enhanced_value = organizer._enhance_fact_value(
        original_value, 
        original_category, 
        test_memory_data
    )
    print("Enhanced value: " + enhanced_value)
    
    # Test avoid category
    avoid_original = test_memory_data['current_facts']['personal_preference_1']['value']
    avoid_category = test_memory_data['current_facts']['personal_preference_1']['category']
    print("")
    print("Original avoid value: " + avoid_original)
    print("Avoid category: " + avoid_category)
    
    avoid_enhanced = organizer._enhance_fact_value(
        avoid_original,
        avoid_category,
        test_memory_data
    )
    print("Enhanced avoid value: " + avoid_enhanced)
    
    # Test goal category
    goal_original = test_memory_data['fact_history']['long_term_goal_1'][0]['value']
    goal_category = test_memory_data['fact_history']['long_term_goal_1'][0]['category']
    print("")
    print("Original goal value: " + goal_original)
    print("Goal category: " + goal_category)
    
    goal_enhanced = organizer._enhance_fact_value(
        goal_original,
        goal_category,
        test_memory_data
    )
    print("Enhanced goal value: " + goal_enhanced)
    
    # Test the overall enhancement function
    print("")
    print("--- Testing direct enhancement methods ---")
    
    # Test _enhance_like_value directly
    test_like_input = "like to build pc for fun"
    enhanced_like = organizer._enhance_like_value(test_like_input, "Rich")
    print("Like enhancement - Input: '" + test_like_input + "' -> Output: '" + enhanced_like + "'")
    
    # Test _enhance_avoid_value directly with typo
    test_avoid_input = "realy like a lot of italy food"  # Contains typo
    enhanced_avoid = organizer._enhance_avoid_value(test_avoid_input, "Rich")
    print("Avoid enhancement - Input: '" + test_avoid_input + "' -> Output: '" + enhanced_avoid + "'")
    
    # Test _enhance_goal_value directly
    test_goal_input = "want to become software engineer"
    enhanced_goal = organizer._enhance_goal_value(test_goal_input, "Rich")
    print("Goal enhancement - Input: '" + test_goal_input + "' -> Output: '" + enhanced_goal + "'")
    
    # Test the enhanced current facts processing
    print("")
    print("--- Testing current facts and history processing ---")
    organizer._enhance_current_facts_and_history(test_memory_data)
    
    print("After processing, current_facts:")
    for key, fact in test_memory_data['current_facts'].items():
        print("  " + key + ": " + fact['value'] + " (category: " + fact.get('category', 'unknown') + ")")
    
    print("")
    print("After processing, fact_history:")
    for key, history_list in test_memory_data['fact_history'].items():
        for i, entry in enumerate(history_list):
            print("  " + key + "[" + str(i) + "]: " + entry['value'] + " (category: " + entry.get('category', 'unknown') + ")")
    
    # Save test memory to file for verification
    with open('./test_memory.json', 'w') as f:
        json.dump(test_memory_data, f, indent=2)
    
    print("")
    print("Test completed! Check test_memory.json for final results.")
    
    return True

if __name__ == "__main__":
    try:
        success = test_organizer_functionality()
        if success:
            print("")
            print("All tests passed! The organizer correctly handles category detection and enhancement.")
        else:
            print("")
            print("Tests failed!")
    except Exception as e:
        print("Error during test execution: " + str(e))
        import traceback
        traceback.print_exc()