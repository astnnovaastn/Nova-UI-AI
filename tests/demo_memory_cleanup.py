#!/usr/bin/env python3
"""
Example script demonstrating how to use the memory cleanup functionality
in the AI Organizer.
"""

import os
import sys
import json
from datetime import datetime, timedelta

# Add the project root to the path so we can import the modules
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from astra_ai.memory.Mem0_ai_organizer import AIOrganizer, ORGANIZER_CONFIG

def main():
    """Demonstrate the memory cleanup functionality."""
    print("AI Memory Organizer - Memory Cleanup Demo")
    print("=" * 40)
    
    # Example configuration with cleanup enabled
    config = ORGANIZER_CONFIG.copy()
    config.update({
        'cleanup_enabled': True,
        'cleanup_interval': 3600,  # 1 hour
        'dry_run': False  # Set to True for testing without actual deletion
    })
    
    print("Configuration:")
    print(f"  Memory file path: {config['memory_file_path']}")
    print(f"  Cleanup enabled: {config['cleanup_enabled']}")
    print(f"  Cleanup interval: {config['cleanup_interval']} seconds")
    print(f"  Dry run mode: {config['dry_run']}")
    
    # Create organizer instance
    organizer = AIOrganizer(config)
    
    # Show where the deleted events will be archived
    memory_dir = os.path.dirname(config['memory_file_path'])
    deleted_file_path = os.path.join(memory_dir, 'nova_ai_deleted.json')
    print(f"  Deleted events will be archived to: {deleted_file_path}")
    
    # Show backup location
    backup_dir = os.path.join(memory_dir, 'backups')
    print(f"  Backups will be stored in: {backup_dir}")
    
    print("\nTo run the organizer with cleanup functionality:")
    print("  organizer.start_monitoring()")
    
    # Example of manually triggering cleanup
    print("\nTo manually trigger cleanup:")
    print("  memory_data = organizer._load_memory_file()")
    print("  organizer._perform_memory_cleanup(memory_data)")
    
    # Example of what the DELETE events look like
    print("\nDELETE Event Schema:")
    delete_event_example = {
        "type": "DELETE",
        "summary": "Removed old ephemeral memory: User jogged on Monday.",
        "timestamp": datetime.now().isoformat(),
        "reason": "ephemeral_expired",
        "referenced_event_index": 123,
        "archived": True
    }
    print(json.dumps(delete_event_example, indent=2))
    
    # Example of what the archive entries look like
    print("\nArchive Entry Schema:")
    archive_entry_example = {
        "archived_at": datetime.now().isoformat(),
        "deletion_reason": "ephemeral_expired",
        "original_index": 123,
        "original_event": {
            "type": "ADD",
            "summary": "User jogged on Monday.",
            "timestamp": "2025-09-01T10:00:00Z",
            "retention_policy": "ephemeral",
            "importance_score": 0.2
        },
        "organizer_version": "1.0",
        "archived_by": "mem0_organizer"
    }
    print(json.dumps(archive_entry_example, indent=2))

if __name__ == "__main__":
    main()