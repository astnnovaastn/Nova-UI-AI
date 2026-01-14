# Memory Cleanup Functionality - How It Works

## Overview
The AI Organizer now includes automatic memory cleanup functionality that removes old, unused, or irrelevant memories while preserving important information. This helps maintain memory efficiency and prevents overload.

## Key Features

### 1. Retention Policies
- **Permanent**: Never auto-delete unless directly contradicted by authoritative evidence
- **Contextual**: Delete when age >= 10-15 days and unused
- **Ephemeral**: Delete when age >= 7-8 days

### 2. Deletion Criteria
- **Age-based**: Removes memories based on their age and retention policy
- **Importance-based**: Deletes low-importance memories (importance_score < 0.3)
- **Conflict resolution**: Handles contradictory facts by keeping the most recent or highest confidence
- **Superseded facts**: Removes outdated information when updated facts are available

### 3. Safety Mechanisms
- **Archival system**: Preserves deleted memories in `nova_ai_deleted.json`
- **Audit trail**: Creates DELETE events for traceability
- **Backup protection**: Creates timestamped backups before modifications
- **Dry-run mode**: Test cleanup without actually deleting memories

## How It Works

### Step 1: Identification
The system evaluates each memory event and flags it for deletion when:
1. It has a permanent retention policy but is contradicted by newer evidence
2. It has low importance (score < 0.3) and is at least 7-9 days old
3. It's ephemeral and at least 7-9 days old
4. It's contextual and at least 10-15 days old with no recent references
5. It conflicts with a newer, more confident memory

### Step 2: Processing
For each flagged event:
1. Creates a backup of the current memory file
2. Archives the original event to `nova_ai_deleted.json`
3. Replaces the original event with a DELETE event in the main memory file
4. Appends deletion metadata for traceability

### Step 3: Verification
The system ensures:
- Permanent memories are preserved unless directly contradicted
- Recent important memories are kept
- Only eligible memories are deleted
- All deletions are logged and traceable

## Configuration Options

```python
config = {
    'cleanup_enabled': True,      # Enable/disable cleanup
    'cleanup_interval': 86400,    # Cleanup interval in seconds (24 hours)
    'dry_run': False             # Test mode without actual deletion
}
```

## Integration Example

```python
from astra_ai.memory.Mem0_ai_organizer import AIOrganizer

# Configure organizer with cleanup
config = {
    'organizer_enabled': True,
    'memory_file_path': 'data/nova_ai_memory.json',
    'cleanup_enabled': True,
    'cleanup_interval': 3600,  # 1 hour
    'dry_run': False
}

# Create and start organizer
organizer = AIOrganizer(config)
organizer.start_monitoring()  # Cleanup runs automatically

# Or manually trigger cleanup
memory_data = organizer._load_memory_file()
organizer._perform_memory_cleanup(memory_data)
```

## Benefits

1. **Automatic maintenance**: No manual intervention required
2. **Memory efficiency**: Prevents memory bloat over time
3. **Data safety**: All deletions are traceable and recoverable
4. **Flexible configuration**: Adjustable policies and intervals
5. **Conservative approach**: Preserves important information by default