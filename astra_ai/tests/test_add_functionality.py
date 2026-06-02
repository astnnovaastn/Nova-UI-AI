#!/usr/bin/env python3
"""
Test script to verify the ADD type functionality in the memory system
follows the exact JSON schema provided.
"""

import json
from datetime import datetime
from astra_ai.memory.mem0_memory_system import NovaMemoryAI

def validate_add_event_schema(add_event):
    """
    Validate that the ADD event follows the exact schema provided in the JSON specification.
    """
    required_fields = [
        "event_id", "type", "summary", "timestamp", "emotional_context", 
        "semantic_context", "importance_score", "confidence", "category", 
        "subcategory", "previous_value", "current_value", "provenance", "Added_preference"
    ]
    
    errors = []
    
    # Check all required fields exist
    for field in required_fields:
        if field not in add_event:
            errors.append(f"Missing required field: {field}")
    
    # Validate specific field types and constraints
    if "type" in add_event and add_event["type"] != "ADD":
        errors.append(f"Type should be 'ADD', got: {add_event['type']}")
    
    if "event_id" in add_event:
        if not isinstance(add_event["event_id"], str) or not add_event["event_id"].startswith("evt_"):
            errors.append(f"event_id should be a string starting with 'evt_', got: {add_event['event_id']}")
    
    if "timestamp" in add_event:
        # Should be ISO 8601 format
        try:
            # Try to parse the timestamp to verify format
            if add_event["timestamp"].endswith('Z'):
                # UTC format with Z suffix
                timestamp_str = add_event["timestamp"].replace('Z', '+00:00')
            else:
                timestamp_str = add_event["timestamp"]
            datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
        except ValueError:
            errors.append(f"timestamp is not in valid ISO 8601 format: {add_event['timestamp']}")
    
    if "importance_score" in add_event:
        score = add_event["importance_score"]
        if not isinstance(score, (int, float)) or score < 0.0 or score > 1.0:
            errors.append(f"importance_score should be a float between 0.0 and 1.0, got: {score}")
    
    if "confidence" in add_event:
        confidence = add_event["confidence"]
        if not isinstance(confidence, (int, float)) or confidence < 0.5 or confidence > 1.0:
            errors.append(f"confidence should be a float between 0.5 and 1.0, got: {confidence}")
    
    if "previous_value" in add_event and add_event["previous_value"] is not None:
        errors.append(f"previous_value should be null for ADD events, got: {add_event['previous_value']}")
    
    # Validate emotional_context
    if "emotional_context" in add_event:
        ec = add_event["emotional_context"]
        required_ec_fields = ["sentiment", "emotion_tags", "emotional_intensity", "mood_context", "confidence"]
        for field in required_ec_fields:
            if field not in ec:
                errors.append(f"Missing emotional_context field: {field}")
        
        if "sentiment" in ec and ec["sentiment"] not in ["positive", "neutral", "negative"]:
            errors.append(f"emotional_context.sentiment should be positive|neutral|negative, got: {ec['sentiment']}")
        
        if "emotion_tags" in ec and not isinstance(ec["emotion_tags"], list):
            errors.append(f"emotional_context.emotion_tags should be a list, got: {type(ec['emotion_tags'])}")
        
        if "emotional_intensity" in ec:
            intensity = ec["emotional_intensity"]
            if not isinstance(intensity, (int, float)) or intensity < 0.0 or intensity > 1.0:
                errors.append(f"emotional_context.emotional_intensity should be a float between 0.0 and 1.0, got: {intensity}")
        
        if "confidence" in ec:
            confidence = ec["confidence"]
            if not isinstance(confidence, (int, float)) or confidence < 0.5 or confidence > 1.0:
                errors.append(f"emotional_context.confidence should be a float between 0.5 and 1.0, got: {confidence}")
    
    # Validate provenance
    if "provenance" in add_event:
        prov = add_event["provenance"]
        required_prov_fields = ["enhanced_in_place", "enhanced_at", "source_info", "source_conversation_timestamp"]
        for field in required_prov_fields:
            if field not in prov:
                errors.append(f"Missing provenance field: {field}")
        
        if "enhanced_in_place" in prov and not isinstance(prov["enhanced_in_place"], bool):
            errors.append(f"provenance.enhanced_in_place should be a boolean, got: {type(prov['enhanced_in_place'])}")
        
        if "source_info" in prov:
            si = prov["source_info"]
            required_si_fields = ["source_type", "source_details", "context", "event_index"]
            for field in required_si_fields:
                if field not in si:
                    errors.append(f"Missing source_info field: {field}")
    
    return errors

def test_add_functionality():
    """Test that ADD events follow the correct schema."""
    print("Testing ADD type functionality...")
    
    # Create a memory system instance
    memory_system = NovaMemoryAI(storage_file="test_memory.json")
    
    # Test creating an ADD event using the new method
    user_id = "test_user"
    text = "I like watching anime during weekends"
    session_id = "test_session"
    
    print(f"Creating ADD event for: '{text}'")
    
    # Create the ADD event
    add_event = memory_system._create_complete_add_event(user_id, text, session_id)
    
    print("Generated ADD event:")
    print(json.dumps(add_event, indent=2))
    
    # Validate the event against the schema
    errors = validate_add_event_schema(add_event)
    
    if errors:
        print("\n[FAILED] Validation errors found:")
        for error in errors:
            print(f"  - {error}")
        return False
    else:
        print("\n[PASSED] ADD event validation passed! All fields follow the required schema.")
        
        # Additional checks for specific values
        print(f"\nEvent details:")
        print(f"  - Event ID: {add_event['event_id']}")
        print(f"  - Type: {add_event['type']}")
        print(f"  - Summary: {add_event['summary']}")
        print(f"  - Timestamp: {add_event['timestamp']}")
        print(f"  - Category: {add_event['category']}")
        print(f"  - Subcategory: {add_event['subcategory']}")
        print(f"  - Current value: {add_event['current_value']}")
        print(f"  - Added preference: {add_event['Added_preference']}")
        print(f"  - Importance score: {add_event['importance_score']}")
        print(f"  - Confidence: {add_event['confidence']}")
        print(f"  - Previous value (should be None): {add_event['previous_value']}")
        
        return True

if __name__ == "__main__":
    success = test_add_functionality()
    if success:
        print("\n[SUCCESS] All tests passed! The ADD type functionality is working correctly.")
    else:
        print("\n[ERROR] Tests failed! Please fix the implementation.")
        exit(1)