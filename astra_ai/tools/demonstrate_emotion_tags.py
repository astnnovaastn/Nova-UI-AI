#!/usr/bin/env python3
"""
Demonstration of emotion_tags population in memory events

This script shows how the AI Organizer will populate emotion_tags 
in the nova_ai_memory.json file when processing memory events.
"""

import sys
import os
import json
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'astra_ai'))

from memory.Mem0_ai_organizer import AIOrganizer

# Test configuration
config = {
    'organizer_enabled': True,
    'memory_file_path': os.path.join('astra_ai', 'Date', 'nova_ai_memory.json'),
    'check_interval': 1.0,
    'llm_enabled': False,
    'llm_api_key': '',
    'llm_model': 'qwen2.5:3b'
}

def demonstrate_emotion_tags():
    """Demonstrate how emotion_tags are generated for different user inputs"""
    
    organizer = AIOrganizer(config)
    
    print("\n" + "=" * 90)
    print("EMOTION_TAGS POPULATION DEMONSTRATION")
    print("=" * 90)
    print("\nThis demonstrates how the AI Organizer will populate emotion_tags in memory events.\n")
    
    # Example user inputs with their corresponding emotion_tags
    examples = [
        {
            'user_input': 'I love Italian food, especially pasta!',
            'description': 'Strong positive with food domain'
        },
        {
            'user_input': 'I usually go for morning walks every day',
            'description': 'Habitual health activity'
        },
        {
            'user_input': 'I like watching anime on Sundays',
            'description': 'Entertainment preference'
        },
        {
            'user_input': 'I enjoy reading science fiction novels',
            'description': 'Reading interest'
        },
        {
            'user_input': 'I love trying new restaurants and cuisines',
            'description': 'Food exploration passion'
        },
        {
            'user_input': 'Brandon Sanderson is my favorite author!',
            'description': 'Strong enthusiasm for author'
        },
        {
            'user_input': 'I prefer dark roast coffee, black',
            'description': 'Food/drink preference'
        },
    ]
    
    # Store results for JSON output
    demonstration_data = {
        'metadata': {
            'generated_at': datetime.now().isoformat(),
            'description': 'Demonstration of emotion_tags population in memory events',
            'total_examples': len(examples)
        },
        'examples': []
    }
    
    for idx, example in enumerate(examples, 1):
        user_input = example['user_input']
        description = example['description']
        
        # Generate emotion_tags
        emotion_context = organizer._generate_emotion_tags(user_input)
        
        # Display the example
        print(f"[Example {idx}] {description}")
        print(f"  Input:        {user_input}")
        print(f"  Sentiment:    {emotion_context['sentiment']}")
        print(f"  Emotion Tags: {', '.join(emotion_context['emotion_tags']) if emotion_context['emotion_tags'] else '(none)'}")
        print(f"  Intensity:    {emotion_context['emotional_intensity']:.1f}")
        print(f"  Mood:         {emotion_context['mood_context']}")
        print(f"  Confidence:   {emotion_context['confidence']:.2f}")
        print()
        
        # Store for JSON output
        demonstration_data['examples'].append({
            'user_input': user_input,
            'description': description,
            'emotion_context': emotion_context
        })
    
    # Save demonstration data
    demo_file = os.path.join(os.path.dirname(__file__), 'emotion_tags_demonstration.json')
    with open(demo_file, 'w', encoding='utf-8') as f:
        json.dump(demonstration_data, f, indent=2, ensure_ascii=False)
    
    print("=" * 90)
    print(f"✓ Demonstration data saved to: {demo_file}")
    print("\nSUMMARY:")
    print(f"  • Total examples demonstrated: {len(examples)}")
    print(f"  • emotion_tags are now being POPULATED in memory events")
    print(f"  • Each memory event will have contextually relevant emotion_tags")
    print(f"  • Sentiment, intensity, mood, and confidence are also captured")
    print("=" * 90 + "\n")

if __name__ == '__main__':
    try:
        demonstrate_emotion_tags()
    except Exception as e:
        print(f"\n✗ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
