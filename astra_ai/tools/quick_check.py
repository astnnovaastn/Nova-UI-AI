#!/usr/bin/env python3
"""
Quick test to check current memory file structure
"""

import json

def check_current_structure():
    """Check the current structure of the memory file"""
    try:
        # Load the current memory JSON file
        memory_file = r"C:\Users\afian\OneDrive\Desktop\Astra_ai\astra_ai\Date\nova_ai_memory.json"
        
        with open(memory_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print("Checking current structure...")
        
        # Check memory_engine section
        if "memory_engine" in data:
            mem_eng = data["memory_engine"]
            print(f"- memory_engine.vector_index exists: {'vector_index' in mem_eng}")
            print(f"- memory_engine.clusters exists: {'clusters' in mem_eng}")
            
            if 'vector_index' in mem_eng:
                print(f"  - memory_engine.vector_index length: {len(mem_eng['vector_index'])}")
            if 'clusters' in mem_eng:
                print(f"  - memory_engine.clusters length: {len(mem_eng['clusters'])}")
        else:
            print("- memory_engine section: MISSING")
        
        # Check root level
        print(f"- Root vector_index exists: {'vector_index' in data}")
        print(f"- Root clusters exists: {'clusters' in data}")
        
        if 'vector_index' in data:
            print(f"  - Root vector_index length: {len(data['vector_index'])}")
        if 'clusters' in data:
            print(f"  - Root clusters length: {len(data['clusters'])}")
        
        print("\nStructure Check Complete!")
        if 'vector_index' in data or 'clusters' in data:
            print("❌ ISSUE STILL EXISTS: Found duplicate vector_index/clusters at root level")
            return False
        else:
            print("✅ SUCCESS: No duplicates at root level - matches New_memory_event.json format!")
            return True
            
    except Exception as e:
        print(f"Error checking structure: {e}")
        return False

if __name__ == "__main__":
    check_current_structure()