import json
from astra_ai.memory.Mem0_ai_organizer import AIOrganizer

def test_new_event_processing():
    """Test processing of a new event to verify emotion tags are populated"""
    
    # Create a fresh test memory file with a new ADD event
    fresh_memory_data = {
        "user": {
            "user_id": "test_user",
            "name": "Test User",
            "created_at": "2025-11-14T17:02:25.497169",
            "status": "active",
            "total_sessions": 1,
            "last_seen": "2025-11-14T17:02:25.500329",
            "relationship_established": False
        },
        "memory_engine": {
            "metadata": {
                "version": "1.0",
                "generated_at": "2025-11-14T17:03:02.722111",
                "description": "Mem0 AI Memory Engine - Event-based user memory management system"
            },
            "memory_events": [
                {
                    "event_id": "evt_test_001",
                    "type": "ADD",
                    "summary": "User enjoys reading science fiction novels.",
                    "timestamp": "2025-11-14T17:03:02.597186Z",
                    "emotional_context": {
                        "sentiment": "neutral",  # This will be updated
                        "emotion_tags": [],      # This needs to be populated
                        "emotional_intensity": 0.5,
                        "mood_context": "normal",
                        "confidence": 0.7
                    },
                    "semantic_context": "Inferred from input: 'I enjoy reading science fiction novels.'",
                    "importance_score": 0.8,
                    "confidence": 0.85,
                    "category": "personal_preferences",
                    "subcategory": "preferences",
                    "previous_value": None,
                    "current_value": "enjoys reading science fiction novels.",
                    "provenance": {
                        "enhanced_in_place": False,  # Fresh event, not yet enhanced
                        "enhanced_at": "",
                        "source_info": {
                            "source_type": "conversation",
                            "source_details": "chat input",
                            "context": "User: I enjoy reading science fiction novels.",
                            "event_index": 0
                        },
                        "source_conversation_timestamp": "2025-11-14T17:03:02.597186Z"
                    },
                    "Added_preference": "User enjoys reading science fiction novels.",
                    "session_id": "session_test"
                }
            ],
            "vector_index": {},
            "clusters": {},
            "update_log": []
        },
        "conversation": [
            {
                "role": "user",
                "content": "I enjoy reading science fiction novels.",
                "timestamp": "2025-11-14T17:03:02.590521",
                "session_id": "session_test"
            }
        ],
        "fact_history": {},
        "sessions": {
            "session_test": {
                "session_id": "session_test",
                "start_time": "2025-11-14T17:02:25.500329",
                "end_time": None,
                "message_count": 1,
                "topics_discussed": [],
                "user_name": "Test User",
                "session_duration": None,
                "last_activity": "2025-11-14T17:03:02.590521"
            }
        },
        "current_session": "session_test",
        "conversation_state": {
            "greeting_completed": False,
            "introduction_phase": True,
            "established_user": False
        },
        "memory_categories": {},
        "category_relationships": {},
        "behavioral_adaptation": {},
        "privacy_settings": {}
    }
    
    # Write the test memory file
    test_file = "astra_ai/Date/test_nova_ai_memory.json"
    with open(test_file, 'w') as f:
        json.dump(fresh_memory_data, f, indent=2)
    
    # Create organizer config
    config = {
        'organizer_enabled': True,
        'memory_file_path': test_file,
        'check_interval': 0.5,
        'llm_enabled': False,
        'max_cache_size': 10
    }
    
    # Create organizer and process the event
    organizer = AIOrganizer(config)
    
    # Load the memory data
    memory_data = organizer._load_memory_file()
    
    print("Before organizer processing:")
    events = memory_data.get('memory_engine', {}).get('memory_events', [])
    for i, event in enumerate(events):
        if event.get('type') == 'ADD':
            print(f"Event {i+1}: {event.get('summary')}")
            print(f"  Emotion tags: {event.get('emotional_context', {}).get('emotion_tags', [])}")
            print(f"  Sentiment: {event.get('emotional_context', {}).get('sentiment', 'unknown')}")
            print(f"  Context: {event.get('provenance', {}).get('source_info', {}).get('context', 'N/A')}")
            print()
    
    # Process the event through the organizer's _process_new_event method
    for i in range(len(events)):
        organizer._process_new_event(memory_data, i)
    
    # Save updated data
    organizer._save_memory_file(memory_data)
    
    print("After organizer processing:")
    updated_events = memory_data.get('memory_engine', {}).get('memory_events', [])
    for i, event in enumerate(updated_events):
        if event.get('type') == 'ADD':
            print(f"Event {i+1}: {event.get('summary')}")
            print(f"  Emotion tags: {event.get('emotional_context', {}).get('emotion_tags', [])}")
            print(f"  Sentiment: {event.get('emotional_context', {}).get('sentiment', 'unknown')}")
            print(f"  Context: {event.get('provenance', {}).get('source_info', {}).get('context', 'N/A')}")
            print()
    
    # Clean up test file (keep it for verification if needed)
    print(f"Test completed. Updated file saved to: {test_file}")

if __name__ == "__main__":
    test_new_event_processing()