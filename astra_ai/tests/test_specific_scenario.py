#!/usr/bin/env python3
"""
Test script to validate the emotion tag generation for the specific scenario
"""

import sys
import os

# Add path to astra_ai module
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from astra_ai.memory.Mem0_ai_organizer import AIOrganizer

def test_specific_scenario():
    """Test the specific scenario from the user's context"""
    
    # Initialize organizer with minimal config
    config = {
        'organizer_enabled': False,  # Disable actual monitoring for testing
        'memory_file_path': 'astra_ai/Date/nova_ai_memory.json',
        'llm_enabled': False
    }

    organizer = AIOrganizer(config)

    # Test the specific scenario: "User likes watching anime during weekends"
    # Context: "User: I like to watch anime sometimes during the weekend."
    
    event = {
        'summary': 'User likes watching anime during weekends',
        'semantic_context': {},
        'emotional_context': {'sentiment': 'positive', 'emotional_intensity': 0.3, 'confidence': 0.85},
        'importance_score': 0.6,
        'category': 'personal_preferences'
    }

    print("Testing specific scenario:")
    print("Summary: User likes watching anime during weekends")
    print("Expected (from reference): ['watching', 'anime'] or ['watching', 'anime_interest']")
    print()

    try:
        tags = organizer._generate_emotion_tags(event)
        print(f"Generated tags: {tags}")
        print()
        
        # Check if important terms like 'anime' or 'watching' were captured
        has_anime = any('anime' in tag for tag in tags)
        has_watch = any('watch' in tag for tag in tags)
        
        print(f"Contains 'anime' related: {has_anime}")
        print(f"Contains 'watch' related: {has_watch}")
        
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()

    # Also test with context similar to the original user input
    print("\n" + "="*60)
    print("Testing with context similar to original input:")
    print("Context: I like to watch anime sometimes during the weekend")
    
    event2 = {
        'summary': 'I like to watch anime sometimes during the weekend',
        'semantic_context': {},
        'emotional_context': {'sentiment': 'positive', 'emotional_intensity': 0.3, 'confidence': 0.85},
        'importance_score': 0.6,
        'category': 'personal_preferences'
    }

    try:
        tags2 = organizer._generate_emotion_tags(event2)
        print(f"Generated tags: {tags2}")
        
        has_anime2 = any('anime' in tag for tag in tags2)
        has_watch2 = any('watch' in tag for tag in tags2)
        
        print(f"Contains 'anime' related: {has_anime2}")
        print(f"Contains 'watch' related: {has_watch2}")
        
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_specific_scenario()