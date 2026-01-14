#!/usr/bin/env python3
"""
Comprehensive test script for the enhanced AI Organizer
"""

import json
import time
import os
import sys
from datetime import datetime
from pathlib import Path

# Add the project root to the path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from astra_ai.memory.Mem0_ai_organizer import AIOrganizer

def create_comprehensive_test_memory_file(memory_file_path):
    """Create a comprehensive test memory file with rich data."""
    # Create directory if needed
    os.makedirs(os.path.dirname(memory_file_path), exist_ok=True)
    
    # Create comprehensive sample memory data
    memory_data = {
        "memory_events": [
            {
                "type": "ADD",
                "summary": "user wants to learn py programming",
                "timestamp": "2025-09-20T10:00:00.000000",
                "provenance": {}
            },
            {
                "type": "ADD",
                "summary": "what is the best way to structure a js app",
                "timestamp": "2025-09-20T10:05:00.000000",
                "provenance": {}
            },
            {
                "type": "ADD",
                "summary": "remind me to review the project tomorrow",
                "timestamp": "2025-09-20T10:10:00.000000",
                "provenance": {}
            }
        ],
        "current_facts": {
            "user_identity_1": {
                "category": "user_identity",
                "value": "My name is Alex and I am a software developer",
                "confidence": 0.9
            },
            "preference_1": {
                "category": "personal_preferences",
                "value": "I prefer clear and concise explanations",
                "confidence": 0.85
            },
            "current_state_1": {
                "category": "current_state",
                "value": "Currently working on a web application project",
                "confidence": 0.8
            },
            "goal_1": {
                "category": "long_term_goals",
                "value": "Want to become proficient in full-stack development",
                "confidence": 0.9
            }
        },
        "conversation": [
            {
                "role": "user",
                "content": "Hi, my name is Alex. I'm a software developer working on a web app.",
                "timestamp": "2025-09-20T09:55:00.000000"
            },
            {
                "role": "assistant",
                "content": "Nice to meet you, Alex! How can I help with your web application?",
                "timestamp": "2025-09-20T09:55:30.000000"
            },
            {
                "role": "user",
                "content": "I want to learn Python programming. Can you help?",
                "timestamp": "2025-09-20T10:00:00.000000"
            },
            {
                "role": "user",
                "content": "What is the best way to structure a JavaScript application?",
                "timestamp": "2025-09-20T10:05:00.000000"
            },
            {
                "role": "user",
                "content": "Can you remind me to review the project tomorrow?",
                "timestamp": "2025-09-20T10:10:00.000000"
            }
        ],
        "user": {
            "name": "Alex",
            "role": "software developer",
            "timezone": "America/New_York",
            "language": "en"
        }
    }
    
    # Write to file
    with open(memory_file_path, 'w') as f:
        json.dump(memory_data, f, indent=2)
    
    print(f"Created comprehensive test memory file: {memory_file_path}")
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

def test_user_info_extraction():
    """Test the enhanced user information extraction methods."""
    print("\n=== Testing User Information Extraction ===")
    
    # Test data
    memory_data = {
        "current_facts": {
            "user_identity_1": {
                "category": "user_identity",
                "value": "My name is Sarah and I am a designer",
                "confidence": 0.9
            },
            "preference_1": {
                "category": "personal_preferences",
                "value": "I prefer visual explanations",
                "confidence": 0.85
            }
        },
        "user": {
            "name": "Sarah",
            "role": "designer",
            "timezone": "Europe/London"
        }
    }
    
    config = {
        'organizer_enabled': True,
        'llm_enabled': False
    }
    
    organizer = AIOrganizer(config)
    
    # Test name extraction
    name = organizer._get_user_name(memory_data)
    print(f"Extracted user name: {name}")
    
    # Test preferences extraction
    preferences = organizer._get_user_preferences(memory_data)
    print(f"Extracted preferences: {preferences}")
    
    # Test comprehensive context
    context = organizer._get_comprehensive_user_context(memory_data)
    print(f"Comprehensive context: {context}")

def main():
    """Comprehensive test of the enhanced AI Organizer."""
    print("Testing enhanced AI Organizer functionality...")
    
    # Test user information extraction
    test_user_info_extraction()
    
    # Configuration with LLM enabled
    memory_file_path = "test_data/nova_ai_memory_comprehensive.json"
    config = {
        'organizer_enabled': True,
        'memory_file_path': memory_file_path,
        'check_interval': 0.5,
        'llm_enabled': True,
        'llm_api_key': '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',
        'llm_model': 'llama-3.3-70b-versatile'
    }
    
    # Create comprehensive test data
    print("\n1. Creating comprehensive test memory file...")
    original_data = create_comprehensive_test_memory_file(memory_file_path)
    
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
    
    print("\nComprehensive test completed!")

if __name__ == "__main__":
    main()