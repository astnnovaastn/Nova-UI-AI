#!/usr/bin/env python3
"""
Test script to verify that Added_preference entries are properly mapped to fact_history sections.
"""
import sys
import os
import json

# Add the project path to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '.'))

def test_preference_mapping():
    """Test that Added_preference entries are correctly mapped to fact_history sections"""
    print("Testing Added_preference mapping to fact_history sections...")
    
    # Load the current memory file
    memory_file_path = "astra_ai/Date/nova_ai_memory.json"
    if os.path.exists(memory_file_path):
        with open(memory_file_path, 'r', encoding='utf-8') as f:
            memory_data = json.load(f)
    else:
        print(f"Memory file not found at {memory_file_path}")
        return False
    
    # Check memory events for Added_preference fields
    memory_events = memory_data.get("memory_engine", {}).get("memory_events", [])
    fact_history = memory_data.get("fact_history", {}).get("personal_preferences", {})
    
    print(f"Found {len(memory_events)} memory events")
    print(f"Fact history personal_preferences has {len(fact_history)} subcategories")
    
    # Check each memory event for Added_preference fields
    added_preference_fields_found = []
    for event in memory_events:
        for key, value in event.items():
            if key.startswith("Added_preference_"):
                added_preference_fields_found.append((key, value, event.get("event_id")))
                print(f"  Found memory event field: {key} = {value} (event_id: {event.get('event_id')})")
    
    # Check fact_history for corresponding entries
    fact_history_entries = []
    for category, items in fact_history.items():
        if category.startswith("Added_preference_"):
            fact_history_entries.append((category, items))
            print(f"  Found fact_history category: {category} with {len(items)} items")
    
    print("\n--- Mapping Verification ---")
    all_mapped_correctly = True
    
    for field_name, field_value, event_id in added_preference_fields_found:
        expected_category = field_name  # They should match exactly
        found_in_fact_history = False
        
        for category, items in fact_history_entries:
            if category == expected_category:
                # Look for the field value in the items
                for item in items:
                    if field_value.lower().strip() in str(item.get("item", "")).lower().strip():
                        print(f"[OK] {field_name} -> {category} (value found: '{item['item']}')")
                        found_in_fact_history = True
                        break
        
        if not found_in_fact_history:
            print(f"[MISSING] {field_name} -> NOT FOUND in fact_history as {expected_category}")
            all_mapped_correctly = False
    
    print(f"\nOverall mapping correctness: {'PASS' if all_mapped_correctly else 'FAIL'}")
    return all_mapped_correctly

def test_specific_examples():
    """Test specific examples from the original data"""
    print("\n--- Testing Specific Examples ---")
    
    # Load the current memory file  
    memory_file_path = "astra_ai/Date/nova_ai_memory.json"
    if os.path.exists(memory_file_path):
        with open(memory_file_path, 'r', encoding='utf-8') as f:
            memory_data = json.load(f)
    else:
        print(f"Memory file not found at {memory_file_path}")
        return False
    
    fact_history = memory_data.get("fact_history", {}).get("personal_preferences", {})
    
    # Check specific mappings mentioned in the requirements
    test_cases = [
        ("Added_preference_likes", "enjoys to play games"),  # Should be in Added_preference_likes
        ("Added_preference_love", "loves to wach anime"),   # Should be in Added_preference_love, NOT Added_preference_loves
    ]
    
    all_correct = True
    for expected_field, expected_value in test_cases:
        if expected_field in fact_history:
            items_in_category = fact_history[expected_field]
            value_found = False
            for item in items_in_category:
                if expected_value.lower() in str(item.get("item", "")).lower():
                    value_found = True
                    print(f"[OK] {expected_field} contains: {item['item']}")
                    break
            
            if not value_found:
                print(f"[MISSING] {expected_field} does NOT contain expected value: {expected_value}")
                print(f"  Available values in {expected_field}: {[item.get('item', '') for item in items_in_category]}")
                all_correct = False
        else:
            print(f"[MISSING] {expected_field} NOT FOUND in fact_history")
            print(f"  Available categories: {list(fact_history.keys())}")
            all_correct = False
    
    print(f"\nSpecific examples verification: {'PASS' if all_correct else 'FAIL'}")
    return all_correct

if __name__ == "__main__":
    print("Running Added_preference to fact_history mapping tests...")
    
    test1_result = test_preference_mapping()
    test2_result = test_specific_examples()
    
    overall_success = test1_result and test2_result
    
    print(f"\n=== FINAL RESULT ===")
    print(f"Overall test result: {'PASS' if overall_success else 'FAIL'}")
    
    if overall_success:
        print("[OK] All Added_preference entries are correctly mapped to fact_history sections!")
    else:
        print("[ERROR] Some Added_preference entries are not correctly mapped.")
        sys.exit(1)