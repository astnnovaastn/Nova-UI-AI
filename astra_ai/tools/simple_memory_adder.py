#!/usr/bin/env python3
"""
Simple Memory Event Adder Script

This script demonstrates how to add a new memory event to the Nova Memory AI system.
"""

import json
import uuid
from datetime import datetime
import os

def add_memory_event(file_path, preference_text):
    """
    Add a new memory event to the system.
    
    Args:
        file_path (str): Path to the memory JSON file
        preference_text (str): The preference to add
    """
    try:
        # Load existing memory data
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        else:
            print(f"Memory file not found: {file_path}")
            return False
        
        # Generate unique event ID
        event_id = f"evt_{uuid.uuid4().hex[:8]}"
        timestamp = datetime.now().isoformat()
        
        # Create the new ADD event
        new_event = {
            "event_id": event_id,
            "type": "ADD",
            "summary": f"User likes {preference_text}",
            "timestamp": timestamp,
            "emotional_context": {
                "sentiment": "positive",
                "emotion_tags": ["interest"],
                "emotional_intensity": 0.6,
                "mood_context": "normal",
                "confidence": 0.85
            },
            "semantic_context": f"Inferred from input: 'I like {preference_text}.'",
            "importance_score": 0.7,
            "confidence": 0.85,
            "category": "personal_preferences",
            "subcategory": "likes",
            "previous_value": None,
            "current_value": f"likes {preference_text}",
            "provenance": {
                "enhanced_in_place": True,
                "enhanced_at": timestamp,
                "source_info": {
                    "source_type": "conversation",
                    "source_details": "chat input",
                    "context": f"User: I like {preference_text}.",
                    "event_index": len(data.get("memory_events", []))
                },
                "source_conversation_timestamp": timestamp
            },
            "Added_preference": preference_text
        }
        
        # Add to memory events
        if "memory_events" not in data:
            data["memory_events"] = []
        data["memory_events"].append(new_event)
        
        # Update fact history
        if "fact_history" not in data:
            data["fact_history"] = {}
            
        if "personal_preferences" not in data["fact_history"]:
            data["fact_history"]["personal_preferences"] = {}
            
        if "likes" not in data["fact_history"]["personal_preferences"]:
            data["fact_history"]["personal_preferences"]["likes"] = []
            
        # Add to fact history with proper structure
        data["fact_history"]["personal_preferences"]["likes"].append({
            "item": f"likes {preference_text}",
            "added": datetime.now().strftime('%Y-%m-%d'),
            "score": 0.85
        })
        
        # Save updated data
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"Successfully added new preference: {preference_text}")
        print(f"Event ID: {event_id}")
        return True
        
    except Exception as e:
        print(f"Error adding memory event: {e}")
        return False

def main():
    """Main function"""
    # Path to memory file
    memory_file = os.path.join("astra_ai", "Date", "nova_ai_memory.json")
    
    # Example: Add a new preference
    preference = "playing chess online"
    
    print("Adding new memory event...")
    success = add_memory_event(memory_file, preference)
    
    if success:
        print("Memory event added successfully!")
    else:
        print("Failed to add memory event.")

if __name__ == "__main__":
    main()