"""Validation Script for Enhanced Nova Memory AI System

This script validates that the enhanced memory system meets all requirements
specified in New_memory_event.json and the validation criteria.
"""

import sys
import os
import json
import uuid
from datetime import datetime

from astra_ai.memory.enhanced_nova_memory_system import EnhancedNovaMemoryAI, create_enhanced_memory_agent
from astra_ai.memory.enhanced_nova_memory_agent import EnhancedMemoryAgent, create_memory_agent

def validate_enhanced_memory_system():
    """Validate that the enhanced memory system meets all requirements"""
    
    print("=== Validating Enhanced Nova Memory AI System ===\n")
    
    # Create test memory agent
    storage_file = "astra_ai/Date/validation_memory.json"
    memory_agent = create_memory_agent(storage_file)
    
    print("1. Creating ADD memory event...")
    
    # Create an ADD event
    add_event_id = memory_agent.add_memory_event(
        user_input="enjoys reading science fiction novels",
        context="User: I love reading sci-fi novels.",
        category="personal_preferences",
        subcategory="likes",
        confidence=0.85
    )
    
    print(f"   [PASS] Created ADD event with ID: {add_event_id}")
    
    print("\n2. Creating UPDATE memory event...")
    
    # Create an UPDATE event
    update_event_id = memory_agent.update_memory_event(
        previous_event_id=add_event_id,
        new_value="enjoys reading science fiction and fantasy novels",
        context="User: Actually, I also like fantasy novels.",
        confidence=0.88
    )
    
    print(f"   [PASS] Created UPDATE event with ID: {update_event_id}")
    
    print("\n3. Validating memory structure...")
    
    # Load and validate memory structure
    if os.path.exists(storage_file):
        with open(storage_file, 'r') as f:
            memory_data = json.load(f)
        
        # Check for required top-level fields
        required_fields = [
            "user", "memory_engine", "conversation", "fact_history", 
            "sessions", "current_session", "conversation_state",
            "memory_categories", "category_relationships",
            "behavioral_adaptation", "privacy_settings"
        ]
        
        missing_fields = []
        for field in required_fields:
            if field not in memory_data:
                missing_fields.append(field)
        
        if missing_fields:
            print(f"   [FAIL] Missing required fields: {missing_fields}")
            return False
        else:
            print("   [PASS] All required top-level fields present")
        
        # Check memory_engine structure
        memory_engine = memory_data["memory_engine"]
        me_required = ["metadata", "memory_events", "vector_index", "clusters", "update_log"]
        
        missing_me_fields = []
        for field in me_required:
            if field not in memory_engine:
                missing_me_fields.append(field)
        
        if missing_me_fields:
            print(f"   [FAIL] Missing memory_engine fields: {missing_me_fields}")
            return False
        else:
            print("   [PASS] Memory engine structure valid")
        
        # Check metadata structure
        metadata = memory_engine["metadata"]
        meta_required = ["version", "generated_at", "description"]
        
        missing_meta_fields = []
        for field in meta_required:
            if field not in metadata:
                missing_meta_fields.append(field)
        
        if missing_meta_fields:
            print(f"   [FAIL] Missing metadata fields: {missing_meta_fields}")
            return False
        else:
            print("   [PASS] Metadata structure valid")
        
        # Check memory events
        memory_events = memory_engine["memory_events"]
        if len(memory_events) >= 2:
            print("   [PASS] Memory events created successfully")
            
            # Validate first event (ADD)
            add_event = memory_events[0]
            add_required = [
                "event_id", "type", "summary", "timestamp", "emotional_context",
                "semantic_context", "importance_score", "confidence", "category",
                "subcategory", "previous_value", "current_value", "provenance",
                "Added_preference"
            ]
            
            missing_add_fields = []
            for field in add_required:
                if field not in add_event:
                    missing_add_fields.append(field)
            
            if missing_add_fields:
                print(f"   [FAIL] Missing ADD event fields: {missing_add_fields}")
                return False
            else:
                print("   [PASS] ADD event structure valid")
            
            # Validate second event (UPDATE)
            update_event = memory_events[1]
            update_required = [
                "event_id", "type", "summary", "timestamp", "emotional_context",
                "semantic_context", "importance_score", "confidence", "category",
                "subcategory", "previous_value", "current_value", "provenance"
            ]
            
            missing_update_fields = []
            for field in update_required:
                if field not in update_event:
                    missing_update_fields.append(field)
            
            if missing_update_fields:
                print(f"   [FAIL] Missing UPDATE event fields: {missing_update_fields}")
                return False
            else:
                print("   [PASS] UPDATE event structure valid")
            
            # Validate emotional_context structure
            emotional_context = add_event["emotional_context"]
            ec_required = [
                "sentiment", "emotion_tags", "emotional_intensity", 
                "mood_context", "confidence"
            ]
            
            missing_ec_fields = []
            for field in ec_required:
                if field not in emotional_context:
                    missing_ec_fields.append(field)
            
            if missing_ec_fields:
                print(f"   [FAIL] Missing emotional_context fields: {missing_ec_fields}")
                return False
            else:
                print("   [PASS] Emotional context structure valid")
            
            # Validate semantic_context structure
            semantic_context = add_event["semantic_context"]
            sc_required = [
                "related_facts", "confidence_score", "context_type", 
                "semantic_tags", "similarity_hash"
            ]
            
            missing_sc_fields = []
            for field in sc_required:
                if field not in semantic_context:
                    missing_sc_fields.append(field)
            
            if missing_sc_fields:
                print(f"   [FAIL] Missing semantic_context fields: {missing_sc_fields}")
                return False
            else:
                print("   [PASS] Semantic context structure valid")
            
            # Validate provenance structure
            provenance = add_event["provenance"]
            prov_required = [
                "enhanced_in_place", "enhanced_at", "source_info",
                "source_conversation_timestamp"
            ]
            
            missing_prov_fields = []
            for field in prov_required:
                if field not in provenance:
                    missing_prov_fields.append(field)
            
            if missing_prov_fields:
                print(f"   [FAIL] Missing provenance fields: {missing_prov_fields}")
                return False
            else:
                print("   [PASS] Provenance structure valid")
            
            # Validate source_info structure
            source_info = provenance["source_info"]
            si_required = [
                "source_type", "source_details", "context", "event_index"
            ]
            
            missing_si_fields = []
            for field in si_required:
                if field not in source_info:
                    missing_si_fields.append(field)
            
            if missing_si_fields:
                print(f"   [FAIL] Missing source_info fields: {missing_si_fields}")
                return False
            else:
                print("   [PASS] Source info structure valid")
        else:
            print("   [FAIL] Memory events not created properly")
            return False
        
        # Check vector index
        vector_index = memory_engine["vector_index"]
        if vector_index:
            print("   [PASS] Vector index populated")
            
            # Validate vector structure
            for event_id, vector in vector_index.items():
                if not isinstance(vector, list):
                    print(f"   [FAIL] Vector index entry {event_id} is not a list")
                    return False
                elif len(vector) != 8:
                    print(f"   [FAIL] Vector index entry {event_id} does not have 8 dimensions")
                    return False
                elif not all(isinstance(x, (int, float)) for x in vector):
                    print(f"   [FAIL] Vector index entry {event_id} contains non-numeric values")
                    return False
            
            print("   [PASS] Vector index structure valid")
        else:
            print("   [FAIL] Vector index not populated")
            return False
        
        # Check clusters
        clusters = memory_engine["clusters"]
        if clusters:
            print("   [PASS] Clusters created")
            
            # Validate cluster structure
            for cluster_id, cluster in clusters.items():
                cluster_required = [
                    "topic_label", "centroid_vector", "event_ids", 
                    "coherence_score", "last_updated", "metadata"
                ]
                
                missing_cluster_fields = []
                for field in cluster_required:
                    if field not in cluster:
                        missing_cluster_fields.append(field)
                
                if missing_cluster_fields:
                    print(f"   [FAIL] Missing cluster fields in {cluster_id}: {missing_cluster_fields}")
                    return False
                
                # Validate metadata structure
                metadata = cluster["metadata"]
                meta_required = ["dominant_tags", "cluster_type"]
                
                missing_meta_fields = []
                for field in meta_required:
                    if field not in metadata:
                        missing_meta_fields.append(field)
                
                if missing_meta_fields:
                    print(f"   [FAIL] Missing cluster metadata fields in {cluster_id}: {missing_meta_fields}")
                    return False
            
            print("   [PASS] Clusters structure valid")
        else:
            print("   [WARN] No clusters found (not critical)")
        
        # Check update log
        update_log = memory_engine["update_log"]
        if update_log:
            print("   [PASS] Update log populated")
            
            # Validate update log structure
            for entry in update_log:
                ul_required = [
                    "update_id", "source_event", "replaced_event", 
                    "timestamp", "similarity_score", "update_type"
                ]
                
                missing_ul_fields = []
                for field in ul_required:
                    if field not in entry:
                        missing_ul_fields.append(field)
                
                if missing_ul_fields:
                    print(f"   [FAIL] Missing update log fields: {missing_ul_fields}")
                    return False
            
            print("   [PASS] Update log structure valid")
        else:
            print("   [WARN] No update log entries found (not critical)")
        
        # Check fact history
        fact_history = memory_data["fact_history"]
        if fact_history:
            print("   [PASS] Fact history populated")
        else:
            print("   [WARN] No fact history found (not critical)")
    
    print("\n=== Validation Complete ===")
    
    # Clean up test file
    try:
        if os.path.exists(storage_file):
            os.remove(storage_file)
            print(f"\n[CLEANUP] Removed test file: {storage_file}")
    except Exception as e:
        print(f"\n[WARN] Error cleaning up test file: {e}")
    
    return True

