#!/usr/bin/env python3
"""
Test to verify that the cluster fix is working properly.
This test verifies that events with vectors result in clusters being created and maintained.
"""

import os
import json

def test_complete_cluster_functionality():
    print("Testing complete cluster functionality fix...")
    print("="*60)
    
    # Create test file
    test_file = "astra_ai/Date/test_complete_cluster_fix.json"
    
    if os.path.exists(test_file):
        os.remove(test_file)
    
    # Create test data with events and vectors but empty clusters
    test_data = {
        "user": {"user_id": "test_user"},
        "memory_engine": {
            "memory_events": [
                {
                    "event_id": "evt_001",
                    "type": "ADD",
                    "summary": "User likes to build websites",
                    "timestamp": "2025-01-01T00:00:00Z",
                    "category": "personal_preferences",
                    "current_value": "building websites"
                }
            ],
            "vector_index": {
                "evt_001": [0.5, 0.8, 0.2, 0.9, 0.1, 0.6, 0.4, 0.7]  # 8-dimensional vector
            },
            "clusters": {},  # Empty to test rebuild functionality
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
    
    print(f"Created test file with 1 event and 1 vector, 0 clusters initially")
    
    # Import and use the memory agent
    try:
        from astra_ai.memory.mem0_memory_system import create_memory_agent
        
        print("\\n1. Loading memory agent...")
        agent = create_memory_agent(storage_file=test_file)
        
        # Access the underlying memory system
        mem_sys = agent.memory_system
        
        print("2. Checking vector and cluster status after load:")
        events_count = len(mem_sys.data["memory_engine"].get("memory_events", []))
        vectors_count = len(mem_sys.data["memory_engine"].get("vector_index", {}))
        clusters_count = len(mem_sys.data["memory_engine"].get("clusters", {}))
        
        print(f"   - Events: {events_count}")
        print(f"   - Vectors: {vectors_count}")
        print(f"   - Clusters: {clusters_count}")
        
        # Now trigger a save which should maintain the clusters
        print("\\n3. Saving memory (this tests cluster maintenance)...") 
        mem_sys.save_memory()
        
        # Check final state
        final_events = len(mem_sys.data["memory_engine"].get("memory_events", []))
        final_vectors = len(mem_sys.data["memory_engine"].get("vector_index", {}))
        final_clusters = len(mem_sys.data["memory_engine"].get("clusters", {}))
        
        print("4. Final state after save:")
        print(f"   - Events: {final_events}")
        print(f"   - Vectors: {final_vectors}")  
        print(f"   - Clusters: {final_clusters}")
        
        # Also check if we can read the file back to verify clusters were saved
        print("\\n5. Verifying clusters in saved file:")
        try:
            with open(test_file, 'r', encoding='utf-8') as f:
                saved_data = json.load(f)
                saved_clusters = len(saved_data["memory_engine"].get("clusters", {}))
                saved_events = len(saved_data["memory_engine"].get("memory_events", []))
                saved_vectors = len(saved_data["memory_engine"].get("vector_index", {}))
                
                print(f"   - Saved Events: {saved_events}")
                print(f"   - Saved Vectors: {saved_vectors}")
                print(f"   - Saved Clusters: {saved_clusters}")
                
                # Show cluster details if any exist
                if saved_clusters > 0:
                    print("   - Cluster details:")
                    for cluster_id, cluster in saved_data["memory_engine"]["clusters"].items():
                        print(f"      * {cluster_id}: {cluster.get('topic', 'no topic')} - {len(cluster.get('event_ids', []))} events")
                
        except Exception as e:
            print(f"   - Could not read saved file: {e}")
        
        print("\\n" + "="*60)
        print("RESULTS:")
        print(f"Initial clusters: 0")
        print(f"Final clusters: {final_clusters}")
        print(f"Saved clusters: {saved_clusters if 'saved_clusters' in locals() else 'N/A'}")
        
        success = final_clusters > 0 and saved_clusters > 0
        if success:
            print("\\n✓ SUCCESS: CLUSTER SYSTEM IS WORKING!")
            print("  - Clusters were created from events+vectors")
            print("  - Clusters were maintained during save")
            print("  - Clusters were persisted to file")
        else:
            print("\\n✗ ISSUE: Cluster system may still have problems")
            
        return success
        
    except Exception as e:
        print(f"\\nError during test: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_complete_cluster_functionality()
    
    print(f"\\nOVERALL RESULT: {'PASS' if success else 'FAIL'}")
    print("\\nSUMMARY: The cluster system fix ensures that when events with vectors exist,")
    print("clusters are automatically created and properly maintained through save operations.") 