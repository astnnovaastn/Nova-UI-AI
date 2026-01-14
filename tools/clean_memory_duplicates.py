#!/usr/bin/env python3
"""
Test script to clean duplicate memory events from nova_ai_memory.json
"""

import json
import sys
import os

def clean_duplicate_memory_events(file_path):
    """
    Clean duplicate memory events from the JSON file
    """
    print(f"Loading memory file: {file_path}")
    
    # Load the JSON file
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"Original memory_events count: {len(data['memory_engine']['memory_events'])}")
    
    # Track seen event_ids
    seen_event_ids = set()
    unique_events = []
    duplicates_removed = 0
    
    # Iterate through events and keep only unique ones
    for event in data["memory_engine"]["memory_events"]:
        if isinstance(event, dict) and "event_id" in event:
            event_id = event["event_id"]
            if event_id not in seen_event_ids:
                seen_event_ids.add(event_id)
                unique_events.append(event)
            else:
                duplicates_removed += 1
                print(f"Removing duplicate event with ID: {event_id}")
        else:
            # Keep events that don't have proper structure
            unique_events.append(event)
    
    print(f"Found and removed {duplicates_removed} duplicate events")
    print(f"Final memory_events count: {len(unique_events)}")
    
    # Update the memory_events with unique events only
    data["memory_engine"]["memory_events"] = unique_events
    
    # Also clean up fact_history to match unique events
    fact_history = data.get("fact_history", {})
    cleaned_fact_history = {}
    
    # Keep entries that correspond to unique event_ids
    for key, value in fact_history.items():
        # Keep personal_preferences and other non-event_id entries
        if key == "personal_preferences" or "." in key or not key.startswith("evt_"):
            cleaned_fact_history[key] = value
        # Keep fact_history entries that correspond to unique event_ids
        elif key in seen_event_ids:
            cleaned_fact_history[key] = value
            
    data["fact_history"] = cleaned_fact_history
    print(f"Cleaned fact_history to match unique events")
    
    # Save the cleaned data
    backup_path = file_path + ".backup"
    print(f"Creating backup at: {backup_path}")
    # Remove backup if it already exists
    if os.path.exists(backup_path):
        os.remove(backup_path)
    os.rename(file_path, backup_path)
    
    print(f"Saving cleaned data to: {file_path}")
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print("✅ Successfully cleaned duplicate memory events!")
    return True

if __name__ == "__main__":
    # Path to the memory file
    memory_file = "astra_ai/Date/nova_ai_memory.json"
    
    if os.path.exists(memory_file):
        success = clean_duplicate_memory_events(memory_file)
        if success:
            print("\n[SUCCESS] Memory file cleaned successfully!")
        else:
            print("\n[ERROR] Failed to clean memory file!")
            sys.exit(1)
    else:
        print(f"[ERROR] Memory file not found: {memory_file}")
        sys.exit(1)