#!/usr/bin/env python3
"""
Test script to validate the updated memory system behavior.
This checks that Added_preference_* fields are no longer created in memory events
and that preferences are properly routed to fact_history sections.
"""
import json
import sys
import os

def test_memory_system_fix():
    """Test that the memory system fix works correctly"""
    print("Testing updated memory system behavior...")
    
    # Load the current memory file
    memory_file_path = "astra_ai/Date/nova_ai_memory.json"
    if os.path.exists(memory_file_path):
        with open(memory_file_path, 'r', encoding='utf-8') as f:
            memory_data = json.load(f)
    else:
        print(f"Memory file not found at {memory_file_path}")
        return False
    
    # Check memory events for any Added_preference_* fields
    memory_events = memory_data.get("memory_engine", {}).get("memory_events", [])
    print(f"Found {len(memory_events)} memory events")
    
    unwanted_fields_found = []
    for i, event in enumerate(memory_events):
        event_id = event.get("event_id", f"event_{i}")
        for key in event.keys():
            if key.startswith("Added_preference_") and key != "Added_preference":
                unwanted_fields_found.append((event_id, key, event[key]))
                print(f"[ERROR] Found unwanted field in event {event_id}: {key} = {event[key]}")
    
    if unwanted_fields_found:
        print(f"\n[FAIL] Found {len(unwanted_fields_found)} unwanted Added_preference_* fields in memory events")
        for event_id, key, value in unwanted_fields_found:
            print(f"  - Event {event_id}: {key} = {value}")
        return False
    else:
        print("[OK] No unwanted Added_preference_* fields found in memory events")
    
    # Check that fact_history has the correct structure
    fact_history = memory_data.get("fact_history", {})
    personal_prefs = fact_history.get("personal_preferences", {})
    
    expected_sections = [
        "Added_preference_likes",
        "Added_preference_dislikes", 
        "Added_preference_avoid",
        "Added_preference_always",
        "Added_preference_style",
        "Added_preference_interests",
        "Added_preference_loves",
        "Added_preference_hates",
        "Added_preference_enjoys", 
        "Added_preference_needs",
        "Added_preference_wants",
        "Added_preference_continues",
        "Added_preference_favorites",
        "Added_preference_prefers",
        "preferences",
        "Added_preference_preferences"
    ]
    
    print(f"\nChecking for expected fact_history sections...")
    missing_sections = []
    for section in expected_sections:
        if section not in personal_prefs:
            missing_sections.append(section)
            print(f"[MISSING] {section}")
        else:
            print(f"[OK] {section} (has {len(personal_prefs[section])} items)")
    
    if missing_sections:
        print(f"\n[FAIL] Missing {len(missing_sections)} expected sections in fact_history.personal_preferences")
        return False
    else:
        print("[OK] All expected fact_history sections are present")
    
    # Check a specific example: if there's an event about loving games, 
    # it should be in Added_preference_loves, not as Added_preference_love field
    print(f"\nChecking specific preference routing...")
    loves_section = personal_prefs.get("Added_preference_loves", [])
    if loves_section:
        print(f"[OK] Added_preference_loves has {len(loves_section)} items:")
        for item in loves_section:
            print(f"  - {item.get('item', 'no item')}")
    else:
        print("No items found in Added_preference_loves section")
    
    # Check for any "game" related content in preferences
    all_prefs = []
    for section_name, items in personal_prefs.items():
        if section_name.startswith("Added_preference_"):
            for item in items:
                item_text = item.get("item", "")
                if "game" in item_text.lower():
                    all_prefs.append((section_name, item_text))
    
    if all_prefs:
        print(f"\n[INFO] Found game-related preferences in sections:")
        for section, item in all_prefs:
            print(f"  - {section}: {item}")
    else:
        print("\n[INFO] No game-related preferences found (might be expected if no relevant events exist)")
    
    print(f"\n[SUCCESS] Memory system validation passed!")
    print("- No unwanted Added_preference_* fields in memory events")
    print("- All expected fact_history sections are present and properly structured")
    
    return True

if __name__ == "__main__":
    success = test_memory_system_fix()
    if not success:
        print("\n[ERROR] Memory system validation failed!")
        sys.exit(1)
    else:
        print("\n[SUCCESS] All tests passed!")