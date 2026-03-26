#!/usr/bin/env python3
"""
Test script for the AI Organizer LLM functionality
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

def create_test_memory_file(memory_file_path):
    """Create a test memory file with sample data."""
    # Create directory if needed
    os.makedirs(os.path.dirname(memory_file_path), exist_ok=True)
    
    # Create sample memory data
    memory_data = {
        "memory_events": [
            {
                "type": "ADD",
                "summary": "user said they love py programming",
                "timestamp": "2025-09-20T10:00:00.000000",
                "provenance": {}
            },
            {
                "type": "ADD",
                "summary": "user is from italy and wants to visit france next year",
                "timestamp": "2025-09-20T10:05:00.000000",
                "provenance": {}
            }
        ],
        "current_facts": {
            "user_identity_1": {
                "category": "user_identity",
                "value": "My name is Alex",
                "confidence": 0.9
            },
            "preference_1": {
                "category": "personal_preferences",
                "value": "I prefer short answers",
                "confidence": 0.8
            }
        },
        "conversation": [
            {
                "role": "user",
                "content": "I really love Python programming! It's so elegant.",
                "timestamp": "2025-09-20T10:00:00.000000"
            },
            {
                "role": "user",
                "content": "I'm from Italy and I'm planning to visit France next year for vacation.",
                "timestamp": "2025-09-20T10:05:00.000000"
            }
        ],
        "user": {
            "name": "Alex"
        }
    }
    
    # Write to file
    with open(memory_file_path, 'w') as f:
        json.dump(memory_data, f, indent=2)
    
    print(f"Created test memory file: {memory_file_path}")
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
    """Test the AI Organizer LLM functionality."""
    print("Testing AI Organizer LLM functionality...")
    
    # Configuration with LLM enabled
    memory_file_path = "test_data/nova_ai_memory_llm.json"
    config = {
        'organizer_enabled': True,
        'memory_file_path': memory_file_path,
        'check_interval': 0.5,
        'llm_enabled': True,
        'llm_api_key': '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',
        'llm_model': 'llama-3.3-70b-versatile'
    }
    
    # Create test data
    print("\n1. Creating test memory file...")
    original_data = create_test_memory_file(memory_file_path)
    
    # Initialize organizer
    print("\n2. Initializing AI Organizer with LLM...")
    organizer = AIOrganizer(config)
    
    # Process the existing events
    print("\n3. Processing existing events with LLM...")
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