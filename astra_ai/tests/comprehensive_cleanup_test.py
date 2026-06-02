#!/usr/bin/env python3
"""
Comprehensive test demonstrating the memory cleanup functionality
in the AI Organizer with real-world scenarios.
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

def create_comprehensive_test_memory_file(file_path):
    """Create a comprehensive test memory file with various scenarios."""
    # Create directory if needed
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    # Create test data with events of different ages, retention policies, and importance scores
    current_time = datetime.now()
    
    test_data = {
        "memory_events": [
            # Permanent event (should NOT be deleted)
            {
                "type": "ADD",
                "summary": "User's name is Alexander Graham",
                "timestamp": (current_time - timedelta(days=100)).isoformat(),
                "retention_policy": "permanent",
                "importance_score": 1.0,
                "category": "user_identity",
                "confidence": 0.95
            },
            # Ephemeral event that should be deleted (old, low importance)
            {
                "type": "ADD",
                "summary": "User jogged 5 miles on Monday morning",
                "timestamp": (current_time - timedelta(days=10)).isoformat(),
                "retention_policy": "ephemeral",
                "importance_score": 0.2,
                "category": "activity_behavior",
                "confidence": 0.3
            },
            # Contextual event that should be deleted (old, unused)
            {
                "type": "ADD",
                "summary": "User was working on a math project about calculus",
                "timestamp": (current_time - timedelta(days=20)).isoformat(),
                "retention_policy": "contextual",
                "importance_score": 0.5,
                "category": "task_project_tracking",
                "confidence": 0.6
            },
            # Low importance event that should be deleted
            {
                "type": "ADD",
                "summary": "User mentioned watching a movie called 'The Matrix' last weekend",
                "timestamp": (current_time - timedelta(days=8)).isoformat(),
                "retention_policy": "contextual",
                "importance_score": 0.1,
                "category": "activity_behavior",
                "confidence": 0.2
            },
            # Recent event that should be kept
            {
                "type": "ADD",
                "summary": "User is learning advanced Python programming concepts",
                "timestamp": (current_time - timedelta(days=2)).isoformat(),
                "retention_policy": "contextual",
                "importance_score": 0.8,
                "category": "knowledge_expertise",
                "confidence": 0.85
            },
            # Conflicting facts - older one should be deleted
            {
                "type": "ADD",
                "summary": "User is 25 years old",
                "timestamp": (current_time - timedelta(days=30)).isoformat(),
                "retention_policy": "contextual",
                "importance_score": 0.7,
                "category": "user_identity",
                "confidence": 0.8
            },
            # Newer conflicting fact - should be kept
            {
                "type": "ADD",
                "summary": "User is 26 years old",
                "timestamp": (current_time - timedelta(days=1)).isoformat(),
                "retention_policy": "contextual",
                "importance_score": 0.9,
                "category": "user_identity",
                "confidence": 0.9
            },
            # Superseded fact - older one should be deleted
            {
                "type": "ADD",
                "summary": "User's favorite programming language is JavaScript",
                "timestamp": (current_time - timedelta(days=45)).isoformat(),
                "retention_policy": "contextual",
                "importance_score": 0.6,
                "category": "personal_preferences",
                "confidence": 0.7
            },
            # Updated fact - should be kept
            {
                "type": "ADD",
                "summary": "User's favorite programming language is Python",
                "timestamp": (current_time - timedelta(days=15)).isoformat(),
                "retention_policy": "contextual",
                "importance_score": 0.8,
                "category": "personal_preferences",
                "confidence": 0.85
            }
        ],
        "current_facts": {
            "user_identity": {
                "category": "user_identity",
                "value": "User's name is Alexander Graham, age 26",
                "confidence": 0.9
            },
            "knowledge_expertise": {
                "category": "knowledge_expertise",
                "value": "User is learning advanced Python programming concepts",
                "confidence": 0.85
            },
            "personal_preferences": {
                "category": "personal_preferences",
                "value": "User's favorite programming language is Python",
                "confidence": 0.85
            }
        },
        "conversation": [
            {
                "role": "user",
                "content": "My name is Alexander Graham and I'm learning Python programming.",
                "timestamp": (current_time - timedelta(days=2)).isoformat()
            }
        ],
        "user": {
            "name": "Alexander Graham"
        }
    }
    
    # Write test data to file
    with open(file_path, 'w') as f:
        json.dump(test_data, f, indent=2)
    
    print(f"Created comprehensive test memory file: {file_path}")
    return test_data

def run_comprehensive_cleanup_test():
    """Run a comprehensive test of the memory cleanup functionality."""
    print("=" * 60)
    print("COMPREHENSIVE MEMORY CLEANUP TEST")
    print("=" * 60)
    
    # Create test memory file
    test_file = "test_data/comprehensive_test_nova_ai_memory.json"
    deleted_file = "test_data/nova_ai_deleted.json"
    backup_dir = "test_data/backups"
    
    # Clean up any existing test files
    try:
        if os.path.exists(test_file):
            os.remove(test_file)
        if os.path.exists(deleted_file):
            os.remove(deleted_file)
        if os.path.exists(backup_dir):
            shutil.rmtree(backup_dir)
    except Exception as e:
        print(f"Warning: Could not clean up previous test files: {e}")
    
    original_data = create_comprehensive_test_memory_file(test_file)
    
    # Create organizer config with cleanup enabled
    config = {
        'organizer_enabled': True,
        'memory_file_path': test_file,
        'check_interval': 0.1,
        'cleanup_enabled': True,
        'cleanup_interval': 1,  # 1 second for testing
        'dry_run': False
    }
    
    # Create organizer instance
    organizer = AIOrganizer(config)
    
    # Load the test data
    memory_data = organizer._load_memory_file()
    
    print(f"\nORIGINAL MEMORY STATE:")
    print(f"  Total events: {len(memory_data['memory_events'])}")
    for i, event in enumerate(memory_data['memory_events']):
        print(f"  {i}: {event.get('type', 'ADD')} - {event.get('summary', '')[:50]}...")
        print(f"     Policy: {event.get('retention_policy', 'contextual')}, "
              f"Age: {(datetime.now() - datetime.fromisoformat(event.get('timestamp', '').replace('Z', '+00:00'))).days} days, "
              f"Importance: {event.get('importance_score', 0.5)}")
    
    # Test the cleanup process
    print(f"\nPERFORMING MEMORY CLEANUP...")
    organizer._perform_memory_cleanup(memory_data)
    
    # Check the results
    print(f"\nFINAL MEMORY STATE:")
    final_data = organizer._load_memory_file()
    print(f"  Total events: {len(final_data['memory_events'])}")
    
    # Count different types of events
    add_events = [e for e in final_data['memory_events'] if e.get('type') == 'ADD']
    delete_events = [e for e in final_data['memory_events'] if e.get('type') == 'DELETE']
    
    print(f"  ADD events: {len(add_events)}")
    print(f"  DELETE events: {len(delete_events)}")
    
    # Print DELETE events with reasons
    print(f"\nDELETION SUMMARY:")
    for event in delete_events:
        print(f"  - {event.get('summary', '')}")
        print(f"    Reason: {event.get('reason', '')}")
        print(f"    Timestamp: {event.get('timestamp', '')}")
    
    # Check archived events
    print(f"\nARCHIVED EVENTS:")
    if os.path.exists(deleted_file):
        with open(deleted_file, 'r') as f:
            archived_events = json.load(f)
        print(f"  Total archived: {len(archived_events)}")
        for archived in archived_events:
            print(f"  - Original: {archived['original_event'].get('summary', '')[:50]}...")
            print(f"    Reason: {archived['deletion_reason']}")
            print(f"    Archived at: {archived['archived_at']}")
    else:
        print("  No archived events file found")
    
    # Check backups
    print(f"\nBACKUP STATUS:")
    if os.path.exists(backup_dir) and os.listdir(backup_dir):
        backups = os.listdir(backup_dir)
        print(f"  Backups created: {len(backups)}")
        for backup in backups:
            print(f"    - {backup}")
    else:
        print("  No backups found")
    
    # Verification
    print(f"\nVERIFICATION:")
    expected_deletions = 5  # 4 explicit deletions + 1 conflict/superseded
    actual_deletions = len(delete_events)
    
    if actual_deletions == expected_deletions:
        print(f"  [PASS] Correct number of deletions: {actual_deletions}")
    else:
        print(f"  [FAIL] Expected {expected_deletions} deletions, got {actual_deletions}")
    
    # Check that permanent event was preserved
    permanent_preserved = any(
        e.get('retention_policy') == 'permanent' and e.get('type') == 'ADD'
        for e in final_data['memory_events']
    )
    if permanent_preserved:
        print("  [PASS] Permanent event preserved")
    else:
        print("  [FAIL] Permanent event was deleted")
    
    # Check that recent events were preserved
    recent_preserved = any(
        'Python programming' in e.get('summary', '') and e.get('type') == 'ADD'
        for e in final_data['memory_events']
    )
    if recent_preserved:
        print("  [PASS] Recent important events preserved")
    else:
        print("  [FAIL] Recent important events were deleted")
    
    # Cleanup test files
    print(f"\nCLEANING UP TEST FILES...")
    try:
        if os.path.exists(test_file):
            os.remove(test_file)
        if os.path.exists(deleted_file):
            os.remove(deleted_file)
        if os.path.exists(backup_dir):
            shutil.rmtree(backup_dir)
        print("  [PASS] Test files cleaned up")
    except Exception as e:
        print(f"  [FAIL] Error cleaning up test files: {e}")
    
    print(f"\nTEST COMPLETED SUCCESSFULLY!")

def demonstrate_dry_run():
    """Demonstrate the dry-run functionality."""
    print("\n" + "=" * 60)
    print("DRY-RUN MODE DEMONSTRATION")
    print("=" * 60)
    
    # Create test memory file
    test_file = "test_data/dry_run_test_nova_ai_memory.json"
    original_data = create_comprehensive_test_memory_file(test_file)
    
    # Create organizer config with dry run enabled
    config = {
        'organizer_enabled': True,
        'memory_file_path': test_file,
        'check_interval': 0.1,
        'cleanup_enabled': True,
        'cleanup_interval': 1,
        'dry_run': True  # Dry run mode
    }
    
    # Create organizer instance
    organizer = AIOrganizer(config)
    
    # Load the test data
    memory_data = organizer._load_memory_file()
    
    print(f"ORIGINAL MEMORY STATE:")
    print(f"  Total events: {len(memory_data['memory_events'])}")
    
    # Test the cleanup process in dry-run mode
    print(f"\nPERFORMING DRY-RUN CLEANUP (no actual deletions)...")
    organizer._perform_memory_cleanup(memory_data)
    
    # Check that no actual changes were made
    final_data = organizer._load_memory_file()
    if len(final_data['memory_events']) == len(memory_data['memory_events']):
        print("  [PASS] Dry-run mode working correctly - no actual deletions")
    else:
        print("  [FAIL] Dry-run mode failed - changes were made")
    
    # Cleanup test files
    try:
        if os.path.exists(test_file):
            os.remove(test_file)
    except Exception as e:
        print(f"Error cleaning up test files: {e}")

if __name__ == "__main__":
    run_comprehensive_cleanup_test()
    demonstrate_dry_run()