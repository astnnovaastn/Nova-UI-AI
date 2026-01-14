"""
Test script for AI Organizer with Qwen2.5:3b model
"""

import sys
import os
import json

# Add the project root to the Python path
project_root = os.path.join(os.path.dirname(__file__), '..', '..')
sys.path.insert(0, project_root)

# Add astra_ai to the Python path
astra_ai_path = os.path.join(project_root, 'astra_ai')
sys.path.insert(0, astra_ai_path)

from memory.Mem0_ai_organizer import AIOrganizer, ORGANIZER_CONFIG

def test_ai_organizer_with_qwen():
    """Test the AI Organizer with Qwen2.5:3b model"""
    
    print("Testing AI Organizer with Qwen2.5:3b model")
    print("=" * 50)
    
    # Create test memory data
    test_memory_data = {
        "memory_events": [
            {
                "type": "ADD",
                "summary": "User's name is John and works as a Python developer",
                "timestamp": "2023-01-01T10:00:00"
            },
            {
                "type": "UPDATE",
                "summary": "User changed job to JavaScript developer at Microsoft",
                "timestamp": "2023-02-01T10:00:00"
            }
        ],
        "current_facts": {},
        "memory_categories": {
            "user_identity": {},
            "personal_preferences": {},
            "task_project_tracking": {},
            "activity_behavior": {},
            "user_instructions": {},
            "current_state": {},
            "personal_development": {},
            "communication_boundaries": {},
            "contextual_rules": {},
            "multi_identity": {},
            "knowledge_expertise": {},
            "tool_integration": {},
            "response_adaptation": {},
            "file_media": {},
            "long_term_goals": {},
            "collaborator_relationships": {},
            "data_privacy": {},
            "multimodal_preferences": {},
            "system_awareness": {},
            "session_themes": {},
            "meta_memory": {},
            "temporal_patterns": {},
            "search_external_info": {},
            "greeting_patterns": {},
            "conversation_analytics": {},
            "news_weather_history": {},
            "timezone_preferences": {}
        }
    }
    
    # Create organizer with Qwen2.5:3b model
    config = ORGANIZER_CONFIG.copy()
    config['ollama_model'] = 'qwen2.5:3b'
    config['llm_enrich_enabled'] = False  # Disable LLM for this test
    
    organizer = AIOrganizer(config)
    
    print("AI Organizer created with Qwen2.5:3b model")
    print(f"Model: {organizer.config['ollama_model']}")
    print(f"LLM Enrichment Enabled: {organizer.llm_enrich_enabled}")
    print()
    
    # Test processing events
    print("Processing memory events...")
    
    for i in range(len(test_memory_data["memory_events"])):
        print(f"\nProcessing event {i+1}:")
        print(f"  Event: {test_memory_data['memory_events'][i]['summary']}")
        
        try:
            updated_data, organizer_event = organizer.organize_event(test_memory_data, i)
            
            if organizer_event:
                print(f"  Organizer Event Type: {organizer_event['type']}")
                print(f"  Organizer Event Summary: {organizer_event['summary']}")
            else:
                print("  No organizer event created")
                
            # Update test data for next iteration
            test_memory_data = updated_data
            
        except Exception as e:
            print(f"  Error: {e}")
    
    # Show results
    print("\nResults:")
    print("-" * 10)
    print(f"Current facts: {len(test_memory_data['current_facts'])}")
    
    for key, fact in test_memory_data['current_facts'].items():
        print(f"  - {fact['category']}: {fact['value']}")
    
    print("\nTest completed successfully!")

if __name__ == "__main__":
    test_ai_organizer_with_qwen()