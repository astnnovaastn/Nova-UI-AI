#!/usr/bin/env python3
"""
Test script to verify that emotion tags are being properly populated in the AI organizer.
"""
import json
import os
import sys

# Add the current directory to the Python path to import from the memory module
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

# Import the AIOrganizer class directly from the file
import importlib.util
spec = importlib.util.spec_from_file_location("Mem0_ai_organizer", 
    os.path.join(os.path.dirname(__file__), "astra_ai", "memory", "Mem0_ai_organizer.py"))
Mem0_ai_organizer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(Mem0_ai_organizer)

def test_emotion_tags():
    print("Testing emotion tags functionality...")
    
    # Create a basic config for the AI organizer
    config = {
        'organizer_enabled': False,  # Don't start monitoring, just use functions
        'memory_file_path': os.path.join('astra_ai', 'Date', 'nova_ai_memory.json'),
        'check_interval': 0.1,  # Very fast for testing
        'llm_enabled': False,  # Disable LLM for faster testing
        'llm_api_key': 'dummy_key',
        'llm_model': 'dummy_model'
    }
    
    # Create an instance of the organizer
    organizer = Mem0_ai_organizer.AIOrganizer(config)
    
    # Test the _analyze_emotion_tags function with various inputs
    test_cases = [
        ("I love trying new restaurants and cuisines", "personal_preferences", ["adventure", "curiosity", "food"]),
        ("I like to watch anime sometimes during the weekend", "personal_preferences", ["interest", "entertainment"]),
        ("I love Italian food, especially pasta", "personal_preferences", ["food"]),  # Love indicates enthusiasm, not just interest
        ("I usually go for morning walks", "activity_behavior", ["health", "habit"]),
        ("I always have coffee in the morning", "personal_preferences", ["food", "drink"]),
        ("I enjoy reading sci-fi novels", "personal_preferences", ["reading", "interest"]),
        ("Brandon Sanderson is my favorite author!", "personal_preferences", ["enthusiasm", "author_appreciation"]),
        ("I prefer dark roast coffee, black", "personal_preferences", ["preference", "taste"]),
    ]
    
    # Also test the comprehensive emotion analysis function
    print("\n--- Testing _generate_emotion_tags function ---")
    comprehensive_test_cases = [
        ("I love trying new restaurants and cuisines", ["adventure", "curiosity", "food"]),
        ("I like to watch anime sometimes during the weekend", ["interest", "entertainment"]),
        ("I love Italian food, especially pasta", ["food"]),  # Love indicates enthusiasm, not just interest
        ("I usually go for morning walks", ["health", "habit"]),
        ("I always have coffee in the morning", ["food", "drink"]),
        ("I enjoy reading sci-fi novels", ["reading", "interest"]),
        ("Brandon Sanderson is my favorite author!", ["enthusiasm", "author_appreciation"]),
        ("I prefer dark roast coffee, black", ["preference", "taste"]),
    ]
    
    for text, expected_tags in comprehensive_test_cases:
        result = organizer._generate_emotion_tags(text)
        emotion_tags = result.get('emotion_tags', [])
        print(f"Input: '{text}'")
        print(f"Result: {emotion_tags}")
        print(f"Full Analysis: {result}")
        print(f"Expected: {expected_tags}")
        
        # Check if all expected tags are present
        missing_tags = [tag for tag in expected_tags if tag not in emotion_tags]
        if missing_tags:
            print(f"[FAILED] Missing tags: {missing_tags}")
        else:
            print("[PASSED] All expected tags found")
        print("-" * 50)
    
    print("\n--- Testing _analyze_emotion_tags function ---")

    print("\n--- Testing _analyze_emotion_tags function ---")
    all_passed = True
    
    for text, category, expected_tags in test_cases:
        result = organizer._analyze_emotion_tags(text, category)
        print(f"Input: '{text}'")
        print(f"Category: '{category}'")
        print(f"Result: {result}")
        print(f"Expected: {expected_tags}")
        
        # Check if all expected tags are present
        missing_tags = [tag for tag in expected_tags if tag not in result]
        if missing_tags:
            print(f"[FAILED] Missing tags: {missing_tags}")
            all_passed = False
        else:
            print("[PASSED] All expected tags found")
        print("-" * 50)
    
    if all_passed:
        print("[PASSED] All tests passed!")
    else:
        print("[FAILED] Some tests failed!")
    
    # Also test the actual memory file if it exists
    memory_file_path = config['memory_file_path']
    if os.path.exists(memory_file_path):
        print(f"\n--- Testing actual memory file: {memory_file_path} ---")
        with open(memory_file_path, 'r') as f:
            memory_data = json.load(f)
        
        memory_events = memory_data.get('memory_engine', {}).get('memory_events', [])
        for event in memory_events:
            if event.get('type') == 'ADD':
                print(f"Event ID: {event.get('event_id')}")
                print(f"Summary: {event.get('summary')}")
                print(f"Emotional Context: {event.get('emotional_context', {})}")
                emotion_tags = event.get('emotional_context', {}).get('emotion_tags', [])
                print(f"Emotion Tags: {emotion_tags}")
                if emotion_tags:
                    print("[PASSED] Emotion tags found in ADD event")
                else:
                    print("[FAILED] No emotion tags found in ADD event")
                print("-" * 50)
    else:
        print(f"\nMemory file not found at: {memory_file_path}")
    
    return all_passed

if __name__ == "__main__":
    test_emotion_tags()