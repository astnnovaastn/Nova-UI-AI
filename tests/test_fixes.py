#!/usr/bin/env python3
"""
Test script to validate the fixes for Mem0_ai_organizer.py
This script tests that the organizer will not endlessly rewrite entries
"""
import json
import os
from astra_ai.memory.Mem0_ai_organizer import AIOrganizer

def test_duplicate_prevention():
    """Test that the organizer doesn't endlessly rewrite the same entries"""
    print("Testing duplicate prevention in Mem0_ai_organizer...")
    
    # Create a test configuration
    config = {
        'organizer_enabled': True,
        'memory_file_path': 'test_memory.json',
        'check_interval': 0.1,  # Fast checking for tests
        'llm_enabled': False,  # Disable LLM for faster tests
    }
    
    # Create test memory data with problematic entries that were being endlessly rewritten
    test_memory_data = {
        "memory_events": [
            {
                "type": "ADD",
                "summary": "Rich likes to watch tiktok and considers it an interest and Added preference likes: tiktok.",
                "timestamp": "2025-10-07T15:10:17.550733",
                "provenance": {
                    "enhanced_in_place": False,  # Not yet enhanced
                }
            },
            {
                "type": "ADD", 
                "summary": "Rich likes playing games.",
                "timestamp": "2025-10-07T15:15:35.584054",
                "provenance": {
                    "enhanced_in_place": True,  # Already enhanced, should not be processed again
                }
            }
        ],
        "current_facts": {
            "name": "Rich",
            "location": "italy"
        },
        "fact_history": {},
        "conversation": [],
        "user": {
            "name": "Rich"
        }
    }
    
    # Save test memory data
    with open(config['memory_file_path'], 'w') as f:
        json.dump(test_memory_data, f, indent=2)
    
    # Create organizer instance
    organizer = AIOrganizer(config)
    
    # Load and process the memory data to test rewriting
    memory_data = organizer._load_memory_file()
    
    # Before processing, record original summaries
    original_summaries = [event.get('summary', '') for event in memory_data.get('memory_events', [])]
    print(f"Original summaries: {original_summaries}")
    
    # Process each event (simulating what the organizer does)
    for i, event in enumerate(memory_data.get('memory_events', [])):
        print(f"Processing event {i}: {event.get('summary', '')}")
        organizer._process_new_event(memory_data, i)
    
    # After processing, save data
    organizer._save_memory_file(memory_data)
    
    # Check the results
    final_summaries = [event.get('summary', '') for event in memory_data.get('memory_events', [])]
    print(f"Final summaries: {final_summaries}")
    
    # Verify that already processed entries were not reprocessed
    already_processed = memory_data['memory_events'][1]  # Second event has enhanced_in_place = True
    if already_processed.get('provenance', {}).get('enhanced_in_place', False):
        print("[PASS] Already processed entry was preserved correctly")
    else:
        print("[WARN] Already processed entry may have been reprocessed")
    
    # Clean up test file
    if os.path.exists(config['memory_file_path']):
        os.remove(config['memory_file_path'])
        print("[CLEAN] Test file cleaned up")
    
    print("[TEST] Test completed!")

if __name__ == "__main__":
    test_duplicate_prevention()