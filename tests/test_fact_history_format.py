#!/usr/bin/env python3
"""
Test script to verify the fact_history output format
"""
import json
import os
from datetime import datetime
from astra_ai.memory.mem0_memory_system import NovaMemoryAI

def test_fact_history_format():
    print("Testing fact_history output format...")
    
    # Create a temporary memory file for testing
    test_file = "test_fact_history.json"
    
    # Initialize the memory system
    memory_ai = NovaMemoryAI(storage_file=test_file)
    
    # Simulate adding some memory events with Added_preference fields
    timestamp = datetime.now().isoformat()
    
    # Add some test events with Added_preference fields
    test_events = [
        {
            "type": "ADD",
            "summary": "User likes programming",
            "timestamp": timestamp,
            "Added_preference_likes": "Python programming",
            "confidence": 0.9
        },
        {
            "type": "ADD", 
            "summary": "User dislikes slow tools",
            "timestamp": timestamp,
            "Added_preference_dislikes": "slow development tools",
            "confidence": 0.85
        },
        {
            "type": "ADD",
            "summary": "User wants to avoid distractions",
            "timestamp": timestamp, 
            "Added_preference_avoid": "social media during work",
            "confidence": 0.8
        }
    ]
    
    # Add these events to memory_events
    memory_ai.data["memory_events"] = test_events
    
    print(f"Before conversion, memory_events count: {len(memory_ai.data.get('memory_events', []))}")
    
    # Process the conversion to unified format
    memory_ai.transform_fact_history_to_unified_format()
    
    # Save the data to file
    memory_ai.save_memory()
    
    # Reload the memory system to get the updated data
    memory_ai = NovaMemoryAI(storage_file=test_file)
    data = memory_ai.data
    
    print("Memory data loaded successfully")
    
    # Check if fact_history exists
    fact_history = data.get("fact_history", {})
    print(f"fact_history keys: {list(fact_history.keys())}")
    
    # Check personal_preferences structure
    personal_prefs = fact_history.get("personal_preferences", {})
    print(f"personal_preferences keys: {list(personal_prefs.keys())}")
    
    # Print the actual structure
    print("\nActual fact_history structure:")
    print(json.dumps({"fact_history": {"personal_preferences": personal_prefs}}, indent=2))
    
    # Check that the preferences were properly stored
    print("\nChecking preference categories:")
    
    for category, items in personal_prefs.items():
        if items:  # Only print categories that have items
            print(f"  {category}: {len(items)} items")
            for i, item in enumerate(items):
                print(f"    [{i}] {item}")
    
    # Clean up test file
    if os.path.exists(test_file):
        os.remove(test_file)
        print(f"\nCleaned up test file: {test_file}")
    
    return True

if __name__ == "__main__":
    print("Running fact_history format test...")
    test_fact_history_format()
    print("\n==================================================")
    print("SUMMARY:")
    print("Fact_history format test completed")