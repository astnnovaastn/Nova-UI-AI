"""Conversation persistence helpers

Provides functions to append conversation messages to the project's
memory JSON (`astra_ai/Date/nova_ai_memory.json`) with configurable backups and provenance.
"""
from __future__ import annotations
import logging
import os
import json
import shutil
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum

# Default memory file path - using absolute path resolution
# Get the absolute path to the project root based on this script's location
_script_dir = os.path.dirname(os.path.abspath(__file__))
_project_root = os.path.dirname(_script_dir)  # Go up one level from memory/ to reach astra_ai/
DEFAULT_MEMORY_PATH = os.path.normpath(os.path.join(_project_root, 'Date', 'nova_ai_memory.json'))
BACKUP_DIR = os.path.join(_project_root, 'Date', 'backups')
BACKUP_STATE_FILE = os.path.join(_project_root, 'Date', 'backup_state.json')


class BackupStrategy(Enum):
    TIME_BASED = "time_based"
    COUNT_BASED = "count_based"
    SESSION_BASED = "session_based"
    HYBRID = "hybrid"


class BackupConfig:
    def __init__(self,
                 strategy: BackupStrategy = BackupStrategy.HYBRID,
                 time_interval_minutes: int = 30,
                 message_count_threshold: int = 20,
                 max_backup_files: int = 10,
                 cleanup_days: int = 7):
        self.strategy = strategy
        self.time_interval = timedelta(minutes=time_interval_minutes)
        self.message_count_threshold = message_count_threshold
        self.max_backup_files = max_backup_files
        self.cleanup_days = cleanup_days


class BackupState:
    def __init__(self):
        self.last_backup_time: Optional[datetime] = None
        self.messages_since_backup: int = 0
        self.current_session_active: bool = False
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'last_backup_time': self.last_backup_time.isoformat() if self.last_backup_time else None,
            'messages_since_backup': self.messages_since_backup,
            'current_session_active': self.current_session_active
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'BackupState':
        state = cls()
        if data.get('last_backup_time'):
            state.last_backup_time = datetime.fromisoformat(data['last_backup_time'])
        state.messages_since_backup = data.get('messages_since_backup', 0)
        state.current_session_active = data.get('current_session_active', False)
        return state


# Global configuration and state
_backup_config = BackupConfig()
_backup_state = BackupState()


def load_backup_config(config_path: Optional[str] = None) -> None:
    """Load backup configuration from JSON file or use defaults."""
    global _backup_config
    if config_path and os.path.exists(config_path):
        try:
            with open(config_path, 'r') as f:
                config_data = json.load(f)
                _backup_config = BackupConfig(
                    strategy=BackupStrategy(config_data.get('strategy', 'hybrid')),
                    time_interval_minutes=config_data.get('time_interval_minutes', 30),
                    message_count_threshold=config_data.get('message_count_threshold', 20),
                    max_backup_files=config_data.get('max_backup_files', 10),
                    cleanup_days=config_data.get('cleanup_days', 7)
                )
        except Exception:
            pass  # Use defaults if config is invalid


def load_backup_state() -> None:
    """Load backup state from file."""
    global _backup_state
    if os.path.exists(BACKUP_STATE_FILE):
        try:
            with open(BACKUP_STATE_FILE, 'r') as f:
                state_data = json.load(f)
                _backup_state = BackupState.from_dict(state_data)
        except Exception:
            _backup_state = BackupState()


def save_backup_state() -> None:
    """Save backup state to file."""
    try:
        os.makedirs(os.path.dirname(BACKUP_STATE_FILE), exist_ok=True)
        with open(BACKUP_STATE_FILE, 'w') as f:
            json.dump(_backup_state.to_dict(), f, indent=2)
    except Exception:
        pass  # Don't fail if we can't save state


def should_backup() -> bool:
    """Determine if a backup should be created based on current strategy and state."""
    now = datetime.now(timezone.utc)
    
    if _backup_config.strategy == BackupStrategy.TIME_BASED:
        if not _backup_state.last_backup_time:
            return True
        return now - _backup_state.last_backup_time >= _backup_config.time_interval
    
    elif _backup_config.strategy == BackupStrategy.COUNT_BASED:
        return _backup_state.messages_since_backup >= _backup_config.message_count_threshold
    
    elif _backup_config.strategy == BackupStrategy.SESSION_BASED:
        return not _backup_state.current_session_active
    
    elif _backup_config.strategy == BackupStrategy.HYBRID:
        # Backup if either time or count threshold is reached
        time_condition = not _backup_state.last_backup_time or \
                        now - _backup_state.last_backup_time >= _backup_config.time_interval
        count_condition = _backup_state.messages_since_backup >= _backup_config.message_count_threshold
        return time_condition or count_condition
    
    return False


