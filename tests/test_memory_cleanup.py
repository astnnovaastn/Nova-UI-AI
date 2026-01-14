#!/usr/bin/env python3
"""
Test script for memory cleanup functionality in the AI Organizer.
"""

import os
import sys
import json
import shutil
from datetime import datetime, timedelta

# Add the project root to the path so we can import the modules
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from astra_ai.memory.Mem0_ai_organizer import AIOrganizer

def create_test_memory_file(file_path):
    """Create a test memory file with various types of events."""
    # Create directory if needed
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    # Create test data with events of different ages and retention policies
    current_time = datetime.now()
    
    test_data = {
        "memory_events": [
            # Permanent event (should not be deleted)
            {
                "type": "ADD",
                "summary": "User's name is Alex",
                "timestamp": (current_time - timedelta(days=30)).isoformat(),
                "retention_policy": "permanent",
                "importance_score": 1.0,
                "category": "user_identity"
            },
            # Ephemeral event that should be deleted (old, low importance)
            {
                "type": "ADD",
                "summary": "User jogged on Monday",
                "timestamp": (current_time - timedelta(days=10)).isoformat(),
                "retention_policy": "ephemeral",
                "importance_score": 0.2,
                "category": "activity_behavior"
            },
            # Contextual event that should be deleted (old, unused)
            {
                "type": "ADD",
                "summary": "User was working on a math project",
                "timestamp": (current_time - timedelta(days=20)).isoformat(),
                "retention_policy": "contextual",
                "importance_score": 0.5,
                "category": "task_project_tracking"
            },
            # Low importance event that should be deleted
            {
                "type": "ADD",
                "summary": "User mentioned watching a movie",
                "timestamp": (current_time - timedelta(days=8)).isoformat(),
                "retention_policy": "contextual",
                "importance_score": 0.1,
                "category": "activity_behavior"
            },
            # Recent event that should be kept
            {
                "type": "ADD",
                "summary": "User is learning Python",
                "timestamp": (current_time - timedelta(days=2)).isoformat(),
                "retention_policy": "contextual",
                "importance_score": 0.8,
                "category": "knowledge_expertise"
            }
        ],
        "current_facts": {
            "user_identity": {
                "category": "user_identity",
                "value": "User's name is Alex",
                "confidence": 0.9
            },
            "knowledge_expertise": {
                "category": "knowledge_expertise",
                "value": "User is learning Python",
                "confidence": 0.8
            }
        },
        "conversation": [],
        "user": {
            "name": "Alex"
        }
    }
    
    # Write test data to file
    with open(file_path, 'w') as f:
        json.dump(test_data, f, indent=2)
    
    print(f"Created test memory file: {file_path}")
    return test_data

def test_memory_cleanup():
    """Test the memory cleanup functionality."""
    print("Testing memory cleanup functionality...")
    
    # Create test memory file
    test_file = "test_data/test_nova_ai_memory.json"
    original_data = create_test_memory_file(test_file)
    
    # Create organizer config with cleanup enabled and dry run for testing
    config = {
        'organizer_enabled': True,
        'memory_file_path': test_file,
        'check_interval': 0.1,
        'cleanup_enabled': True,
        'cleanup_interval': 1,  # 1 second for testing
        'dry_run': True  # Use dry run to see what would be deleted without actually deleting
    }
    
    # Create organizer instance
    organizer = AIOrganizer(config)
    
    # Load the test data
    memory_data = organizer._load_memory_file()
    
    # Test the cleanup process
    print("\n--- DRY RUN TEST ---")
    organizer._perform_memory_cleanup(memory_data)
    
    # Now test with actual deletion
    print("\n--- ACTUAL DELETION TEST ---")
    config['dry_run'] = False
    organizer_dry = AIOrganizer(config)
    organizer_dry._perform_memory_cleanup(memory_data)
    
    # Check the results
    print("\n--- RESULTS ---")
    final_data = organizer_dry._load_memory_file()
    print(f"Original events: {len(original_data['memory_events'])}")
    print(f"Final events: {len(final_data['memory_events'])}")
    
    # Count DELETE events
    delete_events = [e for e in final_data['memory_events'] if e.get('type') == 'DELETE']
    print(f"DELETE events created: {len(delete_events)}")
    
    # Print DELETE events
    for event in delete_events:
        print(f"  - {event.get('summary', '')} (Reason: {event.get('reason', '')})")
    
    # Check archived events
    deleted_file = "test_data/nova_ai_deleted.json"
    if os.path.exists(deleted_file):
        with open(deleted_file, 'r') as f:
            archived_events = json.load(f)
        print(f"Events archived: {len(archived_events)}")
    else:
        print("No archived events file found")
    
    # Cleanup test files
    try:
        os.remove(test_file)
        if os.path.exists(deleted_file):
            os.remove(deleted_file)
        print("\nCleaned up test files")
    except Exception as e:
        print(f"Error cleaning up test files: {e}")

if __name__ == "__main__":
    test_memory_cleanup()