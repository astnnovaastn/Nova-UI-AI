#!/usr/bin/env python3
"""
Simple test to verify that vectors are accessible after loading.
"""

import os
import json

def test_vector_index_loading():
    print("Testing vector index loading after file load...")
    
    # Create a test file with known data
    test_file = "astra_ai/Date/test_simple_load.json"
    
    # Remove test file if exists
    if os.path.exists(test_file):
        os.remove(test_file)
    
    # Create test data
    test_data = {
        "user": {"user_id": "test"},
        "memory_engine": {
            "memory_events": [
                {
                    "event_id": "evt_test1",
                    "type": "ADD", 
                    "summary": "Test event",
                    "current_value": "test value",
                    "category": "test",
                    "timestamp": "2025-01-01T00:00:00Z"
                }
            ],
            "vector_index": {
                "evt_test1": [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]
            },
            "clusters": {},  # Empty clusters to test rebuild
            "update_log": []
        },
        "fact_history": {},
        "conversation": [],
        "sessions": {},
        "current_session": None,
        "conversation_state": {},
        "memory_categories": {}
    }
    
    # Write test data
    with open(test_file, 'w', encoding='utf-8') as f:
        json.dump(test_data, f, indent=2)
    
    print(f"Created test file with 1 event and 1 vector")
    
    # Import and test loading
    from astra_ai.memory.mem0_memory_system import create_memory_agent

    try:
        print("Loading with memory agent...")
        agent = create_memory_agent(storage_file=test_file)
        
        # Get the internal memory system
        mem_sys = agent.memory_system
        
        print(f"Events in memory: {len(mem_sys.data['memory_engine'].get('memory_events', []))}")
        print(f"Vectors in memory: {len(mem_sys.data['memory_engine'].get('vector_index', {}))}")
        print(f"Instance vector_index: {len(getattr(mem_sys, 'vector_index', {}))}")
        
        # Check if vector is accessible
        has_vector = 'evt_test1' in mem_sys.data['memory_engine'].get('vector_index', {})
        print(f"Can access vector for evt_test1: {has_vector}")
        
        if has_vector:
            vector = mem_sys.data['memory_engine']['vector_index']['evt_test1']
            print(f"Vector for evt_test1: {vector}")
        
        # Check clusters before and after
        print(f"Clusters before save: {len(mem_sys.data['memory_engine'].get('clusters', {}))}")
        
        # Try to save
        try:
            mem_sys.save_memory()
            print("Save completed successfully")
        except Exception as e:
            print(f"Save failed: {e}")
        
        # Check if file exists and can be read
        if os.path.exists(test_file):
            try:
                with open(test_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if content.strip():  # Check if not empty
                        saved_data = json.loads(content)
                        print(f"Saved file has {len(saved_data['memory_engine'].get('clusters', {}))} clusters")
                        print(f"Saved file has {len(saved_data['memory_engine'].get('vector_index', {}))} vectors")
                    else:
                        print("Saved file is empty!")
            except json.JSONDecodeError:
                print("Saved file is corrupted or empty")
        
        return has_vector
        
    except Exception as e:
        print(f"Error during test: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("Testing vector accessibility after load...")
    print("="*50)
    
    success = test_vector_index_loading()
    
    print("\n" + "="*50)
    if success:
        print("✓ VECTORS ARE ACCESSIBLE - This is a good sign!")
    else:
        print("✗ VECTORS NOT ACCESSIBLE - Issue still exists")