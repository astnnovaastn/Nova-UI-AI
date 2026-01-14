#!/usr/bin/env python3
"""
Comprehensive test suite for the AI Organizer system.
Tests all types of Added_preference classifications with various conversation examples.
"""

import sys
import os
import json
import traceback
from datetime import datetime
from typing import Dict, List, Tuple

# Add the project root to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '.'))

# Test cases covering all preference types
TEST_CASES = [
    # Avoid/Dislike patterns (the main issue we fixed)
    {
        "name": "Avoid - Don't like to use old PC",
        "context": "User: i don't like to use old pc from the 2010",
        "expected_type": "avoid",
        "expected_content_keywords": ["old pc", "2010"]
    },
    {
        "name": "Avoid - Hate to use slow software",
        "context": "User: i hate to use slow software like the old version of photoshop",
        "expected_type": "avoid",
        "expected_content_keywords": ["slow software", "old version", "photoshop"]
    },
    {
        "name": "Avoid - Try to avoid junk food",
        "context": "User: i try to avoid junk food like mcdonald's and kfc",
        "expected_type": "avoid",
        "expected_content_keywords": ["junk food", "mcdonald's", "kfc"]
    },
    {
        "name": "Avoid - Don't want to eat fast food",
        "context": "User: i don't want to eat fast food anymore",
        "expected_type": "avoid",
        "expected_content_keywords": ["fast food"]
    },
    
    # Likes patterns
    {
        "name": "Likes - Enjoy programming",
        "context": "User: i enjoy programming in python and javascript",
        "expected_type": "likes",
        "expected_content_keywords": ["programming", "python", "javascript"]
    },
    {
        "name": "Likes - Like listening to music",
        "context": "User: i like listening to jazz and classical music",
        "expected_type": "likes",
        "expected_content_keywords": ["listening to jazz", "classical music"]
    },
    
    # Love patterns
    {
        "name": "Love - Love playing guitar",
        "context": "User: i love playing guitar and piano",
        "expected_type": "love",
        "expected_content_keywords": ["playing guitar", "piano"]
    },
    {
        "name": "Love - Adore traveling",
        "context": "User: i adore traveling to exotic places",
        "expected_type": "love",
        "expected_content_keywords": ["traveling", "exotic places"]
    },
    
    # Dislikes patterns
    {
        "name": "Dislikes - Dislike crowded places",
        "context": "User: i dislike crowded places like malls and concerts",
        "expected_type": "dislikes",
        "expected_content_keywords": ["crowded places", "malls", "concerts"]
    },
    {
        "name": "Dislikes - Not interested in sports",
        "context": "User: i'm not interested in watching sports",
        "expected_type": "dislikes",
        "expected_content_keywords": ["watching sports"]
    },
    
    # Hate patterns
    {
        "name": "Hate - Hate waking up early",
        "context": "User: i hate waking up early in the morning",
        "expected_type": "hate",
        "expected_content_keywords": ["waking up early", "morning"]
    },
    {
        "name": "Hate - Despise traffic jams",
        "context": "User: i despise sitting in traffic jams for hours",
        "expected_type": "hate",
        "expected_content_keywords": ["sitting in traffic jams", "hours"]
    },
    
    # Want patterns
    {
        "name": "Want - Want to learn Spanish",
        "context": "User: i want to learn spanish and french",
        "expected_type": "want",
        "expected_content_keywords": ["learn spanish", "french"]
    },
    {
        "name": "Want - Desire to travel",
        "context": "User: i desire to travel around the world",
        "expected_type": "want",
        "expected_content_keywords": ["travel around the world"]
    },
    
    # Need patterns
    {
        "name": "Need - Need more sleep",
        "context": "User: i need more sleep and relaxation",
        "expected_type": "need",
        "expected_content_keywords": ["more sleep", "relaxation"]
    },
    {
        "name": "Need - Require exercise",
        "context": "User: i require daily exercise for my health",
        "expected_type": "need",
        "expected_content_keywords": ["daily exercise", "health"]
    },
    
    # Continue/Habit patterns
    {
        "name": "Continue - Always read books",
        "context": "User: i always read books before going to bed",
        "expected_type": "continue",
        "expected_content_keywords": ["read books", "before going to bed"]
    },
    {
        "name": "Continue - Keep exercising",
        "context": "User: i keep exercising every morning",
        "expected_type": "continue",
        "expected_content_keywords": ["exercising every morning"]
    },
    
    # Enjoy patterns
    {
        "name": "Enjoy - Actively enjoy cooking",
        "context": "User: i actively enjoy cooking italian dishes",
        "expected_type": "enjoy",
        "expected_content_keywords": ["cooking italian dishes"]
    },
    {
        "name": "Enjoy - Pleasure in gardening",
        "context": "User: i find pleasure in gardening and growing vegetables",
        "expected_type": "enjoy",
        "expected_content_keywords": ["gardening", "growing vegetables"]
    },
    
    # Complex patterns
    {
        "name": "Complex - Mixed preferences",
        "context": "User: i like coffee but i don't like to drink it after 3pm",
        "expected_type": "likes",  # Should pick the primary preference
        "expected_content_keywords": ["coffee"]
    },
    {
        "name": "Complex - Strong avoidance",
        "context": "User: i strongly dislike eating spicy food like indian curry",
        "expected_type": "dislikes",
        "expected_content_keywords": ["eating spicy food", "indian curry"]
    },
    
    # Edge cases
    {
        "name": "Edge case - Double user prefix",
        "context": "User user: i don't like to use old laptops from 2010",
        "expected_type": "avoid",
        "expected_content_keywords": ["old laptops", "2010"]
    },
    {
        "name": "Edge case - No user prefix",
        "context": "i love reading science fiction novels",
        "expected_type": "love",
        "expected_content_keywords": ["reading science fiction novels"]
    },
    {
        "name": "Edge case - Complex negation",
        "context": "User: i don't ever want to eat at that restaurant again",
        "expected_type": "avoid",
        "expected_content_keywords": ["eat at that restaurant"]
    }
]

