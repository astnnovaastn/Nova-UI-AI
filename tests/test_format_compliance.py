#!/usr/bin/env python3
"""
Test to verify that the memory system now follows the New_memory_event.json format
with only vector_index and clusters in memory_engine, not at root level.
"""

import json
import sys
import os

def test_json_format():
    """Test that the JSON output follows the reference format"""
    print("Testing JSON format compliance...")
    
    # Load the current memory JSON file
    memory_file = r"C:\Users\afian\OneDrive\Desktop\Astra_ai\astra_ai\Date\nova_ai_memory.json"
    
    try:
        with open(memory_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"ERROR: Cannot find {memory_file}")
        return False
    except json.JSONDecodeError:
        print(f"ERROR: Invalid JSON in {memory_file}")
        return False
    
    print("V JSON file loaded successfully")

    # Check if vector_index exists in memory_engine (should be present)
    if "memory_engine" not in data:
        print("ERROR: 'memory_engine' section missing from JSON")
        return False

    memory_engine = data["memory_engine"]
    if "vector_index" not in memory_engine:
        print("ERROR: 'vector_index' missing from memory_engine section")
        return False

    if "clusters" not in memory_engine:
        print("ERROR: 'clusters' missing from memory_engine section")
        return False

    print("V 'vector_index' and 'clusters' present in memory_engine section")

    # Key check: Verify they DON'T exist at the root level (this was the issue)
    if "vector_index" in data:
        print("ERROR: 'vector_index' should NOT be at root level of JSON (following New_memory_event.json reference)")
        print("     Found duplicate root-level 'vector_index'. This should not exist.")
        return False

    if "clusters" in data:
        print("ERROR: 'clusters' should NOT be at root level of JSON (following New_memory_event.json reference)")
        print("     Found duplicate root-level 'clusters'. This should not exist.")
        return False

    print("V NO duplicate 'vector_index' and 'clusters' at root level (Issue FIXED!)")

    # Additional verification - check that memory_engine vector_index and clusters have correct content
    vec_index = memory_engine["vector_index"]
    clusters = memory_engine["clusters"]

    print(f"V memory_engine.vector_index has {len(vec_index)} entries")
    print(f"V memory_engine.clusters has {len(clusters)} entries")

    # Sample validation - check that they contain expected content
    for event_id, vector in list(vec_index.items())[:1]:  # Check first entry
        if not isinstance(vector, list) or len(vector) != 8:
            print(f"ERROR: Vector for {event_id} has invalid format: {vector}")
            return False
        print(f"V Vector for {event_id} has correct format: {vector[:3]}... (length={len(vector)})")

    for cluster_id, cluster in list(clusters.items())[:1]:  # Check first cluster
        expected_fields = ["topic", "centroid_vector", "event_ids", "coherence_score", "metadata", "insights"]
        missing_fields = [field for field in expected_fields if field not in cluster]
        if missing_fields:
            print(f"ERROR: Cluster {cluster_id} missing fields: {missing_fields}")
            return False
        print(f"V Cluster {cluster_id} has all expected fields")
    
    print("\nSUCCESS: Memory system now follows the New_memory_event.json format!")
    print("  - vector_index and clusters are only in memory_engine section")  
    print("  - No duplicate sections at root level")
    print("  - Both structures contain valid data")
    return True


def main():
    """Run the format compliance test"""
    print("Testing memory system format compliance against New_memory_event.json reference...\n")
    
    try:
        success = test_json_format()
        
        if success:
            print("\n🎉 VERIFICATION PASSED!")
            print("The memory system now correctly follows the New_memory_event.json format:")
            print("- vector_index and clusters only exist in memory_engine section")
            print("- No duplicate structures at root level")
            print("- Data integrity maintained")
            return 0
        else:
            print("\n❌ VERIFICATION FAILED!")
            print("The memory system still has format issues.")
            return 1
            
    except Exception as e:
        print(f"ERROR during test: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    exit(main())