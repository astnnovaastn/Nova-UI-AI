#!/usr/bin/env python3
"""
Test script to verify that the updated rewrite functionality meets all requirements.
"""
import sys
import os
from datetime import datetime

# Add the astra_ai directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '.'))

from astra_ai.memory.Mem0_ai_organizer import AIOrganizer

def test_validation_before_rewrite():
    """Test validation before rewriting to handle ambiguous content."""
    print("=" * 60)
    print("TEST 1: VALIDATION BEFORE REWRITING")
    print("=" * 60)
    
    config = {
        'organizer_enabled': False,
        'memory_file_path': os.path.join('astra_ai', 'Date', 'nova_ai_memory.json'),
        'check_interval': 1.0,
        'llm_enabled': False
    }
    
    organizer = AIOrganizer(config)
    user_name = "Nemzz"
    
    # Test case 1: "Added preference likes: like"
    print("\nTest 1.1: 'Added preference likes: like'")
    result1 = organizer._rewrite_memory_entry("Added preference likes: like", "User mentioned preferences", user_name)
    expected1 = "Nemzz expressed a general preference, but details are unclear."
    print(f"Result:  '{result1}'")
    print(f"Expected: '{expected1}'")
    print(f"✓ PASS" if expected1 in result1 else "✗ FAIL")
    
    # Test case 2: "Added preference likes: 2pac"
    print("\nTest 1.2: 'Added preference likes: 2pac'")
    result2 = organizer._rewrite_memory_entry("Added preference likes: 2pac", "User mentioned music preferences", user_name)
    print(f"Result:  '{result2}'")
    print("✓ PASS" if "2pac" in result2 and "enjoy" in result2.lower() else "✗ FAIL")
    
    # Test case 3: Valid content should not be affected
    print("\nTest 1.3: Valid content")
    result3 = organizer._rewrite_memory_entry("Added preference likes: Python programming", "User mentioned coding interests", user_name)
    print(f"Result:  '{result3}'")
    print("✓ PASS" if "Python" in result3 and "likes" in result3 else "✗ FAIL")

def test_deduplication_and_merging():
    """Test deduplication and merging logic."""
    print("\n" + "=" * 60)
    print("TEST 2: DEDUPLICATION AND MERGING")
    print("=" * 60)
    
    config = {
        'organizer_enabled': False,
        'memory_file_path': os.path.join('astra_ai', 'Date', 'nova_ai_memory.json'),
        'check_interval': 1.0,
        'llm_enabled': False
    }
    
    organizer = AIOrganizer(config)
    user_name = "Nemzz"
    
    # Test case 1: Duplicate detection
    print("\nTest 2.1: Duplicate content detection")
    summary1 = "Nemzz likes Python programming"
    summary2 = "Nemzz likes Python programming"
    
    # Test similarity detection
    is_similar = organizer._is_similar_content(summary1.lower(), summary2.lower(), user_name)
    print(f"Summary 1: '{summary1}'")
    print(f"Summary 2: '{summary2}'")
    print(f"Similar: {is_similar}")
    print("✓ PASS" if is_similar else "✗ FAIL")
    
    # Test case 2: Core content extraction
    print("\nTest 2.2: Core content extraction")
    core_content = organizer._extract_core_content("Nemzz likes Python programming and considers it an interest")
    print(f"Core content: '{core_content}'")
    print("✓ PASS" if "Python programming" in core_content else "✗ FAIL")

def test_rewrite_rules():
    """Test rewrite rules."""
    print("\n" + "=" * 60)
    print("TEST 3: REWRITE RULES")
    print("=" * 60)
    
    config = {
        'organizer_enabled': False,
        'memory_file_path': os.path.join('astra_ai', 'Date', 'nova_ai_memory.json'),
        'check_interval': 1.0,
        'llm_enabled': False
    }
    
    organizer = AIOrganizer(config)
    user_name = "Nemzz"
    
    # Test case 1: Third person conversion
    print("\nTest 3.1: Third person conversion")
    result1 = organizer._rewrite_memory_entry("Added preference likes: the name nemzz and enjoys the name nemzz and enjoys the name nemzz...", "User mentioned name preferences", user_name)
    print(f"Result:  '{result1}'")
    print("✓ PASS" if user_name in result1 and "likes" in result1.lower() else "✗ FAIL")
    
    # Test case 2: Single clean fact
    print("\nTest 3.2: Single clean fact")
    sentences = result1.split('.')
    sentence_count = len([s for s in sentences if s.strip()])
    print(f"Sentence count: {sentence_count}")
    print("✓ PASS" if sentence_count <= 2 else "✗ FAIL")
    
    # Test case 3: No repeated phrases
    print("\nTest 3.3: No repeated phrases")
    has_repeats = "enjoys the name nemzz" in result1 and result1.count("enjoys the name nemzz") > 1
    print(f"Has repeats: {has_repeats}")
    print("✓ PASS" if not has_repeats else "✗ FAIL")

