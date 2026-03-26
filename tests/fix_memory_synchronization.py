#!/usr/bin/env python3
"""
Script to fix missing fact_history entries by synchronizing with memory_events
"""

import json
import sys
import os
from datetime import datetime

def fix_missing_fact_history_entries(file_path):
    """
    Fix missing fact_history entries by synchronizing with memory_events
    """
    print(f"Loading memory file: {file_path}")
    
    # Load the JSON file
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"Memory events count: {len(data['memory_engine']['memory_events'])}")
    
    # Get all event_ids from memory_events
    memory_event_ids = set()
    for event in data["memory_engine"]["memory_events"]:
        if isinstance(event, dict) and "event_id" in event:
            memory_event_ids.add(event["event_id"])
    
    print(f"Unique event_ids in memory_events: {len(memory_event_ids)}")
    
    # Get all event_ids from fact_history
    fact_history_event_ids = set()
    for key in data["fact_history"].keys():
        if not key.startswith("personal_preferences") and "." not in key and not key.startswith("."):
            fact_history_event_ids.add(key)
    
    print(f"Event_ids in fact_history: {len(fact_history_event_ids)}")
    
    # Find missing event_ids
    missing_event_ids = memory_event_ids - fact_history_event_ids
    print(f"Missing event_ids: {missing_event_ids}")
    
    # Add missing entries to fact_history
    fixed_count = 0
    for event in data["memory_engine"]["memory_events"]:
        if isinstance(event, dict) and "event_id" in event:
            event_id = event["event_id"]
            if event_id in missing_event_ids and event_id not in data["fact_history"]:
                # Add the missing entry
                data["fact_history"][event_id] = {
                    "item": event.get("current_value", event.get("summary", "unknown")),
                    "added": datetime.now().strftime('%Y-%m-%d'),
                    "score": event.get("confidence", 0.85)
                }
                print(f"Added missing fact_history entry for {event_id}: {event.get('current_value', 'unknown')}")
                fixed_count += 1
    
    print(f"Fixed {fixed_count} missing fact_history entries")
    
    # Save the fixed data
    if fixed_count > 0:
        backup_path = file_path + ".backup"
        print(f"Creating backup at: {backup_path}")
        # Remove backup if it already exists
        if os.path.exists(backup_path):
            os.remove(backup_path)
        os.rename(file_path, backup_path)
        
        print(f"Saving fixed data to: {file_path}")
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print("[SUCCESS] Successfully fixed missing fact_history entries!")
    else:
        print("[INFO] No missing fact_history entries found")
    
    return True

if __name__ == "__main__":
    # Path to the memory file
    memory_file = "astra_ai/Date/nova_ai_memory.json"
    
    if os.path.exists(memory_file):
        success = fix_missing_fact_history_entries(memory_file)
        if success:
            print("\n[SUCCESS] Memory file synchronization completed!")
        else:
            print("\n[ERROR] Failed to synchronize memory file!")
            sys.exit(1)
    else:
        print(f"[ERROR] Memory file not found: {memory_file}")
        sys.exit(1)