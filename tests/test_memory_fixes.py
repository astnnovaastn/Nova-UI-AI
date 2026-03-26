#!/usr/bin/env python3
"""
Test script to verify fixes for the memory system issues:
1. Random context events should not be created for meaningless inputs like "hi"
2. Vector_index and clusters should be populated in the JSON output
3. Session_id should be properly stored in conversation messages
4. Current_session should be used properly
"""

import json
import os
import time
from astra_ai.memory.mem0_memory_system import AdvancedMemoryAgent

def test_memory_system_fixes():
    print("Testing memory system fixes...")
    
    # Create a test memory agent with a temporary storage file
    storage_file = "test_memory_fixes.json"
    
    # Remove previous test file if it exists
    if os.path.exists(storage_file):
        os.remove(storage_file)
    
    agent = AdvancedMemoryAgent(storage_file=storage_file)
    
    # Wait a moment for the organizer to initialize
    time.sleep(0.1)
    
    # Test interaction 1: Simple greeting (should not create meaningful memory events)
    print("\n1. Testing simple greeting 'hi'...")
    try:
        result1 = agent.process_conversation("hi", "Hello! What's your name?", session_id="test_session_001")
        if result1:
            print(f"   Memory operations: {result1['memory_operations']}")
        else:
            print("   Memory operations: None (method returned None)")
    except Exception as e:
        print(f"   Error in first interaction: {e}")
    
    # Wait to allow file operations to complete
    time.sleep(0.1)
    
    # Test interaction 2: Meaningful preference (should create memory events)
    print("\n2. Testing meaningful preference 'I like anime'...")
    try:
        result2 = agent.process_conversation("I like anime", "That's great! I'll remember that.", session_id="test_session_001")
        if result2:
            print(f"   Memory operations: {result2['memory_operations']}")
        else:
            print("   Memory operations: None (method returned None)")
    except Exception as e:
        print(f"   Error in second interaction: {e}")
    
    # Wait to allow file operations to complete
    time.sleep(0.1)
    
    # Test interaction 3: Another meaningful fact
    print("\n3. Testing meaningful fact 'I work as a developer'...")
    try:
        result3 = agent.process_conversation("I work as a developer", "Thanks for sharing your profession.", session_id="test_session_001")
        if result3:
            print(f"   Memory operations: {result3['memory_operations']}")
        else:
            print("   Memory operations: None (method returned None)")
    except Exception as e:
        print(f"   Error in third interaction: {e}")
    
    # Wait to allow file operations to complete
    time.sleep(0.1)
    
    # Test interaction 4: Another greeting (should not create memory events)
    print("\n4. Testing another greeting 'hello'...")
    try:
        result4 = agent.process_conversation("hello", "Hi again! How can I help?", session_id="test_session_001")
        if result4:
            print(f"   Memory operations: {result4['memory_operations']}")
        else:
            print("   Memory operations: None (method returned None)")
    except Exception as e:
        print(f"   Error in fourth interaction: {e}")
    
    # Wait for file operations to complete before reading
    time.sleep(0.5)
    
    # Now let's check the memory file to verify the fixes
    print(f"\n5. Checking content of {storage_file}...")
    if os.path.exists(storage_file):
        try:
            with open(storage_file, 'r') as f:
                data = json.load(f)
        except PermissionError:
            print(f"   Could not read {storage_file} due to permission error (may be locked by organizer)")
            # Wait and try again
            time.sleep(1)
            try:
                with open(storage_file, 'r') as f:
                    data = json.load(f)
            except:
                print("   Still unable to read file. Skipping detailed analysis.")
                return
        
        print("\n   CONVERSATION SECTION (checking session_id values):")
        for i, msg in enumerate(data.get("conversation", [])):
            print(f"     [{i}] {msg.get('role')}: '{msg.get('content')}' - session_id: {msg.get('session_id')}")
        
        print(f"\n   TOTAL MEMORY EVENTS: {len(data.get('memory_engine', {}).get('memory_events', []))}")
        
        print(f"\n   VECTOR INDEX SIZE: {len(data.get('memory_engine', {}).get('vector_index', {}))}")
        print(f"   ROOT VECTOR INDEX SIZE: {len(data.get('vector_index', {}))}")
        
        print(f"\n   CLUSTERS COUNT: {len(data.get('memory_engine', {}).get('clusters', {}))}")
        print(f"   ROOT CLUSTERS COUNT: {len(data.get('clusters', {}))}")
        
        print(f"\n   CURRENT SESSION: {data.get('current_session')}")
        
        print(f"\n   MEMORY EVENTS SAMPLE:")
        for i, event in enumerate(data.get('memory_engine', {}).get('memory_events', [])[:5]):  # Show first 5
            print(f"     [{i}] Type: {event.get('type')}, Summary: '{event.get('summary')}', Category: {event.get('category')}, subcategory: {event.get('subcategory')}")
        
        print(f"\n   Checking that vector_index and clusters are synchronized...")
        vector_index_root = data.get('vector_index', {})
        vector_index_engine = data.get('memory_engine', {}).get('vector_index', {})
        clusters_root = data.get('clusters', {})
        clusters_engine = data.get('memory_engine', {}).get('clusters', {})
        
        print(f"     Root vector_index: {len(vector_index_root)} items")
        print(f"     Memory Engine vector_index: {len(vector_index_engine)} items")
        print(f"     Root clusters: {len(clusters_root)} items")
        print(f"     Memory Engine clusters: {len(clusters_engine)} items")
        
        # Verify synchronization
        if vector_index_root == vector_index_engine:
            print("     [OK] Vector index is synchronized between root and memory_engine")
        else:
            print("     [FAIL] Vector index is NOT synchronized between root and memory_engine")
            
        if clusters_root == clusters_engine:
            print("     [OK] Clusters are synchronized between root and memory_engine")
        else:
            print("     [FAIL] Clusters are NOT synchronized between root and memory_engine")
        
        # Check for meaningless events
        print(f"\n   Checking for meaningless events (should not exist for simple greetings)...")
        meaningless_events = []
        for event in data.get('memory_engine', {}).get('memory_events', []):
            summary = event.get('summary', '').lower()
            if 'user greetings hi' in summary or 'user greetings hello' in summary:
                meaningless_events.append(event)
        
        if meaningless_events:
            print(f"     [FAIL] Found {len(meaningless_events)} meaningless greeting events:")
            for event in meaningless_events:
                print(f"       - {event.get('summary')}")
        else:
            print("     [OK] No meaningless greeting events found - filtering is working!")
            
        # Check if any conversation messages have null session_id
        print(f"\n   Checking for null session_id in conversation messages...")
        null_session_count = 0
        for msg in data.get("conversation", []):
            if msg.get('session_id') is None or msg.get('session_id') == 'session_unknown':
                null_session_count += 1
                print(f"     Found null session_id: {msg}")
        
        if null_session_count == 0:
            print("     [OK] No null session_id values found in conversation messages!")
        else:
            print(f"     [FAIL] Found {null_session_count} messages with null session_id values")
    
    else:
        print(f"   ERROR: {storage_file} was not created!")
        
    # Clean up
    try:
        if os.path.exists(storage_file):
            os.remove(storage_file)
            print(f"\n   Cleaned up test file: {storage_file}")
    except:
        print(f"\n   Could not remove test file {storage_file} (may still be locked)")
    
    print("\nTest completed!")

if __name__ == "__main__":
    test_memory_system_fixes()