#!/usr/bin/env python3
"""
Simple demonstration of the AI Organizer memory cleanup functionality.
"""

import os
import sys
import json
from datetime import datetime, timedelta

# Add the project root to the path so we can import the modules
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from astra_ai.memory.Mem0_ai_organizer import AIOrganizer

def demonstrate_cleanup_process():
    """Demonstrate the memory cleanup process step by step."""
    print("=" * 60)
    print("AI ORGANIZER MEMORY CLEANUP DEMONSTRATION")
    print("=" * 60)
    
    # Clean up any existing test files
    test_file = "demo_data/simple_demo_memory.json"
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
    
    # Create directory if needed
    os.makedirs(os.path.dirname(test_file), exist_ok=True)
    
    # Create sample memory data with various types of events
    current_time = datetime.now()
    
    sample_data = {
        "memory_events": [
            # Permanent event - should NEVER be deleted
            {
                "type": "ADD",
                "summary": "User's email is user@example.com",
                "timestamp": (current_time - timedelta(days=50)).isoformat(),
                "retention_policy": "permanent",
                "importance_score": 0.95,
                "category": "user_identity"
            },
            # Ephemeral event - should be deleted (old and low importance)
            {
                "type": "ADD",
                "summary": "User had cereal for breakfast",
                "timestamp": (current_time - timedelta(days=8)).isoformat(),
                "retention_policy": "ephemeral",
                "importance_score": 0.1,
                "category": "activity_behavior"
            },
            # Contextual event - should be deleted (old and unused)
            {
                "type": "ADD",
                "summary": "User was reading about quantum physics",
                "timestamp": (current_time - timedelta(days=15)).isoformat(),
                "retention_policy": "contextual",
                "importance_score": 0.4,
                "category": "knowledge_expertise"
            },
            # Recent important event - should be kept
            {
                "type": "ADD",
                "summary": "User is working on a machine learning project",
                "timestamp": (current_time - timedelta(days=1)).isoformat(),
                "retention_policy": "contextual",
                "importance_score": 0.85,
                "category": "task_project_tracking"
            },
            # Low importance event - should be deleted
            {
                "type": "ADD",
                "summary": "User checked weather was sunny",
                "timestamp": (current_time - timedelta(days=9)).isoformat(),
                "retention_policy": "contextual",
                "importance_score": 0.2,
                "category": "activity_behavior"
            }
        ],
        "current_facts": {
            "user_identity": {
                "category": "user_identity",
                "value": "User's email is user@example.com",
                "confidence": 0.95
            },
            "current_project": {
                "category": "task_project_tracking",
                "value": "User is working on a machine learning project",
                "confidence": 0.85
            }
        },
        "conversation": [],
        "user": {
            "name": "Demo User"
        }
    }
    
    # Write sample data to file
    with open(test_file, 'w') as f:
        json.dump(sample_data, f, indent=2)
    
    print(f"Created sample memory file with {len(sample_data['memory_events'])} events")
    
    # Show initial state
    print(f"\nINITIAL MEMORY EVENTS:")
    for i, event in enumerate(sample_data['memory_events']):
        print(f"  {i+1}. [{event.get('type', 'ADD')}] {event.get('summary', '')}")
        print(f"     Policy: {event.get('retention_policy', 'contextual')}, "
              f"Importance: {event.get('importance_score', 0.5)}, "
              f"Age: {(datetime.now() - datetime.fromisoformat(event.get('timestamp', '').replace('Z', '+00:00'))).days} days")
    
    # Create organizer config
    config = {
        'organizer_enabled': True,
        'memory_file_path': test_file,
        'check_interval': 1.0,
        'cleanup_enabled': True,
        'cleanup_interval': 5,
        'dry_run': False
    }
    
    # Create organizer instance
    organizer = AIOrganizer(config)
    
    # Load the memory data
    memory_data = organizer._load_memory_file()
    
    print(f"\nPERFORMING MEMORY CLEANUP...")
    print("=" * 40)
    
    # Perform cleanup
    organizer._perform_memory_cleanup(memory_data)
    
    # Show results
    print(f"\nFINAL STATE AFTER CLEANUP:")
    final_data = organizer._load_memory_file()
    
    add_events = [e for e in final_data['memory_events'] if e.get('type') == 'ADD']
    delete_events = [e for e in final_data['memory_events'] if e.get('type') == 'DELETE']
    
    print(f"  ADD events (kept): {len(add_events)}")
    print(f"  DELETE events (removed): {len(delete_events)}")
    
    # Show kept events
    print(f"\nEVENTS KEPT:")
    for event in add_events:
        print(f"  - {event.get('summary', '')}")
        print(f"    Policy: {event.get('retention_policy', 'contextual')}, "
              f"Importance: {event.get('importance_score', 0.5)}")
    
    # Show deleted events
    print(f"\nEVENTS DELETED:")
    for event in delete_events:
        print(f"  - {event.get('summary', '')}")
        print(f"    Reason: {event.get('reason', '')}")
    
    # Check archived events
    print(f"\nARCHIVAL SYSTEM:")
    if os.path.exists(deleted_file):
        with open(deleted_file, 'r') as f:
            archived_events = json.load(f)
        print(f"  Archived events: {len(archived_events)}")
        print(f"  Archive file: {deleted_file}")
    else:
        print("  No archived events found")
    
    # Check backups
    print(f"\nBACKUP SYSTEM:")
    if os.path.exists(backup_dir) and os.listdir(backup_dir):
        backups = os.listdir(backup_dir)
        print(f"  Backups created: {len(backups)}")
        for backup in backups:
            print(f"    - {backup}")
    else:
        print("  No backups found")
    
    # Verification
    print(f"\nVERIFICATION RESULTS:")
    
    # Check that permanent event was preserved
    permanent_preserved = any(
        'email' in e.get('summary', '') and e.get('type') == 'ADD'
        for e in final_data['memory_events']
    )
    print(f"  Permanent events preserved: {'YES' if permanent_preserved else 'NO'}")
    
    # Check that recent important events were preserved
    recent_preserved = any(
        'machine learning' in e.get('summary', '') and e.get('type') == 'ADD'
        for e in final_data['memory_events']
    )
    print(f"  Recent important events preserved: {'YES' if recent_preserved else 'NO'}")
    
    # Check that old low-importance events were deleted
    low_importance_deleted = len(delete_events) >= 3  # Should delete at least 3 events
    print(f"  Low-importance/old events deleted: {'YES' if low_importance_deleted else 'NO'}")
    
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
    
    print(f"\nDEMONSTRATION COMPLETED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    demonstrate_cleanup_process()