#!/usr/bin/env python3
"""
Simple test of unified preference implementation.
"""

import json
import os
from datetime import datetime
from typing import Dict, Any

# Import the memory system
from astra_ai.memory.mem0_memory_system import NovaMemoryAI

def test_unified_preference_implementation():
    """Test the unified preference implementation."""
    print("Testing Unified Preference Implementation")
    print("=" * 50)
    
    # Create sample data with Added_preference fields
    sample_data = {
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
                "semantic_context": "User expressed enjoyment in gaming activities"
            },
            {
                "type": "ADD", 
                "summary": "User dislikes spicy food",
                "timestamp": "2025-01-01T11:00:00",
                "Added_preference_dislikes": "spicy food",
                "confidence": 0.85,
                "semantic_context": "User expressed negative preference toward spicy cuisine"
            }
        ],
        "fact_history": {
            "user_name": "Alex",
            "user_age": 28,
            "user_occupation": "Software Developer"
        },
        "conversation": [],
        "sessions": {},
        "current_session": None
    }
    
    # Save to temporary file
    temp_file = "test_memory_simple.json"
    with open(temp_file, 'w') as f:
        json.dump(sample_data, f, indent=2)
    
    try:
        # Initialize memory system
        memory_system = NovaMemoryAI(temp_file)
        print("Memory system initialized successfully")
        
        # Show original Added_preference fields
        print("\nOriginal Added_preference fields:")
        for i, event in enumerate(memory_system.data.get("memory_events", [])):
            for key, value in event.items():
                if key.startswith("Added_preference_"):
                    print(f"  Event {i+1}: {key} = {value}")
        
        # Transform to unified format
        print("\nTransforming to unified format...")
        memory_system.transform_fact_history_to_unified_format()
        
        # Show unified structure
        print("\nUnified personal_preferences structure:")
        personal_prefs = memory_system.data.get("fact_history", {}).get("personal_preferences", {})
        for category, items in personal_prefs.items():
            if items:
                print(f"  {category}:")
                for item in items:
                    print(f"    - {item['item']} (score: {item['score']})")
        
        print("\nTest completed successfully!")
        
    except Exception as e:
        print(f"Error during test: {e}")
        import traceback
        traceback.print_exc()
        
    finally:
        # Clean up
        if os.path.exists(temp_file):
            os.remove(temp_file)

if __name__ == "__main__":
    test_unified_preference_implementation()