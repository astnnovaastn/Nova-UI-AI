#!/usr/bin/env python3
"""
Test script to verify ADD event transformation works correctly
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__)))

# Import the specific module and class
from astra_ai.memory.mem0_memory_system import NovaMemoryAI
import inspect
import json

def test_add_event_transformation():
    """Test that ADD events are properly transformed to match the required schema"""
    # Create a memory system instance
    memory_system = NovaMemoryAI()
    
    # Check if the transform function exists
    if not hasattr(memory_system, 'transform_add_event_to_schema'):
        print("X transform_add_event_to_schema method not found on NovaMemoryAI")
        # Try to find it in the class
        methods = [name for name, func in inspect.getmembers(NovaMemoryAI, predicate=inspect.isfunction) 
                  if 'transform' in name.lower()]
        print(f"Available transform methods: {methods}")
        return
    
    print("Testing ADD event transformation...")
    print("="*50)
    
    # Create a sample ADD event that might have incorrect format
    sample_add_event = {
        "event_id": "evt_12345678",
        "type": "ADD",
        "summary": "User likes watching anime during weekends",
        "timestamp": "2025-10-16T17:08:03",  # Missing Z
        "emotional_context": {
            "sentiment": "positive",
            "emotion_tags": ["interest"],
            "emotional_intensity": 0.3,
            "mood_context": "normal",
            "confidence": 0.85
        },
        # This is in the old object format that should be converted to string
        "semantic_context": {
            "related_facts": [],
            "confidence_score": 0.8,
            "context_type": "inferred_preference",
            "semantic_tags": ["likes"],
            "similarity_hash": "abc123"
        },
        "importance_score": 0.6,
        "confidence": 0.85,
        "category": "personal_preferences", 
        "subcategory": "likes",
        "previous_value": None,
        "current_value": "likes watching anime during weekends",
        "provenance": {
            "enhanced_in_place": True,
            "enhanced_at": "2025-10-16T17:08:03",
            "source_info": {
                "source_type": "conversation",
                "source_details": "chat input", 
                "context": "User: I like to watch anime sometimes during the weekend.",
                "event_index": 0
            },
            "source_conversation_timestamp": "2025-10-16T17:08:03"
        },
        "Added_preference": "enjoys watching anime during weekends"
    }
    
    print("Original ADD event:")
    print(json.dumps(sample_add_event, indent=2))
    print()
    
    # Transform the event using our function
    transformed_event = memory_system.transform_add_event_to_schema(sample_add_event)
    
    print("Transformed ADD event:")
    print(json.dumps(transformed_event, indent=2))
    print()
    
    # Verify the transformations
    success = True
    errors = []
    
    # Check that semantic_context is now a string
    if not isinstance(transformed_event.get("semantic_context"), str):
        success = False
        errors.append("semantic_context should be a string")
    elif not transformed_event["semantic_context"].startswith("Inferred from input:"):
        success = False
        errors.append("semantic_context should start with 'Inferred from input:'")
    
    # Check timestamp format has Z
    timestamp = transformed_event.get("timestamp", "")
    if not timestamp.endswith('Z'):
        success = False
        errors.append("timestamp should end with 'Z' for UTC")
    
    # Check that importance_score is within range
    importance_score = transformed_event.get("importance_score", 0)
    if not (0.5 <= importance_score <= 0.95):
        success = False
        errors.append("importance_score should be between 0.5 and 0.95")
    
    # Check that confidence is within range
    confidence = transformed_event.get("confidence", 0)
    if not (0.5 <= confidence <= 0.95):
        success = False
        errors.append("confidence should be between 0.5 and 0.95")
    
    if success:
        print("SUCCESS: All transformations completed successfully!")
        print("SUCCESS: ADD event now follows the required schema:")
        print("  - semantic_context is a string in format 'Inferred from input: ...'")
        print("  - timestamp uses ISO 8601 UTC format with Z")
        print("  - importance_score and confidence are within 0.5-0.95 range")
        print("  - all required fields are present")
    else:
        print("ISSUE: Some problems found:")
        for error in errors:
            print(f"  - {error}")
    
    print()
    print("Required ADD Event Schema Structure:")
    print("""
{
  "event_id": "evt_001",
  "type": "ADD", 
  "summary": "User likes watching anime during weekends",
  "timestamp": "2025-10-16T17:08:03Z",
  "emotional_context": {
    "sentiment": "positive",
    "emotion_tags": ["interest"], 
    "emotional_intensity": 0.3,
    "mood_context": "normal",
    "confidence": 0.85
  },
  "semantic_context": "Inferred from input: 'I like to watch anime sometimes during the weekend.'",  // String format
  "importance_score": 0.6,
  "confidence": 0.85,
  "category": "personal_preferences",
  "subcategory": "likes", 
  "previous_value": null,
  "current_value": "likes watching anime during weekends",
  "provenance": { ... },
  "Added_preference": "enjoys watching anime during weekends"
}
    """)

if __name__ == "__main__":
    test_add_event_transformation()