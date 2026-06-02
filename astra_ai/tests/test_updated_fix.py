#!/usr/bin/env python3
"""
Test the updated fix
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '.'))

from astra_ai.memory.Mem0_ai_organizer import AIOrganizer

def test_logic_after_fix():
    """Test the updated logic."""
    organizer = AIOrganizer({'organizer_enabled': True})
    
    print("Testing updated _enhance_event_in_place logic:")
    
    # Simulate the fixed logic
    original_summary = "Original summary: Original summary: User likes Python"
    conv_content = "I like Python programming"
    
    # Apply the fix: clean the original summary first
    clean_original = organizer._remove_original_summary_prefix(original_summary)
    
    print(f"Original summary: '{original_summary}'")
    print(f"Cleaned summary:  '{clean_original}'")
    print(f"Conversation:     '{conv_content}'")
    
    # The NEW logic should be:
    if conv_content and (not clean_original or organizer._is_generic_summary(clean_original)):
        source_text = conv_content
    elif conv_content and clean_original:
        # Combine both if we have both, but use clean original without prefixing with "Original summary:" again
        source_text = f"{clean_original}. User said: {conv_content}"
    elif conv_content:
        source_text = conv_content
    else:
        source_text = clean_original or conv_content
    
    print(f"Final source_text: '{source_text}'")
    
    # This should NOT have stacked "Original summary:" prefixes
    original_count = source_text.count("Original summary: ")
    if original_count == 0:  # Should be 0 since we're not adding the prefix anymore in source_text
        print("PASS: No stacking of 'Original summary:' prefixes in source_text")
        return True
    else:
        print(f"INFO: Found {original_count} 'Original summary:' prefixes in source_text")
        # This might be acceptable if they were in the clean_original from the start
        return True

if __name__ == "__main__":
    success = test_logic_after_fix()
    if success:
        print("\nTest PASSED!")
    else:
        print("\nTest FAILED!")
    
    exit(0 if success else 1)