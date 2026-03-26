#!/usr/bin/env python3
"""
Final verification that the original issue is fixed:
Empty clusters in nova_ai_memory.json when events and vectors exist
"""

import json
import os

def verify_original_issue_fixed():
    print("FINAL VERIFICATION: Original issue fix")
    print("="*50)
    print("Issue: clusters were empty ({}) in nova_ai_memory.json despite events and vectors")
    print()
    
    # Create a file with events+vectors but no clusters (the exact original problem)
    test_file = "astra_ai/Date/final_verification_test.json"
    
    if os.path.exists(test_file):
        os.remove(test_file)
    
    # This mimics the exact structure from the original problem
    original_problem_data = {
        "user": {
            "user_id": "default_user",
            "name": None,
            "created_at": "2025-11-13T22:37:23.791641",
            "status": "active",
            "total_sessions": 1,
            "last_seen": "2025-11-13T22:37:23.793772",
            "relationship_established": False
        },
        "memory_engine": {
            "metadata": {
                "version": "1.0",
                "generated_at": "2025-11-13T22:37:50.864603",
                "description": "Mem0 AI Memory Engine - Event-based user memory management system"
            },
            "memory_events": [
                {
                    "event_id": "evt_verification",
                    "type": "ADD",
                    "summary": "User likes building websites",
                    "timestamp": "2025-11-13T22:37:50.537814Z",
                    "emotional_context": {
                        "sentiment": "neutral",
                        "emotion_tags": [],
                        "emotional_intensity": 0.6,
                        "mood_context": "normal",
                        "confidence": 0.7
                    },
                    "semantic_context": "Inferred from input: 'I like to build websites'",
                    "importance_score": 0.81,
                    "confidence": 0.85,
                    "category": "personal_preferences",
                    "subcategory": "preferences",
                    "previous_value": None,
                    "current_value": "like to build websites",
                    "provenance": {
                        "enhanced_in_place": True,
                        "enhanced_at": "2025-11-13T22:37:50.537814Z",
                        "source_info": {
                            "source_type": "conversation",
                            "source_details": "chat input",
                            "context": "User: I like to build websites",
                            "event_index": 0
                        },
                        "source_conversation_timestamp": "2025-11-13T22:37:50.537814Z"
                    },
                    "Added_preference": "User preferences like to build websites",
                    "session_id": "session_verif"
                }
            ],
            "vector_index": {
                "evt_verification": [0.6115928396627265, 0.0873704056661038, 0.43685202833051895, 0.3494816226644152, 0.5242224339966227, 0.1747408113322076, 0.0, 0.0]
            },
            "clusters": {},  # This was the original empty clusters issue
            "update_log": []
        },
        "conversation": [
            {
                "role": "user",
                "content": "I like to build websites",
                "timestamp": "2025-11-13T22:37:50.533444",
                "session_id": "session_verif"
            }
        ],
        "fact_history": {},
        "sessions": {
            "session_verif": {
                "session_id": "session_verif",
                "start_time": "2025-11-13T22:37:23.793772",
                "end_time": None,
                "message_count": 1,
                "topics_discussed": [],
                "user_name": None,
                "session_duration": None,
                "last_activity": "2025-11-13T22:37:50.533444"
            }
        },
        "current_session": "session_verif",
        "conversation_state": {
            "greeting_completed": False,
            "introduction_phase": True,
            "established_user": False
        },
        "memory_categories": {}
    }
    
    # Write the file that mimics the original problem
    with open(test_file, 'w', encoding='utf-8') as f:
        json.dump(original_problem_data, f, indent=2)
    
    print("1. Created file with:")
    print("   - 1 event: 'User likes building websites'")
    print("   - 1 vector: 8-dimensional embedding")
    print("   - 0 clusters: {} (THE ORIGINAL PROBLEM)")
    print()
    
    # Load with the memory system - this should now trigger cluster rebuild
    try:
        from astra_ai.memory.mem0_memory_system import create_memory_agent
        
        print("2. Loading with memory agent (this triggers cluster rebuild)...")
        agent = create_memory_agent(storage_file=test_file)
        
        # Check internal state
        mem_sys = agent.memory_system
        events = len(mem_sys.data["memory_engine"]["memory_events"])
        vectors = len(mem_sys.data["memory_engine"]["vector_index"])
        clusters = len(mem_sys.data["memory_engine"]["clusters"])
        
        print(f"3. Internal state after loading:")
        print(f"   - Events: {events}")
        print(f"   - Vectors: {vectors}") 
        print(f"   - CLUSTERS: {clusters} ← THIS IS THE KEY!")
        
        if clusters > 0:
            print(f"   - Cluster details: {list(mem_sys.data['memory_engine']['clusters'].keys())}")
            for cluster_id, cluster_info in mem_sys.data["memory_engine"]["clusters"].items():
                print(f"     • {cluster_id}: {cluster_info.get('topic', 'Unknown')} with {len(cluster_info.get('event_ids', []))} events")
        
        print()
        print("4. Performing save operation (tests cluster maintenance)...")
        mem_sys.save_memory()
        
        final_clusters = len(mem_sys.data["memory_engine"]["clusters"])
        print(f"5. Final state after save:")
        print(f"   - CLUSTERS: {final_clusters}")
        
        # The key test: did clusters survive the save operation?
        success = clusters > 0 and final_clusters > 0
        
        print()
        print("="*50)
        print("VERIFICATION RESULTS:")
        print(f"Original clusters: 0")
        print(f"Rebuilt clusters: {clusters}")
        print(f"Maintained clusters: {final_clusters}")
        
        if success:
            print()
            print("🎉 SUCCESS: The original issue is FIXED!")
            print("   ✓ Empty clusters were rebuilt when events+vectors existed") 
            print("   ✓ Clusters were maintained during save operations")
            print("   ✓ The cluster system now works as intended")
        else:
            print()
            print("❌ ISSUE: The original problem may still exist")
            
        print()
        print("ORIGINAL ISSUE STATUS:")
        if success:
            print("   FIXED ✓ - Clusters are no longer empty when events and vectors exist")
        else:
            print("   PERSISTING ✗ - Clusters remain empty despite events and vectors")
            
        return success
        
    except Exception as e:
        print(f"Error during verification: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = verify_original_issue_fixed()
    
    print()
    print("CONCLUSION:")
    if success:
        print("The cluster system improvements have successfully resolved the issue!")
        print("Events with vectors now properly generate and maintain clusters.")
    else:
        print("Further investigation needed.")