def test_stop_rules():
    """Test stop rules to prevent endless rewriting loops."""
    print("\n" + "=" * 60)
    print("TEST 4: STOP RULES")
    print("=" * 60)
    
    config = {
        'organizer_enabled': False,
        'memory_file_path': os.path.join('astra_ai', 'Date', 'nova_ai_memory.json'),
        'check_interval': 1.0,
        'llm_enabled': False
    }
    
    organizer = AIOrganizer(config)
    user_name = "Nemzz"
    
    # Create a mock event that's already been enhanced
    event = {
        'summary': 'Nemzz likes Python programming',
        'type': 'ADD',
        'timestamp': datetime.now().isoformat(),
        'provenance': {
            'enhanced_in_place': True,
            'enhanced_at': datetime.now().isoformat()
        }
    }
    
    # Create mock memory data
    memory_data = {
        'memory_events': [event],
        'current_facts': {},
        'user': {'name': user_name}
    }
    
    # Create mock source info
    source_info = {
        'source_type': 'conversation',
        'context': 'User mentioned interests',
        'source_details': 'General conversation'
    }
    
    print("\nTest 4.1: Event with recent enhancement")
    original_summary = event['summary']
    
    # Call enhance_event_in_place - it should return early due to stop rules
    organizer._enhance_event_in_place(event, None, memory_data, source_info)
    
    # Summary should remain unchanged since it was recently enhanced
    new_summary = event['summary']
    print(f"Original: '{original_summary}'")
    print(f"After enhancement: '{new_summary}'")
    print("✓ PASS" if original_summary == new_summary else "✗ FAIL")

def test_example_transformations():
    """Test the specific example transformations from requirements."""
    print("\n" + "=" * 60)
    print("TEST 5: EXAMPLE TRANSFORMATIONS")
    print("=" * 60)
    
    config = {
        'organizer_enabled': False,
        'memory_file_path': os.path.join('astra_ai', 'Date', 'nova_ai_memory.json'),
        'check_interval': 1.0,
        'llm_enabled': False
    }
    
    organizer = AIOrganizer(config)
    user_name = "Nemzz"
    
    # Test case 1: "Added preference likes: 2pac"
    print("\nTest 5.1: 'Added preference likes: 2pac'")
    result1 = organizer._rewrite_memory_entry("Added preference likes: 2pac", "User mentioned music preferences", user_name)
    print(f"Input:  'Added preference likes: 2pac'")
    print(f"Output: '{result1}'")
    print("✓ PASS" if "2pac" in result1 and "enjoy" in result1.lower() else "✗ FAIL")
    
    # Test case 2: "Added preference likes: like"
    print("\nTest 5.2: 'Added preference likes: like'")
    result2 = organizer._rewrite_memory_entry("Added preference likes: like", "User mentioned preferences", user_name)
    expected2 = "Nemzz expressed a general preference, but details are unclear."
    print(f"Input:  'Added preference likes: like'")
    print(f"Output: '{result2}'")
    print("✓ PASS" if expected2 in result2 else "✗ FAIL")
    
    # Test case 3: Duplicate pattern with "the name nemzz"
    print("\nTest 5.3: Duplicate pattern with 'the name nemzz'")
    result3 = organizer._rewrite_memory_entry("Added preference likes: the name nemzz and enjoys the name nemzz and enjoys the name nemzz...", "User mentioned name preferences", user_name)
    print(f"Input:  'Added preference likes: the name nemzz and enjoys the name nemzz and enjoys the name nemzz...'")
    print(f"Output: '{result3}'")
    print("✓ PASS" if "name nemzz" in result3 and "personal preference" in result3.lower() else "✗ FAIL")

def run_all_tests():
    """Run all tests."""
    print("Testing updated Mem0_ai_organizer rewrite functionality...")
    print("=" * 80)
    
    test_validation_before_rewrite()
    test_deduplication_and_merging()
    test_rewrite_rules()
    test_stop_rules()
    test_example_transformations()
    
    print("\n" + "=" * 80)
    print("ALL TESTS COMPLETED")
    print("=" * 80)

if __name__ == "__main__":
    run_all_tests()