def cleanup_old_backups() -> None:
    """Clean up old backup files based on configuration."""
    try:
        if not os.path.exists(BACKUP_DIR):
            return
        
        backup_files = []
        for filename in os.listdir(BACKUP_DIR):
            if filename.startswith('nova_ai_memory.') and filename.endswith('.json'):
                filepath = os.path.join(BACKUP_DIR, filename)
                backup_files.append((filepath, os.path.getmtime(filepath)))
        
        # Sort by modification time (oldest first)
        backup_files.sort(key=lambda x: x[1])
        
        # Remove excess files
        if len(backup_files) > _backup_config.max_backup_files:
            for filepath, _ in backup_files[:-_backup_config.max_backup_files]:
                os.remove(filepath)
        
        # Remove files older than cleanup_days
        cutoff_time = datetime.now().timestamp() - (_backup_config.cleanup_days * 24 * 3600)
        for filepath, mtime in backup_files:
            if mtime < cutoff_time:
                os.remove(filepath)
                
    except Exception:
        pass  # Don't fail if cleanup fails


def initialize_persistence(memory_file_path: str = None) -> None:
    """
    Initialize the persistence layer with optional custom memory file path.
    
    Args:
        memory_file_path: Optional path to the memory file. 
                         If not provided, uses DEFAULT_MEMORY_PATH.
    """
    global DEFAULT_MEMORY_PATH, BACKUP_DIR, BACKUP_STATE_FILE
    
    if memory_file_path:
        # Update the global paths to match the provided memory file path
        DEFAULT_MEMORY_PATH = memory_file_path
        backup_dir_base = os.path.dirname(memory_file_path)
        BACKUP_DIR = os.path.join(backup_dir_base, 'backups')
        BACKUP_STATE_FILE = os.path.join(backup_dir_base, 'backup_state.json')
    
    # Ensure backup directories exist
    try:
        os.makedirs(BACKUP_DIR, exist_ok=True)
        backup_state_dir = os.path.dirname(BACKUP_STATE_FILE)
        if backup_state_dir:
            os.makedirs(backup_state_dir, exist_ok=True)
    except Exception:
        pass  # Don't fail if directory creation fails
    
    # Load configuration and state
    load_backup_config()
    load_backup_state()
    
    # Set up logger for persistence
    persistence_logger = logging.getLogger("NovaAI.Persistence")
    persistence_logger.info(f"[PERSISTENCE] Initialized with memory file: {DEFAULT_MEMORY_PATH}")
    persistence_logger.info(f"[PERSISTENCE] Backup directory: {BACKUP_DIR}")
    persistence_logger.info(f"[PERSISTENCE] Backup strategy: {_backup_config.strategy.value}")


def start_session() -> None:
    """Mark the start of a conversation session."""
    _backup_state.current_session_active = True
    save_backup_state()


def end_session() -> None:
    """Mark the end of a conversation session and trigger backup if needed."""
    _backup_state.current_session_active = False
    if _backup_config.strategy == BackupStrategy.SESSION_BASED:
        _make_backup()
    save_backup_state()


# Initialize backup system
load_backup_config()
load_backup_state()


def _load_memory(path: str = DEFAULT_MEMORY_PATH) -> Dict[str, Any]:
    if not os.path.exists(path):
        # create minimal structure if missing
        base = {
            'memory_events': [],
            'conversation': [],
            'fact_history': {},
        }
        return base
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def _make_backup(path: str = DEFAULT_MEMORY_PATH) -> None:
    try:
        os.makedirs(BACKUP_DIR, exist_ok=True)
        if os.path.exists(path):
            ts = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
            dst = os.path.join(BACKUP_DIR, f'nova_ai_memory.{ts}.json')
            shutil.copy2(path, dst)
            
            # Update backup state
            _backup_state.last_backup_time = datetime.now(timezone.utc)
            _backup_state.messages_since_backup = 0
            save_backup_state()
            
            # Clean up old backups
            cleanup_old_backups()
    except Exception:
        # never raise from backup failure; best-effort
        pass


