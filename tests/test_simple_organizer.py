"""
Simple test for continuous organizer without Unicode issues
"""

import json
import os
from datetime import datetime

def test_simple_organizer():
    """Test the continuous organizer functionality"""
    print("Testing Continuous Organizer")
    print("=" * 30)
    
    # Create test data
    test_data = {
        "memory_events": [
            {
                "type": "ADD",
                "summary": "Hi i m alice and i work as a javascript developer",
                "timestamp": datetime.now().isoformat()
            }
        ],
        "current_facts": {},
        "organized_facts": {}
    }
    
    # Create data directory
    os.makedirs("data", exist_ok=True)
    
    # Write test file
    with open("data/nova_ai_memory.json", "w", encoding="utf-8") as f:
        json.dump(test_data, f, indent=2, ensure_ascii=False)
    
    print("Created test file")
    
    # Try to organize the event manually
    from continuous_organizer import ContinuousMemoryOrganizer
    
    organizer = ContinuousMemoryOrganizer("data/nova_ai_memory.json")
    
    # Test single event organization
    event = test_data["memory_events"][0]
    organized = organizer._organize_single_event(event)
    
    if organized:
        print("Organized event successfully:")
        print(f"  Type: {organized['type']}")
        print(f"  Category: {organized['category']}")
        print(f"  Improved: {organized['improved_summary']}")
    else:
        print("Failed to organize event")
    
    print("\nTest completed!")

if __name__ == "__main__":
    test_simple_organizer()