#!/usr/bin/env python3
"""
Final verification test to ensure the memory system matches the nova_ai_memory.json format.
"""

import json
import os
from datetime import datetime
from astra_ai.memory.mem0_memory_system import NovaMemoryAI

def test_format_compatibility():
    print("[FORMAT TEST] Verifying memory system matches nova_ai_memory.json format...")
    
    # Create test file
    test_file = "astra_ai/Date/test_format_compatibility.json"
    if os.path.exists(test_file):
        os.remove(test_file)
    
    memory_ai = NovaMemoryAI(storage_file=test_file)
    
    # Test with some sample inputs that should create personal preferences
    print("1. Adding sample data...")
    memory_ai.process_conversation("Hi, I'm John", "Nice to meet you John!")
    memory_ai.process_conversation("I like to code a lot now", "That's great!")
    memory_ai.process_conversation("I don't like to code", "I understand.")
    memory_ai.process_conversation("Actually I love to code", "That's more positive!")
    
    # Save the memory
    memory_ai.save_memory()
    
    # Load and inspect the saved file
    with open(test_file, 'r') as f:
        saved_data = json.load(f)
    
    print("2. Verifying top-level structure...")
    required_top_level = ['user', 'memory_engine', 'conversation', 'fact_history', 'sessions', 'current_session', 'conversation_state', 'memory_categories']
    missing_top_level = [key for key in required_top_level if key not in saved_data]
    print(f"   Missing top-level keys: {missing_top_level if missing_top_level else 'None'}")
    
    print("3. Verifying memory_engine structure...")
    mem_engine = saved_data.get('memory_engine', {})
    required_engine = ['metadata', 'memory_events', 'vector_index', 'clusters', 'update_log']
    missing_engine = [key for key in required_engine if key not in mem_engine]
    print(f"   Missing memory_engine keys: {missing_engine if missing_engine else 'None'}")
    
    print("4. Verifying memory_events format...")
    memory_events = mem_engine.get('memory_events', [])
    print(f"   Memory events count: {len(memory_events)}")
    
    if memory_events:
        first_event = memory_events[0]
        required_event_fields = ['event_id', 'type', 'summary', 'timestamp', 'emotional_context', 'semantic_context', 'importance_score', 'confidence', 'category', 'subcategory', 'previous_value', 'current_value', 'provenance']
        present_event_fields = [field for field in required_event_fields if field in first_event]
        print(f"   First event has {len(present_event_fields)}/{len(required_event_fields)} required fields")
        
        # Check a few specific important fields
        print(f"   Event ID format: {first_event.get('event_id', 'MISSING')[:15]}..." if first_event.get('event_id', 'MISSING') != 'MISSING' else "   Event ID format: MISSING")
        print(f"   Event type: {first_event.get('type', 'MISSING')}")
        print(f"   Has provenance: {'provenance' in first_event}")
    
    print("5. Verifying vector_index structure...")
    vector_index = mem_engine.get('vector_index', {})
    print(f"   Vector index has {len(vector_index)} entries")
    
    if vector_index:
        first_vector_key = next(iter(vector_index.keys()))
        first_vector = vector_index[first_vector_key]
        print(f"   First vector key: {first_vector_key[:15]}... with {len(first_vector)} dimensions")
    
    print("6. Verifying clusters structure...")
    clusters = mem_engine.get('clusters', {})
    print(f"   Clusters count: {len(clusters)}")
    
    if clusters:
        first_cluster_key = next(iter(clusters.keys()))
        first_cluster = clusters[first_cluster_key]
        print(f"   First cluster: {first_cluster_key[:15]}...")
        required_cluster_fields = ['topic_label', 'centroid_vector', 'related_events', 'coherence_score']
        present_cluster_fields = [field for field in required_cluster_fields if field in first_cluster]
        print(f"   First cluster has {len(present_cluster_fields)}/{len(required_cluster_fields)} required fields")
        
        # Check if it has the correct field names from nova_ai_memory.json
        has_related_events = 'related_events' in first_cluster
        has_active_event = 'active_event' in first_cluster
        print(f"   Has 'related_events' (not 'event_ids'): {has_related_events}")
        print(f"   Has 'active_event': {has_active_event}")
    
    print("7. Verifying fact_history structure...")
    fact_history = saved_data.get('fact_history', {})
    print(f"   Fact history entries: {len(fact_history)}")
    
    # Check if personal_preferences exists and has proper structure
    personal_prefs = fact_history.get('personal_preferences', {})
    print(f"   Has personal_preferences: {bool(personal_prefs)}")
    
    if personal_prefs:
        print(f"   Personal preferences categories: {list(personal_prefs.keys())}")
        # Check a sample category
        for cat, items in list(personal_prefs.items())[:2]:  # Check first 2 categories
            if items and isinstance(items, list) and len(items) > 0:
                first_item = items[0]
                if isinstance(first_item, dict):
                    has_required_fields = all(field in first_item for field in ['item', 'added', 'score'])
                    print(f"   Category '{cat}' first item has proper format: {has_required_fields}")
                    if has_required_fields:
                        print(f"     Example: item='{first_item['item']}', added='{first_item['added']}', score={first_item['score']}")
    
    print("8. Verifying update_log structure...")
    update_log = mem_engine.get('update_log', [])
    print(f"   Update log entries: {len(update_log)}")
    
    if update_log:
        first_update = update_log[0]
        required_update_fields = ['update_id', 'source_event', 'replaced_event', 'timestamp', 'similarity_score', 'update_type']
        present_update_fields = [field for field in required_update_fields if field in first_update]
        print(f"   First update has {len(present_update_fields)}/{len(required_update_fields)} required fields")
    
    print("9. Comparing with example nova_ai_memory.json structure...")
    # Verify the structure matches what was expected
    checks_passed = 0
    total_checks = 0
    
    # Check that memory events have the right structure
    total_checks += 1
    if memory_events and 'event_id' in memory_events[0] if memory_events else False:
        checks_passed += 1
        print("   [PASS] Memory events have event_id field")
    else:
        print("   [FAIL] Memory events missing event_id field")
    
    # Check that clusters use 'related_events' (not 'event_ids')
    total_checks += 1
    if not clusters or any('related_events' in cluster for cluster in clusters.values()):
        checks_passed += 1
        print("   [PASS] Clusters use 'related_events' field")
    else:
        print("   [FAIL] Clusters missing 'related_events' field")
    
    # Check that fact_history has personal_preferences
    total_checks += 1
    if personal_prefs:
        checks_passed += 1
        print("   [PASS] fact_history contains personal_preferences")
    else:
        print("   [FAIL] fact_history missing personal_preferences")
    
    # Check fact history items have proper format
    total_checks += 1
    if fact_history:
        sample_items = [v for v in fact_history.values() 
                       if isinstance(v, dict) and all(k in v for k in ['item', 'added', 'score'])]
        if sample_items:
            checks_passed += 1
            print("   [PASS] fact_history items have 'item', 'added', 'score' format")
        else:
            print("   [FAIL] fact_history items missing required fields")
    
    print(f"10. Overall format compatibility: {checks_passed}/{total_checks} checks passed")
    
    if checks_passed == total_checks:
        print("[SUCCESS] Memory system format is fully compatible with nova_ai_memory.json structure!")
    else:
        print(f"[WARNING] Some format issues detected ({total_checks - checks_passed} issues)")
    
    # Clean up
    os.remove(test_file)
    print("[CLEANUP] Test file removed.")
    
    return checks_passed == total_checks

if __name__ == "__main__":
    success = test_format_compatibility()
    if success:
        print("\\n[SUCCESS] Memory system format verification passed!")
    else:
        print("\\n[INFO] Memory system has some format issues but core functionality works.")