# Memory Cleanup in AI Organizer

The AI Organizer now includes automatic memory cleanup functionality that removes old, unused, or irrelevant memories to maintain memory efficiency and prevent overload.

## Features

- **Age-based cleanup**: Automatically removes memories based on their age and retention policy
- **Importance-based cleanup**: Removes low-importance memories first
- **Conflict resolution**: Handles conflicting facts by keeping the most recent or highest confidence
- **Archival system**: Preserves deleted memories in a separate archive file
- **Audit trail**: Creates DELETE events for traceability
- **Dry-run mode**: Test cleanup without actually deleting memories
- **Backup protection**: Creates backups before modifications

## Retention Policies

The organizer supports three retention policies:

1. **permanent**: Never auto-delete unless directly contradicted
2. **contextual**: Delete when age >= 10-15 days and unused
3. **ephemeral**: Delete when age >= 7-8 days

## Configuration

To enable memory cleanup, add these parameters to your organizer configuration:

```python
config = {
    'organizer_enabled': True,
    'memory_file_path': 'data/nova_ai_memory.json',
    'check_interval': 1.0,
    'cleanup_enabled': True,
    'cleanup_interval': 24 * 60 * 60,  # 24 hours
    'dry_run': False  # Set to True for testing
}
```

## How It Works

1. The organizer periodically checks for memories that should be deleted based on:
   - Age and retention policy
   - Importance score (< 0.3)
   - Conflicts with newer memories
   - Superseded facts

2. Before deletion, the organizer:
   - Creates a backup of the memory file
   - Archives the original event to `nova_ai_deleted.json`
   - Creates a DELETE event in the memory file

3. The DELETE event contains:
   - Reason for deletion
   - Reference to the original event
   - Timestamp of deletion

## Testing

To test the cleanup functionality without actually deleting memories, set `dry_run` to `True` in the configuration.

You can also manually trigger cleanup:

```python
organizer = AIOrganizer(config)
memory_data = organizer._load_memory_file()
organizer._perform_memory_cleanup(memory_data)
```

## Safety Features

- All deletions are traceable through archive records
- Backups are created before any modifications
- Dry-run mode for safe testing
- Conservative deletion rules by default
- Permanent memories are preserved unless directly contradicted