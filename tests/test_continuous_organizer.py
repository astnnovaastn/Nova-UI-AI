"""
Test script for Continuous Memory Organizer
"""

import json
import time
import os
from datetime import datetime

def create_test_memory_file():
    """Create a test memory file with some initial data"""
    test_data = {
        "memory_events": [
            {
                "type": "ADD",
                "summary": "Hi i m john and i work as a python developer",
                "timestamp": datetime.now().isoformat()
            }
        ],
        "current_facts": {
            "name": "john",
            "occupation": "python developer"
        },
        "organized_facts": {}
    }
    
    # Create data directory if it doesn't exist
    os.makedirs("data", exist_ok=True)
    
    # Write test data
    with open("data/nova_ai_memory.json", "w", encoding="utf-8") as f:
        json.dump(test_data, f, indent=2, ensure_ascii=False)
        
    print("Created test memory file with initial data")

def add_test_event():
    """Add a new test event to the memory file"""
    try:
        # Read existing data
        with open("data/nova_ai_memory.json", "r", encoding="utf-8") as f:
            data = json.load(f)
            
        # Add new event
        new_event = {
            "type": "UPDATE",
            "summary": "Actually i changed my job i m now working at microsoft as a senior developer",
            "timestamp": datetime.now().isoformat()
        }
        
        data["memory_events"].append(new_event)
        
        # Write back
        with open("data/nova_ai_memory.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            
        print(f"Added new event: {new_event['summary']}")
        
    except Exception as e:
        print(f"Error adding test event: {e}")

def check_organized_facts():
    """Check if the organizer has created organized facts"""
    try:
        with open("data/nova_ai_memory.json", "r", encoding="utf-8") as f:
            data = json.load(f)
            
        organized_facts = data.get("organized_facts", {})
        print(f"Organized facts count: {len(organized_facts)}")
        
        for key, fact in organized_facts.items():
            print(f"  {key}: {fact.get('category', 'unknown')} - {fact.get('improved_summary', 'no summary')}")
            
    except Exception as e:
        print(f"Error checking organized facts: {e}")

def main():
    """Main test function"""
    print("Testing Continuous Memory Organizer")
    print("=" * 40)
    
    # Create test file
    create_test_memory_file()
    
    # Wait a moment
    time.sleep(2)
    
    # Add a test event
    add_test_event()
    
    # Wait for organizer to process
    print("Waiting 3 seconds for organizer to process...")
    time.sleep(3)
    
    # Check results
    check_organized_facts()
    
    print("\nTest completed!")

if __name__ == "__main__":
    main()