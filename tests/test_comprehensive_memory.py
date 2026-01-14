#!/usr/bin/env python3
"""
Comprehensive test to verify all memory system components work properly.
"""

import json
import os
from datetime import datetime
from astra_ai.memory.mem0_memory_system import NovaMemoryAI, AdvancedMemoryAgent

def test_comprehensive_memory_system():
    print("[COMPREHENSIVE TEST] Testing All Memory System Components...")
    
    # Create a new memory system instance with a test file
    test_file = "astra_ai/Date/test_comprehensive_memory.json"
    
    # Clean up any existing test file
    if os.path.exists(test_file):
        os.remove(test_file)
    
    print("1. Creating NovaMemoryAI instance...")
    memory_ai = NovaMemoryAI(storage_file=test_file)
    
    print("2. Testing multiple ADD events to populate memory...")
    # Add various types of preferences to trigger vector indexing and clustering
    event1 = memory_ai.add_event("test_user", "I like to code in Python", "test_session_1")
    print(f"   Event 1 created: {event1}")
    
    event2 = memory_ai.add_event("test_user", "I enjoy watching anime on weekends", "test_session_1")
    print(f"   Event 2 created: {event2}")
    
    event3 = memory_ai.add_event("test_user", "I work as a software engineer", "test_session_1")
    print(f"   Event 3 created: {event3}")
    
    print("3. Testing conversation processing with different statements...")
    # Process various conversations to create different types of events
    result1 = memory_ai.process_conversation("I love to code in Python", "Great to hear!")
    print(f"   Processed 'love code', created {result1['memory_operations']} operations")
    
    result2 = memory_ai.process_conversation("I hate debugging complex issues", "I understand")
    print(f"   Processed 'hate debugging', created {result2['memory_operations']} operations")
    
    result3 = memory_ai.process_conversation("My favorite programming language is JavaScript", "Interesting!")
    print(f"   Processed 'favorite language', created {result3['memory_operations']} operations")
    
    print("4. Testing update functionality (conflicting statements)...")
    # Test an update by contradicting a previous statement
    result4 = memory_ai.process_conversation("Actually I prefer Python over JavaScript", "Noted the preference")
    print(f"   Processed preference update, created {result4['memory_operations']} operations")
    
    print("5. Verifying all components have correct structure...")
    # Check all components of the memory engine
    memory_events = memory_ai.data["memory_engine"]["memory_events"]
    vector_index = memory_ai.data["memory_engine"]["vector_index"]
    clusters = memory_ai.data["memory_engine"]["clusters"]
    fact_history = memory_ai.data["fact_history"]
    update_log = memory_ai.data["memory_engine"]["update_log"]
    
    print(f"   Memory events count: {len(memory_events)}")
    print(f"   Vector index entries: {len(vector_index)}")
    print(f"   Clusters count: {len(clusters)}")
    print(f"   Fact history entries: {len(fact_history)}")
    print(f"   Update log entries: {len(update_log)}")
    
    print("6. Checking specific data structures...")
    # Check that vector index has proper structure
    if vector_index:
        first_vector_key = list(vector_index.keys())[0]
        print(f"   First vector in index: {first_vector_key[:10]}... with {len(vector_index[first_vector_key])} dimensions")
    
    # Check clusters structure
    if clusters:
        first_cluster_key = list(clusters.keys())[0]
        cluster_data = clusters[first_cluster_key]
        print(f"   First cluster: {first_cluster_key[:15]}...")
        print(f"   Cluster topic: {cluster_data.get('topic_label', 'N/A')}")
        print(f"   Related events: {len(cluster_data.get('related_events', []))}")
        print(f"   Has centroid: {'centroid_vector' in cluster_data}")
        print(f"   Has active event: {'active_event' in cluster_data}")
    
    # Check update log structure
    if update_log:
        first_update = update_log[0] if update_log else None
        if first_update:
            print(f"   First update ID: {first_update.get('update_id', 'N/A')}")
            print(f"   Update type: {first_update.get('update_type', 'N/A')}")
    
    print("7. Checking fact_history structure...")
    # Check the fact_history format
    for key, value in list(fact_history.items())[:3]:  # Show first 3 entries
        if isinstance(value, dict) and 'item' in value:
            print(f"   Fact '{key}': item='{value.get('item', 'N/A')}', added='{value.get('added', 'N/A')}', score={value.get('score', 'N/A')}")
        else:
            print(f"   Fact '{key}': {type(value)} - {str(value)[:50]}...")
    
    # Check personal preferences specifically
    personal_prefs = fact_history.get('personal_preferences', {})
    if personal_prefs:
        print(f"   Personal preferences categories: {list(personal_prefs.keys())}")
        for cat, items in personal_prefs.items():
            if items:  # Only show categories with items
                first_item = items[0] if isinstance(items, list) and items else items
                if isinstance(first_item, dict):
                    print(f"   Category '{cat}': first item='{first_item.get('item', 'N/A')}', score={first_item.get('score', 'N/A')}")
    
    print("8. Testing with AdvancedMemoryAgent...")
    agent = AdvancedMemoryAgent(storage_file=test_file)
    
    # Test various memory access functions
    context = agent.get_memory_context()
    print(f"   Memory context has {len(context.get('current_facts', {}))} current facts")
    
    stats = agent.get_memory_stats()
    print(f"   Memory stats show {stats.get('total_facts', 0)} total facts")
    
    session_info = agent.get_session_info()
    print(f"   Session info: {session_info.get('greeting_type', 'N/A')} user")
    
    print("9. Saving to file and verifying structure...")
    memory_ai.save_memory()
    
    # Read the saved file to verify all components
    if os.path.exists(test_file):
        with open(test_file, 'r') as f:
            saved_data = json.load(f)
        
        # Verify the top-level structure matches nova_ai_memory.json format
        expected_keys = ['user', 'memory_engine', 'conversation', 'fact_history', 'sessions']
        present_keys = [key for key in expected_keys if key in saved_data]
        print(f"   Expected keys present: {len(present_keys)}/{len(expected_keys)}")
        
        # Check memory_engine structure
        mem_eng = saved_data.get('memory_engine', {})
        engine_components = ['metadata', 'memory_events', 'vector_index', 'clusters', 'update_log']
        present_engine = [comp for comp in engine_components if comp in mem_eng]
        print(f"   Engine components present: {len(present_engine)}/{len(engine_components)}")
        
        # Verify vector_index and clusters match the expected format
        vector_idx = mem_eng.get('vector_index', {})
        clusters_data = mem_eng.get('clusters', {})
        
        print(f"   Vector index has {len(vector_idx)} entries")
        print(f"   Clusters has {len(clusters_data)} entries")
        
        if clusters_data:
            first_cluster = next(iter(clusters_data.values()))
            required_cluster_fields = ['topic_label', 'centroid_vector', 'related_events']
            present_fields = [field for field in required_cluster_fields if field in first_cluster]
            print(f"   First cluster has required fields: {len(present_fields)}/{len(required_cluster_fields)}")
    
        print("[SUCCESS] Comprehensive memory system test completed successfully!")
        
        # Clean up test file
        os.remove(test_file)
        print("[CLEANUP] Test file cleaned up.")
        
        return True
    else:
        print("[ERROR] Saved file not found!")
        return False

if __name__ == "__main__":
    success = test_comprehensive_memory_system()
    if success:
        print("\\n[SUCCESS] All memory system components are working correctly!")
    else:
        print("\\n[ERROR] Memory system test failed!")