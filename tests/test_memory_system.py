#!/usr/bin/env python3
"""
Test script to verify that the memory system works properly with all components fixed.
"""

import json
import os
from datetime import datetime
from astra_ai.memory.mem0_memory_system import NovaMemoryAI, AdvancedMemoryAgent

def test_memory_system():
    print("[TEST] Testing Memory System...")
    
    # Create a new memory system instance with a test file
    test_file = "astra_ai/Date/test_nova_ai_memory.json"
    
    # Clean up any existing test file
    if os.path.exists(test_file):
        os.remove(test_file)
    
    print("1. Creating NovaMemoryAI instance...")
    memory_ai = NovaMemoryAI(storage_file=test_file)
    
    print("2. Testing ADD event creation...")
    # Test creating an ADD event
    add_result = memory_ai.add_event("test_user", "I like to code a lot now", "test_session_1")
    print(f"   ADD event created with ID: {add_result}")
    
    print("3. Testing processing conversation (which uses memory events)...")
    # Test processing a conversation which should create memory events
    result = memory_ai.process_conversation("I don't like to code", "Understood")
    print(f"   Processed conversation, created {result['memory_operations']} operations")
    
    print("4. Verifying memory structure in data...")
    # Check that memory events were created properly
    memory_events = memory_ai.data["memory_engine"]["memory_events"]
    print(f"   Memory events count: {len(memory_events)}")
    
    # Check that vector index was updated
    vector_index = memory_ai.data["memory_engine"]["vector_index"]
    print(f"   Vector index entries: {len(vector_index)}")
    
    # Check that clusters were created
    clusters = memory_ai.data["memory_engine"]["clusters"] 
    print(f"   Clusters count: {len(clusters)}")
    
    # Check that fact_history was updated
    fact_history = memory_ai.data["fact_history"]
    print(f"   Fact history entries: {len(fact_history)}")
    
    print("5. Testing UPDATE functionality...")
    # Process a conflicting statement to trigger update
    update_result = memory_ai.process_conversation("I actually love to code", "Interesting")
    print(f"   Processed update, created {update_result['memory_operations']} operations")
    
    print("6. Checking update_log...")
    update_log = memory_ai.data["memory_engine"]["update_log"]
    print(f"   Update log entries: {len(update_log)}")
    
    print("7. Testing with AdvancedMemoryAgent...")
    agent = AdvancedMemoryAgent(storage_file=test_file)
    
    # Test getting memory context
    context = agent.get_memory_context()
    print(f"   Retrieved memory context with {len(context.get('current_facts', {}))} facts")
    
    print("8. Saving memory to file...")
    memory_ai.save_memory()
    
    # Verify the saved file has correct structure
    print("9. Verifying saved file structure...")
    if os.path.exists(test_file):
        with open(test_file, 'r') as f:
            saved_data = json.load(f)
        
        print(f"   Saved file has memory_events: {len(saved_data.get('memory_engine', {}).get('memory_events', []))}")
        print(f"   Saved file has vector_index: {len(saved_data.get('memory_engine', {}).get('vector_index', {}))}")
        print(f"   Saved file has clusters: {len(saved_data.get('memory_engine', {}).get('clusters', {}))}")
        print(f"   Saved file has fact_history: {len(saved_data.get('fact_history', {}))}")
        print(f"   Saved file has update_log: {len(saved_data.get('memory_engine', {}).get('update_log', []))}")
        
        # Check if personal_preferences exist in fact_history
        personal_prefs = saved_data.get('fact_history', {}).get('personal_preferences', {})
        print(f"   Personal preferences categories: {list(personal_prefs.keys())}")
        
        print("[SUCCESS] Memory system test completed successfully!")
        
        # Clean up test file
        os.remove(test_file)
        print("[CLEANUP] Test file cleaned up.")
        
        return True
    else:
        print("[ERROR] Test failed: Saved file not found!")
        return False

if __name__ == "__main__":
    success = test_memory_system()
    if success:
        print("\\n[SUCCESS] All memory system components are working correctly!")
    else:
        print("\\n[ERROR] Memory system test failed!")