#!/usr/bin/env python3
"""
Debug test for the specific "weather" issue
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '.'))

# Import the AIOrganizer class
from astra_ai.memory.Mem0_ai_organizer import AIOrganizer

def debug_weather():
    """Debug the 'weather' issue."""
    # Create a basic config for testing
    config = {
        'organizer_enabled': False,  # Disable monitoring for testing
        'memory_file_path': 'test_memory.json',  # Use test file
        'check_interval': 1.0,
        'llm_enabled': False  # Disable LLM for consistent testing
    }
    
    # Create an instance of the organizer
    organizer = AIOrganizer(config)
    
    test_text = 'The weather is beautiful today.'
    print(f"Testing with: '{test_text}'")
    
    # Test semantic categories extraction
    semantic_cats = organizer._extract_semantic_categories(test_text)
    print(f"Semantic categories: {semantic_cats}")
    
    # Test token identification
    tokens = organizer._identify_salient_tokens(test_text)
    print(f"Salient tokens: {tokens}")
    
    # Test ranking
    ranked = organizer._rank_candidates_by_explicitness(test_text, tokens)
    print(f"Ranked candidates: {ranked}")
    
    # Full function
    result = organizer._derive_emotion_tags_from_context(test_text)
    print(f"Final result: {result}")

if __name__ == "__main__":
    debug_weather()