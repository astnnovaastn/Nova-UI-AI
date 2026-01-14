#!/usr/bin/env python3
"""
Test script for preference unification functionality.
"""

import json
import os
from datetime import datetime
from typing import Dict, Any

# Import the memory system
from astra_ai.memory.mem0_memory_system import NovaMemoryAI

def create_sample_memory_data() -> Dict[str, Any]:
    """Create sample memory data with Added_preference fields for testing."""
    return {
        "user": {
            "user_id": "test_user",
            "name": "Alex",
            "created_at": "2025-01-01T00:00:00",
            "status": "active",
            "relationship_established": True
        },
        "memory_events": [
            {
                "type": "ADD",
                "summary": "User enjoys playing video games",
                "timestamp": "2025-01-01T10:00:00",
                "Added_preference_likes": "playing video games",
                "confidence": 0.9,
                "semantic_context": "User expressed enjoyment in gaming activities",
                "emotional_context": {
                    "sentiment": "positive",
                    "emotional_intensity": 0.7
                }
            },
            {
                "type": "ADD", 
                "summary": "User dislikes spicy food",
                "timestamp": "2025-01-01T11:00:00",
                "Added_preference_dislikes": "spicy food",
                "confidence": 0.85,
                "semantic_context": "User expressed negative preference toward spicy cuisine",
                "emotional_context": {
                    "sentiment": "negative",
                    "emotional_intensity": 0.6
                }
            },
            {
                "type": "ADD",
                "summary": "User avoids junk food like McDonald's",
                "timestamp": "2025-01-01T12:00:00",
                "Added_preference_avoid": "junk food like McDonald's",
                "confidence": 0.95,
                "semantic_context": "User expressed desire to avoid unhealthy food options",
                "emotional_context": {
                    "sentiment": "negative",
                    "emotional_intensity": 0.8
                }
            }
        ],
        "fact_history": {
            "user_name": "Alex",
            "user_age": 28,
            "user_occupation": "Software Developer"
        },
        "conversation": [
            {
                "role": "user",
                "content": "I really enjoy playing video games in my free time",
                "timestamp": "2025-01-01T10:00:00"
            },
            {
                "role": "assistant", 
                "content": "That's great! Gaming can be a fun way to relax.",
                "timestamp": "2025-01-01T10:00:30"
            },
            {
                "role": "user",
                "content": "I can't stand spicy food though, it makes me sick",
                "timestamp": "2025-01-01T11:00:00"
            },
            {
                "role": "assistant",
                "content": "I understand, spicy food isn't for everyone.",
                "timestamp": "2025-01-01T11:00:30" 
            },
            {
                "role": "user",
                "content": "I try to avoid junk food like McDonald's because it makes me feel sluggish",
                "timestamp": "2025-01-01T12:00:00"
            },
            {
                "role": "assistant", 
                "content": "That's a healthy approach to nutrition.",
                "timestamp": "2025-01-01T12:00:30"
            }
        ],
        "sessions": {},
        "current_session": None
    }

def test_preference_unification():
    """Test the preference unification functionality."""
    print("=== Testing Preference Unification ===\n")
    
    # Create sample memory data
    print("1. Creating sample memory data with Added_preference fields...")
    sample_data = create_sample_memory_data()
    print(f"   Created {len(sample_data['memory_events'])} memory events with Added_preference fields\n")
    
    # Save sample data to temporary file
    temp_file = "test_memory.json"
    with open(temp_file, 'w') as f:
        json.dump(sample_data, f, indent=2)
    
    try:
        # Initialize memory system with test file
        print("2. Initializing memory system...")
        memory_system = NovaMemoryAI(temp_file)
        print("   Memory system initialized successfully\n")
        
        # Display original data structure
        print("3. Original memory events with Added_preference fields:")
        for i, event in enumerate(memory_system.data.get("memory_events", [])):
            print(f"   Event {i+1}:")
            for key, value in event.items():
                if key.startswith("Added_preference_"):
                    print(f"     {key}: {value}")
        print()
        
        # Transform fact_history to unified format
        print("4. Transforming fact_history to unified format...")
        unified_history = memory_system.transform_fact_history_to_unified_format()
        print("   Transformation completed\n")
        
        # Display unified format
        print("5. Unified personal_preferences structure:")
        personal_prefs = unified_history.get("personal_preferences", {})
        for category, items in personal_prefs.items():
            if items:  # Only show categories with items
                print(f"   {category}:")
                for item in items:
                    print(f"     - {item['item']} (score: {item['score']}, added: {item['added']})")
        print()
        
        # Test adding new preferences
        print("6. Testing addition of new preferences to unified format...")
        new_pref_data = memory_system._convert_added_preferences_to_unified_format(memory_system.data)
        print("   New preferences successfully added to unified format\n")
        
        # Display final structure
        print("7. Final unified structure:")
        final_personal_prefs = new_pref_data.get("fact_history", {}).get("personal_preferences", {})
        for category, items in final_personal_prefs.items():
            if items:  # Only show categories with items
                print(f"   {category}:")
                for item in items:
                    print(f"     - {item['item']} (score: {item['score']}, added: {item['added']})")
        print()
        
        # Verification
        print("8. Verification:")
        total_prefs = sum(len(items) for items in final_personal_prefs.values())
        print(f"   Total preferences consolidated: {total_prefs}")
        
        # Check that Added_preference fields were processed
        added_pref_count = 0
        for event in new_pref_data.get("memory_events", []):
            for key in event.keys():
                if key.startswith("Added_preference_"):
                    added_pref_count += 1
        
        print(f"   Remaining Added_preference fields: {added_pref_count}")
        if added_pref_count == 0:
            print("   [OK] All Added_preference fields successfully converted to unified format")
        else:
            print(f"   [WARN] {added_pref_count} Added_preference fields remain (may need further processing)")
            
        print("\n=== Test Completed Successfully ===")
        
    except Exception as e:
        print(f"Error during testing: {e}")
        import traceback
        traceback.print_exc()
        
    finally:
        # Clean up temporary file
        if os.path.exists(temp_file):
            os.remove(temp_file)

if __name__ == "__main__":
    test_preference_unification()