def append_conversation_messages(messages: List[Dict[str, Any]], memory_path: str = DEFAULT_MEMORY_PATH) -> None:
    """Append conversation messages to the memory file.

    Each message should be a dict like: {"role": "user"|"assistant", "content": str, "timestamp": ISO8601, "session_id": str}
    The function will conditionally create a backup based on configured strategy, load the JSON, append messages to `conversation`, and write the file.
    It will also update `memory_events` with lightweight ADD events for traceability.
    """
    if not messages:
        return

    # Check if backup should be created based on strategy
    backup_created = False
    if should_backup():
        _make_backup(memory_path)
        backup_created = True

    data = _load_memory(memory_path)

    if 'conversation' not in data:
        data['conversation'] = []
    if 'memory_events' not in data:
        data['memory_events'] = []

    for msg in messages:
        # normalize message
        role = msg.get('role', 'user')
        content = msg.get('content', '')
        ts = msg.get('timestamp') or datetime.now(timezone.utc).isoformat()
        session_id = msg.get('session_id')

        conv_item = {
            'role': role,
            'content': content,
            'timestamp': ts,
        }
        if session_id:
            conv_item['session_id'] = session_id

        data['conversation'].append(conv_item)

        # Add a lightweight memory event to keep traceability
        try:
            add_evt = {
                'type': 'ADD',
                'summary': content if len(content) < 500 else content[:500] + '...',
                'timestamp': ts,
                'importance_score': 0.5,
                'confidence': 0.5,
                'category': None,
                'provenance': {
                    'source': 'conversation_persistence',
                    'session_id': session_id,
                    'role': role
                }
            }
            data['memory_events'].append(add_evt)
        except Exception:
            # best-effort; don't abort the loop
            pass

    # Update message count for backup tracking
    _backup_state.messages_since_backup += len(messages)
    
    # If backup was created, reset the counter (already done in _make_backup)
    # If no backup was created, just save the updated state
    if not backup_created:
        save_backup_state()

    # write back
    tmp = memory_path + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    os.replace(tmp, memory_path)


def append_single_message(role: str, content: str, session_id: str = None, timestamp: str = None, memory_path: str = DEFAULT_MEMORY_PATH) -> None:
    append_conversation_messages([
        {
            'role': role,
            'content': content,
            'session_id': session_id,
            'timestamp': timestamp or datetime.now(timezone.utc).isoformat()
        }
    ], memory_path=memory_path)


def configure_backup_strategy(strategy: str, **kwargs) -> None:
    """Configure backup strategy and parameters.
    
    Args:
        strategy: One of 'time_based', 'count_based', 'session_based', 'hybrid'
        **kwargs: Additional parameters based on strategy:
            - time_interval_minutes: For time-based and hybrid strategies
            - message_count_threshold: For count-based and hybrid strategies
            - max_backup_files: Maximum number of backup files to keep
            - cleanup_days: Number of days to keep backups
    """
    global _backup_config
    try:
        strategy_enum = BackupStrategy(strategy)
        _backup_config = BackupConfig(
            strategy=strategy_enum,
            time_interval_minutes=kwargs.get('time_interval_minutes', 30),
            message_count_threshold=kwargs.get('message_count_threshold', 20),
            max_backup_files=kwargs.get('max_backup_files', 10),
            cleanup_days=kwargs.get('cleanup_days', 7)
        )
        save_backup_state()
    except ValueError:
        raise ValueError(f"Invalid strategy: {strategy}. Must be one of {[s.value for s in BackupStrategy]}")


def get_backup_status() -> Dict[str, Any]:
    """Get current backup system status."""
    return {
        'strategy': _backup_config.strategy.value,
        'time_interval_minutes': int(_backup_config.time_interval.total_seconds() / 60),
        'message_count_threshold': _backup_config.message_count_threshold,
        'max_backup_files': _backup_config.max_backup_files,
        'cleanup_days': _backup_config.cleanup_days,
        'last_backup_time': _backup_state.last_backup_time.isoformat() if _backup_state.last_backup_time else None,
        'messages_since_backup': _backup_state.messages_since_backup,
        'current_session_active': _backup_state.current_session_active,
        'should_backup_now': should_backup()
    }


def force_backup(memory_path: str = DEFAULT_MEMORY_PATH) -> None:
    """Force an immediate backup regardless of strategy."""
    _make_backup(memory_path)


def reset_backup_state() -> None:
    """Reset backup state tracking."""
    global _backup_state
    _backup_state = BackupState()
    save_backup_state()
