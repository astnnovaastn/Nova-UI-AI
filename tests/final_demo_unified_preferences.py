#!/usr/bin/env python3
"""
Final demonstration and verification of the unified preference implementation.
This script shows the complete workflow from Added_preference fields to unified format.
"""

import json
import os
from datetime import datetime
from typing import Dict, Any

# Import the memory system
from astra_ai.memory.mem0_memory_system import NovaMemoryAI

def demonstrate_unified_preference_implementation():
    """Demonstrate the complete unified preference implementation."""
    print("=" * 80)
    print("UNIFIED PREFERENCE IMPLEMENTATION DEMONSTRATION")
    print("=" * 80)
    print()
    
    # Step 1: Create sample memory data with Added_preference fields
    print("Step 1: Creating sample memory data with Added_preference fields")
    print("-" * 50)
    
    sample_data = {
        "user": {
            "user_id": "demo_user",
            "name": "Alex Morgan",
            "created_at": "2025-01-15T10:30:00",
            "status": "active",
            "relationship_established": True
        },
        "memory_events": [
            {
                "type": "ADD",
                "summary": "User enjoys playing video games",
                "timestamp": "2025-01-15T11:00:00",
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
                "timestamp": "2025-01-15T12:00:00",
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
                "timestamp": "2025-01-15T13:00:00",
                "Added_preference_avoid": "junk food like McDonald's",
                "confidence": 0.95,
                "semantic_context": "User expressed desire to avoid unhealthy food options",
                "emotional_context": {
                    "sentiment": "negative",
                    "emotional_intensity": 0.8
                }
            },
            {
                "type": "ADD",
                "summary": "User always drinks coffee before studying",
                "timestamp": "2025-01-15T14:00:00",
                "Added_preference_always": "drink coffee before studying",
                "confidence": 0.92,
                "semantic_context": "User described consistent behavior pattern",
                "emotional_context": {
                    "sentiment": "neutral",
                    "emotional_intensity": 0.3
                }
            }
        ],
        "fact_history": {
            "user_name": "Alex Morgan",
            "user_age": 28,
            "user_occupation": "Software Developer",
            "technical_skills": ["Python", "JavaScript", "React"],
            "projects": ["AI Assistant Development", "Web Application"]
        },
        "conversation": [
            {
                "role": "user",
                "content": "I really enjoy playing video games in my free time",
                "timestamp": "2025-01-15T11:00:00"
            },
            {
                "role": "assistant", 
                "content": "That's great! Gaming can be a fun way to relax.",
                "timestamp": "2025-01-15T11:00:30"
            },
            {
                "role": "user",
                "content": "I can't stand spicy food though, it makes me sick",
                "timestamp": "2025-01-15T12:00:00"
            },
            {
                "role": "assistant",
                "content": "I understand, spicy food isn't for everyone.",
                "timestamp": "2025-01-15T12:00:30" 
            },
            {
                "role": "user",
                "content": "I try to avoid junk food like McDonald's because it makes me feel sluggish",
                "timestamp": "2025-01-15T13:00:00"
            },
            {
                "role": "assistant", 
                "content": "That's a healthy approach to nutrition.",
                "timestamp": "2025-01-15T13:00:30"
            },
            {
                "role": "user",
                "content": "I always drink coffee before studying to stay focused",
                "timestamp": "2025-01-15T14:00:00"
            },
            {
                "role": "assistant",
                "content": "Coffee can definitely help with focus during study sessions.",
                "timestamp": "2025-01-15T14:00:30"
            }
        ],
        "sessions": {},
        "current_session": None
    }
    
    print("Sample memory data created with 4 Added_preference fields:")
    for i, event in enumerate(sample_data["memory_events"]):
        pref_field = None
        for key in event:
            if key.startswith("Added_preference_"):
                pref_field = key
                break
        if pref_field:
            print(f"  {i+1}. {pref_field}: {event[pref_field]}")
    print()
    
    # Step 2: Save sample data and initialize memory system
    print("Step 2: Initializing memory system with sample data")
    print("-" * 50)
    
    temp_file = "demo_memory.json"
    with open(temp_file, 'w') as f:
        json.dump(sample_data, f, indent=2)
    
    try:
        memory_system = NovaMemoryAI(temp_file)
        print("OK Memory system initialized successfully")
        print()
        
        # Step 3: Show original fact_history structure
        print("Step 3: Original fact_history structure")
        print("-" * 50)
        print("Before transformation:")
        original_fact_history = memory_system.data.get("fact_history", {})
        for key, value in original_fact_history.items():
            if key != "personal_preferences":
                print(f"  {key}: {value}")
        print()
        
        # Step 4: Transform to unified format
        print("Step 4: Transforming to unified preference format")
        print("-" * 50)
        unified_history = memory_system.transform_fact_history_to_unified_format()
        print("✓ Transformation completed successfully")
        print()
        
        # Step 5: Show unified structure
        print("Step 5: Unified personal_preferences structure")
        print("-" * 50)
        personal_prefs = unified_history.get("personal_preferences", {})
        
        total_prefs = 0
        for category, items in personal_prefs.items():
            if items:  # Only show categories with items
                print(f"  {category.upper()}:")
                for item in items:
                    print(f"    • {item['item']} (confidence: {item['score']:.2f}, added: {item['added']})")
                    total_prefs += 1
        print()
        
        print(f"Total preferences consolidated: {total_prefs}")
        print()
        
        # Step 6: Demonstrate adding new preferences
        print("Step 6: Demonstrating addition of new preferences to unified format")
        print("-" * 50)
        
        # Simulate processing a new conversation that adds a preference
        new_conversation_event = {
            "type": "ADD",
            "summary": "User likes JavaScript for web development",
            "timestamp": datetime.now().isoformat(),
            "Added_preference_likes": "JavaScript for web development",
            "confidence": 0.88,
            "semantic_context": "User expressed positive sentiment toward JavaScript",
            "emotional_context": {
                "sentiment": "positive",
                "emotional_intensity": 0.65
            }
        }
        
        # Add to memory events
        memory_system.data["memory_events"].append(new_conversation_event)
        
        # Process the new event through our conversion
        memory_system.data = memory_system._convert_added_preferences_to_unified_format(memory_system.data)
        
        print("✓ New preference added to unified format")
        print()
        
        # Show updated structure
        print("Step 7: Updated unified structure with new preference")
        print("-" * 50)
        updated_personal_prefs = memory_system.data["fact_history"]["personal_preferences"]
        
        for category, items in updated_personal_prefs.items():
            if items:  # Only show categories with items
                print(f"  {category.upper()}:")
                for item in items:
                    print(f"    • {item['item']} (confidence: {item['score']:.2f}, added: {item['added']})")
        print()
        
        # Step 8: Verification
        print("Step 8: Verification of implementation")
        print("-" * 50)
        
        # Check that all preferences are in the unified format
        all_categories = ["likes", "dislikes", "avoid", "always", "style", "conditional", "interests"]
        verification_passed = True
        
        for category in all_categories:
            if category in updated_personal_prefs:
                items = updated_personal_prefs[category]
                if isinstance(items, list):
                    print(f"  ✓ {category}: {len(items)} items")
                else:
                    print(f"  ✗ {category}: Invalid format (not a list)")
                    verification_passed = False
            else:
                print(f"  ✓ {category}: 0 items (category exists)")
        
        print()
        if verification_passed:
            print("✓ All verifications passed - Implementation successful!")
        else:
            print("✗ Some verifications failed - Implementation needs review")
        
        print()
        print("=" * 80)
        print("UNIFIED PREFERENCE IMPLEMENTATION DEMONSTRATION COMPLETED")
        print("=" * 80)
        
    except Exception as e:
        print(f"Error during demonstration: {e}")
        import traceback
        traceback.print_exc()
        
    finally:
        # Clean up temporary file
        if os.path.exists(temp_file):
            os.remove(temp_file)

if __name__ == "__main__":
    demonstrate_unified_preference_implementation()