#!/usr/bin/env python3
"""
Test the exact scenario from the memory file
"""

import sys
import os

# Add path to astra_ai module
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from astra_ai.memory.Mem0_ai_organizer import AIOrganizer

def test_exact_scenario():
    """Test with the exact data from the memory file"""
    
    # Initialize organizer with minimal config
    config = {
        'organizer_enabled': False,  # Disable actual monitoring for testing
        'memory_file_path': 'astra_ai/Date/nova_ai_memory.json',
        'llm_enabled': False
    }

    organizer = AIOrganizer(config)

    # Test the exact scenario from the nova_ai_memory.json file
    print("Testing exact scenario from nova_ai_memory.json:")
    print("Context: User: I like to watch anime sometimes during the weekend.")
    print("Expected from reference: ['watching', 'anime']")
    print()

    # Test using the original context from user input
    event_from_context = {
        'summary': 'I like to watch anime sometimes during the weekend.',  # This is the original user input
        'semantic_context': {},
        'emotional_context': {'sentiment': 'positive', 'emotional_intensity': 0.3, 'confidence': 0.85},
        'importance_score': 0.6,
        'category': 'personal_preferences'
    }

    try:
        tags = organizer._generate_emotion_tags(event_from_context)
        print(f"Generated tags from original context: {tags}")
        
        # Check results
        has_anime = any('anime' in tag.lower() for tag in tags)
        has_watch_related = any('watch' in tag.lower() or 'watching' in tag.lower() for tag in tags)
        anime_variants = [tag for tag in tags if 'anime' in tag.lower()]
        watch_variants = [tag for tag in tags if 'watch' in tag.lower() or 'watching' in tag.lower()]
        
        print(f"Anime-related tags found: {anime_variants}")
        print(f"Watch-related tags found: {watch_variants}")
        print(f"Has anime content: {has_anime}")
        print(f"Has watch content: {has_watch_related}")
        
        if has_anime and has_watch_related:
            print("✓ SUCCESS: Found both anime and watching-related content!")
        else:
            print("o PARTIAL: Missing some expected content")
        
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()

    print("\n" + "="*60)
    
    # Test the enhanced summary version (as it might be processed currently)
    print("For comparison - testing with enhanced summary:")
    print("Summary: User is drawn to watch anime sometimes during the weekend. and finds it compelling.")
    
    event_from_summary = {
        'summary': 'User is drawn to watch anime sometimes during the weekend. and finds it compelling.',
        'semantic_context': {},
        'emotional_context': {'sentiment': 'positive', 'emotional_intensity': 0.3, 'confidence': 0.85},
        'importance_score': 0.6,
        'category': 'personal_preferences'
    }

    try:
        tags2 = organizer._generate_emotion_tags(event_from_summary)
        print(f"Generated tags from enhanced summary: {tags2}")
        
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_exact_scenario()