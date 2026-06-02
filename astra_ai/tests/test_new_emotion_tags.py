#!/usr/bin/env python3
"""
Test script to validate the new emotion tag generation functionality with various examples
"""

import sys
import os

# Add path to astra_ai module
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from astra_ai.memory.Mem0_ai_organizer import AIOrganizer

def test_new_emotion_tag_generation():
    """Test the new emotion tag generation method with various examples"""
    
    # Initialize organizer with minimal config
    config = {
        'organizer_enabled': False,  # Disable actual monitoring for testing
        'memory_file_path': 'astra_ai/Date/nova_ai_memory.json',
        'llm_enabled': False
    }

    organizer = AIOrganizer(config)

    # Test cases
    test_cases = [
        {
            'summary': 'User enjoys reading science fiction novels',
            'emotional_context': {'sentiment': 'positive', 'emotional_intensity': 0.6},
            'category': 'personal_preferences'
        },
        {
            'summary': 'I usually walk every morning',
            'emotional_context': {'sentiment': 'neutral', 'emotional_intensity': 0.3},
            'category': 'activity_behavior'
        },
        {
            'summary': 'I absolutely love Italian cuisine especially pasta',
            'emotional_context': {'sentiment': 'positive', 'emotional_intensity': 0.9},
            'category': 'personal_preferences'
        },
        {
            'summary': 'My name is Alex',
            'emotional_context': {'sentiment': 'neutral', 'emotional_intensity': 0.2},
            'category': 'user_identity'
        }
    ]

    print("Testing new emotion tag generation method:")
    print("="*60)

    for i, test_case in enumerate(test_cases):
        event = {
            'summary': test_case['summary'],
            'semantic_context': {},
            'emotional_context': test_case['emotional_context'],
            'importance_score': 0.5,
            'category': test_case['category']
        }

        try:
            tags = organizer._generate_emotion_tags(event)
            print(f"Test {i+1}:")
            print(f"  Summary: {test_case['summary']}")
            print(f"  Category: {test_case['category']}")
            print(f"  Generated tags: {tags}")
            print()
        except Exception as e:
            print(f"Error in test {i+1}: {str(e)}")
            import traceback
            traceback.print_exc()
            print()

if __name__ == '__main__':
    test_new_emotion_tag_generation()