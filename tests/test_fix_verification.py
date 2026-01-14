#!/usr/bin/env python3
"""
Quick test to verify that the main issue is fixed.
This recreates the scenario where we have events and vectors but empty clusters.
"""

import os
import json
from astra_ai.memory.mem0_memory_system import create_memory_agent

def test_with_existing_data():
    print("Testing fix with existing data that has events but no clusters...")
    
    # Create a test file with events but empty clusters (simulating the original problem)
    test_file = "astra_ai/Date/test_fix_verification.json"
    
    # Remove if exists
    if os.path.exists(test_file):
        os.remove(test_file)
    
    # Create test data exactly as described in the issue - events with vectors but no clusters
    test_data = {
        "user": {
            "user_id": "default_user",
            "name": None,
            "created_at": "2025-11-14T00:00:00.000000",
            "status": "active",
            "total_sessions": 1,
            "last_seen": "2025-11-14T00:00:00.000000",
            "relationship_established": False
        },
        "memory_engine": {
            "metadata": {
                "version": "1.0",
                "generated_at": "2025-11-14T00:00:00.000000",
                "description": "Mem0 AI Memory Engine - Event-based user memory management system"
            },
            "memory_events": [
                {
                    "event_id": "evt_test1",
                    "type": "ADD",
                    "summary": "User likes to build websites",
                    "timestamp": "2025-11-14T00:00:00.000000Z",
                    "emotional_context": {
                        "sentiment": "neutral",
                        "emotion_tags": [],
                        "emotional_intensity": 0.5,
                        "mood_context": "normal",
                        "confidence": 0.7
                    },
                    "semantic_context": "Inferred from input: 'I like to build websites'",
                    "importance_score": 0.8,
                    "confidence": 0.85,
                    "category": "personal_preferences",
                    "subcategory": "preferences",
                    "previous_value": None,
                    "current_value": "like to build websites",
                    "provenance": {
                        "enhanced_in_place": True,
                        "enhanced_at": "2025-11-14T00:00:00.000000Z",
                        "source_info": {
                            "source_type": "conversation",
                            "source_details": "chat input",
                            "context": "User: I like to build websites",
                            "event_index": 0
                        },
                        "source_conversation_timestamp": "2025-11-14T00:00:00.000000Z"
                    },
                    "Added_preference": "User preferences like to build websites",
                    "session_id": "session_test"
                }
            ],
            "vector_index": {
                "evt_test1": [0.6, 0.1, 0.4, 0.3, 0.5, 0.2, 0.0, 0.0]
            },
            "clusters": {},  # This is the problem - empty clusters!
            "update_log": []
        },
        "conversation": [],
        "fact_history": {
            "personal_preferences": {
                "preferences": [
                    {
                        "item": "like to build websites",
                        "added": "2025-11-14",
                        "score": 0.85
                    }
                ]
            }
        },
        "sessions": {
            "session_test": {
                "session_id": "session_test",
                "start_time": "2025-11-14T00:00:00.000000",
                "end_time": None,
                "message_count": 1,
                "topics_discussed": [],
                "user_name": None,
                "session_duration": None,
                "last_activity": "2025-11-14T00:00:00.000000"
            }
        },
        "current_session": "session_test",
        "conversation_state": {
            "greeting_completed": False,
            "introduction_phase": True,
            "established_user": False
        },
        "memory_categories": {}
    }
    
    # Write the test file
    with open(test_file, 'w', encoding='utf-8') as f:
        json.dump(test_data, f, indent=2)
    
    print(f"Created test file with 1 event and vector, but empty clusters")
    print(f"Initial state - Events: {len(test_data['memory_engine']['memory_events'])}, Vectors: {len(test_data['memory_engine']['vector_index'])}, Clusters: {len(test_data['memory_engine']['clusters'])}")
    
    # Now load this file with the memory system which should trigger cluster rebuild
    print("\nLoading with memory system to trigger cluster rebuilding...")
    try:
        agent = create_memory_agent(storage_file=test_file)
        
        # Since we don't know the exact interface, let's see if there's a way to trigger clustering
        print("Memory agent loaded successfully")
        
        # The loading process itself should trigger cluster rebuilding based on our fixes
        # Let's save to make sure any rebuilds are persisted
        print("Saving to persist any rebuilt clusters...")
        agent.memory_system.save_memory() # Try saving via the internal memory system
        
        # Now read the file back to see if clusters were created
        with open(test_file, 'r', encoding='utf-8') as f:
            result_data = json.load(f)
        
        final_events = len(result_data['memory_engine']['memory_events'])
        final_vectors = len(result_data['memory_engine']['vector_index'])
        final_clusters = len(result_data['memory_engine']['clusters'])
        
        print(f"\nFinal state - Events: {final_events}, Vectors: {final_vectors}, Clusters: {final_clusters}")
        
        if final_clusters > 0:
            print("✓ SUCCESS: Clusters were automatically created/rebuilt!")
            print("Available clusters:")
            for cluster_id, cluster_info in result_data['memory_engine']['clusters'].items():
                print(f"  - {cluster_id}: {cluster_info.get('topic', 'Unknown')} with {len(cluster_info.get('event_ids', []))} events")
            return True
        else:
            print("✗ ISSUE: No clusters were created despite events and vectors existing")
            return False
            
    except Exception as e:
        print(f"Error during test: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Testing the cluster fix with problematic data...")
    print("="*60)
    
    success = test_with_existing_data()
    
    print("\n" + "="*60)
    print("TEST RESULT:")
    if success:
        print("✓ PASS: The fix successfully rebuilds clusters when events exist but clusters are empty!")
    else:
        print("✗ FAIL: The fix did not work properly.")
    
    print("\nThe fix addresses the main issue where events and vectors exist")
    print("but clusters remain empty ({}) in the JSON file.")