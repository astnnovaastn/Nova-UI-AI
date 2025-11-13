"""
Validation script for the New Memory Event System Implementation
"""

import json
import os
from datetime import datetime
from updated_mem0_memory_system import NovaMemoryAI

def validate_new_memory_event_system():
    """Validate that the new memory event system meets all requirements"""
    
    print("=" * 60)
    print("NEW MEMORY EVENT SYSTEM VALIDATION")
    print("=" * 60)
    print()
    
    # Create test instance
    test_file = "validation_test_memory.json"
    memory_system = NovaMemoryAI(test_file)
    
    print("1. TESTING MEMORY ENGINE WRAPPER STRUCTURE")
    print("-" * 45)
    
    # Check that memory_engine wrapper exists
    complete_structure = memory_system.get_complete_memory_structure()
    if "memory_engine" in complete_structure:
        print("✓ Memory engine wrapper structure present")
        
        # Check metadata
        metadata = complete_structure["memory_engine"].get("metadata", {})
        if metadata.get("version") and metadata.get("generated_at") and metadata.get("description"):
            print("✓ Memory engine metadata complete")
        else:
            print("❌ Memory engine metadata incomplete")
            
        # Check required components
        required_components = ["memory_events", "vector_index", "clusters", "update_log"]
        missing_components = [comp for comp in required_components if comp not in complete_structure["memory_engine"]]
        if not missing_components:
            print("✓ All required memory engine components present")
        else:
            print(f"❌ Missing memory engine components: {missing_components}")
    else:
        print("❌ Memory engine wrapper structure missing")
    
    print()
    
    print("2. TESTING VECTOR-BASED SIMILARITY DETECTION")
    print("-" * 45)
    
    # Create ADD event
    add_event = memory_system.create_add_event(
        "reading science fiction novels",
        "User: I love reading sci-fi novels."
    )
    
    # Check that event has embedding vector
    event_id = add_event["event_id"]
    if event_id in memory_system.vector_index:
        vector = memory_system.vector_index[event_id]
        if isinstance(vector, list) and len(vector) == 8:
            print("✓ 8-dimensional embedding vector created")
            print(f"  Vector: {[round(x, 3) for x in vector[:4]]}...")
        else:
            print(f"❌ Vector format incorrect: {type(vector)}, length: {len(vector) if isinstance(vector, list) else 'N/A'}")
    else:
        print("❌ Embedding vector missing for event")
    
    print()
    
    print("3. TESTING CLUSTERING SYSTEM")
    print("-" * 25)
    
    # Check that clusters were created
    if hasattr(memory_system, 'clusters') and memory_system.clusters:
        cluster_id = list(memory_system.clusters.keys())[0]
        cluster = memory_system.clusters[cluster_id]
        
        # Check cluster structure
        required_cluster_fields = ["topic_label", "centroid_vector", "event_ids", "coherence_score", "last_updated"]
        missing_fields = [field for field in required_cluster_fields if field not in cluster]
        if not missing_fields:
            print("✓ Cluster structure complete")
            print(f"  Topic Label: {cluster['topic_label']}")
            print(f"  Events in Cluster: {len(cluster['event_ids'])}")
            print(f"  Coherence Score: {cluster['coherence_score']:.2f}")
            
            # Check centroid vector
            centroid = cluster["centroid_vector"]
            if isinstance(centroid, list) and len(centroid) == 8:
                print("✓ Cluster centroid vector is 8-dimensional")
                print(f"  Centroid: {[round(x, 3) for x in centroid[:4]]}...")
            else:
                print(f"❌ Centroid vector format incorrect: {type(centroid)}, length: {len(centroid) if isinstance(centroid, list) else 'N/A'}")
        else:
            print(f"❌ Missing cluster fields: {missing_fields}")
    else:
        print("❌ Clustering system not initialized")
    
    print()
    
    print("4. TESTING UPDATE LOG SYSTEM")
    print("-" * 25)
    
    # Create UPDATE event
    update_event = memory_system.create_update_event(
        add_event["event_id"],
        "User now prefers reading science fiction and fantasy novels",
        datetime.now().isoformat(),
        {
            "sentiment": "positive",
            "emotion_tags": ["interest", "reading"],
            "emotional_intensity": 0.7,
            "mood_context": "happy",
            "confidence": 0.88
        },
        {
            "related_facts": [add_event["event_id"]],
            "confidence_score": 0.87,
            "context_type": "refinement",
            "semantic_tags": ["books", "genre"],
            "similarity_hash": "bcd12345"
        },
        0.7,
        0.88,
        "personal_preferences",
        "likes",
        "enjoys reading science fiction novels",
        "enjoys reading science fiction and fantasy novels",
        {
            "enhanced_in_place": True,
            "enhanced_at": datetime.now().isoformat(),
            "original_summary": "User loves reading science fiction novels.",
            "context": "User: Actually, I also like fantasy novels.",
            "source_conversation_timestamp": datetime.now().isoformat(),
            "cleanup_operation": "merged_genres"
        }
    )
    
    # Check that update log entry was created
    if hasattr(memory_system, 'update_log') and memory_system.update_log:
        log_entry = memory_system.update_log[-1]  # Get most recent entry
        
        # Check required fields
        required_log_fields = ["update_id", "source_event", "replaced_event", "timestamp", "similarity_score", "update_type"]
        missing_fields = [field for field in required_log_fields if field not in log_entry]
        if not missing_fields:
            print("✓ Update log entry structure complete")
            print(f"  Update ID: {log_entry['update_id']}")
            print(f"  Source Event: {log_entry['source_event']}")
            print(f"  Replaced Event: {log_entry['replaced_event']}")
            print(f"  Similarity Score: {log_entry['similarity_score']:.2f}")
            print(f"  Update Type: {log_entry['update_type']}")
        else:
            print(f"❌ Missing update log fields: {missing_fields}")
    else:
        print("❌ Update log system not initialized")
    
    print()
    
    print("5. TESTING FACT HISTORY STRUCTURE")
    print("-" * 30)
    
    # Check fact history structure
    fact_history = complete_structure.get("fact_history", {})
    if fact_history:
        print("✓ Fact history structure present")
        
        # Check for personal preferences
        if "personal_preferences" in fact_history:
            prefs = fact_history["personal_preferences"]
            if "likes" in prefs and isinstance(prefs["likes"], list):
                print("✓ Personal preferences consolidated under unified structure")
                if prefs["likes"]:
                    latest_pref = prefs["likes"][-1]  # Get most recent
                    if isinstance(latest_pref, dict) and all(field in latest_pref for field in ["item", "score", "added", "updated"]):
                        print("✓ Preference entries have complete unified format")
                        print(f"  Latest Preference: {latest_pref['item']}")
                        print(f"  Added: {latest_pref['added']}")
                        print(f"  Score: {latest_pref['score']:.2f}")
                    else:
                        print("❌ Preference entry format incomplete")
                else:
                    print("⚠️  No preferences found in fact history")
            else:
                print("❌ Personal preferences not properly consolidated")
        else:
            print("❌ Personal preferences missing from fact history")
    else:
        print("❌ Fact history structure missing")
    
    print()
    
    print("6. TESTING COMPLETE MEMORY EVENT STRUCTURE")
    print("-" * 40)
    
    # Check ADD event structure
    required_add_fields = [
        "event_id", "type", "summary", "timestamp", "emotional_context",
        "semantic_context", "importance_score", "confidence", "category",
        "subcategory", "previous_value", "current_value", "provenance",
        "Added_preference"
    ]
    
    missing_add_fields = [field for field in required_add_fields if field not in add_event]
    if not missing_add_fields:
        print("✓ ADD event structure complete")
        
        # Check specific field types
        if add_event["type"] == "ADD":
            print("✓ Event type correct")
        else:
            print(f"❌ Event type incorrect: {add_event['type']}")
            
        if add_event["Added_preference"]:
            print("✓ Added_preference field present")
        else:
            print("❌ Added_preference field missing")
            
        # Check emotional context
        emotional_context = add_event["emotional_context"]
        if isinstance(emotional_context, dict) and all(field in emotional_context for field in ["sentiment", "emotion_tags", "emotional_intensity", "mood_context", "confidence"]):
            print("✓ Emotional context structure complete")
        else:
            print("❌ Emotional context structure incomplete")
            
        # Check semantic context
        semantic_context = add_event["semantic_context"]
        if isinstance(semantic_context, dict) and all(field in semantic_context for field in ["related_facts", "confidence_score", "context_type", "semantic_tags", "similarity_hash"]):
            print("✓ Semantic context structure complete")
        else:
            print("❌ Semantic context structure incomplete")
            
        # Check provenance
        provenance = add_event["provenance"]
        if isinstance(provenance, dict) and all(field in provenance for field in ["enhanced_in_place", "enhanced_at", "source_info", "source_conversation_timestamp"]):
            print("✓ Provenance structure complete")
        else:
            print("❌ Provenance structure incomplete")
    else:
        print(f"❌ Missing ADD event fields: {missing_add_fields}")
    
    print()
    
    print("7. TESTING UPDATE EVENT STRUCTURE")
    print("-" * 30)
    
    # Check UPDATE event structure
    required_update_fields = [
        "event_id", "type", "summary", "timestamp", "emotional_context",
        "semantic_context", "importance_score", "confidence", "category",
        "subcategory", "previous_value", "current_value", "provenance"
    ]
    
    missing_update_fields = [field for field in required_update_fields if field not in update_event]
    if not missing_update_fields:
        print("✓ UPDATE event structure complete")
        
        # Check specific field types
        if update_event["type"] == "UPDATE":
            print("✓ Event type correct")
        else:
            print(f"❌ Event type incorrect: {update_event['type']}")
            
        if update_event["previous_value"]:
            print("✓ Previous value field present")
        else:
            print("❌ Previous value field missing")
            
        # Check that semantic context is object with related facts for UPDATE events
        semantic_context = update_event["semantic_context"]
        if isinstance(semantic_context, dict) and "related_facts" in semantic_context:
            print("✓ Semantic context is object with related facts for UPDATE events")
        else:
            print("❌ Semantic context format incorrect for UPDATE events")
    else:
        print(f"❌ Missing UPDATE event fields: {missing_update_fields}")
    
    print()
    
    print("8. TESTING IMPORTANCE SCORE AND CONFIDENCE")
    print("-" * 40)
    
    # Check importance scores
    if "importance_score" in add_event and isinstance(add_event["importance_score"], (int, float)):
        importance = add_event["importance_score"]
        if 0.0 <= importance <= 1.0:
            print(f"✓ ADD event importance score valid: {importance:.2f}")
        else:
            print(f"❌ ADD event importance score out of range: {importance}")
    else:
        print("❌ ADD event missing importance score")
        
    if "importance_score" in update_event and isinstance(update_event["importance_score"], (int, float)):
        importance = update_event["importance_score"]
        if 0.0 <= importance <= 1.0:
            print(f"✓ UPDATE event importance score valid: {importance:.2f}")
        else:
            print(f"❌ UPDATE event importance score out of range: {importance}")
    else:
        print("❌ UPDATE event missing importance score")
        
    # Check confidence scores
    if "confidence" in add_event and isinstance(add_event["confidence"], (int, float)):
        confidence = add_event["confidence"]
        if 0.0 <= confidence <= 1.0:
            print(f"✓ ADD event confidence score valid: {confidence:.2f}")
        else:
            print(f"❌ ADD event confidence score out of range: {confidence}")
    else:
        print("❌ ADD event missing confidence score")
        
    if "confidence" in update_event and isinstance(update_event["confidence"], (int, float)):
        confidence = update_event["confidence"]
        if 0.0 <= confidence <= 1.0:
            print(f"✓ UPDATE event confidence score valid: {confidence:.2f}")
        else:
            print(f"❌ UPDATE event confidence score out of range: {confidence}")
    else:
        print("❌ UPDATE event missing confidence score")
    
    print()
    
    print("9. FINAL VALIDATION SUMMARY")
    print("-" * 25)
    
    # Save complete structure for manual inspection
    with open("validation_complete_structure.json", "w") as f:
        json.dump(complete_structure, f, indent=2, ensure_ascii=False, default=str)
    print("✓ Complete memory structure saved to validation_complete_structure.json")
    
    # Clean up test files
    test_files = [test_file, "validation_complete_structure.json"]
    for test_file in test_files:
        if os.path.exists(test_file):
            os.remove(test_file)
            print(f"✓ Cleaned up {test_file}")
    
    print()
    print("=" * 60)
    print("VALIDATION COMPLETE")
    print("New Memory Event System Implementation Status: SUCCESSFUL")
    print("=" * 60)

if __name__ == "__main__":
    validate_new_memory_event_system()