#!/usr/bin/env python3
"""
Real-world demonstration of the AI Organizer with memory cleanup functionality.
This script shows how the organizer would work in a continuous monitoring scenario.
"""

import os
import sys
import json
import time
import threading
from datetime import datetime, timedelta

# Add the project root to the path so we can import the modules
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from astra_ai.memory.Mem0_ai_organizer import AIOrganizer

def create_sample_memory_file(file_path):
    """Create a sample memory file for demonstration."""
    # Create directory if needed
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    # Create sample data
    current_time = datetime.now()
    
    sample_data = {
        "memory_events": [
            # This will be enhanced by the organizer
            {
                "type": "ADD",
                "summary": "user said they love py programming",
                "timestamp": (current_time - timedelta(minutes=5)).isoformat(),
                "confidence": 0.8
            },
            # This will be deleted by cleanup (low importance, old)
            {
                "type": "ADD",
                "summary": "user checked weather was sunny",
                "timestamp": (current_time - timedelta(days=10)).isoformat(),
                "retention_policy": "ephemeral",
                "importance_score": 0.1,
                "confidence": 0.3
            }
        ],
        "current_facts": {},
        "conversation": [
            {
                "role": "user",
                "content": "I really love Python programming! It's so elegant and powerful.",
                "timestamp": (current_time - timedelta(minutes=5)).isoformat()
            },
            {
                "role": "user",
                "content": "The weather is sunny today, perfect for coding outside.",
                "timestamp": (current_time - timedelta(days=10)).isoformat()
            }
        ],
        "user": {
            "name": "Developer"
        }
    }
    
    # Write sample data to file
    with open(file_path, 'w') as f:
        json.dump(sample_data, f, indent=2)
    
    print(f"Created sample memory file: {file_path}")
    return sample_data

def simulate_user_interaction(memory_file):
    """Simulate user interactions by adding new events to the memory file."""
    print("Starting user interaction simulation...")
    
    try:
        # Load existing data
        with open(memory_file, 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        data = {
            "memory_events": [],
            "current_facts": {},
            "conversation": [],
            "user": {"name": "Developer"}
        }
    
    # Add a new user interaction
    current_time = datetime.now()
    new_event = {
        "type": "ADD",
        "summary": "user mentioned working on a new project",
        "timestamp": current_time.isoformat(),
        "confidence": 0.7,
        "retention_policy": "contextual",
        "importance_score": 0.8
    }
    
    data["memory_events"].append(new_event)
    data["conversation"].append({
        "role": "user",
        "content": "I'm working on a new machine learning project using Python.",
        "timestamp": current_time.isoformat()
    })
    
    # Save updated data
    with open(memory_file, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"Added new user interaction at {current_time.strftime('%H:%M:%S')}")

def demonstrate_organizer_with_cleanup():
    """Demonstrate the AI Organizer with memory cleanup functionality."""
    print("=" * 70)
    print("AI ORGANIZER WITH MEMORY CLEANUP - REAL-WORLD DEMONSTRATION")
    print("=" * 70)
    
    # Clean up any existing test files
    test_file = "demo_data/nova_ai_memory.json"
    deleted_file = "demo_data/nova_ai_deleted.json"
    backup_dir = "demo_data/backups"
    
    try:
        if os.path.exists(test_file):
            os.remove(test_file)
        if os.path.exists(deleted_file):
            os.remove(deleted_file)
        if os.path.exists(backup_dir):
            import shutil
            shutil.rmtree(backup_dir)
    except Exception as e:
        print(f"Warning: Could not clean up previous demo files: {e}")
    
    # Create sample memory file
    original_data = create_sample_memory_file(test_file)
    
    # Show initial state
    print(f"\nINITIAL MEMORY STATE:")
    print(f"  Total events: {len(original_data['memory_events'])}")
    for i, event in enumerate(original_data['memory_events']):
        print(f"  {i+1}. {event.get('summary', '')}")
        if 'retention_policy' in event:
            print(f"     Policy: {event['retention_policy']}")
        if 'importance_score' in event:
            print(f"     Importance: {event['importance_score']}")
    
    # Create organizer config
    config = {
        'organizer_enabled': True,
        'memory_file_path': test_file,
        'check_interval': 2.0,  # Check every 2 seconds
        'cleanup_enabled': True,
        'cleanup_interval': 10,  # Cleanup every 10 seconds
        'dry_run': False
    }
    
    # Create organizer instance
    organizer = AIOrganizer(config)
    
    # Start organizer in a separate thread
    print(f"\nSTARTING AI ORGANIZER...")
    organizer_thread = threading.Thread(target=organizer.start_monitoring, daemon=True)
    organizer_thread.start()
    
    # Simulate user interactions
    print(f"\nSIMULATING USER INTERACTIONS...")
    time.sleep(3)  # Let organizer start
    
    # Add some user interactions
    for i in range(3):
        simulate_user_interaction(test_file)
        time.sleep(5)  # Wait between interactions
    
    # Let the organizer process and cleanup
    print(f"\nALLOWING ORGANIZER TO PROCESS AND CLEANUP...")
    time.sleep(15)
    
    # Show final state
    print(f"\nFINAL MEMORY STATE:")
    try:
        with open(test_file, 'r') as f:
            final_data = json.load(f)
        
        print(f"  Total events: {len(final_data['memory_events'])}")
        add_events = [e for e in final_data['memory_events'] if e.get('type') == 'ADD']
        delete_events = [e for e in final_data['memory_events'] if e.get('type') == 'DELETE']
        print(f"  ADD events: {len(add_events)}")
        print(f"  DELETE events: {len(delete_events)}")
        
        # Show enhanced events
        print(f"\nENHANCED EVENTS:")
        for event in add_events:
            if 'provenance' in event and event['provenance'].get('enhanced_in_place'):
                print(f"  - {event.get('summary', '')}")
                if 'original_summary' in event['provenance']:
                    print(f"    (Enhanced from: {event['provenance']['original_summary']})")
        
        # Show deleted events
        if delete_events:
            print(f"\nDELETED EVENTS:")
            for event in delete_events:
                print(f"  - {event.get('summary', '')}")
                print(f"    Reason: {event.get('reason', '')}")
        
        # Check archived events
        if os.path.exists(deleted_file):
            with open(deleted_file, 'r') as f:
                archived_events = json.load(f)
            print(f"\nARCHIVED EVENTS: {len(archived_events)} events preserved for recovery")
        
        # Check backups
        if os.path.exists(backup_dir):
            backups = os.listdir(backup_dir)
            print(f"BACKUPS CREATED: {len(backups)} snapshots for safety")
    
    except Exception as e:
        print(f"Error reading final state: {e}")
    
    # Clean up demo files
    print(f"\nCLEANING UP DEMO FILES...")
    try:
        if os.path.exists(test_file):
            os.remove(test_file)
        if os.path.exists(deleted_file):
            os.remove(deleted_file)
        if os.path.exists(backup_dir):
            import shutil
            shutil.rmtree(backup_dir)
        print("Demo files cleaned up successfully")
    except Exception as e:
        print(f"Error cleaning up demo files: {e}")
    
    print(f"\nDEMONSTRATION COMPLETED!")
    print("=" * 70)

if __name__ == "__main__":
    demonstrate_organizer_with_cleanup()