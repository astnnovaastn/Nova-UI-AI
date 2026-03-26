#!/usr/bin/env python3
"""
Example Script for Adding Memory Events to Nova Memory AI System

This script demonstrates the proper way to add new memory events to the system
following the documented specifications.
"""

import os
import sys
import json
import uuid
from datetime import datetime
import hashlib

# Add the project root to the Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__)))
sys.path.insert(0, project_root)

def load_memory_file(file_path):
    """Load the memory file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Memory file not found: {file_path}")
        return None
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON from {file_path}: {e}")
        return None

def save_memory_file(file_path, data):
    """Save the memory file"""
    try:
        # Create backup first
        if os.path.exists(file_path):
            backup_path = f"{file_path}.backup.{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            with open(file_path, 'r', encoding='utf-8') as f:
                with open(backup_path, 'w', encoding='utf-8') as backup_f:
                    backup_f.write(f.read())
        
        # Save updated data
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving memory file: {e}")
        return False

def create_add_event(text, memory_data):
    """
    Create a properly formatted ADD event following the specification.
    
    Args:
        text: The text content to add as a memory event
        memory_data: The current memory data structure
        
    Returns:
        Dict representing the properly formatted ADD event
    """
    # Generate a unique event ID
    event_id = f"evt_{uuid.uuid4().hex[:8]}"
    timestamp = datetime.now().isoformat()
    
    # Create the ADD event with all required fields
    add_event = {
        "event_id": event_id,
        "type": "ADD",
        "summary": f"User likes {text}" if 'like' in text.lower() or 'love' in text.lower() else text,
        "timestamp": timestamp,
        "emotional_context": {
            "sentiment": "positive" if any(word in text.lower() for word in ['love', 'like', 'enjoy', 'prefer']) else "neutral",
            "emotion_tags": ["interest"] if any(word in text.lower() for word in ['love', 'like', 'enjoy', 'prefer']) else [],
            "emotional_intensity": 0.6,
            "mood_context": "normal",
            "confidence": 0.85
        },
        "semantic_context": f"Inferred from input: '{text}'",
        "importance_score": 0.7,
        "confidence": 0.85,
        "category": "personal_preferences",
        "subcategory": "likes" if any(word in text.lower() for word in ['like', 'love', 'enjoy', 'prefer']) else "general",
        "previous_value": None,
        "current_value": text,
        "provenance": {
            "enhanced_in_place": True,
            "enhanced_at": timestamp,
            "source_info": {
                "source_type": "conversation",
                "source_details": "chat input",
                "context": f"User: {text}",
                "event_index": len(memory_data.get("memory_events", []))
            },
            "source_conversation_timestamp": timestamp
        },
        "Added_preference": text
    }
    
    return add_event

def create_update_event(previous_event_id, old_value, new_value, memory_data):
    """
    Create a properly formatted UPDATE event following the specification.
    
    Args:
        previous_event_id: ID of the event being updated
        old_value: The previous value
        new_value: The new value
        memory_data: The current memory data structure
        
    Returns:
        Dict representing the properly formatted UPDATE event
    """
    # Generate a unique event ID
    event_id = f"evt_{uuid.uuid4().hex[:8]}"
    timestamp = datetime.now().isoformat()
    
    # Create the UPDATE event with all required fields
    update_event = {
        "event_id": event_id,
        "type": "UPDATE",
        "summary": f"User now prefers {new_value} instead of {old_value}",
        "timestamp": timestamp,
        "emotional_context": {
            "sentiment": "neutral",
            "emotion_tags": [],
            "emotional_intensity": 0.1,
            "mood_context": "normal",
            "confidence": 0.9
        },
        "semantic_context": {
            "related_facts": [previous_event_id],
            "confidence_score": 0.89,
            "context_type": "preference_update",
            "semantic_tags": ["preference", "update"],
            "similarity_hash": hashlib.md5(new_value.encode()).hexdigest()[:8]
        },
        "importance_score": 0.7,
        "confidence": 0.9,
        "category": "personal_preferences",
        "subcategory": "likes",
        "previous_value": old_value,
        "current_value": new_value,
        "provenance": {
            "enhanced_in_place": True,
            "enhanced_at": timestamp,
            "original_summary": f"User likes {old_value}.",
            "context": f"User: Actually, I prefer {new_value}.",
            "source_conversation_timestamp": timestamp,
            "cleanup_operation": "specificity refinement"
        }
    }
    
    return update_event

def add_new_preference(memory_file_path, preference_text):
    """
    Add a new preference to the memory system.
    
    Args:
        memory_file_path: Path to the memory file
        preference_text: The preference to add
        
    Returns:
        bool: True if successful, False otherwise
    """
    # Load the current memory data
    memory_data = load_memory_file(memory_file_path)
    if memory_data is None:
        return False
    
    # Create the ADD event
    add_event = create_add_event(preference_text, memory_data)
    
    # Add to memory events
    if "memory_events" not in memory_data:
        memory_data["memory_events"] = []
    memory_data["memory_events"].append(add_event)
    
    # Update fact history
    if "fact_history" not in memory_data:
        memory_data["fact_history"] = {}
    
    if "personal_preferences" not in memory_data["fact_history"]:
        memory_data["fact_history"]["personal_preferences"] = {}
        
    if "likes" not in memory_data["fact_history"]["personal_preferences"]:
        memory_data["fact_history"]["personal_preferences"]["likes"] = []
    
    # Add to fact history
    memory_data["fact_history"]["personal_preferences"]["likes"].append({
        "item": preference_text,
        "added": datetime.now().strftime('%Y-%m-%d'),
        "score": add_event["confidence"]
    })
    
    # Save the updated memory data
    if save_memory_file(memory_file_path, memory_data):
        print(f"Successfully added new preference: {preference_text}")
        print(f"Event ID: {add_event['event_id']}")
        return True
    else:
        print("Failed to save memory file")
        return False

def update_existing_preference(memory_file_path, old_preference, new_preference, previous_event_id=None):
    """
    Update an existing preference in the memory system.
    
    Args:
        memory_file_path: Path to the memory file
        old_preference: The old preference value
        new_preference: The new preference value
        previous_event_id: ID of the previous event (optional)
        
    Returns:
        bool: True if successful, False otherwise
    """
    # Load the current memory data
    memory_data = load_memory_file(memory_file_path)
    if memory_data is None:
        return False
    
    # If we don't have the previous event ID, try to find it
    if not previous_event_id:
        # Look for the most recent event with the old preference
        for event in reversed(memory_data.get("memory_events", [])):
            if (event.get("type") == "ADD" or event.get("type") == "UPDATE") and \
               (event.get("current_value") == old_preference or 
                event.get("Added_preference") == old_preference):
                previous_event_id = event.get("event_id")
                break
    
    if not previous_event_id:
        print(f"Could not find previous event for preference: {old_preference}")
        return False
    
    # Create the UPDATE event
    update_event = create_update_event(previous_event_id, old_preference, new_preference, memory_data)
    
    # Add to memory events
    if "memory_events" not in memory_data:
        memory_data["memory_events"] = []
    memory_data["memory_events"].append(update_event)
    
    # Update fact history
    if "fact_history" not in memory_data:
        memory_data["fact_history"] = {}
    
    if "personal_preferences" not in memory_data["fact_history"]:
        memory_data["fact_history"]["personal_preferences"] = {}
        
    if "likes" not in memory_data["fact_history"]["personal_preferences"]:
        memory_data["fact_history"]["personal_preferences"]["likes"] = []
    
    # Find and update the existing preference in fact history
    for pref_entry in memory_data["fact_history"]["personal_preferences"]["likes"]:
        if pref_entry.get("item") == old_preference:
            # Add update information
            pref_entry["update_item"] = new_preference
            pref_entry["updated"] = datetime.now().strftime('%Y-%m-%d')
            pref_entry["score"] = max(pref_entry.get("score", 0.8), 0.9)
            break
    else:
        # If we didn't find the old preference, add the new one
        memory_data["fact_history"]["personal_preferences"]["likes"].append({
            "item": new_preference,
            "added": datetime.now().strftime('%Y-%m-%d'),
            "score": update_event["confidence"]
        })
    
    # Save the updated memory data
    if save_memory_file(memory_file_path, memory_data):
        print(f"Successfully updated preference: {old_preference} -> {new_preference}")
        print(f"Event ID: {update_event['event_id']}")
        return True
    else:
        print("Failed to save memory file")
        return False

def list_current_preferences(memory_file_path):
    """
    List current preferences from the memory system.
    
    Args:
        memory_file_path: Path to the memory file
    """
    memory_data = load_memory_file(memory_file_path)
    if memory_data is None:
        return
    
    print("Current Preferences:")
    print("-" * 30)
    
    # Get preferences from fact history
    fact_history = memory_data.get("fact_history", {})
    personal_preferences = fact_history.get("personal_preferences", {})
    likes = personal_preferences.get("likes", [])
    
    if likes:
        for i, pref in enumerate(likes):
            if isinstance(pref, dict):
                item = pref.get("item", pref.get("update_item", str(pref)))
                updated = pref.get("updated", pref.get("added", "Unknown"))
                print(f"{i+1}. {item} (Last updated: {updated})")
                if "update_item" in pref:
                    print(f"   Previous: {pref.get('item')}")
            else:
                print(f"{i+1}. {pref}")
    else:
        print("No preferences found.")

def main():
    """Main function demonstrating usage"""
    # Set the memory file path
    memory_file_path = os.path.join("astra_ai", "Date", "nova_ai_memory.json")
    
    print("Nova Memory AI System - Memory Event Adder")
    print("=" * 50)
    
    # Example 1: Add a new preference
    print("\n1. Adding a new preference...")
    add_new_preference(memory_file_path, "enjoys reading science fiction novels")
    
    # Example 2: Add another new preference
    print("\n2. Adding another new preference...")
    add_new_preference(memory_file_path, "likes drinking coffee in the morning")
    
    # Example 3: Update an existing preference
    print("\n3. Updating an existing preference...")
    update_existing_preference(
        memory_file_path, 
        "enjoys reading science fiction novels",
        "prefers reading science fiction and fantasy novels"
    )
    
    # Example 4: List current preferences
    print("\n4. Listing current preferences...")
    list_current_preferences(memory_file_path)
    
    print("\nDone!")

if __name__ == "__main__":
    main()