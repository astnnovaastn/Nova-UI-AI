#!/usr/bin/env python3
"""
Test script to verify the fix for generic summaries
"""

import json
import os
import sys
from pathlib import Path

# Add the project root to the path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from astra_ai.memory.Mem0_ai_organizer import AIOrganizer

def create_test_memory_file_with_generic_summary(memory_file_path):
    """Create a test memory file with generic summaries."""
    # Create directory if needed
    os.makedirs(os.path.dirname(memory_file_path), exist_ok=True)
    
    # Create sample memory data with generic summaries
    memory_data = {
        "memory_events": [
            {
                "type": "ADD",
                "summary": "Rich has added a preference, indicating he likes a particular topic, although the specific subject is not specified.",
                "timestamp": "2025-09-20T17:02:54.390261",
                "provenance": {}
            },
            {
                "type": "ADD",
                "summary": "User has a preference but subject is not specified",
                "timestamp": "2025-09-20T17:05:00.000000",
                "provenance": {}
            }
        ],
        "current_facts": {
            "user_identity_1": {
                "category": "user_identity",
                "value": "My name is Rich and I am a Python developer",
                "confidence": 0.9
            },
            "preference_1": {
                "category": "personal_preferences",
                "value": "I prefer clear and detailed explanations",
                "confidence": 0.85
            },
            "current_state_1": {
                "category": "current_state",
                "value": "Currently learning advanced Python techniques",
                "confidence": 0.8
            }
        },
        "conversation": [
            {
                "role": "user",
                "content": "Hi, I'm Rich. I'm a Python developer working on advanced techniques.",
                "timestamp": "2025-09-20T17:00:00.000000"
            },
            {
                "role": "assistant",
                "content": "Nice to meet you, Rich! How can I help with your Python learning?",
                "timestamp": "2025-09-20T17:00:30.000000"
            },
            {
                "role": "user",
                "content": "I really like learning about Python decorators and context managers.",
                "timestamp": "2025-09-20T17:02:54.390261"
            },
            {
                "role": "user",
                "content": "I'm interested in Python metaprogramming techniques.",
                "timestamp": "2025-09-20T17:05:00.000000"
            }
        ],
        "user": {
            "name": "Rich",
            "role": "Python developer"
        }
    }
    
    # Write to file
    with open(memory_file_path, 'w') as f:
        json.dump(memory_data, f, indent=2)
    
    print(f"Created test memory file with generic summaries: {memory_file_path}")
    return memory_data

def verify_enhanced_memory(memory_file_path):
    """Verify that the memory was enhanced correctly."""
    try:
        with open(memory_file_path, 'r') as f:
            memory_data = json.load(f)
            
        events = memory_data.get('memory_events', [])
        print(f"\nFound {len(events)} memory events:")
        
        for i, event in enumerate(events):
            print(f"\nEvent {i+1}:")
            print(f"  Summary: {event.get('summary', 'N/A')}")
            print(f"  Type: {event.get('type', 'N/A')}")
            provenance = event.get('provenance', {})
            print(f"  Enhanced in place: {provenance.get('enhanced_in_place', False)}")
            print(f"  Original summary: {provenance.get('original_summary', 'N/A')}")
            
        return memory_data
    except Exception as e:
        print(f"Error reading memory file: {e}")
        return None

def main():
    """Test the fix for generic summaries."""
    print("Testing fix for generic summaries...")
    
    # Configuration with LLM enabled
    memory_file_path = "test_data/nova_ai_memory_generic_test.json"
    config = {
        'organizer_enabled': True,
        'memory_file_path': memory_file_path,
        'check_interval': 0.5,
        'llm_enabled': True,
        'llm_api_key': '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',
        'llm_model': 'llama-3.3-70b-versatile'
    }
    
    # Create test data with generic summaries
    print("\n1. Creating test memory file with generic summaries...")
    original_data = create_test_memory_file_with_generic_summary(memory_file_path)
    
    # Initialize organizer
    print("\n2. Initializing AI Organizer with LLM...")
    organizer = AIOrganizer(config)
    
    # Process the existing events
    print("\n3. Processing existing events with enhanced LLM...")
    memory_data = organizer._load_memory_file()
    if memory_data:
        for i in range(len(memory_data.get('memory_events', []))):
            organizer._process_new_event(memory_data, i)
        organizer._save_memory_file(memory_data)
        print("Processed existing events")
    
    # Verify results
    print("\n4. Verifying enhanced memory...")
    enhanced_data = verify_enhanced_memory(memory_file_path)
    
    print("\nTest completed!")

if __name__ == "__main__":
    main()