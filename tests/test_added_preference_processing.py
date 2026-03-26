#!/usr/bin/env python3
"""
Test script to verify the Added_preference processing functionality.
"""

import sys
import os
import json

# Add the project root to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '.'))

def test_added_preference_processing():
    """Test the new _process_summary_for_added_preference function."""
    try:
        from astra_ai.memory.Mem0_ai_organizer import AIOrganizer, ORGANIZER_CONFIG
        
        # Create organizer instance
        organizer = AIOrganizer(ORGANIZER_CONFIG)
        
        print("=== Testing Added_preference Processing ===")
        print()
        
        # Test cases covering various preference types and edge cases
        test_cases = [
            # Main issue case
            {
                "name": "Main Issue - Don't like to use old PC",
                "summary": "User: i don't like to use old pc from the 2010",
                "context": "User: i don't like to use old pc from the 2010",
                "expected_key": "Added_preference_avoid",
                "expected_value_contains": "avoids using old pc from the 2010"
            },
            
            # Various preference types
            {
                "name": "Likes Preference",
                "summary": "User: i like listening to jazz music",
                "context": "User: i like listening to jazz music",
                "expected_key": "Added_preference_likes",
                "expected_value_contains": "enjoys listening to jazz music"
            },
            
            {
                "name": "Dislikes Preference",
                "summary": "User: i dislike crowded places like malls",
                "context": "User: i dislike crowded places like malls",
                "expected_key": "Added_preference_dislikes",
                "expected_value_contains": "doesn't like crowded places like malls"
            },
            
            {
                "name": "Love Preference",
                "summary": "User: i love playing guitar and piano",
                "context": "User: i love playing guitar and piano",
                "expected_key": "Added_preference_love",
                "expected_value_contains": "loves playing guitar and piano"
            },
            
            {
                "name": "Hate Preference",
                "summary": "User: i hate waking up early in the morning",
                "context": "User: i hate waking up early in the morning",
                "expected_key": "Added_preference_hate",
                "expected_value_contains": "strongly dislikes waking up early in the morning"
            },
            
            {
                "name": "Avoid Preference",
                "summary": "User: i try to avoid junk food like mcdonald's",
                "context": "User: i try to avoid junk food like mcdonald's",
                "expected_key": "Added_preference_avoid",
                "expected_value_contains": "avoids junk food like mcdonald's"
            },
            
            {
                "name": "Want Preference",
                "summary": "User: i want to learn spanish and french",
                "context": "User: i want to learn spanish and french",
                "expected_key": "Added_preference_want",
                "expected_value_contains": "wants to learn spanish and french"
            },
            
            {
                "name": "Need Preference",
                "summary": "User: i need more sleep and relaxation",
                "context": "User: i need more sleep and relaxation",
                "expected_key": "Added_preference_need",
                "expected_value_contains": "requires more sleep and relaxation"
            },
            
            {
                "name": "Continue Preference",
                "summary": "User: i always read books before going to bed",
                "context": "User: i always read books before going to bed",
                "expected_key": "Added_preference_continue",
                "expected_value_contains": "continues to read books before going to bed"
            },
            
            {
                "name": "Enjoy Preference",
                "summary": "User: i actively enjoy cooking italian dishes",
                "context": "User: i actively enjoy cooking italian dishes",
                "expected_key": "Added_preference_enjoy",
                "expected_value_contains": "actively enjoys cooking italian dishes"
            },
            
            # Edge cases
            {
                "name": "Double User Prefix",
                "summary": "User user: i don't like to use slow software",
                "context": "User user: i don't like to use slow software",
                "expected_key": "Added_preference_avoid",
                "expected_value_contains": "avoids using slow software"
            },
            
            {
                "name": "No User Prefix",
                "summary": "i hate to use old laptops from 2010",
                "context": "i hate to use old laptops from 2010",
                "expected_key": "Added_preference_avoid",
                "expected_value_contains": "avoids using old laptops from 2010"
            },
            
            {
                "name": "Complex Negation",
                "summary": "User: i don't ever want to eat at that restaurant again",
                "context": "User: i don't ever want to eat at that restaurant again",
                "expected_key": "Added_preference_avoid",
                "expected_value_contains": "avoids eating at that restaurant"
            }
        ]
        
        passed = 0
        total = len(test_cases)
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"Test {i}: {test_case['name']}")
            print(f"  Summary: {test_case['summary']}")
            print(f"  Context: {test_case['context']}")
            
            try:
                # Process the summary
                result = organizer._process_summary_for_added_preference(
                    test_case['summary'], 
                    test_case['context']
                )
                
                print(f"  Result: {result}")
                
                # Check if we got the expected key
                if test_case['expected_key'] in result:
                    print(f"  PASS Key check passed: Found '{test_case['expected_key']}'")
                    
                    # Check if the value contains the expected content
                    actual_value = result[test_case['expected_key']]
                    if test_case['expected_value_contains'].lower() in actual_value.lower():
                        print(f"  PASS Value check passed: '{actual_value}' contains '{test_case['expected_value_contains']}'")
                        passed += 1
                    else:
                        print(f"  FAIL Value check failed: '{actual_value}' does not contain '{test_case['expected_value_contains']}'")
                else:
                    print(f"  FAIL Key check failed: Expected '{test_case['expected_key']}', got keys: {list(result.keys())}")
                    
                # Check for "User" artifacts
                result_str = json.dumps(result)
                if "User" in result_str and "User" not in test_case['summary'].replace("User:", "").replace("User user:", "").strip():
                    print(f"  FAIL 'User' artifact found in result!")
                else:
                    print(f"  PASS No 'User' artifacts found")
                    
                print()
                
            except Exception as e:
                print(f"  FAIL Test failed with exception: {e}")
                import traceback
                traceback.print_exc()
                print()
        
        print("=== Test Summary ===")
        print(f"Passed: {passed}/{total}")
        
        if passed == total:
            print("All tests passed! The Added_preference processing is working correctly.")
            return True
        else:
            print("Some tests failed. See details above.")
            return False
            
    except Exception as e:
        print(f"Failed to run tests: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main test function."""
    success = test_added_preference_processing()
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)