def setup_test_environment():
    """Setup test environment and import required modules."""
    try:
        from astra_ai.memory.Mem0_ai_organizer import AIOrganizer, ORGANIZER_CONFIG
        return AIOrganizer, ORGANIZER_CONFIG
    except ImportError as e:
        print(f"Failed to import AIOrganizer: {e}")
        return None, None

def run_single_test(organizer, test_case: Dict) -> Tuple[bool, Dict]:
    """
    Run a single test case.
    
    Args:
        organizer: AIOrganizer instance
        test_case: Test case dictionary
        
    Returns:
        Tuple of (success, results_dict)
    """
    try:
        context = test_case["context"]
        expected_type = test_case["expected_type"]
        expected_keywords = test_case.get("expected_content_keywords", [])
        
        print(f"  Testing: {test_case['name']}")
        print(f"  Context: {context}")
        
        # Test content extraction
        extracted_content = organizer._extract_meaningful_content_from_context(context)
        print(f"  Extracted content: '{extracted_content}'")
        
        # Test preference classification
        preference_type = organizer._classify_preference_type_from_context(context)
        print(f"  Classified type: {preference_type} (expected: {expected_type})")
        
        # Test preference sentence creation
        preference_sentence = organizer._create_natural_preference_sentence(context, preference_type)
        print(f"  Preference sentence: {preference_sentence}")
        
        # Check for errors
        errors = []
        
        # Check if type matches expected
        if preference_type != expected_type:
            errors.append(f"Type mismatch: got '{preference_type}', expected '{expected_type}'")
        
        # Check for "User" artifacts in preference sentence
        if "User" in preference_sentence and "User" not in context.replace("User:", "").replace("User user:", "").strip():
            errors.append("'User' found in preference sentence when it shouldn't be")
        
        # Check for expected keywords in extracted content
        if expected_keywords:
            content_lower = extracted_content.lower()
            missing_keywords = []
            for keyword in expected_keywords:
                if keyword.lower() not in content_lower:
                    missing_keywords.append(keyword)
            if missing_keywords:
                errors.append(f"Missing expected keywords: {missing_keywords}")
        
        # Print results
        if errors:
            print(f"  FAILED: {', '.join(errors)}")
            success = False
        else:
            print(f"  PASSED")
            success = True
            
        print()
        
        return success, {
            "test_name": test_case["name"],
            "context": context,
            "extracted_content": extracted_content,
            "classified_type": preference_type,
            "expected_type": expected_type,
            "preference_sentence": preference_sentence,
            "errors": errors
        }
        
    except Exception as e:
        print(f"  FAILED with exception: {e}")
        traceback.print_exc()
        print()
        return False, {
            "test_name": test_case["name"],
            "context": test_case["context"],
            "error": str(e),
            "traceback": traceback.format_exc()
        }

def run_comprehensive_test():
    """Run comprehensive test suite."""
    print("=== Comprehensive AI System Test ===")
    print(f"Time: {datetime.now().isoformat()}")
    print()
    
    # Setup
    AIOrganizer, ORGANIZER_CONFIG = setup_test_environment()
    if not AIOrganizer:
        print("❌ Failed to setup test environment")
        return False
    
    # Create organizer instance with test config
    test_config = ORGANIZER_CONFIG.copy()
    test_config['memory_file_path'] = os.path.join('test_temp', 'test_memory.json')
    os.makedirs('test_temp', exist_ok=True)
    
    organizer = AIOrganizer(test_config)
    print("✅ Successfully created AIOrganizer instance")
    print()
    
    # Run tests
    results = []
    passed = 0
    
    print(f"Running {len(TEST_CASES)} test cases...")
    print()
    
    for i, test_case in enumerate(TEST_CASES, 1):
        print(f"--- Test {i}/{len(TEST_CASES)} ---")
        success, result = run_single_test(organizer, test_case)
        results.append(result)
        if success:
            passed += 1
    
    # Summary
    print("=== Test Summary ===")
    print(f"Passed: {passed}/{len(TEST_CASES)}")
    print(f"Failed: {len(TEST_CASES) - passed}/{len(TEST_CASES)}")
    
    if passed == len(TEST_CASES):
        print("All tests passed! The AI system is working correctly.")
        return True
    else:
        print("Some tests failed. See details above.")
        # Save detailed results
        results_file = os.path.join('test_temp', 'test_results.json')
        with open(results_file, 'w') as f:
            json.dump(results, f, indent=2, default=str)
        print(f"📝 Detailed results saved to: {results_file}")
        return False

def cleanup():
    """Clean up test files."""
    try:
        import shutil
        if os.path.exists('test_temp'):
            shutil.rmtree('test_temp')
            print("🧹 Cleaned up test files")
    except Exception as e:
        print(f"Warning: Failed to clean up test files: {e}")

def main():
    """Main test function."""
    try:
        success = run_comprehensive_test()
        cleanup()
        return success
    except Exception as e:
        print(f"Test suite failed with exception: {e}")
        traceback.print_exc()
        cleanup()
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)