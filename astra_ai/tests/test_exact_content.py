#!/usr/bin/env python3
"""
Test script to verify the system only writes what the user actually said
"""

import json
import os
import sys
from pathlib import Path

# Add the project root to the path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from astra_ai.memory.Mem0_ai_organizer import AIOrganizer

def create_test_memory_file_exact_content(memory_file_path):
    """Create a test memory file with exact user content."""
    # Create directory if needed
    os.makedirs(os.path.dirname(memory_file_path), exist_ok=True)
    
    # Create sample memory data with exact user statements
    memory_data = {
        "memory_events": [
            {
                "type": "ADD",
                "summary": "user said something about programming",
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
                "value": "My name is Sarah and I am a developer",
                "confidence": 0.9
            }
        },
        "conversation": [
            {
                "role": "user",
                "content": "Hi, I'm Sarah. I work as a web developer.",
                "timestamp": "2025-09-20T17:00:00.000000"
            },
            {
                "role": "assistant",
                "content": "Nice to meet you, Sarah! What kind of web development do you do?",
                "timestamp": "2025-09-20T17:00:30.000000"
            },
            {
                "role": "user",
                "content": "I really enjoy working with React and building user interfaces.",
                "timestamp": "2025-09-20T17:02:54.390261"
            },
            {
                "role": "user",
                "content": "I'm also interested in learning more about state management.",
                "timestamp": "2025-09-20T17:05:00.000000"
            }
        ],
        "user": {
            "name": "Sarah"
        }
    }
    
    # Write to file
    with open(memory_file_path, 'w') as f:
        json.dump(memory_data, f, indent=2)
    
    print(f"Created test memory file with exact user content: {memory_file_path}")
    return memory_data

def verify_enhanced_memory_exact_content(memory_file_path):
    """Verify that the memory was enhanced with exact user content."""
    try:
        with open(memory_file_path, 'r', encoding='utf-8') as f:
            memory_data = json.load(f)
            
        events = memory_data.get('memory_events', [])
        print(f"\nFound {len(events)} memory events:")
        
        for i, event in enumerate(events):
            print(f"\nEvent {i+1}:")
            summary = event.get('summary', 'N/A')
            original = event.get('provenance', {}).get('original_summary', 'N/A')
            print(f"  Summary: {summary}")
            print(f"  Type: {event.get('type', 'N/A')}")
            print(f"  Enhanced in place: {event.get('provenance', {}).get('enhanced_in_place', False)}")
            print(f"  Original summary: {original}")
            
            # Check if the summary reflects what the user actually said
            summary_lower = summary.lower()
            original_lower = original.lower()
            
            # Make sure it's not generic
            if 'not specified' in summary_lower or 'particular topic' in summary_lower:
                print(f"  WARNING: Still contains generic language!")
            elif 'sarah' in summary_lower and ('programming' in summary_lower or 'management' in summary_lower):
                print(f"  GOOD: Reflects user's actual statements")
            else:
                print(f"  CHECK: Verify this accurately reflects user content")
            
        return memory_data
    except Exception as e:
        print(f"Error reading memory file: {e}")
        return None

def test_rule_based_enhancement():
    """Test the rule-based enhancement with exact content."""
    print("\n=== Testing Rule-Based Enhancement ===")
    
    config = {
        'organizer_enabled': True,
        'llm_enabled': False  # Disable LLM to test rule-based only
    }
    
    organizer = AIOrganizer(config)
    
    # Test cases that should only improve clarity, not add assumptions
    test_cases = [
        "user said they like py programming",
        "what is js",
        "remind me to do X",
        "i enjoy working with react"
    ]
    
    user_name = "Alex"
    
    for test_text in test_cases:
        enhanced = organizer._apply_enhancements(test_text, user_name, {})
        print(f"  Original: '{test_text}'")
        print(f"  Enhanced: '{enhanced}'")
        print()

def main():
    """Test that the system only writes what the user actually said."""
    print("Testing that system only writes what user actually said...")
    
    # Test rule-based enhancement first
    test_rule_based_enhancement()
    
    # Configuration with LLM enabled
    memory_file_path = "test_data/nova_ai_memory_exact_content_test.json"
    config = {
        'organizer_enabled': True,
        'memory_file_path': memory_file_path,
        'check_interval': 0.5,
        'llm_enabled': True,
        'llm_api_key': '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',
        'llm_model': 'llama-3.3-70b-versatile'
    }
    
    # Create test data with exact user content
    print("\n1. Creating test memory file with exact user content...")
    original_data = create_test_memory_file_exact_content(memory_file_path)
    
    # Initialize organizer
    print("\n2. Initializing AI Organizer with LLM...")
    organizer = AIOrganizer(config)
    
    # Process the existing events
    print("\n3. Processing existing events with precise LLM...")
    memory_data = organizer._load_memory_file()
    if memory_data:
        for i in range(len(memory_data.get('memory_events', []))):
            organizer._process_new_event(memory_data, i)
        organizer._save_memory_file(memory_data)
        print("Processed existing events")
    
    # Verify results
    print("\n4. Verifying enhanced memory reflects actual user content...")
    enhanced_data = verify_enhanced_memory_exact_content(memory_file_path)
    
    print("\nTest completed!")

if __name__ == "__main__":
    main()