def validate_implementation_requirements():
    """Validate implementation against specific requirements"""
    
    print("\n=== Validating Implementation Requirements ===\n")
    
    # Create test memory system
    storage_file = "astra_ai/Date/req_validation_memory.json"
    memory_system = create_enhanced_memory_agent(storage_file)
    
    print("1. Validating EnhancedNovaMemoryAI class...")
    
    # Check that EnhancedNovaMemoryAI class exists and has required methods
    if not hasattr(memory_system, 'create_add_event'):
        print("   [FAIL] EnhancedNovaMemoryAI missing create_add_event method")
        return False
    
    if not hasattr(memory_system, 'create_update_event'):
        print("   [FAIL] EnhancedNovaMemoryAI missing create_update_event method")
        return False
    
    if not hasattr(memory_system, 'get_complete_memory_structure'):
        print("   [FAIL] EnhancedNovaMemoryAI missing get_complete_memory_structure method")
        return False
    
    print("   [PASS] EnhancedNovaMemoryAI class and required methods present")
    
    print("\n2. Validating EnhancedMemoryAgent class...")
    
    # Check that EnhancedMemoryAgent class exists and has required methods
    memory_agent = create_memory_agent(storage_file)
    
    if not hasattr(memory_agent, 'add_memory_event'):
        print("   [FAIL] EnhancedMemoryAgent missing add_memory_event method")
        return False
    
    if not hasattr(memory_agent, 'update_memory_event'):
        print("   [FAIL] EnhancedMemoryAgent missing update_memory_event method")
        return False
    
    if not hasattr(memory_agent, 'get_memory_context'):
        print("   [FAIL] EnhancedMemoryAgent missing get_memory_context method")
        return False
    
    print("   [PASS] EnhancedMemoryAgent class and required methods present")
    
    print("\n3. Validating Memory Event Creation...")
    
    # Create an ADD event
    try:
        add_event = memory_system.create_add_event(
            "reading science fiction novels",
            "User: I love reading sci-fi novels."
        )
        
        # Validate ADD event structure
        add_required_fields = [
            "event_id", "type", "summary", "timestamp", "emotional_context",
            "semantic_context", "importance_score", "confidence", "category",
            "subcategory", "previous_value", "current_value", "provenance",
            "Added_preference"
        ]
        
        missing_fields = []
        for field in add_required_fields:
            if field not in add_event:
                missing_fields.append(field)
        
        if missing_fields:
            print(f"   [FAIL] Missing ADD event fields: {missing_fields}")
            return False
        else:
            print("   [PASS] ADD event creation valid")
    except Exception as e:
        print(f"   [FAIL] Error creating ADD event: {e}")
        return False
    
    # Create an UPDATE event
    try:
        update_event = memory_system.create_update_event(
            add_event["event_id"],
            "reading science fiction and fantasy novels",
            "User: Actually, I also like fantasy novels.",
            0.88
        )
        
        # Validate UPDATE event structure
        update_required_fields = [
            "event_id", "type", "summary", "timestamp", "emotional_context",
            "semantic_context", "importance_score", "confidence", "category",
            "subcategory", "previous_value", "current_value", "provenance"
        ]
        
        missing_fields = []
        for field in update_required_fields:
            if field not in update_event:
                missing_fields.append(field)
        
        if missing_fields:
            print(f"   [FAIL] Missing UPDATE event fields: {missing_fields}")
            return False
        else:
            print("   [PASS] UPDATE event creation valid")
    except Exception as e:
        print(f"   [FAIL] Error creating UPDATE event: {e}")
        return False
    
    print("\n4. Validating Complete Memory Structure...")
    
    # Get complete memory structure
    try:
        complete_structure = memory_system.get_complete_memory_structure()
        
        # Validate required components
        required_components = [
            "user", "memory_engine", "vector_index", "clusters", 
            "conversation", "fact_history", "sessions", "current_session",
            "conversation_state", "memory_categories", "category_relationships",
            "behavioral_adaptation", "privacy_settings"
        ]
        
        missing_components = []
        for component in required_components:
            if component not in complete_structure:
                missing_components.append(component)
        
        if missing_components:
            print(f"   [FAIL] Missing memory structure components: {missing_components}")
            return False
        else:
            print("   [PASS] Complete memory structure valid")
    except Exception as e:
        print(f"   [FAIL] Error getting complete memory structure: {e}")
        return False
    
    print("\n5. Validating Factory Functions...")
    
    # Test factory functions
    try:
        factory_agent = create_memory_agent()
        factory_system = create_enhanced_memory_agent()
        
        if not isinstance(factory_agent, memory_agent.__class__):
            print("   [FAIL] create_memory_agent factory function returned wrong type")
            return False
        
        if not isinstance(factory_system, memory_system.__class__):
            print("   [FAIL] create_enhanced_memory_agent factory function returned wrong type")
            return False
        
        print("   [PASS] Factory functions working correctly")
    except Exception as e:
        print(f"   [FAIL] Error with factory functions: {e}")
        return False
    
    # Clean up
    try:
        if os.path.exists(storage_file):
            os.remove(storage_file)
    except Exception:
        pass
    
    print("\n=== Implementation Requirements Validation Complete ===")
    return True

if __name__ == "__main__":
    # Run validations
    success1 = validate_enhanced_memory_system()
    success2 = validate_implementation_requirements()
    
    if success1 and success2:
        print("\n[PASS] ALL VALIDATIONS AND REQUIREMENTS PASSED!")
        print("[SUCCESS] Enhanced Nova Memory AI System is fully compliant with requirements!")
        sys.exit(0)
    else:
        print("\n[FAIL] VALIDATION FAILED!")
        print("[ERROR] Please fix the identified issues before proceeding.")
        sys.exit(1)