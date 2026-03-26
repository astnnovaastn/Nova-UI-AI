"""
Test script to verify the fixed emotion tag generation system.
Tests that tags are now 2-3 only and contextually relevant.
"""

import json
import sys
import os

# Add path to astra_ai
sys.path.insert(0, r'c:\Users\afian\OneDrive\Desktop\Astra_ai')

# Import the organizer
from astra_ai.memory.Mem0_ai_organizer import AIOrganizer, ORGANIZER_CONFIG

def test_emotion_tags():
    """Test the emotion tag generation on real JSON data."""
    
    # Load JSON
    json_path = r'c:\Users\afian\OneDrive\Desktop\Astra_ai\astra_ai\Date\nova_ai_memory.json'
    with open(json_path, 'r') as f:
        memory_data = json.load(f)
    
    # Initialize organizer
    organizer = AIOrganizer(ORGANIZER_CONFIG)
    
    # Get memory events
    memory_events = memory_data.get('memory_engine', {}).get('memory_events', [])
    
    print("\n" + "="*80)
    print("EMOTION TAG GENERATION TEST - FIXED VERSION")
    print("="*80)
    print(f"\nTesting {len(memory_events)} events from nova_ai_memory.json\n")
    
    test_cases = [
        ("User enjoys reading science fiction novels.", "Should be: ['science', 'fiction'] or ['reading', 'science']"),
        ("User finds watch anime sometimes during the weekend.", "Should be: ['anime', 'weekend']"),
        ("I'm going to Paris next week for a vacation.", "Should be: ['paris', 'vacation']"),
        ("User live in Milan, Italy, it's a beautiful city.", "Should be: ['milan', 'italy']"),
        ("I'm studying computer science and I love it.", "Should be: ['computer', 'science']"),
    ]
    
    print("TEST CASES:")
    print("-" * 80)
    
    for text, expected in test_cases:
        tags = organizer._extract_context_based_tags(text)
        tag_count = len(tags)
        print(f"\nText: {text}")
        print(f"Generated tags: {tags} (Count: {tag_count})")
        print(f"Expected: {expected}")
        
        # Check constraints
        is_valid = True
        issues = []
        
        if tag_count > 3:
            is_valid = False
            issues.append(f"[FAIL] TOO MANY TAGS ({tag_count} > 3)")
        elif tag_count == 0:
            issues.append(f"[WARN] NO TAGS GENERATED")
        
        # Check for meaningless tags
        meaningless = ['user', 'going', 'expressed', 'general', 'details', 'finds']
        found_meaningless = [t for t in tags if t in meaningless]
        if found_meaningless:
            is_valid = False
            issues.append(f"[FAIL] MEANINGLESS TAGS: {found_meaningless}")
        
        if is_valid and tag_count > 0:
            print(f"[PASS] Valid emotion tags")
        else:
            print(f"[FAIL]")
            for issue in issues:
                print(f"   {issue}")
    
    # Test on actual memory events
    print("\n" + "="*80)
    print("TESTING ON ACTUAL MEMORY EVENTS")
    print("="*80)
    
    valid_count = 0
    invalid_count = 0
    
    for idx, event in enumerate(memory_events[:5]):  # Test first 5
        summary = event.get('summary', '')
        context = event.get('semantic_context', '')
        
        # Generate tags using the new system
        tags = organizer._extract_context_based_tags(summary)
        tag_count = len(tags)
        
        print(f"\nEvent {idx + 1}:")
        print(f"Summary: {summary[:60]}...")
        print(f"Generated tags: {tags} (Count: {tag_count})")
        
        # Check validity
        if tag_count <= 3 and tag_count > 0:
            # Check for meaningless tags
            meaningless = ['user', 'going', 'expressed', 'general', 'details']
            if not any(t in meaningless for t in tags):
                print("[PASS] VALID")
                valid_count += 1
            else:
                print("[FAIL] Contains meaningless tags")
                invalid_count += 1
        elif tag_count == 0:
            print("[WARN] NO TAGS")
            invalid_count += 1
        else:
            print(f"[FAIL] Too many tags ({tag_count} > 3)")
            invalid_count += 1
    
    print("\n" + "="*80)
    print(f"SUMMARY: {valid_count} valid, {invalid_count} invalid")
    print("="*80)
    
    return valid_count > 0

if __name__ == "__main__":
    try:
        success = test_emotion_tags()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
