#!/usr/bin/env python3
"""
Simple script to update the memory structure to the new comprehensive format.
"""

import json
import uuid
import os
from datetime import datetime
from typing import Dict, Any, List

def load_memory_data(file_path: str) -> Dict[str, Any]:
    """Load memory data from JSON file."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Memory file not found: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_memory_data(file_path: str, data: Dict[str, Any]):
    """Save memory data to JSON file with backup."""
    # Create backup
    if os.path.exists(file_path):
        backup_dir = os.path.join(os.path.dirname(file_path), 'backups')
        os.makedirs(backup_dir, exist_ok=True)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_path = os.path.join(backup_dir, f'nova_ai_memory_{timestamp}.json')
        with open(file_path, 'r', encoding='utf-8') as src:
            with open(backup_path, 'w', encoding='utf-8') as dst:
                dst.write(src.read())
    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False, default=str)

def generate_event_id() -> str:
    """Generate a unique event ID."""
    return f"evt_{uuid.uuid4().hex[:8]}"

def convert_memory_events(memory_events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Convert memory events to new structure."""
    converted_events = []
    
    for i, event in enumerate(memory_events):
        if not isinstance(event, dict):
            converted_events.append(event)
            continue
            
        # Ensure event_id exists
        if "event_id" not in event:
            event["event_id"] = generate_event_id()
        
        # Fix semantic_context if it's a string
        if "semantic_context" in event and isinstance(event["semantic_context"], str):
            # Convert string to dict structure
            event["semantic_context"] = {
                "related_facts": [],
                "confidence_score": 0.8,
                "context_type": "inferred_preference",
                "semantic_tags": [],
                "similarity_hash": ""
            }
        
        # Ensure semantic_context is a dict
        if "semantic_context" not in event or not isinstance(event["semantic_context"], dict):
            event["semantic_context"] = {
                "related_facts": [],
                "confidence_score": 0.8,
                "context_type": "general",
                "semantic_tags": [],
                "similarity_hash": ""
            }
        
        # Ensure emotional_context is a dict
        if "emotional_context" not in event or not isinstance(event["emotional_context"], dict):
            event["emotional_context"] = {
                "sentiment": "neutral",
                "emotion_tags": [],
                "emotional_intensity": 0.5,
                "mood_context": "normal",
                "confidence": 0.7
            }
        
        # Ensure provenance is a dict
        if "provenance" not in event or not isinstance(event["provenance"], dict):
            event["provenance"] = {
                "enhanced_in_place": True,
                "enhanced_at": datetime.now().isoformat(),
                "source_info": {},
                "source_conversation_timestamp": None,
                "cleanup_operation": None,
                "original_summary": None
            }
        
        # Ensure category and subcategory exist
        if "category" not in event or event["category"] is None:
            event["category"] = "personal_preferences"
        if "subcategory" not in event or event["subcategory"] is None:
            event["subcategory"] = "general"
        
        # Add missing fields with default values
        if "importance_score" not in event:
            event["importance_score"] = 0.5
        if "confidence" not in event:
            event["confidence"] = 0.8
        if "previous_value" not in event:
            event["previous_value"] = None
        if "current_value" not in event:
            event["current_value"] = None
            
        converted_events.append(event)
    
    return converted_events

def update_memory_structure(memory_data: Dict[str, Any]) -> Dict[str, Any]:
    """Update memory structure to new format."""
    # Convert memory events
    if "memory_events" in memory_data and isinstance(memory_data["memory_events"], list):
        memory_data["memory_events"] = convert_memory_events(memory_data["memory_events"])
    
    # Ensure memory_engine structure exists
    if "memory_engine" not in memory_data:
        memory_data["memory_engine"] = {
            "metadata": {
                "version": "1.0",
                "generated_at": datetime.now().isoformat(),
                "description": "Mem0 AI Memory Engine - Event-based user memory management system"
            },
            "memory_events": memory_data.get("memory_events", []),
            "vector_index": {},
            "clusters": {},
            "update_log": []
        }
    
    # Ensure all 27 categories exist in memory_categories
    if "memory_categories" not in memory_data:
        memory_data["memory_categories"] = {}
    
    all_categories = [
        "user_identity", "personal_preferences", "task_project_tracking", "activity_behavior",
        "user_instructions", "current_state", "personal_development", "communication_boundaries",
        "contextual_rules", "multi_identity", "knowledge_expertise", "tool_integration",
        "response_adaptation", "file_media", "long_term_goals", "collaborator_relationships",
        "data_privacy", "multimodal_preferences", "system_awareness", "session_themes",
        "meta_memory", "temporal_patterns", "search_external_info", "greeting_patterns",
        "conversation_analytics", "news_weather_history", "timezone_preferences"
    ]
    
    for category in all_categories:
        if category not in memory_data["memory_categories"]:
            memory_data["memory_categories"][category] = {}
    
    # Ensure vector_index, clusters, and update_log exist
    if "vector_index" not in memory_data:
        memory_data["vector_index"] = {}
    if "clusters" not in memory_data:
        memory_data["clusters"] = {}
    if "update_log" not in memory_data:
        memory_data["update_log"] = []
    
    # Update memory_engine with current data
    memory_data["memory_engine"]["memory_events"] = memory_data.get("memory_events", [])
    memory_data["memory_engine"]["vector_index"] = memory_data["vector_index"]
    memory_data["memory_engine"]["clusters"] = memory_data["clusters"]
    memory_data["memory_engine"]["update_log"] = memory_data["update_log"]
    
    return memory_data

def main():
    """Main function."""
    memory_file_path = os.path.join("astra_ai", "Date", "nova_ai_memory.json")
    
    try:
        print(f"Loading memory data from {memory_file_path}...")
        memory_data = load_memory_data(memory_file_path)
        print(f"Loaded {len(memory_data.get('memory_events', []))} memory events")
        
        print("Updating memory structure...")
        memory_data = update_memory_structure(memory_data)
        
        print(f"Saving updated memory data to {memory_file_path}...")
        save_memory_data(memory_file_path, memory_data)
        
        print("Memory structure update completed successfully!")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()