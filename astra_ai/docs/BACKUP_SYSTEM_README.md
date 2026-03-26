# Conversation Backup System

This improved backup system reduces the frequency of backups while maintaining data safety through configurable timing strategies.

## Features

### Backup Strategies

1. **Time-based**: Creates backups at specified time intervals
   - Default: Every 30 minutes
   - Configurable interval in minutes

2. **Count-based**: Creates backups after a certain number of messages
   - Default: Every 20 messages
   - Configurable message count threshold

3. **Session-based**: Creates backups only when conversation sessions end
   - Requires manual session tracking with `start_session()` and `end_session()`

4. **Hybrid** (default): Combines time and count thresholds
   - Creates backup when either time OR count threshold is reached
   - Default: Every 30 minutes OR every 20 messages

### Automatic Cleanup

- **Maximum backup files**: Keeps only the most recent N backup files (default: 10)
- **Age-based cleanup**: Removes backups older than specified days (default: 7 days)

## Usage

### Basic Usage

```python
from conversation_persistence import append_conversation_messages

# This now uses conditional backup logic instead of backing up every time
messages = [
    {"role": "user", "content": "Hello", "session_id": "session_123"},
    {"role": "assistant", "content": "Hi there!", "session_id": "session_123"}
]
append_conversation_messages(messages)
```

### Configuring Backup Strategy

```python
from conversation_persistence import configure_backup_strategy

# Time-based: backup every hour
configure_backup_strategy(
    strategy='time_based',
    time_interval_minutes=60,
    max_backup_files=5,
    cleanup_days=3
)

# Count-based: backup every 50 messages
configure_backup_strategy(
    strategy='count_based',
    message_count_threshold=50,
    max_backup_files=15,
    cleanup_days=14
)

# Hybrid: backup every 15 minutes OR every 10 messages
configure_backup_strategy(
    strategy='hybrid',
    time_interval_minutes=15,
    message_count_threshold=10
)
```

### Session-based Backup

```python
from conversation_persistence import start_session, end_session

# Start tracking a session
start_session()

# Add messages during the session
append_conversation_messages(messages)

# End session to trigger backup
end_session()
```

### Monitoring and Control

```python
from conversation_persistence import get_backup_status, force_backup

# Check current backup status
status = get_backup_status()
print(f"Strategy: {status['strategy']}")
print(f"Messages since last backup: {status['messages_since_backup']}")
print(f"Should backup now: {status['should_backup_now']}")

# Force an immediate backup
force_backup()
```

## Configuration File

Create a `backup_config.json` file in the memory directory:

```json
{
  "strategy": "hybrid",
  "time_interval_minutes": 30,
  "message_count_threshold": 20,
  "max_backup_files": 10,
  "cleanup_days": 7
}
```

## State Tracking

The system maintains backup state in `data/backup_state.json`:
- Last backup time
- Messages processed since last backup
- Current session activity status

## Migration from Old System

The new system is backward compatible. Existing code will work without changes, but will benefit from reduced backup frequency automatically.

## Performance Benefits

- **Reduced I/O**: Fewer backup file operations
- **Faster message processing**: No backup overhead on most message additions
- **Controlled disk usage**: Automatic cleanup of old backup files
- **Flexible timing**: Choose the backup strategy that fits your use case

## File Structure

```
data/
├── nova_ai_memory.json          # Main memory file
├── backup_state.json            # Backup tracking state
├── backup_config.json           # Optional configuration
└── backups/
    ├── nova_ai_memory.20240324T101500Z.json
    ├── nova_ai_memory.20240324T104500Z.json
    └── ... (automatically cleaned up)
```
